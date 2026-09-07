#!/usr/bin/env python3
"""Build advisor-facing Item 10 evidence datasets from Production V1.1."""

import csv, json, re, sys
from collections import defaultdict
from pathlib import Path

csv.field_size_limit(sys.maxsize)
ROOT = Path(__file__).resolve().parents[1]
SCRATCH = Path("/workspace/scratch/add80a9d5cf1")
OUT = ROOT / "public/data/item10-financing"
DETAILS = OUT / "details"

def rows(path):
    with Path(path).open(encoding="utf-8-sig", newline="") as f: return list(csv.DictReader(f))

def clean(value):
    value = (value or "").replace("\x00", "").replace("\r\n", "\n").replace("\r", "\n")
    return re.sub(r"\n{4,}", "\n\n\n", re.sub(r"[ \t]+\n", "\n", value)).strip()

def integer(value): return None if value in ("", None) else int(float(value))
def split(value): return [x.strip() for x in re.split(r"\s*[|;]\s*", value or "") if x.strip()]

def pick(docs):
    rank = {"NASAA":0,"CA":1,"MN":2,"WI":3,"IN":4,"NASAA_NON_SBA":5}
    return min(docs, key=lambda d:(rank.get(d.get("source"),9), 0 if d.get("efd_id") else 1, d.get("source_pdf","")))

