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
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function ContactForm({ workspaceId, onCreated }) {
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

function ActivityForm({ workspaceId, contacts, onCreated }) {
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
  const [params] = useSearchParams();
  const workspaceId = params.get("workspace_id") || params.get("workspaceId") || "";

  const [data, setData] = useState({ summary: {}, contacts: [], activities: [], tasks: [], signals: [], rapid_responses: [], ai_recommendations: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");

  const load = useCallback(async ({ quiet = false } = {}) => {
    try {
      if (quiet) setRefreshing(true);
      else setLoading(true);

      setError("");

      const result = await api.campaignCrmDashboard(workspaceId || null);
      setData(result || {});
      setLastUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Failed to load Campaign Workspace CRM.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    load();
    const interval = setInterval(() => load({ quiet: true }), 30000);
    return () => clearInterval(interval);
  }, [load]);

  async function completeActivity(id) {
    await api.completeCampaignCrmActivity(id);
    await load({ quiet: true });
  }

  const summary = data?.summary || {};
  const contacts = data?.contacts || [];
  const activities = data?.activities || [];
  const tasks = data?.tasks || [];
  const signals = data?.signals || [];
  const rapidResponses = data?.rapid_responses || [];
  const recommendations = data?.ai_recommendations || [];

  const highSignals = useMemo(() => {
    return signals.filter((signal) => ["Critical", "High", "critical", "high"].includes(String(signal.risk || signal.severity || "")));
  }, [signals]);

  return (
    <PageShell
      eyebrow="Campaign Workspace CRM"
      title="Campaign Workspace CRM"
      description="A relationship and activity command layer for campaign workspaces, contacts, tasks, political signals, rapid responses, and AI recommendations."
      tickerItems={[
        { label: "Contacts", value: `${summary.contacts || 0}`, dotClass: "vs-live-dot-success" },
        { label: "Open Tasks", value: `${summary.open_tasks || 0}`, dotClass: summary.open_tasks ? "vs-live-dot-warning" : "vs-live-dot-success" },
        { label: "High Signals", value: `${summary.high_signals || 0}`, dotClass: summary.high_signals ? "vs-live-dot-warning" : "vs-live-dot-success" },
        { label: "Updated", value: refreshing ? "Live" : lastUpdated || "Ready", dotClass: refreshing ? "vs-live-dot-warning" : "vs-live-dot-success" },
      ]}
    >
      <style>{`
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
        .crm-form textarea {
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

        @media (max-width: 1100px) {
          .crm-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}

      <div className="vs-grid-4">
        <StatCard label="Contacts" value={fmt(summary.contacts)} delta="Workspace relationships" tone="up" />
        <StatCard label="Activities" value={fmt(summary.activities)} delta="Notes and touches" tone="up" />
        <StatCard label="Open Tasks" value={fmt(summary.open_tasks)} delta="Execution items" tone={summary.open_tasks ? "neutral" : "up"} />
        <StatCard label="High Signals" value={fmt(summary.high_signals)} delta="Political risk" tone={summary.high_signals ? "down" : "up"} />
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
                {signals.slice(0, 8).map((signal) => (
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
              <ContactForm workspaceId={workspaceId} onCreated={() => load({ quiet: true })} />
            </SectionCard>

            <SectionCard title="Log Activity" subtitle="Add notes, calls, meetings, and follow-ups.">
              <ActivityForm workspaceId={workspaceId} contacts={contacts} onCreated={() => load({ quiet: true })} />
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
