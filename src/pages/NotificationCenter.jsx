import { useCallback, useEffect, useMemo, useState } from "react";
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

function fmt(value) {
  return Number(value || 0).toLocaleString();
}

function tone(value) {
  const v = String(value || "").toLowerCase();
  if (["critical", "danger", "high"].includes(v)) return "danger";
  if (["warning", "elevated", "medium"].includes(v)) return "demo";
  if (["info", "read", "active"].includes(v)) return "active";
  return "accent";
}

function fmtDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return "—";
  }
}

function NotificationForm({ onCreate, saving }) {
  const [form, setForm] = useState({
    title: "",
    body: "",
    source: "Manual",
    category: "general",
    level: "info",
    state: "",
    source_path: "/national-command",
  });

  function submit(event) {
    event.preventDefault();
    onCreate?.({
      ...form,
      state: form.state || null,
    });

    setForm({
      title: "",
      body: "",
      source: "Manual",
      category: "general",
      level: "info",
      state: "",
      source_path: "/national-command",
    });
  }

  return (
    <form className="notify-form" onSubmit={submit}>
      <input required placeholder="Alert title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      <textarea placeholder="Alert details" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
      <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
        <option value="info">Info</option>
        <option value="warning">Warning</option>
        <option value="critical">Critical</option>
      </select>
      <input placeholder="State optional" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value.toUpperCase() })} />
      <button className="vs-button" disabled={saving}>{saving ? "Creating..." : "Create Alert"}</button>
    </form>
  );
}

function NotificationRow({ item, onRead, onArchive }) {
  return (
    <div className={`notify-row notify-${item.level}`}>
      <ResponsiveRow
        title={item.title}
        subtitle={item.body || `${item.source} alert`}
        meta={[
          { label: "Level", value: item.level },
          { label: "Category", value: item.category },
          { label: "State", value: item.state || "National" },
          { label: "Created", value: fmtDate(item.created_at) },
        ]}
        alert={item.level === "critical" ? "vs-live-dot" : item.level === "warning" ? "vs-live-dot-warning" : "vs-live-dot-success"}
        right={
          <div className="notify-actions">
            <Badge tone={tone(item.level)}>{item.level}</Badge>
            <Link className="vs-button vs-button-secondary" to={item.source_path || "/national-command"}>Open</Link>
            <button className="vs-button vs-button-secondary" onClick={() => onRead(item.id)}>Read</button>
            <button className="vs-button vs-button-secondary" onClick={() => onArchive(item.id)}>Archive</button>
          </div>
        }
      />
    </div>
  );
}

