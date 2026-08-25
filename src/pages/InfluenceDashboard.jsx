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
  ["", "All States"],
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

const ENTITY_TYPES = [
  ["", "All Types"],
  ["candidate", "Candidates"],
  ["donor", "Donors"],
  ["vendor", "Vendors"],
  ["endorsement", "Endorsements"],
  ["consultant", "Consultants"],
  ["pac", "PACs"],
  ["committee", "Committees"],
  ["organization", "Organizations"],
  ["state", "States"],
  ["task", "Tasks"],
];

const fallbackSummary = {
  summary: {
    total_entities: 0,
    total_edges: 0,
    elite_entities: 0,
    high_influence_entities: 0,
    states_covered: 0,
    avg_influence: 0,
    top_influence: 0,
  },
  by_type: [],
  by_state: [],
};

function normalizeText(value = "") {
  return String(value || "").trim();
}

function number(value, fallback = 0) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function formatScore(value) {
  return `${Math.round(number(value))}/100`;
}

function formatNumber(value) {
  return number(value).toLocaleString();
}

function formatDecimal(value, digits = 1) {
  return number(value).toFixed(digits);
}

function scoreTone(value) {
  const score = number(value);

  if (score >= 90) return "danger";
  if (score >= 75) return "demo";
  if (score >= 55) return "info";
  return "accent";
}

function severityTone(value) {
  const severity = normalizeText(value).toLowerCase();

  if (severity === "critical") return "danger";
  if (severity === "high") return "demo";
  if (severity === "medium") return "info";
  return "accent";
}

function typeTone(value) {
  const type = normalizeText(value).toLowerCase();

  if (type === "candidate") return "accent";
  if (type === "donor") return "danger";
  if (type === "vendor") return "info";
  if (type === "endorsement") return "demo";
  if (type === "state") return "active";
  if (type === "task") return "default";
  if (type === "pac" || type === "committee") return "danger";
  return "accent";
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function entityTitle(entity = {}) {
  return (
    entity.entity_name ||
    entity.name ||
    entity.label ||
    entity.title ||
    "Unnamed Influence Entity"
  );
}

function entitySubtitle(entity = {}) {
  return [
    entity.entity_type,
    entity.state,
    entity.office,
    entity.party,
    entity.category,
  ]
    .filter(Boolean)
    .join(" • ") || "National influence entity";
}

function sourceTables(entity = {}) {
  const value = entity.source_tables;
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return value ? [value] : [];
    }
  }
  return [];
}

async function getInfluenceSummary() {
  if (typeof api.influenceSummary === "function") {
    return api.influenceSummary();
  }

  const response = await api.get("/influence/summary", { timeout: 15000 });
  return response?.data || response;
}

async function getInfluenceRankings(params = {}) {
  if (typeof api.influenceRankings === "function") {
    return api.influenceRankings(params);
  }

  const response = await api.get("/influence/rankings", {
    params,
    timeout: 15000,
  });

  return response?.data || response;
}

async function getInfluenceAlerts(params = {}) {
  if (typeof api.influenceAlerts === "function") {
    return api.influenceAlerts(params);
  }

  const response = await api.get("/influence/alerts", {
    params,
    timeout: 15000,
  });

  return response?.data || response;
}

async function syncInfluenceEngine() {
  if (typeof api.syncInfluence === "function") {
    return api.syncInfluence();
  }

  const response = await api.post("/influence/sync", {}, { timeout: 60000 });
  return response?.data || response;
}

function InfluenceEntityRow({ entity, selected, onSelect }) {
  const tables = sourceTables(entity);

  return (
    <div className={`influence-row-shell ${selected ? "is-selected" : ""}`}>
      <ResponsiveRow
        title={entityTitle(entity)}
        subtitle={entitySubtitle(entity)}
        meta={[
          { label: "Influence", value: formatScore(entity.influence_score) },
          { label: "Centrality", value: formatScore(entity.centrality_score) },
          { label: "Reach", value: formatScore(entity.reach_score) },
          { label: "Connections", value: entity.total_connections || 0 },
          { label: "Sources", value: tables.length || entity.source_count || 0 },
        ]}
        alert={
          number(entity.influence_score) >= 90
            ? "vs-live-dot"
            : number(entity.influence_score) >= 75
            ? "vs-live-dot-warning"
            : "vs-live-dot-success"
        }
        right={
          <div className="influence-actions">
            <Badge tone={typeTone(entity.entity_type)}>
              {entity.entity_type || "entity"}
            </Badge>
            <Badge tone={scoreTone(entity.influence_score)}>
              {formatScore(entity.influence_score)}
            </Badge>
            <button
              type="button"
              className="vs-button vs-button-secondary"
              onClick={() => onSelect(entity)}
            >
              Inspect
            </button>
          </div>
        }
      />
    </div>
  );
}

