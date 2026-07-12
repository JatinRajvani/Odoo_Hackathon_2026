import { Router } from 'express';
import { getVehicles, createVehicle, updateVehicle, getVehicleById, deleteVehicle } from '../controllers/vehicle.controller';
import { authenticate, requireRole } from '../middlewares/auth.middleware';
import { upload } from '../middlewares/upload.middleware';

const router = Router();

router.use(authenticate); // Require authentication for all vehicle routes

// GET all vehicles
router.get('/', getVehicles);

// GET single vehicle details
router.get('/:id', getVehicleById);

// POST a new vehicle with files - Fleet Manager only
router.post('/', requireRole(['FLEET_MANAGER']), upload, createVehicle);

// PUT update a vehicle and its files - Fleet Manager only
router.put('/:id', requireRole(['FLEET_MANAGER']), upload, updateVehicle);

// DELETE a vehicle - Fleet Manager only
router.delete('/:id', requireRole(['FLEET_MANAGER']), deleteVehicle);

export default router;
