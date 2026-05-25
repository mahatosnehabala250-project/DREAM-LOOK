'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Scissors, Building2, Crown, User, Phone, ChevronLeft, ChevronRight,
  Calendar, LogIn, RefreshCw, XCircle, Star, Heart, Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { AuthScreen } from '@/lib/salon-types';

export function LoginPage({ role, onLogin, onBack }: {
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
    } catch (err) {
      // Safety net — handleLogin shows toast, but set local error too
      setError((err as Error).message || 'Invalid credentials. Please try again.');
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
        <Card className="backdrop-blur-xl bg-card/70 border-border/30 shadow-2xl overflow-hidden">
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
export function LandingPage({ onSelectRole, onBookAsCustomer }: {
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
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 bg-gradient-to-br from-rose-50/50 via-background to-pink-50/50 dark:from-gray-950 dark:via-gray-900 dark:to-rose-950/10">
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-rose-200/30 dark:bg-rose-900/10 blur-3xl animate-breathe" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-pink-200/30 dark:bg-pink-900/10 blur-3xl animate-breathe" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/3 left-1/4 w-72 h-72 rounded-full bg-fuchsia-200/20 dark:bg-fuchsia-900/5 blur-3xl animate-breathe" style={{ animationDelay: '2s' }} />
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
              <Card className={`backdrop-blur-xl bg-card/60 border-border/20 shadow-lg ${card.shadow} hover:shadow-xl hover:-translate-y-1.5 active:scale-[0.98] transition-all duration-200 overflow-hidden h-full cursor-pointer`}>
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
