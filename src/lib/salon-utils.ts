import { format } from 'date-fns';

export function calculateCommission(
  servicePrice: number,
  products: { cost: number; quantity: number }[]
) {
  const ownerShare = servicePrice * 0.5;
  const employeeGross = servicePrice * 0.5;
  const totalProductCost = products.reduce((sum, p) => sum + p.cost * p.quantity, 0);
  const employeeNet = employeeGross - totalProductCost;
  return { ownerShare, employeeGross, totalProductCost, employeeNet };
}

export function generateTimeSlots() {
  const slots: string[] = [];
  for (let h = 9; h <= 19; h++) {
    slots.push(`${h.toString().padStart(2, '0')}:00`);
    if (h < 19) slots.push(`${h.toString().padStart(2, '0')}:30`);
  }
  return slots;
}

export function formatTime(time24: string) {
  const [h, m] = time24.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCurrencyExact(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 2,
  }).format(amount);
}

export function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

export const TIME_SLOTS = generateTimeSlots();
export const SERVICE_CATEGORIES = ['ALL', 'HAIRCUT', 'COLOR', 'TREATMENT', 'SPA', 'BRIDAL'];
export const EXPENSE_CATEGORIES = ['RENT', 'UTILITIES', 'SALARY', 'SUPPLIES', 'MAINTENANCE', 'MARKETING', 'OTHER'];

export const EXPENSE_CATEGORY_CONFIG: Record<string, { color: string; bg: string; darkBg: string }> = {
  RENT: { color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-100 dark:bg-amber-900/40', darkBg: 'bg-amber-100 dark:bg-amber-900/40' },
  UTILITIES: { color: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-100 dark:bg-blue-900/40', darkBg: 'bg-blue-100 dark:bg-blue-900/40' },
  SALARY: { color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-100 dark:bg-emerald-900/40', darkBg: 'bg-emerald-100 dark:bg-emerald-900/40' },
  SUPPLIES: { color: 'text-violet-700 dark:text-violet-300', bg: 'bg-violet-100 dark:bg-violet-900/40', darkBg: 'bg-violet-100 dark:bg-violet-900/40' },
  MAINTENANCE: { color: 'text-orange-700 dark:text-orange-300', bg: 'bg-orange-100 dark:bg-orange-900/40', darkBg: 'bg-orange-100 dark:bg-orange-900/40' },
  MARKETING: { color: 'text-pink-700 dark:text-pink-300', bg: 'bg-pink-100 dark:bg-pink-900/40', darkBg: 'bg-pink-100 dark:bg-pink-900/40' },
  OTHER: { color: 'text-gray-700 dark:text-gray-300', bg: 'bg-gray-100 dark:bg-gray-900/40', darkBg: 'bg-gray-100 dark:bg-gray-900/40' },
};

export const STORE_GRADIENTS = [
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-emerald-500 to-teal-600',
];
export const STORE_GRADIENT_LIGHT = [
  'from-rose-100 to-pink-100 dark:from-rose-950/30 dark:to-pink-950/30',
  'from-amber-100 to-orange-100 dark:from-amber-950/30 dark:to-orange-950/30',
  'from-emerald-100 to-teal-100 dark:from-emerald-950/30 dark:to-teal-950/30',
];

export const ROLE_ACCENT: Record<string, { gradient: string; solid: string; light: string; ring: string; text: string; bg: string }> = {
  owner: {
    gradient: 'bg-gradient-to-r from-amber-500 to-yellow-500',
    solid: 'bg-amber-500 hover:bg-amber-600',
    light: 'bg-amber-100 dark:bg-amber-900/30',
    ring: 'ring-amber-200 dark:ring-amber-800',
    text: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/20',
  },
  manager: {
    gradient: 'bg-gradient-to-r from-blue-500 to-indigo-500',
    solid: 'bg-blue-500 hover:bg-blue-600',
    light: 'bg-blue-100 dark:bg-blue-900/30',
    ring: 'ring-blue-200 dark:ring-blue-800',
    text: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/20',
  },
  employee: {
    gradient: 'bg-gradient-to-r from-emerald-500 to-green-500',
    solid: 'bg-emerald-500 hover:bg-emerald-600',
    light: 'bg-emerald-100 dark:bg-emerald-900/30',
    ring: 'ring-emerald-200 dark:ring-emerald-800',
    text: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/20',
  },
};

export function getRoleAccent(role?: string | null) {
  if (!role) return ROLE_ACCENT.employee;
  if (role === 'OWNER') return ROLE_ACCENT.owner;
  if (role === 'MANAGER') return ROLE_ACCENT.manager;
  return ROLE_ACCENT.employee;
}

export function getAccentForRole(role: string) {
  return ROLE_ACCENT[role] || ROLE_ACCENT.employee;
}

export async function apiPost(url: string, body: unknown) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function apiPatch(url: string, body: unknown) {
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function apiDelete(url: string) {
  const res = await fetch(url, { method: 'DELETE' });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return res.json();
}
