import { Request, Response } from 'express';
import { prisma } from '../../index';
import fs from 'fs';
import path from 'path';

// Helper to remove old uploaded files when replaced or deleted
const removeFile = (relativePath: string) => {
  if (!relativePath) return;
  const fullPath = path.join(__dirname, '../../', relativePath);
  if (fs.existsSync(fullPath)) {
    try {
      fs.unlinkSync(fullPath);
    } catch (err) {
      console.error(`Failed to delete file: ${fullPath}`, err);
    }
  }
};

// GET all vehicles with search and filtering
export const getVehicles = async (req: Request, res: Response) => {
  try {
    const { status, type, search } = req.query;

    const filter: any = {};
    if (status) filter.status = status as any;
    if (type) filter.type = String(type);

    if (search) {
      filter.OR = [
        { registration_number: { contains: String(search), mode: 'insensitive' } },
        { name_model: { contains: String(search), mode: 'insensitive' } },
        { manufacturer: { contains: String(search), mode: 'insensitive' } },
      ];
    }

    // We also want to include the active driver if the vehicle is ON_TRIP
    const vehicles = await prisma.vehicle.findMany({
      where: filter,
      include: {
        trips: {
          where: { status: 'DISPATCHED' },
          include: { driver: true },
        },
      },
    });

    // Format the response to include the assigned driver and current trip info
    const formattedVehicles = vehicles.map(v => {
      const activeTrip = v.trips[0];
      return {
        id: v.id,
        registration_number: v.registration_number,
        name_model: v.name_model,
        manufacturer: v.manufacturer,
        type: v.type,
        fuel_type: v.fuel_type,
        acquisition_date: v.acquisition_date,
        acquisition_cost: v.acquisition_cost,
        odometer: v.odometer,
        max_load_capacity: v.max_load_capacity,
        status: v.status,
        insurance_expiry_date: v.insurance_expiry_date,
        // Document paths
        rc_number: v.rc_number,
        rc_file_path: v.rc_file_path,
        insurance_file_path: v.insurance_file_path,
        puc_file_path: v.puc_file_path,
        permit_file_path: v.permit_file_path,
        assigned_driver: activeTrip ? activeTrip.driver.name : '—',
        current_trip: activeTrip ? `${activeTrip.source} → ${activeTrip.destination}` : '—',
      };
    });

    res.json(formattedVehicles);
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
};

// GET a single vehicle by ID with nested details and analytics
export const getVehicleById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const vehicle = await prisma.vehicle.findUnique({
      where: { id: id as string },
      include: {
        trips: {
          orderBy: { createdAt: 'desc' },
          include: { driver: true },
        },
        maintenanceLogs: {
          orderBy: { start_date: 'desc' },
        },
        fuelLogs: {
          orderBy: { date: 'desc' },
        },
        expenses: {
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    // Identify active trip
    const activeTrip = vehicle.trips.find(t => t.status === 'DISPATCHED');

    // Calculate analytics metrics
    const completedTrips = vehicle.trips.filter(t => t.status === 'COMPLETED');
    const totalTrips = vehicle.trips.length;
    
    // Total Distance: sum of actual_distance or planned_distance fallback for completed trips
    const totalDistance = completedTrips.reduce((acc, t) => acc + (t.actual_distance || t.planned_distance || 0), 0);
    
    // Total Fuel Consumed
    const totalFuelConsumed = completedTrips.reduce((acc, t) => acc + (t.fuel_consumed || 0), 0);
    
    // Total Fuel Cost: from fuel logs
    const totalFuelCost = vehicle.fuelLogs.reduce((acc, f) => acc + f.cost, 0);

    // Total Maintenance Cost: from maintenance logs
    const totalMaintenanceCost = vehicle.maintenanceLogs.reduce((acc, m) => acc + m.cost, 0);

    // Total Expenses: from expense ledger
    const totalOperationalCost = vehicle.expenses.reduce((acc, e) => acc + e.amount, 0);

    // Fuel Efficiency (km/liter)
    const fuelEfficiency = totalFuelConsumed > 0 ? (totalDistance / totalFuelConsumed) : 0;

    res.json({
      vehicle: {
        id: vehicle.id,
        registration_number: vehicle.registration_number,
        name_model: vehicle.name_model,
        manufacturer: vehicle.manufacturer,
        type: vehicle.type,
        fuel_type: vehicle.fuel_type,
        acquisition_date: vehicle.acquisition_date,
        acquisition_cost: vehicle.acquisition_cost,
        odometer: vehicle.odometer,
        max_load_capacity: vehicle.max_load_capacity,
        status: vehicle.status,
        description: vehicle.description,
        internal_remarks: vehicle.internal_remarks,
        // Documents
        rc_number: vehicle.rc_number,
        rc_file_path: vehicle.rc_file_path,
        insurance_company: vehicle.insurance_company,
        insurance_policy_num: vehicle.insurance_policy_num,
        insurance_type: vehicle.insurance_type,
        insurance_start_date: vehicle.insurance_start_date,
        insurance_expiry_date: vehicle.insurance_expiry_date,
        insurance_file_path: vehicle.insurance_file_path,
        puc_number: vehicle.puc_number,
        puc_expiry_date: vehicle.puc_expiry_date,
        puc_file_path: vehicle.puc_file_path,
        permit_number: vehicle.permit_number,
        permit_expiry_date: vehicle.permit_expiry_date,
        permit_file_path: vehicle.permit_file_path,
        createdAt: vehicle.createdAt,
        updatedAt: vehicle.updatedAt,
        // Derivations
        assigned_driver: activeTrip ? activeTrip.driver.name : '—',
        current_trip: activeTrip ? {
          id: activeTrip.id,
          source: activeTrip.source,
          destination: activeTrip.destination,
          cargo_weight: activeTrip.cargo_weight,
          planned_distance: activeTrip.planned_distance,
        } : null,
      },
      stats: {
        totalTrips,
        totalDistance,
        fuelEfficiency: fuelEfficiency.toFixed(2),
        totalFuelCost,
        totalMaintenanceCost,
        totalOperationalCost,
      },
      trips: vehicle.trips,
      maintenanceLogs: vehicle.maintenanceLogs,
      fuelLogs: vehicle.fuelLogs,
      expenses: vehicle.expenses,
    });
  } catch (error) {
    console.error('Error fetching vehicle details:', error);
    res.status(500).json({ error: 'Failed to fetch vehicle details' });
  }
};

// CREATE new vehicle with uploads
export const createVehicle = async (req: Request, res: Response) => {
  try {
    const {
      registration_number,
      name_model,
      manufacturer,
      type,
      fuel_type,
      acquisition_date,
      acquisition_cost,
      odometer,
      max_load_capacity,
      rc_number,
      insurance_company,
      insurance_policy_num,
      insurance_type,
      insurance_start_date,
      insurance_expiry_date,
      puc_number,
      puc_expiry_date,
      permit_number,
      permit_expiry_date,
      status,
      description,
      internal_remarks,
    } = req.body;

    // Check unique registration
    const existing = await prisma.vehicle.findUnique({ where: { registration_number } });
    if (existing) {
      return res.status(400).json({ error: 'Registration number must be unique' });
    }

    // Check uploaded files from Multer
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const rcFile = files?.['rc_file']?.[0];
    const insuranceFile = files?.['insurance_file']?.[0];
    const pucFile = files?.['puc_file']?.[0];
    const permitFile = files?.['permit_file']?.[0];

    if (!rcFile) return res.status(400).json({ error: 'RC document file is required' });
    if (!insuranceFile) return res.status(400).json({ error: 'Insurance document file is required' });
    if (!pucFile) return res.status(400).json({ error: 'PUC document file is required' });

    // Store paths relative to backend directory for static serving
    const rc_file_path = `uploads/${rcFile.filename}`;
    const insurance_file_path = `uploads/${insuranceFile.filename}`;
    const puc_file_path = `uploads/${pucFile.filename}`;
    const permit_file_path = permitFile ? `uploads/${permitFile.filename}` : null;

    const vehicle = await prisma.vehicle.create({
      data: {
        registration_number,
        name_model,
        manufacturer,
        type,
        fuel_type,
        acquisition_date: acquisition_date ? new Date(acquisition_date) : null,
        acquisition_cost: Number(acquisition_cost),
        odometer: Number(odometer) || 0,
        max_load_capacity: Number(max_load_capacity),
        status: status || 'AVAILABLE',
        rc_number,
        rc_file_path,
        insurance_company,
        insurance_policy_num,
        insurance_type,
        insurance_start_date: insurance_start_date ? new Date(insurance_start_date) : null,
        insurance_expiry_date: insurance_expiry_date ? new Date(insurance_expiry_date) : null,
        insurance_file_path,
        puc_number,
        puc_expiry_date: puc_expiry_date ? new Date(puc_expiry_date) : null,
        puc_file_path,
        permit_number,
        permit_expiry_date: permit_expiry_date ? new Date(permit_expiry_date) : null,
        permit_file_path,
        description,
        internal_remarks,
      },
    });

    res.status(201).json(vehicle);
  } catch (error) {
    console.error('Error creating vehicle:', error);
    res.status(500).json({ error: 'Failed to create vehicle' });
  }
};

// UPDATE vehicle details and documents
export const updateVehicle = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const {
      name_model,
      manufacturer,
      type,
      fuel_type,
      acquisition_date,
      acquisition_cost,
      max_load_capacity,
      rc_number,
      insurance_company,
      insurance_policy_num,
      insurance_type,
      insurance_start_date,
      insurance_expiry_date,
      puc_number,
      puc_expiry_date,
      permit_number,
      permit_expiry_date,
      status,
      description,
      internal_remarks,
    } = req.body;

    const vehicle = await prisma.vehicle.findUnique({ where: { id: id as string } });
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    // Process new files if uploaded
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const rcFile = files?.['rc_file']?.[0];
    const insuranceFile = files?.['insurance_file']?.[0];
    const pucFile = files?.['puc_file']?.[0];
    const permitFile = files?.['permit_file']?.[0];

    const updates: any = {
      ...(name_model && { name_model }),
      ...(manufacturer && { manufacturer }),
      ...(type && { type }),
      ...(fuel_type && { fuel_type }),
      ...(acquisition_date && { acquisition_date: new Date(acquisition_date) }),
      ...(acquisition_cost && { acquisition_cost: Number(acquisition_cost) }),
      ...(max_load_capacity && { max_load_capacity: Number(max_load_capacity) }),
      ...(rc_number && { rc_number }),
      ...(insurance_company && { insurance_company }),
      ...(insurance_policy_num && { insurance_policy_num }),
      ...(insurance_type && { insurance_type }),
      ...(insurance_start_date && { insurance_start_date: new Date(insurance_start_date) }),
      ...(insurance_expiry_date && { insurance_expiry_date: new Date(insurance_expiry_date) }),
      ...(puc_number && { puc_number }),
      ...(puc_expiry_date && { puc_expiry_date: new Date(puc_expiry_date) }),
      ...(permit_number && { permit_number }),
      ...(permit_expiry_date && { permit_expiry_date: new Date(permit_expiry_date) }),
      ...(status && { status: status as any }),
      ...(description !== undefined && { description }),
      ...(internal_remarks !== undefined && { internal_remarks }),
    };

    if (rcFile) {
      removeFile(vehicle.rc_file_path);
      updates.rc_file_path = `uploads/${rcFile.filename}`;
    }
    if (insuranceFile) {
      removeFile(vehicle.insurance_file_path);
      updates.insurance_file_path = `uploads/${insuranceFile.filename}`;
    }
    if (pucFile) {
      removeFile(vehicle.puc_file_path);
      updates.puc_file_path = `uploads/${pucFile.filename}`;
    }
    if (permitFile) {
      if (vehicle.permit_file_path) removeFile(vehicle.permit_file_path);
      updates.permit_file_path = `uploads/${permitFile.filename}`;
    }

    const updatedVehicle = await prisma.vehicle.update({
      where: { id: id as string },
      data: updates,
    });

    res.json(updatedVehicle);
  } catch (error) {
    console.error('Error updating vehicle:', error);
    res.status(500).json({ error: 'Failed to update vehicle' });
  }
};

// DELETE a vehicle and cascade delete all nested entities
export const deleteVehicle = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const vehicle = await prisma.vehicle.findUnique({ where: { id: id as string } });
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    // Delete uploaded files on local storage
    removeFile(vehicle.rc_file_path);
    removeFile(vehicle.insurance_file_path);
    removeFile(vehicle.puc_file_path);
    if (vehicle.permit_file_path) removeFile(vehicle.permit_file_path);

    // Delete dependents in transaction
    await prisma.$transaction([
      prisma.expense.deleteMany({ where: { vehicle_id: id } }),
      prisma.fuelLog.deleteMany({ where: { vehicle_id: id } }),
      prisma.maintenanceLog.deleteMany({ where: { vehicle_id: id } }),
      prisma.trip.deleteMany({ where: { vehicle_id: id } }),
      prisma.vehicle.delete({ where: { id: id as string } }),
    ]);

    res.json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    res.status(500).json({ error: 'Failed to delete vehicle' });
  }
};
