import { useCallback, useEffect, useState } from "react"; 
import { api } from "../services/api";
import useLiveChannel from "../hooks/useLiveChannel";

function Card({ title, subtitle, children }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}

function EmptyState({ text }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
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

function formatCount(value) {
  return Number(value || 0).toLocaleString();
}

function formatHours(value) {
  return value === null || value === undefined || value === ""
    ? "N/A"
    : `${value}h`;
}

export default function MailOpsDashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [liveNotice, setLiveNotice] = useState("");

  const [dashboard, setDashboard] = useState({ metrics: [] });
  const [timeline, setTimeline] = useState([]);
  const [intelligence, setIntelligence] = useState({
    metrics: [],
    vendor_rankings: [],
    campaign_rankings: [],
    regional_heatmap: [],
    recent_drop_stats: []
  });

  const loadAll = useCallback(async (background = false) => {
    try {
      if (background) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const [dashboardRes, timelineRes, intelligenceRes] = await Promise.all([
        api.get("/mail/dashboard").then((r) => r.data),
        api.get("/mail/timeline").then((r) => r.data),
        api.get("/mail/intelligence/summary").then((r) => r.data)
      ]);

      setDashboard(
        dashboardRes && typeof dashboardRes === "object"
          ? dashboardRes
          : { metrics: [] }
      );

      setTimeline(Array.isArray(timelineRes) ? timelineRes : []);

      setIntelligence(
        intelligenceRes && typeof intelligenceRes === "object"
          ? {
              metrics: Array.isArray(intelligenceRes.metrics) ? intelligenceRes.metrics : [],
              vendor_rankings: Array.isArray(intelligenceRes.vendor_rankings) ? intelligenceRes.vendor_rankings : [],
              campaign_rankings: Array.isArray(intelligenceRes.campaign_rankings) ? intelligenceRes.campaign_rankings : [],
              regional_heatmap: Array.isArray(intelligenceRes.regional_heatmap) ? intelligenceRes.regional_heatmap : [],
              recent_drop_stats: Array.isArray(intelligenceRes.recent_drop_stats) ? intelligenceRes.recent_drop_stats : []
            }
          : {
              metrics: [],
              vendor_rankings: [],
              campaign_rankings: [],
              regional_heatmap: [],
              recent_drop_stats: []
            }
      );
    } catch (err) {
      setError(err?.message || "Failed to load MailOps intelligence");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAll(false);
  }, [loadAll]);

  useLiveChannel("mailops:alerts", (event) => {
    if (event?.type !== "mail.delay_detected") return;

    const payload = event.payload || {};

    setLiveNotice(
      `Live mail delay detected for campaign #${payload.campaignId || "N/A"} at ${payload.location || "Unknown location"}`
    );

    setTimeline((prev) => [
      {
        id: `live-${Date.now()}`,
        event_type: "delayed",
        mail_drop_id: payload.mailDropId || null,
        campaign_id: payload.campaignId || null,
        location_name: payload.location || "Unknown location",
        facility_type: "live_signal",
        notes: payload.note || "Live delay signal",
        source: "live_intelligence",
        status: payload.status || "delayed",
        created_at: new Date().toISOString()
      },
      ...prev
    ]);

    setTimeout(() => {
      loadAll(true);
    }, 600);
  });

  const metricCards =
    intelligence.metrics?.length > 0
      ? intelligence.metrics
      : dashboard.metrics?.length > 0
      ? dashboard.metrics
      : [];

  return (
    <div className="min-h-screen bg-[#f3f6f9] p-6 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.22em] text-[#0176D3]">
                VoterSpheres Mail Intelligence
              </div>
              <h1 className="mt-2 text-3xl font-semibold text-slate-900">
                MailOps + Intelligence
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Track delivery operations, evaluate vendors, surface delay risk, and benchmark campaign execution.
              </p>
            </div>

            <div className="rounded-full border border-[#0176D3]/20 bg-[#0176D3]/10 px-4 py-2 text-xs font-medium text-[#0176D3]">
              {refreshing ? "Refreshing live data..." : "Live monitoring active"}
            </div>
          </div>
        </div>

        {liveNotice ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {liveNotice}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metricCards.length > 0 ? (
            metricCards.map((metric, index) => (
              <StatCard
                key={`${metric.label || "metric"}-${index}`}
                label={metric.label || "Metric"}
                value={metric.value ?? "N/A"}
                subtext={metric.delta || metric.subtext || ""}
              />
            ))
          ) : (
            <>
              <StatCard label="MailOps Status" value={loading ? "Loading" : "Ready"} subtext="Shared API connected" />
              <StatCard label="Vendor Rankings" value={formatCount(intelligence.vendor_rankings?.length)} subtext="Tracked operators" />
              <StatCard label="Campaign Rankings" value={formatCount(intelligence.campaign_rankings?.length)} subtext="Tracked campaigns" />
              <StatCard label="Timeline Events" value={formatCount(timeline.length)} subtext="Recent tracking movement" />
            </>
          )}
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card title="Vendor Reliability" subtitle="Best-performing mail operators">
            <div className="space-y-3">
              {loading ? (
                <EmptyState text="Loading vendor intelligence..." />
              ) : intelligence.vendor_rankings?.length ? (
                intelligence.vendor_rankings.map((vendor, index) => (
                  <div
                    key={`${vendor.vendor_name || "vendor"}-${index}`}
                    className="rounded-2xl border border-slate-200 bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-slate-900">
                          {vendor.vendor_name || "Unknown Vendor"}
                        </div>
                        <div className="mt-1 text-sm text-slate-500">
                          {formatCount(vendor.drops_count)} drops • {vendor.delivered_rate ?? 0}% delivered
                        </div>
                      </div>
                      <span className="rounded-full border border-[#0176D3]/20 bg-[#0176D3]/10 px-3 py-1 text-xs text-[#0176D3]">
                        Score {vendor.reliability_score ?? "N/A"}
                      </span>
                    </div>

                    <div className="mt-3 grid gap-2 text-xs text-slate-500 md:grid-cols-3">
                      <div>Delayed: {vendor.delay_rate ?? 0}%</div>
                      <div>Avg Transit: {formatHours(vendor.avg_transit_hours)}</div>
                      <div>Median Transit: {formatHours(vendor.median_transit_hours)}</div>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState text="No vendor intelligence yet." />
              )}
            </div>
          </Card>

          <Card title="Campaign Mail Performance" subtitle="Which campaigns are executing best">
            <div className="space-y-3">
              {loading ? (
                <EmptyState text="Loading campaign intelligence..." />
              ) : intelligence.campaign_rankings?.length ? (
                intelligence.campaign_rankings.map((campaign, index) => (
                  <div
                    key={`${campaign.campaign_id || "campaign"}-${index}`}
                    className="rounded-2xl border border-slate-200 bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-slate-900">
                          Campaign #{campaign.campaign_id ?? "N/A"}
                        </div>
                        <div className="mt-1 text-sm text-slate-500">
                          {formatCount(campaign.drops_count)} drops • {formatCount(campaign.pieces_total)} pieces
                        </div>
                      </div>
                      <span className="rounded-full border border-[#0176D3]/20 bg-[#0176D3]/10 px-3 py-1 text-xs text-[#0176D3]">
                        Score {campaign.reliability_score ?? "N/A"}
                      </span>
                    </div>

                    <div className="mt-3 grid gap-2 text-xs text-slate-500 md:grid-cols-3">
                      <div>Delivered: {formatCount(campaign.delivered_count)}</div>
                      <div>Delayed: {formatCount(campaign.delayed_count)}</div>
                      <div>Avg Transit: {formatHours(campaign.avg_transit_hours)}</div>
                    </div>

                    {campaign.alerts?.length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {campaign.alerts.map((alert, alertIndex) => (
                          <span
                            key={`${campaign.campaign_id || "campaign"}-alert-${alertIndex}`}
                            className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs text-amber-700"
                          >
                            {alert}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))
              ) : (
                <EmptyState text="No campaign intelligence yet." />
              )}
            </div>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card title="Regional Heatmap" subtitle="Operational hotspots by facility and geography">
            <div className="space-y-3">
              {loading ? (
                <EmptyState text="Loading regional intelligence..." />
              ) : intelligence.regional_heatmap?.length ? (
                intelligence.regional_heatmap.map((region, index) => (
                  <div
                    key={`${region.region || "region"}-${index}`}
                    className="rounded-2xl border border-slate-200 bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-slate-900">
                          {region.region || "Unknown Region"}
                        </div>
                        <div className="mt-1 text-sm text-slate-500">
                          {formatCount(region.events)} total events
                        </div>
                      </div>
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700">
                        Delay {region.delay_rate ?? 0}%
                      </span>
                    </div>

                    <div className="mt-3 grid gap-2 text-xs text-slate-500 md:grid-cols-3">
                      <div>Entered: {formatCount(region.entered_events)}</div>
                      <div>Delivered: {formatCount(region.delivered_events)}</div>
                      <div>Delayed: {formatCount(region.delayed_events)}</div>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState text="No regional intelligence yet." />
              )}
            </div>
          </Card>

          <Card title="Recent Drop Intelligence" subtitle="Latest drop-level operational summaries">
            <div className="space-y-3">
              {loading ? (
                <EmptyState text="Loading drop intelligence..." />
              ) : intelligence.recent_drop_stats?.length ? (
                intelligence.recent_drop_stats.map((drop, index) => (
                  <div
                    key={`${drop.mail_drop_id || "drop"}-${index}`}
                    className="rounded-2xl border border-slate-200 bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-slate-900">
                          Drop #{drop.mail_drop_id ?? "N/A"}
                        </div>
                        <div className="mt-1 text-sm text-slate-500">
                          Campaign #{drop.campaign_id ?? "N/A"} • {formatCount(drop.quantity)} pieces
                        </div>
                      </div>
                      <span className="rounded-full border border-[#0176D3]/20 bg-[#0176D3]/10 px-3 py-1 text-xs text-[#0176D3]">
                        {drop.latest_status || "unknown"}
                      </span>
                    </div>

                    <div className="mt-3 grid gap-2 text-xs text-slate-500 md:grid-cols-3">
                      <div>Transit: {formatHours(drop.transit_hours)}</div>
                      <div>Processing: {formatHours(drop.processing_hours)}</div>
                      <div>Delayed Events: {formatCount(drop.delayed_count)}</div>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState text="No drop intelligence yet." />
              )}
            </div>
          </Card>
        </div>

        <Card title="Raw Tracking Timeline" subtitle="Recent mail movement events across the platform">
          <div className="space-y-3">
            {loading ? (
              <EmptyState text="Loading timeline..." />
            ) : timeline.length ? (
              timeline.map((event, index) => (
                <div
                  key={event.id || `${event.mail_drop_id || "event"}-${index}`}
                  className="rounded-2xl border border-slate-200 bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-slate-900">
                        {event.event_type || "event"}
                      </div>
                      <div className="mt-1 text-sm text-slate-500">
                        Drop #{event.mail_drop_id ?? "N/A"} • Campaign #{event.campaign_id ?? "N/A"}
                      </div>
                    </div>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700">
                      {event.status || "pending"}
                    </span>
                  </div>

                  <div className="mt-3 grid gap-2 text-xs text-slate-500 md:grid-cols-4">
                    <div>Location: {event.location_name || "N/A"}</div>
                    <div>Facility: {event.facility_type || "N/A"}</div>
                    <div>Source: {event.source || "manual"}</div>
                    <div>
                      Time: {event.created_at ? new Date(event.created_at).toLocaleString() : "N/A"}
                    </div>
                  </div>

                  {event.notes ? (
                    <div className="mt-2 text-xs text-slate-500">Notes: {event.notes}</div>
                  ) : null}
                </div>
              ))
            ) : (
              <EmptyState text="No tracking events yet." />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
