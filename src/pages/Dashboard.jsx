import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

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

function formatMoney(value) {
  return `$${Number(value || 0).toLocaleString()}`;
}

function StatCard({ label, value, delta, tone = "up" }) {
  const toneClass =
    tone === "alert"
      ? "border-amber-400/20 bg-amber-500/10 text-amber-300"
      : "border-cyan-400/20 bg-cyan-500/10 text-cyan-300";

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0b1220] p-5 shadow-xl">
      <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
        {label}
      </div>
      <div className="mt-3 text-3xl font-semibold text-white">{value}</div>
      <div className={`mt-3 inline-flex rounded-full border px-3 py-1 text-xs ${toneClass}`}>
        {delta}
      </div>
    </div>
  );
}

function Section({ title, subtitle, right, children }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-[#0b1220] p-6 shadow-2xl">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          {subtitle ? (
            <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
          ) : null}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

function EmptyState({ text }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111827] p-5 text-sm text-slate-500">
      {text}
    </div>
  );
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [crmDashboard, setCrmDashboard] = useState({
    metrics: [],
    summary: {},
    stage_counts: [],
    active_campaigns: [],
    task_alerts: [],
    vendor_activity: [],
    recent_activity: []
  });

  const [forecastOverlays, setForecastOverlays] = useState({
    battlegrounds: []
  });

  const [fundraising, setFundraising] = useState({
    leaderboard: []
  });

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const [crmRes, overlaysRes, fundraisingRes] = await Promise.allSettled([
        apiRequest("/api/crm-dashboard/summary"),
        apiRequest("/api/forecast/overlays"),
        apiRequest("/api/intelligence/fundraising/leaderboard")
      ]);

      if (crmRes.status === "fulfilled") {
        setCrmDashboard(crmRes.value);
      }

      if (overlaysRes.status === "fulfilled") {
        setForecastOverlays(overlaysRes.value || { battlegrounds: [] });
      }

      if (fundraisingRes.status === "fulfilled") {
        setFundraising(fundraisingRes.value || { leaderboard: [] });
      }

      if (
        crmRes.status === "rejected" &&
        overlaysRes.status === "rejected" &&
        fundraisingRes.status === "rejected"
      ) {
        throw new Error("Failed to load dashboard data from backend");
      }
    } catch (err) {
      setError(err.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const topBattlegrounds = useMemo(
    () => (forecastOverlays.battlegrounds || []).slice(0, 6),
    [forecastOverlays]
  );

  const leaders = useMemo(
    () => (fundraising.leaderboard || []).slice(0, 6),
    [fundraising]
  );

  return (
    <div className="min-h-screen bg-[#060b14] p-6 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl border border-white/10 bg-[#0b1220] p-6 shadow-2xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.22em] text-cyan-300">
                VoterSpheres Command
              </div>
              <h1 className="mt-2 text-3xl font-semibold">Command Dashboard</h1>
              <p className="mt-2 text-sm text-slate-400">
                Campaign operations, political intelligence, revenue pipeline,
                and battleground activity in one platform.
              </p>
            </div>

            <div className="flex gap-3">
              <Link
                to="/campaigns"
                className="rounded-xl border border-white/10 bg-[#111827] px-5 py-3 text-sm text-slate-200 transition hover:border-cyan-400"
              >
                Open Pipeline
              </Link>
              <Link
                to="/election-map"
                className="rounded-xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
              >
                View Election Map
              </Link>
            </div>
          </div>
        </div>

        {error ? (
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {(crmDashboard.metrics || []).length ? (
            crmDashboard.metrics.slice(0, 4).map((metric, index) => (
              <StatCard
                key={`${metric.label}-${index}`}
                label={metric.label}
                value={metric.value}
                delta={metric.delta}
                tone={metric.tone}
              />
            ))
          ) : (
            <>
              <StatCard label="Active Campaigns" value="0" delta="No CRM data yet" />
              <StatCard label="Pipeline Revenue" value="$0" delta="No CRM data yet" />
              <StatCard label="Budget Tracked" value="$0" delta="No CRM data yet" />
              <StatCard label="Task Alerts" value="0" delta="No CRM data yet" tone="alert" />
            </>
          )}
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Section
            title="Active Campaigns"
            subtitle="Most recent campaign workspaces"
            right={
              <Link
                to="/campaigns"
                className="text-sm text-cyan-300 hover:text-cyan-200"
              >
                View all
              </Link>
            }
          >
            <div className="space-y-3">
              {loading ? (
                <EmptyState text="Loading active campaigns..." />
              ) : (crmDashboard.active_campaigns || []).length === 0 ? (
                <EmptyState text="No campaign workspaces yet." />
              ) : (
                crmDashboard.active_campaigns.map((campaign) => (
                  <Link
                    key={campaign.id}
                    to={`/campaigns/${campaign.id}`}
                    className="grid gap-3 rounded-2xl border border-white/10 bg-[#111827] p-4 transition hover:border-cyan-400/30 md:grid-cols-[1.6fr,1fr,1fr,auto]"
                  >
                    <div>
                      <div className="font-semibold text-white">
                        {campaign.campaign_name}
                      </div>
                      <div className="mt-1 text-sm text-slate-400">
                        {campaign.candidate_name}
                      </div>
                    </div>

                    <div className="text-sm text-slate-300">
                      <div className="text-xs uppercase tracking-[0.14em] text-slate-500">
                        Stage
                      </div>
                      <div className="mt-1">{campaign.stage || "N/A"}</div>
                    </div>

                    <div className="text-sm text-slate-300">
                      <div className="text-xs uppercase tracking-[0.14em] text-slate-500">
                        Contract
                      </div>
                      <div className="mt-1">{formatMoney(campaign.contract_value)}</div>
                    </div>

                    <div className="flex items-center">
                      <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-300">
                        {campaign.state || "N/A"}
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </Section>

          <Section
            title="Pipeline Stage Distribution"
            subtitle="Where campaign opportunities currently sit"
          >
            <div className="grid gap-3 md:grid-cols-2">
              {loading ? (
                <EmptyState text="Loading pipeline stages..." />
              ) : (crmDashboard.stage_counts || []).length === 0 ? (
                <EmptyState text="No pipeline stage data yet." />
              ) : (
                crmDashboard.stage_counts.map((row) => (
                  <div
                    key={row.stage}
                    className="rounded-2xl border border-white/10 bg-[#111827] p-4"
                  >
                    <div className="text-xs uppercase tracking-[0.14em] text-slate-500">
                      {row.stage}
                    </div>
                    <div className="mt-3 text-2xl font-semibold text-white">
                      {row.count}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Section>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Section title="Battleground States" subtitle="Latest published overlays">
            <div className="space-y-3">
              {loading ? (
                <EmptyState text="Loading battleground overlays..." />
              ) : topBattlegrounds.length === 0 ? (
                <EmptyState text="No battleground overlays yet." />
              ) : (
                topBattlegrounds.map((row, index) => (
                  <div
                    key={`${row.state}-${index}`}
                    className="grid gap-3 rounded-2xl border border-white/10 bg-[#111827] p-4 md:grid-cols-[1fr,auto,auto]"
                  >
                    <div>
                      <div className="font-semibold text-white">
                        {row.state || row.name || "Battleground"}
                      </div>
                      <div className="mt-1 text-sm text-slate-400">
                        {row.note || "Published overlay active"}
                      </div>
                    </div>
                    <div className="text-sm text-slate-300">
                      <div className="text-xs uppercase tracking-[0.14em] text-slate-500">
                        Tier
                      </div>
                      <div className="mt-1">{row.overlayTier || "watch"}</div>
                    </div>
                    <div className="text-sm text-slate-300">
                      <div className="text-xs uppercase tracking-[0.14em] text-slate-500">
                        Funds
                      </div>
                      <div className="mt-1">{row.funds || "$0"}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Section>

          <Section title="Fundraising Leaders" subtitle="Top campaigns by receipts">
            <div className="space-y-3">
              {loading ? (
                <EmptyState text="Loading fundraising leaders..." />
              ) : leaders.length === 0 ? (
                <EmptyState text="No fundraising leaderboard yet." />
              ) : (
                leaders.map((row, index) => (
                  <div
                    key={`${row.candidate_id}-${index}`}
                    className="grid grid-cols-[auto,1fr,auto] gap-3 rounded-2xl border border-white/10 bg-[#111827] p-4"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-500/10 text-sm font-semibold text-cyan-300">
                      {index + 1}
                    </div>

                    <div>
                      <div className="font-semibold text-white">
                        {row.name || "Unknown Candidate"}
                      </div>
                      <div className="mt-1 text-sm text-slate-400">
                        {row.office || "Office N/A"} • {row.state || "State N/A"}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-semibold text-white">
                        {formatMoney(row.receipts || 0)}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        COH {formatMoney(row.cash_on_hand || 0)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Section>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Section
            title="Task Alerts"
            subtitle="Open work requiring attention"
            right={
              <span className="rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1 text-xs text-amber-300">
                {(crmDashboard.task_alerts || []).length} open
              </span>
            }
          >
            <div className="space-y-3">
              {loading ? (
                <EmptyState text="Loading task alerts..." />
              ) : (crmDashboard.task_alerts || []).length === 0 ? (
                <EmptyState text="No task alerts yet." />
              ) : (
                crmDashboard.task_alerts.map((task) => (
                  <div
                    key={task.id}
                    className="rounded-2xl border border-white/10 bg-[#111827] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-white">{task.title}</div>
                        <div className="mt-1 text-sm text-slate-400">
                          {task.campaign_name} • {task.status}
                        </div>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs ${
                          task.priority === "high"
                            ? "border border-amber-400/20 bg-amber-500/10 text-amber-300"
                            : "border border-white/10 bg-[#0b1220] text-slate-300"
                        }`}
                      >
                        {task.priority}
                      </span>
                    </div>

                    <div className="mt-3 text-xs text-slate-500">
                      Due: {task.due_date || "No due date"}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Section>

          <Section title="Vendor Activity" subtitle="Recent vendor relationships">
            <div className="space-y-3">
              {loading ? (
                <EmptyState text="Loading vendor activity..." />
              ) : (crmDashboard.vendor_activity || []).length === 0 ? (
                <EmptyState text="No vendor activity yet." />
              ) : (
                crmDashboard.vendor_activity.map((vendor) => (
                  <div
                    key={vendor.id}
                    className="rounded-2xl border border-white/10 bg-[#111827] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-white">
                          {vendor.vendor_name}
                        </div>
                        <div className="mt-1 text-sm text-slate-400">
                          {vendor.category || "Vendor"} • {vendor.campaign_name}
                        </div>
                      </div>

                      <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-300">
                        {vendor.status || "prospect"}
                      </span>
                    </div>

                    <div className="mt-3 text-xs text-slate-500">
                      Contract: {formatMoney(vendor.contract_value || 0)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Section>
        </div>

        <Section title="Recent Activity" subtitle="Latest CRM events across campaigns">
          <div className="space-y-3">
            {loading ? (
              <EmptyState text="Loading recent activity..." />
            ) : (crmDashboard.recent_activity || []).length === 0 ? (
              <EmptyState text="No recent activity yet." />
            ) : (
              crmDashboard.recent_activity.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-white/10 bg-[#111827] p-4"
                >
                  <div className="font-medium text-white">{item.summary}</div>
                  <div className="mt-1 text-sm text-slate-400">
                    {item.campaign_name} • {item.activity_type}
                  </div>
                  <div className="mt-2 text-xs text-slate-500">
                    {item.created_at
                      ? new Date(item.created_at).toLocaleString()
                      : "N/A"}
                  </div>
                </div>
              ))
            )}
          </div>
        </Section>
      </div>
    </div>
  );
}
