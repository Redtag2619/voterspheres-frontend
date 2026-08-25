import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import ResponsiveRow from "../components/ui/ResponsiveRow";

const ALL_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DC", "DE", "FL", "GA", "HI",
  "IA", "ID", "IL", "IN", "KS", "KY", "LA", "MA", "MD", "ME", "MI", "MN",
  "MO", "MS", "MT", "NC", "ND", "NE", "NH", "NJ", "NM", "NV", "NY", "OH",
  "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VA", "VT", "WA",
  "WI", "WV", "WY",
];

const ENTITY_TYPES = [
  "candidate",
  "donor",
  "vendor",
  "endorsement",
  "task",
  "state",
];

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeText(value = "") {
  return String(value || "").trim();
}

function number(value) {
  const next = Number(value);
  return Number.isFinite(next) ? next : 0;
}

function formatMoney(value) {
  const num = number(value);

  if (num >= 1_000_000_000) return `$${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `$${Math.round(num / 1_000)}K`;

  return `$${num.toLocaleString()}`;
}

function scoreTone(score) {
  const value = number(score);

  if (value >= 85) return "danger";
  if (value >= 70) return "demo";
  if (value >= 50) return "info";

  return "default";
}

function typeTone(type) {
  const value = normalizeText(type).toLowerCase();

  if (value === "candidate") return "accent";
  if (value === "donor") return "danger";
  if (value === "vendor") return "info";
  if (value === "endorsement") return "demo";
  if (value === "task") return "active";
  if (value === "state") return "active";

  return "default";
}

function priorityTone(priority) {
  const value = normalizeText(priority).toLowerCase();

  if (value.includes("high") || value.includes("critical")) return "danger";
  if (value.includes("medium") || value.includes("elevated")) return "demo";

  return "info";
}

function nodeTitle(node = {}) {
  return node.label || node.name || node.title || "Unnamed Entity";
}

function nodeSubtitle(node = {}) {
  return (
    node.subtitle ||
    [
      node.type,
      node.state,
      node.office,
      node.party,
      node.category,
      node.endorser_type,
      node.donor_type,
      node.status,
    ]
      .filter(Boolean)
      .join(" • ") ||
    "Political relationship graph entity"
  );
}

function sourceTotal(sources = {}) {
  return Object.values(sources || {}).reduce(
    (sum, value) => sum + number(value),
    0
  );
}

async function getPoliticalGraph(params = {}) {
  if (typeof api.politicalGraph === "function") {
    return api.politicalGraph(params);
  }

  const response = await api.get("/political-graph", {
    params,
    timeout: 15000,
  });

  return response?.data || response;
}

async function getPoliticalGraphStats(params = {}) {
  if (typeof api.politicalGraphStats === "function") {
    return api.politicalGraphStats(params);
  }

  const response = await api.get("/political-graph/stats", {
    params,
    timeout: 15000,
  });

  return response?.data || response;
}

async function createCommandTask(payload) {
  if (typeof api.createTask === "function") {
    return api.createTask(payload);
  }

  const response = await api.post("/tasks", payload);
  return response?.data || response;
}

function SourceCard({ label, value }) {
  return (
    <div className="pig-source-card">
      <strong>{value || 0}</strong>
      <span>{label}</span>
    </div>
  );
}

function EntityRow({ node, selected, onSelect }) {
  return (
    <div className={`pig-entity-row ${selected ? "is-selected" : ""}`}>
      <ResponsiveRow
        title={nodeTitle(node)}
        subtitle={nodeSubtitle(node)}
        meta={[
          { label: "Type", value: node.type || "Entity" },
          { label: "State", value: node.state || "National" },
          { label: "Score", value: node.score ? `${Math.round(number(node.score))}/100` : "N/A" },
          { label: "Links", value: node.connections || 0 },
        ]}
        right={
          <div className="pig-actions">
            <Badge tone={typeTone(node.type)}>{node.type || "Node"}</Badge>
            <button
              type="button"
              className="vs-button vs-button-secondary"
              onClick={() => onSelect(node)}
            >
              Inspect
            </button>
          </div>
        }
      />
    </div>
  );
}

function StateInfluenceRow({ item, onSelectState }) {
  return (
    <button
      type="button"
      className="pig-state-row"
      onClick={() => onSelectState(item.state)}
    >
      <div>
        <strong>{item.state}</strong>
        <span>
          {item.nodes || 0} nodes • {item.connections || 0} links
        </span>
      </div>
      <div>
        <b>{Math.round(number(item.avg_score))}</b>
        <small>Avg score</small>
      </div>
    </button>
  );
}

function ActionRow({ action, onCreateTask }) {
  return (
    <ResponsiveRow
      title={action.title || "Recommended Action"}
      subtitle={action.detail || "Political graph recommendation"}
      meta={[
        { label: "State", value: action.state || "National" },
        { label: "Priority", value: action.priority || "Medium" },
        { label: "Owner", value: action.owner || "Political Intelligence" },
        { label: "Source", value: action.source || "political_relationship_graph" },
      ]}
      right={
        <div className="pig-actions">
          <Badge tone={priorityTone(action.priority)}>
            {action.priority || "Medium"}
          </Badge>
          <button
            type="button"
            className="vs-button"
            onClick={() => onCreateTask(action)}
          >
            Create Task
          </button>
        </div>
      }
    />
  );
}

function EdgeRow({ edge, nodesById }) {
  const from = nodesById[edge.from] || {};
  const to = nodesById[edge.to] || {};

  return (
    <ResponsiveRow
      title={`${nodeTitle(from)} → ${nodeTitle(to)}`}
      subtitle={edge.label || edge.type || "Relationship link"}
      meta={[
        { label: "From", value: from.type || "Unknown" },
        { label: "To", value: to.type || "Unknown" },
        { label: "Strength", value: `${number(edge.strength || 50)}/100` },
        { label: "Value", value: edge.value ? formatMoney(edge.value) : "N/A" },
      ]}
      right={
        <Badge tone={scoreTone(edge.strength)}>
          {edge.type || edge.label || "Link"}
        </Badge>
      }
    />
  );
}

function SelectedEntityPanel({ node, relatedEdges, nodesById, onCreateTask }) {
  if (!node) {
    return <EmptyState text="Select a graph entity to inspect relationships." />;
  }

  const value = number(node.value);

  return (
    <div className="pig-selected-panel">
      <div className="pig-selected-header">
        <div>
          <Badge tone={typeTone(node.type)}>{node.type || "Entity"}</Badge>
          <h3>{nodeTitle(node)}</h3>
          <p>{nodeSubtitle(node)}</p>
        </div>
        <Badge tone={scoreTone(node.score)}>
          {node.score ? `${Math.round(number(node.score))}/100` : "N/A"}
        </Badge>
      </div>

      <div className="vs-grid-2">
        <StatCard label="State" value={node.state || "National"} subtext="Primary geography" />
        <StatCard label="Links" value={node.connections || 0} subtext="Relationship count" />
        <StatCard label="Value" value={value ? formatMoney(value) : "N/A"} subtext="Financial signal" />
        <StatCard label="Score" value={node.score ? Math.round(number(node.score)) : "N/A"} subtext="Graph score" />
      </div>

      <button
        type="button"
        className="vs-button"
        onClick={() =>
          onCreateTask({
            title: `Review platform intelligence: ${nodeTitle(node)}`,
            detail: `${nodeTitle(node)} has ${node.connections || 0} political graph relationships and a score of ${Math.round(number(node.score))}/100.`,
            state: node.state || "National",
            priority: number(node.score) >= 85 ? "High" : "Medium",
            owner: "Political Intelligence",
            source: "platform_intelligence_graph",
            entity_type: node.type,
            entity_id: node.id,
          })
        }
      >
        Create Command Center Task
      </button>

      <SectionCard
        title="Direct Relationship Links"
        subtitle="Relationships connected to the selected entity."
        right={<Badge tone="info">{relatedEdges.length} links</Badge>}
      >
        <div className="vs-stack">
          {!relatedEdges.length ? (
            <EmptyState text="No direct relationships found for this entity." />
          ) : (
            relatedEdges.slice(0, 8).map((edge, index) => (
              <EdgeRow
                key={`${edge.from}-${edge.to}-${edge.type}-${index}`}
                edge={edge}
                nodesById={nodesById}
              />
            ))
          )}
        </div>
      </SectionCard>
    </div>
  );
}

export default function PlatformIntelligenceGraph() {
  const [filters, setFilters] = useState({
    search: "",
    state: "",
    type: "",
    limit: 250,
  });

  const [graphData, setGraphData] = useState({
    summary: {
      total_nodes: 0,
      total_edges: 0,
      by_type: {},
      states_covered: 0,
      by_state: [],
      top_nodes: [],
    },
    graph: {
      nodes: [],
      edges: [],
    },
    actions: [],
    sources: {},
  });

  const [statsData, setStatsData] = useState({
    summary: {},
    sources: {},
    actions: [],
  });

  const [selectedNode, setSelectedNode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadGraph() {
    try {
      setLoading(true);
      setStatsLoading(true);
      setError("");
      setMessage("");

      const params = {
        search: filters.search,
        state: filters.state,
        limit: filters.limit,
      };

      const [graphPayload, statsPayload] = await Promise.all([
        getPoliticalGraph(params),
        getPoliticalGraphStats(params),
      ]);

      const nextGraph = {
        summary: graphPayload?.summary || {
          total_nodes: 0,
          total_edges: 0,
          by_type: {},
          states_covered: 0,
          by_state: [],
          top_nodes: [],
        },
        graph: graphPayload?.graph || {
          nodes: [],
          edges: [],
        },
        actions: safeArray(graphPayload?.actions),
        sources: graphPayload?.sources || {},
      };

      setGraphData(nextGraph);

      setStatsData({
        summary: statsPayload?.summary || nextGraph.summary,
        sources: statsPayload?.sources || nextGraph.sources,
        actions: safeArray(statsPayload?.actions || nextGraph.actions),
      });

      setSelectedNode((current) => {
        if (
          current &&
          nextGraph.graph.nodes?.some((node) => node.id === current.id)
        ) {
          return current;
        }

        return nextGraph.graph.nodes?.[0] || null;
      });
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to load Platform Intelligence graph."
      );
    } finally {
      setLoading(false);
      setStatsLoading(false);
    }
  }

  useEffect(() => {
    loadGraph();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.state, filters.limit]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadGraph();
    }, 350);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.search]);

  const nodes = safeArray(graphData.graph?.nodes);
  const edges = safeArray(graphData.graph?.edges);
  const summary = graphData.summary || {};
  const byType = summary.by_type || {};
  const sources = graphData.sources || {};

  const nodesById = useMemo(() => {
    return nodes.reduce((acc, node) => {
      if (node?.id) acc[node.id] = node;
      return acc;
    }, {});
  }, [nodes]);

  const visibleNodes = useMemo(() => {
    const q = normalizeText(filters.search).toLowerCase();

    return nodes.filter((node) => {
      if (filters.type && node.type !== filters.type) return false;
      if (filters.state && node.state !== filters.state) return false;

      if (q) {
        const haystack = [
          node.label,
          node.type,
          node.state,
          node.office,
          node.party,
          node.category,
          node.endorser_type,
          node.donor_type,
          node.status,
        ]
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(q)) return false;
      }

      return true;
    });
  }, [nodes, filters]);

  const visibleNodeIds = useMemo(
    () => new Set(visibleNodes.map((node) => node.id)),
    [visibleNodes]
  );

  const visibleEdges = useMemo(() => {
    return edges.filter(
      (edge) => visibleNodeIds.has(edge.from) || visibleNodeIds.has(edge.to)
    );
  }, [edges, visibleNodeIds]);

  const relatedEdges = useMemo(() => {
    if (!selectedNode) return [];

    return edges.filter(
      (edge) => edge.from === selectedNode.id || edge.to === selectedNode.id
    );
  }, [edges, selectedNode]);

  const topEntities = useMemo(() => {
    return [...visibleNodes]
      .sort(
        (a, b) =>
          number(b.connections) - number(a.connections) ||
          number(b.score) - number(a.score)
      )
      .slice(0, 18);
  }, [visibleNodes]);

  const topStates = safeArray(summary.by_state).slice(0, 12);

  async function handleCreateTask(action) {
    try {
      setMessage("Creating Command Center task...");

      const payload = {
        title: action.title || "Review Platform Intelligence signal",
        description:
          action.detail ||
          action.description ||
          "Review Platform Intelligence political graph signal.",
        source: action.source || "platform_intelligence_graph",
        state: action.state || selectedNode?.state || "National",
        office: action.office || selectedNode?.office || "Statewide",
        priority:
          normalizeText(action.priority).toLowerCase() === "high"
            ? "high"
            : normalizeText(action.priority).toLowerCase() === "medium"
            ? "medium"
            : "normal",
        status: "open",
        assigned_to: action.owner || "Political Intelligence",
        due_label:
          normalizeText(action.priority).toLowerCase() === "high"
            ? "Today"
            : "This Week",
        metadata: {
          source: "platform_intelligence_graph",
          entity_type: action.entity_type || selectedNode?.type,
          entity_id: action.entity_id || selectedNode?.id,
          entity_label: selectedNode?.label,
        },
      };

      await createCommandTask(payload);
      setMessage(`Task created: ${payload.title}`);
    } catch (err) {
      setMessage(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to create Command Center task."
      );
    }
  }

  return (
    <PageShell
      eyebrow="Platform Intelligence"
      title="Platform Intelligence Graph"
      description="Executive view of the Political Relationship Graph powering candidates, donors, vendors, endorsements, states, and Command Center actions."
      tickerItems={[
        {
          label: "Nodes",
          value: String(summary.total_nodes || nodes.length || 0),
          dotClass: "vs-live-dot-success",
        },
        {
          label: "Edges",
          value: String(summary.total_edges || edges.length || 0),
          dotClass: "vs-live-dot-warning",
        },
        {
          label: "States",
          value: String(summary.states_covered || 0),
          dotClass: "vs-live-dot-success",
        },
        {
          label: "Sources",
          value: String(sourceTotal(sources)),
          dotClass: "vs-live-dot",
        },
      ]}
    >
      <style>{`
        .pig-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.16fr) minmax(360px, 0.84fr);
          gap: 16px;
          align-items: start;
        }

        .pig-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          align-items: center;
          justify-content: flex-end;
        }

        .pig-source-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 12px;
        }

        .pig-source-card {
          border: 1px solid rgba(148, 163, 184, 0.16);
          border-radius: 18px;
          background:
            radial-gradient(circle at top right, rgba(59, 130, 246, 0.12), transparent 40%),
            rgba(15, 23, 42, 0.58);
          padding: 16px;
          display: grid;
          gap: 5px;
        }

        .pig-source-card strong {
          color: var(--vs-text);
          font-size: 24px;
          font-weight: 950;
          line-height: 1;
        }

        .pig-source-card span {
          color: var(--vs-text-muted);
          font-size: 12px;
          font-weight: 800;
          text-transform: capitalize;
        }

        .pig-entity-row {
          border: 1px solid rgba(148, 163, 184, 0.16);
          border-radius: 18px;
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.82), rgba(15, 23, 42, 0.46));
          overflow: hidden;
        }

        .pig-entity-row.is-selected {
          border-color: rgba(99, 102, 241, 0.62);
          box-shadow:
            0 0 0 1px rgba(99, 102, 241, 0.18),
            0 16px 38px rgba(2, 6, 23, 0.22);
        }

        .pig-entity-row .vs-responsive-row {
          border: 0;
          background: transparent;
        }

        .pig-state-row {
          border: 1px solid rgba(148, 163, 184, 0.16);
          border-radius: 16px;
          background: rgba(15, 23, 42, 0.58);
          color: var(--vs-text);
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: center;
          padding: 14px;
          text-align: left;
        }

        .pig-state-row strong,
        .pig-state-row b {
          display: block;
          color: var(--vs-text);
          font-weight: 950;
        }

        .pig-state-row span,
        .pig-state-row small {
          display: block;
          color: var(--vs-text-muted);
          font-size: 12px;
          margin-top: 3px;
        }

        .pig-selected-panel {
          display: grid;
          gap: 14px;
        }

        .pig-selected-header {
          border: 1px solid rgba(148, 163, 184, 0.16);
          border-radius: 18px;
          background:
            radial-gradient(circle at top right, rgba(168, 85, 247, 0.14), transparent 36%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.84), rgba(15, 23, 42, 0.48));
          padding: 16px;
          display: flex;
          justify-content: space-between;
          gap: 14px;
          align-items: flex-start;
        }

        .pig-selected-header h3 {
          color: var(--vs-text);
          font-size: 20px;
          font-weight: 950;
          letter-spacing: -0.03em;
          margin: 10px 0 4px;
        }

        .pig-selected-header p {
          color: var(--vs-text-muted);
          font-size: 13px;
          line-height: 1.45;
          margin: 0;
        }

        @media (max-width: 1100px) {
          .pig-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}
      {message ? <div className="vs-banner vs-live-banner-pulse">{message}</div> : null}

      <div className="vs-grid-4">
        <StatCard label="Candidates" value={byType.candidate || 0} subtext="Candidate graph nodes" tone="up" />
        <StatCard label="Donors" value={byType.donor || 0} subtext="Donor graph nodes" tone="up" />
        <StatCard label="Vendors" value={byType.vendor || 0} subtext="Vendor graph nodes" tone="up" />
        <StatCard label="Endorsements" value={byType.endorsement || 0} subtext="Endorsement graph nodes" tone="up" />
      </div>

      <SectionCard
        title="Graph Intelligence Filters"
        subtitle="Filter the Political Relationship Graph by state, entity type, or keyword."
        right={
          <div className="pig-actions">
            <Badge tone="active">Political Graph Primary</Badge>
            <button type="button" className="vs-button vs-button-secondary" onClick={loadGraph}>
              Refresh
            </button>
          </div>
        }
      >
        <div className="vs-grid-4">
          <input
            className="vs-input"
            value={filters.search}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                search: event.target.value,
              }))
            }
            placeholder="Search candidates, donors, vendors, endorsements..."
          />

          <select
            className="vs-input"
            value={filters.state}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                state: event.target.value,
              }))
            }
          >
            <option value="">All states</option>
            {ALL_STATES.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>

          <select
            className="vs-input"
            value={filters.type}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                type: event.target.value,
              }))
            }
          >
            <option value="">All entity types</option>
            {ENTITY_TYPES.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>

          <select
            className="vs-input"
            value={filters.limit}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                limit: Number(event.target.value),
              }))
            }
          >
            <option value={100}>100 records/source</option>
            <option value={250}>250 records/source</option>
            <option value={500}>500 records/source</option>
          </select>
        </div>
      </SectionCard>

      <div className="pig-grid">
        <div className="vs-stack">
          <SectionCard
            title="Source Coverage"
            subtitle="Records contributing to the current graph."
            right={<Badge tone="info">{sourceTotal(sources)} source records</Badge>}
          >
            <div className="pig-source-grid">
              {Object.entries(sources).map(([key, value]) => (
                <SourceCard key={key} label={key} value={value} />
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="Top Connected Intelligence Entities"
            subtitle="Entities ranked by relationship connections and graph score."
            right={<Badge tone="accent">{topEntities.length} entities</Badge>}
          >
            <div className="vs-stack">
              {loading ? (
                <EmptyState text="Loading Platform Intelligence graph..." />
              ) : !topEntities.length ? (
                <EmptyState text="No graph entities match the selected filters." />
              ) : (
                topEntities.map((node) => (
                  <EntityRow
                    key={node.id}
                    node={node}
                    selected={selectedNode?.id === node.id}
                    onSelect={setSelectedNode}
                  />
                ))
              )}
            </div>
          </SectionCard>

          <SectionCard
            title="Relationship Links"
            subtitle="Visible graph relationship edges for the active filter set."
            right={<Badge tone="demo">{visibleEdges.length} links</Badge>}
          >
            <div className="vs-stack">
              {!visibleEdges.length ? (
                <EmptyState text="No relationship links match the selected filters." />
              ) : (
                visibleEdges.slice(0, 35).map((edge, index) => (
                  <EdgeRow
                    key={`${edge.from}-${edge.to}-${edge.type || edge.label}-${index}`}
                    edge={edge}
                    nodesById={nodesById}
                  />
                ))
              )}
            </div>
          </SectionCard>
        </div>

        <div className="vs-stack">
          <SectionCard
            title="Selected Intelligence Entity"
            subtitle="Inspect the selected political graph node."
            right={selectedNode ? <Badge tone={typeTone(selectedNode.type)}>{selectedNode.type}</Badge> : null}
          >
            <SelectedEntityPanel
              node={selectedNode}
              relatedEdges={relatedEdges}
              nodesById={nodesById}
              onCreateTask={handleCreateTask}
            />
          </SectionCard>

          <SectionCard
            title="State Influence Leaders"
            subtitle="States with the strongest graph density and average score."
            right={<Badge tone="info">{summary.states_covered || 0} states</Badge>}
          >
            <div className="vs-stack">
              {statsLoading ? (
                <EmptyState text="Loading state influence..." />
              ) : !topStates.length ? (
                <EmptyState text="No state graph intelligence available yet." />
              ) : (
                topStates.map((item) => (
                  <StateInfluenceRow
                    key={item.state}
                    item={item}
                    onSelectState={(nextState) =>
                      setFilters((prev) => ({
                        ...prev,
                        state: nextState,
                      }))
                    }
                  />
                ))
              )}
            </div>
          </SectionCard>

          <SectionCard
            title="Recommended Executive Actions"
            subtitle="Graph-generated recommendations that can become Command Center work."
            right={<Badge tone="danger">{graphData.actions.length} actions</Badge>}
          >
            <div className="vs-stack">
              {!graphData.actions.length ? (
                <EmptyState text="No recommended graph actions available." />
              ) : (
                graphData.actions.slice(0, 10).map((action, index) => (
                  <ActionRow
                    key={`${action.title}-${index}`}
                    action={action}
                    onCreateTask={handleCreateTask}
                  />
                ))
              )}
            </div>
          </SectionCard>
        </div>
      </div>
    </PageShell>
  );
}
