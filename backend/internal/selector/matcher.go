package selector

import (
	"strings"

	"tubes2/backend/internal/dom"
)

func matchSimple(s SimpleSelector, node *dom.Node) bool {
	if node == nil || node.Type != dom.NodeElement {
		return false
	}

	if s.Universal && s.Tag == "" && len(s.IDs) == 0 && len(s.Classes) == 0 {
		return true
	}
	if s.Tag != "" && s.Tag != strings.ToLower(node.Tag) {
		return false
	}
	for _, id := range s.IDs {
		if node.ID() != id {
			return false
		}
	}
	nodeClasses := make(map[string]bool, len(node.Classes()))
	for _, c := range node.Classes() {
		nodeClasses[c] = true
	}
	for _, c := range s.Classes {
		if !nodeClasses[c] {
			return false
		}
	}

	return true
}

func Matches(sel Selector, node *dom.Node) bool {
	if len(sel) == 0 || node == nil || node.Type != dom.NodeElement {
		return false
	}
	return matchParts(sel, len(sel)-1, node)
}

func matchParts(sel Selector, partIdx int, node *dom.Node) bool {
	part := sel[partIdx]
	// node saat ini harus cocok dengan simple selector paling kanan
	if !matchSimple(part.Simple, node) {
		return false
	}
	if partIdx == 0 {
		return true
	}

	switch part.Combinator {
	case CombDescendant:
		for anc := node.Parent; anc != nil; anc = anc.Parent {
			if matchParts(sel, partIdx-1, anc) {
				return true
			}
		}
		return false
	case CombChild:
		if node.Parent == nil {
			return false
		}
		return matchParts(sel, partIdx-1, node.Parent)
	case CombAdjacent:
		prev := prevElementSibling(node)
		if prev == nil {
			return false
		}
		return matchParts(sel, partIdx-1, prev)
	case CombSibling:
		for sib := prevElementSibling(node); sib != nil; sib = prevElementSibling(sib) {
			if matchParts(sel, partIdx-1, sib) {
				return true
			}
		}
		return false
	}
	return false
}

func prevElementSibling(node *dom.Node) *dom.Node {
	if node == nil || node.Parent == nil {
		return nil
	}

	siblings := node.Parent.Children
	for i, sibling := range siblings {
		if sibling != node {
			continue
		}

		for j := i - 1; j >= 0; j-- {
			if siblings[j] != nil && siblings[j].Type == dom.NodeElement {
				return siblings[j]
			}
		}
		return nil
	}

	return nil
}
