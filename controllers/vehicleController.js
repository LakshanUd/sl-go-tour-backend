// Controllers/vehicleController.js
import Vehicle from "../models/vehicleModel.js";

// create
export async function createVehicle(req, res) {
  if (req.user == null) {
    return res.status(403).json({ message: "You need to login first" });
  }
  if (req.user.role != "Admin") {
    return res.status(403).json({ message: "You cannot add vehicles" });
  }

  try {
    // Optional: friendly validation so you get a clean message before Mongoose throws
    const required = ["vehicleID", "regNo", "brand", "type", "seatingCapacity", "fuelType", "price"];
    const missing = required.filter((k) => req.body[k] === undefined || req.body[k] === null || req.body[k] === "");
    if (missing.length) {
      return res.status(400).json({ message: `Missing required fields: ${missing.join(", ")}` });
    }

    const vehicle = new Vehicle(req.body);
    await vehicle.save();
    res.status(201).json({ message: "Vehicle created successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

export async function getVehicles(req, res) {
  try {
    const vehicles = await Vehicle.find();
    res.status(200).json(vehicles);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

export async function getVehicleById(req, res) {
  try {
    const vehicle = await Vehicle.findOne({ vehicleID: req.params.vehicleID });
    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }
    res.status(200).json(vehicle);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

export async function updateVehicle(req, res) {
  if (req.user == null) {
    return res.status(403).json({ message: "You need to login first" });
  }
  if (req.user.role != "Admin") {
    return res.status(403).json({ message: "You cannot update vehicles" });
  }

  try {
    const updatedVehicle = await Vehicle.findOneAndUpdate(
      { vehicleID: req.params.vehicleID },
      req.body,
      { new: true, runValidators: true } // ensure price & other validators run on update
    );
    if (!updatedVehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }
    res.status(200).json({ message: "Vehicle updated", updatedVehicle });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

export async function deleteVehicle(req, res) {
  if (req.user == null) {
    return res.status(403).json({ message: "You need to login first" });
  }
  if (req.user.role != "Admin") {
    return res.status(403).json({ message: "You cannot delete vehicles" });
  }

  try {
    const deletedVehicle = await Vehicle.findOneAndDelete({
      vehicleID: req.params.vehicleID,
    });
    if (!deletedVehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }
    res.status(200).json({ message: "Vehicle deleted" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}
