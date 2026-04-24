import { useEffect, useRef, useState } from "react";
import InputForm, { type TraversalConfig } from "./components/InputForm";
import DOMTreeViewer from "./components/DOMTreeViewer";
import TraversalLog, { type TraversalStep } from "./components/TraversalLog";
import {
  findDOMNodeById,
  formatDOMNodeLabel,
  type DOMNode,
} from "./components/DOMTreeType";
import { TRAVERSAL_ALGORITHMS, type TraversalAlgorithm } from "./traversalTypes";
import "./App.css";
import bannerVideo from "./assets/nick-wilde-zootopia-2.mp4";

type AppState = "idle" | "loading" | "result" | "error";
type LCAStatus = "idle" | "loading" | "success" | "error";

const API_ENDPOINTS = {
  TRAVERSE: "/api/traverse",
  LCA: "/api/lca",
} as const;

interface TraversalResult {
  tree: DOMNode;
  steps: TraversalStep[];
  elapsedMs: number;
  nodesVisited: number;
  maxDepth: number;
  matchesFound: number;
}

interface LCAResponse {
  nodeAId: string;
  nodeBId: string;
  lcaId: string;
  lcaLabel?: string;
  distance?: number;
  pathA?: string[];
  pathB?: string[];
}

function formatNodeMatchSummary(step: TraversalStep): string {
  return Object.entries(step.attributes ?? {})
    .filter(([key]) => key === "id" || key === "class")
    .map(([key, value]) => (key === "id" ? `#${value}` : `.${value.split(" ").join(".")}`))
    .join(" ");
}

function formatAlgorithmLabel(algorithm: TraversalAlgorithm): string {
  if (algorithm === TRAVERSAL_ALGORITHMS.BFS_PARALLEL) return "BFS Parallel";
  return algorithm.toUpperCase();
}

function formatSelectedNodeLabel(node: DOMNode | null): string {
  if (!node) return "(belum dipilih)";
  return formatDOMNodeLabel(node);
}

function getLCASelectionHint(
  selectedNodeAId: string,
  selectedNodeBId: string,
  hasResult: boolean,
): string {
  if (!selectedNodeAId) {
    return "Klik node pertama untuk memilih A.";
  }
  if (!selectedNodeBId) {
    return "Klik node kedua untuk memilih B.";
  }
  if (!hasResult) {
    return "Klik Find LCA untuk mencari lowest common ancestor.";
  }
  return "Klik node ketiga untuk memulai ulang dari A baru.";
}

function getLCASelectionStage(
  selectedNodeAId: string,
  selectedNodeBId: string,
  hasResult: boolean,
): string {
  if (!selectedNodeAId) {
    return "Menunggu A";
  }
  if (!selectedNodeBId) {
    return "Menunggu B";
  }
  if (!hasResult) {
    return "Siap cari LCA";
  }
  return "LCA ditemukan";
}

