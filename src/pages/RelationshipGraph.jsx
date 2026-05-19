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

const EMPTY_GRAPH = {
  nodes: [],
  links: [],
  insights: {
    summary: [],
    topInfluencers: [],
    highStrengthLinks: [],
    orphanCandidates: [],
  },
  counts: {
    candidates: 0,
    consultants: 0,
    donors: 0,
    nodes: 0,
    links: 0,
  },
  filters: {},
};

function safeNumber(value, fallback = 0) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function getConfidenceTone(value) {
  const score = Number(value || 0);
  if (score >= 0.7) return "active";
  if (score >= 0.35) return "warning";
  return "default";
}

function formatPercent(value) {
  const next = safeNumber(value, 0);
  return `${Math.round(next * 100)}%`;
}

function normalizeGraphPayload(payload) {
  const graph = payload?.graph || payload || {};
  const insights = graph.insights || {};

  return {
    nodes: Array.isArray(graph.nodes) ? graph.nodes : [],
    links: Array.isArray(graph.links) ? graph.links : [],
    counts: {
      candidates: safeNumber(graph.counts?.candidates),
      consultants: safeNumber(graph.counts?.consultants),
      donors: safeNumber(graph.counts?.donors),
      nodes: safeNumber(graph.counts?.nodes),
      links: safeNumber(graph.counts?.links),
    },
    filters: graph.filters || {},
    insights: {
      summary: Array.isArray(insights.summary) ? insights.summary : [],
      topInfluencers: Array.isArray(insights.topInfluencers)
        ? insights.topInfluencers
        : Array.isArray(insights.top_influencers)
          ? insights.top_influencers
          : [],
      highStrengthLinks: Array.isArray(insights.highStrengthLinks)
        ? insights.highStrengthLinks
        : Array.isArray(insights.strongest_links)
          ? insights.strongest_links
          : [],
      orphanCandidates: Array.isArray(insights.orphanCandidates)
        ? insights.orphanCandidates
        : Array.isArray(insights.orphan_candidates)
          ? insights.orphan_candidates
          : [],
    },
  };
}

