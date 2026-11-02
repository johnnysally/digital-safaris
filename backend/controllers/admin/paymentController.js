import mongoose from "mongoose";
import CustomerPayment from "../../models/customer/CustomerPayment.js";
import Booking from "../../models/accom/Booking.js";
import FoodOrder from "../../models/rest/FoodOrder.js";
import Trip from "../../models/trans/Trip.js";
import AccommodationPartner from "../../models/accom/AccommodationPartner.js";
import RestaurantPartner from "../../models/rest/RestaurantPartner.js";
import TransportPartner from "../../models/trans/TransportPartner.js";
import ApiError from "../../utils/apiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";

const partnerLabel = (partner, type) => {
  if (!partner) return null;
  if (type === "transport") {
    return (
      `${partner.firstName || ""} ${partner.lastName || ""}`.trim() || null
    );
  }
  return partner.name || null;
};

async function resolvePartners(payments) {
  const bookingIds = payments
    .filter((p) => p.purpose === "booking" && p.relatedId)
    .map((p) => p.relatedId);

  const foodOrderIds = payments
    .filter((p) => p.purpose === "food_order" && p.relatedId)
    .map((p) => p.relatedId);

  const tripIds = payments
    .filter((p) => p.purpose === "transport" && p.relatedId)
    .map((p) => p.relatedId);

  const [bookings, foodOrders, trips] = await Promise.all([
    bookingIds.length
      ? Booking.find({ _id: { $in: bookingIds } })
          .select("partner")
          .lean()
      : [],
    foodOrderIds.length
      ? FoodOrder.find({ _id: { $in: foodOrderIds } })
          .select("restaurant")
          .lean()
      : [],
    tripIds.length
      ? Trip.find({ _id: { $in: tripIds } })
          .select("partner")
          .lean()
      : [],
  ]);

  const accomIds = bookings.map((b) => b.partner).filter(Boolean);
  const restIds = foodOrders.map((f) => f.restaurant).filter(Boolean);
  const transIds = trips.map((t) => t.partner).filter(Boolean);

  const [accomPartners, restPartners, transPartners] = await Promise.all([
    accomIds.length
      ? AccommodationPartner.find({ _id: { $in: accomIds } })
          .select("name")
          .lean()
      : [],
    restIds.length
      ? RestaurantPartner.find({ _id: { $in: restIds } })
          .select("name")
          .lean()
      : [],
    transIds.length
      ? TransportPartner.find({ _id: { $in: transIds } })
          .select("firstName lastName")
          .lean()
      : [],
  ]);

  const bookingMap = new Map(bookings.map((b) => [String(b._id), b.partner]));
  const foodOrderMap = new Map(
    foodOrders.map((f) => [String(f._id), f.restaurant])
  );
  const tripMap = new Map(trips.map((t) => [String(t._id), t.partner]));

  const accomMap = new Map(
    accomPartners.map((p) => [String(p._id), p])
  );
  const restMap = new Map(restPartners.map((p) => [String(p._id), p]));
  const transMap = new Map(
    transPartners.map((p) => [String(p._id), p])
  );

  return (payment) => {
    if (payment.purpose === "booking" && payment.relatedId) {
      const partnerId = bookingMap.get(String(payment.relatedId));
      const partner = partnerId ? accomMap.get(String(partnerId)) : null;
      return {
        partnerId: partnerId || null,
        partnerName: partnerLabel(partner, "accommodation"),
        partnerType: "accommodation",
      };
    }
    if (payment.purpose === "food_order" && payment.relatedId) {
      const partnerId = foodOrderMap.get(String(payment.relatedId));
      const partner = partnerId ? restMap.get(String(partnerId)) : null;
      return {
        partnerId: partnerId || null,
        partnerName: partnerLabel(partner, "restaurant"),
        partnerType: "restaurant",
      };
    }
    if (payment.purpose === "transport" && payment.relatedId) {
      const partnerId = tripMap.get(String(payment.relatedId));
      const partner = partnerId ? transMap.get(String(partnerId)) : null;
      return {
        partnerId: partnerId || null,
        partnerName: partnerLabel(partner, "transport"),
        partnerType: "transport",
      };
    }
    return { partnerId: null, partnerName: null, partnerType: null };
  };
}

const list = asyncHandler(async (req, res) => {
  const { status, method, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (method) filter.method = method;

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    CustomerPayment.find(filter)
      .populate("customer", "firstName lastName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    CustomerPayment.countDocuments(filter),
  ]);

  const resolve = await resolvePartners(items);

  const data = items.map((p) => {
    const partner = resolve(p);
    return {
      _id: p._id,
      reference: p.reference,
      customerId: p.customer?._id ?? null,
      customerName: p.customer
        ? `${p.customer.firstName} ${p.customer.lastName}`
        : "—",
      partnerId: partner.partnerId,
      partnerName: partner.partnerName || "—",
      partnerType: partner.partnerType,
      method: p.method,
      status: p.status,
      amount: p.amount,
      currency: p.currency ?? "KES",
      serviceType: p.purpose,
      relatedId: p.relatedId,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  });

  res.status(200).json(
    new ApiResponse(200, {
      items: data,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.max(1, Math.ceil(total / Number(limit))),
    })
  );
});

const details = asyncHandler(async (req, res) => {
  const p = await CustomerPayment.findById(req.params.id)
    .populate("customer", "firstName lastName email phone")
    .lean();

  if (!p) throw new ApiError(404, "Payment not found");

  const resolve = await resolvePartners([p]);
  const partner = resolve(p);

  res.status(200).json(
    new ApiResponse(200, {
      payment: {
        _id: p._id,
        reference: p.reference,
        customerId: p.customer?._id ?? null,
        customerName: p.customer
          ? `${p.customer.firstName} ${p.customer.lastName}`
          : "—",
        partnerId: partner.partnerId,
        partnerName: partner.partnerName || "—",
        partnerType: partner.partnerType,
        method: p.method,
        status: p.status,
        amount: p.amount,
        currency: p.currency ?? "KES",
        serviceType: p.purpose,
        relatedId: p.relatedId,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      },
    })
  );
});

export { list, details };