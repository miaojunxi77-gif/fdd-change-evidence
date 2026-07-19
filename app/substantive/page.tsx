import Link from "next/link";
import { ResultsExplorer } from "../components";
import { crossPeriodItems } from "../data";

export default function SubstantivePage() {
  return (
    <main>
      <section className="page-hero shell">
        <div>
          <p className="eyebrow">CROSS-PERIOD SUBSTANTIVE CHANGE</p>
          <h1>How often do economically important FDD clauses change?</h1>
          <p>针对 9 个重点 Item，每个 Item 单独保留 150 个质量合格品牌对，并覆盖一年、4–6 年和 7 年以上的时间间隔。</p>
        </div>
        <div className="page-metrics">
          <div><strong>9</strong><span>target Items</span></div>
          <div><strong>150</strong><span>pairs per Item</span></div>
          <div><strong>1,350</strong><span>final comparisons</span></div>
        </div>
      </section>

      <section className="finding-strip shell substantive-findings">
        <div><span>84.8%</span><strong>Item 6 · Other Fees</strong><p>Most frequently changing targeted clause; 50.8% are major contractual changes.</p></div>
        <div><span>74.8%</span><strong>Item 11 · Systems & Training</strong><p>Changes often concern mandatory systems, fees, training detail and data access.</p></div>
        <div><span>13.4%</span><strong>Item 10 · Financing</strong><p>Relatively rare, but verified adoption or removal can be economically sharp.</p></div>
      </section>

      <div className="shell">
        <ResultsExplorer items={crossPeriodItems} mode="cross-period" />
      </div>

      <section className="guardrail-section shell">
        <div className="guardrail-mark">!</div>
        <div>
          <p className="eyebrow">FINANCING CLASSIFICATION GUARDRAIL</p>
          <h2>Guarantee language alone is never treated as franchisor financing.</h2>
          <p>Personal guarantee, guarantor, collateral and promissory-note terms do not establish that the franchisor provides financing. Classification requires explicit provider-and-offer language identifying the franchisor or affiliate as the financing source.</p>
          <Link className="text-link" href="/cases/granite-garage-floors-2022-2026">查看通过该规则的 Granite Garage Floors 案例 →</Link>
        </div>
      </section>
    </main>
  );
}
