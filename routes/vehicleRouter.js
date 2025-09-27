// routes/vehicleRoute.js
import express from "express";
import {
  createVehicle,
  deleteVehicle,
  getVehicleById,
  getVehicles,
  updateVehicle,
} from "../controllers/vehicleController.js";

const vehicleRouter = express.Router();

vehicleRouter.post("/", createVehicle);
vehicleRouter.get("/", getVehicles);
vehicleRouter.get("/:vehicleID", getVehicleById);
vehicleRouter.put("/:vehicleID", updateVehicle);
vehicleRouter.delete("/:vehicleID", deleteVehicle);

export default vehicleRouter;
