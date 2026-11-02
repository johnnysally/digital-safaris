import RoomUnit from "../../models/accom/RoomUnit.js";
import Room from "../../models/accom/Room.js";
import ApiError from "../../utils/apiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";

const list = asyncHandler(async (req, res) => {
  const { roomType, status } = req.query;

  const filter = { partner: req.partner._id, isDeleted: false };
  if (roomType) filter.roomType = roomType;
  if (status) filter.status = status;

  const items = await RoomUnit.find(filter)
    .populate("roomType", "name type")
    .populate("property", "name")
    .sort({ number: 1 })
    .lean();

  res.status(200).json(new ApiResponse(200, items));
});

const bulkUpdate = asyncHandler(async (req, res) => {
  const { updates } = req.body;

  if (!Array.isArray(updates) || updates.length === 0) {
    throw new ApiError(400, "updates array required");
  }
  if (updates.length > 100) {
    throw new ApiError(400, "at most 100 updates per request");
  }

  const results = [];
  for (const update of updates) {
    const { _id, number, floor, status, notes } = update;
    if (!_id) continue;

    const allowedStatus = ["active", "maintenance", "blocked"];
    const patch = {};
    if (typeof number === "string" && number.trim()) patch.number = number.trim();
    if (floor !== undefined) patch.floor = floor || null;
    if (status && allowedStatus.includes(status)) patch.status = status;
    if (notes !== undefined) patch.notes = notes || null;

    if (Object.keys(patch).length === 0) continue;

    try {
      const updated = await RoomUnit.findOneAndUpdate(
        { _id, partner: req.partner._id, isDeleted: false },
        { $set: patch },
        { new: true, runValidators: true }
      );
      if (updated) results.push({ _id, ok: true });
      else results.push({ _id, ok: false, reason: "not found" });
    } catch (err) {
      results.push({
        _id,
        ok: false,
        reason:
          err.code === 11000
            ? "Duplicate room number"
            : err.message || "Update failed",
      });
    }
  }

  const failed = results.filter((r) => !r.ok);

  res.status(200).json(
    new ApiResponse(
      200,
      { updated: results.length - failed.length, failed },
      failed.length === 0
        ? "Room units updated"
        : `${failed.length} update${failed.length === 1 ? "" : "s"} failed`
    )
  );
});

export { list, bulkUpdate };