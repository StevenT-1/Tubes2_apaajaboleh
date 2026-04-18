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
	Tag string
	IDs []string
	Classes []string
	Universal bool
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
		// menangani spasi
		if unicode.IsSpace(rune(raw[i])) {
			j := i
			for j < n && unicode.IsSpace(rune(raw[j])) {
				j++
			}
			if j < n && (raw[j] == '>' || raw[j] == '+' || raw[j] == '~') {
				i = j
				continue
			}
			combinator = CombDescendant
			i = j
			continue
		}
		switch raw[i] {
		case '>':
			combinator = CombChild
			i++
			for i < n && unicode.IsSpace(rune(raw[i])) {
				i++
			}
			continue
		case '+':
			combinator = CombAdjacent
			i++
			for i < n && unicode.IsSpace(rune(raw[i])) {
				i++
			}
			continue
		case '~':
			combinator = CombSibling
			i++
			for i < n && unicode.IsSpace(rune(raw[i])) {
				i++
			}
			continue
		}
		simple, end := parseSimple(raw, i)
		parts = append(parts, SelectorPart{Combinator: combinator, Simple: simple})
		combinator = CombNone
		i = end
	}

	return parts
}

func parseSimple(raw string, start int) (SimpleSelector, int) {
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
			s.Classes = append(s.Classes, raw[i:j])
			i = j
		case '#':
			i++
			j := i
			for j < n && isNameChar(rune(raw[j])) {
				j++
			}
			s.IDs = append(s.IDs, raw[i:j])
			i = j
		default:
			j := i
			for j < n && isNameChar(rune(raw[j])) {
				j++
			}
			s.Tag = strings.ToLower(raw[i:j])
			i = j
		}
	}
	return s, i
}

// true jika tag/class/id
func isNameChar(r rune) bool {
	return unicode.IsLetter(r) || unicode.IsDigit(r) || r == '-' || r == '_'
}