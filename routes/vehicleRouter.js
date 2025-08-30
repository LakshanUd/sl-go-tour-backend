import express from 'express';
import { createVehicle, deleteVehicle, getVehicleById, getVehicles, updateVehicle } from '../controllers/vehicleController.js';

const vehicleRouter = express.Router();

vehicleRouter.post('/', createVehicle);
vehicleRouter.get('/', getVehicles);
vehicleRouter.get('/:productID', getVehicleById);
vehicleRouter.put('/:productID', updateVehicle);
vehicleRouter.delete('/:productID', deleteVehicle);

export default vehicleRouter;