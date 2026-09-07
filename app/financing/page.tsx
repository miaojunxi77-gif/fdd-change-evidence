import type { CSSProperties } from "react";

const scoreDistribution = [
  { score: 0, label: "No financing involvement", n: 8722, share: 66.75, color: "#9aa69e" },
  { score: 1, label: "Referral / third-party access", n: 759, share: 5.81, color: "#76a88f" },
  { score: 2, label: "Deferred payment / seller credit", n: 1717, share: 13.14, color: "#148c86" },
  { score: 3, label: "Conditional outflow / guarantee", n: 367, share: 2.81, color: "#c99b2f" },
  { score: 4, label: "Direct funded credit", n: 1502, share: 11.49, color: "#275dce" },
];

const annual = [
  { year: 2013, n: 80, any: 51.25, risk: 38.75, material: 15.00, direct: 10.00 },
  { year: 2014, n: 515, any: 41.17, risk: 29.13, material: 11.07, direct: 8.54 },
  { year: 2015, n: 483, any: 41.20, risk: 27.74, material: 10.77, direct: 7.45 },
  { year: 2016, n: 644, any: 37.42, risk: 27.80, material: 10.71, direct: 8.85 },
  { year: 2017, n: 640, any: 28.59, risk: 21.72, material: 8.13, direct: 6.56 },
  { year: 2018, n: 630, any: 27.30, risk: 21.75, material: 8.10, direct: 6.35 },
  { year: 2019, n: 42, any: 40.48, risk: 35.71, material: 21.43, direct: 11.90 },
  { year: 2020, n: 51, any: 35.29, risk: 27.45, material: 9.80, direct: 7.84 },
  { year: 2021, n: 228, any: 36.84, risk: 30.26, material: 11.84, direct: 10.09 },
  { year: 2022, n: 1499, any: 35.22, risk: 28.42, material: 16.14, direct: 12.74 },
  { year: 2023, n: 1870, any: 31.18, risk: 25.94, material: 14.60, direct: 11.66 },
  { year: 2024, n: 2295, any: 31.59, risk: 27.28, material: 15.16, direct: 12.46 },
  { year: 2025, n: 2498, any: 30.10, risk: 26.34, material: 14.45, direct: 11.81 },
  { year: 2026, n: 1571, any: 37.11, risk: 32.91, material: 19.73, direct: 16.04 },
];

const series = [
  { key: "any" as const, label: "Any support ≥1", color: "#194d3a" },
  { key: "risk" as const, label: "Risk-bearing ≥2", color: "#275dce" },
  { key: "material" as const, label: "Material risk ≥3", color: "#c99b2f" },
  { key: "direct" as const, label: "Direct funded =4", color: "#148c86" },
];

function TrendChart() {
  const left = 62;
  const top = 24;
  const width = 896;
  const height = 258;
  const x = (index: number) => left + (index * width) / (annual.length - 1);
  const y = (value: number) => top + height - (value / 50) * height;

  return (
    <div className="financing-chart-wrap" aria-label="Annual financing support prevalence, 2013 to 2026">
      <svg className="financing-trend-chart" viewBox="0 0 1020 340" role="img">
        <title>Annual financing support prevalence by risk threshold</title>
        {[0, 10, 20, 30, 40, 50].map((tick) => (
          <g key={tick}>
            <line x1={left} x2={left + width} y1={y(tick)} y2={y(tick)} className="financing-gridline" />
            <text x={left - 12} y={y(tick) + 4} textAnchor="end" className="financing-axis-label">{tick}%</text>
          </g>
        ))}
        {annual.map((row, index) => (
          <g key={row.year}>
            <line x1={x(index)} x2={x(index)} y1={top} y2={top + height} className={row.n < 200 ? "financing-low-sample-band" : "financing-year-guide"} />
            <text x={x(index)} y={top + height + 24} textAnchor="middle" className="financing-axis-label">{row.year}</text>
          </g>
        ))}
        {series.map((item) => {
          const points = annual.map((row, index) => `${x(index)},${y(row[item.key])}`).join(" ");
          return (
            <g key={item.key}>
              <polyline points={points} fill="none" stroke={item.color} strokeWidth="3" vectorEffect="non-scaling-stroke" />
              {annual.map((row, index) => (
                <circle
                  key={row.year}
                  cx={x(index)}
                  cy={y(row[item.key])}
                  r={row.n < 200 ? 3.5 : 4.5}
                  fill={item.color}
                  opacity={row.n < 200 ? 0.48 : 1}
                />
              ))}
            </g>
          );
        })}
      </svg>
      <div className="financing-chart-legend">
        {series.map((item) => (
          <span key={item.key}><i style={{ background: item.color }} />{item.label}</span>
        ))}
      </div>
    </div>
  );
}

