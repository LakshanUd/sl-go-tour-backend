
// models/AccommodationModel.js
import mongoose from "mongoose";

const { Schema } = mongoose;

const TYPES = ["Single Room", "Double Room", "Family Room"];
const STATUSES = ["Available", "Fully Booked", "Temporarily Closed"];
const AMENITIES = ["WiFi", "Pool", "Parking", "AC", "Breakfast", "Spa"];

const AccommodationSchema = new Schema(
  {
    // Auto-generated ID (_id by MongoDB)
    name: { type: String, required: true, trim: true }, // Name (required)

    type: { type: String, enum: TYPES, required: true }, // Type dropdown

    pricePerNight: { type: Number, required: true, min: 0 }, // Price (required)

    capacity: { type: Number, required: true, min: 1 }, // Capacity (required)

    amenities: {
      type: [String],
      enum: AMENITIES,
      default: [],
    }, // Facilities / Amenities

    description: { type: String, default: "" }, // Optional text area

    images: {
      type: [String],
      default: [],
    }, // Image URLs or file paths

    status: { type: String, enum: STATUSES, default: "Available" }, // Availability status
  },
  { timestamps: true }
);

const Accommodation = mongoose.model("Accommodation", AccommodationSchema);
export default Accommodation;
