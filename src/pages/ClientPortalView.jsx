import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
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

function fmt(value) {
  return Number(value || 0).toLocaleString();
}

function pct(value) {
  return `${Number(value || 0).toFixed(0)}%`;
}

function clean(value = "") {
  return String(value || "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function tone(value) {
  const v = String(value || "").toLowerCase();
  if (["critical", "high"].includes(v)) return "danger";
  if (["elevated", "medium"].includes(v)) return "demo";
  if (["stable", "active"].includes(v)) return "active";
  return "accent";
}

export default function ClientPortalView() {
  const { token } = useParams();

  const [data, setData] = useState({
    client: {},
    workspace: null,
    summary: {},
    reports: [],
    signals: [],
    workspace_health: [],
    public_summary: null,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const result = await api.clientPortalPublic(token);
      setData({
        client: result?.client || {},
        workspace: result?.workspace || null,
        summary: result?.summary || {},
        reports: arr(result?.reports),
        signals: arr(result?.signals),
        workspace_health: arr(result?.workspace_health),
        public_summary: result?.public_summary || null,
      });
    } catch (err) {
      setError(err?.response?.data?.error || err?.response?.data?.detail || err?.message || "Client portal unavailable.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const summary = data.summary || {};
  const client = data.client || {};
  const publicSummary = data.public_summary || {};

  return (
    <PageShell
      eyebrow="Client Portal"
      title={client.client_name || "Campaign Client Portal"}
      description={publicSummary.assessment || "Secure campaign intelligence portal."}
      tickerItems={[
        { label: "Risk", value: summary.mission_risk || "Stable", dotClass: ["Critical", "High"].includes(summary.mission_risk) ? "vs-live-dot-warning" : "vs-live-dot-success" },
        { label: "Pressure", value: pct(summary.pressure_score || 0), dotClass: Number(summary.pressure_score || 0) >= 65 ? "vs-live-dot-warning" : "vs-live-dot-success" },
        { label: "Reports", value: `${summary.reports || 0}`, dotClass: "vs-live-dot-success" },
        { label: "Signals", value: `${summary.signals || 0}`, dotClass: summary.signals ? "vs-live-dot-warning" : "vs-live-dot-success" },
      ]}
    >
      <style>{`
        .client-portal-grid { display:grid; grid-template-columns:minmax(0,1.2fr) minmax(360px,.8fr); gap:18px; align-items:start; }
        .client-portal-stack { display:grid; gap:14px; }
        .client-report {
          border-radius:22px; border:1px solid rgba(148,163,184,.16);
          background:rgba(15,23,42,.58); overflow:hidden;
        }
        .client-report .vs-responsive-row { border:0; background:transparent; }
        @media(max-width:1100px){ .client-portal-grid{ grid-template-columns:1fr; } }
      `}</style>

      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}

      {loading ? (
        <EmptyState text="Loading client portal..." />
      ) : (
        <>
          <div className="vs-grid-4">
            <StatCard label="Mission Risk" value={summary.mission_risk || "Stable"} delta="Client-facing summary" tone={["Critical", "High"].includes(summary.mission_risk) ? "down" : "up"} />
            <StatCard label="Pressure" value={pct(summary.pressure_score)} delta="Operating environment" tone={Number(summary.pressure_score || 0) >= 65 ? "down" : "up"} />
            <StatCard label="Reports" value={fmt(summary.reports)} delta="Available briefs" tone="up" />
            <StatCard label="Signals" value={fmt(summary.signals)} delta="Signal watch" tone={summary.signals ? "neutral" : "up"} />
          </div>

          <div className="client-portal-grid">
            <div className="client-portal-stack">
              <SectionCard
                title={publicSummary.headline || "Executive Summary"}
                subtitle={publicSummary.next_step || "Review the latest campaign intelligence."}
                right={<Badge tone={tone(summary.mission_risk)}>{summary.mission_risk || "Stable"}</Badge>}
              >
                <p style={{ color: "rgba(226,232,240,.88)", lineHeight: 1.7, margin: 0 }}>
                  {publicSummary.assessment || "No public summary available."}
                </p>
              </SectionCard>

              <SectionCard title="Reports" subtitle="Latest client-ready intelligence reports." right={<Badge tone="active">{data.reports.length}</Badge>}>
                {!data.reports.length ? (
                  <EmptyState text="No reports available yet." />
                ) : (
                  <div className="client-portal-stack">
                    {data.reports.map((report) => (
                      <div key={report.id} className="client-report">
                        <ResponsiveRow
                          title={report.title}
                          subtitle={clean(report.executive_summary || "Generated report")}
                          meta={[
                            { label: "Type", value: String(report.report_type || "report").replace(/_/g, " ") },
                            { label: "State", value: report.state || "National" },
                            { label: "Status", value: report.status || "generated" },
                            { label: "Created", value: report.created_at ? new Date(report.created_at).toLocaleDateString() : "—" },
                          ]}
                          right={<Badge tone="active">Report</Badge>}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>
            </div>

            <div className="client-portal-stack">
              <SectionCard title="Signal Watch" subtitle="Client-facing political signal watch." right={<Badge tone={data.signals.length ? "demo" : "active"}>{data.signals.length}</Badge>}>
                {!data.signals.length ? (
                  <EmptyState text="No client-facing signals available." />
                ) : (
                  <div className="client-portal-stack">
                    {data.signals.map((signal) => (
                      <div key={signal.id} className="client-report">
                        <ResponsiveRow
                          title={signal.title}
                          subtitle={clean(signal.summary)}
                          meta={[
                            { label: "State", value: signal.state || "National" },
                            { label: "Risk", value: signal.risk || "Stable" },
                            { label: "Score", value: signal.score || 0 },
                            { label: "Observed", value: signal.observed_at ? new Date(signal.observed_at).toLocaleDateString() : "—" },
                          ]}
                          right={<Badge tone={tone(signal.risk)}>{signal.risk || "Signal"}</Badge>}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>

              <SectionCard title="Workspace Status" subtitle="Client-facing workspace health.">
                {!data.workspace_health.length ? (
                  <EmptyState text="No workspace status available." />
                ) : (
                  <div className="client-portal-stack">
                    {data.workspace_health.map((workspace) => (
                      <div key={workspace.id} className="client-report">
                        <ResponsiveRow
                          title={workspace.name}
                          subtitle={`${workspace.state || "National"} • ${workspace.office || "Campaign"} • ${workspace.cycle || "2026"}`}
                          meta={[
                            { label: "Risk", value: workspace.risk || "Stable" },
                            { label: "Pressure", value: pct(workspace.pressure_score) },
                            { label: "Signals", value: workspace.signals || 0 },
                            { label: "Open Items", value: workspace.open_tasks || 0 },
                          ]}
                          right={<Badge tone={tone(workspace.risk)}>{workspace.risk || "Stable"}</Badge>}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>
            </div>
          </div>
        </>
      )}
    </PageShell>
  );
}
