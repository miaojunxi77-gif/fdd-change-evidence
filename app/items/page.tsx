import { Suspense } from "react";
import { ItemDrilldown } from "../full-data-components";

export default function ItemCasesPage() {
  return (
    <main>
      <div className="shell">
        <Suspense fallback={<p className="empty-state">Loading Item evidence…</p>}>
          <ItemDrilldown />
        </Suspense>
      </div>
    </main>
  );
}
