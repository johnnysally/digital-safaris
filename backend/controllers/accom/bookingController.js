import Booking from "../../models/accom/Booking.js";
import Guest from "../../models/accom/Guest.js";
import RoomUnit from "../../models/accom/RoomUnit.js";
import AccommodationPartner from "../../models/accom/AccommodationPartner.js";
import Branding from "../../models/admin/Branding.js";
import SystemSetting from "../../models/admin/SystemSetting.js";
import ApiError from "../../utils/apiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";
import logger from "../../utils/logger.js";
import * as emailService from "../../services/emailService.js";
import * as smsService from "../../services/smsService.js";
import * as socketService from "../../services/socketService.js";

const getContext = async () => {
  const branding = (await Branding.findOne().lean()) || {};
  const general = await SystemSetting.findOne({ key: "general" }).lean();
  return { branding, settings: general?.value || {} };
};

const sendEmail = (fn, ...args) => {
  Promise.resolve()
    .then(() => fn(...args))
    .catch((err) =>
      logger.error("[email] fire-and-forget failed", { error: err.message })
    );
};

const sendSms = (fn, ...args) => {
  Promise.resolve()
    .then(() => fn(...args))
    .catch((err) =>
      logger.error("[sms] fire-and-forget failed", { error: err.message })
    );
};

const list = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const filter = { partner: req.partner._id };
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    Booking.find(filter)
      .populate("customer", "firstName lastName phone email")
      .populate("property", "name town address")
      .populate("room", "name type basePrice")
      .populate("roomUnit", "number floor")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Booking.countDocuments(filter),
  ]);

  res.status(200).json(
    new ApiResponse(200, {
      items,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.max(1, Math.ceil(total / Number(limit))),
    })
  );
});

const details = asyncHandler(async (req, res) => {
  const booking = await Booking.findOne({
    _id: req.params.id,
    partner: req.partner._id,
  })
    .populate("customer", "firstName lastName phone email avatar")
    .populate("property", "name town address images")
    .populate("room", "name type basePrice images")
    .populate("roomUnit", "number floor")
    .lean();

  if (!booking) throw new ApiError(404, "Booking not found");

  const guestRecords = await Guest.find({ booking: booking._id }).lean();

  res.status(200).json(
    new ApiResponse(
      200,
      {
        ...booking,
        propertyName: booking.property?.name || null,
        roomName: booking.room?.name || null,
        guestRecords,
      },
      "Booking fetched"
    )
  );
});

const confirm = asyncHandler(async (req, res) => {
  const booking = await Booking.findOne({
    _id: req.params.id,
    partner: req.partner._id,
  })
    .populate("customer")
    .populate("property");

  if (!booking) throw new ApiError(404, "Booking not found");
  if (booking.status !== "pending") {
    throw new ApiError(400, "Booking cannot be confirmed");
  }

  booking.status = "confirmed";
  booking.confirmedAt = new Date();
  await booking.save();

  if (booking.customer) {
    const { branding, settings } = await getContext();
    sendEmail(emailService.bookingConfirmation, booking.customer, {
      booking,
      property: booking.property,
      branding,
      settings,
    });
    sendSms(smsService.bookingConfirmation, booking.customer, {
      reference: booking.reference,
      checkIn: new Date(booking.checkIn).toDateString(),
    });
  }

  socketService.emitToCustomer(
    booking.customer._id.toString(),
    "booking:confirmed",
    { reference: booking.reference }
  );

  res.status(200).json(new ApiResponse(200, booking, "Booking confirmed"));
});

const reject = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  const booking = await Booking.findOne({
    _id: req.params.id,
    partner: req.partner._id,
  }).populate("customer");

  if (!booking) throw new ApiError(404, "Booking not found");
  if (booking.status !== "pending") {
    throw new ApiError(400, "Booking cannot be rejected");
  }

  booking.status = "cancelled";
  booking.cancelledAt = new Date();
  booking.cancelledBy = "partner";
  booking.cancellationReason = reason || "Partner rejected";
  await booking.save();

  if (booking.customer) {
    const { branding, settings } = await getContext();
    sendEmail(emailService.bookingCancelled, booking.customer, {
      booking,
      reason: booking.cancellationReason,
      branding,
      settings,
    });
    sendSms(smsService.bookingCancelled, booking.customer, {
      reference: booking.reference,
      reason: booking.cancellationReason,
    });
  }

  socketService.emitToCustomer(
    booking.customer._id.toString(),
    "booking:cancelled",
    { reference: booking.reference }
  );

  res.status(200).json(new ApiResponse(200, booking, "Booking rejected"));
});

const checkIn = asyncHandler(async (req, res) => {
  const booking = await Booking.findOne({
    _id: req.params.id,
    partner: req.partner._id,
  })
    .populate("customer")
    .populate("property");

  if (!booking) throw new ApiError(404, "Booking not found");
  if (booking.status !== "confirmed") {
    throw new ApiError(400, "Booking cannot be checked in");
  }

  booking.status = "checked_in";
  booking.checkedInAt = new Date();
  await booking.save();

  if (booking.customer) {
    const { branding, settings } = await getContext();
    sendEmail(emailService.checkInConfirmation, booking.customer, {
      booking,
      property: booking.property,
      branding,
      settings,
    });
    sendSms(smsService.checkInConfirmation, booking.customer, {
      property: booking.property?.name || "your stay",
    });
  }

  socketService.emitToCustomer(
    booking.customer._id.toString(),
    "booking:checked_in",
    { reference: booking.reference }
  );

  res.status(200).json(new ApiResponse(200, booking, "Checked in"));
});

