'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Scissors,
  MapPin,
  Phone,
  Clock,
  ChevronRight,
  ChevronLeft,
  User,
  DollarSign,
  Calendar,
  Check,
  Star,
  Crown,
  Download,
  Package,
  AlertTriangle,
  Shield,
  TrendingUp,
  Users,
  Building2,
  IndianRupee,
  CircleDot,
  Play,
  CheckCircle2,
  XCircle,
  LogIn,
  LogOut,
  BarChart3,
  FileText,
  ArrowUpDown,
  Eye,
  EyeOff,
  Sparkles,
  Heart,
  Timer,
  Layers,
  ClipboardList,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { format, addDays, isToday, isBefore, startOfDay, isSameDay } from 'date-fns';

// ─── TYPES ───────────────────────────────────────────────────────
type Role = 'customer' | 'employee' | 'manager' | 'owner';

interface Store {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string;
}

interface Service {
  id: string;
  name: string;
  category: string;
  price: number;
  duration: number;
}

interface Employee {
  id: string;
  name: string;
  storeId: string;
  role: string;
  phone: string;
}

interface Product {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  reorderLevel: number;
  cost: number;
}

interface Appointment {
  id: string;
  customerName: string;
  customerPhone: string;
  serviceId: string;
  serviceName: string;
  storeId: string;
  employeeId: string;
  employeeName: string;
  date: string;
  time: string;
  status: 'booked' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  price: number;
}

interface AttendanceRecord {
  employeeId: string;
  employeeName: string;
  role: string;
  checkIn: string | null;
  checkOut: string | null;
  present: boolean;
}

// ─── MOCK DATA ──────────────────────────────────────────────────
const STORES: Store[] = [
  { id: 's1', name: 'Dream Look - MG Road', address: '42, MG Road, Near City Mall', city: 'Bangalore', phone: '+91 98765 43210' },
  { id: 's2', name: 'Dream Look - Indiranagar', address: '100 Ft Road, Above Pantaloons', city: 'Bangalore', phone: '+91 98765 43211' },
  { id: 's3', name: 'Dream Look - Koramangala', address: '5th Block, Near Forum Mall', city: 'Bangalore', phone: '+91 98765 43212' },
];

const SERVICES: Service[] = [
  { id: 'sv1', name: 'Classic Haircut', category: 'HAIRCUT', price: 200, duration: 30 },
  { id: 'sv2', name: 'Premium Haircut', category: 'HAIRCUT', price: 350, duration: 45 },
  { id: 'sv3', name: 'Beard Trim & Shape', category: 'HAIRCUT', price: 150, duration: 20 },
  { id: 'sv4', name: 'Kids Haircut', category: 'HAIRCUT', price: 120, duration: 20 },
  { id: 'sv5', name: 'Global Hair Color', category: 'COLOR', price: 2000, duration: 120 },
  { id: 'sv6', name: 'Highlights (Half Head)', category: 'COLOR', price: 1500, duration: 90 },
  { id: 'sv7', name: 'Root Touch-Up', category: 'COLOR', price: 800, duration: 60 },
  { id: 'sv8', name: 'Hair Spa Treatment', category: 'TREATMENT', price: 1200, duration: 60 },
  { id: 'sv9', name: 'Keratin Treatment', category: 'TREATMENT', price: 3500, duration: 150 },
  { id: 'sv10', name: 'Dandruff Treatment', category: 'TREATMENT', price: 600, duration: 30 },
  { id: 'sv11', name: 'Full Body Massage', category: 'SPA', price: 2000, duration: 90 },
  { id: 'sv12', name: 'Facial - Gold', category: 'SPA', price: 1500, duration: 60 },
  { id: 'sv13', name: 'Pedisure & Manicure', category: 'SPA', price: 800, duration: 45 },
  { id: 'sv14', name: 'Bridal Makeup', category: 'BRIDAL', price: 15000, duration: 240 },
  { id: 'sv15', name: 'Bridal Hair Styling', category: 'BRIDAL', price: 5000, duration: 120 },
  { id: 'sv16', name: 'Mehendi (Hands)', category: 'BRIDAL', price: 3000, duration: 90 },
];

const EMPLOYEES: Employee[] = [
  { id: 'e1', name: 'Priya Sharma', storeId: 's1', role: 'Senior Stylist', phone: '+91 99001 10001' },
  { id: 'e2', name: 'Rahul Kumar', storeId: 's1', role: 'Hair Stylist', phone: '+91 99001 10002' },
  { id: 'e3', name: 'Sneha Patel', storeId: 's1', role: 'Colorist', phone: '+91 99001 10003' },
  { id: 'e4', name: 'Vikram Singh', storeId: 's1', role: 'Manager', phone: '+91 99001 10004' },
  { id: 'e5', name: 'Anjali Reddy', storeId: 's2', role: 'Senior Stylist', phone: '+91 99001 10005' },
  { id: 'e6', name: 'Karthik M', storeId: 's2', role: 'Hair Stylist', phone: '+91 99001 10006' },
  { id: 'e7', name: 'Divya Nair', storeId: 's2', role: 'Spa Therapist', phone: '+91 99001 10007' },
  { id: 'e8', name: 'Rajesh Babu', storeId: 's2', role: 'Manager', phone: '+91 99001 10008' },
  { id: 'e9', name: 'Meera Joshi', storeId: 's3', role: 'Senior Stylist', phone: '+91 99001 10009' },
  { id: 'e10', name: 'Arjun Das', storeId: 's3', role: 'Hair Stylist', phone: '+91 99001 10010' },
  { id: 'e11', name: 'Pooja Gupta', storeId: 's3', role: 'Bridal Specialist', phone: '+91 99001 10011' },
  { id: 'e12', name: 'Suresh K', storeId: 's3', role: 'Manager', phone: '+91 99001 10012' },
];

const PRODUCTS: Product[] = [
  { id: 'p1', name: 'L\'Oréal Shampoo (1L)', quantity: 12, unit: 'bottles', reorderLevel: 5, cost: 450 },
  { id: 'p2', name: 'Hair Color - Black (100g)', quantity: 3, unit: 'packets', reorderLevel: 10, cost: 120 },
  { id: 'p3', name: 'Hair Serum (200ml)', quantity: 8, unit: 'bottles', reorderLevel: 5, cost: 350 },
  { id: 'p4', name: 'Conditioner (500ml)', quantity: 15, unit: 'bottles', reorderLevel: 5, cost: 280 },
  { id: 'p5', name: 'Keratin Cream (500g)', quantity: 0, unit: 'tubs', reorderLevel: 3, cost: 1200 },
  { id: 'p6', name: 'Bleach Powder (500g)', quantity: 6, unit: 'packets', reorderLevel: 8, cost: 180 },
  { id: 'p7', name: 'Facial Kit - Gold', quantity: 4, unit: 'kits', reorderLevel: 5, cost: 350 },
  { id: 'p8', name: 'Massage Oil (1L)', quantity: 10, unit: 'bottles', reorderLevel: 4, cost: 550 },
  { id: 'p9', name: 'Hair Gel (500g)', quantity: 20, unit: 'tubs', reorderLevel: 5, cost: 200 },
  { id: 'p10', name: 'Cotton Roll', quantity: 50, unit: 'rolls', reorderLevel: 20, cost: 80 },
];

