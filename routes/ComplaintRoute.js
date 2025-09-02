import { Router } from "express";
import {
  getAllComplaints,
  addComplaints,
  getById,
  updateComplaints,
  deleteComplaints,
} from "../controllers/ComplaintControl.js";

const router = Router();

router.get("/", getAllComplaints);
router.post("/", addComplaints);
router.get("/:id", getById);
router.put("/:id", updateComplaints);
router.delete("/:id", deleteComplaints);

export default router;
