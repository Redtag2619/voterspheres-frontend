import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../services/api";

import SectionCard from "../ui/SectionCard";
import Badge from "../ui/Badge";
import EmptyState from "../ui/EmptyState";
import ResponsiveRow from "../ui/ResponsiveRow";

function fmt(value) {
  return Number(value || 0).toLocaleString();
}

function tone(value) {
  const v = String(value || "").toLowerCase();
  if (v === "critical" || v === "high" || v === "negative") return "danger";
  if (v === "elevated" || v === "medium") return "demo";
  if (v === "stable" || v === "low" || v === "positive") return "active";
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
    .replace(/<!\[CDATA\[/g, "")
    .replace(/\]\]>/g, "")
    .replace(/<a\b[^>]*>(.*?)<\/a>/gi, "$1")
    .replace(/<font\b[^>]*>(.*?)<\/font>/gi, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanTitle(value = "") {
  return clean(value)
    .replace(/^Narrative signal:\s*/i, "News narrative: ")
    .replace(/^News narrative:\s*News narrative:\s*/i, "News narrative: ")
    .replace(/\s+-\s+ABC7 Bay Area$/i, "")
    .replace(/\s+-\s+The Washington Post$/i, "")
    .replace(/\s+-\s+AP News$/i, "")
    .replace(/\s+-\s+Reuters$/i, "")
    .replace(/\s+-\s+CNN$/i, "")
    .replace(/\s+-\s+Fox News$/i, "")
    .replace(/\s+-\s+NBC News$/i, "")
    .replace(/\s+-\s+CBS News$/i, "")
    .replace(/\s+-\s+ABC News$/i, "")
    .trim();
}

function cleanSummary(item = {}) {
  const summary = clean(item.summary || "");
  const title = clean(item.title || "");

  if (!summary || summary === title || summary.includes("target=\"_blank\"")) {
    return `Workspace signal detected from ${clean(item.source || "Signal Source")}.`;
  }

  return summary;
}

function SignalRow({ item }) {
  return (
    <div className={`ws-signal-row ws-signal-${String(item.risk || "stable").toLowerCase()}`}>
      <ResponsiveRow
        title={cleanTitle(item.title || "Workspace signal")}
        subtitle={cleanSummary(item)}
        meta={[
          { label: "Type", value: item.signal_type || "general" },
          { label: "Source", value: clean(item.source || "Signal") },
          { label: "State", value: item.state || "National" },
          { label: "County", value: item.county || "—" },
          { label: "Score", value: item.signal_score || 0 },
        ]}
        right={
          <div className="ws-signal-actions">
            {item.url ? (
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="vs-button ws-signal-btn"
              >
                Read Article
              </a>
            ) : null}

            <Badge tone={tone(item.risk || item.severity)}>
              {item.risk || item.severity || "Signal"}
            </Badge>
          </div>
        }
      />
    </div>
  );
}

export default function WorkspaceSignalFeed({ workspaceId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");

  const load = useCallback(async ({ quiet = false } = {}) => {
    if (!workspaceId) {
      setData({ summary: {}, signals: [] });
      setLoading(false);
      return;
    }

    try {
      if (quiet) setRefreshing(true);
      else setLoading(true);

      setError("");

      const result = await api.workspaceSignalFeed(workspaceId);
      setData(result || {});
      setLastUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Failed to load workspace signal feed.");
      setData({ summary: {}, signals: [] });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    load();

    const interval = setInterval(() => {
      load({ quiet: true });
    }, 30000);

    return () => clearInterval(interval);
  }, [load]);

  const summary = data?.summary || {};
  const signals = data?.signals || [];

  return (
    <SectionCard
      title="Workspace Signal Feed"
      subtitle="Matched FEC, fundraising, news, and political signals connected to this campaign workspace."
      right={<Badge tone={signals.length ? "demo" : "active"}>{signals.length} signals</Badge>}
    >
      <style>{`
        .ws-signal-summary {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 10px;
          margin-bottom: 14px;
        }

        .ws-signal-summary div {
          border-radius: 16px;
          border: 1px solid rgba(148, 163, 184, 0.14);
          background: rgba(15, 23, 42, 0.58);
          padding: 12px;
        }

        .ws-signal-summary span {
          display: block;
          color: rgba(203, 213, 225, 0.64);
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
        }

        .ws-signal-summary b {
          display: block;
          margin-top: 5px;
          color: white;
          font-size: 20px;
        }

        .ws-signal-stack {
          display: grid;
          gap: 12px;
        }

        .ws-signal-row {
          border-radius: 20px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          background:
            radial-gradient(circle at top right, rgba(59, 130, 246, 0.1), transparent 34%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.78), rgba(2, 6, 23, 0.54));
          overflow: hidden;
        }

        .ws-signal-row .vs-responsive-row {
          border: 0;
          background: transparent;
        }

        .ws-signal-critical,
        .ws-signal-high {
          border-color: rgba(248, 113, 113, 0.34);
        }

        .ws-signal-elevated {
          border-color: rgba(251, 191, 36, 0.3);
        }

        .ws-signal-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
          flex-wrap: wrap;
        }

        .ws-signal-btn {
          padding: 8px 14px;
          font-size: 12px;
          text-decoration: none;
          white-space: nowrap;
        }

        .ws-signal-message {
          border-radius: 16px;
          border: 1px solid rgba(96, 165, 250, 0.24);
          background: rgba(37, 99, 235, 0.14);
          color: rgba(226, 232, 240, 0.92);
          padding: 12px;
          margin-bottom: 14px;
        }

        .ws-signal-tools {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 14px;
        }

        @media (max-width: 1000px) {
          .ws-signal-summary {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}

      <div className="ws-signal-tools">
        <button type="button" className="vs-button vs-button-secondary" onClick={() => load({ quiet: true })}>
          {refreshing ? "Refreshing..." : "Refresh Signals"}
        </button>

        <Link className="vs-button vs-button-secondary" to="/signal-matching">
          Run Signal Matching
        </Link>

        <Link className="vs-button vs-button-secondary" to="/political-signals">
          Political Signals
        </Link>

        <span className="ws-signal-message">
          Updated {lastUpdated || "Ready"}
        </span>
      </div>

      <div className="ws-signal-summary">
        <div><span>Total</span><b>{fmt(summary.total)}</b></div>
        <div><span>Critical</span><b>{fmt(summary.critical)}</b></div>
        <div><span>High</span><b>{fmt(summary.high)}</b></div>
        <div><span>News</span><b>{fmt(summary.news)}</b></div>
        <div><span>FEC</span><b>{fmt(summary.fec)}</b></div>
      </div>

      {loading ? (
        <EmptyState text="Loading workspace signals..." />
      ) : !signals.length ? (
        <EmptyState text="No matched signals for this workspace yet. Run Signal Matching after importing FEC/news signals." />
      ) : (
        <div className="ws-signal-stack">
          {signals.map((item) => (
            <SignalRow key={item.id} item={item} />
          ))}
        </div>
      )}
    </SectionCard>
  );
}
