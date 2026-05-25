# DREAM LOOK — Android App Prompt for Antigravity

> **Build a premium, world-class, modern, high-speed Android salon management app**  
> This is a comprehensive prompt for Antigravity (AI app builder) to create the complete "Dream Look" salon management system as a native Android application.

---

## 1. APP IDENTITY

```
App Name:      Dream Look - Salon Management
Package:       com.dreamlook.salon
Tagline:       "Your Beauty, Our Passion"
Primary Color: Rose (#F43F5E / oklch(0.645 0.246 16.439))
Accent Colors: Amber (#F59E0B), Emerald (#10B981), Violet (#8B5CF6)
Font:          Inter (Primary), JetBrains Mono (Numbers/Currency)
Min SDK:       26 (Android 8.0)
Target SDK:    34 (Android 14)
```

---

## 2. TECH STACK (MANDATORY)

| Layer | Technology |
|-------|-----------|
| Language | **Kotlin 2.0** |
| UI Framework | **Jetpack Compose** with Material 3 |
| Navigation | **Compose Navigation** (type-safe routes) |
| Dependency Injection | **Hilt** |
| Database | **Room** (SQLite, offline-first) |
| Network | **Retrofit 2** + OkHttp + Gson |
| Image Loading | **Coil 3** (Compose-native) |
| Charts | **Vico** or **MPAndroidChart** |
| Animations | **Lottie** + Compose Animation API |
| Push Notifications | **Firebase Cloud Messaging (FCM)** |
| Auth | **Firebase Authentication** (Phone OTP) |
| Analytics | **Firebase Analytics + Crashlytics** |
| Storage | **Firebase Cloud Storage** (avatars, photos) |
| Date/Time | **java.time** API (Java 8+) |
| Coroutines | **Kotlin Coroutines + Flow** |
| Build System | **Gradle (Kotlin DSL)** |

---

## 3. DATABASE SCHEMA — Room Entities (10 Tables)

### 3.1 Store Entity
```kotlin
@Entity(tableName = "stores")
data class Store(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    val name: String,
    val address: String,
    val phone: String,
    val city: String,
    val isActive: Boolean = true,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis()
)
```

### 3.2 Employee Entity
```kotlin
@Entity(
    tableName = "employees",
    foreignKeys = [ForeignKey(entity = Store::class, parentColumns = ["id"], childColumns = ["storeId"])],
    indices = [Index(value = ["phone"], unique = true), Index("storeId")]
)
data class Employee(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    val name: String,
    val phone: String,
    val role: String = "STYLIST", // OWNER, MANAGER, STYLIST
    val avatarUrl: String? = null,
    val storeId: String,
    val isActive: Boolean = true,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis()
)
```

### 3.3 Service Entity
```kotlin
@Entity(tableName = "services")
data class Service(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    val name: String,
    val price: Double,
    val duration: Int, // minutes
    val category: String, // HAIRCUT, COLOR, TREATMENT, SPA, BRIDAL
    val description: String? = null,
    val isActive: Boolean = true,
    val createdAt: Long = System.currentTimeMillis()
)
```

### 3.4 Product Entity
```kotlin
@Entity(tableName = "products")
data class Product(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    val name: String,
    val cost: Double,
    val unit: String = "ML", // ML, GRAM, PCS
    val category: String, // SHAMPOO, COLOR, OIL, CREAM, MASK, ACCESSORY
    val isActive: Boolean = true,
    val createdAt: Long = System.currentTimeMillis()
)
```

### 3.5 Inventory Entity
```kotlin
@Entity(
    tableName = "inventory",
    foreignKeys = [
        ForeignKey(entity = Store::class, parentColumns = ["id"], childColumns = ["storeId"]),
        ForeignKey(entity = Product::class, parentColumns = ["id"], childColumns = ["productId"])
    ],
    indices = [Index(value = ["storeId", "productId"], unique = true)]
)
data class Inventory(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    val storeId: String,
    val productId: String,
    val quantity: Double,
    val reorderLevel: Double = 10.0,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis()
)
```

### 3.6 Customer Entity
```kotlin
@Entity(tableName = "customers", indices = [Index(value = ["phone"])])
data class Customer(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    val name: String,
    val phone: String,
    val email: String? = null,
    val notes: String? = null,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis()
)
```

### 3.7 Appointment Entity
```kotlin
@Entity(
    tableName = "appointments",
    foreignKeys = [
        ForeignKey(entity = Customer::class, parentColumns = ["id"], childColumns = ["customerId"]),
        ForeignKey(entity = Store::class, parentColumns = ["id"], childColumns = ["storeId"]),
        ForeignKey(entity = Employee::class, parentColumns = ["id"], childColumns = ["employeeId"]),
        ForeignKey(entity = Service::class, parentColumns = ["id"], childColumns = ["serviceId"])
    ],
    indices = ["storeId", "employeeId", "date", "status"]
)
data class Appointment(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    val customerId: String,
    val storeId: String,
    val employeeId: String,
    val serviceId: String,
    val date: String, // YYYY-MM-DD
    val time: String, // HH:MM
    val status: String = "PENDING", // PENDING, CONFIRMED, COMPLETED, CANCELLED, NO_SHOW
    val notes: String? = null,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis()
)
```

### 3.8 Transaction Entity (Commission Records)
```kotlin
@Entity(
    tableName = "transactions",
    foreignKeys = [
        ForeignKey(entity = Appointment::class, parentColumns = ["id"], childColumns = ["appointmentId"], onDelete = ForeignKey.CASCADE),
        ForeignKey(entity = Employee::class, parentColumns = ["id"], childColumns = ["employeeId"]),
        ForeignKey(entity = Store::class, parentColumns = ["id"], childColumns = ["storeId"]),
        ForeignKey(entity = Service::class, parentColumns = ["id"], childColumns = ["serviceId"])
    ],
    indices = [
        Index(value = ["appointmentId"], unique = true),
        Index("employeeId"),
        Index("storeId"),
        Index("completedAt")
    ]
)
data class Transaction(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    val appointmentId: String,
    val employeeId: String,
    val storeId: String,
    val serviceId: String,
    val servicePrice: Double,
    val ownerShare: Double,       // 50% of servicePrice
    val employeeGrossShare: Double, // 50% of servicePrice
    val totalProductCost: Double = 0.0,
    val employeeNetShare: Double, // employeeGrossShare - totalProductCost
    val completedAt: Long = System.currentTimeMillis(),
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis()
)
```

