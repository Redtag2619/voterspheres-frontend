import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchDecisionIntelligence, seedDecisionIntelligence } from "../api/decisionIntelligenceApi";

import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";

const STATE_NAMES = {
  AL: "Alabama",
  AK: "Alaska",
  AZ: "Arizona",
  AR: "Arkansas",
  CA: "California",
  CO: "Colorado",
  CT: "Connecticut",
  DE: "Delaware",
  FL: "Florida",
  GA: "Georgia",
  HI: "Hawaii",
  ID: "Idaho",
  IL: "Illinois",
  IN: "Indiana",
  IA: "Iowa",
  KS: "Kansas",
  KY: "Kentucky",
  LA: "Louisiana",
  ME: "Maine",
  MD: "Maryland",
  MA: "Massachusetts",
  MI: "Michigan",
  MN: "Minnesota",
  MS: "Mississippi",
  MO: "Missouri",
  MT: "Montana",
  NE: "Nebraska",
  NV: "Nevada",
  NH: "New Hampshire",
  NJ: "New Jersey",
  NM: "New Mexico",
  NY: "New York",
  NC: "North Carolina",
  ND: "North Dakota",
  OH: "Ohio",
  OK: "Oklahoma",
  OR: "Oregon",
  PA: "Pennsylvania",
  RI: "Rhode Island",
  SC: "South Carolina",
  SD: "South Dakota",
  TN: "Tennessee",
  TX: "Texas",
  UT: "Utah",
  VT: "Vermont",
  VA: "Virginia",
  WA: "Washington",
  WV: "West Virginia",
  WI: "Wisconsin",
  WY: "Wyoming",
  DC: "District of Columbia",
};

const MODULE_NAMES = {
  forecast: "Executive Forecast Engine",
  forecasts: "Executive Forecast Engine",
  forecast_shift: "Executive Forecast Engine",
  coalition: "National Coalition Intelligence",
  coalitions: "National Coalition Intelligence",
  coalition_movement: "National Coalition Intelligence",
  influence: "Influence Intelligence Engine",
  influence_pressure: "Influence Intelligence Engine",
  operations: "Executive Operations Center",
  vendors: "Vendor Intelligence Network",
  vendor: "Vendor Intelligence Network",
  vendor_capacity: "Vendor Intelligence Network",
  strategy: "AI Strategy Recommendation Engine",
  command_center: "Executive Command Center",
  "command center": "Executive Command Center",
  "political graph": "National Political Graph Engine",
  political_graph: "National Political Graph Engine",
  intelligence: "Cross-Module Intelligence Layer",
};

const DECISION_TYPE_NAMES = {
  resource_allocation: "Executive Resource Allocation",
  coalition_activation: "Coalition Activation Strategy",
  risk_control: "Executive Risk Control",
  strategic: "Strategic Executive Decision",
  forecast_opportunity: "Forecast Opportunity Decision",
  vendor_execution: "Vendor Execution Decision",
  donor_growth: "Donor Growth Decision",
};

const PRIORITY_NAMES = {
  critical: "Critical Executive Alert",
  high: "High Priority Executive Alert",
  medium: "Medium Priority Executive Monitoring Alert",
  low: "Low Priority Informational Executive Signal",
  open: "Open Executive Review",
  active: "Active Executive Review",
  stable: "Stable Executive Posture",
  planning: "Executive Planning Stage",
  pending: "Pending Executive Action",
  completed: "Completed Executive Action",
  complete: "Completed Executive Action",
};

const COST_LEVEL_NAMES = {
  low: "Low Resource Cost",
  medium: "Medium Resource Cost",
  high: "High Resource Cost",
};

