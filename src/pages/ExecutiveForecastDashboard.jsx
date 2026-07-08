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
import ExecutivePageNav from "../components/ui/ExecutivePageNav";
import CollapsibleSection from "../components/ui/CollapsibleSection";
import BackToTopButton from "../components/ui/BackToTopButton";
import ShowMoreList from "../components/ui/ShowMoreList";

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

function getForecastScores(item = {}) {
  const probability = n(item.probability);
  const opportunity = n(item.opportunity_score || item.coalition_score);
  const momentum = n(item.momentum_score);
  const risk = n(item.risk_score);
  const confidence = n(item.confidence_score);
  const strength = n(item.strength_score || item.relationship_strength || item.influence_score);

  const fundraising =
    n(item.fundraising_score) ||
    n(item.donor_score) ||
    (String(item.forecast_type || "").toLowerCase().includes("donor") ? Math.max(opportunity, probability) : 0);

  const coalition =
    n(item.coalition_score) ||
    (String(item.coalition_type || item.forecast_type || "").toLowerCase().includes("coalition") ? Math.max(opportunity, probability) : 0);

  const organization =
    n(item.organization_score) ||
    n(item.vendor_score) ||
    (String(item.forecast_type || "").toLowerCase().includes("vendor") ? Math.max(35, opportunity) : 0);

  return {
    probability,
    opportunity,
    momentum,
    risk,
    confidence,
    strength,
    fundraising,
    coalition,
    organization,
  };
}

function getForecastSignalType(item = {}) {
  return String(item.forecast_type || item.coalition_type || item.relationship_type || "").toLowerCase();
}

function classifyExecutiveRecommendation(item = {}) {
  const s = getForecastScores(item);
  const type = getForecastSignalType(item);
  const state = String(item.state || "").toUpperCase();

  if (s.risk >= 88 && s.momentum >= 58) {
    return {
      label: "Immediate Executive Review",
      tone: "danger",
      detail: "High downside risk is moving quickly enough to require executive review and rapid response planning.",
    };
  }

  if (type.includes("decline") || (s.risk >= 78 && s.opportunity < 55)) {
    return {
      label: "Defensive Priority",
      tone: "danger",
      detail: "Risk is outpacing opportunity. Protect the position before additional deterioration appears in the graph.",
    };
  }

  if (s.risk >= 70 && s.momentum >= 66 && s.opportunity >= 55) {
    return {
      label: "Competitive Battleground",
      tone: "demo",
      detail: "Momentum and risk are both elevated. Treat this as a contested environment requiring daily monitoring.",
    };
  }

  if ((type.includes("donor") || s.fundraising >= 70) && s.opportunity >= 62 && s.risk < 72) {
    return {
      label: "Fundraising Opportunity",
      tone: "active",
      detail: "Donor or finance signals are strong enough to justify targeted fundraising and PAC development.",
    };
  }

  if ((type.includes("coalition") || s.coalition >= 70) && s.confidence >= 48) {
    return {
      label: "Coalition Expansion",
      tone: "accent",
      detail: "Coalition formation signals are strong. Expand partner, endorsement, and stakeholder outreach.",
    };
  }

  if ((type.includes("vendor") || s.organization >= 58) && s.opportunity >= 50 && s.risk >= 45) {
    return {
      label: "Organization Needed",
      tone: "info",
      detail: "The opportunity exists, but execution infrastructure should be strengthened before pressure increases.",
    };
  }

  if (s.momentum >= 74 && s.opportunity >= 68 && s.risk < 62) {
    return {
      label: "Momentum Building",
      tone: "active",
      detail: "Momentum and opportunity are rising while risk remains manageable.",
    };
  }

  if (s.probability >= 76 && s.opportunity >= 70 && s.risk < 55 && s.confidence >= 52) {
    return {
      label: "Positioned for Influence Growth",
      tone: "active",
      detail: "High probability, strong opportunity, and manageable risk support expansion.",
    };
  }

  if (s.probability >= 58 && s.confidence >= 45 && s.risk < 68) {
    return {
      label: "Maintain Position",
      tone: "info",
      detail: "Signals are stable. Continue monitoring while preserving current posture.",
    };
  }

  if (s.opportunity < 45 && s.momentum < 45 && s.risk < 65) {
    return {
      label: "Low-Signal Watch",
      tone: "default",
      detail: "Current data does not support aggressive action. Keep this in monitoring until stronger movement appears.",
    };
  }

  return {
    label: state ? `${state} Monitor Closely` : "Monitor Closely",
    tone: s.risk >= 60 ? "demo" : "info",
    detail: "Signals are mixed. Continue monitoring and wait for stronger confirmation before committing resources.",
  };
}

