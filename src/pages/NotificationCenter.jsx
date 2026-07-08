import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";

import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import ResponsiveRow from "../components/ui/ResponsiveRow";
import ExecutivePageNav from "../components/ui/ExecutivePageNav";
import CollapsibleSection from "../components/ui/CollapsibleSection";
import BackToTopButton from "../components/ui/BackToTopButton";
import ShowMoreList from "../components/ui/ShowMoreList";

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

function NotificationExecutiveHeader({
  summary,
  notifications,
  sources,
  categories,
  states,
  loading,
  refreshing,
  saving,
  lastUpdated,
  onRefresh,
}) {
  const critical = Number(summary.critical || 0);
  const warning = Number(summary.warning || 0);
  const unread = Number(summary.unread || 0);
  const total = Number(summary.total || notifications.length || 0);

  const readinessScore = Math.max(
    5,
    Math.min(
      100,
      Math.round(
        96 -
          Math.min(32, critical * 8) -
          Math.min(20, warning * 3) -
          Math.min(18, unread * 1.6) -
          Math.min(8, total > 40 ? 8 : 0) -
          (loading || refreshing ? 4 : 0)
      )
    )
  );

  return (
    <div className="notify-exec-ribbon" id="notify-overview">
      <div className="notify-exec-copy">
        <span>Notification Readiness</span>
        <strong>{readinessScore}% Ready</strong>
        <p>
          Executive alert hub for political signals, War Room activity, Mission Control tasks,
          CRM follow-ups, client portal events, revenue risks, vendor gaps, and generated reports.
        </p>

        <div className="notify-exec-badges">
          <Badge tone={critical ? "danger" : "active"}>{critical} Critical</Badge>
          <Badge tone={warning ? "demo" : "active"}>{warning} Warnings</Badge>
          <Badge tone={unread ? "demo" : "active"}>{unread} Unread</Badge>
          <Badge tone="info">{sources.length} Sources</Badge>
          <Badge tone="accent">{categories.length} Categories</Badge>
          <Badge tone="active">{states.length} States</Badge>
        </div>
      </div>

      <div className="notify-exec-grid">
        <div>
          <span>Total Alerts</span>
          <strong>{fmt(total)}</strong>
        </div>
        <div>
          <span>Alert Status</span>
          <strong>{loading || refreshing || saving ? "Working" : "Ready"}</strong>
        </div>
        <div>
          <span>Visible Inbox</span>
          <strong>{fmt(notifications.length)}</strong>
        </div>
        <div>
          <span>Updated</span>
          <strong>{lastUpdated || "Ready"}</strong>
        </div>
      </div>

      <div className="notify-exec-actions">
        <button type="button" onClick={onRefresh} disabled={loading || refreshing}>
          {refreshing ? "Refreshing Alerts..." : "Refresh Alerts"}
        </button>
        <button type="button" onClick={() => document.getElementById("notify-create")?.scrollIntoView({ behavior: "smooth", block: "start" })}>
          Create Alert
        </button>
        <Link to="/mission-control">Mission Control</Link>
        <Link to="/ai-war-room">AI War Room</Link>
        <Link to="/command-center">Command Center</Link>
        <Link to="/campaign-crm">Campaign CRM</Link>
        <Link to="/political-intelligence">Political Intelligence</Link>
      </div>

      <div className="notify-exec-footer">
        <span>Auto Refresh: 30 seconds</span>
        <span>Alert Engine: Unified Notification Center</span>
      </div>
    </div>
  );
}

function NotificationExecutiveBrief({ summary, notifications }) {
  const critical = Number(summary.critical || 0);
  const warning = Number(summary.warning || 0);
  const unread = Number(summary.unread || 0);
  const topAlert = notifications[0];

  return (
    <div className="notify-ai-brief">
      <strong>Executive Alert Brief</strong>
      <p>
        The unified inbox currently has {fmt(summary.total || notifications.length)} total alerts,
        {fmt(critical)} critical alerts, {fmt(warning)} warnings, and {fmt(unread)} unread items.
        {topAlert
          ? ` Highest visible priority: ${topAlert.title || "Untitled alert"} from ${topAlert.source || "VoterSpheres"}.`
          : " No matching alerts are currently visible under the active filters."}
      </p>

      <div className="notify-ai-brief-grid">
        <div><span>Critical</span><b>{fmt(critical)}</b></div>
        <div><span>Warnings</span><b>{fmt(warning)}</b></div>
        <div><span>Unread</span><b>{fmt(unread)}</b></div>
        <div><span>Visible</span><b>{fmt(notifications.length)}</b></div>
      </div>
    </div>
  );
}

