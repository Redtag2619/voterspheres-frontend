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

function formatMoneyCompact(value) {
  const number = Number(value || 0);
  if (number >= 1000000) return `$${(number / 1000000).toFixed(1)}M`;
  if (number >= 1000) return `$${(number / 1000).toFixed(1)}K`;
  return `$${number.toLocaleString()}`;
}

function StatCard({ label, value, subtext, tone = "neutral" }) {
  const toneClasses =
    tone === "up"
      ? "border-cyan-400/20 bg-cyan-500/10 text-cyan-300"
      : tone === "alert"
      ? "border-amber-400/20 bg-amber-500/10 text-amber-300"
      : "border-white/10 bg-[#111827] text-slate-300";

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0b1220] p-5 shadow-xl">
      <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
        {label}
      </div>
      <div className="mt-3 text-3xl font-semibold text-white">{value}</div>
      <div className={`mt-3 inline-flex rounded-full border px-3 py-1 text-xs ${toneClasses}`}>
        {subtext}
      </div>
    </div>
  );
}

function Section({ title, subtitle, children, right }) {
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

function CampaignRow({ campaign }) {
  return (
    <Link
      to={`/campaigns/${campaign.id}`}
      className="grid gap-3 rounded-2xl border border-white/10 bg-[#111827] p-4 transition hover:border-cyan-400/30 md:grid-cols-[1.6fr,1fr,1fr,1fr,auto]"
    >
      <div>
        <div className="font-semibold text-white">{campaign.campaign_name}</div>
        <div className="mt-1 text-sm text-slate-400">{campaign.candidate_name}</div>
      </div>

      <div className="text-sm text-slate-300">
        <div className="text-xs uppercase tracking-[0.14em] text-slate-500">
          Stage
        </div>
        <div className="mt-1">{campaign.stage || "N/A"}</div>
      </div>

      <div className="text-sm text-slate-300">
        <div className="text-xs uppercase tracking-[0.14em] text-slate-500">
          State
        </div>
        <div className="mt-1">{campaign.state || "N/A"}</div>
      </div>

      <div className="text-sm text-slate-300">
        <div className="text-xs uppercase tracking-[0.14em] text-slate-500">
          Contract
        </div>
        <div className="mt-1">{formatMoney(campaign.contract_value)}</div>
      </div>

      <div className="flex items-center">
        <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-300">
          Open
        </span>
      </div>
    </Link>
  );
}

function LeaderRow({ row, index }) {
  return (
    <div className="grid grid-cols-[auto,1fr,auto] gap-3 rounded-2xl border border-white/10 bg-[#111827] p-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-500/10 text-sm font-semibold text-cyan-300">
        {index + 1}
      </div>

      <div>
        <div className="font-semibold text-white">{row.name || "Unknown Candidate"}</div>
        <div className="mt-1 text-sm text-slate-400">
          {row.office || "Office N/A"} • {row.state || "State N/A"} • {row.party || "N/A"}
        </div>
      </div>

      <div className="text-right">
        <div className="text-sm font-semibold text-white">
          {formatMoneyCompact(row.receipts || 0)}
        </div>
        <div className="mt-1 text-xs text-slate-500">
          COH {formatMoneyCompact(row.cash_on_hand || 0)}
        </div>
      </div>
    </div>
  );
}

function BattlegroundRow({ row }) {
  return (
    <div className="grid gap-3 rounded-2xl border border-white/10 bg-[#111827] p-4 md:grid-cols-[1fr,auto,auto] md:items-center">
      <div>
        <div className="font-semibold text-white">{row.state || row.name || "Battleground"}</div>
        <div className="mt-1 text-sm text-slate-400">{row.note || "Published overlay active"}</div>
      </div>

      <div className="text-sm text-slate-300">
        <div className="text-xs uppercase tracking-[0.14em] text-slate-500">
          Tier
        </div>
        <div className="mt-1">{row.overlayTier || row.raceRating || "watch"}</div>
      </div>

      <div className="text-sm text-slate-300">
        <div className="text-xs uppercase tracking-[0.14em] text-slate-500">
          Funds
        </div>
        <div className="mt-1">{row.funds || formatMoneyCompact(row.totalReceipts || 0)}</div>
      </div>
    </div>
  );
}

function TaskRow({ task, campaignName }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111827] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold text-white">{task.title}</div>
          <div className="mt-1 text-sm text-slate-400">
            {campaignName || "Campaign"} • {task.status || "todo"}
          </div>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs ${
            task.priority === "high"
              ? "border border-amber-400/20 bg-amber-500/10 text-amber-300"
              : "border border-white/10 bg-[#0b1220] text-slate-300"
          }`}
        >
          {task.priority || "medium"}
        </span>
      </div>

      <div className="mt-3 text-xs text-slate-500">
        Due: {task.due_date || "No due date"}
      </div>
    </div>
  );
}

function VendorRow({ vendor, campaignName }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111827] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold text-white">{vendor.vendor_name}</div>
          <div className="mt-1 text-sm text-slate-400">
            {vendor.category || "Vendor"} • {campaignName || "Campaign"}
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
  );
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [campaigns, setCampaigns] = useState([]);
  const [forecast, setForecast] = useState({ metrics: [], races: [] });
  const [overlays, setOverlays] = useState({ battlegrounds: [] });
  const [fundraising, setFundraising] = useState({ leaderboard: [] });

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const [campaignsRes, forecastRes, overlaysRes, fundraisingRes] =
        await Promise.allSettled([
          apiRequest("/api/crm/campaigns"),
          apiRequest("/api/intelligence/forecast"),
          apiRequest("/api/forecast/overlays"),
          apiRequest("/api/intelligence/fundraising/leaderboard")
        ]);

      if (campaignsRes.status === "fulfilled") {
        setCampaigns(campaignsRes.value.results || []);
      }

      if (forecastRes.status === "fulfilled") {
        setForecast(forecastRes.value || { metrics: [], races: [] });
      }

      if (overlaysRes.status === "fulfilled") {
        setOverlays(overlaysRes.value || { battlegrounds: [] });
      }

      if (fundraisingRes.status === "fulfilled") {
        setFundraising(fundraisingRes.value || { leaderboard: [] });
      }

      const failedAll =
        campaignsRes.status === "rejected" &&
        forecastRes.status === "rejected" &&
        overlaysRes.status === "rejected" &&
        fundraisingRes.status === "rejected";

      if (failedAll) {
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

  const activeCampaigns = useMemo(
    () =>
      campaigns.filter(
        (campaign) =>
          String(campaign.status || "").toLowerCase() !== "closed" &&
          String(campaign.stage || "").toLowerCase() !== "post-election"
      ),
    [campaigns]
  );

  const pipelineRevenue = useMemo(
    () =>
      campaigns.reduce(
        (sum, campaign) => sum + Number(campaign.contract_value || 0),
        0
      ),
    [campaigns]
  );

  const taskAlerts = useMemo(() => {
    const rows = [];

    for (const campaign of campaigns.slice(0, 10)) {
      if (Array.isArray(campaign.tasks)) {
        for (const task of campaign.tasks) {
          if (task.status !== "done") {
            rows.push({
              ...task,
              campaignName: campaign.campaign_name
            });
          }
        }
      }
    }

    return rows.slice(0, 8);
  }, [campaigns]);

  const vendorActivity = useMemo(() => {
    const rows = [];

    for (const campaign of campaigns.slice(0, 10)) {
      if (Array.isArray(campaign.vendors)) {
        for (const vendor of campaign.vendors) {
          rows.push({
            ...vendor,
            campaignName: campaign.campaign_name
          });
        }
      }
    }

    return rows.slice(0, 8);
  }, [campaigns]);

  const topCampaigns = useMemo(() => campaigns.slice(0, 6), [campaigns]);
  const topBattlegrounds = useMemo(
    () => (overlays.battlegrounds || []).slice(0, 6),
    [overlays]
  );
  const fundraisingLeaders = useMemo(
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
                Political intelligence, CRM operations, revenue pipeline, and
                battleground activity in one control center.
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
          <StatCard
            label="Active Campaigns"
            value={activeCampaigns.length}
            subtext="Open workspaces"
            tone="up"
          />
          <StatCard
            label="Pipeline Revenue"
            value={formatMoneyCompact(pipelineRevenue)}
            subtext="Contracted + projected"
            tone="up"
          />
          <StatCard
            label="Battleground States"
            value={topBattlegrounds.length}
            subtext="Published overlays"
            tone="alert"
          />
          <StatCard
            label="Fundraising Leaders"
            value={fundraisingLeaders.length}
            subtext="Live leaderboard"
            tone="up"
          />
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
              ) : topCampaigns.length === 0 ? (
                <EmptyState text="No campaign workspaces yet." />
              ) : (
                topCampaigns.map((campaign) => (
                  <CampaignRow key={campaign.id} campaign={campaign} />
                ))
              )}
            </div>
          </Section>

          <Section
            title="Battleground States"
            subtitle="Latest published forecast overlays"
            right={
              <Link
                to="/forecast"
                className="text-sm text-cyan-300 hover:text-cyan-200"
              >
                View forecast
              </Link>
            }
          >
            <div className="space-y-3">
              {loading ? (
                <EmptyState text="Loading battleground overlays..." />
              ) : topBattlegrounds.length === 0 ? (
                <EmptyState text="No published battleground overlays yet." />
              ) : (
                topBattlegrounds.map((row, index) => (
                  <BattlegroundRow key={`${row.state}-${index}`} row={row} />
                ))
              )}
            </div>
          </Section>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Section
            title="Fundraising Leaders"
            subtitle="Top campaigns by receipts"
            right={
              <Link
                to="/forecast"
                className="text-sm text-cyan-300 hover:text-cyan-200"
              >
                Model details
              </Link>
            }
          >
            <div className="space-y-3">
              {loading ? (
                <EmptyState text="Loading fundraising leaderboard..." />
              ) : fundraisingLeaders.length === 0 ? (
                <EmptyState text="No fundraising leaderboard data yet." />
              ) : (
                fundraisingLeaders.map((row, index) => (
                  <LeaderRow key={`${row.candidate_id}-${index}`} row={row} index={index} />
                ))
              )}
            </div>
          </Section>

          <Section
            title="Task Alerts"
            subtitle="Open work that needs attention"
            right={
              <span className="rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1 text-xs text-amber-300">
                {taskAlerts.length} open alerts
              </span>
            }
          >
            <div className="space-y-3">
              {loading ? (
                <EmptyState text="Loading task alerts..." />
              ) : taskAlerts.length === 0 ? (
                <EmptyState text="No task alerts yet. Add tasks inside a campaign workspace." />
              ) : (
                taskAlerts.map((task, index) => (
                  <TaskRow
                    key={`${task.id || index}-${index}`}
                    task={task}
                    campaignName={task.campaignName}
                  />
                ))
              )}
            </div>
          </Section>
        </div>

        <Section
          title="Vendor Activity"
          subtitle="Recent campaign vendor relationships"
          right={
            <Link
              to="/firms"
              className="text-sm text-cyan-300 hover:text-cyan-200"
            >
              Open firms
            </Link>
          }
        >
          <div className="grid gap-3 md:grid-cols-2">
            {loading ? (
              <EmptyState text="Loading vendor activity..." />
            ) : vendorActivity.length === 0 ? (
              <EmptyState text="No vendor activity yet. Add vendors inside campaign workspaces." />
            ) : (
              vendorActivity.map((vendor, index) => (
                <VendorRow
                  key={`${vendor.id || index}-${index}`}
                  vendor={vendor}
                  campaignName={vendor.campaignName}
                />
              ))
            )}
          </div>
        </Section>

        <Section title="Platform Signals" subtitle="Live intelligence summary">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {(forecast.metrics || []).length === 0 ? (
              <div className="md:col-span-2 xl:col-span-4">
                <EmptyState text="No forecast metrics available yet." />
              </div>
            ) : (
              forecast.metrics.slice(0, 4).map((metric, index) => (
                <div
                  key={`${metric.label}-${index}`}
                  className="rounded-2xl border border-white/10 bg-[#111827] p-5"
                >
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
                    {metric.label}
                  </div>
                  <div className="mt-3 text-2xl font-semibold text-white">
                    {metric.value}
                  </div>
                  <div className="mt-2 text-sm text-slate-400">{metric.delta}</div>
                </div>
              ))
            )}
          </div>
        </Section>
      </div>
    </div>
  );
}
