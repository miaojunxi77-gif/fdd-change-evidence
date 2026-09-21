"use client";

import { useEffect, useMemo, useState } from "react";

type Metric = { section: string; metric: string; value: number; note: string };
type Quartile = { size_quartile:string; n:number; single_state_share:number; mean_top1_share:number; median_top1_share:number; top1_ge_50:number; top1_ge_75:number; top1_ge_80:number; top1_ge_90:number; median_n_states:number; mean_n_states:number; median_total_franchised:number };
type Risk = { risk_score:number; n_geo:number; single_state_share:number; median_top1_share:number; median_franchised_outlets:number; median_n_states:number };
type StateRow = { state:string; franchised_outlets:number; share_of_latest_snapshot:number; n_systems_present:number };
type Summary = { metrics:Metric[]; quartiles:Quartile[]; risk:Risk[]; states:StateRow[]; counts:{canonicalBrandYears:number; stateRankingRows:number; item10MergedRows:number; uniqueChains:number} };
type Brand = { id:string; name:string; years:number[]; bucket:string };
type Ranking = { table:string; state:string; rank:number; outlets:number; share:number; outletYear:number; total:number; nStates:number; singleState:number; conflict:number; status:string; source:string };
type YearDetail = { summary?:Record<string,any>; rankings?:Ranking[] };

const pct = (v:number|null|undefined, d=1) => v == null ? "—" : `${(v*100).toFixed(d)}%`;
const nfmt = (v:number|null|undefined) => v == null ? "—" : v.toLocaleString();

function Bar({ value, max=1, color="var(--geo-blue)" }:{value:number;max?:number;color?:string}) {
  return <span className="geo-bar"><i style={{width:`${Math.max(2, Math.min(100, value/max*100))}%`,background:color}}/></span>;
}

