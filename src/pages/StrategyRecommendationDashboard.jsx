import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";

import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import ResponsiveRow from "../components/ui/ResponsiveRow";

const STATE_NAMES = {
  AL: "Alabama",
  AK: "Alaska",
  AZ: "Arizona",
  AR: "Arkansas",
  CA: "California",
  CO: "Colorado",
  CT: "Connecticut",
  DE: "Delaware",
  DC: "District of Columbia",
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
};

const STRATEGY_TYPE_NAMES = {
  forecast_opportunity: "Forecast Opportunity Strategy",
  risk_defense: "Strategic Risk Defense Plan",
  donor_growth: "Donor Growth Strategy",
  endorsement_capture: "Endorsement Capture Strategy",
  vendor_execution: "Vendor Execution Optimization Strategy",
  coalition_activation: "Coalition Activation Strategy",
  coalition_defense: "Coalition Defense Strategy",
  influence_growth: "Influence Growth Strategy",
  influence_defense: "Influence Defense Strategy",
  resource_allocation: "Executive Resource Allocation Strategy",
  field_operations: "Grassroots Field Operations Strategy",
  turnout_expansion: "Voter Turnout Expansion Strategy",
  persuasion_messaging: "Persuasion Messaging Strategy",
  digital_advertising: "Digital Advertising Optimization Strategy",
  fundraising_expansion: "Fundraising Expansion Strategy",
  command_center_execution: "Command Center Execution Strategy",
  strategic: "Executive Strategic Recommendation",
  campaign_response: "Campaign Response Strategy",
};

const PRIORITY_NAMES = {
  critical: "Critical Executive Priority",
  high: "High Executive Priority",
  medium: "Executive Monitoring Priority",
  low: "Informational Executive Priority",
  active: "Active Executive Recommendation",
  open: "Open Executive Review",
  queued: "Queued For Execution",
  completed: "Completed Executive Action",
};

