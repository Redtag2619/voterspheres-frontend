import { useEffect, useMemo, useState } from "react";

import {

  fetchPoliticalFabricOverview,

  runPoliticalFabricScan,

  createPoliticalFabricBrief,

  savePoliticalFabricWatchlist

} from "../api/politicalIntelligenceFabricApi";

import "./PoliticalIntelligenceFabric.css";

 

const WORKSPACE_ID = 1;

 

function severityClass(value = "") {

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

          <p className="pif-eyebrow">BUILD 5.0 / EXECUTIVE INTELLIGENCE</p>

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

            <input

              value={stateCode}

              onChange={(e) => setStateCode(e.target.value.toUpperCase().slice(0, 2))}

              placeholder="GA"

              aria-label="State code"

            />

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
