import { getFirebaseAdmin } from '../src/lib/firebase-admin';

async function main() {
  const admin = getFirebaseAdmin();
  const db = admin.firestore();

  const storeId = 'store_1';
  const employeeId = 'emp_test_123';
  const customerId = 'cust_test_123';
  const serviceId = 'srv_test_123';
  const transactionId = 'txn_test_123';

  console.log('Adding test employee...');
  await db.collection('employees').doc(employeeId).set({
    id: employeeId,
    name: 'John Doe Test',
    phone: '9998887776',
    role: 'STYLIST',
    storeId: storeId,
    storeName: 'Dream Look - MG Road',
    storeCity: 'Bangalore',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  console.log('Adding test customer...');
  await db.collection('customers').doc(customerId).set({
    id: customerId,
    name: 'Alice Customer',
    phone: '9998887775',
    storeId: storeId,
    totalVisits: 1,
    totalSpent: 1000,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  console.log('Adding test service...');
  await db.collection('services').doc(serviceId).set({
    id: serviceId,
    name: 'Test Haircut',
    price: 1000,
    duration: 30,
    category: 'Hair',
    isActive: true
  });

  console.log('Adding test transaction...');
  await db.collection('transactions').doc(transactionId).set({
    id: transactionId,
    appointmentId: 'app_test_123',
    employeeId: employeeId,
    storeId: storeId,
    serviceId: serviceId,
    servicePrice: 1000,
    ownerShare: 500,
    employeeGrossShare: 500,
    totalProductCost: 0,
    employeeNetShare: 500,
    completedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    employeeName: 'John Doe Test',
    serviceName: 'Test Haircut',
    storeName: 'Dream Look - MG Road'
  });

  console.log('Done!');
}

main().catch(console.error);
