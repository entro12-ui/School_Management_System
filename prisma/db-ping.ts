/**
 * Measure round-trip latency to PostgreSQL.
 * Run: npm run db:ping
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function timed(label: string, fn: () => Promise<unknown>) {
  const start = performance.now();
  await fn();
  const ms = Math.round(performance.now() - start);
  console.log(`  ${label}: ${ms} ms`);
  return ms;
}

async function main() {
  const url = process.env.DATABASE_URL ?? "";
  const host = url.match(/@([^/]+)/)?.[1] ?? "unknown";
  console.log(`Database host: ${host}\n`);

  await timed("Connect + SELECT 1", () => prisma.$queryRaw`SELECT 1`);

  const times: number[] = [];
  for (let i = 1; i <= 5; i++) {
    const ms = await timed(`Query ${i} (branch count)`, () => prisma.branch.count());
    times.push(ms);
  }

  const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
  console.log(`\nAverage query latency: ${avg} ms`);

  if (avg > 300) {
    console.log(`
⚠ High latency is usually caused by:
  • Cloud DB far from you (e.g. Render US + user in Ethiopia ≈ 200–500 ms per query)
  • Render free tier waking from sleep (first request can take 10–30+ seconds)
  • Many sequential queries per page (each adds one round trip)

Faster options for development:
  • docker compose up -d  then use local DATABASE_URL (see .env.example)
  • Keep Render DB awake (paid plan) or accept cold starts on free tier
`);
  } else {
    console.log("\n✓ Latency looks reasonable for your network.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
