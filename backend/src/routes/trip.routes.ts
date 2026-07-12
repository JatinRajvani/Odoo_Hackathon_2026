import { Router } from 'express';
import { getTrips, createTrip, dispatchTrip, completeTrip, cancelTrip } from '../controllers/trip.controller';
import { authenticate, requireRole } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

// List all trips
router.get('/', getTrips);

// Driver or Fleet Manager can create a trip
router.post('/', requireRole(['FLEET_MANAGER', 'DRIVER']), createTrip);

// Dispatch a trip
router.put('/:id/dispatch', requireRole(['FLEET_MANAGER', 'DRIVER']), dispatchTrip);

// Complete a trip
router.put('/:id/complete', requireRole(['FLEET_MANAGER', 'DRIVER']), completeTrip);

// Cancel a trip
router.put('/:id/cancel', requireRole(['FLEET_MANAGER', 'DRIVER']), cancelTrip);

export default router;
