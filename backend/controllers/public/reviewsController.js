import CustomerReview from "../../models/customer/CustomerReview.js";
import RestaurantPartner from "../../models/rest/RestaurantPartner.js";
import TransportPartner from "../../models/trans/TransportPartner.js";
import AccommodationPartner from "../../models/accom/AccommodationPartner.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";

const REVIEW_LIMIT = 4;
const REVIEW_LOOKUP_LIMIT = 40;

const listLandingReviews = asyncHandler(async (req, res) => {
  const reviews = await CustomerReview.find({
    status: "published",
    rating: { $gte: 1, $lte: 5 },
    comment: { $type: "string", $ne: "" },
  })
    .select("customer targetType targetId rating comment createdAt")
    .populate("customer", "firstName lastName avatar")
    .sort({ createdAt: -1 })
    .limit(REVIEW_LOOKUP_LIMIT)
    .lean();

  const targetIds = (targetType) =>
    reviews
      .filter((review) => review.targetType === targetType)
      .map((review) => review.targetId);

  const [restaurants, transportPartners, accommodationPartners] =
    await Promise.all([
      RestaurantPartner.find({
        _id: { $in: targetIds("restaurant") },
        status: "active",
        isDeleted: false,
      })
        .select("name town")
        .lean(),
      TransportPartner.find({
        _id: { $in: targetIds("transport") },
        status: "active",
        isDeleted: false,
      })
        .select("firstName lastName town")
        .lean(),
      AccommodationPartner.find({
        _id: { $in: targetIds("accommodation") },
        status: "active",
        isDeleted: false,
      })
        .select("name town")
        .lean(),
    ]);

  const targets = new Map();
  restaurants.forEach((target) => targets.set(`restaurant:${target._id}`, target));
  transportPartners.forEach((target) =>
    targets.set(`transport:${target._id}`, target),
  );
  accommodationPartners.forEach((target) =>
    targets.set(`accommodation:${target._id}`, target),
  );

  const items = reviews
    .filter((review) => review.customer)
    .map((review) => {
      const target = targets.get(`${review.targetType}:${review.targetId}`);
      if (!target) return null;

      const customerName = [
        review.customer.firstName,
        review.customer.lastName,
      ]
        .filter(Boolean)
        .join(" ");
      return {
        id: String(review._id),
        name: customerName || "Traveler",
        location: target.town || "",
        image: review.customer.avatar || null,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
      };
    })
    .filter(Boolean)
    .slice(0, REVIEW_LIMIT);

  res
    .status(200)
    .json(new ApiResponse(200, { items }, "Landing reviews fetched"));
});

export { listLandingReviews };
