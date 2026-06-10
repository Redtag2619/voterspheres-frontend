import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";

import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import ResponsiveRow from "../components/ui/ResponsiveRow";

function arr(value) {
  return Array.isArray(value) ? value : [];
}

function tone(value) {
  const v = String(value || "").toLowerCase();
  if (["blocked", "do not launch", "not ready"].includes(v)) return "danger";
  if (["needs review", "launch with review"].includes(v)) return "demo";
  if (["launch ready", "ready to launch"].includes(v)) return "active";
  return "accent";
}

export default function LaunchReadinessDashboard() {
  const [data, setData] = useState({
    summary: {},
    gates: [],
    next_actions: [],
    source_errors: [],
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

      const result = await api.launchReadiness();

      setData({
        summary: result?.summary || {},
        gates: arr(result?.gates),
        next_actions: arr(result?.next_actions),
        source_errors: arr(result?.source_errors),
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
          "Failed to load Launch Readiness Dashboard."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const summary = data.summary || {};
  const gates = arr(data.gates);
  const nextActions = arr(data.next_actions);
  const sourceErrors = arr(data.source_errors);

  return (
    <PageShell
      eyebrow="Final Launch Gate"
      title="Launch Readiness Dashboard"
      description="The executive launch decision layer for VoterSpheres. Combines Production Hardening, Launch QA, Live Intelligence, KPI risk, Opportunity Engine, and Executive Workspace readiness."
      tickerItems={[
        {
          label: "Decision",
          value: summary.launch_decision || "Checking",
          dotClass:
            summary.launch_decision === "Ready To Launch"
              ? "vs-live-dot-success"
              : summary.launch_decision === "Do Not Launch"
              ? "vs-live-dot"
              : "vs-live-dot-warning",
        },
        { label: "Score", value: `${summary.score || 0}%`, dotClass: "vs-live-dot-warning" },
        { label: "Blockers", value: `${summary.blockers || 0}`, dotClass: summary.blockers ? "vs-live-dot" : "vs-live-dot-success" },
        { label: "Updated", value: refreshing ? "Refreshing" : lastUpdated || "Ready", dotClass: "vs-live-dot-success" },
      ]}
    >
      <style>{`
        .launch-grid {
          display: grid;
          grid-template-columns: minmax(0, .95fr) minmax(360px, .65fr);
          gap: 18px;
          align-items: start;
        }

        .launch-stack {
          display: grid;
          gap: 14px;
        }

        .launch-command {
          border-radius: 30px;
          border: 1px solid rgba(148, 163, 184, .16);
          background:
            radial-gradient(circle at top left, rgba(251, 146, 60, .18), transparent 34%),
            radial-gradient(circle at bottom right, rgba(37, 99, 235, .16), transparent 34%),
            linear-gradient(135deg, rgba(15, 23, 42, .98), rgba(2, 6, 23, .88));
          padding: 26px;
          box-shadow: 0 18px 60px rgba(0,0,0,.32);
        }

        .launch-decision {
          margin-top: 18px;
          color: white;
          font-size: clamp(42px, 7vw, 82px);
          line-height: .94;
          font-weight: 950;
          letter-spacing: -.08em;
        }

        .launch-score {
          margin-top: 12px;
          color: rgba(203, 213, 225, .8);
          font-size: 16px;
          font-weight: 800;
        }

        .launch-sub {
          color: rgba(203, 213, 225, .74);
          font-size: 13px;
          line-height: 1.7;
          max-width: 780px;
          margin-top: 12px;
        }

        .launch-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 18px;
        }

        .launch-row {
          border-radius: 20px;
          border: 1px solid rgba(148, 163, 184, .16);
          background:
            radial-gradient(circle at top right, rgba(59, 130, 246, .1), transparent 34%),
            linear-gradient(135deg, rgba(15, 23, 42, .78), rgba(2, 6, 23, .54));
          overflow: hidden;
        }

        .launch-row.ready {
          border-color: rgba(34, 197, 94, .28);
        }

        .launch-row.review {
          border-color: rgba(251, 146, 60, .34);
        }

        .launch-row.blocked {
          border-color: rgba(248, 113, 113, .4);
        }

        .launch-row .vs-responsive-row {
          border: 0;
          background: transparent;
        }

        @media (max-width: 1100px) {
          .launch-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}

      <div className="vs-grid-4">
        <StatCard label="Launch Score" value={`${summary.score || 0}%`} delta={summary.status || "Checking"} tone={summary.blockers ? "down" : "up"} />
        <StatCard label="Ready Gates" value={`${summary.ready_gates || 0}/${summary.total_gates || 0}`} delta="Major systems" tone="up" />
        <StatCard label="Blockers" value={summary.blockers || 0} delta="Must resolve" tone={summary.blockers ? "down" : "up"} />
        <StatCard label="Needs Review" value={summary.review || 0} delta="Warnings" tone="neutral" />
      </div>

      {loading ? (
        <EmptyState text="Calculating final launch readiness..." />
      ) : (
        <div className="launch-grid">
          <div className="launch-stack">
            <div className="launch-command">
              <Badge tone={tone(summary.launch_decision)}>
                {summary.launch_decision || "Checking"}
              </Badge>

              <div className="launch-decision">
                {summary.launch_decision || "Checking"}
              </div>

              <div className="launch-score">
                Launch Score: {summary.score || 0}% • National Risk: {summary.national_risk || 0}% • Live Readiness: {summary.live_readiness || 0}%
              </div>

              <div className="launch-sub">
                This is the final executive launch gate. If blockers are present, resolve them before public launch. If the dashboard says Ready To Launch, move into pre-launch content, pricing, onboarding, and production deployment checks.
              </div>

              <div className="launch-actions">
                <button className="vs-button" onClick={() => load({ quiet: true })}>
                  {refreshing ? "Refreshing..." : "Refresh Launch Gate"}
                </button>
                <Link className="vs-button vs-button-secondary" to="/production-hardening">
                  Production Hardening
                </Link>
                <Link className="vs-button vs-button-secondary" to="/launch-qa">
                  Launch QA
                </Link>
                <Link className="vs-button vs-button-secondary" to="/live-intelligence-layer">
                  Live Intelligence
                </Link>
              </div>
            </div>

            <SectionCard title="Launch Gates" subtitle="Major readiness gates combined into one launch decision." right={<Badge tone="accent">{gates.length}</Badge>}>
              <div className="launch-stack">
                {!gates.length ? (
                  <EmptyState text="No launch gates returned." />
                ) : (
                  gates.map((gate) => {
                    const rowClass =
                      gate.blockers > 0 || gate.status === "Blocked" || gate.status === "Not Ready"
                        ? "blocked"
                        : gate.status === "Needs Review"
                        ? "review"
                        : "ready";

                    return (
                      <div key={gate.key} className={`launch-row ${rowClass}`}>
                        <ResponsiveRow
                          title={gate.label}
                          subtitle={gate.detail}
                          meta={[
                            { label: "Score", value: `${gate.score}%` },
                            { label: "Status", value: gate.status },
                            { label: "Blockers", value: gate.blockers },
                            { label: "Review", value: gate.review },
                          ]}
                          right={
                            <div style={{ display: "grid", gap: 8, justifyItems: "end" }}>
                              <Badge tone={tone(gate.status)}>{gate.status}</Badge>
                              <Link className="vs-button vs-button-secondary" to={gate.route}>
                                Open
                              </Link>
                            </div>
                          }
                        />
                      </div>
                    );
                  })
                )}
              </div>
            </SectionCard>
          </div>

          <div className="launch-stack">
            <SectionCard title="Next Actions" subtitle="Prioritized actions before launch." right={<Badge tone={nextActions.length ? "demo" : "active"}>{nextActions.length}</Badge>}>
              <div className="launch-stack">
                {!nextActions.length ? (
                  <EmptyState text="No required launch actions detected." />
                ) : (
                  nextActions.map((item) => (
                    <div key={item.key} className="launch-row review">
                      <ResponsiveRow
                        title={item.title}
                        subtitle={item.detail}
                        meta={[
                          { label: "Priority", value: item.priority },
                          { label: "Route", value: item.route },
                          { label: "Action", value: "Review and resolve" },
                          { label: "Launch", value: "Pre-launch" },
                        ]}
                        right={
                          <Link className="vs-button vs-button-secondary" to={item.route}>
                            Open
                          </Link>
                        }
                      />
                    </div>
                  ))
                )}
              </div>
            </SectionCard>

            <SectionCard title="Source Errors" subtitle="Subsystems that failed to report into this launch gate." right={<Badge tone={sourceErrors.length ? "danger" : "active"}>{sourceErrors.length}</Badge>}>
              <div className="launch-stack">
                {!sourceErrors.length ? (
                  <EmptyState text="All readiness sources reported successfully." />
                ) : (
                  sourceErrors.map((item) => (
                    <div key={item.source} className="launch-row blocked">
                      <ResponsiveRow
                        title={item.source}
                        subtitle={item.error || "Unknown error"}
                        meta={[
                          { label: "Status", value: "Source Error" },
                          { label: "Impact", value: "Readiness may be incomplete" },
                          { label: "Action", value: "Open server logs" },
                          { label: "Priority", value: "High" },
                        ]}
                      />
                    </div>
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
