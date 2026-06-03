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
  if (["critical", "high", "escalated"].includes(v)) return "danger";
  if (["elevated", "medium", "draft", "open", "in_progress", "pending"].includes(v)) return "demo";
  if (["reviewed", "approved", "complete", "stable", "low"].includes(v)) return "active";
  return "accent";
}

function decodeHtml(value = "") {
  if (typeof document === "undefined") return String(value || "");
  const textarea = document.createElement("textarea");
  textarea.innerHTML = String(value || "");
  return textarea.value;
}

function clean(value = "") {
  return decodeHtml(value)
    .replace(/<a\b[^>]*>(.*?)<\/a>/gi, "$1")
    .replace(/<font\b[^>]*>(.*?)<\/font>/gi, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function ResponseRow({ item, onUpdate, updatingId }) {
  const updating = String(updatingId) === String(item.id);

  return (
    <div className={`nrr-row nrr-${String(item.threat_level || item.status || "medium").toLowerCase()}`}>
      <ResponsiveRow
        title={clean(item.title || "Narrative response")}
        subtitle={clean(item.narrative_summary || item.response_strategy || "Rapid response workflow")}
        meta={[
          { label: "Status", value: item.status || "draft" },
          { label: "Threat", value: item.threat_level || "medium" },
          { label: "Owner", value: item.owner || "Unassigned" },
          { label: "State", value: item.state || "National" },
          { label: "Approval", value: item.approval_status || "pending" },
        ]}
        right={
          <div className="nrr-actions">
            <Badge tone={tone(item.threat_level)}>{item.threat_level || "medium"}</Badge>
            <button className="vs-button nrr-btn" disabled={updating} onClick={() => onUpdate(item.id, { status: "reviewed" })}>
              Reviewed
            </button>
            <button className="vs-button vs-button-secondary nrr-btn" disabled={updating} onClick={() => onUpdate(item.id, { status: "escalated" })}>
              Escalate
            </button>
          </div>
        }
      />

      {item.draft_message ? (
        <pre className="nrr-draft">{item.draft_message}</pre>
      ) : null}
    </div>
  );
}

function SignalRow({ item, onCreate, creatingId }) {
  const creating = String(creatingId) === String(item.id);

  return (
    <div className={`nrr-row nrr-${String(item.risk || item.severity || "medium").toLowerCase()}`}>
      <ResponsiveRow
        title={clean(item.title || "Narrative signal")}
        subtitle={clean(item.summary || item.source || "News narrative signal")}
        meta={[
          { label: "Source", value: clean(item.source || "News") },
          { label: "Risk", value: item.risk || item.severity || "Signal" },
          { label: "State", value: item.state || "National" },
          { label: "Score", value: item.signal_score || 0 },
        ]}
        right={
          <div className="nrr-actions">
            {item.url ? (
              <a className="vs-button vs-button-secondary nrr-btn" href={item.url} target="_blank" rel="noreferrer">
                Article
              </a>
            ) : null}

            <button className="vs-button nrr-btn" disabled={creating} onClick={() => onCreate(item)}>
              {creating ? "Creating..." : "Create Response"}
            </button>
          </div>
        }
      />
    </div>
  );
}

export default function NarrativeRapidResponse() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creatingId, setCreatingId] = useState("");
  const [updatingId, setUpdatingId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");

  const load = useCallback(async ({ quiet = false } = {}) => {
    try {
      if (!quiet) setLoading(true);
      setError("");

      const result = await api.narrativeRapidResponseDashboard();
      setData(result || {});
      setLastUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Failed to load narrative rapid response.");
      setData({ summary: {}, responses: [], signals: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(() => load({ quiet: true }), 30000);
    return () => clearInterval(interval);
  }, [load]);

  async function createFromSignal(signal) {
    try {
      setCreatingId(signal.id);
      setMessage("");
      setError("");

      await api.createNarrativeRapidResponse({
        political_signal_id: signal.id,
        title: signal.title,
        narrative_summary: signal.summary,
        state: signal.state,
        county: signal.county,
        workspace_id: signal.workspace_id,
      });

      setMessage("Rapid response created.");
      await load({ quiet: true });
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Failed to create rapid response.");
    } finally {
      setCreatingId("");
    }
  }

  async function updateResponse(id, payload) {
    try {
      setUpdatingId(id);
      setMessage("");
      setError("");

      await api.updateNarrativeRapidResponse(id, payload);
      setMessage(payload.status === "escalated" ? "Response escalated to War Room." : "Response marked reviewed.");
      await load({ quiet: true });
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Failed to update rapid response.");
    } finally {
      setUpdatingId("");
    }
  }

  const summary = data?.summary || {};
  const responses = data?.responses || [];
  const signals = data?.signals || [];

  return (
    <PageShell
      eyebrow="Narrative Rapid Response"
      title="Narrative Rapid Response Workflow"
      description="Turn narrative threats into reviewed, assigned, escalated, and approved response workflows."
      tickerItems={[
        { label: "Responses", value: `${summary.responses || 0}`, dotClass: "vs-live-dot-success" },
        { label: "Open", value: `${summary.open || 0}`, dotClass: summary.open ? "vs-live-dot-warning" : "vs-live-dot-success" },
        { label: "Escalated", value: `${summary.escalated || 0}`, dotClass: summary.escalated ? "vs-live-dot-warning" : "vs-live-dot-success" },
        { label: "Updated", value: lastUpdated || "Ready", dotClass: "vs-live-dot-success" },
      ]}
    >
      <style>{`
        .nrr-layout {
          display: grid;
          grid-template-columns: minmax(0, 1.25fr) minmax(360px, 0.75fr);
          gap: 18px;
          align-items: start;
        }

        .nrr-stack {
          display: grid;
          gap: 14px;
        }

        .nrr-row {
          border-radius: 20px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          background:
            radial-gradient(circle at top right, rgba(59, 130, 246, 0.1), transparent 34%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.78), rgba(2, 6, 23, 0.54));
          overflow: hidden;
        }

        .nrr-row .vs-responsive-row {
          border: 0;
          background: transparent;
        }

        .nrr-critical,
        .nrr-high,
        .nrr-escalated {
          border-color: rgba(248, 113, 113, 0.34);
        }

        .nrr-elevated,
        .nrr-medium,
        .nrr-draft {
          border-color: rgba(251, 191, 36, 0.3);
        }

        .nrr-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 8px;
          flex-wrap: wrap;
        }

        .nrr-btn {
          padding: 8px 12px;
          font-size: 12px;
          text-decoration: none;
          white-space: nowrap;
        }

        .nrr-draft {
          margin: 0 16px 16px;
          white-space: pre-wrap;
          color: rgba(226, 232, 240, 0.86);
          border-radius: 16px;
          background: rgba(2, 6, 23, 0.42);
          border: 1px solid rgba(148, 163, 184, 0.14);
          padding: 14px;
          font-family: inherit;
          font-size: 12px;
          line-height: 1.5;
        }

        .nrr-message {
          border-radius: 16px;
          border: 1px solid rgba(96, 165, 250, 0.24);
          background: rgba(37, 99, 235, 0.14);
          color: rgba(226, 232, 240, 0.92);
          padding: 12px;
          margin-bottom: 14px;
        }

        @media (max-width: 1100px) {
          .nrr-layout {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}
      {message ? <div className="nrr-message">{message}</div> : null}

      <div className="vs-grid-4">
        <StatCard label="Responses" value={fmt(summary.responses)} delta="Rapid response items" tone="up" />
        <StatCard label="Open" value={fmt(summary.open)} delta="Needs action" tone={summary.open ? "down" : "up"} />
        <StatCard label="Reviewed" value={fmt(summary.reviewed)} delta="Completed review" tone="up" />
        <StatCard label="Pending Signals" value={fmt(summary.pending_signals)} delta="Need response decision" tone={summary.pending_signals ? "neutral" : "up"} />
      </div>

      {loading ? (
        <EmptyState text="Loading narrative rapid response workflow..." />
      ) : (
        <div className="nrr-layout">
          <SectionCard
            title="Rapid Response Queue"
            subtitle="Response workflows created from narrative signals."
            right={<Badge tone="accent">{responses.length} responses</Badge>}
          >
            {!responses.length ? (
              <EmptyState text="No rapid responses created yet." />
            ) : (
              <div className="nrr-stack">
                {responses.map((item) => (
                  <ResponseRow
                    key={item.id}
                    item={item}
                    updatingId={updatingId}
                    onUpdate={updateResponse}
                  />
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Unassigned Narrative Signals"
            subtitle="News narrative signals that have not been converted into response workflows."
            right={<Badge tone={signals.length ? "demo" : "active"}>{signals.length} signals</Badge>}
          >
            {!signals.length ? (
              <EmptyState text="No unassigned narrative signals." />
            ) : (
              <div className="nrr-stack">
                {signals.map((item) => (
                  <SignalRow
                    key={item.id}
                    item={item}
                    creatingId={creatingId}
                    onCreate={createFromSignal}
                  />
                ))}
              </div>
            )}

            <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link className="vs-button vs-button-secondary" to="/narrative-intelligence">
                Narrative Intelligence
              </Link>
              <Link className="vs-button vs-button-secondary" to="/political-signals">
                Political Signals
              </Link>
              <Link className="vs-button vs-button-secondary" to="/ai-tactical">
                AI Tactical
              </Link>
            </div>
          </SectionCard>
        </div>
      )}
    </PageShell>
  );
}
