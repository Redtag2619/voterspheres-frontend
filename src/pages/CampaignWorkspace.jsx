import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../services/api";
import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";

const DEFAULT_CAMPAIGN_ID = "1";

function formatMoney(value) {
  return `$${Number(value || 0).toLocaleString()}`;
}

function statusTone(value) {
  const v = String(value || "").toLowerCase();
  if (v.includes("active") || v.includes("done") || v.includes("delivered")) return "active";
  if (v.includes("risk") || v.includes("delayed") || v.includes("high")) return "danger";
  if (v.includes("watch") || v.includes("medium") || v.includes("prospect") || v.includes("todo")) return "demo";
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
    { id: 1, title: "Approve affordability contrast memo", status: "todo", priority: "high" },
    { id: 2, title: "Confirm Atlanta mail escalation", status: "in_progress", priority: "high" },
    { id: 3, title: "Refresh surrogate education packet", status: "todo", priority: "medium" }
  ],
  vendors: [
    { id: 1, vendor_name: "Precision Mail Group", category: "Direct Mail", status: "active", contract_value: 85000 },
    { id: 2, vendor_name: "Capitol Digital Media", category: "Digital", status: "active", contract_value: 120000 }
  ],
  contacts: [
    { id: 1, full_name: "Sarah Collins", role: "Campaign Manager", email: "sarah@demo.local" },
    { id: 2, full_name: "David Brooks", role: "Finance Director", email: "david@demo.local" }
  ],
  documents: [
    { id: 1, title: "Weekend Response Brief", document_type: "Memo" },
    { id: 2, title: "Georgia Suburban Target Universe", document_type: "Targeting Sheet" }
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
      { id: 1, state: "Georgia", office: "Senate", rating: "Lean D" },
      { id: 2, state: "Pennsylvania", office: "Senate", rating: "Lean D" }
    ]
  },
  mail: {
    programs: [{ id: 1, name: "Weekend Persuasion Flight" }],
    drops: [{ id: 77, drop_date: "2026-04-10", quantity: 250000 }],
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
      details: { actor: "system", severity: "high" }
    },
    {
      id: 2,
      activity_type: "forecast_updated",
      created_at: new Date(Date.now() - 1000 * 60 * 26).toISOString(),
      summary: "Georgia Senate probability improved after overnight update.",
      details: { actor: "forecast-engine", change: "+2.4" }
    },
    {
      id: 3,
      activity_type: "vendor_confirmed",
      created_at: new Date(Date.now() - 1000 * 60 * 54).toISOString(),
      summary: "Precision Mail Group confirmed weekend handling escalation.",
      details: { actor: "operations", vendor: "Precision Mail Group" }
    }
  ]
};

function CardListItem({ title, subtitle, right, meta }) {
  return (
    <div className="vs-card-muted">
      <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, color: "var(--vs-text)" }}>{title}</div>
          {subtitle ? (
            <div style={{ marginTop: "0.35rem", fontSize: "0.92rem", color: "var(--vs-text-muted)", lineHeight: 1.6 }}>
              {subtitle}
            </div>
          ) : null}
          {meta ? (
            <div style={{ marginTop: "0.6rem", fontSize: "0.78rem", color: "var(--vs-text-muted)" }}>{meta}</div>
          ) : null}
        </div>
        {right ? <div>{right}</div> : null}
      </div>
    </div>
  );
}

