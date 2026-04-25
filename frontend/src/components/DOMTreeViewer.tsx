import { useEffect, useMemo, useRef } from "react";
import type { DOMNode, DOMNodeType, NodeState } from "./DOMTreeType";

function compactText(text = "", maxLength = 48): string {
  const normalized = text.trim().replace(/\s+/g, " ");
  const chars = Array.from(normalized);
  if (chars.length <= maxLength) return normalized;
  return `${chars.slice(0, maxLength - 1).join("")}...`;
}

interface TreeRow {
  id: string;
  type: DOMNodeType;
  tag?: string;
  textPreview?: string;
  attrs: Record<string, string>;
  state: NodeState;
  depth: number;
  markers: string[];
  isSelectableForLCA: boolean;
}

function getDisplayState(node: DOMNode, parentState: NodeState, animHighlightId?: string): NodeState {
  const type = node.type ?? "element";
  const ownState = node.state ?? "idle";

  if (node.id === animHighlightId) return "active";
  if (type === "text" && (parentState === "matched" || parentState === "affected")) return "affected";
  return ownState;
}

function flattenRows(
  node: DOMNode,
  rows: TreeRow[],
  depth: number,
  parentState: NodeState,
  selectedAId: string,
  selectedBId: string,
  lcaId: string,
  animHighlightId?: string,
) {
  const type = node.type ?? "element";
  const attrs = node.attributes ?? {};
  const state = getDisplayState(node, parentState, animHighlightId);
  const markers: string[] = [];

  if (node.id === selectedAId) markers.push("A");
  if (node.id === selectedBId) markers.push("B");
  if (node.id === lcaId) markers.push("LCA");

  rows.push({
    id: node.id,
    type,
    tag: node.tag,
    textPreview: type === "text" ? compactText(node.text) : undefined,
    attrs,
    state,
    depth,
    markers,
    isSelectableForLCA: type === "element" && node.tag !== "fragment",
  });

  node.children?.forEach((child) => {
    flattenRows(child, rows, depth + 1, state, selectedAId, selectedBId, lcaId, animHighlightId);
  });
}

function countAll(node: DOMNode): number {
  return 1 + (node.children ?? []).reduce((acc, c) => acc + countAll(c), 0);
}

interface StatsBarProps {
  totalNodes: number;
  visitedCount: number;
  matchedCount: number;
  maxDepth: number;
  elapsedMs?: number;
}

function StatsBar({ totalNodes, visitedCount, matchedCount, maxDepth, elapsedMs }: StatsBarProps) {
  const stats = [
    { label: "Total node", value: totalNodes },
    { label: "Dikunjungi", value: visitedCount, color: "text-amber-600" },
    { label: "Cocok", value: matchedCount, color: "text-blue-600" },
    { label: "Kedalaman maks", value: maxDepth },
    ...(elapsedMs != null ? [{ label: "Waktu", value: `${elapsedMs.toFixed(2)} ms` }] : []),
  ];

  return (
    <div className="dom-tree-stats">
      {stats.map((s) => (
        <span key={s.label} className="dom-tree-stat">
          <span className="dom-tree-stat-label">{s.label}:</span>
          <span className={`dom-tree-stat-value ${s.color ?? ""}`}>{s.value}</span>
        </span>
      ))}
    </div>
  );
}

function Legend() {
  const items: { state: NodeState; label: string }[] = [
    { state: "idle", label: "Belum dikunjungi" },
    { state: "active", label: "Sedang dikunjungi" },
    { state: "visited", label: "Dikunjungi" },
    { state: "matched", label: "Cocok selector" },
    { state: "affected", label: "Terdampak" },
  ];

  return (
    <div className="dom-tree-legend">
      {items.map((i) => (
        <span key={i.state} className="dom-tree-legend-item">
          <span className={`dom-tree-dot dom-tree-dot--${i.state}`} />
          <span>{i.label}</span>
        </span>
      ))}
    </div>
  );
}

interface DOMTreeViewerProps {
  root: DOMNode;
  elapsedMs?: number;
  nodesVisited?: number;
  matchesFound?: number;
  maxDepth?: number;
  selectedAId?: string;
  selectedBId?: string;
  lcaId?: string;
  onElementNodeClick?: (nodeId: string) => void;
  onNonElementNodeClick?: () => void;
  animHighlightId?: string;
}

export default function DOMTreeViewer({
  root,
  elapsedMs,
  nodesVisited,
  matchesFound,
  maxDepth,
  selectedAId = "",
  selectedBId = "",
  lcaId = "",
  onElementNodeClick,
  onNonElementNodeClick,
  animHighlightId,
}: DOMTreeViewerProps) {
  const activeRowRef = useRef<HTMLButtonElement | null>(null);

  const rows = useMemo(() => {
    const nextRows: TreeRow[] = [];
    flattenRows(root, nextRows, 0, "idle", selectedAId, selectedBId, lcaId, animHighlightId);
    return nextRows;
  }, [root, selectedAId, selectedBId, lcaId, animHighlightId]);

  const stats = useMemo(
    () => ({
      total: countAll(root),
      visited: nodesVisited ?? 0,
      matched: matchesFound ?? 0,
      depth: maxDepth ?? 0,
    }),
    [root, nodesVisited, matchesFound, maxDepth],
  );

  useEffect(() => {
    activeRowRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [animHighlightId]);

  return (
    <div className="dom-tree-viewer">
      <StatsBar
        totalNodes={stats.total}
        visitedCount={stats.visited}
        matchedCount={stats.matched}
        maxDepth={stats.depth}
        elapsedMs={elapsedMs}
      />

      <div className="dom-tree-scroll" role="tree" aria-label="DOM tree visualization">
        <div className="dom-tree-list">
          {rows.map((row) => {
            const nodeLabel = row.type === "text" ? "#text" : `<${row.tag ?? "node"}>`;
            const idText = row.attrs.id ? `#${row.attrs.id}` : "";
            const classText = row.attrs.class ? `.${row.attrs.class.split(" ").join(" .")}` : "";
            const isActive = row.state === "active";

            return (
              <button
                key={row.id}
                ref={isActive ? activeRowRef : null}
                type="button"
                role="treeitem"
                aria-level={row.depth + 1}
                className={`dom-tree-row dom-tree-row--${row.state} ${
                  row.isSelectableForLCA ? "dom-tree-row--selectable" : "dom-tree-row--disabled"
                }`}
                style={{ paddingLeft: `${16 + row.depth * 34}px` }}
                onClick={() => {
                  if (row.isSelectableForLCA) {
                    onElementNodeClick?.(row.id);
                    return;
                  }
                  onNonElementNodeClick?.();
                }}
              >
                <span className="dom-tree-branch" aria-hidden="true" />
                <span className="dom-tree-node">
                  <span className="dom-tree-node-main">
                    <span className="dom-tree-node-label">{nodeLabel}</span>
                    {row.markers.map((marker) => (
                      <span key={marker} className={`dom-tree-marker dom-tree-marker--${marker.toLowerCase()}`}>
                        {marker}
                      </span>
                    ))}
                  </span>
                  {(idText || classText || row.textPreview) && (
                    <span className="dom-tree-node-meta">
                      {row.textPreview ? `"${row.textPreview}"` : `${idText} ${classText}`.trim()}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <Legend />
    </div>
  );
}