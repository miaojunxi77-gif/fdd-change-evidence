"use client";

import { useEffect, useMemo, useState } from "react";

type Metric = { section: string; metric: string; value: number; note: string };
type Quartile = {
  size_quartile: string;
  n: number;
  single_state_n: number;
  single_state_share: number;
  mean_top1_share: number;
  median_top1_share: number;
  top1_ge_50: number;
  top1_ge_75: number;
  top1_ge_80: number;
  top1_ge_90: number;
  median_n_states: number;
  mean_n_states: number;
  median_total_franchised: number;
};
type Risk = {
  risk_score: number;
  n_geo: number;
  single_state_share: number;
  median_top1_share: number;
  median_franchised_outlets: number;
  median_n_states: number;
};
type StateRow = {
  state: string;
  franchised_outlets: number;
  share_of_latest_snapshot: number;
  n_systems_present: number;
};
type PrimaryStateRow = { state: string; count: number; share: number };
type PrimaryStateSummary = {
  observations: number;
  tiedTopObservations: number;
  tiedTopShare: number;
  states: PrimaryStateRow[];
};
type LinkageRow = {
  source: string;
  documents: number;
  linkedDocuments: number;
  overallLinkRate: number;
  approxGeoOutputLinkRate: number;
};
type CountRow = { count: number; share: number; status?: string; method?: string; reason?: string };
type MissingStage = { label: string; field: string; count: number; share: number };
type CatalogRow = { file: string; rows: number; columns: number; description: string };
type PackageManifest = { filename: string; bytes: number; sha256: string; parts: string[] };
type DetailSchema = {
  summary: string[];
  item10: string[];
  colocation: string[];
  ranking: string[];
};
type Summary = {
  metrics: Metric[];
  quartiles: Quartile[];
  risk: Risk[];
  states: StateRow[];
  primaryState: PrimaryStateSummary;
  companyPrimaryState: PrimaryStateSummary;
  linkageBySource: LinkageRow[];
  item20Statuses: CountRow[];
  linkMethods: CountRow[];
  missingAudit: { total: number; stages: MissingStage[]; reasons: CountRow[] };
  catalog: CatalogRow[];
  detailSchema: DetailSchema;
  package?: PackageManifest;
  counts: {
    canonicalBrandYears: number;
    stateRankingRows: number;
    franchiseRankingRows: number;
    companyRankingRows: number;
    rankingObservations: number;
    colocationRows: number;
    item10MergedRows: number;
    documentAuditRows: number;
    missingAuditRows: number;
    uniqueChains: number;
  };
  quality: {
    canonicalRowsAfter2026: number;
    linkageRowsAfter2026: number;
    linkageRowsMissingYear: number;
    missingNameRows: number;
    missingNameCanonicalIds: number;
    nonUniqueDisplayNames: number;
  };
};
type Brand = { id: string; name: string; years: number[]; bucket: string };
type CompactYearDetail = {
  s?: unknown[];
  i?: unknown[];
  o?: unknown[][];
  f?: Array<[string, number, number]>;
  c?: Array<[string, number, number]>;
};
type Ranking = { rank: number; state: string; outlets: number; share: number };

const pct = (value: number | null | undefined, digits = 1) =>
  value == null ? "—" : `${(value * 100).toFixed(digits)}%`;
const nfmt = (value: number | null | undefined, digits = 0) =>
  value == null
    ? "—"
    : value.toLocaleString(undefined, {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      });
const textValue = (value: unknown) =>
  value == null || value === "" ? "—" : String(value);
const yesNo = (value: unknown) =>
  value === 1 || value === "1" || value === true ? "Yes" : value == null ? "—" : "No";
const humanize = (value: string) =>
  value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());

function inflate(fields: string[], values?: unknown[]) {
  if (!values) return null;
  return Object.fromEntries(fields.map((field, index) => [field, values[index]]));
}

function Bar({ value, max = 1, color = "var(--geo-blue)" }: { value: number; max?: number; color?: string }) {
  return (
    <span className="geo-bar" aria-hidden="true">
      <i
        style={{
          width: `${Math.max(2, Math.min(100, max ? (value / max) * 100 : 0))}%`,
          background: color,
        }}
      />
    </span>
  );
}

function FieldGrid({ rows }: { rows: Array<[string, unknown]> }) {
  return (
    <dl className="geo-field-grid">
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{textValue(value)}</dd>
        </div>
      ))}
    </dl>
  );
}

const riskLabels: Record<number, string> = {
  0: "No involvement",
  1: "Access / referral",
  2: "Deferred / seller credit",
  3: "Guarantees / conditional exposure",
  4: "Direct / funded exposure",
};

