import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
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

function fmt(value) {
  return Number(value || 0).toLocaleString();
}

function tone(value) {
  const v = String(value || "").toLowerCase();
  if (["critical", "high", "blocked", "overdue"].includes(v)) return "danger";
  if (["elevated", "medium", "open", "pending"].includes(v)) return "demo";
  if (["complete", "completed", "done", "resolved", "stable"].includes(v)) return "active";
  return "accent";
}

function clean(value = "") {
  return String(value || "")
    .replace(/<a\b[^>]*>(.*?)<\/a>/gi, "$1")
    .replace(/<font\b[^>]*>(.*?)<\/font>/gi, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function arr(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.results)) return value.results;
  if (Array.isArray(value?.workspaces)) return value.workspaces;
  if (Array.isArray(value?.rows)) return value.rows;
  return [];
}

function workspaceTitle(workspace) {
  return workspace?.name || workspace?.campaign_name || workspace?.title || `Workspace ${workspace?.id || ""}`;
}

function ContactForm({ workspaceId, onCreated, onError }) {
  const [form, setForm] = useState({
    full_name: "",
    organization: "",
    title: "",
    email: "",
    phone: "",
    role_type: "stakeholder",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setSaving(true);

    try {
      await api.createCampaignCrmContact({
        ...form,
        workspace_id: workspaceId || null,
      });

      setForm({
        full_name: "",
        organization: "",
        title: "",
        email: "",
        phone: "",
        role_type: "stakeholder",
        notes: "",
      });

      await onCreated?.();
    } catch (err) {
      onError?.(
        err?.response?.data?.error ||
          err?.response?.data?.detail ||
          err?.message ||
          "Failed to create contact."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="crm-form" onSubmit={submit}>
      <input
        required
        placeholder="Full name"
        value={form.full_name}
        onChange={(e) => setForm({ ...form, full_name: e.target.value })}
      />
      <input
        placeholder="Organization"
        value={form.organization}
        onChange={(e) => setForm({ ...form, organization: e.target.value })}
      />
      <input
        placeholder="Title"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
      />
      <input
        placeholder="Email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      />
      <input
        placeholder="Phone"
        value={form.phone}
        onChange={(e) => setForm({ ...form, phone: e.target.value })}
      />

      <select
        value={form.role_type}
        onChange={(e) => setForm({ ...form, role_type: e.target.value })}
      >
        <option value="stakeholder">Stakeholder</option>
        <option value="candidate">Candidate</option>
        <option value="consultant">Consultant</option>
        <option value="vendor">Vendor</option>
        <option value="donor">Donor</option>
        <option value="staff">Staff</option>
        <option value="press">Press</option>
      </select>

      <textarea
        placeholder="Notes"
        value={form.notes}
        onChange={(e) => setForm({ ...form, notes: e.target.value })}
      />

      <button className="vs-button" disabled={saving}>
        {saving ? "Saving..." : "Add Contact"}
      </button>
    </form>
  );
}

function ActivityForm({ workspaceId, contacts, onCreated, onError }) {
  const [form, setForm] = useState({
    contact_id: "",
    activity_type: "note",
    title: "",
    body: "",
    outcome: "",
  });
  const [saving, setSaving] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setSaving(true);

    try {
      await api.createCampaignCrmActivity({
        ...form,
        contact_id: form.contact_id || null,
        workspace_id: workspaceId || null,
      });

      setForm({
        contact_id: "",
        activity_type: "note",
        title: "",
        body: "",
        outcome: "",
      });

      await onCreated?.();
    } catch (err) {
      onError?.(
        err?.response?.data?.error ||
          err?.response?.data?.detail ||
          err?.message ||
          "Failed to log activity."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="crm-form" onSubmit={submit}>
      <select
        value={form.contact_id}
        onChange={(e) => setForm({ ...form, contact_id: e.target.value })}
      >
        <option value="">No linked contact</option>
        {contacts.map((contact) => (
          <option key={contact.id} value={contact.id}>
            {contact.full_name}
          </option>
        ))}
      </select>

      <select
        value={form.activity_type}
        onChange={(e) => setForm({ ...form, activity_type: e.target.value })}
      >
        <option value="note">Note</option>
        <option value="call">Call</option>
        <option value="meeting">Meeting</option>
        <option value="email">Email</option>
        <option value="follow_up">Follow-up</option>
        <option value="rapid_response">Rapid Response</option>
      </select>

      <input
        required
        placeholder="Activity title"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
      />
      <textarea
        placeholder="Details"
        value={form.body}
        onChange={(e) => setForm({ ...form, body: e.target.value })}
      />
      <input
        placeholder="Outcome / next step"
        value={form.outcome}
        onChange={(e) => setForm({ ...form, outcome: e.target.value })}
      />

      <button className="vs-button" disabled={saving}>
        {saving ? "Saving..." : "Log Activity"}
      </button>
    </form>
  );
}

function CrmExecutiveHeader({
  summary,
  selectedWorkspace,
  workspaceId,
  contacts,
  activities,
  tasks,
  signals,
  rapidResponses,
  recommendations,
  highSignals,
  loading,
  refreshing,
  lastUpdated,
  onRefresh,
}) {
  const openTasks = Number(summary.open_tasks || tasks.length || 0);
  const signalCount = Number(summary.signals || signals.length || 0);
  const contactCount = Number(summary.contacts || contacts.length || 0);
  const activityCount = Number(summary.activities || activities.length || 0);
  const highSignalCount = highSignals.length;

  const readinessScore = Math.max(
    5,
    Math.min(
      100,
      Math.round(
        74 +
          Math.min(12, contactCount * 0.8) +
          Math.min(10, activityCount * 0.55) +
          Math.min(8, recommendations.length * 1.2) -
          Math.min(20, highSignalCount * 5) -
          Math.min(14, openTasks * 1.1) -
          Math.min(8, rapidResponses.length * 1.4)
      )
    )
  );

  const scope =
    selectedWorkspace
      ? workspaceTitle(selectedWorkspace)
      : workspaceId
        ? `Workspace ${workspaceId}`
        : "Firmwide CRM";

  return (
    <div className="crm-exec-ribbon" id="crm-overview">
      <div className="crm-exec-copy">
        <span>Campaign CRM Readiness</span>
        <strong>{readinessScore}% Ready</strong>
        <p>
          Executive relationship command layer for workspace contacts, activities,
          follow-ups, political signals, rapid responses, execution tasks, and AI CRM recommendations.
        </p>

        <div className="crm-exec-badges">
          <Badge tone="active">{contactCount} Contacts</Badge>
          <Badge tone="info">{activityCount} Activities</Badge>
          <Badge tone={openTasks ? "demo" : "active"}>{openTasks} Open Tasks</Badge>
          <Badge tone={highSignalCount ? "danger" : "active"}>{highSignalCount} High Signals</Badge>
          <Badge tone="accent">{recommendations.length} AI Recommendations</Badge>
        </div>
      </div>

      <div className="crm-exec-grid">
        <div>
          <span>Active Scope</span>
          <strong>{scope}</strong>
        </div>
        <div>
          <span>Political Signals</span>
          <strong>{fmt(signalCount)}</strong>
        </div>
        <div>
          <span>Rapid Responses</span>
          <strong>{fmt(rapidResponses.length)}</strong>
        </div>
        <div>
          <span>Live Status</span>
          <strong>{loading || refreshing ? "Refreshing" : "Ready"}</strong>
        </div>
      </div>

      <div className="crm-exec-actions">
        <button type="button" onClick={onRefresh} disabled={loading || refreshing}>
          {refreshing ? "Refreshing CRM..." : "Refresh CRM"}
        </button>
        <button type="button" onClick={() => document.getElementById("crm-add-contact")?.scrollIntoView({ behavior: "smooth", block: "start" })}>
          Add Contact
        </button>
        <button type="button" onClick={() => document.getElementById("crm-log-activity")?.scrollIntoView({ behavior: "smooth", block: "start" })}>
          Log Activity
        </button>
        <Link to="/command-center">Command Center</Link>
        <Link to="/ai-war-room">AI War Room</Link>
        <Link to="/political-intelligence">Political Intelligence</Link>
        <Link to="/state-operations">State Operations</Link>
      </div>

      <div className="crm-exec-footer">
        <span>Updated: {lastUpdated || "Ready"}</span>
        <span>Auto Refresh: 30 seconds</span>
      </div>
    </div>
  );
}

function CrmActionCenter({ onRefresh }) {
  return (
    <div className="crm-action-center">
      <button type="button" onClick={onRefresh}>Refresh CRM</button>
      <button type="button" onClick={() => document.getElementById("crm-add-contact")?.scrollIntoView({ behavior: "smooth", block: "start" })}>Add Contact</button>
      <button type="button" onClick={() => document.getElementById("crm-log-activity")?.scrollIntoView({ behavior: "smooth", block: "start" })}>Log Activity</button>
      <Link to="/command-center">Open Command Center</Link>
      <Link to="/ai-war-room">Open AI War Room</Link>
      <Link to="/political-intelligence">Open Political Intelligence</Link>
      <Link to="/executive-decision-intelligence">Executive Intelligence</Link>
      <Link to="/state-operations">Open State Operations</Link>
      <Link to="/narrative-response">Open Rapid Response</Link>
    </div>
  );
}

function CrmExecutiveBrief({
  selectedWorkspace,
  workspaceId,
  contacts,
  activities,
  tasks,
  signals,
  rapidResponses,
  recommendations,
  highSignals,
}) {
  const scope =
    selectedWorkspace
      ? workspaceTitle(selectedWorkspace)
      : workspaceId
        ? `Workspace ${workspaceId}`
        : "Firmwide CRM";

  return (
    <div className="crm-ai-brief">
      <strong>{scope} Relationship Brief</strong>
      <p>
        This workspace currently has {fmt(contacts.length)} contacts, {fmt(activities.length)} activities,
        {fmt(tasks.length)} execution tasks, {fmt(signals.length)} political signals,
        and {fmt(rapidResponses.length)} rapid response items. {highSignals.length
          ? `${fmt(highSignals.length)} high-priority signal${highSignals.length === 1 ? "" : "s"} should be reviewed before the next outreach cycle.`
          : "No high-priority political signals are currently attached to this CRM scope."}
      </p>

      <div className="crm-ai-brief-grid">
        <div><span>Contacts</span><b>{fmt(contacts.length)}</b></div>
        <div><span>Activities</span><b>{fmt(activities.length)}</b></div>
        <div><span>Open Tasks</span><b>{fmt(tasks.length)}</b></div>
        <div><span>AI Recommendations</span><b>{fmt(recommendations.length)}</b></div>
      </div>
    </div>
  );
}

export default function CampaignWorkspaceCRM() {
  const [params, setParams] = useSearchParams();

  const [workspaceId, setWorkspaceId] = useState(
    params.get("workspace_id") || params.get("workspaceId") || ""
  );

  const [workspaces, setWorkspaces] = useState([]);
  const [data, setData] = useState({
    summary: {},
    contacts: [],
    activities: [],
    tasks: [],
    signals: [],
    rapid_responses: [],
    ai_recommendations: [],
  });

  const [loading, setLoading] = useState(true);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");

  const selectedWorkspace = useMemo(() => {
    return workspaces.find((item) => String(item.id) === String(workspaceId)) || null;
  }, [workspaces, workspaceId]);

  const loadWorkspaces = useCallback(async () => {
    try {
      setWorkspaceLoading(true);

      const result =
        typeof api.workspaces === "function"
          ? await api.workspaces()
          : typeof api.campaignWorkspaces === "function"
            ? await api.campaignWorkspaces()
            : [];

      setWorkspaces(arr(result));
    } catch {
      setWorkspaces([]);
    } finally {
      setWorkspaceLoading(false);
    }
  }, []);

  const load = useCallback(
    async ({ quiet = false } = {}) => {
      try {
        if (quiet) setRefreshing(true);
        else setLoading(true);

        setError("");

        const result = await api.campaignCrmDashboard(workspaceId || null);

        setData({
          summary: result?.summary || {},
          contacts: arr(result?.contacts),
          activities: arr(result?.activities),
          tasks: arr(result?.tasks),
          signals: arr(result?.signals),
          rapid_responses: arr(result?.rapid_responses),
          ai_recommendations: arr(result?.ai_recommendations),
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
            "Failed to load Campaign Workspace CRM."
        );

        setData({
          summary: {},
          contacts: [],
          activities: [],
          tasks: [],
          signals: [],
          rapid_responses: [],
          ai_recommendations: [],
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [workspaceId]
  );

  useEffect(() => {
    loadWorkspaces();
  }, [loadWorkspaces]);

  useEffect(() => {
    load();
    const interval = setInterval(() => load({ quiet: true }), 30000);
    return () => clearInterval(interval);
  }, [load]);

  function changeWorkspace(nextId) {
    const value = nextId || "";
    setWorkspaceId(value);

    if (value) {
      setParams({ workspace_id: value });
    } else {
      setParams({});
    }
  }

  async function completeActivity(id) {
    try {
      setMessage("");
      await api.completeCampaignCrmActivity(id);
      setMessage("CRM activity completed.");
      await load({ quiet: true });
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.response?.data?.detail ||
          err?.message ||
          "Failed to complete activity."
      );
    }
  }

  const summary = data.summary || {};
  const contacts = arr(data.contacts);
  const activities = arr(data.activities);
  const tasks = arr(data.tasks);
  const signals = arr(data.signals);
  const rapidResponses = arr(data.rapid_responses);
  const recommendations = arr(data.ai_recommendations);

  const highSignals = useMemo(() => {
    return signals.filter((signal) =>
      ["Critical", "High", "critical", "high"].includes(
        String(signal.risk || signal.severity || "")
      )
    );
  }, [signals]);

  const navSections = [
    { id: "crm-overview", label: "Overview" },
    { id: "crm-scope", label: "Scope" },
    { id: "crm-metrics", label: "Metrics" },
    { id: "crm-contacts", label: "Contacts", badge: contacts.length },
    { id: "crm-activities", label: "Activities", badge: activities.length },
    { id: "crm-signals", label: "Signals", badge: signals.length },
    { id: "crm-tasks", label: "Tasks", badge: tasks.length },
    { id: "crm-add-contact", label: "Add Contact" },
    { id: "crm-log-activity", label: "Log Activity" },
    { id: "crm-ai", label: "AI", badge: recommendations.length },
    { id: "crm-brief", label: "Brief" },
    { id: "crm-actions", label: "Actions" },
  ];

  return (
    <PageShell
      eyebrow="Campaign Workspace CRM"
      title="Campaign Workspace CRM"
      description="Relationship and activity command layer for campaign workspaces, contacts, tasks, political signals, rapid responses, and AI recommendations."
      tickerItems={[
        {
          label: "Scope",
          value: selectedWorkspace
            ? workspaceTitle(selectedWorkspace)
            : workspaceId
              ? `Workspace ${workspaceId}`
              : "Firmwide",
          dotClass: "vs-live-dot-success",
        },
        {
          label: "Contacts",
          value: `${summary.contacts || 0}`,
          dotClass: "vs-live-dot-success",
        },
        {
          label: "Open Tasks",
          value: `${summary.open_tasks || 0}`,
          dotClass: summary.open_tasks ? "vs-live-dot-warning" : "vs-live-dot-success",
        },
        {
          label: "Signals",
          value: `${summary.signals || signals.length || 0}`,
          dotClass: "vs-live-dot-success",
        },
        {
          label: "Updated",
          value: refreshing ? "Live" : lastUpdated || "Ready",
          dotClass: refreshing ? "vs-live-dot-warning" : "vs-live-dot-success",
        },
      ]}
    >
      <style>{`
        .crm-exec-ribbon {
          display: grid;
          grid-template-columns: minmax(300px, 0.95fr) minmax(0, 1.15fr);
          gap: 18px;
          align-items: stretch;
          border: 1px solid rgba(148, 163, 184, 0.16);
          border-radius: 28px;
          background:
            radial-gradient(circle at top right, rgba(59, 130, 246, 0.18), transparent 34%),
            radial-gradient(circle at bottom left, rgba(34, 197, 94, 0.12), transparent 30%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.94), rgba(2, 6, 23, 0.86));
          box-shadow: 0 28px 80px rgba(2, 6, 23, 0.32);
          padding: 20px;
          min-width: 0;
          overflow: hidden;
        }

        .crm-exec-copy { min-width: 0; }

        .crm-exec-copy span,
        .crm-exec-grid span,
        .crm-exec-footer span,
        .crm-ai-brief-grid span {
          display: block;
          color: rgba(147, 197, 253, 0.86);
          font-size: 11px;
          font-weight: 950;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .crm-exec-copy strong {
          display: block;
          margin-top: 8px;
          color: white;
          font-size: clamp(30px, 4vw, 50px);
          line-height: 1;
          font-weight: 950;
          letter-spacing: -0.07em;
        }

        .crm-exec-copy p {
          margin: 12px 0 0;
          color: rgba(226, 232, 240, 0.78);
          line-height: 1.6;
          max-width: 820px;
        }

        .crm-exec-badges,
        .crm-exec-actions,
        .crm-exec-footer,
        .crm-action-center {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          align-items: center;
        }

        .crm-exec-badges { margin-top: 14px; }

        .crm-exec-grid,
        .crm-ai-brief-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          min-width: 0;
        }

        .crm-exec-grid div,
        .crm-ai-brief-grid div {
          border: 1px solid rgba(148, 163, 184, 0.14);
          border-radius: 18px;
          background: rgba(2, 6, 23, 0.34);
          padding: 14px;
          min-width: 0;
        }

        .crm-exec-grid strong,
        .crm-ai-brief-grid b {
          display: block;
          margin-top: 7px;
          color: white;
          font-size: 20px;
          font-weight: 950;
          overflow-wrap: anywhere;
        }

        .crm-exec-actions,
        .crm-exec-footer {
          grid-column: 1 / -1;
          border-top: 1px solid rgba(148, 163, 184, 0.12);
          padding-top: 14px;
        }

        .crm-exec-actions button,
        .crm-exec-actions a,
        .crm-action-center button,
        .crm-action-center a {
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

        .crm-exec-actions button:hover,
        .crm-exec-actions a:hover,
        .crm-action-center button:hover,
        .crm-action-center a:hover {
          border-color: rgba(74, 222, 128, 0.42);
          background: rgba(34, 197, 94, 0.14);
          color: white;
        }

        .crm-exec-actions button:disabled { opacity: 0.62; cursor: not-allowed; }

        .crm-exec-stack {
          display: grid;
          gap: 18px;
          min-width: 0;
        }

        .crm-ai-brief {
          border-radius: 24px;
          border: 1px solid rgba(96, 165, 250, 0.24);
          background:
            radial-gradient(circle at top right, rgba(37, 99, 235, 0.18), transparent 36%),
            rgba(15, 23, 42, 0.58);
          padding: 18px;
        }

        .crm-ai-brief strong {
          display: block;
          color: white;
          font-size: 20px;
          font-weight: 950;
          letter-spacing: -0.04em;
        }

        .crm-ai-brief p {
          color: rgba(226, 232, 240, 0.86);
          font-size: 13px;
          line-height: 1.65;
          margin: 10px 0 14px;
        }


        .crm-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.25fr) minmax(360px, 0.75fr);
          gap: 18px;
          align-items: start;
        }

        .crm-stack {
          display: grid;
          gap: 14px;
        }

        .crm-form {
          display: grid;
          gap: 10px;
        }

        .crm-form input,
        .crm-form select,
        .crm-form textarea,
        .crm-workspace-select {
          width: 100%;
          border-radius: 14px;
          border: 1px solid rgba(148, 163, 184, 0.18);
          background: rgba(15, 23, 42, 0.74);
          color: white;
          padding: 11px 12px;
          outline: none;
        }

        .crm-form textarea {
          min-height: 86px;
          resize: vertical;
        }

        .crm-row {
          border-radius: 20px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          background:
            radial-gradient(circle at top right, rgba(59, 130, 246, 0.1), transparent 34%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.78), rgba(2, 6, 23, 0.54));
          overflow: hidden;
        }

        .crm-row .vs-responsive-row {
          border: 0;
          background: transparent;
          min-width: 0;
          max-width: 100%;
        }

        /*
         * Contact rows can contain long organization names, titles, and email
         * addresses. Force every nested layout child to shrink inside the card
         * and wrap instead of widening the workspace column.
         */
        .crm-contact-row,
        .crm-contact-row .vs-responsive-row,
        .crm-contact-row .vs-responsive-row > *,
        .crm-contact-row [class*="responsive-row"],
        .crm-contact-row [class*="responsive-row"] > * {
          min-width: 0;
          max-width: 100%;
        }

        .crm-contact-row strong,
        .crm-contact-row p,
        .crm-contact-row span,
        .crm-contact-row small,
        .crm-contact-row a,
        .crm-contact-row [class*="title"],
        .crm-contact-row [class*="subtitle"],
        .crm-contact-row [class*="meta"] {
          white-space: normal;
          overflow-wrap: anywhere;
          word-break: break-word;
          hyphens: auto;
        }

        .crm-contact-row a {
          display: inline;
          max-width: 100%;
        }

        .crm-contact-row .vs-badge,
        .crm-contact-row [class*="badge"] {
          flex: 0 0 auto;
          width: fit-content;
          max-width: 100%;
          white-space: normal;
          text-align: center;
        }

        .crm-contact-row .vs-responsive-row {
          overflow: hidden;
        }

        .crm-workspace-box {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(260px, 360px);
          gap: 14px;
          align-items: center;
        }

        .crm-workspace-box span {
          display: block;
          color: rgba(203, 213, 225, 0.64);
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .crm-workspace-box strong {
          display: block;
          margin-top: 5px;
          color: white;
          font-size: 20px;
          font-weight: 950;
        }

        .crm-workspace-box small {
          display: block;
          margin-top: 5px;
          color: rgba(203, 213, 225, 0.66);
        }

        .crm-recommendation {
          border-radius: 18px;
          border: 1px solid rgba(96, 165, 250, 0.24);
          background: rgba(37, 99, 235, 0.14);
          padding: 14px;
          color: rgba(226, 232, 240, 0.92);
          font-size: 13px;
          line-height: 1.55;
        }

        .crm-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          flex-wrap: wrap;
        }

        .crm-message {
          border-radius: 16px;
          border: 1px solid rgba(96, 165, 250, 0.24);
          background: rgba(37, 99, 235, 0.14);
          color: rgba(226, 232, 240, 0.92);
          padding: 12px;
        }

        @media (max-width: 1100px) {
          .crm-grid,
          .crm-workspace-box,
          .crm-exec-ribbon {
            grid-template-columns: 1fr;
          }

          .crm-exec-grid,
          .crm-ai-brief-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="crm-exec-stack">
        <CrmExecutiveHeader
          summary={summary}
          selectedWorkspace={selectedWorkspace}
          workspaceId={workspaceId}
          contacts={contacts}
          activities={activities}
          tasks={tasks}
          signals={signals}
          rapidResponses={rapidResponses}
          recommendations={recommendations}
          highSignals={highSignals}
          loading={loading}
          refreshing={refreshing}
          lastUpdated={lastUpdated}
          onRefresh={() => load({ quiet: true })}
        />

        <ExecutivePageNav sections={navSections} />
      </div>

      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}
      {message ? <div className="crm-message">{message}</div> : null}

      <CollapsibleSection
        id="crm-scope"
        title="CRM Workspace Scope"
        subtitle="Loads firmwide by default. Select a workspace to narrow contacts, tasks, and signals."
        right={
          <Badge tone="accent">
            {workspaceLoading ? "Loading" : `${workspaces.length} workspaces`}
          </Badge>
        }
      >
        <div className="crm-workspace-box">
          <div>
            <span>Selected Scope</span>
            <strong>
              {selectedWorkspace
                ? workspaceTitle(selectedWorkspace)
                : workspaceId
                  ? `Workspace ${workspaceId}`
                  : "Firmwide CRM"}
            </strong>
            <small>
              {selectedWorkspace?.state || "National"} •{" "}
              {selectedWorkspace?.office || "Campaign"} •{" "}
              {selectedWorkspace?.cycle || "2026"}
            </small>
          </div>

          <select
            className="crm-workspace-select"
            value={workspaceId || ""}
            onChange={(e) => changeWorkspace(e.target.value)}
          >
            <option value="">Firmwide CRM</option>
            {workspaces.map((workspace) => (
              <option key={workspace.id} value={workspace.id}>
                {workspaceTitle(workspace)}
              </option>
            ))}
          </select>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        id="crm-metrics"
        title="CRM Metrics"
        subtitle="Contacts, activities, open tasks, and political intelligence signals for the active scope."
        defaultOpen
        right={<Badge tone="active">{summary.contacts || contacts.length} Contacts</Badge>}
      >
      <div className="vs-grid-4">
        <StatCard label="Contacts" value={fmt(summary.contacts)} delta="Workspace relationships" tone="up" />
        <StatCard label="Activities" value={fmt(summary.activities)} delta="Notes and touches" tone="up" />
        <StatCard label="Open Tasks" value={fmt(summary.open_tasks)} delta="Execution items" tone={summary.open_tasks ? "neutral" : "up"} />
        <StatCard label="Signals" value={fmt(summary.signals || signals.length)} delta="Political intelligence" tone="up" />
      </div>
      </CollapsibleSection>

      {loading ? (
        <EmptyState text="Loading Campaign Workspace CRM..." />
      ) : (
        <div className="crm-grid">
          <div className="crm-stack">
            <CollapsibleSection id="crm-contacts" title="Workspace Contacts" subtitle="Candidates, consultants, vendors, donors, press, and key stakeholders." right={<Badge tone="accent">{contacts.length} contacts</Badge>}>
              {!contacts.length ? (
                <EmptyState text="No CRM contacts yet." />
              ) : (
                <ShowMoreList
                  items={contacts}
                  initialCount={10}
                  showAllLabel={(count) => `Show All ${count} Contacts`}
                  className="crm-stack"
                  renderItem={(contact) => (
                    <div className="crm-row crm-contact-row">
                      <ResponsiveRow
                        title={contact.full_name}
                        subtitle={`${contact.organization || "No organization"} • ${contact.title || contact.role_type || "Stakeholder"}`}
                        meta={[
                          { label: "Role", value: contact.role_type || "stakeholder" },
                          { label: "Email", value: contact.email || "—" },
                          { label: "Phone", value: contact.phone || "—" },
                          { label: "State", value: contact.state || "—" },
                        ]}
                        right={<Badge tone="accent">{contact.role_type || "contact"}</Badge>}
                      />
                    </div>
                  )}
                />
              )}
            </CollapsibleSection>

            <CollapsibleSection id="crm-activities" title="Activity Timeline" subtitle="Notes, meetings, calls, follow-ups, outcomes, and institutional memory." right={<Badge tone="accent">{activities.length} activities</Badge>}>
              {!activities.length ? (
                <EmptyState text="No CRM activity yet." />
              ) : (
                <ShowMoreList
                  items={activities}
                  initialCount={10}
                  showAllLabel={(count) => `Show All ${count} Activities`}
                  className="crm-stack"
                  renderItem={(activity) => (
                    <div className="crm-row">
                      <ResponsiveRow
                        title={activity.title}
                        subtitle={clean(activity.body || activity.outcome || activity.contact_name || "CRM activity")}
                        meta={[
                          { label: "Type", value: activity.activity_type || "note" },
                          { label: "Contact", value: activity.contact_name || "—" },
                          { label: "Outcome", value: activity.outcome || "—" },
                          { label: "Completed", value: activity.completed_at ? "Yes" : "No" },
                        ]}
                        right={
                          <div className="crm-actions">
                            <Badge tone={activity.completed_at ? "active" : "demo"}>{activity.completed_at ? "Complete" : "Open"}</Badge>
                            {!activity.completed_at ? (
                              <button className="vs-button vs-button-secondary" onClick={() => completeActivity(activity.id)}>
                                Complete
                              </button>
                            ) : null}
                          </div>
                        }
                      />
                    </div>
                  )}
                />
              )}
            </CollapsibleSection>

            <CollapsibleSection id="crm-signals" title="Signals + Rapid Responses" subtitle="Live political signals and narrative response work linked to this CRM context." right={<Badge tone={highSignals.length ? "danger" : "active"}>{signals.length} signals</Badge>}>
              <div className="crm-stack">
                {signals.slice(0, 25).map((signal) => (
                  <div key={signal.id} className="crm-row">
                    <ResponsiveRow
                      title={clean(signal.title || "Political signal")}
                      subtitle={clean(signal.summary || signal.source || "Signal")}
                      meta={[
                        { label: "Type", value: signal.signal_type || "signal" },
                        { label: "Risk", value: signal.risk || signal.severity || "Stable" },
                        { label: "State", value: signal.state || "National" },
                        { label: "Score", value: signal.signal_score || 0 },
                      ]}
                      right={<Badge tone={tone(signal.risk || signal.severity)}>{signal.risk || signal.severity || "Signal"}</Badge>}
                    />
                  </div>
                ))}

                {!signals.length ? <EmptyState text="No workspace political signals yet." /> : null}

                {rapidResponses.slice(0, 12).map((response) => (
                  <div key={`rr-${response.id}`} className="crm-row">
                    <ResponsiveRow
                      title={response.title || "Rapid response"}
                      subtitle={response.response_strategy || response.narrative_summary || "Narrative response"}
                      meta={[
                        { label: "Status", value: response.status || "draft" },
                        { label: "Threat", value: response.threat_level || "medium" },
                        { label: "Owner", value: response.owner || "Unassigned" },
                      ]}
                      right={<Badge tone={tone(response.threat_level || response.status)}>{response.status || "draft"}</Badge>}
                    />
                  </div>
                ))}
              </div>
            </CollapsibleSection>

            <CollapsibleSection id="crm-tasks" title="Workspace Tasks" subtitle="Execution items attached to this campaign CRM context." right={<Badge tone="accent">{tasks.length} tasks</Badge>}>
              {!tasks.length ? (
                <EmptyState text="No workspace tasks yet." />
              ) : (
                <ShowMoreList
                  items={tasks}
                  initialCount={10}
                  showAllLabel={(count) => `Show All ${count} Tasks`}
                  className="crm-stack"
                  renderItem={(task) => (
                    <div className="crm-row">
                      <ResponsiveRow
                        title={task.title || "Task"}
                        subtitle={task.description || task.source || "Execution task"}
                        meta={[
                          { label: "Status", value: task.status || "open" },
                          { label: "Priority", value: task.priority || "medium" },
                          { label: "Owner", value: task.assigned_to || "Unassigned" },
                          { label: "State", value: task.state || "National" },
                        ]}
                        right={<Badge tone={tone(task.priority || task.status)}>{task.status || "open"}</Badge>}
                      />
                    </div>
                  )}
                />
              )}
            </CollapsibleSection>
          </div>

          <div className="crm-stack">
            <CollapsibleSection id="crm-add-contact" title="Add Contact" subtitle="Create CRM relationship records.">
              <ContactForm workspaceId={workspaceId} onCreated={() => load({ quiet: true })} onError={setError} />
            </CollapsibleSection>

            <CollapsibleSection id="crm-log-activity" title="Log Activity" subtitle="Add notes, calls, meetings, and follow-ups.">
              <ActivityForm workspaceId={workspaceId} contacts={contacts} onCreated={() => load({ quiet: true })} onError={setError} />
            </CollapsibleSection>

            <CollapsibleSection id="crm-ai" title="AI CRM Recommendations" subtitle="Operational next steps from workspace intelligence.">
              {!recommendations.length ? (
                <EmptyState text="No AI CRM recommendations available." />
              ) : (
                <ShowMoreList
                  items={recommendations}
                  initialCount={6}
                  showAllLabel={(count) => `Show All ${count} Recommendations`}
                  className="crm-stack"
                  renderItem={(item) => (
                    <div className="crm-recommendation">
                      {typeof item === "string" ? item : item.title || item.recommendation || item.detail || "CRM recommendation"}
                    </div>
                  )}
                />
              )}
            </CollapsibleSection>

            <CollapsibleSection
              id="crm-brief"
              title="Executive CRM Brief"
              subtitle="Summary of relationship health, activity, tasks, signals, and recommended action."
              defaultOpen={false}
              right={<Badge tone={highSignals.length ? "danger" : "active"}>{highSignals.length} High Signals</Badge>}
            >
              <CrmExecutiveBrief
                selectedWorkspace={selectedWorkspace}
                workspaceId={workspaceId}
                contacts={contacts}
                activities={activities}
                tasks={tasks}
                signals={signals}
                rapidResponses={rapidResponses}
                recommendations={recommendations}
                highSignals={highSignals}
              />
            </CollapsibleSection>
          </div>
        </div>
      )}

      <CollapsibleSection
        id="crm-actions"
        title="Executive Action Center"
        subtitle="Move CRM context into connected VoterSpheres execution modules."
        defaultOpen={false}
        right={<Badge tone="active">CRM Handoff</Badge>}
      >
        <CrmActionCenter onRefresh={() => load({ quiet: true })} />
      </CollapsibleSection>

      <BackToTopButton />
    </PageShell>
  );
}
