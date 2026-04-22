import type { TraversalStep } from "./TraversalLog";

interface ResultPanelProps {
    steps: TraversalStep[];
    elapsedMs: number;
    visitedCount: number;
    algorithm: "bfs" | "dfs";
    selector: string;
}

export default function ResultPanel({ steps, elapsedMs, visitedCount, algorithm, selector }: ResultPanelProps) {
    const matched = steps.filter((s) => s.event === "match");
    const skipped = steps.filter((s) => s.event === "skip").length;

    return (
        <div className="result-panel-inner">

            {/* ── Stats ── */}
            <section className="rp-section">
                <p className="rp-label">Statistik</p>
                <div className="rp-stats-grid">
                    <div className="rp-stat rp-stat-green">
                        <span className="rp-stat-value">{matched.length}</span>
                        <span className="rp-stat-key">Cocok</span>
                    </div>
                    <div className="rp-stat rp-stat-amber">
                        <span className="rp-stat-value">{visitedCount}</span>
                        <span className="rp-stat-key">Dikunjungi</span>
                    </div>
                    <div className="rp-stat">
                        <span className="rp-stat-value">{skipped}</span>
                        <span className="rp-stat-key">Dilewati</span>
                    </div>
                    <div className="rp-stat rp-stat-blue">
                        <span className="rp-stat-value">{elapsedMs}</span>
                        <span className="rp-stat-key">ms</span>
                    </div>
                </div>
            </section>

            {/* ── Config recap ── */}
            <section className="rp-section">
                <p className="rp-label">Konfigurasi</p>
                <div className="rp-config">
                    <div className="rp-config-row">
                        <span className="rp-config-key">Algoritma</span>
                        <span className="badge badge-algo">{algorithm.toUpperCase()}</span>
                    </div>
                    <div className="rp-config-row">
                        <span className="rp-config-key">Selector</span>
                        <span className="rp-config-val mono">{selector}</span>
                    </div>
                    <div className="rp-config-row">
                        <span className="rp-config-key">Steps</span>
                        <span className="rp-config-val">{steps.length}</span>
                    </div>
                </div>
            </section>

            {/* ── Matched nodes list ── */}
            <section className="rp-section rp-section-grow">
                <p className="rp-label">Elemen Cocok ({matched.length})</p>
                {matched.length === 0 ? (
                    <div className="rp-no-match">
                        <span>Tidak ada elemen yang cocok.</span>
                    </div>
                ) : (
                    <ul className="rp-match-list">
                        {matched.map((s, i) => {
                            const attrs = Object.entries(s.attributes)
                                .filter(([k]) => k === "id" || k === "class")
                                .map(([k, v]) => (k === "id" ? `#${v}` : `.${v.split(" ").join(".")}`))
                                .join(" ");
                            return (
                                <li key={s.step} className="rp-match-item">
                                    <span className="rp-match-num">{i + 1}</span>
                                    <div className="rp-match-info">
                                        <span className="rp-match-tag mono">&lt;{s.tag}&gt;</span>
                                        {attrs && <span className="rp-match-attrs mono">{attrs}</span>}
                                        <span className="rp-match-depth">depth {s.depth}</span>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </section>

        </div>
    );
}
