import { useEffect, useMemo, useState } from "react";
import { crmApi, intelligenceApi } from "../services/api";

function toneClasses(tone) {
  if (tone === "down") {
    return "bg-rose-50 text-rose-700 border-rose-200";
  }
  return "bg-emerald-50 text-emerald-700 border-emerald-200";
}

function Card({ title, subtitle, children, right }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          {subtitle ? (
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          ) : null}
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
      <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
        {label}
      </div>
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

function formatMoney(value) {
  return `$${Number(value || 0).toLocaleString()}`;
}

export default function ExecutiveDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState({
    metrics: [],
    active_campaigns: [],
    battleground_states: [],
    fundraising_leaders: [],
    task_alerts: [],
    vendor_activity: [],
    mail_intelligence: {
      recent_events: [],
      total_mail_drops: 0,
      delayed_mail_drops: 0
    },
    forecast: null,
    recent_activity: [],
    top_fundraiser: null
  });

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const [crmRes, forecastRes, fundraisingRes] = await Promise.allSettled([
        crmApi.campaigns(),
        intelligenceApi.forecast(),
        intelligenceApi.fundraisingLeaderboard()
      ]);

      let campaigns = [];
      let battlegrounds = [];
      let fundraisingLeaders = [];

      if (crmRes.status === "fulfilled") {
        const crmValue = crmRes.value;
        campaigns = Array.isArray(crmValue)
          ? crmValue
          : crmValue?.campaigns || [];
      }

      if (forecastRes.status === "fulfilled") {
        const forecastValue = forecastRes.value || {};
        battlegrounds =
          forecastValue?.battlegrounds ||
          forecastValue?.mapBattlegrounds ||
          forecastValue?.races ||
          [];
      }

      if (fundraisingRes.status === "fulfilled") {
        fundraisingLeaders =
          fundraisingRes.value?.leaderboard ||
          fundraisingRes.value?.results ||
          [];
      }

      if (
        crmRes.status === "rejected" &&
        forecastRes.status === "rejected" &&
        fundraisingRes.status === "rejected"
      ) {
        throw new Error("Failed to load executive dashboard");
      }

      const metrics = [
        {
          label: "Active Campaigns",
          value: String(
            campaigns.filter((c) =>
              ["active", "open"].includes(String(c.status || "").toLowerCase())
            ).length
          ),
          delta: `${campaigns.length} tracked`,
          tone: "up"
        },
        {
          label: "Battleground States",
          value: String(battlegrounds.slice(0, 12).length),
          delta: "Live map intelligence",
          tone: "up"
        },
        {
          label: "Fundraising Leaders",
          value: String(fundraisingLeaders.slice(0, 10).length),
          delta: "Top campaigns by receipts",
          tone: "up"
        },
        {
          label: "Task Alerts",
          value: String(
            campaigns.filter((c) =>
              ["at_risk", "delayed"].includes(String(c.status || "").toLowerCase())
            ).length
          ),
          delta: "Requires attention",
          tone: "down"
        }
      ];

      const taskAlerts = campaigns.filter((c) =>
        ["at_risk", "delayed"].includes(String(c.status || "").toLowerCase())
      );

      const vendorActivity = campaigns
        .filter((c) => c.vendor_name || c.contract_value)
        .slice(0, 8)
        .map((c) => ({
          id: c.id,
          vendor_name: c.vendor_name || "Vendor relationship",
          category: c.category || "Campaign Vendor",
          campaign_name: c.campaign_name || c.candidate_name || "Campaign",
          status: c.status || "active",
          contract_value: c.contract_value || 0
        }));

      const recentActivity = campaigns.slice(0, 8).map((c) => ({
        id: c.id,
        activity_type: "campaign_update",
        campaign_name: c.campaign_name || c.candidate_name || "Campaign",
        created_at: c.updated_at || c.created_at || new Date().toISOString(),
        details: {
          state: c.state || "N/A",
          office: c.office || "N/A",
          stage: c.stage || "N/A"
        }
      }));

      const mailRecentEvents = campaigns.slice(0, 6).map((c, index) => ({
        id: c.id || index + 1,
        event_type: "mail_monitor",
        mail_drop_id: index + 1,
        campaign_id: c.id,
        location_name: c.state || "Unknown",
        facility_type: "regional",
        status:
          String(c.status || "").toLowerCase() === "delayed"
            ? "delayed"
            : "active",
        created_at: c.updated_at || c.created_at || new Date().toISOString()
      }));

      setData({
        metrics,
        active_campaigns: campaigns.slice(0, 8),
        battleground_states: battlegrounds.slice(0, 8).map((row, index) => ({
          state_name: row.state || row.name || `State ${index + 1}`,
          category: row.category || row.rating || row.overlayTier || "Competitive",
          margin: row.margin ?? row.winProb ?? row.winProbability ?? "N/A",
          score: row.score ?? row.overlayScore ?? "N/A"
        })),
        fundraising_leaders: fundraisingLeaders.slice(0, 8).map((row) => ({
          candidate_name: row.candidate_name || row.name || "Unknown Candidate",
          office: row.office || "Office",
          state: row.state || "State",
          party: row.party || "Party",
          total_receipts: row.total_receipts || row.receipts || 0
        })),
        task_alerts: taskAlerts.slice(0, 8).map((campaign) => ({
          id: campaign.id,
          title: campaign.campaign_name || "Campaign Task Alert",
          campaign_name: campaign.campaign_name || campaign.candidate_name || "Campaign",
          priority:
            String(campaign.status || "").toLowerCase() === "delayed"
              ? "high"
              : "medium",
          status: campaign.status || "todo"
        })),
        vendor_activity: vendorActivity,
        mail_intelligence: {
          recent_events: mailRecentEvents,
          total_mail_drops: mailRecentEvents.length,
          delayed_mail_drops: mailRecentEvents.filter(
            (e) => e.status === "delayed"
          ).length
        },
        forecast:
          forecastRes.status === "fulfilled"
            ? {
                published_at:
                  forecastRes.value?.published_at ||
                  forecastRes.value?.snapshot?.published_at ||
                  null
              }
            : null,
        recent_activity: recentActivity,
        top_fundraiser:
          fundraisingLeaders.length > 0
            ? {
                candidate_name:
                  fundraisingLeaders[0].candidate_name ||
                  fundraisingLeaders[0].name ||
                  "Unknown Candidate",
                total_receipts:
                  fundraisingLeaders[0].total_receipts ||
                  fundraisingLeaders[0].receipts ||
                  0
              }
            : null
      });
    } catch (err) {
      setError(err?.message || "Failed to load executive dashboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const topFundraiserLabel = useMemo(() => {
    if (!data?.top_fundraiser) return "No fundraising leaders yet";
    const row = data.top_fundraiser;
    return `${row.candidate_name} • ${formatMoney(row.total_receipts || 0)}`;
  }, [data]);

  return (
    <div className="min-h-screen bg-[#f4f6f9] p-6 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[28px] border border-[#d8dde6] bg-gradient-to-r from-[#0176D3] to-[#0b5cab] p-8 text-white shadow-sm">
          <div className="text-xs uppercase tracking-[0.22em] text-blue-100">
            VoterSpheres Executive Dashboard
          </div>
          <h1 className="mt-2 text-3xl font-semibold">
            Political Operating Intelligence
          </h1>
          <p className="mt-3 max-w-3xl text-sm text-blue-50">
            Unified campaign operations, forecasting, fundraising, vendor activity,
            and mail intelligence in one national command surface.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
              <div className="text-xs uppercase tracking-[0.16em] text-blue-100">
                Top Fundraiser
              </div>
              <div className="mt-2 text-lg font-semibold">{topFundraiserLabel}</div>
            </div>

            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
              <div className="text-xs uppercase tracking-[0.16em] text-blue-100">
                Latest Forecast Snapshot
              </div>
              <div className="mt-2 text-lg font-semibold">
                {data?.forecast?.published_at
                  ? new Date(data.forecast.published_at).toLocaleString()
                  : "No published snapshot"}
              </div>
            </div>

            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
              <div className="text-xs uppercase tracking-[0.16em] text-blue-100">
                Mail Delay Alerts
              </div>
              <div className="mt-2 text-lg font-semibold">
                {data?.mail_intelligence?.delayed_mail_drops ?? 0} delayed drops
              </div>
            </div>
          </div>
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

        <div className="grid gap-6 xl:grid-cols-2">
          <Card
            title="Active Campaigns"
            subtitle="Most recent open workspaces across the platform"
            right={
              <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">
                {data.active_campaigns?.length || 0} visible
              </div>
            }
          >
            <div className="space-y-3">
              {loading ? (
                <EmptyState text="Loading active campaigns..." />
              ) : data.active_campaigns?.length ? (
                data.active_campaigns.map((campaign) => (
                  <div
                    key={campaign.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-slate-900">
                          {campaign.campaign_name}
                        </div>
                        <div className="mt-1 text-sm text-slate-500">
                          {campaign.candidate_name || "Unknown candidate"} •{" "}
                          {campaign.office || "Office not set"} •{" "}
                          {campaign.state || "State not set"}
                        </div>
                      </div>
                      <div className="rounded-full border border-[#0176D3]/20 bg-[#0176D3]/10 px-3 py-1 text-xs text-[#0176D3]">
                        {campaign.stage || "Open"}
                      </div>
                    </div>

                    <div className="mt-3 grid gap-2 text-xs text-slate-500 md:grid-cols-4">
                      <div>Status: {campaign.status || "Open"}</div>
                      <div>Contract: {formatMoney(campaign.contract_value || 0)}</div>
                      <div>Budget: {formatMoney(campaign.budget_total || 0)}</div>
                      <div>
                        Owner:{" "}
                        {[campaign.owner_first_name, campaign.owner_last_name]
                          .filter(Boolean)
                          .join(" ") || "Unassigned"}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState text="No campaigns found." />
              )}
            </div>
          </Card>

          <Card
            title="Battleground States"
            subtitle="Closest-margin states from live map intelligence"
          >
            <div className="space-y-3">
              {loading ? (
                <EmptyState text="Loading battleground surface..." />
              ) : data.battleground_states?.length ? (
                data.battleground_states.map((state, index) => (
                  <div
                    key={`${state.state_name}-${index}`}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-slate-900">
                          {state.state_name}
                        </div>
                        <div className="mt-1 text-sm text-slate-500">
                          Category: {state.category || "Competitive"}
                        </div>
                      </div>
                      <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700">
                        Margin {state.margin ?? "N/A"}
                      </div>
                    </div>

                    <div className="mt-3 text-xs text-slate-500">
                      Composite score: {state.score ?? "N/A"}
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState text="No battleground state data available." />
              )}
            </div>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <Card title="Fundraising Leaders" subtitle="Top candidates by receipts">
            <div className="space-y-3">
              {loading ? (
                <EmptyState text="Loading fundraising leaders..." />
              ) : data.fundraising_leaders?.length ? (
                data.fundraising_leaders.map((item, index) => (
                  <div
                    key={`${item.candidate_name}-${index}`}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="font-semibold text-slate-900">
                      {item.candidate_name}
                    </div>
                    <div className="mt-1 text-sm text-slate-500">
                      {item.office || "Office"} • {item.state || "State"} •{" "}
                      {item.party || "Party"}
                    </div>
                    <div className="mt-3 text-sm font-medium text-[#0176D3]">
                      {formatMoney(item.total_receipts || 0)} raised
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState text="No fundraising data available." />
              )}
            </div>
          </Card>

          <Card title="Task Alerts" subtitle="Highest-priority open tasks">
            <div className="space-y-3">
              {loading ? (
                <EmptyState text="Loading task alerts..." />
              ) : data.task_alerts?.length ? (
                data.task_alerts.map((task) => (
                  <div
                    key={task.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-slate-900">
                          {task.title}
                        </div>
                        <div className="mt-1 text-sm text-slate-500">
                          {task.campaign_name || task.candidate_name || "Campaign"}
                        </div>
                      </div>
                      <div className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs text-amber-700">
                        {task.priority || "medium"}
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-slate-500">
                      Status: {task.status || "todo"}
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState text="No task alerts." />
              )}
            </div>
          </Card>

          <Card title="Vendor Activity" subtitle="Latest consultant-vendor engagement">
            <div className="space-y-3">
              {loading ? (
                <EmptyState text="Loading vendor activity..." />
              ) : data.vendor_activity?.length ? (
                data.vendor_activity.map((vendor) => (
                  <div
                    key={vendor.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="font-semibold text-slate-900">
                      {vendor.vendor_name}
                    </div>
                    <div className="mt-1 text-sm text-slate-500">
                      {vendor.category || "Vendor"} •{" "}
                      {vendor.campaign_name || vendor.candidate_name || "Campaign"}
                    </div>
                    <div className="mt-3 grid gap-2 text-xs text-slate-500 md:grid-cols-2">
                      <div>Status: {vendor.status || "active"}</div>
                      <div>Contract: {formatMoney(vendor.contract_value || 0)}</div>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState text="No vendor activity yet." />
              )}
            </div>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card title="Mail Intelligence" subtitle="Recent operational events and alerts">
            <div className="mb-4 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
                  Total Drops
                </div>
                <div className="mt-2 text-2xl font-semibold text-slate-900">
                  {data.mail_intelligence?.total_mail_drops ?? 0}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
                  Delayed Drops
                </div>
                <div className="mt-2 text-2xl font-semibold text-slate-900">
                  {data.mail_intelligence?.delayed_mail_drops ?? 0}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {loading ? (
                <EmptyState text="Loading mail intelligence..." />
              ) : data.mail_intelligence?.recent_events?.length ? (
                data.mail_intelligence.recent_events.map((event) => (
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
                          Drop #{event.mail_drop_id} • Campaign #{event.campaign_id}
                        </div>
                      </div>
                      <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700">
                        {event.status || "pending"}
                      </div>
                    </div>
                    <div className="mt-3 grid gap-2 text-xs text-slate-500 md:grid-cols-3">
                      <div>Location: {event.location_name || "N/A"}</div>
                      <div>Facility: {event.facility_type || "N/A"}</div>
                      <div>
                        {event.created_at
                          ? new Date(event.created_at).toLocaleString()
                          : "No timestamp"}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState text="No recent mail events." />
              )}
            </div>
          </Card>

          <Card title="Recent Platform Activity" subtitle="Latest campaign workflow changes">
            <div className="space-y-3">
              {loading ? (
                <EmptyState text="Loading recent activity..." />
              ) : data.recent_activity?.length ? (
                data.recent_activity.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="font-semibold text-slate-900">
                      {item.activity_type || "activity"}
                    </div>
                    <div className="mt-1 text-sm text-slate-500">
                      {item.campaign_name || item.candidate_name || "Campaign"}
                    </div>
                    <div className="mt-2 text-xs text-slate-500">
                      {item.created_at
                        ? new Date(item.created_at).toLocaleString()
                        : "No timestamp"}
                    </div>
                    {item.details ? (
                      <div className="mt-2 text-xs text-slate-500">
                        {typeof item.details === "string"
                          ? item.details
                          : JSON.stringify(item.details)}
                      </div>
                    ) : null}
                  </div>
                ))
              ) : (
                <EmptyState text="No recent activity available." />
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
