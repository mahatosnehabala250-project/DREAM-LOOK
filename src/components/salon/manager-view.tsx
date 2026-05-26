'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Scissors, MapPin, Phone, Clock, ChevronRight, ChevronLeft, User, Users,
  Calendar, Check, CheckCircle2, Crown, Download, Package, AlertTriangle,
  TrendingUp, TrendingDown, BarChart3, Search, RefreshCw, X, Plus,
  Zap, Target, DollarSign, Layers, Shield, ArrowUp, ArrowDown,
  Calculator, Star, Bell, Trophy, Activity, History, ChevronDown,
  Eye, EyeOff, Receipt, Percent, Wallet, Store, XCircle,
  Lock, Unlock, UserCheck, UserX, HandCoins, CreditCard, Banknote, Smartphone,
  CalendarX, ClipboardCheck, FileWarning, ShieldCheck, UserMinus, UserPlus,
  Wrench, Mail, Medal, Settings, UserCircle, MessageSquare, ExternalLink,
  Info, Trash2, Pencil, Save, Sparkles, Flame, Building2, IndianRupee,
  FileText, LogIn, LogOut, Play, Timer, CircleDot, Footprints,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
  DropdownMenuTrigger, DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { format, isBefore, isToday, startOfDay, startOfMonth, endOfMonth, startOfWeek, endOfWeek, subDays, addMonths, formatDistanceToNow } from 'date-fns';
import type {
  Store, Service, Product, Employee, Customer, Appointment, Transaction,
  InventoryItem, AttendanceRecord, AnalyticsData, Expense, Leave,
  Advance, Payment, DayClose, AuditLog, SettlementData, AuthUser,
} from '@/lib/salon-types';
import { useFetch, useAnimatedNumber, useActiveSection } from '@/lib/salon-hooks';
import {
  formatTime, formatCurrency, getInitials, calculateCommission,
  TIME_SLOTS, SERVICE_CATEGORIES, EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_CONFIG, STORE_GRADIENTS, STORE_GRADIENT_LIGHT,
  ROLE_ACCENT, getRoleAccent, getAccentForRole,
  apiPost, apiPatch, apiDelete,
} from '@/lib/salon-utils';
import {
  MobileBottomNav, NotificationBell, StatusBadge, StockIndicator,
  ErrorCard, ViewSkeleton, TableSkeleton, CardGridSkeleton, ChartSkeleton,
  GlassCard, StatCard, EmptyState, LiveClock, SectionNav, ErrorBoundary,
  ExpenseCategoryBadge, PaymentBreakdownCard, StaggerContainer, StaggerItem,
} from './common';

// ─── REVENUE TARGET PROGRESS RING ──────────────────────────────
const DAILY_REVENUE_TARGET = 20000;

