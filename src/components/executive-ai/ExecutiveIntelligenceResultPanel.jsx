function list(value) { return Array.isArray(value) ? value : []; }
function label(source = {}) { return source.source || source.name || source.provider || source.publisher || source.tool || "Verified source"; }
function dateLabel(source = {}) { return source.published_at || source.reporting_period || source.freshness || source.fetched_at || "Date unavailable"; }

export default function ExecutiveIntelligenceResultPanel({ result }) {
  if (!result || typeof result !== "object") return null;
  const coverage = result?.execution?.coverage || {};
  const confidence = Number(result?.execution?.confidence || result?.briefing?.confidence || 0);
  const sources = list(result.sources);
  const warnings = list(result.warnings);
  const tools = list(result.tool_results);
  const evidenceStatus = coverage.evidence_status || (result.ok ? "live" : "unavailable");

  return (
    <div className={`cmd-intelligence-proof is-${evidenceStatus}`}>
      <div className="cmd-intelligence-proof-head">
        <div>
          <span>Build 4.1 Evidence Gate</span>
          <strong>{evidenceStatus === "live" ? "Verified live intelligence" : evidenceStatus === "partial" ? "Partial live intelligence" : "Live intelligence unavailable"}</strong>
        </div>
        <div className="cmd-intelligence-proof-metrics">
          <span>Confidence <strong>{Math.round(confidence)}%</strong></span>
          <span>Useful tools <strong>{Number(coverage.useful_tools || 0)}/{Number(coverage.attempted_tools || 0)}</strong></span>
          <span>Sources <strong>{sources.length}</strong></span>
        </div>
      </div>

      {sources.length ? (
        <details>
          <summary>View retrieved sources and dates</summary>
          <div className="cmd-intelligence-source-list">
            {sources.slice(0, 12).map((source, index) => {
              const url = source.source_url || source.url;
              return (
                <div key={`${label(source)}-${index}`}>
                  <strong>{label(source)}</strong>
                  <small>{dateLabel(source)} · {source.tool || source.provider || "Live provider"}</small>
                  {url ? <a href={url} target="_blank" rel="noreferrer">Open source</a> : null}
                </div>
              );
            })}
          </div>
        </details>
      ) : null}

      {tools.length ? (
        <details>
          <summary>View intelligence tool execution</summary>
          <div className="cmd-intelligence-tool-list">
            {tools.map((tool) => (
              <div key={tool.tool} className={tool.usable ? "is-usable" : "is-empty"}>
                <strong>{tool.tool}</strong>
                <small>{tool.usable ? "Usable evidence" : "No usable evidence"} · {tool.latency_ms || 0}ms</small>
                <p>{tool.summary || tool.warnings?.[0] || "No provider summary."}</p>
              </div>
            ))}
          </div>
        </details>
      ) : null}

      {warnings.length ? (
        <details>
          <summary>{warnings.length} provider warning{warnings.length === 1 ? "" : "s"}</summary>
          <ul>{warnings.slice(0, 10).map((warning) => <li key={warning}>{warning}</li>)}</ul>
        </details>
      ) : null}
    </div>
  );
}

