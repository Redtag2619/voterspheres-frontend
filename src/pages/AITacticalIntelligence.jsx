import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  if (v === "elevated" || v === "medium") return "demo";
  if (v === "stable" || v === "positive") return "active";
  if (v === "negative") return "danger";
  return "accent";
}

function actionTarget(item = {}) {
  const type = String(item.type || "").toLowerCase();

  if (type.includes("narrative")) return "/narrative-intelligence";
  if (type.includes("fec") || type.includes("fundraising") || type.includes("political_signal")) return "/political-signals";
  if (type.includes("county")) return item.state && item.state !== "National" ? `/state-operations/${item.state}` : "/state-operations";
  if (type.includes("blocked") || type.includes("priority") || type.includes("task")) return "/command-center";

  return "/political-signals";
}

function actionLabel(item = {}) {
  const type = String(item.type || "").toLowerCase();

  if (type.includes("narrative")) return "Open Narrative";
  if (type.includes("fec") || type.includes("fundraising") || type.includes("political_signal")) return "Open Signals";
  if (type.includes("county")) return "Open State Ops";
  if (type.includes("blocked") || type.includes("priority") || type.includes("task")) return "Open Command";
  return "Investigate";
}

function WorkspaceIntelRow({ item }) {
  const workspacePath =
    item.workspace_id && item.workspace_id !== "national-signals"
      ? `/campaign-workspace/${item.workspace_id}`
      : "/political-signals";

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
          { label: "Signals", value: fmt(item.political_signals) },
          { label: "Narrative", value: fmt(item.narrative_signals) },
          { label: "FEC", value: fmt(item.fec_signals) },
        ]}
        right={
          <div className="ai-actions">
            <Badge tone={tone(item.risk)}>{item.risk || "Stable"}</Badge>
            <Link className="vs-button vs-button-secondary ai-small-btn" to={workspacePath}>
              Open
            </Link>
          </div>
        }
      />
    </div>
  );
}

function RecommendationRow({ item, onCreateTask, creatingKey, onEscalate }) {
  const key = `${item.workspace_id || "national"}-${item.type || "signal"}-${item.title || ""}`;
  const creating = creatingKey === key;

  return (
    <div className={`ai-rec ai-${String(item.severity || "stable").toLowerCase()}`}>
      <ResponsiveRow
        title={item.title || "AI tactical recommendation"}
        subtitle={item.action || "Review this recommendation and decide whether to escalate."}
        meta={[
          { label: "Workspace", value: item.workspace_name || "Workspace" },
          { label: "State", value: item.state || "National" },
          { label: "Type", value: item.type || "signal" },
          { label: "Severity", value: item.severity || "Stable" },
          { label: "Source", value: item.source || "AI Tactical" },
          { label: "Signals", value: item.signal_count || "—" },
        ]}
        right={
          <div className="ai-actions">
            <Badge tone={tone(item.severity)}>{item.severity || "Signal"}</Badge>

            <Link className="vs-button vs-button-secondary ai-small-btn" to={actionTarget(item)}>
              {actionLabel(item)}
            </Link>

            {item.workspace_id && item.workspace_id !== "national-signals" ? (
              <Link className="vs-button vs-button-secondary ai-small-btn" to={`/campaign-workspace/${item.workspace_id}`}>
                Workspace
              </Link>
            ) : null}

            <button
              type="button"
              className="vs-button ai-small-btn"
              onClick={() => onCreateTask(item, key)}
              disabled={creating}
            >
              {creating ? "Creating..." : "Create Task"}
            </button>

            <button
              type="button"
              className="vs-button vs-button-secondary ai-small-btn"
              onClick={() => onEscalate(item)}
            >
              Escalate
            </button>
          </div>
        }
      />
    </div>
  );
}

