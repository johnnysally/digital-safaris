import crypto from "crypto";
import mongoose from "mongoose";
import Trip from "../../models/trans/Trip.js";
import Vehicle from "../../models/trans/Vehicle.js";
import TransportPartner from "../../models/trans/TransportPartner.js";
import TransportWallet from "../../models/trans/TransportWallet.js";
import DriverLocation from "../../models/trans/DriverLocation.js";
import TripQuote from "../../models/customer/TripQuote.js";
import CustomerWallet from "../../models/customer/CustomerWallet.js";
import CustomerPayment from "../../models/customer/CustomerPayment.js";
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
import calculateDistance from "../../utils/calculateDistance.js";

const sendEmail = (fn, ...args) => {
  Promise.resolve()
    .then(() => fn(...args))
    .catch((err) => logger.error("[email] fire-and-forget failed", { error: err.message }));
};

const sendSms = (fn, ...args) => {
  Promise.resolve()
    .then(() => fn(...args))
    .catch((err) => logger.error("[sms] fire-and-forget failed", { error: err.message }));
};

const getContext = async () => {
  const branding = (await Branding.findOne().lean()) || {};
  const general = await SystemSetting.findOne({ key: "general" }).lean();
  const commission = await SystemSetting.findOne({ key: "commission" }).lean();
  return {
    branding,
    settings: general?.value || {},
    commission: commission?.value || { transport: 10 },
  };
};

const estimateFare = (distanceKm, serviceType) => {
  const base = serviceType === "bike" ? 50 : serviceType === "car" ? 150 : 200;
  const perKm = serviceType === "bike" ? 30 : 60;
  return Math.round(base + perKm * distanceKm);
};

const quote = asyncHandler(async (req, res) => {
  const { pickup, dropoff, serviceType = "car" } = req.body;

  if (!pickup?.latitude || !dropoff?.latitude) {
    throw new ApiError(400, "Pickup and dropoff coordinates required");
  }

  const distanceKm = calculateDistance(
    pickup.latitude,
    pickup.longitude,
    dropoff.latitude,
    dropoff.longitude
  );

  const fare = estimateFare(distanceKm, serviceType);
  const { commission } = await getContext();
  const commissionRate = commission.transport || 10;
  const commissionAmount = (fare * commissionRate) / 100;

  const quoteDoc = await TripQuote.create({
    quoteId: crypto.randomBytes(12).toString("hex"),
    customer: req.customer._id,
    pickup,
    dropoff,
    serviceType,
    distanceKm: Number(distanceKm.toFixed(2)),
    fare,
    currency: "KES",
    commissionRate,
    commissionAmount,
    partnerEarnings: fare - commissionAmount,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000),
  });

  res.status(200).json(
    new ApiResponse(
      200,
      {
        quoteId: quoteDoc.quoteId,
        expiresAt: quoteDoc.expiresAt,
        distanceKm: quoteDoc.distanceKm,
        fare,
        currency: "KES",
        commissionRate,
        commissionAmount,
        partnerEarnings: fare - commissionAmount,
      },
      "Quote created"
    )
  );
});

