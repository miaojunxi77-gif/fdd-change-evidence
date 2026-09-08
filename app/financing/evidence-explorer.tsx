"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";

type BrandYear={id:string;chainId:string;brand:string;year:number;score:number|null;status:string;paperReady:boolean;documents:number;versions:number;sources:string[];forms:string[];providers:string[];purposes:string[];evidenceQuote:string;hasFullText:boolean};
type Version={hash:string;source:string;efdId:string;docId:string;issuanceDate?:string;score:number|null;forms:string[];providers:string[];purposes:string[];riskTransfer:string;evidenceQuote:string;codingNote:string;item10Text:string};
type Detail={id:string;brand:string;year:number;score:number|null;status:string;versions:Version[]};
type Change={id:string;chainId:string;brand:string;fromYear:number;toYear:number;fromScore:number;toScore:number;scoreChange:number;changeType:string;fromForms:string[];toForms:string[];fromProviders:string[];toProviders:string[];fromQuote:string;toQuote:string;fromId:string;toId:string};

const PAGE=24;
const scoreLabels=["No financing involvement","Referral / third-party access","Deferred payment / seller credit","Conditional outflow / guarantee","Direct funded credit"];
const pretty=(x:string)=>x.replaceAll("_"," ").replace(/\b\w/g,c=>c.toUpperCase());
const joined=(x:string[])=>x?.length?x.map(pretty).join(" · "):"—";

const brandDisplayOverrides:Record<string,string>={
 "U_074ee73a":"Affordable Car Rental / Sensible Car Rental",
 "U_acdea696":"Best Western",
 "U_75a60ca4":"HomeTowne Studios by Red Roof",
 "U_aad9adba":"KeyGlee",
 "U_f165363d":"FAMILY NEST™",
};
const displayBrand=(chainId:string,brand:string)=>brandDisplayOverrides[chainId]??brand.replaceAll("â„¢","™");
const conflictReasons=["Cross-source / state-source versions","Same-source multiple Item 10 versions","Version conflict requiring adjudication"];

function conflictStructure(r:BrandYear){
 if(r.score!==null)return "";
 const src=[...new Set((r.sources||[]).filter(Boolean))];
 if(src.length>1)return "Cross-source / state-source versions";
 if(r.versions>1)return "Same-source multiple Item 10 versions";
 return "Version conflict requiring adjudication";
}

function conflictDetail(d:Detail){
 const versions=d.versions||[];
 const sources=[...new Set(versions.map(v=>v.source).filter(Boolean))];
 const dated=versions.map(v=>v.issuanceDate||"").filter(Boolean);
 const dates=[...new Set(dated)];
 const scores=[...new Set(versions.map(v=>v.score).filter((s):s is number=>s!==null))].sort((a,b)=>a-b);
 const scoreText=scores.length?scores.join(" vs "):"different scores";
 if(sources.length>1)return `Cross-source / state-source conflict: valid Item 10 versions from ${sources.join(" / ")} imply ${scoreText}. The production freeze does not assume that one state/source is automatically controlling, so the brand-year remains NA.`;
 if(sources.length===1&&dated.length===versions.length&&dates.length===1)return `Same-source, same-date parallel-version conflict: ${sources[0]} contains ${versions.length} distinct Item 10 texts dated ${dates[0]} that imply ${scoreText}. This pattern can arise from Original/Marked Copy or other parallel filed copies; no safe ordering is inferred from date or source.`;
 if(sources.length===1&&dates.length>1)return `Same-year amendment/version conflict: ${sources[0]} contains distinct Item 10 versions with filing dates ${dates.join(" / ")} that imply ${scoreText}. The available metadata does not establish a unique controlling national brand-year version, so the score remains NA.`;
 if(sources.length===1)return `Same-source multi-version conflict with insufficient chronology: ${sources[0]} contains distinct Item 10 texts that imply ${scoreText}, but dates/version ordering are incomplete or ambiguous. The score is therefore left NA rather than forced.`;
 return `Multiple valid Item 10 versions imply ${scoreText}, but the available provenance does not establish a safe controlling version. The score is left NA.`;
}

function Badge({score}:{score:number|null}){return <span className={`financing-score-badge score-${score??"na"}`}>{score??"NA"}</span>}
function Pager({page,pages,setPage}:{page:number;pages:number;setPage:(n:number)=>void}){return pages<=1?null:<div className="financing-pager"><button disabled={page===1} onClick={()=>setPage(page-1)}>← Previous</button><span>Page {page} of {pages}</span><button disabled={page===pages} onClick={()=>setPage(page+1)}>Next →</button></div>}

