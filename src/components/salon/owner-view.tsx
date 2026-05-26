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
  FileText, ArrowUpDown,
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
import { OwnerCustomerAnalyticsSection } from './manager-view';
import type { CustomerAnalyticsData } from './manager-view';
import {
  KPIDashboard, ExpenseTracker, StoreComparisonDashboard, OwnerBranchDetailView,
  OwnerExpenseSection, EmployeeLeaderboard,
} from './manager-view';

export function OwnerView() {
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

  const ownerSections = [
    { id: 'owner-overview', label: 'Overview' },
    { id: 'owner-stores', label: 'Stores' },
    { id: 'owner-payments', label: 'Payments' },
    { id: 'owner-customers', label: 'Customers' },
    { id: 'owner-expenses', label: 'Expenses' },
    { id: 'owner-services', label: 'Services' },
    { id: 'owner-staff', label: 'Staff' },
    { id: 'owner-settlement', label: 'Settlement' },
    { id: 'owner-audit', label: 'Audit Log' },
  ];
  const activeOwnerSection = useActiveSection(ownerSections.map(s => s.id));

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
      {/* Section Navigation */}
      <SectionNav sections={ownerSections} activeSection={activeOwnerSection} />

      {/* Revenue Cards */}
      <div id="owner-overview" className="scroll-mt-36 space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Zap} label="Today" value={formatCurrency(animatedTodayRev)} sub={`${todayAnalytics?.totalTransactions || 0} transactions`} gradient="bg-gradient-to-r from-rose-500 to-pink-500" />
        <StatCard icon={TrendingUp} label="This Week" value={formatCurrency(animatedWeekRev)} sub={`${weekAnalytics?.totalTransactions || 0} transactions`} gradient="bg-gradient-to-r from-blue-500 to-indigo-500" />
        <StatCard icon={Target} label="This Month" value={formatCurrency(animatedMonthRev)} sub={`${monthAnalytics?.totalTransactions || 0} transactions`} gradient="bg-gradient-to-r from-emerald-500 to-green-500" />
        <StatCard icon={Crown} label="This Year" value={formatCurrency(animatedYearRev)} sub={`${yearAnalytics?.totalTransactions || 0} transactions`} gradient="bg-gradient-to-r from-amber-500 to-orange-500" />
      </div>

      {/* KPI Dashboard */}
      <KPIDashboard monthAnalytics={monthAnalytics} />

      {/* Payment Breakdown (Cash vs Online vs Split) */}
      <PaymentBreakdownCard analytics={monthAnalytics} title="Monthly Payment Breakdown" />

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
                          ? 'bg-background text-rose-600 dark:text-rose-400 shadow-sm'
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
      </div>{/* end owner-overview */}

      {/* Service Popularity Enhanced Chart */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
        <GlassCard>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-sm">
                  <Flame className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Top Services by Bookings</h3>
                  <p className="text-xs text-muted-foreground">Most popular services by booking count & revenue</p>
                </div>
              </div>
            </div>
            {serviceChartData.length === 0 ? (
              <EmptyState icon={Layers} title="No service data yet" description="Popularity data will appear as bookings are made" />
            ) : (
              <div className="space-y-3">
                <ResponsiveContainer width="100%" height={Math.max(serviceChartData.length * 48, 200)}>
                  <BarChart data={serviceChartData} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
                    <RTooltip
                      formatter={(value: number, name: string) => {
                        if (name === 'revenue') return [formatCurrency(value), 'Revenue'];
                        return [value, 'Bookings'];
                      }}
                    />
                    <Bar dataKey="count" name="count" fill="#f43f5e" radius={[0, 6, 6, 0]} barSize={24}>
                      {serviceChartData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={index === 0 ? '#f43f5e' : index === 1 ? '#fb7185' : index === 2 ? '#fda4af' : '#fecdd3'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                {/* Revenue badges */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {serviceChartData.slice(0, 5).map((s, i) => (
                    <div key={s.name} className="flex items-center gap-1.5 text-xs bg-muted/50 dark:bg-muted/20 rounded-full px-2.5 py-1">
                      <span className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-rose-500' : i === 1 ? 'bg-rose-400' : i === 2 ? 'bg-rose-300' : 'bg-rose-200 dark:bg-rose-700'}`} />
                      <span className="font-medium">{s.name}</span>
                      <span className="text-muted-foreground">{s.count} bookings</span>
                      <span className="text-rose-600 dark:text-rose-400 font-semibold">{formatCurrency(s.revenue)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </GlassCard>
      </motion.div>

      {/* Store Comparison */}
      <div id="owner-stores" className="scroll-mt-36">
      <StoreComparisonDashboard onSelectStore={(storeId) => setSelectedBranchId(storeId)} />
      </div>

      {/* Employee Performance Leaderboard */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
        <EmployeeLeaderboard
          employees={employees || []}
          performance={(monthAnalytics || yearAnalytics)?.employeePerformance || []}
        />
      </motion.div>

      {/* All Store Payment Records */}
      <div id="owner-payments" className="scroll-mt-36">
      <OwnerPaymentRecords />
      </div>

      {/* Customer Analytics */}
      <div id="owner-customers" className="scroll-mt-36">
      <OwnerCustomerAnalyticsSection />
      </div>

      {/* Expense Tracker (basic) */}
      {/* Expense Management (comprehensive) */}
      <div id="owner-expenses" className="scroll-mt-36 space-y-6">
      <ExpenseTracker monthAnalytics={monthAnalytics} />
      <OwnerExpenseSection monthAnalytics={monthAnalytics} />
      </div>

      {/* Staff Performance */}
      <div id="owner-staff" className="scroll-mt-36 space-y-6">
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
            <div className="overflow-x-auto rounded-xl table-scroll-container -mx-4 px-4 sm:mx-0 sm:px-0">
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
                <StaggerContainer className="contents">
                <TableBody>
                  {(yearAnalytics || monthAnalytics)!.employeePerformance.map((emp, i) => (
                    <StaggerItem key={emp.employeeId}>
                    <TableRow className="hover:bg-muted/50 transition-colors">
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
                    </StaggerItem>
                  ))}
                </TableBody>
                </StaggerContainer>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── SERVICE CATALOG MANAGEMENT ──────────────────────── */}
      <div id="owner-services" className="scroll-mt-36 space-y-6">
      <OwnerServiceCatalogSection />
      </div>

      {/* ─── STAFF MANAGEMENT ────────────────────────────────── */}
      <OwnerStaffManagementSection />

      {/* ─── ADVANCE MANAGEMENT ─────────────────────────────── */}
      <OwnerAdvanceManagementSection />
      </div>{/* end owner-staff */}

      {/* ─── AUDIT LOG TIMELINE ─────────────────────────────── */}
      <div id="owner-audit" className="scroll-mt-36 space-y-6">
      <OwnerAuditLogSection />
      </div>

      {/* ─── MY PROFIT CALCULATION ──────────────────────────── */}
      <OwnerProfitSection monthAnalytics={monthAnalytics} />

      {/* ─── SETTLEMENT ENGINE ────────────────────────────────── */}
      <div id="owner-settlement" className="scroll-mt-36">
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
                  <div className="overflow-x-auto rounded-xl table-scroll-container -mx-4 px-4 sm:mx-0 sm:px-0">
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
                          <TableRow key={b.appointmentId} className={`${idx % 2 === 0 ? 'bg-card' : 'bg-muted/30 dark:bg-muted/10'} hover:bg-muted/50 transition-colors`}>
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
      </div>{/* end owner-settlement */}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// OWNER SERVICE CATALOG MANAGEMENT
// ═══════════════════════════════════════════════════════════════════
function OwnerServiceCatalogSection() {
  const { data: services, refetch } = useFetch<Service[]>('/api/salon/services');
  const [editId, setEditId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState(0);
  const [newCategory, setNewCategory] = useState('HAIRCUT');
  const [newDuration, setNewDuration] = useState(30);
  const [newOwnerPct, setNewOwnerPct] = useState(50);
  const [adding, setAdding] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const handleAdd = useCallback(async () => {
    if (!newName.trim() || newPrice <= 0) return;
    setAdding(true);
    try {
      await apiPost('/api/salon/services', {
        name: newName.trim(),
        price: newPrice,
        category: newCategory,
        duration: newDuration,
        ownerPercent: newOwnerPct,
        employeePercent: 100 - newOwnerPct,
      });
      toast.success('Service added');
      setNewName(''); setNewPrice(0); setAddOpen(false);
      refetch();
    } catch (e) {
      toast.error('Failed to add service', { description: (e as Error).message });
    } finally {
      setAdding(false);
    }
  }, [newName, newPrice, newCategory, newDuration, newOwnerPct, refetch]);

  const handleToggleActive = useCallback(async (svc: Service) => {
    try {
      await apiPatch(`/api/salon/services/${svc.id}`, { isActive: !svc.isActive });
      toast.success(svc.isActive ? 'Service deactivated' : 'Service activated');
      refetch();
    } catch (e) {
      toast.error('Failed to update', { description: (e as Error).message });
    }
  }, [refetch]);

  const handleUpdateCommission = useCallback(async (svc: Service, ownerPct: number) => {
    const empPct = 100 - ownerPct;
    try {
      await apiPatch(`/api/salon/services/${svc.id}`, { ownerPercent: ownerPct, employeePercent: empPct });
      toast.success(`Commission updated: ${ownerPct}%/${empPct}%`);
      refetch();
    } catch (e) {
      toast.error('Failed to update commission', { description: (e as Error).message });
    }
  }, [refetch]);

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <CardTitle className="text-base">Service Catalog</CardTitle>
          </div>
          <Button size="sm" onClick={() => setAddOpen(true)} className="bg-amber-500 hover:bg-amber-600 text-xs h-8">
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Service
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Service Form */}
        {addOpen && (
          <div className="p-4 rounded-xl border-2 border-dashed border-amber-300 dark:border-amber-700 space-y-3">
            <h4 className="text-sm font-semibold">New Service</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Name</Label>
                <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Service name" className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Price (₹)</Label>
                <Input type="number" value={newPrice} onChange={e => setNewPrice(Number(e.target.value))} className="h-9" min={0} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Category</Label>
                <Select value={newCategory} onValueChange={setNewCategory}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SERVICE_CATEGORIES.filter(c => c !== 'ALL').map(c => (
                      <SelectItem key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Duration (min)</Label>
                <Input type="number" value={newDuration} onChange={e => setNewDuration(Number(e.target.value))} className="h-9" min={5} step={5} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Commission Split: Owner {newOwnerPct}% / Employee {100 - newOwnerPct}%</Label>
              <Slider value={[newOwnerPct]} onValueChange={([v]) => setNewOwnerPct(v)} min={10} max={90} step={5} />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAdd} disabled={!newName.trim() || newPrice <= 0 || adding} className="bg-amber-500 hover:bg-amber-600 text-xs h-8">
                {adding ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3 mr-1" />}
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={() => setAddOpen(false)} className="text-xs h-8">Cancel</Button>
            </div>
          </div>
        )}

        {/* Service List */}
        <div className="space-y-2">
          {(services || []).map((svc) => (
            <div key={svc.id} className={`flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl border ${!svc.isActive ? 'opacity-50' : ''}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{svc.name}</p>
                  <Badge variant="outline" className="text-[10px]">{svc.category}</Badge>
                  {!svc.isActive && <Badge className="bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">Inactive</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">{formatCurrency(svc.price)} • {svc.duration}min</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 flex-1 sm:flex-initial min-w-[180px]">
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">Commission:</span>
                  <Slider
                    value={[svc.ownerPercent || 50]}
                    onValueChange={([v]) => handleUpdateCommission(svc, v)}
                    min={10} max={90} step={5}
                    className="flex-1"
                  />
                  <span className="text-xs font-semibold w-16 text-right">
                    {svc.ownerPercent || 50}%/{svc.employeePercent || 50}%
                  </span>
                </div>
                <Switch checked={svc.isActive} onCheckedChange={() => handleToggleActive(svc)} />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════
// OWNER STAFF MANAGEMENT
// ═══════════════════════════════════════════════════════════════════
function OwnerStaffManagementSection() {
  const { data: employees, refetch } = useFetch<Employee[]>('/api/salon/employees');
  const { data: stores } = useFetch<Store[]>('/api/salon/stores');
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRole, setNewRole] = useState('STYLIST');
  const [newStoreId, setNewStoreId] = useState('');
  const [adding, setAdding] = useState(false);
  const [transferEmpId, setTransferEmpId] = useState<string | null>(null);
  const [transferStoreId, setTransferStoreId] = useState('');

  const handleAdd = useCallback(async () => {
    if (!newName.trim() || !newPhone.trim() || !newStoreId) return;
    setAdding(true);
    try {
      await apiPost('/api/salon/staff', { name: newName.trim(), phone: newPhone.trim(), role: newRole, storeId: newStoreId });
      toast.success(`${newRole} added successfully`);
      setNewName(''); setNewPhone(''); setAddOpen(false);
      refetch();
    } catch (e) {
      toast.error('Failed to add staff', { description: (e as Error).message });
    } finally {
      setAdding(false);
    }
  }, [newName, newPhone, newRole, newStoreId, refetch]);

  const handleToggleActive = useCallback(async (emp: Employee) => {
    try {
      await apiPatch('/api/salon/staff', { employeeId: emp.id, isActive: !emp.isActive });
      toast.success(emp.isActive ? 'Staff deactivated' : 'Staff activated');
      refetch();
    } catch (e) {
      toast.error('Failed to update staff', { description: (e as Error).message });
    }
  }, [refetch]);

  const handleTransfer = useCallback(async (empId: string) => {
    if (!transferStoreId) return;
    try {
      await apiPatch('/api/salon/staff', { employeeId: empId, storeId: transferStoreId });
      toast.success('Employee transferred');
      setTransferEmpId(null);
      refetch();
    } catch (e) {
      toast.error('Transfer failed', { description: (e as Error).message });
    }
  }, [transferStoreId, refetch]);

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-500" />
            <CardTitle className="text-base">Staff Management</CardTitle>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => { setNewRole('STYLIST'); setAddOpen(true); }}
              className="bg-emerald-500 hover:bg-emerald-600 text-xs h-8">
              <UserPlus className="w-3.5 h-3.5 mr-1" /> Stylist
            </Button>
            <Button size="sm" onClick={() => { setNewRole('MANAGER'); setAddOpen(true); }}
              className="bg-blue-500 hover:bg-blue-600 text-xs h-8">
              <UserPlus className="w-3.5 h-3.5 mr-1" /> Manager
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {addOpen && (
          <div className="p-4 rounded-xl border-2 border-dashed border-amber-300 dark:border-amber-700 space-y-3">
            <h4 className="text-sm font-semibold">Add {newRole === 'MANAGER' ? 'Manager' : 'Stylist'}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Name</Label>
                <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Full name" className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Phone</Label>
                <Input value={newPhone} onChange={e => setNewPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="Phone number" className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Branch</Label>
                <Select value={newStoreId} onValueChange={setNewStoreId}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Select branch" /></SelectTrigger>
                  <SelectContent>
                    {(stores || []).map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAdd} disabled={!newName.trim() || !newPhone.trim() || !newStoreId || adding} className="bg-amber-500 hover:bg-amber-600 text-xs h-8">
                {adding ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3 mr-1" />}
                Add
              </Button>
              <Button size="sm" variant="outline" onClick={() => setAddOpen(false)} className="text-xs h-8">Cancel</Button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {(employees || []).map((emp) => (
            <div key={emp.id} className={`flex items-center gap-3 p-3 rounded-xl border ${!emp.isActive ? 'opacity-50' : ''}`}>
              <Avatar className="h-9 w-9">
                <AvatarFallback className="text-xs font-medium bg-amber-100 dark:bg-amber-900/30">{getInitials(emp.name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{emp.name}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="text-[10px] px-1.5">{emp.role}</Badge>
                  <span>{emp.store?.name}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button size="sm" variant="outline" className="text-xs h-7 px-2" onClick={() => { setTransferEmpId(emp.id); setTransferStoreId(emp.storeId); }}>
                  <Store className="w-3 h-3 mr-1" /> Transfer
                </Button>
                <Switch checked={emp.isActive} onCheckedChange={() => handleToggleActive(emp)} />
              </div>
            </div>
          ))}
        </div>

        <Dialog open={!!transferEmpId} onOpenChange={(v) => !v && setTransferEmpId(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Transfer Employee</DialogTitle>
              <DialogDescription>Move employee to a different branch</DialogDescription>
            </DialogHeader>
            <Select value={transferStoreId} onValueChange={setTransferStoreId}>
              <SelectTrigger className="h-9"><SelectValue placeholder="Select branch" /></SelectTrigger>
              <SelectContent>
                {(stores || []).map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setTransferEmpId(null)}>Cancel</Button>
              <Button onClick={() => transferEmpId && handleTransfer(transferEmpId)} className="bg-amber-500 hover:bg-amber-600">Transfer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════
// OWNER ADVANCE MANAGEMENT
// ═══════════════════════════════════════════════════════════════════
function OwnerAdvanceManagementSection() {
  const { data: advances, refetch } = useFetch<Advance[]>('/api/salon/advances');
  const { data: employees } = useFetch<Employee[]>('/api/salon/employees');
  const { data: stores } = useFetch<Store[]>('/api/salon/stores');
  const [giveOpen, setGiveOpen] = useState(false);
  const [advEmpId, setAdvEmpId] = useState('');
  const [advAmount, setAdvAmount] = useState(0);
  const [advReason, setAdvReason] = useState('');
  const [advStoreId, setAdvStoreId] = useState('');
  const [giving, setGiving] = useState(false);

  const handleGive = useCallback(async () => {
    if (!advEmpId || advAmount <= 0) return;
    setGiving(true);
    try {
      await apiPost('/api/salon/advances', {
        employeeId: advEmpId,
        branchId: advStoreId,
        amount: advAmount,
        reason: advReason.trim() || 'General',
      });
      toast.success(`Advance of ${formatCurrency(advAmount)} given`);
      setGiveOpen(false); setAdvAmount(0); setAdvReason('');
      refetch();
    } catch (e) {
      toast.error('Failed to give advance', { description: (e as Error).message });
    } finally {
      setGiving(false);
    }
  }, [advEmpId, advStoreId, advAmount, advReason, refetch]);

  const totalOutstanding = useMemo(() => (advances || []).reduce((s, a) => s + a.remainingAmount, 0), [advances]);
  const totalRecovered = useMemo(() => (advances || []).reduce((s, a) => s + a.recoveredAmount, 0), [advances]);

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HandCoins className="w-4 h-4 text-amber-500" />
            <CardTitle className="text-base">Advance Management</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">Outstanding: {formatCurrency(totalOutstanding)}</Badge>
            <Button size="sm" onClick={() => setGiveOpen(true)} className="bg-amber-500 hover:bg-amber-600 text-xs h-8">
              <HandCoins className="w-3.5 h-3.5 mr-1" /> Give Advance
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {giveOpen && (
          <div className="p-4 rounded-xl border-2 border-dashed border-amber-300 dark:border-amber-700 space-y-3">
            <h4 className="text-sm font-semibold">Give Advance</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Employee</Label>
                <Select value={advEmpId} onValueChange={setAdvEmpId}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Select employee" /></SelectTrigger>
                  <SelectContent>
                    {(employees || []).map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Amount (₹)</Label>
                <Input type="number" value={advAmount} onChange={e => setAdvAmount(Number(e.target.value))} className="h-9" min={0} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Branch</Label>
                <Select value={advStoreId} onValueChange={setAdvStoreId}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Select branch" /></SelectTrigger>
                  <SelectContent>
                    {(stores || []).map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Reason</Label>
              <Input value={advReason} onChange={e => setAdvReason(e.target.value)} placeholder="Reason for advance..." className="h-9" />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleGive} disabled={!advEmpId || advAmount <= 0 || !advStoreId || giving} className="bg-amber-500 hover:bg-amber-600 text-xs h-8">
                {giving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3 mr-1" />}
                Give Advance
              </Button>
              <Button size="sm" variant="outline" onClick={() => setGiveOpen(false)} className="text-xs h-8">Cancel</Button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {(advances || []).sort((a, b) => b.date.localeCompare(a.date)).map((adv) => (
            <div key={adv.id} className="flex items-center gap-3 p-3 rounded-xl border">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="text-xs font-medium bg-amber-100 dark:bg-amber-900/30">{getInitials(adv.employee?.name || '?')}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{adv.employee?.name}</p>
                <p className="text-xs text-muted-foreground">{adv.reason} • {format(new Date(adv.date), 'MMM d')}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold">{formatCurrency(adv.amount)}</p>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-emerald-600 dark:text-emerald-400">Recovered: {formatCurrency(adv.recoveredAmount)}</span>
                  <StatusBadge status={adv.status} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════
// OWNER AUDIT LOG TIMELINE
// ═══════════════════════════════════════════════════════════════════
function OwnerAuditLogSection() {
  const { data: logs } = useFetch<AuditLog[]>('/api/salon/audit-logs');
  const [filterAction, setFilterAction] = useState('ALL');
  const { data: stores } = useFetch<Store[]>('/api/salon/stores');
  const [filterBranch, setFilterBranch] = useState('ALL');

  const filtered = useMemo(() => {
    if (!logs) return [];
    return logs.filter(log => {
      if (filterAction !== 'ALL' && !log.action.toLowerCase().includes(filterAction.toLowerCase())) return false;
      if (filterBranch !== 'ALL' && log.branchId !== filterBranch) return false;
      return true;
    });
  }, [logs, filterAction, filterBranch]);

  function getLogColor(action: string) {
    const a = action.toLowerCase();
    if (a.includes('edit') || a.includes('update') || a.includes('modify')) return 'border-l-red-500 bg-red-50/50 dark:bg-red-950/10';
    if (a.includes('commission') || a.includes('percent')) return 'border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/10';
    if (a.includes('unlock') || a.includes('day')) return 'border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/10';
    if (a.includes('advance') || a.includes('payment')) return 'border-l-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/10';
    if (a.includes('leave')) return 'border-l-purple-500 bg-purple-50/50 dark:bg-purple-950/10';
    if (a.includes('create') || a.includes('add')) return 'border-l-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/10';
    if (a.includes('deactivate') || a.includes('delete') || a.includes('remove')) return 'border-l-gray-500 bg-gray-50/50 dark:bg-gray-950/10';
    return 'border-l-rose-500 bg-rose-50/50 dark:bg-rose-950/10';
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <FileWarning className="w-4 h-4 text-amber-500" />
            <CardTitle className="text-base">Audit Log</CardTitle>
          </div>
          <div className="flex gap-2">
            <Select value={filterBranch} onValueChange={setFilterBranch}>
              <SelectTrigger className="h-7 w-[130px] text-xs"><SelectValue placeholder="Branch" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Branches</SelectItem>
                {(stores || []).map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterAction} onValueChange={setFilterAction}>
              <SelectTrigger className="h-7 w-[120px] text-xs"><SelectValue placeholder="Action" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Actions</SelectItem>
                <SelectItem value="commission">Commission</SelectItem>
                <SelectItem value="advance">Advance</SelectItem>
                <SelectItem value="payment">Payment</SelectItem>
                <SelectItem value="leave">Leave</SelectItem>
                <SelectItem value="day">Day Close</SelectItem>
                <SelectItem value="create">Create</SelectItem>
                <SelectItem value="deactivate">Deactivate</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!filtered.length ? (
          <EmptyState icon={FileWarning} title="No audit logs" description="Audit entries will appear here as changes are made" />
        ) : (
          <ScrollArea className="max-h-80">
            <div className="space-y-2 pr-2">
              {filtered.slice(0, 50).map((log) => (
                <div key={log.id} className={`p-3 rounded-xl border-l-4 ${getLogColor(log.action)}`}>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{log.action}</p>
                    <span className="text-[10px] text-muted-foreground">
                      {log.timestamp ? format(new Date(log.timestamp), 'MMM d, hh:mm a') : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <span>by {log.employee?.name || log.performedBy || 'System'}</span>
                    {log.oldValue && <span className="text-red-500">from: {log.oldValue.length > 50 ? log.oldValue.slice(0, 50) + '...' : log.oldValue}</span>}
                    {log.newValue && <span className="text-emerald-500">to: {log.newValue.length > 50 ? log.newValue.slice(0, 50) + '...' : log.newValue}</span>}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════
// OWNER PROFIT CALCULATION
// ═══════════════════════════════════════════════════════════════════
function OwnerProfitSection({ monthAnalytics }: { monthAnalytics: AnalyticsData | null }) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
  const { data: monthExpenses } = useFetch<Expense[]>(`/api/salon/expenses?from=${monthStart}&to=${today}`);
  const { data: advances } = useFetch<Advance[]>('/api/salon/advances');

  const totalRevenue = monthAnalytics?.totalRevenue || 0;
  const employeeEarnings = monthAnalytics?.totalEmployeePayout || 0;
  const totalExpenses = useMemo(() => (monthExpenses || []).reduce((s, e) => s + e.amount, 0), [monthExpenses]);
  const advancesGiven = useMemo(() => {
    if (!advances) return 0;
    const monthStr = today.slice(0, 7);
    return advances.filter(a => a.date.startsWith(monthStr)).reduce((s, a) => s + a.amount, 0);
  }, [advances, today]);

  const myProfit = totalRevenue - employeeEarnings - totalExpenses - advancesGiven;

  return (
    <Card className="shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 p-5 text-white">
        <div className="flex items-center gap-2 mb-1">
          <Crown className="w-5 h-5" />
          <h3 className="text-lg font-bold">MY PROFIT</h3>
        </div>
        <p className="text-sm text-white/80">Revenue − Employee Earnings − Expenses − Advances Given</p>
      </div>
      <CardContent className="p-5">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-center">
            <p className="text-[10px] font-medium text-muted-foreground uppercase">Revenue</p>
            <p className="text-base font-bold text-rose-600 dark:text-rose-400">{formatCurrency(totalRevenue)}</p>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-center">
            <p className="text-[10px] font-medium text-muted-foreground uppercase">Employee Payout</p>
            <p className="text-base font-bold text-blue-600 dark:text-blue-400">-{formatCurrency(employeeEarnings)}</p>
          </div>
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/20 text-center">
            <p className="text-[10px] font-medium text-muted-foreground uppercase">Expenses</p>
            <p className="text-base font-bold text-red-600 dark:text-red-400">-{formatCurrency(totalExpenses)}</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-center">
            <p className="text-[10px] font-medium text-muted-foreground uppercase">Advances Given</p>
            <p className="text-base font-bold text-amber-600 dark:text-amber-400">-{formatCurrency(advancesGiven)}</p>
          </div>
          <div className={`p-3 rounded-xl text-center col-span-2 md:col-span-1 ${myProfit >= 0 ? 'bg-emerald-50 dark:bg-emerald-950/20' : 'bg-red-50 dark:bg-red-950/20'}`}>
            <p className="text-[10px] font-medium text-muted-foreground uppercase">My Profit</p>
            <p className={`text-xl font-bold ${myProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatCurrency(myProfit)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════
// RECORD SERVICE DIALOG
// ═══════════════════════════════════════════════════════════════════
export function RecordServiceDialog({ open, onClose, appointment, onSuccess }: {
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

// ═══════════════════════════════════════════════════════════════════
// OWNER PAYMENT RECORDS — All Store Payment History
// ═══════════════════════════════════════════════════════════════════
function OwnerPaymentRecords() {
  const currentMonth = format(new Date(), 'yyyy-MM');
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedStore, setSelectedStore] = useState<string>('all');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');

  const { data: stores } = useFetch<Store[]>('/api/salon/stores');
  const { data: employees } = useFetch<Employee[]>('/api/salon/employees');
  const { data: payments } = useFetch<Payment[]>(
    `/api/salon/payments?month=${selectedMonth}${selectedStore !== 'all' ? `&branchId=${selectedStore}` : ''}${selectedEmployee !== 'all' ? `&employeeId=${selectedEmployee}` : ''}`
  );

  const totalPaidOut = useMemo(() => (payments || []).reduce((s, p) => s + p.netPaid, 0), [payments]);
  const totalEarned = useMemo(() => (payments || []).reduce((s, p) => s + p.earnedAmount, 0), [payments]);
  const totalDeducted = useMemo(() => (payments || []).reduce((s, p) => s + p.advanceDeducted, 0), [payments]);
  const cashPayments = useMemo(() => (payments || []).filter(p => p.paymentMethod === 'CASH').reduce((s, p) => s + p.netPaid, 0), [payments]);
  const onlinePayments = useMemo(() => (payments || []).filter(p => p.paymentMethod === 'ONLINE').reduce((s, p) => s + p.netPaid, 0), [payments]);

  // Group by store
  const byStore = useMemo(() => {
    const map: Record<string, { storeName: string; total: number; count: number }> = {};
    (payments || []).forEach(p => {
      if (!map[p.employee.id]) {
        map[p.employee.id] = { storeName: p.store?.name || 'Unknown', total: 0, count: 0 };
      }
      map[p.employee.id].total += p.netPaid;
      map[p.employee.id].count += 1;
    });
    return map;
  }, [payments]);

  const storeGroups = useMemo(() => {
    const map: Record<string, Payment[]> = {};
    (payments || []).forEach(p => {
      const key = p.store?.name || 'Unknown';
      if (!map[key]) map[key] = [];
      map[key].push(p);
    });
    return Object.entries(map).sort(([a, aP], [b, bP]) => bP.reduce((s, p) => s + p.netPaid, 0) - aP.reduce((s, p) => s + p.netPaid, 0));
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
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="rounded-xl border bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/10 p-3">
          <p className="text-[10px] font-medium text-muted-foreground uppercase">Total Paid Out</p>
          <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{formatCurrency(totalPaidOut)}</p>
        </div>
        <div className="rounded-xl border bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/10 p-3">
          <p className="text-[10px] font-medium text-muted-foreground uppercase">Total Earned</p>
          <p className="text-lg font-bold text-blue-700 dark:text-blue-400">{formatCurrency(totalEarned)}</p>
        </div>
        <div className="rounded-xl border bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/30 dark:to-red-900/10 p-3">
          <p className="text-[10px] font-medium text-muted-foreground uppercase">Advance Deducted</p>
          <p className="text-lg font-bold text-red-700 dark:text-red-400">{formatCurrency(totalDeducted)}</p>
        </div>
        <div className="rounded-xl border bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/10 p-3">
          <p className="text-[10px] font-medium text-muted-foreground uppercase">💵 Cash</p>
          <p className="text-lg font-bold text-amber-700 dark:text-amber-400">{formatCurrency(cashPayments)}</p>
        </div>
        <div className="rounded-xl border bg-gradient-to-br from-violet-50 to-violet-100/50 dark:from-violet-950/30 dark:to-violet-900/10 p-3">
          <p className="text-[10px] font-medium text-muted-foreground uppercase">💳 Online</p>
          <p className="text-lg font-bold text-violet-700 dark:text-violet-400">{formatCurrency(onlinePayments)}</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-emerald-500" />
              <CardTitle className="text-base">All Store Payments</CardTitle>
              <Badge variant="secondary" className="text-[10px]">{(payments || []).length} records</Badge>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}
                className="w-[150px] h-8 text-xs" />
              <Select value={selectedStore} onValueChange={setSelectedStore}>
                <SelectTrigger className="w-[180px] h-8 text-xs">
                  <SelectValue placeholder="All Stores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stores</SelectItem>
                  {(stores || []).map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger className="w-[170px] h-8 text-xs">
                  <SelectValue placeholder="All Employees" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
                  {(employees || []).filter(e => e.role === 'STYLIST').map(e => (
                    <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!payments || payments.length === 0 ? (
            <EmptyState icon={Wallet} title="No payments recorded"
              description={`No payment records found for ${selectedMonth === currentMonth ? 'this month' : selectedMonth}`} />
          ) : (
            <div className="space-y-6 max-h-[600px] overflow-y-auto pr-1">
              {storeGroups.map(([storeName, storePayments]) => {
                const storeTotal = storePayments.reduce((s, p) => s + p.netPaid, 0);
                const storeEarned = storePayments.reduce((s, p) => s + p.earnedAmount, 0);
                return (
                  <div key={storeName}>
                    <div className="flex items-center justify-between mb-2 pb-1 border-b">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-xs font-semibold">{storeName}</span>
                        <Badge variant="outline" className="text-[9px]">{storePayments.length} payments</Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-muted-foreground">Earned: <span className="text-blue-600 dark:text-blue-400 font-semibold">{formatCurrency(storeEarned)}</span></span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">Paid: {formatCurrency(storeTotal)}</span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      {storePayments.map(p => (
                        <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-lg border bg-card/50 hover:bg-card transition-colors">
                          <Avatar className="h-7 w-7 shrink-0">
                            <AvatarFallback className="text-[9px] font-medium bg-emerald-100 dark:bg-emerald-900/30">{getInitials(p.employee.name)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs font-medium truncate">{p.employee.name}</p>
                              <Badge variant="outline" className="text-[8px] px-1 py-0">{purposeLabel(p.purpose)}</Badge>
                              <Badge variant="outline" className="text-[8px] px-1 py-0">
                                {p.paymentMethod === 'CASH' ? '💵' : '💳'} {p.paymentMethod}
                              </Badge>
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                              {isToday(p.date) ? 'Today' : format(new Date(p.date + 'T00:00:00'), 'MMM d')} · {new Date(p.paidAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                              {p.notes && ` · ${p.notes}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] shrink-0">
                            {p.advanceDeducted > 0 && (
                              <span className="text-red-500">-{formatCurrency(p.advanceDeducted)}</span>
                            )}
                            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 min-w-[60px] text-right">{formatCurrency(p.netPaid)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
