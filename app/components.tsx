"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import {
  cases,
  consecutiveItems,
  type CaseItem,
  type CaseStudy,
  type ItemResult,
} from "./data";

const navigation = [
  { href: "/", label: "总览" },
  { href: "/consecutive", label: "连续年变化" },
  { href: "/substantive", label: "跨期实质变化" },
  { href: "/cases", label: "公司案例" },
  { href: "/method", label: "方法与质量" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="brand" href="/" aria-label="FDD Evidence Explorer home">
          <span className="brand-mark">FDD</span>
          <span className="brand-name">Contract Change Evidence Explorer</span>
        </Link>
        <button
          className="menu-button"
          type="button"
          aria-label="Toggle navigation"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          <span />
          <span />
        </button>
        <nav className={open ? "nav-links nav-open" : "nav-links"} aria-label="Primary navigation">
          {navigation.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                className={active ? "nav-link active" : "nav-link"}
                href={item.href}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div>
        <strong>FDD Contract Change Evidence Explorer</strong>
        <p>Evidence is reported at the company × year-pair × Item level.</p>
      </div>
      <div className="footer-note">
        <span>Research prototype · July 2026</span>
        <span>Original PDFs remain the authoritative source.</span>
      </div>
    </footer>
  );
}

export function ScoreDots({ score }: { score: number }) {
  return (
    <span className="score-dots" aria-label={`Change score ${score} out of 5`}>
      {[1, 2, 3, 4, 5].map((value) => (
        <span key={value} className={value <= score ? "dot filled" : "dot"} />
      ))}
    </span>
  );
}

export function EvidenceStatus({ status }: { status: CaseItem["status"] }) {
  const label =
    status === "verified"
      ? "Evidence verified"
      : status === "manual"
        ? "Human validated"
        : "Needs review";
  return <span className={`status-badge status-${status}`}>{label}</span>;
}

function EvidenceColumn({
  year,
  document,
  evidence,
  side,
}: {
  year: number;
  document: string;
  evidence: CaseItem["oldEvidence"];
  side: "old" | "new";
}) {
  return (
    <article className="document-sheet">
      <div className="document-tab">
        <span>{side === "old" ? "OLD VERSION" : "NEW VERSION"}</span>
        <strong>{year}</strong>
      </div>
      <p className="document-name" title={document}>
        {document}
      </p>
      <div className="document-rule" />
      {evidence.map((entry, index) => (
        <div className="evidence-block" key={`${entry.page}-${index}`}>
          <span className="evidence-number">{index + 1}</span>
          <mark>{entry.quote}</mark>
          <div className="evidence-meta">
            <span>PDF p. {entry.page}</span>
            <span className={entry.verified ? "verified" : "unverified"}>
              {entry.verified ? "✓ exact quote verified" : "○ page check required"}
            </span>
          </div>
        </div>
      ))}
    </article>
  );
}

export function EvidenceWorkbench() {
  const [selectedSlug, setSelectedSlug] = useState(cases[0].slug);
  const [selectedItem, setSelectedItem] = useState(cases[0].items[0].item);
  const [query, setQuery] = useState("");

  const selectedCase =
    cases.find((entry) => entry.slug === selectedSlug) ?? cases[0];
  const activeItem =
    selectedCase.items.find((item) => item.item === selectedItem) ??
    selectedCase.items[0];

  const visibleCases = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return cases;
    return cases.filter(
      (entry) =>
        entry.company.toLowerCase().includes(term) ||
        entry.items.some(
          (item) =>
            `item ${item.item}`.includes(term) ||
            item.title.toLowerCase().includes(term),
        ),
    );
  }, [query]);

  function chooseCase(entry: CaseStudy) {
    setSelectedSlug(entry.slug);
    setSelectedItem(entry.items[0].item);
  }

  return (
    <section className="workbench-section" id="evidence-workbench">
      <div className="workbench-heading">
        <div>
          <p className="eyebrow">AUDITABLE CASE EVIDENCE</p>
          <h2>Original-clause comparison</h2>
        </div>
        <div className="case-select-label">
          {selectedCase.company} · {selectedCase.oldYear} → {selectedCase.newYear}
        </div>
      </div>

      <div className="workbench-grid">
        <div className="comparison-panel">
          <div className="comparison-toolbar">
            <div className="item-tabs" role="tablist" aria-label="Items in selected case">
              {selectedCase.items.map((item) => (
                <button
                  key={item.item}
                  type="button"
                  className={item.item === activeItem.item ? "item-tab selected" : "item-tab"}
                  onClick={() => setSelectedItem(item.item)}
                >
                  Item {item.item}
                </button>
              ))}
            </div>
            <div className="comparison-score">
              <ScoreDots score={activeItem.score} />
              <span>{activeItem.score}/5</span>
              <EvidenceStatus status={activeItem.status} />
            </div>
          </div>

          <div className="document-compare">
            <EvidenceColumn
              year={selectedCase.oldYear}
              document={selectedCase.oldDocument}
              evidence={activeItem.oldEvidence}
              side="old"
            />
            <div className="change-connector" aria-hidden="true">
              <span>→</span>
            </div>
            <EvidenceColumn
              year={selectedCase.newYear}
              document={selectedCase.newDocument}
              evidence={activeItem.newEvidence}
              side="new"
            />
          </div>

          <div className="interpretation-card">
            <div>
              <span className="interpretation-label">研究解释</span>
              <h3>{activeItem.summary}</h3>
              <p>{activeItem.interpretation}</p>
            </div>
            <div className="interpretation-facts">
              <span>Item {activeItem.item}</span>
              <span>{activeItem.direction}</span>
              <span>{activeItem.contractual ? "contractual" : "disclosure / operational"}</span>
            </div>
            {activeItem.note ? <p className="manual-note">✎ {activeItem.note}</p> : null}
          </div>
        </div>

        <aside className="workbench-rail">
          <div className="rail-card case-browser">
            <div className="rail-title-row">
              <h3>精选证据案例</h3>
              <span>3 featured</span>
            </div>
            <label className="search-box">
              <span aria-hidden="true">⌕</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索公司或 Item"
                aria-label="Search cases"
              />
            </label>
            <div className="case-list">
              {visibleCases.map((entry) => (
                <button
                  type="button"
                  key={entry.slug}
                  onClick={() => chooseCase(entry)}
                  className={entry.slug === selectedCase.slug ? "case-row selected" : "case-row"}
                >
                  <span>
                    <strong>{entry.company}</strong>
                    <small>{entry.oldYear} → {entry.newYear} · {entry.source}</small>
                  </span>
                  <span className="case-items">
                    {entry.items.map((item) => `I${item.item}`).join(" · ")}
                  </span>
                  <span aria-hidden="true">›</span>
                </button>
              ))}
            </div>
            <Link className="text-link" href={`/cases/${selectedCase.slug}`}>
              查看完整公司案例 <span>→</span>
            </Link>
          </div>

          <MiniRanking />

          <div className="rail-card prototype-note">
            <span className="note-icon">i</span>
            <div>
              <strong>Featured, not exhaustive</strong>
              <p>这里只展示 3 个精选人工核验案例；完整公司—年份案例库请进入“公司案例”。</p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

export function MiniRanking() {
  const rows = consecutiveItems.slice(0, 5);
  return (
    <div className="rail-card ranking-card">
      <div className="rail-title-row">
        <h3>变化最频繁</h3>
        <Link href="/consecutive">全部 23 Items</Link>
      </div>
      <div className="mini-ranking">
        {rows.map((row) => (
          <div className="mini-rank-row" key={row.item}>
            <div>
              <strong>Item {row.item}</strong>
              <span>{row.share.toFixed(1)}%</span>
            </div>
            <div className="bar-track">
              <span style={{ width: `${row.share}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ResultsExplorer({
  items,
  mode,
}: {
  items: ItemResult[];
  mode: "consecutive" | "cross-period";
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"share" | "item">("share");
  const [threshold, setThreshold] = useState("0");

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    const minimum = Number(threshold);
    return [...items]
      .filter(
        (row) =>
          row.share >= minimum &&
          (!term ||
            `item ${row.item}`.includes(term) ||
            row.title.toLowerCase().includes(term)),
      )
      .sort((a, b) => (sort === "share" ? b.share - a.share : a.item - b.item));
  }, [items, query, sort, threshold]);

  return (
    <section className="results-explorer">
      <div className="results-controls">
        <label className="search-box results-search">
          <span aria-hidden="true">⌕</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索 Item 编号或名称"
            aria-label="Search Item results"
          />
        </label>
        <label className="select-control">
          <span>最低实质变化率</span>
          <select value={threshold} onChange={(event) => setThreshold(event.target.value)}>
            <option value="0">全部</option>
            <option value="10">≥ 10%</option>
            <option value="25">≥ 25%</option>
            <option value="50">≥ 50%</option>
            <option value="75">≥ 75%</option>
          </select>
        </label>
        <div className="segmented" aria-label="Sort results">
          <button className={sort === "share" ? "selected" : ""} onClick={() => setSort("share")} type="button">
            按变化率
          </button>
          <button className={sort === "item" ? "selected" : ""} onClick={() => setSort("item")} type="button">
            按 Item
          </button>
        </div>
      </div>

      <div className="results-legend">
        <span><i className="legend-substantive" /> 实质变化（score ≥ 3）</span>
        <span><i className="legend-major" /> 重大合同变化（score ≥ 4 且 contractual）</span>
        <span><i className="legend-routine" /> 例行年度更新</span>
      </div>

      <div className="result-table" role="table" aria-label={`${mode} Item results`}>
        <div className="result-header" role="row">
          <span>Rank</span>
          <span>Item</span>
          <span>条款</span>
          <span>加权比例</span>
          <span>结果分解</span>
        </div>
        {visible.map((row, index) => (
          <Link
            className="result-row result-row-link"
            role="row"
            key={row.item}
            href={`/items?route=${mode}&item=${row.item}`}
            aria-label={`Open company-level comparisons for Item ${row.item} ${row.title}`}
          >
            <span className="rank-cell">{sort === "share" ? index + 1 : row.rank ?? "—"}</span>
            <span className="item-number">{String(row.item).padStart(2, "0")}</span>
            <div className="result-title">
              <strong>{row.title}</strong>
              {row.ci ? <small>95% CI {row.ci[0].toFixed(1)}–{row.ci[1].toFixed(1)}%</small> : <small>n = 200 consecutive-year comparisons</small>}
              <small className="result-drill-link">查看公司与原文证据 →</small>
            </div>
            <div className="primary-result">
              <strong>{row.share.toFixed(1)}%</strong>
              <div className="bar-track"><span style={{ width: `${row.share}%` }} /></div>
            </div>
            <div className="result-breakdown">
              <span title="Major contractual change"><i className="break-major" style={{ width: `${row.major ?? 0}%` }} /></span>
              <span title="Routine annual update"><i className="break-routine" style={{ width: `${row.routine ?? 0}%` }} /></span>
              <small>Major {(row.major ?? 0).toFixed(1)}% · Routine {(row.routine ?? 0).toFixed(1)}%</small>
            </div>
          </Link>
        ))}
        {visible.length === 0 ? <p className="empty-state">没有符合当前筛选条件的 Item。</p> : null}
      </div>
    </section>
  );
}

export function CaseLibrary() {
  const [query, setQuery] = useState("");
  const [route, setRoute] = useState("all");
  const [item, setItem] = useState("all");
  const [score, setScore] = useState("0");

  const itemOptions = Array.from(
    new Set(cases.flatMap((entry) => entry.items.map((row) => row.item))),
  ).sort((a, b) => a - b);

  const term = query.trim().toLowerCase();
  const visible = cases.filter((entry) => {
    const routeMatch = route === "all" || entry.route === route;
    const itemMatch = item === "all" || entry.items.some((row) => row.item === Number(item));
    const scoreMatch = entry.items.some((row) => row.score >= Number(score));
    const termMatch =
      !term ||
      entry.company.toLowerCase().includes(term) ||
      entry.analysisId.toLowerCase().includes(term) ||
      entry.items.some((row) => row.title.toLowerCase().includes(term));
    return routeMatch && itemMatch && scoreMatch && termMatch;
  });

  return (
    <section className="case-library-full">
      <div className="library-controls">
        <label className="search-box results-search">
          <span aria-hidden="true">⌕</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索公司、条款或 analysis ID"
            aria-label="Search company cases"
          />
        </label>
        <label className="select-control">
          <span>分析类型</span>
          <select value={route} onChange={(event) => setRoute(event.target.value)}>
            <option value="all">全部</option>
            <option value="consecutive">连续年变化</option>
            <option value="cross-period">跨期实质变化</option>
          </select>
        </label>
        <label className="select-control">
          <span>Item</span>
          <select value={item} onChange={(event) => setItem(event.target.value)}>
            <option value="all">全部 Item</option>
            {itemOptions.map((value) => <option key={value} value={value}>Item {value}</option>)}
          </select>
        </label>
        <label className="select-control">
          <span>最低评分</span>
          <select value={score} onChange={(event) => setScore(event.target.value)}>
            <option value="0">全部</option>
            <option value="3">3+</option>
            <option value="4">4+</option>
            <option value="5">5</option>
          </select>
        </label>
      </div>

      <div className="library-count">
        <strong>{visible.length}</strong> 个案例符合筛选条件
      </div>

      <div className="case-card-grid">
        {visible.map((entry) => {
          const maxScore = Math.max(...entry.items.map((row) => row.score));
          return (
            <Link className="case-card" href={`/cases/${entry.slug}`} key={entry.slug}>
              <div className="case-card-top">
                <span className={`route-chip route-${entry.route}`}>
                  {entry.route === "consecutive" ? "连续年变化" : "跨期实质变化"}
                </span>
                <ScoreDots score={maxScore} />
              </div>
              <h2>{entry.company}</h2>
              <p className="case-years">{entry.oldYear} <span>→</span> {entry.newYear} · {entry.source}</p>
              <p className="case-featured">{entry.featured}</p>
              <div className="case-item-pills">
                {entry.items.map((row) => (
                  <span key={row.item}>Item {row.item} · {row.score}/5</span>
                ))}
              </div>
              <div className="case-card-footer">
                <span>{entry.analysisId}</span>
                <strong>查看证据 →</strong>
              </div>
            </Link>
          );
        })}
      </div>
      {visible.length === 0 ? <p className="empty-state">没有符合当前筛选条件的公司案例。</p> : null}
    </section>
  );
}

export function CaseDetailView({ caseStudy }: { caseStudy: CaseStudy }) {
  const [selectedItem, setSelectedItem] = useState(caseStudy.items[0].item);
  const activeItem =
    caseStudy.items.find((entry) => entry.item === selectedItem) ?? caseStudy.items[0];

  return (
    <section className="case-detail-layout">
      <aside className="case-detail-sidebar">
        <p className="eyebrow">ITEM NAVIGATOR</p>
        <div className="case-detail-items">
          {caseStudy.items.map((entry) => (
            <button
              type="button"
              key={entry.item}
              onClick={() => setSelectedItem(entry.item)}
              className={entry.item === activeItem.item ? "selected" : ""}
            >
              <span>Item {entry.item}</span>
              <ScoreDots score={entry.score} />
              <small>{entry.title}</small>
            </button>
          ))}
        </div>
        <div className="source-locator">
          <p className="eyebrow">SOURCE LOCATOR</p>
          <dl>
            <div><dt>Old FDD</dt><dd>{caseStudy.oldDocument}</dd></div>
            <div><dt>New FDD</dt><dd>{caseStudy.newDocument}</dd></div>
            <div><dt>Repository</dt><dd>{caseStudy.source}</dd></div>
            <div><dt>Analysis ID</dt><dd>{caseStudy.analysisId}</dd></div>
          </dl>
          <p className="source-caveat">The hosted prototype records exact filenames and pages. Original PDFs will be embedded after the 200-pair evidence package is transferred.</p>
        </div>
      </aside>

      <div className="case-detail-main">
        <div className="detail-item-heading">
          <div>
            <p className="eyebrow">ITEM {activeItem.item}</p>
            <h2>{activeItem.title}</h2>
          </div>
          <div className="detail-score">
            <ScoreDots score={activeItem.score} />
            <strong>{activeItem.score}/5</strong>
            <EvidenceStatus status={activeItem.status} />
          </div>
        </div>

        <div className="document-compare detail-documents">
          <EvidenceColumn year={caseStudy.oldYear} document={caseStudy.oldDocument} evidence={activeItem.oldEvidence} side="old" />
          <div className="change-connector" aria-hidden="true"><span>→</span></div>
          <EvidenceColumn year={caseStudy.newYear} document={caseStudy.newDocument} evidence={activeItem.newEvidence} side="new" />
        </div>

        <div className="detail-explanation">
          <div className="explanation-main">
            <p className="eyebrow">INTERPRETATION</p>
            <h3>{activeItem.summary}</h3>
            <p>{activeItem.interpretation}</p>
            {activeItem.note ? <div className="manual-callout"><strong>Manual adjudication</strong><p>{activeItem.note}</p></div> : null}
          </div>
          <dl className="coding-panel">
            <div><dt>Direction</dt><dd>{activeItem.direction}</dd></div>
            <div><dt>Substantive</dt><dd>{activeItem.substantive ? "Yes" : "No"}</dd></div>
            <div><dt>Contractual</dt><dd>{activeItem.contractual ? "Yes" : "No"}</dd></div>
            <div><dt>Evidence status</dt><dd>{activeItem.status}</dd></div>
          </dl>
        </div>
      </div>
    </section>
  );
}
