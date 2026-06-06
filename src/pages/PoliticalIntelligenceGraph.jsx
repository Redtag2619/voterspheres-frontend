import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import ResponsiveRow from "../components/ui/ResponsiveRow";

function arr(value) {
  return Array.isArray(value) ? value : [];
}

function fmt(value) {
  return Number(value || 0).toLocaleString();
}

function clean(value = "") {
  return String(value || "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .trim();
}

function tone(value) {
  const v = String(value || "").toLowerCase();
  if (["critical", "high", "at risk", "overdue"].includes(v)) return "danger";
  if (["elevated", "watch", "medium", "open"].includes(v)) return "demo";
  if (["stable", "active", "generated", "strong"].includes(v)) return "active";
  return "accent";
}

function nodeColor(type) {
  return {
    firm: "rgba(96, 165, 250, 0.95)",
    workspace: "rgba(34, 197, 94, 0.9)",
    signal: "rgba(248, 113, 113, 0.9)",
    client: "rgba(168, 85, 247, 0.9)",
    project: "rgba(251, 191, 36, 0.9)",
    vendor: "rgba(20, 184, 166, 0.9)",
    report: "rgba(59, 130, 246, 0.9)",
    contact: "rgba(244, 114, 182, 0.9)",
    task: "rgba(249, 115, 22, 0.9)",
  }[type] || "rgba(148, 163, 184, 0.9)";
}

function GraphCanvas({ nodes, edges, selectedId, onSelect }) {
  const layout = useMemo(() => {
    const width = 980;
    const height = 620;
    const centerX = width / 2;
    const centerY = height / 2;

    const grouped = nodes.reduce((acc, n) => {
      acc[n.type] = acc[n.type] || [];
      acc[n.type].push(n);
      return acc;
    }, {});

    const rings = {
      firm: 0,
      workspace: 130,
      client: 210,
      signal: 280,
      project: 330,
      vendor: 360,
      report: 390,
      contact: 430,
      task: 460,
    };

    const positioned = [];
    Object.entries(grouped).forEach(([type, group], groupIndex) => {
      const radius = rings[type] || 300;
      const count = group.length || 1;

      group.forEach((node, index) => {
        if (type === "firm") {
          positioned.push({ ...node, x: centerX, y: centerY });
          return;
        }

        const angle = (Math.PI * 2 * index) / count + groupIndex * 0.45;
        positioned.push({
          ...node,
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius,
        });
      });
    });

    const map = new Map(positioned.map((n) => [n.id, n]));
    return { width, height, nodes: positioned, map };
  }, [nodes]);

  return (
    <div className="pig-canvas-wrap">
      <svg viewBox={`0 0 ${layout.width} ${layout.height}`} className="pig-canvas">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {edges.map((edge) => {
          const source = layout.map.get(edge.source);
          const target = layout.map.get(edge.target);
          if (!source || !target) return null;

          return (
            <line
              key={edge.id}
              x1={source.x}
              y1={source.y}
              x2={target.x}
              y2={target.y}
              stroke="rgba(148, 163, 184, 0.22)"
              strokeWidth={Math.max(1, Math.min(4, Number(edge.weight || 1)))}
            />
          );
        })}

        {layout.nodes.map((node) => {
          const selected = selectedId === node.id;
          const radius = node.type === "firm" ? 22 : node.type === "workspace" ? 15 : 11;

          return (
            <g key={node.id} onClick={() => onSelect(node)} style={{ cursor: "pointer" }}>
              <circle
                cx={node.x}
                cy={node.y}
                r={selected ? radius + 5 : radius}
                fill={nodeColor(node.type)}
                stroke={selected ? "white" : "rgba(255,255,255,0.42)"}
                strokeWidth={selected ? 3 : 1}
                filter={selected || ["High", "Critical", "At Risk"].includes(node.risk) ? "url(#glow)" : undefined}
              />
              <text
                x={node.x + radius + 5}
                y={node.y + 4}
                fill="rgba(226,232,240,.88)"
                fontSize="11"
              >
                {node.label.length > 28 ? `${node.label.slice(0, 28)}…` : node.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function PoliticalIntelligenceGraph() {
  const [data, setData] = useState({
    summary: {},
    nodes: [],
    edges: [],
    type_counts: {},
  });

  const [filters, setFilters] = useState({
    q: "",
    state: "",
    type: "",
  });

  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");

  const load = useCallback(async ({ quiet = false } = {}) => {
    try {
      if (quiet) setRefreshing(true);
      else setLoading(true);

      setError("");

      const result = await api.politicalIntelligenceGraph(filters);

      setData({
        summary: result?.summary || {},
        nodes: arr(result?.nodes),
        edges: arr(result?.edges),
        type_counts: result?.type_counts || {},
      });

      setLastUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    } catch (err) {
      setError(err?.response?.data?.error || err?.response?.data?.detail || err?.message || "Failed to load Political Intelligence Graph.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  const nodes = arr(data.nodes);
  const edges = arr(data.edges);
  const summary = data.summary || {};

  const states = useMemo(() => {
    return Array.from(new Set(nodes.map((n) => n.state).filter(Boolean))).sort();
  }, [nodes]);

  const selectedEdges = useMemo(() => {
    if (!selected) return [];
    return edges.filter((e) => e.source === selected.id || e.target === selected.id);
  }, [edges, selected]);

  const connectedNodes = useMemo(() => {
    if (!selected) return [];
    const ids = new Set(selectedEdges.flatMap((e) => [e.source, e.target]));
    ids.delete(selected.id);
    return nodes.filter((n) => ids.has(n.id));
  }, [nodes, selected, selectedEdges]);

  return (
    <PageShell
      eyebrow="Political Intelligence Graph"
      title="Political Intelligence Graph"
      description="A neutral relationship graph connecting workspaces, clients, projects, vendors, reports, CRM contacts, tasks, and political signals."
      tickerItems={[
        { label: "Nodes", value: `${summary.nodes || 0}`, dotClass: "vs-live-dot-success" },
        { label: "Edges", value: `${summary.edges || 0}`, dotClass: "vs-live-dot-success" },
        { label: "High Risk", value: `${summary.high_risk || 0}`, dotClass: summary.high_risk ? "vs-live-dot-warning" : "vs-live-dot-success" },
        { label: "Updated", value: refreshing ? "Live" : lastUpdated || "Ready", dotClass: refreshing ? "vs-live-dot-warning" : "vs-live-dot-success" },
      ]}
    >
      <style>{`
        .pig-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.35fr) minmax(360px, .65fr);
          gap: 18px;
          align-items: start;
        }

        .pig-stack {
          display: grid;
          gap: 14px;
        }

        .pig-controls {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 160px 160px auto;
          gap: 10px;
        }

        .pig-controls input,
        .pig-controls select {
          width: 100%;
          border-radius: 14px;
          border: 1px solid rgba(148, 163, 184, 0.18);
          background: rgba(15, 23, 42, 0.74);
          color: white;
          padding: 11px 12px;
          outline: none;
        }

        .pig-canvas-wrap {
          width: 100%;
          min-height: 620px;
          border-radius: 28px;
          border: 1px solid rgba(148, 163, 184, .16);
          overflow: hidden;
          background:
            radial-gradient(circle at center, rgba(37, 99, 235, .18), transparent 36%),
            radial-gradient(circle at top right, rgba(248, 113, 113, .10), transparent 30%),
            linear-gradient(135deg, rgba(15, 23, 42, .96), rgba(2, 6, 23, .86));
        }

        .pig-canvas {
          width: 100%;
          height: 620px;
          display: block;
        }

        .pig-row {
          border-radius: 20px;
          border: 1px solid rgba(148, 163, 184, .16);
          background:
            radial-gradient(circle at top right, rgba(59, 130, 246, .1), transparent 34%),
            linear-gradient(135deg, rgba(15, 23, 42, .78), rgba(2, 6, 23, .54));
          overflow: hidden;
        }

        .pig-row .vs-responsive-row {
          border: 0;
          background: transparent;
        }

        .pig-legend {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .pig-legend span {
          display: inline-flex;
          gap: 6px;
          align-items: center;
          border-radius: 999px;
          border: 1px solid rgba(148, 163, 184, .16);
          background: rgba(15, 23, 42, .58);
          color: rgba(226,232,240,.86);
          padding: 7px 9px;
          font-size: 11px;
        }

        .pig-dot {
          width: 9px;
          height: 9px;
          border-radius: 999px;
        }

        @media (max-width: 1100px) {
          .pig-grid,
          .pig-controls {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}

      <div className="vs-grid-4">
        <StatCard label="Workspaces" value={fmt(summary.workspaces)} delta="Campaign context" tone="up" />
        <StatCard label="Signals" value={fmt(summary.signals)} delta="Political intelligence" tone={summary.signals ? "neutral" : "up"} />
        <StatCard label="Clients" value={fmt(summary.clients)} delta="Business graph" tone="up" />
        <StatCard label="Reports" value={fmt(summary.reports)} delta="Deliverables" tone="up" />
      </div>

      <SectionCard title="Graph Controls" subtitle="Search and filter the relationship graph.">
        <div className="pig-controls">
          <input
            placeholder="Search graph..."
            value={filters.q}
            onChange={(e) => setFilters({ ...filters, q: e.target.value })}
          />

          <select value={filters.state} onChange={(e) => setFilters({ ...filters, state: e.target.value })}>
            <option value="">All States</option>
            {states.map((state) => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>

          <select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
            <option value="">All Types</option>
            <option value="workspace">Workspaces</option>
            <option value="signal">Signals</option>
            <option value="client">Clients</option>
            <option value="project">Projects</option>
            <option value="vendor">Vendors</option>
            <option value="report">Reports</option>
            <option value="contact">Contacts</option>
            <option value="task">Tasks</option>
          </select>

          <button className="vs-button" onClick={() => load({ quiet: true })}>
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </SectionCard>

      {loading ? (
        <EmptyState text="Loading Political Intelligence Graph..." />
      ) : (
        <div className="pig-grid">
          <div className="pig-stack">
            <SectionCard
              title="Relationship Graph"
              subtitle="Click a node to inspect its metadata and connected entities."
              right={<Badge tone="accent">{nodes.length} nodes</Badge>}
            >
              {!nodes.length ? (
                <EmptyState text="No graph nodes available." />
              ) : (
                <GraphCanvas
                  nodes={nodes}
                  edges={edges}
                  selectedId={selected?.id}
                  onSelect={setSelected}
                />
              )}
            </SectionCard>
          </div>

          <div className="pig-stack">
            <SectionCard title="Legend" subtitle="Node colors by entity type.">
              <div className="pig-legend">
                {["workspace", "signal", "client", "project", "vendor", "report", "contact", "task"].map((type) => (
                  <span key={type}>
                    <i className="pig-dot" style={{ background: nodeColor(type) }} />
                    {type}
                  </span>
                ))}
              </div>
            </SectionCard>

            <SectionCard
              title="Selected Node"
              subtitle="Entity details and relationship metadata."
              right={selected ? <Badge tone={tone(selected.risk)}>{selected.type}</Badge> : null}
            >
              {!selected ? (
                <EmptyState text="Select a node in the graph." />
              ) : (
                <div className="pig-stack">
                  <div className="pig-row">
                    <ResponsiveRow
                      title={selected.label}
                      subtitle={`${selected.type} • ${selected.state || "National"}`}
                      meta={[
                        { label: "Risk", value: selected.risk || "Stable" },
                        { label: "Score", value: selected.score || 0 },
                        { label: "Connections", value: selectedEdges.length },
                        { label: "ID", value: selected.id },
                      ]}
                      right={<Badge tone={tone(selected.risk)}>{selected.risk || "Stable"}</Badge>}
                    />
                  </div>

                  {Object.entries(selected.meta || {}).slice(0, 8).map(([key, value]) => (
                    <div key={key} className="pig-row">
                      <ResponsiveRow
                        title={key.replace(/_/g, " ")}
                        subtitle={clean(String(value ?? "—"))}
                        meta={[
                          { label: "Field", value: key },
                          { label: "Type", value: selected.type },
                          { label: "Node", value: selected.label },
                          { label: "Value", value: clean(String(value ?? "—")) },
                        ]}
                      />
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard
              title="Connected Entities"
              subtitle="Immediate neighbors of the selected node."
              right={<Badge tone="accent">{connectedNodes.length}</Badge>}
            >
              <div className="pig-stack">
                {!connectedNodes.length ? (
                  <EmptyState text="No connected entities selected." />
                ) : (
                  connectedNodes.slice(0, 10).map((item) => (
                    <div key={item.id} className="pig-row">
                      <ResponsiveRow
                        title={item.label}
                        subtitle={`${item.type} • ${item.state || "National"}`}
                        meta={[
                          { label: "Type", value: item.type },
                          { label: "Risk", value: item.risk || "Stable" },
                          { label: "State", value: item.state || "National" },
                          { label: "Score", value: item.score || 0 },
                        ]}
                        right={<Badge tone={tone(item.risk)}>{item.type}</Badge>}
                      />
                    </div>
                  ))
                )}
              </div>
            </SectionCard>
          </div>
        </div>
      )}
    </PageShell>
  );
}