function RevenueTargetRing({ revenue }: { revenue: number }) {
  const percentage = Math.min((revenue / DAILY_REVENGE_TARGET) * 100, 100);
  const remaining = Math.max(DAILY_REVENGE_TARGET - revenue, 0);
  // SVG circle params
  const radius = 58;
  const stroke = 10;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const ringColor = percentage >= 100
    ? 'text-emerald-500'
    : percentage >= 75
      ? 'text-amber-500'
      : percentage >= 50
        ? 'text-orange-500'
        : 'text-rose-500';

  const statusLabel = percentage >= 100
    ? 'Target Achieved!'
    : percentage >= 75
      ? 'Almost There'
      : percentage >= 50
        ? 'Halfway Done'
        : 'Keep Going';

  return (
    <Card className="shadow-sm overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-center gap-6">
          {/* SVG Progress Ring */}
          <div className="relative shrink-0">
            <svg
              height={radius * 2}
              width={radius * 2}
              className="transform -rotate-90"
            >
              {/* Background circle */}
              <circle
                stroke="currentColor"
                className="text-muted/30 dark:text-muted/20"
                fill="transparent"
                strokeWidth={stroke}
                r={normalizedRadius}
                cx={radius}
                cy={radius}
              />
              {/* Progress circle */}
              <circle
                stroke="currentColor"
                className={`${ringColor}`}
                fill="transparent"
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={circumference + ' ' + circumference}
                style={{ strokeDashoffset, transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.5s ease' }}
                r={normalizedRadius}
                cx={radius}
                cy={radius}
              />
            </svg>
            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black">{Math.round(percentage)}%</span>
              <span className="text-[9px] text-muted-foreground font-medium">of target</span>
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 space-y-3">
            <div>
              <p className="text-sm font-semibold">Daily Revenue Target</p>
              <p className="text-xs text-muted-foreground">Goal: {formatCurrency(DAILY_REVENGE_TARGET)}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 p-2.5">
                <p className="text-[10px] text-muted-foreground">Earned</p>
                <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{formatCurrency(revenue)}</p>
              </div>
              <div className="rounded-lg bg-rose-50 dark:bg-rose-950/20 p-2.5">
                <p className="text-[10px] text-muted-foreground">Remaining</p>
                <p className="text-sm font-bold text-rose-700 dark:text-rose-400">{formatCurrency(remaining)}</p>
              </div>
            </div>
            <Badge
              variant="secondary"
              className={`font-medium ${
                percentage >= 100
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                  : percentage >= 75
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300'
              }`}
            >
              {statusLabel}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

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
// MANAGER EXPENSE SECTION
// ═══════════════════════════════════════════════════════════════════
function ManagerExpenseSection({ storeId }: { storeId: string }) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');

  const { data: todayExpenses, refetch: refetchToday } = useFetch<Expense[]>(
    storeId ? `/api/salon/expenses?storeId=${storeId}&from=${today}&to=${today}` : null
  );
  const { data: monthExpenses, loading: monthLoading, refetch: refetchMonth } = useFetch<Expense[]>(
    storeId ? `/api/salon/expenses?storeId=${storeId}&from=${monthStart}&to=${today}` : null
  );

  const [expCategory, setExpCategory] = useState('');
  const [expDesc, setExpDesc] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expDate, setExpDate] = useState(today);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const todayTotal = useMemo(() => (todayExpenses || []).reduce((s, e) => s + e.amount, 0), [todayExpenses]);
  const monthTotal = useMemo(() => (monthExpenses || []).reduce((s, e) => s + e.amount, 0), [monthExpenses]);

  const handleAddExpense = useCallback(async () => {
    if (!storeId || !expCategory || !expDesc || !expAmount || !expDate) return;
    setSubmitting(true);
    try {
      await apiPost('/api/salon/expenses', { storeId, category: expCategory, description: expDesc, amount: parseFloat(expAmount), expenseDate: expDate });
      toast.success('Expense added successfully');
      setExpCategory('');
      setExpDesc('');
      setExpAmount('');
      setExpDate(today);
      setShowForm(false);
      refetchToday();
      refetchMonth();
    } catch (e) {
      toast.error('Failed to add expense', { description: (e as Error).message });
    } finally {
      setSubmitting(false);
    }
  }, [storeId, expCategory, expDesc, expAmount, expDate, today, refetchToday, refetchMonth]);

  const recentExpenses = useMemo(() => (monthExpenses || []).slice(0, 8), [monthExpenses]);

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-red-500" />
            <CardTitle className="text-base">Expenses</CardTitle>
          </div>
          <Button size="sm" variant="outline" onClick={() => setShowForm(!showForm)} className="text-xs h-8">
            <Plus className={`w-3.5 h-3.5 mr-1 transition-transform ${showForm ? 'rotate-45' : ''}`} />
            {showForm ? 'Cancel' : 'Add Expense'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Today&apos;s Expenses</p>
            <p className="text-lg font-bold text-red-600 dark:text-red-400">{formatCurrency(todayTotal)}</p>
            <p className="text-[10px] text-muted-foreground">{(todayExpenses || []).length} entries</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">This Month</p>
            <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{formatCurrency(monthTotal)}</p>
            <p className="text-[10px] text-muted-foreground">{format(new Date(), 'MMM yyyy')}</p>
          </div>
        </div>

        {/* Quick Add Expense Form */}
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3 p-4 rounded-xl border-2 border-dashed border-red-200 dark:border-red-800">
            <h4 className="text-sm font-semibold flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-red-500" /> Quick Add Expense
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Category</Label>
                <Select value={expCategory} onValueChange={setExpCategory}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Description</Label>
                <Input value={expDesc} onChange={e => setExpDesc(e.target.value)} placeholder="e.g., Groceries" className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Amount (₹)</Label>
                <Input type="number" value={expAmount} onChange={e => setExpAmount(e.target.value)} placeholder="0" className="h-9" min="0" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Date</Label>
                <Input type="date" value={expDate} onChange={e => setExpDate(e.target.value)} className="h-9" />
              </div>
            </div>
            <Button size="sm" onClick={handleAddExpense} disabled={submitting || !expCategory || !expDesc || !expAmount}
              className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-md shadow-red-500/20 text-xs h-8">
              {submitting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3 mr-1" />}
              Save Expense
            </Button>
          </motion.div>
        )}

        {/* Recent Expenses List */}
        {monthLoading ? (
          <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}</div>
        ) : !recentExpenses || recentExpenses.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-muted/80 flex items-center justify-center mb-2">
              <Receipt className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">No expenses this month</p>
            <p className="text-xs text-muted-foreground">Tap &quot;Add Expense&quot; to record one</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
            {recentExpenses.map((exp) => (
              <div key={exp.id} className="flex items-center gap-3 p-3 rounded-xl border hover:shadow-sm transition-shadow">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
                  {exp.category === 'RENT' && <Building2 className="w-4 h-4 text-amber-500" />}
                  {exp.category === 'UTILITIES' && <Zap className="w-4 h-4 text-blue-500" />}
                  {exp.category === 'SALARY' && <Users className="w-4 h-4 text-emerald-500" />}
                  {exp.category === 'SUPPLIES' && <Package className="w-4 h-4 text-violet-500" />}
                  {exp.category === 'MAINTENANCE' && <Wrench className="w-4 h-4 text-orange-500" />}
                  {exp.category === 'MARKETING' && <Flame className="w-4 h-4 text-pink-500" />}
                  {exp.category === 'OTHER' && <FileText className="w-4 h-4 text-muted-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{exp.description}</p>
                    <ExpenseCategoryBadge category={exp.category} />
                  </div>
                  <p className="text-xs text-muted-foreground">{format(new Date(exp.expenseDate), 'MMM d, yyyy')}</p>
                </div>
                <span className="text-sm font-semibold text-red-600 dark:text-red-400 shrink-0">
                  -{formatCurrency(exp.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MANAGER CUSTOMER MANAGEMENT SECTION
// ═══════════════════════════════════════════════════════════════════
function ManagerCustomerSection({ storeId }: { storeId: string }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [newCustOpen, setNewCustOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { data: customers, loading, error, refetch } = useFetch<Customer[]>('/api/salon/customers');
  const { data: customerAppts, loading: apptsLoading } = useFetch<Appointment[]>(
    selectedCustomer ? `/api/salon/appointments?customerId=${selectedCustomer.id}` : null,
  );

  const filteredCustomers = useMemo(() => {
    if (!customers) return [];
    const q = searchQuery.toLowerCase().trim();
    if (!q) return customers;
    return customers.filter(
      (c) => c.name.toLowerCase().includes(q) || c.phone.includes(q),
    );
  }, [customers, searchQuery]);

  const handleCreateCustomer = useCallback(async () => {
    if (!newName.trim() || !newPhone.trim()) {
      toast.error('Please fill in name and phone');
      return;
    }
    setSubmitting(true);
    try {
      await apiPost('/api/salon/customers', {
        name: newName.trim(),
        phone: newPhone.trim(),
        email: newEmail.trim() || undefined,
      });
      toast.success('Customer added successfully');
      setNewName('');
      setNewPhone('');
      setNewEmail('');
      setNewCustOpen(false);
      refetch();
    } catch (e) {
      const msg = (e as Error).message;
      if (msg.includes('already exists')) {
        toast.error('Duplicate phone', { description: 'A customer with this phone number already exists.' });
      } else {
        toast.error('Failed to add customer', { description: msg });
      }
    } finally {
      setSubmitting(false);
    }
  }, [newName, newPhone, newEmail, refetch]);

  const handleSelectCustomer = useCallback((customer: Customer) => {
    setSelectedCustomer(customer);
    setProfileOpen(true);
  }, []);

  // Compute stats for selected customer
  const selectedCustomerStats = useMemo(() => {
    if (!customerAppts) return { totalVisits: 0, totalSpend: 0, completedVisits: 0 };
    const completed = customerAppts.filter((a) => a.status === 'COMPLETED');
    const totalSpend = completed.reduce((sum, a) => sum + (a.service?.price || 0), 0);
    return {
      totalVisits: customerAppts.length,
      totalSpend,
      completedVisits: completed.length,
    };
  }, [customerAppts]);

  return (
    <>
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Customers</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                {(customers || []).length} total customers
              </CardDescription>
            </div>
            <Button size="sm" onClick={() => setNewCustOpen(true)} className="bg-rose-500 hover:bg-rose-600 text-xs h-8">
              <UserPlus className="w-3.5 h-3.5 mr-1" /> New Customer
            </Button>
          </div>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 bg-muted/50 dark:bg-muted/20"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}</div>
          ) : error ? (
            <ErrorCard message="Failed to load customers" onRetry={refetch} />
          ) : filteredCustomers.length === 0 ? (
            <EmptyState icon={Users} title={searchQuery ? 'No customers found' : 'No customers yet'} description={searchQuery ? 'Try a different search term' : 'Add your first customer to get started'} />
          ) : (
            <ScrollArea className="max-h-96">
              <div className="overflow-x-auto rounded-xl table-scroll-container -mx-4 px-4 sm:mx-0 sm:px-0">
                <Table>
                  <TableHeader>
                    <TableRow className="sticky top-0 bg-background">
                      <TableHead>Customer</TableHead>
                      <TableHead className="hidden sm:table-cell">Phone</TableHead>
                      <TableHead className="hidden md:table-cell">Email</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCustomers.slice(0, 20).map((customer, i) => (
                      <TableRow key={customer.id} className="hover:bg-muted/50 transition-colors cursor-pointer animate-[fadeInUp_0.3s_ease-out_forwards] opacity-0" style={{ animationDelay: `${i * 40}ms` }} onClick={() => handleSelectCustomer(customer)}>
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs font-medium bg-gradient-to-br from-rose-100 to-pink-100 dark:from-rose-950/40 dark:to-pink-950/40 text-rose-700 dark:text-rose-300">
                                {getInitials(customer.name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">{customer.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{customer.phone}</TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{customer.email || '—'}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); handleSelectCustomer(customer); }}>
                            View Profile
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Customer Profile Dialog */}
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          {selectedCustomer && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 ring-2 ring-rose-200 dark:ring-rose-800">
                    <AvatarFallback className="bg-gradient-to-br from-rose-500 to-pink-600 text-white font-bold text-sm">
                      {getInitials(selectedCustomer.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p>{selectedCustomer.name}</p>
                    <p className="text-sm font-normal text-muted-foreground">{selectedCustomer.phone}</p>
                  </div>
                </DialogTitle>
                <DialogDescription>Customer profile and appointment history</DialogDescription>
              </DialogHeader>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mt-2">
                {[
                  { label: 'Total Visits', value: String(selectedCustomerStats.totalVisits), color: 'text-blue-600 dark:text-blue-400' },
                  { label: 'Completed', value: String(selectedCustomerStats.completedVisits), color: 'text-emerald-600 dark:text-emerald-400' },
                  { label: 'Total Spend', value: formatCurrency(selectedCustomerStats.totalSpend), color: 'text-rose-600 dark:text-rose-400' },
                ].map((s) => (
                  <div key={s.label} className="p-3 rounded-xl bg-muted/50 dark:bg-muted/20 text-center">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{s.label}</p>
                    <p className={`text-sm font-bold mt-1 ${s.color}`}>{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Contact Info */}
              <div className="space-y-2 p-3 rounded-xl bg-muted/30 dark:bg-muted/10">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>{selectedCustomer.email || 'No email provided'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>{selectedCustomer.phone}</span>
                </div>
              </div>

              {/* Appointment History */}
              <div>
                <h4 className="text-sm font-semibold mb-2">Appointment History</h4>
                {apptsLoading ? (
                  <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}</div>
                ) : !customerAppts || customerAppts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No appointments yet</p>
                ) : (
                  <ScrollArea className="max-h-64">
                    <div className="space-y-2">
                      {customerAppts.sort((a, b) => b.date.localeCompare(a.date)).map((apt) => (
                        <div key={apt.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/30 flex items-center justify-center shrink-0">
                            <Calendar className="w-4 h-4 text-rose-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{apt.service?.name || 'Service'}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{apt.date}</span>
                              <span>•</span>
                              <span>{formatTime(apt.time)}</span>
                              {apt.store && (
                                <>
                                  <span>•</span>
                                  <span className="truncate">{apt.store.name}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <StatusBadge status={apt.status} />
                            <span className="text-xs font-medium text-rose-600 dark:text-rose-400">
                              {formatCurrency(apt.service?.price || 0)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* New Customer Dialog */}
      <Dialog open={newCustOpen} onOpenChange={setNewCustOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-rose-500" />
              Add New Customer
            </DialogTitle>
            <DialogDescription>Create a new customer record</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="cust-name">Full Name *</Label>
              <Input id="cust-name" placeholder="e.g., Priya Sharma" value={newName} onChange={(e) => setNewName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cust-phone">Phone Number *</Label>
              <Input id="cust-phone" placeholder="e.g., 9876543210" value={newPhone} onChange={(e) => setNewPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} type="tel" />
              <p className="text-xs text-muted-foreground">10-digit mobile number</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cust-email">Email (optional)</Label>
              <Input id="cust-email" type="email" placeholder="e.g., priya@example.com" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewCustOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateCustomer} disabled={submitting || !newName.trim() || !newPhone.trim()} className="bg-rose-500 hover:bg-rose-600">
              {submitting ? <RefreshCw className="w-4 h-4 animate-spin mr-1.5" /> : <Check className="w-4 h-4 mr-1.5" />}
              Add Customer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════
// OWNER CUSTOMER ANALYTICS SECTION
// ═══════════════════════════════════════════════════════════════════
export interface CustomerAnalyticsData {
  topCustomers: Array<{
    customerId: string;
    customerName: string;
    phone: string;
    totalVisits: number;
    totalSpend: number;
    totalAppointments: number;
  }>;
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  newToReturningRatio: {
    new: number;
    returning: number;
    newPercent: number;
    returningPercent: number;
  };
  customerGrowth: Array<{ month: string; newCustomers: number }>;
  avgVisits: number;
  totalAppointments: number;
  completedAppointments: number;
}

export function OwnerCustomerAnalyticsSection() {
  const { data: analytics, loading, error, refetch } = useFetch<CustomerAnalyticsData>('/api/salon/analytics/customers');

  const growthChartData = useMemo(() => {
    if (!analytics?.customerGrowth) return [];
    return analytics.customerGrowth.map((g) => {
      const [y, m] = g.month.split('-');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return {
        month: monthNames[parseInt(m, 10) - 1] + ' ' + y.slice(2),
        newCustomers: g.newCustomers,
      };
    });
  }, [analytics]);

  const topCustomersChartData = useMemo(() => {
    if (!analytics?.topCustomers) return [];
    return analytics.topCustomers.slice(0, 10).map((c) => ({
      name: c.customerName.length > 12 ? c.customerName.slice(0, 12) + '…' : c.customerName,
      spend: c.totalSpend,
      visits: c.totalVisits,
    }));
  }, [analytics]);

  const COLORS = ['#f43f5e', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#6366f1', '#a855f7', '#ec4899', '#14b8a6', '#84cc16'];

  if (loading) return <ViewSkeleton />;
  if (error) return <ErrorCard message="Failed to load customer analytics" onRetry={refetch} />;
  if (!analytics) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <span className="w-1 h-5 rounded-full bg-gradient-to-b from-violet-500 to-purple-500" />
          Customer Analytics
        </h2>
        <p className="text-sm text-muted-foreground ml-3">Insights into customer acquisition, retention, and spending</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Customers" value={String(analytics.totalCustomers)} sub={`${analytics.totalAppointments} total appointments`} gradient="bg-gradient-to-r from-rose-500 to-pink-500" />
        <StatCard icon={UserPlus} label="New Customers" value={String(analytics.newCustomers)} sub={`${analytics.newToReturningRatio.newPercent}% of total`} gradient="bg-gradient-to-r from-blue-500 to-indigo-500" />
        <StatCard icon={History} label="Returning" value={String(analytics.returningCustomers)} sub={`${analytics.newToReturningRatio.returningPercent}% retention`} gradient="bg-gradient-to-r from-emerald-500 to-green-500" />
        <StatCard icon={Activity} label="Avg Visits" value={String(analytics.avgVisits)} sub={`${analytics.completedAppointments} completed`} gradient="bg-gradient-to-r from-amber-500 to-orange-500" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Growth Chart */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Customer Growth</CardTitle>
            <CardDescription>New customers added per month</CardDescription>
          </CardHeader>
          <CardContent>
            {growthChartData.length === 0 ? (
              <EmptyState icon={TrendingUp} title="No data yet" description="Customer growth data will appear over time" />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={growthChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <RTooltip />
                  <Bar dataKey="newCustomers" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* New vs Returning Pie */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">New vs Returning</CardTitle>
            <CardDescription>Customer distribution breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'New', value: analytics.newToReturningRatio.new },
                      { name: 'Returning', value: analytics.newToReturningRatio.returning },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    <Cell fill="#f43f5e" />
                    <Cell fill="#22c55e" />
                  </Pie>
                  <RTooltip formatter={(v: number, name: string) => [`${v} customers`, name]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-6 mt-2">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500" />
                  <span className="text-sm">New ({analytics.newToReturningRatio.newPercent}%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-sm">Returning ({analytics.newToReturningRatio.returningPercent}%)</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Customers Table */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Top Customers by Spend</CardTitle>
              <CardDescription className="text-xs mt-0.5">Ranked by total revenue generated</CardDescription>
            </div>
            {analytics.topCustomers.length > 0 && (
              <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                <Trophy className="w-3 h-3 mr-1" />
                Top {analytics.topCustomers.length}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {analytics.topCustomers.length === 0 ? (
            <EmptyState icon={Users} title="No spending data" description="Customer spending data will appear as transactions are completed" />
          ) : (
            <div className="overflow-x-auto rounded-xl table-scroll-container -mx-4 px-4 sm:mx-0 sm:px-0">
              <Table>
                <TableHeader>
                  <TableRow className="sticky top-0 bg-background">
                    <TableHead className="w-8">#</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="hidden sm:table-cell">Phone</TableHead>
                    <TableHead className="text-right">Visits</TableHead>
                    <TableHead className="text-right">Total Spend</TableHead>
                    <TableHead className="text-right hidden sm:table-cell">Avg/Visit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.topCustomers.map((c, i) => (
                    <TableRow key={c.customerId} className="hover:bg-muted/50 transition-colors">
                      <TableCell>
                        {i === 0 ? <Trophy className="w-4 h-4 text-amber-500" /> : i === 1 ? <Medal className="w-4 h-4 text-gray-400" /> : i === 2 ? <Medal className="w-4 h-4 text-amber-700" /> : <span className="text-muted-foreground text-sm">{i + 1}</span>}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className="text-[10px] font-medium bg-gradient-to-br from-rose-100 to-pink-100 dark:from-rose-950/40 dark:to-pink-950/40 text-rose-700 dark:text-rose-300">
                              {getInitials(c.customerName)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">{c.customerName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{c.phone}</TableCell>
                      <TableCell className="text-right text-sm font-medium">{c.totalVisits}</TableCell>
                      <TableCell className="text-right text-sm font-bold text-rose-600 dark:text-rose-400">{formatCurrency(c.totalSpend)}</TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground hidden sm:table-cell">
                        {c.totalVisits > 0 ? formatCurrency(c.totalSpend / c.totalVisits) : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Customers Bar Chart */}
      {topCustomersChartData.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Top Spenders</CardTitle>
            <CardDescription>Visual breakdown of top customer spending</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topCustomersChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v: number) => formatCurrency(v)} />
                <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 10 }} />
                <RTooltip formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="spend" radius={[0, 4, 4, 0]}>
                  {topCustomersChartData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// TOP PERFORMERS TODAY (Mini Cards)
// ═══════════════════════════════════════════════════════════════════
function TopPerformersToday({ transactions }: { transactions: Transaction[] }) {
  const topPerfomers = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];
    const grouped = transactions.reduce<Record<string, { name: string; revenue: number; count: number }>>((acc, tx) => {
      const eid = tx.employeeId;
      if (!acc[eid]) acc[eid] = { name: tx.employee?.name || 'Unknown', revenue: 0, count: 0 };
      acc[eid].revenue += tx.servicePrice;
      acc[eid].count += 1;
      return acc;
    }, {});
    return Object.entries(grouped)
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 3)
      .map(([id, data]) => ({ id, ...data }));
  }, [transactions]);

  const rankConfig = [
    { icon: Medal, label: '#1', gradient: 'from-amber-400 via-yellow-400 to-amber-500', ring: 'ring-amber-300 dark:ring-amber-700', bg: 'bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border-amber-200 dark:border-amber-800', text: 'text-amber-700 dark:text-amber-300' },
    { icon: Medal, label: '#2', gradient: 'from-gray-300 via-slate-300 to-gray-400', ring: 'ring-gray-300 dark:ring-gray-600', bg: 'bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-950/30 dark:to-slate-950/30 border-gray-200 dark:border-gray-700', text: 'text-gray-600 dark:text-gray-300' },
    { icon: Medal, label: '#3', gradient: 'from-orange-400 via-amber-500 to-orange-600', ring: 'ring-orange-300 dark:ring-orange-700', bg: 'bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border-orange-200 dark:border-orange-800', text: 'text-orange-700 dark:text-orange-300' },
  ];

  if (topPerfomers.length === 0) return null;

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-500" />
          <CardTitle className="text-base">Top Performers Today</CardTitle>
        </div>
        <CardDescription className="text-xs">Based on today&apos;s completed service revenue</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {topPerfomers.map((perf, idx) => {
            const config = rankConfig[idx] || rankConfig[2];
            const RankIcon = config.icon;
            return (
              <motion.div
                key={perf.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1, duration: 0.3 }}
              >
                <div className={`relative rounded-xl border p-4 ${config.bg} overflow-hidden`}>
                  {/* Decorative gradient bar at top */}
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${config.gradient}`} />

                  <div className="flex items-center gap-3">
                    {/* Rank badge + Avatar */}
                    <div className="relative">
                      <Avatar className={`h-10 w-10 ring-2 ${config.ring}`}>
                        <AvatarFallback className={`bg-gradient-to-br ${config.gradient} text-white font-bold text-sm`}>
                          {getInitials(perf.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-sm`}>
                        <RankIcon className="w-3 h-3 text-white" />
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{perf.name}</p>
                      <p className={`text-base font-black ${config.text}`}>
                        {formatCurrency(perf.revenue)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {perf.count} service{perf.count !== 1 ? 's' : ''} completed
                      </p>
                    </div>
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
// MANAGER VIEW - MANAGE STORE
// ═══════════════════════════════════════════════════════════════════
export function ManagerView({ authUser }: { authUser?: AuthUser | null }) {
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
  // Today's transactions for top performers
  const { data: todayTransactions } = useFetch<Transaction[]>(
    activeStoreId ? `/api/salon/transactions?storeId=${activeStoreId}&from=${today}&to=${today}` : null
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

  const managerSections = [
    { id: 'mgr-overview', label: 'Overview' },
    { id: 'mgr-appointments', label: 'Appointments' },
    { id: 'mgr-walkin', label: 'Walk-in Queue' },
    { id: 'mgr-staff', label: 'Staff' },
    { id: 'mgr-inventory', label: 'Inventory' },
    { id: 'mgr-customers', label: 'Customers' },
    { id: 'mgr-payments', label: 'Payments' },
    { id: 'mgr-expenses', label: 'Expenses' },
    { id: 'mgr-cash-register', label: 'Cash Register' },
    { id: 'mgr-day-close', label: 'Day Close' },
  ];
  const activeManagerSection = useActiveSection(managerSections.map(s => s.id));

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

      {/* Section Navigation */}
      <SectionNav sections={managerSections} activeSection={activeManagerSection} />

      {/* Overview Stats */}
      <div id="mgr-overview" className="scroll-mt-36 space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={DollarSign} label="Today's Revenue" value={formatCurrency(todayRevenue)} sub={`${todayTxCount} completed transactions`} gradient="bg-gradient-to-r from-rose-500 to-pink-500" />
        <StatCard icon={Calendar} label="Appointments" value={String((appointments || []).length)} sub={`${(appointments || []).filter(a => a.status === 'PENDING').length} pending`} gradient="bg-gradient-to-r from-blue-500 to-indigo-500" />
        <StatCard icon={Users} label="Staff Present" value={`${presentCount}/${(attendance || []).length || '-'}`} sub="Checked in today" gradient="bg-gradient-to-r from-emerald-500 to-green-500" />
        <StatCard icon={AlertTriangle} label="Low Stock Alerts" value={String(lowStockCount)} sub="Items need restocking" gradient="bg-gradient-to-r from-amber-500 to-orange-500" />
      </div>

      {/* Revenue Target Progress Ring */}
      <RevenueTargetRing revenue={todayRevenue} />

      {/* Today vs Yesterday Comparison */}
      <TodayVsYesterdayComparison storeId={activeStoreId} />

      {/* Payment Breakdown */}
      <PaymentBreakdownCard analytics={todayAnalytics} title="Today's Payment Breakdown" />
      </div>{/* end mgr-overview */}

      {/* Staff Attendance */}
      <div id="mgr-staff" className="scroll-mt-36">
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
      </div>{/* end mgr-staff */}

      {/* Appointments */}
      <div id="mgr-appointments" className="scroll-mt-36">
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
            <div className="overflow-x-auto rounded-xl table-scroll-container -mx-4 px-4 sm:mx-0 sm:px-0">
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
      </div>{/* end mgr-appointments */}

      {/* Top Performers Today */}
      <TopPerformersToday transactions={todayTransactions || []} />

      {/* Inventory */}
      <div id="mgr-inventory" className="scroll-mt-36">
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
      </div>{/* end mgr-inventory */}

      {/* ─── WALK-IN QUEUE ───────────────────────────────────── */}
      <div id="mgr-walkin" className="scroll-mt-36">
      <ManagerWalkInQueueSection storeId={activeStoreId} authUser={authUser} />
      </div>

      {/* ─── CUSTOMER MANAGEMENT ─────────────────────────────── */}
      <div id="mgr-customers" className="scroll-mt-36">
      <ManagerCustomerSection storeId={activeStoreId} />
      </div>

      {/* ─── PAYMENT METHOD ON RECORD SERVICE ────────────────── */}
      <ManagerDayTransactionsSection storeId={activeStoreId} authUser={authUser} />

      {/* ─── LEAVE REQUESTS TAB ───────────────────────────────── */}
      <ManagerLeaveRequestsSection storeId={activeStoreId} authUser={authUser} />

      {/* ─── DAILY PAYMENT ───────────────────────────────────── */}
      <ManagerDailyPaymentSection storeId={activeStoreId} authUser={authUser} />

      {/* ─── PAYMENTS ────────────────────────────────────────── */}
      <div id="mgr-payments" className="scroll-mt-36">
      <ManagerPaymentHistorySection storeId={activeStoreId} authUser={authUser} />
      </div>

      {/* ─── EXPENSES ────────────────────────────────────────── */}
      <div id="mgr-expenses" className="scroll-mt-36">
      <ManagerExpenseSection storeId={activeStoreId} />
      </div>

      {/* ─── CASH REGISTER ──────────────────────────────────── */}
      <div id="mgr-cash-register" className="scroll-mt-36">
      <ManagerCashRegisterSection storeId={activeStoreId} authUser={authUser} />
      </div>

      {/* ─── DAY CLOSE BUTTON ────────────────────────────────── */}
      <div id="mgr-day-close" className="scroll-mt-36">
      <ManagerDayCloseSection storeId={activeStoreId} authUser={authUser} />
      </div>

      {/* ─── QUICK ACTIONS FAB ───────────────────────────────── */}
      <ManagerQuickActionsFAB
        onNewAppointment={() => setNewApptDialogOpen(true)}
        onRecordWalkIn={() => {
          const el = document.getElementById('mgr-walkin');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
        onMarkAttendance={() => {
          const el = document.getElementById('mgr-staff');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MANAGER DAY TRANSACTIONS (Payment Method)
// ═══════════════════════════════════════════════════════════════════

// ─── QUICK ACTIONS FAB ──────────────────────────────────────────
function ManagerQuickActionsFAB({
  onNewAppointment,
  onRecordWalkIn,
  onMarkAttendance,
}: {
  onNewAppointment: () => void;
  onRecordWalkIn: () => void;
  onMarkAttendance: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const actions = [
    { icon: Calendar, label: 'New Appointment', color: 'bg-rose-500 hover:bg-rose-600', onClick: onNewAppointment },
    { icon: Footprints, label: 'Record Walk-in', color: 'bg-pink-500 hover:bg-pink-600', onClick: onRecordWalkIn },
    { icon: ClipboardCheck, label: 'Mark Attendance', color: 'bg-fuchsia-500 hover:bg-fuchsia-600', onClick: onMarkAttendance },
  ];

  // Close on click outside
  useEffect(() => {
    if (!expanded) return;
    const handler = () => setExpanded(false);
    // Use timeout to avoid closing immediately
    const timer = setTimeout(() => document.addEventListener('click', handler), 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handler);
    };
  }, [expanded]);

  return (
    <div className="fixed bottom-24 right-6 z-40 lg:bottom-8">
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-16 right-0 flex flex-col-reverse items-end gap-3 mb-3"
          >
            {actions.map((action, i) => (
              <motion.div
                key={action.label}
                initial={{ opacity: 0, x: 20, y: 10 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                exit={{ opacity: 0, x: 20, y: 10 }}
                transition={{ delay: (actions.length - 1 - i) * 0.05, duration: 0.15 }}
                className="flex items-center gap-2"
              >
                <span className="text-xs font-medium text-muted-foreground bg-background/90 backdrop-blur-sm px-2 py-1 rounded-lg shadow-sm border border-border/50 whitespace-nowrap">
                  {action.label}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); action.onClick(); setExpanded(false); }}
                  className={`w-11 h-11 rounded-full ${action.color} text-white shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95`}
                  aria-label={action.label}
                >
                  <action.icon className="w-5 h-5" />
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className={`w-14 h-14 rounded-full bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-xl shadow-rose-500/30 flex items-center justify-center transition-all duration-300 ${
          expanded ? 'rotate-45' : ''
        }`}
        aria-label="Quick Actions"
      >
        <Plus className="w-6 h-6" />
      </motion.button>
    </div>
  );
}

function ManagerDayTransactionsSection({ storeId, authUser }: { storeId: string; authUser?: AuthUser | null }) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const { data: transactions, refetch } = useFetch<Transaction[]>(
    storeId ? `/api/salon/transactions?storeId=${storeId}&from=${today}&to=${today}` : null
  );
  const [recordPayDialogOpen, setRecordPayDialogOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [payMethod, setPayMethod] = useState<'CASH' | 'ONLINE' | 'SPLIT'>('CASH');
  const [splitCash, setSplitCash] = useState(0);
  const [splitOnline, setSplitOnline] = useState(0);
  const [updating, setUpdating] = useState(false);

  const totalCash = useMemo(() => (transactions || []).filter(t => t.paymentMethod === 'CASH').reduce((s, t) => s + t.servicePrice, 0), [transactions]);
  const totalOnline = useMemo(() => (transactions || []).filter(t => t.paymentMethod === 'ONLINE').reduce((s, t) => s + t.servicePrice, 0), [transactions]);
  const splitTxns = useMemo(() => (transactions || []).filter(t => t.paymentMethod === 'SPLIT'), [transactions]);
  const totalSplitCash = useMemo(() => splitTxns.reduce((s, t) => s + (t.cashAmount || 0), 0), [splitTxns]);
  const totalSplitOnline = useMemo(() => splitTxns.reduce((s, t) => s + (t.onlineAmount || 0), 0), [splitTxns]);

  const openRecordDialog = useCallback((tx: Transaction) => {
    setSelectedTx(tx);
    setPayMethod(tx.paymentMethod as 'CASH' | 'ONLINE' | 'SPLIT' || 'CASH');
    setSplitCash(tx.cashAmount || 0);
    setSplitOnline(tx.onlineAmount || 0);
    setRecordPayDialogOpen(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!selectedTx) return;
    if (payMethod === 'SPLIT') {
      if (splitCash + splitOnline !== selectedTx.servicePrice) {
        toast.error('Split amounts must sum to total', { description: `Cash (${splitCash}) + Online (${splitOnline}) ≠ ${selectedTx.servicePrice}` });
        return;
      }
    }
    setUpdating(true);
    try {
      await apiPatch(`/api/salon/transactions/${selectedTx.id}`, {
        paymentMethod: payMethod,
        cashAmount: payMethod === 'CASH' ? selectedTx.servicePrice : payMethod === 'ONLINE' ? 0 : splitCash,
        onlineAmount: payMethod === 'ONLINE' ? selectedTx.servicePrice : payMethod === 'CASH' ? 0 : splitOnline,
      });
      toast.success('Payment method updated');
      setRecordPayDialogOpen(false);
      refetch();
    } catch (e) {
      toast.error('Failed to update', { description: (e as Error).message });
    } finally {
      setUpdating(false);
    }
  }, [selectedTx, payMethod, splitCash, splitOnline, refetch]);

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-blue-500" />
            <CardTitle className="text-base">Today&apos;s Payment Methods</CardTitle>
          </div>
          <div className="flex gap-2">
            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">Cash: {formatCurrency(totalCash + totalSplitCash)}</Badge>
            <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">Online: {formatCurrency(totalOnline + totalSplitOnline)}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!(transactions || []).length ? (
          <EmptyState icon={Receipt} title="No transactions today" description="Completed services will show here for payment method recording" />
        ) : (
          <ScrollArea className="max-h-64">
            <div className="space-y-2 pr-2">
              {(transactions || []).sort((a, b) => new Date(b.completedAt || '').getTime() - new Date(a.completedAt || '').getTime()).map((tx) => (
                <div key={tx.id} className="flex items-center gap-3 p-3 rounded-xl border hover:shadow-sm transition-all">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{tx.service?.name}</p>
                    <p className="text-xs text-muted-foreground">{tx.employee?.name} • {tx.completedAt ? format(new Date(tx.completedAt), 'hh:mm a') : ''}</p>
                  </div>
                  <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">{formatCurrency(tx.servicePrice)}</p>
                  <Button size="sm" variant="outline" className="text-xs h-7 px-2" onClick={() => openRecordDialog(tx)}>
                    <Receipt className="w-3 h-3 mr-1" />
                    {tx.paymentMethod || 'Set Method'}
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        <Dialog open={recordPayDialogOpen} onOpenChange={(v) => !v && setRecordPayDialogOpen(false)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Record Payment Method</DialogTitle>
              <DialogDescription>{selectedTx?.service?.name} — {formatCurrency(selectedTx?.servicePrice || 0)}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex gap-2">
                {(['CASH', 'ONLINE', 'SPLIT'] as const).map((m) => (
                  <button key={m} onClick={() => setPayMethod(m)}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold border-2 transition-all ${
                      payMethod === m
                        ? m === 'CASH' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700'
                          : m === 'ONLINE' ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20 text-blue-700'
                          : 'border-amber-500 bg-amber-50 dark:bg-amber-950/20 text-amber-700'
                        : 'border-gray-200 dark:border-gray-700 text-muted-foreground'
                    }`}>
                    {m === 'CASH' ? '💵 Cash' : m === 'ONLINE' ? '💳 Online' : '✂️ Split'}
                  </button>
                ))}
              </div>
              {payMethod === 'SPLIT' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Cash Amount</Label>
                    <Input type="number" value={splitCash} onChange={e => setSplitCash(Number(e.target.value))}
                      className="h-9" min={0} max={selectedTx?.servicePrice || 0} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Online Amount</Label>
                    <Input type="number" value={splitOnline} onChange={e => setSplitOnline(Number(e.target.value))}
                      className="h-9" min={0} max={selectedTx?.servicePrice || 0} />
                  </div>
                  {payMethod === 'SPLIT' && (splitCash + splitOnline) !== (selectedTx?.servicePrice || 0) && (
                    <p className="text-xs text-red-500">
                      Total ({formatCurrency(splitCash + splitOnline)}) must equal {formatCurrency(selectedTx?.servicePrice || 0)}
                    </p>
                  )}
                </div>
              )}
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setRecordPayDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={updating} className="bg-blue-500 hover:bg-blue-600">
                {updating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MANAGER LEAVE REQUESTS
// ═══════════════════════════════════════════════════════════════════
function ManagerLeaveRequestsSection({ storeId, authUser }: { storeId: string; authUser?: AuthUser | null }) {
  const { data: leaves, refetch } = useFetch<Leave[]>(
    storeId ? `/api/salon/leaves?branchId=${storeId}&status=PENDING` : null
  );

  const handleAction = useCallback(async (leaveId: string, action: 'APPROVED' | 'REJECTED') => {
    try {
      await apiPatch('/api/salon/leaves', { leaveId, status: action, reviewedBy: authUser?.id || '' });
      toast.success(`Leave ${action.toLowerCase()}`);
      refetch();
    } catch (e) {
      toast.error(`Failed to ${action.toLowerCase()} leave`, { description: (e as Error).message });
    }
  }, [authUser, refetch]);

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarX className="w-4 h-4 text-rose-500" />
            <CardTitle className="text-base">Leave Requests</CardTitle>
          </div>
          <Badge variant="secondary">{(leaves || []).length} pending</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {!(leaves || []).length ? (
          <EmptyState icon={ClipboardCheck} title="No pending leave requests" description="All clear — no requests to review" />
        ) : (
          <div className="space-y-2">
            {(leaves || []).map((lv) => (
              <div key={lv.id} className="flex items-center gap-3 p-3 rounded-xl border hover:shadow-sm transition-all">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="text-xs font-medium bg-gray-100 dark:bg-gray-800">{getInitials(lv.employee?.name || '?')}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{lv.employee?.name}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(lv.date), 'EEE, MMM d')} • {lv.reason}</p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <Button size="sm" className="h-7 text-xs px-2 bg-emerald-500 hover:bg-emerald-600 text-white"
                    onClick={() => handleAction(lv.id, 'APPROVED')}>
                    <UserCheck className="w-3 h-3 mr-0.5" /> Approve
                  </Button>
                  <Button size="sm" className="h-7 text-xs px-2 bg-red-500 hover:bg-red-600 text-white"
                    onClick={() => handleAction(lv.id, 'REJECTED')}>
                    <UserX className="w-3 h-3 mr-0.5" /> Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MANAGER PAYMENT HISTORY
// ═══════════════════════════════════════════════════════════════════
function ManagerPaymentHistorySection({ storeId, authUser }: { storeId: string; authUser?: AuthUser | null }) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const currentMonth = format(new Date(), 'yyyy-MM');
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null);

  const { data: payments, refetch } = useFetch<Payment[]>(
    storeId ? `/api/salon/payments?branchId=${storeId}&month=${selectedMonth}${selectedEmployee !== 'all' ? `&employeeId=${selectedEmployee}` : ''}` : null
  );
  const { data: employees } = useFetch<Employee[]>(storeId ? `/api/salon/employees?storeId=${storeId}` : null);
  const stylists = useMemo(() => (employees || []).filter(e => e.role === 'STYLIST'), [employees]);

  const totalPaid = useMemo(() => (payments || []).reduce((s, p) => s + p.netPaid, 0), [payments]);
  const totalEarned = useMemo(() => (payments || []).reduce((s, p) => s + p.earnedAmount, 0), [payments]);
  const totalDeducted = useMemo(() => (payments || []).reduce((s, p) => s + p.advanceDeducted, 0), [payments]);
  const uniqueEmployees = useMemo(() => {
    const ids = new Set((payments || []).map(p => p.employeeId));
    return ids.size;
  }, [payments]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await fetch(`/api/salon/payments/${id}`, { method: 'DELETE' });
      toast.success('Payment deleted');
      refetch();
    } catch (e) {
      toast.error('Delete failed', { description: (e as Error).message });
    } finally {
      setDeleteDialog(null);
    }
  }, [refetch]);

  const groupedByDate = useMemo(() => {
    const groups: Record<string, Payment[]> = {};
    (payments || []).forEach(p => {
      if (!groups[p.date]) groups[p.date] = [];
      groups[p.date].push(p);
    });
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [payments]);

  const purposeLabel = (p: string) => {
    switch (p) {
      case 'DAILY_EARNINGS': return '💰 Daily';
      case 'WEEKLY_SALARY': return '📅 Weekly';
      case 'MONTHLY_SALARY': return '📆 Monthly';
      case 'BONUS': return '🎁 Bonus';
      case 'SETTLEMENT': return '📋 Settlement';
      default: return p;
    }
  };

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl border bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/10 p-3">
          <p className="text-[10px] font-medium text-muted-foreground uppercase">Total Paid Out</p>
          <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{formatCurrency(totalPaid)}</p>
        </div>
        <div className="rounded-xl border bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/10 p-3">
          <p className="text-[10px] font-medium text-muted-foreground uppercase">Total Earned</p>
          <p className="text-lg font-bold text-blue-700 dark:text-blue-400">{formatCurrency(totalEarned)}</p>
        </div>
        <div className="rounded-xl border bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/30 dark:to-red-900/10 p-3">
          <p className="text-[10px] font-medium text-muted-foreground uppercase">Advance Deducted</p>
          <p className="text-lg font-bold text-red-700 dark:text-red-400">{formatCurrency(totalDeducted)}</p>
        </div>
        <div className="rounded-xl border bg-gradient-to-br from-violet-50 to-violet-100/50 dark:from-violet-950/30 dark:to-violet-900/10 p-3">
          <p className="text-[10px] font-medium text-muted-foreground uppercase">Employees Paid</p>
          <p className="text-lg font-bold text-violet-700 dark:text-violet-400">{uniqueEmployees}</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-emerald-500" />
              <CardTitle className="text-base">Payment History</CardTitle>
              <Badge variant="secondary" className="text-[10px]">{(payments || []).length} records</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}
                className="w-[160px] h-8 text-xs" />
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger className="w-[180px] h-8 text-xs">
                  <SelectValue placeholder="All Employees" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
                  {stylists.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!payments || payments.length === 0 ? (
            <EmptyState icon={Wallet} title="No payments recorded"
              description={selectedMonth === currentMonth ? 'Mark employees as paid from the Daily Payment section below' : `No payments found for ${selectedMonth}`} />
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
              {groupedByDate.map(([date, datePayments]) => {
                const dayTotal = datePayments.reduce((s, p) => s + p.netPaid, 0);
                const isToday = date === today;
                return (
                  <div key={date} className="space-y-2">
                    <div className="flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur-sm py-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold">{isToday ? 'Today' : format(new Date(date + 'T00:00:00'), 'EEE, MMM d')}</span>
                        {isToday && <span className="text-[10px] text-muted-foreground">{date}</span>}
                      </div>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(dayTotal)}</span>
                    </div>
                    {datePayments.map(p => (
                      <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl border bg-card hover:shadow-sm transition-shadow">
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarFallback className="text-[10px] font-medium bg-emerald-100 dark:bg-emerald-900/30">{getInitials(p.employee.name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium truncate">{p.employee.name}</p>
                            <Badge variant="outline" className="text-[9px] px-1 py-0">{purposeLabel(p.purpose)}</Badge>
                            <Badge variant="outline" className="text-[9px] px-1 py-0">
                              {p.paymentMethod === 'CASH' ? '💵' : p.paymentMethod === 'ONLINE' ? '💳' : '✂️'} {p.paymentMethod}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                            <span>Earned: <span className="text-blue-600 dark:text-blue-400">{formatCurrency(p.earnedAmount)}</span></span>
                            {p.advanceDeducted > 0 && <span>Advance: <span className="text-red-600 dark:text-red-400">-{formatCurrency(p.advanceDeducted)}</span></span>}
                            {p.notes && <span className="truncate max-w-[120px]">· {p.notes}</span>}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{formatCurrency(p.netPaid)}</p>
                          <p className="text-[9px] text-muted-foreground">{new Date(p.paidAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {p.receiptNumber && <Badge className="text-[8px] px-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400" variant="outline">RCT-{p.receiptNumber}</Badge>}
                          {authUser && (
                            <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-red-500"
                              onClick={() => setDeleteDialog(p.id)}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Delete Payment?</DialogTitle>
            <DialogDescription className="text-sm">This will permanently remove this payment record. This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteDialog(null)}>Cancel</Button>
            <Button variant="destructive" size="sm" onClick={() => handleDelete(deleteDialog!)}>
              <Trash2 className="w-3 h-3 mr-1" /> Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MANAGER DAILY PAYMENT
// ═══════════════════════════════════════════════════════════════════
function ManagerDailyPaymentSection({ storeId, authUser }: { storeId: string; authUser?: AuthUser | null }) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const { data: employees } = useFetch<Employee[]>(storeId ? `/api/salon/employees?storeId=${storeId}` : null);
  const { data: transactions, refetch: refetchTx } = useFetch<Transaction[]>(
    storeId ? `/api/salon/transactions?storeId=${storeId}&from=${today}&to=${today}` : null
  );
  const { data: advances } = useFetch<Advance[]>(storeId ? `/api/salon/advances?branchId=${storeId}` : null);
  const { data: payments, refetch: refetchPayments } = useFetch<Payment[]>(
    storeId ? `/api/salon/payments?branchId=${storeId}&date=${today}` : null
  );
  const [paying, setPaying] = useState<string | null>(null);

  const employeeSummary = useMemo(() => {
    if (!employees) return [];
    return employees.filter(e => e.role === 'STYLIST').map(emp => {
      const empTxns = (transactions || []).filter(t => t.employeeId === emp.id);
      const earned = empTxns.reduce((s, t) => s + t.employeeNetShare, 0);
      const empAdvances = (advances || []).filter(a => a.employeeId === emp.id && a.status === 'ACTIVE');
      const advanceDeduct = empAdvances.reduce((s, a) => s + a.remainingAmount, 0);
      const netPayable = Math.max(0, earned - advanceDeduct);
      const alreadyPaid = (payments || []).filter(p => p.employeeId === emp.id).reduce((s, p) => s + p.netPaid, 0);
      return { employee: emp, earned, advanceDeduct, netPayable, alreadyPaid, services: empTxns.length };
    });
  }, [employees, transactions, advances, payments]);

  const handleMarkPaid = useCallback(async (empId: string) => {
    const emp = employeeSummary.find(e => e.employee.id === empId);
    if (!emp || emp.alreadyPaid > 0) return;
    setPaying(empId);
    try {
      await apiPost('/api/salon/payments', {
        employeeId: empId,
        branchId: storeId,
        date: today,
        earnedAmount: emp.earned,
        advanceDeducted: emp.advanceDeduct,
        netPaid: emp.netPayable,
        paymentMethod: 'CASH',
        paidBy: authUser?.id || '',
      });
      toast.success(`Payment recorded for ${emp.employee.name}`);
      refetchPayments();
    } catch (e) {
      toast.error('Payment failed', { description: (e as Error).message });
    } finally {
      setPaying(null);
    }
  }, [employeeSummary, storeId, today, authUser?.id, refetchPayments]);

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Wallet className="w-4 h-4 text-indigo-500" />
          <CardTitle className="text-base">Daily Payment</CardTitle>
        </div>
        <CardDescription>Track and record employee payments for today</CardDescription>
      </CardHeader>
      <CardContent>
        {!employeeSummary.length ? (
          <EmptyState icon={Users} title="No stylists found" description="No employees to pay" />
        ) : (
          <div className="space-y-2">
            {employeeSummary.map((emp) => (
              <div key={emp.employee.id} className="flex items-center gap-3 p-3 rounded-xl border">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="text-xs font-medium bg-blue-100 dark:bg-blue-900/30">{getInitials(emp.employee.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{emp.employee.name}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>Earned: <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{formatCurrency(emp.earned)}</span></span>
                    {emp.advanceDeduct > 0 && <span>Advance: <span className="text-red-600 dark:text-red-400 font-semibold">-{formatCurrency(emp.advanceDeduct)}</span></span>}
                    <span>Net: <span className="font-semibold">{formatCurrency(emp.netPayable)}</span></span>
                  </div>
                </div>
                {emp.alreadyPaid > 0 ? (
                  <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Paid {formatCurrency(emp.alreadyPaid)}
                  </Badge>
                ) : emp.netPayable > 0 ? (
                  <Button size="sm" className="h-7 text-xs bg-indigo-500 hover:bg-indigo-600 text-white"
                    disabled={paying === emp.employee.id || emp.services === 0}
                    onClick={() => handleMarkPaid(emp.employee.id)}>
                    {paying === emp.employee.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3 mr-1" />}
                    Mark Paid
                  </Button>
                ) : (
                  <span className="text-xs text-muted-foreground">No earnings</span>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MANAGER WALK-IN QUEUE
// ═══════════════════════════════════════════════════════════════════
function ManagerWalkInQueueSection({ storeId, authUser }: { storeId: string; authUser?: AuthUser | null }) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const { data: walkins, loading, refetch } = useFetch<Appointment[]>(
    storeId ? `/api/salon/walkin?storeId=${storeId}&date=${today}` : null
  );
  const { data: employees } = useFetch<Employee[]>(storeId ? `/api/salon/employees?storeId=${storeId}` : null);
  const { data: services } = useFetch<Service[]>('/api/salon/services');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [walkinForm, setWalkinForm] = useState({ customerName: '', customerPhone: '', employeeId: '', serviceId: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);

  const stylistEmployees = useMemo(() => (employees || []).filter(e => e.role === 'STYLIST' && e.isActive), [employees]);
  const waiting = (walkins || []).filter(w => w.status === 'WALK_IN');
  const inProgress = (walkins || []).filter(w => w.status === 'IN_PROGRESS');
  const completed = (walkins || []).filter(w => w.status === 'COMPLETED');

  const handleAddWalkin = useCallback(async () => {
    if (!walkinForm.customerName || !walkinForm.employeeId || !walkinForm.serviceId) {
      toast.error('Please fill customer name, stylist, and service');
      return;
    }
    setSubmitting(true);
    try {
      await apiPost('/api/salon/walkin', {
        storeId, employeeId: walkinForm.employeeId, serviceId: walkinForm.serviceId,
        customerName: walkinForm.customerName, customerPhone: walkinForm.customerPhone || undefined,
        notes: walkinForm.notes || undefined,
      });
      toast.success('Walk-in added to queue');
      setWalkinForm({ customerName: '', customerPhone: '', employeeId: '', serviceId: '', notes: '' });
      setDialogOpen(false);
      refetch();
    } catch (e) {
      toast.error('Failed to add walk-in', { description: (e as Error).message });
    } finally { setSubmitting(false); }
  }, [storeId, walkinForm, refetch]);

  const handleUpdateStatus = useCallback(async (appointmentId: string, status: string) => {
    try {
      await apiPatch('/api/salon/walkin', { appointmentId, status });
      toast.success(`Walk-in ${status === 'IN_PROGRESS' ? 'started' : status === 'COMPLETED' ? 'completed' : 'cancelled'}`);
      refetch();
    } catch (e) {
      toast.error('Failed to update', { description: (e as Error).message });
    }
  }, [refetch]);

  return (
    <>
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <CardTitle className="text-base">Walk-in Queue</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {waiting.length > 0 && <Badge className="bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">{waiting.length} waiting</Badge>}
              {inProgress.length > 0 && <Badge className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">{inProgress.length} in progress</Badge>}
              <Button size="sm" onClick={() => setDialogOpen(true)} className="bg-amber-500 hover:bg-amber-600 text-xs h-8">
                <UserPlus className="w-3.5 h-3.5 mr-1" /> Add Walk-in
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}</div>
          ) : !walkins?.length ? (
            <EmptyState icon={Users} title="No walk-ins today" description="Add walk-in customers who arrive without appointments" />
          ) : (
            <div className="space-y-4">
              {/* Waiting */}
              {waiting.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mb-2 uppercase tracking-wide">Waiting ({waiting.length})</p>
                  <div className="space-y-2">
                    {waiting.map((w, i) => (
                      <div key={w.id} className="flex items-center gap-3 p-3 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/10">
                        <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-xs font-bold text-amber-700 dark:text-amber-300">#{i + 1}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{w.customer?.name || 'Customer'}</p>
                          <p className="text-xs text-muted-foreground">{w.service?.name} · {w.employee?.name} · {w.time}</p>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          <Button size="sm" className="h-7 text-xs px-2 bg-blue-500 hover:bg-blue-600 text-white" onClick={() => handleUpdateStatus(w.id, 'IN_PROGRESS')}>
                            <Play className="w-3 h-3 mr-0.5" /> Start
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs px-2 text-red-500" onClick={() => handleUpdateStatus(w.id, 'CANCELLED')}>
                            <XCircle className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* In Progress */}
              {inProgress.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-2 uppercase tracking-wide">In Progress ({inProgress.length})</p>
                  <div className="space-y-2">
                    {inProgress.map(w => (
                      <div key={w.id} className="flex items-center gap-3 p-3 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/10">
                        <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                          <Timer className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{w.customer?.name || 'Customer'}</p>
                          <p className="text-xs text-muted-foreground">{w.service?.name} · {w.employee?.name}</p>
                        </div>
                        <Button size="sm" className="h-7 text-xs px-2 bg-emerald-500 hover:bg-emerald-600 text-white" onClick={() => handleUpdateStatus(w.id, 'COMPLETED')}>
                          <CheckCircle2 className="w-3 h-3 mr-0.5" /> Done
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Completed */}
              {completed.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-2 uppercase tracking-wide">Completed ({completed.length})</p>
                  <div className="space-y-1.5">
                    {completed.map(w => (
                      <div key={w.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <p className="text-xs flex-1">{w.customer?.name} — {w.service?.name} by {w.employee?.name}</p>
                        <span className="text-[10px] text-muted-foreground">{formatCurrency(w.service?.price || 0)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Walk-in Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><UserPlus className="w-5 h-5 text-amber-500" /> Add Walk-in Customer</DialogTitle>
            <DialogDescription>Add a customer who arrived without an appointment</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Customer Name *</Label>
                <Input value={walkinForm.customerName} onChange={e => setWalkinForm(f => ({ ...f, customerName: e.target.value }))} placeholder="Enter name" className="h-9" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Phone</Label>
                <Input value={walkinForm.customerPhone} onChange={e => setWalkinForm(f => ({ ...f, customerPhone: e.target.value.replace(/\D/g, '').slice(0, 10) }))} placeholder="Phone (optional)" className="h-9" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Stylist *</Label>
                <Select value={walkinForm.employeeId} onValueChange={v => setWalkinForm(f => ({ ...f, employeeId: v }))}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Select stylist" /></SelectTrigger>
                  <SelectContent>
                    {stylistEmployees.map(emp => <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Service *</Label>
                <Select value={walkinForm.serviceId} onValueChange={v => setWalkinForm(f => ({ ...f, serviceId: v }))}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Select service" /></SelectTrigger>
                  <SelectContent>
                    {(services || []).filter(s => s.isActive).map(svc => <SelectItem key={svc.id} value={svc.id}>{svc.name} ({formatCurrency(svc.price)})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Notes (optional)</Label>
              <Input value={walkinForm.notes} onChange={e => setWalkinForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any special requests..." className="h-9" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="text-xs">Cancel</Button>
            <Button onClick={handleAddWalkin} disabled={submitting || !walkinForm.customerName || !walkinForm.employeeId || !walkinForm.serviceId}
              className="bg-amber-500 hover:bg-amber-600 text-xs">
              {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Add to Queue'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MANAGER CASH REGISTER
// ═══════════════════════════════════════════════════════════════════
function ManagerCashRegisterSection({ storeId, authUser }: { storeId: string; authUser?: AuthUser | null }) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const { data: cashData, refetch, loading } = useFetch<any>(
    storeId ? `/api/salon/cash-register?branchId=${storeId}&date=${today}` : null
  );
  const [openingBalance, setOpeningBalance] = useState(0);
  const [closingBalance, setClosingBalance] = useState(0);
  const [saving, setSaving] = useState(false);
  const [showClose, setShowClose] = useState(false);

  const handleSaveRegister = useCallback(async () => {
    if (!storeId) return;
    setSaving(true);
    try {
      await apiPost('/api/salon/cash-register', {
        branchId: storeId, date: today,
        openingBalance, closingBalance: showClose ? closingBalance : undefined,
        closedBy: authUser?.id || '',
      });
      toast.success(showClose ? 'Cash register closed for the day' : 'Opening balance saved');
      refetch();
    } catch (e) {
      toast.error('Failed to save', { description: (e as Error).message });
    } finally { setSaving(false); }
  }, [storeId, today, openingBalance, closingBalance, showClose, authUser?.id, refetch]);

  const cashVariance = showClose ? (closingBalance - (cashData?.expectedCash || 0) - openingBalance) : 0;

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Banknote className="w-4 h-4 text-emerald-500" />
            <CardTitle className="text-base">Daily Cash Register</CardTitle>
          </div>
          <Badge variant="secondary">{format(new Date(), 'MMM d, yyyy')}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-lg" />)}</div>
        ) : (
          <div className="space-y-4">
            {/* Opening Balance */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="text-sm font-medium">Opening Balance</p>
                  <p className="text-[10px] text-muted-foreground">Cash in drawer at start of day</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">₹</span>
                <Input type="number" value={openingBalance || ''} onChange={e => setOpeningBalance(Number(e.target.value) || 0)}
                  className="w-28 h-8 text-right text-sm font-semibold" placeholder="0" />
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="text-center p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/40">
                <Banknote className="w-4 h-4 mx-auto mb-1 text-emerald-600 dark:text-emerald-400" />
                <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(cashData?.totalCash || 0)}</p>
                <p className="text-[10px] text-muted-foreground">Cash Collections</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/40">
                <Receipt className="w-4 h-4 mx-auto mb-1 text-red-500" />
                <p className="text-base font-bold text-red-600 dark:text-red-400">-{formatCurrency(cashData?.totalExpenses || 0)}</p>
                <p className="text-[10px] text-muted-foreground">Cash Expenses</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-900/40">
                <HandCoins className="w-4 h-4 mx-auto mb-1 text-violet-500" />
                <p className="text-base font-bold text-violet-600 dark:text-violet-400">-{formatCurrency(cashData?.totalPayments || 0)}</p>
                <p className="text-[10px] text-muted-foreground">Staff Payments</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/40">
                <CreditCard className="w-4 h-4 mx-auto mb-1 text-blue-500" />
                <p className="text-base font-bold text-blue-600 dark:text-blue-400">{formatCurrency(cashData?.totalOnline || 0)}</p>
                <p className="text-[10px] text-muted-foreground">Online Collections</p>
              </div>
            </div>

            {/* Expected Cash */}
            <div className="p-3 rounded-xl bg-muted/50 border">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Expected Cash in Drawer</p>
                <p className="text-base font-bold">{formatCurrency(openingBalance + (cashData?.expectedCash || 0))}</p>
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Opening ({formatCurrency(openingBalance)}) + Collections ({formatCurrency(cashData?.totalCash || 0)}) - Expenses ({formatCurrency(cashData?.totalExpenses || 0)}) - Payments ({formatCurrency(cashData?.totalPayments || 0)})
              </p>
            </div>

            {/* Close Register */}
            {showClose && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
                  <div>
                    <p className="text-sm font-medium">Actual Cash in Drawer</p>
                    <p className="text-[10px] text-muted-foreground">Count and enter the actual cash</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">₹</span>
                    <Input type="number" value={closingBalance || ''} onChange={e => setClosingBalance(Number(e.target.value) || 0)}
                      className="w-28 h-8 text-right text-sm font-semibold" placeholder="0" autoFocus />
                  </div>
                </div>
                {/* Variance */}
                {closingBalance > 0 && (
                  <div className={`mt-2 p-3 rounded-xl border ${Math.abs(cashVariance) < 1 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                    <p className="text-sm font-medium">{Math.abs(cashVariance) < 1 ? '✅ Cash matches!' : '⚠️ Cash variance detected'}</p>
                    <p className={`text-xs mt-0.5 ${Math.abs(cashVariance) < 1 ? 'text-emerald-600' : 'text-red-600'}`}>
                      Variance: {cashVariance >= 0 ? '+' : ''}{formatCurrency(cashVariance)}
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button onClick={handleSaveRegister} disabled={saving} variant="outline" className="flex-1 text-xs h-9">
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-1" /> Save Opening Balance</>}
              </Button>
              {!cashData?.isClosed && (
                <Button onClick={() => setShowClose(!showClose)} variant="outline" className={`flex-1 text-xs h-9 ${showClose ? 'border-red-300 text-red-500' : ''}`}>
                  <Lock className="w-4 h-4 mr-1" /> {showClose ? 'Cancel Close' : 'Close Register'}
                </Button>
              )}
              {showClose && (
                <Button onClick={handleSaveRegister} disabled={saving || closingBalance === 0}
                  className="flex-1 text-xs h-9 bg-emerald-500 hover:bg-emerald-600 text-white">
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Confirm Close'}
                </Button>
              )}
              {cashData?.isClosed && (
                <Badge className="flex-1 justify-center h-9 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs">
                  <Lock className="w-3.5 h-3.5 mr-1" /> Register Closed by {(cashData as any)?.closedBy || 'Manager'}
                </Badge>
              )}
            </div>

            {/* Total Revenue Summary */}
            <div className="border-t pt-3">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-lg font-bold">{formatCurrency(cashData?.totalRevenue || 0)}</p>
                  <p className="text-[10px] text-muted-foreground">Total Revenue</p>
                </div>
                <div>
                  <p className="text-lg font-bold">{cashData?.totalServices || 0}</p>
                  <p className="text-[10px] text-muted-foreground">Services Done</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency((cashData?.totalCash || 0) + (cashData?.totalOnline || 0))}</p>
                  <p className="text-[10px] text-muted-foreground">Total Collected</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MANAGER DAY CLOSE
// ═══════════════════════════════════════════════════════════════════
function ManagerDayCloseSection({ storeId, authUser }: { storeId: string; authUser?: AuthUser | null }) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const { data: transactions } = useFetch<Transaction[]>(
    storeId ? `/api/salon/transactions?storeId=${storeId}&from=${today}&to=${today}` : null
  );
  const { data: dayClose, refetch: refetchDayClose } = useFetch<DayClose[]>(
    storeId ? `/api/salon/day-close?branchId=${storeId}&date=${today}` : null
  );
  const [closing, setClosing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const isClosed = (dayClose || []).length > 0 && (dayClose || [])[0]?.isLocked;
  const totalRevenue = useMemo(() => (transactions || []).reduce((s, t) => s + t.servicePrice, 0), [transactions]);
  const totalCash = useMemo(() => (transactions || []).reduce((s, t) => s + (t.cashAmount || 0) + (t.paymentMethod === 'CASH' ? t.servicePrice : 0), 0), [transactions]);
  const totalOnline = useMemo(() => (transactions || []).reduce((s, t) => s + (t.onlineAmount || 0) + (t.paymentMethod === 'ONLINE' ? t.servicePrice : 0), 0), [transactions]);

  const handleClose = useCallback(async () => {
    setClosing(true);
    try {
      await apiPost('/api/salon/day-close', { branchId: storeId, date: today, closedBy: authUser?.id || '' });
      toast.success('Day closed successfully 🔒');
      setConfirmOpen(false);
      refetchDayClose();
    } catch (e) {
      toast.error('Failed to close day', { description: (e as Error).message });
    } finally {
      setClosing(false);
    }
  }, [storeId, today, authUser?.id, refetchDayClose]);

  return (
    <Card className={`shadow-sm ${isClosed ? 'border-emerald-300 dark:border-emerald-700' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isClosed ? <Lock className="w-4 h-4 text-emerald-500" /> : <Unlock className="w-4 h-4 text-amber-500" />}
            <CardTitle className="text-base">Day Close</CardTitle>
          </div>
          {isClosed ? (
            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">Closed</Badge>
          ) : (
            <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">Open</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-center">
            <p className="text-[10px] font-medium text-muted-foreground uppercase">Revenue</p>
            <p className="text-lg font-bold text-rose-600 dark:text-rose-400">{formatCurrency(totalRevenue)}</p>
            <p className="text-[10px] text-muted-foreground">{(transactions || []).length} services</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-center">
            <p className="text-[10px] font-medium text-muted-foreground uppercase">Cash</p>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalCash)}</p>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-center">
            <p className="text-[10px] font-medium text-muted-foreground uppercase">Online</p>
            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{formatCurrency(totalOnline)}</p>
          </div>
        </div>
        {isClosed ? (
          <div className="flex items-center justify-center gap-2 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Day has been closed for {format(new Date(today), 'MMM d, yyyy')}</p>
          </div>
        ) : (
          <Button onClick={() => setConfirmOpen(true)} className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-md" size="lg">
            <Lock className="w-4 h-4 mr-2" />
            Close Day 🔒
          </Button>
        )}

        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Confirm Day Close</DialogTitle>
              <DialogDescription>This will lock all transactions for today. You won&apos;t be able to record new services.</DialogDescription>
            </DialogHeader>
            <div className="space-y-2 p-3 rounded-xl bg-muted/50 dark:bg-muted/20 text-sm">
              <div className="flex justify-between"><span>Total Revenue</span><span className="font-bold">{formatCurrency(totalRevenue)}</span></div>
              <div className="flex justify-between"><span>Cash</span><span className="text-emerald-600 dark:text-emerald-400 font-medium">{formatCurrency(totalCash)}</span></div>
              <div className="flex justify-between"><span>Online</span><span className="text-blue-600 dark:text-blue-400 font-medium">{formatCurrency(totalOnline)}</span></div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
              <Button onClick={handleClose} disabled={closing} className="bg-amber-500 hover:bg-amber-600">
                {closing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4 mr-1" />}
                Confirm Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
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
export function EarningsGoalTracker({ currentEarnings, employeeRole }: { currentEarnings: number; employeeRole: string }) {
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
// KPI DASHBOARD
// ═══════════════════════════════════════════════════════════════════
export function KPIDashboard({ monthAnalytics }: { monthAnalytics: AnalyticsData | null }) {
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
export function ExpenseTracker({ monthAnalytics }: { monthAnalytics: AnalyticsData | null }) {
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
            <div className="overflow-x-auto rounded-xl table-scroll-container -mx-4 px-4 sm:mx-0 sm:px-0">
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
export function StoreComparisonDashboard({ onSelectStore }: { onSelectStore?: (storeId: string) => void }) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const monthAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');

  const { data: stores } = useFetch<Store[]>('/api/salon/stores');
  const storeIds = (stores || []).map(s => s.id);

  const { data: store0Analytics } = useFetch<AnalyticsData>(
    storeIds[0] ? `/api/salon/analytics?storeId=${storeIds[0]}&from=${monthAgo}&to=${today}` : null
  );
  const { data: store1Analytics } = useFetch<AnalyticsData>(
    storeIds[1] ? `/api/salon/analytics?storeId=${storeIds[1]}&from=${monthAgo}&to=${today}` : null
  );
  const { data: store2Analytics } = useFetch<AnalyticsData>(
    storeIds[2] ? `/api/salon/analytics?storeId=${storeIds[2]}&from=${monthAgo}&to=${today}` : null
  );

  const storeAnalytics = [
    { store: stores?.[0], data: store0Analytics, gradient: STORE_GRADIENT_LIGHT[0], gradientDark: STORE_GRADIENTS[0] },
    { store: stores?.[1], data: store1Analytics, gradient: STORE_GRADIENT_LIGHT[1], gradientDark: STORE_GRADIENTS[1] },
    { store: stores?.[2], data: store2Analytics, gradient: STORE_GRADIENT_LIGHT[2], gradientDark: STORE_GRADIENTS[2] },
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
export function OwnerBranchDetailView({ storeId, onBack }: { storeId: string; onBack: () => void }) {
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
// OWNER EXPENSE SECTION
// ═══════════════════════════════════════════════════════════════════
export function OwnerExpenseSection({ monthAnalytics }: { monthAnalytics: AnalyticsData | null }) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
  const lastMonthStart = format(startOfMonth(subDays(new Date(), 30)), 'yyyy-MM-dd');
  const lastMonthEnd = format(endOfMonth(subDays(new Date(), 30)), 'yyyy-MM-dd');

  const [dateRange, setDateRange] = useState<'this-month' | 'last-month' | 'all'>('this-month');
  const [filterStore, setFilterStore] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [expStoreId, setExpStoreId] = useState('');
  const [expCategory, setExpCategory] = useState('');
  const [expDesc, setExpDesc] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expDate, setExpDate] = useState(today);
  const [submitting, setSubmitting] = useState(false);

  const { data: stores } = useFetch<Store[]>('/api/salon/stores');

  const fromDate = dateRange === 'this-month' ? monthStart : dateRange === 'last-month' ? lastMonthStart : '';
  const toDate = dateRange === 'this-month' ? today : dateRange === 'last-month' ? lastMonthEnd : '';

  let expenseUrl = '/api/salon/expenses';
  const params: string[] = [];
  if (fromDate) params.push(`from=${fromDate}`);
  if (toDate) params.push(`to=${toDate}`);
  if (filterStore) params.push(`storeId=${filterStore}`);
  if (filterCategory) params.push(`category=${filterCategory}`);
  if (params.length > 0) expenseUrl += '?' + params.join('&');

  const { data: expenses, loading: expLoading, refetch: refetchExpenses } = useFetch<Expense[]>(expenseUrl);

  const totalExpenses = useMemo(() => (expenses || []).reduce((s, e) => s + e.amount, 0), [expenses]);

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    if (!expenses || expenses.length === 0) return [];
    const map: Record<string, number> = {};
    for (const e of expenses) {
      map[e.category] = (map[e.category] || 0) + e.amount;
    }
    return Object.entries(map)
      .map(([cat, amt]) => ({
        category: cat,
        label: cat.charAt(0) + cat.slice(1).toLowerCase(),
        amount: amt,
        pct: totalExpenses > 0 ? Math.round((amt / totalExpenses) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [expenses, totalExpenses]);

  // Pie chart data
  const pieData = useMemo(() => {
    const COLORS: Record<string, string> = {
      RENT: '#f59e0b', UTILITIES: '#3b82f6', SALARY: '#10b981',
      SUPPLIES: '#8b5cf6', MAINTENANCE: '#f97316', MARKETING: '#ec4899', OTHER: '#6b7280',
    };
    return categoryBreakdown.map(c => ({
      name: c.label,
      value: c.amount,
      fill: COLORS[c.category] || '#6b7280',
    }));
  }, [categoryBreakdown]);

  // Bar chart data
  const barData = useMemo(() => {
    return categoryBreakdown.map(c => ({
      category: c.label,
      amount: c.amount,
      fill: pieData.find(p => p.name === c.label)?.fill || '#6b7280',
    }));
  }, [categoryBreakdown, pieData]);

  // Net profit
  const ownerShare = monthAnalytics?.totalOwnerShare || 0;
  const netProfit = ownerShare - totalExpenses;

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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <span className="w-1 h-5 rounded-full bg-gradient-to-b from-red-500 to-rose-500" />
                Expense Management
              </h2>
              <p className="text-sm text-muted-foreground ml-3">Track and manage salon operating costs</p>
            </div>
            <Button size="sm" onClick={() => setDialogOpen(true)}
              className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 shadow-md shadow-rose-500/20 w-fit">
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Expense
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Filters row */}
          <div className="flex flex-wrap gap-2">
            {/* Date Range Pills */}
            <div className="flex gap-1 bg-muted/50 dark:bg-muted/20 rounded-lg p-0.5">
              {([['this-month', 'This Month'], ['last-month', 'Last Month'], ['all', 'All Time']] as const).map(([key, label]) => (
                <button key={key} onClick={() => setDateRange(key)}
                  className={`px-2.5 py-1 text-[10px] font-medium rounded-md transition-all duration-200 ${
                    dateRange === key
                      ? 'bg-background text-rose-600 dark:text-rose-400 shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}>
                  {label}
                </button>
              ))}
            </div>
            {/* Store Filter */}
            <Select value={filterStore} onValueChange={(v) => setFilterStore(v === '__all__' ? '' : v)}>
              <SelectTrigger className="w-[160px] h-8 text-xs">
                <SelectValue placeholder="All Stores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Stores</SelectItem>
                {(stores || []).map(s => <SelectItem key={s.id} value={s.id}>{s.name.replace('Dream Look - ', '')}</SelectItem>)}
              </SelectContent>
            </Select>
            {/* Category Filter */}
            <Select value={filterCategory} onValueChange={(v) => setFilterCategory(v === '__all__' ? '' : v)}>
              <SelectTrigger className="w-[150px] h-8 text-xs">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Categories</SelectItem>
                {EXPENSE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Summary Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl border hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                </div>
              </div>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Total Expenses</p>
              <p className="text-base font-bold text-red-600 dark:text-red-400">{formatCurrency(totalExpenses)}</p>
              <p className="text-[10px] text-muted-foreground">{(expenses || []).length} transactions</p>
            </div>
            <div className="p-4 rounded-xl border hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Owner Revenue</p>
              <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(ownerShare)}</p>
              <p className="text-[10px] text-muted-foreground">{dateRange === 'this-month' ? 'This month' : dateRange === 'last-month' ? 'Last month' : 'All time'}</p>
            </div>
            <div className="p-4 rounded-xl border hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-8 h-8 rounded-lg ${netProfit >= 0 ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30'} flex items-center justify-center`}>
                  <DollarSign className={`w-4 h-4 ${netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`} />
                </div>
              </div>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Net Profit</p>
              <p className={`text-base font-bold ${netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>{formatCurrency(netProfit)}</p>
              <p className="text-[10px] text-muted-foreground">Revenue − Expenses</p>
            </div>
            <div className="p-4 rounded-xl border hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                  <Flame className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                </div>
              </div>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Top Category</p>
              <p className="text-base font-bold text-violet-600 dark:text-violet-400">{categoryBreakdown[0]?.label || '—'}</p>
              <p className="text-[10px] text-muted-foreground">{categoryBreakdown[0] ? `${categoryBreakdown[0].pct}% of total` : 'No data'}</p>
            </div>
          </div>

          {/* Charts */}
          {categoryBreakdown.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Pie Chart */}
              <div className="rounded-xl border p-4">
                <h3 className="text-sm font-medium mb-3">Expense Distribution</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3} dataKey="value" stroke="none">
                      {pieData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.fill} />
                      ))}
                    </Pie>
                    <RTooltip formatter={(v: number) => formatCurrency(v)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-2 mt-2 justify-center">
                  {pieData.map((entry) => (
                    <div key={entry.name} className="flex items-center gap-1.5 text-[10px]">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.fill }} />
                      <span className="text-muted-foreground">{entry.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bar Chart */}
              <div className="rounded-xl border p-4">
                <h3 className="text-sm font-medium mb-3">Category Breakdown</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={barData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`} />
                    <YAxis type="category" dataKey="category" width={90} tick={{ fontSize: 11 }} />
                    <RTooltip formatter={(v: number) => formatCurrency(v)} />
                    <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                      {barData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Category Breakdown Badges */}
          {categoryBreakdown.length > 0 && (
            <div className="rounded-xl border p-4">
              <h3 className="text-sm font-medium mb-3">Category-wise Breakdown</h3>
              <div className="space-y-3">
                {categoryBreakdown.map((cat) => {
                  const config = EXPENSE_CATEGORY_CONFIG[cat.category] || EXPENSE_CATEGORY_CONFIG.OTHER;
                  return (
                    <div key={cat.category} className="flex items-center gap-3">
                      <div className="flex items-center gap-2 w-28 shrink-0">
                        <ExpenseCategoryBadge category={cat.category} />
                      </div>
                      <div className="flex-1 h-2 bg-muted/50 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${config.bg.replace(/dark:bg-\S+/g, '').trim()}`}
                          style={{ width: `${cat.pct}%`, backgroundColor: pieData.find(p => p.name === cat.label)?.fill }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-muted-foreground w-20 text-right shrink-0">{formatCurrency(cat.amount)}</span>
                      <span className="text-xs font-medium text-muted-foreground w-10 text-right shrink-0">{cat.pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Expenses Table */}
          {expLoading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}</div>
          ) : !expenses || expenses.length === 0 ? (
            <EmptyState icon={Receipt} title="No expenses found" description="No expenses match the selected filters. Try adjusting the date range or filters." />
          ) : (
            <div className="overflow-x-auto rounded-xl border table-scroll-container -mx-4 px-4 sm:mx-0 sm:px-0">
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
                  {expenses.map((exp, idx) => (
                    <TableRow key={exp.id} className={`hover:bg-muted/50 transition-colors ${idx % 2 === 0 ? '' : 'bg-muted/20'}`}>
                      <TableCell className="text-xs whitespace-nowrap">{format(new Date(exp.expenseDate), 'MMM d, yyyy')}</TableCell>
                      <TableCell className="text-xs font-medium">{exp.store?.name?.replace('Dream Look - ', '') || '—'}</TableCell>
                      <TableCell><ExpenseCategoryBadge category={exp.category} /></TableCell>
                      <TableCell className="text-xs text-muted-foreground hidden sm:table-cell max-w-[250px] truncate">{exp.description}</TableCell>
                      <TableCell className="text-right text-sm font-medium text-red-600 dark:text-red-400">
                        -{formatCurrency(exp.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={4} className="font-semibold text-xs">Total ({(expenses || []).length} expenses)</TableCell>
                    <TableCell className="text-right font-bold text-red-600 dark:text-red-400">-{formatCurrency(totalExpenses)}</TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Expense Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Receipt className="w-4 h-4 text-rose-500" /> Add New Expense</DialogTitle>
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

// ─── EMPLOYEE PERFORMANCE LEADERBOARD ──────────────────────────
export function EmployeeLeaderboard({ employees, performance }: {
  employees: Employee[];
  performance: Array<{
    employeeId: string; employeeName: string; transactions: number;
    totalRevenue: number; totalEarnings: number; avgPerTransaction: number;
  }>;
}) {
  const ranked = useMemo(() => {
    return [...performance]
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .map((emp, i) => {
        const empData = employees.find(e => e.id === emp.employeeId);
        const storeName = empData?.store?.name || 'Unknown';
        // Simulate trend: random improvement for demo
        const trendSeed = emp.employeeId.charCodeAt(0) + emp.employeeId.charCodeAt(1);
        const trendDir = trendSeed % 3 === 0 ? 'up' : trendSeed % 3 === 1 ? 'down' : 'neutral';
        const trendPct = (trendSeed % 15) + 5;
        return { ...emp, rank: i + 1, storeName, trend: trendDir as 'up' | 'down' | 'neutral', trendPct };
      });
  }, [performance, employees]);

  const medalConfig = [
    { emoji: '🥇', label: '1st', ring: 'ring-amber-400', bg: 'bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/40 dark:to-yellow-950/40', border: 'border-amber-200 dark:border-amber-700' },
    { emoji: '🥈', label: '2nd', ring: 'ring-gray-400', bg: 'bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-950/40 dark:to-slate-950/40', border: 'border-gray-200 dark:border-gray-600' },
    { emoji: '🥉', label: '3rd', ring: 'ring-orange-400', bg: 'bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/40 dark:to-amber-950/40', border: 'border-orange-200 dark:border-orange-700' },
  ];

  return (
    <GlassCard>
      <CardContent className="p-0">
        <div className="p-5 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-sm">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-bold">Employee Leaderboard</h3>
                <p className="text-xs text-muted-foreground">Top performers this month across all stores</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200 dark:border-rose-800">
              <Medal className="w-3 h-3 mr-1" />
              {ranked.length} Employees
            </Badge>
          </div>
        </div>

        {ranked.length === 0 ? (
          <div className="p-6">
            <EmptyState icon={Trophy} title="No performance data yet" description="Data will appear as employees complete services" />
          </div>
        ) : (
          <div className="px-5 pb-5 space-y-2">
            {ranked.map((emp) => {
              const isTop3 = emp.rank <= 3;
              const medal = isTop3 ? medalConfig[emp.rank - 1] : null;
              return (
                <motion.div
                  key={emp.employeeId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: emp.rank * 0.05, duration: 0.3 }}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 hover:shadow-md ${
                    isTop3
                      ? `${medal!.bg} ${medal!.border} border`
                      : 'hover:bg-muted/30 border-transparent'
                  }`}
                >
                  {/* Rank */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-sm ${
                    isTop3 ? `${medal!.ring} ring-2` : 'bg-muted/50'
                  }`}>
                    {isTop3 ? medal!.emoji : <span className="text-muted-foreground">{emp.rank}</span>}
                  </div>

                  {/* Avatar */}
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarFallback className={`text-xs font-semibold ${
                      emp.rank === 1
                        ? 'bg-gradient-to-br from-amber-400 to-yellow-500 text-white'
                        : emp.rank === 2
                        ? 'bg-gradient-to-br from-gray-300 to-slate-400 text-white'
                        : emp.rank === 3
                        ? 'bg-gradient-to-br from-orange-400 to-amber-500 text-white'
                        : 'bg-muted'
                    }`}>
                      {getInitials(emp.employeeName)}
                    </AvatarFallback>
                  </Avatar>

                  {/* Name + Store */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold truncate">{emp.employeeName}</p>
                      {emp.trend === 'up' && (
                        <span className="inline-flex items-center text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                          <TrendingUp className="w-3 h-3 mr-0.5" />{emp.trendPct}%
                        </span>
                      )}
                      {emp.trend === 'down' && (
                        <span className="inline-flex items-center text-[10px] font-semibold text-red-500 dark:text-red-400">
                          <TrendingDown className="w-3 h-3 mr-0.5" />{emp.trendPct}%
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Store className="w-3 h-3" />
                      <span className="truncate">{emp.storeName}</span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="hidden sm:flex items-center gap-4 text-right shrink-0">
                    <div>
                      <p className="text-xs text-muted-foreground">Services</p>
                      <p className="text-sm font-semibold">{emp.transactions}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Revenue</p>
                      <p className="text-sm font-semibold">{formatCurrency(emp.totalRevenue)}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted-foreground">Earnings</p>
                    <p className={`text-sm font-bold ${emp.totalEarnings >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                      {formatCurrency(emp.totalEarnings)}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </CardContent>
    </GlassCard>
  );
}
