import Property from "../../models/accom/Property.js";
import AccommodationPartner from "../../models/accom/AccommodationPartner.js";
import RestaurantPartner from "../../models/rest/RestaurantPartner.js";
import MenuItem from "../../models/rest/MenuItem.js";
import Room from "../../models/accom/Room.js";
import Location from "../../models/admin/Location.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";

async function enrichProperties(properties) {
  if (properties.length === 0) return [];

  const ids = properties.map((p) => p._id);
  const roomStats = await Room.aggregate([
    { $match: { property: { $in: ids }, status: "active" } },
    {
      $group: {
        _id: "$property",
        units: { $sum: "$totalUnits" },
        minPrice: { $min: "$basePrice" },
        maxPrice: { $max: "$basePrice" },
        roomTypes: { $sum: 1 },
        currency: { $first: "$currency" },
      },
    },
  ]);
  const statsByProperty = new Map(roomStats.map((r) => [String(r._id), r]));

  return properties.map((p) => {
    const stats = statsByProperty.get(String(p._id));
    const partner = p.partner;

    return {
      _id: p._id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      type: p.type,
      town: p.town,
      address: p.address,
      latitude: p.latitude,
      longitude: p.longitude,
      images: p.images ?? [],
      amenities: p.amenities ?? [],
      coverImage:
        p.images?.[0] ?? partner?.coverImage ?? partner?.logo ?? null,
      rating: p.rating ?? partner?.rating ?? 0,
      totalRatings: p.totalRatings ?? partner?.totalRatings ?? 0,
      isFeatured: p.isFeatured ?? false,
      checkInTime: p.checkInTime,
      checkOutTime: p.checkOutTime,
      partner: partner
        ? {
            _id: partner._id,
            name: partner.name,
            logo: partner.logo,
            town: partner.town,
            type: partner.type,
          }
        : null,
      minPrice: stats?.minPrice ?? null,
      maxPrice: stats?.maxPrice ?? null,
      currency: stats?.currency ?? "KES",
      roomTypes: stats?.roomTypes ?? 0,
      roomUnits: stats?.units ?? 0,
    };
  });
}

const searchRestaurants = asyncHandler(async (req, res) => {
  const { q, town, cuisine, id, slug, page = 1, limit = 20 } = req.query;
  const filter = { status: "active", isDeleted: false };

  if (id) filter._id = id;
  if (slug) filter.slug = slug;
  if (town) filter.town = new RegExp(town, "i");
  if (cuisine) filter.cuisineTypes = cuisine;
  if (q) {
    filter.$or = [
      { name: new RegExp(q, "i") },
      { description: new RegExp(q, "i") },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    RestaurantPartner.find(filter)
      .sort({ rating: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    RestaurantPartner.countDocuments(filter),
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

const searchAccommodations = asyncHandler(async (req, res) => {
  const { q, town, type, featured, page = 1, limit = 20 } = req.query;

  const filter = { status: "active" };
  if (town) filter.town = new RegExp(town, "i");
  if (type) filter.type = type;
  if (featured === "true") filter.isFeatured = true;
  if (q) {
    filter.$or = [
      { name: new RegExp(q, "i") },
      { description: new RegExp(q, "i") },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [properties, total] = await Promise.all([
    Property.find(filter)
      .populate("partner", "name logo coverImage rating totalRatings town type")
      .sort({ isFeatured: -1, rating: -1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Property.countDocuments(filter),
  ]);

  const items = await enrichProperties(properties);

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

const searchProperties = asyncHandler(async (req, res) => {
  const { q, town, type, partner, featured, page = 1, limit = 20 } = req.query;

  const filter = { status: "active" };
  if (town) filter.town = new RegExp(town, "i");
  if (type) filter.type = type;
  if (partner) filter.partner = partner;
  if (featured === "true") filter.isFeatured = true;
  if (q) {
    filter.$or = [
      { name: new RegExp(q, "i") },
      { description: new RegExp(q, "i") },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [properties, total] = await Promise.all([
    Property.find(filter)
      .populate("partner", "name logo coverImage rating totalRatings town type")
      .sort({ isFeatured: -1, rating: -1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Property.countDocuments(filter),
  ]);

  const items = await enrichProperties(properties);

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

const searchPropertyDetails = asyncHandler(async (req, res) => {
  const { idOrSlug } = req.params;

  const isObjectId = /^[a-f0-9]{24}$/i.test(idOrSlug);
  const filter = isObjectId ? { _id: idOrSlug } : { slug: idOrSlug };

  const property = await Property.findOne({ ...filter, status: "active" })
    .populate(
      "partner",
      "name logo coverImage rating totalRatings town type phone email address latitude longitude"
    )
    .lean();

  if (!property) {
    res.status(404).json(new ApiResponse(404, null, "Property not found"));
    return;
  }

  const rooms = await Room.find({
    property: property._id,
    status: "active",
  })
    .sort({ basePrice: 1 })
    .lean();

  const [enriched] = await enrichProperties([property]);

  res.status(200).json(
    new ApiResponse(200, {
      property: {
        ...enriched,
        rooms,
      },
    })
  );
});

const searchMenuItems = asyncHandler(async (req, res) => {
  const { q, restaurantId, page = 1, limit = 20 } = req.query;
  const filter = { status: "active" };

  if (restaurantId) filter.restaurant = restaurantId;
  if (q) {
    filter.$or = [
      { name: new RegExp(q, "i") },
      { description: new RegExp(q, "i") },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    MenuItem.find(filter).skip(skip).limit(Number(limit)).lean(),
    MenuItem.countDocuments(filter),
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

const searchLocations = asyncHandler(async (req, res) => {
  const { q, type, isOperational } = req.query;
  const filter = {};

  if (type) filter.type = type;
  if (isOperational === "true") filter.isOperational = true;
  if (q) {
    filter.$or = [
      { name: new RegExp(q, "i") },
      { county: new RegExp(q, "i") },
    ];
  }

  const items = await Location.find(filter).sort({ name: 1 }).lean();
  res.status(200).json(new ApiResponse(200, items));
});

const globalSearch = asyncHandler(async (req, res) => {
  const { q, town } = req.query;
  if (!q) {
    return res.status(200).json(
      new ApiResponse(200, {
        restaurants: [],
        accommodations: [],
        properties: [],
      })
    );
  }

  const textFilter = new RegExp(q, "i");
  const townFilter = town ? new RegExp(town, "i") : null;

  const [restaurants, properties] = await Promise.all([
    RestaurantPartner.find({
      status: "active",
      isDeleted: false,
      ...(townFilter && { town: townFilter }),
      $or: [{ name: textFilter }, { description: textFilter }],
    })
      .limit(10)
      .lean(),
    Property.find({
      status: "active",
      ...(townFilter && { town: townFilter }),
      $or: [{ name: textFilter }, { description: textFilter }],
    })
      .populate("partner", "name logo coverImage rating totalRatings town type")
      .limit(10)
      .lean(),
  ]);

  const enrichedProperties = await enrichProperties(properties);

  res.status(200).json(
    new ApiResponse(200, {
      restaurants,
      accommodations: enrichedProperties,
      properties: enrichedProperties,
    })
  );
});

export {
  searchRestaurants,
  searchAccommodations,
  searchProperties,
  searchPropertyDetails,
  searchMenuItems,
  searchLocations,
  globalSearch,
};