import { Router } from "express";
import {
  getAllFeedbacks,
  addFeedbacks,
  getById,
  updateFeedbacks,
  deleteFeedbacks,
} from "../controllers/FeedbackControl.js";

const router = Router();

router.get("/", getAllFeedbacks);
router.post("/", addFeedbacks);
router.get("/:id", getById);
router.put("/:id", updateFeedbacks);
router.delete("/:id", deleteFeedbacks);

export default router;
