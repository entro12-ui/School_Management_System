# Internal Inspection Module — Integration Guide

## Overview

The Internal Inspection Checklist module implements the **Ministry of Education Ethiopia** framework for non-government primary and middle level schools (February 2025 G.C. / **2017 E.C.** source document).

The module is **additive**: it does not modify existing enrollment, finance, HR, or grading workflows.

## Framework structure (document-faithful)

| Level | Count | Source |
|-------|-------|--------|
| Standards | 28 | `src/lib/inspection/framework-2017.json` |
| Indicators | 100 | Generated from `scripts/framework_defs/full_indicators.py` |
| Criteria | 304 | Same generator |
| Scoring scale | 0–3 per criterion | MOE document |

Hierarchy: **Domain → Section → Standard → Indicator → Criteria**

Domains: Input (20%), Process (60%), Output (20%).

## Key paths

| Path | Role | Purpose |
|------|------|---------|
| `/branch/inspection` | `BRANCH_ADMIN` | Create sessions, history |
| `/branch/inspection/[runId]` | `BRANCH_ADMIN` | Checklist evaluation |
| `/branch/inspection/[runId]/report` | `BRANCH_ADMIN` | Director report view |
| `/admin/inspection` | `SUPER_ADMIN` | Cross-branch oversight |
| `/admin/inspection/[runId]` | `SUPER_ADMIN` | Review checklist |
| `/admin/inspection/[runId]?view=report` | `SUPER_ADMIN` | Ministry report + finalize |
| `GET /api/inspection/[runId]/export?format=html\|csv\|docx` | Branch admin / Super admin | Export reports |

## Data model

- `InspectionFrameworkVersion` — versioned framework snapshot (`MOE_NG_PRIMARY_MIDDLE_2017`)
- `InspectionRun` — one inspection session per school branch
- `InspectionCriterionScore` — score (0–3), comment per criterion
- `InspectionEvidence` — file or text evidence attachments

Framework JSON is seeded into the database on first inspection via `ensureInspectionFrameworkVersion()`. Historical runs keep their linked framework version for backward compatibility.

## Scoring logic

Located in `src/lib/inspection/scoring.ts`:

- Criterion earned = `(score / 3) × criterion.maxPoints`
- Indicator / standard / total scores are sums of criterion earned points
- Overall percent = `totalEarned / totalMax × 100`
- Auto-generated strengths/gaps use standard-level thresholds (≥75% strong, <50% gap)

## Regenerating framework from source documents

1. Update Python definitions in `scripts/framework_defs/`
2. Run: `python3 scripts/generate_framework_json.py`
3. Validates counts: 28 / 100 / 304
4. Outputs:
   - `src/lib/inspection/framework-2017.json`
   - `docs/INSPECTION-CHECKLIST-EN-2017.md`

New framework versions should use a new `version.code` in `build_framework_2017.py` and a new DB row — do not overwrite existing version rows.

## Database setup

```bash
npx prisma generate
npx prisma db push   # or migrate deploy in production
```

## Roles

| Role | Capabilities |
|------|----------------|
| `BRANCH_ADMIN` | Create/edit inspections, submit, view reports |
| `SUPER_ADMIN` | View all branches in org, finalize inspections, aggregated summary |
| Others | No access (middleware uses existing `/branch` and `/admin` gates) |

## Audit trail

Inspection create, submit, and finalize actions write to `AuditLog` with entity `InspectionRun`.

## Export formats

- **HTML** — print to PDF via browser
- **CSV** — spreadsheet summary
- **DOCX** — Word-compatible XML document

## Source documents

Original Amharic/PDF sources: `docs/Warka-Files/`
