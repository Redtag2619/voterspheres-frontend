import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
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
  return [];
}

function getStoredWorkspaceId() {
  try {
    return localStorage.getItem("vs_active_workspace") || "";
  } catch {
    return "";
  }
}

function setStoredWorkspaceId(id) {
  try {
    if (id) localStorage.setItem("vs_active_workspace", String(id));
    else localStorage.removeItem("vs_active_workspace");
  } catch {
    // ignore
  }
}

function workspaceTitle(workspace) {
  return workspace?.name || workspace?.campaign_name || workspace?.title || "Campaign Workspace";
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
      onError?.(err?.response?.data?.error || err?.response?.data?.detail || err?.message || "Failed to create contact.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="crm-form" onSubmit={submit}>
      <input required placeholder="Full name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
      <input placeholder="Organization" value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} />
      <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />

      <select value={form.role_type} onChange={(e) => setForm({ ...form, role_type: e.target.value })}>
        <option value="stakeholder">Stakeholder</option>
        <option value="candidate">Candidate</option>
        <option value="consultant">Consultant</option>
        <option value="vendor">Vendor</option>
        <option value="donor">Donor</option>
        <option value="staff">Staff</option>
        <option value="press">Press</option>
      </select>

      <textarea placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />

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
      onError?.(err?.response?.data?.error || err?.response?.data?.detail || err?.message || "Failed to log activity.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="crm-form" onSubmit={submit}>
      <select value={form.contact_id} onChange={(e) => setForm({ ...form, contact_id: e.target.value })}>
        <option value="">No linked contact</option>
        {contacts.map((contact) => (
          <option key={contact.id} value={contact.id}>
            {contact.full_name}
          </option>
        ))}
      </select>

      <select value={form.activity_type} onChange={(e) => setForm({ ...form, activity_type: e.target.value })}>
        <option value="note">Note</option>
        <option value="call">Call</option>
        <option value="meeting">Meeting</option>
        <option value="email">Email</option>
        <option value="follow_up">Follow-up</option>
        <option value="rapid_response">Rapid Response</option>
      </select>

      <input required placeholder="Activity title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      <textarea placeholder="Details" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
      <input placeholder="Outcome / next step" value={form.outcome} onChange={(e) => setForm({ ...form, outcome: e.target.value })} />

      <button className="vs-button" disabled={saving}>
        {saving ? "Saving..." : "Log Activity"}
      </button>
    </form>
  );
}

