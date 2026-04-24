import { useState } from "react";
import { TRAVERSAL_ALGORITHMS, type TraversalAlgorithm } from "../traversalTypes";

export interface TraversalConfig {
  sourceType: "url" | "html";
  source: string;
  algorithm: TraversalAlgorithm;
  selector: string;
  resultMode: "all" | "topn";
  topN: number;
}

interface InputFormProps {
  onSubmit: (config: TraversalConfig) => void;
  isLoading?: boolean;
}

const SELECTOR_HINTS: Record<string, string> = {
  "#": "ID selector — memilih elemen dengan id tertentu",
  ".": "Class selector — memilih elemen dengan class tertentu",
  "*": "Universal selector — memilih semua elemen",
  ">": "Child combinator — memilih direct child",
  "+": "Adjacent sibling combinator",
  "~": "General sibling combinator",
};

const ALGORITHM_OPTIONS: {
  value: TraversalAlgorithm;
  label: string;
  description: string;
}[] = [
  {
    value: TRAVERSAL_ALGORITHMS.BFS,
    label: "BFS",
    description: "Menelusuri node level demi level dari akar.",
  },
  {
    value: TRAVERSAL_ALGORITHMS.DFS,
    label: "DFS",
    description: "Masuk sedalam mungkin ke satu cabang, lalu backtrack.",
  },
  {
    value: TRAVERSAL_ALGORITHMS.BFS_PARALLEL,
    label: "BFS Parallel",
    description: "Memproses node pada level BFS yang sama secara konkuren.",
  },
];

function getSelectorHint(val: string): string {
  if (!val.trim()) return "";
  const first = val.trim()[0];
  if (SELECTOR_HINTS[first]) return SELECTOR_HINTS[first];
  if (/^[a-zA-Z]/.test(val)) {
    const tag = val.split(/[\s.#>+~[]/)[0];
    return `Tag selector — memilih semua elemen <${tag}>`;
  }
  return "";
}

export default function InputForm({ onSubmit, isLoading = false }: InputFormProps) {
  const [sourceType, setSourceType] = useState<"url" | "html">("url");
  const [source, setSource] = useState("");
  const [algorithm, setAlgorithm] = useState<TraversalAlgorithm>(TRAVERSAL_ALGORITHMS.BFS);
  const [selector, setSelector] = useState("");
  const [resultMode, setResultMode] = useState<"all" | "topn">("all");
  const [topN, setTopN] = useState(5);
  const [errors, setErrors] = useState<Partial<Record<"source" | "selector", string>>>({});

  function validate(): boolean {
    const newErrors: typeof errors = {};
    if (!source.trim()) newErrors.source = "Wajib diisi.";
    if (!selector.trim()) newErrors.selector = "Wajib diisi.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    onSubmit({ sourceType, source: source.trim(), algorithm, selector: selector.trim(), resultMode, topN });
  }

  return (
    <div className="flex flex-col gap-3 p-4 max-w-xl">

      {/* Sumber HTML */}
      <div className="rounded-xl border border-gray-200 p-4">
        <p className="text-xs font-medium uppercase tracking-widest text-gray-400 mb-3">Sumber HTML</p>
        <div className="flex gap-2 mb-3">
          {(["url", "html"] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setSourceType(t); setSource(""); setErrors({}); }}
              className={`flex-1 py-1.5 text-sm font-medium rounded-lg border transition-colors ${
                sourceType === t
                  ? "bg-gray-100 border-gray-400 text-gray-800"
                  : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
              }`}
            >
              {t === "url" ? "URL Website" : "HTML Langsung"}
            </button>
          ))}
        </div>

        {sourceType === "url" ? (
          <input
            type="text"
            value={source}
            onChange={(e) => { setSource(e.target.value); setErrors((prev) => ({ ...prev, source: undefined })); }}
            placeholder="https://example.com"
            className={`w-full px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-blue-300 transition ${
              errors.source ? "border-red-400" : "border-gray-200"
            }`}
          />
        ) : (
          <textarea
            value={source}
            onChange={(e) => { setSource(e.target.value); setErrors((prev) => ({ ...prev, source: undefined })); }}
            placeholder="Paste HTML di sini..."
            rows={5}
            className={`w-full px-3 py-2 text-xs font-mono border rounded-lg outline-none focus:ring-2 focus:ring-blue-300 resize-y transition ${
              errors.source ? "border-red-400" : "border-gray-200"
            }`}
          />
        )}
        {errors.source && <p className="text-xs text-red-500 mt-1">{errors.source}</p>}
      </div>

      {/* Algoritma */}
      <div className="rounded-xl border border-gray-200 p-4">
        <p className="text-xs font-medium uppercase tracking-widest text-gray-400 mb-3">Algoritma Traversal</p>
        <div className="algorithm-options">
          {ALGORITHM_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setAlgorithm(option.value)}
              className={`algorithm-option-button flex flex-col items-start rounded-lg border text-sm font-medium transition-colors ${
                algorithm === option.value
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-200 text-gray-500 hover:bg-gray-50"
              }`}
            >
              <span className="algorithm-option-label text-base font-semibold">{option.label}</span>
              <span className="algorithm-option-description text-xs font-normal mt-1">
                {option.description}
              </span>
            </button>
          ))}
        </div>
        <p className="algorithm-option-note text-xs text-gray-400 mt-2">
          BFS Parallel memproses node pada level BFS yang sama secara konkuren. DFS tetap sequential.
        </p>
      </div>

      {/* CSS Selector */}
      <div className="rounded-xl border border-gray-200 p-4">
        <p className="text-xs font-medium uppercase tracking-widest text-gray-400 mb-3">CSS Selector</p>
        <input
          type="text"
          value={selector}
          onChange={(e) => { setSelector(e.target.value); setErrors((prev) => ({ ...prev, selector: undefined })); }}
          placeholder="contoh: div.container > p, #header, .btn"
          className={`w-full px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-blue-300 transition ${
            errors.selector ? "border-red-400" : "border-gray-200"
          }`}
        />
        {errors.selector
          ? <p className="text-xs text-red-500 mt-1">{errors.selector}</p>
          : <p className="text-xs text-gray-400 mt-1.5 min-h-[16px]">{getSelectorHint(selector)}</p>
        }
      </div>

      {/* Jumlah Hasil */}
      <div className="rounded-xl border border-gray-200 p-4">
        <p className="text-xs font-medium uppercase tracking-widest text-gray-400 mb-3">Jumlah Hasil</p>
        <div className="grid grid-cols-2 gap-2">
          {(["all", "topn"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setResultMode(mode)}
              className={`py-2 text-sm font-medium rounded-lg border transition-colors ${
                resultMode === mode
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-200 text-gray-500 hover:bg-gray-50"
              }`}
            >
              {mode === "all" ? "Semua kemunculan" : "Top n kemunculan"}
            </button>
          ))}
        </div>
        {resultMode === "topn" && (
          <div className="flex items-center gap-2 mt-3">
            <label className="text-sm text-gray-500 whitespace-nowrap">Tampilkan</label>
            <input
              type="number"
              min={1}
              value={topN}
              onChange={(e) => setTopN(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-20 px-2 py-1.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-300"
            />
            <label className="text-sm text-gray-500">hasil teratas</label>
          </div>
        )}
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={isLoading}
        className="w-full py-2.5 text-sm font-medium rounded-xl border border-gray-200 bg-white hover:bg-gray-50 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <span className="w-3 h-3 rounded-full border-2 border-gray-400 border-t-transparent animate-spin" />
            Memproses...
          </>
        ) : (
          "Mulai Penelusuran"
        )}
      </button>
    </div>
  );
}
