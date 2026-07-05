import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import ResponsiveRow from "../components/ui/ResponsiveRow";

const ENTITY_TYPE_LABELS = {
  firm: "Firm Organization",
  workspace: "Campaign Workspace",
  signal: "Political Intelligence Signal",
  client: "Client Account",
  project: "Campaign Project",
  vendor: "Vendor Partner",
  report: "Intelligence Report",
  contact: "Relationship Contact",
  task: "Command Center Task",
  state: "State Intelligence Profile",
  county: "County Intelligence Profile",
  coalition: "Coalition Intelligence Group",
  donor: "Donor Network Entity",
  candidate: "Candidate Profile",
  race: "Election Race",
  operation: "Campaign Operation",
};

const RISK_LABELS = {
  critical: "Critical Risk",
  high: "High Risk",
  elevated: "Elevated Monitoring Risk",
  medium: "Medium Monitoring Risk",
  watch: "Watch List",
  "at risk": "At Risk",
  overdue: "Overdue",
  stable: "Stable",
  active: "Active",
  generated: "Generated",
  strong: "Strong",
  monitoring: "Executive Monitoring",
};

const STATES = [
  ["AL", "Alabama"],
  ["AK", "Alaska"],
  ["AZ", "Arizona"],
  ["AR", "Arkansas"],
  ["CA", "California"],
  ["CO", "Colorado"],
  ["CT", "Connecticut"],
  ["DE", "Delaware"],
  ["DC", "District of Columbia"],
  ["FL", "Florida"],
  ["GA", "Georgia"],
  ["HI", "Hawaii"],
  ["ID", "Idaho"],
  ["IL", "Illinois"],
  ["IN", "Indiana"],
  ["IA", "Iowa"],
  ["KS", "Kansas"],
  ["KY", "Kentucky"],
  ["LA", "Louisiana"],
  ["ME", "Maine"],
  ["MD", "Maryland"],
  ["MA", "Massachusetts"],
  ["MI", "Michigan"],
  ["MN", "Minnesota"],
  ["MS", "Mississippi"],
  ["MO", "Missouri"],
  ["MT", "Montana"],
  ["NE", "Nebraska"],
  ["NV", "Nevada"],
  ["NH", "New Hampshire"],
  ["NJ", "New Jersey"],
  ["NM", "New Mexico"],
  ["NY", "New York"],
  ["NC", "North Carolina"],
  ["ND", "North Dakota"],
  ["OH", "Ohio"],
  ["OK", "Oklahoma"],
  ["OR", "Oregon"],
  ["PA", "Pennsylvania"],
  ["RI", "Rhode Island"],
  ["SC", "South Carolina"],
  ["SD", "South Dakota"],
  ["TN", "Tennessee"],
  ["TX", "Texas"],
  ["UT", "Utah"],
  ["VT", "Vermont"],
  ["VA", "Virginia"],
  ["WA", "Washington"],
  ["WV", "West Virginia"],
  ["WI", "Wisconsin"],
  ["WY", "Wyoming"],
];

function stateRisk(index) {
  if ([2, 10, 22, 28, 37, 48].includes(index)) return "High";
  if ([5, 9, 21, 25, 33, 38, 42, 45].includes(index)) return "Elevated";
  if ([6, 16, 24, 30, 34, 39, 43].includes(index)) return "Watch";
  return "Stable";
}

function stateScore(index) {
  return 62 + ((index * 7) % 34);
}

