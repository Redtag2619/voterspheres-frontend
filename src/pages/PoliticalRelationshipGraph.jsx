import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import ResponsiveRow from "../components/ui/ResponsiveRow";

const ENTITY_TYPES = [
  "candidate",
  "donor",
  "vendor",
  "endorsement",
  "task",
  "state",
];

const ALL_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DC", "DE", "FL", "GA", "HI",
  "IA", "ID", "IL", "IN", "KS", "KY", "LA", "MA", "MD", "ME", "MI", "MN",
  "MO", "MS", "MT", "NC", "ND", "NE", "NH", "NJ", "NM", "NV", "NY", "OH",
  "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VA", "VT", "WA",
  "WI", "WV", "WY",
];

function normalizeText(value = "") {
  return String(value || "").trim();
}

function toNumber(value, fallback = 0) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function formatMoney(value) {
  const num = Number(value || 0);

  if (num >= 1_000_000_000) return `$${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `$${Math.round(num / 1_000)}K`;

  return `$${num.toLocaleString()}`;
}

function scoreTone(score) {
  const value = Number(score || 0);

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

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function nodeTitle(node = {}) {
  if (!node) return "Unnamed Node";
  return node.label || node.name || node.title || "Unnamed Node";
}

function nodeSubtitle(node = {}) {
  if (!node) return "Political intelligence entity";

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
    "Political intelligence entity"
  );
}

function nodeScore(node = {}) {
  if (!node) return 0;
  return Number(node.score || node.raw?.score || 0);
}

function nodeValue(node = {}) {
  if (!node) return 0;

  return Number(
    node.value ||
      node.raw?.amount ||
      node.raw?.total_amount ||
      node.raw?.receipts ||
      node.raw?.contract_value ||
      0
  );
}

function sourceCount(sources = {}) {
  return Object.values(sources || {}).reduce(
    (sum, value) => sum + Number(value || 0),
    0
  );
}

async function fetchPoliticalGraph(params = {}) {
  if (typeof api.politicalGraph === "function") {
    return api.politicalGraph(params);
  }

  const response = await api.get("/political-graph", {
    params,
    timeout: 15000,
  });

  return response?.data || response;
}

async function fetchPoliticalGraphEntity(params = {}) {
  if (typeof api.politicalGraphEntity === "function") {
    return api.politicalGraphEntity(params);
  }

  const response = await api.get("/political-graph/entity", {
    params,
    timeout: 15000,
  });

  return response?.data || response;
}

async function fetchPoliticalGraphPath(params = {}) {
  if (typeof api.politicalGraphPath === "function") {
    return api.politicalGraphPath(params);
  }

  const response = await api.get("/political-graph/path", {
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

function NodeOrb({ node, selected, onSelect }) {
  if (!node) return null;

  const score = nodeScore(node);
  const size = Math.max(58, Math.min(112, 54 + Number(node.connections || 0) * 8));

  return (
    <button
      type="button"
      className={`pg-node-orb ${selected ? "is-selected" : ""}`}
      style={{
        width: size,
        height: size,
      }}
      onClick={() => onSelect(node)}
      title={nodeTitle(node)}
    >
      <span className="pg-node-type">{node.type || "node"}</span>
      <strong>{node.state || String(nodeTitle(node)).slice(0, 2)}</strong>
      <small>{Math.round(score || 0)}</small>
    </button>
  );
}

function NodeCard({ node, selected, onSelect }) {
  if (!node) return null;

  const score = nodeScore(node);
  const value = nodeValue(node);

  return (
    <button
      type="button"
      className={`pg-node-card ${selected ? "is-selected" : ""}`}
      onClick={() => onSelect(node)}
    >
      <div className="pg-node-card-top">
        <Badge tone={typeTone(node.type)}>{node.type || "node"}</Badge>
        <Badge tone={scoreTone(score)}>{Math.round(score || 0)}/100</Badge>
      </div>

      <div>
        <div className="pg-node-card-title">{nodeTitle(node)}</div>
        <div className="pg-node-card-subtitle">{nodeSubtitle(node)}</div>
      </div>

      <div className="pg-node-card-metrics">
        <span>{node.connections || 0} links</span>
        <span>{value ? formatMoney(value) : node.state || "National"}</span>
      </div>
    </button>
  );
}

function EdgeRow({ edge, nodesById }) {
  if (!edge) return null;

  const from = nodesById?.[edge.from] || {};
  const to = nodesById?.[edge.to] || {};

  return (
    <ResponsiveRow
      title={`${nodeTitle(from)} → ${nodeTitle(to)}`}
      subtitle={edge.label || edge.type || "Relationship"}
      meta={[
        {
          label: "From",
          value: from.type || "Unknown",
        },
        {
          label: "To",
          value: to.type || "Unknown",
        },
        {
          label: "Strength",
          value: `${Number(edge.strength || 50)}/100`,
        },
        {
          label: "Value",
          value: edge.value ? formatMoney(edge.value) : "N/A",
        },
      ]}
      right={
        <Badge tone={scoreTone(edge.strength)}>
          {edge.type || edge.label || "link"}
        </Badge>
      }
    />
  );
}

function ActionRow({ action, onCreateTask }) {
  if (!action) return null;

  return (
    <ResponsiveRow
      title={action.title || "Recommended Action"}
      subtitle={action.detail || "Political graph recommendation"}
      meta={[
        {
          label: "State",
          value: action.state || "National",
        },
        {
          label: "Priority",
          value: action.priority || "Medium",
        },
        {
          label: "Owner",
          value: action.owner || "Political Intelligence",
        },
        {
          label: "Source",
          value: action.source || "political_relationship_graph",
        },
      ]}
      right={
        <div className="pg-actions">
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

function StateRow({ item, onSelect }) {
  if (!item) return null;

  return (
    <button
      type="button"
      className="pg-state-row"
      onClick={() => onSelect(item.state)}
    >
      <div>
        <strong>{item.state}</strong>
        <span>
          {item.nodes || 0} nodes • {item.connections || 0} links
        </span>
      </div>
      <div>
        <b>{Math.round(Number(item.avg_score || 0))}</b>
        <small>Avg score</small>
      </div>
    </button>
  );
}

function Inspector({ node, relatedEdges = [], nodesById = {}, onCreateTask }) {
  if (!node) {
    return <EmptyState text="Select a node to inspect its relationships." />;
  }

  const score = nodeScore(node);
  const value = nodeValue(node);

  return (
    <div className="pg-inspector">
      <div className="pg-inspector-header">
        <div>
          <Badge tone={typeTone(node.type)}>{node.type || "node"}</Badge>
          <h3>{nodeTitle(node)}</h3>
          <p>{nodeSubtitle(node)}</p>
        </div>

        <Badge tone={scoreTone(score)}>{Math.round(score || 0)}/100</Badge>
      </div>

      <div className="vs-grid-2">
        <StatCard label="State" value={node.state || "National"} subtext="Primary geography" />
        <StatCard label="Links" value={node.connections || 0} subtext="Relationship count" />
        <StatCard label="Value" value={value ? formatMoney(value) : "N/A"} subtext="Financial signal" />
        <StatCard label="Score" value={Math.round(score || 0)} subtext="Influence score" />
      </div>

      <button
        type="button"
        className="vs-button"
        onClick={() =>
          onCreateTask({
            title: `Review political graph node: ${nodeTitle(node)}`,
            detail: `${nodeTitle(node)} is a ${node.type || "node"} with ${
              node.connections || 0
            } relationship links and a score of ${Math.round(score || 0)}/100.`,
            state: node.state || "National",
            priority: score >= 85 ? "High" : "Medium",
            owner: "Political Intelligence",
            source: "political_relationship_graph",
            entity_type: node.type,
            entity_id: node.id,
          })
        }
      >
        Create Task from Node
      </button>

      <SectionCard
        title="Direct Relationships"
        subtitle="Edges connected to the selected node."
        right={<Badge tone="info">{relatedEdges.length} links</Badge>}
      >
        <div className="vs-stack">
          {!relatedEdges.length ? (
            <EmptyState text="No direct relationships found for this node." />
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

export default function PoliticalRelationshipGraph() {
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

  const [selectedNode, setSelectedNode] = useState(null);
  const [pathForm, setPathForm] = useState({
    from: "",
    to: "",
  });
  const [pathResult, setPathResult] = useState({
    path: [],
    nodes: [],
  });

  const [loading, setLoading] = useState(true);
  const [pathLoading, setPathLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadGraph() {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      const payload = await fetchPoliticalGraph({
        search: filters.search,
        state: filters.state,
        limit: filters.limit,
      });

      const nextData = {
        summary: payload?.summary || {
          total_nodes: 0,
          total_edges: 0,
          by_type: {},
          states_covered: 0,
          by_state: [],
          top_nodes: [],
        },
        graph: payload?.graph || {
          nodes: [],
          edges: [],
        },
        actions: safeArray(payload?.actions),
        sources: payload?.sources || {},
      };

      nextData.graph.nodes = safeArray(nextData.graph?.nodes).filter(Boolean);
      nextData.graph.edges = safeArray(nextData.graph?.edges).filter(Boolean);

      setGraphData(nextData);

      setSelectedNode((current) => {
        if (current && nextData.graph.nodes.some((node) => node?.id === current.id)) {
          return current;
        }

        return nextData.graph.nodes?.[0] || null;
      });
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to load political relationship graph."
      );
    } finally {
      setLoading(false);
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

  const nodes = safeArray(graphData.graph?.nodes).filter(Boolean);
  const edges = safeArray(graphData.graph?.edges).filter(Boolean);
  const summary = graphData.summary || {};
  const byType = summary.by_type || {};

  const nodesById = useMemo(() => {
    return nodes.reduce((acc, node) => {
      if (node?.id) acc[node.id] = node;
      return acc;
    }, {});
  }, [nodes]);

  const visibleNodes = useMemo(() => {
    const q = normalizeText(filters.search).toLowerCase();

    return nodes.filter((node) => {
      if (!node) return false;
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
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(q)) return false;
      }

      return true;
    });
  }, [nodes, filters]);

  const visibleNodeIds = useMemo(
    () => new Set(visibleNodes.map((node) => node?.id).filter(Boolean)),
    [visibleNodes]
  );

  const visibleEdges = useMemo(() => {
    return edges.filter(
      (edge) => edge && (visibleNodeIds.has(edge.from) || visibleNodeIds.has(edge.to))
    );
  }, [edges, visibleNodeIds]);

  const relatedEdges = useMemo(() => {
    if (!selectedNode?.id) return [];

    return edges.filter(
      (edge) => edge && (edge.from === selectedNode.id || edge.to === selectedNode.id)
    );
  }, [edges, selectedNode]);

  const topNodes = useMemo(() => {
    return [...visibleNodes]
      .sort(
        (a, b) =>
          Number(b.connections || 0) - Number(a.connections || 0) ||
          nodeScore(b) - nodeScore(a)
      )
      .slice(0, 15);
  }, [visibleNodes]);

  const graphCloudNodes = useMemo(() => {
    return [...visibleNodes]
      .sort(
        (a, b) =>
          nodeScore(b) - nodeScore(a) ||
          Number(b.connections || 0) - Number(a.connections || 0)
      )
      .slice(0, 38);
  }, [visibleNodes]);

  async function handleInspectNode(node) {
    if (!node) return;

    try {
      setSelectedNode(node);
      setMessage("");

      await fetchPoliticalGraphEntity({
        id: node.id,
        entityType: node.type,
        entityName: node.label,
        state: node.state || "",
        limit: 250,
      });
    } catch {
      // Inspection still works from the current graph even if the entity call fails.
    }
  }

  async function handleCreateTask(action) {
    try {
      setMessage("Creating Command Center task...");

      const payload = {
        title: action?.title || "Review political graph signal",
        description:
          action?.detail ||
          action?.description ||
          "Review political relationship graph signal and connected entities.",
        source: action?.source || "political_relationship_graph",
        state: action?.state || selectedNode?.state || "National",
        office: action?.office || selectedNode?.office || "Statewide",
        priority:
          normalizeText(action?.priority).toLowerCase() === "high"
            ? "high"
            : normalizeText(action?.priority).toLowerCase() === "medium"
            ? "medium"
            : "normal",
        status: "open",
        assigned_to: action?.owner || "Political Intelligence",
        due_label:
          normalizeText(action?.priority).toLowerCase() === "high"
            ? "Today"
            : "This Week",
        metadata: {
          source: "political_relationship_graph",
          entity_type: action?.entity_type || selectedNode?.type,
          entity_id: action?.entity_id || selectedNode?.id,
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

  async function handlePathSearch() {
    if (!pathForm.from || !pathForm.to) {
      setMessage("Select both From and To nodes before searching for a path.");
      return;
    }

    try {
      setPathLoading(true);
      setMessage("");

      const payload = await fetchPoliticalGraphPath({
        from: pathForm.from,
        to: pathForm.to,
        search: filters.search,
        state: filters.state,
        limit: filters.limit,
      });

      setPathResult({
        path: safeArray(payload?.path),
        nodes: safeArray(payload?.nodes).filter(Boolean),
      });

      if (!payload?.path?.length) {
        setMessage("No graph path was found between those two entities.");
      }
    } catch (err) {
      setMessage(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to calculate graph path."
      );
    } finally {
      setPathLoading(false);
    }
  }

  return (
    <PageShell
      eyebrow="Political Relationship Graph"
      title="Political Relationship Graph"
      description="Explore connected candidates, donors, vendors, endorsements, states, and Command Center actions in one national relationship graph."
      tickerItems={[
        {
          label: "Nodes",
          value: `${summary.total_nodes || nodes.length || 0}`,
          dotClass: "vs-live-dot-success",
        },
        {
          label: "Edges",
          value: `${summary.total_edges || edges.length || 0}`,
          dotClass: "vs-live-dot-warning",
        },
        {
          label: "States",
          value: `${summary.states_covered || 0}`,
          dotClass: "vs-live-dot-success",
        },
        {
          label: "Sources",
          value: `${sourceCount(graphData.sources)}`,
          dotClass: "vs-live-dot",
        },
      ]}
    >
      <style>{`
        .pg-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.18fr) minmax(360px, 0.82fr);
          gap: 16px;
          align-items: start;
        }

        .pg-actions {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .pg-cloud {
          min-height: 430px;
          border: 1px solid rgba(148, 163, 184, 0.14);
          border-radius: 22px;
          background:
            radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.16), transparent 28%),
            radial-gradient(circle at 80% 30%, rgba(168, 85, 247, 0.12), transparent 30%),
            radial-gradient(circle at 40% 85%, rgba(20, 184, 166, 0.10), transparent 28%),
            rgba(15, 23, 42, 0.52);
          display: flex;
          align-content: center;
          align-items: center;
          justify-content: center;
          gap: 14px;
          flex-wrap: wrap;
          padding: 26px;
          overflow: hidden;
        }

        .pg-node-orb {
          border: 1px solid rgba(148, 163, 184, 0.22);
          border-radius: 999px;
          background:
            radial-gradient(circle at 30% 20%, rgba(255,255,255,0.22), transparent 28%),
            linear-gradient(135deg, rgba(37, 99, 235, 0.32), rgba(15, 23, 42, 0.92));
          color: var(--vs-text);
          cursor: pointer;
          display: grid;
          place-items: center;
          padding: 8px;
          text-align: center;
          transition: transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
        }

        .pg-node-orb:hover,
        .pg-node-orb.is-selected {
          transform: translateY(-3px) scale(1.03);
          border-color: rgba(99, 102, 241, 0.70);
          box-shadow: 0 0 0 1px rgba(99, 102, 241, 0.25), 0 18px 44px rgba(2, 6, 23, 0.32);
        }

        .pg-node-orb strong {
          font-size: 18px;
          font-weight: 950;
          line-height: 1;
        }

        .pg-node-orb small,
        .pg-node-type {
          font-size: 10px;
          font-weight: 850;
          color: var(--vs-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .pg-node-card {
          border: 1px solid rgba(148, 163, 184, 0.16);
          border-radius: 18px;
          background:
            radial-gradient(circle at top right, rgba(59, 130, 246, 0.12), transparent 36%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.82), rgba(15, 23, 42, 0.46));
          color: var(--vs-text);
          cursor: pointer;
          display: grid;
          gap: 12px;
          min-height: 160px;
          padding: 15px;
          text-align: left;
          transition: transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
        }

        .pg-node-card:hover,
        .pg-node-card.is-selected {
          transform: translateY(-2px);
          border-color: rgba(99, 102, 241, 0.58);
          box-shadow: 0 0 0 1px rgba(99, 102, 241, 0.18), 0 18px 42px rgba(2, 6, 23, 0.24);
        }

        .pg-node-card-top {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          align-items: center;
        }

        .pg-node-card-title {
          color: var(--vs-text);
          font-size: 15px;
          font-weight: 950;
          letter-spacing: -0.02em;
          line-height: 1.18;
        }

        .pg-node-card-subtitle {
          color: var(--vs-text-muted);
          font-size: 12px;
          line-height: 1.45;
          margin-top: 6px;
        }

        .pg-node-card-metrics {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          margin-top: auto;
          color: var(--vs-text-muted);
          font-size: 12px;
          font-weight: 800;
        }

        .pg-node-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
          gap: 12px;
        }

        .pg-inspector {
          display: grid;
          gap: 14px;
        }

        .pg-inspector-header {
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

        .pg-inspector-header h3 {
          color: var(--vs-text);
          font-size: 20px;
          font-weight: 950;
          letter-spacing: -0.03em;
          margin: 10px 0 4px;
        }

        .pg-inspector-header p {
          color: var(--vs-text-muted);
          font-size: 13px;
          line-height: 1.45;
          margin: 0;
        }

        .pg-state-row {
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

        .pg-state-row strong,
        .pg-state-row b {
          display: block;
          color: var(--vs-text);
          font-weight: 950;
        }

        .pg-state-row span,
        .pg-state-row small {
          display: block;
          color: var(--vs-text-muted);
          font-size: 12px;
          margin-top: 3px;
        }

        .pg-path-strip {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          align-items: center;
        }

        .pg-path-pill {
          border: 1px solid rgba(148, 163, 184, 0.18);
          border-radius: 999px;
          background: rgba(15, 23, 42, 0.62);
          color: var(--vs-text);
          font-size: 12px;
          font-weight: 850;
          padding: 8px 11px;
        }

        @media (max-width: 1100px) {
          .pg-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}
      {message ? <div className="vs-banner vs-live-banner-pulse">{message}</div> : null}

      <div className="vs-grid-4">
        <StatCard label="Candidates" value={byType.candidate || 0} subtext="Candidate nodes" tone="up" />
        <StatCard label="Donors" value={byType.donor || 0} subtext="Donor nodes" tone="up" />
        <StatCard label="Vendors" value={byType.vendor || 0} subtext="Vendor nodes" tone="up" />
        <StatCard label="Endorsements" value={byType.endorsement || 0} subtext="Endorsement nodes" tone="up" />
      </div>

      <SectionCard
        title="Graph Filters"
        subtitle="Search, filter, and scope the national political relationship graph."
        right={
          <div className="pg-actions">
            <Badge tone="info">{visibleNodes.length} visible</Badge>
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
            placeholder="Search names, entities, categories..."
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
              <option key={item} value={item}>
                {item}
              </option>
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
            <option value="">All types</option>
            {ENTITY_TYPES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
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

      <div className="pg-grid">
        <div className="vs-stack">
          <SectionCard
            title="Relationship Cloud"
            subtitle="High-score and high-connection entities across the political relationship graph."
            right={<Badge tone="accent">{graphCloudNodes.length} nodes</Badge>}
          >
            {loading ? (
              <EmptyState text="Loading political relationship graph..." />
            ) : !graphCloudNodes.length ? (
              <EmptyState text="No graph nodes match the active filters." />
            ) : (
              <div className="pg-cloud">
                {graphCloudNodes.map((node) => (
                  <NodeOrb
                    key={node.id}
                    node={node}
                    selected={selectedNode?.id === node.id}
                    onSelect={handleInspectNode}
                  />
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Top Connected Entities"
            subtitle="Ranked by graph connections and political intelligence score."
            right={<Badge tone="demo">{topNodes.length} ranked</Badge>}
          >
            <div className="pg-node-grid">
              {!topNodes.length ? (
                <EmptyState text="No connected entities available." />
              ) : (
                topNodes.map((node) => (
                  <NodeCard
                    key={node.id}
                    node={node}
                    selected={selectedNode?.id === node.id}
                    onSelect={handleInspectNode}
                  />
                ))
              )}
            </div>
          </SectionCard>
        </div>

        <div className="vs-stack">
          <SectionCard
            title="Node Inspector"
            subtitle="Select any graph node to view direct relationships and create follow-up work."
            right={selectedNode ? <Badge tone={typeTone(selectedNode?.type)}>{selectedNode?.type}</Badge> : null}
          >
            <Inspector
              node={selectedNode}
              relatedEdges={relatedEdges}
              nodesById={nodesById}
              onCreateTask={handleCreateTask}
            />
          </SectionCard>

          <SectionCard
            title="State Relationship Leaders"
            subtitle="States with the strongest graph activity."
            right={<Badge tone="info">{summary.states_covered || 0} states</Badge>}
          >
            <div className="vs-stack">
              {!summary.by_state?.length ? (
                <EmptyState text="No state relationship data available yet." />
              ) : (
                summary.by_state.slice(0, 10).map((item) => (
                  <StateRow
                    key={item.state}
                    item={item}
                    onSelect={(nextState) =>
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
        </div>
      </div>

      <SectionCard
        title="Path Finder"
        subtitle="Find whether two political entities are connected in the graph."
        right={<Badge tone="active">{pathResult.path.length || 0} path nodes</Badge>}
      >
        <div className="vs-grid-3">
          <select
            className="vs-input"
            value={pathForm.from}
            onChange={(event) =>
              setPathForm((prev) => ({
                ...prev,
                from: event.target.value,
              }))
            }
          >
            <option value="">From entity</option>
            {visibleNodes.slice(0, 200).map((node) => (
              <option key={node.id} value={node.id}>
                {nodeTitle(node)}
              </option>
            ))}
          </select>

          <select
            className="vs-input"
            value={pathForm.to}
            onChange={(event) =>
              setPathForm((prev) => ({
                ...prev,
                to: event.target.value,
              }))
            }
          >
            <option value="">To entity</option>
            {visibleNodes.slice(0, 200).map((node) => (
              <option key={node.id} value={node.id}>
                {nodeTitle(node)}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="vs-button"
            disabled={pathLoading}
            onClick={handlePathSearch}
          >
            {pathLoading ? "Searching..." : "Find Path"}
          </button>
        </div>

        <div style={{ marginTop: 14 }}>
          {!pathResult.nodes.length ? (
            <EmptyState text="Select two entities to calculate a relationship path." />
          ) : (
            <div className="pg-path-strip">
              {pathResult.nodes.map((node, index) => (
                <span key={`${node?.id || index}-${index}`} className="pg-path-pill">
                  {nodeTitle(node)}
                </span>
              ))}
            </div>
          )}
        </div>
      </SectionCard>

      <div className="pg-grid">
        <SectionCard
          title="Relationship List"
          subtitle="Relationship edges visible under the current filter set."
          right={<Badge tone="info">{visibleEdges.length} links</Badge>}
        >
          <div className="vs-stack">
            {!visibleEdges.length ? (
              <EmptyState text="No relationship links match the selected filters." />
            ) : (
              visibleEdges.slice(0, 45).map((edge, index) => (
                <EdgeRow
                  key={`${edge.from}-${edge.to}-${edge.type}-${index}`}
                  edge={edge}
                  nodesById={nodesById}
                />
              ))
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Recommended Actions"
          subtitle="Operational recommendations generated from relationship graph signals."
          right={<Badge tone="danger">{safeArray(graphData.actions).length} actions</Badge>}
        >
          <div className="vs-stack">
            {!safeArray(graphData.actions).length ? (
              <EmptyState text="No recommended actions generated yet." />
            ) : (
              safeArray(graphData.actions).slice(0, 16).map((action, index) => (
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
    </PageShell>
  );
}