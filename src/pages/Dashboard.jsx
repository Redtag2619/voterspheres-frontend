import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import ExecutivePageNav from "../components/ui/ExecutivePageNav";
import CollapsibleSection from "../components/ui/CollapsibleSection";
import BackToTopButton from "../components/ui/BackToTopButton";
import ShowMoreList from "../components/ui/ShowMoreList";
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
    { label: "Fundraising Leaders", value: "0", delta: "Waiting on live dashboard", tone: "up" },
    { label: "Receipts Modeled", value: "$0", delta: "Waiting on live dashboard", tone: "up" },
    { label: "Cash On Hand", value: "$0", delta: "Waiting on live dashboard", tone: "up" },
    { label: "Average Raise", value: "$0", delta: "Waiting on live dashboard", tone: "up" }
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
        <div
          style={{
            fontSize: "16px",
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
            color: "var(--vs-text)"
          }}
        >
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
          minHeight: "112px",
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

        <div>
          <div className="vs-stat-label">Receipts</div>
          <div style={{ marginTop: "4px", fontSize: "13px", fontWeight: 700, lineHeight: 1.2 }}>
            {formatMoney(row.receipts || 0)}
          </div>
        </div>

        <div>
          <div className="vs-stat-label">Vendors</div>
          <div style={{ marginTop: "4px", fontSize: "13px", fontWeight: 700, lineHeight: 1.2 }}>
            {row.vendor_count ?? 0}
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

function DashboardExecutiveHeader({
  highSeverityCount,
  filteredBattlegrounds,
  filteredLeaderboard,
  filteredVendors,
  filteredFeed,
  topBattleground,
  topLeader,
  loading,
  onRefresh,
}) {
  const readinessScore = Math.max(
    5,
    Math.min(
      100,
      Math.round(
        92 -
          Math.min(24, highSeverityCount * 7) -
          Math.min(12, filteredBattlegrounds.length ? 0 : 8) -
          Math.min(10, filteredVendors.length ? 0 : 6) +
          Math.min(8, filteredLeaderboard.length * 1.2) +
          Math.min(6, filteredFeed.length * 0.5)
      )
    )
  );

  return (
    <div className="dash-exec-ribbon" id="dashboard-overview">
      <div className="dash-exec-copy">
        <span>Executive Campaign Readiness</span>
        <strong>{readinessScore}% Ready</strong>
        <p>
          VoterSpheres command landing page for threats, battlegrounds, fundraising,
          vendor readiness, candidate intelligence, and operational escalation.
        </p>

        <div className="dash-exec-badges">
          <Badge tone={highSeverityCount ? "danger" : "active"}>{highSeverityCount} High Threats</Badge>
          <Badge tone="accent">{filteredBattlegrounds.length} Battlegrounds</Badge>
          <Badge tone="info">{filteredLeaderboard.length} Finance Leaders</Badge>
          <Badge tone={filteredVendors.length ? "active" : "demo"}>{filteredVendors.length} Vendors</Badge>
          {topBattleground ? <Badge tone={riskTone(topBattleground.risk)}>{topBattleground.race}</Badge> : null}
        </div>
      </div>

      <div className="dash-exec-grid">
        <div>
          <span>Executive Feed</span>
          <strong>{filteredFeed.length}</strong>
        </div>
        <div>
          <span>Top Battleground</span>
          <strong>{topBattleground?.state || "None"}</strong>
        </div>
        <div>
          <span>Lead Fundraiser</span>
          <strong>{topLeader?.name || "None"}</strong>
        </div>
        <div>
          <span>Live Status</span>
          <strong>{loading ? "Loading" : "Ready"}</strong>
        </div>
      </div>

      <div className="dash-exec-actions">
        <button type="button" onClick={onRefresh} disabled={loading}>
          {loading ? "Refreshing Dashboard..." : "Refresh Dashboard"}
        </button>
        <Link to="/command-center">Command Center</Link>
        <Link to="/ai-war-room">AI War Room</Link>
        <Link to="/executive-decision-intelligence">Executive Intelligence</Link>
        <Link to="/state-operations">State Operations</Link>
        <Link to="/fundraising">Fundraising</Link>
        <Link to="/candidates">Candidates</Link>
        <Link to="/vendors">Vendors</Link>
      </div>
    </div>
  );
}

