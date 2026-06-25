import { useEffect, useMemo, useState } from "react";
import { api } from "../../services/api";

import SectionCard from "../ui/SectionCard";
import StatCard from "../ui/StatCard";
import Badge from "../ui/Badge";
import EmptyState from "../ui/EmptyState";
import ResponsiveRow from "../ui/ResponsiveRow";

function normalizeText(value = "") {
  return String(value || "").trim();
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

  if (value.includes("candidate")) return "accent";
  if (value.includes("donor")) return "danger";
  if (value.includes("vendor")) return "info";
  if (value.includes("endorsement")) return "demo";
  if (value.includes("task")) return "active";
  if (value.includes("state")) return "active";

  return "default";
}

function priorityTone(priority) {
  const value = normalizeText(priority).toLowerCase();

  if (value.includes("high") || value.includes("critical")) return "danger";
  if (value.includes("medium") || value.includes("elevated")) return "demo";
  if (value.includes("low") || value.includes("normal")) return "info";

  return "default";
}

function getNodeTitle(node = {}) {
  return (
    node.label ||
    node.name ||
    node.title ||
    node.endorser_name ||
    node.vendor_name ||
    node.donor_name ||
    node.candidate_name ||
    "Unnamed Intelligence Node"
  );
}

function getNodeSubtitle(node = {}) {
  return (
    node.subtitle ||
    [
      node.type,
      node.state,
      node.raw?.office,
      node.raw?.category,
      node.raw?.endorser_type,
      node.raw?.donor_type,
      node.raw?.status,
    ]
      .filter(Boolean)
      .join(" • ") ||
    "Related platform intelligence"
  );
}

function getNodeScore(node = {}) {
  return Number(
    node.score ||
      node.raw?.endorsement_score ||
      node.raw?.influence_score ||
      node.raw?.coverage_score ||
      node.raw?.relationship_score ||
      0
  );
}

function getNodeValue(node = {}) {
  return Number(
    node.value ||
      node.raw?.amount ||
      node.raw?.total_amount ||
      node.raw?.receipts ||
      node.raw?.total_receipts ||
      node.raw?.contract_value ||
      0
  );
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

async function fetchRelatedIntelligence(params) {
  if (typeof api.platformIntelligenceEntity === "function") {
    return api.platformIntelligenceEntity(params);
  }

  const response = await api.get("/platform-intelligence/entity", {
    params,
    timeout: 12000,
  });

  return response?.data || response;
}

async function createTask(payload) {
  if (typeof api.createTask === "function") {
    return api.createTask(payload);
  }

  if (typeof api.post === "function") {
    const response = await api.post("/tasks", payload);
    return response?.data || response;
  }

  throw new Error("Task API is not available in this frontend build.");
}

function RelatedNodeRow({ node, onInspect }) {
  const title = getNodeTitle(node);
  const subtitle = getNodeSubtitle(node);
  const score = getNodeScore(node);
  const value = getNodeValue(node);

  return (
    <ResponsiveRow
      title={title}
      subtitle={subtitle}
      meta={[
        {
          label: "Type",
          value: node.type || "Intelligence",
        },
        {
          label: "State",
          value: node.state || node.raw?.state || "National",
        },
        {
          label: "Score",
          value: score ? `${Math.round(score)}/100` : "N/A",
        },
        {
          label: "Value",
          value: value ? formatMoney(value) : "N/A",
        },
      ]}
      right={
        <div className="pi-related-actions">
          <Badge tone={typeTone(node.type)}>{node.type || "Node"}</Badge>
          <button
            type="button"
            className="vs-button vs-button-secondary"
            onClick={() => onInspect(node)}
          >
            Inspect
          </button>
        </div>
      }
    />
  );
}

function RelatedEdgeRow({ edge, nodesById }) {
  const from = nodesById[edge.from] || {};
  const to = nodesById[edge.to] || {};

  return (
    <ResponsiveRow
      title={`${getNodeTitle(from)} → ${getNodeTitle(to)}`}
      subtitle={edge.label || "Relationship link"}
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
          {edge.label || "Relationship"}
        </Badge>
      }
    />
  );
}

