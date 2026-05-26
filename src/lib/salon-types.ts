export type Role = 'customer' | 'employee' | 'manager' | 'owner';

export interface Store {
  id: string; name: string; address: string; phone: string;
  city: string; isActive: boolean;
}
export interface Service {
  id: string; name: string; price: number; duration: number;
  category: string; description: string | null; isActive: boolean;
  ownerPercent: number; employeePercent: number;
}
export interface Product {
  id: string; name: string; cost: number; unit: string;
  category: string; isActive: boolean;
}
export interface Employee {
  id: string; name: string; phone: string; role: string;
  storeId: string; isActive: boolean;
  store: { id: string; name: string; address: string; phone: string; city: string; isActive: boolean };
}
export interface Customer {
  id: string; name: string; phone: string; email: string | null;
}
export interface Appointment {
  id: string; customerId: string; storeId: string; employeeId: string;
  serviceId: string; date: string; time: string; status: string;
  notes: string | null;
  customer: { id: string; name: string; phone: string; email: string | null };
  employee: { id: string; name: string; phone: string; role: string; storeId: string };
  service: { id: string; name: string; price: number; duration: number; category: string };
  store: { id: string; name: string; address: string; phone: string; city: string };
  transaction: unknown | null;
}
export interface Transaction {
  id: string; appointmentId: string; employeeId: string; storeId: string;
  serviceId: string; servicePrice: number; ownerShare: number;
  employeeGrossShare: number; totalProductCost: number; employeeNetShare: number;
  completedAt: string;
  employee: { id: string; name: string; role: string };
  service: { id: string; name: string; price?: number; ownerPercent?: number; employeePercent?: number };
  store: { id: string; name: string };
  paymentMethod: string;
  cashAmount: number;
  onlineAmount: number;
  isClosed: boolean;
  productsUsed: Array<{
    id: string; productId: string; quantityUsed: number;
    unitCost: number; totalCost: number;
    product: { id: string; name: string; cost: number; unit: string };
  }>;
}
export interface InventoryItem {
  id: string; storeId: string; productId: string; quantity: number;
  reorderLevel: number; isLow: boolean;
  product: { id: string; name: string; cost: number; unit: string; category: string };
  store: { id: string; name: string };
}
export interface AttendanceRecord {
  id: string; employeeId: string; storeId: string; date: string;
  checkIn: string | null; checkOut: string | null; status: string;
  employee: { id: string; name: string; phone: string; role: string; storeId: string };
  store: { id: string; name: string };
}
export interface AnalyticsData {
  totalRevenue: number; totalTransactions: number; totalProductCost: number;
  totalOwnerShare: number; totalEmployeePayout: number;
  totalCash: number; totalOnline: number; totalSplitCount: number;
  paymentMethodBreakdown: Array<{ method: string; count: number; amount: number }>;
  dailyRevenue: Array<{ date: string; revenue: number; transactions: number }>;
  servicePopularity: Array<{ serviceName: string; count: number; revenue: number }>;
  employeePerformance: Array<{
    employeeId: string; employeeName: string; transactions: number;
    totalRevenue: number; totalEarnings: number; avgPerTransaction: number;
  }>;
}
export interface Expense {
  id: string; storeId: string; category: string; description: string;
  amount: number; expenseDate: string;
  store: { id: string; name: string; address: string; phone: string; city: string; isActive: boolean };
}
export interface Leave {
  id: string; employeeId: string; branchId: string; date: string; reason: string;
  status: string; reviewedBy: string | null; reviewedAt: string | null;
  employee: { id: string; name: string; role: string; avatar: string | null };
  store: { id: string; name: string };
  reviewer?: { id: string; name: string } | null;
}
export interface Advance {
  id: string; employeeId: string; branchId: string; amount: number; reason: string;
  date: string; recoveredAmount: number; remainingAmount: number; givenBy: string | null;
  status: string;
  employee: { id: string; name: string; role: string; avatar: string | null };
  store: { id: string; name: string };
  giver?: { id: string; name: string } | null;
}
export interface Payment {
  id: string; employeeId: string; branchId: string; date: string;
  earnedAmount: number; advanceDeducted: number; netPaid: number;
  paymentMethod: string; paidBy: string | null; paidAt: string;
  employee: { id: string; name: string; role: string; avatar: string | null };
  store: { id: string; name: string };
}
export interface DayClose {
  id: string; branchId: string; date: string; totalRevenue: number;
  totalCash: number; totalOnline: number; totalServices: number;
  closedBy: string | null; closedAt: string; isLocked: boolean;
  store: { id: string; name: string };
}
export interface AuditLog {
  id: string; action: string; performedBy: string; targetData: string | null;
  oldValue: string | null; newValue: string | null; branchId: string | null;
  timestamp: string;
  employee: { id: string; name: string; role: string; avatar: string | null };
}
export interface SettlementData {
  employee: { id: string; name: string; role: string; store: { id: string; name: string } | null };
  period: { from: string; to: string };
  summary: {
    totalServices: number; totalRevenue: number; totalOwnerShare: number;
    totalGrossCommission: number; totalProductDeductions: number; totalNetPayout: number;
  };
  breakdown: Array<{
    date: string; appointmentId: string; customerName: string; serviceName: string;
    servicePrice: number; ownerShare: number; employeeGross: number;
    productsUsed: Array<{ name: string; qty: number; cost: number }>;
    productDeduction: number; employeeNet: number;
  }>;
}

export type AuthScreen = 'landing' | 'employee-login' | 'manager-login' | 'owner-login' | 'authenticated';
export interface AuthUser {
  id: string; name: string; phone: string; role: string;
  storeId: string; storeName: string; storeCity: string;
}
