import { useEffect, useMemo, useState } from "react";

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
    const code = String(
      finding?.state_code ||
        finding?.stateCode ||
        finding?.state ||
        ""
    )
      .trim()
      .toUpperCase();

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

  return (
    <div className="pif-map-layout">
      <div className="pif-map-shell">
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

  return (
    <div className="pif-source-list">
      {entries.map(([source, health]) => (
        <div className="pif-source-row" key={source}>
          <span
            className={health?.ok ? "pif-status-dot is-online" : "pif-status-dot is-offline"}
          />
          <div>
            <strong>{titleCase(source)}</strong>
            <small>
              {health?.ok
                ? `${number(health?.count)} records connected`
                : "Source unavailable"}
            </small>
          </div>
          <Badge tone={health?.ok ? "active" : "danger"}>
            {health?.ok ? "Online" : "Offline"}
          </Badge>
        </div>
      ))}
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
          <span>{finding?.state_code || "US"}</span>
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
      const result = await fetchPoliticalFabricOverview(WORKSPACE_ID);
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
      findings.filter((finding) => {
        const code = String(finding?.state_code || "").toUpperCase();
        return Boolean(STATE_NAMES[code]);
      }),
    [findings]
  );

  const activeStates = useMemo(
    () =>
      new Set(
        mappedFindings.map((finding) =>
          String(finding?.state_code).toUpperCase()
        )
      ).size,
    [mappedFindings]
  );

  function handleHeatmapStateSelect(code) {
    setScopeType("state");
    setStateCode(code);

    const matchingFinding = findings.find(
      (finding) =>
        String(finding?.state_code || "").toUpperCase() === code
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
      const result = await runPoliticalFabricScan({
        workspace_id: WORKSPACE_ID,
        scope_type: scopeType,
        scope_value: scopeType === "state" ? stateCode : null,
        state_code: scopeType === "state" ? stateCode : null,
        time_horizon: "30d",
        limit: 75,
      });

      const nextFindings = array(result?.findings);

      setData((current) => ({
        ...(current || {}),
        ...(result || {}),
        watchlist: current?.watchlist || [],
        recent_briefs: current?.recent_briefs || [],
      }));

      setSelected(nextFindings[0] || null);
      setMessage("Political intelligence scan completed.");
    } catch (err) {
      setError(err?.message || "Unable to run political intelligence scan.");
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
        workspace_id: WORKSPACE_ID,
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
        workspace_id: WORKSPACE_ID,
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
      eyebrow="Build 2D.1 · Executive Political Intelligence"
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
          subtext="Connected intelligence sources"
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
                  value={selected?.state_code || "US"}
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
