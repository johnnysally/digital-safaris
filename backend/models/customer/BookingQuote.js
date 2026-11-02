import mongoose from "mongoose";

const bookingQuoteSchema = new mongoose.Schema(
  {
    quoteId: { type: String, required: true, unique: true, index: true },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    partner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AccommodationPartner",
      required: true,
    },
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    nights: { type: Number, required: true, min: 1 },
    roomsBooked: { type: Number, required: true, min: 1 },
    guests: {
      adults: { type: Number, default: 1, min: 1 },
      children: { type: Number, default: 0, min: 0 },
    },
    pricePerNight: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "KES" },
    commissionRate: { type: Number, required: true, min: 0, max: 100 },
    commissionAmount: { type: Number, required: true, min: 0 },
    partnerEarnings: { type: Number, required: true, min: 0 },
    expiresAt: { type: Date, required: true, index: true },
    consumed: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

bookingQuoteSchema.index({ customer: 1, createdAt: -1 });
bookingQuoteSchema.index({ customer: 1, consumed: 1 });

const BookingQuote =
  mongoose.models.BookingQuote ||
  mongoose.model("BookingQuote", bookingQuoteSchema);

export default BookingQuote;