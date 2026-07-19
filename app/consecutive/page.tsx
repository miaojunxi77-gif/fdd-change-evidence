import Link from "next/link";
import { ResultsExplorer } from "../components";
import { consecutiveItems } from "../data";

export default function ConsecutivePage() {
  return (
    <main>
      <section className="page-hero shell">
        <div>
          <p className="eyebrow">CONSECUTIVE-YEAR VARIATION</p>
          <h1>Which FDD Items actually change from one year to the next?</h1>
          <p>固定同一组 200 个品牌连续年度对，对 Items 1–23 逐项比较，不预先设定感兴趣变量。</p>
        </div>
        <div className="page-metrics">
          <div><strong>200</strong><span>brand-year pairs</span></div>
          <div><strong>23</strong><span>Items per pair</span></div>
          <div><strong>4,600</strong><span>scored comparisons</span></div>
        </div>
      </section>

      <section className="finding-strip shell">
        <div><span>01</span><strong>Item 6</strong><p>Other Fees has the highest weighted substantive-change rate: 66.5%.</p></div>
        <div><span>02</span><strong>Items 7 & 11</strong><p>Investment, systems, training and data access also change frequently.</p></div>
        <div><span>03</span><strong>Items 21 & 20</strong><p>Most observed changes are routine annual roll-forwards rather than contract redesign.</p></div>
      </section>

      <div className="shell">
        <ResultsExplorer items={consecutiveItems} mode="consecutive" />
      </div>

      <section className="reading-guide shell">
        <div>
          <p className="eyebrow">HOW TO READ</p>
          <h2>Variation is not automatically contractual change.</h2>
        </div>
        <div>
          <p><strong>Substantive change</strong> means the model assigned score 3–5 after excluding formatting and OCR noise.</p>
          <p><strong>Major contractual change</strong> additionally requires score 4–5 and a change in rights, obligations, discretion or economic terms.</p>
          <p><strong>Routine annual update</strong> captures roll-forwards such as outlet counts, financial statements and refreshed Item 19 data.</p>
          <Link className="text-link" href="/method">完整评分标准与质量控制 →</Link>
        </div>
      </section>
    </main>
  );
}
