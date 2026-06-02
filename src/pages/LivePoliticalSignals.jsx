import { useCallback, useEffect, useState } from "react";
import { api } from "../services/api";

import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import ResponsiveRow from "../components/ui/ResponsiveRow";

const emptyForm = {
  title: "",
  summary: "",
  signal_type: "news",
  source: "Manual",
  state: "",
  county: "",
  severity: "medium",
};

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

function SignalRow({ item }) {
  return (
    <div className={`signal-row signal-${String(item.risk || "stable").toLowerCase()}`}>
      <ResponsiveRow
        title={item.title || "Political signal"}
        subtitle={item.summary || `${item.source || "Signal"} • ${item.signal_type || "general"}`}
        meta={[
          { label: "Type", value: item.signal_type || "general" },
          { label: "Source", value: item.source || "Manual" },
          { label: "State", value: item.state || "National" },
          { label: "County", value: item.county || "—" },
          { label: "Score", value: item.signal_score || 0 },
        ]}
        right={<Badge tone={tone(item.risk || item.severity)}>{item.risk || item.severity || "Signal"}</Badge>}
      />
    </div>
  );
}

export default function LivePoliticalSignals() {
  const [data, setData] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");

  const load = useCallback(async ({ quiet = false } = {}) => {
    try {
      if (quiet) setRefreshing(true);
      else setLoading(true);

      setError("");
      const result = await api.politicalSignalsDashboard();
      setData(result || {});
      setLastUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Failed to load live political signals.");
      setData({ summary: {}, signals: [] });
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

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      await api.createPoliticalSignal({
        ...form,
        state: form.state.trim().toUpperCase(),
      });

      setForm(emptyForm);
      setMessage("Political signal created.");
      await load({ quiet: true });
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Failed to create political signal.");
    } finally {
      setSaving(false);
    }
  }

  const summary = data?.summary || {};
  const signals = data?.signals || [];

  return (
    <PageShell
      eyebrow="Live Political Signals"
      title="Live Political Signal Engine"
      description="Ingest and monitor polling, FEC, fundraising, news, turnout, vendor, and MailOps signals that power tactical intelligence."
      tickerItems={[
        { label: "Signals", value: `${summary.total_signals || 0}`, dotClass: "vs-live-dot-success" },
        { label: "Critical", value: `${summary.critical || 0}`, dotClass: summary.critical ? "vs-live-dot-warning" : "vs-live-dot-success" },
        { label: "Risk", value: summary.national_risk || "Stable", dotClass: ["Critical", "High"].includes(summary.national_risk) ? "vs-live-dot-warning" : "vs-live-dot-success" },
        { label: "Updated", value: refreshing ? "Live" : lastUpdated || "Ready", dotClass: refreshing ? "vs-live-dot-warning" : "vs-live-dot-success" },
      ]}
    >
      <style>{`
        .signals-layout {
          display: grid;
          grid-template-columns: minmax(0, 1.25fr) minmax(360px, 0.75fr);
          gap: 18px;
          align-items: start;
        }

        .signals-stack {
          display: grid;
          gap: 14px;
        }

        .signal-row {
          border-radius: 20px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          background:
            radial-gradient(circle at top right, rgba(59, 130, 246, 0.1), transparent 34%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.78), rgba(2, 6, 23, 0.54));
          overflow: hidden;
        }

        .signal-row .vs-responsive-row {
          border: 0;
          background: transparent;
        }

        .signal-critical,
        .signal-high {
          border-color: rgba(248, 113, 113, 0.34);
        }

        .signal-elevated {
          border-color: rgba(251, 191, 36, 0.3);
        }

        .signal-form {
          display: grid;
          gap: 11px;
        }

        .signal-form input,
        .signal-form select,
        .signal-form textarea {
          width: 100%;
          border-radius: 14px;
          border: 1px solid rgba(148, 163, 184, 0.18);
          background: rgba(15, 23, 42, 0.74);
          color: white;
          padding: 11px 12px;
          outline: none;
        }

        .signal-form textarea {
          min-height: 90px;
          resize: vertical;
        }

        .signal-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 11px;
        }

        .signal-message {
          border-radius: 16px;
          border: 1px solid rgba(96, 165, 250, 0.24);
          background: rgba(37, 99, 235, 0.14);
          color: rgba(226, 232, 240, 0.92);
          padding: 12px;
          margin-bottom: 14px;
        }

        @media (max-width: 1100px) {
          .signals-layout,
          .signal-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}
      {message ? <div className="signal-message">{message}</div> : null}

      <div className="vs-grid-4">
        <StatCard label="Total Signals" value={fmt(summary.total_signals)} delta="Live political indicators" tone="up" />
        <StatCard label="Critical" value={fmt(summary.critical)} delta={`${fmt(summary.high)} high`} tone={summary.critical ? "down" : "up"} />
        <StatCard label="Signal Score" value={fmt(summary.average_signal_score)} delta={summary.national_risk || "Stable"} tone={summary.average_signal_score >= 65 ? "down" : "up"} />
        <StatCard label="Elevated" value={fmt(summary.elevated)} delta="Watch signals" tone={summary.elevated ? "neutral" : "up"} />
      </div>

      <div className="signals-layout">
        <SectionCard
          title="Live Signal Stream"
          subtitle="Newest political indicators powering AI tactical intelligence."
          right={<Badge tone="accent">{signals.length} signals</Badge>}
        >
          {loading ? (
            <EmptyState text="Loading political signals..." />
          ) : !signals.length ? (
            <EmptyState text="No political signals ingested yet." />
          ) : (
            <div className="signals-stack">
              {signals.map((item) => (
                <SignalRow key={item.id} item={item} />
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Manual Signal Intake"
          subtitle="Create a live political signal now. Automated polling/FEC/news ingestion can plug into this same table."
        >
          <form className="signal-form" onSubmit={submit}>
            <input
              value={form.title}
              onChange={(event) => update("title", event.target.value)}
              placeholder="Signal title"
              required
            />

            <textarea
              value={form.summary}
              onChange={(event) => update("summary", event.target.value)}
              placeholder="Signal summary"
            />

            <div className="signal-grid">
              <select value={form.signal_type} onChange={(event) => update("signal_type", event.target.value)}>
                <option value="news">News</option>
                <option value="polling">Polling</option>
                <option value="fundraising">Fundraising</option>
                <option value="turnout">Turnout</option>
                <option value="fec">FEC</option>
                <option value="vendor">Vendor</option>
                <option value="mailops">MailOps</option>
                <option value="general">General</option>
              </select>

              <select value={form.severity} onChange={(event) => update("severity", event.target.value)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div className="signal-grid">
              <input
                value={form.state}
                onChange={(event) => update("state", event.target.value)}
                placeholder="State, e.g. GA"
              />

              <input
                value={form.county}
                onChange={(event) => update("county", event.target.value)}
                placeholder="County"
              />
            </div>

            <input
              value={form.source}
              onChange={(event) => update("source", event.target.value)}
              placeholder="Source"
            />

            <button type="submit" className="vs-button" disabled={saving}>
              {saving ? "Creating..." : "Create Signal"}
            </button>
          </form>
        </SectionCard>
      </div>
    </PageShell>
  );
}
