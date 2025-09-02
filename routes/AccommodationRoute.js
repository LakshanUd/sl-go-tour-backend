// routes/AccommodationRoute.js
import express from "express";
import {
  createAccommodation,
  getAccommodations,
  getAccommodationById,
  updateAccommodation,
  deleteAccommodation,
} from "../controllers/AccommodationController.js";

const accommodationRouter = express.Router();

// CRUD routes
accommodationRouter.post("/", createAccommodation);        // Create
accommodationRouter.get("/", getAccommodations);           // Read all
accommodationRouter.get("/:accommodationID", getAccommodationById); // Read one
accommodationRouter.put("/:accommodationID", updateAccommodation);  // Update
accommodationRouter.delete("/:accommodationID", deleteAccommodation); // Delete

export default accommodationRouter;
