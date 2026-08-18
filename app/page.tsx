import Link from "next/link";
import { EvidenceWorkbench } from "./components";

const sampleFindings = [
  {
    route: "consecutive",
    eyebrow: "DESIGN A · CONSECUTIVE-YEAR",
    title: "连续年度 DeepSeek 清洗结果",
    description: "4,352 个两年 Item 范围完整的比较；比例按各 Item 的完整比较数计算。",
    substantive: "38.2%",
    contractual: "24.8%",
    scoreZero: "61.8%",
    direction:
      "7,705 条纳入变化中，2,826 条指向经济负担增加、841 条指向负担减少；2,859 条控制转向特许人、670 条转向加盟商。",
    items: [
      { item: 11, title: "支持、广告、系统与培训", rate: 81.0 },
      { item: 7, title: "预计初始投资", rate: 79.4 },
      { item: 6, title: "其他费用", rate: 78.9 },
      { item: 5, title: "初始费用", rate: 69.4 },
      { item: 19, title: "财务业绩陈述", rate: 61.1 },
    ],
  },
  {
    route: "cross-period",
    eyebrow: "DESIGN B · CROSS-PERIOD",
    title: "跨期 DeepSeek v4.5 生产结果",
    description: "1,334 个成功生产比较；变化率按 outcome-ready 原子变化口径计算。",
    substantive: "57.3%",
    contractual: "46.0%",
    scoreZero: "21.1%",
    direction:
      "14,505 条候选原子变化中：修改 7,606 条、新增 4,941 条、删除 1,405 条、重新分类 553 条；其中 6,211 条通过 outcome-ready 门槛。",
    items: [
      { item: 11, title: "支持、广告、系统与培训", rate: 82.7 },
      { item: 7, title: "预计初始投资", rate: 82.0 },
      { item: 6, title: "其他费用", rate: 75.3 },
      { item: 17, title: "续约、终止、转让与争议解决", rate: 67.3 },
      { item: 5, title: "初始费用", rate: 65.5 },
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
            连续年度与跨期结果现已统一为 DeepSeek 生产输出：从总体比例下钻到公司、年份、
            Item、每条原子变化与英文证据，并标明新增、修改、删除和重新分类。
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
            <strong>4,352</strong>
            <span>个完整连续年度比较</span>
          </div>
          <div>
            <strong>7,705</strong>
            <span>条保守实质变化</span>
          </div>
          <div>
            <strong>38.2%</strong>
            <span>完整比较含纳入变化</span>
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
            有，而且并非平均分布。两条路线均已换为 DeepSeek 生产结果，
            但因抽样设计和结果门槛不同，仍分别计算与展示。
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
                <div><strong>{finding.substantive}</strong><span>{finding.route === "consecutive" ? "含保守变化" : "含 outcome-ready 变化"}</span></div>
                <div><strong>{finding.contractual}</strong><span>{finding.route === "consecutive" ? "含 score 4–5" : "含高影响 ready 变化"}</span></div>
                <div><strong>{finding.scoreZero}</strong><span>{finding.route === "consecutive" ? "无纳入变化" : "无候选原子变化"}</span></div>
              </div>
              <div className="direction-summary">
                <span>DOMINANT DIRECTION</span>
                <p>{finding.direction}</p>
              </div>
              <div className="top-item-heading">
                <strong>实质变化率最高的 Item</strong>
                <span>{finding.route === "consecutive" ? "完整比较比例" : "outcome-ready 比例"}</span>
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
          <strong>如何解读：</strong>两条路线均为 DeepSeek 生产结果，但抽样设计、时间跨度与发布门槛不同。
          两组比例只适合各自描述对应样本，不应当作完全同口径的直接对照；变化类型不是对变化原因的推断。
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
          <p>本次 DeepSeek 生产共准备 4,557 个任务；4,352 个比较具有两年完整 Item 范围。清洗后保留 7,705 条变化，涉及 1,661 个品牌—Item—年份比较。</p>
          <Link className="text-link" href="/consecutive">查看 23 个 Item 排名 →</Link>
        </article>
        <article>
          <span className="route-number">02</span>
          <p className="eyebrow">TARGETED ROUTE</p>
          <h2>跨期实质变化</h2>
          <p>DeepSeek v4.5 跨期包已完成结构审计并投入生产展示：1,334 个成功比较、14,505 条候选原子变化，其中 6,211 条为 outcome-ready。</p>
          <Link className="text-link" href="/substantive">查看重点条款结果 →</Link>
        </article>
      </section>
    </main>
  );
}
