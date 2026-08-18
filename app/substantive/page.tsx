import Link from "next/link";
import { ChangeTypeSummary, ResultsExplorer } from "../components";
import { crossPeriodChangeSummary, crossPeriodItems } from "../data";

export default function SubstantivePage() {
  return (
    <main>
      <section className="page-hero shell">
        <div>
          <p className="eyebrow">CROSS-PERIOD SUBSTANTIVE CHANGE</p>
          <h1>How often do economically important FDD clauses change?</h1>
          <p>本页已替换为 DeepSeek v4.5 最终跨期生产包，覆盖 9 个重点 Item 与一年、4–6 年和 7 年以上的时间间隔。1,334 个准备任务全部成功返回，其中 1,327 个两侧 Item 范围完整。</p>
        </div>
        <div className="page-metrics">
          <div><strong>1,334</strong><span>successful comparisons</span></div>
          <div><strong>14,505</strong><span>candidate atomic changes</span></div>
          <div><strong>6,211</strong><span>outcome-ready atomic changes</span></div>
        </div>
      </section>

      <section className="finding-strip shell substantive-findings">
        <div><span>82.7%</span><strong>Item 11 · Systems & Training</strong><p>Highest outcome-ready change-job rate in the DeepSeek cross-period production.</p></div>
        <div><span>82.0%</span><strong>Item 7 · Initial Investment</strong><p>Item 7 follows closely; Item 6 reaches 75.3% on the same conservative outcome-ready basis.</p></div>
        <div><span>57.3%</span><strong>Route total</strong><p>765 of 1,334 successful comparisons contain at least one outcome-ready atomic change.</p></div>
      </section>

      <div className="shell">
        <ChangeTypeSummary summary={crossPeriodChangeSummary} />
      </div>

      <div className="shell">
        <ResultsExplorer items={crossPeriodItems} mode="cross-period" />
      </div>

      <section className="guardrail-section shell">
        <div className="guardrail-mark">!</div>
        <div>
          <p className="eyebrow">FINANCING CLASSIFICATION GUARDRAIL</p>
          <h2>Guarantee language alone is never treated as franchisor financing.</h2>
          <p>Personal guarantee, guarantor, collateral and promissory-note terms do not establish that the franchisor provides financing. Classification requires explicit provider-and-offer language identifying the franchisor or affiliate as the financing source.</p>
          <Link className="text-link" href="/items?route=cross-period&item=10">查看 DeepSeek Item 10 原子变化与证据 →</Link>
        </div>
      </section>
    </main>
  );
}
