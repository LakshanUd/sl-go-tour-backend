// models/Cart.js
import mongoose from "mongoose";

const { Schema } = mongoose;

const SERVICE_TYPES = ["Accommodation", "Meal", "TourPackage", "Vehicle"];

const CartItemSchema = new Schema(
  {
    serviceType: { type: String, enum: SERVICE_TYPES, required: true },

    // only one of these will be set
    accommodation: { type: Schema.Types.ObjectId, ref: "Accommodation" },
    meal:          { type: Schema.Types.ObjectId, ref: "MealModel" },
    tourPackage:   { type: Schema.Types.ObjectId, ref: "TourPackage" },
    vehicle:       { type: Schema.Types.ObjectId, ref: "Vehicle" },

    // snapshot for UI stability
    name:   { type: String, required: true, trim: true },
    image:  { type: String, default: "" },
    code:   { type: String, default: "" },

    // pricing
    currency:   { type: String, default: "LKR" },
    unitPrice:  { type: Number, required: true, min: 0 },
    qty:        { type: Number, default: 1, min: 1 },

    // optional date window for items (accommodation/vehicle/tour)
    startDate:  { type: Date },
    endDate:    { type: Date },
    duration:   { type: String, default: "" }, // tour duration (e.g., "3 days", "5 days")
    notes:      { type: String, default: "" },
  },
  { _id: true, timestamps: false }
);

const CartSchema = new Schema(
  {
    customer: { type: Schema.Types.ObjectId, ref: "User", unique: true, index: true },
    items:    { type: [CartItemSchema], default: [] },
    currency: { type: String, default: "LKR" },
    subtotal: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    tax:      { type: Number, default: 0 },
    fees:     { type: Number, default: 0 },
    total:    { type: Number, default: 0 },
  },
  { timestamps: true }
);

CartSchema.methods.recalc = function () {
  const sub = this.items.reduce((s, it) => s + (Number(it.unitPrice) * Number(it.qty || 1)), 0);
  this.subtotal = Math.max(0, sub);
  const discount = Number(this.discount || 0);
  const tax = Number(this.tax || 0);
  const fees = Number(this.fees || 0);
  this.total = Math.max(0, this.subtotal - discount + tax + fees);
};

const Cart = mongoose.model("Cart", CartSchema);
export default Cart;
