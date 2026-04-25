export type NodeState = "idle" | "visited" | "matched" | "affected" | "active";
export type DOMNodeType = "element" | "text";

export interface DOMNode {
  id: string;
  type?: DOMNodeType;
  tag?: string;
  text?: string;
  attributes?: Record<string, string>;
  children?: DOMNode[];
  state?: NodeState;
}

export function findDOMNodeById(root: DOMNode | null, nodeId?: string): DOMNode | null {
  if (!root || !nodeId) return null;
  if (root.id === nodeId) return root;

  for (const child of root.children ?? []) {
    const found = findDOMNodeById(child, nodeId);
    if (found) return found;
  }

  return null;
}

export function formatDOMNodeLabel(node: DOMNode | null): string {
  if (!node) return "-";

  if (node.type === "text") {
    const text = (node.text ?? "").trim().replace(/\s+/g, " ");
    return text ? `#text "${text}"` : "#text";
  }

  let label = node.tag ?? "node";
  const id = node.attributes?.id;
  const classes = node.attributes?.class;
  if (id) label += `#${id}`;
  if (classes) {
    label += `.${classes.trim().split(/\s+/).join(".")}`;
  }
  return label;
}
