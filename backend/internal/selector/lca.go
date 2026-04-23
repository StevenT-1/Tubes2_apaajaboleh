package selector

import "math/bits"

const maxLog = 17

type LCATable struct {
	up    map[*Node][maxLog]*Node // up[v][k] = ancestor 2^k dari v
	depth map[*Node]int
	nodes []*Node
}

// membangun tabel binary lifting dari root
func BuildLCA(root *Node) *LCATable {
	t := &LCATable{
		up:    make(map[*Node][maxLog]*Node),
		depth: make(map[*Node]int),
	}
	t.dfsPreprocess(root, nil, 0)
	return t
}

func (t *LCATable) dfsPreprocess(node, parent *Node, depth int) {
	t.nodes = append(t.nodes, node)
	t.depth[node] = depth
	var row [maxLog]*Node
	row[0] = parent
	if parent == nil {
		row[0] = node
	}
	// isi ancestor 2^k dari 2^(k-1)
	for k := 1; k < maxLog; k++ {
		prev := row[k-1]
		if prev == nil {
			row[k] = node
		} else {
			if pRow, ok := t.up[prev]; ok {
				row[k] = pRow[k-1]
			} else {
				row[k] = node
			}
		}
	}
	t.up[node] = row
	for _, child := range node.Children {
		t.dfsPreprocess(child, node, depth+1)
	}
}

// mencari lowest common ancestor dari dua node u dan v
func (t *LCATable) LCA(u, v *Node) *Node {
	du, dv := t.depth[u], t.depth[v]
	if du < dv {
		u, v = v, u
		du, dv = dv, du
	}
	diff := du - dv
	for k := 0; k < maxLog; k++ {
		if (diff>>k)&1 == 1 {
			row := t.up[u]
			u = row[k]
		}
	}
	if u == v {
		return u
	}
	for k := maxLog - 1; k >= 0; k-- {
		rowU := t.up[u]
		rowV := t.up[v]
		if rowU[k] != rowV[k] {
			u = rowU[k]
			v = rowV[k]
		}
	}
	return t.up[u][0]
}

// mengembalikan kedalaman node dalam pohon
func (t *LCATable) Depth(node *Node) int {
	return t.depth[node]
}

// mengembalikan jumlah edge antara dua node
func (t *LCATable) PathLength(u, v *Node) int {
	lca := t.LCA(u, v)
	return t.depth[u] + t.depth[v] - 2*t.depth[lca]
}

// helper
func logBase2(n int) int {
	if n <= 0 {
		return 0
	}
	return bits.Len(uint(n)) - 1
}
