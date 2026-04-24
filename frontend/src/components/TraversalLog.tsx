import { useEffect, useRef } from "react";

export interface TraversalStep {
  step: number;
  nodeId: string;
  type?: "element" | "text";
  tag?: string;
  text?: string;
  attributes?: Record<string, string>;
  depth: number;
  event: "visit" | "match" | "skip";
}

interface TraversalLogProps {
  steps: TraversalStep[];
  algorithm: "bfs" | "dfs";
  selector: string;
  activeStep?: number;
}

const EVENT_STYLES = {
  visit: { dot: "bg-amber-400", text: "text-amber-700 bg-amber-50", label: "visit" },
  match: { dot: "bg-green-500", text: "text-green-700 bg-green-50", label: "match" },
  skip: { dot: "bg-gray-300", text: "text-gray-400 bg-gray-50", label: "skip" },
};

function truncateText(text = "", maxLength = 100): string {
  const normalized = text.trim().replace(/\s+/g, " ");
  const chars = Array.from(normalized);
  if (chars.length <= maxLength) return normalized;
  return `${chars.slice(0, maxLength - 1).join("")}...`;
}

function formatStepNodeLabel(step: TraversalStep, maxTextLength = 100): string {
  if (step.type === "text") {
    const preview = truncateText(step.text, maxTextLength);
    return preview ? `#text "${preview}"` : "#text";
  }

  const attrs = Object.entries(step.attributes ?? {})
    .map(([key, value]) => `${key}="${value}"`)
    .join(" ");
  const tag = step.tag ?? "node";
  return attrs ? `<${tag} ${attrs}>` : `<${tag}>`;
}

function buildLogText(steps: TraversalStep[], algorithm: string, selector: string): string {
  const header = [
    "Traversal Log",
    `Algoritma : ${algorithm.toUpperCase()}`,
    `Selector  : ${selector}`,
    `Total step: ${steps.length}`,
    `Matched   : ${steps.filter((step) => step.event === "match").length}`,
    "-".repeat(52),
    "",
  ].join("\n");

  const body = steps
    .map((step) => {
      const label = formatStepNodeLabel(step, 160);
      const indent = "  ".repeat(step.depth);
      return `[${String(step.step).padStart(4, "0")}] ${step.event.toUpperCase().padEnd(5)} depth=${step.depth} ${indent}${label}`;
    })
    .join("\n");

  return header + body;
}

export default function TraversalLog({ steps, algorithm, selector, activeStep }: TraversalLogProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const activeRowRef = useRef<HTMLDivElement>(null);

  const matchCount = steps.filter((step) => step.event === "match").length;
  const visitCount = steps.filter((step) => step.event === "visit").length;
  const skipCount = steps.filter((step) => step.event === "skip").length;

  // Auto-scroll ke baris aktif di dalam container log saja (tidak scroll halaman)
  useEffect(() => {
    if (activeStep == null || !listRef.current || !activeRowRef.current) return;
    const container = listRef.current;
    const row = activeRowRef.current;
    const rowTop = row.offsetTop;
    const rowBottom = rowTop + row.clientHeight;
    const containerTop = container.scrollTop;
    const containerBottom = containerTop + container.clientHeight;

    if (rowTop < containerTop) {
      container.scrollTop = rowTop - 8;
    } else if (rowBottom > containerBottom) {
      container.scrollTop = rowBottom - container.clientHeight + 8;
    }
  }, [activeStep]);

  function handleDownload() {
    const text = buildLogText(steps, algorithm, selector);
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `traversal-log-${algorithm}-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function handleScrollTop() {
    listRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (steps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center border border-gray-200 rounded-xl py-12 text-sm text-gray-400 gap-2">
        <span className="text-2xl">...</span>
        Belum ada data traversal.
      </div>
    );
  }

  return (
    <div className="traversal-log-panel flex flex-col border border-gray-200 rounded-xl overflow-hidden">
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
          Download .txt
        </button>
      </div>

      <div className="flex gap-2 px-4 py-2 border-b border-gray-100 bg-white">
        {[
          { label: `${steps.length} total`, color: "bg-gray-100 text-gray-600" },
          { label: `${visitCount} visited`, color: "bg-amber-50 text-amber-700" },
          { label: `${matchCount} matched`, color: "bg-green-50 text-green-700" },
          { label: `${skipCount} skipped`, color: "bg-gray-50 text-gray-400" },
        ].map((pill) => (
          <span key={pill.label} className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${pill.color}`}>
            {pill.label}
          </span>
        ))}
      </div>

      <div
        ref={listRef}
        className="traversal-log-body overflow-x-auto overflow-y-auto"
        style={{ maxHeight: 320 }}
      >
        <div className="traversal-log-table">
          {steps.map((step) => {
            const eventStyle = EVENT_STYLES[step.event];
            const nodeLabel = formatStepNodeLabel(step);
            const rowTitle = `${step.step} ${eventStyle.label} d=${step.depth} ${nodeLabel}`;
            const isActive = activeStep === step.step;

            return (
              <div
                key={step.step}
                ref={isActive ? activeRowRef : null}
                title={rowTitle}
                className={`traversal-log-row flex items-center gap-5 whitespace-nowrap px-4 py-2.5 border-b border-gray-50 transition-colors ${
                  isActive
                    ? "bg-sky-50 border-l-2 border-l-sky-500"
                    : step.event === "match"
                    ? "bg-green-50/20"
                    : "hover:bg-gray-50"
                }`}
              >
                {/* Step number */}
                <span className={`text-[10px] font-mono w-8 shrink-0 text-right ${isActive ? "text-sky-500 font-bold" : "text-gray-300"}`}>
                  {step.step}
                </span>

                {/* Event badge */}
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded shrink-0 min-w-[42px] text-center ${isActive ? "text-sky-700 bg-sky-100" : eventStyle.text}`}>
                  {isActive ? "active" : eventStyle.label}
                </span>

                {/* Depth */}
                <span className="text-[10px] font-mono text-gray-400 shrink-0 min-w-[32px]">
                  d={step.depth}
                </span>

                {/* Node label */}
                <span
                  className="traversal-log-label text-xs font-mono text-gray-600 shrink-0 whitespace-nowrap"
                  style={{ paddingLeft: `${step.depth * 8}px` }}
                >
                  {nodeLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between px-4 py-2 border-t border-gray-100 bg-gray-50">
        <span className="text-xs text-gray-400">
          {activeStep != null && activeStep > 0
            ? `Step ${activeStep} / ${steps.length}`
            : `${steps.length} langkah tercatat`}
        </span>
        <button
          onClick={handleScrollTop}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          Back to top
        </button>
      </div>
    </div>
  );
}
