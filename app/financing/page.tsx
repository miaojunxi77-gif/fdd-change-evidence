import type { CSSProperties } from "react";
import EvidenceExplorer from "./evidence-explorer";

const scoreDistribution = [
  { score: 0, label: "No financing involvement", n: 8739, share: 66.59, color: "#9aa69e" },
  { score: 1, label: "Referral / third-party access", n: 765, share: 5.83, color: "#76a88f" },
  { score: 2, label: "Deferred payment / seller credit", n: 1737, share: 13.24, color: "#148c86" },
  { score: 3, label: "Conditional outflow / guarantee", n: 370, share: 2.82, color: "#c99b2f" },
  { score: 4, label: "Direct funded credit", n: 1513, share: 11.53, color: "#275dce" },
];

type AnnualRow = { year:number; n:number; any:number|null; risk:number|null; material:number|null; direct:number|null };
const annual: AnnualRow[] = [
  { year: 2008, n: 1, any: 0.00, risk: 0.00, material: 0.00, direct: 0.00 },
  { year: 2009, n: 0, any: null, risk: null, material: null, direct: null },
  { year: 2010, n: 1, any: 0.00, risk: 0.00, material: 0.00, direct: 0.00 },
  { year: 2011, n: 9, any: 33.33, risk: 33.33, material: 11.11, direct: 11.11 },
  { year: 2012, n: 10, any: 40.00, risk: 30.00, material: 0.00, direct: 0.00 },
  { year: 2013, n: 80, any: 51.25, risk: 38.75, material: 15.00, direct: 10.00 },
  { year: 2014, n: 515, any: 41.17, risk: 29.13, material: 11.07, direct: 8.54 },
  { year: 2015, n: 483, any: 41.20, risk: 27.74, material: 10.77, direct: 7.45 },
  { year: 2016, n: 644, any: 37.42, risk: 27.80, material: 10.71, direct: 8.85 },
  { year: 2017, n: 640, any: 28.59, risk: 21.72, material: 8.13, direct: 6.56 },
  { year: 2018, n: 630, any: 27.30, risk: 21.75, material: 8.10, direct: 6.35 },
  { year: 2019, n: 42, any: 40.48, risk: 35.71, material: 21.43, direct: 11.90 },
  { year: 2020, n: 51, any: 35.29, risk: 27.45, material: 9.80, direct: 7.84 },
  { year: 2021, n: 228, any: 36.84, risk: 30.26, material: 11.84, direct: 10.09 },
  { year: 2022, n: 1518, any: 35.70, risk: 28.92, material: 16.27, direct: 12.78 },
  { year: 2023, n: 1883, any: 31.39, risk: 26.08, material: 14.66, direct: 11.74 },
  { year: 2024, n: 2302, any: 31.71, risk: 27.37, material: 15.20, direct: 12.51 },
  { year: 2025, n: 2510, any: 30.28, risk: 26.49, material: 14.50, direct: 11.83 },
  { year: 2026, n: 1577, any: 37.29, risk: 33.04, material: 19.72, direct: 16.04 },
];

const series = [
  { key: "any" as const, label: "Any support ≥1", color: "#194d3a" },
  { key: "risk" as const, label: "Risk-bearing ≥2", color: "#275dce" },
  { key: "material" as const, label: "Material risk ≥3", color: "#c99b2f" },
  { key: "direct" as const, label: "Direct funded =4", color: "#148c86" },
];

