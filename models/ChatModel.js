// models/ChatModel.js
import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
  user: {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
  },
  message: {
    type: String,
    required: true,
    trim: true,
  },
  response: {
    type: String,
    trim: true,
  },
  chatbotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Chatbot",
  },
  sessionId: {
    type: String,
    trim: true,
  },
  isResolved: {
    type: Boolean,
    default: false,
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
  },
  tags: [{
    type: String,
    trim: true,
  }],
}, {
  timestamps: true,
});

// Index for better query performance
chatSchema.index({ "user.email": 1, createdAt: -1 });
chatSchema.index({ chatbotId: 1, createdAt: -1 });
chatSchema.index({ sessionId: 1 });
chatSchema.index({ isResolved: 1 });

export default mongoose.model("Chat", chatSchema);