const fallbackDecisionData = {
  ok: true,
  source: "frontend-enterprise-fallback",
  summary: {
    openDecisions: 3,
    highPriority: 2,
    avgConfidence: 85,
    avgRisk: 31,
    liveSignals: 3,
  },
  decisions: [
    {
      id: "fallback-1",
      title: "Reallocate resources toward high-volatility battleground states",
      decision_type: "resource_allocation",
      priority: "high",
      status: "open",
      confidence_score: 91,
      risk_score: 34,
      impact_score: 88,
      urgency_score: 86,
      recommendation:
        "Shift field, vendor, and executive review capacity toward the highest volatility states while preserving national monitoring coverage.",
      rationale:
        "Forecast, coalition, influence, and operations indicators are clustering around competitive states with rising pressure.",
      source_modules: ["forecast", "coalitions", "influence", "operations"],
      options: [
        {
          id: "fallback-option-1",
          label: "Balanced executive resource shift",
          description: "Move 10-15% of resources into priority states while preserving national coverage.",
          projected_impact: 86,
          projected_risk: 32,
          confidence: 88,
          timeline: "7-14 days",
          cost_level: "medium",
        },
        {
          id: "fallback-option-2",
          label: "Aggressive executive resource shift",
          description: "Move 20-30% of available resources into the highest volatility states.",
          projected_impact: 94,
          projected_risk: 55,
          confidence: 81,
          timeline: "3-7 days",
          cost_level: "high",
        },
      ],
      actions: [
        {
          id: "fallback-action-1",
          action_label: "Review battleground allocation model",
          owner: "Executive Operations",
          status: "pending",
          due_window: "24 hours",
        },
        {
          id: "fallback-action-2",
          action_label: "Validate vendor readiness in priority states",
          owner: "Vendor Operations",
          status: "pending",
          due_window: "72 hours",
        },
      ],
    },
    {
      id: "fallback-2",
      title: "Convert coalition instability into targeted field actions",
      decision_type: "coalition_activation",
      priority: "high",
      status: "open",
      confidence_score: 84,
      risk_score: 29,
      impact_score: 81,
      urgency_score: 78,
      recommendation:
        "Assign coalition owners to the most unstable voter blocs and convert each movement signal into Command Center tasks.",
      rationale:
        "Coalition movement suggests a time-sensitive opening for persuasion and turnout coordination.",
      source_modules: ["coalitions", "strategy", "command_center"],
      options: [
        {
          id: "fallback-option-3",
          label: "Activate coalition owners",
          description: "Assign responsible owners to top coalition opportunities and track weekly movement.",
          projected_impact: 82,
          projected_risk: 25,
          confidence: 84,
          timeline: "5-10 days",
          cost_level: "medium",
        },
      ],
      actions: [
        {
          id: "fallback-action-3",
          action_label: "Create coalition response tasks",
          owner: "Coalition Director",
          status: "pending",
          due_window: "48 hours",
        },
      ],
    },
    {
      id: "fallback-3",
      title: "Reduce decision risk before expanding digital spend",
      decision_type: "risk_control",
      priority: "medium",
      status: "planning",
      confidence_score: 79,
      risk_score: 30,
      impact_score: 73,
      urgency_score: 67,
      recommendation:
        "Hold major budget expansion until forecast confidence and message testing improve above executive threshold.",
      rationale:
        "Digital opportunity is present, but uncertainty remains in audience response and vendor capacity.",
      source_modules: ["forecast", "vendors", "influence"],
      options: [],
      actions: [],
    },
  ],
  signals: [
    {
      id: "fallback-signal-1",
      signal_type: "forecast_shift",
      title: "Forecast volatility rising",
      description: "Competitive movement detected across battleground modeling.",
      severity: "high",
      source_module: "forecast",
      state_code: "GA",
    },
    {
      id: "fallback-signal-2",
      signal_type: "coalition_movement",
      title: "Coalition instability detected",
      description: "Suburban and turnout-sensitive blocs require executive monitoring.",
      severity: "medium",
      source_module: "coalitions",
      state_code: "PA",
    },
    {
      id: "fallback-signal-3",
      signal_type: "vendor_capacity",
      title: "Vendor readiness gap",
      description: "Execution capacity needs verification before resource expansion.",
      severity: "medium",
      source_module: "vendors",
      state_code: "AZ",
    },
  ],
};

function arr(value) {
  return Array.isArray(value) ? value : [];
}

function number(value, fallback = 0) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function pct(value) {
  return `${Math.round(number(value))}%`;
}

