export default function MethodPage() {
  return (
    <main>
      <section className="page-hero method-hero shell">
        <div>
          <p className="eyebrow">METHOD & QUALITY</p>
          <h1>An evidence-preserving design, not a keyword count.</h1>
          <p>抽样、文本提取、LLM 评分、引文验证和人工复核彼此分开记录，使每个结果都可以回到具体公司、年份、Item 与 PDF 页码。</p>
        </div>
        <div className="quality-seal">
          <span>QUALITY GATE</span>
          <strong>PASS</strong>
          <small>Cross-period final sample</small>
        </div>
      </section>

      <section className="method-flow shell">
        {[
          ["01", "Sample", "建立品牌—年份对；保留来源、年份间隔与 SBA 分层信息。"],
          ["02", "Extract", "逐份 PDF/TXT 切分 Items 1–23；质量不合格文本在调用模型前被阻断。"],
          ["03", "Compare", "模型读取旧版与新版同一 Item，给出 0–5 分、方向、变化类型与原文引文。"],
          ["04", "Verify", "引文返回原始文本做精确或锚点验证；失败项进入复核队列。"],
          ["05", "Adjudicate", "人工纠正训练时长、融资、争议解决等容易过度推断的案例。"],
        ].map(([num, title, copy]) => (
          <article key={num}><span>{num}</span><h2>{title}</h2><p>{copy}</p></article>
        ))}
      </section>

      <section className="method-grid shell">
        <article className="method-card">
          <p className="eyebrow">DESIGN A</p>
          <h2>Consecutive-Year Variation</h2>
          <ul>
            <li>200 randomly selected consecutive-year brand pairs.</li>
            <li>The same 200 pairs are evaluated for every Item 1–23.</li>
            <li>4,600 comparisons; 100% scored.</li>
            <li>No preselected outcome variable: rank Items first, then read high-change cases.</li>
          </ul>
        </article>
        <article className="method-card">
          <p className="eyebrow">DESIGN B</p>
          <h2>Cross-Period Substantive Change</h2>
          <ul>
            <li>Items 3, 5, 6, 7, 10, 11, 17, 19 and 21.</li>
            <li>150 quality-ready comparisons per Item; 1,350 total.</li>
            <li>Time-gap strata: annual, 4–6 years and 7+ years.</li>
            <li>Item-specific replacement occurs before LLM scoring and is fully logged.</li>
          </ul>
        </article>
      </section>

      <section className="quality-panel shell">
        <div className="quality-stats">
          <div><strong>1,282</strong><span>API comparisons</span></div>
          <div><strong>68</strong><span>local exact matches</span></div>
          <div><strong>1.3%</strong><span>evidence-warning rate</span></div>
          <div><strong>0</strong><span>final failures</span></div>
        </div>
        <div className="quality-copy">
          <p className="eyebrow">QUALITY-SCREENED REPLACEMENT</p>
          <h2>Unusable Item text is replaced without looking at model outcomes.</h2>
          <p>647 of 1,350 Item slots required replacement. 642 stayed within the same time-gap × SBA stratum; five retained the same time-gap but changed SBA group because the strict reserve was exhausted. No replacement changed the time-gap category, and selection never used LLM scores.</p>
          <p>Results are weighted to the realized sampling cells. A clean-only sensitivity analysis produces estimates close to the full-sample results.</p>
        </div>
      </section>

      <section className="coding-rules shell">
        <div>
          <p className="eyebrow">CORE DEFINITIONS</p>
          <h2>What counts as change?</h2>
        </div>
        <dl>
          <div><dt>Score 0</dt><dd>No substantive change; formatting, pagination or extraction noise only.</dd></div>
          <div><dt>Score 1–2</dt><dd>Minor wording, administrative update or routine annual refresh.</dd></div>
          <div><dt>Score 3</dt><dd>Substantive operational or disclosure change.</dd></div>
          <div><dt>Score 4–5</dt><dd>Major change; coded contractual only when rights, obligations, discretion or economic terms change.</dd></div>
        </dl>
      </section>

      <section className="manual-corrections shell">
        <p className="eyebrow">HUMAN ADJUDICATION EXAMPLES</p>
        <h2>Manual reading narrows over-broad model claims.</h2>
        <div>
          <article><strong>Bumble Bee Blinds · Item 6</strong><p>Liquidated damages existed in 2024; it was removed from the “newly introduced” change code.</p></article>
          <article><strong>Bumble Bee Blinds · Item 11</strong><p>Training existed in 2024; 2025 newly specifies duration and format. The evidence does not establish that training became longer.</p></article>
          <article><strong>Bumble Bee Blinds · Item 17</strong><p>Mediation, arbitration and Bucks County were already present. The confirmed new obligation is in-person travel to Omaha.</p></article>
        </div>
      </section>
    </main>
  );
}
