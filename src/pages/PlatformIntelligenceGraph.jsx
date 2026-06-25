import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import ResponsiveRow from "../components/ui/ResponsiveRow";

const ALL_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
  "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC"
];

function listFrom(payload, keys = []) {
  if (Array.isArray(payload)) return payload;
  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.rows)) return payload.rows;
  if (Array.isArray(payload?.vendors)) return payload.vendors;
  if (Array.isArray(payload?.candidates)) return payload.candidates;
  return [];
}

function asMoney(value) {
  return `$${Number(value || 0).toLocaleString()}`;
}

function asShortMoney(value) {
  const n = Number(value || 0);
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return asMoney(n);
}

function norm(value) {
  return String(value || "").trim();
}

function upperState(value) {
  const state = norm(value).toUpperCase();
  return ALL_STATES.includes(state) ? state : state;
}

function toneByType(type) {
  const t = String(type || "").toLowerCase();
  if (t.includes("candidate")) return "accent";
  if (t.includes("donor")) return "danger";
  if (t.includes("vendor")) return "info";
  if (t.includes("endorsement")) return "demo";
  if (t.includes("state")) return "active";
  return "default";
}

function scoreTone(score) {
  const s = Number(score || 0);
  if (s >= 85) return "danger";
  if (s >= 70) return "demo";
  if (s >= 50) return "info";
  return "default";
}

function safeKey(...parts) {
  return parts.map((p) => String(p || "").replace(/\s+/g, "-")).join("-");
}

async function getEndpoint(path, params = {}) {
  const response = await api.get(path, {
    params,
    timeout: 12000,
  });

  return response?.data || response;
}

