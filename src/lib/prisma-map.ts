/**
 * Helper functions to map Prisma PascalCase relation fields to camelCase
 * for API responses. This keeps the frontend API contract stable while
 * using the correct PascalCase relation names in Prisma queries.
 */

// Map TransactionProduct relation fields
function mapTransactionProduct(tp: any) {
  const { Product, Transaction, ...rest } = tp
  return { ...rest, product: Product }
}

// Map Appointment relation fields from PascalCase to camelCase
export function mapAppointment(a: any) {
  const { Customer, Employee, Service, Store, Transaction, ...rest } = a
  return {
    ...rest,
    customer: Customer,
    employee: Employee,
    service: Service,
    store: Store,
    transaction: Transaction ? mapTransaction(Transaction) : Transaction,
  }
}

// Map Transaction relation fields
export function mapTransaction(t: any) {
  const { Employee, Service, Store, Appointment, TransactionProduct, ...rest } = t
  return {
    ...rest,
    employee: Employee,
    service: Service,
    store: Store,
    appointment: Appointment ? mapAppointment(Appointment) : Appointment,
    productsUsed: TransactionProduct?.map(mapTransactionProduct) ?? [],
  }
}

// Map Attendance relation fields
export function mapAttendance(a: any) {
  const { Employee, Store, ...rest } = a
  return { ...rest, employee: Employee, store: Store }
}

// Map AuditLog relation fields
export function mapAuditLog(l: any) {
  const { Employee, ...rest } = l
  return { ...rest, employee: Employee }
}

// Map Advance relation fields
export function mapAdvance(a: any) {
  const { Employee, Store, ...rest } = a
  return { ...rest, employee: Employee, store: Store }
}

// Map Leave relation fields
export function mapLeave(l: any) {
  const { Employee, Store, ...rest } = l
  return { ...rest, employee: Employee, store: Store }
}

// Map Payment relation fields
export function mapPayment(p: any) {
  const { Employee, Store, ...rest } = p
  return { ...rest, employee: Employee, store: Store }
}

// Map Inventory relation fields
export function mapInventory(i: any) {
  const { Product, Store, ...rest } = i
  return { ...rest, product: Product, store: Store }
}
