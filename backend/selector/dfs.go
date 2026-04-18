package selector

func DFS(root *Node, sel Selector, limit int) TraversalResult {
	var result TraversalResult
	order := 0
	var dfs func(node *Node) bool
	dfs = func(node *Node) bool {
		// catet kunjungan
		order++
		node.Visited = true
		node.TraverseOrder = order
		result.VisitedOrder = append(result.VisitedOrder, node)
		result.VisitedCount++

		// cek node cocok dengan selector
		if Matches(sel, node) {
			node.Matched = true
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
	return result
}
