/**
 * Compare row counts: local Docker vs Render.
 * Run: npm run db:compare-render
 */
import { PrismaClient } from "@prisma/client";

const LOCAL_URL =
  process.env.LOCAL_DATABASE_URL ??
  "postgresql://postgres:password@localhost:5434/school_management?schema=school_sms";
const RENDER_URL = process.env.RENDER_DATABASE_URL;

if (!RENDER_URL) {
  console.error("Set RENDER_DATABASE_URL in .env.render");
  process.exit(1);
}

const tables = [
  "Branch",
  "User",
  "Student",
  "StaffProfile",
  "HrEmployee",
  "HrEmployeeDocument",
  "RegistrationRequest",
  "Payment",
  "HrDepartment",
  "HrRole",
] as const;

async function countTable(
  client: PrismaClient,
  table: (typeof tables)[number]
): Promise<number> {
  const rows = await client.$queryRawUnsafe<{ c: bigint }[]>(
    `SELECT COUNT(*)::bigint AS c FROM "${table}"`
  );
  return Number(rows[0]?.c ?? 0);
}

async function run() {
  const local = new PrismaClient({ datasources: { db: { url: LOCAL_URL } } });
  const render = new PrismaClient({ datasources: { db: { url: RENDER_URL } } });
  try {
    console.log("\nTable counts (local vs Render):\n");
    console.log("Table".padEnd(24), "Local".padStart(8), "Render".padStart(8), "Match");
    console.log("-".repeat(52));

    let allMatch = true;
    for (const table of tables) {
      const [a, b] = await Promise.all([
        countTable(local, table),
        countTable(render, table),
      ]);
      const ok = a === b;
      if (!ok) allMatch = false;
      console.log(
        table.padEnd(24),
        String(a).padStart(8),
        String(b).padStart(8),
        ok ? "✓" : "✗"
      );
    }

    console.log("");
    if (allMatch) {
      console.log("✓ Local and Render match.");
    } else {
      console.log("✗ Differences found. Run: npm run db:deploy-render");
      process.exitCode = 1;
    }
  } finally {
    await local.$disconnect();
    await render.$disconnect();
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