function recommendationLabel(item = {}) {
  return classifyExecutiveRecommendation(item).label;
}

function recommendationTone(item = {}) {
  return classifyExecutiveRecommendation(item).tone;
}

function recommendationDetail(item = {}) {
  return classifyExecutiveRecommendation(item).detail;
}

function buildExecutiveRecommendation(item = {}) {
  const classified = classifyExecutiveRecommendation(item);
  const backendAction = String(item.recommended_action || "").trim();

  if (
    !backendAction ||
    /positioned for influence growth/i.test(backendAction) ||
    /monitor/i.test(backendAction)
  ) {
    return `${classified.label}: ${classified.detail}`;
  }

  return backendAction;
}

function forecastDisplayTitle(item = {}) {
  const label = recommendationLabel(item);
  const state = item.state || "National";
  return `${state} ${label}`;
}

function forecastDisplayDetail(item = {}) {
  const classified = classifyExecutiveRecommendation(item);
  const rawTitle = String(itemTitle(item) || "").trim();
  const rawAction = String(item.recommended_action || "").trim();
  const type = String(item.forecast_type || item.coalition_type || item.relationship_type || "forecast").replace(/_/g, " ");
  const entity = itemEntityName(item);
  const backendContext = [type, entity, rawTitle]
    .filter(Boolean)
    .filter((value) => !/influence\s+(for\s+)?growth/i.test(String(value)))
    .filter((value) => !/positioned/i.test(String(value)))
    .join(" • ");

  if (rawAction && !/influence\s+(for\s+)?growth/i.test(rawAction) && !/positioned/i.test(rawAction)) {
    return `${classified.detail} Backend action: ${rawAction}`;
  }

  return `${classified.detail}${backendContext ? ` Context: ${backendContext}` : ""}`;
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

function ScoreMeter({ label, value, tone = "info" }) {
  const score = Math.max(0, Math.min(100, Math.round(n(value))));

  return (
    <div className={`vs-terminal-meter ${tone}`}>
      <div className="vs-terminal-meter-head">
        <span>{label}</span>
        <strong>{score}%</strong>
      </div>
      <div className="vs-terminal-meter-track">
        <i style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

function SignalGauge({ value, label, tone = "info" }) {
  const score = Math.max(0, Math.min(100, Math.round(n(value))));

  return (
    <div className={`vs-terminal-gauge ${tone}`} style={{ "--score": `${score}%` }}>
      <div className="vs-terminal-gauge-core">
        <strong>{score}%</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}

function ForecastRow({ item, selected, onSelect }) {
  const probability = n(item.probability);
  const opportunity = n(item.opportunity_score || item.coalition_score);
  const momentum = n(item.momentum_score);
  const risk = n(item.risk_score);
  const confidence = n(item.confidence_score);
  const signalTone = typeTone(item.forecast_type || item.coalition_type || item.relationship_type);

  return (
    <button
      type="button"
      className={`forecast-row-shell vs-terminal-signal ${selected ? "is-selected" : ""}`}
      onClick={() => onSelect(item)}
    >
      <div className="vs-terminal-signal-head">
        <div>
          <div className="vs-terminal-kicker">
            {recommendationLabel(item)}
          </div>
          <h3>{forecastDisplayTitle(item)}</h3>
          <p>{forecastDisplayDetail(item)}</p>
          <div className="forecast-classification-line">
            Executive classification: <strong>{recommendationLabel(item)}</strong>
          </div>
        </div>
        <SignalGauge value={probability} label="Probability" tone={toneByScore(probability)} />
      </div>

      <div className="vs-terminal-signal-grid">
        <ScoreMeter label="Opportunity" value={opportunity} tone={toneByScore(opportunity)} />
        <ScoreMeter label="Momentum" value={momentum} tone={toneByScore(momentum)} />
        <ScoreMeter label="Risk" value={risk} tone={toneByScore(risk)} />
        <ScoreMeter label="Confidence" value={confidence} tone={toneByScore(confidence)} />
      </div>

      <div className="vs-terminal-signal-foot">
        <Badge tone={recommendationTone(item)}>{recommendationLabel(item)}</Badge>
        <span>{String(item.forecast_type || item.coalition_type || item.relationship_type || "forecast").replace(/_/g, " ")} • Probability {fmtFullPercent(probability)}</span>
        <em>Inspect →</em>
      </div>
    </button>
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
          <Badge tone={recommendationTone(item)}>
            {recommendationLabel(item)}
          </Badge>
          <h3>{forecastDisplayTitle(item)}</h3>
          <p>{forecastDisplayDetail(item)}</p>
        </div>
        <Badge tone={toneByScore(item.probability)}>{fmtPct(item.probability)}</Badge>
      </div>

      <div className="vs-grid-2">
        <StatCard label="Probability" value={fmtPct(item.probability)} subtext="Forecast likelihood" />
        <StatCard label="Confidence" value={fmtFullPercent(item.confidence_score)} subtext="Data confidence" />
        <StatCard label="Opportunity" value={fmtFullPercent(item.opportunity_score || item.coalition_score)} subtext="Growth potential" />
        <StatCard label="Risk" value={fmtFullPercent(item.risk_score)} subtext="Downside exposure" />
      </div>

      <div className="forecast-recommendation">
        <span>Recommended Executive Action</span>
        <p>{buildExecutiveRecommendation(item)}</p>
      </div>

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
  if (predictions[0]) lines.push(`${forecastDisplayTitle(predictions[0])} is classified at ${fmtPct(predictions[0].probability)} probability.`);
  if (opportunities[0]) lines.push(`${itemEntityName(opportunities[0]) || itemTitle(opportunities[0])} is classified as ${recommendationLabel(opportunities[0])} with opportunity ${fmtFullPercent(opportunities[0].opportunity_score)}.`);
  if (risks[0]) lines.push(`${itemEntityName(risks[0]) || itemTitle(risks[0])} is classified as ${recommendationLabel(risks[0])} with risk ${fmtFullPercent(risks[0].risk_score)}.`);
  if (momentum[0]) lines.push(`${itemEntityName(momentum[0]) || itemTitle(momentum[0])} is classified as ${recommendationLabel(momentum[0])} with momentum ${fmtFullPercent(momentum[0].momentum_score)}.`);
  if (coalitions[0]) lines.push(`${coalitions[0].state || "National"} ${coalitions[0].coalition_type || "coalition"} is classified as ${recommendationLabel(coalitions[0])} at ${fmtPct(coalitions[0].probability)}.`);
  return lines.length ? lines.join(" ") : "No forecast brief is available yet. Run Recalculate Forecasts after Influence Engine data has been synced.";
}

function ForecastExecutiveHeader({
  predictions,
  relationships,
  coalitions,
  opportunities,
  risks,
  momentum,
  summary,
  topOpportunityScore,
  topRiskScore,
  topMomentumScore,
  selectedForecast,
  loading,
  recalculating,
  lastUpdated,
  onRefresh,
  onRecalculate,
}) {
  const readinessScore = Math.max(
    5,
    Math.min(
      100,
      Math.round(
        62 +
          Math.min(16, summary.avgConfidence * 0.16) +
          Math.min(10, opportunities.length * 1.1) +
          Math.min(8, relationships.length * 0.45) +
          Math.min(8, coalitions.length * 0.75) -
          Math.min(20, summary.critical * 3.5) -
          Math.min(12, topRiskScore * 0.12)
      )
    )
  );

  return (
    <div className="forecast-exec-ribbon" id="forecast-overview">
      <div className="forecast-exec-copy">
        <span>Executive Forecast Readiness</span>
        <strong>{readinessScore}% Ready</strong>
        <p>
          Executive Forecast Intelligence Center for opportunity, risk, momentum,
          relationship movement, coalition formation, and graph-driven political prediction.
        </p>

        <div className="forecast-exec-badges">
          <Badge tone="info">{fmtNum(predictions.length)} Forecasts</Badge>
          <Badge tone={summary.critical ? "danger" : "active"}>{summary.critical} Critical</Badge>
          <Badge tone="active">{fmtFullPercent(summary.avgConfidence)} Avg Confidence</Badge>
          <Badge tone={topRiskScore >= 70 ? "danger" : "active"}>{fmtFullPercent(topRiskScore)} Risk</Badge>
          <Badge tone="accent">{coalitions.length} Coalitions</Badge>
          {selectedForecast ? (
            <Badge tone={toneByScore(selectedForecast.probability)}>
              {fmtPct(selectedForecast.probability)} Selected
            </Badge>
          ) : null}
        </div>
      </div>

      <div className="forecast-exec-grid">
        <div>
          <span>Opportunity</span>
          <strong>{fmtFullPercent(topOpportunityScore)}</strong>
        </div>
        <div>
          <span>Momentum</span>
          <strong>{fmtFullPercent(topMomentumScore)}</strong>
        </div>
        <div>
          <span>Relationships</span>
          <strong>{fmtNum(relationships.length)}</strong>
        </div>
        <div>
          <span>Live Status</span>
          <strong>{loading || recalculating ? "Updating" : "Ready"}</strong>
        </div>
      </div>

      <div className="forecast-exec-actions">
        <button type="button" onClick={onRefresh} disabled={loading || recalculating}>
          {loading ? "Refreshing..." : "Refresh Forecasts"}
        </button>
        <button type="button" onClick={onRecalculate} disabled={recalculating}>
          {recalculating ? "Recalculating..." : "Recalculate Forecasts"}
        </button>
        <Link to="/political-intelligence">Political Intelligence</Link>
        <Link to="/political-graph">Political Graph</Link>
        <Link to="/command-center">Command Center</Link>
        <Link to="/ai-war-room">AI War Room</Link>
      </div>

      <div className="forecast-exec-footer">
        <span>Updated: {lastUpdated || "Live"}</span>
        <span>Forecast Engine: Influence Graph</span>
      </div>
    </div>
  );
}

function ForecastActionCenter({ selectedForecast, onRefresh, onRecalculate }) {
  const selectedName = selectedForecast ? itemEntityName(selectedForecast) : "";
  const selectedType = selectedForecast ? itemEntityType(selectedForecast) : "organization";
  const selectedState = selectedForecast?.state || "";

  return (
    <div className="forecast-action-center">
      <button type="button" onClick={onRefresh}>Refresh Forecasts</button>
      <button type="button" onClick={onRecalculate}>Recalculate Forecasts</button>
      <Link to="/influence">Open Influence Dashboard</Link>
      <Link to={`/political-graph?entityType=${encodeURIComponent(selectedType)}&entityName=${encodeURIComponent(selectedName)}&state=${encodeURIComponent(selectedState)}`}>
        Open Political Graph
      </Link>
      <Link to="/command-center">Open Command Center</Link>
      <Link to="/ai-war-room">Open AI War Room</Link>
      <Link to="/executive-decision-intelligence">Executive Intelligence</Link>
      <Link to="/state-operations">State Operations</Link>
    </div>
  );
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

  const topOpportunityScore = n(opportunities?.[0]?.opportunity_score || opportunities?.[0]?.coalition_score || 0);
  const topRiskScore = n(risks?.[0]?.risk_score || 0);
  const topMomentumScore = n(momentum?.[0]?.momentum_score || 0);
  const brief = buildBrief({ predictions, opportunities, risks, momentum, coalitions });

  const navSections = [
    { id: "forecast-overview", label: "Overview" },
    { id: "forecast-brief-metrics", label: "Metrics" },
    { id: "forecast-controls", label: "Controls" },
    { id: "forecast-ai-brief", label: "AI Brief" },
    { id: "forecast-rankings", label: "Rankings", badge: visiblePredictions.length },
    { id: "forecast-opportunities", label: "Opportunities", badge: opportunities.length },
    { id: "forecast-risks", label: "Risks", badge: risks.length },
    { id: "forecast-selected", label: "Selected" },
    { id: "forecast-momentum", label: "Momentum", badge: momentum.length },
    { id: "forecast-relationships", label: "Relationships", badge: relationships.length },
    { id: "forecast-coalitions", label: "Coalitions", badge: coalitions.length },
    { id: "forecast-actions", label: "Actions" },
  ];

  return (
    <PageShell
      eyebrow="Build 2A.5"
      title="Executive Forecast Terminal"
      description="Bloomberg/Palantir-style political forecasting command center for opportunity, risk, momentum, relationships, and coalition formation."
      tickerItems={[
        { label: "Predictions", value: `${fmtNum(predictions.length)}`, dotClass: "vs-live-dot-success" },
        { label: "Opportunity", value: `${fmtFullPercent(topOpportunityScore)}`, dotClass: topOpportunityScore >= 70 ? "vs-live-dot-warning" : "vs-live-dot-success" },
        { label: "Risk", value: `${fmtFullPercent(topRiskScore)}`, dotClass: topRiskScore >= 70 ? "vs-live-dot" : "vs-live-dot-success" },
        { label: "Coalitions", value: `${coalitions.length}`, dotClass: coalitions.length ? "vs-live-dot-warning" : "vs-live-dot-success" },
        { label: "Relationships", value: `${relationships.length}`, dotClass: relationships.length ? "vs-live-dot-success" : "vs-live-dot-warning" },
        { label: "Updated", value: recalculating ? "Recalculating" : lastUpdated || "Live", dotClass: recalculating ? "vs-live-dot-warning" : "vs-live-dot-success" },
      ]}
    >
      <style>{`
        .forecast-exec-ribbon {
          display: grid;
          grid-template-columns: minmax(300px, 0.95fr) minmax(0, 1.15fr);
          gap: 18px;
          align-items: stretch;
          border: 1px solid rgba(148, 163, 184, 0.16);
          border-radius: 28px;
          background:
            radial-gradient(circle at top right, rgba(168, 85, 247, 0.18), transparent 34%),
            radial-gradient(circle at bottom left, rgba(59, 130, 246, 0.16), transparent 30%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(2, 6, 23, 0.86));
          box-shadow: 0 28px 80px rgba(2, 6, 23, 0.32);
          padding: 20px;
          min-width: 0;
          overflow: hidden;
        }

        .forecast-exec-copy { min-width: 0; }

        .forecast-exec-copy span,
        .forecast-exec-grid span,
        .forecast-exec-footer span {
          display: block;
          color: rgba(147, 197, 253, 0.86);
          font-size: 11px;
          font-weight: 950;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .forecast-exec-copy strong {
          display: block;
          margin-top: 8px;
          color: white;
          font-size: clamp(30px, 4vw, 50px);
          line-height: 1;
          font-weight: 950;
          letter-spacing: -0.07em;
        }

        .forecast-exec-copy p {
          margin: 12px 0 0;
          color: rgba(226, 232, 240, 0.78);
          line-height: 1.6;
          max-width: 820px;
        }

        .forecast-exec-badges,
        .forecast-exec-actions,
        .forecast-exec-footer,
        .forecast-action-center {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          align-items: center;
        }

        .forecast-exec-badges { margin-top: 14px; }

        .forecast-exec-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          min-width: 0;
        }

        .forecast-exec-grid div {
          border: 1px solid rgba(148, 163, 184, 0.14);
          border-radius: 18px;
          background: rgba(2, 6, 23, 0.34);
          padding: 14px;
          min-width: 0;
        }

        .forecast-exec-grid strong {
          display: block;
          margin-top: 7px;
          color: white;
          font-size: 20px;
          font-weight: 950;
          overflow-wrap: anywhere;
        }

        .forecast-exec-actions,
        .forecast-exec-footer {
          grid-column: 1 / -1;
          border-top: 1px solid rgba(148, 163, 184, 0.12);
          padding-top: 14px;
        }

        .forecast-exec-actions button,
        .forecast-exec-actions a,
        .forecast-action-center button,
        .forecast-action-center a {
          border: 1px solid rgba(148, 163, 184, 0.18);
          background: rgba(15, 23, 42, 0.74);
          color: rgba(226, 232, 240, 0.92);
          border-radius: 15px;
          padding: 11px 12px;
          font-size: 12px;
          font-weight: 850;
          cursor: pointer;
          text-decoration: none;
        }

        .forecast-exec-actions button:hover,
        .forecast-exec-actions a:hover,
        .forecast-action-center button:hover,
        .forecast-action-center a:hover {
          border-color: rgba(168, 85, 247, 0.48);
          background: rgba(168, 85, 247, 0.16);
          color: white;
        }

        .forecast-exec-actions button:disabled {
          opacity: 0.62;
          cursor: not-allowed;
        }

        .forecast-exec-stack {
          display: grid;
          gap: 18px;
          min-width: 0;
        }



        .forecast-brief-grid {
          position: relative;
        }

        .forecast-brief-grid::before {
          content: "EXECUTIVE FORECAST TERMINAL";
          grid-column: 1 / -1;
          display: block;
          color: rgba(125, 211, 252, 0.92);
          font-size: 11px;
          font-weight: 950;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          margin: 0 0 -2px;
        }

        .vs-terminal-signal {
          display: block;
          width: 100%;
          text-align: left;
          padding: 0;
          cursor: pointer;
          color: inherit;
        }

        .vs-terminal-signal-head {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 16px;
          align-items: start;
          padding: 16px 16px 12px;
          background:
            radial-gradient(circle at top right, rgba(59, 130, 246, 0.18), transparent 34%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.92), rgba(2, 6, 23, 0.62));
        }

        .vs-terminal-kicker {
          color: rgba(147, 197, 253, 0.94);
          font-size: 10px;
          font-weight: 950;
          text-transform: uppercase;
          letter-spacing: 0.14em;
        }

        .vs-terminal-signal h3 {
          margin: 8px 0 6px;
          color: #fff;
          font-size: 18px;
          line-height: 1.08;
          font-weight: 950;
          letter-spacing: -0.045em;
        }

        .vs-terminal-signal p {
          margin: 0;
          color: rgba(203, 213, 225, 0.72);
          font-size: 12px;
          line-height: 1.5;
        }

        .forecast-classification-line {
          margin-top: 9px;
          color: rgba(147, 197, 253, 0.9);
          font-size: 11px;
          font-weight: 850;
          letter-spacing: 0.01em;
        }

        .forecast-classification-line strong {
          color: white;
          font-weight: 950;
        }

        .vs-terminal-gauge {
          width: 82px;
          height: 82px;
          border-radius: 999px;
          background: conic-gradient(rgba(96, 165, 250, 0.95) var(--score), rgba(30, 41, 59, 0.85) 0);
          display: grid;
          place-items: center;
          flex: none;
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.05), 0 12px 30px rgba(2, 6, 23, 0.28);
        }

        .vs-terminal-gauge.danger { background: conic-gradient(rgba(248, 113, 113, 0.95) var(--score), rgba(30, 41, 59, 0.85) 0); }
        .vs-terminal-gauge.demo { background: conic-gradient(rgba(251, 191, 36, 0.95) var(--score), rgba(30, 41, 59, 0.85) 0); }
        .vs-terminal-gauge.active { background: conic-gradient(rgba(74, 222, 128, 0.95) var(--score), rgba(30, 41, 59, 0.85) 0); }

        .vs-terminal-gauge-core {
          width: 66px;
          height: 66px;
          border-radius: inherit;
          background: rgba(2, 6, 23, 0.9);
          display: grid;
          place-items: center;
          align-content: center;
          text-align: center;
        }

        .vs-terminal-gauge-core strong {
          color: #fff;
          font-size: 17px;
          font-weight: 980;
          letter-spacing: -0.06em;
        }

        .vs-terminal-gauge-core span {
          color: rgba(203, 213, 225, 0.66);
          font-size: 8px;
          font-weight: 950;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .vs-terminal-signal-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
          padding: 14px 16px;
          background: rgba(2, 6, 23, 0.28);
        }

        .vs-terminal-meter {
          display: grid;
          gap: 6px;
        }

        .vs-terminal-meter-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          color: rgba(203, 213, 225, 0.72);
          font-size: 10px;
          font-weight: 950;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .vs-terminal-meter-head strong {
          color: white;
          letter-spacing: 0;
        }

        .vs-terminal-meter-track {
          height: 8px;
          border-radius: 999px;
          overflow: hidden;
          background: rgba(30, 41, 59, 0.82);
        }

        .vs-terminal-meter-track i {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, rgba(96, 165, 250, 0.7), rgba(34, 211, 238, 0.96));
        }

        .vs-terminal-meter.danger .vs-terminal-meter-track i { background: linear-gradient(90deg, rgba(239, 68, 68, 0.72), rgba(248, 113, 113, 0.96)); }
        .vs-terminal-meter.demo .vs-terminal-meter-track i { background: linear-gradient(90deg, rgba(245, 158, 11, 0.72), rgba(251, 191, 36, 0.96)); }
        .vs-terminal-meter.active .vs-terminal-meter-track i { background: linear-gradient(90deg, rgba(34, 197, 94, 0.72), rgba(74, 222, 128, 0.96)); }

        .vs-terminal-signal-foot {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          flex-wrap: wrap;
          padding: 0 16px 16px;
          color: rgba(203, 213, 225, 0.68);
          font-size: 11px;
          font-weight: 850;
          background: rgba(2, 6, 23, 0.28);
        }

        .vs-terminal-signal-foot em {
          color: rgba(147, 197, 253, 0.96);
          font-style: normal;
        }

        .brief-card {
          box-shadow: 0 18px 50px rgba(2, 6, 23, 0.22);
        }

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
          .forecast-brief-grid,
          .forecast-exec-ribbon {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="forecast-exec-stack">
        <ForecastExecutiveHeader
          predictions={predictions}
          relationships={relationships}
          coalitions={coalitions}
          opportunities={opportunities}
          risks={risks}
          momentum={momentum}
          summary={summary}
          topOpportunityScore={topOpportunityScore}
          topRiskScore={topRiskScore}
          topMomentumScore={topMomentumScore}
          selectedForecast={selectedForecast}
          loading={loading}
          recalculating={recalculating}
          lastUpdated={lastUpdated}
          onRefresh={() => loadDashboard()}
          onRecalculate={handleRecalculate}
        />

        <ExecutivePageNav sections={navSections} />
      </div>

      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}
      {message ? <div className="vs-banner vs-live-banner-pulse">{message}</div> : null}

      <CollapsibleSection
        id="forecast-brief-metrics"
        title="Forecast Intelligence Metrics"
        subtitle="Prediction volume, high-probability forecasts, critical signals, and average confidence."
        defaultOpen
        right={<Badge tone={summary.critical ? "danger" : "active"}>{summary.critical} Critical</Badge>}
      >
      <div className="forecast-brief-grid">
        <BriefCard title="Forecasts" value={fmtNum(predictions.length)} detail="Active predictions generated by the Influence Forecast Engine." tone="info" />
        <BriefCard title="High Probability" value={summary.high} detail="Forecasts with 75% or greater likelihood." tone={summary.high ? "demo" : "active"} />
        <BriefCard title="Critical Forecasts" value={summary.critical} detail="Forecasts at or above 85% probability." tone={summary.critical ? "danger" : "active"} />
        <BriefCard title="Avg Confidence" value={fmtFullPercent(summary.avgConfidence)} detail="Average confidence across visible forecast predictions." tone="accent" />
      </div>
      </CollapsibleSection>

      <CollapsibleSection
        id="forecast-controls"
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
      </CollapsibleSection>

      <CollapsibleSection id="forecast-ai-brief" title="AI Executive Forecast Brief" subtitle="Natural-language summary of the most important forecast signals." defaultOpen right={<Badge tone="active">Executive Brief</Badge>}>
        <div className="executive-brief"><strong>Forecast Summary</strong>{brief}</div>
      </CollapsibleSection>

      <div className="forecast-layout">
        <div className="vs-stack">
          <CollapsibleSection id="forecast-rankings" title="National Forecast Rankings" subtitle="Highest-probability influence forecasts across growth, decline, donors, endorsements, vendors, and organizations." defaultOpen right={<Badge tone="danger">{visiblePredictions.length} forecasts</Badge>}>
            {loading ? <EmptyState text="Loading executive forecasts..." /> : !visiblePredictions.length ? <EmptyState text="No forecasts found. Run Recalculate Forecasts after Influence Engine data is synced." /> : (
              <ShowMoreList
                items={visiblePredictions}
                initialCount={10}
                showAllLabel={(count) => `Show All ${count} Forecasts`}
                className="vs-stack"
                renderItem={(item) => (
                  <ForecastRow item={item} selected={selectedForecast?.prediction_key === item.prediction_key} onSelect={setSelectedForecast} />
                )}
              />
            )}
          </CollapsibleSection>

          <div className="vs-grid-2">
            <CollapsibleSection id="forecast-opportunities" title="Top Opportunities" subtitle="Forecasts with the strongest campaign opportunity score." defaultOpen={false} right={<Badge tone="active">{fmtFullPercent(topOpportunityScore)}</Badge>}>
              {!opportunities.length ? <EmptyState text="No forecast opportunities available." /> : (
                <ShowMoreList
                  items={opportunities}
                  initialCount={8}
                  showAllLabel={(count) => `Show All ${count} Opportunities`}
                  className="vs-stack"
                  renderItem={(item) => <ForecastRow item={item} selected={selectedForecast?.prediction_key === item.prediction_key} onSelect={setSelectedForecast} />}
                />
              )}
            </CollapsibleSection>

            <CollapsibleSection id="forecast-risks" title="Political Risk Center" subtitle="Forecasted decline, instability, and downside exposure." defaultOpen={false} right={<Badge tone="danger">{fmtFullPercent(topRiskScore)}</Badge>}>
              {!risks.length ? <EmptyState text="No forecast risks available." /> : (
                <ShowMoreList
                  items={risks}
                  initialCount={8}
                  showAllLabel={(count) => `Show All ${count} Risks`}
                  className="vs-stack"
                  renderItem={(item) => <ForecastRow item={item} selected={selectedForecast?.prediction_key === item.prediction_key} onSelect={setSelectedForecast} />}
                />
              )}
            </CollapsibleSection>
          </div>
        </div>

        <div className="vs-stack">
          <CollapsibleSection id="forecast-selected" title="Selected Forecast" subtitle="Inspect the selected forecast and move into related intelligence surfaces." defaultOpen right={selectedForecast ? <Badge tone={toneByScore(selectedForecast.probability)}>{fmtPct(selectedForecast.probability)}</Badge> : null}>
            <SelectedForecastPanel item={selectedForecast} />
          </CollapsibleSection>

          <CollapsibleSection id="forecast-momentum" title="Momentum Engine" subtitle="Fastest-rising entities by forecasted momentum." defaultOpen={false} right={<Badge tone="demo">{fmtFullPercent(topMomentumScore)}</Badge>}>
            {!momentum.length ? <EmptyState text="No momentum forecasts available." /> : (
              <ShowMoreList
                items={momentum}
                initialCount={8}
                showAllLabel={(count) => `Show All ${count} Momentum Forecasts`}
                className="vs-stack"
                renderItem={(item) => <ForecastRow item={item} selected={selectedForecast?.prediction_key === item.prediction_key} onSelect={setSelectedForecast} />}
              />
            )}
          </CollapsibleSection>
        </div>
      </div>

      <div className="vs-grid-2">
        <CollapsibleSection id="forecast-relationships" title="Relationship Forecasts" subtitle="Likely relationship movement based on graph edge strength." defaultOpen={false} right={<Badge tone="info">{relationships.length}</Badge>}>
          {!relationships.length ? <EmptyState text="No relationship forecasts available." /> : (
            <ShowMoreList
              items={relationships}
              initialCount={14}
              showAllLabel={(count) => `Show All ${count} Relationship Forecasts`}
              className="vs-stack"
              renderItem={(item) => <RelationshipRow item={item} onSelect={setSelectedForecast} />}
            />
          )}
        </CollapsibleSection>

        <CollapsibleSection id="forecast-coalitions" title="Coalition Formation Forecasts" subtitle="State and entity-type clusters that may form coalitions." defaultOpen={false} right={<Badge tone="accent">{coalitions.length}</Badge>}>
          {!coalitions.length ? <EmptyState text="No coalition forecasts available." /> : (
            <ShowMoreList
              items={coalitions}
              initialCount={12}
              showAllLabel={(count) => `Show All ${count} Coalition Forecasts`}
              className="vs-stack"
              renderItem={(item) => <CoalitionRow item={item} onSelect={setSelectedForecast} />}
            />
          )}
        </CollapsibleSection>
      </div>

      <CollapsibleSection
        id="forecast-actions"
        title="Executive Action Center"
        subtitle="Move forecast intelligence into graph, influence, command, and operations workflows."
        defaultOpen={false}
        right={<Badge tone="active">Forecast Handoff</Badge>}
      >
        <ForecastActionCenter
          selectedForecast={selectedForecast}
          onRefresh={() => loadDashboard()}
          onRecalculate={handleRecalculate}
        />
      </CollapsibleSection>

      <BackToTopButton />
    </PageShell>
  );
}
