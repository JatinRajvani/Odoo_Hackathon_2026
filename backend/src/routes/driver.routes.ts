import { Router } from 'express';
import { getDrivers, createDriver, updateDriver } from '../controllers/driver.controller';
import { authenticate, requireRole } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

// GET all drivers (Any authenticated user can view)
router.get('/', getDrivers);

// POST a new driver (Fleet Manager only)
router.post('/', requireRole(['FLEET_MANAGER']), createDriver);

// PUT update a driver
router.put('/:id', requireRole(['FLEET_MANAGER', 'SAFETY_OFFICER']), updateDriver);

export default router;
