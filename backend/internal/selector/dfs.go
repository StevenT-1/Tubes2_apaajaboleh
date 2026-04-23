package selector

import (
	"time"

	"tubes2/backend/internal/dom"
)

func DFS(root *dom.Node, sel Selector, limit int) TraversalResult {
	var result TraversalResult
	if root == nil {
		return result
	}

	start := time.Now()
	var dfs func(node *dom.Node) bool
	dfs = func(node *dom.Node) bool {
		result.VisitedOrder = append(result.VisitedOrder, node)
		result.VisitedCount++

		if Matches(sel, node) {
			result.Matches = append(result.Matches, node)
			if limit > 0 && len(result.Matches) >= limit {
				return true
			}
		}
		for _, child := range node.Children {
			if dfs(child) {
				return true
			}
		}
		return false
	}

	dfs(root)
	result.ElapsedNs = time.Since(start).Nanoseconds()
	return result
}
