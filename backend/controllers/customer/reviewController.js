import CustomerReview from "../../models/customer/CustomerReview.js";
import RestaurantRating from "../../models/rest/RestaurantRating.js";
import DriverRating from "../../models/trans/DriverRating.js";
import AccommodationRating from "../../models/accom/AccommodationRating.js";
import RestaurantPartner from "../../models/rest/RestaurantPartner.js";
import TransportPartner from "../../models/trans/TransportPartner.js";
import AccommodationPartner from "../../models/accom/AccommodationPartner.js";
import Branding from "../../models/admin/Branding.js";
import SystemSetting from "../../models/admin/SystemSetting.js";
import ApiError from "../../utils/apiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";
import * as emailService from "../../services/emailService.js";
import logger from "../../utils/logger.js";

const getContext = async () => {
  const branding = (await Branding.findOne().lean()) || {};
  const general = await SystemSetting.findOne({ key: "general" }).lean();
  return { branding, settings: general?.value || {} };
};

async function refreshPartnerRating(model, partnerModel, partnerId, partnerField) {
  const [agg] = await model.aggregate([
    { $match: { [partnerField]: partnerId } },
    {
      $group: {
        _id: null,
        average: { $avg: "$rating" },
        count: { $sum: 1 },
      },
    },
  ]);

  if (agg) {
    await partnerModel.updateOne(
      { _id: partnerId },
      {
        $set: {
          rating: Number(agg.average.toFixed(2)),
          totalRatings: agg.count,
        },
      }
    );
    return {
      rating: Number(agg.average.toFixed(2)),
      totalRatings: agg.count,
    };
  }

  return { rating: 0, totalRatings: 0 };
}

const create = asyncHandler(async (req, res) => {
  const {
    targetType,
    targetId,
    order,
    booking,
    trip,
    property,
    room,
    rating,
    title,
    comment,
    images,
    tags,
    foodQuality,
    service,
    delivery,
    value,
    cleanliness,
    comfort,
    location,
  } = req.body;

  if (!["restaurant", "transport", "accommodation"].includes(targetType)) {
    throw new ApiError(400, "Invalid target type");
  }
  if (!targetId) throw new ApiError(400, "targetId required");
  if (!rating || rating < 1 || rating > 5) {
    throw new ApiError(400, "Rating must be between 1 and 5");
  }

  if (booking) {
    const existing = await CustomerReview.findOne({
      customer: req.customer._id,
      booking,
    }).lean();
    if (existing) {
      throw new ApiError(400, "You've already reviewed this booking");
    }
  }
  if (order) {
    const existing = await CustomerReview.findOne({
      customer: req.customer._id,
      order,
    }).lean();
    if (existing) {
      throw new ApiError(400, "You've already reviewed this order");
    }
  }
  if (trip) {
    const existing = await CustomerReview.findOne({
      customer: req.customer._id,
      trip,
    }).lean();
    if (existing) {
      throw new ApiError(400, "You've already reviewed this trip");
    }
  }

  const review = await CustomerReview.create({
    customer: req.customer._id,
    targetType,
    targetId,
    order: order || null,
    booking: booking || null,
    trip: trip || null,
    rating,
    title: title || null,
    comment: comment || "",
    images: images || [],
    status: "published",
  });

  const { branding, settings } = await getContext();

  if (targetType === "restaurant") {
    await RestaurantRating.create({
      restaurant: targetId,
      customer: req.customer._id,
      order: order || null,
      booking: booking || null,
      rating,
      foodQuality: foodQuality || null,
      service: service || null,
      delivery: delivery || null,
      value: value || null,
      comment: comment || "",
      images: images || [],
      tags: tags || [],
    });

    const stats = await refreshPartnerRating(
      RestaurantRating,
      RestaurantPartner,
      targetId,
      "restaurant"
    );

    try {
      const partner = await RestaurantPartner.findById(targetId).lean();
      if (partner?.email) {
        await emailService.reviewReceived(partner, {
          review: { rating, comment },
          branding,
          settings,
        });
      }
    } catch (err) {
      logger.error("Partner review email failed", { error: err.message });
    }

    return res.status(201).json(
      new ApiResponse(
        201,
        { review, partnerRating: stats },
        "Review submitted"
      )
    );
  }

  if (targetType === "transport") {
    await DriverRating.create({
      partner: targetId,
      customer: req.customer._id,
      trip: trip || null,
      rating,
      comment: comment || "",
      tags: tags || [],
    });

    const stats = await refreshPartnerRating(
      DriverRating,
      TransportPartner,
      targetId,
      "partner"
    );

    try {
      const partner = await TransportPartner.findById(targetId).lean();
      if (partner?.email) {
        await emailService.reviewReceived(partner, {
          review: { rating, comment },
          branding,
          settings,
        });
      }
    } catch (err) {
      logger.error("Partner review email failed", { error: err.message });
    }

    return res.status(201).json(
      new ApiResponse(
        201,
        { review, partnerRating: stats },
        "Review submitted"
      )
    );
  }

  if (!property) {
    throw new ApiError(400, "property required for accommodation review");
  }

  await AccommodationRating.create({
    partner: targetId,
    property,
    room: room || null,
    customer: req.customer._id,
    booking: booking || null,
    rating,
    cleanliness: cleanliness || null,
    comfort: comfort || null,
    location: location || null,
    service: service || null,
    value: value || null,
    comment: comment || "",
    images: images || [],
    tags: tags || [],
  });

  const stats = await refreshPartnerRating(
    AccommodationRating,
    AccommodationPartner,
    targetId,
    "partner"
  );

  try {
    const partner = await AccommodationPartner.findById(targetId).lean();
    if (partner?.email) {
      await emailService.reviewReceived(partner, {
        review: { rating, comment },
        branding,
        settings,
      });
    }
  } catch (err) {
    logger.error("Partner review email failed", { error: err.message });
  }

  res.status(201).json(
    new ApiResponse(
      201,
      { review, partnerRating: stats },
      "Review submitted"
    )
  );
});

