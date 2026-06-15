#!/usr/bin/env python3
"""Build MOE NG Primary/Middle Internal Inspection Framework 2017 JSON and English MD."""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
AMHARIC_SOURCE = ROOT / "docs/Warka-Files/extracted-amharic.txt"
JSON_OUT = ROOT / "src/lib/inspection/framework-2017.json"
MD_OUT = ROOT / "docs/INSPECTION-CHECKLIST-EN-2017.md"

# ---------------------------------------------------------------------------
# Metadata
# ---------------------------------------------------------------------------

VERSION = {
    "code": "MOE_NG_PRIMARY_MIDDLE_2017",
    "titleEn": "Internal Inspection Checklist for Primary and Middle Level Non-Government Schools",
    "titleAm": "የአንደኛ እና መካከለኛ ደረጃ መንግስታዊ ያልሆኑ ትምህርት ቤት ውስጣዊ ኢንስፔክሽን ቼክ-ሊስት",
    "ethiopianCalendarYear": 2017,
    "gregorianYear": 2025,
    "monthEn": "February",
    "monthAm": "ካቲት",
    "publisherEn": "Ministry of Education, Ethiopia",
    "publisherAm": "ትምህርት ሚኒስቴር",
    "scoringScale": {"min": 0, "max": 3, "descriptionEn": "Performance rating per criterion: 0–3"},
}

INTRODUCTION = {
    "contentAm": (
        "ለአንደኛ እና መካከለኛ ደረጃ ት/ቤቶች በግብአት፣ ሂደት እና ውጤትን መሰረት በማድረግ "
        "ከተዘጋጁት 28 ስታንዲርድች፣ በስራቸው ከሚገኙ 100 አመሌካቾች እና 304 መስፈርቶችን "
        "በመጠቀም መዝኖ ያለባቸውን ክፍተቶች በመለየት ተገቢውን ድጋፍ ለማድረግ እና "
        "ጠንካራ አፈፃፀማቸውን ይበልጥ አጠናክረው እንዲቀጥለ ለማስቻል ከትምህርት ተቋማቱ "
        "ወቅታዊ እና ተአማኒነት ያለው መረጃ ማሰባሰብ ተገቢ ይሆናል። "
        "በዚሁ መሰረት ሁለም መንግስታዊ ያልሆኑ አንደኛ እና መካከለኛ ደረጃ ትምህርት ቤቶች "
        "ከሶስቱ መለኪያዎች አንፃር የአፈጻጸም ብቃታቸውን በመገምገም ደረጃ ለመስጠትና ከዚሁ "
        "ጎን ለጎን ጠንካራ አፈጻጸማቸውን እና መሻሻል የሚገባቸውን ጉዳዮች በመለየት "
        "ለትምህርት ተቋማቱና ለሚመለከታቸው ባለድርሻ አካሊት ግብረ-መልስ ለመስጠት "
        "ያስችላል።"
    ),
    "contentEn": (
        "For primary and middle level schools, collecting timely and reliable information "
        "from the institution using 28 standards, 100 indicators, and 304 criteria—organized "
        "under Input, Process, and Output—is essential to identify gaps, provide appropriate "
        "support, strengthen existing good practices, and sustain improvement. On this basis, "
        "non-government primary and middle schools can be rated against the three domains, "
        "recognize strengths alongside areas for improvement, and provide feedback to the "
        "institution and relevant stakeholders."
    ),
}

DOMAINS = [
    {"code": "INPUT", "titleEn": "Input", "titleAm": "ግብዓት", "weightPercent": 20},
    {"code": "PROCESS", "titleEn": "Process", "titleAm": "ሂደት", "weightPercent": 60},
    {"code": "OUTPUT", "titleEn": "Output", "titleAm": "ውጤት", "weightPercent": 20},
]

