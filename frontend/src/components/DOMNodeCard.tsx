import { Handle, Position } from "@xyflow/react";
import type { NodeState } from "./DOMTreeType";

interface DOMNodeData {
  tag: string;
  id?: string;
  classes?: string;
  state: NodeState;
  isRoot?: boolean;
}

const STATE_STYLES: Record<NodeState, string> = {
  idle: "bg-white border-gray-200 text-gray-700",
  visited: "bg-amber-50 border-amber-400 text-amber-800",
  matched: "bg-green-50 border-green-500 text-green-700",
};

const STATE_DOT: Record<NodeState, string> = {
  idle: "bg-gray-300",
  visited: "bg-amber-400",
  matched: "bg-green-500",
};

export default function DOMNodeCard({ data }: { data: DOMNodeData }) {
  const { tag, id, classes, state, isRoot } = data;

  return (
    <div
      className={`
        relative px-3 py-2 rounded-lg border text-xs font-mono
        transition-colors duration-200 select-none
        ${STATE_STYLES[state]}
        ${state === "matched" ? "border-2 shadow-sm" : "border"}
      `}
      style={{ minWidth: 120, maxWidth: 160 }}
    >
      {/* target handle — semua node kecuali root */}
      {!isRoot && <Handle type="target" position={Position.Top} className="!bg-gray-300 !w-2 !h-2 !border-0" />}

      {/* state indicator dot */}
      <span className={`absolute top-2 right-2 w-1.5 h-1.5 rounded-full ${STATE_DOT[state]}`} />

      {/* tag name */}
      <p className="font-semibold leading-tight truncate pr-3">
        &lt;{tag}&gt;
      </p>

      {/* id & class */}
      {(id || classes) && (
        <p className="text-[10px] opacity-60 truncate mt-0.5">
          {id && <span>#{id} </span>}
          {classes && <span>.{classes.split(" ").join(" .")}</span>}
        </p>
      )}

      {/* source handle */}
      <Handle type="source" position={Position.Bottom} className="!bg-gray-300 !w-2 !h-2 !border-0" />
    </div>
  );
}