import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../services/api";

import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import ResponsiveRow from "../components/ui/ResponsiveRow";

const result =
  typeof api.stateOperationsDrilldown === "function"
    ? await api.stateOperationsDrilldown(stateCode)
    : null;

if (!result) {
  throw new Error("State operations endpoint is not available.");
}

setData(result);

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

function openPath(path) {
  window.location.href = path;
}

function buildRecommendation(state, county) {
  if (!county) return `Select a county or parish in ${state} to generate a tactical recommendation.`;

  if (county.risk === "Critical") {
    return `${county.name} is in critical execution pressure. Deploy vendor support, inspect MailOps risk jobs, and create a Command Center task immediately.`;
  }

  if (county.risk === "High") {
    return `${county.name} is showing high pressure. Review vendor capacity and active field/mail signals before the next refresh.`;
  }

  if (county.risk === "Elevated") {
    return `${county.name} should be monitored closely. Keep tactical readiness active and watch DMA movement.`;
  }

  return `${county.name} is currently stable. Continue monitoring county-level signals.`;
}

function CountyCard({ item, selected, onSelect }) {
  return (
    <button
      type="button"
      className={`state-county-card ${riskClass(item.risk)} ${selected ? "is-selected" : ""}`}
      onClick={() => onSelect(item)}
    >
      <div className="state-county-head">
        <div>
          <strong>{item.name}</strong>
          <span>{item.type || "County"} • {item.dma || "Local DMA"}</span>
        </div>
        <Badge tone={riskTone(item.risk)}>{item.risk}</Badge>
      </div>

      <div className="state-pressure-bar">
        <i style={{ width: `${Math.min(100, Number(item.pressure || 0))}%` }} />
      </div>

      <div className="state-county-metrics">
        <span>Pressure <b>{item.pressure}</b></span>
        <span>MailOps <b>{item.mail_jobs || 0}</b></span>
        <span>Vendors <b>{item.vendor_score || 0}</b></span>
        <span>Alerts <b>{item.alerts || 0}</b></span>
      </div>
    </button>
  );
}

function DmaRow({ item }) {
  return (
    <div className={`state-dma-row ${riskClass(item.risk)}`}>
      <ResponsiveRow
        title={item.name}
        subtitle={`${item.counties || 0} counties/parishes • ${item.market_type || "Media market"}`}
        meta={[
          { label: "Risk", value: item.risk },
          { label: "Pressure", value: item.pressure },
          { label: "MailOps", value: item.mail_jobs || 0 },
          { label: "Vendor", value: item.vendor_score || 0 },
        ]}
        right={<Badge tone={riskTone(item.risk)}>{item.risk}</Badge>}
      />
    </div>
  );
}

function AlertRow({ item }) {
  return (
    <div className="state-alert-row">
      <ResponsiveRow
        title={item.title || "County signal"}
        subtitle={`${item.source || "Executive Feed"} • ${item.county || item.state || "Statewide"}`}
        meta={[
          { label: "Severity", value: item.severity || item.risk || "Signal" },
          { label: "Layer", value: item.layer || "Operations" },
        ]}
        right={<Badge tone={riskTone(item.severity || item.risk)}>{item.severity || item.risk || "Signal"}</Badge>}
      />
    </div>
  );
}

