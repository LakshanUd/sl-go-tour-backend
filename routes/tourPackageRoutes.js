// routes/tourPackageRoutes.js
import { Router } from "express";
import verifyJWT from "../middlewares/auth.js";
import {
  createTourPackage,
  getTourPackages,
  getTourPackageById,
  updateTourPackage,
  deleteTourPackage,
} from "../controllers/TourPackageController.js";

const router = Router();

// Public reads
router.get("/", getTourPackages);
router.get("/:tourPakage_ID", getTourPackageById);

// Protected writes
router.post("/", verifyJWT, createTourPackage);
router.put("/:tourPakage_ID", verifyJWT, updateTourPackage);
router.delete("/:tourPakage_ID", verifyJWT, deleteTourPackage);

export default router;
