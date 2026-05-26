# Firebase Firestore Setup Guide

This guide walks you through setting up Firebase Firestore for the Dream Look salon management system.

## Prerequisites
- A Google account
- The Firebase CLI installed (optional, only if you want CLI access)

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** (or "Create a project")
3. Enter project name: **`dream-look-salon`**
4. You can disable Google Analytics (not needed for this app)
5. Click **Create project**
6. Wait for provisioning to complete

## Step 2: Enable Cloud Firestore

1. In your project dashboard, click **"Build"** → **"Firestore Database"** in the left sidebar
2. Click **"Create database"**
3. Choose **"Start in test mode"** (allows all reads/writes for 30 days)
4. Select a location closest to you (e.g., `asia-south1` for India)
5. Click **Enable**

## Step 3: Generate Service Account Private Key

1. Go to **Project Settings** (gear icon ⚙️ in the left sidebar)
2. Click the **"Service Accounts"** tab
3. Under **"Firebase Admin SDK"**, click **"Generate new private key"**
4. Click **Generate key** to download the JSON file
5. **Keep this file secure** — it grants full admin access to your Firebase project

## Step 4: Configure Environment Variables

1. Open the downloaded JSON file. It contains:
   ```json
   {
     "type": "service_account",
     "project_id": "dream-look-salon",
     "private_key_id": "...",
     "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----",
     "client_email": "firebase-adminsdk-...@dream-look-salon.iam.gserviceaccount.com",
     ...
   }
   ```

2. Edit `.env.local` in your project root and fill in the values:

   ```env
   FIREBASE_PROJECT_ID=dream-look-salon
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@dream-look-salon.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADA...your_key_here...\n-----END PRIVATE KEY-----"
   ```

   **Important**: The `FIREBASE_PRIVATE_KEY` must be wrapped in double quotes to preserve newlines. Copy the entire `private_key` value from the JSON file including the `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` markers.

## Step 5: Seed the Database

1. Start your dev server:
   ```bash
   bun run dev
   ```

2. Seed the database with demo data:
   ```bash
   curl -X POST http://localhost:3000/api/salon/seed
   ```

   Or use a tool like Postman/Insomnia to send a POST request to `http://localhost:3000/api/salon/seed`.

3. You should see a success response:
   ```json
   {
     "success": true,
     "message": "Firestore seeded with demo data",
     "counts": {
       "stores": 3,
       "employees": 11,
       "services": 12,
       "products": 12,
       "inventory": 15,
       "customers": 5,
       "appointments": 17,
       "transactions": 12,
       "transactionProducts": 14,
       "attendance": 5,
       "expenses": 8
     }
   }
   ```

## Step 6: Verify in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **dream-look-salon**
3. Click **"Firestore Database"** in the left sidebar
4. You should see all the collections populated with data

## Step 7: Restart Dev Server

After setting up `.env.local`, restart your development server:

```bash
bun run dev
```

## Troubleshooting

### "FIREBASE_PROJECT_ID is not defined"
- Make sure `.env.local` exists in the project root
- Restart the dev server after creating/modifying `.env.local`

### "Permission denied" errors
- Make sure Firestore is in **test mode** or you've set up proper security rules
- Verify your service account key is correct

### "Private key is not valid"
- Ensure the private key in `.env.local` is wrapped in double quotes
- Make sure `\n` characters in the key are preserved (don't replace with actual newlines in the .env file)

### Seeding fails
- Ensure you've completed Steps 1-4 before seeding
- Check the server terminal for detailed error messages
- Try clearing Firestore data and re-seeding

## Security Rules (Production)

For production, update your Firestore security rules in the Firebase Console:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Deny all client-side access (we use Admin SDK from server)
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

Since all database operations go through the Firebase Admin SDK on the server side (API routes), client-side access is not needed.
