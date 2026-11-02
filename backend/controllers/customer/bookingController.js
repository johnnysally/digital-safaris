import crypto from "crypto";
import mongoose from "mongoose";
import Booking from "../../models/accom/Booking.js";
import Room from "../../models/accom/Room.js";
import Property from "../../models/accom/Property.js";
import RoomAvailability from "../../models/accom/RoomAvailability.js";
import AccommodationPartner from "../../models/accom/AccommodationPartner.js";
import AccommodationWallet from "../../models/accom/AccommodationWallet.js";
import BookingQuote from "../../models/customer/BookingQuote.js";
import CustomerPayment from "../../models/customer/CustomerPayment.js";
import CustomerWallet from "../../models/customer/CustomerWallet.js";
import CustomerReview from "../../models/customer/CustomerReview.js";
import Commission from "../../models/admin/Commission.js";
import SystemSetting from "../../models/admin/SystemSetting.js";
import Branding from "../../models/admin/Branding.js";
import { generateRef } from "../../utils/helpers.js";
import ApiError from "../../utils/apiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";
import logger from "../../utils/logger.js";
import * as emailService from "../../services/emailService.js";
import * as smsService from "../../services/smsService.js";
import * as socketService from "../../services/socketService.js";

const toUTCDay = (value) => {
  const d = value instanceof Date ? value : new Date(value);
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  );
};

const buildStayDates = (checkIn, checkOut) => {
  const dates = [];
  const start = toUTCDay(checkIn);
  const end = toUTCDay(checkOut);
  for (let d = new Date(start); d < end; d.setUTCDate(d.getUTCDate() + 1)) {
    dates.push(new Date(d));
  }
  return dates;
};

const getContext = async () => {
  const branding = (await Branding.findOne().lean()) || {};
  const general = await SystemSetting.findOne({ key: "general" }).lean();
  const commission = await SystemSetting.findOne({ key: "commission" }).lean();
  return {
    branding,
    settings: general?.value || {},
    commission: commission?.value || { accommodation: 10 },
  };
};

const quote = asyncHandler(async (req, res) => {
  const { roomId, checkIn, checkOut, roomsBooked = 1, guests } = req.body;

  const room = await Room.findOne({ _id: roomId, status: "active" }).populate(
    "property"
  );
  if (!room) throw new ApiError(404, "Room not available");

  const inDate = toUTCDay(checkIn);
  const outDate = toUTCDay(checkOut);
  const nights = Math.ceil((outDate - inDate) / (1000 * 60 * 60 * 24));
  if (nights <= 0) throw new ApiError(400, "Invalid dates");

  if (roomsBooked > room.totalUnits) {
    throw new ApiError(
      400,
      `Only ${room.totalUnits} units available for this room`
    );
  }

  const dates = buildStayDates(inDate, outDate);

  const rows = await RoomAvailability.find({
    room: room._id,
    date: { $in: dates },
  }).lean();

  const shortNights = [];
  for (const date of dates) {
    const row = rows.find(
      (r) => toUTCDay(r.date).getTime() === date.getTime()
    );
    const available = row
      ? row.totalUnits - row.bookedUnits - (row.heldUnits ?? 0)
      : room.totalUnits;
    if (available < roomsBooked) {
      shortNights.push(date.toISOString().slice(0, 10));
    }
  }
  if (shortNights.length > 0) {
    throw new ApiError(
      400,
      `Only limited rooms available on: ${shortNights.join(", ")}`
    );
  }

  const pricePerNight = room.basePrice;
  const subtotal = pricePerNight * nights * roomsBooked;
  const { commission } = await getContext();
  const commissionRate = commission.accommodation || 10;
  const commissionAmount = (subtotal * commissionRate) / 100;

  const quoteDoc = await BookingQuote.create({
    quoteId: crypto.randomBytes(12).toString("hex"),
    customer: req.customer._id,
    room: room._id,
    property: room.property._id,
    partner: room.partner,
    checkIn: inDate,
    checkOut: outDate,
    nights,
    roomsBooked,
    guests: {
      adults: Number(guests?.adults) || 1,
      children: Number(guests?.children) || 0,
    },
    pricePerNight,
    subtotal,
    total: subtotal,
    currency: room.currency || "KES",
    commissionRate,
    commissionAmount,
    partnerEarnings: subtotal - commissionAmount,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000),
  });

  res.status(200).json(
    new ApiResponse(
      200,
      {
        quoteId: quoteDoc.quoteId,
        expiresAt: quoteDoc.expiresAt,
        roomId: room._id,
        roomName: room.name,
        propertyName: room.property?.name || null,
        checkIn: quoteDoc.checkIn,
        checkOut: quoteDoc.checkOut,
        nights,
        roomsBooked,
        guests: quoteDoc.guests,
        pricePerNight,
        subtotal,
        total: subtotal,
        currency: quoteDoc.currency,
      },
      "Quote created"
    )
  );
});