### 3.9 TransactionProduct Entity
```kotlin
@Entity(
    tableName = "transaction_products",
    foreignKeys = [
        ForeignKey(entity = Transaction::class, parentColumns = ["id"], childColumns = ["transactionId"], onDelete = ForeignKey.CASCADE),
        ForeignKey(entity = Product::class, parentColumns = ["id"], childColumns = ["productId"])
    ]
)
data class TransactionProduct(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    val transactionId: String,
    val productId: String,
    val quantityUsed: Double,
    val unitCost: Double,
    val totalCost: Double, // quantityUsed * unitCost
    val createdAt: Long = System.currentTimeMillis()
)
```

### 3.10 Attendance Entity
```kotlin
@Entity(
    tableName = "attendance",
    foreignKeys = [
        ForeignKey(entity = Employee::class, parentColumns = ["id"], childColumns = ["employeeId"]),
        ForeignKey(entity = Store::class, parentColumns = ["id"], childColumns = ["storeId"])
    ],
    indices = [Index(value = ["employeeId", "date"], unique = true), Index("storeId", "date")]
)
data class Attendance(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    val employeeId: String,
    val storeId: String,
    val date: String, // YYYY-MM-DD
    val checkIn: String? = null, // HH:MM
    val checkOut: String? = null, // HH:MM
    val status: String = "PRESENT", // PRESENT, ABSENT, HALF_DAY, LEAVE
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis()
)
```

### 3.11 Expense Entity
```kotlin
@Entity(
    tableName = "expenses",
    foreignKeys = [ForeignKey(entity = Store::class, parentColumns = ["id"], childColumns = ["storeId"])],
    indices = ["storeId", "expenseDate"]
)
data class Expense(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    val storeId: String,
    val category: String, // RENT, UTILITIES, SALARY, SUPPLIES, MAINTENANCE, MARKETING, OTHER
    val description: String,
    val amount: Double,
    val expenseDate: String, // YYYY-MM-DD
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis()
)
```

---

## 4. COMMISSION ENGINE (CRITICAL BUSINESS LOGIC)

This is the heart of the app. Implement with EXTREME care.

### Formula
```
ownerShare          = servicePrice × 50%
employeeGrossShare  = servicePrice × 50%
totalProductCost    = Σ (product.cost × quantityUsed)
employeeNetShare    = employeeGrossShare - totalProductCost
```

### Kotlin Implementation
```kotlin
data class CommissionBreakdown(
    val servicePrice: Double,
    val ownerShare: Double,
    val employeeGrossShare: Double,
    val productCosts: List<ProductCostLine>,
    val totalProductCost: Double,
    val employeeNetShare: Double
)

data class ProductCostLine(
    val productName: String,
    val quantityUsed: Double,
    val unit: String,
    val unitCost: Double,
    val totalCost: Double
)

fun calculateCommission(
    servicePrice: Double,
    productsUsed: List<ProductCostLine>
): CommissionBreakdown {
    val ownerShare = servicePrice * 0.5
    val employeeGross = servicePrice * 0.5
    val totalProductCost = productsUsed.sumOf { it.totalCost }
    return CommissionBreakdown(
        servicePrice = servicePrice,
        ownerShare = ownerShare,
        employeeGrossShare = employeeGross,
        productCosts = productsUsed,
        totalProductCost = totalProductCost,
        employeeNetShare = employeeGross - totalProductCost
    )
}
```

### Example Calculation
```
Service: Hair Spa = ₹500
├── Owner Share:     ₹500 × 50% = ₹250
├── Employee Gross:   ₹500 × 50% = ₹250
├── Products Used:
│   ├── Hair Mask (50g × ₹30)  = ₹1,500
│   └── Conditioner (30ml × ₹10) = ₹300
├── Total Product Cost:          = ₹1,800
└── Employee Net Share:   ₹250 - ₹1,800 = -₹1,550
    (Employee pays the difference)
```

---

## 5. ROLES & PERMISSIONS (4 Roles)

### Role Hierarchy
```
OWNER > MANAGER > STYLIST > CUSTOMER
```

### Permission Matrix

| Feature | Customer | Stylist | Manager | Owner |
|---------|----------|---------|---------|-------|
| Book Appointment | ✅ Create | ✅ View Own | ✅ Create/View/Update | ✅ Full |
| View Earnings | ❌ | ✅ Own Only | ✅ Store Staff | ✅ All |
| Commission Calculator | ❌ | ✅ Own | ✅ Store | ✅ All |
| Settlement Reports | ❌ | ❌ | ❌ | ✅ Full |
| Staff Attendance | ❌ | ✅ Self Check-In | ✅ Store Staff | ✅ All |
| Inventory View | ❌ | ❌ | ✅ Store | ✅ All |
| Inventory Restock | ❌ | ❌ | ✅ Store | ✅ All |
| Analytics Dashboard | ❌ | ❌ | ✅ Store | ✅ All |
| Store Comparison | ❌ | ❌ | ❌ | ✅ Only |
| Manage Employees | ❌ | ❌ | ❌ | ✅ Full |
| Record Service | ❌ | ✅ Own | ✅ Store | ✅ All |
| Track Appointment | ✅ Own Phone | ❌ | ✅ Store | ✅ All |
| Expenses | ❌ | ❌ | ✅ Store | ✅ All |

### Login Flow
```
1. Splash Screen (2s) → Landing Page
2. Landing: 3 login cards (Employee, Manager, Owner) + "Book as Customer"
3. Login: Phone number input → Firebase OTP verification
4. Role determined by phone number match in Employee database
5. Session stored in DataStore + encrypted SharedPreferences
```

---

## 6. ALL 18 SCREENS

### Screen 1: Splash Screen
```
- Full-screen rose gradient background (#F43F5E → #EC4899)
- Animated scissors logo (Lottie) spinning in center
- "Dream Look" text fades in below logo
- "Your Beauty, Our Passion" tagline fades in
- Auto-transition to Landing after 2.5 seconds
- Check for existing auth session — if logged in, skip to Dashboard
```

### Screen 2: Landing Page
```
- Decorative blur circles (rose, amber, emerald) on white bg
- Animated floating icons: Scissors, Star, Heart, Sparkles
- "Dream Look" large gradient title
- 3 login cards in horizontal scroll / grid:
  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
  │ ✂️ Employee  │ │ 🏢 Manager  │ │ 👑 Owner    │
  │ Rose grad    │ │ Amber grad  │ │ Emerald grad│
  │ "Schedule,  │ │ "Appoint-   │ │ "Analytics, │
  │  earnings &  │ │  ments,     │ │  settlement │
  │  commission" │ │  staff &     │ │  engine"    │
  │ [Login →]    │ │  inventory" │ │ [Login →]   │
  └─────────────┘ │ [Login →]   │ └─────────────┘
                   └─────────────┘
- Bottom: "Or book an appointment as a customer →"
```

