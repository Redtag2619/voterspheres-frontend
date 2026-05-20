import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import ResponsiveRow from "../components/ui/ResponsiveRow";
import ExecutionBoard from "../components/tasks/ExecutionBoard.jsx";

const fallbackData = {
  metrics: [
    { label: "National Win Index", value: "61.8", delta: "+3.1", tone: "up" },
    { label: "Active Threats", value: "4", delta: "2 require action", tone: "down" },
    { label: "Fundraising Pulse", value: "$12.8M", delta: "+9.4%", tone: "up" },
    { label: "Persuasion Opportunity", value: "8.9", delta: "+0.8", tone: "up" },
  ],
  battlegrounds: [
    {
      race: "GA Senate",
      state: "Georgia",
      office: "Senate",
      probability: "57%",
      momentum: "+2.4",
      risk: "Elevated",
      priority: "Tier 1",
    },
    {
      race: "PA Senate",
      state: "Pennsylvania",
      office: "Senate",
      probability: "54%",
      momentum: "+1.8",
      risk: "Watch",
      priority: "Tier 1",
    },
    {
      race: "AZ Senate",
      state: "Arizona",
      office: "Senate",
      probability: "51%",
      momentum: "+1.1",
      risk: "Watch",
      priority: "Tier 2",
    },
  ],
  actions: [
    {
      title: "Deploy suburban affordability contrast",
      owner: "War Room",
      due: "Now",
      detail: "Shift message weight into metro persuadable voter clusters.",
      state: "Georgia",
      office: "Senate",
      risk: "Elevated",
    },
    {
      title: "Escalate MailOps delay response",
      owner: "MailOps",
      due: "45 min",
      detail: "Coordinate with vendor and USPS contacts to protect weekend delivery.",
      state: "Georgia",
      office: "Senate",
      risk: "Elevated",
    },
    {
      title: "Refresh surrogate briefing memo",
      owner: "Comms",
      due: "2 hrs",
      detail: "Update talking points around education and cost-of-living pressure.",
      state: "Pennsylvania",
      office: "Senate",
      risk: "Watch",
    },
  ],
  feed: [
    {
      id: 1,
      time: "08:12",
      title: "Opposition affordability attack accelerating",
      source: "War Room",
      severity: "High",
      type: "warroom.threat_detected",
      state: "Georgia",
      office: "Senate",
      risk: "Elevated",
    },
    {
      id: 2,
      time: "08:41",
      title: "Mail delay detected at Atlanta NDC",
      source: "Mail Intelligence",
      severity: "High",
      type: "mail.delay_detected",
      state: "Georgia",
      office: "Senate",
      risk: "Elevated",
    },
    {
      id: 3,
      time: "09:05",
      title: "Forecast updated for PA Senate",
      source: "Forecast Engine",
      severity: "Medium",
      type: "forecast.updated",
      state: "Pennsylvania",
      office: "Senate",
      risk: "Watch",
    },
  ],
};

const fallbackCrossSignal = {
  summary: {
    states_tracked: 3,
    critical_states: 1,
    high_states: 2,
    vendor_gap_states: 1,
  },
  top_priorities: [
    {
      state: "Georgia",
      severity: "High",
      risk: "Elevated",
      priority_score: 91,
      recommended_actions: [
        "Escalate MailOps response.",
        "Increase suburban persuasion pressure.",
      ],
      finance: { receipts: 12800000 },
      vendors: { coverage_status: "Tight" },
      mailops: { mail_risks: 2 },
    },
    {
      state: "Arizona",
      severity: "High",
      risk: "Elevated",
      priority_score: 84,
      recommended_actions: ["Audit vendor coverage.", "Prepare backup vendor lane."],
      finance: { receipts: 9400000 },
      vendors: { coverage_status: "Gap" },
      mailops: { mail_risks: 1 },
    },
  ],
  results: [],
};

const fallbackConsultantIntel = {
  summary: {
    fec_consultants: 0,
    total_consultants: 0,
    avg_influence: 0,
    avg_exposure: 0,
    high_exposure: 0,
    watch_closely: 0,
  },
  top_influence: [],
  top_exposure: [],
  recent_relationships: [],
};

