import React, { useEffect, useMemo, useState } from "react";
import {
  fetchDecisionIntelligence,
  seedDecisionIntelligence,
} from "../api/decisionIntelligenceApi";
import "./ExecutiveDecisionIntelligence.css";

export default function ExecutiveDecisionIntelligence() {
  const [data, setData] = useState(null);
  const [activeDecisionId, setActiveDecisionId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [seedLoading, setSeedLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadData() {
    try {
      setLoading(true);
      setError("");
      const result = await fetchDecisionIntelligence(1);
      setData(result);
      if (!activeDecisionId && result.decisions?.length) {
        setActiveDecisionId(result.decisions[0].id);
      }
    } catch (err) {
      setError(err.message || "Decision intelligence unavailable.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSeed() {
    try {
      setSeedLoading(true);
      await seedDecisionIntelligence(1);
      await loadData();
    } catch (err) {
      setError(err.message || "Unable to seed module.");
    } finally {
      setSeedLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const activeDecision = useMemo(() => {
    return data?.decisions?.find((item) => item.id === activeDecisionId);
  }, [data, activeDecisionId]);

  return (
    <div className="decision-page">
      <section className="decision-hero">
        <div>
          <p className="decision-eyebrow">Build 2D · Executive Decision Intelligence</p>
          <h1>Executive Decision Intelligence</h1>
          <p>
            Cross-module decision center synthesizing forecast, coalition,
            influence, strategy, operations, vendor, and political graph signals.
          </p>
        </div>

        <div className="decision-hero-actions">
          <button onClick={loadData}>Refresh Intelligence</button>
          <button className="secondary" onClick={handleSeed} disabled={seedLoading}>
            {seedLoading ? "Seeding..." : "Seed Demo Intelligence"}
          </button>
        </div>
      </section>

      {error && <div className="decision-error">{error}</div>}

      {loading ? (
        <div className="decision-loading">Loading executive intelligence...</div>
      ) : (
        <>
          <section className="decision-kpis">
            <Kpi label="Open Decisions" value={data?.summary?.openDecisions ?? 0} />
            <Kpi label="High Priority" value={data?.summary?.highPriority ?? 0} />
            <Kpi label="Avg Confidence" value={`${data?.summary?.avgConfidence ?? 0}%`} />
            <Kpi label="Avg Risk" value={`${data?.summary?.avgRisk ?? 0}%`} />
            <Kpi label="Live Signals" value={data?.summary?.liveSignals ?? 0} />
          </section>

          <section className="decision-grid">
            <aside className="decision-list-panel">
              <div className="panel-header">
                <h2>Decision Queue</h2>
                <span>{data?.decisions?.length || 0} active</span>
              </div>

              <div className="decision-list">
                {data?.decisions?.map((decision) => (
                  <button
                    key={decision.id}
                    className={
                      activeDecisionId === decision.id
                        ? "decision-card active"
                        : "decision-card"
                    }
                    onClick={() => setActiveDecisionId(decision.id)}
                  >
                    <div className="decision-card-top">
                      <span className={`priority ${decision.priority}`}>
                        {decision.priority}
                      </span>
                      <span>{decision.decision_type}</span>
                    </div>
                    <h3>{decision.title}</h3>
                    <div className="decision-meter-row">
                      <Meter label="Impact" value={decision.impact_score} />
                      <Meter label="Risk" value={decision.risk_score} />
                    </div>
                  </button>
                ))}
              </div>
            </aside>

            <main className="decision-detail-panel">
              {activeDecision ? (
                <>
                  <div className="panel-header">
                    <div>
                      <h2>{activeDecision.title}</h2>
                      <p>{activeDecision.rationale}</p>
                    </div>
                    <span className={`status ${activeDecision.status}`}>
                      {activeDecision.status}
                    </span>
                  </div>

                  <section className="recommendation-box">
                    <p className="decision-eyebrow">AI Executive Recommendation</p>
                    <h3>{activeDecision.recommendation}</h3>
                    <div className="source-row">
                      {activeDecision.source_modules?.map((source) => (
                        <span key={source}>{source}</span>
                      ))}
                    </div>
                  </section>

                  <section className="score-grid">
                    <Score label="Confidence" value={activeDecision.confidence_score} />
                    <Score label="Impact" value={activeDecision.impact_score} />
                    <Score label="Urgency" value={activeDecision.urgency_score} />
                    <Score label="Risk" value={activeDecision.risk_score} inverse />
                  </section>

                  <section className="options-panel">
                    <h3>Decision Options</h3>
                    <div className="option-list">
                      {activeDecision.options?.map((option) => (
                        <div className="option-card" key={option.id}>
                          <div>
                            <strong>{option.label}</strong>
                            <p>{option.description}</p>
                          </div>
                          <div className="option-meta">
                            <span>Impact {option.projected_impact}%</span>
                            <span>Risk {option.projected_risk}%</span>
                            <span>Confidence {option.confidence}%</span>
                            <span>{option.timeline}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="actions-panel">
                    <h3>Executive Action Path</h3>
                    <div className="action-list">
                      {activeDecision.actions?.map((action) => (
                        <div className="action-card" key={action.id}>
                          <span className="pulse-dot" />
                          <div>
                            <strong>{action.action_label}</strong>
                            <p>{action.owner} · {action.due_window}</p>
                          </div>
                          <span>{action.status}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                </>
              ) : (
                <div className="empty-state">
                  No executive decisions found. Seed the module to initialize.
                </div>
              )}
            </main>

            <aside className="signals-panel">
              <div className="panel-header">
                <h2>Live Signals</h2>
                <span>Real-time</span>
              </div>

              <div className="signal-list">
                {data?.signals?.map((signal) => (
                  <div className="signal-card" key={signal.id}>
                    <div className="signal-top">
                      <span className={`severity ${signal.severity}`}>
                        {signal.severity}
                      </span>
                      <span>{signal.source_module}</span>
                    </div>
                    <h3>{signal.title}</h3>
                    <p>{signal.description}</p>
                    {signal.state_code && <small>{signal.state_code}</small>}
                  </div>
                ))}
              </div>
            </aside>
          </section>
        </>
      )}
    </div>
  );
}

function Kpi({ label, value }) {
  return (
    <div className="kpi-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Meter({ label, value }) {
  return (
    <div className="mini-meter">
      <span>{label}</span>
      <div>
        <i style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
    </div>
  );
}

function Score({ label, value, inverse }) {
  return (
    <div className="score-card">
      <span>{label}</span>
      <strong>{value}%</strong>
      <div className={inverse ? "score-bar inverse" : "score-bar"}>
        <i style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
    </div>
  );
}