export default function App() {
  const [appState, setAppState] = useState<AppState>("idle");
  const [result, setResult] = useState<TraversalResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [lastConfig, setLastConfig] = useState<TraversalConfig | null>(null);
  const [selectedNodeAId, setSelectedNodeAId] = useState("");
  const [selectedNodeBId, setSelectedNodeBId] = useState("");
  const [lcaResult, setLcaResult] = useState<LCAResponse | null>(null);
  const [lcaStatus, setLcaStatus] = useState<LCAStatus>("idle");
  const [lcaMessage, setLcaMessage] = useState("");
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (appState === "result" && resultsRef.current) {
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [appState]);

  async function handleSubmit(config: TraversalConfig) {
    setAppState("loading");
    setLastConfig(config);
    setResult(null);
    setErrorMsg("");
    resetLCASelection();

    try {
      const response = await fetch(API_ENDPOINTS.TRAVERSE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        const err = await response
          .json()
          .catch(() => ({ message: "Terjadi kesalahan pada server." }));
        throw new Error(err.message ?? `HTTP ${response.status}`);
      }

      const data: TraversalResult = await response.json();
      setResult(data);
      setAppState("result");
    } catch (error) {
      setErrorMsg(
        error instanceof Error ? error.message : "Terjadi kesalahan tidak diketahui.",
      );
      setAppState("error");
    }
  }

  function resetLCASelection() {
    setSelectedNodeAId("");
    setSelectedNodeBId("");
    setLcaResult(null);
    setLcaStatus("idle");
    setLcaMessage("");
  }

  function handleSelectNodeForLCA(nodeId: string) {
    setLcaResult(null);
    setLcaStatus("idle");
    setLcaMessage("");

    if (!selectedNodeAId || selectedNodeBId) {
      setSelectedNodeAId(nodeId);
      setSelectedNodeBId("");
      return;
    }

    if (selectedNodeAId === nodeId) {
      setLcaMessage("Pilih node elemen kedua yang berbeda.");
      return;
    }

    setSelectedNodeBId(nodeId);
  }

  function handleNonElementNodeClick() {
    setLcaMessage("Hanya element node yang bisa dipilih untuk LCA.");
  }

  async function requestLCA() {
    if (!lastConfig || !selectedNodeAId || !selectedNodeBId) return;

    setLcaStatus("loading");
    setLcaMessage("");

    const sourcePayload =
      lastConfig.sourceType === "html"
        ? { html: lastConfig.source }
        : { url: lastConfig.source };

    try {
      const response = await fetch(API_ENDPOINTS.LCA, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceType: lastConfig.sourceType,
          nodeAId: selectedNodeAId,
          nodeBId: selectedNodeBId,
          ...sourcePayload,
        }),
      });

      if (!response.ok) {
        const err = await response
          .json()
          .catch(() => ({ message: "Gagal menghitung LCA." }));
        throw new Error(err.message ?? `HTTP ${response.status}`);
      }

      const data: LCAResponse = await response.json();
      setLcaResult(data);
      setLcaStatus("success");
    } catch (error) {
      setLcaMessage(
        error instanceof Error ? error.message : "Terjadi kesalahan saat menghitung LCA.",
      );
      setLcaStatus("error");
    }
  }

  const matchedElements = result?.steps.filter((s) => s.event === "match") ?? [];
  const selectedNodeA = result ? findDOMNodeById(result.tree, selectedNodeAId) : null;
  const selectedNodeB = result ? findDOMNodeById(result.tree, selectedNodeBId) : null;
  const lcaNode = result ? findDOMNodeById(result.tree, lcaResult?.lcaId) : null;
  const canFindLCA = Boolean(selectedNodeAId && selectedNodeBId && lcaStatus !== "loading");
  const lcaSelectionHint = getLCASelectionHint(selectedNodeAId, selectedNodeBId, Boolean(lcaResult));
  const lcaSelectionStage = getLCASelectionStage(selectedNodeAId, selectedNodeBId, Boolean(lcaResult));

  return (
    <div className="site-wrap">
      {/* HEADER  */}
      <header className="site-header">
        <div className="container">
          <div className="header-inner">
            <div className="header-brand">
              <div className="brand-name">apaajaboleh</div>
            </div>
            <nav className="header-nav">
              <span className="header-nav-item">Tugas Besar 2</span>
              <span className="header-nav-item">IF2211 · ITB · 2026</span>
            </nav>
          </div>
        </div>
      </header>

      {/* ── HERO MEDIA BANNER ───────────────────────────────────────── */}
      <section className="hero-image-section">
        <video
          className="hero-media"
          src={bannerVideo}
          autoPlay
          loop
          muted
          playsInline
        />
      </section>

      {/* ── PAGE BODY ──────────────────────────────────────────────── */}
      <main className="site-main">
        <div className="container">

          {/* ── MAIN TOOL GRID ── */}
          <div className="tool-grid">

            {/* LEFT: Input Form Sidebar */}
            <div className="tool-form-col">
              <div className="sidebar-header">
                <h2 className="sidebar-title">Configuration</h2>
                <p className="sidebar-subtitle">DOM Traversal Tool</p>
              </div>
              <div className="card-body">
                <InputForm onSubmit={handleSubmit} isLoading={appState === "loading"} />
              </div>
            </div>

            {/* RIGHT: Content Area */}
            <div className="tool-content-col">
              
              {/* IDLE STATE */}
              {appState === "idle" && (
                <div className="state-card">
                  <div className="empty-illo">
                    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                      <rect x="24" y="4" width="16" height="16" stroke="#5c7a52" strokeWidth="2" fill="#e8ede4" />
                      <rect x="6" y="40" width="16" height="16" stroke="#5c7a52" strokeWidth="2" fill="#e8ede4" />
                      <rect x="42" y="40" width="16" height="16" stroke="#5c7a52" strokeWidth="2" fill="#e8ede4" />
                      <line x1="32" y1="20" x2="14" y2="40" stroke="#5c7a52" strokeWidth="1.5" strokeDasharray="4 3" />
                      <line x1="32" y1="20" x2="50" y2="40" stroke="#5c7a52" strokeWidth="1.5" strokeDasharray="4 3" />
                    </svg>
                  </div>
                  <h3 className="state-title">Siap untuk penelusuran</h3>
                  <p className="state-desc">Isi form di sebelah kiri, lalu klik "Mulai Penelusuran" untuk memulai.</p>
                </div>
              )}

              {/* LOADING STATE */}
              {appState === "loading" && (
                <div className="state-card">
                  <div className="loading-anim">
                    <div className="loading-ring-lg" />
                  </div>
                  <h3 className="state-title">Memproses...</h3>
                  {lastConfig && (
                    <div className="loading-meta">
                      <span className="pill pill-accent">{formatAlgorithmLabel(lastConfig.algorithm)}</span>
                      <code className="selector-code">{lastConfig.selector}</code>
                    </div>
                  )}
                </div>
              )}

              {/* ERROR STATE */}
              {appState === "error" && (
                <div className="state-card">
                  <div className="error-icon-wrap">⚠</div>
                  <h3 className="state-title" style={{ color: "#c0392b" }}>Traversal gagal</h3>
                  <p className="state-desc">{errorMsg}</p>
                  <button className="btn-secondary mt-4" onClick={() => setAppState("idle")}>
                    ← Coba lagi
                  </button>
                </div>
              )}

              {/* RESULT STATE */}
              {appState === "result" && result && lastConfig && (
                <div ref={resultsRef} className="result-layout animate-fade-in">
                  
                  {/* 1. Top Stat Cards */}
                  <div className="top-stats-grid">
                    <div className="stat-card">
                      <span className="stat-label">NODES VISITED</span>
                      <span className="stat-value">{result.nodesVisited}</span>
                    </div>
                    <div className="stat-card">
                      <span className="stat-label">TIME ELAPSED</span>
                      <span className="stat-value">{result.elapsedMs}ms</span>
                    </div>
                    <div className="stat-card">
                      <span className="stat-label">MAX DEPTH</span>
                      <span className="stat-value">{result.maxDepth}</span>
                    </div>
                    <div className="stat-card">
                      <span className="stat-label">MATCHES FOUND</span>
                      <span className="stat-value text-green-700">{result.matchesFound}</span>
                    </div>
                  </div>

                  {/* 2. DOM Tree Section */}
                  <div className="content-section">
                    <div className="section-header">
                      <h3 className="section-title">DOM Tree Visualization</h3>
                      <div className="section-meta">
                        <span className="pill pill-accent">{formatAlgorithmLabel(lastConfig.algorithm)}</span>
                        <code className="selector-code">{lastConfig.selector}</code>
                      </div>
                    </div>
                      <div className="tree-hint-bar">
                      <span className="tree-hint-label">Panduan LCA</span>
                      <span className="tree-hint-text">{lcaSelectionHint}</span>
                      <span className="tree-hint-stage">{lcaSelectionStage}</span>
                    </div>
                    <div className="tree-container">
                      <DOMTreeViewer
                        root={result.tree}
                        elapsedMs={result.elapsedMs}
                        nodesVisited={result.nodesVisited}
                        matchesFound={result.matchesFound}
                        maxDepth={result.maxDepth}
                        selectedAId={selectedNodeAId}
                        selectedBId={selectedNodeBId}
                        lcaId={lcaResult?.lcaId}
                        onElementNodeClick={handleSelectNodeForLCA}
                        onNonElementNodeClick={handleNonElementNodeClick}
                      />
                    </div>
                    <div className="lca-panel">
                      <div className="lca-panel-header">
                        <div>
                          <h4 className="lca-title">LCA Finder</h4>
                          <div className="lca-flow-list">
                            <p className="lca-flow-step">1. Klik node pertama untuk memilih A.</p>
                            <p className="lca-flow-step">2. Klik node kedua untuk memilih B.</p>
                            <p className="lca-flow-step">3. Klik Find LCA untuk mencari lowest common ancestor.</p>
                          </div>
                          <p className="lca-instruction">
                            Klik node ketiga untuk memulai ulang dari A baru. Text node diabaikan.
                          </p>
                        </div>
                        <div className="lca-actions">
                          <button
                            type="button"
                            onClick={requestLCA}
                            disabled={!canFindLCA}
                            className="text-xs px-3 py-1 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {lcaStatus === "loading" ? "Mencari..." : "Find LCA"}
                          </button>
                          <button
                            type="button"
                            onClick={resetLCASelection}
                            className="text-xs px-3 py-1 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 transition-colors"
                          >
                            Clear
                          </button>
                        </div>
                      </div>

                      <div className="lca-selection-grid">
                        <div className="lca-selection-card">
                          <div className="lca-selection-header">
                            <span className="lca-badge lca-badge-a">A</span>
                            <span className="lca-selection-title">Node pertama</span>
                          </div>
                          <p className="lca-selection-value">{formatSelectedNodeLabel(selectedNodeA)}</p>
                        </div>
                        <div className="lca-selection-card">
                          <div className="lca-selection-header">
                            <span className="lca-badge lca-badge-b">B</span>
                            <span className="lca-selection-title">Node kedua</span>
                          </div>
                          <p className="lca-selection-value">{formatSelectedNodeLabel(selectedNodeB)}</p>
                        </div>
                      </div>

                      <div className="lca-result-card">
                        <div className="lca-selection-header">
                          <span className="lca-badge lca-badge-lca">LCA</span>
                          <span className="lca-selection-title">Hasil lowest common ancestor</span>
                        </div>
                        <p className="lca-result-value">
                          {lcaResult ? (lcaResult.lcaLabel ?? formatSelectedNodeLabel(lcaNode)) : "Belum dihitung."}
                        </p>
                        <p className="lca-result-meta">
                          {lcaResult ? `Node ID: ${lcaResult.lcaId}` : "Node ID akan muncul setelah hasil ditemukan."}
                        </p>
                        {lcaResult && (
                          <p className="lca-message">
                            Distance: {lcaResult.distance ?? 0} edge(s)
                          </p>
                        )}
                      </div>

                      {lcaMessage && (
                        <p className={`lca-message ${lcaStatus === "error" ? "lca-message-error" : ""}`}>
                          {lcaMessage}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 3. Traversal Results (Matched + Log) */}
                  <div className="content-section">
                    <div className="section-header">
                      <h3 className="section-title">Traversal Results</h3>
                      <p className="section-subtitle">
                        Found {result.matchesFound} matching elements in {result.steps.length} steps.
                      </p>
                    </div>
                    
                    <div className="traversal-results-grid">
                      {/* Left: Matched Elements */}
                      <div className="matched-elements-col">
                        <div className="matched-header">
                          <span className="matched-title">Matched Elements</span>
                          <span className="matched-badge">{result.matchesFound} found</span>
                        </div>
                        
                        {matchedElements.length === 0 ? (
                          <div className="no-matches">Tidak ada elemen yang cocok.</div>
                        ) : (
                          <div className="matched-list">
                            {matchedElements.map((s) => {
                              const attrs = formatNodeMatchSummary(s);
                              return (
                                <div key={s.step} className="matched-item">
                                  <div className="matched-item-header">
                                    <span className="matched-order">{s.step}</span>
                                    <span className="matched-tag">&lt;{s.tag ?? "node"}&gt;</span>
                                    <span className="matched-depth">Depth: {s.depth}</span>
                                  </div>
                                  {attrs && <div className="matched-attrs">{attrs}</div>}
                                  <div className="matched-node-id">Node ID: {s.nodeId}</div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Right: Detailed Traversal Log */}
                      <div className="traversal-log-col">
                         <TraversalLog
                            steps={result.steps}
                            algorithm={lastConfig.algorithm}
                            selector={lastConfig.selector}
                            nodesVisited={result.nodesVisited}
                            matchesFound={result.matchesFound}
                          />
                      </div>
                    </div>
                  </div>

                </div>
              )}

            </div>
          </div>
        </div>
      </main>

      {/*  FOOTER  */}
      <footer className="site-footer">
        <div className="container">
          <p>
            Tugas Besar 2 · IF2211 Strategi Algoritma · apaajaboleh · Institut Teknologi Bandung · 2026
          </p>
        </div>
      </footer>

    </div>
  );
}
