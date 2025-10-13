// models/SimpleFinance.js
import mongoose from "mongoose";

const simpleFinanceSchema = new mongoose.Schema(
  {
    // Auto-generated booking ID for income transactions
    bookingID: {
      type: String,
      unique: true,
      sparse: true, // allows null values
      default: function() {
        if (this.type === "income") {
          return `BK-${new Date().toISOString().slice(0,10).replace(/-/g, "")}-${Math
            .random()
            .toString(36)
            .slice(2, 6)
            .toUpperCase()}`;
        }
        return null;
      }
    },

    // Reference to booking for income transactions
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      index: true,
    },

    // Reference to inventory for expense transactions
    inventory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inventory",
      index: true,
    },

    // Basic transaction fields
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },

    type: {
      type: String,
      required: true,
      enum: ["income", "expense"],
      index: true,
    },

    category: {
      type: String,
      required: true,
      enum: ["Tour Package", "Vehicle", "Accommodation", "Meal", "Misc"],
      index: true,
    },

    method: {
      type: String,
      required: true,
      enum: ["cash", "card", "bank_transfer", "online"],
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      default: "LKR",
    },

    reference: {
      type: String,
      default: "",
    },

    notes: {
      type: String,
      default: "",
    },

    // Additional metadata
    txnId: {
      type: String,
      unique: true,
      default: function() {
        return `TXN-${new Date().toISOString().slice(0,10).replace(/-/g, "")}-${Math
          .random()
          .toString(36)
          .slice(2, 8)
          .toUpperCase()}`;
      }
    },
  },
  { timestamps: true }
);

// Indexes for better performance
simpleFinanceSchema.index({ type: 1, createdAt: -1 });
simpleFinanceSchema.index({ category: 1, type: 1 });
simpleFinanceSchema.index({ booking: 1 });
simpleFinanceSchema.index({ inventory: 1 });

const SimpleFinance = mongoose.model("SimpleFinance", simpleFinanceSchema);
export default SimpleFinance;
