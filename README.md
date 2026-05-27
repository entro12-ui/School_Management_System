# EduSync SMS — School Management System (KG–12)

Multi-branch school management platform aligned with your architecture: **Super Admin (Central Office)** → **Branch Admins** → **Teachers / Finance / Librarians** → integrated **KG–12 modules** → **Parent / Student / Teacher portals** → **leadership dashboards** → **MoE audit exports**.

## Tech stack

- **Next.js 15** (App Router) + TypeScript
- **PostgreSQL** + **Prisma ORM**
- **NextAuth v5** (credentials, role-based routes)
- **Tailwind CSS 4**
- **Ollama** (optional) — AI Study Tutor for students ([docs/OLLAMA-AI-TUTOR.md](docs/OLLAMA-AI-TUTOR.md))

## Quick start (local)

### 1. Prerequisites

- Node.js 20+
- PostgreSQL 14+ (or Docker Compose: `docker compose up -d`)

### 2. Install & configure

```bash
npm install
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5434/school_management?schema=school_sms"
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

### AI Tutor (Ollama, local)

1. Install [Ollama](https://ollama.com) and pull the model:

   ```bash
   ollama pull llama3.1:8b
   # or: ./scripts/ollama-setup-local.sh
   ```

2. In `.env` (from `.env.example`):

   ```env
   OLLAMA_BASE_URL=http://127.0.0.1:11434
   OLLAMA_MODEL=llama3.1:8b
   AI_TUTOR_ENABLED=true
   AI_TUTOR_FALLBACK_MOCK=true
   ```

3. Open **Student → AI Tutor** — the header should show **Ollama connected** when the model is running.

Details: [docs/OLLAMA-AI-TUTOR.md](docs/OLLAMA-AI-TUTOR.md)

---

## Deploy to Render

The repo includes [`render.yaml`](render.yaml) (Blueprint) with:

| Service | Type | Role |
|---------|------|------|
| `school-management-system` | Web (Node) | Next.js app |
| `school-sms-ollama` | Private (Docker) | Ollama LLM — auto-pulls model on start |
| `school-sms-db` | Postgres (optional) | Or link your existing Render database |

### 1. Create the Blueprint

1. [Render Dashboard](https://dashboard.render.com) → **New** → **Blueprint**.
2. Connect this repository and apply `render.yaml`.
3. Set required secrets on the **web** service when prompted:

   | Variable | Value |
   |----------|--------|
   | `DATABASE_URL` | **Internal** Postgres URL + `?schema=school_sms` |
   | `NEXTAUTH_URL` | Public app URL, e.g. `https://school-management-system.onrender.com` |
   | `AUTH_URL` | Same as `NEXTAUTH_URL` |
   | `AUTH_SECRET` | `openssl rand -base64 32` |

   `OLLAMA_BASE_URL` is wired automatically to the private Ollama service (no manual URL needed when using the blueprint).

### 2. Ollama on Render

The **`school-sms-ollama`** private service:

- Builds from [`docker/ollama/Dockerfile`](docker/ollama/Dockerfile)
- Pulls `llama3.1:8b` on deploy (first deploy may take **10–30 minutes**)
- Stores models on a **20GB persistent disk** (`/root/.ollama`)
- Uses **Pro (4GB RAM)** by default — upgrade to **Pro Plus (8GB)** if you see out-of-memory errors

The web app reaches Ollama only on Render’s **private network** (students never call Ollama directly).

| Variable (web service) | Blueprint default | Notes |
|------------------------|-------------------|--------|
| `OLLAMA_BASE_URL` | From `school-sms-ollama` | Auto via `fromService` |
| `OLLAMA_MODEL` | `llama3.1:8b` | Must match Ollama service |
| `AI_TUTOR_ENABLED` | `true` | |
| `AI_TUTOR_FALLBACK_MOCK` | `true` | Guided replies until model is ready |

After deploy, check **school-sms-ollama → Logs** for `[ollama] Model llama3.1:8b is available`, then **Student → AI Tutor** in the app.

Full guide: [docs/OLLAMA-AI-TUTOR.md](docs/OLLAMA-AI-TUTOR.md)

### 3. Sync local database → Render

Use the **External** Postgres URL on your laptop only (not on the web service):

```bash
cp .env.render.example .env.render
# Edit RENDER_DATABASE_URL=... from Render → Postgres → External URL + ?schema=school_sms

npm run db:deploy-render
```

See [docs/DATABASE-RENDER.md](docs/DATABASE-RENDER.md) for Internal vs External URLs and other sync commands.

---

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
npm run dev              # Development server
npm run build            # Production build
npm run start            # Production server (after build)
npm run db:studio        # Prisma Studio
npm run db:migrate       # Migrations (production)

# Render database sync (requires .env.render)
npm run db:deploy-render      # Schema + full local data → Render
npm run db:push-render        # Schema only on Render
npm run db:sync-to-render     # Data only → Render
npm run db:sync-from-render   # Render → local
npm run db:compare-render     # Row counts local vs Render
```
