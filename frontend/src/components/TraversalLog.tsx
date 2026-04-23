import { useRef } from "react";

export interface TraversalStep {
  step: number;
  nodeId: string;
  tag: string;
  attributes: Record<string, string>;
  depth: number;
  event: "visit" | "match" | "skip";
}

interface TraversalLogProps {
  steps: TraversalStep[];
  algorithm: "bfs" | "dfs";
  selector: string;
}

const EVENT_STYLES = {
  visit: { dot: "bg-amber-400", text: "text-amber-700 bg-amber-50", label: "visit" },
  match: { dot: "bg-green-500", text: "text-green-700 bg-green-50", label: "match" },
  skip: { dot: "bg-gray-300", text: "text-gray-400 bg-gray-50", label: "skip" },
};

function buildLogText(steps: TraversalStep[], algorithm: string, selector: string): string {
  const header = [
    `Traversal Log`,
    `Algoritma : ${algorithm.toUpperCase()}`,
    `Selector  : ${selector}`,
    `Total step: ${steps.length}`,
    `Matched   : ${steps.filter((s) => s.event === "match").length}`,
    "─".repeat(52),
    "",
  ].join("\n");

  const body = steps
    .map((s) => {
      const attrs = Object.entries(s.attributes)
        .map(([k, v]) => `${k}="${v}"`)
        .join(" ");
      const tag = attrs ? `<${s.tag} ${attrs}>` : `<${s.tag}>`;
      const indent = "  ".repeat(s.depth);
      return `[${String(s.step).padStart(4, "0")}] ${s.event.toUpperCase().padEnd(5)} depth=${s.depth} ${indent}${tag}`;
    })
    .join("\n");

  return header + body;
}

export default function TraversalLog({ steps, algorithm, selector }: TraversalLogProps) {
  const listRef = useRef<HTMLDivElement>(null);

  const matchCount = steps.filter((s) => s.event === "match").length;
  const visitCount = steps.filter((s) => s.event === "visit").length;
  const skipCount = steps.filter((s) => s.event === "skip").length;

  function handleDownload() {
    const text = buildLogText(steps, algorithm, selector);
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `traversal-log-${algorithm}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleScrollTop() {
    listRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (steps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center border border-gray-200 rounded-xl py-12 text-sm text-gray-400 gap-2">
        <span className="text-2xl">⌛</span>
        Belum ada data traversal.
      </div>
    );
  }

  return (
    <div className="flex flex-col border border-gray-200 rounded-xl overflow-hidden">

      {/* header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-gray-700">Traversal Log</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-500 font-mono">
            {algorithm.toUpperCase()}
          </span>
          <span className="text-xs text-gray-400 font-mono truncate max-w-[160px]">{selector}</span>
        </div>
        <button
          onClick={handleDownload}
          className="text-xs px-3 py-1 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 transition-colors"
        >
          ↓ Unduh .txt
        </button>
      </div>

      {/* summary pills */}
      <div className="flex gap-2 px-4 py-2 border-b border-gray-100 bg-white">
        {[
          { label: `${steps.length} total`, color: "bg-gray-100 text-gray-600" },
          { label: `${visitCount} visited`, color: "bg-amber-50 text-amber-700" },
          { label: `${matchCount} matched`, color: "bg-green-50 text-green-700" },
          { label: `${skipCount} skipped`, color: "bg-gray-50 text-gray-400" },
        ].map((p) => (
          <span key={p.label} className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${p.color}`}>
            {p.label}
          </span>
        ))}
      </div>

      {/* log list */}
      <div ref={listRef} className="overflow-y-auto" style={{ maxHeight: 320 }}>
        {steps.map((s) => {
          const ev = EVENT_STYLES[s.event];
          const attrs = Object.entries(s.attributes)
            .map(([k, v]) => `${k}="${v}"`)
            .join(" ");
          const tagLabel = attrs ? `<${s.tag} ${attrs}>` : `<${s.tag}>`;

          return (
            <div
              key={s.step}
              className={`flex items-start gap-3 px-4 py-2 border-b border-gray-50 hover:bg-gray-50 transition-colors ${s.event === "match" ? "bg-green-50/20" : ""
                }`}
            >
              {/* step number */}
              <span className="text-[10px] font-mono text-gray-300 w-8 shrink-0 pt-0.5 text-right">
                {s.step}
              </span>

              {/* dot */}
              <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${ev.dot}`} />

              {/* event badge */}
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0 ${ev.text}`}>
                {ev.label}
              </span>

              {/* depth indicator */}
              <span className="text-[10px] font-mono text-gray-300 shrink-0 pt-0.5">
                d={s.depth}
              </span>

              {/* indented tag */}
              <span
                className="text-xs font-mono text-gray-600 truncate"
                style={{ paddingLeft: `${s.depth * 8}px` }}
              >
                {tagLabel}
              </span>
            </div>
          );
        })}
      </div>

      {/* footer */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-gray-100 bg-gray-50">
        <span className="text-xs text-gray-400">{steps.length} langkah tercatat</span>
        <button
          onClick={handleScrollTop}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          ↑ ke atas
        </button>
      </div>
    </div>
  );
}