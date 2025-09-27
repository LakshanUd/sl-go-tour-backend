// models/Booking.js
import mongoose from "mongoose";

const { Schema } = mongoose;

/** Supported item types in one booking */
export const SERVICE_TYPES = ["Accommodation", "Meal", "TourPackage", "Vehicle"];

export const BOOKING_STATUS = [
  "pending",      // created, awaiting confirmation/payment
  "confirmed",    // confirmed & scheduled
  "ongoing",      // in progress
  "completed",    // finished
  "cancelled",    // cancelled
  "no_show",      // didn't show
  "refunded",     // fully refunded
];

export const PAYMENT_STATUS = ["unpaid", "partial", "paid", "refunded"];

/** Line item schema: one row per product/service */
const BookingItemSchema = new Schema(
  {
    serviceType: {
      type: String,
      enum: SERVICE_TYPES,
      required: true,
      index: true,
    },

    // Reference to the actual resource (only one should be set per item)
    accommodation: { type: Schema.Types.ObjectId, ref: "Accommodation" },
    meal:          { type: Schema.Types.ObjectId, ref: "MealModel" },
    tourPackage:   { type: Schema.Types.ObjectId, ref: "TourPackage" },
    vehicle:       { type: Schema.Types.ObjectId, ref: "Vehicle" },

    // Display snapshot (kept for invoice/report stability even if source changes)
    name:  { type: String, required: true, trim: true },   // e.g., “Deluxe Room”
    code:  { type: String, default: "" },                  // optional product code
    image: { type: String, default: "" },

    // Scheduling — optional per item (supports mixed cases)
    // For vehicles/accommodations/tours: use start/end; for meals: use date/time or qty only
    startDate: { type: Date },
    endDate:   { type: Date },

    // Quantities
    qty:  { type: Number, default: 1, min: 0 }, // meals/tickets
    pax:  { type: Number, default: 1, min: 0 }, // guests count if needed
    notes: { type: String, default: "" },

    // Price breakdown (denormalized)
    currency: { type: String, default: "USD" },
    unitPrice: { type: Number, required: true, min: 0 },   // price per night/day/item
    discount:  { type: Number, default: 0, min: 0 },       // absolute
    tax:       { type: Number, default: 0, min: 0 },
    fees:      { type: Number, default: 0, min: 0 },
    lineTotal: { type: Number, required: true, min: 0 },   // (unitPrice * qty) - discount + tax + fees
  },
  { _id: false, timestamps: false }
);

const BookingSchema = new Schema(
  {
    bookingID: {
      type: String,
      unique: true,
      default: () =>
        `BK-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math
          .random()
          .toString(36)
          .slice(2, 6)
          .toUpperCase()}`,
      index: true,
    },

    customer: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },

    // Who created channel-wise (for analytics)
    channel: { type: String, default: "web" }, // web/phone/partner

    // Composite cart
    items: {
      type: [BookingItemSchema],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: "Booking must contain at least one item",
      },
    },

    // Booking-level date window (optional summary for dashboards)
    startDate: { type: Date, index: true },
    endDate:   { type: Date, index: true },

    // Guests breakdown for the whole booking (optional)
    guests: {
      adults:   { type: Number, default: 1, min: 0 },
      children: { type: Number, default: 0, min: 0 },
    },

    // Order totals (denormalized for fast reports)
    currency:    { type: String, default: "USD" },
    itemsSubtotal:{ type: Number, required: true, min: 0 }, // sum of item (unit*qty)
    discount:    { type: Number, default: 0, min: 0 },      // booking-level promo
    tax:         { type: Number, default: 0, min: 0 },
    fees:        { type: Number, default: 0, min: 0 },
    grandTotal:  { type: Number, required: true, min: 0 },  // itemsSubtotal - discount + tax + fees

    // Statuses
    status:        { type: String, enum: BOOKING_STATUS, default: "pending", index: true },
    paymentStatus: { type: String, enum: PAYMENT_STATUS, default: "unpaid", index: true },

    notes: { type: String, default: "" },

    // Cancellations
    cancelledAt: { type: Date },
    cancelledBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

/** Helpful indexes for dashboards & reporting */
BookingSchema.index({ createdAt: -1 });
BookingSchema.index({ "items.serviceType": 1, status: 1, createdAt: -1 });
BookingSchema.index({ customer: 1, createdAt: -1 });

/**
 * Optional: keep a fast summary window on the booking.
 * When saving, derive booking.startDate = min(items[].startDate), endDate = max(...)
 */
BookingSchema.pre("save", function (next) {
  if (Array.isArray(this.items) && this.items.length) {
    const starts = this.items.map(i => i.startDate).filter(Boolean);
    const ends   = this.items.map(i => i.endDate).filter(Boolean);
    if (starts.length) this.startDate = new Date(Math.min(...starts.map(d => d.getTime())));
    if (ends.length)   this.endDate   = new Date(Math.max(...ends.map(d => d.getTime())));
  }
  next();
});

const Booking = mongoose.model("Booking", BookingSchema);
export default Booking;
