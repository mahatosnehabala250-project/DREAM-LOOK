'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import {
  Scissors, MapPin, Phone, Clock, ChevronRight, ChevronLeft, User,
  Calendar, Check, Crown, Download, Package, AlertTriangle, TrendingUp,
  Users, Building2, IndianRupee, Play, CheckCircle2, LogIn, LogOut,
  BarChart3, Search, Moon, Sun, Timer, RefreshCw, X,
  Sparkles, Heart, ArrowUpDown, FileText,
  Zap, Target, DollarSign, Layers, Shield,
  Plus, ArrowUp, ArrowDown, Calculator, Star,
  Bell, Trophy, Activity, History, ChevronDown, Eye, EyeOff,
  Receipt, Percent, Wallet, CircleDot, Flame, Store, XCircle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, ResponsiveContainer,
} from 'recharts';
import {
  format, isBefore, isToday, startOfDay, startOfMonth, endOfMonth, startOfWeek, endOfWeek, subDays, addMonths,
} from 'date-fns';

// ─── TYPES ───────────────────────────────────────────────────────
type Role = 'customer' | 'employee' | 'manager' | 'owner';

interface Store {
  id: string; name: string; address: string; phone: string;
  city: string; isActive: boolean;
}
interface Service {
  id: string; name: string; price: number; duration: number;
  category: string; description: string | null; isActive: boolean;
}
interface Product {
  id: string; name: string; cost: number; unit: string;
  category: string; isActive: boolean;
}
interface Employee {
  id: string; name: string; phone: string; role: string;
  storeId: string; isActive: boolean;
  store: { id: string; name: string; address: string; phone: string; city: string; isActive: boolean };
}
interface Customer {
  id: string; name: string; phone: string; email: string | null;
}
interface Appointment {
  id: string; customerId: string; storeId: string; employeeId: string;
  serviceId: string; date: string; time: string; status: string;
  notes: string | null;
  customer: { id: string; name: string; phone: string; email: string | null };
  employee: { id: string; name: string; phone: string; role: string; storeId: string };
  service: { id: string; name: string; price: number; duration: number; category: string };
  store: { id: string; name: string; address: string; phone: string; city: string };
  transaction: unknown | null;
}
interface Transaction {
  id: string; appointmentId: string; employeeId: string; storeId: string;
  serviceId: string; servicePrice: number; ownerShare: number;
  employeeGrossShare: number; totalProductCost: number; employeeNetShare: number;
  completedAt: string;
  employee: { id: string; name: string; role: string };
  service: { id: string; name: string };
  store: { id: string; name: string };
  productsUsed: Array<{
    id: string; productId: string; quantityUsed: number;
    unitCost: number; totalCost: number;
    product: { id: string; name: string; cost: number; unit: string };
  }>;
}
interface InventoryItem {
  id: string; storeId: string; productId: string; quantity: number;
  reorderLevel: number; isLow: boolean;
  product: { id: string; name: string; cost: number; unit: string; category: string };
  store: { id: string; name: string };
}
interface AttendanceRecord {
  id: string; employeeId: string; storeId: string; date: string;
  checkIn: string | null; checkOut: string | null; status: string;
  employee: { id: string; name: string; phone: string; role: string; storeId: string };
  store: { id: string; name: string };
}
interface AnalyticsData {
  totalRevenue: number; totalTransactions: number; totalProductCost: number;
  totalOwnerShare: number; totalEmployeePayout: number;
  dailyRevenue: Array<{ date: string; revenue: number; transactions: number }>;
  servicePopularity: Array<{ serviceName: string; count: number; revenue: number }>;
  employeePerformance: Array<{
    employeeId: string; employeeName: string; transactions: number;
    totalRevenue: number; totalEarnings: number; avgPerTransaction: number;
  }>;
}
interface Expense {
  id: string; storeId: string; category: string; description: string;
  amount: number; expenseDate: string;
  store: { id: string; name: string; address: string; phone: string; city: string; isActive: boolean };
}
interface SettlementData {
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

type AuthScreen = 'landing' | 'employee-login' | 'manager-login' | 'owner-login' | 'authenticated';
interface AuthUser {
  id: string; name: string; phone: string; role: string;
  storeId: string; storeName: string; storeCity: string;
}

// ─── UTILITY FUNCTIONS ──────────────────────────────────────────
function calculateCommission(
  servicePrice: number,
  products: { cost: number; quantity: number }[]
) {
  const ownerShare = servicePrice * 0.5;
  const employeeGross = servicePrice * 0.5;
  const totalProductCost = products.reduce((sum, p) => sum + p.cost * p.quantity, 0);
  const employeeNet = employeeGross - totalProductCost;
  return { ownerShare, employeeGross, totalProductCost, employeeNet };
}

function generateTimeSlots() {
  const slots: string[] = [];
  for (let h = 9; h <= 19; h++) {
    slots.push(`${h.toString().padStart(2, '0')}:00`);
    if (h < 19) slots.push(`${h.toString().padStart(2, '0')}:30`);
  }
  return slots;
}

function formatTime(time24: string) {
  const [h, m] = time24.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(amount);
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

const TIME_SLOTS = generateTimeSlots();
const SERVICE_CATEGORIES = ['ALL', 'HAIRCUT', 'COLOR', 'TREATMENT', 'SPA', 'BRIDAL'];
const EXPENSE_CATEGORIES = ['RENT', 'UTILITIES', 'SALARY', 'SUPPLIES', 'MAINTENANCE', 'MARKETING', 'OTHER'];

const EXPENSE_CATEGORY_CONFIG: Record<string, { color: string; bg: string; darkBg: string }> = {
  RENT: { color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-100 dark:bg-amber-900/40', darkBg: 'bg-amber-100 dark:bg-amber-900/40' },
  UTILITIES: { color: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-100 dark:bg-blue-900/40', darkBg: 'bg-blue-100 dark:bg-blue-900/40' },
  SALARY: { color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-100 dark:bg-emerald-900/40', darkBg: 'bg-emerald-100 dark:bg-emerald-900/40' },
  SUPPLIES: { color: 'text-violet-700 dark:text-violet-300', bg: 'bg-violet-100 dark:bg-violet-900/40', darkBg: 'bg-violet-100 dark:bg-violet-900/40' },
  MAINTENANCE: { color: 'text-orange-700 dark:text-orange-300', bg: 'bg-orange-100 dark:bg-orange-900/40', darkBg: 'bg-orange-100 dark:bg-orange-900/40' },
  MARKETING: { color: 'text-pink-700 dark:text-pink-300', bg: 'bg-pink-100 dark:bg-pink-900/40', darkBg: 'bg-pink-100 dark:bg-pink-900/40' },
  OTHER: { color: 'text-gray-700 dark:text-gray-300', bg: 'bg-gray-100 dark:bg-gray-900/40', darkBg: 'bg-gray-100 dark:bg-gray-900/40' },
};

const STORE_GRADIENTS = [
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-emerald-500 to-teal-600',
];
const STORE_GRADIENT_LIGHT = [
  'from-rose-100 to-pink-100 dark:from-rose-950/30 dark:to-pink-950/30',
  'from-amber-100 to-orange-100 dark:from-amber-950/30 dark:to-orange-950/30',
  'from-emerald-100 to-teal-100 dark:from-emerald-950/30 dark:to-teal-950/30',
];

function MobileBottomNav({ activeRole, setActiveRole }: { activeRole: Role; setActiveRole: (r: Role) => void }) {
  const tabs = [
    { id: 'customer' as Role, label: 'Book', icon: Calendar },
    { id: 'employee' as Role, label: 'Dashboard', icon: BarChart3 },
    { id: 'manager' as Role, label: 'Manage', icon: Building2 },
    { id: 'owner' as Role, label: 'Owner', icon: Crown },
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-700/50">
      <div className="flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const isActive = activeRole === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveRole(tab.id)}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-all duration-200 ${
                isActive ? 'text-rose-600 dark:text-rose-400' : 'text-gray-400 dark:text-gray-500'
              }`}>
              <div className={`relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 ${
                isActive ? 'bg-rose-100 dark:bg-rose-950/40 shadow-sm' : ''
              }`}>
                <tab.icon className={`w-5 h-5 transition-all ${isActive ? 'scale-110' : ''}`} />
                {isActive && <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-rose-500" />}
              </div>
              <span className={`text-[10px] font-medium transition-all ${isActive ? 'text-rose-600 dark:text-rose-400' : ''}`}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data: pendingAppts } = useFetch<Appointment[]>('/api/salon/appointments?status=PENDING');
  const count = (pendingAppts || []).length;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 relative" aria-label="Notifications">
          <Bell className="w-4 h-4" />
          {count > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4 h-4 rounded-full bg-rose-500 text-[9px] font-bold text-white shadow-sm">
              {count > 9 ? '9+' : count}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="p-3 border-b">
          <h4 className="text-sm font-semibold">Pending Appointments</h4>
          <p className="text-xs text-muted-foreground">{count} awaiting confirmation</p>
        </div>
        <div className="max-h-64 overflow-y-auto custom-scrollbar">
          {count === 0 ? (
            <div className="flex flex-col items-center py-6 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
              <p className="text-sm text-muted-foreground">All caught up!</p>
            </div>
          ) : (
            <div className="divide-y">
              {(pendingAppts || []).map((apt) => (
                <div key={apt.id} className="px-3 py-2.5 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium truncate">{apt.customer?.name}</p>
                    <StatusBadge status={apt.status} />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <span>{apt.service?.name}</span>
                    <span>•</span>
                    <span>{formatTime(apt.time)}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{apt.store?.name}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ─── CUSTOM HOOKS ────────────────────────────────────────────────
function useFetch<T>(url: string | null, options?: RequestInit) {
  type FetchState = { data: T | null; loading: boolean; error: string | null };
  type FetchAction =
    | { type: 'FETCH_START' }
    | { type: 'FETCH_SUCCESS'; payload: T }
    | { type: 'FETCH_ERROR'; payload: string }
    | { type: 'SET_NO_URL' };

  const [state, dispatch] = React.useReducer(
    (prev: FetchState, action: FetchAction): FetchState => {
      switch (action.type) {
        case 'FETCH_START': return { ...prev, loading: true, error: null };
        case 'FETCH_SUCCESS': return { data: action.payload, loading: false, error: null };
        case 'FETCH_ERROR': return { data: null, loading: false, error: action.payload };
        case 'SET_NO_URL': return { data: null, loading: false, error: null };
      }
    },
    { data: null, loading: true, error: null }
  );

  useEffect(() => {
    if (!url) { dispatch({ type: 'SET_NO_URL' }); return; }
    let cancelled = false;
    dispatch({ type: 'FETCH_START' });
    fetch(url, options)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(d => { if (!cancelled) dispatch({ type: 'FETCH_SUCCESS', payload: d }); })
      .catch(e => { if (!cancelled) dispatch({ type: 'FETCH_ERROR', payload: e.message }); });
    return () => { cancelled = true; };
  }, [url]);

  const refetch = useCallback(() => {
    if (!url) return;
    dispatch({ type: 'FETCH_START' });
    fetch(url, options)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(d => { dispatch({ type: 'FETCH_SUCCESS', payload: d }); })
      .catch(e => { dispatch({ type: 'FETCH_ERROR', payload: e.message }); });
  }, [url, options]);

  return { ...state, refetch };
}

function useAnimatedNumber(target: number, duration = 1000) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let startTime: number;
    let animationFrame: number;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setValue(Math.floor(progress * target));
      if (progress < 1) animationFrame = requestAnimationFrame(animate);
    };
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [target, duration]);
  return value;
}

function useClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);
  return time;
}

// ─── SMALL COMPONENTS ────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    PENDING: { label: 'Pending', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' },
    CONFIRMED: { label: 'Confirmed', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' },
    IN_PROGRESS: { label: 'In Progress', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300' },
    COMPLETED: { label: 'Completed', className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' },
    CANCELLED: { label: 'Cancelled', className: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' },
    NO_SHOW: { label: 'No Show', className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-300' },
    PRESENT: { label: 'Present', className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' },
    ABSENT: { label: 'Absent', className: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' },
    HALF_DAY: { label: 'Half Day', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' },
    LEAVE: { label: 'On Leave', className: 'bg-gray-100 text-gray-600 dark:bg-gray-900/40 dark:text-gray-400' },
  };
  const c = config[status] || { label: status, className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-300' };
  return <span className={`inline-flex items-center rounded-full border border-l-2 border-l-current px-2.5 py-0.5 text-xs font-medium ${c.className}`}>{c.label}</span>;
}

function StockIndicator({ quantity, reorderLevel }: { quantity: number; reorderLevel: number }) {
  if (quantity === 0) return <Badge variant="destructive">Out of Stock</Badge>;
  if (quantity <= reorderLevel) return <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800">Low Stock</Badge>;
  return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800">In Stock</Badge>;
}

function ErrorCard({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Card className="border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20">
      <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
        <AlertTriangle className="w-10 h-10 text-red-500" />
        <p className="text-sm text-red-700 dark:text-red-300 text-center max-w-sm">{message}</p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} className="mt-2">
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Retry
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function ViewSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
      </div>
      <Skeleton className="h-80 rounded-xl" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

function GlassCard({ children, className = '', ...props }: { children: React.ReactNode; className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <Card className={`backdrop-blur-md bg-white/70 dark:bg-gray-900/70 border-white/20 dark:border-gray-700/30 shadow-lg hover:shadow-lg hover:shadow-rose-500/5 transition-shadow duration-300 ${className}`} {...props}>
      {children}
    </Card>
  );
}

function StatCard({ icon: Icon, label, value, sub, gradient, trend, index = 0 }: {
  icon: React.ElementType; label: string; value: string; sub?: string;
  gradient: string; trend?: 'up' | 'down' | 'neutral'; index?: number;
}) {
  return (
    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: index * 0.1, type: 'spring', stiffness: 300 }}>
      <Card className="overflow-hidden shadow-md hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.99] transition-all duration-200 cursor-pointer">
        <div className={`h-1.5 ${gradient}`} />
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
              <div className="flex items-center gap-1.5">
                <p className="text-2xl font-bold tracking-tight">{value}</p>
                {trend && trend !== 'neutral' && (
                  <span className={`inline-flex items-center text-xs font-semibold ${trend === 'up' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                    {trend === 'up' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                  </span>
                )}
              </div>
              {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Icon className="w-5 h-5 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function EmptyState({ icon: Icon, title, description }: {
  icon: React.ElementType; title: string; description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-muted/80 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="font-semibold text-lg mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-xs">{description}</p>
    </div>
  );
}

function LiveClock() {
  const now = useClock();
  return (
    <div className="hidden sm:flex items-center gap-2.5 text-sm">
      <Clock className="w-3.5 h-3.5 text-muted-foreground" />
      <span className="font-medium text-muted-foreground">{format(now, 'EEE, MMM d, yyyy')}</span>
      <span className="font-mono text-xs bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950/40 dark:to-pink-950/40 text-rose-700 dark:text-rose-300 px-2 py-0.5 rounded-md border border-rose-200/50 dark:border-rose-800/50">
        {format(now, 'hh:mm:ss a')}
      </span>
    </div>
  );
}

// ─── POST HELPER ────────────────────────────────────────────────
async function apiPost(url: string, body: unknown) {
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

async function apiPatch(url: string, body: unknown) {
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

// ═══════════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════════
export default function Home() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [activeRole, setActiveRole] = useState<Role>('customer');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  const [recordDialogOpen, setRecordDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [recordCallback, setRecordCallback] = useState<(() => void) | null>(null);

  // ─── Auth State ──────────────────────────────────────────────
  const [authScreen, setAuthScreen] = useState<AuthScreen>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dreamlook_auth');
      if (saved) {
        try { return JSON.parse(saved) as { screen: AuthScreen; user: AuthUser }; } catch { /* ignore */ }
      }
    }
    return 'landing';
  });
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dreamlook_auth');
      if (saved) {
        try { return JSON.parse(saved).user as AuthUser; } catch { /* ignore */ }
      }
    }
    return null;
  });

  const handleLogin = useCallback(async (phone: string, role: string) => {
    try {
      // Request FCM notification permission & token
      let fcmToken: string | null = null;
      try {
        if ('Notification' in window && Notification.permission === 'default') {
          await Notification.requestPermission();
        }
        if ('Notification' in window && Notification.permission === 'granted') {
          const { getMessaging, getToken } = await import('firebase/messaging');
          const { app } = await import('@/lib/firebase-client');
          fcmToken = await getToken(getMessaging(app));
        }
      } catch (fcmErr) {
        console.warn('FCM token not available:', fcmErr);
      }

      const res = await fetch('/api/salon/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, role, fcmToken: fcmToken || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      const user: AuthUser = {
        id: data.employee.id, name: data.employee.name, phone: data.employee.phone,
        role: data.employee.role, storeId: data.employee.storeId,
        storeName: data.employee.storeName, storeCity: data.employee.storeCity,
      };
      setAuthUser(user);
      setAuthScreen('authenticated');
      localStorage.setItem('dreamlook_auth', JSON.stringify({ screen: 'authenticated', user }));
      toast.success(`Welcome back, ${user.name}!`);
    } catch (e) {
      toast.error('Login failed', { description: (e as Error).message });
      throw e;
    }
  }, []);

  const handleLogout = useCallback(() => {
    setAuthUser(null);
    setAuthScreen('landing');
    localStorage.removeItem('dreamlook_auth');
    setActiveRole('customer');
    toast.info('Logged out successfully');
  }, []);

  // Search data
  const { data: searchCustomers } = useFetch<Customer[]>('/api/salon/customers');
  const { data: searchServices } = useFetch<Service[]>('/api/salon/services');

  // Avoid hydration mismatch for theme-dependent rendering
  const mounted = resolvedTheme !== undefined;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSearchOpen(false);
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => searchRef.current?.focus(), 100);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Close search on click outside
  useEffect(() => {
    if (!searchOpen) return;
    const handler = () => setSearchOpen(false);
    setTimeout(() => document.addEventListener('click', handler), 0);
    return () => document.removeEventListener('click', handler);
  }, [searchOpen]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return { customers: [], services: [] };
    const q = searchQuery.toLowerCase();
    return {
      customers: (searchCustomers || []).filter(c => c.name.toLowerCase().includes(q) || c.phone.includes(q)).slice(0, 5),
      services: (searchServices || []).filter(s => s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q)).slice(0, 5),
    };
  }, [searchQuery, searchCustomers, searchServices]);

  const handleCompleteService = useCallback((appointment: Appointment, callback?: () => void) => {
    setSelectedAppointment(appointment);
    setRecordCallback(() => callback || null);
    setRecordDialogOpen(true);
  }, []);

  // Light loading shell while theme resolves
  if (!mounted) {
    return null;
  }

  // ─── Determine effective role from auth ───────────────────────
  const effectiveRole = authUser
    ? (authUser.role === 'STYLIST' ? 'employee' as Role : authUser.role === 'MANAGER' ? 'manager' as Role : authUser.role === 'OWNER' ? 'owner' as Role : activeRole)
    : activeRole;

  // ─── Unauthenticated: Login Flow ──────────────────────────────
  if (authScreen !== 'authenticated') {
    if (authScreen === 'landing') {
      return (
        <LandingPage
          onSelectRole={setAuthScreen}
          onBookAsCustomer={() => {
            setAuthUser(null);
            setAuthScreen('authenticated');
            setActiveRole('customer');
            localStorage.setItem('dreamlook_auth', JSON.stringify({ screen: 'authenticated', user: null }));
          }}
        />
      );
    }
    // Login pages
    return (
      <LoginPage
        role={authScreen === 'employee-login' ? 'employee' : authScreen === 'manager-login' ? 'manager' : 'owner'}
        onLogin={handleLogin}
        onBack={() => setAuthScreen('landing')}
      />
    );
  }

  // ─── Authenticated: Dashboard ─────────────────────────────────
  const roleBadgeConfig: Record<string, { label: string; className: string }> = {
    STYLIST: { label: 'Stylist', className: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300' },
    MANAGER: { label: 'Manager', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' },
    OWNER: { label: 'Owner', className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' },
  };
  const userBadge = authUser ? roleBadgeConfig[authUser.role] : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50/50 via-white to-pink-50/50 dark:from-gray-950 dark:via-gray-900 dark:to-rose-950/10 flex flex-col [background-image:radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.03)_1px,transparent_0)] [background-size:24px_24px] dark:[background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.03)_1px,transparent_0)]">
      {/* ─── HEADER ──────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16 gap-3">
            {/* Brand */}
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-md shadow-rose-500/20">
                <Scissors className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent hidden sm:block">
                Dream Look
              </h1>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-md mx-4 hidden md:block">
              <div className="relative" onClick={e => e.stopPropagation()}>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  ref={searchRef}
                  placeholder="Search customers, services... (⌘K)"
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setSearchOpen(true); }}
                  onFocus={() => setSearchOpen(true)}
                  className="pl-9 h-9 bg-muted/50 dark:bg-muted/20"
                />
                {searchOpen && searchQuery.trim() && (
                  <div className="absolute top-full mt-1 w-full bg-white dark:bg-gray-900 rounded-lg shadow-xl border z-50 overflow-hidden">
                    {searchResults.customers.length === 0 && searchResults.services.length === 0 && (
                      <div className="p-4 text-sm text-muted-foreground text-center">No results found</div>
                    )}
                    {searchResults.customers.length > 0 && (
                      <>
                        <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase">Customers</div>
                        {searchResults.customers.map(c => (
                          <div key={c.id} className="px-3 py-2 hover:bg-muted/50 flex items-center gap-2 text-sm cursor-pointer">
                            <User className="w-3.5 h-3.5 text-muted-foreground" />
                            <span>{c.name}</span>
                            <span className="text-muted-foreground text-xs ml-auto">{c.phone}</span>
                          </div>
                        ))}
                      </>
                    )}
                    {searchResults.services.length > 0 && (
                      <>
                        <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase border-t">Services</div>
                        {searchResults.services.map(s => (
                          <div key={s.id} className="px-3 py-2 hover:bg-muted/50 flex items-center gap-2 text-sm cursor-pointer">
                            <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                            <span>{s.name}</span>
                            <Badge variant="secondary" className="text-[10px] ml-2">{s.category}</Badge>
                            <span className="text-rose-600 font-medium ml-auto text-xs">{formatCurrency(s.price)}</span>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right side: clock, dark mode, user info, actions */}
            <div className="flex items-center gap-2">
              <LiveClock />
              <Button
                variant="ghost" size="icon" className="h-9 w-9"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                aria-label="Toggle dark mode"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
              <NotificationBell />

              {/* Authenticated User Info (Desktop) */}
              {authUser && (
                <div className="hidden sm:flex items-center gap-2.5 ml-1">
                  <Separator orientation="vertical" className="h-8" />
                  <div className="flex items-center gap-2.5">
                    <Avatar className="h-8 w-8 ring-2 ring-rose-200 dark:ring-rose-800">
                      <AvatarFallback className="bg-gradient-to-br from-rose-500 to-pink-600 text-white font-bold text-xs">
                        {getInitials(authUser.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden lg:block">
                      <p className="text-sm font-semibold leading-tight">{authUser.name}</p>
                      <div className="flex items-center gap-1.5">
                        {userBadge && (
                          <span className={`inline-flex items-center rounded-full px-1.5 py-0 text-[10px] font-medium ${userBadge.className}`}>
                            {userBadge.label}
                          </span>
                        )}
                        <span className="text-[10px] text-muted-foreground">{authUser.storeName}</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-red-500 h-8 px-2">
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {/* No auth: show role navigation tabs */}
              {!authUser && (
                <nav className="hidden lg:flex items-center gap-1 bg-rose-50 dark:bg-rose-950/30 rounded-xl p-1">
                  {([
                    { id: 'customer' as Role, label: 'Book', icon: Calendar },
                    { id: 'employee' as Role, label: 'Dashboard', icon: BarChart3 },
                    { id: 'manager' as Role, label: 'Manage', icon: Building2 },
                    { id: 'owner' as Role, label: 'Owner', icon: Crown },
                  ]).map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveRole(tab.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        activeRole === tab.id
                          ? 'bg-white dark:bg-gray-800 text-rose-600 dark:text-rose-400 shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:text-rose-600 dark:hover:text-rose-400'
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  ))}
                </nav>
              )}

              {/* Authenticated user actions (mobile) + Book Appointment link */}
              {authUser && (
                <div className="flex lg:hidden items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleLogout} aria-label="Logout">
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile: Authenticated user bar */}
          {authUser && (
            <div className="sm:hidden flex items-center gap-3 pb-3 -mt-1">
              <Avatar className="h-8 w-8 ring-2 ring-rose-200 dark:ring-rose-800">
                <AvatarFallback className="bg-gradient-to-br from-rose-500 to-pink-600 text-white font-bold text-xs">
                  {getInitials(authUser.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{authUser.name}</p>
                <div className="flex items-center gap-1.5">
                  {userBadge && (
                    <span className={`inline-flex items-center rounded-full px-1.5 py-0 text-[10px] font-medium ${userBadge.className}`}>
                      {userBadge.label}
                    </span>
                  )}
                  <span className="text-[10px] text-muted-foreground truncate">{authUser.storeName}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ─── MAIN CONTENT ───────────────────────────────────── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 rounded-2xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={effectiveRole}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {effectiveRole === 'customer' && <CustomerView />}
            {effectiveRole === 'employee' && (
              <EmployeeView onCompleteService={handleCompleteService} authUser={authUser} />
            )}
            {effectiveRole === 'manager' && <ManagerView authUser={authUser} />}
            {effectiveRole === 'owner' && <OwnerView />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Navigation (only for non-authenticated users) */}
      {!authUser && <MobileBottomNav activeRole={activeRole} setActiveRole={setActiveRole} />}

      {/* ─── FOOTER (with bottom nav padding) ──────────── */}
      <footer className={`border-t bg-gradient-to-r from-white/80 via-rose-50/50 to-pink-50/50 dark:from-gray-950/80 dark:via-rose-950/10 dark:to-pink-950/10 backdrop-blur-sm mt-auto ${!authUser ? 'pb-bottom-nav' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center">
              <Scissors className="w-3 h-3 text-white" />
            </div>
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Dream Look Salon. All rights reserved.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <a href="#" className="text-xs text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400 transition-colors">Privacy Policy</a>
            <span className="text-xs text-muted-foreground">·</span>
            <a href="#" className="text-xs text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400 transition-colors">Terms of Service</a>
            <span className="text-xs text-muted-foreground">·</span>
            <a href="#" className="text-xs text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400 transition-colors">Contact Us</a>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-xs text-muted-foreground">3 Locations Across Bangalore</p>
            <p className="text-xs text-muted-foreground">
              Built with <Heart className="w-3 h-3 inline text-rose-500 fill-rose-500" /> for beautiful salons
            </p>
          </div>
        </div>
      </footer>
      <RecordServiceDialog
        open={recordDialogOpen}
        onClose={() => { setRecordDialogOpen(false); setSelectedAppointment(null); }}
        appointment={selectedAppointment}
        onSuccess={recordCallback}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// LOGIN PAGE COMPONENT (reusable for Employee, Manager, Owner)
// ═══════════════════════════════════════════════════════════════════
function LoginPage({ role, onLogin, onBack }: {
  role: 'employee' | 'manager' | 'owner';
  onLogin: (phone: string, role: string) => Promise<void>;
  onBack: () => void;
}) {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const config = {
    employee: {
      title: 'Employee Login',
      subtitle: 'Access your schedule, earnings & commission',
      icon: Scissors,
      gradient: 'from-rose-500 to-pink-600',
      lightBg: 'from-rose-50 to-pink-50 dark:from-rose-950/40 dark:to-pink-950/40',
      ring: 'ring-rose-300 dark:ring-rose-700',
      btnClass: 'bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white shadow-lg shadow-rose-500/25',
      accent: 'text-rose-600 dark:text-rose-400',
      demoPhone: '9900000003',
      demoName: 'Anitha Reddy, Stylist at MG Road',
    },
    manager: {
      title: 'Manager Login',
      subtitle: 'Manage appointments, staff & inventory',
      icon: Building2,
      gradient: 'from-amber-500 to-orange-600',
      lightBg: 'from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40',
      ring: 'ring-amber-300 dark:ring-amber-700',
      btnClass: 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg shadow-amber-500/25',
      accent: 'text-amber-600 dark:text-amber-400',
      demoPhone: '9900000002',
      demoName: 'Priya Sharma, Manager at MG Road',
    },
    owner: {
      title: 'Owner Login',
      subtitle: 'Full business analytics & settlement engine',
      icon: Crown,
      gradient: 'from-emerald-500 to-teal-600',
      lightBg: 'from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40',
      ring: 'ring-emerald-300 dark:ring-emerald-700',
      btnClass: 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25',
      accent: 'text-emerald-600 dark:text-emerald-400',
      demoPhone: '9900000001',
      demoName: 'Rajesh Kumar, Owner',
    },
  }[role];

  const RoleIcon = config.icon;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await onLogin(phone, role);
    } catch {
      setError('Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-rose-50/50 via-white to-pink-50/50 dark:from-gray-950 dark:via-gray-900 dark:to-rose-950/10">
      {/* Back Button */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        onClick={onBack}
        className="absolute top-6 left-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Back
      </motion.button>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        {/* Glassmorphism Card */}
        <Card className="backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border-white/30 dark:border-gray-700/30 shadow-2xl overflow-hidden">
          {/* Gradient Header */}
          <div className={`h-32 bg-gradient-to-br ${config.gradient} relative flex items-center justify-center`}>
            <div className="absolute inset-0 bg-black/5" />
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
              className="relative"
            >
              <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 shadow-xl">
                <RoleIcon className="w-10 h-10 text-white" />
              </div>
            </motion.div>
          </div>

          <CardContent className="p-6 space-y-6">
            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-center space-y-1.5"
            >
              <h2 className="text-2xl font-bold">{config.title}</h2>
              <p className="text-sm text-muted-foreground">{config.subtitle}</p>
            </motion.div>

            {/* Form */}
            <motion.form
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor={`phone-${role}`}>Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id={`phone-${role}`}
                    type="tel"
                    placeholder="Enter your 10-digit phone"
                    value={phone}
                    onChange={e => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setError(''); }}
                    className={`pl-10 h-12 text-base ${error ? 'border-red-400 dark:border-red-600 focus-visible:ring-red-400' : ''}`}
                    disabled={loading}
                    autoFocus
                  />
                </div>
                {error && (
                  <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-red-500 flex items-center gap-1.5">
                    <XCircle className="w-3.5 h-3.5" />
                    {error}
                  </motion.p>
                )}
              </div>

              <Button type="submit" className={`w-full h-12 text-base font-semibold ${config.btnClass}`} disabled={loading || phone.length < 10}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Logging in...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <LogIn className="w-4 h-4" />
                    Login
                  </span>
                )}
              </Button>
            </motion.form>

            {/* Demo Credentials */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="pt-2"
            >
              <div className={`rounded-xl bg-gradient-to-r ${config.lightBg} p-4 border border-white/50`}>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Demo Credentials</p>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${config.gradient} flex items-center justify-center`}>
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{config.demoName}</p>
                    <button
                      type="button"
                      onClick={() => { setPhone(config.demoPhone); setError(''); }}
                      className={`text-sm ${config.accent} font-mono hover:underline cursor-pointer`}
                    >
                      {config.demoPhone}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// LANDING PAGE
// ═══════════════════════════════════════════════════════════════════
function LandingPage({ onSelectRole, onBookAsCustomer }: {
  onSelectRole: (screen: AuthScreen) => void;
  onBookAsCustomer: () => void;
}) {
  const cards = [
    {
      id: 'employee-login' as AuthScreen,
      title: 'Employee',
      subtitle: 'Access your schedule, earnings & commission',
      icon: Scissors,
      gradient: 'from-rose-500 to-pink-600',
      lightBg: 'from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/30',
      shadow: 'hover:shadow-rose-500/20',
      ring: 'ring-rose-200 dark:ring-rose-800',
    },
    {
      id: 'manager-login' as AuthScreen,
      title: 'Manager',
      subtitle: 'Manage appointments, staff & inventory',
      icon: Building2,
      gradient: 'from-amber-500 to-orange-600',
      lightBg: 'from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30',
      shadow: 'hover:shadow-amber-500/20',
      ring: 'ring-amber-200 dark:ring-amber-800',
    },
    {
      id: 'owner-login' as AuthScreen,
      title: 'Owner',
      subtitle: 'Full business analytics & settlement engine',
      icon: Crown,
      gradient: 'from-emerald-500 to-teal-600',
      lightBg: 'from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30',
      shadow: 'hover:shadow-emerald-500/20',
      ring: 'ring-emerald-200 dark:ring-emerald-800',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 bg-gradient-to-br from-rose-50/50 via-white to-pink-50/50 dark:from-gray-950 dark:via-gray-900 dark:to-rose-950/10">
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-rose-200/30 dark:bg-rose-900/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-pink-200/30 dark:bg-pink-900/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-r from-rose-100/20 to-pink-100/20 dark:from-rose-900/5 dark:to-pink-900/5 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-4xl">
        {/* Logo & Branding */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 shadow-2xl shadow-rose-500/30 mb-6"
          >
            <Scissors className="w-10 h-10 text-white" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-rose-600 via-pink-600 to-rose-600 bg-clip-text text-transparent mb-3"
          >
            Dream Look
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-lg text-muted-foreground font-medium"
          >
            Your Beauty, Our Passion
          </motion.p>
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-4 h-1 w-24 mx-auto rounded-full bg-gradient-to-r from-rose-400 to-pink-400"
          />
        </motion.div>

        {/* Login Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-10"
        >
          {cards.map((card, i) => (
            <motion.button
              key={card.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + i * 0.15 }}
              onClick={() => onSelectRole(card.id)}
              className="group relative text-left cursor-pointer focus:outline-none"
            >
              <Card className={`backdrop-blur-xl bg-white/60 dark:bg-gray-900/60 border-white/30 dark:border-gray-700/20 shadow-lg ${card.shadow} hover:shadow-xl hover:-translate-y-1.5 active:scale-[0.98] transition-all duration-200 overflow-hidden h-full cursor-pointer`}>
                {/* Gradient accent bar */}
                <div className={`h-1.5 bg-gradient-to-r ${card.gradient}`} />
                <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-200`}>
                    <card.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-xl font-bold">{card.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{card.subtitle}</p>
                  </div>
                  <div className={`w-full py-2.5 rounded-xl bg-gradient-to-r ${card.lightBg} flex items-center justify-center gap-2 text-sm font-semibold transition-colors ${card.ring.replace('ring-', 'text-').replace('200', '600').replace('800', '400').replace('dark:', 'dark:')}`}>
                    <LogIn className="w-4 h-4" />
                    Login
                    <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </motion.button>
          ))}
        </motion.div>

        {/* Customer booking link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0 }}
          className="text-center"
        >
          <button
            onClick={onBookAsCustomer}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400 transition-colors group"
          >
            <Calendar className="w-4 h-4" />
            Or book an appointment as a customer
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// CUSTOMER VIEW - BOOK APPOINTMENT
// ═══════════════════════════════════════════════════════════════════
function CustomerView() {
  const [bookingStep, setBookingStep] = useState(0);
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [bookingComplete, setBookingComplete] = useState(false);
  const [serviceFilter, setServiceFilter] = useState('ALL');
  const [bookingLoading, setBookingLoading] = useState(false);

  // API data
  const { data: stores, loading: storesLoading, error: storesError, refetch: refetchStores } = useFetch<Store[]>('/api/salon/stores');
  const { data: services, loading: servicesLoading, error: servicesError, refetch: refetchServices } = useFetch<Service[]>('/api/salon/services');
  const { data: storeEmployees, loading: empLoading } = useFetch<Employee[]>(
    selectedStore ? `/api/salon/employees?storeId=${selectedStore}` : null
  );
  const { data: storeAppointments, loading: apptsLoading, refetch: refetchAppts } = useFetch<Appointment[]>(
    selectedStore && selectedEmployeeId
      ? `/api/salon/appointments?storeId=${selectedStore}&date=${format(selectedDate, 'yyyy-MM-dd')}&employeeId=${selectedEmployeeId}`
      : null
  );

  const busySlots = useMemo(() => {
    if (!storeAppointments) return new Set<string>();
    return new Set(
      storeAppointments
        .filter(a => a.status !== 'CANCELLED' && a.status !== 'NO_SHOW')
        .map(a => a.time)
    );
  }, [storeAppointments]);

  const steps = ['Store', 'Service', 'Date & Time', 'Details', 'Confirm'];
  const canNext = useMemo(() => {
    if (bookingStep === 0) return !!selectedStore;
    if (bookingStep === 1) return !!selectedService;
    if (bookingStep === 2) return !!selectedEmployeeId && !!selectedTimeSlot;
    if (bookingStep === 3) return !!customerName.trim() && customerPhone.trim().length >= 10;
    if (bookingStep === 4) return true;
    return false;
  }, [bookingStep, selectedStore, selectedService, selectedEmployeeId, selectedTimeSlot, customerName, customerPhone]);

  const filteredServices = useMemo(() => {
    if (!services) return [];
    if (serviceFilter === 'ALL') return services;
    return services.filter(s => s.category === serviceFilter);
  }, [services, serviceFilter]);

  const selectedStoreData = stores?.find(s => s.id === selectedStore);
  const selectedServiceData = services?.find(s => s.id === selectedService);
  const selectedEmployeeData = storeEmployees?.find(e => e.id === selectedEmployeeId);

  // Re-fetch appointments when date/employee changes
  useEffect(() => {
    if (selectedStore && selectedEmployeeId) {
      refetchAppts();
    }
  }, [selectedDate, selectedEmployeeId, selectedStore, refetchAppts]);

  const handleBooking = useCallback(async () => {
    if (!selectedStore || !selectedService || !selectedDate || !selectedEmployeeId || !selectedTimeSlot) return;
    setBookingLoading(true);
    try {
      await apiPost('/api/salon/appointments/create', {
        customerName, customerPhone,
        storeId: selectedStore,
        employeeId: selectedEmployeeId,
        serviceId: selectedService,
        date: format(selectedDate, 'yyyy-MM-dd'),
        time: selectedTimeSlot,
      });
      setBookingComplete(true);
      toast.success('Appointment booked successfully!', {
        description: `We'll send a reminder to ${customerPhone}`,
      });
    } catch (e) {
      toast.error('Failed to book appointment', { description: (e as Error).message });
    } finally {
      setBookingLoading(false);
    }
  }, [selectedStore, selectedService, selectedDate, selectedEmployeeId, selectedTimeSlot, customerName, customerPhone]);

  const resetBooking = useCallback(() => {
    setBookingComplete(false);
    setBookingStep(0);
    setSelectedStore('');
    setSelectedService('');
    setSelectedDate(new Date());
    setSelectedEmployeeId('');
    setSelectedTimeSlot('');
    setCustomerName('');
    setCustomerPhone('');
    refetchAppts();
  }, [refetchAppts]);

  // ─── BOOKING COMPLETE ──────────────────────────────────────
  if (bookingComplete) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="w-24 h-24 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mb-6">
          <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.3, type: 'spring' }}>
            <CheckCircle2 className="w-14 h-14 text-emerald-600 dark:text-emerald-400" />
          </motion.div>
        </motion.div>
        <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="text-2xl font-bold mb-2">Booking Confirmed!</motion.h2>
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          className="text-muted-foreground mb-1">We&apos;ll send a reminder to your phone</motion.p>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
          className="text-sm text-muted-foreground mb-8 text-center">
          {selectedServiceData?.name} at {selectedStoreData?.name}
          <br />{format(selectedDate, 'EEE, MMM d, yyyy')} at {formatTime(selectedTimeSlot)} with {selectedEmployeeData?.name}
        </motion.p>
        <Button onClick={resetBooking} className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 shadow-lg shadow-rose-500/20">
          Book Another Appointment
        </Button>
      </div>
    );
  }

  // ─── LOADING ───────────────────────────────────────────────
  if (storesLoading) return <ViewSkeleton />;

  // ─── HERO + STORE SELECTION (Step 0) ───────────────────────
  if (bookingStep === 0) {
    return (
      <div className="space-y-6">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500 via-pink-500 to-fuchsia-500 p-8 md:p-12 text-white shadow-2xl shadow-rose-500/20">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVHJhbnNmb3JtPSJyb3RhdGUoNDUpIj48cGF0aCBkPSJNLTEwIDMwaDYwIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCBmaWxsPSJ1cmwoI2EpIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIi8+PC9zdmc+')] opacity-30" />
          <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-white/10 blur-3xl" />
          <div className="relative z-10">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
              className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5" />
              <span className="text-sm font-medium text-white/90">Welcome to Dream Look</span>
            </motion.div>
            <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="text-3xl md:text-4xl font-bold mb-3">Your Dream Look,<br />Just a Click Away</motion.h2>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
              className="text-white/80 max-w-lg text-sm md:text-base">
              Choose from our premium salon services, pick your preferred stylist, and book in seconds. Walk in beautiful, walk out stunning.
            </motion.p>
          </div>
          {/* Floating Decorative Icons */}
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }} className="absolute top-6 right-12 opacity-20">
            <Scissors className="w-8 h-8 text-white" />
          </motion.div>
          <motion.div animate={{ rotate: -360 }} transition={{ duration: 25, repeat: Infinity, ease: 'linear' }} className="absolute bottom-8 right-32 opacity-15">
            <Star className="w-6 h-6 text-white" />
          </motion.div>
          <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} className="absolute top-12 right-48 opacity-20">
            <Heart className="w-7 h-7 text-white fill-white" />
          </motion.div>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 30, repeat: Infinity, ease: 'linear' }} className="absolute bottom-10 left-12 opacity-10">
            <Sparkles className="w-10 h-10 text-white" />
          </motion.div>
        </motion.div>

        {/* Track Appointment */}
        <CustomerAppointmentTracker />

        {/* Store Selection */}
        <div className="space-y-4">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold">
              <span className="w-1 h-5 rounded-full bg-gradient-to-b from-rose-500 to-pink-500" />
              Choose a Store
            </h2>
            <p className="text-muted-foreground text-sm">Select your preferred Dream Look location</p>
          </div>
          {storesError ? (
            <ErrorCard message="Failed to load stores" onRetry={refetchStores} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(stores || []).map((store, idx) => {
                const borderColors = ['border-l-rose-500', 'border-l-amber-500', 'border-l-emerald-500'];
                const iconGradients = [STORE_GRADIENTS[0], STORE_GRADIENTS[1], STORE_GRADIENTS[2]];
                return (
                <div key={store.id} className="hover:-translate-y-1 active:scale-[0.98] transition-transform duration-150">
                  <GlassCard className={`cursor-pointer transition-all hover:shadow-xl border-l-4 ${borderColors[idx] || borderColors[0]} ${
                    selectedStore === store.id ? 'ring-2 ring-rose-500 shadow-xl shadow-rose-500/10' : ''
                  }`} onClick={() => { setSelectedStore(store.id); setSelectedEmployeeId(''); setSelectedTimeSlot(''); }}>
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-gradient-to-br ${iconGradients[idx] || iconGradients[0]} text-white`}>
                          <Building2 className="w-5 h-5" />
                        </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h3 className="font-semibold text-sm">{store.name}</h3>
                              {store.isActive && (
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                                </span>
                              )}
                            </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <MapPin className="w-3 h-3 shrink-0" /> <span className="truncate">{store.address}</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                            <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {store.phone}</span>
                            <span>{store.city}</span>
                          </div>
                        </div>
                      </div>
                      {selectedStore === store.id && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                          className="mt-3 flex items-center gap-1 text-rose-600 dark:text-rose-400 text-xs font-medium">
                          <Check className="w-3.5 h-3.5" /> Selected
                        </motion.div>
                      )}
                    </CardContent>
                  </GlassCard>
                </div>
              );
              })}
            </div>
          )}
        </div>

        {selectedStore && (
          <div className="flex justify-end">
            <Button onClick={() => setBookingStep(1)} className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 shadow-lg shadow-rose-500/20">
              Continue <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}
      </div>
    );
  }

  // ─── BOOKING STEPS (1-4) ───────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <GlassCard>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            {steps.map((label, i) => (
              <React.Fragment key={label}>
                <button onClick={() => i < bookingStep && setBookingStep(i)} className="flex flex-col items-center gap-1 group">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                    i <= bookingStep ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                  } ${i < bookingStep ? 'cursor-pointer hover:bg-rose-600' : ''}`}>
                    {i < bookingStep ? <Check className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className={`text-xs hidden sm:block transition-colors ${i <= bookingStep ? 'text-rose-600 dark:text-rose-400 font-medium' : 'text-muted-foreground'}`}>
                    {label}
                  </span>
                </button>
                {i < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 rounded transition-colors ${i < bookingStep ? 'bg-rose-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </CardContent>
      </GlassCard>

      {/* Step Content - CSS transition via opacity, no AnimatePresence */}
      <div key={bookingStep} className="animate-[fadeIn_0.2s_ease-out]">

        {/* Step 1: Choose Service */}
        {bookingStep === 1 && (
          <div className="space-y-4">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-bold">
                <span className="w-1 h-5 rounded-full bg-gradient-to-b from-rose-500 to-pink-500" />
                Choose a Service
              </h2>
              <p className="text-muted-foreground text-sm">Select the service you&apos;d like</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {SERVICE_CATEGORIES.map((cat) => (
                <Button key={cat} size="sm" variant={serviceFilter === cat ? 'default' : 'outline'}
                  onClick={() => setServiceFilter(cat)}
                  className={serviceFilter === cat ? 'bg-rose-500 hover:bg-rose-600 shadow-sm' : ''}>
                  {cat === 'ALL' ? 'All Services' : cat.charAt(0) + cat.slice(1).toLowerCase()}
                </Button>
              ))}
            </div>
            {servicesLoading ? <ViewSkeleton /> : servicesError ? (
              <ErrorCard message="Failed to load services" onRetry={refetchServices} />
            ) : filteredServices.length === 0 ? (
              <EmptyState icon={Sparkles} title="No services found" description="No services match this filter" />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredServices.map((service) => (
                  <div key={service.id} className="hover:-translate-y-0.5 active:scale-[0.98] transition-transform duration-150">
                    <GlassCard className={`cursor-pointer transition-all hover:shadow-xl ${
                      selectedService === service.id ? 'ring-2 ring-rose-500 shadow-xl shadow-rose-500/10' : ''
                    }`} onClick={() => setSelectedService(service.id)}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="min-w-0">
                            <h3 className="font-medium text-sm">{service.name}</h3>
                            <Badge variant="secondary" className="mt-1.5 text-[10px]">{service.category}</Badge>
                            {service.description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{service.description}</p>
                            )}
                          </div>
                          <div className="text-right shrink-0 ml-3">
                            <p className="font-bold text-rose-600 dark:text-rose-400">{formatCurrency(service.price)}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end mt-0.5">
                              <Clock className="w-3 h-3" /> {service.duration} min
                            </p>
                          </div>
                        </div>
                        {selectedService === service.id && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                            className="mt-2 flex items-center gap-1 text-rose-600 dark:text-rose-400 text-xs font-medium">
                            <Check className="w-3.5 h-3.5" /> Selected
                          </motion.div>
                        )}
                      </CardContent>
                    </GlassCard>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Date & Time + Employee */}
        {bookingStep === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-bold">
                <span className="w-1 h-5 rounded-full bg-gradient-to-b from-rose-500 to-pink-500" />
                Pick Stylist, Date & Time
              </h2>
              <p className="text-muted-foreground text-sm">Choose your preferred appointment slot</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: Calendar + Time */}
              <div className="space-y-4">
                <Card className="p-4 shadow-sm">
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate}
                    onSelect={(d) => { if (d) { setSelectedDate(d); setSelectedTimeSlot(''); } }}
                    disabled={(d) => isBefore(d, startOfDay(new Date()))}
                    className="rounded-md mx-auto"
                  />
                </Card>
                {/* Time Slots */}
                <div>
                  <h3 className="text-sm font-medium mb-2">Available Time Slots</h3>
                  {selectedEmployeeId ? (
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                      {TIME_SLOTS.map((slot) => {
                        const isBusy = busySlots.has(slot);
                        const now = new Date();
                        const [h, m] = slot.split(':').map(Number);
                        const slotDate = new Date(selectedDate || new Date());
                        slotDate.setHours(h, m, 0, 0);
                        const isPast = slotDate < now && isToday(selectedDate || new Date());
                        const isSelected = selectedTimeSlot === slot;
                        const isDisabled = isPast || isBusy;
                        return (
                          <button key={slot} disabled={isDisabled}
                            onClick={() => setSelectedTimeSlot(slot)}
                            className={`py-2 px-1 rounded-lg text-xs font-medium transition-all ${
                              isSelected ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30' :
                              isBusy ? 'bg-red-50 dark:bg-red-900/20 text-red-400 dark:text-red-500 cursor-not-allowed line-through' :
                              isPast ? 'bg-gray-50 dark:bg-gray-800/50 text-gray-400 dark:text-gray-600 cursor-not-allowed' :
                              'bg-white dark:bg-gray-800 border hover:border-rose-300 dark:hover:border-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                            }`}>
                            {formatTime(slot)}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Users className="w-8 h-8 text-muted-foreground/50 mb-2" />
                      <p className="text-sm text-muted-foreground">Select a stylist to see available times</p>
                    </div>
                  )}
                </div>
                </div>
              {/* Right: Employee Selection */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium">Choose Your Stylist</h3>
                {empLoading ? (
                  <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
                ) : !storeEmployees || storeEmployees.length === 0 ? (
                  <EmptyState icon={Users} title="No staff available" description="No staff available for this store" />
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                    {storeEmployees.map((emp) => {
                      const isSelected = selectedEmployeeId === emp.id;
                      return (
                        <button key={emp.id}
                          onClick={() => { setSelectedEmployeeId(isSelected ? '' : emp.id); setSelectedTimeSlot(''); }}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all hover:scale-[1.01] active:scale-[0.99] ${
                            isSelected ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/30 shadow-sm' : 'hover:border-rose-200 dark:hover:border-rose-800'
                          }`}>
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className={`text-xs font-semibold transition-colors ${
                              isSelected ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400' : 'bg-gray-100 dark:bg-gray-800'
                            }`}>
                              {getInitials(emp.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">{emp.name}</p>
                            <p className="text-xs text-muted-foreground">{emp.role}</p>
                          </div>
                          {isSelected && <Check className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Customer Details */}
        {bookingStep === 3 && (
          <div className="space-y-4 max-w-md mx-auto">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-bold">
                <span className="w-1 h-5 rounded-full bg-gradient-to-b from-rose-500 to-pink-500" />
                Your Details
              </h2>
              <p className="text-muted-foreground text-sm">We just need your name and phone number</p>
            </div>
            <GlassCard>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cname">Full Name</Label>
                  <Input id="cname" placeholder="Enter your name" value={customerName}
                    onChange={e => setCustomerName(e.target.value)} className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cphone">Phone Number</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">+91</span>
                    <Input id="cphone" placeholder="98765 43210" value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className="h-11 pl-12" maxLength={10} />
                  </div>
                  {customerPhone.length > 0 && customerPhone.length < 10 && (
                    <p className="text-xs text-amber-600 dark:text-amber-400">Enter a valid 10-digit phone number</p>
                  )}
                </div>
                <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 dark:bg-muted/20 rounded-lg p-3">
                  <Shield className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>Your information is used only for booking purposes. We respect your privacy and will never share your data.</p>
                </div>
              </CardContent>
            </GlassCard>
          </div>
        )}

        {/* Step 4: Confirm */}
        {bookingStep === 4 && (
          <div className="space-y-4 max-w-md mx-auto">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-bold">
                <span className="w-1 h-5 rounded-full bg-gradient-to-b from-rose-500 to-pink-500" />
                Review & Confirm
              </h2>
              <p className="text-muted-foreground text-sm">Verify your appointment details</p>
            </div>
            <GlassCard className="overflow-hidden">
              <div className="bg-gradient-to-r from-rose-500 to-pink-600 p-4 text-white">
                <p className="text-sm font-medium opacity-90">Appointment Summary</p>
                <h3 className="text-lg font-bold mt-1">{selectedServiceData?.name}</h3>
              </div>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">Store:</span>
                  <span className="font-medium">{selectedStoreData?.name}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <User className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">Stylist:</span>
                  <span className="font-medium">{selectedEmployeeData?.name} ({selectedEmployeeData?.role})</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">Date:</span>
                  <span className="font-medium">{format(selectedDate, 'EEE, MMM d, yyyy')}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">Time:</span>
                  <span className="font-medium">{formatTime(selectedTimeSlot)}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Timer className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">Duration:</span>
                  <span className="font-medium">{selectedServiceData?.duration} minutes</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="font-medium">Total</span>
                  <span className="text-xl font-bold text-rose-600 dark:text-rose-400">{formatCurrency(selectedServiceData?.price || 0)}</span>
                </div>
                <Separator />
                <div className="space-y-1.5 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Name:</span>
                    <span className="font-medium">{customerName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Phone:</span>
                    <span className="font-medium">+91 {customerPhone}</span>
                  </div>
                </div>
              </CardContent>
            </GlassCard>
            <Button onClick={handleBooking} disabled={bookingLoading || !canNext}
              className="w-full h-12 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-base font-semibold shadow-lg shadow-rose-500/20">
              {bookingLoading ? (
                <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Booking...</>
              ) : (
                <>Confirm Booking <CheckCircle2 className="w-4 h-4 ml-2" /></>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      {bookingStep >= 1 && bookingStep <= 3 && (
        <div className="flex justify-between pt-2">
          <Button variant="outline" onClick={() => { setBookingStep(bookingStep - 1); if (bookingStep === 2) { setSelectedTimeSlot(''); } }}>
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <Button onClick={() => canNext && setBookingStep(bookingStep + 1)}
            disabled={!canNext} className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 shadow-md shadow-rose-500/20">
            Continue <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── CUSTOMER APPOINTMENT TRACKER ──────────────────────────
function CustomerAppointmentTracker() {
  const [trackPhone, setTrackPhone] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [lookupDone, setLookupDone] = useState(false);
  const [cancelLoading, setCancelLoading] = useState<string | null>(null);

  // Fetch appointments directly by phone number
  const { data: phoneAppts, loading: allLoading, refetch: refetchAppts } = useFetch<Appointment[]>(
    trackPhone.length >= 10 && lookupDone ? `/api/salon/appointments?phone=${trackPhone}` : null
  );

  const matchedCustomer = useMemo(() => {
    if (!phoneAppts || phoneAppts.length === 0) return null;
    return phoneAppts[0]?.customer || null;
  }, [phoneAppts]);

  const handleLookup = useCallback(() => {
    if (trackPhone.length >= 10) setLookupDone(true);
  }, [trackPhone]);

  const handleCancelAppointment = useCallback(async (aptId: string) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    setCancelLoading(aptId);
    try {
      await apiPatch(`/api/salon/appointments/${aptId}`, { status: 'CANCELLED' });
      toast.success('Appointment cancelled successfully');
      refetchAppts();
    } catch (e) {
      toast.error('Failed to cancel appointment', { description: (e as Error).message });
    } finally {
      setCancelLoading(null);
    }
  }, [refetchAppts]);

  return (
    <GlassCard className="overflow-hidden">
      <CardContent className="p-0">
        <button onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
              <Search className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold">Track My Appointment</p>
              <p className="text-xs text-muted-foreground">Already booked? Check your appointment status</p>
            </div>
          </div>
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
        </button>

        {expanded && (
          <div className="px-4 pb-4 border-t pt-4 animate-[fadeIn_0.2s_ease-out]">
            {!lookupDone ? (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">+91</span>
                    <Input placeholder="Enter your phone number" value={trackPhone}
                      onChange={e => setTrackPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className="h-10 pl-12" maxLength={10} />
                  </div>
                  <Button onClick={handleLookup} disabled={trackPhone.length < 10}
                    className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-md shadow-violet-500/20">
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
                {trackPhone.length > 0 && trackPhone.length < 10 && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">Enter a valid 10-digit phone number</p>
                )}
              </div>
            ) : !matchedCustomer ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 rounded-2xl bg-muted/80 flex items-center justify-center mx-auto mb-3">
                  <User className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium mb-1">No bookings found</p>
                <p className="text-xs text-muted-foreground mb-3">We couldn&apos;t find any appointments for this number</p>
                <Button variant="outline" size="sm" onClick={() => { setLookupDone(false); setTrackPhone(''); }}>
                  Try again
                </Button>
              </div>
            ) : allLoading ? (
              <div className="space-y-2 py-2">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
            ) : (phoneAppts || []).length === 0 ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 rounded-2xl bg-muted/80 flex items-center justify-center mx-auto mb-3">
                  <Calendar className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium mb-1">No upcoming appointments</p>
                <p className="text-xs text-muted-foreground mb-1">{matchedCustomer.name} has no scheduled appointments</p>
                <Button variant="outline" size="sm" onClick={() => { setLookupDone(false); setTrackPhone(''); setExpanded(false); }}>
                  Book a new appointment
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{matchedCustomer.name}&apos;s Appointments</p>
                  <Button variant="ghost" size="sm" onClick={() => { setLookupDone(false); setTrackPhone(''); }} className="text-xs h-7">
                    <RefreshCw className="w-3 h-3 mr-1" /> New Search
                  </Button>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                  {(phoneAppts || []).sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`)).slice(0, 5).map((apt) => (
                    <div key={apt.id} className="flex items-center gap-3 p-3 rounded-xl border hover:shadow-sm transition-all">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 flex items-center justify-center shrink-0">
                        <Calendar className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{apt.service?.name}</p>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span>{format(new Date(apt.date), 'MMM d')}</span>
                          <span>•</span>
                          <span>{formatTime(apt.time)}</span>
                          <span>•</span>
                          <span>{apt.employee?.name}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground">{apt.store?.name}</p>
                      </div>
                      <div className="text-right shrink-0 flex flex-col items-end gap-1">
                        <StatusBadge status={apt.status} />
                        <p className="text-xs font-medium text-rose-600 dark:text-rose-400">{formatCurrency(apt.service?.price || 0)}</p>
                        {(apt.status === 'PENDING' || apt.status === 'CONFIRMED') && (
                          <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] text-red-600 dark:text-red-400 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                            disabled={cancelLoading === apt.id}
                            onClick={() => handleCancelAppointment(apt.id)}>
                            {cancelLoading === apt.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </GlassCard>
  );
}

// ═══════════════════════════════════════════════════════════════════
// EMPLOYEE VIEW - MY DASHBOARD
// ═══════════════════════════════════════════════════════════════════
interface EmployeeViewProps {
  onCompleteService: (appointment: Appointment, callback?: () => void) => void;
  authUser?: AuthUser | null;
}

// ─── QUICK STATS CARD ─────────────────────────────────────────
function QuickStatsCard({ todayTransactions, weekTransactions }: { todayTransactions: Transaction[]; weekTransactions: Transaction[] }) {
  const weekCompleted = weekTransactions.length;
  const weekTotal = weekCompleted; // All transactions in weekTransactions are completed
  const completionRate = weekTotal > 0 ? 100 : 0;
  const avgEarning = weekCompleted > 0 ? Math.round(weekTransactions.reduce((s, t) => s + t.employeeNetShare, 0) / weekCompleted) : 0;
  const productsUsedToday = todayTransactions.reduce((s, t) => s + t.productsUsed.length, 0);

  const stats = [
    { label: 'This Week', value: String(weekCompleted), icon: Calendar, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    { label: 'Completion Rate', value: `${completionRate}%`, icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
    { label: 'Avg. Earning', value: formatCurrency(avgEarning), icon: IndianRupee, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-100 dark:bg-rose-900/30' },
    { label: 'Products Used', value: String(productsUsedToday), icon: Package, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  ];

  return (
    <GlassCard>
      <CardContent className="p-4">
        <div className="grid grid-cols-2 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{s.label}</p>
                <p className="text-sm font-bold truncate">{s.value}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </GlassCard>
  );
}

function EmployeeView({ onCompleteService, authUser }: EmployeeViewProps) {
  const [selectedEmployee, setSelectedEmployee] = useState<string>(() => authUser?.id || '');

  const today = format(new Date(), 'yyyy-MM-dd');
  const weekAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd');
  const monthAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');

  const { data: employees, loading: empLoading } = useFetch<Employee[]>('/api/salon/employees');
  const activeEmployeeId = selectedEmployee || employees?.[0]?.id || '';

  const { data: todayTransactions, refetch: refetchToday } = useFetch<Transaction[]>(
    activeEmployeeId ? `/api/salon/transactions?employeeId=${activeEmployeeId}&from=${today}&to=${today}` : null
  );
  const { data: weekTransactions } = useFetch<Transaction[]>(
    activeEmployeeId ? `/api/salon/transactions?employeeId=${activeEmployeeId}&from=${weekAgo}&to=${today}` : null
  );
  const { data: monthTransactions } = useFetch<Transaction[]>(
    activeEmployeeId ? `/api/salon/transactions?employeeId=${activeEmployeeId}&from=${monthAgo}&to=${today}` : null
  );
  const { data: schedule, loading: schedLoading, refetch: refetchSchedule } = useFetch<Appointment[]>(
    activeEmployeeId ? `/api/salon/appointments?employeeId=${activeEmployeeId}&date=${today}` : null
  );

  const currentEmp = employees?.find(e => e.id === activeEmployeeId);

  const todayEarnings = useMemo(() => {
    const gross = (todayTransactions || []).reduce((s, t) => s + t.employeeGrossShare, 0);
    const deductions = (todayTransactions || []).reduce((s, t) => s + t.totalProductCost, 0);
    const net = (todayTransactions || []).reduce((s, t) => s + t.employeeNetShare, 0);
    return { gross, deductions, net, count: (todayTransactions || []).length };
  }, [todayTransactions]);

  const weekEarnings = useMemo(() => {
    return (weekTransactions || []).reduce((s, t) => s + t.employeeNetShare, 0);
  }, [weekTransactions]);

  const monthEarnings = useMemo(() => {
    return (monthTransactions || []).reduce((s, t) => s + t.employeeNetShare, 0);
  }, [monthTransactions]);

  const animatedToday = useAnimatedNumber(todayEarnings.net);
  const animatedWeek = useAnimatedNumber(weekEarnings);
  const animatedMonth = useAnimatedNumber(monthEarnings);

  if (empLoading) return <ViewSkeleton />;

  return (
    <div className="space-y-6">
      {/* Employee Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 ring-2 ring-rose-200 dark:ring-rose-800">
            <AvatarFallback className="bg-gradient-to-br from-rose-500 to-pink-600 text-white font-bold text-sm">
              {currentEmp ? getInitials(currentEmp.name) : '?'}
            </AvatarFallback>
          </Avatar>
          <div>
            {authUser ? (
              <>
                <h2 className="flex items-center gap-2 text-lg font-bold">
                  <span className="w-1 h-5 rounded-full bg-gradient-to-b from-rose-500 to-pink-500" />
                  Welcome back, {authUser.name}! 👋
                </h2>
                <p className="text-sm text-muted-foreground">
                  {currentEmp?.role} @ {authUser.storeName}
                </p>
              </>
            ) : (
              <>
                <h2 className="flex items-center gap-2 text-lg font-bold">
                  <span className="w-1 h-5 rounded-full bg-gradient-to-b from-rose-500 to-pink-500" />
                  {currentEmp?.name || 'Select Employee'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {currentEmp?.role} @ {currentEmp?.store?.name || ''}
                </p>
              </>
            )}
          </div>
        </div>
        {!authUser && (
          <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Select employee" />
            </SelectTrigger>
            <SelectContent>
              {(employees || []).map(emp => (
                <SelectItem key={emp.id} value={emp.id}>{emp.name} — {emp.role}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Quick Stats */}
      <QuickStatsCard todayTransactions={todayTransactions || []} weekTransactions={weekTransactions || []} />

      {/* Earnings Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={Zap} label="Today's Net" value={formatCurrency(animatedToday)} sub={`${todayEarnings.count} services · gross ${formatCurrency(todayEarnings.gross)}`} gradient="bg-gradient-to-r from-rose-500 to-pink-500" />
        <StatCard icon={TrendingUp} label="This Week" value={formatCurrency(animatedWeek)} sub={`${(weekTransactions || []).length} services`} gradient="bg-gradient-to-r from-blue-500 to-indigo-500" />
        <StatCard icon={Target} label="This Month" value={formatCurrency(animatedMonth)} sub={`${(monthTransactions || []).length} services`} gradient="bg-gradient-to-r from-emerald-500 to-green-500" />
      </div>

      {/* Monthly Target */}
      <EarningsGoalTracker currentEarnings={monthEarnings} employeeRole={currentEmp?.role || 'STYLIST'} />

      {/* How Commission Works + Daily Earnings Sparkline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GlassCard>
          <CardContent className="p-4">
            <h3 className="text-sm font-medium mb-3 flex items-center gap-1.5"><Calculator className="w-4 h-4 text-violet-500" /> How Commission Works</h3>
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="px-2.5 py-1.5 rounded-lg bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 font-semibold">Service Price</span>
              <span className="text-muted-foreground font-bold">→</span>
              <span className="px-2.5 py-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 font-semibold">50% Owner</span>
              <span className="text-muted-foreground font-bold">→</span>
              <span className="px-2.5 py-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold">50% Employee (Gross)</span>
              <span className="text-muted-foreground font-bold">→</span>
              <span className="px-2.5 py-1.5 rounded-lg bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 font-semibold">minus Product Cost</span>
              <span className="text-muted-foreground font-bold">=</span>
              <span className="px-2.5 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-bold">Net Earnings</span>
            </div>
          </CardContent>
        </GlassCard>

        {/* Daily Earnings Sparkline */}
        <GlassCard>
          <CardContent className="p-4">
            <h3 className="text-sm font-medium mb-2 flex items-center gap-1.5"><TrendingUp className="w-4 h-4 text-blue-500" /> Daily Earnings (Last 7 Days)</h3>
            <DailyEarningsSparkline transactions={weekTransactions || []} />
          </CardContent>
        </GlassCard>
      </div>

      {/* Today's Commission Breakdown */}
      {(todayTransactions || []).length > 0 && (
        <GlassCard>
          <CardContent className="p-4">
            <h3 className="text-sm font-medium mb-2">Today&apos;s Commission Breakdown</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/20">
                <p className="text-[10px] font-medium text-muted-foreground uppercase">Net Earned</p>
                <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(todayEarnings.net)}</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                <p className="text-[10px] font-medium text-muted-foreground uppercase">Gross</p>
                <p className="text-base font-bold text-blue-600 dark:text-blue-400">{formatCurrency(todayEarnings.gross)}</p>
              </div>
              <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/20">
                <p className="text-[10px] font-medium text-muted-foreground uppercase">Product Costs</p>
                <p className="text-base font-bold text-red-600 dark:text-red-400">-{formatCurrency(todayEarnings.deductions)}</p>
              </div>
            </div>
          </CardContent>
        </GlassCard>
      )}

      {/* Commission Calculator Tool */}
      <CommissionCalculatorTool />

      {/* Today's Schedule */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Today&apos;s Schedule</CardTitle>
              <CardDescription>{format(new Date(), 'EEEE, MMM d, yyyy')}</CardDescription>
            </div>
            <Badge variant="secondary">{(schedule || []).length} appointments</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {schedLoading ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}</div>
          ) : !schedule || schedule.length === 0 ? (
            <EmptyState icon={Calendar} title="No appointments today" description="Your schedule is clear. Enjoy the day!" />
          ) : (
            <div className="space-y-3">
              {schedule.sort((a, b) => a.time.localeCompare(b.time)).map((apt) => {
                const canComplete = apt.status === 'CONFIRMED' || apt.status === 'PENDING';
                const isCompleted = apt.status === 'COMPLETED';
                return (
                  <div key={apt.id} className={`hover:scale-[1.005] transition-transform
                    flex items-center gap-4 p-3 rounded-xl border transition-all ${
                      isCompleted ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800' :
                      'bg-white dark:bg-gray-900 hover:shadow-md border-gray-200 dark:border-gray-700'
                    }`}>
                    <div className="text-center min-w-[60px]">
                      <p className="text-sm font-bold">{formatTime(apt.time)}</p>
                    </div>
                    <Separator orientation="vertical" className="h-10" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{apt.customer?.name || 'Customer'}</p>
                      <p className="text-xs text-muted-foreground">{apt.service?.name} &bull; {apt.service?.duration}min</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">{formatCurrency(apt.service?.price || 0)}</p>
                      <StatusBadge status={apt.status} />
                    </div>
                    {canComplete && (
                      <Button size="sm" className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 shrink-0 shadow-sm"
                        onClick={() => onCompleteService(apt, () => { refetchToday(); refetchSchedule(); })}>
                        <Play className="w-3.5 h-3.5 mr-1" /> Complete
                      </Button>
                    )}
                    {isCompleted && (
                      <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs shrink-0">
                        <CheckCircle2 className="w-4 h-4" /> Done
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity Feed */}
      {(todayTransactions || []).length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-500" />
                <CardTitle className="text-base">Recent Activity</CardTitle>
              </div>
              <Badge variant="secondary">{(todayTransactions || []).length} services today</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar">
              {todayTransactions.sort((a, b) => {
                const ta = new Date(b.completedAt || '').getTime();
                const tb = new Date(a.completedAt || '').getTime();
                return ta - tb;
              }).map((tx) => (
                <div key={tx.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 dark:bg-muted/10 hover:bg-muted/50 transition-colors">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    tx.employeeNetShare >= 0
                      ? 'bg-emerald-100 dark:bg-emerald-900/30'
                      : 'bg-red-100 dark:bg-red-900/30'
                  }`}>
                    {tx.employeeNetShare >= 0
                      ? <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      : <TrendingUp className="w-4 h-4 text-red-600 dark:text-red-400 rotate-180" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{tx.service?.name}</p>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{tx.completedAt ? format(new Date(tx.completedAt), 'hh:mm a') : ''}</span>
                      {tx.productsUsed.length > 0 && (
                        <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full">
                          {tx.productsUsed.length} product{tx.productsUsed.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-semibold ${
                      tx.employeeNetShare >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {tx.employeeNetShare >= 0 ? '+' : ''}{formatCurrency(tx.employeeNetShare)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{formatCurrency(tx.servicePrice)} total</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── DAILY EARNINGS SPARKLINE ─────────────────────────────────
function DailyEarningsSparkline({ transactions }: { transactions: Transaction[] }) {
  const dailyData = useMemo(() => {
    const map = new Map<string, number>();
    for (let i = 6; i >= 0; i--) {
      map.set(format(subDays(new Date(), i), 'yyyy-MM-dd'), 0);
    }
    for (const t of transactions) {
      const d = t.completedAt?.slice(0, 10) || '';
      if (map.has(d)) map.set(d, (map.get(d) || 0) + t.employeeNetShare);
    }
    return Array.from(map.entries()).map(([date, net]) => ({
      day: format(new Date(date), 'EEE'),
      net,
    }));
  }, [transactions]);

  const maxVal = Math.max(...dailyData.map(d => Math.abs(d.net)), 1);

  if (dailyData.every(d => d.net === 0)) {
    return (
      <div className="flex items-end justify-between h-16 gap-1 px-2">
        {dailyData.map((d) => (
          <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full h-8 rounded-md bg-muted/50 dark:bg-muted/20" />
            <span className="text-[10px] text-muted-foreground">{d.day}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-end justify-between h-16 gap-1 px-2">
      {dailyData.map((d) => {
        const h = maxVal > 0 ? Math.max(Math.round((Math.abs(d.net) / maxVal) * 48), 4) : 4;
        return (
          <div key={d.day} className="flex-1 flex flex-col items-center gap-1" title={`${d.day}: ${formatCurrency(d.net)}`}>
            <div
              className={`w-full rounded-md transition-all duration-300 ${d.net >= 0 ? 'bg-gradient-to-t from-emerald-500 to-emerald-400' : 'bg-gradient-to-t from-red-500 to-red-400'}`}
              style={{ height: `${h}px` }}
            />
            <span className="text-[10px] text-muted-foreground font-medium">{d.day}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── COMMISSION CALCULATOR TOOL ─────────────────────────────────
function CommissionCalculatorTool() {
  const [calcPrice, setCalcPrice] = useState<number>(500);
  const [calcProducts, setCalcProducts] = useState<Record<string, number>>({});

  const { data: products } = useFetch<Product[]>('/api/salon/products');

  const calcResult = useMemo(() => {
    const prods = Object.entries(calcProducts)
      .filter(([, qty]) => qty > 0)
      .map(([id, qty]) => {
        const p = (products || []).find(pr => pr.id === id);
        return { cost: p?.cost || 0, quantity: qty, name: p?.name || '', unit: p?.unit || '' };
      });
    return calculateCommission(calcPrice, prods);
  }, [calcPrice, calcProducts, products]);

  return (
    <GlassCard>
      <CardContent className="p-4 space-y-4">
        <h3 className="text-sm font-medium flex items-center gap-1.5">
          <Calculator className="w-4 h-4 text-violet-500" />
          Calculate Your Earnings
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Input Side */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Service Price (₹)</Label>
              <Input type="number" value={calcPrice} onChange={e => setCalcPrice(Math.max(0, Number(e.target.value)))}
                className="h-9" min={0} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Products Used</Label>
              <ScrollArea className="max-h-[150px]">
                <div className="space-y-1.5 pr-2">
                  {(products || []).map(p => (
                    <div key={p.id} className="flex items-center gap-2">
                      <span className="text-xs flex-1 truncate">{p.name}</span>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">{formatCurrency(p.cost)}/{p.unit}</span>
                      <Input type="number" min={0} max={99} value={calcProducts[p.id] || 0}
                        onChange={e => setCalcProducts(prev => ({ ...prev, [p.id]: Math.max(0, Number(e.target.value)) }))}
                        className="h-7 w-16 text-xs text-center" />
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* Result Side */}
          <div className="space-y-2 p-3 rounded-xl bg-muted/50 dark:bg-muted/20 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Service Price</span>
              <span className="font-medium">{formatCurrency(calcPrice)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground pl-2">Owner&apos;s Share (50%)</span>
              <span className="font-medium text-amber-600 dark:text-amber-400">{formatCurrency(calcResult.ownerShare)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground pl-2">Your Gross (50%)</span>
              <span className="font-medium text-blue-600 dark:text-blue-400">{formatCurrency(calcResult.employeeGross)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground pl-2">Product Deductions</span>
              <span className="font-medium text-red-600 dark:text-red-400">-{formatCurrency(calcResult.totalProductCost)}</span>
            </div>
            <Separator />
            <div className={`flex justify-between font-bold text-base ${calcResult.employeeNet >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              <span>Your Net Earnings</span>
              <span>{formatCurrency(calcResult.employeeNet)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </GlassCard>
  );
}

// ─── TODAY VS YESTERDAY COMPARISON ──────────────────────────
function TodayVsYesterdayComparison({ storeId }: { storeId: string }) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');

  const { data: todayData } = useFetch<AnalyticsData>(
    storeId ? `/api/salon/analytics?storeId=${storeId}&from=${today}&to=${today}` : null
  );
  const { data: yesterdayData } = useFetch<AnalyticsData>(
    storeId ? `/api/salon/analytics?storeId=${storeId}&from=${yesterday}&to=${yesterday}` : null
  );

  const todayRev = todayData?.totalRevenue || 0;
  const yesterdayRev = yesterdayData?.totalRevenue || 0;
  const todayTx = todayData?.totalTransactions || 0;
  const yesterdayTx = yesterdayData?.totalTransactions || 0;

  const revChange = yesterdayRev > 0 ? ((todayRev - yesterdayRev) / yesterdayRev) * 100 : todayRev > 0 ? 100 : 0;
  const txChange = yesterdayTx > 0 ? ((todayTx - yesterdayTx) / yesterdayTx) * 100 : todayTx > 0 ? 100 : 0;

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-violet-500" />
          <CardTitle className="text-base">Today vs Yesterday</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-muted/50 dark:bg-muted/20">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Revenue</p>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-lg font-bold">{formatCurrency(todayRev)}</p>
                <p className="text-xs text-muted-foreground">yesterday: {formatCurrency(yesterdayRev)}</p>
              </div>
              <div className={`flex items-center gap-0.5 text-xs font-semibold px-2 py-1 rounded-lg ${
                revChange >= 0
                  ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30'
                  : 'text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30'
              }`}>
                {revChange >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                {Math.abs(revChange).toFixed(0)}%
              </div>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-muted/50 dark:bg-muted/20">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Transactions</p>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-lg font-bold">{todayTx}</p>
                <p className="text-xs text-muted-foreground">yesterday: {yesterdayTx}</p>
              </div>
              <div className={`flex items-center gap-0.5 text-xs font-semibold px-2 py-1 rounded-lg ${
                txChange >= 0
                  ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30'
                  : 'text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30'
              }`}>
                {txChange >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                {Math.abs(txChange).toFixed(0)}%
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MANAGER VIEW - MANAGE STORE
// ═══════════════════════════════════════════════════════════════════
function ManagerView({ authUser }: { authUser?: AuthUser | null }) {
  const [managerStoreId, setManagerStoreId] = useState<string>(() => authUser?.storeId || '');
  const [inventoryFilter, setInventoryFilter] = useState<'all' | 'low' | 'out'>('all');
  const [newApptDialogOpen, setNewApptDialogOpen] = useState(false);

  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: stores, loading: storesLoading } = useFetch<Store[]>('/api/salon/stores');

  // Compute active store ID without useEffect+setState (avoids cascading render lint error)
  const activeStoreId = managerStoreId || (stores && stores.length > 0 ? stores[0].id : '');

  const { data: appointments, loading: apptsLoading, error: apptsError, refetch: refetchAppts } = useFetch<Appointment[]>(
    activeStoreId ? `/api/salon/appointments?storeId=${activeStoreId}&date=${today}` : null
  );
  const { data: inventory, loading: invLoading, error: invError, refetch: refetchInv } = useFetch<InventoryItem[]>(
    activeStoreId ? `/api/salon/inventory?storeId=${activeStoreId}` : null
  );
  const { data: attendance, loading: attLoading, error: attError, refetch: refetchAtt } = useFetch<AttendanceRecord[]>(
    activeStoreId ? `/api/salon/attendance?storeId=${activeStoreId}&date=${today}` : null
  );
  // Real revenue from analytics
  const { data: todayAnalytics, refetch: refetchAnalytics } = useFetch<AnalyticsData>(
    activeStoreId ? `/api/salon/analytics?storeId=${activeStoreId}&from=${today}&to=${today}` : null
  );

  const filteredInventory = useMemo(() => {
    if (!inventory) return [];
    if (inventoryFilter === 'low') return inventory.filter(i => i.quantity > 0 && i.isLow);
    if (inventoryFilter === 'out') return inventory.filter(i => i.quantity === 0);
    return inventory;
  }, [inventory, inventoryFilter]);

  const lowStockCount = useMemo(() => (inventory || []).filter(i => i.isLow).length, [inventory]);
  const presentCount = useMemo(() => (attendance || []).filter(a => a.status === 'PRESENT' || a.status === 'HALF_DAY').length, [attendance]);
  const todayRevenue = todayAnalytics?.totalRevenue || 0;
  const todayTxCount = todayAnalytics?.totalTransactions || 0;

  const handleCheckIn = useCallback(async (empId: string) => {
    if (!activeStoreId) return;
    try {
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      await apiPost('/api/salon/attendance', { employeeId: empId, storeId: activeStoreId, date: today, checkIn: timeStr, status: 'PRESENT' });
      toast.success(`${(attendance?.find(a => a.employeeId === empId)?.employee?.name || 'Employee')} checked in successfully`);
      refetchAtt();
    } catch (e) {
      toast.error('Check-in failed', { description: (e as Error).message });
    }
  }, [activeStoreId, today, refetchAtt, attendance]);

  const handleCheckOut = useCallback(async (attRecord: AttendanceRecord) => {
    try {
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      await apiPost('/api/salon/attendance', { employeeId: attRecord.employeeId, storeId: attRecord.storeId, date: today, checkOut: timeStr });
      toast.success(`${attRecord.employee.name} checked out successfully`);
      refetchAtt();
    } catch (e) {
      toast.error('Check-out failed', { description: (e as Error).message });
    }
  }, [today, refetchAtt]);

  const handleRestock = useCallback(async (invItem: InventoryItem) => {
    try {
      await apiPatch(`/api/salon/inventory/${invItem.id}`, { quantity: invItem.reorderLevel * 2 });
      toast.success(`Restocked ${invItem.product.name} to ${invItem.reorderLevel * 2} units`);
      refetchInv();
    } catch (e) {
      toast.error('Restock failed', { description: (e as Error).message });
    }
  }, [refetchInv]);

  const handleConfirmAppointment = useCallback(async (aptId: string) => {
    try {
      await apiPatch(`/api/salon/appointments/${aptId}`, { status: 'CONFIRMED' });
      toast.success('Appointment confirmed');
      refetchAppts();
    } catch (e) {
      toast.error('Action failed', { description: (e as Error).message });
    }
  }, [refetchAppts]);

  const handleUpdateAppointmentStatus = useCallback(async (aptId: string, newStatus: string, toastMsg: string) => {
    try {
      await apiPatch(`/api/salon/appointments/${aptId}`, { status: newStatus });
      toast.success(toastMsg);
      refetchAppts();
    } catch (e) {
      toast.error('Action failed', { description: (e as Error).message });
    }
  }, [refetchAppts]);

  const selectedStoreData = stores?.find(s => s.id === activeStoreId);

  if (storesLoading) return <ViewSkeleton />;

  return (
    <div className="space-y-6">
      {/* Store Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          {authUser ? (
            <>
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <span className="w-1 h-5 rounded-full bg-gradient-to-b from-rose-500 to-pink-500" />
                Managing {authUser.storeName}
              </h2>
              <p className="text-sm text-muted-foreground">Welcome, {authUser.name}! 👋</p>
            </>
          ) : (
            <>
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <span className="w-1 h-5 rounded-full bg-gradient-to-b from-rose-500 to-pink-500" />
                Manage Store
              </h2>
              <p className="text-sm text-muted-foreground">{selectedStoreData?.name || 'Select a store'}</p>
            </>
          )}
        </div>
        {!authUser && (
          <Select value={activeStoreId} onValueChange={setManagerStoreId}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Select store" />
            </SelectTrigger>
            <SelectContent>
              {(stores || []).map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={DollarSign} label="Today's Revenue" value={formatCurrency(todayRevenue)} sub={`${todayTxCount} completed transactions`} gradient="bg-gradient-to-r from-rose-500 to-pink-500" />
        <StatCard icon={Calendar} label="Appointments" value={String((appointments || []).length)} sub={`${(appointments || []).filter(a => a.status === 'PENDING').length} pending`} gradient="bg-gradient-to-r from-blue-500 to-indigo-500" />
        <StatCard icon={Users} label="Staff Present" value={`${presentCount}/${(attendance || []).length || '-'}`} sub="Checked in today" gradient="bg-gradient-to-r from-emerald-500 to-green-500" />
        <StatCard icon={AlertTriangle} label="Low Stock Alerts" value={String(lowStockCount)} sub="Items need restocking" gradient="bg-gradient-to-r from-amber-500 to-orange-500" />
      </div>

      {/* Today vs Yesterday Comparison */}
      <TodayVsYesterdayComparison storeId={activeStoreId} />

      {/* Staff Attendance */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Staff Attendance</CardTitle>
            <Badge variant="secondary">{format(new Date(), 'MMM d, yyyy')}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {attLoading ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}</div>
          ) : attError ? (
            <ErrorCard message="Failed to load attendance" onRetry={refetchAtt} />
          ) : !attendance || attendance.length === 0 ? (
            <EmptyState icon={Users} title="No attendance records" description="No staff check-ins recorded today" />
          ) : (
            <div className="space-y-2">
              {attendance.map((rec) => {
                const isCheckedIn = !!rec.checkIn;
                const isCheckedOut = !!rec.checkOut;
                return (
                  <div key={rec.id} className="flex items-center gap-3 p-3 rounded-xl border hover:shadow-sm transition-shadow">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="text-xs font-medium bg-gray-100 dark:bg-gray-800">{getInitials(rec.employee.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{rec.employee.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-[10px] px-1.5">{rec.employee.role}</Badge>
                        {isCheckedIn && <span>In: {rec.checkIn}</span>}
                        {isCheckedOut && <span>Out: {rec.checkOut}</span>}
                      </div>
                    </div>
                    <StatusBadge status={rec.status} />
                    {!isCheckedIn && (
                      <Button size="sm" variant="outline" onClick={() => handleCheckIn(rec.employeeId)} className="text-xs h-8">
                        <LogIn className="w-3.5 h-3.5 mr-1" /> Check In
                      </Button>
                    )}
                    {isCheckedIn && !isCheckedOut && (
                      <Button size="sm" variant="outline" onClick={() => handleCheckOut(rec)} className="text-xs h-8">
                        <LogOut className="w-3.5 h-3.5 mr-1" /> Check Out
                      </Button>
                    )}
                    {isCheckedIn && isCheckedOut && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Appointments */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Today&apos;s Appointments</CardTitle>
            <Button size="sm" onClick={() => setNewApptDialogOpen(true)} className="bg-rose-500 hover:bg-rose-600 text-xs h-8">
              <Plus className="w-3.5 h-3.5 mr-1" /> New Appointment
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {apptsLoading ? <ViewSkeleton /> : apptsError ? <ErrorCard message="Failed to load appointments" onRetry={refetchAppts} /> :
          !appointments || appointments.length === 0 ? (
            <EmptyState icon={Calendar} title="No appointments today" description="No appointments scheduled for this store" />
          ) : (
            <div className="overflow-x-auto rounded-xl">
              <Table>
                <TableHeader>
                  <TableRow className="sticky top-0 bg-background">
                    <TableHead>Time</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Stylist</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appointments.sort((a, b) => a.time.localeCompare(b.time)).map((apt) => (
                    <TableRow key={apt.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-medium">{formatTime(apt.time)}</TableCell>
                      <TableCell>{apt.customer?.name || 'N/A'}</TableCell>
                      <TableCell><span className="text-sm">{apt.service?.name}</span></TableCell>
                      <TableCell>{apt.employee?.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <StatusBadge status={apt.status} />
                          {apt.status === 'PENDING' && (
                            <>
                              <Button size="sm" className="h-6 text-xs px-2 bg-emerald-500 hover:bg-emerald-600 text-white"
                                onClick={() => handleUpdateAppointmentStatus(apt.id, 'CONFIRMED', 'Appointment confirmed')}>Confirm</Button>
                              <Button size="sm" className="h-6 text-xs px-2 bg-red-500 hover:bg-red-600 text-white"
                                onClick={() => handleUpdateAppointmentStatus(apt.id, 'CANCELLED', 'Appointment cancelled')}>Cancel</Button>
                            </>
                          )}
                          {apt.status === 'CONFIRMED' && (
                            <Button size="sm" className="h-6 text-xs px-2 bg-blue-500 hover:bg-blue-600 text-white"
                              onClick={() => handleUpdateAppointmentStatus(apt.id, 'IN_PROGRESS', 'Service started')}>Start</Button>
                          )}
                          {apt.status === 'IN_PROGRESS' && (
                            <Button size="sm" className="h-6 text-xs px-2 bg-emerald-500 hover:bg-emerald-600 text-white"
                              onClick={() => handleUpdateAppointmentStatus(apt.id, 'COMPLETED', 'Service completed')}>Complete</Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium text-rose-600 dark:text-rose-400">
                        {formatCurrency(apt.service?.price || 0)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Inventory */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Inventory</CardTitle>
            <div className="flex gap-1.5">
              {(['all', 'low', 'out'] as const).map((f) => (
                <Button key={f} size="sm" variant={inventoryFilter === f ? 'default' : 'outline'}
                  onClick={() => setInventoryFilter(f)}
                  className={inventoryFilter === f ? 'bg-rose-500 hover:bg-rose-600 text-xs h-7' : 'text-xs h-7'}>
                  {f === 'all' ? 'All' : f === 'low' ? `Low Stock (${lowStockCount})` : 'Out of Stock'}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {invLoading ? <ViewSkeleton /> : invError ? <ErrorCard message="Failed to load inventory" onRetry={refetchInv} /> :
          filteredInventory.length === 0 ? (
            <EmptyState icon={Package} title="No inventory items" description="No items match the current filter" />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredInventory.map((item) => (
                <div key={item.id} className="hover:scale-[1.01] transition-transform duration-150">
                  <Card className={`overflow-hidden border transition-shadow hover:shadow-md ${item.isLow ? 'border-amber-200 dark:border-amber-800' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{item.product.name}</p>
                          <p className="text-xs text-muted-foreground">{item.product.category} &bull; {item.product.unit}</p>
                        </div>
                        <StockIndicator quantity={item.quantity} reorderLevel={item.reorderLevel} />
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Quantity</span>
                          <span className="font-medium">{item.quantity} / {item.reorderLevel}</span>
                        </div>
                        <Progress value={Math.min((item.quantity / (item.reorderLevel * 2)) * 100, 100)}
                          className={`h-2 ${item.isLow ? '[&>div]:bg-amber-500' : '[&>div]:bg-emerald-500'}`} />
                      </div>
                      {item.isLow && (
                        <Button size="sm" variant="outline" className="w-full mt-3 h-8 text-xs"
                          onClick={() => handleRestock(item)}>
                          <RefreshCw className="w-3 h-3 mr-1" /> Restock to {item.reorderLevel * 2}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Appointment Dialog */}
      <ManagerNewApptDialog
        open={newApptDialogOpen}
        onClose={() => setNewApptDialogOpen(false)}
        storeId={activeStoreId}
        onSuccess={() => { refetchAppts(); setNewApptDialogOpen(false); }}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MANAGER NEW APPOINTMENT DIALOG
// ═══════════════════════════════════════════════════════════════════
function ManagerNewApptDialog({ open, onClose, storeId, onSuccess }: {
  open: boolean;
  onClose: () => void;
  storeId: string;
  onSuccess: () => void;
}) {
  const [apptPhone, setApptPhone] = useState('');
  const [apptName, setApptName] = useState('');
  const [apptEmployeeId, setApptEmployeeId] = useState('');
  const [apptServiceId, setApptServiceId] = useState('');
  const [apptDate, setApptDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [apptTime, setApptTime] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const todayMin = format(new Date(), 'yyyy-MM-dd');

  const { data: customers } = useFetch<Customer[]>('/api/salon/customers');
  const { data: employees } = useFetch<Employee[]>(storeId ? `/api/salon/employees?storeId=${storeId}` : null);
  const { data: services } = useFetch<Service[]>('/api/salon/services');

  const filteredCustomers = useMemo(() => {
    if (!apptPhone.trim()) return [];
    return (customers || []).filter(c => c.phone.includes(apptPhone) || c.name.toLowerCase().includes(apptPhone.toLowerCase())).slice(0, 5);
  }, [customers, apptPhone]);

  const selectedCustomer = useMemo(() => {
    if (!apptPhone.trim()) return null;
    return (customers || []).find(c => c.phone === apptPhone);
  }, [customers, apptPhone]);

  useEffect(() => {
    if (selectedCustomer) setApptName(selectedCustomer.name);
  }, [selectedCustomer]);

  const handleCreate = useCallback(async () => {
    if (!apptEmployeeId || !apptServiceId || !apptTime || !apptName.trim() || !apptPhone.trim()) return;
    setSubmitting(true);
    try {
      await apiPost('/api/salon/appointments/create', {
        customerName: apptName,
        customerPhone: apptPhone,
        storeId,
        employeeId: apptEmployeeId,
        serviceId: apptServiceId,
        date: apptDate,
        time: apptTime,
      });
      toast.success('Appointment created successfully');
      onSuccess();
    } catch (e) {
      toast.error('Failed to create appointment', { description: (e as Error).message });
    } finally {
      setSubmitting(false);
    }
  }, [apptName, apptPhone, storeId, apptEmployeeId, apptServiceId, apptDate, apptTime, onSuccess]);

  const canSubmit = apptName.trim().length > 0 && apptPhone.trim().length >= 10 && !!apptEmployeeId && !!apptServiceId && !!apptTime;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Appointment</DialogTitle>
          <DialogDescription>Quickly create a new appointment for this store</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* Customer */}
          <div className="space-y-1.5">
            <Label className="text-xs">Customer Phone</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">+91</span>
              <Input placeholder="Search by phone..." value={apptPhone}
                onChange={e => setApptPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="pl-12 h-9" />
            </div>
            {filteredCustomers.length > 0 && !selectedCustomer && (
              <div className="border rounded-lg overflow-hidden">
                {filteredCustomers.map(c => (
                  <button key={c.id} onClick={() => setApptPhone(c.phone)}
                    className="w-full text-left px-3 py-2 hover:bg-muted/50 text-xs flex justify-between transition-colors">
                    <span>{c.name}</span><span className="text-muted-foreground">{c.phone}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Customer Name</Label>
            <Input value={apptName} onChange={e => setApptName(e.target.value)} placeholder="Full name" className="h-9" />
          </div>
          {/* Employee */}
          <div className="space-y-1.5">
            <Label className="text-xs">Employee</Label>
            <Select value={apptEmployeeId} onValueChange={setApptEmployeeId}>
              <SelectTrigger className="h-9"><SelectValue placeholder="Select employee" /></SelectTrigger>
              <SelectContent>
                {(employees || []).map(emp => <SelectItem key={emp.id} value={emp.id}>{emp.name} — {emp.role}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {/* Service */}
          <div className="space-y-1.5">
            <Label className="text-xs">Service</Label>
            <Select value={apptServiceId} onValueChange={setApptServiceId}>
              <SelectTrigger className="h-9"><SelectValue placeholder="Select service" /></SelectTrigger>
              <SelectContent>
                {(services || []).map(s => <SelectItem key={s.id} value={s.id}>{s.name} — {formatCurrency(s.price)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {/* Date + Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Date</Label>
              <Input type="date" value={apptDate} onChange={e => setApptDate(e.target.value)} className="h-9" min={todayMin} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Time</Label>
              <Select value={apptTime} onValueChange={setApptTime}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Time slot" /></SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.map(slot => <SelectItem key={slot} value={slot}>{formatTime(slot)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleCreate} disabled={!canSubmit || submitting}
            className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 shadow-md shadow-rose-500/20">
            {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── STORE COMPARISON DASHBOARD ──────────────────────────────
// ═══════════════════════════════════════════════════════════════════
// EARNINGS GOAL TRACKER
// ═══════════════════════════════════════════════════════════════════
function EarningsGoalTracker({ currentEarnings, employeeRole }: { currentEarnings: number; employeeRole: string }) {
  const target = employeeRole === 'MANAGER' ? 50000 : 20000;
  const percentage = Math.min((currentEarnings / target) * 100, 100);
  const isOnTrack = percentage >= 50;
  const isWarning = percentage >= 25 && percentage < 50;
  const isCritical = percentage < 25;

  const statusColor = isOnTrack ? 'text-emerald-600 dark:text-emerald-400' : isWarning ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400';
  const ringColor = isOnTrack ? '#10b981' : isWarning ? '#f59e0b' : '#ef4444';
  const statusLabel = isOnTrack ? 'On Track' : isWarning ? 'Keep Going' : 'Needs Attention';
  const statusBg = isOnTrack ? 'bg-emerald-100 dark:bg-emerald-900/40' : isWarning ? 'bg-amber-100 dark:bg-amber-900/40' : 'bg-red-100 dark:bg-red-900/40';

  // SVG ring parameters
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;

  return (
    <Card className="shadow-sm hover:shadow-md transition-all duration-200 border-l-4 border-l-rose-500">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* SVG Progress Ring */}
            <div className="relative w-24 h-24 shrink-0">
              <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r={radius} fill="none" stroke="currentColor" className="text-muted/30 dark:text-muted/20" strokeWidth="8" />
                <motion.circle
                  cx="50" cy="50" r={radius} fill="none"
                  stroke={ringColor}
                  strokeWidth="8" strokeLinecap="round"
                  initial={{ strokeDasharray: `0 ${circumference}` }}
                  animate={{ strokeDasharray }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-lg font-bold ${statusColor}`}>{Math.round(percentage)}%</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-sm font-semibold flex items-center gap-1.5">
                <CircleDot className="w-4 h-4 text-rose-500" />
                Monthly Target
              </h3>
              <p className="text-xs text-muted-foreground">
                You&apos;ve earned <span className="font-semibold text-foreground">{formatCurrency(currentEarnings)}</span> of <span className="font-semibold text-foreground">{formatCurrency(target)}</span> target
              </p>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusBg} ${statusColor}`}>
                {statusLabel}
              </span>
            </div>
          </div>

          <div className="text-right shrink-0 hidden sm:block">
            <p className="text-xs text-muted-foreground">Target</p>
            <p className="text-sm font-bold">{formatCurrency(target)}</p>
            <p className="text-xs text-muted-foreground mt-1">Remaining</p>
            <p className={`text-sm font-bold ${statusColor}`}>{formatCurrency(Math.max(0, target - currentEarnings))}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════
// EXPENSE CATEGORY BADGE
// ═══════════════════════════════════════════════════════════════════
function ExpenseCategoryBadge({ category }: { category: string }) {
  const config = EXPENSE_CATEGORY_CONFIG[category] || EXPENSE_CATEGORY_CONFIG.OTHER;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${config.bg} ${config.color}`}>
      {category.charAt(0) + category.slice(1).toLowerCase()}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════
// KPI DASHBOARD
// ═══════════════════════════════════════════════════════════════════
function KPIDashboard({ monthAnalytics }: { monthAnalytics: AnalyticsData | null }) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
  const { data: monthExpenses } = useFetch<Expense[]>(`/api/salon/expenses?from=${monthStart}&to=${today}`);

  const totalExpenses = useMemo(() => (monthExpenses || []).reduce((s, e) => s + e.amount, 0), [monthExpenses]);
  const ownerShare = monthAnalytics?.totalOwnerShare || 0;
  const netProfit = ownerShare - totalExpenses;

  const avgTicketSize = useMemo(() => {
    if (!monthAnalytics || monthAnalytics.totalTransactions === 0) return 0;
    return monthAnalytics.totalRevenue / monthAnalytics.totalTransactions;
  }, [monthAnalytics]);

  const topService = useMemo(() => {
    if (!monthAnalytics?.servicePopularity?.length) return null;
    return monthAnalytics.servicePopularity.reduce((top, s) => s.count > top.count ? s : top, monthAnalytics.servicePopularity[0]);
  }, [monthAnalytics]);

  const busiestStore = useMemo(() => {
    if (!monthAnalytics?.employeePerformance?.length) return null;
    const storeMap: Record<string, { name: string; transactions: number }> = {};
    // We don't have store in performance data directly, so use the top employee's info
    const topEmp = monthAnalytics.employeePerformance.reduce((top, e) => e.transactions > top.transactions ? e : top, monthAnalytics.employeePerformance[0]);
    return { name: topEmp.employeeName, transactions: topEmp.transactions };
  }, [monthAnalytics]);

  const kpis = [
    {
      icon: Wallet, label: 'Net Profit', value: formatCurrency(netProfit),
      sub: `Revenue ${formatCurrency(ownerShare)} − Expenses ${formatCurrency(totalExpenses)}`,
      color: netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400',
      borderColor: 'border-l-emerald-500', ringColor: 'bg-emerald-100 dark:bg-emerald-900/30',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      icon: IndianRupee, label: 'Avg Ticket Size', value: formatCurrency(avgTicketSize),
      sub: `${monthAnalytics?.totalTransactions || 0} total transactions`,
      color: 'text-blue-600 dark:text-blue-400', borderColor: 'border-l-blue-500',
      ringColor: 'bg-blue-100 dark:bg-blue-900/30', iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      icon: Flame, label: 'Top Service', value: topService?.serviceName || '—',
      sub: topService ? `${topService.count} bookings · ${formatCurrency(topService.revenue)}` : 'No data yet',
      color: 'text-amber-600 dark:text-amber-400', borderColor: 'border-l-amber-500',
      ringColor: 'bg-amber-100 dark:bg-amber-900/30', iconColor: 'text-amber-600 dark:text-amber-400',
    },
    {
      icon: Store, label: 'Busiest Performer', value: busiestStore?.name || '—',
      sub: busiestStore ? `${busiestStore.transactions} services this month` : 'No data yet',
      color: 'text-violet-600 dark:text-violet-400', borderColor: 'border-l-violet-500',
      ringColor: 'bg-violet-100 dark:bg-violet-900/30', iconColor: 'text-violet-600 dark:text-violet-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi) => (
        <div key={kpi.label} className="hover:-translate-y-0.5 transition-transform duration-150">
          <Card className={`shadow-sm hover:shadow-md transition-all duration-200 border-l-4 ${kpi.borderColor}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{kpi.label}</p>
                  <p className={`text-lg font-bold ${kpi.color}`}>{kpi.value}</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{kpi.sub}</p>
                </div>
                <div className={`w-9 h-9 rounded-xl ${kpi.ringColor} flex items-center justify-center shrink-0`}>
                  <kpi.icon className={`w-4 h-4 ${kpi.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// EXPENSE TRACKER
// ═══════════════════════════════════════════════════════════════════
function ExpenseTracker({ monthAnalytics }: { monthAnalytics: AnalyticsData | null }) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
  const { data: expenses, loading: expLoading, refetch: refetchExpenses } = useFetch<Expense[]>(`/api/salon/expenses?from=${monthStart}&to=${today}`);
  const { data: stores } = useFetch<Store[]>('/api/salon/stores');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [expStoreId, setExpStoreId] = useState('');
  const [expCategory, setExpCategory] = useState('');
  const [expDesc, setExpDesc] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expDate, setExpDate] = useState(today);
  const [submitting, setSubmitting] = useState(false);

  const totalExpenses = useMemo(() => (expenses || []).reduce((s, e) => s + e.amount, 0), [expenses]);
  const rentExpenses = useMemo(() => (expenses || []).filter(e => e.category === 'RENT').reduce((s, e) => s + e.amount, 0), [expenses]);
  const salaryExpenses = useMemo(() => (expenses || []).filter(e => e.category === 'SALARY').reduce((s, e) => s + e.amount, 0), [expenses]);
  const suppliesExpenses = useMemo(() => (expenses || []).filter(e => e.category === 'SUPPLIES').reduce((s, e) => s + e.amount, 0), [expenses]);

  const categoryChartData = useMemo(() => {
    if (!expenses || expenses.length === 0) return [];
    const map: Record<string, number> = {};
    for (const e of expenses) {
      map[e.category] = (map[e.category] || 0) + e.amount;
    }
    return Object.entries(map)
      .map(([cat, amt]) => ({
        category: cat.charAt(0) + cat.slice(1).toLowerCase(),
        amount: amt,
        fill: EXPENSE_CATEGORY_CONFIG[cat]?.bg.includes('amber') ? '#f59e0b'
          : EXPENSE_CATEGORY_CONFIG[cat]?.bg.includes('blue') ? '#3b82f6'
          : EXPENSE_CATEGORY_CONFIG[cat]?.bg.includes('emerald') ? '#10b981'
          : EXPENSE_CATEGORY_CONFIG[cat]?.bg.includes('violet') ? '#8b5cf6'
          : EXPENSE_CATEGORY_CONFIG[cat]?.bg.includes('orange') ? '#f97316'
          : EXPENSE_CATEGORY_CONFIG[cat]?.bg.includes('pink') ? '#ec4899'
          : '#6b7280',
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [expenses]);

  const overviewCards = [
    { label: 'Total Expenses', value: totalExpenses, icon: Receipt, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30', pct: 100 },
    { label: 'Rent', value: rentExpenses, icon: Building2, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30', pct: totalExpenses > 0 ? Math.round((rentExpenses / totalExpenses) * 100) : 0 },
    { label: 'Salaries', value: salaryExpenses, icon: Users, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30', pct: totalExpenses > 0 ? Math.round((salaryExpenses / totalExpenses) * 100) : 0 },
    { label: 'Supplies', value: suppliesExpenses, icon: Package, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-100 dark:bg-violet-900/30', pct: totalExpenses > 0 ? Math.round((suppliesExpenses / totalExpenses) * 100) : 0 },
  ];

  const handleAddExpense = useCallback(async () => {
    if (!expStoreId || !expCategory || !expDesc || !expAmount || !expDate) return;
    setSubmitting(true);
    try {
      await apiPost('/api/salon/expenses', { storeId: expStoreId, category: expCategory, description: expDesc, amount: parseFloat(expAmount), expenseDate: expDate });
      toast.success('Expense added successfully');
      setDialogOpen(false);
      setExpStoreId('');
      setExpCategory('');
      setExpDesc('');
      setExpAmount('');
      setExpDate(today);
      refetchExpenses();
    } catch (e) {
      toast.error('Failed to add expense', { description: (e as Error).message });
    } finally {
      setSubmitting(false);
    }
  }, [expStoreId, expCategory, expDesc, expAmount, expDate, today, refetchExpenses]);

  return (
    <>
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <span className="w-1 h-5 rounded-full bg-gradient-to-b from-rose-500 to-pink-500" />
                Expense Tracker
              </h2>
              <p className="text-sm text-muted-foreground ml-3">Track and manage salon operating costs</p>
            </div>
            <Button size="sm" onClick={() => setDialogOpen(true)}
              className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 shadow-md shadow-rose-500/20">
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Expense
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Expense Overview Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {overviewCards.map((card) => (
              <div key={card.label} className="hover:-translate-y-0.5 transition-transform duration-150">
                <div className="rounded-xl border p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center`}>
                      <card.icon className={`w-4 h-4 ${card.color}`} />
                    </div>
                    {card.label !== 'Total Expenses' && (
                      <span className="text-[10px] font-medium text-muted-foreground">{card.pct}%</span>
                    )}
                  </div>
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{card.label}</p>
                  <p className={`text-base font-bold mt-0.5 ${card.color}`}>{formatCurrency(card.value)}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Expense Breakdown Chart */}
          {categoryChartData.length > 0 && (
            <div className="rounded-xl border p-4">
              <h3 className="text-sm font-medium mb-3">Expense Breakdown by Category</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={categoryChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`} />
                  <RTooltip formatter={(v: number) => formatCurrency(v)} />
                  <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                    {categoryChartData.map((entry, idx) => (
                      <rect key={idx} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Net summary */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Total Monthly Expenses:</span>
            <span className="font-bold text-red-600 dark:text-red-400">{formatCurrency(totalExpenses)}</span>
            {monthAnalytics && (
              <span className="text-muted-foreground ml-auto">
                Net Owner: {formatCurrency(monthAnalytics.totalOwnerShare - totalExpenses)}
              </span>
            )}
          </div>

          {/* Recent Expenses Table */}
          {expLoading ? (
            <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}</div>
          ) : !expenses || expenses.length === 0 ? (
            <EmptyState icon={Receipt} title="No expenses recorded" description="Track your salon expenses to manage profitability" />
          ) : (
            <div className="overflow-x-auto rounded-xl">
              <Table>
                <TableHeader>
                  <TableRow className="sticky top-0 bg-background">
                    <TableHead>Date</TableHead>
                    <TableHead>Store</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="hidden sm:table-cell">Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.slice(0, 10).map((exp, idx) => (
                    <TableRow key={exp.id} className={`hover:bg-muted/50 transition-colors ${idx % 2 === 0 ? '' : 'bg-muted/20'}`}>
                      <TableCell className="text-xs whitespace-nowrap">{format(new Date(exp.expenseDate), 'MMM d')}</TableCell>
                      <TableCell className="text-xs font-medium">{exp.store?.name?.replace('Dream Look - ', '')}</TableCell>
                      <TableCell><ExpenseCategoryBadge category={exp.category} /></TableCell>
                      <TableCell className="text-xs text-muted-foreground hidden sm:table-cell max-w-[200px] truncate">{exp.description}</TableCell>
                      <TableCell className="text-right text-sm font-medium text-red-600 dark:text-red-400">{formatCurrency(exp.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={4} className="font-semibold text-xs">Total</TableCell>
                    <TableCell className="text-right font-bold text-red-600 dark:text-red-400">{formatCurrency(totalExpenses)}</TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Receipt className="w-4 h-4 text-rose-500" /> Add Expense</DialogTitle>
            <DialogDescription>Record a new expense for your salon</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Store</Label>
              <Select value={expStoreId} onValueChange={setExpStoreId}>
                <SelectTrigger><SelectValue placeholder="Select store" /></SelectTrigger>
                <SelectContent>
                  {(stores || []).map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Category</Label>
              <Select value={expCategory} onValueChange={setExpCategory}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Description</Label>
              <Input placeholder="e.g., Monthly electricity bill" value={expDesc} onChange={e => setExpDesc(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Amount (₹)</Label>
                <Input type="number" placeholder="0" value={expAmount} onChange={e => setExpAmount(e.target.value)} min="0" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Date</Label>
                <Input type="date" value={expDate} onChange={e => setExpDate(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddExpense} disabled={submitting || !expStoreId || !expCategory || !expDesc || !expAmount}
              className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 shadow-md shadow-rose-500/20">
              {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />}
              Add Expense
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════
// STORE COMPARISON
// ═══════════════════════════════════════════════════════════════════
function StoreComparisonDashboard({ onSelectStore }: { onSelectStore?: (storeId: string) => void }) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const monthAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');

  const { data: stores } = useFetch<Store[]>('/api/salon/stores');
  const storeIds = (stores || []).map(s => s.id);

  const { data: koramangala } = useFetch<AnalyticsData>(
    storeIds[0] ? `/api/salon/analytics?storeId=${storeIds[0]}&from=${monthAgo}&to=${today}` : null
  );
  const { data: mgRoad } = useFetch<AnalyticsData>(
    storeIds[1] ? `/api/salon/analytics?storeId=${storeIds[1]}&from=${monthAgo}&to=${today}` : null
  );
  const { data: whitefield } = useFetch<AnalyticsData>(
    storeIds[2] ? `/api/salon/analytics?storeId=${storeIds[2]}&from=${monthAgo}&to=${today}` : null
  );

  const storeAnalytics = [
    { store: stores?.[0], data: koramangala, gradient: STORE_GRADIENT_LIGHT[0], gradientDark: STORE_GRADIENTS[0] },
    { store: stores?.[1], data: mgRoad, gradient: STORE_GRADIENT_LIGHT[1], gradientDark: STORE_GRADIENTS[1] },
    { store: stores?.[2], data: whitefield, gradient: STORE_GRADIENT_LIGHT[2], gradientDark: STORE_GRADIENTS[2] },
  ];

  const maxRevenue = Math.max(...storeAnalytics.map(s => s.data?.totalRevenue || 0), 1);

  const topStore = storeAnalytics.reduce((best, cur) =>
    (cur.data?.totalRevenue || 0) > (best.data?.totalRevenue || 0) ? cur : best,
    storeAnalytics[0]
  );
  const topStoreId = topStore?.store?.id;

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-violet-500" />
            <CardTitle className="text-base">Store Comparison</CardTitle>
            <Badge variant="secondary" className="text-[10px]">This Month</Badge>
          </div>
          {topStore && topStore.data && topStore.data.totalRevenue > 0 && (
            <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-medium">
              <Trophy className="w-3.5 h-3.5" />
              Top: {topStore.store?.name}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {storeAnalytics.map((s, i) => {
            const rev = s.data?.totalRevenue || 0;
            const tx = s.data?.totalTransactions || 0;
            const pct = maxRevenue > 0 ? (rev / maxRevenue) * 100 : 0;
            const isTop = s.store?.id === topStoreId && rev > 0;
            return (
              <div key={s.store?.id || i}
                onClick={() => onSelectStore?.(s.store?.id || '')}
                className={`group relative p-4 rounded-xl border transition-all hover:-translate-y-0.5 hover:shadow-md cursor-pointer ${isTop ? 'border-amber-300 dark:border-amber-700 bg-gradient-to-br from-amber-50/80 to-transparent dark:from-amber-950/20' : 'hover:border-rose-200 dark:hover:border-rose-800'}`}>
                {isTop && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm">
                    <Trophy className="w-3 h-3 text-white" />
                  </div>
                )}
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${s.gradientDark} flex items-center justify-center`}>
                    <Building2 className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold truncate max-w-[140px]">{s.store?.name || 'Store'}</p>
                    <p className="text-[10px] text-muted-foreground">{s.store?.city}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Revenue</span>
                    <span className="text-sm font-bold">{formatCurrency(rev)}</span>
                  </div>
                  <div className="h-2 bg-muted/50 dark:bg-muted/20 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className={`h-full rounded-full bg-gradient-to-r ${s.gradientDark}`}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{tx} transactions</span>
                    <span className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity text-rose-500 dark:text-rose-400 font-medium">
                      View Store <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════
// OWNER BRANCH DETAIL VIEW
// ═══════════════════════════════════════════════════════════════════
function OwnerBranchDetailView({ storeId, onBack }: { storeId: string; onBack: () => void }) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const monthAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');

  const { data: storeList } = useFetch<Store[]>('/api/salon/stores');
  const selectedStore = (storeList || []).find((s) => s.id === storeId);

  const { data: branchTodayAnalytics } = useFetch<AnalyticsData>(`/api/salon/analytics?storeId=${storeId}&from=${today}&to=${today}`);
  const { data: branchMonthAnalytics } = useFetch<AnalyticsData>(`/api/salon/analytics?storeId=${storeId}&from=${monthAgo}&to=${today}`);

  const { data: branchAppointments } = useFetch<Appointment[]>(`/api/salon/appointments?storeId=${storeId}&date=${today}`);
  const { data: branchEmployees } = useFetch<Employee[]>(`/api/salon/employees?storeId=${storeId}`);
  const { data: branchInventory } = useFetch<InventoryItem[]>(`/api/salon/inventory?storeId=${storeId}`);
  const { data: branchAttendance } = useFetch<AttendanceRecord[]>(`/api/salon/attendance?storeId=${storeId}&date=${today}`);

  const presentCount = (branchAttendance || []).filter(a => a.status === 'PRESENT' || a.status === 'HALF_DAY').length;
  const lowStockCount = (branchInventory || []).filter(i => i.isLow).length;
  const pendingAppts = (branchAppointments || []).filter(a => a.status === 'PENDING').length;
  const todayRev = branchTodayAnalytics?.totalRevenue || 0;
  const todayTx = branchTodayAnalytics?.totalTransactions || 0;
  const monthRev = branchMonthAnalytics?.totalRevenue || 0;

  const branchName = selectedStore?.name || 'Store';
  const branchCity = selectedStore?.city || '';
  const branchAddr = selectedStore?.address || '';

  return (
    <div className="space-y-6">
      {/* Back Button + Store Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={onBack} className="gap-1.5">
            <ChevronLeft className="w-4 h-4" /> All Stores
          </Button>
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              {branchName}
            </h2>
            <p className="text-sm text-muted-foreground ml-12">{branchCity} • {branchAddr}</p>
          </div>
        </div>
        <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
          <CircleDot className="w-3 h-3 mr-1" /> Active Branch
        </Badge>
      </div>

      {/* Branch Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={DollarSign} label="Today's Revenue" value={formatCurrency(todayRev)} sub={`${todayTx} transactions`} gradient="bg-gradient-to-r from-rose-500 to-pink-500" index={0} />
        <StatCard icon={Calendar} label="Appointments" value={String((branchAppointments || []).length)} sub={`${pendingAppts} pending`} gradient="bg-gradient-to-r from-violet-500 to-purple-500" index={1} />
        <StatCard icon={Users} label="Staff Present" value={`${presentCount}/${(branchAttendance || []).length || '-'}`} sub="Checked in today" gradient="bg-gradient-to-r from-emerald-500 to-green-500" index={2} />
        <StatCard icon={Package} label="Low Stock" value={String(lowStockCount)} sub={`of ${(branchInventory || []).length} items`} gradient="bg-gradient-to-r from-amber-500 to-orange-500" index={3} />
      </div>

      {/* Monthly Revenue Card */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Monthly Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-muted/50 dark:bg-muted/20 text-center">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Month Revenue</p>
              <p className="text-lg font-bold text-rose-600 dark:text-rose-400 mt-1">{formatCurrency(monthRev)}</p>
            </div>
            <div className="p-4 rounded-xl bg-muted/50 dark:bg-muted/20 text-center">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Month Transactions</p>
              <p className="text-lg font-bold mt-1">{branchMonthAnalytics?.totalTransactions || 0}</p>
            </div>
            <div className="p-4 rounded-xl bg-muted/50 dark:bg-muted/20 text-center">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Owner's Share</p>
              <p className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-1">{formatCurrency(branchMonthAnalytics?.totalOwnerShare || 0)}</p>
            </div>
            <div className="p-4 rounded-xl bg-muted/50 dark:bg-muted/20 text-center">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Product Costs</p>
              <p className="text-lg font-bold text-red-600 dark:text-red-400 mt-1">{formatCurrency(branchMonthAnalytics?.totalProductCost || 0)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Staff at this branch */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-violet-500" />
            <CardTitle className="text-base">Branch Staff</CardTitle>
            <Badge variant="secondary" className="text-[10px]">{(branchEmployees || []).length} members</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {(!branchEmployees || branchEmployees.length === 0) ? (
            <EmptyState icon={Users} title="No staff" description="No employees assigned to this branch" />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(branchEmployees || []).map((emp) => {
                const att = (branchAttendance || []).find(a => a.employeeId === emp.id);
                return (
                  <div key={emp.id} className="flex items-center gap-3 p-3 rounded-xl border hover:shadow-sm transition-shadow">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="text-xs font-medium bg-gradient-to-br from-rose-100 to-pink-100 dark:from-rose-950/40 dark:to-pink-950/40">
                        {getInitials(emp.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{emp.name}</p>
                      <p className="text-xs text-muted-foreground">{emp.role}</p>
                    </div>
                    {att && <StatusBadge status={att.status} />}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Today's Appointments */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-rose-500" />
              <CardTitle className="text-base">Today's Appointments</CardTitle>
              <Badge variant="secondary" className="text-[10px]">{format(new Date(), 'MMM d')}</Badge>
            </div>
            <span className="text-xs text-muted-foreground">{(branchAppointments || []).length} total</span>
          </div>
        </CardHeader>
        <CardContent>
          {(!branchAppointments || branchAppointments.length === 0) ? (
            <EmptyState icon={Calendar} title="No appointments today" description="No appointments scheduled for this branch today" />
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
              {branchAppointments.map((apt) => (
                <div key={apt.id} className="flex items-center gap-3 p-3 rounded-xl border hover:shadow-sm transition-shadow">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold truncate">{apt.customer?.name}</p>
                      <StatusBadge status={apt.status} />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <span>{apt.service?.name}</span>
                      <span>•</span>
                      <span>{formatTime(apt.time)}</span>
                      <span>•</span>
                      <span>{apt.employee?.name}</span>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-rose-600 dark:text-rose-400 shrink-0">
                    {formatCurrency(apt.service?.price || 0)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Inventory Overview */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-amber-500" />
              <CardTitle className="text-base">Inventory</CardTitle>
              {lowStockCount > 0 && (
                <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800 text-[10px]">
                  {lowStockCount} low stock
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {(!branchInventory || branchInventory.length === 0) ? (
            <EmptyState icon={Package} title="No inventory" description="No products tracked for this branch" />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto custom-scrollbar">
              {(branchInventory || []).map((inv) => (
                <div key={inv.id} className={`p-3 rounded-xl border transition-all ${inv.isLow ? 'border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/10' : ''}`}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium truncate">{inv.product.name}</p>
                    <StockIndicator quantity={inv.quantity} reorderLevel={inv.reorderLevel} />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-muted/50 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${inv.quantity === 0 ? 'bg-red-500' : inv.isLow ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{ width: `${Math.min(100, (inv.quantity / (inv.reorderLevel * 2)) * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">{inv.quantity} {inv.product.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// OWNER VIEW - OWNER PANEL
// ═══════════════════════════════════════════════════════════════════
function OwnerView() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const weekAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd');
  const monthAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
  const yearAgo = format(subDays(new Date(), 365), 'yyyy-MM-dd');

  // Branch drill-down state
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);

  // Analytics date range state
  const [analyticsRange, setAnalyticsRange] = useState<'today' | 'week' | 'month' | 'all'>('all');

  const analyticsFromDate = useMemo(() => {
    switch (analyticsRange) {
      case 'today': return today;
      case 'week': return weekAgo;
      case 'month': return monthAgo;
      case 'all': return yearAgo;
    }
  }, [analyticsRange, today, weekAgo, monthAgo, yearAgo]);

  const { data: todayAnalytics, loading: todayLoading } = useFetch<AnalyticsData>(`/api/salon/analytics?from=${today}&to=${today}`);
  const { data: weekAnalytics } = useFetch<AnalyticsData>(`/api/salon/analytics?from=${weekAgo}&to=${today}`);
  const { data: monthAnalytics } = useFetch<AnalyticsData>(`/api/salon/analytics?from=${monthAgo}&to=${today}`);
  const { data: yearAnalytics, loading: yearLoading } = useFetch<AnalyticsData>(`/api/salon/analytics?from=${yearAgo}&to=${today}`);

  // Chart analytics based on selected range
  const { data: chartAnalytics } = useFetch<AnalyticsData>(`/api/salon/analytics?from=${analyticsFromDate}&to=${today}`);

  const activeChartSource = chartAnalytics || yearAnalytics;

  // Settlement state
  const [settlementEmployee, setSettlementEmployee] = useState<string>('');
  const [settlementMonth, setSettlementMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [settlementLoading, setSettlementLoading] = useState(false);
  const [settlementData, setSettlementData] = useState<SettlementData | null>(null);

  const { data: employees } = useFetch<Employee[]>('/api/salon/employees');

  useEffect(() => {
    if (employees && employees.length > 0 && !settlementEmployee) {
      setSettlementEmployee(employees[0].id);
    }
  }, [employees, settlementEmployee]);

  const handleCalculateSettlement = useCallback(async () => {
    if (!settlementEmployee) return;
    setSettlementLoading(true);
    setSettlementData(null);
    try {
      const data = await fetch(`/api/salon/settlement?employeeId=${settlementEmployee}&month=${settlementMonth}`).then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      });
      setSettlementData(data);
      toast.success('Settlement calculated');
    } catch (e) {
      toast.error('Failed to calculate settlement', { description: (e as Error).message });
    } finally {
      setSettlementLoading(false);
    }
  }, [settlementEmployee, settlementMonth]);

  const handleExportCSV = useCallback(() => {
    if (!settlementData) return;
    const emp = settlementData.employee;
    const rows = [
      ['Date', 'Customer', 'Service', 'Price', 'Owner Share', 'Gross Commission', 'Products Used', 'Product Deduction', 'Net Earned'],
    ];
    for (const b of settlementData.breakdown) {
      const productsStr = b.productsUsed.map(p => `${p.name} (${p.qty} x ${p.qty > 0 ? formatCurrency(Math.round(p.cost / p.qty)) : '0'})`).join('; ');
      rows.push([
        b.date, b.customerName, b.serviceName, String(b.servicePrice),
        String(b.ownerShare), String(b.employeeGross),
        `"${productsStr}"`, String(b.productDeduction), String(b.employeeNet),
      ]);
    }
    const s = settlementData.summary;
    rows.push(['', '', 'TOTAL', String(s.totalRevenue), String(s.totalOwnerShare), String(s.totalGrossCommission), '', String(s.totalProductDeductions), String(s.totalNetPayout)]);
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `settlement_${emp.name.replace(/\s+/g, '_')}_${settlementMonth}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported successfully');
  }, [settlementData, settlementMonth]);

  const handleExportAnalyticsCSV = useCallback(() => {
    const a = activeChartSource;
    if (!a) return;
    const rows = [['Date', 'Revenue', 'Transactions']];
    for (const d of a.dailyRevenue) rows.push([d.date, String(d.revenue), String(d.transactions)]);
    rows.push(['', 'TOTAL', String(a.totalRevenue)]);
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const el = document.createElement('a');
    el.href = url;
    el.download = `analytics_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    el.click();
    URL.revokeObjectURL(url);
    toast.success('Analytics report exported');
  }, [activeChartSource]);

  const chartData = useMemo(() => {
    const source = activeChartSource;
    if (!source) return [];
    return source.dailyRevenue.map(d => ({
      date: format(new Date(d.date), 'MMM d'),
      revenue: d.revenue,
      transactions: d.transactions,
    }));
  }, [activeChartSource]);

  const serviceChartData = useMemo(() => {
    const source = activeChartSource;
    if (!source) return [];
    return source.servicePopularity.slice(0, 8).map(s => ({
      name: s.serviceName,
      count: s.count,
      revenue: s.revenue,
    }));
  }, [activeChartSource]);

  const animatedTodayRev = useAnimatedNumber(todayAnalytics?.totalRevenue || 0);
  const animatedWeekRev = useAnimatedNumber(weekAnalytics?.totalRevenue || 0);
  const animatedMonthRev = useAnimatedNumber(monthAnalytics?.totalRevenue || 0);
  const animatedYearRev = useAnimatedNumber(yearAnalytics?.totalRevenue || 0);

  if (todayLoading || yearLoading) return <ViewSkeleton />;

  // If a branch is selected, show branch detail view
  if (selectedBranchId) {
    return (
      <OwnerBranchDetailView
        storeId={selectedBranchId}
        onBack={() => setSelectedBranchId(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Revenue Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Zap} label="Today" value={formatCurrency(animatedTodayRev)} sub={`${todayAnalytics?.totalTransactions || 0} transactions`} gradient="bg-gradient-to-r from-rose-500 to-pink-500" />
        <StatCard icon={TrendingUp} label="This Week" value={formatCurrency(animatedWeekRev)} sub={`${weekAnalytics?.totalTransactions || 0} transactions`} gradient="bg-gradient-to-r from-blue-500 to-indigo-500" />
        <StatCard icon={Target} label="This Month" value={formatCurrency(animatedMonthRev)} sub={`${monthAnalytics?.totalTransactions || 0} transactions`} gradient="bg-gradient-to-r from-emerald-500 to-green-500" />
        <StatCard icon={Crown} label="This Year" value={formatCurrency(animatedYearRev)} sub={`${yearAnalytics?.totalTransactions || 0} transactions`} gradient="bg-gradient-to-r from-amber-500 to-orange-500" />
      </div>

      {/* KPI Dashboard */}
      <KPIDashboard monthAnalytics={monthAnalytics} />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Revenue Trend</CardTitle>
              <div className="flex items-center gap-1.5">
                <div className="flex gap-1 bg-muted/50 dark:bg-muted/20 rounded-lg p-0.5">
                  {([['today', 'Today'], ['week', 'Week'], ['month', 'Month'], ['all', 'All Time']] as const).map(([key, label]) => (
                    <button key={key} onClick={() => setAnalyticsRange(key)}
                      className={`px-2 py-1 text-[10px] font-medium rounded-md transition-all duration-200 ${
                        analyticsRange === key
                          ? 'bg-white dark:bg-gray-800 text-rose-600 dark:text-rose-400 shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}>
                      {label}
                    </button>
                  ))}
                </div>
                <Button size="sm" variant="ghost" onClick={handleExportAnalyticsCSV} className="h-7">
                  <Download className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <EmptyState icon={BarChart3} title="No data yet" description="Revenue data will appear as transactions are completed" />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => formatCurrency(v)} />
                  <RTooltip formatter={(v: number) => formatCurrency(v)} />
                  <Area type="monotone" dataKey="revenue" stroke="#f43f5e" fill="url(#revGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Service Popularity */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Service Popularity</CardTitle>
          </CardHeader>
          <CardContent>
            {serviceChartData.length === 0 ? (
              <EmptyState icon={Layers} title="No data yet" description="Service popularity data will appear over time" />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={serviceChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10 }} />
                  <RTooltip />
                  <Bar dataKey="count" fill="#f43f5e" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Store Comparison */}
      <StoreComparisonDashboard onSelectStore={(storeId) => setSelectedBranchId(storeId)} />

      {/* Expense Tracker */}
      <ExpenseTracker monthAnalytics={monthAnalytics} />

      {/* Staff Performance */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <span className="w-1 h-5 rounded-full bg-gradient-to-b from-rose-500 to-pink-500" />
            Staff Performance
          </h2>
          <CardDescription className="ml-3">Ranked by total revenue generated</CardDescription>
        </CardHeader>
        <CardContent>
          {!(yearAnalytics || monthAnalytics)?.employeePerformance?.length ? (
            <EmptyState icon={Users} title="No performance data" description="Data will appear as employees complete services" />
          ) : (
            <div className="overflow-x-auto rounded-xl">
              <Table>
                <TableHeader>
                  <TableRow className="sticky top-0 bg-background">
                    <TableHead className="w-8">#</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead className="text-right">Services</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Earnings</TableHead>
                    <TableHead className="text-right">Avg/Service</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(yearAnalytics || monthAnalytics)!.employeePerformance.map((emp, i) => (
                    <TableRow key={emp.employeeId} className="hover:bg-muted/50 transition-colors">
                      <TableCell>
                        {i === 0 ? <Crown className="w-4 h-4 text-amber-500" /> : <span className="text-muted-foreground text-sm">{i + 1}</span>}
                      </TableCell>
                      <TableCell className="font-medium">{emp.employeeName}</TableCell>
                      <TableCell className="text-right">{emp.transactions}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(emp.totalRevenue)}</TableCell>
                      <TableCell className={`text-right font-medium ${emp.totalEarnings >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        {formatCurrency(emp.totalEarnings)}
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(emp.avgPerTransaction)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── SETTLEMENT ENGINE ────────────────────────────────── */}
      <Card className="overflow-hidden shadow-sm">
        <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 p-5 text-white">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-5 h-5" />
            <h3 className="flex items-center gap-2 text-lg font-bold">
              <span className="w-1 h-5 rounded-full bg-gradient-to-b from-violet-500 to-purple-500" />
              Settlement Engine
            </h3>
          </div>
          <p className="text-sm text-white/80">Calculate monthly employee commission settlements from real transaction data</p>
        </div>
        <CardContent className="p-5 space-y-5">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={settlementEmployee} onValueChange={setSettlementEmployee}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                {(employees || []).map(emp => <SelectItem key={emp.id} value={emp.id}>{emp.name} — {emp.role}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="month" value={settlementMonth} onChange={e => setSettlementMonth(e.target.value)}
              className="w-full sm:w-[180px]" />
            <Button onClick={handleCalculateSettlement} disabled={settlementLoading}
              className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 shadow-md shadow-violet-500/20">
              {settlementLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowUpDown className="w-4 h-4 mr-1.5" />}
              Calculate
            </Button>
          </div>

          {/* Results */}
          {settlementData && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {/* Summary Card */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { label: 'Services', value: String(settlementData.summary.totalServices), color: 'text-blue-600 dark:text-blue-400' },
                  { label: 'Revenue', value: formatCurrency(settlementData.summary.totalRevenue), color: 'text-rose-600 dark:text-rose-400' },
                  { label: "Owner's Share", value: formatCurrency(settlementData.summary.totalOwnerShare), color: 'text-amber-600 dark:text-amber-400' },
                  { label: 'Gross Commission', value: formatCurrency(settlementData.summary.totalGrossCommission), color: 'text-indigo-600 dark:text-indigo-400' },
                  { label: 'Product Deductions', value: formatCurrency(settlementData.summary.totalProductDeductions), color: 'text-red-600 dark:text-red-400' },
                  { label: 'Net Payout', value: formatCurrency(settlementData.summary.totalNetPayout), color: settlementData.summary.totalNetPayout >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400' },
                ].map((s) => (
                  <div key={s.label} className="p-3 rounded-xl bg-muted/50 dark:bg-muted/20 text-center">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{s.label}</p>
                    <p className={`text-sm font-bold mt-1 ${s.color}`}>{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Breakdown Table */}
              {settlementData.breakdown.length > 0 && (
                <>
                  <div className="overflow-x-auto rounded-xl">
                    <Table>
                      <TableHeader>
                        <TableRow className="sticky top-0 bg-background">
                          <TableHead>Date</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Service</TableHead>
                          <TableHead className="text-right">Price</TableHead>
                          <TableHead className="text-right">Owner</TableHead>
                          <TableHead className="text-right">Gross</TableHead>
                          <TableHead>Products Used</TableHead>
                          <TableHead className="text-right">Deduction</TableHead>
                          <TableHead className="text-right">Net</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {settlementData.breakdown.map((b, idx) => (
                          <TableRow key={b.appointmentId} className={`${idx % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-muted/30 dark:bg-muted/10'} hover:bg-muted/50 transition-colors`}>
                            <TableCell className="text-xs">{b.date}</TableCell>
                            <TableCell className="text-sm">{b.customerName}</TableCell>
                            <TableCell className="text-sm">{b.serviceName}</TableCell>
                            <TableCell className="text-right text-sm">{formatCurrency(b.servicePrice)}</TableCell>
                            <TableCell className="text-right text-sm">{formatCurrency(b.ownerShare)}</TableCell>
                            <TableCell className="text-right text-sm">{formatCurrency(b.employeeGross)}</TableCell>
                            <TableCell className="text-xs max-w-[200px]">
                              {b.productsUsed.length > 0 ? b.productsUsed.map(p => `${p.name} (${p.qty})`).join(', ') : '—'}
                            </TableCell>
                            <TableCell className="text-right text-sm text-red-600 dark:text-red-400">
                              {b.productDeduction > 0 ? `-${formatCurrency(b.productDeduction)}` : '—'}
                            </TableCell>
                            <TableCell className={`text-right text-sm font-medium ${b.employeeNet >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                              {formatCurrency(b.employeeNet)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                      <TableFooter>
                        <TableRow className="font-bold">
                          <TableCell colSpan={3}>Total</TableCell>
                          <TableCell className="text-right">{formatCurrency(settlementData.summary.totalRevenue)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(settlementData.summary.totalOwnerShare)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(settlementData.summary.totalGrossCommission)}</TableCell>
                          <TableCell></TableCell>
                          <TableCell className="text-right text-red-600 dark:text-red-400">{formatCurrency(settlementData.summary.totalProductDeductions)}</TableCell>
                          <TableCell className={`text-right ${settlementData.summary.totalNetPayout >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                            {formatCurrency(settlementData.summary.totalNetPayout)}
                          </TableCell>
                        </TableRow>
                      </TableFooter>
                    </Table>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={handleExportCSV} variant="outline">
                      <Download className="w-4 h-4 mr-1.5" /> Export CSV
                    </Button>
                  </div>
                </>
              )}
              {settlementData.breakdown.length === 0 && (
                <EmptyState icon={FileText} title="No transactions found for this period" description={`${settlementData.employee.name} has no completed services in ${format(new Date(settlementMonth + '-01'), 'MMMM yyyy')}. Try selecting a different month.`} />
              )}
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// RECORD SERVICE DIALOG
// ═══════════════════════════════════════════════════════════════════
function RecordServiceDialog({ open, onClose, appointment, onSuccess }: {
  open: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onSuccess?: (() => void) | null;
}) {
  const [recordProducts, setRecordProducts] = useState<Record<string, boolean>>({});
  const [recordQuantities, setRecordQuantities] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);

  const servicePrice = appointment?.service?.price || 0;

  const { data: products, loading: productsLoading } = useFetch<Product[]>('/api/salon/products');

  useEffect(() => {
    if (open) {
      setRecordProducts({});
      setRecordQuantities({});
    }
  }, [open]);

  const selectedProducts = useMemo(() => {
    if (!products) return [];
    return products.filter(p => recordProducts[p.id]);
  }, [products, recordProducts]);

  const commission = useMemo(() => {
    const productDetails = selectedProducts.map(p => ({
      cost: p.cost,
      quantity: recordQuantities[p.id] || 1,
      name: p.name,
      unit: p.unit,
    }));
    return calculateCommission(servicePrice, productDetails);
  }, [servicePrice, selectedProducts, recordQuantities]);

  const toggleProduct = useCallback((id: string) => {
    setRecordProducts(prev => {
      const next = { ...prev, [id]: !prev[id] };
      if (!next[id]) setRecordQuantities(prev2 => { const n = { ...prev2 }; delete n[id]; return n; });
      return next;
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!appointment) return;
    setSubmitting(true);
    try {
      const productsUsed = selectedProducts.map(p => ({
        productId: p.id,
        quantityUsed: recordQuantities[p.id] || 1,
      }));
      await apiPost('/api/salon/transactions', { appointmentId: appointment.id, productsUsed });
      toast.success('Service recorded!', {
        description: `Net earnings: ${formatCurrency(commission.employeeNet)} (${formatCurrency(commission.employeeGross)} gross - ${formatCurrency(commission.totalProductCost)} product costs)`,
      });
      onSuccess?.();
      onClose();
    } catch (e) {
      toast.error('Failed to record service', { description: (e as Error).message });
    } finally {
      setSubmitting(false);
    }
  }, [appointment, selectedProducts, recordQuantities, commission, onSuccess, onClose]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record Service</DialogTitle>
          <DialogDescription>
            Complete service for {appointment?.customer?.name} — {appointment?.service?.name}
          </DialogDescription>
        </DialogHeader>

        {/* Commission Breakdown */}
        <div className="space-y-2 p-4 rounded-xl bg-muted/50 dark:bg-muted/20 text-sm">
          <div className="flex justify-between font-medium">
            <span>Service Price</span>
            <span>{formatCurrency(servicePrice)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span className="pl-4">Owner&apos;s Share (50%)</span>
            <span>{formatCurrency(commission.ownerShare)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span className="pl-4">Your Gross Share (50%)</span>
            <span>{formatCurrency(commission.employeeGross)}</span>
          </div>
          <Separator />
          <div className="font-medium text-xs uppercase tracking-wider text-muted-foreground">Products Used</div>
          {selectedProducts.length === 0 ? (
            <p className="text-xs text-muted-foreground pl-4">No products selected — full gross share earned</p>
          ) : (
            <div className="space-y-1 pl-4">
              {selectedProducts.map(p => {
                const qty = recordQuantities[p.id] || 1;
                const cost = p.cost * qty;
                return (
                  <div key={p.id} className="flex justify-between text-xs">
                    <span className="flex items-center gap-1">
                      {p.name}: <Badge variant="outline" className="text-[10px] h-4 px-1">{qty}{p.unit}</Badge>
                      <span className="text-muted-foreground">&times; {formatCurrency(p.cost)}</span>
                    </span>
                    <span className="text-red-600 dark:text-red-400">{formatCurrency(cost)}</span>
                  </div>
                );
              })}
              <Separator />
              <div className="flex justify-between font-medium text-xs">
                <span>Total Product Cost</span>
                <span className="text-red-600 dark:text-red-400">-{formatCurrency(commission.totalProductCost)}</span>
              </div>
            </div>
          )}
          <Separator />
          <div className={`flex justify-between font-bold text-base ${
            commission.employeeNet >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
          }`}>
            <span>Your Net Earnings</span>
            <span>{formatCurrency(commission.employeeNet)}</span>
          </div>
        </div>

        {/* Product Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Select Products Used</Label>
          {productsLoading ? (
            <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-lg" />)}</div>
          ) : (products || []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No products available</p>
          ) : (
            <ScrollArea className="max-h-[200px]">
              <div className="space-y-2 pr-3">
                {(products || []).map((product) => {
                  const isChecked = recordProducts[product.id];
                  return (
                    <div key={product.id}
                      className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all cursor-pointer ${
                        isChecked ? 'border-rose-300 dark:border-rose-700 bg-rose-50/50 dark:bg-rose-950/20' : 'hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                      onClick={() => toggleProduct(product.id)}>
                      <Checkbox checked={isChecked} onCheckedChange={() => toggleProduct(product.id)} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.category} &bull; {formatCurrency(product.cost)}/{product.unit}</p>
                      </div>
                      {isChecked && (
                        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                          <Button size="sm" variant="outline" className="h-6 w-6 p-0"
                            onClick={() => setRecordQuantities(prev => ({
                              ...prev, [product.id]: Math.max(1, (prev[product.id] || 1) - 1)
                            }))}>-</Button>
                          <span className="text-sm font-medium w-6 text-center">{recordQuantities[product.id] || 1}</span>
                          <Button size="sm" variant="outline" className="h-6 w-6 p-0"
                            onClick={() => setRecordQuantities(prev => ({
                              ...prev, [product.id]: (prev[product.id] || 1) + 1
                            }))}>+</Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting}
            className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 shadow-md shadow-rose-500/20">
            {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
            Record Service
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
