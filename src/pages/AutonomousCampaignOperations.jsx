import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchAutonomousCampaignOperations,
  seedAutonomousCampaignOperations,
  generateAutonomousOperationPlan,
} from "../api/autonomousCampaignOperationsApi";

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
  if (["medium", "monitoring", "watch", "pending_approval"].includes(next)) return "accent";
  if (["active", "stable", "complete", "completed", "queued"].includes(next)) return "active";
  return "info";
}

function ScoreCard({ title, value, subtitle, inverse = false }) {
  const width = Math.max(0, Math.min(100, number(value)));

  return (
    <div className="auto-score-card">
      <div className="auto-score-head">
        <span>{title}</span>
        <strong>{pct(value)}</strong>
      </div>
      <p>{subtitle}</p>
      <div className={inverse ? "auto-score-bar inverse" : "auto-score-bar"}>
        <i style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function PlanRow({ plan, active, onClick }) {
  return (
    <button
      type="button"
      className={active ? "auto-row is-active" : "auto-row"}
      onClick={onClick}
    >
      <ResponsiveRow
        title={plan.title}
        subtitle={plan.executive_summary || plan.recommendation || "Autonomous operations plan requires executive review."}
        meta={[
          { label: "Plan Type", value: labelize(plan.plan_type) },
          { label: "Geographic Scope", value: plan.state_name || plan.geographic_scope || "National Coverage" },
          { label: "Automation Readiness Percentage", value: pct(plan.automation_readiness_percentage) },
          { label: "Operational Impact Percentage", value: pct(plan.impact_percentage) },
          { label: "Execution Risk Percentage", value: pct(plan.risk_percentage) },
          { label: "Executive Status", value: labelize(plan.status || "pending approval") },
        ]}
      />
    </button>
  );
}

function AlertRow({ alert }) {
  return (
    <div className="auto-panel-row">
      <ResponsiveRow
        title={alert.title}
        subtitle={alert.description}
        meta={[
          { label: "Trigger Source", value: alert.trigger_source || "Autonomous Campaign Operations" },
          { label: "Geographic Scope", value: alert.state_name || "National Coverage" },
          { label: "Executive Alert Level", value: labelize(alert.severity || "monitoring") },
          { label: "Recommended Response", value: alert.recommended_response || "Executive review required." },
        ]}
        alert={String(alert.severity || "").toLowerCase() === "high" ? "vs-live-dot" : "vs-live-dot-warning"}
      />
    </div>
  );
}

function TaskRow({ task }) {
  return (
    <div className="auto-task-row">
      <div>
        <strong>{task.title || "Autonomous operations task"}</strong>
        <p>{task.description || "Task details unavailable."}</p>
        <div className="auto-chip-row">
          <Badge tone="info">Owner: {task.owner || "Executive Operations"}</Badge>
          <Badge tone={tone(task.priority)}>Priority: {labelize(task.priority || "medium")}</Badge>
          <Badge tone={tone(task.status)}>Status: {labelize(task.status || "queued")}</Badge>
          <Badge tone="accent">Due: {task.due_window || "72 hours"}</Badge>
        </div>
      </div>
    </div>
  );
}

function PlaybookRow({ playbook }) {
  const executionSteps = arr(playbook.execution_steps);
  const riskControls = arr(playbook.risk_controls);

  return (
    <div className="auto-panel-row">
      <ResponsiveRow
        title={playbook.title}
        subtitle={playbook.description}
        meta={[
          { label: "Playbook Type", value: labelize(playbook.playbook_type || "campaign response") },
          { label: "Activation Condition", value: playbook.activation_condition || "Executive activation condition unavailable." },
          { label: "Playbook Status", value: labelize(playbook.status || "active") },
        ]}
      />

      <div className="auto-two-col">
        <div>
          <div className="auto-subhead">Execution Steps</div>
          <ul>
            {executionSteps.length ? executionSteps.map((step) => <li key={step}>{step}</li>) : <li>No execution steps available.</li>}
          </ul>
        </div>
        <div>
          <div className="auto-subhead">Risk Controls</div>
          <ul>
            {riskControls.length ? riskControls.map((control) => <li key={control}>{control}</li>) : <li>No risk controls available.</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function AutonomousCampaignOperations() {
  const [data, setData] = useState(null);
  const [activePlanId, setActivePlanId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [seedLoading, setSeedLoading] = useState(false);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function loadData() {
    setLoading(true);
    setMessage("");

    const result = await fetchAutonomousCampaignOperations(1);
    setData(result);

    const plans = arr(result.plans);
    setActivePlanId((current) => {
      if (current && plans.some((item) => String(item.id) === String(current))) return current;
      return plans[0]?.id || null;
    });

    setLoading(false);
  }

  async function handleSeed() {
    setSeedLoading(true);
    const result = await seedAutonomousCampaignOperations(1);
    setMessage(result?.ok ? "Autonomous Campaign Operations seeded successfully." : "Seed endpoint unavailable. Fallback operations remain active.");
    await loadData();
    setSeedLoading(false);
  }

  async function handleGeneratePlan() {
    setGenerateLoading(true);

    const result = await generateAutonomousOperationPlan(
      {
        title: "Autonomous Executive Operations Plan",
        plan_type: "autonomous_campaign_operations",
        geographic_scope: "National Coverage",
        priority: "medium",
        confidence_percentage: 82,
        impact_percentage: 78,
        risk_percentage: 34,
        automation_readiness_percentage: 76,
        executive_summary: "Autonomous operations generated a new executive-ready operations plan.",
        recommendation: "Review the plan and approve Command Center task conversion when ready.",
        source_modules: ["Autonomous Campaign Operations", "National Political Digital Twin"],
      },
      1
    );

    setMessage(result?.ok ? "Autonomous operations plan generated." : "Generate endpoint unavailable. Fallback operations remain active.");
    await loadData();
    setGenerateLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const plans = arr(data?.plans);
  const alerts = arr(data?.alerts);
  const playbooks = arr(data?.playbooks);
  const summary = data?.summary || {};

  const activePlan = useMemo(() => {
    return plans.find((item) => String(item.id) === String(activePlanId)) || plans[0] || null;
  }, [plans, activePlanId]);

  return (
    <PageShell
      eyebrow="Autonomous Campaign Operations"
      title="Autonomous Campaign Operations"
      description="An executive operations module that converts intelligence signals, digital twin movement, predictive simulations, and decision recommendations into approval-ready campaign execution plans."
      demo={String(data?.source || "").includes("fallback")}
      demoText="Fallback autonomous operations intelligence is active while the live API is unavailable."
    >
      <style>{`
        .auto-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .auto-toolbar-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .auto-layout {
          display: grid;
          grid-template-columns: minmax(460px, 1fr) minmax(0, 1.45fr);
          gap: 22px;
          align-items: start;
        }

        .auto-row,
        .auto-panel-row,
        .auto-task-row,
        .auto-score-card {
          border: 1px solid var(--vs-exec-border, var(--vs-border));
          border-radius: 18px;
          background: rgba(15, 23, 42, 0.52);
          min-width: 0;
        }

        .auto-row {
          width: 100%;
          padding: 15px;
          text-align: left;
          color: inherit;
          cursor: pointer;
        }

        .auto-row:hover,
        .auto-row.is-active {
          border-color: rgba(251, 146, 60, 0.46);
          background: rgba(251, 146, 60, 0.08);
        }

        .auto-row .vs-responsive-meta,
        .auto-panel-row .vs-responsive-meta {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px 18px;
        }

        .auto-command-panel {
          border: 1px solid rgba(251, 146, 60, 0.30);
          border-radius: 24px;
          background:
            radial-gradient(circle at top right, rgba(251, 146, 60, 0.14), transparent 36%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.72), rgba(2, 6, 23, 0.55));
          padding: 20px;
        }

        .auto-command-panel h3 {
          margin: 8px 0 10px;
          font-size: 24px;
          line-height: 1.24;
          color: var(--vs-text);
        }

        .auto-source-row,
        .auto-chip-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 12px;
        }

        .auto-score-grid {
         display: grid;
         grid-template-columns: repeat(2, minmax(0, 1fr));
         gap: 18px;
       }

        .auto-score-card {
         padding: 18px;
         display: grid;
         gap: 10px;
         min-height: 132px;
       }

        .auto-score-head {
         display: grid;
         grid-template-columns: minmax(0, 1fr) auto;
         gap: 14px;
         align-items: start;
       }

        .auto-score-head span {
         color: var(--vs-text-muted);
         font-size: 10px;
         font-weight: 950;
         text-transform: uppercase;
         letter-spacing: 0.09em;
         line-height: 1.45;
         white-space: normal;
         overflow-wrap: anywhere;
       }

        .auto-score-head strong {
         color: var(--vs-text);
         font-size: 24px;
         font-weight: 950;
         white-space: nowrap;
       }

        .auto-score-card p {
         margin: 0;
         color: var(--vs-text-muted);
         font-size: 12px;
         line-height: 1.55;
       }

        .auto-score-bar {
          height: 8px;
          border-radius: 999px;
          background: rgba(148, 163, 184, 0.16);
          overflow: hidden;
        }

        .auto-score-bar i {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #fb923c, #22c55e);
        }

        .auto-score-bar.inverse i {
          background: linear-gradient(90deg, #f59e0b, #ef4444);
        }

        .auto-panel-row,
        .auto-task-row {
          padding: 15px;
        }

        .auto-task-row strong {
          color: var(--vs-text);
        }

        .auto-task-row p {
          margin: 6px 0 0;
          color: var(--vs-text-muted);
          line-height: 1.55;
        }

        .auto-two-col {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
          margin-top: 14px;
        }

        .auto-subhead {
          color: var(--vs-text);
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 8px;
        }

        .auto-two-col ul {
          margin: 0;
          padding-left: 18px;
          color: var(--vs-text-muted);
          line-height: 1.65;
        }

        @media (max-width: 1280px) {
          .auto-layout {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 1100px) {
          .auto-score-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 900px) {
          .auto-row .vs-responsive-meta,
          .auto-panel-row .vs-responsive-meta,
          .auto-two-col {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="auto-toolbar">
        <div className="vs-chip-row">
          <Badge tone={String(data?.source || "").includes("fallback") ? "warning" : "active"}>
            {String(data?.source || "").includes("fallback") ? "Fallback Autonomous Operations" : "Live Autonomous Operations API"}
          </Badge>
          <Badge tone="accent">Executive Approval Layer</Badge>
          <Badge tone="info">Command Center Ready</Badge>
        </div>

        <div className="auto-toolbar-actions">
          <button type="button" className="vs-button vs-button-secondary" onClick={loadData} disabled={loading}>
            {loading ? "Refreshing Operations..." : "Refresh Operations"}
          </button>
          <button type="button" className="vs-button vs-button-primary" onClick={handleSeed} disabled={seedLoading}>
            {seedLoading ? "Seeding Operations..." : "Seed Operations"}
          </button>
          <button type="button" className="vs-button vs-button-secondary" onClick={handleGeneratePlan} disabled={generateLoading}>
            {generateLoading ? "Generating Plan..." : "Generate Plan"}
          </button>
          <Link className="vs-button vs-button-secondary" to="/national-political-digital-twin">
            National Digital Twin
          </Link>
          <Link className="vs-button vs-button-secondary" to="/command-center">
            Command Center
          </Link>
        </div>
      </div>

      {message ? <div className="vs-banner">{message}</div> : null}

      <div className="vs-grid-4">
        <StatCard label="Active Autonomous Operation Plans" value={summary.activeOperationPlans || plans.length || 0} subtext="Executive-ready operation plans generated from intelligence signals" />
        <StatCard label="Queued Autonomous Tasks" value={summary.queuedAutonomousTasks || 0} subtext="Tasks ready for Command Center conversion" />
        <StatCard label="Average Automation Readiness Percentage" value={pct(summary.averageAutomationReadinessPercentage)} subtext="Average readiness across active autonomous plans" />
        <StatCard label="Average Execution Risk Percentage" value={pct(summary.averageExecutionRiskPercentage)} subtext={`${summary.highPriorityAlerts || alerts.length || 0} high priority autonomous alerts`} />
      </div>

      <div className="auto-layout">
        <SectionCard
          title="Autonomous Operations Plan Queue"
          subtitle="AI-generated campaign execution plans awaiting executive review, approval, or Command Center conversion."
          right={<Badge tone="info">{plans.length} Operation Plans</Badge>}
        >
          {loading ? (
            <EmptyState text="Loading Autonomous Campaign Operations..." />
          ) : plans.length ? (
            <div className="vs-stack">
              {plans.map((plan) => (
                <PlanRow
                  key={plan.id || plan.title}
                  plan={plan}
                  active={String(activePlan?.id) === String(plan.id)}
                  onClick={() => setActivePlanId(plan.id)}
                />
              ))}
            </div>
          ) : (
            <EmptyState text="No autonomous campaign operation plans are currently available." />
          )}
        </SectionCard>

        <div className="vs-stack">
          <SectionCard
            title="Executive Autonomous Operations Command View"
            subtitle="Selected autonomous operations plan with full percentage scoring, source traceability, and execution queue."
            right={<Badge tone={tone(activePlan?.status || activePlan?.priority)}>{labelize(activePlan?.status || "pending approval")}</Badge>}
          >
            {activePlan ? (
              <div className="vs-stack">
                <div className="auto-command-panel">
                  <div className="vs-page-eyebrow">Recommended Autonomous Operations Plan</div>
                  <h3>{activePlan.recommendation || activePlan.title}</h3>
                  <p className="vs-page-subtitle" style={{ margin: 0 }}>
                    {activePlan.executive_summary || "No executive summary is currently available."}
                  </p>
                  <div className="auto-source-row">
                    {arr(activePlan.source_modules).map((source) => (
                      <Badge key={source} tone="accent">{source}</Badge>
                    ))}
                  </div>
                </div>

                <div className="auto-score-grid">
                  <ScoreCard title="Automation Readiness Percentage" value={activePlan.automation_readiness_percentage} subtitle="Readiness for executive-approved automation." />
                  <ScoreCard title="Operational Impact Percentage" value={activePlan.impact_percentage} subtitle="Projected campaign execution value." />
                  <ScoreCard title="Recommendation Confidence Percentage" value={activePlan.confidence_percentage} subtitle="Reliability of this autonomous recommendation." />
                  <ScoreCard title="Execution Risk Percentage" value={activePlan.risk_percentage} subtitle="Operational downside or approval risk." inverse />
                </div>
              </div>
            ) : (
              <EmptyState text="No autonomous operations plan is currently selected." />
            )}
          </SectionCard>

          <SectionCard
            title="Command Center Task Conversion Queue"
            subtitle="Autonomous tasks that can be reviewed and converted into Command Center execution work."
            right={<Badge tone="info">{arr(activePlan?.tasks).length} Queued Tasks</Badge>}
          >
            {arr(activePlan?.tasks).length ? (
              <div className="vs-stack">
                {arr(activePlan.tasks).map((task) => (
                  <TaskRow key={task.id || task.title} task={task} />
                ))}
              </div>
            ) : (
              <EmptyState text="No autonomous tasks are currently queued for this plan." />
            )}
          </SectionCard>

          <SectionCard
            title="Autonomous Risk Triggers"
            subtitle="Risk-triggered alerts generated by the autonomous campaign operations layer."
            right={<Badge tone="danger">{alerts.length} Alerts</Badge>}
          >
            {alerts.length ? (
              <div className="vs-stack">
                {alerts.map((alert) => (
                  <AlertRow key={alert.id || alert.title} alert={alert} />
                ))}
              </div>
            ) : (
              <EmptyState text="No autonomous campaign operations alerts are currently available." />
            )}
          </SectionCard>

          <SectionCard
            title="Campaign Response Playbooks"
            subtitle="Approval-safe campaign response playbooks available to the autonomous operations layer."
            right={<Badge tone="accent">{playbooks.length} Playbooks</Badge>}
          >
            {playbooks.length ? (
              <div className="vs-stack">
                {playbooks.map((playbook) => (
                  <PlaybookRow key={playbook.id || playbook.title} playbook={playbook} />
                ))}
              </div>
            ) : (
              <EmptyState text="No autonomous campaign playbooks are currently available." />
            )}
          </SectionCard>
        </div>
      </div>
    </PageShell>
  );
}
