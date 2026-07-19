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
            <li>A randomized 200-pair core defines 200 target slots for every Item 1–23.</li>
            <li>1,703 Item slots required pre-outcome text-quality replacement; the realized data span 261 distinct companies and pairs.</li>
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
            <li>233 distinct companies and company-year pairs are represented after Item-specific replacement.</li>
            <li>Time-gap strata: annual, 4–6 years and 7+ years.</li>
            <li>Item-specific replacement occurs before LLM scoring and is fully logged.</li>
          </ul>
        </article>
      </section>

      <section className="sample-footprint shell">
        <div className="sample-footprint-heading">
          <div>
            <p className="eyebrow">SAMPLE FOOTPRINT</p>
            <h2>How many companies are represented?</h2>
          </div>
          <p>公司数按发布数据中的 company 字段精确去重；公司—年份对按公司、旧年份与新年份三者去重。</p>
        </div>
        <div className="sample-footprint-layout">
          <div className="sample-footprint-total">
            <strong>474</strong>
            <span>distinct companies / brands</span>
            <p>连续年度设计为 261 家，跨期设计为 233 家；其中 20 家同时出现在两个设计中。</p>
          </div>
          <div className="sample-footprint-metrics">
            <div><strong>261</strong><span>Design A 公司与公司—年份对</span></div>
            <div><strong>233</strong><span>Design B 公司与公司—年份对</span></div>
            <div><strong>490</strong><span>两个设计合并后的去重公司—年份对</span></div>
            <div><strong>494</strong><span>保留设计归属的 route-specific case IDs</span></div>
          </div>
        </div>
        <p className="sample-footprint-note">
          494 个 route-specific case IDs 中，有 4 个在两个设计里对应同一公司与同一对年份，因此合并去重后是 490 个公司—年份对。
          Design A 的“200”是每个 Item 的目标槽位数；质量替换会让最终出现的公司总数高于 200。
        </p>
        <aside className="reason-coding-note">
          <div><strong>122 / 5,950</strong><span>comparisons with an explicit source-stated reason</span></div>
          <p>
            其中连续年度样本 81 条、跨期样本 41 条。案例页只在 `statedReason` 有记录时展示原文明示原因；
            其余 5,828 条明确标注“原文未说明”，不根据变化方向或发生时间自行推断原因。
          </p>
        </aside>
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