function NotificationActionCenter({ onRefresh }) {
  return (
    <div className="notify-action-center">
      <button type="button" onClick={onRefresh}>Refresh Notification Center</button>
      <button type="button" onClick={() => document.getElementById("notify-create")?.scrollIntoView({ behavior: "smooth", block: "start" })}>Create Executive Alert</button>
      <Link to="/mission-control">Open Mission Control</Link>
      <Link to="/ai-war-room">Open AI War Room</Link>
      <Link to="/command-center">Open Command Center</Link>
      <Link to="/campaign-crm">Open Campaign CRM</Link>
      <Link to="/executive-decision-intelligence">Executive Intelligence</Link>
      <Link to="/state-operations">State Operations</Link>
      <Link to="/vendors">Vendor Network</Link>
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

  const navSections = [
    { id: "notify-overview", label: "Overview" },
    { id: "notify-metrics", label: "Metrics" },
    { id: "notify-create", label: "Create Alert" },
    { id: "notify-filters", label: "Filters" },
    { id: "notify-mix", label: "Alert Mix" },
    { id: "notify-inbox", label: "Inbox", badge: notifications.length },
    { id: "notify-brief", label: "AI Brief" },
    { id: "notify-actions", label: "Actions" },
  ];

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
        .notify-exec-ribbon {
          display: grid;
          grid-template-columns: minmax(300px, 0.95fr) minmax(0, 1.15fr);
          gap: 18px;
          align-items: stretch;
          border: 1px solid rgba(148, 163, 184, 0.16);
          border-radius: 28px;
          background:
            radial-gradient(circle at top right, rgba(239, 68, 68, 0.17), transparent 34%),
            radial-gradient(circle at bottom left, rgba(59, 130, 246, 0.15), transparent 30%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(2, 6, 23, 0.86));
          box-shadow: 0 28px 80px rgba(2, 6, 23, 0.32);
          padding: 20px;
          min-width: 0;
          overflow: hidden;
        }

        .notify-exec-copy { min-width: 0; }

        .notify-exec-copy span,
        .notify-exec-grid span,
        .notify-exec-footer span,
        .notify-ai-brief-grid span {
          display: block;
          color: rgba(147, 197, 253, 0.86);
          font-size: 11px;
          font-weight: 950;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .notify-exec-copy strong {
          display: block;
          margin-top: 8px;
          color: white;
          font-size: clamp(30px, 4vw, 50px);
          line-height: 1;
          font-weight: 950;
          letter-spacing: -0.07em;
        }

        .notify-exec-copy p {
          margin: 12px 0 0;
          color: rgba(226, 232, 240, 0.78);
          line-height: 1.6;
          max-width: 820px;
        }

        .notify-exec-badges,
        .notify-exec-actions,
        .notify-exec-footer,
        .notify-action-center {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          align-items: center;
        }

        .notify-exec-badges { margin-top: 14px; }

        .notify-exec-grid,
        .notify-ai-brief-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          min-width: 0;
        }

        .notify-exec-grid div,
        .notify-ai-brief-grid div {
          border: 1px solid rgba(148, 163, 184, 0.14);
          border-radius: 18px;
          background: rgba(2, 6, 23, 0.34);
          padding: 14px;
          min-width: 0;
        }

        .notify-exec-grid strong,
        .notify-ai-brief-grid b {
          display: block;
          margin-top: 7px;
          color: white;
          font-size: 20px;
          font-weight: 950;
          overflow-wrap: anywhere;
        }

        .notify-exec-actions,
        .notify-exec-footer {
          grid-column: 1 / -1;
          border-top: 1px solid rgba(148, 163, 184, 0.12);
          padding-top: 14px;
        }

        .notify-exec-actions button,
        .notify-exec-actions a,
        .notify-action-center button,
        .notify-action-center a {
          border: 1px solid rgba(148, 163, 184, 0.18);
          background: rgba(15, 23, 42, 0.74);
          color: rgba(226, 232, 240, 0.92);
          border-radius: 15px;
          padding: 11px 12px;
          font-size: 12px;
          font-weight: 850;
          cursor: pointer;
          text-decoration: none;
        }

        .notify-exec-actions button:hover,
        .notify-exec-actions a:hover,
        .notify-action-center button:hover,
        .notify-action-center a:hover {
          border-color: rgba(248, 113, 113, 0.44);
          background: rgba(239, 68, 68, 0.14);
          color: white;
        }

        .notify-exec-actions button:disabled { opacity: 0.62; cursor: not-allowed; }

        .notify-exec-stack {
          display: grid;
          gap: 18px;
          min-width: 0;
        }

        .notify-ai-brief {
          border-radius: 24px;
          border: 1px solid rgba(96, 165, 250, 0.24);
          background:
            radial-gradient(circle at top right, rgba(37, 99, 235, 0.18), transparent 36%),
            rgba(15, 23, 42, 0.58);
          padding: 18px;
        }

        .notify-ai-brief strong {
          display: block;
          color: white;
          font-size: 20px;
          font-weight: 950;
          letter-spacing: -0.04em;
        }

        .notify-ai-brief p {
          color: rgba(226, 232, 240, 0.86);
          font-size: 13px;
          line-height: 1.65;
          margin: 10px 0 14px;
        }


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
          .notify-grid,
          .notify-exec-ribbon {
            grid-template-columns: 1fr;
          }

          .notify-exec-grid,
          .notify-ai-brief-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="notify-exec-stack">
        <NotificationExecutiveHeader
          summary={summary}
          notifications={notifications}
          sources={arr(data.sources)}
          categories={arr(data.categories)}
          states={arr(data.states)}
          loading={loading}
          refreshing={refreshing}
          saving={saving}
          lastUpdated={lastUpdated}
          onRefresh={() => load({ quiet: true })}
        />

        <ExecutivePageNav sections={navSections} />
      </div>

      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}
      {message ? <div className="notify-message">{message}</div> : null}

      <CollapsibleSection
        id="notify-metrics"
        title="Notification Metrics"
        subtitle="Unified alert totals, critical alerts, warnings, and unread executive notifications."
        defaultOpen
        right={<Badge tone={summary.critical ? "danger" : "active"}>{fmt(summary.critical)} Critical</Badge>}
      >
      <div className="vs-grid-4">
        <StatCard label="Total Alerts" value={fmt(summary.total)} delta="Unified inbox" tone="up" />
        <StatCard label="Critical" value={fmt(summary.critical)} delta="Immediate review" tone={summary.critical ? "down" : "up"} />
        <StatCard label="Warnings" value={fmt(summary.warning)} delta="Needs attention" tone={summary.warning ? "neutral" : "up"} />
        <StatCard label="Unread" value={fmt(summary.unread)} delta="Open alerts" tone={summary.unread ? "neutral" : "up"} />
      </div>
      </CollapsibleSection>

      <div className="notify-grid">
        <div className="notify-stack">
          <CollapsibleSection id="notify-create" title="Create Manual Alert" subtitle="Add a firm-level executive alert." defaultOpen={false}>
            <NotificationForm onCreate={createManualAlert} saving={saving} />
          </CollapsibleSection>

          <CollapsibleSection id="notify-filters" title="Filters" subtitle="Search and filter alerts.">
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
          </CollapsibleSection>

          <CollapsibleSection id="notify-mix" title="Alert Mix" subtitle="Current alert severity distribution.">
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
          </CollapsibleSection>
        </div>

        <CollapsibleSection
          id="notify-inbox"
          title="Unified Alert Inbox"
          subtitle="Cross-system alerts from the full VoterSpheres operating system."
          right={<Badge tone={notifications.length ? "demo" : "active"}>{notifications.length}</Badge>}
        >
          {loading ? (
            <EmptyState text="Loading notifications..." />
          ) : !notifications.length ? (
            <EmptyState text="No alerts match the current filters." />
          ) : (
            <ShowMoreList
              items={notifications}
              initialCount={12}
              showAllLabel={(count) => `Show All ${count} Alerts`}
              className="notify-stack"
              renderItem={(item) => (
                <NotificationRow
                  item={item}
                  onRead={markRead}
                  onArchive={archive}
                />
              )}
            />
          )}
        </CollapsibleSection>
      </div>

      <CollapsibleSection
        id="notify-brief"
        title="Executive Alert Brief"
        subtitle="Summary of alert posture and highest-priority visible notification."
        defaultOpen={false}
        right={<Badge tone={summary.critical ? "danger" : "active"}>{summary.critical || 0} Critical</Badge>}
      >
        <NotificationExecutiveBrief summary={summary} notifications={notifications} />
      </CollapsibleSection>

      <CollapsibleSection
        id="notify-actions"
        title="Executive Action Center"
        subtitle="Move alert context into connected VoterSpheres command modules."
        defaultOpen={false}
        right={<Badge tone="active">Alert Handoff</Badge>}
      >
        <NotificationActionCenter onRefresh={() => load({ quiet: true })} />
      </CollapsibleSection>

      <BackToTopButton />
    </PageShell>
  );
}
