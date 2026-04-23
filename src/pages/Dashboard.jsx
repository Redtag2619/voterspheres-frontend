import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import { useExecutiveFilters } from "../context/ExecutiveFiltersContext.jsx";

function formatMoney(value) {
  return `$${Number(value || 0).toLocaleString()}`;
}

function formatDateTime(value) {
  if (!value) return "Not synced yet";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not synced yet";

  return date.toLocaleString();
}

const fallbackData = {
  metrics: [
    { label: "Win Index", value: "61.8", delta: "+3.1 vs last cycle", tone: "up" },
    { label: "Fundraising Pulse", value: "$12.8M", delta: "+9.4% this period", tone: "up" },
    { label: "Active Threats", value: "4", delta: "2 require action", tone: "down" },
    { label: "Priority Vendors", value: "2", delta: "All active", tone: "up" }
  ],
  feed: [],
  battlegrounds: [],
  leaderboard: [],
  vendors: [],
  fundraisingSummary: null
};

function severityTone(value) {
  const v = String(value || "").toLowerCase();
  if (v === "high") return "danger";
  if (v === "medium") return "demo";
  return "default";
}

function riskTone(value) {
  const v = String(value || "").toLowerCase();
  if (v === "elevated" || v === "high") return "danger";
  if (v === "watch") return "demo";
  if (v === "monitor") return "info";
  return "default";
}

function statusTone(value) {
  const v = String(value || "").toLowerCase();
  if (v === "active") return "active";
  if (v === "delayed" || v === "blocked") return "danger";
  if (v === "watch") return "demo";
  return "default";
}

function ExecutiveFeedCard({ item }) {
  const isHigh = String(item?.severity || "").toLowerCase() === "high";

  return (
    <div
      className="vs-card"
      style={{
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        minHeight: "238px"
      }}
    >
      <div style={{ minHeight: "50px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <span className={isHigh ? "vs-live-dot" : "vs-live-dot-warning"} />
          <div
            style={{
              fontSize: "16px",
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
              color: "var(--vs-text)"
            }}
          >
            {item.title}
          </div>
        </div>

        <div
          style={{
            marginTop: "6px",
            fontSize: "12px",
            lineHeight: 1.45,
            color: "var(--vs-text-muted)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis"
          }}
          title={[item.source, item.type, item.state, item.office].filter(Boolean).join(" • ")}
        >
          {[item.source, item.type, item.state, item.office].filter(Boolean).join(" • ")}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: "12px 18px",
          marginTop: "14px",
          minHeight: "98px",
          alignContent: "start"
        }}
      >
        <div>
          <div className="vs-stat-label">Time</div>
          <div style={{ marginTop: "4px", fontSize: "16px", fontWeight: 800, lineHeight: 1.15 }}>
            {item.time || "Now"}
          </div>
        </div>

        <div>
          <div className="vs-stat-label">Severity</div>
          <div style={{ marginTop: "4px", fontSize: "13px", fontWeight: 700, lineHeight: 1.2 }}>
            {item.severity || "Info"}
          </div>
        </div>

        <div>
          <div className="vs-stat-label">State</div>
          <div style={{ marginTop: "4px", fontSize: "13px", fontWeight: 700, lineHeight: 1.2 }}>
            {item.state || "National"}
          </div>
        </div>

        <div>
          <div className="vs-stat-label">Risk</div>
          <div style={{ marginTop: "4px", fontSize: "13px", fontWeight: 700, lineHeight: 1.2 }}>
            {item.risk || "Monitor"}
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: "auto",
          paddingTop: "14px",
          display: "flex",
          justifyContent: "space-between",
          gap: "10px",
          flexWrap: "wrap"
        }}
      >
        <Badge tone={severityTone(item.severity)}>{item.severity || "Info"}</Badge>
        <Badge tone={riskTone(item.risk)}>{item.risk || "Monitor"}</Badge>
      </div>
    </div>
  );
}

