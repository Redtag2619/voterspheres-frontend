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

function tone(value = "") {
  const v = String(value || "").toLowerCase();
  if (v.includes("blocked") || v.includes("not ready")) return "danger";
  if (v.includes("review")) return "demo";
  if (v.includes("ready")) return "active";
  return "accent";
}

function scoreTone(score = 0) {
  const n = Number(score || 0);
  if (n >= 85) return "up";
  if (n >= 65) return "neutral";
  return "down";
}

export default function LaunchAutomationEngine() {
  const [data, setData] = useState({
    summary: {},
    gates: [],
    next_actions: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const result = await api.launchAutomation();
      setData({
        summary: result?.summary || {},
        gates: arr(result?.gates),
        next_actions: arr(result?.next_actions),
      });
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.error ||
          err?.message ||
          "Failed to load Launch Automation Engine."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  async function refreshAutomation() {
    try {
      setRefreshing(true);
      setError("");
      const result = await api.refreshLaunchAutomation();
      setData({
        summary: result?.summary || {},
        gates: arr(result?.gates),
        next_actions: arr(result?.next_actions),
      });
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.error ||
          err?.message ||
          "Failed to run automation refresh."
      );
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
  }, [load]);

  const summary = data.summary || {};
  const metrics = summary.metrics || {};

  return (
    <PageShell
      eyebrow="Build #17"
      title="Launch Automation Engine"
      description="Automated pre-launch checks for workspace activity, live data freshness, reports, notifications, vendor coverage, candidates, and FEC finance."
      tickerItems={[
        {
          label: "Automation",
          value: summary.status || "Checking",
          dotClass:
            summary.status === "Launch Ready"
              ? "vs-live-dot-success"
              : summary.status === "Blocked"
              ? "vs-live-dot"
              : "vs-live-dot-warning",
        },
        {
          label: "Score",
          value: `${summary.score || 0}%`,
          dotClass: summary.score >= 85 ? "vs-live-dot-success" : "vs-live-dot-warning",
        },
        {
          label: "Blockers",
          value: `${summary.blockers || 0}`,
          dotClass: summary.blockers ? "vs-live-dot" : "vs-live-dot-success",
        },
      ]}
    >
      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}

      <div className="vs-grid-4">
        <StatCard
          label="Automation Score"
          value={`${summary.score || 0}%`}
          delta={summary.status || "Checking"}
          tone={scoreTone(summary.score)}
        />
        <StatCard
          label="Ready Gates"
          value={`${summary.ready_gates || 0}/${summary.total_gates || 0}`}
          delta="Automated checks"
          tone={summary.blockers ? "neutral" : "up"}
        />
        <StatCard
          label="Blockers"
          value={summary.blockers || 0}
          delta="Must resolve"
          tone={summary.blockers ? "down" : "up"}
        />
        <StatCard
          label="Activity Base"
          value={metrics.tasks || 0}
          delta={`${metrics.crm || 0} CRM â€¢ ${metrics.clients || 0} clients`}
          tone="neutral"
        />
      </div>

      <SectionCard
        title="Automation Controls"
        subtitle="Refresh stale launch inputs and re-score the automation gates."
        right={
          <button className="vs-button" onClick={refreshAutomation}>
            {refreshing ? "Refreshing..." : "Run Automation Refresh"}
          </button>
        }
      >
        <div className="vs-grid-4">
          <StatCard label="Candidates" value={metrics.candidates || 0} delta="Candidate records" tone="neutral" />
          <StatCard label="FEC Finance" value={metrics.fec || 0} delta="Finance records" tone="neutral" />
          <StatCard label="Reports" value={metrics.reports || 0} delta="Intelligence reports" tone="neutral" />
          <StatCard label="Notifications" value={metrics.notifications || 0} delta="Alert records" tone="neutral" />
        </div>
      </SectionCard>

      <SectionCard title="Automation Gates" subtitle="Launch automation checks generated from live platform tables.">
        {loading ? (
          <EmptyState text="Loading automation gates..." />
        ) : !data.gates.length ? (
          <EmptyState text="No automation gates returned." />
        ) : (
          <div className="vs-stack">
            {data.gates.map((gate) => (
              <ResponsiveRow
                key={gate.key}
                title={gate.label}
                subtitle={gate.detail}
                meta={[
                  { label: "Score", value: `${gate.score}%` },
                  { label: "Status", value: gate.status },
                  { label: "Blocker", value: gate.blocker ? "Yes" : "No" },
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
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard title="Next Automation Actions" subtitle="Resolve these to increase the launch automation score.">
        {!data.next_actions.length ? (
          <EmptyState text="No automation actions detected." />
        ) : (
          <div className="vs-stack">
            {data.next_actions.map((item) => (
              <ResponsiveRow
                key={item.key}
                title={item.title}
                subtitle={item.detail}
                meta={[
                  { label: "Priority", value: item.priority },
                  { label: "Owner", value: item.owner },
                  { label: "Status", value: item.status },
                ]}
                right={
                  <Link className="vs-button vs-button-secondary" to={item.route}>
                    Open
                  </Link>
                }
              />
            ))}
          </div>
        )}
      </SectionCard>
    </PageShell>
  );
}