function VersionCard({version,index,compact=false}:{version:Version;index:number;compact?:boolean}){
 return <article className={`financing-version-card${compact?" compact":""}`}>
  <div className="financing-version-head"><div><span>Item 10 version {index+1}</span><strong>{version.source||"Source not recorded"}{version.issuanceDate?` · ${version.issuanceDate}`:""}</strong><small>{version.efdId?`${version.efdId}${version.docId?` / ${version.docId}`:""}`:version.docId||""}</small></div><Badge score={version.score}/></div>
  <dl className="financing-detail-grid"><div><dt>Provider</dt><dd>{joined(version.providers)}</dd></div><div><dt>Financing form</dt><dd>{joined(version.forms)}</dd></div><div><dt>Purpose</dt><dd>{joined(version.purposes)}</dd></div><div><dt>Risk transfer</dt><dd>{pretty(version.riskTransfer||"not recorded")}</dd></div></dl>
  {version.evidenceQuote&&<blockquote><span>Score-specific evidence</span>{version.evidenceQuote}</blockquote>}
  <details className="financing-original-text"><summary>Open full extracted Item 10 text</summary>{version.item10Text?<pre>{version.item10Text}</pre>:<p>Full extracted text is not available in the assembled website data; the evidence quote above is the text used for coding.</p>}</details>
  {version.codingNote&&<p className="financing-coding-note"><strong>Coding note:</strong> {version.codingNote}</p>}
 </article>
}

function InlineBrandDetail({row,detail,loading,onClose}:{row:BrandYear;detail:Detail|null;loading:boolean;onClose:()=>void}){
 return <div className="financing-inline-detail">
  <div className="financing-inline-detail-head"><div><span>{row.score===null?"CONFLICTING ITEM 10 VERSIONS":"BRAND-YEAR EVIDENCE"}</span><h3>{displayBrand(row.chainId,row.brand)} · {row.year}</h3></div><button onClick={onClose}>Close</button></div>
  {loading&&<div className="financing-loading">Loading source-specific Item 10 versions…</div>}
  {!loading&&detail&&<>
   {detail.score===null&&<div className="financing-conflict-explanation"><strong>Why unresolved</strong><p>{conflictDetail(detail)}</p><p className="financing-conflict-instruction">Each card below is a separate Item 10 version. Compare the <b>source/state, filing date, score, and score-specific evidence</b> directly.</p></div>}
   <div className={`financing-inline-versions${detail.versions.length>1?" compare":""}`}>{detail.versions.map((v,i)=><VersionCard key={v.hash} version={v} index={i} compact/>)}</div>
  </>}
 </div>
}