function BattlegroundCard({ row, onOpenIntelligence }) {
  const candidateName = row.candidate || row.race;

  return (
    <div
      className="vs-card"
      style={{
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        minHeight: "252px"
      }}
    >
      <div style={{ minHeight: "56px" }}>
        <div style={{ fontSize: "16px", fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.02em", color: "var(--vs-text)" }}>
          {row.race}
        </div>

        <div
          style={{
            marginTop: "6px",
            fontSize: "12px",
            lineHeight: 1.45,
            color: "var(--vs-text-muted)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis"
          }}
          title={`${row.state} • ${row.office}`}
        >
          {row.state} • {row.office}
        </div>
      </div>

      <div className="vs-card-muted" style={{ marginTop: "12px", padding: "10px 12px" }}>
        <div className="vs-stat-label">Candidate Intelligence Focus</div>
        <div style={{ marginTop: "4px", fontSize: "14px", fontWeight: 800, color: "var(--vs-text)" }}>
          {candidateName}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: "12px 18px",
          marginTop: "14px",
          minHeight: "98px",
          alignContent: "start"
        }}
      >
        <div>
          <div className="vs-stat-label">Win Prob.</div>
          <div style={{ marginTop: "4px", fontSize: "18px", fontWeight: 800, lineHeight: 1.1 }}>
            {row.probability}
          </div>
        </div>

        <div>
          <div className="vs-stat-label">Momentum</div>
          <div style={{ marginTop: "4px", fontSize: "18px", fontWeight: 800, lineHeight: 1.1 }}>
            {row.momentum}
          </div>
        </div>

        <div>
          <div className="vs-stat-label">Risk</div>
          <div style={{ marginTop: "4px", fontSize: "13px", fontWeight: 700, lineHeight: 1.2 }}>
            {row.risk}
          </div>
        </div>

        <div>
          <div className="vs-stat-label">Priority</div>
          <div style={{ marginTop: "4px", fontSize: "13px", fontWeight: 700, lineHeight: 1.2 }}>
            {row.priority}
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: "auto",
          paddingTop: "14px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "10px",
          flexWrap: "wrap"
        }}
      >
        <Badge tone={riskTone(row.risk)}>{row.risk}</Badge>
        <button
          type="button"
          className="vs-button vs-button-secondary"
          onClick={() => onOpenIntelligence(row)}
        >
          Open Intelligence
        </button>
      </div>
    </div>
  );
}

function FundraisingLeaderCard({ row }) {
  return (
    <div
      className="vs-card"
      style={{
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        minHeight: "238px"
      }}
    >
      <div style={{ minHeight: "50px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <div style={{ fontSize: "16px", fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.02em", color: "var(--vs-text)" }}>
            {row.name}
          </div>
          <Badge tone="accent">#{row.rank}</Badge>
        </div>

        <div
          style={{
            marginTop: "6px",
            fontSize: "12px",
            lineHeight: 1.45,
            color: "var(--vs-text-muted)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis"
          }}
          title={`${row.state} • ${row.office} • ${row.party || "N/A"}`}
        >
          {row.state} • {row.office} • {row.party || "N/A"}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: "12px 18px",
          marginTop: "14px",
          minHeight: "98px",
          alignContent: "start"
        }}
      >
        <div>
          <div className="vs-stat-label">Receipts</div>
          <div style={{ marginTop: "4px", fontSize: "16px", fontWeight: 800, lineHeight: 1.15 }}>
            {formatMoney(row.receipts || 0)}
          </div>
        </div>

        <div>
          <div className="vs-stat-label">Cash</div>
          <div style={{ marginTop: "4px", fontSize: "16px", fontWeight: 800, lineHeight: 1.15 }}>
            {formatMoney(row.cash_on_hand || 0)}
          </div>
        </div>

        <div>
          <div className="vs-stat-label">State</div>
          <div style={{ marginTop: "4px", fontSize: "13px", fontWeight: 700, lineHeight: 1.2 }}>
            {row.state}
          </div>
        </div>

        <div>
          <div className="vs-stat-label">Office</div>
          <div style={{ marginTop: "4px", fontSize: "13px", fontWeight: 700, lineHeight: 1.2 }}>
            {row.office}
          </div>
        </div>
      </div>

      <div style={{ marginTop: "auto", paddingTop: "14px", display: "flex", justifyContent: "flex-start" }}>
        <Badge tone={riskTone(row.risk)}>{row.risk || "Monitor"}</Badge>
      </div>
    </div>
  );
}

