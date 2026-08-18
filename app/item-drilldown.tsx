"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { itemLabels } from "./data";

type EvidenceQuote = {
  quote: string;
  page: number | null;
  claimedPage?: number | null;
  verified: boolean;
  method: string;
};

type AtomicChangeType = "introduced" | "modified" | "removed" | "reclassified";
type EconomicBurdenFilter = "all" | "increase" | "decrease";
type ControlShiftFilter = "all" | "toward_franchisor" | "toward_franchisee";

type AtomicChange = {
  id: string;
  clauseId: string;
  variableCode: string;
  variableFamily: string;
  variableName: string;
  subclauseLabel: string;
  rawChangeType: string;
  changeType: AtomicChangeType;
  changeTypeLabel: string;
  measurementType: string;
  oldValue: string;
  newValue: string;
  numericDirection: string;
  economicBurdenDirection: string;
  controlShift: string;
  performanceDirection: string;
  actor: string;
  affectedParty: string;
  financingType: string;
  bindingStatus: string;
  oldEvidence: EvidenceQuote[];
  newEvidence: EvidenceQuote[];
  score: number;
  reason: string;
  outcomeReady: boolean;
  needsReview: boolean;
  reviewReason: string;
  inferenceLimit: string;
};

type ComparisonRow = {
  route?: "consecutive" | "cross-period";
  id: string;
  pairId: string;
  company: string;
  oldYear: number;
  newYear: number;
  yearGap: number;
  oldSource: string;
  newSource: string;
  item: number;
  itemTitle: string;
  score: number;
  substantive: boolean;
  contractual: boolean;
  routine: boolean;
  direction: string;
  summary: string;
  needsReview: boolean;
  reviewReason: string;
  oldDocument: string;
  newDocument: string;
  oldPages: [number | null, number | null];
  newPages: [number | null, number | null];
  atomicChangeCount?: number;
  outcomeReadyAtomicChanges?: number;
  reviewRequiredAtomicChanges?: number;
  highImpactAtomicChanges?: number;
  changeTypeCounts?: Record<AtomicChangeType, number>;
  atomicChanges?: AtomicChange[];
  comparisonComplete?: boolean;
  stable?: boolean;
};

type Dataset = {
  metadata: {
    route: string;
    comparisons: number;
    uniquePairs: number;
    items: number[];
    rowsPerItem: Record<string, number>;
    includesNoChange: boolean;
    preparedJobs?: number;
    exportedJobs?: number;
    completeComparisons?: number;
    atomicChanges?: number;
    outcomeReadyAtomicChanges?: number;
    reviewRequiredAtomicChanges?: number;
  };
  rows: ComparisonRow[];
};

type DatasetIndex = {
  metadata: Dataset["metadata"];
  files: string[];
  caseFiles?: string[];
};

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const changeTypeLabels: Record<AtomicChangeType, string> = {
  introduced: "新增",
  modified: "修改",
  removed: "删除",
  reclassified: "重新分类",
};

function matchesAtomic(
  atomic: AtomicChange,
  changeType: "all" | AtomicChangeType,
  burden: EconomicBurdenFilter,
  control: ControlShiftFilter,
) {
  return (changeType === "all" || atomic.changeType === changeType)
    && (burden === "all" || atomic.economicBurdenDirection === burden)
    && (control === "all" || atomic.controlShift === control);
}

function resultLabel(row: ComparisonRow, route: "consecutive" | "cross-period") {
  if (row.score === 0) return "No change";
  if (route === "consecutive" && row.score >= 4) return "High-impact";
  if (row.substantive && row.contractual && row.score >= 4) return "Major contractual";
  if (row.substantive) return "Substantive";
  if (row.routine) return "Routine update";
  return "Minor / descriptive";
}

function resultClass(row: ComparisonRow, route: "consecutive" | "cross-period") {
  if (row.score === 0) return "outcome-none";
  if (route === "consecutive" && row.score >= 4) return "outcome-major";
  if (row.substantive && row.contractual && row.score >= 4) return "outcome-major";
  if (row.substantive) return "outcome-substantive";
  if (row.routine) return "outcome-routine";
  return "outcome-minor";
}

function ScoreScale({ score }: { score: number }) {
  return (
    <span className="score-dots" aria-label={`Change score ${score} out of 5`}>
      {[1, 2, 3, 4, 5].map((value) => (
        <span key={value} className={value <= score ? "dot filled" : "dot"} />
      ))}
    </span>
  );
}

function evidencePages(evidence: EvidenceQuote[]): [number | null, number | null] {
  const pages = evidence.flatMap((entry) => entry.page == null ? [] : [entry.page]);
  return pages.length ? [Math.min(...pages), Math.max(...pages)] : [null, null];
}