function NodeLegend() {
  return (
    <div
      className="vs-chip-row"
      style={{
        display: "flex",
        gap: 8,
        flexWrap: "wrap",
      }}
    >
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

    const nodes = (graph.nodes || []).map((node) => ({ ...node }));
    const links = (graph.links || []).map((link) => ({ ...link }));

    const linkGroup = root
      .append("g")
      .attr("stroke", "rgba(100, 116, 139, 0.45)")
      .attr("stroke-opacity", 0.85);

    const link = linkGroup
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", (d) =>
        Math.max(1, Math.min(5, safeNumber(d.strength) / 18))
      );

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
      .attr("r", (d) =>
        Math.max(
          5,
          (NODE_TYPES[d.type]?.radius || 14) * (safeNumber(d.influence) / 120)
        )
      )
      .attr("fill", "rgba(255,255,255,0.35)");

    nodeGroup
      .append("text")
      .text((d) => d.label || d.id)
      .attr("x", 22)
      .attr("y", 4)
      .attr("font-size", 11)
      .attr("font-weight", 800)
      .attr("fill", "var(--vs-text)");

    nodeGroup
      .append("title")
      .text(
        (d) =>
          `${NODE_TYPES[d.type]?.label || d.type}: ${d.label || d.id}\nInfluence: ${
            d.influence || 0
          }\n${d.subtitle || ""}`
      );

    const simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3
          .forceLink(links)
          .id((d) => d.id)
          .distance((d) => Math.max(85, 180 - safeNumber(d.strength)))
          .strength((d) => Math.min(0.8, safeNumber(d.strength) / 100))
      )
      .force("charge", d3.forceManyBody().strength(-360))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force(
        "collision",
        d3.forceCollide().radius((d) => (NODE_TYPES[d.type]?.radius || 14) + 38)
      )
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
        .attr("x1", (d) => d.source?.x || 0)
        .attr("y1", (d) => d.source?.y || 0)
        .attr("x2", (d) => d.target?.x || 0)
        .attr("y2", (d) => d.target?.y || 0);

      nodeGroup.attr("transform", (d) => `translate(${d.x || 0},${d.y || 0})`);
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
      <svg
        ref={svgRef}
        style={{
          width: "100%",
          height: "640px",
          display: "block",
        }}
      />
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
      <div
        className="vs-card-muted"
        style={{
          padding: 16,
          display: "grid",
          gap: 10,
        }}
      >
        <div className="vs-chip-row">
          <Badge
            tone={
              node.type === "candidate"
                ? "accent"
                : node.type === "consultant"
                  ? "active"
                  : "warning"
            }
          >
            {NODE_TYPES[node.type]?.label || node.type}
          </Badge>

          <Badge tone={getConfidenceTone(safeNumber(node.influence) / 100)}>
            Influence {node.influence || 0}
          </Badge>
        </div>

        <div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 900,
              color: "var(--vs-text)",
              lineHeight: 1.2,
            }}
          >
            {node.label || node.id}
          </div>

          <div
            style={{
              marginTop: 4,
              color: "var(--vs-text-muted)",
              fontSize: 13,
            }}
          >
            {node.subtitle || "No subtitle available"}
          </div>
        </div>
      </div>

      <div className="vs-grid-2">
        <StatCard
          label="Influence Score"
          value={node.influence || 0}
          subtext="Network priority"
        />
        <StatCard
          label="Node Type"
          value={NODE_TYPES[node.type]?.label || node.type}
          subtext="Graph classification"
        />
      </div>

      <SectionCard
        title="AI Relationship Readout"
        subtitle="Generated from graph position, state fit, and influence scoring."
      >
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
            <strong>Signal quality:</strong> Influence score is calculated from live backend candidate, donor, consultant, state, party, office, and funding signals.
          </div>
        </div>
      </SectionCard>

      {node.raw ? (
        <SectionCard title="Source Details" subtitle="Backend source row attached to this node.">
          <pre
            className="vs-card-muted"
            style={{
              margin: 0,
              padding: 14,
              overflow: "auto",
              maxHeight: 260,
              color: "var(--vs-text)",
              fontSize: 12,
              whiteSpace: "pre-wrap",
            }}
          >
            {JSON.stringify(node.raw, null, 2)}
          </pre>
        </SectionCard>
      ) : null}
    </div>
  );
}

