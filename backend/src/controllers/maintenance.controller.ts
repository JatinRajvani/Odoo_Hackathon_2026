import { Request, Response } from 'express';
import { prisma } from '../../index';

export const startMaintenance = async (req: Request, res: Response) => {
  try {
    const { vehicle_id, description, cost } = req.body;

    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicle_id } });
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
    if (vehicle.status !== 'AVAILABLE') return res.status(400).json({ error: 'Vehicle must be available to undergo maintenance' });

    const log = await prisma.$transaction([
      prisma.maintenanceLog.create({
        data: {
          vehicle_id,
          description,
          cost: Number(cost),
          is_active: true
        }
      }),
      prisma.vehicle.update({
        where: { id: vehicle_id },
        data: { status: 'IN_SHOP' }
      })
    ]);

    res.status(201).json(log[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to start maintenance' });
  }
};

export const closeMaintenance = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    
    const log = await prisma.maintenanceLog.findUnique({ where: { id: id as string } });
    if (!log || !log.is_active) return res.status(400).json({ error: 'Maintenance log is not active' });

    await prisma.$transaction([
      prisma.maintenanceLog.update({
        where: { id: id as string },
        data: { is_active: false, end_date: new Date() }
      }),
      prisma.vehicle.update({
        where: { id: log.vehicle_id },
        data: { status: 'AVAILABLE' }
      }),
      prisma.expense.create({
        data: {
          vehicle_id: log.vehicle_id,
          expense_type: 'MAINTENANCE',
          amount: log.cost,
          description: log.description
        }
      })
    ]);

    res.json({ message: 'Maintenance closed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to close maintenance' });
  }
};
