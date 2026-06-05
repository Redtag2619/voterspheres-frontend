import { useCallback, useEffect, useMemo, useState } from "react";
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

function currency(value) {
  return `$${Number(value || 0).toLocaleString(undefined, {
    maximumFractionDigits: 0,
  })}`;
}

function tone(value) {
  const v = String(value || "").toLowerCase();
  if (["at risk", "at_risk", "overdue", "revoked"].includes(v)) return "danger";
  if (["stable", "draft", "sent", "open"].includes(v)) return "demo";
  if (["strong", "active", "paid"].includes(v)) return "active";
  return "accent";
}

function ClientForm({ onCreate, saving }) {
  const [form, setForm] = useState({
    client_name: "",
    organization: "",
    primary_contact: "",
    email: "",
    phone: "",
    state: "",
    monthly_retainer: "",
    notes: "",
  });

  function submit(event) {
    event.preventDefault();
    onCreate?.({
      ...form,
      monthly_retainer: Number(form.monthly_retainer || 0),
    });
    setForm({
      client_name: "",
      organization: "",
      primary_contact: "",
      email: "",
      phone: "",
      state: "",
      monthly_retainer: "",
      notes: "",
    });
  }

  return (
    <form className="business-form" onSubmit={submit}>
      <input required placeholder="Client name" value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} />
      <input placeholder="Organization" value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} />
      <input placeholder="Primary contact" value={form.primary_contact} onChange={(e) => setForm({ ...form, primary_contact: e.target.value })} />
      <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
      <input placeholder="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value.toUpperCase() })} />
      <input placeholder="Monthly retainer" value={form.monthly_retainer} onChange={(e) => setForm({ ...form, monthly_retainer: e.target.value })} />
      <textarea placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      <button className="vs-button" disabled={saving}>{saving ? "Saving..." : "Add Client"}</button>
    </form>
  );
}

function InvoiceForm({ clients, onCreate, saving }) {
  const [form, setForm] = useState({
    client_id: "",
    title: "",
    amount: "",
    status: "draft",
    due_date: "",
  });

  function submit(event) {
    event.preventDefault();
    onCreate?.({
      ...form,
      client_id: form.client_id || null,
      amount: Number(form.amount || 0),
    });
    setForm({ client_id: "", title: "", amount: "", status: "draft", due_date: "" });
  }

  return (
    <form className="business-form" onSubmit={submit}>
      <select value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })}>
        <option value="">No client selected</option>
        {clients.map((client) => <option key={client.id} value={client.id}>{client.client_name}</option>)}
      </select>
      <input required placeholder="Invoice title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      <input placeholder="Amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
      <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
        <option value="draft">Draft</option>
        <option value="sent">Sent</option>
        <option value="open">Open</option>
        <option value="paid">Paid</option>
        <option value="overdue">Overdue</option>
      </select>
      <input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
      <button className="vs-button" disabled={saving}>{saving ? "Saving..." : "Add Invoice"}</button>
    </form>
  );
}

function ProjectForm({ clients, onCreate, saving }) {
  const [form, setForm] = useState({
    client_id: "",
    project_name: "",
    project_type: "campaign",
    owner: "",
    projected_revenue: "",
    actual_cost: "",
  });

  function submit(event) {
    event.preventDefault();
    onCreate?.({
      ...form,
      client_id: form.client_id || null,
      projected_revenue: Number(form.projected_revenue || 0),
      actual_cost: Number(form.actual_cost || 0),
    });
    setForm({
      client_id: "",
      project_name: "",
      project_type: "campaign",
      owner: "",
      projected_revenue: "",
      actual_cost: "",
    });
  }

  return (
    <form className="business-form" onSubmit={submit}>
      <select value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })}>
        <option value="">No client selected</option>
        {clients.map((client) => <option key={client.id} value={client.id}>{client.client_name}</option>)}
      </select>
      <input required placeholder="Project name" value={form.project_name} onChange={(e) => setForm({ ...form, project_name: e.target.value })} />
      <select value={form.project_type} onChange={(e) => setForm({ ...form, project_type: e.target.value })}>
        <option value="campaign">Campaign</option>
        <option value="mail">Direct Mail</option>
        <option value="digital">Digital</option>
        <option value="fundraising">Fundraising</option>
        <option value="strategy">Strategy</option>
      </select>
      <input placeholder="Owner" value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} />
      <input placeholder="Projected revenue" value={form.projected_revenue} onChange={(e) => setForm({ ...form, projected_revenue: e.target.value })} />
      <input placeholder="Actual cost" value={form.actual_cost} onChange={(e) => setForm({ ...form, actual_cost: e.target.value })} />
      <button className="vs-button" disabled={saving}>{saving ? "Saving..." : "Add Project"}</button>
    </form>
  );
}