### Screen 3: Login Screen (Reusable for all roles)
```
- Glassmorphism card (backdrop-blur, semi-transparent bg)
- 48px gradient header with animated role icon
- Phone input: 10-digit, numeric keyboard, +91 prefix
- Loading state: spinner + "Verifying OTP..."
- Error: red animated message
- Demo credentials box (role-colored bg)
- Back button top-left
- Firebase Phone Auth OTP flow
```

### Screen 4: Customer — Booking Wizard (5 Steps)
```
Step 1: SELECT STORE
- 3 beautiful store cards in vertical list
- Each: gradient icon, name, address, city, phone
- Left border color per store (rose, amber, emerald)
- Green pulsing dot for active stores
- "Continue" button appears on selection

Step 2: SELECT SERVICE & STYLIST
- Category filter tabs: All, Haircut, Color, Treatment, Spa, Bridal
- Service cards: name, price (₹), duration, description
- Employee (stylist) dropdown filtered by selected store
- Each employee shows avatar, name, role, store

Step 3: SELECT DATE & TIME
- Material 3 Calendar date picker (horizontal scroll)
- Disable past dates
- Time slot grid: 9:00 AM - 7:30 PM (30-min intervals)
- Slots colored: green (available), red (busy), gray (past)
- Dynamic busy detection from existing appointments

Step 4: YOUR DETAILS
- Name input (required)
- Phone input (10-digit, numeric)
- Real-time validation
- Privacy note: "We only use your phone to send booking confirmation"

Step 5: CONFIRMATION
- Beautiful summary card:
  - Store name + address
  - Stylist name + avatar
  - Service name + price + duration
  - Date + time
  - Customer name + phone
- "Confirm Booking" CTA button
- Success: animated checkmark + "Booking Confirmed!" + booking ID
```

### Screen 5: Customer — Appointment Tracker
```
- Phone input lookup (collapsible card at top)
- Match customer → fetch all appointments
- List of last 10 appointments sorted by date
- Each: store, service, date, time, status badge (colored)
- Status colors: PENDING=amber, CONFIRMED=blue, COMPLETED=green, CANCELLED=red
- Empty states: "No customer found", "No appointments yet"
- Pull to refresh
```

### Screen 6: Employee — Dashboard (Home)
```
- Welcome greeting: "Welcome back, {name}! 👋"
- Store name + role badge below greeting
- 3 Earnings Stat Cards (horizontal scroll):
  - Today: ₹X,XXX
  - This Week: ₹XX,XXX
  - This Month: ₹XX,XXX
  - Each with animated counter + trend arrow
- Commission Education Card:
  - Visual diagram: Service Price → 50% Owner → 50% Employee → -Product Cost = Net
  - Colored boxes with arrows (green=earnings, red=deductions)
- "How Commission Works" expandable info card
```

### Screen 7: Employee — Today's Schedule
```
- Date header: "Today, 22 May 2026"
- Timeline-style appointment list
- Each appointment: time, customer name, service, status badge
- Action buttons: "Start Service", "Complete Service"
- Status progression: PENDING → IN_PROGRESS → COMPLETED
- Empty state: "No appointments today — enjoy your day! ☕"
```

### Screen 8: Employee — Commission Calculator
```
- Standalone calculator tool
- Service price input (currency formatted)
- Product list from inventory (scrollable checkboxes):
  - Product name, available quantity, unit
  - Quantity selector (- / + buttons)
  - Per-unit cost display
- LIVE breakdown display:
  ┌────────────────────────────┐
  │ Service Price:    ₹500    │
  │ Owner Share:      ₹250    │
  │ Employee Gross:   ₹250    │
  │ Product Deductions:₹1,800│
  │ ──────────────────────── │
  │ NET EARNINGS:    -₹1,550 │ (red if negative)
  └────────────────────────────┘
- "Record This Service" button → opens recording dialog
```

### Screen 9: Employee — Recent Activity
```
- Sorted list of today's completed transactions
- Each item: service name, completion time, product count badge, net earnings
- Green/red color coding for positive/negative earnings
- Trend arrows (up for positive, down for negative)
- Max height scrollable with custom scrollbar
```

### Screen 10: Employee — Daily Earnings Sparkline
```
- Mini bar chart showing last 7 days' net earnings
- Green bars for positive, red for negative
- Hover tooltips with exact amount and date
- Today's earnings highlighted
```

### Screen 11: Manager — Dashboard
```
- Welcome: "Managing {storeName}" + "Welcome, {name}! 👋"
- 4 Stat Cards (2x2 grid):
  - Today's Revenue (₹)
  - Today's Appointments (count)
  - Staff Present (X/Y)
  - Low Stock Alerts (count with amber badge)
- Each card: icon, value, trend arrow, subtitle
```

### Screen 12: Manager — Staff Attendance
```
- Date header with today's date
- List of all store employees:
  - Avatar (initials fallback), name, role badge
  - Check-in time / Check-out time
  - Status badge: PRESENT(green), ABSENT(red), HALF_DAY(amber), LEAVE(gray)
  - Action buttons: "Check In" / "Check Out"
- Summary row: "X present, Y absent, Z on leave"
```

### Screen 13: Manager — Appointments List
```
- Date filter (today by default, date picker)
- Filter chips: All, Pending, Confirmed, Completed, Cancelled
- Appointment cards:
  - Customer name, service name, price
  - Time, assigned stylist
  - Status badge (colored)
  - Action buttons: Confirm, Complete, Cancel
- "New Appointment" FAB → opens creation dialog
- Quick creation dialog:
  - Customer phone search with auto-suggest
  - Auto-fill name from existing customer
  - Employee dropdown (store-filtered)
  - Service dropdown
  - Date + time picker
```

### Screen 14: Manager — Inventory Dashboard
```
- Filter tabs: All, Low Stock, Out of Stock
- Product cards in grid:
  - Product name, category badge
  - Current quantity with progress bar (quantity vs reorderLevel)
  - Color coding: green (>reorder), amber (approaching), red (low/out)
  - "Restock" button on low items
  - Restock dialog: quantity input + confirm
- Summary bar: "X items low, Y items out of stock"
```

### Screen 15: Manager — Today vs Yesterday
```
- Two comparison cards side by side:
  - Revenue: today ₹X vs yesterday ₹Y (+Z% ↑ or -Z% ↓)
  - Transactions: today N vs yesterday M (+Z% ↑ or -Z% ↓)
- Percentage change badges with colored backgrounds
- Green up arrow for positive, red down arrow for negative
```

