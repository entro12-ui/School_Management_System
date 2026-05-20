# EduSync SMS — School Management System (KG–12)

Multi-branch school management platform aligned with your architecture: **Super Admin (Central Office)** → **Branch Admins** → **Teachers / Finance / Librarians** → integrated **KG–12 modules** → **Parent / Student / Teacher portals** → **leadership dashboards** → **MoE audit exports**.

## Tech stack

- **Next.js 15** (App Router) + TypeScript
- **PostgreSQL** + **Prisma ORM**
- **NextAuth v5** (credentials, role-based routes)
- **Tailwind CSS 4**

## Quick start

### 1. Prerequisites

- Node.js 20+
- PostgreSQL 14+

### 2. Install & configure

```bash
cd "/home/entro/School Management System"
npm install
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/school_management"
AUTH_SECRET="your-random-secret-here"
NEXTAUTH_URL="http://localhost:3000"
```

Generate `AUTH_SECRET`:

```bash
openssl rand -base64 32
```

### 3. Database

```bash
npm run db:push
npm run db:seed
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Demo accounts (password: `demo1234`)

| Role | Email |
|------|-------|
| Super Admin | `superadmin@school.et` |
| Branch Admin (Addis) | `admin.addis@school.et` |
| Branch Admin (Bishoftu) | `admin.bishoftu@school.et` |
| Teacher | `teacher.addis@school.et` |
| Finance Officer | `finance.addis@school.et` |
| Librarian | `library.addis@school.et` |
| Parent | `parent@school.et` |
| Student | `student@school.et` |

## Portal routes

| Role | Dashboard |
|------|-----------|
| Super Admin | `/admin` |
| Branch Admin | `/branch` |
| Teacher | `/teacher` |
| Finance Officer | `/finance` |
| Librarian | `/library` |
| Parent | `/parent` |
| Student | `/student` |

## Architecture mapping

| Your diagram | Implementation |
|--------------|----------------|
| Super Admin | `/admin` — consolidated stats, branch comparison, audit logs |
| Branch Admin | `/branch` — branch KPIs, enrollment by grade band |
| KG / Primary / JH / SH | `GradeBand` enum + `Class`, `Assessment`, `GradeRecord` |
| Senior streams | `SeniorStream` (Natural / Social / Science) |
| Academic / Attendance / Finance / Library | Prisma models + portal shells |
| Parent / Student / Teacher portals | `/parent`, `/student`, `/teacher` |
| Leadership dashboards | `getConsolidatedStats()`, `getBranchStats()` |
| Export reports | `/admin/reports` (PDF/Excel/CSV UI — wire exporters next) |

## Next implementation steps

1. **Real-time sync** — WebSockets or Supabase Realtime for cross-branch updates
2. **Biometric/RFID attendance** — API integration on `AttendanceRecord.method`
3. **SMS gateway** — Parent alerts (Ethio Telecom / Twilio)
4. **Report exporters** — `pdfkit` / `exceljs` on `/api/reports`
5. **National exam module** — Grade 10 & 12 pass-rate tracking
6. **Payment gateway** — Telebirr / Chapa for parent fee payments

## Scripts

```bash
npm run dev          # Development server
npm run build        # Production build
npm run db:studio    # Prisma Studio
npm run db:migrate   # Migrations (production)
```
# School_Management_System