export default function GeographyExplorer({ basePath }: { basePath: string }) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState<Brand | null>(null);
  const [year, setYear] = useState<number | null>(null);
  const [detail, setDetail] = useState<CompactYearDetail | null>(null);
  const [detailError, setDetailError] = useState("");
  const [detailLoading, setDetailLoading] = useState(false);
  const [table, setTable] = useState<"T3_FRANCHISED" | "T4_COMPANY">("T3_FRANCHISED");
  const [downloadState, setDownloadState] = useState<"idle" | "downloading" | "done" | "error">("idle");
  const [downloadProgress, setDownloadProgress] = useState(0);

  useEffect(() => {
    Promise.all([
      fetch(`${basePath}/data/item20-geography/summary.json`).then((response) => {
        if (!response.ok) throw new Error(`Summary HTTP ${response.status}`);
        return response.json();
      }),
      fetch(`${basePath}/data/item20-geography/brand-index.json`).then((response) => {
        if (!response.ok) throw new Error(`Index HTTP ${response.status}`);
        return response.json();
      }),
    ]).then(([summaryPayload, brandPayload]: [Summary, Brand[]]) => {
      setSummary(summaryPayload);
      setBrands(brandPayload);
      const first = brandPayload.find((entry) => entry.name === "McDonald's") || brandPayload[0];
      setDetailLoading(true);
      setDetailError("");
      setDetail(null);
      setBrand(first);
      setYear(first.years[0]);
    });
  }, [basePath]);

  useEffect(() => {
    if (!brand || year == null) return;
    let current = true;
    fetch(`${basePath}/data/item20-geography/brands/${brand.bucket}.json`)
      .then((response) => {
        if (!response.ok) throw new Error(`Detail HTTP ${response.status}`);
        return response.json();
      })
      .then((payload) => {
        if (!current) return;
        setDetail(payload[brand.id]?.[String(year)] || null);
      })
      .catch((error) => {
        if (current) setDetailError(error instanceof Error ? error.message : "Detail load failed");
      })
      .finally(() => {
        if (current) setDetailLoading(false);
      });
    return () => {
      current = false;
    };
  }, [basePath, brand, year]);

  const matches = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (term) {
      return brands
        .filter(
          (entry) =>
            entry.name.toLowerCase().includes(term) || entry.id.toLowerCase().includes(term),
        )
        .slice(0, 40);
    }
    if (!brand) return brands.slice(0, 12);
    return [brand, ...brands.filter((entry) => entry.id !== brand.id).slice(0, 11)];
  }, [brand, brands, query]);

  const canonical = useMemo(
    () => (summary ? inflate(summary.detailSchema.summary, detail?.s) : null),
    [detail, summary],
  );
  const item10 = useMemo(
    () => (summary ? inflate(summary.detailSchema.item10, detail?.i) : null),
    [detail, summary],
  );
  const overlap = useMemo(
    () =>
      summary
        ? (detail?.o || []).map((values) => inflate(summary.detailSchema.colocation, values)!)
        : [],
    [detail, summary],
  );
  const franchiseRanking: Ranking[] = (detail?.f || []).map((entry, index) => ({
    rank: index + 1,
    state: entry[0],
    outlets: entry[1],
    share: entry[2],
  }));
  const companyRanking: Ranking[] = (detail?.c || []).map((entry, index) => ({
    rank: index + 1,
    state: entry[0],
    outlets: entry[1],
    share: entry[2],
  }));
  const ranking = table === "T3_FRANCHISED" ? franchiseRanking : companyRanking;
  const prefix = table === "T3_FRANCHISED" ? "franchise" : "company";
  const tieStates = ranking.length
    ? ranking.filter((row) => row.outlets === ranking[0].outlets).map((row) => row.state)
    : [];

  const metric = (name: string) => summary?.metrics.find((entry) => entry.metric === name)?.value;

  async function downloadPackage() {
    if (!summary?.package || downloadState === "downloading") return;
    setDownloadState("downloading");
    setDownloadProgress(0);
    try {
      const chunks: ArrayBuffer[] = [];
      for (let index = 0; index < summary.package.parts.length; index += 1) {
        const part = summary.package.parts[index];
        const response = await fetch(`${basePath}/data/item20-geography/package/${part}`);
        if (!response.ok) throw new Error(`Package part ${index + 1} failed`);
        chunks.push(await response.arrayBuffer());
        setDownloadProgress((index + 1) / summary.package.parts.length);
      }
      const blob = new Blob(chunks, { type: "application/zip" });
      if (blob.size !== summary.package.bytes) throw new Error("Package size check failed");
      const digest = await crypto.subtle.digest("SHA-256", await blob.arrayBuffer());
      const hash = Array.from(new Uint8Array(digest))
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
      if (hash !== summary.package.sha256) throw new Error("Package checksum failed");
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = summary.package.filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setDownloadState("done");
    } catch {
      setDownloadState("error");
    }
  }

  if (!summary) {
    return (
      <main className="geo-page">
        <div className="shell geo-loading">Loading geography data…</div>
      </main>
    );
  }

  const maxPrimary = summary.primaryState.states[0]?.count || 1;
  const maxCompanyPrimary = summary.companyPrimaryState.states[0]?.count || 1;
  const maxStateOutlets = summary.states[0]?.franchised_outlets || 1;
  const selectedTotal = canonical?.[`${prefix}_total_outlets`] as number | null | undefined;
  const selectedStates = canonical?.[`${prefix}_n_states`] as number | null | undefined;
  const selectedOutletYear = canonical?.[`${prefix}_outlet_data_year`] as number | null | undefined;
  const selectedConflict = canonical?.[`${prefix}_geo_conflict`];

  return (
    <main className="geo-page">
      <section className="geo-hero shell">
        <div>
          <p className="eyebrow">ITEM 20 · CANONICAL OUTLET GEOGRAPHY · V1</p>
          <h1>Where are franchise systems actually operating?</h1>
          <p>
            把五个来源的 Item 20 Table 3（franchised outlets）与 Table 4（company-owned
            outlets）统一到 canonical system × FDD year。页面覆盖 Primary State、Top-1/2/3、
            全部州排名、直营店地理、co-location、Item 10 V1.2 合并，以及 linkage 与 missing-FDD
            审计。
          </p>
        </div>
        <div className="geo-hero-metrics">
          <div><strong>{nfmt(metric("V5 TXT documents scanned"))}</strong><span>TXT documents scanned</span></div>
          <div><strong>{nfmt(summary.counts.canonicalBrandYears)}</strong><span>canonical geography brand-years</span></div>
          <div><strong>{nfmt(summary.counts.stateRankingRows)}</strong><span>complete state-ranking rows</span></div>
          <div><strong>{nfmt(metric("Item 10 paper-ready with any Item 20 geography"))}</strong><span>Item 10 rows with geography</span></div>
        </div>
      </section>

      <section className="geo-section shell">
        <div className="geo-heading">
          <div><p className="eyebrow">HEADLINE FINDINGS</p><h2>Primary State is informative—but system size changes its meaning</h2></div>
          <p>
            Primary State 是所选 Item 20 表中年末门店最多的州，不是总部、注册地或 filing state。
            严格样本排除 reconciliation conflict，并要求 franchised outlets 为正。
          </p>
        </div>
        <div className="geo-kpis">
          <article><strong>{nfmt(metric("Strict positive brand-years"))}</strong><span>strict positive brand-years</span></article>
          <article><strong>{pct(metric("Single-state share"))}</strong><span>single-state systems</span></article>
          <article><strong>{pct(metric("Median Top-1 state share"))}</strong><span>median Top-1 share</span></article>
          <article><strong>{nfmt(metric("Median number of states"))}</strong><span>median states per system</span></article>
          <article><strong>{pct(metric("Top-1 share >= 50%"))}</strong><span>Top-1 share ≥ 50%</span></article>
          <article><strong>{pct(metric("Top-1 share >= 75%"))}</strong><span>Top-1 share ≥ 75%</span></article>
          <article><strong>{pct(metric("Top-1 share >= 90%"))}</strong><span>Top-1 share ≥ 90%</span></article>
        </div>
        <div className="geo-callout">
          <strong>Empirical implication</strong>
          <p>
            <b>PrimaryState</b> 更适合 concentrated / small systems；全样本 local banking exposure
            应优先使用 <code>Σ state outlet share × state-year bank condition</code>。否则，一个在 35 个州
            经营的大 system 会被压缩成单一州。Top-1 并列也不能被理解为唯一主州。
          </p>
        </div>
      </section>

      <section className="geo-section geo-tint">
        <div className="shell">
          <div className="geo-heading">
            <div><p className="eyebrow">PRIMARY STATE</p><h2>Which state is assigned Top-1?</h2></div>
            <p>
              以下为全部 8,293 个 strict positive brand-years 的 deterministic PrimaryState。
              {nfmt(summary.primaryState.tiedTopObservations)} 个（{pct(summary.primaryState.tiedTopShare)}）
              存在并列最大值；文件以州缩写字母顺序打破并列。
            </p>
          </div>
          <div className="geo-primary-layout">
            <div className="geo-primary-chart">
              {summary.primaryState.states.slice(0, 15).map((row) => (
                <div key={row.state}>
                  <b>{row.state}</b>
                  <Bar value={row.count} max={maxPrimary} />
                  <strong>{nfmt(row.count)}</strong>
                  <small>{pct(row.share, 2)}</small>
                </div>
              ))}
            </div>
            <article className="geo-definition-card">
              <span>Definition</span>
              <h3>Largest end-of-year outlet count</h3>
              <p>
                Top-1 share = Primary State outlets ÷ all identified franchised outlets in that system-year.
                同名品牌不是 key；所有合并使用 canonical_chain_id。
              </p>
              <dl>
                <div><dt>Top three assignments</dt><dd>TX · CA · FL</dd></div>
                <div><dt>Tied Top-1</dt><dd>{pct(summary.primaryState.tiedTopShare)}</dd></div>
                <div><dt>Strict observations</dt><dd>{nfmt(summary.primaryState.observations)}</dd></div>
              </dl>
            </article>
          </div>
        </div>
      </section>

      <section className="geo-section shell">
        <div className="geo-heading">
          <div><p className="eyebrow">SIZE GRADIENT</p><h2>Geographic concentration falls sharply with system size</h2></div>
          <p>Item 10 paper-ready strict sample 的四分位点为 11、40、130 个 franchised outlets；四组 N 合计 7,447。</p>
        </div>
        <div className="geo-quartiles">
          {summary.quartiles.map((entry) => (
            <article key={entry.size_quartile}>
              <div><span>{entry.size_quartile}</span><strong>{nfmt(entry.n)}</strong><small>brand-years</small></div>
              <h3>{pct(entry.single_state_share)}</h3><p>single-state</p>
              <Bar value={entry.single_state_share} max={0.36} />
              <dl>
                <div><dt>Median Top-1</dt><dd>{pct(entry.median_top1_share)}</dd></div>
                <div><dt>Median states</dt><dd>{nfmt(entry.median_n_states, entry.median_n_states % 1 ? 1 : 0)}</dd></div>
                <div><dt>Median outlets</dt><dd>{nfmt(entry.median_total_franchised)}</dd></div>
                <div><dt>Top-1 ≥ 75%</dt><dd>{pct(entry.top1_ge_75)}</dd></div>
              </dl>
            </article>
          ))}
        </div>
        <div className="geo-table-wrap geo-full-metric-table">
          <table>
            <thead><tr><th>Size quartile</th><th>N</th><th>Single-state N</th><th>Single-state</th><th>Mean Top-1</th><th>Median Top-1</th><th>≥50%</th><th>≥75%</th><th>≥80%</th><th>≥90%</th><th>Median states</th><th>Mean states</th><th>Median outlets</th></tr></thead>
            <tbody>
              {summary.quartiles.map((entry) => (
                <tr key={entry.size_quartile}>
                  <th>{entry.size_quartile}</th><td>{nfmt(entry.n)}</td><td>{nfmt(entry.single_state_n)}</td><td>{pct(entry.single_state_share)}</td><td>{pct(entry.mean_top1_share)}</td><td>{pct(entry.median_top1_share)}</td><td>{pct(entry.top1_ge_50)}</td><td>{pct(entry.top1_ge_75)}</td><td>{pct(entry.top1_ge_80)}</td><td>{pct(entry.top1_ge_90)}</td><td>{nfmt(entry.median_n_states, 1)}</td><td>{nfmt(entry.mean_n_states, 1)}</td><td>{nfmt(entry.median_total_franchised)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="geo-section geo-tint">
        <div className="shell">
          <div className="geo-heading">
            <div><p className="eyebrow">LATEST SYSTEM SNAPSHOT</p><h2>How many observed franchised outlets are in every state?</h2></div>
            <p>每个 system 只取最新 strict positive observation：3,124 systems、477,348 outlets。它描述本项目样本，不等于美国全部 franchise universe。</p>
          </div>
          <div className="geo-state-layout">
            <div className="geo-state-chart">
              {summary.states.slice(0, 15).map((row, index) => (
                <div key={row.state}>
                  <span>{index + 1}</span><b>{row.state}</b>
                  <Bar value={row.franchised_outlets} max={maxStateOutlets} />
                  <strong>{nfmt(row.franchised_outlets)}</strong><small>{pct(row.share_of_latest_snapshot, 2)}</small>
                </div>
              ))}
            </div>
            <div className="geo-state-notes">
              {summary.states.slice(0, 3).map((row) => (
                <article key={row.state}>
                  <strong>{row.state}</strong><span>{nfmt(row.franchised_outlets)} outlets</span>
                  <p>{pct(row.share_of_latest_snapshot, 2)} of the snapshot · {nfmt(row.n_systems_present)} systems present.</p>
                </article>
              ))}
            </div>
          </div>
          <details className="geo-details-table" open>
            <summary>All 50 states + DC</summary>
            <div className="geo-table-wrap">
              <table>
                <thead><tr><th>Rank</th><th>State</th><th>Franchised outlets</th><th>Snapshot share</th><th>Systems present</th></tr></thead>
                <tbody>{summary.states.map((row, index) => <tr key={row.state}><td>{index + 1}</td><th>{row.state}</th><td>{nfmt(row.franchised_outlets)}</td><td>{pct(row.share_of_latest_snapshot, 2)}</td><td>{nfmt(row.n_systems_present)}</td></tr>)}</tbody>
              </table>
            </div>
          </details>
        </div>
      </section>

      <section className="geo-section geo-company">
        <div className="shell">
          <div className="geo-heading">
            <div><p className="eyebrow">COMPANY-OWNED GEOGRAPHY</p><h2>Franchisor-owned stores are much more concentrated</h2></div>
            <p>Table 4 的真实 systemwide zero 保留为 0，而不是 missing；zero observation 不存在 Company-Owned Primary State。affiliate-owned 与非标准区域代表表不会被静默重分类。</p>
          </div>
          <div className="geo-company-grid">
            <article><strong>{pct(metric("Zero company-owned share"))}</strong><h3>Zero company-owned</h3><p>1,829 of 8,088 strict resolved paper-ready Table 4 observations.</p></article>
            <article><strong>{pct(metric("Positive company systems single-state share"))}</strong><h3>Single-state presence</h3><p>Among 6,259 positive, strict, paper-ready company systems.</p></article>
            <article><strong>{pct(metric("Median company Top-1 share"))}</strong><h3>Median Company Top-1</h3><p>Median positive company-owned outlet count is 3.</p></article>
            <article><strong>{pct(metric("Any franchise/company state co-location"))}</strong><h3>Any co-location</h3><p>At least one franchised outlet is in a company-owned state.</p></article>
            <article><strong>{pct(metric("Median franchise colocation share"))}</strong><h3>Median co-location share</h3><p>Franchised-outlet share in states with company presence.</p></article>
            <article><strong>{nfmt(metric("Strict paper-ready matched rows"))}</strong><h3>Strict co-location rows</h3><p>Table 3/4 use the same outlet year and have no geography conflict.</p></article>
          </div>
          <div className="geo-company-primary">
            <div>
              <h3>Company-Owned Primary State</h3>
              <p>{nfmt(summary.companyPrimaryState.observations)} strict positive panel observations. {nfmt(summary.companyPrimaryState.tiedTopObservations)} ({pct(summary.companyPrimaryState.tiedTopShare)}) have a tied maximum.</p>
            </div>
            <div className="geo-dark-bars">
              {summary.companyPrimaryState.states.slice(0, 12).map((row) => (
                <div key={row.state}><b>{row.state}</b><Bar value={row.count} max={maxCompanyPrimary} color="var(--geo-cyan)" /><strong>{nfmt(row.count)}</strong><small>{pct(row.share, 2)}</small></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="geo-section shell">
        <div className="geo-heading">
          <div><p className="eyebrow">ITEM 10 × ITEM 20</p><h2>Coverage and unadjusted RiskScore descriptives</h2></div>
          <p>Exact canonical ID × FDD year merge。RiskScore 表示 franchisor 承担的融资 exposure，不是品牌违约风险或质量。</p>
        </div>
        <div className="geo-merge">
          <div><strong>13,124</strong><span>Item 10 paper-ready</span></div><i>→</i>
          <div><strong>10,440</strong><span>any Item 20 · 79.5%</span></div><i>→</i>
          <div><strong>9,778</strong><span>franchised geography · 74.5%</span></div><i>→</i>
          <div><strong>7,447</strong><span>strict positive geography · 56.7%</span></div>
        </div>
        <div className="geo-risk-layout">
          <div className="geo-risk-chart">
            <h3>RiskScore × geographic concentration</h3>
            <p>Single-state share and median Top-1 share; N is the strict brand-year count.</p>
            {summary.risk.map((row) => (
              <div className="geo-risk-row" key={row.risk_score}>
                <div><strong>{row.risk_score}</strong><span>{riskLabels[row.risk_score]}</span><small>N={nfmt(row.n_geo)}</small></div>
                <div><label>Single-state <b>{pct(row.single_state_share)}</b></label><Bar value={row.single_state_share} max={0.36} /></div>
                <div><label>Median Top-1 <b>{pct(row.median_top1_share)}</b></label><Bar value={row.median_top1_share} max={0.36} color="var(--geo-cyan)" /></div>
              </div>
            ))}
          </div>
          <aside className="geo-risk-note">
            <h3>Raw pattern, not a mechanism</h3>
            <p>Score 0 的 median system size 是 29 outlets / 10 states；Score 4 是 102 outlets / 22 states。Score 3 的 strict N 只有 277。</p>
            <p>Financing exposure、system size、geography coverage 与 business format 共同选择；这些统计没有做 size adjustment，也不识别融资支持对地理扩张的因果效应。</p>
          </aside>
        </div>
        <div className="geo-table-wrap geo-full-metric-table">
          <table>
            <thead><tr><th>RiskScore</th><th>Meaning</th><th>N with strict geography</th><th>Single-state</th><th>Median Top-1</th><th>Median outlets</th><th>Median states</th></tr></thead>
            <tbody>{summary.risk.map((row) => <tr key={row.risk_score}><th>{row.risk_score}</th><td>{riskLabels[row.risk_score]}</td><td>{nfmt(row.n_geo)}</td><td>{pct(row.single_state_share)}</td><td>{pct(row.median_top1_share)}</td><td>{nfmt(row.median_franchised_outlets)}</td><td>{nfmt(row.median_n_states)}</td></tr>)}</tbody>
          </table>
        </div>
      </section>

      <section className="geo-section geo-explorer shell" id="brand-explorer">
        <div className="geo-heading">
          <div><p className="eyebrow">CANONICAL STATE-RANKING EXPLORER</p><h2>Search a system, choose a year, inspect every state</h2></div>
          <p>{nfmt(summary.counts.stateRankingRows)} rows = {nfmt(summary.counts.franchiseRankingRows)} franchised + {nfmt(summary.counts.companyRankingRows)} company-owned. Positive states only; systemwide zeros stay in the canonical summary.</p>
        </div>
        <div className="geo-explorer-grid">
          <aside>
            <label htmlFor="brand-search">Brand or canonical ID</label>
            <input id="brand-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="例如 McDonald's, Subway…" />
            <div className="geo-search-results">
              {matches.map((entry) => (
                <button key={entry.id} className={brand?.id === entry.id ? "active" : ""} onClick={() => { setDetailLoading(true); setDetailError(""); setDetail(null); setBrand(entry); setYear(entry.years[0]); setTable("T3_FRANCHISED"); }}>
                  <strong>{entry.name || entry.id}</strong><span>{entry.id} · {entry.years.length} year{entry.years.length > 1 ? "s" : ""}</span>
                </button>
              ))}
            </div>
          </aside>
          <div className="geo-detail">
            {brand ? (
              <>
                <div className="geo-detail-head">
                  <div><span>{brand.id}</span><h3>{brand.name || brand.id}</h3></div>
                  <div>
                    <label className="sr-only" htmlFor="geography-year">FDD year</label>
                    <select id="geography-year" value={year ?? ""} onChange={(event) => { setDetailLoading(true); setDetailError(""); setDetail(null); setYear(Number(event.target.value)); }}>{brand.years.map((value) => <option key={value}>{value}</option>)}</select>
                  </div>
                </div>
                {year != null && year > 2026 ? <div className="geo-warning">Out-of-range parsed year {year}: retained for audit, excluded from substantive interpretation.</div> : null}
                {detailLoading ? <div className="geo-detail-status">Loading selected brand-year…</div> : null}
                {detailError ? <div className="geo-error">Detail data did not load: {detailError}</div> : null}
                {!detailLoading && !detailError && canonical ? (
                  <>
                    <div className="geo-detail-kpis">
                      <article><span>Franchise Primary State</span><strong>{textValue(canonical.franchise_top1_state)}</strong><small>{nfmt(canonical.franchise_top1_outlets as number)} outlets · {pct(canonical.franchise_top1_share as number)}</small>{franchiseRanking.filter((row) => row.outlets === franchiseRanking[0]?.outlets).length > 1 ? <em>Tied top</em> : null}</article>
                      <article><span>Company-Owned Primary State</span><strong>{textValue(canonical.company_top1_state)}</strong><small>{nfmt(canonical.company_top1_outlets as number)} outlets · {pct(canonical.company_top1_share as number)}</small>{companyRanking.filter((row) => row.outlets === companyRanking[0]?.outlets).length > 1 ? <em>Tied top</em> : null}</article>
                      <article><span>RiskScore</span><strong>{textValue(item10?.risk_score)}</strong><small>{item10 ? riskLabels[Number(item10.risk_score)] : "No exact Item 10 merge"}</small></article>
                      <article><span>Franchise co-location share</span><strong>{pct(canonical.franchise_colocation_share as number)}</strong><small>with company-owned state presence</small></article>
                    </div>
                    <div className="geo-table-tabs" role="group" aria-label="Outlet table">
                      <button aria-pressed={table === "T3_FRANCHISED"} className={table === "T3_FRANCHISED" ? "active" : ""} onClick={() => setTable("T3_FRANCHISED")}>Franchised outlets</button>
                      <button aria-pressed={table === "T4_COMPANY"} className={table === "T4_COMPANY" ? "active" : ""} onClick={() => setTable("T4_COMPANY")}>Company-owned outlets</button>
                    </div>
                    <div className="geo-selected-summary">
                      <div><strong>{nfmt(selectedTotal)}</strong><span>total outlets</span></div>
                      <div><strong>{nfmt(selectedStates)}</strong><span>positive states</span></div>
                      <div><strong>{nfmt(selectedOutletYear)}</strong><span>outlet data year</span></div>
                      <div><strong>{yesNo(canonical[`${prefix}_single_state`])}</strong><span>single-state</span></div>
                    </div>
                    {tieStates.length > 1 ? <div className="geo-tie-note"><strong>Co-primary states:</strong> {tieStates.join(" / ")} each report {nfmt(ranking[0].outlets)} outlets. The canonical Primary State uses alphabetical state-code order.</div> : null}
                    {prefix === "company" && selectedTotal === 0 ? <div className="geo-zero-note">This is a valid reported zero company-owned footprint. Primary State is intentionally blank.</div> : null}
                    <div className="geo-table-meta"><span>{ranking.length} positive states</span><span>{selectedConflict ? "Geography conflict — review" : textValue(canonical[`${prefix}_reconcile_status`])} · {textValue(canonical[`${prefix}_selected_source`])}</span></div>
                    <div className="geo-table-wrap geo-ranking-table">
                      <table><thead><tr><th>Rank</th><th>State</th><th>Outlets</th><th>Share</th><th>Distribution</th></tr></thead><tbody>{ranking.map((row) => <tr key={`${prefix}-${row.state}`}><td>{row.rank}</td><th>{row.state}</th><td>{nfmt(row.outlets)}</td><td>{pct(row.share, 2)}</td><td><Bar value={row.share} max={ranking[0]?.share || 1} /></td></tr>)}</tbody></table>
                    </div>
                    <details className="geo-record-details" open>
                      <summary>Canonical Top-1/2/3 and reconciliation fields</summary>
                      <FieldGrid rows={[
                        ["Available", yesNo(canonical[`${prefix}_available`])],
                        ["Outlet data year", canonical[`${prefix}_outlet_data_year`]],
                        ["Total outlets", nfmt(canonical[`${prefix}_total_outlets`] as number)],
                        ["Number of states", nfmt(canonical[`${prefix}_n_states`] as number)],
                        ["Single-state", yesNo(canonical[`${prefix}_single_state`])],
                        ["Top-1", `${textValue(canonical[`${prefix}_top1_state`])} · ${nfmt(canonical[`${prefix}_top1_outlets`] as number)} · ${pct(canonical[`${prefix}_top1_share`] as number, 2)}`],
                        ["Top-2", `${textValue(canonical[`${prefix}_top2_state`])} · ${nfmt(canonical[`${prefix}_top2_outlets`] as number)} · ${pct(canonical[`${prefix}_top2_share`] as number, 2)}`],
                        ["Top-3", `${textValue(canonical[`${prefix}_top3_state`])} · ${nfmt(canonical[`${prefix}_top3_outlets`] as number)} · ${pct(canonical[`${prefix}_top3_share`] as number, 2)}`],
                        ["Geography conflict", yesNo(canonical[`${prefix}_geo_conflict`])],
                        ["Reconciliation", canonical[`${prefix}_reconcile_status`]],
                        ["All sources", canonical[`${prefix}_sources_all`]],
                        ["Selected source", canonical[`${prefix}_selected_source`]],
                        ["Candidate documents", canonical[`${prefix}_n_candidate_docs`]],
                      ]} />
                    </details>
                    {item10 ? (
                      <details className="geo-record-details" open>
                        <summary>Exact Item 10 × Item 20 row</summary>
                        <FieldGrid rows={[
                          ["RiskScore", item10.risk_score], ["Paper-ready", yesNo(item10.paper_ready)], ["Score status", item10.score_status], ["Item 10 sources", item10.item10_sources], ["Financing forms", item10.financing_forms], ["Providers", item10.providers], ["Purposes", item10.purposes], ["V1.2 QC", item10.v1_2_qc_status], ["Resolution rule", item10.v1_2_resolution_rule], ["Offering split", yesNo(item10.offering_split_flag)], ["Documents", item10.documents], ["Unique Item 10 versions", item10.unique_item10_versions], ["Full Item 10 text", yesNo(item10.full_item10_text_available)],
                        ]} />
                        <blockquote>{textValue(item10.evidence_excerpt)}</blockquote>
                      </details>
                    ) : null}
                    {overlap.length ? (
                      <details className="geo-record-details">
                        <summary>Company/franchise co-location row</summary>
                        {overlap.map((row, index) => <FieldGrid key={index} rows={summary.detailSchema.colocation.map((field) => [humanize(field), field.includes("share") ? pct(row[field] as number, 2) : row[field]])} />)}
                      </details>
                    ) : null}
                  </>
                ) : null}
              </>
            ) : null}
          </div>
        </div>
      </section>

      <section className="geo-section geo-audit">
        <div className="shell">
          <div className="geo-heading">
            <div><p className="eyebrow">DOCUMENT LINKAGE AUDIT</p><h2>What happened to all 39,329 source documents?</h2></div>
            <p>Overall identity-link rate uses every scanned TXT in that source. The approximate geography-output rate follows the README’s narrower “documents that produced geography rows” denominator, so the two percentages are intentionally different.</p>
          </div>
          <div className="geo-table-wrap">
            <table><thead><tr><th>Source</th><th>Documents</th><th>Canonical ID linked</th><th>Overall identity-link rate</th><th>Approx. geography-output link rate</th></tr></thead><tbody>{summary.linkageBySource.map((row) => <tr key={row.source}><th>{row.source}</th><td>{nfmt(row.documents)}</td><td>{nfmt(row.linkedDocuments)}</td><td>{pct(row.overallLinkRate)}</td><td>{pct(row.approxGeoOutputLinkRate)}</td></tr>)}</tbody></table>
          </div>
          <div className="geo-audit-grid">
            <article>
              <h3>Item 20 extraction status</h3>
              {summary.item20Statuses.map((row) => <div className="geo-audit-bar" key={row.status}><span>{humanize(row.status || "")}</span><Bar value={row.count} max={summary.item20Statuses[0].count} /><strong>{nfmt(row.count)}</strong><small>{pct(row.share)}</small></div>)}
            </article>
            <article>
              <h3>Canonical linkage method</h3>
              {summary.linkMethods.map((row) => <div className="geo-audit-bar" key={row.method}><span>{humanize(row.method || "")}</span><Bar value={row.count} max={summary.linkMethods[0].count} color="var(--geo-cyan)" /><strong>{nfmt(row.count)}</strong><small>{pct(row.share)}</small></div>)}
              <p className="geo-audit-note">Link score alone is not a success flag: ambiguous exact and unresolved fuzzy rows may still have high scores. Canonical ID non-null + link method determine success.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="geo-section shell">
        <div className="geo-heading">
          <div><p className="eyebrow">MISSING-FDD AUDIT</p><h2>The 16,860-row unified-panel funnel</h2></div>
          <p>这是 unified-panel universe，不是全部 Item 10 V1.2 universe，因此 paper-ready 数为 11,901，而不是 13,124。</p>
        </div>
        <div className="geo-audit-funnel">
          {summary.missingAudit.stages.map((stage) => <article key={stage.field}><strong>{nfmt(stage.count)}</strong><span>{stage.label}</span><Bar value={stage.share} /><small>{pct(stage.share)} of 16,860</small></article>)}
        </div>
        <div className="geo-missing-layout">
          <div className="geo-table-wrap">
            <table><thead><tr><th>Missing / inclusion reason</th><th>Chain-years</th><th>Share</th></tr></thead><tbody>{summary.missingAudit.reasons.map((row) => <tr key={row.reason}><th>{humanize(row.reason || "")}</th><td>{nfmt(row.count)}</td><td>{pct(row.share)}</td></tr>)}</tbody></table>
          </div>
          <aside className="geo-caveat">
            <h3>Exact caveat</h3>
            <p><code>item10_clean</code> means V1.2 analysis-ready / Paper Ready = 1, not the earlier document-text quality gate.</p>
            <p><code>NO_MATCHED_TXT_OR_IDENTITY_LINK</code> means no TXT was safely linked to the canonical chain-year in this reconciliation. It does not prove that no raw file exists on disk.</p>
          </aside>
        </div>
      </section>

      <section className="geo-section geo-method">
        <div className="shell">
          <div className="geo-heading">
            <div><p className="eyebrow">RECONCILIATION & QUALITY</p><h2>What counts as a defensible geography observation?</h2></div>
            <p>原始 PDF 仍是权威来源；网页展示的是由 V5 HIGH-confidence state rows 构造的 research dataset。</p>
          </div>
          <div className="geo-method-grid">
            <article><span>01</span><h3>Canonical linkage</h3><p>NASAA 优先 SBA code；NON_SBA 先做 EFD-to-SBA repair；CA、MN、WI 使用 source metadata 与 name/year linkage。低置信 identity 不强制匹配。</p></article>
            <article><span>02</span><h3>Outlet year</h3><p>同一 chain × FDD year × table type 选择最新合理 outlet year，优先 FDD year − 1。</p></article>
            <article><span>03</span><h3>Duplicate filings</h3><p>按 state-distribution signature 比较；优先一致/多数结果。MAJORITY 与 PLURALITY 仍标记 geo_conflict=1，严格样本排除。</p></article>
            <article><span>04</span><h3>Zeros and exclusions</h3><p>Company-owned systemwide zero 是 0；affiliate-owned、Area Representative 与 Master Franchisee tables 不重分类为普通门店。</p></article>
          </div>
          <div className="geo-quality-grid">
            <article><strong>{nfmt(summary.quality.canonicalRowsAfter2026)}</strong><span>canonical out-of-range year row</span><p>City Express by Marriott 2029 is retained and visibly flagged.</p></article>
            <article><strong>{nfmt(summary.quality.linkageRowsAfter2026)}</strong><span>document audit rows after 2026</span><p>Includes parsed 2029, 2043 and 2083 values; {nfmt(summary.quality.linkageRowsMissingYear)} more lack a filing year.</p></article>
            <article><strong>{nfmt(summary.quality.missingNameRows)}</strong><span>canonical rows without display name</span><p>{nfmt(summary.quality.missingNameCanonicalIds)} IDs use canonical ID as the safe fallback.</p></article>
            <article><strong>{nfmt(summary.quality.nonUniqueDisplayNames)}</strong><span>display names map to multiple IDs</span><p>Display name is never used as a unique join key.</p></article>
          </div>

          <div className="geo-output-heading">
            <div><p className="eyebrow">COMPLETE OUTPUT CATALOG</p><h2>Every file in the supplied package</h2></div>
            <p>源包实际包含 10 个 CSV + README.md；没有 .xlsx workbook。页面提供全部汇总、交互明细与原包下载。</p>
          </div>
          <div className="geo-table-wrap geo-catalog">
            <table><thead><tr><th>File</th><th>Rows</th><th>Columns</th><th>What it contains</th></tr></thead><tbody>{summary.catalog.map((row) => <tr key={row.file}><th><code>{row.file}</code></th><td>{nfmt(row.rows)}</td><td>{nfmt(row.columns)}</td><td>{row.description}</td></tr>)}</tbody></table>
          </div>
          <div className="geo-download">
            <div>
              <h3>Item20 Canonical Geography Outputs v1</h3>
              <p>Original 10 CSV tables + README · {summary.package ? `${(summary.package.bytes / 1024 / 1024).toFixed(1)} MB ZIP` : "package unavailable"} · SHA-256 <code>{summary.package?.sha256.slice(0, 16)}…</code></p>
            </div>
            <button type="button" onClick={downloadPackage} disabled={!summary.package || downloadState === "downloading"}>
              {downloadState === "downloading" ? `Preparing ${(downloadProgress * 100).toFixed(0)}%` : downloadState === "done" ? "Download again" : downloadState === "error" ? "Retry package download" : "Download complete package"}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