### Screen 16: Owner — Analytics Dashboard
```
- 4 Revenue Stat Cards:
  - Today, This Week, This Month, This Year
  - Each with animated counter + trend arrow
- Quick Range Selector: Today, Week, Month, All Time (pill toggle)
- Revenue Trend Area Chart (7-day with gradient fill)
- Service Popularity Bar Chart (top services)
- Monthly Revenue Bar Chart (12 months)
```

### Screen 17: Owner — Staff Performance
```
- Sortable table:
  - Employee, Store, Services Done, Revenue, Earnings, Avg/Service
  - Sort by any column
  - Top performer highlighted with Crown icon
- Tap on employee → detailed breakdown:
  - Monthly earnings trend
  - Services completed
  - Commission breakdown
```

### Screen 18: Owner — Settlement Engine
```
- Employee selector dropdown
- Month picker (defaults to current month)
- "Calculate Settlement" button
- Settlement Summary Card:
  ┌─────────────────────────────────────┐
  │ Monthly Settlement - May 2026       │
  │ Employee: Anitha Reddy              │
  │ ─────────────────────────────────── │
  │ Total Services:       24            │
  │ Total Revenue:        ₹12,000       │
  │ Owner Share (50%):    ₹6,000        │
  │ Employee Gross (50%): ₹6,000        │
  │ Product Deductions:   ₹3,200        │
  │ ─────────────────────────────────── │
  │ NET PAYOUT:           ₹2,800        │
  └─────────────────────────────────────┘
- Detailed breakdown table:
  - Date, Service, Price, Owner Share, Employee Gross, Products Used, Deductions, Net
  - Alternating row colors
- Export buttons: "Export CSV", "Share PDF"
- Per-appointment product details (expandable rows)
```

---

## 7. API ENDPOINTS (19+)

Base URL: `https://your-api-domain.com/api/salon`

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth` | Phone + role login → returns employee data |

### Core Data
| Method | Endpoint | Query Params | Description |
|--------|----------|-------------|-------------|
| GET | `/stores` | — | All active stores |
| GET | `/services` | — | All active services |
| GET | `/products` | — | All active products |
| GET | `/employees` | `?storeId=` | Employees, filter by store |
| GET | `/customers` | — | All customers |

### Appointments
| Method | Endpoint | Body / Params | Description |
|--------|----------|--------------|-------------|
| GET | `/appointments` | `?storeId=, ?date=, ?employeeId=, ?status=, ?customerId=` | List with filters |
| POST | `/appointments/create` | `{customerId/customerName/customerPhone, storeId, employeeId, serviceId, date, time}` | Create booking |
| PATCH | `/appointments/[id]` | `{status}` | Update status |

### Transactions & Commission
| Method | Endpoint | Body / Params | Description |
|--------|----------|--------------|-------------|
| GET | `/transactions` | `?employeeId=, ?startDate=, ?endDate=, ?storeId=` | List with filters |
| POST | `/transactions` | `{appointmentId, employeeId, storeId, serviceId, servicePrice, productsUsed[{productId, quantityUsed}]}` | Record service + commission |

### Inventory
| Method | Endpoint | Body / Params | Description |
|--------|----------|--------------|-------------|
| GET | `/inventory` | `?storeId=` | List stock |
| PATCH | `/inventory/[id]` | `{quantity}` | Restock |

### Attendance
| Method | Endpoint | Body / Params | Description |
|--------|----------|--------------|-------------|
| GET | `/attendance` | `?storeId=, ?date=` | List attendance |
| POST | `/attendance` | `{employeeId, storeId, date, checkIn/checkOut}` | Check in/out |

### Analytics
| Method | Endpoint | Query Params | Description |
|--------|----------|-------------|-------------|
| GET | `/analytics` | `?storeId=, ?startDate=, ?endDate=` | Revenue, dailyRevenue[], servicePopularity[], employeePerformance[] |

### Settlement
| Method | Endpoint | Query Params | Description |
|--------|----------|-------------|-------------|
| GET | `/settlement` | `?employeeId=, ?month=YYYY-MM` | Monthly settlement breakdown |

### Expenses
| Method | Endpoint | Body / Params | Description |
|--------|----------|--------------|-------------|
| GET | `/expenses` | `?storeId=, ?month=` | List expenses |
| POST | `/expenses` | `{storeId, category, description, amount, expenseDate}` | Add expense |

---

## 8. FIREBASE INTEGRATION

### 8.1 Firebase Authentication (Phone OTP)
```kotlin
// Phone Auth Flow
class AuthViewModel @Inject constructor(
    private val auth: FirebaseAuth
) : ViewModel() {
    
    private val _authState = MutableStateFlow<AuthState>(AuthState.Idle)
    val authState: StateFlow<AuthState> = _authState
    
    fun sendOTP(phoneNumber: String, activity: Activity) {
        val options = PhoneAuthOptions.newBuilder(auth)
            .setPhoneNumber("+91$phoneNumber")
            .setTimeout(60L, TimeUnit.SECONDS)
            .setActivity(activity)
            .setCallbacks(object : PhoneAuthProvider.OnVerificationStateChangedCallbacks() {
                override fun onVerificationCompleted(credential: PhoneAuthCredential) {
                    signInWithCredential(credential)
                }
                override fun onVerificationFailed(e: FirebaseException) {
                    _authState.value = AuthState.Error(e.message ?: "Verification failed")
                }
                override fun onCodeSent(
                    verificationId: String,
                    token: PhoneAuthProvider.ForceResendingToken
                ) {
                    _authState.value = AuthState.CodeSent(verificationId)
                }
            })
            .build()
        PhoneAuthProvider.verifyPhoneNumber(options)
    }
    
    fun verifyOTP(verificationId: String, code: String) {
        val credential = PhoneAuthProvider.getCredential(verificationId, code)
        signInWithCredential(credential)
    }
    
    private fun signInWithCredential(credential: PhoneAuthCredential) {
        auth.signInWithCredential(credential).addOnCompleteListener { task ->
            if (task.isSuccessful) {
                val firebaseUser = task.result?.user
                _authState.value = AuthState.Success(firebaseUser?.uid ?: "")
            } else {
                _authState.value = AuthState.Error("Invalid OTP")
            }
        }
    }
}