function AlertRow({ alert, onSelectEntity }) {
  return (
    <ResponsiveRow
      title={alert.title || "Influence Alert"}
      subtitle={alert.detail || "High-value influence signal detected."}
      meta={[
        { label: "State", value: alert.state || "National" },
        { label: "Severity", value: alert.severity || "medium" },
        { label: "Entity", value: alert.entity_type || "entity" },
        { label: "Influence", value: formatScore(alert.influence_score) },
      ]}
      right={
        <div className="influence-actions">
          <Badge tone={severityTone(alert.severity)}>
            {alert.severity || "medium"}
          </Badge>
          {alert.entity_name ? (
            <button
              type="button"
              className="vs-button vs-button-secondary"
              onClick={() =>
                onSelectEntity({
                  entity_key: alert.entity_key,
                  entity_type: alert.entity_type,
                  entity_name: alert.entity_name,
                  state: alert.state,
                  influence_score: alert.influence_score,
                })
              }
            >
              Inspect
            </button>
          ) : null}
        </div>
      }
    />
  );
}

function TypeBreakdownRow({ item }) {
  return (
    <ResponsiveRow
      title={item.entity_type || "Unknown"}
      subtitle={`${item.count || 0} entities`}
      meta={[
        { label: "Count", value: item.count || 0 },
        { label: "Average", value: formatScore(item.avg_score) },
      ]}
      right={<Badge tone={typeTone(item.entity_type)}>{formatScore(item.avg_score)}</Badge>}
    />
  );
}

function StateBreakdownRow({ item, onSelectState }) {
  return (
    <button
      type="button"
      className="influence-state-row"
      onClick={() => onSelectState(item.state)}
    >
      <div>
        <strong>{item.state || "Unknown"}</strong>
        <span>{item.entities || 0} entities • avg {formatScore(item.avg_score)}</span>
      </div>
      <Badge tone={scoreTone(item.top_score)}>{formatScore(item.top_score)}</Badge>
    </button>
  );
}

function SelectedInfluencePanel({ entity }) {
  if (!entity) {
    return <EmptyState text="Select an influence entity to inspect its graph context." />;
  }

  const tables = sourceTables(entity);

  return (
    <div className="influence-selected-panel">
      <div className="influence-selected-header">
        <div>
          <Badge tone={typeTone(entity.entity_type)}>
            {entity.entity_type || "entity"}
          </Badge>
          <h3>{entityTitle(entity)}</h3>
          <p>{entitySubtitle(entity)}</p>
        </div>
        <Badge tone={scoreTone(entity.influence_score)}>
          {formatScore(entity.influence_score)}
        </Badge>
      </div>

      <div className="vs-grid-2">
        <StatCard label="Influence" value={formatScore(entity.influence_score)} subtext="Composite score" />
        <StatCard label="Connections" value={entity.total_connections || 0} subtext="Direct graph links" />
        <StatCard label="Centrality" value={formatScore(entity.centrality_score)} subtext="Network position" />
        <StatCard label="Reach" value={formatScore(entity.reach_score)} subtext="Downstream visibility" />
      </div>

      <div className="influence-source-strip">
        {!tables.length ? (
          <span>No source tables reported</span>
        ) : (
          tables.map((source) => <span key={source}>{source}</span>)
        )}
      </div>

      <div className="influence-link-row">
        <Link
          className="vs-button"
          to={`/political-graph?entityType=${encodeURIComponent(entity.entity_type || "")}&entityName=${encodeURIComponent(entity.entity_name || "")}&state=${encodeURIComponent(entity.state || "")}`}
        >
          Open Political Graph
        </Link>

        {entity.state ? (
          <Link className="vs-button vs-button-secondary" to={`/executive-map?state=${entity.state}&layer=graph`}>
            Open Executive Map
          </Link>
        ) : null}
      </div>

      <PoliticalGraphContextPanel
        entityType={entity.entity_type || "organization"}
        entityId={entity.entity_key}
        entityName={entity.entity_name}
        state={entity.state}
        title="Influence Relationship Graph"
        subtitle="Political relationships connected to the selected influence entity."
        compact
      />
    </div>
  );
}

