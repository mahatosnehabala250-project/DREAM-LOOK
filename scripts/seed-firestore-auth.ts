/**
 * Seed Firebase Firestore with employee login data for Vercel deployment.
 * Run: bun scripts/seed-firestore-auth.ts
 */
import admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';
import path from 'path';

// ── Load service account ────────────────────────────────────────────────────
const SA_PATH = path.join(process.cwd(), 'firebase-service-account.json');
const envKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
const SA = envKey ? JSON.parse(envKey) : JSON.parse(readFileSync(SA_PATH, 'utf-8'));

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(SA) });
}

const firestore = admin.firestore();

// ── Employee data (from seed.ts) ────────────────────────────────────────────
interface EmployeeSeed {
  id: string;
  name: string;
  phone: string;
  role: 'OWNER' | 'MANAGER' | 'STYLIST';
  storeId: string;
  storeName: string;
  storeCity: string;
  isActive: boolean;
}

const employees: EmployeeSeed[] = [
  // Owner
  { id: 'emp_owner_1', name: 'Rajesh Kumar', phone: '9900000001', role: 'OWNER', storeId: 'store_1', storeName: 'Dream Look - MG Road', storeCity: 'Bangalore', isActive: true },
  // Manager
  { id: 'emp_mgr_1', name: 'Priya Sharma', phone: '9900000002', role: 'MANAGER', storeId: 'store_1', storeName: 'Dream Look - MG Road', storeCity: 'Bangalore', isActive: true },
  // Stylists - Store 1 (MG Road)
  { id: 'emp_sty_1', name: 'Anitha Reddy', phone: '9900000003', role: 'STYLIST', storeId: 'store_1', storeName: 'Dream Look - MG Road', storeCity: 'Bangalore', isActive: true },
  { id: 'emp_sty_2', name: 'Kiran Patel', phone: '9900000004', role: 'STYLIST', storeId: 'store_1', storeName: 'Dream Look - MG Road', storeCity: 'Bangalore', isActive: true },
  { id: 'emp_sty_3', name: 'Deepa Nair', phone: '9900000005', role: 'STYLIST', storeId: 'store_1', storeName: 'Dream Look - MG Road', storeCity: 'Bangalore', isActive: true },
  // Stylists - Store 2 (Koramangala)
  { id: 'emp_sty_4', name: 'Vikram Singh', phone: '9900000006', role: 'STYLIST', storeId: 'store_2', storeName: 'Dream Look - Koramangala', storeCity: 'Bangalore', isActive: true },
  { id: 'emp_sty_5', name: 'Lakshmi Iyer', phone: '9900000007', role: 'STYLIST', storeId: 'store_2', storeName: 'Dream Look - Koramangala', storeCity: 'Bangalore', isActive: true },
  { id: 'emp_sty_6', name: 'Suresh Menon', phone: '9900000008', role: 'STYLIST', storeId: 'store_2', storeName: 'Dream Look - Koramangala', storeCity: 'Bangalore', isActive: true },
  // Stylists - Store 3 (Whitefield)
  { id: 'emp_sty_7', name: 'Ritu Gupta', phone: '9900000009', role: 'STYLIST', storeId: 'store_3', storeName: 'Dream Look - Whitefield', storeCity: 'Bangalore', isActive: true },
];

// ── Store data ──────────────────────────────────────────────────────────────
interface StoreSeed {
  id: string;
  name: string;
  address: string;
  phone: string;
  city: string;
}

const stores: StoreSeed[] = [
  { id: 'store_1', name: 'Dream Look - MG Road', address: '42, MG Road, Indiranagar', phone: '+91 98765 43210', city: 'Bangalore' },
  { id: 'store_2', name: 'Dream Look - Koramangala', address: '15, 100ft Road, Koramangala 4th Block', phone: '+91 98765 43211', city: 'Bangalore' },
  { id: 'store_3', name: 'Dream Look - Whitefield', address: '78, ITPL Main Road, Whitefield', phone: '+91 98765 43212', city: 'Bangalore' },
];

// ── Seed function ───────────────────────────────────────────────────────────
async function seed() {
  console.log('🔥 Seeding Firebase Firestore with Dream Look data...\n');

  // Seed stores
  const storesBatch = firestore.batch();
  for (const store of stores) {
    const ref = firestore.collection('stores').doc(store.id);
    storesBatch.set(ref, {
      ...store,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`  📦 Store: ${store.name}`);
  }
  await storesBatch.commit();
  console.log(`✅ ${stores.length} stores seeded\n`);

  // Seed employees
  const empBatch = firestore.batch();
  for (const emp of employees) {
    const ref = firestore.collection('employees').doc(emp.phone); // Use phone as doc ID for quick lookup
    empBatch.set(ref, {
      id: emp.id,
      name: emp.name,
      phone: emp.phone,
      role: emp.role,
      storeId: emp.storeId,
      storeName: emp.storeName,
      storeCity: emp.storeCity,
      isActive: emp.isActive,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`  👤 ${emp.name} (${emp.phone}) — ${emp.role} @ ${emp.storeName}`);
  }
  await empBatch.commit();
  console.log(`\n✅ ${employees.length} employees seeded\n`);

  // Verify: read one back
  const ownerDoc = await firestore.collection('employees').doc('9900000001').get();
  if (ownerDoc.exists) {
    console.log('✅ Verification — Owner doc:', ownerDoc.data());
  }

  console.log('\n🎉 Firestore seeding complete!');
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
