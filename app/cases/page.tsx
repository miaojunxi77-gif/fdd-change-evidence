import { FullCaseLibrary } from "../full-data-components";

export default function CasesPage() {
  return (
    <main>
      <section className="page-hero case-page-hero shell">
        <div>
          <p className="eyebrow">COMPANY EVIDENCE LIBRARY</p>
          <h1>From aggregate estimates to the underlying FDD language.</h1>
          <p>按公司、年份、分析类型、Item 和评分筛选。进入案例后可以看到旧版与新版英文原文、PDF 页码、研究解释以及人工修正。</p>
        </div>
        <div className="case-scope-card">
          <strong>474</strong>
          <span>company–year cases currently loaded</span>
          <p>包括 243 个至少含一条 DeepSeek 保守变化的连续年案例，以及 231 个 DeepSeek v4.5 跨期案例。连续年无变化比较保留在汇总分母中；跨期明细保留 outcome-ready 与 review-required 状态。</p>
        </div>
      </section>
      <div className="shell">
        <FullCaseLibrary />
      </div>
    </main>
  );
}
