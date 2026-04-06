import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../services/api";

const DEFAULT_CAMPAIGN_ID = "1";

function formatMoney(value) {
  return `$${Number(value || 0).toLocaleString()}`;
}

function EmptyState({ text }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
      {text}
    </div>
  );
}

function StatCard({ label, value, subtext }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-xs uppercase tracking-[0.16em] text-slate-500">{label}</div>
      <div className="mt-3 text-3xl font-semibold text-slate-900">{value}</div>
      <div className="mt-2 text-sm text-slate-500">{subtext}</div>
    </div>
  );
}

function SectionCard({ title, subtitle, children, right }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
        </div>
        {right ? <div>{right}</div> : null}
      </div>
      {children}
    </section>
  );
}

function Badge({ children, tone = "default" }) {
  const classes =
    tone === "demo"
      ? "border-amber-200 bg-amber-50 text-amber-800"
      : tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : tone === "warning"
      ? "border-amber-200 bg-amber-50 text-amber-800"
      : tone === "danger"
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${classes}`}>
      {children}
    </span>
  );
}

function statusTone(value) {
  const v = String(value || "").toLowerCase();
  if (v.includes("active") || v.includes("done") || v.includes("delivered")) return "success";
  if (v.includes("risk") || v.includes("delayed") || v.includes("high")) return "danger";
  if (v.includes("watch") || v.includes("medium") || v.includes("prospect") || v.includes("todo")) return "warning";
  return "default";
}

const demoWorkspace = {
  campaign: {
    id: 1,
    campaign_name: "Stephens for Senate",
    candidate_name: "Mark Stephens",
    state: "Georgia",
    office: "U.S. Senate",
    stage: "General Election",
    status: "Active",
    firm_name: "Red Tag Strategies",
    owner_name: "Mark Stephens"
  },
  metrics: [
    { label: "Open Tasks", value: "8", subtext: "3 due today" },
    { label: "Active Vendors", value: "2", subtext: "All on track" },
    { label: "Cash On Hand", value: "$6.1M", subtext: "Strong reserve" },
    { label: "Mail Risk", value: "1", subtext: "Atlanta delay" }
  ],
  alerts: [
    {
      id: 1,
      title: "Atlanta NDC mail delay detected",
      message: "Weekend suburban persuasion universe may be exposed if not escalated.",
      severity: "high",
      action_status: "open",
      type: "mail_delay"
    },
    {
      id: 2,
      title: "Education contrast opportunity rising",
      message: "Local press narrative is shifting in your favor if reinforced quickly.",
      severity: "medium",
      action_status: "open",
      type: "warroom"
    }
  ],
  tasks: [
    {
      id: 1,
      title: "Approve affordability contrast memo",
      status: "todo",
      priority: "high"
    },
    {
      id: 2,
      title: "Confirm Atlanta mail escalation",
      status: "in_progress",
      priority: "high"
    },
    {
      id: 3,
      title: "Refresh surrogate education packet",
      status: "todo",
      priority: "medium"
    }
  ],
  vendors: [
    {
      id: 1,
      vendor_name: "Precision Mail Group",
      category: "Direct Mail",
      status: "active",
      contract_value: 85000
    },
    {
      id: 2,
      vendor_name: "Capitol Digital Media",
      category: "Digital",
      status: "active",
      contract_value: 120000
    }
  ],
  contacts: [
    {
      id: 1,
      full_name: "Sarah Collins",
      role: "Campaign Manager",
      email: "sarah@demo.local"
    },
    {
      id: 2,
      full_name: "David Brooks",
      role: "Finance Director",
      email: "david@demo.local"
    }
  ],
  documents: [
    {
      id: 1,
      title: "Weekend Response Brief",
      document_type: "Memo"
    },
    {
      id: 2,
      title: "Georgia Suburban Target Universe",
      document_type: "Targeting Sheet"
    }
  ],
  fundraising: {
    total_receipts: 12850000,
    cash_on_hand: 6100000
  },
  forecast: {
    snapshot: {
      published_at: new Date().toISOString(),
      race_count: 12,
      tossup_count: 3,
      high_confidence_count: 5
    },
    races: [
      {
        id: 1,
        state: "Georgia",
        office: "Senate",
        rating: "Lean D"
      },
      {
        id: 2,
        state: "Pennsylvania",
        office: "Senate",
        rating: "Lean D"
      }
    ]
  },
  mail: {
    programs: [
      { id: 1, name: "Weekend Persuasion Flight" }
    ],
    drops: [
      { id: 77, drop_date: "2026-04-10", quantity: 250000 }
    ],
    recent_events: [
      {
        id: 1,
        mail_drop_id: 77,
        event_type: "delayed",
        status: "delayed",
        location_name: "Atlanta NDC",
        facility_type: "NDC"
      },
      {
        id: 2,
        mail_drop_id: 77,
        event_type: "in_transit",
        status: "in_transit",
        location_name: "Georgia Network",
        facility_type: "Regional"
      }
    ]
  },
  activity: [
    {
      id: 1,
      activity_type: "mail_delay_detected",
      created_at: new Date().toISOString(),
      summary: "Mail intelligence flagged a delay at Atlanta NDC for drop #77.",
      details: {
        actor: "system",
        severity: "high"
      }
    },
    {
      id: 2,
      activity_type: "forecast_updated",
      created_at: new Date(Date.now() - 1000 * 60 * 26).toISOString(),
      summary: "Georgia Senate probability improved after overnight update.",
      details: {
        actor: "forecast-engine",
        change: "+2.4"
      }
    },
    {
      id: 3,
      activity_type: "vendor_confirmed",
      created_at: new Date(Date.now() - 1000 * 60 * 54).toISOString(),
      summary: "Precision Mail Group confirmed weekend handling escalation.",
      details: {
        actor: "operations",
        vendor: "Precision Mail Group"
      }
    }
  ]
};

export default function CampaignWorkspace() {
  const params = useParams();
  const campaignId = String(params.id || DEFAULT_CAMPAIGN_ID);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const demoMode =
    typeof window !== "undefined" &&
    localStorage.getItem("vs_demo_mode") === "1";

  const [workspace, setWorkspace] = useState(demoWorkspace);

  useEffect(() => {
    let active = true;

    async function loadWorkspace() {
      if (demoMode) {
        setWorkspace(demoWorkspace);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const [workspaceRes, activityRes] = await Promise.allSettled([
          api.get(`/campaigns/${campaignId}/command-center`, { timeout: 7000 }),
          api.get(`/campaigns/${campaignId}/activity`, { timeout: 7000 })
        ]);

        if (!active) return;

        const workspaceData =
          workspaceRes.status === "fulfilled" ? workspaceRes.value?.data : null;
        const activityData =
          activityRes.status === "fulfilled" ? activityRes.value?.data : null;

        setWorkspace({
          campaign: workspaceData?.campaign || demoWorkspace.campaign,
          metrics: workspaceData?.metrics || demoWorkspace.metrics,
          alerts: workspaceData?.alerts || demoWorkspace.alerts,
          tasks: workspaceData?.tasks || demoWorkspace.tasks,
          vendors: workspaceData?.vendors || demoWorkspace.vendors,
          contacts: workspaceData?.contacts || demoWorkspace.contacts,
          documents: workspaceData?.documents || demoWorkspace.documents,
          fundraising: workspaceData?.fundraising || demoWorkspace.fundraising,
          forecast: workspaceData?.forecast || demoWorkspace.forecast,
          mail: workspaceData?.mail || demoWorkspace.mail,
          activity: Array.isArray(activityData) && activityData.length ? activityData : demoWorkspace.activity
        });
      } catch (err) {
        if (!active) return;
        setError(err?.response?.data?.error || err?.message || "Failed to load campaign workspace");
        setWorkspace(demoWorkspace);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadWorkspace();

    return () => {
      active = false;
    };
  }, [campaignId, demoMode]);

  const campaignTitle = useMemo(() => {
    const campaign = workspace?.campaign;
    if (!campaign) return `Campaign Workspace #${campaignId}`;
    return campaign.campaign_name || campaign.candidate_name || `Campaign Workspace #${campaignId}`;
  }, [workspace, campaignId]);

  return (
    <div className="min-h-screen bg-[#f3f6f9] p-6 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-xs uppercase tracking-[0.22em] text-[#0176D3]">
              Campaign Operating Workspace
            </div>

            {demoMode ? <Badge tone="demo">Demo Mode</Badge> : null}
            <Badge tone={statusTone(workspace?.campaign?.status)}>
              {workspace?.campaign?.status || "Active"}
            </Badge>
          </div>

          <h1 className="mt-3 text-3xl font-semibold text-slate-900">{campaignTitle}</h1>

          <p className="mt-3 max-w-3xl text-sm text-slate-600">
            The live operating workspace for campaign execution, alerts, fundraising context, forecast movement, vendors, and mail intelligence.
          </p>

          {demoMode ? (
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Demo campaign workspace is active. Tasks, alerts, vendors, fundraising, and mail intelligence are preloaded for presentation.
            </div>
          ) : null}

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Stage</div>
              <div className="mt-2 text-lg font-semibold text-slate-900">
                {workspace?.campaign?.stage || "Open"}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Status</div>
              <div className="mt-2 text-lg font-semibold text-slate-900">
                {workspace?.campaign?.status || "Open"}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Firm</div>
              <div className="mt-2 text-lg font-semibold text-slate-900">
                {workspace?.campaign?.firm_name || "Unassigned"}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Owner</div>
              <div className="mt-2 text-lg font-semibold text-slate-900">
                {workspace?.campaign?.owner_name || "Unassigned"}
              </div>
            </div>
          </div>
        </section>

        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {(workspace.metrics || []).map((metric, index) => (
            <StatCard
              key={`${metric.label}-${index}`}
              label={metric.label}
              value={metric.value}
              subtext={metric.subtext}
            />
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
          <SectionCard
            title="Alert Panel"
            subtitle="What needs executive attention right now"
            right={<Badge>{(workspace.alerts || []).length} alerts</Badge>}
          >
            <div className="space-y-4">
              {loading ? (
                <EmptyState text="Loading alerts..." />
              ) : !(workspace.alerts || []).length ? (
                <EmptyState text="No active alerts." />
              ) : (
                (workspace.alerts || []).map((alert) => (
                  <div
                    key={alert.id || alert.title}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-slate-900">{alert.title}</div>
                        <div className="mt-1 text-sm text-slate-600">{alert.message}</div>
                      </div>
                      <Badge tone={statusTone(alert.severity)}>{alert.severity}</Badge>
                    </div>

                    <div className="mt-3 text-xs text-slate-500">
                      Type: {alert.type || "alert"} • Status: {alert.action_status || "open"}
                    </div>
                  </div>
                ))
              )}
            </div>
          </SectionCard>

          <SectionCard title="Fundraising Snapshot" subtitle="Live finance context for the campaign">
            {loading ? (
              <EmptyState text="Loading fundraising..." />
            ) : !workspace.fundraising ? (
              <EmptyState text="No fundraising data available." />
            ) : (
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
                    Total Receipts
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-slate-900">
                    {formatMoney(workspace.fundraising.total_receipts || 0)}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
                    Cash on Hand
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-slate-900">
                    {formatMoney(workspace.fundraising.cash_on_hand || 0)}
                  </div>
                </div>
              </div>
            )}
          </SectionCard>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr,1fr,1fr]">
          <SectionCard title="Open Tasks" subtitle="Execution items moving the campaign">
            <div className="space-y-3">
              {loading ? (
                <EmptyState text="Loading tasks..." />
              ) : !(workspace.tasks || []).length ? (
                <EmptyState text="No tasks found." />
              ) : (
                (workspace.tasks || []).map((task) => (
                  <div key={task.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-slate-900">{task.title}</div>
                        <div className="mt-1 text-sm text-slate-500">
                          Status: {task.status || "todo"}
                        </div>
                      </div>
                      <Badge tone={statusTone(task.priority)}>{task.priority || "medium"}</Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </SectionCard>

          <SectionCard title="Vendors" subtitle="Active campaign partners">
            <div className="space-y-3">
              {loading ? (
                <EmptyState text="Loading vendors..." />
              ) : !(workspace.vendors || []).length ? (
                <EmptyState text="No vendors found." />
              ) : (
                (workspace.vendors || []).map((vendor) => (
                  <div key={vendor.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-slate-900">{vendor.vendor_name}</div>
                        <div className="mt-1 text-sm text-slate-500">
                          {vendor.category || "Vendor"}
                        </div>
                      </div>
                      <Badge tone={statusTone(vendor.status)}>{vendor.status || "active"}</Badge>
                    </div>

                    <div className="mt-3 text-sm text-slate-700">
                      Contract: {formatMoney(vendor.contract_value || 0)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </SectionCard>

          <SectionCard title="Contacts + Documents" subtitle="Team and campaign assets">
            <div className="space-y-4">
              <div>
                <div className="mb-3 text-sm font-semibold text-slate-900">Contacts</div>
                <div className="space-y-3">
                  {(workspace.contacts || []).map((contact) => (
                    <div key={contact.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="font-semibold text-slate-900">{contact.full_name}</div>
                      <div className="mt-1 text-sm text-slate-500">{contact.role || "Contact"}</div>
                      <div className="mt-2 text-xs text-slate-500">{contact.email || "No email"}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-3 text-sm font-semibold text-slate-900">Documents</div>
                <div className="space-y-3">
                  {(workspace.documents || []).map((document) => (
                    <div key={document.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="font-semibold text-slate-900">{document.title}</div>
                      <div className="mt-1 text-sm text-slate-500">
                        {document.document_type || "Document"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr,1fr]">
          <SectionCard title="MailOps Panel" subtitle="Execution visibility across mail activity">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Programs</div>
                <div className="mt-2 text-2xl font-semibold text-slate-900">
                  {workspace.mail?.programs?.length || 0}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Drops</div>
                <div className="mt-2 text-2xl font-semibold text-slate-900">
                  {workspace.mail?.drops?.length || 0}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Recent Events</div>
                <div className="mt-2 text-2xl font-semibold text-slate-900">
                  {workspace.mail?.recent_events?.length || 0}
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {loading ? (
                <EmptyState text="Loading mail activity..." />
              ) : !(workspace.mail?.recent_events || []).length ? (
                <EmptyState text="No mail events available." />
              ) : (
                (workspace.mail.recent_events || []).map((event) => (
                  <div key={event.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-slate-900">
                          {event.event_type || "event"}
                        </div>
                        <div className="mt-1 text-sm text-slate-500">
                          Drop #{event.mail_drop_id} • {event.location_name || event.facility_type || "Network"}
                        </div>
                      </div>
                      <Badge tone={statusTone(event.status || event.event_type)}>
                        {event.status || event.event_type || "event"}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </SectionCard>

          <SectionCard title="Forecast Context" subtitle="What the modeled map is saying now">
            <div className="space-y-4">
              {workspace.forecast?.snapshot ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
                    Latest Forecast Snapshot
                  </div>
                  <div className="mt-2 text-sm text-slate-700">
                    Published:{" "}
                    {workspace.forecast.snapshot.published_at
                      ? new Date(workspace.forecast.snapshot.published_at).toLocaleString()
                      : "Not published"}
                  </div>
                  <div className="mt-3 grid gap-2 text-xs text-slate-500 md:grid-cols-3">
                    <div>Races: {workspace.forecast.snapshot.race_count ?? 0}</div>
                    <div>Toss-ups: {workspace.forecast.snapshot.tossup_count ?? 0}</div>
                    <div>High Confidence: {workspace.forecast.snapshot.high_confidence_count ?? 0}</div>
                  </div>
                </div>
              ) : null}

              <div className="space-y-3">
                {loading ? (
                  <EmptyState text="Loading forecast races..." />
                ) : !(workspace.forecast?.races || []).length ? (
                  <EmptyState text="No forecast race context found." />
                ) : (
                  (workspace.forecast.races || []).map((race) => (
                    <div key={race.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="font-semibold text-slate-900">
                        {race.state || "State"} • {race.office || "Race"}
                      </div>
                      <div className="mt-1 text-sm text-slate-500">
                        {race.rating || race.category || "Competitive"}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </SectionCard>
        </div>

        <SectionCard title="Activity Timeline" subtitle="Recent operational activity across the campaign">
          <div className="space-y-3">
            {loading ? (
              <EmptyState text="Loading activity..." />
            ) : !(workspace.activity || []).length ? (
              <EmptyState text="No activity yet." />
            ) : (
              (workspace.activity || []).map((item) => {
                const details = item.details || item.metadata || {};

                return (
                  <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-slate-900">
                        {String(item.activity_type || "").replaceAll("_", " ")}
                      </div>
                      <div className="text-xs text-slate-400">
                        {item.created_at ? new Date(item.created_at).toLocaleString() : "Unknown"}
                      </div>
                    </div>

                    {item.summary ? (
                      <div className="mt-2 text-sm text-slate-700">{item.summary}</div>
                    ) : null}

                    <div className="mt-2 space-y-1 text-xs text-slate-500">
                      {Object.entries(details)
                        .filter(([k]) => k !== "timestamp")
                        .map(([k, v]) => (
                          <div key={k}>
                            {k}: {String(v)}
                          </div>
                        ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
