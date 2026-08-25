import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchNationalDigitalTwin,
  seedNationalDigitalTwin,
} from "../api/nationalDigitalTwinApi";

import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import ResponsiveRow from "../components/ui/ResponsiveRow";

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

function tone(value = "") {
  const next = String(value || "").toLowerCase();
  if (["critical", "high"].includes(next)) return "danger";
  if (["medium", "monitoring", "watch"].includes(next)) return "accent";
  if (["active", "stable", "open"].includes(next)) return "active";
  return "info";
}

function MetricBar({ title, value, inverse = false }) {
  const width = Math.max(0, Math.min(100, number(value)));

  return (
    <div className="twin-metric">
      <div className="twin-metric-head">
        <span>{title}</span>
        <strong>{pct(value)}</strong>
      </div>
      <div className={inverse ? "twin-bar inverse" : "twin-bar"}>
        <i style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function StateCard({ state, active, onClick }) {
  return (
    <button
      type="button"
      className={active ? "twin-state-card is-active" : "twin-state-card"}
      onClick={onClick}
    >
      <ResponsiveRow
        title={state.state_name || "State"}
        subtitle={state.recommendation || "State-level digital twin recommendation unavailable."}
        meta={[
          { label: "Executive Readiness Percentage", value: pct(state.executive_readiness_percentage) },
          { label: "Win Probability Percentage", value: pct(state.win_probability_percentage) },
          { label: "National Risk Percentage", value: pct(state.risk_percentage) },
          { label: "Executive Alert Level", value: labelize(state.alert_level || "monitoring") },
        ]}
      />
    </button>
  );
}

function SignalCard({ signal }) {
  return (
    <div className="twin-panel-row">
      <ResponsiveRow
        title={signal.title}
        subtitle={signal.description}
        meta={[
          { label: "Intelligence Source", value: signal.source_module || "National Political Digital Twin" },
          { label: "Geographic Coverage", value: signal.state_name || "National Coverage" },
          { label: "Executive Alert Level", value: labelize(signal.severity || "monitoring") },
        ]}
        alert={String(signal.severity || "").toLowerCase() === "high" ? "vs-live-dot" : "vs-live-dot-warning"}
      />
    </div>
  );
}

function TimelineCard({ item }) {
  return (
    <div className="twin-timeline-row">
      <span className="twin-dot" />
      <ResponsiveRow
        title={item.event_title}
        subtitle={item.event_description}
        meta={[
          { label: "Event Type", value: labelize(item.event_type || "intelligence update") },
          { label: "Geographic Coverage", value: item.state_name || "National Coverage" },
          { label: "Impact Percentage", value: pct(item.impact_percentage) },
        ]}
      />
    </div>
  );
}

function RecommendationCard({ item }) {
  return (
    <div className="twin-panel-row">
      <ResponsiveRow
        title={item.title}
        subtitle={item.recommendation}
        meta={[
          { label: "Recommendation Confidence Percentage", value: pct(item.confidence_percentage) },
          { label: "Strategic Impact Percentage", value: pct(item.impact_percentage) },
          { label: "Operational Risk Percentage", value: pct(item.risk_percentage) },
          { label: "Executive Priority", value: labelize(item.priority || "medium") },
        ]}
        right={<Badge tone={tone(item.priority)}>{labelize(item.priority || "medium")}</Badge>}
      />
      <div className="twin-source-row">
        {arr(item.source_modules).map((source) => (
          <Badge key={source} tone="accent">{source}</Badge>
        ))}
      </div>
    </div>
  );
}

export default function NationalPoliticalDigitalTwin() {
  const [data, setData] = useState(null);
  const [activeStateCode, setActiveStateCode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [seedLoading, setSeedLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function loadData() {
    setLoading(true);
    setMessage("");

    const result = await fetchNationalDigitalTwin(1);
    setData(result);

    const states = arr(result.states);
    setActiveStateCode((current) => {
      if (current && states.some((item) => item.state_code === current)) return current;
      return states[0]?.state_code || null;
    });

    setLoading(false);
  }

  async function handleSeed() {
    setSeedLoading(true);
    const result = await seedNationalDigitalTwin(1);
    setMessage(result?.ok ? "National Political Digital Twin seeded successfully." : "Seed endpoint unavailable. Fallback model remains active.");
    await loadData();
    setSeedLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const states = arr(data?.states);
  const signals = arr(data?.signals);
  const timeline = arr(data?.timeline);
  const recommendations = arr(data?.recommendations);
  const summary = data?.summary || {};

  const activeState = useMemo(() => {
    return states.find((item) => item.state_code === activeStateCode) || states[0] || null;
  }, [states, activeStateCode]);

  return (
    <PageShell
      eyebrow="National Political Digital Twin"
      title="National Political Digital Twin"
      description="A unified national model connecting forecast, influence, coalition, strategy, decision intelligence, predictive simulation, operations, vendors, donors, candidates, political graph, and state operations."
      demo={String(data?.source || "").includes("fallback")}
      demoText="Fallback national digital twin intelligence is active while the live API is unavailable."
    >
      <style>{`
        .twin-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .twin-toolbar-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .twin-layout {
          display: grid;
          grid-template-columns: minmax(460px, 1fr) minmax(0, 1.45fr);
          gap: 22px;
          align-items: start;
        }

        .twin-state-card,
        .twin-panel-row,
        .twin-metric,
        .twin-timeline-row {
          border: 1px solid var(--vs-exec-border, var(--vs-border));
          border-radius: 18px;
          background: rgba(15, 23, 42, 0.52);
          min-width: 0;
        }

        .twin-state-card {
          width: 100%;
          padding: 15px;
          text-align: left;
          color: inherit;
          cursor: pointer;
        }

        .twin-state-card:hover,
        .twin-state-card.is-active {
          border-color: rgba(251, 146, 60, 0.46);
          background: rgba(251, 146, 60, 0.08);
        }

        .twin-state-card .vs-responsive-meta,
        .twin-panel-row .vs-responsive-meta,
        .twin-timeline-row .vs-responsive-meta {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px 18px;
        }

        .twin-command-panel {
          border: 1px solid rgba(251, 146, 60, 0.30);
          border-radius: 24px;
          background:
            radial-gradient(circle at top right, rgba(251, 146, 60, 0.14), transparent 36%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.72), rgba(2, 6, 23, 0.55));
          padding: 20px;
        }

        .twin-command-panel h3 {
          margin: 8px 0 10px;
          font-size: 24px;
          line-height: 1.24;
          color: var(--vs-text);
        }

        .twin-score-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }

        .twin-metric {
          padding: 16px;
          display: grid;
          gap: 10px;
        }

        .twin-metric-head {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: flex-start;
        }

        .twin-metric-head span {
          color: var(--vs-text-muted);
          font-size: 10px;
          font-weight: 950;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          line-height: 1.4;
        }

        .twin-metric-head strong {
          color: var(--vs-text);
          font-size: 28px;
          font-weight: 950;
          white-space: nowrap;
        }

        .twin-bar {
          height: 8px;
          border-radius: 999px;
          background: rgba(148, 163, 184, 0.16);
          overflow: hidden;
        }

        .twin-bar i {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #fb923c, #22c55e);
        }

        .twin-bar.inverse i {
          background: linear-gradient(90deg, #f59e0b, #ef4444);
        }

        .twin-panel-row {
          padding: 15px;
        }

        .twin-source-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 12px;
        }

        .twin-timeline-row {
          display: grid;
          grid-template-columns: 14px minmax(0, 1fr);
          gap: 12px;
          padding: 15px;
        }

        .twin-dot {
          width: 10px;
          height: 10px;
          margin-top: 4px;
          border-radius: 999px;
          background: var(--vs-brand-orange, #fb923c);
          box-shadow: 0 0 16px rgba(251, 146, 60, 0.65);
        }

        @media (max-width: 1280px) {
          .twin-layout {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 900px) {
          .twin-score-grid,
          .twin-state-card .vs-responsive-meta,
          .twin-panel-row .vs-responsive-meta,
          .twin-timeline-row .vs-responsive-meta {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="twin-toolbar">
        <div className="vs-chip-row">
          <Badge tone={String(data?.source || "").includes("fallback") ? "warning" : "active"}>
            {String(data?.source || "").includes("fallback") ? "Fallback National Twin" : "Live National Twin API"}
          </Badge>
          <Badge tone="accent">National Executive Model</Badge>
          <Badge tone="info">Cross-Module Intelligence Fusion</Badge>
        </div>

        <div className="twin-toolbar-actions">
          <button type="button" className="vs-button vs-button-secondary" onClick={loadData} disabled={loading}>
            {loading ? "Refreshing National Twin..." : "Refresh National Twin"}
          </button>
          <button type="button" className="vs-button vs-button-primary" onClick={handleSeed} disabled={seedLoading}>
            {seedLoading ? "Seeding National Twin..." : "Seed National Twin"}
          </button>
          <Link className="vs-button vs-button-secondary" to="/executive-decision-intelligence">
            Decision Intelligence
          </Link>
          <Link className="vs-button vs-button-secondary" to="/predictive-campaign-simulation">
            Predictive Simulation
          </Link>
          <Link className="vs-button vs-button-secondary" to="/command-center">
            Command Center
          </Link>
        </div>
      </div>

      {message ? <div className="vs-banner">{message}</div> : null}

      <div className="vs-grid-4">
        <StatCard label="National Executive Readiness Percentage" value={pct(summary.nationalReadinessPercentage)} subtext="Average readiness across the national digital twin" />
        <StatCard label="Average Win Probability Percentage" value={pct(summary.averageWinProbabilityPercentage)} subtext="Average modeled probability across active states" />
        <StatCard label="National Risk Percentage" value={pct(summary.nationalRiskPercentage)} subtext="Average national operational and strategic risk" />
        <StatCard label="High Alert State Count" value={summary.highAlertStateCount || 0} subtext={`${summary.liveSignalCount || signals.length || 0} live intelligence signals`} />
      </div>

      <div className="twin-layout">
        <SectionCard
          title="National State Digital Twin"
          subtitle="State-level executive readiness, forecast probability, coalition strength, influence momentum, operational capacity, and risk."
          right={<Badge tone="info">{states.length} Modeled States</Badge>}
        >
          {loading ? (
            <EmptyState text="Loading National Political Digital Twin..." />
          ) : states.length ? (
            <div className="vs-stack">
              {states.map((state) => (
                <StateCard
                  key={state.id || state.state_code}
                  state={state}
                  active={activeState?.state_code === state.state_code}
                  onClick={() => setActiveStateCode(state.state_code)}
                />
              ))}
            </div>
          ) : (
            <EmptyState text="No state-level digital twin intelligence is currently available." />
          )}
        </SectionCard>

        <div className="vs-stack">
          <SectionCard
            title="Executive Digital Twin Command View"
            subtitle="Selected state command view with full percentage scoring across the VoterSpheres intelligence stack."
            right={<Badge tone={tone(activeState?.alert_level)}>{labelize(activeState?.alert_level || "monitoring")}</Badge>}
          >
            {activeState ? (
              <div className="vs-stack">
                <div className="twin-command-panel">
                  <div className="vs-page-eyebrow">Selected State Digital Twin</div>
                  <h3>{activeState.state_name}</h3>
                  <p className="vs-page-subtitle" style={{ margin: 0 }}>
                    {activeState.recommendation || "No executive recommendation is currently available for this state."}
                  </p>
                </div>

                <div className="twin-score-grid">
                  <MetricBar title="Executive Readiness Percentage" value={activeState.executive_readiness_percentage} />
                  <MetricBar title="Win Probability Percentage" value={activeState.win_probability_percentage} />
                  <MetricBar title="Forecast Confidence Percentage" value={activeState.forecast_confidence_percentage} />
                  <MetricBar title="Coalition Strength Percentage" value={activeState.coalition_strength_percentage} />
                  <MetricBar title="Influence Momentum Percentage" value={activeState.influence_momentum_percentage} />
                  <MetricBar title="Operations Capacity Percentage" value={activeState.operations_capacity_percentage} />
                  <MetricBar title="Vendor Readiness Percentage" value={activeState.vendor_readiness_percentage} />
                  <MetricBar title="Fundraising Momentum Percentage" value={activeState.fundraising_momentum_percentage} />
                  <MetricBar title="Operational Risk Percentage" value={activeState.risk_percentage} inverse />
                </div>
              </div>
            ) : (
              <EmptyState text="No state is currently selected." />
            )}
          </SectionCard>

          <SectionCard
            title="Executive Digital Twin Recommendations"
            subtitle="AI-ranked recommendations created from the unified national political model."
            right={<Badge tone="accent">{recommendations.length} Recommendations</Badge>}
          >
            {recommendations.length ? (
              <div className="vs-stack">
                {recommendations.map((item) => (
                  <RecommendationCard key={item.id || item.title} item={item} />
                ))}
              </div>
            ) : (
              <EmptyState text="No digital twin recommendations are currently available." />
            )}
          </SectionCard>

          <SectionCard
            title="Live National Digital Twin Signals"
            subtitle="Live signals from forecast, influence, coalition, simulation, operations, vendor, donor, candidate, and political graph systems."
            right={<Badge tone="info">{signals.length} Live Signals</Badge>}
          >
            {signals.length ? (
              <div className="vs-stack">
                {signals.map((signal) => (
                  <SignalCard key={signal.id || signal.title} signal={signal} />
                ))}
              </div>
            ) : (
              <EmptyState text="No live national digital twin signals are currently available." />
            )}
          </SectionCard>

          <SectionCard
            title="Digital Twin Timeline"
            subtitle="Recent cross-module events absorbed into the national political model."
            right={<Badge tone="accent">{timeline.length} Timeline Events</Badge>}
          >
            {timeline.length ? (
              <div className="vs-stack">
                {timeline.map((item) => (
                  <TimelineCard key={item.id || item.event_title} item={item} />
                ))}
              </div>
            ) : (
              <EmptyState text="No digital twin timeline events are currently available." />
            )}
          </SectionCard>
        </div>
      </div>
    </PageShell>
  );
}
