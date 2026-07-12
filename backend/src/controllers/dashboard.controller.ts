import { Request, Response } from 'express';
import { prisma } from '../../index';

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const { type, region } = req.query; // Region is not in our schema, but we can accept it if needed later
    const vehicleFilter = type ? { type: String(type) } : {};

    const [
      totalVehicles,
      activeVehicles,
      availableVehicles,
      inMaintenanceVehicles,
      activeTrips,
      pendingTrips,
      driversOnDuty,
      totalExpenses
    ] = await Promise.all([
      prisma.vehicle.count({ where: vehicleFilter }),
      prisma.vehicle.count({ where: { status: 'ON_TRIP', ...vehicleFilter } }),
      prisma.vehicle.count({ where: { status: 'AVAILABLE', ...vehicleFilter } }),
      prisma.vehicle.count({ where: { status: 'IN_SHOP', ...vehicleFilter } }),
      prisma.trip.count({ where: { status: 'DISPATCHED' } }),
      prisma.trip.count({ where: { status: 'DRAFT' } }),
      prisma.driver.count({ where: { status: 'ON_TRIP' } }),
      prisma.expense.aggregate({ _sum: { amount: true } })
    ]);

    const fleetUtilization = totalVehicles > 0 ? (activeVehicles / totalVehicles) * 100 : 0;

    res.json({
      kpis: {
        activeVehicles,
        availableVehicles,
        inMaintenanceVehicles,
        activeTrips,
        pendingTrips,
        driversOnDuty,
        fleetUtilization: fleetUtilization.toFixed(2),
        totalOperationalCost: totalExpenses._sum.amount || 0
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
};
