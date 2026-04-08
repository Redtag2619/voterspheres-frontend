import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import ResponsiveRow from "../components/ui/ResponsiveRow";

function formatMoney(value) {
  return `$${Number(value || 0).toLocaleString()}`;
}

const fallbackData = {
  metrics: [
    { label: "Win Index", value: "61.8", delta: "+3.1 vs last cycle", tone: "up" },
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
  battlegrounds: [
    { race: "GA Senate", probability: "57%", momentum: "+2.4", risk: "Elevated", priority: "Tier 1" },
    { race: "PA Senate", probability: "54%", momentum: "+1.8", risk: "Watch", priority: "Tier 1" },
    { race: "AZ Senate", probability: "51%", momentum: "+1.1", risk: "Watch", priority: "Tier 2" }
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

function severityTone(value) {
  const v = String(value || "").toLowerCase();
  if (v === "high") return "danger";
  if (v === "medium") return "demo";
  return "default";
}

function ExecutiveFeedRow({ item }) {
  return (
    <ResponsiveRow
      title={item.title}
      subtitle={`${item.source}${item.type ? ` • ${item.type}` : ""}`}
      meta={[
        { label: "Time", value: item.time || "Now" },
        { label: "Severity", value: item.severity || "Info" }
      ]}
      alert={String(item.severity || "").toLowerCase() === "high" ? "vs-live-dot" : "vs-live-dot-warning"}
      right={<Badge tone={severityTone(item.severity)}>{item.severity}</Badge>}
    />
  );
}

function BattlegroundRow({ row }) {
  return (
    <ResponsiveRow
      title={row.race}
      subtitle="Top contested race requiring executive awareness."
      meta={[
        { label: "Win Prob.", value: row.probability },
        { label: "Momentum", value: row.momentum },
        { label: "Risk", value: row.risk },
        { label: "Priority", value: row.priority }
      ]}
      alert={String(row.risk || "").toLowerCase() === "elevated" ? "vs-live-dot" : "vs-live-dot-warning"}
      right={
        <Badge tone={String(row.risk || "").toLowerCase() === "elevated" ? "danger" : "demo"}>
          {row.risk}
        </Badge>
      }
    />
  );
}

function LeaderboardRow({ row }) {
  return (
    <ResponsiveRow
      title={row.name}
      subtitle={`${row.state || "N/A"} • ${row.office || "Race"}`}
      meta={[
        { label: "Rank", value: `#${row.rank}` },
        { label: "Party", value: row.party || "N/A" },
        { label: "Receipts", value: formatMoney(row.receipts || 0) },
        { label: "Cash", value: formatMoney(row.cash_on_hand || 0) }
      ]}
      alert="vs-live-dot-success"
      right={<Badge tone="accent">#{row.rank}</Badge>}
    />
  );
}

function VendorRow({ vendor }) {
  return (
    <ResponsiveRow
      title={vendor.vendor_name}
      subtitle={`${vendor.category || "Vendor"} • ${vendor.state || "N/A"}`}
      meta={[
        { label: "Status", value: vendor.status || "active" },
        { label: "Contract", value: formatMoney(vendor.contract_value || 0) }
      ]}
      alert="vs-live-dot-success"
      right={<Badge tone="active">{vendor.status || "active"}</Badge>}
    />
  );
}

function HeroFlagshipCard({ headline, value, delta, subline, tone = "up" }) {
  const toneColor =
    tone === "down"
      ? "#f87171"
      : tone === "up"
      ? "#4ade80"
      : "#95a2b3";

  return (
    <div
      className="vs-card"
      style={{
        minHeight: "220px",
        display: "grid",
        alignContent: "space-between",
        background: "linear-gradient(180deg, #151d27 0%, #10161d 100%)"
      }}
    >
      <div>
        <div className="vs-stat-label">{headline}</div>
        <div
          style={{
            marginTop: "12px",
            fontSize: "clamp(44px, 7vw, 72px)",
            lineHeight: 0.95,
            fontWeight: 900,
            letterSpacing: "-0.05em",
            color: "var(--vs-text)"
          }}
        >
          {value}
        </div>
        <div
          style={{
            marginTop: "12px",
            fontSize: "15px",
            fontWeight: 800,
            color: toneColor
          }}
        >
          {delta}
        </div>
      </div>

      <div
        style={{
          marginTop: "18px",
          fontSize: "14px",
          lineHeight: 1.7,
          color: "var(--vs-text-muted)",
          maxWidth: "720px"
        }}
      >
        {subline}
      </div>
    </div>
  );
}

function SecondaryRailCard({ label, value, subtext, badge, badgeTone = "accent", dotClass = "vs-live-dot-warning" }) {
  return (
    <div
      className="vs-card"
      style={{
        minHeight: "102px",
        display: "grid",
        gap: "10px",
        alignContent: "space-between"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span className={dotClass} />
          <div className="vs-stat-label">{label}</div>
        </div>
        <Badge tone={badgeTone}>{badge}</Badge>
      </div>

      <div>
        <div
          style={{
            fontSize: "28px",
            lineHeight: 1.05,
            fontWeight: 850,
            letterSpacing: "-0.03em"
          }}
        >
          {value}
        </div>
        <div
          style={{
            marginTop: "8px",
            fontSize: "13px",
            lineHeight: 1.6,
            color: "var(--vs-text-muted)"
          }}
        >
          {subtext}
        </div>
      </div>
    </div>
  );
}

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

        const metrics = dashboardPayload?.metrics?.length
          ? dashboardPayload.metrics
          : fallbackData.metrics;

        setDashboardData({
          metrics,
          feed: fallbackData.feed,
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
  }, []);

  const highSeverityCount = (dashboardData.feed || []).filter(
    (item) => String(item.severity || "").toLowerCase() === "high"
  ).length;

  const topVendors = useMemo(
    () => (dashboardData.vendors || []).slice(0, 3),
    [dashboardData.vendors]
  );

  const topBattleground = (dashboardData.battlegrounds || [])[0] || null;
  const topLeader = (dashboardData.leaderboard || [])[0] || null;

  const flagshipValue = topBattleground?.probability || dashboardData.metrics?.[0]?.value || "61.8";
  const flagshipDelta = topBattleground
    ? `${topBattleground.momentum} momentum • ${topBattleground.priority}`
    : dashboardData.metrics?.[0]?.delta || "+3.1 vs last cycle";

  return (
    <PageShell
      eyebrow="Executive Dashboard"
      title="Campaign command at a glance."
      description="A premium control center for leadership visibility across threats, battlegrounds, fundraising, and operations."
      demo={demoMode}
      demoText="Demo campaign is live. Fundraising, alert activity, battleground movement, and vendors are preloaded for presentation."
      tickerItems={[
        { label: "Threats", value: `${highSeverityCount} high`, dotClass: "vs-live-dot" },
        { label: "Battlegrounds", value: `${(dashboardData.battlegrounds || []).length} tracked`, dotClass: "vs-live-dot-warning" },
        { label: "Vendors", value: `${topVendors.length} active`, dotClass: "vs-live-dot-success" }
      ]}
    >
      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}

      <div
        style={{
          display: "grid",
          gap: "16px",
          gridTemplateColumns: "minmax(0, 1.45fr) minmax(320px, 0.75fr)"
        }}
      >
        <HeroFlagshipCard
          headline="Flagship KPI • Top Battleground Probability"
          value={flagshipValue}
          delta={flagshipDelta}
          tone="up"
          subline={
            topBattleground
              ? `${topBattleground.race} is currently the top executive race signal on the board, carrying ${topBattleground.risk.toLowerCase()} pressure and ${topBattleground.priority.toLowerCase()} priority.`
              : "The top modeled campaign probability is the flagship executive metric for this dashboard."
          }
        />

        <div style={{ display: "grid", gap: "16px" }}>
          <SecondaryRailCard
            label="Threat Pressure"
            value={highSeverityCount ? `${highSeverityCount} High` : "Contained"}
            subtext="Current threat environment across the live executive feed."
            badge={highSeverityCount ? "Escalated" : "Stable"}
            badgeTone={highSeverityCount ? "danger" : "active"}
            dotClass={highSeverityCount ? "vs-live-dot" : "vs-live-dot-success"}
          />

          <SecondaryRailCard
            label="Lead Fundraiser"
            value={topLeader ? topLeader.name : "No leader"}
            subtext={
              topLeader
                ? `${formatMoney(topLeader.receipts || 0)} receipts • ${formatMoney(
                    topLeader.cash_on_hand || 0
                  )} cash on hand`
                : "No fundraising leader available."
            }
            badge={topLeader ? `#${topLeader.rank}` : "N/A"}
            badgeTone="accent"
            dotClass="vs-live-dot-success"
          />
        </div>
      </div>

      <div className="vs-grid-4">
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

      <div
        style={{
          display: "grid",
          gap: "16px",
          gridTemplateColumns: "minmax(0, 1.35fr) minmax(320px, 0.65fr)"
        }}
      >
        <SectionCard
          title="Executive Feed"
          subtitle="Top developments leadership should see first."
          right={<Badge tone="danger">{highSeverityCount} high priority</Badge>}
        >
          <div className="vs-stack">
            {loading ? (
              <EmptyState text="Loading executive feed..." />
            ) : !(dashboardData.feed || []).length ? (
              <EmptyState text="No active executive feed items." />
            ) : (
              (dashboardData.feed || []).map((item) => (
                <ExecutiveFeedRow key={item.id || `${item.time}-${item.title}`} item={item} />
              ))
            )}
          </div>
        </SectionCard>

        <SectionCard title="Top Battlegrounds" subtitle="Highest-pressure races right now.">
          <div className="vs-stack">
            {loading ? (
              <EmptyState text="Loading battlegrounds..." />
            ) : !(dashboardData.battlegrounds || []).length ? (
              <EmptyState text="No battleground data available." />
            ) : (
              (dashboardData.battlegrounds || []).slice(0, 3).map((row) => (
                <BattlegroundRow key={`${row.race}-${row.priority}`} row={row} />
              ))
            )}
          </div>
        </SectionCard>
      </div>

      <div
        style={{
          display: "grid",
          gap: "16px",
          gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)"
        }}
      >
        <SectionCard
          title="Fundraising Leaders"
          subtitle="Top candidates by receipts and reserve strength."
          right={<Badge tone="info">{(dashboardData.leaderboard || []).length} tracked</Badge>}
        >
          <div className="vs-stack">
            {loading ? (
              <EmptyState text="Loading fundraising leaderboard..." />
            ) : !(dashboardData.leaderboard || []).length ? (
              <EmptyState text="No fundraising leaders available." />
            ) : (
              (dashboardData.leaderboard || []).map((row) => (
                <LeaderboardRow key={`${row.rank}-${row.candidate_id || row.name}`} row={row} />
              ))
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Operational Vendors"
          subtitle="Current campaign partners and readiness."
          right={<Badge tone="active">{topVendors.length} active</Badge>}
        >
          <div className="vs-stack">
            {loading ? (
              <EmptyState text="Loading vendors..." />
            ) : !topVendors.length ? (
              <EmptyState text="No vendors available." />
            ) : (
              topVendors.map((vendor) => (
                <VendorRow key={`${vendor.id}-${vendor.vendor_name}`} vendor={vendor} />
              ))
            )}
          </div>
        </SectionCard>
      </div>
    </PageShell>
  );
}
