package selector

import "testing"

// test mengunjungi semua node dan universal selector cocok semua
func TestDFS_VisitsAllNodes(t *testing.T) {
	dom := buildDOM()
	total := countNodes(dom)

	result := DFS(dom, Parse("*"), 0)

	if result.VisitedCount != total {
		t.Errorf("DFS harus mengunjungi semua %d node, dikunjungi %d", total, result.VisitedCount)
	}
	if len(result.Matches) != total {
		t.Errorf("DFS dengan '*' harus cocok semua %d node, dapat %d", total, len(result.Matches))
	}
}

// test menemukan semua elemen <li>
func TestDFS_TagSelector(t *testing.T) {
	dom := buildDOM()
	result := DFS(dom, Parse("li"), 0)
	if len(result.Matches) != 3 {
		t.Errorf("diharapkan 3 kecocokan li, dapat %d", len(result.Matches))
	}
}

// test menemukan semua elemen dengan class "item"
func TestDFS_ClassSelector(t *testing.T) {
	dom := buildDOM()
	result := DFS(dom, Parse(".item"), 0)
	if len(result.Matches) != 3 {
		t.Errorf("diharapkan 3 kecocokan .item, dapat %d", len(result.Matches))
	}
}

// test menemukan semua elemen dengan class "active"
func TestDFS_ActiveClassSelector(t *testing.T) {
	dom := buildDOM()
	result := DFS(dom, Parse(".active"), 0)
	if len(result.Matches) != 1 {
		t.Errorf("diharapkan 1 kecocokan .active, dapat %d", len(result.Matches))
	}
	if result.Matches[0].Tag != "li" {
		t.Errorf("diharapkan tag = li, dapat %q", result.Matches[0].Tag)
	}
}

// test menemukan elemen ID
func TestDFS_IDSelector(t *testing.T) {
	dom := buildDOM()
	result := DFS(dom, Parse("#link"), 0)
	if len(result.Matches) != 1 || result.Matches[0].Tag != "a" {
		t.Errorf("diharapkan 1 kecocokan untuk #link (a), dapat %d", len(result.Matches))
	}
}

// test limit
func TestDFS_LimitTopN(t *testing.T) {
	dom := buildDOM()
	result := DFS(dom, Parse("li"), 2)
	if len(result.Matches) != 2 {
		t.Errorf("diharapkan 2 kecocokan dengan limit = 2, dapat %d", len(result.Matches))
	}
}

// test limit = 1
func TestDFS_LimitOne(t *testing.T) {
	dom := buildDOM()
	result := DFS(dom, Parse("li"), 1)
	if len(result.Matches) != 1 {
		t.Errorf("diharapkan 1 kecocokan dengan limit = 1, dapat %d", len(result.Matches))
	}
}

// test parent harus selalu dikunjungi sebelum childnya
func TestDFS_PreOrderProperty(t *testing.T) {
	dom := buildDOM()
	result := DFS(dom, Parse("*"), 0)

	nodeOrder := make(map[*Node]int, len(result.VisitedOrder))
	for i, n := range result.VisitedOrder {
		nodeOrder[n] = i
	}
	for node, idx := range nodeOrder {
		for _, child := range node.Children {
			childIdx, ok := nodeOrder[child]
			if !ok {
				t.Errorf("child %q tidak dikunjungi", child.Tag)
				continue
			}
			if childIdx < idx {
				t.Errorf("urutan DFS rusak: child %q (urutan %d) muncul sebelum parent %q (urutan %d)",
					child.Tag, childIdx, node.Tag, idx)
			}
		}
	}
}

// test root (html) dikunjungi pertama
func TestDFS_RootIsFirstVisited(t *testing.T) {
	dom := buildDOM()
	result := DFS(dom, Parse("*"), 0)
	if len(result.VisitedOrder) == 0 || result.VisitedOrder[0].Tag != "html" {
		t.Error("DFS harus mengunjungi root (html) pertama kali")
	}
}

// test field TraverseOrder diisi dengan benar
func TestDFS_TraverseOrderIsSet(t *testing.T) {
	dom := buildDOM()
	resetFlags(dom)
	result := DFS(dom, Parse("*"), 0)
	for i, n := range result.VisitedOrder {
		if n.TraverseOrder != i+1 {
			t.Errorf("node %q: diharapkan TraverseOrder=%d, dapat %d", n.Tag, i+1, n.TraverseOrder)
		}
	}
}

// test dfs dengan combinator descendant (spasi)
func TestDFS_DescendantSelector(t *testing.T) {
	dom := buildDOM()
	result := DFS(dom, Parse("div li"), 0)
	if len(result.Matches) != 3 {
		t.Errorf("diharapkan 3 kecocokan untuk 'div li', dapat %d", len(result.Matches))
	}
}

// test ketika selector tidak menemukan apapun
func TestDFS_NoMatch(t *testing.T) {
	dom := buildDOM()
	result := DFS(dom, Parse("table"), 0)
	if len(result.Matches) != 0 {
		t.Errorf("diharapkan 0 kecocokan untuk 'table', dapat %d", len(result.Matches))
	}
}

// test dfs dengan combinator child (>)
func TestDFS_ChildCombinator(t *testing.T) {
	dom := buildDOM()
	result := DFS(dom, Parse("div > h1"), 0)
	if len(result.Matches) != 1 {
		t.Errorf("diharapkan 1 kecocokan untuk 'div > h1', dapat %d", len(result.Matches))
	}
}

// bfs dan dfs menemukan jumlah kecocokan yang sama untuk selector yang sama
func TestBFSvsDFS_SameMatches(t *testing.T) {
	selectors := []string{"li", ".item", "#main", "div li", "h1 + p", "h1 ~ ul", "*"}

	for _, raw := range selectors {
		dom1 := buildDOM()
		dom2 := buildDOM()
		sel := Parse(raw)

		bfsResult := BFS(dom1, sel, 0)
		dfsResult := DFS(dom2, sel, 0)

		if len(bfsResult.Matches) != len(dfsResult.Matches) {
			t.Errorf("selector %q: BFS menemukan %d kecocokan, DFS menemukan %d",
				raw, len(bfsResult.Matches), len(dfsResult.Matches))
		}
	}
}
