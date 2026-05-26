'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import {
  Calendar, BarChart3, Building2, Crown, Bell, CheckCircle2,
  AlertTriangle, RefreshCw, ArrowUp, ArrowDown, Clock,
  ChevronDown, User, Search, Settings, Sun, Moon,
  LogOut, UserCircle, LifeBuoy, MessageSquare, HelpCircle,
  Phone, MapPin, Banknote, CreditCard, Receipt,
  ExternalLink, CalendarDays, X, Scissors, Store,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
  DropdownMenuTrigger, DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { format } from 'date-fns';
import type { Role, AuthUser, Appointment, AnalyticsData } from '@/lib/salon-types';
import { useFetch, useClock } from '@/lib/salon-hooks';
import { formatTime, formatCurrency, getInitials, EXPENSE_CATEGORY_CONFIG } from '@/lib/salon-utils';

// ─── MOBILE BOTTOM NAV ────────────────────────────────────────
export function MobileBottomNav({ activeRole, setActiveRole }: { activeRole: Role; setActiveRole: (r: Role) => void }) {
  const tabs = [
    { id: 'customer' as Role, label: 'Book', icon: Calendar },
    { id: 'employee' as Role, label: 'Dashboard', icon: BarChart3 },
    { id: 'manager' as Role, label: 'Manage', icon: Building2 },
    { id: 'owner' as Role, label: 'Owner', icon: Crown },
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-background/80 backdrop-blur-xl border-t border-border/50 pb-[env(safe-area-inset-bottom,0px)]">
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

// ─── NOTIFICATION BELL (Enhanced) ─────────────────────────────
export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tab, setTab] = useState('all');
  const { data: allAppts } = useFetch<Appointment[]>('/api/salon/appointments');

  const appointments = allAppts || [];
  const pendingCount = appointments.filter(a => a.status === 'PENDING').length;

  const filteredAppts = appointments.filter(a => {
    if (tab === 'all') return true;
    if (tab === 'pending') return a.status === 'PENDING';
    if (tab === 'confirmed') return a.status === 'CONFIRMED';
    if (tab === 'completed') return a.status === 'COMPLETED';
    return true;
  }).slice(0, 8);

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9 relative" aria-label="Notifications">
            <span className={`relative ${pendingCount > 0 ? 'animate-breathe' : ''}`}>
              <Bell className={`w-4 h-4 ${pendingCount > 0 ? 'text-rose-500 dark:text-rose-400' : ''}`} />
              {pendingCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4 h-4 rounded-full bg-rose-500 text-[9px] font-bold text-white shadow-sm">
                  {pendingCount > 9 ? '9+' : pendingCount}
                </span>
              )}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 p-0">
          <div className="p-3 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold">Notifications</h4>
                <p className="text-xs text-muted-foreground">{pendingCount} pending appointments</p>
              </div>
              <Badge variant="secondary" className="text-[10px]">{appointments.length} total</Badge>
            </div>
          </div>
          {/* Tab Filters */}
          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <div className="px-3 pt-2">
              <TabsList className="w-full h-8">
                <TabsTrigger value="all" className="text-xs px-2 flex-1">All</TabsTrigger>
                <TabsTrigger value="pending" className="text-xs px-2 flex-1">Pending</TabsTrigger>
                <TabsTrigger value="confirmed" className="text-xs px-2 flex-1">Confirmed</TabsTrigger>
                <TabsTrigger value="completed" className="text-xs px-2 flex-1">Done</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value={tab} className="mt-0">
              <div className="max-h-64 overflow-y-auto custom-scrollbar">
                {filteredAppts.length === 0 ? (
                  <div className="flex flex-col items-center py-6 text-center">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
                    <p className="text-sm text-muted-foreground">No appointments here</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredAppts.map((apt) => (
                      <NotificationItem key={apt.id} apt={apt} />
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
          {/* View All Link */}
          <div className="border-t p-2">
            <button
              onClick={() => { setOpen(false); setDialogOpen(true); }}
              className="flex items-center justify-center gap-1.5 w-full text-xs font-medium text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 py-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3 h-3" />
              View All Notifications
            </button>
          </div>
        </PopoverContent>
      </Popover>

      <NotificationCenterDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}

function NotificationItem({ apt }: { apt: Appointment }) {
  const categoryColors: Record<string, string> = {
    HAIRCUT: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
    COLOR: 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/40 dark:text-fuchsia-300',
    TREATMENT: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    SPA: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
    BRIDAL: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  };
  const catClass = categoryColors[apt.service?.category || ''] || 'bg-gray-100 text-gray-700 dark:bg-gray-900/40 dark:text-gray-300';

  return (
    <div className="px-3 py-2.5 hover:bg-muted/50 transition-colors">
      <div className="flex items-start gap-2.5">
        <Avatar className="h-8 w-8 mt-0.5 shrink-0">
          <AvatarFallback className="bg-gradient-to-br from-rose-100 to-pink-100 dark:from-rose-950/40 dark:to-pink-950/40 text-rose-700 dark:text-rose-300 text-[10px] font-semibold">
            {getInitials(apt.customer?.name || '??')}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium truncate">{apt.customer?.name}</p>
            <StatusBadge status={apt.status} />
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-xs text-muted-foreground truncate">{apt.service?.name}</span>
            <Badge className={`text-[9px] px-1.5 py-0 h-4 ${catClass}`} variant="secondary">
              {apt.service?.category || ''}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5">
            <Clock className="w-3 h-3" />
            <span>{formatTime(apt.time)}</span>
            {apt.store && (
              <>
                <span className="text-border">•</span>
                <Store className="w-3 h-3" />
                <span className="truncate">{apt.store.name}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── NOTIFICATION CENTER DIALOG ────────────────────────────────
export function NotificationCenterDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { data: allAppts, loading } = useFetch<Appointment[]>('/api/salon/appointments');

  const appointments = (allAppts || []).slice(0, 20);

  const filtered = appointments.filter(a => {
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return a.customer?.name.toLowerCase().includes(q) || a.service?.name.toLowerCase().includes(q);
    }
    return true;
  });

  // Group by date
  const grouped = filtered.reduce<Record<string, Appointment[]>>((acc, apt) => {
    const key = apt.date;
    if (!acc[key]) acc[key] = [];
    acc[key].push(apt);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-rose-500" />
            Notification Center
          </DialogTitle>
          <DialogDescription>Recent appointments and their statuses</DialogDescription>
        </DialogHeader>

        {/* Search + Filter */}
        <div className="shrink-0 space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by customer or service..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9 bg-muted/50"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer">
                <X className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            {['all', 'PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium transition-colors border cursor-pointer ${
                  statusFilter === s
                    ? 'bg-rose-500 text-white border-rose-500'
                    : 'bg-muted/50 text-muted-foreground border-border hover:border-rose-300'
                }`}
              >
                {s === 'all' ? 'All' : s.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* List grouped by date */}
        <ScrollArea className="flex-1 -mx-6 px-6">
          {loading ? (
            <div className="space-y-3 py-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <div className="w-14 h-14 rounded-2xl bg-muted/80 flex items-center justify-center mb-3">
                <Bell className="w-7 h-7 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">No appointments found</p>
              <p className="text-xs text-muted-foreground">Try adjusting your search or filter</p>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              {sortedDates.map(date => (
                <div key={date}>
                  <div className="flex items-center gap-2 mb-2">
                    <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {format(new Date(date + 'T00:00:00'), 'EEEE, MMM d, yyyy')}
                    </p>
                    <span className="text-[10px] text-muted-foreground">({grouped[date].length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {grouped[date].map(apt => (
                      <button
                        key={apt.id}
                        onClick={() => setSelectedApt(apt)}
                        className="flex items-start gap-2.5 w-full p-3 rounded-xl border hover:bg-muted/30 hover:shadow-sm transition-all text-left cursor-pointer"
                      >
                        <Avatar className="h-9 w-9 shrink-0">
                          <AvatarFallback className="bg-gradient-to-br from-rose-100 to-pink-100 dark:from-rose-950/40 dark:to-pink-950/40 text-rose-700 dark:text-rose-300 text-[10px] font-semibold">
                            {getInitials(apt.customer?.name || '??')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium truncate">{apt.customer?.name}</p>
                            <StatusBadge status={apt.status} />
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Scissors className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground truncate">{apt.service?.name}</span>
                            <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">
                              {apt.service?.category}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5">
                            <Clock className="w-3 h-3" />
                            <span>{formatTime(apt.time)}</span>
                            {apt.store && (
                              <>
                                <span className="text-border">•</span>
                                <Store className="w-3 h-3" />
                                <span className="truncate">{apt.store.name}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>

      {/* Appointment Detail Dialog */}
      <Dialog open={!!selectedApt} onOpenChange={() => setSelectedApt(null)}>
        <DialogContent className="sm:max-w-md">
          {selectedApt && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 ring-2 ring-rose-200 dark:ring-rose-800">
                    <AvatarFallback className="bg-gradient-to-br from-rose-500 to-pink-600 text-white font-bold text-sm">
                      {getInitials(selectedApt.customer?.name || '??')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p>{selectedApt.customer?.name}</p>
                    <p className="text-sm font-normal text-muted-foreground">{selectedApt.customer?.phone}</p>
                  </div>
                </DialogTitle>
                <DialogDescription>Appointment details</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-muted/50 space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Status</p>
                    <StatusBadge status={selectedApt.status} />
                  </div>
                  <div className="p-3 rounded-xl bg-muted/50 space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Price</p>
                    <p className="text-sm font-bold text-rose-600 dark:text-rose-400">{formatCurrency(selectedApt.service?.price || 0)}</p>
                  </div>
                </div>
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2.5 text-sm">
                    <Scissors className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{selectedApt.service?.name}</span>
                    <Badge variant="outline" className="text-[10px]">{selectedApt.service?.category}</Badge>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>{selectedApt.date}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>{formatTime(selectedApt.time)}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span>{selectedApt.employee?.name} ({selectedApt.employee?.role})</span>
                  </div>
                  {selectedApt.store && (
                    <div className="flex items-center gap-2.5 text-sm">
                      <Store className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedApt.store.name}, {selectedApt.store.city}</span>
                    </div>
                  )}
                </div>
                {selectedApt.notes && (
                  <div className="p-3 rounded-xl bg-muted/30">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Notes</p>
                    <p className="text-sm">{selectedApt.notes}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

// ─── SMALL COMPONENTS ──────────────────────────────────────────
export function StatusBadge({ status }: { status: string }) {
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
    APPROVED: { label: 'Approved', className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' },
    REJECTED: { label: 'Rejected', className: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' },
    ACTIVE: { label: 'Active', className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' },
    RECOVERING: { label: 'Recovering', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' },
    RECOVERED: { label: 'Recovered', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' },
  };
  const c = config[status] || { label: status, className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-300' };
  return <span className={`inline-flex items-center rounded-full border border-l-2 border-l-current px-2.5 py-0.5 text-xs font-medium ${c.className}`}>{c.label}</span>;
}

export function StockIndicator({ quantity, reorderLevel }: { quantity: number; reorderLevel: number }) {
  if (quantity === 0) return <Badge variant="destructive">Out of Stock</Badge>;
  if (quantity <= reorderLevel) return <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800">Low Stock</Badge>;
  return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800">In Stock</Badge>;
}

export function ErrorCard({ message, onRetry }: { message: string; onRetry?: () => void }) {
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

export function ViewSkeleton() {
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

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="flex gap-4 px-2">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={`h-${i}`} className="h-4 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, ri) => (
        <div key={`r-${ri}`} className="flex gap-4 px-2 py-2">
          {Array.from({ length: cols }).map((_, ci) => (
            <Skeleton key={`c-${ri}-${ci}`} className="h-5 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardGridSkeleton({ cards = 4 }: { cards?: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
      {Array.from({ length: cards }).map((_, i) => (
        <div key={i} className="rounded-xl border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-3 w-36" />
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton({ height = 280 }: { height?: number }) {
  return (
    <div className="animate-pulse space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>
      <Skeleton className="w-full rounded-xl" style={{ height }} />
    </div>
  );
}

export function GlassCard({ children, className = '', ...props }: { children: React.ReactNode; className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <Card className={`backdrop-blur-md bg-card/70 dark:bg-card/70 border-border/40 shadow-lg hover:shadow-lg hover:shadow-rose-500/5 hover:scale-[1.005] transition-all duration-300 ${className}`} {...props}>
      {children}
    </Card>
  );
}

export function StatCard({ icon: Icon, label, value, sub, gradient, trend, index = 0 }: {
  icon: React.ElementType; label: string; value: string; sub?: string;
  gradient: string; trend?: 'up' | 'down' | 'neutral'; index?: number;
}) {
  return (
    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: index * 0.1, type: 'spring', stiffness: 300 }}
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.98 }}>
      <Card className="overflow-hidden shadow-md hover:shadow-xl active:scale-[0.99] transition-shadow duration-200 cursor-pointer">
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

export function EmptyState({ icon: Icon, title, description }: {
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

export function LiveClock() {
  const now = useClock();
  return (
    <div className="hidden sm:flex items-center gap-2.5 text-sm">
      <Clock className="w-3.5 h-3.5 text-muted-foreground" />
      <span className="font-medium text-muted-foreground">{format(now, 'EEE, MMM d, yyyy')}</span>
      <span className="font-mono text-xs bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950/40 dark:to-pink-950/40 text-rose-700 dark:text-rose-300 px-2.5 py-1 rounded-lg border border-rose-200/60 dark:border-rose-800/60 shadow-sm">
        {format(now, 'hh:mm:ss a')}
      </span>
    </div>
  );
}

// ─── PROFILE DROPDOWN ─────────────────────────────────────────
export function ProfileDropdown({ authUser, badge, onLogout, onOpenProfile }: {
  authUser: AuthUser;
  badge: { label: string; className: string } | null;
  onLogout: () => void;
  onOpenProfile: () => void;
}) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [notifEnabled, setNotifEnabled] = useState(true);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-lg p-1 hover:bg-muted/50 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500/30 cursor-pointer">
          <Avatar className="h-8 w-8 ring-2 ring-rose-200 dark:ring-rose-800">
            <AvatarFallback className="bg-gradient-to-br from-rose-500 to-pink-600 text-white font-bold text-xs">
              {getInitials(authUser.name)}
            </AvatarFallback>
          </Avatar>
          <ChevronDown className="w-3 h-3 text-muted-foreground hidden sm:block" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        {/* User Header */}
        <DropdownMenuLabel className="font-normal">
          <div className="flex items-start gap-3">
            <Avatar className="h-10 w-10 ring-2 ring-rose-200 dark:ring-rose-800">
              <AvatarFallback className="bg-gradient-to-br from-rose-500 to-pink-600 text-white font-bold text-sm">
                {getInitials(authUser.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{authUser.name}</p>
              {badge && (
                <span className={`inline-flex items-center rounded-full px-1.5 py-0 text-[10px] font-medium mt-0.5 ${badge.className}`}>
                  {badge.label}
                </span>
              )}
              <p className="text-xs text-muted-foreground truncate mt-0.5 flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                {authUser.storeName}
              </p>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={onOpenProfile} className="cursor-pointer">
            <UserCircle className="mr-2 h-4 w-4" />
            My Profile
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </DropdownMenuItem>
        </DropdownMenuGroup>
        {/* Settings subsection */}
        <DropdownMenuGroup>
          <DropdownMenuCheckboxItem
            checked={notifEnabled}
            onCheckedChange={setNotifEnabled}
            className="cursor-pointer"
          >
            <Bell className="mr-2 h-4 w-4" />
            Push Notifications
          </DropdownMenuCheckboxItem>
          <DropdownMenuItem
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            className="cursor-pointer"
          >
            {resolvedTheme === 'dark' ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
            {resolvedTheme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem className="cursor-pointer">
            <LifeBuoy className="mr-2 h-4 w-4" />
            Help &amp; Support
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer">
            <MessageSquare className="mr-2 h-4 w-4" />
            Send Feedback
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onLogout} variant="destructive" className="cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ProfileDialog({ authUser, badge, open, onClose }: {
  authUser: AuthUser;
  badge: { label: string; className: string } | null;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>My Profile</DialogTitle>
          <DialogDescription>Your account information</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 ring-2 ring-rose-200 dark:ring-rose-800">
              <AvatarFallback className="bg-gradient-to-br from-rose-500 to-pink-600 text-white font-bold text-xl">
                {getInitials(authUser.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-bold">{authUser.name}</h3>
              {badge && (
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium mt-1 ${badge.className}`}>
                  {badge.label}
                </span>
              )}
            </div>
          </div>
          <Separator />
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">Phone:</span>
              <span>{authUser.phone}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">Store:</span>
              <span>{authUser.storeName}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">City:</span>
              <span>{authUser.storeCity}</span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── SECTION NAVIGATION (sticky pills) ──────────────────────────
export function SectionNav({ sections, activeSection }: {
  sections: Array<{ id: string; label: string }>;
  activeSection: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            if (sections.some((s) => s.id === id)) {
              const btn = containerRef.current?.querySelector(`[data-section="${id}"]`);
              if (btn) {
                btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
              }
            }
          }
        }
      },
      { rootMargin: '-80px 0px -70% 0px', threshold: 0 }
    );

    for (const s of sections) {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [sections]);

  return (
    <div ref={containerRef} className="sticky top-[65px] z-30 -mx-4 px-4 py-2 bg-gradient-to-b from-background to-background/80 backdrop-blur-sm">
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
        {sections.map((s) => (
          <button
            key={s.id}
            data-section={s.id}
            onClick={() => handleScroll(s.id)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border cursor-pointer ${
              activeSection === s.id
                ? 'bg-rose-500 text-white border-rose-500 shadow-sm shadow-rose-500/25'
                : 'bg-muted/50 dark:bg-muted/20 text-muted-foreground border-border hover:border-rose-300 dark:hover:border-rose-700 hover:text-rose-600 dark:hover:text-rose-400'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── ERROR BOUNDARY ──────────────────────────────────────────────
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-rose-50/50 via-white to-pink-50/50 dark:from-gray-950 dark:via-gray-900 dark:to-rose-950/10">
          <Card className="max-w-md w-full border-red-200 dark:border-red-800">
            <CardContent className="p-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-xl font-bold">Something went wrong</h2>
              <p className="text-sm text-muted-foreground">{this.state.error?.message || 'An unexpected error occurred'}</p>
              <Button onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }} className="bg-rose-500 hover:bg-rose-600 text-white">
                <RefreshCw className="w-4 h-4 mr-2" /> Reload Page
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── SHARED SMALL COMPONENTS (used across views) ────────────────
export function ExpenseCategoryBadge({ category }: { category: string }) {
  const config = EXPENSE_CATEGORY_CONFIG[category];
  if (!config) return <Badge variant="secondary" className="text-[10px]">{category}</Badge>;
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${config.color} ${config.bg}`}>{category}</span>;
}

// ─── STAGGER ANIMATION COMPONENTS ──────────────────────────────
export function StaggerContainer({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.04, delayChildren: 0.1 } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 16 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function PaymentBreakdownCard({ analytics, title }: { analytics: AnalyticsData | null; title?: string }) {
  if (!analytics) return <ChartSkeleton />;
  const { totalCash, totalOnline, totalSplitCount, totalRevenue, paymentMethodBreakdown } = analytics;
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title || 'Payment Breakdown'}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20">
            <Banknote className="w-5 h-5 mx-auto mb-1 text-emerald-600 dark:text-emerald-400" />
            <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{formatCurrency(totalCash)}</p>
            <p className="text-[10px] text-muted-foreground">Cash</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-blue-50 dark:bg-blue-950/20">
            <CreditCard className="w-5 h-5 mx-auto mb-1 text-blue-600 dark:text-blue-400" />
            <p className="text-sm font-bold text-blue-700 dark:text-blue-300">{formatCurrency(totalOnline)}</p>
            <p className="text-[10px] text-muted-foreground">Online</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20">
            <Receipt className="w-5 h-5 mx-auto mb-1 text-amber-600 dark:text-amber-400" />
            <p className="text-sm font-bold text-amber-700 dark:text-amber-300">{totalSplitCount}</p>
            <p className="text-[10px] text-muted-foreground">Split</p>
          </div>
        </div>
        {paymentMethodBreakdown && paymentMethodBreakdown.length > 0 && (
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={paymentMethodBreakdown.map(p => ({ name: p.method, value: p.amount }))}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={3}
                dataKey="value"
              >
                <Cell fill="#22c55e" />
                <Cell fill="#3b82f6" />
                <Cell fill="#f59e0b" />
              </Pie>
              <RTooltip formatter={(v: number) => formatCurrency(v)} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
