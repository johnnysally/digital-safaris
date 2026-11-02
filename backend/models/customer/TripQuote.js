import mongoose from "mongoose";

const tripQuoteSchema = new mongoose.Schema(
  {
    quoteId: { type: String, required: true, unique: true, index: true },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    pickup: {
      address: String,
      town: String,
      latitude: Number,
      longitude: Number,
    },
    dropoff: {
      address: String,
      town: String,
      latitude: Number,
      longitude: Number,
    },
    serviceType: {
      type: String,
      enum: ["bike", "car", "van"],
      required: true,
    },
    distanceKm: { type: Number, required: true },
    fare: { type: Number, required: true },
    currency: { type: String, default: "KES" },
    commissionRate: { type: Number, required: true },
    commissionAmount: { type: Number, required: true },
    partnerEarnings: { type: Number, required: true },
    expiresAt: { type: Date, required: true, index: true },
    consumed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("TripQuote", tripQuoteSchema);