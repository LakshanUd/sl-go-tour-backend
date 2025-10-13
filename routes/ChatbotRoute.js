// routes/ChatbotRoute.js
import express from "express";
import {
  getAllChatbots,
  getActiveChatbot,
  getChatbotById,
  createChatbot,
  updateChatbot,
  toggleChatbot,
  deleteChatbot,
  sendMessage,
  addFAQ,
  updateFAQ,
  deleteFAQ,
  getFAQs,
} from "../controllers/ChatbotController.js";
import verifyJWT from "../middlewares/auth.js";

const router = express.Router();

// Public routes (no authentication required)
router.get("/active", getActiveChatbot);
router.post("/chat", sendMessage);

// Protected routes (authentication required)
router.get("/", verifyJWT, getAllChatbots);
router.get("/:id", verifyJWT, getChatbotById);
router.post("/", verifyJWT, createChatbot);
router.put("/:id", verifyJWT, updateChatbot);
router.patch("/:id/toggle", verifyJWT, toggleChatbot);
router.delete("/:id", verifyJWT, deleteChatbot);

// FAQ Management routes
router.get("/:id/faqs", verifyJWT, getFAQs);
router.post("/:id/faqs", verifyJWT, addFAQ);
router.put("/:chatbotId/faqs/:faqId", verifyJWT, updateFAQ);
router.delete("/:chatbotId/faqs/:faqId", verifyJWT, deleteFAQ);

export default router;
