// routes/InventoryRoute.js
import express from "express";
import {
  getAllInventory,
  addInventory,
  getById,
  updateInventory,
  deleteInventory,
} from "../controllers/InventoryController.js";

const inventoryRouter = express.Router();

// base path from index.js: /api/inventory
inventoryRouter.get("/", getAllInventory);
inventoryRouter.post("/", addInventory);
inventoryRouter.get("/:id", getById);
inventoryRouter.put("/:id", updateInventory);
inventoryRouter.delete("/:id", deleteInventory);

export default inventoryRouter;
