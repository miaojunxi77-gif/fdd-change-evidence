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

type AtomicChangeType = "introduced" | "modified" | "removed" | "reclassified";

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
  atomicChangeCount?: number;
  outcomeReadyAtomicChanges?: number;
  reviewRequiredAtomicChanges?: number;
  highImpactAtomicChanges?: number;
  changeTypeCounts?: Record<AtomicChangeType, number>;
  atomicChanges?: AtomicChange[];
  comparisonComplete?: boolean;
  stable?: boolean;
  pipeline?: string;
  inferenceLimit?: string;
};

type Dataset = {
  metadata: {
    route: string;
    comparisons: number;
    uniquePairs: number;
    items: number[];
    rowsPerItem: Record<string, number>;
    includesNoChange: boolean;
    unit?: string;
    preparedJobs?: number;
    exportedJobs?: number;
    completeComparisons?: number;
    atomicChanges?: number;
    highImpactChangeJobs?: number;
    outcomeReadyChangeJobs?: number;
    highImpactReadyChangeJobs?: number;
    outcomeReadyAtomicChanges?: number;
    reviewRequiredAtomicChanges?: number;
    model?: string;
    note?: string;
  };
  rows: ComparisonRow[];
};

type DatasetIndex = {
  metadata: Dataset["metadata"];
  files: string[];
  caseFiles?: string[];
};

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

