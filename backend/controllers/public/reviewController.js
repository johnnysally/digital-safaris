import CustomerReview from "../../models/customer/CustomerReview.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";

const listPublished = asyncHandler(async (req, res) => {
  const requestedLimit = Number.parseInt(req.query.limit, 10);
  const limit = Number.isInteger(requestedLimit)
    ? Math.min(Math.max(requestedLimit, 1), 8)
    : 4;
  const items = await CustomerReview.find({
    status: "published",
    comment: { $regex: /\S/ },
  })
    .populate({
      path: "customer",
      select: "firstName lastName avatar town status isDeleted",
      match: { status: "active", isDeleted: false },
    })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  const reviews = items
    .filter((review) => review.customer)
    .map((review) => ({
      id: review._id,
      name: `${review.customer.firstName} ${review.customer.lastName}`.trim(),
      location: review.customer.town || "DigitalSafaris traveler",
      image: review.customer.avatar || null,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
    }));

  res.status(200).json(new ApiResponse(200, { items: reviews }));
});

export { listPublished };