function ActionRow({ action, onCreateTask }) {
  return (
    <ResponsiveRow
      title={action.title || "Recommended Action"}
      subtitle={action.detail || action.description || "Platform Intelligence recommendation"}
      meta={[
        {
          label: "State",
          value: action.state || "National",
        },
        {
          label: "Owner",
          value: action.owner || action.assigned_to || "Political Intelligence",
        },
        {
          label: "Priority",
          value: action.priority || "Medium",
        },
        {
          label: "Source",
          value: action.source || "platform_intelligence",
        },
      ]}
      right={
        <div className="pi-related-actions">
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

export default function RelatedIntelligencePanel({
  entityType = "",
  entityId = "",
  entityName = "",
  state = "",
  title = "Related Intelligence",
  subtitle = "Connected candidates, donors, vendors, endorsements, states, and Command Center actions.",
  mode = "standard",
  compact = false,
  limit = 120,
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [selectedNode, setSelectedNode] = useState(null);

  const [data, setData] = useState({
    entity: null,
    related_nodes: [],
    related_edges: [],
    actions: [],
    summary: {
      related_count: 0,
      relationship_count: 0,
      entity_found: false,
    },
  });

  const requestParams = useMemo(
    () => ({
      entityType,
      entityId,
      entityName,
      state,
      limit,
    }),
    [entityType, entityId, entityName, state, limit]
  );

  async function loadRelatedIntelligence() {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      const payload = await fetchRelatedIntelligence(requestParams);

      const nextData = {
        entity: payload?.entity || null,
        related_nodes: safeArray(payload?.related_nodes),
        related_edges: safeArray(payload?.related_edges),
        actions: safeArray(payload?.actions),
        summary: payload?.summary || {
          related_count: 0,
          relationship_count: 0,
          entity_found: false,
        },
      };

      setData(nextData);
      setSelectedNode(nextData.entity || nextData.related_nodes?.[0] || null);
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to load related platform intelligence."
      );

      setData({
        entity: null,
        related_nodes: [],
        related_edges: [],
        actions: [],
        summary: {
          related_count: 0,
          relationship_count: 0,
          entity_found: false,
        },
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!entityType && !entityName && !entityId && !state) {
      setLoading(false);
      return;
    }

    loadRelatedIntelligence();
  }, [requestParams]); // eslint-disable-line react-hooks/exhaustive-deps

  const nodesById = useMemo(() => {
    const map = {};

    if (data.entity?.id) {
      map[data.entity.id] = data.entity;
    }

    for (const node of data.related_nodes || []) {
      if (node?.id) map[node.id] = node;
    }

    return map;
  }, [data.entity, data.related_nodes]);

  const score = selectedNode ? getNodeScore(selectedNode) : 0;
  const value = selectedNode ? getNodeValue(selectedNode) : 0;

  async function handleCreateTask(action) {
    try {
      setMessage("Creating Command Center task...");

      const payload = {
        title:
          action.title ||
          `Review platform intelligence: ${entityName || selectedNode?.label || "Entity"}`,
        description:
          action.detail ||
          action.description ||
          `Review connected platform intelligence for ${
            entityName || selectedNode?.label || "selected entity"
          }.`,
        source: action.source || "platform_intelligence",
        state: action.state || state || selectedNode?.state || "National",
        office: action.office || selectedNode?.raw?.office || "Statewide",
        priority:
          normalizeText(action.priority).toLowerCase() === "high"
            ? "high"
            : normalizeText(action.priority).toLowerCase() === "medium"
            ? "medium"
            : "normal",
        status: "open",
        assigned_to:
          action.owner ||
          action.assigned_to ||
          "Political Intelligence",
        due_label:
          normalizeText(action.priority).toLowerCase() === "high"
            ? "Today"
            : "This Week",
        metadata: {
          entity_type: entityType,
          entity_id: entityId,
          entity_name: entityName,
          related_node_id: selectedNode?.id,
          source: "platform_intelligence_panel",
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
        <div className="pi-related-actions">
          <Badge tone={data.summary?.entity_found ? "active" : "demo"}>
            {data.summary?.entity_found ? "Matched" : "Context"}
          </Badge>
          <button
            type="button"
            className="vs-button vs-button-secondary"
            onClick={loadRelatedIntelligence}
          >
            Refresh
          </button>
        </div>
      }
    >
      <style>{`
        .pi-related-shell {
          display: grid;
          gap: 14px;
        }

        .pi-related-grid {
          display: grid;
          grid-template-columns: ${compact ? "1fr" : "minmax(0, 1.08fr) minmax(340px, 0.92fr)"};
          gap: 14px;
          align-items: start;
        }

        .pi-related-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 8px;
          flex-wrap: wrap;
        }

        .pi-related-panel {
          border: 1px solid rgba(148, 163, 184, 0.16);
          border-radius: 18px;
          background:
            radial-gradient(circle at top right, rgba(59, 130, 246, 0.10), transparent 38%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.80), rgba(15, 23, 42, 0.42));
          padding: 16px;
          display: grid;
          gap: 12px;
        }

        .pi-related-title {
          color: var(--vs-text);
          font-size: 18px;
          font-weight: 950;
          letter-spacing: -0.03em;
          line-height: 1.15;
        }

        .pi-related-subtitle {
          color: var(--vs-text-muted);
          font-size: 13px;
          line-height: 1.5;
        }

        .pi-related-tabs {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .pi-related-tab {
          border: 1px solid rgba(148, 163, 184, 0.16);
          border-radius: 999px;
          background: rgba(15, 23, 42, 0.55);
          color: var(--vs-text-muted);
          cursor: pointer;
          font-size: 12px;
          font-weight: 800;
          padding: 8px 11px;
        }

        .pi-related-tab.is-active {
          border-color: rgba(99, 102, 241, 0.58);
          background: rgba(99, 102, 241, 0.16);
          color: var(--vs-text);
        }

        @media (max-width: 1100px) {
          .pi-related-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="pi-related-shell">
        {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}
        {message ? <div className="vs-banner vs-live-banner-pulse">{message}</div> : null}

        <div className="vs-grid-4">
          <StatCard
            label="Related Nodes"
            value={data.summary?.related_count || data.related_nodes.length || 0}
            subtext="Connected entities"
          />
          <StatCard
            label="Relationship Links"
            value={data.summary?.relationship_count || data.related_edges.length || 0}
            subtext="Detected graph links"
          />
          <StatCard
            label="Actions"
            value={data.actions.length || 0}
            subtext="Recommended follow-up"
          />
          <StatCard
            label="Selected Score"
            value={selectedNode ? Math.round(score || 0) : "N/A"}
            subtext="Composite intelligence"
          />
        </div>

        {loading ? (
          <EmptyState text="Loading related platform intelligence..." />
        ) : !data.entity && !data.related_nodes.length && !data.related_edges.length ? (
          <EmptyState text="No related intelligence found yet for this context." />
        ) : (
          <div className="pi-related-grid">
            <div className="vs-stack">
              {data.entity ? (
                <RelatedNodeRow node={data.entity} onInspect={setSelectedNode} />
              ) : null}

              {data.related_nodes.length ? (
                data.related_nodes.slice(0, compact ? 6 : 12).map((node) => (
                  <RelatedNodeRow
                    key={node.id || `${node.type}-${getNodeTitle(node)}`}
                    node={node}
                    onInspect={setSelectedNode}
                  />
                ))
              ) : (
                <EmptyState text="No connected entities found." />
              )}
            </div>

            <div className="vs-stack">
              <div className="pi-related-panel">
                <div className="pi-related-actions" style={{ justifyContent: "space-between" }}>
                  <Badge tone={typeTone(selectedNode?.type)}>
                    {selectedNode?.type || "Entity"}
                  </Badge>
                  <Badge tone={scoreTone(score)}>
                    {selectedNode ? `${Math.round(score || 0)}/100` : "N/A"}
                  </Badge>
                </div>

                <div className="pi-related-title">
                  {selectedNode ? getNodeTitle(selectedNode) : "No entity selected"}
                </div>

                <div className="pi-related-subtitle">
                  {selectedNode
                    ? getNodeSubtitle(selectedNode)
                    : "Select a related entity to inspect its intelligence context."}
                </div>

                <div className="vs-grid-2">
                  <StatCard
                    label="Type"
                    value={selectedNode?.type || "N/A"}
                    subtext="Entity class"
                  />
                  <StatCard
                    label="State"
                    value={selectedNode?.state || selectedNode?.raw?.state || "National"}
                    subtext="Primary geography"
                  />
                  <StatCard
                    label="Value"
                    value={value ? formatMoney(value) : "N/A"}
                    subtext="Financial signal"
                  />
                  <StatCard
                    label="Connections"
                    value={selectedNode?.connections || 0}
                    subtext="Graph links"
                  />
                </div>

                {selectedNode ? (
                  <button
                    type="button"
                    className="vs-button"
                    onClick={() =>
                      handleCreateTask({
                        title: `Review intelligence node: ${getNodeTitle(selectedNode)}`,
                        detail: `${getNodeTitle(selectedNode)} is connected to ${
                          selectedNode.connections || 0
                        } platform intelligence relationship links.`,
                        priority: score >= 85 ? "High" : "Medium",
                        state: selectedNode.state || state || "National",
                      })
                    }
                  >
                    Create Task from Selected Entity
                  </button>
                ) : null}
              </div>

              <SectionCard
                title="Relationship Links"
                subtitle="Direct graph relationships for this entity."
                right={<Badge tone="info">{data.related_edges.length} links</Badge>}
              >
                <div className="vs-stack">
                  {!data.related_edges.length ? (
                    <EmptyState text="No direct relationship links found." />
                  ) : (
                    data.related_edges.slice(0, compact ? 4 : 8).map((edge, index) => (
                      <RelatedEdgeRow
                        key={`${edge.from}-${edge.to}-${edge.label}-${index}`}
                        edge={edge}
                        nodesById={nodesById}
                      />
                    ))
                  )}
                </div>
              </SectionCard>
            </div>
          </div>
        )}

        <SectionCard
          title="Recommended Actions"
          subtitle="Platform Intelligence actions that can become Command Center tasks."
          right={<Badge tone="demo">{data.actions.length} actions</Badge>}
        >
          <div className="vs-stack">
            {!data.actions.length ? (
              <EmptyState text="No recommended actions generated for this context yet." />
            ) : (
              data.actions.slice(0, compact ? 4 : 10).map((action, index) => (
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
    </SectionCard>
  );
}
