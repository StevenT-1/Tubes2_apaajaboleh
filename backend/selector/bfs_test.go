package selector

import "testing"

// test mengunjungi semua node dan universal selector cocok semua
func TestBFS_VisitsAllNodes(t *testing.T) {
	dom := buildDOM()
	total := countNodes(dom)

	result := BFS(dom, Parse("*"), 0)

	if result.VisitedCount != total {
		t.Errorf("BFS harus mengunjungi semua %d node, dikunjungi %d", total, result.VisitedCount)
	}
	if len(result.Matches) != total {
		t.Errorf("BFS dengan '*' harus cocok semua %d node, dapat %d", total, len(result.Matches))
	}
}

// test menemukan semua <li>
func TestBFS_TagSelector(t *testing.T) {
	dom := buildDOM()
	result := BFS(dom, Parse("li"), 0)
	if len(result.Matches) != 3 {
		t.Errorf("diharapkan 3 kecocokan li, dapat %d", len(result.Matches))
	}
}

// test menemukan semua elemen dengan class "item"
func TestBFS_ClassSelector(t *testing.T) {
	dom := buildDOM()
	result := BFS(dom, Parse(".item"), 0)
	if len(result.Matches) != 3 {
		t.Errorf("diharapkan 3 kecocokan .item, dapat %d", len(result.Matches))
	}
}

// test menemukan semua elemen dengan class "active"
func TestBFS_ActiveClassSelector(t *testing.T) {
	dom := buildDOM()
	result := BFS(dom, Parse(".active"), 0)
	if len(result.Matches) != 1 {
		t.Errorf("diharapkan 1 kecocokan .active, dapat %d", len(result.Matches))
	}
	if result.Matches[0].Tag != "li" {
		t.Errorf("diharapkan tag = li, dapat %q", result.Matches[0].Tag)
	}
}

// test menemukan elemen ID
func TestBFS_IDSelector(t *testing.T) {
	dom := buildDOM()
	result := BFS(dom, Parse("#link"), 0)
	if len(result.Matches) != 1 || result.Matches[0].Tag != "a" {
		t.Errorf("diharapkan 1 kecocokan untuk #link (a), dapat %d", len(result.Matches))
	}
}

// test limit
func TestBFS_LimitTopN(t *testing.T) {
	dom := buildDOM()
	result := BFS(dom, Parse("li"), 2)
	if len(result.Matches) != 2 {
		t.Errorf("diharapkan 2 kecocokan dengan limit = 2, dapat %d", len(result.Matches))
	}
}

// test limit = 1
func TestBFS_LimitOne(t *testing.T) {
	dom := buildDOM()
	result := BFS(dom, Parse("li"), 1)
	if len(result.Matches) != 1 {
		t.Errorf("diharapkan 1 kecocokan dengan limit = 1, dapat %d", len(result.Matches))
	}
}

// test node di level dangkal dikunjungi dulu
func TestBFS_LevelOrderProperty(t *testing.T) {
	dom := buildDOM()
	result := BFS(dom, Parse("*"), 0)

	for i := 1; i < len(result.VisitedOrder); i++ {
		prev := result.VisitedOrder[i-1]
		curr := result.VisitedOrder[i]
		if curr.Depth < prev.Depth {
			t.Errorf("urutan BFS rusak: node kedalaman %d muncul setelah node kedalaman %d",
				curr.Depth, prev.Depth)
		}
	}
}

// test root (html) dikunjungi pertama
func TestBFS_RootIsFirstVisited(t *testing.T) {
	dom := buildDOM()
	result := BFS(dom, Parse("*"), 0)
	if len(result.VisitedOrder) == 0 || result.VisitedOrder[0].Tag != "html" {
		t.Error("BFS harus mengunjungi root (html) pertama kali")
	}
}

// test field TraverseOrder diisi dengan benar
func TestBFS_TraverseOrderIsSet(t *testing.T) {
	dom := buildDOM()
	resetFlags(dom)
	result := BFS(dom, Parse("*"), 0)
	for i, n := range result.VisitedOrder {
		if n.TraverseOrder != i+1 {
			t.Errorf("node %q: diharapkan TraverseOrder=%d, dapat %d", n.Tag, i+1, n.TraverseOrder)
		}
	}
}

// test bfs dengan combinator descendant (spasi)
func TestBFS_DescendantSelector(t *testing.T) {
	dom := buildDOM()
	result := BFS(dom, Parse("div li"), 0)
	if len(result.Matches) != 3 {
		t.Errorf("diharapkan 3 kecocokan untuk 'div li', dapat %d", len(result.Matches))
	}
}

// test ketika selector tidak menemukan apapun
func TestBFS_NoMatch(t *testing.T) {
	dom := buildDOM()
	result := BFS(dom, Parse("table"), 0)
	if len(result.Matches) != 0 {
		t.Errorf("diharapkan 0 kecocokan untuk 'table', dapat %d", len(result.Matches))
	}
}
