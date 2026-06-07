# EduSync SMS — School Management System (KG–12)

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.9-2D3748)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791)](https://www.postgresql.org/)

**EduSync SMS** is a multi-branch school management platform for kindergarten through grade 12. It unifies academic operations, finance, library services, human resources, and role-specific portals under a single Next.js application—with optional AI-assisted learning and parent communication features.

---

## Table of contents

- [Overview](#overview)
- [Key features](#key-features)
- [Tech stack and architecture](#tech-stack-and-architecture)
- [Prerequisites](#prerequisites)
- [Installation and setup](#installation-and-setup)
- [Environment variables](#environment-variables)
- [Database setup and migrations](#database-setup-and-migrations)
- [Usage guide](#usage-guide)
- [API endpoints](#api-endpoints)
- [Project structure](#project-structure)
- [Deployment](#deployment)
- [Testing and quality](#testing-and-quality)
- [Limitations and assumptions](#limitations-and-assumptions)
- [Contributing](#contributing)
- [Roadmap](#roadmap)
- [License](#license)
- [Additional documentation](#additional-documentation)

---

## Overview

### Purpose

Schools operating multiple campuses need consistent enrollment, grading, attendance, fees, library circulation, HR records, and reporting—while giving each stakeholder a focused experience. EduSync SMS models a **central office (super admin)** overseeing **branch administrators**, with dedicated workflows for teachers, registrars, finance officers, librarians, HR staff, parents, and students.

### Who it is for

| Audience | How they use the system |
|----------|-------------------------|
| **Developers** | Extend portals, Prisma models, and server actions; deploy via Render or self-hosted Node |
| **School IT / admins** | Configure branches, academic years, fees, registrations, and system settings |
| **Stakeholders** | Review dashboards, audit logs, and cross-branch KPIs without touching code |

### Organizational model

```
Super Admin (Central Office)
    ├── Branch Admin (per campus)
    │       ├── Registrar · Teacher · Finance · Librarian · HR Officer
    │       └── Students & Parents (portals)
    └── Consolidated reporting, audit, organization hierarchy
```

Data is scoped by **branch** where applicable. Academic structure follows Ethiopian-style **grade bands** (KG, Primary, Junior High, Senior High) with **senior streams** (Natural Science, Social Science, Science).

---

## Key features

### Central administration (`/admin`)

- Multi-branch overview and comparison
- Organization hierarchy visualization
- Registration request approval (registrar / HR manager applications)
- System settings (school name, calendar, OTP expiry, SMS provider placeholders)
- Audit log review
- Report export UI (foundation for PDF/Excel/CSV exporters)

### Branch operations (`/branch`)

- Branch KPIs and enrollment by grade band
- Class and homeroom management
- Staff roster
- Branch-level registrations and audit views

### Academic and registrar (`/registrar`, `/teacher`)

- Student enrollment and record updates
- Class schedules
- Weighted grading (assessments, grade records, GPA)
- Daily and summary attendance
- Student ID card generation
- Transcript preview and export (HTML/CSV via API)
- Teacher class roster, grading (single and bulk), assignments, exams

### Finance (`/finance`)

- Fee structures by grade band and term
- Payment tracking (pending, partial, paid, overdue)
- Payment proof upload and review workflow
- Receipts and financial reports

### Library (`/library`)

- Catalog management (books, digital resources)
- Issue/return, reservations, fines
- Borrower accounts (students and teachers)
- Reading logs and library reports

### Human resources (`/hr`)

- Departments, designations, employees
- Attendance, leave types and requests
- Payroll structures and payroll runs
- Performance reviews, training, assets
- Recruitment (job posts, candidates)
- RBAC with HR roles and permissions
- Employee ID cards and document uploads

### Parent portal (`/parent`)

- Linked children: attendance, results, fees, library
- **Parent Communication Bot** — draft messages to school staff (multilingual, tone-aware, meeting requests, edit/copy/WhatsApp/Telegram/download; rule-based, not LLM-backed)

### Student portal (`/student`)

- Schedule, assignments, exams, GPA
- Fee status and library activity
- Transcript download
- **AI Study Tutor** — streaming chat with Ollama (RAG over student context) and optional mock fallback

### Public and onboarding

- Marketing landing page (`/`)
- Credential login (`/login`)
- Self-service registration flows: student, teacher, finance officer, HR manager (`/register/*`)
- Public registration status check API

### Security and access control

- **NextAuth v5** (Auth.js) with JWT sessions and credentials provider
- Edge middleware enforces role-based route access per portal prefix
- Mandatory password change flow when flagged on the user account

---

## Tech stack and architecture

| Layer | Technology |
|-------|------------|
| **Framework** | [Next.js 15](https://nextjs.org/) (App Router), [React 19](https://react.dev/) |
| **Language** | TypeScript 5.8 |
| **Database** | PostgreSQL 16 (schema: `school_sms`) |
| **ORM** | Prisma 6.9 |
| **Auth** | NextAuth v5 (beta) — credentials, JWT |
| **Styling** | Tailwind CSS 4 |
| **Validation** | Zod |
| **AI (optional)** | [Ollama](https://ollama.com) — student tutor; private Docker service on Render |
| **Deployment** | [Render](https://render.com) (`render.yaml` blueprint) |

### High-level request flow

```mermaid
flowchart TB
  Browser[Browser] --> Next[Next.js App Router]
  Next --> MW[Edge Middleware / NextAuth]
  MW --> Pages[Server Components & Client Components]
  Pages --> Actions[Server Actions - src/lib/actions]
  Actions --> Prisma[Prisma Client]
  Prisma --> PG[(PostgreSQL school_sms)]
  Pages --> API[Route Handlers - src/app/api]
  API --> Ollama[Ollama - optional]
```

Most business logic lives in **server actions** (`src/lib/actions/*`) and **services** (`src/lib/services/*`). REST-style route handlers are used for health checks, streaming AI chat, and downloadable transcripts.

---

## Prerequisites

- **Node.js** 20 or later
- **npm** (comes with Node)
- **PostgreSQL** 14+ (local via Docker recommended)
- **Docker** and Docker Compose (optional but documented for local DB)
- **Ollama** (optional, for AI Tutor locally)

---

## Installation and setup

### 1. Clone and install dependencies

```bash
git clone <repository-url>
cd School_Management_System-main
npm install
```

`postinstall` runs `prisma generate` automatically.

### 2. Configure environment

```bash
cp .env.example .env
```

Generate a secure auth secret:

```bash
openssl rand -base64 32
```

Paste the output into `AUTH_SECRET` in `.env`.

### 3. Start local PostgreSQL (Docker)

```bash
docker compose up -d
```

This starts Postgres on **host port 5434** with database `school_management`.

### 4. Initialize the database

```bash
npm run db:push      # Apply Prisma schema
npm run db:seed      # Demo branches, users, classes, sample data
```

Or use the combined setup script:

```bash
npm run db:setup     # db push + seed + ensure demo logins
```

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

If you encounter stale Next.js cache issues:

```bash
npm run dev:clean
```

---

## Environment variables

### Core application

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string; include `?schema=school_sms` |
| `AUTH_SECRET` | Yes | Secret for signing JWTs (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | Yes | Public app URL (e.g. `http://localhost:3000`) |
| `AUTH_URL` | Production | Same as `NEXTAUTH_URL` on Render |
| `AUTH_TRUST_HOST` | Production | Set to `true` behind Render/proxy |

**Example (local):**

```env
DATABASE_URL="postgresql://postgres:password@localhost:5434/school_management?schema=school_sms"
AUTH_SECRET="your-generated-secret"
NEXTAUTH_URL="http://localhost:3000"
```

### Render database sync (local machine only)

Copy `.env.render.example` to `.env.render` (gitignored) and set:

| Variable | Description |
|----------|-------------|
| `RENDER_DATABASE_URL` | Render Postgres **External** URL + `?schema=school_sms` |
| `LOCAL_DATABASE_URL` | Local Docker URL (default in example file) |

See [docs/DATABASE-RENDER.md](docs/DATABASE-RENDER.md) for the full local ↔ Render workflow.

### Ollama AI Tutor (optional)

| Variable | Default | Description |
|----------|---------|-------------|
| `OLLAMA_BASE_URL` | `http://127.0.0.1:11434` | Ollama HTTP endpoint |
| `OLLAMA_MODEL` | `qwen2.5:7b` | Model tag (`ollama pull …`) |
| `AI_TUTOR_ENABLED` | `true` | Enable student AI tutor |
| `AI_TUTOR_FALLBACK_MOCK` | `true` | Use rule-based replies if Ollama is unreachable |
| `OLLAMA_TIMEOUT_MS` | `120000` | Request timeout (ms) |
| `OLLAMA_NUM_PREDICT` | `140` | Max tokens per reply |
| `OLLAMA_NUM_CTX` | `3072` | Context window size |
| `OLLAMA_MAX_HISTORY` | `4` | Chat turns kept in prompt |

Full list and Render wiring: [docs/OLLAMA-AI-TUTOR.md](docs/OLLAMA-AI-TUTOR.md).

---

## Database setup and migrations

### Schema

All application tables live in PostgreSQL schema **`school_sms`**. The Prisma schema defines 40+ models including organization, academics, finance, library, messaging, audit, and HR entities.

### Common commands

| Command | Purpose |
|---------|---------|
| `npm run db:push` | Push schema to DB (prototyping / local) |
| `npm run db:migrate` | Create/apply Prisma migrations (`prisma migrate dev`) |
| `npm run db:seed` | Reset and seed demo data (destructive to seed-related tables) |
| `npm run db:ensure-demo` | Upsert demo accounts without full wipe |
| `npm run db:studio` | Open Prisma Studio GUI |
| `npm run db:check` | Validate database connectivity and counts |
| `npm run db:ping` | Quick connection ping |

### Render sync commands

| Command | Purpose |
|---------|---------|
| `npm run db:deploy-render` | Push schema + copy all local data to Render |
| `npm run db:push-render` | Schema only on Render |
| `npm run db:sync-to-render` | Data only → Render (overwrites `school_sms`) |
| `npm run db:sync-from-render` | Render → local |
| `npm run db:compare-render` | Row-count diff local vs Render |
| `npm run db:seed-hr-render` | HR demo seed on Render |

**Important:** Database sync does **not** copy files under `public/uploads/` (avatars, HR documents). Copy that directory separately or use object storage in production.

### Production migration approach

For production, prefer versioned migrations:

```bash
npx prisma migrate deploy
```

The Render build uses `prisma generate` during `npm run build`; apply schema changes with `db:push-render` or migrations before relying on new columns in production.

---

## Usage guide

### Accounts and sign-in

EduSync SMS ships **without public demo accounts**. Accounts are provisioned per
deployment:

- The first **Super Admin** is created during environment setup (see your
  deployment runbook / `prisma/ensure-demo-login.ts` is intended for internal
  development environments only and should not be run in production).
- **Branch staff** are created by admins or apply through `/register/*` for approval.
- **Students and parents** are enrolled by the registrar and receive a one-time
  password (OTP) for first sign-in.

Sign in at `/login` with the email and password issued to your account.

> For local development only, sample data can be generated with `npm run db:seed`.
> Sample credentials are intended for local testing and must never be enabled in a
> production deployment.

### Portal entry points

| Role | Dashboard path |
|------|----------------|
| Super Admin | `/admin` |
| Branch Admin | `/branch` |
| Registrar | `/registrar` |
| Teacher | `/teacher` |
| Finance Officer | `/finance` |
| Librarian | `/library` |
| HR Officer | `/hr` |
| Parent | `/parent` |
| Student | `/student` |

After login, users are redirected to their role home. Visiting `/dashboard` or `/home` also redirects to the correct portal.

### AI Tutor (local)

1. Install Ollama: https://ollama.com  
2. Pull a model:

   ```bash
   ollama pull qwen2.5:7b
   # or: ollama pull llama3.1:8b
   ```

3. Ensure `AI_TUTOR_ENABLED=true` in `.env`.  
4. Sign in as a student → **AI Tutor**. The UI shows **Ollama connected** when `/api/student/ai-tutor/status` succeeds.

### Self-service registration

Public routes under `/register` allow applicants to submit requests. Admins approve pending registrations from `/admin/registrations` or branch registration pages.

Check application status:

```bash
curl "http://localhost:3000/api/register/status?email=applicant@example.com"
```

### Production build (local smoke test)

```bash
npm run build
npm start
```

---

## API endpoints

Route handlers live under `src/app/api`. Most mutations use **server actions** instead of REST; the table below lists HTTP APIs.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/health` | Public | Health check for load balancers (no DB) |
| `GET` / `POST` | `/api/auth/[...nextauth]` | Public | NextAuth / Auth.js handlers |
| `GET` | `/api/register/status?email=` | Public | Registration request status by email |
| `GET` | `/api/student/ai-tutor/status` | Student | Ollama connectivity and model info |
| `POST` | `/api/student/ai-tutor/chat` | Student | Streaming tutor chat (JSON lines: `meta`, `token`, `done`, `error`) |
| `GET` | `/api/student/transcript?format=` | Student | Transcript download (`html` or `csv`) |
| `GET` | `/api/parent/communication-bot` | Parent | Bot context and stats |
| `POST` | `/api/parent/communication-bot` | Parent | Generate communication draft (`childId`, `messageType`, `language`, `tone`) |

### Examples

**Health check:**

```bash
curl http://localhost:3000/api/health
```

**Student transcript (CSV):**

```bash
# Requires session cookie from browser login, or use authenticated fetch in-app
curl -b cookies.txt "http://localhost:3000/api/student/transcript?format=csv" -o transcript.csv
```

**AI tutor chat (authenticated student session):**

```http
POST /api/student/ai-tutor/chat
Content-Type: application/json

{
  "message": "Explain photosynthesis for my biology class.",
  "history": []
}
```

Response is **newline-delimited JSON** stream events.

---

## Project structure

```
School_Management_System-main/
├── prisma/
│   ├── schema.prisma          # Data model (school_sms)
│   ├── seed.ts                # Demo data seeder
│   └── *.ts                   # Maintenance & ensure scripts
├── src/
│   ├── app/
│   │   ├── (portals)/         # Role-based dashboards (admin, branch, teacher, …)
│   │   ├── api/               # Route handlers (health, auth, AI, transcript)
│   │   ├── login/             # Login page
│   │   ├── register/          # Public registration flows
│   │   └── page.tsx           # Marketing landing
│   ├── components/            # UI by domain (teacher, hr, finance, …)
│   ├── lib/
│   │   ├── actions/           # Server actions (mutations)
│   │   ├── services/          # Query and business logic
│   │   ├── auth/              # NextAuth config and role routing
│   │   ├── ai/                # Ollama client, RAG, tutor prompts
│   │   └── nav/               # Sidebar navigation per role
│   └── middleware.ts          # NextAuth edge protection
├── public/uploads/            # Local file storage (avatars, HR docs)
├── scripts/                   # Render DB sync & Ollama setup shell scripts
├── docker/
│   └── ollama/                # Ollama Dockerfile for Render private service
├── docs/                      # DATABASE-RENDER, OLLAMA-AI-TUTOR guides
├── docker-compose.yml         # Local Postgres on port 5434
├── render.yaml                # Render blueprint (web + Ollama + Postgres)
├── .env.example               # Local environment template
└── package.json
```

### Architecture mapping (design intent)

| Concept | Implementation |
|---------|----------------|
| Super Admin / Central Office | `/admin` — consolidated stats, branches, audit |
| Branch Admin | `/branch` — campus KPIs, classes, staff |
| KG / Primary / JH / SH | `GradeBand` enum, `Class`, assessments |
| Senior streams | `SeniorStream` enum |
| MoE-style reporting | `/admin/reports`, branch reports (export wiring extensible) |
| Parent / Student / Teacher portals | `/parent`, `/student`, `/teacher` |

---

## Deployment

### Render (recommended)

The repository includes a [Render Blueprint](https://render.com/docs/blueprint-spec) (`render.yaml`):

1. **Web service** — `school-management-system` (Node, `npm run build`, health check `/api/health`)
2. **Private service** — `school-sms-ollama` (Docker Ollama; requires sufficient RAM for 7B models)
3. **PostgreSQL** — optional managed DB or link an existing instance

**Before first deploy:**

1. Set `DATABASE_URL` on the web service to the **Internal** Postgres URL with `?schema=school_sms`.
2. Set `AUTH_SECRET`, `NEXTAUTH_URL`, and `AUTH_URL` to your public HTTPS URL (no trailing slash).
3. Push schema and seed HR demo data from your machine:

   ```bash
   npm run db:push-render
   npm run db:seed-hr-render
   ```

4. For ongoing local → production data sync: `npm run db:deploy-render` (see [docs/DATABASE-RENDER.md](docs/DATABASE-RENDER.md)).

| Render variable | Notes |
|-----------------|-------|
| `DATABASE_URL` | Internal URL + `?schema=school_sms` on web service only |
| `NEXTAUTH_URL` / `AUTH_URL` | Public app URL, e.g. `https://your-app.onrender.com` |
| `AUTH_SECRET` | Unique production secret |
| `AUTH_TRUST_HOST` | `true` |
| `OLLAMA_*` / `AI_TUTOR_*` | Wired in `render.yaml` when Ollama private service is deployed |

Use the **External** Postgres URL only in local `.env.render` for sync scripts—not on the running web service.

### Self-hosted

1. Provision PostgreSQL and set `DATABASE_URL`.
2. Run `npm run build` and `npm start` (or use a process manager).
3. Set all auth and optional Ollama variables.
4. Run `npx prisma migrate deploy` or `prisma db push` for schema.
5. Ensure `public/uploads` is on persistent storage if using file uploads.

---

## Testing and quality

There is **no automated test suite** configured in `package.json` at this time. Recommended manual checks:

| Check | Command / action |
|-------|------------------|
| Lint | `npm run lint` |
| DB connectivity | `npm run db:ping` or `npm run db:check` |
| Production build | `npm run build` |
| Role access | Log in as each demo role; confirm forbidden routes return 403/redirect |
| Health endpoint | `curl /api/health` after deploy |

When adding tests, Vitest or Playwright would integrate naturally with the Next.js App Router layout.

---

## Limitations and assumptions

- **File uploads** are stored on the local filesystem (`public/uploads/`). They are not synced with Render database dumps; production should use shared disk or S3-compatible storage for multi-instance deployments.
- **Report exporters** on admin/branch report pages provide UI foundations; PDF/Excel generation may require additional libraries (`pdfkit`, `exceljs`, etc.).
- **SMS notifications** are configurable in system settings but require integrating a real provider (Africa's Talking, Twilio, etc.).
- **Payment gateways** (Telebirr, Chapa) are not wired; finance tracks manual and proof-based payments.
- **Biometric/RFID attendance** is modeled (`AttendanceRecord.method`) but hardware integration is not included.
- **AI Tutor** quality and latency depend on Ollama model size; Render free/starter tiers may OOM on large models—use `qwen2.5:7b` or upgrade the Ollama service plan.
- **Parent Communication Bot** generates template-based drafts, not LLM responses.
- Demo seed **wipes** many tables when running `db:seed`; use `db:ensure-demo` for non-destructive demo account repair.
- The package is marked `"private": true` in `package.json`; clarify licensing before public distribution.

---

## Contributing

1. **Fork** the repository and create a feature branch from `main`.
2. **Follow existing patterns**: server actions for mutations, Zod for validation, role checks in actions and `auth.config.ts`.
3. **Keep changes focused** — match naming and folder layout in `src/components` and `src/lib`.
4. **Database changes**: update `prisma/schema.prisma`, run `npm run db:push` locally, and document any new env vars in `.env.example`.
5. **Run lint** before opening a PR: `npm run lint`.
6. **Do not commit** `.env`, `.env.render`, or secrets.

Pull requests should describe the user-facing change, schema impact, and how you tested (roles exercised, commands run).

---

## Roadmap

Planned or suggested enhancements (from product design and codebase comments):

1. **Real-time sync** — WebSockets or Supabase Realtime for cross-branch updates  
2. **Report exporters** — PDF/Excel/CSV on `/api/reports` and admin report pages  
3. **SMS gateway** — Parent alerts via configured provider  
4. **Payment gateway** — Telebirr / Chapa for online fee payments  
5. **National exam module** — Grade 10 & 12 pass-rate tracking  
6. **Biometric/RFID attendance** — Hardware API on attendance records  
7. **Automated tests** — E2E flows per portal and CI on Render/GitHub Actions  
8. **Object storage** — S3-compatible uploads for avatars and HR documents  

---

## License

No `LICENSE` file is included in this repository. The project is declared **private** in `package.json`. Contact the repository owner for terms of use, distribution, and contribution rights before deploying commercially or redistributing the codebase.

---

## Additional documentation

| Document | Topics |
|----------|--------|
| [docs/DATABASE-RENDER.md](docs/DATABASE-RENDER.md) | Local Docker DB, Render internal vs external URLs, deploy/sync commands |
| [docs/OLLAMA-AI-TUTOR.md](docs/OLLAMA-AI-TUTOR.md) | Local Ollama setup, Render private service, env tuning, troubleshooting |

---

## Quick reference — npm scripts

```bash
npm run dev              # Development server (prisma generate + next dev)
npm run build            # Production build
npm run start            # Start production server
npm run lint             # ESLint (Next.js config)
npm run db:setup         # Push schema + seed + demo logins
npm run db:studio        # Prisma Studio
npm run db:deploy-render # Schema + full data sync to Render
```

For questions or issues, open a GitHub issue with steps to reproduce, environment (local vs Render), and relevant logs (without secrets).
