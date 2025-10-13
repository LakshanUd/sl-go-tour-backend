// routes/ChatRoute.js
import express from "express";
import {
  getAllChats,
  getChatById,
  getChatsBySession,
  getChatsByUser,
  updateChat,
  deleteChat,
  getChatStats,
} from "../controllers/ChatController.js";
import verifyJWT from "../middlewares/auth.js";

const router = express.Router();

// All routes require authentication
router.get("/", verifyJWT, getAllChats);
router.get("/stats", verifyJWT, getChatStats);
router.get("/session/:sessionId", verifyJWT, getChatsBySession);
router.get("/user/:email", verifyJWT, getChatsByUser);
router.get("/:id", verifyJWT, getChatById);
router.put("/:id", verifyJWT, updateChat);
router.delete("/:id", verifyJWT, deleteChat);

export default router;
