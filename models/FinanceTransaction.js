// models/FinanceTransaction.js
import mongoose from "mongoose";

const { Schema } = mongoose;

export const FINANCE_TYPES = ["invoice", "payment", "refund", "adjustment"];
export const FINANCE_STATUS = ["open", "paid", "partial", "void", "refunded"];
export const PAYMENT_METHODS = ["card", "cash", "bank_transfer", "paypal", "stripe", "other"];

const FinanceTransactionSchema = new Schema(
  {
    referenceID: {
      type: String,
      unique: true,
      default: () =>
        `TX-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math
          .random()
          .toString(36)
          .slice(2, 6)
          .toUpperCase()}`,
      index: true,
    },

    booking:  { type: Schema.Types.ObjectId, ref: "Booking", index: true },
    customer: { type: Schema.Types.ObjectId, ref: "User", index: true },

    // Optional: snapshot for analytics (what’s inside the booking)
    serviceTypes: [{ type: String, enum: ["Accommodation", "Meal", "TourPackage", "Vehicle"] }],

    type:   { type: String, enum: FINANCE_TYPES, required: true, index: true },
    status: { type: String, enum: FINANCE_STATUS, default: "open", index: true },

    currency: { type: String, default: "USD" },

    // Totals (absolute numbers; signs implied by type if needed)
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    tax:      { type: Number, default: 0, min: 0 },
    fees:     { type: Number, default: 0, min: 0 },
    total:    { type: Number, required: true, min: 0 },

    // Payment attributes (for type=payment/refund)
    method:     { type: String, enum: PAYMENT_METHODS },
    gateway:    { type: String },  // Stripe/PayPal/etc
    externalRef:{ type: String },  // PSP charge id, bank slip, etc.

    dueDate:    { type: Date },    // for invoices
    paidAt:     { type: Date },    // for payments
    refundedAt: { type: Date },    // for refunds

    memo: { type: String, default: "" },
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

FinanceTransactionSchema.index({ createdAt: -1 });
FinanceTransactionSchema.index({ type: 1, status: 1, createdAt: -1 });
FinanceTransactionSchema.index({ currency: 1, createdAt: -1 });

const FinanceTransaction = mongoose.model("FinanceTransaction", FinanceTransactionSchema);
export default FinanceTransaction;