function buildNodesAndEdges({ candidates, donors, vendors, endorsements }) {
  const nodeMap = new Map();
  const edges = [];

  function addNode(node) {
    if (!node?.id) return;
    if (!nodeMap.has(node.id)) {
      nodeMap.set(node.id, {
        score: 0,
        value: 0,
        ...node,
        connections: 0,
      });
    } else {
      nodeMap.set(node.id, {
        ...nodeMap.get(node.id),
        ...node,
        score: Math.max(Number(nodeMap.get(node.id).score || 0), Number(node.score || 0)),
        value: Math.max(Number(nodeMap.get(node.id).value || 0), Number(node.value || 0)),
      });
    }
  }

  function addEdge(edge) {
    if (!edge?.from || !edge?.to || edge.from === edge.to) return;
    edges.push(edge);

    const from = nodeMap.get(edge.from);
    const to = nodeMap.get(edge.to);

    if (from) nodeMap.set(edge.from, { ...from, connections: Number(from.connections || 0) + 1 });
    if (to) nodeMap.set(edge.to, { ...to, connections: Number(to.connections || 0) + 1 });
  }

  candidates.forEach((candidate, index) => {
    const id = `candidate:${candidate.id || candidate.candidate_id || candidate.name || index}`;
    const state = upperState(candidate.state || candidate.state_code);
    const name = candidate.name || candidate.candidate_name || candidate.full_name || "Unnamed Candidate";

    addNode({
      id,
      type: "Candidate",
      label: name,
      state,
      subtitle: `${state || "National"} • ${candidate.office || "Candidate"} • ${candidate.party || "Party N/A"}`,
      score: Number(candidate.power_score || candidate.score || candidate.rank_score || 50),
      value: Number(candidate.receipts || candidate.total_receipts || candidate.cash_on_hand || 0),
      raw: candidate,
    });

    if (state) {
      addNode({
        id: `state:${state}`,
        type: "State",
        label: state,
        state,
        subtitle: "Political geography",
        score: 60,
        value: 0,
      });

      addEdge({
        from: `state:${state}`,
        to: id,
        label: "candidate in state",
        strength: 70,
      });
    }
  });

  donors.forEach((donor, index) => {
    const state = upperState(donor.state || donor.contributor_state);
    const name = donor.donor_name || donor.name || donor.contributor_name || "Unnamed Donor";
    const id = `donor:${donor.id || name || index}`;

    addNode({
      id,
      type: "Donor",
      label: name,
      state,
      subtitle: `${state || "National"} • ${donor.donor_type || donor.relationship_strength || "Donor"}`,
      score: donor.relationship_strength === "High" ? 85 : donor.relationship_strength === "Medium" ? 70 : 55,
      value: Number(donor.amount || donor.total_amount || 0),
      raw: donor,
    });

    if (state) {
      addNode({
        id: `state:${state}`,
        type: "State",
        label: state,
        state,
        subtitle: "Political geography",
        score: 60,
        value: 0,
      });

      addEdge({
        from: id,
        to: `state:${state}`,
        label: "donor geography",
        strength: 55,
      });
    }

    const candidateName = norm(donor.candidate_name);
    if (candidateName) {
      const match = [...nodeMap.values()].find(
        (node) => node.type === "Candidate" && node.label.toLowerCase() === candidateName.toLowerCase()
      );

      if (match) {
        addEdge({
          from: id,
          to: match.id,
          label: "donor to candidate",
          strength: 85,
          value: Number(donor.amount || 0),
        });
      }
    }
  });

  vendors.forEach((vendor, index) => {
    const state = upperState(vendor.state || vendor.primary_state || vendor.payee_state);
    const name = vendor.vendor_name || vendor.name || "Unnamed Vendor";
    const id = `vendor:${vendor.id || vendor.vendor_id || name || index}`;

    addNode({
      id,
      type: "Vendor",
      label: name,
      state,
      subtitle: `${state || "National"} • ${vendor.category || vendor.services || "Campaign Vendor"}`,
      score: Number(vendor.coverage_score || vendor.overall_score || 62),
      value: Number(vendor.contract_value || vendor.total_amount || vendor.amount || 0),
      raw: vendor,
    });

    if (state) {
      addNode({
        id: `state:${state}`,
        type: "State",
        label: state,
        state,
        subtitle: "Political geography",
        score: 60,
        value: 0,
      });

      addEdge({
        from: `state:${state}`,
        to: id,
        label: "vendor coverage",
        strength: 75,
      });
    }
  });

  endorsements.forEach((endorsement, index) => {
    const state = upperState(endorsement.state);
    const endorser = endorsement.endorser_name || "Unnamed Endorser";
    const id = `endorsement:${endorsement.id || endorser || index}`;

    addNode({
      id,
      type: "Endorsement",
      label: endorser,
      state,
      subtitle: `${state || "National"} • ${endorsement.endorser_type || "Endorser"} • ${endorsement.status || "Status N/A"}`,
      score: Number(endorsement.endorsement_score || endorsement.influence_score || 50),
      value: Number(endorsement.financial_signal_score || 0),
      raw: endorsement,
    });

    if (state) {
      addNode({
        id: `state:${state}`,
        type: "State",
        label: state,
        state,
        subtitle: "Political geography",
        score: 60,
        value: 0,
      });

      addEdge({
        from: id,
        to: `state:${state}`,
        label: "endorsement geography",
        strength: 70,
      });
    }

    const candidateName = norm(endorsement.candidate_name);
    if (candidateName) {
      const match = [...nodeMap.values()].find(
        (node) => node.type === "Candidate" && node.label.toLowerCase() === candidateName.toLowerCase()
      );

      if (match) {
        addEdge({
          from: id,
          to: match.id,
          label: "endorses candidate",
          strength: 90,
        });
      }
    }
  });

  return {
    nodes: [...nodeMap.values()].sort(
      (a, b) =>
        Number(b.connections || 0) - Number(a.connections || 0) ||
        Number(b.score || 0) - Number(a.score || 0)
    ),
    edges,
  };
}

