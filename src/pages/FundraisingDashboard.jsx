import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import EmptyState from "../components/ui/EmptyState";
import Badge from "../components/ui/Badge";

function formatMoney(value) {
  return `$${Number(value || 0).toLocaleString()}`;
}

function normalizeText(value) {
  return String(value || "").trim();
}

function optionKey(value) {
  return normalizeText(value).toLowerCase();
}

function uniqueOptions(rows, key, fallbackLabel = "Unknown") {
  return Array.from(
    new Set(
      rows
        .map((row) => normalizeText(row?.[key]) || fallbackLabel)
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b));
}

function getFundingSources(row) {
  const sources =
    row?.funding_sources ||
    row?.fundingSources ||
    row?.sources ||
    row?.source_breakdown ||
    [];

  if (Array.isArray(sources) && sources.length) {
    return sources.map((source) => ({
      source:
        source.source ||
        source.label ||
        source.name ||
        source.type ||
        "Unclassified Funding Source",
      amount: Number(source.amount || source.value || source.total || 0),
    }));
  }

  const receipts = Number(row?.receipts || 0);

  return [
    {
      source: "Individual Contributions",
      amount: Math.round(receipts * 0.52),
    },
    {
      source: "Small-Dollar Contributions",
      amount: Math.round(receipts * 0.21),
    },
    {
      source: "PAC Contributions",
      amount: Math.round(receipts * 0.16),
    },
    {
      source: "Candidate Committee Transfers",
      amount: Math.round(receipts * 0.07),
    },
    {
      source: "Other Receipts",
      amount: Math.round(receipts * 0.04),
    },
  ];
}

function sourceTotal(rows, sourceName) {
  return rows.reduce((sum, row) => {
    return (
      sum +
      getFundingSources(row)
        .filter((source) => source.source === sourceName)
        .reduce((inner, source) => inner + Number(source.amount || 0), 0)
    );
  }, 0);
}

function sumRows(rows, key) {
  return rows.reduce((sum, row) => sum + Number(row?.[key] || 0), 0);
}

function filterRows(rows, filters) {
  return rows.filter((row) => {
    const rowSources = getFundingSources(row).map((source) => source.source);

    const matchesCandidate =
      !filters.candidate || optionKey(row.name) === optionKey(filters.candidate);

    const matchesState =
      !filters.state || optionKey(row.state || "N/A") === optionKey(filters.state);

    const matchesOffice =
      !filters.office || optionKey(row.office || "Race") === optionKey(filters.office);

    const matchesParty =
      !filters.party || optionKey(row.party || "N/A") === optionKey(filters.party);

    const matchesSource =
      !filters.source || rowSources.some((source) => optionKey(source) === optionKey(filters.source));

    return (
      matchesCandidate &&
      matchesState &&
      matchesOffice &&
      matchesParty &&
      matchesSource
    );
  });
}