function number(value, fallback = 0) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function money(value) {
  const amount = number(value);
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${Math.round(amount / 1000)}K`;
  return `$${Math.round(amount).toLocaleString()}`;
}

function toneFromSeverity(value) {
  const next = String(value || "").toLowerCase();
  if (["critical", "high", "elevated", "severe"].includes(next)) return "danger";
  if (["medium", "watch", "warning"].includes(next)) return "warning";
  if (["complete", "resolved", "active"].includes(next)) return "active";
  return "default";
}

function toneFromScore(value) {
  const score = number(value);
  if (score >= 75) return "danger";
  if (score >= 50) return "warning";
  if (score >= 25) return "info";
  return "default";
}

function normalizeList(payload, key = "results") {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.[key])) return payload[key];
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
}

function unwrapGraph(payload) {
  return payload?.graph || payload || null;
}

function buildDecision(feed = [], consultantIntel = fallbackConsultantIntel) {
  const urgent = feed.find((item) =>
    ["high", "critical"].includes(String(item.severity || "").toLowerCase())
  );

  const exposure = normalizeList(consultantIntel, "top_exposure").find(
    (item) => number(item.exposure_score) >= 60
  );

  if (exposure) {
    return {
      level: "HIGH",
      title: `${exposure.name || "Consultant"} exposure risk requires review`,
      actions: [
        "Open Consultant Intel",
        "Review candidate overlap",
        "Assign opposition exposure analyst",
      ],
      link: "/consultant-intel",
    };
  }

  if (urgent) {
    return {
      level: String(urgent.severity || "HIGH").toUpperCase(),
      title: urgent.title || "High-priority command signal detected",
      actions: [
        "Assign task owner",
        "Review tactical response",
        "Monitor next-cycle impact",
      ],
      link: "/command-center",
    };
  }

  return {
    level: "STABLE",
    title: "No critical executive intervention required",
    actions: ["Monitor live feed", "Refresh intelligence", "Review priorities"],
    link: "/relationship-graph",
  };
}

function MetricGrid({ metrics = [] }) {
  return (
    <div className="vs-grid-4">
      {metrics.map((metric) => (
        <StatCard
          key={metric.label}
          label={metric.label}
          value={metric.value}
          subtext={metric.delta || metric.subtext}
          delta={metric.delta}
          tone={metric.tone}
        />
      ))}
    </div>
  );
}

function PremiumRow({ title, subtitle, meta = [], tone = "default", right, live = false }) {
  return (
    <div className={`vs-premium-row-card ${live ? "is-live" : ""}`}>
      <ResponsiveRow
        title={title}
        subtitle={subtitle}
        meta={meta}
        alert={tone === "danger" ? "vs-live-dot" : "vs-live-dot-warning"}
        right={right}
      />
    </div>
  );
}

function ConsultantIntelligencePanel({ data, loading, onRefresh }) {
  const summary = data?.summary || {};
  const topInfluence = data?.top_influence || data?.topInfluencers || [];
  const topExposure = data?.top_exposure || [];
  const recentRelationships = data?.recent_relationships || [];

  const riskWatch =
    number(summary.high_exposure) + number(summary.watch_closely);

  return (
    <SectionCard
      title="Consultant Intelligence"
      subtitle="Live FEC consultant relationships, influence scores, overlap risk, and opposition exposure signals."
      right={
        <div className="vs-inline-actions" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Badge tone={riskWatch ? "danger" : "active"}>
            {riskWatch ? `${riskWatch} risk watch` : "Network stable"}
          </Badge>
          <button type="button" className="vs-button vs-button-secondary" onClick={onRefresh}>
            Refresh
          </button>
          <Link className="vs-button" to="/consultant-intel">
            Open Consultant Intel
          </Link>
        </div>
      }
    >
      {loading ? (
        <EmptyState text="Loading consultant intelligence..." />
      ) : (
        <div className="vs-stack">
          <div className="vs-grid-4">
            <StatCard
              label="FEC Consultants"
              value={summary.fec_consultants || summary.fec_imported || 0}
              subtext="Imported from disbursements"
            />
            <StatCard
              label="Avg Influence"
              value={summary.avg_influence || 0}
              subtext="Network scoring"
            />
            <StatCard
              label="Avg Exposure"
              value={summary.avg_exposure || 0}
              subtext="Opposition risk"
            />
            <StatCard
              label="Risk Watch"
              value={riskWatch}
              subtext="High exposure or watch closely"
            />
          </div>

          <div className="vs-grid-2" style={{ alignItems: "start" }}>
            <div className="vs-stack">
              <div className="vs-stat-label">Top Influence Consultants</div>
              {topInfluence.length ? (
                topInfluence.slice(0, 4).map((item) => (
                  <PremiumRow
                    key={item.id || item.name}
                    title={item.name || item.firm_name || "Consultant"}
                    subtitle={`${item.category || "Political Consulting"} â€¢ ${item.state || "National"}`}
                    tone={toneFromScore(item.influence_score)}
                    meta={[
                      { label: "Influence", value: item.influence_score || 0 },
                      { label: "Battleground", value: item.battleground_score || 0 },
                      { label: "Clients", value: item.clients_count || item.mapped_candidates || 0 },
                      { label: "Spend", value: money(item.total_fec_disbursements || item.mapped_amount) },
                    ]}
                    right={
                      <div className="vs-inline-actions">
                        <Badge tone={toneFromScore(item.influence_score)}>
                          {item.influence_score || 0}
                        </Badge>
                        <Link className="vs-button vs-button-secondary" to={`/consultants/${item.id}`}>
                          Open
                        </Link>
                      </div>
                    }
                  />
                ))
              ) : (
                <EmptyState text="No influence consultants loaded yet." />
              )}
            </div>

            <div className="vs-stack">
              <div className="vs-stat-label">Exposure Watchlist</div>
              {topExposure.length ? (
                topExposure.slice(0, 4).map((item) => (
                  <PremiumRow
                    key={item.id || item.name}
                    title={item.name || item.firm_name || "Consultant"}
                    subtitle={item.risk_summary || `${item.category || "Political Consulting"} â€¢ ${item.state || "National"}`}
                    tone={toneFromScore(item.exposure_score)}
                    meta={[
                      { label: "Exposure", value: item.exposure_score || 0 },
                      { label: "Overlap", value: item.overlap_score || 0 },
                      { label: "Risk", value: item.risk_label || "Signal" },
                      { label: "Influence", value: item.influence_score || 0 },
                    ]}
                    right={<Badge tone={toneFromScore(item.exposure_score)}>{item.risk_label || "Watch"}</Badge>}
                  />
                ))
              ) : (
                <EmptyState text="No exposure records loaded yet." />
              )}
            </div>
          </div>

          {recentRelationships.length ? (
            <div className="vs-stack">
              <div className="vs-stat-label">Recent Consultant-Candidate Relationships</div>
              {recentRelationships.slice(0, 3).map((item) => (
                <PremiumRow
                  key={item.id || `${item.consultant_name}-${item.candidate_name}`}
                  title={`${item.consultant_name || "Consultant"} â†’ ${item.candidate_name || "Candidate"}`}
                  subtitle={`${item.candidate_state || "State N/A"} â€¢ ${item.candidate_party || "Party N/A"} â€¢ ${item.category || "Consulting"}`}
                  meta={[
                    { label: "Amount", value: money(item.total_amount) },
                    { label: "Transactions", value: item.transaction_count || 0 },
                    { label: "Influence", value: item.influence_score || 0 },
                    { label: "Risk", value: item.risk_label || "Signal" },
                  ]}
                  right={<Badge tone="info">FEC</Badge>}
                />
              ))}
            </div>
          ) : null}
        </div>
      )}
    </SectionCard>
  );
}

function RelationshipIntelligencePanel({ graph, loading }) {
  const counts = graph?.counts || {};
  const insights = graph?.insights || {};
  const topInfluencers = insights.top_influencers || insights.topInfluencers || [];
  const strongestLinks = insights.strongest_links || insights.highStrengthLinks || [];
  const weakCoverage = insights.orphan_candidates || insights.orphanCandidates || [];

  const density = counts.nodes
    ? Math.round((number(counts.links) / Math.max(number(counts.nodes), 1)) * 100)
    : 0;

  return (
    <SectionCard
      title="Relationship Intelligence"
      subtitle="Candidate, consultant, and donor graph signals folded into executive command."
      right={
        <div className="vs-inline-actions" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Badge tone={weakCoverage.length ? "warning" : "active"}>
            {weakCoverage.length ? `${weakCoverage.length} weak coverage` : "Network stable"}
          </Badge>
          <Link className="vs-button vs-button-secondary" to="/relationship-graph">
            Open Graph
          </Link>
        </div>
      }
    >
      {loading ? (
        <EmptyState text="Loading relationship intelligence..." />
      ) : !graph ? (
        <EmptyState text="No relationship graph intelligence available yet." />
      ) : (
        <div className="vs-stack">
          <div className="vs-grid-4">
            <StatCard label="Candidates" value={counts.candidates || 0} subtext="Campaign nodes" />
            <StatCard label="Consultants" value={counts.consultants || 0} subtext="Operator nodes" />
            <StatCard label="Donors" value={counts.donors || 0} subtext="Funding nodes" />
            <StatCard label="Density" value={`${density}%`} subtext={`${counts.links || 0} weighted paths`} />
          </div>

          <div className="vs-grid-2" style={{ alignItems: "start" }}>
            <div className="vs-stack">
              <div className="vs-stat-label">Top Influence Nodes</div>
              {topInfluencers.length ? (
                topInfluencers.slice(0, 4).map((node) => (
                  <PremiumRow
                    key={node.id}
                    title={node.label || node.id}
                    subtitle={node.subtitle || node.type || "Relationship node"}
                    meta={[
                      { label: "Type", value: node.type || "Node" },
                      { label: "Influence", value: node.influence || 0 },
                    ]}
                    right={<Badge tone="info">{node.influence || 0}</Badge>}
                  />
                ))
              ) : (
                <EmptyState text="No influence nodes available." />
              )}
            </div>

            <div className="vs-stack">
              <div className="vs-stat-label">Strongest Paths</div>
              {strongestLinks.length ? (
                strongestLinks.slice(0, 4).map((link, index) => {
                  const source =
                    typeof link.source === "object"
                      ? link.source.label || link.source.id
                      : link.source;
                  const target =
                    typeof link.target === "object"
                      ? link.target.label || link.target.id
                      : link.target;

                  return (
                    <PremiumRow
                      key={`${source}-${target}-${index}`}
                      title={`${source} â†’ ${target}`}
                      subtitle={link.label || "Relationship path"}
                      meta={[
                        { label: "Strength", value: link.strength || 0 },
                        { label: "Type", value: link.type || "relationship" },
                      ]}
                      right={<Badge tone="active">{link.strength || 0}</Badge>}
                    />
                  );
                })
              ) : (
                <EmptyState text="No strong relationship paths available." />
              )}
            </div>
          </div>
        </div>
      )}
    </SectionCard>
  );
}

function BattlegroundPanel({ rows = [] }) {
  return (
    <SectionCard title="Top Battlegrounds" subtitle="Highest-pressure races right now.">
      <div className="vs-stack">
        {rows.length ? (
          rows.map((row) => (
            <PremiumRow
              key={row.race || `${row.state}-${row.office}`}
              title={row.race || `${row.state} ${row.office}`}
              subtitle={`${row.state || "State"} â€¢ ${row.office || "Race"}`}
              tone={toneFromSeverity(row.risk)}
              meta={[
                { label: "Win Prob.", value: row.probability || row.win_probability || "N/A" },
                { label: "Momentum", value: row.momentum || "N/A" },
                { label: "Risk", value: row.risk || "Watch" },
                { label: "Priority", value: row.priority || "Tier 2" },
              ]}
              right={<Badge tone={toneFromSeverity(row.risk)}>{row.risk || "Watch"}</Badge>}
            />
          ))
        ) : (
          <EmptyState text="No battleground races loaded." />
        )}
      </div>
    </SectionCard>
  );
}

function ExecutiveFeedPanel({ feed = [], loading }) {
  return (
    <SectionCard title="Executive Feed" subtitle="Live cross-signal intelligence stream.">
      {loading ? (
        <EmptyState text="Loading executive feed..." />
      ) : (
        <div className="vs-stack">
          {feed.length ? (
            feed.slice(0, 8).map((item) => (
              <PremiumRow
                key={item.id || `${item.time}-${item.title}`}
                title={item.title}
                subtitle={`${item.source || "Command Center"}${item.type ? ` â€¢ ${item.type}` : ""}`}
                tone={toneFromSeverity(item.severity)}
                live={["high", "critical"].includes(String(item.severity || "").toLowerCase())}
                meta={[
                  { label: "Time", value: item.time || "Now" },
                  { label: "Severity", value: item.severity || "Info" },
                  { label: "State", value: item.state || "National" },
                  { label: "Risk", value: item.risk || "Watch" },
                ]}
                right={<Badge tone={toneFromSeverity(item.severity)}>{item.severity || "Info"}</Badge>}
              />
            ))
          ) : (
            <EmptyState text="No executive feed items loaded." />
          )}
        </div>
      )}
    </SectionCard>
  );
}

function ActionPanel({ actions = [] }) {
  return (
    <SectionCard title="Execution Priorities" subtitle="Recommended command actions for the next cycle.">
      <div className="vs-stack">
        {actions.length ? (
          actions.slice(0, 8).map((item) => (
            <PremiumRow
              key={item.title}
              title={item.title}
              subtitle={item.detail || "Execution priority"}
              tone={toneFromSeverity(item.risk)}
              meta={[
                { label: "Owner", value: item.owner || "Command Team" },
                { label: "Due", value: item.due || "Today" },
                { label: "State", value: item.state || "National" },
                { label: "Risk", value: item.risk || "Watch" },
              ]}
              right={<Badge tone="accent">{item.due || "Today"}</Badge>}
            />
          ))
        ) : (
          <EmptyState text="No action priorities loaded." />
        )}
      </div>
    </SectionCard>
  );
}

function CrossSignalPanel({ data, loading }) {
  const priorities = data?.top_priorities || data?.results || [];
  const summary = data?.summary || {};

  return (
    <SectionCard
      title="Cross-Signal Priority Layer"
      subtitle="Finance, vendor, mail, relationship, and campaign pressure combined into one priority layer."
      right={<Badge tone={number(summary.critical_states) ? "danger" : "active"}>{summary.critical_states || 0} critical</Badge>}
    >
      {loading ? (
        <EmptyState text="Loading cross-signal intelligence..." />
      ) : (
        <div className="vs-stack">
          <div className="vs-grid-4">
            <StatCard label="Tracked States" value={summary.states_tracked || 0} subtext="Cross-signal engine" />
            <StatCard label="Critical States" value={summary.critical_states || 0} subtext="Immediate review" />
            <StatCard label="High States" value={summary.high_states || 0} subtext="Pressure rising" />
            <StatCard label="Vendor Gaps" value={summary.vendor_gap_states || 0} subtext="Coverage pressure" />
          </div>

          {priorities.length ? (
            priorities.slice(0, 6).map((item, index) => (
              <PremiumRow
                key={`${item.state}-${index}`}
                title={`#${index + 1} ${item.state || "National"} â€” ${item.severity || "Priority"}`}
                subtitle={(item.recommended_actions || []).join(" ") || "Multiple intelligence signals require executive review."}
                tone={toneFromSeverity(item.severity)}
                meta={[
                  { label: "Score", value: item.priority_score || 0 },
                  { label: "Receipts", value: money(item.finance?.receipts) },
                  { label: "Vendors", value: item.vendors?.coverage_status || "â€”" },
                  { label: "Mail Risk", value: item.mailops?.mail_risks || 0 },
                ]}
                right={<Badge tone={toneFromSeverity(item.severity)}>{item.risk || "Watch"}</Badge>}
              />
            ))
          ) : (
            <EmptyState text="No cross-signal priorities loaded." />
          )}
        </div>
      )}
    </SectionCard>
  );
}

