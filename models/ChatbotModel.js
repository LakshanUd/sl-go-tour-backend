// models/ChatbotModel.js
import mongoose from "mongoose";

const faqSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true,
  },
  answer: {
    type: String,
    required: true,
    trim: true,
  },
  keywords: [{
    type: String,
    trim: true,
  }],
  category: {
    type: String,
    trim: true,
    default: "General",
  },
  priority: {
    type: Number,
    default: 1,
    min: 1,
    max: 10,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

const chatbotSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  welcomeMessage: {
    type: String,
    required: true,
    trim: true,
  },
  status: {
    type: String,
    enum: ["active", "inactive", "maintenance"],
    default: "active",
  },
  isEnabled: {
    type: Boolean,
    default: true,
  },
  maxMessages: {
    type: Number,
    default: 50,
    min: 1,
    max: 1000,
  },
  responseDelay: {
    type: Number,
    default: 1000,
    min: 0,
    max: 10000,
  },
  faqs: [faqSchema],
  fallbackMessage: {
    type: String,
    default: "I'm sorry, I couldn't find a relevant answer to your question. Please contact our support team for assistance.",
  },
  adminNote: {
    type: String,
    trim: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
}, {
  timestamps: true,
});

// Index for better query performance
chatbotSchema.index({ status: 1, isEnabled: 1 });
chatbotSchema.index({ createdAt: -1 });
chatbotSchema.index({ "faqs.keywords": 1 });
chatbotSchema.index({ "faqs.category": 1 });

export default mongoose.model("Chatbot", chatbotSchema);