const list = asyncHandler(async (req, res) => {
  const { targetType, page = 1, limit = 20 } = req.query;
  const filter = { customer: req.customer._id };
  if (targetType) filter.targetType = targetType;

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    CustomerReview.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    CustomerReview.countDocuments(filter),
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

const listForTarget = asyncHandler(async (req, res) => {
  const { targetType, targetId, page = 1, limit = 20 } = req.query;
  if (!targetType || !targetId) {
    throw new ApiError(400, "targetType and targetId required");
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    CustomerReview.find({ targetType, targetId, status: "published" })
      .populate("customer", "firstName lastName avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    CustomerReview.countDocuments({
      targetType,
      targetId,
      status: "published",
    }),
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

const update = asyncHandler(async (req, res) => {
  const review = await CustomerReview.findOne({
    _id: req.params.id,
    customer: req.customer._id,
  });
  if (!review) throw new ApiError(404, "Review not found");

  const { rating, title, comment, images } = req.body;
  if (rating !== undefined) {
    if (rating < 1 || rating > 5) {
      throw new ApiError(400, "Rating must be between 1 and 5");
    }
    review.rating = rating;
  }
  if (title !== undefined) review.title = title;
  if (comment !== undefined) review.comment = comment;
  if (images !== undefined) review.images = images;

  await review.save();
  res.status(200).json(new ApiResponse(200, review, "Review updated"));
});

const remove = asyncHandler(async (req, res) => {
  const review = await CustomerReview.findOneAndDelete({
    _id: req.params.id,
    customer: req.customer._id,
  });
  if (!review) throw new ApiError(404, "Review not found");
  res.status(200).json(new ApiResponse(200, null, "Review deleted"));
});

export { create, list, listForTarget, update, remove };