"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { cases, itemLabels } from "./data";

type EvidenceQuote = {
  quote: string;
  page: number | null;
  claimedPage: number | null;
  verified: boolean;
  method: string;
};

export type ComparisonRow = {
  route?: "consecutive" | "cross-period";
  id: string;
  pairId: string;
  company: string;
  oldYear: number;
  newYear: number;
  yearGap: number;
  oldSource: string;
  newSource: string;
  sameSource: boolean;
  item: number;
  itemTitle: string;
  score: number;
  substantive: boolean;
  contractual: boolean;
  routine: boolean;
  direction: string;
  summary: string;
  statedReason: string;
  confidence: string;
  needsReview: boolean;
  reviewReason: string;
  evidenceStatus: string;
  evidenceGatePass: boolean;
  oldDocument: string;
  newDocument: string;
  oldPages: [number | null, number | null];
  newPages: [number | null, number | null];
  oldEvidence: EvidenceQuote[];
  newEvidence: EvidenceQuote[];
  samplingWeight: number | null;
  samplingStratum: string;
  inSbaDirectory: boolean;
  replacement: boolean;
  replacementLevel: string;
  financingGuardrailPass: boolean;
  financingWarnings: string;
  scoringSource: string;
  model: string;
};

type Dataset = {
  metadata: {
    route: string;
    comparisons: number;
    uniquePairs: number;
    items: number[];
    rowsPerItem: Record<string, number>;
    includesNoChange: boolean;
  };
  rows: ComparisonRow[];
};

type DatasetIndex = {
  metadata: Dataset["metadata"];
  files: string[];
};

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

function applyHumanValidation(row: ComparisonRow): ComparisonRow {
  const curatedCase = cases.find((entry) => entry.analysisId === row.pairId);
  const curatedItem = curatedCase?.items.find((entry) => entry.item === row.item);
  if (!curatedCase || !curatedItem) return row;
  const convert = (entry: { quote: string; page: number; verified: boolean }): EvidenceQuote => ({
    quote: entry.quote,
    page: entry.page,
    claimedPage: entry.page,
    verified: entry.verified,
    method: entry.verified ? "human_pdf_verified" : "manual_page_check",
  });
  return {
    ...row,
    score: curatedItem.score,
    substantive: curatedItem.substantive,
    contractual: curatedItem.contractual,
    routine: false,
    direction: curatedItem.direction,
    summary: curatedItem.summary,
    needsReview: curatedItem.status !== "verified",
    reviewReason: curatedItem.note ?? "Human-validated interpretation; review any quotation marked for page checking.",
    evidenceStatus: curatedItem.status === "verified" ? "human_pdf_verified" : "human_validated",
    oldDocument: curatedCase.oldDocument,
    newDocument: curatedCase.newDocument,
    oldEvidence: curatedItem.oldEvidence.map(convert),
    newEvidence: curatedItem.newEvidence.map(convert),
  };
}

function useDataset(route: "consecutive" | "cross-period") {
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
        const parts = await Promise.all(index.files.map(async (filename) => {
          const response = await fetch(`${BASE_PATH}/data/${directory}/${filename}`);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          return response.json() as Promise<{ rows: ComparisonRow[] }>;
        }));
        if (active) setDataset({
          metadata: index.metadata,
          rows: parts.flatMap((part) => part.rows).map(applyHumanValidation),
        });
      })
      .catch(() => {
        if (active) setError("The comparison dataset could not be loaded.");
      });
    return () => {
      active = false;
    };
  }, [route]);

  return { dataset, error };
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

function resultLabel(row: ComparisonRow) {
  if (row.score === 0) return "No change";
  if (row.substantive && row.contractual && row.score >= 4) return "Major contractual";
  if (row.substantive) return "Substantive";
  if (row.routine) return "Routine update";
  return "Minor / descriptive";
}

function resultClass(row: ComparisonRow) {
  if (row.score === 0) return "outcome-none";
  if (row.substantive && row.contractual && row.score >= 4) return "outcome-major";
  if (row.substantive) return "outcome-substantive";
  if (row.routine) return "outcome-routine";
  return "outcome-minor";
}

function pageRangeLabel(range: [number | null, number | null]) {
  const [start, end] = range;
  if (start == null) return "Item pages unavailable";
  return end != null && end !== start ? `PDF pp. ${start}–${end}` : `PDF p. ${start}`;
}