function VendorCard({ vendor }) {
  return (
    <div
      className="vs-card"
      style={{
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        minHeight: "238px"
      }}
    >
      <div style={{ minHeight: "50px" }}>
        <div style={{ fontSize: "16px", fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.02em", color: "var(--vs-text)" }}>
          {vendor.vendor_name}
        </div>

        <div
          style={{
            marginTop: "6px",
            fontSize: "12px",
            lineHeight: 1.45,
            color: "var(--vs-text-muted)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis"
          }}
          title={`${vendor.category || "Vendor"} • ${vendor.state || "N/A"} • ${vendor.office || "N/A"}`}
        >
          {vendor.category || "Vendor"} • {vendor.state || "N/A"} • {vendor.office || "N/A"}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: "12px 18px",
          marginTop: "14px",
          minHeight: "98px",
          alignContent: "start"
        }}
      >
        <div>
          <div className="vs-stat-label">Contract</div>
          <div style={{ marginTop: "4px", fontSize: "16px", fontWeight: 800, lineHeight: 1.15 }}>
            {formatMoney(vendor.contract_value || 0)}
          </div>
        </div>

        <div>
          <div className="vs-stat-label">Status</div>
          <div style={{ marginTop: "4px", fontSize: "13px", fontWeight: 700, lineHeight: 1.2 }}>
            {vendor.status || "active"}
          </div>
        </div>

        <div>
          <div className="vs-stat-label">State</div>
          <div style={{ marginTop: "4px", fontSize: "13px", fontWeight: 700, lineHeight: 1.2 }}>
            {vendor.state || "N/A"}
          </div>
        </div>

        <div>
          <div className="vs-stat-label">Office</div>
          <div style={{ marginTop: "4px", fontSize: "13px", fontWeight: 700, lineHeight: 1.2 }}>
            {vendor.office || "N/A"}
          </div>
        </div>
      </div>

      <div style={{ marginTop: "auto", paddingTop: "14px", display: "flex", justifyContent: "space-between", gap: "10px", flexWrap: "wrap" }}>
        <Badge tone={statusTone(vendor.status)}>{vendor.status || "active"}</Badge>
        <Badge tone={riskTone(vendor.risk)}>{vendor.risk || "Monitor"}</Badge>
      </div>
    </div>
  );
}

function HeroFlagshipCard({ headline, value, delta, subline, tone = "up" }) {
  const toneColor =
    tone === "down" ? "#f87171" :
    tone === "up" ? "#4ade80" :
    "#95a2b3";

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
        <div style={{ marginTop: "12px", fontSize: "clamp(42px, 6vw, 68px)", lineHeight: 0.95, fontWeight: 900, letterSpacing: "-0.05em", color: "var(--vs-text)" }}>
          {value}
        </div>
        <div style={{ marginTop: "12px", fontSize: "14px", fontWeight: 800, color: toneColor }}>
          {delta}
        </div>
      </div>

      <div style={{ marginTop: "18px", fontSize: "13px", lineHeight: 1.65, color: "var(--vs-text-muted)", maxWidth: "720px" }}>
        {subline}
      </div>
    </div>
  );
}

