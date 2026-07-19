import Link from "next/link";
import { EvidenceWorkbench } from "./components";

const sampleFindings = [
  {
    route: "consecutive",
    eyebrow: "DESIGN A · CONSECUTIVE-YEAR",
    title: "连续年度样本",
    description: "23 个 Item × 每项 200 个对比；比例按实际抽样单元加权。",
    substantive: "28.1%",
    contractual: "17.0%",
    scoreZero: "43.7%",
    direction:
      "在加权后的实质变化中，57.1% 属于条款加强，29.4% 属于新增；削弱占 5.6%，删除占 2.5%。",
    items: [
      { item: 6, title: "其他费用", rate: 66.5 },
      { item: 7, title: "预计初始投资", rate: 60.2 },
      { item: 11, title: "支持、系统与培训", rate: 55.3 },
      { item: 5, title: "初始费用", rate: 54.1 },
      { item: 19, title: "财务业绩陈述", rate: 51.3 },
    ],
  },
  {
    route: "cross-period",
    eyebrow: "DESIGN B · CROSS-PERIOD",
    title: "跨期重点 Item 样本",
    description: "9 个重点 Item × 每项 150 个对比；比例按实际抽样单元加权。",
    substantive: "55.4%",
    contractual: "36.4%",
    scoreZero: "24.6%",
    direction:
      "在加权后的实质变化中，58.2% 属于条款加强，27.2% 属于新增；削弱占 4.1%，删除占 3.4%。",
    items: [
      { item: 6, title: "其他费用", rate: 84.8 },
      { item: 7, title: "预计初始投资", rate: 79.0 },
      { item: 5, title: "初始费用", rate: 78.0 },
      { item: 11, title: "支持、系统与培训", rate: 74.8 },
      { item: 19, title: "财务业绩陈述", rate: 67.2 },
    ],
  },
];

export default function Home() {
  return (
    <main>
      <section className="hero shell">
        <div className="hero-copy">
          <p className="eyebrow">FRANCHISE CONTRACT EVIDENCE</p>
          <h1>Contractual Change in Franchise Disclosure Documents</h1>
          <p className="hero-subtitle">
            Consecutive-Year Variation and Cross-Period Substantive Change
          </p>
          <p className="hero-summary">
            从总体比例下钻到公司、年份、Item 与原文证据。每一项判断都保留
            FDD 年份、原始页码、英文引文与人工修正记录。
          </p>
          <div className="hero-actions">
            <Link className="button primary" href="/cases">
              浏览公司案例 <span>→</span>
            </Link>
            <Link className="button secondary" href="/method">
              查看研究方法
            </Link>
          </div>
        </div>
        <div className="metric-band" aria-label="Research sample summary">
          <div>
            <strong>474</strong>
            <span>家去重公司 / 品牌</span>
          </div>
          <div>
            <strong>5,950</strong>
            <span>个 Item 层面对比</span>
          </div>
          <div>
            <strong>100%</strong>
            <span>评分完成</span>
          </div>
        </div>
      </section>

      <section className="overview-findings shell" aria-labelledby="overview-findings-title">
        <div className="overview-findings-heading">
          <div>
            <p className="eyebrow">SAMPLE FINDINGS</p>
            <h2 id="overview-findings-title">这批样本里，Item 发生了多少实质变化？</h2>
          </div>
          <p>
            有，而且并非平均分布。这里把两个研究设计分开报告：实质变化指评分 ≥ 3；
            合同性变化还要求权利、义务、裁量或经济条款发生改变。
          </p>
        </div>

        <div className="overview-design-grid">
          {sampleFindings.map((finding) => (
            <article className="overview-design-card" key={finding.route}>
              <p className="eyebrow">{finding.eyebrow}</p>
              <div className="overview-design-title">
                <h3>{finding.title}</h3>
                <p>{finding.description}</p>
              </div>
              <div className="overview-rate-grid">
                <div><strong>{finding.substantive}</strong><span>实质变化</span></div>
                <div><strong>{finding.contractual}</strong><span>合同性变化</span></div>
                <div><strong>{finding.scoreZero}</strong><span>Score 0</span></div>
              </div>
              <div className="direction-summary">
                <span>DOMINANT DIRECTION</span>
                <p>{finding.direction}</p>
              </div>
              <div className="top-item-heading">
                <strong>实质变化率最高的 Item</strong>
                <span>加权比例</span>
              </div>
              <ol className="summary-item-list">
                {finding.items.map((entry) => (
                  <li key={entry.item}>
                    <Link href={`/items?route=${finding.route}&item=${entry.item}`}>
                      <span className="summary-item-copy"><b>Item {entry.item}</b><span>{entry.title}</span></span>
                      <strong>{entry.rate.toFixed(1)}%</strong>
                      <span className="summary-rate-track" aria-hidden="true">
                        <span style={{ width: `${entry.rate}%` }} />
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            </article>
          ))}
        </div>

        <p className="overview-comparison-note">
          <strong>如何解读：</strong>跨期比例更高，部分原因是该设计聚焦 9 个重点 Item，且包含 4–6 年和 7 年以上的时间间隔。
          因此两个比例适合各自描述样本，不应当作完全同口径的直接对照；“方向”是变化分类，不是对变化原因的推断。
        </p>
      </section>

      <div className="shell">
        <EvidenceWorkbench />
      </div>

      <section className="route-intro shell">
        <article>
          <span className="route-number">01</span>
          <p className="eyebrow">DISCOVERY ROUTE</p>
          <h2>连续年变化</h2>
          <p>固定 200 对连续年度 FDD，对 Items 1–23 逐项评分，先发现哪些条款真正发生变化，再进入原文案例。</p>
          <Link className="text-link" href="/consecutive">查看 23 个 Item 排名 →</Link>
        </article>
        <article>
          <span className="route-number">02</span>
          <p className="eyebrow">TARGETED ROUTE</p>
          <h2>跨期实质变化</h2>
          <p>针对 9 个重点 Item，每项保留 150 个质量合格对比，报告加权实质变化率、重大合同变化与置信区间。</p>
          <Link className="text-link" href="/substantive">查看重点条款结果 →</Link>
        </article>
      </section>
    </main>
  );
}
