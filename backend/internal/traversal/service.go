package traversal

import (
	"context"
	"fmt"
	"strings"

	"tubes2/backend/internal/dom"
	"tubes2/backend/internal/selector"
)

func Run(ctx context.Context, request Request) (Result, error) {
	normalized, limit, err := normalizeRequest(request)
	if err != nil {
		return Result{}, err
	}

	htmlInput, err := loadSourceHTML(ctx, normalized)
	if err != nil {
		return Result{}, err
	}

	root, err := dom.ParseHTML(strings.NewReader(htmlInput))
	if err != nil {
		return Result{}, err
	}

	tree, infoByNode, err := buildResponseTree(root)
	if err != nil {
		return Result{}, err
	}

	parsedSelector := selector.Parse(normalized.Selector)
	if len(parsedSelector) == 0 {
		return Result{}, fmt.Errorf("selector is invalid or unsupported")
	}

	traversalResult := runTraversal(root, parsedSelector, normalized.Algorithm, limit)

	matchedNodes := make(map[*dom.Node]struct{}, len(traversalResult.Matches))
	for _, node := range traversalResult.Matches {
		matchedNodes[node] = struct{}{}
	}

	steps := make([]Step, 0, len(traversalResult.VisitedOrder))
	for _, node := range traversalResult.VisitedOrder {
		info, ok := infoByNode[node]
		if !ok {
			continue
		}

		event := StepVisit
		if _, matched := matchedNodes[node]; matched {
			event = StepMatch
			info.Tree.State = StateMatched
		} else if info.Tree.State == StateIdle {
			info.Tree.State = StateVisited
		}

		tag := node.Tag
		if node.Type == dom.NodeText {
			tag = "#text"
		}

		steps = append(steps, Step{
			Number:     len(steps) + 1,
			NodeID:     info.ID,
			Type:       string(node.Type),
			Tag:        tag,
			Text:       node.Text,
			Attributes: copyAttributes(node.Attrs),
			Depth:      info.Depth,
			Event:      event,
		})
	}

	matchesFound := 0
	for _, node := range traversalResult.Matches {
		if _, ok := infoByNode[node]; ok {
			matchesFound++
		}
	}

	return Result{
		Tree:         tree,
		Steps:        steps,
		ElapsedMs:    traversalResult.ElapsedNs / int64(1_000_000),
		NodesVisited: len(steps),
		MaxDepth:     maxTreeDepth(tree, 0),
		MatchesFound: matchesFound,
	}, nil
}

func runTraversal(root *dom.Node, parsedSelector selector.Selector, algorithm string, limit int) selector.TraversalResult {
	if algorithm == "DFS" {
		return selector.DFS(root, parsedSelector, limit)
	}

	return selector.BFS(root, parsedSelector, limit)
}
