package selector

import "testing"

// memastikan parser membaca tag selector dengan benar
func TestParse_Tag(t *testing.T) {
	sel := Parse("div")
	if len(sel) != 1 {
		t.Fatalf("diharapkan 1 bagian, dapat %d", len(sel))
	}
	if sel[0].Simple.Tag != "div" {
		t.Errorf("diharapkan tag = div, dapat %q", sel[0].Simple.Tag)
	}
}

// memastikan parser membaca class selector dengan benar
func TestParse_Class(t *testing.T) {
	sel := Parse(".box")
	if len(sel) != 1 || len(sel[0].Simple.Classes) != 1 || sel[0].Simple.Classes[0] != "box" {
		t.Errorf("hasil parse tidak sesuai: %+v", sel)
	}
}

// memastikan parser membaca ID selector dengan benar
func TestParse_ID(t *testing.T) {
	sel := Parse("#header")
	if len(sel) != 1 || len(sel[0].Simple.IDs) != 1 || sel[0].Simple.IDs[0] != "header" {
		t.Errorf("hasil parse tidak sesuai: %+v", sel)
	}
}

// memastikan parser membaca universal selector dengan benar
func TestParse_Universal(t *testing.T) {
	sel := Parse("*")
	if len(sel) != 1 || !sel[0].Simple.Universal {
		t.Errorf("diharapkan universal selector, dapat: %+v", sel)
	}
}

// memastikan parser membaca kombinasi tag+class dengan benar
func TestParse_TagAndClass(t *testing.T) {
	sel := Parse("p.intro")
	if len(sel) != 1 {
		t.Fatalf("diharapkan 1 bagian, dapat %d", len(sel))
	}
	s := sel[0].Simple
	if s.Tag != "p" || len(s.Classes) != 1 || s.Classes[0] != "intro" {
		t.Errorf("hasil parse tidak sesuai: %+v", s)
	}
}

// memastikan parser membaca kombinasi tag+class+id dengan benar
func TestParse_TagClassID(t *testing.T) {
	sel := Parse("div#main.container")
	if len(sel) != 1 {
		t.Fatalf("diharapkan 1 bagian, dapat %d", len(sel))
	}
	s := sel[0].Simple
	if s.Tag != "div" {
		t.Errorf("diharapkan tag = div, dapat %q", s.Tag)
	}
	if len(s.IDs) != 1 || s.IDs[0] != "main" {
		t.Errorf("diharapkan id = main, dapat %v", s.IDs)
	}
	if len(s.Classes) != 1 || s.Classes[0] != "container" {
		t.Errorf("diharapkan class = container, dapat %v", s.Classes)
	}
}

// memastikan parser mengenali combinator descendant
func TestParse_DescendantCombinator(t *testing.T) {
	sel := Parse("div p")
	if len(sel) != 2 {
		t.Fatalf("diharapkan 2 bagian, dapat %d", len(sel))
	}
	if sel[1].Combinator != CombDescendant {
		t.Errorf("diharapkan combinator descendant, dapat %v", sel[1].Combinator)
	}
}

// memastikan parser mengenali combinator child
func TestParse_ChildCombinator(t *testing.T) {
	sel := Parse("ul > li")
	if len(sel) != 2 || sel[1].Combinator != CombChild {
		t.Errorf("hasil parse tidak sesuai: %+v", sel)
	}
}

// memastikan parser mengenali combinator adjacent
func TestParse_AdjacentCombinator(t *testing.T) {
	sel := Parse("h1 + p")
	if len(sel) != 2 || sel[1].Combinator != CombAdjacent {
		t.Errorf("hasil parse tidak sesuai: %+v", sel)
	}
}

// memastikan parser mengenali combinator general sibling
func TestParse_GeneralSiblingCombinator(t *testing.T) {
	sel := Parse("h1 ~ p")
	if len(sel) != 2 || sel[1].Combinator != CombSibling {
		t.Errorf("hasil parse tidak sesuai: %+v", sel)
	}
}

// memastikan string kosong menghasilkan nil
func TestParse_EmptyString(t *testing.T) {
	sel := Parse("")
	if sel != nil {
		t.Errorf("string kosong harus menghasilkan nil, dapat %+v", sel)
	}
}
