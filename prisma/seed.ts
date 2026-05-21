import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Dream Look database...\n');

  // ─── STORES ─────────────────────────────────────────────────────────────────
  const stores = await Promise.all([
    db.store.create({
      data: {
        name: 'Dream Look - MG Road',
        address: '42, MG Road, Indiranagar',
        phone: '+91 98765 43210',
        city: 'Bangalore',
      },
    }),
    db.store.create({
      data: {
        name: 'Dream Look - Koramangala',
        address: '15, 100ft Road, Koramangala 4th Block',
        phone: '+91 98765 43211',
        city: 'Bangalore',
      },
    }),
    db.store.create({
      data: {
        name: 'Dream Look - Whitefield',
        address: '78, ITPL Main Road, Whitefield',
        phone: '+91 98765 43212',
        city: 'Bangalore',
      },
    }),
  ]);

  console.log(`✅ Created ${stores.length} stores`);

  // ─── SERVICES ───────────────────────────────────────────────────────────────
  const services = await Promise.all([
    db.service.create({ data: { name: 'Haircut (Men)', price: 200, duration: 30, category: 'HAIRCUT', description: 'Classic men\'s haircut with wash' } }),
    db.service.create({ data: { name: 'Haircut (Women)', price: 400, duration: 60, category: 'HAIRCUT', description: 'Women\'s haircut with wash and blow-dry' } }),
    db.service.create({ data: { name: 'Hair Color', price: 800, duration: 90, category: 'COLOR', description: 'Full hair coloring with premium products' } }),
    db.service.create({ data: { name: 'Highlights', price: 1200, duration: 120, category: 'COLOR', description: 'Partial highlights with foils' } }),
    db.service.create({ data: { name: 'Hair Spa', price: 500, duration: 60, category: 'TREATMENT', description: 'Deep conditioning hair spa treatment' } }),
    db.service.create({ data: { name: 'Keratin Treatment', price: 3000, duration: 180, category: 'TREATMENT', description: 'Smoothing keratin treatment for frizz-free hair' } }),
    db.service.create({ data: { name: 'Facial', price: 600, duration: 45, category: 'SPA', description: 'Classic facial with cleansing and massage' } }),
    db.service.create({ data: { name: 'Bridal Makeup', price: 5000, duration: 240, category: 'BRIDAL', description: 'Complete bridal makeup package' } }),
    db.service.create({ data: { name: 'Beard Trim', price: 100, duration: 15, category: 'HAIRCUT', description: 'Quick beard shaping and trim' } }),
    db.service.create({ data: { name: 'Head Massage', price: 300, duration: 30, category: 'SPA', description: 'Relaxing head massage with oils' } }),
    db.service.create({ data: { name: 'Hair Straightening', price: 2000, duration: 150, category: 'TREATMENT', description: 'Permanent hair straightening' } }),
    db.service.create({ data: { name: 'Manicure & Pedicure', price: 450, duration: 60, category: 'SPA', description: 'Complete nail care session' } }),
  ]);

  console.log(`✅ Created ${services.length} services`);

  // ─── PRODUCTS ───────────────────────────────────────────────────────────────
  const products = await Promise.all([
    db.product.create({ data: { name: 'Shampoo (L\'Oreal)', cost: 15, unit: 'ML', category: 'SHAMPOO' } }),
    db.product.create({ data: { name: 'Hair Color (Matrix)', cost: 25, unit: 'ML', category: 'COLOR' } }),
    db.product.create({ data: { name: 'Conditioner', cost: 10, unit: 'ML', category: 'SHAMPOO' } }),
    db.product.create({ data: { name: 'Hair Oil (Coconut)', cost: 5, unit: 'ML', category: 'OIL' } }),
    db.product.create({ data: { name: 'Hair Mask', cost: 30, unit: 'GRAM', category: 'MASK' } }),
    db.product.create({ data: { name: 'Hair Gel', cost: 8, unit: 'ML', category: 'CREAM' } }),
    db.product.create({ data: { name: 'Keratin Cream', cost: 50, unit: 'GRAM', category: 'CREAM' } }),
    db.product.create({ data: { name: 'Bleach Powder', cost: 20, unit: 'GRAM', category: 'COLOR' } }),
    db.product.create({ data: { name: 'Developer', cost: 12, unit: 'ML', category: 'COLOR' } }),
    db.product.create({ data: { name: 'Face Cream', cost: 15, unit: 'GRAM', category: 'CREAM' } }),
    db.product.create({ data: { name: 'Massage Oil', cost: 8, unit: 'ML', category: 'OIL' } }),
    db.product.create({ data: { name: 'Nail Polish Remover', cost: 6, unit: 'ML', category: 'ACCESSORY' } }),
  ]);

  console.log(`✅ Created ${products.length} products`);

  // ─── EMPLOYEES ──────────────────────────────────────────────────────────────
  const employees = await Promise.all([
    // Owner
    db.employee.create({ data: { name: 'Rajesh Kumar', phone: '9900000001', role: 'OWNER', storeId: stores[0].id } }),
    // Manager
    db.employee.create({ data: { name: 'Priya Sharma', phone: '9900000002', role: 'MANAGER', storeId: stores[0].id } }),
    // Stylists - Store 1 (MG Road)
    db.employee.create({ data: { name: 'Anitha Reddy', phone: '9900000003', role: 'STYLIST', storeId: stores[0].id } }),
    db.employee.create({ data: { name: 'Kiran Patel', phone: '9900000004', role: 'STYLIST', storeId: stores[0].id } }),
    db.employee.create({ data: { name: 'Deepa Nair', phone: '9900000005', role: 'STYLIST', storeId: stores[0].id } }),
    // Stylists - Store 2 (Koramangala)
    db.employee.create({ data: { name: 'Vikram Singh', phone: '9900000006', role: 'STYLIST', storeId: stores[1].id } }),
    db.employee.create({ data: { name: 'Lakshmi Iyer', phone: '9900000007', role: 'STYLIST', storeId: stores[1].id } }),
    db.employee.create({ data: { name: 'Suresh Menon', phone: '9900000008', role: 'STYLIST', storeId: stores[1].id } }),
    // Stylists - Store 3 (Whitefield)
    db.employee.create({ data: { name: 'Ritu Gupta', phone: '9900000009', role: 'STYLIST', storeId: stores[2].id } }),
    db.employee.create({ data: { name: 'Arjun Das', phone: '9900000010', role: 'STYLIST', storeId: stores[2].id } }),
    db.employee.create({ data: { name: 'Meera Joshi', phone: '9900000011', role: 'STYLIST', storeId: stores[2].id } }),
  ]);

  console.log(`✅ Created ${employees.length} employees`);

  // ─── INVENTORY ──────────────────────────────────────────────────────────────
  for (const store of stores) {
    for (const product of products) {
      await db.inventory.create({
        data: {
          storeId: store.id,
          productId: product.id,
          quantity: Math.floor(Math.random() * 200) + 50,
          reorderLevel: 20,
        },
      });
    }
  }
  console.log('✅ Created inventory for all stores');

  // ─── CUSTOMERS ──────────────────────────────────────────────────────────────
  const customers = await Promise.all([
    db.customer.create({ data: { name: 'Arun Mehta', phone: '9800000001' } }),
    db.customer.create({ data: { name: 'Sunitha Rao', phone: '9800000002', email: 'sunitha@email.com' } }),
    db.customer.create({ data: { name: 'Rahul Verma', phone: '9800000003' } }),
    db.customer.create({ data: { name: 'Pooja Krishnan', phone: '9800000004', email: 'pooja@email.com' } }),
    db.customer.create({ data: { name: 'Aditya Sharma', phone: '9800000005' } }),
    db.customer.create({ data: { name: 'Neha Kapoor', phone: '9800000006' } }),
    db.customer.create({ data: { name: 'Karthik Rajan', phone: '9800000007', email: 'karthik@email.com' } }),
    db.customer.create({ data: { name: 'Divya Menon', phone: '9800000008' } }),
    db.customer.create({ data: { name: 'Sanjay Gupta', phone: '9800000009' } }),
    db.customer.create({ data: { name: 'Ananya Bose', phone: '9800000010', email: 'ananya@email.com' } }),
  ]);

  console.log(`✅ Created ${customers.length} customers`);

  // ─── APPOINTMENTS (mix of statuses across dates) ────────────────────────────
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const yesterdayStr = new Date(today.getTime() - 86400000).toISOString().split('T')[0];
  const dayBefore = new Date(today.getTime() - 2 * 86400000).toISOString().split('T')[0];
  const twoDaysAhead = new Date(today.getTime() + 2 * 86400000).toISOString().split('T')[0];
  const threeDaysAhead = new Date(today.getTime() + 3 * 86400000).toISOString().split('T')[0];

  const appointmentData = [
    // Today's appointments - mix of statuses
    { cid: 0, sid: 0, eid: 2, ser: 0, date: todayStr, time: '09:30', status: 'CONFIRMED' },
    { cid: 1, sid: 0, eid: 2, ser: 4, date: todayStr, time: '11:00', status: 'COMPLETED' },
    { cid: 2, sid: 0, eid: 3, ser: 1, date: todayStr, time: '10:00', status: 'COMPLETED' },
    { cid: 3, sid: 0, eid: 4, ser: 2, date: todayStr, time: '14:00', status: 'PENDING' },
    { cid: 4, sid: 1, eid: 5, ser: 0, date: todayStr, time: '10:30', status: 'COMPLETED' },
    { cid: 5, sid: 1, eid: 6, ser: 6, date: todayStr, time: '12:00', status: 'CONFIRMED' },
    { cid: 6, sid: 2, eid: 9, ser: 8, date: todayStr, time: '09:00', status: 'COMPLETED' },
    { cid: 7, sid: 2, eid: 10, ser: 3, date: todayStr, time: '11:30', status: 'PENDING' },
    // Yesterday's completed
    { cid: 0, sid: 0, eid: 2, ser: 0, date: yesterdayStr, time: '10:00', status: 'COMPLETED' },
    { cid: 1, sid: 0, eid: 3, ser: 2, date: yesterdayStr, time: '14:00', status: 'COMPLETED' },
    { cid: 3, sid: 1, eid: 5, ser: 1, date: yesterdayStr, time: '11:00', status: 'COMPLETED' },
    { cid: 4, sid: 1, eid: 7, ser: 9, date: yesterdayStr, time: '16:00', status: 'COMPLETED' },
    { cid: 8, sid: 2, eid: 9, ser: 0, date: yesterdayStr, time: '09:30', status: 'COMPLETED' },
    // Day before
    { cid: 2, sid: 0, eid: 4, ser: 4, date: dayBefore, time: '10:00', status: 'COMPLETED' },
    { cid: 5, sid: 1, eid: 6, ser: 11, date: dayBefore, time: '13:00', status: 'COMPLETED' },
    { cid: 9, sid: 2, eid: 10, ser: 7, date: dayBefore, time: '10:00', status: 'COMPLETED' },
    // Future appointments
    { cid: 2, sid: 0, eid: 2, ser: 1, date: twoDaysAhead, time: '10:00', status: 'PENDING' },
    { cid: 6, sid: 1, eid: 5, ser: 0, date: twoDaysAhead, time: '11:00', status: 'PENDING' },
    { cid: 9, sid: 2, eid: 9, ser: 4, date: threeDaysAhead, time: '14:00', status: 'PENDING' },
  ];

  const appointments = [];
  for (const a of appointmentData) {
    const apt = await db.appointment.create({
      data: {
        customerId: customers[a.cid].id,
        storeId: stores[a.sid].id,
        employeeId: employees[a.eid].id,
        serviceId: services[a.ser].id,
        date: a.date,
        time: a.time,
        status: a.status,
      },
    });
    appointments.push({ ...a, id: apt.id });
  }
  console.log(`✅ Created ${appointments.length} appointments`);

  // ─── TRANSACTIONS (for completed appointments) ──────────────────────────────
  const completedAppts = appointments.filter((a) => a.status === 'COMPLETED');

  // Product usage patterns for different service types
  const serviceProductMap: Record<number, { pids: number[]; qty: number[] }[]> = {
    0: [{ pids: [0, 2], qty: [30, 20] }], // Haircut Men: Shampoo 30ml, Conditioner 20ml
    1: [{ pids: [0, 2], qty: [40, 30] }], // Haircut Women: Shampoo 40ml, Conditioner 30ml
    2: [{ pids: [1, 7, 8], qty: [60, 20, 60] }], // Hair Color: Color 60ml, Bleach 20g, Developer 60ml
    3: [{ pids: [1, 7, 8], qty: [80, 30, 80] }], // Highlights
    4: [{ pids: [4, 2], qty: [50, 30] }], // Hair Spa: Mask 50g, Conditioner 30ml
    5: [{ pids: [6, 0, 2], qty: [100, 40, 40] }], // Keratin
    6: [{ pids: [9], qty: [30] }], // Facial: Face cream 30g
    7: [{ pids: [9, 0], qty: [50, 30] }], // Bridal
    8: [{ pids: [5], qty: [10] }], // Beard Trim: Gel 10ml
    9: [{ pids: [10], qty: [20] }], // Head Massage: Oil 20ml
    10: [{ pids: [6, 0], qty: [120, 50] }], // Hair Straightening
    11: [{ pids: [11], qty: [15] }], // Manicure & Pedicure
  };

  let transactionCount = 0;
  for (const a of completedAppts) {
    const service = services[a.ser];
    const ownerShare = Math.round(service.price * 0.5 * 100) / 100;
    const employeeGross = Math.round(service.price * 0.5 * 100) / 100;

    // Calculate total product cost
    const productUsage = serviceProductMap[a.ser] || [];
    let totalProductCost = 0;
    for (const usage of productUsage) {
      for (let i = 0; i < usage.pids.length; i++) {
        totalProductCost += Math.round(products[usage.pids[i]].cost * usage.qty[i] * 100) / 100;
      }
    }

    const employeeNet = Math.round((employeeGross - totalProductCost) * 100) / 100;

    const txDate = new Date(a.date + 'T' + a.time + ':00');

    const tx = await db.transaction.create({
      data: {
        appointmentId: a.id,
        employeeId: employees[a.eid].id,
        storeId: stores[a.sid].id,
        serviceId: service.id,
        servicePrice: service.price,
        ownerShare,
        employeeGrossShare: employeeGross,
        totalProductCost: Math.round(totalProductCost * 100) / 100,
        employeeNetShare: employeeNet,
        completedAt: txDate,
      },
    });

    // Create transaction products
    for (const usage of productUsage) {
      for (let i = 0; i < usage.pids.length; i++) {
        const prod = products[usage.pids[i]];
        const totalCost = Math.round(prod.cost * usage.qty[i] * 100) / 100;
        await db.transactionProduct.create({
          data: {
            transactionId: tx.id,
            productId: prod.id,
            quantityUsed: usage.qty[i],
            unitCost: prod.cost,
            totalCost,
          },
        });

        // Decrease inventory
        await db.inventory.updateMany({
          where: { storeId: stores[a.sid].id, productId: prod.id },
          data: { quantity: { decrement: usage.qty[i] } },
        });
      }
    }
    transactionCount++;
  }
  console.log(`✅ Created ${transactionCount} transactions with product deductions`);

  // ─── ATTENDANCE ─────────────────────────────────────────────────────────────
  const stylists = employees.filter((e) => e.role === 'STYLIST');
  for (const emp of stylists) {
    for (const dateStr of [dayBefore, yesterdayStr, todayStr]) {
      const status = Math.random() > 0.1 ? 'PRESENT' : 'ABSENT';
      const checkIn = status === 'PRESENT' ? `${8 + Math.floor(Math.random() * 2)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}` : null;
      const checkOut = status === 'PRESENT' && dateStr !== todayStr ? `${17 + Math.floor(Math.random() * 3)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}` : null;
      await db.attendance.create({
        data: {
          employeeId: emp.id,
          storeId: emp.storeId,
          date: dateStr,
          checkIn,
          checkOut,
          status,
        },
      });
    }
  }
  // Manager attendance
  for (const dateStr of [dayBefore, yesterdayStr, todayStr]) {
    await db.attendance.create({
      data: { employeeId: employees[1].id, storeId: stores[0].id, date: dateStr, checkIn: '08:00', checkOut: dateStr !== todayStr ? '19:00' : null, status: 'PRESENT' },
    });
  }
  console.log('✅ Created attendance records');

  console.log('\n🎉 Dream Look database seeded successfully!');
  console.log(`   Stores: ${stores.length} | Employees: ${employees.length} | Services: ${services.length}`);
  console.log(`   Products: ${products.length} | Customers: ${customers.length} | Appointments: ${appointments.length}`);
  console.log(`   Transactions: ${transactionCount}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
