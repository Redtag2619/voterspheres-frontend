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
  ["", "All States"], ["AL", "Alabama"], ["AK", "Alaska"], ["AZ", "Arizona"], ["AR", "Arkansas"], ["CA", "California"], ["CO", "Colorado"], ["CT", "Connecticut"], ["DE", "Delaware"], ["DC", "District of Columbia"], ["FL", "Florida"], ["GA", "Georgia"], ["HI", "Hawaii"], ["ID", "Idaho"], ["IL", "Illinois"], ["IN", "Indiana"], ["IA", "Iowa"], ["KS", "Kansas"], ["KY", "Kentucky"], ["LA", "Louisiana"], ["ME", "Maine"], ["MD", "Maryland"], ["MA", "Massachusetts"], ["MI", "Michigan"], ["MN", "Minnesota"], ["MS", "Mississippi"], ["MO", "Missouri"], ["MT", "Montana"], ["NE", "Nebraska"], ["NV", "Nevada"], ["NH", "New Hampshire"], ["NJ", "New Jersey"], ["NM", "New Mexico"], ["NY", "New York"], ["NC", "North Carolina"], ["ND", "North Dakota"], ["OH", "Ohio"], ["OK", "Oklahoma"], ["OR", "Oregon"], ["PA", "Pennsylvania"], ["RI", "Rhode Island"], ["SC", "South Carolina"], ["SD", "South Dakota"], ["TN", "Tennessee"], ["TX", "Texas"], ["UT", "Utah"], ["VT", "Vermont"], ["VA", "Virginia"], ["WA", "Washington"], ["WV", "West Virginia"], ["WI", "Wisconsin"], ["WY", "Wyoming"],
];
const STRATEGY_TYPES = [["", "All Strategies"], ["forecast_opportunity", "Forecast Opportunity"], ["risk_defense", "Risk Defense"], ["donor_growth", "Donor Growth"], ["endorsement_capture", "Endorsement Capture"], ["vendor_execution", "Vendor Execution"], ["coalition_activation", "Coalition Activation"], ["relationship_growth", "Relationship Growth"], ["candidate_positioning", "Candidate Positioning"]];
const PRIORITIES = [["", "All Priorities"], ["critical", "Critical"], ["high", "High"], ["medium", "Medium"], ["low", "Low"]];

