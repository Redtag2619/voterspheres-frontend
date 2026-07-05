import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchExecutiveAiCommand,
  seedExecutiveAiCommand,
  generateExecutiveAiMission,
} from "../api/executiveAiCommandApi";

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
  if (["medium", "monitoring", "watch", "pending_approval", "executive_review"].includes(next)) return "accent";
  if (["active", "stable", "complete", "completed", "queued"].includes(next)) return "active";
  return "info";
}

function ScoreCard({ title, value, subtitle, inverse = false }) {
  const width = Math.max(0, Math.min(100, number(value)));

  return (
    <div className="cmd-score-card">
      <div className="cmd-score-head">
        <span>{title}</span>
        <strong>{pct(value)}</strong>
      </div>
      <p>{subtitle}</p>
      <div className={inverse ? "cmd-score-bar inverse" : "cmd-score-bar"}>
        <i style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function MissionRow({ mission, active, onClick }) {
  return (
    <button
      type="button"
      className={active ? "cmd-row is-active" : "cmd-row"}
      onClick={onClick}
    >
      <ResponsiveRow
        title={mission.title}
        subtitle={mission.mission_summary || "Executive AI mission requires leadership review."}
        meta={[
          { label: "Mission Type", value: labelize(mission.mission_type) },
          { label: "Geographic Scope", value: mission.state_name || mission.geographic_scope || "National Coverage" },
          { label: "Strategic Impact Percentage", value: pct(mission.impact_percentage) },
          { label: "Mission Confidence Percentage", value: pct(mission.confidence_percentage) },
          { label: "Execution Risk Percentage", value: pct(mission.risk_percentage) },
          { label: "Approval Status", value: labelize(mission.approval_status || mission.status) },
        ]}
      />
    </button>
  );
}

function TimelineRow({ event }) {
  return (
    <div className="cmd-timeline-row">
      <span className="cmd-dot" />
      <ResponsiveRow
        title={event.event_title}
        subtitle={event.event_description}
        meta={[
          { label: "Command Event Type", value: labelize(event.event_type) },
          { label: "Intelligence Source", value: event.source_module || "Executive AI Command Platform" },
          { label: "Geographic Scope", value: event.state_name || "National Coverage" },
          { label: "Impact Percentage", value: pct(event.impact_percentage) },
        ]}
      />
    </div>
  );
}

function ActionRow({ action }) {
  return (
    <div className="cmd-action-row">
      <div>
        <strong>{action.title || "Executive command action"}</strong>
        <p>{action.description || "Command action details unavailable."}</p>
        <div className="cmd-chip-row">
          <Badge tone="info">Owner: {action.owner || "Executive Operations"}</Badge>
          <Badge tone={tone(action.status)}>Status: {labelize(action.status || "queued")}</Badge>
          <Badge tone="accent">Due: {action.due_window || "72 hours"}</Badge>
          <Badge tone={action.approval_required ? "danger" : "active"}>
            {action.approval_required ? "Executive Approval Required" : "Approval Not Required"}
          </Badge>
        </div>
      </div>
    </div>
  );
}

export default function ExecutiveAICommandPlatform() {
  const [data, setData] = useState(null);
  const [activeMissionId, setActiveMissionId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [seedLoading, setSeedLoading] = useState(false);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function loadData() {
    setLoading(true);
    setMessage("");

    const result = await fetchExecutiveAiCommand(1);
    setData(result);

    const missions = arr(result.missions);
    setActiveMissionId((current) => {
      if (current && missions.some((item) => String(item.id) === String(current))) return current;
      return missions[0]?.id || null;
    });

    setLoading(false);
  }

  async function handleSeed() {
    setSeedLoading(true);
    const result = await seedExecutiveAiCommand(1);
    setMessage(result?.ok ? "Executive AI Command Platform seeded successfully." : "Seed endpoint unavailable. Fallback command platform remains active.");
    await loadData();
    setSeedLoading(false);
  }

  async function handleGenerateMission() {
    setGenerateLoading(true);

    const result = await generateExecutiveAiMission(
      {
        title: "Executive AI Mission Package",
        mission_type: "executive_ai_mission",
        geographic_scope: "National Coverage",
        state_name: "National Coverage",
        priority: "medium",
        impact_percentage: 78,
        confidence_percentage: 84,
        risk_percentage: 34,
        mission_summary: "Executive AI generated a new mission package for leadership review.",
      },
      1
    );

    setMessage(result?.ok ? "Executive AI mission generated." : "Generate endpoint unavailable. Fallback command platform remains active.");
    await loadData();
    setGenerateLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const brief = data?.brief;
  const missions = arr(data?.missions);
  const timeline = arr(data?.timeline);
  const summary = data?.summary || {};

  const activeMission = useMemo(() => {
    return missions.find((item) => String(item.id) === String(activeMissionId)) || missions[0] || null;
  }, [missions, activeMissionId]);

  return (
    <PageShell
      eyebrow="Build 3C · Executive AI Command Platform"
      title="Executive AI Command Platform"
      description="The unified executive operating system for VoterSpheres, connecting decision intelligence, predictive simulation, national digital twin modeling, autonomous operations, forecast, command center, and political graph intelligence."
      demo={String(data?.source || "").includes("fallback")}
      demoText="Fallback executive AI command intelligence is active while the live API is unavailable."
    >
      <style>{`
        .cmd-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .cmd-toolbar-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .cmd-layout {
          display: grid;
          grid-template-columns: minmax(460px, 1fr) minmax(0, 1.45fr);
          gap: 22px;
          align-items: start;
        }

        .cmd-row,
        .cmd-action-row,
        .cmd-timeline-row,
        .cmd-score-card {
          border: 1px solid var(--vs-exec-border, var(--vs-border));
          border-radius: 18px;
          background: rgba(15, 23, 42, 0.52);
          min-width: 0;
        }

        .cmd-row {
          width: 100%;
          padding: 15px;
          text-align: left;
          color: inherit;
          cursor: pointer;
        }

        .cmd-row:hover,
        .cmd-row.is-active {
          border-color: rgba(251, 146, 60, 0.46);
          background: rgba(251, 146, 60, 0.08);
        }

        .cmd-row .vs-responsive-meta,
        .cmd-timeline-row .vs-responsive-meta {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px 18px;
        }

        .cmd-brief-panel {
          border: 1px solid rgba(251, 146, 60, 0.30);
          border-radius: 24px;
          background:
            radial-gradient(circle at top right, rgba(251, 146, 60, 0.14), transparent 36%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.72), rgba(2, 6, 23, 0.55));
          padding: 20px;
        }

        .cmd-brief-panel h3 {
          margin: 8px 0 10px;
          font-size: 24px;
          line-height: 1.24;
          color: var(--vs-text);
        }

        .cmd-source-row,
        .cmd-chip-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 12px;
        }

        .cmd-score-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
        }

        .cmd-score-card {
          padding: 18px;
          display: grid;
          gap: 10px;
          min-height: 132px;
        }

        .cmd-score-head {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 14px;
          align-items: start;
        }

        .cmd-score-head span {
          color: var(--vs-text-muted);
          font-size: 10px;
          font-weight: 950;
          text-transform: uppercase;
          letter-spacing: 0.09em;
          line-height: 1.45;
          white-space: normal;
          overflow-wrap: anywhere;
        }

        .cmd-score-head strong {
          color: var(--vs-text);
          font-size: 24px;
          font-weight: 950;
          white-space: nowrap;
        }

        .cmd-score-card p {
          margin: 0;
          color: var(--vs-text-muted);
          font-size: 12px;
          line-height: 1.55;
        }

        .cmd-score-bar {
          height: 8px;
          border-radius: 999px;
          background: rgba(148, 163, 184, 0.16);
          overflow: hidden;
        }

        .cmd-score-bar i {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #fb923c, #22c55e);
        }

        .cmd-score-bar.inverse i {
          background: linear-gradient(90deg, #f59e0b, #ef4444);
        }

        .cmd-action-row {
          padding: 15px;
        }

        .cmd-action-row strong {
          color: var(--vs-text);
        }

        .cmd-action-row p {
          margin: 6px 0 0;
          color: var(--vs-text-muted);
          line-height: 1.55;
        }

        .cmd-timeline-row {
          display: grid;
          grid-template-columns: 14px minmax(0, 1fr);
          gap: 12px;
          padding: 15px;
        }

        .cmd-dot {
          width: 10px;
          height: 10px;
          margin-top: 4px;
          border-radius: 999px;
          background: var(--vs-brand-orange, #fb923c);
          box-shadow: 0 0 16px rgba(251, 146, 60, 0.65);
        }

        @media (max-width: 1280px) {
          .cmd-layout {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 900px) {
          .cmd-score-grid,
          .cmd-row .vs-responsive-meta,
          .cmd-timeline-row .vs-responsive-meta {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="cmd-toolbar">
        <div className="vs-chip-row">
          <Badge tone={String(data?.source || "").includes("fallback") ? "warning" : "active"}>
            {String(data?.source || "").includes("fallback") ? "Fallback Executive AI Command" : "Live Executive AI Command API"}
          </Badge>
          <Badge tone="accent">Unified Executive Operating System</Badge>
          <Badge tone="info">AI Mission Control</Badge>
        </div>

        <div className="cmd-toolbar-actions">
          <button type="button" className="vs-button vs-button-secondary" onClick={loadData} disabled={loading}>
            {loading ? "Refreshing Command Platform..." : "Refresh Command Platform"}
          </button>
          <button type="button" className="vs-button vs-button-primary" onClick={handleSeed} disabled={seedLoading}>
            {seedLoading ? "Seeding Command Platform..." : "Seed Command Platform"}
          </button>
          <button type="button" className="vs-button vs-button-secondary" onClick={handleGenerateMission} disabled={generateLoading}>
            {generateLoading ? "Generating Mission..." : "Generate Mission"}
          </button>
          <Link className="vs-button vs-button-secondary" to="/national-political-digital-twin">
            Digital Twin
          </Link>
          <Link className="vs-button vs-button-secondary" to="/autonomous-campaign-operations">
            Autonomous Operations
          </Link>
          <Link className="vs-button vs-button-secondary" to="/command-center">
            Command Center
          </Link>
        </div>
      </div>

      {message ? <div className="vs-banner">{message}</div> : null}

      <div className="vs-grid-4">
        <StatCard label="Active Executive Command Briefs" value={summary.activeCommandBriefs || 0} subtext="Current national executive command briefs" />
        <StatCard label="Active Executive Missions" value={summary.activeExecutiveMissions || missions.length || 0} subtext="AI-created mission packages under review" />
        <StatCard label="AI Confidence Percentage" value={pct(summary.aiConfidencePercentage)} subtext="Confidence across the active executive command brief" />
        <StatCard label="Execution Risk Percentage" value={pct(summary.executionRiskPercentage)} subtext={`${summary.queuedApprovalActions || 0} queued approval actions`} />
      </div>

      <div className="cmd-layout">
        <SectionCard
          title="Executive AI Mission Queue"
          subtitle="AI-generated mission packages that unify decision intelligence, predictive simulation, national digital twin, and autonomous operations."
          right={<Badge tone="info">{missions.length} Executive Missions</Badge>}
        >
          {loading ? (
            <EmptyState text="Loading Executive AI Command Platform..." />
          ) : missions.length ? (
            <div className="vs-stack">
              {missions.map((mission) => (
                <MissionRow
                  key={mission.id || mission.title}
                  mission={mission}
                  active={String(activeMission?.id) === String(mission.id)}
                  onClick={() => setActiveMissionId(mission.id)}
                />
              ))}
            </div>
          ) : (
            <EmptyState text="No executive AI missions are currently available." />
          )}
        </SectionCard>

        <div className="vs-stack">
          <SectionCard
            title="National Executive AI Command Brief"
            subtitle="The unified command brief for leadership, combining all major VoterSpheres intelligence systems."
            right={<Badge tone={tone(brief?.executive_priority)}>{labelize(brief?.executive_priority || "high")}</Badge>}
          >
            {brief ? (
              <div className="vs-stack">
                <div className="cmd-brief-panel">
                  <div className="vs-page-eyebrow">Recommended Executive Action</div>
                  <h3>{brief.recommended_action}</h3>
                  <p className="vs-page-subtitle" style={{ margin: 0 }}>{brief.strategic_summary}</p>
                  <div className="cmd-source-row">
                    {arr(brief.source_modules).map((source) => (
                      <Badge key={source} tone="accent">{source}</Badge>
                    ))}
                  </div>
                </div>

                <div className="cmd-score-grid">
                  <ScoreCard title="National Readiness Percentage" value={brief.national_readiness_percentage} subtitle="Overall modeled national readiness." />
                  <ScoreCard title="Win Probability Percentage" value={brief.win_probability_percentage} subtitle="Current national modeled probability." />
                  <ScoreCard title="AI Confidence Percentage" value={brief.ai_confidence_percentage} subtitle="Confidence in the executive command brief." />
                  <ScoreCard title="Autonomous Readiness Percentage" value={brief.autonomous_readiness_percentage} subtitle="Readiness for executive-approved automation." />
                  <ScoreCard title="Execution Risk Percentage" value={brief.execution_risk_percentage} subtitle="Operational downside exposure." inverse />
                </div>
              </div>
            ) : (
              <EmptyState text="No executive command brief is currently available." />
            )}
          </SectionCard>

          <SectionCard
            title="Selected Mission Approval Queue"
            subtitle="Executive approval actions attached to the selected AI mission package."
            right={<Badge tone="info">{arr(activeMission?.actions).length} Approval Actions</Badge>}
          >
            {arr(activeMission?.actions).length ? (
              <div className="vs-stack">
                {arr(activeMission.actions).map((action) => (
                  <ActionRow key={action.id || action.title} action={action} />
                ))}
              </div>
            ) : (
              <EmptyState text="No approval actions are currently attached to this mission." />
            )}
          </SectionCard>

          <SectionCard
            title="Executive AI Command Timeline"
            subtitle="Recent events and intelligence updates absorbed into the executive command platform."
            right={<Badge tone="accent">{timeline.length} Timeline Events</Badge>}
          >
            {timeline.length ? (
              <div className="vs-stack">
                {timeline.map((event) => (
                  <TimelineRow key={event.id || event.event_title} event={event} />
                ))}
              </div>
            ) : (
              <EmptyState text="No executive AI command timeline events are currently available." />
            )}
          </SectionCard>
        </div>
      </div>
    </PageShell>
  );
}
