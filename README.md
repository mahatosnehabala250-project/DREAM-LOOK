# Dream Look - Salon Management System

A comprehensive, production-ready digital management system for multi-branch salon businesses. Built with Next.js 16, TypeScript, Prisma ORM, and shadcn/ui.

## Features

### 4 Role-Based Views
- **Customer** - Book appointments with 5-step wizard (store, service, date/time, stylist, confirmation)
- **Employee** - Personal dashboard with earnings, schedule, commission calculator
- **Manager** - Store management with attendance, appointments, inventory, and analytics
- **Owner** - Full business analytics, settlement engine, staff performance, store comparison

### Commission Engine
- 50/50 revenue split between owner and employee
- Product cost deducted from employee's share
- Monthly settlement reports with CSV export

### Key Capabilities
- Real-time analytics and revenue dashboards
- Store comparison and performance tracking
- Inventory management with low-stock alerts
- Staff attendance tracking (check-in/out)
- Customer appointment tracking by phone
- Notification system for pending appointments
- Dark mode support
- Mobile-responsive with bottom navigation bar
- Phone-based authentication for staff roles

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 + shadcn/ui |
| Database | SQLite via Prisma ORM |
| State | Zustand + TanStack Query |
| Charts | Recharts |
| Animations | Framer Motion |
| Theme | next-themes (dark/light) |
| Notifications | Sonner |

## Getting Started

### Prerequisites
- Node.js 18+
- Bun runtime

### Setup

```bash
# Install dependencies
bun install

# Initialize database
bun run db:push

# Seed demo data
bun run db:seed

# Start development server
bun run dev
```

### Database Schema

10 models: Store, Employee, Service, Product, Inventory, Customer, Appointment, Transaction, TransactionProduct, Attendance

### API Endpoints (15)

| Endpoint | Methods |
|----------|---------|
| `/api/salon/stores` | GET |
| `/api/salon/services` | GET |
| `/api/salon/products` | GET |
| `/api/salon/employees` | GET |
| `/api/salon/customers` | GET |
| `/api/salon/appointments` | GET |
| `/api/salon/appointments/create` | POST |
| `/api/salon/appointments/[id]` | PATCH |
| `/api/salon/transactions` | GET, POST |
| `/api/salon/inventory` | GET |
| `/api/salon/inventory/[id]` | PATCH |
| `/api/salon/attendance` | GET, POST |
| `/api/salon/analytics` | GET |
| `/api/salon/settlement` | GET |
| `/api/salon/auth` | POST |

### Demo Credentials

| Role | Phone | Name |
|------|-------|------|
| Employee | 9900000003 | Anitha Reddy |
| Manager | 9900000002 | Priya Sharma |
| Owner | 9900000001 | Rajesh Kumar |

## Project Structure

```
src/
  app/
    page.tsx              # Main SPA (all views)
    layout.tsx            # Theme + layout
    globals.css           # Styles + theme
    api/salon/            # 15 API routes
  components/ui/          # shadcn/ui components
  lib/
    db.ts                 # Prisma client
prisma/
  schema.prisma           # Database schema
  seed.ts                 # Demo data seeder
```

## License

Private - All rights reserved.
