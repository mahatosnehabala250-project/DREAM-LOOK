import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function dedup() {
  console.log('Starting deduplication...');

  // 1. Delete duplicate services (keep older ones)
  const allServices = await prisma.service.findMany({ orderBy: { createdAt: 'asc' } });
  const seenServices = new Map<string, string>();
  const dupServiceIds: string[] = [];
  for (const s of allServices) {
    if (seenServices.has(s.name)) {
      dupServiceIds.push(s.id);
    } else {
      seenServices.set(s.name, s.id);
    }
  }
  if (dupServiceIds.length > 0) {
    await prisma.service.deleteMany({ where: { id: { in: dupServiceIds } } });
    console.log(`Deleted ${dupServiceIds.length} duplicate services`);
  }

  // 2. Delete duplicate stores (keep older ones)
  const allStores = await prisma.store.findMany({ orderBy: { createdAt: 'asc' } });
  const seenStores = new Map<string, string>();
  const dupStoreIds: string[] = [];
  for (const s of allStores) {
    if (seenStores.has(s.name)) {
      dupStoreIds.push(s.id);
    } else {
      seenStores.set(s.name, s.id);
    }
  }
  if (dupStoreIds.length > 0) {
    // Move employees from duplicate stores to original stores
    const empOnDupStores = await prisma.employee.findMany({ where: { storeId: { in: dupStoreIds } } });
    if (empOnDupStores.length > 0) {
      console.log(`Moving ${empOnDupStores.length} employees from duplicate stores...`);
      for (const emp of empOnDupStores) {
        const storeName = allStores.find(s => s.id === emp.storeId)?.name || '';
        const origStoreId = seenStores.get(storeName);
        if (origStoreId) {
          await prisma.employee.update({ where: { id: emp.id }, data: { storeId: origStoreId } });
        }
      }
    }
    await prisma.store.deleteMany({ where: { id: { in: dupStoreIds } } });
    console.log(`Deleted ${dupStoreIds.length} duplicate stores`);
  }

  // 3. Delete duplicate products (keep older ones)
  const allProducts = await prisma.product.findMany({ orderBy: { createdAt: 'asc' } });
  const seenProducts = new Map<string, string>();
  const dupProductIds: string[] = [];
  for (const p of allProducts) {
    if (seenProducts.has(p.name)) {
      dupProductIds.push(p.id);
    } else {
      seenProducts.set(p.name, p.id);
    }
  }
  if (dupProductIds.length > 0) {
    await prisma.inventory.deleteMany({ where: { productId: { in: dupProductIds } } });
    await prisma.product.deleteMany({ where: { id: { in: dupProductIds } } });
    console.log(`Deleted ${dupProductIds.length} duplicate products`);
  }

  // Verify
  const svcCount = await prisma.service.count();
  const storeCount = await prisma.store.count();
  const prodCount = await prisma.product.count();
  const empCount = await prisma.employee.count();
  const custCount = await prisma.customer.count();
  console.log(`Final: Services=${svcCount}, Stores=${storeCount}, Products=${prodCount}, Employees=${empCount}, Customers=${custCount}`);

  await prisma.$disconnect();
}

dedup().catch(e => { console.error(e); process.exit(1); });
