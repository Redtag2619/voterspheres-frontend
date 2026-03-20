import { useEffect, useState } from "react";

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

export default function MailOpsDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [dashboard, setDashboard] = useState({ metrics: [] });
  const [timeline, setTimeline] = useState([]);
  const [intelligence, setIntelligence] = useState({
    metrics: [],
    vendor_rankings: [],
    campaign_rankings: [],
    regional_heatmap: [],
    recent_drop_stats: []
  });

  async function loadAll() {
    try {
      setLoading(true);
      setError("");

      const [dashboardRes, timelineRes, intelligenceRes] = await Promise.all([
        apiRequest("/api/mail/dashboard"),
        apiRequest("/api/mail/timeline"),
        apiRequest("/api/mail/intelligence/summary")
      ]);

      setDashboard(dashboardRes || { metrics: [] });
      setTimeline(Array.isArray(timelineRes) ? timelineRes : []);
      setIntelligence(
        intelligenceRes || {
          metrics: [],
          vendor_rankings: [],
          campaign_rankings: [],
          regional_heatmap: [],
          recent_drop_stats: []
        }
      );
    } catch (err) {
      setError(err.message || "Failed to load MailOps intelligence");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  return (
    <div className="min-h-screen bg-[#f3f6f9] p-6 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
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

        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {(intelligence.metrics || []).map((metric, index) => (
            <StatCard
              key={`${metric.label}-${index}`}
              label={metric.label}
              value={metric.value}
              subtext={metric.delta}
            />
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card title="Vendor Reliability" subtitle="Best-performing mail operators">
            <div className="space-y-3">
              {loading ? (
                <EmptyState text="Loading vendor intelligence..." />
              ) : intelligence.vendor_rankings?.length ? (
                intelligence.vendor_rankings.map((vendor, index) => (
                  <div
                    key={`${vendor.vendor_name}-${index}`}
                    className="rounded-2xl border border-slate-200 bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-slate-900">
                          {vendor.vendor_name}
                        </div>
                        <div className="mt-1 text-sm text-slate-500">
                          {vendor.drops_count} drops • {vendor.delivered_rate}% delivered
                        </div>
                      </div>
                      <span className="rounded-full border border-[#0176D3]/20 bg-[#0176D3]/10 px-3 py-1 text-xs text-[#0176D3]">
                        Score {vendor.reliability_score}
                      </span>
                    </div>

                    <div className="mt-3 grid gap-2 text-xs text-slate-500 md:grid-cols-3">
                      <div>Delayed: {vendor.delay_rate}%</div>
                      <div>Avg Transit: {vendor.avg_transit_hours}h</div>
                      <div>Median Transit: {vendor.median_transit_hours}h</div>
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
                intelligence.campaign_rankings.map((campaign) => (
                  <div
                    key={campaign.campaign_id}
                    className="rounded-2xl border border-slate-200 bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-slate-900">
                          Campaign #{campaign.campaign_id}
                        </div>
                        <div className="mt-1 text-sm text-slate-500">
                          {campaign.drops_count} drops • {campaign.pieces_total.toLocaleString()} pieces
                        </div>
                      </div>
                      <span className="rounded-full border border-[#0176D3]/20 bg-[#0176D3]/10 px-3 py-1 text-xs text-[#0176D3]">
                        Score {campaign.reliability_score}
                      </span>
                    </div>

                    <div className="mt-3 grid gap-2 text-xs text-slate-500 md:grid-cols-3">
                      <div>Delivered: {campaign.delivered_count}</div>
                      <div>Delayed: {campaign.delayed_count}</div>
                      <div>Avg Transit: {campaign.avg_transit_hours}h</div>
                    </div>

                    {campaign.alerts?.length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {campaign.alerts.map((alert, index) => (
                          <span
                            key={`${campaign.campaign_id}-alert-${index}`}
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
                    key={`${region.region}-${index}`}
                    className="rounded-2xl border border-slate-200 bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-slate-900">{region.region}</div>
                        <div className="mt-1 text-sm text-slate-500">
                          {region.events} total events
                        </div>
                      </div>
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700">
                        Delay {region.delay_rate}%
                      </span>
                    </div>

                    <div className="mt-3 grid gap-2 text-xs text-slate-500 md:grid-cols-3">
                      <div>Entered: {region.entered_events}</div>
                      <div>Delivered: {region.delivered_events}</div>
                      <div>Delayed: {region.delayed_events}</div>
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
                intelligence.recent_drop_stats.map((drop) => (
                  <div
                    key={drop.mail_drop_id}
                    className="rounded-2xl border border-slate-200 bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-slate-900">
                          Drop #{drop.mail_drop_id}
                        </div>
                        <div className="mt-1 text-sm text-slate-500">
                          Campaign #{drop.campaign_id} • {drop.quantity.toLocaleString()} pieces
                        </div>
                      </div>
                      <span className="rounded-full border border-[#0176D3]/20 bg-[#0176D3]/10 px-3 py-1 text-xs text-[#0176D3]">
                        {drop.latest_status}
                      </span>
                    </div>

                    <div className="mt-3 grid gap-2 text-xs text-slate-500 md:grid-cols-3">
                      <div>Transit: {drop.transit_hours ?? "N/A"}h</div>
                      <div>Processing: {drop.processing_hours ?? "N/A"}h</div>
                      <div>Delayed Events: {drop.delayed_count}</div>
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
              timeline.map((event) => (
                <div
                  key={event.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4"
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
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700">
                      {event.status || "pending"}
                    </span>
                  </div>

                  <div className="mt-3 grid gap-2 text-xs text-slate-500 md:grid-cols-4">
                    <div>Location: {event.location_name || "N/A"}</div>
                    <div>Facility: {event.facility_type || "N/A"}</div>
                    <div>Source: {event.source || "manual"}</div>
                    <div>
                      Time:{" "}
                      {event.created_at ? new Date(event.created_at).toLocaleString() : "N/A"}
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