const TODAY_APPOINTMENTS: Appointment[] = [
  { id: 'a1', customerName: 'Amit Verma', customerPhone: '+91 88001 20001', serviceId: 'sv1', serviceName: 'Classic Haircut', storeId: 's1', employeeId: 'e1', employeeName: 'Priya Sharma', date: format(new Date(), 'yyyy-MM-dd'), time: '09:00', status: 'completed', price: 200 },
  { id: 'a2', customerName: 'Sunita Rao', customerPhone: '+91 88001 20002', serviceId: 'sv5', serviceName: 'Global Hair Color', storeId: 's1', employeeId: 'e3', employeeName: 'Sneha Patel', date: format(new Date(), 'yyyy-MM-dd'), time: '09:30', status: 'completed', price: 2000 },
  { id: 'a3', customerName: 'Rohan Iyer', customerPhone: '+91 88001 20003', serviceId: 'sv2', serviceName: 'Premium Haircut', storeId: 's1', employeeId: 'e1', employeeName: 'Priya Sharma', date: format(new Date(), 'yyyy-MM-dd'), time: '10:30', status: 'in_progress', price: 350 },
  { id: 'a4', customerName: 'Kavitha Nair', customerPhone: '+91 88001 20004', serviceId: 'sv12', serviceName: 'Facial - Gold', storeId: 's1', employeeId: 'e2', employeeName: 'Rahul Kumar', date: format(new Date(), 'yyyy-MM-dd'), time: '11:00', status: 'confirmed', price: 1500 },
  { id: 'a5', customerName: 'Deepak M', customerPhone: '+91 88001 20005', serviceId: 'sv8', serviceName: 'Hair Spa Treatment', storeId: 's1', employeeId: 'e3', employeeName: 'Sneha Patel', date: format(new Date(), 'yyyy-MM-dd'), time: '13:00', status: 'booked', price: 1200 },
  { id: 'a6', customerName: 'Neha Kapoor', customerPhone: '+91 88001 20006', serviceId: 'sv3', serviceName: 'Beard Trim & Shape', storeId: 's1', employeeId: 'e2', employeeName: 'Rahul Kumar', date: format(new Date(), 'yyyy-MM-dd'), time: '14:00', status: 'booked', price: 150 },
  { id: 'a7', customerName: 'Arjun Menon', customerPhone: '+91 88001 20007', serviceId: 'sv6', serviceName: 'Highlights (Half Head)', storeId: 's1', employeeId: 'e1', employeeName: 'Priya Sharma', date: format(new Date(), 'yyyy-MM-dd'), time: '15:30', status: 'booked', price: 1500 },
  { id: 'a8', customerName: 'Preeti Sharma', customerPhone: '+91 88001 20008', serviceId: 'sv13', serviceName: 'Pedisure & Manicure', storeId: 's1', employeeId: 'e2', employeeName: 'Rahul Kumar', date: format(new Date(), 'yyyy-MM-dd'), time: '16:30', status: 'booked', price: 800 },
];

const REVENUE_CHART_DATA = [
  { day: 'Mon', mg: 8500, ind: 7200, kor: 6100 },
  { day: 'Tue', mg: 6200, ind: 5800, kor: 4900 },
  { day: 'Wed', mg: 9100, ind: 8400, kor: 7300 },
  { day: 'Thu', mg: 7800, ind: 6500, kor: 5600 },
  { day: 'Fri', mg: 12000, ind: 10200, kor: 8800 },
  { day: 'Sat', mg: 15500, ind: 13800, kor: 11400 },
  { day: 'Sun', mg: 11200, ind: 9600, kor: 8200 },
];

const MONTHLY_REVENUE_DATA = Array.from({ length: 12 }, (_, i) => ({
  month: format(new Date(2025, i, 1), 'MMM'),
  revenue: Math.floor(200000 + Math.random() * 150000),
}));

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
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

const TIME_SLOTS = generateTimeSlots();
const SERVICE_CATEGORIES = ['ALL', 'HAIRCUT', 'COLOR', 'TREATMENT', 'SPA', 'BRIDAL'];

// Simulated "busy" slots for demo
const BUSY_SLOTS = ['09:00', '09:30', '10:00', '10:30', '11:00', '13:00', '15:30', '16:30'];

// ─── ANIMATED COUNTER HOOK ──────────────────────────────────────
function useAnimatedNumber(target: number, duration = 1000) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let startTime: number;
    let animationFrame: number;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setValue(Math.floor(progress * target));
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [target, duration]);
  return value;
}