export default function CampaignWorkspace() {
  const params = useParams();
  const campaignId = String(params.id || DEFAULT_CAMPAIGN_ID);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [workspace, setWorkspace] = useState(demoWorkspace);

  const demoMode =
    typeof window !== "undefined" &&
    localStorage.getItem("vs_demo_mode") === "1";

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
          activity:
            Array.isArray(activityData) && activityData.length
              ? activityData
              : demoWorkspace.activity
        });
      } catch (err) {
        if (!active) return;
        setError(
          err?.response?.data?.error ||
            err?.message ||
            "Failed to load campaign workspace"
        );
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
    <PageShell
      eyebrow="Campaign Operating Workspace"
      title={campaignTitle}
      description="The live operating workspace for campaign execution, alerts, fundraising context, forecast movement, vendors, and mail intelligence."
      demo={demoMode}
      demoText="Demo campaign workspace is active. Tasks, alerts, vendors, fundraising, and mail intelligence are preloaded for presentation."
    >
      {error ? (
        <div
          className="vs-banner"
          style={{ borderColor: "#fecaca", background: "#fef2f2", color: "#b91c1c" }}
        >
          {error}
        </div>
      ) : null}

      <SectionCard
        title="Campaign Profile"
        subtitle="High-level operating context for this campaign."
        right={<Badge tone={statusTone(workspace?.campaign?.status)}>{workspace?.campaign?.status || "Active"}</Badge>}
      >
        <div className="vs-grid-4">
          <div className="vs-card-muted">
            <div className="vs-stat-label">Stage</div>
            <div style={{ marginTop: "0.5rem", fontWeight: 700 }}>{workspace?.campaign?.stage || "Open"}</div>
          </div>
          <div className="vs-card-muted">
            <div className="vs-stat-label">State</div>
            <div style={{ marginTop: "0.5rem", fontWeight: 700 }}>{workspace?.campaign?.state || "N/A"}</div>
          </div>
          <div className="vs-card-muted">
            <div className="vs-stat-label">Firm</div>
            <div style={{ marginTop: "0.5rem", fontWeight: 700 }}>{workspace?.campaign?.firm_name || "Unassigned"}</div>
          </div>
          <div className="vs-card-muted">
            <div className="vs-stat-label">Owner</div>
            <div style={{ marginTop: "0.5rem", fontWeight: 700 }}>{workspace?.campaign?.owner_name || "Unassigned"}</div>
          </div>
        </div>
      </SectionCard>

      <div className="vs-grid-4">
        {(workspace.metrics || []).map((metric, index) => (
          <StatCard
            key={`${metric.label}-${index}`}
            label={metric.label}
            value={metric.value}
            subtext={metric.subtext}
          />
        ))}
      </div>

      <div className="vs-grid-2">
        <SectionCard
          title="Alert Panel"
          subtitle="What needs executive attention right now."
          right={<Badge>{(workspace.alerts || []).length} alerts</Badge>}
        >
          <div className="vs-stack">
            {loading ? (
              <EmptyState text="Loading alerts..." />
            ) : !(workspace.alerts || []).length ? (
              <EmptyState text="No active alerts." />
            ) : (
              (workspace.alerts || []).map((alert) => (
                <CardListItem
                  key={alert.id || alert.title}
                  title={alert.title}
                  subtitle={alert.message}
                  meta={`Type: ${alert.type || "alert"} • Status: ${alert.action_status || "open"}`}
                  right={<Badge tone={statusTone(alert.severity)}>{alert.severity}</Badge>}
                />
              ))
            )}
          </div>
        </SectionCard>

        <SectionCard title="Fundraising Snapshot" subtitle="Live finance context for the campaign.">
          {loading ? (
            <EmptyState text="Loading fundraising..." />
          ) : !workspace.fundraising ? (
            <EmptyState text="No fundraising data available." />
          ) : (
            <div className="vs-stack">
              <div className="vs-card-muted">
                <div className="vs-stat-label">Total Receipts</div>
                <div style={{ marginTop: "0.5rem", fontSize: "1.5rem", fontWeight: 700 }}>
                  {formatMoney(workspace.fundraising.total_receipts || 0)}
                </div>
              </div>
              <div className="vs-card-muted">
                <div className="vs-stat-label">Cash on Hand</div>
                <div style={{ marginTop: "0.5rem", fontSize: "1.5rem", fontWeight: 700 }}>
                  {formatMoney(workspace.fundraising.cash_on_hand || 0)}
                </div>
              </div>
            </div>
          )}
        </SectionCard>
      </div>

      <div className="vs-grid-3">
        <SectionCard title="Open Tasks" subtitle="Execution items moving the campaign.">
          <div className="vs-stack">
            {loading ? (
              <EmptyState text="Loading tasks..." />
            ) : !(workspace.tasks || []).length ? (
              <EmptyState text="No tasks found." />
            ) : (
              (workspace.tasks || []).map((task) => (
                <CardListItem
                  key={task.id}
                  title={task.title}
                  subtitle={`Status: ${task.status || "todo"}`}
                  right={<Badge tone={statusTone(task.priority)}>{task.priority || "medium"}</Badge>}
                />
              ))
            )}
          </div>
        </SectionCard>

        <SectionCard title="Vendors" subtitle="Active campaign partners.">
          <div className="vs-stack">
            {loading ? (
              <EmptyState text="Loading vendors..." />
            ) : !(workspace.vendors || []).length ? (
              <EmptyState text="No vendors found." />
            ) : (
              (workspace.vendors || []).map((vendor) => (
                <CardListItem
                  key={vendor.id}
                  title={vendor.vendor_name}
                  subtitle={vendor.category || "Vendor"}
                  meta={`Contract: ${formatMoney(vendor.contract_value || 0)}`}
                  right={<Badge tone={statusTone(vendor.status)}>{vendor.status || "active"}</Badge>}
                />
              ))
            )}
          </div>
        </SectionCard>

        <SectionCard title="Contacts + Documents" subtitle="Team and campaign assets.">
          <div className="vs-stack">
            {(workspace.contacts || []).map((contact) => (
              <CardListItem
                key={`contact-${contact.id}`}
                title={contact.full_name}
                subtitle={contact.role || "Contact"}
                meta={contact.email || "No email"}
              />
            ))}
            {(workspace.documents || []).map((document) => (
              <CardListItem
                key={`document-${document.id}`}
                title={document.title}
                subtitle={document.document_type || "Document"}
              />
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="vs-grid-2">
        <SectionCard title="MailOps Panel" subtitle="Execution visibility across mail activity.">
          <div className="vs-grid-3">
            <div className="vs-card-muted">
              <div className="vs-stat-label">Programs</div>
              <div style={{ marginTop: "0.5rem", fontSize: "1.5rem", fontWeight: 700 }}>
                {workspace.mail?.programs?.length || 0}
              </div>
            </div>
            <div className="vs-card-muted">
              <div className="vs-stat-label">Drops</div>
              <div style={{ marginTop: "0.5rem", fontSize: "1.5rem", fontWeight: 700 }}>
                {workspace.mail?.drops?.length || 0}
              </div>
            </div>
            <div className="vs-card-muted">
              <div className="vs-stat-label">Recent Events</div>
              <div style={{ marginTop: "0.5rem", fontSize: "1.5rem", fontWeight: 700 }}>
                {workspace.mail?.recent_events?.length || 0}
              </div>
            </div>
          </div>

          <div className="vs-stack" style={{ marginTop: "1rem" }}>
            {loading ? (
              <EmptyState text="Loading mail activity..." />
            ) : !(workspace.mail?.recent_events || []).length ? (
              <EmptyState text="No mail events available." />
            ) : (
              (workspace.mail.recent_events || []).map((event) => (
                <CardListItem
                  key={event.id}
                  title={event.event_type || "event"}
                  subtitle={`Drop #${event.mail_drop_id} • ${event.location_name || event.facility_type || "Network"}`}
                  right={<Badge tone={statusTone(event.status || event.event_type)}>{event.status || event.event_type || "event"}</Badge>}
                />
              ))
            )}
          </div>
        </SectionCard>

        <SectionCard title="Forecast Context" subtitle="What the modeled map is saying now.">
          <div className="vs-stack">
            {workspace.forecast?.snapshot ? (
              <div className="vs-card-muted">
                <div className="vs-stat-label">Latest Forecast Snapshot</div>
                <div style={{ marginTop: "0.5rem", fontSize: "0.92rem", color: "var(--vs-text)" }}>
                  Published:{" "}
                  {workspace.forecast.snapshot.published_at
                    ? new Date(workspace.forecast.snapshot.published_at).toLocaleString()
                    : "Not published"}
                </div>
                <div className="vs-grid-3" style={{ marginTop: "0.9rem" }}>
                  <div className="vs-card-muted" style={{ padding: "0.75rem" }}>Races: {workspace.forecast.snapshot.race_count ?? 0}</div>
                  <div className="vs-card-muted" style={{ padding: "0.75rem" }}>Toss-ups: {workspace.forecast.snapshot.tossup_count ?? 0}</div>
                  <div className="vs-card-muted" style={{ padding: "0.75rem" }}>High Confidence: {workspace.forecast.snapshot.high_confidence_count ?? 0}</div>
                </div>
              </div>
            ) : null}

            {loading ? (
              <EmptyState text="Loading forecast races..." />
            ) : !(workspace.forecast?.races || []).length ? (
              <EmptyState text="No forecast race context found." />
            ) : (
              (workspace.forecast.races || []).map((race) => (
                <CardListItem
                  key={race.id}
                  title={`${race.state || "State"} • ${race.office || "Race"}`}
                  subtitle={race.rating || race.category || "Competitive"}
                />
              ))
            )}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Activity Timeline" subtitle="Recent operational activity across the campaign.">
        <div className="vs-stack">
          {loading ? (
            <EmptyState text="Loading activity..." />
          ) : !(workspace.activity || []).length ? (
            <EmptyState text="No activity yet." />
          ) : (
            (workspace.activity || []).map((item) => {
              const details = item.details || item.metadata || {};
              const detailText = Object.entries(details)
                .filter(([k]) => k !== "timestamp")
                .map(([k, v]) => `${k}: ${String(v)}`)
                .join(" • ");

              return (
                <CardListItem
                  key={item.id}
                  title={String(item.activity_type || "").replaceAll("_", " ")}
                  subtitle={item.summary}
                  meta={`${item.created_at ? new Date(item.created_at).toLocaleString() : "Unknown"}${detailText ? ` • ${detailText}` : ""}`}
                />
              );
            })
          )}
        </div>
      </SectionCard>
    </PageShell>
  );
}
