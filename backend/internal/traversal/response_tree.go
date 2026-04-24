package traversal

import (
	"fmt"

	"tubes2/backend/internal/dom"
)

type responseTreeData struct {
	Tree       *TreeNode
	InfoByNode map[*dom.Node]responseNodeInfo
	NodeByID   map[string]*dom.Node
	IDByNode   map[*dom.Node]string
}

// buildResponseTree converts the parser DOM into the tree shape used by the API/UI.
// It also keeps ID mappings so other features, such as LCA, can find the
// original *dom.Node from a frontend node ID.
func buildResponseTree(root *dom.Node) (responseTreeData, error) {
	topLevelElements := childElements(root)
	if len(topLevelElements) == 0 {
		return responseTreeData{}, fmt.Errorf("html document has no element nodes")
	}

	data := responseTreeData{
		InfoByNode: make(map[*dom.Node]responseNodeInfo),
		NodeByID:   make(map[string]*dom.Node),
		IDByNode:   make(map[*dom.Node]string),
	}
	nextID := 0

	if len(topLevelElements) == 1 {
		data.Tree = buildResponseNode(topLevelElements[0], 0, &data, &nextID)
		return data, nil
	}

	fragment := &TreeNode{
		ID:         fmt.Sprintf("n%d", nextID),
		Type:       string(dom.NodeElement),
		Tag:        "fragment",
		Attributes: map[string]string{},
		Children:   []*TreeNode{},
		State:      StateIdle,
	}
	data.Tree = fragment
	data.IDByNode[root] = fragment.ID
	nextID++

	for _, child := range topLevelElements {
		fragment.Children = append(fragment.Children, buildResponseNode(child, 1, &data, &nextID))
	}

	return data, nil
}

func buildResponseNode(node *dom.Node, depth int, data *responseTreeData, nextID *int) *TreeNode {
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

	data.InfoByNode[node] = responseNodeInfo{
		ID:    treeNode.ID,
		Depth: depth,
		Tree:  treeNode,
	}
	data.NodeByID[treeNode.ID] = node
	data.IDByNode[node] = treeNode.ID

	for _, child := range node.Children {
		if child == nil || child.Type == dom.NodeDocument {
			continue
		}
		treeNode.Children = append(treeNode.Children, buildResponseNode(child, depth+1, data, nextID))
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
