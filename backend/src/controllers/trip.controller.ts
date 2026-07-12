import { Request, Response } from 'express';
import { prisma } from '../../index';

export const getTrips = async (req: Request, res: Response) => {
  try {
    const trips = await prisma.trip.findMany({
      include: { vehicle: true, driver: true }
    });
    res.json(trips);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch trips' });
  }
};

export const createTrip = async (req: Request, res: Response) => {
  try {
    const { source, destination, vehicle_id, driver_id, cargo_weight, planned_distance } = req.body;

    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicle_id } });
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
    if (vehicle.status !== 'AVAILABLE') return res.status(400).json({ error: 'Vehicle is not available' });
    if (cargo_weight > vehicle.max_load_capacity) return res.status(400).json({ error: 'Cargo weight exceeds vehicle capacity' });

    const driver = await prisma.driver.findUnique({ where: { id: driver_id } });
    if (!driver) return res.status(404).json({ error: 'Driver not found' });
    if (driver.status !== 'AVAILABLE') return res.status(400).json({ error: 'Driver is not available' });
    if (driver.license_expiry_date < new Date()) return res.status(400).json({ error: 'Driver license has expired' });

    const trip = await prisma.trip.create({
      data: {
        source,
        destination,
        vehicle_id,
        driver_id,
        cargo_weight: Number(cargo_weight),
        planned_distance: Number(planned_distance),
        status: 'DRAFT'
      }
    });

    res.status(201).json(trip);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create trip' });
  }
};

export const dispatchTrip = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    
    const trip = await prisma.trip.findUnique({ where: { id: id as string } });
    if (!trip || trip.status !== 'DRAFT') return res.status(400).json({ error: 'Invalid trip state for dispatch' });

    await prisma.$transaction([
      prisma.trip.update({ where: { id: id as string }, data: { status: 'DISPATCHED', start_time: new Date() } }),
      prisma.vehicle.update({ where: { id: trip.vehicle_id }, data: { status: 'ON_TRIP' } }),
      prisma.driver.update({ where: { id: trip.driver_id }, data: { status: 'ON_TRIP' } })
    ]);

    res.json({ message: 'Trip dispatched successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to dispatch trip' });
  }
};

export const completeTrip = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { final_odometer, fuel_consumed, fuel_cost } = req.body;

    const trip = await prisma.trip.findUnique({ where: { id: id as string } });
    if (!trip || trip.status !== 'DISPATCHED') return res.status(400).json({ error: 'Invalid trip state' });

    const vehicle = await prisma.vehicle.findUnique({ where: { id: trip.vehicle_id } });
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });

    const finalOdoVal = Number(final_odometer);
    if (finalOdoVal < vehicle.odometer) {
      return res.status(400).json({ error: `Final odometer cannot be less than vehicle's current odometer (${vehicle.odometer} km)` });
    }

    const actual_distance = finalOdoVal - vehicle.odometer;

    await prisma.$transaction([
      prisma.trip.update({ 
        where: { id: id as string }, 
        data: { 
          status: 'COMPLETED', 
          end_time: new Date(), 
          final_odometer: finalOdoVal, 
          actual_distance,
          fuel_consumed: Number(fuel_consumed),
          fuel_cost: Number(fuel_cost)
        } 
      }),
      prisma.vehicle.update({ 
        where: { id: trip.vehicle_id }, 
        data: { status: 'AVAILABLE', odometer: finalOdoVal } 
      }),
      prisma.driver.update({ 
        where: { id: trip.driver_id }, 
        data: { status: 'AVAILABLE' } 
      }),
      ...(fuel_consumed && fuel_cost ? [
        prisma.fuelLog.create({
          data: {
            vehicle_id: trip.vehicle_id,
            liters: Number(fuel_consumed),
            cost: Number(fuel_cost),
            date: new Date(),
            fuel_station: 'Main Terminal',
            odometer: finalOdoVal
          }
        }),
        prisma.expense.create({
          data: {
            vehicle_id: trip.vehicle_id,
            expense_type: 'FUEL',
            amount: Number(fuel_cost),
            date: new Date(),
            description: `Fuel for Trip ${id}`
          }
        })
      ] : [])
    ]);

    res.json({ message: 'Trip completed successfully' });
  } catch (error) {
    console.error('Error completing trip:', error);
    res.status(500).json({ error: 'Failed to complete trip' });
  }
};

export const cancelTrip = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const trip = await prisma.trip.findUnique({ where: { id: id as string } });
    if (!trip || trip.status === 'COMPLETED' || trip.status === 'CANCELLED') {
      return res.status(400).json({ error: 'Invalid trip state for cancellation' });
    }

    const updates: any = [
      prisma.trip.update({ where: { id: id as string }, data: { status: 'CANCELLED' } })
    ];

    if (trip.status === 'DISPATCHED') {
      updates.push(prisma.vehicle.update({ where: { id: trip.vehicle_id }, data: { status: 'AVAILABLE' } }));
      updates.push(prisma.driver.update({ where: { id: trip.driver_id }, data: { status: 'AVAILABLE' } }));
    }

    await prisma.$transaction(updates);

    res.json({ message: 'Trip cancelled successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel trip' });
  }
};
