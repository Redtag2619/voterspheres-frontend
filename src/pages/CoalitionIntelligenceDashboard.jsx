import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";

import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import ResponsiveRow from "../components/ui/ResponsiveRow";
import PoliticalGraphContextPanel from "../components/graph/PoliticalGraphContextPanel";

const STATES = [
  ["", "All States"], ["AL", "Alabama"], ["AK", "Alaska"], ["AZ", "Arizona"], ["AR", "Arkansas"],
  ["CA", "California"], ["CO", "Colorado"], ["CT", "Connecticut"], ["DE", "Delaware"], ["DC", "District of Columbia"],
  ["FL", "Florida"], ["GA", "Georgia"], ["HI", "Hawaii"], ["ID", "Idaho"], ["IL", "Illinois"],
  ["IN", "Indiana"], ["IA", "Iowa"], ["KS", "Kansas"], ["KY", "Kentucky"], ["LA", "Louisiana"],
  ["ME", "Maine"], ["MD", "Maryland"], ["MA", "Massachusetts"], ["MI", "Michigan"], ["MN", "Minnesota"],
  ["MS", "Mississippi"], ["MO", "Missouri"], ["MT", "Montana"], ["NE", "Nebraska"], ["NV", "Nevada"],
  ["NH", "New Hampshire"], ["NJ", "New Jersey"], ["NM", "New Mexico"], ["NY", "New York"], ["NC", "North Carolina"],
  ["ND", "North Dakota"], ["OH", "Ohio"], ["OK", "Oklahoma"], ["OR", "Oregon"], ["PA", "Pennsylvania"],
  ["RI", "Rhode Island"], ["SC", "South Carolina"], ["SD", "South Dakota"], ["TN", "Tennessee"],
  ["TX", "Texas"], ["UT", "Utah"], ["VT", "Vermont"], ["VA", "Virginia"], ["WA", "Washington"],
  ["WV", "West Virginia"], ["WI", "Wisconsin"], ["WY", "Wyoming"],
];

const TYPES = [
  ["", "All Coalition Types"],
  ["candidate", "Candidate Coalitions"],
  ["donor", "Donor Coalitions"],
  ["endorsement", "Endorsement Coalitions"],
  ["vendor", "Vendor Coalitions"],
  ["committee", "Committee Coalitions"],
  ["organization", "Organization Coalitions"],
  ["task", "Task Coalitions"],
];

function n(value, fallback = 0) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function fmtScore(value) {
  return `${Math.round(n(value))}%`;
}

function fmtNum(value) {
  return n(value).toLocaleString();
}

function tone(score) {
  const value = n(score);
  if (value >= 85) return "danger";
  if (value >= 70) return "demo";
  if (value >= 50) return "info";
  return "accent";
}

function priorityTone(priority = "") {
  const value = String(priority || "").toLowerCase();
  if (value === "critical") return "danger";
  if (value === "high") return "demo";
  if (value === "medium") return "info";
  return "accent";
}

async function getSummary() {
  if (typeof api.coalitionSummary === "function") return api.coalitionSummary();
  const response = await api.get("/coalitions/summary", { timeout: 15000 });
  return response?.data || response;
}

async function getRankings(params) {
  if (typeof api.coalitionRankings === "function") return api.coalitionRankings(params);
  const response = await api.get("/coalitions/rankings", { params, timeout: 15000 });
  return response?.data || response;
}

async function getActions(params) {
  if (typeof api.coalitionActions === "function") return api.coalitionActions(params);
  const response = await api.get("/coalitions/actions", { params, timeout: 15000 });
  return response?.data || response;
}

async function recalculate() {
  if (typeof api.recalculateCoalitions === "function") return api.recalculateCoalitions();
  const response = await api.post("/coalitions/recalculate", {}, { timeout: 60000 });
  return response?.data || response;
}

