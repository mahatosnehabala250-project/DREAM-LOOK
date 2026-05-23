import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

async function createPrismaClient() {
  // If TURSO_DATABASE_URL is set, use LibSQL adapter (for Vercel/Turso deployment)
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;

  if (tursoUrl) {
    // Dynamic import for Turso adapter (ESM)
    const [{ PrismaLibSQL }, { createClient }] = await Promise.all([
      import('@prisma/adapter-libsql'),
      import('@libsql/client'),
    ]);

    const libsql = createClient({
      url: tursoUrl,
      authToken: tursoToken,
    });

    const adapter = new PrismaLibSQL(libsql);
    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === 'development' ? ['error'] : [],
    });
  }

  // Local development: use SQLite file
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query'] : ['error'],
  });
}

// We need to handle the async initialization
let _db: PrismaClient | undefined = globalForPrisma.prisma;

async function getDb(): Promise<PrismaClient> {
  if (!_db) {
    _db = await createPrismaClient();
    if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = _db;
  }
  return _db;
}

// For synchronous usage (local dev with SQLite)
export const db: PrismaClient = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
