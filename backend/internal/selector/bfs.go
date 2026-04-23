package selector

import (
	"time"

	"tubes2/backend/internal/dom"
)

type TraversalResult struct {
	Matches      []*dom.Node
	VisitedOrder []*dom.Node
	VisitedCount int
	ElapsedNs    int64
}

func BFS(root *dom.Node, sel Selector, limit int) TraversalResult {
	var result TraversalResult
	if root == nil {
		return result
	}

	start := time.Now()

	queue := []*dom.Node{root}

	for len(queue) > 0 {
		node := queue[0]
		queue = queue[1:]

		result.VisitedOrder = append(result.VisitedOrder, node)
		result.VisitedCount++

		if Matches(sel, node) {
			result.Matches = append(result.Matches, node)
			if limit > 0 && len(result.Matches) >= limit {
				break
			}
		}

		queue = append(queue, node.Children...)
	}

	result.ElapsedNs = time.Since(start).Nanoseconds()
	return result
}
