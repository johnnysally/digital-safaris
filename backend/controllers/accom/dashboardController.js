import Booking from "../../models/accom/Booking.js";
import Property from "../../models/accom/Property.js";
import Room from "../../models/accom/Room.js";
import RoomAvailability from "../../models/accom/RoomAvailability.js";
import AccommodationPartner from "../../models/accom/AccommodationPartner.js";
import AccommodationWallet from "../../models/accom/AccommodationWallet.js";
import RoomUnit from "../../models/accom/RoomUnit.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";

const toUTCDay = (value) => {
  const d = value instanceof Date ? value : new Date(value);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
};

const overview = asyncHandler(async (req, res) => {
  const partnerId = req.partner._id;
  const today = toUTCDay(new Date());
  const tomorrow = new Date(today);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const monthStart = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1)
  );
  const nextMonthStart = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 1)
  );
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 6);

  const [
    partner,
    totalBookings,
    bookingsToday,
    checkInsToday,
    activeRoomUnits,
    occupiedRoomUnits,
    monthRevenueAgg,
    last7DaysAgg,
    recentBookings,
    wallet,
  ] = await Promise.all([
    AccommodationPartner.findById(partnerId)
      .select("name type town address coverImage logo rating totalRatings")
      .lean(),

    Booking.countDocuments({
      partner: partnerId,
      status: { $in: ["confirmed", "checked_in", "checked_out"] },
    }),

    Booking.countDocuments({
      partner: partnerId,
      createdAt: { $gte: today, $lt: tomorrow },
    }),

    Booking.countDocuments({
      partner: partnerId,
      status: { $in: ["confirmed", "checked_in"] },
      checkIn: { $gte: today, $lt: tomorrow },
    }),

    RoomUnit.countDocuments({
      partner: partnerId,
      status: "active",
      isDeleted: false,
    }),

    Booking.countDocuments({
      partner: partnerId,
      status: "checked_in",
    }),

    Booking.aggregate([
      {
        $match: {
          partner: partnerId,
          status: { $in: ["confirmed", "checked_in", "checked_out"] },
          createdAt: { $gte: monthStart, $lt: nextMonthStart },
        },
      },
      { $group: { _id: null, total: { $sum: "$partnerEarnings" } } },
    ]),

    Booking.aggregate([
      {
        $match: {
          partner: partnerId,
          createdAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
              timezone: "UTC",
            },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),

    Booking.find({
      partner: partnerId,
      status: { $in: ["confirmed", "checked_in", "checked_out"] },
    })
      .populate("customer", "firstName lastName avatar")
      .populate("property", "name type")
      .populate("roomUnit", "number floor")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),

    AccommodationWallet.findOne({ partner: partnerId }).lean(),
  ]);

  const monthRevenue = monthRevenueAgg[0]?.total ?? 0;
  const occupancyRate =
    activeRoomUnits > 0
      ? Math.round((occupiedRoomUnits / activeRoomUnits) * 100)
      : 0;

  const trendMap = new Map(last7DaysAgg.map((r) => [r._id, r.count]));
  const bookingTrend = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo);
    d.setUTCDate(d.getUTCDate() + i);
    const key = d.toISOString().slice(0, 10);
    bookingTrend.push({
      day: d.toLocaleDateString("en-KE", { month: "short", day: "numeric", timeZone: "UTC" }),
      date: key,
      count: trendMap.get(key) ?? 0,
    });
  }

  res.status(200).json(
    new ApiResponse(200, {
      partner,
      metrics: {
        totalBookings,
        bookingsToday,
        checkInsToday,
        occupancyRate,
        activeRoomUnits,
        occupiedRoomUnits,
        monthRevenue,
        currency: wallet?.currency || "KES",
      },
      bookingTrend,
      recentBookings,
      wallet,
      today: today.toISOString().slice(0, 10),
    })
  );
});

export { overview };