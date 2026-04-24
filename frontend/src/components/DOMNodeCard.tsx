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
  isSelectableForLCA?: boolean;
  markers?: string[];
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
  const { type, tag, textPreview, id, classes, state, isRoot, isSelectableForLCA, markers = [] } = data;
  const isText = type === "text";
  const hasMarkerA = markers.includes("A");
  const hasMarkerB = markers.includes("B");
  const hasMarkerLCA = markers.includes("LCA");

  let markerOutlineClass = "";
  if (hasMarkerLCA) {
    markerOutlineClass = "ring-2 ring-green-500";
  } else if (hasMarkerA) {
    markerOutlineClass = "ring-2 ring-blue-500";
  } else if (hasMarkerB) {
    markerOutlineClass = "ring-2 ring-amber-400";
  }

  return (
    <div
      className={`
        relative px-3 py-2 rounded-lg border text-xs font-mono
        transition-colors duration-200 select-none
        ${STATE_STYLES[state]}
        ${state === "matched" ? "border-2 shadow-sm" : "border"}
        ${markerOutlineClass}
        ${isSelectableForLCA ? "cursor-pointer hover:shadow-md" : "cursor-not-allowed"}
      `}
      style={{ minWidth: 120, maxWidth: 160 }}
    >
      {/* target handle — semua node kecuali root */}
      {!isRoot && <Handle type="target" position={Position.Top} className="!bg-gray-300 !w-2 !h-2 !border-0" />}

      {/* state indicator dot */}
      <span className={`absolute top-2 right-2 w-1.5 h-1.5 rounded-full ${STATE_DOT[state]}`} />

      {markers.length > 0 && (
        <div className="mb-1 flex flex-wrap gap-1 pr-3">
          {markers.map((marker) => (
            <span
              key={marker}
              className={`px-1.5 py-0.5 text-[9px] font-bold border bg-white ${
                marker === "LCA"
                  ? "border-green-500 text-green-700"
                  : marker === "A"
                    ? "border-blue-500 text-blue-700"
                    : "border-amber-400 text-amber-800"
              }`}
            >
              {marker}
            </span>
          ))}
        </div>
      )}

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
