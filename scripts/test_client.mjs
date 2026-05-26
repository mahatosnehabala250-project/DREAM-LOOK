import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { randomUUID } from 'crypto';

const firebaseConfig = {
  apiKey: 'AIzaSyDlcwI3zm1XoveaThObLtDTbTekKxkqbTE',
  authDomain: 'dream-look-e409a.firebaseapp.com',
  projectId: 'dream-look-e409a',
  storageBucket: 'dream-look-e409a.firebasestorage.app',
  messagingSenderId: '37086154732',
  appId: '1:37086154732:web:5bfa3fa8f809e7fb473ac9',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function main() {
  const storeId = 'store_1';
  const storeName = 'Dream Look - MG Road';
  const employeeId = 'emp_test_99';
  const customerId = 'cust_test_99';
  const serviceId = 'srv_test_99';
  const transactionId = 'txn_test_99';

  console.log('Adding test employee...');
  await setDoc(doc(db, 'employees', employeeId), {
    id: employeeId,
    name: 'Test Stylist User',
    phone: '9999988888',
    role: 'STYLIST',
    storeId: storeId,
    storeName: storeName,
    storeCity: 'Bangalore',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  console.log('Adding test customer...');
  await setDoc(doc(db, 'customers', customerId), {
    id: customerId,
    name: 'Test Customer',
    phone: '9999988887',
    storeId: storeId,
    totalVisits: 1,
    totalSpent: 2000,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  console.log('Adding test service...');
  await setDoc(doc(db, 'services', serviceId), {
    id: serviceId,
    name: 'Premium Haircut',
    price: 2000,
    duration: 60,
    category: 'Hair',
    isActive: true
  });

  console.log('Adding test transaction...');
  await setDoc(doc(db, 'transactions', transactionId), {
    id: transactionId,
    appointmentId: 'app_test_99',
    employeeId: employeeId,
    storeId: storeId,
    serviceId: serviceId,
    servicePrice: 2000,
    ownerShare: 1000,
    employeeGrossShare: 1000,
    totalProductCost: 0,
    employeeNetShare: 1000,
    completedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    employeeName: 'Test Stylist User',
    serviceName: 'Premium Haircut',
    storeName: storeName,
    productsUsed: []
  });

  console.log('Success! Test data added via Client SDK.');
  process.exit(0);
}

main().catch(console.error);
