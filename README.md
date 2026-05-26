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

### Sync localhost → Render (production database)

Copy `.env.render.example` to `.env.render`, paste your Render Postgres external URL, then after working locally:

```bash
npm run db:deploy-render
```

This updates the schema on Render and copies **all** local `school_sms` data. See [docs/DATABASE-RENDER.md](docs/DATABASE-RENDER.md).

### Render production environment variables

| Variable | Value |
|----------|--------|
| `DATABASE_URL` | **Internal** Postgres URL + `?schema=school_sms` (on the Web Service only) |
| `NEXTAUTH_URL` | Your public app URL, e.g. `https://school-management-system.onrender.com` |
| `AUTH_SECRET` | New random secret for production (`openssl rand -base64 32`) |
| `NODE_ENV` | `production` |
| `OLLAMA_BASE_URL` | Internal URL of the Ollama private service, e.g. `http://school-sms-ollama:11434` |
| `OLLAMA_MODEL` | `llama3.1:8b` |
| `AI_TUTOR_ENABLED` | `true` |

Use **External** URL only in `.env.render` on your laptop for `npm run db:deploy-render` — not on the deployed web service.

### AI Tutor (Ollama)

Local: install [Ollama](https://ollama.com), run `ollama pull llama3.1:8b`, copy `.env.example` → `.env`, then `npm run dev`.  
Full guide: [docs/OLLAMA-AI-TUTOR.md](docs/OLLAMA-AI-TUTOR.md).

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