function applyHumanValidation(row: ComparisonRow): ComparisonRow {
  if (row.model.startsWith("deepseek")) return row;
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

function useDataset(route: "consecutive" | "cross-period", selectedItem?: number) {
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
        const files = selectedItem
          ? index.files.filter((filename) => filename.startsWith(`item-${String(selectedItem).padStart(2, "0")}`))
          : index.caseFiles ?? index.files;
        const parts = await Promise.all(files.map(async (filename) => {
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
  }, [route, selectedItem]);

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
  if (row.route === "consecutive" && row.score >= 4) return "High-impact";
  if (row.substantive && row.contractual && row.score >= 4) return "Major contractual";
  if (row.substantive) return "Substantive";
  if (row.routine) return "Routine update";
  return "Minor / descriptive";
}

function resultClass(row: ComparisonRow) {
  if (row.score === 0) return "outcome-none";
  if (row.route === "consecutive" && row.score >= 4) return "outcome-major";
  if (row.substantive && row.contractual && row.score >= 4) return "outcome-major";
  if (row.substantive) return "outcome-substantive";
  if (row.routine) return "outcome-routine";
  return "outcome-minor";
}

type QualityReviewKind = "evidence" | "financing" | "text" | "segmentation" | "ambiguity";

function qualityReviewInfo(row: ComparisonRow): {
  kind: QualityReviewKind;
  label: string;
  detail: string;
} {
  const recordedReason = row.reviewReason.trim();
  const normalizedReason = recordedReason.toLowerCase();

  if (!row.evidenceGatePass || row.evidenceStatus === "no_verified_evidence") {
    return {
      kind: "evidence",
      label: "引文未通过自动核验",
      detail: "模型判断不一定错误，但引文未能精确匹配回提取文本或页码；正式使用前应核对旧、新 FDD 的指定页码。",
    };
  }

  if (["wrong exhibit", "assembly", "different sections", "segmentation", "misaligned", "category mismatch", "table-of-contents"].some((term) => normalizedReason.includes(term))) {
    return {
      kind: "segmentation",
      label: "Item 切分或文档错位",
      detail: recordedReason || "提取内容可能来自错误的 Item、附件或页面，不能直接作为条款变化使用。",
    };
  }

  if (["ocr", "corrupt", "unintelligible", "garbled", "typo"].some((term) => normalizedReason.includes(term))) {
    return {
      kind: "text",
      label: "OCR 或数字识别歧义",
      detail: recordedReason || "提取文字或数字可能被 OCR 错误识别，需要查看原始页面。",
    };
  }

  if (["incomplete", "truncated", "missing", "only a header", "zero text"].some((term) => normalizedReason.includes(term))) {
    return {
      kind: "text",
      label: "文本缺失或截断",
      detail: recordedReason || "至少一侧 Item 文本不完整，需要重新提取或查看原始页面。",
    };
  }

  if (recordedReason) {
    return {
      kind: "ambiguity",
      label: "内容含义需要确认",
      detail: recordedReason,
    };
  }

  if (row.item === 10 && !row.financingGuardrailPass) {
    return {
      kind: "financing",
      label: "Item 10 融资判定保护规则",
      detail: "文本可能涉及个人担保、银行或第三方融资，而非特许人或其关联方直接提供融资；需要按原文确认融资提供者。",
    };
  }

  return {
    kind: "ambiguity",
    label: "内容含义需要确认",
    detail: recordedReason || "结构化质量检查触发了保守复核标记；该标记不等于结果已被判定错误。",
  };
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
                  {entry.method === "human_pdf_verified"
                    ? "✓ source PDF verified"
                    : entry.verified
                      ? "✓ matched in extracted Item text"
                      : "○ exported page locator; source check pending"}
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

const atomicChangeLabels: Record<AtomicChangeType, string> = {
  introduced: "新增",
  modified: "修改",
  removed: "删除",
  reclassified: "重新分类",
};

function evidencePageRange(evidence: EvidenceQuote[]): [number | null, number | null] {
  const pages = evidence.flatMap((entry) => entry.page == null ? [] : [entry.page]);
  return pages.length ? [Math.min(...pages), Math.max(...pages)] : [null, null];
}

function AtomicChangeCard({ row, atomic }: { row: ComparisonRow; atomic: AtomicChange }) {
  const oldPages = evidencePageRange(atomic.oldEvidence);
  const newPages = evidencePageRange(atomic.newEvidence);
  return (
    <article className={`atomic-change-card atomic-change-${atomic.changeType}`}>
      <header className="atomic-change-header">
        <div>
          <span className={`atomic-change-chip change-type-${atomic.changeType}`}>{atomicChangeLabels[atomic.changeType]}</span>
          {atomic.rawChangeType === "not_comparable" ? <span className="atomic-raw-chip">raw: not_comparable</span> : null}
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
        <EvidenceSide label="OLD EVIDENCE" year={row.oldYear} document={row.oldDocument} pages={oldPages} evidence={atomic.oldEvidence} noChange={false} />
        <div className="drill-change-arrow" aria-hidden="true">→</div>
        <EvidenceSide label="NEW EVIDENCE" year={row.newYear} document={row.newDocument} pages={newPages} evidence={atomic.newEvidence} noChange={false} />
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
      {atomic.rawChangeType === "not_comparable" ? <div className="atomic-taxonomy-note">The measurement basis changed, so the raw values are not directly comparable. The four-category website taxonomy displays this as 修改 while preserving the original model label.</div> : null}
      {atomic.needsReview ? <div className="review-warning"><strong>ATOMIC REVIEW FLAG</strong><p>{atomic.reviewReason || "This candidate requires substantive review before research use."}</p></div> : null}
      {atomic.inferenceLimit ? <div className="review-warning review-ambiguity"><strong>INFERENCE LIMIT</strong><p>{atomic.inferenceLimit}</p></div> : null}
    </article>
  );
}

function ComparisonDetail({ row, changeType }: { row: ComparisonRow; changeType: "all" | AtomicChangeType }) {
  const reviewInfo = qualityReviewInfo(row);
  const atomics = (row.atomicChanges ?? []).filter((atomic) => changeType === "all" || atomic.changeType === changeType);

  return (
    <div className="comparison-detail-body">
      <div className="comparison-detail-meta">
        <span>{row.id}</span>
        <span>{row.oldSource === row.newSource ? row.oldSource : `${row.oldSource} → ${row.newSource}`}</span>
        <span>{row.yearGap}-year gap</span>
        <span>{row.model || "model unavailable"}</span>
        <span>{atomics.length} shown / {row.atomicChangeCount ?? 0} atomic changes</span>
      </div>

      <div className="comparison-interpretation atomic-comparison-intro">
        <div><span className={`outcome-chip ${resultClass(row)}`}>{resultLabel(row)}</span><h3>{row.summary}</h3></div>
        <dl>
          <div><dt>Outcome-ready atoms</dt><dd>{row.outcomeReadyAtomicChanges ?? 0}</dd></div>
          <div><dt>Review-flagged atoms</dt><dd>{row.reviewRequiredAtomicChanges ?? 0}</dd></div>
          <div><dt>Comparison scope</dt><dd>{row.comparisonComplete === false ? "Incomplete" : "Complete"}</dd></div>
          <div><dt>Pipeline</dt><dd>{row.pipeline || "cleaned export"}</dd></div>
        </dl>
      </div>

      {atomics.length ? <div className="atomic-change-list">{atomics.map((atomic) => <AtomicChangeCard key={atomic.id} row={row} atomic={atomic} />)}</div> : (
        <div className="no-atomic-change">
          <strong>No atomic changes match this filter.</strong>
          <p>{row.stable ? row.summary : "Try another change type or clear the filter."}</p>
        </div>
      )}

      {row.needsReview ? <div className={`review-warning review-${reviewInfo.kind}`}><strong>JOB-LEVEL QUALITY REVIEW · {reviewInfo.label}</strong><p>{reviewInfo.detail}</p></div> : null}
    </div>
  );
}

export function ItemDrilldown() {
  const searchParams = useSearchParams();
  const route = searchParams.get("route") ?? "cross-period";
  const item = Number(searchParams.get("item") ?? 6);
  const pairFilter = searchParams.get("case") ?? "";
  const requestedChangeType = searchParams.get("changeType") ?? "all";
  const initialChangeType: "all" | AtomicChangeType = ["introduced", "modified", "removed", "reclassified"].includes(requestedChangeType)
    ? requestedChangeType as AtomicChangeType
    : "all";
  const selectedRoute = route === "consecutive" ? "consecutive" : "cross-period";
  const { dataset, error } = useDataset(selectedRoute, item);
  const [query, setQuery] = useState("");
  const [outcome, setOutcome] = useState("all");
  const [changeType, setChangeType] = useState<"all" | AtomicChangeType>(initialChangeType);
  const [sort, setSort] = useState("score-desc");
  const [shown, setShown] = useState(30);

  if (error) return <p className="empty-state">{error}</p>;
  if (!dataset) return <p className="empty-state">Loading all Item comparisons…</p>;

  const rows = dataset.rows.filter((row) => row.item === item);
  const term = query.trim().toLowerCase();
  const visible = rows
    .filter((row) => !pairFilter || row.pairId === pairFilter)
    .filter((row) => changeType === "all" || (row.atomicChanges ?? []).some((atomic) => atomic.changeType === changeType))
    .filter((row) => !term
      || row.company.toLowerCase().includes(term)
      || row.id.toLowerCase().includes(term)
      || row.summary.toLowerCase().includes(term)
      || (row.atomicChanges ?? []).some((atomic) => [atomic.variableName, atomic.variableCode, atomic.oldValue, atomic.newValue, atomic.reason].some((value) => value.toLowerCase().includes(term))))
    .filter((row) => {
      if (outcome === "none") return row.score === 0;
      if (outcome === "substantive") return row.substantive;
      if (outcome === "ready") return (row.atomicChanges ?? []).some((atomic) => atomic.outcomeReady);
      if (outcome === "major") return selectedRoute === "consecutive"
        ? row.score >= 4
        : (row.atomicChanges ?? []).some((atomic) => atomic.outcomeReady && atomic.score >= 4);
      if (outcome === "routine") return row.routine;
      if (outcome === "review") return row.needsReview || (row.atomicChanges ?? []).some((atomic) => atomic.needsReview);
      return true;
    })
    .sort((a, b) => {
      if (sort === "company") return a.company.localeCompare(b.company);
      if (sort === "year") return b.newYear - a.newYear || a.company.localeCompare(b.company);
      return b.score - a.score || a.company.localeCompare(b.company);
    });

  const itemTitle = itemLabels[item] ?? rows[0]?.itemTitle ?? "FDD Item";
  const majorCount = rows.filter((row) => selectedRoute === "consecutive" ? row.score >= 4 : row.substantive && row.contractual && row.score >= 4).length;
  const reviewCount = rows.filter((row) => row.needsReview).length;
  const atomicCount = rows.reduce((sum, row) => sum + (row.atomicChangeCount ?? 0), 0);
  const outcomeReadyAtomicCount = rows.reduce((sum, row) => sum + (row.outcomeReadyAtomicChanges ?? 0), 0);
  const reviewAtomicCount = rows.reduce((sum, row) => sum + (row.reviewRequiredAtomicChanges ?? 0), 0);
  const changeTypeCounts = rows.reduce<Record<AtomicChangeType, number>>((counts, row) => {
    (row.atomicChanges ?? []).forEach((atomic) => { counts[atomic.changeType] += 1; });
    return counts;
  }, { introduced: 0, modified: 0, removed: 0, reclassified: 0 });
  const visibleAtomicCount = visible.reduce((sum, row) => sum + (row.atomicChanges ?? []).filter((atomic) => changeType === "all" || atomic.changeType === changeType).length, 0);
  const isConsecutive = selectedRoute === "consecutive";

  return (
    <section className="item-drilldown-shell">
      <div className="item-drilldown-summary">
        <div>
          <p className="eyebrow">COMPANY-LEVEL EVIDENCE</p>
          <h1>Item {String(item).padStart(2, "0")} · {itemTitle}</h1>
          <p>{isConsecutive
            ? "Every final conservative atomic change is retained and explicitly labeled 新增、修改、删除 or 重新分类. Denominator counts, including complete comparisons without an included change, remain in the aggregate table."
            : "Every successful DeepSeek cross-period comparison is retained, including stable cases. Candidate atomic changes preserve outcome-ready and review-required flags from the final audit."}</p>
        </div>
        <div className="drilldown-metrics">
          <div><strong>{rows.length}</strong><span>{isConsecutive ? "included change jobs" : "all comparisons"}</span></div>
          <div><strong>{atomicCount}</strong><span>{isConsecutive ? "final atomic changes" : "candidate atomic changes"}</span></div>
          <div><strong>{isConsecutive ? majorCount : outcomeReadyAtomicCount}</strong><span>{isConsecutive ? "high-impact jobs" : "outcome-ready atoms"}</span></div>
          <div><strong>{isConsecutive ? dataset.metadata.completeComparisons ?? "—" : reviewAtomicCount}</strong><span>{isConsecutive ? "complete route-wide comparisons" : "review-flagged atoms"}</span></div>
        </div>
      </div>

      <div className="drilldown-controls">
        <label className="search-box results-search">
          <span aria-hidden="true">⌕</span>
          <input value={query} onChange={(event) => { setQuery(event.target.value); setShown(30); }} placeholder="Search company, atomic variable, value or analysis ID" aria-label="Search company comparisons and atomic changes" />
        </label>
        <label className="select-control">
          <span>结果类型</span>
          <select value={outcome} onChange={(event) => { setOutcome(event.target.value); setShown(30); }}>
            <option value="all">{isConsecutive ? "全部纳入变化" : "全部（含无变化）"}</option>
            {!isConsecutive ? <option value="none">Score 0 / 无变化</option> : null}
            <option value="substantive">实质变化</option>
            {!isConsecutive ? <option value="ready">至少一条 outcome-ready change</option> : null}
            <option value="major">{isConsecutive ? "高影响变化（score 4–5）" : "Outcome-ready score 4–5"}</option>
            <option value="review">质量复核标记（当前 Item {reviewCount}）</option>
          </select>
        </label>
        <label className="select-control">
          <span>Change type</span>
          <select value={changeType} onChange={(event) => { setChangeType(event.target.value as "all" | AtomicChangeType); setShown(30); }}>
            <option value="all">全部类型（{atomicCount.toLocaleString()}）</option>
            <option value="introduced">新增（{changeTypeCounts.introduced.toLocaleString()}）</option>
            <option value="modified">修改（{changeTypeCounts.modified.toLocaleString()}）</option>
            <option value="removed">删除（{changeTypeCounts.removed.toLocaleString()}）</option>
            <option value="reclassified">重新分类（{changeTypeCounts.reclassified.toLocaleString()}）</option>
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

      {pairFilter ? (
        <div className="active-filter-note">
          Showing one selected company-year pair. <Link href={`/items?route=${selectedRoute}&item=${item}`}>Clear company filter</Link>
        </div>
      ) : null}

      {changeType !== "all" ? (
        <div className="active-filter-note change-type-active-note">
          Showing atomic changes coded as <strong>{atomicChangeLabels[changeType]}</strong>. <Link href={`/items?route=${selectedRoute}&item=${item}`}>Clear change-type filter</Link>
        </div>
      ) : null}

      {outcome === "review" ? (
        <div className="quality-review-filter-note">
          <strong>质量复核标记不是“已经判定错误”</strong>
          <p>它表示引文核验、OCR/文本完整性、Item 切分或 Item 10 融资判定触发了保守警示。展开记录即可查看具体类型；正式研究中可核对原页，或在 clean-only sensitivity analysis 中暂时排除。</p>
        </div>
      ) : null}

      <div className="comparison-count"><strong>{visible.length}</strong> of {rows.length} {isConsecutive ? "included change jobs" : "comparisons"} match · <strong>{visibleAtomicCount.toLocaleString()}</strong> atomic changes shown</div>
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
              <span className="comparison-change-types">
                {(["introduced", "modified", "removed", "reclassified"] as AtomicChangeType[])
                  .filter((type) => (changeType === "all" || type === changeType) && (row.changeTypeCounts?.[type] ?? 0) > 0)
                  .map((type) => <i key={type} className={`change-type-${type}`}>{atomicChangeLabels[type]} {row.changeTypeCounts?.[type]}</i>)}
              </span>
              <span className="comparison-summary-line">{row.summary}</span>
              <span className="detail-chevron">⌄</span>
            </summary>
            <ComparisonDetail row={row} changeType={changeType} />
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
          <input value={query} onChange={(event) => { setQuery(event.target.value); setShown(30); }} placeholder="搜索公司、条款或 analysis ID" aria-label="Search company cases" />
        </label>
        <label className="select-control"><span>分析类型</span><select value={route} onChange={(event) => { setRoute(event.target.value); setShown(30); }}><option value="all">全部</option><option value="consecutive">连续年变化</option><option value="cross-period">跨期实质变化</option></select></label>
        <label className="select-control"><span>Item</span><select value={item} onChange={(event) => { setItem(event.target.value); setShown(30); }}><option value="all">全部 Item</option>{itemOptions.map((value) => <option key={value} value={value}>Item {value}</option>)}</select></label>
        <label className="select-control"><span>最低评分</span><select value={score} onChange={(event) => { setScore(event.target.value); setShown(30); }}><option value="0">全部（跨期含无变化）</option><option value="1">1+</option><option value="3">3+</option><option value="4">4+</option><option value="5">5</option></select></label>
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