export default function NotificationCenter() {
  const [data, setData] = useState({
    summary: {},
    notifications: [],
    sources: [],
    categories: [],
    states: [],
  });

  const [filters, setFilters] = useState({
    q: "",
    level: "",
    category: "",
    source: "",
    state: "",
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");

  const load = useCallback(async ({ quiet = false } = {}) => {
    try {
      if (quiet) setRefreshing(true);
      else setLoading(true);

      setError("");

      const result = await api.notificationCenter(filters);

      setData({
        summary: result?.summary || {},
        notifications: arr(result?.notifications),
        sources: arr(result?.sources),
        categories: arr(result?.categories),
        states: arr(result?.states),
      });

      setLastUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    } catch (err) {
      setError(err?.response?.data?.error || err?.response?.data?.detail || err?.message || "Failed to load Notification Center.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters]);

  useEffect(() => {
    load();
    const interval = setInterval(() => load({ quiet: true }), 30000);
    return () => clearInterval(interval);
  }, [load]);

  async function createManualAlert(payload) {
    try {
      setSaving(true);
      setError("");
      setMessage("");

      await api.createNotification(payload);
      setMessage("Alert created.");
      await load({ quiet: true });
    } catch (err) {
      setError(err?.response?.data?.error || err?.response?.data?.detail || err?.message || "Failed to create alert.");
    } finally {
      setSaving(false);
    }
  }

  async function markRead(id) {
    try {
      await api.markNotificationRead(id);
      setMessage("Notification marked read.");
      await load({ quiet: true });
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Failed to mark read.");
    }
  }

  async function archive(id) {
    try {
      await api.archiveNotification(id);
      setMessage("Notification archived.");
      await load({ quiet: true });
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Failed to archive.");
    }
  }

  const summary = data.summary || {};
  const notifications = arr(data.notifications);

  const levelMix = useMemo(() => {
    return [
      { label: "Critical", value: summary.critical || 0, tone: "danger" },
      { label: "Warning", value: summary.warning || 0, tone: "demo" },
      { label: "Info", value: summary.info || 0, tone: "active" },
    ];
  }, [summary]);

  return (
    <PageShell
      eyebrow="Unified Notification & Alert Center"
      title="Notification Center"
      description="One alert inbox for political signals, War Room activity, CRM follow-ups, client portal events, revenue risks, vendor gaps, reports, and Mission Control tasks."
      tickerItems={[
        { label: "Unread", value: `${summary.unread || 0}`, dotClass: summary.unread ? "vs-live-dot-warning" : "vs-live-dot-success" },
        { label: "Critical", value: `${summary.critical || 0}`, dotClass: summary.critical ? "vs-live-dot" : "vs-live-dot-success" },
        { label: "Warnings", value: `${summary.warning || 0}`, dotClass: summary.warning ? "vs-live-dot-warning" : "vs-live-dot-success" },
        { label: "Updated", value: refreshing ? "Live" : lastUpdated || "Ready", dotClass: refreshing ? "vs-live-dot-warning" : "vs-live-dot-success" },
      ]}
    >
      <style>{`
        .notify-grid {
          display: grid;
          grid-template-columns: minmax(0, .72fr) minmax(0, 1.28fr);
          gap: 18px;
          align-items: start;
        }

        .notify-stack {
          display: grid;
          gap: 14px;
        }

        .notify-form,
        .notify-filters {
          display: grid;
          gap: 10px;
        }

        .notify-form input,
        .notify-form select,
        .notify-form textarea,
        .notify-filters input,
        .notify-filters select {
          width: 100%;
          border-radius: 14px;
          border: 1px solid rgba(148, 163, 184, 0.18);
          background: rgba(15, 23, 42, 0.74);
          color: white;
          padding: 11px 12px;
          outline: none;
        }

        .notify-form textarea {
          min-height: 76px;
          resize: vertical;
        }

        .notify-row {
          border-radius: 20px;
          border: 1px solid rgba(148, 163, 184, .16);
          background:
            radial-gradient(circle at top right, rgba(59, 130, 246, .1), transparent 34%),
            linear-gradient(135deg, rgba(15, 23, 42, .78), rgba(2, 6, 23, .54));
          overflow: hidden;
        }

        .notify-critical {
          border-color: rgba(248, 113, 113, .38);
        }

        .notify-warning {
          border-color: rgba(251, 191, 36, .32);
        }

        .notify-row .vs-responsive-row {
          border: 0;
          background: transparent;
        }

        .notify-actions {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .notify-message {
          border-radius: 16px;
          border: 1px solid rgba(96, 165, 250, 0.24);
          background: rgba(37, 99, 235, 0.14);
          color: rgba(226, 232, 240, 0.92);
          padding: 12px;
        }

        .notify-mix {
          display: grid;
          gap: 10px;
        }

        .notify-mix-row {
          display: grid;
          grid-template-columns: 86px minmax(0, 1fr) 44px;
          gap: 10px;
          align-items: center;
          color: rgba(226, 232, 240, .9);
          font-size: 12px;
        }

        .notify-track {
          height: 10px;
          border-radius: 999px;
          background: rgba(15, 23, 42, .86);
          border: 1px solid rgba(148, 163, 184, .12);
          overflow: hidden;
        }

        .notify-fill {
          height: 100%;
          border-radius: 999px;
          background: rgba(96, 165, 250, .76);
        }

        @media (max-width: 1100px) {
          .notify-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}
      {message ? <div className="notify-message">{message}</div> : null}

      <div className="vs-grid-4">
        <StatCard label="Total Alerts" value={fmt(summary.total)} delta="Unified inbox" tone="up" />
        <StatCard label="Critical" value={fmt(summary.critical)} delta="Immediate review" tone={summary.critical ? "down" : "up"} />
        <StatCard label="Warnings" value={fmt(summary.warning)} delta="Needs attention" tone={summary.warning ? "neutral" : "up"} />
        <StatCard label="Unread" value={fmt(summary.unread)} delta="Open alerts" tone={summary.unread ? "neutral" : "up"} />
      </div>

      <div className="notify-grid">
        <div className="notify-stack">
          <SectionCard title="Create Manual Alert" subtitle="Add a firm-level executive alert.">
            <NotificationForm onCreate={createManualAlert} saving={saving} />
          </SectionCard>

          <SectionCard title="Filters" subtitle="Search and filter alerts.">
            <div className="notify-filters">
              <input
                placeholder="Search alerts..."
                value={filters.q}
                onChange={(e) => setFilters({ ...filters, q: e.target.value })}
              />

              <select value={filters.level} onChange={(e) => setFilters({ ...filters, level: e.target.value })}>
                <option value="">All Levels</option>
                <option value="critical">Critical</option>
                <option value="warning">Warning</option>
                <option value="info">Info</option>
              </select>

              <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
                <option value="">All Categories</option>
                {arr(data.categories).map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>

              <select value={filters.source} onChange={(e) => setFilters({ ...filters, source: e.target.value })}>
                <option value="">All Sources</option>
                {arr(data.sources).map((source) => (
                  <option key={source} value={source}>{source}</option>
                ))}
              </select>

              <select value={filters.state} onChange={(e) => setFilters({ ...filters, state: e.target.value })}>
                <option value="">All States</option>
                {arr(data.states).map((state) => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>

              <button className="vs-button" onClick={() => load({ quiet: true })}>
                {refreshing ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </SectionCard>

          <SectionCard title="Alert Mix" subtitle="Current alert severity distribution.">
            <div className="notify-mix">
              {levelMix.map((item) => {
                const total = Math.max(1, Number(summary.total || 0));
                const width = Math.round((Number(item.value || 0) / total) * 100);

                return (
                  <div key={item.label} className="notify-mix-row">
                    <span>{item.label}</span>
                    <div className="notify-track">
                      <div className="notify-fill" style={{ width: `${width}%` }} />
                    </div>
                    <Badge tone={item.tone}>{item.value}</Badge>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        </div>

        <SectionCard
          title="Unified Alert Inbox"
          subtitle="Cross-system alerts from the full VoterSpheres operating system."
          right={<Badge tone={notifications.length ? "demo" : "active"}>{notifications.length}</Badge>}
        >
          {loading ? (
            <EmptyState text="Loading notifications..." />
          ) : !notifications.length ? (
            <EmptyState text="No alerts match the current filters." />
          ) : (
            <div className="notify-stack">
              {notifications.map((item) => (
                <NotificationRow
                  key={item.id}
                  item={item}
                  onRead={markRead}
                  onArchive={archive}
                />
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </PageShell>
  );
}
