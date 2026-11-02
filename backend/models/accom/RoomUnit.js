import mongoose from "mongoose";

const roomUnitSchema = new mongoose.Schema(
  {
    partner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AccommodationPartner",
      required: true,
    },
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    roomType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    number: { type: String, required: true, trim: true },
    floor: { type: String, default: null, trim: true },
    status: {
      type: String,
      enum: ["active", "maintenance", "blocked"],
      default: "active",
    },
    notes: { type: String, default: null },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

roomUnitSchema.index({ property: 1, number: 1 }, { unique: true });
roomUnitSchema.index({ roomType: 1, status: 1 });
roomUnitSchema.index({ partner: 1 });

const RoomUnit = mongoose.model("RoomUnit", roomUnitSchema);
export default RoomUnit;