'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import {
  Scissors, MapPin, Clock, ChevronRight, Search, Moon, Sun,
  Calendar, BarChart3, Building2, Crown, Sparkles, Heart,
  Users, MessageSquare, HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { Role, AuthScreen, AuthUser, Appointment, Customer, Service } from '@/lib/salon-types';
import { useFetch } from '@/lib/salon-hooks';
import { formatCurrency, getInitials } from '@/lib/salon-utils';
import {
  MobileBottomNav, LiveClock, NotificationBell, ProfileDropdown, ProfileDialog,
  ErrorBoundary,
} from '@/components/salon/common';
import { LoginPage, LandingPage } from '@/components/salon/auth';
import { CustomerView } from '@/components/salon/customer-view';
import { EmployeeView } from '@/components/salon/employee-view';
import { ManagerView } from '@/components/salon/manager-view';
import { OwnerView, RecordServiceDialog } from '@/components/salon/owner-view';

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
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);

  // ─── Auth State ──────────────────────────────────────────────
  const [authScreen, setAuthScreen] = useState<AuthScreen>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('dreamlook_auth');
        if (saved) {
          const parsed = JSON.parse(saved);
          return (parsed?.screen as AuthScreen) || 'landing';
        }
      } catch { /* ignore */ }
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
      const res = await fetch('/api/salon/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, role }),
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
    <ErrorBoundary>
    <div className="min-h-screen bg-gradient-to-br from-rose-50/50 via-background to-pink-50/50 dark:from-gray-950 dark:via-gray-900 dark:to-rose-950/10 flex flex-col [background-image:radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.03)_1px,transparent_0)] [background-size:24px_24px] dark:[background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.03)_1px,transparent_0)]">
      {/* ─── HEADER ──────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b bg-background/80 dark:bg-background/80 backdrop-blur-xl">
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
                  <div className="absolute top-full mt-1 w-full bg-popover rounded-lg shadow-xl border z-50 overflow-hidden">
                    {searchResults.customers.length === 0 && searchResults.services.length === 0 && (
                      <div className="p-4 text-sm text-muted-foreground text-center">No results found</div>
                    )}
                    {searchResults.customers.length > 0 && (
                      <>
                        <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase">Customers</div>
                        {searchResults.customers.map(c => (
                          <div key={c.id} className="px-3 py-2 hover:bg-muted/50 flex items-center gap-2 text-sm cursor-pointer">
                            <Users className="w-3.5 h-3.5 text-muted-foreground" />
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
                  <ProfileDropdown
                    authUser={authUser}
                    badge={userBadge}
                    onLogout={handleLogout}
                    onOpenProfile={() => setProfileDialogOpen(true)}
                  />
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
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                        activeRole === tab.id
                          ? 'bg-background text-rose-600 dark:text-rose-400 shadow-sm'
                          : 'text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400'
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  ))}
                </nav>
              )}

              {/* Authenticated user actions (mobile) */}
              {authUser && (
                <div className="flex lg:hidden items-center gap-1">
                  <ProfileDropdown
                    authUser={authUser}
                    badge={userBadge}
                    onLogout={handleLogout}
                    onOpenProfile={() => setProfileDialogOpen(true)}
                  />
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
      <footer className={`border-t bg-gradient-to-r from-background/80 via-rose-50/50 to-pink-50/50 dark:via-rose-950/10 dark:to-pink-950/10 backdrop-blur-sm mt-auto ${!authUser ? 'pb-safe-bottom' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Top row: brand + links */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-sm">
                <Scissors className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Dream Look</p>
                <p className="text-[10px] text-muted-foreground">3 Locations Across Bangalore</p>
              </div>
            </div>

            {/* Quick Links */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
              <a href="#" className="text-xs text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400 transition-colors flex items-center gap-1">
                <HelpCircle className="w-3 h-3" /> Help Center
              </a>
              <a href="#" className="text-xs text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400 transition-colors">Privacy Policy</a>
              <a href="#" className="text-xs text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400 transition-colors">Terms of Service</a>
              <a href="#" className="text-xs text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400 transition-colors flex items-center gap-1">
                <MessageSquare className="w-3 h-3" /> Contact Support
              </a>
            </div>

            {/* Social Links (decorative) */}
            <div className="flex items-center gap-2">
              {['Instagram', 'Facebook', 'X'].map((platform) => (
                <a key={platform} href="#" aria-label={platform}
                  className="w-7 h-7 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-rose-500 hover:border-rose-300 dark:hover:border-rose-700 transition-all hover:shadow-sm">
                  {platform === 'Instagram' && <Heart className="w-3 h-3" />}
                  {platform === 'Facebook' && <Users className="w-3 h-3" />}
                  {platform === 'X' && <MessageSquare className="w-3 h-3" />}
                </a>
              ))}
            </div>
          </div>

          {/* Bottom row: copyright + version */}
          <Separator className="my-3" />
          <div className="flex flex-col sm:flex-row items-center justify-between gap-1.5">
            <p className="text-[10px] text-muted-foreground">
              &copy; {new Date().getFullYear()} Dream Look Salon. All rights reserved.
            </p>
            <div className="flex items-center gap-3">
              <p className="text-[10px] text-muted-foreground">
                Built with <Heart className="w-3 h-3 inline text-rose-500 fill-rose-500" /> for beautiful salons
              </p>
              <span className="text-[10px] text-muted-foreground/60">v2.0</span>
            </div>
          </div>
        </div>
      </footer>
      <RecordServiceDialog
        open={recordDialogOpen}
        onClose={() => { setRecordDialogOpen(false); setSelectedAppointment(null); }}
        appointment={selectedAppointment}
        onSuccess={recordCallback}
      />
      {authUser && (
        <ProfileDialog
          authUser={authUser}
          badge={userBadge}
          open={profileDialogOpen}
          onClose={() => setProfileDialogOpen(false)}
        />
      )}
    </div>
    </ErrorBoundary>
  );
}