sealed class AuthState {
    object Idle : AuthState()
    object Loading : AuthState()
    data class CodeSent(val verificationId: String) : AuthState()
    data class Success(val userId: String) : AuthState()
    data class Error(val message: String) : AuthState()
}
```

### 8.2 Firebase Cloud Messaging (Push Notifications)
```kotlin
// Notification Types
enum class NotificationType {
    APPOINTMENT_CONFIRMED,    // "Your appointment at Dream Look MG Road is confirmed!"
    APPOINTMENT_REMINDER,     // "Reminder: You have an appointment in 1 hour"
    SERVICE_COMPLETED,        // "Your Hair Spa service has been completed. Rate us!"
    PAYMENT_RECEIVED,         // "Payment of ₹500 received. Thank you!"
    LOW_STOCK_ALERT,          // "⚠️ Hair Color stock is running low at MG Road"
    SETTLEMENT_READY,         // "Your May 2026 settlement of ₹2,800 is ready"
    NEW_APPOINTMENT,          // "New booking by Priya for Hair Spa at 3:00 PM"
}
```

### 8.3 Firebase Cloud Storage (Image Uploads)
```kotlin
// Upload employee avatar / salon photos
class StorageRepository @Inject constructor(
    private val storage: FirebaseStorage
) {
    suspend fun uploadAvatar(employeeId: String, imageUri: Uri): String {
        val ref = storage.reference.child("avatars/$employeeId/${UUID.randomUUID()}.jpg")
        ref.putFile(imageUri).await()
        return ref.downloadUrl.await().toString()
    }
    
    suspend fun uploadStoreImage(storeId: String, imageUri: Uri): String {
        val ref = storage.reference.child("stores/$storeId/${UUID.randomUUID()}.jpg")
        ref.putFile(imageUri).await()
        return ref.downloadUrl.await().toString()
    }
}
```

### 8.4 Firebase Analytics & Crashlytics
```kotlin
// Track key events
fun logAppointmentBooked(storeId: String, serviceCategory: String) {
    Firebase.analytics.logEvent("appointment_booked") {
        param("store_id", storeId)
        param("service_category", serviceCategory)
    }
}

fun logServiceRecorded(employeeRole: String, servicePrice: Double) {
    Firebase.analytics.logEvent("service_recorded") {
        param("employee_role", employeeRole)
        param(FirebaseAnalytics.Param.VALUE, servicePrice.toLong())
    }
}

fun logSettlementViewed(month: String) {
    Firebase.analytics.logEvent("settlement_viewed") {
        param("month", month)
    }
}
```

### 8.5 Firebase Remote Config
```kotlin
// Remote config for dynamic updates
val remoteConfig = Firebase.remoteConfig
remoteConfig.setDefaultsAsync(mapOf(
    "commission_rate" to 0.5,          // 50% commission
    "max_booking_days_ahead" to 30L,
    "slot_duration_minutes" to 30L,
    "working_hours_start" to "09:00",
    "working_hours_end" to "20:00",
    "min_appointment_notice_hours" to 1L,
    "enable_push_notifications" to true,
    "maintenance_mode" to false
))
```

---

## 9. UI/UX DESIGN SYSTEM

### Design Philosophy
```
Premium feel with Glassmorphism + Neumorphism
Rose/Pink primary with Amber, Emerald, Violet accents
Smooth animations everywhere (Lottie + Compose)
Mobile-first with tablet support
Dark mode from day one
```

### Color System (Material 3 Dynamic)
```kotlin
object DreamLookColors {
    // Light Theme
    val Primary = Color(0xFFF43F5E)           // Rose 500
    val PrimaryContainer = Color(0xFFFFD6E0)   // Rose 100
    val OnPrimary = Color(0xFFFFFFFF)
    val Secondary = Color(0xFF8B5CF6)          // Violet 500
    val Tertiary = Color(0xFF10B981)           // Emerald 500
    val Error = Color(0xFFEF4444)
    val Surface = Color(0xFFFFFFFF)
    val Background = Color(0xFFFAF5F7)         // Very light rose tint
    
    // Dark Theme
    val DarkPrimary = Color(0xFFFB7185)        // Rose 400
    val DarkSurface = Color(0xFF1C1917)
    val DarkBackground = Color(0xFF0F0E0D)
    
    // Role Colors
    val EmployeeAccent = Color(0xFFF43F5E)     // Rose
    val ManagerAccent = Color(0xFFF59E0B)      // Amber
    val OwnerAccent = Color(0xFF10B981)        // Emerald
    
    // Status Colors
    val StatusPending = Color(0xFFF59E0B)      // Amber
    val StatusConfirmed = Color(0xFF3B82F6)    // Blue
    val StatusCompleted = Color(0xFF10B981)    // Green
    val StatusCancelled = Color(0xFFEF4444)    // Red
}
```

### Typography
```kotlin
val DreamLookTypography = Typography(
    displayLarge = TextStyle(fontFamily = Inter, fontWeight = FontWeight.Bold, fontSize = 32.sp),
    displayMedium = TextStyle(fontFamily = Inter, fontWeight = FontWeight.SemiBold, fontSize = 28.sp),
    headlineLarge = TextStyle(fontFamily = Inter, fontWeight = FontWeight.SemiBold, fontSize = 24.sp),
    headlineMedium = TextStyle(fontFamily = Inter, fontWeight = FontWeight.Medium, fontSize = 20.sp),
    titleLarge = TextStyle(fontFamily = Inter, fontWeight = FontWeight.Medium, fontSize = 18.sp),
    bodyLarge = TextStyle(fontFamily = Inter, fontWeight = FontWeight.Normal, fontSize = 16.sp),
    bodyMedium = TextStyle(fontFamily = Inter, fontWeight = FontWeight.Normal, fontSize = 14.sp),
    labelSmall = TextStyle(fontFamily = Inter, fontWeight = FontWeight.Medium, fontSize = 11.sp),
)
```

### Component Styles

#### Glassmorphism Card
```kotlin
@Composable
fun GlassCard(
    modifier: Modifier = Modifier,
    content: @Composable ColumnScope.() -> Unit
) {
    Card(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp)),
        colors = CardDefaults.cardColors(
            containerColor = if (isSystemInDarkTheme()) 
                Color.White.copy(alpha = 0.08f) 
            else Color.White.copy(alpha = 0.70f)
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            content = content
        )
    }
}
```

#### Stat Card with Trend
```kotlin
@Composable
fun StatCard(
    title: String,
    value: String,
    trend: Double? = null,
    icon: ImageVector,
    containerColor: Color = DreamLookColors.PrimaryContainer,
    contentColor: Color = DreamLookColors.Primary
) {
    GlassCard {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(icon, contentDescription = title, tint = contentColor, modifier = Modifier.size(24.dp))
            Spacer(modifier = Modifier.width(12.dp))
            Column {
                Text(title, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Text(value, style = MaterialTheme.typography.headlineMedium)
                if (trend != null) {
                    Row {
                        Icon(
                            if (trend >= 0) Icons.Default.TrendingUp else Icons.Default.TrendingDown,
                            contentDescription = null,
                            tint = if (trend >= 0) Color.Green else Color.Red,
                            modifier = Modifier.size(14.dp)
                        )
                        Text(
                            "${abs(trend).format(1)}%",
                            style = MaterialTheme.typography.labelSmall,
                            color = if (trend >= 0) Color.Green else Color.Red
                        )
                    }
                }
            }
        }
    }
}
```

---

## 10. NAVIGATION STRUCTURE

```
NavHost(startDestination = "splash") {
    // Auth Flow
    composable("splash") → LandingScreen → LoginScreens
    
    // Customer
    navigation("customer") {
        composable("booking") → BookingWizard (5 steps)
        composable("tracker") → AppointmentTracker
    }
    
    // Employee
    navigation("employee") {
        composable("dashboard") → EmployeeDashboard
        composable("schedule") → TodaySchedule
        composable("calculator") → CommissionCalculator
        composable("activity") → RecentActivity
        composable("earnings_chart") → DailyEarningsChart
    }
    
    // Manager
    navigation("manager") {
        composable("dashboard") → ManagerDashboard
        composable("attendance") → StaffAttendance
        composable("appointments") → AppointmentsList
        composable("inventory") → InventoryDashboard
        composable("comparison") → TodayVsYesterday
    }
    
    // Owner
    navigation("owner") {
        composable("dashboard") → OwnerAnalytics
        composable("performance") → StaffPerformance
        composable("settlement") → SettlementEngine
        composable("store_comparison") → StoreComparison
    }
}
```

### Bottom Navigation (Employee)
```
[🏠 Home] [📅 Schedule] [🧮 Calculator] [📊 Activity]
```

### Bottom Navigation (Manager)
```
[🏠 Home] [👥 Staff] [📋 Appointments] [📦 Inventory]
```

### Bottom Navigation (Owner)
```
[🏠 Analytics] [👔 Staff] [💰 Settlement] [🏢 Stores]
```

---

## 11. DEMO DATA (Seed Data)

### 3 Stores
```
1. Dream Look - MG Road
   Address: 42, MG Road, Bangalore - 560001
   Phone: 080-4123-4567
   City: Bangalore