const fallbackStrategyData = {
  ok: true,
  source: "frontend-fallback",
  summary: {
    total_recommendations: 8,
    critical_recommendations: 1,
    high_recommendations: 3,
    medium_recommendations: 3,
    low_recommendations: 1,
    states_covered: 6,
    avg_strategy_score: 82,
    top_strategy_score: 94,
  },
  by_type: [
    {
      strategy_type: "resource_allocation",
      count: 2,
      avg_score: 87,
      top_score: 94,
    },
    {
      strategy_type: "coalition_activation",
      count: 2,
      avg_score: 84,
      top_score: 91,
    },
    {
      strategy_type: "digital_advertising",
      count: 1,
      avg_score: 81,
      top_score: 81,
    },
    {
      strategy_type: "fundraising_expansion",
      count: 1,
      avg_score: 78,
      top_score: 78,
    },
  ],
  by_state: [
    {
      state: "GA",
      recommendations: 3,
      avg_score: 88,
      top_score: 94,
    },
    {
      state: "PA",
      recommendations: 2,
      avg_score: 84,
      top_score: 91,
    },
    {
      state: "AZ",
      recommendations: 2,
      avg_score: 79,
      top_score: 86,
    },
    {
      state: "MI",
      recommendations: 1,
      avg_score: 76,
      top_score: 76,
    },
  ],
  by_priority: [
    {
      priority: "critical",
      count: 1,
      avg_score: 92,
      top_score: 94,
    },
    {
      priority: "high",
      count: 3,
      avg_score: 86,
      top_score: 91,
    },
    {
      priority: "medium",
      count: 3,
      avg_score: 78,
      top_score: 82,
    },
    {
      priority: "low",
      count: 1,
      avg_score: 68,
      top_score: 68,
    },
  ],
  recommendations: [
    {
      id: "fallback-strategy-1",
      recommendation_key: "fallback-resource-georgia",
      title: "Increase executive resource allocation in Georgia priority counties",
      summary:
        "Georgia shows high strategic opportunity with strong forecast confidence and operational readiness.",
      recommended_action:
        "Move additional field, vendor, and coalition resources into priority Georgia counties within the next seven days.",
      rationale:
        "Forecast opportunity, coalition movement, and operations capacity are aligned enough to justify executive resource escalation.",
      state: "GA",
      strategy_type: "resource_allocation",
      priority: "critical",
      confidence_score: 91,
      impact_score: 94,
      urgency_score: 88,
      feasibility_score: 84,
      risk_score: 29,
      strategy_score: 94,
      owner_role: "Executive Strategy Director",
      time_horizon: "7 Days",
      status: "active",
    },
    {
      id: "fallback-strategy-2",
      recommendation_key: "fallback-coalition-pennsylvania",
      title: "Activate coalition stabilization strategy in Pennsylvania",
      summary:
        "Pennsylvania coalition movement requires executive monitoring and a rapid persuasion response.",
      recommended_action:
        "Assign coalition owners and launch targeted persuasion messaging in suburban voter blocs.",
      rationale:
        "Coalition volatility is high enough to require action, but risk remains manageable with targeted response.",
      state: "PA",
      strategy_type: "coalition_activation",
      priority: "high",
      confidence_score: 87,
      impact_score: 86,
      urgency_score: 82,
      feasibility_score: 80,
      risk_score: 34,
      strategy_score: 91,
      owner_role: "Coalition Strategy Director",
      time_horizon: "72 Hours",
      status: "active",
    },
    {
      id: "fallback-strategy-3",
      recommendation_key: "fallback-vendor-arizona",
      title: "Stabilize vendor execution before expanding Arizona operations",
      summary:
        "Arizona has strategic opportunity, but vendor readiness is below the preferred enterprise threshold.",
      recommended_action:
        "Review vendor execution capacity before converting simulation output into expanded operations.",
      rationale:
        "Execution risk could reduce the value of additional investment unless vendor readiness improves.",
      state: "AZ",
      strategy_type: "vendor_execution",
      priority: "medium",
      confidence_score: 81,
      impact_score: 77,
      urgency_score: 74,
      feasibility_score: 69,
      risk_score: 42,
      strategy_score: 86,
      owner_role: "Operations Director",
      time_horizon: "5 Days",
      status: "active",
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

function normalizeKey(value = "") {
  return String(value || "").trim().toLowerCase();
}

function labelize(value = "") {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function fullStateName(value = "") {
  const raw = String(value || "").trim();
  const upper = raw.toUpperCase();

  return STATE_NAMES[upper] || raw || "National Coverage";
}

function fullStrategyType(value = "") {
  const key = normalizeKey(value).replace(/\s+/g, "_");

  return STRATEGY_TYPE_NAMES[key] || `${labelize(value || "strategy")} Strategy`;
}

function fullPriority(value = "") {
  const key = normalizeKey(value);

  return PRIORITY_NAMES[key] || labelize(value || "Executive Monitoring Priority");
}

function tone(value = "") {
  const key = normalizeKey(value);

  if (["critical", "high"].includes(key)) return "danger";
  if (["medium", "monitoring", "watch"].includes(key)) return "accent";
  if (["active", "completed", "complete", "queued"].includes(key)) return "active";
  return "info";
}

function normalizeStrategyPayload(payload) {
  const data = payload && typeof payload === "object" ? payload : {};

  return {
    ...fallbackStrategyData,
    ...data,
    summary: {
      ...fallbackStrategyData.summary,
      ...(data.summary || {}),
    },
    by_type: arr(data.by_type).length ? arr(data.by_type) : fallbackStrategyData.by_type,
    by_state: arr(data.by_state).length ? arr(data.by_state) : fallbackStrategyData.by_state,
    by_priority: arr(data.by_priority).length ? arr(data.by_priority) : fallbackStrategyData.by_priority,
    recommendations: arr(data.recommendations).length
      ? arr(data.recommendations)
      : arr(data.results).length
        ? arr(data.results)
        : fallbackStrategyData.recommendations,
  };
}

async function fetchStrategyDashboardData() {
  try {
    const [summaryResponse, recommendationsResponse] = await Promise.all([
      api.get("/strategy/summary"),
      api.get("/strategy/recommendations", {
        params: {
          limit: 100,
        },
      }),
    ]);

    return normalizeStrategyPayload({
      ...(summaryResponse.data || {}),
      recommendations:
        recommendationsResponse.data?.recommendations ||
        recommendationsResponse.data?.results ||
        [],
      source: "api",
    });
  } catch (error) {
    console.error(
      "[Strategy Recommendation Dashboard] Load failed:",
      error?.response?.data || error?.message || error
    );

    return normalizeStrategyPayload({
      ...fallbackStrategyData,
      source: "api-fallback",
    });
  }
}

async function seedStrategyRecommendations() {
  try {
    const { data } = await api.post("/strategy/seed");
    return data;
  } catch (error) {
    console.error(
      "[Strategy Recommendation Dashboard] Seed failed:",
      error?.response?.data || error?.message || error
    );

    return {
      ok: false,
      error: "Seed endpoint unavailable.",
    };
  }
}

function PercentCard({ title, value, subtitle, inverse = false }) {
  const width = Math.max(0, Math.min(100, number(value)));

  return (
    <div className="strategy-percent-card">
      <div className="strategy-percent-head">
        <span>{title}</span>
        <strong>{pct(value)}</strong>
      </div>
      <p>{subtitle}</p>
      <div className={inverse ? "strategy-percent-bar inverse" : "strategy-percent-bar"}>
        <i style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function StrategyTypeCard({ item }) {
  return (
    <div className="strategy-type-card">
      <ResponsiveRow
        title={fullStrategyType(item.strategy_type)}
        subtitle="National strategy category generated by the AI Strategy Recommendation Engine."
        meta={[
          {
            label: "Active Recommendation Count",
            value: item.count || 0,
          },
          {
            label: "Average Strategy Score Percentage",
            value: pct(item.avg_score),
          },
          {
            label: "Top Strategy Score Percentage",
            value: pct(item.top_score),
          },
        ]}
      />
    </div>
  );
}

function StateHeatCard({ item }) {
  return (
    <div className="strategy-state-card">
      <ResponsiveRow
        title={fullStateName(item.state)}
        subtitle="State-level strategy heat based on active recommendation volume and top strategy score."
        meta={[
          {
            label: "Active State Strategy Recommendations",
            value: item.recommendations || 0,
          },
          {
            label: "Average State Strategy Heat Percentage",
            value: pct(item.avg_score),
          },
          {
            label: "Highest State Strategy Heat Percentage",
            value: pct(item.top_score),
          },
          {
            label: "Geographic Coverage",
            value: fullStateName(item.state),
          },
        ]}
      />
    </div>
  );
}

function RecommendationRow({ recommendation, active, onClick }) {
  return (
    <button
      type="button"
      className={active ? "strategy-rec-row is-active" : "strategy-rec-row"}
      onClick={onClick}
    >
      <ResponsiveRow
        title={recommendation.title || "AI strategy recommendation"}
        subtitle={recommendation.summary || recommendation.recommended_action || "Strategy recommendation requires executive review."}
        meta={[
          {
            label: "Strategy Type",
            value: fullStrategyType(recommendation.strategy_type),
          },
          {
            label: "Geographic Coverage",
            value: fullStateName(recommendation.state),
          },
          {
            label: "Executive Priority Level",
            value: fullPriority(recommendation.priority),
          },
          {
            label: "Strategy Score Percentage",
            value: pct(recommendation.strategy_score),
          },
        ]}
        right={<Badge tone={tone(recommendation.priority)}>{fullPriority(recommendation.priority)}</Badge>}
      />
    </button>
  );
}

function PriorityCard({ item }) {
  return (
    <div className="strategy-priority-card">
      <ResponsiveRow
        title={fullPriority(item.priority)}
        subtitle="Executive priority distribution across active AI strategy recommendations."
        meta={[
          {
            label: "Recommendation Count",
            value: item.count || 0,
          },
          {
            label: "Average Strategy Score Percentage",
            value: pct(item.avg_score),
          },
          {
            label: "Top Strategy Score Percentage",
            value: pct(item.top_score),
          },
        ]}
        right={<Badge tone={tone(item.priority)}>{fullPriority(item.priority)}</Badge>}
      />
    </div>
  );
}

export default function StrategyRecommendationDashboard() {
  const [data, setData] = useState(fallbackStrategyData);
  const [activeRecommendationKey, setActiveRecommendationKey] = useState(
    fallbackStrategyData.recommendations[0]?.recommendation_key || null
  );
  const [loading, setLoading] = useState(true);
  const [seedLoading, setSeedLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function loadData() {
    setLoading(true);
    setMessage("");

    const result = await fetchStrategyDashboardData();
    setData(result);

    const recommendations = arr(result.recommendations);
    setActiveRecommendationKey((current) => {
      if (
        current &&
        recommendations.some((item) => String(item.recommendation_key || item.id) === String(current))
      ) {
        return current;
      }

      return recommendations[0]?.recommendation_key || recommendations[0]?.id || null;
    });

    setLoading(false);
  }

  async function handleSeed() {
    setSeedLoading(true);
    const result = await seedStrategyRecommendations();

    setMessage(
      result?.ok
        ? "AI Strategy Recommendation Engine seeded successfully."
        : "Seed endpoint unavailable. Fallback strategy intelligence remains active."
    );

    await loadData();
    setSeedLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const recommendations = arr(data.recommendations);
  const summary = data.summary || {};
  const byType = arr(data.by_type);
  const byState = arr(data.by_state);
  const byPriority = arr(data.by_priority);

  const activeRecommendation = useMemo(() => {
    return (
      recommendations.find(
        (item) => String(item.recommendation_key || item.id) === String(activeRecommendationKey)
      ) ||
      recommendations[0] ||
      null
    );
  }, [recommendations, activeRecommendationKey]);

  return (
    <PageShell
      eyebrow="Build 2C · AI Strategy Recommendation Engine"
      title="AI Strategy Recommendation Engine"
      description="Enterprise strategy command layer for fully explained strategy types, state strategy heat, recommendation confidence, strategic impact, feasibility, urgency, and execution risk."
      demo={String(data?.source || "").includes("fallback")}
      demoText="Fallback strategy intelligence is active while the live API is unavailable."
    >
      <style>{`
        .strategy-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .strategy-toolbar-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .strategy-layout {
          display: grid;
          grid-template-columns: minmax(470px, 1fr) minmax(0, 1.45fr);
          gap: 22px;
          align-items: start;
        }

        .strategy-type-grid,
        .strategy-state-grid,
        .strategy-priority-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .strategy-score-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
        }

        .strategy-rec-row,
        .strategy-type-card,
        .strategy-state-card,
        .strategy-priority-card,
        .strategy-percent-card,
        .strategy-action-panel {
          border: 1px solid var(--vs-exec-border, var(--vs-border));
          border-radius: 18px;
          background: rgba(15, 23, 42, 0.52);
          min-width: 0;
        }

        .strategy-rec-row {
          width: 100%;
          padding: 15px;
          text-align: left;
          color: inherit;
          cursor: pointer;
        }

        .strategy-rec-row:hover,
        .strategy-rec-row.is-active {
          border-color: rgba(251, 146, 60, 0.46);
          background: rgba(251, 146, 60, 0.08);
        }

        .strategy-type-card,
        .strategy-state-card,
        .strategy-priority-card {
          padding: 15px;
        }

        .strategy-rec-row .vs-responsive-meta,
        .strategy-type-card .vs-responsive-meta,
        .strategy-state-card .vs-responsive-meta,
        .strategy-priority-card .vs-responsive-meta {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px 18px;
        }

        .strategy-main-panel {
          border: 1px solid rgba(251, 146, 60, 0.30);
          border-radius: 24px;
          background:
            radial-gradient(circle at top right, rgba(251, 146, 60, 0.14), transparent 36%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.72), rgba(2, 6, 23, 0.55));
          padding: 20px;
        }

        .strategy-main-panel h3 {
          margin: 8px 0 10px;
          font-size: 24px;
          line-height: 1.24;
          color: var(--vs-text);
        }

        .strategy-main-meta {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 12px;
        }

        .strategy-percent-card {
          padding: 18px;
          display: grid;
          gap: 10px;
          min-height: 132px;
        }

        .strategy-percent-head {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 14px;
          align-items: start;
        }

        .strategy-percent-head span {
          color: var(--vs-text-muted);
          font-size: 10px;
          font-weight: 950;
          text-transform: uppercase;
          letter-spacing: 0.09em;
          line-height: 1.45;
          white-space: normal;
          overflow-wrap: anywhere;
        }

        .strategy-percent-head strong {
          color: var(--vs-text);
          font-size: 24px;
          font-weight: 950;
          white-space: nowrap;
        }

        .strategy-percent-card p {
          margin: 0;
          color: var(--vs-text-muted);
          font-size: 12px;
          line-height: 1.55;
        }

        .strategy-percent-bar {
          height: 8px;
          border-radius: 999px;
          background: rgba(148, 163, 184, 0.16);
          overflow: hidden;
        }

        .strategy-percent-bar i {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #fb923c, #22c55e);
        }

        .strategy-percent-bar.inverse i {
          background: linear-gradient(90deg, #f59e0b, #ef4444);
        }

        .strategy-action-panel {
          padding: 16px;
        }

        .strategy-action-panel strong {
          color: var(--vs-text);
          font-size: 15px;
        }

        .strategy-action-panel p {
          margin: 8px 0 0;
          color: var(--vs-text-muted);
          line-height: 1.6;
        }

        @media (max-width: 1280px) {
          .strategy-layout {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 900px) {
          .strategy-type-grid,
          .strategy-state-grid,
          .strategy-priority-grid,
          .strategy-score-grid,
          .strategy-rec-row .vs-responsive-meta,
          .strategy-type-card .vs-responsive-meta,
          .strategy-state-card .vs-responsive-meta,
          .strategy-priority-card .vs-responsive-meta {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="strategy-toolbar">
        <div className="vs-chip-row">
          <Badge tone={String(data?.source || "").includes("fallback") ? "warning" : "active"}>
            {String(data?.source || "").includes("fallback")
              ? "Fallback Strategy Intelligence"
              : "Live Strategy Recommendation API"}
          </Badge>
          <Badge tone="accent">Executive Strategy Layer</Badge>
          <Badge tone="info">No Abbreviations</Badge>
        </div>

        <div className="strategy-toolbar-actions">
          <button type="button" className="vs-button vs-button-secondary" onClick={loadData} disabled={loading}>
            {loading ? "Refreshing Strategy Intelligence..." : "Refresh Strategy Intelligence"}
          </button>

          <button type="button" className="vs-button vs-button-primary" onClick={handleSeed} disabled={seedLoading}>
            {seedLoading ? "Seeding Strategy Intelligence..." : "Seed Strategy Intelligence"}
          </button>

          <Link className="vs-button vs-button-secondary" to="/command-center">
            Open Command Center
          </Link>

          <Link className="vs-button vs-button-secondary" to="/executive-decision-intelligence">
            Open Decision Intelligence
          </Link>
        </div>
      </div>

      {message ? <div className="vs-banner">{message}</div> : null}

      <div className="vs-grid-4">
        <StatCard
          label="Total Strategy Recommendations"
          value={summary.total_recommendations || recommendations.length || 0}
          subtext="Active AI-generated strategy recommendations"
        />
        <StatCard
          label="High Priority Strategy Recommendations"
          value={(summary.critical_recommendations || 0) + (summary.high_recommendations || 0)}
          subtext="Critical and high executive priority strategies"
        />
        <StatCard
          label="Average Strategy Score Percentage"
          value={pct(summary.avg_strategy_score)}
          subtext="Average score across all active strategy recommendations"
        />
        <StatCard
          label="Highest Strategy Score Percentage"
          value={pct(summary.top_strategy_score)}
          subtext={`${summary.states_covered || byState.length || 0} states with strategy coverage`}
        />
      </div>

      <div className="strategy-layout">
        <SectionCard
          title="AI Strategy Recommendation Queue"
          subtitle="Fully explained AI strategy recommendations with no internal strategy abbreviations."
          right={<Badge tone="info">{recommendations.length} Active Recommendations</Badge>}
        >
          {loading ? (
            <EmptyState text="Loading AI Strategy Recommendations..." />
          ) : recommendations.length ? (
            <div className="vs-stack">
              {recommendations.map((recommendation) => (
                <RecommendationRow
                  key={recommendation.recommendation_key || recommendation.id || recommendation.title}
                  recommendation={recommendation}
                  active={
                    String(activeRecommendation?.recommendation_key || activeRecommendation?.id) ===
                    String(recommendation.recommendation_key || recommendation.id)
                  }
                  onClick={() =>
                    setActiveRecommendationKey(recommendation.recommendation_key || recommendation.id)
                  }
                />
              ))}
            </div>
          ) : (
            <EmptyState text="No AI strategy recommendations are currently available." />
          )}
        </SectionCard>

        <div className="vs-stack">
          <SectionCard
            title="Executive Strategy Recommendation"
            subtitle="Selected strategy recommendation with full labels, full state names, and full percentage scoring."
            right={<Badge tone={tone(activeRecommendation?.priority)}>{fullPriority(activeRecommendation?.priority)}</Badge>}
          >
            {activeRecommendation ? (
              <div className="vs-stack">
                <div className="strategy-main-panel">
                  <div className="vs-page-eyebrow">Recommended Executive Strategy</div>
                  <h3>{activeRecommendation.recommended_action || activeRecommendation.title}</h3>
                  <p className="vs-page-subtitle" style={{ margin: 0 }}>
                    {activeRecommendation.rationale ||
                      activeRecommendation.summary ||
                      "No executive rationale is currently available for this strategy."}
                  </p>

                  <div className="strategy-main-meta">
                    <Badge tone="accent">{fullStrategyType(activeRecommendation.strategy_type)}</Badge>
                    <Badge tone="info">{fullStateName(activeRecommendation.state)}</Badge>
                    <Badge tone={tone(activeRecommendation.priority)}>
                      {fullPriority(activeRecommendation.priority)}
                    </Badge>
                    <Badge tone="active">Owner: {activeRecommendation.owner_role || "Strategy Lead"}</Badge>
                    <Badge tone="info">Time Horizon: {activeRecommendation.time_horizon || "7 Days"}</Badge>
                  </div>
                </div>

                <div className="strategy-score-grid">
                  <PercentCard
                    title="Strategy Score Percentage"
                    value={activeRecommendation.strategy_score}
                    subtitle="Overall ranking score for this AI strategy recommendation."
                  />
                  <PercentCard
                    title="Recommendation Confidence Percentage"
                    value={activeRecommendation.confidence_score}
                    subtitle="Reliability level of the AI recommendation."
                  />
                  <PercentCard
                    title="Estimated Strategic Impact Percentage"
                    value={activeRecommendation.impact_score}
                    subtitle="Projected strategic value if this recommendation is executed."
                  />
                  <PercentCard
                    title="Executive Urgency Percentage"
                    value={activeRecommendation.urgency_score}
                    subtitle="How quickly leadership should act on this strategy."
                  />
                  <PercentCard
                    title="Execution Feasibility Percentage"
                    value={activeRecommendation.feasibility_score}
                    subtitle="Operational feasibility of executing this strategy."
                  />
                  <PercentCard
                    title="Strategic Risk Percentage"
                    value={activeRecommendation.risk_score}
                    subtitle="Downside exposure associated with this strategy."
                    inverse
                  />
                </div>
              </div>
            ) : (
              <EmptyState text="No AI strategy recommendation is currently selected." />
            )}
          </SectionCard>

          <SectionCard
            title="National Strategy Types"
            subtitle="Every strategy type is fully spelled out as an executive strategy category."
            right={<Badge tone="accent">{byType.length} Strategy Types</Badge>}
          >
            {byType.length ? (
              <div className="strategy-type-grid">
                {byType.map((item) => (
                  <StrategyTypeCard key={item.strategy_type} item={item} />
                ))}
              </div>
            ) : (
              <EmptyState text="No national strategy type distribution is currently available." />
            )}
          </SectionCard>

          <SectionCard
            title="State Strategy Heat"
            subtitle="State strategy heat with full state names and fully labeled strategy heat percentages."
            right={<Badge tone="info">{byState.length} States Covered</Badge>}
          >
            {byState.length ? (
              <div className="strategy-state-grid">
                {byState.map((item) => (
                  <StateHeatCard key={item.state} item={item} />
                ))}
              </div>
            ) : (
              <EmptyState text="No state strategy heat data is currently available." />
            )}
          </SectionCard>

          <SectionCard
            title="Executive Priority Distribution"
            subtitle="Priority distribution with complete executive labels."
            right={<Badge tone="accent">{byPriority.length} Priority Levels</Badge>}
          >
            {byPriority.length ? (
              <div className="strategy-priority-grid">
                {byPriority.map((item) => (
                  <PriorityCard key={item.priority} item={item} />
                ))}
              </div>
            ) : (
              <EmptyState text="No executive priority distribution is currently available." />
            )}
          </SectionCard>

          <SectionCard
            title="Command Center Conversion Guidance"
            subtitle="Execution guidance for converting the selected strategy recommendation into operational work."
          >
            {activeRecommendation ? (
              <div className="strategy-action-panel">
                <strong>
                  Convert {fullStrategyType(activeRecommendation.strategy_type)} for{" "}
                  {fullStateName(activeRecommendation.state)}
                </strong>
                <p>
                  Recommended owner: {activeRecommendation.owner_role || "Strategy Lead"}. Recommended execution window:{" "}
                  {activeRecommendation.time_horizon || "7 Days"}. This recommendation should be reviewed against
                  Command Center capacity before operational conversion.
                </p>
                <div className="strategy-main-meta">
                  <Link className="vs-button vs-button-secondary" to="/command-center">
                    Open Command Center
                  </Link>
                  <Link className="vs-button vs-button-secondary" to="/autonomous-campaign-operations">
                    Open Autonomous Campaign Operations
                  </Link>
                </div>
              </div>
            ) : (
              <EmptyState text="Select a strategy recommendation to view conversion guidance." />
            )}
          </SectionCard>
        </div>
      </div>
    </PageShell>
  );
}
