import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchCampaignSimulations,
  seedCampaignSimulations,
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

function toneFromLevel(value = "") {
  const next = String(value || "").toLowerCase();
  if (["critical", "high", "active"].includes(next)) return "danger";
  if (["medium", "monitoring", "planning", "watch"].includes(next)) return "accent";
  if (["complete", "completed", "stable", "ready"].includes(next)) return "active";
  return "info";
}

function SimulationMetric({ title, value, subtitle, inverse = false }) {
  const width = Math.max(0, Math.min(100, Math.abs(number(value))));

  return (
    <div className="pcs-metric-card">
      <div className="pcs-metric-head">
        <span>{title}</span>
        <strong>{pct(value)}</strong>
      </div>
      <p>{subtitle}</p>
      <div className={inverse ? "pcs-meter inverse" : "pcs-meter"}>
        <span style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function SimulationTile({ simulation, active, onClick }) {
  return (
    <button
      type="button"
      className={active ? "pcs-simulation-tile is-active" : "pcs-simulation-tile"}
      onClick={onClick}
    >
      <ResponsiveRow
        title={simulation.title || "Predictive campaign simulation"}
        subtitle={simulation.recommendation || "Simulation recommendation requires executive review."}
        meta={[
          { label: "Simulation Category", value: labelize(simulation.simulation_type || "campaign simulation") },
          { label: "Geographic Coverage", value: simulation.state_code || "National Coverage" },
          { label: "Baseline Win Probability Percentage", value: pct(simulation.baseline_win_probability) },
          { label: "Simulated Win Probability Percentage", value: pct(simulation.simulated_win_probability) },
        ]}
      />
    </button>
  );
}

function ScenarioOutcome({ outcome }) {
  return (
    <div className="pcs-outcome-card">
      <ResponsiveRow
        title={outcome.outcome_label || "Simulation outcome"}
        subtitle={outcome.narrative || "Outcome narrative unavailable."}
        meta={[
          { label: "Win Probability Percentage", value: pct(outcome.win_probability) },
          { label: "Turnout Change Percentage", value: pct(outcome.turnout_change_percentage) },
          { label: "Funding Change Percentage", value: pct(outcome.funding_change_percentage) },
          { label: "Coalition Movement Percentage", value: pct(outcome.coalition_change_percentage) },
          { label: "Risk Percentage", value: pct(outcome.risk_percentage) },
        ]}
      />
    </div>
  );
}

function SimulationSignal({ signal }) {
  return (
    <div className="pcs-signal-card">
      <ResponsiveRow
        title={signal.title || "Predictive simulation signal"}
        subtitle={signal.description || "Signal description unavailable."}
        meta={[
          { label: "Intelligence Source", value: signal.source_module || "Predictive Campaign Simulation Engine" },
          { label: "Geographic Coverage", value: signal.state_code || "National Coverage" },
          { label: "Executive Alert Level", value: labelize(signal.severity || "monitoring") },
        ]}
        alert={String(signal.severity || "").toLowerCase() === "high" ? "vs-live-dot" : "vs-live-dot-warning"}
      />
    </div>
  );
}

function SimulationAction({ action }) {
  return (
    <div className="pcs-action-card">
      <div>
        <strong>{action.action_label || "Simulation action"}</strong>
        <p>{action.owner || "Executive Operations"} · {action.due_window || "72 hours"}</p>
      </div>
      <Badge tone={toneFromLevel(action.status || "pending")}>{labelize(action.status || "pending")}</Badge>
    </div>
  );
}

export default function PredictiveCampaignSimulation() {
  const [data, setData] = useState(null);
  const [activeSimulationId, setActiveSimulationId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [seedLoading, setSeedLoading] = useState(false);
  const [runLoading, setRunLoading] = useState(false);
  const [notice, setNotice] = useState("");

  async function loadData() {
    setLoading(true);
    setNotice("");

    const result = await fetchCampaignSimulations(1);
    setData(result);

    setActiveSimulationId((current) => {
      if (current && arr(result.simulations).some((item) => String(item.id) === String(current))) return current;
      return result.simulations?.[0]?.id || null;
    });

    setLoading(false);
  }

  async function handleSeed() {
    setSeedLoading(true);
    const result = await seedCampaignSimulations(1);
    setNotice(result?.ok ? "Predictive campaign simulations seeded successfully." : "Seed endpoint unavailable. Fallback simulations remain active.");
    await loadData();
    setSeedLoading(false);
  }

  async function handleRunSimulation() {
    setRunLoading(true);
    const result = await runCampaignSimulation(1, {
      title: "Executive What-If Campaign Simulation",
      simulation_type: "executive_what_if",
      state_code: "National Coverage",
    });
    setNotice(result?.ok ? "Executive simulation run completed." : "Simulation run endpoint unavailable. Existing scenarios remain active.");
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
      description="A VoterSpheres enterprise simulation module for modeling turnout movement, funding effects, coalition shifts, vendor execution readiness, operational risk, and projected win probability."
      demo={String(data?.source || "").includes("fallback")}
      demoText="Fallback simulation intelligence is active while the live simulation API is unavailable."
    >
      <style>{`
        .pcs-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
        }

        .pcs-toolbar-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          flex-wrap: wrap;
        }

        .pcs-layout-grid {
          display: grid;
          grid-template-columns: minmax(460px, 1.05fr) minmax(0, 1.55fr);
          gap: 22px;
          align-items: start;
        }

        .pcs-side-grid {
          display: grid;
          gap: 18px;
        }

        .pcs-simulation-tile,
        .pcs-signal-card,
        .pcs-outcome-card,
        .pcs-action-card,
        .pcs-metric-card,
        .pcs-assumption-card {
          border: 1px solid var(--vs-exec-border, var(--vs-border));
          border-radius: 20px;
          background: rgba(15, 23, 42, 0.52);
          min-width: 0;
        }

        .pcs-simulation-tile {
          width: 100%;
          padding: 16px;
          color: inherit;
          text-align: left;
          cursor: pointer;
          transition: border-color 0.18s ease, background 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease;
        }

        .pcs-simulation-tile:hover,
        .pcs-simulation-tile.is-active {
          border-color: rgba(251, 146, 60, 0.48);
          background: rgba(251, 146, 60, 0.08);
          transform: translateY(-1px);
          box-shadow: 0 0 0 1px rgba(251, 146, 60, 0.14);
        }

        .pcs-simulation-tile .vs-responsive-meta,
        .pcs-outcome-card .vs-responsive-meta {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px 18px;
        }

        .pcs-briefing-panel {
          border: 1px solid rgba(251, 146, 60, 0.32);
          border-radius: 28px;
          background:
            radial-gradient(circle at top right, rgba(251, 146, 60, 0.16), transparent 36%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.78), rgba(2, 6, 23, 0.58));
          padding: 22px;
        }

        .pcs-briefing-panel h3 {
          margin: 8px 0 10px;
          color: var(--vs-text);
          font-size: clamp(22px, 2.2vw, 34px);
          line-height: 1.12;
          font-weight: 950;
          letter-spacing: -0.055em;
        }

        .pcs-module-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 14px;
        }

        .pcs-metric-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }

        .pcs-metric-card {
          padding: 16px;
          display: grid;
          gap: 9px;
        }

        .pcs-metric-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
        }

        .pcs-metric-head span {
          color: var(--vs-text-muted);
          font-size: 10px;
          font-weight: 950;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          line-height: 1.35;
        }

        .pcs-metric-head strong {
          color: var(--vs-text);
          font-size: 28px;
          font-weight: 950;
          letter-spacing: -0.055em;
          white-space: nowrap;
        }

        .pcs-metric-card p {
          margin: 0;
          color: var(--vs-text-muted);
          font-size: 11px;
          line-height: 1.5;
        }

        .pcs-meter {
          height: 8px;
          border-radius: 999px;
          background: rgba(148, 163, 184, 0.16);
          border: 1px solid rgba(148, 163, 184, 0.10);
          overflow: hidden;
        }

        .pcs-meter span {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #fb923c, #22c55e);
        }

        .pcs-meter.inverse span {
          background: linear-gradient(90deg, #f59e0b, #ef4444);
        }

        .pcs-assumption-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }

        .pcs-assumption-card {
          padding: 14px;
        }

        .pcs-assumption-card span {
          display: block;
          color: var(--vs-text-muted);
          font-size: 10px;
          font-weight: 950;
          text-transform: uppercase;
          letter-spacing: 0.12em;
        }

        .pcs-assumption-card strong {
          display: block;
          margin-top: 7px;
          color: var(--vs-text);
          line-height: 1.42;
          overflow-wrap: anywhere;
        }

        .pcs-signal-card,
        .pcs-outcome-card {
          padding: 16px;
        }

        .pcs-action-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 16px;
        }

        .pcs-action-card strong {
          display: block;
          color: var(--vs-text);
          font-size: 14px;
          line-height: 1.35;
        }

        .pcs-action-card p {
          margin: 5px 0 0;
          color: var(--vs-text-muted);
          font-size: 12px;
        }

        @media (max-width: 1320px) {
          .pcs-layout-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 900px) {
          .pcs-metric-grid,
          .pcs-assumption-grid,
          .pcs-simulation-tile .vs-responsive-meta,
          .pcs-outcome-card .vs-responsive-meta {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="pcs-toolbar">
        <div className="vs-chip-row">
          <Badge tone="active">Predictive Simulation Engine</Badge>
          <Badge tone="accent">Executive What-If Modeling</Badge>
          <Badge tone="info">Cross-Module Scenario Intelligence</Badge>
        </div>

        <div className="pcs-toolbar-actions">
          <button type="button" className="vs-button vs-button-secondary" onClick={loadData} disabled={loading}>
            {loading ? "Refreshing Predictive Simulations..." : "Refresh Predictive Simulations"}
          </button>
          <button type="button" className="vs-button vs-button-primary" onClick={handleRunSimulation} disabled={runLoading}>
            {runLoading ? "Running Executive Simulation..." : "Run Executive Simulation"}
          </button>
          <button type="button" className="vs-button vs-button-secondary" onClick={handleSeed} disabled={seedLoading}>
            {seedLoading ? "Seeding Simulations..." : "Seed Simulation Data"}
          </button>
          <Link className="vs-button vs-button-secondary" to="/executive-decision-intelligence">
            Open Decision Intelligence
          </Link>
          <Link className="vs-button vs-button-secondary" to="/command-center">
            Open Command Center
          </Link>
        </div>
      </div>

      {notice ? <div className="vs-banner">{notice}</div> : null}

      <div className="vs-grid-4">
        <StatCard label="Active Predictive Simulations" value={summary.activeSimulations || simulations.length || 0} subtext="Executive scenarios currently modeled" />
        <StatCard label="Average Simulated Win Probability Percentage" value={pct(summary.averageWinProbability)} subtext="Projected probability across active scenarios" />
        <StatCard label="Average Turnout Lift Percentage" value={pct(summary.averageTurnoutLift)} subtext="Estimated turnout movement across modeled scenarios" />
        <StatCard label="Average Execution Readiness Percentage" value={pct(summary.averageExecutionReadiness)} subtext="Operational readiness across simulated plans" />
      </div>

      <div className="pcs-layout-grid">
        <div className="pcs-side-grid">
          <SectionCard
            title="Predictive Campaign Simulation Queue"
            subtitle="Executive what-if scenarios ranked by simulated win probability, turnout movement, funding impact, coalition movement, vendor readiness, and operational risk."
            right={<Badge tone="info">{simulations.length} Active Simulations</Badge>}
          >
            {loading ? (
              <EmptyState text="Loading Predictive Campaign Simulations..." />
            ) : simulations.length ? (
              <div className="vs-stack">
                {simulations.map((simulation) => (
                  <SimulationTile
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

          <SectionCard
            title="Live Predictive Simulation Signals"
            subtitle="Fully labeled signals explaining what is moving the campaign simulation model."
            right={<Badge tone="accent">{signals.length} Simulation Signals</Badge>}
          >
            {signals.length ? (
              <div className="vs-stack">
                {signals.map((signal) => <SimulationSignal key={signal.id || signal.title} signal={signal} />)}
              </div>
            ) : (
              <EmptyState text="No live predictive simulation signals are currently available." />
            )}
          </SectionCard>
        </div>

        <div className="vs-stack">
          <SectionCard
            title="Executive Simulation Briefing"
            subtitle="Primary scenario assessment with full percentage modeling and recommended course of action."
            right={<Badge tone={toneFromLevel(activeSimulation?.status)}>{labelize(activeSimulation?.status || "active")}</Badge>}
          >
            {activeSimulation ? (
              <div className="vs-stack">
                <div className="pcs-briefing-panel">
                  <div className="vs-page-eyebrow">Recommended Simulation Scenario</div>
                  <h3>{activeSimulation.scenario_label || activeSimulation.title}</h3>
                  <p className="vs-page-subtitle" style={{ margin: 0 }}>
                    {activeSimulation.recommendation || "No simulation recommendation available."}
                  </p>
                  <div className="pcs-module-row">
                    <Badge tone="accent">{activeSimulation.state_code || "National Coverage"}</Badge>
                    <Badge tone="info">{labelize(activeSimulation.simulation_type || "campaign simulation")}</Badge>
                    <Badge tone={toneFromLevel(activeSimulation.status)}>{labelize(activeSimulation.status || "active")}</Badge>
                  </div>
                </div>

                <div className="pcs-metric-grid">
                  <SimulationMetric title="Baseline Win Probability Percentage" value={activeSimulation.baseline_win_probability} subtitle="Starting probability before modeled changes." />
                  <SimulationMetric title="Simulated Win Probability Percentage" value={activeSimulation.simulated_win_probability} subtitle="Projected probability after modeled changes." />
                  <SimulationMetric title="Turnout Lift Percentage" value={activeSimulation.turnout_lift_percentage} subtitle="Estimated turnout improvement or decline." />
                  <SimulationMetric title="Funding Impact Percentage" value={activeSimulation.funding_impact_percentage} subtitle="Projected effect of fundraising changes." />
                  <SimulationMetric title="Coalition Movement Percentage" value={activeSimulation.coalition_movement_percentage} subtitle="Modeled coalition movement across target blocs." />
                  <SimulationMetric title="Vendor Execution Readiness Percentage" value={activeSimulation.vendor_execution_readiness} subtitle="Operational vendor readiness for this scenario." />
                  <SimulationMetric title="Operational Risk Percentage" value={activeSimulation.risk_percentage} subtitle="Execution downside risk in this scenario." inverse />
                  <SimulationMetric title="Simulation Confidence Percentage" value={activeSimulation.confidence_percentage} subtitle="Reliability level of this simulation scenario." />
                </div>
              </div>
            ) : (
              <EmptyState text="No predictive campaign simulation is currently selected." />
            )}
          </SectionCard>

          <SectionCard
            title="Simulation Assumptions"
            subtitle="Executive assumptions used by the scenario model."
          >
            {activeSimulation?.assumptions && Object.keys(activeSimulation.assumptions).length ? (
              <div className="pcs-assumption-grid">
                {Object.entries(activeSimulation.assumptions).map(([key, value]) => (
                  <div className="pcs-assumption-card" key={key}>
                    <span>{labelize(key)}</span>
                    <strong>{String(value)}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState text="No simulation assumptions were provided for this scenario." />
            )}
          </SectionCard>

          <SectionCard
            title="Scenario Outcome Comparison"
            subtitle="Compare expected, upside, and downside simulation outcomes with full percentage labels."
            right={<Badge tone="accent">{arr(activeSimulation?.outcomes).length} Outcomes</Badge>}
          >
            {arr(activeSimulation?.outcomes).length ? (
              <div className="vs-stack">
                {arr(activeSimulation.outcomes).map((outcome) => <ScenarioOutcome key={outcome.id || outcome.outcome_label} outcome={outcome} />)}
              </div>
            ) : (
              <EmptyState text="No outcome comparison has been generated for this scenario yet." />
            )}
          </SectionCard>

          <SectionCard
            title="Simulation Action Path"
            subtitle="Operational follow-through that can be converted into Command Center tasks."
            right={<Badge tone="info">{arr(activeSimulation?.actions).length} Simulation Actions</Badge>}
          >
            {arr(activeSimulation?.actions).length ? (
              <div className="vs-stack">
                {arr(activeSimulation.actions).map((action) => <SimulationAction key={action.id || action.action_label} action={action} />)}
              </div>
            ) : (
              <EmptyState text="No simulation action path has been generated for this scenario yet." />
            )}
          </SectionCard>
        </div>
      </div>
    </PageShell>
  );
}

