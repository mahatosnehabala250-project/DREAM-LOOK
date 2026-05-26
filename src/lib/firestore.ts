import { db, FieldValue, Timestamp } from './firebase';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface FilterClause {
  field: string;
  op: '==' | '!=' | '<' | '<=' | '>' | '>=' | 'in' | 'array-contains' | 'array-contains-any';
  value: unknown;
}

export interface BatchOperation {
  type: 'create' | 'update' | 'delete' | 'set';
  collection: string;
  id: string;
  data?: Record<string, unknown>;
}

// ─── Core CRUD Helpers ────────────────────────────────────────────────────────

/**
 * Convert a Firestore document snapshot to a plain JS object with ISO date strings.
 */
export function docToObj<T = Record<string, unknown>>(
  doc: FirebaseFirestore.QueryDocumentSnapshot
): T & { id: string } {
  const data = doc.data() as Record<string, unknown>;
  const result: Record<string, unknown> = { id: doc.id, ...convertTimestamps(data) };
  return result as T & { id: string };
}

/**
 * Convert Firestore Timestamps to ISO strings recursively.
 */
function convertTimestamps(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (obj instanceof Timestamp) return obj.toDate().toISOString();
  if (obj instanceof Date) return obj.toISOString();
  if (Array.isArray(obj)) return obj.map(convertTimestamps);
  if (typeof obj === 'object') {
    const converted: Record<string, unknown> = {};
    for (const key of Object.keys(obj as Record<string, unknown>)) {
      converted[key] = convertTimestamps((obj as Record<string, unknown>)[key]);
    }
    return converted;
  }
  return obj;
}

/**
 * Get a single document by ID from a collection.
 */
export async function getDoc<T = Record<string, unknown>>(
  collection: string,
  id: string
): Promise<(T & { id: string }) | null> {
  const snap = await db.collection(collection).doc(id).get();
  if (!snap.exists) return null;
  return docToObj<T>(snap as FirebaseFirestore.QueryDocumentSnapshot);
}

/**
 * Get multiple documents from a collection with optional filters.
 */
export async function getDocs<T = Record<string, unknown>>(
  collection: string,
  filters?: FilterClause[],
  orderBy?: { field: string; direction?: 'asc' | 'desc' }
): Promise<(T & { id: string })[]> {
  let query: FirebaseFirestore.Query = db.collection(collection);

  if (filters) {
    for (const f of filters) {
      query = query.where(f.field, f.op, f.value);
    }
  }

  if (orderBy) {
    query = query.orderBy(orderBy.field, orderBy.direction || 'asc');
  }

  const snapshot = await query.get();
  return snapshot.docs.map(
    (doc) => docToObj<T>(doc as FirebaseFirestore.QueryDocumentSnapshot)
  );
}

/**
 * Create a document with auto-generated or specific ID.
 */
export async function createDoc<T = Record<string, unknown>>(
  collection: string,
  data: Record<string, unknown>,
  id?: string
): Promise<(T & { id: string })> {
  const now = new Date().toISOString();
  const docData = {
    ...data,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  let docRef: FirebaseFirestore.DocumentReference;
  if (id) {
    docRef = db.collection(collection).doc(id);
    await docRef.set(docData);
  } else {
    docRef = db.collection(collection).doc();
    await docRef.set(docData);
  }

  // Re-fetch to get server timestamps
  const snap = await docRef.get();
  const result = docToObj<T>(snap as FirebaseFirestore.QueryDocumentSnapshot);

  // Ensure createdAt/updatedAt are populated (for immediate response)
  const finalResult = {
    ...result,
    createdAt: (result as Record<string, unknown>).createdAt || now,
    updatedAt: (result as Record<string, unknown>).updatedAt || now,
  };

  return finalResult as T & { id: string };
}

/**
 * Update a document by ID.
 */
export async function updateDoc(
  collection: string,
  id: string,
  data: Record<string, unknown>
): Promise<void> {
  const updateData = {
    ...data,
    updatedAt: FieldValue.serverTimestamp(),
  };
  await db.collection(collection).doc(id).update(updateData);
}

/**
 * Update a document and return the updated document.
 */
export async function updateDocAndGet<T = Record<string, unknown>>(
  collection: string,
  id: string,
  data: Record<string, unknown>
): Promise<(T & { id: string }) | null> {
  await updateDoc(collection, id, data);
  return getDoc<T>(collection, id);
}

/**
 * Delete a document by ID.
 */
export async function deleteDoc(
  collection: string,
  id: string
): Promise<void> {
  await db.collection(collection).doc(id).delete();
}

/**
 * Perform a batch write (atomic, max 500 operations).
 */
export async function batchWrite(
  operations: BatchOperation[]
): Promise<void> {
  const batch = db.batch();

  for (const op of operations) {
    const ref = db.collection(op.collection).doc(op.id);
    const data = op.data
      ? { ...op.data, updatedAt: FieldValue.serverTimestamp() }
      : undefined;

    switch (op.type) {
      case 'create':
      case 'set':
        batch.set(ref, {
          ...data,
          createdAt: FieldValue.serverTimestamp(),
        });
        break;
      case 'update':
        batch.update(ref, data!);
        break;
      case 'delete':
        batch.delete(ref);
        break;
    }
  }

  await batch.commit();
}

/**
 * Get a Firestore collection reference.
 */
export function getCollectionByName(name: string): FirebaseFirestore.CollectionReference {
  return db.collection(name);
}

// ─── Relation Resolvers ──────────────────────────────────────────────────────

export async function resolveStore(storeId: string) {
  return getDoc('stores', storeId);
}

export async function resolveEmployee(employeeId: string) {
  return getDoc('employees', employeeId);
}

export async function resolveService(serviceId: string) {
  return getDoc('services', serviceId);
}

export async function resolveProduct(productId: string) {
  return getDoc('products', productId);
}

export async function resolveCustomer(customerId: string) {
  return getDoc('customers', customerId);
}

export async function resolveAppointment(appointmentId: string) {
  return getDoc('appointments', appointmentId);
}

// ─── Utility: Include Relations ─────────────────────────────────────────────

/**
 * Enrich a list of documents with relation data.
 * `relations` is a map of { localField: { collection, name } }
 * where `name` is the key to set on each document.
 */
export async function includeRelations<T extends Record<string, unknown>>(
  documents: (T & { id: string })[],
  relations: Record<string, { collection: string; name: string }>
): Promise<Array<T & { id: string } & Record<string, unknown>>> {
  const results: Array<T & { id: string } & Record<string, unknown>> = [];

  for (const doc of documents) {
    const enriched: Record<string, unknown> = { ...doc };

    for (const [localField, config] of Object.entries(relations)) {
      const foreignId = doc[localField];
      if (foreignId) {
        enriched[config.name] = await getDoc(config.collection, foreignId as string);
      } else {
        enriched[config.name] = null;
      }
    }

    results.push(enriched as T & { id: string } & Record<string, unknown>);
  }

  return results;
}

/**
 * For transaction products — enrich with product data.
 */
export async function includeProductsOnTxProducts(
  txProducts: Array<Record<string, unknown>>
): Promise<Array<Record<string, unknown>>> {
  const results: Array<Record<string, unknown>> = [];

  for (const tp of txProducts) {
    const product = tp.productId
      ? await getDoc('products', tp.productId as string)
      : null;
    results.push({ ...tp, product });
  }

  return results;
}

// ─── Export FieldValue and Timestamp for direct use ─────────────────────────

export { FieldValue, Timestamp };
