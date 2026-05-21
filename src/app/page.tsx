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
  format, isBefore, isToday, startOfDay, startOfMonth, endOfMonth, startOfWeek, endOfWeek, subDays,
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
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${c.className}`}>{c.label}</span>;
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
    <Card className={`backdrop-blur-md bg-white/70 dark:bg-gray-900/70 border-white/20 dark:border-gray-700/30 shadow-lg ${className}`} {...props}>
      {children}
    </Card>
  );
}

function StatCard({ icon: Icon, label, value, sub, gradient, trend }: {
  icon: React.ElementType; label: string; value: string; sub?: string;
  gradient: string; trend?: 'up' | 'down' | 'neutral';
}) {
  return (
    <motion.div whileHover={{ y: -2, scale: 1.02 }} transition={{ type: 'spring', stiffness: 300 }}>
      <Card className="overflow-hidden shadow-md hover:shadow-xl transition-all duration-200">
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

            {/* Right side: clock, dark mode, nav */}
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
              {/* Desktop Nav */}
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
              {/* Mobile Menu - hidden when bottom nav is visible */}
              <div className="hidden lg:block">
                <Select value={activeRole} onValueChange={(v) => setActiveRole(v as Role)}>
                  <SelectTrigger className="w-[160px] h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer">Book Appointment</SelectItem>
                    <SelectItem value="employee">My Dashboard</SelectItem>
                    <SelectItem value="manager">Manage Store</SelectItem>
                    <SelectItem value="owner">Owner Panel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ─── MAIN CONTENT ───────────────────────────────────── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 rounded-2xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeRole}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {activeRole === 'customer' && <CustomerView />}
            {activeRole === 'employee' && (
              <EmployeeView onCompleteService={handleCompleteService} />
            )}
            {activeRole === 'manager' && <ManagerView />}
            {activeRole === 'owner' && <OwnerView />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav activeRole={activeRole} setActiveRole={setActiveRole} />

      {/* ─── FOOTER (with bottom nav padding) ──────────── */}
      <footer className="border-t bg-gradient-to-r from-white/80 via-rose-50/50 to-pink-50/50 dark:from-gray-950/80 dark:via-rose-950/10 dark:to-pink-950/10 backdrop-blur-sm mt-auto pb-bottom-nav">
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
            <h2 className="text-xl font-bold">Choose a Store</h2>
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
                <motion.div key={store.id} whileHover={{ y: -4, scale: 1.02 }} whileTap={{ scale: 0.98 }}>
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
                </motion.div>
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
              <h2 className="text-xl font-bold">Choose a Service</h2>
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
                  <motion.div key={service.id} whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
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
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Date & Time + Employee */}
        {bookingStep === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold">Pick Stylist, Date & Time</h2>
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
                        <motion.button key={emp.id} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                          onClick={() => { setSelectedEmployeeId(isSelected ? '' : emp.id); setSelectedTimeSlot(''); }}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
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
                        </motion.button>
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
              <h2 className="text-xl font-bold">Your Details</h2>
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
              <h2 className="text-xl font-bold">Review & Confirm</h2>
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

  const { data: customers } = useFetch<Customer[]>('/api/salon/customers');

  const matchedCustomer = useMemo(() => {
    if (!trackPhone.trim() || trackPhone.length < 10) return null;
    return (customers || []).find(c => c.phone === trackPhone);
  }, [customers, trackPhone]);

  const customerId = matchedCustomer?.id || '';

  // Get all appointments across stores
  const { data: allAppointments, loading: allLoading } = useFetch<Appointment[]>(
    customerId && lookupDone ? `/api/salon/appointments?date=2020-01-01` : null
  );

  const filteredAppts = useMemo(() => {
    if (!allAppointments || !customerId) return [];
    return allAppointments.filter(a => a.customerId === customerId);
  }, [allAppointments, customerId]);

  const handleLookup = useCallback(() => {
    if (trackPhone.length >= 10) setLookupDone(true);
  }, [trackPhone]);

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
            ) : filteredAppts.length === 0 ? (
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
                  {filteredAppts.sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`)).slice(0, 5).map((apt) => (
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
                      <div className="text-right shrink-0">
                        <StatusBadge status={apt.status} />
                        <p className="text-xs font-medium text-rose-600 dark:text-rose-400 mt-1">{formatCurrency(apt.service?.price || 0)}</p>
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
}

function EmployeeView({ onCompleteService }: EmployeeViewProps) {
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');

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
            <h2 className="text-lg font-bold">{currentEmp?.name || 'Select Employee'}</h2>
            <p className="text-sm text-muted-foreground">
              {currentEmp?.role} @ {currentEmp?.store?.name || ''}
            </p>
          </div>
        </div>
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
      </div>

      {/* Earnings Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={Zap} label="Today's Net" value={formatCurrency(animatedToday)} sub={`${todayEarnings.count} services · gross ${formatCurrency(todayEarnings.gross)}`} gradient="bg-gradient-to-r from-rose-500 to-pink-500" />
        <StatCard icon={TrendingUp} label="This Week" value={formatCurrency(animatedWeek)} sub={`${(weekTransactions || []).length} services`} gradient="bg-gradient-to-r from-blue-500 to-indigo-500" />
        <StatCard icon={Target} label="This Month" value={formatCurrency(animatedMonth)} sub={`${(monthTransactions || []).length} services`} gradient="bg-gradient-to-r from-emerald-500 to-green-500" />
      </div>

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
                  <motion.div key={apt.id} whileHover={{ scale: 1.005 }}
                    className={`flex items-center gap-4 p-3 rounded-xl border transition-all ${
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
                  </motion.div>
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
function ManagerView() {
  const [managerStoreId, setManagerStoreId] = useState<string>('');
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

  const selectedStoreData = stores?.find(s => s.id === activeStoreId);

  if (storesLoading) return <ViewSkeleton />;

  return (
    <div className="space-y-6">
      {/* Store Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold">Manage Store</h2>
          <p className="text-sm text-muted-foreground">{selectedStoreData?.name || 'Select a store'}</p>
        </div>
        <Select value={activeStoreId} onValueChange={setManagerStoreId}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Select store" />
          </SelectTrigger>
          <SelectContent>
            {(stores || []).map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
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
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
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
                    <TableRow key={apt.id}>
                      <TableCell className="font-medium">{formatTime(apt.time)}</TableCell>
                      <TableCell>{apt.customer?.name || 'N/A'}</TableCell>
                      <TableCell><span className="text-sm">{apt.service?.name}</span></TableCell>
                      <TableCell>{apt.employee?.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={apt.status} />
                          {apt.status === 'PENDING' && (
                            <Button size="sm" variant="ghost" className="h-6 text-xs px-2"
                              onClick={() => handleConfirmAppointment(apt.id)}>Confirm</Button>
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
                <motion.div key={item.id} whileHover={{ scale: 1.02 }}>
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
                </motion.div>
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
function StoreComparisonDashboard() {
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
              <motion.div key={s.store?.id || i} whileHover={{ y: -2, scale: 1.01 }}
                className={`relative p-4 rounded-xl border transition-all ${isTop ? 'border-amber-300 dark:border-amber-700 bg-gradient-to-br from-amber-50/80 to-transparent dark:from-amber-950/20' : ''}`}>
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
                    <span>{pct.toFixed(0)}% of total</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
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

  return (
    <div className="space-y-6">
      {/* Revenue Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Zap} label="Today" value={formatCurrency(animatedTodayRev)} sub={`${todayAnalytics?.totalTransactions || 0} transactions`} gradient="bg-gradient-to-r from-rose-500 to-pink-500" />
        <StatCard icon={TrendingUp} label="This Week" value={formatCurrency(animatedWeekRev)} sub={`${weekAnalytics?.totalTransactions || 0} transactions`} gradient="bg-gradient-to-r from-blue-500 to-indigo-500" />
        <StatCard icon={Target} label="This Month" value={formatCurrency(animatedMonthRev)} sub={`${monthAnalytics?.totalTransactions || 0} transactions`} gradient="bg-gradient-to-r from-emerald-500 to-green-500" />
        <StatCard icon={Crown} label="This Year" value={formatCurrency(animatedYearRev)} sub={`${yearAnalytics?.totalTransactions || 0} transactions`} gradient="bg-gradient-to-r from-amber-500 to-orange-500" />
      </div>

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
      <StoreComparisonDashboard />

      {/* Staff Performance */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Staff Performance</CardTitle>
          <CardDescription>Ranked by total revenue generated</CardDescription>
        </CardHeader>
        <CardContent>
          {!(yearAnalytics || monthAnalytics)?.employeePerformance?.length ? (
            <EmptyState icon={Users} title="No performance data" description="Data will appear as employees complete services" />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
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
                    <TableRow key={emp.employeeId}>
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
            <h3 className="text-lg font-bold">Settlement Engine</h3>
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
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
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
                          <TableRow key={b.appointmentId} className={idx % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-muted/30 dark:bg-muted/10'}>
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
