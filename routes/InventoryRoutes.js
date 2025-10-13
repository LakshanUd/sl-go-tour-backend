// routes/InventoryRoute.js
import express from "express";
import verifyJWT from "../middlewares/auth.js";
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
inventoryRouter.get("/:id", getById);

// Protected operations - require authentication
inventoryRouter.post("/", verifyJWT, addInventory);
inventoryRouter.put("/:id", verifyJWT, updateInventory);
inventoryRouter.delete("/:id", verifyJWT, deleteInventory);

export default inventoryRouter;
