package dom

import "strings"

type NodeType string

const (
	NodeDocument NodeType = "document"
	NodeElement NodeType = "element"
	NodeText NodeType = "text"
)

type Node struct {
	Type     NodeType          `json:"type"`
	Tag      string            `json:"tag,omitempty"`
	Text     string            `json:"text,omitempty"`
	Attrs    map[string]string `json:"attrs,omitempty"`
	Parent   *Node             `json:"-"`
	Children []*Node           `json:"children,omitempty"`
}

func NewDocument() *Node {
	return &Node{Type: NodeDocument, Tag: "#document", Attrs: make(map[string]string)}
}

func NewElement(tag string, attrs map[string]string) *Node {
	if attrs == nil {
		attrs = make(map[string]string)
	}
	return &Node{Type: NodeElement, Tag: strings.ToLower(tag), Attrs: attrs}
}

func NewText(text string) *Node {
	return &Node{Type: NodeText, Text: text}
}

func (n *Node) AppendChild(child *Node) {
	if n == nil || child == nil {
		return
	}
	child.Parent = n
	n.Children = append(n.Children, child)
}

func (n *Node) Depth() int {
	depth := 0
	for current := n; current != nil && current.Parent != nil; current = current.Parent {
		depth++
	}
	return depth
}

func (n *Node) MaxDepth() int {
	if n == nil {
		return 0
	}
	maxDepth := n.Depth()
	for _, child := range n.Children {
		if childDepth := child.MaxDepth(); childDepth > maxDepth {
			maxDepth = childDepth
		}
	}
	return maxDepth
}

func (n *Node) Count() int {
	if n == nil {
		return 0
	}
	count := 1
	for _, child := range n.Children {
		count += child.Count()
	}
	return count
}
