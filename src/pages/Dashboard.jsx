import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

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

function StatCard({ label, value, delta, tone = "neutral" }) {
  const toneClass =
    tone === "up"
      ? "text-emerald-600"
      : tone === "down"
      ? "text-rose-600"
      : "text-slate-500";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
        {label}
      </div>
      <div className="mt-3 text-3xl font-semibold text-slate-900">{value}</div>
      <div className={`mt-2 text-sm ${toneClass}`}>{delta}</div>
    </div>
  );
}

function FeedItem({ item }) {
  const severityClass =
    String(item.severity || "").toLowerCase() === "high"
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : String(item.severity || "").toLowerCase() === "medium"
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="min-w-[56px] text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
        {item.time || "Now"}
      </div>

      <div className="flex-1">
        <div className="font-semibold text-slate-900">{item.title}</div>
        <div className="mt-1 text-sm text-slate-500">
          {item.source || "System"}
          {item.type ? ` • ${item.type}` : ""}
        </div>
      </div>

      <div className={`rounded-full border px-3 py-1 text-xs font-semibold ${severityClass}`}>
        {item.severity || "Info"}
      </div>
    </div>
  );
}

function LeaderboardRow({ row }) {
  return (
    <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[60px,1.6fr,1fr,1fr,1fr]">
      <div className="text-lg font-semibold text-slate-400">#{row.rank}</div>

      <div>
        <div className="font-semibold text-slate-900">{row.name}</div>
        <div className="mt-1 text-sm text-slate-500">
          {row.state || "N/A"} • {row.office || "Race"}
        </div>
      </div>

      <div>
        <div className="text-xs uppercase tracking-[0.14em] text-slate-500">Party</div>
        <div className="mt-1 text-sm text-slate-700">{row.party || "N/A"}</div>
      </div>

      <div>
        <div className="text-xs uppercase tracking-[0.14em] text-slate-500">Receipts</div>
        <div className="mt-1 text-sm font-semibold text-slate-900">
          {formatMoney(row.receipts || 0)}
        </div>
      </div>

      <div>
        <div className="text-xs uppercase tracking-[0.14em] text-slate-500">Cash on Hand</div>
        <div className="mt-1 text-sm font-semibold text-slate-900">
          {formatMoney(row.cash_on_hand || 0)}
        </div>
      </div>
    </div>
  );
}

