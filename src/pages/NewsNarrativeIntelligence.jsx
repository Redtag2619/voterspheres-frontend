import { useCallback, useEffect, useState } from "react";
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
  if (v === "critical" || v === "high" || v === "negative") return "danger";
  if (v === "elevated" || v === "medium") return "demo";
  if (v === "stable" || v === "positive") return "active";
  return "accent";
}

function decodeHtml(value = "") {
  if (typeof document === "undefined") return String(value || "");

  const textarea = document.createElement("textarea");
  textarea.innerHTML = String(value || "");
  return textarea.value;
}

function cleanDisplayText(value = "") {
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

function cleanNarrativeTitle(value = "") {
  return cleanDisplayText(value)
    .replace(/^Narrative signal:\s*/i, "News narrative: ")
    .replace(/^News narrative:\s*News narrative:\s*/i, "News narrative: ")
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

function cleanNarrativeSummary(item = {}) {
  const cleaned = cleanDisplayText(item.summary || "");
  const title = cleanDisplayText(item.title || "");

  if (!cleaned || cleaned === title || cleaned.includes("target=\"_blank\"")) {
    return `Political narrative signal detected from ${item.source || "News RSS"}.`;
  }

  return cleaned;
}

function direction(item = {}) {
  return item.metadata?.narrative_direction || "neutral";
}

function NarrativeRow({ item }) {
  const dir = direction(item);
  const source = cleanDisplayText(item.source || "News");

  return (
    <div className={`narrative-row narrative-${String(item.risk || "stable").toLowerCase()}`}>
      <ResponsiveRow
        title={cleanNarrativeTitle(item.title || "News narrative")}
        subtitle={cleanNarrativeSummary(item)}
        meta={[
          { label: "Direction", value: dir },
          { label: "Source", value: source },
          { label: "State", value: item.state || "National" },
          { label: "Score", value: item.signal_score || 0 },
          { label: "Risk", value: item.risk || "Stable" },
        ]}
        right={
          <div className="narrative-actions">
            {item.url ? (
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="vs-button narrative-read-link"
              >
                Read Full Article
              </a>
            ) : null}

            <Badge tone={tone(item.risk || dir)}>
              {item.risk || dir}
            </Badge>
          </div>
        }
      />
    </div>
  );
}

export default function NewsNarrativeIntelligence() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ingesting, setIngesting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");

  const load = useCallback(async ({ quiet = false } = {}) => {
    try {
      if (!quiet) setLoading(true);
      setError("");

      const result = await api.newsNarrativeDashboard();
      setData(result || {});
      setLastUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Failed to load narrative intelligence.");
      setData({ summary: {}, signals: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  async function ingest() {
    try {
      setIngesting(true);
      setMessage("");
      setError("");

      const result = await api.ingestNewsNarrative({ limit: 25 });
      setMessage(`News import complete: ${result.inserted || 0} inserted, ${result.skipped || 0} skipped.`);
      await load({ quiet: true });
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Failed to ingest news narrative signals.");
    } finally {
      setIngesting(false);
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(() => load({ quiet: true }), 30000);
    return () => clearInterval(interval);
  }, [load]);

  const summary = data?.summary || {};
  const signals = data?.signals || [];

  return (
    <PageShell
      eyebrow="Narrative Intelligence"
      title="News + Narrative Intelligence"
      description="Automated media narrative tracking for campaign pressure, issue spikes, positive momentum, and negative press escalation."
      tickerItems={[
        { label: "Signals", value: `${summary.total || 0}`, dotClass: "vs-live-dot-success" },
        { label: "Negative", value: `${summary.negative || 0}`, dotClass: summary.negative ? "vs-live-dot-warning" : "vs-live-dot-success" },
        { label: "Risk", value: summary.risk || "Stable", dotClass: ["Critical", "High"].includes(summary.risk) ? "vs-live-dot-warning" : "vs-live-dot-success" },
        { label: "Updated", value: lastUpdated || "Ready", dotClass: "vs-live-dot-success" },
      ]}
    >
      <style>{`
        .narrative-layout {
          display: grid;
          grid-template-columns: minmax(0, 1.25fr) minmax(340px, 0.75fr);
          gap: 18px;
          align-items: start;
        }

        .narrative-stack {
          display: grid;
          gap: 14px;
        }

        .narrative-row {
          border-radius: 20px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          background:
            radial-gradient(circle at top right, rgba(59, 130, 246, 0.1), transparent 34%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.78), rgba(2, 6, 23, 0.54));
          overflow: hidden;
        }

        .narrative-row .vs-responsive-row {
          border: 0;
          background: transparent;
        }

        .narrative-critical,
        .narrative-high {
          border-color: rgba(248, 113, 113, 0.34);
        }

        .narrative-elevated {
          border-color: rgba(251, 191, 36, 0.3);
        }

        .narrative-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
          flex-wrap: wrap;
        }

        .narrative-read-link {
          padding: 8px 14px;
          font-size: 12px;
          text-decoration: none;
          white-space: nowrap;
        }

        .narrative-control {
          border-radius: 28px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          background:
            radial-gradient(circle at top left, rgba(37, 99, 235, 0.2), transparent 36%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.92), rgba(2, 6, 23, 0.82));
          padding: 22px;
        }

        .narrative-control h3 {
          margin: 0;
          color: white;
          font-size: 22px;
          font-weight: 950;
        }

        .narrative-control p {
          color: rgba(203, 213, 225, 0.72);
          line-height: 1.5;
          font-size: 13px;
        }

        @media (max-width: 1100px) {
          .narrative-layout {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}
      {message ? <div className="vs-banner">{message}</div> : null}

      <div className="vs-grid-4">
        <StatCard label="Narrative Signals" value={fmt(summary.total)} delta="News/media indicators" tone="up" />
        <StatCard label="Negative" value={fmt(summary.negative)} delta={`${fmt(summary.positive)} positive`} tone={summary.negative ? "down" : "up"} />
        <StatCard label="Critical" value={fmt(summary.critical)} delta={`${fmt(summary.high)} high`} tone={summary.critical ? "down" : "up"} />
        <StatCard label="Avg Score" value={fmt(summary.average_score)} delta={summary.risk || "Stable"} tone={summary.average_score >= 65 ? "down" : "up"} />
      </div>

      <div className="narrative-layout">
        <SectionCard
          title="Narrative Signal Stream"
          subtitle="Latest imported news narratives and media pressure signals."
          right={<Badge tone="accent">{signals.length} signals</Badge>}
        >
          {loading ? (
            <EmptyState text="Loading narrative intelligence..." />
          ) : !signals.length ? (
            <EmptyState text="No narrative signals imported yet." />
          ) : (
            <div className="narrative-stack">
              {signals.map((item) => (
                <NarrativeRow key={item.id} item={item} />
              ))}
            </div>
          )}
        </SectionCard>

        <div className="narrative-control">
          <h3>News Ingestion Control</h3>
          <p>
            Pulls current political news RSS feeds, scores narrative direction,
            detects risk terms, issue terms, state references, and stores results
            into Political Signals.
          </p>
          <button type="button" className="vs-button" onClick={ingest} disabled={ingesting}>
            {ingesting ? "Importing..." : "Import News Narratives"}
          </button>
        </div>
      </div>
    </PageShell>
  );
}