const create = asyncHandler(async (req, res) => {
  const {
    quoteId,
    paymentReference,
    scheduledAt,
    passengers,
    luggage,
    notes,
  } = req.body;

  if (!quoteId) throw new ApiError(400, "quoteId required");
  if (!paymentReference) throw new ApiError(400, "paymentReference required");

  const quote = await TripQuote.findOne({
    quoteId,
    customer: req.customer._id,
    consumed: false,
  });
  if (!quote) throw new ApiError(400, "Invalid or consumed quote");
  if (quote.expiresAt < new Date()) throw new ApiError(400, "Quote expired");

  const payment = await CustomerPayment.findOne({
    reference: paymentReference,
    customer: req.customer._id,
    purpose: "transport",
    status: "success",
  });
  if (!payment) throw new ApiError(400, "Payment not found or not successful");
  if (payment.amount < quote.fare) {
    throw new ApiError(400, "Payment amount does not cover the trip fare");
  }

  const existing = await Trip.findOne({ paymentReference });
  if (existing) {
    return res
      .status(200)
      .json(new ApiResponse(200, existing, "Trip already created"));
  }

  const available = await DriverLocation.find({
    isOnline: true,
    isAvailable: true,
    town: new RegExp(quote.pickup.town, "i"),
  }).populate("partner");

  const nearby = available.filter((d) => {
    const dist = calculateDistance(
      quote.pickup.latitude,
      quote.pickup.longitude,
      d.latitude,
      d.longitude
    );
    return dist <= 10;
  });

  const matched = nearby.filter((d) =>
    d.partner?.serviceTypes?.includes(quote.serviceType)
  );

  if (matched.length === 0) {
    await refundPayment(payment, req.customer._id, "No drivers available at booking time");
    throw new ApiError(400, `No ${quote.serviceType} drivers available right now`);
  }

  const driver = matched[0];
  const vehicle = await Vehicle.findOne({
    partner: driver.partner._id,
    status: "active",
  });

  if (!vehicle) {
    await refundPayment(payment, req.customer._id, "Driver has no active vehicle");
    throw new ApiError(400, "Driver has no active vehicle");
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  let trip;
  try {
    trip = await Trip.create(
      [
        {
          reference: generateRef("TRP"),
          customer: req.customer._id,
          partner: driver.partner._id,
          vehicle: vehicle._id,
          type: "local",
          pickup: quote.pickup,
          dropoff: quote.dropoff,
          scheduledAt,
          passengers: passengers || 1,
          luggage: luggage || 0,
          distanceKm: quote.distanceKm,
          fare: quote.fare,
          commissionRate: quote.commissionRate,
          commissionAmount: quote.commissionAmount,
          partnerEarnings: quote.partnerEarnings,
          paymentMethod: payment.method,
          paymentReference,
          paymentStatus: "paid",
          status: "accepted",
          notes: notes || null,
          startedAt: null,
        },
      ],
      { session }
    ).then((docs) => docs[0]);

    await Commission.create(
      [
        {
          type: "transport",
          rate: quote.commissionRate,
          partner: driver.partner._id,
          partnerType: "transport",
          order: trip._id,
          amount: quote.fare,
          commissionAmount: quote.commissionAmount,
          status: "owed",
        },
      ],
      { session }
    );

    await TransportWallet.findOneAndUpdate(
      { partner: driver.partner._id },
      {
        $inc: {
          balance: quote.partnerEarnings,
          totalEarned: quote.partnerEarnings,
          totalCommissionOwed: quote.commissionAmount,
        },
      },
      { upsert: true, session }
    );

    driver.isAvailable = false;
    driver.activeTrip = trip._id;
    await driver.save({ session });

    payment.relatedId = trip._id;
    await payment.save({ session });

    quote.consumed = true;
    await quote.save({ session });

    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    await refundPayment(payment, req.customer._id, err.message);
    throw err;
  } finally {
    await session.endSession();
  }

  const { branding, settings } = await getContext();

  socketService.emitToTransport(driver.partner._id.toString(), "trip:new", {
    reference: trip.reference,
    pickup: trip.pickup.address,
    dropoff: trip.dropoff.address,
  });

  sendEmail(emailService.tripBookingConfirmation, req.customer, {
    trip,
    branding,
    settings,
  });
  sendEmail(emailService.driverAssigned, req.customer, {
    trip,
    driver: driver.partner,
    vehicle,
    branding,
    settings,
  });
  sendSms(smsService.tripBookingConfirmation, req.customer, {
    reference: trip.reference,
    pickup: trip.pickup.address,
    scheduledAt: trip.scheduledAt
      ? new Date(trip.scheduledAt).toLocaleString()
      : "ASAP",
  });

  res.status(201).json(new ApiResponse(201, trip, "Trip confirmed"));
});

async function refundPayment(payment, customerId, reason) {
  try {
    if (payment.method === "wallet") {
      const wallet = await CustomerWallet.findOne({ customer: customerId });
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
        refundReason: reason,
      };
      await payment.save();
      logger.warn("[trip.refund] wallet refund issued", {
        reference: payment.reference,
        amount: payment.amount,
      });
    } else {
      payment.meta = {
        ...(payment.meta || {}),
        refundPending: true,
        refundReason: reason,
      };
      await payment.save();
      logger.error("[trip.refund] manual refund required", {
        reference: payment.reference,
        method: payment.method,
        amount: payment.amount,
      });
    }
  } catch (refundErr) {
    logger.error("[trip.refund] refund failed", {
      reference: payment.reference,
      error: refundErr.message,
    });
  }
}