2. Dream Look - Koramangala
   Address: 15, 80 Feet Road, Koramangala, Bangalore - 560034
   Phone: 080-2567-8901
   City: Bangalore

3. Dream Look - Indiranagar
   Address: 100 Ft Road, Indiranagar, Bangalore - 560038
   Phone: 080-3456-7890
   City: Bangalore
```

### 11 Employees
```
Store 1 (MG Road):
- Rajesh Kumar    | OWNER    | 9900000001
- Priya Sharma    | MANAGER  | 9900000002
- Anitha Reddy    | STYLIST  | 9900000003
- Karthik Nair    | STYLIST  | 9900000004

Store 2 (Koramangala):
- Deepa Gupta     | MANAGER  | 9900000005
- Sneha Patil     | STYLIST  | 9900000006
- Ramesh Iyer     | STYLIST  | 9900000007
- Pooja Desai     | STYLIST  | 9900000008

Store 3 (Indiranagar):
- Amit Verma      | MANAGER  | 9900000009
- Lakshmi Rao     | STYLIST  | 9900000010
- Suresh Menon    | STYLIST  | 9900000011
```

### 12 Services
```
HAIRCUT:    Haircut (₹300, 30min), Haircut + Beard (₹450, 45min), Haircut + Wash (₹350, 40min), Kids Haircut (₹200, 20min)
COLOR:      Hair Coloring (₹800, 90min), Highlights (₹1200, 120min), Global Color (₹1500, 150min)
TREATMENT:  Hair Spa (₹500, 60min), Keratin Treatment (₹2500, 120min), Deep Conditioning (₹400, 45min)
SPA:        Facial (₹600, 60min), Clean-up (₹350, 30min)
BRIDAL:     Bridal Package (₹5000, 240min)
```

### 12 Products
```
SHAMPOO:   L'oreal Shampoo (₹200/L), Schwarzkopf Shampoo (₹250/L)
COLOR:     L'oreal Hair Color (₹150/unit), Wella Color (₹180/unit)
OIL:       Coconut Oil (₹80/L), Almond Oil (₹120/L)
CREAM:     Hair Cream (₹90/500g), Styling Gel (₹70/500g)
MASK:      Hair Mask (₹30/50g), Deep Conditioning Mask (₹45/50g)
ACCESSORY: Hair Clips Pack (₹20/10pcs)
```

---

## 12. PUSH NOTIFICATIONS

### Notification Scenarios
| Event | Recipient | Title | Body |
|-------|-----------|-------|------|
| Appointment Booked | Manager | "New Booking" | "Priya booked Hair Spa at 3:00 PM today" |
| Appointment Confirmed | Customer | "Booking Confirmed" | "Your appointment at Dream Look MG Road is confirmed for 22 May, 3:00 PM" |
| Appointment Reminder | Customer + Employee | "Upcoming Appointment" | "Reminder: Hair Spa at 3:00 PM today — don't forget!" |
| Service Completed | Customer | "Service Done" | "Your Hair Spa at Dream Look MG Road has been completed. Rate your experience!" |
| Low Stock Alert | Manager + Owner | "⚠️ Stock Alert" | "Schwarzkopf Shampoo at MG Road is running low (3 units remaining)" |
| Settlement Ready | Owner + Employee | "Settlement Ready" | "May 2026 settlement is ready. Net payout: ₹2,800" |
| Check-in Reminder | Employee | "Check In" | "Good morning! Don't forget to check in by 10:00 AM" |

---

## 13. PERFORMANCE REQUIREMENTS

| Metric | Target |
|--------|--------|
| App cold start | < 2 seconds |
| Screen transition | < 300ms (60fps) |
| API response display | < 500ms after data received |
| Image loading (avatar) | < 1 second with Coil cache |
| Database queries (Room) | < 50ms for single entity |
| Offline data load | < 200ms from local cache |
| APK size | < 25 MB (without assets) |
| Memory usage | < 150 MB active, < 80 MB background |
| Battery impact | < 2% per hour active use |
| Animations | 60fps minimum, no jank |

### Offline-First Architecture
```
1. All data stored in Room DB (local first)
2. API sync in background using WorkManager
3. Display cached data immediately, update on sync
4. Queue mutations (create appointment, check-in) when offline
5. Retry queued operations when connectivity restored
6. Show "Offline Mode" banner at top when no internet
```

---

## 14. SECURITY REQUIREMENTS

```
- Firebase Auth with phone OTP (no password storage)
- API calls with Firebase ID token in Authorization header
- HTTPS only for all network calls
- Encrypted local storage (EncryptedSharedPreferences for tokens)
- Biometric lock option (fingerprint/face) for sensitive screens
- ProGuard/R8 minification for release builds
- No sensitive data in logs
- Certificate pinning for API calls
```

---

## 15. BUILD CHECKLIST

### Phase 1: Foundation (Week 1)
- [ ] Project setup with Kotlin, Compose, Hilt
- [ ] Room database with all 11 entities + DAOs
- [ ] Retrofit API layer (all 19 endpoints)
- [ ] Firebase Auth (phone OTP)
- [ ] Navigation structure
- [ ] Theme system (light/dark)
- [ ] Splash + Landing + Login screens

### Phase 2: Core Features (Week 2)
- [ ] Customer booking wizard (5 steps)
- [ ] Appointment tracker (phone lookup)
- [ ] Employee dashboard + schedule
- [ ] Commission calculator
- [ ] Record service flow (with product selection)
- [ ] Earnings display with animated counters

### Phase 3: Management (Week 3)
- [ ] Manager dashboard
- [ ] Staff attendance (check-in/out)
- [ ] Appointment management (CRUD)
- [ ] Inventory dashboard + restock
- [ ] Today vs Yesterday comparison

### Phase 4: Owner & Analytics (Week 4)
- [ ] Owner analytics dashboard
- [ ] Revenue charts (area + bar)
- [ ] Staff performance table
- [ ] Settlement engine with CSV export
- [ ] Store comparison dashboard

### Phase 5: Polish (Week 5)
- [ ] Push notifications (FCM)
- [ ] Firebase Cloud Storage (avatar upload)
- [ ] Offline mode + sync
- [ ] Lottie animations
- [ ] Biometric lock
- [ ] Performance optimization
- [ ] Accessibility

### Phase 6: Release (Week 6)
- [ ] ProGuard / R8 configuration
- [ ] LeakCanary testing
- [ ] Espresso UI tests (critical flows)
- [ ] Google Play Store listing
- [ ] Internal testing track
- [ ] Production release

---

## 16. PROJECT STRUCTURE

```
app/src/main/java/com/dreamlook/salon/
├── DreamLookApp.kt                    // Application class + Hilt entry
├── MainActivity.kt                     // Single activity, Compose entry
│
├── data/
│   ├── local/
│   │   ├── db/
│   │   │   ├── AppDatabase.kt         // Room database definition
│   │   │   ├── dao/                   // 11 DAOs (one per entity)
│   │   │   │   ├── StoreDao.kt
│   │   │   │   ├── EmployeeDao.kt
│   │   │   │   ├── ServiceDao.kt
│   │   │   │   ├── ProductDao.kt
│   │   │   │   ├── InventoryDao.kt
│   │   │   │   ├── CustomerDao.kt
│   │   │   │   ├── AppointmentDao.kt
│   │   │   │   ├── TransactionDao.kt
│   │   │   │   ├── TransactionProductDao.kt
│   │   │   │   ├── AttendanceDao.kt
│   │   │   │   └── ExpenseDao.kt
│   │   │   └── converter/             // Type converters
│   │   ├── datastore/
│   │   │   └── AuthDataStore.kt       // Encrypted token storage
│   │   └── entity/                    // Room entities (11 files)
│   │
│   ├── remote/
│   │   ├── api/
│   │   │   └── SalonApi.kt            // Retrofit interface (19 endpoints)
│   │   ├── dto/                       // Data Transfer Objects
│   │   │   ├── AuthRequest.kt
│   │   │   ├── AuthResponse.kt
│   │   │   ├── AppointmentCreateRequest.kt
│   │   │   ├── TransactionCreateRequest.kt
│   │   │   └── ... (one per endpoint)
│   │   └── interceptor/
│   │       └── AuthInterceptor.kt     // Firebase ID token injection
│   │
│   └── repository/                    // Repository implementations
│       ├── AuthRepository.kt
│       ├── AppointmentRepository.kt
│       ├── EmployeeRepository.kt
│       ├── InventoryRepository.kt
│       ├── TransactionRepository.kt
│       ├── SettlementRepository.kt
│       └── AnalyticsRepository.kt
│
├── domain/
│   ├── model/                         // Domain models
│   │   ├── CommissionBreakdown.kt
│   │   ├── SettlementSummary.kt
│   │   ├── StoreAnalytics.kt
│   │   └── EmployeePerformance.kt
│   └── usecase/                       // Business logic
│       ├── CalculateCommissionUseCase.kt
│       ├── CreateAppointmentUseCase.kt
│       ├── RecordTransactionUseCase.kt
│       ├── CalculateSettlementUseCase.kt
│       └── SyncOfflineDataUseCase.kt
│
├── di/
│   ├── AppModule.kt                    // Database, API, Repository Hilt modules
│   ├── NetworkModule.kt               // Retrofit, OkHttp, Gson setup
│   └── AuthModule.kt                  // Firebase Auth Hilt module
│
├── ui/
│   ├── navigation/
│   │   ├── DreamLookNavHost.kt        // Compose Navigation host
│   │   └── Screen.kt                  // Route sealed class
│   │
│   ├── theme/
│   │   ├── Color.kt                   // DreamLookColors
│   │   ├── Theme.kt                   // Light/Dark themes
│   │   ├── Type.kt                    // Typography
│   │   └── Shape.kt                   // Shape definitions
│   │
│   ├── components/                    // Shared UI components
│   │   ├── GlassCard.kt
│   │   ├── StatCard.kt
│   │   ├── AnimatedCounter.kt
│   │   ├── StatusBadge.kt
│   │   ├── EmptyState.kt
│   │   ├── LoadingSpinner.kt
│   │   ├── ErrorDialog.kt
│   │   ├── ProfileAvatar.kt
│   │   └── CommissionDiagram.kt
│   │
│   ├── auth/
│   │   ├── splash/SplashScreen.kt
│   │   ├── landing/LandingScreen.kt
│   │   ├── login/LoginScreen.kt
│   │   └── otp/OtpVerificationScreen.kt
│   │
│   ├── customer/
│   │   ├── booking/
│   │   │   ├── BookingWizardScreen.kt
│   │   │   ├── StoreSelectionStep.kt
│   │   │   ├── ServiceSelectionStep.kt
│   │   │   ├── DateTimeStep.kt
│   │   │   ├── CustomerDetailsStep.kt
│   │   │   └── ConfirmationStep.kt
│   │   └── tracker/AppointmentTrackerScreen.kt
│   │
│   ├── employee/
│   │   ├── dashboard/EmployeeDashboardScreen.kt
│   │   ├── schedule/TodayScheduleScreen.kt
│   │   ├── calculator/CommissionCalculatorScreen.kt
│   │   ├── activity/RecentActivityScreen.kt
│   │   └── earnings/DailyEarningsChart.kt
│   │
│   ├── manager/
│   │   ├── dashboard/ManagerDashboardScreen.kt
│   │   ├── attendance/StaffAttendanceScreen.kt
│   │   ├── appointments/AppointmentsListScreen.kt
│   │   ├── inventory/InventoryDashboardScreen.kt
│   │   └── comparison/TodayVsYesterdayScreen.kt
│   │
│   └── owner/
│       ├── analytics/OwnerAnalyticsScreen.kt
│       ├── performance/StaffPerformanceScreen.kt
│       ├── settlement/SettlementEngineScreen.kt
│       └── comparison/StoreComparisonScreen.kt
│
├── service/
│   ├── FirebaseMessagingService.kt    // FCM push handler
│   └── SyncWorker.kt                  // WorkManager periodic sync
│
└── util/
    ├── CurrencyFormatter.kt           // ₹ formatting
    ├── DateFormatter.kt               // Date/time formatting
    ├── PhoneNumberFormatter.kt        // +91 normalization
    └── NetworkMonitor.kt              // Connectivity observer
