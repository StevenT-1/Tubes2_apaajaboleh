package traversal

import (
	"context"
	"fmt"
	"math/bits"
	"strings"

	"tubes2/backend/internal/dom"
)

type LCARequest struct {
	SourceType string `json:"sourceType"`
	Source     string `json:"source,omitempty"`
	URL        string `json:"url,omitempty"`
	HTML       string `json:"html,omitempty"`
	NodeAID    string `json:"nodeAId"`
	NodeBID    string `json:"nodeBId"`
}

type LCAResponse struct {
	NodeAID  string   `json:"nodeAId"`
	NodeBID  string   `json:"nodeBId"`
	LCAID    string   `json:"lcaId"`
	LCALabel string   `json:"lcaLabel,omitempty"`
	Distance int      `json:"distance,omitempty"`
	PathA    []string `json:"pathA,omitempty"`
	PathB    []string `json:"pathB,omitempty"`
}

type lcaTable struct {
	// depth[node] is the distance from the root. The root has depth 0.
	depth map[*dom.Node]int

	// up[node][k] is the 2^k-th ancestor of node.
	// Example: up[node][0] is the parent, up[node][1] is the grandparent.
	up map[*dom.Node][]*dom.Node

	maxLog int
}

func RunLCA(ctx context.Context, request LCARequest) (LCAResponse, error) {
	normalized, source, err := normalizeLCARequest(request)
	if err != nil {
		return LCAResponse{}, err
	}

	htmlInput, err := loadSourceHTML(ctx, Request{
		SourceType: normalized.SourceType,
		Source:     source,
	})
	if err != nil {
		return LCAResponse{}, err
	}

	root, err := dom.ParseHTML(strings.NewReader(htmlInput))
	if err != nil {
		return LCAResponse{}, err
	}

	treeData, err := buildResponseTree(root)
	if err != nil {
		return LCAResponse{}, err
	}

	nodeA, ok := treeData.NodeByID[normalized.NodeAID]
	if !ok {
		return LCAResponse{}, fmt.Errorf("nodeAId %q was not found in the DOM tree", normalized.NodeAID)
	}
	nodeB, ok := treeData.NodeByID[normalized.NodeBID]
	if !ok {
		return LCAResponse{}, fmt.Errorf("nodeBId %q was not found in the DOM tree", normalized.NodeBID)
	}
	if nodeA.Type != dom.NodeElement || nodeB.Type != dom.NodeElement {
		return LCAResponse{}, fmt.Errorf("LCA can only be calculated for element nodes")
	}

	table := buildLCATable(root)
	lcaNode := findLCA(table, nodeA, nodeB)
	if lcaNode == nil {
		return LCAResponse{}, fmt.Errorf("could not find LCA for the selected nodes")
	}

	lcaID, ok := treeData.IDByNode[lcaNode]
	if !ok {
		return LCAResponse{}, fmt.Errorf("LCA node is not visible in the response tree")
	}

	return LCAResponse{
		NodeAID:  normalized.NodeAID,
		NodeBID:  normalized.NodeBID,
		LCAID:    lcaID,
		LCALabel: formatDOMNodeLabel(lcaNode),
		Distance: distanceBetweenNodes(table, nodeA, nodeB, lcaNode),
		PathA:    collectAncestorPath(table, nodeA, lcaNode, treeData.IDByNode),
		PathB:    collectAncestorPath(table, nodeB, lcaNode, treeData.IDByNode),
	}, nil
}

func normalizeLCARequest(request LCARequest) (LCARequest, string, error) {
	normalized := LCARequest{
		SourceType: strings.ToLower(strings.TrimSpace(request.SourceType)),
		Source:     strings.TrimSpace(request.Source),
		URL:        strings.TrimSpace(request.URL),
		HTML:       strings.TrimSpace(request.HTML),
		NodeAID:    strings.TrimSpace(request.NodeAID),
		NodeBID:    strings.TrimSpace(request.NodeBID),
	}

	if normalized.SourceType != "url" && normalized.SourceType != "html" {
		return LCARequest{}, "", fmt.Errorf("sourceType must be url or html")
	}
	if normalized.NodeAID == "" || normalized.NodeBID == "" {
		return LCARequest{}, "", fmt.Errorf("nodeAId and nodeBId must not be empty")
	}

	source := normalized.Source
	if normalized.SourceType == "url" && normalized.URL != "" {
		source = normalized.URL
	}
	if normalized.SourceType == "html" && normalized.HTML != "" {
		source = normalized.HTML
	}
	if source == "" {
		return LCARequest{}, "", fmt.Errorf("source must not be empty")
	}

	return normalized, source, nil
}

