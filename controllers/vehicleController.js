import Vehicle from "../models/vehicle.js";

export function createVehicle(req, res) {

    const vehicle = new Vehicle(req.body);

    vehicle.save()
        .then((savedVehicle) => {
            res.status(201).json({
                message: "Vehicle created successfully"
        })
        })
        .catch((error) => {
            res.status(400).json({ error: error.message });
        });
}

export function getVehicles(req, res) {
    Vehicle.find()
        .then((vehicles) => {
            res.status(200).json(vehicles);
        })
        .catch((error) => {
            res.status(500).json({ error: error.message });
        });
}

export function getVehicleById(req, res) {

    Vehicle.findOne({ 
        productID: req.params.productID
     }).then(
        (vehicle) => {
            res.status(200).json(vehicle)
        }
        ).catch(
            (error) => {
                res.status(404).json({
                    message: error
                })
            }
        )
}

export function updateVehicle(req, res) {

    Vehicle.findOneAndUpdate({
        productID: req.params.productID
        }, req.body).then(
            () => {
                res.status(200).json({
                    message: "Vehicle updated successfully"
                })
            }
        ).catch(
            (error) => {
                res.status(400).json({
                    message: error
                })
            }
        )
}

export function deleteVehicle(req, res) {
    Vehicle.findOneAndDelete({
        productID: req.params.productID
    }).then(
        () => {
            res.status(200).json({
                message: "Vehicle deleted"
            })
        }
    ).catch(
        (error) => {
            res.status(400).json({
                message: error
            })
        }
    )
}