export default function FinancingPage() {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

  return (
    <main>
      <section className="page-hero financing-hero shell">
        <div>
          <p className="eyebrow">ITEM 10 · FRANCHISOR FINANCING SUPPORT</p>
          <h1>How common is financing support—and how often does it change?</h1>
          <p>
            将第三方转介、延期付款、或有信用风险与直接出资分开编码。分析单位是经过 identity reconciliation 的 franchise system × year，而不是单份州申报文件。
          </p>
        </div>
        <div className="financing-hero-metrics" aria-label="Item 10 production sample">
          <div><strong>13,222</strong><span>reconciled brand-years</span></div>
          <div><strong>13,067</strong><span>paper-ready observations</span></div>
          <div><strong>98.83%</strong><span>paper-ready coverage</span></div>
          <div><strong>155</strong><span>unresolved score conflicts</span></div>
        </div>
      </section>

      <section className="financing-section shell">
        <div className="financing-section-heading">
          <div><p className="eyebrow">DOCUMENTS ARE NOT OBSERVATIONS</p><h2>Why 39,340 FDD records become 13,222 brand-years</h2></div>
          <p>同一品牌同一年可能在多个州申报，也可能同时出现 clean copy、marked copy、amendment 或完全相同的重复文本。回归需要把这些文件合并成一个可解释的品牌—年份单位。</p>
        </div>

        <div className="financing-funnel">
          {[
            ["39,340", "document records", "完整 document-level 输入"],
            ["33,947", "Item 10 found", "成功定位 Item 10"],
            ["32,534", "clean Item 10", "通过 high-confidence quality gate"],
            ["32,455", "identity-resolved documents", "按 provenance-first 规则建立 brand/year identity"],
            ["28,369", "panel-contributing documents", "排除误抓重复、无效 identity 与 exact duplicates"],
            ["13,222", "reconciled brand-years", "合并州申报与同年版本，并保留真实 offering split"],
          ].map(([value, label, note], index) => (
            <article key={label}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{value}</strong>
              <h3>{label}</h3>
              <p>{note}</p>
            </article>
          ))}
        </div>

        <div className="financing-explainer-grid">
          <article><strong>10,780</strong><span>unique Item 10 texts</span><p>完全相同的文本只做一次 semantic coding，再按 hash 写回所有文件；因此 unique texts 不等于 brand-years。</p></article>
          <article><strong>4,069</strong><span>misbucket duplicates</span><p>同一 EFD_ID + DOC_ID 的 NON_SBA 搜索副本统一 remap 到正式 NASAA identity，并从 aggregation 排除。</p></article>
          <article><strong>28,369</strong><span>panel-contributing documents</span><p>所有 clean documents 都有明确 identity action；79 份 identity/year unresolved 保留在 review queue。</p></article>
          <article><strong>4,736</strong><span>reconciled systems</span><p>最终 panel 覆盖 2008–2026；不同年份的 coverage 不均衡，年度趋势需要同时查看每年的样本量。</p></article>
        </div>
      </section>

      <section className="financing-section financing-paper-section">
        <div className="shell">
          <div className="financing-section-heading compact">
            <div><p className="eyebrow">RISK-BEARING LADDER</p><h2>One label is not enough for “financing support”</h2></div>
            <p>Score 1 主要降低搜索或接入成本；Score 2–4 才逐步增加 franchisor/affiliate 的信用暴露。网页因此同时报告 broad support 和 risk-bearing thresholds。</p>
          </div>
          <div className="financing-score-layout">
            <div className="financing-score-ladder">
              {scoreDistribution.map((row) => (
                <article key={row.score}>
                  <span className="financing-score-number" style={{ borderColor: row.color, color: row.color }}>{row.score}</span>
                  <div><strong>{row.label}</strong><p>{row.n.toLocaleString()} brand-years · {row.share.toFixed(2)}%</p></div>
                </article>
              ))}
            </div>
            <div className="financing-distribution-card">
              <p className="eyebrow">SCORE DISTRIBUTION</p>
              <h3>Paper-ready sample, N = 13,067</h3>
              <div className="financing-bars">
                {scoreDistribution.map((row) => (
                  <div key={row.score}>
                    <span>Score {row.score}</span>
                    <div><i style={{ width: `${row.share}%`, background: row.color } as CSSProperties} /></div>
                    <strong>{row.share.toFixed(2)}%</strong>
                  </div>
                ))}
              </div>
              <p className="financing-chart-note">Score 0 accounts for two-thirds of the sample. “Any support” is therefore meaningful but should not be read as direct lending.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="financing-section shell">
        <div className="financing-section-heading compact">
          <div><p className="eyebrow">HEADLINE PREVALENCE</p><h2>Support is common; direct funded credit is not</h2></div>
          <p>以下比例都以 13,067 个 paper-ready brand-years 为分母。</p>
        </div>
        <div className="financing-threshold-grid">
          <article><span>Score ≥ 1</span><strong>33.25%</strong><h3>Any support</h3><p>4,345 brand-years；包括转介与第三方接入支持。</p></article>
          <article><span>Score ≥ 2</span><strong>27.44%</strong><h3>Risk-bearing support</h3><p>3,586 brand-years；包括延期付款及更强信用暴露。</p></article>
          <article><span>Score ≥ 3</span><strong>14.30%</strong><h3>Material credit risk</h3><p>1,869 brand-years；保证、回购或其他重大或有风险。</p></article>
          <article><span>Score = 4</span><strong>11.49%</strong><h3>Direct funded credit</h3><p>1,502 brand-years；franchisor 或 affiliate 直接提供资金。</p></article>
        </div>
      </section>

      <section className="financing-section shell">
        <div className="financing-section-heading compact">
          <div><p className="eyebrow">TIME TREND</p><h2>Annual prevalence by financing-risk threshold</h2></div>
          <p>图从 2013 年开始；2008–2012 年合计仅 21 个 observations，保留在下载数据中但不进入折线。圆点透明度较低的 2013、2019 与 2020 年样本量小于 200，不应把这些年份的波动单独解释为经济趋势。</p>
        </div>
        <TrendChart />
        <div className="financing-year-samples" aria-label="Annual sample sizes">
          {annual.map((row) => <span key={row.year}><strong>{row.year}</strong>n={row.n.toLocaleString()}</span>)}
        </div>
      </section>

      <section className="financing-section financing-change-section">
        <div className="shell">
          <div className="financing-section-heading compact">
            <div><p className="eyebrow">WITHIN-FIRM CHANGES</p><h2>The direct answer to “How many changes?”</h2></div>
            <p>分母是同一 reconciled system 的 7,013 个 consecutive brand-year pairs，而且前后两年都必须是 paper-ready。</p>
          </div>
          <div className="financing-change-hero">
            <article><span>Intensity definition</span><strong>341</strong><h3>RiskScore changes</h3><p>341 / 7,013 = <b>4.86%</b>。只要 0–4 分发生变化就计入。</p></article>
            <article><span>Binary definition</span><strong>274</strong><h3>No support ↔ any support</h3><p>274 / 7,013 = <b>3.91%</b>。包括 130 次开始提供和 144 次停止提供。</p></article>
          </div>
          <div className="financing-transition-grid">
            <article><strong>130</strong><span>0 → support</span><small>1.85% of pairs</small></article>
            <article><strong>144</strong><span>support → 0</span><small>2.05% of pairs</small></article>
            <article><strong>163</strong><span>risk increases</span><small>2.32% of pairs</small></article>
            <article><strong>178</strong><span>risk decreases</span><small>2.54% of pairs</small></article>
            <article><strong>62</strong><span>0–2 → 3–4</span><small>0.88% of pairs</small></article>
            <article><strong>45</strong><span>3–4 → 0–2</span><small>0.64% of pairs</small></article>
          </div>
          <div className="financing-answer-box">
            <span>Suggested advisor wording</span>
            <p>“Among 7,013 consecutive within-brand year pairs, I find 341 changes in financing-support intensity (4.86%). Using a binary no-support versus any-support definition, there are 274 switches (3.91%): 130 entries into support and 144 exits.”</p>
          </div>
        </div>
      </section>

      <section className="financing-section shell">
        <div className="financing-section-heading compact">
          <div><p className="eyebrow">CONSERVATIVE FREEZE</p><h2>Unresolved cases stay missing, not forced into a score</h2></div>
          <p>155 observations（1.17%）保留为 NA：93 个是 V1 已知 unresolved cases，62 个是 identity repair 恢复文档后新暴露的同年版本差异。</p>
        </div>
        <div className="financing-sensitivity-grid">
          {[
            ["Any support", "32.86%", "34.03%"],
            ["Risk-bearing", "27.12%", "28.29%"],
            ["Material risk", "14.14%", "15.31%"],
            ["Direct funded", "11.36%", "12.53%"],
          ].map(([label, low, high]) => (
            <article key={label}><h3>{label}</h3><div><span>{low}</span><i /><span>{high}</span></div><p>lower–upper bound</p></article>
          ))}
        </div>
        <p className="financing-sensitivity-note">所有核心比例的最大区间宽度为 1.17 percentage points，因此主要结论不由 unresolved conflicts 驱动。</p>
      </section>

      <section className="financing-section financing-download-section">
        <div className="shell financing-download-inner">
          <div><p className="eyebrow">PRODUCTION V1.1 · FROZEN 2026-09-07</p><h2>Derived summaries for replication</h2><p>本页已按 provenance-first identity repair 更新；网站只发布派生汇总，不公开原始 PDF 或完整 Item 10 正文。</p></div>
          <div className="financing-download-links">
            <a href={`${basePath}/data/item10-financing/annual-trends.csv`} download>Annual trends CSV</a>
            <a href={`${basePath}/data/item10-financing/risk-distribution.csv`} download>Risk distribution CSV</a>
            <a href={`${basePath}/data/item10-financing/transition-summary.csv`} download>Transition summary CSV</a>
            <a href={`${basePath}/data/item10-financing/sensitivity-bounds.csv`} download>Sensitivity bounds CSV</a>
            <a href={`${basePath}/data/item10-financing/v1-v1.1-impact.csv`} download>V1 vs V1.1 impact CSV</a>
          </div>
        </div>
      </section>
    </main>
  );
}

