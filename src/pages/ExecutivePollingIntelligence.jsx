import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getExecutivePollingDashboard,
} from "../api/executivePollingIntelligenceApi.js";

import "./ExecutivePollingIntelligence.css";

const POLL_TYPES = [
  { value: "generic-ballot", label: "Generic Ballot" },
  { value: "approval", label: "Approval" },
  { value: "favorability", label: "Favorability" },
  { value: "president", label: "President" },
  { value: "senate", label: "Senate" },
  { value: "governor", label: "Governor" },
  { value: "house", label: "House" },
];

const POPULATIONS = [
  { value: "", label: "All populations" },
  { value: "lv", label: "Likely voters" },
  { value: "rv", label: "Registered voters" },
  { value: "a", label: "All adults" },
];

const formatNumber = (value) =>
  new Intl.NumberFormat("en-US").format(Number(value || 0));

const formatDate = (value) => {
  if (!value) return "No date";
  const date = new Date(`${String(value).slice(0, 10)}T12:00:00`);
  return Number.isFinite(date.getTime())
    ? date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : String(value);
};

const cx = (...classes) =>
  classes.filter(Boolean).join(" ");

function Gauge({ value = 0, label }) {
  const normalized = Math.max(0, Math.min(100, Number(value || 0)));

  return (
    <div className="epi-gauge">
      <div
        className="epi-gauge-ring"
        style={{
          "--gauge-value": `${normalized * 3.6}deg`,
        }}
      >
        <strong>{Math.round(normalized)}%</strong>
      </div>
      <span>{label}</span>
    </div>
  );
}

