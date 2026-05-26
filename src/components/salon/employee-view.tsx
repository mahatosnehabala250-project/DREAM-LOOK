'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Calendar, Check, CheckCircle2, Clock, ChevronRight, User, Users,
  BarChart3, TrendingUp, TrendingDown, Zap, Target, IndianRupee, Package,
  Activity, History, Play, RefreshCw, Calculator, Plus, Star, Trophy,
  Timer, LogIn, LogOut, UserCheck, UserPlus, Percent,
  Banknote, CreditCard, Receipt, Sparkles, AlertTriangle, Wallet, Smartphone,
  CalendarX, ClipboardCheck, HandCoins, Flame, ArrowUpRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { format, isToday, subDays, formatDistanceToNow } from 'date-fns';
import type { Appointment, AuthUser, Transaction, Service, Product, Employee, Advance, Leave, AttendanceRecord, Payment } from '@/lib/salon-types';
import { useFetch, useAnimatedNumber } from '@/lib/salon-hooks';
import { formatTime, formatCurrency, getInitials, calculateCommission, apiPost,
  formatCurrency as _fc,
} from '@/lib/salon-utils';
import {
  ViewSkeleton, GlassCard, StatCard, EmptyState, StatusBadge,
  LiveClock, SectionNav, ErrorBoundary, StaggerContainer, StaggerItem,
} from './common';
import { EarningsGoalTracker } from './manager-view';

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

