import { useEffect, useMemo, useState } from "react";
import { geoPath } from "d3-geo";
import { feature, mesh } from "topojson-client";
import statesTopology from "us-atlas/states-albers-10m.json";

import {

  fetchPoliticalFabricOverview,

  runPoliticalFabricScan,

  createPoliticalFabricBrief,

  savePoliticalFabricWatchlist

} from "../api/politicalIntelligenceFabricApi";

import "./PoliticalIntelligenceFabric.css";

 

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
  const stateFeatures = useMemo(
    () => feature(statesTopology, statesTopology.objects.states).features,
    []
  );
  const stateBorders = useMemo(
    () =>
      mesh(
        statesTopology,
        statesTopology.objects.states,
        (left, right) => left !== right
      ),
    []
  );
  const path = useMemo(() => geoPath(), []);

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
          <div><strong>{activeStates}</strong><span>Active states</span></div>
          <div><strong>{criticalStates}</strong><span>Critical</span></div>
          <div><strong>{highStates}</strong><span>High</span></div>
        </div>
      </header>

      <div className="pif-heatmap-layout">
        <div className="pif-us-map-column">
          <div className="pif-us-map-frame">
            <svg
              className="pif-us-map"
              viewBox="0 0 975 610"
              role="img"
              aria-label="United States political intelligence heatmap by state"
            >
              <title>United States political intelligence heatmap</title>
              <desc>
                States are shaded by the highest political intelligence score
                found in the current scan. Select a state for focused analysis.
              </desc>

              <g className="pif-us-map-states">
                {stateFeatures.map((stateFeature) => {
                  const fips = String(stateFeature.id).padStart(2, "0");
                  const code = FIPS_TO_STATE[fips];
                  const state = stateData[code];
                  if (!code || !state) return null;

                  const level = heatLevel(state.score);
                  const isSelected = selectedState === code;

                  return (
                    <path
                      key={fips}
                      d={path(stateFeature) || ""}
                      className={[
                        "pif-us-state",
                        `is-${level}`,
                        isSelected ? "is-selected" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      tabIndex="0"
                      role="button"
                      aria-label={`${state.name}, ${state.findingCount} findings, intelligence score ${Math.round(state.score)}`}
                      onClick={() => onSelectState(code)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          onSelectState(code);
                        }
                      }}
                    >
                      <title>
                        {state.name}: {state.findingCount} findings, score {Math.round(state.score)}
                      </title>
                    </path>
                  );
                })}
              </g>

              <path className="pif-us-state-borders" d={path(stateBorders) || ""} />
            </svg>

            <div className="pif-map-instruction">
              Select a state to switch into focused state intelligence.
            </div>
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
                    {state.findingCount} finding{state.findingCount === 1 ? "" : "s"}
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
                Run a national scan to populate the geographic heatmap.
              </div>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}

function findingLocality(finding = {}) {
  return (
    finding.county_name ||
    finding.parish_name ||
    finding.locality_name ||
    finding.county ||
    finding.jurisdiction_name ||
    finding.locality ||
    ""
  );
}

function priorityScore(finding = {}) {
  const severity = SEVERITY_WEIGHT[normalizeSeverity(finding.severity)] || 0;
  const signal = Math.max(0, Math.min(100, Number(finding.score) || 0));
  const confidence = Math.max(
    0,
    Math.min(100, Number(finding.confidence) || 0)
  );

  return Math.round(severity * 0.45 + signal * 0.35 + confidence * 0.2);
}

function actionWindow(score = 0) {
  if (score >= 85) return "Immediate";
  if (score >= 70) return "24 hours";
  if (score >= 55) return "72 hours";
  return "Monitor";
}

function recommendedAction(finding = {}) {
  const category = String(finding.category || "").toLowerCase();

  if (normalizeSeverity(finding.severity) === "critical") {
    return "Escalate to executive review and assign an owner immediately.";
  }

  if (category.includes("donor") || category.includes("fund")) {
    return "Validate the financial signal and prepare a funding response.";
  }

  if (category.includes("coalition") || category.includes("influence")) {
    return "Map affected relationships and begin stakeholder outreach.";
  }

  if (category.includes("vendor") || category.includes("execution")) {
    return "Review execution capacity, ownership, and vendor coverage.";
  }

  if (category.includes("poll") || category.includes("forecast")) {
    return "Revalidate model assumptions and compare adjacent signals.";
  }

  return "Assign for analyst review and define the next operational action.";
}

