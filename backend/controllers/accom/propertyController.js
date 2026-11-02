import Property from "../../models/accom/Property.js";
import Room from "../../models/accom/Room.js";
import { uploadFile, deleteFile } from "../../services/uploadService.js";
import { slugify } from "../../utils/helpers.js";
import ApiError from "../../utils/apiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";
import logger from "../../utils/logger.js";

const MAX_PROPERTY_IMAGES = 20;

const list = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = { partner: req.partner._id };
  if (status) filter.status = status;

  const items = await Property.find(filter).sort({ createdAt: -1 }).lean();
  res.status(200).json(new ApiResponse(200, items));
});

const details = asyncHandler(async (req, res) => {
  const property = await Property.findOne({
    _id: req.params.id,
    partner: req.partner._id,
  }).lean();

  if (!property) throw new ApiError(404, "Property not found");

  const rooms = await Room.find({ property: property._id }).lean();

  res.status(200).json(new ApiResponse(200, { property, rooms }));
});

const create = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    type,
    location,
    town,
    address,
    latitude,
    longitude,
    images,
    amenities,
    rules,
    checkInTime,
    checkOutTime,
    totalRooms,
  } = req.body;

  if (Array.isArray(images) && images.length > MAX_PROPERTY_IMAGES) {
    throw new ApiError(400, `Maximum ${MAX_PROPERTY_IMAGES} photos per property`);
  }

  const slug = `${slugify(name)}-${Date.now().toString(36)}`;

  const property = await Property.create({
    partner: req.partner._id,
    name,
    slug,
    description: description || "",
    type,
    location,
    town,
    address,
    latitude,
    longitude,
    images: Array.isArray(images) ? images : [],
    amenities: amenities || [],
    rules: rules || [],
    checkInTime: checkInTime || "14:00",
    checkOutTime: checkOutTime || "11:00",
    totalRooms: totalRooms ?? 0,
    status: "active",
  });

  logger.info("[property.create] created", {
    id: String(property._id),
    imagesLength: property.images?.length ?? 0,
  });

  res.status(201).json(new ApiResponse(201, property, "Property created"));
});

const update = asyncHandler(async (req, res) => {
  const allowed = [
    "name",
    "description",
    "type",
    "location",
    "town",
    "address",
    "latitude",
    "longitude",
    "images",
    "amenities",
    "rules",
    "checkInTime",
    "checkOutTime",
    "totalRooms",
    "status",
    "isFeatured",
  ];

  const updates = {};
  for (const k of allowed) {
    if (req.body[k] !== undefined) updates[k] = req.body[k];
  }

  if (
    Array.isArray(updates.images) &&
    updates.images.length > MAX_PROPERTY_IMAGES
  ) {
    throw new ApiError(400, `Maximum ${MAX_PROPERTY_IMAGES} photos per property`);
  }

  const property = await Property.findOneAndUpdate(
    { _id: req.params.id, partner: req.partner._id },
    { $set: updates },
    { new: true }
  );

  if (!property) throw new ApiError(404, "Property not found");

  logger.info("[property.update] updated", {
    id: String(property._id),
    imagesLength: property.images?.length ?? 0,
    images: property.images,
  });

  res.status(200).json(new ApiResponse(200, property, "Property updated"));
});

const remove = asyncHandler(async (req, res) => {
  const property = await Property.findOneAndDelete({
    _id: req.params.id,
    partner: req.partner._id,
  });

  if (!property) throw new ApiError(404, "Property not found");

  await Room.deleteMany({ property: property._id });

  res.status(200).json(new ApiResponse(200, null, "Property deleted"));
});

const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "File required");

  const property = await Property.findOne({
    _id: req.params.id,
    partner: req.partner._id,
  });
  if (!property) throw new ApiError(404, "Property not found");

  if ((property.images?.length ?? 0) >= MAX_PROPERTY_IMAGES) {
    throw new ApiError(400, `Maximum ${MAX_PROPERTY_IMAGES} photos per property`);
  }

  const { url, publicId } = await uploadFile(
    req.file.buffer,
    req.file.originalname,
    "accommodation/properties"
  );

  const updated = await Property.findByIdAndUpdate(
    property._id,
    { $push: { images: url } },
    { new: true }
  );

  logger.info("[property.uploadImage] pushed", {
    propertyId: String(property._id),
    url,
    imagesLength: updated?.images?.length ?? 0,
  });

  res.status(201).json(
    new ApiResponse(
      201,
      { url, publicId, images: updated?.images ?? [] },
      "Property photo uploaded"
    )
  );
});

const removeImage = asyncHandler(async (req, res) => {
  const { url } = req.body;
  if (!url) throw new ApiError(400, "Image URL required");

  const property = await Property.findOne({
    _id: req.params.id,
    partner: req.partner._id,
  });
  if (!property) throw new ApiError(404, "Property not found");

  if (!property.images?.includes(url)) {
    throw new ApiError(404, "Image not found on this property");
  }

  const updated = await Property.findByIdAndUpdate(
    property._id,
    { $pull: { images: url } },
    { new: true }
  );

  const publicIdMatch = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-z]+)?$/i);
  if (publicIdMatch) {
    deleteFile(publicIdMatch[1]).catch(() => {});
  }

  logger.info("[property.removeImage] pulled", {
    propertyId: String(property._id),
    url,
    imagesLength: updated?.images?.length ?? 0,
  });

  res.status(200).json(
    new ApiResponse(
      200,
      { images: updated?.images ?? [] },
      "Property photo removed"
    )
  );
});

export {
  list,
  details,
  create,
  update,
  remove,
  uploadImage,
  removeImage,
};