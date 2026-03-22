import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:10000";

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(data?.error || `Request failed: ${response.status}`);
  }

  return data;
}

function toneClasses(tone) {
  if (tone === "down") {
    return "bg-rose-50 text-rose-700 border-rose-200";
  }
  return "bg-emerald-50 text-emerald-700 border-emerald-200";
}

function severityClasses(severity) {
  if (severity === "high") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }
  if (severity === "medium") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function Card({ title, subtitle, children, right }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
        </div>
        {right ? <div>{right}</div> : null}
      </div>
      {children}
    </section>
  );
}

function StatCard({ label, value, delta, tone }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-xs uppercase tracking-[0.16em] text-slate-500">{label}</div>
      <div className="mt-3 text-3xl font-semibold text-slate-900">{value}</div>
      <div className="mt-3">
        <span
          className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${toneClasses(
            tone
          )}`}
        >
          {delta}
        </span>
      </div>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
      {text}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block space-y-2">
      <span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none";
const textareaClass =
  "w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none min-h-[100px]";

export default function CampaignWorkspace() {
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState("");

  const [data, setData] = useState({
    campaign: null,
    metrics: [],
    alerts: [],
    contacts: [],
    vendors: [],
    tasks: [],
    documents: [],
    fundraising: null,
    forecast: { snapshot: null, races: [] },
    mail: {
      programs: [],
      drops: [],
      recent_events: [],
      delayed_events: [],
      delivered_events: []
    }
  });

  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    status: "todo"
  });

  const [contactForm, setContactForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    role: ""
  });

  const [vendorForm, setVendorForm] = useState({
    vendor_name: "",
    category: "",
    status: "active",
    contract_value: ""
  });

  const [documentForm, setDocumentForm] = useState({
    title: "",
    document_type: "",
    file_url: ""
  });

  const [mailProgramForm, setMailProgramForm] = useState({
    name: "",
    description: ""
  });

  const [mailDropForm, setMailDropForm] = useState({
    program_id: "",
    drop_date: "",
    quantity: ""
  });

  const [mailEventForm, setMailEventForm] = useState({
    mail_drop_id: "",
    event_type: "entered_usps",
    status: "",
    location_name: "",
    facility_type: "",
    notes: "",
    source: "manual"
  });

  async function loadWorkspace() {
    try {
      setLoading(true);
      setError("");
      const result = await apiRequest(`/api/campaigns/${id}/command-center`);
      setData(result || {});
    } catch (err) {
      setError(err.message || "Failed to load campaign workspace");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWorkspace();
  }, [id]);

  async function submitForm(formName, path, body, resetFn) {
    try {
      setSubmitting(formName);
      setError("");

      await apiRequest(path, {
        method: "POST",
        body: JSON.stringify(body)
      });

      resetFn();
      await loadWorkspace();
    } catch (err) {
      setError(err.message || "Failed to save");
    } finally {
      setSubmitting("");
    }
  }

  const campaignTitle = useMemo(() => {
    if (!data?.campaign) return "Campaign Workspace";
    return data.campaign.campaign_name || data.campaign.candidate_name || "Campaign Workspace";
  }, [data]);

  return (
    <div className="min-h-screen bg-[#f3f6f9] p-6 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[28px] border border-[#d8dde6] bg-gradient-to-r from-[#0176D3] to-[#0b5cab] p-8 text-white shadow-sm">
          <div className="text-xs uppercase tracking-[0.22em] text-blue-100">
            Campaign Command Center
          </div>
          <h1 className="mt-2 text-3xl font-semibold">{campaignTitle}</h1>
          <p className="mt-3 max-w-3xl text-sm text-blue-50">
            Live operational cockpit for campaign execution, alerts, vendors, fundraising, forecast context, and mail intelligence.
          </p>

          {data?.campaign ? (
            <div className="mt-6 grid gap-4 md:grid-cols-4">
              <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
                <div className="text-xs uppercase tracking-[0.16em] text-blue-100">Stage</div>
                <div className="mt-2 text-lg font-semibold">{data.campaign.stage || "Open"}</div>
              </div>
              <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
                <div className="text-xs uppercase tracking-[0.16em] text-blue-100">Status</div>
                <div className="mt-2 text-lg font-semibold">{data.campaign.status || "Open"}</div>
              </div>
              <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
                <div className="text-xs uppercase tracking-[0.16em] text-blue-100">Firm</div>
                <div className="mt-2 text-lg font-semibold">{data.campaign.firm_name || "Unassigned"}</div>
              </div>
              <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
                <div className="text-xs uppercase tracking-[0.16em] text-blue-100">Owner</div>
                <div className="mt-2 text-lg font-semibold">{data.campaign.owner_name || "Unassigned"}</div>
              </div>
            </div>
          ) : null}
        </section>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(data.metrics || []).map((metric, index) => (
            <StatCard
              key={`${metric.label}-${index}`}
              label={metric.label}
              value={metric.value}
              delta={metric.delta}
              tone={metric.tone}
            />
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <Card
            title="Alert Panel"
            subtitle="Live warnings and operational flags"
            right={
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">
                {data.alerts?.length || 0} alerts
              </span>
            }
          >
            <div className="space-y-3">
              {loading ? (
                <EmptyState text="Loading alerts..." />
              ) : data.alerts?.length ? (
                data.alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-slate-900">{alert.title}</div>
                        <div className="mt-1 text-sm text-slate-500">{alert.message}</div>
                      </div>
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-medium ${severityClasses(
                          alert.severity
                        )}`}
                      >
                        {alert.severity}
                      </span>
                    </div>
                    <div className="mt-3 text-xs text-slate-500">Type: {alert.type}</div>
                  </div>
                ))
              ) : (
                <EmptyState text="No active alerts." />
              )}
            </div>
          </Card>

          <Card title="Open Tasks" subtitle="Execution workflow">
            <div className="space-y-3">
              {loading ? (
                <EmptyState text="Loading tasks..." />
              ) : data.tasks?.length ? (
                data.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-slate-900">{task.title}</div>
                        <div className="mt-1 text-sm text-slate-500">
                          Status: {task.status || "todo"}
                        </div>
                      </div>
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-medium ${severityClasses(
                          String(task.priority || "").toLowerCase() === "high"
                            ? "high"
                            : String(task.priority || "").toLowerCase() === "medium"
                            ? "medium"
                            : "low"
                        )}`}
                      >
                        {task.priority || "medium"}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState text="No tasks found." />
              )}
            </div>
          </Card>

          <Card title="Fundraising Snapshot" subtitle="Matched candidate finance">
            {loading ? (
              <EmptyState text="Loading fundraising..." />
            ) : data.fundraising ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
                    Total Receipts
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-slate-900">
                    ${Number(data.fundraising.total_receipts || 0).toLocaleString()}
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
                    Cash on Hand
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-slate-900">
                    ${Number(data.fundraising.cash_on_hand || 0).toLocaleString()}
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState text="No fundraising match found." />
            )}
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card title="Vendors" subtitle="Campaign partner network">
            <div className="space-y-3">
              {loading ? (
                <EmptyState text="Loading vendors..." />
              ) : data.vendors?.length ? (
                data.vendors.map((vendor) => (
                  <div
                    key={vendor.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-slate-900">{vendor.vendor_name}</div>
                        <div className="mt-1 text-sm text-slate-500">
                          {vendor.category || "Vendor"}
                        </div>
                      </div>
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-medium ${severityClasses(
                          String(vendor.status || "").toLowerCase() === "at_risk"
                            ? "high"
                            : "low"
                        )}`}
                      >
                        {vendor.status || "active"}
                      </span>
                    </div>
                    <div className="mt-3 text-xs text-slate-500">
                      Contract: ${Number(vendor.contract_value || 0).toLocaleString()}
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState text="No vendors found." />
              )}
            </div>
          </Card>

          <Card title="Contacts + Documents" subtitle="People and campaign files">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <div className="text-sm font-semibold text-slate-900">Contacts</div>
                {loading ? (
                  <EmptyState text="Loading contacts..." />
                ) : data.contacts?.length ? (
                  data.contacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="font-semibold text-slate-900">{contact.full_name}</div>
                      <div className="mt-1 text-sm text-slate-500">{contact.role || "Contact"}</div>
                      <div className="mt-2 text-xs text-slate-500">{contact.email || "No email"}</div>
                    </div>
                  ))
                ) : (
                  <EmptyState text="No contacts found." />
                )}
              </div>

              <div className="space-y-3">
                <div className="text-sm font-semibold text-slate-900">Documents</div>
                {loading ? (
                  <EmptyState text="Loading documents..." />
                ) : data.documents?.length ? (
                  data.documents.map((document) => (
                    <div
                      key={document.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="font-semibold text-slate-900">{document.title}</div>
                      <div className="mt-1 text-sm text-slate-500">{document.document_type || "Document"}</div>
                    </div>
                  ))
                ) : (
                  <EmptyState text="No documents found." />
                )}
              </div>
            </div>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card title="MailOps Panel" subtitle="Programs, drops, and network events">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Programs</div>
                <div className="mt-2 text-2xl font-semibold text-slate-900">
                  {data.mail?.programs?.length || 0}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Drops</div>
                <div className="mt-2 text-2xl font-semibold text-slate-900">
                  {data.mail?.drops?.length || 0}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Delayed Events</div>
                <div className="mt-2 text-2xl font-semibold text-slate-900">
                  {data.mail?.delayed_events?.length || 0}
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {loading ? (
                <EmptyState text="Loading mail events..." />
              ) : data.mail?.recent_events?.length ? (
                data.mail.recent_events.map((event) => (
                  <div
                    key={event.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-slate-900">
                          {event.event_type || "event"}
                        </div>
                        <div className="mt-1 text-sm text-slate-500">
                          Drop #{event.mail_drop_id} • {event.location_name || event.facility_type || "Network"}
                        </div>
                      </div>
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-medium ${severityClasses(
                          String(event.status || "").toLowerCase() === "delayed" ||
                            String(event.event_type || "").toLowerCase() === "delayed"
                            ? "high"
                            : "low"
                        )}`}
                      >
                        {event.status || event.event_type || "event"}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState text="No mail events found." />
              )}
            </div>
          </Card>

          <Card title="Forecast Context" subtitle="Snapshot + state-level race context">
            <div className="space-y-4">
              {data.forecast?.snapshot ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
                    Latest Forecast Snapshot
                  </div>
                  <div className="mt-2 text-sm text-slate-700">
                    Published:{" "}
                    {data.forecast.snapshot.published_at
                      ? new Date(data.forecast.snapshot.published_at).toLocaleString()
                      : "Not published"}
                  </div>
                  <div className="mt-3 grid gap-2 text-xs text-slate-500 md:grid-cols-3">
                    <div>Races: {data.forecast.snapshot.race_count ?? 0}</div>
                    <div>Toss-ups: {data.forecast.snapshot.tossup_count ?? 0}</div>
                    <div>High Confidence: {data.forecast.snapshot.high_confidence_count ?? 0}</div>
                  </div>
                </div>
              ) : (
                <EmptyState text="No forecast snapshot available." />
              )}

              <div className="space-y-3">
                {loading ? (
                  <EmptyState text="Loading forecast races..." />
                ) : data.forecast?.races?.length ? (
                  data.forecast.races.map((race) => (
                    <div
                      key={race.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="font-semibold text-slate-900">
                        {race.state || "State"} • {race.office || "Race"}
                      </div>
                      <div className="mt-1 text-sm text-slate-500">
                        {race.rating || race.category || "Competitive"}
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyState text="No state forecast race context found." />
                )}
              </div>
            </div>
          </Card>
        </div>

        <Card title="Action Panels" subtitle="Write directly into the campaign operating system">
          <div className="grid gap-6 xl:grid-cols-2">
            <form
              className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-5"
              onSubmit={(e) => {
                e.preventDefault();
                submitForm(
                  "task",
                  `/api/campaigns/${id}/tasks`,
                  taskForm,
                  () =>
                    setTaskForm({
                      title: "",
                      description: "",
                      priority: "medium",
                      status: "todo"
                    })
                );
              }}
            >
              <div className="text-lg font-semibold text-slate-900">Create Task</div>
              <Field label="Title">
                <input
                  className={inputClass}
                  value={taskForm.title}
                  onChange={(e) => setTaskForm((s) => ({ ...s, title: e.target.value }))}
                />
              </Field>
              <Field label="Description">
                <textarea
                  className={textareaClass}
                  value={taskForm.description}
                  onChange={(e) => setTaskForm((s) => ({ ...s, description: e.target.value }))}
                />
              </Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Priority">
                  <select
                    className={inputClass}
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm((s) => ({ ...s, priority: e.target.value }))}
                  >
                    <option value="high">high</option>
                    <option value="medium">medium</option>
                    <option value="low">low</option>
                  </select>
                </Field>
                <Field label="Status">
                  <select
                    className={inputClass}
                    value={taskForm.status}
                    onChange={(e) => setTaskForm((s) => ({ ...s, status: e.target.value }))}
                  >
                    <option value="todo">todo</option>
                    <option value="in_progress">in_progress</option>
                    <option value="done">done</option>
                  </select>
                </Field>
              </div>
              <button
                type="submit"
                disabled={submitting === "task"}
                className="rounded-2xl bg-[#0176D3] px-4 py-3 text-sm font-semibold text-white"
              >
                {submitting === "task" ? "Saving..." : "Create Task"}
              </button>
            </form>

            <form
              className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-5"
              onSubmit={(e) => {
                e.preventDefault();
                submitForm(
                  "contact",
                  `/api/campaigns/${id}/contacts`,
                  contactForm,
                  () =>
                    setContactForm({
                      full_name: "",
                      email: "",
                      phone: "",
                      role: ""
                    })
                );
              }}
            >
              <div className="text-lg font-semibold text-slate-900">Add Contact</div>
              <Field label="Full Name">
                <input
                  className={inputClass}
                  value={contactForm.full_name}
                  onChange={(e) => setContactForm((s) => ({ ...s, full_name: e.target.value }))}
                />
              </Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Email">
                  <input
                    className={inputClass}
                    value={contactForm.email}
                    onChange={(e) => setContactForm((s) => ({ ...s, email: e.target.value }))}
                  />
                </Field>
                <Field label="Phone">
                  <input
                    className={inputClass}
                    value={contactForm.phone}
                    onChange={(e) => setContactForm((s) => ({ ...s, phone: e.target.value }))}
                  />
                </Field>
              </div>
              <Field label="Role">
                <input
                  className={inputClass}
                  value={contactForm.role}
                  onChange={(e) => setContactForm((s) => ({ ...s, role: e.target.value }))}
                />
              </Field>
              <button
                type="submit"
                disabled={submitting === "contact"}
                className="rounded-2xl bg-[#0176D3] px-4 py-3 text-sm font-semibold text-white"
              >
                {submitting === "contact" ? "Saving..." : "Add Contact"}
              </button>
            </form>

            <form
              className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-5"
              onSubmit={(e) => {
                e.preventDefault();
                submitForm(
                  "vendor",
                  `/api/campaigns/${id}/vendors`,
                  {
                    ...vendorForm,
                    contract_value: Number(vendorForm.contract_value || 0)
                  },
                  () =>
                    setVendorForm({
                      vendor_name: "",
                      category: "",
                      status: "active",
                      contract_value: ""
                    })
                );
              }}
            >
              <div className="text-lg font-semibold text-slate-900">Add Vendor</div>
              <Field label="Vendor Name">
                <input
                  className={inputClass}
                  value={vendorForm.vendor_name}
                  onChange={(e) => setVendorForm((s) => ({ ...s, vendor_name: e.target.value }))}
                />
              </Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Category">
                  <input
                    className={inputClass}
                    value={vendorForm.category}
                    onChange={(e) => setVendorForm((s) => ({ ...s, category: e.target.value }))}
                  />
                </Field>
                <Field label="Status">
                  <select
                    className={inputClass}
                    value={vendorForm.status}
                    onChange={(e) => setVendorForm((s) => ({ ...s, status: e.target.value }))}
                  >
                    <option value="active">active</option>
                    <option value="at_risk">at_risk</option>
                    <option value="paused">paused</option>
                  </select>
                </Field>
              </div>
              <Field label="Contract Value">
                <input
                  className={inputClass}
                  type="number"
                  value={vendorForm.contract_value}
                  onChange={(e) => setVendorForm((s) => ({ ...s, contract_value: e.target.value }))}
                />
              </Field>
              <button
                type="submit"
                disabled={submitting === "vendor"}
                className="rounded-2xl bg-[#0176D3] px-4 py-3 text-sm font-semibold text-white"
              >
                {submitting === "vendor" ? "Saving..." : "Add Vendor"}
              </button>
            </form>

            <form
              className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-5"
              onSubmit={(e) => {
                e.preventDefault();
                submitForm(
                  "document",
                  `/api/campaigns/${id}/documents`,
                  documentForm,
                  () =>
                    setDocumentForm({
                      title: "",
                      document_type: "",
                      file_url: ""
                    })
                );
              }}
            >
              <div className="text-lg font-semibold text-slate-900">Add Document</div>
              <Field label="Title">
                <input
                  className={inputClass}
                  value={documentForm.title}
                  onChange={(e) => setDocumentForm((s) => ({ ...s, title: e.target.value }))}
                />
              </Field>
              <Field label="Document Type">
                <input
                  className={inputClass}
                  value={documentForm.document_type}
                  onChange={(e) => setDocumentForm((s) => ({ ...s, document_type: e.target.value }))}
                />
              </Field>
              <Field label="File URL">
                <input
                  className={inputClass}
                  value={documentForm.file_url}
                  onChange={(e) => setDocumentForm((s) => ({ ...s, file_url: e.target.value }))}
                />
              </Field>
              <button
                type="submit"
                disabled={submitting === "document"}
                className="rounded-2xl bg-[#0176D3] px-4 py-3 text-sm font-semibold text-white"
              >
                {submitting === "document" ? "Saving..." : "Add Document"}
              </button>
            </form>

            <form
              className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-5"
              onSubmit={(e) => {
                e.preventDefault();
                submitForm(
                  "mailProgram",
                  `/api/campaigns/${id}/mail-programs`,
                  mailProgramForm,
                  () =>
                    setMailProgramForm({
                      name: "",
                      description: ""
                    })
                );
              }}
            >
              <div className="text-lg font-semibold text-slate-900">Create Mail Program</div>
              <Field label="Name">
                <input
                  className={inputClass}
                  value={mailProgramForm.name}
                  onChange={(e) => setMailProgramForm((s) => ({ ...s, name: e.target.value }))}
                />
              </Field>
              <Field label="Description">
                <textarea
                  className={textareaClass}
                  value={mailProgramForm.description}
                  onChange={(e) => setMailProgramForm((s) => ({ ...s, description: e.target.value }))}
                />
              </Field>
              <button
                type="submit"
                disabled={submitting === "mailProgram"}
                className="rounded-2xl bg-[#0176D3] px-4 py-3 text-sm font-semibold text-white"
              >
                {submitting === "mailProgram" ? "Saving..." : "Create Mail Program"}
              </button>
            </form>

            <form
              className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-5"
              onSubmit={(e) => {
                e.preventDefault();
                submitForm(
                  "mailDrop",
                  `/api/campaigns/${id}/mail-drops`,
                  {
                    ...mailDropForm,
                    program_id: mailDropForm.program_id ? Number(mailDropForm.program_id) : null,
                    quantity: Number(mailDropForm.quantity || 0)
                  },
                  () =>
                    setMailDropForm({
                      program_id: "",
                      drop_date: "",
                      quantity: ""
                    })
                );
              }}
            >
              <div className="text-lg font-semibold text-slate-900">Create Mail Drop</div>
              <Field label="Program">
                <select
                  className={inputClass}
                  value={mailDropForm.program_id}
                  onChange={(e) => setMailDropForm((s) => ({ ...s, program_id: e.target.value }))}
                >
                  <option value="">No linked program</option>
                  {(data.mail?.programs || []).map((program) => (
                    <option key={program.id} value={program.id}>
                      {program.name}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Drop Date">
                  <input
                    className={inputClass}
                    type="date"
                    value={mailDropForm.drop_date}
                    onChange={(e) => setMailDropForm((s) => ({ ...s, drop_date: e.target.value }))}
                  />
                </Field>
                <Field label="Quantity">
                  <input
                    className={inputClass}
                    type="number"
                    value={mailDropForm.quantity}
                    onChange={(e) => setMailDropForm((s) => ({ ...s, quantity: e.target.value }))}
                  />
                </Field>
              </div>
              <button
                type="submit"
                disabled={submitting === "mailDrop"}
                className="rounded-2xl bg-[#0176D3] px-4 py-3 text-sm font-semibold text-white"
              >
                {submitting === "mailDrop" ? "Saving..." : "Create Mail Drop"}
              </button>
            </form>

            <form
              className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-5 xl:col-span-2"
              onSubmit={(e) => {
                e.preventDefault();
                submitForm(
                  "mailEvent",
                  `/api/campaigns/${id}/mail-events`,
                  {
                    ...mailEventForm,
                    mail_drop_id: mailEventForm.mail_drop_id ? Number(mailEventForm.mail_drop_id) : null
                  },
                  () =>
                    setMailEventForm({
                      mail_drop_id: "",
                      event_type: "entered_usps",
                      status: "",
                      location_name: "",
                      facility_type: "",
                      notes: "",
                      source: "manual"
                    })
                );
              }}
            >
              <div className="text-lg font-semibold text-slate-900">Add Mail Event</div>
              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Mail Drop">
                  <select
                    className={inputClass}
                    value={mailEventForm.mail_drop_id}
                    onChange={(e) => setMailEventForm((s) => ({ ...s, mail_drop_id: e.target.value }))}
                  >
                    <option value="">No linked drop</option>
                    {(data.mail?.drops || []).map((drop) => (
                      <option key={drop.id} value={drop.id}>
                        Drop #{drop.id} • {drop.drop_date}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Event Type">
                  <select
                    className={inputClass}
                    value={mailEventForm.event_type}
                    onChange={(e) => setMailEventForm((s) => ({ ...s, event_type: e.target.value }))}
                  >
                    <option value="entered_usps">entered_usps</option>
                    <option value="in_transit">in_transit</option>
                    <option value="delayed">delayed</option>
                    <option value="delivered">delivered</option>
                  </select>
                </Field>
                <Field label="Status">
                  <input
                    className={inputClass}
                    value={mailEventForm.status}
                    onChange={(e) => setMailEventForm((s) => ({ ...s, status: e.target.value }))}
                  />
                </Field>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Location">
                  <input
                    className={inputClass}
                    value={mailEventForm.location_name}
                    onChange={(e) => setMailEventForm((s) => ({ ...s, location_name: e.target.value }))}
                  />
                </Field>
                <Field label="Facility Type">
                  <input
                    className={inputClass}
                    value={mailEventForm.facility_type}
                    onChange={(e) => setMailEventForm((s) => ({ ...s, facility_type: e.target.value }))}
                  />
                </Field>
                <Field label="Source">
                  <input
                    className={inputClass}
                    value={mailEventForm.source}
                    onChange={(e) => setMailEventForm((s) => ({ ...s, source: e.target.value }))}
                  />
                </Field>
              </div>

              <Field label="Notes">
                <textarea
                  className={textareaClass}
                  value={mailEventForm.notes}
                  onChange={(e) => setMailEventForm((s) => ({ ...s, notes: e.target.value }))}
                />
              </Field>

              <button
                type="submit"
                disabled={submitting === "mailEvent"}
                className="rounded-2xl bg-[#0176D3] px-4 py-3 text-sm font-semibold text-white"
              >
                {submitting === "mailEvent" ? "Saving..." : "Add Mail Event"}
              </button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
}
