import { Request, Response } from 'express';
import { prisma } from '../../index';

export const addFuelLog = async (req: Request, res: Response) => {
  try {
    const { vehicle_id, liters, cost } = req.body;

    const log = await prisma.$transaction([
      prisma.fuelLog.create({
        data: {
          vehicle_id,
          liters: Number(liters),
          cost: Number(cost),
          date: new Date()
        }
      }),
      prisma.expense.create({
        data: {
          vehicle_id,
          expense_type: 'FUEL',
          amount: Number(cost),
          description: `Fuel log of ${liters} liters`,
          date: new Date()
        }
      })
    ]);

    res.status(201).json(log[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add fuel log' });
  }
};