export default function EvidenceExplorer({basePath}:{basePath:string}){
 const [mode,setMode]=useState<"brand"|"changes">("brand"); const [rows,setRows]=useState<BrandYear[]>([]); const [changes,setChanges]=useState<Change[]>([]); const [loading,setLoading]=useState(true); const [error,setError]=useState("");
 const [query,setQuery]=useState(""); const [year,setYear]=useState("all"); const [score,setScore]=useState("all"); const [status,setStatus]=useState("paper"); const [conflictReason,setConflictReason]=useState("all"); const [kind,setKind]=useState("all"); const [page,setPage]=useState(1);
 const [selected,setSelected]=useState<BrandYear|null>(null); const [detail,setDetail]=useState<Detail|null>(null); const [selectedChange,setSelectedChange]=useState<Change|null>(null); const [compare,setCompare]=useState<{before:Detail;after:Detail}|null>(null); const [detailLoading,setDetailLoading]=useState(false); const cache=useRef(new Map<number,Record<string,Detail>>());
 useEffect(()=>{let active=true;Promise.all([fetch(`${basePath}/data/item10-financing/brand-year-index.json`).then(r=>{if(!r.ok)throw Error("Brand-year evidence could not be loaded.");return r.json()}),fetch(`${basePath}/data/item10-financing/within-firm-changes.json`).then(r=>{if(!r.ok)throw Error("Within-firm changes could not be loaded.");return r.json()})]).then(([a,b])=>{if(active){setRows(a.rows);setChanges(b.rows);setLoading(false)}}).catch(e=>{if(active){setError(e.message);setLoading(false)}});return()=>{active=false}},[basePath]);
 async function yearDetails(y:number){const old=cache.current.get(y);if(old)return old;const r=await fetch(`${basePath}/data/item10-financing/details/${y}.json`);if(!r.ok)throw Error("Original text could not be loaded.");const d=await r.json();cache.current.set(y,d);return d}
 async function openRow(r:BrandYear){if(selected?.id===r.id){setSelected(null);setDetail(null);return}setSelected(r);setSelectedChange(null);setCompare(null);setDetail(null);setDetailLoading(true);try{setDetail((await yearDetails(r.year))[r.id])}catch(e){setError(e instanceof Error?e.message:"Original text could not be loaded.")}finally{setDetailLoading(false)}}
 async function openChange(r:Change){setSelectedChange(r);setSelected(null);setDetail(null);setCompare(null);setDetailLoading(true);try{const[a,b]=await Promise.all([yearDetails(r.fromYear),yearDetails(r.toYear)]);setCompare({before:a[r.fromId],after:b[r.toId]})}catch(e){setError(e instanceof Error?e.message:"Comparison text could not be loaded.")}finally{setDetailLoading(false)}}
 const years=useMemo(()=>[...new Set(rows.map(r=>r.year))].sort((a,b)=>b-a),[rows]); const q=query.trim().toLowerCase();
 const conflictCounts=useMemo(()=>{const out:Record<string,number>={};for(const reason of conflictReasons)out[reason]=0;for(const r of rows)if(r.status==="UNRESOLVED_SCORE_CONFLICT"){const reason=conflictStructure(r);out[reason]=(out[reason]||0)+1}return out},[rows]);
 const filtered=useMemo(()=>rows.filter(r=>(!q||[displayBrand(r.chainId,r.brand),r.brand,r.chainId,...r.forms,...r.providers,...r.purposes,r.evidenceQuote].join(" ").toLowerCase().includes(q))&&(year==="all"||r.year===+year)&&(score==="all"||(score==="na"?r.score===null:r.score===+score))&&(status==="all"||(status==="paper"?r.paperReady:r.status==="UNRESOLVED_SCORE_CONFLICT"))&&(status!=="unresolved"||conflictReason==="all"||conflictStructure(r)===conflictReason)),[rows,q,year,score,status,conflictReason]);
 const filteredChanges=useMemo(()=>changes.filter(r=>{const match=kind==="all"||r.changeType===kind||(kind==="other increase"&&r.scoreChange>0&&r.changeType!=="0 → support")||(kind==="other decrease"&&r.scoreChange<0&&r.changeType!=="support → 0");return match&&(year==="all"||r.toYear===+year)&&(!q||[displayBrand(r.chainId,r.brand),r.brand,r.chainId,...r.fromForms,...r.toForms,r.fromQuote,r.toQuote].join(" ").toLowerCase().includes(q))}),[changes,q,year,kind]);
 const active=mode==="brand"?filtered:filteredChanges; const pages=Math.max(1,Math.ceil(active.length/PAGE)); const p=Math.min(page,pages); const visible=active.slice((p-1)*PAGE,p*PAGE);
 const reset=(fn:()=>void)=>{fn();setPage(1);setSelected(null);setDetail(null)};
 return <div className="financing-explorer">
  <div className="financing-explorer-tabs" role="tablist"><button role="tab" aria-selected={mode==="brand"} onClick={()=>reset(()=>setMode("brand"))}>Brand-year evidence <span>13,222</span></button><button role="tab" aria-selected={mode==="changes"} onClick={()=>reset(()=>setMode("changes"))}>Within-firm changes <span>341</span></button></div>
  <div className={`financing-filters${mode==="brand"&&status==="unresolved"?" has-conflict-filter":""}`}><label className="financing-search"><span>Search brand, form, provider or text</span><input value={query} onChange={e=>reset(()=>setQuery(e.target.value))} placeholder="e.g., McDonald's, guarantee, deferred fee"/></label><label><span>Year</span><select value={year} onChange={e=>reset(()=>setYear(e.target.value))}><option value="all">All years</option>{years.map(y=><option key={y}>{y}</option>)}</select></label>{mode==="brand"?<><label><span>Risk score</span><select value={score} onChange={e=>reset(()=>setScore(e.target.value))}><option value="all">All scores</option>{[0,1,2,3,4].map(s=><option key={s} value={s}>Score {s}</option>)}<option value="na">NA / conflict</option></select></label><label title="Unresolved means the same franchise-system-year has multiple valid Item 10 versions that imply different scores, and no safe chronology/adjudication rule can choose one."><span>Status</span><select value={status} onChange={e=>reset(()=>{setStatus(e.target.value);if(e.target.value!=="unresolved")setConflictReason("all")})}><option value="paper">Paper-ready</option><option value="unresolved">Unresolved score conflict</option><option value="all">All observations</option></select></label>{status==="unresolved"&&<label title="Filter unresolved observations by the conflict structure visible in the table."><span>Conflict reason</span><select value={conflictReason} onChange={e=>reset(()=>setConflictReason(e.target.value))}><option value="all">All conflict reasons (155)</option>{conflictReasons.map(reason=><option key={reason} value={reason}>{reason} ({conflictCounts[reason]||0})</option>)}</select></label>}</>:<label><span>Change type</span><select value={kind} onChange={e=>reset(()=>setKind(e.target.value))}><option value="all">All score changes</option><option value="0 → support">0 → support</option><option value="support → 0">Support → 0</option><option value="other increase">Other increase</option><option value="other decrease">Other decrease</option></select></label>}</div>
  <div className="financing-result-line"><strong>{active.length.toLocaleString()}</strong> matching {mode==="brand"?"brand-year observations":"consecutive-year score changes"}<span>{mode==="brand"&&status==="unresolved"?(conflictReason==="all"?"155 total. For unresolved rows, the table shows the conflicting sources; click Compare versions to open the source-specific evidence directly beneath that row.":`Conflict reason: ${conflictReason}. Click Compare versions to see each source/state, date, score and Item 10 excerpt side by side.`):"Click a row to inspect the original extracted text."}</span></div>
  {loading&&<div className="financing-loading">Loading evidence dataset…</div>}{error&&<div className="financing-error">{error}</div>}
  {!loading&&!error&&mode==="brand"&&<div className="financing-table-wrap"><table className="financing-evidence-table"><thead><tr><th>Franchise system</th><th>Year</th><th>Score / conflict reason</th><th>Form / provider</th><th>{status==="unresolved"?"Conflicting sources":"Evidence excerpt"}</th><th/></tr></thead><tbody>{(visible as BrandYear[]).map(r=><Fragment key={r.id}><tr className={selected?.id===r.id?"selected":""}><td><strong>{displayBrand(r.chainId,r.brand)}</strong><small>{r.chainId} · {r.documents} document{r.documents===1?"":"s"}</small></td><td>{r.year}</td><td><Badge score={r.score}/><small>{r.score===null?conflictStructure(r):scoreLabels[r.score]}</small></td><td><strong>{joined(r.forms)}</strong><small>{joined(r.providers)}</small></td><td>{r.score===null?<div className="financing-source-preview"><strong>{r.sources.length>1?"Sources / state sources in conflict":"Source with multiple versions"}</strong><div>{r.sources.map(s=><span key={s}>{s}</span>)}</div><small>The row-level excerpt is intentionally hidden here so one version is not mistaken for the controlling disclosure.</small></div>:<q>{r.evidenceQuote||"No short evidence quote recorded."}</q>}</td><td><button onClick={()=>openRow(r)}>{selected?.id===r.id?"Close":r.score===null?"Compare versions":"View original"}</button></td></tr>{selected?.id===r.id&&<tr className="financing-inline-detail-row"><td colSpan={6}><InlineBrandDetail row={r} detail={detail} loading={detailLoading} onClose={()=>{setSelected(null);setDetail(null)}}/></td></tr>}</Fragment>)}</tbody></table></div>}
  {!loading&&!error&&mode==="changes"&&<div className="financing-table-wrap"><table className="financing-evidence-table financing-change-table"><thead><tr><th>Franchise system</th><th>Years</th><th>Score change</th><th>Before</th><th>After</th><th/></tr></thead><tbody>{(visible as Change[]).map(r=><tr key={r.id}><td><strong>{displayBrand(r.chainId,r.brand)}</strong><small>{r.chainId}</small></td><td>{r.fromYear} → {r.toYear}</td><td><span className={r.scoreChange>0?"financing-change-up":"financing-change-down"}>{r.fromScore} → {r.toScore}</span><small>{r.changeType}</small></td><td><strong>{joined(r.fromForms)}</strong><q>{r.fromQuote}</q></td><td><strong>{joined(r.toForms)}</strong><q>{r.toQuote}</q></td><td><button onClick={()=>openChange(r)}>Compare text</button></td></tr>)}</tbody></table></div>}
  <Pager page={p} pages={pages} setPage={setPage}/>{detailLoading&&selectedChange&&<div className="financing-loading">Loading comparison text…</div>}
  {compare&&selectedChange&&<section className="financing-detail-panel"><header><div><span>WITHIN-FIRM TEXT COMPARISON</span><h3>{displayBrand(selectedChange.chainId,selectedChange.brand)}: {selectedChange.fromYear} → {selectedChange.toYear}</h3><p>Disclosure-text comparison; it does not establish actual take-up or loan use.</p></div><button onClick={()=>{setSelectedChange(null);setCompare(null)}}>Close</button></header><div className="financing-compare-columns"><div><h4>{selectedChange.fromYear} · Score {selectedChange.fromScore}</h4>{compare.before.versions.map((v,i)=><VersionCard key={v.hash} version={v} index={i}/>)}</div><div><h4>{selectedChange.toYear} · Score {selectedChange.toScore}</h4>{compare.after.versions.map((v,i)=><VersionCard key={v.hash} version={v} index={i}/>)}</div></div></section>}
 </div>
}