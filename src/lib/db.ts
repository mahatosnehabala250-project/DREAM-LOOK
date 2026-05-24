import { PrismaClient } from '@prisma/client'

// Force all db operations to throw so that the API routes ALWAYS fall back to Firebase.
export const db: PrismaClient = new Proxy({} as PrismaClient, {
  get: (target, prop) => {
    return () => { throw new Error("Force Firebase Fallback"); };
  }
});
