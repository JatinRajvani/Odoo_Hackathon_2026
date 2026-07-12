import { Router } from 'express';
import { addFuelLog } from '../controllers/fuel.controller';
import { authenticate, requireRole } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

// Add fuel log
router.post('/', requireRole(['FLEET_MANAGER', 'DRIVER']), addFuelLog);

export default router;
