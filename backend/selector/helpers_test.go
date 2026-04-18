package selector

// membangun node dengan tag, atribut, dan children tertentu
func makeNode(tag string, attrs map[string]string, children ...*Node) *Node {
	n := &Node{
		Tag: tag,
		Attributes: attrs,
	}
	for _, c := range children {
		c.Parent = n
		n.Children = append(n.Children, c)
	}
	return n
}

func attr(pairs ...string) map[string]string {
	m := map[string]string{}
	for i := 0; i+1 < len(pairs); i += 2 {
		m[pairs[i]] = pairs[i+1]
	}
	return m
}

// dummy pohon DOM buat testing
func buildDOM() *Node {
	li1 := makeNode("li", attr("class", "item"))
	li2 := makeNode("li", attr("class", "item active"))
	li3 := makeNode("li", attr("class", "item"))
	ul := makeNode("ul", attr(), li1, li2, li3)
	h1 := makeNode("h1", attr("class", "title"))
	p := makeNode("p", attr("class", "intro"))
	div := makeNode("div", attr("id", "main", "class", "container"), h1, p, ul)
	a := makeNode("a", attr("id", "link"))
	footer := makeNode("footer", attr(), a)
	title := makeNode("title", attr())
	head := makeNode("head", attr(), title)
	body := makeNode("body", attr(), div, footer)
	html := makeNode("html", attr(), head, body)
	setDepths(html, 0)
	return html
}

func setDepths(n *Node, depth int) {
	n.Depth = depth
	for _, c := range n.Children {
		setDepths(c, depth+1)
	}
}

func resetFlags(root *Node) {
	root.Visited = false
	root.Matched = false
	root.TraverseOrder = 0
	for _, c := range root.Children {
		resetFlags(c)
	}
}

func countNodes(root *Node) int {
	count := 1
	for _, c := range root.Children {
		count += countNodes(c)
	}
	return count
}