export default function CommandCenter() {
  const [commandData, setCommandData] = useState(fallbackData);
  const [commandLoading, setCommandLoading] = useState(true);
  const [commandError, setCommandError] = useState("");

  const [crossSignal, setCrossSignal] = useState(fallbackCrossSignal);
  const [crossLoading, setCrossLoading] = useState(true);

  const [relationshipGraph, setRelationshipGraph] = useState(null);
  const [relationshipLoading, setRelationshipLoading] = useState(true);

  const [consultantIntel, setConsultantIntel] = useState(fallbackConsultantIntel);
  const [consultantLoading, setConsultantLoading] = useState(true);

  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(true);

  const demoMode =
    typeof window !== "undefined" && localStorage.getItem("vs_demo_mode") === "1";

  async function loadCommandData() {
    if (demoMode) {
      setCommandData(fallbackData);
      setCommandLoading(false);
      return;
    }

    try {
      setCommandLoading(true);
      setCommandError("");

      const result = api.commandCenter
        ? await api.commandCenter()
        : await api.get("/intelligence/command").then((r) => r.data);

      setCommandData(result || fallbackData);
    } catch (error) {
      setCommandError(error?.response?.data?.error || error?.message || "Failed to load command center.");
      setCommandData(fallbackData);
    } finally {
      setCommandLoading(false);
    }
  }

  async function loadCrossSignal() {
    if (demoMode) {
      setCrossSignal(fallbackCrossSignal);
      setCrossLoading(false);
      return;
    }

    try {
      setCrossLoading(true);

      const result = api.crossSignalIntelligence
        ? await api.crossSignalIntelligence()
        : await api.get("/intelligence/cross-signal").then((r) => r.data);

      setCrossSignal(result || fallbackCrossSignal);
    } catch {
      setCrossSignal(fallbackCrossSignal);
    } finally {
      setCrossLoading(false);
    }
  }

  async function loadRelationshipGraph() {
    if (demoMode) {
      setRelationshipGraph(null);
      setRelationshipLoading(false);
      return;
    }

    try {
      setRelationshipLoading(true);

      const result = api.relationshipGraph
        ? await api.relationshipGraph({ limit: 60 })
        : await api.get("/relationships/graph", { params: { limit: 60 } }).then((r) => r.data);

      setRelationshipGraph(unwrapGraph(result));
    } catch {
      setRelationshipGraph(null);
    } finally {
      setRelationshipLoading(false);
    }
  }

  async function loadConsultantIntel() {
    if (demoMode) {
      setConsultantIntel(fallbackConsultantIntel);
      setConsultantLoading(false);
      return;
    }

    try {
      setConsultantLoading(true);

      const result = await api
        .get("/consultants/risk/dashboard", { params: { limit: 20 } })
        .then((r) => r.data);

      setConsultantIntel(result || fallbackConsultantIntel);
    } catch {
      setConsultantIntel(fallbackConsultantIntel);
    } finally {
      setConsultantLoading(false);
    }
  }

  async function loadTasks() {
    if (demoMode) {
      setTasks([]);
      setTasksLoading(false);
      return;
    }

    try {
      setTasksLoading(true);

      const result = api.tasks
        ? await api.tasks({ limit: 100 })
        : await api.get("/tasks", { params: { limit: 100 } }).then((r) => r.data);

      setTasks(normalizeList(result));
    } catch {
      setTasks([]);
    } finally {
      setTasksLoading(false);
    }
  }

  async function refreshAll() {
    await Promise.all([
      loadCommandData(),
      loadCrossSignal(),
      loadRelationshipGraph(),
      loadConsultantIntel(),
      loadTasks(),
    ]);
  }

  async function runConsultantRiskScore() {
    try {
      setConsultantLoading(true);
      await api.post("/consultants/risk/score", {});
      await loadConsultantIntel();
    } catch {
      await loadConsultantIntel();
    }
  }

  useEffect(() => {
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demoMode]);

  const effectiveData = commandData || fallbackData;
  const metrics = effectiveData.metrics || fallbackData.metrics;
  const battlegrounds = effectiveData.battlegrounds || [];
  const actions = effectiveData.actions || [];
  const feed = effectiveData.feed || [];

  const executiveDecision = useMemo(
    () => buildDecision(feed, consultantIntel),
    [feed, consultantIntel]
  );

  const highSeverityCount = feed.filter((item) =>
    ["high", "critical"].includes(String(item.severity || "").toLowerCase())
  ).length;

  const consultantSummary = consultantIntel?.summary || {};
  const relationshipCounts = relationshipGraph?.counts || {};

  return (
    <PageShell
      eyebrow="Executive Command Center"
      title="Operate every campaign signal from one command surface."
      description="Fuse battlegrounds, cross-signal pressure, consultant intelligence, relationship graph exposure, and execution tasks into one operating layer."
      demo={demoMode}
      demoText="Demo command intelligence is active."
    >
      {commandError ? (
        <div className="vs-banner" style={{ borderColor: "#fecaca", background: "#fef2f2", color: "#b91c1c" }}>
          {commandError}
        </div>
      ) : null}

      <div className="vs-inline-actions" style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <div className="vs-chip-row">
          <Badge tone={highSeverityCount ? "danger" : "active"}>
            {highSeverityCount ? `${highSeverityCount} high-priority signals` : "Signals controlled"}
          </Badge>
          <Badge tone={number(consultantSummary.fec_consultants) ? "info" : "default"}>
            {consultantSummary.fec_consultants || 0} FEC consultants
          </Badge>
          <Badge tone={number(relationshipCounts.links) ? "accent" : "default"}>
            {relationshipCounts.links || 0} graph paths
          </Badge>
        </div>

        <div className="vs-inline-actions" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" className="vs-button vs-button-secondary" onClick={refreshAll}>
            Refresh Command Center
          </button>
          <button type="button" className="vs-button" onClick={runConsultantRiskScore} disabled={consultantLoading}>
            {consultantLoading ? "Scoring..." : "Run Consultant Risk Score"}
          </button>
        </div>
      </div>

      <MetricGrid metrics={metrics} />

      <SectionCard
        title="Executive Decision"
        subtitle="Highest-value action synthesized from command feed, consultant risk, and relationship intelligence."
        right={<Badge tone={executiveDecision?.level === "STABLE" ? "active" : "danger"}>{executiveDecision?.level || "STABLE"}</Badge>}
      >
        <div className="vs-card-muted" style={{ padding: 16, display: "grid", gap: 12 }}>
          <div style={{ color: "var(--vs-text)", fontSize: 18, fontWeight: 900 }}>
            {executiveDecision?.title}
          </div>

          <div className="vs-grid-3">
            {(executiveDecision?.actions || []).map((action) => (
              <div key={action} className="vs-banner" style={{ margin: 0 }}>
                {action}
              </div>
            ))}
          </div>

          <div>
            <Link className="vs-button vs-button-secondary" to={executiveDecision?.link || "/command-center"}>
              Open Recommended View
            </Link>
          </div>
        </div>
      </SectionCard>

      <ConsultantIntelligencePanel
        data={consultantIntel}
        loading={consultantLoading}
        onRefresh={loadConsultantIntel}
      />

      <RelationshipIntelligencePanel
        graph={relationshipGraph}
        loading={relationshipLoading}
      />

      <CrossSignalPanel data={crossSignal} loading={crossLoading} />

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 16, alignItems: "start" }}>
        <BattlegroundPanel rows={battlegrounds} />
        <ActionPanel actions={actions} />
      </div>

      <ExecutiveFeedPanel feed={feed} loading={commandLoading} />

      <SectionCard
        title="Executive Execution Board"
        subtitle="Live task layer connected to intelligence signals."
        right={<Badge tone={tasks.length ? "info" : "default"}>{tasks.length} tasks</Badge>}
      >
        {tasksLoading ? (
          <EmptyState text="Loading execution board..." />
        ) : (
          <ExecutionBoard tasks={tasks} compact />
        )}
      </SectionCard>
    </PageShell>
  );
}

