import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";

function formatMoney(value) {
  return `$${Number(value || 0).toLocaleString()}`;
}

function FeedItem({ item }) {
  const tone =
    String(item.severity || "").toLowerCase() === "high"
      ? "danger"
      : String(item.severity || "").toLowerCase() === "medium"
      ? "demo"
      : "default";

  return (
    <div className="vs-card-muted">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "1rem",
          alignItems: "flex-start"
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, color: "var(--vs-text)" }}>{item.title}</div>
          <div
            style={{
              marginTop: "0.35rem",
              fontSize: "0.9rem",
              color: "var(--vs-text-muted)"
            }}
          >
            {item.source || "System"}
            {item.type ? ` • ${item.type}` : ""}
          </div>
        </div>

        <div style={{ textAlign: "right", display: "grid", gap: "0.5rem" }}>
          <div style={{ fontSize: "0.75rem", color: "var(--vs-text-muted)" }}>
            {item.time || "Now"}
          </div>
          <Badge tone={tone}>{item.severity || "Info"}</Badge>
        </div>
      </div>
    </div>
  );
}

function BattlegroundRow({ row }) {
  const momentumUp = !String(row.momentum || "").startsWith("-");

  return (
    <div className="vs-card-muted">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "1rem",
          alignItems: "flex-start"
        }}
      >
        <div>
          <div style={{ fontWeight: 700, color: "var(--vs-text)" }}>{row.race}</div>
          <div
            style={{
              marginTop: "0.35rem",
              fontSize: "0.9rem",
              color: "var(--vs-text-muted)"
            }}
          >
            {row.risk} • {row.priority}
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--vs-text)" }}>
            {row.probability}
          </div>
          <div
            className={momentumUp ? "vs-tone-up" : "vs-tone-down"}
            style={{ marginTop: "0.25rem", fontSize: "0.9rem", fontWeight: 600 }}
          >
            {row.momentum}
          </div>
        </div>
      </div>
    </div>
  );
}

function LeaderboardRow({ row }) {
  return (
    <div className="vs-card-muted">
      <div
        style={{
          display: "grid",
          gap: "1rem",
          gridTemplateColumns: "60px 1.6fr 1fr 1fr 1fr",
          alignItems: "start"
        }}
      >
        <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--vs-text-muted)" }}>
          #{row.rank}
        </div>

        <div>
          <div style={{ fontWeight: 700, color: "var(--vs-text)" }}>{row.name}</div>
          <div
            style={{
              marginTop: "0.35rem",
              fontSize: "0.9rem",
              color: "var(--vs-text-muted)"
            }}
          >
            {row.state || "N/A"} • {row.office || "Race"}
          </div>
        </div>

        <div>
          <div className="vs-stat-label">Party</div>
          <div style={{ marginTop: "0.35rem", fontSize: "0.9rem", color: "var(--vs-text)" }}>
            {row.party || "N/A"}
          </div>
        </div>

        <div>
          <div className="vs-stat-label">Receipts</div>
          <div style={{ marginTop: "0.35rem", fontSize: "0.95rem", fontWeight: 700 }}>
            {formatMoney(row.receipts || 0)}
          </div>
        </div>

        <div>
          <div className="vs-stat-label">Cash on Hand</div>
          <div style={{ marginTop: "0.35rem", fontSize: "0.95rem", fontWeight: 700 }}>
            {formatMoney(row.cash_on_hand || 0)}
          </div>
        </div>
      </div>
    </div>
  );
}

function VendorCard({ vendor }) {
  return (
    <div className="vs-card-muted">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "1rem",
          alignItems: "flex-start"
        }}
      >
        <div>
          <div style={{ fontWeight: 700, color: "var(--vs-text)" }}>{vendor.vendor_name}</div>
          <div
            style={{
              marginTop: "0.35rem",
              fontSize: "0.9rem",
              color: "var(--vs-text-muted)"
            }}
          >
            {vendor.category || "Vendor"} • {vendor.state || "N/A"}
          </div>
          <div
            style={{
              marginTop: "0.75rem",
              fontSize: "0.9rem",
              color: "var(--vs-text)"
            }}
          >
            Contract: {formatMoney(vendor.contract_value || 0)}
          </div>
        </div>

        <Badge tone="accent">{vendor.status || "active"}</Badge>
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

  const topVendors = useMemo(
    () => (dashboardData.vendors || []).slice(0, 3),
    [dashboardData.vendors]
  );

  return (
    <PageShell
      eyebrow="VoterSpheres Executive Dashboard"
      title="Campaign command at a glance."
      description="Track fundraising momentum, executive alerts, battleground pressure, and operational readiness from one view."
      demo={demoMode}
      demoText="Demo campaign is live. Fundraising, alert activity, battleground movement, and vendors are preloaded for presentation."
    >
      {error ? (
        <div className="vs-banner" style={{ borderColor: "#fecaca", background: "#fef2f2", color: "#b91c1c" }}>
          {error}
        </div>
      ) : null}

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

      <div className="vs-grid-2">
        <SectionCard
          title="Executive Feed"
          subtitle="Highest-priority campaign developments entering the system."
        >
          <div className="vs-stack">
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
        </SectionCard>

        <SectionCard
          title="Battleground Snapshot"
          subtitle="Top contested races requiring executive awareness."
        >
          <div className="vs-stack">
            {loading ? (
              <EmptyState text="Loading battlegrounds..." />
            ) : !(dashboardData.battlegrounds || []).length ? (
              <EmptyState text="No battleground data available." />
            ) : (
              (dashboardData.battlegrounds || []).map((row) => (
                <BattlegroundRow key={`${row.race}-${row.priority}`} row={row} />
              ))
            )}
          </div>
        </SectionCard>
      </div>

      <div className="vs-grid-2">
        <SectionCard
          title="Fundraising Leaderboard"
          subtitle="Top candidates by receipts and reserve strength."
        >
          <div className="vs-stack">
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
        </SectionCard>

        <SectionCard
          title="Priority Vendors"
          subtitle="Operational partners supporting the campaign right now."
        >
          <div className="vs-stack">
            {loading ? (
              <EmptyState text="Loading vendors..." />
            ) : !topVendors.length ? (
              <EmptyState text="No vendors available." />
            ) : (
              topVendors.map((vendor) => (
                <VendorCard
                  key={`${vendor.id}-${vendor.vendor_name}`}
                  vendor={vendor}
                />
              ))
            )}
          </div>
        </SectionCard>
      </div>
    </PageShell>
  );
}
