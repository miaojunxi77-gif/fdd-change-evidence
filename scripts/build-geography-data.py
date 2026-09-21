#!/usr/bin/env python3
import csv
import hashlib
import json
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT.parent / "item20_outputs_v1" / "item20_canonical_outputs_v1"
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
    except ValueError:
        return value

metrics = rows("summary_metrics.csv")
quartiles = rows("size_quartile_geography.csv")
risk = rows("risk_score_geography_descriptive.csv")
states = rows("latest_snapshot_state_totals.csv")
geography = rows("canonical_geography_brand_year.csv")
rankings = rows("canonical_state_rankings.csv")
merged = rows("item10_item20_merged.csv")

summary = {
    "metrics": [{**r, "value": num(r["value"])} for r in metrics],
    "quartiles": [{k: num(v) for k, v in r.items()} for r in quartiles],
    "risk": [{k: num(v) for k, v in r.items()} for r in risk],
    "states": [{k: num(v) for k, v in r.items()} for r in states],
    "counts": {
        "canonicalBrandYears": len(geography),
        "stateRankingRows": len(rankings),
        "item10MergedRows": len(merged),
        "uniqueChains": len({r["canonical_chain_id"] for r in geography}),
    },
}
(OUT / "summary.json").write_text(json.dumps(summary, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")

merged_by_key = {(r["canonical_chain_id"], r["year"]): r for r in merged}
years_by_chain = defaultdict(set)
names = {}
details = defaultdict(lambda: defaultdict(dict))

for r in geography:
    cid, year = r["canonical_chain_id"], r["fdd_year"]
    names[cid] = r["chain_name"]
    years_by_chain[cid].add(year)
    compact = {k: num(v) for k, v in r.items() if k not in {"canonical_chain_id", "chain_name", "fdd_year"}}
    m = merged_by_key.get((cid, year))
    if m:
        compact["item10"] = {k: num(m.get(k)) for k in [
            "risk_score", "paper_ready", "score_status", "financing_forms", "providers", "purposes",
            "evidence_excerpt", "v1_2_qc_status", "v1_2_resolution_rule", "offering_split_flag",
            "full_item10_text_available"
        ]}
    details[cid][year]["summary"] = compact

for r in rankings:
    cid, year = r["canonical_chain_id"], r["fdd_year"]
    names.setdefault(cid, r["chain_name"])
    years_by_chain[cid].add(year)
    details[cid][year].setdefault("rankings", []).append({
        "table": r["table_type"], "state": r["state"], "rank": num(r["rank"]),
        "outlets": num(r["outlets_end"]), "share": num(r["state_share"]),
        "outletYear": num(r["outlet_data_year"]), "total": num(r["total_outlets"]),
        "nStates": num(r["n_states"]), "singleState": num(r["single_state"]),
        "conflict": num(r["geo_conflict"]), "status": r["reconcile_status"], "source": r["selected_source"],
    })

def bucket_for(cid):
    return hashlib.md5(cid.encode()).hexdigest()[:1]

index = []
buckets = defaultdict(dict)
for cid in sorted(details, key=lambda x: (names.get(x, "").lower(), x)):
    bucket = bucket_for(cid)
    index.append({"id": cid, "name": names.get(cid, cid), "years": sorted((int(y) for y in years_by_chain[cid]), reverse=True), "bucket": bucket})
    buckets[bucket][cid] = details[cid]

(OUT / "brand-index.json").write_text(json.dumps(index, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
bucket_dir = OUT / "brands"
bucket_dir.mkdir(exist_ok=True)
for bucket, payload in buckets.items():
    (bucket_dir / f"{bucket}.json").write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
