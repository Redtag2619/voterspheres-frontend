import { useEffect, useMemo, useState } from "react";
import { api } from "../../services/api";
import SectionCard from "../ui/SectionCard";
import StatCard from "../ui/StatCard";
import Badge from "../ui/Badge";
import EmptyState from "../ui/EmptyState";
import ResponsiveRow from "../ui/ResponsiveRow";

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function tone(type) {
  const t = String(type || "").toLowerCase();
  if (t === "candidate") return "accent";
  if (t === "donor") return "danger";
  if (t === "vendor") return "info";
  if (t === "endorsement") return "demo";
  if (t === "task") return "active";
  if (t === "state") return "active";
  return "default";
}

function scoreTone(score) {
  const value = Number(score || 0);
  if (value >= 85) return "danger";
  if (value >= 70) return "demo";
  if (value >= 50) return "info";
  return "default";
}

function titleOf(node = {}) {
  return node.label || node.name || node.title || "Unnamed Graph Entity";
}

function subtitleOf(node = {}) {
  return (
    node.subtitle ||
    [
      node.type,
      node.state,
      node.office,
      node.party,
      node.category,
      node.endorser_type,
      node.status,
    ]
      .filter(Boolean)
      .join(" • ") ||
    "Political relationship graph entity"
  );
}

async function loadEntity(params) {
  const response = await api.get("/political-graph/entity", {
    params,
    timeout: 15000,
  });

  return response?.data || response;
}

async function createTask(payload) {
  if (typeof api.createTask === "function") {
    return api.createTask(payload);
  }

  const response = await api.post("/tasks", payload);
  return response?.data || response;
}