SECTIONS = [
    {
        "code": "INPUT_FACILITIES",
        "domainCode": "INPUT",
        "titleEn": "Facilities and Infrastructure",
        "titleAm": "ፊሲሊቲ እና መሰረተ ልማት",
        "weightPercent": 8,
        "standardNumbers": [1, 2],
    },
    {
        "code": "INPUT_ENVIRONMENT",
        "domainCode": "INPUT",
        "titleEn": "Comfortable Environment",
        "titleAm": "ምቹ አካባቢ",
        "weightPercent": 4,
        "standardNumbers": [3, 4],
    },
    {
        "code": "INPUT_FINANCE_HR",
        "domainCode": "INPUT",
        "titleEn": "Finance and Human Resources",
        "titleAm": "ፊይናንስና የሰው ሃይል",
        "weightPercent": 8,
        "standardNumbers": [5, 6],
    },
    {
        "code": "PROCESS_LEADERSHIP",
        "domainCode": "PROCESS",
        "titleEn": "School Leadership and Administration — Leadership Capacity",
        "titleAm": "የትምህርትቤት አመራርና አስተዳደር — የመምራት ብቃት",
        "weightPercent": 10,
        "standardNumbers": [7, 8, 9, 10],
    },
    {
        "code": "PROCESS_TEACHING_MOTIVATION",
        "domainCode": "PROCESS",
        "titleEn": "Teaching Process and Motivation",
        "titleAm": "የማስተማር ሂደት እና ተነሳሽነት",
        "weightPercent": 8,
        "standardNumbers": [11, 12],
    },
    {
        "code": "PROCESS_ADMINISTRATION",
        "domainCode": "PROCESS",
        "titleEn": "School Administration",
        "titleAm": "የት/ቤት አስተዳደር",
        "weightPercent": 5,
        "standardNumbers": [13, 14],
    },
    {
        "code": "PROCESS_LEARNING",
        "domainCode": "PROCESS",
        "titleEn": "Teaching and Learning — Learning",
        "titleAm": "መማር ማስተማር — መማር",
        "weightPercent": 5,
        "standardNumbers": [15],
    },
    {
        "code": "PROCESS_TEACHING",
        "domainCode": "PROCESS",
        "titleEn": "Teaching",
        "titleAm": "ማስተማር",
        "weightPercent": 11,
        "standardNumbers": [16, 17, 18],
    },
    {
        "code": "PROCESS_COLLABORATION",
        "domainCode": "PROCESS",
        "titleEn": "Collaborative Work",
        "titleAm": "በትብብር መስራት",
        "weightPercent": 6,
        "standardNumbers": [19, 20],
    },
    {
        "code": "PROCESS_COMMUNITY",
        "domainCode": "PROCESS",
        "titleEn": "School, Parent and Community Relations and Partnership",
        "titleAm": "የት/ቤት፣ የወላጅ እና ማህ/ሰብ ግንኙነትና አጋርነት",
        "weightPercent": 10,
        "standardNumbers": [21, 22, 23, 24],
    },
    {
        "code": "OUTPUT_PARTICIPATION",
        "domainCode": "OUTPUT",
        "titleEn": "Quality Education Participation",
        "titleAm": "ያደገ የትምህርት ተሳትፎ",
        "weightPercent": 13,
        "standardNumbers": [25, 26],
    },
    {
        "code": "OUTPUT_CULTURE",
        "domainCode": "OUTPUT",
        "titleEn": "Improved School Culture",
        "titleAm": "የተሸሻለ የት/ቤት ባህል",
        "weightPercent": 7,
        "standardNumbers": [27, 28],
    },
]

STANDARD_SECTION = {}
for sec in SECTIONS:
    for n in sec["standardNumbers"]:
        STANDARD_SECTION[n] = sec["code"]

# ---------------------------------------------------------------------------
# Bilingual framework content (standards → indicators → criteria)
# Each criterion maxPoints defaults to indicator weight / criterion count logic;
# official doc uses fractional indicator weights; criteria within an indicator
# typically share equal weight unless specified.
# ---------------------------------------------------------------------------

def ds(*sources: str) -> list[str]:
    return list(sources)


def load_framework_content() -> tuple[list, list, list]:
    """Return (standards, indicators, criteria) with bilingual titles."""
    from inspection_framework_content import STANDARDS, INDICATORS, CRITERIA  # noqa: WPS433

    return STANDARDS, INDICATORS, CRITERIA


def attach_section_codes(standards: list) -> None:
    for s in standards:
        s["sectionCode"] = STANDARD_SECTION[s["number"]]


def attach_indicator_meta(indicators: list) -> None:
    for ind in indicators:
        if "dataSources" not in ind:
            ind["dataSources"] = infer_data_sources(ind.get("titleAm", "") + ind.get("titleEn", ""))


def infer_data_sources(text: str) -> list[str]:
    text_l = text.lower()
    sources = []
    if any(k in text_l for k in ["document", "ሰነዴ", "record", "finance", "budget", "report"]):
        sources.append("DOCUMENT_REVIEW")
    if any(k in text_l for k in ["observation", "ምልከታ", "visit", "classroom", "compound"]):
        sources.append("OBSERVATION")
    if any(k in text_l for k in ["interview", "discussion", "question", "መጠይቅ", "ውይይት", "parents"]):
        sources.append("INTERVIEW")
    if not sources:
        sources = ["DOCUMENT_REVIEW", "OBSERVATION", "INTERVIEW"]
    return sources


