import { useEffect, useMemo, useState } from "react";
import { api } from "../../services/api";
import SectionCard from "../ui/SectionCard";
import Badge from "../ui/Badge";
import EmptyState from "../ui/EmptyState";
import ResponsiveRow from "../ui/ResponsiveRow";

function n(value, fallback = 0) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function fmtPercent(value) {
  return `${Math.round(Math.max(0, Math.min(100, n(value))))}%`;
}

function fmtNum(value) {
  return n(value).toLocaleString();
}

function toneByScore(value) {
  const score = n(value);
  if (score >= 85) return "danger";
  if (score >= 70) return "demo";
  if (score >= 50) return "info";
  return "accent";
}

function cleanType(value = "") {
  return String(value || "entity").replace(/_/g, " ");
}

function getEntityName(item = {}) {
  return item.entity_name || item.name || item.target_name || item.source_name || item.title || "Related entity";
}

function getRelationshipType(item = {}) {
  return item.relationship_type || item.edge_type || item.type || item.source_table || "relationship";
}

async function fetchGraphContext({ entityType, entityId, entityName, state }) {
  const params = {
    entityType,
    entity_type: entityType,
    entityId,
    entity_id: entityId,
    entityName,
    entity_name: entityName,
    state,
    limit: 25,
  };

  if (typeof api.politicalGraphContext === "function") {
    return api.politicalGraphContext(params);
  }

  if (typeof api.getPoliticalGraphContext === "function") {
    return api.getPoliticalGraphContext(params);
  }

  try {
    const response = await api.get("/political-graph/context", { params, timeout: 15000 });
    return response?.data || response;
  } catch {
    const response = await api.get("/political-graph/entity", { params, timeout: 15000 });
    return response?.data || response;
  }
}

function normalizePayload(payload = {}) {
  const graph = payload.graph || payload.data || payload;

  const nodes = safeArray(graph.nodes || graph.related_nodes || graph.relatedNodes || graph.entities || graph.results);
  const edges = safeArray(graph.edges || graph.relationships || graph.links || graph.relationship_forecasts);
  const actions = safeArray(graph.actions || graph.recommended_actions || graph.tasks || graph.recommendations);

  const selected =
    graph.selected ||
    graph.entity ||
    graph.profile ||
    graph.focus ||
    nodes.find((node) => node.is_selected || node.selected) ||
    null;

  const selectedScore =
    selected?.influence_score ??
    selected?.score ??
    selected?.centrality_score ??
    graph.selected_score ??
    graph.score ??
    graph.influence_score ??
    0;

  return {
    matched: Boolean((payload.matched ?? graph.matched) ?? Boolean(nodes.length || edges.length || selected)),
    nodes,
    edges,
    actions,
    selected,
    selectedScore,
    raw: payload,
  };
}

