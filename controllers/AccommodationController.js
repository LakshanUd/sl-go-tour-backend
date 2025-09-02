
// controllers/AccommodationController.js
import Accommodation from "../models/AccommodationModel.js";

// CREATE
export const createAccommodation = async (req, res) => {
  try {
    const accommodation = new Accommodation(req.body);
    await accommodation.save();
    res.status(201).json(accommodation);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// READ ALL
export const getAccommodations = async (req, res) => {
  try {
    const accommodations = await Accommodation.find().sort({ createdAt: -1 });
    res.status(200).json(accommodations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// READ ONE
export const getAccommodationById = async (req, res) => {
  try {
    const { accommodationID } = req.params;
    const accommodation = await Accommodation.findById(accommodationID);
    if (!accommodation) {
      return res.status(404).json({ error: "Accommodation not found" });
    }
    res.status(200).json(accommodation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE
export const updateAccommodation = async (req, res) => {
  try {
    const { accommodationID } = req.params;
    const updated = await Accommodation.findByIdAndUpdate(
      accommodationID,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ error: "Accommodation not found" });
    }
    res.status(200).json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// DELETE
export const deleteAccommodation = async (req, res) => {
  try {
    const { accommodationID } = req.params;
    const deleted = await Accommodation.findByIdAndDelete(accommodationID);
    if (!deleted) {
      return res.status(404).json({ error: "Accommodation not found" });
    }
    res.status(200).json({ message: "Accommodation deleted", deleted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