func buildLCATable(root *dom.Node) lcaTable {
	nodeCount := countDOMNodes(root)
	maxLog := bits.Len(uint(nodeCount)) + 1
	table := lcaTable{
		depth:  make(map[*dom.Node]int, nodeCount),
		up:     make(map[*dom.Node][]*dom.Node, nodeCount),
		maxLog: maxLog,
	}

	var walk func(node *dom.Node, parent *dom.Node, depth int)
	walk = func(node *dom.Node, parent *dom.Node, depth int) {
		if node == nil {
			return
		}

		table.depth[node] = depth
		table.up[node] = make([]*dom.Node, maxLog)
		if parent == nil {
			table.up[node][0] = node
		} else {
			table.up[node][0] = parent
		}

		for k := 1; k < maxLog; k++ {
			halfAncestor := table.up[node][k-1]
			table.up[node][k] = table.up[halfAncestor][k-1]
		}

		for _, child := range node.Children {
			walk(child, node, depth+1)
		}
	}

	walk(root, nil, 0)
	return table
}

func liftNode(table lcaTable, node *dom.Node, levels int) *dom.Node {
	for k := 0; k < table.maxLog; k++ {
		if (levels>>k)&1 == 1 {
			node = table.up[node][k]
		}
	}
	return node
}

func findLCA(table lcaTable, nodeA *dom.Node, nodeB *dom.Node) *dom.Node {
	if nodeA == nil || nodeB == nil {
		return nil
	}

	depthA := table.depth[nodeA]
	depthB := table.depth[nodeB]
	if depthA < depthB {
		nodeA, nodeB = nodeB, nodeA
		depthA, depthB = depthB, depthA
	}

	nodeA = liftNode(table, nodeA, depthA-depthB)
	if nodeA == nodeB {
		return nodeA
	}

	for k := table.maxLog - 1; k >= 0; k-- {
		ancestorA := table.up[nodeA][k]
		ancestorB := table.up[nodeB][k]
		if ancestorA != ancestorB {
			nodeA = ancestorA
			nodeB = ancestorB
		}
	}

	return table.up[nodeA][0]
}

func distanceBetweenNodes(table lcaTable, nodeA *dom.Node, nodeB *dom.Node, lcaNode *dom.Node) int {
	return table.depth[nodeA] + table.depth[nodeB] - 2*table.depth[lcaNode]
}

func collectAncestorPath(table lcaTable, start *dom.Node, ancestor *dom.Node, idByNode map[*dom.Node]string) []string {
	path := []string{}
	for node := start; node != nil; node = table.up[node][0] {
		if id, ok := idByNode[node]; ok {
			path = append(path, id)
		}
		if node == ancestor {
			break
		}
		if table.up[node][0] == node {
			break
		}
	}
	return path
}

func countDOMNodes(root *dom.Node) int {
	if root == nil {
		return 0
	}

	count := 1
	for _, child := range root.Children {
		count += countDOMNodes(child)
	}
	return count
}

func formatDOMNodeLabel(node *dom.Node) string {
	if node == nil {
		return ""
	}
	if node.Type == dom.NodeText {
		text := strings.TrimSpace(node.Text)
		if text == "" {
			return "#text"
		}
		return fmt.Sprintf("#text %q", text)
	}
	if node.Type == dom.NodeDocument {
		return "document"
	}

	label := node.Tag
	if id := node.ID(); id != "" {
		label += "#" + id
	}
	for _, className := range node.Classes() {
		label += "." + className
	}
	return label
}
