package selector

import "strings"

type Node struct {
	Tag string
	Attributes map[string]string
	Children []*Node
	Parent *Node
	Depth int
	Visited bool
	Matched bool
	TraverseOrder int
}

func (n *Node) Classes() []string {
	cls, ok := n.Attributes["class"]
	if !ok || cls == "" {
		return nil
	}
	return strings.Fields(cls)
}

func (n *Node) ID() string {
	return n.Attributes["id"]
}

func prevSibling(node *Node) *Node {
	if node.Parent == nil {
		return nil
	}
	siblings := node.Parent.Children
	for i, s := range siblings {
		if s == node && i > 0 {
			return siblings[i-1]
		}
	}
	return nil
}