function NodeCard({ node, selected, onSelect }) {
  return (
    <button
      type="button"
      className={`pi-node-card ${selected ? "is-selected" : ""}`}
      onClick={() => onSelect(node)}
    >
      <div className="pi-node-top">
        <Badge tone={toneByType(node.type)}>{node.type}</Badge>
        <Badge tone={scoreTone(node.score)}>{Math.round(Number(node.score || 0))}</Badge>
      </div>

      <div className="pi-node-title">{node.label}</div>
      <div className="pi-node-subtitle">{node.subtitle}</div>

      <div className="pi-node-metrics">
        <span>{node.connections || 0} links</span>
        <span>{Number(node.value || 0) ? asShortMoney(node.value) : node.state || "National"}</span>
      </div>
    </button>
  );
}

function EdgeRow({ edge, nodesById }) {
  const from = nodesById[edge.from];
  const to = nodesById[edge.to];

  return (
    <ResponsiveRow
      title={`${from?.label || "Unknown"} → ${to?.label || "Unknown"}`}
      subtitle={edge.label || "relationship"}
      meta={[
        { label: "From", value: from?.type || "Unknown" },
        { label: "To", value: to?.type || "Unknown" },
        { label: "Strength", value: `${edge.strength || 50}/100` },
        { label: "Value", value: edge.value ? asShortMoney(edge.value) : "N/A" },
      ]}
      right={<Badge tone={scoreTone(edge.strength)}>{edge.label || "Link"}</Badge>}
    />
  );
}

function StateInfluenceRow({ item, onSelectState }) {
  return (
    <button
      type="button"
      className="pi-state-row"
      onClick={() => onSelectState(item.state)}
    >
      <div>
        <strong>{item.state}</strong>
        <span>{item.nodes} nodes • {item.edges} links</span>
      </div>
      <div>
        <b>{Math.round(item.score)}</b>
        <small>Influence</small>
      </div>
    </button>
  );
}

