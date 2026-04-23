import { useEffect, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import type { DOMNode, NodeState } from "./DOMTreeType";
import DOMNodeCard from "./DOMNodeCard";
import { getLayoutedElements } from "./dagreLayout";

const nodeTypes = { domNode: DOMNodeCard };

// ── helpers ──────────────────────────────────────────────────────────────────

function flattenToFlow(
  node: DOMNode,
  parentId: string | null,
  nodesAcc: Node[],
  edgesAcc: Edge[],
  isRoot = false
) {
  const attrs = node.attributes ?? {};

  nodesAcc.push({
    id: node.id,
    type: "domNode",
    position: { x: 0, y: 0 }, // dagre will override
    data: {
      tag: node.tag,
      id: attrs.id,
      classes: attrs.class,
      state: node.state ?? "idle",
      isRoot,
    },
  });

  if (parentId) {
    edgesAcc.push({
      id: `e-${parentId}-${node.id}`,
      source: parentId,
      target: node.id,
      style: { stroke: "#d1d5db", strokeWidth: 1.5 },
      animated: false,
    });
  }

  node.children?.forEach((child) => flattenToFlow(child, node.id, nodesAcc, edgesAcc));
}

function buildFlowElements(root: DOMNode) {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  flattenToFlow(root, null, nodes, edges, true);
  return getLayoutedElements(nodes, edges);
}

// ── stats bar ────────────────────────────────────────────────────────────────

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
    ...(elapsedMs != null ? [{ label: "Waktu", value: `${elapsedMs} ms` }] : []),
  ];

  return (
    <div className="flex gap-4 px-4 py-2 border-b border-gray-100 bg-gray-50 text-xs flex-wrap">
      {stats.map((s) => (
        <span key={s.label} className="flex items-center gap-1">
          <span className="text-gray-400">{s.label}:</span>
          <span className={`font-semibold ${s.color ?? "text-gray-700"}`}>{s.value}</span>
        </span>
      ))}
    </div>
  );
}

// ── legend ───────────────────────────────────────────────────────────────────

function Legend() {
  const items: { state: NodeState; label: string; dot: string }[] = [
    { state: "idle", label: "Belum dikunjungi", dot: "bg-gray-300" },
    { state: "visited", label: "Dikunjungi", dot: "bg-amber-400" },
    { state: "matched", label: "Cocok selector", dot: "bg-green-500" },
  ];
  return (
    <div className="flex gap-3 px-4 py-1.5 border-t border-gray-100 bg-white text-xs">
      {items.map((i) => (
        <span key={i.state} className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${i.dot}`} />
          <span className="text-gray-500">{i.label}</span>
        </span>
      ))}
    </div>
  );
}

// ── max depth util ───────────────────────────────────────────────────────────

function getMaxDepth(node: DOMNode, depth = 0): number {
  if (!node.children?.length) return depth;
  return Math.max(...node.children.map((c) => getMaxDepth(c, depth + 1)));
}

function countByState(node: DOMNode, state: NodeState): number {
  let count = node.state === state ? 1 : 0;
  node.children?.forEach((c) => { count += countByState(c, state); });
  return count;
}

function countAll(node: DOMNode): number {
  return 1 + (node.children ?? []).reduce((acc, c) => acc + countAll(c), 0);
}

// ── main component ────────────────────────────────────────────────────────────

interface DOMTreeViewerProps {
  root: DOMNode;
  elapsedMs?: number;
}

export default function DOMTreeViewer({ root, elapsedMs }: DOMTreeViewerProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([] as Node[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([] as Edge[]);

  useEffect(() => {
    const { nodes: n, edges: e } = buildFlowElements(root);
    setNodes(n);
    setEdges(e);
  }, [root]);

  const stats = useMemo(() => ({
    total: countAll(root),
    visited: countByState(root, "visited") + countByState(root, "matched"),
    matched: countByState(root, "matched"),
    depth: getMaxDepth(root),
  }), [root]);

  return (
    <div className="flex flex-col border border-gray-200 rounded-xl overflow-hidden" style={{ height: 520 }}>
      <StatsBar
        totalNodes={stats.total}
        visitedCount={stats.visited}
        matchedCount={stats.matched}
        maxDepth={stats.depth}
        elapsedMs={elapsedMs}
      />

      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.1}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
        >
          <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#e5e7eb" />
          <Controls showInteractive={false} />
          <MiniMap
            nodeColor={(n) => {
              const state = (n.data as { state: NodeState }).state;
              if (state === "matched") return "#22c55e";
              if (state === "visited") return "#f59e0b";
              return "#232838";
            }}
            maskColor="rgba(13,15,20,0.65)"
          />
        </ReactFlow>
      </div>

      <Legend />
    </div>
  );
}