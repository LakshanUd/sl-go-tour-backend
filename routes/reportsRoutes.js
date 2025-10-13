// routes/reportsRoutes.js
import express from "express";
import {
  getTourPackageReports,
  getBlogReports,
  getMealReports,
  getAccommodationReports,
  getVehicleReports,
  getFeedbackReports,
  getComplaintReports,
  getInventoryReports,
  getUserReports,
  getFinanceReports,
  getBookingReports
} from "../controllers/ReportsController.js";
import verifyJWT from "../middlewares/auth.js";

const router = express.Router();

// All report routes require authentication
router.use(verifyJWT);

// Report endpoints
router.get("/tour-packages", getTourPackageReports);
router.get("/blogs", getBlogReports);
router.get("/meals", getMealReports);
router.get("/accommodations", getAccommodationReports);
router.get("/vehicles", getVehicleReports);
router.get("/feedbacks", getFeedbackReports);
router.get("/complaints", getComplaintReports);
router.get("/inventory", getInventoryReports);
router.get("/users", getUserReports);
router.get("/finance", getFinanceReports);
router.get("/bookings", getBookingReports);

export default router;