export default function InfluenceDashboard() {
  const [filters, setFilters] = useState({
    state: "",
    type: "",
    search: "",
    limit: 75,
  });

  const [summaryData, setSummaryData] = useState(fallbackSummary);
  const [rankingsData, setRankingsData] = useState({ results: [], count: 0 });
  const [alertsData, setAlertsData] = useState({ alerts: [], count: 0 });

  const [selectedEntity, setSelectedEntity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");

  async function loadDashboard({ quiet = false } = {}) {
    try {
      if (!quiet) setLoading(true);
      setError("");
      setMessage("");

      const [summary, rankings, alerts] = await Promise.all([
        getInfluenceSummary(),
        getInfluenceRankings({
          state: filters.state,
          type: filters.type,
          limit: filters.limit,
        }),
        getInfluenceAlerts({
          state: filters.state,
          limit: 50,
        }),
      ]);

      setSummaryData(summary || fallbackSummary);
      setRankingsData(rankings || { results: [], count: 0 });
      setAlertsData(alerts || { alerts: [], count: 0 });

      const first = safeArray(rankings?.results)[0] || null;

      setSelectedEntity((current) => {
        if (!current) return first;
        const exists = safeArray(rankings?.results).some(
          (item) => item.entity_key === current.entity_key
        );
        return exists ? current : first;
      });

      setLastUpdated(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401) {
        setError("Influence Dashboard requires an active sign-in token.");
      } else if (status === 404) {
        setError("Influence Engine API is not mounted yet. Confirm /api/influence routes are deployed.");
      } else {
        setError(
          err?.response?.data?.error ||
            err?.message ||
            "Failed to load Influence Dashboard."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSync() {
    try {
      setSyncing(true);
      setError("");
      setMessage("Syncing Influence Engine...");

      const result = await syncInfluenceEngine();

      setMessage(
        result?.summary
          ? `Influence sync complete: ${result.summary.total_entities || 0} entities and ${result.summary.total_edges || 0} edges.`
          : "Influence sync complete."
      );

      await loadDashboard({ quiet: true });
    } catch (err) {
      setMessage("");
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to sync Influence Engine."
      );
    } finally {
      setSyncing(false);
    }
  }

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.state, filters.type, filters.limit]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadDashboard({ quiet: true });
    }, 350);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.search]);

  const summary = summaryData?.summary || {};
  const byType = safeArray(summaryData?.by_type);
  const byState = safeArray(summaryData?.by_state);
  const alerts = safeArray(alertsData?.alerts);
  const rankings = safeArray(rankingsData?.results);

  const visibleRankings = useMemo(() => {
    const q = normalizeText(filters.search).toLowerCase();

    if (!q) return rankings;

    return rankings.filter((entity) => {
      const haystack = [
        entity.entity_name,
        entity.entity_type,
        entity.state,
        entity.office,
        entity.party,
        entity.category,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [rankings, filters.search]);

  const eliteCount = number(summary.elite_entities);
  const highCount = number(summary.high_influence_entities);
  const totalEntities = number(summary.total_entities);

  return (
    <PageShell
      eyebrow="National Influence Dashboard"
      title="National Influence Dashboard"
      description="Rank the most influential candidates, donors, vendors, endorsements, committees, organizations, states, and task signals across the VoterSpheres political graph."
      tickerItems={[
        { label: "Entities", value: `${formatNumber(totalEntities)}`, dotClass: "vs-live-dot-success" },
        { label: "Edges", value: `${formatNumber(summary.total_edges || 0)}`, dotClass: "vs-live-dot-warning" },
        { label: "Elite", value: `${eliteCount}`, dotClass: eliteCount ? "vs-live-dot" : "vs-live-dot-success" },
        { label: "High Influence", value: `${highCount}`, dotClass: highCount ? "vs-live-dot-warning" : "vs-live-dot-success" },
        { label: "States", value: `${summary.states_covered || 0}`, dotClass: "vs-live-dot-success" },
        { label: "Updated", value: syncing ? "Syncing" : lastUpdated || "Live", dotClass: syncing ? "vs-live-dot-warning" : "vs-live-dot-success" },
      ]}
    >
      <style>{`
        .influence-toolbar {
          display: grid;
          grid-template-columns: minmax(0, 1.2fr) minmax(180px, 0.4fr) minmax(180px, 0.4fr) minmax(150px, 0.25fr);
          gap: 12px;
          align-items: center;
        }

        .influence-layout {
          display: grid;
          grid-template-columns: minmax(0, 1.18fr) minmax(380px, 0.82fr);
          gap: 18px;
          align-items: start;
        }

        .influence-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 8px;
          flex-wrap: wrap;
        }

        .influence-row-shell {
          border-radius: 18px;
          border: 1px solid rgba(148, 163, 184, 0.14);
          background: rgba(15, 23, 42, 0.42);
          overflow: hidden;
        }

        .influence-row-shell.is-selected {
          border-color: rgba(99, 102, 241, 0.58);
          box-shadow: 0 0 0 1px rgba(99, 102, 241, 0.16), 0 16px 42px rgba(2, 6, 23, 0.22);
        }

        .influence-row-shell .vs-responsive-row {
          border: 0;
          background: transparent;
        }

        .influence-selected-panel {
          display: grid;
          gap: 14px;
        }

        .influence-selected-header {
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

        .influence-selected-header h3 {
          margin: 10px 0 5px;
          color: white;
          font-size: 22px;
          line-height: 1.1;
          font-weight: 950;
          letter-spacing: -0.04em;
        }

        .influence-selected-header p {
          margin: 0;
          color: rgba(203, 213, 225, 0.72);
          font-size: 13px;
          line-height: 1.45;
        }

        .influence-source-strip,
        .influence-link-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          align-items: center;
        }

        .influence-source-strip span {
          border-radius: 999px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          background: rgba(15, 23, 42, 0.58);
          color: rgba(226, 232, 240, 0.86);
          padding: 7px 10px;
          font-size: 11px;
          font-weight: 850;
        }

        .influence-state-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
          gap: 10px;
        }

        .influence-state-row {
          border: 1px solid rgba(148, 163, 184, 0.14);
          border-radius: 16px;
          background: rgba(15, 23, 42, 0.46);
          color: white;
          cursor: pointer;
          padding: 12px;
          display: flex;
          justify-content: space-between;
          gap: 10px;
          align-items: center;
          text-align: left;
        }

        .influence-state-row strong {
          display: block;
          color: white;
          font-size: 14px;
          font-weight: 950;
        }

        .influence-state-row span {
          display: block;
          margin-top: 4px;
          color: rgba(203, 213, 225, 0.68);
          font-size: 11px;
        }

        @media (max-width: 1100px) {
          .influence-layout,
          .influence-toolbar {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}
      {message ? <div className="vs-banner vs-live-banner-pulse">{message}</div> : null}

      <div className="vs-grid-4">
        <StatCard label="Influence Entities" value={formatNumber(totalEntities)} subtext="Scored people, orgs, states and tasks" tone="up" />
        <StatCard label="Influence Edges" value={formatNumber(summary.total_edges || 0)} subtext="Relationship connections" tone="up" />
        <StatCard label="Top Influence" value={formatScore(summary.top_influence)} subtext="Highest current score" tone={number(summary.top_influence) >= 90 ? "down" : "up"} />
        <StatCard label="Average Influence" value={formatDecimal(summary.avg_influence || 0, 1)} subtext="National average score" tone="up" />
      </div>

      <SectionCard
        title="Influence Controls"
        subtitle="Filter rankings by state, entity type, search term, or run a fresh Influence Engine sync."
        right={
          <div className="influence-actions">
            <Badge tone="active">Influence Engine</Badge>
            <button
              type="button"
              className="vs-button"
              disabled={syncing}
              onClick={handleSync}
            >
              {syncing ? "Syncing..." : "Sync Influence"}
            </button>
            <button
              type="button"
              className="vs-button vs-button-secondary"
              onClick={() => loadDashboard()}
            >
              Refresh
            </button>
          </div>
        }
      >
        <div className="influence-toolbar">
          <input
            className="vs-input"
            value={filters.search}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, search: event.target.value }))
            }
            placeholder="Search influence entity, type, state, office, category..."
          />

          <select
            className="vs-input"
            value={filters.state}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, state: event.target.value }))
            }
          >
            {STATES.map(([value, label]) => (
              <option key={value || "ALL"} value={value}>
                {label}
              </option>
            ))}
          </select>

          <select
            className="vs-input"
            value={filters.type}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, type: event.target.value }))
            }
          >
            {ENTITY_TYPES.map(([value, label]) => (
              <option key={value || "ALL"} value={value}>
                {label}
              </option>
            ))}
          </select>

          <select
            className="vs-input"
            value={filters.limit}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, limit: Number(event.target.value) }))
            }
          >
            <option value={25}>Top 25</option>
            <option value={50}>Top 50</option>
            <option value={75}>Top 75</option>
            <option value={100}>Top 100</option>
          </select>
        </div>
      </SectionCard>

      <div className="influence-layout">
        <div className="vs-stack">
          <SectionCard
            title="National Influence Rankings"
            subtitle="Entities ranked by influence, centrality, reach, momentum, and direct graph connections."
            right={<Badge tone="danger">{visibleRankings.length} ranked</Badge>}
          >
            <div className="vs-stack">
              {loading ? (
                <EmptyState text="Loading influence rankings..." />
              ) : !visibleRankings.length ? (
                <EmptyState text="No influence rankings match the active filters. Run Influence Sync if this is the first setup." />
              ) : (
                visibleRankings.map((entity) => (
                  <InfluenceEntityRow
                    key={entity.entity_key}
                    entity={entity}
                    selected={selectedEntity?.entity_key === entity.entity_key}
                    onSelect={setSelectedEntity}
                  />
                ))
              )}
            </div>
          </SectionCard>

          <SectionCard
            title="Influence Alerts"
            subtitle="Executive alerts generated from high-influence entities and relationship concentration."
            right={<Badge tone="demo">{alerts.length} alerts</Badge>}
          >
            <div className="vs-stack">
              {!alerts.length ? (
                <EmptyState text="No influence alerts available yet." />
              ) : (
                alerts.slice(0, 16).map((alert) => (
                  <AlertRow
                    key={alert.alert_key || alert.id}
                    alert={alert}
                    onSelectEntity={setSelectedEntity}
                  />
                ))
              )}
            </div>
          </SectionCard>
        </div>

        <div className="vs-stack">
          <SectionCard
            title="Selected Influence Entity"
            subtitle="Inspect the selected entity and open its relationship graph."
            right={
              selectedEntity ? (
                <Badge tone={typeTone(selectedEntity.entity_type)}>
                  {selectedEntity.entity_type || "entity"}
                </Badge>
              ) : null
            }
          >
            <SelectedInfluencePanel entity={selectedEntity} />
          </SectionCard>

          <SectionCard
            title="Entity Type Breakdown"
            subtitle="Influence footprint by political entity class."
            right={<Badge tone="info">{byType.length} types</Badge>}
          >
            <div className="vs-stack">
              {!byType.length ? (
                <EmptyState text="No entity type summary available yet." />
              ) : (
                byType.map((item) => (
                  <TypeBreakdownRow key={item.entity_type} item={item} />
                ))
              )}
            </div>
          </SectionCard>
        </div>
      </div>

      <SectionCard
        title="State Influence Heat"
        subtitle="States ranked by the strongest top influence score and entity density."
        right={<Badge tone="accent">{byState.length} states</Badge>}
      >
        <div className="influence-state-grid">
          {!byState.length ? (
            <EmptyState text="No state influence breakdown available yet." />
          ) : (
            byState.slice(0, 51).map((item) => (
              <StateBreakdownRow
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
    </PageShell>
  );
}

