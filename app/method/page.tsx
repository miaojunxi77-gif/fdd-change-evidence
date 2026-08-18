export default function MethodPage() {
  return (
    <main>
      <section className="page-hero method-hero shell">
        <div>
          <p className="eyebrow">METHOD & QUALITY</p>
          <h1>An evidence-preserving design, not a keyword count.</h1>
          <p>连续年度与跨期页面均使用本轮 DeepSeek 生产结果。两条路线分开标注抽样设计与结果门槛，避免把不同时间跨度和发布口径混在同一估计中。</p>
        </div>
        <div className="quality-seal">
          <span>QUALITY GATE</span>
          <strong>PASS</strong>
          <small>DeepSeek consecutive + cross-period</small>
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
            <li>1,334 production comparisons succeeded; 1,327 retain complete comparison scope.</li>
            <li>14,505 candidate atomic changes were produced; 6,211 are outcome-ready and 6,934 remain review-required.</li>
            <li>231 distinct company-year pairs are represented across the nine research-priority Items.</li>
            <li>The package passed the production-structure audit; outcome-ready rows remain separately identifiable for substantive analysis.</li>
          </ul>
        </article>
      </section>

      <section className="sample-footprint shell">
        <div className="sample-footprint-heading">
          <div>
            <p className="eyebrow">SAMPLE FOOTPRINT</p>
            <h2>What is loaded in the public evidence browser?</h2>
          </div>
          <p>连续年度浏览器发布含至少一条最终纳入变化的比较；跨期浏览器加载全部 1,334 个成功的 DeepSeek v4.5 生产比较。</p>
        </div>
        <div className="sample-footprint-layout">
          <div className="sample-footprint-total">
            <strong>474</strong>
            <span>route-specific company–year cases</span>
            <p>其中 243 个连续年案例至少含一条 DeepSeek 保守变化；231 个来自 DeepSeek 跨期生产包。</p>
          </div>
          <div className="sample-footprint-metrics">
            <div><strong>243</strong><span>Design A 含纳入变化的 pair IDs</span></div>
            <div><strong>231</strong><span>Design B 公司与公司—年份对</span></div>
            <div><strong>1,661</strong><span>连续年 row-level change jobs</span></div>
            <div><strong>2,995</strong><span>两条路线合计网站明细行</span></div>
          </div>
        </div>
        <p className="sample-footprint-note">
          连续年度的 4,352 个完整比较仍是汇总比例的分母；其中没有纳入变化的比较不会伪造为 score 0 明细，
          因为这次清洗工作簿只导出了最终纳入的 7,705 条原子变化。
        </p>
        <aside className="reason-coding-note">
          <div><strong>4 TYPES</strong><span>atomic change classification</span></div>
          <p>每条原子变化均以新增、修改、删除或重新分类展示；原始 `not_comparable` 标签保留在明细中，并在四类统计里并入“修改”。</p>
        </aside>
        <aside className="quality-review-method-note">
          <div className="quality-review-method-total"><strong>SEPARATE</strong><span>publication and review gates</span></div>
          <p>连续年度只加载最终 `INCLUDE_CONSERVATIVE` 行；跨期则同时保留候选、outcome-ready 和 review-required 标志，避免把待复核原子变化误作最终分析结果。</p>
        </aside>
      </section>

      <section className="quality-panel shell">
        <div className="quality-stats">
          <div><strong>1,334</strong><span>successful production jobs</span></div>
          <div><strong>1,327</strong><span>complete comparisons</span></div>
          <div><strong>6,211</strong><span>outcome-ready atomics</span></div>
          <div><strong>16</strong><span>pre-production unresolved inputs</span></div>
        </div>
        <div className="quality-copy">
          <p className="eyebrow">DEEPSEEK CROSS-PERIOD V4.5</p>
          <h2>The production package is structurally complete and keeps review status explicit.</h2>
          <p>All 1,334 expected production jobs in the finalized input set succeeded. Seven comparisons retain incomplete scope, while 16 earlier inputs remain documented outside the production set as unresolved.</p>
          <p>The final audit approves the package as production output. Candidate generation is complete; substantive analysis should use the 6,211 outcome-ready atomic changes and continue to treat 6,934 review-required changes separately.</p>
          <p>Evidence matches produced during post-processing are labeled separately from source-PDF page references, and inference-limit notes remain attached to individual atomic changes.</p>
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
