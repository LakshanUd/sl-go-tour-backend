import { Router } from "express";
import verifyJWT from "../middlewares/auth.js";
import {
  createBooking,
  getBookings,
  getBookingById,
  updateBooking,
  cancelBooking,
  deleteBooking,
} from "../controllers/bookingController.js";

const router = Router();

router.use(verifyJWT); // all booking ops require login

router.get("/", getBookings);
router.get("/:id", getBookingById);
router.post("/", createBooking);
router.put("/:id", updateBooking);
router.post("/:id/cancel", cancelBooking);
router.delete("/:id", deleteBooking); // Admin only inside controller

export default router;