function pageRangeLabel(range: [number | null, number | null]) {
  const [start, end] = range;
  if (start == null) return "Page unavailable";
  return end != null && end !== start ? `PDF pp. ${start}–${end}` : `PDF p. ${start}`;
}

function EvidenceSide({
  label,
  year,
  document,
  evidence,
}: {
  label: string;
  year: number;
  document: string;
  evidence: EvidenceQuote[];
}) {
  const pages = evidencePages(evidence);
  return (
    <article className="drill-evidence-side">
      <div className="drill-document-head"><span>{label}</span><strong>{year}</strong></div>
      <p className="drill-document-name">{document || "Filename unavailable"}</p>
      <p className="drill-page-range">{pageRangeLabel(pages)}</p>
      {evidence.length ? (
        <div className="drill-quotes">
          {evidence.map((entry, index) => (
            <blockquote key={`${entry.page}-${index}`}>
              <mark>{entry.quote}</mark>
              <footer>
                <span>{entry.page != null ? `PDF p. ${entry.page}` : "Page not verified"}</span>
                <span className={entry.verified ? "verified" : "unverified"}>
                  {entry.verified ? "✓ evidence matched" : "○ source check pending"}
                </span>
              </footer>
            </blockquote>
          ))}
        </div>
      ) : <div className="no-quote-note">No quotation is available for this side.</div>}
    </article>
  );
}

function AtomicChangeCard({ row, atomic }: { row: ComparisonRow; atomic: AtomicChange }) {
  return (
    <article className={`atomic-change-card atomic-change-${atomic.changeType}`}>
      <header className="atomic-change-header">
        <div>
          <span className={`atomic-change-chip change-type-${atomic.changeType}`}>{changeTypeLabels[atomic.changeType]}</span>
          {atomic.outcomeReady ? <span className="atomic-ready-chip">outcome-ready</span> : null}
          {atomic.needsReview ? <span className="atomic-review-chip">review flagged</span> : null}
        </div>
        <div><ScoreScale score={atomic.score} /><strong>{atomic.score}/5</strong></div>
      </header>

      <div className="atomic-change-title">
        <p>{atomic.variableFamily || "atomic variable"}</p>
        <h4>{atomic.variableName || atomic.variableCode || atomic.clauseId}</h4>
        {atomic.subclauseLabel ? <span>{atomic.subclauseLabel}</span> : null}
      </div>

      <div className="atomic-value-grid">
        <div><span>OLD VALUE · {row.oldYear}</span><p>{atomic.oldValue || "Not present / not separately reported"}</p></div>
        <div className="atomic-value-arrow" aria-hidden="true">→</div>
        <div><span>NEW VALUE · {row.newYear}</span><p>{atomic.newValue || "Not present / not separately reported"}</p></div>
      </div>

      <div className="drill-document-grid atomic-evidence-grid">
        <EvidenceSide label="OLD EVIDENCE" year={row.oldYear} document={row.oldDocument} evidence={atomic.oldEvidence ?? []} />
        <div className="drill-change-arrow" aria-hidden="true">→</div>
        <EvidenceSide label="NEW EVIDENCE" year={row.newYear} document={row.newDocument} evidence={atomic.newEvidence ?? []} />
      </div>

      <dl className="atomic-meta-grid">
        <div><dt>Measurement</dt><dd>{atomic.measurementType || "not specified"}</dd></div>
        <div><dt>Economic burden</dt><dd>{atomic.economicBurdenDirection || "not applicable"}</dd></div>
        <div><dt>Control shift</dt><dd>{atomic.controlShift || "not applicable"}</dd></div>
        <div><dt>Binding status</dt><dd>{atomic.bindingStatus || "not specified"}</dd></div>
        <div><dt>Actor</dt><dd>{atomic.actor || "not specified"}</dd></div>
        <div><dt>Affected party</dt><dd>{atomic.affectedParty || "not specified"}</dd></div>
      </dl>

      {atomic.reason ? <div className="atomic-reason"><strong>WHY THIS WAS CODED AS A CHANGE</strong><p>{atomic.reason}</p></div> : null}
      {atomic.needsReview ? <div className="review-warning"><strong>ATOMIC REVIEW FLAG</strong><p>{atomic.reviewReason || "This candidate requires review before research use."}</p></div> : null}
      {atomic.inferenceLimit ? <div className="review-warning review-ambiguity"><strong>INFERENCE LIMIT</strong><p>{atomic.inferenceLimit}</p></div> : null}
    </article>
  );
}

