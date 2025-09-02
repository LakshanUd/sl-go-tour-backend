// controllers/InventoryController.js
import mongoose from "mongoose";
import Inventory from "../models/InventoryModel.js";

const isValidObjectId = (v) => mongoose.Types.ObjectId.isValid(v);

// GET /api/inventory
export const getAllInventory = async (req, res, next) => {
  try {
    const items = await Inventory.find({}).sort({ createdAt: -1 });
    res.status(200).json(items);
  } catch (err) {
    next(err);
  }
};

// POST /api/inventory
export const addInventory = async (req, res, next) => {
  try {
    const {
      item, type, quantity, unitCost,
      name, category, description, location,
      purchaseDate, expiryDate
    } = req.body;

    if (!item) return res.status(400).json({ error: "item is required" });
    if (!isValidObjectId(item)) {
      return res.status(400).json({ error: "item must be a valid ObjectId" });
    }

    const doc = await Inventory.create({
      item,
      type,
      quantity,
      unitCost,
      name,
      category,
      description,
      location,
      purchaseDate,
      expiryDate,
    });

    res.status(201).json(doc);
  } catch (err) {
    next(err);
  }
};

// GET /api/inventory/:id
export const getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ error: "invalid id" });

    const doc = await Inventory.findById(id);
    if (!doc) return res.status(404).json({ error: "Inventory not found" });

    res.status(200).json(doc);
  } catch (err) {
    next(err);
  }
};

// PUT /api/inventory/:id
export const updateInventory = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ error: "invalid id" });

    if (req.body.item && !isValidObjectId(req.body.item)) {
      return res.status(400).json({ error: "item must be a valid ObjectId" });
    }

    const updated = await Inventory.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updated) return res.status(404).json({ error: "Inventory not found" });
    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/inventory/:id
export const deleteInventory = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ error: "invalid id" });

    const deleted = await Inventory.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: "Inventory not found" });

    res.status(200).json(deleted);
  } catch (err) {
    next(err);
  }
};