export default function CampaignWorkspaceCRM() {
  const [params, setParams] = useSearchParams();

  const [workspaceId, setWorkspaceId] = useState(
    params.get("workspace_id") || params.get("workspaceId") || getStoredWorkspaceId() || ""
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
  const [workspaceLoading, setWorkspaceLoading] = useState(true);
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

      const result = typeof api.workspaces === "function"
        ? await api.workspaces()
        : await api.campaignWorkspaces();

      const rows = arr(result);
      setWorkspaces(rows);

      if (!workspaceId && rows[0]?.id) {
        setWorkspaceId(String(rows[0].id));
        setStoredWorkspaceId(rows[0].id);
        setParams({ workspace_id: String(rows[0].id) });
      }
    } catch {
      setWorkspaces([]);
    } finally {
      setWorkspaceLoading(false);
    }
  }, [workspaceId, setParams]);

  const load = useCallback(async ({ quiet = false } = {}) => {
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

      setLastUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    } catch (err) {
      setError(err?.response?.data?.error || err?.response?.data?.detail || err?.message || "Failed to load Campaign Workspace CRM.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    loadWorkspaces();
  }, [loadWorkspaces]);

  useEffect(() => {
    load();
    const interval = setInterval(() => load({ quiet: true }), 30000);
    return () => clearInterval(interval);
  }, [load]);

  function changeWorkspace(nextId) {
    setWorkspaceId(nextId);
    setStoredWorkspaceId(nextId);

    if (nextId) setParams({ workspace_id: nextId });
    else setParams({});
  }

  async function completeActivity(id) {
    try {
      setMessage("");
      await api.completeCampaignCrmActivity(id);
      setMessage("CRM activity completed.");
      await load({ quiet: true });
    } catch (err) {
      setError(err?.response?.data?.error || err?.response?.data?.detail || err?.message || "Failed to complete activity.");
    }
  }

  const summary = data.summary || {};
  const contacts = arr(data.contacts);
  const activities = arr(data.activities);
  const tasks = arr(data.tasks);
  const signals = arr(data.signals);
  const rapidResponses = arr(data.rapid_responses);
  const recommendations = arr(data.ai_recommendations);

  const highSignals = signals.filter((signal) =>
    ["Critical", "High", "critical", "high"].includes(String(signal.risk || signal.severity || ""))
  );

  return (
    <PageShell
      eyebrow="Campaign Workspace CRM"
      title="Campaign Workspace CRM"
      description="Relationship and activity command layer for campaign workspaces, contacts, tasks, political signals, rapid responses, and AI recommendations."
      tickerItems={[
        { label: "Workspace", value: selectedWorkspace ? workspaceTitle(selectedWorkspace) : workspaceId ? `Workspace ${workspaceId}` : "Firmwide", dotClass: "vs-live-dot-success" },
        { label: "Contacts", value: `${summary.contacts || 0}`, dotClass: "vs-live-dot-success" },
        { label: "Open Tasks", value: `${summary.open_tasks || 0}`, dotClass: summary.open_tasks ? "vs-live-dot-warning" : "vs-live-dot-success" },
        { label: "Signals", value: `${summary.signals || signals.length || 0}`, dotClass: "vs-live-dot-success" },
        { label: "Updated", value: refreshing ? "Live" : lastUpdated || "Ready", dotClass: refreshing ? "vs-live-dot-warning" : "vs-live-dot-success" },
      ]}
    >
      <style>{`
        .crm-grid { display:grid; grid-template-columns:minmax(0,1.25fr) minmax(360px,.75fr); gap:18px; align-items:start; }
        .crm-stack { display:grid; gap:14px; }
        .crm-form { display:grid; gap:10px; }

        .crm-form input,
        .crm-form select,
        .crm-form textarea,
        .crm-workspace-select {
          width:100%;
          border-radius:14px;
          border:1px solid rgba(148,163,184,.18);
          background:rgba(15,23,42,.74);
          color:white;
          padding:11px 12px;
          outline:none;
        }

        .crm-form textarea { min-height:86px; resize:vertical; }

        .crm-row {
          border-radius:20px;
          border:1px solid rgba(148,163,184,.16);
          background:radial-gradient(circle at top right, rgba(59,130,246,.1), transparent 34%),
            linear-gradient(135deg, rgba(15,23,42,.78), rgba(2,6,23,.54));
          overflow:hidden;
        }

        .crm-row .vs-responsive-row { border:0; background:transparent; }

        .crm-workspace-box {
          display:grid;
          grid-template-columns:minmax(0,1fr) minmax(260px,360px);
          gap:14px;
          align-items:center;
        }

        .crm-workspace-box span {
          display:block;
          color:rgba(203,213,225,.64);
          font-size:11px;
          font-weight:900;
          text-transform:uppercase;
          letter-spacing:.08em;
        }

        .crm-workspace-box strong {
          display:block;
          margin-top:5px;
          color:white;
          font-size:20px;
          font-weight:950;
        }

        .crm-workspace-box small {
          display:block;
          margin-top:5px;
          color:rgba(203,213,225,.66);
        }

        .crm-recommendation {
          border-radius:18px;
          border:1px solid rgba(96,165,250,.24);
          background:rgba(37,99,235,.14);
          padding:14px;
          color:rgba(226,232,240,.92);
          font-size:13px;
          line-height:1.55;
        }

        .crm-actions { display:flex; justify-content:flex-end; gap:8px; flex-wrap:wrap; }

        .crm-message {
          border-radius:16px;
          border:1px solid rgba(96,165,250,.24);
          background:rgba(37,99,235,.14);
          color:rgba(226,232,240,.92);
          padding:12px;
        }

        @media (max-width:1100px) {
          .crm-grid,
          .crm-workspace-box { grid-template-columns:1fr; }
        }
      `}</style>

      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}
      {message ? <div className="crm-message">{message}</div> : null}

      <SectionCard
        title="CRM Workspace Scope"
        subtitle="Choose which campaign workspace this CRM should display."
        right={<Badge tone="accent">{workspaceLoading ? "Loading" : `${workspaces.length} workspaces`}</Badge>}
      >
        <div className="crm-workspace-box">
          <div>
            <span>Selected Workspace</span>
            <strong>{selectedWorkspace ? workspaceTitle(selectedWorkspace) : workspaceId ? `Workspace ${workspaceId}` : "Firmwide CRM"}</strong>
            <small>
              {selectedWorkspace?.state || "National"} • {selectedWorkspace?.office || "Campaign"} • {selectedWorkspace?.cycle || "2026"}
            </small>
          </div>

          <select className="crm-workspace-select" value={workspaceId || ""} onChange={(e) => changeWorkspace(e.target.value)}>
            <option value="">Firmwide CRM</option>
            {workspaces.map((workspace) => (
              <option key={workspace.id} value={workspace.id}>
                {workspaceTitle(workspace)}
              </option>
            ))}
          </select>
        </div>
      </SectionCard>

      <div className="vs-grid-4">
        <StatCard label="Contacts" value={fmt(summary.contacts)} delta="Workspace relationships" tone="up" />
        <StatCard label="Activities" value={fmt(summary.activities)} delta="Notes and touches" tone="up" />
        <StatCard label="Open Tasks" value={fmt(summary.open_tasks)} delta="Execution items" tone={summary.open_tasks ? "neutral" : "up"} />
        <StatCard label="Signals" value={fmt(summary.signals || signals.length)} delta="Political intelligence" tone="up" />
      </div>

      {loading ? (
        <EmptyState text="Loading Campaign Workspace CRM..." />
      ) : (
        <div className="crm-grid">
          <div className="crm-stack">
            <SectionCard title="Workspace Contacts" subtitle="Candidates, consultants, vendors, donors, press, and key stakeholders." right={<Badge tone="accent">{contacts.length} contacts</Badge>}>
              {!contacts.length ? (
                <EmptyState text="No CRM contacts yet." />
              ) : (
                <div className="crm-stack">
                  {contacts.map((contact) => (
                    <div key={contact.id} className="crm-row">
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
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard title="Activity Timeline" subtitle="Notes, meetings, calls, follow-ups, outcomes, and institutional memory." right={<Badge tone="accent">{activities.length} activities</Badge>}>
              {!activities.length ? (
                <EmptyState text="No CRM activity yet." />
              ) : (
                <div className="crm-stack">
                  {activities.map((activity) => (
                    <div key={activity.id} className="crm-row">
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
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard title="Signals + Rapid Responses" subtitle="Live political signals and narrative response work linked to this CRM context." right={<Badge tone={highSignals.length ? "danger" : "active"}>{signals.length} signals</Badge>}>
              <div className="crm-stack">
                {signals.slice(0, 10).map((signal) => (
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

                {rapidResponses.slice(0, 4).map((response) => (
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
            </SectionCard>

            <SectionCard title="Workspace Tasks" subtitle="Execution items attached to this campaign CRM context." right={<Badge tone="accent">{tasks.length} tasks</Badge>}>
              {!tasks.length ? (
                <EmptyState text="No workspace tasks yet." />
              ) : (
                <div className="crm-stack">
                  {tasks.slice(0, 10).map((task) => (
                    <div key={task.id} className="crm-row">
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
                  ))}
                </div>
              )}
            </SectionCard>
          </div>

          <div className="crm-stack">
            <SectionCard title="Add Contact" subtitle="Create CRM relationship records.">
              <ContactForm workspaceId={workspaceId} onCreated={() => load({ quiet: true })} onError={setError} />
            </SectionCard>

            <SectionCard title="Log Activity" subtitle="Add notes, calls, meetings, and follow-ups.">
              <ActivityForm workspaceId={workspaceId} contacts={contacts} onCreated={() => load({ quiet: true })} onError={setError} />
            </SectionCard>

            <SectionCard title="AI CRM Recommendations" subtitle="Operational next steps from workspace intelligence.">
              <div className="crm-stack">
                {recommendations.map((item, index) => (
                  <div key={`${item}-${index}`} className="crm-recommendation">
                    {item}
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        </div>
      )}
    </PageShell>
  );
}