export default function StateOperationsDrilldown() {
  const { state } = useParams();
  const stateCode = String(state || "").toUpperCase();

  const [data, setData] = useState(null);
  const [selectedCounty, setSelectedCounty] = useState(null);
  const [layer, setLayer] = useState("county");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");

  async function load({ quiet = false } = {}) {
    try {
      if (quiet) setRefreshing(true);
      else setLoading(true);

      setError("");

      const result =
        typeof api.stateOperationsDrilldown === "function"
          ? await api.stateOperationsDrilldown(stateCode)
          : null;

      const fallback = {
        summary: {
          counties_tracked: SAMPLE_COUNTIES.length,
          critical_counties: SAMPLE_COUNTIES.filter((c) => c.risk === "Critical").length,
          total_mail_jobs: SAMPLE_COUNTIES.reduce((sum, c) => sum + Number(c.mail_jobs || 0), 0),
          total_alerts: SAMPLE_COUNTIES.reduce((sum, c) => sum + Number(c.alerts || 0), 0),
          vendor_gap_count: SAMPLE_COUNTIES.filter((c) => Number(c.vendor_score || 0) < 60).length,
        },
        counties: SAMPLE_COUNTIES,
        dmas: [
          { name: "Birmingham DMA", counties: 3, risk: "Critical", pressure: 82, mail_jobs: 24, vendor_score: 48, market_type: "Media + turnout" },
          { name: "Mobile-Pensacola DMA", counties: 1, risk: "High", pressure: 73, mail_jobs: 12, vendor_score: 55, market_type: "Coastal media" },
          { name: "Montgomery-Selma DMA", counties: 1, risk: "High", pressure: 66, mail_jobs: 10, vendor_score: 61, market_type: "Capital region" },
          { name: "Huntsville DMA", counties: 1, risk: "Elevated", pressure: 51, mail_jobs: 8, vendor_score: 70, market_type: "North state" },
        ],
        alerts: [
          { id: "a1", title: "MailOps risk spike detected", county: "Jefferson", severity: "Critical", source: "MailOps", layer: "Mail" },
          { id: "a2", title: "Vendor readiness below target", county: "Mobile", severity: "High", source: "Vendor Network", layer: "Vendors" },
          { id: "a3", title: "DMA pressure rising", county: "Montgomery", severity: "High", source: "Executive Feed", layer: "Media" },
        ],
      };

      const nextData = result || fallback;
      setData(nextData);

      if (!selectedCounty && nextData?.counties?.length) {
        setSelectedCounty(nextData.counties[0]);
      }

      setLastUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    } catch (err) {
      setError(err?.message || `Failed to load ${stateCode} operations drilldown`);
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
  }, [stateCode]);

  const summary = data?.summary || {};
  const counties = data?.counties || [];
  const dmas = data?.dmas || [];
  const alerts = data?.alerts || [];

  const selected = useMemo(() => {
    if (!selectedCounty) return counties[0] || null;
    return counties.find((item) => item.name === selectedCounty.name) || selectedCounty;
  }, [selectedCounty, counties]);

  const pressureAverage = Math.round(
    counties.length
      ? counties.reduce((sum, item) => sum + Number(item.pressure || 0), 0) / counties.length
      : 0
  );

  const urgentCount = counties.filter((item) => ["Critical", "High"].includes(item.risk)).length;

  return (
    <PageShell
      eyebrow="State Command"
      title={`${stateCode} Operations Drilldown`}
      description="County, parish, DMA, vendor, MailOps, and executive signal readiness for state-level campaign execution."
      tickerItems={[
        { label: "Pressure", value: `${pressureAverage}%`, dotClass: pressureAverage >= 65 ? "vs-live-dot" : "vs-live-dot-success" },
        { label: "Urgent", value: `${urgentCount} counties`, dotClass: urgentCount ? "vs-live-dot-warning" : "vs-live-dot-success" },
        { label: "Vendor Gaps", value: `${summary.vendor_gap_count || 0}`, dotClass: summary.vendor_gap_count ? "vs-live-dot-warning" : "vs-live-dot-success" },
        { label: "Updated", value: lastUpdated || "Live", dotClass: refreshing ? "vs-live-dot-warning" : "vs-live-dot-success" },
      ]}
    >
      <style>{`
        .state-drilldown-controls {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .state-layer-btn {
          border: 1px solid rgba(148, 163, 184, 0.18);
          background: rgba(15, 23, 42, 0.74);
          color: rgba(226, 232, 240, 0.86);
          padding: 10px 12px;
          border-radius: 14px;
          font-size: 12px;
          cursor: pointer;
        }

        .state-layer-btn.is-active {
          border-color: rgba(96, 165, 250, 0.62);
          color: white;
          background: rgba(37, 99, 235, 0.32);
          box-shadow: 0 0 0 4px rgba(37,99,235,0.1);
        }

        .state-command-layout {
          display: grid;
          grid-template-columns: minmax(0, 1.45fr) minmax(340px, 0.8fr);
          gap: 18px;
          align-items: start;
        }

        .state-county-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .state-county-card {
          text-align: left;
          border-radius: 22px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          background:
            radial-gradient(circle at top right, rgba(59, 130, 246, 0.12), transparent 36%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.82), rgba(2, 6, 23, 0.62));
          padding: 16px;
          cursor: pointer;
          transition: transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
        }

        .state-county-card:hover,
        .state-county-card.is-selected {
          transform: translateY(-2px);
          border-color: rgba(96, 165, 250, 0.48);
          box-shadow: 0 18px 45px rgba(2, 6, 23, 0.25);
        }

        .state-county-card.risk-critical {
          border-color: rgba(248, 113, 113, 0.32);
        }

        .state-county-card.risk-high {
          border-color: rgba(251, 146, 60, 0.28);
        }

        .state-county-card.risk-elevated {
          border-color: rgba(251, 191, 36, 0.24);
        }

        .state-county-head {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: flex-start;
        }

        .state-county-head strong {
          display: block;
          color: white;
          font-size: 16px;
          font-weight: 900;
        }

        .state-county-head span {
          display: block;
          margin-top: 5px;
          color: rgba(203, 213, 225, 0.66);
          font-size: 12px;
        }

        .state-pressure-bar {
          margin-top: 15px;
          height: 8px;
          border-radius: 999px;
          background: rgba(15, 23, 42, 0.85);
          overflow: hidden;
        }

        .state-pressure-bar i {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, rgba(59,130,246,0.9), rgba(239,68,68,0.9));
        }

        .state-county-metrics {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 8px;
          margin-top: 14px;
        }

        .state-county-metrics span {
          display: block;
          color: rgba(203, 213, 225, 0.62);
          font-size: 11px;
        }

        .state-county-metrics b {
          display: block;
          margin-top: 3px;
          color: white;
          font-size: 14px;
        }

        .state-intel-panel {
          position: sticky;
          top: 18px;
          border-radius: 28px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          background:
            radial-gradient(circle at top right, rgba(59, 130, 246, 0.14), transparent 34%),
            linear-gradient(145deg, rgba(15, 23, 42, 0.92), rgba(2, 6, 23, 0.82));
          box-shadow: 0 28px 80px rgba(2, 6, 23, 0.28);
          padding: 18px;
        }

        .state-panel-top {
          display: flex;
          justify-content: space-between;
          gap: 14px;
          align-items: flex-start;
          margin-bottom: 16px;
        }

        .state-kicker {
          display: block;
          color: rgba(96, 165, 250, 0.88);
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .state-panel-top h3 {
          margin: 6px 0 0;
          color: white;
          font-size: 20px;
          letter-spacing: -0.04em;
        }

        .state-panel-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .state-panel-grid div {
          border-radius: 18px;
          border: 1px solid rgba(148, 163, 184, 0.14);
          background: rgba(2, 6, 23, 0.35);
          padding: 13px;
        }

        .state-panel-grid span {
          display: block;
          color: rgba(203, 213, 225, 0.65);
          font-size: 11px;
          font-weight: 800;
        }

        .state-panel-grid strong {
          display: block;
          margin-top: 5px;
          color: white;
          font-size: 20px;
          font-weight: 950;
        }

        .state-ai-card {
          margin-top: 14px;
          border-radius: 20px;
          border: 1px solid rgba(96, 165, 250, 0.22);
          background: linear-gradient(135deg, rgba(37, 99, 235, 0.18), rgba(15, 23, 42, 0.44));
          padding: 15px;
        }

        .state-ai-card span {
          display: block;
          color: rgba(147, 197, 253, 0.9);
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .state-ai-card p {
          margin: 8px 0 0;
          color: rgba(226, 232, 240, 0.9);
          font-size: 13px;
          line-height: 1.55;
        }

        .state-action-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
          margin-top: 14px;
        }

        .state-action-grid button {
          border: 1px solid rgba(148, 163, 184, 0.18);
          background: rgba(15, 23, 42, 0.74);
          color: rgba(226, 232, 240, 0.92);
          border-radius: 15px;
          padding: 11px 10px;
          font-size: 12px;
          font-weight: 850;
          cursor: pointer;
        }

        .state-action-grid button:hover {
          border-color: rgba(96, 165, 250, 0.48);
          background: rgba(37, 99, 235, 0.24);
          color: white;
        }

        .state-dma-row,
        .state-alert-row {
          border: 1px solid rgba(148, 163, 184, 0.16);
          border-radius: 18px;
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.75), rgba(15, 23, 42, 0.44));
          overflow: hidden;
        }

        .state-dma-row.risk-critical,
        .state-dma-row.risk-high {
          border-color: rgba(248, 113, 113, 0.32);
        }

        .state-dma-row .vs-responsive-row,
        .state-alert-row .vs-responsive-row {
          border: 0;
          background: transparent;
        }

        @media (max-width: 1100px) {
          .state-command-layout {
            grid-template-columns: 1fr;
          }

          .state-intel-panel {
            position: relative;
            top: auto;
          }
        }

        @media (max-width: 800px) {
          .state-county-grid,
          .state-county-metrics,
          .state-panel-grid,
          .state-action-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}

      <div className="vs-grid-4">
        <StatCard label="Counties Tracked" value={summary.counties_tracked || counties.length || 0} delta="County/parish readiness" tone="up" />
        <StatCard label="Critical Counties" value={summary.critical_counties || 0} delta="Immediate action" tone={summary.critical_counties ? "down" : "up"} />
        <StatCard label="MailOps Jobs" value={fmtNumber(summary.total_mail_jobs || 0)} delta="County-level mail" tone="neutral" />
        <StatCard label="Executive Alerts" value={summary.total_alerts || alerts.length || 0} delta="Live tactical signals" tone="up" />
      </div>

      <SectionCard
        title={`${stateCode} County / Parish Tactical Grid`}
        subtitle="County-level pressure, vendor coverage, MailOps activity, DMA exposure, and executive signal readiness."
        right={
          <div className="state-drilldown-controls">
            {["county", "dma", "vendors", "mailops", "alerts", "ai"].map((item) => (
              <button
                key={item}
                type="button"
                className={`state-layer-btn ${layer === item ? "is-active" : ""}`}
                onClick={() => setLayer(item)}
              >
                {item}
              </button>
            ))}
          </div>
        }
      >
        {loading ? (
          <EmptyState text={`Loading ${stateCode} drilldown...`} />
        ) : (
          <div className="state-command-layout">
            <div className="state-county-grid">
              {!counties.length ? (
                <EmptyState text="No county or parish intelligence available yet." />
              ) : (
                counties.map((item) => (
                  <CountyCard
                    key={item.name}
                    item={item}
                    selected={selected?.name === item.name}
                    onSelect={setSelectedCounty}
                  />
                ))
              )}
            </div>

            <aside className="state-intel-panel">
              <div className="state-panel-top">
                <div>
                  <span className="state-kicker">County Intelligence</span>
                  <h3>{selected ? selected.name : stateCode}</h3>
                </div>
                {selected ? <Badge tone={riskTone(selected.risk)}>{selected.risk}</Badge> : null}
              </div>

              {selected ? (
                <>
                  <div className="state-panel-grid">
                    <div>
                      <span>Pressure</span>
                      <strong>{selected.pressure || 0}</strong>
                    </div>
                    <div>
                      <span>DMA</span>
                      <strong>{selected.dma || "—"}</strong>
                    </div>
                    <div>
                      <span>MailOps</span>
                      <strong>{selected.mail_jobs || 0}</strong>
                    </div>
                    <div>
                      <span>Vendor</span>
                      <strong>{selected.vendor_score || 0}</strong>
                    </div>
                  </div>

                  <div className="state-ai-card">
                    <span>AI Recommendation</span>
                    <p>{buildRecommendation(stateCode, selected)}</p>
                  </div>

                  <div className="state-action-grid">
                    <button type="button" onClick={() => openPath("/command-center")}>Create Command Task</button>
                    <button type="button" onClick={() => openPath(`/vendors?state=${stateCode}&source=state-drilldown`)}>View Vendors</button>
                    <button type="button" onClick={() => openPath("/warroom")}>Escalate War Room</button>
                    <button type="button" onClick={() => load({ quiet: true })}>Refresh Intel</button>
                  </div>
                </>
              ) : (
                <EmptyState text="Select a county or parish." />
              )}
            </aside>
          </div>
        )}
      </SectionCard>

      <div className="vs-grid-2">
        <SectionCard
          title="DMA / Media Market Readiness"
          subtitle="Media market pressure, county coverage, vendor readiness, and MailOps exposure."
          right={<Badge tone="accent">{dmas.length} markets</Badge>}
        >
          <div className="vs-stack">
            {!dmas.length ? (
              <EmptyState text="No DMA intelligence available yet." />
            ) : (
              dmas.map((item) => <DmaRow key={item.name} item={item} />)
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="County-Level Executive Signals"
          subtitle="Live signals contributing to the state drilldown model."
          right={<Badge tone="danger">{alerts.length} signals</Badge>}
        >
          <div className="vs-stack">
            {!alerts.length ? (
              <EmptyState text="No county-level signals available." />
            ) : (
              alerts.map((item) => <AlertRow key={item.id || item.title} item={item} />)
            )}
          </div>
        </SectionCard>
      </div>
    </PageShell>
  );
}