function TrendChart() {
  const left = 62, top = 24, width = 896, height = 258;
  const x = (index: number) => left + (index * width) / (annual.length - 1);
  const y = (value: number) => top + height - (value / 55) * height;
  const segments = (key: typeof series[number]["key"]) => {
    const out: string[][] = []; let current: string[] = [];
    annual.forEach((row,index) => {
      const v = row[key];
      if (v === null) { if (current.length > 1) out.push(current); current = []; }
      else current.push(`${x(index)},${y(v)}`);
    });
    if (current.length > 1) out.push(current);
    return out;
  };
  return (
    <div className="financing-chart-wrap" aria-label="Annual financing support prevalence, 2008 to 2026. 2009 has no paper-ready Item 10 observation.">
      <svg className="financing-trend-chart" viewBox="0 0 1020 350" role="img">
        <title>Annual financing support prevalence by risk threshold</title>
        {[0,10,20,30,40,50].map(tick => <g key={tick}><line x1={left} x2={left+width} y1={y(tick)} y2={y(tick)} className="financing-gridline"/><text x={left-12} y={y(tick)+4} textAnchor="end" className="financing-axis-label">{tick}%</text></g>)}
        {annual.map((row,index)=><g key={row.year}><line x1={x(index)} x2={x(index)} y1={top} y2={top+height} className={row.n < 200 ? "financing-low-sample-band":"financing-year-guide"}/><text x={x(index)} y={top+height+24} textAnchor="middle" className="financing-axis-label">{row.year}</text>{row.n===0&&<text x={x(index)} y={top+height-8} textAnchor="middle" className="financing-axis-label">no obs</text>}</g>)}
        {series.map(item => <g key={item.key}>{segments(item.key).map((pts,i)=><polyline key={i} points={pts.join(" ")} fill="none" stroke={item.color} strokeWidth="3" vectorEffect="non-scaling-stroke"/>)}{annual.map((row,index)=>row[item.key]===null?null:<circle key={row.year} cx={x(index)} cy={y(row[item.key] as number)} r={row.n<200?3.5:4.5} fill={item.color} opacity={row.n<200?0.48:1}/>)}</g>)}
      </svg>
      <div className="financing-chart-legend">{series.map(item=><span key={item.key}><i style={{background:item.color}}/>{item.label}</span>)}</div>
    </div>
  );
}

