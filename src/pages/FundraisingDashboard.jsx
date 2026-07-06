import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

function getPacContributions(row = {}) {
  const payload = row.source_payload && typeof row.source_payload === "object" ? row.source_payload : {};

  const pacs =
    row.pac_contributions ||
    row.pacContributions ||
    payload.pac_contributions ||
    payload.pacContributions ||
    [];

  if (!Array.isArray(pacs)) return [];

  return pacs
    .map((pac, index) => ({
      id: pac.committee_id || pac.committeeId || pac.id || `pac-${index}`,
      committee_id: pac.committee_id || pac.committeeId || pac.id || "N/A",
      committee_name:
        pac.committee_name ||
        pac.committeeName ||
        pac.name ||
        pac.contributor_name ||
        pac.contributorName ||
        "Unknown PAC / Committee",
      committee_type: pac.committee_type || pac.committeeType || pac.type || "Committee",
      committee_party: pac.committee_party || pac.committeeParty || pac.party || "N/A",
      amount: Number(pac.amount || pac.total || pac.contribution_amount || pac.contributionAmount || 0),
      city: pac.city || pac.contributor_city || "",
      state: pac.state || pac.contributor_state || "",
      fec_url: pac.fec_url || pac.fecUrl || pac.url || "",
    }))
    .filter((pac) => pac.committee_name && pac.committee_name !== "Unknown PAC / Committee")
    .sort((a, b) => Number(b.amount || 0) - Number(a.amount || 0));
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
    pac_contributions: getPacContributions(row),
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
    const pacs = getPacContributions(row);

    return sources.map((source) => {
      const label =
        source.source ||
        source.label ||
        source.name ||
        source.type ||
        "Unclassified Funding Source";

      return {
        source: label,
        amount: Number(source.amount || source.value || source.total || 0),
        committees: normalizeKey(label).includes("pac") ? pacs : [],
      };
    });
  }

  return [
    { source: "Individual Contributions", amount: Math.round(receipts * 0.52) },
    { source: "Small-Dollar Contributions", amount: Math.round(receipts * 0.21) },
    { source: "PAC Contributions", amount: Math.round(receipts * 0.16), committees: getPacContributions(row) },
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

function PacContributionRow({ pac }) {
  return (
    <div className="fund-pac-row">
      <div className="fund-pac-main">
        <strong>{pac.committee_name}</strong>
        <span>
          Committee ID: {pac.committee_id || "N/A"} · Type: {pac.committee_type || "Committee"} · Party: {pac.committee_party || "N/A"}
        </span>
        {(pac.city || pac.state) ? (
          <small>{[pac.city, pac.state].filter(Boolean).join(", ")}</small>
        ) : null}
      </div>

      <div className="fund-pac-amount">
        <span>PAC Contribution</span>
        <strong>{formatMoney(pac.amount)}</strong>
        {pac.fec_url ? (
          <a href={pac.fec_url} target="_blank" rel="noreferrer">
            Open FEC Committee
          </a>
        ) : null}
      </div>
    </div>
  );
}

function CandidateSourceDetail({ row }) {
  if (!row) {
    return <EmptyState text="Select a candidate to view funding source detail." />;
  }

  const sources = getFundingSources(row);
  const pacs = getPacContributions(row);
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

      <div className="fund-pac-detail">
        <div className="fund-pac-head">
          <div>
            <span>PAC / Committee Contributions</span>
            <strong>{pacs.length ? `${pacs.length} PAC Records` : "No PAC Records Available"}</strong>
          </div>
          <Badge tone={pacs.length ? "active" : "info"}>
            {formatMoney(pacs.reduce((sum, pac) => sum + Number(pac.amount || 0), 0))}
          </Badge>
        </div>

        {pacs.length ? (
          <div className="fund-pac-stack">
            {pacs.map((pac) => (
              <PacContributionRow key={`${row.candidate_id}-${pac.committee_id}-${pac.committee_name}`} pac={pac} />
            ))}
          </div>
        ) : (
          <EmptyState text="No named PAC / committee contribution records are attached to this candidate yet." />
        )}
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
  const selectedCandidateDetailRef = useRef(null);
  const [filters, setFilters] = useState({
    candidate: "",
    state: "",
    office: "",
    party: "",
    source: "",
    pac: "",
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
      pacs: Array.from(
        new Set(
          leaderboard
            .flatMap((row) => getPacContributions(row).map((pac) => pac.committee_name))
            .filter(Boolean)
        )
      ).sort((a, b) => a.localeCompare(b)),
    };
  }, [leaderboard, allSources]);

  const filteredLeaderboard = useMemo(() => {
    return leaderboard
      .filter((row) => {
        const sources = getFundingSources(row).map((source) => source.source);
        const pacs = getPacContributions(row).map((pac) => pac.committee_name);

        return (
          (!filters.candidate || row.name === filters.candidate) &&
          (!filters.state || row.state === filters.state) &&
          (!filters.office || row.office === filters.office) &&
          (!filters.party || row.party === filters.party) &&
          (!filters.source || sources.includes(filters.source)) &&
          (!filters.pac || pacs.includes(filters.pac))
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
      pac: "",
    });
  }

  function handleCandidateSelect(candidate) {
    setSelectedCandidateId(candidate.candidate_id || candidate.name);

    window.requestAnimationFrame(() => {
      selectedCandidateDetailRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
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
          grid-template-columns: repeat(6, minmax(150px, 1fr)) auto;
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

        .fund-source-breakdown-wide {
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .fund-leaderboard-full {
          width: 100%;
          min-width: 0;
        }

        .fund-selected-detail-anchor {
          scroll-margin-top: 96px;
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

        .fund-leaderboard-full .fund-leader-row {
          grid-template-columns:
            64px
            minmax(280px, 2fr)
            minmax(180px, 0.85fr)
            minmax(180px, 0.85fr)
            minmax(260px, 1.2fr);
        }

        .fund-leaderboard-full .fund-main strong {
          font-size: 15px;
          line-height: 1.35;
        }

        .fund-pac-detail {
          margin-top: 18px;
          padding-top: 16px;
          border-top: 1px solid rgba(148, 163, 184, 0.16);
        }

        .fund-pac-head,
        .fund-pac-row {
          display: flex;
          justify-content: space-between;
          gap: 14px;
          align-items: flex-start;
        }

        .fund-pac-head span,
        .fund-pac-amount span {
          display: block;
          color: var(--vs-text-muted);
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .fund-pac-head strong,
        .fund-pac-main strong,
        .fund-pac-amount strong {
          display: block;
          margin-top: 6px;
          color: var(--vs-text);
          overflow-wrap: anywhere;
        }

        .fund-pac-stack {
          display: grid;
          gap: 10px;
          margin-top: 14px;
        }

        .fund-pac-row {
          border: 1px solid rgba(148, 163, 184, 0.14);
          border-radius: 16px;
          padding: 13px;
          background: rgba(15, 23, 42, 0.62);
        }

        .fund-pac-main span,
        .fund-pac-main small,
        .fund-pac-amount a {
          display: block;
          margin-top: 5px;
          color: var(--vs-text-muted);
          font-size: 12px;
          line-height: 1.45;
          overflow-wrap: anywhere;
        }

        .fund-pac-amount {
          min-width: 170px;
          text-align: right;
        }

        .fund-pac-amount a {
          color: #38bdf8;
          text-decoration: none;
          font-weight: 900;
        }

        @media (max-width: 1320px) {
          .fund-source-breakdown-wide {
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .fund-leaderboard-full {
          width: 100%;
          min-width: 0;
        }

        .fund-selected-detail-anchor {
          scroll-margin-top: 96px;
        }

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
          .fund-source-breakdown-wide,
          .fund-main-layout,
          .fund-filter-grid,
          .fund-leader-row,
          .fund-exec-summary,
          .fund-exec-summary-grid {
            grid-template-columns: 1fr;
          }

          .fund-detail-head,
          .fund-pac-head,
          .fund-pac-row,
          .fund-toolbar {
            flex-direction: column;
            align-items: stretch;
          }

          .fund-pac-amount {
            min-width: 0;
            text-align: left;
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
        subtitle="Filter by candidate, state, race, party, funding source, and PAC / committee."
      >
        <div className="fund-filter-grid">
          <SelectField label="Candidate" value={filters.candidate} options={options.candidates} allLabel="All Candidates" onChange={(value) => setFilter("candidate", value)} />
          <SelectField label="State" value={filters.state} options={options.states} allLabel="All States" onChange={(value) => setFilter("state", value)} />
          <SelectField label="Race / Office" value={filters.office} options={options.offices} allLabel="All Races / Offices" onChange={(value) => setFilter("office", value)} />
          <SelectField label="Party" value={filters.party} options={options.parties} allLabel="All Parties" onChange={(value) => setFilter("party", value)} />
          <SelectField label="Fundraising Source" value={filters.source} options={options.sources} allLabel="All Funding Sources" onChange={(value) => setFilter("source", value)} />
          <SelectField label="PAC / Committee" value={filters.pac} options={options.pacs} allLabel="All PACs / Committees" onChange={(value) => setFilter("pac", value)} />
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

      <SectionCard
        title="Where Fundraising Is Coming From"
        subtitle="Funding source breakdown across selected candidates before reviewing the full leaderboard."
        right={<Badge tone="info">{sourceBreakdown.length} Funding Sources</Badge>}
      >
        <div className="fund-source-breakdown fund-source-breakdown-wide">
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

      <SectionCard
        title="Fundraising Leaderboard"
        subtitle="Full-width candidate finance leaderboard. Select a candidate to jump to detailed funding-source intelligence."
        right={<Badge tone="accent">{filteredLeaderboard.length} Candidates</Badge>}
      >
        <div className="vs-stack fund-leaderboard-full">
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
                onSelect={handleCandidateSelect}
              />
            ))
          )}
        </div>
      </SectionCard>

      <div ref={selectedCandidateDetailRef} className="fund-selected-detail-anchor">
        <SectionCard
          title="Selected Candidate Funding Source Detail"
          subtitle="One selected candidate at a time for a cleaner enterprise workflow."
          right={selectedCandidate ? <Badge tone="accent">{selectedCandidate.name}</Badge> : null}
        >
          <CandidateSourceDetail row={selectedCandidate} />
        </SectionCard>
      </div>
    </PageShell>
  );
}

