package traversal

type NodeState string

const (
	StateIdle    NodeState = "idle"
	StateVisited NodeState = "visited"
	StateMatched NodeState = "matched"
)

type StepEvent string

const (
	StepVisit StepEvent = "visit"
	StepMatch StepEvent = "match"
)

type Request struct {
	SourceType string `json:"sourceType"`
	Source     string `json:"source"`
	Algorithm  string `json:"algorithm"`
	Selector   string `json:"selector"`
	ResultMode string `json:"resultMode"`
	TopN       int    `json:"topN"`
}

type TreeNode struct {
	ID         string            `json:"id"`
	Type       string            `json:"type"`
	Tag        string            `json:"tag"`
	Text       string            `json:"text,omitempty"`
	Attributes map[string]string `json:"attributes"`
	Children   []*TreeNode       `json:"children"`
	State      NodeState         `json:"state"`
}

type Step struct {
	Number     int               `json:"step"`
	NodeID     string            `json:"nodeId"`
	Type       string            `json:"type"`
	Tag        string            `json:"tag"`
	Text       string            `json:"text,omitempty"`
	Attributes map[string]string `json:"attributes"`
	Depth      int               `json:"depth"`
	Event      StepEvent         `json:"event"`
}

type Result struct {
	Tree         *TreeNode `json:"tree"`
	Steps        []Step    `json:"steps"`
	ElapsedMs    int64     `json:"elapsedMs"`
	NodesVisited int       `json:"nodesVisited"`
	MaxDepth     int       `json:"maxDepth"`
	MatchesFound int       `json:"matchesFound"`
}

type responseNodeInfo struct {
	ID    string
	Depth int
	Tree  *TreeNode
}
