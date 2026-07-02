import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchCampaignSimulations,
  seedCampaignSimulation,
  runCampaignSimulation,
} from "../api/campaignSimulationApi";

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
  if (["active", "stable", "complete", "completed"].includes(next)) return "active";
  return "info";
}

function ScoreCard({ title, value, subtitle, inverse = false }) {
  const width = Math.max(0, Math.min(100, number(value)));

  return (
    <div className="sim-score-card">
      <div className="sim-score-head">
        <span>{title}</span>
        <strong>{pct(value)}</strong>
      </div>
      <p>{subtitle}</p>
      <div className={inverse ? "sim-score-bar inverse" : "sim-score-bar"}>
        <i style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function SimulationRow({ simulation, active, onClick }) {
  return (
    <button
      type="button"
      className={active ? "sim-row is-active" : "sim-row"}
      onClick={onClick}
    >
      <ResponsiveRow
        title={simulation.title}
        subtitle={simulation.recommendation || "Simulation requires executive review."}
        meta={[
          { label: "Simulation Category", value: labelize(simulation.simulation_type) },
          { label: "Geographic Coverage", value: simulation.state_code || "National Coverage" },
          { label: "Baseline Win Probability Percentage", value: pct(simulation.baseline_win_probability) },
          { label: "Simulated Win Probability Percentage", value: pct(simulation.simulated_win_probability) },
        ]}
      />
    </button>
  );
}

function SignalRow({ signal }) {
  return (
    <div className="sim-panel-row">
      <ResponsiveRow
        title={signal.title}
        subtitle={signal.description}
        meta={[
          { label: "Intelligence Source", value: signal.source_module || "Predictive Campaign Simulation Engine" },
          { label: "Geographic Coverage", value: signal.state_code || "National Coverage" },
          { label: "Executive Alert Level", value: labelize(signal.severity || "Monitoring") },
        ]}
        alert={String(signal.severity || "").toLowerCase() === "high" ? "vs-live-dot" : "vs-live-dot-warning"}
      />
    </div>
  );
}

function OutcomeRow({ outcome }) {
  return (
    <div className="sim-panel-row">
      <ResponsiveRow
        title={outcome.outcome_label || "Simulation Outcome"}
        subtitle={outcome.narrative || "Outcome narrative unavailable."}
        meta={[
          { label: "Win Probability Percentage", value: pct(outcome.win_probability) },
          { label: "Turnout Change Percentage", value: pct(outcome.turnout_change_percentage) },
          { label: "Funding Change Percentage", value: pct(outcome.funding_change_percentage) },
          { label: "Coalition Change Percentage", value: pct(outcome.coalition_change_percentage) },
          { label: "Risk Percentage", value: pct(outcome.risk_percentage) },
        ]}
      />
    </div>
  );
}

function ActionRow({ action }) {
  return (
    <div className="sim-action-row">
      <div>
        <strong>{action.action_label || "Executive action"}</strong>
        <p>{action.owner || "Executive Operations"} · {action.due_window || "72 hours"}</p>
      </div>
      <Badge tone={tone(action.status)}>{labelize(action.status || "pending")}</Badge>
    </div>
  );
}

export default function PredictiveCampaignSimulation() {
  const [data, setData] = useState(null);
  const [activeSimulationId, setActiveSimulationId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [seedLoading, setSeedLoading] = useState(false);
  const [runLoading, setRunLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function loadData() {
    setLoading(true);
    setMessage("");

    const result = await fetchCampaignSimulations(1);
    setData(result);

    const simulations = arr(result.simulations);
    setActiveSimulationId((current) => {
      if (current && simulations.some((item) => String(item.id) === String(current))) return current;
      return simulations[0]?.id || null;
    });

    setLoading(false);
  }

  async function handleSeed() {
    setSeedLoading(true);
    const result = await seedCampaignSimulation(1);
    setMessage(result?.ok ? "Predictive simulations seeded successfully." : "Seed endpoint unavailable. Fallback simulations remain active.");
    await loadData();
    setSeedLoading(false);
  }

  async function handleRunSimulation() {
    setRunLoading(true);

    const result = await runCampaignSimulation(
      {
        title: "Executive What-If Campaign Simulation",
        simulation_type: "executive_what_if",
        state_code: "National Coverage",
        scenario_label: "Executive What-If Scenario",
        baseline_win_probability: 50,
        turnout_lift_percentage: 5,
        funding_impact_percentage: 6,
        coalition_movement_percentage: 4,
        vendor_execution_readiness: 76,
        risk_percentage: 34,
      },
      1
    );

    setMessage(result?.ok ? "Executive what-if simulation created." : "Simulation engine unavailable. Fallback data remains active.");
    await loadData();
    setRunLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const simulations = arr(data?.simulations);
  const signals = arr(data?.signals);
  const summary = data?.summary || {};

  const activeSimulation = useMemo(() => {
    return simulations.find((item) => String(item.id) === String(activeSimulationId)) || simulations[0] || null;
  }, [simulations, activeSimulationId]);

  return (
    <PageShell
      eyebrow="Build 2E · Predictive Campaign Simulation"
      title="Predictive Campaign Simulation"
      description="Executive simulation engine for modeling turnout, funding, coalition movement, vendor readiness, risk exposure, and projected win probability."
      demo={String(data?.source || "").includes("fallback")}
      demoText="Fallback simulation intelligence is active while the live API is unavailable."
    >
      <style>{`
        .sim-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .sim-toolbar-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .sim-layout {
          display: grid;
          grid-template-columns: minmax(420px, 1fr) minmax(0, 1.45fr);
          gap: 22px;
          align-items: start;
        }

        .sim-row,
        .sim-panel-row,
        .sim-action-row,
        .sim-score-card {
          border: 1px solid var(--vs-exec-border, var(--vs-border));
          border-radius: 18px;
          background: rgba(15, 23, 42, 0.52);
          min-width: 0;
        }

        .sim-row {
          width: 100%;
          padding: 15px;
          text-align: left;
          color: inherit;
          cursor: pointer;
        }

        .sim-row:hover,
        .sim-row.is-active {
          border-color: rgba(251, 146, 60, 0.46);
          background: rgba(251, 146, 60, 0.08);
        }

        .sim-row .vs-responsive-meta,
        .sim-panel-row .vs-responsive-meta {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px 18px;
        }

        .sim-recommendation {
          border: 1px solid rgba(251, 146, 60, 0.30);
          border-radius: 24px;
          background:
            radial-gradient(circle at top right, rgba(251, 146, 60, 0.14), transparent 36%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.72), rgba(2, 6, 23, 0.55));
          padding: 20px;
        }

        .sim-recommendation h3 {
          margin: 8px 0 10px;
          font-size: 22px;
          line-height: 1.28;
          color: var(--vs-text);
        }

        .sim-score-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }

        .sim-score-card {
          padding: 16px;
          display: grid;
          gap: 8px;
        }

        .sim-score-head {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: flex-start;
        }

        .sim-score-head span {
          color: var(--vs-text-muted);
          font-size: 10px;
          font-weight: 950;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          line-height: 1.4;
        }

        .sim-score-head strong {
          color: var(--vs-text);
          font-size: 28px;
          font-weight: 950;
          white-space: nowrap;
        }

        .sim-score-card p {
          margin: 0;
          color: var(--vs-text-muted);
          font-size: 11px;
          line-height: 1.5;
        }

        .sim-score-bar {
          height: 8px;
          border-radius: 999px;
          background: rgba(148, 163, 184, 0.16);
          overflow: hidden;
        }

        .sim-score-bar i {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #fb923c, #22c55e);
        }

        .sim-score-bar.inverse i {
          background: linear-gradient(90deg, #f59e0b, #ef4444);
        }

        .sim-panel-row {
          padding: 15px;
        }

        .sim-action-row {
          padding: 15px;
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: center;
        }

        .sim-action-row strong {
          color: var(--vs-text);
        }

        .sim-action-row p {
          margin: 5px 0 0;
          color: var(--vs-text-muted);
          font-size: 12px;
        }

        @media (max-width: 1280px) {
          .sim-layout {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 900px) {
          .sim-score-grid,
          .sim-row .vs-responsive-meta,
          .sim-panel-row .vs-responsive-meta {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="sim-toolbar">
        <div className="vs-chip-row">
          <Badge tone={String(data?.source || "").includes("fallback") ? "warning" : "active"}>
            {String(data?.source || "").includes("fallback") ? "Fallback Simulation Intelligence" : "Live Predictive Simulation API"}
          </Badge>
          <Badge tone="accent">Executive Simulation Layer</Badge>
          <Badge tone="info">What-If Campaign Modeling</Badge>
        </div>

        <div className="sim-toolbar-actions">
          <button type="button" className="vs-button vs-button-secondary" onClick={loadData} disabled={loading}>
            {loading ? "Refreshing Simulations..." : "Refresh Simulations"}
          </button>
          <button type="button" className="vs-button vs-button-primary" onClick={handleSeed} disabled={seedLoading}>
            {seedLoading ? "Seeding Simulations..." : "Seed Simulations"}
          </button>
          <button type="button" className="vs-button vs-button-secondary" onClick={handleRunSimulation} disabled={runLoading}>
            {runLoading ? "Running Simulation..." : "Run What-If Simulation"}
          </button>
          <Link className="vs-button vs-button-secondary" to="/executive-decision-intelligence">
            Open Decision Intelligence
          </Link>
          <Link className="vs-button vs-button-secondary" to="/command-center">
            Open Command Center
          </Link>
        </div>
      </div>

      {message ? <div className="vs-banner">{message}</div> : null}

      <div className="vs-grid-4">
        <StatCard label="Active Predictive Simulations" value={summary.activeSimulations || simulations.length || 0} subtext="Executive campaign scenarios currently modeled" />
        <StatCard label="Average Simulated Win Probability Percentage" value={pct(summary.averageWinProbability)} subtext="Average win probability across active scenarios" />
        <StatCard label="Average Turnout Lift Percentage" value={pct(summary.averageTurnoutLift)} subtext="Average turnout movement across simulations" />
        <StatCard label="Average Execution Readiness Percentage" value={pct(summary.averageExecutionReadiness)} subtext="Average vendor and operations readiness" />
      </div>

      <div className="sim-layout">
        <SectionCard
          title="Predictive Campaign Simulation Queue"
          subtitle="Executive simulations modeling turnout, funding, coalition movement, vendor execution readiness, and win probability."
          right={<Badge tone="info">{simulations.length} Active Simulations</Badge>}
        >
          {loading ? (
            <EmptyState text="Loading Predictive Campaign Simulations..." />
          ) : simulations.length ? (
            <div className="vs-stack">
              {simulations.map((simulation) => (
                <SimulationRow
                  key={simulation.id || simulation.title}
                  simulation={simulation}
                  active={String(activeSimulation?.id) === String(simulation.id)}
                  onClick={() => setActiveSimulationId(simulation.id)}
                />
              ))}
            </div>
          ) : (
            <EmptyState text="No predictive campaign simulations are currently available." />
          )}
        </SectionCard>

        <div className="vs-stack">
          <SectionCard
            title="Executive Simulation Recommendation"
            subtitle="Primary recommended campaign path with full probability and percentage scoring."
            right={<Badge tone={tone(activeSimulation?.status)}>{labelize(activeSimulation?.status || "active")}</Badge>}
          >
            {activeSimulation ? (
              <div className="vs-stack">
                <div className="sim-recommendation">
                  <div className="vs-page-eyebrow">Recommended Simulation Path</div>
                  <h3>{activeSimulation.recommendation || activeSimulation.title}</h3>
                  <p className="vs-page-subtitle" style={{ margin: 0 }}>
                    {activeSimulation.scenario_label || "Executive campaign simulation scenario."}
                  </p>
                </div>

                <div className="sim-score-grid">
                  <ScoreCard title="Baseline Win Probability Percentage" value={activeSimulation.baseline_win_probability} subtitle="Starting probability before simulated changes." />
                  <ScoreCard title="Simulated Win Probability Percentage" value={activeSimulation.simulated_win_probability} subtitle="Projected probability after scenario effects." />
                  <ScoreCard title="Recommendation Confidence Percentage" value={activeSimulation.confidence_percentage} subtitle="Reliability level for this simulation result." />
                  <ScoreCard title="Turnout Lift Percentage" value={activeSimulation.turnout_lift_percentage} subtitle="Projected turnout movement." />
                  <ScoreCard title="Funding Impact Percentage" value={activeSimulation.funding_impact_percentage} subtitle="Projected funding effect." />
                  <ScoreCard title="Operational Risk Percentage" value={activeSimulation.risk_percentage} subtitle="Downside risk or execution exposure." inverse />
                </div>
              </div>
            ) : (
              <EmptyState text="No predictive simulation is currently selected." />
            )}
          </SectionCard>

          <SectionCard
            title="Simulation Outcome Cases"
            subtitle="Expected, optimistic, downside, and recovery cases for the selected simulation."
            right={<Badge tone="accent">{arr(activeSimulation?.outcomes).length} Outcome Cases</Badge>}
          >
            {arr(activeSimulation?.outcomes).length ? (
              <div className="vs-stack">
                {arr(activeSimulation.outcomes).map((outcome) => (
                  <OutcomeRow key={outcome.id || outcome.outcome_label} outcome={outcome} />
                ))}
              </div>
            ) : (
              <EmptyState text="No simulation outcome cases are currently available for this scenario." />
            )}
          </SectionCard>

          <SectionCard
            title="Simulation Execution Actions"
            subtitle="Operational follow-through connected to the selected predictive simulation."
            right={<Badge tone="info">{arr(activeSimulation?.actions).length} Execution Actions</Badge>}
          >
            {arr(activeSimulation?.actions).length ? (
              <div className="vs-stack">
                {arr(activeSimulation.actions).map((action) => (
                  <ActionRow key={action.id || action.action_label} action={action} />
                ))}
              </div>
            ) : (
              <EmptyState text="No execution actions are currently attached to this simulation." />
            )}
          </SectionCard>

          <SectionCard
            title="Live Predictive Simulation Signals"
            subtitle="Live intelligence signals driving the campaign simulation layer."
            right={<Badge tone="accent">{signals.length} Live Simulation Signals</Badge>}
          >
            {signals.length ? (
              <div className="vs-stack">
                {signals.map((signal) => (
                  <SignalRow key={signal.id || signal.title} signal={signal} />
                ))}
              </div>
            ) : (
              <EmptyState text="No live predictive simulation signals are currently available." />
            )}
          </SectionCard>
        </div>
      </div>
    </PageShell>
  );
}