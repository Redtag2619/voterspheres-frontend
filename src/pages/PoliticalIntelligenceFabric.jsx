import { useEffect, useMemo, useState } from "react";

import {
  fetchPoliticalFabricOverview,
  runPoliticalFabricScan,
  createPoliticalFabricBrief,
  savePoliticalFabricWatchlist,
} from "../api/politicalIntelligenceFabricApi";

import "./PoliticalIntelligenceFabric.css";

const WORKSPACE_ID = 1;

const US_STATES = [
  { code: "AL", name: "Alabama" },
  { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" },
  { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" },
  { code: "DE", name: "Delaware" },
  { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" },
  { code: "DC", name: "Washington, D.C." },
];

function severityClass(value = "") {
  return `pif-severity pif-severity--${String(value).toLowerCase()}`;
}

function stateNameFromCode(code = "") {
  return (
    US_STATES.find((state) => state.code === String(code).toUpperCase())
      ?.name || code
  );
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
  const entries = Object.entries(sourceHealth || {});

  return (
    <div className="pif-source-grid">
      {entries.map(([source, health]) => (
        <div className="pif-source" key={source}>
          <span
            className={
              health?.ok
                ? "pif-dot is-online"
                : "pif-dot is-offline"
            }
          />

          <div>
            <strong>{source.replaceAll("_", " ")}</strong>

            <small>
              {health?.ok
                ? `${health?.count || 0} records`
                : "Unavailable"}
            </small>
          </div>
        </div>
      ))}

      {!entries.length && (
        <div className="pif-empty">
          No source-health data available.
        </div>
      )}
    </div>
  );
}

export default function PoliticalIntelligenceFabric() {
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState(null);

  const [scopeType, setScopeType] = useState("national");
  const [stateCode, setStateCode] = useState("");

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadOverview() {
    setLoading(true);
    setError("");

    try {
      const result =
        await fetchPoliticalFabricOverview(WORKSPACE_ID);

      setData(result);
      setSelected(result?.findings?.[0] || null);
    } catch (err) {
      setError(
        err?.message ||
          "Unable to load Political Intelligence Fabric."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOverview();
  }, []);

  const findings = data?.findings || [];
  const metrics = data?.metrics || {};

  const sortedWatchlist = useMemo(() => {
    const priorityOrder = {
      critical: 1,
      high: 2,
      medium: 3,
      low: 4,
    };

    return [...(data?.watchlist || [])].sort((a, b) => {
      const aPriority =
        priorityOrder[String(a?.priority || "").toLowerCase()] ||
        99;

      const bPriority =
        priorityOrder[String(b?.priority || "").toLowerCase()] ||
        99;

      return aPriority - bPriority;
    });
  }, [data]);

  function handleScopeChange(event) {
    const nextScope = event.target.value;

    setScopeType(nextScope);
    setMessage("");
    setError("");

    if (nextScope === "national") {
      setStateCode("");
    }
  }

  function validateScope() {
    if (scopeType === "state" && !stateCode) {
      setError("Select a state before running a state scan.");
      return false;
    }

    return true;
  }

  async function handleScan() {
    if (!validateScope()) {
      return;
    }

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const isStateScan = scopeType === "state";

      const result = await runPoliticalFabricScan({
        workspace_id: WORKSPACE_ID,
        scope_type: scopeType,
        scope_value: isStateScan ? stateCode : null,
        state_code: isStateScan ? stateCode : null,
        states: isStateScan
          ? [stateCode]
          : US_STATES.filter(
              (state) => state.code !== "DC"
            ).map((state) => state.code),
        include_dc: !isStateScan,
        time_horizon: "30d",
        limit: isStateScan ? 75 : 500,
      });

      setData((current) => ({
        ...(current || {}),
        ...(result || {}),
        watchlist:
          result?.watchlist ||
          current?.watchlist ||
          [],
        recent_briefs:
          result?.recent_briefs ||
          current?.recent_briefs ||
          [],
      }));

      setSelected(result?.findings?.[0] || null);

      setMessage(
        isStateScan
          ? `${stateNameFromCode(
              stateCode
            )} political intelligence scan completed.`
          : "National political intelligence scan completed across all 50 states."
      );
    } catch (err) {
      setError(err?.message || "Unable to run scan.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateBrief() {
    if (!validateScope()) {
      return;
    }

    setMessage("");
    setError("");

    try {
      const isStateBrief = scopeType === "state";

      const brief = await createPoliticalFabricBrief({
        workspace_id: WORKSPACE_ID,

        title: isStateBrief
          ? `${stateNameFromCode(
              stateCode
            )} Political Intelligence Brief`
          : "National 50-State Political Intelligence Brief",

        scope_type: scopeType,
        scope_value: isStateBrief ? stateCode : "US",
        state_code: isStateBrief ? stateCode : null,

        states: isStateBrief
          ? [stateCode]
          : US_STATES.filter(
              (state) => state.code !== "DC"
            ).map((state) => state.code),

        include_dc: !isStateBrief,
        time_horizon: "30d",
      });

      setData((current) => ({
        ...(current || {}),
        recent_briefs: [
          brief,
          ...(current?.recent_briefs || []),
        ],
      }));

      setMessage(
        brief?.id
          ? `Brief #${brief.id} created.`
          : "Political intelligence brief created."
      );
    } catch (err) {
      setError(
        err?.message || "Unable to create brief."
      );
    }
  }

  async function handleWatch(finding) {
    if (!finding) {
      return;
    }

    setMessage("");
    setError("");

    try {
      const item =
        await savePoliticalFabricWatchlist({
          workspace_id: WORKSPACE_ID,
          entity_type:
            finding.entity_type || "political_finding",
          entity_id: String(
            finding.entity_id ||
              finding.entity_name ||
              finding.title
          ),
          entity_name:
            finding.entity_name ||
            finding.title ||
            "Political finding",
          state_code: finding.state_code || null,
          priority: finding.severity || "medium",
          rationale:
            finding.summary ||
            "Added from Political Intelligence Fabric.",
          tags: finding.category
            ? [finding.category]
            : [],
        });

      setData((current) => ({
        ...(current || {}),
        watchlist: [
          item,
          ...(current?.watchlist || []).filter(
            (existing) => existing.id !== item.id
          ),
        ],
      }));

      setMessage(
        `${
          finding.entity_name ||
          finding.title ||
          "Finding"
        } added to watchlist.`
      );
    } catch (err) {
      setError(
        err?.message || "Unable to update watchlist."
      );
    }
  }

  return (
    <main className="pif-page">
      <section className="pif-hero">
        <div>
          <p className="pif-eyebrow">
            Unified Executive Intelligence
          </p>

          <h1>Political Intelligence Fabric</h1>

          <p>
            Unified national, state, candidate, coalition,
            vendor, finance, influence, execution, and
            decision intelligence across all 50 states.
          </p>
        </div>

        <div className="pif-hero-actions">
          <select
            value={scopeType}
            onChange={handleScopeChange}
            aria-label="Intelligence scan scope"
          >
            <option value="national">
              National — All 50 States
            </option>

            <option value="state">
              Individual State
            </option>
          </select>

          {scopeType === "state" && (
            <select
              value={stateCode}
              onChange={(event) =>
                setStateCode(event.target.value)
              }
              aria-label="Select state"
            >
              <option value="">
                Select a state
              </option>

              {US_STATES.map((state) => (
                <option
                  key={state.code}
                  value={state.code}
                >
                  {state.name} ({state.code})
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={handleScan}
            disabled={
              loading ||
              (scopeType === "state" && !stateCode)
            }
          >
            {loading
              ? "Scanning..."
              : scopeType === "national"
                ? "Run 50-State Scan"
                : "Run State Scan"}
          </button>

          <button
            type="button"
            className="is-secondary"
            onClick={handleCreateBrief}
            disabled={
              loading ||
              (scopeType === "state" && !stateCode)
            }
          >
            Create Brief
          </button>
        </div>
      </section>

      {(message || error) && (
        <div
          className={
            error
              ? "pif-alert is-error"
              : "pif-alert is-success"
          }
        >
          {error || message}
        </div>
      )}

      <section className="pif-metrics">
        <MetricCard
          label="Material Findings"
          value={metrics.finding_count}
          detail="Ranked signals"
        />

        <MetricCard
          label="Critical"
          value={metrics.critical_count}
          detail="Immediate review"
        />

        <MetricCard
          label="High"
          value={metrics.high_count}
          detail="72-hour window"
        />

        <MetricCard
          label="Source Health"
          value={`${
            metrics.healthy_source_count || 0
          }/${metrics.source_count || 0}`}
          detail="Connected intelligence sources"
        />
      </section>

      <section className="pif-summary">
        <div>
          <span>Executive synthesis</span>

          <h2>
            {data?.executive_summary ||
              "Loading intelligence fabric..."}
          </h2>
        </div>

        <small>
          {data?.generated_at
            ? new Date(
                data.generated_at
              ).toLocaleString()
            : ""}
        </small>
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
            {findings.map((finding, index) => {
              const findingKey = [
                finding.category,
                finding.rank,
                finding.entity_id,
                finding.state_code,
                index,
              ]
                .filter(Boolean)
                .join("-");

              const isActive =
                selected === finding ||
                (selected?.rank === finding.rank &&
                  selected?.entity_id ===
                    finding.entity_id);

              return (
                <button
                  type="button"
                  key={findingKey}
                  className={
                    isActive
                      ? "pif-finding is-active"
                      : "pif-finding"
                  }
                  onClick={() =>
                    setSelected(finding)
                  }
                >
                  <div className="pif-finding-rank">
                    {finding.rank || index + 1}
                  </div>

                  <div>
                    <div className="pif-finding-topline">
                      <span
                        className={severityClass(
                          finding.severity
                        )}
                      >
                        {finding.severity ||
                          "medium"}
                      </span>

                      <small>
                        {String(
                          finding.category ||
                            "political intelligence"
                        ).replaceAll("_", " ")}
                      </small>
                    </div>

                    <strong>
                      {finding.title ||
                        finding.entity_name}
                    </strong>

                    <p>{finding.summary}</p>
                  </div>

                  <b>
                    {Math.round(
                      Number(finding.score) || 0
                    )}
                  </b>
                </button>
              );
            })}

            {!loading && findings.length === 0 && (
              <div className="pif-empty">
                No material findings detected.
              </div>
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
                <span
                  className={severityClass(
                    selected.severity
                  )}
                >
                  {selected.severity || "medium"}
                </span>

                <h3>
                  {selected.title ||
                    selected.entity_name}
                </h3>

                <p>{selected.summary}</p>
              </div>

              <div className="pif-score-row">
                <div>
                  <span>Risk score</span>
                  <strong>
                    {Math.round(
                      Number(selected.score) || 0
                    )}
                  </strong>
                </div>

                <div>
                  <span>Confidence</span>
                  <strong>
                    {Math.round(
                      Number(selected.confidence) || 0
                    )}
                    %
                  </strong>
                </div>

                <div>
                  <span>State</span>
                  <strong>
                    {selected.state_code || "US"}
                  </strong>
                </div>
              </div>

              <h4>Metrics</h4>

              <pre>
                {JSON.stringify(
                  selected.metrics || {},
                  null,
                  2
                )}
              </pre>

              <h4>Evidence</h4>

              <div className="pif-evidence-list">
                {(selected.evidence || []).map(
                  (item, index) => (
                    <div
                      key={`${
                        item.source || "source"
                      }-${index}`}
                    >
                      <strong>
                        {item.label ||
                          item.title ||
                          "Evidence"}
                      </strong>

                      <span>
                        {item.source ||
                          "Political Intelligence Fabric"}
                      </span>
                    </div>
                  )
                )}

                {!selected.evidence?.length && (
                  <div className="pif-empty">
                    No supporting evidence was
                    returned for this finding.
                  </div>
                )}
              </div>

              <button
                type="button"
                className="pif-watch-button"
                onClick={() =>
                  handleWatch(selected)
                }
              >
                Add to Executive Watchlist
              </button>
            </>
          ) : (
            <div className="pif-empty">
              Select a finding to inspect its
              evidence.
            </div>
          )}
        </aside>
      </section>

      <section className="pif-lower-grid">
        <article className="pif-panel">
          <header>
            <div>
              <span>Connected systems</span>
              <h2>Source Health</h2>
            </div>
          </header>

          <SourceHealth
            sourceHealth={data?.source_health}
          />
        </article>

        <article className="pif-panel">
          <header>
            <div>
              <span>Persistent monitoring</span>
              <h2>Watchlist</h2>
            </div>
          </header>

          <div className="pif-watchlist">
            {sortedWatchlist
              .slice(0, 8)
              .map((item) => (
                <div key={item.id}>
                  <span
                    className={severityClass(
                      item.priority
                    )}
                  >
                    {item.priority || "medium"}
                  </span>

                  <div>
                    <strong>
                      {item.entity_name}
                    </strong>

                    <small>
                      {item.entity_type} •{" "}
                      {item.state_code ||
                        "National"}
                    </small>
                  </div>
                </div>
              ))}

            {!sortedWatchlist.length && (
              <div className="pif-empty">
                No watchlist entries.
              </div>
            )}
          </div>
        </article>

        <article className="pif-panel">
          <header>
            <div>
              <span>Generated intelligence</span>
              <h2>Recent Briefs</h2>
            </div>
          </header>

          <div className="pif-briefs">
            {(data?.recent_briefs || [])
              .slice(0, 8)
              .map((brief) => (
                <div key={brief.id}>
                  <strong>{brief.title}</strong>

                  <small>
                    {brief.scope_type} •{" "}
                    {brief.created_at
                      ? new Date(
                          brief.created_at
                        ).toLocaleDateString()
                      : "Recently created"}
                  </small>

                  <p>{brief.executive_summary}</p>
                </div>
              ))}

            {!data?.recent_briefs?.length && (
              <div className="pif-empty">
                No saved briefs.
              </div>
            )}
          </div>
        </article>
      </section>
    </main>
  );
}
