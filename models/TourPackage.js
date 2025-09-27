// models/TourPackage.js
import mongoose from "mongoose";

const { Schema } = mongoose;

const tourPackageSchema = new Schema(
  {
    tourPakage_ID: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["City Tour", "Village Tour", "Sea Tour", "Lagoon Tour"],
      default: "Village Tour",
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    duration: {
      type: String,
      required: true,
      trim: true,
    },
    images: {
      type: [String],
      default: [
        "https://png.pngtree.com/png-clipart/20231005/original/pngtree-tourism-travel-icon-png-image_13093469.png",
      ],
    },

    /* -------- NEW: optional links to real data -------- */
    accommodations: [{ type: Schema.Types.ObjectId, ref: "Accommodation" }],
    vehicles:       [{ type: Schema.Types.ObjectId, ref: "Vehicle" }],
    meals:          [{ type: Schema.Types.ObjectId, ref: "MealModel" }],
  },
  { timestamps: true }
);

// Helpful index
tourPackageSchema.index({ type: 1, price: 1 });

const TourPackage = mongoose.model("TourPackage", tourPackageSchema);
export default TourPackage;