function AiPriorityQueue({
  findings = [],
  selectedFinding,
  onSelectFinding,
  onWatch,
}) {
  const queue = useMemo(
    () =>
      findings
        .map((finding, index) => ({
          ...finding,
          queueKey:
            finding.id ||
            finding.entity_id ||
            `${finding.category || "finding"}-${finding.rank || index}`,
          priorityScore: priorityScore(finding),
        }))
        .sort(
          (a, b) =>
            b.priorityScore - a.priorityScore ||
            (Number(a.rank) || 999) - (Number(b.rank) || 999)
        ),
    [findings]
  );

  return (
    <section className="pif-panel pif-priority-panel">
      <header className="pif-priority-header">
        <div>
          <span>AI-ranked executive workflow</span>
          <h2>Priority Action Queue</h2>
        </div>

        <div className="pif-priority-summary">
          <div><strong>{queue.length}</strong><span>Queued</span></div>
          <div>
            <strong>{queue.filter((item) => item.priorityScore >= 85).length}</strong>
            <span>Immediate</span>
          </div>
          <div>
            <strong>{queue.filter((item) => item.priorityScore >= 55).length}</strong>
            <span>Actionable</span>
          </div>
        </div>
      </header>

      <div className="pif-priority-list">
        {queue.slice(0, 10).map((item, index) => {
          const isActive =
            selectedFinding?.rank === item.rank &&
            selectedFinding?.entity_id === item.entity_id;

          return (
            <article
              key={item.queueKey}
              className={
                isActive
                  ? "pif-priority-item is-active"
                  : "pif-priority-item"
              }
            >
              <button
                type="button"
                className="pif-priority-main"
                onClick={() => onSelectFinding(item)}
              >
                <span
                  className={`pif-priority-rank is-${heatLevel(
                    item.priorityScore
                  )}`}
                >
                  {index + 1}
                </span>

                <div className="pif-priority-copy">
                  <div className="pif-priority-topline">
                    <span className={severityClass(item.severity)}>
                      {item.severity || "watch"}
                    </span>
                    <small>{actionWindow(item.priorityScore)}</small>
                    <small>
                      {item.state_code || "US"}
                      {findingLocality(item)
                        ? ` • ${findingLocality(item)}`
                        : ""}
                    </small>
                  </div>

                  <strong>{item.title || item.entity_name}</strong>
                  <p>{recommendedAction(item)}</p>
                </div>

                <div className="pif-priority-score">
                  <strong>{item.priorityScore}</strong>
                  <span>priority</span>
                </div>
              </button>

              <div className="pif-priority-actions">
                <button type="button" onClick={() => onSelectFinding(item)}>
                  Inspect
                </button>
                <button
                  type="button"
                  className="is-primary"
                  onClick={() => onWatch(item)}
                >
                  Watch
                </button>
              </div>
            </article>
          );
        })}

        {!queue.length && (
          <div className="pif-empty">
            Run a scan to generate the AI priority queue.
          </div>
        )}
      </div>
    </section>
  );
}

