export const TRAVERSAL_ALGORITHMS = {
  BFS: "bfs",
  DFS: "dfs",
  BFS_PARALLEL: "bfs_parallel",
} as const;

export type TraversalAlgorithm =
  typeof TRAVERSAL_ALGORITHMS[keyof typeof TRAVERSAL_ALGORITHMS];
