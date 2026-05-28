import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import ResponsiveRow from "../components/ui/ResponsiveRow";

const STATE_COORDS = {
  AL: { x: 610, y: 360 },
  AK: { x: 150, y: 470 },
  AZ: { x: 255, y: 345 },
  AR: { x: 530, y: 340 },
  CA: { x: 145, y: 300 },
  CO: { x: 350, y: 285 },
  CT: { x: 735, y: 210 },
  DE: { x: 715, y: 260 },
  FL: { x: 660, y: 455 },
  GA: { x: 635, y: 375 },
  HI: { x: 300, y: 485 },
  IA: { x: 505, y: 245 },
  ID: { x: 260, y: 185 },
  IL: { x: 545, y: 255 },
  IN: { x: 585, y: 255 },
  KS: { x: 455, y: 305 },
  KY: { x: 600, y: 300 },
  LA: { x: 535, y: 405 },
  MA: { x: 760, y: 195 },
  MD: { x: 700, y: 275 },
  ME: { x: 785, y: 145 },
  MI: { x: 585, y: 205 },
  MN: { x: 495, y: 165 },
  MO: { x: 520, y: 305 },
  MS: { x: 565, y: 385 },
  MT: { x: 315, y: 145 },
  NC: { x: 685, y: 330 },
  ND: { x: 430, y: 145 },
  NE: { x: 440, y: 260 },
  NH: { x: 755, y: 170 },
  NJ: { x: 720, y: 240 },
  NM: { x: 330, y: 350 },
  NV: { x: 195, y: 260 },
  NY: { x: 700, y: 200 },
  OH: { x: 620, y: 250 },
  OK: { x: 455, y: 355 },
  OR: { x: 170, y: 185 },
  PA: { x: 680, y: 235 },
  RI: { x: 770, y: 210 },
  SC: { x: 665, y: 355 },
  SD: { x: 430, y: 205 },
  TN: { x: 585, y: 330 },
  TX: { x: 450, y: 430 },
  UT: { x: 275, y: 285 },
  VA: { x: 685, y: 300 },
  VT: { x: 735, y: 165 },
  WA: { x: 180, y: 125 },
  WI: { x: 535, y: 205 },
  WV: { x: 650, y: 285 },
  WY: { x: 345, y: 225 },
  DC: { x: 705, y: 285 },
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

function StatePulse({ state, selected, onSelect }) {
  const coords = STATE_COORDS[state.state] || null;
  if (!coords) return null;

  const size = Math.max(12, Math.min(42, 12 + Number(state.operational_score || 0) / 3));

  return (
    <button
      type="button"
      className={`ops-map-pulse ${riskClass(state.risk_label)} ${selected ? "is-selected" : ""}`}
      style={{
        left: `${coords.x}px`,
        top: `${coords.y}px`,
        width: `${size}px`,
        height: `${size}px`,
      }}
      onClick={() => onSelect(state)}
      title={`${state.state} • ${state.risk_label} • ${state.operational_score}`}
    >
      <span>{state.state}</span>
    </button>
  );
}

function StateRiskRow({ item, onSelect }) {
  return (
    <div className={`ops-row ${riskClass(item.risk_label)}`}>
      <ResponsiveRow
        title={`${item.state} Operational Pressure`}
        subtitle={`MailOps ${item.mail_risk_jobs || 0}/${item.mail_jobs || 0} risk jobs • Vendor score ${Math.round(Number(item.avg_vendor_score || 0))}`}
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

  const states = useMemo(() => {
    return data?.states || [];
  }, [data]);

  const selected = useMemo(() => {
    if (!selectedState) return states[0] || null;
    return states.find((item) => item.state === selectedState.state) || selectedState;
  }, [selectedState, states]);

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

        .ops-map-label {
          position: absolute;
          left: 28px;
          top: 24px;
          z-index: 2;
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

        .ops-map-pulse {
          position: absolute;
          z-index: 4;
          transform: translate(-50%, -50%);
          display: grid;
          place-items: center;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.28);
          color: white;
          font-size: 10px;
          font-weight: 800;
          cursor: pointer;
          transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
        }

        .ops-map-pulse:hover,
        .ops-map-pulse.is-selected {
          transform: translate(-50%, -50%) scale(1.18);
          border-color: rgba(255,255,255,0.75);
          box-shadow: 0 0 0 6px rgba(255,255,255,0.08), 0 18px 34px rgba(0,0,0,0.28);
        }

        .ops-map-pulse.risk-critical {
          background: rgba(185, 28, 28, 0.92);
          box-shadow: 0 0 0 8px rgba(239, 68, 68, 0.12);
        }

        .ops-map-pulse.risk-high {
          background: rgba(234, 88, 12, 0.92);
          box-shadow: 0 0 0 8px rgba(249, 115, 22, 0.12);
        }

        .ops-map-pulse.risk-elevated {
          background: rgba(202, 138, 4, 0.92);
          box-shadow: 0 0 0 8px rgba(234, 179, 8, 0.12);
        }

        .ops-map-pulse.risk-stable {
          background: rgba(22, 163, 74, 0.88);
          box-shadow: 0 0 0 8px rgba(34, 197, 94, 0.10);
        }

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
            min-height: 560px;
            position: relative;
          }
        }

        @media (min-width: 901px) {
          .ops-map-inner {
            position: relative;
            min-height: 560px;
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
        subtitle="State-level execution pressure generated from MailOps, vendor performance, and executive alert signals."
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
            <div className="ops-map-inner">
              <div className="ops-map-grid" />

              <div className="ops-map-label">
                <h3>Executive Operations Map</h3>
                <p>Current layer: {layer}</p>
              </div>

              {states.map((item) => (
                <StatePulse
                  key={item.state}
                  state={item}
                  selected={selected?.state === item.state}
                  onSelect={setSelectedState}
                />
              ))}
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
          right={<Badge tone="danger">{states.filter((s) => ["Critical", "High"].includes(s.risk_label)).length} urgent</Badge>}
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
