import type { DOMNode } from "./components/DOMTreeType";
import type { TraversalStep } from "./components/TraversalLog";
import type { TraversalConfig } from "./components/InputForm";

// ─── Mock DOM tree ────────────────────────────────────────────────────────────
const MOCK_TREE: DOMNode = {
    id: "n0",
    tag: "html",
    attributes: { lang: "id" },
    children: [
        {
            id: "n1",
            tag: "head",
            attributes: {},
            children: [
                { id: "n2", tag: "title", attributes: {}, children: [], state: "idle" },
                { id: "n3", tag: "meta", attributes: { charset: "UTF-8" }, children: [], state: "idle" },
                { id: "n4", tag: "link", attributes: { rel: "stylesheet", href: "style.css" }, children: [], state: "idle" },
            ],
            state: "idle",
        },
        {
            id: "n5",
            tag: "body",
            attributes: { class: "container" },
            children: [
                {
                    id: "n6",
                    tag: "header",
                    attributes: { class: "site-header" },
                    children: [
                        { id: "n7", tag: "h1", attributes: { class: "brand" }, children: [], state: "idle" },
                        {
                            id: "n8",
                            tag: "nav",
                            attributes: { id: "main-nav" },
                            children: [
                                { id: "n9", tag: "a", attributes: { href: "/", class: "nav-link" }, children: [], state: "idle" },
                                { id: "n10", tag: "a", attributes: { href: "/about", class: "nav-link" }, children: [], state: "idle" },
                                { id: "n11", tag: "a", attributes: { href: "/contact", class: "nav-link" }, children: [], state: "idle" },
                            ],
                            state: "idle",
                        },
                    ],
                    state: "idle",
                },
                {
                    id: "n12",
                    tag: "main",
                    attributes: { id: "content" },
                    children: [
                        {
                            id: "n13",
                            tag: "section",
                            attributes: { class: "hero" },
                            children: [
                                { id: "n14", tag: "h2", attributes: { class: "hero-title" }, children: [], state: "idle" },
                                { id: "n15", tag: "p", attributes: { class: "hero-desc" }, children: [], state: "idle" },
                                { id: "n16", tag: "button", attributes: { class: "btn-primary", id: "cta" }, children: [], state: "idle" },
                            ],
                            state: "idle",
                        },
                        {
                            id: "n17",
                            tag: "section",
                            attributes: { class: "features" },
                            children: [
                                {
                                    id: "n18", tag: "div", attributes: { class: "card" }, children: [
                                        { id: "n19", tag: "h3", attributes: { class: "card-title" }, children: [], state: "idle" },
                                        { id: "n20", tag: "p", attributes: { class: "card-body" }, children: [], state: "idle" },
                                    ], state: "idle"
                                },
                                {
                                    id: "n21", tag: "div", attributes: { class: "card" }, children: [
                                        { id: "n22", tag: "h3", attributes: { class: "card-title" }, children: [], state: "idle" },
                                        { id: "n23", tag: "p", attributes: { class: "card-body" }, children: [], state: "idle" },
                                    ], state: "idle"
                                },
                            ],
                            state: "idle",
                        },
                    ],
                    state: "idle",
                },
                {
                    id: "n24",
                    tag: "footer",
                    attributes: { class: "site-footer" },
                    children: [
                        { id: "n25", tag: "p", attributes: { class: "footer-text" }, children: [], state: "idle" },
                    ],
                    state: "idle",
                },
            ],
            state: "idle",
        },
    ],
    state: "idle",
};

// ─── Flatten tree ─────────────────────────────────────────────────────────────
interface FlatNode { node: DOMNode; depth: number }

function flattenBFS(root: DOMNode): FlatNode[] {
    const result: FlatNode[] = [];
    const queue: FlatNode[] = [{ node: root, depth: 0 }];
    while (queue.length) {
        const { node, depth } = queue.shift()!;
        result.push({ node, depth });
        for (const child of node.children ?? []) queue.push({ node: child, depth: depth + 1 });
    }
    return result;
}

function flattenDFS(root: DOMNode): FlatNode[] {
    const result: FlatNode[] = [];
    function dfs(node: DOMNode, depth: number) {
        result.push({ node, depth });
        for (const child of node.children ?? []) dfs(child, depth + 1);
    }
    dfs(root, 0);
    return result;
}

// ─── Selector matcher (very simple) ──────────────────────────────────────────
function matchesSelector(node: DOMNode, selector: string): boolean {
    const s = selector.trim().toLowerCase();
    if (!s || s === "*") return true;

    // tag
    if (/^[a-z][a-z0-9]*$/.test(s)) return node.tag === s;

    // .class
    if (s.startsWith(".")) {
        const cls = s.slice(1);
        return (node.attributes?.["class"] ?? "").split(" ").includes(cls);
    }

    // #id
    if (s.startsWith("#")) {
        return node.attributes?.["id"] === s.slice(1);
    }

    // tag.class  e.g. div.card
    const tagClass = s.match(/^([a-z][a-z0-9]*)\.([^\s]+)$/);
    if (tagClass) {
        const [, tag, cls] = tagClass;
        return node.tag === tag && (node.attributes?.["class"] ?? "").split(" ").includes(cls);
    }

    // tag#id
    const tagId = s.match(/^([a-z][a-z0-9]*)#([^\s]+)$/);
    if (tagId) {
        const [, tag, id] = tagId;
        return node.tag === tag && node.attributes?.["id"] === id;
    }

    // fallback — match tag
    return node.tag === s;
}

// ─── Build steps ──────────────────────────────────────────────────────────────
function buildSteps(flat: FlatNode[], selector: string): TraversalStep[] {
    return flat.map(({ node, depth }, index) => {
        const matches = matchesSelector(node, selector);
        return {
            step: index + 1,
            nodeId: node.id,
            tag: node.tag,
            attributes: node.attributes,
            depth,
            event: matches ? "match" : index % 4 === 3 ? "skip" : "visit",
        } satisfies TraversalStep;
    });
}

// ─── Mark tree state ─────────────────────────────────────────────────────────
function markTree(root: DOMNode, steps: TraversalStep[]): DOMNode {
    const stateMap = new Map<string, DOMNode["state"]>();
    for (const s of steps) {
        stateMap.set(s.nodeId, s.event === "match" ? "matched" : s.event === "visit" ? "visited" : "idle");
    }

    function mark(n: DOMNode): DOMNode {
        return {
            ...n,
            state: stateMap.get(n.id) ?? "idle",
            children: (n.children ?? []).map(mark),
        };
    }
    return mark(root);
}

// ─── Main mock function ───────────────────────────────────────────────────────
export async function mockTraverse(config: TraversalConfig): Promise<{
    tree: DOMNode;
    steps: TraversalStep[];
    elapsedMs: number;
}> {
    // Simulate network latency
    await new Promise((r) => setTimeout(r, 600 + Math.random() * 400));

    const flat = config.algorithm === "bfs" ? flattenBFS(MOCK_TREE) : flattenDFS(MOCK_TREE);
    const allSteps = buildSteps(flat, config.selector);

    // Apply topN if needed
    const steps =
        config.resultMode === "topn" && config.topN
            ? allSteps.filter((s) => s.event === "match").slice(0, config.topN)
                .concat(allSteps.filter((s) => s.event !== "match"))
                .sort((a, b) => a.step - b.step)
            : allSteps;

    const tree = markTree(MOCK_TREE, steps);
    const elapsedMs = Math.round(8 + Math.random() * 24);

    return { tree, steps, elapsedMs };
}