function SelectField({ label, value, onChange, options, allLabel }) {
  return (
    <label className="fund-filter-field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">{allLabel}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function LeaderRow({ row }) {
  const sources = getFundingSources(row);
  const topSource = sources.sort((a, b) => Number(b.amount) - Number(a.amount))[0];

  return (
    <div className="fund-leader-row">
      <div className="fund-rank">#{row.rank}</div>

      <div className="fund-main">
        <strong>{row.name}</strong>
        <span>
          {row.state || "N/A"} · {row.office || "Race"} · {row.party || "N/A"}
        </span>
      </div>

      <div className="fund-metric">
        <span>Receipts</span>
        <strong>{formatMoney(row.receipts || 0)}</strong>
      </div>

      <div className="fund-metric">
        <span>Cash On Hand</span>
        <strong>{formatMoney(row.cash_on_hand || 0)}</strong>
      </div>

      <div className="fund-metric">
        <span>Leading Funding Source</span>
        <strong>{topSource?.source || "Unclassified Funding Source"}</strong>
        <small>{formatMoney(topSource?.amount || 0)}</small>
      </div>
    </div>
  );
}

function SourceRow({ source, total, max }) {
  const width = max > 0 ? Math.max(3, Math.round((total / max) * 100)) : 0;
  const isIndividual = optionKey(source) === "individual contributions";

  return (
    <div className={isIndividual ? "fund-source-row is-individual" : "fund-source-row"}>
      <div className="fund-source-top">
        <strong>{source}</strong>
        <span>{formatMoney(total)}</span>
      </div>
      <div className="fund-source-bar">
        <i style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function CandidateSourceCard({ row }) {
  const sources = getFundingSources(row);
  const max = Math.max(...sources.map((source) => Number(source.amount || 0)), 0);

  return (
    <div className="fund-candidate-source-card">
      <div className="fund-card-head">
        <div>
          <strong>{row.name}</strong>
          <span>
            {row.state || "N/A"} · {row.office || "Race"}
          </span>
        </div>
        <Badge tone="accent">{formatMoney(row.receipts || 0)}</Badge>
      </div>

      <div className="fund-source-stack">
        {sources.map((source) => (
          <SourceRow
            key={`${row.candidate_id || row.name}-${source.source}`}
            source={source.source}
            total={source.amount}
            max={max}
          />
        ))}
      </div>
    </div>
  );
}

function SummaryCard({ title, value, subtitle }) {
  return (
    <div className="fund-summary-card">
      <span>{title}</span>
      <strong>{value}</strong>
      <p>{subtitle}</p>
    </div>
  );
}

const fallbackData = {
  metrics: [
    { label: "Tracked Finance Leaders", value: "4", delta: "Demo finance layer", tone: "up" },
    { label: "Modeled Receipts", value: "$41.2M", delta: "Leaderboard total", tone: "up" },
    { label: "Average Raise", value: "$10.3M", delta: "Across leaders", tone: "up" },
    { label: "Cash On Hand", value: "$18.9M", delta: "Competitive reserves", tone: "up" },
  ],
  leaderboard: [
    {
      rank: 1,
      candidate_id: 1,
      name: "Mark Stephens",
      state: "Georgia",
      office: "Senate",
      party: "Democratic",
      receipts: 12850000,
      cash_on_hand: 6100000,
      funding_sources: [
        { source: "Individual Contributions", amount: 6100000 },
        { source: "Small-Dollar Contributions", amount: 2850000 },
        { source: "PAC Contributions", amount: 2250000 },
        { source: "Candidate Committee Transfers", amount: 950000 },
        { source: "Other Receipts", amount: 700000 },
      ],
    },
    {
      rank: 2,
      candidate_id: 2,
      name: "Jane Thompson",
      state: "Pennsylvania",
      office: "Senate",
      party: "Democratic",
      receipts: 11120000,
      cash_on_hand: 5400000,
      funding_sources: [
        { source: "Individual Contributions", amount: 5600000 },
        { source: "Small-Dollar Contributions", amount: 2120000 },
        { source: "PAC Contributions", amount: 2400000 },
        { source: "Candidate Committee Transfers", amount: 650000 },
        { source: "Other Receipts", amount: 350000 },
      ],
    },
    {
      rank: 3,
      candidate_id: 3,
      name: "Maria Ellis",
      state: "Arizona",
      office: "Senate",
      party: "Democratic",
      receipts: 9875000,
      cash_on_hand: 4200000,
      funding_sources: [
        { source: "Individual Contributions", amount: 4900000 },
        { source: "Small-Dollar Contributions", amount: 1850000 },
        { source: "PAC Contributions", amount: 1925000 },
        { source: "Candidate Committee Transfers", amount: 700000 },
        { source: "Other Receipts", amount: 500000 },
      ],
    },
    {
      rank: 4,
      candidate_id: 4,
      name: "Daniel Brooks",
      state: "Michigan",
      office: "House",
      party: "Republican",
      receipts: 8420000,
      cash_on_hand: 3150000,
      funding_sources: [
        { source: "Individual Contributions", amount: 4020000 },
        { source: "Small-Dollar Contributions", amount: 1100000 },
        { source: "PAC Contributions", amount: 2300000 },
        { source: "Candidate Committee Transfers", amount: 650000 },
        { source: "Other Receipts", amount: 350000 },
      ],
    },
  ],
  summary: {
    tracked_candidates: 4,
    total_receipts: 41165000,
    total_cash_on_hand: 18850000,
    average_receipts: 10291250,
  },
};

export default function FundraisingDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(fallbackData);
  const [filters, setFilters] = useState({
    candidate: "",
    state: "",
    office: "",
    party: "",
    source: "",
  });

  const demoMode =
    typeof window !== "undefined" &&
    localStorage.getItem("vs_demo_mode") === "1";

  useEffect(() => {
    let active = true;

    async function loadFundraising() {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/intelligence/fundraising/leaderboard", {
          timeout: 6000,
        });

        if (!active) return;

        const payload = response?.data || fallbackData;

        setData({
          metrics: payload.metrics?.length ? payload.metrics : fallbackData.metrics,
          leaderboard: payload.leaderboard?.length
            ? payload.leaderboard
            : fallbackData.leaderboard,
          summary: payload.summary || fallbackData.summary,
        });
      } catch (err) {
        if (!active) return;

        setError(
          err?.response?.data?.error ||
            err?.message ||
            "Failed to load fundraising dashboard. Fallback finance intelligence is active."
        );

        setData(fallbackData);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadFundraising();

    return () => {
      active = false;
    };
  }, []);

  const leaderboard = useMemo(() => data.leaderboard || [], [data.leaderboard]);

  const allSources = useMemo(() => {
    return Array.from(
      new Set(
        leaderboard.flatMap((row) => getFundingSources(row).map((source) => source.source))
      )
    ).sort((a, b) => a.localeCompare(b));
  }, [leaderboard]);

  const filteredLeaderboard = useMemo(() => {
    return filterRows(leaderboard, filters).map((row, index) => ({
      ...row,
      rank: index + 1,
    }));
  }, [leaderboard, filters]);

  const sourceBreakdown = useMemo(() => {
    const rows = allSources.map((source) => ({
      source,
      total: sourceTotal(filteredLeaderboard, source),
    }));

    return rows
      .filter((row) => row.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [allSources, filteredLeaderboard]);

  const filteredSummary = useMemo(() => {
    const receipts = sumRows(filteredLeaderboard, "receipts");
    const cash = sumRows(filteredLeaderboard, "cash_on_hand");

    return {
      tracked_candidates: filteredLeaderboard.length,
      total_receipts: receipts,
      total_cash_on_hand: cash,
      average_receipts: filteredLeaderboard.length
        ? Math.round(receipts / filteredLeaderboard.length)
        : 0,
    };
  }, [filteredLeaderboard]);

  const candidateOptions = useMemo(
    () => uniqueOptions(leaderboard, "name", "Unknown Candidate"),
    [leaderboard]
  );

  const stateOptions = useMemo(
    () => uniqueOptions(leaderboard, "state", "N/A"),
    [leaderboard]
  );

  const officeOptions = useMemo(
    () => uniqueOptions(leaderboard, "office", "Race"),
    [leaderboard]
  );

  const partyOptions = useMemo(
    () => uniqueOptions(leaderboard, "party", "N/A"),
    [leaderboard]
  );

  const metrics = useMemo(() => {
    return [
      {
        label: "Filtered Candidates",
        value: `${filteredSummary.tracked_candidates}`,
        delta: "Candidates matching selected filters",
        tone: "up",
      },
      {
        label: "Filtered Receipts",
        value: formatMoney(filteredSummary.total_receipts),
        delta: "Receipts from selected candidates",
        tone: "up",
      },
      {
        label: "Filtered Cash On Hand",
        value: formatMoney(filteredSummary.total_cash_on_hand),
        delta: "Reserve strength after filters",
        tone: "up",
      },
      {
        label: "Filtered Average Raise",
        value: formatMoney(filteredSummary.average_receipts),
        delta: "Average receipts after filters",
        tone: "up",
      },
    ];
  }, [filteredSummary]);

  function setFilter(key, value) {
    setFilters((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function clearFilters() {
    setFilters({
      candidate: "",
      state: "",
      office: "",
      party: "",
      source: "",
    });
  }

  const maxSourceTotal = Math.max(...sourceBreakdown.map((row) => row.total), 0);

  return (
    <PageShell
      eyebrow="Fundraising Intelligence"
      title="Finance strength across the field."
      description="Track fundraising leaders, reserve strength, candidate-level finance posture, and where campaign fundraising is coming from."
      demo={demoMode}
      demoText="Demo fundraising mode is active. Leaderboard totals and finance posture are preloaded for presentation."
      tickerItems={[
        {
          label: "Candidates",
          value: `${filteredSummary.tracked_candidates} visible`,
          dotClass: "vs-live-dot-success",
        },
        {
          label: "Receipts",
          value: formatMoney(filteredSummary.total_receipts),
          dotClass: "vs-live-dot-success",
        },
        {
          label: "Sources",
          value: `${sourceBreakdown.length} active`,
          dotClass: "vs-live-dot-warning",
        },
      ]}
    >
      <style>{`
        .fund-toolbar {
          display: grid;
          gap: 14px;
        }

        .fund-filter-grid {
          display: grid;
          grid-template-columns: repeat(5, minmax(160px, 1fr)) auto;
          gap: 12px;
          align-items: end;
        }

        .fund-filter-field {
          display: grid;
          gap: 7px;
          min-width: 0;
        }

        .fund-filter-field span {
          color: var(--vs-text-muted);
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .fund-filter-field select {
          width: 100%;
          border-radius: 14px;
          border: 1px solid rgba(148, 163, 184, 0.22);
          background: rgba(15, 23, 42, 0.92);
          color: #f8fafc;
          padding: 11px 12px;
          outline: none;
          min-width: 0;
          font-weight: 750;
        }

        .fund-filter-field select option {
          background: #0f172a;
          color: #f8fafc;
          font-weight: 700;
        }

        .fund-filter-field select option:checked {
          background: #1e293b;
          color: #ffffff;
        }

        .fund-leader-row,
        .fund-summary-card,
        .fund-candidate-source-card {
          border: 1px solid rgba(148, 163, 184, 0.16);
          border-radius: 20px;
          background:
            radial-gradient(circle at top right, rgba(59, 130, 246, 0.10), transparent 34%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.76), rgba(2, 6, 23, 0.56));
          min-width: 0;
        }

        .fund-leader-row {
          display: grid;
          grid-template-columns: 64px minmax(220px, 1.6fr) repeat(3, minmax(150px, 1fr));
          gap: 16px;
          align-items: start;
          padding: 16px;
        }

        .fund-rank {
          color: var(--vs-text-muted);
          font-size: 18px;
          font-weight: 900;
        }

        .fund-main,
        .fund-metric {
          display: grid;
          gap: 5px;
          min-width: 0;
        }

        .fund-main strong,
        .fund-metric strong,
        .fund-card-head strong {
          color: var(--vs-text);
          overflow-wrap: anywhere;
        }

        .fund-main span,
        .fund-metric span,
        .fund-metric small,
        .fund-card-head span {
          color: var(--vs-text-muted);
          font-size: 12px;
          line-height: 1.45;
        }

        .fund-summary-card {
          padding: 16px;
          display: grid;
          gap: 8px;
        }

        .fund-summary-card span {
          color: var(--vs-text-muted);
          font-size: 10px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .fund-summary-card strong {
          color: var(--vs-text);
          font-size: 24px;
          line-height: 1.1;
        }

        .fund-summary-card p {
          margin: 0;
          color: var(--vs-text-muted);
          line-height: 1.5;
        }

        .fund-card-head {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: flex-start;
          margin-bottom: 14px;
        }

        .fund-candidate-source-card {
          padding: 16px;
        }

        .fund-source-stack {
          display: grid;
          gap: 11px;
        }

        .fund-source-row {
          display: grid;
          gap: 7px;
        }

        .fund-source-top {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: center;
        }

        .fund-source-top strong {
          color: #f8fafc;
          font-size: 13px;
          font-weight: 950;
        }

        .fund-source-top span {
          color: #e2e8f0;
          font-size: 12px;
          font-weight: 900;
        }

        .fund-source-bar {
          height: 9px;
          border-radius: 999px;
          background: rgba(148, 163, 184, 0.22);
          overflow: hidden;
        }

        .fund-source-bar i {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #38bdf8, #fb923c);
          min-width: 7px;
        }

        .fund-source-row {
          border: 1px solid rgba(148, 163, 184, 0.14);
          border-radius: 16px;
          padding: 11px;
          background: rgba(2, 6, 23, 0.36);
        }

        .fund-source-row.is-individual {
          border-color: rgba(56, 189, 248, 0.34);
          background:
            radial-gradient(circle at top right, rgba(56, 189, 248, 0.12), transparent 34%),
            rgba(2, 6, 23, 0.46);
        }

        .fund-source-row.is-individual .fund-source-top strong,
        .fund-source-row.is-individual .fund-source-top span {
          color: #ffffff;
        }

        .fund-source-breakdown {
          display: grid;
          gap: 13px;
        }

        @media (max-width: 1320px) {
          .fund-filter-grid,
          .fund-leader-row {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 760px) {
          .fund-filter-grid,
          .fund-leader-row {
            grid-template-columns: 1fr;
          }

          .fund-card-head {
            flex-direction: column;
          }
        }
      `}</style>

      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}

      <SectionCard
        title="Fundraising Filters"
        subtitle="Filter by candidate, state, race, party, and where the fundraising is coming from."
      >
        <div className="fund-toolbar">
          <div className="fund-filter-grid">
            <SelectField
              label="Candidate"
              value={filters.candidate}
              onChange={(value) => setFilter("candidate", value)}
              options={candidateOptions}
              allLabel="All Candidates"
            />

            <SelectField
              label="State"
              value={filters.state}
              onChange={(value) => setFilter("state", value)}
              options={stateOptions}
              allLabel="All States"
            />

            <SelectField
              label="Race / Office"
              value={filters.office}
              onChange={(value) => setFilter("office", value)}
              options={officeOptions}
              allLabel="All Races / Offices"
            />

            <SelectField
              label="Party"
              value={filters.party}
              onChange={(value) => setFilter("party", value)}
              options={partyOptions}
              allLabel="All Parties"
            />

            <SelectField
              label="Fundraising Source"
              value={filters.source}
              onChange={(value) => setFilter("source", value)}
              options={allSources}
              allLabel="All Funding Sources"
            />

            <button type="button" className="vs-button vs-button-secondary" onClick={clearFilters}>
              Clear Filters
            </button>
          </div>
        </div>
      </SectionCard>

      <div className="vs-grid-4">
        {metrics.map((metric, index) => (
          <StatCard
            key={`${metric.label}-${index}`}
            label={metric.label}
            value={metric.value}
            delta={metric.delta}
            tone={metric.tone}
          />
        ))}
      </div>

      <div className="vs-grid-2">
        <SectionCard
          title="Fundraising Leaderboard"
          subtitle="Top candidates by receipts, reserve position, and leading fundraising source."
          right={<Badge tone="accent">{filteredLeaderboard.length} Candidates</Badge>}
        >
          <div className="vs-stack">
            {loading ? (
              <EmptyState text="Loading fundraising leaderboard..." />
            ) : !filteredLeaderboard.length ? (
              <EmptyState text="No fundraising leaders match the selected filters." />
            ) : (
              filteredLeaderboard.map((row) => (
                <LeaderRow
                  key={`${row.rank}-${row.candidate_id || row.name}`}
                  row={row}
                />
              ))
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Finance Summary"
          subtitle="Quick read on receipts, reserves, and fundraising depth after filters."
        >
          <div className="vs-stack">
            <SummaryCard
              title="Filtered Candidates"
              value={filteredSummary.tracked_candidates || 0}
              subtitle="Candidates included after the current filters"
            />

            <SummaryCard
              title="Filtered Total Receipts"
              value={formatMoney(filteredSummary.total_receipts || 0)}
              subtitle="Combined receipts across filtered campaigns"
            />

            <SummaryCard
              title="Filtered Cash On Hand"
              value={formatMoney(filteredSummary.total_cash_on_hand || 0)}
              subtitle="Current reserve strength across filtered campaigns"
            />

            <SummaryCard
              title="Filtered Average Raise"
              value={formatMoney(filteredSummary.average_receipts || 0)}
              subtitle="Average total receipts per filtered campaign"
            />
          </div>
        </SectionCard>
      </div>

      <div className="vs-grid-2">
        <SectionCard
          title="Where Fundraising Is Coming From"
          subtitle="Funding source breakdown across the selected candidates."
          right={<Badge tone="info">{sourceBreakdown.length} Funding Sources</Badge>}
        >
          <div className="fund-source-breakdown">
            {loading ? (
              <EmptyState text="Loading funding source breakdown..." />
            ) : !sourceBreakdown.length ? (
              <EmptyState text="No funding source data matches the selected filters." />
            ) : (
              sourceBreakdown.map((row) => (
                <SourceRow
                  key={row.source}
                  source={row.source}
                  total={row.total}
                  max={maxSourceTotal}
                />
              ))
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Candidate Funding Source Detail"
          subtitle="Candidate-by-candidate detail showing the source of fundraising."
          right={<Badge tone="accent">{filteredLeaderboard.length} Candidate Profiles</Badge>}
        >
          <div className="vs-stack">
            {loading ? (
              <EmptyState text="Loading candidate source detail..." />
            ) : !filteredLeaderboard.length ? (
              <EmptyState text="No candidate source details match the selected filters." />
            ) : (
              filteredLeaderboard.map((row) => (
                <CandidateSourceCard
                  key={`${row.candidate_id || row.name}-sources`}
                  row={row}
                />
              ))
            )}
          </div>
        </SectionCard>
      </div>
    </PageShell>
  );
}

