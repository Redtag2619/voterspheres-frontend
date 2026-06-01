import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../services/api";

import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import ResponsiveRow from "../components/ui/ResponsiveRow";

const STATE_POSITIONS = {
  AK: [1, 1], ME: [11, 1],
  VT: [10, 2], NH: [11, 2], WA: [2, 2], MT: [3, 2], ND: [4, 2], MN: [5, 2], WI: [6, 2], MI: [7, 2], NY: [9, 2], MA: [11, 3],
  OR: [2, 3], ID: [3, 3], SD: [4, 3], IA: [5, 3], IL: [6, 3], IN: [7, 3], OH: [8, 3], PA: [9, 3], CT: [10, 3], RI: [11, 4],
  CA: [2, 4], NV: [3, 4], WY: [4, 4], NE: [5, 4], MO: [6, 4], KY: [7, 4], WV: [8, 4], VA: [9, 4], NJ: [10, 4],
  HI: [1, 5], AZ: [3, 5], UT: [4, 5], CO: [5, 5], KS: [6, 5], AR: [7, 5], TN: [8, 5], NC: [9, 5], DE: [10, 5],
  NM: [4, 6], OK: [5, 6], LA: [6, 6], MS: [7, 6], AL: [8, 6], SC: [9, 6], MD: [10, 6], DC: [11, 6],
  TX: [5, 7], GA: [8, 7], FL: [9, 8],
};

function fmtNumber(value) {
  return Number(value || 0).toLocaleString();
}

function fmtDecimal(value, digits = 2) {
  return Number(value || 0).toFixed(digits);
}

function riskTone(value) {
  const risk = String(value || "").toLowerCase();
  if (risk === "critical" || risk === "high") return "danger";
  if (risk === "elevated") return "demo";
  return "accent";
}

function riskClass(value) {
  const risk = String(value || "").toLowerCase();
  if (risk === "critical") return "risk-critical";
  if (risk === "high") return "risk-high";
  if (risk === "elevated") return "risk-elevated";
  return "risk-stable";
}

function commandClass(item) {
  if (item?.task_active || item?.command_status === "Task Active") return "task-active";
  if (item?.task_resolved || item?.command_status === "Resolved") return "task-resolved";
  return "task-none";
}

function MapStateCell({ item, onOpen }) {
  const pos = STATE_POSITIONS[item.state_code] || [1, 1];
  const heat = item.heat_score || item.pressure || 0;

  return (
    <button
      type="button"
      className={`ops-map-state ${riskClass(item.risk)} ${item.active_task_count ? "has-active" : ""} ${item.resolved_task_count ? "has-resolved" : ""}`}
      style={{
        gridColumn: pos[0],
        gridRow: pos[1],
      }}
      onClick={() => onOpen(item.state_code)}
      title={`${item.state_name} — Heat ${fmtDecimal(heat)}`}
    >
      <span>{item.state_code}</span>
      <b>{fmtDecimal(heat, 0)}</b>
      {item.active_task_count ? <i className="pulse-dot" /> : null}
    </button>
  );
}

function CountySignalRow({ item, onOpen }) {
  return (
    <div className={`ops-map-row ${riskClass(item.risk)} ${commandClass(item)}`}>
      <ResponsiveRow
        title={`${item.name}, ${item.state_code}`}
        subtitle={`${item.type || "County"} • ${item.command_status || "No Task"}`}
        meta={[
          { label: "Heat", value: fmtDecimal(item.heat_score || item.pressure || 0) },
          { label: "Risk", value: item.risk || "Stable" },
          { label: "Vendor Gap", value: fmtDecimal(item.vendor_gap_score || 0) },
          { label: "Top Driver", value: item.top_drivers?.[0]?.label || "Heat" },
        ]}
        right={
          <button
            type="button"
            className="vs-button vs-button-secondary"
            onClick={() => onOpen(item.state_code)}
          >
            Open
          </button>
        }
      />
    </div>
  );
}

function TacticalFeedRow({ item, onOpen }) {
  return (
    <div className={`ops-map-row ${riskClass(item.severity)}`}>
      <ResponsiveRow
        title={item.title}
        subtitle={`${item.source || "Operations Map"} • ${item.layer || "Tactical Layer"}`}
        meta={[
          { label: "State", value: item.state || "—" },
          { label: "County", value: item.county || "—" },
          { label: "Heat", value: fmtDecimal(item.heat_score || 0) },
          { label: "Status", value: item.command_status || "No Task" },
        ]}
        right={
          <button
            type="button"
            className="vs-button vs-button-secondary"
            onClick={() => onOpen(item.state)}
          >
            Inspect
          </button>
        }
      />
    </div>
  );
}