def build_json() -> dict:
    standards, indicators, criteria = load_framework_content()
    attach_section_codes(standards)
    attach_indicator_meta(indicators)

    return {
        "version": VERSION,
        "introduction": INTRODUCTION,
        "domains": DOMAINS,
        "sections": SECTIONS,
        "standards": standards,
        "indicators": indicators,
        "criteria": criteria,
    }


def build_markdown(data: dict) -> str:
    lines = [
        "# Internal Inspection Checklist — English Translation (2017 E.C. / 2025 G.C.)",
        "",
        f"**{data['version']['titleEn']}**",
        "",
        f"Publisher: {data['version']['publisherEn']} | "
        f"{data['version']['monthEn']} {data['version']['gregorianYear']} "
        f"({data['version']['monthAm']} {data['version']['ethiopianCalendarYear']} E.C.)",
        "",
        f"Framework code: `{data['version']['code']}`",
        "",
        f"Scoring: {data['version']['scoringScale']['descriptionEn']}",
        "",
        "## Introduction",
        "",
        data["introduction"]["contentEn"],
        "",
        "## Framework Structure",
        "",
        "| Domain | Weight | Sections |",
        "|--------|--------|----------|",
    ]

    section_by_domain: dict[str, list] = {}
    for sec in data["sections"]:
        section_by_domain.setdefault(sec["domainCode"], []).append(sec)

    for dom in data["domains"]:
        sec_list = section_by_domain.get(dom["code"], [])
        sec_text = "; ".join(f"{s['titleEn']} ({s['weightPercent']}%)" for s in sec_list)
        lines.append(f"| {dom['titleEn']} | {dom['weightPercent']}% | {sec_text} |")

    lines.extend(["", "---", ""])

    std_map = {s["number"]: s for s in data["standards"]}
    ind_by_std: dict[int, list] = {}
    for ind in data["indicators"]:
        ind_by_std.setdefault(ind["standardNumber"], []).append(ind)

    crit_by_ind: dict[str, list] = {}
    for c in data["criteria"]:
        crit_by_ind.setdefault(c["indicatorCode"], []).append(c)

    for sec in data["sections"]:
        lines.extend([
            f"## {sec['titleEn']} ({sec['weightPercent']}%)",
            "",
            f"*Amharic: {sec['titleAm']}*",
            "",
        ])
        for num in sec["standardNumbers"]:
            std = std_map[num]
            lines.extend([
                f"### Standard {num}: {std['titleEn']}",
                "",
                f"*{std['titleAm']}* — **{std['maxPoints']} points**",
                "",
            ])
            for ind in sorted(ind_by_std.get(num, []), key=lambda x: x["code"]):
                lines.extend([
                    f"#### Indicator {ind['code']}: {ind['titleEn']}",
                    "",
                    f"*{ind['titleAm']}* — **{ind['maxPoints']} points**",
                    "",
                    f"Data sources: {', '.join(ind['dataSources'])}",
                    "",
                ])
                for crit in sorted(crit_by_ind.get(ind["code"], []), key=lambda x: x["number"]):
                    lines.extend([
                        f"- **{ind['code']}.{crit['number']}** {crit['titleEn']}",
                        f"  - *{crit['titleAm']}* ({crit['maxPoints']} pt)",
                    ])
                lines.append("")

    lines.extend([
        "---",
        "",
        "## Summary Counts",
        "",
        f"- Standards: **{len(data['standards'])}**",
        f"- Indicators: **{len(data['indicators'])}**",
        f"- Criteria: **{len(data['criteria'])}**",
        "",
    ])
    return "\n".join(lines)


def main() -> None:
    data = build_json()
    counts = {
        "standards": len(data["standards"]),
        "indicators": len(data["indicators"]),
        "criteria": len(data["criteria"]),
    }
    expected = {"standards": 28, "indicators": 100, "criteria": 304}
    for key, exp in expected.items():
        if counts[key] != exp:
            raise SystemExit(f"Count mismatch for {key}: got {counts[key]}, expected {exp}")

    JSON_OUT.parent.mkdir(parents=True, exist_ok=True)
    MD_OUT.parent.mkdir(parents=True, exist_ok=True)

    with JSON_OUT.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")

    MD_OUT.write_text(build_markdown(data), encoding="utf-8")

    print(f"Wrote {JSON_OUT}")
    print(f"Wrote {MD_OUT}")
    print(f"Counts: {counts}")


if __name__ == "__main__":
    main()
