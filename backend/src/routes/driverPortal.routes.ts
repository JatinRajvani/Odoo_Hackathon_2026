import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  getProfile,
  changePassword,
  getDashboard,
  getTrips,
  getActiveTrip,
  createInternalTrip,
  addFuelLog,
  addExpenseLog,
  updateOdometer,
  completeTrip,
  updateProfileDocuments
} from '../controllers/driverPortal.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { driverUpload } from '../middlewares/driverUpload.middleware';

const router = Router();

// Ensure upload folder exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'receipt-' + uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

router.use(authenticate);

// Profile
router.get('/profile', getProfile);
router.put('/profile/password', changePassword);
router.put('/profile/documents', driverUpload, updateProfileDocuments);

// Dashboard
router.get('/dashboard', getDashboard);

// Trips CRUD / Status
router.get('/trips', getTrips);
router.get('/trips/active', getActiveTrip);
router.post('/trips/internal', createInternalTrip);

// Actions during active trip
router.post('/trips/:id/fuel', upload.single('receipt'), addFuelLog);
router.post('/trips/:id/expense', upload.single('receipt'), addExpenseLog);
router.post('/trips/:id/odometer', updateOdometer);
router.put('/trips/:id/complete', upload.single('proof'), completeTrip);

export default router;
