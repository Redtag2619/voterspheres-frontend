import { useCallback, useEffect, useState } from "react";
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

function tone(value) {
  const v = String(value || "").toLowerCase();
  if (v === "critical" || v === "high") return "danger";
  if (v === "elevated" || v === "medium") return "demo";
  if (v === "stable" || v === "low") return "active";
  return "accent";
}

function clean(value = "") {
  return String(value || "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function SignalMatchRow({ item }) {
  return (
    <div className="match-row">
      <ResponsiveRow
        title={clean(item.title || "Political signal")}
        subtitle={item.workspace_name ? `Matched to ${item.workspace_name}` : "Unmatched signal"}
        meta={[
          { label: "Type", value: item.signal_type || "general" },
          { label: "Source", value: clean(item.source || "Signal") },
          { label: "State", value: item.state || "National" },
          { label: "Risk", value: item.risk || "Stable" },
          { label: "Score", value: item.signal_score || 0 },
        ]}
        right={
          <div className="match-actions">
            <Badge tone={item.workspace_id ? "active" : "demo"}>
              {item.workspace_id ? "Matched" : "Unmatched"}
            </Badge>
            {item.workspace_id ? (
              <Link className="vs-button vs-button-secondary match-btn" to={`/campaign-workspace/${item.workspace_id}`}>
                Workspace
              </Link>
            ) : null}
          </div>
        }
      />
    </div>
  );
}

export default function SignalWorkspaceMatching() {
  const [data, setData] = useState(null);
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [minimumScore, setMinimumScore] = useState(45);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");

  const load = useCallback(async ({ quiet = false } = {}) => {
    try {
      if (!quiet) setLoading(true);
      setError("");

      const result = await api.signalWorkspaceMatchingDashboard();
      setData(result || {});
      setLastUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Failed to load matching dashboard.");
      setData({ summary: {}, signals: [], workspaces: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function runMatching() {
    try {
      setRunning(true);
      setError("");
      setMessage("");

      const result = await api.runSignalWorkspaceMatching({
        onlyUnmatched: true,
        limit: 1000,
        minimumScore: Number(minimumScore || 45),
      });

      setMessage(`Matching complete: ${result.matched || 0} matched, ${result.skipped || 0} skipped.`);
      await load({ quiet: true });
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Failed to run matching.");
    } finally {
      setRunning(false);
    }
  }

  const summary = data?.summary || {};
  const signals = data?.signals || [];

  return (
    <PageShell
      eyebrow="Signal Matching"
      title="Signal-to-Workspace Matching"
      description="Automatically links news, FEC, fundraising, and political signals to the correct campaign workspace by state, office, candidate, and keyword overlap."
      tickerItems={[
        { label: "Signals", value: `${summary.total || 0}`, dotClass: "vs-live-dot-success" },
        { label: "Matched", value: `${summary.matched || 0}`, dotClass: "vs-live-dot-success" },
        { label: "Unmatched", value: `${summary.unmatched || 0}`, dotClass: summary.unmatched ? "vs-live-dot-warning" : "vs-live-dot-success" },
        { label: "Updated", value: lastUpdated || "Ready", dotClass: "vs-live-dot-success" },
      ]}
    >
      <style>{`
        .match-layout {
          display: grid;
          grid-template-columns: minmax(0, 1.25fr) minmax(340px, 0.75fr);
          gap: 18px;
          align-items: start;
        }

        .match-stack {
          display: grid;
          gap: 14px;
        }

        .match-row {
          border-radius: 20px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          background:
            radial-gradient(circle at top right, rgba(59, 130, 246, 0.1), transparent 34%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.78), rgba(2, 6, 23, 0.54));
          overflow: hidden;
        }

        .match-row .vs-responsive-row {
          border: 0;
          background: transparent;
        }

        .match-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
          flex-wrap: wrap;
        }

        .match-btn {
          padding: 8px 14px;
          font-size: 12px;
          text-decoration: none;
          white-space: nowrap;
        }

        .match-control {
          border-radius: 28px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          background:
            radial-gradient(circle at top left, rgba(37, 99, 235, 0.2), transparent 36%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.92), rgba(2, 6, 23, 0.82));
          padding: 22px;
        }

        .match-control h3 {
          margin: 0;
          color: white;
          font-size: 22px;
          font-weight: 950;
        }

        .match-control p {
          color: rgba(203, 213, 225, 0.72);
          line-height: 1.5;
          font-size: 13px;
        }

        .match-control label {
          display: block;
          color: rgba(226, 232, 240, 0.84);
          font-size: 12px;
          font-weight: 800;
          margin: 14px 0 7px;
        }

        .match-control input {
          width: 100%;
          border-radius: 14px;
          border: 1px solid rgba(148, 163, 184, 0.18);
          background: rgba(15, 23, 42, 0.74);
          color: white;
          padding: 11px 12px;
          outline: none;
        }

        .match-message {
          border-radius: 16px;
          border: 1px solid rgba(96, 165, 250, 0.24);
          background: rgba(37, 99, 235, 0.14);
          color: rgba(226, 232, 240, 0.92);
          padding: 12px;
          margin-bottom: 14px;
        }

        @media (max-width: 1100px) {
          .match-layout {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}
      {message ? <div className="match-message">{message}</div> : null}

      <div className="vs-grid-4">
        <StatCard label="Total Signals" value={fmt(summary.total)} delta="Political signal pool" tone="up" />
        <StatCard label="Matched" value={fmt(summary.matched)} delta="Workspace-linked" tone="up" />
        <StatCard label="Unmatched" value={fmt(summary.unmatched)} delta="Needs routing" tone={summary.unmatched ? "neutral" : "up"} />
        <StatCard label="Workspaces" value={fmt(summary.workspaces)} delta="Available targets" tone="up" />
      </div>

      <div className="match-layout">
        <SectionCard
          title="Recent Signal Routing"
          subtitle="Most recent political signals and their current workspace match state."
          right={<Badge tone="accent">{signals.length} signals</Badge>}
        >
          {loading ? (
            <EmptyState text="Loading signal matching dashboard..." />
          ) : !signals.length ? (
            <EmptyState text="No political signals found." />
          ) : (
            <div className="match-stack">
              {signals.map((item) => (
                <SignalMatchRow key={item.id} item={item} />
              ))}
            </div>
          )}
        </SectionCard>

        <div className="match-control">
          <h3>Matching Control</h3>
          <p>
            Match unmatched political signals into campaign workspaces using state, office,
            candidate, campaign name, and signal keyword overlap.
          </p>

          <label>Minimum Match Score</label>
          <input
            type="number"
            min="0"
            max="100"
            value={minimumScore}
            onChange={(event) => setMinimumScore(event.target.value)}
          />

          <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
            <button type="button" className="vs-button" onClick={runMatching} disabled={running}>
              {running ? "Matching..." : "Run Workspace Matching"}
            </button>

            <Link className="vs-button vs-button-secondary" to="/political-signals">
              Open Political Signals
            </Link>

            <Link className="vs-button vs-button-secondary" to="/ai-tactical">
              Open AI Tactical
            </Link>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
