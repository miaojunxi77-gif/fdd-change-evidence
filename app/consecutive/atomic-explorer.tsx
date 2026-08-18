"use client";

import { useEffect, useMemo, useState } from "react";

type ChangeType = "introduced" | "modified" | "removed" | "reclassified" | "not_comparable";

type SummaryItem = {
  item: number;
  title: string;
  total: number;
  introduced: number;
  modified: number;
  removed: number;
  reclassified: number;
  notComparable: number;
};

type SummaryData = {
  route: string;
  model: string;
  source: string;
  totalAtomicChanges: number;
  counts: {
    introduced: number;
    modified: number;
    removed: number;
    reclassified: number;
    notComparable: number;
  };
  items: SummaryItem[];
  note: string;
};

type AtomicRow = {
  j: string;
  c: string;
  o: number;
  n: number;
  i: number;
  v: string;
  t: ChangeType;
  a: string;
  b: string;
  s: number;
};

type AtomicShard = { items: number[]; rows: AtomicRow[] };

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const SHARDS = [
  { file: "group-01.json", items: [1, 2, 3, 4, 5] },
  { file: "group-02.json", items: [6] },
  { file: "group-03.json", items: [7] },
  { file: "group-04.json", items: [8, 9, 10] },
  { file: "group-05.json", items: [11] },
  { file: "group-06.json", items: [12, 13, 14, 15] },
  { file: "group-07.json", items: [16, 17, 18] },
  { file: "group-08.json", items: [19, 20, 21, 22, 23] },
];

const TYPE_META: Record<ChangeType, { label: string; zh: string; tone: string }> = {
  introduced: { label: "ADDED", zh: "新增", tone: "#16794b" },
  modified: { label: "MODIFIED", zh: "修改", tone: "#315c9b" },
  removed: { label: "REMOVED", zh: "删除", tone: "#a34444" },
  reclassified: { label: "RECLASSIFIED", zh: "重新分类", tone: "#8a681e" },
  not_comparable: { label: "NOT COMPARABLE", zh: "不可直接比较", tone: "#666666" },
};

function pct(value: number, total: number) {
  return total ? `${((value / total) * 100).toFixed(1)}%` : "0.0%";
}

function TypeBadge({ type }: { type: ChangeType }) {
  const meta = TYPE_META[type];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.35rem",
        border: `1px solid ${meta.tone}`,
        color: meta.tone,
        borderRadius: "999px",
        padding: "0.25rem 0.55rem",
        fontSize: "0.72rem",
        fontWeight: 800,
        letterSpacing: "0.04em",
        whiteSpace: "nowrap",
      }}
    >
      {meta.label} · {meta.zh}
    </span>
  );
}

