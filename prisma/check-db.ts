/**
 * Test database connectivity. Run: npm run db:check
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function maskUrl(url: string) {
  return url.replace(/:([^:@/]+)@/, ":****@");
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set. Copy .env.example to .env and configure it.");
    process.exit(1);
  }

  console.log("Target:", maskUrl(url));

  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    const branches = await prisma.branch.count();
    console.log("✓ Database is reachable.");
    console.log(`  Branches in DB: ${branches}`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("\n✗ Cannot connect to PostgreSQL.\n");
    console.error(msg);
    console.error(`
Common fixes:

  1. Render (cloud) — open https://dashboard.render.com
     • Select your PostgreSQL instance
     • If status is "Suspended", click Resume / wake it (free tier sleeps)
     • Copy **External Database URL** into .env as DATABASE_URL
     • Include: ?sslmode=require&schema=school_sms

  2. Local Postgres (works offline)
     docker compose up -d
     DATABASE_URL="postgresql://postgres:password@localhost:5432/school_management?schema=school_sms"
     npm run db:push
     npm run db:seed

  3. Test again: npm run db:check
`);
    process.exit(1);
  }
}

main().finally(() => prisma.$disconnect());