export default function FinancingPage() {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  return <main>
    <section className="page-hero financing-hero shell">
      <div><p className="eyebrow">ITEM 10 · FRANCHISOR FINANCING SUPPORT · PRODUCTION V1.2</p><h1>How common is financing support—and how often does it change?</h1><p>将第三方转介、延期付款、或有信用风险与直接出资分开编码。分析单位是 chronology / identity QC 后的 franchise offering/system × filing year，而不是单份州申报文件。</p></div>
      <div className="financing-hero-metrics" aria-label="Item 10 production V1.2 sample"><div><strong>13,237</strong><span>reconciled brand-years (incl. 113 NA)</span></div><div><strong>13,124</strong><span>analysis-ready scored brand-years</span></div><div><strong>99.15%</strong><span>scored coverage</span></div><div><strong>113</strong><span>unresolved after V1.2 QC</span></div></div>
    </section>

    <section className="financing-section financing-unit-section"><div className="shell">
      <div className="financing-section-heading compact"><div><p className="eyebrow">UNIT OF OBSERVATION</p><h2>Is this franchisor-level or contract-level?</h2></div><p><strong>Short answer:</strong> 主结果是 <b>franchise offering/system × filing year（brand-year）</b>。同一品牌存在明确不同 offering 时，V1.2 不再强行合并。</p></div>
      <div className="financing-unit-grid"><article><span>01</span><h3>Raw document</h3><p>州 FDD、amendment、marked copy 和 duplicate 都是证据来源，不直接作为回归 observation。</p></article><article><span>02</span><h3>Primary: brand-year</h3><p>同一 offering/system × year 先做 chronology reconciliation；明确 later amendment supersedes earlier version 时采用新版。</p></article><article><span>03</span><h3>Pure franchisor snapshot</h3><p>“一家公司一行”，使用每个 system 最新的 paper-ready 年份。</p></article></div>
      <div className="financing-unit-comparison"><div><p className="eyebrow">SAME DATA, DIFFERENT DENOMINATORS</p><h3>Primary panel versus one-row-per-franchisor</h3></div><div className="financing-unit-table-wrap"><table><thead><tr><th>Measure</th><th>Brand-year panel<br/><small>N = 13,124</small></th><th>Latest-year franchisor<br/><small>N = 4,733</small></th></tr></thead><tbody><tr><th>Any support (≥1)</th><td>33.41%</td><td>28.33%</td></tr><tr><th>Risk-bearing (≥2)</th><td>27.58%</td><td>23.39%</td></tr><tr><th>Material risk (≥3)</th><td>14.35%</td><td>12.15%</td></tr><tr><th>Direct funded (=4)</th><td>11.53%</td><td>9.78%</td></tr></tbody></table></div></div>
    </div></section>

    <section className="financing-section shell"><div className="financing-section-heading"><div><p className="eyebrow">DOCUMENTS ARE NOT OBSERVATIONS</p><h2>Why 39,340 FDD records become 13,237 V1.2 brand-years</h2></div><p>V1.2 在 V1.1 的 identity repair 基础上，再处理 amendment chronology 与 offering scope。不同州本身不会自动决定 controlling version。</p></div>
      <div className="financing-funnel">{[["39,340","document records","完整 document-level 输入"],["33,947","Item 10 found","成功定位 Item 10"],["32,534","clean Item 10","通过 high-confidence quality gate"],["32,455","identity-resolved documents","provenance-first identity linking"],["28,369","panel-contributing documents","排除误抓重复与无效 identity"],["13,237","reconciled brand-years","V1.2 chronology / offering-scope QC 后的最终单位"]].map(([value,label,note],i)=><article key={label}><span>{String(i+1).padStart(2,"0")}</span><strong>{value}</strong><h3>{label}</h3><p>{note}</p></article>)}</div>
      <div className="financing-explainer-grid"><article><strong>19</strong><span>chronology-resolved conflicts</span><p>later amendment/version 在同一 offering 内明确 supersede earlier filing，因此可安全赋最终分数。</p></article><article><strong>25</strong><span>offering / identity scope reviews</span><p>把 Unit、Area Representative、Master License、Traditional / Non-Traditional 等不同 offering 拆开或 remap。</p></article><article><strong>113</strong><span>unresolved retained as NA</span><p>V1.2 后仍无法安全确定 national controlling score 的 observation 不强制赋值。</p></article><article><strong>4,744</strong><span>reconciled systems / offerings</span><p>不同年份 coverage 不均衡；年度趋势必须同时看每年的样本量。</p></article></div>
    </section>

    <section className="financing-section financing-paper-section"><div className="shell"><div className="financing-section-heading compact"><div><p className="eyebrow">RISK-BEARING LADDER</p><h2>One label is not enough for “financing support”</h2></div><p>Score 1 主要降低搜索或接入成本；Score 2–4 才逐步增加 franchisor/affiliate 的信用暴露。</p></div><div className="financing-score-layout"><div className="financing-score-ladder">{scoreDistribution.map(row=><article key={row.score}><span className="financing-score-number" style={{borderColor:row.color,color:row.color}}>{row.score}</span><div><strong>{row.label}</strong><p>{row.n.toLocaleString()} brand-years · {row.share.toFixed(2)}%</p></div></article>)}</div><div className="financing-distribution-card"><p className="eyebrow">SCORE DISTRIBUTION</p><h3>Analysis-ready scored sample, N = 13,124</h3><div className="financing-bars">{scoreDistribution.map(row=><div key={row.score}><span>Score {row.score}</span><div><i style={{width:`${row.share}%`,background:row.color} as CSSProperties}/></div><strong>{row.share.toFixed(2)}%</strong></div>)}</div><p className="financing-chart-note">Score 0 仍约占三分之二；“Any support”不能等同于直接贷款。</p></div></div></div></section>

    <section className="financing-section shell"><div className="financing-section-heading compact"><div><p className="eyebrow">HEADLINE PREVALENCE</p><h2>Support is common; direct funded credit is not</h2></div><p>以下比例均以 13,124 个 V1.2 analysis-ready scored brand-years 为分母（即最终 RiskScore 可确定为 0–4）。</p></div><div className="financing-threshold-grid"><article><span>Score ≥ 1</span><strong>33.41%</strong><h3>Any support</h3><p>4,385 brand-years。</p></article><article><span>Score ≥ 2</span><strong>27.58%</strong><h3>Risk-bearing support</h3><p>3,620 brand-years。</p></article><article><span>Score ≥ 3</span><strong>14.35%</strong><h3>Material credit risk</h3><p>1,883 brand-years。</p></article><article><span>Score = 4</span><strong>11.53%</strong><h3>Direct funded credit</h3><p>1,513 brand-years。</p></article></div></section>

    <section className="financing-section shell"><div className="financing-section-heading compact"><div><p className="eyebrow">TIME TREND</p><h2>Annual prevalence by financing-risk threshold</h2></div><p>横轴现在明确保留 2009。该年 <b>n = 0</b>，因此显示为缺口而不是 0%：没有 analysis-ready scored Item 10 observation，就没有可定义的 prevalence。2008–2012 年样本极小，只用于展示 coverage。</p></div><TrendChart/><div className="financing-year-samples" aria-label="Annual sample sizes">{annual.map(row=><span key={row.year}><strong>{row.year}</strong>{row.n===0?"n=0 · no obs":`n=${row.n.toLocaleString()}`}</span>)}</div></section>

    <section className="financing-section financing-change-section"><div className="shell"><div className="financing-section-heading compact"><div><p className="eyebrow">WITHIN-FIRM CHANGES</p><h2>The direct answer to “How many changes?”</h2></div><p>分母是同一 reconciled offering/system 的 7,070 个 consecutive analysis-ready scored brand-year pairs。</p></div><div className="financing-change-hero"><article><span>Intensity definition</span><strong>349</strong><h3>RiskScore changes</h3><p>349 / 7,070 = <b>4.94%</b>。</p></article><article><span>Binary definition</span><strong>281</strong><h3>No support ↔ any support</h3><p>281 / 7,070 = <b>3.97%</b>：135 次开始提供，146 次停止提供。</p></article></div><div className="financing-transition-grid"><article><strong>135</strong><span>0 → support</span><small>1.91% of pairs</small></article><article><strong>146</strong><span>support → 0</span><small>2.07% of pairs</small></article><article><strong>168</strong><span>risk increases</span><small>2.38% of pairs</small></article><article><strong>181</strong><span>risk decreases</span><small>2.56% of pairs</small></article><article><strong>63</strong><span>0–2 → 3–4</span><small>0.89% of pairs</small></article><article><strong>47</strong><span>3–4 → 0–2</span><small>0.66% of pairs</small></article></div>
      <div className="financing-change-examples-head"><div><p className="eyebrow">REPRESENTATIVE CASES</p><h3>What do these transitions look like in the actual Item 10 language?</h3></div><p>下面每一类给一个真实例子。完整的 349 个 changed pairs 都在下方 <b>Within-firm changes</b> 标签页；点击 <b>Compare years</b> 可展开两年的完整 extracted Item 10 正文。</p></div>
      <div className="financing-change-examples">
        <article><span>0 → support</span><h3>1 Percent Lists · 2024 → 2025</h3><strong>Score 0 → 2</strong><p><b>Before:</b> “We do not offer direct or indirect financing.”</p><p><b>After:</b> “The only financing that we offer is for the initial franchise fee … paid over a period of two years.”</p></article>
        <article><span>support → 0</span><h3>Crumbl · 2024 → 2025</h3><strong>Score 4 → 0</strong><p><b>Before:</b> “We (Crumbl Franchising, LLC) are the lender …”</p><p><b>After:</b> “Neither we nor our affiliates offer direct or indirect financing.”</p></article>
        <article><span>risk increase</span><h3>Christian Brothers Automotive · 2022 → 2023</h3><strong>Score 2 → 4</strong><p><b>Before:</b> financing was limited mainly to a portion of the down payment.</p><p><b>After:</b> CBAC may offer short-term unsecured loans of at least $50,000 for required remodels and renovations.</p></article>
        <article><span>risk decrease</span><h3>Anytime Fitness · 2021 → 2022</h3><strong>Score 4 → 3</strong><p><b>Before:</b> a direct bridge-financing program could provide up to $150,000 for tenant improvements.</p><p><b>After:</b> direct lending language disappears, while guarantee / contingent obligations remain.</p></article>
        <article><span>0–2 → 3–4</span><h3>3 Natives · 2023 → 2024</h3><strong>Score 0 → 3</strong><p><b>Before:</b> “We do not guarantee your loan or obligations.”</p><p><b>After:</b> its parent “may provide a lease guarantee” to the lessor of a franchised business.</p></article>
        <article><span>3–4 → 0–2</span><h3>American Freight · 2022 → 2023</h3><strong>Score 3 → 0</strong><p><b>Before:</b> the franchisor would guarantee up to an aggregate $500,000 of debt under a financing program.</p><p><b>After:</b> “We do not offer direct or indirect financing and we do not guarantee” the franchisee’s financial obligations.</p></article>
      </div>
    </div></section>

    <section className="financing-section shell" id="financing-evidence"><div className="financing-section-heading compact"><div><p className="eyebrow">AUDITABLE EVIDENCE EXPLORER</p><h2>Firm, year, score—and the original Item 10 language</h2></div><p><b>13,237</b> 是全部 reconciled brand-years；其中 <b>13,124</b> 已得到可用于分析的最终 Score 0–4，默认表格只显示这部分；<b>10,886</b> 则是全部 13,237 中网页保存了完整 extracted Item 10 text 的子集。这三个数字衡量的是不同事情。</p></div><div className="financing-evidence-notes"><article><strong>13,124 / 13,237</strong><span>analysis-ready scored brand-years</span><p>RiskScore 已在 chronology / identity / offering-scope QC 后确定为 0–4；其余 113 个保留为 NA。</p></article><article><strong>10,886 / 13,237</strong><span>brand-years with full extracted text</span><p>这是 text-availability 指标，不是主分析样本分母；没有 full text 的记录仍展示用于 coding 的 evidence quote。</p></article><article><strong>349 / 7,070</strong><span>within-firm score changes</span><p>切换到 <b>Within-firm changes</b> 可逐条查看 firm、年份、before/after score、evidence quote，并展开两年的完整正文。</p></article></div><div className="financing-answer-box"><span>Why can a reconciled brand-year still have Score = NA?</span><p><b>Reconciled</b> 的意思是原始 FDD 已经被正确归到同一个 canonical offering/system × year，并完成 chronology、identity 和 offering-scope 检查；它不等于“必须强行得到一个分数”。如果同一 offering-year 下仍有两个都有效、同时期但 Item 10 实质不同的州/来源版本，而且没有证据表明其中一个 supersede 另一个，就不能人为选一个全国统一分数。这样的 observation 仍保留在 13,237 个 reconciled brand-years 中，但 RiskScore 记为 NA。因此 13,124 个有唯一可辩护的 Score 0–4，另外 113 个仍保留为 unresolved。</p></div><EvidenceExplorer basePath={basePath}/></section>

    <section className="financing-section shell"><div className="financing-section-heading compact"><div><p className="eyebrow">CONSERVATIVE V1.2 FREEZE</p><h2>Remaining unresolved cases stay missing, not forced into a score</h2></div><p>113 observations（0.85%）在 chronology / identity / offering-scope QC 后仍保留为 NA。</p></div><div className="financing-sensitivity-grid">{[["Any support","33.13%","33.98%"],["Risk-bearing","27.35%","28.20%"],["Material risk","14.23%","15.08%"],["Direct funded","11.43%","12.28%"]].map(([label,low,high])=><article key={label}><h3>{label}</h3><div><span>{low}</span><i/><span>{high}</span></div><p>lower–upper bound</p></article>)}</div></section>

    <section className="financing-section financing-download-section"><div className="shell financing-download-inner"><div><p className="eyebrow">PRODUCTION V1.2 · FROZEN 2026-09-08</p><h2>Chronology / identity QC rebuild</h2></div></div></section>
  </main>;
}