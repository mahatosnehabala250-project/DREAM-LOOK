import { db, Timestamp, FieldValue } from './firebase';

/**
 * Seeds Firebase Firestore with comprehensive demo data for the Dream Look salon system.
 * Clears all existing data before seeding (use with caution).
 */
export async function seedFirebase() {
  const batch = db.batch();
  const now = new Date().toISOString();

  // Helper to create a doc ref
  const ref = (collection: string, id: string) => db.collection(collection).doc(id);

  // Helper to add to batch
  const set = (collection: string, id: string, data: Record<string, unknown>) => {
    batch.set(ref(collection, id), {
      ...data,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  };

  // ─── STORES (3) ─────────────────────────────────────────────────────────────
  set('stores', 'store_1', {
    name: 'Dream Look - MG Road',
    address: '123 MG Road, Indiranagar',
    phone: '+91 9900000101',
    city: 'Bangalore',
    isActive: true,
  });
  set('stores', 'store_2', {
    name: 'Dream Look - Koramangala',
    address: '456 100ft Road Koramangala',
    phone: '+91 9900000102',
    city: 'Bangalore',
    isActive: true,
  });
  set('stores', 'store_3', {
    name: 'Dream Look - Whitefield',
    address: '789 ITPL Main Road Whitefield',
    phone: '+91 9900000103',
    city: 'Bangalore',
    isActive: true,
  });

  // ─── EMPLOYEES (11) ─────────────────────────────────────────────────────────
  set('employees', 'emp_1', {
    name: 'Rajesh Kumar', phone: '9900000001', role: 'OWNER',
    storeId: 'store_1', avatar: null, isActive: true,
  });
  set('employees', 'emp_2', {
    name: 'Priya Sharma', phone: '9900000002', role: 'MANAGER',
    storeId: 'store_1', avatar: null, isActive: true,
  });
  set('employees', 'emp_3', {
    name: 'Anitha Reddy', phone: '9900000003', role: 'STYLIST',
    storeId: 'store_1', avatar: null, isActive: true,
  });
  set('employees', 'emp_4', {
    name: 'Meera Joshi', phone: '9900000004', role: 'STYLIST',
    storeId: 'store_1', avatar: null, isActive: true,
  });
  set('employees', 'emp_5', {
    name: 'Vikram Patel', phone: '9900000005', role: 'MANAGER',
    storeId: 'store_2', avatar: null, isActive: true,
  });
  set('employees', 'emp_6', {
    name: 'Suresh Babu', phone: '9900000006', role: 'STYLIST',
    storeId: 'store_2', avatar: null, isActive: true,
  });
  set('employees', 'emp_7', {
    name: 'Kavitha Rao', phone: '9900000007', role: 'STYLIST',
    storeId: 'store_2', avatar: null, isActive: true,
  });
  set('employees', 'emp_8', {
    name: 'Rahul Dev', phone: '9900000008', role: 'STYLIST',
    storeId: 'store_2', avatar: null, isActive: true,
  });
  set('employees', 'emp_9', {
    name: 'Deepa Nair', phone: '9900000009', role: 'MANAGER',
    storeId: 'store_3', avatar: null, isActive: true,
  });
  set('employees', 'emp_10', {
    name: 'Lakshmi Priya', phone: '9900000010', role: 'STYLIST',
    storeId: 'store_3', avatar: null, isActive: true,
  });
  set('employees', 'emp_11', {
    name: 'Arjun Menon', phone: '9900000011', role: 'STYLIST',
    storeId: 'store_3', avatar: null, isActive: true,
  });

  // ─── SERVICES (12) ──────────────────────────────────────────────────────────
  set('services', 'svc_1', { name: 'Haircut', price: 300, duration: 30, category: 'HAIRCUT', description: null, isActive: true });
  set('services', 'svc_2', { name: 'Hair Trim', price: 150, duration: 15, category: 'HAIRCUT', description: null, isActive: true });
  set('services', 'svc_3', { name: 'Beard Styling', price: 100, duration: 15, category: 'HAIRCUT', description: null, isActive: true });
  set('services', 'svc_4', { name: 'Hair Coloring', price: 1500, duration: 90, category: 'COLOR', description: null, isActive: true });
  set('services', 'svc_5', { name: 'Highlights', price: 2000, duration: 120, category: 'COLOR', description: null, isActive: true });
  set('services', 'svc_6', { name: 'Balayage', price: 3000, duration: 150, category: 'COLOR', description: null, isActive: true });
  set('services', 'svc_7', { name: 'Keratin Treatment', price: 3000, duration: 120, category: 'TREATMENT', description: null, isActive: true });
  set('services', 'svc_8', { name: 'Deep Conditioning', price: 500, duration: 45, category: 'TREATMENT', description: null, isActive: true });
  set('services', 'svc_9', { name: 'Hair Spa', price: 500, duration: 60, category: 'SPA', description: null, isActive: true });
  set('services', 'svc_10', { name: 'Scalp Treatment', price: 400, duration: 45, category: 'SPA', description: null, isActive: true });
  set('services', 'svc_11', { name: 'Bridal Makeup', price: 5000, duration: 180, category: 'BRIDAL', description: null, isActive: true });
  set('services', 'svc_12', { name: 'Party Makeup', price: 2000, duration: 90, category: 'BRIDAL', description: null, isActive: true });

  // ─── PRODUCTS (12) ──────────────────────────────────────────────────────────
  set('products', 'prod_1', { name: "L'Oréal Shampoo", cost: 30, unit: 'ML', category: 'SHAMPOO', isActive: true });
  set('products', 'prod_2', { name: 'Schwarzkopf Shampoo', cost: 25, unit: 'ML', category: 'SHAMPOO', isActive: true });
  set('products', 'prod_3', { name: 'Wella Color', cost: 50, unit: 'ML', category: 'COLOR', isActive: true });
  set('products', 'prod_4', { name: 'Revlon Color', cost: 45, unit: 'ML', category: 'COLOR', isActive: true });
  set('products', 'prod_5', { name: 'Argan Oil', cost: 80, unit: 'ML', category: 'OIL', isActive: true });
  set('products', 'prod_6', { name: 'Coconut Oil', cost: 15, unit: 'ML', category: 'OIL', isActive: true });
  set('products', 'prod_7', { name: 'Hair Mask', cost: 40, unit: 'ML', category: 'CREAM', isActive: true });
  set('products', 'prod_8', { name: 'Styling Cream', cost: 35, unit: 'ML', category: 'CREAM', isActive: true });
  set('products', 'prod_9', { name: 'Deep Conditioning Mask', cost: 30, unit: 'ML', category: 'MASK', isActive: true });
  set('products', 'prod_10', { name: 'Hair Clips Set', cost: 200, unit: 'PCS', category: 'ACCESSORY', isActive: true });
  set('products', 'prod_11', { name: 'Comb Set', cost: 150, unit: 'PCS', category: 'ACCESSORY', isActive: true });
  set('products', 'prod_12', { name: 'Dry Shampoo', cost: 20, unit: 'ML', category: 'SHAMPOO', isActive: true });

  // ─── INVENTORY (15) ─────────────────────────────────────────────────────────
  set('inventory', 'inv_1', { storeId: 'store_1', productId: 'prod_1', quantity: 500, reorderLevel: 50 });
  set('inventory', 'inv_2', { storeId: 'store_1', productId: 'prod_3', quantity: 200, reorderLevel: 30 });
  set('inventory', 'inv_3', { storeId: 'store_1', productId: 'prod_5', quantity: 100, reorderLevel: 20 });
  set('inventory', 'inv_4', { storeId: 'store_1', productId: 'prod_7', quantity: 5, reorderLevel: 10 });   // LOW
  set('inventory', 'inv_5', { storeId: 'store_1', productId: 'prod_9', quantity: 0, reorderLevel: 10 });   // OUT OF STOCK
  set('inventory', 'inv_6', { storeId: 'store_2', productId: 'prod_1', quantity: 300, reorderLevel: 50 });
  set('inventory', 'inv_7', { storeId: 'store_2', productId: 'prod_2', quantity: 400, reorderLevel: 40 });
  set('inventory', 'inv_8', { storeId: 'store_2', productId: 'prod_6', quantity: 150, reorderLevel: 20 });
  set('inventory', 'inv_9', { storeId: 'store_2', productId: 'prod_4', quantity: 180, reorderLevel: 25 });
  set('inventory', 'inv_10', { storeId: 'store_3', productId: 'prod_1', quantity: 250, reorderLevel: 50 });
  set('inventory', 'inv_11', { storeId: 'store_3', productId: 'prod_8', quantity: 8, reorderLevel: 15 });   // LOW
  set('inventory', 'inv_12', { storeId: 'store_3', productId: 'prod_10', quantity: 30, reorderLevel: 5 });
  set('inventory', 'inv_13', { storeId: 'store_1', productId: 'prod_6', quantity: 200, reorderLevel: 30 });
  set('inventory', 'inv_14', { storeId: 'store_2', productId: 'prod_5', quantity: 80, reorderLevel: 15 });
  set('inventory', 'inv_15', { storeId: 'store_3', productId: 'prod_12', quantity: 3, reorderLevel: 10 });   // LOW

  // ─── CUSTOMERS (5) ──────────────────────────────────────────────────────────
  set('customers', 'cust_1', { name: 'Sneha Patel', phone: '9876543210', email: null, notes: null });
  set('customers', 'cust_2', { name: 'Ravi Kumar', phone: '9876543211', email: null, notes: null });
  set('customers', 'cust_3', { name: 'Aisha Khan', phone: '9876543212', email: null, notes: null });
  set('customers', 'cust_4', { name: 'Vikram Singh', phone: '9876543213', email: null, notes: null });
  set('customers', 'cust_5', { name: 'Priya Menon', phone: '9876543214', email: null, notes: null });

  // ─── APPOINTMENTS (5 active + 12 completed for transactions) ────────────────
  // Active appointments
  set('appointments', 'apt_1', {
    customerId: 'cust_1', storeId: 'store_1', employeeId: 'emp_3',
    serviceId: 'svc_9', date: '2026-05-22', time: '10:00', status: 'PENDING', notes: null,
  });
  set('appointments', 'apt_2', {
    customerId: 'cust_2', storeId: 'store_1', employeeId: 'emp_4',
    serviceId: 'svc_1', date: '2026-05-22', time: '11:00', status: 'PENDING', notes: null,
  });
  set('appointments', 'apt_3', {
    customerId: 'cust_3', storeId: 'store_2', employeeId: 'emp_6',
    serviceId: 'svc_4', date: '2026-05-22', time: '14:00', status: 'CONFIRMED', notes: null,
  });
  set('appointments', 'apt_4', {
    customerId: 'cust_4', storeId: 'store_1', employeeId: 'emp_3',
    serviceId: 'svc_7', date: '2026-05-22', time: '15:00', status: 'PENDING', notes: null,
  });
  set('appointments', 'apt_5', {
    customerId: 'cust_5', storeId: 'store_3', employeeId: 'emp_10',
    serviceId: 'svc_2', date: '2026-05-22', time: '09:30', status: 'PENDING', notes: null,
  });

  // Completed appointments for transactions (12 total across the week)
  const completedAppointments = [
    { id: 'apt_tx_1', cust: 'cust_1', store: 'store_1', emp: 'emp_3', svc: 'svc_9', date: '2026-05-15', time: '10:00' },
    { id: 'apt_tx_2', cust: 'cust_2', store: 'store_1', emp: 'emp_4', svc: 'svc_1', date: '2026-05-15', time: '11:30' },
    { id: 'apt_tx_3', cust: 'cust_3', store: 'store_2', emp: 'emp_6', svc: 'svc_4', date: '2026-05-16', time: '14:00' },
    { id: 'apt_tx_4', cust: 'cust_1', store: 'store_1', emp: 'emp_3', svc: 'svc_7', date: '2026-05-17', time: '10:00' },
    { id: 'apt_tx_5', cust: 'cust_5', store: 'store_3', emp: 'emp_10', svc: 'svc_2', date: '2026-05-17', time: '09:30' },
    { id: 'apt_tx_6', cust: 'cust_4', store: 'store_2', emp: 'emp_7', svc: 'svc_5', date: '2026-05-18', time: '13:00' },
    { id: 'apt_tx_7', cust: 'cust_2', store: 'store_1', emp: 'emp_3', svc: 'svc_8', date: '2026-05-19', time: '15:00' },
    { id: 'apt_tx_8', cust: 'cust_3', store: 'store_2', emp: 'emp_6', svc: 'svc_3', date: '2026-05-19', time: '16:00' },
    { id: 'apt_tx_9', cust: 'cust_1', store: 'store_3', emp: 'emp_10', svc: 'svc_10', date: '2026-05-20', time: '11:00' },
    { id: 'apt_tx_10', cust: 'cust_5', store: 'store_2', emp: 'emp_7', svc: 'svc_6', date: '2026-05-20', time: '10:00' },
    { id: 'apt_tx_11', cust: 'cust_4', store: 'store_1', emp: 'emp_4', svc: 'svc_1', date: '2026-05-21', time: '09:00' },
    { id: 'apt_tx_12', cust: 'cust_2', store: 'store_3', emp: 'emp_11', svc: 'svc_12', date: '2026-05-21', time: '14:00' },
  ];

  for (const apt of completedAppointments) {
    set('appointments', apt.id, {
      customerId: apt.cust,
      storeId: apt.store,
      employeeId: apt.emp,
      serviceId: apt.svc,
      date: apt.date,
      time: apt.time,
      status: 'COMPLETED',
      notes: null,
    });
  }

  // ─── TRANSACTIONS (12) with completedAt timestamps ───────────────────────────
  // Service prices: svc_1=300, svc_2=150, svc_3=100, svc_4=1500, svc_5=2000,
  //   svc_6=3000, svc_7=3000, svc_8=500, svc_9=500, svc_10=400, svc_11=5000, svc_12=2000
  // Owner share = 50%, Employee gross = 50%
  const transactions = [
    // tx_1: Hair Spa ₹500 @ store_1 by emp_3 on May 15
    {
      id: 'tx_1', apt: 'apt_tx_1', emp: 'emp_3', store: 'store_1', svc: 'svc_9',
      price: 500, date: '2026-05-15T10:30:00.000Z',
      products: [
        { id: 'tp_1', prod: 'prod_7', qty: 50, unitCost: 30, total: 1500 },  // Hair Mask
        { id: 'tp_2', prod: 'prod_12', qty: 30, unitCost: 20, total: 600 },   // Dry Shampoo
      ],
    },
    // tx_2: Haircut ₹300 @ store_1 by emp_4 on May 15
    {
      id: 'tx_2', apt: 'apt_tx_2', emp: 'emp_4', store: 'store_1', svc: 'svc_1',
      price: 300, date: '2026-05-15T12:00:00.000Z',
      products: [
        { id: 'tp_3', prod: 'prod_6', qty: 10, unitCost: 15, total: 150 },   // Coconut Oil
      ],
    },
    // tx_3: Hair Coloring ₹1500 @ store_2 by emp_6 on May 16
    {
      id: 'tx_3', apt: 'apt_tx_3', emp: 'emp_6', store: 'store_2', svc: 'svc_4',
      price: 1500, date: '2026-05-16T15:30:00.000Z',
      products: [
        { id: 'tp_4', prod: 'prod_3', qty: 60, unitCost: 50, total: 3000 },  // Wella Color
        { id: 'tp_5', prod: 'prod_1', qty: 20, unitCost: 30, total: 600 },   // L'Oréal Shampoo
      ],
    },
    // tx_4: Keratin Treatment ₹3000 @ store_1 by emp_3 on May 17
    {
      id: 'tx_4', apt: 'apt_tx_4', emp: 'emp_3', store: 'store_1', svc: 'svc_7',
      price: 3000, date: '2026-05-17T12:00:00.000Z',
      products: [
        { id: 'tp_6', prod: 'prod_5', qty: 30, unitCost: 80, total: 2400 },  // Argan Oil
      ],
    },
    // tx_5: Hair Trim ₹150 @ store_3 by emp_10 on May 17
    {
      id: 'tx_5', apt: 'apt_tx_5', emp: 'emp_10', store: 'store_3', svc: 'svc_2',
      price: 150, date: '2026-05-17T10:00:00.000Z',
      products: [],
    },
    // tx_6: Highlights ₹2000 @ store_2 by emp_7 on May 18
    {
      id: 'tx_6', apt: 'apt_tx_6', emp: 'emp_7', store: 'store_2', svc: 'svc_5',
      price: 2000, date: '2026-05-18T15:00:00.000Z',
      products: [
        { id: 'tp_7', prod: 'prod_4', qty: 40, unitCost: 45, total: 1800 },  // Revlon Color
        { id: 'tp_8', prod: 'prod_9', qty: 20, unitCost: 30, total: 600 },   // Deep Conditioning Mask
      ],
    },
    // tx_7: Deep Conditioning ₹500 @ store_1 by emp_3 on May 19
    {
      id: 'tx_7', apt: 'apt_tx_7', emp: 'emp_3', store: 'store_1', svc: 'svc_8',
      price: 500, date: '2026-05-19T16:00:00.000Z',
      products: [
        { id: 'tp_9', prod: 'prod_9', qty: 25, unitCost: 30, total: 750 },   // Deep Conditioning Mask
      ],
    },
    // tx_8: Beard Styling ₹100 @ store_2 by emp_6 on May 19
    {
      id: 'tx_8', apt: 'apt_tx_8', emp: 'emp_6', store: 'store_2', svc: 'svc_3',
      price: 100, date: '2026-05-19T16:30:00.000Z',
      products: [
        { id: 'tp_10', prod: 'prod_6', qty: 5, unitCost: 15, total: 75 },    // Coconut Oil
      ],
    },
    // tx_9: Scalp Treatment ₹400 @ store_3 by emp_10 on May 20
    {
      id: 'tx_9', apt: 'apt_tx_9', emp: 'emp_10', store: 'store_3', svc: 'svc_10',
      price: 400, date: '2026-05-20T12:00:00.000Z',
      products: [
        { id: 'tp_11', prod: 'prod_8', qty: 15, unitCost: 35, total: 525 },  // Styling Cream
      ],
    },
    // tx_10: Balayage ₹3000 @ store_2 by emp_7 on May 20
    {
      id: 'tx_10', apt: 'apt_tx_10', emp: 'emp_7', store: 'store_2', svc: 'svc_6',
      price: 3000, date: '2026-05-20T12:00:00.000Z',
      products: [
        { id: 'tp_12', prod: 'prod_5', qty: 25, unitCost: 80, total: 2000 }, // Argan Oil
        { id: 'tp_13', prod: 'prod_3', qty: 30, unitCost: 50, total: 1500 }, // Wella Color
      ],
    },
    // tx_11: Haircut ₹300 @ store_1 by emp_4 on May 21
    {
      id: 'tx_11', apt: 'apt_tx_11', emp: 'emp_4', store: 'store_1', svc: 'svc_1',
      price: 300, date: '2026-05-21T09:30:00.000Z',
      products: [],
    },
    // tx_12: Party Makeup ₹2000 @ store_3 by emp_11 on May 21
    {
      id: 'tx_12', apt: 'apt_tx_12', emp: 'emp_11', store: 'store_3', svc: 'svc_12',
      price: 2000, date: '2026-05-21T15:00:00.000Z',
      products: [
        { id: 'tp_14', prod: 'prod_8', qty: 20, unitCost: 35, total: 700 },  // Styling Cream
      ],
    },
  ];

  for (const tx of transactions) {
    const totalProductCost = tx.products.reduce((sum, p) => sum + p.total, 0);
    const ownerShare = tx.price * 0.5;
    const employeeGrossShare = tx.price * 0.5;
    const employeeNetShare = employeeGrossShare - totalProductCost;

    set('transactions', tx.id, {
      appointmentId: tx.apt,
      employeeId: tx.emp,
      storeId: tx.store,
      serviceId: tx.svc,
      servicePrice: tx.price,
      ownerShare,
      employeeGrossShare,
      totalProductCost,
      employeeNetShare,
      completedAt: Timestamp.fromDate(new Date(tx.date)),
    });

    // Transaction products
    for (const p of tx.products) {
      set('transactionProducts', p.id, {
        transactionId: tx.id,
        productId: p.prod,
        quantityUsed: p.qty,
        unitCost: p.unitCost,
        totalCost: p.total,
      });
    }
  }

  // ─── ATTENDANCE (5 for today) ───────────────────────────────────────────────
  set('attendance', 'att_1', {
    employeeId: 'emp_2', storeId: 'store_1', date: '2026-05-22',
    checkIn: '09:00', checkOut: null, status: 'PRESENT',
  });
  set('attendance', 'att_2', {
    employeeId: 'emp_3', storeId: 'store_1', date: '2026-05-22',
    checkIn: '09:15', checkOut: null, status: 'PRESENT',
  });
  set('attendance', 'att_3', {
    employeeId: 'emp_4', storeId: 'store_1', date: '2026-05-22',
    checkIn: '09:30', checkOut: null, status: 'PRESENT',
  });
  set('attendance', 'att_4', {
    employeeId: 'emp_6', storeId: 'store_2', date: '2026-05-22',
    checkIn: '09:00', checkOut: null, status: 'PRESENT',
  });
  set('attendance', 'att_5', {
    employeeId: 'emp_10', storeId: 'store_3', date: '2026-05-22',
    checkIn: '09:00', checkOut: null, status: 'PRESENT',
  });

  // ─── EXPENSES (8) ───────────────────────────────────────────────────────────
  set('expenses', 'exp_1', {
    storeId: 'store_1', category: 'RENT',
    description: 'Monthly rent MG Road', amount: 50000, expenseDate: '2026-05-01',
  });
  set('expenses', 'exp_2', {
    storeId: 'store_1', category: 'UTILITIES',
    description: 'Electricity bill May', amount: 8000, expenseDate: '2026-05-05',
  });
  set('expenses', 'exp_3', {
    storeId: 'store_1', category: 'SALARY',
    description: 'Staff salary May', amount: 45000, expenseDate: '2026-05-01',
  });
  set('expenses', 'exp_4', {
    storeId: 'store_2', category: 'RENT',
    description: 'Monthly rent Koramangala', amount: 40000, expenseDate: '2026-05-01',
  });
  set('expenses', 'exp_5', {
    storeId: 'store_2', category: 'SUPPLIES',
    description: 'Hair products restock', amount: 12000, expenseDate: '2026-05-10',
  });
  set('expenses', 'exp_6', {
    storeId: 'store_3', category: 'RENT',
    description: 'Monthly rent Whitefield', amount: 35000, expenseDate: '2026-05-01',
  });
  set('expenses', 'exp_7', {
    storeId: 'store_1', category: 'MAINTENANCE',
    description: 'AC repair MG Road', amount: 3500, expenseDate: '2026-05-15',
  });
  set('expenses', 'exp_8', {
    storeId: 'store_2', category: 'MARKETING',
    description: 'Instagram ads', amount: 5000, expenseDate: '2026-05-08',
  });

  // Commit all writes atomically
  await batch.commit();

  return {
    success: true,
    message: 'Firestore seeded with demo data',
    counts: {
      stores: 3,
      employees: 11,
      services: 12,
      products: 12,
      inventory: 15,
      customers: 5,
      appointments: 17,
      transactions: 12,
      transactionProducts: 14,
      attendance: 5,
      expenses: 8,
    },
  };
}
