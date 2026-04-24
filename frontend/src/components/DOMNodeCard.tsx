import { Handle, Position } from "@xyflow/react";
import type { DOMNodeType, NodeState } from "./DOMTreeType";

interface DOMNodeData {
  type: DOMNodeType;
  tag?: string;
  textPreview?: string;
  id?: string;
  classes?: string;
  state: NodeState;
  isRoot?: boolean;
}

const STATE_STYLES: Record<NodeState, string> = {
  idle: "bg-white border-gray-200 text-gray-700",
  visited: "bg-amber-50 border-amber-400 text-amber-800",
  matched: "bg-green-50 border-green-500 text-green-700",
  active: "bg-sky-50 border-sky-500 text-sky-800",
};

const STATE_DOT: Record<NodeState, string> = {
  idle: "bg-gray-300",
  visited: "bg-amber-400",
  matched: "bg-green-500",
  active: "bg-sky-500 animate-ping",
};

const STATE_BORDER_WIDTH: Record<NodeState, string> = {
  idle: "border",
  visited: "border",
  matched: "border-2 shadow-sm",
  active: "border-2 shadow-md shadow-sky-200",
};

export default function DOMNodeCard({ data }: { data: DOMNodeData }) {
  const { type, tag, textPreview, id, classes, state, isRoot } = data;
  const isText = type === "text";

  return (
    <div
      className={`
        relative px-3 py-2 rounded-lg text-xs font-mono
        transition-all duration-300 select-none
        ${STATE_STYLES[state]}
        ${STATE_BORDER_WIDTH[state]}
        ${state === "active" ? "scale-105" : ""}
      `}
      style={{ minWidth: 120, maxWidth: 160 }}
    >
      {/* target handle — semua node kecuali root */}
      {!isRoot && <Handle type="target" position={Position.Top} className="!bg-gray-300 !w-2 !h-2 !border-0" />}

      {/* state indicator dot */}
      <span className={`absolute top-2 right-2 w-1.5 h-1.5 rounded-full ${STATE_DOT[state]}`} />

      {/* node label */}
      <p className="font-semibold leading-tight truncate pr-3">
        {isText ? "#text" : <>&lt;{tag}&gt;</>}
      </p>

      {isText && textPreview && (
        <p className="text-[10px] opacity-70 truncate mt-0.5">"{textPreview}"</p>
      )}

      {/* id & class */}
      {!isText && (id || classes) && (
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
