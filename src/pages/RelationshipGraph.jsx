import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import { api } from "../services/api";
import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";

const NODE_TYPES = {
  candidate: {
    label: "Candidate",
    radius: 18,
    color: "#4f46e5",
  },
  consultant: {
    label: "Consultant",
    radius: 15,
    color: "#059669",
  },
  donor: {
    label: "Donor",
    radius: 13,
    color: "#d97706",
  },
};

function normalizeList(payload, keys = []) {
  if (Array.isArray(payload)) return payload;

  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }

  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.rows)) return payload.rows;

  return [];
}

function getCandidateName(candidate) {
  return (
    candidate?.full_name ||
    candidate?.name ||
    [candidate?.first_name, candidate?.last_name].filter(Boolean).join(" ") ||
    "Candidate"
  );
}

function getConsultantName(consultant) {
  return (
    consultant?.name ||
    consultant?.firm_name ||
    consultant?.consultant_name ||
    consultant?.company ||
    "Consultant"
  );
}

function getDonorName(donor) {
  return donor?.name || donor?.donor_name || donor?.committee_name || "Donor";
}

function safeNumber(value, fallback = 0) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function formatMoney(value) {
  const amount = safeNumber(value, 0);

  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${Math.round(amount / 1_000)}K`;

  return `$${Math.round(amount).toLocaleString()}`;
}

function scoreCandidate(candidate) {
  let score = 30;

  if (candidate?.contact_email || candidate?.email || candidate?.phone) score += 15;
  if (candidate?.website || candidate?.campaign_website) score += 10;
  if (candidate?.state) score += 8;
  if (candidate?.office) score += 8;
  if (candidate?.party) score += 5;
  if (candidate?.contact_verified) score += 12;
  if (candidate?.incumbent) score += 8;

  return Math.min(100, score);
}

function scoreConsultant(consultant) {
  let score = 35;

  if (consultant?.state || consultant?.coverage_state) score += 10;
  if (consultant?.specialty || consultant?.category) score += 10;
  if (consultant?.win_rate) score += Math.min(20, safeNumber(consultant.win_rate) / 5);
  if (consultant?.clients_count) score += Math.min(15, safeNumber(consultant.clients_count));
  if (consultant?.rating) score += Math.min(10, safeNumber(consultant.rating) * 2);

  return Math.min(100, Math.round(score));
}

function scoreDonor(donor) {
  const amount =
    donor?.total_amount ||
    donor?.amount ||
    donor?.contribution_amount ||
    donor?.total_contributions ||
    0;

  let score = 25;

  if (amount) score += Math.min(45, Math.log10(Math.max(amount, 1)) * 8);
  if (donor?.state) score += 8;
  if (donor?.party || donor?.party_affiliation) score += 7;
  if (donor?.cycle) score += 5;

  return Math.min(100, Math.round(score));
}

function stateMatch(a, b) {
  const left = String(a?.state || a?.state_code || a?.coverage_state || "").toUpperCase();
  const right = String(b?.state || b?.state_code || b?.coverage_state || "").toUpperCase();

  return left && right && left === right;
}

function partyMatch(a, b) {
  const left = String(a?.party || a?.party_affiliation || "").toLowerCase();
  const right = String(b?.party || b?.party_affiliation || "").toLowerCase();

  if (!left || !right) return false;

  return left.includes(right) || right.includes(left);
}

function officeMatch(candidate, consultant) {
  const office = String(candidate?.office || "").toLowerCase();
  const specialty = String(
    consultant?.specialty ||
      consultant?.category ||
      consultant?.service_category ||
      ""
  ).toLowerCase();

  if (!office || !specialty) return false;

  return specialty.includes(office) || office.includes(specialty);
}

function buildGraph({ candidates, consultants, donors, maxNodes = 80 }) {
  const nodes = [];
  const links = [];

  const topCandidates = candidates.slice(0, Math.min(32, maxNodes));
  const topConsultants = consultants.slice(0, Math.min(24, maxNodes));
  const topDonors = donors.slice(0, Math.min(24, maxNodes));

  for (const candidate of topCandidates) {
    const influence = scoreCandidate(candidate);

    nodes.push({
      id: `candidate-${candidate.id || candidate.fec_candidate_id || getCandidateName(candidate)}`,
      sourceId: candidate.id,
      type: "candidate",
      label: getCandidateName(candidate),
      subtitle: `${candidate.state || "N/A"} • ${candidate.office || "Office"}`,
      state: candidate.state || candidate.state_code || "",
      party: candidate.party || "",
      influence,
      raw: candidate,
    });
  }

  for (const consultant of topConsultants) {
    const influence = scoreConsultant(consultant);

    nodes.push({
      id: `consultant-${consultant.id || getConsultantName(consultant)}`,
      sourceId: consultant.id,
      type: "consultant",
      label: getConsultantName(consultant),
      subtitle: consultant.state || consultant.coverage_state || consultant.category || "Consultant",
      state: consultant.state || consultant.coverage_state || "",
      party: consultant.party || consultant.party_affiliation || "",
      influence,
      raw: consultant,
    });
  }

  for (const donor of topDonors) {
    const amount =
      donor.total_amount ||
      donor.amount ||
      donor.contribution_amount ||
      donor.total_contributions ||
      0;

    const influence = scoreDonor(donor);

    nodes.push({
      id: `donor-${donor.id || donor.donor_id || getDonorName(donor)}`,
      sourceId: donor.id || donor.donor_id,
      type: "donor",
      label: getDonorName(donor),
      subtitle: `${donor.state || "National"} • ${formatMoney(amount)}`,
      state: donor.state || "",
      party: donor.party || donor.party_affiliation || "",
      influence,
      raw: donor,
    });
  }

  const candidateNodes = nodes.filter((node) => node.type === "candidate");
  const consultantNodes = nodes.filter((node) => node.type === "consultant");
  const donorNodes = nodes.filter((node) => node.type === "donor");

  for (const candidate of candidateNodes) {
    const matchedConsultants = consultantNodes
      .map((consultant) => {
        let strength = 0;
        if (stateMatch(candidate.raw, consultant.raw)) strength += 45;
        if (officeMatch(candidate.raw, consultant.raw)) strength += 25;
        if (partyMatch(candidate.raw, consultant.raw)) strength += 15;
        strength += Math.min(15, consultant.influence / 8);

        return { consultant, strength };
      })
      .filter((match) => match.strength >= 35)
      .sort((a, b) => b.strength - a.strength)
      .slice(0, 3);

    for (const match of matchedConsultants) {
      links.push({
        source: candidate.id,
        target: match.consultant.id,
        type: "candidate_consultant",
        strength: Math.round(match.strength),
        label: "Consultant fit",
      });
    }

    const matchedDonors = donorNodes
      .map((donor) => {
        let strength = 0;
        if (stateMatch(candidate.raw, donor.raw)) strength += 35;
        if (partyMatch(candidate.raw, donor.raw)) strength += 25;
        strength += Math.min(35, donor.influence / 2);

        return { donor, strength };
      })
      .filter((match) => match.strength >= 32)
      .sort((a, b) => b.strength - a.strength)
      .slice(0, 4);

    for (const match of matchedDonors) {
      links.push({
        source: candidate.id,
        target: match.donor.id,
        type: "candidate_donor",
        strength: Math.round(match.strength),
        label: "Donor affinity",
      });
    }
  }

  for (const consultant of consultantNodes) {
    const donorMatches = donorNodes
      .map((donor) => {
        let strength = 0;
        if (stateMatch(consultant.raw, donor.raw)) strength += 25;
        if (partyMatch(consultant.raw, donor.raw)) strength += 18;
        strength += Math.min(20, (consultant.influence + donor.influence) / 10);

        return { donor, strength };
      })
      .filter((match) => match.strength >= 30)
      .sort((a, b) => b.strength - a.strength)
      .slice(0, 2);

    for (const match of donorMatches) {
      links.push({
        source: consultant.id,
        target: match.donor.id,
        type: "consultant_donor",
        strength: Math.round(match.strength),
        label: "Network overlap",
      });
    }
  }

  return { nodes, links };
}

function getGraphInsights(graph) {
  const nodes = graph.nodes || [];
  const links = graph.links || [];

  const candidates = nodes.filter((node) => node.type === "candidate");
  const consultants = nodes.filter((node) => node.type === "consultant");
  const donors = nodes.filter((node) => node.type === "donor");

  const topInfluencers = [...nodes]
    .sort((a, b) => b.influence - a.influence)
    .slice(0, 5);

  const highStrengthLinks = [...links]
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 6);

  const orphanCandidates = candidates.filter((candidate) => {
    return !links.some((link) => {
      const source = typeof link.source === "object" ? link.source.id : link.source;
      const target = typeof link.target === "object" ? link.target.id : link.target;
      return source === candidate.id || target === candidate.id;
    });
  });

  return {
    summary: [
      `${candidates.length} candidate nodes mapped against ${consultants.length} consultant nodes and ${donors.length} donor nodes.`,
      `${highStrengthLinks.length} high-value relationship paths are ready for consultant or fundraising action.`,
      `${orphanCandidates.length} candidates have weak network coverage and should be prioritized for enrichment.`,
    ],
    topInfluencers,
    highStrengthLinks,
    orphanCandidates,
  };
}

function NodeLegend() {
  return (
    <div className="vs-chip-row" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {Object.entries(NODE_TYPES).map(([key, meta]) => (
        <span
          key={key}
          className="vs-card-muted"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 10px",
            fontSize: 12,
            fontWeight: 700,
            color: "var(--vs-text)",
          }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: 999,
              background: meta.color,
              display: "inline-block",
            }}
          />
          {meta.label}
        </span>
      ))}
    </div>
  );
}

function RelationshipGraphCanvas({ graph, selectedNode, onSelectNode }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 960;
    const height = 640;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    svg
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("role", "img")
      .attr("aria-label", "Political relationship intelligence graph");

    const root = svg.append("g");

    svg.call(
      d3
        .zoom()
        .scaleExtent([0.35, 2.5])
        .on("zoom", (event) => {
          root.attr("transform", event.transform);
        })
    );

    const defs = svg.append("defs");

    defs
      .append("filter")
      .attr("id", "node-shadow")
      .append("feDropShadow")
      .attr("dx", 0)
      .attr("dy", 6)
      .attr("stdDeviation", 4)
      .attr("flood-opacity", 0.2);

    const nodes = graph.nodes.map((node) => ({ ...node }));
    const links = graph.links.map((link) => ({ ...link }));

    const linkGroup = root
      .append("g")
      .attr("stroke", "rgba(100, 116, 139, 0.45)")
      .attr("stroke-opacity", 0.85);

    const link = linkGroup
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", (d) => Math.max(1, Math.min(5, d.strength / 18)));

    const nodeGroup = root
      .append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .attr("cursor", "pointer")
      .on("click", (_, d) => onSelectNode(d));

    nodeGroup
      .append("circle")
      .attr("r", (d) => NODE_TYPES[d.type]?.radius || 14)
      .attr("fill", (d) => NODE_TYPES[d.type]?.color || "#64748b")
      .attr("stroke", (d) => (selectedNode?.id === d.id ? "#facc15" : "#ffffff"))
      .attr("stroke-width", (d) => (selectedNode?.id === d.id ? 4 : 2))
      .attr("filter", "url(#node-shadow)");

    nodeGroup
      .append("circle")
      .attr("r", (d) => Math.max(5, (NODE_TYPES[d.type]?.radius || 14) * (d.influence / 120)))
      .attr("fill", "rgba(255,255,255,0.35)");

    nodeGroup
      .append("text")
      .text((d) => d.label)
      .attr("x", 22)
      .attr("y", 4)
      .attr("font-size", 11)
      .attr("font-weight", 800)
      .attr("fill", "var(--vs-text)");

    nodeGroup
      .append("title")
      .text((d) => `${NODE_TYPES[d.type]?.label}: ${d.label}\nInfluence: ${d.influence}\n${d.subtitle}`);

    const simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3
          .forceLink(links)
          .id((d) => d.id)
          .distance((d) => Math.max(85, 180 - d.strength))
          .strength((d) => Math.min(0.8, d.strength / 100))
      )
      .force("charge", d3.forceManyBody().strength(-360))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius((d) => (NODE_TYPES[d.type]?.radius || 14) + 38))
      .force("x", d3.forceX(width / 2).strength(0.04))
      .force("y", d3.forceY(height / 2).strength(0.04));

    nodeGroup.call(
      d3
        .drag()
        .on("start", (event) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          event.subject.fx = event.subject.x;
          event.subject.fy = event.subject.y;
        })
        .on("drag", (event) => {
          event.subject.fx = event.x;
          event.subject.fy = event.y;
        })
        .on("end", (event) => {
          if (!event.active) simulation.alphaTarget(0);
          event.subject.fx = null;
          event.subject.fy = null;
        })
    );

    simulation.on("tick", () => {
      link
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);

      nodeGroup.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });

    return () => simulation.stop();
  }, [graph, selectedNode, onSelectNode]);

  return (
    <div
      className="vs-card-muted"
      style={{
        minHeight: 640,
        overflow: "hidden",
        borderRadius: 20,
        background:
          "radial-gradient(circle at 15% 15%, rgba(99,102,241,0.12), transparent 30%), radial-gradient(circle at 80% 20%, rgba(16,185,129,0.10), transparent 25%), var(--vs-surface)",
      }}
    >
      <svg ref={svgRef} style={{ width: "100%", height: "640px", display: "block" }} />
    </div>
  );
}

function SelectedNodePanel({ node }) {
  if (!node) {
    return (
      <EmptyState text="Select a node to view relationship intelligence, influence score, source details, and recommended action." />
    );
  }

  return (
    <div className="vs-stack">
      <div className="vs-card-muted" style={{ padding: 16, display: "grid", gap: 10 }}>
        <div className="vs-chip-row">
          <Badge tone={node.type === "candidate" ? "accent" : node.type === "consultant" ? "active" : "warning"}>
            {NODE_TYPES[node.type]?.label || node.type}
          </Badge>
          <Badge tone={getConfidenceTone(node.influence / 100)}>Influence {node.influence}</Badge>
        </div>

        <div>
          <div style={{ fontSize: 20, fontWeight: 900, color: "var(--vs-text)", lineHeight: 1.2 }}>
            {node.label}
          </div>
          <div style={{ marginTop: 4, color: "var(--vs-text-muted)", fontSize: 13 }}>
            {node.subtitle}
          </div>
        </div>
      </div>

      <div className="vs-grid-2">
        <StatCard label="Influence Score" value={node.influence} subtext="Network priority" />
        <StatCard label="Node Type" value={NODE_TYPES[node.type]?.label || node.type} subtext="Graph classification" />
      </div>

      <SectionCard title="AI Relationship Readout" subtitle="Generated from graph position, state fit, and influence scoring.">
        <div className="vs-stack">
          <div className="vs-banner">
            <strong>Recommended action:</strong>{" "}
            {node.type === "candidate"
              ? "Use this candidate as an anchor node for consultant matching, donor outreach, and race-level opportunity scoring."
              : node.type === "consultant"
                ? "Prioritize this consultant for candidate fit review and state coverage expansion."
                : "Review this donor as a potential funding bridge across aligned candidates and consultant networks."}
          </div>
          <div className="vs-banner">
            <strong>Signal quality:</strong> Influence score is calculated from available candidate, donor, consultant, state, party, office, and funding signals.
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

function InsightsPanel({ insights }) {
  return (
    <div className="vs-stack">
      <SectionCard title="AI Network Briefing" subtitle="Relationship intelligence summary generated from the visible graph.">
        <div className="vs-stack">
          {insights.summary.map((line) => (
            <div key={line} className="vs-banner">
              {line}
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Top Influence Nodes" subtitle="Highest leverage entities in the current graph.">
        <div className="vs-stack">
          {insights.topInfluencers.length ? (
            insights.topInfluencers.map((node) => (
              <div
                key={node.id}
                className="vs-card-muted"
                style={{ padding: 12, display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}
              >
                <div>
                  <div style={{ fontWeight: 800, color: "var(--vs-text)" }}>{node.label}</div>
                  <div style={{ fontSize: 12, color: "var(--vs-text-muted)" }}>{node.subtitle}</div>
                </div>
                <Badge tone={getConfidenceTone(node.influence / 100)}>{node.influence}</Badge>
              </div>
            ))
          ) : (
            <EmptyState text="No influence nodes available." />
          )}
        </div>
      </SectionCard>

      <SectionCard title="Strongest Relationship Paths" subtitle="Highest-confidence graph connections.">
        <div className="vs-stack">
          {insights.highStrengthLinks.length ? (
            insights.highStrengthLinks.map((link, index) => {
              const source = typeof link.source === "object" ? link.source.label : link.source;
              const target = typeof link.target === "object" ? link.target.label : link.target;

              return (
                <div
                  key={`${source}-${target}-${index}`}
                  className="vs-card-muted"
                  style={{ padding: 12, display: "grid", gap: 6 }}
                >
                  <div style={{ fontWeight: 800, color: "var(--vs-text)" }}>
                    {source} → {target}
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <Badge tone="info">{link.label}</Badge>
                    <Badge tone={getConfidenceTone(link.strength / 100)}>Strength {link.strength}</Badge>
                  </div>
                </div>
              );
            })
          ) : (
            <EmptyState text="No strong paths found yet." />
          )}
        </div>
      </SectionCard>
    </div>
  );
}

export default function RelationshipGraph() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    state: "",
    party: "",
    office: "",
  });
  const [rawData, setRawData] = useState({
    candidates: [],
    consultants: [],
    donors: [],
  });
  const [selectedNode, setSelectedNode] = useState(null);

  const demoMode = typeof window !== "undefined" && localStorage.getItem("vs_demo_mode") === "1";

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const params = {
        state: filters.state || undefined,
        party: filters.party || undefined,
        office: filters.office || undefined,
        limit: 50,
      };

      const [candidatePayload, consultantPayload, donorPayload] = await Promise.all([
        api.candidates ? api.candidates({ ...params, page: 1, limit: 50 }) : api.get("/candidates", { params }).then((r) => r.data),
        api.consultants ? api.consultants(params) : api.get("/consultants", { params }).then((r) => r.data),
        api.donorNetwork ? api.donorNetwork(params) : api.get("/donors/network", { params }).then((r) => r.data),
      ]);

      setRawData({
        candidates: normalizeList(candidatePayload, ["candidates", "results"]),
        consultants: normalizeList(consultantPayload, ["consultants", "results"]),
        donors: normalizeList(donorPayload, ["donors", "results"]),
      });
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Failed to load relationship graph data.");
      setRawData({ candidates: [], consultants: [], donors: [] });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const graph = useMemo(() => buildGraph(rawData), [rawData]);
  const insights = useMemo(() => getGraphInsights(graph), [graph]);

  const states = useMemo(() => {
    const values = [
      ...rawData.candidates.map((item) => item.state || item.state_code),
      ...rawData.consultants.map((item) => item.state || item.coverage_state),
      ...rawData.donors.map((item) => item.state),
    ].filter(Boolean);

    return [...new Set(values)].sort();
  }, [rawData]);

  const nodeCounts = useMemo(() => {
    return {
      candidates: graph.nodes.filter((node) => node.type === "candidate").length,
      consultants: graph.nodes.filter((node) => node.type === "consultant").length,
      donors: graph.nodes.filter((node) => node.type === "donor").length,
      links: graph.links.length,
    };
  }, [graph]);

  return (
    <PageShell
      eyebrow="Relationship Intelligence"
      title="Political relationship graph."
      description="Map candidate, consultant, and donor networks with influence scoring and AI-driven relationship insights."
      demo={demoMode}
      demoText="Demo relationship graph mode is active."
    >
      {error ? (
        <div className="vs-banner" style={{ borderColor: "#fecaca", background: "#fef2f2", color: "#b91c1c" }}>
          {error}
        </div>
      ) : null}

      <div className="vs-grid-4">
        <StatCard label="Candidate Nodes" value={nodeCounts.candidates} subtext="Campaign entities" />
        <StatCard label="Consultant Nodes" value={nodeCounts.consultants} subtext="Strategic operators" />
        <StatCard label="Donor Nodes" value={nodeCounts.donors} subtext="Funding network" />
        <StatCard label="Relationship Paths" value={nodeCounts.links} subtext="Weighted connections" />
      </div>

      <SectionCard
        title="Graph Controls"
        subtitle="Filter the relationship graph by state, party, and office."
        right={
          <div className="vs-inline-actions" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" className="vs-button vs-button-secondary" onClick={() => setFilters({ state: "", party: "", office: "" })}>
              Reset
            </button>
            <button type="button" className="vs-button" onClick={loadData} disabled={loading}>
              {loading ? "Loading..." : "Reload Graph"}
            </button>
          </div>
        }
      >
        <div className="vs-grid-4">
          <select className="vs-input" value={filters.state} onChange={(e) => setFilters((prev) => ({ ...prev, state: e.target.value }))}>
            <option value="">All states</option>
            {states.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>

          <select className="vs-input" value={filters.party} onChange={(e) => setFilters((prev) => ({ ...prev, party: e.target.value }))}>
            <option value="">All parties</option>
            <option value="Democratic">Democratic</option>
            <option value="Republican">Republican</option>
            <option value="Independent">Independent</option>
          </select>

          <select className="vs-input" value={filters.office} onChange={(e) => setFilters((prev) => ({ ...prev, office: e.target.value }))}>
            <option value="">All offices</option>
            <option value="House">House</option>
            <option value="Senate">Senate</option>
            <option value="Governor">Governor</option>
            <option value="President">President</option>
          </select>

          <div className="vs-card-muted" style={{ padding: "10px 12px", display: "flex", alignItems: "center" }}>
            <NodeLegend />
          </div>
        </div>
      </SectionCard>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.45fr) minmax(360px, 0.75fr)", gap: 16, alignItems: "start" }}>
        <SectionCard
          title="D3 Force Graph"
          subtitle="Drag nodes, zoom the canvas, and select relationships to inspect influence signals."
          right={<Badge tone={loading ? "warning" : "active"}>{loading ? "Loading" : "Live Graph"}</Badge>}
        >
          {loading ? (
            <EmptyState text="Loading relationship graph..." />
          ) : graph.nodes.length ? (
            <RelationshipGraphCanvas graph={graph} selectedNode={selectedNode} onSelectNode={setSelectedNode} />
          ) : (
            <EmptyState text="No graph nodes available for the current filters." />
          )}
        </SectionCard>

        <div className="vs-stack">
          <SectionCard title="Selected Node" subtitle="Node-level relationship intelligence.">
            <SelectedNodePanel node={selectedNode} />
          </SectionCard>

          <InsightsPanel insights={insights} />
        </div>
      </div>
    </PageShell>
  );
}