function CoalitionRow({ item, selected, onSelect }) {
  const members = safeArray(item.members);

  return (
    <div className={`coalition-row-shell ${selected ? "is-selected" : ""}`}>
      <ResponsiveRow
        title={item.coalition_name || "Coalition"}
        subtitle={`${item.state || "National"} • ${item.coalition_type || "coalition"} • ${item.entity_count || members.length || 0} members`}
        meta={[
          { label: "Coalition", value: fmtScore(item.coalition_score) },
          { label: "Cohesion", value: fmtScore(item.cohesion_score) },
          { label: "Opportunity", value: fmtScore(item.opportunity_score) },
          { label: "Risk", value: fmtScore(item.risk_score) },
          { label: "Forecast", value: fmtScore(item.forecast_probability) },
        ]}
        alert={
          n(item.coalition_score) >= 85
            ? "vs-live-dot"
            : n(item.coalition_score) >= 70
              ? "vs-live-dot-warning"
              : "vs-live-dot-success"
        }
        right={
          <div className="coalition-actions">
            <Badge tone={tone(item.coalition_score)}>{fmtScore(item.coalition_score)}</Badge>
            <button type="button" className="vs-button vs-button-secondary" onClick={() => onSelect(item)}>
              Inspect
            </button>
          </div>
        }
      />

      {members.length ? (
        <div className="coalition-members">
          {members.slice(0, 5).map((member) => (
            <span key={member.entity_key || member.entity_name}>
              {member.entity_name} · {fmtScore(member.influence_score)}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ActionRow({ action }) {
  return (
    <ResponsiveRow
      title={action.title || "Coalition Action"}
      subtitle={action.detail || "Coalition intelligence action"}
      meta={[
        { label: "State", value: action.state || "National" },
        { label: "Priority", value: action.priority || "medium" },
        { label: "Owner", value: action.recommended_owner || "Political Intelligence" },
        { label: "Due", value: action.due_label || "This Week" },
      ]}
      right={<Badge tone={priorityTone(action.priority)}>{action.priority || "medium"}</Badge>}
    />
  );
}

function BreakdownRow({ item, labelKey = "coalition_type", countKey = "count" }) {
  return (
    <ResponsiveRow
      title={item[labelKey] || "Unknown"}
      subtitle={`${item[countKey] || 0} coalitions`}
      meta={[
        { label: "Average", value: fmtScore(item.avg_score) },
        { label: "Top", value: fmtScore(item.top_score) },
      ]}
      right={<Badge tone={tone(item.top_score)}>{fmtScore(item.top_score)}</Badge>}
    />
  );
}

function SelectedCoalitionPanel({ coalition }) {
  if (!coalition) return <EmptyState text="Select a coalition to inspect members, actions, and relationship context." />;

  const members = safeArray(coalition.members);

  return (
    <div className="coalition-selected">
      <div className="coalition-selected-header">
        <div>
          <Badge tone={tone(coalition.coalition_score)}>{coalition.coalition_type || "coalition"}</Badge>
          <h3>{coalition.coalition_name}</h3>
          <p>{coalition.recommended_action || "Coalition intelligence recommendation unavailable."}</p>
        </div>
        <Badge tone={tone(coalition.coalition_score)}>{fmtScore(coalition.coalition_score)}</Badge>
      </div>

      <div className="vs-grid-2">
        <StatCard label="Coalition" value={fmtScore(coalition.coalition_score)} subtext="Composite coalition score" />
        <StatCard label="Cohesion" value={fmtScore(coalition.cohesion_score)} subtext="Relationship density" />
        <StatCard label="Opportunity" value={fmtScore(coalition.opportunity_score)} subtext="Activation potential" />
        <StatCard label="Forecast" value={fmtScore(coalition.forecast_probability)} subtext="Formation probability" />
      </div>

      <div className="coalition-link-row">
        <Link
          className="vs-button"
          to={`/political-graph?entityType=${encodeURIComponent(coalition.coalition_type || "")}&entityName=${encodeURIComponent(coalition.lead_entity_name || coalition.coalition_name || "")}&state=${encodeURIComponent(coalition.state || "")}`}
        >
          Open Political Graph
        </Link>
        <Link className="vs-button vs-button-secondary" to={`/forecast?state=${encodeURIComponent(coalition.state || "")}`}>
          Open Forecast Dashboard
        </Link>
        <Link className="vs-button vs-button-secondary" to={`/command-center?state=${encodeURIComponent(coalition.state || "")}&source=coalition-intelligence`}>
          Open Command Center
        </Link>
      </div>

      <SectionCard
        title="Coalition Members"
        subtitle="Top influence members inside this coalition cluster."
        right={<Badge tone="info">{members.length} members</Badge>}
      >
        <div className="vs-stack">
          {!members.length ? (
            <EmptyState text="No coalition members available." />
          ) : (
            members.slice(0, 10).map((member) => (
              <ResponsiveRow
                key={member.entity_key || member.entity_name}
                title={member.entity_name}
                subtitle={`${member.entity_type || "entity"} • ${member.state || "National"}`}
                meta={[
                  { label: "Influence", value: fmtScore(member.influence_score) },
                  { label: "Centrality", value: fmtScore(member.centrality_score) },
                  { label: "Reach", value: fmtScore(member.reach_score) },
                  { label: "Connections", value: member.total_connections || 0 },
                ]}
                right={<Badge tone={tone(member.influence_score)}>{fmtScore(member.influence_score)}</Badge>}
              />
            ))
          )}
        </div>
      </SectionCard>

      {coalition.lead_entity_name ? (
        <PoliticalGraphContextPanel
          entityType={coalition.lead_entity_type || coalition.coalition_type || "organization"}
          entityId={coalition.lead_entity_key || coalition.coalition_key}
          entityName={coalition.lead_entity_name}
          state={coalition.state}
          title="Coalition Relationship Context"
          subtitle="Political graph context connected to this coalition lead."
          compact
        />
      ) : null}
    </div>
  );
}

export default function CoalitionIntelligenceDashboard() {
  const [filters, setFilters] = useState({ state: "", type: "", search: "", limit: 75 });
  const [summaryData, setSummaryData] = useState({ summary: {}, by_type: [], by_state: [] });
  const [rankingsData, setRankingsData] = useState({ results: [], count: 0 });
  const [actionsData, setActionsData] = useState({ actions: [], count: 0 });
  const [selectedCoalition, setSelectedCoalition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");

  async function loadDashboard({ quiet = false } = {}) {
    try {
      if (!quiet) setLoading(true);
      setError("");
      if (!quiet) setMessage("");

      const [summary, rankings, actions] = await Promise.all([
        getSummary(),
        getRankings({ state: filters.state, type: filters.type, limit: filters.limit }),
        getActions({ state: filters.state, limit: 50 }),
      ]);

      setSummaryData(summary || { summary: {}, by_type: [], by_state: [] });
      setRankingsData(rankings || { results: [], count: 0 });
      setActionsData(actions || { actions: [], count: 0 });

      const first = safeArray(rankings?.results)[0] || null;
      setSelectedCoalition((current) => current || first);
      setLastUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401) setError("Coalition Intelligence requires an active sign-in token.");
      else if (status === 404) setError("Coalition Intelligence API is not mounted yet. Confirm Build 2B backend is deployed.");
      else setError(err?.response?.data?.error || err?.message || "Failed to load Coalition Intelligence.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRecalculate() {
    try {
      setRecalculating(true);
      setError("");
      setMessage("Recalculating coalition intelligence...");

      const result = await recalculate();

      setMessage(
        result?.summary
          ? `Coalition recalculation complete: ${result.summary.coalitions || 0} coalitions across ${result.summary.states_covered || 0} states.`
          : "Coalition recalculation complete."
      );

      await loadDashboard({ quiet: true });
    } catch (err) {
      setMessage("");
      setError(err?.response?.data?.error || err?.message || "Failed to recalculate coalitions.");
    } finally {
      setRecalculating(false);
    }
  }

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.state, filters.type, filters.limit]);

  useEffect(() => {
    const timer = setTimeout(() => loadDashboard({ quiet: true }), 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.search]);

  const coalitions = safeArray(rankingsData.results);
  const actions = safeArray(actionsData.actions);
  const byType = safeArray(summaryData.by_type);
  const byState = safeArray(summaryData.by_state);
  const summary = summaryData.summary || {};

  const visibleCoalitions = useMemo(() => {
    const q = String(filters.search || "").toLowerCase().trim();
    if (!q) return coalitions;

    return coalitions.filter((item) =>
      [
        item.coalition_name,
        item.coalition_type,
        item.state,
        item.lead_entity_name,
        item.recommended_action,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [coalitions, filters.search]);

  return (
    <PageShell
      eyebrow="National Coalition Intelligence"
      title="National Coalition Intelligence"
      description="Identify coalition clusters across candidates, donors, endorsements, vendors, committees, organizations, states, and Command Center actions."
      tickerItems={[
        { label: "Coalitions", value: `${fmtNum(summary.total_coalitions || coalitions.length)}`, dotClass: "vs-live-dot-success" },
        { label: "Critical", value: `${summary.critical_coalitions || 0}`, dotClass: summary.critical_coalitions ? "vs-live-dot" : "vs-live-dot-success" },
        { label: "High Value", value: `${summary.high_value_coalitions || 0}`, dotClass: summary.high_value_coalitions ? "vs-live-dot-warning" : "vs-live-dot-success" },
        { label: "States", value: `${summary.states_covered || 0}`, dotClass: "vs-live-dot-success" },
        { label: "Actions", value: `${actions.length}`, dotClass: actions.length ? "vs-live-dot-warning" : "vs-live-dot-success" },
        { label: "Updated", value: recalculating ? "Recalculating" : lastUpdated || "Live", dotClass: recalculating ? "vs-live-dot-warning" : "vs-live-dot-success" },
      ]}
    >
      <style>{`
        .coalition-toolbar {
          display: grid;
          grid-template-columns: minmax(0, 1.2fr) minmax(180px, 0.42fr) minmax(220px, 0.5fr) minmax(150px, 0.25fr);
          gap: 12px;
          align-items: center;
        }

        .coalition-layout {
          display: grid;
          grid-template-columns: minmax(0, 1.18fr) minmax(380px, 0.82fr);
          gap: 18px;
          align-items: start;
        }

        .coalition-actions,
        .coalition-link-row {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .coalition-row-shell {
          border: 1px solid rgba(148, 163, 184, 0.14);
          border-radius: 18px;
          background: rgba(15, 23, 42, 0.42);
          overflow: hidden;
        }

        .coalition-row-shell.is-selected {
          border-color: rgba(99, 102, 241, 0.58);
          box-shadow: 0 0 0 1px rgba(99, 102, 241, 0.16), 0 16px 42px rgba(2, 6, 23, 0.22);
        }

        .coalition-row-shell .vs-responsive-row {
          border: 0;
          background: transparent;
        }

        .coalition-members {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          padding: 0 14px 14px;
        }

        .coalition-members span {
          border-radius: 999px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          background: rgba(15, 23, 42, 0.58);
          color: rgba(226, 232, 240, 0.86);
          padding: 7px 10px;
          font-size: 11px;
          font-weight: 850;
        }

        .coalition-selected {
          display: grid;
          gap: 14px;
        }

        .coalition-selected-header {
          border-radius: 22px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          background:
            radial-gradient(circle at top right, rgba(168, 85, 247, 0.18), transparent 36%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.86), rgba(2, 6, 23, 0.62));
          padding: 16px;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 14px;
        }

        .coalition-selected-header h3 {
          margin: 10px 0 5px;
          color: white;
          font-size: 22px;
          line-height: 1.1;
          font-weight: 950;
          letter-spacing: -0.04em;
        }

        .coalition-selected-header p {
          margin: 0;
          color: rgba(203, 213, 225, 0.72);
          font-size: 13px;
          line-height: 1.45;
        }

        @media (max-width: 1100px) {
          .coalition-layout,
          .coalition-toolbar {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}
      {message ? <div className="vs-banner vs-live-banner-pulse">{message}</div> : null}

      <div className="vs-grid-4">
        <StatCard label="Total Coalitions" value={fmtNum(summary.total_coalitions || coalitions.length)} subtext="Active coalition clusters" />
        <StatCard label="Top Score" value={fmtScore(summary.top_coalition_score)} subtext="Highest coalition strength" />
        <StatCard label="Average Score" value={fmtScore(summary.avg_coalition_score)} subtext="National coalition average" />
        <StatCard label="States Covered" value={summary.states_covered || 0} subtext="States with coalition clusters" />
      </div>

      <SectionCard
        title="Coalition Intelligence Controls"
        subtitle="Filter coalition clusters by state, type, and search term."
        right={
          <div className="coalition-actions">
            <button type="button" className="vs-button" disabled={recalculating} onClick={handleRecalculate}>
              {recalculating ? "Recalculating..." : "Recalculate Coalitions"}
            </button>
            <button type="button" className="vs-button vs-button-secondary" onClick={() => loadDashboard()}>
              Refresh
            </button>
          </div>
        }
      >
        <div className="coalition-toolbar">
          <input
            className="vs-input"
            value={filters.search}
            onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
            placeholder="Search coalition, lead entity, state, type, recommendation..."
          />

          <select className="vs-input" value={filters.state} onChange={(event) => setFilters((prev) => ({ ...prev, state: event.target.value }))}>
            {STATES.map(([value, label]) => <option key={value || "ALL"} value={value}>{label}</option>)}
          </select>

          <select className="vs-input" value={filters.type} onChange={(event) => setFilters((prev) => ({ ...prev, type: event.target.value }))}>
            {TYPES.map(([value, label]) => <option key={value || "ALL"} value={value}>{label}</option>)}
          </select>

          <select className="vs-input" value={filters.limit} onChange={(event) => setFilters((prev) => ({ ...prev, limit: Number(event.target.value) }))}>
            <option value={25}>Top 25</option>
            <option value={50}>Top 50</option>
            <option value={75}>Top 75</option>
            <option value={100}>Top 100</option>
          </select>
        </div>
      </SectionCard>

      <div className="coalition-layout">
        <div className="vs-stack">
          <SectionCard
            title="Coalition Rankings"
            subtitle="Coalitions ranked by cohesion, influence, opportunity, risk, and forecast probability."
            right={<Badge tone="danger">{visibleCoalitions.length} coalitions</Badge>}
          >
            <div className="vs-stack">
              {loading ? (
                <EmptyState text="Loading coalition intelligence..." />
              ) : !visibleCoalitions.length ? (
                <EmptyState text="No coalitions found. Run Recalculate Coalitions after Influence Engine data has synced." />
              ) : (
                visibleCoalitions.map((item) => (
                  <CoalitionRow
                    key={item.coalition_key || item.id}
                    item={item}
                    selected={selectedCoalition?.coalition_key === item.coalition_key}
                    onSelect={setSelectedCoalition}
                  />
                ))
              )}
            </div>
          </SectionCard>

          <div className="vs-grid-2">
            <SectionCard title="Coalition Actions" subtitle="Recommended Command Center follow-ups." right={<Badge tone="demo">{actions.length}</Badge>}>
              <div className="vs-stack">
                {!actions.length ? (
                  <EmptyState text="No coalition actions available." />
                ) : (
                  actions.slice(0, 10).map((action) => <ActionRow key={action.action_key || action.id} action={action} />)
                )}
              </div>
            </SectionCard>

            <SectionCard title="Coalition Types" subtitle="Coalition footprint by entity class." right={<Badge tone="info">{byType.length} types</Badge>}>
              <div className="vs-stack">
                {!byType.length ? (
                  <EmptyState text="No coalition type breakdown available." />
                ) : (
                  byType.slice(0, 10).map((item) => <BreakdownRow key={item.coalition_type} item={item} />)
                )}
              </div>
            </SectionCard>
          </div>
        </div>

        <div className="vs-stack">
          <SectionCard
            title="Selected Coalition"
            subtitle="Inspect the selected coalition and move into graph, forecast, or Command Center workflows."
            right={selectedCoalition ? <Badge tone={tone(selectedCoalition.coalition_score)}>{fmtScore(selectedCoalition.coalition_score)}</Badge> : null}
          >
            <SelectedCoalitionPanel coalition={selectedCoalition} />
          </SectionCard>

          <SectionCard title="State Coalition Heat" subtitle="States ranked by coalition score and density." right={<Badge tone="accent">{byState.length} states</Badge>}>
            <div className="vs-stack">
              {!byState.length ? (
                <EmptyState text="No state coalition breakdown available." />
              ) : (
                byState.slice(0, 12).map((item) => (
                  <ResponsiveRow
                    key={item.state}
                    title={item.state || "Unknown"}
                    subtitle={`${item.coalitions || 0} coalitions`}
                    meta={[
                      { label: "Average", value: fmtScore(item.avg_score) },
                      { label: "Top", value: fmtScore(item.top_score) },
                    ]}
                    right={<Badge tone={tone(item.top_score)}>{fmtScore(item.top_score)}</Badge>}
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
