import mongoose from "mongoose";

const brandingSchema = new mongoose.Schema(
  {
    logo: { type: String, default: null },
    logoUrl: { type: String, default: null },
    favicon: { type: String, default: null },
    logoAppearance: {
      maxWidth: { type: Number, default: 320 },
      maxHeight: { type: Number, default: 128 },
      fit: { type: String, enum: ["contain", "cover"], default: "contain" },
      padding: { type: Number, default: 0 },
      borderRadius: { type: Number, default: 0 },
    },
    faviconAppearance: {
      fit: { type: String, enum: ["contain", "cover"], default: "contain" },
      padding: { type: Number, default: 4 },
      borderRadius: { type: Number, default: 12 },
    },
    emailHeaderLogo: { type: String, default: null },
    primaryColor: { type: String, default: "#0A1D37" },
    secondaryColor: { type: String, default: "#C59B45" },
    fontFamily: { type: String, default: "Montserrat" },
    metaTitle: { type: String, default: "Digital Safaris" },
    metaDescription: { type: String, default: "Your concierge, reimagined." },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
  },
  { timestamps: true }
);

const Branding = mongoose.model("Branding", brandingSchema);

export default Branding;