```

---

## 17. KEY IMPLEMENTATION NOTES

### Commission Engine — MUST IMPLEMENT EXACTLY
```
The 50/50 split with product deductions is THE core business logic.
NEVER change this formula without explicit approval.
ownerShare = servicePrice * 0.50
employeeGross = servicePrice * 0.50
employeeNet = employeeGross - totalProductCost
If employeeNet is NEGATIVE, the employee OWES money.
```

### Offline-First Priority
```
Every screen MUST work offline with cached Room data.
Show "Offline Mode" banner when disconnected.
Queue writes (appointments, check-ins) and sync when back online.
```

### Animation Standards
```
- Screen transitions: 300ms ease-in-out
- Card entrance: staggered fade-up (100ms delay per card)
- Counter animations: ease-out duration 800ms
- Pull-to-refresh: Material 3 standard
- Loading states: shimmer effect (not plain spinner)
- Success states: checkmark animation
```

### Dark Mode
```
MUST support from day one.
Use isSystemInDarkTheme() for detection.
All colors defined in Color.kt with light/dark variants.
Glass cards: dark = white/8%, light = white/70%
Charts: dark = lighter colors with glow
```

### Accessibility
```
- All interactive elements min 48dp touch target
- Content descriptions on all icons
- Semantic headings (h1, h2, h3)
- Color-blind friendly (use shapes + patterns, not just color)
- TalkBack support
- Large text scaling support
```

---

## 18. GRADLE DEPENDENCIES (build.gradle.kts)

```kotlin
dependencies {
    // Compose BOM
    implementation(platform("androidx.compose:compose-bom:2024.05.00"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.activity:activity-compose:1.9.0")
    implementation("androidx.navigation:navigation-compose:2.7.7")

    // Lifecycle
    implementation("androidx.lifecycle:lifecycle-runtime-compose:2.8.0")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.0")

    // Hilt
    implementation("com.google.dagger:hilt-android:2.51")
    kapt("com.google.dagger:hilt-android-compiler:2.51")
    implementation("androidx.hilt:hilt-navigation-compose:1.2.0")

    // Room
    implementation("androidx.room:room-runtime:2.6.1")
    implementation("androidx.room:room-ktx:2.6.1")
    kapt("androidx.room:room-compiler:2.6.1")

    // Network
    implementation("com.squareup.retrofit2:retrofit:2.11.0")
    implementation("com.squareup.retrofit2:converter-gson:2.11.0")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")

    // Image Loading
    implementation("io.coil-kt.coil3:coil-compose:3.0.0-alpha06")
    implementation("io.coil-kt.coil3:coil-network-okhttp:3.0.0-alpha06")

    // Firebase
    implementation(platform("com.google.firebase:firebase-bom:32.8.1"))
    implementation("com.google.firebase:firebase-auth-ktx")
    implementation("com.google.firebase:firebase-messaging-ktx")
    implementation("com.google.firebase:firebase-analytics-ktx")
    implementation("com.google.firebase:firebase-crashlytics-ktx")
    implementation("com.google.firebase:firebase-storage-ktx")
    implementation("com.google.firebase:firebase-config-ktx")

    // DataStore
    implementation("androidx.datastore:datastore-preferences:1.1.1")
    implementation("androidx.security:security-crypto:1.1.0-alpha06")

    // WorkManager
    implementation("androidx.work:work-runtime-ktx:2.9.0")

    // Lottie
    implementation("com.airbnb.android:lottie-compose:6.4.0")

    // Charts
    implementation("com.patrykandpatrick.vico:compose-m3:2.0.0-alpha.17")

    // Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.1")

    // Serialization
    implementation("com.google.code.gson:gson:2.11.0")

    // Biometric
    implementation("androidx.biometric:biometric:1.1.0")
}
```

---

## 19. DEPLOYMENT & RELEASE

### Google Play Store Checklist
```
1. [ ] App icon (512x512, adaptive icon)
2. [ ] Feature graphic (1024x500)
3. [ ] Screenshots (all form factors)
4. [ ] Short description (80 chars)
5. [ ] Full description (4000 chars)
6. [ ] Privacy policy URL
7. [ ] Content rating questionnaire
8. [ ] Target API level 34
9. [ ] Signing config (release keystore)
10. [ ] ProGuard/R8 rules
11. [ ] Firebase connected (Analytics, Crashlytics)
12. [ ] FCM server key configured
13. [ ] Internal testing track (2 weeks)
14. [ ] Closed testing track (1 week)
15. [ ] Production release
```

### App Signing
```kotlin
// build.gradle.kts (app level)
android {
    signingConfigs {
        create("release") {
            storeFile = file("dreamlook-release.keystore")
            storePassword = System.getenv("KEYSTORE_PASSWORD")
            keyAlias = "dreamlook"
            keyPassword = System.getenv("KEY_PASSWORD")
        }
    }
    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            signingConfig = signingConfigs.getByName("release")
        }
    }
}
```

---

## FINAL NOTES

**This is a PREMIUM, WORLD-CLASS salon management app.**

- Every pixel must look polished
- Every animation must be smooth (60fps)
- Every feature must work offline first
- The commission engine is NON-NEGOTIABLE — implement exactly as specified
- Firebase integration is MANDATORY for auth, push, storage, analytics
- The settlement engine must match the web app exactly (same formula, same CSV format)
- Dark mode is not optional — it's a first-class citizen
- Performance matters more than features — fast > feature-rich

**Build this like you're building the next Uber for salons.**
