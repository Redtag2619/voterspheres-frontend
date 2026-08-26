import { useEffect, useMemo, useState } from "react";

import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";

 

import {

  fetchPoliticalFabricOverview,

  runPoliticalFabricScan,

  createPoliticalFabricBrief,

  savePoliticalFabricWatchlist,

  getPoliticalFabricWorkspaceId,

} from "../api/politicalIntelligenceFabricApi";

 

import PageShell from "../components/ui/PageShell";

import SectionCard from "../components/ui/SectionCard";

import StatCard from "../components/ui/StatCard";

import Badge from "../components/ui/Badge";

import EmptyState from "../components/ui/EmptyState";

 

import "./PoliticalIntelligenceFabric.css";

 

const US_STATES_TOPOJSON =

  "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

 

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

 

const STATE_SIGNAL_CENTERS = {

  AL: [-86.8, 32.8], AK: [-152.4, 64.2], AZ: [-111.9, 34.3], AR: [-92.4, 34.9],

  CA: [-119.6, 37.2], CO: [-105.5, 39.0], CT: [-72.7, 41.6], DE: [-75.5, 39.0],

  FL: [-82.5, 28.2], GA: [-83.4, 32.7], HI: [-157.5, 20.8], ID: [-114.6, 44.2],

  IL: [-89.2, 40.0], IN: [-86.1, 40.0], IA: [-93.5, 42.1], KS: [-98.3, 38.5],

  KY: [-84.9, 37.5], LA: [-92.0, 31.0], ME: [-69.2, 45.2], MD: [-76.7, 39.0],

  MA: [-71.8, 42.3], MI: [-85.5, 44.3], MN: [-94.3, 46.0], MS: [-89.7, 32.7],

  MO: [-92.5, 38.4], MT: [-109.6, 47.0], NE: [-99.8, 41.5], NV: [-116.7, 39.3],

  NH: [-71.6, 43.8], NJ: [-74.5, 40.1], NM: [-106.0, 34.5], NY: [-75.0, 43.0],

  NC: [-79.4, 35.5], ND: [-100.5, 47.5], OH: [-82.8, 40.3], OK: [-97.5, 35.6],

  OR: [-120.6, 44.0], PA: [-77.7, 41.0], RI: [-71.5, 41.7], SC: [-80.9, 33.8],

  SD: [-100.2, 44.5], TN: [-86.4, 35.8], TX: [-99.3, 31.3], UT: [-111.7, 39.3],

  VT: [-72.7, 44.0], VA: [-78.6, 37.6], WA: [-120.7, 47.4], WV: [-80.6, 38.6],

  WI: [-89.8, 44.6], WY: [-107.6, 43.0], DC: [-77.04, 38.91],

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

  WI: "Wisconsin", WY: "Wyoming", DC: "Washington, D.C.",

};

 

const SEVERITY_WEIGHT = {

  critical: 100,

  high: 75,

  medium: 50,

  low: 25,

  watch: 15,

};

 

function array(value) {

  return Array.isArray(value) ? value : [];

}

 

function number(value, fallback = 0) {

  const next = Number(value);

  return Number.isFinite(next) ? next : fallback;

}

 

function text(value, fallback = "—") {

  const next = String(value ?? "").trim();

  return next || fallback;

}

 

function titleCase(value = "") {

  return String(value)

    .replaceAll("_", " ")

    .replaceAll("-", " ")

    .replace(/\b\w/g, (letter) => letter.toUpperCase());

}

 

function normalizeSeverity(value = "") {

  const severity = String(value).toLowerCase();

  return Object.prototype.hasOwnProperty.call(SEVERITY_WEIGHT, severity)

    ? severity

    : "watch";

}

 

function getFindingStateCode(finding = {}) {

  return String(

    finding?.state_code ||

      finding?.stateCode ||

      finding?.state ||

      finding?.jurisdiction_code ||

      finding?.jurisdiction ||

      ""

  )

    .trim()

    .toUpperCase()

    .slice(0, 2);

}

 

