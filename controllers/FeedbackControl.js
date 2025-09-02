import Feedback from "../models/FeedbackModel.js";

// GET /feedbacks
export const getAllFeedbacks = async (req, res) => {
  try {
    const feedbacks = await Feedback.find();
    // Return 200 with an array even if empty (easier for frontend)
    return res.status(200).json({ feedbacks });
  } catch (err) {
    console.error("getAllFeedbacks error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// POST /feedbacks
export const addFeedbacks = async (req, res) => {
  try {
    const { name, email, message, rating, date } = req.body;
    const fb = new Feedback({ name, email, message, rating, date });
    await fb.save();
    return res.status(201).json({ feedbacks: fb });
  } catch (err) {
    console.error("addFeedbacks error:", err);
    return res.status(500).json({ message: "Unable to add feedbacks" });
  }
};

// GET /feedbacks/:id
export const getById = async (req, res) => {
  try {
    const fb = await Feedback.findById(req.params.id);
    if (!fb) return res.status(404).json({ message: "Feedback not found" });
    return res.status(200).json({ feedbacks: fb });
  } catch (err) {
    console.error("getById error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// PUT /feedbacks/:id
export const updateFeedbacks = async (req, res) => {
  try {
    const { name, email, message, rating, date } = req.body;
    const fb = await Feedback.findByIdAndUpdate(
      req.params.id,
      { name, email, message, rating, date },
      { new: true, runValidators: true }
    );
    if (!fb) return res.status(404).json({ message: "Unable to update feedback details" });
    return res.status(200).json({ feedbacks: fb });
  } catch (err) {
    console.error("updateFeedbacks error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// DELETE /feedbacks/:id
export const deleteFeedbacks = async (req, res) => {
  try {
    const fb = await Feedback.findByIdAndDelete(req.params.id);
    if (!fb) return res.status(404).json({ message: "Feedback not found" });
    return res.status(200).json({ feedbacks: fb });
  } catch (err) {
    console.error("deleteFeedbacks error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
