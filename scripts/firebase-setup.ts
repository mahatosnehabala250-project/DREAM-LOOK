// Firebase Phone Auth Enable — Correct API format
import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { join } from 'path';

const SA = JSON.parse(readFileSync(join(process.cwd(), 'firebase-service-account.json'), 'utf-8'));
const PROJECT_ID = 'dream-look-e409a';

if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(SA) });

async function getToken() {
  const cred = admin.credential.cert(SA);
  const t = await cred.getAccessToken();
  return t.access_token!;
}

async function run() {
  const token = await getToken();
  console.log('✅ Auth OK\n');

  // ─── PHONE AUTH: Method 1 — signInConfig format ───
  console.log('📱 Enabling Phone Auth (v2 API)...');
  
  const bodies = [
    // Method 1: signIn as array
    { signIn: [{ providerId: 'phone' }] },
    // Method 2: signInConfig  
    { signInConfig: { providerConfigs: [{ providerId: 'phone', enabled: true }] } },
    // Method 3: nested
    { signIn: { phone: { enabled: true, testPhoneNumbers: { '+919900000001': '111111' } } } },
  ];

  const endpoints = [
    `https://identitytoolkit.googleapis.com/admin/v2/projects/${PROJECT_ID}/config`,
    `https://identitytoolkit.googleapis.com/v1/projects/${PROJECT_ID}/config`,
  ];

  for (const ep of endpoints) {
    for (const body of bodies) {
      const r = await fetch(ep, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const d = await r.json().catch(() => null);
      const ok = r.ok || r.status === 200;
      console.log(`   ${ep.split('/').slice(-2).join('/')} → ${r.status} ${ok ? '✅' : ''} ${JSON.stringify(d).substring(0, 150)}`);
      if (ok) break;
    }
  }

  // ─── FIREBASE MANAGEMENT API ───
  console.log('\n🔧 Trying Firebase Management API...');
  
  // Enable Auth
  const r1 = await fetch(
    `https://firebase.googleapis.com/v1beta1/projects/${PROJECT_ID}:initializeAuth`,
    {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    }
  );
  const d1 = await r1.json().catch(() => null);
  console.log(`   Initialize Auth: ${r1.status} — ${JSON.stringify(d1).substring(0, 200)}`);

  // ─── CHECK CURRENT CONFIG ───
  console.log('\n📋 Current Auth Config:');
  const r2 = await fetch(
    `https://identitytoolkit.googleapis.com/admin/v2/projects/${PROJECT_ID}/config`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  );
  const d2 = await r2.json().catch(() => null);
  if (d2) {
    console.log(`   signIn: ${JSON.stringify(d2.signIn || 'not set').substring(0, 200)}`);
    console.log(`   signInConfig: ${JSON.stringify(d2.signInConfig || 'not set').substring(0, 200)}`);
    console.log(`   smsAuthConfig: ${JSON.stringify(d2.smsAuthConfig || 'not set').substring(0, 200)}`);
  } else {
    console.log(`   ${r2.status}: ${JSON.stringify(d2).substring(0, 200)}`);
  }

  console.log('\n✅ Done!');
}

run().catch(e => console.error('❌', e.message));
