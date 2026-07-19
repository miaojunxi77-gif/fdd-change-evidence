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
          <strong>494</strong>
          <span>company–year cases currently loaded</span>
          <p>包括 261 个连续年公司—年份案例和 233 个跨期案例，共 5,950 条 Item 比较；评分为 0 的无变化案例也全部保留。</p>
        </div>
      </section>
      <div className="shell">
        <FullCaseLibrary />
      </div>
    </main>
  );
}
