import { Router } from 'express';
import { getVehicles, createVehicle, updateVehicle } from '../controllers/vehicle.controller';
import { authenticate, requireRole } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate); // Require authentication for all vehicle routes

// GET all vehicles
router.get('/', getVehicles);

// POST a new vehicle - Fleet Manager only
router.post('/', requireRole(['FLEET_MANAGER']), createVehicle);

// PUT update a vehicle - Fleet Manager only
router.put('/:id', requireRole(['FLEET_MANAGER']), updateVehicle);

export default router;
