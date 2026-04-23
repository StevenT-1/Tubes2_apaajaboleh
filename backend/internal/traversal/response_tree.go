package traversal

import (
	"fmt"

	"tubes2/backend/internal/dom"
)

// buildResponseTree converts the parser DOM into the tree shape used by the API/UI.
// We keep this separate because the parser tree contains internal-only details and
// has no stable node IDs or UI state.
func buildResponseTree(root *dom.Node) (*TreeNode, map[*dom.Node]responseNodeInfo, error) {
	topLevelElements := childElements(root)
	if len(topLevelElements) == 0 {
		return nil, nil, fmt.Errorf("html document has no element nodes")
	}

	infoByNode := make(map[*dom.Node]responseNodeInfo)
	nextID := 0

	if len(topLevelElements) == 1 {
		tree := buildResponseNode(topLevelElements[0], 0, infoByNode, &nextID)
		return tree, infoByNode, nil
	}

	fragment := &TreeNode{
		ID:         fmt.Sprintf("n%d", nextID),
		Type:       string(dom.NodeElement),
		Tag:        "fragment",
		Attributes: map[string]string{},
		Children:   []*TreeNode{},
		State:      StateIdle,
	}
	nextID++

	for _, child := range topLevelElements {
		fragment.Children = append(fragment.Children, buildResponseNode(child, 1, infoByNode, &nextID))
	}

	return fragment, infoByNode, nil
}

func buildResponseNode(node *dom.Node, depth int, infoByNode map[*dom.Node]responseNodeInfo, nextID *int) *TreeNode {
	nodeType := string(node.Type)
	tag := node.Tag
	if node.Type == dom.NodeText {
		tag = "#text"
	}

	treeNode := &TreeNode{
		ID:         fmt.Sprintf("n%d", *nextID),
		Type:       nodeType,
		Tag:        tag,
		Text:       node.Text,
		Attributes: copyAttributes(node.Attrs),
		Children:   []*TreeNode{},
		State:      StateIdle,
	}
	*nextID = *nextID + 1

	infoByNode[node] = responseNodeInfo{
		ID:    treeNode.ID,
		Depth: depth,
		Tree:  treeNode,
	}

	for _, child := range node.Children {
		if child == nil || child.Type == dom.NodeDocument {
			continue
		}
		treeNode.Children = append(treeNode.Children, buildResponseNode(child, depth+1, infoByNode, nextID))
	}

	return treeNode
}

func childElements(node *dom.Node) []*dom.Node {
	if node == nil {
		return nil
	}

	children := make([]*dom.Node, 0, len(node.Children))
	for _, child := range node.Children {
		if child != nil && child.Type == dom.NodeElement {
			children = append(children, child)
		}
	}

	return children
}

func maxTreeDepth(node *TreeNode, depth int) int {
	if node == nil {
		return 0
	}

	max := depth
	for _, child := range node.Children {
		if childDepth := maxTreeDepth(child, depth+1); childDepth > max {
			max = childDepth
		}
	}

	return max
}

func copyAttributes(attrs map[string]string) map[string]string {
	if len(attrs) == 0 {
		return map[string]string{}
	}

	copyMap := make(map[string]string, len(attrs))
	for key, value := range attrs {
		copyMap[key] = value
	}

	return copyMap
}
