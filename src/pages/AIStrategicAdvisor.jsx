import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";

import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import ResponsiveRow from "../components/ui/ResponsiveRow";

function fmt(value) {
  return Number(value || 0).toLocaleString();
}

function pct(value) {
  return `${Number(value || 0).toFixed(0)}%`;
}

function arr(value) {
  return Array.isArray(value) ? value : [];
}

function tone(value) {
  const v = String(value || "").toLowerCase();
  if (["critical", "high"].includes(v) || Number(value) >= 85) return "danger";
  if (["elevated", "medium"].includes(v) || Number(value) >= 65) return "demo";
  if (["stable", "complete", "resolved"].includes(v)) return "active";
  return "accent";
}

function clean(value = "") {
  return String(value || "")
    .replace(/<a\b[^>]*>(.*?)<\/a>/gi, "$1")
    .replace(/<font\b[^>]*>(.*?)<\/font>/gi, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function RecommendationCard({ item }) {
  const actions = arr(item.recommended_actions);

  return (
    <div className="advisor-card">
      <ResponsiveRow
        title={clean(item.title)}
        subtitle={clean(item.why || item.expected_impact)}
        meta={[
          { label: "Category", value: item.category || "Advisor" },
          { label: "Priority", value: item.priority || "Medium" },
          { label: "State", value: item.state || "National" },
          { label: "Confidence", value: pct(item.confidence || 0) },
        ]}
        right={<Badge tone={tone(item.confidence || item.priority)}>{pct(item.confidence || 0)}</Badge>}
      />

      {actions.length ? (
        <div className="advisor-actions-list">
          {actions.map((action, index) => (
            <div key={`${action}-${index}`} className="advisor-action">
              <span>{index + 1}</span>
              <p>{action}</p>
            </div>
          ))}
        </div>
      ) : null}

      {item.expected_impact ? (
        <div className="advisor-impact">{item.expected_impact}</div>
      ) : null}
    </div>
  );
}

export default function AIStrategicAdvisor() {
  const [data, setData] = useState({
    summary: {},
    recommendations: [],
    ai_brief: {},
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");

  const load = useCallback(async ({ quiet = false } = {}) => {
    try {
      if (quiet) setRefreshing(true);
      else setLoading(true);

      setError("");

      const result = await api.aiStrategicAdvisor();

      setData({
        summary: result?.summary || {},
        recommendations: arr(result?.recommendations),
        ai_brief: result?.ai_brief || {},
        updated_at: result?.updated_at,
      });

      setLastUpdated(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.response?.data?.detail ||
          err?.message ||
          "Failed to load AI Strategic Advisor."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(() => load({ quiet: true }), 30000);
    return () => clearInterval(interval);
  }, [load]);

  const summary = data.summary || {};
  const recommendations = arr(data.recommendations);
  const brief = data.ai_brief || {};

  const topRecommendations = useMemo(
    () => recommendations.slice(0, 12),
    [recommendations]
  );

  return (
    <PageShell
      eyebrow="AI Strategic Advisor"
      title="AI Strategic Advisor"
      description="Turns Mission Control, political signals, CRM follow-ups, tasks, vendors, and workspace pressure into consultant-ready strategic recommendations."
      tickerItems={[
        {
          label: "Strategic Risk",
          value: summary.strategic_risk || "Stable",
          dotClass: ["Critical", "High"].includes(summary.strategic_risk)
            ? "vs-live-dot-warning"
            : "vs-live-dot-success",
        },
        {
          label: "Pressure",
          value: pct(summary.pressure_score || 0),
          dotClass: Number(summary.pressure_score || 0) >= 65
            ? "vs-live-dot-warning"
            : "vs-live-dot-success",
        },
        {
          label: "Recommendations",
          value: `${summary.recommendations || 0}`,
          dotClass: "vs-live-dot-success",
        },
        {
          label: "High Priority",
          value: `${summary.high_priority || 0}`,
          dotClass: summary.high_priority ? "vs-live-dot-warning" : "vs-live-dot-success",
        },
        {
          label: "Updated",
          value: refreshing ? "Live" : lastUpdated || "Ready",
          dotClass: refreshing ? "vs-live-dot-warning" : "vs-live-dot-success",
        },
      ]}
    >
      <style>{`
        .advisor-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.35fr) minmax(360px, 0.65fr);
          gap: 18px;
          align-items: start;
        }

        .advisor-stack {
          display: grid;
          gap: 14px;
        }

        .advisor-hero {
          border-radius: 30px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          background:
            radial-gradient(circle at top left, rgba(37, 99, 235, 0.24), transparent 34%),
            radial-gradient(circle at bottom right, rgba(16, 185, 129, 0.12), transparent 34%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(2, 6, 23, 0.84));
          padding: 22px;
        }

        .advisor-hero h2 {
          margin: 0;
          color: white;
          font-size: 32px;
          font-weight: 950;
          letter-spacing: -0.05em;
        }

        .advisor-hero p {
          margin: 10px 0 0;
          color: rgba(203, 213, 225, 0.74);
          font-size: 13px;
          line-height: 1.6;
        }

        .advisor-next-list {
          display: grid;
          gap: 10px;
          margin-top: 18px;
        }

        .advisor-next-item {
          border-radius: 16px;
          border: 1px solid rgba(96, 165, 250, 0.2);
          background: rgba(37, 99, 235, 0.12);
          padding: 12px;
          color: rgba(226, 232, 240, 0.94);
          font-size: 13px;
          line-height: 1.45;
        }

        .advisor-card {
          border-radius: 22px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          background:
            radial-gradient(circle at top right, rgba(59, 130, 246, 0.1), transparent 34%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.78), rgba(2, 6, 23, 0.54));
          overflow: hidden;
        }

        .advisor-card .vs-responsive-row {
          border: 0;
          background: transparent;
        }

        .advisor-actions-list {
          display: grid;
          gap: 8px;
          padding: 0 16px 16px;
        }

        .advisor-action {
          display: grid;
          grid-template-columns: 28px minmax(0, 1fr);
          gap: 10px;
          align-items: start;
          border-radius: 14px;
          background: rgba(15, 23, 42, 0.64);
          border: 1px solid rgba(148, 163, 184, 0.12);
          padding: 10px;
        }

        .advisor-action span {
          width: 24px;
          height: 24px;
          display: grid;
          place-items: center;
          border-radius: 999px;
          background: rgba(59, 130, 246, 0.18);
          color: white;
          font-size: 12px;
          font-weight: 900;
        }

        .advisor-action p {
          margin: 0;
          color: rgba(226, 232, 240, 0.9);
          font-size: 13px;
          line-height: 1.45;
        }

        .advisor-impact {
          margin: 0 16px 16px;
          border-radius: 14px;
          border: 1px solid rgba(34, 197, 94, 0.22);
          background: rgba(34, 197, 94, 0.1);
          color: rgba(220, 252, 231, 0.9);
          padding: 11px;
          font-size: 12px;
          line-height: 1.45;
        }

        .advisor-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 18px;
        }

        @media (max-width: 1100px) {
          .advisor-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}

      <div className="vs-grid-4">
        <StatCard label="Recommendations" value={fmt(summary.recommendations)} delta="Advisor queue" tone="up" />
        <StatCard label="High Priority" value={fmt(summary.high_priority)} delta="Immediate action" tone={summary.high_priority ? "down" : "up"} />
        <StatCard label="Open Tasks" value={fmt(summary.open_tasks)} delta="Execution pressure" tone={summary.open_tasks ? "neutral" : "up"} />
        <StatCard label="CRM Follow-Ups" value={fmt(summary.crm_followups)} delta="Stakeholder touches" tone={summary.crm_followups ? "neutral" : "up"} />
      </div>

      {loading ? (
        <EmptyState text="Loading AI Strategic Advisor..." />
      ) : (
        <div className="advisor-grid">
          <div className="advisor-stack">
            <div className="advisor-hero">
              <h2>{brief.headline || "Strategic advisory briefing"}</h2>
              <p>{brief.assessment || "Review ranked recommendations and assign owners."}</p>

              <div className="advisor-next-list">
                {arr(brief.next_24_hours).slice(0, 5).map((item, index) => (
                  <div key={`${item}-${index}`} className="advisor-next-item">
                    {index + 1}. {item}
                  </div>
                ))}
              </div>

              <div className="advisor-actions">
                <Link className="vs-button" to="/mission-control">Open Mission Control</Link>
                <Link className="vs-button vs-button-secondary" to="/command-center">Command Center</Link>
                <Link className="vs-button vs-button-secondary" to="/campaign-crm">Campaign CRM</Link>
                <button type="button" className="vs-button vs-button-secondary" onClick={() => load({ quiet: true })}>
                  Refresh
                </button>
              </div>
            </div>

            <SectionCard
              title="Ranked Strategic Recommendations"
              subtitle="AI-prioritized recommendations generated from Mission Control pressure."
              right={<Badge tone={topRecommendations.length ? "demo" : "active"}>{topRecommendations.length} recommendations</Badge>}
            >
              {!topRecommendations.length ? (
                <EmptyState text="No strategic recommendations available." />
              ) : (
                <div className="advisor-stack">
                  {topRecommendations.map((item) => (
                    <RecommendationCard key={item.id} item={item} />
                  ))}
                </div>
              )}
            </SectionCard>
          </div>

          <div className="advisor-stack">
            <SectionCard title="Source Pressure" subtitle="What is driving the advisory model.">
              <div className="advisor-stack">
                <RecommendationCard
                  item={{
                    id: "source-signals",
                    title: "Political signal pressure",
                    category: "Signals",
                    priority: summary.signals ? "Elevated" : "Stable",
                    state: "National",
                    confidence: summary.signals ? 70 : 40,
                    why: `${fmt(summary.signals)} signals are currently feeding the advisor model.`,
                    recommended_actions: [
                      "Review signal quality.",
                      "Prioritize elevated and high-risk states.",
                      "Convert high-value signals into tasks.",
                    ],
                    expected_impact: "Improves responsiveness to fast-moving political conditions.",
                  }}
                />

                <RecommendationCard
                  item={{
                    id: "source-tasks",
                    title: "Execution task pressure",
                    category: "Tasks",
                    priority: summary.open_tasks ? "Medium" : "Stable",
                    state: "National",
                    confidence: summary.open_tasks ? 68 : 40,
                    why: `${fmt(summary.open_tasks)} open tasks are contributing to operating pressure.`,
                    recommended_actions: [
                      "Assign owners.",
                      "Close stale tasks.",
                      "Escalate blocked execution work.",
                    ],
                    expected_impact: "Improves operating discipline across the firm.",
                  }}
                />

                <RecommendationCard
                  item={{
                    id: "source-crm",
                    title: "CRM follow-up pressure",
                    category: "CRM",
                    priority: summary.crm_followups ? "Medium" : "Stable",
                    state: "National",
                    confidence: summary.crm_followups ? 64 : 40,
                    why: `${fmt(summary.crm_followups)} stakeholder follow-ups are open.`,
                    recommended_actions: [
                      "Complete overdue follow-ups.",
                      "Log outcomes.",
                      "Connect important touches to workspaces.",
                    ],
                    expected_impact: "Improves consultant-client relationship management.",
                  }}
                />
              </div>
            </SectionCard>
          </div>
        </div>
      )}
    </PageShell>
  );
}