function buildNationalFallback() {
  const root = {
    id: "firm-main",
    type: "firm",
    label: "VoterSpheres Executive Network",
    state: "National Coverage",
    risk: "Stable",
    score: 94,
    meta: {
      description: "Central enterprise political intelligence network across all states.",
      coverage: "National political graph coverage",
    },
  };

  const stateNodes = STATES.map(([code, name], index) => ({
    id: `state-${code.toLowerCase()}`,
    type: "state",
    label: `${name} State Intelligence Profile`,
    state: name,
    state_code: code,
    risk: stateRisk(index),
    score: stateScore(index),
    meta: {
      state_name: name,
      state_code: code,
      strategic_summary: `${name} state intelligence profile with campaign, vendor, signal, and operations relationships.`,
      produced_information: "State profile, risk status, relationship score, connected assets, and executive monitoring context.",
    },
  }));

  const priorityAssets = [
    {
      id: "workspace-ga",
      type: "workspace",
      label: "Georgia Battleground Workspace",
      state: "Georgia",
      risk: "Active",
      score: 86,
      meta: { focus: "Field operations, coalition movement, vendor readiness." },
    },
    {
      id: "signal-ga",
      type: "signal",
      label: "Georgia Forecast Movement Signal",
      state: "Georgia",
      risk: "High",
      score: 88,
      meta: { source: "Executive Forecast Engine" },
    },
    {
      id: "task-ga",
      type: "task",
      label: "Georgia Command Center Follow-Up Task",
      state: "Georgia",
      risk: "Active",
      score: 76,
      meta: { owner: "Executive Operations" },
    },
    {
      id: "workspace-pa",
      type: "workspace",
      label: "Pennsylvania Coalition Workspace",
      state: "Pennsylvania",
      risk: "Watch",
      score: 81,
      meta: { focus: "Coalition volatility and persuasion response." },
    },
    {
      id: "signal-pa",
      type: "signal",
      label: "Pennsylvania Coalition Instability Signal",
      state: "Pennsylvania",
      risk: "Elevated",
      score: 78,
      meta: { source: "National Coalition Intelligence" },
    },
    {
      id: "vendor-az",
      type: "vendor",
      label: "Arizona Vendor Readiness Partner",
      state: "Arizona",
      risk: "Medium",
      score: 69,
      meta: { source: "Vendor Intelligence Network" },
    },
    {
      id: "client-national",
      type: "client",
      label: "National Campaign Client",
      state: "National Coverage",
      risk: "Stable",
      score: 84,
      meta: { account: "Enterprise client account." },
    },
    {
      id: "report-brief",
      type: "report",
      label: "Executive Intelligence Brief",
      state: "National Coverage",
      risk: "Generated",
      score: 91,
      meta: { report_type: "Executive intelligence report." },
    },
  ];

  const edges = [
    ...stateNodes.map((node, index) => ({
      id: `edge-root-${node.id}`,
      source: root.id,
      target: node.id,
      weight: index % 6 === 0 ? 3 : 2,
    })),
    { id: "edge-ga-workspace", source: "state-ga", target: "workspace-ga", weight: 3 },
    { id: "edge-ga-signal", source: "workspace-ga", target: "signal-ga", weight: 3 },
    { id: "edge-ga-task", source: "workspace-ga", target: "task-ga", weight: 2 },
    { id: "edge-pa-workspace", source: "state-pa", target: "workspace-pa", weight: 3 },
    { id: "edge-pa-signal", source: "workspace-pa", target: "signal-pa", weight: 3 },
    { id: "edge-az-vendor", source: "state-az", target: "vendor-az", weight: 2 },
    { id: "edge-client-report", source: "client-national", target: "report-brief", weight: 2 },
    { id: "edge-root-client", source: root.id, target: "client-national", weight: 2 },
    { id: "edge-report-ga", source: "report-brief", target: "signal-ga", weight: 1 },
    { id: "edge-report-pa", source: "report-brief", target: "signal-pa", weight: 1 },
  ];

  return {
    summary: {
      nodes: 1 + stateNodes.length + priorityAssets.length,
      edges: edges.length,
      high_risk: stateNodes.filter((node) => ["High", "Critical"].includes(node.risk)).length + 1,
      states: stateNodes.length,
      workspaces: 2,
      signals: 2,
      clients: 1,
      reports: 1,
    },
    nodes: [root, ...stateNodes, ...priorityAssets],
    edges,
    type_counts: {},
  };
}

const fallbackGraphData = buildNationalFallback();

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

function labelize(value = "") {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function fullEntityType(value = "") {
  const key = String(value || "").toLowerCase();
  return ENTITY_TYPE_LABELS[key] || labelize(value || "Political Intelligence Entity");
}

function fullRisk(value = "") {
  const key = String(value || "").toLowerCase();
  return RISK_LABELS[key] || labelize(value || "Stable");
}

function tone(value) {
  const v = String(value || "").toLowerCase();
  if (["critical", "high", "at risk", "overdue"].includes(v)) return "danger";
  if (["elevated", "watch", "medium", "monitoring", "open"].includes(v)) return "demo";
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
    state: "rgba(56, 189, 248, 0.92)",
    county: "rgba(45, 212, 191, 0.9)",
    coalition: "rgba(217, 70, 239, 0.9)",
    donor: "rgba(250, 204, 21, 0.9)",
    candidate: "rgba(251, 113, 133, 0.9)",
    race: "rgba(129, 140, 248, 0.9)",
    operation: "rgba(251, 146, 60, 0.9)",
  }[type] || "rgba(148, 163, 184, 0.9)";
}

function nodeId(node) {
  return String(node?.id ?? node?.node_id ?? node?.key ?? "");
}

function edgeSource(edge) {
  return String(edge?.source ?? edge?.source_id ?? edge?.from ?? edge?.from_id ?? edge?.start ?? edge?.start_id ?? "");
}

function edgeTarget(edge) {
  return String(edge?.target ?? edge?.target_id ?? edge?.to ?? edge?.to_id ?? edge?.end ?? edge?.end_id ?? "");
}

function edgeConnects(edge, id) {
  const next = String(id ?? "");
  return edgeSource(edge) === next || edgeTarget(edge) === next;
}

