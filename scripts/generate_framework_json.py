#!/usr/bin/env python3
"""Generate complete MOE 2017 inspection framework JSON and English markdown."""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from build_framework_2017 import (  # noqa: E402
    DOMAINS,
    INTRODUCTION,
    SECTIONS,
    STANDARD_SECTION,
    VERSION,
    build_markdown,
)
from framework_defs.standards_meta import STANDARD_META  # noqa: E402
from framework_defs.full_indicators import ALL_INDICATOR_SPECS  # noqa: E402


def build_lists() -> tuple[list, list, list]:
    standards = []
    for num, meta in sorted(STANDARD_META.items()):
        standards.append(
            {
                "number": num,
                "sectionCode": STANDARD_SECTION[num],
                "titleAm": meta["titleAm"],
                "titleEn": meta["titleEn"],
                "maxPoints": meta["maxPoints"],
            }
        )

    indicators = []
    criteria = []
    for spec in ALL_INDICATOR_SPECS:
        code = spec["code"]
        crits = spec["criteria"]
        n = len(crits)
        per = spec["maxPoints"] / n if n else spec["maxPoints"]
        indicators.append(
            {
                "code": code,
                "standardNumber": spec["standardNumber"],
                "titleAm": spec["titleAm"],
                "titleEn": spec["titleEn"],
                "maxPoints": spec["maxPoints"],
                "dataSources": spec.get("dataSources", ["DOCUMENT_REVIEW", "OBSERVATION", "INTERVIEW"]),
            }
        )
        for i, crit in enumerate(crits, 1):
            criteria.append(
                {
                    "indicatorCode": code,
                    "number": i,
                    "titleAm": crit["titleAm"],
                    "titleEn": crit["titleEn"],
                    "maxPoints": round(per, 4),
                }
            )
    return standards, indicators, criteria


def main() -> None:
    standards, indicators, criteria = build_lists()
    counts = {
        "standards": len(standards),
        "indicators": len(indicators),
        "criteria": len(criteria),
    }
    expected = {"standards": 28, "indicators": 100, "criteria": 304}
    for key, exp in expected.items():
        if counts[key] != exp:
            raise SystemExit(f"Count mismatch for {key}: got {counts[key]}, expected {exp}")

    data = {
        "version": VERSION,
        "introduction": INTRODUCTION,
        "domains": DOMAINS,
        "sections": SECTIONS,
        "standards": standards,
        "indicators": indicators,
        "criteria": criteria,
    }

    json_out = ROOT / "src/lib/inspection/framework-2017.json"
    md_out = ROOT / "docs/INSPECTION-CHECKLIST-EN-2017.md"
    json_out.parent.mkdir(parents=True, exist_ok=True)
    md_out.parent.mkdir(parents=True, exist_ok=True)

    with json_out.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")
    md_out.write_text(build_markdown(data), encoding="utf-8")

    print(f"Wrote {json_out}")
    print(f"Wrote {md_out}")
    print(f"Counts: {counts}")


if __name__ == "__main__":
    main()
