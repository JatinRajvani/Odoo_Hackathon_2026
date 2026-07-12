import { Request, Response } from 'express';
import { prisma } from '../../index';
import bcrypt from 'bcryptjs';

export const getDrivers = async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const filter = status ? { status: status as any } : {};

    const drivers = await prisma.driver.findMany({ 
      where: filter,
      include: { user: { select: { email: true } } }
    });
    res.json(drivers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch drivers' });
  }
};

export const createDriver = async (req: Request, res: Response) => {
  try {
    const { name, license_number, license_category, license_expiry_date, contact_number, email, password } = req.body;

    // Check if license is unique
    const existingDriver = await prisma.driver.findUnique({ where: { license_number } });
    if (existingDriver) {
      return res.status(400).json({ error: 'License number must be unique' });
    }

    // Auto create the user for the driver
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'A user with this email already exists' });
    }

    const password_hash = await bcrypt.hash(password || 'defaultpass', 10);
    const user = await prisma.user.create({
      data: {
        email,
        password_hash,
        role: 'DRIVER'
      }
    });

    const driver = await prisma.driver.create({
      data: {
        user_id: user.id,
        name,
        license_number,
        license_category,
        license_expiry_date: new Date(license_expiry_date),
        contact_number,
      },
    });

    res.status(201).json(driver);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create driver' });
  }
};

export const updateDriver = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status, safety_score, contact_number } = req.body;

    const driver = await prisma.driver.update({
      where: { id: id as string },
      data: {
        ...(status && { status: status as any }),
        ...(safety_score && { safety_score: Number(safety_score) }),
        ...(contact_number && { contact_number }),
      },
    });

    res.json(driver);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update driver' });
  }
};
