import Download from "../../models/admin/Download.js";
import ApiError from "../../utils/apiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";

const list = asyncHandler(async (req, res) => {
  const { platform } = req.query;
  const filter = { available: true };

  if (platform) filter.platform = platform;

  const items = await Download.find(filter)
    .select(
      "name platform architecture version size url minimumOs checksum releaseNotes createdAt"
    )
    .sort({ platform: 1, createdAt: -1 })
    .lean();

  res.status(200).json(new ApiResponse(200, items));
});

const details = asyncHandler(async (req, res) => {
  const item = await Download.findOne({
    _id: req.params.id,
    available: true,
  })
    .select(
      "name platform architecture version size url minimumOs checksum releaseNotes createdAt"
    )
    .lean();

  if (!item) throw new ApiError(404, "Download not found");

  res.status(200).json(new ApiResponse(200, item));
});

export { list, details };