const create = asyncHandler(async (req, res) => {
  const { quoteId, paymentReference, specialRequests } = req.body;

  if (!quoteId) throw new ApiError(400, "quoteId required");
  if (!paymentReference) throw new ApiError(400, "paymentReference required");

  const quote = await BookingQuote.findOne({
    quoteId,
    customer: req.customer._id,
    consumed: false,
  });
  if (!quote) throw new ApiError(400, "Invalid or consumed quote");
  if (quote.expiresAt < new Date()) throw new ApiError(400, "Quote expired");

  const payment = await CustomerPayment.findOne({
    reference: paymentReference,
    customer: req.customer._id,
    purpose: "booking",
    status: "success",
  });
  if (!payment) throw new ApiError(400, "Payment not found or not successful");
  if (payment.amount < quote.total) {
    throw new ApiError(400, "Payment amount does not cover the booking total");
  }

  const existing = await Booking.findOne({ paymentReference });
  if (existing) {
    return res
      .status(200)
      .json(new ApiResponse(200, existing, "Booking already created"));
  }

  const roomDoc = await Room.findById(quote.room).select("totalUnits").lean();
  if (!roomDoc) throw new ApiError(404, "Room not found");
  const roomTotalUnits = roomDoc.totalUnits || quote.roomsBooked;

  const dates = buildStayDates(quote.checkIn, quote.checkOut);
  if (dates.length === 0) throw new ApiError(400, "Invalid stay dates");

  const session = await mongoose.startSession();
  session.startTransaction();

  let booking;
  try {
    const availabilityRows = await RoomAvailability.find({
      room: quote.room,
      date: { $in: dates },
    })
      .session(session)
      .lean();

    const shortNights = [];
    for (const date of dates) {
      const row = availabilityRows.find(
        (r) => toUTCDay(r.date).getTime() === date.getTime()
      );
      const available = row
        ? row.totalUnits - row.bookedUnits - (row.heldUnits ?? 0)
        : roomTotalUnits;
      if (available < quote.roomsBooked) {
        shortNights.push(date.toISOString().slice(0, 10));
      }
    }

    if (shortNights.length > 0) {
      throw new ApiError(
        400,
        `No room available on: ${shortNights.join(", ")}`
      );
    }

    for (const date of dates) {
      const existingRow = await RoomAvailability.findOne({
        room: quote.room,
        date,
      }).session(session);

      if (existingRow) {
        existingRow.bookedUnits += quote.roomsBooked;
        existingRow.availableUnits = Math.max(
          0,
          existingRow.totalUnits - existingRow.bookedUnits
        );
        await existingRow.save({ session });
      } else {
        await RoomAvailability.create(
          [
            {
              partner: quote.partner,
              property: quote.property,
              room: quote.room,
              date,
              totalUnits: roomTotalUnits,
              bookedUnits: quote.roomsBooked,
              availableUnits: Math.max(0, roomTotalUnits - quote.roomsBooked),
              price: quote.pricePerNight,
              currency: quote.currency,
              isBlocked: false,
            },
          ],
          { session }
        );
      }
    }

    booking = await Booking.create(
      [
        {
          reference: generateRef("BKG"),
          customer: req.customer._id,
          partner: quote.partner,
          property: quote.property,
          room: quote.room,
          roomUnit: null,
          checkIn: quote.checkIn,
          checkOut: quote.checkOut,
          nights: quote.nights,
          guests: quote.guests,
          roomsBooked: quote.roomsBooked,
          pricePerNight: quote.pricePerNight,
          subtotal: quote.subtotal,
          total: quote.total,
          currency: quote.currency,
          commissionRate: quote.commissionRate,
          commissionAmount: quote.commissionAmount,
          partnerEarnings: quote.partnerEarnings,
          paymentMethod: payment.method,
          paymentReference,
          paymentStatus: "paid",
          status: "confirmed",
          confirmedAt: new Date(),
          specialRequests: specialRequests || null,
          qrCode: generateRef("QR"),
        },
      ],
      { session }
    ).then((docs) => docs[0]);

    await Commission.create(
      [
        {
          type: "accommodation",
          rate: quote.commissionRate,
          partner: quote.partner,
          partnerType: "accommodation",
          order: booking._id,
          amount: quote.total,
          commissionAmount: quote.commissionAmount,
          status: "owed",
        },
      ],
      { session }
    );

    await AccommodationWallet.findOneAndUpdate(
      { partner: quote.partner },
      {
        $inc: {
          balance: quote.partnerEarnings,
          totalEarned: quote.partnerEarnings,
          totalCommissionOwed: quote.commissionAmount,
        },
      },
      { upsert: true, session }
    );

    payment.relatedId = booking._id;
    await payment.save({ session });

    quote.consumed = true;
    await quote.save({ session });

    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();

    try {
      if (payment.method === "wallet") {
        const wallet = await CustomerWallet.findOne({
          customer: req.customer._id,
        });
        if (wallet) {
          wallet.balance += payment.amount;
          wallet.totalDebited = Math.max(
            0,
            wallet.totalDebited - payment.amount
          );
          await wallet.save();
        }
        payment.status = "refunded";
        payment.meta = {
          ...(payment.meta || {}),
          refundedAt: new Date().toISOString(),
          refundReason: err.message,
        };
        await payment.save();
        logger.warn("[booking.refund] wallet refund issued", {
          reference: payment.reference,
          amount: payment.amount,
        });
      } else {
        payment.meta = {
          ...(payment.meta || {}),
          refundPending: true,
          refundReason: err.message,
        };
        await payment.save();
        logger.error("[booking.refund] manual refund required", {
          reference: payment.reference,
          method: payment.method,
          amount: payment.amount,
        });
      }
    } catch (refundErr) {
      logger.error("[booking.refund] refund failed", {
        reference: payment.reference,
        error: refundErr.message,
      });
    }

    throw err;
  } finally {
    await session.endSession();
  }

  const { branding, settings } = await getContext();
  const property = await Property.findById(quote.property).lean();

  try {
    await emailService.bookingConfirmation(req.customer, {
      booking,
      property,
      branding,
      settings,
    });
  } catch (err) {
    logger.error("Booking confirmation email failed", { error: err.message });
  }

  try {
    await smsService.bookingConfirmation(req.customer, {
      reference: booking.reference,
      checkIn: new Date(booking.checkIn).toDateString(),
    });
  } catch (err) {
    logger.error("Booking confirmation SMS failed", { error: err.message });
  }

  try {
    const partner = await AccommodationPartner.findById(quote.partner)
      .select("name firstName lastName email phone town")
      .lean();

    if (partner?.email) {
      await emailService.newBookingReceived(partner, {
        booking,
        property,
        customer: req.customer,
        branding,
        settings,
      });
    }

    if (partner?.phone) {
      await smsService.newBookingReceived(partner, {
        reference: booking.reference,
        guestName: `${req.customer.firstName} ${req.customer.lastName}`,
        checkIn: new Date(booking.checkIn).toDateString(),
      });
    }

    if (partner?._id) {
      try {
        socketService.emitToAccommodation(
          partner._id.toString(),
          "booking:new",
          {
            reference: booking.reference,
            total: booking.total,
            checkIn: booking.checkIn,
            checkOut: booking.checkOut,
          }
        );
      } catch {
        /* socket optional */
      }
    }
  } catch (err) {
    logger.error("Partner booking notification failed", {
      error: err.message,
    });
  }

  res.status(201).json(new ApiResponse(201, booking, "Booking created"));
});

