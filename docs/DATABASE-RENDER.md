# Local ↔ Render database workflow

The app uses PostgreSQL schema **`school_sms`**. Local development uses Docker on port **5434**; production uses **Render Postgres**.

## Setup once

1. Copy Render external URL into `.env.render`:

   ```bash
   cp .env.render.example .env.render
   # Edit RENDER_DATABASE_URL=... from Render dashboard
   ```

2. Start local database:

   ```bash
   docker compose up -d
   ```

3. Local app `.env`:

   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5434/school_management?schema=school_sms"
   ```

## Daily workflow (build on localhost → push to Render)

After you add employees, registrations, HR files metadata, etc. on **localhost**:

```bash
# 1. Ensure local schema is current
npm run db:push

# 2. Push schema + copy ALL local data to Render
npm run db:deploy-render
```

Type `YES` when prompted, or use:

```bash
npm run db:deploy-render -- --yes
```

## Verify both databases match

```bash
npm run db:compare-render
```

## Pull production down to local (optional)

```bash
npm run db:sync-from-render
npm run dev
```

## Command reference

| Command | What it does |
|---------|----------------|
| `db:deploy-render` | **Schema on Render + full local data copy** (use this most) |
| `db:sync-to-render` | Data only — overwrites Render `school_sms` |
| `db:push-render` | Schema only on Render — keeps existing rows |
| `db:sync-from-render` | Render → local (overwrites local `school_sms`) |
| `db:sync-hr-to-render` | HR tables only (TypeScript, maps branches by `code`) |
| `db:compare-render` | Show row count diff local vs Render |

## Uploaded files (avatars, HR documents)

Database sync does **not** copy files under `public/uploads/`. Those paths are stored in the DB but files live on disk. For production, copy `public/uploads/` to your Render service or use object storage (S3, etc.).

## Render: Internal vs External database URL

Render gives **two** Postgres connection strings. Use each in the right place:

| URL type | Where to use it | Why |
|----------|-----------------|-----|
| **Internal** | `DATABASE_URL` on your **Render Web Service** (production app) | Traffic stays on Render’s private network — faster and more reliable between app and DB. |
| **External** | Your laptop only: `.env.render` → `RENDER_DATABASE_URL` | Used by `npm run db:deploy-render`, `db:sync-from-render`, etc. Your PC cannot reach the internal hostname. |

### On the Render Web Service (deployed app)

In **Dashboard → your Web Service → Environment**:

```env
NODE_ENV=production

# Internal Database URL from Postgres → Connections → Internal
# Append schema (required for this project):
DATABASE_URL=postgresql://USER:PASS@dpg-xxxxx-a/DATABASE?schema=school_sms

# If Internal URL has no query string, use:
# DATABASE_URL=postgresql://...@dpg-xxxxx-a/DATABASE?schema=school_sms

AUTH_SECRET=<openssl rand -base64 32 — production only>
NEXTAUTH_URL=https://your-service-name.onrender.com
```

Important:

- Use **Internal**, not External, for `DATABASE_URL` on the web service.
- Always add **`?schema=school_sms`** (or `&schema=school_sms` if the URL already has `?sslmode=...`). Internal URLs often omit `sslmode`; that is fine on Render’s private network.
- `NEXTAUTH_URL` must be your **public HTTPS app URL** (same host users open in the browser), not the database URL.

Optional (recommended on free tier):

```env
connection_limit=5
```

Append as `&connection_limit=5` on `DATABASE_URL` if you add other query params.

### On your laptop (local dev + sync scripts)

**.env** (local app):

```env
DATABASE_URL="postgresql://postgres:password@localhost:5434/school_management?schema=school_sms"
NEXTAUTH_URL="http://localhost:3000"
AUTH_SECRET="your-local-secret"
```

**.env.render** (never commit — gitignored):

```env
# External Database URL only (from Postgres → Connections → External)
RENDER_DATABASE_URL="postgresql://USER:PASS@dpg-xxxxx-a.oregon-postgres.render.com/DATABASE?sslmode=require&schema=school_sms"
LOCAL_DATABASE_URL="postgresql://postgres:password@localhost:5434/school_management?schema=school_sms"
```

### What each deployed / local piece uses

| Component | Runs on | `DATABASE_URL` / DB connection |
|-----------|---------|--------------------------------|
| `npm run dev` | Laptop | Local Docker (`localhost:5434`) |
| `npm run db:deploy-render` | Laptop | `RENDER_DATABASE_URL` = **External** |
| Next.js app on Render | Render | **Internal** + `schema=school_sms` |
| Browser / users | Internet | No DB URL — only `https://your-app.onrender.com` |

### Linking DB in Render dashboard

1. **Postgres** service: note Internal + External URLs under **Connections**.
2. **Web Service** → **Environment** → add `DATABASE_URL` (Internal + `?schema=school_sms`), or link the database and edit the variable to append `schema=school_sms`.
3. Redeploy the web service after changing env vars.

Resume the Postgres instance in the Render dashboard if `pg_isready` fails.