function useItemDataset(route: "consecutive" | "cross-period", item: number) {
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const directory = route === "consecutive" ? "consecutive" : "cross-period";
    fetch(`${BASE_PATH}/data/${directory}/index.json`)
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json() as Promise<DatasetIndex>;
      })
      .then(async (index) => {
        const prefix = `item-${String(item).padStart(2, "0")}`;
        const files = index.files.filter((filename) => filename.startsWith(prefix));
        const parts = await Promise.all(files.map(async (filename) => {
          const response = await fetch(`${BASE_PATH}/data/${directory}/${filename}`);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          return response.json() as Promise<{ rows: ComparisonRow[] }>;
        }));
        if (active) setDataset({ metadata: index.metadata, rows: parts.flatMap((part) => part.rows) });
      })
      .catch(() => active && setError("The comparison dataset could not be loaded."));
    return () => { active = false; };
  }, [route, item]);

  return { dataset, error };
}

export function ItemDrilldown() {
  const params = useSearchParams();
  const selectedRoute: "consecutive" | "cross-period" = params.get("route") === "consecutive" ? "consecutive" : "cross-period";
  const item = Number(params.get("item") ?? 6);
  const pairFilter = params.get("case") ?? "";
  const requestedChangeType = params.get("changeType") ?? "all";
  const initialChangeType: "all" | AtomicChangeType = ["introduced", "modified", "removed", "reclassified"].includes(requestedChangeType)
    ? requestedChangeType as AtomicChangeType
    : "all";

  const { dataset, error } = useItemDataset(selectedRoute, item);
  const [query, setQuery] = useState("");
  const [outcome, setOutcome] = useState("all");
  const [changeType, setChangeType] = useState<"all" | AtomicChangeType>(initialChangeType);
  const [burden, setBurden] = useState<EconomicBurdenFilter>("all");
  const [control, setControl] = useState<ControlShiftFilter>("all");
  const [sort, setSort] = useState("score-desc");
  const [shown, setShown] = useState(30);

  const rows = useMemo(() => dataset?.rows.filter((row) => row.item === item) ?? [], [dataset, item]);

  const counts = useMemo(() => {
    const change = { introduced: 0, modified: 0, removed: 0, reclassified: 0 } as Record<AtomicChangeType, number>;
    const burdenCounts = { increase: 0, decrease: 0 };
    const controlCounts = { toward_franchisor: 0, toward_franchisee: 0 };
    let atomic = 0;
    rows.forEach((row) => (row.atomicChanges ?? []).forEach((a) => {
      atomic += 1;
      change[a.changeType] += 1;
      if (a.economicBurdenDirection === "increase") burdenCounts.increase += 1;
      if (a.economicBurdenDirection === "decrease") burdenCounts.decrease += 1;
      if (a.controlShift === "toward_franchisor") controlCounts.toward_franchisor += 1;
      if (a.controlShift === "toward_franchisee") controlCounts.toward_franchisee += 1;
    }));
    return { atomic, change, burden: burdenCounts, control: controlCounts };
  }, [rows]);

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    const atomicFilterActive = changeType !== "all" || burden !== "all" || control !== "all";
    return rows
      .filter((row) => !pairFilter || row.pairId === pairFilter)
      .filter((row) => !atomicFilterActive || (row.atomicChanges ?? []).some((atomic) => matchesAtomic(atomic, changeType, burden, control)))
      .filter((row) => !term
        || row.company.toLowerCase().includes(term)
        || row.id.toLowerCase().includes(term)
        || row.summary.toLowerCase().includes(term)
        || (row.atomicChanges ?? []).some((atomic) => [
          atomic.variableName,
          atomic.variableCode,
          atomic.oldValue,
          atomic.newValue,
          atomic.reason,
          atomic.economicBurdenDirection,
          atomic.controlShift,
        ].some((value) => (value ?? "").toLowerCase().includes(term))))
      .filter((row) => {
        if (outcome === "none") return row.score === 0;
        if (outcome === "substantive") return row.substantive;
        if (outcome === "ready") return (row.atomicChanges ?? []).some((atomic) => atomic.outcomeReady);
        if (outcome === "major") return selectedRoute === "consecutive"
          ? row.score >= 4
          : (row.atomicChanges ?? []).some((atomic) => atomic.outcomeReady && atomic.score >= 4);
        if (outcome === "review") return row.needsReview || (row.atomicChanges ?? []).some((atomic) => atomic.needsReview);
        return true;
      })
      .sort((a, b) => {
        if (sort === "company") return a.company.localeCompare(b.company);
        if (sort === "year") return b.newYear - a.newYear || a.company.localeCompare(b.company);
        return b.score - a.score || a.company.localeCompare(b.company);
      });
  }, [rows, pairFilter, query, outcome, changeType, burden, control, sort, selectedRoute]);

  if (error) return <p className="empty-state">{error}</p>;
  if (!dataset) return <p className="empty-state">Loading all Item comparisons…</p>;

  const itemTitle = itemLabels[item] ?? rows[0]?.itemTitle ?? "FDD Item";
  const isConsecutive = selectedRoute === "consecutive";
  const reviewCount = rows.filter((row) => row.needsReview || (row.atomicChanges ?? []).some((atomic) => atomic.needsReview)).length;
  const visibleAtomicCount = visible.reduce((sum, row) => sum + (row.atomicChanges ?? []).filter((atomic) => matchesAtomic(atomic, changeType, burden, control)).length, 0);
  const majorCount = rows.filter((row) => isConsecutive ? row.score >= 4 : row.substantive && row.contractual && row.score >= 4).length;

  return (
    <section className="item-drilldown-shell">
      <div className="item-drilldown-summary">
        <div>
          <p className="eyebrow">COMPANY-LEVEL EVIDENCE</p>
          <h1>Item {String(item).padStart(2, "0")} · {itemTitle}</h1>
          <p>逐条查看公司—年份比较及 atomic changes。变化类型、franchisee economic burden 和 control shift 可组合筛选。</p>
        </div>
        <div className="drilldown-metrics">
          <div><strong>{rows.length}</strong><span>{isConsecutive ? "included change jobs" : "all comparisons"}</span></div>
          <div><strong>{counts.atomic.toLocaleString()}</strong><span>atomic changes</span></div>
          <div><strong>{majorCount}</strong><span>high-impact comparisons</span></div>
          <div><strong>{isConsecutive ? dataset.metadata.completeComparisons ?? "—" : reviewCount}</strong><span>{isConsecutive ? "complete route-wide comparisons" : "review-flagged comparisons"}</span></div>
        </div>
      </div>

      <div className="drilldown-controls">
        <label className="search-box results-search">
          <span aria-hidden="true">⌕</span>
          <input value={query} onChange={(event) => { setQuery(event.target.value); setShown(30); }} placeholder="Search company, variable, value or analysis ID" aria-label="Search company comparisons and atomic changes" />
        </label>

        <label className="select-control">
          <span>结果类型</span>
          <select value={outcome} onChange={(event) => { setOutcome(event.target.value); setShown(30); }}>
            <option value="all">{isConsecutive ? "全部纳入变化" : "全部（含无变化）"}</option>
            {!isConsecutive ? <option value="none">Score 0 / 无变化</option> : null}
            <option value="substantive">实质变化</option>
            {!isConsecutive ? <option value="ready">至少一条 outcome-ready change</option> : null}
            <option value="major">高影响变化（score 4–5）</option>
            <option value="review">质量复核标记（{reviewCount}）</option>
          </select>
        </label>

        <label className="select-control">
          <span>Change type</span>
          <select value={changeType} onChange={(event) => { setChangeType(event.target.value as "all" | AtomicChangeType); setShown(30); }}>
            <option value="all">全部类型（{counts.atomic.toLocaleString()}）</option>
            <option value="introduced">新增（{counts.change.introduced.toLocaleString()}）</option>
            <option value="modified">修改（{counts.change.modified.toLocaleString()}）</option>
            <option value="removed">删除（{counts.change.removed.toLocaleString()}）</option>
            <option value="reclassified">重新分类（{counts.change.reclassified.toLocaleString()}）</option>
          </select>
        </label>

        <label className="select-control">
          <span>Economic burden</span>
          <select value={burden} onChange={(event) => { setBurden(event.target.value as EconomicBurdenFilter); setShown(30); }}>
            <option value="all">全部方向</option>
            <option value="increase">Franchisee burden 增加（{counts.burden.increase.toLocaleString()}）</option>
            <option value="decrease">Franchisee burden 减少（{counts.burden.decrease.toLocaleString()}）</option>
          </select>
        </label>

        <label className="select-control">
          <span>Control shift</span>
          <select value={control} onChange={(event) => { setControl(event.target.value as ControlShiftFilter); setShown(30); }}>
            <option value="all">全部方向</option>
            <option value="toward_franchisor">Toward franchisor（{counts.control.toward_franchisor.toLocaleString()}）</option>
            <option value="toward_franchisee">Toward franchisee（{counts.control.toward_franchisee.toLocaleString()}）</option>
          </select>
        </label>

        <label className="select-control">
          <span>排序</span>
          <select value={sort} onChange={(event) => { setSort(event.target.value); setShown(30); }}>
            <option value="score-desc">评分从高到低</option>
            <option value="company">公司名称</option>
            <option value="year">较新年份</option>
          </select>
        </label>
      </div>

      {pairFilter ? <div className="active-filter-note">Showing one selected company-year pair. <Link href={`/items?route=${selectedRoute}&item=${item}`}>Clear company filter</Link></div> : null}
      {(changeType !== "all" || burden !== "all" || control !== "all") ? (
        <div className="active-filter-note change-type-active-note">
          Atomic filters: <strong>{[
            changeType !== "all" ? changeTypeLabels[changeType] : "",
            burden !== "all" ? `burden = ${burden}` : "",
            control !== "all" ? `control = ${control}` : "",
          ].filter(Boolean).join(" · ")}</strong>
        </div>
      ) : null}

      <div className="comparison-count">
        <strong>{visible.length}</strong> of {rows.length} {isConsecutive ? "included change jobs" : "comparisons"} match · <strong>{visibleAtomicCount.toLocaleString()}</strong> matching atomic changes
      </div>

      <div className="comparison-accordion">
        {visible.slice(0, shown).map((row) => {
          const matchingAtomics = (row.atomicChanges ?? []).filter((atomic) => matchesAtomic(atomic, changeType, burden, control));
          const displayedAtomics = (changeType === "all" && burden === "all" && control === "all") ? (row.atomicChanges ?? []) : matchingAtomics;
          const dynamicTypeCounts = displayedAtomics.reduce((acc, atomic) => {
            acc[atomic.changeType] += 1;
            return acc;
          }, { introduced: 0, modified: 0, removed: 0, reclassified: 0 } as Record<AtomicChangeType, number>);
          return (
            <details className="comparison-detail" key={row.id}>
              <summary>
                <span className={`score-box ${resultClass(row, selectedRoute)}`}>{row.score}</span>
                <span className="comparison-company"><strong>{row.company}</strong><small>{row.oldYear} → {row.newYear} · {row.oldSource === row.newSource ? row.oldSource : `${row.oldSource}/${row.newSource}`}</small></span>
                <span className={`outcome-chip ${resultClass(row, selectedRoute)}`}>{resultLabel(row, selectedRoute)}</span>
                <span className="comparison-change-types">
                  {(["introduced", "modified", "removed", "reclassified"] as AtomicChangeType[])
                    .filter((type) => dynamicTypeCounts[type] > 0)
                    .map((type) => <i key={type} className={`change-type-${type}`}>{changeTypeLabels[type]} {dynamicTypeCounts[type]}</i>)}
                </span>
                <span className="comparison-summary-line">{row.summary}</span>
                <span className="detail-chevron">⌄</span>
              </summary>

              <div className="comparison-detail-body">
                <div className="comparison-detail-meta">
                  <span>{row.id}</span><span>{row.yearGap}-year gap</span><span>{displayedAtomics.length} shown / {row.atomicChangeCount ?? 0} atomic changes</span>
                </div>
                <div className="comparison-interpretation atomic-comparison-intro">
                  <div><span className={`outcome-chip ${resultClass(row, selectedRoute)}`}>{resultLabel(row, selectedRoute)}</span><h3>{row.summary}</h3></div>
                  <dl>
                    <div><dt>Outcome-ready atoms</dt><dd>{row.outcomeReadyAtomicChanges ?? 0}</dd></div>
                    <div><dt>Review-flagged atoms</dt><dd>{row.reviewRequiredAtomicChanges ?? 0}</dd></div>
                    <div><dt>Comparison scope</dt><dd>{row.comparisonComplete === false ? "Incomplete" : "Complete"}</dd></div>
                  </dl>
                </div>

                {displayedAtomics.length ? <div className="atomic-change-list">{displayedAtomics.map((atomic) => <AtomicChangeCard key={atomic.id} row={row} atomic={atomic} />)}</div> : (
                  <div className="no-atomic-change"><strong>No atomic changes match this filter.</strong><p>{row.summary}</p></div>
                )}
                {row.needsReview ? <div className="review-warning"><strong>JOB-LEVEL QUALITY REVIEW</strong><p>{row.reviewReason || "This comparison has a review flag."}</p></div> : null}
              </div>
            </details>
          );
        })}
      </div>

      {shown < visible.length ? <button className="load-more-button" type="button" onClick={() => setShown((value) => value + 30)}>Load 30 more ({visible.length - shown} remaining)</button> : null}
      {visible.length === 0 ? <p className="empty-state">No company comparisons match the current filters.</p> : null}
    </section>
  );
}