const list = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const filter = { customer: req.customer._id };
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    Booking.find(filter)
      .populate("property", "name images town address")
      .populate("room", "name type basePrice images")
      .populate("roomUnit", "number floor")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Booking.countDocuments(filter),
  ]);

  const bookingIds = items.map((b) => b._id);
  const reviewed = bookingIds.length
    ? await CustomerReview.find({
        customer: req.customer._id,
        booking: { $in: bookingIds },
      })
        .select("booking rating")
        .lean()
    : [];
  const reviewMap = new Map(
    reviewed.map((r) => [String(r.booking), r])
  );

  const enriched = items.map((b) => {
    const review = reviewMap.get(String(b._id));
    return {
      ...b,
      hasReview: Boolean(review),
      review: review ? { _id: review._id, rating: review.rating } : null,
    };
  });

  res.status(200).json(
    new ApiResponse(200, {
      items: enriched,
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
    customer: req.customer._id,
  })
    .populate("property", "name images town address latitude longitude")
    .populate("room", "name type basePrice images capacity beds")
    .populate("roomUnit", "number floor")
    .populate("partner", "name email phone town")
    .lean();

  if (!booking) throw new ApiError(404, "Booking not found");

  const review = await CustomerReview.findOne({
    customer: req.customer._id,
    booking: booking._id,
  })
    .select("_id rating")
    .lean();

  res.status(200).json(
    new ApiResponse(
      200,
      {
        ...booking,
        propertyName: booking.property?.name || null,
        roomName: booking.room?.name || null,
        review: review || null,
        hasReview: Boolean(review),
      },
      "Booking fetched"
    )
  );
});