export default function GeographyExplorer({basePath}:{basePath:string}) {
  const [summary,setSummary] = useState<Summary|null>(null);
  const [brands,setBrands] = useState<Brand[]>([]);
  const [query,setQuery] = useState("");
  const [brand,setBrand] = useState<Brand|null>(null);
  const [year,setYear] = useState<number|null>(null);
  const [detail,setDetail] = useState<YearDetail|null>(null);
  const [table,setTable] = useState("T3_FRANCHISED");

  useEffect(()=>{ Promise.all([
    fetch(`${basePath}/data/item20-geography/summary.json`).then(r=>r.json()),
    fetch(`${basePath}/data/item20-geography/brand-index.json`).then(r=>r.json())
  ]).then(([s,b])=>{setSummary(s);setBrands(b); const first=b.find((x:Brand)=>x.name==="100% Chiropractic")||b[0]; setBrand(first);setYear(first.years[0]);}); },[basePath]);

  useEffect(()=>{ if(!brand||year==null)return; fetch(`${basePath}/data/item20-geography/brands/${brand.bucket}.json`).then(r=>r.json()).then(data=>setDetail(data[brand.id]?.[String(year)]||null)); },[basePath,brand,year]);
  const matches = useMemo(()=>{ const q=query.trim().toLowerCase(); if(!q)return brands.slice(0,12); return brands.filter(b=>b.name.toLowerCase().includes(q)||b.id.toLowerCase().includes(q)).slice(0,40); },[brands,query]);
  const ranking = (detail?.rankings||[]).filter(r=>r.table===table).sort((a,b)=>a.rank-b.rank);
  const s = detail?.summary;
  const metric = (name:string) => summary?.metrics.find(x=>x.metric===name)?.value;

  if(!summary) return <main className="geo-page"><div className="shell geo-loading">Loading geography data…</div></main>;
  return <main className="geo-page">
    <section className="geo-hero shell">
      <div><p className="eyebrow">ITEM 20 · CANONICAL OUTLET GEOGRAPHY · V1</p><h1>Where are franchise systems actually operating?</h1><p>把五个来源的 Item 20 Table 3（franchised outlets）与 Table 4（company-owned outlets）统一到 canonical chain × FDD year。页面同时提供 Primary State、完整州排名、直营店地理、co-location，以及与 Item 10 V1.2 的精确合并。</p></div>
      <div className="geo-hero-metrics"><div><strong>{nfmt(metric("V5 TXT documents scanned"))}</strong><span>TXT documents scanned</span></div><div><strong>{nfmt(summary.counts.canonicalBrandYears)}</strong><span>canonical geography brand-years</span></div><div><strong>{nfmt(summary.counts.stateRankingRows)}</strong><span>state-ranking rows</span></div><div><strong>{nfmt(metric("Item 10 paper-ready with any Item 20 geography"))}</strong><span>Item 10 rows with geography</span></div></div>
    </section>

    <section className="geo-section shell"><div className="geo-heading"><div><p className="eyebrow">HEADLINE FINDINGS</p><h2>Primary State is informative—but system size changes its meaning</h2></div><p>严格样本排除 reconciliation conflict，并要求 franchised outlets 为正。Primary State 是 Top-1 州；Top-1 share 是该州门店数占该 system 当年所有已识别 franchised outlets 的比例。</p></div>
      <div className="geo-kpis"><article><strong>{nfmt(metric("Strict positive brand-years"))}</strong><span>strict positive brand-years</span></article><article><strong>{pct(metric("Single-state share"))}</strong><span>single-state systems</span></article><article><strong>{pct(metric("Median Top-1 state share"))}</strong><span>median Top-1 share</span></article><article><strong>{nfmt(metric("Median number of states"))}</strong><span>median states per system</span></article><article><strong>{pct(metric("Top-1 share >= 50%"))}</strong><span>Top-1 share ≥ 50%</span></article><article><strong>{pct(metric("Top-1 share >= 90%"))}</strong><span>Top-1 share ≥ 90%</span></article></div>
      <div className="geo-callout"><strong>Empirical implication</strong><p><b>PrimaryState</b> 适合解释与 concentrated / small systems 的分析；全样本 local banking exposure 更适合使用 <code>Σ state outlet share × state-year bank condition</code>。否则，一个在 35 个州经营的大 system 会被错误压缩成单一州。</p></div>
    </section>

    <section className="geo-section geo-tint"><div className="shell"><div className="geo-heading"><div><p className="eyebrow">SIZE GRADIENT</p><h2>Geographic concentration falls sharply with system size</h2></div><p>四分位点为 11、40、130 个 franchised outlets。这里的关系是描述性的，但它直接决定了 exposure variable 应如何构造。</p></div>
      <div className="geo-quartiles">{summary.quartiles.map((q,i)=><article key={q.size_quartile}><div><span>{q.size_quartile}</span><strong>{nfmt(q.n)}</strong><small>brand-years</small></div><h3>{pct(q.single_state_share)}</h3><p>single-state</p><Bar value={q.single_state_share} max={0.36}/><dl><div><dt>Median Top-1</dt><dd>{pct(q.median_top1_share)}</dd></div><div><dt>Median states</dt><dd>{q.median_n_states}</dd></div><div><dt>Median outlets</dt><dd>{q.median_total_franchised}</dd></div><div><dt>Top-1 ≥ 75%</dt><dd>{pct(q.top1_ge_75)}</dd></div></dl></article>)}</div>
    </div></section>

    <section className="geo-section shell"><div className="geo-heading"><div><p className="eyebrow">LATEST SYSTEM SNAPSHOT</p><h2>Where the observed franchised outlets are located</h2></div><p>每个 system 只取最新 strict snapshot 后汇总。它描述本项目样本，不等于美国全部 franchise universe。</p></div>
      <div className="geo-state-layout"><div className="geo-state-chart">{summary.states.slice(0,15).map((r,i)=><div key={r.state}><span>{i+1}</span><b>{r.state}</b><Bar value={r.share_of_latest_snapshot} max={summary.states[0].share_of_latest_snapshot}/><strong>{nfmt(r.franchised_outlets)}</strong><small>{pct(r.share_of_latest_snapshot,2)}</small></div>)}</div><div className="geo-state-notes"><article><strong>TX</strong><span>{nfmt(summary.states[0].franchised_outlets)} outlets</span><p>{pct(summary.states[0].share_of_latest_snapshot,2)} of the latest-system snapshot.</p></article><article><strong>CA</strong><span>{nfmt(summary.states[1].franchised_outlets)} outlets</span><p>{pct(summary.states[1].share_of_latest_snapshot,2)} of the snapshot.</p></article><article><strong>FL</strong><span>{nfmt(summary.states[2].franchised_outlets)} outlets</span><p>{pct(summary.states[2].share_of_latest_snapshot,2)} of the snapshot.</p></article></div></div>
    </section>

    <section className="geo-section geo-company"><div className="shell"><div className="geo-heading"><div><p className="eyebrow">COMPANY-OWNED GEOGRAPHY</p><h2>Franchisor-owned stores are much more geographically concentrated</h2></div><p>Table 4 的真实 systemwide zero 被保留为 0，而不是 missing；zero observations 没有 Company-Owned Primary State。affiliate-owned 与非标准区域代表表不会静默归为 company-owned。</p></div>
      <div className="geo-company-grid"><article><strong>{pct(metric("Zero company-owned share"))}</strong><h3>Zero company-owned outlets</h3><p>在 resolved、Item 10 paper-ready 的 Table 4 observations 中。</p></article><article><strong>{pct(metric("Positive company systems single-state share"))}</strong><h3>Single-state company presence</h3><p>仅在 positive company-owned systems 中计算。</p></article><article><strong>{pct(metric("Median company Top-1 share"))}</strong><h3>Median Company Top-1 share</h3><p>positive company-owned systems 的中位数是 100%。</p></article><article><strong>{pct(metric("Any franchise/company state co-location"))}</strong><h3>Any co-location</h3><p>至少一个 franchised outlet 位于有 company-owned store 的州。</p></article><article><strong>{pct(metric("Median franchise colocation share"))}</strong><h3>Median co-location share</h3><p>franchised outlets 中与 company presence 同州的比例。</p></article><article><strong>{nfmt(metric("Strict paper-ready matched rows"))}</strong><h3>Strict co-location rows</h3><p>Table 3/4 outlet year 相同，且无 geography conflict。</p></article></div>
    </div></section>

    <section className="geo-section shell"><div className="geo-heading"><div><p className="eyebrow">ITEM 10 × ITEM 20</p><h2>Coverage of the merged analysis file</h2></div><p>exact canonical ID × FDD year 合并。未匹配不等于“FDD 没有 Item 20”；也可能是 identity、OCR、source coverage 或 offering-scope 问题。</p></div>
      <div className="geo-merge"><div><strong>13,124</strong><span>Item 10 paper-ready</span></div><i>→</i><div><strong>10,440</strong><span>any Item 20 geography · 79.5%</span></div><i>→</i><div><strong>9,778</strong><span>franchised geography · 74.5%</span></div><i>+</i><div><strong>8,459</strong><span>company geography · 64.5%</span></div></div>
      <div className="geo-risk"><div><h3>RiskScore × geography</h3><p>这些是未做 size adjustment 的描述统计，不能解释为 financing support 导致地理扩张或集中。</p></div><div className="geo-table-wrap"><table><thead><tr><th>RiskScore</th><th>N with geography</th><th>Single-state</th><th>Median Top-1</th><th>Median outlets</th><th>Median states</th></tr></thead><tbody>{summary.risk.map(r=><tr key={r.risk_score}><th>{r.risk_score}</th><td>{nfmt(r.n_geo)}</td><td>{pct(r.single_state_share)}</td><td>{pct(r.median_top1_share)}</td><td>{nfmt(r.median_franchised_outlets)}</td><td>{nfmt(r.median_n_states)}</td></tr>)}</tbody></table></div></div>
    </section>

    <section className="geo-section geo-explorer shell" id="brand-explorer"><div className="geo-heading"><div><p className="eyebrow">CANONICAL STATE-RANKING EXPLORER</p><h2>Search a system, choose a year, inspect every state</h2></div><p>这不是 Top-3 摘要表：选中 brand-year 后会展示全部 state-ranking rows。Table 3 与 Table 4 可以切换。</p></div>
      <div className="geo-explorer-grid"><aside><label htmlFor="brand-search">Brand or canonical ID</label><input id="brand-search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="例如 McDonald's, Subway…"/><div className="geo-search-results">{matches.map(b=><button key={b.id} className={brand?.id===b.id?"active":""} onClick={()=>{setBrand(b);setYear(b.years[0]);setTable("T3_FRANCHISED")}}><strong>{b.name}</strong><span>{b.id} · {b.years.length} year{b.years.length>1?"s":""}</span></button>)}</div></aside><div className="geo-detail">{brand&&<><div className="geo-detail-head"><div><span>{brand.id}</span><h3>{brand.name}</h3></div><select value={year??""} onChange={e=>setYear(Number(e.target.value))}>{brand.years.map(y=><option key={y}>{y}</option>)}</select></div>
        <div className="geo-detail-kpis"><article><span>Franchise Primary State</span><strong>{s?.franchise_top1_state||"—"}</strong><small>{nfmt(s?.franchise_top1_outlets)} outlets · {pct(s?.franchise_top1_share)}</small></article><article><span>Company-Owned Primary State</span><strong>{s?.company_top1_state||"—"}</strong><small>{nfmt(s?.company_top1_outlets)} outlets · {pct(s?.company_top1_share)}</small></article><article><span>RiskScore</span><strong>{s?.item10?.risk_score??"—"}</strong><small>{s?.item10?.financing_forms||"No exact Item 10 merge"}</small></article><article><span>Franchise co-location share</span><strong>{pct(s?.franchise_colocation_share)}</strong><small>with company-owned state presence</small></article></div>
        {s?.item10&&<div className="geo-item10-card"><div><b>Providers</b><span>{s.item10.providers||"—"}</span></div><div><b>Purposes</b><span>{s.item10.purposes||"—"}</span></div><p>{s.item10.evidence_excerpt||"No evidence excerpt stored."}</p></div>}
        <div className="geo-table-tabs"><button className={table==="T3_FRANCHISED"?"active":""} onClick={()=>setTable("T3_FRANCHISED")}>Franchised outlets</button><button className={table==="T4_COMPANY"?"active":""} onClick={()=>setTable("T4_COMPANY")}>Company-owned outlets</button></div>
        <div className="geo-table-meta"><span>{ranking.length} positive states</span><span>{ranking[0]?`Outlet year ${ranking[0].outletYear} · ${ranking[0].status} · ${ranking[0].source}`:"No positive state rows for this table/year"}</span></div>
        <div className="geo-table-wrap geo-ranking-table"><table><thead><tr><th>Rank</th><th>State</th><th>Outlets</th><th>Share</th><th>Distribution</th></tr></thead><tbody>{ranking.map(r=><tr key={`${r.table}-${r.state}`}><td>{r.rank}</td><th>{r.state}</th><td>{nfmt(r.outlets)}</td><td>{pct(r.share,2)}</td><td><Bar value={r.share} max={ranking[0]?.share||1}/></td></tr>)}</tbody></table></div>
      </>}</div></div>
    </section>

    <section className="geo-section geo-method"><div className="shell"><div className="geo-heading"><div><p className="eyebrow">RECONCILIATION & DATA CONTENTS</p><h2>What counts as a defensible geography observation?</h2></div><p>原始 PDF 仍是权威来源；网页展示的是由 V5 HIGH-confidence rows 构造的 research dataset。</p></div><div className="geo-method-grid"><article><span>01</span><h3>Canonical linkage</h3><p>NASAA 优先使用 SBA code；NON_SBA 先做 EFD-to-SBA repair；CA、MN、WI 使用 source metadata 与 name/year linkage。低置信 identity 不强制匹配。</p></article><article><span>02</span><h3>Outlet year</h3><p>同一 chain × FDD year × table type 选择最新合理 outlet year，优先 FDD year − 1。</p></article><article><span>03</span><h3>Duplicate sources</h3><p>用 state-distribution signature 比较重复申报；优先一致/多数结果，竞争 signature 仍存在时标记 geo_conflict=1。</p></article><article><span>04</span><h3>Strict sample</h3><p>核心数字排除 geography conflict；Primary State 与 Top shares 只由 HIGH-confidence state rows 产生。</p></article></div><div className="geo-download"><div><h3>Item20 Canonical Geography Outputs v1 represented on this page</h3><p>页面覆盖 canonical geography、全部 positive-state rankings、company/franchise co-location、Item 10 merge、latest-state snapshot、size quartiles、RiskScore descriptive，以及 linkage 与 reconciliation 方法。Missing-FDD audit 按当前安排暂不展开。</p></div></div></div></section>
  </main>;
}