function TimeForm({ clients, projects, onCreate, saving }) {
  const [form, setForm] = useState({
    client_id: "",
    project_id: "",
    staff_name: "",
    role: "",
    hours: "",
    hourly_rate: "",
    billable: true,
    entry_date: new Date().toISOString().slice(0, 10),
    notes: "",
  });

  function submit(event) {
    event.preventDefault();
    onCreate?.({
      ...form,
      client_id: form.client_id || null,
      project_id: form.project_id || null,
      hours: Number(form.hours || 0),
      hourly_rate: Number(form.hourly_rate || 0),
    });
    setForm({
      client_id: "",
      project_id: "",
      staff_name: "",
      role: "",
      hours: "",
      hourly_rate: "",
      billable: true,
      entry_date: new Date().toISOString().slice(0, 10),
      notes: "",
    });
  }

  return (
    <form className="business-form" onSubmit={submit}>
      <select value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })}>
        <option value="">No client selected</option>
        {clients.map((client) => <option key={client.id} value={client.id}>{client.client_name}</option>)}
      </select>
      <select value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value })}>
        <option value="">No project selected</option>
        {projects.map((project) => <option key={project.id} value={project.id}>{project.project_name}</option>)}
      </select>
      <input required placeholder="Staff name" value={form.staff_name} onChange={(e) => setForm({ ...form, staff_name: e.target.value })} />
      <input placeholder="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
      <input placeholder="Hours" value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} />
      <input placeholder="Hourly rate" value={form.hourly_rate} onChange={(e) => setForm({ ...form, hourly_rate: e.target.value })} />
      <input type="date" value={form.entry_date} onChange={(e) => setForm({ ...form, entry_date: e.target.value })} />
      <label className="business-checkbox">
        <input type="checkbox" checked={form.billable} onChange={(e) => setForm({ ...form, billable: e.target.checked })} />
        Billable
      </label>
      <textarea placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      <button className="vs-button" disabled={saving}>{saving ? "Saving..." : "Add Time"}</button>
    </form>
  );
}

