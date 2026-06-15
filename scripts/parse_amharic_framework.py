#!/usr/bin/env python3
"""Parse MOE 2017 inspection checklist structure from extracted Amharic text."""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs/Warka-Files/extracted-amharic.txt"
OUT = ROOT / "scripts/parsed-framework-structure.json"

OCR_FIXES = (
    ("ሇ", "ላ"), ("ዯ", "ደ"), ("ፇ", "ፈ"), ("ሊ", "ላ"), ("አመሊካ", "አመሌካ"),
    ("አመሌክ", "አመሌካ"), ("ስታንዲርዴ", "ስታንዲርድ"), ("አንዯ", "አንደ"), ("መካከሇ", "መካከለ"),
    ("ዯረጃ", "ደረጃ"), ("ሇ", "ለ"), ("ቼክሉስት", "ቼክ-ሊስት"), ("መስፇር", "መስፈር"),
)


def fix_am(text: str) -> str:
    for old, new in OCR_FIXES:
        text = text.replace(old, new)
    return re.sub(r"\s+", " ", text).strip()


def parse() -> dict:
    raw = SOURCE.read_text(encoding="utf-8")
    lines = [fix_am(l.strip()) for l in raw.splitlines() if l.strip()]

    standards: dict[int, dict] = {}
    indicators: dict[str, dict] = {}
    current_std: int | None = None
    current_ind: str | None = None

    std_re = re.compile(
        r"ስታንዲርድ\s*(\d+)\s*[\.．]\s*(.+?)(?:/\s*([\d.]+)\s*/)?$",
        re.I,
    )
    ind_re = re.compile(
        r"አመሌ?[ካች]+[\s:፡-]*(\d+\.\d+)\.\s*(.+?)(?:/\s*([\d.]+)\s*/)?$",
    )
    ind_alt = re.compile(r"^(\d+\.\d+)\.\s*(.+?)(?:/\s*([\d.]+)\s*/)?$")
    ind_dot2 = re.compile(r"^\.2\.\s*(.+?)(?:/\s*([\d.]+)\s*/)?$")

    for line in lines:
        if "የአጠቃሊይ ትምህርት" in line and "ቼክ" in line:
            continue

        m = std_re.search(line)
        if m:
            num = int(m.group(1))
            title = m.group(2).strip()
            pts = float(m.group(3)) if m.group(3) else None
            standards[num] = {"number": num, "titleAm": title, "maxPoints": pts}
            current_std = num
            current_ind = None
            continue

        m = ind_re.search(line) or ind_alt.match(line)
        if m:
            code = m.group(1)
            if code == "7.1" and ".2." in raw:  # handle 7.2 separately
                pass
            title = m.group(2).strip()
            pts = float(m.group(3)) if m.group(3) else None
            std_num = int(code.split(".")[0])
            indicators[code] = {
                "code": code,
                "standardNumber": std_num,
                "titleAm": title,
                "maxPoints": pts,
                "criteriaAm": [],
            }
            current_ind = code
            current_std = std_num
            continue

        if current_ind == "7.1":
            m2 = ind_dot2.match(line)
            if m2:
                indicators["7.2"] = {
                    "code": "7.2",
                    "standardNumber": 7,
                    "titleAm": m2.group(1).strip(),
                    "maxPoints": float(m2.group(2)) if m2.group(2) else 0.5,
                    "criteriaAm": [],
                }
                current_ind = "7.2"
                continue

        # Numbered criterion lines (standalone digit at start of meaningful content)
        if current_ind and re.match(r"^[1-9]\d?$", line):
            continue  # skip bare numbers; criteria text follows on next lines

        # Multi-line criterion: lines with Amharic content while in indicator
        if current_ind and len(line) > 15 and not line.startswith("ስታንዲርድ"):
            if any(k in line for k in ["መጠይቅ", "ምልከታ", "ውይይት", "ሰነድ", "ኮምፒ", "7X", "4X", "ካ.ሜ"]):
                indicators[current_ind]["criteriaAm"].append(line)
            elif re.search(r"[\u1200-\u137f]{8,}", line):
                indicators[current_ind]["criteriaAm"].append(line)

    return {
        "standards": sorted(standards.values(), key=lambda x: x["number"]),
        "indicators": sorted(indicators.values(), key=lambda x: x["code"]),
    }


if __name__ == "__main__":
    data = parse()
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Standards: {len(data['standards'])}")
    print(f"Indicators: {len(data['indicators'])}")
    crit = sum(len(i['criteriaAm']) for i in data['indicators'])
    print(f"Criteria (parsed fragments): {crit}")