function EvidenceSide({
  label,
  year,
  document,
  pages,
  evidence,
  noChange,
}: {
  label: string;
  year: number;
  document: string;
  pages: [number | null, number | null];
  evidence: EvidenceQuote[];
  noChange: boolean;
}) {
  return (
    <article className="drill-evidence-side">
      <div className="drill-document-head">
        <span>{label}</span>
        <strong>{year}</strong>
      </div>
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
                  {entry.verified ? "✓ exact quote verified" : "○ page check required"}
                </span>
              </footer>
            </blockquote>
          ))}
        </div>
      ) : (
        <div className="no-quote-note">
          {noChange
            ? "No evidence quotation was required because the comparison was coded as no change."
            : "No verified quotation is available for this side; use the Item page range for manual review."}
        </div>
      )}
    </article>
  );
}

function ComparisonDetail({ row }: { row: ComparisonRow }) {
  return (
    <div className="comparison-detail-body">
      <div className="comparison-detail-meta">
        <span>{row.id}</span>
        <span>{row.oldSource === row.newSource ? row.oldSource : `${row.oldSource} → ${row.newSource}`}</span>
        <span>{row.yearGap}-year gap</span>
        <span>{row.inSbaDirectory ? "SBA-linked" : "non-SBA"}</span>
        {row.replacement ? <span>quality replacement</span> : null}
      </div>
      <div className="drill-document-grid">
        <EvidenceSide
          label="OLD FDD"
          year={row.oldYear}
          document={row.oldDocument}
          pages={row.oldPages}
          evidence={row.oldEvidence}
          noChange={row.score === 0}
        />
        <div className="drill-change-arrow" aria-hidden="true">→</div>
        <EvidenceSide
          label="NEW FDD"
          year={row.newYear}
          document={row.newDocument}
          pages={row.newPages}
          evidence={row.newEvidence}
          noChange={row.score === 0}
        />
      </div>
      <div className="comparison-interpretation">
        <div>
          <span className={`outcome-chip ${resultClass(row)}`}>{resultLabel(row)}</span>
          <h3>{row.summary}</h3>
          {row.statedReason ? <p><strong>Stated reason:</strong> {row.statedReason}</p> : null}
        </div>
        <dl>
          <div><dt>Direction</dt><dd>{row.direction.replaceAll("_", " ")}</dd></div>
          <div><dt>Substantive</dt><dd>{row.substantive ? "Yes" : "No"}</dd></div>
          <div><dt>Contractual</dt><dd>{row.contractual ? "Yes" : "No"}</dd></div>
          <div><dt>Routine update</dt><dd>{row.routine ? "Yes" : "No"}</dd></div>
          <div><dt>Evidence</dt><dd>{row.evidenceStatus.replaceAll("_", " ")}</dd></div>
          <div><dt>Review</dt><dd>{row.needsReview ? "Required" : "Not flagged"}</dd></div>
        </dl>
      </div>
      {row.needsReview && row.reviewReason ? (
        <p className="review-warning"><strong>Human review flag:</strong> {row.reviewReason}</p>
      ) : null}
    </div>
  );
}

