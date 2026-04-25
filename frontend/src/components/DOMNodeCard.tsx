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
  affected: "bg-emerald-50 border-emerald-300 text-emerald-700",
  active: "bg-sky-50 border-sky-500 text-sky-800",
};

const STATE_DOT: Record<NodeState, string> = {
  idle: "bg-gray-300",
  visited: "bg-amber-400",
  matched: "bg-green-500",
  affected: "bg-emerald-300",
  active: "bg-sky-500 animate-ping",
};

const STATE_BORDER_WIDTH: Record<NodeState, string> = {
  idle: "border",
  visited: "border",
  matched: "border-2 shadow-sm",
  affected: "border",
  active: "border-2 shadow-md shadow-sky-200",
};

export default function DOMNodeCard({ data }: { data: DOMNodeData }) {
  const {
    type,
    tag,
    textPreview,
    id,
    classes,
    state,
    isRoot,
    isSelectableForLCA,
    markers = [],
  } = data;

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
        relative px-4 py-3 rounded-lg text-sm font-mono
        transition-all duration-300 select-none
        ${STATE_STYLES[state]}
        ${STATE_BORDER_WIDTH[state]}
        ${state === "active" ? "scale-105" : ""}
        ${markerOutlineClass}
        ${isSelectableForLCA ? "cursor-pointer hover:shadow-md" : "cursor-not-allowed"}
      `}
      style={{ minWidth: 170, maxWidth: 220 }}
    >
      {!isRoot && (
        <Handle
          type="target"
          position={Position.Left}
          className="!bg-gray-300 !w-2 !h-2 !border-0"
        />
      )}

      <span className={`absolute top-3 right-3 w-2 h-2 rounded-full ${STATE_DOT[state]}`} />

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

      <p className="font-semibold leading-tight truncate pr-4">
        {isText ? "#text" : <>&lt;{tag}&gt;</>}
      </p>

      {isText && textPreview && (
        <p className="text-[11px] opacity-70 truncate mt-1">"{textPreview}"</p>
      )}

      {!isText && (id || classes) && (
        <p className="text-[11px] opacity-60 truncate mt-1">
          {id && <span>#{id} </span>}
          {classes && <span>.{classes.split(" ").join(" .")}</span>}
        </p>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-gray-300 !w-2 !h-2 !border-0"
      />
    </div>
  );
}
