import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../services/api";

import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import ResponsiveRow from "../components/ui/ResponsiveRow";

function riskTone(label) {
  const value = String(label || "").toLowerCase();
  if (value === "critical" || value === "high") return "danger";
  if (value === "elevated") return "demo";
  return "accent";
}

function riskClass(label) {
  const value = String(label || "").toLowerCase();
  if (value === "critical") return "risk-critical";
  if (value === "high") return "risk-high";
  if (value === "elevated") return "risk-elevated";
  return "risk-stable";
}

function fmtNumber(value) {
  return Number(value || 0).toLocaleString();
}

function fmtDecimal(value, digits = 2) {
  return Number(value || 0).toFixed(digits);
}

function getRecommendation(county) {
  if (!county) return "Select a county or parish to generate an operational recommendation.";

  const primaryDriver = county.top_drivers?.[0]?.label || "Operational Heat";

  if (county.risk === "Critical") {
    return `Immediate escalation recommended. Primary driver: ${primaryDriver}. Review vendor coverage, MailOps timing, turnout pressure, and Command Center task readiness.`;
  }

  if (county.risk === "High") {
    return `Monitor closely and prepare an action plan. Primary driver: ${primaryDriver}. Inspect county-level readiness before the next campaign action window.`;
  }

  if (county.risk === "Elevated") {
    return `Keep this locality under watch. Primary driver: ${primaryDriver}. Pressure is building across one or more operational layers.`;
  }

  return "Stable locality. Continue routine monitoring through the tactical feed and county heat scoring engine.";
}

function DriverBar({ item }) {
  const value = Number(item.value || 0);

  return (
    <div className="ops-driver-row">
      <div className="ops-driver-head">
        <span>{item.label}</span>
        <strong>{fmtDecimal(value)}</strong>
      </div>
      <div className="ops-driver-bar">
        <i style={{ width: `${Math.min(100, value)}%` }} />
      </div>
    </div>
  );
}

