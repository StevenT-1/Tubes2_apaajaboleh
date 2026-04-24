package selector

import (
	"strings"
	"unicode"
)

type CombinatorType int

const (
	CombNone CombinatorType = iota
	CombDescendant // spasi
	CombChild // >
	CombAdjacent // +
	CombSibling // ~
)

type SimpleSelector struct {
	Tag        string
	IDs        []string
	Classes   []string
	Attributes []AttributeSelector
	Universal  bool
}

type AttributeSelector struct {
	Name     string
	Value    string
	HasValue bool
}

type SelectorPart struct {
	Combinator CombinatorType
	Simple SimpleSelector
}

type Selector []SelectorPart

func Parse(raw string) Selector {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return nil
	}

	var parts []SelectorPart
	combinator := CombNone
	i, n := 0, len(raw)

	for i < n {
		if unicode.IsSpace(rune(raw[i])) {
			j := i
			for j < n && unicode.IsSpace(rune(raw[j])) {
				j++
			}
			if j == n {
				break
			}
			if j < n && (raw[j] == '>' || raw[j] == '+' || raw[j] == '~') {
				i = j
				continue
			}
			if len(parts) == 0 {
				return nil
			}
			combinator = CombDescendant
			i = j
			continue
		}
		switch raw[i] {
		case '>':
			if len(parts) == 0 {
				return nil
			}
			combinator = CombChild
			i++
			for i < n && unicode.IsSpace(rune(raw[i])) {
				i++
			}
			if i == n {
				return nil
			}
			continue
		case '+':
			if len(parts) == 0 {
				return nil
			}
			combinator = CombAdjacent
			i++
			for i < n && unicode.IsSpace(rune(raw[i])) {
				i++
			}
			if i == n {
				return nil
			}
			continue
		case '~':
			if len(parts) == 0 {
				return nil
			}
			combinator = CombSibling
			i++
			for i < n && unicode.IsSpace(rune(raw[i])) {
				i++
			}
			if i == n {
				return nil
			}
			continue
		}
		simple, end, ok := parseSimple(raw, i)
		if !ok {
			return nil
		}
		parts = append(parts, SelectorPart{Combinator: combinator, Simple: simple})
		combinator = CombNone
		i = end
	}

	if len(parts) == 0 {
		return nil
	}
	return parts
}

func parseSimple(raw string, start int) (SimpleSelector, int, bool) {
	n := len(raw)
	s := SimpleSelector{}
	i := start
	for i < n {
		ch := raw[i]
		if ch == '>' || ch == '+' || ch == '~' || unicode.IsSpace(rune(ch)) {
			break
		}
		switch ch {
		case '*':
			s.Universal = true
			i++
		case '.':
			i++
			j := i
			for j < n && isNameChar(rune(raw[j])) {
				j++
			}
			if j == i {
				return SimpleSelector{}, start, false
			}
			s.Classes = append(s.Classes, raw[i:j])
			i = j
		case '#':
			i++
			j := i
			for j < n && isNameChar(rune(raw[j])) {
				j++
			}
			if j == i {
				return SimpleSelector{}, start, false
			}
			s.IDs = append(s.IDs, raw[i:j])
			i = j
		case '[':
			attribute, end, ok := parseAttribute(raw, i)
			if !ok {
				return SimpleSelector{}, start, false
			}
			s.Attributes = append(s.Attributes, attribute)
			i = end
		default:
			j := i
			for j < n && isNameChar(rune(raw[j])) {
				j++
			}
			if j == i {
				return SimpleSelector{}, start, false
			}
			s.Tag = strings.ToLower(raw[i:j])
			i = j
		}
	}
	return s, i, true
}

func parseAttribute(raw string, start int) (AttributeSelector, int, bool) {
	end := strings.Index(raw[start+1:], "]")
	if end < 0 {
		return AttributeSelector{}, start, false
	}

	end = start + 1 + end
	content := strings.TrimSpace(raw[start+1 : end])
	if content == "" {
		return AttributeSelector{}, start, false
	}

	attribute := AttributeSelector{}
	if equals := strings.Index(content, "="); equals >= 0 {
		attribute.Name = strings.TrimSpace(content[:equals])
		attribute.Value = strings.TrimSpace(content[equals+1:])
		attribute.HasValue = true

		if len(attribute.Value) >= 2 {
			first := attribute.Value[0]
			last := attribute.Value[len(attribute.Value)-1]
			if (first == '"' && last == '"') || (first == '\'' && last == '\'') {
				attribute.Value = attribute.Value[1 : len(attribute.Value)-1]
			}
		}
	} else {
		attribute.Name = content
	}

	if !isAttributeName(attribute.Name) {
		return AttributeSelector{}, start, false
	}

	return attribute, end + 1, true
}

func isNameChar(r rune) bool {
	return unicode.IsLetter(r) || unicode.IsDigit(r) || r == '-' || r == '_'
}

func isAttributeName(name string) bool {
	if name == "" {
		return false
	}

	for _, r := range name {
		if !isNameChar(r) {
			return false
		}
	}
	return true
}
