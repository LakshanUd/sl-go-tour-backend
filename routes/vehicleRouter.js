// routes/vehicleRoute.js
import express from "express";
import verifyJWT from "../middlewares/auth.js";
import {
  createVehicle,
  deleteVehicle,
  getVehicleById,
  getVehicles,
  updateVehicle,
} from "../controllers/vehicleController.js";

const vehicleRouter = express.Router();

// Public reads
vehicleRouter.get("/", getVehicles);
vehicleRouter.get("/:vehicleID", getVehicleById);

// Protected writes
vehicleRouter.post("/", verifyJWT, createVehicle);
vehicleRouter.put("/:vehicleID", verifyJWT, updateVehicle);
vehicleRouter.delete("/:vehicleID", verifyJWT, deleteVehicle);

export default vehicleRouter;
