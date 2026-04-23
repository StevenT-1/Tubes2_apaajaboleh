package selector

import (
    "sync"
)

// memproses setiap level pohon DOM secara paralel
func BFSParallel(root *Node, sel Selector, limit int) TraversalResult {
    var result TraversalResult
    var mu sync.Mutex
    orderCounter := 0
    currentLevel := []*Node{root}
    for len(currentLevel) > 0 {
        var nextLevel []*Node
        var wg sync.WaitGroup
        limitReached := false
        for _, node := range currentLevel {
            wg.Add(1)
            node := node
            go func() {
                defer wg.Done()
                mu.Lock()
                if limitReached {
                    mu.Unlock()
                    return
                }
                orderCounter++
                node.Visited = true
                node.TraverseOrder = orderCounter
                result.VisitedOrder = append(result.VisitedOrder, node)
                result.VisitedCount++
                mu.Unlock()
                matched := Matches(sel, node)
                mu.Lock()
                if matched {
                    node.Matched = true
                    result.Matches = append(result.Matches, node)
                    if limit > 0 && len(result.Matches) >= limit {
                        limitReached = true
                    }
                }
                mu.Unlock()
            }()
        }

        wg.Wait()

        if limitReached {
            break
        }

        // kumpulin anak-anak untuk level berikutnya
        for _, node := range currentLevel {
            nextLevel = append(nextLevel, node.Children...)
        }
        currentLevel = nextLevel
    }

    return result
}