function labelize(value = "") {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function fullStateName(value = "") {
  const code = String(value || "").trim().toUpperCase();
  return STATE_NAMES[code] || (code ? labelize(code) : "National Coverage");
}

function fullModuleName(value = "") {
  const key = String(value || "").trim().toLowerCase();
  return MODULE_NAMES[key] || labelize(value || "Cross-Module Intelligence Layer");
}

function fullDecisionType(value = "") {
  const key = String(value || "").trim().toLowerCase();
  return DECISION_TYPE_NAMES[key] || labelize(value || "Strategic Executive Decision");
}

function fullPriorityLabel(value = "") {
  const key = String(value || "").trim().toLowerCase();
  return PRIORITY_NAMES[key] || labelize(value || "Executive Monitoring Priority");
}

function fullCostLevel(value = "") {
  const key = String(value || "").trim().toLowerCase();
  return COST_LEVEL_NAMES[key] || labelize(value || "Medium Resource Cost");
}

function toneFromPriority(value = "") {
  const next = String(value || "").toLowerCase();
  if (["critical", "high"].includes(next)) return "danger";
  if (["medium", "watch", "warning", "planning"].includes(next)) return "accent";
  if (["open", "active", "stable", "complete", "completed"].includes(next)) return "active";
  return "default";
}

function normalizeDecisionPayload(payload) {
  const source = payload && typeof payload === "object" ? payload : fallbackDecisionData;

  return {
    ...fallbackDecisionData,
    ...source,
    summary: {
      ...fallbackDecisionData.summary,
      ...(source.summary || {}),
    },
    decisions: arr(source.decisions).length ? arr(source.decisions) : fallbackDecisionData.decisions,
    signals: arr(source.signals).length ? arr(source.signals) : fallbackDecisionData.signals,
  };
}

function ScoreBar({ value = 0, inverse = false }) {
  const width = Math.max(0, Math.min(100, number(value)));

  return (
    <div className={inverse ? "edi-score-bar inverse" : "edi-score-bar"}>
      <span style={{ width: `${width}%` }} />
    </div>
  );
}

function ExecutivePercentCard({ title, value, subtitle, inverse = false }) {
  return (
    <div className="edi-score-card">
      <div className="edi-score-card-head">
        <span>{title}</span>
        <strong>{pct(value)}</strong>
      </div>
      <p>{subtitle}</p>
      <ScoreBar value={value} inverse={inverse} />
    </div>
  );
}

function DetailGrid({ items = [], columns = 2 }) {
  return (
    <div
      className="edi-detail-grid"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {items.map((item) => (
        <div className="edi-detail-item" key={`${item.label}-${item.value}`}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
        </div>
      ))}
    </div>
  );
}

function DecisionRow({ decision, active, onClick }) {
  return (
    <button
      type="button"
      className={active ? "edi-decision-row is-active" : "edi-decision-row"}
      onClick={onClick}
    >
      <div className="edi-row-kicker">Executive Decision Queue Item</div>
      <h3>{decision.title || "Executive decision"}</h3>
      <p>{decision.rationale || decision.recommendation || "Executive decision requires review."}</p>

      <DetailGrid
        columns={2}
        items={[
          { label: "Decision Category", value: fullDecisionType(decision.decision_type) },
          { label: "Executive Priority Level", value: fullPriorityLabel(decision.priority) },
          { label: "Projected Strategic Impact Percentage", value: pct(decision.impact_score) },
          { label: "Projected Execution Risk Percentage", value: pct(decision.risk_score) },
        ]}
      />
    </button>
  );
}

function SignalRow({ signal }) {
  return (
    <div className="edi-signal-row">
      <div className="edi-signal-head">
        <span className={String(signal.severity || "").toLowerCase() === "high" ? "vs-live-dot" : "vs-live-dot-warning"} />
        <div>
          <div className="edi-row-kicker">Live Executive Decision Signal</div>
          <h3>{signal.title || "Executive intelligence signal"}</h3>
        </div>
      </div>

      <p>{signal.description || "Review signal details."}</p>

      <DetailGrid
        columns={1}
        items={[
          { label: "Intelligence Source", value: fullModuleName(signal.source_module || signal.signal_type) },
          { label: "Geographic Coverage", value: fullStateName(signal.state_code) },
          { label: "Executive Alert Level", value: fullPriorityLabel(signal.severity) },
        ]}
      />
    </div>
  );
}

function DecisionOption({ option }) {
  return (
    <div className="edi-option-card">
      <h3>{option.label || "Executive decision option"}</h3>
      <p>{option.description || "Scenario path requires executive review."}</p>

      <DetailGrid
        columns={2}
        items={[
          { label: "Projected Strategic Impact Percentage", value: pct(option.projected_impact) },
          { label: "Projected Execution Risk Percentage", value: pct(option.projected_risk) },
          { label: "Option Confidence Percentage", value: pct(option.confidence) },
          { label: "Execution Timeline", value: option.timeline || "7 days" },
          { label: "Resource Cost Level", value: fullCostLevel(option.cost_level) },
        ]}
      />
    </div>
  );
}

function ExecutiveAction({ action }) {
  return (
    <div className="edi-action-card">
      <div className="edi-action-left">
        <span className="edi-live-dot" />
        <div>
          <strong>{action.action_label || "Executive action"}</strong>
          <p>{action.owner || "Executive Team"} · {action.due_window || "72 hours"}</p>
        </div>
      </div>
      <Badge tone={toneFromPriority(action.status || "pending")}>{fullPriorityLabel(action.status || "pending")}</Badge>
    </div>
  );
}

export default function ExecutiveDecisionIntelligence() {
  const [data, setData] = useState(fallbackDecisionData);
  const [activeDecisionId, setActiveDecisionId] = useState(fallbackDecisionData.decisions[0]?.id || null);
  const [loading, setLoading] = useState(true);
  const [seedLoading, setSeedLoading] = useState(false);
  const [apiWarning, setApiWarning] = useState("");

  async function loadData() {
    try {
      setLoading(true);
      setApiWarning("");

      const result = normalizeDecisionPayload(await fetchDecisionIntelligence(1));
      setData(result);

      setActiveDecisionId((current) => {
        if (current && arr(result.decisions).some((item) => String(item.id) === String(current))) return current;
        return result.decisions?.[0]?.id || null;
      });
    } catch (error) {
      setData(fallbackDecisionData);
      setActiveDecisionId(fallbackDecisionData.decisions[0]?.id || null);
      setApiWarning(
        error?.response?.data?.error ||
          error?.message ||
          "Executive Decision Intelligence API returned an error. Showing local executive fallback data."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSeed() {
    try {
      setSeedLoading(true);
      setApiWarning("");
      await seedDecisionIntelligence(1);
      await loadData();
    } catch (error) {
      setApiWarning(
        error?.response?.data?.error ||
          error?.message ||
          "Unable to seed Executive Decision Intelligence. Backend migration may not be deployed yet."
      );
    } finally {
      setSeedLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const decisions = arr(data.decisions);
  const signals = arr(data.signals);

  const activeDecision = useMemo(() => {
    return decisions.find((item) => String(item.id) === String(activeDecisionId)) || decisions[0] || null;
  }, [decisions, activeDecisionId]);

  const summary = data.summary || fallbackDecisionData.summary;

  return (
    <PageShell
      eyebrow="Build 2D · Executive Decision Intelligence"
      title="Executive Decision Intelligence"
      description="A VoterSpheres executive command module for ranking strategic choices, comparing decision paths, scoring operational risk, and converting cross-module intelligence into executive action."
      demo={Boolean(apiWarning) || String(data.source || "").includes("fallback")}
      demoText="Fallback executive intelligence is active while the live Decision Intelligence API is unavailable."
    >
      <style>{`
        .edi-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
        }

        .edi-toolbar-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          flex-wrap: wrap;
          gap: 10px;
        }

        .edi-kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 18px;
        }

        .edi-main-layout {
          display: grid;
          grid-template-columns: minmax(420px, 0.92fr) minmax(0, 1.25fr);
          gap: 22px;
          align-items: start;
        }

        .edi-secondary-layout {
          display: grid;
          grid-template-columns: minmax(0, 1.25fr) minmax(420px, 0.92fr);
          gap: 22px;
          align-items: start;
        }

        .edi-decision-row,
        .edi-signal-row,
        .edi-option-card,
        .edi-action-card,
        .edi-score-card {
          min-width: 0;
          border: 1px solid var(--vs-exec-border, var(--vs-border));
          border-radius: 20px;
          background:
            radial-gradient(circle at top right, rgba(37, 99, 235, 0.07), transparent 28%),
            rgba(15, 23, 42, 0.52);
        }

        .edi-decision-row {
          width: 100%;
          color: inherit;
          padding: 18px;
          text-align: left;
          cursor: pointer;
          transition: border-color 0.18s ease, background 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease;
        }

        .edi-decision-row:hover,
        .edi-decision-row.is-active {
          border-color: rgba(251, 146, 60, 0.50);
          background:
            radial-gradient(circle at top right, rgba(251, 146, 60, 0.12), transparent 30%),
            rgba(15, 23, 42, 0.72);
          transform: translateY(-1px);
          box-shadow: 0 0 0 1px rgba(251, 146, 60, 0.15);
        }

        .edi-row-kicker {
          color: var(--vs-brand-orange, #fb923c);
          font-size: 10px;
          font-weight: 950;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          line-height: 1.35;
          overflow-wrap: anywhere;
        }

        .edi-decision-row h3,
        .edi-signal-row h3,
        .edi-option-card h3 {
          margin: 8px 0 0;
          color: var(--vs-text);
          font-size: 16px;
          font-weight: 900;
          letter-spacing: -0.03em;
          line-height: 1.35;
          overflow-wrap: anywhere;
        }

        .edi-decision-row p,
        .edi-signal-row p,
        .edi-option-card p {
          margin: 8px 0 0;
          color: var(--vs-text-muted);
          font-size: 12px;
          line-height: 1.65;
          overflow-wrap: anywhere;
        }

        .edi-detail-grid {
          display: grid;
          gap: 12px;
          margin-top: 16px;
        }

        .edi-detail-item {
          min-width: 0;
          border-radius: 16px;
          border: 1px solid rgba(148, 163, 184, 0.13);
          background: rgba(2, 6, 23, 0.28);
          padding: 12px;
        }

        .edi-detail-item span {
          display: block;
          color: rgba(148, 163, 184, 0.86);
          font-size: 10px;
          font-weight: 950;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          line-height: 1.4;
          white-space: normal;
          overflow-wrap: anywhere;
        }

        .edi-detail-item strong {
          display: block;
          margin-top: 6px;
          color: rgba(248, 250, 252, 0.95);
          font-size: 12px;
          line-height: 1.45;
          font-weight: 850;
          white-space: normal;
          word-break: normal;
          overflow-wrap: anywhere;
        }

        .edi-recommendation-panel {
          border: 1px solid rgba(251, 146, 60, 0.30);
          border-radius: 26px;
          background:
            radial-gradient(circle at top right, rgba(251, 146, 60, 0.15), transparent 36%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.78), rgba(2, 6, 23, 0.58));
          padding: 22px;
        }

        .edi-recommendation-panel h3 {
          margin: 8px 0 10px;
          color: var(--vs-text);
          font-size: 22px;
          line-height: 1.32;
          font-weight: 950;
          letter-spacing: -0.04em;
          overflow-wrap: anywhere;
        }

        .edi-module-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 14px;
        }

        .edi-score-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        .edi-score-card {
          padding: 17px;
          display: grid;
          gap: 10px;
        }

        .edi-score-card-head {
          display: grid;
          gap: 6px;
        }

        .edi-score-card-head span {
          color: var(--vs-text-muted);
          font-size: 10px;
          font-weight: 950;
          text-transform: uppercase;
          letter-spacing: 0.10em;
          line-height: 1.45;
          white-space: normal;
          overflow-wrap: anywhere;
        }

        .edi-score-card-head strong {
          color: var(--vs-text);
          font-size: 32px;
          line-height: 1;
          font-weight: 950;
          letter-spacing: -0.055em;
          white-space: nowrap;
        }

        .edi-score-card p {
          margin: 0;
          color: var(--vs-text-muted);
          font-size: 12px;
          line-height: 1.6;
          overflow-wrap: anywhere;
        }

        .edi-score-bar {
          height: 9px;
          border-radius: 999px;
          background: rgba(148, 163, 184, 0.16);
          overflow: hidden;
          border: 1px solid rgba(148, 163, 184, 0.10);
        }

        .edi-score-bar span {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #fb923c, #22c55e);
        }

        .edi-score-bar.inverse span {
          background: linear-gradient(90deg, #f59e0b, #ef4444);
        }

        .edi-signal-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        .edi-signal-row,
        .edi-option-card {
          padding: 18px;
        }

        .edi-signal-head {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          min-width: 0;
        }

        .edi-action-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          padding: 16px;
        }

        .edi-action-left {
          display: flex;
          align-items: flex-start;
          gap: 11px;
          min-width: 0;
        }

        .edi-action-left strong {
          display: block;
          color: var(--vs-text);
          font-size: 14px;
          line-height: 1.35;
          overflow-wrap: anywhere;
        }

        .edi-action-left p {
          margin: 5px 0 0;
          color: var(--vs-text-muted);
          font-size: 12px;
          line-height: 1.45;
          overflow-wrap: anywhere;
        }

        .edi-live-dot {
          width: 9px;
          height: 9px;
          margin-top: 5px;
          border-radius: 999px;
          background: var(--vs-brand-orange, #fb923c);
          box-shadow: 0 0 16px rgba(251, 146, 60, 0.65);
          flex: 0 0 auto;
        }

        @media (max-width: 1320px) {
          .edi-main-layout,
          .edi-secondary-layout {
            grid-template-columns: 1fr;
          }

          .edi-signal-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 980px) {
          .edi-kpi-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .edi-score-grid,
          .edi-detail-grid {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 640px) {
          .edi-kpi-grid {
            grid-template-columns: 1fr;
          }

          .edi-toolbar-actions {
            width: 100%;
            justify-content: flex-start;
          }

          .edi-toolbar-actions .vs-button {
            width: 100%;
          }

          .edi-action-card {
            align-items: flex-start;
            flex-direction: column;
          }
        }
      `}</style>

      <div className="edi-toolbar">
        <div className="vs-chip-row">
          <Badge tone={apiWarning ? "warning" : "active"}>{apiWarning ? "Fallback Executive Intelligence" : "Live Executive Intelligence API"}</Badge>
          <Badge tone="accent">Executive Decision Layer</Badge>
          <Badge tone="info">Cross-Module Intelligence Synthesis</Badge>
        </div>

        <div className="edi-toolbar-actions">
          <button type="button" className="vs-button vs-button-secondary" onClick={loadData} disabled={loading}>
            {loading ? "Refreshing Executive Intelligence..." : "Refresh Executive Intelligence"}
          </button>
          <button type="button" className="vs-button vs-button-primary" onClick={handleSeed} disabled={seedLoading}>
            {seedLoading ? "Seeding Executive Intelligence..." : "Seed Executive Intelligence"}
          </button>
          <Link className="vs-button vs-button-secondary" to="/command-center">
            Open Executive Command Center
          </Link>
          <Link className="vs-button vs-button-secondary" to="/executive-forecast">
            Open Executive Forecast Dashboard
          </Link>
          <Link className="vs-button vs-button-secondary" to="/relationship-graph">
            Open National Political Graph
          </Link>
        </div>
      </div>

      {apiWarning ? <div className="vs-banner vs-banner-danger">{apiWarning}</div> : null}

      <div className="edi-kpi-grid" data-tour="decision-intelligence-kpis">
        <StatCard label="Open Executive Decisions" value={summary.openDecisions || decisions.length || 0} subtext="Executive decisions requiring leadership review" />
        <StatCard label="High Priority Executive Alerts" value={summary.highPriority || 0} subtext="Decisions requiring elevated executive attention" />
        <StatCard label="Average Recommendation Confidence Percentage" value={pct(summary.avgConfidence)} subtext="Full confidence percentage across active recommendations" />
        <StatCard label="Average Operational Risk Percentage" value={pct(summary.avgRisk)} subtext={`Full risk percentage across ${summary.liveSignals || signals.length || 0} live decision signals`} />
      </div>

      <div className="edi-main-layout">
        <SectionCard
          title="Executive Decision Queue"
          subtitle="Ranked executive decisions from strategy, forecast, coalition, influence, vendor, political graph, and operations intelligence."
          right={<Badge tone="info">{decisions.length} Active Executive Decisions</Badge>}
        >
          {loading ? (
            <EmptyState text="Loading Executive Decision Intelligence..." />
          ) : decisions.length ? (
            <div className="vs-stack">
              {decisions.map((decision) => (
                <DecisionRow
                  key={decision.id || decision.title}
                  decision={decision}
                  active={String(activeDecision?.id) === String(decision.id)}
                  onClick={() => setActiveDecisionId(decision.id)}
                />
              ))}
            </div>
          ) : (
            <EmptyState text="No executive decisions are currently available." />
          )}
        </SectionCard>

        <div className="vs-stack">
          <SectionCard
            title="AI Executive Recommendation"
            subtitle="Primary recommended action with rationale, full percentage scoring, and source-module traceability."
            right={<Badge tone={toneFromPriority(activeDecision?.status || activeDecision?.priority)}>{fullPriorityLabel(activeDecision?.status || activeDecision?.priority || "open")}</Badge>}
          >
            {activeDecision ? (
              <div className="vs-stack">
                <div className="edi-recommendation-panel">
                  <div className="vs-page-eyebrow">Recommended Executive Decision Path</div>
                  <h3>{activeDecision.recommendation || activeDecision.title}</h3>
                  <p className="vs-page-subtitle" style={{ margin: 0 }}>{activeDecision.rationale || "No executive rationale available."}</p>
                  <div className="edi-module-row">
                    {arr(activeDecision.source_modules).map((source) => (
                      <Badge key={source} tone="accent">{fullModuleName(source)}</Badge>
                    ))}
                  </div>
                </div>

                <div className="edi-score-grid">
                  <ExecutivePercentCard
                    title="Recommendation Confidence Percentage"
                    value={activeDecision.confidence_score}
                    subtitle="Reliability level for this executive recommendation."
                  />
                  <ExecutivePercentCard
                    title="Strategic Impact Percentage"
                    value={activeDecision.impact_score}
                    subtitle="Projected strategic value if this decision path is executed."
                  />
                  <ExecutivePercentCard
                    title="Executive Urgency Percentage"
                    value={activeDecision.urgency_score}
                    subtitle="How quickly leadership should act on this decision path."
                  />
                  <ExecutivePercentCard
                    title="Operational Risk Percentage"
                    value={activeDecision.risk_score}
                    subtitle="Downside exposure or operational execution risk."
                    inverse
                  />
                </div>
              </div>
            ) : (
              <EmptyState text="No executive decision is currently selected." />
            )}
          </SectionCard>
        </div>
      </div>

      <div className="edi-secondary-layout">
        <div className="vs-stack">
          <SectionCard
            title="Executive Decision Options"
            subtitle="Alternative decision paths with full projected impact, risk, confidence, timeline, and cost labels."
            right={<Badge tone="accent">{arr(activeDecision?.options).length} Executive Options</Badge>}
          >
            {arr(activeDecision?.options).length ? (
              <div className="vs-stack">
                {arr(activeDecision.options).map((option) => (
                  <DecisionOption key={option.id || option.label} option={option} />
                ))}
              </div>
            ) : (
              <EmptyState text="No executive decision options have been generated for this decision yet." />
            )}
          </SectionCard>

          <SectionCard
            title="Executive Action Path"
            subtitle="Operational follow-through connected to the selected executive decision."
            right={<Badge tone="info">{arr(activeDecision?.actions).length} Executive Actions</Badge>}
          >
            {arr(activeDecision?.actions).length ? (
              <div className="vs-stack">
                {arr(activeDecision.actions).map((action) => (
                  <ExecutiveAction key={action.id || action.action_label} action={action} />
                ))}
              </div>
            ) : (
              <EmptyState text="No executive action path has been generated for this decision yet." />
            )}
          </SectionCard>
        </div>

        <SectionCard
          title="Live Executive Decision Signals"
          subtitle="Fully labeled intelligence signals driving executive recommendations across the VoterSpheres platform."
          right={<Badge tone="accent">{signals.length} Live Executive Signals</Badge>}
        >
          {signals.length ? (
            <div className="edi-signal-grid">
              {signals.map((signal) => <SignalRow key={signal.id || signal.title} signal={signal} />)}
            </div>
          ) : (
            <EmptyState text="No live executive decision signals are currently available." />
          )}
        </SectionCard>
      </div>
    </PageShell>
  );
}