const fallbackData = {
  metrics: [
    { label: "National Win Index", value: "61.8", delta: "+3.1 vs last cycle", tone: "up" },
    { label: "Fundraising Pulse", value: "$12.8M", delta: "+9.4% this period", tone: "up" },
    { label: "Active Threats", value: "4", delta: "2 require action", tone: "down" },
    { label: "Priority Vendors", value: "2", delta: "All active", tone: "up" }
  ],
  feed: [
    {
      id: 1,
      time: "08:12",
      title: "Opposition affordability attack accelerating",
      source: "War Room",
      severity: "High",
      type: "warroom.threat_detected"
    },
    {
      id: 2,
      time: "08:41",
      title: "Mail delay detected at Atlanta NDC",
      source: "Mail Intelligence",
      severity: "High",
      type: "mail.delay_detected"
    },
    {
      id: 3,
      time: "09:05",
      title: "Forecast updated for GA Senate",
      source: "Forecast Engine",
      severity: "Medium",
      type: "forecast.updated"
    }
  ],
  leaderboard: [
    {
      rank: 1,
      candidate_id: 1,
      name: "Mark Stephens",
      state: "Georgia",
      office: "Senate",
      party: "Democratic",
      receipts: 12850000,
      cash_on_hand: 6100000
    },
    {
      rank: 2,
      candidate_id: 2,
      name: "Jane Thompson",
      state: "Pennsylvania",
      office: "Senate",
      party: "Democratic",
      receipts: 11120000,
      cash_on_hand: 5400000
    }
  ],
  battlegrounds: [
    { race: "GA Senate", probability: "57%", momentum: "+2.4", risk: "Elevated", priority: "Tier 1" },
    { race: "PA Senate", probability: "54%", momentum: "+1.8", risk: "Watch", priority: "Tier 1" },
    { race: "AZ Senate", probability: "51%", momentum: "+1.1", risk: "Watch", priority: "Tier 2" }
  ],
  vendors: [
    {
      id: 1,
      vendor_name: "Precision Mail Group",
      category: "Direct Mail",
      status: "active",
      state: "Georgia",
      contract_value: 85000
    },
    {
      id: 2,
      vendor_name: "Capitol Digital Media",
      category: "Digital",
      status: "active",
      state: "Georgia",
      contract_value: 120000
    }
  ]
};

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [dashboardData, setDashboardData] = useState(fallbackData);
  const demoMode =
    typeof window !== "undefined" &&
    localStorage.getItem("vs_demo_mode") === "1";

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const [dashboardRes, fundraisingRes, vendorsRes] = await Promise.allSettled([
          api.get("/intelligence/dashboard", { timeout: 6000 }),
          api.get("/intelligence/fundraising/leaderboard", { timeout: 6000 }),
          api.get("/vendors", { timeout: 6000 })
        ]);

        if (!active) return;

        const dashboardPayload =
          dashboardRes.status === "fulfilled" ? dashboardRes.value?.data : null;

        const fundraisingPayload =
          fundraisingRes.status === "fulfilled" ? fundraisingRes.value?.data : null;

        const vendorsPayload =
          vendorsRes.status === "fulfilled" ? vendorsRes.value?.data : null;

        const leaderboard = fundraisingPayload?.leaderboard?.length
          ? fundraisingPayload.leaderboard
          : fallbackData.leaderboard;

        const vendors = vendorsPayload?.results?.length
          ? vendorsPayload.results
          : fallbackData.vendors;

        const feed = demoMode
          ? fallbackData.feed
          : fallbackData.feed;

        const metrics = dashboardPayload?.metrics?.length
          ? dashboardPayload.metrics
          : [
              {
                label: "Fundraising Leaders",
                value: String(leaderboard.length || 0),
                delta: "Live finance layer",
                tone: "up"
              },
              {
                label: "Receipts Modeled",
                value: formatMoney(
                  leaderboard.reduce((sum, row) => sum + Number(row.receipts || 0), 0)
                ),
                delta: "Tracked candidates",
                tone: "up"
              },
              {
                label: "Active Threats",
                value: "4",
                delta: "Demo threat layer",
                tone: "down"
              },
              {
                label: "Priority Vendors",
                value: String(vendors.length || 0),
                delta: "Operational partners",
                tone: "up"
              }
            ];

        setDashboardData({
          metrics,
          feed,
          leaderboard,
          battlegrounds: fallbackData.battlegrounds,
          vendors
        });
      } catch (err) {
        if (!active) return;
        setError(err?.response?.data?.error || err?.message || "Failed to load dashboard");
        setDashboardData(fallbackData);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, [demoMode]);

  const topVendors = useMemo(
    () => (dashboardData.vendors || []).slice(0, 3),
    [dashboardData.vendors]
  );

  return (
    <div className="min-h-screen bg-[#f3f6f9] p-6 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-xs uppercase tracking-[0.22em] text-[#0176D3]">
              VoterSpheres Executive Dashboard
            </div>

            {demoMode ? (
              <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                Demo Mode
              </span>
            ) : null}
          </div>

          <h1 className="mt-3 text-3xl font-semibold text-slate-900">
            Campaign command at a glance.
          </h1>

          <p className="mt-3 max-w-3xl text-sm text-slate-600">
            Track fundraising momentum, executive alerts, battleground pressure, and operational readiness from one view.
          </p>

          {demoMode ? (
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Demo campaign is live. Fundraising, alert activity, battleground movement, and vendors are preloaded for presentation.
            </div>
          ) : null}
        </section>

        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {(dashboardData.metrics || []).map((metric, index) => (
            <StatCard
              key={`${metric.label}-${index}`}
              label={metric.label}
              value={metric.value}
              delta={metric.delta}
              tone={metric.tone}
            />
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.25fr,1fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-xl font-semibold text-slate-900">Executive Feed</h2>
              <p className="mt-1 text-sm text-slate-500">
                Highest-priority campaign developments entering the system.
              </p>
            </div>

            <div className="space-y-3">
              {loading ? (
                <EmptyState text="Loading executive feed..." />
              ) : !(dashboardData.feed || []).length ? (
                <EmptyState text="No active executive feed items." />
              ) : (
                (dashboardData.feed || []).map((item) => (
                  <FeedItem key={item.id || `${item.time}-${item.title}`} item={item} />
                ))
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-xl font-semibold text-slate-900">Battleground Snapshot</h2>
              <p className="mt-1 text-sm text-slate-500">
                Top contested races requiring executive awareness.
              </p>
            </div>

            <div className="space-y-3">
              {loading ? (
                <EmptyState text="Loading battlegrounds..." />
              ) : !(dashboardData.battlegrounds || []).length ? (
                <EmptyState text="No battleground data available." />
              ) : (
                (dashboardData.battlegrounds || []).map((row) => (
                  <div
                    key={`${row.race}-${row.priority}`}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-slate-900">{row.race}</div>
                        <div className="mt-1 text-sm text-slate-500">
                          {row.risk} • {row.priority}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-lg font-semibold text-slate-900">
                          {row.probability}
                        </div>
                        <div
                          className={`mt-1 text-sm ${
                            String(row.momentum || "").startsWith("-")
                              ? "text-rose-600"
                              : "text-emerald-600"
                          }`}
                        >
                          {row.momentum}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.3fr,1fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-xl font-semibold text-slate-900">
                Fundraising Leaderboard
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Top candidates by receipts and reserve strength.
              </p>
            </div>

            <div className="space-y-3">
              {loading ? (
                <EmptyState text="Loading fundraising leaderboard..." />
              ) : !(dashboardData.leaderboard || []).length ? (
                <EmptyState text="No fundraising leaders available." />
              ) : (
                (dashboardData.leaderboard || []).map((row) => (
                  <LeaderboardRow
                    key={`${row.rank}-${row.candidate_id || row.name}`}
                    row={row}
                  />
                ))
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-xl font-semibold text-slate-900">Priority Vendors</h2>
              <p className="mt-1 text-sm text-slate-500">
                Operational partners supporting the campaign right now.
              </p>
            </div>

            <div className="space-y-3">
              {loading ? (
                <EmptyState text="Loading vendors..." />
              ) : !topVendors.length ? (
                <EmptyState text="No vendors available." />
              ) : (
                topVendors.map((vendor) => (
                  <div
                    key={`${vendor.id}-${vendor.vendor_name}`}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-slate-900">
                          {vendor.vendor_name}
                        </div>
                        <div className="mt-1 text-sm text-slate-500">
                          {vendor.category || "Vendor"} • {vendor.state || "N/A"}
                        </div>
                      </div>

                      <span className="rounded-full border border-[#0176D3]/20 bg-[#0176D3]/10 px-3 py-1 text-xs text-[#0176D3]">
                        {vendor.status || "active"}
                      </span>
                    </div>

                    <div className="mt-3 text-sm text-slate-700">
                      Contract: {formatMoney(vendor.contract_value || 0)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
