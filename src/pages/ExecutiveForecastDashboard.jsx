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

const FORECAST_TYPES = [
  ["", "All Forecasts"],
  ["influence_growth", "Influence Growth"],
  ["influence_decline", "Influence Decline"],
  ["donor_migration", "Donor Migration"],
  ["endorsement_probability", "Endorsement Probability"],
  ["vendor_recommendation", "Vendor Recommendation"],
];

function n(value, fallback = 0) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function fmtScore(value) {
  return `${Math.round(n(value))}/100`;
}

function fmtFullPercent(value) {
  return `${Math.round(n(value))}%`;
}

function fmtPct(value) {
  return `${Math.round(n(value))}%`;
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

function typeTone(value = "") {
  const text = String(value || "").toLowerCase();
  if (text.includes("decline") || text.includes("risk")) return "danger";
  if (text.includes("growth") || text.includes("opportunity")) return "active";
  if (text.includes("donor")) return "danger";
  if (text.includes("endorsement")) return "demo";
  if (text.includes("vendor")) return "info";
  if (text.includes("coalition")) return "accent";
  return "default";
}

function itemTitle(item = {}) {
  return item.title || item.entity_name || item.lead_entity_name || item.source_name || "Forecast Signal";
}

function itemDetail(item = {}) {
  return item.detail || [
    item.forecast_type || item.coalition_type || item.relationship_type || "link",
    item.state,
    item.entity_type || item.source_type,
    item.horizon_days ? `${item.horizon_days} day horizon` : "",
  ].filter(Boolean).join(" • ") || "Forecast intelligence signal";
}


function itemEntityName(item = {}) {
  return item.entity_name || item.lead_entity_name || item.source_name || item.target_name || "";
}

function itemEntityType(item = {}) {
  return item.entity_type || item.coalition_type || item.source_type || "organization";
}

async function apiGet(path, params = {}) {
  const response = await api.get(path, { params, timeout: 15000 });
  return response?.data || response;
}

async function apiPost(path, body = {}) {
  const response = await api.post(path, body, { timeout: 60000 });
  return response?.data || response;
}

async function loadForecast(params) {
  if (typeof api.influenceForecast === "function") return api.influenceForecast(params);
  return apiGet("/influence/forecast", params);
}

async function loadOpportunities(params) {
  if (typeof api.influenceOpportunities === "function") return api.influenceOpportunities(params);
  return apiGet("/influence/opportunities", params);
}

async function loadRisk(params) {
  if (typeof api.influenceRisk === "function") return api.influenceRisk(params);
  return apiGet("/influence/risk", params);
}

async function loadMomentum(params) {
  if (typeof api.influenceMomentum === "function") return api.influenceMomentum(params);
  return apiGet("/influence/momentum", params);
}

async function recalculateForecast(syncFirst) {
  if (typeof api.recalculateInfluenceForecast === "function") {
    return api.recalculateInfluenceForecast({ syncFirst });
  }
  return apiPost("/influence/recalculate", { syncFirst });
}

function ForecastRow({ item, selected, onSelect }) {
  return (
    <div className={`forecast-row-shell ${selected ? "is-selected" : ""}`}>
      <ResponsiveRow
        title={itemTitle(item)}
        subtitle={itemDetail(item)}
        meta={[
          { label: "Probability", value: fmtPct(item.probability) },
          { label: "Opportunity", value: fmtFullPercent(item.opportunity_score || item.coalition_score) },
          { label: "Momentum", value: fmtFullPercent(item.momentum_score) },
          { label: "Risk", value: fmtFullPercent(item.risk_score) },
          { label: "Confidence", value: fmtFullPercent(item.confidence_score) },
        ]}
        alert={n(item.probability) >= 85 ? "vs-live-dot" : n(item.probability) >= 70 ? "vs-live-dot-warning" : "vs-live-dot-success"}
        right={
          <div className="forecast-actions">
            <Badge tone={typeTone(item.forecast_type || item.coalition_type || item.relationship_type)}>
              {item.forecast_type || item.coalition_type || item.relationship_type || "forecast"}
            </Badge>
            <Badge tone={toneByScore(item.probability)}>{fmtPct(item.probability)}</Badge>
            <button type="button" className="vs-button vs-button-secondary" onClick={() => onSelect(item)}>
              Inspect
            </button>
          </div>
        }
      />
    </div>
  );
}

function RelationshipRow({ item, onSelect }) {
  return (
    <ResponsiveRow
      title={item.title || `${item.source_name || "Source"} → ${item.target_name || "Target"}`}
      subtitle={item.detail || `${item.relationship_type || "link"} forecast`}
      meta={[
        { label: "State", value: item.state || "National" },
        { label: "Type", value: item.relationship_type || "link" },
        { label: "Probability", value: fmtPct(item.probability) },
        { label: "Strength", value: fmtFullPercent(item.strength_score) },
      ]}
      right={
        <div className="forecast-actions">
          <Badge tone={toneByScore(item.probability)}>{fmtPct(item.probability)}</Badge>
          <button type="button" className="vs-button vs-button-secondary" onClick={() => onSelect(item)}>
            Inspect
          </button>
        </div>
      }
    />
  );
}

function CoalitionRow({ item, onSelect }) {
  const members = safeArray(item.members);

  return (
    <div className="coalition-card">
      <ResponsiveRow
        title={item.title || `${item.state || "National"} coalition forecast`}
        subtitle={item.detail || "Coalition formation forecast"}
        meta={[
          { label: "State", value: item.state || "National" },
          { label: "Type", value: item.coalition_type || "coalition" },
          { label: "Members", value: item.entity_count || members.length || 0 },
          { label: "Probability", value: fmtPct(item.probability) },
          { label: "Score", value: fmtScore(item.coalition_score) },
        ]}
        right={
          <div className="forecast-actions">
            <Badge tone="accent">Coalition</Badge>
            <Badge tone={toneByScore(item.probability)}>{fmtPct(item.probability)}</Badge>
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

function SelectedForecastPanel({ item }) {
  if (!item) return <EmptyState text="Select a forecast to inspect the executive context." />;

  const selectedName = itemEntityName(item);
  const selectedType = itemEntityType(item);
  const selectedState = item.state || "";

  return (
    <div className="selected-forecast-panel">
      <div className="selected-forecast-header">
        <div>
          <Badge tone={typeTone(item.forecast_type || item.coalition_type || item.relationship_type)}>
            {item.forecast_type || item.coalition_type || item.relationship_type || "forecast"}
          </Badge>
          <h3>{itemTitle(item)}</h3>
          <p>{itemDetail(item)}</p>
        </div>
        <Badge tone={toneByScore(item.probability)}>{fmtPct(item.probability)}</Badge>
      </div>

      <div className="vs-grid-2">
        <StatCard label="Probability" value={fmtPct(item.probability)} subtext="Forecast likelihood" />
        <StatCard label="Confidence" value={fmtFullPercent(item.confidence_score)} subtext="Data confidence" />
        <StatCard label="Opportunity" value={fmtFullPercent(item.opportunity_score || item.coalition_score)} subtext="Growth potential" />
        <StatCard label="Risk" value={fmtFullPercent(item.risk_score)} subtext="Downside exposure" />
      </div>

      {item.recommended_action ? (
        <div className="forecast-recommendation">
          <span>Recommended Executive Action</span>
          <p>{item.recommended_action}</p>
        </div>
      ) : null}

      <div className="forecast-link-row">
        <Link className="vs-button" to={`/influence?state=${encodeURIComponent(selectedState)}&search=${encodeURIComponent(selectedName)}&type=${encodeURIComponent(selectedType)}`}>
          Open Influence Dashboard
        </Link>
        <Link className="vs-button vs-button-secondary" to={`/political-graph?entityType=${encodeURIComponent(selectedType)}&entityName=${encodeURIComponent(selectedName)}&state=${encodeURIComponent(selectedState)}`}>
          Open Political Graph
        </Link>
        {selectedState ? (
          <Link className="vs-button vs-button-secondary" to={`/executive-map?state=${selectedState}&layer=graph`}>
            Open Executive Map
          </Link>
        ) : null}
      </div>

      {selectedName ? (
        <PoliticalGraphContextPanel
          entityType={selectedType}
          entityId={item.entity_key || item.lead_entity_key || item.source_key}
          entityName={selectedName}
          state={selectedState}
          title="Forecast Relationship Context"
          subtitle="Political graph context connected to this forecast signal."
          compact
        />
      ) : null}
    </div>
  );
}

function BriefCard({ title, value, detail, tone = "accent" }) {
  return (
    <div className={`brief-card ${tone}`}>
      <span>{title}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </div>
  );
}

function buildBrief({ predictions, opportunities, risks, momentum, coalitions }) {
  const lines = [];
  if (predictions[0]) lines.push(`${itemTitle(predictions[0])} is the highest-probability forecast at ${fmtPct(predictions[0].probability)}.`);
  if (opportunities[0]) lines.push(`${itemEntityName(opportunities[0]) || itemTitle(opportunities[0])} is the strongest opportunity signal with opportunity ${fmtFullPercent(opportunities[0].opportunity_score)}.`);
  if (risks[0]) lines.push(`${itemEntityName(risks[0]) || itemTitle(risks[0])} carries the highest forecast risk at ${fmtFullPercent(risks[0].risk_score)}.`);
  if (momentum[0]) lines.push(`${itemEntityName(momentum[0]) || itemTitle(momentum[0])} has notable momentum at ${fmtFullPercent(momentum[0].momentum_score)}.`);
  if (coalitions[0]) lines.push(`${coalitions[0].state || "National"} ${coalitions[0].coalition_type || "coalition"} formation is forecast at ${fmtPct(coalitions[0].probability)}.`);
  return lines.length ? lines.join(" ") : "No forecast brief is available yet. Run Recalculate Forecasts after Influence Engine data has been synced.";
}

export default function ExecutiveForecastDashboard() {
  const [filters, setFilters] = useState({ state: "", type: "", search: "", limit: 75 });
  const [forecastData, setForecastData] = useState({ predictions: [], relationships: [], coalitions: [], count: 0 });
  const [opportunitiesData, setOpportunitiesData] = useState({ opportunities: [], count: 0 });
  const [riskData, setRiskData] = useState({ risks: [], count: 0 });
  const [momentumData, setMomentumData] = useState({ momentum: [], count: 0 });
  const [selectedForecast, setSelectedForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [syncFirst, setSyncFirst] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");

  async function loadDashboard({ quiet = false } = {}) {
    try {
      if (!quiet) setLoading(true);
      setError("");
      if (!quiet) setMessage("");

      const params = { state: filters.state, type: filters.type, limit: filters.limit };

      const [forecast, opportunities, risks, momentum] = await Promise.all([
        loadForecast(params),
        loadOpportunities({ state: filters.state, limit: filters.limit }),
        loadRisk({ state: filters.state, limit: filters.limit }),
        loadMomentum({ state: filters.state, limit: filters.limit }),
      ]);

      setForecastData(forecast || { predictions: [], relationships: [], coalitions: [], count: 0 });
      setOpportunitiesData(opportunities || { opportunities: [], count: 0 });
      setRiskData(risks || { risks: [], count: 0 });
      setMomentumData(momentum || { momentum: [], count: 0 });

      const first =
        safeArray(forecast?.predictions)[0] ||
        safeArray(opportunities?.opportunities)[0] ||
        safeArray(risks?.risks)[0] ||
        safeArray(momentum?.momentum)[0] ||
        safeArray(forecast?.coalitions)[0] ||
        null;

      setSelectedForecast((current) => current || first);
      setLastUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401) setError("Executive Forecast Dashboard requires an active sign-in token.");
      else if (status === 404) setError("Influence Forecast API is not mounted yet. Confirm Build 2A.4 is deployed.");
      else setError(err?.response?.data?.error || err?.message || "Failed to load Executive Forecast Dashboard.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRecalculate() {
    try {
      setRecalculating(true);
      setError("");
      setMessage(syncFirst ? "Syncing Influence Engine and recalculating forecasts..." : "Recalculating forecasts...");

      const result = await recalculateForecast(syncFirst);

      setMessage(
        result?.summary
          ? `Forecast recalculation complete: ${result.summary.predictions || 0} predictions, ${result.summary.relationship_forecasts || 0} relationship forecasts, ${result.summary.coalition_forecasts || 0} coalition forecasts.`
          : "Forecast recalculation complete."
      );

      await loadDashboard({ quiet: true });
    } catch (err) {
      setMessage("");
      setError(err?.response?.data?.error || err?.message || "Failed to recalculate forecasts.");
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

  const predictions = safeArray(forecastData.predictions);
  const relationships = safeArray(forecastData.relationships);
  const coalitions = safeArray(forecastData.coalitions);
  const opportunities = safeArray(opportunitiesData.opportunities);
  const risks = safeArray(riskData.risks);
  const momentum = safeArray(momentumData.momentum);

  const visiblePredictions = useMemo(() => {
    const q = String(filters.search || "").toLowerCase().trim();
    if (!q) return predictions;
    return predictions.filter((item) =>
      [item.title, item.detail, item.entity_name, item.entity_type, item.forecast_type, item.state, item.recommended_action]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [predictions, filters.search]);

  const summary = useMemo(() => {
    const high = predictions.filter((item) => n(item.probability) >= 75).length;
    const critical = predictions.filter((item) => n(item.probability) >= 85).length;
    const avgConfidence = predictions.length
      ? Math.round(predictions.reduce((sum, item) => sum + n(item.confidence_score), 0) / predictions.length)
      : 0;
    return { high, critical, avgConfidence };
  }, [predictions]);

  const brief = buildBrief({ predictions, opportunities, risks, momentum, coalitions });

  return (
    <PageShell
      eyebrow="Build 2A.5"
      title="Executive Forecast Dashboard"
      description="Turn Influence Forecast Engine predictions into executive decisions: influence growth, decline risk, donor movement, endorsement probability, vendor fit, momentum, and coalition formation."
      tickerItems={[
        { label: "Predictions", value: `${fmtNum(predictions.length)}`, dotClass: "vs-live-dot-success" },
        { label: "High Probability", value: `${summary.high}`, dotClass: summary.high ? "vs-live-dot-warning" : "vs-live-dot-success" },
        { label: "Critical", value: `${summary.critical}`, dotClass: summary.critical ? "vs-live-dot" : "vs-live-dot-success" },
        { label: "Coalitions", value: `${coalitions.length}`, dotClass: coalitions.length ? "vs-live-dot-warning" : "vs-live-dot-success" },
        { label: "Relationships", value: `${relationships.length}`, dotClass: relationships.length ? "vs-live-dot-success" : "vs-live-dot-warning" },
        { label: "Updated", value: recalculating ? "Recalculating" : lastUpdated || "Live", dotClass: recalculating ? "vs-live-dot-warning" : "vs-live-dot-success" },
      ]}
    >
      <style>{`
        .forecast-toolbar {
          display: grid;
          grid-template-columns: minmax(0, 1.2fr) minmax(180px, 0.4fr) minmax(220px, 0.48fr) minmax(150px, 0.25fr);
          gap: 12px;
          align-items: center;
        }

        .forecast-layout {
          display: grid;
          grid-template-columns: minmax(0, 1.2fr) minmax(380px, 0.8fr);
          gap: 18px;
          align-items: start;
        }

        .forecast-actions,
        .forecast-link-row {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 8px;
          flex-wrap: wrap;
        }

        .forecast-row-shell,
        .coalition-card {
          border: 1px solid rgba(148, 163, 184, 0.14);
          border-radius: 18px;
          background: rgba(15, 23, 42, 0.42);
          overflow: hidden;
        }

        .forecast-row-shell.is-selected {
          border-color: rgba(99, 102, 241, 0.58);
          box-shadow: 0 0 0 1px rgba(99, 102, 241, 0.16), 0 16px 42px rgba(2, 6, 23, 0.22);
        }

        .forecast-row-shell .vs-responsive-row,
        .coalition-card .vs-responsive-row {
          border: 0;
          background: transparent;
        }

        .forecast-brief-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }

        .brief-card {
          border-radius: 22px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          background: radial-gradient(circle at top right, rgba(59, 130, 246, 0.14), transparent 34%), linear-gradient(135deg, rgba(15, 23, 42, 0.86), rgba(2, 6, 23, 0.68));
          padding: 16px;
          min-height: 132px;
        }

        .brief-card.danger { border-color: rgba(248, 113, 113, 0.34); }
        .brief-card.demo { border-color: rgba(251, 191, 36, 0.3); }
        .brief-card.active { border-color: rgba(34, 197, 94, 0.24); }
        .brief-card.info { border-color: rgba(96, 165, 250, 0.28); }

        .brief-card span {
          display: block;
          color: rgba(147, 197, 253, 0.92);
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .brief-card strong {
          display: block;
          margin-top: 8px;
          color: white;
          font-size: 30px;
          font-weight: 950;
          letter-spacing: -0.06em;
        }

        .brief-card p {
          margin: 8px 0 0;
          color: rgba(226, 232, 240, 0.76);
          font-size: 12px;
          line-height: 1.45;
        }

        .selected-forecast-panel {
          display: grid;
          gap: 14px;
        }

        .selected-forecast-header {
          border-radius: 22px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          background: radial-gradient(circle at top right, rgba(168, 85, 247, 0.18), transparent 36%), linear-gradient(135deg, rgba(15, 23, 42, 0.86), rgba(2, 6, 23, 0.62));
          padding: 16px;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 14px;
        }

        .selected-forecast-header h3 {
          margin: 10px 0 5px;
          color: white;
          font-size: 22px;
          line-height: 1.1;
          font-weight: 950;
          letter-spacing: -0.04em;
        }

        .selected-forecast-header p {
          margin: 0;
          color: rgba(203, 213, 225, 0.72);
          font-size: 13px;
          line-height: 1.45;
        }

        .forecast-recommendation {
          border-radius: 20px;
          border: 1px solid rgba(96, 165, 250, 0.22);
          background: linear-gradient(135deg, rgba(37, 99, 235, 0.18), rgba(15, 23, 42, 0.44));
          padding: 15px;
        }

        .forecast-recommendation span {
          display: block;
          color: rgba(147, 197, 253, 0.92);
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .forecast-recommendation p {
          margin: 8px 0 0;
          color: rgba(226, 232, 240, 0.9);
          font-size: 13px;
          line-height: 1.55;
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

        .executive-brief {
          border-radius: 22px;
          border: 1px solid rgba(96, 165, 250, 0.24);
          background: radial-gradient(circle at top right, rgba(37, 99, 235, 0.18), transparent 36%), rgba(15, 23, 42, 0.58);
          padding: 16px;
          color: rgba(226, 232, 240, 0.9);
          font-size: 14px;
          line-height: 1.65;
        }

        .executive-brief strong {
          display: block;
          color: white;
          font-size: 16px;
          margin-bottom: 6px;
        }

        @media (max-width: 1100px) {
          .forecast-layout,
          .forecast-toolbar,
          .forecast-brief-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}
      {message ? <div className="vs-banner vs-live-banner-pulse">{message}</div> : null}

      <div className="forecast-brief-grid">
        <BriefCard title="Forecasts" value={fmtNum(predictions.length)} detail="Active predictions generated by the Influence Forecast Engine." tone="info" />
        <BriefCard title="High Probability" value={summary.high} detail="Forecasts with 75% or greater likelihood." tone={summary.high ? "demo" : "active"} />
        <BriefCard title="Critical Forecasts" value={summary.critical} detail="Forecasts at or above 85% probability." tone={summary.critical ? "danger" : "active"} />
        <BriefCard title="Avg Confidence" value={fmtFullPercent(summary.avgConfidence)} detail="Average confidence across visible forecast predictions." tone="accent" />
      </div>

      <SectionCard
        title="Executive Forecast Controls"
        subtitle="Filter forecasts by state and forecast type, then recalculate when Influence Engine data changes."
        right={
          <div className="forecast-actions">
            <label style={{ color: "var(--vs-text-muted)", display: "inline-flex", gap: 8, alignItems: "center" }}>
              <input type="checkbox" checked={syncFirst} onChange={(event) => setSyncFirst(event.target.checked)} />
              Sync first
            </label>
            <button type="button" className="vs-button" disabled={recalculating} onClick={handleRecalculate}>
              {recalculating ? "Recalculating..." : "Recalculate Forecasts"}
            </button>
            <button type="button" className="vs-button vs-button-secondary" onClick={() => loadDashboard()}>
              Refresh
            </button>
          </div>
        }
      >
        <div className="forecast-toolbar">
          <input className="vs-input" value={filters.search} onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))} placeholder="Search forecast, entity, state, type, recommendation..." />
          <select className="vs-input" value={filters.state} onChange={(event) => setFilters((prev) => ({ ...prev, state: event.target.value }))}>
            {STATES.map(([value, label]) => <option key={value || "ALL"} value={value}>{label}</option>)}
          </select>
          <select className="vs-input" value={filters.type} onChange={(event) => setFilters((prev) => ({ ...prev, type: event.target.value }))}>
            {FORECAST_TYPES.map(([value, label]) => <option key={value || "ALL"} value={value}>{label}</option>)}
          </select>
          <select className="vs-input" value={filters.limit} onChange={(event) => setFilters((prev) => ({ ...prev, limit: Number(event.target.value) }))}>
            <option value={25}>Top 25</option>
            <option value={50}>Top 50</option>
            <option value={75}>Top 75</option>
            <option value={100}>Top 100</option>
          </select>
        </div>
      </SectionCard>

      <SectionCard title="AI Executive Forecast Brief" subtitle="Natural-language summary of the most important forecast signals." right={<Badge tone="active">Executive Brief</Badge>}>
        <div className="executive-brief"><strong>Forecast Summary</strong>{brief}</div>
      </SectionCard>

      <div className="forecast-layout">
        <div className="vs-stack">
          <SectionCard title="National Forecast Rankings" subtitle="Highest-probability influence forecasts across growth, decline, donors, endorsements, vendors, and organizations." right={<Badge tone="danger">{visiblePredictions.length} forecasts</Badge>}>
            <div className="vs-stack">
              {loading ? <EmptyState text="Loading executive forecasts..." /> : !visiblePredictions.length ? <EmptyState text="No forecasts found. Run Recalculate Forecasts after Influence Engine data is synced." /> : visiblePredictions.map((item) => (
                <ForecastRow key={item.prediction_key || item.id} item={item} selected={selectedForecast?.prediction_key === item.prediction_key} onSelect={setSelectedForecast} />
              ))}
            </div>
          </SectionCard>

          <div className="vs-grid-2">
            <SectionCard title="Top Opportunities" subtitle="Forecasts with the strongest campaign opportunity score." right={<Badge tone="active">{opportunities.length}</Badge>}>
              <div className="vs-stack">
                {!opportunities.length ? <EmptyState text="No forecast opportunities available." /> : opportunities.slice(0, 8).map((item) => (
                  <ForecastRow key={`opp-${item.prediction_key || item.id}`} item={item} selected={selectedForecast?.prediction_key === item.prediction_key} onSelect={setSelectedForecast} />
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Political Risk Center" subtitle="Forecasted decline, instability, and downside exposure." right={<Badge tone="danger">{risks.length}</Badge>}>
              <div className="vs-stack">
                {!risks.length ? <EmptyState text="No forecast risks available." /> : risks.slice(0, 8).map((item) => (
                  <ForecastRow key={`risk-${item.prediction_key || item.id}`} item={item} selected={selectedForecast?.prediction_key === item.prediction_key} onSelect={setSelectedForecast} />
                ))}
              </div>
            </SectionCard>
          </div>
        </div>

        <div className="vs-stack">
          <SectionCard title="Selected Forecast" subtitle="Inspect the selected forecast and move into related intelligence surfaces." right={selectedForecast ? <Badge tone={toneByScore(selectedForecast.probability)}>{fmtPct(selectedForecast.probability)}</Badge> : null}>
            <SelectedForecastPanel item={selectedForecast} />
          </SectionCard>

          <SectionCard title="Momentum Engine" subtitle="Fastest-rising entities by forecasted momentum." right={<Badge tone="demo">{momentum.length}</Badge>}>
            <div className="vs-stack">
              {!momentum.length ? <EmptyState text="No momentum forecasts available." /> : momentum.slice(0, 8).map((item) => (
                <ForecastRow key={`momentum-${item.prediction_key || item.id}`} item={item} selected={selectedForecast?.prediction_key === item.prediction_key} onSelect={setSelectedForecast} />
              ))}
            </div>
          </SectionCard>
        </div>
      </div>

      <div className="vs-grid-2">
        <SectionCard title="Relationship Forecasts" subtitle="Likely relationship movement based on graph edge strength." right={<Badge tone="info">{relationships.length}</Badge>}>
          <div className="vs-stack">
            {!relationships.length ? <EmptyState text="No relationship forecasts available." /> : relationships.slice(0, 14).map((item) => (
              <RelationshipRow key={item.forecast_key || item.id} item={item} onSelect={setSelectedForecast} />
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Coalition Formation Forecasts" subtitle="State and entity-type clusters that may form coalitions." right={<Badge tone="accent">{coalitions.length}</Badge>}>
          <div className="vs-stack">
            {!coalitions.length ? <EmptyState text="No coalition forecasts available." /> : coalitions.slice(0, 12).map((item) => (
              <CoalitionRow key={item.coalition_key || item.id} item={item} onSelect={setSelectedForecast} />
            ))}
          </div>
        </SectionCard>
      </div>
    </PageShell>
  );
}