function CountyParishDrilldown({
  findings = [],
  stateCode = "",
  selectedLocality = "",
  onSelectLocality,
  onSelectFinding,
}) {
  const localities = useMemo(() => {
    const localityIndex = new Map();

    findings
      .filter(
        (finding) =>
          String(finding?.state_code || "").toUpperCase() ===
          String(stateCode || "").toUpperCase()
      )
      .forEach((finding) => {
        const name = findingLocality(finding);
        if (!name) return;

        const key = String(name).trim().toLowerCase();
        const current = localityIndex.get(key) || {
          name,
          findingCount: 0,
          score: 0,
          criticalCount: 0,
          highCount: 0,
          topFinding: null,
        };

        const severity = normalizeSeverity(finding.severity);
        const score = Math.max(
          Number(finding.score) || 0,
          SEVERITY_WEIGHT[severity] || 0
        );

        current.findingCount += 1;
        current.score = Math.max(current.score, score);
        if (severity === "critical") current.criticalCount += 1;
        if (severity === "high") current.highCount += 1;

        if (
          !current.topFinding ||
          score > Math.max(
            Number(current.topFinding.score) || 0,
            SEVERITY_WEIGHT[
              normalizeSeverity(current.topFinding.severity)
            ] || 0
          )
        ) {
          current.topFinding = finding;
        }

        localityIndex.set(key, current);
      });

    return [...localityIndex.values()].sort(
      (a, b) =>
        b.score - a.score ||
        b.findingCount - a.findingCount ||
        a.name.localeCompare(b.name)
    );
  }, [findings, stateCode]);

  const selectedRecord = localities.find(
    (locality) => locality.name === selectedLocality
  );

  return (
    <section className="pif-panel pif-locality-panel">
      <header className="pif-locality-header">
        <div>
          <span>Sub-state intelligence</span>
          <h2>County / Parish Drill-Down</h2>
        </div>

        <div className="pif-locality-controls">
          <strong>
            {stateCode ? STATE_NAMES[stateCode] || stateCode : "Select state"}
          </strong>
          <span>{localities.length} active localities</span>
        </div>
      </header>

      {!stateCode ? (
        <div className="pif-empty pif-locality-empty">
          Select a state on the heatmap to inspect county or parish intelligence.
        </div>
      ) : localities.length ? (
        <div className="pif-locality-layout">
          <div className="pif-locality-list">
            {localities.slice(0, 18).map((locality, index) => (
              <button
                type="button"
                key={locality.name}
                className={
                  selectedLocality === locality.name ? "is-active" : ""
                }
                onClick={() => {
                  onSelectLocality(locality.name);
                  if (locality.topFinding) onSelectFinding(locality.topFinding);
                }}
              >
                <span
                  className={`pif-locality-rank is-${heatLevel(
                    locality.score
                  )}`}
                >
                  {index + 1}
                </span>

                <div>
                  <strong>{locality.name}</strong>
                  <small>
                    {locality.findingCount} finding
                    {locality.findingCount === 1 ? "" : "s"}
                    {locality.criticalCount
                      ? ` • ${locality.criticalCount} critical`
                      : locality.highCount
                        ? ` • ${locality.highCount} high`
                        : ""}
                  </small>
                </div>

                <b>{Math.round(locality.score)}</b>
              </button>
            ))}
          </div>

          <aside className="pif-locality-detail">
            {selectedRecord ? (
              <>
                <span>Selected locality</span>
                <h3>{selectedRecord.name}</h3>

                <div className="pif-locality-metrics">
                  <div>
                    <strong>{selectedRecord.findingCount}</strong>
                    <span>Findings</span>
                  </div>
                  <div>
                    <strong>{Math.round(selectedRecord.score)}</strong>
                    <span>Risk score</span>
                  </div>
                  <div>
                    <strong>
                      {selectedRecord.criticalCount + selectedRecord.highCount}
                    </strong>
                    <span>Elevated</span>
                  </div>
                </div>

                <h4>Leading signal</h4>
                <strong>
                  {selectedRecord.topFinding?.title ||
                    selectedRecord.topFinding?.entity_name}
                </strong>
                <p>
                  {selectedRecord.topFinding?.summary ||
                    "No leading signal summary is available."}
                </p>

                <button
                  type="button"
                  onClick={() => onSelectFinding(selectedRecord.topFinding)}
                  disabled={!selectedRecord.topFinding}
                >
                  Open Finding
                </button>
              </>
            ) : (
              <div className="pif-empty">
                Select a county or parish to inspect its leading signal.
              </div>
            )}
          </aside>
        </div>
      ) : (
        <div className="pif-empty pif-locality-empty">
          No county or parish fields were returned for{" "}
          {STATE_NAMES[stateCode] || stateCode}. This panel populates from
          county_name, parish_name, locality_name, county, or jurisdiction_name.
        </div>
      )}
    </section>
  );
}

export default function PoliticalIntelligenceFabric() {

  const [data, setData] = useState(null);

  const [selected, setSelected] = useState(null);
  const [selectedLocality, setSelectedLocality] = useState("");

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
    setSelectedLocality("");
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

 

      <NationalHeatmap
        findings={findings}
        selectedState={scopeType === "state" ? stateCode : ""}
        onSelectState={handleHeatmapStateSelect}
      />

      <AiPriorityQueue
        findings={findings}
        selectedFinding={selected}
        onSelectFinding={setSelected}
        onWatch={handleWatch}
      />

      <CountyParishDrilldown
        findings={findings}
        stateCode={scopeType === "state" ? stateCode : ""}
        selectedLocality={selectedLocality}
        onSelectLocality={setSelectedLocality}
        onSelectFinding={setSelected}
      />

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