export default function AITacticalIntelligence() {
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creatingKey, setCreatingKey] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
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

  async function handleCreateTask(item, key) {
    try {
      setCreatingKey(key);
      setMessage("");
      setError("");

      if (typeof api.createAiTacticalTask !== "function") {
        throw new Error("Missing api.createAiTacticalTask. Add createAiTacticalTask to src/services/api.js.");
      }

      const result = await api.createAiTacticalTask({
        title: item.title || "AI Tactical Recommendation",
        action: item.action || "",
        type: item.type || "recommendation",
        severity: item.severity || "medium",
        source: item.source || "AI Tactical Intelligence",
        state: item.state || null,
        workspace_id: item.workspace_id || null,
        workspace_name: item.workspace_name || "",
        signal_count: item.signal_count || 0,
      });

      setMessage(`Command task created${result?.task?.id ? ` #${result.task.id}` : ""}.`);
      await load({ quiet: true });
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Failed to create AI Tactical task.");
    } finally {
      setCreatingKey("");
    }
  }

  function handleEscalate(item) {
    const target = actionTarget(item);
    navigate(target);
  }

  async function runRefreshImports() {
    setMessage("Run backend imports from PowerShell: npm run signals:fec and npm run signals:news, then refresh this page.");
  }

  const summary = data?.summary || {};
  const workspaces = data?.workspaces || [];
  const recs = data?.top_recommendations || [];

  const riskCount = useMemo(
    () => workspaces.filter((item) => ["Critical", "High"].includes(item.risk)).length,
    [workspaces]
  );

  const signalCount = Number(summary.political_signals || 0);
  const narrativeCount = Number(summary.narrative_signals || 0);
  const fecCount = Number(summary.fec_signals || 0);

  return (
    <PageShell
      eyebrow="AI Tactical Action Center"
      title="AI Tactical Action Center"
      description="Convert AI recommendations, political signals, FEC movement, narrative pressure, county escalations, and workspace risk into executable command tasks."
      tickerItems={[
        {
          label: "Pressure",
          value: pct(summary.national_pressure),
          dotClass: summary.national_pressure >= 65 ? "vs-live-dot-warning" : "vs-live-dot-success",
        },
        {
          label: "Risk Workspaces",
          value: `${riskCount}`,
          dotClass: riskCount ? "vs-live-dot-warning" : "vs-live-dot-success",
        },
        {
          label: "Signals",
          value: `${signalCount}`,
          dotClass: signalCount ? "vs-live-dot-warning" : "vs-live-dot-success",
        },
        {
          label: "Updated",
          value: refreshing ? "Live" : lastUpdated || "Ready",
          dotClass: refreshing ? "vs-live-dot-warning" : "vs-live-dot-success",
        },
      ]}
    >
      <style>{`
        .ai-layout {
          display: grid;
          grid-template-columns: minmax(0, 1.2fr) minmax(380px, 0.8fr);
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

        .ai-elevated,
        .ai-medium {
          border-color: rgba(251, 191, 36, 0.3);
        }

        .ai-stable {
          border-color: rgba(34, 197, 94, 0.22);
        }

        .ai-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 8px;
          flex-wrap: wrap;
        }

        .ai-small-btn {
          padding: 8px 12px;
          font-size: 12px;
          white-space: nowrap;
          text-decoration: none;
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

        .ai-brain-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
          margin-top: 18px;
        }

        .ai-brain-grid div {
          border-radius: 16px;
          border: 1px solid rgba(148, 163, 184, 0.13);
          background: rgba(2, 6, 23, 0.32);
          padding: 12px;
        }

        .ai-brain-grid span {
          display: block;
          color: rgba(203, 213, 225, 0.64);
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
        }

        .ai-brain-grid b {
          display: block;
          margin-top: 5px;
          color: white;
          font-size: 20px;
        }

        .ai-action-strip {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 18px;
        }

        .ai-message {
          border-radius: 16px;
          border: 1px solid rgba(96, 165, 250, 0.24);
          background: rgba(37, 99, 235, 0.14);
          color: rgba(226, 232, 240, 0.92);
          padding: 12px;
          margin-bottom: 14px;
        }

        @media (max-width: 1100px) {
          .ai-layout,
          .ai-brain-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}
      {message ? <div className="ai-message">{message}</div> : null}

      <div className="vs-grid-4">
        <StatCard
          label="National Pressure"
          value={pct(summary.national_pressure)}
          delta="AI tactical pressure"
          tone={summary.national_pressure >= 65 ? "down" : "up"}
        />
        <StatCard
          label="Political Signals"
          value={fmt(signalCount)}
          delta={`${fmt(narrativeCount)} narrative`}
          tone={signalCount ? "neutral" : "up"}
        />
        <StatCard
          label="FEC Signals"
          value={fmt(fecCount)}
          delta="Fundraising / FEC"
          tone={fecCount ? "neutral" : "up"}
        />
        <StatCard
          label="Recommendations"
          value={fmt(summary.total_recommendations)}
          delta="Actionable insights"
          tone="up"
        />
      </div>

      {loading ? (
        <EmptyState text="Loading AI tactical action center..." />
      ) : (
        <div className="ai-layout">
          <div className="ai-stack">
            <SectionCard
              title="Workspace Tactical Ranking"
              subtitle="AI-ranked pressure by campaign workspace and national political signal stream."
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
                AI tactical pressure score across campaign workspaces, FEC signals, narrative pressure, political signals, and county operations.
              </div>

              <div className="ai-brain-grid">
                <div><span>Critical Signals</span><b>{fmt(summary.critical_signals)}</b></div>
                <div><span>High Signals</span><b>{fmt(summary.high_signals)}</b></div>
                <div><span>Narrative</span><b>{fmt(narrativeCount)}</b></div>
                <div><span>FEC</span><b>{fmt(fecCount)}</b></div>
              </div>

              <div className="ai-action-strip">
                <Link className="vs-button vs-button-secondary ai-small-btn" to="/political-signals">
                  Political Signals
                </Link>
                <Link className="vs-button vs-button-secondary ai-small-btn" to="/narrative-intelligence">
                  Narrative Intel
                </Link>
                <Link className="vs-button vs-button-secondary ai-small-btn" to="/command-center">
                  Command Center
                </Link>
                <button type="button" className="vs-button vs-button-secondary ai-small-btn" onClick={() => load({ quiet: true })}>
                  Refresh
                </button>
                <button type="button" className="vs-button ai-small-btn" onClick={runRefreshImports}>
                  Import Reminder
                </button>
              </div>
            </div>

            <SectionCard
              title="Actionable Recommendations"
              subtitle="Create tasks, open source intelligence, or escalate recommendations into command workflows."
              right={<Badge tone={recs.length ? "demo" : "active"}>{recs.length} actions</Badge>}
            >
              <div className="ai-stack">
                {!recs.length ? (
                  <EmptyState text="No tactical recommendations currently detected." />
                ) : (
                  recs.map((item, index) => (
                    <RecommendationRow
                      key={`${item.workspace_id}-${item.type}-${index}`}
                      item={item}
                      creatingKey={creatingKey}
                      onCreateTask={handleCreateTask}
                      onEscalate={handleEscalate}
                    />
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
