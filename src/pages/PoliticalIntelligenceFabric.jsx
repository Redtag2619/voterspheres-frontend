import { useEffect, useMemo, useState } from "react";
import { geoPath } from "d3-geo";
import { feature, mesh } from "topojson-client";
import statesTopology from "us-atlas/states-albers-10m.json";
import {
  fetchPoliticalFabricOverview,
  runPoliticalFabricScan,
  createPoliticalFabricBrief,
  savePoliticalFabricWatchlist,
} from "../api/politicalIntelligenceFabricApi";

import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import ResponsiveRow from "../components/ui/ResponsiveRow";

const WORKSPACE_ID = 1;

const FIPS_TO_STATE = {
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

const STATE_NAMES = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas",
  CA: "California", CO: "Colorado", CT: "Connecticut", DE: "Delaware",
  FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho",
  IL: "Illinois", IN: "Indiana", IA: "Iowa", KS: "Kansas",
  KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi",
  MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada",
  NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico", NY: "New York",
  NC: "North Carolina", ND: "North Dakota", OH: "Ohio", OK: "Oklahoma",
  OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
  SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah",
  VT: "Vermont", VA: "Virginia", WA: "Washington", WV: "West Virginia",
  WI: "Wisconsin", WY: "Wyoming", DC: "District of Columbia",
};

const SEVERITY_WEIGHT = { critical: 100, high: 75, medium: 50, low: 25, watch: 15 };

function arr(value) {
  return Array.isArray(value) ? value : [];
}

function number(value, fallback = 0) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function normalizeSeverity(value = "") {
  const next = String(value || "").toLowerCase();
  return Object.prototype.hasOwnProperty.call(SEVERITY_WEIGHT, next) ? next : "watch";
}

function tone(value = "") {
  const next = normalizeSeverity(value);
  if (next === "critical" || next === "high") return "danger";
  if (next === "medium" || next === "watch") return "demo";
  if (next === "low") return "info";
  return "default";
}

