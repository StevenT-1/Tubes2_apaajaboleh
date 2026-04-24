package selector

import (
	"sync"
	"time"

	"tubes2/backend/internal/dom"
)

// BFSParallel processes each BFS level with goroutines.
// It still preserves BFS level progression: the next level is only collected
// after every goroutine in the current level has finished.
// Nodes inside the same level are recorded in the order goroutines acquire the
// lock, so same-level ordering may vary between runs.
func BFSParallel(root *dom.Node, sel Selector, limit int) TraversalResult {
	var result TraversalResult
	if root == nil {
		return result
	}

	start := time.Now()

	var mu sync.Mutex
	currentLevel := []*dom.Node{root}

	for len(currentLevel) > 0 {
		var wg sync.WaitGroup
		limitReached := false

		for _, node := range currentLevel {
			node := node

			wg.Add(1)
			go func() {
				defer wg.Done()

				mu.Lock()
				if limitReached {
					mu.Unlock()
					return
				}

				result.VisitedOrder = append(result.VisitedOrder, node)
				result.VisitedCount++
				mu.Unlock()

				matched := Matches(sel, node)

				mu.Lock()
				if matched && (limit == 0 || len(result.Matches) < limit) {
					result.Matches = append(result.Matches, node)

					if limit > 0 && len(result.Matches) >= limit {
						limitReached = true
					}
				}
				mu.Unlock()
			}()
		}

		wg.Wait()

		mu.Lock()
		shouldStop := limitReached
		mu.Unlock()

		if shouldStop {
			break
		}

		currentLevel = collectNextBFSLevel(currentLevel)
	}

	result.ElapsedNs = time.Since(start).Nanoseconds()
	return result
}

func collectNextBFSLevel(level []*dom.Node) []*dom.Node {
	nextLevel := make([]*dom.Node, 0)

	for _, node := range level {
		if node == nil {
			continue
		}

		nextLevel = append(nextLevel, node.Children...)
	}

	return nextLevel
}