export default function PoliticalGraphContextPanel({
  entityType = "",
  entityId = "",
  entityName = "",
  state = "",
  title = "Political Relationship Graph",
  subtitle = "Connected donors, vendors, endorsements, candidates, states, and Command Center actions.",
  compact = false,
}) {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [data, setData] = useState({
    entity: null,
    related_nodes: [],
    related_edges: [],
    actions: [],
    summary: {},
  });

  const params = useMemo(
    () => ({
      entityType,
      entityId,
      entityName,
      state,
      limit: compact ? 100 : 250,
    }),
    [entityType, entityId, entityName, state, compact]
  );

  async function refresh() {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      const payload = await loadEntity(params);

      const next = {
        entity: payload?.entity || null,
        related_nodes: safeArray(payload?.related_nodes),
        related_edges: safeArray(payload?.related_edges),
        actions: safeArray(payload?.actions),
        summary: payload?.summary || {},
      };

      setData(next);
      setSelected(next.entity || next.related_nodes[0] || null);
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to load political graph context."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!entityType && !entityId && !entityName && !state) {
      setLoading(false);
      return;
    }

    refresh();
  }, [params]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleCreateTask(action = {}) {
    try {
      setMessage("Creating Command Center task...");

      const payload = {
        title:
          action.title ||
          `Review political graph signal: ${
            selected?.label || entityName || "Entity"
          }`,
        description:
          action.detail ||
          action.description ||
          `Review relationship graph context for ${
            selected?.label || entityName || "selected entity"
          }.`,
        source: "political_relationship_graph",
        state: action.state || selected?.state || state || "National",
        office: selected?.office || "Statewide",
        priority:
          String(action.priority || "").toLowerCase() === "high"
            ? "high"
            : "medium",
        status: "open",
        assigned_to: action.owner || "Political Intelligence",
        due_label:
          String(action.priority || "").toLowerCase() === "high"
            ? "Today"
            : "This Week",
        metadata: {
          entity_type: entityType || selected?.type,
          entity_id: entityId || selected?.id,
          entity_name: entityName || selected?.label,
          source: "political_graph_context_panel",
        },
      };

      await createTask(payload);
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
    <SectionCard
      title={title}
      subtitle={subtitle}
      right={
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Badge tone={data.summary?.entity_found ? "active" : "demo"}>
            {data.summary?.entity_found ? "Matched" : "Context"}
          </Badge>
          <button
            type="button"
            className="vs-button vs-button-secondary"
            onClick={refresh}
          >
            Refresh
          </button>
        </div>
      }
    >
      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}
      {message ? <div className="vs-banner vs-live-banner-pulse">{message}</div> : null}

      {loading ? (
        <EmptyState text="Loading political relationship graph context..." />
      ) : !data.entity && !data.related_nodes.length ? (
        <EmptyState text="No political graph relationships found yet." />
      ) : (
        <div className="vs-stack">
          <div className="vs-grid-4">
            <StatCard
              label="Related Nodes"
              value={data.related_nodes.length || 0}
              subtext="Connected entities"
            />
            <StatCard
              label="Relationships"
              value={data.related_edges.length || 0}
              subtext="Graph edges"
            />
            <StatCard
              label="Actions"
              value={data.actions.length || 0}
              subtext="Recommended tasks"
            />
            <StatCard
              label="Selected Score"
              value={selected?.score ? Math.round(Number(selected.score)) : "N/A"}
              subtext="Graph influence"
            />
          </div>

          {selected ? (
            <ResponsiveRow
              title={titleOf(selected)}
              subtitle={subtitleOf(selected)}
              meta={[
                { label: "Type", value: selected.type || "Entity" },
                { label: "State", value: selected.state || "National" },
                { label: "Score", value: selected.score || "N/A" },
                { label: "Links", value: selected.connections || 0 },
              ]}
              right={
                <Badge tone={scoreTone(selected.score)}>
                  {selected.score ? Math.round(Number(selected.score)) : "N/A"}
                </Badge>
              }
            />
          ) : null}

          <SectionCard
            title="Connected Entities"
            subtitle="Directly related graph nodes."
            right={<Badge tone="info">{data.related_nodes.length} nodes</Badge>}
          >
            <div className="vs-stack">
              {!data.related_nodes.length ? (
                <EmptyState text="No connected entities found." />
              ) : (
                data.related_nodes.slice(0, compact ? 5 : 10).map((node) => (
                  <ResponsiveRow
                    key={node.id}
                    title={titleOf(node)}
                    subtitle={subtitleOf(node)}
                    meta={[
                      { label: "Type", value: node.type || "Entity" },
                      { label: "State", value: node.state || "National" },
                      { label: "Score", value: node.score || "N/A" },
                      { label: "Links", value: node.connections || 0 },
                    ]}
                    right={
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <Badge tone={tone(node.type)}>{node.type || "Node"}</Badge>
                        <button
                          type="button"
                          className="vs-button vs-button-secondary"
                          onClick={() => setSelected(node)}
                        >
                          Inspect
                        </button>
                      </div>
                    }
                  />
                ))
              )}
            </div>
          </SectionCard>

          <SectionCard
            title="Graph Recommended Actions"
            subtitle="Turn relationship graph signals into Command Center tasks."
            right={<Badge tone="demo">{data.actions.length} actions</Badge>}
          >
            <div className="vs-stack">
              {!data.actions.length ? (
                <EmptyState text="No graph actions generated yet." />
              ) : (
                data.actions.slice(0, compact ? 4 : 8).map((action, index) => (
                  <ResponsiveRow
                    key={`${action.title}-${index}`}
                    title={action.title || "Recommended Action"}
                    subtitle={action.detail || "Political graph recommendation"}
                    meta={[
                      { label: "State", value: action.state || "National" },
                      { label: "Priority", value: action.priority || "Medium" },
                      { label: "Owner", value: action.owner || "Political Intelligence" },
                    ]}
                    right={
                      <button
                        type="button"
                        className="vs-button"
                        onClick={() => handleCreateTask(action)}
                      >
                        Create Task
                      </button>
                    }
                  />
                ))
              )}
            </div>
          </SectionCard>
        </div>
      )}
    </SectionCard>
  );
}