function labelize(value = "") {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function resolveFindingStateCode(finding = {}) {
  const candidates = [
    finding.state_code,
    finding.state,
    finding.scope_value,
    finding?.metadata?.state_code,
    finding?.metrics?.state_code,
    finding?.entity?.state_code,
  ];

  for (const value of candidates) {
    const code = String(value || "").trim().toUpperCase();
    if (STATE_NAMES[code]) return code;
  }

  return "";
}

function buildStateHeatmap(findings = []) {
  const stateData = Object.fromEntries(
    Object.keys(STATE_NAMES).map((code) => [
      code,
      {
        code,
        name: STATE_NAMES[code],
        score: 0,
        findingCount: 0,
        criticalCount: 0,
        highCount: 0,
      },
    ])
  );

  findings.forEach((finding) => {
    const code = resolveFindingStateCode(finding);
    if (!code || !stateData[code]) return;

    const severity = normalizeSeverity(finding?.severity);
    const score = Math.max(
      number(finding?.score),
      number(finding?.risk_score),
      number(finding?.signal_score),
      SEVERITY_WEIGHT[severity] || 0
    );

    const current = stateData[code];
    current.findingCount += 1;
    current.score = Math.max(current.score, score);

    if (severity === "critical") current.criticalCount += 1;
    if (severity === "high") current.highCount += 1;
  });

  return stateData;
}

function heatLevel(score = 0) {
  if (score >= 85) return "critical";
  if (score >= 65) return "high";
  if (score >= 40) return "medium";
  if (score > 0) return "low";
  return "none";
}

function NationalHeatmap({ findings, selectedState, onSelectState }) {
  const stateData = useMemo(() => buildStateHeatmap(findings), [findings]);
  const stateFeatures = useMemo(
    () => feature(statesTopology, statesTopology.objects.states).features,
    []
  );
  const stateBorders = useMemo(
    () => mesh(statesTopology, statesTopology.objects.states, (a, b) => a !== b),
    []
  );
  const path = useMemo(() => geoPath(), []);

  const rankedStates = useMemo(
    () =>
      Object.values(stateData)
        .filter((state) => state.findingCount > 0)
        .sort((a, b) => b.score - a.score || b.findingCount - a.findingCount),
    [stateData]
  );

  const mapFill = (level) => {
    if (level === "critical") return "#ef4444";
    if (level === "high") return "#f97316";
    if (level === "medium") return "#f59e0b";
    if (level === "low") return "#3b82f6";
    return "#263449";
  };

  return (
    <SectionCard
      title="Executive Intelligence Heatmap"
      subtitle="Live national political signal distribution by state. Select any state for focused intelligence."
      right={<Badge tone="accent">{rankedStates.length} Active States</Badge>}
    >
      <div className="pif-map-layout">
        <div className="pif-us-map-wrap">
          <svg
            className="pif-us-map"
            viewBox="0 0 975 610"
            role="img"
            aria-label="Color-coded United States political intelligence signal map"
          >
            <rect width="975" height="610" rx="18" className="pif-map-background" />

            {stateFeatures.map((stateFeature) => {
              const fips = String(stateFeature.id).padStart(2, "0");
              const code = FIPS_TO_STATE[fips];
              const state = stateData[code] || {
                code,
                name: code || "Unknown state",
                score: 0,
                findingCount: 0,
              };
              const level = heatLevel(state.score);
              const isSelected = selectedState === code;

              return (
                <path
                  key={fips}
                  d={path(stateFeature)}
                  fill={mapFill(level)}
                  style={{ fill: mapFill(level) }}
                  className={`pif-map-state is-${level} ${isSelected ? "is-selected" : ""}`}
                  onClick={() => code && onSelectState(code)}
                  onKeyDown={(event) => {
                    if ((event.key === "Enter" || event.key === " ") && code) {
                      event.preventDefault();
                      onSelectState(code);
                    }
                  }}
                  tabIndex={code ? 0 : -1}
                  role="button"
                  aria-label={`${state.name}: ${state.findingCount} findings, signal score ${Math.round(state.score)}`}
                >
                  <title>
                    {`${state.name}: ${state.findingCount} finding${state.findingCount === 1 ? "" : "s"}, signal score ${Math.round(state.score)}`}
                  </title>
                </path>
              );
            })}

            <path d={path(stateBorders)} className="pif-map-borders" />
          </svg>

          <div className="pif-legend" aria-label="Signal severity legend">
            <span><i className="none" />No signal</span>
            <span><i className="low" />Low</span>
            <span><i className="medium" />Medium</span>
            <span><i className="high" />High</span>
            <span><i className="critical" />Critical</span>
          </div>
        </div>

        <div className="pif-ranking">
          {rankedStates.length ? (
            rankedStates.slice(0, 8).map((state, index) => (
              <button
                type="button"
                key={state.code}
                className={selectedState === state.code ? "pif-rank-row is-active" : "pif-rank-row"}
                onClick={() => onSelectState(state.code)}
              >
                <span>{index + 1}</span>
                <div>
                  <strong>{state.name}</strong>
                  <small>
                    {state.findingCount} finding{state.findingCount === 1 ? "" : "s"}
                  </small>
                </div>
                <Badge tone={tone(heatLevel(state.score))}>{Math.round(state.score)}</Badge>
              </button>
            ))
          ) : (
            <EmptyState text="Run a national scan to populate the signal map." />
          )}
        </div>
      </div>
    </SectionCard>
  );
}

export default function PoliticalIntelligenceFabric() {
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState(null);
  const [stateCode, setStateCode] = useState("");
  const [scopeType, setScopeType] = useState("national");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadOverview() {
    try {
      setLoading(true);
      setError("");
      const result = await fetchPoliticalFabricOverview(WORKSPACE_ID);
      setData(result);
      setSelected(arr(result?.findings)[0] || null);
    } catch (err) {
      setError(err?.message || "Unable to load Political Intelligence Fabric.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOverview();
  }, []);

  const findings = arr(data?.findings);
  const metrics = data?.metrics || {};
  const watchlist = useMemo(
    () => [...arr(data?.watchlist)].sort((a, b) => String(a.priority).localeCompare(String(b.priority))),
    [data]
  );

  async function handleScan() {
    try {
      setLoading(true);
      setMessage("");
      setError("");

      const result = await runPoliticalFabricScan({
        workspace_id: WORKSPACE_ID,
        scope_type: scopeType,
        scope_value: scopeType === "state" ? stateCode : null,
        state_code: scopeType === "state" ? stateCode : null,
        time_horizon: "30d",
        limit: 75,
      });

      setData((current) => ({
        ...(current || {}),
        ...result,
        watchlist: current?.watchlist || [],
        recent_briefs: current?.recent_briefs || [],
      }));
      setSelected(arr(result?.findings)[0] || null);
      setMessage("Political intelligence scan completed.");
    } catch (err) {
      setError(err?.message || "Unable to run scan.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateBrief() {
    try {
      setMessage("");
      setError("");

      const brief = await createPoliticalFabricBrief({
        workspace_id: WORKSPACE_ID,
        title:
          scopeType === "state" && stateCode
            ? `${STATE_NAMES[stateCode] || stateCode} Political Intelligence Brief`
            : "National Political Intelligence Brief",
        scope_type: scopeType,
        scope_value: scopeType === "state" ? stateCode : null,
        state_code: scopeType === "state" ? stateCode : null,
        time_horizon: "30d",
      });

      setData((current) => ({
        ...current,
        recent_briefs: [brief, ...arr(current?.recent_briefs)],
      }));
      setMessage(`Brief #${brief.id} created.`);
    } catch (err) {
      setError(err?.message || "Unable to create brief.");
    }
  }

  async function handleWatch(finding) {
    try {
      setMessage("");
      setError("");

      const item = await savePoliticalFabricWatchlist({
        workspace_id: WORKSPACE_ID,
        entity_type: finding.entity_type,
        entity_id: String(finding.entity_id || finding.entity_name),
        entity_name: finding.entity_name,
        state_code: finding.state_code,
        priority: finding.severity,
        rationale: finding.summary,
        tags: [finding.category],
      });

      setData((current) => ({
        ...current,
        watchlist: [item, ...arr(current?.watchlist).filter((existing) => existing.id !== item.id)],
      }));
      setMessage(`${finding.entity_name} added to watchlist.`);
    } catch (err) {
      setError(err?.message || "Unable to update watchlist.");
    }
  }

  const tickerItems = [
    { label: "Findings", value: `${metrics.finding_count || findings.length || 0}`, dotClass: "vs-live-dot-success" },
    { label: "Critical", value: `${metrics.critical_count || 0}`, dotClass: metrics.critical_count ? "vs-live-dot-warning" : "vs-live-dot-success" },
    { label: "High", value: `${metrics.high_count || 0}`, dotClass: metrics.high_count ? "vs-live-dot-warning" : "vs-live-dot-success" },
    { label: "Sources", value: `${metrics.healthy_source_count || 0}/${metrics.source_count || 0}`, dotClass: "vs-live-dot-success" },
  ];

  return (
    <PageShell
      eyebrow="Unified Executive Intelligence"
      title="Political Intelligence Fabric"
      description="Unified national, state, candidate, coalition, vendor, finance, influence, execution, and decision intelligence."
      tickerItems={tickerItems}
    >
      <style>{`
        .pif-toolbar{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;flex-wrap:wrap}
        .pif-toolbar-copy{max-width:760px}
        .pif-toolbar-copy h2{margin:0;color:var(--vs-text,#f8fafc);font-size:1.1rem}
        .pif-toolbar-copy p{margin:7px 0 0;color:var(--vs-muted,#94a3b8);line-height:1.6}
        .pif-toolbar-actions{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
        .pif-toolbar-actions select{min-height:42px;border-radius:12px;border:1px solid var(--vs-border,rgba(148,163,184,.18));background:rgba(15,23,42,.78);color:var(--vs-text,#f8fafc);padding:0 12px}
        .pif-grid-2{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(360px,.8fr);gap:18px;align-items:start}
        .pif-grid-3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}
        .pif-stack{display:grid;gap:14px}
        .pif-map-layout{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(300px,.6fr);gap:18px;align-items:start}
        .pif-us-map-wrap{min-width:0}
        .pif-us-map{display:block;width:100%;height:auto;max-height:620px;border:1px solid rgba(148,163,184,.14);border-radius:18px;overflow:hidden}
        .pif-map-background{fill:rgba(2,6,23,.32)}
        .pif-map-state{stroke:rgba(226,232,240,.5);stroke-width:.9;cursor:pointer;transition:opacity .16s ease,filter .16s ease,stroke-width .16s ease}
        .pif-map-state.is-none{fill:#263449!important}
        .pif-map-state.is-low{fill:#3b82f6!important}
        .pif-map-state.is-medium{fill:#f59e0b!important}
        .pif-map-state.is-high{fill:#f97316!important}
        .pif-map-state.is-critical{fill:#ef4444!important}
        .pif-map-state:hover{opacity:.84;filter:brightness(1.16)}
        .pif-map-state:focus{outline:none;filter:brightness(1.2)}
        .pif-map-state.is-selected{stroke:#f8fafc;stroke-width:3;filter:brightness(1.18)}
        .pif-map-borders{fill:none;stroke:rgba(226,232,240,.42);stroke-width:.8;pointer-events:none}
        .pif-legend{display:flex;flex-wrap:wrap;gap:12px;margin-top:14px;color:#94a3b8;font-size:.78rem}
        .pif-legend span{display:flex;align-items:center;gap:6px}.pif-legend i{width:9px;height:9px;border-radius:50%;background:#334155}
        .pif-legend i.low{background:#2563eb}.pif-legend i.medium{background:#d97706}.pif-legend i.high{background:#ea580c}.pif-legend i.critical{background:#dc2626}
        .pif-ranking{display:grid;gap:9px}
        .pif-rank-row{width:100%;display:grid;grid-template-columns:30px 1fr auto;gap:10px;align-items:center;text-align:left;border:1px solid rgba(148,163,184,.14);border-radius:14px;background:rgba(15,23,42,.52);padding:11px;color:#f8fafc;cursor:pointer}
        .pif-rank-row.is-active{border-color:rgba(96,165,250,.62);background:rgba(37,99,235,.12)}
        .pif-rank-row>span{display:grid;place-items:center;width:26px;height:26px;border-radius:9px;background:rgba(59,130,246,.14);font-weight:800}
        .pif-rank-row strong,.pif-rank-row small{display:block}.pif-rank-row small{margin-top:3px;color:#94a3b8}
        .pif-finding{width:100%;border:1px solid rgba(148,163,184,.14);border-radius:16px;background:rgba(15,23,42,.52);padding:0;text-align:left;color:inherit;cursor:pointer;overflow:hidden}
        .pif-finding.is-active{border-color:rgba(96,165,250,.65);box-shadow:0 0 0 2px rgba(59,130,246,.12)}
        .pif-detail-block{border:1px solid rgba(148,163,184,.14);border-radius:16px;background:rgba(15,23,42,.52);padding:16px}
        .pif-detail-block h3{margin:10px 0 8px;color:#fff}.pif-detail-block p{margin:0;color:#cbd5e1;line-height:1.65}
        .pif-score-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:14px}
        .pif-score-grid>div{border:1px solid rgba(148,163,184,.12);border-radius:13px;padding:12px;background:rgba(2,6,23,.35)}
        .pif-score-grid span,.pif-score-grid strong{display:block}.pif-score-grid span{font-size:.72rem;color:#94a3b8;text-transform:uppercase;letter-spacing:.08em}.pif-score-grid strong{margin-top:5px;color:#fff;font-size:1.15rem}
        .pif-json{max-height:220px;overflow:auto;border-radius:14px;background:rgba(2,6,23,.55);padding:14px;color:#cbd5e1;font-size:.75rem}
        .pif-source-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
        .pif-source{display:flex;gap:10px;align-items:center;border:1px solid rgba(148,163,184,.12);border-radius:14px;padding:12px;background:rgba(15,23,42,.5)}
        .pif-dot{width:9px;height:9px;border-radius:50%;background:#64748b}.pif-dot.is-online{background:#22c55e}.pif-dot.is-offline{background:#ef4444}
        .pif-source strong,.pif-source small{display:block}.pif-source strong{color:#f8fafc;text-transform:capitalize}.pif-source small{margin-top:3px;color:#94a3b8}
        .pif-list-card{border:1px solid rgba(148,163,184,.12);border-radius:14px;padding:12px;background:rgba(15,23,42,.5)}
        .pif-list-card strong,.pif-list-card small,.pif-list-card p{display:block}.pif-list-card small{margin-top:4px;color:#94a3b8}.pif-list-card p{margin:8px 0 0;color:#cbd5e1;line-height:1.5}
        @media(max-width:1100px){.pif-grid-2,.pif-map-layout{grid-template-columns:1fr}.pif-grid-3{grid-template-columns:1fr 1fr}}
        @media(max-width:760px){.pif-grid-3,.pif-source-grid,.pif-score-grid{grid-template-columns:1fr}.pif-toolbar-actions{width:100%}.pif-toolbar-actions>*{flex:1 1 180px}.pif-us-map{border-radius:14px}}
      `}</style>

      <div className="pif-stack">
        <SectionCard
          title="Political Intelligence Command"
          subtitle="Run scoped scans, generate executive briefs, and direct the intelligence fabric."
          right={<Badge tone={loading ? "demo" : "active"}>{loading ? "Scanning" : "Live"}</Badge>}
        >
          <div className="pif-toolbar">
            <div className="pif-toolbar-copy">
              <h2>{data?.executive_summary || "Executive political intelligence is ready for review."}</h2>
              <p>{data?.generated_at ? `Last generated ${new Date(data.generated_at).toLocaleString()}` : "Run a scan to refresh the executive intelligence layer."}</p>
            </div>

            <div className="pif-toolbar-actions">
              <select value={scopeType} onChange={(event) => setScopeType(event.target.value)}>
                <option value="national">National</option>
                <option value="state">State</option>
              </select>

              {scopeType === "state" ? (
                <select value={stateCode} onChange={(event) => setStateCode(event.target.value)}>
                  <option value="">Select state</option>
                  {Object.entries(STATE_NAMES).map(([code, name]) => (
                    <option key={code} value={code}>{name}</option>
                  ))}
                </select>
              ) : null}

              <button type="button" className="vs-button vs-button-primary" onClick={handleScan} disabled={loading || (scopeType === "state" && !stateCode)}>
                {loading ? "Scanning Intelligence..." : "Run Intelligence Scan"}
              </button>

              <button type="button" className="vs-button vs-button-secondary" onClick={handleCreateBrief}>
                Create Executive Brief
              </button>
            </div>
          </div>
        </SectionCard>

        {message ? <div className="vs-banner">{message}</div> : null}
        {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}

        <div className="vs-grid-4">
          <StatCard label="Material Findings" value={metrics.finding_count || findings.length || 0} subtext="Ranked executive intelligence signals" />
          <StatCard label="Critical Findings" value={metrics.critical_count || 0} subtext="Immediate executive review required" />
          <StatCard label="High Priority Findings" value={metrics.high_count || 0} subtext="Action recommended within 72 hours" />
          <StatCard label="Connected Source Health" value={`${metrics.healthy_source_count || 0}/${metrics.source_count || 0}`} subtext="Operational intelligence sources online" />
        </div>

        <NationalHeatmap
          findings={findings}
          selectedState={scopeType === "state" ? stateCode : ""}
          onSelectState={(code) => {
            setScopeType("state");
            setStateCode(code);
            setMessage(`${STATE_NAMES[code]} selected for focused intelligence review.`);
          }}
        />

        <div className="pif-grid-2">
          <SectionCard
            title="Political Intelligence Findings"
            subtitle="Ranked cross-module findings requiring executive attention."
            right={<Badge tone="info">{findings.length} Findings</Badge>}
          >
            <div className="pif-stack">
              {loading ? (
                <EmptyState text="Loading political intelligence findings..." />
              ) : findings.length ? (
                findings.map((finding) => (
                  <button
                    type="button"
                    key={`${finding.category}-${finding.rank}-${finding.entity_id}`}
                    className={selected?.rank === finding.rank ? "pif-finding is-active" : "pif-finding"}
                    onClick={() => setSelected(finding)}
                  >
                    <ResponsiveRow
                      title={finding.title}
                      subtitle={finding.summary}
                      meta={[
                        { label: "Rank", value: finding.rank },
                        { label: "Category", value: labelize(finding.category) },
                        { label: "State", value: finding.state_code || "National" },
                        { label: "Score", value: Math.round(number(finding.score)) },
                      ]}
                      right={<Badge tone={tone(finding.severity)}>{labelize(finding.severity)}</Badge>}
                    />
                  </button>
                ))
              ) : (
                <EmptyState text="No material findings detected." />
              )}
            </div>
          </SectionCard>

          <SectionCard
            title="Executive Finding Detail"
            subtitle="Evidence, confidence, metrics, and the recommended monitoring action."
            right={selected ? <Badge tone={tone(selected.severity)}>{labelize(selected.severity)}</Badge> : null}
          >
            {selected ? (
              <div className="pif-stack">
                <div className="pif-detail-block">
                  <h3>{selected.title}</h3>
                  <p>{selected.summary}</p>

                  <div className="pif-score-grid">
                    <div><span>Risk Score</span><strong>{Math.round(number(selected.score))}</strong></div>
                    <div><span>Confidence</span><strong>{Math.round(number(selected.confidence))}%</strong></div>
                    <div><span>State</span><strong>{selected.state_code || "US"}</strong></div>
                  </div>
                </div>

                <div>
                  <div className="vs-page-eyebrow">Finding Metrics</div>
                  <pre className="pif-json">{JSON.stringify(selected.metrics || {}, null, 2)}</pre>
                </div>

                <div className="pif-stack">
                  {arr(selected.evidence).map((item, index) => (
                    <div className="pif-list-card" key={`${item.source}-${index}`}>
                      <strong>{item.label || "Supporting Evidence"}</strong>
                      <small>{item.source || "Political Intelligence Fabric"}</small>
                    </div>
                  ))}
                </div>

                <button type="button" className="vs-button vs-button-primary" onClick={() => handleWatch(selected)}>
                  Add to Executive Watchlist
                </button>
              </div>
            ) : (
              <EmptyState text="Select a finding to inspect its executive context." />
            )}
          </SectionCard>
        </div>

        <div className="pif-grid-3">
          <SectionCard
            title="Source Health"
            subtitle="Connected intelligence systems supporting this fabric."
            right={<Badge tone="active">{Object.keys(data?.source_health || {}).length} Sources</Badge>}
          >
            <div className="pif-source-grid">
              {Object.entries(data?.source_health || {}).map(([source, health]) => (
                <div className="pif-source" key={source}>
                  <span className={health.ok ? "pif-dot is-online" : "pif-dot is-offline"} />
                  <div>
                    <strong>{labelize(source)}</strong>
                    <small>{health.ok ? `${health.count || 0} records` : "Unavailable"}</small>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard
            title="Executive Watchlist"
            subtitle="Persistent monitoring across political entities and states."
            right={<Badge tone="accent">{watchlist.length} Entries</Badge>}
          >
            <div className="pif-stack">
              {watchlist.length ? (
                watchlist.slice(0, 8).map((item) => (
                  <div className="pif-list-card" key={item.id}>
                    <Badge tone={tone(item.priority)}>{labelize(item.priority)}</Badge>
                    <strong style={{ marginTop: 8 }}>{item.entity_name}</strong>
                    <small>{labelize(item.entity_type)} · {item.state_code || "National"}</small>
                  </div>
                ))
              ) : (
                <EmptyState text="No executive watchlist entries." />
              )}
            </div>
          </SectionCard>

          <SectionCard
            title="Recent Executive Briefs"
            subtitle="Generated political intelligence summaries for leadership."
            right={<Badge tone="info">{arr(data?.recent_briefs).length} Briefs</Badge>}
          >
            <div className="pif-stack">
              {arr(data?.recent_briefs).length ? (
                arr(data.recent_briefs).slice(0, 8).map((brief) => (
                  <div className="pif-list-card" key={brief.id}>
                    <strong>{brief.title}</strong>
                    <small>{labelize(brief.scope_type)} · {new Date(brief.created_at).toLocaleDateString()}</small>
                    <p>{brief.executive_summary}</p>
                  </div>
                ))
              ) : (
                <EmptyState text="No saved executive briefs." />
              )}
            </div>
          </SectionCard>
        </div>
      </div>
    </PageShell>
  );
}