function MetricTile({ label, value, detail, tone = "info" }) {
  return (
    <div className={`pg-terminal-metric ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </div>
  );
}

function MiniGauge({ value, label }) {
  const score = Math.max(0, Math.min(100, Math.round(n(value))));

  return (
    <div className={`pg-terminal-gauge ${toneByScore(score)}`} style={{ "--score": `${score}%` }}>
      <div className="pg-terminal-gauge-core">
        <strong>{score}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}

function BarSignal({ label, value }) {
  const score = Math.max(0, Math.min(100, Math.round(n(value))));

  return (
    <div className={`pg-terminal-bar ${toneByScore(score)}`}>
      <div className="pg-terminal-bar-top">
        <span>{label}</span>
        <strong>{fmtPercent(score)}</strong>
      </div>
      <div className="pg-terminal-bar-track">
        <i style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

export default function PoliticalGraphContextPanel({
  entityType = "",
  entityId = "",
  entityName = "",
  state = "",
  title = "Political Graph Context",
  subtitle = "Relationship intelligence connected to this entity.",
  compact = false,
}) {
  const [payload, setPayload] = useState({
    matched: false,
    nodes: [],
    edges: [],
    actions: [],
    selected: null,
    selectedScore: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadContext() {
    if (!entityName && !entityId) {
      setPayload({
        matched: false,
        nodes: [],
        edges: [],
        actions: [],
        selected: null,
        selectedScore: 0,
      });
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetchGraphContext({
        entityType,
        entityId,
        entityName,
        state,
      });

      setPayload(normalizePayload(response));
    } catch (err) {
      const status = err?.response?.status;
      if (status === 404) {
        setError("Political Graph context endpoint is not available yet.");
      } else if (status === 401) {
        setError("Political Graph context requires an active sign-in token.");
      } else {
        setError(err?.response?.data?.error || err?.message || "Unable to load Political Graph context.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadContext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityType, entityId, entityName, state]);

  const nodes = safeArray(payload.nodes);
  const edges = safeArray(payload.edges);
  const actions = safeArray(payload.actions);

  const selectedScore = n(payload.selectedScore);
  const topNode = nodes[0] || null;
  const topEdge = edges[0] || null;

  const averageNodeScore = useMemo(() => {
    if (!nodes.length) return 0;
    const total = nodes.reduce(
      (sum, node) =>
        sum +
        n(
          node.influence_score ??
            node.score ??
            node.centrality_score ??
            node.strength_score ??
            node.weight
        ),
      0
    );
    return Math.round(total / nodes.length);
  }, [nodes]);

  const topRelationshipScore = n(
    topEdge?.strength_score ??
      topEdge?.strength ??
      topEdge?.weight ??
      topEdge?.probability ??
      0
  );

  return (
    <div className={`pg-terminal-panel ${compact ? "is-compact" : ""}`}>
      <style>{`
        .pg-terminal-panel {
          min-width: 0;
          width: 100%;
        }

        .pg-terminal-panel * {
          box-sizing: border-box;
        }

        .pg-terminal-panel .pg-terminal-shell {
          border-radius: 24px;
          border: 1px solid rgba(96, 165, 250, 0.18);
          background:
            radial-gradient(circle at top right, rgba(59, 130, 246, 0.13), transparent 34%),
            radial-gradient(circle at bottom left, rgba(168, 85, 247, 0.12), transparent 36%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(2, 6, 23, 0.72));
          overflow: hidden;
        }

        .pg-terminal-header {
          padding: 16px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 14px;
          align-items: start;
          border-bottom: 1px solid rgba(148, 163, 184, 0.12);
        }

        .pg-terminal-kicker {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 8px;
        }

        .pg-terminal-title {
          margin: 0;
          color: #fff;
          font-size: ${compact ? "18px" : "22px"};
          line-height: 1.08;
          letter-spacing: -0.045em;
          font-weight: 950;
          overflow-wrap: anywhere;
        }

        .pg-terminal-subtitle {
          margin: 6px 0 0;
          color: rgba(203, 213, 225, 0.72);
          font-size: 12px;
          line-height: 1.45;
          overflow-wrap: anywhere;
        }

        .pg-terminal-actions {
          display: flex;
          gap: 8px;
          align-items: center;
          justify-content: flex-end;
          flex-wrap: wrap;
        }

        .pg-terminal-body {
          padding: 16px;
          display: grid;
          gap: 14px;
        }

        .pg-terminal-metrics {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
          min-width: 0;
        }

        .pg-terminal-metric {
          min-width: 0;
          border-radius: 18px;
          border: 1px solid rgba(148, 163, 184, 0.14);
          background: rgba(15, 23, 42, 0.62);
          padding: 13px;
          overflow: hidden;
          position: relative;
        }

        .pg-terminal-metric::after {
          content: "";
          position: absolute;
          inset: auto 0 0;
          height: 2px;
          background: rgba(96, 165, 250, 0.72);
        }

        .pg-terminal-metric.danger::after { background: rgba(248, 113, 113, 0.9); }
        .pg-terminal-metric.demo::after { background: rgba(251, 191, 36, 0.9); }
        .pg-terminal-metric.active::after { background: rgba(74, 222, 128, 0.9); }

        .pg-terminal-metric span {
          display: block;
          color: rgba(147, 197, 253, 0.9);
          font-size: 10px;
          line-height: 1.2;
          font-weight: 950;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          white-space: normal;
          overflow-wrap: anywhere;
          word-break: normal;
        }

        .pg-terminal-metric strong {
          display: block;
          margin-top: 7px;
          color: #fff;
          font-size: 28px;
          line-height: 0.95;
          letter-spacing: -0.055em;
          font-weight: 980;
          white-space: nowrap;
        }

        .pg-terminal-metric p {
          margin: 8px 0 0;
          color: rgba(226, 232, 240, 0.66);
          font-size: 11px;
          line-height: 1.25;
          white-space: normal;
          overflow-wrap: anywhere;
          word-break: normal;
        }

        .pg-terminal-intel {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(220px, 0.45fr);
          gap: 14px;
          align-items: stretch;
        }

        .pg-terminal-card {
          min-width: 0;
          border-radius: 20px;
          border: 1px solid rgba(148, 163, 184, 0.14);
          background: rgba(2, 6, 23, 0.38);
          padding: 14px;
          overflow: hidden;
        }

        .pg-terminal-card-title {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
        }

        .pg-terminal-card-title strong {
          color: white;
          font-size: 13px;
          font-weight: 950;
          letter-spacing: -0.02em;
          overflow-wrap: anywhere;
        }

        .pg-terminal-grid-list {
          display: grid;
          gap: 10px;
        }

        .pg-terminal-row {
          min-width: 0;
          border-radius: 16px;
          border: 1px solid rgba(148, 163, 184, 0.1);
          background: rgba(15, 23, 42, 0.48);
          padding: 11px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 10px;
          align-items: center;
        }

        .pg-terminal-row h4 {
          margin: 0;
          color: rgba(255,255,255,0.94);
          font-size: 12px;
          line-height: 1.25;
          font-weight: 900;
          overflow-wrap: anywhere;
        }

        .pg-terminal-row p {
          margin: 4px 0 0;
          color: rgba(203, 213, 225, 0.64);
          font-size: 11px;
          line-height: 1.35;
          overflow-wrap: anywhere;
        }

        .pg-terminal-gauge {
          width: 112px;
          height: 112px;
          border-radius: 999px;
          background: conic-gradient(rgba(96, 165, 250, 0.92) var(--score), rgba(30, 41, 59, 0.82) 0);
          display: grid;
          place-items: center;
          margin-inline: auto;
          flex: none;
        }

        .pg-terminal-gauge.danger {
          background: conic-gradient(rgba(248, 113, 113, 0.94) var(--score), rgba(30, 41, 59, 0.82) 0);
        }

        .pg-terminal-gauge.demo {
          background: conic-gradient(rgba(251, 191, 36, 0.94) var(--score), rgba(30, 41, 59, 0.82) 0);
        }

        .pg-terminal-gauge-core {
          width: 92px;
          height: 92px;
          border-radius: inherit;
          background: rgba(2, 6, 23, 0.9);
          display: grid;
          place-items: center;
          align-content: center;
          text-align: center;
        }

        .pg-terminal-gauge-core strong {
          color: #fff;
          font-size: 26px;
          font-weight: 980;
          letter-spacing: -0.06em;
        }

        .pg-terminal-gauge-core span {
          color: rgba(203, 213, 225, 0.66);
          font-size: 9px;
          font-weight: 950;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .pg-terminal-bars {
          display: grid;
          gap: 12px;
          margin-top: 14px;
        }

        .pg-terminal-bar {
          display: grid;
          gap: 6px;
        }

        .pg-terminal-bar-top {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          color: rgba(203, 213, 225, 0.72);
          font-size: 10px;
          font-weight: 950;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .pg-terminal-bar-top span {
          white-space: normal;
          overflow-wrap: anywhere;
        }

        .pg-terminal-bar-top strong {
          color: white;
          white-space: nowrap;
        }

        .pg-terminal-bar-track {
          height: 8px;
          border-radius: 999px;
          background: rgba(30, 41, 59, 0.82);
          overflow: hidden;
        }

        .pg-terminal-bar-track i {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, rgba(96, 165, 250, 0.72), rgba(34, 211, 238, 0.96));
        }

        .pg-terminal-bar.danger .pg-terminal-bar-track i {
          background: linear-gradient(90deg, rgba(239, 68, 68, 0.72), rgba(248, 113, 113, 0.96));
        }

        .pg-terminal-bar.demo .pg-terminal-bar-track i {
          background: linear-gradient(90deg, rgba(245, 158, 11, 0.72), rgba(251, 191, 36, 0.96));
        }

        .pg-terminal-bar.active .pg-terminal-bar-track i {
          background: linear-gradient(90deg, rgba(34, 197, 94, 0.72), rgba(74, 222, 128, 0.96));
        }

        .pg-terminal-error {
          border-radius: 18px;
          border: 1px solid rgba(248, 113, 113, 0.22);
          background: rgba(127, 29, 29, 0.18);
          color: rgba(254, 226, 226, 0.92);
          padding: 12px;
          font-size: 12px;
          line-height: 1.45;
        }

        @media (max-width: 1100px) {
          .pg-terminal-metrics {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .pg-terminal-intel {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .pg-terminal-header,
          .pg-terminal-row {
            grid-template-columns: 1fr;
          }

          .pg-terminal-actions {
            justify-content: flex-start;
          }

          .pg-terminal-metrics {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="pg-terminal-shell">
        <div className="pg-terminal-header">
          <div>
            <div className="pg-terminal-kicker">
              <Badge tone={payload.matched ? "active" : "demo"}>
                {payload.matched ? "Matched" : "Scanning"}
              </Badge>
              {state ? <Badge tone="info">{state}</Badge> : null}
              {entityType ? <Badge tone="accent">{cleanType(entityType)}</Badge> : null}
            </div>
            <h3 className="pg-terminal-title">{title}</h3>
            <p className="pg-terminal-subtitle">{subtitle}</p>
          </div>

          <div className="pg-terminal-actions">
            <button type="button" className="vs-button vs-button-secondary" disabled={loading} onClick={loadContext}>
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        <div className="pg-terminal-body">
          {error ? <div className="pg-terminal-error">{error}</div> : null}

          <div className="pg-terminal-metrics">
            <MetricTile label="Related Nodes" value={fmtNum(nodes.length)} detail="Connected entities" tone="info" />
            <MetricTile label="Graph Edges" value={fmtNum(edges.length)} detail="Relationships" tone="active" />
            <MetricTile label="Actions" value={fmtNum(actions.length)} detail="Recommended tasks" tone="demo" />
            <MetricTile label="Selected Score" value={Math.round(selectedScore)} detail="Graph influence" tone={toneByScore(selectedScore)} />
          </div>

          {!loading && !nodes.length && !edges.length && !actions.length ? (
            <EmptyState text="No Political Graph context is available for this forecast yet." />
          ) : (
            <div className="pg-terminal-intel">
              <div className="pg-terminal-card">
                <div className="pg-terminal-card-title">
                  <strong>Related Political Graph Nodes</strong>
                  <Badge tone="info">{nodes.length}</Badge>
                </div>

                <div className="pg-terminal-grid-list">
                  {nodes.slice(0, compact ? 4 : 8).map((node, index) => (
                    <div className="pg-terminal-row" key={node.entity_key || node.id || `${getEntityName(node)}-${index}`}>
                      <div>
                        <h4>{getEntityName(node)}</h4>
                        <p>
                          {cleanType(node.entity_type || node.type || "entity")}
                          {node.state ? ` • ${node.state}` : ""}
                          {node.total_connections ? ` • ${node.total_connections} connections` : ""}
                        </p>
                      </div>
                      <Badge tone={toneByScore(node.influence_score || node.score || node.centrality_score)}>
                        {fmtPercent(node.influence_score || node.score || node.centrality_score)}
                      </Badge>
                    </div>
                  ))}

                  {!nodes.length && loading ? <EmptyState text="Loading related nodes..." /> : null}
                </div>
              </div>

              <div className="pg-terminal-card">
                <div className="pg-terminal-card-title">
                  <strong>Relationship Strength</strong>
                  <Badge tone={toneByScore(topRelationshipScore)}>{fmtPercent(topRelationshipScore)}</Badge>
                </div>

                <MiniGauge value={averageNodeScore || selectedScore || topRelationshipScore} label="Influence" />

                <div className="pg-terminal-bars">
                  <BarSignal label="Selected influence" value={selectedScore} />
                  <BarSignal label="Average node score" value={averageNodeScore} />
                  <BarSignal label="Top relationship" value={topRelationshipScore} />
                </div>
              </div>
            </div>
          )}

          {edges.length ? (
            <SectionCard
              title="Relationship Edges"
              subtitle="Highest-confidence graph connections related to this forecast."
              right={<Badge tone="active">{edges.length}</Badge>}
            >
              <div className="vs-stack">
                {edges.slice(0, compact ? 4 : 8).map((edge, index) => (
                  <ResponsiveRow
                    key={edge.edge_key || edge.id || `${edge.source_key}-${edge.target_key}-${index}`}
                    title={`${edge.source_name || edge.source_key || "Source"} → ${edge.target_name || edge.target_key || "Target"}`}
                    subtitle={cleanType(getRelationshipType(edge))}
                    meta={[
                      { label: "Strength", value: fmtPercent(edge.strength_score || edge.strength || edge.weight) },
                      { label: "Source", value: cleanType(edge.source_table || edge.source || "graph") },
                    ]}
                    right={
                      <Badge tone={toneByScore(edge.strength_score || edge.strength || edge.weight)}>
                        {fmtPercent(edge.strength_score || edge.strength || edge.weight)}
                      </Badge>
                    }
                  />
                ))}
              </div>
            </SectionCard>
          ) : null}

          {actions.length ? (
            <SectionCard
              title="Recommended Actions"
              subtitle="Operational tasks generated from this graph context."
              right={<Badge tone="demo">{actions.length}</Badge>}
            >
              <div className="vs-stack">
                {actions.slice(0, compact ? 3 : 6).map((action, index) => (
                  <ResponsiveRow
                    key={action.action_key || action.id || index}
                    title={action.title || action.action || "Recommended action"}
                    subtitle={action.detail || action.description || "Graph-driven operational recommendation."}
                    meta={[
                      { label: "Priority", value: action.priority || "medium" },
                      { label: "Owner", value: action.owner || action.recommended_owner || "Political Intelligence" },
                    ]}
                    right={<Badge tone={toneByScore(action.score || action.priority_score || 65)}>{action.priority || "Action"}</Badge>}
                  />
                ))}
              </div>
            </SectionCard>
          ) : null}
        </div>
      </div>
    </div>
  );
}