function SecondaryRailCard({ label, value, subtext, badge, badgeTone = "accent", dotClass = "vs-live-dot-warning" }) {
  return (
    <div className="vs-card" style={{ minHeight: "102px", display: "grid", gap: "10px", alignContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span className={dotClass} />
          <div className="vs-stat-label">{label}</div>
        </div>
        <Badge tone={badgeTone}>{badge}</Badge>
      </div>

      <div>
        <div style={{ fontSize: "24px", lineHeight: 1.05, fontWeight: 850, letterSpacing: "-0.03em" }}>
          {value}
        </div>
        <div style={{ marginTop: "8px", fontSize: "12px", lineHeight: 1.55, color: "var(--vs-text-muted)" }}>
          {subtext}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dashboardData, setDashboardData] = useState(fallbackData);
  const { filters, setFilters, clearFilters } = useExecutiveFilters();

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
          api.get("/intelligence/dashboard", { timeout: 8000 }),
          api.get("/intelligence/fundraising/leaderboard", { timeout: 8000 }),
          api.get("/vendors", { timeout: 8000 })
        ]);

        if (!active) return;

        const dashboardPayload = dashboardRes.status === "fulfilled" ? dashboardRes.value?.data : null;
        const fundraisingPayload = fundraisingRes.status === "fulfilled" ? fundraisingRes.value?.data : null;
        const vendorsPayload = vendorsRes.status === "fulfilled" ? vendorsRes.value?.data : null;

        const fundraisingSummary = fundraisingPayload?.summary || null;
        const leaderboard = Array.isArray(fundraisingPayload?.leaderboard) ? fundraisingPayload.leaderboard : [];
        const vendors = Array.isArray(vendorsPayload?.results) ? vendorsPayload.results : [];
        const metrics = Array.isArray(dashboardPayload?.metrics) ? dashboardPayload.metrics : fallbackData.metrics;
        const feed = Array.isArray(dashboardPayload?.feed) ? dashboardPayload.feed : [];
        const battlegrounds = Array.isArray(dashboardPayload?.battlegrounds) ? dashboardPayload.battlegrounds : [];

        setDashboardData({
          metrics,
          feed,
          battlegrounds,
          leaderboard,
          vendors,
          fundraisingSummary
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

  const allRecords = useMemo(
    () => [
      ...(dashboardData.feed || []),
      ...(dashboardData.battlegrounds || []),
      ...(dashboardData.leaderboard || []),
      ...(dashboardData.vendors || [])
    ],
    [dashboardData]
  );

  const stateOptions = useMemo(() => {
    return Array.from(new Set(allRecords.map((item) => item?.state).filter(Boolean))).sort();
  }, [allRecords]);

  const officeOptions = useMemo(() => {
    return Array.from(new Set(allRecords.map((item) => item?.office).filter(Boolean))).sort();
  }, [allRecords]);

  const riskOptions = useMemo(() => {
    return Array.from(new Set(allRecords.map((item) => item?.risk).filter(Boolean))).sort();
  }, [allRecords]);

  const matchesFilters = (item) => {
    if (!item) return false;
    if (filters.state && item.state !== filters.state) return false;
    if (filters.office && item.office !== filters.office) return false;
    if (filters.risk && item.risk !== filters.risk) return false;
    return true;
  };

  const filteredFeed = useMemo(() => (dashboardData.feed || []).filter(matchesFilters), [dashboardData.feed, filters]);
  const filteredBattlegrounds = useMemo(() => (dashboardData.battlegrounds || []).filter(matchesFilters), [dashboardData.battlegrounds, filters]);
  const filteredLeaderboard = useMemo(() => (dashboardData.leaderboard || []).filter(matchesFilters), [dashboardData.leaderboard, filters]);
  const filteredVendors = useMemo(() => (dashboardData.vendors || []).filter(matchesFilters), [dashboardData.vendors, filters]);

  const highSeverityCount = filteredFeed.filter(
    (item) => String(item.severity || "").toLowerCase() === "high"
  ).length;

  const topBattleground = filteredBattlegrounds[0] || null;
  const topLeader = filteredLeaderboard[0] || null;
  const topVendors = filteredVendors.slice(0, 3);

  const flagshipValue = topBattleground?.probability || dashboardData.metrics?.[0]?.value || "61.8";
  const flagshipDelta = topBattleground
    ? `${topBattleground.momentum} momentum • ${topBattleground.priority}`
    : dashboardData.metrics?.[0]?.delta || "+3.1 vs last cycle";

  function openCandidateIntelligence(row) {
    const params = new URLSearchParams();

    if (row?.candidate) params.set("q", row.candidate);
    if (row?.state_code) {
      params.set("state", row.state_code);
    } else if (row?.state) {
      params.set("state", row.state);
    }
    if (row?.office) params.set("office", row.office);
    if (row?.party) params.set("party", row.party);
    if (row?.candidate) params.set("candidate", row.candidate);
    if (row?.race) params.set("context", row.race);

    navigate(`/candidates?${params.toString()}`);
  }

  return (
    <PageShell
      eyebrow="Executive Dashboard"
      title="Campaign command at a glance."
      description="A premium control center for leadership visibility across threats, battlegrounds, fundraising, and operations."
      demo={demoMode}
      demoText="Demo campaign is live. Fundraising, alert activity, battleground movement, and vendors are preloaded for presentation."
      tickerItems={[
        { label: "Threats", value: `${highSeverityCount} high`, dotClass: "vs-live-dot" },
        { label: "Battlegrounds", value: `${filteredBattlegrounds.length} tracked`, dotClass: "vs-live-dot-warning" },
        { label: "Vendors", value: `${topVendors.length} active`, dotClass: "vs-live-dot-success" }
      ]}
    >
      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}

      <SectionCard
        title="Executive Filters"
        subtitle="These filters now drive the dashboard, map, command center, and war room."
        right={
          <button type="button" className="vs-button vs-button-secondary" onClick={clearFilters}>
            Clear Filters
          </button>
        }
      >
        <div className="vs-grid-3">
          <select
            className="vs-select"
            value={filters.state}
            onChange={(e) => setFilters({ state: e.target.value })}
          >
            <option value="">All states</option>
            {stateOptions.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>

          <select
            className="vs-select"
            value={filters.office}
            onChange={(e) => setFilters({ office: e.target.value })}
          >
            <option value="">All offices</option>
            {officeOptions.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>

          <select
            className="vs-select"
            value={filters.risk}
            onChange={(e) => setFilters({ risk: e.target.value })}
          >
            <option value="">All risk tiers</option>
            {riskOptions.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </div>
      </SectionCard>

      <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "minmax(0, 1.45fr) minmax(320px, 0.75fr)" }}>
        <HeroFlagshipCard
          headline="Flagship KPI • Top Battleground Probability"
          value={flagshipValue}
          delta={flagshipDelta}
          tone="up"
          subline={
            topBattleground
              ? `${topBattleground.race} is currently the top executive race signal on the board, carrying ${String(topBattleground.risk || "").toLowerCase()} pressure and ${String(topBattleground.priority || "").toLowerCase()} priority.`
              : "No battleground matches the current executive filter set."
          }
        />

        <div style={{ display: "grid", gap: "16px" }}>
          <SecondaryRailCard
            label="Threat Pressure"
            value={highSeverityCount ? `${highSeverityCount} High` : "Contained"}
            subtext="Current threat environment across the filtered executive feed."
            badge={highSeverityCount ? "Escalated" : "Stable"}
            badgeTone={highSeverityCount ? "danger" : "active"}
            dotClass={highSeverityCount ? "vs-live-dot" : "vs-live-dot-success"}
          />

          <SecondaryRailCard
            label="Lead Fundraiser"
            value={topLeader ? topLeader.name : "No leader"}
            subtext={
              topLeader
                ? `${formatMoney(topLeader.receipts || 0)} receipts • ${formatMoney(topLeader.cash_on_hand || 0)} cash on hand`
                : "No fundraising leader matches the current filters."
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

      <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "minmax(0, 1.35fr) minmax(320px, 0.65fr)" }}>
        <SectionCard
          title="Executive Feed"
          subtitle="Top developments leadership should see first."
          right={<Badge tone="danger">{highSeverityCount} high priority</Badge>}
        >
          <div className="vs-stack">
            {loading ? (
              <EmptyState text="Loading executive feed..." />
            ) : !filteredFeed.length ? (
              <EmptyState text="No feed items match the active filters." />
            ) : (
              filteredFeed.map((item) => (
                <ExecutiveFeedCard
                  key={item.id || `${item.time}-${item.title}`}
                  item={item}
                />
              ))
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Top Battlegrounds"
          subtitle="Highest-pressure races right now. Jump directly into candidate intelligence."
          right={<Badge tone="warning">{filteredBattlegrounds.length} active</Badge>}
        >
          <div className="vs-stack">
            {loading ? (
              <EmptyState text="Loading battlegrounds..." />
            ) : !filteredBattlegrounds.length ? (
              <EmptyState text="No battlegrounds match the active filters." />
            ) : (
              filteredBattlegrounds.slice(0, 3).map((row) => (
                <BattlegroundCard
                  key={`${row.race}-${row.priority}`}
                  row={row}
                  onOpenIntelligence={openCandidateIntelligence}
                />
              ))
            )}
          </div>
        </SectionCard>
      </div>

      <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)" }}>
        <SectionCard
          title="Fundraising Leaders"
          subtitle={`Top candidates by receipts and reserve strength. Last synced: ${formatDateTime(dashboardData.fundraisingSummary?.last_synced_at)}`}
          right={<Badge tone="info">{filteredLeaderboard.length} tracked</Badge>}
        >
          <div className="vs-stack">
            {loading ? (
              <EmptyState text="Loading fundraising leaderboard..." />
            ) : !filteredLeaderboard.length ? (
              <EmptyState text="No fundraising leaders match the active filters." />
            ) : (
              filteredLeaderboard.map((row) => (
                <FundraisingLeaderCard
                  key={`${row.rank}-${row.candidate_id || row.name}`}
                  row={row}
                />
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
              <EmptyState text="No vendors match the active filters." />
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
