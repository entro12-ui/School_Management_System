import "server-only";

import { readFileSync } from "fs";
import path from "path";
import type { InspectionFramework } from "./types";

const FRAMEWORK_PATH = path.join(
  process.cwd(),
  "src/lib/inspection/framework-2017.json"
);

let cachedFramework: InspectionFramework | null = null;

export function loadFrameworkFromFile(): InspectionFramework {
  if (cachedFramework) return cachedFramework;
  const raw = readFileSync(FRAMEWORK_PATH, "utf-8");
  cachedFramework = JSON.parse(raw) as InspectionFramework;
  return cachedFramework;
}
