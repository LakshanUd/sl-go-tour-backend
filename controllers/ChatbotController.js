// controllers/ChatbotController.js
import Chatbot from "../models/ChatbotModel.js";
import Chat from "../models/ChatModel.js";
import User from "../models/UserModel.js";

// Get all chatbots
export const getAllChatbots = async (req, res) => {
  try {
    const chatbots = await Chatbot.find()
      .populate("createdBy", "firstName lastName email")
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: chatbots.length,
      chatbots,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch chatbots",
      error: error.message,
    });
  }
};

// Get active chatbot
export const getActiveChatbot = async (req, res) => {
  try {
    const chatbot = await Chatbot.findOne({ 
      status: "active", 
      isEnabled: true 
    });
    
    if (!chatbot) {
      return res.status(404).json({
        success: false,
        message: "No active chatbot found",
      });
    }
    
    res.status(200).json({
      success: true,
      chatbot,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch active chatbot",
      error: error.message,
    });
  }
};

// Get single chatbot
export const getChatbotById = async (req, res) => {
  try {
    const chatbot = await Chatbot.findById(req.params.id)
      .populate("createdBy", "firstName lastName email");
    
    if (!chatbot) {
      return res.status(404).json({
        success: false,
        message: "Chatbot not found",
      });
    }
    
    res.status(200).json({
      success: true,
      chatbot,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch chatbot",
      error: error.message,
    });
  }
};

// Create chatbot
export const createChatbot = async (req, res) => {
  try {
    const { name, description, welcomeMessage, status, isEnabled, maxMessages, responseDelay } = req.body;
    
    // Get user from token
    const userId = req.user?.id;
    
    const chatbot = new Chatbot({
      name,
      description,
      welcomeMessage,
      status: status || "active",
      isEnabled: isEnabled !== undefined ? isEnabled : true,
      maxMessages: maxMessages || 50,
      responseDelay: responseDelay || 1000,
      createdBy: userId,
    });
    
    await chatbot.save();
    
    res.status(201).json({
      success: true,
      message: "Chatbot created successfully",
      chatbot,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create chatbot",
      error: error.message,
    });
  }
};

// Update chatbot
export const updateChatbot = async (req, res) => {
  try {
    const { name, description, welcomeMessage, status, isEnabled, maxMessages, responseDelay, adminNote } = req.body;
    
    const chatbot = await Chatbot.findById(req.params.id);
    
    if (!chatbot) {
      return res.status(404).json({
        success: false,
        message: "Chatbot not found",
      });
    }
    
    // Update fields
    if (name) chatbot.name = name;
    if (description !== undefined) chatbot.description = description;
    if (welcomeMessage) chatbot.welcomeMessage = welcomeMessage;
    if (status) chatbot.status = status;
    if (isEnabled !== undefined) chatbot.isEnabled = isEnabled;
    if (maxMessages) chatbot.maxMessages = maxMessages;
    if (responseDelay !== undefined) chatbot.responseDelay = responseDelay;
    if (adminNote !== undefined) chatbot.adminNote = adminNote;
    
    await chatbot.save();
    
    res.status(200).json({
      success: true,
      message: "Chatbot updated successfully",
      chatbot,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update chatbot",
      error: error.message,
    });
  }
};

// Toggle chatbot status
export const toggleChatbot = async (req, res) => {
  try {
    const chatbot = await Chatbot.findById(req.params.id);
    
    if (!chatbot) {
      return res.status(404).json({
        success: false,
        message: "Chatbot not found",
      });
    }
    
    chatbot.isEnabled = !chatbot.isEnabled;
    await chatbot.save();
    
    res.status(200).json({
      success: true,
      message: `Chatbot ${chatbot.isEnabled ? "enabled" : "disabled"} successfully`,
      chatbot,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to toggle chatbot",
      error: error.message,
    });
  }
};

// Delete chatbot
export const deleteChatbot = async (req, res) => {
  try {
    const chatbot = await Chatbot.findById(req.params.id);
    
    if (!chatbot) {
      return res.status(404).json({
        success: false,
        message: "Chatbot not found",
      });
    }
    
    // Also delete related chats
    await Chat.deleteMany({ chatbotId: chatbot._id });
    
    await Chatbot.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      success: true,
      message: "Chatbot deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete chatbot",
      error: error.message,
    });
  }
};

// FAQ Management Functions

// Add FAQ to chatbot
export const addFAQ = async (req, res) => {
  try {
    const { question, answer, keywords, category, priority } = req.body;
    
    if (!question || !answer) {
      return res.status(400).json({
        success: false,
        message: "Question and answer are required",
      });
    }
    
    const chatbot = await Chatbot.findById(req.params.id);
    
    if (!chatbot) {
      return res.status(404).json({
        success: false,
        message: "Chatbot not found",
      });
    }
    
    const newFAQ = {
      question,
      answer,
      keywords: keywords || [],
      category: category || "General",
      priority: priority || 1,
      isActive: true,
    };
    
    chatbot.faqs.push(newFAQ);
    await chatbot.save();
    
    res.status(201).json({
      success: true,
      message: "FAQ added successfully",
      faq: newFAQ,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to add FAQ",
      error: error.message,
    });
  }
};

