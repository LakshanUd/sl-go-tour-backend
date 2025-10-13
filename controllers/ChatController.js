// controllers/ChatController.js
import Chat from "../models/ChatModel.js";
import Chatbot from "../models/ChatbotModel.js";

// Get all chats
export const getAllChats = async (req, res) => {
  try {
    const { page = 1, limit = 50, chatbotId, email, isResolved } = req.query;
    
    const query = {};
    if (chatbotId) query.chatbotId = chatbotId;
    if (email) query["user.email"] = email;
    if (isResolved !== undefined) query.isResolved = isResolved === "true";
    
    const chats = await Chat.find(query)
      .populate("chatbotId", "name status")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Chat.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: chats.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      chats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch chats",
      error: error.message,
    });
  }
};

// Get single chat
export const getChatById = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id)
      .populate("chatbotId", "name status");
    
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }
    
    res.status(200).json({
      success: true,
      chat,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch chat",
      error: error.message,
    });
  }
};

// Get chats by session
export const getChatsBySession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const chats = await Chat.find({ sessionId })
      .populate("chatbotId", "name status")
      .sort({ createdAt: 1 });
    
    res.status(200).json({
      success: true,
      count: chats.length,
      chats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch session chats",
      error: error.message,
    });
  }
};

// Get chats by user email
export const getChatsByUser = async (req, res) => {
  try {
    const { email } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const chats = await Chat.find({ "user.email": email })
      .populate("chatbotId", "name status")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Chat.countDocuments({ "user.email": email });
    
    res.status(200).json({
      success: true,
      count: chats.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      chats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch user chats",
      error: error.message,
    });
  }
};

// Update chat
export const updateChat = async (req, res) => {
  try {
    const { isResolved, rating, tags } = req.body;
    
    const chat = await Chat.findById(req.params.id);
    
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }
    
    if (isResolved !== undefined) chat.isResolved = isResolved;
    if (rating) chat.rating = rating;
    if (tags) chat.tags = tags;
    
    await chat.save();
    
    res.status(200).json({
      success: true,
      message: "Chat updated successfully",
      chat,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update chat",
      error: error.message,
    });
  }
};

// Delete chat
export const deleteChat = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);
    
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }
    
    await Chat.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      success: true,
      message: "Chat deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete chat",
      error: error.message,
    });
  }
};

// Get chat statistics
export const getChatStats = async (req, res) => {
  try {
    const { chatbotId, startDate, endDate } = req.query;
    
    const query = {};
    if (chatbotId) query.chatbotId = chatbotId;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    const [
      totalChats,
      resolvedChats,
      todayChats,
      avgRating,
    ] = await Promise.all([
      Chat.countDocuments(query),
      Chat.countDocuments({ ...query, isResolved: true }),
      Chat.countDocuments({
        ...query,
        createdAt: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          $lte: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      }),
      Chat.aggregate([
        { $match: { ...query, rating: { $exists: true } } },
        { $group: { _id: null, avgRating: { $avg: "$rating" } } },
      ]),
    ]);
    
    res.status(200).json({
      success: true,
      stats: {
        totalChats,
        resolvedChats,
        unresolvedChats: totalChats - resolvedChats,
        todayChats,
        resolutionRate: totalChats > 0 ? ((resolvedChats / totalChats) * 100).toFixed(2) : 0,
        avgRating: avgRating.length > 0 ? avgRating[0].avgRating.toFixed(2) : 0,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch chat statistics",
      error: error.message,
    });
  }
};