export default function ConsultantBusinessSuite() {
  const [data, setData] = useState({
    summary: {},
    clients: [],
    projects: [],
    invoices: [],
    time_entries: [],
    client_health: [],
    staff_utilization: [],
    client_portals: [],
    reports: [],
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const result = await api.consultantBusinessSuite();

      setData({
        summary: result?.summary || {},
        clients: arr(result?.clients),
        projects: arr(result?.projects),
        invoices: arr(result?.invoices),
        time_entries: arr(result?.time_entries),
        client_health: arr(result?.client_health),
        staff_utilization: arr(result?.staff_utilization),
        client_portals: arr(result?.client_portals),
        reports: arr(result?.reports),
      });

      setLastUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    } catch (err) {
      setError(err?.response?.data?.error || err?.response?.data?.detail || err?.message || "Failed to load Consultant Business Suite.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function submit(kind, fn, payload) {
    try {
      setSaving(kind);
      setError("");
      setMessage("");

      await fn(payload);
      setMessage(`${kind} created.`);
      await load();
    } catch (err) {
      setError(err?.response?.data?.error || err?.response?.data?.detail || err?.message || `Failed to create ${kind}.`);
    } finally {
      setSaving("");
    }
  }

  const summary = data.summary || {};
  const clients = arr(data.clients);
  const projects = arr(data.projects);
  const invoices = arr(data.invoices);
  const timeEntries = arr(data.time_entries);
  const clientHealth = arr(data.client_health);
  const staffUtilization = arr(data.staff_utilization);

  const revenueRisk = useMemo(() => {
    if (Number(summary.overdue_invoices || 0) > 0) return "overdue";
    if (Number(summary.open_receivables || 0) > 0) return "open";
    return "strong";
  }, [summary]);

  return (
    <PageShell
      eyebrow="Consultant Business Suite"
      title="Consultant Business Suite"
      description="Run the consulting firm behind the campaigns: clients, retainers, invoices, projects, time, utilization, profitability, and client health."
      tickerItems={[
        { label: "Active Clients", value: `${summary.active_clients || 0}`, dotClass: "vs-live-dot-success" },
        { label: "Retainers", value: currency(summary.monthly_retainer_revenue), dotClass: "vs-live-dot-success" },
        { label: "Receivables", value: currency(summary.open_receivables), dotClass: summary.open_receivables ? "vs-live-dot-warning" : "vs-live-dot-success" },
        { label: "Updated", value: lastUpdated || "Ready", dotClass: "vs-live-dot-success" },
      ]}
    >
      <style>{`
        .business-grid {
          display: grid;
          grid-template-columns: minmax(0, 0.72fr) minmax(0, 1.28fr);
          gap: 18px;
          align-items: start;
        }

        .business-stack {
          display: grid;
          gap: 14px;
        }

        .business-form {
          display: grid;
          gap: 10px;
        }

        .business-form input,
        .business-form select,
        .business-form textarea {
          width: 100%;
          border-radius: 14px;
          border: 1px solid rgba(148, 163, 184, 0.18);
          background: rgba(15, 23, 42, 0.74);
          color: white;
          padding: 11px 12px;
          outline: none;
        }

        .business-form textarea {
          min-height: 72px;
          resize: vertical;
        }

        .business-checkbox {
          display: flex;
          gap: 8px;
          align-items: center;
          color: rgba(226, 232, 240, 0.88);
          font-size: 12px;
        }

        .business-row {
          border-radius: 20px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          background:
            radial-gradient(circle at top right, rgba(59, 130, 246, 0.1), transparent 34%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.78), rgba(2, 6, 23, 0.54));
          overflow: hidden;
        }

        .business-row .vs-responsive-row {
          border: 0;
          background: transparent;
        }

        .business-message {
          border-radius: 16px;
          border: 1px solid rgba(96, 165, 250, 0.24);
          background: rgba(37, 99, 235, 0.14);
          color: rgba(226, 232, 240, 0.92);
          padding: 12px;
        }

        .business-tabs {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        @media (max-width: 1100px) {
          .business-grid,
          .business-tabs {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}
      {message ? <div className="business-message">{message}</div> : null}

      <div className="vs-grid-4">
        <StatCard label="Monthly Retainers" value={currency(summary.monthly_retainer_revenue)} delta="Recurring revenue" tone="up" />
        <StatCard label="Open Receivables" value={currency(summary.open_receivables)} delta={`${summary.overdue_invoices || 0} overdue`} tone={summary.open_receivables ? "neutral" : "up"} />
        <StatCard label="Profitability" value={currency(summary.profitability)} delta="Revenue minus costs" tone={summary.profitability >= 0 ? "up" : "down"} />
        <StatCard label="Billable Hours" value={fmt(summary.billable_hours)} delta={currency(summary.time_revenue)} tone="up" />
      </div>

      {loading ? (
        <EmptyState text="Loading Consultant Business Suite..." />
      ) : (
        <div className="business-grid">
          <div className="business-stack">
            <SectionCard title="Add Client" subtitle="Create a consulting client or campaign account.">
              <ClientForm onCreate={(payload) => submit("Client", api.createConsultantClient, payload)} saving={saving === "Client"} />
            </SectionCard>

            <SectionCard title="Add Invoice" subtitle="Track receivables and client billing.">
              <InvoiceForm clients={clients} onCreate={(payload) => submit("Invoice", api.createConsultantInvoice, payload)} saving={saving === "Invoice"} />
            </SectionCard>

            <SectionCard title="Add Project" subtitle="Track workstreams and profitability.">
              <ProjectForm clients={clients} onCreate={(payload) => submit("Project", api.createConsultantProject, payload)} saving={saving === "Project"} />
            </SectionCard>

            <SectionCard title="Add Time Entry" subtitle="Track staff utilization and billable hours.">
              <TimeForm clients={clients} projects={projects} onCreate={(payload) => submit("Time", api.createConsultantTimeEntry, payload)} saving={saving === "Time"} />
            </SectionCard>
          </div>

          <div className="business-stack">
            <SectionCard title="Business Health" subtitle="Firm-level operating summary." right={<Badge tone={tone(revenueRisk)}>{revenueRisk}</Badge>}>
              <div className="vs-grid-4">
                <StatCard label="Clients" value={fmt(summary.active_clients)} delta="Active" tone="up" />
                <StatCard label="Projects" value={fmt(summary.active_projects)} delta="Active work" tone="up" />
                <StatCard label="Reports" value={fmt(summary.reports_generated)} delta="Client deliverables" tone="up" />
                <StatCard label="Portals" value={fmt(summary.client_portals)} delta="Client access" tone="up" />
              </div>
            </SectionCard>

            <div className="business-tabs">
              <SectionCard title="Client Health" subtitle="Client risk, retainers, unpaid balances." right={<Badge tone="accent">{clientHealth.length}</Badge>}>
                <div className="business-stack">
                  {!clientHealth.length ? (
                    <EmptyState text="No client health records yet." />
                  ) : (
                    clientHealth.slice(0, 8).map((client) => (
                      <div key={client.id} className="business-row">
                        <ResponsiveRow
                          title={client.client_name}
                          subtitle={`${client.organization || "Client"} • ${client.state || "National"}`}
                          meta={[
                            { label: "Health", value: client.health_status },
                            { label: "Score", value: `${client.health_score}%` },
                            { label: "Retainer", value: currency(client.monthly_retainer) },
                            { label: "Unpaid", value: currency(client.unpaid_balance) },
                          ]}
                          right={<Badge tone={tone(client.health_status)}>{client.health_status}</Badge>}
                        />
                      </div>
                    ))
                  )}
                </div>
              </SectionCard>

              <SectionCard title="Staff Utilization" subtitle="Billable hours and revenue." right={<Badge tone="accent">{staffUtilization.length}</Badge>}>
                <div className="business-stack">
                  {!staffUtilization.length ? (
                    <EmptyState text="No staff utilization records yet." />
                  ) : (
                    staffUtilization.slice(0, 8).map((staff) => (
                      <div key={staff.staff_name} className="business-row">
                        <ResponsiveRow
                          title={staff.staff_name}
                          subtitle={staff.role || "Staff"}
                          meta={[
                            { label: "Utilization", value: `${staff.utilization_rate}%` },
                            { label: "Billable", value: staff.billable_hours },
                            { label: "Non-Billable", value: staff.non_billable_hours },
                            { label: "Revenue", value: currency(staff.revenue) },
                          ]}
                          right={<Badge tone={staff.utilization_rate >= 70 ? "active" : "demo"}>{staff.utilization_rate}%</Badge>}
                        />
                      </div>
                    ))
                  )}
                </div>
              </SectionCard>
            </div>

            <SectionCard title="Invoices" subtitle="Revenue, receivables, and invoice status." right={<Badge tone="accent">{invoices.length}</Badge>}>
              <div className="business-stack">
                {!invoices.length ? (
                  <EmptyState text="No invoices yet." />
                ) : (
                  invoices.slice(0, 10).map((invoice) => (
                    <div key={invoice.id} className="business-row">
                      <ResponsiveRow
                        title={invoice.title}
                        subtitle={invoice.client_name || "No client"}
                        meta={[
                          { label: "Amount", value: currency(invoice.amount) },
                          { label: "Status", value: invoice.status },
                          { label: "Due", value: invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : "—" },
                          { label: "Created", value: invoice.created_at ? new Date(invoice.created_at).toLocaleDateString() : "—" },
                        ]}
                        right={<Badge tone={tone(invoice.status)}>{invoice.status}</Badge>}
                      />
                    </div>
                  ))
                )}
              </div>
            </SectionCard>

            <SectionCard title="Projects" subtitle="Project revenue, cost, and owners." right={<Badge tone="accent">{projects.length}</Badge>}>
              <div className="business-stack">
                {!projects.length ? (
                  <EmptyState text="No projects yet." />
                ) : (
                  projects.slice(0, 10).map((project) => (
                    <div key={project.id} className="business-row">
                      <ResponsiveRow
                        title={project.project_name}
                        subtitle={`${project.client_name || "No client"} • ${project.project_type || "project"}`}
                        meta={[
                          { label: "Status", value: project.status },
                          { label: "Owner", value: project.owner || "Unassigned" },
                          { label: "Revenue", value: currency(project.projected_revenue) },
                          { label: "Cost", value: currency(project.actual_cost) },
                        ]}
                        right={<Badge tone={tone(project.status)}>{project.status}</Badge>}
                      />
                    </div>
                  ))
                )}
              </div>
            </SectionCard>

            <SectionCard title="Recent Time Entries" subtitle="Staff time and billable activity." right={<Badge tone="accent">{timeEntries.length}</Badge>}>
              <div className="business-stack">
                {!timeEntries.length ? (
                  <EmptyState text="No time entries yet." />
                ) : (
                  timeEntries.slice(0, 10).map((entry) => (
                    <div key={entry.id} className="business-row">
                      <ResponsiveRow
                        title={entry.staff_name}
                        subtitle={`${entry.client_name || "No client"} • ${entry.project_name || "No project"}`}
                        meta={[
                          { label: "Hours", value: entry.hours },
                          { label: "Rate", value: currency(entry.hourly_rate) },
                          { label: "Billable", value: entry.billable ? "Yes" : "No" },
                          { label: "Date", value: entry.entry_date ? new Date(entry.entry_date).toLocaleDateString() : "—" },
                        ]}
                        right={<Badge tone={entry.billable ? "active" : "demo"}>{entry.billable ? "Billable" : "Internal"}</Badge>}
                      />
                    </div>
                  ))
                )}
              </div>
            </SectionCard>
          </div>
        </div>
      )}
    </PageShell>
  );
}
