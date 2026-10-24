# Mediwell — Doctor Appointment Booking Platform

Mediwell is a full-stack doctor appointment booking platform engineered with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, and **SQLite with Prisma**. It features a public home page, responsive design down to 360px, light and dark modes that follow device preference, and role-based access control for three distinct roles: **Patient**, **Doctor**, and **Hospital Admin**.

---

## 1. Technology Stack

- **Framework:** Next.js (App Router) + TypeScript
- **Styling:** Tailwind CSS (custom curated color palette, sentence case, accessible focus states, dark mode)
- **Typography:** Google Fonts Figtree with a `system-ui` fallback
- **Database:** SQLite with Prisma ORM (`dev.db`)
- **Authentication:** NextAuth Credentials provider with `bcryptjs` password hashing and JWT sessions
- **Icons:** Lucide React

---

## 2. Visual Design System & Mobile Version

- **Color Palette (Clean White & Medical Royal Blue):**
  - **Surface & Cards:** Pure white `#FFFFFF` with thin slate borders (`#E2E8F0` / `#CBD5E1`)
  - **Background Canvas:** Ultra-clean `#F8FAFC` (Dark mode: deep navy `#0B132B` / `#132338`)
  - **Primary Brand Blue:** Medical royal blue `#2563EB` (hover: `#1D4ED8`, active: `#1E40AF`)
  - **Soft Blue Tint:** `#EFF6FF` with subtle border `#BFDBFE`
  - **Ink / Typography:** Deep slate `#0F172A` (Muted text: `#64748B` / `#475569`)
  - **Status Accents:**
    - Confirmed / Live: Emerald `#16A34A` on `#DCFCE7`
    - Pending: Amber `#D97706` on `#FEF3C7`
    - Completed: Medical Blue `#2563EB` on `#EFF6FF`
    - Cancelled / Danger: Crimson `#DC2626` on `#FEF2F2`
- **Typography:** Sentence case everywhere (no all-caps labels), Google Fonts Figtree with system fallbacks.
- **Mobile First Version (Down to 360px & 320px):**
  - **Sticky Bottom Navigation Bar (`<MobileNav />`):** Thumb-accessible navigation bar on mobile screens for Home, Book, Appointments, and Role Portals.
  - **Bottom-Sheet Booking Drawer (`<BookingModal />`):** Full mobile-responsive bottom sheet with horizontal 7-day date chips and touch-friendly slot pills.
  - **Touch Targets:** All interactive slot chips, tab switchers, and action buttons have 44px+ touch heights and clear visible focus rings.
- **Official Logo Asset:** Integrated the official high-resolution Mediwell logo (`/logo.png`) featuring the royal blue to aquamarine emerald gradient.
- **Integrated Payment Checkout (UPI & Pay at Clinic):**
  - Instant UPI checkout supporting Google Pay, PhonePe, Paytm, BHIM, custom UPI ID, and live QR code display.
  - Pay at Clinic option for settlement upon arrival at the hospital.
  - Unique transaction reference tracking (`TXN_UPI_...`) with instant digital receipts.
- **Production Healthcare Feel:** Doctor rating stars (⭐ 4.9), verified MD badges, specialty icons, and transparent fee tags in ₹.

---

## 3. Data Model & Double-Booking Prevention

### Schema Models
- **`User`:** `id`, `name`, `email`, `passwordHash`, `role` (`PATIENT` | `DOCTOR` | `ADMIN`), `createdAt`, `updatedAt`
- **`Doctor`:** `id`, `userId`, `name`, `specialty`, `hospital`, `fee`, `yearsExperience`, `active`, `createdAt`, `updatedAt`
- **`Appointment`:** `id`, `doctorId`, `patientId`, `date` (YYYY-MM-DD), `time` (HH:mm), `reason`, `status` (`PENDING` | `CONFIRMED` | `COMPLETED` | `CANCELLED`), `paymentStatus` (`PAID` | `PAY_AT_CLINIC`), `paymentMethod` (`UPI` | `CARD` | `NETBANKING` | `PAY_AT_CLINIC`), `paymentAmount`, `transactionId`, `createdAt`, `updatedAt`

### Specialties Supported
1. Cardiology
2. Dermatology
3. Pediatrics
4. Orthopedics
5. General medicine

### Standard Consultation Slots (every 30 minutes)
- Morning window: `09:00`, `09:30`, `10:00`, `10:30`, `11:00`, `11:30`
- Afternoon window: `14:00`, `14:30`, `15:00`, `15:30`, `16:00`, `16:30`

### Database-Enforced Slot Integrity
In addition to server-side concurrency validation, the SQLite database enforces a native partial unique index:
```sql
CREATE UNIQUE INDEX idx_doctor_active_slot 
ON Appointment (doctorId, date, time) 
WHERE status != 'CANCELLED';
```
This guarantees at the database level that no doctor can ever be booked twice for the same date and time unless the earlier booking was cancelled. When an appointment is cancelled, the slot is immediately freed for other patients.

---

## 4. Default Demo Accounts

All demo accounts share the password **`demo1234`** (with one-click pre-fill buttons on the login screen):

| Role | Email | Password | Features |
| :--- | :--- | :--- | :--- |
| **Patient** | `patient@mediwell.demo` | `demo1234` | Find doctors, 7-day slot booking modal, cancel pending/confirmed appointments |
| **Doctor** | `doctor@mediwell.demo` | `demo1234` | Today's schedule, pending visit confirm/decline, mark completed |
| **Admin** | `admin@mediwell.demo` | `demo1234` | Platform overview stats (₹ value), doctor provisioning, doctor removal guards |

---

## 5. Local Setup Steps

### Prerequisites
- Node.js v18+ (Node.js 22 or 24 recommended)
- npm v9+

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Push Prisma Schema to SQLite
```bash
npx prisma db push
```
*(This automatically creates `dev.db` and generates the Prisma client).*

### Step 3: Seed Database & Apply Partial Index
```bash
node prisma/seed.js
```
*(Seeds 3 demo accounts, 6 doctors with 1 inactive, and 8 appointments spread across today and the next 3 days, plus applies the partial unique index).*

### Step 4: Run Development Server
```bash
npm run dev
```
Open **`http://localhost:3000`** in your browser.

Or build and run the production server:
```bash
npm run build
npm start
```

### Step 5: Run Automated Verification Tests
```bash
node scripts/test-e2e.js
```
*(Executes 20 end-to-end acceptance checks validating booking, double-booking prevention, status transitions, slot liberation, and admin safeguards).*

---

## 6. Route Structure

| Route | Role Access | Description |
| :--- | :--- | :--- |
| `/` | Public | Home page with hero, live slot chips, specialty tiles, How it works, and top doctors |
| `/login` | Public | Split-layout credentials login with role switcher & demo quick-fill |
| `/signup` | Public | Patient self-registration with automatic password hashing |
| `/patient` | Patient | Doctor search, specialty filter, booking modal with 7-day date chips |
| `/patient?tab=appointments`| Patient | Patient's appointments with status badges & cancellation |
| `/doctor` | Doctor | Today's schedule with visits today, awaiting reply, confirmed stats |
| `/doctor?tab=all` | Doctor | All appointments with Confirm, Decline, and Mark Completed actions |
| `/admin` | Admin | Overview metrics (₹ value), latest bookings, bookings by specialty bars |
| `/admin?tab=doctors` | Admin | Doctor roster, active on/off toggle, add doctor form, removal blocker |
| `/admin?tab=appointments` | Admin | Complete platform appointment ledger with multi-field search |
