package selector

import "testing"

// pencocokan berdasarkan tag
func TestMatcher_Tag(t *testing.T) {
	n := makeNode("div", attr())
	if !Matches(Parse("div"), n) {
		t.Error("div seharusnya cocok dengan selector 'div'")
	}
	if Matches(Parse("span"), n) {
		t.Error("div seharusnya tidak cocok dengan selector 'span'")
	}
}

// pencocokan berdasarkan satu class
func TestMatcher_Class(t *testing.T) {
	n := makeNode("p", attr("class", "intro highlight"))
	if !Matches(Parse(".intro"), n) {
		t.Error("seharusnya cocok dengan .intro")
	}
	if !Matches(Parse(".highlight"), n) {
		t.Error("seharusnya cocok dengan .highlight")
	}
	if Matches(Parse(".missing"), n) {
		t.Error("seharusnya tidak cocok dengan .missing")
	}
}

// pencocokan dengan banyak class sekaligus
func TestMatcher_MultiClass(t *testing.T) {
	n := makeNode("li", attr("class", "item active"))
	if !Matches(Parse(".item.active"), n) {
		t.Error("seharusnya cocok dengan .item.active")
	}
	if Matches(Parse(".item.missing"), n) {
		t.Error("seharusnya tidak cocok dengan .item.missing")
	}
}

// pencocokan berdasarkan ID
func TestMatcher_ID(t *testing.T) {
	n := makeNode("div", attr("id", "main"))
	if !Matches(Parse("#main"), n) {
		t.Error("seharusnya cocok dengan #main")
	}
	if Matches(Parse("#other"), n) {
		t.Error("seharusnya tidak cocok dengan #other")
	}
}

// pencocokan universal selector
func TestMatcher_Universal(t *testing.T) {
	n := makeNode("apapun", attr())
	if !Matches(Parse("*"), n) {
		t.Error("universal selector harus cocok dengan semua elemen")
	}
}

// pencocokan kombinasi tag + class + ID
func TestMatcher_TagClassID_Combined(t *testing.T) {
	dom := buildDOM()
	div := dom.Children[1].Children[0]
	if !Matches(Parse("div#main.container"), div) {
		t.Error("seharusnya cocok dengan div#main.container")
	}
}

// cek combinator child
func TestMatcher_ChildCombinator(t *testing.T) {
	dom := buildDOM()
	h1 := dom.Children[1].Children[0].Children[0]

	if !Matches(Parse("div > h1"), h1) {
		t.Error("h1 seharusnya cocok dengan 'div > h1'")
	}
	if Matches(Parse("body > h1"), h1) {
		t.Error("h1 seharusnya tidak cocok dengan 'body > h1'")
	}
}

// cek combinator descendant
func TestMatcher_DescendantCombinator(t *testing.T) {
	dom := buildDOM()
	li1 := dom.Children[1].Children[0].Children[2].Children[0]

	if !Matches(Parse("div li"), li1) {
		t.Error("li seharusnya cocok dengan 'div li'")
	}
	if !Matches(Parse("body li"), li1) {
		t.Error("li seharusnya cocok dengan 'body li'")
	}
	if !Matches(Parse("html li"), li1) {
		t.Error("li seharusnya cocok dengan 'html li'")
	}
}

// cek combinator adjacent sibling
func TestMatcher_AdjacentSibling(t *testing.T) {
	dom := buildDOM()
	div := dom.Children[1].Children[0]
	p := div.Children[1]
	ul := div.Children[2]

	if !Matches(Parse("h1 + p"), p) {
		t.Error("p seharusnya cocok dengan 'h1 + p'")
	}
	if Matches(Parse("h1 + ul"), ul) {
		t.Error("ul seharusnya tidak cocok dengan 'h1 + ul' karena ada p di antara mereka")
	}
}

// cek combinator general sibling
func TestMatcher_GeneralSibling(t *testing.T) {
	dom := buildDOM()
	div := dom.Children[1].Children[0]
	ul := div.Children[2]

	if !Matches(Parse("h1 ~ ul"), ul) {
		t.Error("ul seharusnya cocok dengan 'h1 ~ ul'")
	}
}

// cek elemen di konteks yang salah tidak ikut cocok
func TestMatcher_NoMatch_WrongContext(t *testing.T) {
	dom := buildDOM()
	a := dom.Children[1].Children[1].Children[0]
	if Matches(Parse("div a"), a) {
		t.Error("a di dalam footer seharusnya tidak cocok dengan 'div a'")
	}
}