function otherEdgeId(edge, id) {
  const next = String(id ?? "");
  if (edgeSource(edge) === next) return edgeTarget(edge);
  if (edgeTarget(edge) === next) return edgeSource(edge);
  return "";
}

function normalizeLoadedData(result) {
  const backendNodes = arr(result?.nodes);
  const backendEdges = arr(result?.edges);

  if (!backendNodes.length) return fallbackGraphData;

  const hasStateCoverage = backendNodes.some((node) => String(node.type || "").toLowerCase() === "state");
  const hasRoot = backendNodes.some((node) => String(node.type || "").toLowerCase() === "firm");

  if (hasStateCoverage && backendEdges.length) {
    return {
      summary: result?.summary || fallbackGraphData.summary,
      nodes: backendNodes,
      edges: backendEdges,
      type_counts: result?.type_counts || {},
    };
  }

  const fallback = buildNationalFallback();
  const existingIds = new Set(backendNodes.map(nodeId));
  const fallbackAdditions = fallback.nodes.filter((node) => !existingIds.has(nodeId(node)));
  const mergedNodes = hasRoot ? [...backendNodes, ...fallbackAdditions] : [...fallback.nodes, ...backendNodes];

  const mergedIds = new Set(mergedNodes.map(nodeId));
  const safeBackendEdges = backendEdges.filter((edge) => mergedIds.has(edgeSource(edge)) && mergedIds.has(edgeTarget(edge)));
  const existingEdgeKeys = new Set(safeBackendEdges.map((edge) => `${edgeSource(edge)}-${edgeTarget(edge)}`));
  const fallbackEdges = fallback.edges.filter((edge) => !existingEdgeKeys.has(`${edgeSource(edge)}-${edgeTarget(edge)}`));

  return {
    summary: {
      ...(result?.summary || {}),
      nodes: mergedNodes.length,
      edges: safeBackendEdges.length + fallbackEdges.length,
      states: STATES.length,
    },
    nodes: mergedNodes,
    edges: [...safeBackendEdges, ...fallbackEdges],
    type_counts: result?.type_counts || fallback.type_counts,
  };
}

function connectedNodeIdsFor(edges, selected) {
  const selectedId = nodeId(selected);
  const ids = new Set();

  edges.forEach((edge) => {
    const other = otherEdgeId(edge, selectedId);
    if (other) ids.add(other);
  });

  return ids;
}

