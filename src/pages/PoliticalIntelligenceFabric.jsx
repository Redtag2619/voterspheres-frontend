import { useEffect, useMemo, useState } from "react";
﻿import { useEffect, useMemo, useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from "react-simple-maps";

import {

  fetchPoliticalFabricOverview,

  runPoliticalFabricScan,

  createPoliticalFabricBrief,

  savePoliticalFabricWatchlist

} from "../api/politicalIntelligenceFabricApi";

import "./PoliticalIntelligenceFabric.css";

 

const WORKSPACE_ID = 1;

const STATE_GRID = [
  ["AK", 0, 0], ["ME", 11, 0],
  ["WI", 6, 1], ["VT", 10, 1], ["NH", 11, 1],
  ["WA", 1, 2], ["ID", 2, 2], ["MT", 3, 2], ["ND", 4, 2], ["MN", 5, 2],
  ["IL", 6, 2], ["MI", 7, 2], ["NY", 9, 2], ["MA", 10, 2], ["RI", 11, 2],
  ["OR", 1, 3], ["NV", 2, 3], ["WY", 3, 3], ["SD", 4, 3], ["IA", 5, 3],
  ["IN", 6, 3], ["OH", 7, 3], ["PA", 8, 3], ["NJ", 9, 3], ["CT", 10, 3],
  ["CA", 1, 4], ["UT", 2, 4], ["CO", 3, 4], ["NE", 4, 4], ["MO", 5, 4],
  ["KY", 6, 4], ["WV", 7, 4], ["VA", 8, 4], ["MD", 9, 4], ["DE", 10, 4],
  ["AZ", 2, 5], ["NM", 3, 5], ["KS", 4, 5], ["AR", 5, 5], ["TN", 6, 5],
  ["NC", 7, 5], ["SC", 8, 5], ["DC", 9, 5],
  ["OK", 4, 6], ["LA", 5, 6], ["MS", 6, 6], ["AL", 7, 6], ["GA", 8, 6],
  ["HI", 1, 7], ["TX", 4, 7], ["FL", 8, 7],
];

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

function normalizeSeverity(value = "") {
  const severity = String(value).toLowerCase();
  return Object.prototype.hasOwnProperty.call(SEVERITY_WEIGHT, severity)
    ? severity
    : "watch";
}

function buildStateHeatmap(findings = []) {
  const stateData = Object.fromEntries(
    STATE_GRID.map(([code]) => [
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
    const code = String(finding?.state_code || "").toUpperCase();
    if (!stateData[code]) return;

    const severity = normalizeSeverity(finding?.severity);
    const score = Math.max(
      Number(finding?.score) || 0,
      SEVERITY_WEIGHT[severity] || 0
    );

    const current = stateData[code];
    current.findingCount += 1;
    current.score = Math.max(current.score, score);

    if (severity === "critical") current.criticalCount += 1;
    if (severity === "high") current.highCount += 1;

    if (
      !current.topFinding ||
      score > Math.max(
        Number(current.topFinding?.score) || 0,
        SEVERITY_WEIGHT[normalizeSeverity(current.topFinding?.severity)] || 0
      )
    ) {
      current.topFinding = finding;
    }
  });

  return stateData;

const WORKSPACE_ID = 1;

const US_TOPO_JSON =
  "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

const STATE_FIPS_TO_ABBR = {
  "01": "AL",
  "02": "AK",
  "04": "AZ",
  "05": "AR",
  "06": "CA",
  "08": "CO",
  "09": "CT",
  "10": "DE",
  "11": "DC",
  "12": "FL",
  "13": "GA",
  "15": "HI",
  "16": "ID",
  "17": "IL",
  "18": "IN",
  "19": "IA",
  "20": "KS",
  "21": "KY",
  "22": "LA",
  "23": "ME",
  "24": "MD",
  "25": "MA",
  "26": "MI",
  "27": "MN",
  "28": "MS",
  "29": "MO",
  "30": "MT",
  "31": "NE",
  "32": "NV",
  "33": "NH",
  "34": "NJ",
  "35": "NM",
  "36": "NY",
  "37": "NC",
  "38": "ND",
  "39": "OH",
  "40": "OK",
  "41": "OR",
  "42": "PA",
  "44": "RI",
  "45": "SC",
  "46": "SD",
  "47": "TN",
  "48": "TX",
  "49": "UT",
  "50": "VT",
  "51": "VA",
  "53": "WA",
  "54": "WV",
  "55": "WI",
  "56": "WY",
};

const STATE_NAMES = {
  AL: "Alabama",
  AK: "Alaska",
  AZ: "Arizona",
  AR: "Arkansas",
  CA: "California",
  CO: "Colorado",
  CT: "Connecticut",
  DE: "Delaware",
  DC: "District of Columbia",
  FL: "Florida",
  GA: "Georgia",
  HI: "Hawaii",
  ID: "Idaho",
  IL: "Illinois",
  IN: "Indiana",
  IA: "Iowa",
  KS: "Kansas",
  KY: "Kentucky",
  LA: "Louisiana",
  ME: "Maine",
  MD: "Maryland",
  MA: "Massachusetts",
  MI: "Michigan",
  MN: "Minnesota",
  MS: "Mississippi",
  MO: "Missouri",
  MT: "Montana",
  NE: "Nebraska",
  NV: "Nevada",
  NH: "New Hampshire",
  NJ: "New Jersey",
  NM: "New Mexico",
  NY: "New York",
  NC: "North Carolina",
  ND: "North Dakota",
  OH: "Ohio",
  OK: "Oklahoma",
  OR: "Oregon",
  PA: "Pennsylvania",
  RI: "Rhode Island",
  SC: "South Carolina",
  SD: "South Dakota",
  TN: "Tennessee",
  TX: "Texas",
  UT: "Utah",
  VT: "Vermont",
  VA: "Virginia",
  WA: "Washington",
  WV: "West Virginia",
  WI: "Wisconsin",
  WY: "Wyoming",
};

const STATE_COORDS = {
  AL: [-86.8, 32.8],
  AK: [-150.2, 64.2],
  AZ: [-111.7, 34.2],
  AR: [-92.4, 34.8],
  CA: [-119.5, 37.2],
  CO: [-105.6, 39.0],
  CT: [-72.7, 41.6],
  DE: [-75.5, 39.0],
  DC: [-77.0, 38.9],
  FL: [-82.4, 28.3],
  GA: [-83.5, 32.7],
  HI: [-157.8, 20.8],
  ID: [-114.4, 44.2],
  IL: [-89.2, 40.0],
  IN: [-86.1, 40.0],
  IA: [-93.5, 42.0],
  KS: [-98.4, 38.5],
  KY: [-84.8, 37.7],
  LA: [-91.9, 31.1],
  ME: [-69.2, 45.3],
  MD: [-76.7, 39.0],
  MA: [-71.8, 42.2],
  MI: [-85.6, 44.2],
  MN: [-94.2, 46.0],
  MS: [-89.7, 32.7],
  MO: [-92.5, 38.4],
  MT: [-110.4, 46.9],
  NE: [-99.9, 41.5],
  NV: [-116.6, 39.4],
  NH: [-71.6, 43.8],
  NJ: [-74.5, 40.1],
  NM: [-106.1, 34.4],
  NY: [-75.5, 43.0],
  NC: [-79.3, 35.5],
  ND: [-100.5, 47.5],
  OH: [-82.8, 40.2],
  OK: [-97.5, 35.6],
  OR: [-120.6, 44.0],
  PA: [-77.7, 40.9],
  RI: [-71.6, 41.7],
  SC: [-80.9, 33.8],
  SD: [-100.0, 44.4],
  TN: [-86.4, 35.8],
  TX: [-99.3, 31.1],
  UT: [-111.7, 39.3],
  VT: [-72.7, 44.0],
  VA: [-78.2, 37.7],
  WA: [-120.7, 47.4],
  WV: [-80.6, 38.6],
  WI: [-89.8, 44.7],
  WY: [-107.6, 43.0],
};

const STATE_NAME_TO_CODE = Object.fromEntries(
  Object.entries(STATE_NAMES).map(([code, name]) => [
    name.toUpperCase(),
    code,
  ])
);

const SEVERITY_SCORES = {
  none: 0,
  low: 25,
  watch: 25,
  medium: 50,
  high: 75,
  critical: 100,
};

function firstArray(...values) {
  return values.find(Array.isArray) || [];
}

function normalizeSeverity(value = "") {
  const text = String(value || "").trim().toLowerCase();

  if (
    text.includes("critical") ||
    text.includes("urgent") ||
    text.includes("severe")
  ) {
    return "critical";
  }

  if (text.includes("high") || text.includes("major")) {
    return "high";
  }

  if (
    text.includes("medium") ||
    text.includes("moderate") ||
    text.includes("elevated")
  ) {
    return "medium";
  }

  if (
    text.includes("low") ||
    text.includes("stable") ||
    text.includes("minor")
  ) {
    return "low";
  }

  return "watch";
}

function normalizeStateCode(value) {
  const text = String(value || "").trim().toUpperCase();

  if (!text) return "";
  if (STATE_NAMES[text]) return text;
  if (STATE_NAME_TO_CODE[text]) return STATE_NAME_TO_CODE[text];

  if (
    text === "WASHINGTON DC" ||
    text === "WASHINGTON, DC" ||
    text === "WASHINGTON D.C."
  ) {
    return "DC";
  }

  for (const [stateName, code] of Object.entries(STATE_NAME_TO_CODE)) {
    if (text.includes(stateName)) return code;
  }

  const abbreviationMatch = text.match(
    /(?:^|[^A-Z])(AL|AK|AZ|AR|CA|CO|CT|DE|DC|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)(?:[^A-Z]|$)/
  );

  return abbreviationMatch?.[1] || "";
}

function resolveFindingStateCode(finding = {}) {
  const candidates = [
    finding.state_code,
    finding.stateCode,
    finding.state,
    finding.state_abbr,
    finding.state_abbreviation,
    finding.scope_value,
    finding.scopeValue,
    finding.jurisdiction,
    finding.region,
    finding.location,
    finding.geo,
    finding.geography,
    finding?.metadata?.state_code,
    finding?.metadata?.state,
    finding?.metadata?.scope_value,
    finding?.metrics?.state_code,
    finding?.metrics?.state,
    finding?.entity?.state_code,
    finding?.entity?.state,
    finding?.source?.state_code,
    finding?.source?.state,
  ];

  for (const candidate of candidates) {
    const code = normalizeStateCode(candidate);
    if (code) return code;
  }

  return normalizeStateCode(
    [
      finding.title,
      finding.name,
      finding.summary,
      finding.description,
      finding.rationale,
      finding.entity_name,
      finding.category,
    ]
      .filter(Boolean)
      .join(" ")
  );
}

function getFindingScore(finding = {}) {
  const severity = normalizeSeverity(
    finding.severity ||
      finding.risk_level ||
      finding.priority ||
      finding.status
  );

  const numericScores = [
    finding.score,
    finding.signal_score,
    finding.risk_score,
    finding.priority_score,
    finding.heat_score,
    finding.confidence_score,
    finding.intensity,
    finding?.metrics?.score,
    finding?.metrics?.risk_score,
    finding?.metrics?.signal_score,
  ]
    .map(Number)
    .filter(Number.isFinite);

  return Math.max(
    SEVERITY_SCORES[severity] || 0,
    ...numericScores,
    0
  );
}

function normalizeFindings(payload = {}) {
  const rows = firstArray(
    payload.findings,
    payload.signals,
    payload.results,
    payload.items,
    payload.alerts,
    payload?.scan?.findings,
    payload?.scan?.signals,
    payload?.overview?.findings,
    payload?.overview?.signals,
    payload?.intelligence?.findings,
    payload?.intelligence?.signals,
    payload?.data?.findings,
    payload?.data?.signals,
    payload?.data?.results,
    payload?.payload?.findings,
    payload?.payload?.signals
  );

  return rows.map((finding, index) => {
    const severity = normalizeSeverity(
      finding.severity ||
        finding.risk_level ||
        finding.priority ||
        finding.status
    );

    return {
      ...finding,
      id:
        finding.id ||
        finding.finding_id ||
        finding.signal_id ||
        `signal-${index + 1}`,
      title:
        finding.title ||
        finding.name ||
        finding.entity_name ||
        "Political intelligence signal",
      entity_name:
        finding.entity_name ||
        finding.name ||
        finding.title ||
        "Political intelligence signal",
      summary:
        finding.summary ||
        finding.description ||
        finding.rationale ||
        "No signal summary was returned.",
      category:
        finding.category ||
        finding.signal_type ||
        finding.type ||
        "political_signal",
      severity,
      state_code: resolveFindingStateCode(finding),
      score: getFindingScore(finding),
    };
  });
}

function getHeatLevel(score = 0) {
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

  const activeStates = rankedStates.length;
  const criticalStates = rankedStates.filter((state) => state.score >= 85).length;
  const highStates = rankedStates.filter(
    (state) => state.score >= 65 && state.score < 85
  ).length;

  return (
    <section className="pif-panel pif-heatmap-panel">
      <header className="pif-heatmap-header">
        <div>
          <span>National signal distribution</span>
          <h2>Executive Intelligence Heatmap</h2>
        </div>

        <div className="pif-heatmap-stats">
          <div>
            <strong>{activeStates}</strong>
            <span>Active states</span>
          </div>
          <div>
            <strong>{criticalStates}</strong>
            <span>Critical</span>
          </div>
          <div>
            <strong>{highStates}</strong>
            <span>High</span>
          </div>
        </div>
      </header>

      <div className="pif-heatmap-layout">
        <div>
          <div
            className="pif-state-grid"
            role="img"
            aria-label="United States political intelligence heatmap by state"
          >
            {STATE_GRID.map(([code, column, row]) => {
              const state = stateData[code];
              const level = heatLevel(state.score);
              const isSelected = selectedState === code;

              return (
                <button
                  type="button"
                  key={code}
                  className={[
                    "pif-state-tile",
                    `is-${level}`,
                    isSelected ? "is-selected" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  style={{
                    gridColumn: column + 1,
                    gridRow: row + 1,
                  }}
                  onClick={() => onSelectState(code)}
                  title={`${state.name}: ${state.findingCount} findings, score ${Math.round(
                    state.score
                  )}`}
                  aria-label={`${state.name}, ${state.findingCount} findings, intelligence score ${Math.round(
                    state.score
                  )}`}
                >
                  <strong>{code}</strong>
                  <small>{state.findingCount || "—"}</small>
                </button>
              );
            })}
          </div>

          <div className="pif-heatmap-legend" aria-label="Heatmap legend">
            <span><i className="is-none" /> No signal</span>
            <span><i className="is-low" /> Low</span>
            <span><i className="is-medium" /> Medium</span>
            <span><i className="is-high" /> High</span>
            <span><i className="is-critical" /> Critical</span>
          </div>
        </div>

        <aside className="pif-heatmap-ranking">
          <div className="pif-heatmap-ranking-title">
            <span>Highest-priority states</span>
            <strong>{rankedStates.length}</strong>
          </div>

          <div className="pif-heatmap-ranking-list">
            {rankedStates.slice(0, 8).map((state, index) => (
              <button
                type="button"
                key={state.code}
                onClick={() => onSelectState(state.code)}
                className={selectedState === state.code ? "is-active" : ""}
              >
                <span className={`pif-heat-rank is-${heatLevel(state.score)}`}>
                  {index + 1}
                </span>
                <div>
                  <strong>{state.name}</strong>
                  <small>
                    {state.findingCount} finding
                    {state.findingCount === 1 ? "" : "s"}
                    {state.criticalCount
                      ? ` • ${state.criticalCount} critical`
                      : state.highCount
                        ? ` • ${state.highCount} high`
                        : ""}
                  </small>
                </div>
                <b>{Math.round(state.score)}</b>
              </button>
            ))}

            {!rankedStates.length && (
              <div className="pif-empty">
                Run a national scan to populate the heatmap.
              </div>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}

 

function severityClass(value = "") {
function getStateFill(level = "none") {
  if (level === "critical") return "#dc2626";
  if (level === "high") return "#f97316";
  if (level === "medium") return "#0284c7";
  if (level === "low") return "#16a34a";
  return "#1e293b";
}

function buildStateLookup(findings = []) {
  const lookup = Object.fromEntries(
    Object.entries(STATE_NAMES).map(([code, name]) => [
      code,
      {
        state_code: code,
        state_name: name,
        score: 0,
        finding_count: 0,
        top_finding: null,
        findings: [],
      },
    ])
  );

  findings.forEach((finding) => {
    const stateCode = resolveFindingStateCode(finding);

    if (!stateCode || !lookup[stateCode]) return;

    const state = lookup[stateCode];
    const score = getFindingScore(finding);

    state.finding_count += 1;
    state.score = Math.max(state.score, score);
    state.findings.push(finding);

    if (
      !state.top_finding ||
      score > getFindingScore(state.top_finding)
    ) {
      state.top_finding = finding;
    }
  });

  return lookup;
}

function MetricCard({ label, value, detail }) {
  return (
    <article className="pif-metric">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

function SignalMarker({ state, selectedStateCode, onSelect }) {
  const coordinates = STATE_COORDS[state.state_code];

  if (!coordinates || state.finding_count === 0) {
    return null;
  }

  const level = getHeatLevel(state.score);
  const selected = selectedStateCode === state.state_code;

  return (
    <Marker coordinates={coordinates}>
      <g
        className={`pif-marker pif-marker-${level} ${
          selected ? "is-selected" : ""
        }`}
        role="button"
        tabIndex={0}
        aria-label={`${state.state_name}, ${state.finding_count} political signals`}
        onClick={() => onSelect(state)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onSelect(state);
          }
        }}
      >
        <circle r={13} />
        <text y={-2} textAnchor="middle">
          {state.state_code}
        </text>
        <text y={9} textAnchor="middle">
          {state.finding_count}
        </text>
      </g>
    </Marker>
  );
}

function PoliticalSignalMap({
  stateLookup,
  activeStates,
  selectedStateCode,
  onSelectState,
}) {
  return (
    <div className="pif-map-layout">
      <div>
        <div className="pif-map-shell">
          <ComposableMap
            projection="geoAlbersUsa"
            width={980}
            height={610}
          >
            <Geographies geography={US_TOPO_JSON}>
              {({ geographies }) =>
                geographies.map((geography) => {
                  const fips = String(geography.id).padStart(2, "0");
                  const stateCode = STATE_FIPS_TO_ABBR[fips];
                  const state = stateLookup[stateCode];

                  if (!stateCode || !state) {
                    return null;
                  }

                  const level = getHeatLevel(state.score);
                  const fill = getStateFill(level);
                  const selected =
                    selectedStateCode === stateCode;

                  return (
                    <Geography
                      key={geography.rsmKey}
                      geography={geography}
                      onClick={() => onSelectState(state)}
                      style={{
                        default: {
                          fill,
                          stroke: selected
                            ? "#ffffff"
                            : "rgba(15,23,42,0.9)",
                          strokeWidth: selected ? 2.5 : 0.9,
                          outline: "none",
                        },
                        hover: {
                          fill,
                          stroke: "#ffffff",
                          strokeWidth: 2,
                          outline: "none",
                          cursor: "pointer",
                        },
                        pressed: {
                          fill,
                          stroke: "#ffffff",
                          strokeWidth: 2,
                          outline: "none",
                        },
                      }}
                    />
                  );
                })
              }
            </Geographies>

            {activeStates.map((state) => (
              <SignalMarker
                key={state.state_code}
                state={state}
                selectedStateCode={selectedStateCode}
                onSelect={onSelectState}
              />
            ))}
          </ComposableMap>
        </div>

        <div className="pif-legend">
          {[
            ["none", "No mapped signal"],
            ["low", "Low"],
            ["medium", "Medium"],
            ["high", "High"],
            ["critical", "Critical"],
          ].map(([level, label]) => (
            <span key={level}>
              <i style={{ background: getStateFill(level) }} />
              {label}
            </span>
          ))}
        </div>
      </div>

      <aside className="pif-ranking">
        <h3>Highest-priority states</h3>

        {activeStates.slice(0, 12).map((state, index) => (
          <button
            type="button"
            key={state.state_code}
            className={
              selectedStateCode === state.state_code
                ? "is-active"
                : ""
            }
            onClick={() => onSelectState(state)}
          >
            <span
              style={{
                background: getStateFill(
                  getHeatLevel(state.score)
                ),
              }}
            >
              {index + 1}
            </span>

            <div>
              <strong>{state.state_name}</strong>
              <small>
                {state.finding_count} mapped signals
              </small>
            </div>

            <b>{Math.round(state.score)}</b>
          </button>
        ))}

        {!activeStates.length ? (
          <div className="pif-empty">
            No state signals are mapped yet. Run a national scan.
          </div>
        ) : null}
      </aside>
    </div>
  );
}

export default function PoliticalIntelligenceFabric() {
  const [data, setData] = useState({});
  const [selectedFinding, setSelectedFinding] = useState(null);
  const [selectedStateCode, setSelectedStateCode] = useState("");
  const [scopeType, setScopeType] = useState("national");
  const [scanStateCode, setScanStateCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const findings = useMemo(
    () => normalizeFindings(data),
    [data]
  );

  const stateLookup = useMemo(
    () => buildStateLookup(findings),
    [findings]
  );

  const activeStates = useMemo(
    () =>
      Object.values(stateLookup)
        .filter((state) => state.finding_count > 0)
        .sort(
          (left, right) =>
            right.score - left.score ||
            right.finding_count - left.finding_count
        ),
    [stateLookup]
  );

  const mappedFindings = findings.filter((finding) =>
    Boolean(resolveFindingStateCode(finding))
  );

  const unmappedFindings = findings.filter(
    (finding) => !resolveFindingStateCode(finding)
  );

  const watchlist = firstArray(
    data?.watchlist,
    data?.watch_list,
    data?.data?.watchlist
  );

  const recentBriefs = firstArray(
    data?.recent_briefs,
    data?.briefs,
    data?.data?.recent_briefs,
    data?.data?.briefs
  );

  async function loadOverview() {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const result =
        await fetchPoliticalFabricOverview(WORKSPACE_ID);

      console.log(
        "[Political Intelligence Fabric] Raw overview response:",
        result
      );

      const normalized = normalizeFindings(result || {});

      console.log(
        "[Political Intelligence Fabric] Normalized overview signals:",
        normalized
      );

      setData({
        ...(result || {}),
        findings: normalized,
      });

      setSelectedFinding(normalized[0] || null);

      const firstStateCode =
        resolveFindingStateCode(normalized[0]);

      if (firstStateCode) {
        setSelectedStateCode(firstStateCode);
      }
    } catch (requestError) {
      setError(
        requestError?.message ||
          "Unable to load Political Intelligence Fabric."
      );
    } finally {
      setLoading(false);
    }
  }

  return `pif-severity pif-severity--${String(value).toLowerCase()}`;

}

 

function MetricCard({ label, value, detail }) {

  return (

    <article className="pif-metric-card">

      <span>{label}</span>

      <strong>{value ?? 0}</strong>

      <small>{detail}</small>

    </article>

  );

}

 

function SourceHealth({ sourceHealth = {} }) {

  return (

    <div className="pif-source-grid">

      {Object.entries(sourceHealth).map(([source, health]) => (

        <div className="pif-source" key={source}>

          <span className={health.ok ? "pif-dot is-online" : "pif-dot is-offline"} />

          <div>

            <strong>{source.replaceAll("_", " ")}</strong>

            <small>{health.ok ? `${health.count} records` : "Unavailable"}</small>

          </div>

        </div>

      ))}

    </div>

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

    setLoading(true);

    setError("");

    try {

      const result = await fetchPoliticalFabricOverview(WORKSPACE_ID);

      setData(result);

      setSelected(result.findings?.[0] || null);

    } catch (err) {

      setError(err.message || "Unable to load Political Intelligence Fabric.");

    } finally {

      setLoading(false);

    }

  }

 

  useEffect(() => {

    loadOverview();

  }, []);

 

  const findings = data?.findings || [];

  const metrics = data?.metrics || {};

  const sortedWatchlist = useMemo(

    () => [...(data?.watchlist || [])].sort((a, b) =>

      String(a.priority).localeCompare(String(b.priority))

    ),

    [data]

  );

 


  function handleHeatmapStateSelect(code) {
    setScopeType("state");
    setStateCode(code);
    setMessage(
      `${STATE_NAMES[code] || code} selected. Run the state scan for focused intelligence.`
    );

    window.requestAnimationFrame(() => {
      document
        .querySelector(".pif-hero-actions")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  async function handleScan() {

    setLoading(true);

    setMessage("");

    setError("");

    try {

      const result = await runPoliticalFabricScan({

        workspace_id: WORKSPACE_ID,

        scope_type: scopeType,

        scope_value: scopeType === "state" ? stateCode : null,

        state_code: scopeType === "state" ? stateCode : null,

        time_horizon: "30d",

        limit: 75

      });

      setData((current) => ({

        ...(current || {}),

        ...result,

        watchlist: current?.watchlist || [],

        recent_briefs: current?.recent_briefs || []

      }));

      setSelected(result.findings?.[0] || null);

      setMessage("Political intelligence scan completed.");

    } catch (err) {

      setError(err.message || "Unable to run scan.");

    } finally {

      setLoading(false);

    }

  }

 

  async function handleCreateBrief() {

    setMessage("");

    setError("");

    try {

      const brief = await createPoliticalFabricBrief({

        workspace_id: WORKSPACE_ID,

        title:

          scopeType === "state" && stateCode

            ? `${stateCode} Political Intelligence Brief`

            : "National Political Intelligence Brief",

        scope_type: scopeType,

        scope_value: scopeType === "state" ? stateCode : null,

        state_code: scopeType === "state" ? stateCode : null,

        time_horizon: "30d"

      });

      setData((current) => ({

        ...current,

        recent_briefs: [brief, ...(current?.recent_briefs || [])]

      }));

      setMessage(`Brief #${brief.id} created.`);

    } catch (err) {

      setError(err.message || "Unable to create brief.");

    }

  }

 

  async function handleWatch(finding) {

    setMessage("");

    setError("");

    try {

      const item = await savePoliticalFabricWatchlist({

        workspace_id: WORKSPACE_ID,

        entity_type: finding.entity_type,

        entity_id: String(finding.entity_id || finding.entity_name),

        entity_name: finding.entity_name,

        state_code: finding.state_code,

        priority: finding.severity,

        rationale: finding.summary,

        tags: [finding.category]

      });

      setData((current) => ({

        ...current,

        watchlist: [

          item,

          ...(current?.watchlist || []).filter((existing) => existing.id !== item.id)

        ]

      }));

      setMessage(`${finding.entity_name} added to watchlist.`);

    } catch (err) {

      setError(err.message || "Unable to update watchlist.");

    }

  }

 

  return (

    <main className="pif-page">

      <section className="pif-hero">

        <div>

          <p className="pif-eyebrow">Unified Executive Intelligence</p>

          <h1>Political Intelligence Fabric</h1>

          <p>

            Unified national, state, candidate, coalition, vendor, finance,

            influence, execution, and decision intelligence.

          </p>

        </div>

 

        <div className="pif-hero-actions">

          <select value={scopeType} onChange={(e) => setScopeType(e.target.value)}>

            <option value="national">National</option>

            <option value="state">State</option>

          </select>

          {scopeType === "state" && (
            <select
              value={stateCode}
              onChange={(event) => setStateCode(event.target.value)}
              aria-label="Select state"
            >
              <option value="">Select state</option>
              {Object.entries(STATE_NAMES).map(([code, name]) => (
                <option key={code} value={code}>
                  {name} ({code})
                </option>
              ))}
            </select>
          )}

          <button onClick={handleScan} disabled={loading}>

            {loading ? "Scanning..." : "Run Scan"}

          </button>

          <button className="is-secondary" onClick={handleCreateBrief}>

            Create Brief

          </button>

        </div>

      </section>

 

      {(message || error) && (

        <div className={error ? "pif-alert is-error" : "pif-alert is-success"}>

          {error || message}

        </div>

      )}

 

      <section className="pif-metrics">

        <MetricCard label="Material Findings" value={metrics.finding_count} detail="Ranked signals" />

        <MetricCard label="Critical" value={metrics.critical_count} detail="Immediate review" />

        <MetricCard label="High" value={metrics.high_count} detail="72-hour window" />

        <MetricCard

          label="Source Health"

          value={`${metrics.healthy_source_count || 0}/${metrics.source_count || 0}`}

          detail="Connected intelligence sources"

        />

      </section>

 

      <section className="pif-summary">

        <div>

          <span>Executive synthesis</span>

          <h2>{data?.executive_summary || "Loading intelligence fabric..."}</h2>

        </div>

        <small>{data?.generated_at ? new Date(data.generated_at).toLocaleString() : ""}</small>

      </section>

 

      <section className="pif-layout">

        <div className="pif-panel pif-findings-panel">

          <header>

            <div>

              <span>Ranked intelligence</span>

              <h2>Political Findings</h2>

            </div>

            <strong>{findings.length}</strong>

          </header>

 

          <div className="pif-findings-list">

            {findings.map((finding) => (

              <button

                key={`${finding.category}-${finding.rank}-${finding.entity_id}`}

                className={selected?.rank === finding.rank ? "pif-finding is-active" : "pif-finding"}

                onClick={() => setSelected(finding)}

              >

                <div className="pif-finding-rank">{finding.rank}</div>

                <div>

                  <div className="pif-finding-topline">

                    <span className={severityClass(finding.severity)}>

                      {finding.severity}

                    </span>

                    <small>{finding.category.replaceAll("_", " ")}</small>

                  </div>

                  <strong>{finding.title}</strong>

                  <p>{finding.summary}</p>

                </div>

                <b>{Math.round(finding.score)}</b>

              </button>

            ))}

            {!loading && findings.length === 0 && (

              <div className="pif-empty">No material findings detected.</div>

            )}

          </div>

        </div>

 

        <aside className="pif-panel pif-detail-panel">

          <header>

            <div>

              <span>Evidence and action</span>

              <h2>Finding Detail</h2>

            </div>

          </header>

 

          {selected ? (

            <>

              <div className="pif-detail-heading">

                <span className={severityClass(selected.severity)}>

                  {selected.severity}

                </span>

                <h3>{selected.title}</h3>

                <p>{selected.summary}</p>

              </div>

 

              <div className="pif-score-row">

                <div><span>Risk score</span><strong>{Math.round(selected.score)}</strong></div>

                <div><span>Confidence</span><strong>{Math.round(selected.confidence)}%</strong></div>

                <div><span>State</span><strong>{selected.state_code || "US"}</strong></div>

              </div>

 

              <h4>Metrics</h4>

              <pre>{JSON.stringify(selected.metrics || {}, null, 2)}</pre>

 

              <h4>Evidence</h4>

              <div className="pif-evidence-list">

                {(selected.evidence || []).map((item, index) => (

                  <div key={`${item.source}-${index}`}>

                    <strong>{item.label}</strong>

                    <span>{item.source}</span>

                  </div>

                ))}

              </div>

 

              <button className="pif-watch-button" onClick={() => handleWatch(selected)}>

                Add to Executive Watchlist

              </button>

            </>

          ) : (

            <div className="pif-empty">Select a finding to inspect its evidence.</div>

          )}

        </aside>

      </section>

 

      <section className="pif-lower-grid">

        <article className="pif-panel">

          <header><div><span>Connected systems</span><h2>Source Health</h2></div></header>

          <SourceHealth sourceHealth={data?.source_health} />

        </article>

 

        <article className="pif-panel">

          <header><div><span>Persistent monitoring</span><h2>Watchlist</h2></div></header>

          <div className="pif-watchlist">

            {sortedWatchlist.slice(0, 8).map((item) => (

              <div key={item.id}>

                <span className={severityClass(item.priority)}>{item.priority}</span>

                <div>

                  <strong>{item.entity_name}</strong>

                  <small>{item.entity_type} • {item.state_code || "National"}</small>

                </div>

              </div>

            ))}

            {!sortedWatchlist.length && <div className="pif-empty">No watchlist entries.</div>}

          </div>

        </article>

 

        <article className="pif-panel">

          <header><div><span>Generated intelligence</span><h2>Recent Briefs</h2></div></header>

          <div className="pif-briefs">

            {(data?.recent_briefs || []).slice(0, 8).map((brief) => (

              <div key={brief.id}>

                <strong>{brief.title}</strong>

                <small>{brief.scope_type} • {new Date(brief.created_at).toLocaleDateString()}</small>

                <p>{brief.executive_summary}</p>

              </div>

            ))}

            {!data?.recent_briefs?.length && <div className="pif-empty">No saved briefs.</div>}

          </div>

        </article>

      </section>

    </main>

  );

}

  async function handleScan() {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const result = await runPoliticalFabricScan({
        workspace_id: WORKSPACE_ID,
        scope_type: scopeType,
        scope_value:
          scopeType === "state" ? scanStateCode : "US",
        state_code:
          scopeType === "state" ? scanStateCode : null,
        time_horizon: "30d",
        limit: 100,
      });

      console.log(
        "[Political Intelligence Fabric] Raw scan response:",
        result
      );

      const normalized = normalizeFindings(result || {});

      console.log(
        "[Political Intelligence Fabric] Normalized scan signals:",
        normalized
      );

      console.log(
        "[Political Intelligence Fabric] State signal lookup:",
        buildStateLookup(normalized)
      );

      setData((current) => ({
        ...(current || {}),
        ...(result || {}),
        findings: normalized,
        signals: normalized,
      }));

      setSelectedFinding(normalized[0] || null);

      const firstStateCode =
        resolveFindingStateCode(normalized[0]);

      if (firstStateCode) {
        setSelectedStateCode(firstStateCode);
      }

      const mappedCount = normalized.filter((finding) =>
        Boolean(resolveFindingStateCode(finding))
      ).length;

      setMessage(
        normalized.length
          ? `Scan completed: ${normalized.length} signals returned and ${mappedCount} mapped to states.`
          : "Scan completed, but the backend returned no political signals."
      );
    } catch (requestError) {
      setError(
        requestError?.message ||
          "Unable to run the political intelligence scan."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateBrief() {
    setError("");
    setMessage("");

    try {
      const result = await createPoliticalFabricBrief({
        workspace_id: WORKSPACE_ID,
        title:
          scopeType === "state" && scanStateCode
            ? `${STATE_NAMES[scanStateCode]} Political Intelligence Brief`
            : "National Political Intelligence Brief",
        scope_type: scopeType,
        scope_value:
          scopeType === "state" ? scanStateCode : "US",
        state_code:
          scopeType === "state" ? scanStateCode : null,
        time_horizon: "30d",
      });

      setData((current) => ({
        ...(current || {}),
        recent_briefs: [
          result,
          ...firstArray(
            current?.recent_briefs,
            current?.briefs
          ),
        ],
      }));

      setMessage(
        `Brief ${result?.id ? `#${result.id} ` : ""}created.`
      );
    } catch (requestError) {
      setError(
        requestError?.message ||
          "Unable to create the political intelligence brief."
      );
    }
  }

  async function handleWatch(finding) {
    if (!finding) return;

    setError("");
    setMessage("");

    try {
      const result = await savePoliticalFabricWatchlist({
        workspace_id: WORKSPACE_ID,
        entity_type:
          finding.entity_type || "political_signal",
        entity_id: String(
          finding.entity_id ||
            finding.id ||
            finding.entity_name
        ),
        entity_name:
          finding.entity_name || finding.title,
        state_code:
          resolveFindingStateCode(finding) || null,
        priority: finding.severity || "watch",
        rationale: finding.summary,
        tags: [finding.category || "political_signal"],
      });

      setData((current) => ({
        ...(current || {}),
        watchlist: [
          result,
          ...firstArray(
            current?.watchlist,
            current?.watch_list
          ).filter((item) => item?.id !== result?.id),
        ],
      }));

      setMessage(
        `${finding.entity_name || finding.title} added to the watchlist.`
      );
    } catch (requestError) {
      setError(
        requestError?.message ||
          "Unable to update the political watchlist."
      );
    }
  }

  function handleSelectState(state) {
    setSelectedStateCode(state.state_code);
    setScopeType("state");
    setScanStateCode(state.state_code);

    if (state.top_finding) {
      setSelectedFinding(state.top_finding);
    }

    setMessage(
      `${state.state_name} selected with ${state.finding_count} mapped signals.`
    );
  }

  return (
    <main className="pif-page">
      <style>{`
        .pif-page {
          display: grid;
          gap: 18px;
          padding: 24px;
          color: rgba(226, 232, 240, 0.92);
          background: transparent;
        }

        .pif-hero,
        .pif-panel,
        .pif-metric {
          border: 1px solid rgba(148, 163, 184, 0.16);
          background:
            radial-gradient(circle at top right, rgba(59, 130, 246, 0.18), transparent 34%),
            radial-gradient(circle at bottom left, rgba(14, 165, 233, 0.08), transparent 30%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.94), rgba(2, 6, 23, 0.86));
          border-radius: 28px;
        }

        .pif-hero {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 22px;
          padding: 24px;
        }

        .pif-eyebrow,
        .pif-heading span,
        .pif-metric span,
        .pif-detail > span {
          color: rgba(147, 197, 253, 0.92);
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .pif-hero h1 {
          margin: 7px 0 9px;
          font-size: clamp(30px, 4vw, 48px);
          line-height: 1;
        }

        .pif-hero p {
          max-width: 760px;
          margin: 0;
          color: rgba(203, 213, 225, 0.68);
          line-height: 1.6;
        }

        .pif-actions {
          display: flex;
          gap: 9px;
          align-items: end;
          flex-wrap: wrap;
        }

        .pif-actions label {
          display: grid;
          gap: 6px;
          color: rgba(203, 213, 225, 0.68);
          font-size: 11px;
          font-weight: 800;
        }

        .pif-actions select,
        .pif-actions button,
        .pif-watch {
          border: 1px solid rgba(148, 163, 184, 0.22);
          border-radius: 12px;
          background: rgba(15, 23, 42, 0.74);
          color: rgba(226, 232, 240, 0.92);
          padding: 10px 12px;
        }

        .pif-actions button,
        .pif-watch {
          cursor: pointer;
          font-weight: 900;
        }

        .pif-actions button.is-primary {
          background: rgba(37, 99, 235, 0.88);
          border-color: rgba(96, 165, 250, 0.62);
          color: white;
        }

        .pif-actions button:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .pif-banner {
          border-radius: 16px;
          padding: 12px 14px;
        }

        .pif-banner.is-error {
          border: 1px solid rgba(248, 113, 113, 0.35);
          background: rgba(127, 29, 29, 0.28);
          color: #fecaca;
        }

        .pif-banner.is-message {
          border: 1px solid rgba(96, 165, 250, 0.3);
          background: rgba(37, 99, 235, 0.18);
          color: #dbeafe;
        }

        .pif-metrics {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }

        .pif-metric {
          padding: 16px;
        }

        .pif-metric strong {
          display: block;
          margin: 7px 0;
          color: white;
          font-size: 30px;
        }

        .pif-metric small {
          color: rgba(203, 213, 225, 0.68);
        }

        .pif-panel {
          padding: 20px;
          min-width: 0;
        }

        .pif-heading {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          margin-bottom: 16px;
        }

        .pif-heading h2 {
          margin: 5px 0 0;
        }

        .pif-map-layout {
          display: grid;
          grid-template-columns: minmax(0, 1.55fr) minmax(280px, 0.65fr);
          gap: 18px;
        }

        .pif-map-shell {
          min-height: 580px;
          border: 1px solid rgba(148, 163, 184, 0.14);
          border-radius: 24px;
          background:
            radial-gradient(circle at 50% 52%, rgba(96, 165, 250, 0.09), transparent 40%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.34), rgba(2, 6, 23, 0.22));
          overflow: hidden;
        }

        .pif-map-shell svg {
          display: block;
          width: 100%;
          height: auto;
        }

        .pif-marker {
          cursor: pointer;
        }

        .pif-marker circle {
          fill: #0f172a;
          stroke: #ffffff;
          stroke-width: 1.6;
        }

        .pif-marker-low circle {
          fill: #16a34a;
        }

        .pif-marker-medium circle {
          fill: #0284c7;
        }

        .pif-marker-high circle {
          fill: #f97316;
        }

        .pif-marker-critical circle {
          fill: #dc2626;
        }

        .pif-marker.is-selected circle {
          stroke-width: 3;
        }

        .pif-marker text {
          fill: white;
          font-size: 7px;
          font-weight: 950;
          pointer-events: none;
          paint-order: stroke;
          stroke: rgba(2, 6, 23, 0.76);
          stroke-width: 1.2px;
        }

        .pif-legend {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-top: 13px;
          color: rgba(226, 232, 240, 0.82);
          font-size: 12px;
        }

        .pif-legend span {
          display: inline-flex;
          align-items: center;
          gap: 7px;
        }

        .pif-legend i {
          width: 11px;
          height: 11px;
          border-radius: 999px;
        }

        .pif-ranking {
          display: grid;
          align-content: start;
          gap: 8px;
        }

        .pif-ranking h3 {
          margin: 0 0 6px;
        }

        .pif-ranking button {
          display: grid;
          grid-template-columns: 34px minmax(0, 1fr) auto;
          gap: 10px;
          align-items: center;
          width: 100%;
          border: 1px solid rgba(148, 163, 184, 0.15);
          border-radius: 16px;
          background: rgba(15, 23, 42, 0.74);
          color: rgba(226, 232, 240, 0.92);
          padding: 10px;
          text-align: left;
          cursor: pointer;
        }

        .pif-ranking button.is-active {
          border-color: rgba(96, 165, 250, 0.62);
          background: rgba(37, 99, 235, 0.24);
        }

        .pif-ranking button > span {
          display: grid;
          place-items: center;
          width: 30px;
          height: 30px;
          border-radius: 9px;
          color: white;
          font-weight: 900;
        }

        .pif-ranking strong,
        .pif-ranking small {
          display: block;
        }

        .pif-ranking small {
          margin-top: 2px;
          color: rgba(203, 213, 225, 0.68);
        }

        .pif-content {
          display: grid;
          grid-template-columns: minmax(0, 1.3fr) minmax(310px, 0.7fr);
          gap: 18px;
        }

        .pif-findings {
          display: grid;
          gap: 10px;
        }

        .pif-finding {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 12px;
          border: 1px solid rgba(148, 163, 184, 0.15);
          border-radius: 15px;
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.76), rgba(15, 23, 42, 0.44));
          padding: 14px;
        }

        .pif-finding.is-active {
          border-color: rgba(96, 165, 250, 0.62);
        }

        .pif-finding-main {
          all: unset;
          display: block;
          cursor: pointer;
        }

        .pif-finding strong {
          display: block;
          color: white;
        }

        .pif-finding p {
          margin: 6px 0;
          color: rgba(203, 213, 225, 0.68);
          line-height: 1.5;
        }

        .pif-tags {
          display: flex;
          gap: 7px;
          flex-wrap: wrap;
        }

        .pif-tags span {
          border: 1px solid rgba(148, 163, 184, 0.16);
          border-radius: 999px;
          padding: 5px 8px;
          font-size: 11px;
        }

        .pif-detail {
          display: grid;
          align-content: start;
          gap: 12px;
        }

        .pif-detail h3 {
          margin: 0;
          color: white;
        }

        .pif-detail p {
          margin: 0;
          color: rgba(226, 232, 240, 0.82);
          line-height: 1.6;
        }

        .pif-detail-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 9px;
        }

        .pif-detail-grid div {
          border: 1px solid rgba(148, 163, 184, 0.14);
          border-radius: 12px;
          background: rgba(2, 6, 23, 0.32);
          padding: 10px;
        }

        .pif-detail-grid span,
        .pif-detail-grid strong {
          display: block;
        }

        .pif-detail-grid span {
          color: rgba(203, 213, 225, 0.68);
          font-size: 11px;
        }

        .pif-detail-grid strong {
          margin-top: 4px;
        }

        .pif-warning,
        .pif-empty {
          border: 1px dashed rgba(148, 163, 184, 0.22);
          border-radius: 16px;
          padding: 14px;
          color: rgba(203, 213, 225, 0.68);
        }

        .pif-warning {
          margin-top: 12px;
          border-style: solid;
          border-color: rgba(245, 158, 11, 0.34);
          background: rgba(120, 53, 15, 0.22);
          color: rgba(254, 240, 138, 0.95);
        }

        @media (max-width: 1100px) {
          .pif-hero,
          .pif-heading {
            align-items: stretch;
            flex-direction: column;
          }

          .pif-map-layout,
          .pif-content {
            grid-template-columns: 1fr;
          }

          .pif-metrics {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 650px) {
          .pif-page {
            padding: 14px;
          }

          .pif-metrics {
            grid-template-columns: 1fr;
          }

          .pif-actions {
            display: grid;
          }

          .pif-actions select,
          .pif-actions button {
            width: 100%;
          }
        }
      `}</style>

      <section className="pif-hero">
        <div>
          <span className="pif-eyebrow">
            Executive Political Intelligence
          </span>

          <h1>Political Intelligence Fabric</h1>

          <p>
            Map political signals to U.S. states, rank geographic
            risk, inspect findings, maintain watchlists, and
            generate executive intelligence briefs.
          </p>
        </div>

        <div className="pif-actions">
          <label>
            Scope

            <select
              value={scopeType}
              onChange={(event) => {
                const value = event.target.value;
                setScopeType(value);

                if (value === "national") {
                  setScanStateCode("");
                }
              }}
            >
              <option value="national">National</option>
              <option value="state">State</option>
            </select>
          </label>

          {scopeType === "state" ? (
            <label>
              State

              <select
                value={scanStateCode}
                onChange={(event) =>
                  setScanStateCode(event.target.value)
                }
              >
                <option value="">Select state</option>

                {Object.entries(STATE_NAMES).map(
                  ([code, name]) => (
                    <option key={code} value={code}>
                      {name}
                    </option>
                  )
                )}
              </select>
            </label>
          ) : null}

          <button
            type="button"
            className="is-primary"
            onClick={handleScan}
            disabled={
              loading ||
              (scopeType === "state" && !scanStateCode)
            }
          >
            {loading
              ? "Loading..."
              : "Run Intelligence Scan"}
          </button>

          <button
            type="button"
            onClick={handleCreateBrief}
            disabled={loading}
          >
            Create Brief
          </button>

          <button
            type="button"
            onClick={loadOverview}
            disabled={loading}
          >
            Refresh
          </button>
        </div>
      </section>

      {error ? (
        <div className="pif-banner is-error">{error}</div>
      ) : null}

      {message ? (
        <div className="pif-banner is-message">{message}</div>
      ) : null}

      <section className="pif-metrics">
        <MetricCard
          label="Political signals"
          value={findings.length}
          detail="Normalized API findings"
        />

        <MetricCard
          label="Mapped signals"
          value={mappedFindings.length}
          detail={`${unmappedFindings.length} unmapped`}
        />

        <MetricCard
          label="Active states"
          value={activeStates.length}
          detail="States with signal coverage"
        />

        <MetricCard
          label="Watchlist"
          value={watchlist.length}
          detail={`${recentBriefs.length} recent briefs`}
        />
      </section>

      <section className="pif-panel">
        <div className="pif-heading">
          <div>
            <span>National signal distribution</span>
            <h2>Political Signal Map</h2>
          </div>

          <strong>
            {mappedFindings.length}/{findings.length} signals mapped
          </strong>
        </div>

        <PoliticalSignalMap
          stateLookup={stateLookup}
          activeStates={activeStates}
          selectedStateCode={selectedStateCode}
          onSelectState={handleSelectState}
        />

        {unmappedFindings.length ? (
          <div className="pif-warning">
            {unmappedFindings.length} returned signal
            {unmappedFindings.length === 1 ? "" : "s"} could
            not be assigned to a state. Inspect “Normalized scan
            signals” in the browser console.
          </div>
        ) : null}
      </section>

      <section className="pif-content">
        <div className="pif-panel">
          <div className="pif-heading">
            <div>
              <span>AI-ranked intelligence</span>
              <h2>Political Signals</h2>
            </div>

            <strong>{findings.length} findings</strong>
          </div>

          <div className="pif-findings">
            {findings.slice(0, 25).map((finding) => (
              <article
                key={finding.id}
                className={`pif-finding ${
                  selectedFinding?.id === finding.id
                    ? "is-active"
                    : ""
                }`}
              >
                <button
                  type="button"
                  className="pif-finding-main"
                  onClick={() => {
                    setSelectedFinding(finding);

                    const stateCode =
                      resolveFindingStateCode(finding);

                    if (stateCode) {
                      setSelectedStateCode(stateCode);
                      setScanStateCode(stateCode);
                    }
                  }}
                >
                  <strong>{finding.title}</strong>
                  <p>{finding.summary}</p>

                  <div className="pif-tags">
                    <span>
                      {finding.state_code ||
                        "National / unmapped"}
                    </span>

                    <span>{finding.severity}</span>

                    <span>
                      Score {Math.round(finding.score)}
                    </span>

                    <span>{finding.category}</span>
                  </div>
                </button>

                <button
                  type="button"
                  className="pif-watch"
                  onClick={() => handleWatch(finding)}
                >
                  Watch
                </button>
              </article>
            ))}

            {!findings.length ? (
              <div className="pif-empty">
                No political signals were returned. Run a scan
                and inspect the browser console if the backend
                still returns zero findings.
              </div>
            ) : null}
          </div>
        </div>

        <aside className="pif-panel pif-detail">
          <span>Selected intelligence</span>

          {selectedFinding ? (
            <>
              <h3>{selectedFinding.title}</h3>
              <p>{selectedFinding.summary}</p>

              <div className="pif-detail-grid">
                <div>
                  <span>State</span>
                  <strong>
                    {selectedFinding.state_code ||
                      "National / unmapped"}
                  </strong>
                </div>

                <div>
                  <span>Severity</span>
                  <strong>{selectedFinding.severity}</strong> 
                </div>

                <div>
                  <span>Score</span>
                  <strong>
                    {Math.round(selectedFinding.score)}
                  </strong>
                </div>

                <div>
                  <span>Category</span>
                  <strong>{selectedFinding.category}</strong>
                </div>
              </div>

              <button
                type="button"
                className="pif-watch"
                onClick={() => handleWatch(selectedFinding)}
              >
                Add Selected Signal to Watchlist
              </button>
            </>
          ) : (
            <div className="pif-empty">
              Select a state or political signal to inspect it.
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}

