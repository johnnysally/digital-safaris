import NewsletterSubscriber from "../../models/admin/NewsletterSubscriber.js";
import ApiError from "../../utils/apiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";

const subscribe = asyncHandler(async (req, res) => {
  const email =
    typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ApiError(400, "Please provide a valid email address");
  }

  await NewsletterSubscriber.findOneAndUpdate(
    { email },
    {
      $set: { status: "subscribed", subscribedAt: new Date() },
      $setOnInsert: { email },
    },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  );

  res
    .status(200)
    .json(new ApiResponse(200, null, "You have been subscribed to the newsletter."));
});

export { subscribe };
