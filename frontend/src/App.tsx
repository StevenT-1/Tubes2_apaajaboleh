import { useEffect, useMemo, useRef, useState } from "react";
import InputForm, { type TraversalConfig } from "./components/InputForm";
import DOMTreeViewer from "./components/DOMTreeViewer";
import TraversalLog, { type TraversalStep } from "./components/TraversalLog";
import type { DOMNode } from "./components/DOMTreeType";
import "./App.css";
import bannerVideo from "./assets/nick-wilde-zootopia-2.mp4";

type AppState = "idle" | "loading" | "result" | "error";
type AnimState = "idle" | "playing" | "paused" | "done";

interface TraversalResult {
  tree: DOMNode;
  steps: TraversalStep[];
  elapsedMs: number;
  nodesVisited: number;
  maxDepth: number;
  matchesFound: number;
}

//  Rebuild tree dengan state animasi 

function resetTree(node: DOMNode): DOMNode {
  return { ...node, state: "idle", children: (node.children ?? []).map(resetTree) };
}

/** Set state node tertentu berdasarkan map {nodeId -> state} */
function applyStates(
  node: DOMNode,
  stateMap: Map<string, DOMNode["state"]>
): DOMNode {
  return {
    ...node,
    state: stateMap.get(node.id) ?? "idle",
    children: (node.children ?? []).map((c) => applyStates(c, stateMap)),
  };
}

const ANIM_DELAY_MS = 500;

// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  const [appState, setAppState] = useState<AppState>("idle");
  const [result, setResult] = useState<TraversalResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [lastConfig, setLastConfig] = useState<TraversalConfig | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // ── Animasi state ──
  const [animState, setAnimState] = useState<AnimState>("idle");
  const [animStepIdx, setAnimStepIdx] = useState(0);
  const animIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (appState === "result" && resultsRef.current) {
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [appState]);

  // Reset animasi saat result baru
  useEffect(() => {
    if (result) {
      clearAnimInterval();
      setAnimState("idle");
      setAnimStepIdx(0);
    }
  }, [result]);

  useEffect(() => {
    if (animState !== "playing" || !result) return;

    animIntervalRef.current = setInterval(() => {
      setAnimStepIdx((prev) => {
        if (prev >= result.steps.length) return prev;
        return prev + 1;
      });
    }, ANIM_DELAY_MS);

    return () => clearAnimInterval();
  }, [animState, result]);

  useEffect(() => {
    if (animState === "playing" && result && animStepIdx >= result.steps.length) {
      clearAnimInterval();
      setAnimState("done");
    }
  }, [animStepIdx, animState, result]);

  function clearAnimInterval() {
    if (animIntervalRef.current) {
      clearInterval(animIntervalRef.current);
      animIntervalRef.current = null;
    }
  }

  const animatedTree = useMemo(() => {
    if (!result || animState === "idle") return null;
    const upTo = Math.min(animStepIdx, result.steps.length);
    const stateMap = new Map<string, DOMNode["state"]>();
    for (let i = 0; i < upTo - 1; i++) {
      const s = result.steps[i];
      stateMap.set(s.nodeId, s.event === "match" ? "matched" : s.event === "visit" ? "visited" : "idle");
    }
    if (upTo > 0) stateMap.set(result.steps[upTo - 1].nodeId, "active");
    return applyStates(resetTree(result.tree), stateMap);
  }, [result, animStepIdx, animState]);

  function handlePlayAnimation() {
    if (!result) return;
    if (animState === "idle" || animState === "done") setAnimStepIdx(0);
    setAnimState("playing");
  }

  function handlePauseAnimation() {
    clearAnimInterval();
    setAnimState("paused");
  }

  function handleResetAnimation() {
    clearAnimInterval();
    setAnimState("idle");
    setAnimStepIdx(0);
  }

  useEffect(() => () => clearAnimInterval(), []);

  async function handleSubmit(config: TraversalConfig) {
    setAppState("loading");
    setLastConfig(config);
    setResult(null);
    setErrorMsg("");
    handleResetAnimation();

    try {
      let data: TraversalResult;

      const response = await fetch("/api/traverse", {
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

      data = await response.json();

      setResult(data);
      setAppState("result");
    } catch (error) {
      setErrorMsg(
        error instanceof Error ? error.message : "Terjadi kesalahan tidak diketahui.",
      );
      setAppState("error");
    }
  }

  const matchedElements = result?.steps.filter((s) => s.event === "match") ?? [];

  const displayTree = (animState !== "idle" && animatedTree) ? animatedTree : result?.tree ?? null;
  const activeNodeId =
    (animState === "playing" || animState === "paused") && result && animStepIdx > 0 && animStepIdx <= result.steps.length
      ? result.steps[animStepIdx - 1]?.nodeId
      : undefined;

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

      {/* PAGE BODY  */}
      <main className="site-main">
        <div className="container">

          {/* MAIN TOOL GRID */}
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
                      <span className="pill pill-accent">{lastConfig.algorithm.toUpperCase()}</span>
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
              {appState === "result" && result && lastConfig && displayTree && (
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
                        <span className="pill pill-accent">{lastConfig.algorithm.toUpperCase()}</span>
                        <code className="selector-code">{lastConfig.selector}</code>
                      </div>
                    </div>

                    {/* ── ANIMATION CONTROLS ── */}
                    <div className="anim-controls">
                      <div className="anim-controls-left">
                        {/* Play / Resume */}
                        {(animState === "idle" || animState === "paused" || animState === "done") && (
                          <button className="anim-btn anim-btn-play" onClick={handlePlayAnimation}>
                            <span className="anim-btn-icon">▶</span>
                            {animState === "idle" ? "Putar Animasi" : animState === "done" ? "Ulangi" : "Lanjutkan"}
                          </button>
                        )}
                        {/* Pause */}
                        {animState === "playing" && (
                          <button className="anim-btn anim-btn-pause" onClick={handlePauseAnimation}>
                            <span className="anim-btn-icon">⏸</span>
                            Pause
                          </button>
                        )}
                        {/* Reset */}
                        {animState !== "idle" && (
                          <button className="anim-btn anim-btn-reset" onClick={handleResetAnimation}>
                            <span className="anim-btn-icon">↺</span>
                            Reset
                          </button>
                        )}
                        {/* Status badge */}
                        {animState === "playing" && (
                          <span className="anim-status-badge anim-status-playing">
                            <span className="anim-status-dot" />
                            Animasi berjalan...
                          </span>
                        )}
                        {animState === "paused" && (
                          <span className="anim-status-badge anim-status-paused">
                            ⏸ Dijeda
                          </span>
                        )}
                        {animState === "done" && (
                          <span className="anim-status-badge anim-status-done">
                            ✓ Selesai
                          </span>
                        )}
                      </div>
                      {/* Progress */}
                      {animState !== "idle" && (
                        <div className="anim-controls-right">
                          <span className="anim-step-label">
                            {Math.max(0, animStepIdx)} / {result.steps.length}
                          </span>
                          <div className="anim-progress-track">
                            <div
                              className="anim-progress-fill"
                              style={{
                                width: `${(Math.max(0, animStepIdx) / result.steps.length) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="tree-container">
                      <DOMTreeViewer
                        root={displayTree}
                        elapsedMs={result.elapsedMs}
                        animHighlightId={activeNodeId}
                      />
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
                              const attrs = Object.entries(s.attributes ?? {})
                                .filter(([k]) => k === "id" || k === "class")
                                .map(([k, v]) => (k === "id" ? `#${v}` : `.${v.split(" ").join(".")}`))
                                .join(" ");
                              return (
                                <div key={s.step} className="matched-item">
                                  <div className="matched-item-header">
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
                            activeStep={animState !== "idle" ? animStepIdx : undefined}
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