export default function ConsecutiveAtomicExplorer() {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [rows, setRows] = useState<AtomicRow[]>([]);
  const [selectedItem, setSelectedItem] = useState("11");
  const [selectedType, setSelectedType] = useState("all");
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState(80);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${BASE_PATH}/data/consecutive-atomic/summary.json`)
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json() as Promise<SummaryData>;
      })
      .then(setSummary)
      .catch(() => setError("Atomic change-type summary could not be loaded."));
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setShown(80);

    const itemNumber = selectedItem === "all" ? null : Number(selectedItem);
    const files = itemNumber == null
      ? SHARDS.map((entry) => entry.file)
      : SHARDS.filter((entry) => entry.items.includes(itemNumber)).map((entry) => entry.file);

    Promise.all(
      files.map((file) =>
        fetch(`${BASE_PATH}/data/consecutive-atomic/${file}`).then((response) => {
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          return response.json() as Promise<AtomicShard>;
        }),
      ),
    )
      .then((parts) => {
        if (!active) return;
        setRows(parts.flatMap((part) => part.rows));
        setError("");
      })
      .catch(() => {
        if (active) setError("Atomic change rows could not be loaded.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedItem]);

  const filtered = useMemo(() => {
    const itemNumber = selectedItem === "all" ? null : Number(selectedItem);
    const term = query.trim().toLowerCase();
    return rows
      .filter((row) => itemNumber == null || row.i === itemNumber)
      .filter((row) => selectedType === "all" || row.t === selectedType)
      .filter(
        (row) =>
          !term ||
          row.c.toLowerCase().includes(term) ||
          row.v.toLowerCase().includes(term) ||
          row.a.toLowerCase().includes(term) ||
          row.b.toLowerCase().includes(term) ||
          row.j.toLowerCase().includes(term),
      )
      .sort((a, b) => b.s - a.s || a.c.localeCompare(b.c) || a.i - b.i);
  }, [rows, selectedItem, selectedType, query]);

  if (!summary && error) return <p className="empty-state">{error}</p>;
  if (!summary) return <p className="empty-state">Loading atomic change-type summary…</p>;

  const cards: Array<[ChangeType, number]> = [
    ["introduced", summary.counts.introduced],
    ["modified", summary.counts.modified],
    ["removed", summary.counts.removed],
    ["reclassified", summary.counts.reclassified],
  ];

  return (
    <section style={{ margin: "3rem 0" }}>
      <div style={{ marginBottom: "1.25rem" }}>
        <p className="eyebrow">ATOMIC CHANGE TYPE · 条款变化类型</p>
        <h2>What was added, modified, removed, or reclassified?</h2>
        <p>
          以下统计以最终纳入的 {summary.totalAtomicChanges.toLocaleString()} 条 conservative atomic changes 为单位。
          每一条变化都保留原始 DeepSeek change type，不把“新增”和“修改”混在一起。
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "0.85rem",
          marginBottom: "1.5rem",
        }}
      >
        {cards.map(([type, count]) => {
          const meta = TYPE_META[type];
          return (
            <div className="rail-card" key={type} style={{ padding: "1rem" }}>
              <TypeBadge type={type} />
              <strong style={{ display: "block", fontSize: "1.75rem", marginTop: "0.6rem" }}>
                {count.toLocaleString()}
              </strong>
              <span>{pct(count, summary.totalAtomicChanges)} of included atomic changes</span>
              <p style={{ marginTop: "0.5rem", marginBottom: 0, color: meta.tone }}>
                {type === "introduced" && "旧版未出现、在新版新增的安排。"}
                {type === "modified" && "同一安排仍存在，但数值、范围、条件或结构发生变化。"}
                {type === "removed" && "旧版存在、在新版不再出现的安排。"}
                {type === "reclassified" && "经济安排延续，但名称、类别或结构被重新组织。"}
              </p>
            </div>
          );
        })}
      </div>

      <p style={{ marginBottom: "2rem" }}>
        注：另有 <strong>{summary.counts.notComparable}</strong> 条 Item 6 变化保留为 <strong>Not comparable</strong>：计价单位从 per job 改为 per credit，不能诚实地强行归入四类之一。
      </p>

      <div style={{ overflowX: "auto", marginBottom: "2.5rem" }}>
        <div style={{ minWidth: "980px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "70px minmax(270px, 1.6fr) repeat(5, minmax(90px, 0.6fr))",
              gap: "0.5rem",
              padding: "0.65rem 0.8rem",
              fontSize: "0.75rem",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            <span>Item</span><span>Clause</span><span>Total</span><span>Added</span><span>Modified</span><span>Removed</span><span>Reclassified</span>
          </div>
          {summary.items.map((item) => (
            <button
              key={item.item}
              type="button"
              onClick={() => setSelectedItem(String(item.item))}
              style={{
                display: "grid",
                gridTemplateColumns: "70px minmax(270px, 1.6fr) repeat(5, minmax(90px, 0.6fr))",
                gap: "0.5rem",
                width: "100%",
                padding: "0.7rem 0.8rem",
                border: 0,
                borderTop: "1px solid rgba(120,120,120,0.22)",
                background: selectedItem === String(item.item) ? "rgba(120,120,120,0.10)" : "transparent",
                color: "inherit",
                textAlign: "left",
                cursor: "pointer",
                font: "inherit",
              }}
            >
              <strong>{String(item.item).padStart(2, "0")}</strong>
              <span>{item.title}</span>
              <strong>{item.total.toLocaleString()}</strong>
              <span>{item.introduced.toLocaleString()} <small>({pct(item.introduced, item.total)})</small></span>
              <span>{item.modified.toLocaleString()} <small>({pct(item.modified, item.total)})</small></span>
              <span>{item.removed.toLocaleString()} <small>({pct(item.removed, item.total)})</small></span>
              <span>{item.reclassified.toLocaleString()} <small>({pct(item.reclassified, item.total)})</small></span>
            </button>
          ))}
        </div>
      </div>

      <div className="results-controls" style={{ marginBottom: "1rem" }}>
        <label className="select-control">
          <span>Item</span>
          <select value={selectedItem} onChange={(event) => setSelectedItem(event.target.value)}>
            <option value="all">全部 Items · All</option>
            {summary.items.map((item) => (
              <option key={item.item} value={item.item}>Item {item.item} · {item.title}</option>
            ))}
          </select>
        </label>
        <label className="select-control">
          <span>Change type · 变化类型</span>
          <select value={selectedType} onChange={(event) => { setSelectedType(event.target.value); setShown(80); }}>
            <option value="all">全部类型</option>
            <option value="introduced">Added · 新增</option>
            <option value="modified">Modified · 修改</option>
            <option value="removed">Removed · 删除</option>
            <option value="reclassified">Reclassified · 重新分类</option>
            <option value="not_comparable">Not comparable · 不可直接比较</option>
          </select>
        </label>
        <label className="search-box results-search">
          <span aria-hidden="true">⌕</span>
          <input
            value={query}
            onChange={(event) => { setQuery(event.target.value); setShown(80); }}
            placeholder="搜索公司、变量或 old/new term"
            aria-label="Search atomic changes"
          />
        </label>
      </div>

      <div className="library-count" style={{ marginBottom: "1rem" }}>
        <strong>{loading ? "…" : filtered.length.toLocaleString()}</strong> 条 atomic changes 符合当前筛选
      </div>

      {error ? <p className="empty-state">{error}</p> : null}
      {!error && !loading && filtered.length === 0 ? <p className="empty-state">没有符合当前筛选条件的 atomic change。</p> : null}

      <div style={{ display: "grid", gap: "0.9rem" }}>
        {filtered.slice(0, shown).map((row, index) => (
          <article className="rail-card" key={`${row.j}-${row.v}-${index}`} style={{ padding: "1rem 1.1rem" }}>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.55rem", marginBottom: "0.7rem" }}>
              <TypeBadge type={row.t} />
              <strong>{row.c}</strong>
              <span>Item {row.i}</span>
              <span>{row.o} → {row.n}</span>
              <span>Score {row.s}/5</span>
            </div>
            <h3 style={{ marginTop: 0 }}>{row.v}</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "0.8rem" }}>
              <div style={{ padding: "0.75rem", border: "1px solid rgba(120,120,120,0.22)", borderRadius: "8px" }}>
                <small>OLD · {row.o}</small>
                <p style={{ marginBottom: 0 }}>{row.a || "Not present / not disclosed in the structured comparison."}</p>
              </div>
              <div style={{ padding: "0.75rem", border: "1px solid rgba(120,120,120,0.22)", borderRadius: "8px" }}>
                <small>NEW · {row.n}</small>
                <p style={{ marginBottom: 0 }}>{row.b || "Not present / not disclosed in the structured comparison."}</p>
              </div>
            </div>
            <small style={{ display: "block", marginTop: "0.7rem", opacity: 0.7 }}>{row.j}</small>
          </article>
        ))}
      </div>

      {shown < filtered.length ? (
        <button className="text-link" type="button" onClick={() => setShown((value) => value + 100)} style={{ marginTop: "1rem" }}>
          再显示 100 条 →
        </button>
      ) : null}
    </section>
  );
}
