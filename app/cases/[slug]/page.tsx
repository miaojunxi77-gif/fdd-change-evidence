import Link from "next/link";
import { notFound } from "next/navigation";
import { CaseDetailView } from "../../components";
import { cases } from "../../data";

export function generateStaticParams() {
  return cases.map((entry) => ({ slug: entry.slug }));
}

export default async function CasePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const caseStudy = cases.find((entry) => entry.slug === slug);
  if (!caseStudy) notFound();

  return (
    <main>
      <section className="case-detail-hero shell">
        <div className="breadcrumbs">
          <Link href="/cases">公司案例</Link><span>›</span><span>{caseStudy.company}</span>
        </div>
        <div className="detail-hero-grid">
          <div>
            <p className="eyebrow">{caseStudy.route === "consecutive" ? "CONSECUTIVE-YEAR CASE" : "CROSS-PERIOD CASE"}</p>
            <h1>{caseStudy.company}</h1>
            <p className="detail-years">{caseStudy.oldYear} <span>→</span> {caseStudy.newYear}</p>
            <p>{caseStudy.featured}</p>
          </div>
          <dl className="case-meta-grid">
            <div><dt>Repository</dt><dd>{caseStudy.source}</dd></div>
            <div><dt>Compared Items</dt><dd>{caseStudy.items.map((entry) => entry.item).join(", ")}</dd></div>
            <div><dt>Analysis ID</dt><dd>{caseStudy.analysisId}</dd></div>
            <div><dt>Evidence</dt><dd>Quotes + page locators</dd></div>
          </dl>
        </div>
      </section>

      <div className="shell">
        <CaseDetailView caseStudy={caseStudy} />
      </div>
    </main>
  );
}