function InsightsPanel({ insights }) {
  const normalized = {
    summary: Array.isArray(insights?.summary) ? insights.summary : [],
    topInfluencers: Array.isArray(insights?.topInfluencers)
      ? insights.topInfluencers
      : Array.isArray(insights?.top_influencers)
        ? insights.top_influencers
        : [],
    highStrengthLinks: Array.isArray(insights?.highStrengthLinks)
      ? insights.highStrengthLinks
      : Array.isArray(insights?.strongest_links)
        ? insights.strongest_links
        : [],
    orphanCandidates: Array.isArray(insights?.orphanCandidates)
      ? insights.orphanCandidates
      : Array.isArray(insights?.orphan_candidates)
        ? insights.orphan_candidates
        : [],
  };

  return (
    <div className="vs-stack">
      <SectionCard
        title="AI Network Briefing"
        subtitle="Relationship intelligence summary generated from backend graph analysis."
      >
        <div className="vs-stack">
          {normalized.summary.length ? (
            normalized.summary.map((line) => (
              <div key={line} className="vs-banner">
                {line}
              </div>
            ))
          ) : (
            <EmptyState text="No graph briefing available yet." />
          )}
        </div>
      </SectionCard>

      <SectionCard
        title="Top Influence Nodes"
        subtitle="Highest leverage entities in the current graph."
      >
        <div className="vs-stack">
          {normalized.topInfluencers.length ? (
            normalized.topInfluencers.map((node) => (
              <div
                key={node.id}
                className="vs-card-muted"
                style={{
                  padding: 12,
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  alignItems: "center",
                }}
              >
                <div>
                  <div
                    style={{
                      fontWeight: 800,
                      color: "var(--vs-text)",
                    }}
                  >
                    {node.label || node.id}
                  </div>

                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--vs-text-muted)",
                    }}
                  >
                    {node.subtitle || "No subtitle"}
                  </div>
                </div>

                <Badge tone={getConfidenceTone(safeNumber(node.influence) / 100)}>
                  {node.influence || 0}
                </Badge>
              </div>
            ))
          ) : (
            <EmptyState text="No influence nodes available." />
          )}
        </div>
      </SectionCard>

      <SectionCard
        title="Strongest Relationship Paths"
        subtitle="Highest-confidence graph connections."
      >
        <div className="vs-stack">
          {normalized.highStrengthLinks.length ? (
            normalized.highStrengthLinks.map((link, index) => {
              const source =
                typeof link.source === "object"
                  ? link.source.label || link.source.id
                  : link.source;

              const target =
                typeof link.target === "object"
                  ? link.target.label || link.target.id
                  : link.target;

              return (
                <div
                  key={`${source}-${target}-${index}`}
                  className="vs-card-muted"
                  style={{
                    padding: 12,
                    display: "grid",
                    gap: 6,
                  }}
                >
                  <div
                    style={{
                      fontWeight: 800,
                      color: "var(--vs-text)",
                    }}
                  >
                    {source} → {target}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      flexWrap: "wrap",
                    }}
                  >
                    <Badge tone="info">{link.label || "Relationship"}</Badge>
                    <Badge tone={getConfidenceTone(safeNumber(link.strength) / 100)}>
                      Strength {link.strength || 0}
                    </Badge>
                  </div>
                </div>
              );
            })
          ) : (
            <EmptyState text="No strong paths found yet." />
          )}
        </div>
      </SectionCard>

      <SectionCard
        title="Weak Coverage Candidates"
        subtitle="Candidates with limited relationship coverage in the current graph."
      >
        <div className="vs-stack">
          {normalized.orphanCandidates.length ? (
            normalized.orphanCandidates.slice(0, 8).map((node) => (
              <div
                key={node.id}
                className="vs-card-muted"
                style={{
                  padding: 12,
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ fontWeight: 800, color: "var(--vs-text)" }}>
                    {node.label || node.id}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--vs-text-muted)" }}>
                    {node.subtitle || "Needs network expansion"}
                  </div>
                </div>
                <Badge tone="warning">Weak Coverage</Badge>
              </div>
            ))
          ) : (
            <EmptyState text="No weak-coverage candidates detected." />
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
  const [graph, setGraph] = useState(EMPTY_GRAPH);
  const [selectedNode, setSelectedNode] = useState(null);

  const demoMode =
    typeof window !== "undefined" && localStorage.getItem("vs_demo_mode") === "1";

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const params = {
        state: filters.state || undefined,
        party: filters.party || undefined,
        office: filters.office || undefined,
        limit: 80,
      };

      const response = await api.get("/relationships/graph", {
        params,
      });

      const normalized = normalizeGraphPayload(response?.data);

      setGraph(normalized);

      if (
        selectedNode &&
        !normalized.nodes.some((node) => String(node.id) === String(selectedNode.id))
      ) {
        setSelectedNode(null);
      }
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to load backend relationship graph data."
      );
      setGraph(EMPTY_GRAPH);
      setSelectedNode(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const states = useMemo(() => {
    const values = graph.nodes.map((item) => item.state).filter(Boolean);
    return [...new Set(values)].sort();
  }, [graph.nodes]);

  const nodeCounts = useMemo(() => {
    return {
      candidates:
        graph.counts?.candidates ??
        graph.nodes.filter((node) => node.type === "candidate").length,
      consultants:
        graph.counts?.consultants ??
        graph.nodes.filter((node) => node.type === "consultant").length,
      donors:
        graph.counts?.donors ??
        graph.nodes.filter((node) => node.type === "donor").length,
      links: graph.counts?.links ?? graph.links.length,
      nodes: graph.counts?.nodes ?? graph.nodes.length,
    };
  }, [graph]);

  const densityScore = nodeCounts.nodes
    ? Math.min(1, nodeCounts.links / Math.max(nodeCounts.nodes, 1))
    : 0;

  return (
    <PageShell
      eyebrow="Relationship Intelligence"
      title="Political relationship graph."
      description="Map candidate, consultant, and donor networks with backend influence scoring and AI-driven relationship insights."
      demo={demoMode}
      demoText="Demo relationship graph mode is active."
    >
      {error ? (
        <div
          className="vs-banner"
          style={{
            borderColor: "#fecaca",
            background: "#fef2f2",
            color: "#b91c1c",
          }}
        >
          {error}
        </div>
      ) : null}

      <div className="vs-grid-4">
        <StatCard
          label="Candidate Nodes"
          value={nodeCounts.candidates}
          subtext="Campaign entities"
        />
        <StatCard
          label="Consultant Nodes"
          value={nodeCounts.consultants}
          subtext="Strategic operators"
        />
        <StatCard
          label="Donor Nodes"
          value={nodeCounts.donors}
          subtext="Funding network"
        />
        <StatCard
          label="Relationship Density"
          value={formatPercent(densityScore)}
          subtext={`${nodeCounts.links} weighted paths`}
        />
      </div>

      <SectionCard
        title="Graph Controls"
        subtitle="Filter the backend relationship graph by state, party, and office."
        right={
          <div
            className="vs-inline-actions"
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <Badge tone={loading ? "warning" : "active"}>
              {loading ? "Loading" : "Backend Live"}
            </Badge>

            <button
              type="button"
              className="vs-button vs-button-secondary"
              onClick={() => {
                setFilters({
                  state: "",
                  party: "",
                  office: "",
                });
                setSelectedNode(null);
              }}
            >
              Reset
            </button>

            <button
              type="button"
              className="vs-button"
              onClick={loadData}
              disabled={loading}
            >
              {loading ? "Loading..." : "Reload Graph"}
            </button>
          </div>
        }
      >
        <div className="vs-grid-4">
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
            {states.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>

          <select
            className="vs-input"
            value={filters.party}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                party: event.target.value,
              }))
            }
          >
            <option value="">All parties</option>
            <option value="Democratic">Democratic</option>
            <option value="Republican">Republican</option>
            <option value="Independent">Independent</option>
          </select>

          <select
            className="vs-input"
            value={filters.office}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                office: event.target.value,
              }))
            }
          >
            <option value="">All offices</option>
            <option value="House">House</option>
            <option value="Senate">Senate</option>
            <option value="Governor">Governor</option>
            <option value="President">President</option>
          </select>

          <div
            className="vs-card-muted"
            style={{
              padding: "10px 12px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <NodeLegend />
          </div>
        </div>
      </SectionCard>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.45fr) minmax(360px, 0.75fr)",
          gap: 16,
          alignItems: "start",
        }}
      >
        <SectionCard
          title="D3 Force Graph"
          subtitle="Drag nodes, zoom the canvas, and select relationships to inspect backend influence signals."
          right={
            <Badge tone={loading ? "warning" : "active"}>
              {loading ? "Loading" : "Live Backend Graph"}
            </Badge>
          }
        >
          {loading ? (
            <EmptyState text="Loading backend relationship graph..." />
          ) : graph.nodes.length ? (
            <RelationshipGraphCanvas
              graph={graph}
              selectedNode={selectedNode}
              onSelectNode={setSelectedNode}
            />
          ) : (
            <EmptyState text="No graph nodes available for the current filters." />
          )}
        </SectionCard>

        <div className="vs-stack">
          <SectionCard title="Selected Node" subtitle="Node-level relationship intelligence.">
            <SelectedNodePanel node={selectedNode} />
          </SectionCard>

          <InsightsPanel insights={graph.insights} />
        </div>
      </div>
    </PageShell>
  );
}