def main():
    OUT.mkdir(parents=True, exist_ok=True); DETAILS.mkdir(parents=True, exist_ok=True)
    panel = rows(SCRATCH / "outputs/item10_v1_1/item10_brand_year_panel_production_v1_1.csv")
    documents = rows(SCRATCH / "outputs/item10_v1_1/item10_document_identity_v1_1.csv")
    master = rows(SCRATCH / "library_inputs/franchise/item10_master_document_level.csv")
    transitions = rows(SCRATCH / "outputs/item10_v1_1/item10_production_within_brand_transitions_v1_1.csv")

    text_by_hash = {}
    for r in master:
        h,t=r.get("item10_hash",""),clean(r.get("item10_text",""))
        if h and len(t)>len(text_by_hash.get(h,"")): text_by_hash[h]=t

    docs_by_key_hash=defaultdict(list); hashes_by_key=defaultdict(set)
    for r in documents:
        if r.get("include_v1_1")!="1": continue
        k,h=r.get("v1_1_reconcile_key",""),r.get("item10_hash","")
        if k and h: docs_by_key_hash[(k,h)].append(r); hashes_by_key[k].add(h)

    index=[]; detail_by_year=defaultdict(dict); lookup={}
    for p in panel:
        key,chain,year=p["reconcile_key_v1_1"],p["canonical_chain_id_v1_1"],int(p["year"])
        rid=f"{chain}::{year}"; versions=[]
        for h in sorted(hashes_by_key.get(key,set())):
            d=pick(docs_by_key_hash[(key,h)])
            versions.append({"hash":h,"source":d.get("source",""),"efdId":d.get("efd_id",""),"docId":d.get("doc_id",""),"issuanceDate":d.get("issuance_date",""),"score":integer(d.get("score_after_prior_recode") or d.get("final_score","")),"forms":split(d.get("final_forms","")),"providers":split(d.get("provider","")),"purposes":split(d.get("purpose","")),"riskTransfer":d.get("risk_transfer",""),"evidenceQuote":clean(d.get("evidence_quotes","")),"codingNote":clean(d.get("coding_notes","")),"item10Text":text_by_hash.get(h,"")})
        rep=max(versions,key=lambda v:(len(v["evidenceQuote"]),len(v["item10Text"])),default={})
        score=integer(p.get("final_risk_score",""))
        compact={"id":rid,"chainId":chain,"brand":p["canonical_chain_name_v1_1"],"year":year,"score":score,"status":p["final_score_status"],"paperReady":p["paper_ready"]=="1","documents":int(p["n_documents"]),"versions":int(p["n_unique_item10_hashes"]),"sources":split(p["sources"]),"forms":split(p["final_forms"]),"providers":split(p["providers_union"]),"purposes":split(p["purposes_union"]),"evidenceQuote":rep.get("evidenceQuote",""),"hasFullText":any(bool(v["item10Text"]) for v in versions),"identityActions":split(p["identity_actions"])}
        index.append(compact); detail_by_year[year][rid]={"id":rid,"brand":compact["brand"],"year":year,"score":score,"status":compact["status"],"versions":versions}; lookup[(chain,year)]=compact
    index.sort(key=lambda r:(r["brand"].casefold(),r["year"]))
    full=sum(r["hasFullText"] for r in index)
    (OUT/"brand-year-index.json").write_text(json.dumps({"meta":{"version":"Production V1.1","freezeDate":"2026-09-07","unit":"canonical franchise system × filing year","nBrandYears":len(index),"nPaperReady":sum(r["paperReady"] for r in index),"nWithFullText":full,"note":"Original PDFs remain authoritative; displayed text is the extracted Item 10 used for coding."},"rows":index},ensure_ascii=False,separators=(",",":")),encoding="utf-8")
    for y,d in detail_by_year.items(): (DETAILS/f"{y}.json").write_text(json.dumps(d,ensure_ascii=False,separators=(",",":")),encoding="utf-8")

    fields=["canonical_chain_id","canonical_chain_name","year","final_risk_score","final_score_status","paper_ready","n_documents","n_unique_item10_versions","sources","final_forms","providers","purposes","evidence_quote","full_item10_text_available"]
    with (OUT/"brand-year-evidence.csv").open("w",encoding="utf-8-sig",newline="") as f:
        w=csv.DictWriter(f,fieldnames=fields); w.writeheader()
        for r in index: w.writerow(dict(zip(fields,[r["chainId"],r["brand"],r["year"],"" if r["score"] is None else r["score"],r["status"],int(r["paperReady"]),r["documents"],r["versions"]," | ".join(r["sources"])," | ".join(r["forms"])," | ".join(r["providers"])," | ".join(r["purposes"]),r["evidenceQuote"],int(r["hasFullText"])])))

    latest={}
    for r in index:
        if r["paperReady"] and (r["chainId"] not in latest or r["year"]>latest[r["chainId"]]["year"]): latest[r["chainId"]]=r
    lfields=["canonical_chain_id","canonical_chain_name","latest_paper_ready_year","final_risk_score","any_support","risk_bearing_ge2","material_risk_ge3","direct_funded_eq4","final_forms","providers","purposes","evidence_quote"]
    with (OUT/"franchisor-latest-year.csv").open("w",encoding="utf-8-sig",newline="") as f:
        w=csv.DictWriter(f,fieldnames=lfields); w.writeheader()
        for r in sorted(latest.values(),key=lambda x:x["brand"].casefold()):
            s=r["score"]; w.writerow(dict(zip(lfields,[r["chainId"],r["brand"],r["year"],s,int(s>=1),int(s>=2),int(s>=3),int(s==4)," | ".join(r["forms"])," | ".join(r["providers"])," | ".join(r["purposes"]),r["evidenceQuote"]])))

    changed=[]
    for t in transitions:
        if t.get("changed")!="1": continue
        chain=t["canonical_chain_id_v1_1"]; fy,ty=int(t["from_year"]),int(t["to_year"]); a,b=lookup[(chain,fy)],lookup[(chain,ty)]
        ctype="0 → support" if t["zero_to_support"]=="1" else "support → 0" if t["support_to_zero"]=="1" else "risk increase" if t["risk_increase"]=="1" else "risk decrease"
        changed.append({"id":f"{chain}::{fy}::{ty}","chainId":chain,"brand":t["canonical_chain_name_v1_1"],"fromYear":fy,"toYear":ty,"fromScore":int(t["from_score"]),"toScore":int(t["to_score"]),"scoreChange":int(t["score_change"]),"changeType":ctype,"fromForms":a["forms"],"toForms":b["forms"],"fromProviders":a["providers"],"toProviders":b["providers"],"fromQuote":a["evidenceQuote"],"toQuote":b["evidenceQuote"],"fromId":a["id"],"toId":b["id"]})
    changed.sort(key=lambda r:(-abs(r["scoreChange"]),r["brand"].casefold(),r["fromYear"]))
    (OUT/"within-firm-changes.json").write_text(json.dumps({"meta":{"nChangedPairs":len(changed),"nConsecutivePairs":7013},"rows":changed},ensure_ascii=False,separators=(",",":")),encoding="utf-8")
    cfields=["canonical_chain_id","canonical_chain_name","from_year","to_year","from_score","to_score","score_change","change_type","from_forms","to_forms","from_providers","to_providers","from_evidence_quote","to_evidence_quote"]
    with (OUT/"within-firm-changes.csv").open("w",encoding="utf-8-sig",newline="") as f:
        w=csv.DictWriter(f,fieldnames=cfields); w.writeheader()
        for r in changed: w.writerow(dict(zip(cfields,[r["chainId"],r["brand"],r["fromYear"],r["toYear"],r["fromScore"],r["toScore"],r["scoreChange"],r["changeType"]," | ".join(r["fromForms"])," | ".join(r["toForms"])," | ".join(r["fromProviders"])," | ".join(r["toProviders"]),r["fromQuote"],r["toQuote"]])))
    print(json.dumps({"brandYears":len(index),"paperReady":sum(r["paperReady"] for r in index),"fullTextBrandYears":full,"latestFranchisors":len(latest),"changedPairs":len(changed)},indent=2))

if __name__=="__main__": main()
