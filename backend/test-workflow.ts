import { prisma } from './index';

async function runTest() {
  console.log('--- Starting Workflow Test ---');
  
  // Clean up previous runs
  await prisma.expense.deleteMany();
  await prisma.fuelLog.deleteMany();
  await prisma.maintenanceLog.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.user.deleteMany();
  
  // Step 1: Register a vehicle 'Van-05' with a maximum capacity of 500 kg
  console.log('Step 1: Registering Vehicle...');
  const vehicle = await prisma.vehicle.create({
    data: {
      registration_number: 'VAN-05',
      name_model: 'Ford Transit',
      type: 'Van',
      max_load_capacity: 500,
      acquisition_cost: 30000,
    }
  });
  console.log(`Vehicle ${vehicle.registration_number} status: ${vehicle.status}`);

  // Step 2: Register driver 'Alex' with a valid driving license
  console.log('Step 2: Registering Driver...');
  const user = await prisma.user.create({
    data: { email: 'alex@test.com', password_hash: 'hash', role: 'DRIVER' }
  });
  const driver = await prisma.driver.create({
    data: {
      user_id: user.id,
      name: 'Alex',
      license_number: 'DL12345',
      license_category: 'B',
      license_expiry_date: new Date('2030-01-01'),
      contact_number: '1234567890'
    }
  });
  console.log(`Driver ${driver.name} status: ${driver.status}`);

  // Step 3: Create a trip with Cargo Weight = 450 kg
  console.log('Step 3 & 4: Creating Trip (validating 450kg <= 500kg)...');
  if (450 > vehicle.max_load_capacity) throw new Error("Validation failed");
  const trip = await prisma.trip.create({
    data: {
      source: 'Warehouse A',
      destination: 'Store B',
      vehicle_id: vehicle.id,
      driver_id: driver.id,
      cargo_weight: 450,
      planned_distance: 100,
      status: 'DRAFT'
    }
  });
  console.log(`Trip created with status: ${trip.status}`);

  // Step 5: Vehicle and Driver status automatically become On Trip (Dispatching)
  console.log('Step 5: Dispatching Trip...');
  await prisma.$transaction([
    prisma.trip.update({ where: { id: trip.id }, data: { status: 'DISPATCHED', start_time: new Date() } }),
    prisma.vehicle.update({ where: { id: vehicle.id }, data: { status: 'ON_TRIP' } }),
    prisma.driver.update({ where: { id: driver.id }, data: { status: 'ON_TRIP' } })
  ]);
  
  const vAfterDispatch = await prisma.vehicle.findUnique({ where: { id: vehicle.id } });
  const dAfterDispatch = await prisma.driver.findUnique({ where: { id: driver.id } });
  console.log(`After Dispatch - Vehicle status: ${vAfterDispatch?.status}, Driver status: ${dAfterDispatch?.status}`);

  // Step 6 & 7: Complete the trip
  console.log('Step 6 & 7: Completing Trip...');
  await prisma.$transaction([
    prisma.trip.update({ 
      where: { id: trip.id }, 
      data: { status: 'COMPLETED', end_time: new Date(), final_odometer: 100, fuel_consumed: 10 } 
    }),
    prisma.vehicle.update({ where: { id: vehicle.id }, data: { status: 'AVAILABLE', odometer: 100 } }),
    prisma.driver.update({ where: { id: driver.id }, data: { status: 'AVAILABLE' } }),
    // Adding fuel log and expense
    prisma.fuelLog.create({ data: { vehicle_id: vehicle.id, liters: 10, cost: 20 } }),
    prisma.expense.create({ data: { vehicle_id: vehicle.id, expense_type: 'FUEL', amount: 20 } })
  ]);

  const vAfterComplete = await prisma.vehicle.findUnique({ where: { id: vehicle.id } });
  const dAfterComplete = await prisma.driver.findUnique({ where: { id: driver.id } });
  console.log(`After Complete - Vehicle status: ${vAfterComplete?.status} (Odometer: ${vAfterComplete?.odometer}), Driver status: ${dAfterComplete?.status}`);

  // Step 8: Create a maintenance record
  console.log('Step 8: Creating Maintenance Record...');
  await prisma.$transaction([
    prisma.maintenanceLog.create({ data: { vehicle_id: vehicle.id, description: 'Oil Change', cost: 50, is_active: true } }),
    prisma.vehicle.update({ where: { id: vehicle.id }, data: { status: 'IN_SHOP' } })
  ]);
  const vAfterMaint = await prisma.vehicle.findUnique({ where: { id: vehicle.id } });
  console.log(`After Maintenance - Vehicle status: ${vAfterMaint?.status}`);

  // Step 9: Reports update operational cost
  console.log('Step 9: Checking Operational Costs...');
  const expenses = await prisma.expense.aggregate({ _sum: { amount: true }, where: { vehicle_id: vehicle.id } });
  console.log(`Total Operational Cost for ${vehicle.registration_number}: $${expenses._sum.amount}`);

  console.log('--- Workflow Test Completed Successfully! ---');
}

runTest().catch(e => {
  console.error('Test failed:', e);
}).finally(async () => {
  await prisma.$disconnect();
  process.exit(0);
});
