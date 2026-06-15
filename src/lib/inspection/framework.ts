import type { InspectionCriterion, InspectionFramework } from "./types";

/** Display text for a criterion (handles legacy bad JSON where keys were stored as values). */
export function getCriterionDisplayTitle(criterion: InspectionCriterion): string {
  const en = criterion.titleEn?.trim();
  const am = criterion.titleAm?.trim();
  if (en && en !== "titleEn") return en;
  if (am && am !== "titleAm") return am;
  return `Criterion ${criterion.number}`;
}

export function getFrameworkCounts(framework: InspectionFramework) {
  return {
    standards: framework.standards.length,
    indicators: framework.indicators.length,
    criteria: framework.criteria.length,
  };
}

export function groupCriteriaByIndicator(framework: InspectionFramework) {
  const map = new Map<string, InspectionFramework["criteria"]>();
  for (const criterion of framework.criteria) {
    const list = map.get(criterion.indicatorCode) ?? [];
    list.push(criterion);
    map.set(criterion.indicatorCode, list);
  }
  for (const list of map.values()) {
    list.sort((a, b) => a.number - b.number);
  }
  return map;
}

export function groupIndicatorsByStandard(framework: InspectionFramework) {
  const map = new Map<number, InspectionFramework["indicators"]>();
  for (const indicator of framework.indicators) {
    const list = map.get(indicator.standardNumber) ?? [];
    list.push(indicator);
    map.set(indicator.standardNumber, list);
  }
  for (const list of map.values()) {
    list.sort((a, b) => {
      const [aMaj, aMin] = a.code.split(".").map(Number);
      const [bMaj, bMin] = b.code.split(".").map(Number);
      return aMaj !== bMaj ? aMaj - bMaj : aMin - bMin;
    });
  }
  return map;
}

export function getStandardDomainWeights(framework: InspectionFramework) {
  const sectionByStandard = new Map<number, string>();
  for (const standard of framework.standards) {
    sectionByStandard.set(standard.number, standard.sectionCode);
  }
  const sectionDomain = new Map(
    framework.sections.map((s) => [s.code, s.domainCode])
  );
  const domainMap = new Map(framework.domains.map((d) => [d.code, d]));
  return { sectionByStandard, sectionDomain, domainMap };
}