// ─── STATUS BADGE ───────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    booked: { label: 'Booked', className: 'bg-blue-100 text-blue-800 border-blue-200' },
    confirmed: { label: 'Confirmed', className: 'bg-amber-100 text-amber-800 border-amber-200' },
    in_progress: { label: 'In Progress', className: 'bg-purple-100 text-purple-800 border-purple-200' },
    completed: { label: 'Completed', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-800 border-red-200' },
    present: { label: 'Present', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    absent: { label: 'Absent', className: 'bg-red-100 text-red-800 border-red-200' },
  };
  const c = config[status] || { label: status, className: 'bg-gray-100 text-gray-800 border-gray-200' };
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${c.className}`}>{c.label}</span>;
}

// ─── STOCK STATUS ───────────────────────────────────────────────
function StockIndicator({ quantity, reorderLevel }: { quantity: number; reorderLevel: number }) {
  if (quantity === 0) return <Badge variant="destructive">Out of Stock</Badge>;
  if (quantity <= reorderLevel) return <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100">Low Stock</Badge>;
  return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100">In Stock</Badge>;
}

// ═══════════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════════
export default function Home() {
  const [activeRole, setActiveRole] = useState<Role>('customer');
  const [loading, setLoading] = useState(true);

  // Customer booking state
  const [bookingStep, setBookingStep] = useState(0);
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [bookingComplete, setBookingComplete] = useState(false);
  const [serviceFilter, setServiceFilter] = useState('ALL');

  // Employee state
  const [selectedEmployee, setSelectedEmployee] = useState<string>('e1');
  const [recordDialogOpen, setRecordDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [recordProducts, setRecordProducts] = useState<Record<string, boolean>>({});
  const [recordQuantities, setRecordQuantities] = useState<Record<string, number>>({});

  // Manager state
  const [managerStoreId, setManagerStoreId] = useState<string>('s1');
  const [inventoryFilter, setInventoryFilter] = useState<'all' | 'low' | 'out'>('all');

  // Owner state
  const [settlementEmployee, setSettlementEmployee] = useState<string>('e1');
  const [settlementMonth, setSettlementMonth] = useState('2025-01');
  const [settlementCalculated, setSettlementCalculated] = useState(false);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  // Attendance is managed inside ManagerView with key-based reset

  const handleBooking = useCallback(() => {
    setBookingComplete(true);
    toast.success('Appointment booked successfully!', { description: 'We\'ll send a reminder to your phone.' });
  }, []);

  const handleCompleteService = useCallback((appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setRecordDialogOpen(true);
    setRecordProducts({});
    setRecordQuantities({});
  }, []);

  const handleRecordSubmit = useCallback(() => {
    if (!selectedAppointment) return;
    const usedProducts = PRODUCTS.filter((p) => recordProducts[p.id]);
    const productDetails = usedProducts.map((p) => ({
      cost: p.cost,
      quantity: recordQuantities[p.id] || 1,
      name: p.name,
    }));
    const commission = calculateCommission(selectedAppointment.price, productDetails);
    toast.success('Service recorded!', {
      description: `Net earnings: ${formatCurrency(commission.employeeNet)}`,
    });
    setRecordDialogOpen(false);
  }, [selectedAppointment, recordProducts, recordQuantities]);

  const handleCalculateSettlement = useCallback(() => {
    setSettlementCalculated(true);
    toast.success('Settlement calculated');
  }, []);

  const handleExportCSV = useCallback(() => {
    const emp = EMPLOYEES.find((e) => e.id === settlementEmployee);
    const rows = [
      ['Date', 'Customer', 'Service', 'Price', 'Gross Commission', 'Products Used', 'Deduction', 'Net Earned'],
      ['2025-01-05', 'Amit Verma', 'Classic Haircut', '200', '100', 'L\'Oréal Shampoo (₹450)', '450', '-350'],
      ['2025-01-08', 'Sunita Rao', 'Premium Haircut', '350', '175', '', '0', '175'],
      ['2025-01-12', 'Rohan Iyer', 'Hair Color', '2000', '1000', 'Hair Color Black (₹120 x2)', '240', '760'],
      ['2025-01-15', 'Kavitha Nair', 'Facial Gold', '1500', '750', 'Facial Kit (₹350)', '350', '400'],
      ['2025-01-18', 'Deepak M', 'Beard Trim', '150', '75', '', '0', '75'],
      ['2025-01-22', 'Neha Kapoor', 'Keratin', '3500', '1750', 'Keratin Cream (₹1200)', '1200', '550'],
      ['2025-01-25', 'Arjun Menon', 'Classic Haircut', '200', '100', '', '0', '100'],
      ['', '', 'TOTAL', '7900', '3950', '', '2240', '1710'],
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `settlement_${emp?.name || 'employee'}_${settlementMonth}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported successfully');
  }, [settlementEmployee, settlementMonth]);

  // Computed values
  const filteredServices = serviceFilter === 'ALL' ? SERVICES : SERVICES.filter((s) => s.category === serviceFilter);
  const currentEmp = EMPLOYEES.find((e) => e.id === selectedEmployee);
  const currentEmpStore = STORES.find((s) => s.id === currentEmp?.storeId);

  // Settlement data
  const settlementData = useMemo(() => ({
    totalServices: 7,
    totalRevenue: 7900,
    ownerShare: 3950,
    employeeGross: 3950,
    productDeductions: 2240,
    netPayout: 1710,
  }), [settlementCalculated]);

  const filteredProducts = useMemo(() => {
    if (inventoryFilter === 'low') return PRODUCTS.filter((p) => p.quantity > 0 && p.quantity <= p.reorderLevel);
    if (inventoryFilter === 'out') return PRODUCTS.filter((p) => p.quantity === 0);
    return PRODUCTS;
  }, [inventoryFilter]);

  const selectedServiceData = SERVICES.find((s) => s.id === selectedService);

  // ─── LOADING STATE ────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-rose-50">
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
          <Skeleton className="h-16 w-full rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
          </div>
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  // ─── RENDER ───────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50 flex flex-col">
      {/* ─── TOP HEADER ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Brand */}
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-md">
                <Scissors className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
                  Dream Look
                </h1>
              </div>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1 bg-rose-50 rounded-xl p-1">
              {([
                { id: 'customer' as Role, label: 'Book Appointment', icon: Calendar },
                { id: 'employee' as Role, label: 'My Dashboard', icon: BarChart3 },
                { id: 'manager' as Role, label: 'Manage Store', icon: Building2 },
                { id: 'owner' as Role, label: 'Owner Panel', icon: Crown },
              ]).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveRole(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeRole === tab.id
                      ? 'bg-white text-rose-600 shadow-sm'
                      : 'text-gray-600 hover:text-rose-600 hover:bg-white/50'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </nav>

            {/* Mobile Menu */}
            <div className="md:hidden">
              <Select value={activeRole} onValueChange={(v) => setActiveRole(v as Role)}>
                <SelectTrigger className="w-[180px]">
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
      </header>

      {/* ─── MAIN CONTENT ───────────────────────────────────────── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeRole}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* ─── CUSTOMER VIEW ────────────────────────────────── */}
            {activeRole === 'customer' && (
              <CustomerView
                step={bookingStep}
                setStep={setBookingStep}
                selectedStore={selectedStore}
                setSelectedStore={setSelectedStore}
                selectedService={selectedService}
                setSelectedService={setSelectedService}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                selectedTime={selectedTime}
                setSelectedTime={setSelectedTime}
                customerName={customerName}
                setCustomerName={setCustomerName}
                customerPhone={customerPhone}
                setCustomerPhone={setCustomerPhone}
                serviceFilter={serviceFilter}
                setServiceFilter={setServiceFilter}
                filteredServices={filteredServices}
                selectedServiceData={selectedServiceData}
                bookingComplete={bookingComplete}
                handleBooking={handleBooking}
                setBookingComplete={setBookingComplete}
              />
            )}

            {/* ─── EMPLOYEE VIEW ────────────────────────────────── */}
            {activeRole === 'employee' && (
              <EmployeeView
                employees={EMPLOYEES}
                selectedEmployee={selectedEmployee}
                setSelectedEmployee={setSelectedEmployee}
                currentEmp={currentEmp}
                currentEmpStore={currentEmpStore}
                handleCompleteService={handleCompleteService}
              />
            )}

            {/* ─── MANAGER VIEW ─────────────────────────────────── */}
            {activeRole === 'manager' && (
              <ManagerView
                key={managerStoreId}
                stores={STORES}
                managerStoreId={managerStoreId}
                setManagerStoreId={setManagerStoreId}
                appointments={TODAY_APPOINTMENTS.filter((a) => a.storeId === managerStoreId)}
                products={PRODUCTS}
                inventoryFilter={inventoryFilter}
                setInventoryFilter={setInventoryFilter}
                filteredProducts={filteredProducts}
              />
            )}

            {/* ─── OWNER VIEW ───────────────────────────────────── */}
            {activeRole === 'owner' && (
              <OwnerView
                employees={EMPLOYEES}
                settlementEmployee={settlementEmployee}
                setSettlementEmployee={setSettlementEmployee}
                settlementMonth={settlementMonth}
                setSettlementMonth={setSettlementMonth}
                settlementCalculated={settlementCalculated}
                setSettlementCalculated={setSettlementCalculated}
                handleCalculateSettlement={handleCalculateSettlement}
                handleExportCSV={handleExportCSV}
                settlementData={settlementData}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ─── FOOTER ─────────────────────────────────────────────── */}
      <footer className="border-t bg-white/60 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">
            &copy; 2025 Dream Look Salon Management. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground">
            Built with <Heart className="w-3.5 h-3.5 inline text-rose-500 fill-rose-500" /> for beautiful salons
          </p>
        </div>
      </footer>

      {/* ─── RECORD SERVICE DIALOG ──────────────────────────────── */}
      <RecordServiceDialog
        open={recordDialogOpen}
        onClose={() => setRecordDialogOpen(false)}
        appointment={selectedAppointment}
        products={PRODUCTS}
        recordProducts={recordProducts}
        setRecordProducts={setRecordProducts}
        recordQuantities={recordQuantities}
        setRecordQuantities={setRecordQuantities}
        onSubmit={handleRecordSubmit}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// CUSTOMER VIEW
// ═══════════════════════════════════════════════════════════════════
interface CustomerViewProps {
  step: number;
  setStep: (s: number) => void;
  selectedStore: string;
  setSelectedStore: (s: string) => void;
  selectedService: string;
  setSelectedService: (s: string) => void;
  selectedDate: Date | undefined;
  setSelectedDate: (d: Date | undefined) => void;
  selectedTime: string;
  setSelectedTime: (t: string) => void;
  customerName: string;
  setCustomerName: (n: string) => void;
  customerPhone: string;
  setCustomerPhone: (p: string) => void;
  serviceFilter: string;
  setServiceFilter: (f: string) => void;
  filteredServices: Service[];
  selectedServiceData: Service | undefined;
  bookingComplete: boolean;
  handleBooking: () => void;
  setBookingComplete: (b: boolean) => void;
}

function CustomerView({
  step, setStep, selectedStore, setSelectedStore,
  selectedService, setSelectedService,
  selectedDate, setSelectedDate,
  selectedTime, setSelectedTime,
  customerName, setCustomerName,
  customerPhone, setCustomerPhone,
  serviceFilter, setServiceFilter,
  filteredServices, selectedServiceData,
  bookingComplete, handleBooking, setBookingComplete,
}: CustomerViewProps) {
  const steps = ['Store', 'Service', 'Date & Time', 'Details', 'Confirm'];

  const canNext = useMemo(() => {
    if (step === 0) return !!selectedStore;
    if (step === 1) return !!selectedService;
    if (step === 2) return !!selectedDate && !!selectedTime;
    if (step === 3) return !!customerName.trim() && !!customerPhone.trim();
    return false;
  }, [step, selectedStore, selectedService, selectedDate, selectedTime, customerName, customerPhone]);

  const goNext = () => {
    if (canNext && step < 4) setStep(step + 1);
  };
  const goBack = () => {
    if (step > 0) setStep(step - 1);
  };

  if (bookingComplete) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center mb-6"
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
          >
            <CheckCircle2 className="w-14 h-14 text-emerald-600" />
          </motion.div>
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-2xl font-bold text-gray-900 mb-2"
        >
          Booking Confirmed!
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-muted-foreground mb-2"
        >
          We&apos;ll send a reminder to your phone
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-sm text-muted-foreground mb-8"
        >
          {selectedServiceData?.name} at {STORES.find((s) => s.id === selectedStore)?.name}
          <br />
          {selectedDate && format(selectedDate, 'EEE, MMM d, yyyy')} at {formatTime(selectedTime)}
        </motion.p>
        <Button
          onClick={() => {
            setBookingComplete(false);
            setStep(0);
            setSelectedStore('');
            setSelectedService('');
            setSelectedDate(new Date());
            setSelectedTime('');
            setCustomerName('');
            setCustomerPhone('');
          }}
          className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700"
        >
          Book Another Appointment
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            {steps.map((label, i) => (
              <React.Fragment key={label}>
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                      i <= step
                        ? 'bg-rose-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {i < step ? <Check className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className={`text-xs hidden sm:block ${i <= step ? 'text-rose-600 font-medium' : 'text-muted-foreground'}`}>
                    {label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 rounded transition-colors ${i < step ? 'bg-rose-500' : 'bg-gray-200'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.25 }}
        >
          {/* Step 0: Choose Store */}
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold">Choose a Store</h2>
              <p className="text-muted-foreground text-sm">Select your preferred Dream Look location</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {STORES.map((store) => (
                  <motion.div
                    key={store.id}
                    whileHover={{ y: -4, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card
                      className={`cursor-pointer transition-all hover:shadow-lg ${
                        selectedStore === store.id
                          ? 'ring-2 ring-rose-500 shadow-lg border-rose-200'
                          : 'hover:border-rose-200'
                      }`}
                      onClick={() => setSelectedStore(store.id)}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            selectedStore === store.id ? 'bg-rose-100' : 'bg-gray-100'
                          }`}>
                            <Building2 className={`w-5 h-5 ${selectedStore === store.id ? 'text-rose-600' : 'text-gray-500'}`} />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-sm">{store.name}</h3>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                              <MapPin className="w-3 h-3" />
                              {store.address}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                              <MapPin className="w-3 h-3" />
                              {store.city}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                              <Phone className="w-3 h-3" />
                              {store.phone}
                            </div>
                          </div>
                        </div>
                        {selectedStore === store.id && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="mt-3 flex items-center gap-1 text-rose-600 text-xs font-medium"
                          >
                            <Check className="w-3.5 h-3.5" /> Selected
                          </motion.div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: Choose Service */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold">Choose a Service</h2>
              <p className="text-muted-foreground text-sm">Select the service you&apos;d like</p>
              <div className="flex flex-wrap gap-2">
                {SERVICE_CATEGORIES.map((cat) => (
                  <Button
                    key={cat}
                    size="sm"
                    variant={serviceFilter === cat ? 'default' : 'outline'}
                    onClick={() => setServiceFilter(cat)}
                    className={serviceFilter === cat ? 'bg-rose-500 hover:bg-rose-600' : ''}
                  >
                    {cat === 'ALL' ? 'All Services' : cat.charAt(0) + cat.slice(1).toLowerCase()}
                  </Button>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredServices.map((service) => (
                  <motion.div
                    key={service.id}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedService === service.id
                          ? 'ring-2 ring-rose-500 border-rose-200 shadow-md'
                          : 'hover:border-rose-200'
                      }`}
                      onClick={() => setSelectedService(service.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-medium text-sm">{service.name}</h3>
                            <Badge variant="secondary" className="mt-1.5 text-[10px]">
                              {service.category}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-rose-600">{formatCurrency(service.price)}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end mt-0.5">
                              <Clock className="w-3 h-3" /> {service.duration} min
                            </p>
                          </div>
                        </div>
                        {selectedService === service.id && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="mt-2 flex items-center gap-1 text-rose-600 text-xs font-medium"
                          >
                            <Check className="w-3.5 h-3.5" /> Selected
                          </motion.div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Date & Time */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold">Pick Date & Time</h2>
              <p className="text-muted-foreground text-sm">Choose your preferred appointment slot</p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Calendar */}
                <Card>
                  <CardContent className="p-4 flex justify-center">
                    <CalendarComponent
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={(date) => isBefore(date, startOfDay(new Date()))}
                      className="rounded-md"
                    />
                  </CardContent>
                </Card>
                {/* Time Slots */}
                <div className="space-y-3">
                  <h3 className="font-medium text-sm">Available Time Slots</h3>
                  <ScrollArea className="h-[320px]">
                    <div className="grid grid-cols-3 gap-2 pr-3">
                      {TIME_SLOTS.map((slot) => {
                        const now = new Date();
                        const [h, m] = slot.split(':').map(Number);
                        const slotDate = selectedDate ? new Date(selectedDate) : new Date();
                        slotDate.setHours(h, m, 0, 0);
                        const isPast = isBefore(slotDate, now);
                        const isBusy = BUSY_SLOTS.includes(slot);

                        return (
                          <button
                            key={slot}
                            disabled={isPast || isBusy}
                            onClick={() => setSelectedTime(slot)}
                            className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-all border ${
                              selectedTime === slot
                                ? 'bg-rose-500 text-white border-rose-500 shadow-md'
                                : isPast
                                  ? 'bg-gray-100 text-gray-300 border-gray-100 cursor-not-allowed'
                                  : isBusy
                                    ? 'bg-red-50 text-red-300 border-red-100 cursor-not-allowed line-through'
                                    : 'bg-white text-gray-700 border-gray-200 hover:border-rose-300 hover:bg-rose-50'
                            }`}
                          >
                            {formatTime(slot)}
                          </button>
                        );
                      })}
                    </div>
                  </ScrollArea>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-white border border-gray-200" /> Available</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-rose-500" /> Selected</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-50 border border-red-100" /> Busy</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Customer Details */}
          {step === 3 && (
            <div className="max-w-md mx-auto space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-bold">Your Details</h2>
                <p className="text-muted-foreground text-sm mt-1">No account needed &mdash; just walk in!</p>
              </div>
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      placeholder="Enter your name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      placeholder="+91 98765 43210"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>
              <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
                <Shield className="w-3.5 h-3.5" />
                Your information is private and secure. We only use it for appointment reminders.
              </div>
            </div>
          )}

          {/* Step 4: Confirmation */}
          {step === 4 && (
            <div className="max-w-lg mx-auto space-y-6">
              <h2 className="text-xl font-bold text-center">Booking Summary</h2>
              <Card className="overflow-hidden">
                <div className="bg-gradient-to-r from-rose-500 to-pink-600 px-6 py-4">
                  <p className="text-white/80 text-sm">Dream Look</p>
                  <h3 className="text-white font-bold text-lg">Appointment Confirmation</h3>
                </div>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center shrink-0">
                      <Building2 className="w-4 h-4 text-rose-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Store</p>
                      <p className="font-medium text-sm">{STORES.find((s) => s.id === selectedStore)?.name}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Service</p>
                      <p className="font-medium text-sm">{selectedServiceData?.name}</p>
                      <p className="text-xs text-muted-foreground">{selectedServiceData?.duration} minutes &middot; {formatCurrency(selectedServiceData?.price || 0)}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                      <Calendar className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Date & Time</p>
                      <p className="font-medium text-sm">{selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')}</p>
                      <p className="text-xs text-muted-foreground">{formatTime(selectedTime)}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Customer</p>
                      <p className="font-medium text-sm">{customerName}</p>
                      <p className="text-xs text-muted-foreground">{customerPhone}</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-gray-50 px-6 py-4">
                  <div className="flex items-center justify-between w-full">
                    <span className="font-medium">Total</span>
                    <span className="text-xl font-bold text-rose-600">{formatCurrency(selectedServiceData?.price || 0)}</span>
                  </div>
                </CardFooter>
              </Card>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4">
        <Button
          variant="outline"
          onClick={goBack}
          disabled={step === 0}
          className="gap-1"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </Button>
        {step < 4 ? (
          <Button
            onClick={goNext}
            disabled={!canNext}
            className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 gap-1"
          >
            Next <ChevronRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            onClick={handleBooking}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 gap-2"
          >
            <CheckCircle2 className="w-4 h-4" /> Confirm Booking
          </Button>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// EMPLOYEE VIEW
// ═══════════════════════════════════════════════════════════════════
interface EmployeeViewProps {
  employees: Employee[];
  selectedEmployee: string;
  setSelectedEmployee: (e: string) => void;
  currentEmp: Employee | undefined;
  currentEmpStore: Store | undefined;
  handleCompleteService: (a: Appointment) => void;
}

function EmployeeView({
  employees, selectedEmployee, setSelectedEmployee,
  currentEmp, currentEmpStore, handleCompleteService,
}: EmployeeViewProps) {
  const todayEarnings = useAnimatedNumber(1280);
  const weekEarnings = useAnimatedNumber(8450);
  const monthEarnings = useAnimatedNumber(32600);

  const myAppointments = TODAY_APPOINTMENTS.filter(
    (a) => a.employeeId === selectedEmployee
  );

  return (
    <div className="space-y-6">
      {/* Role selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12 bg-gradient-to-br from-rose-400 to-pink-500">
                <AvatarFallback className="text-white font-bold">
                  {currentEmp?.name.split(' ').map((n) => n[0]).join('') || '?'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="font-bold text-lg">{currentEmp?.name || 'Select Employee'}</h2>
                <p className="text-sm text-muted-foreground">
                  {currentEmp?.role} &middot; {currentEmpStore?.name}
                </p>
              </div>
            </div>
            <div className="sm:ml-auto">
              <Label className="text-xs text-muted-foreground">Viewing as (Demo)</Label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {employees.filter((e) => e.role !== 'Manager').map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name} - {STORES.find((s) => s.id === e.storeId)?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Earnings Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Today's Earnings", value: todayEarnings, period: 'today' },
          { label: 'This Week', value: weekEarnings, period: 'week' },
          { label: 'This Month', value: monthEarnings, period: 'month' },
        ].map((item) => (
          <motion.div
            key={item.period}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: item.period === 'today' ? 0 : item.period === 'week' ? 0.1 : 0.2 }}
          >
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-r from-rose-500 to-pink-500 px-5 py-3">
                <p className="text-white/80 text-xs font-medium">{item.label}</p>
                <p className="text-white text-2xl font-bold">
                  {formatCurrency(item.value)}
                </p>
              </div>
              <CardContent className="p-4 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Gross Commission</span>
                  <span className="text-emerald-600 font-medium">+{formatCurrency(Math.floor(item.value * 0.85))}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Product Deductions</span>
                  <span className="text-red-500 font-medium">-{formatCurrency(Math.floor(item.value * 0.15))}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-xs font-medium">
                  <span>Net Earnings</span>
                  <span className="text-emerald-600">{formatCurrency(item.value)}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Today's Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="w-5 h-5 text-rose-500" />
            Today&apos;s Schedule
          </CardTitle>
          <CardDescription>{format(new Date(), 'EEEE, MMMM d, yyyy')}</CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          {myAppointments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>No appointments for today</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myAppointments.map((apt) => (
                <motion.div
                  key={apt.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-4 p-3 rounded-xl border bg-white hover:shadow-sm transition-shadow"
                >
                  <div className="text-center min-w-[60px]">
                    <p className="text-sm font-bold text-rose-600">{formatTime(apt.time)}</p>
                    <p className="text-[10px] text-muted-foreground">{apt.serviceName.split(' ')[0]}</p>
                  </div>
                  <div className="w-px h-10 bg-gray-200" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{apt.customerName}</p>
                    <p className="text-xs text-muted-foreground">{apt.serviceName}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={apt.status} />
                    <span className="text-xs font-medium text-muted-foreground">
                      {formatCurrency(apt.price)}
                    </span>
                    {apt.status === 'confirmed' && (
                      <Button size="sm" className="bg-rose-500 hover:bg-rose-600 text-xs gap-1" onClick={() => handleCompleteService(apt)}>
                        <Play className="w-3 h-3" /> Start
                      </Button>
                    )}
                    {apt.status === 'in_progress' && (
                      <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-xs gap-1" onClick={() => handleCompleteService(apt)}>
                        <Check className="w-3 h-3" /> Complete
                      </Button>
                    )}
                    {apt.status === 'completed' && (
                      <Badge className="bg-emerald-100 text-emerald-700 gap-1">
                        <Check className="w-3 h-3" /> Done
                      </Badge>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// RECORD SERVICE DIALOG
// ═══════════════════════════════════════════════════════════════════
interface RecordServiceDialogProps {
  open: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  products: Product[];
  recordProducts: Record<string, boolean>;
  setRecordProducts: (r: Record<string, boolean>) => void;
  recordQuantities: Record<string, number>;
  setRecordQuantities: (r: Record<string, number>) => void;
  onSubmit: () => void;
}

function RecordServiceDialog({
  open, onClose, appointment, products,
  recordProducts, setRecordProducts, recordQuantities, setRecordQuantities, onSubmit,
}: RecordServiceDialogProps) {
  const usedProductList = products.filter((p) => recordProducts[p.id]);
  const commission = appointment
    ? calculateCommission(
        appointment.price,
        usedProductList.map((p) => ({ cost: p.cost, quantity: recordQuantities[p.id] || 1 }))
      )
    : { ownerShare: 0, employeeGross: 0, totalProductCost: 0, employeeNet: 0 };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-rose-500" />
            Record Service
          </DialogTitle>
          <DialogDescription>
            {appointment?.serviceName} &middot; {appointment?.customerName}
          </DialogDescription>
        </DialogHeader>

        {/* Commission Breakdown */}
        <div className="space-y-3 bg-gray-50 rounded-xl p-4">
          <h4 className="font-medium text-sm">Commission Breakdown</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Service Price</span>
              <span className="font-medium">{formatCurrency(appointment?.price || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Owner&apos;s Share (50%)</span>
              <span className="font-medium">{formatCurrency(commission.ownerShare)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Your Gross Share (50%)</span>
              <span className="font-medium">{formatCurrency(commission.employeeGross)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-emerald-600">
              <span className="font-medium">YOUR NET EARNINGS</span>
              <span className="font-bold text-lg">{formatCurrency(commission.employeeNet)}</span>
            </div>
          </div>
        </div>

        {/* Products Used */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Products Used During Service</h4>
          <div className="space-y-2">
            {products.map((product) => (
              <div key={product.id} className="flex items-center gap-3 p-2 rounded-lg border">
                <Checkbox
                  checked={recordProducts[product.id] || false}
                  onCheckedChange={(checked) =>
                    setRecordProducts({ ...recordProducts, [product.id]: !!checked })
                  }
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{product.name}</p>
                  <p className="text-xs text-muted-foreground">{formatCurrency(product.cost)} each</p>
                </div>
                {recordProducts[product.id] && (
                  <Input
                    type="number"
                    min={1}
                    value={recordQuantities[product.id] || 1}
                    onChange={(e) =>
                      setRecordQuantities({
                        ...recordQuantities,
                        [product.id]: Math.max(1, parseInt(e.target.value) || 1),
                      })
                    }
                    className="w-16 h-8 text-center"
                  />
                )}
              </div>
            ))}
          </div>
          {commission.totalProductCost > 0 && (
            <div className="flex justify-between text-sm text-red-600 bg-red-50 rounded-lg p-2">
              <span>Total Product Deduction</span>
              <span className="font-bold">-{formatCurrency(commission.totalProductCost)}</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            className="bg-emerald-500 hover:bg-emerald-600 gap-1"
            onClick={onSubmit}
          >
            <Check className="w-4 h-4" /> Record & Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MANAGER VIEW
// ═══════════════════════════════════════════════════════════════════
interface ManagerViewProps {
  stores: Store[];
  managerStoreId: string;
  setManagerStoreId: (s: string) => void;
  appointments: Appointment[];
  products: Product[];
  inventoryFilter: 'all' | 'low' | 'out';
  setInventoryFilter: (f: 'all' | 'low' | 'out') => void;
  filteredProducts: Product[];
}

function ManagerView({
  stores, managerStoreId, setManagerStoreId,
  appointments,
  products, inventoryFilter, setInventoryFilter, filteredProducts,
}: ManagerViewProps) {
  // Attendance is initialized fresh when key (managerStoreId) changes
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() =>
    EMPLOYEES.filter((e) => e.storeId === managerStoreId && e.role !== 'Manager').map((e) => ({
      employeeId: e.id,
      employeeName: e.name,
      role: e.role,
      checkIn: Math.random() > 0.3 ? `${9 + Math.floor(Math.random() * 2)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}` : null,
      checkOut: Math.random() > 0.6 ? `${17 + Math.floor(Math.random() * 2)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}` : null,
      present: Math.random() > 0.2,
    }))
  );

  const handleCheckIn = useCallback((empId: string) => {
    setAttendance((prev) =>
      prev.map((a) =>
        a.employeeId === empId
          ? { ...a, present: true, checkIn: format(new Date(), 'HH:mm') }
          : a
      )
    );
    toast.success('Employee checked in');
  }, []);

  const handleCheckOut = useCallback((empId: string) => {
    setAttendance((prev) =>
      prev.map((a) =>
        a.employeeId === empId
          ? { ...a, checkOut: format(new Date(), 'HH:mm') }
          : a
      )
    );
    toast.success('Employee checked out');
  }, []);

  const storeAppointments = appointments;
  const completedCount = storeAppointments.filter((a) => a.status === 'completed').length;
  const staffPresent = attendance.filter((a) => a.present).length;
  const lowStockCount = products.filter((p) => p.quantity > 0 && p.quantity <= p.reorderLevel).length;

  return (
    <div className="space-y-6">
      {/* Store Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <h2 className="text-xl font-bold">Store Management</h2>
        <Select value={managerStoreId} onValueChange={setManagerStoreId}>
          <SelectTrigger className="w-[280px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {stores.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Today's Revenue", value: formatCurrency(storeAppointments.filter(a => a.status === 'completed').reduce((s, a) => s + a.price, 0)), icon: DollarSign, color: 'from-rose-500 to-pink-500' },
          { label: 'Appointments', value: `${completedCount}/${storeAppointments.length} done`, icon: Calendar, color: 'from-blue-500 to-indigo-500' },
          { label: 'Staff Present', value: `${staffPresent}/${attendance.length}`, icon: Users, color: 'from-emerald-500 to-teal-500' },
          { label: 'Low Stock Alerts', value: `${lowStockCount} items`, icon: AlertTriangle, color: 'from-amber-500 to-orange-500' },
        ].map((stat) => (
          <Card key={stat.label} className="overflow-hidden">
            <div className={`bg-gradient-to-r ${stat.color} px-4 py-3`}>
              <stat.icon className="w-5 h-5 text-white/80" />
            </div>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="text-lg font-bold mt-0.5">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Staff Presence */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-rose-500" />
            Staff Presence
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          {attendance.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No staff for this store</p>
          ) : (
            <div className="space-y-2">
              {attendance.map((emp) => (
                <div key={emp.employeeId} className="flex items-center gap-3 p-3 rounded-lg border">
                  <Avatar className="w-9 h-9 bg-gradient-to-br from-rose-300 to-pink-400">
                    <AvatarFallback className="text-white text-xs font-bold">
                      {emp.employeeName.split(' ').map((n) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">{emp.employeeName}</p>
                      <Badge variant="secondary" className="text-[10px]">{emp.role}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      {emp.checkIn && <span>In: {emp.checkIn}</span>}
                      {emp.checkOut && <span>Out: {emp.checkOut}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={emp.present ? 'present' : 'absent'} />
                    {!emp.present && (
                      <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => handleCheckIn(emp.employeeId)}>
                        <LogIn className="w-3 h-3" /> Check In
                      </Button>
                    )}
                    {emp.present && !emp.checkOut && (
                      <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => handleCheckOut(emp.employeeId)}>
                        <LogOut className="w-3 h-3" /> Check Out
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Appointments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-rose-500" />
            Today&apos;s Appointments
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="hidden sm:table-cell">Service</TableHead>
                <TableHead>Staff</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {storeAppointments.map((apt) => (
                <TableRow key={apt.id}>
                  <TableCell className="font-medium">{formatTime(apt.time)}</TableCell>
                  <TableCell>{apt.customerName}</TableCell>
                  <TableCell className="hidden sm:table-cell">{apt.serviceName}</TableCell>
                  <TableCell>{apt.employeeName}</TableCell>
                  <TableCell><StatusBadge status={apt.status} /></TableCell>
                  <TableCell className="hidden md:table-cell">{formatCurrency(apt.price)}</TableCell>
                </TableRow>
              ))}
              {storeAppointments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No appointments for today
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Inventory Dashboard */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-rose-500" />
              Inventory
            </CardTitle>
            <div className="flex gap-2">
              {(['all', 'low', 'out'] as const).map((f) => (
                <Button
                  key={f}
                  size="sm"
                  variant={inventoryFilter === f ? 'default' : 'outline'}
                  onClick={() => setInventoryFilter(f)}
                  className={inventoryFilter === f ? 'bg-rose-500 hover:bg-rose-600 text-xs' : 'text-xs'}
                >
                  {f === 'all' ? 'All' : f === 'low' ? 'Low Stock' : 'Out of Stock'}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredProducts.map((product) => {
              const ratio = product.reorderLevel > 0 ? Math.min((product.quantity / product.reorderLevel) * 100, 100) : 0;
              const barColor = product.quantity === 0 ? 'bg-red-500' : product.quantity <= product.reorderLevel ? 'bg-amber-500' : 'bg-emerald-500';

              return (
                <div key={product.id} className="p-3 rounded-lg border space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {product.quantity} {product.unit}
                      </p>
                    </div>
                    <StockIndicator quantity={product.quantity} reorderLevel={product.reorderLevel} />
                  </div>
                  <Progress value={ratio} className={`h-1.5 [&>div]:${barColor}`} />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Reorder at: {product.reorderLevel}</span>
                    <span>{formatCurrency(product.cost)}/unit</span>
                  </div>
                  {(product.quantity <= product.reorderLevel) && (
                    <Button size="sm" variant="outline" className="w-full text-xs gap-1">
                      <Package className="w-3 h-3" /> Restock
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// OWNER VIEW
// ═══════════════════════════════════════════════════════════════════
interface OwnerViewProps {
  employees: Employee[];
  settlementEmployee: string;
  setSettlementEmployee: (e: string) => void;
  settlementMonth: string;
  setSettlementMonth: (m: string) => void;
  settlementCalculated: boolean;
  setSettlementCalculated: (b: boolean) => void;
  handleCalculateSettlement: () => void;
  handleExportCSV: () => void;
  settlementData: {
    totalServices: number;
    totalRevenue: number;
    ownerShare: number;
    employeeGross: number;
    productDeductions: number;
    netPayout: number;
  };
}

function OwnerView({
  employees, settlementEmployee, setSettlementEmployee,
  settlementMonth, setSettlementMonth,
  settlementCalculated, setSettlementCalculated, handleCalculateSettlement, handleExportCSV,
  settlementData,
}: OwnerViewProps) {
  const [sortField, setSortField] = useState<string>('revenue');
  const [sortAsc, setSortAsc] = useState(false);

  const staffPerformance = useMemo(() => {
    const data = employees.filter((e) => e.role !== 'Manager').map((emp) => ({
      id: emp.id,
      name: emp.name,
      store: STORES.find((s) => s.id === emp.storeId)?.name || '',
      servicesDone: Math.floor(30 + Math.random() * 40),
      totalRevenue: Math.floor(15000 + Math.random() * 35000),
      totalEarnings: Math.floor(5000 + Math.random() * 15000),
    }));
    return data.map((d) => ({
      ...d,
      avgPerService: Math.floor(d.totalRevenue / d.servicesDone),
    }));
  }, [employees]);

  const sortedStaff = useMemo(() => {
    const arr = [...staffPerformance];
    arr.sort((a, b) => {
      const av = (a as unknown as Record<string, number>)[sortField];
      const bv = (b as unknown as Record<string, number>)[sortField];
      return sortAsc ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });
    return arr;
  }, [staffPerformance, sortField, sortAsc]);

  const topPerformer = sortedStaff[0];
  const todayRevenue = useAnimatedNumber(64500);
  const weekRevenue = useAnimatedNumber(432000);
  const monthRevenue = useAnimatedNumber(1850000);
  const yearRevenue = useAnimatedNumber(21800000);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const SortHeader = ({ field, children, className }: { field: string; children: React.ReactNode; className?: string }) => (
    <TableHead
      className={`cursor-pointer hover:text-rose-600 transition-colors select-none ${className || ''}`}
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        <ArrowUpDown className="w-3 h-3 opacity-40" />
      </div>
    </TableHead>
  );

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <Crown className="w-6 h-6 text-amber-500" />
        Owner Panel
      </h2>

      {/* Revenue Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Today', value: todayRevenue, icon: TrendingUp },
          { label: 'This Week', value: weekRevenue, icon: BarChart3 },
          { label: 'This Month', value: monthRevenue, icon: DollarSign },
          { label: 'This Year', value: yearRevenue, icon: IndianRupee },
        ].map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-br from-rose-500 via-pink-500 to-rose-600 px-4 py-3 flex items-center justify-between">
                <item.icon className="w-5 h-5 text-white/70" />
                <span className="text-white/70 text-xs">{item.label}</span>
              </div>
              <CardContent className="p-4">
                <p className="text-xl font-bold">{formatCurrency(item.value)}</p>
                <p className="text-xs text-emerald-600 mt-0.5">+12.5% vs last period</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Revenue Chart - Weekly */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue by Store (This Week)</CardTitle>
          <CardDescription>Daily revenue comparison across all 3 stores</CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={REVENUE_CHART_DATA}>
                <defs>
                  <linearGradient id="mgGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="indGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="korGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <RTooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                <Area type="monotone" dataKey="mg" name="MG Road" stroke="#f43f5e" fill="url(#mgGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="ind" name="Indiranagar" stroke="#8b5cf6" fill="url(#indGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="kor" name="Koramangala" stroke="#f59e0b" fill="url(#korGrad)" strokeWidth={2} />
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Revenue Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Revenue Trend</CardTitle>
          <CardDescription>Revenue performance over the past 12 months</CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MONTHLY_REVENUE_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <RTooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="revenue" name="Revenue" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Staff Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500" />
            Staff Performance
          </CardTitle>
          <CardDescription>Sortable table of all employees across stores</CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <Table>
            <TableHeader>
              <TableRow>
                <SortHeader field="name">Employee</SortHeader>
                <TableHead className="hidden sm:table-cell">Store</TableHead>
                <SortHeader field="servicesDone">Services</SortHeader>
                <SortHeader field="totalRevenue">Revenue</SortHeader>
                <SortHeader field="totalEarnings">Earnings</SortHeader>
                <SortHeader field="avgPerService" className="hidden md:table-cell">Avg/Service</SortHeader>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedStaff.map((emp) => (
                <TableRow key={emp.id} className={topPerformer?.id === emp.id ? 'bg-amber-50/50' : ''}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {topPerformer?.id === emp.id && (
                        <Crown className="w-4 h-4 text-amber-500 shrink-0" />
                      )}
                      <span className="font-medium">{emp.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">{emp.store}</TableCell>
                  <TableCell>{emp.servicesDone}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(emp.totalRevenue)}</TableCell>
                  <TableCell>
                    <span className={`font-medium ${emp.totalEarnings > 10000 ? 'text-emerald-600' : 'text-gray-700'}`}>
                      {formatCurrency(emp.totalEarnings)}
                    </span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">{formatCurrency(emp.avgPerService)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* THE SETTLEMENT ENGINE */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-rose-600 via-pink-600 to-rose-600 px-6 py-4">
          <CardTitle className="text-white flex items-center gap-2 text-lg">
            <Layers className="w-5 h-5" />
            THE SETTLEMENT ENGINE
          </CardTitle>
          <CardDescription className="text-white/70">
            Calculate monthly employee commission settlements
          </CardDescription>
        </div>
        <CardContent className="p-6 space-y-6">
          {/* Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm">Employee</Label>
              <Select value={settlementEmployee} onValueChange={(v) => { setSettlementEmployee(v); setSettlementCalculated(false); }}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {employees.filter((e) => e.role !== 'Manager').map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Period</Label>
              <Select value={settlementMonth} onValueChange={(v) => { setSettlementMonth(v); setSettlementCalculated(false); }}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['2025-01', '2025-02', '2025-03', '2025-04', '2025-05', '2025-06'].map((m) => (
                    <SelectItem key={m} value={m}>{format(new Date(m + '-01'), 'MMMM yyyy')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                className="w-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700"
                onClick={handleCalculateSettlement}
              >
                <FileText className="w-4 h-4 mr-2" /> Calculate Settlement
              </Button>
            </div>
          </div>

          {/* Settlement Results */}
          <AnimatePresence>
            {settlementCalculated && (
              <motion.div
                initial={{ opacity: 0, y: 20, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                transition={{ duration: 0.4 }}
              >
                {/* Summary Card */}
                <Card className="border-rose-200 bg-gradient-to-br from-rose-50 to-pink-50">
                  <CardHeader>
                    <CardTitle className="text-lg">Settlement Summary</CardTitle>
                    <CardDescription>
                      {employees.find((e) => e.id === settlementEmployee)?.name} &middot;{' '}
                      {STORES.find((s) => s.id === employees.find((e) => e.id === settlementEmployee)?.storeId)?.name} &middot;{' '}
                      {format(new Date(settlementMonth + '-01'), 'MMMM yyyy')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="p-3 rounded-lg bg-white border">
                        <p className="text-muted-foreground text-xs">Total Services</p>
                        <p className="font-bold text-lg">{settlementData.totalServices}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-white border">
                        <p className="text-muted-foreground text-xs">Total Revenue</p>
                        <p className="font-bold text-lg">{formatCurrency(settlementData.totalRevenue)}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-white border">
                        <p className="text-muted-foreground text-xs">Owner&apos;s Share (50%)</p>
                        <p className="font-bold text-lg">{formatCurrency(settlementData.ownerShare)}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-white border">
                        <p className="text-muted-foreground text-xs">Employee Gross (50%)</p>
                        <p className="font-bold text-lg">{formatCurrency(settlementData.employeeGross)}</p>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-red-50 border border-red-200 flex justify-between items-center">
                      <span className="text-sm font-medium text-red-700">Product Deductions</span>
                      <span className="text-xl font-bold text-red-600">-{formatCurrency(settlementData.productDeductions)}</span>
                    </div>
                    <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 flex justify-between items-center">
                      <span className="text-sm font-medium text-emerald-700">NET PAYOUT TO EMPLOYEE</span>
                      <span className="text-2xl font-bold text-emerald-600">{formatCurrency(settlementData.netPayout)}</span>
                    </div>
                  </CardContent>
                  <CardFooter className="justify-end border-t pt-4">
                    <Button variant="outline" className="gap-2" onClick={handleExportCSV}>
                      <Download className="w-4 h-4" /> Export as CSV
                    </Button>
                  </CardFooter>
                </Card>

                {/* Detailed Breakdown Table */}
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="text-base">Detailed Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent className="px-6 pb-6">
                    <ScrollArea className="w-full">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Service</TableHead>
                            <TableHead className="hidden sm:table-cell">Price</TableHead>
                            <TableHead className="hidden md:table-cell">Gross</TableHead>
                            <TableHead className="hidden lg:table-cell">Products</TableHead>
                            <TableHead className="hidden md:table-cell">Deduction</TableHead>
                            <TableHead>Net</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {[
                            { date: 'Jan 05', customer: 'Amit Verma', service: 'Classic Haircut', price: 200, gross: 100, products: 'Shampoo (₹450)', deduction: 450, net: -350 },
                            { date: 'Jan 08', customer: 'Sunita Rao', service: 'Premium Haircut', price: 350, gross: 175, products: '-', deduction: 0, net: 175 },
                            { date: 'Jan 12', customer: 'Rohan Iyer', service: 'Hair Color', price: 2000, gross: 1000, products: 'Color Black x2', deduction: 240, net: 760 },
                            { date: 'Jan 15', customer: 'Kavitha Nair', service: 'Facial Gold', price: 1500, gross: 750, products: 'Facial Kit (₹350)', deduction: 350, net: 400 },
                            { date: 'Jan 18', customer: 'Deepak M', service: 'Beard Trim', price: 150, gross: 75, products: '-', deduction: 0, net: 75 },
                            { date: 'Jan 22', customer: 'Neha Kapoor', service: 'Keratin', price: 3500, gross: 1750, products: 'Keratin Cream', deduction: 1200, net: 550 },
                            { date: 'Jan 25', customer: 'Arjun Menon', service: 'Classic Haircut', price: 200, gross: 100, products: '-', deduction: 0, net: 100 },
                          ].map((row, i) => (
                            <TableRow key={i}>
                              <TableCell className="text-muted-foreground">{row.date}</TableCell>
                              <TableCell className="font-medium">{row.customer}</TableCell>
                              <TableCell>{row.service}</TableCell>
                              <TableCell className="hidden sm:table-cell">{formatCurrency(row.price)}</TableCell>
                              <TableCell className="hidden md:table-cell">{formatCurrency(row.gross)}</TableCell>
                              <TableCell className="hidden lg:table-cell text-xs text-muted-foreground max-w-[120px] truncate">{row.products}</TableCell>
                              <TableCell className="hidden md:table-cell text-red-500">-{formatCurrency(row.deduction)}</TableCell>
                              <TableCell className={`font-medium ${row.net >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                {formatCurrency(row.net)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                        <TableFooter>
                          <TableRow>
                            <TableCell colSpan={3}>Total</TableCell>
                            <TableCell className="hidden sm:table-cell">{formatCurrency(7900)}</TableCell>
                            <TableCell className="hidden md:table-cell">{formatCurrency(3950)}</TableCell>
                            <TableCell className="hidden lg:table-cell" />
                            <TableCell className="hidden md:table-cell text-red-500">-{formatCurrency(2240)}</TableCell>
                            <TableCell className="font-bold text-emerald-600">{formatCurrency(1710)}</TableCell>
                          </TableRow>
                        </TableFooter>
                      </Table>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}
