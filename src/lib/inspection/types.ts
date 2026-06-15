export type InspectionScoringScale = {
  min: number;
  max: number;
  descriptionEn?: string;
};

export type InspectionFrameworkVersionMeta = {
  code: string;
  titleEn: string;
  titleAm: string;
  ethiopianCalendarYear: number;
  gregorianYear: number;
  monthEn?: string;
  monthAm?: string;
  publisherEn?: string;
  publisherAm?: string;
  scoringScale: InspectionScoringScale;
};

export type InspectionDomain = {
  code: string;
  titleEn: string;
  titleAm: string;
  weightPercent: number;
};

export type InspectionSection = {
  code: string;
  domainCode: string;
  titleEn: string;
  titleAm: string;
  weightPercent: number;
  standardNumbers: number[];
};

export type InspectionStandard = {
  number: number;
  sectionCode: string;
  titleAm: string;
  titleEn: string;
  maxPoints: number;
};

export type InspectionIndicator = {
  code: string;
  standardNumber: number;
  titleAm: string;
  titleEn: string;
  maxPoints: number;
  dataSources?: string[];
};

export type InspectionCriterion = {
  indicatorCode: string;
  number: number;
  titleAm: string;
  titleEn: string;
  maxPoints: number;
};

export type InspectionFramework = {
  version: InspectionFrameworkVersionMeta;
  introduction: { contentAm: string; contentEn: string };
  domains: InspectionDomain[];
  sections: InspectionSection[];
  standards: InspectionStandard[];
  indicators: InspectionIndicator[];
  criteria: InspectionCriterion[];
};

export type CriterionScoreInput = {
  criterionKey: string;
  indicatorCode: string;
  criterionNumber: number;
  score: number | null;
  comment?: string | null;
};

export type IndicatorScoreSummary = {
  code: string;
  standardNumber: number;
  titleEn: string;
  titleAm: string;
  maxPoints: number;
  earnedPoints: number;
  scoredCount: number;
  totalCriteria: number;
};

export type StandardScoreSummary = {
  number: number;
  titleEn: string;
  titleAm: string;
  maxPoints: number;
  earnedPoints: number;
  scoredCount: number;
  totalCriteria: number;
};

export type DomainScoreSummary = {
  code: string;
  titleEn: string;
  titleAm: string;
  weightPercent: number;
  maxPoints: number;
  earnedPoints: number;
  percent: number;
};

export type InspectionScoreSummary = {
  totalEarned: number;
  totalMax: number;
  overallPercent: number;
  scoredCriteria: number;
  totalCriteria: number;
  standards: StandardScoreSummary[];
  domains: DomainScoreSummary[];
};

export type InspectionRunListItem = {
  id: string;
  branchId: string;
  branchName: string;
  inspectionDate: string;
  status: string;
  schoolLevel: string;
  overallPercent: number | null;
  totalScore: number | null;
  maxScore: number | null;
  inspectorName: string;
  academicYearName: string | null;
  frameworkCode: string;
  createdAt: string;
};

export function buildCriterionKey(indicatorCode: string, criterionNumber: number): string {
  return `${indicatorCode}.${criterionNumber}`;
}