export function ItemDrilldown() {
  const searchParams = useSearchParams();
  const route = searchParams.get("route") ?? "cross-period";
  const item = Number(searchParams.get("item") ?? 6);
  const pairFilter = searchParams.get("case") ?? "";
  const selectedRoute = route === "consecutive" ? "consecutive" : "cross-period";
  const { dataset, error } = useDataset(selectedRoute);
  const [query, setQuery] = useState("");
  const [outcome, setOutcome] = useState("all");
  const [sort, setSort] = useState("score-desc");
  const [shown, setShown] = useState(30);

  useEffect(() => setShown(30), [item, pairFilter, query, outcome, sort]);

  if (error) return <p className="empty-state">{error}</p>;
  if (!dataset) return <p className="empty-state">Loading all Item comparisons…</p>;

  const rows = dataset.rows.filter((row) => row.item === item);
  const term = query.trim().toLowerCase();
  const visible = rows
    .filter((row) => !pairFilter || row.pairId === pairFilter)
    .filter((row) => !term || row.company.toLowerCase().includes(term) || row.id.toLowerCase().includes(term) || row.summary.toLowerCase().includes(term))
    .filter((row) => {
      if (outcome === "none") return row.score === 0;
      if (outcome === "substantive") return row.substantive;
      if (outcome === "major") return row.substantive && row.contractual && row.score >= 4;
      if (outcome === "routine") return row.routine;
      if (outcome === "review") return row.needsReview;
      return true;
    })
    .sort((a, b) => {
      if (sort === "company") return a.company.localeCompare(b.company);
      if (sort === "year") return b.newYear - a.newYear || a.company.localeCompare(b.company);
      return b.score - a.score || a.company.localeCompare(b.company);
    });

  const itemTitle = itemLabels[item] ?? rows[0]?.itemTitle ?? "FDD Item";
  const substantiveCount = rows.filter((row) => row.substantive).length;
  const noChangeCount = rows.filter((row) => row.score === 0).length;
  const majorCount = rows.filter((row) => row.substantive && row.contractual && row.score >= 4).length;

  return (
    <section className="item-drilldown-shell">
      <div className="item-drilldown-summary">
        <div>
          <p className="eyebrow">COMPANY-LEVEL EVIDENCE</p>
          <h1>Item {String(item).padStart(2, "0")} · {itemTitle}</h1>
          <p>Every quality-ready {selectedRoute === "consecutive" ? "consecutive-year" : "cross-period"} comparison is included, including score 0 and no-change cases. Open any company row to see the exact evidence quotes and PDF page locators.</p>
        </div>
        <div className="drilldown-metrics">
          <div><strong>{rows.length}</strong><span>all comparisons</span></div>
          <div><strong>{substantiveCount}</strong><span>substantive</span></div>
          <div><strong>{majorCount}</strong><span>major contractual</span></div>
          <div><strong>{noChangeCount}</strong><span>score 0</span></div>
        </div>
      </div>

      <div className="drilldown-controls">
        <label className="search-box results-search">
          <span aria-hidden="true">⌕</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search company, summary or analysis ID" aria-label="Search company comparisons" />
        </label>
        <label className="select-control">
          <span>结果类型</span>
          <select value={outcome} onChange={(event) => setOutcome(event.target.value)}>
            <option value="all">全部（含无变化）</option>
            <option value="none">Score 0 / 无变化</option>
            <option value="substantive">实质变化</option>
            <option value="major">重大合同变化</option>
            <option value="routine">例行年度更新</option>
            <option value="review">需要人工复核</option>
          </select>
        </label>
        <label className="select-control">
          <span>排序</span>
          <select value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="score-desc">评分从高到低</option>
            <option value="company">公司名称</option>
            <option value="year">较新年份</option>
          </select>
        </label>
      </div>

      {pairFilter ? (
        <div className="active-filter-note">
          Showing one selected company-year pair. <Link href={`/items?route=${selectedRoute}&item=${item}`}>Clear company filter</Link>
        </div>
      ) : null}

      <div className="comparison-count"><strong>{visible.length}</strong> of {rows.length} comparisons match</div>
      <div className="comparison-accordion">
        {visible.slice(0, shown).map((row) => (
          <details className="comparison-detail" key={row.id}>
            <summary>
              <span className={`score-box ${resultClass(row)}`}>{row.score}</span>
              <span className="comparison-company">
                <strong>{row.company}</strong>
                <small>{row.oldYear} → {row.newYear} · {row.oldSource === row.newSource ? row.oldSource : `${row.oldSource}/${row.newSource}`}</small>
              </span>
              <span className={`outcome-chip ${resultClass(row)}`}>{resultLabel(row)}</span>
              <span className="comparison-summary-line">{row.summary}</span>
              <span className="detail-chevron">⌄</span>
            </summary>
            <ComparisonDetail row={row} />
          </details>
        ))}
      </div>
      {shown < visible.length ? (
        <button className="load-more-button" type="button" onClick={() => setShown((value) => value + 30)}>
          Load 30 more ({visible.length - shown} remaining)
        </button>
      ) : null}
      {visible.length === 0 ? <p className="empty-state">No company comparisons match the current filters.</p> : null}
    </section>
  );
}

type GroupedCase = {
  key: string;
  company: string;
  route: "consecutive" | "cross-period";
  oldYear: number;
  newYear: number;
  source: string;
  analysisId: string;
  items: ComparisonRow[];
  maxScore: number;
  featured: string;
  href: string;
};