const list = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const filter = { customer: req.customer._id };
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    Trip.find(filter)
      .populate("partner", "firstName lastName phone avatar rating")
      .populate("vehicle", "make model plateNumber color")
      .sort({ scheduledAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Trip.countDocuments(filter),
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
  const trip = await Trip.findOne({
    _id: req.params.id,
    customer: req.customer._id,
  })
    .populate("partner", "firstName lastName phone avatar rating")
    .populate("vehicle", "make model plateNumber color photos")
    .lean();
  if (!trip) throw new ApiError(404, "Trip not found");
  res.status(200).json(new ApiResponse(200, trip));
});

const cancel = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  const trip = await Trip.findOne({
    _id: req.params.id,
    customer: req.customer._id,
  });
  if (!trip) throw new ApiError(404, "Trip not found");
  if (["completed", "cancelled", "ongoing"].includes(trip.status)) {
    throw new ApiError(400, "Cannot cancel");
  }

  trip.status = "cancelled";
  trip.cancelledAt = new Date();
  trip.cancelledBy = "customer";
  trip.cancellationReason = reason || "Customer requested";
  await trip.save();

  await DriverLocation.updateOne(
    { partner: trip.partner, activeTrip: trip._id },
    { $set: { isAvailable: true, activeTrip: null } }
  );

  if (trip.paymentStatus === "paid" && trip.paymentReference) {
    const payment = await CustomerPayment.findOne({
      reference: trip.paymentReference,
      customer: req.customer._id,
      status: "success",
    });
    if (payment) {
      await refundPayment(payment, req.customer._id, "Trip cancelled by customer");
      if (payment.method === "wallet") {
        trip.paymentStatus = "refunded";
        await trip.save();
        await Commission.findOneAndUpdate(
          { order: trip._id },
          { status: "refunded" }
        );
        await TransportWallet.findOneAndUpdate(
          { partner: trip.partner },
          {
            $inc: {
              balance: -(trip.partnerEarnings || 0),
              totalEarned: -(trip.partnerEarnings || 0),
              totalCommissionOwed: -(trip.commissionAmount || 0),
            },
          }
        );
      }
    }
  }

  socketService.emitToTransport(trip.partner.toString(), "trip:cancelled", {
    reference: trip.reference,
  });

  const { branding, settings } = await getContext();
  sendEmail(emailService.tripCancelled, req.customer, {
    trip,
    reason,
    branding,
    settings,
  });
  sendSms(smsService.tripCancelled, req.customer, {
    reference: trip.reference,
    reason,
  });

  res.status(200).json(new ApiResponse(200, trip, "Trip cancelled"));
});

const rate = asyncHandler(async (req, res) => {
  const { rating, review } = req.body;

  const trip = await Trip.findOne({
    _id: req.params.id,
    customer: req.customer._id,
  });
  if (!trip) throw new ApiError(404, "Trip not found");
  if (trip.status !== "completed") throw new ApiError(400, "Trip not completed");

  trip.rating = rating;
  trip.review = review || null;
  await trip.save();

  const partner = await TransportPartner.findById(trip.partner);
  if (partner) {
    const totalRatings = partner.totalRatings + 1;
    const newRating =
      (partner.rating * partner.totalRatings + rating) / totalRatings;
    partner.rating = Number(newRating.toFixed(2));
    partner.totalRatings = totalRatings;
    await partner.save();
  }

  res.status(200).json(new ApiResponse(200, trip, "Rating submitted"));
});

export { quote, create, list, details, cancel, rate };