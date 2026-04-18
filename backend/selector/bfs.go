package selector

// menyimpan hasil satu kali bfs/dfs
type TraversalResult struct {
	Matches []*Node
	VisitedOrder []*Node
	VisitedCount int
	ElapsedNs int64
}

func BFS(root *Node, sel Selector, limit int) TraversalResult {
	var result TraversalResult
	order := 0

	// queue mulai dari root
	queue := []*Node{root}

	for len(queue) > 0 {
		node := queue[0]
		queue = queue[1:]

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
				break
			}
		}

		// semua anak node masuk ke queue
		queue = append(queue, node.Children...)
	}

	return result
}