const checkOut = asyncHandler(async (req, res) => {
  const booking = await Booking.findOne({
    _id: req.params.id,
    partner: req.partner._id,
  })
    .populate("customer")
    .populate("property");

  if (!booking) throw new ApiError(404, "Booking not found");
  if (booking.status !== "checked_in") {
    throw new ApiError(400, "Booking cannot be checked out");
  }

  booking.status = "checked_out";
  booking.checkedOutAt = new Date();
  await booking.save();

  if (booking.customer) {
    const { branding, settings } = await getContext();
    sendEmail(emailService.checkOutConfirmation, booking.customer, {
      booking,
      property: booking.property,
      branding,
      settings,
    });
    sendSms(smsService.checkOutConfirmation, booking.customer, {
      property: booking.property?.name || "your stay",
    });
  }

  socketService.emitToCustomer(
    booking.customer._id.toString(),
    "booking:checked_out",
    { reference: booking.reference }
  );

  res.status(200).json(new ApiResponse(200, booking, "Checked out"));
});

const markNoShow = asyncHandler(async (req, res) => {
  const booking = await Booking.findOne({
    _id: req.params.id,
    partner: req.partner._id,
  });

  if (!booking) throw new ApiError(404, "Booking not found");
  if (booking.status !== "confirmed") {
    throw new ApiError(400, "Booking cannot be marked no-show");
  }

  booking.status = "no_show";
  await booking.save();

  res.status(200).json(new ApiResponse(200, booking, "Marked no-show"));
});

const availableUnits = asyncHandler(async (req, res) => {
  const booking = await Booking.findOne({
    _id: req.params.id,
    partner: req.partner._id,
  }).lean();
  if (!booking) throw new ApiError(404, "Booking not found");

  if (!["pending", "confirmed", "checked_in"].includes(booking.status)) {
    throw new ApiError(400, "Cannot assign rooms for this booking status");
  }

  const conflictingUnitIds = await Booking.distinct("roomUnit", {
    _id: { $ne: booking._id },
    room: booking.room,
    roomUnit: { $ne: null },
    status: { $in: ["confirmed", "checked_in"] },
    checkIn: { $lt: booking.checkOut },
    checkOut: { $gt: booking.checkIn },
  });

  const units = await RoomUnit.find({
    roomType: booking.room,
    status: "active",
    isDeleted: false,
    _id: { $nin: conflictingUnitIds },
  })
    .sort({ number: 1 })
    .lean();

  res.status(200).json(
    new ApiResponse(
      200,
      units.map((u) => ({
        _id: u._id,
        number: u.number,
        floor: u.floor,
        status: u.status,
        isCurrent: String(u._id) === String(booking.roomUnit),
      }))
    )
  );
});

const assignRoom = asyncHandler(async (req, res) => {
  const { roomUnitId } = req.body;
  if (!roomUnitId) throw new ApiError(400, "roomUnitId required");

  const booking = await Booking.findOne({
    _id: req.params.id,
    partner: req.partner._id,
  })
    .populate("customer")
    .populate("property")
    .populate("room");
  if (!booking) throw new ApiError(404, "Booking not found");

  if (!["pending", "confirmed", "checked_in"].includes(booking.status)) {
    throw new ApiError(400, "Cannot assign rooms for this booking status");
  }

  const unit = await RoomUnit.findOne({
    _id: roomUnitId,
    roomType: booking.room._id,
    status: "active",
    isDeleted: false,
  });
  if (!unit) throw new ApiError(404, "Room unit not available");

  const conflict = await Booking.findOne({
    _id: { $ne: booking._id },
    roomUnit: unit._id,
    status: { $in: ["confirmed", "checked_in"] },
    checkIn: { $lt: booking.checkOut },
    checkOut: { $gt: booking.checkIn },
  });
  if (conflict) {
    throw new ApiError(400, "This room is already booked for those dates");
  }

  booking.roomUnit = unit._id;
  await booking.save();

  if (booking.customer) {
    const { branding, settings } = await getContext();
    sendEmail(emailService.roomAssigned, booking.customer, {
      booking,
      property: booking.property,
      roomNumber: unit.number,
      floor: unit.floor,
      branding,
      settings,
    });
    sendSms(smsService.roomAssigned, booking.customer, {
      reference: booking.reference,
      roomNumber: unit.number,
    });

    socketService.emitToCustomer(
      booking.customer._id.toString(),
      "booking:room_assigned",
      { reference: booking.reference, roomNumber: unit.number }
    );
  }

  res.status(200).json(
    new ApiResponse(
      200,
      {
        bookingId: booking._id,
        roomUnitId: unit._id,
        roomNumber: unit.number,
        floor: unit.floor,
      },
      "Room assigned"
    )
  );
});

const unassignRoom = asyncHandler(async (req, res) => {
  const booking = await Booking.findOne({
    _id: req.params.id,
    partner: req.partner._id,
  });
  if (!booking) throw new ApiError(404, "Booking not found");
  if (booking.status === "checked_in") {
    throw new ApiError(400, "Cannot unassign room after check-in");
  }

  booking.roomUnit = null;
  await booking.save();

  res.status(200).json(new ApiResponse(200, null, "Room unassigned"));
});

export {
  list,
  details,
  confirm,
  reject,
  checkIn,
  checkOut,
  markNoShow,
  availableUnits,
  assignRoom,
  unassignRoom,
};