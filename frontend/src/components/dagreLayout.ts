import { Position, type Node, type Edge } from "@xyflow/react";

const ROW_HEIGHT = 82;
const DEPTH_INDENT = 68;

export function getLayoutedElements(nodes: Node[], edges: Edge[]) {
  const childrenByParent = new Map<string, string[]>();
  const childIds = new Set<string>();
  const nodeById = new Map(nodes.map((node) => [node.id, node]));

  edges.forEach((edge) => {
    childIds.add(edge.target);
    const siblings = childrenByParent.get(edge.source) ?? [];
    siblings.push(edge.target);
    childrenByParent.set(edge.source, siblings);
  });

  const root = nodes.find((node) => !childIds.has(node.id)) ?? nodes[0];
  const positioned = new Map<string, { x: number; y: number }>();
  let row = 0;

  function placeSubtree(nodeId: string, depth: number) {
    positioned.set(nodeId, {
      x: depth * DEPTH_INDENT,
      y: row * ROW_HEIGHT,
    });
    row += 1;

    const childIds = childrenByParent.get(nodeId) ?? [];
    childIds.forEach((childId) => placeSubtree(childId, depth + 1));
  }

  if (root) {
    placeSubtree(root.id, 0);
  }

  nodes.forEach((node) => {
    if (!positioned.has(node.id)) {
      positioned.set(node.id, { x: 0, y: row * ROW_HEIGHT });
      row += 1;
    }
  });

  const layoutedNodes: Node[] = nodes.map((node) => {
    const position = positioned.get(node.id) ?? { x: 0, y: 0 };
    return {
      ...node,
      position,
      targetPosition: Position.Left,
      sourcePosition: Position.Bottom,
    };
  });

  const layoutedEdges: Edge[] = edges
    .filter((edge) => nodeById.has(edge.source) && nodeById.has(edge.target))
    .map((edge) => ({
      ...edge,
      type: "smoothstep",
      pathOptions: {
        borderRadius: 8,
      },
    }));

  return { nodes: layoutedNodes, edges: layoutedEdges };
}