function n(value, fallback = 0) { const next = Number(value); return Number.isFinite(next) ? next : fallback; }
function safeArray(value) { return Array.isArray(value) ? value : []; }
function fmtPercent(value) { return `${Math.round(Math.max(0, Math.min(100, n(value))))}%`; }
function fmtNum(value) { return n(value).toLocaleString(); }
function labelize(value = "") { return String(value || "Strategy").replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function toneByScore(value) { const score = n(value); if (score >= 85) return "danger"; if (score >= 70) return "demo"; if (score >= 50) return "info"; return "accent"; }
function priorityTone(value = "") { const priority = String(value || "").toLowerCase(); if (priority === "critical") return "danger"; if (priority === "high") return "demo"; if (priority === "medium") return "info"; return "accent"; }

async function getSummary() { if (typeof api.strategySummary === "function") return api.strategySummary(); const response = await api.get("/strategy/summary", { timeout: 15000 }); return response?.data || response; }
async function getRecommendations(params) { if (typeof api.strategyRecommendations === "function") return api.strategyRecommendations(params); const response = await api.get("/strategy/recommendations", { params, timeout: 15000 }); return response?.data || response; }
async function recalculateStrategy() { if (typeof api.recalculateStrategy === "function") return api.recalculateStrategy(); const response = await api.post("/strategy/recalculate", {}, { timeout: 90000 }); return response?.data || response; }
async function queueAction(key) { if (typeof api.queueStrategyAction === "function") return api.queueStrategyAction(key); const response = await api.post(`/strategy/${encodeURIComponent(key)}/queue-action`, {}, { timeout: 30000 }); return response?.data || response; }

function StrategyGauge({ value, label }) { const score = Math.max(0, Math.min(100, Math.round(n(value)))); return <div className={`strategy-gauge ${toneByScore(score)}`} style={{ "--score": `${score}%` }}><div className="strategy-gauge-core"><strong>{score}%</strong><span>{label}</span></div></div>; }
function StrategyBar({ label, value }) { const score = Math.max(0, Math.min(100, Math.round(n(value)))); return <div className={`strategy-bar ${toneByScore(score)}`}><div className="strategy-bar-top"><span>{label}</span><strong>{score}%</strong></div><div className="strategy-bar-track"><i style={{ width: `${score}%` }} /></div></div>; }

function StrategyCard({ item, selected, onSelect }) {
  return (
    <button type="button" className={`strategy-card ${selected ? "is-selected" : ""}`} onClick={() => onSelect(item)}>
      <div className="strategy-card-head"><div><div className="strategy-kicker"><Badge tone={priorityTone(item.priority)}>{item.priority || "medium"}</Badge><span>{labelize(item.strategy_type)}</span></div><h3>{item.title}</h3><p>{item.summary || item.rationale}</p></div><StrategyGauge value={item.strategy_score} label="Score" /></div>
      <div className="strategy-bars"><StrategyBar label="Impact" value={item.impact_score} /><StrategyBar label="Urgency" value={item.urgency_score} /><StrategyBar label="Feasibility" value={item.feasibility_score} /><StrategyBar label="Risk" value={item.risk_score} /></div>
      <div className="strategy-card-foot"><span>{item.owner_role || "Strategy Lead"} · {item.time_horizon || "7 days"}</span><em>Inspect →</em></div>
    </button>
  );
}

function SelectedStrategyPanel({ item, onQueueAction, queueing }) {
  if (!item) return <EmptyState text="Select a strategy recommendation to inspect details." />;
  return (
    <div className="selected-strategy-panel">
      <div className="selected-strategy-header"><div><Badge tone={priorityTone(item.priority)}>{item.priority || "medium"}</Badge><h3>{item.title}</h3><p>{item.recommended_action || item.summary}</p></div><StrategyGauge value={item.strategy_score} label="Strategy" /></div>
      <div className="vs-grid-2"><StatCard label="Impact" value={fmtPercent(item.impact_score)} subtext="Strategic upside" /><StatCard label="Urgency" value={fmtPercent(item.urgency_score)} subtext="Timing pressure" /><StatCard label="Feasibility" value={fmtPercent(item.feasibility_score)} subtext="Execution confidence" /><StatCard label="Risk" value={fmtPercent(item.risk_score)} subtext="Downside exposure" /></div>
      <div className="strategy-recommendation"><span>AI Strategy Rationale</span><p>{item.rationale || "Rationale unavailable."}</p></div>
      <div className="strategy-action-row"><button type="button" className="vs-button" disabled={queueing} onClick={() => onQueueAction(item)}>{queueing ? "Queueing..." : "Queue Command Center Action"}</button><Link className="vs-button vs-button-secondary" to={`/command-center?state=${encodeURIComponent(item.state || "")}&source=strategy-engine`}>Open Command Center</Link><Link className="vs-button vs-button-secondary" to={`/forecast?state=${encodeURIComponent(item.state || "")}`}>Open Forecasts</Link></div>
      {item.entity_name ? <PoliticalGraphContextPanel entityType={item.entity_type || item.strategy_type || "organization"} entityId={item.entity_key} entityName={item.entity_name} state={item.state} title="Strategy Relationship Context" subtitle="Political graph context connected to this AI strategy recommendation." compact /> : null}
    </div>
  );
}

function BreakdownRow({ item, labelKey = "strategy_type", countKey = "count" }) {
  return <ResponsiveRow title={labelize(item[labelKey] || "Strategy")} subtitle={`${item[countKey] || 0} recommendations`} meta={[{ label: "Average", value: fmtPercent(item.avg_score) }, { label: "Top", value: fmtPercent(item.top_score) }]} right={<Badge tone={toneByScore(item.top_score)}>{fmtPercent(item.top_score)}</Badge>} />;
}

export default function StrategyRecommendationDashboard() {
  const [filters, setFilters] = useState({ state: "", type: "", priority: "", search: "", limit: 75 });
  const [summaryData, setSummaryData] = useState({ summary: {}, by_type: [], by_state: [] });
  const [recommendationData, setRecommendationData] = useState({ results: [], count: 0 });
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [queueing, setQueueing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");

  async function loadDashboard({ quiet = false } = {}) {
    try {
      if (!quiet) setLoading(true); setError(""); if (!quiet) setMessage("");
      const [summary, recommendations] = await Promise.all([getSummary(), getRecommendations({ state: filters.state, type: filters.type, priority: filters.priority, limit: filters.limit })]);
      setSummaryData(summary || { summary: {}, by_type: [], by_state: [] });
      setRecommendationData(recommendations || { results: [], count: 0 });
      const first = safeArray(recommendations?.results)[0] || null;
      setSelected((current) => current || first);
      setLastUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401) setError("Strategy Recommendation Engine requires an active sign-in token.");
      else if (status === 404) setError("Strategy API is not mounted yet. Confirm Build 2C backend is deployed.");
      else setError(err?.response?.data?.error || err?.message || "Failed to load Strategy Recommendation Engine.");
    } finally { setLoading(false); }
  }

  async function handleRecalculate() {
    try {
      setRecalculating(true); setError(""); setMessage("Recalculating AI strategy recommendations...");
      const result = await recalculateStrategy();
      setMessage(result?.summary ? `Strategy recalculation complete: ${result.summary.recommendations || 0} recommendations across ${result.summary.states_covered || 0} states.` : "Strategy recalculation complete.");
      await loadDashboard({ quiet: true });
    } catch (err) { setMessage(""); setError(err?.response?.data?.error || err?.message || "Failed to recalculate strategy recommendations."); }
    finally { setRecalculating(false); }
  }

  async function handleQueueAction(item) {
    if (!item?.recommendation_key) return;
    try { setQueueing(true); setError(""); const result = await queueAction(item.recommendation_key); setMessage(result?.ok ? "Strategy action queued for Command Center conversion." : result?.error || "Unable to queue action."); }
    catch (err) { setError(err?.response?.data?.error || err?.message || "Failed to queue strategy action."); }
    finally { setQueueing(false); }
  }

  useEffect(() => { loadDashboard(); }, [filters.state, filters.type, filters.priority, filters.limit]);
  useEffect(() => { const timer = setTimeout(() => loadDashboard({ quiet: true }), 350); return () => clearTimeout(timer); }, [filters.search]);

  const recommendations = safeArray(recommendationData.results);
  const byType = safeArray(summaryData.by_type);
  const byState = safeArray(summaryData.by_state);
  const summary = summaryData.summary || {};
  const visibleRecommendations = useMemo(() => {
    const q = String(filters.search || "").toLowerCase().trim();
    if (!q) return recommendations;
    return recommendations.filter((item) => [item.title, item.summary, item.recommended_action, item.rationale, item.entity_name, item.state, item.strategy_type, item.priority].filter(Boolean).join(" ").toLowerCase().includes(q));
  }, [recommendations, filters.search]);
  const topScore = n(summary.top_strategy_score || recommendations?.[0]?.strategy_score);
  const critical = n(summary.critical_recommendations);
  const high = n(summary.high_recommendations);

  return (
    <PageShell eyebrow="Build 2C" title="AI Strategy Recommendation Engine" description="A strategy command layer that converts political graph, influence, forecast, coalition, donor, vendor, and candidate intelligence into recommended actions." tickerItems={[{ label: "Recommendations", value: `${fmtNum(summary.total_recommendations || recommendations.length)}`, dotClass: "vs-live-dot-success" }, { label: "Top Score", value: `${fmtPercent(topScore)}`, dotClass: topScore >= 80 ? "vs-live-dot-warning" : "vs-live-dot-success" }, { label: "Critical", value: `${critical}`, dotClass: critical ? "vs-live-dot" : "vs-live-dot-success" }, { label: "High", value: `${high}`, dotClass: high ? "vs-live-dot-warning" : "vs-live-dot-success" }, { label: "States", value: `${summary.states_covered || 0}`, dotClass: "vs-live-dot-success" }, { label: "Updated", value: recalculating ? "Recalculating" : lastUpdated || "Live", dotClass: recalculating ? "vs-live-dot-warning" : "vs-live-dot-success" }]}>
      <style>{`.strategy-terminal{display:grid;gap:18px}.strategy-hero-grid{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(360px,.9fr);gap:18px;align-items:stretch}.strategy-command-card{border-radius:28px;border:1px solid rgba(96,165,250,.22);background:radial-gradient(circle at top right,rgba(59,130,246,.16),transparent 34%),radial-gradient(circle at bottom left,rgba(168,85,247,.14),transparent 36%),linear-gradient(135deg,rgba(15,23,42,.94),rgba(2,6,23,.72));padding:20px;box-shadow:0 24px 80px rgba(2,6,23,.28)}.strategy-command-kicker{color:rgba(125,211,252,.96);font-size:11px;font-weight:950;letter-spacing:.16em;text-transform:uppercase}.strategy-command-card h2{margin:12px 0 8px;color:white;font-size:clamp(30px,4vw,48px);line-height:.96;letter-spacing:-.075em;font-weight:980}.strategy-command-card p{margin:0;color:rgba(226,232,240,.72);font-size:14px;line-height:1.65;max-width:780px}.strategy-control-grid{margin-top:18px;display:grid;grid-template-columns:minmax(0,1fr) 160px 210px 150px 130px;gap:10px}.strategy-control-actions{margin-top:12px;display:flex;flex-wrap:wrap;gap:8px}.strategy-kpi-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.strategy-kpi{border-radius:24px;border:1px solid rgba(148,163,184,.16);background:rgba(15,23,42,.66);padding:16px;min-height:142px}.strategy-kpi span{display:block;color:rgba(147,197,253,.88);font-size:11px;font-weight:950;letter-spacing:.12em;text-transform:uppercase}.strategy-kpi strong{display:block;margin-top:10px;color:white;font-size:34px;line-height:.96;letter-spacing:-.065em;font-weight:980}.strategy-kpi p{margin:10px 0 0;color:rgba(226,232,240,.64);font-size:12px;line-height:1.45}.strategy-layout{display:grid;grid-template-columns:minmax(0,1.12fr) minmax(400px,.88fr);gap:18px;align-items:start}.strategy-card-list{display:grid;gap:12px}.strategy-card{width:100%;border:1px solid rgba(148,163,184,.14);border-radius:22px;background:radial-gradient(circle at top right,rgba(59,130,246,.12),transparent 34%),rgba(15,23,42,.62);padding:14px;text-align:left;cursor:pointer;color:inherit;transition:border-color .16s ease,transform .16s ease}.strategy-card:hover{transform:translateY(-1px);border-color:rgba(96,165,250,.36)}.strategy-card.is-selected{border-color:rgba(99,102,241,.62);box-shadow:0 0 0 1px rgba(99,102,241,.16),0 18px 48px rgba(2,6,23,.24)}.strategy-card-head{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:14px;align-items:start}.strategy-kicker{display:flex;align-items:center;gap:8px;flex-wrap:wrap;color:rgba(147,197,253,.86);font-size:10px;font-weight:950;text-transform:uppercase;letter-spacing:.12em}.strategy-card h3{margin:8px 0 6px;color:white;font-size:17px;font-weight:950;letter-spacing:-.04em;line-height:1.08}.strategy-card p{margin:0;color:rgba(203,213,225,.68);font-size:12px;line-height:1.45}.strategy-bars{display:grid;gap:8px;margin-top:14px}.strategy-card-foot,.strategy-action-row{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}.strategy-card-foot{margin-top:13px;color:rgba(203,213,225,.66);font-size:11px;font-weight:850}.strategy-card-foot em{color:rgba(147,197,253,.94);font-style:normal}.strategy-gauge{width:86px;height:86px;border-radius:999px;background:conic-gradient(rgba(96,165,250,.92) var(--score),rgba(30,41,59,.82) 0);display:grid;place-items:center;flex:none}.strategy-gauge.danger{background:conic-gradient(rgba(248,113,113,.94) var(--score),rgba(30,41,59,.82) 0)}.strategy-gauge.demo{background:conic-gradient(rgba(251,191,36,.94) var(--score),rgba(30,41,59,.82) 0)}.strategy-gauge.active{background:conic-gradient(rgba(74,222,128,.94) var(--score),rgba(30,41,59,.82) 0)}.strategy-gauge-core{width:68px;height:68px;border-radius:inherit;background:rgba(2,6,23,.9);display:grid;place-items:center;align-content:center;text-align:center}.strategy-gauge-core strong{color:white;font-size:16px;font-weight:980;letter-spacing:-.06em}.strategy-gauge-core span{color:rgba(203,213,225,.66);font-size:8px;font-weight:950;text-transform:uppercase;letter-spacing:.08em}.strategy-bar{display:grid;gap:5px}.strategy-bar-top{display:flex;justify-content:space-between;gap:8px;color:rgba(203,213,225,.74);font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.08em}.strategy-bar-top strong{color:white}.strategy-bar-track{height:7px;border-radius:999px;overflow:hidden;background:rgba(30,41,59,.82)}.strategy-bar-track i{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,rgba(96,165,250,.72),rgba(34,211,238,.94))}.strategy-bar.danger .strategy-bar-track i{background:linear-gradient(90deg,rgba(239,68,68,.68),rgba(248,113,113,.96))}.strategy-bar.demo .strategy-bar-track i{background:linear-gradient(90deg,rgba(245,158,11,.68),rgba(251,191,36,.96))}.strategy-bar.active .strategy-bar-track i{background:linear-gradient(90deg,rgba(34,197,94,.68),rgba(74,222,128,.96))}.selected-strategy-panel{display:grid;gap:14px}.selected-strategy-header{border-radius:24px;border:1px solid rgba(148,163,184,.16);background:radial-gradient(circle at top right,rgba(168,85,247,.18),transparent 36%),linear-gradient(135deg,rgba(15,23,42,.86),rgba(2,6,23,.62));padding:16px;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:14px;align-items:start}.selected-strategy-header h3{margin:10px 0 5px;color:white;font-size:22px;line-height:1.1;font-weight:950;letter-spacing:-.04em}.selected-strategy-header p{margin:0;color:rgba(203,213,225,.72);font-size:13px;line-height:1.45}.strategy-recommendation{border-radius:20px;border:1px solid rgba(96,165,250,.22);background:linear-gradient(135deg,rgba(37,99,235,.18),rgba(15,23,42,.44));padding:15px}.strategy-recommendation span{display:block;color:rgba(147,197,253,.92);font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:.1em}.strategy-recommendation p{margin:8px 0 0;color:rgba(226,232,240,.9);font-size:13px;line-height:1.55}@media(max-width:1180px){.strategy-hero-grid,.strategy-layout,.strategy-control-grid{grid-template-columns:1fr}}@media(max-width:720px){.strategy-kpi-grid,.strategy-card-head,.selected-strategy-header{grid-template-columns:1fr}}`}</style>
      <div className="strategy-terminal">
        {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}{message ? <div className="vs-banner vs-live-banner-pulse">{message}</div> : null}
        <div className="strategy-hero-grid"><div className="strategy-command-card"><span className="strategy-command-kicker">VoterSpheres Strategy Engine</span><h2>AI Strategy Command</h2><p>Convert intelligence signals into ranked actions by impact, urgency, feasibility, risk, priority, state, owner role, and Command Center readiness.</p><div className="strategy-control-grid"><input className="vs-input" value={filters.search} onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))} placeholder="Search strategy, entity, state, rationale, owner..." /><select className="vs-input" value={filters.state} onChange={(event) => setFilters((prev) => ({ ...prev, state: event.target.value }))}>{STATES.map(([value, label]) => <option key={value || "ALL"} value={value}>{label}</option>)}</select><select className="vs-input" value={filters.type} onChange={(event) => setFilters((prev) => ({ ...prev, type: event.target.value }))}>{STRATEGY_TYPES.map(([value, label]) => <option key={value || "ALL"} value={value}>{label}</option>)}</select><select className="vs-input" value={filters.priority} onChange={(event) => setFilters((prev) => ({ ...prev, priority: event.target.value }))}>{PRIORITIES.map(([value, label]) => <option key={value || "ALL"} value={value}>{label}</option>)}</select><select className="vs-input" value={filters.limit} onChange={(event) => setFilters((prev) => ({ ...prev, limit: Number(event.target.value) }))}><option value={25}>Top 25</option><option value={50}>Top 50</option><option value={75}>Top 75</option><option value={100}>Top 100</option></select></div><div className="strategy-control-actions"><button type="button" className="vs-button" disabled={recalculating} onClick={handleRecalculate}>{recalculating ? "Recalculating..." : "Recalculate Strategies"}</button><button type="button" className="vs-button vs-button-secondary" onClick={() => loadDashboard()}>Refresh</button></div></div><div className="strategy-kpi-grid"><div className="strategy-kpi"><span>Recommendations</span><strong>{fmtNum(summary.total_recommendations || recommendations.length)}</strong><p>Active AI strategy recommendations.</p></div><div className="strategy-kpi"><span>Top Score</span><strong>{fmtPercent(topScore)}</strong><p>Highest ranked strategic action.</p></div><div className="strategy-kpi"><span>Critical</span><strong>{critical}</strong><p>Actions requiring immediate review.</p></div><div className="strategy-kpi"><span>High Priority</span><strong>{high}</strong><p>Strong strategic opportunities or risks.</p></div></div></div>
        <div className="strategy-layout"><div className="vs-stack"><SectionCard title="AI Strategy Recommendations" subtitle="Ranked recommendations generated from graph, influence, forecast, coalition, donor, vendor, and candidate intelligence." right={<Badge tone="danger">{visibleRecommendations.length} strategies</Badge>}><div className="strategy-card-list">{loading ? <EmptyState text="Loading AI strategy recommendations..." /> : !visibleRecommendations.length ? <EmptyState text="No strategy recommendations found. Run Recalculate Strategies after Influence, Forecast, and Coalition data are synced." /> : visibleRecommendations.map((item) => <StrategyCard key={item.recommendation_key || item.id} item={item} selected={selected?.recommendation_key === item.recommendation_key} onSelect={setSelected} />)}</div></SectionCard><div className="vs-grid-2"><SectionCard title="Strategy Types" subtitle="Recommendation mix by strategic category." right={<Badge tone="info">{byType.length}</Badge>}><div className="vs-stack">{!byType.length ? <EmptyState text="No strategy type breakdown available." /> : byType.slice(0, 10).map((item) => <BreakdownRow key={item.strategy_type} item={item} />)}</div></SectionCard><SectionCard title="State Strategy Heat" subtitle="States ranked by top strategy score." right={<Badge tone="accent">{byState.length}</Badge>}><div className="vs-stack">{!byState.length ? <EmptyState text="No state strategy breakdown available." /> : byState.slice(0, 10).map((item) => <ResponsiveRow key={item.state} title={item.state || "Unknown"} subtitle={`${item.recommendations || 0} recommendations`} meta={[{ label: "Average", value: fmtPercent(item.avg_score) }, { label: "Top", value: fmtPercent(item.top_score) }]} right={<Badge tone={toneByScore(item.top_score)}>{fmtPercent(item.top_score)}</Badge>} />)}</div></SectionCard></div></div><div className="vs-stack"><SectionCard title="Selected Strategy" subtitle="Inspect recommendation details and queue Command Center action conversion." right={selected ? <Badge tone={priorityTone(selected.priority)}>{selected.priority}</Badge> : null}><SelectedStrategyPanel item={selected} onQueueAction={handleQueueAction} queueing={queueing} /></SectionCard></div></div>
      </div>
    </PageShell>
  );
}