// Update FAQ
export const updateFAQ = async (req, res) => {
  try {
    const { chatbotId, faqId } = req.params;
    const { question, answer, keywords, category, priority, isActive } = req.body;
    
    const chatbot = await Chatbot.findById(chatbotId);
    
    if (!chatbot) {
      return res.status(404).json({
        success: false,
        message: "Chatbot not found",
      });
    }
    
    const faq = chatbot.faqs.id(faqId);
    
    if (!faq) {
      return res.status(404).json({
        success: false,
        message: "FAQ not found",
      });
    }
    
    if (question) faq.question = question;
    if (answer) faq.answer = answer;
    if (keywords) faq.keywords = keywords;
    if (category) faq.category = category;
    if (priority) faq.priority = priority;
    if (isActive !== undefined) faq.isActive = isActive;
    
    await chatbot.save();
    
    res.status(200).json({
      success: true,
      message: "FAQ updated successfully",
      faq,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update FAQ",
      error: error.message,
    });
  }
};

// Delete FAQ
export const deleteFAQ = async (req, res) => {
  try {
    const { chatbotId, faqId } = req.params;
    
    const chatbot = await Chatbot.findById(chatbotId);
    
    if (!chatbot) {
      return res.status(404).json({
        success: false,
        message: "Chatbot not found",
      });
    }
    
    const faq = chatbot.faqs.id(faqId);
    
    if (!faq) {
      return res.status(404).json({
        success: false,
        message: "FAQ not found",
      });
    }
    
    chatbot.faqs.pull(faqId);
    await chatbot.save();
    
    res.status(200).json({
      success: true,
      message: "FAQ deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete FAQ",
      error: error.message,
    });
  }
};

// Get all FAQs for a chatbot
export const getFAQs = async (req, res) => {
  try {
    const chatbot = await Chatbot.findById(req.params.id);
    
    if (!chatbot) {
      return res.status(404).json({
        success: false,
        message: "Chatbot not found",
      });
    }
    
    res.status(200).json({
      success: true,
      faqs: chatbot.faqs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch FAQs",
      error: error.message,
    });
  }
};

// Send message to chatbot
export const sendMessage = async (req, res) => {
  try {
    const { message } = req.body;
    const { name, email, phone } = req.body.user || {};
    
    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }
    
    // Get active chatbot
    const chatbot = await Chatbot.findOne({ 
      status: "active", 
      isEnabled: true 
    });
    
    if (!chatbot) {
      return res.status(404).json({
        success: false,
        message: "No active chatbot available",
      });
    }
    
    // Create chat record
    const chat = new Chat({
      user: {
        name: name || "Anonymous",
        email: email || "anonymous@example.com",
        phone: phone || "",
      },
      message,
      chatbotId: chatbot._id,
      sessionId: req.body.sessionId || `session_${Date.now()}`,
    });
    
    await chat.save();
    
    // Find best matching FAQ
    let bestMatch = null;
    let bestScore = 0;
    
    const userMessage = message.toLowerCase();
    
    // Search through FAQs
    for (const faq of chatbot.faqs) {
      if (!faq.isActive) continue;
      
      let score = 0;
      
      // Check question similarity
      const questionWords = faq.question.toLowerCase().split(/\s+/);
      const messageWords = userMessage.split(/\s+/);
      
      // Count matching words
      for (const word of messageWords) {
        if (questionWords.some(qWord => qWord.includes(word) || word.includes(qWord))) {
          score += 1;
        }
      }
      
      // Check keywords
      if (faq.keywords && faq.keywords.length > 0) {
        for (const keyword of faq.keywords) {
          if (userMessage.includes(keyword.toLowerCase())) {
            score += 2; // Keywords have higher weight
          }
        }
      }
      
      // Apply priority multiplier
      score *= faq.priority;
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = faq;
      }
    }
    
    // Determine response
    let response;
    if (bestMatch && bestScore > 0) {
      response = bestMatch.answer;
    } else {
      response = chatbot.fallbackMessage;
    }
    
    // Update chat with response
    chat.response = response;
    await chat.save();
    
    // Simulate response delay
    setTimeout(() => {
      res.status(200).json({
        success: true,
        message: "Message sent successfully",
        response: response,
        chatId: chat._id,
        matched: bestMatch ? true : false,
        faqId: bestMatch ? bestMatch._id : null,
      });
    }, chatbot.responseDelay);
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to send message",
      error: error.message,
    });
  }
};
