export default function MethodPage() {
  return (
    <main>
      <section className="page-hero method-hero shell">
        <div>
          <p className="eyebrow">METHOD & QUALITY</p>
          <h1>An evidence-preserving design, not a keyword count.</h1>
          <p>连续年度页面使用本次 DeepSeek 清洗结果；跨期页面暂留既有生产版本。两条路线分开标注，避免把不同模型与清洗口径混在同一估计中。</p>
        </div>
        <div className="quality-seal">
          <span>QUALITY GATE</span>
          <strong>PASS</strong>
          <small>DeepSeek consecutive clean set</small>
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
            <li>4,557 prepared DeepSeek jobs across Items 1–23; 4,556 exported successfully.</li>
            <li>4,352 comparisons retain complete Item scope on both years; 204 incomplete comparisons are excluded from denominators.</li>
            <li>7,705 conservative atomic changes remain after machine gates, source holds and manual rejections.</li>
            <li>Those changes occur in 1,661 complete brand–Item–year comparisons; 1,080 comparisons contain a score 4–5 change.</li>
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
            <h2>What is loaded in the public evidence browser?</h2>
          </div>
          <p>连续年度浏览器只发布含至少一条最终纳入变化的比较；跨期浏览器暂时保留全部 1,350 条既有比较。</p>
        </div>
        <div className="sample-footprint-layout">
          <div className="sample-footprint-total">
            <strong>476</strong>
            <span>route-specific company–year cases</span>
            <p>其中 243 个连续年案例至少含一条 DeepSeek 保守变化；233 个是当前保留的跨期案例。</p>
          </div>
          <div className="sample-footprint-metrics">
            <div><strong>243</strong><span>Design A 含纳入变化的 pair IDs</span></div>
            <div><strong>233</strong><span>Design B 公司与公司—年份对</span></div>
            <div><strong>1,661</strong><span>连续年 row-level change jobs</span></div>
            <div><strong>3,011</strong><span>两条路线合计网站明细行</span></div>
          </div>
        </div>
        <p className="sample-footprint-note">
          连续年度的 4,352 个完整比较仍是汇总比例的分母；其中没有纳入变化的比较不会伪造为 score 0 明细，
          因为这次清洗工作簿只导出了最终纳入的 7,705 条原子变化。
        </p>
        <aside className="reason-coding-note">
          <div><strong>41 / 3,011</strong><span>website rows with an explicit source-stated reason</span></div>
          <p>
            这 41 条来自当前保留的跨期版本。DeepSeek 连续年度清洗工作簿没有导出单独的 `statedReason` 字段，
            因此网站不会根据变化方向或发生时间自行推断原因。
          </p>
        </aside>
        <aside className="quality-review-method-note">
          <div className="quality-review-method-total">
            <strong>30 / 3,011</strong>
            <span>quality-review flags in the combined website rows</span>
          </div>
          <div className="quality-review-method-breakdown">
            <div><strong>0</strong><span>DeepSeek 连续年最终纳入行</span></div>
            <div><strong>30</strong><span>当前跨期明细中的复核标记</span></div>
            <div><strong>3,504</strong><span>连续年机器复核原子行已在发布前暂缓</span></div>
          </div>
          <p>
            连续年度网站只加载最终 `INCLUDE_CONSERVATIVE` 行；机器复核、来源待核验和人工拒绝行不会混入 7,705 条发布变化。
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
          <p className="eyebrow">EXISTING CROSS-PERIOD VERSION</p>
          <h2>Unusable Item text is replaced without looking at model outcomes.</h2>
          <p>These quality statistics belong to the currently retained cross-period version, not to the new DeepSeek consecutive-year results. The cross-period section will be replaced only after the new production run is complete.</p>
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
        <p className="eyebrow">DEEPSEEK CONSERVATIVE GATES</p>
        <h2>The published consecutive-year results are narrower than the raw model output.</h2>
        <div>
          <article><strong>Scope gate</strong><p>Only comparisons with complete old- and new-year Item scope enter the rate denominator; excerpt-only jobs are excluded.</p></article>
          <article><strong>Outcome gate</strong><p>Routine reporting rolls, unsupported legal interpretation and rows carrying unresolved review warnings do not enter the 7,705-change clean set.</p></article>
          <article><strong>Inference limit</strong><p>Changes in disclosed fees, financing or performance figures do not establish actual payment, uptake, enforcement or causal effects.</p></article>
        </div>
      </section>
    </main>
  );
}
