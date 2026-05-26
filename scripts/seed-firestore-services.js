/**
 * Seed Firebase Firestore with salon services for Dream Look.
 * Run: node scripts/seed-firestore-services.js
 * 
 * Reads service account from:
 *   1. FIREBASE_SERVICE_ACCOUNT_KEY env var (JSON string)
 *   2. firebase-service-account.json in project root
 */

/* eslint-disable @typescript-eslint/no-require-imports */
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// ── Load service account ────────────────────────────────────────────────────
let serviceAccount;
const envKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

if (envKey) {
  try {
    serviceAccount = JSON.parse(envKey);
    console.log('[Seed] Using service account from FIREBASE_SERVICE_ACCOUNT_KEY env var');
  } catch {
    console.error('[Seed] FIREBASE_SERVICE_ACCOUNT_KEY env var exists but is not valid JSON');
    process.exit(1);
  }
} else {
  const saPath = path.join(__dirname, '..', 'firebase-service-account.json');
  if (fs.existsSync(saPath)) {
    serviceAccount = JSON.parse(fs.readFileSync(saPath, 'utf-8'));
    console.log('[Seed] Using service account from firebase-service-account.json');
  } else {
    console.error('[Seed] No service account found. Set FIREBASE_SERVICE_ACCOUNT_KEY or place firebase-service-account.json in project root.');
    process.exit(1);
  }
}

// ── Initialize Firebase ─────────────────────────────────────────────────────
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const firestore = admin.firestore();
const now = new Date().toISOString();

// ── 12 Dream Look salon services ────────────────────────────────────────────
const services = [
  {
    id: 'svc_1',
    name: 'Haircut (Men)',
    price: 100,
    duration: 30,
    category: 'HAIRCUT',
    description: "Classic men's haircut",
    ownerPercent: 50,
    employeePercent: 50,
    isActive: true,
  },
  {
    id: 'svc_2',
    name: 'Haircut (Women)',
    price: 250,
    duration: 45,
    category: 'HAIRCUT',
    description: "Women's haircut and styling",
    ownerPercent: 50,
    employeePercent: 50,
    isActive: true,
  },
  {
    id: 'svc_3',
    name: 'Beard Trim & Shape',
    price: 50,
    duration: 15,
    category: 'HAIRCUT',
    description: 'Beard shaping and trimming',
    ownerPercent: 50,
    employeePercent: 50,
    isActive: true,
  },
  {
    id: 'svc_4',
    name: 'Hair Coloring',
    price: 500,
    duration: 60,
    category: 'COLOR',
    description: 'Full hair coloring',
    ownerPercent: 50,
    employeePercent: 50,
    isActive: true,
  },
  {
    id: 'svc_5',
    name: 'Hair Highlights',
    price: 800,
    duration: 90,
    category: 'COLOR',
    description: 'Partial highlights',
    ownerPercent: 50,
    employeePercent: 50,
    isActive: true,
  },
  {
    id: 'svc_6',
    name: 'Hair Spa & Treatment',
    price: 400,
    duration: 45,
    category: 'TREATMENT',
    description: 'Deep conditioning spa',
    ownerPercent: 50,
    employeePercent: 50,
    isActive: true,
  },
  {
    id: 'svc_7',
    name: 'Keratin Treatment',
    price: 2000,
    duration: 90,
    category: 'TREATMENT',
    description: 'Smoothing keratin treatment',
    ownerPercent: 50,
    employeePercent: 50,
    isActive: true,
  },
  {
    id: 'svc_8',
    name: 'Facial (Classic)',
    price: 300,
    duration: 40,
    category: 'SPA',
    description: 'Deep cleansing facial',
    ownerPercent: 50,
    employeePercent: 50,
    isActive: true,
  },
  {
    id: 'svc_9',
    name: 'Facial (Gold)',
    price: 600,
    duration: 60,
    category: 'SPA',
    description: 'Gold facial with glow',
    ownerPercent: 50,
    employeePercent: 50,
    isActive: true,
  },
  {
    id: 'svc_10',
    name: 'Head Massage',
    price: 150,
    duration: 20,
    category: 'SPA',
    description: 'Relaxing oil head massage',
    ownerPercent: 50,
    employeePercent: 50,
    isActive: true,
  },
  {
    id: 'svc_11',
    name: 'Bridal Makeup',
    price: 5000,
    duration: 120,
    category: 'BRIDAL',
    description: 'Complete bridal package',
    ownerPercent: 50,
    employeePercent: 50,
    isActive: true,
  },
  {
    id: 'svc_12',
    name: 'Manicure & Pedicure',
    price: 350,
    duration: 40,
    category: 'SPA',
    description: 'Complete nail care',
    ownerPercent: 50,
    employeePercent: 50,
    isActive: true,
  },
];

// ── Seed function ───────────────────────────────────────────────────────────
async function seed() {
  console.log('\n🔥 Seeding Firestore `services` collection with 12 Dream Look services...\n');

  const batch = firestore.batch();
  for (const svc of services) {
    const ref = firestore.collection('services').doc(svc.id);
    batch.set(ref, {
      ...svc,
      createdAt: now,
      updatedAt: now,
    });
    console.log(`  💇 ${svc.id} — ${svc.name} — ₹${svc.price} — ${svc.duration}min — ${svc.category}`);
  }
  await batch.commit();

  console.log(`\n✅ ${services.length} services seeded successfully\n`);

  // ── Verify: read all back ──
  const snapshot = await firestore.collection('services').orderBy('name', 'asc').get();
  const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  console.log(`📋 Verification: ${docs.length} services in Firestore:`);
  for (const doc of docs) {
    const active = doc.isActive ? '✅' : '❌';
    console.log(`  ${active} ${doc.id} — ${doc.name} — ₹${doc.price}`);
  }

  console.log('\n🎉 Services seeding complete!');
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