function DashboardActionCenter() {
  return (
    <div className="dash-action-center">
      <Link to="/political-intelligence">Political Intelligence</Link>
      <Link to="/executive-decision-intelligence">Executive Decision Intelligence</Link>
      <Link to="/command-center">Command Center</Link>
      <Link to="/election-map">Election Map</Link>
      <Link to="/state-operations">State Operations</Link>
      <Link to="/fundraising">Fundraising Intelligence</Link>
      <Link to="/candidates">Candidate Intelligence</Link>
      <Link to="/vendors">Vendor Network</Link>
      <Link to="/ai-war-room">AI War Room</Link>
      <Link to="/strategy-recommendation-dashboard">Strategy Engine</Link>
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

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const dashboardRes = await api.get("/intelligence/dashboard", { timeout: 8000 });
      const payload = dashboardRes?.data || {};

      setDashboardData({
        metrics: Array.isArray(payload.metrics) ? payload.metrics : fallbackData.metrics,
        feed: Array.isArray(payload.feed) ? payload.feed : [],
        battlegrounds: Array.isArray(payload.battlegrounds) ? payload.battlegrounds : [],
        leaderboard: Array.isArray(payload.leaderboard) ? payload.leaderboard : [],
        vendors: Array.isArray(payload.vendors) ? payload.vendors : [],
        fundraisingSummary: payload.fundraisingSummary || null
      });
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Failed to load dashboard");
      setDashboardData(fallbackData);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
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

  const navSections = [
    { id: "dashboard-overview", label: "Overview" },
    { id: "dashboard-filters", label: "Filters" },
    { id: "dashboard-command", label: "Command" },
    { id: "dashboard-metrics", label: "Metrics" },
    { id: "dashboard-feed", label: "Threats", badge: filteredFeed.length },
    { id: "dashboard-battlegrounds", label: "Battlegrounds", badge: filteredBattlegrounds.length },
    { id: "dashboard-fundraising", label: "Fundraising", badge: filteredLeaderboard.length },
    { id: "dashboard-vendors", label: "Vendors", badge: filteredVendors.length },
    { id: "dashboard-actions", label: "Actions" },
  ];

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
      <style>{`
        .dash-exec-ribbon {
          display: grid;
          grid-template-columns: minmax(300px, 0.95fr) minmax(0, 1.15fr);
          gap: 18px;
          align-items: stretch;
          border: 1px solid rgba(148, 163, 184, 0.16);
          border-radius: 28px;
          background:
            radial-gradient(circle at top right, rgba(59, 130, 246, 0.18), transparent 34%),
            radial-gradient(circle at bottom left, rgba(251, 146, 60, 0.12), transparent 30%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.94), rgba(2, 6, 23, 0.86));
          box-shadow: 0 28px 80px rgba(2, 6, 23, 0.32);
          padding: 20px;
          min-width: 0;
          overflow: hidden;
        }
        .dash-exec-copy { min-width: 0; }
        .dash-exec-copy span,
        .dash-exec-grid span {
          display: block;
          color: rgba(147, 197, 253, 0.86);
          font-size: 11px;
          font-weight: 950;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        .dash-exec-copy strong {
          display: block;
          margin-top: 8px;
          color: white;
          font-size: clamp(30px, 4vw, 50px);
          line-height: 1;
          font-weight: 950;
          letter-spacing: -0.07em;
        }
        .dash-exec-copy p {
          margin: 12px 0 0;
          color: rgba(226, 232, 240, 0.78);
          line-height: 1.6;
          max-width: 820px;
        }
        .dash-exec-badges,
        .dash-exec-actions,
        .dash-action-center {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          align-items: center;
        }
        .dash-exec-badges { margin-top: 14px; }
        .dash-exec-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          min-width: 0;
        }
        .dash-exec-grid div {
          border: 1px solid rgba(148, 163, 184, 0.14);
          border-radius: 18px;
          background: rgba(2, 6, 23, 0.34);
          padding: 14px;
          min-width: 0;
        }
        .dash-exec-grid strong {
          display: block;
          margin-top: 7px;
          color: white;
          font-size: 20px;
          font-weight: 950;
          overflow-wrap: anywhere;
        }
        .dash-exec-actions {
          grid-column: 1 / -1;
          border-top: 1px solid rgba(148, 163, 184, 0.12);
          padding-top: 14px;
        }
        .dash-exec-actions button,
        .dash-exec-actions a,
        .dash-action-center a {
          border: 1px solid rgba(148, 163, 184, 0.18);
          background: rgba(15, 23, 42, 0.74);
          color: rgba(226, 232, 240, 0.92);
          border-radius: 15px;
          padding: 11px 12px;
          font-size: 12px;
          font-weight: 850;
          cursor: pointer;
          text-decoration: none;
        }
        .dash-exec-actions button:hover,
        .dash-exec-actions a:hover,
        .dash-action-center a:hover {
          border-color: rgba(96, 165, 250, 0.48);
          background: rgba(37, 99, 235, 0.24);
          color: white;
        }
        .dash-exec-actions button:disabled { opacity: 0.62; cursor: not-allowed; }
        .dash-exec-stack { display: grid; gap: 18px; min-width: 0; }
        .dash-hero-layout,
        .dash-main-layout,
        .dash-two-layout { display: grid; gap: 16px; min-width: 0; }
        .dash-hero-layout { grid-template-columns: minmax(0, 1.45fr) minmax(320px, 0.75fr); }
        .dash-main-layout { grid-template-columns: minmax(0, 1.35fr) minmax(320px, 0.65fr); }
        .dash-two-layout { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
        @media (max-width: 1100px) {
          .dash-exec-ribbon,
          .dash-hero-layout,
          .dash-main-layout,
          .dash-two-layout { grid-template-columns: 1fr; }
        }
        @media (max-width: 760px) {
          .dash-exec-grid { grid-template-columns: 1fr; }
          .dash-exec-actions,
          .dash-action-center { align-items: stretch; }
          .dash-exec-actions button,
          .dash-exec-actions a,
          .dash-action-center a { width: 100%; text-align: center; }
        }
      `}</style>

      <div className="dash-exec-stack">
        <DashboardExecutiveHeader
          highSeverityCount={highSeverityCount}
          filteredBattlegrounds={filteredBattlegrounds}
          filteredLeaderboard={filteredLeaderboard}
          filteredVendors={filteredVendors}
          filteredFeed={filteredFeed}
          topBattleground={topBattleground}
          topLeader={topLeader}
          loading={loading}
          onRefresh={loadDashboard}
        />
        <ExecutivePageNav sections={navSections} />
      </div>

      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}

      <div id="dashboard-filters">
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
      </div>

      <CollapsibleSection
        id="dashboard-command"
        title="Executive Command Summary"
        subtitle="Top battleground probability, threat pressure, and lead fundraising signal."
        defaultOpen
        right={<Badge tone={highSeverityCount ? "danger" : "active"}>{highSeverityCount ? "Escalated" : "Stable"}</Badge>}
      >
      <div className="dash-hero-layout">
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
      </CollapsibleSection>

      <CollapsibleSection
        id="dashboard-metrics"
        title="Executive KPI Dashboard"
        subtitle="Live metrics from the intelligence dashboard API."
        defaultOpen
        right={<Badge tone="active">{(dashboardData.metrics || []).length} Metrics</Badge>}
      >
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
      </CollapsibleSection>

      <div className="dash-main-layout">
        <div id="dashboard-feed">
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
              <ShowMoreList
                items={filteredFeed}
                initialCount={8}
                showAllLabel={(count) => `Show All ${count} Feed Items`}
                className="vs-stack"
                renderItem={(item) => <ExecutiveFeedCard item={item} />}
              />
            )}
          </div>
        </SectionCard>
        </div>

        <div id="dashboard-battlegrounds">
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
              <ShowMoreList
                items={filteredBattlegrounds}
                initialCount={3}
                showAllLabel={(count) => `Show All ${count} Battlegrounds`}
                className="vs-stack"
                renderItem={(row) => (
                  <BattlegroundCard
                    row={row}
                    onOpenIntelligence={openCandidateIntelligence}
                  />
                )}
              />
            )}
          </div>
        </SectionCard>
        </div>
      </div>

      <div className="dash-two-layout">
        <div id="dashboard-fundraising">
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
              <ShowMoreList
                items={filteredLeaderboard}
                initialCount={6}
                showAllLabel={(count) => `Show All ${count} Fundraising Leaders`}
                className="vs-stack"
                renderItem={(row) => <FundraisingLeaderCard row={row} />}
              />
            )}
          </div>
        </SectionCard>
        </div>

        <div id="dashboard-vendors">
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
              <ShowMoreList
                items={filteredVendors}
                initialCount={3}
                showAllLabel={(count) => `Show All ${count} Vendors`}
                className="vs-stack"
                renderItem={(vendor) => <VendorCard vendor={vendor} />}
              />
            )}
          </div>
        </SectionCard>
        </div>
      </div>

      <CollapsibleSection
        id="dashboard-actions"
        title="Executive Action Center"
        subtitle="Quick launch into the major VoterSpheres command modules."
        defaultOpen={false}
        right={<Badge tone="active">Platform Links</Badge>}
      >
        <DashboardActionCenter />
      </CollapsibleSection>

      <BackToTopButton />
    </PageShell>
  );
}
