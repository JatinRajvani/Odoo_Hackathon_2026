import { Router } from 'express';
import { startMaintenance, closeMaintenance } from '../controllers/maintenance.controller';
import { authenticate, requireRole } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

// Fleet Manager creates a maintenance log
router.post('/', requireRole(['FLEET_MANAGER']), startMaintenance);

// Close maintenance
router.put('/:id/close', requireRole(['FLEET_MANAGER']), closeMaintenance);

export default router;
