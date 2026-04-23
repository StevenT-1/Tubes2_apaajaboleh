package traversal

import (
	"context"
	"fmt"
	"strings"
	"time"

	"tubes2/backend/internal/scraper"
)

func normalizeRequest(request Request) (Request, int, error) {
	normalized := Request{
		SourceType: strings.ToLower(strings.TrimSpace(request.SourceType)),
		Source:     strings.TrimSpace(request.Source),
		Algorithm:  strings.ToUpper(strings.TrimSpace(request.Algorithm)),
		Selector:   strings.TrimSpace(request.Selector),
		ResultMode: strings.ToLower(strings.TrimSpace(request.ResultMode)),
		TopN:       request.TopN,
	}

	if normalized.SourceType != "url" && normalized.SourceType != "html" {
		return Request{}, 0, fmt.Errorf("sourceType must be url or html")
	}
	if normalized.Source == "" {
		return Request{}, 0, fmt.Errorf("source must not be empty")
	}
	if normalized.Algorithm != "BFS" && normalized.Algorithm != "DFS" {
		return Request{}, 0, fmt.Errorf("algorithm must be bfs or dfs")
	}
	if normalized.Selector == "" {
		return Request{}, 0, fmt.Errorf("selector must not be empty")
	}

	switch normalized.ResultMode {
	case "", "all":
		normalized.ResultMode = "all"
		return normalized, 0, nil
	case "topn":
		if normalized.TopN <= 0 {
			return Request{}, 0, fmt.Errorf("topN must be > 0 when resultMode is topn")
		}
		return normalized, normalized.TopN, nil
	default:
		return Request{}, 0, fmt.Errorf("resultMode must be all or topn")
	}
}

func loadSourceHTML(ctx context.Context, request Request) (string, error) {
	if request.SourceType == "html" {
		return request.Source, nil
	}

	return scraper.FetchHTML(ctx, request.Source, 15*time.Second)
}
