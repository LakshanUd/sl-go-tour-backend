//controller/ComplaintControl.js
import Complaint from "../models/ComplaintModel.js";

// GET /complaints
export const getAllComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find();
    // Return 200 with an array even if empty (better for frontend)
    return res.status(200).json({ complaints });
  } catch (err) {
    console.error("getAllComplaints error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// POST /complaints
export const addComplaints = async (req, res) => {
  try {
    const { name, email, service, category, description, status } = req.body;
    const comp = new Complaint({ name, email, service, category, description, status });
    await comp.save();
    return res.status(201).json({ complaints: comp });
  } catch (err) {
    console.error("addComplaints error:", err);
    return res.status(500).json({ message: "Unable to add complaints" });
  }
};

// GET /complaints/:id
export const getById = async (req, res) => {
  try {
    const comp = await Complaint.findById(req.params.id);
    if (!comp) return res.status(404).json({ message: "Complaint not found" });
    return res.status(200).json({ complaints: comp });
  } catch (err) {
    console.error("getById error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// PUT /complaints/:id
export const updateComplaints = async (req, res) => {
  try {
    const { name, email, service, category, description, status } = req.body;
    const comp = await Complaint.findByIdAndUpdate(
      req.params.id,
      { name, email, service, category, description, status },
      { new: true, runValidators: true }
    );
    if (!comp) return res.status(404).json({ message: "Unable to update complaint details" });
    return res.status(200).json({ complaints: comp });
  } catch (err) {
    console.error("updateComplaints error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// DELETE /complaints/:id
export const deleteComplaints = async (req, res) => {
  try {
    const comp = await Complaint.findByIdAndDelete(req.params.id);
    if (!comp) return res.status(404).json({ message: "Complaint not found" });
    return res.status(200).json({ complaints: comp });
  } catch (err) {
    console.error("deleteComplaints error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