function KpiCard({
  label,
  value,
  detail,
  accent = false,
}) {
  return (
    <article className={cx("epi-kpi", accent && "is-accent")}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

function GenericAverage({ averages = [] }) {
  const maximum = Math.max(
    1,
    ...averages.map((item) => Number(item.average || 0))
  );

  return (
    <div className="epi-average-list">
      {averages.length === 0 ? (
        <div className="epi-empty">
          No polling average is available for the selected filters.
        </div>
      ) : (
        averages.map((item) => (
          <div className="epi-average-row" key={item.choice}>
            <div>
              <strong>{item.choice}</strong>
              <span>{item.polls} polls</span>
            </div>

            <div className="epi-average-track">
              <div
                className="epi-average-fill"
                style={{
                  width: `${Math.max(
                    3,
                    (Number(item.average || 0) / maximum) * 100
                  )}%`,
                }}
              />
            </div>

            <b>{Number(item.average || 0).toFixed(1)}%</b>
          </div>
        ))
      )}
    </div>
  );
}

function TrendChart({ trend = [] }) {
  const choices = useMemo(() => {
    const count = new Map();

    trend.forEach((point) => {
      point.values?.forEach((value) => {
        count.set(
          value.choice,
          (count.get(value.choice) || 0) + 1
        );
      });
    });

    return [...count.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([choice]) => choice);
  }, [trend]);

  const width = 900;
  const height = 280;
  const padding = {
    top: 24,
    right: 24,
    bottom: 38,
    left: 44,
  };

  const points = trend.slice(-40);

  const yMin = 20;
  const yMax = 60;

  const x = (index) =>
    padding.left +
    (index / Math.max(1, points.length - 1)) *
      (width - padding.left - padding.right);

  const y = (value) =>
    padding.top +
    ((yMax - Number(value)) / (yMax - yMin)) *
      (height - padding.top - padding.bottom);

  const series = choices.map((choice) => ({
    choice,
    points: points
      .map((point, index) => {
        const found = point.values?.find(
          (value) => value.choice === choice
        );

        return found
          ? {
              x: x(index),
              y: y(found.pct),
              pct: found.pct,
              date: point.date,
            }
          : null;
      })
      .filter(Boolean),
  }));

  return (
    <div className="epi-chart-wrap">
      {points.length < 2 || choices.length === 0 ? (
        <div className="epi-empty">
          More polling observations are needed to draw a trend.
        </div>
      ) : (
        <>
          <svg
            className="epi-trend-chart"
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label="Polling trend chart"
          >
            {[20, 30, 40, 50, 60].map((tick) => (
              <g key={tick}>
                <line
                  x1={padding.left}
                  x2={width - padding.right}
                  y1={y(tick)}
                  y2={y(tick)}
                  className="epi-grid-line"
                />
                <text
                  x={padding.left - 10}
                  y={y(tick) + 4}
                  textAnchor="end"
                  className="epi-axis-label"
                >
                  {tick}%
                </text>
              </g>
            ))}

            {series.map((item, index) => {
              const path = item.points
                .map((point, pointIndex) =>
                  `${pointIndex === 0 ? "M" : "L"} ${point.x} ${point.y}`
                )
                .join(" ");

              return (
                <g
                  key={item.choice}
                  className={`epi-series series-${index + 1}`}
                >
                  <path d={path} className="epi-series-line" />
                  {item.points.map((point) => (
                    <circle
                      key={`${item.choice}-${point.date}`}
                      cx={point.x}
                      cy={point.y}
                      r="3"
                      className="epi-series-point"
                    >
                      <title>
                        {item.choice}: {point.pct}% on{" "}
                        {formatDate(point.date)}
                      </title>
                    </circle>
                  ))}
                </g>
              );
            })}

            <text
              x={padding.left}
              y={height - 10}
              className="epi-axis-label"
            >
              {formatDate(points[0]?.date)}
            </text>

            <text
              x={width - padding.right}
              y={height - 10}
              textAnchor="end"
              className="epi-axis-label"
            >
              {formatDate(points[points.length - 1]?.date)}
            </text>
          </svg>

          <div className="epi-chart-legend">
            {choices.map((choice, index) => (
              <span
                key={choice}
                className={`series-${index + 1}`}
              >
                <i />
                {choice}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function PollCard({ poll }) {
  return (
    <article className="epi-poll-card">
      <header>
        <div>
          <strong>{poll.pollster}</strong>
          <span>
            {poll.race_name ||
              poll.office ||
              poll.poll_type}
          </span>
        </div>

        <time>
          {formatDate(
            poll.poll_date ||
            poll.end_date
          )}
        </time>
      </header>

      <div className="epi-poll-meta">
        <span>{poll.population?.toUpperCase() || "N/A"}</span>
        <span>
          {poll.sample_size
            ? `n=${formatNumber(poll.sample_size)}`
            : "Sample unavailable"}
        </span>
        <span>{poll.state || "US"}</span>
        {poll.partisan ? (
          <span>Partisan: {poll.partisan}</span>
        ) : null}
      </div>

      <div className="epi-poll-answers">
        {poll.answers?.map((answer) => (
          <div key={answer.choice}>
            <span>{answer.choice}</span>
            <strong>
              {Number(answer.pct || 0).toFixed(1)}%
            </strong>
          </div>
        ))}
      </div>

      <footer>
        <span>
          Confidence {Math.round(poll.confidence_score || 0)}%
        </span>
        <span>
          Freshness {Math.round(poll.freshness_score || 0)}%
        </span>

        {poll.source_url ? (
          <a
            href={poll.source_url}
            target="_blank"
            rel="noreferrer"
          >
            View source
          </a>
        ) : null}
      </footer>
    </article>
  );
}

export default function ExecutivePollingIntelligence() {
  const [filters, setFilters] = useState({
    poll_type: "generic-ballot",
    population: "",
    state: "US",
    pollster: "",
    measured_only: true,
    recent_limit: 30,
    average_window: 20,
  });

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function load({ quiet = false } = {}) {
    if (quiet) setRefreshing(true);
    else setLoading(true);

    setError("");

    try {
      const payload =
        await getExecutivePollingDashboard(filters);

      setData(payload);
    } catch (requestError) {
      setError(
        requestError?.message ||
        "Unable to load polling intelligence."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      load();
    }, 250);

    return () => clearTimeout(timer);
  }, [
    filters.poll_type,
    filters.population,
    filters.state,
    filters.pollster,
    filters.measured_only,
  ]);

  const summary = data?.summary || {};
  const recentPolls = data?.recent_polls || [];
  const pollsters = data?.pollsters || [];

  return (
    <div className="epi-page">
      <section className="epi-hero">
        <div className="epi-hero-copy">
          <span className="epi-eyebrow">
            Executive Intelligence / Build 5.6
          </span>

          <h1>Executive Polling Intelligence</h1>

          <p>
            Explore live VoteHub polling, national movement,
            pollster activity, sample quality, and executive
            trend signals from one VoterSpheres workspace.
          </p>
        </div>

        <div className="epi-hero-actions">
          <div className="epi-live-badge">
            <i />
            VoteHub live feed
          </div>

          <button
            type="button"
            onClick={() => load({ quiet: true })}
            disabled={refreshing}
          >
            {refreshing ? "Refreshing..." : "Refresh polling"}
          </button>
        </div>
      </section>

      <section className="epi-filter-bar">
        <label>
          <span>Poll type</span>
          <select
            value={filters.poll_type}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                poll_type: event.target.value,
              }))
            }
          >
            {POLL_TYPES.map((option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Population</span>
          <select
            value={filters.population}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                population: event.target.value,
              }))
            }
          >
            {POPULATIONS.map((option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>State</span>
          <input
            value={filters.state}
            maxLength={2}
            placeholder="US"
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                state:
                  event.target.value
                    .toUpperCase()
                    .replace(/[^A-Z]/g, "")
                    .slice(0, 2) || "US",
              }))
            }
          />
        </label>

        <label className="epi-pollster-search">
          <span>Pollster</span>
          <input
            value={filters.pollster}
            placeholder="Search pollsters"
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                pollster: event.target.value,
              }))
            }
          />
        </label>

        <label className="epi-toggle">
          <input
            type="checkbox"
            checked={filters.measured_only}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                measured_only: event.target.checked,
              }))
            }
          />
          <span>Measured polls only</span>
        </label>
      </section>

      {error ? (
        <section className="epi-error">
          <strong>Polling intelligence unavailable</strong>
          <span>{error}</span>
          <button type="button" onClick={() => load()}>
            Try again
          </button>
        </section>
      ) : null}

      {loading ? (
        <section className="epi-loading">
          <div className="epi-spinner" />
          <strong>Loading executive polling intelligence...</strong>
        </section>
      ) : (
        <>
          <section className="epi-kpi-grid">
            <KpiCard
              label="Live Polls"
              value={formatNumber(summary.poll_count)}
              detail={`${formatNumber(summary.answer_count)} answer records`}
              accent
            />

            <KpiCard
              label="Pollsters"
              value={formatNumber(summary.pollster_count)}
              detail="Distinct polling organizations"
            />

            <KpiCard
              label="Latest Poll"
              value={formatDate(summary.latest_poll_date)}
              detail="Most recent field or publication date"
            />

            <KpiCard
              label="Measured Polls"
              value={formatNumber(summary.measured_polls)}
              detail={`${formatNumber(summary.estimated_polls)} estimates excluded`}
            />

            <div className="epi-kpi-gauges">
              <Gauge
                value={summary.average_freshness}
                label="Freshness"
              />
              <Gauge
                value={summary.average_confidence}
                label="Confidence"
              />
            </div>
          </section>

          <section className="epi-main-grid">
            <article className="epi-panel epi-average-panel">
              <header className="epi-panel-header">
                <div>
                  <span>Weighted intelligence</span>
                  <h2>Current Polling Average</h2>
                </div>
                <small>
                  Latest {filters.average_window} polls
                </small>
              </header>

              <GenericAverage averages={data?.averages} />
            </article>

            <article className="epi-panel epi-trend-panel">
              <header className="epi-panel-header">
                <div>
                  <span>Movement over time</span>
                  <h2>Polling Trend</h2>
                </div>
                <small>
                  Last {Math.min(40, data?.trend?.length || 0)} dates
                </small>
              </header>

              <TrendChart trend={data?.trend} />
            </article>
          </section>

          <section className="epi-content-grid">
            <article className="epi-panel epi-recent-panel">
              <header className="epi-panel-header">
                <div>
                  <span>Live polling stream</span>
                  <h2>Recent Polls</h2>
                </div>
                <small>{recentPolls.length} displayed</small>
              </header>

              <div className="epi-poll-grid">
                {recentPolls.length ? (
                  recentPolls.map((poll) => (
                    <PollCard
                      key={`${poll.id}-${poll.population}`}
                      poll={poll}
                    />
                  ))
                ) : (
                  <div className="epi-empty">
                    No polls match the selected filters.
                  </div>
                )}
              </div>
            </article>

            <aside className="epi-panel epi-pollster-panel">
              <header className="epi-panel-header">
                <div>
                  <span>Source concentration</span>
                  <h2>Active Pollsters</h2>
                </div>
                <small>{pollsters.length} ranked</small>
              </header>

              <div className="epi-pollster-list">
                {pollsters.map((pollster, index) => (
                  <button
                    type="button"
                    key={pollster.pollster}
                    onClick={() =>
                      setFilters((current) => ({
                        ...current,
                        pollster:
                          current.pollster === pollster.pollster
                            ? ""
                            : pollster.pollster,
                      }))
                    }
                    className={cx(
                      filters.pollster === pollster.pollster &&
                        "is-selected"
                    )}
                  >
                    <b>{index + 1}</b>
                    <div>
                      <strong>{pollster.pollster}</strong>
                      <span>
                        {pollster.polls} polls · avg n=
                        {formatNumber(pollster.average_sample)}
                      </span>
                    </div>
                    <time>{formatDate(pollster.latest_date)}</time>
                  </button>
                ))}
              </div>
            </aside>
          </section>

          <footer className="epi-attribution">
            <span>
              {data?.attribution ||
                "Polling data powered by VoteHub and stored by VoterSpheres."}
            </span>
            <span>
              Generated {new Date(data?.generated_at).toLocaleString()}
            </span>
          </footer>
        </>
      )}
    </div>
  );
}
