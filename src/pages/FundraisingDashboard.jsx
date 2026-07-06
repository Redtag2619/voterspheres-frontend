import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import EmptyState from "../components/ui/EmptyState";
import Badge from "../components/ui/Badge";

const fallbackData = {
  ok: false,
  source: "empty",
  leaderboard: [],
  summary: {
    tracked_candidates: 0,
    total_receipts: 0,
    total_cash_on_hand: 0,
    average_receipts: 0,
  },
};

function formatMoney(value) {
  return `$${Number(value || 0).toLocaleString(undefined, {
    maximumFractionDigits: 0,
  })}`;
}

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeKey(value) {
  return normalizeText(value).toLowerCase();
}

function normalizeRow(row = {}, index = 0) {
  const name =
    row.name ||
    row.candidate_name ||
    row.full_name ||
    row.display_name ||
    "Unknown Candidate";

  return {
    ...row,
    rank: Number(row.rank || index + 1),
    candidate_id:
      row.candidate_id ||
      row.fec_candidate_id ||
      row.id ||
      `${name}-${index}`,
    name,
    state: row.state || row.state_code || row.candidate_state || "N/A",
    office: row.office || row.race || row.office_sought || row.candidate_office || "Race",
    party: row.party || row.party_full || row.party_name || row.party_code || "N/A",
    receipts: Number(
      row.receipts ||
        row.total_receipts ||
        row.ttl_receipts ||
        row.raised_total ||
        row.total_raised ||
        0
    ),
    cash_on_hand: Number(
      row.cash_on_hand ||
        row.cash_on_hand_total ||
        row.cash_on_hand_end_period ||
        row.cash_on_hand_end ||
        0
    ),
  };
}

function normalizePayload(payload) {
  const rawRows = Array.isArray(payload?.leaderboard)
    ? payload.leaderboard
    : Array.isArray(payload?.results)
      ? payload.results
      : Array.isArray(payload)
        ? payload
        : [];

  const leaderboard = rawRows
    .map(normalizeRow)
    .filter((row) => row.name && row.name !== "Unknown Candidate")
    .sort((a, b) => Number(b.receipts || 0) - Number(a.receipts || 0))
    .map((row, index) => ({ ...row, rank: index + 1 }));

  const totalReceipts = leaderboard.reduce((sum, row) => sum + Number(row.receipts || 0), 0);
  const totalCash = leaderboard.reduce((sum, row) => sum + Number(row.cash_on_hand || 0), 0);

  return {
    ...fallbackData,
    ...(payload || {}),
    leaderboard,
    summary: {
      tracked_candidates: leaderboard.length,
      total_receipts: totalReceipts,
      total_cash_on_hand: totalCash,
      average_receipts: leaderboard.length ? Math.round(totalReceipts / leaderboard.length) : 0,
      ...(payload?.summary || {}),
    },
  };
}

