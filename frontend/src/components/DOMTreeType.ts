export type NodeState = "idle" | "visited" | "matched";

export interface DOMNode {
  id: string;
  tag: string;
  attributes: Record<string, string>;
  children: DOMNode[];
  state?: NodeState;
}