function sourceHealthStatus(health = {}) {

  if (!health?.ok) return "offline";

  if (health?.degraded) return "degraded";

  if (number(health?.count) <= 0) return "empty";

  return "online";

}

 

function severityTone(value = "") {

  const severity = normalizeSeverity(value);

  if (severity === "critical") return "danger";

  if (severity === "high") return "warning";

  if (severity === "medium") return "demo";

  if (severity === "low") return "info";

  return "default";

}

 

function findingKey(finding, index) {

  return (

    finding?.id ||

    finding?.finding_id ||

    `${finding?.category || "finding"}-${finding?.rank || index}-${finding?.entity_id || finding?.entity_name || index}`

  );

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

        topFinding: null,

      },

    ])

  );

 

  findings.forEach((finding) => {

    const code = getFindingStateCode(finding);

 

    if (!stateData[code]) return;

 

    const severity = normalizeSeverity(

      finding?.severity ||

        finding?.risk_level ||

        finding?.priority ||

        finding?.status

    );

 

    const score = Math.max(

      number(finding?.score),

      number(finding?.signal_score),

      number(finding?.risk_score),

      number(finding?.priority_score),

      SEVERITY_WEIGHT[severity] || 0

    );

 

    const current = stateData[code];

    current.findingCount += 1;

    current.score = Math.max(current.score, score);

 

    if (severity === "critical") current.criticalCount += 1;

    if (severity === "high") current.highCount += 1;

 

    const currentTopScore = current.topFinding

      ? Math.max(

          number(current.topFinding?.score),

          number(current.topFinding?.signal_score),

          number(current.topFinding?.risk_score),

          SEVERITY_WEIGHT[

            normalizeSeverity(current.topFinding?.severity)

          ] || 0

        )

      : -1;

 

    if (!current.topFinding || score > currentTopScore) {

      current.topFinding = finding;

    }

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

 

function NationalHeatmap({

  findings = [],

  selectedState = "",

  onSelectState,

}) {

  const stateData = useMemo(() => buildStateHeatmap(findings), [findings]);

 

  const rankedStates = useMemo(

    () =>

      Object.values(stateData)

        .filter((state) => state.findingCount > 0)

        .sort(

          (a, b) =>

            b.score - a.score ||

            b.findingCount - a.findingCount ||

            a.code.localeCompare(b.code)

        ),

    [stateData]

  );

 

  const criticalStates = rankedStates.filter((state) => state.score >= 85).length;

  const highStates = rankedStates.filter(

    (state) => state.score >= 65 && state.score < 85

  ).length;

 

  function stateFill(state, selected = false) {

    if (selected) return "#0ea5e9";

    const level = heatLevel(state?.score || 0);

    if (level === "critical") return "#b91c1c";

    if (level === "high") return "#c2410c";

    if (level === "medium") return "#a16207";

    if (level === "low") return "#0e7490";

    return "#1e293b";

  }

 

  return (

    <div className="pif-map-layout">

      <div className="pif-map-shell">

        <div className="pif-geo-map" role="img" aria-label="United States political intelligence map by state and Washington, D.C.">

          <ComposableMap

            projection="geoAlbersUsa"

            projectionConfig={{ scale: 1020 }}

            width={980}

            height={590}

          >

            <Geographies geography={US_STATES_TOPOJSON}>

              {({ geographies }) =>

                geographies.map((geo) => {

                  const fips = String(geo.id).padStart(2, "0");

                  const code = FIPS_TO_STATE[fips];

                  if (!code) return null;

 

                  const state = stateData[code];

                  const selected = selectedState === code;

 

                  return (

                    <Geography

                      key={geo.rsmKey}

                      geography={geo}

                      onClick={() => onSelectState(code)}

                      tabIndex={0}

                      role="button"

                      aria-label={`${STATE_NAMES[code]}, ${state?.findingCount || 0} signals, intelligence score ${Math.round(state?.score || 0)}`}

                      onKeyDown={(event) => {

                        if (event.key === "Enter" || event.key === " ") {

                          event.preventDefault();

                          onSelectState(code);

                        }

                      }}

                      style={{

                        default: {

                          fill: stateFill(state, selected),

                          stroke: selected ? "#f8fafc" : "#64748b",

                          strokeWidth: selected ? 1.8 : 0.65,

                          outline: "none",

                          cursor: "pointer",

                        },

                        hover: {

                          fill: selected ? "#38bdf8" : "#334155",

                          stroke: "#e2e8f0",

                          strokeWidth: 1.3,

                          outline: "none",

                          cursor: "pointer",

                        },

                        pressed: {

                          fill: "#0284c7",

                          stroke: "#f8fafc",

                          strokeWidth: 1.4,

                          outline: "none",

                        },

                      }}

                    >

                      <title>{`${STATE_NAMES[code]}: ${state?.findingCount || 0} signals, score ${Math.round(state?.score || 0)}`}</title>

                    </Geography>

                  );

                })

              }

            </Geographies>

 

            {Object.entries(STATE_SIGNAL_CENTERS).map(([code, coordinates]) => {

              const state = stateData[code];

              const isSelected = selectedState === code;

              const count = state?.findingCount || 0;

 

              return (

                <Marker key={code} coordinates={coordinates}>

                  <g

                    className={`pif-map-signal ${count ? "has-signal" : "is-zero"} ${isSelected ? "is-selected" : ""}`}

                    onClick={() => onSelectState(code)}

                    role="button"

                    tabIndex={0}

                    aria-label={`${STATE_NAMES[code]}, ${count} political intelligence signals`}

                    onKeyDown={(event) => {

                      if (event.key === "Enter" || event.key === " ") {

                        event.preventDefault();

                        onSelectState(code);

                      }

                    }}

                  >

                    <circle r={count ? 10 : 6} />

                    <text textAnchor="middle" y={3.2}>{count}</text>

                    <title>{`${STATE_NAMES[code]}: ${count} signals`}</title>

                  </g>

                </Marker>

              );

            })}

          </ComposableMap>

        </div>

 

        <div className="pif-map-footer">

          <div className="pif-map-legend" aria-label="Heatmap legend">

            <span><i className="is-none" /> No signal</span>

            <span><i className="is-low" /> Low</span>

            <span><i className="is-medium" /> Medium</span>

            <span><i className="is-high" /> High</span>

            <span><i className="is-critical" /> Critical</span>

          </div>

 

          <div className="pif-map-summary">

            <span>{rankedStates.length} active states</span>

            <span>{criticalStates} critical</span>

            <span>{highStates} high</span>

            <span>51 jurisdictions including D.C.</span>

          </div>

        </div>

      </div>

 

      <div className="pif-ranking">

        <div className="pif-ranking-header">

          <div>

            <span className="vs-page-eyebrow">State Priority</span>

            <strong>Highest-priority states</strong>

          </div>

          <Badge tone="accent">{rankedStates.length} active</Badge>

        </div>

 

        <div className="pif-ranking-list">

          {rankedStates.slice(0, 8).map((state, index) => (

            <button

              type="button"

              key={state.code}

              onClick={() => onSelectState(state.code)}

              className={selectedState === state.code ? "is-active" : ""}

            >

              <span className={`pif-rank is-${heatLevel(state.score)}`}>

                {index + 1}

              </span>

 

              <div>

                <strong>{state.name}</strong>

                <small>

                  {state.findingCount} finding

                  {state.findingCount === 1 ? "" : "s"}

                  {state.criticalCount

                    ? ` · ${state.criticalCount} critical`

                    : state.highCount

                      ? ` · ${state.highCount} high`

                      : ""}

                </small>

              </div>

 

              <b>{Math.round(state.score)}</b>

            </button>

          ))}

 

          {!rankedStates.length ? (

            <EmptyState text="Run a national scan to populate state intelligence." />

          ) : null}

        </div>

      </div>

    </div>

  );

}

 

function SourceHealth({ sourceHealth = {} }) {

  const entries = Object.entries(sourceHealth || {});

 

  if (!entries.length) {

    return <EmptyState text="No source-health records are available." />;

  }

 

  const toneForStatus = {

    online: "active",

    empty: "warning",

    degraded: "warning",

    offline: "danger",

  };

 

  const labelForStatus = {

    online: "Online",

    empty: "Connected, no records",

    degraded: "Degraded",

    offline: "Offline",

  };

 

  return (

    <div className="pif-source-list">

      {entries.map(([source, health]) => {

        const status = sourceHealthStatus(health);

 

        return (

          <div className="pif-source-row" key={source}>

            <span

              className={

                status === "online"

                  ? "pif-status-dot is-online"

                  : status === "empty" || status === "degraded"

                    ? "pif-status-dot is-warning"

                    : "pif-status-dot is-offline"

              }

            />

 

            <div>

              <strong>{titleCase(source)}</strong>

              <small>

                {status === "online"

                  ? `${number(health?.count)} live records connected`

                  : status === "empty"

                    ? "Source connected successfully but returned no records"

                    : status === "degraded"

                      ? health?.error || "Source responded with limited availability"

                      : health?.error || "Source unavailable"}

              </small>

            </div>

 

            <Badge tone={toneForStatus[status]}>

              {labelForStatus[status]}

            </Badge>

          </div>

        );

      })}

    </div>

  );

}

 

function FindingRow({ finding, index, selected, onSelect }) {

  const severity = normalizeSeverity(finding?.severity);

  const score = Math.round(

    Math.max(

      number(finding?.score),

      number(finding?.signal_score),

      number(finding?.risk_score)

    )

  );

 

  return (

    <button

      type="button"

      className={`pif-finding-row ${selected ? "is-active" : ""}`}

      onClick={() => onSelect(finding)}

    >

      <span className={`pif-finding-rank is-${severity}`}>

        {finding?.rank || index + 1}

      </span>

 

      <div className="pif-finding-content">

        <div className="pif-finding-meta">

          <Badge tone={severityTone(severity)}>{titleCase(severity)}</Badge>

          <span>{titleCase(finding?.category || "Political signal")}</span>

          <span>{getFindingStateCode(finding) || "US"}</span>

        </div>

 

        <strong>{text(finding?.title, "Political intelligence finding")}</strong>

        <p>{text(finding?.summary, "No executive summary supplied.")}</p>

      </div>

 

      <div className="pif-finding-score">

        <strong>{score}</strong>

        <span>score</span>

      </div>

    </button>

  );

}

 

function DetailMetric({ label, value }) {

  return (

    <div className="pif-detail-metric">

      <span>{label}</span>

      <strong>{value}</strong>

    </div>

  );

}

 

export default function PoliticalIntelligenceFabric() {

  const workspaceId = useMemo(

    () => getPoliticalFabricWorkspaceId(1),

    []

  );

 

  const [data, setData] = useState(null);

  const [selected, setSelected] = useState(null);

  const [stateCode, setStateCode] = useState("");

  const [scopeType, setScopeType] = useState("national");

  const [loading, setLoading] = useState(true);

  const [briefLoading, setBriefLoading] = useState(false);

  const [watchLoading, setWatchLoading] = useState(false);

  const [message, setMessage] = useState("");

  const [error, setError] = useState("");

 

  async function loadOverview() {

    setLoading(true);

    setError("");

 

    try {

      const result = await fetchPoliticalFabricOverview(workspaceId);

      const nextFindings = array(result?.findings);

 

      setData(result || {});

      setSelected((current) => {

        if (!current) return nextFindings[0] || null;

        return (

          nextFindings.find(

            (finding) =>

              findingKey(finding, 0) === findingKey(current, 0)

          ) ||

          nextFindings[0] ||

          null

        );

      });

    } catch (err) {

      setError(err?.message || "Unable to load Political Intelligence Fabric.");

    } finally {

      setLoading(false);

    }

  }

 

  useEffect(() => {

    loadOverview();

  }, []);

 

  const findings = array(data?.findings);

  const metrics = data?.metrics || {};

  const recentBriefs = array(data?.recent_briefs);

 

  const sortedWatchlist = useMemo(

    () =>

      [...array(data?.watchlist)].sort((a, b) => {

        const aWeight = SEVERITY_WEIGHT[normalizeSeverity(a?.priority)] || 0;

        const bWeight = SEVERITY_WEIGHT[normalizeSeverity(b?.priority)] || 0;

        return bWeight - aWeight;

      }),

    [data]

  );

 

  const mappedFindings = useMemo(

    () =>

      findings.filter((finding) =>

        Boolean(STATE_NAMES[getFindingStateCode(finding)])

      ),

    [findings]

  );

 

  const activeStates = useMemo(

    () =>

      new Set(

        mappedFindings.map((finding) =>

          getFindingStateCode(finding)

        )

      ).size,

    [mappedFindings]

  );

 

  function handleHeatmapStateSelect(code) {

    setScopeType("state");

    setStateCode(code);

 

    const matchingFinding = findings.find(

      (finding) =>

        getFindingStateCode(finding) === code

    );

 

    if (matchingFinding) setSelected(matchingFinding);

 

    setMessage(

      `${STATE_NAMES[code] || code} selected. Run Scan for focused state intelligence.`

    );

  }

 

  async function handleScan() {

    if (scopeType === "state" && !stateCode) {

      setError("Select a state before running a state intelligence scan.");

      return;

    }

 

    setLoading(true);

    setMessage("");

    setError("");

 

    try {

      await runPoliticalFabricScan({

        workspace_id: workspaceId,

        scope_type: scopeType,

        scope_value:

          scopeType === "state" ? stateCode : null,

        state_code:

          scopeType === "state" ? stateCode : null,

        time_horizon: "30d",

        limit: 100,

        include_live_sources: true,

        refresh_live_sources: true,

        include_news: true,

        include_fec: true,

        include_polling: true,

        include_legislation: true,

        include_election_administration: true,

        include_weather_risk: true,

      });

 

      const refreshed =

        await fetchPoliticalFabricOverview(workspaceId);

 

      const nextFindings = array(refreshed?.findings);

 

      setData(refreshed || {});

      setSelected(nextFindings[0] || null);

      setMessage(

        "Live political intelligence scan completed and the Fabric was refreshed."

      );

    } catch (err) {

      setError(

        err?.message ||

          "Unable to run political intelligence scan."

      );

    } finally {

      setLoading(false);

    }

  }

 

  async function handleCreateBrief() {

    setBriefLoading(true);

    setMessage("");

    setError("");

 

    try {

      const brief = await createPoliticalFabricBrief({

        workspace_id: workspaceId,

        title:

          scopeType === "state" && stateCode

            ? `${stateCode} Political Intelligence Brief`

            : "National Political Intelligence Brief",

        scope_type: scopeType,

        scope_value: scopeType === "state" ? stateCode : null,

        state_code: scopeType === "state" ? stateCode : null,

        time_horizon: "30d",

      });

 

      setData((current) => ({

        ...(current || {}),

        recent_briefs: [brief, ...array(current?.recent_briefs)],

      }));

 

      setMessage(

        brief?.id

          ? `Political intelligence brief #${brief.id} created.`

          : "Political intelligence brief created."

      );

    } catch (err) {

      setError(err?.message || "Unable to create political intelligence brief.");

    } finally {

      setBriefLoading(false);

    }

  }

 

  async function handleWatch(finding) {

    if (!finding) return;

 

    setWatchLoading(true);

    setMessage("");

    setError("");

 

    try {

      const item = await savePoliticalFabricWatchlist({

        workspace_id: workspaceId,

        entity_type: finding?.entity_type || "political_signal",

        entity_id: String(

          finding?.entity_id ||

            finding?.id ||

            finding?.entity_name ||

            finding?.title ||

            "signal"

        ),

        entity_name:

          finding?.entity_name ||

          finding?.title ||

          "Political intelligence signal",

        state_code: finding?.state_code || null,

        priority: normalizeSeverity(finding?.severity),

        rationale: finding?.summary || "",

        tags: [finding?.category || "political_intelligence"],

      });

 

      setData((current) => ({

        ...(current || {}),

        watchlist: [

          item,

          ...array(current?.watchlist).filter(

            (existing) => existing?.id !== item?.id

          ),

        ],

      }));

 

      setMessage(

        `${finding?.entity_name || finding?.title || "Signal"} added to the executive watchlist.`

      );

    } catch (err) {

      setError(err?.message || "Unable to update executive watchlist.");

    } finally {

      setWatchLoading(false);

    }

  }

 

  const generatedAt = data?.generated_at

    ? new Date(data.generated_at).toLocaleString()

    : "Awaiting intelligence refresh";

 

  return (

    <PageShell
      eyebrow="Political Intelligence Fabric"
      title="Political Intelligence Fabric"

      description="Unify national, state, candidate, coalition, vendor, finance, influence, execution, and decision signals into one executive intelligence surface."

      actions={

        <div className="vs-inline-actions pif-page-actions">

          <button

            type="button"

            className="vs-button vs-button-secondary"

            onClick={loadOverview}

            disabled={loading}

          >

            {loading ? "Refreshing..." : "Refresh"}

          </button>

 

          <button

            type="button"

            className="vs-button vs-button-secondary"

            onClick={handleCreateBrief}

            disabled={briefLoading}

          >

            {briefLoading ? "Creating..." : "Create Brief"}

          </button>

 

          <button

            type="button"

            className="vs-button"

            onClick={handleScan}

            disabled={loading}

          >

            {loading ? "Scanning..." : "Run Intelligence Scan"}

          </button>

        </div>

      }

    >

      {error ? (

        <div className="vs-banner vs-banner-danger">{error}</div>

      ) : null}

 

      {message ? (

        <div className="vs-banner vs-banner-success">{message}</div>

      ) : null}

 

      <SectionCard

        title="Intelligence Scope"

        subtitle="Choose the operating scope before scanning or generating an executive brief."

        right={<Badge tone="accent">{titleCase(scopeType)} scope</Badge>}

      >

        <div className="pif-scope-controls">

          <label>

            <span>Scope</span>

            <select

              className="vs-input"

              value={scopeType}

              onChange={(event) => {

                const nextScope = event.target.value;

                setScopeType(nextScope);

                if (nextScope === "national") setStateCode("");

              }}

            >

              <option value="national">National</option>

              <option value="state">State</option>

            </select>

          </label>

 

          <label>

            <span>State</span>

            <select

              className="vs-input"

              value={stateCode}

              onChange={(event) => setStateCode(event.target.value)}

              disabled={scopeType !== "state"}

            >

              <option value="">Select state</option>

              {Object.entries(STATE_NAMES).map(([code, name]) => (

                <option key={code} value={code}>

                  {name} ({code})

                </option>

              ))}

            </select>

          </label>

 

          <div className="pif-scope-status">

            <span>Last generated</span>

            <strong>{generatedAt}</strong>

          </div>

        </div>

      </SectionCard>

 

      <div className="vs-grid-4">

        <StatCard

          label="Material Findings"

          value={metrics?.finding_count ?? findings.length}

          subtext="Ranked political signals"

        />

        <StatCard

          label="Critical"

          value={metrics?.critical_count ?? 0}

          subtext="Immediate executive review"

        />

        <StatCard

          label="Active States"

          value={activeStates}

          subtext={`${mappedFindings.length} mapped findings`}

        />

        <StatCard

          label="Source Health"

          value={`${metrics?.healthy_source_count || 0}/${metrics?.source_count || 0}`}

          subtext={`${metrics?.live_finding_count || 0} live findings · ${metrics?.degraded_source_count || 0} degraded`}

        />

      </div>

 

      <SectionCard

        title="Executive Intelligence Assessment"

        subtitle="Current synthesis produced across the Political Intelligence Fabric."

        right={<Badge tone="active">Executive synthesis</Badge>}

      >

        <div className="pif-executive-summary">

          <div>

            <span className="vs-page-eyebrow">Current Assessment</span>

            <h2>

              {data?.executive_summary ||

                (loading

                  ? "Loading intelligence fabric..."

                  : "No executive synthesis has been generated.")}

            </h2>

          </div>

          <small>{generatedAt}</small>

        </div>

      </SectionCard>

 

      <SectionCard

        title="National Political Signal Map"

        subtitle="State-level concentration of normalized political intelligence findings."

        right={

          <Badge tone="info">

            {mappedFindings.length}/{findings.length} mapped

          </Badge>

        }

      >

        <NationalHeatmap

          findings={findings}

          selectedState={stateCode}

          onSelectState={handleHeatmapStateSelect}

        />

      </SectionCard>

 

      <div className="pif-main-grid">

        <SectionCard

          title="Political Findings"

          subtitle="Ranked intelligence signals requiring executive attention."

          right={<Badge tone="danger">{findings.length} findings</Badge>}

        >

          <div className="pif-finding-list">

            {loading && !findings.length ? (

              <EmptyState text="Loading political intelligence findings..." />

            ) : !findings.length ? (

              <EmptyState text="No material findings detected. Run an intelligence scan." />

            ) : (

              findings.map((finding, index) => (

                <FindingRow

                  key={findingKey(finding, index)}

                  finding={finding}

                  index={index}

                  selected={

                    findingKey(selected, index) === findingKey(finding, index)

                  }

                  onSelect={setSelected}

                />

              ))

            )}

          </div>

        </SectionCard>

 

        <SectionCard

          title="Selected Intelligence"

          subtitle="Evidence, scoring, geographic context, and watchlist action."

          right={

            selected ? (

              <Badge tone={severityTone(selected?.severity)}>

                {titleCase(normalizeSeverity(selected?.severity))}

              </Badge>

            ) : null

          }

        >

          {!selected ? (

            <EmptyState text="Select a finding to inspect its evidence." />

          ) : (

            <div className="pif-detail">

              <div className="pif-detail-heading">

                <span className="vs-page-eyebrow">

                  {titleCase(selected?.category || "Political intelligence")}

                </span>

                <h3>{text(selected?.title, "Political intelligence finding")}</h3>

                <p>{text(selected?.summary, "No summary supplied.")}</p>

              </div>

 

              <div className="pif-detail-metrics">

                <DetailMetric

                  label="Risk Score"

                  value={Math.round(

                    Math.max(

                      number(selected?.score),

                      number(selected?.risk_score),

                      number(selected?.signal_score)

                    )

                  )}

                />

                <DetailMetric

                  label="Confidence"

                  value={`${Math.round(number(selected?.confidence))}%`}

                />

                <DetailMetric

                  label="State"

                  value={getFindingStateCode(selected) || "US"}

                />

              </div>

 

              <div className="pif-detail-section">

                <div className="pif-section-label">Metrics</div>

                <div className="pif-metric-list">

                  {Object.entries(selected?.metrics || {}).length ? (

                    Object.entries(selected?.metrics || {}).map(([key, value]) => (

                      <div key={key}>

                        <span>{titleCase(key)}</span>

                        <strong>

                          {typeof value === "object"

                            ? JSON.stringify(value)

                            : text(value)}

                        </strong>

                      </div>

                    ))

                  ) : (

                    <EmptyState text="No structured metrics are attached." />

                  )}

                </div>

              </div>

 

              <div className="pif-detail-section">

                <div className="pif-section-label">Evidence</div>

                <div className="pif-evidence-list">

                  {array(selected?.evidence).length ? (

                    array(selected?.evidence).map((item, index) => (

                      <div key={`${item?.source || "evidence"}-${index}`}>

                        <div>

                          <strong>{text(item?.label, `Evidence ${index + 1}`)}</strong>

                          <span>{text(item?.source, "Political Intelligence Fabric")}</span>

                        </div>

                        {item?.value != null ? (

                          <Badge tone="info">{String(item.value)}</Badge>

                        ) : null}

                      </div>

                    ))

                  ) : (

                    <EmptyState text="No evidence records are attached." />

                  )}

                </div>

              </div>

 

              <button

                type="button"

                className="vs-button pif-watch-button"

                onClick={() => handleWatch(selected)}

                disabled={watchLoading}

              >

                {watchLoading

                  ? "Updating Watchlist..."

                  : "Add to Executive Watchlist"}

              </button>

            </div>

          )}

        </SectionCard>

      </div>

 

      <div className="pif-lower-grid">

        <SectionCard

          title="Source Health"

          subtitle="Availability of connected intelligence systems."

          right={

            <Badge tone="active">

              {metrics?.healthy_source_count || 0} healthy

            </Badge>

          }

        >

          <SourceHealth sourceHealth={data?.source_health} />

        </SectionCard>

 

        <SectionCard

          title="Executive Watchlist"

          subtitle="Persistent monitoring for prioritized political entities."

          right={<Badge tone="warning">{sortedWatchlist.length} tracked</Badge>}

        >

          <div className="pif-watchlist">

            {!sortedWatchlist.length ? (

              <EmptyState text="No executive watchlist entries." />

            ) : (

              sortedWatchlist.slice(0, 8).map((item, index) => (

                <div

                  className="pif-watch-row"

                  key={item?.id || `${item?.entity_name}-${index}`}

                >

                  <Badge tone={severityTone(item?.priority)}>

                    {titleCase(item?.priority || "watch")}

                  </Badge>

                  <div>

                    <strong>{text(item?.entity_name, "Political entity")}</strong>

                    <small>

                      {titleCase(item?.entity_type || "Entity")} ·{" "}

                      {item?.state_code || "National"}

                    </small>

                  </div>

                </div>

              ))

            )}

          </div>

        </SectionCard>

 

        <SectionCard

          title="Recent Briefs"

          subtitle="Generated executive political intelligence briefs."

          right={<Badge tone="info">{recentBriefs.length} saved</Badge>}

        >

          <div className="pif-brief-list">

            {!recentBriefs.length ? (

              <EmptyState text="No political intelligence briefs have been saved." />

            ) : (

              recentBriefs.slice(0, 8).map((brief, index) => (

                <div

                  className="pif-brief-row"

                  key={brief?.id || `${brief?.title}-${index}`}

                >

                  <strong>{text(brief?.title, "Political Intelligence Brief")}</strong>

                  <small>

                    {titleCase(brief?.scope_type || "National")} ·{" "}

                    {brief?.created_at

                      ? new Date(brief.created_at).toLocaleDateString()

                      : "Recently created"}

                  </small>

                  <p>{text(brief?.executive_summary, "Brief created successfully.")}</p>

                </div>

              ))

            )}

          </div>

        </SectionCard>

      </div>

    </PageShell>

  );

}
