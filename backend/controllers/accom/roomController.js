import Property from "../../models/accom/Property.js";
import Room from "../../models/accom/Room.js";
import RoomUnit from "../../models/accom/RoomUnit.js";
import RoomAvailability from "../../models/accom/RoomAvailability.js";
import { uploadFile, deleteFile } from "../../services/uploadService.js";
import ApiError from "../../utils/apiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";

const MAX_ROOM_PHOTOS = 5;

async function syncRoomUnits({
  partnerId,
  propertyId,
  roomId,
  totalUnits,
}) {
  const target = Math.max(0, Number(totalUnits) || 0);
  const existing = await RoomUnit.find({
    roomType: roomId,
    isDeleted: false,
  })
    .sort({ number: 1 })
    .lean();

  const currentCount = existing.length;
  if (currentCount === target) return;

  if (currentCount < target) {
    const used = new Set(existing.map((u) => u.number));
    const toAdd = [];
    let n = 1;
    while (toAdd.length < target - currentCount) {
      const number = String(n);
      if (!used.has(number)) {
        toAdd.push({
          partner: partnerId,
          property: propertyId,
          roomType: roomId,
          number,
          status: "active",
        });
      }
      n++;
      if (n > target * 10) break;
    }
    if (toAdd.length > 0) {
      await RoomUnit.insertMany(toAdd);
    }
    return;
  }

  const toRemove = existing.slice(target);
  if (toRemove.length > 0) {
    await RoomUnit.updateMany(
      { _id: { $in: toRemove.map((u) => u._id) } },
      { $set: { isDeleted: true } }
    );
  }
}

const list = asyncHandler(async (req, res) => {
  const filter = { partner: req.partner._id };
  if (req.query.property) filter.property = req.query.property;
  if (req.query.status) filter.status = req.query.status;

  const items = await Room.find(filter).sort({ createdAt: -1 }).lean();
  res.status(200).json(new ApiResponse(200, items));
});

const details = asyncHandler(async (req, res) => {
  const room = await Room.findOne({
    _id: req.params.id,
    partner: req.partner._id,
  }).lean();

  if (!room) throw new ApiError(404, "Room not found");

  res.status(200).json(new ApiResponse(200, room));
});

const create = asyncHandler(async (req, res) => {
  const {
    property,
    name,
    description,
    type,
    capacity,
    beds,
    sizeSqm,
    images,
    amenities,
    basePrice,
    weekendPrice,
    seasonalPrices,
    totalUnits,
    isFeatured,
  } = req.body;

  if (Array.isArray(images) && images.length > MAX_ROOM_PHOTOS) {
    throw new ApiError(400, `Maximum ${MAX_ROOM_PHOTOS} photos per room`);
  }

  const propertyDoc = await Property.findOne({
    _id: property,
    partner: req.partner._id,
  });
  if (!propertyDoc) throw new ApiError(404, "Property not found");

  const room = await Room.create({
    partner: req.partner._id,
    property: propertyDoc._id,
    name,
    description: description || "",
    type,
    capacity,
    beds,
    sizeSqm: sizeSqm ?? null,
    images: Array.isArray(images) ? images : [],
    amenities: amenities || [],
    basePrice,
    weekendPrice: weekendPrice ?? null,
    seasonalPrices: seasonalPrices || [],
    totalUnits,
    status: "active",
    isFeatured: isFeatured ?? false,
  });

  await syncRoomUnits({
    partnerId: req.partner._id,
    propertyId: propertyDoc._id,
    roomId: room._id,
    totalUnits: room.totalUnits,
  });

  res.status(201).json(new ApiResponse(201, room, "Room created"));
});

const update = asyncHandler(async (req, res) => {
  const allowed = [
    "name",
    "description",
    "type",
    "capacity",
    "beds",
    "sizeSqm",
    "images",
    "amenities",
    "basePrice",
    "weekendPrice",
    "seasonalPrices",
    "totalUnits",
    "status",
    "isFeatured",
  ];

  const updates = {};
  for (const k of allowed) {
    if (req.body[k] !== undefined) updates[k] = req.body[k];
  }

  if (
    Array.isArray(updates.images) &&
    updates.images.length > MAX_ROOM_PHOTOS
  ) {
    throw new ApiError(400, `Maximum ${MAX_ROOM_PHOTOS} photos per room`);
  }

  const room = await Room.findOneAndUpdate(
    { _id: req.params.id, partner: req.partner._id },
    { $set: updates },
    { new: true }
  );

  if (!room) throw new ApiError(404, "Room not found");

  if (updates.totalUnits !== undefined) {
    await syncRoomUnits({
      partnerId: req.partner._id,
      propertyId: room.property,
      roomId: room._id,
      totalUnits: room.totalUnits,
    });
  }

  res.status(200).json(new ApiResponse(200, room, "Room updated"));
});

const remove = asyncHandler(async (req, res) => {
  const room = await Room.findOneAndDelete({
    _id: req.params.id,
    partner: req.partner._id,
  });

  if (!room) throw new ApiError(404, "Room not found");

  await Promise.all([
    RoomAvailability.deleteMany({ room: room._id }),
    RoomUnit.updateMany(
      { roomType: room._id },
      { $set: { isDeleted: true } }
    ),
  ]);

  res.status(200).json(new ApiResponse(200, null, "Room deleted"));
});

const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "File required");

  const room = await Room.findOne({
    _id: req.params.id,
    partner: req.partner._id,
  });
  if (!room) throw new ApiError(404, "Room not found");

  if ((room.images?.length ?? 0) >= MAX_ROOM_PHOTOS) {
    throw new ApiError(400, `Maximum ${MAX_ROOM_PHOTOS} photos per room`);
  }

  const { url, publicId } = await uploadFile(
    req.file.buffer,
    req.file.originalname,
    "accommodation/rooms"
  );

  const updated = await Room.findByIdAndUpdate(
    room._id,
    { $push: { images: url } },
    { new: true }
  );

  res.status(201).json(
    new ApiResponse(
      201,
      { url, publicId, images: updated?.images ?? [] },
      "Room photo uploaded"
    )
  );
});

const removeImage = asyncHandler(async (req, res) => {
  const { url } = req.body;
  if (!url) throw new ApiError(400, "Image URL required");

  const room = await Room.findOne({
    _id: req.params.id,
    partner: req.partner._id,
  });
  if (!room) throw new ApiError(404, "Room not found");

  if (!room.images?.includes(url)) {
    throw new ApiError(404, "Image not found on this room");
  }

  const updated = await Room.findByIdAndUpdate(
    room._id,
    { $pull: { images: url } },
    { new: true }
  );

  const publicIdMatch = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-z]+)?$/i);
  if (publicIdMatch) {
    deleteFile(publicIdMatch[1]).catch(() => {});
  }

  res.status(200).json(
    new ApiResponse(
      200,
      { images: updated?.images ?? [] },
      "Room photo removed"
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