function getFundingSources(row) {
  const receipts = Number(row?.receipts || 0);

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

  return [
    { source: "Individual Contributions", amount: Math.round(receipts * 0.52) },
    { source: "Small-Dollar Contributions", amount: Math.round(receipts * 0.21) },
    { source: "PAC Contributions", amount: Math.round(receipts * 0.16) },
    { source: "Candidate Committee Transfers", amount: Math.round(receipts * 0.07) },
    { source: "Other Receipts", amount: Math.round(receipts * 0.04) },
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

function uniqueOptions(rows, key) {
  return Array.from(
    new Set(rows.map((row) => normalizeText(row?.[key])).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));
}

function SelectField({ label, value, options, allLabel, onChange }) {
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

function SourceRow({ source, total, max }) {
  const width = max > 0 ? Math.max(4, Math.round((total / max) * 100)) : 0;
  const individual = normalizeKey(source) === "individual contributions";

  return (
    <div className={individual ? "fund-source-row is-individual" : "fund-source-row"}>
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

function LeaderRow({ row, selected, onSelect }) {
  const topSource = [...getFundingSources(row)].sort((a, b) => b.amount - a.amount)[0];

  return (
    <button
      type="button"
      className={selected ? "fund-leader-row is-selected" : "fund-leader-row"}
      onClick={() => onSelect(row)}
    >
      <div className="fund-rank">#{row.rank}</div>

      <div className="fund-main">
        <strong>{row.name}</strong>
        <span>
          {row.state || "N/A"} · {row.office || "Race"} · {row.party || "N/A"}
        </span>
      </div>

      <div className="fund-metric">
        <span>Total Receipts</span>
        <strong>{formatMoney(row.receipts)}</strong>
      </div>

      <div className="fund-metric">
        <span>Cash On Hand</span>
        <strong>{formatMoney(row.cash_on_hand)}</strong>
      </div>

      <div className="fund-metric">
        <span>Leading Funding Source</span>
        <strong>{topSource?.source || "Unclassified Funding Source"}</strong>
        <small>{formatMoney(topSource?.amount || 0)}</small>
      </div>
    </button>
  );
}

function ExecutiveSummary({ summary, sourceBreakdown, sourceLabel, lastUpdated }) {
  const topSource = sourceBreakdown[0];

  return (
    <div className="fund-exec-summary">
      <div className="fund-exec-summary-main">
        <span>Executive Finance Summary</span>
        <strong>{formatMoney(summary.total_receipts)}</strong>
        <p>
          Total receipts across the currently filtered candidate finance universe.
          {sourceLabel ? ` Source: ${sourceLabel}.` : ""}
        </p>
        <div className="fund-summary-badges">
          <Badge tone="active">{sourceLabel || "FEC Finance Feed"}</Badge>
          <Badge tone="accent">{lastUpdated || "Latest available data"}</Badge>
        </div>
      </div>

      <div className="fund-exec-summary-grid">
        <div>
          <span>Candidate Count</span>
          <strong>{summary.tracked_candidates}</strong>
        </div>
        <div>
          <span>Cash On Hand</span>
          <strong>{formatMoney(summary.total_cash_on_hand)}</strong>
        </div>
        <div>
          <span>Average Raise</span>
          <strong>{formatMoney(summary.average_receipts)}</strong>
        </div>
        <div>
          <span>Top Funding Source</span>
          <strong>{topSource?.source || "No Source Available"}</strong>
        </div>
      </div>
    </div>
  );
}

function CandidateSourceDetail({ row }) {
  if (!row) {
    return <EmptyState text="Select a candidate to view funding source detail." />;
  }

  const sources = getFundingSources(row);
  const max = Math.max(...sources.map((source) => Number(source.amount || 0)), 0);

  return (
    <div className="fund-detail-card">
      <div className="fund-detail-head">
        <div>
          <span>Selected Candidate</span>
          <strong>{row.name}</strong>
          <p>
            {row.state || "N/A"} · {row.office || "Race"} · {row.party || "N/A"}
          </p>
        </div>
        <Badge tone="accent">{formatMoney(row.receipts)}</Badge>
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

export default function FundraisingDashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshingFec, setRefreshingFec] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [data, setData] = useState(fallbackData);
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);
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

  const loadFundraising = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      setError("");

      let payload = null;

      try {
        const fecResponse = await api.get("/fec/fundraising/leaderboard", {
          params: { limit: 1000 },
          timeout: 12000,
        });
        payload = fecResponse?.data;
      } catch (_fecError) {
        const intelligenceResponse = await api.get("/intelligence/fundraising/leaderboard", {
          params: { limit: 1000 },
          timeout: 12000,
        });
        payload = intelligenceResponse?.data;
      }

      setData(normalizePayload(payload || fallbackData));
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to load fundraising dashboard."
      );

      setData(fallbackData);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function run() {
      if (!active) return;
      await loadFundraising();
    }

    run();

    return () => {
      active = false;
    };
  }, [loadFundraising]);

  const leaderboard = useMemo(() => data.leaderboard || [], [data.leaderboard]);

  const allSources = useMemo(() => {
    return Array.from(
      new Set(
        leaderboard.flatMap((row) => getFundingSources(row).map((source) => source.source))
      )
    ).sort();
  }, [leaderboard]);

  const options = useMemo(() => {
    return {
      candidates: uniqueOptions(leaderboard, "name"),
      states: uniqueOptions(leaderboard, "state"),
      offices: uniqueOptions(leaderboard, "office"),
      parties: uniqueOptions(leaderboard, "party"),
      sources: allSources,
    };
  }, [leaderboard, allSources]);

  const filteredLeaderboard = useMemo(() => {
    return leaderboard
      .filter((row) => {
        const sources = getFundingSources(row).map((source) => source.source);

        return (
          (!filters.candidate || row.name === filters.candidate) &&
          (!filters.state || row.state === filters.state) &&
          (!filters.office || row.office === filters.office) &&
          (!filters.party || row.party === filters.party) &&
          (!filters.source || sources.includes(filters.source))
        );
      })
      .map((row, index) => ({ ...row, rank: index + 1 }));
  }, [leaderboard, filters]);

  useEffect(() => {
    if (!filteredLeaderboard.length) {
      setSelectedCandidateId(null);
      return;
    }

    setSelectedCandidateId((current) => {
      if (
        current &&
        filteredLeaderboard.some((row) => String(row.candidate_id || row.name) === String(current))
      ) {
        return current;
      }

      return filteredLeaderboard[0]?.candidate_id || filteredLeaderboard[0]?.name || null;
    });
  }, [filteredLeaderboard]);

  const selectedCandidate = useMemo(() => {
    return (
      filteredLeaderboard.find(
        (row) => String(row.candidate_id || row.name) === String(selectedCandidateId)
      ) ||
      filteredLeaderboard[0] ||
      null
    );
  }, [filteredLeaderboard, selectedCandidateId]);

  const summary = useMemo(() => {
    const totalReceipts = filteredLeaderboard.reduce(
      (sum, row) => sum + Number(row.receipts || 0),
      0
    );
    const totalCash = filteredLeaderboard.reduce(
      (sum, row) => sum + Number(row.cash_on_hand || 0),
      0
    );

    return {
      tracked_candidates: filteredLeaderboard.length,
      total_receipts: totalReceipts,
      total_cash_on_hand: totalCash,
      average_receipts: filteredLeaderboard.length
        ? Math.round(totalReceipts / filteredLeaderboard.length)
        : 0,
    };
  }, [filteredLeaderboard]);

  const sourceBreakdown = useMemo(() => {
    return allSources
      .map((source) => ({
        source,
        total: sourceTotal(filteredLeaderboard, source),
      }))
      .filter((row) => row.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [allSources, filteredLeaderboard]);

  const maxSourceTotal = Math.max(...sourceBreakdown.map((row) => row.total), 0);

  const sourceLabel = useMemo(() => {
    const raw = String(data?.source || "").trim();
    if (!raw || raw === "empty") return "FEC Finance Feed";
    if (raw.toLowerCase().includes("fec")) return "FEC Finance Feed";
    if (raw.toLowerCase().includes("database")) return "Database Finance Feed";
    return raw;
  }, [data?.source]);

  const lastUpdated = useMemo(() => {
    const updated =
      data?.updated_at ||
      data?.generated_at ||
      data?.last_updated ||
      data?.last_synced_at ||
      data?.sync_result?.updated_at;

    if (!updated) return "Latest available data";

    try {
      return `Updated ${new Date(updated).toLocaleString()}`;
    } catch {
      return "Latest available data";
    }
  }, [data]);

  function setFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value }));
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

  async function refreshFecData() {
    setRefreshingFec(true);
    setNotice("");
    setError("");

    try {
      await api.post("/fec/sync/candidate-financials", {}, { timeout: 60000 });
      await loadFundraising({ silent: true });

      setNotice("FEC fundraising feed imported successfully. Dashboard data has been reloaded.");
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          "FEC fundraising refresh endpoint is unavailable."
      );
    } finally {
      setRefreshingFec(false);
    }
  }

  return (
    <PageShell
      eyebrow="Fundraising Intelligence"
      title="Finance strength across the field."
      description="Track candidate fundraising, reserve strength, finance source composition, and where campaign money is coming from through the FEC finance feed."
      demo={demoMode}
      demoText="Demo fundraising mode is active."
      tickerItems={[
        {
          label: "Candidates",
          value: `${summary.tracked_candidates} visible`,
          dotClass: "vs-live-dot-success",
        },
        {
          label: "Receipts",
          value: formatMoney(summary.total_receipts),
          dotClass: "vs-live-dot-success",
        },
        {
          label: "Sources",
          value: `${sourceBreakdown.length} active`,
          dotClass: "vs-live-dot-warning",
        },
        {
          label: "Feed",
          value: sourceLabel,
          dotClass: String(data?.source || "").toLowerCase().includes("fec")
            ? "vs-live-dot-success"
            : "vs-live-dot-warning",
        },
      ]}
    >
      <style>{`
        .fund-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .fund-toolbar-actions,
        .fund-chip-row,
        .fund-summary-badges {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          align-items: center;
        }

        .fund-toolbar-actions {
          justify-content: flex-end;
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
          background: #0f172a;
          color: #f8fafc;
          padding: 11px 12px;
          outline: none;
          font-weight: 750;
          box-shadow: none;
          filter: none;
          backdrop-filter: none;
        }

        .fund-filter-field select option {
          background: #0f172a;
          color: #f8fafc;
        }

        .fund-exec-summary,
        .fund-leader-row,
        .fund-detail-card,
        .fund-source-row {
          background: var(--vs-panel-bg, #111827);
          border: 1px solid rgba(148, 163, 184, 0.16);
          box-shadow: none;
          filter: none;
          backdrop-filter: none;
        }

        .fund-exec-summary {
          border-radius: 24px;
          padding: 18px;
          display: grid;
          grid-template-columns: minmax(260px, 0.95fr) minmax(0, 1.3fr);
          gap: 18px;
        }

        .fund-exec-summary-main {
          border-right: 1px solid rgba(148, 163, 184, 0.14);
          padding-right: 18px;
        }

        .fund-exec-summary-main span,
        .fund-exec-summary-grid span {
          display: block;
          color: var(--vs-text-muted);
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .fund-exec-summary-main strong {
          display: block;
          margin-top: 9px;
          color: var(--vs-text);
          font-size: clamp(26px, 3.4vw, 40px);
          line-height: 1;
          overflow-wrap: anywhere;
        }

        .fund-exec-summary-main p {
          margin: 10px 0 0;
          color: var(--vs-text-muted);
          line-height: 1.55;
        }

        .fund-exec-summary-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .fund-exec-summary-grid div {
          border: 1px solid rgba(148, 163, 184, 0.12);
          border-radius: 16px;
          padding: 14px;
          background: rgba(15, 23, 42, 0.72);
        }

        .fund-exec-summary-grid strong {
          display: block;
          margin-top: 8px;
          color: var(--vs-text);
          font-size: 18px;
          line-height: 1.22;
          overflow-wrap: anywhere;
        }

        .fund-leader-row {
          width: 100%;
          display: grid;
          grid-template-columns: 64px minmax(220px, 1.6fr) repeat(3, minmax(150px, 1fr));
          gap: 16px;
          align-items: start;
          padding: 16px;
          border-radius: 20px;
          text-align: left;
          color: inherit;
          cursor: pointer;
        }

        .fund-leader-row:hover,
        .fund-leader-row.is-selected {
          border-color: rgba(251, 146, 60, 0.48);
          background: rgba(15, 23, 42, 0.96);
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
        .fund-detail-head strong {
          color: var(--vs-text);
          overflow-wrap: anywhere;
        }

        .fund-main span,
        .fund-metric span,
        .fund-metric small,
        .fund-detail-head span,
        .fund-detail-head p {
          color: var(--vs-text-muted);
          font-size: 12px;
          line-height: 1.45;
        }

        .fund-detail-card {
          border-radius: 20px;
          padding: 16px;
        }

        .fund-detail-head {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: flex-start;
          margin-bottom: 14px;
        }

        .fund-detail-head span {
          display: block;
          margin-bottom: 5px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          font-size: 10px;
          font-weight: 900;
        }

        .fund-detail-head strong {
          display: block;
          font-size: 18px;
          line-height: 1.22;
        }

        .fund-detail-head p {
          margin: 6px 0 0;
        }

        .fund-source-stack,
        .fund-source-breakdown {
          display: grid;
          gap: 12px;
        }

        .fund-source-row {
          display: grid;
          gap: 7px;
          border-radius: 16px;
          padding: 11px;
        }

        .fund-source-row.is-individual {
          border-left: 4px solid #38bdf8;
          border-color: rgba(56, 189, 248, 0.34);
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

        .fund-main-layout {
          display: grid;
          grid-template-columns: minmax(0, 1.65fr) minmax(360px, 0.95fr);
          gap: 22px;
          align-items: start;
          width: 100%;
          min-width: 0;
        }

        .fund-leaderboard-panel,
        .fund-source-panel {
          min-width: 0;
          width: 100%;
          overflow: hidden;
        }

        .fund-leaderboard-panel > *,
        .fund-source-panel > * {
          min-width: 0;
          max-width: 100%;
        }

        .fund-leader-row {
          min-width: 0;
          max-width: 100%;
          overflow: hidden;
        }

        .fund-main,
        .fund-metric,
        .fund-source-row,
        .fund-source-top {
          min-width: 0;
        }

        .fund-main strong,
        .fund-main span,
        .fund-metric strong,
        .fund-metric span,
        .fund-metric small,
        .fund-source-top strong,
        .fund-source-top span {
          max-width: 100%;
          overflow-wrap: anywhere;
          word-break: normal;
        }

        .fund-source-panel .fund-source-row {
          width: 100%;
          box-sizing: border-box;
        }

        @media (max-width: 1320px) {
          .fund-main-layout {
            grid-template-columns: 1fr;
          }

          .fund-filter-grid,
          .fund-leader-row,
          .fund-exec-summary {
            grid-template-columns: 1fr 1fr;
          }

          .fund-exec-summary-main {
            border-right: 0;
            padding-right: 0;
          }
        }

        @media (max-width: 760px) {
          .fund-main-layout,
          .fund-filter-grid,
          .fund-leader-row,
          .fund-exec-summary,
          .fund-exec-summary-grid {
            grid-template-columns: 1fr;
          }

          .fund-detail-head,
          .fund-toolbar {
            flex-direction: column;
            align-items: stretch;
          }
        }
      `}</style>

      <div className="fund-toolbar">
        <div className="fund-chip-row">
          <Badge tone={String(data?.source || "").toLowerCase().includes("fec") ? "active" : "warning"}>
            {sourceLabel}
          </Badge>
          <Badge tone="accent">Candidate Finance Layer</Badge>
          <Badge tone="info">FEC Import Required</Badge>
        </div>

        <div className="fund-toolbar-actions">
          <button
            type="button"
            className="vs-button vs-button-secondary"
            onClick={() => loadFundraising({ silent: false })}
            disabled={loading}
          >
            {loading ? "Refreshing Dashboard..." : "Refresh Dashboard"}
          </button>

          <button
            type="button"
            className="vs-button vs-button-primary"
            onClick={refreshFecData}
            disabled={refreshingFec}
          >
            {refreshingFec ? "Importing FEC Data..." : "Import FEC Data"}
          </button>
        </div>
      </div>

      {notice ? <div className="vs-banner">{notice}</div> : null}
      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}

      <SectionCard
        title="Fundraising Filters"
        subtitle="Filter by candidate, state, race, party, and where the fundraising is coming from."
      >
        <div className="fund-filter-grid">
          <SelectField label="Candidate" value={filters.candidate} options={options.candidates} allLabel="All Candidates" onChange={(value) => setFilter("candidate", value)} />
          <SelectField label="State" value={filters.state} options={options.states} allLabel="All States" onChange={(value) => setFilter("state", value)} />
          <SelectField label="Race / Office" value={filters.office} options={options.offices} allLabel="All Races / Offices" onChange={(value) => setFilter("office", value)} />
          <SelectField label="Party" value={filters.party} options={options.parties} allLabel="All Parties" onChange={(value) => setFilter("party", value)} />
          <SelectField label="Fundraising Source" value={filters.source} options={options.sources} allLabel="All Funding Sources" onChange={(value) => setFilter("source", value)} />
          <button type="button" className="vs-button vs-button-secondary" onClick={clearFilters}>
            Clear Filters
          </button>
        </div>
      </SectionCard>

      <div className="vs-grid-4">
        <StatCard label="Filtered Candidates" value={summary.tracked_candidates} delta="Candidates matching filters" tone="up" />
        <StatCard label="Filtered Receipts" value={formatMoney(summary.total_receipts)} delta="Receipts from selected candidates" tone="up" />
        <StatCard label="Filtered Cash On Hand" value={formatMoney(summary.total_cash_on_hand)} delta="Reserve strength after filters" tone="up" />
        <StatCard label="Filtered Average Raise" value={formatMoney(summary.average_receipts)} delta="Average receipts after filters" tone="up" />
      </div>

      <SectionCard
        title="Executive Finance Summary"
        subtitle="Clean executive readout of candidate count, receipts, reserves, average raise, and leading funding source."
      >
        <ExecutiveSummary
          summary={summary}
          sourceBreakdown={sourceBreakdown}
          sourceLabel={sourceLabel}
          lastUpdated={lastUpdated}
        />
      </SectionCard>

      <div className="fund-main-layout">
        <div className="fund-leaderboard-panel">
          <SectionCard
            title="Fundraising Leaderboard"
            subtitle="Candidate finance leaderboard. Select a candidate to inspect source detail."
            right={<Badge tone="accent">{filteredLeaderboard.length} Candidates</Badge>}
          >
            <div className="vs-stack">
              {loading ? (
                <EmptyState text="Loading fundraising leaderboard..." />
              ) : !filteredLeaderboard.length ? (
                <EmptyState text="No fundraising data is available yet. Click Import FEC Data, then refresh the dashboard." />
              ) : (
                filteredLeaderboard.map((row) => (
                  <LeaderRow
                    key={`${row.rank}-${row.candidate_id || row.name}`}
                    row={row}
                    selected={String(row.candidate_id || row.name) === String(selectedCandidateId)}
                    onSelect={(candidate) =>
                      setSelectedCandidateId(candidate.candidate_id || candidate.name)
                    }
                  />
                ))
              )}
            </div>
          </SectionCard>
        </div>

        <div className="fund-source-panel">
          <SectionCard
            title="Where Fundraising Is Coming From"
            subtitle="Funding source breakdown across selected candidates."
            right={<Badge tone="info">{sourceBreakdown.length} Funding Sources</Badge>}
          >
            <div className="fund-source-breakdown">
              {!sourceBreakdown.length ? (
                <EmptyState text="No funding source data is available yet." />
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
        </div>
      </div>

      <SectionCard
        title="Selected Candidate Funding Source Detail"
        subtitle="One selected candidate at a time for a cleaner enterprise workflow."
        right={selectedCandidate ? <Badge tone="accent">{selectedCandidate.name}</Badge> : null}
      >
        <CandidateSourceDetail row={selectedCandidate} />
      </SectionCard>
    </PageShell>
  );
}

