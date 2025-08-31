import mongoose from "mongoose";

const vehicleSchema = new mongoose.Schema({
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
    },
    seatingCapacity: { type: Number, required: true, min: 1 },
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
        default: ["https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.vecteezy.com%2Ffree-vector%2Fblue-car&psig=AOvVaw2LDvrUqVZpjjepjoReYBge&ust=1756627245413000&source=images&cd=vfe&opi=89978449&ved=0CBUQjRxqFwoTCKjnncmIso8DFQAAAAAdAAAAABAE"]
    }
  },
  { timestamps: true }
);

vehicleSchema.index({ type: 1, seatingCapacity: 1 });

const Vehicle = mongoose.model("Vehicle", vehicleSchema);

export default Vehicle;