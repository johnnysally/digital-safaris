import mongoose from "mongoose";

const orderQuoteItemSchema = new mongoose.Schema(
  {
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem" },
    name: String,
    price: Number,
    quantity: Number,
    subtotal: Number,
    notes: String,
  },
  { _id: false }
);

const orderQuoteSchema = new mongoose.Schema(
  {
    quoteId: { type: String, required: true, unique: true, index: true },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RestaurantPartner",
      required: true,
    },
    type: { type: String, enum: ["delivery", "pickup"], required: true },
    items: { type: [orderQuoteItemSchema], required: true },
    subtotal: { type: Number, required: true },
    deliveryFee: { type: Number, default: 0 },
    total: { type: Number, required: true },
    currency: { type: String, default: "KES" },
    commissionRate: { type: Number, required: true },
    commissionAmount: { type: Number, required: true },
    restaurantEarnings: { type: Number, required: true },
    deliveryAddress: {
      address: String,
      town: String,
      latitude: Number,
      longitude: Number,
    },
    expiresAt: { type: Date, required: true, index: true },
    consumed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("OrderQuote", orderQuoteSchema);