// ─── EMPLOYEE DAILY GOALS TRACKER ──────────────────────────────
function EmployeeDailyGoalsTracker({ currentEarnings }: { currentEarnings: number }) {
  const [target, setTarget] = useState(2000);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(target));

  const percentage = useMemo(() => {
    if (target <= 0) return 0;
    return Math.min((currentEarnings / target) * 100, 100);
  }, [currentEarnings, target]);

  const motivationalMessage = useMemo(() => {
    if (percentage >= 100) return { text: 'Target achieved! 🎉', color: 'text-emerald-600 dark:text-emerald-400' };
    if (percentage >= 75) return { text: 'So close!', color: 'text-rose-600 dark:text-rose-400' };
    if (percentage >= 50) return { text: 'Almost there!', color: 'text-amber-600 dark:text-amber-400' };
    if (percentage >= 25) return { text: 'Great start!', color: 'text-blue-600 dark:text-blue-400' };
    return { text: 'Keep going!', color: 'text-muted-foreground' };
  }, [percentage]);

  const handleSaveTarget = useCallback(() => {
    const val = parseInt(editValue);
    if (val > 0 && val <= 100000) {
      setTarget(val);
      toast.success(`Daily target set to ${formatCurrency(val)}`);
    }
    setIsEditing(false);
  }, [editValue]);

  const circumference = 2 * Math.PI * 54; // radius = 54
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Card className="shadow-sm border border-rose-100 dark:border-rose-900/40 bg-gradient-to-r from-rose-50/50 via-pink-50/30 to-fuchsia-50/30 dark:from-rose-950/10 dark:via-pink-950/5 dark:to-fuchsia-950/5">
        <CardContent className="p-5">
          <div className="flex items-center gap-6">
            {/* Circular Progress Ring */}
            <div className="relative shrink-0">
              <svg width="140" height="140" viewBox="0 0 120 120" className="transform -rotate-90">
                {/* Background circle */}
                <circle
                  cx="60" cy="60" r="54"
                  fill="none"
                  stroke="currentColor"
                  className="text-muted/30"
                  strokeWidth="8"
                />
                {/* Progress circle */}
                <motion.circle
                  cx="60" cy="60" r="54"
                  fill="none"
                  stroke="url(#goalGradient)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                  strokeDasharray={circumference}
                />
                <defs>
                  <linearGradient id="goalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f43f5e" />
                    <stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>
                </defs>
              </svg>
              {/* Center text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span
                  key={Math.round(percentage)}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  className="text-2xl font-bold"
                >
                  {Math.round(percentage)}%
                </motion.span>
                <span className="text-[10px] text-muted-foreground font-medium">of goal</span>
              </div>
            </div>

            {/* Goal details */}
            <div className="flex-1 min-w-0 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold">Daily Earnings Goal</h3>
                <button
                  onClick={() => { setIsEditing(true); setEditValue(String(target)); }}
                  className="text-xs text-rose-600 dark:text-rose-400 hover:underline font-medium cursor-pointer"
                >
                  Edit Target
                </button>
              </div>

              {/* Earnings vs Target */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-background/60 dark:bg-background/40 rounded-lg p-2.5 border border-border/30">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Earned</p>
                  <p className="text-lg font-bold text-rose-600 dark:text-rose-400">{formatCurrency(currentEarnings)}</p>
                </div>
                <div className="bg-background/60 dark:bg-background/40 rounded-lg p-2.5 border border-border/30">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Target</p>
                  <p className="text-lg font-bold">{formatCurrency(target)}</p>
                </div>
              </div>

              {/* Remaining / Surplus */}
              <div className="flex items-center justify-between">
                <span className={`text-sm font-semibold ${motivationalMessage.color}`}>
                  {motivationalMessage.text}
                </span>
                <span className="text-xs text-muted-foreground">
                  {currentEarnings >= target
                    ? `+${formatCurrency(currentEarnings - target)} extra`
                    : `${formatCurrency(target - currentEarnings)} remaining`
                  }
                </span>
              </div>
            </div>
          </div>

          {/* Edit Target Dialog (inline) */}
          <AnimatePresence>
            {isEditing && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-4 pt-4 border-t border-border/30 flex items-center gap-3">
                  <Label className="text-xs font-medium shrink-0">₹ Target:</Label>
                  <Input
                    type="number"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="h-9 w-32 text-sm"
                    min={100}
                    max={100000}
                    step={100}
                    autoFocus
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSaveTarget(); if (e.key === 'Escape') setIsEditing(false); }}
                  />
                  <Button size="sm" onClick={handleSaveTarget} className="h-9 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700">
                    <Check className="w-3.5 h-3.5 mr-1" /> Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)} className="h-9">
                    Cancel
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function EmployeeView({ onCompleteService, authUser }: EmployeeViewProps) {
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

  // ─── Employee Self Attendance ────────────────────────────
  const { data: myAttendance, refetch: refetchMyAtt } = useFetch<AttendanceRecord[]>(
    activeEmployeeId ? `/api/salon/attendance?employeeId=${activeEmployeeId}&date=${today}` : null
  );
  const myTodayAtt = (myAttendance || [])[0] || null;
  const isCheckedIn = !!myTodayAtt?.checkIn;
  const isCheckedOut = !!myTodayAtt?.checkOut;
  const [checkingIn, setCheckingIn] = useState(false);

  // ─── Customer Tracking (Old vs New) ──────────────────────
  const [newCustomerCount, setNewCustomerCount] = useState(0);
  const [oldCustomerCount, setOldCustomerCount] = useState(0);
  const [serviceEntryOpen, setServiceEntryOpen] = useState(false);

  const handleServiceRecorded = useCallback((isNewCustomer: boolean) => {
    if (isNewCustomer) setNewCustomerCount(c => c + 1);
    else setOldCustomerCount(c => c + 1);
  }, []);

  const handleSelfCheckIn = useCallback(async () => {
    if (!activeEmployeeId || !authUser) return;
    setCheckingIn(true);
    try {
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      await apiPost('/api/salon/attendance', { employeeId: activeEmployeeId, storeId: authUser.storeId, date: today, checkIn: timeStr, status: 'PRESENT', markedBy: activeEmployeeId });
      toast.success('Checked in successfully! ✅');
      refetchMyAtt();
    } catch (e) {
      toast.error('Check-in failed', { description: (e as Error).message });
    } finally { setCheckingIn(false); }
  }, [activeEmployeeId, authUser, today, refetchMyAtt]);

  const handleSelfCheckOut = useCallback(async () => {
    if (!activeEmployeeId || !authUser) return;
    setCheckingIn(true);
    try {
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      await apiPost('/api/salon/attendance', { employeeId: activeEmployeeId, storeId: authUser.storeId, date: today, checkOut: timeStr, markedBy: activeEmployeeId });
      toast.success('Checked out successfully! Goodbye 👋');
      refetchMyAtt();
    } catch (e) {
      toast.error('Check-out failed', { description: (e as Error).message });
    } finally { setCheckingIn(false); }
  }, [activeEmployeeId, authUser, today, refetchMyAtt]);

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

      {/* ─── DAILY GOALS TRACKER ────────────────────────────── */}
      {authUser && (
        <EmployeeDailyGoalsTracker currentEarnings={todayEarnings.net} />
      )}

      {/* ─── SELF CHECK-IN / CHECK-OUT CARD ───────────────── */}
      {authUser && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Card className={`shadow-md overflow-hidden border-2 ${!isCheckedIn ? 'border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50 to-background dark:from-emerald-950/20 dark:to-background' : isCheckedIn && !isCheckedOut ? 'border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-background dark:from-amber-950/20 dark:to-background' : 'border-border bg-gradient-to-br from-muted/30 to-background dark:from-muted/10 dark:to-background'}`}>
            <CardContent className="p-5">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${!isCheckedIn ? 'bg-emerald-100 dark:bg-emerald-900/40' : isCheckedIn && !isCheckedOut ? 'bg-amber-100 dark:bg-amber-900/40' : 'bg-muted dark:bg-muted/50'}`}>
                  {!isCheckedIn ? <LogIn className="w-8 h-8 text-emerald-600 dark:text-emerald-400" /> : isCheckedIn && !isCheckedOut ? <Timer className="w-8 h-8 text-amber-600 dark:text-amber-400" /> : <CheckCircle2 className="w-8 h-8 text-gray-500 dark:text-gray-400" />}
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-base font-bold">
                    {!isCheckedIn ? 'You have not checked in yet' : isCheckedIn && !isCheckedOut ? 'You are currently working' : 'Day completed!'}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {!isCheckedIn ? `Tap "Check In" to mark your attendance for today (${format(new Date(), 'EEEE, MMM d')})` :
                      isCheckedIn && !isCheckedOut ? `Checked in at ${myTodayAtt?.checkIn} · ${formatDistanceToNow(new Date(`${today}T${myTodayAtt?.checkIn}:00`), { addSuffix: true })}` :
                      `In: ${myTodayAtt?.checkIn} → Out: ${myTodayAtt?.checkOut}`}
                  </p>
                </div>
                <div className="shrink-0">
                  {!isCheckedIn && (
                    <Button size="lg" onClick={handleSelfCheckIn} disabled={checkingIn}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-8 h-12 text-base shadow-lg shadow-emerald-500/20">
                      {checkingIn ? <RefreshCw className="w-5 h-5 animate-spin" /> : <><LogIn className="w-5 h-5 mr-2" /> Check In</>}
                    </Button>
                  )}
                  {isCheckedIn && !isCheckedOut && (
                    <Button size="lg" onClick={handleSelfCheckOut} disabled={checkingIn}
                      className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-8 h-12 text-base shadow-lg shadow-amber-500/20">
                      {checkingIn ? <RefreshCw className="w-5 h-5 animate-spin" /> : <><LogOut className="w-5 h-5 mr-2" /> Check Out</>}
                    </Button>
                  )}
                  {isCheckedOut && (
                    <Badge variant="secondary" className="text-sm px-4 py-2 bg-muted dark:bg-muted/50">
                      <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-500" /> Day Done
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Quick Service Entry — Card */}
      {authUser && (
        <EmployeeQuickServiceEntry
          employeeId={activeEmployeeId}
          storeId={authUser.storeId}
          dialogOpen={serviceEntryOpen}
          onDialogChange={setServiceEntryOpen}
          onServiceRecorded={handleServiceRecorded}
          onSuccess={() => { refetchToday(); refetchSchedule(); }}
        />
      )}

      {/* Quick Stats */}
      <QuickStatsCard todayTransactions={todayTransactions || []} weekTransactions={weekTransactions || []} />

      {/* ─── TODAY'S HIGHLIGHT ────────────────────────────── */}
      {authUser && (todayTransactions || []).length > 0 && (() => {
        const topService = [...(todayTransactions || [])].sort((a, b) => (b.servicePrice || 0) - (a.servicePrice || 0))[0];
        if (!topService) return null;
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="shadow-sm border border-rose-100 dark:border-rose-900/40 bg-gradient-to-r from-rose-50/50 via-pink-50/30 to-fuchsia-50/30 dark:from-rose-950/10 dark:via-pink-950/5 dark:to-fuchsia-950/5 overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-sm">
                      <Trophy className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold">Today&apos;s Highlight</h3>
                      <p className="text-[10px] text-muted-foreground">Top service today</p>
                    </div>
                  </div>
                  <Badge className="bg-gradient-to-r from-rose-500 to-pink-600 text-white border-0 text-[10px]">
                    {topService.paymentMethod === 'CASH' ? '💵 Cash' : topService.paymentMethod === 'ONLINE' ? '💳 Online' : '✂️ Split'}
                  </Badge>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{topService.service?.name}</p>
                    <p className="text-xs text-muted-foreground">{topService.service?.category} &bull; {topService.customer?.name || 'Customer'}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">{formatCurrency(topService.servicePrice || 0)}</p>
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">+{formatCurrency(topService.employeeNetShare)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })()}

      {/* ─── TODAY'S CUSTOMER TRACKING (Old vs New) ──────── */}
      {authUser && (newCustomerCount > 0 || oldCustomerCount > 0) && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="shadow-sm border border-amber-100 dark:border-amber-900/40 bg-gradient-to-r from-amber-50/50 to-emerald-50/50 dark:from-amber-950/10 dark:to-emerald-950/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <h3 className="text-sm font-semibold">Today&apos;s Customer Report</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-800/40 flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{newCustomerCount}</p>
                    <p className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">New Customers</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-800/40 flex items-center justify-center">
                    <UserCheck className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{oldCustomerCount}</p>
                    <p className="text-[10px] font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wide">Old Customers</p>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <span>Total: <strong>{newCustomerCount + oldCustomerCount}</strong> customers served today</span>
                {newCustomerCount > 0 && (
                  <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-[10px]">
                    {newCustomerCount + oldCustomerCount > 0 ? Math.round((newCustomerCount / (newCustomerCount + oldCustomerCount)) * 100) : 0}% new
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Earnings Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={Zap} label="Today's Net" value={formatCurrency(animatedToday)} sub={`${todayEarnings.count} services · gross ${formatCurrency(todayEarnings.gross)}`} gradient="bg-gradient-to-r from-rose-500 to-pink-500" />
        <StatCard icon={TrendingUp} label="This Week" value={formatCurrency(animatedWeek)} sub={`${(weekTransactions || []).length} services`} gradient="bg-gradient-to-r from-blue-500 to-indigo-500" />
        <StatCard icon={Target} label="This Month" value={formatCurrency(animatedMonth)} sub={`${(monthTransactions || []).length} services`} gradient="bg-gradient-to-r from-emerald-500 to-green-500" />
      </div>

      {/* Monthly Target */}
      <EarningsGoalTracker currentEarnings={monthEarnings} employeeRole={currentEmp?.role || 'STYLIST'} />

      {/* My Payment History */}
      <EmployeePaymentHistory employeeId={selectedEmployee} />

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
            <StaggerContainer className="space-y-3">
              {schedule.sort((a, b) => a.time.localeCompare(b.time)).map((apt) => {
                const canComplete = apt.status === 'CONFIRMED' || apt.status === 'PENDING';
                const isCompleted = apt.status === 'COMPLETED';
                return (
                  <StaggerItem key={apt.id}>
                  <div className={`hover:scale-[1.005] transition-transform
                    flex items-center gap-4 p-3 rounded-xl border transition-all ${
                      isCompleted ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800' :
                      'bg-card hover:shadow-md border-border'
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
                  </StaggerItem>
                );
              })}
            </StaggerContainer>
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
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium truncate">{tx.service?.name}</p>
                      {tx.paymentMethod && (
                        <span className={`shrink-0 text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${
                          tx.paymentMethod === 'CASH' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' :
                          tx.paymentMethod === 'ONLINE' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' :
                          'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                        }`}>
                          {tx.paymentMethod === 'CASH' ? '💵' : tx.paymentMethod === 'ONLINE' ? '📱' : '✂️'} {tx.paymentMethod}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{tx.completedAt ? format(new Date(tx.completedAt), 'hh:mm a') : ''}</span>
                      {tx.productsUsed.length > 0 && (
                        <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full">
                          {tx.productsUsed.length} product{tx.productsUsed.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    {/* Split payment details */}
                    {tx.paymentMethod === 'SPLIT' && (tx.cashAmount > 0 || tx.onlineAmount > 0) && (
                      <div className="flex items-center gap-2 mt-0.5 text-[10px]">
                        <span className="text-emerald-600 dark:text-emerald-400">Cash: {formatCurrency(tx.cashAmount)}</span>
                        <span className="text-muted-foreground">+</span>
                        <span className="text-blue-600 dark:text-blue-400">Online: {formatCurrency(tx.onlineAmount)}</span>
                      </div>
                    )}
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
            {/* Payment summary footer */}
            {(todayTransactions || []).length > 0 && (
              <div className="flex items-center justify-between mt-3 pt-3 border-t text-xs">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Cash: <strong>{formatCurrency((todayTransactions || []).reduce((s, t) => s + (t.cashAmount || 0), 0))}</strong>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    Online: <strong>{formatCurrency((todayTransactions || []).reduce((s, t) => s + (t.onlineAmount || 0), 0))}</strong>
                  </span>
                </div>
                <span className="text-muted-foreground">
                  Total: <strong>{formatCurrency((todayTransactions || []).reduce((s, t) => s + t.servicePrice, 0))}</strong>
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ─── MY ENTRIES HISTORY ──────────────────────────────── */}
      {authUser && (
        <MyEntriesHistory employeeId={authUser.id} branchId={authUser.storeId} />
      )}

      {/* ─── MY ADVANCE ─────────────────────────────────────── */}
      {authUser && (
        <MyAdvanceSection employeeId={authUser.id} branchId={authUser.storeId} />
      )}

      {/* ─── LEAVE MANAGEMENT ───────────────────────────────── */}
      {authUser && (
        <LeaveManagementSection employeeId={authUser.id} branchId={authUser.storeId} authName={authUser.name} />
      )}

      {/* ─── COMMISSION PREVIEW ─────────────────────────────── */}
      {authUser && (
        <CommissionPreviewSection employeeId={authUser.id} branchId={authUser.storeId} />
      )}

      {/* ─── MY ATTENDANCE HISTORY ─────────────────────────── */}
      {authUser && (
        <MyAttendanceHistory employeeId={authUser.id} branchId={authUser.storeId} />
      )}

      {/* ─── FLOATING FAB: Quick Service Entry ────────────── */}
      {authUser && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.5 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setServiceEntryOpen(true)}
          className="fixed bottom-20 right-4 lg:bottom-8 lg:right-8 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-xl shadow-rose-500/30 flex items-center justify-center hover:shadow-2xl hover:shadow-rose-500/40 transition-shadow group"
          title="New Service Entry"
        >
          <span className="absolute inset-0 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 animate-pulse-ring opacity-30" />
          <Plus className="w-7 h-7 relative z-10 group-hover:rotate-90 transition-transform duration-300" />
        </motion.button>
      )}
    </div>
  );
}

// ─── MY ENTRIES HISTORY (Employee) ────────────────────────────
function MyEntriesHistory({ employeeId, branchId }: { employeeId: string; branchId: string }) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const monthAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
  const { data: entries } = useFetch<Transaction[]>(
    `/api/salon/transactions?employeeId=${employeeId}&from=${monthAgo}&to=${today}`
  );

  function PaymentMethodBadge({ method }: { method: string }) {
    if (method === 'CASH') return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold"><Banknote className="w-3 h-3" /> Cash</span>;
    if (method === 'ONLINE') return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[10px] font-semibold"><CreditCard className="w-3 h-3" /> Online</span>;
    if (method === 'SPLIT') return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-[10px] font-semibold"><Receipt className="w-3 h-3" /> Split</span>;
    return <Badge variant="outline" className="text-[10px]">{method || 'N/A'}</Badge>;
  }

  const sorted = useMemo(() => (entries || []).sort((a, b) => {
    const ta = new Date(b.completedAt || '').getTime();
    const tb = new Date(a.completedAt || '').getTime();
    return ta - tb;
  }), [entries]);

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-500" />
            <CardTitle className="text-base">My Entries History</CardTitle>
          </div>
          <Badge variant="secondary">{sorted.length} entries (30d)</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {!sorted.length ? (
          <EmptyState icon={Receipt} title="No entries yet" description="Your completed services will appear here" />
        ) : (
          <ScrollArea className="max-h-80">
            <div className="space-y-2 pr-2">
              {sorted.map((tx) => (
                <div key={tx.id} className="flex items-center gap-3 p-3 rounded-xl border hover:shadow-sm transition-all">
                  <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{tx.service?.name}</p>
                      <PaymentMethodBadge method={tx.paymentMethod} />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <span>{tx.completedAt ? format(new Date(tx.completedAt), 'MMM d, hh:mm a') : ''}</span>
                      {tx.store?.name && <span>• {tx.store.name}</span>}
                    </div>
                    {tx.paymentMethod === 'SPLIT' && (
                      <div className="flex gap-2 text-[10px] text-muted-foreground mt-0.5">
                        <span className="text-emerald-600 dark:text-emerald-400">Cash: {formatCurrency(tx.cashAmount)}</span>
                        <span className="text-blue-600 dark:text-blue-400">Online: {formatCurrency(tx.onlineAmount)}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">+{formatCurrency(tx.employeeNetShare)}</p>
                    <p className="text-[10px] text-muted-foreground">{formatCurrency(tx.servicePrice)} total</p>
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

// ─── MY ADVANCE (Employee) ─────────────────────────────────────
function MyAdvanceSection({ employeeId, branchId }: { employeeId: string; branchId: string }) {
  const { data: advances, refetch } = useFetch<Advance[]>(
    `/api/salon/advances?employeeId=${employeeId}&branchId=${branchId}`
  );
  const totalRemaining = useMemo(() => (advances || []).reduce((s, a) => s + a.remainingAmount, 0), [advances]);
  const totalRecovered = useMemo(() => (advances || []).reduce((s, a) => s + a.recoveredAmount, 0), [advances]);

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <HandCoins className="w-4 h-4 text-amber-500" />
          <CardTitle className="text-base">My Advance</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-center">
            <p className="text-[10px] font-medium text-muted-foreground uppercase">Outstanding</p>
            <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{formatCurrency(totalRemaining)}</p>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-center">
            <p className="text-[10px] font-medium text-muted-foreground uppercase">Recovered</p>
            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{formatCurrency(totalRecovered)}</p>
          </div>
        </div>
        {!(advances || []).length ? (
          <p className="text-sm text-muted-foreground text-center py-4">No advances taken</p>
        ) : (
          <ScrollArea className="max-h-48">
            <div className="space-y-2 pr-2">
              {(advances || []).map((adv) => (
                <div key={adv.id} className="flex items-center justify-between p-3 rounded-xl border">
                  <div>
                    <p className="text-sm font-medium">{formatCurrency(adv.amount)}</p>
                    <p className="text-xs text-muted-foreground">{adv.reason} • {format(new Date(adv.date), 'MMM d')}</p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={adv.status} />
                    <p className="text-xs text-muted-foreground mt-1">Due: {formatCurrency(adv.remainingAmount)}</p>
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

// ─── LEAVE MANAGEMENT (Employee) ──────────────────────────────
function LeaveManagementSection({ employeeId, branchId, authName }: { employeeId: string; branchId: string; authName: string }) {
  const { data: leaves, refetch } = useFetch<Leave[]>(
    `/api/salon/leaves?employeeId=${employeeId}&branchId=${branchId}`
  );
  const [leaveDate, setLeaveDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [leaveReason, setLeaveReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleApply = useCallback(async () => {
    if (!leaveReason.trim()) return;
    setSubmitting(true);
    try {
      await apiPost('/api/salon/leaves', { employeeId, branchId, date: leaveDate, reason: leaveReason.trim() });
      toast.success('Leave application submitted');
      setLeaveReason('');
      refetch();
    } catch (e) {
      toast.error('Failed to apply for leave', { description: (e as Error).message });
    } finally {
      setSubmitting(false);
    }
  }, [employeeId, branchId, leaveDate, leaveReason, refetch]);

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <CalendarX className="w-4 h-4 text-rose-500" />
          <CardTitle className="text-base">Leave Management</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Apply form */}
        <div className="space-y-3 p-3 rounded-xl bg-muted/50 dark:bg-muted/20">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Date</Label>
              <Input type="date" value={leaveDate} onChange={e => setLeaveDate(e.target.value)} className="h-9" min={format(new Date(), 'yyyy-MM-dd')} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Reason</Label>
              <Input value={leaveReason} onChange={e => setLeaveReason(e.target.value)} placeholder="Enter reason..." className="h-9" />
            </div>
          </div>
          <Button size="sm" onClick={handleApply} disabled={!leaveReason.trim() || submitting}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-xs h-8">
            {submitting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <CalendarX className="w-3 h-3 mr-1" />}
            Apply for Leave
          </Button>
        </div>

        {/* Leave history */}
        {!(leaves || []).length ? (
          <p className="text-sm text-muted-foreground text-center py-2">No leave applications yet</p>
        ) : (
          <ScrollArea className="max-h-48">
            <div className="space-y-2 pr-2">
              {(leaves || []).sort((a, b) => b.date.localeCompare(a.date)).map((lv) => (
                <div key={lv.id} className="flex items-center justify-between p-3 rounded-xl border">
                  <div>
                    <p className="text-sm font-medium">{format(new Date(lv.date), 'EEE, MMM d, yyyy')}</p>
                    <p className="text-xs text-muted-foreground">{lv.reason}</p>
                  </div>
                  <StatusBadge status={lv.status} />
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

// ─── COMMISSION PREVIEW (Employee) ────────────────────────────
function CommissionPreviewSection({ employeeId, branchId }: { employeeId: string; branchId: string }) {
  const { data: services } = useFetch<Service[]>('/api/salon/services');

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Percent className="w-4 h-4 text-violet-500" />
          <CardTitle className="text-base">Commission Preview</CardTitle>
        </div>
        <CardDescription>Your earning split per service</CardDescription>
      </CardHeader>
      <CardContent>
        {!services?.length ? (
          <EmptyState icon={Percent} title="No services configured" description="Commission splits will appear when services are added" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {services.filter(s => s.isActive).map((svc) => {
              const empPct = svc.employeePercent || 50;
              const ownerPct = svc.ownerPercent || 50;
              const empEarning = Math.round(svc.price * (empPct / 100));
              return (
                <div key={svc.id} className="flex items-center gap-3 p-3 rounded-xl border hover:shadow-sm transition-all">
                  <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{svc.name}</p>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground">{formatCurrency(svc.price)}</span>
                      <span className="text-violet-600 dark:text-violet-400 font-semibold">{empPct}%</span>
                    </div>
                    <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                      You earn {formatCurrency(empEarning)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MY ATTENDANCE HISTORY (Employee)
// ═══════════════════════════════════════════════════════════════════
function MyAttendanceHistory({ employeeId, branchId }: { employeeId: string; branchId: string }) {
  const [selectedMonth, setSelectedMonth] = useState(() => format(new Date(), 'yyyy-MM'));
  const monthStart = format(new Date(selectedMonth + '-01'), 'yyyy-MM-dd');
  const monthEndDate = new Date(new Date(selectedMonth + '-01').getFullYear(), new Date(selectedMonth + '-01').getMonth() + 1, 0);
  const monthEnd = format(monthEndDate, 'yyyy-MM-dd');

  const { data: attendance, loading } = useFetch<AttendanceRecord[]>(
    `/api/salon/attendance?employeeId=${employeeId}&storeId=${branchId}`
  );
  const monthAttendance = useMemo(() => {
    return (attendance || []).filter(a => a.date >= monthStart && a.date <= monthEnd);
  }, [attendance, monthStart, monthEnd]);

  // Attendance streak calculation (consecutive days present from today backwards)
  const streak = useMemo(() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const sortedAll = (attendance || []).filter(a => a.status === 'PRESENT' || a.status === 'HALF_DAY').sort((a, b) => b.date.localeCompare(a.date));
    let count = 0;
    let checkDate = new Date();
    // Allow streak to start from today if today is present
    const todayRecord = sortedAll.find(a => a.date === todayStr && (a.status === 'PRESENT' || a.status === 'HALF_DAY'));
    if (!todayRecord) {
      // Start from yesterday
      checkDate = subDays(new Date(), 1);
    }
    for (let i = 0; i < 365; i++) {
      const dateStr = format(checkDate, 'yyyy-MM-dd');
      const record = sortedAll.find(a => a.date === dateStr && (a.status === 'PRESENT' || a.status === 'HALF_DAY'));
      if (record) {
        count++;
        checkDate = subDays(checkDate, 1);
      } else {
        break;
      }
    }
    return count;
  }, [attendance]);

  const stats = useMemo(() => {
    const daysInMonth = monthEndDate.getDate();
    const present = monthAttendance.filter(a => a.status === 'PRESENT').length;
    const halfDay = monthAttendance.filter(a => a.status === 'HALF_DAY').length;
    const absent = monthAttendance.filter(a => a.status === 'ABSENT').length;
    const leave = monthAttendance.filter(a => a.status === 'LEAVE').length;
    const totalHours = monthAttendance.reduce((s, a) => {
      if (a.checkIn && a.checkOut) {
        const [h1, m1] = a.checkIn.split(':').map(Number);
        const [h2, m2] = a.checkOut.split(':').map(Number);
        return s + (h2 - h1) + (m2 - m1) / 60;
      }
      return s;
    }, 0);
    return { daysInMonth, present, halfDay, absent, leave, totalHours: Math.round(totalHours * 10) / 10, recorded: monthAttendance.length };
  }, [monthAttendance, monthEndDate]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(selectedMonth + '-01').getDay();
    const daysInMonth = monthEndDate.getDate();
    const days: Array<{ date: string; day: number; att?: AttendanceRecord }> = [];
    for (let i = 0; i < (firstDay === 0 ? 6 : firstDay - 1); i++) {
      days.push({ date: '', day: 0 });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${selectedMonth}-${String(d).padStart(2, '0')}`;
      const att = monthAttendance.find(a => a.date === dateStr);
      days.push({ date: dateStr, day: d, att });
    }
    return days;
  }, [selectedMonth, monthAttendance, monthEndDate]);

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-500" />
            <CardTitle className="text-base">My Attendance</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}
              className="h-8 w-36 text-xs" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 rounded" />)}</div>
        ) : (
          <>
            {/* Streak & Hours Hero Cards */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 p-4 text-white">
                <div className="absolute -top-3 -right-3 w-16 h-16 rounded-full bg-white/10 blur-xl" />
                <div className="absolute -bottom-2 -left-2 w-12 h-12 rounded-full bg-white/10 blur-lg" />
                <div className="relative">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Flame className="w-4 h-4" />
                    <p className="text-[10px] font-medium text-white/80 uppercase tracking-wider">Current Streak</p>
                  </div>
                  <p className="text-3xl font-black">{streak}</p>
                  <p className="text-[10px] text-white/70">consecutive day{streak !== 1 ? 's' : ''} present</p>
                </div>
              </div>
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 p-4 text-white">
                <div className="absolute -top-3 -right-3 w-16 h-16 rounded-full bg-white/10 blur-xl" />
                <div className="absolute -bottom-2 -left-2 w-12 h-12 rounded-full bg-white/10 blur-lg" />
                <div className="relative">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Timer className="w-4 h-4" />
                    <p className="text-[10px] font-medium text-white/80 uppercase tracking-wider">Hours This Month</p>
                  </div>
                  <p className="text-3xl font-black">{stats.totalHours}<span className="text-lg font-medium ml-0.5">h</span></p>
                  <p className="text-[10px] text-white/70">across {stats.recorded} day{stats.recorded !== 1 ? 's' : ''}</p>
                </div>
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
              <div className="text-center p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{stats.present}</p>
                <p className="text-[10px] text-muted-foreground">Present</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{stats.halfDay}</p>
                <p className="text-[10px] text-muted-foreground">Half Day</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-red-50 dark:bg-red-900/20">
                <p className="text-lg font-bold text-red-600 dark:text-red-400">{stats.absent}</p>
                <p className="text-[10px] text-muted-foreground">Absent</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{stats.totalHours}h</p>
                <p className="text-[10px] text-muted-foreground">Total Hours</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-violet-50 dark:bg-violet-900/20">
                <p className="text-lg font-bold text-violet-600 dark:text-violet-400">{stats.recorded}/{stats.daysInMonth}</p>
                <p className="text-[10px] text-muted-foreground">Recorded</p>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                <div key={d} className="text-[10px] font-medium text-muted-foreground py-1">{d}</div>
              ))}
              {calendarDays.map((day, i) => (
                <div key={i} className={`relative w-full aspect-square flex items-center justify-center rounded-lg text-xs font-medium transition-colors ${!day.date ? '' :
                  day.att?.status === 'PRESENT' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-200 dark:ring-emerald-800' :
                  day.att?.status === 'HALF_DAY' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 ring-1 ring-amber-200 dark:ring-amber-800' :
                  day.att?.status === 'ABSENT' ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 ring-1 ring-red-200 dark:ring-red-800' :
                  day.att?.status === 'LEAVE' ? 'bg-gray-100 dark:bg-gray-900/40 text-gray-500 dark:text-gray-400 ring-1 ring-gray-200 dark:ring-gray-700' :
                  isToday(new Date(day.date)) ? 'ring-2 ring-rose-400 bg-rose-50 dark:bg-rose-950/20' :
                  'bg-muted/30 dark:bg-muted/10'
                }`}>
                  {day.day > 0 ? day.day : ''}
                  {day.att?.checkIn && (
                    <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-500" />
                  )}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-3 mt-3 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-100 dark:bg-emerald-900/40 ring-1 ring-emerald-200 dark:ring-emerald-800" /> Present</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-amber-100 dark:bg-amber-900/40 ring-1 ring-amber-200 dark:ring-amber-800" /> Half Day</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-red-100 dark:bg-red-900/40 ring-1 ring-red-200 dark:ring-red-800" /> Absent</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-gray-100 dark:bg-gray-900/40 ring-1 ring-gray-200 dark:ring-gray-700" /> Leave</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-muted/30 ring-1 ring-muted-300" /> Not Recorded</span>
            </div>

            {/* Recent Records */}
            {monthAttendance.length > 0 && (
              <div className="mt-4 border-t pt-3">
                <p className="text-xs font-medium text-muted-foreground mb-2">Recent Records</p>
                <ScrollArea className="max-h-32">
                  <div className="space-y-1.5 pr-2">
                    {monthAttendance.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7).map(rec => (
                      <div key={rec.id} className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg hover:bg-muted/30">
                        <span className="font-medium">{format(new Date(rec.date), 'EEE, MMM d')}</span>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          {rec.checkIn && <span className="text-emerald-600 dark:text-emerald-400">In {rec.checkIn}</span>}
                          {rec.checkOut && <span className="text-red-500 dark:text-red-400">Out {rec.checkOut}</span>}
                          {!rec.checkOut && rec.checkIn && <Badge variant="outline" className="text-[9px] h-4 px-1.5">Working</Badge>}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── MY PAYMENT HISTORY ──────────────────────────────────────
function EmployeePaymentHistory({ employeeId }: { employeeId: string }) {
  const currentMonth = format(new Date(), 'yyyy-MM');
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  const { data: payments } = useFetch<Payment[]>(
    employeeId ? `/api/salon/payments?employeeId=${employeeId}&month=${selectedMonth}` : null
  );

  const totalNetPaid = useMemo(() => (payments || []).reduce((s, p) => s + p.netPaid, 0), [payments]);
  const totalEarned = useMemo(() => (payments || []).reduce((s, p) => s + p.earnedAmount, 0), [payments]);
  const totalDeducted = useMemo(() => (payments || []).reduce((s, p) => s + p.advanceDeducted, 0), [payments]);
  const paymentCount = (payments || []).length;

  const purposeLabel = (p: string) => {
    switch (p) {
      case 'DAILY_EARNINGS': return '💰 Daily Earnings';
      case 'WEEKLY_SALARY': return '📅 Weekly Salary';
      case 'MONTHLY_SALARY': return '📆 Monthly Salary';
      case 'BONUS': return '🎁 Bonus';
      case 'SETTLEMENT': return '📋 Settlement';
      default: return p;
    }
  };

  return (
    <GlassCard>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium flex items-center gap-1.5">
            <Wallet className="w-4 h-4 text-emerald-500" />
            My Payment History
          </h3>
          <div className="flex items-center gap-2">
            <Input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}
              className="w-[140px] h-7 text-[11px]" />
          </div>
        </div>

        {/* Summary Row */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 p-2 text-center">
            <p className="text-[9px] text-muted-foreground uppercase">Received</p>
            <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{formatCurrency(totalNetPaid)}</p>
          </div>
          <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 p-2 text-center">
            <p className="text-[9px] text-muted-foreground uppercase">Gross Earned</p>
            <p className="text-sm font-bold text-blue-700 dark:text-blue-400">{formatCurrency(totalEarned)}</p>
          </div>
          <div className="rounded-lg bg-red-50 dark:bg-red-950/20 p-2 text-center">
            <p className="text-[9px] text-muted-foreground uppercase">Deducted</p>
            <p className="text-sm font-bold text-red-700 dark:text-red-400">{formatCurrency(totalDeducted)}</p>
          </div>
        </div>

        {/* Payment List */}
        {!payments || payments.length === 0 ? (
          <div className="text-center py-4">
            <Wallet className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-xs text-muted-foreground">No payments received{selectedMonth === currentMonth ? ' today' : ` in ${selectedMonth}`}</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
            {payments.map(p => (
              <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-lg border hover:bg-muted/30 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                  <Banknote className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-medium">{purposeLabel(p.purpose)}</p>
                    <Badge variant="outline" className="text-[8px] px-1 py-0">
                      {p.paymentMethod === 'CASH' ? '💵' : '💳'} {p.paymentMethod}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {isToday(p.date) ? 'Today' : format(new Date(p.date + 'T00:00:00'), 'MMM d')} · {new Date(p.paidAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    {p.notes && ` · ${p.notes}`}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{formatCurrency(p.netPaid)}</p>
                  {p.advanceDeducted > 0 && (
                    <p className="text-[9px] text-red-500">- {formatCurrency(p.advanceDeducted)} advance</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {paymentCount > 0 && (
          <div className="mt-2 pt-2 border-t flex justify-between items-center text-[10px] text-muted-foreground">
            <span>{paymentCount} payment{paymentCount > 1 ? 's' : ''}</span>
            <span>Total: <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalNetPaid)}</span></span>
          </div>
        )}
      </CardContent>
    </GlassCard>
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

// ═══════════════════════════════════════════════════════════════════
// EMPLOYEE QUICK SERVICE ENTRY
// ═══════════════════════════════════════════════════════════════════
function EmployeeQuickServiceEntry({ employeeId, storeId, dialogOpen, onDialogChange, onServiceRecorded, onSuccess }: { employeeId: string; storeId: string; dialogOpen: boolean; onDialogChange: (open: boolean) => void; onServiceRecorded: (isNewCustomer: boolean) => void; onSuccess: () => void }) {
  return (
    <>
      {/* Prominent "+" button card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Card
          className="shadow-md cursor-pointer border-2 border-dashed border-rose-300 dark:border-rose-700 bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950/20 dark:to-pink-950/20 hover:border-solid hover:border-rose-400 hover:shadow-lg hover:shadow-rose-500/10 transition-all duration-200 group"
          onClick={() => onDialogChange(true)}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-md shadow-rose-500/20 group-hover:scale-110 transition-transform">
                  <Plus className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-rose-700 dark:text-rose-300">Quick Service Entry</h3>
                  <p className="text-xs text-muted-foreground">Record a service for a customer</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground group-hover:text-rose-500 transition-colors">Tap to add</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-rose-500 group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Dialog */}
      <QuickServiceEntryDialog
        open={dialogOpen}
        onClose={() => onDialogChange(false)}
        employeeId={employeeId}
        storeId={storeId}
        onServiceRecorded={onServiceRecorded}
        onSuccess={() => { onDialogChange(false); onSuccess(); }}
      />
    </>
  );
}

// ─── QUICK SERVICE ENTRY DIALOG ──────────────────────────────────
function QuickServiceEntryDialog({ open, onClose, employeeId, storeId, onServiceRecorded, onSuccess }: {
  open: boolean; onClose: () => void; employeeId: string; storeId: string; onServiceRecorded?: (isNewCustomer: boolean) => void; onSuccess: () => void;
}) {
  const { data: services } = useFetch<Service[]>('/api/salon/services');
  const { data: products } = useFetch<Product[]>('/api/salon/products');

  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerLookupDone, setCustomerLookupDone] = useState(false);
  const [existingCustomer, setExistingCustomer] = useState<Customer | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [serviceFilter, setServiceFilter] = useState('ALL');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'ONLINE' | 'SPLIT'>('CASH');
  const [splitCash, setSplitCash] = useState(0);
  const [splitOnline, setSplitOnline] = useState(0);
  const [selectedProducts, setSelectedProducts] = useState<Record<string, boolean>>({});
  const [productQty, setProductQty] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);

  const activeServices = useMemo(() => (services || []).filter(s => s.isActive), [services]);
  const filteredServices = useMemo(() => serviceFilter === 'ALL' ? activeServices : activeServices.filter(s => s.category === serviceFilter), [activeServices, serviceFilter]);
  const selectedService = activeServices.find(s => s.id === selectedServiceId);

  const servicePrice = selectedService?.price || 0;
  const splitRemaining = servicePrice - splitCash - splitOnline;
  const splitValid = paymentMethod !== 'SPLIT' || (splitCash >= 0 && splitOnline >= 0 && Math.abs(splitRemaining) < 0.01);

  // Commission calculation
  const commission = useMemo(() => {
    const price = selectedService?.price || 0;
    const prodCost = Object.entries(selectedProducts).filter(([k, v]) => v).reduce((sum, [id]) => {
      const p = (products || []).find(pr => pr.id === id);
      return sum + (p ? p.cost * (productQty[id] || 1) : 0);
    }, 0);
    return {
      price,
      ownerShare: price * 0.5,
      employeeGross: price * 0.5,
      productCost: prodCost,
      employeeNet: price * 0.5 - prodCost,
    };
  }, [selectedService, selectedProducts, productQty, products]);

  // Phone lookup — uses dedicated search API
  const handlePhoneLookup = useCallback(async (phone: string) => {
    if (phone.length < 4) {
      setCustomerLookupDone(false);
      setExistingCustomer(null);
      return;
    }
    setLookingUp(true);
    try {
      const res = await fetch(`/api/salon/customer-search?phone=${encodeURIComponent(phone)}`);
      const customers = await res.json();
      const match = Array.isArray(customers) && customers.length > 0 ? customers[0] : null;
      if (match) {
        setExistingCustomer(match);
        setCustomerName(match.name);
        setCustomerLookupDone(true);
      } else {
        setExistingCustomer(null);
        setCustomerLookupDone(true);
      }
    } catch {
      setCustomerLookupDone(false);
    } finally { setLookingUp(false); }
  }, []);

  // Debounced phone lookup
  const phoneTimeout = useRef<NodeJS.Timeout | null>(null);
  const handlePhoneChange = useCallback((val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 10);
    setCustomerPhone(digits);
    setCustomerName('');
    setExistingCustomer(null);
    setCustomerLookupDone(false);
    if (phoneTimeout.current) clearTimeout(phoneTimeout.current);
    if (digits.length >= 4) {
      phoneTimeout.current = setTimeout(() => handlePhoneLookup(digits), 600);
    }
  }, [handlePhoneLookup]);

  const toggleProduct = useCallback((id: string) => {
    setSelectedProducts(prev => {
      const next = { ...prev, [id]: !prev[id] };
      if (!next[id]) setProductQty(prev2 => { const n = { ...prev2 }; delete n[id]; return n; });
      return next;
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!customerName.trim() || !selectedServiceId) {
      toast.error('Please fill customer name and select a service');
      return;
    }
    if (paymentMethod === 'SPLIT' && !splitValid) {
      toast.error('Cash + Online must equal service price');
      return;
    }
    setSubmitting(true);
    try {
      const prodsUsed = Object.entries(selectedProducts)
        .filter(([, v]) => v)
        .map(([id]) => ({ productId: id, quantityUsed: productQty[id] || 1 }));

      let cashAmt = 0;
      let onlineAmt = 0;
      if (paymentMethod === 'CASH') { cashAmt = servicePrice; }
      else if (paymentMethod === 'ONLINE') { onlineAmt = servicePrice; }
      else { cashAmt = splitCash; onlineAmt = splitOnline; }

      const res = await apiPost('/api/salon/service-entry', {
        employeeId, storeId, serviceId: selectedServiceId,
        customerName: customerName.trim(),
        customerPhone: customerPhone || undefined,
        paymentMethod,
        cashAmount: cashAmt,
        onlineAmount: onlineAmt,
        productsUsed: prodsUsed,
      });

      if (res.isNewCustomer) {
        toast.success('New customer added + Service recorded! 🎉', {
          description: `${customerName} — ${selectedService?.name} (${formatCurrency(selectedService?.price || 0)}) · ${paymentMethod}`,
        });
        onServiceRecorded?.(true);
      } else {
        toast.success('Service recorded for Old Customer! ✅', {
          description: `${customerName} — ${selectedService?.name} (${formatCurrency(selectedService?.price || 0)}) · ${paymentMethod}`,
        });
        onServiceRecorded?.(false);
      }
      // Reset form
      setCustomerPhone(''); setCustomerName(''); setSelectedServiceId('');
      setServiceFilter('ALL');
      setExistingCustomer(null); setCustomerLookupDone(false);
      setSelectedProducts({}); setProductQty({}); setPaymentMethod('CASH');
      setSplitCash(0); setSplitOnline(0);
      onSuccess();
    } catch (e) {
      toast.error('Failed to record service', { description: (e as Error).message });
    } finally { setSubmitting(false); }
  }, [employeeId, storeId, selectedServiceId, customerName, customerPhone, paymentMethod, splitCash, splitOnline, splitValid, servicePrice, selectedProducts, productQty, selectedService, onSuccess, onServiceRecorded]);

  const canSubmit = customerName.trim().length > 0 && selectedServiceId.length > 0 && !submitting && (paymentMethod !== 'SPLIT' || splitValid);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center">
              <Plus className="w-4 h-4 text-white" />
            </div>
            Quick Service Entry
          </DialogTitle>
          <DialogDescription>Record a service for a customer (walk-in or existing)</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Customer Section */}
          <div className="space-y-2 p-3 rounded-xl bg-muted/30 border">
            <Label className="text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> Customer Details
            </Label>

            {/* Customer tag */}
            {customerLookupDone && customerPhone.length >= 4 && (
              <div className="flex items-center gap-1.5">
                {existingCustomer ? (
                  <Badge className="bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-[10px] font-semibold px-2 py-0.5">
                    <UserCheck className="w-3 h-3 mr-1" /> Old Customer
                  </Badge>
                ) : (
                  <Badge className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold px-2 py-0.5 border border-emerald-200 dark:border-emerald-800">
                    <UserPlus className="w-3 h-3 mr-1" /> New Customer
                  </Badge>
                )}
                {existingCustomer && (
                  <span className="text-[10px] text-muted-foreground">
                    Returning customer — details auto-filled
                  </span>
                )}
              </div>
            )}

            <div className="grid grid-cols-5 gap-2">
              <div className="col-span-2 space-y-1">
                <Label className="text-[10px] text-muted-foreground">Phone</Label>
                <div className="relative">
                  <Input
                    value={customerPhone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="Mobile no."
                    className="h-9 text-sm"
                    type="tel"
                    inputMode="numeric"
                  />
                  {lookingUp && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                      <RefreshCw className="w-3 h-3 animate-spin text-muted-foreground" />
                    </div>
                  )}
                  {existingCustomer && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    </div>
                  )}
                </div>
              </div>
              <div className="col-span-3 space-y-1">
                <Label className="text-[10px] text-muted-foreground">Customer Name *</Label>
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter customer name"
                  className="h-9 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Service Selection — Clickable Cards */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Select Service *
            </Label>
            {!services ? (
              <div className="flex items-center justify-center py-6">
                <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground mr-2" />
                <span className="text-xs text-muted-foreground">Loading services...</span>
              </div>
            ) : activeServices.length === 0 ? (
              <div className="text-center py-6 px-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40">
                <AlertTriangle className="w-5 h-5 mx-auto mb-1 text-amber-500" />
                <p className="text-xs text-amber-600">No active services found. Contact your manager.</p>
              </div>
            ) : (
              <>
                {/* Category filter chips */}
                <div className="flex gap-1.5 flex-wrap">
                  {['ALL', ...Array.from(new Set(activeServices.map(s => s.category)))].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setServiceFilter(cat)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all ${
                        serviceFilter === cat
                          ? 'bg-rose-500 text-white shadow-sm'
                          : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                {/* Service cards grid */}
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                  {filteredServices.map(svc => (
                    <button
                      key={svc.id}
                      onClick={() => setSelectedServiceId(svc.id)}
                      className={`relative p-3 rounded-xl text-left transition-all duration-150 border-2 ${
                        selectedServiceId === svc.id
                          ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/30 shadow-md shadow-rose-500/10'
                          : 'border-transparent bg-muted/30 hover:bg-muted/50 hover:border-muted-foreground/20'
                      }`}
                    >
                      {selectedServiceId === svc.id && (
                        <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-rose-500 flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                      <p className="text-xs font-semibold truncate pr-6">{svc.name}</p>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-sm font-bold text-rose-600 dark:text-rose-400">{formatCurrency(svc.price)}</span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />{svc.duration}m
                        </span>
                      </div>
                      <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">{svc.category}</span>
                    </button>
                  ))}
                </div>
                {selectedService && (
                  <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950/20 dark:to-pink-950/20 border border-rose-100 dark:border-rose-900/40">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground">Selected:</span>
                      <span className="text-xs font-bold text-rose-700 dark:text-rose-300">{selectedService.name}</span>
                    </div>
                    <span className="text-lg font-bold text-rose-600 dark:text-rose-400">{formatCurrency(selectedService.price)}</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5" /> Payment Method
            </Label>
            <div className="flex gap-2">
              <button
                onClick={() => setPaymentMethod('CASH')}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  paymentMethod === 'CASH'
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20 ring-2 ring-emerald-300 dark:ring-emerald-700'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted border border-transparent'
                }`}
              >
                <Banknote className="w-4 h-4" /> Cash
              </button>
              <button
                onClick={() => setPaymentMethod('ONLINE')}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  paymentMethod === 'ONLINE'
                    ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20 ring-2 ring-blue-300 dark:ring-blue-700'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted border border-transparent'
                }`}
              >
                <Smartphone className="w-4 h-4" /> Online
              </button>
              <button
                onClick={() => setPaymentMethod('SPLIT')}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  paymentMethod === 'SPLIT'
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20 ring-2 ring-amber-300 dark:ring-amber-700'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted border border-transparent'
                }`}
              >
                <Receipt className="w-4 h-4" /> Split
              </button>
            </div>

            {/* Split Payment — Cash & Online input fields */}
            {paymentMethod === 'SPLIT' && selectedService && (
              <div className="space-y-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">Split Payment Details</span>
                  <span className="text-[10px] text-muted-foreground">Total: {formatCurrency(servicePrice)}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-1">
                      <Banknote className="w-3 h-3" /> Cash Amount
                    </Label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">₹</span>
                      <Input
                        type="number"
                        min={0}
                        max={servicePrice}
                        value={splitCash || ''}
                        onChange={(e) => {
                          const val = Math.max(0, Math.min(servicePrice, Number(e.target.value) || 0));
                          setSplitCash(val);
                          // Auto-fill online = remaining
                          const remaining = servicePrice - val;
                          if (remaining >= 0) setSplitOnline(Math.round(remaining));
                        }}
                        placeholder="0"
                        className="h-9 text-sm pl-7 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800"
                        inputMode="numeric"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-blue-700 dark:text-blue-300 font-semibold flex items-center gap-1">
                      <Smartphone className="w-3 h-3" /> Online Amount
                    </Label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">₹</span>
                      <Input
                        type="number"
                        min={0}
                        max={servicePrice}
                        value={splitOnline || ''}
                        onChange={(e) => {
                          const val = Math.max(0, Math.min(servicePrice, Number(e.target.value) || 0));
                          setSplitOnline(val);
                          // Auto-fill cash = remaining
                          const remaining = servicePrice - val;
                          if (remaining >= 0) setSplitCash(Math.round(remaining));
                        }}
                        placeholder="0"
                        className="h-9 text-sm pl-7 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                        inputMode="numeric"
                      />
                    </div>
                  </div>
                </div>
                {/* Validation indicator */}
                <div className={`flex items-center justify-between text-[10px] font-medium px-1 pt-1 ${
                  splitValid
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-red-500'
                }`}>
                  <span>Cash + Online = {formatCurrency(splitCash + splitOnline)}</span>
                  {splitValid ? (
                    <span className="flex items-center gap-0.5"><CheckCircle2 className="w-3 h-3" /> Balanced</span>
                  ) : (
                    <span className="flex items-center gap-0.5"><AlertTriangle className="w-3 h-3" /> {splitRemaining > 0 ? `${formatCurrency(Math.abs(splitRemaining))} remaining` : `${formatCurrency(Math.abs(splitRemaining))} extra`}</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Commission Preview */}
          {selectedService && (
            <div className="space-y-1.5 p-3 rounded-xl bg-gradient-to-br from-muted/40 to-muted/20 border">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Commission Preview</p>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Service Price</span>
                  <span className="font-medium">{formatCurrency(commission.price)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Owner (50%)</span>
                  <span>{formatCurrency(commission.ownerShare)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Your Gross (50%)</span>
                  <span>{formatCurrency(commission.employeeGross)}</span>
                </div>
                {commission.productCost > 0 && (
                  <div className="flex justify-between text-red-500">
                    <span>Product Costs</span>
                    <span>-{formatCurrency(commission.productCost)}</span>
                  </div>
                )}
                <Separator className="my-1" />
                <div className={`flex justify-between font-bold text-sm ${commission.employeeNet >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                  <span>Your Net Earnings</span>
                  <span>{formatCurrency(commission.employeeNet)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Products Used (optional) */}
          {selectedServiceId && (products || []).length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5" /> Products Used <span className="text-[10px] font-normal text-muted-foreground">(optional — deducts from your earnings)</span>
              </Label>
              <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
                {(products || []).filter(p => p.isActive).map(p => (
                  <label key={p.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/30 cursor-pointer transition-colors">
                    <Checkbox
                      checked={!!selectedProducts[p.id]}
                      onCheckedChange={() => toggleProduct(p.id)}
                      className="h-4 w-4"
                    />
                    <span className="flex-1 text-xs font-medium truncate">{p.name}</span>
                    {selectedProducts[p.id] && (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={1}
                          max={99}
                          value={productQty[p.id] || 1}
                          onChange={(e) => setProductQty(prev => ({ ...prev, [p.id]: Math.max(1, Number(e.target.value) || 1) }))}
                          className="w-12 h-6 text-[10px] text-center border rounded bg-background"
                        />
                        <span className="text-[10px] text-muted-foreground">{p.unit}</span>
                        <span className="text-[10px] text-red-500">-{formatCurrency(p.cost * (productQty[p.id] || 1))}</span>
                      </div>
                    )}
                    <span className="text-[10px] text-muted-foreground">{formatCurrency(p.cost)}/{p.unit}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={onClose} className="text-xs h-9">Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex-1 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white text-sm h-9 shadow-md shadow-rose-500/20 relative overflow-hidden group"
          >
            {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4 mr-1" /> Record Service</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