const cancel = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  const booking = await Booking.findOne({
    _id: req.params.id,
    customer: req.customer._id,
  });
  if (!booking) throw new ApiError(404, "Booking not found");
  if (["cancelled", "checked_out"].includes(booking.status)) {
    throw new ApiError(400, "Cannot cancel");
  }

  booking.status = "cancelled";
  booking.cancelledAt = new Date();
  booking.cancelledBy = "customer";
  booking.cancellationReason = reason || "Customer requested";
  await booking.save();

  const dates = buildStayDates(booking.checkIn, booking.checkOut);

  for (const date of dates) {
    const row = await RoomAvailability.findOne({
      room: booking.room,
      date,
    });
    if (row) {
      row.bookedUnits = Math.max(0, row.bookedUnits - booking.roomsBooked);
      row.availableUnits = row.totalUnits - row.bookedUnits;
      await row.save();
    }
  }

  const { branding, settings } = await getContext();
  try {
    await emailService.bookingCancelled(req.customer, {
      booking,
      reason,
      branding,
      settings,
    });
  } catch (err) {
    logger.error("Booking cancellation email failed", { error: err.message });
  }
  try {
    await smsService.bookingCancelled(req.customer, {
      reference: booking.reference,
      reason,
    });
  } catch (err) {
    logger.error("Booking cancellation SMS failed", { error: err.message });
  }

  res.status(200).json(new ApiResponse(200, booking, "Booking cancelled"));
});

const checkIn = asyncHandler(async (req, res) => {
  const booking = await Booking.findOne({
    _id: req.params.id,
    customer: req.customer._id,
  }).populate("property");
  if (!booking) throw new ApiError(404, "Booking not found");
  if (booking.status !== "confirmed") {
    throw new ApiError(400, "Booking not confirmed");
  }

  booking.status = "checked_in";
  booking.checkedInAt = new Date();
  await booking.save();

  const { branding, settings } = await getContext();
  try {
    await emailService.checkInConfirmation(req.customer, {
      booking,
      property: booking.property,
      branding,
      settings,
    });
    await smsService.checkInConfirmation(req.customer, {
      property: booking.property.name,
    });
  } catch (err) {
    logger.error("Check-in notification failed", { error: err.message });
  }

  res.status(200).json(new ApiResponse(200, booking, "Checked in"));
});

export { quote, create, list, details, cancel, checkIn };