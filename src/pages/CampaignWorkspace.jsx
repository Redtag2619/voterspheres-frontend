import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../services/api";
import useLiveChannel from "../hooks/useLiveChannel";

const DEFAULT_CAMPAIGN_ID = "2";

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
  "w-full min-h-[100px] rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none";

function formatCurrency(value) {
  return `$${Number(value || 0).toLocaleString()}`;
}

function createLiveActivity(payload, title) {
  return {
    id: `live-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    activity_type: title,
    created_at: new Date().toISOString(),
    summary: payload?.note || payload?.status || title,
    details: payload || {}
  };
}

export default function CampaignWorkspace() {
  const params = useParams();
  const campaignId = String(params.id || DEFAULT_CAMPAIGN_ID);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState("");
  const [activity, setActivity] = useState([]);
  const [alertNotes, setAlertNotes] = useState({});
  const [liveBanner, setLiveBanner] = useState("");
  const [livePulse, setLivePulse] = useState(false);

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

  const getJson = useCallback(async (path) => {
    const response = await api.get(path);
    return response.data;
  }, []);

  const postJson = useCallback(async (path, body) => {
    const response = await api.post(path, body);
    return response.data;
  }, []);

  const patchJson = useCallback(async (path, body) => {
    const response = await api.patch(path, body);
    return response.data;
  }, []);

  async function loadWorkspace() {
    const result = await getJson(`/campaigns/${campaignId}/command-center`);
    setData(result || {});
  }

  async function loadActivity() {
    const result = await getJson(`/campaigns/${campaignId}/activity`);
    setActivity(Array.isArray(result) ? result : []);
  }

  async function loadAll(background = false) {
    try {
      if (!background) {
        setLoading(true);
      }
      setError("");
      await Promise.all([loadWorkspace(), loadActivity()]);
    } catch (err) {
      setError(err?.message || "Failed to load campaign workspace");
    } finally {
      if (!background) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    loadAll();
  }, [campaignId]);

  useLiveChannel(`campaign:${campaignId}`, (event) => {
    if (!event?.type) return;

    if (event.type === "mail.delay_detected") {
      const payload = event.payload || {};

      setLiveBanner(
        `Live alert: mail delay detected for drop #${payload.mailDropId || "N/A"} at ${
          payload.location || "Unknown location"
        }`
      );
      setLivePulse(true);

      setTimeout(() => {
        setLivePulse(false);
      }, 1800);

      setData((prev) => {
        const liveMailEvent = {
          id: `live-mail-${Date.now()}`,
          mail_drop_id: payload.mailDropId || null,
          campaign_id: payload.campaignId || campaignId,
          event_type: "delayed",
          status: payload.status || "delayed",
          location_name: payload.location || "Unknown location",
          facility_type: payload.facilityType || "live_signal",
          notes: payload.note || "Live delay signal",
          source: "live_intelligence",
          created_at: new Date().toISOString()
        };

        const nextAlerts = [
          {
            alert_key: `mail-delay-${Date.now()}`,
            title: "Live Mail Delay Alert",
            message:
              payload.note ||
              `Mail delay detected at ${payload.location || "Unknown location"}`,
            severity: "high",
            type: "mail_delay",
            campaign_id: payload.campaignId || campaignId,
            entity_id: payload.mailDropId || null,
            action_status: "open",
            meta: {
              mail_event_id: payload.mailDropId || null
            }
          },
          ...(prev?.alerts || [])
        ];

        const nextRecent = [liveMailEvent, ...(prev?.mail?.recent_events || [])];
        const nextDelayed = [liveMailEvent, ...(prev?.mail?.delayed_events || [])];

        return {
          ...prev,
          alerts: nextAlerts,
          mail: {
            ...(prev?.mail || {}),
            recent_events: nextRecent,
            delayed_events: nextDelayed
          }
        };
      });

      setActivity((prev) => [
        createLiveActivity(event.payload || {}, "mail.delay_detected"),
        ...prev
      ]);

      setTimeout(() => {
        loadAll(true);
      }, 700);
    }
  });

  async function submitForm(formName, path, body, resetFn) {
    try {
      setSubmitting(formName);
      setError("");

      await postJson(path, body);

      resetFn();
      await loadAll(true);
    } catch (err) {
      setError(err?.message || "Failed to save");
    } finally {
      setSubmitting("");
    }
  }

  async function patchEntity(formName, path, body) {
    try {
      setSubmitting(formName);
      setError("");

      await patchJson(path, body);

      await loadAll(true);
    } catch (err) {
      setError(err?.message || "Failed to update");
    } finally {
      setSubmitting("");
    }
  }

  async function actOnAlert(alert, action) {
    try {
      setSubmitting(`${action}-${alert.alert_key}`);
      setError("");

      await postJson(`/alerts/${action}`, {
        alert_key: alert.alert_key,
        alert_type: alert.type,
        campaign_id: alert.campaign_id,
        entity_id: alert.entity_id,
        notes: alertNotes[alert.alert_key] || ""
      });

      await loadAll(true);
    } catch (err) {
      setError(err?.message || `Failed to ${action} alert`);
    } finally {
      setSubmitting("");
    }
  }

  async function quickResolveAlert(alert) {
    try {
      if (alert.type === "task" && alert.meta?.task_id) {
        await patchEntity(
          `task-inline-${alert.meta.task_id}`,
          `/campaigns/${campaignId}/tasks/${alert.meta.task_id}`,
          { status: "done" }
        );
      } else if (alert.type === "vendor" && alert.meta?.vendor_id) {
        await patchEntity(
          `vendor-inline-${alert.meta.vendor_id}`,
          `/campaigns/${campaignId}/vendors/${alert.meta.vendor_id}`,
          { status: "active" }
        );
      } else if (alert.type === "mail_delay" && alert.meta?.mail_event_id) {
        await patchEntity(
          `mail-inline-${alert.meta.mail_event_id}`,
          `/campaigns/${campaignId}/mail-events/${alert.meta.mail_event_id}`,
          { event_type: "delivered", status: "delivered" }
        );
      }

      await actOnAlert(alert, "resolve");
    } catch (err) {
      setError(err?.message || "Failed to resolve alert");
    }
  }

  const campaignTitle = useMemo(() => {
    if (!data?.campaign) return `Campaign Workspace #${campaignId}`;
    return (
      data.campaign.campaign_name ||
      data.campaign.candidate_name ||
      `Campaign Workspace #${campaignId}`
    );
  }, [data, campaignId]);

  return (
    <div className="min-h-screen bg-[#f3f6f9] p-6 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <section
          className={`rounded-[28px] border border-[#d8dde6] bg-gradient-to-r from-[#0176D3] to-[#0b5cab] p-8 text-white shadow-sm transition ${
            livePulse ? "ring-4 ring-amber-300/60" : ""
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs uppercase tracking-[0.22em] text-blue-100">
              Campaign Command Center
            </div>
            <div className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-blue-50">
              Active Campaign ID: {campaignId}
            </div>
          </div>

          <h1 className="mt-2 text-3xl font-semibold">{campaignTitle}</h1>
          <p className="mt-3 max-w-3xl text-sm text-blue-50">
            Live operational cockpit for campaign execution, alerts, vendors,
            fundraising, forecast context, and mail intelligence.
          </p>

          {liveBanner ? (
            <div className="mt-5 rounded-2xl border border-amber-200/40 bg-amber-50/20 px-4 py-3 text-sm text-amber-50">
              {liveBanner}
            </div>
          ) : null}

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
            subtitle="Resolve or dismiss issues directly from the cockpit"
            right={
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">
                {data.alerts?.length || 0} alerts
              </span>
            }
          >
            <div className="space-y-4">
              {loading ? (
                <EmptyState text="Loading alerts..." />
              ) : data.alerts?.length ? (
                data.alerts.map((alert) => (
                  <div
                    key={alert.alert_key}
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

                    <div className="mt-3 text-xs text-slate-500">
                      Type: {alert.type} • Status: {alert.action_status || "open"}
                    </div>

                    <div className="mt-3">
                      <textarea
                        className={textareaClass}
                        placeholder="Resolution notes"
                        value={alertNotes[alert.alert_key] || ""}
                        onChange={(e) =>
                          setAlertNotes((s) => ({
                            ...s,
                            [alert.alert_key]: e.target.value
                          }))
                        }
                      />
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => quickResolveAlert(alert)}
                        disabled={submitting === `resolve-${alert.alert_key}`}
                        className="rounded-2xl bg-[#0176D3] px-4 py-2 text-sm font-semibold text-white"
                      >
                        Resolve + Apply
                      </button>

                      <button
                        type="button"
                        onClick={() => actOnAlert(alert, "dismiss")}
                        disabled={submitting === `dismiss-${alert.alert_key}`}
                        className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState text="No active alerts." />
              )}
            </div>
          </Card>

          <Card title="Open Tasks" subtitle="Inline status control">
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

                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          patchEntity(
                            `task-${task.id}`,
                            `/campaigns/${campaignId}/tasks/${task.id}`,
                            { status: "in_progress" }
                          )
                        }
                        className="rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
                      >
                        Mark In Progress
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          patchEntity(
                            `task-${task.id}`,
                            `/campaigns/${campaignId}/tasks/${task.id}`,
                            { status: "done" }
                          )
                        }
                        className="rounded-2xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white"
                      >
                        Mark Done
                      </button>
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
                    {formatCurrency(data.fundraising.total_receipts || 0)}
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
                    Cash on Hand
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-slate-900">
                    {formatCurrency(data.fundraising.cash_on_hand || 0)}
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState text="No fundraising match found." />
            )}
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card title="Vendors" subtitle="Inline status control">
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
                      Contract: {formatCurrency(vendor.contract_value || 0)}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          patchEntity(
                            `vendor-${vendor.id}`,
                            `/campaigns/${campaignId}/vendors/${vendor.id}`,
                            { status: "active" }
                          )
                        }
                        className="rounded-2xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white"
                      >
                        Mark Active
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          patchEntity(
                            `vendor-${vendor.id}`,
                            `/campaigns/${campaignId}/vendors/${vendor.id}`,
                            { status: "at_risk" }
                          )
                        }
                        className="rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
                      >
                        Mark At Risk
                      </button>
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
          <Card title="MailOps Panel" subtitle="Inline event status control + live campaign alerts">
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
                    className={`rounded-2xl border p-4 ${
                      String(event.status || event.event_type || "").toLowerCase() === "delayed"
                        ? "border-amber-300 bg-amber-50"
                        : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-slate-900">
                          {event.event_type || "event"}
                        </div>
                        <div className="mt-1 text-sm text-slate-500">
                          Drop #{event.mail_drop_id} •{" "}
                          {event.location_name || event.facility_type || "Network"}
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

                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          patchEntity(
                            `mail-${event.id}`,
                            `/campaigns/${campaignId}/mail-events/${event.id}`,
                            { event_type: "in_transit", status: "in_transit" }
                          )
                        }
                        className="rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
                      >
                        Mark In Transit
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          patchEntity(
                            `mail-${event.id}`,
                            `/campaigns/${campaignId}/mail-events/${event.id}`,
                            { event_type: "delivered", status: "delivered" }
                          )
                        }
                        className="rounded-2xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white"
                      >
                        Mark Delivered
                      </button>
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

        <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
          <Card title="Action Panels" subtitle="Write directly into the campaign operating system">
            <div className="grid gap-6 xl:grid-cols-2">
              <form
                className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-5"
                onSubmit={(e) => {
                  e.preventDefault();
                  submitForm(
                    "task",
                    `/campaigns/${campaignId}/tasks`,
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
                    `/campaigns/${campaignId}/contacts`,
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
                    `/campaigns/${campaignId}/vendors`,
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
                    `/campaigns/${campaignId}/documents`,
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
                    `/campaigns/${campaignId}/mail-programs`,
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
                    `/campaigns/${campaignId}/mail-drops`,
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
                    `/campaigns/${campaignId}/mail-events`,
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

          <Card title="Activity Timeline" subtitle="Live campaign audit rail">
            <div className="max-h-[900px] space-y-3 overflow-y-auto pr-2">
              {loading ? (
                <EmptyState text="Loading activity..." />
              ) : activity.length ? (
                activity.map((item) => {
                  const details = item.details || item.metadata || {};
                  return (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-semibold text-slate-900">
                          {String(item.activity_type || "").replaceAll("_", " ")}
                        </div>
                        <div className="text-xs text-slate-400">
                          {item.created_at
                            ? new Date(item.created_at).toLocaleString()
                            : "No timestamp"}
                        </div>
                      </div>

                      <div className="mt-2 text-xs text-slate-500">
                        Actor: {details.actor || "system"}
                      </div>

                      {item.summary ? (
                        <div className="mt-2 text-sm text-slate-700">{item.summary}</div>
                      ) : null}

                      <div className="mt-2 space-y-1 text-xs text-slate-500">
                        {Object.entries(details)
                          .filter(([k]) => k !== "actor" && k !== "timestamp")
                          .map(([k, v]) => (
                            <div key={k}>
                              {k}: {String(v)}
                            </div>
                          ))}
                      </div>
                    </div>
                  );
                })
              ) : (
                <EmptyState text="No activity yet." />
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
