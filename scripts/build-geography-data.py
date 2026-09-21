#!/usr/bin/env python3
"""Build compact, validated static data for the Item 20 geography page."""

import csv
import hashlib
import json
import os
from collections import Counter, defaultdict
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(
    os.environ.get(
        "ITEM20_SOURCE_DIR",
        ROOT.parent / "item20_outputs_v1" / "item20_canonical_outputs_v1",
    )
)
PACKAGE = Path(
    os.environ.get(
        "ITEM20_PACKAGE_PATH",
        ROOT.parent / "upload" / "Item20_Canonical_Geography_Outputs_v1.zip",
    )
)
OUT = ROOT / "public" / "data" / "item20-geography"
OUT.mkdir(parents=True, exist_ok=True)


def rows(name):
    with (SOURCE / name).open("r", encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def num(value):
    if value in (None, ""):
        return None
    try:
        value = float(value)
        return int(value) if value.is_integer() else value
    except (TypeError, ValueError):
        return value


def truthy(value):
    return str(value).strip().lower() in {"1", "1.0", "true", "yes"}


def ratio(numerator, denominator):
    return numerator / denominator if denominator else None


def counter_rows(counter, total, key_name):
    return [
        {key_name: key or "(blank)", "count": count, "share": ratio(count, total)}
        for key, count in counter.most_common()
    ]


metrics = rows("summary_metrics.csv")
quartiles = rows("size_quartile_geography.csv")
risk = rows("risk_score_geography_descriptive.csv")
states = rows("latest_snapshot_state_totals.csv")
geography = rows("canonical_geography_brand_year.csv")
rankings = rows("canonical_state_rankings.csv")
colocation = rows("company_franchise_colocation.csv")
merged = rows("item10_item20_merged.csv")
linkage = rows("document_linkage_audit.csv")
missing = rows("missing_fdd_audit_v1.csv")

strict_franchise = [
    row
    for row in geography
    if (num(row["franchise_total_outlets"]) or 0) > 0
    and not truthy(row["franchise_geo_conflict"])
]
strict_company = [
    row
    for row in geography
    if (num(row["company_total_outlets"]) or 0) > 0
    and not truthy(row["company_geo_conflict"])
]


def primary_state_rows(source_rows, state_field, top1_field, top2_field):
    counts = Counter(row[state_field] for row in source_rows if row[state_field])
    tied = sum(
        1
        for row in source_rows
        if num(row[top1_field]) is not None
        and num(row[top1_field]) == num(row[top2_field])
    )
    return {
        "observations": len(source_rows),
        "tiedTopObservations": tied,
        "tiedTopShare": ratio(tied, len(source_rows)),
        "states": [
            {"state": state, "count": count, "share": ratio(count, len(source_rows))}
            for state, count in counts.most_common()
        ],
    }


official_geo_linkage = {
    "NASAA": 1.000,
    "CA": 0.934,
    "MN": 0.935,
    "WI": 0.943,
    "NASAA_NON_SBA": 0.891,
}
linkage_by_source = []
for source in ["NASAA", "CA", "MN", "WI", "NASAA_NON_SBA"]:
    source_rows = [row for row in linkage if row["source"] == source]
    linked = sum(bool(row["canonical_chain_id"]) for row in source_rows)
    linkage_by_source.append(
        {
            "source": source,
            "documents": len(source_rows),
            "linkedDocuments": linked,
            "overallLinkRate": ratio(linked, len(source_rows)),
            "approxGeoOutputLinkRate": official_geo_linkage[source],
        }
    )

stage_fields = [
    ("Expected unified-panel chain-years", "expected_in_unified_panel"),
    ("Raw FDD available", "has_raw_FDD"),
    ("Safely linked TXT", "has_TXT"),
    ("Item 10 found", "item10_found"),
    ("Identity resolved", "identity_resolved"),
    ("In Item 10 V1.2", "in_V1.2_panel"),
    ("Paper-ready", "paper_ready"),
]
missing_stages = [
    {
        "label": label,
        "field": field,
        "count": sum(truthy(row[field]) for row in missing),
        "share": ratio(sum(truthy(row[field]) for row in missing), len(missing)),
    }
    for label, field in stage_fields
]

catalog_descriptions = {
    "canonical_geography_brand_year.csv": "One row per canonical system × FDD year, including franchise/company availability, Top-1/2/3, totals, state counts, reconciliation and co-location fields.",
    "canonical_state_rankings.csv": "Every positive state row for the selected Table 3 or Table 4 geography observation; the complete Top-1 / each-state outlet detail.",
    "company_franchise_colocation.csv": "Same-outlet-year overlap between franchised and company-owned state footprints.",
    "document_linkage_audit.csv": "Document-level canonical-link audit with source, method, score and Item 20 / Item 10 extraction status.",
    "item10_item20_merged.csv": "Exact canonical ID × FDD year merge of Item 10 Production V1.2 and Item 20 geography.",
    "latest_snapshot_state_totals.csv": "All-state aggregate from each system's latest strict positive franchised snapshot.",
    "missing_fdd_audit_v1.csv": "Unified-panel chain-year funnel covering raw FDD, TXT, identity, Item 10 V1.2 and paper-ready status.",
    "risk_score_geography_descriptive.csv": "Unadjusted geography descriptives for Item 10 RiskScore 0–4.",
    "size_quartile_geography.csv": "Geographic concentration by franchised-outlet size quartile.",
    "summary_metrics.csv": "Nineteen headline coverage, concentration, company-owned and co-location metrics.",
}
loaded_tables = {
    "canonical_geography_brand_year.csv": geography,
    "canonical_state_rankings.csv": rankings,
    "company_franchise_colocation.csv": colocation,
    "document_linkage_audit.csv": linkage,
    "item10_item20_merged.csv": merged,
    "latest_snapshot_state_totals.csv": states,
    "missing_fdd_audit_v1.csv": missing,
    "risk_score_geography_descriptive.csv": risk,
    "size_quartile_geography.csv": quartiles,
    "summary_metrics.csv": metrics,
}
catalog = []
for filename, table_rows in loaded_tables.items():
    catalog.append(
        {
            "file": filename,
            "rows": len(table_rows),
            "columns": len(table_rows[0]) if table_rows else 0,
            "description": catalog_descriptions[filename],
        }
    )

ranking_counts = Counter(row["table_type"] for row in rankings)
ranking_observations = Counter(
    (row["canonical_chain_id"], row["fdd_year"], row["table_type"])
    for row in rankings
)
missing_name_rows = sum(not row["chain_name"] for row in geography)
missing_name_ids = len({row["canonical_chain_id"] for row in geography if not row["chain_name"]})
name_to_ids = defaultdict(set)
for row in geography:
    if row["chain_name"]:
        name_to_ids[row["chain_name"]].add(row["canonical_chain_id"])

summary = {
    "metrics": [{**row, "value": num(row["value"])} for row in metrics],
    "quartiles": [{key: num(value) for key, value in row.items()} for row in quartiles],
    "risk": [{key: num(value) for key, value in row.items()} for row in risk],
    "states": [{key: num(value) for key, value in row.items()} for row in states],
    "primaryState": primary_state_rows(
        strict_franchise,
        "franchise_top1_state",
        "franchise_top1_outlets",
        "franchise_top2_outlets",
    ),
    "companyPrimaryState": primary_state_rows(
        strict_company,
        "company_top1_state",
        "company_top1_outlets",
        "company_top2_outlets",
    ),
    "linkageBySource": linkage_by_source,
    "item20Statuses": counter_rows(Counter(row["item20_status"] for row in linkage), len(linkage), "status"),
    "linkMethods": counter_rows(Counter(row["link_method"] for row in linkage), len(linkage), "method"),
    "missingAudit": {
        "total": len(missing),
        "stages": missing_stages,
        "reasons": counter_rows(Counter(row["missing_reason"] for row in missing), len(missing), "reason"),
    },
    "catalog": catalog,
    "counts": {
        "canonicalBrandYears": len(geography),
        "stateRankingRows": len(rankings),
        "franchiseRankingRows": ranking_counts["T3_FRANCHISED"],
        "companyRankingRows": ranking_counts["T4_COMPANY"],
        "rankingObservations": len(ranking_observations),
        "colocationRows": len(colocation),
        "item10MergedRows": len(merged),
        "documentAuditRows": len(linkage),
        "missingAuditRows": len(missing),
        "uniqueChains": len({row["canonical_chain_id"] for row in geography}),
    },
    "quality": {
        "canonicalRowsAfter2026": sum((num(row["fdd_year"]) or 0) > 2026 for row in geography),
        "linkageRowsAfter2026": sum((num(row["fdd_year"]) or 0) > 2026 for row in linkage),
        "linkageRowsMissingYear": sum(not row["fdd_year"] for row in linkage),
        "missingNameRows": missing_name_rows,
        "missingNameCanonicalIds": missing_name_ids,
        "nonUniqueDisplayNames": sum(len(ids) > 1 for ids in name_to_ids.values()),
    },
}

SUMMARY_FIELDS = [
    field
    for field in geography[0].keys()
    if field not in {"canonical_chain_id", "chain_name", "fdd_year"}
]
ITEM10_FIELDS = [
    "risk_score",
    "paper_ready",
    "score_status",
    "item10_sources",
    "financing_forms",
    "providers",
    "purposes",
    "evidence_excerpt",
    "v1_2_qc_status",
    "v1_2_resolution_rule",
    "offering_split_flag",
    "documents",
    "unique_item10_versions",
    "full_item10_text_available",
]
COLOCATION_FIELDS = [
    "outlet_data_year",
    "franchised_total",
    "company_total",
    "franchise_states",
    "company_states",
    "franchise_outlets_in_company_states",
    "franchise_colocation_share",
    "company_outlets_in_franchise_states",
    "company_colocation_share",
    "geo_conflict",
    "item10_paper_ready",
    "risk_score",
]
summary["detailSchema"] = {
    "summary": SUMMARY_FIELDS,
    "item10": ITEM10_FIELDS,
    "colocation": COLOCATION_FIELDS,
    "ranking": ["state", "outlets", "share"],
}

merged_by_key = {(row["canonical_chain_id"], row["year"]): row for row in merged}
colocation_by_key = defaultdict(list)
for row in colocation:
    colocation_by_key[(row["canonical_chain_id"], row["fdd_year"])].append(row)

years_by_chain = defaultdict(set)
names = {}
details = defaultdict(lambda: defaultdict(dict))

for row in geography:
    canonical_id, year = row["canonical_chain_id"], row["fdd_year"]
    names[canonical_id] = row["chain_name"] or canonical_id
    years_by_chain[canonical_id].add(year)
    payload = {"s": [num(row[field]) for field in SUMMARY_FIELDS]}
    item10 = merged_by_key.get((canonical_id, year))
    if item10:
        payload["i"] = [num(item10.get(field)) for field in ITEM10_FIELDS]
    overlap = colocation_by_key.get((canonical_id, year), [])
    if overlap:
        payload["o"] = [
            [num(match.get(field)) for field in COLOCATION_FIELDS] for match in overlap
        ]
    details[canonical_id][year] = payload

for row in rankings:
    canonical_id, year = row["canonical_chain_id"], row["fdd_year"]
    names.setdefault(canonical_id, row["chain_name"] or canonical_id)
    years_by_chain[canonical_id].add(year)
    key = "f" if row["table_type"] == "T3_FRANCHISED" else "c"
    details[canonical_id][year].setdefault(key, []).append(
        [row["state"], num(row["outlets_end"]), num(row["state_share"]), num(row["rank"])]
    )

for chain_years in details.values():
    for payload in chain_years.values():
        for key in ("f", "c"):
            if key in payload:
                payload[key].sort(key=lambda entry: entry[3])
                for entry in payload[key]:
                    entry.pop()


def bucket_for(canonical_id):
    # 64 deterministic shards keep every GitHub blob well below connector limits.
    digest = int(hashlib.md5(canonical_id.encode()).hexdigest()[:8], 16)
    return f"{digest % 64:02x}"


index = []
buckets = defaultdict(dict)
for canonical_id in sorted(details, key=lambda value: (names.get(value, "").lower(), value)):
    bucket = bucket_for(canonical_id)
    years = sorted((int(year) for year in years_by_chain[canonical_id]), reverse=True)
    index.append(
        {
            "id": canonical_id,
            "name": names.get(canonical_id, canonical_id),
            "years": years,
            "bucket": bucket,
        }
    )
    buckets[bucket][canonical_id] = details[canonical_id]

bucket_dir = OUT / "brands"
bucket_dir.mkdir(exist_ok=True)
for old_file in bucket_dir.glob("*.json"):
    old_file.unlink()
for bucket, payload in buckets.items():
    (bucket_dir / f"{bucket}.json").write_text(
        json.dumps(payload, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )

(OUT / "brand-index.json").write_text(
    json.dumps(index, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"
)

package_dir = OUT / "package"
package_dir.mkdir(exist_ok=True)
for old_part in package_dir.glob("*.part"):
    old_part.unlink()

if PACKAGE.exists():
    package_bytes = PACKAGE.read_bytes()
    part_size = 192 * 1024
    part_names = []
    for index_number, start in enumerate(range(0, len(package_bytes), part_size)):
        part_name = f"item20-v1-{index_number:03d}.part"
        (package_dir / part_name).write_bytes(package_bytes[start : start + part_size])
        part_names.append(part_name)
    package_manifest = {
        "filename": "Item20_Canonical_Geography_Outputs_v1.zip",
        "bytes": len(package_bytes),
        "sha256": hashlib.sha256(package_bytes).hexdigest(),
        "parts": part_names,
    }
    (package_dir / "manifest.json").write_text(
        json.dumps(package_manifest, separators=(",", ":")), encoding="utf-8"
    )
    summary["package"] = package_manifest

(OUT / "summary.json").write_text(
    json.dumps(summary, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"
)

print(
    json.dumps(
        {
            "source": str(SOURCE),
            "brandShards": len(buckets),
            "largestShardBytes": max(path.stat().st_size for path in bucket_dir.glob("*.json")),
            "packageParts": len(summary.get("package", {}).get("parts", [])),
            "stateRankingRows": len(rankings),
        }
    )
)
