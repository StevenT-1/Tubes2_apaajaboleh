export type NodeState = "idle" | "visited" | "matched";
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
