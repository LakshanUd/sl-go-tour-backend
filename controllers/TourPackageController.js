// Controllers/TourPackageController.js
import mongoose from "mongoose";
import TourPackage from "../models/TourPackage.js";

const { isValidObjectId } = mongoose;

/* Normalize array of ids safely */
function toIdArray(v) {
  if (!v) return [];
  const arr = Array.isArray(v) ? v : [v];
  return arr
    .map(String)
    .filter((s) => isValidObjectId(s));
}

// create
export async function createTourPackage(req, res) {
  if (req.user == null) {
    return res.status(403).json({ message: "You need to login first" });
  }
  if (req.user.role != "Admin") {
    return res.status(403).json({ message: "You cannot add tour packages" });
  }

  try {
    const body = req.body || {};

    const doc = new TourPackage({
      tourPakage_ID: body.tourPakage_ID,
      name: body.name,
      type: body.type,
      description: body.description,
      price: body.price,
      duration: body.duration,
      images: Array.isArray(body.images) ? body.images : [],
      accommodations: toIdArray(body.accommodations),
      vehicles: toIdArray(body.vehicles),
      meals: toIdArray(body.meals),
    });

    await doc.save();
    res.status(201).json({ message: "Tour package created successfully", tour: doc });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

// read all (populate names so UI can show labels)
export async function getTourPackages(req, res) {
  try {
    const tours = await TourPackage.find()
      .populate("accommodations", "name type pricePerNight")
      .populate("vehicles", "vehicleID brand type seatingCapacity")
      .populate("meals", "name price catogery");
    res.status(200).json(tours);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

// read one by business id (param: :tourPakage_ID)
export async function getTourPackageById(req, res) {
  try {
    const tour = await TourPackage.findOne({ tourPakage_ID: req.params.tourPakage_ID })
      .populate("accommodations", "name type pricePerNight")
      .populate("vehicles", "vehicleID brand type seatingCapacity")
      .populate("meals", "name price catogery");
    if (!tour) {
      return res.status(404).json({ message: "Tour package not found" });
    }
    res.status(200).json(tour);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

// update by business id (param: :tourPakage_ID)
export async function updateTourPackage(req, res) {
  if (req.user == null) {
    return res.status(403).json({ message: "You need to login first" });
  }
  if (req.user.role != "Admin") {
    return res.status(403).json({ message: "You cannot update tour packages" });
  }

  try {
    const body = req.body || {};
    const patch = {
      ...(body.tourPakage_ID !== undefined && { tourPakage_ID: body.tourPakage_ID }),
      ...(body.name !== undefined && { name: body.name }),
      ...(body.type !== undefined && { type: body.type }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.price !== undefined && { price: body.price }),
      ...(body.duration !== undefined && { duration: body.duration }),
      ...(body.images !== undefined && { images: Array.isArray(body.images) ? body.images : [] }),
    };

    if (body.accommodations !== undefined) patch.accommodations = toIdArray(body.accommodations);
    if (body.vehicles !== undefined)       patch.vehicles       = toIdArray(body.vehicles);
    if (body.meals !== undefined)          patch.meals          = toIdArray(body.meals);

    const updatedTour = await TourPackage.findOneAndUpdate(
      { tourPakage_ID: req.params.tourPakage_ID },
      patch,
      { new: true }
    )
      .populate("accommodations", "name type pricePerNight")
      .populate("vehicles", "vehicleID brand type seatingCapacity")
      .populate("meals", "name price catogery");

    if (!updatedTour) {
      return res.status(404).json({ message: "Tour package not found" });
    }
    res.status(200).json({ message: "Tour package updated", updatedTour });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

// delete by business id (param: :tourPakage_ID)
export async function deleteTourPackage(req, res) {
  if (req.user == null) {
    return res.status(403).json({ message: "You need to login first" });
  }
  if (req.user.role != "Admin") {
    return res.status(403).json({ message: "You cannot delete tour packages" });
  }

  try {
    const deletedTour = await TourPackage.findOneAndDelete({
      tourPakage_ID: req.params.tourPakage_ID,
    });
    if (!deletedTour) {
      return res.status(404).json({ message: "Tour package not found" });
    }
    res.status(200).json({ message: "Tour package deleted" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}