export function FullCaseLibrary() {
  const { dataset: consecutiveDataset, error: consecutiveError } = useDataset("consecutive");
  const { dataset: crossPeriodDataset, error: crossPeriodError } = useDataset("cross-period");
  const [query, setQuery] = useState("");
  const [route, setRoute] = useState("all");
  const [item, setItem] = useState("all");
  const [score, setScore] = useState("0");
  const [shown, setShown] = useState(30);

  const grouped = useMemo<GroupedCase[]>(() => {
    if (!consecutiveDataset || !crossPeriodDataset) return [];
    const byPair = new Map<string, { route: "consecutive" | "cross-period"; rows: ComparisonRow[] }>();
    ([
      ["consecutive", consecutiveDataset],
      ["cross-period", crossPeriodDataset],
    ] as const).forEach(([rowRoute, sourceDataset]) => sourceDataset.rows.forEach((row) => {
      const key = `${rowRoute}:${row.pairId}`;
      const current = byPair.get(key)?.rows ?? [];
      byPair.set(key, { route: rowRoute, rows: [...current, row] });
    }));
    return Array.from(byPair.entries()).map(([key, group]) => {
      const { route: rowRoute, rows } = group;
      const pairId = rows[0].pairId;
      const ordered = [...rows].sort((a, b) => b.score - a.score || a.item - b.item);
      const top = ordered[0];
      return {
        key,
        company: top.company,
        route: rowRoute,
        oldYear: top.oldYear,
        newYear: top.newYear,
        source: top.oldSource === top.newSource ? top.oldSource : `${top.oldSource}/${top.newSource}`,
        analysisId: pairId,
        items: [...rows].sort((a, b) => a.item - b.item),
        maxScore: top.score,
        featured: top.summary,
        href: `/items?route=${rowRoute}&item=${top.item}&case=${encodeURIComponent(pairId)}`,
      };
    });
  }, [consecutiveDataset, crossPeriodDataset]);

  useEffect(() => setShown(30), [query, route, item, score]);

  if (consecutiveError || crossPeriodError) return <p className="empty-state">{consecutiveError || crossPeriodError}</p>;
  if (!consecutiveDataset || !crossPeriodDataset) return <p className="empty-state">Loading all company cases…</p>;

  const term = query.trim().toLowerCase();
  const allCases = grouped;
  const visible = allCases
    .filter((entry) => route === "all" || entry.route === route)
    .filter((entry) => item === "all" || entry.items.some((row) => row.item === Number(item)))
    .filter((entry) => entry.items.some((row) => row.score >= Number(score)))
    .filter((entry) => !term || entry.company.toLowerCase().includes(term) || entry.analysisId.toLowerCase().includes(term) || entry.items.some((row) => row.itemTitle.toLowerCase().includes(term)))
    .sort((a, b) => b.maxScore - a.maxScore || a.company.localeCompare(b.company));

  const itemOptions = Array.from(new Set(allCases.flatMap((entry) => entry.items.map((row) => row.item)))).sort((a, b) => a - b);

  return (
    <section className="case-library-full">
      <div className="library-controls">
        <label className="search-box results-search">
          <span aria-hidden="true">⌕</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索公司、条款或 analysis ID" aria-label="Search company cases" />
        </label>
        <label className="select-control"><span>分析类型</span><select value={route} onChange={(event) => setRoute(event.target.value)}><option value="all">全部</option><option value="consecutive">连续年变化</option><option value="cross-period">跨期实质变化</option></select></label>
        <label className="select-control"><span>Item</span><select value={item} onChange={(event) => setItem(event.target.value)}><option value="all">全部 Item</option>{itemOptions.map((value) => <option key={value} value={value}>Item {value}</option>)}</select></label>
        <label className="select-control"><span>最低评分</span><select value={score} onChange={(event) => setScore(event.target.value)}><option value="0">全部（含无变化）</option><option value="1">1+</option><option value="3">3+</option><option value="4">4+</option><option value="5">5</option></select></label>
      </div>

      <div className="library-count">
        <strong>{visible.length}</strong> 个公司—年份案例符合筛选条件 · 当前已加载 {grouped.filter((entry) => entry.route === "consecutive").length} 个连续年案例和 {grouped.filter((entry) => entry.route === "cross-period").length} 个跨期案例
      </div>

      <div className="case-card-grid">
        {visible.slice(0, shown).map((entry) => (
          <Link className="case-card" href={entry.href} key={entry.key}>
            <div className="case-card-top">
              <span className={`route-chip route-${entry.route}`}>{entry.route === "consecutive" ? "连续年变化" : "跨期实质变化"}</span>
              <ScoreScale score={entry.maxScore} />
            </div>
            <h2>{entry.company}</h2>
            <p className="case-years">{entry.oldYear} <span>→</span> {entry.newYear} · {entry.source}</p>
            <p className="case-featured">{entry.featured}</p>
            <div className="case-item-pills">
              {entry.items.map((row) => <span key={row.item}>Item {row.item} · {row.score}/5</span>)}
            </div>
            <div className="case-card-footer"><span>{entry.analysisId}</span><strong>查看原文证据 →</strong></div>
          </Link>
        ))}
      </div>
      {shown < visible.length ? <button className="load-more-button" type="button" onClick={() => setShown((value) => value + 30)}>Load 30 more ({visible.length - shown} remaining)</button> : null}
      {visible.length === 0 ? <p className="empty-state">没有符合当前筛选条件的公司案例。</p> : null}
    </section>
  );
}