function MetricMiniCard({ label, value }) {
  return (
    <div className="ops-mini-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function CountyRow({ item, onSelect, selected }) {
  const active = selected?.id === item.id || selected?.full_fips === item.full_fips;
  const heat = item.heat_score || item.pressure || 0;

  return (
    <button
      type="button"
      className={`ops-county-row ${riskClass(item.risk)} ${active ? "is-active" : ""}`}
      onClick={() => onSelect(item)}
    >
      <div className="ops-county-row-top">
        <div>
          <strong>{item.name}</strong>
          <span>
            {item.locality_type || item.type || "County"} • {item.dma || "Regional DMA"}
          </span>
        </div>

        <Badge tone={riskTone(item.risk)}>{item.risk || "Stable"}</Badge>
      </div>

      <div className="ops-county-bar">
        <i style={{ width: `${Math.min(100, Number(heat || 0))}%` }} />
      </div>

      <div className="ops-county-grid">
        <span>Heat <b>{fmtDecimal(heat)}</b></span>
        <span>Vendor <b>{fmtDecimal(item.vendor_score)}</b></span>
        <span>Gaps <b>{fmtDecimal(item.vendor_gap_score)}</b></span>
        <span>MailOps <b>{fmtDecimal(item.mailops_score || item.mail_jobs)}</b></span>
        <span>Alerts <b>{fmtNumber(item.alerts || 0)}</b></span>
        <span>Turnout <b>{fmtDecimal(item.turnout_pressure)}</b></span>
      </div>
    </button>
  );
}

function TacticalAlert({ item }) {
  return (
    <div className={`ops-alert ${riskClass(item.severity)}`}>
      <ResponsiveRow
        title={item.title || "Operational escalation"}
        subtitle={`${item.source || "Tactical Intelligence"} • ${item.layer || "County Heat"}`}
        meta={[
          { label: "County", value: item.county || "—" },
          { label: "State", value: item.state || "—" },
          { label: "Severity", value: item.severity || "Signal" },
          { label: "Heat", value: fmtDecimal(item.heat_score || 0) },
        ]}
      />
    </div>
  );
}

function DMARow({ item }) {
  const heat = item.heat_score || item.pressure || 0;

  return (
    <div className={`ops-dma-row ${riskClass(item.risk)}`}>
      <ResponsiveRow
        title={item.name}
        subtitle={`${item.market_type || "DMA"} • ${item.counties || 0} localities`}
        meta={[
          { label: "Heat", value: fmtDecimal(heat) },
          { label: "Risk", value: item.risk || "Stable" },
          { label: "MailOps", value: fmtNumber(item.mail_jobs || 0) },
          { label: "Vendor", value: fmtDecimal(item.vendor_score) },
        ]}
      />
    </div>
  );
}

export default function StateOperationsDrilldown() {
  const navigate = useNavigate();
  const { state } = useParams();

  const stateCode = String(state || "GA").toUpperCase();

  const [data, setData] = useState(null);
  const [selectedCounty, setSelectedCounty] = useState(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creatingTask, setCreatingTask] = useState(false);
  const [taskMessage, setTaskMessage] = useState("");
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");

  async function load({ quiet = false } = {}) {
    try {
      if (quiet) setRefreshing(true);
      else setLoading(true);

      setError("");

      if (typeof api.stateOperationsDrilldown !== "function") {
        throw new Error("State operations endpoint is not available.");
      }

      useRealtimeTacticalEvents({
        state: stateCode,
        onRefresh: () => load({ quiet: true }),
      });

      const result = await api.stateOperationsDrilldown(stateCode);

      const nextData = result || {
        summary: {},
        counties: [],
        tacticalFeed: [],
        alerts: [],
        dmas: [],
      };

      setData(nextData);

      const counties = nextData.counties || [];
      const firstCounty = counties[0] || null;

      setSelectedCounty((current) => {
        if (!current) return firstCounty;

        return (
          counties.find(
            (item) =>
              item.id === current.id ||
              item.full_fips === current.full_fips ||
              item.name === current.name
          ) || firstCounty
        );
      });

      setLastUpdated(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to load state operations drilldown."
      );

      setData({
        summary: {},
        counties: [],
        tacticalFeed: [],
        alerts: [],
        dmas: [],
      });

      setSelectedCounty(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function handleCreateCommandTask() {
    if (!selectedCounty) return;

    try {
      setCreatingTask(true);
      setTaskMessage("");

      if (typeof api.createCountyCommandTask !== "function") {
        throw new Error("County command task API client is not available.");
      }

      const topDriver = selectedCounty.top_drivers?.[0]?.label || "Operational Heat";

      await api.createCountyCommandTask({
        state: selectedCounty.state_code || stateCode,
        state_code: selectedCounty.state_code || stateCode,
        county: selectedCounty.name,
        county_name: selectedCounty.name,
        county_fips: selectedCounty.county_fips,
        full_fips: selectedCounty.full_fips,
        risk: selectedCounty.risk,
        heat_score: selectedCounty.heat_score || selectedCounty.pressure || 0,
        pressure: selectedCounty.pressure || selectedCounty.heat_score || 0,
        top_driver: topDriver,
        top_drivers: selectedCounty.top_drivers || [],
        scoring_breakdown: selectedCounty.scoring_breakdown || {},
        live_signal_counts: selectedCounty.live_signal_counts || {},
        recommendation: getRecommendation(selectedCounty),
      });

      setTaskMessage("Command Center task created.");
    } catch (err) {
      setTaskMessage(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to create Command Center task."
      );
    } finally {
      setCreatingTask(false);
    }
  }

  useEffect(() => {
    load();

    const interval = setInterval(() => {
      load({ quiet: true });
    }, 30000);

    return () => clearInterval(interval);
  }, [stateCode]);

  const summary = data?.summary || {};
  const counties = data?.counties || [];
  const tacticalFeed = data?.tacticalFeed || data?.alerts || [];
  const dmas = data?.dmas || [];

  const filteredCounties = useMemo(() => {
    const term = search.trim().toLowerCase();

    return counties.filter((item) => {
      const risk = String(item.risk || "").toLowerCase();

      const matchesSearch =
        !term || String(item.name || "").toLowerCase().includes(term);

      const matchesFilter =
        filter === "all" ||
        (filter === "urgent" && ["critical", "high"].includes(risk)) ||
        filter === risk;

      return matchesSearch && matchesFilter;
    });
  }, [counties, search, filter]);

  const stateHeat =
    summary.heat_score ||
    (counties.length
      ? counties.reduce(
          (sum, item) => sum + Number(item.heat_score || item.pressure || 0),
          0
        ) / counties.length
      : 0);

  const selectedHeat = selectedCounty?.heat_score || selectedCounty?.pressure || 0;
  const selectedDrivers = selectedCounty?.top_drivers || [];
  const selectedBreakdown = selectedCounty?.scoring_breakdown || {};
  const selectedSignals = selectedCounty?.live_signal_counts || {};

  return (
    <PageShell
      eyebrow="Operational Drilldown"
      title={`${stateCode} Operations`}
      description="County, parish, DMA, tactical intelligence, vendor readiness, and live operational heat scoring."
      tickerItems={[
        {
          label: "Heat",
          value: `${fmtDecimal(stateHeat)}%`,
          dotClass:
            Number(stateHeat || 0) >= 65
              ? "vs-live-dot-warning"
              : "vs-live-dot-success",
        },
        {
          label: "Critical",
          value: `${summary.critical_counties || 0}`,
          dotClass: summary.critical_counties
            ? "vs-live-dot-warning"
            : "vs-live-dot-success",
        },
        {
          label: "Counties",
          value: `${summary.counties_tracked || counties.length || 0}`,
          dotClass: "vs-live-dot-success",
        },
        {
          label: "Alerts",
          value: `${summary.total_alerts || tacticalFeed.length || 0}`,
          dotClass: summary.total_alerts
            ? "vs-live-dot-warning"
            : "vs-live-dot-success",
        },
        {
          label: "Updated",
          value: lastUpdated || "Live",
          dotClass: refreshing
            ? "vs-live-dot-warning"
            : "vs-live-dot-success",
        },
      ]}
    >
      <style>{`
        .ops-toolbar {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          align-items: center;
          margin-bottom: 16px;
        }

        .ops-search {
          min-width: min(340px, 100%);
          border-radius: 16px;
          border: 1px solid rgba(148,163,184,0.18);
          background: rgba(15,23,42,0.74);
          color: white;
          padding: 12px 14px;
          outline: none;
        }

        .ops-controls {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .ops-btn {
          border: 1px solid rgba(148,163,184,0.16);
          background: rgba(15,23,42,0.74);
          color: rgba(226,232,240,0.84);
          border-radius: 14px;
          padding: 10px 12px;
          font-size: 12px;
          cursor: pointer;
          text-transform: capitalize;
        }

        .ops-btn.is-active {
          border-color: rgba(96,165,250,0.62);
          background: rgba(37,99,235,0.28);
          color: white;
          box-shadow: 0 0 0 4px rgba(37,99,235,0.1);
        }

        .ops-layout {
          display: grid;
          grid-template-columns: minmax(0, 1.55fr) minmax(320px, 0.9fr);
          gap: 18px;
        }

        .ops-column {
          display: grid;
          gap: 18px;
          align-content: start;
        }

        .ops-county-list,
        .ops-alert-list,
        .ops-dma-list {
          display: grid;
          gap: 12px;
        }

        .ops-county-row {
          border-radius: 20px;
          border: 1px solid rgba(148,163,184,0.16);
          background:
            radial-gradient(circle at top right, rgba(59,130,246,0.1), transparent 34%),
            linear-gradient(135deg, rgba(15,23,42,0.82), rgba(2,6,23,0.66));
          padding: 16px;
          text-align: left;
          cursor: pointer;
          transition: transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
        }

        .ops-county-row:hover {
          transform: translateY(-2px);
          border-color: rgba(96,165,250,0.42);
        }

        .ops-county-row.is-active {
          border-color: rgba(96,165,250,0.62);
          box-shadow: 0 0 0 4px rgba(37,99,235,0.12);
        }

        .risk-critical {
          border-color: rgba(248,113,113,0.38) !important;
        }

        .risk-high {
          border-color: rgba(251,146,60,0.34) !important;
        }

        .risk-elevated {
          border-color: rgba(251,191,36,0.28) !important;
        }

        .ops-county-row-top {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: flex-start;
        }

        .ops-county-row-top strong {
          display: block;
          color: white;
          font-size: 16px;
          font-weight: 850;
        }

        .ops-county-row-top span {
          display: block;
          margin-top: 4px;
          color: rgba(203,213,225,0.66);
          font-size: 12px;
        }

        .ops-county-bar {
          margin-top: 14px;
          height: 8px;
          border-radius: 999px;
          background: rgba(15,23,42,0.92);
          overflow: hidden;
        }

        .ops-county-bar i {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, rgba(59,130,246,0.92), rgba(239,68,68,0.92));
        }

        .ops-county-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
          margin-top: 14px;
        }

        .ops-county-grid span {
          display: block;
          color: rgba(203,213,225,0.62);
          font-size: 11px;
        }

        .ops-county-grid b {
          display: block;
          margin-top: 3px;
          color: white;
          font-size: 15px;
        }

        .ops-intel-panel {
          border-radius: 24px;
          border: 1px solid rgba(148,163,184,0.16);
          background:
            radial-gradient(circle at top right, rgba(59,130,246,0.12), transparent 36%),
            linear-gradient(135deg, rgba(15,23,42,0.86), rgba(2,6,23,0.7));
          padding: 20px;
        }

        .ops-intel-top {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: flex-start;
        }

        .ops-intel-top strong {
          display: block;
          color: white;
          font-size: 24px;
          font-weight: 950;
        }

        .ops-intel-top span {
          display: block;
          margin-top: 4px;
          color: rgba(203,213,225,0.68);
          font-size: 12px;
        }

        .ops-intel-grid,
        .ops-signal-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          margin-top: 18px;
        }

        .ops-intel-grid div,
        .ops-mini-metric {
          border-radius: 16px;
          border: 1px solid rgba(148,163,184,0.12);
          background: rgba(15,23,42,0.54);
          padding: 12px;
        }

        .ops-intel-grid span,
        .ops-mini-metric span {
          display: block;
          color: rgba(203,213,225,0.64);
          font-size: 11px;
        }

        .ops-intel-grid strong,
        .ops-mini-metric strong {
          display: block;
          margin-top: 4px;
          color: white;
          font-size: 18px;
        }

        .ops-panel-section {
          margin-top: 18px;
          border-top: 1px solid rgba(148,163,184,0.12);
          padding-top: 16px;
        }

        .ops-panel-title {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
        }

        .ops-panel-title strong {
          color: white;
          font-size: 14px;
          font-weight: 900;
        }

        .ops-panel-title span {
          color: rgba(203,213,225,0.58);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .ops-driver-list {
          display: grid;
          gap: 12px;
        }

        .ops-driver-row {
          border-radius: 16px;
          border: 1px solid rgba(148,163,184,0.12);
          background: rgba(15,23,42,0.44);
          padding: 12px;
        }

        .ops-driver-head {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          color: rgba(226,232,240,0.9);
          font-size: 12px;
          font-weight: 800;
        }

        .ops-driver-head strong {
          color: white;
        }

        .ops-driver-bar {
          margin-top: 9px;
          height: 7px;
          border-radius: 999px;
          background: rgba(2,6,23,0.72);
          overflow: hidden;
        }

        .ops-driver-bar i {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, rgba(96,165,250,0.92), rgba(248,113,113,0.92));
        }

        .ops-action-btn {
          width: 100%;
          border: 1px solid rgba(96,165,250,0.36);
          background: linear-gradient(135deg, rgba(37,99,235,0.38), rgba(15,23,42,0.78));
          color: white;
          border-radius: 16px;
          padding: 12px 14px;
          font-weight: 900;
          cursor: pointer;
        }

        .ops-action-btn:disabled {
          cursor: not-allowed;
          opacity: 0.62;
        }

        .ops-recommendation {
          margin-top: 16px;
          border-radius: 18px;
          border: 1px solid rgba(96,165,250,0.22);
          background: rgba(37,99,235,0.12);
          padding: 14px;
          color: rgba(226,232,240,0.86);
          font-size: 13px;
          line-height: 1.5;
        }

        .ops-alert,
        .ops-dma-row {
          border-radius: 18px;
          border: 1px solid rgba(148,163,184,0.16);
          overflow: hidden;
          background: linear-gradient(135deg, rgba(15,23,42,0.76), rgba(15,23,42,0.44));
        }

        .ops-alert .vs-responsive-row,
        .ops-dma-row .vs-responsive-row {
          border: 0;
          background: transparent;
        }

        @media (max-width: 1100px) {
          .ops-layout {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 760px) {
          .ops-county-grid,
          .ops-intel-grid,
          .ops-signal-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .ops-toolbar {
            align-items: stretch;
          }

          .ops-search {
            width: 100%;
          }
        }
      `}</style>

      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}

      <div className="vs-grid-4">
        <StatCard
          label="State Heat"
          value={`${fmtDecimal(stateHeat)}%`}
          delta="Operational pressure"
          tone={Number(stateHeat || 0) >= 65 ? "down" : "up"}
        />

        <StatCard
          label="Critical Counties"
          value={summary.critical_counties || 0}
          delta="Highest-risk localities"
          tone={summary.critical_counties ? "down" : "up"}
        />

        <StatCard
          label="Vendor Gaps"
          value={fmtNumber(summary.vendor_gap_count || 0)}
          delta="Coverage weakness"
          tone={summary.vendor_gap_count ? "down" : "up"}
        />

        <StatCard
          label="MailOps Jobs"
          value={fmtNumber(summary.total_mail_jobs || 0)}
          delta="Operational volume"
          tone="up"
        />
      </div>

      <div className="ops-layout">
        <div className="ops-column">
          <SectionCard
            title={`${stateCode} County / Parish Heat`}
            subtitle="Live tactical scoring generated from operational pressure, vendor readiness, turnout intensity, and MailOps activity."
            right={<Badge tone="accent">{filteredCounties.length} localities</Badge>}
          >
            <div className="ops-toolbar">
              <input
                className="ops-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search county or parish..."
              />

              <div className="ops-controls">
                {["all", "urgent", "critical", "high", "elevated", "stable"].map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`ops-btn ${filter === item ? "is-active" : ""}`}
                    onClick={() => setFilter(item)}
                  >
                    {item}
                  </button>
                ))}

                <button
                  type="button"
                  className="ops-btn"
                  onClick={() => navigate("/state-operations")}
                >
                  Back
                </button>
              </div>
            </div>

            {loading ? (
              <EmptyState text="Loading tactical county intelligence..." />
            ) : !filteredCounties.length ? (
              <EmptyState text="No counties/parishes match current filters." />
            ) : (
              <div className="ops-county-list">
                {filteredCounties.map((item) => (
                  <CountyRow
                    key={item.full_fips || item.id || item.name}
                    item={item}
                    selected={selectedCounty}
                    onSelect={setSelectedCounty}
                  />
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Tactical Intelligence Feed"
            subtitle="Escalation feed generated from live county heat scoring."
            right={<Badge tone="danger">{tacticalFeed.length} alerts</Badge>}
          >
            {!tacticalFeed.length ? (
              <EmptyState text="No tactical alerts detected." />
            ) : (
              <div className="ops-alert-list">
                {tacticalFeed.map((item) => (
                  <TacticalAlert
                    key={item.id || `${item.state}-${item.title}`}
                    item={item}
                  />
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="DMA / Regional Operations"
            subtitle="Regional media market and operational readiness overlays."
            right={<Badge tone="accent">{dmas.length} DMAs</Badge>}
          >
            {!dmas.length ? (
              <EmptyState text="No DMA overlays detected." />
            ) : (
              <div className="ops-dma-list">
                {dmas.map((item) => (
                  <DMARow key={item.name} item={item} />
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        <div className="ops-column">
          <SectionCard
            title="Executive Intelligence Panel"
            subtitle="Top heat drivers, live signal counts, scoring breakdown, and Command Center tasking."
          >
            {!selectedCounty ? (
              <EmptyState text="Select a county/parish to inspect operational readiness." />
            ) : (
              <div className={`ops-intel-panel ${riskClass(selectedCounty.risk)}`}>
                <div className="ops-intel-top">
                  <div>
                    <strong>{selectedCounty.name}</strong>
                    <span>
                      {selectedCounty.locality_type || selectedCounty.type || "County"} •{" "}
                      {selectedCounty.state_code}
                    </span>
                  </div>

                  <Badge tone={riskTone(selectedCounty.risk)}>
                    {selectedCounty.risk || "Stable"}
                  </Badge>
                </div>

                <div className="ops-county-bar" style={{ marginTop: 18 }}>
                  <i style={{ width: `${Math.min(100, Number(selectedHeat || 0))}%` }} />
                </div>

                <div className="ops-intel-grid">
                  <div><span>Heat Score</span><strong>{fmtDecimal(selectedHeat)}</strong></div>
                  <div><span>Vendor Readiness</span><strong>{fmtDecimal(selectedCounty.vendor_score)}</strong></div>
                  <div><span>Vendor Gap</span><strong>{fmtDecimal(selectedCounty.vendor_gap_score)}</strong></div>
                  <div><span>MailOps Pressure</span><strong>{fmtDecimal(selectedCounty.mailops_score || selectedCounty.mail_jobs)}</strong></div>
                  <div><span>Turnout Pressure</span><strong>{fmtDecimal(selectedCounty.turnout_pressure)}</strong></div>
                  <div><span>Fundraising</span><strong>{fmtDecimal(selectedCounty.fundraising_pressure)}</strong></div>
                  <div><span>Alerts</span><strong>{fmtNumber(selectedCounty.alerts || 0)}</strong></div>
                  <div><span>DMA</span><strong>{selectedCounty.dma || "Regional"}</strong></div>
                </div>

                <div className="ops-panel-section">
                  <div className="ops-panel-title">
                    <strong>Command Action</strong>
                    <span>Execution workflow</span>
                  </div>

                  <button
                    type="button"
                    className="ops-action-btn"
                    onClick={handleCreateCommandTask}
                    disabled={creatingTask}
                  >
                    {creatingTask ? "Creating Command Task..." : "Create Command Task"}
                  </button>

                  {taskMessage ? (
                    <div className="ops-recommendation">{taskMessage}</div>
                  ) : null}
                </div>

                <div className="ops-panel-section">
                  <div className="ops-panel-title">
                    <strong>Top Heat Drivers</strong>
                    <span>Primary risk sources</span>
                  </div>

                  {!selectedDrivers.length ? (
                    <EmptyState text="No driver breakdown available." />
                  ) : (
                    <div className="ops-driver-list">
                      {selectedDrivers.map((driver) => (
                        <DriverBar key={driver.label} item={driver} />
                      ))}
                    </div>
                  )}
                </div>

                <div className="ops-panel-section">
                  <div className="ops-panel-title">
                    <strong>Live Signal Counts</strong>
                    <span>Connected data</span>
                  </div>

                  <div className="ops-signal-grid">
                    <MetricMiniCard label="Vendors" value={fmtNumber(selectedSignals.vendors || 0)} />
                    <MetricMiniCard label="MailOps" value={fmtNumber(selectedSignals.mailops || 0)} />
                    <MetricMiniCard label="Tasks" value={fmtNumber(selectedSignals.tasks || 0)} />
                    <MetricMiniCard label="Alerts" value={fmtNumber(selectedSignals.alerts || 0)} />
                    <MetricMiniCard label="Fundraising" value={fmtNumber(selectedSignals.fundraising || 0)} />
                    <MetricMiniCard label="Baseline" value={fmtDecimal(selectedBreakdown.baseline || 0)} />
                  </div>
                </div>

                <div className="ops-panel-section">
                  <div className="ops-panel-title">
                    <strong>Scoring Breakdown</strong>
                    <span>Heat model</span>
                  </div>

                  <div className="ops-signal-grid">
                    <MetricMiniCard label="Battleground" value={fmtDecimal(selectedBreakdown.battleground_weight || 0)} />
                    <MetricMiniCard label="Vendor Gap" value={fmtDecimal(selectedBreakdown.vendor_gap_score || 0)} />
                    <MetricMiniCard label="MailOps" value={fmtDecimal(selectedBreakdown.mailops_score || 0)} />
                    <MetricMiniCard label="Turnout" value={fmtDecimal(selectedBreakdown.turnout_pressure || 0)} />
                    <MetricMiniCard label="Tasks" value={fmtDecimal(selectedBreakdown.task_pressure || 0)} />
                    <MetricMiniCard label="Alerts" value={fmtDecimal(selectedBreakdown.alert_pressure || 0)} />
                    <MetricMiniCard label="Fundraising" value={fmtDecimal(selectedBreakdown.fundraising_pressure || 0)} />
                    <MetricMiniCard label="Total Heat" value={fmtDecimal(selectedBreakdown.heat_score || selectedHeat)} />
                  </div>
                </div>

                <div className="ops-recommendation">
                  {getRecommendation(selectedCounty)}
                </div>
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </PageShell>
  );
}
