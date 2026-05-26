'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Scissors, MapPin, Phone, Clock, ChevronRight, ChevronLeft, ChevronDown,
  User, Calendar, Check, CheckCircle2, Search, Sparkles, Eye, Heart, Star,
  RefreshCw, Users, Building2, Shield, X, Timer,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { format, isBefore, isToday, startOfDay } from 'date-fns';
import type { Store, Service, Employee, Appointment } from '@/lib/salon-types';
import { useFetch, useConfetti } from '@/lib/salon-hooks';
import { formatTime, formatCurrency, getInitials, apiPost, apiPatch,
  TIME_SLOTS, SERVICE_CATEGORIES, STORE_GRADIENTS,
} from '@/lib/salon-utils';
import { ViewSkeleton, ErrorCard, GlassCard, EmptyState, StatusBadge, StaggerContainer, StaggerItem } from './common';

export function CustomerView() {
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
  const { fire: fireConfetti, confettiElement } = useConfetti();

  // Store busy status tracking
  const [storeBusyCounts, setStoreBusyCounts] = useState<Record<string, number>>({});

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

  // Fetch today's appointment count per store for busy indicators
  useEffect(() => {
    if (!stores || stores.length === 0) return;
    const today = format(new Date(), 'yyyy-MM-dd');
    Promise.all(
      stores.map(s =>
        fetch(`/api/salon/appointments?storeId=${s.id}&date=${today}`)
          .then(r => r.ok ? r.json() : [])
          .then((data: Appointment[]) => [s.id, data.length] as const)
          .catch(() => [s.id, 0] as const)
      )
    ).then(results => {
      const counts: Record<string, number> = {};
      results.forEach(([id, count]) => { counts[id] = count; });
      setStoreBusyCounts(counts);
    });
  }, [stores]);

  // Determine least busy store for "Best availability" badge
  const leastBusyStoreId = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 9 || hour >= 20) return null;
    const openStores = (stores || []).filter(s => s.isActive);
    if (openStores.length < 2) return null;
    const counts = openStores.map(s => storeBusyCounts[s.id] ?? 0);
    const uniqueCounts = new Set(counts);
    if (uniqueCounts.size <= 1) return null;
    const minCount = Math.min(...counts);
    const leastBusy = openStores.find(s => (storeBusyCounts[s.id] ?? 0) === minCount);
    return leastBusy?.id || null;
  }, [stores, storeBusyCounts]);

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
      fireConfetti();
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
      <>
        {confettiElement}
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
      </>
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
            <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(stores || []).map((store, idx) => {
                const borderColors = ['border-l-rose-500', 'border-l-amber-500', 'border-l-emerald-500'];
                const iconGradients = [STORE_GRADIENTS[0], STORE_GRADIENTS[1], STORE_GRADIENTS[2]];
                const isRecommended = leastBusyStoreId === store.id;
                const busyCount = storeBusyCounts[store.id] ?? 0;
                const estimatedWaitMin = busyCount * 30;
                return (
                <StaggerItem key={store.id}>
                <div className="hover:-translate-y-1 active:scale-[0.98] transition-transform duration-150 relative">
                  {isRecommended && (
                    <div className="absolute -top-2.5 -right-2 z-10 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[9px] font-bold px-2.5 py-1 rounded-full shadow-md shadow-emerald-500/25 flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" /> Recommended
                    </div>
                  )}
                  <GlassCard className={`cursor-pointer transition-all hover:shadow-xl border-l-4 ${borderColors[idx] || borderColors[0]} ${
                    selectedStore === store.id ? 'ring-2 ring-rose-500 shadow-xl shadow-rose-500/10' : ''
                  }`} onClick={() => { setSelectedStore(store.id); setSelectedEmployeeId(''); setSelectedTimeSlot(''); }}>
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br ${iconGradients[idx] || iconGradients[0]} text-white shadow-md`}>
                          <Building2 className="w-6 h-6" />
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
                          <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                            <StoreStatusBadge count={busyCount} />
                            {/* Estimated Wait Time */}
                            <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${
                              busyCount === 0
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                : busyCount <= 3
                                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                  : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                              <Timer className="w-3 h-3" />
                              {busyCount === 0 ? 'No wait' : `~${estimatedWaitMin} min wait`}
                            </span>
                            {!isRecommended && (
                              <span className="text-[10px] text-muted-foreground">{busyCount} today</span>
                            )}
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
                </StaggerItem>
              );
              })}
            </StaggerContainer>
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
              <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredServices.map((service) => (
                  <StaggerItem key={service.id}>
                  <div className="hover:-translate-y-0.5 active:scale-[0.98] transition-transform duration-150">
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
                  </StaggerItem>
                ))}
              </StaggerContainer>
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
                              isPast ? 'bg-muted/30 dark:bg-muted/10 text-muted-foreground cursor-not-allowed' :
                              'bg-card border hover:border-rose-300 dark:hover:border-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30'
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
                              isSelected ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400' : 'bg-muted dark:bg-muted/50'
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

// ─── STORE STATUS BADGE ─────────────────────────────────
function StoreStatusBadge({ count }: { count: number }) {
  const hour = new Date().getHours();
  const isClosed = hour < 9 || hour >= 20;

  if (isClosed) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="relative flex h-1.5 w-1.5">
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-gray-400 dark:bg-gray-500" />
        </span>
        <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Closed</span>
      </div>
    );
  }

  let label: string;
  let dotColor: string;
  let textColor: string;

  if (count <= 2) {
    label = 'Open — Quiet';
    dotColor = 'bg-emerald-400';
    textColor = 'text-emerald-600 dark:text-emerald-400';
  } else if (count <= 5) {
    label = 'Open — Moderate';
    dotColor = 'bg-amber-400';
    textColor = 'text-amber-600 dark:text-amber-400';
  } else {
    label = 'Open — Busy';
    dotColor = 'bg-rose-400';
    textColor = 'text-rose-600 dark:text-rose-400';
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="relative flex h-1.5 w-1.5">
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${dotColor} opacity-75`} />
        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${dotColor}`} />
      </span>
      <span className={`text-[11px] font-medium ${textColor}`}>{label}</span>
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
