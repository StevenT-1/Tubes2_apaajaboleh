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
			parent = child
			stack = append(stack, child)
		case html.EndTagToken:
			if len(stack) > 1 {
				stack = stack[:len(stack)-1]
				parent = stack[len(stack)-1]
			}
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
