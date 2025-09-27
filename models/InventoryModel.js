// models/InventoryModel.js  (ESM)
import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema(
  {
    // Auto-generated if not provided
    inventoryID: {
      type: String,
      required: true,
      unique: true,
      default: () =>
        `INV-${new Date().toISOString().slice(0,10).replace(/-/g, "")}-${Math
          .random()
          .toString(36)
          .slice(2, 6)
          .toUpperCase()}`,
    },

    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InventoryItem",
      required: true,
      index: true,
    },

    type: {
      type: String,
      required: true,
      enum: ["RECEIVE", "ISSUE", "ADJUSTMENT", "TRANSFER"],
    },

    quantity: {
      type: Number,
      required: true,
      min: 0,
    },

    unitCost: {
      type: Number,
      min: 0,
      default: 0,
    },

    name: { type: String, required: true, trim: true, index: true },
    category: { type: String, default: "General" },
    description: { type: String, default: "" },
    location: { type: String, default: "Main Warehouse" },
    purchaseDate: { type: Date, default: Date.now },
    expiryDate: { type: Date },

    status: {
      type: String,
      enum: ["in_stock", "out_of_stock", "expired"],
      default: "in_stock",
      index: true,
    },
  },
  { timestamps: true }
);

inventorySchema.index({ type: 1, category: 1 });

const Inventory = mongoose.model("Inventory", inventorySchema);
export default Inventory;
