import { Request, Response } from 'express';
import { prisma } from '../../index';

export const addFuelLog = async (req: Request, res: Response) => {
  try {
    const { vehicle_id, liters, cost, fuel_station, odometer } = req.body;

    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicle_id } });
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });

    const odoValue = odometer ? Number(odometer) : vehicle.odometer;

    const log = await prisma.$transaction([
      prisma.fuelLog.create({
        data: {
          vehicle_id,
          liters: Number(liters),
          cost: Number(cost),
          date: new Date(),
          fuel_station,
          odometer: odoValue
        }
      }),
      prisma.expense.create({
        data: {
          vehicle_id,
          expense_type: 'FUEL',
          amount: Number(cost),
          description: `Fuel log of ${liters} liters at ${fuel_station || 'unknown station'}`,
          date: new Date()
        }
      })
    ]);

    res.status(201).json(log[0]);
  } catch (error) {
    console.error('Error adding fuel log:', error);
    res.status(500).json({ error: 'Failed to add fuel log' });
  }
};