function GraphCanvas({ nodes, edges, selectedId, onSelect }) {
  const selectedNode = nodes.find((node) => nodeId(node) === String(selectedId || "")) || nodes[0];
  const connectedIds = connectedNodeIdsFor(edges, selectedNode);
  const connectedNodes = nodes.filter((node) => connectedIds.has(nodeId(node)));

  const groups = [
    { key: "state", title: "State Intelligence Profiles" },
    { key: "workspace", title: "Campaign Workspaces" },
    { key: "signal", title: "Intelligence Signals" },
    { key: "client", title: "Client Accounts" },
    { key: "project", title: "Campaign Projects" },
    { key: "vendor", title: "Vendor Network" },
    { key: "report", title: "Intelligence Reports" },
    { key: "contact", title: "Relationship Contacts" },
    { key: "task", title: "Command Center Tasks" },
    { key: "candidate", title: "Candidate Profiles" },
    { key: "donor", title: "Donor Network Entities" },
    { key: "coalition", title: "Coalition Intelligence Groups" },
    { key: "race", title: "Election Races" },
    { key: "operation", title: "Campaign Operations" },
  ]
    .map((group) => ({
      ...group,
      items: connectedNodes.filter((node) => String(node.type || "").toLowerCase() === group.key),
    }))
    .filter((group) => group.items.length);

  const ungrouped = connectedNodes.filter(
    (node) => !groups.some((group) => group.items.some((item) => nodeId(item) === nodeId(node)))
  );

  if (ungrouped.length) {
    groups.push({ key: "other", title: "Additional Political Intelligence Assets", items: ungrouped });
  }

  if (!selectedNode) {
    return <EmptyState text="Select an entity to open the Executive Intelligence Canvas." />;
  }

  return (
    <div className="pig-canvas-pro">
      <div className="pig-canvas-header">
        <div>
          <div className="pig-pro-kicker">Executive Intelligence Canvas</div>
          <h3>{selectedNode.label}</h3>
          <p>{fullEntityType(selectedNode.type)} · {selectedNode.state || "National Coverage"}</p>
        </div>

        <div className="pig-selected-meta">
          <Badge tone="info">{fullEntityType(selectedNode.type)}</Badge>
          <Badge tone={tone(selectedNode.risk)}>{fullRisk(selectedNode.risk)}</Badge>
          <Badge tone="accent">Relationship Score: {selectedNode.score || 0}</Badge>
          <Badge tone="active">{connectedNodes.length} Connected Intelligence Assets</Badge>
        </div>
      </div>

      <div className="pig-canvas-body">
        <div className="pig-canvas-centerline" />

        <div className="pig-canvas-root-node">
          <div className="pig-canvas-root-ring">
            <span className="pig-canvas-root-dot" style={{ background: nodeColor(selectedNode.type) }} />
          </div>
          <strong>{selectedNode.label}</strong>
          <small>{fullEntityType(selectedNode.type)}</small>
        </div>

        <div className="pig-canvas-lanes">
          {groups.map((group, groupIndex) => (
            <div key={group.key} className="pig-canvas-lane">
              <div className="pig-canvas-lane-title">
                <span style={{ background: nodeColor(group.key) }} />
                <div>
                  <strong>{group.title}</strong>
                  <small>{group.items.length} connected intelligence assets</small>
                </div>
              </div>

              <div className="pig-canvas-node-grid">
                {group.items.slice(0, 18).map((node, index) => (
                  <button
                    key={nodeId(node)}
                    type="button"
                    className="pig-canvas-node-card"
                    onClick={() => onSelect(node)}
                    style={{ "--delay": `${(groupIndex + index) * 30}ms` }}
                  >
                    <div className="pig-canvas-node-line" />

                    <div className="pig-canvas-node-top">
                      <span className="pig-pro-dot" style={{ background: nodeColor(node.type) }} />
                      <Badge tone={tone(node.risk)}>{fullRisk(node.risk)}</Badge>
                    </div>

                    <h4>{node.label}</h4>
                    <p>{fullEntityType(node.type)} · {node.state || "National Coverage"}</p>

                    <div className="pig-canvas-node-meta">
                      <span>Information Produced</span>
                      <strong>{node.meta?.produced_information || node.meta?.strategic_summary || "Relationship, risk, score, geography, and operational context."}</strong>
                      <span>Relationship Score</span>
                      <strong>{node.score || 0}</strong>
                      <span>Geographic Coverage</span>
                      <strong>{node.state || "National Coverage"}</strong>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {!groups.length ? (
          <EmptyState text="No connected intelligence assets are available for this entity." />
        ) : null}
      </div>
    </div>
  );
}

function NodeListRow({ node, active, onSelect, connectionCount }) {
  return (
    <button
      type="button"
      className={active ? "pig-node-list-row is-active" : "pig-node-list-row"}
      onClick={() => onSelect(node)}
    >
      <ResponsiveRow
        title={node.label}
        subtitle={`${fullEntityType(node.type)} · ${node.state || "National Coverage"}`}
        meta={[
          { label: "Entity Type", value: fullEntityType(node.type) },
          { label: "Risk Status", value: fullRisk(node.risk) },
          { label: "Relationship Score", value: node.score || 0 },
          { label: "Connection Count", value: connectionCount },
        ]}
      />
    </button>
  );
}

function MetaRow({ label, value, type }) {
  return (
    <div className="pig-row">
      <ResponsiveRow
        title={labelize(label)}
        subtitle={clean(String(value ?? "No value available"))}
        meta={[
          { label: "Field Name", value: labelize(label) },
          { label: "Entity Type", value: fullEntityType(type) },
          { label: "Field Value", value: clean(String(value ?? "No value available")) },
        ]}
      />
    </div>
  );
}

export default function PoliticalIntelligenceGraph() {
  const [data, setData] = useState(fallbackGraphData);
  const [filters, setFilters] = useState({
    q: "",
    state: "",
    type: "",
    risk: "",
  });
  const [selected, setSelected] = useState(null);
  const [viewMode, setViewMode] = useState("focus");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");

  const load = useCallback(async ({ quiet = false } = {}) => {
    try {
      if (quiet) setRefreshing(true);
      else setLoading(true);

      setError("");

      const result = await api.politicalIntelligenceGraph({
        q: filters.q,
        state: filters.state,
        type: filters.type,
      });

      const normalized = normalizeLoadedData(result);
      setData(normalized);

      setSelected((current) => {
        if (current && normalized.nodes.some((node) => nodeId(node) === nodeId(current))) return current;
        return normalized.nodes[0] || null;
      });

      setLastUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.response?.data?.detail ||
          err?.message ||
          "Failed to load Political Intelligence Graph. National fallback intelligence is active."
      );
      setData(fallbackGraphData);
      setSelected(fallbackGraphData.nodes[0]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters.q, filters.state, filters.type]);

  useEffect(() => {
    load();
  }, [load]);

  const allNodes = arr(data.nodes);
  const allEdges = arr(data.edges);
  const summary = data.summary || {};

  const states = useMemo(() => {
    return Array.from(new Set([...STATES.map(([, name]) => name), ...allNodes.map((node) => node.state).filter(Boolean)])).sort();
  }, [allNodes]);

  const types = useMemo(() => {
    return Array.from(new Set(allNodes.map((node) => String(node.type || "").toLowerCase()).filter(Boolean))).sort();
  }, [allNodes]);

  const risks = useMemo(() => {
    return Array.from(new Set(allNodes.map((node) => node.risk).filter(Boolean))).sort();
  }, [allNodes]);

  const filteredNodes = useMemo(() => {
    const q = String(filters.q || "").toLowerCase();

    return allNodes.filter((node) => {
      const searchable = [node.label, node.type, node.state, node.risk, node.state_code, ...Object.values(node.meta || {})]
        .join(" ")
        .toLowerCase();

      const matchesQ = !q || searchable.includes(q);
      const matchesState = !filters.state || String(node.state || "") === filters.state;
      const matchesType = !filters.type || String(node.type || "").toLowerCase() === filters.type;
      const matchesRisk = !filters.risk || String(node.risk || "") === filters.risk;

      return matchesQ && matchesState && matchesType && matchesRisk;
    });
  }, [allNodes, filters]);

  const filteredNodeIds = useMemo(() => new Set(filteredNodes.map(nodeId)), [filteredNodes]);

  const filteredEdges = useMemo(() => {
    if (viewMode === "focus") return allEdges;
    return allEdges.filter((edge) => filteredNodeIds.has(edgeSource(edge)) && filteredNodeIds.has(edgeTarget(edge)));
  }, [allEdges, filteredNodeIds, viewMode]);

  const selectedEdges = useMemo(() => {
    if (!selected) return [];
    return allEdges.filter((edge) => edgeConnects(edge, nodeId(selected)));
  }, [allEdges, selected]);

  const connectedNodes = useMemo(() => {
    if (!selected) return [];
    const ids = connectedNodeIdsFor(allEdges, selected);
    return allNodes.filter((node) => ids.has(nodeId(node)));
  }, [allNodes, allEdges, selected]);

  const canvasNodes = useMemo(() => {
    if (viewMode === "full") return filteredNodes;
    if (!selected) return filteredNodes;
    const ids = connectedNodeIdsFor(allEdges, selected);
    ids.add(nodeId(selected));
    return allNodes.filter((node) => ids.has(nodeId(node)));
  }, [allNodes, allEdges, filteredNodes, selected, viewMode]);

  const highRiskCount = filteredNodes.filter((node) =>
    ["critical", "high", "at risk", "overdue"].includes(String(node.risk || "").toLowerCase())
  ).length;

  return (
    <PageShell
      eyebrow="Political Intelligence Graph"
      title="Political Intelligence Graph"
      description="Executive Intelligence Canvas for navigating all-state political intelligence, relationships, risk status, produced information, and connected campaign assets."
      tickerItems={[
        { label: "Visible Entities", value: `${filteredNodes.length}`, dotClass: "vs-live-dot-success" },
        { label: "All States", value: `${STATES.length}`, dotClass: "vs-live-dot-success" },
        { label: "Connected Assets", value: `${connectedNodes.length}`, dotClass: "vs-live-dot-success" },
        { label: "Updated", value: refreshing ? "Live" : lastUpdated || "Ready", dotClass: refreshing ? "vs-live-dot-warning" : "vs-live-dot-success" },
      ]}
    >
      <style>{`
        .pig-enterprise-grid {
          display: grid;
          grid-template-columns: minmax(360px, 0.72fr) minmax(0, 1.45fr) minmax(360px, 0.78fr);
          gap: 18px;
          align-items: start;
        }

        .pig-stack {
          display: grid;
          gap: 14px;
        }

        .pig-controls {
          display: grid;
          grid-template-columns: minmax(260px, 1fr) repeat(3, minmax(150px, 190px)) auto auto;
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
          min-width: 0;
        }

        .pig-node-list-row,
        .pig-row,
        .pig-node-summary-card {
          border-radius: 20px;
          border: 1px solid rgba(148, 163, 184, .16);
          background:
            radial-gradient(circle at top right, rgba(59, 130, 246, .1), transparent 34%),
            linear-gradient(135deg, rgba(15, 23, 42, .78), rgba(2, 6, 23, .54));
          overflow: hidden;
          min-width: 0;
        }

        .pig-node-list-row {
          width: 100%;
          padding: 0;
          color: inherit;
          text-align: left;
          cursor: pointer;
        }

        .pig-node-list-row:hover,
        .pig-node-list-row.is-active {
          border-color: rgba(251, 146, 60, 0.48);
          background: rgba(251, 146, 60, 0.08);
        }

        .pig-node-list-row .vs-responsive-row,
        .pig-row .vs-responsive-row {
          border: 0;
          background: transparent;
        }

        .pig-node-list-row .vs-responsive-meta,
        .pig-row .vs-responsive-meta {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
        }

        .pig-node-list-row .vs-responsive-meta *,
        .pig-row .vs-responsive-meta * {
          white-space: normal;
          overflow-wrap: anywhere;
          max-width: 100%;
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
          line-height: 1.25;
          white-space: normal;
        }

        .pig-dot,
        .pig-pro-dot {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          flex: 0 0 auto;
          box-shadow: 0 0 16px rgba(255, 255, 255, 0.2);
        }

        .pig-selected-panel {
          border: 1px solid rgba(251, 146, 60, 0.30);
          border-radius: 24px;
          background:
            radial-gradient(circle at top right, rgba(251, 146, 60, 0.14), transparent 36%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.72), rgba(2, 6, 23, 0.55));
          padding: 18px;
        }

        .pig-selected-panel h3 {
          margin: 8px 0 10px;
          color: var(--vs-text);
          font-size: 22px;
          line-height: 1.25;
          letter-spacing: -0.04em;
          overflow-wrap: anywhere;
        }

        .pig-selected-panel p {
          margin: 0;
          color: var(--vs-text-muted);
          font-size: 12px;
          line-height: 1.6;
        }

        .pig-selected-meta {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 14px;
        }

        .pig-pro-kicker {
          color: var(--vs-brand-orange, #fb923c);
          font-size: 10px;
          font-weight: 950;
          text-transform: uppercase;
          letter-spacing: 0.14em;
        }

        .pig-canvas-pro {
          position: relative;
          display: grid;
          gap: 18px;
          min-height: 640px;
        }

        .pig-canvas-header {
          display: flex;
          justify-content: space-between;
          gap: 18px;
          align-items: flex-start;
          border: 1px solid rgba(251, 146, 60, 0.34);
          border-radius: 28px;
          padding: 22px;
          background:
            radial-gradient(circle at top right, rgba(251, 146, 60, 0.18), transparent 36%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.86), rgba(2, 6, 23, 0.64));
          box-shadow: 0 22px 70px rgba(0, 0, 0, 0.28);
        }

        .pig-canvas-header h3 {
          margin: 8px 0 8px;
          color: var(--vs-text);
          font-size: 28px;
          line-height: 1.18;
          letter-spacing: -0.05em;
          overflow-wrap: anywhere;
        }

        .pig-canvas-header p {
          margin: 0;
          color: var(--vs-text-muted);
          line-height: 1.55;
        }

        .pig-canvas-body {
          position: relative;
          overflow: hidden;
          border: 1px solid rgba(148, 163, 184, 0.16);
          border-radius: 30px;
          padding: 24px;
          background:
            radial-gradient(circle at center, rgba(59, 130, 246, 0.14), transparent 34%),
            radial-gradient(circle at top right, rgba(251, 146, 60, 0.10), transparent 30%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.82), rgba(2, 6, 23, 0.62));
        }

        .pig-canvas-centerline {
          position: absolute;
          top: 112px;
          bottom: 34px;
          left: 50%;
          width: 2px;
          background: linear-gradient(180deg, rgba(251, 146, 60, 0.78), rgba(148, 163, 184, 0.12));
          border-radius: 999px;
          opacity: 0.75;
        }

        .pig-canvas-root-node {
          position: relative;
          z-index: 2;
          width: min(100%, 520px);
          margin: 0 auto 28px;
          text-align: center;
          border: 1px solid rgba(251, 146, 60, 0.30);
          border-radius: 26px;
          padding: 20px;
          background: rgba(2, 6, 23, 0.72);
        }

        .pig-canvas-root-ring {
          width: 58px;
          height: 58px;
          margin: 0 auto 12px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(251, 146, 60, 0.45);
          background: rgba(251, 146, 60, 0.08);
          box-shadow: 0 0 32px rgba(251, 146, 60, 0.18);
        }

        .pig-canvas-root-dot {
          width: 28px;
          height: 28px;
          border-radius: 999px;
          box-shadow: 0 0 22px rgba(255, 255, 255, 0.22);
        }

        .pig-canvas-root-node strong {
          display: block;
          color: var(--vs-text);
          font-size: 18px;
          line-height: 1.25;
          overflow-wrap: anywhere;
        }

        .pig-canvas-root-node small {
          display: block;
          margin-top: 6px;
          color: var(--vs-text-muted);
        }

        .pig-canvas-lanes {
          position: relative;
          z-index: 2;
          display: grid;
          gap: 18px;
        }

        .pig-canvas-lane {
          border: 1px solid rgba(148, 163, 184, 0.14);
          border-radius: 24px;
          padding: 16px;
          background: rgba(15, 23, 42, 0.52);
          backdrop-filter: blur(16px);
        }

        .pig-canvas-lane-title {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 14px;
        }

        .pig-canvas-lane-title > span {
          width: 12px;
          height: 12px;
          border-radius: 999px;
          box-shadow: 0 0 18px rgba(255, 255, 255, 0.18);
        }

        .pig-canvas-lane-title strong {
          display: block;
          color: var(--vs-text);
          font-size: 14px;
        }

        .pig-canvas-lane-title small {
          display: block;
          margin-top: 3px;
          color: var(--vs-text-muted);
          font-size: 11px;
        }

        .pig-canvas-node-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .pig-canvas-node-card {
          position: relative;
          border: 1px solid rgba(148, 163, 184, 0.16);
          border-radius: 20px;
          padding: 16px;
          text-align: left;
          color: inherit;
          cursor: pointer;
          min-width: 0;
          background:
            radial-gradient(circle at top right, rgba(59, 130, 246, 0.10), transparent 34%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.76), rgba(2, 6, 23, 0.56));
          animation: pigCanvasIn 0.28s ease both;
          animation-delay: var(--delay, 0ms);
        }

        .pig-canvas-node-card:hover {
          border-color: rgba(251, 146, 60, 0.48);
          background: rgba(251, 146, 60, 0.08);
          transform: translateY(-1px);
        }

        .pig-canvas-node-line {
          position: absolute;
          top: -14px;
          left: 26px;
          width: 2px;
          height: 14px;
          background: rgba(251, 146, 60, 0.35);
        }

        .pig-canvas-node-top {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          align-items: center;
          margin-bottom: 12px;
        }

        .pig-canvas-node-card h4 {
          margin: 0 0 7px;
          color: var(--vs-text);
          font-size: 15px;
          line-height: 1.35;
          overflow-wrap: anywhere;
        }

        .pig-canvas-node-card p {
          margin: 0 0 14px;
          color: var(--vs-text-muted);
          font-size: 12px;
          line-height: 1.5;
        }

        .pig-canvas-node-meta {
          display: grid;
          grid-template-columns: 1fr;
          gap: 6px;
        }

        .pig-canvas-node-meta span {
          color: var(--vs-text-muted);
          font-size: 10px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.09em;
        }

        .pig-canvas-node-meta strong {
          color: var(--vs-text);
          font-size: 13px;
          line-height: 1.35;
          overflow-wrap: anywhere;
        }

        @keyframes pigCanvasIn {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 1500px) {
          .pig-enterprise-grid {
            grid-template-columns: minmax(340px, 0.8fr) minmax(0, 1.2fr);
          }

          .pig-right-column {
            grid-column: 1 / -1;
          }
        }

        @media (max-width: 1100px) {
          .pig-enterprise-grid,
          .pig-controls {
            grid-template-columns: 1fr;
          }

          .pig-canvas-header {
            flex-direction: column;
          }

          .pig-canvas-node-grid {
            grid-template-columns: 1fr;
          }

          .pig-canvas-centerline {
            display: none;
          }
        }
      `}</style>

      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}

      <div className="vs-grid-4">
        <StatCard label="Visible Political Intelligence Entities" value={fmt(filteredNodes.length)} delta={`${fmt(summary.nodes || allNodes.length)} total entities`} tone="up" />
        <StatCard label="National State Coverage" value={fmt(STATES.length)} delta="All states and District of Columbia" tone="up" />
        <StatCard label="Connected Intelligence Assets" value={fmt(connectedNodes.length)} delta="First-degree relationships" tone="up" />
        <StatCard label="High Risk Political Entities" value={fmt(highRiskCount)} delta="Entities requiring attention" tone={highRiskCount ? "down" : "up"} />
      </div>

      <SectionCard title="Graph Controls" subtitle="Search, filter, and switch between focused relationship view and full network view.">
        <div className="pig-controls">
          <input
            placeholder="Search entities, metadata, states, risks, or labels..."
            value={filters.q}
            onChange={(event) => setFilters({ ...filters, q: event.target.value })}
          />

          <select value={filters.state} onChange={(event) => setFilters({ ...filters, state: event.target.value })}>
            <option value="">All Geographic Coverage</option>
            {states.map((state) => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>

          <select value={filters.type} onChange={(event) => setFilters({ ...filters, type: event.target.value })}>
            <option value="">All Entity Types</option>
            {types.map((type) => (
              <option key={type} value={type}>{fullEntityType(type)}</option>
            ))}
          </select>

          <select value={filters.risk} onChange={(event) => setFilters({ ...filters, risk: event.target.value })}>
            <option value="">All Risk Levels</option>
            {risks.map((risk) => (
              <option key={risk} value={risk}>{fullRisk(risk)}</option>
            ))}
          </select>

          <button
            type="button"
            className="vs-button vs-button-secondary"
            onClick={() => setViewMode(viewMode === "focus" ? "full" : "focus")}
          >
            {viewMode === "focus" ? "Focus View" : "Full Network View"}
          </button>

          <button type="button" className="vs-button" onClick={() => load({ quiet: true })}>
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </SectionCard>

      {loading ? (
        <EmptyState text="Loading Political Intelligence Graph..." />
      ) : (
        <div className="pig-enterprise-grid">
          <div className="pig-stack">
            <SectionCard
              title="Entity Navigator"
              subtitle="Select any state or entity to focus the canvas on its connected intelligence."
              right={<Badge tone="info">{filteredNodes.length} Entities</Badge>}
            >
              {!filteredNodes.length ? (
                <EmptyState text="No graph entities match the current filters." />
              ) : (
                <div className="pig-stack">
                  {filteredNodes.slice(0, 72).map((node) => (
                    <NodeListRow
                      key={nodeId(node)}
                      node={node}
                      active={nodeId(selected) === nodeId(node)}
                      onSelect={setSelected}
                      connectionCount={allEdges.filter((edge) => edgeConnects(edge, nodeId(node))).length}
                    />
                  ))}
                </div>
              )}
            </SectionCard>
          </div>

          <div className="pig-stack">
            <SectionCard
              title={viewMode === "focus" ? "Executive Intelligence Canvas" : "Full Political Intelligence Network"}
              subtitle={
                viewMode === "focus"
                  ? "Focused canvas showing the selected entity and connected intelligence assets."
                  : "Expanded network mode using the current filters."
              }
              right={<Badge tone="accent">{connectedNodes.length} Connected Assets</Badge>}
            >
              {!canvasNodes.length ? (
                <EmptyState text="No visible graph nodes available." />
              ) : (
                <GraphCanvas
                  nodes={viewMode === "focus" ? allNodes : canvasNodes}
                  edges={viewMode === "focus" ? allEdges : filteredEdges}
                  selectedId={nodeId(selected)}
                  onSelect={setSelected}
                />
              )}
            </SectionCard>

            <SectionCard title="Graph Legend" subtitle="Full entity type names used in the political intelligence graph.">
              <div className="pig-legend">
                {types.length ? types.map((type) => (
                  <span key={type}>
                    <i className="pig-dot" style={{ background: nodeColor(type) }} />
                    {fullEntityType(type)}
                  </span>
                )) : Object.keys(ENTITY_TYPE_LABELS).map((type) => (
                  <span key={type}>
                    <i className="pig-dot" style={{ background: nodeColor(type) }} />
                    {fullEntityType(type)}
                  </span>
                ))}
              </div>
            </SectionCard>
          </div>

          <div className="pig-stack pig-right-column">
            <SectionCard
              title="Selected Entity Intelligence"
              subtitle="Entity details, risk status, relationship score, and produced information."
              right={selected ? <Badge tone={tone(selected.risk)}>{fullRisk(selected.risk)}</Badge> : null}
            >
              {!selected ? (
                <EmptyState text="Select an entity in the graph." />
              ) : (
                <div className="pig-stack">
                  <div className="pig-selected-panel">
                    <div className="vs-page-eyebrow">Selected Political Intelligence Entity</div>
                    <h3>{selected.label}</h3>
                    <p>{fullEntityType(selected.type)} · {selected.state || "National Coverage"}</p>
                    <div className="pig-selected-meta">
                      <Badge tone="info">{fullEntityType(selected.type)}</Badge>
                      <Badge tone={tone(selected.risk)}>{fullRisk(selected.risk)}</Badge>
                      <Badge tone="accent">Relationship Score: {selected.score || 0}</Badge>
                      <Badge tone="active">{selectedEdges.length} Connections</Badge>
                    </div>
                  </div>

                  {Object.entries(selected.meta || {}).slice(0, 10).map(([key, value]) => (
                    <MetaRow key={key} label={key} value={value} type={selected.type} />
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard
              title="Connected Political Intelligence"
              subtitle="Immediate neighbors connected to the selected entity."
              right={<Badge tone="accent">{connectedNodes.length} Connected Entities</Badge>}
            >
              <div className="pig-stack">
                {!connectedNodes.length ? (
                  <EmptyState text="No connected entities selected." />
                ) : (
                  connectedNodes.slice(0, 18).map((item) => (
                    <div key={nodeId(item)} className="pig-row">
                      <ResponsiveRow
                        title={item.label}
                        subtitle={`${fullEntityType(item.type)} · ${item.state || "National Coverage"}`}
                        meta={[
                          { label: "Entity Type", value: fullEntityType(item.type) },
                          { label: "Risk Status", value: fullRisk(item.risk) },
                          { label: "Geographic Coverage", value: item.state || "National Coverage" },
                          { label: "Relationship Score", value: item.score || 0 },
                        ]}
                        right={<Badge tone={tone(item.risk)}>{fullRisk(item.risk)}</Badge>}
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

