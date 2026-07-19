import Link from "next/link";
import { EvidenceWorkbench } from "./components";

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
            <strong>200</strong>
            <span>对连续年度 FDD</span>
          </div>
          <div>
            <strong>4,600</strong>
            <span>个 Item 对比</span>
          </div>
          <div>
            <strong>100%</strong>
            <span>评分完成</span>
          </div>
        </div>
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
