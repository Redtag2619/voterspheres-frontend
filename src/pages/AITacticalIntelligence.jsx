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

function tone(value) {
  const v = String(value || "").toLowerCase();
  if (v === "critical" || v === "high") return "danger";
  if (v === "elevated") return "demo";
  if (v === "stable") return "active";
  return "accent";
}

function WorkspaceIntelRow({ item }) {
  return (
    <div className={`ai-row ai-${String(item.risk || "stable").toLowerCase()}`}>
      <ResponsiveRow
        title={item.workspace_name || "Workspace"}
        subtitle={`${item.state || "National"} • ${item.office || "Statewide"}`}
        meta={[
          { label: "Pressure", value: pct(item.pressure_score) },
          { label: "Open", value: fmt(item.open_tasks) },
          { label: "Blocked", value: fmt(item.blocked_tasks) },
          { label: "High", value: fmt(item.high_priority_tasks) },
          { label: "County Esc.", value: fmt(item.county_escalations) },
        ]}
        right={
          <div className="ai-actions">
            <Badge tone={tone(item.risk)}>{item.risk || "Stable"}</Badge>
            <Link className="vs-button vs-button-secondary" to={`/campaign-workspace/${item.workspace_id}`}>
              Open
            </Link>
          </div>
        }
      />
    </div>
  );
}

function RecommendationRow({ item }) {
  return (
    <div className={`ai-rec ai-${String(item.severity || "stable").toLowerCase()}`}>
      <ResponsiveRow
        title={item.title}
        subtitle={item.action}
        meta={[
          { label: "Workspace", value: item.workspace_name || "Workspace" },
          { label: "State", value: item.state || "National" },
          { label: "Type", value: item.type || "signal" },
          { label: "Severity", value: item.severity || "Stable" },
        ]}
        right={<Badge tone={tone(item.severity)}>{item.severity || "Signal"}</Badge>}
      />
    </div>
  );
}

export default function AITacticalIntelligence() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");

  const load = useCallback(async ({ quiet = false } = {}) => {
    try {
      if (quiet) setRefreshing(true);
      else setLoading(true);

      setError("");
      const result = await api.aiTacticalDashboard();
      setData(result || {});
      setLastUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Failed to load AI tactical intelligence.");
      setData({ summary: {}, workspaces: [], top_recommendations: [] });
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

  const summary = data?.summary || {};
  const workspaces = data?.workspaces || [];
  const recs = data?.top_recommendations || [];

  const riskCount = useMemo(
    () => workspaces.filter((item) => ["Critical", "High"].includes(item.risk)).length,
    [workspaces]
  );

  return (
    <PageShell
      eyebrow="AI Tactical Intelligence"
      title="AI Tactical Intelligence Layer"
      description="Strategic recommendations generated from workspace pressure, county escalations, task aging, blocked execution, and operational risk."
      tickerItems={[
        { label: "Pressure", value: pct(summary.national_pressure), dotClass: summary.national_pressure >= 65 ? "vs-live-dot-warning" : "vs-live-dot-success" },
        { label: "Risk Workspaces", value: `${riskCount}`, dotClass: riskCount ? "vs-live-dot-warning" : "vs-live-dot-success" },
        { label: "Recommendations", value: `${summary.total_recommendations || 0}`, dotClass: "vs-live-dot-success" },
        { label: "Updated", value: refreshing ? "Live" : lastUpdated || "Ready", dotClass: refreshing ? "vs-live-dot-warning" : "vs-live-dot-success" },
      ]}
    >
      <style>{`
        .ai-layout {
          display: grid;
          grid-template-columns: minmax(0, 1.2fr) minmax(360px, 0.8fr);
          gap: 18px;
          align-items: start;
        }

        .ai-stack {
          display: grid;
          gap: 14px;
        }

        .ai-row,
        .ai-rec {
          border-radius: 20px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          background:
            radial-gradient(circle at top right, rgba(59, 130, 246, 0.1), transparent 34%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.78), rgba(2, 6, 23, 0.54));
          overflow: hidden;
        }

        .ai-row .vs-responsive-row,
        .ai-rec .vs-responsive-row {
          border: 0;
          background: transparent;
        }

        .ai-critical,
        .ai-high {
          border-color: rgba(248, 113, 113, 0.34);
        }

        .ai-elevated {
          border-color: rgba(251, 191, 36, 0.3);
        }

        .ai-stable {
          border-color: rgba(34, 197, 94, 0.22);
        }

        .ai-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
          flex-wrap: wrap;
        }

        .ai-brain {
          border-radius: 28px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          background:
            radial-gradient(circle at top left, rgba(37, 99, 235, 0.22), transparent 36%),
            radial-gradient(circle at bottom right, rgba(168, 85, 247, 0.16), transparent 34%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.94), rgba(2, 6, 23, 0.82));
          padding: 24px;
        }

        .ai-brain-score {
          color: white;
          font-size: 64px;
          font-weight: 950;
          letter-spacing: -0.08em;
          line-height: 1;
        }

        .ai-brain-label {
          margin-top: 8px;
          color: rgba(203, 213, 225, 0.72);
          font-size: 13px;
        }

        @media (max-width: 1100px) {
          .ai-layout {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}

      <div className="vs-grid-4">
        <StatCard label="National Pressure" value={pct(summary.national_pressure)} delta="AI tactical pressure" tone={summary.national_pressure >= 65 ? "down" : "up"} />
        <StatCard label="Workspaces" value={fmt(summary.workspaces)} delta="Campaign operating rooms" tone="up" />
        <StatCard label="Critical" value={fmt(summary.critical)} delta={`${fmt(summary.high)} high`} tone={summary.critical ? "down" : "up"} />
        <StatCard label="Recommendations" value={fmt(summary.total_recommendations)} delta="Actionable insights" tone="up" />
      </div>

      {loading ? (
        <EmptyState text="Loading AI tactical intelligence..." />
      ) : (
        <div className="ai-layout">
          <div className="ai-stack">
            <SectionCard
              title="Workspace Tactical Ranking"
              subtitle="AI-ranked pressure by campaign workspace."
              right={<Badge tone="accent">{workspaces.length} workspaces</Badge>}
            >
              <div className="ai-stack">
                {!workspaces.length ? (
                  <EmptyState text="No workspaces found." />
                ) : (
                  workspaces.map((item) => <WorkspaceIntelRow key={item.workspace_id} item={item} />)
                )}
              </div>
            </SectionCard>
          </div>

          <div className="ai-stack">
            <div className="ai-brain">
              <div className="ai-brain-score">{pct(summary.national_pressure)}</div>
              <div className="ai-brain-label">
                AI tactical pressure score across all campaign workspaces.
              </div>
            </div>

            <SectionCard
              title="Top Recommendations"
              subtitle="Recommended executive actions generated from live workspace signals."
              right={<Badge tone={recs.length ? "demo" : "active"}>{recs.length} actions</Badge>}
            >
              <div className="ai-stack">
                {!recs.length ? (
                  <EmptyState text="No tactical recommendations currently detected." />
                ) : (
                  recs.map((item, index) => (
                    <RecommendationRow key={`${item.workspace_id}-${item.type}-${index}`} item={item} />
                  ))
                )}
              </div>
            </SectionCard>
          </div>
        </div>
      )}
    </PageShell>
  );
}