export default function PlatformIntelligenceGraph() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [candidates, setCandidates] = useState([]);
  const [donors, setDonors] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [endorsements, setEndorsements] = useState([]);

  const [filters, setFilters] = useState({
    search: "",
    state: "",
    type: "",
  });

  const [selectedNode, setSelectedNode] = useState(null);

  async function loadGraphData() {
    try {
      setLoading(true);
      setError("");

      const [candidatePayload, donorPayload, vendorPayload, endorsementPayload] =
        await Promise.allSettled([
          getEndpoint("/candidates", { limit: 250 }),
          getEndpoint("/donors/network", { limit: 250 }),
          getEndpoint("/vendors", { limit: 250 }),
          getEndpoint("/endorsements", { limit: 250 }),
        ]);

      const nextCandidates =
        candidatePayload.status === "fulfilled"
          ? listFrom(candidatePayload.value, ["results", "candidates"])
          : [];

      const nextDonors =
        donorPayload.status === "fulfilled"
          ? listFrom(donorPayload.value, ["results", "donors"])
          : [];

      const nextVendors =
        vendorPayload.status === "fulfilled"
          ? listFrom(vendorPayload.value, ["results", "vendors", "rows"])
          : [];

      const nextEndorsements =
        endorsementPayload.status === "fulfilled"
          ? listFrom(endorsementPayload.value, ["results", "endorsements"])
          : [];

      setCandidates(nextCandidates);
      setDonors(nextDonors);
      setVendors(nextVendors);
      setEndorsements(nextEndorsements);
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to load platform intelligence graph."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGraphData();
  }, []);

  const graph = useMemo(
    () => buildNodesAndEdges({ candidates, donors, vendors, endorsements }),
    [candidates, donors, vendors, endorsements]
  );

  const nodesById = useMemo(() => {
    return graph.nodes.reduce((acc, node) => {
      acc[node.id] = node;
      return acc;
    }, {});
  }, [graph.nodes]);

  const filteredNodes = useMemo(() => {
    const q = filters.search.trim().toLowerCase();

    return graph.nodes.filter((node) => {
      if (filters.state && upperState(node.state) !== filters.state) return false;
      if (filters.type && node.type !== filters.type) return false;

      if (q) {
        const haystack = [
          node.label,
          node.subtitle,
          node.type,
          node.state,
        ]
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(q)) return false;
      }

      return true;
    });
  }, [graph.nodes, filters]);

  const filteredNodeIds = useMemo(
    () => new Set(filteredNodes.map((node) => node.id)),
    [filteredNodes]
  );

  const filteredEdges = useMemo(() => {
    return graph.edges.filter(
      (edge) => filteredNodeIds.has(edge.from) || filteredNodeIds.has(edge.to)
    );
  }, [graph.edges, filteredNodeIds]);

  const states = useMemo(() => {
    const values = new Set(ALL_STATES);
    graph.nodes.forEach((node) => {
      if (node.state) values.add(upperState(node.state));
    });
    return [...values].filter(Boolean).sort();
  }, [graph.nodes]);

  const typeCounts = useMemo(() => {
    return graph.nodes.reduce((acc, node) => {
      acc[node.type] = (acc[node.type] || 0) + 1;
      return acc;
    }, {});
  }, [graph.nodes]);

  const stateInfluence = useMemo(() => {
    return states
      .map((state) => {
        const stateNodes = graph.nodes.filter((node) => upperState(node.state) === state);
        const stateNodeIds = new Set(stateNodes.map((node) => node.id));
        const stateEdges = graph.edges.filter(
          (edge) => stateNodeIds.has(edge.from) || stateNodeIds.has(edge.to)
        );

        const score =
          stateNodes.reduce((sum, node) => sum + Number(node.score || 0), 0) /
          Math.max(1, stateNodes.length);

        return {
          state,
          nodes: stateNodes.length,
          edges: stateEdges.length,
          score: stateNodes.length ? score : 0,
        };
      })
      .filter((item) => item.nodes > 0)
      .sort((a, b) => b.score - a.score || b.nodes - a.nodes)
      .slice(0, 12);
  }, [states, graph.nodes, graph.edges]);

  const selectedConnections = useMemo(() => {
    if (!selectedNode) return [];

    return graph.edges.filter(
      (edge) => edge.from === selectedNode.id || edge.to === selectedNode.id
    );
  }, [graph.edges, selectedNode]);

  async function createCommandTask() {
    if (!selectedNode) return;

    try {
      setMessage(`Creating Command Center task for ${selectedNode.label}...`);

      if (typeof api.createTask !== "function") {
        setMessage("Task API is unavailable on this frontend build.");
        return;
      }

      await api.createTask({
        title: `Review intelligence node: ${selectedNode.label}`,
        description: `${selectedNode.type} intelligence node with ${selectedNode.connections || 0} relationship links. Review connected donors, vendors, endorsements, candidates, and state impact.`,
        source: "platform_intelligence_graph",
        state: selectedNode.state || "National",
        office: selectedNode.raw?.office || "Statewide",
        priority: Number(selectedNode.score || 0) >= 85 ? "high" : "medium",
        status: "open",
        assigned_to: "Political Intelligence",
        due_label: Number(selectedNode.score || 0) >= 85 ? "Today" : "This Week",
        metadata: {
          node_id: selectedNode.id,
          node_type: selectedNode.type,
          node_label: selectedNode.label,
          score: selectedNode.score,
          connections: selectedNode.connections,
        },
      });

      setMessage(`Task created: ${selectedNode.label}`);
    } catch (err) {
      setMessage(err?.response?.data?.error || err?.message || "Failed to create task.");
    }
  }

  return (
    <PageShell
      eyebrow="Platform Intelligence 2.0"
      title="National Intelligence Graph"
      description="Connect candidates, donors, vendors, endorsements, and states into one operational intelligence layer."
      tickerItems={[
        { label: "Nodes", value: String(graph.nodes.length), dotClass: "vs-live-dot-success" },
        { label: "Links", value: String(graph.edges.length), dotClass: "vs-live-dot-warning" },
        { label: "States", value: String(stateInfluence.length), dotClass: "vs-live-dot-success" },
        { label: "Top Type", value: Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A", dotClass: "vs-live-dot" },
      ]}
    >
      <style>{`
        .pi-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.15fr) minmax(360px, 0.85fr);
          gap: 16px;
          align-items: start;
        }

        .pi-node-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 12px;
        }

        .pi-node-card {
          border: 1px solid rgba(148, 163, 184, 0.16);
          border-radius: 18px;
          background:
            radial-gradient(circle at top right, rgba(59, 130, 246, 0.12), transparent 36%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.86), rgba(15, 23, 42, 0.48));
          color: var(--vs-text);
          cursor: pointer;
          display: grid;
          gap: 12px;
          min-height: 170px;
          padding: 15px;
          text-align: left;
          transition: transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
        }

        .pi-node-card:hover,
        .pi-node-card.is-selected {
          transform: translateY(-2px);
          border-color: rgba(99, 102, 241, 0.58);
          box-shadow: 0 0 0 1px rgba(99, 102, 241, 0.18), 0 18px 42px rgba(2, 6, 23, 0.28);
        }

        .pi-node-top {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          align-items: center;
        }

        .pi-node-title {
          font-size: 16px;
          font-weight: 950;
          letter-spacing: -0.02em;
          line-height: 1.15;
        }

        .pi-node-subtitle {
          color: var(--vs-text-muted);
          font-size: 12px;
          line-height: 1.45;
        }

        .pi-node-metrics {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          margin-top: auto;
          color: var(--vs-text-muted);
          font-size: 12px;
          font-weight: 800;
        }

        .pi-state-row {
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

        .pi-state-row strong,
        .pi-state-row b {
          display: block;
          color: var(--vs-text);
          font-weight: 950;
        }

        .pi-state-row span,
        .pi-state-row small {
          display: block;
          color: var(--vs-text-muted);
          font-size: 12px;
          margin-top: 3px;
        }

        .pi-detail-panel {
          border: 1px solid rgba(148, 163, 184, 0.16);
          border-radius: 20px;
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.86), rgba(15, 23, 42, 0.52));
          padding: 16px;
          display: grid;
          gap: 12px;
        }

        .pi-detail-title {
          color: var(--vs-text);
          font-size: 20px;
          font-weight: 950;
          letter-spacing: -0.03em;
        }

        .pi-detail-subtitle {
          color: var(--vs-text-muted);
          font-size: 13px;
          line-height: 1.5;
        }

        @media (max-width: 1100px) {
          .pi-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}
      {message ? <div className="vs-banner vs-live-banner-pulse">{message}</div> : null}

      <div className="vs-grid-4">
        <StatCard label="Candidates" value={typeCounts.Candidate || 0} subtext="Candidate entities" tone="up" />
        <StatCard label="Donors" value={typeCounts.Donor || 0} subtext="Donor entities" tone="up" />
        <StatCard label="Vendors" value={typeCounts.Vendor || 0} subtext="Vendor entities" tone="up" />
        <StatCard label="Endorsements" value={typeCounts.Endorsement || 0} subtext="Endorser entities" tone="up" />
      </div>

      <SectionCard
        title="Graph Filters"
        subtitle="Filter the national intelligence graph by state, entity type, or keyword."
        right={
          <button type="button" className="vs-button vs-button-secondary" onClick={loadGraphData}>
            Refresh Graph
          </button>
        }
      >
        <div className="vs-grid-4">
          <input
            className="vs-input"
            value={filters.search}
            onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
            placeholder="Search candidate, donor, vendor, endorsement..."
          />

          <select
            className="vs-input"
            value={filters.state}
            onChange={(event) => setFilters((prev) => ({ ...prev, state: event.target.value }))}
          >
            <option value="">All states</option>
            {states.map((state) => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>

          <select
            className="vs-input"
            value={filters.type}
            onChange={(event) => setFilters((prev) => ({ ...prev, type: event.target.value }))}
          >
            <option value="">All entity types</option>
            {["Candidate", "Donor", "Vendor", "Endorsement", "State"].map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          <button
            type="button"
            className="vs-button"
            onClick={() => setFilters({ search: "", state: "", type: "" })}
          >
            Clear Filters
          </button>
        </div>
      </SectionCard>

      <div className="pi-grid">
        <SectionCard
          title="Connected Intelligence Nodes"
          subtitle="Each card is an entity connected through candidate, donor, vendor, endorsement, or state relationships."
          right={<Badge tone="accent">{filteredNodes.length} visible</Badge>}
        >
          {loading ? (
            <EmptyState text="Loading platform intelligence graph..." />
          ) : !filteredNodes.length ? (
            <EmptyState text="No intelligence nodes match the active filters." />
          ) : (
            <div className="pi-node-grid">
              {filteredNodes.slice(0, 120).map((node) => (
                <NodeCard
                  key={node.id}
                  node={node}
                  selected={selectedNode?.id === node.id}
                  onSelect={setSelectedNode}
                />
              ))}
            </div>
          )}
        </SectionCard>

        <div className="vs-stack">
          <SectionCard
            title="Selected Entity"
            subtitle="Inspect an entity and push follow-up work into the Command Center."
            right={selectedNode ? <Badge tone={toneByType(selectedNode.type)}>{selectedNode.type}</Badge> : null}
          >
            {!selectedNode ? (
              <EmptyState text="Select a graph node to inspect its relationships." />
            ) : (
              <div className="pi-detail-panel">
                <div className="pi-detail-title">{selectedNode.label}</div>
                <div className="pi-detail-subtitle">{selectedNode.subtitle}</div>

                <div className="vs-grid-2">
                  <StatCard label="Score" value={Math.round(Number(selectedNode.score || 0))} subtext="Composite signal" />
                  <StatCard label="Links" value={selectedNode.connections || 0} subtext="Relationship count" />
                  <StatCard label="State" value={selectedNode.state || "National"} subtext="Primary geography" />
                  <StatCard label="Value" value={Number(selectedNode.value || 0) ? asShortMoney(selectedNode.value) : "N/A"} subtext="Financial signal" />
                </div>

                <button type="button" className="vs-button" onClick={createCommandTask}>
                  Create Command Center Task
                </button>

                {selectedNode.state ? (
                  <button
                    type="button"
                    className="vs-button vs-button-secondary"
                    onClick={() => {
                      window.location.href = `/state-operations/${selectedNode.state}?source=platform-intelligence`;
                    }}
                  >
                    Open State Operations
                  </button>
                ) : null}
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="State Influence Leaders"
            subtitle="States with the strongest connected intelligence activity."
            right={<Badge tone="info">{stateInfluence.length} states</Badge>}
          >
            <div className="vs-stack">
              {!stateInfluence.length ? (
                <EmptyState text="No state influence signals yet." />
              ) : (
                stateInfluence.map((item) => (
                  <StateInfluenceRow
                    key={item.state}
                    item={item}
                    onSelectState={(state) =>
                      setFilters((prev) => ({ ...prev, state }))
                    }
                  />
                ))
              )}
            </div>
          </SectionCard>
        </div>
      </div>

      <SectionCard
        title="Relationship Links"
        subtitle="The highest-value relationship paths detected across the current graph filter."
        right={<Badge tone="demo">{filteredEdges.length} links</Badge>}
      >
        <div className="vs-stack">
          {!filteredEdges.length ? (
            <EmptyState text="No relationship links match the active filters." />
          ) : (
            filteredEdges.slice(0, 40).map((edge, index) => (
              <EdgeRow
                key={safeKey(edge.from, edge.to, edge.label, index)}
                edge={edge}
                nodesById={nodesById}
              />
            ))
          )}
        </div>
      </SectionCard>
    </PageShell>
  );
}
