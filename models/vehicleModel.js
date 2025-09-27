// models/vehicleModel.js
import mongoose from "mongoose";

const vehicleSchema = new mongoose.Schema(
  {
    vehicleID: {
      type: String,
      required: true,
      unique: true,
    },
    regNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    brand: { type: String, required: true, trim: true },
    type: {
      type: String,
      required: true,
      enum: ["car", "van", "bus", "suv", "jeep", "minibus"],
      index: true,
    },
    seatingCapacity: { type: Number, required: true, min: 1, index: true },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    fuelType: {
      type: String,
      required: true,
      enum: ["petrol", "diesel", "hybrid", "electric"],
    },
    status: {
      type: String,
      default: "active",
      enum: ["active", "inactive", "under_maintenance"],
      index: true,
    },
    images: {
      type: [String],
      required: true,
      default: [
        "https://png.pngtree.com/png-clipart/20230502/original/pngtree-yellow-family-car-png-image_9131962.png",
      ],
    },
  },
  { timestamps: true }
);

// helpful compound index if you’ll sort/filter frequently
vehicleSchema.index({ type: 1, seatingCapacity: 1, price: 1 });

const Vehicle = mongoose.model("Vehicle", vehicleSchema);
export default Vehicle;
