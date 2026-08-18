import Link from "next/link";
import { ChangeTypeSummary, ResultsExplorer } from "../components";
import { consecutiveChangeSummary, consecutiveItems } from "../data";

export default function ConsecutivePage() {
  return (
    <main>
      <section className="page-hero shell">
        <div>
          <p className="eyebrow">CONSECUTIVE-YEAR VARIATION</p>
          <h1>Which FDD Items actually change from one year to the next?</h1>
          <p>本页已替换为 DeepSeek v4.3 清洗结果。分母仅保留旧年与新年 Item 范围都完整的比较；例行更新、证据不足和待复核条款不计入保守变化。</p>
        </div>
        <div className="page-metrics">
          <div><strong>4,557</strong><span>prepared jobs</span></div>
          <div><strong>4,352</strong><span>complete comparisons</span></div>
          <div><strong>7,705</strong><span>included atomic changes</span></div>
        </div>
      </section>

      <section className="finding-strip shell">
        <div><span>01</span><strong>Item 11</strong><p>Assistance, advertising, systems and training has the highest conservative change-job rate: 81.0%.</p></div>
        <div><span>02</span><strong>Items 7 & 6</strong><p>Estimated investment and other fees follow at 79.4% and 78.9%.</p></div>
        <div><span>03</span><strong>Route total</strong><p>1,661 of 4,352 complete comparisons (38.2%) contain at least one included conservative change.</p></div>
      </section>

      <div className="shell">
        <ChangeTypeSummary summary={consecutiveChangeSummary} />
      </div>

      <div className="shell">
        <ResultsExplorer items={consecutiveItems} mode="consecutive" />
      </div>

      <section className="reading-guide shell">
        <div>
          <p className="eyebrow">HOW TO READ</p>
          <h2>These are conservative clause-change frequencies, not causal effects.</h2>
        </div>
        <div>
          <p><strong>保守变化率</strong>是至少包含一条最终纳入变化的完整比较数，除以该 Item 的完整比较数。</p>
          <p><strong>高影响变化</strong>表示该比较至少包含一条 score 4–5 的纳入变化；它不等同于因果影响或实际支付。</p>
          <p><strong>明细浏览器</strong>只列出 1,661 个含纳入变化的比较；无变化与被排除比较仍保留在汇总分母中，但清洗工作簿没有为它们导出网站明细。</p>
          <Link className="text-link" href="/method">完整评分标准与质量控制 →</Link>
        </div>
      </section>
    </main>
  );
}
