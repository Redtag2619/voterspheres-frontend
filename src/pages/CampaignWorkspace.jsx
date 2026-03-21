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

export default function CampaignWorkspace() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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
                    <div className="mt-3 text-xs text-slate-500">
                      Type: {alert.type}
                    </div>
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
      </div>
    </div>
  );
}
