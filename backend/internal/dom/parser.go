package dom

import (
	"fmt"
	"io"
	"strings"

	"golang.org/x/net/html"
)

func ParseHTML(r io.Reader) (*Node, error) {
	if r == nil {
		return nil, fmt.Errorf("html io reader is nil")
	}

	t := html.NewTokenizer(r)

	root := NewDocument()
	parent := root
	stack := []*Node{root}
	for {
		tokType := t.Next()
		token := t.Token()
		switch tokType {
		case html.ErrorToken:
			if t.Err() == io.EOF {
				if len(stack) > 1 {
					return nil, fmt.Errorf("unclosed tag <%s>", stack[len(stack)-1].Tag)
				}
				return root, nil
			}
			return nil, fmt.Errorf("tokenizing html: %w", t.Err())
		case html.StartTagToken:
			attrs := make(map[string]string)
			for _, e := range token.Attr {
				attrs[e.Key] = e.Val
			}
			child := NewElement(token.Data, attrs)
			parent.AppendChild(child)
			if !isVoidTag(child.Tag) {
				parent = child
				stack = append(stack, child)
			}
		case html.EndTagToken:
			closingTag := strings.ToLower(token.Data)
			if len(stack) == 1 {
				return nil, fmt.Errorf("unexpected closing tag </%s> with no open tag", closingTag)
			}
			openTag := stack[len(stack)-1].Tag
			if openTag != closingTag {
				return nil, fmt.Errorf("unexpected closing tag </%s>, expected </%s>", closingTag, openTag)
			}
			stack = stack[:len(stack)-1]
			parent = stack[len(stack)-1]
		case html.TextToken:
			if strings.TrimSpace(token.Data) != "" {
				child := NewText(token.Data)
				parent.AppendChild(child)
			}
		case html.SelfClosingTagToken:
			attrs := make(map[string]string)
			for _, e := range token.Attr {
				attrs[e.Key] = e.Val
			}
			child := NewElement(token.Data, attrs)
			parent.AppendChild(child)
		}
	}
}

func isVoidTag(tag string) bool {
	switch tag {
	case "area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr":
		return true
	default:
		return false
	}
}