export default function StateOperationsMap() {
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [layer, setLayer] = useState("heat");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");

  async function load({ quiet = false } = {}) {
    try {
      if (quiet) setRefreshing(true);
      else setLoading(true);

      setError("");

      if (typeof api.operationsMap !== "function") {
        throw new Error("Operations map API client is not available.");
      }

      const result = await api.operationsMap();
      setData(result || { summary: {}, states: [], counties: [] });

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
          "Failed to load live tactical operations map."
      );

      setData({
        summary: {},
        states: [],
        counties: [],
        activeEscalations: [],
        resolvedEscalations: [],
        topHeatCounties: [],
        tacticalFeed: [],
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load();

    const interval = setInterval(() => {
      load({ quiet: true });
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const summary = data?.summary || {};
  const states = data?.states || [];
  const topHeatCounties = data?.topHeatCounties || [];
  const activeEscalations = data?.activeEscalations || [];
  const resolvedEscalations = data?.resolvedEscalations || [];
  const tacticalFeed = data?.tacticalFeed || [];

  const mapStates = useMemo(() => {
    return [...states].sort((a, b) => String(a.state_code).localeCompare(String(b.state_code)));
  }, [states]);

  const sideList = useMemo(() => {
    if (layer === "active") return activeEscalations;
    if (layer === "resolved") return resolvedEscalations;
    return topHeatCounties;
  }, [layer, activeEscalations, resolvedEscalations, topHeatCounties]);

  function openState(stateCode) {
    if (!stateCode) return;
    navigate(`/state-operations/${String(stateCode).toUpperCase()}`);
  }

  return (
    <PageShell
      eyebrow="Live Tactical Map"
      title="State Operations Map"
      description="National tactical overlay for state heat, county escalation pressure, resolved task relief, and live operational feed."
      tickerItems={[
        {
          label: "National Heat",
          value: `${fmtDecimal(summary.national_heat_score || 0)}%`,
          dotClass: Number(summary.national_heat_score || 0) >= 65 ? "vs-live-dot-warning" : "vs-live-dot-success",
        },
        {
          label: "States",
          value: `${summary.states_tracked || states.length || 0}`,
          dotClass: "vs-live-dot-success",
        },
        {
          label: "Counties",
          value: `${fmtNumber(summary.counties_tracked || 0)}`,
          dotClass: "vs-live-dot-success",
        },
        {
          label: "Active",
          value: `${summary.active_escalations || 0}`,
          dotClass: summary.active_escalations ? "vs-live-dot-warning" : "vs-live-dot-success",
        },
        {
          label: "Updated",
          value: lastUpdated || "Live",
          dotClass: refreshing ? "vs-live-dot-warning" : "vs-live-dot-success",
        },
      ]}
    >
      <style>{`
        .ops-map-shell {
          display: grid;
          grid-template-columns: minmax(0, 1.45fr) minmax(340px, 0.85fr);
          gap: 18px;
          align-items: start;
        }

        .ops-map-stage {
          border-radius: 28px;
          border: 1px solid rgba(148,163,184,0.16);
          background:
            radial-gradient(circle at top left, rgba(59,130,246,0.16), transparent 36%),
            radial-gradient(circle at bottom right, rgba(239,68,68,0.12), transparent 34%),
            linear-gradient(135deg, rgba(15,23,42,0.86), rgba(2,6,23,0.72));
          padding: 18px;
          min-height: 620px;
          overflow: hidden;
          position: relative;
        }

        .ops-map-stage:before {
          content: "";
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(96,165,250,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(96,165,250,0.06) 1px, transparent 1px);
          background-size: 34px 34px;
          pointer-events: none;
          opacity: 0.7;
        }

        .ops-map-header {
          position: relative;
          z-index: 1;
          display: flex;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          align-items: center;
          margin-bottom: 16px;
        }

        .ops-map-title strong {
          display: block;
          color: white;
          font-size: 18px;
          font-weight: 950;
        }

        .ops-map-title span {
          display: block;
          color: rgba(203,213,225,0.66);
          font-size: 12px;
          margin-top: 4px;
        }

        .ops-layer-tabs {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .ops-layer-btn {
          border: 1px solid rgba(148,163,184,0.16);
          background: rgba(15,23,42,0.78);
          color: rgba(226,232,240,0.84);
          border-radius: 14px;
          padding: 10px 12px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 850;
        }

        .ops-layer-btn.is-active {
          border-color: rgba(96,165,250,0.62);
          background: rgba(37,99,235,0.32);
          color: white;
          box-shadow: 0 0 0 4px rgba(37,99,235,0.1);
        }

        .ops-us-grid {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: repeat(11, minmax(40px, 1fr));
          grid-template-rows: repeat(8, 56px);
          gap: 9px;
          margin-top: 20px;
        }

        .ops-map-state {
          position: relative;
          border-radius: 16px;
          border: 1px solid rgba(148,163,184,0.14);
          background: rgba(15,23,42,0.78);
          color: white;
          display: grid;
          place-items: center;
          gap: 2px;
          cursor: pointer;
          transition: transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
          min-width: 0;
        }

        .ops-map-state:hover {
          transform: translateY(-2px) scale(1.02);
          border-color: rgba(96,165,250,0.62);
          box-shadow: 0 18px 40px rgba(2,6,23,0.35);
          z-index: 5;
        }

        .ops-map-state span {
          font-size: 13px;
          font-weight: 950;
          letter-spacing: -0.03em;
        }

        .ops-map-state b {
          font-size: 10px;
          color: rgba(226,232,240,0.68);
        }

        .ops-map-state.risk-critical {
          background: linear-gradient(135deg, rgba(127,29,29,0.88), rgba(248,113,113,0.38));
          border-color: rgba(248,113,113,0.62);
        }

        .ops-map-state.risk-high {
          background: linear-gradient(135deg, rgba(124,45,18,0.86), rgba(251,146,60,0.34));
          border-color: rgba(251,146,60,0.54);
        }

        .ops-map-state.risk-elevated {
          background: linear-gradient(135deg, rgba(113,63,18,0.78), rgba(251,191,36,0.3));
          border-color: rgba(251,191,36,0.46);
        }

        .ops-map-state.risk-stable {
          background: linear-gradient(135deg, rgba(15,23,42,0.86), rgba(37,99,235,0.18));
          border-color: rgba(96,165,250,0.22);
        }

        .ops-map-state.has-resolved {
          box-shadow: inset 0 0 0 1px rgba(34,197,94,0.44);
        }

        .pulse-dot {
          position: absolute;
          top: 7px;
          right: 7px;
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: rgb(248,113,113);
          box-shadow: 0 0 0 0 rgba(248,113,113,0.7);
          animation: opsPulse 1.4s infinite;
        }

        @keyframes opsPulse {
          0% { box-shadow: 0 0 0 0 rgba(248,113,113,0.7); }
          70% { box-shadow: 0 0 0 10px rgba(248,113,113,0); }
          100% { box-shadow: 0 0 0 0 rgba(248,113,113,0); }
        }

        .ops-map-legend {
          position: relative;
          z-index: 1;
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 18px;
        }

        .ops-legend-item {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: rgba(226,232,240,0.8);
          font-size: 12px;
        }

        .ops-legend-dot {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: rgba(96,165,250,0.8);
        }

        .ops-legend-dot.critical { background: rgba(248,113,113,0.95); }
        .ops-legend-dot.high { background: rgba(251,146,60,0.95); }
        .ops-legend-dot.elevated { background: rgba(251,191,36,0.95); }
        .ops-legend-dot.resolved { background: rgba(34,197,94,0.95); }

        .ops-map-side {
          display: grid;
          gap: 18px;
        }

        .ops-map-list,
        .ops-feed-list {
          display: grid;
          gap: 12px;
        }

        .ops-map-row {
          border-radius: 18px;
          border: 1px solid rgba(148,163,184,0.16);
          background: linear-gradient(135deg, rgba(15,23,42,0.76), rgba(15,23,42,0.44));
          overflow: hidden;
        }

        .ops-map-row.task-active {
          border-color: rgba(248,113,113,0.36);
        }

        .ops-map-row.task-resolved {
          border-color: rgba(34,197,94,0.34);
        }

        .ops-map-row .vs-responsive-row {
          border: 0;
          background: transparent;
        }

        @media (max-width: 1150px) {
          .ops-map-shell {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 760px) {
          .ops-us-grid {
            grid-template-columns: repeat(6, minmax(40px, 1fr));
            grid-auto-rows: 52px;
          }

          .ops-map-state {
            grid-column: auto !important;
            grid-row: auto !important;
          }
        }
      `}</style>

      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}

      <div className="vs-grid-4">
        <StatCard label="National Heat" value={`${fmtDecimal(summary.national_heat_score || 0)}%`} delta="Live state average" tone={Number(summary.national_heat_score || 0) >= 65 ? "down" : "up"} />
        <StatCard label="Active Escalations" value={fmtNumber(summary.active_escalations || 0)} delta="Open county tasks" tone={summary.active_escalations ? "down" : "up"} />
        <StatCard label="Resolved" value={fmtNumber(summary.resolved_escalations || 0)} delta="Closed escalations" tone="up" />
        <StatCard label="Critical Counties" value={fmtNumber(summary.critical_counties || 0)} delta="Highest pressure" tone={summary.critical_counties ? "down" : "up"} />
      </div>

      <div className="ops-map-shell">
        <div className="ops-map-stage">
          <div className="ops-map-header">
            <div className="ops-map-title">
              <strong>Live U.S. Tactical Operations Overlay</strong>
              <span>State heat cells pulse when county escalation tasks are active.</span>
            </div>

            <div className="ops-layer-tabs">
              {[
                ["heat", "Heat"],
                ["active", "Active"],
                ["resolved", "Resolved"],
              ].map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={`ops-layer-btn ${layer === id ? "is-active" : ""}`}
                  onClick={() => setLayer(id)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <EmptyState text="Loading live tactical operations map..." />
          ) : !mapStates.length ? (
            <EmptyState text="No state map data loaded." />
          ) : (
            <div className="ops-us-grid">
              {mapStates.map((item) => (
                <MapStateCell
                  key={item.state_code}
                  item={item}
                  onOpen={openState}
                />
              ))}
            </div>
          )}

          <div className="ops-map-legend">
            <span className="ops-legend-item"><i className="ops-legend-dot critical" /> Critical</span>
            <span className="ops-legend-item"><i className="ops-legend-dot high" /> High</span>
            <span className="ops-legend-item"><i className="ops-legend-dot elevated" /> Elevated</span>
            <span className="ops-legend-item"><i className="ops-legend-dot" /> Stable</span>
            <span className="ops-legend-item"><i className="ops-legend-dot resolved" /> Resolved task</span>
            <span className="ops-legend-item"><i className="pulse-dot" style={{ position: "relative", top: "auto", right: "auto" }} /> Active escalation</span>
          </div>
        </div>

        <div className="ops-map-side">
          <SectionCard
            title={layer === "active" ? "Active County Escalations" : layer === "resolved" ? "Resolved County Escalations" : "Top Heat Counties"}
            subtitle="County/parish overlays generated from live heat scoring and Command Center sync."
            right={<Badge tone="accent">{sideList.length} shown</Badge>}
          >
            <div className="ops-map-list">
              {!sideList.length ? (
                <EmptyState text="No county overlays for this layer." />
              ) : (
                sideList.slice(0, 12).map((item) => (
                  <CountySignalRow
                    key={item.full_fips || item.id || `${item.state_code}-${item.name}`}
                    item={item}
                    onOpen={openState}
                  />
                ))
              )}
            </div>
          </SectionCard>

          <SectionCard
            title="Live Tactical Feed"
            subtitle="Active escalations and highest-heat counties from the national operations layer."
            right={<Badge tone="danger">{tacticalFeed.length} signals</Badge>}
          >
            <div className="ops-feed-list">
              {!tacticalFeed.length ? (
                <EmptyState text="No live tactical feed signals." />
              ) : (
                tacticalFeed.slice(0, 12).map((item) => (
                  <TacticalFeedRow
                    key={item.id || `${item.state}-${item.title}`}
                    item={item}
                    onOpen={openState}
                  />
                ))
              )}
            </div>
          </SectionCard>

          <SectionCard
            title="Map Actions"
            subtitle="Open deeper State Operations intelligence."
          >
            <div className="vs-inline-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link className="vs-button" to="/state-operations">
                Open State Index
              </Link>
              <button type="button" className="vs-button vs-button-secondary" onClick={() => load({ quiet: true })}>
                Refresh Map
              </button>
            </div>
          </SectionCard>
        </div>
      </div>
    </PageShell>
  );
}
