import "server-only";

import frameworkJson from "./framework-2017.json";
import type { InspectionFramework } from "./types";

export function loadFrameworkFromFile(): InspectionFramework {
  return frameworkJson as InspectionFramework;
}
