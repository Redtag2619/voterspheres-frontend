import { useEffect, useMemo, useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from "react-simple-maps";
import { api } from "../services/api";

import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import ResponsiveRow from "../components/ui/ResponsiveRow";

const US_TOPO_JSON = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

const STATE_FIPS_TO_ABBR = {
  "01": "AL", "02": "AK", "04": "AZ", "05": "AR", "06": "CA",
  "08": "CO", "09": "CT", "10": "DE", "11": "DC", "12": "FL",
  "13": "GA", "15": "HI", "16": "ID", "17": "IL", "18": "IN",
  "19": "IA", "20": "KS", "21": "KY", "22": "LA", "23": "ME",
  "24": "MD", "25": "MA", "26": "MI", "27": "MN", "28": "MS",
  "29": "MO", "30": "MT", "31": "NE", "32": "NV", "33": "NH",
  "34": "NJ", "35": "NM", "36": "NY", "37": "NC", "38": "ND",
  "39": "OH", "40": "OK", "41": "OR", "42": "PA", "44": "RI",
  "45": "SC", "46": "SD", "47": "TN", "48": "TX", "49": "UT",
  "50": "VT", "51": "VA", "53": "WA", "54": "WV", "55": "WI",
  "56": "WY",
};

const STATE_MARKERS = {
  AL: [-86.8, 32.8], AK: [-152.4, 64.2], AZ: [-111.7, 34.2],
  AR: [-92.4, 34.9], CA: [-119.6, 37.2], CO: [-105.5, 39],
  CT: [-72.7, 41.6], DE: [-75.5, 39], DC: [-77, 38.9],
  FL: [-81.7, 27.8], GA: [-83.4, 32.7], HI: [-157.8, 20.9],
  IA: [-93.5, 42.1], ID: [-114.6, 44.2], IL: [-89.4, 40],
  IN: [-86.1, 40], KS: [-98.3, 38.5], KY: [-85.3, 37.8],
  LA: [-91.9, 31], MA: [-71.8, 42.2], MD: [-76.7, 39],
  ME: [-69.2, 45.2], MI: [-85.5, 44.3], MN: [-94.6, 46.3],
  MO: [-92.5, 38.5], MS: [-89.7, 32.7], MT: [-110.4, 46.9],
  NC: [-79, 35.5], ND: [-100.5, 47.5], NE: [-99.7, 41.5],
  NH: [-71.6, 43.8], NJ: [-74.5, 40.1], NM: [-106, 34.4],
  NV: [-116.6, 39.3], NY: [-75.5, 42.9], OH: [-82.8, 40.2],
  OK: [-97.5, 35.5], OR: [-120.5, 44], PA: [-77.8, 41],
  RI: [-71.5, 41.7], SC: [-80.9, 33.8], SD: [-100, 44.4],
  TN: [-86.4, 35.8], TX: [-99.3, 31.4], UT: [-111.7, 39.3],
  VA: [-78.7, 37.5], VT: [-72.7, 44], WA: [-120.5, 47.4],
  WI: [-89.8, 44.6], WV: [-80.6, 38.6], WY: [-107.5, 43],
};

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

function getStateFill(state) {
  const label = String(state?.risk_label || "").toLowerCase();
  if (label === "critical") return "rgba(220, 38, 38, 0.88)";
  if (label === "high") return "rgba(234, 88, 12, 0.86)";
  if (label === "elevated") return "rgba(202, 138, 4, 0.82)";
  if (label === "stable") return "rgba(22, 163, 74, 0.72)";
  return "rgba(30, 41, 59, 0.82)";
}

function getMarkerRadius(state) {
  return Math.max(4, Math.min(12, 4 + Number(state?.operational_score || 0) / 12));
}

function StateRiskRow({ item, onSelect }) {
  return (
    <div className={`ops-row ${riskClass(item.risk_label)}`}>
      <ResponsiveRow
        title={`${item.state} Operational Pressure`}
        subtitle={`MailOps ${item.mail_risk_jobs || 0}/${item.mail_jobs || 0} risk jobs • Vendor score ${Math.round(
          Number(item.avg_vendor_score || 0)
        )}`}
        meta={[
          { label: "Risk", value: item.risk_label },
          { label: "Score", value: item.operational_score },
          { label: "Signals", value: item.high_signals || 0 },
          { label: "Vendors", value: item.vendors_scored || 0 },
        ]}
        right={
          <button type="button" className="vs-decision-btn deploy" onClick={() => onSelect(item)}>
            Inspect
          </button>
        }
      />
    </div>
  );
}

function AlertRow({ item }) {
  return (
    <div className="ops-alert-row">
      <ResponsiveRow
        title={item.title || "Executive signal"}
        subtitle={`${item.source || "Executive Feed"} • ${item.office || "National"}`}
        meta={[
          { label: "State", value: item.state || "National" },
          { label: "Severity", value: item.severity || item.risk || "Medium" },
        ]}
        right={<Badge tone={riskTone(item.severity || item.risk)}>{item.severity || item.risk || "Signal"}</Badge>}
      />
    </div>
  );
}

export default function ExecutiveOperationsMap() {
  const [data, setData] = useState(null);
  const [selectedState, setSelectedState] = useState(null);
  const [layer, setLayer] = useState("operational");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    try {
      setLoading(true);
      setError("");

      const result = await api.operationsMap?.();
      setData(result || null);

      if (!selectedState && result?.states?.length) {
        setSelectedState(result.states[0]);
      }
    } catch (err) {
      setError(err?.message || "Failed to load Executive Operations Map");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const summary = data?.summary || {};

  const states = useMemo(() => data?.states || [], [data]);

  const stateLookup = useMemo(() => {
    return states.reduce((acc, item) => {
      acc[item.state] = item;
      return acc;
    }, {});
  }, [states]);

  const selected = useMemo(() => {
    if (!selectedState) return states[0] || null;
    return states.find((item) => item.state === selectedState.state) || selectedState;
  }, [selectedState, states]);

  const urgentCount = states.filter((s) => ["Critical", "High"].includes(s.risk_label)).length;

  return (
    <PageShell
      eyebrow="Executive Command"
      title="Executive Operations Map"
      description="Unified operational pressure map across MailOps, vendors, executive alerts, and battleground execution risk."
      tickerItems={[
        { label: "States", value: `${summary.states_tracked || 0} tracked`, dotClass: "vs-live-dot-success" },
        { label: "Critical", value: `${summary.critical_states || 0}`, dotClass: summary.critical_states ? "vs-live-dot" : "vs-live-dot-success" },
        { label: "Mail Jobs", value: `${fmtNumber(summary.total_mail_jobs)}`, dotClass: "vs-live-dot-warning" },
        { label: "Signals", value: `${fmtNumber(summary.total_signals)}`, dotClass: "vs-live-dot" },
      ]}
    >
      <style>{`
        .ops-map-shell {
          position: relative;
          min-height: 560px;
          border-radius: 28px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          background:
            radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.18), transparent 28%),
            radial-gradient(circle at 78% 28%, rgba(239, 68, 68, 0.14), transparent 26%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(2, 6, 23, 0.92));
          overflow: hidden;
          box-shadow: 0 24px 70px rgba(2, 6, 23, 0.35);
        }

        .ops-map-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(148, 163, 184, 0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(148, 163, 184, 0.08) 1px, transparent 1px);
          background-size: 42px 42px;
          mask-image: radial-gradient(circle at center, black, transparent 78%);
        }

        .ops-map-inner {
          position: relative;
          z-index: 2;
          min-height: 560px;
          padding: 74px 22px 24px;
        }

        .ops-map-label {
          position: absolute;
          left: 28px;
          top: 24px;
          z-index: 4;
        }

        .ops-map-label h3 {
          margin: 0;
          font-size: 18px;
          color: #fff;
        }

        .ops-map-label p {
          margin: 6px 0 0;
          color: rgba(203, 213, 225, 0.78);
          font-size: 13px;
        }

        .ops-geo-map {
          width: 100%;
          height: auto;
          filter: drop-shadow(0 28px 38px rgba(0,0,0,0.28));
        }

        .ops-geography {
          outline: none;
          stroke: rgba(226, 232, 240, 0.42);
          stroke-width: 0.55;
          cursor: pointer;
          transition: opacity 160ms ease, filter 160ms ease;
        }

        .ops-geography:hover {
          opacity: 0.92;
          filter: brightness(1.16);
        }

        .ops-geography.is-selected {
          stroke: rgba(255,255,255,0.95);
          stroke-width: 1.35;
          filter: brightness(1.22);
        }

        .ops-marker {
          pointer-events: none;
        }

        .ops-marker-core {
          fill: rgba(255, 255, 255, 0.95);
          stroke-width: 1.5;
        }

        .ops-marker-ring {
          fill: transparent;
          stroke: rgba(255, 255, 255, 0.34);
          stroke-width: 2;
          animation: opsPulse 1.9s ease-out infinite;
        }

        @keyframes opsPulse {
          0% { opacity: 0.85; transform: scale(0.7); }
          100% { opacity: 0; transform: scale(2.2); }
        }

        .ops-map-legend {
          position: absolute;
          right: 22px;
          bottom: 20px;
          z-index: 5;
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          padding: 12px;
          border-radius: 18px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          background: rgba(2, 6, 23, 0.58);
          backdrop-filter: blur(14px);
        }

        .ops-legend-item {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: rgba(226, 232, 240, 0.84);
          font-size: 11px;
          font-weight: 700;
        }

        .ops-legend-dot {
          width: 9px;
          height: 9px;
          border-radius: 999px;
        }

        .ops-legend-dot.critical { background: rgba(220, 38, 38, 0.95); }
        .ops-legend-dot.high { background: rgba(234, 88, 12, 0.95); }
        .ops-legend-dot.elevated { background: rgba(202, 138, 4, 0.95); }
        .ops-legend-dot.stable { background: rgba(22, 163, 74, 0.92); }

        .ops-layer-controls {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .ops-layer-btn {
          border: 1px solid rgba(148, 163, 184, 0.18);
          background: rgba(15, 23, 42, 0.74);
          color: rgba(226, 232, 240, 0.86);
          padding: 10px 12px;
          border-radius: 14px;
          font-size: 12px;
          cursor: pointer;
          text-transform: capitalize;
        }

        .ops-layer-btn.is-active {
          border-color: rgba(96, 165, 250, 0.55);
          color: white;
          background: rgba(37, 99, 235, 0.28);
        }

        .ops-detail-card {
          border: 1px solid rgba(148, 163, 184, 0.16);
          border-radius: 22px;
          background: rgba(15, 23, 42, 0.72);
          padding: 18px;
        }

        .ops-detail-score {
          font-size: 48px;
          font-weight: 900;
          letter-spacing: -0.06em;
          color: white;
        }

        .ops-breakdown {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
          margin-top: 16px;
        }

        .ops-breakdown-item {
          border-radius: 16px;
          border: 1px solid rgba(148, 163, 184, 0.14);
          background: rgba(2, 6, 23, 0.32);
          padding: 12px;
        }

        .ops-breakdown-item span {
          display: block;
          color: rgba(203, 213, 225, 0.68);
          font-size: 11px;
        }

        .ops-breakdown-item strong {
          display: block;
          margin-top: 4px;
          color: white;
          font-size: 18px;
        }

        .ops-row,
        .ops-alert-row {
          border: 1px solid rgba(148, 163, 184, 0.16);
          border-radius: 18px;
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.75), rgba(15, 23, 42, 0.44));
          overflow: hidden;
        }

        .ops-row.risk-critical,
        .ops-row.risk-high {
          border-color: rgba(248, 113, 113, 0.32);
        }

        .ops-row.risk-elevated {
          border-color: rgba(251, 191, 36, 0.28);
        }

        .ops-row .vs-responsive-row,
        .ops-alert-row .vs-responsive-row {
          border: 0;
          background: transparent;
        }

        @media (max-width: 900px) {
          .ops-map-shell {
            overflow-x: auto;
          }

          .ops-map-inner {
            min-width: 860px;
          }

          .ops-breakdown {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}

      <div className="vs-grid-4">
        <StatCard label="States Tracked" value={summary.states_tracked || 0} delta="Operational states" tone="up" />
        <StatCard label="Critical States" value={summary.critical_states || 0} delta="Immediate pressure" tone={summary.critical_states ? "down" : "up"} />
        <StatCard label="MailOps Jobs" value={summary.total_mail_jobs || 0} delta="Tracked mail volume" tone="neutral" />
        <StatCard label="Executive Signals" value={summary.total_signals || 0} delta="Live signal layer" tone="up" />
      </div>

      <SectionCard
        title="National Operational Heat Layer"
        subtitle="Live state-level execution pressure generated from MailOps, vendor performance, and executive alert signals."
        right={
          <div className="ops-layer-controls">
            {["operational", "mailops", "vendors", "alerts"].map((item) => (
              <button
                key={item}
                type="button"
                className={`ops-layer-btn ${layer === item ? "is-active" : ""}`}
                onClick={() => setLayer(item)}
              >
                {item}
              </button>
            ))}
          </div>
        }
      >
        {loading ? (
          <EmptyState text="Loading operations map..." />
        ) : (
          <div className="ops-map-shell">
            <div className="ops-map-grid" />

            <div className="ops-map-label">
              <h3>U.S. Live Geo Command View</h3>
              <p>Click any active state to inspect operational pressure.</p>
            </div>

            <div className="ops-map-inner">
              <ComposableMap
                projection="geoAlbersUsa"
                className="ops-geo-map"
                width={980}
                height={560}
              >
                <Geographies geography={US_TOPO_JSON}>
                  {({ geographies }) =>
                    geographies.map((geo) => {
                      const abbr = STATE_FIPS_TO_ABBR[String(geo.id).padStart(2, "0")];
                      const stateData = stateLookup[abbr];
                      const isSelected = selected?.state === abbr;

                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          className={`ops-geography ${isSelected ? "is-selected" : ""}`}
                          fill={getStateFill(stateData)}
                          onClick={() => {
                            if (stateData) setSelectedState(stateData);
                          }}
                          style={{
                            default: { outline: "none" },
                            hover: { outline: "none" },
                            pressed: { outline: "none" },
                          }}
                        />
                      );
                    })
                  }
                </Geographies>

                {states.map((item) => {
                  const coords = STATE_MARKERS[item.state];
                  if (!coords) return null;

                  const radius = getMarkerRadius(item);

                  return (
                    <Marker key={item.state} coordinates={coords} className="ops-marker">
                      <circle className="ops-marker-ring" r={radius + 6} />
                      <circle
                        className="ops-marker-core"
                        r={radius}
                        stroke={getStateFill(item)}
                      />
                      <text
                        textAnchor="middle"
                        y={radius + 15}
                        style={{
                          fill: "rgba(255,255,255,0.92)",
                          fontSize: 10,
                          fontWeight: 900,
                        }}
                      >
                        {item.state}
                      </text>
                    </Marker>
                  );
                })}
              </ComposableMap>
            </div>

            <div className="ops-map-legend">
              <span className="ops-legend-item"><span className="ops-legend-dot critical" /> Critical</span>
              <span className="ops-legend-item"><span className="ops-legend-dot high" /> High</span>
              <span className="ops-legend-item"><span className="ops-legend-dot elevated" /> Elevated</span>
              <span className="ops-legend-item"><span className="ops-legend-dot stable" /> Stable</span>
            </div>
          </div>
        )}
      </SectionCard>

      <div className="vs-grid-2">
        <SectionCard
          title={selected ? `${selected.state} Command Detail` : "Command Detail"}
          subtitle="Breakdown of operational pressure by signal category."
          right={selected ? <Badge tone={riskTone(selected.risk_label)}>{selected.risk_label}</Badge> : null}
        >
          {!selected ? (
            <EmptyState text="Select a state on the map." />
          ) : (
            <div className="ops-detail-card">
              <div className="ops-detail-score">{selected.operational_score}</div>
              <Badge tone={riskTone(selected.risk_label)}>{selected.risk_label}</Badge>

              <div className="ops-breakdown">
                <div className="ops-breakdown-item">
                  <span>Mail Pressure</span>
                  <strong>{selected.pressure_breakdown?.mail_pressure || 0}</strong>
                </div>
                <div className="ops-breakdown-item">
                  <span>Vendor Pressure</span>
                  <strong>{selected.pressure_breakdown?.vendor_pressure || 0}</strong>
                </div>
                <div className="ops-breakdown-item">
                  <span>Signal Pressure</span>
                  <strong>{selected.pressure_breakdown?.signal_pressure || 0}</strong>
                </div>
              </div>

              <div className="ops-breakdown">
                <div className="ops-breakdown-item">
                  <span>Mail Jobs</span>
                  <strong>{selected.mail_jobs || 0}</strong>
                </div>
                <div className="ops-breakdown-item">
                  <span>Risk Jobs</span>
                  <strong>{selected.mail_risk_jobs || 0}</strong>
                </div>
                <div className="ops-breakdown-item">
                  <span>Vendor Score</span>
                  <strong>{Math.round(Number(selected.avg_vendor_score || 0))}</strong>
                </div>
              </div>
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Highest Pressure States"
          subtitle="Ranked operational pressure across the current map."
          right={<Badge tone="danger">{urgentCount} urgent</Badge>}
        >
          <div className="vs-stack">
            {!states.length ? (
              <EmptyState text="No state pressure detected yet." />
            ) : (
              states.slice(0, 8).map((item) => (
                <StateRiskRow key={item.state} item={item} onSelect={setSelectedState} />
              ))
            )}
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Executive Signal Layer"
        subtitle="Most recent executive alerts contributing to the operations map."
        right={<Badge tone="accent">{data?.alerts?.length || 0} signals</Badge>}
      >
        <div className="vs-stack">
          {!data?.alerts?.length ? (
            <EmptyState text="No executive signals available." />
          ) : (
            data.alerts.slice(0, 10).map((item) => (
              <AlertRow key={item.id} item={item} />
            ))
          )}
        </div>
      </SectionCard>
    </PageShell>
  );
}
