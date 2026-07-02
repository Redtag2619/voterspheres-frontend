import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchDecisionIntelligence, seedDecisionIntelligence } from "../api/decisionIntelligenceApi";

import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import ResponsiveRow from "../components/ui/ResponsiveRow";

const fallbackDecisionData = {
  ok: true,
  summary: {
    openDecisions: 3,
    highPriority: 2,
    avgConfidence: 82,
    avgRisk: 39,
    liveSignals: 6,
  },
  decisions: [
    {
      id: "fallback-1",
      title: "Reallocate executive resources toward high-volatility battleground states",
      decision_type: "resource_allocation",
      priority: "high",
      status: "open",
      confidence_score: 84,
      risk_score: 41,
      impact_score: 92,
      urgency_score: 88,
      recommendation:
        "Shift field, vendor, and executive review capacity toward states with rising volatility and coalition movement.",
      rationale:
        "Forecast, coalition, influence, and operations signals indicate elevated movement in competitive states.",
      source_modules: ["forecast", "coalitions", "influence", "operations"],
      options: [
        {
          id: "fallback-option-1",
          label: "Balanced resource shift",
          description: "Move 10-15% of resources while preserving national coverage.",
          projected_impact: 86,
          projected_risk: 39,
          confidence: 84,
          timeline: "7-14 days",
        },
        {
          id: "fallback-option-2",
          label: "Aggressive resource shift",
          description: "Move 20-30% of available resources into top volatility states.",
          projected_impact: 94,
          projected_risk: 58,
          confidence: 81,
          timeline: "3-7 days",
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
      title: "Escalate coalition instability review in priority suburban blocs",
      decision_type: "coalition_activation",
      priority: "medium",
      status: "open",
      confidence_score: 78,
      risk_score: 34,
      impact_score: 81,
      urgency_score: 73,
      recommendation: "Assign coalition owners and increase executive monitoring cadence.",
      rationale: "Coalition movement suggests a near-term persuasion opportunity.",
      source_modules: ["coalitions", "strategy", "political graph"],
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
      signal_type: "influence_pressure",
      title: "Influence concentration increasing",
      description: "External influence signals are clustering around key voter segments.",
      severity: "high",
      source_module: "influence",
      state_code: "AZ",
    },
  ],
};

function arr(value) {
  return Array.isArray(value) ? value : [];
}

function n(value, fallback = 0) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function toneFromPriority(value) {
  const next = String(value || "").toLowerCase();
  if (["critical", "high"].includes(next)) return "danger";
  if (["medium", "watch", "warning"].includes(next)) return "accent";
  if (["open", "active", "stable"].includes(next)) return "active";
  return "default";
}

function normalizeDecisionPayload(payload) {
  const source = payload || fallbackDecisionData;
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
  return (
    <div className={inverse ? "decision-score-bar inverse" : "decision-score-bar"}>
      <span style={{ width: `${Math.min(100, Math.max(0, n(value)))}%` }} />
    </div>
  );
}

function DecisionRow({ decision, active, onClick }) {
  return (
    <button
      type="button"
      className={active ? "decision-intel-row is-active" : "decision-intel-row"}
      onClick={onClick}
    >
      <ResponsiveRow
        title={decision.title}
        subtitle={decision.rationale || decision.recommendation || "Executive decision requires review."}
        meta={[
          { label: "Type", value: decision.decision_type || "strategic" },
          { label: "Priority", value: decision.priority || "medium" },
          { label: "Impact", value: `${n(decision.impact_score)}%` },
          { label: "Risk", value: `${n(decision.risk_score)}%` },
        ]}
        right={<Badge tone={toneFromPriority(decision.priority)}>{decision.priority || "medium"}</Badge>}
      />
    </button>
  );
}

function SignalRow({ signal }) {
  return (
    <div className="decision-intel-signal">
      <ResponsiveRow
        title={signal.title || "Executive signal"}
        subtitle={signal.description || "Review signal details."}
        meta={[
          { label: "Source", value: signal.source_module || signal.signal_type || "intelligence" },
          { label: "State", value: signal.state_code || "National" },
        ]}
        alert={String(signal.severity || "").toLowerCase() === "high" ? "vs-live-dot" : "vs-live-dot-warning"}
        right={<Badge tone={toneFromPriority(signal.severity)}>{signal.severity || "signal"}</Badge>}
      />
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
      setActiveDecisionId((current) => current || result.decisions?.[0]?.id || null);
    } catch (error) {
      setData(fallbackDecisionData);
      setActiveDecisionId(fallbackDecisionData.decisions[0]?.id || null);
      setApiWarning(
        error?.response?.data?.error ||
          error?.message ||
          "Decision Intelligence API returned an error. Showing local executive fallback data."
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
          "Unable to seed Decision Intelligence. Backend migration may not be deployed yet."
      );
    } finally {
      setSeedLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const activeDecision = useMemo(() => {
    return arr(data.decisions).find((item) => String(item.id) === String(activeDecisionId)) || arr(data.decisions)[0] || null;
  }, [data.decisions, activeDecisionId]);

  const summary = data.summary || fallbackDecisionData.summary;

  return (
    <PageShell
      eyebrow="Build 2D · Executive Decision Intelligence"
      title="Executive Decision Intelligence"
      description="Rank strategic choices, compare decision paths, score risk and impact, and convert cross-module intelligence into executive action."
    >
      <style>{`
        .decision-intel-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .decision-intel-grid {
          display: grid;
          grid-template-columns: 360px minmax(0, 1fr) 340px;
          gap: 18px;
          align-items: start;
        }

        .decision-intel-row {
          width: 100%;
          border: 1px solid var(--vs-exec-border, var(--vs-border));
          border-radius: 18px;
          background: rgba(15, 23, 42, 0.48);
          color: inherit;
          padding: 14px;
          text-align: left;
          transition: border-color 0.18s ease, background 0.18s ease, transform 0.18s ease;
        }

        .decision-intel-row:hover,
        .decision-intel-row.is-active {
          border-color: rgba(251, 146, 60, 0.44);
          background: rgba(251, 146, 60, 0.08);
          transform: translateY(-1px);
        }

        .decision-intel-recommendation {
          border: 1px solid rgba(251, 146, 60, 0.28);
          border-radius: 22px;
          background:
            radial-gradient(circle at top right, rgba(251, 146, 60, 0.12), transparent 34%),
            rgba(15, 23, 42, 0.54);
          padding: 18px;
        }

        .decision-intel-recommendation h3 {
          margin: 8px 0 10px;
          color: var(--vs-text);
          font-size: 18px;
          line-height: 1.35;
          letter-spacing: -0.03em;
        }

        .decision-source-row,
        .decision-option-meta {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 12px;
        }

        .decision-score-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
        }

        .decision-score-card {
          border: 1px solid var(--vs-exec-border, var(--vs-border));
          border-radius: 18px;
          background: rgba(15, 23, 42, 0.52);
          padding: 14px;
          min-width: 0;
        }

        .decision-score-card span {
          display: block;
          color: var(--vs-text-muted);
          font-size: 10px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.12em;
        }

        .decision-score-card strong {
          display: block;
          margin-top: 6px;
          color: var(--vs-text);
          font-size: 26px;
          font-weight: 950;
          letter-spacing: -0.05em;
        }

        .decision-score-bar {
          height: 7px;
          margin-top: 10px;
          border-radius: 999px;
          background: rgba(148, 163, 184, 0.16);
          overflow: hidden;
        }

        .decision-score-bar span {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #fb923c, #22c55e);
        }

        .decision-score-bar.inverse span {
          background: linear-gradient(90deg, #f59e0b, #ef4444);
        }

        .decision-option-card,
        .decision-action-card,
        .decision-intel-signal {
          border: 1px solid var(--vs-exec-border, var(--vs-border));
          border-radius: 18px;
          background: rgba(15, 23, 42, 0.50);
          padding: 14px;
          min-width: 0;
        }

        .decision-option-card strong,
        .decision-action-card strong {
          color: var(--vs-text);
          font-size: 14px;
        }

        .decision-option-card p,
        .decision-action-card p {
          margin: 6px 0 0;
          color: var(--vs-text-muted);
          font-size: 12px;
          line-height: 1.55;
        }

        .decision-action-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .decision-action-left {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          min-width: 0;
        }

        .decision-dot {
          width: 9px;
          height: 9px;
          margin-top: 5px;
          border-radius: 999px;
          background: var(--vs-brand-orange, #fb923c);
          box-shadow: 0 0 16px rgba(251, 146, 60, 0.65);
          flex: 0 0 auto;
        }

        @media (max-width: 1240px) {
          .decision-intel-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 900px) {
          .decision-score-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 640px) {
          .decision-score-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="decision-intel-toolbar">
        <div className="vs-chip-row">
          <Badge tone={apiWarning ? "warning" : "active"}>{apiWarning ? "Fallback Mode" : "Live API"}</Badge>
          <Badge tone="accent">Executive Layer</Badge>
          <Badge tone="info">Cross-Module Synthesis</Badge>
        </div>

        <div className="vs-inline-actions">
          <button type="button" className="vs-button vs-button-secondary" onClick={loadData}>
            Refresh Intelligence
          </button>
          <button type="button" className="vs-button vs-button-primary" onClick={handleSeed} disabled={seedLoading}>
            {seedLoading ? "Seeding..." : "Seed Intelligence"}
          </button>
          <Link className="vs-button vs-button-secondary" to="/command-center">
            Command Center
          </Link>
        </div>
      </div>

      {apiWarning ? <div className="vs-banner vs-banner-danger">{apiWarning}</div> : null}

      <div className="vs-grid-4">
        <StatCard label="Open Decisions" value={summary.openDecisions || 0} subtext="Executive items requiring review" />
        <StatCard label="High Priority" value={summary.highPriority || 0} subtext="Requires executive attention" />
        <StatCard label="Avg Confidence" value={`${summary.avgConfidence || 0}%`} subtext="Recommendation confidence" />
        <StatCard label="Avg Risk" value={`${summary.avgRisk || 0}%`} subtext={`${summary.liveSignals || 0} live signals`} />
      </div>

      <div className="decision-intel-grid">
        <SectionCard
          title="Decision Queue"
          subtitle="Ranked executive decisions from strategy, forecast, coalition, influence, and operations signals."
          right={<Badge tone="info">{arr(data.decisions).length} active</Badge>}
        >
          {loading ? (
            <EmptyState text="Loading decision intelligence..." />
          ) : (
            <div className="vs-stack">
              {arr(data.decisions).map((decision) => (
                <DecisionRow
                  key={decision.id || decision.title}
                  decision={decision}
                  active={String(activeDecision?.id) === String(decision.id)}
                  onClick={() => setActiveDecisionId(decision.id)}
                />
              ))}
            </div>
          )}
        </SectionCard>

        <div className="vs-stack">
          <SectionCard
            title="AI Executive Recommendation"
            subtitle="Primary recommended action with rationale and source-module traceability."
            right={<Badge tone={toneFromPriority(activeDecision?.priority)}>{activeDecision?.status || "open"}</Badge>}
          >
            {activeDecision ? (
              <div className="vs-stack">
                <div className="decision-intel-recommendation">
                  <div className="vs-page-eyebrow">Recommended Decision Path</div>
                  <h3>{activeDecision.recommendation || activeDecision.title}</h3>
                  <p className="vs-page-subtitle" style={{ margin: 0 }}>{activeDecision.rationale}</p>
                  <div className="decision-source-row">
                    {arr(activeDecision.source_modules).map((source) => (
                      <Badge key={source} tone="accent">{source}</Badge>
                    ))}
                  </div>
                </div>

                <div className="decision-score-grid">
                  <div className="decision-score-card"><span>Confidence</span><strong>{n(activeDecision.confidence_score)}%</strong><ScoreBar value={activeDecision.confidence_score} /></div>
                  <div className="decision-score-card"><span>Impact</span><strong>{n(activeDecision.impact_score)}%</strong><ScoreBar value={activeDecision.impact_score} /></div>
                  <div className="decision-score-card"><span>Urgency</span><strong>{n(activeDecision.urgency_score)}%</strong><ScoreBar value={activeDecision.urgency_score} /></div>
                  <div className="decision-score-card"><span>Risk</span><strong>{n(activeDecision.risk_score)}%</strong><ScoreBar value={activeDecision.risk_score} inverse /></div>
                </div>
              </div>
            ) : (
              <EmptyState text="No active executive decision selected." />
            )}
          </SectionCard>

          <SectionCard title="Decision Options" subtitle="Alternative paths with projected impact, risk, confidence, and timeline.">
            {arr(activeDecision?.options).length ? (
              <div className="vs-stack">
                {arr(activeDecision.options).map((option) => (
                  <div className="decision-option-card" key={option.id || option.label}>
                    <strong>{option.label}</strong>
                    <p>{option.description}</p>
                    <div className="decision-option-meta">
                      <Badge tone="active">Impact {option.projected_impact || 0}%</Badge>
                      <Badge tone="danger">Risk {option.projected_risk || 0}%</Badge>
                      <Badge tone="info">Confidence {option.confidence || 0}%</Badge>
                      <Badge tone="accent">{option.timeline || "7 days"}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState text="No decision options loaded yet." />
            )}
          </SectionCard>

          <SectionCard title="Executive Action Path" subtitle="Operational follow-through tied to the selected decision.">
            {arr(activeDecision?.actions).length ? (
              <div className="vs-stack">
                {arr(activeDecision.actions).map((action) => (
                  <div className="decision-action-card" key={action.id || action.action_label}>
                    <div className="decision-action-left">
                      <span className="decision-dot" />
                      <div>
                        <strong>{action.action_label}</strong>
                        <p>{action.owner || "Executive Team"} · {action.due_window || "72 hours"}</p>
                      </div>
                    </div>
                    <Badge tone="info">{action.status || "pending"}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState text="No action path generated yet." />
            )}
          </SectionCard>
        </div>

        <SectionCard
          title="Live Decision Signals"
          subtitle="Signals driving executive recommendations across the platform."
          right={<Badge tone="accent">{arr(data.signals).length} signals</Badge>}
        >
          <div className="vs-stack">
            {arr(data.signals).length ? arr(data.signals).map((signal) => <SignalRow key={signal.id || signal.title} signal={signal} />) : <EmptyState text="No live signals loaded." />}
          </div>
        </SectionCard>
      </div>
    </PageShell>
  );
}

