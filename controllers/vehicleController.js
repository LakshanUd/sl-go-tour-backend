import Vehicle from "../models/vehicle.js";

//create
export async function createVehicle(req, res) {
  try {
    const vehicle = new Vehicle(req.body);
    await vehicle.save();
    res.status(201).json({ message: "Vehicle created successfully"});
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
  try {
    const updatedVehicle = await Vehicle.findOneAndUpdate(
      { vehicleID: req.params.vehicleID },
      req.body,
      { new: true }
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
  try {
    const deletedVehicle = await Vehicle.findOneAndDelete({ vehicleID: req.params.vehicleID });
    if (!deletedVehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }
    res.status(200).json({ message: "Vehicle deleted"});
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}
