import mongoose from "mongoose";

const orderQuoteItemSchema = new mongoose.Schema(
  {
    menuItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MenuItem",
      required: true,
    },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    subtotal: { type: Number, required: true, min: 0 },
    notes: { type: String, default: null },
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
    items: {
      type: [orderQuoteItemSchema],
      required: true,
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: "Quote must contain at least one item",
      },
    },
    subtotal: { type: Number, required: true, min: 0 },
    deliveryFee: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "KES" },
    commissionRate: { type: Number, required: true, min: 0, max: 100 },
    commissionAmount: { type: Number, required: true, min: 0 },
    restaurantEarnings: { type: Number, required: true, min: 0 },
    deliveryAddress: {
      address: { type: String, default: null },
      town: { type: String, default: null, trim: true },
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
    },
    expiresAt: { type: Date, required: true, index: true },
    consumed: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

orderQuoteSchema.index({ customer: 1, createdAt: -1 });
orderQuoteSchema.index({ customer: 1, consumed: 1 });

const OrderQuote =
  mongoose.models.OrderQuote ||
  mongoose.model("OrderQuote", orderQuoteSchema);

export default OrderQuote;