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
  if (["false", "missing", "not ready"].includes(v)) return "danger";
  if (["review", "needs seed"].includes(v)) return "demo";
  if (["true", "ready", "completed"].includes(v)) return "active";
  return "accent";
}

function titleCase(value = "") {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function LaunchDataSeeder() {
  const [data, setData] = useState({
    summary: {},
    counts: {},
    targets: {},
    readiness: [],
    last_run: null,
  });

  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const result = await api.launchDataSeeder();

      setData({
        summary: result?.summary || {},
        counts: result?.counts || {},
        targets: result?.targets || {},
        readiness: arr(result?.readiness),
        last_run: result?.last_run || null,
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
          "Failed to load Launch Data Seeder."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function runSeeder() {
    const ok = window.confirm(
      "Run Launch Data Seeder? This will add demo-launch records if they do not already exist."
    );

    if (!ok) return;

    try {
      setRunning(true);
      setError("");
      setMessage("");

      const result = await api.runLaunchDataSeeder();
      setMessage(result?.message || "Launch demo data seeded.");
      await load();
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.response?.data?.detail ||
          err?.message ||
          "Failed to run Launch Data Seeder."
      );
    } finally {
      setRunning(false);
    }
  }

  const summary = data.summary || {};
  const readiness = arr(data.readiness);

  return (
    <PageShell
      eyebrow="Launch Data"
      title="Launch Data Seeder"
      description="Populate realistic demo-launch records for vendors, tasks, CRM, clients, reports, revenue pipeline, notifications, and workspaces so VoterSpheres looks alive during demos and launch QA."
      tickerItems={[
        {
          label: "Seed Readiness",
          value: `${summary.readiness_score || 0}%`,
          dotClass:
            summary.readiness_score >= 85
              ? "vs-live-dot-success"
              : summary.readiness_score >= 60
              ? "vs-live-dot-warning"
              : "vs-live-dot",
        },
        { label: "Ready", value: `${summary.ready_items || 0}/${summary.total_items || 0}`, dotClass: "vs-live-dot-success" },
        { label: "Needs Seed", value: `${summary.needs_seed || 0}`, dotClass: summary.needs_seed ? "vs-live-dot-warning" : "vs-live-dot-success" },
        { label: "Updated", value: lastUpdated || "Ready", dotClass: "vs-live-dot-success" },
      ]}
    >
      <style>{`
        .seed-grid {
          display: grid;
          grid-template-columns: minmax(0, .82fr) minmax(0, 1.18fr);
          gap: 18px;
          align-items: start;
        }

        .seed-stack {
          display: grid;
          gap: 14px;
        }

        .seed-command {
          border-radius: 30px;
          border: 1px solid rgba(148, 163, 184, .16);
          background:
            radial-gradient(circle at top left, rgba(251, 146, 60, .18), transparent 34%),
            radial-gradient(circle at bottom right, rgba(37, 99, 235, .16), transparent 34%),
            linear-gradient(135deg, rgba(15, 23, 42, .98), rgba(2, 6, 23, .88));
          padding: 24px;
          box-shadow: 0 18px 60px rgba(0,0,0,.32);
        }

        .seed-score {
          margin-top: 14px;
          color: white;
          font-size: clamp(54px, 8vw, 96px);
          line-height: .94;
          font-weight: 950;
          letter-spacing: -.08em;
        }

        .seed-title {
          margin: 12px 0 0;
          color: white;
          font-size: 24px;
          font-weight: 950;
          letter-spacing: -.05em;
          line-height: 1.05;
        }

        .seed-sub {
          margin-top: 10px;
          color: rgba(203, 213, 225, .74);
          font-size: 13px;
          line-height: 1.65;
        }

        .seed-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 18px;
        }

        .seed-row {
          border-radius: 20px;
          border: 1px solid rgba(148, 163, 184, .16);
          background:
            radial-gradient(circle at top right, rgba(59, 130, 246, .1), transparent 34%),
            linear-gradient(135deg, rgba(15, 23, 42, .78), rgba(2, 6, 23, .54));
          overflow: hidden;
        }

        .seed-row.ready {
          border-color: rgba(34, 197, 94, .28);
        }

        .seed-row.missing {
          border-color: rgba(251, 146, 60, .32);
        }

        .seed-row .vs-responsive-row {
          border: 0;
          background: transparent;
        }

        @media (max-width: 1100px) {
          .seed-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}
      {message ? <div className="vs-banner vs-banner-demo">{message}</div> : null}

      <div className="vs-grid-4">
        <StatCard label="Seed Readiness" value={`${summary.readiness_score || 0}%`} delta="Launch data coverage" tone={summary.readiness_score >= 85 ? "up" : "neutral"} />
        <StatCard label="Ready Items" value={`${summary.ready_items || 0}/${summary.total_items || 0}`} delta="Target met" tone="up" />
        <StatCard label="Needs Seed" value={summary.needs_seed || 0} delta="Below demo threshold" tone={summary.needs_seed ? "down" : "up"} />
        <StatCard label="Last Run" value={data.last_run ? "Completed" : "Never"} delta={data.last_run?.created_at ? new Date(data.last_run.created_at).toLocaleString() : "No seed run yet"} tone={data.last_run ? "up" : "neutral"} />
      </div>

      {loading ? (
        <EmptyState text="Loading launch seed status..." />
      ) : (
        <div className="seed-grid">
          <div className="seed-stack">
            <div className="seed-command">
              <Badge tone={summary.needs_seed ? "demo" : "active"}>
                {summary.needs_seed ? "Needs Seed" : "Demo Ready"}
              </Badge>

              <div className="seed-score">{summary.readiness_score || 0}%</div>

              <h2 className="seed-title">Launch Demo Data Coverage</h2>

              <div className="seed-sub">
                This seeder safely inserts records only when they do not already exist. It is designed to make demo, QA, Launch Readiness, Executive Workspace, KPI Layer, and Live Intelligence look populated before beta launch.
              </div>

              <div className="seed-actions">
                <button className="vs-button" onClick={runSeeder} disabled={running}>
                  {running ? "Seeding..." : "Run Launch Data Seeder"}
                </button>
                <Link className="vs-button vs-button-secondary" to="/launch-readiness">
                  Launch Readiness
                </Link>
                <Link className="vs-button vs-button-secondary" to="/executive-workspace">
                  Executive Workspace
                </Link>
              </div>
            </div>

            <SectionCard title="Seeder Scope" subtitle="Records this build inserts when missing.">
              <div className="seed-stack">
                {[
                  "25 vendors",
                  "20 execution tasks",
                  "15 CRM contacts",
                  "10 clients",
                  "15 revenue pipeline deals",
                  "5 reports",
                  "5 notifications",
                  "1 launch demo workspace",
                ].map((item) => (
                  <div key={item} className="vs-card-muted">
                    <strong>{item}</strong>
                    <div className="vs-row-subtitle">Idempotent launch/demo seed record group.</div>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>

          <SectionCard
            title="Launch Data Targets"
            subtitle="Minimum demo-launch counts needed for healthy dashboards."
            right={<Badge tone={summary.needs_seed ? "demo" : "active"}>{summary.needs_seed || 0} below target</Badge>}
          >
            <div className="seed-stack">
              {!readiness.length ? (
                <EmptyState text="No seed readiness rows returned." />
              ) : (
                readiness.map((item) => (
                  <div key={item.key} className={`seed-row ${item.ready ? "ready" : "missing"}`}>
                    <ResponsiveRow
                      title={titleCase(item.label)}
                      subtitle={`${item.count} records found. Target is ${item.target}.`}
                      meta={[
                        { label: "Current", value: item.count },
                        { label: "Target", value: item.target },
                        { label: "Status", value: item.ready ? "Ready" : "Needs Seed" },
                        { label: "Launch", value: item.ready ? "Healthy" : "Below threshold" },
                      ]}
                      right={<Badge tone={tone(item.ready ? "ready" : "needs seed")}>{item.ready ? "Ready" : "Needs Seed"}</Badge>}
                    />
                  </div>
                ))
              )}
            </div>
          </SectionCard>
        </div>
      )}
    </PageShell>
  );
}
