import mongoose from "mongoose";

const newsletterSubscriberSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    status: {
      type: String,
      enum: ["subscribed", "unsubscribed"],
      default: "subscribed",
    },
    subscribedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const NewsletterSubscriber = mongoose.model(
  "NewsletterSubscriber",
  newsletterSubscriberSchema
);

export default NewsletterSubscriber;
