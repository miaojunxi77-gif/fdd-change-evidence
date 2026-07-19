#!/usr/bin/env python3
"""Build the compact, browser-facing cross-period evidence dataset."""

from __future__ import annotations

import argparse
import json
import math
import ntpath
from pathlib import Path

import pandas as pd


def value(value, default=None):
    if value is None:
        return default
    try:
        if pd.isna(value):
            return default
    except (TypeError, ValueError):
        pass
    return value


def integer(raw, default=None):
    cleaned = value(raw)
    if cleaned is None:
        return default
    try:
        if pd.isna(cleaned):
            return default
    except (TypeError, ValueError):
        pass
    try:
        return int(float(cleaned))
    except (TypeError, ValueError):
        return default


def number(raw, default=None):
    raw = value(raw, default)
    if raw is None:
        return None
    try:
        result = float(raw)
    except (TypeError, ValueError):
        return default
    return result if math.isfinite(result) else default


def boolean(raw) -> bool:
    raw = value(raw, False)
    if isinstance(raw, str):
        return raw.strip().lower() in {"1", "true", "yes", "y"}
    return bool(raw)


def text(raw, default="") -> str:
    raw = value(raw, default)
    return str(raw).strip() if raw is not None else default


def document_name(raw) -> str:
    return ntpath.basename(text(raw))


def parse_evidence(raw):
    raw = value(raw)
    if raw is None or not str(raw).strip():
        return []
    try:
        entries = json.loads(str(raw))
    except json.JSONDecodeError:
        return []
    output = []
    for entry in entries if isinstance(entries, list) else []:
        quote = text(entry.get("quote"))
        if not quote:
            continue
        output.append(
            {
                "quote": quote,
                "page": integer(entry.get("page_verified"), integer(entry.get("page_claimed"))),
                "claimedPage": integer(entry.get("page_claimed")),
                "verified": boolean(entry.get("quote_verified")),
                "method": text(entry.get("verification_method")),
            }
        )
    return output


def page_range(row, side):
    start = integer(row.get(f"{side}_start_page"))
    end = integer(row.get(f"{side}_end_page"))
    return [start, end]


def build_row(row, route, replacement_prefix):
    return {
        "id": text(row.get("analysis_id")),
        "route": route,
        "pairId": text(row.get("pair_id")),
        "company": text(row.get("chain_name"), "Unknown company"),
        "oldYear": integer(row.get("year_old")),
        "newYear": integer(row.get("year_new")),
        "yearGap": integer(row.get("year_gap")),
        "oldSource": text(row.get("source_old")),
        "newSource": text(row.get("source_new")),
        "sameSource": boolean(row.get("same_source")),
        "item": integer(row.get("item_num")),
        "itemTitle": text(row.get("item_title")),
        "score": integer(row.get("score_0_5"), 0),
        "substantive": boolean(row.get("substantive_change")),
        "contractual": boolean(row.get("contractual_change")),
        "routine": boolean(row.get("routine_annual_update")),
        "direction": text(row.get("direction"), "unknown"),
        "summary": text(row.get("summary"), "No model summary was recorded."),
        "statedReason": text(row.get("stated_change_reason")),
        "confidence": text(row.get("confidence")),
        "needsReview": boolean(row.get("needs_human_review")),
        "reviewReason": text(row.get("review_reason")),
        "evidenceStatus": text(row.get("evidence_status")),
        "evidenceGatePass": boolean(row.get("evidence_gate_pass")),
        "oldDocument": document_name(row.get("old_document_path")),
        "newDocument": document_name(row.get("new_document_path")),
        "oldPages": page_range(row, "old"),
        "newPages": page_range(row, "new"),
        "oldEvidence": parse_evidence(row.get("old_evidence_json")),
        "newEvidence": parse_evidence(row.get("new_evidence_json")),
        "samplingWeight": number(row.get("sampling_weight")),
        "samplingStratum": text(row.get("sampling_stratum")),
        "inSbaDirectory": boolean(row.get("in_sba_directory")),
        "replacement": boolean(row.get(f"{replacement_prefix}_item_is_replacement")),
        "replacementLevel": text(row.get(f"{replacement_prefix}_replacement_level")),
        "financingGuardrailPass": boolean(row.get("financing_guardrail_pass")),
        "financingWarnings": text(row.get("financing_guardrail_warnings_json")),
        "scoringSource": text(row.get("scoring_source")),
        "model": text(row.get("model")),
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("input_csv", type=Path)
    parser.add_argument("output_json", type=Path)
    parser.add_argument("--route", choices=["consecutive", "cross-period"], default="cross-period")
    parser.add_argument("--design", default="item-by-item quality-screened comparisons")
    parser.add_argument("--replacement-prefix", choices=["shen", "tang"], default="tang")
    args = parser.parse_args()

    frame = pd.read_csv(args.input_csv, low_memory=False)
    rows = [build_row(row, args.route, args.replacement_prefix) for row in frame.to_dict(orient="records")]
    rows.sort(key=lambda row: (row["item"], row["company"].casefold(), row["oldYear"], row["newYear"]))

    payload = {
        "metadata": {
            "route": args.route,
            "design": args.design,
            "comparisons": len(rows),
            "uniquePairs": len({row["pairId"] for row in rows}),
            "items": sorted({row["item"] for row in rows}),
            "rowsPerItem": {str(item): sum(row["item"] == item for row in rows) for item in sorted({row["item"] for row in rows})},
            "includesNoChange": True,
            "source": args.input_csv.name,
        },
        "rows": rows,
    }
    args.output_json.parent.mkdir(parents=True, exist_ok=True)
    args.output_json.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(json.dumps(payload["metadata"], ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
