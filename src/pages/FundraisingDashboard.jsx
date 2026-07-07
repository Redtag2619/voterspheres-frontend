import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import EmptyState from "../components/ui/EmptyState";
import Badge from "../components/ui/Badge";
import ExecutivePageNav from "../components/ui/ExecutivePageNav";
import CollapsibleSection from "../components/ui/CollapsibleSection";
import BackToTopButton from "../components/ui/BackToTopButton";
import ShowMoreList from "../components/ui/ShowMoreList";

const fallbackData = {
  ok: false,
  source: "empty",
  leaderboard: [],
  summary: {
    tracked_candidates: 0,
    total_receipts: 0,
    total_cash_on_hand: 0,
    average_receipts: 0,
    pac_committees: 0,
  },
};

function arr(value) {
  return Array.isArray(value) ? value : [];
}

function number(value) {
  const next = Number(value || 0);
  return Number.isFinite(next) ? next : 0;
}

function formatMoney(value) {
  return `$${number(value).toLocaleString(undefined, {
    maximumFractionDigits: 0,
  })}`;
}

function pct(value) {
  return `${Math.round(number(value))}%`;
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

  const pacs = arr(row.pac_contributions);

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
    receipts: number(
      row.receipts ||
        row.total_receipts ||
        row.ttl_receipts ||
        row.raised_total ||
        row.total_raised
    ),
    cash_on_hand: number(
      row.cash_on_hand ||
        row.cash_on_hand_total ||
        row.cash_on_hand_end_period ||
        row.cash_on_hand_end
    ),
    pac_contributions: pacs,
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

  const pacCommitteeNames = new Set(
    leaderboard.flatMap((row) => arr(row.pac_contributions).map((pac) => pac.committee_name || pac.name).filter(Boolean))
  );

  return {
    ...fallbackData,
    ...(payload || {}),
    leaderboard,
    summary: {
      tracked_candidates: leaderboard.length,
      total_receipts: totalReceipts,
      total_cash_on_hand: totalCash,
      average_receipts: leaderboard.length ? Math.round(totalReceipts / leaderboard.length) : 0,
      pac_committees: pacCommitteeNames.size,
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
      committees: arr(source.committees),
    }));
  }

  const pacTotal = arr(row?.pac_contributions).reduce((sum, pac) => sum + number(pac.amount), 0);

  return [
    { source: "Individual Contributions", amount: Math.round(receipts * 0.52) },
    { source: "Small-Dollar Contributions", amount: Math.round(receipts * 0.21) },
    { source: "PAC Contributions", amount: pacTotal || Math.round(receipts * 0.16), committees: arr(row?.pac_contributions) },
    { source: "Candidate Committee Transfers", amount: Math.round(receipts * 0.07) },
    { source: "Other Receipts", amount: Math.round(receipts * 0.04) },
  ];
}

function getPacs(row = {}) {
  const direct = arr(row.pac_contributions);
  if (direct.length) return direct;

  return getFundingSources(row)
    .flatMap((source) => arr(source.committees))
    .filter(Boolean);
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

function aggregatePacs(rows = []) {
  const map = new Map();

  for (const candidate of rows) {
    for (const pac of getPacs(candidate)) {
      const name = pac.committee_name || pac.name || pac.contributor_name || "Unknown PAC / Committee";
      const id = pac.committee_id || pac.id || name;
      const key = id || name;

      if (!map.has(key)) {
        map.set(key, {
          committee_id: id,
          committee_name: name,
          committee_type: pac.committee_type || pac.type || "Committee",
          committee_party: pac.committee_party || pac.party || "N/A",
          total_amount: 0,
          candidate_count: 0,
          states: new Set(),
          candidates: [],
        });
      }

      const item = map.get(key);
      item.total_amount += number(pac.amount);
      item.candidate_count += 1;
      item.states.add(candidate.state || "N/A");
      item.candidates.push({
        candidate_id: candidate.candidate_id,
        name: candidate.name,
        state: candidate.state,
        office: candidate.office,
        party: candidate.party,
        amount: number(pac.amount),
      });
    }
  }

  return Array.from(map.values())
    .map((item) => ({
      ...item,
      states: Array.from(item.states).sort(),
      state_count: item.states.size,
      candidates: item.candidates.sort((a, b) => b.amount - a.amount),
    }))
    .sort((a, b) => b.total_amount - a.total_amount);
}

function aggregateBy(rows, key) {
  const map = new Map();

  for (const row of rows) {
    const value = row[key] || "N/A";
    if (!map.has(value)) {
      map.set(value, {
        name: value,
        [key]: value,
        total_receipts: 0,
        total_cash_on_hand: 0,
        candidate_count: 0,
      });
    }

    const item = map.get(value);
    item.total_receipts += number(row.receipts);
    item.total_cash_on_hand += number(row.cash_on_hand);
    item.candidate_count += 1;
  }

  return Array.from(map.values()).sort((a, b) => b.total_receipts - a.total_receipts);
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

function JumpButton({ target, children }) {
  return (
    <button
      type="button"
      className="fund-jump-button"
      onClick={() => document.getElementById(target)?.scrollIntoView({ behavior: "smooth", block: "start" })}
    >
      {children}
    </button>
  );
}

function SectionShell({ id, title, subtitle, open, onToggle, right, children }) {
  return (
    <div id={id} className="fund-section-shell">
      <div className="fund-section-head">
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
        <div className="fund-section-actions">
          {right}
          <button type="button" className="vs-button vs-button-secondary" onClick={onToggle}>
            {open ? "Collapse Section" : "Open Section"}
          </button>
        </div>
      </div>
      {open ? <div className="fund-section-body">{children}</div> : null}
    </div>
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
  const pacs = getPacs(row);
  const pacTotal = pacs.reduce((sum, pac) => sum + number(pac.amount), 0);
  const pacDependency = row.receipts > 0 ? Math.round((pacTotal / row.receipts) * 100) : 0;

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
        <span>Leading Source</span>
        <strong>{topSource?.source || "Unclassified Funding Source"}</strong>
        <small>{formatMoney(topSource?.amount || 0)}</small>
      </div>

      <div className="fund-metric">
        <span>PAC Dependency</span>
        <strong>{pct(pacDependency)}</strong>
        <small>{pacs.length} PAC / Committee Records</small>
      </div>
    </button>
  );
}

function PacRow({ pac, index, max }) {
  return (
    <div className="fund-pac-row">
      <div className="fund-rank">#{index + 1}</div>
      <div className="fund-main">
        <strong>{pac.committee_name || "Unknown PAC / Committee"}</strong>
        <span>{pac.committee_id || "N/A"} · {pac.committee_type || "Committee"} · {pac.committee_party || "N/A"}</span>
        <div className="fund-source-bar">
          <i style={{ width: `${max ? Math.max(4, Math.round((number(pac.total_amount) / max) * 100)) : 0}%` }} />
        </div>
      </div>
      <div className="fund-metric">
        <span>Total Contributions</span>
        <strong>{formatMoney(pac.total_amount)}</strong>
      </div>
      <div className="fund-metric">
        <span>Candidates Supported</span>
        <strong>{pac.candidate_count}</strong>
      </div>
      <div className="fund-metric">
        <span>States</span>
        <strong>{pac.state_count}</strong>
      </div>
    </div>
  );
}

function EntityRow({ row, index, label, max }) {
  const amount = number(row.total_receipts);
  const width = max > 0 ? Math.max(4, Math.round((amount / max) * 100)) : 0;

  return (
    <div className="fund-entity-row">
      <div>
        <span>{label} #{index + 1}</span>
        <strong>{row.name || row.state || row.party || row.office || "N/A"}</strong>
      </div>
      <div>
        <span>Total Receipts</span>
        <strong>{formatMoney(amount)}</strong>
      </div>
      <div>
        <span>Candidates</span>
        <strong>{row.candidate_count}</strong>
      </div>
      <div className="fund-source-bar">
        <i style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function ExecutiveSummary({ summary, sourceBreakdown, sourceLabel, lastUpdated, pacCount }) {
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
        <div>
          <span>Named PAC Committees</span>
          <strong>{pacCount}</strong>
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
  const pacs = getPacs(row);
  const maxPac = Math.max(...pacs.map((pac) => number(pac.amount)), 0);

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
        <div className="fund-detail-badges">
          <Badge tone="accent">{formatMoney(row.receipts)}</Badge>
          <Badge tone="info">{pacs.length} PACs</Badge>
        </div>
      </div>

      <div className="fund-detail-grid">
        <div className="fund-detail-section">
          <div className="fund-detail-title">Funding Source Mix</div>
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

        <div className="fund-detail-section">
          <div className="fund-detail-title">Named PAC / Committee Records</div>
          <div className="fund-source-stack">
            {pacs.length ? (
              pacs.slice(0, 12).map((pac) => (
                <div key={`${pac.committee_id}-${pac.committee_name}`} className="fund-source-row">
                  <div className="fund-source-top">
                    <strong>{pac.committee_name || "Unknown PAC / Committee"}</strong>
                    <span>{formatMoney(pac.amount)}</span>
                  </div>
                  <div className="fund-source-meta">
                    {pac.committee_id || "N/A"} · {pac.committee_type || "Committee"} · {pac.state || "National"}
                  </div>
                  <div className="fund-source-bar">
                    <i style={{ width: `${maxPac ? Math.max(4, Math.round((number(pac.amount) / maxPac) * 100)) : 0}%` }} />
                  </div>
                </div>
              ))
            ) : (
              <EmptyState text="No named PAC records are available for this candidate yet." />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FinanceExecutiveHeader({
  summary,
  sourceBreakdown,
  filteredPacs,
  stateRows,
  sourceLabel,
  lastUpdated,
  loading,
  refreshingFec,
  onRefresh,
  onImport,
}) {
  const pacTotal = filteredPacs.reduce((sum, pac) => sum + number(pac.total_amount), 0);
  const pacDependency = summary.total_receipts > 0 ? Math.round((pacTotal / summary.total_receipts) * 100) : 0;
  const topSource = sourceBreakdown[0]?.source || "No Source Available";
  const readinessScore = Math.max(
    0,
    Math.min(
      100,
      72 +
        Math.min(18, summary.tracked_candidates) +
        Math.min(10, stateRows.length) -
        Math.min(25, pacDependency)
    )
  );

  return (
    <div className="fund-exec-ribbon" id="fund-overview">
      <div className="fund-exec-ribbon-copy">
        <span>Executive Finance Readiness</span>
        <strong>{readinessScore}% Ready</strong>
        <p>
          Live finance command layer for candidate fundraising, PAC influence, funding-source concentration,
          state heat, party distribution, office distribution, and selected candidate finance intelligence.
        </p>

        <div className="fund-exec-ribbon-badges">
          <Badge tone="active">{sourceLabel || "FEC Finance Feed"}</Badge>
          <Badge tone="accent">{lastUpdated || "Latest available data"}</Badge>
          <Badge tone={pacDependency >= 35 ? "warning" : "active"}>{pacDependency}% PAC Dependency</Badge>
          <Badge tone="info">{stateRows.length} States Covered</Badge>
        </div>
      </div>

      <div className="fund-exec-ribbon-grid">
        <div>
          <span>Filtered Candidates</span>
          <strong>{summary.tracked_candidates}</strong>
        </div>
        <div>
          <span>Total Receipts</span>
          <strong>{formatMoney(summary.total_receipts)}</strong>
        </div>
        <div>
          <span>Named PAC Committees</span>
          <strong>{filteredPacs.length}</strong>
        </div>
        <div>
          <span>Top Funding Source</span>
          <strong>{topSource}</strong>
        </div>
      </div>

      <div className="fund-exec-ribbon-actions">
        <button type="button" onClick={onRefresh} disabled={loading}>
          {loading ? "Refreshing Dashboard..." : "Refresh Dashboard"}
        </button>
        <button type="button" onClick={onImport} disabled={refreshingFec}>
          {refreshingFec ? "Importing FEC Data..." : "Import FEC Data"}
        </button>
        <Link to="/campaign-finance-intelligence">Open Campaign Finance Intelligence</Link>
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

  const allPacs = useMemo(() => aggregatePacs(leaderboard), [leaderboard]);

  const options = useMemo(() => {
    return {
      candidates: uniqueOptions(leaderboard, "name"),
      states: uniqueOptions(leaderboard, "state"),
      offices: uniqueOptions(leaderboard, "office"),
      parties: uniqueOptions(leaderboard, "party"),
      sources: allSources,
      pacs: allPacs.map((pac) => pac.committee_name).filter(Boolean).sort(),
    };
  }, [leaderboard, allSources, allPacs]);

  const filteredLeaderboard = useMemo(() => {
    return leaderboard
      .filter((row) => {
        const sources = getFundingSources(row).map((source) => source.source);
        const pacNames = getPacs(row).map((pac) => pac.committee_name || pac.name);

        return (
          (!filters.candidate || row.name === filters.candidate) &&
          (!filters.state || row.state === filters.state) &&
          (!filters.office || row.office === filters.office) &&
          (!filters.party || row.party === filters.party) &&
          (!filters.source || sources.includes(filters.source)) &&
          (!filters.pac || pacNames.includes(filters.pac))
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

  const filteredPacs = useMemo(() => aggregatePacs(filteredLeaderboard), [filteredLeaderboard]);
  const stateRows = useMemo(() => aggregateBy(filteredLeaderboard, "state"), [filteredLeaderboard]);
  const partyRows = useMemo(() => aggregateBy(filteredLeaderboard, "party"), [filteredLeaderboard]);
  const officeRows = useMemo(() => aggregateBy(filteredLeaderboard, "office"), [filteredLeaderboard]);

  const maxSourceTotal = Math.max(...sourceBreakdown.map((row) => row.total), 0);
  const maxPacTotal = Math.max(...filteredPacs.map((row) => row.total_amount), 0);
  const maxStateTotal = Math.max(...stateRows.map((row) => row.total_receipts), 0);

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

  const navSections = [
    { id: "fund-overview", label: "Overview" },
    { id: "fund-filters", label: "Filters" },
    { id: "fund-summary", label: "Summary" },
    { id: "fund-sources", label: "Sources", badge: sourceBreakdown.length },
    { id: "fund-leaderboard", label: "Leaderboard", badge: filteredLeaderboard.length },
    { id: "fund-selected", label: "Selected Candidate" },
    { id: "fund-pacs", label: "PACs", badge: filteredPacs.length },
    { id: "fund-heat", label: "Finance Heat", badge: stateRows.length },
  ];

  return (
    <PageShell
      eyebrow="Fundraising Intelligence"
      title="Finance strength across the field."
      description="Track candidate fundraising, reserve strength, finance source composition, PAC support, and where campaign money is coming from through the FEC finance feed."
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
          label: "PACs",
          value: `${filteredPacs.length} named`,
          dotClass: "vs-live-dot-warning",
        },
      ]}
    >
      <style>{`

        .fund-exec-ribbon {
          display: grid;
          grid-template-columns: minmax(300px, 0.95fr) minmax(0, 1.15fr);
          gap: 18px;
          align-items: stretch;
          border: 1px solid rgba(148, 163, 184, 0.16);
          border-radius: 28px;
          background:
            radial-gradient(circle at top right, rgba(251, 146, 60, 0.16), transparent 34%),
            radial-gradient(circle at bottom left, rgba(59, 130, 246, 0.14), transparent 30%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.94), rgba(2, 6, 23, 0.86));
          box-shadow: 0 28px 80px rgba(2, 6, 23, 0.32);
          padding: 20px;
          min-width: 0;
          overflow: hidden;
        }

        .fund-exec-ribbon-copy {
          min-width: 0;
        }

        .fund-exec-ribbon-copy span,
        .fund-exec-ribbon-grid span {
          display: block;
          color: rgba(147, 197, 253, 0.86);
          font-size: 11px;
          font-weight: 950;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .fund-exec-ribbon-copy strong {
          display: block;
          margin-top: 8px;
          color: white;
          font-size: clamp(30px, 4vw, 50px);
          line-height: 1;
          font-weight: 950;
          letter-spacing: -0.07em;
        }

        .fund-exec-ribbon-copy p {
          margin: 12px 0 0;
          color: rgba(226, 232, 240, 0.78);
          line-height: 1.6;
          max-width: 820px;
        }

        .fund-exec-ribbon-badges,
        .fund-exec-ribbon-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          align-items: center;
        }

        .fund-exec-ribbon-badges {
          margin-top: 14px;
        }

        .fund-exec-ribbon-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          min-width: 0;
        }

        .fund-exec-ribbon-grid div {
          border: 1px solid rgba(148, 163, 184, 0.14);
          border-radius: 18px;
          background: rgba(2, 6, 23, 0.34);
          padding: 14px;
          min-width: 0;
        }

        .fund-exec-ribbon-grid strong {
          display: block;
          margin-top: 7px;
          color: white;
          font-size: 20px;
          font-weight: 950;
          overflow-wrap: anywhere;
        }

        .fund-exec-ribbon-actions {
          grid-column: 1 / -1;
          border-top: 1px solid rgba(148, 163, 184, 0.12);
          padding-top: 14px;
        }

        .fund-exec-ribbon-actions button,
        .fund-exec-ribbon-actions a {
          border: 1px solid rgba(148, 163, 184, 0.18);
          background: rgba(15, 23, 42, 0.74);
          color: rgba(226, 232, 240, 0.92);
          border-radius: 15px;
          padding: 11px 12px;
          font-size: 12px;
          font-weight: 850;
          cursor: pointer;
          text-decoration: none;
        }

        .fund-exec-ribbon-actions button:hover,
        .fund-exec-ribbon-actions a:hover {
          border-color: rgba(251, 146, 60, 0.48);
          background: rgba(251, 146, 60, 0.14);
          color: white;
        }

        .fund-exec-ribbon-actions button:disabled {
          opacity: 0.62;
          cursor: not-allowed;
        }

        .fund-exec-stack {
          display: grid;
          gap: 18px;
          min-width: 0;
        }

        .fund-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .fund-toolbar-actions,
        .fund-chip-row,
        .fund-summary-badges,
        .fund-section-actions,
        .fund-detail-badges,
        .fund-jump-nav {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          align-items: center;
        }

        .fund-toolbar-actions {
          justify-content: flex-end;
        }

        .fund-jump-nav {
          position: sticky;
          top: 76px;
          z-index: 12;
          padding: 10px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          border-radius: 18px;
          background: rgba(15, 23, 42, 0.92);
          backdrop-filter: blur(16px);
        }

        .fund-jump-button {
          border: 1px solid rgba(148, 163, 184, 0.18);
          border-radius: 999px;
          background: rgba(15, 23, 42, 0.86);
          color: var(--vs-text);
          cursor: pointer;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.08em;
          padding: 9px 12px;
          text-transform: uppercase;
        }

        .fund-jump-button:hover {
          border-color: rgba(251, 146, 60, 0.5);
          color: #fed7aa;
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

        .fund-section-shell,
        .fund-exec-summary,
        .fund-leader-row,
        .fund-detail-card,
        .fund-source-row,
        .fund-pac-row,
        .fund-entity-row,
        .fund-detail-section {
          background: var(--vs-panel-bg, #111827);
          border: 1px solid rgba(148, 163, 184, 0.16);
          box-shadow: none;
          filter: none;
          backdrop-filter: none;
          min-width: 0;
          max-width: 100%;
          box-sizing: border-box;
          overflow: hidden;
        }

        .fund-section-shell {
          border-radius: 22px;
          padding: 16px;
          scroll-margin-top: 132px;
        }

        .fund-section-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 14px;
          flex-wrap: wrap;
        }

        .fund-section-head h3 {
          margin: 0;
          color: var(--vs-text);
          font-size: 18px;
          line-height: 1.25;
        }

        .fund-section-head p {
          margin: 6px 0 0;
          color: var(--vs-text-muted);
          font-size: 12px;
          line-height: 1.5;
        }

        .fund-section-body {
          margin-top: 16px;
        }

        .fund-exec-summary {
          border-radius: 24px;
          padding: 18px;
          display: grid;
          grid-template-columns: minmax(260px, 0.92fr) minmax(0, 1.3fr);
          gap: 18px;
        }

        .fund-exec-summary-main {
          border-right: 1px solid rgba(148, 163, 184, 0.14);
          padding-right: 18px;
        }

        .fund-exec-summary-main span,
        .fund-exec-summary-grid span,
        .fund-detail-title,
        .fund-metric span,
        .fund-detail-head span,
        .fund-entity-row span {
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
          grid-template-columns:
            64px
            minmax(280px, 1.7fr)
            minmax(150px, 0.75fr)
            minmax(150px, 0.75fr)
            minmax(220px, 1fr)
            minmax(160px, 0.75fr);
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

        .fund-pac-row {
          width: 100%;
          display: grid;
          grid-template-columns:
            56px
            minmax(280px, 1.5fr)
            minmax(150px, 0.8fr)
            minmax(140px, 0.65fr)
            minmax(120px, 0.55fr);
          gap: 16px;
          align-items: start;
          padding: 16px;
          border-radius: 20px;
        }

        .fund-entity-row {
          display: grid;
          grid-template-columns: minmax(220px, 1fr) minmax(160px, 0.7fr) minmax(120px, 0.5fr);
          gap: 14px;
          border-radius: 18px;
          padding: 14px;
        }

        .fund-entity-row .fund-source-bar {
          grid-column: 1 / -1;
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
        .fund-detail-head strong,
        .fund-source-top strong,
        .fund-entity-row strong {
          color: var(--vs-text);
          overflow-wrap: anywhere;
          line-height: 1.25;
        }

        .fund-main span,
        .fund-metric small,
        .fund-detail-head p,
        .fund-source-meta {
          color: var(--vs-text-muted);
          font-size: 12px;
          line-height: 1.45;
        }

        .fund-source-breakdown-wide {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .fund-source-stack,
        .fund-source-breakdown,
        .fund-stack {
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

        .fund-detail-head strong {
          display: block;
          font-size: 18px;
          line-height: 1.22;
        }

        .fund-detail-head p {
          margin: 6px 0 0;
        }

        .fund-detail-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .fund-detail-section {
          border-radius: 18px;
          padding: 14px;
        }

        .fund-detail-title {
          margin-bottom: 12px;
        }

        .fund-show-more {
          justify-self: center;
          margin-top: 10px;
        }

        .fund-selected-detail-anchor {
          scroll-margin-top: 132px;
        }

        .fund-back-top {
          position: fixed;
          right: 24px;
          bottom: 24px;
          z-index: 20;
          box-shadow: 0 18px 36px rgba(0, 0, 0, 0.22);
        }

        @media (max-width: 1320px) {
          .fund-jump-nav {
            position: static;
          }

          .fund-filter-grid,
          .fund-leader-row,
          .fund-pac-row,
          .fund-exec-summary,
          .fund-exec-ribbon,
          .fund-exec-ribbon-grid,
          .fund-source-breakdown-wide,
          .fund-detail-grid {
            grid-template-columns: 1fr;
          }

          .fund-exec-summary-main {
            border-right: 0;
            padding-right: 0;
          }
        }

        @media (max-width: 760px) {
          .fund-exec-summary-grid,
          .fund-entity-row {
            grid-template-columns: 1fr;
          }

          .fund-detail-head,
          .fund-toolbar,
          .fund-section-head {
            flex-direction: column;
            align-items: stretch;
          }

          .fund-back-top {
            right: 14px;
            bottom: 14px;
          }
        }
      `}</style>

      <div className="fund-exec-stack">
        <FinanceExecutiveHeader
          summary={summary}
          sourceBreakdown={sourceBreakdown}
          filteredPacs={filteredPacs}
          stateRows={stateRows}
          sourceLabel={sourceLabel}
          lastUpdated={lastUpdated}
          loading={loading}
          refreshingFec={refreshingFec}
          onRefresh={() => loadFundraising({ silent: false })}
          onImport={refreshFecData}
        />

        <ExecutivePageNav sections={navSections} />
      </div>

      {notice ? <div className="vs-banner">{notice}</div> : null}
      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}

      <div id="fund-filters">
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
      </div>

      <CollapsibleSection
        id="fund-summary-metrics"
        title="Filtered Finance Metrics"
        subtitle="Top-line metrics for the active candidate, state, race, party, funding-source, and PAC filters."
        defaultOpen
        right={<Badge tone="active">{summary.tracked_candidates} Candidates</Badge>}
      >
      <div className="vs-grid-4">
        <StatCard label="Filtered Candidates" value={summary.tracked_candidates} delta="Candidates matching filters" tone="up" />
        <StatCard label="Filtered Receipts" value={formatMoney(summary.total_receipts)} delta="Receipts from selected candidates" tone="up" />
        <StatCard label="Filtered Cash On Hand" value={formatMoney(summary.total_cash_on_hand)} delta="Reserve strength after filters" tone="up" />
        <StatCard label="Named PAC Committees" value={filteredPacs.length} delta="PACs tied to filtered candidates" tone="up" />
      </div>
      </CollapsibleSection>

      <CollapsibleSection
        id="fund-summary"
        title="Executive Finance Summary"
        subtitle="Clean executive readout of candidate count, receipts, reserves, average raise, leading funding source, and named PAC coverage."
        defaultOpen
        right={<Badge tone="active">{summary.tracked_candidates} Candidates</Badge>}
      >
        <ExecutiveSummary
          summary={summary}
          sourceBreakdown={sourceBreakdown}
          sourceLabel={sourceLabel}
          lastUpdated={lastUpdated}
          pacCount={filteredPacs.length}
        />
      </CollapsibleSection>

      <CollapsibleSection
        id="fund-sources"
        title="Where Fundraising Is Coming From"
        subtitle="Funding source breakdown across selected candidates before reviewing the full leaderboard."
        defaultOpen
        right={<Badge tone="info">{sourceBreakdown.length} Funding Sources</Badge>}
      >
        {!sourceBreakdown.length ? (
          <EmptyState text="No funding source data is available yet." />
        ) : (
          <ShowMoreList
            items={sourceBreakdown}
            initialCount={8}
            showAllLabel={(count) => `Show All ${count} Sources`}
            className="fund-source-breakdown-wide"
            renderItem={(row) => (
              <SourceRow
                source={row.source}
                total={row.total}
                max={maxSourceTotal}
              />
            )}
          />
        )}
      </CollapsibleSection>

      <CollapsibleSection
        id="fund-leaderboard"
        title="Fundraising Leaderboard"
        subtitle="Full-width candidate finance leaderboard. Select a candidate to jump to detailed funding-source intelligence."
        defaultOpen
        right={<Badge tone="accent">{filteredLeaderboard.length} Candidates</Badge>}
      >
        <div className="fund-stack">
          {loading ? (
            <EmptyState text="Loading fundraising leaderboard..." />
          ) : !filteredLeaderboard.length ? (
            <EmptyState text="No fundraising data is available yet. Click Import FEC Data, then refresh the dashboard." />
          ) : (
            <ShowMoreList
              items={filteredLeaderboard}
              initialCount={12}
              showAllLabel={(count) => `Show All ${count} Candidates`}
              className="fund-stack"
              renderItem={(row) => (
                <LeaderRow
                  row={row}
                  selected={String(row.candidate_id || row.name) === String(selectedCandidateId)}
                  onSelect={handleCandidateSelect}
                />
              )}
            />
          )}
        </div>
      </CollapsibleSection>

      <div ref={selectedCandidateDetailRef} className="fund-selected-detail-anchor">
        <CollapsibleSection
          id="fund-selected"
          title="Selected Candidate Funding Source Detail"
          subtitle="One selected candidate at a time for a cleaner enterprise workflow."
          defaultOpen
          right={selectedCandidate ? <Badge tone="accent">{selectedCandidate.name}</Badge> : null}
        >
          <CandidateSourceDetail row={selectedCandidate} />
        </CollapsibleSection>
      </div>

      <CollapsibleSection
        id="fund-pacs"
        title="PAC / Committee Intelligence"
        subtitle="Named PACs and committees ranked by contribution amount across the filtered candidate universe."
        defaultOpen={false}
        right={<Badge tone="info">{filteredPacs.length} PACs</Badge>}
      >
        <div className="fund-stack">
          {filteredPacs.length ? (
            <ShowMoreList
              items={filteredPacs}
              initialCount={12}
              showAllLabel={(count) => `Show All ${count} PACs`}
              className="fund-stack"
              renderItem={(pac, index) => (
                <PacRow pac={pac} index={index} max={maxPacTotal} />
              )}
            />
          ) : (
            <EmptyState text="No named PAC records match the selected filters." />
          )}
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        id="fund-heat"
        title="State, Party, and Office Finance Heat"
        subtitle="Receipts and candidate count by state, party, and office."
        defaultOpen={false}
        right={<Badge tone="accent">{stateRows.length} States</Badge>}
      >
        <div className="fund-stack">
          {stateRows.length ? (
            <ShowMoreList
              items={stateRows}
              initialCount={12}
              showAllLabel={(count) => `Show All ${count} States`}
              className="fund-stack"
              renderItem={(row, index) => (
                <EntityRow row={row} index={index} label="State" max={maxStateTotal} />
              )}
            />
          ) : (
            <EmptyState text="No state finance heat data is available." />
          )}

          {partyRows.map((row, index) => (
            <EntityRow key={row.party || row.name} row={row} index={index} label="Party" max={Math.max(...partyRows.map((item) => item.total_receipts), 0)} />
          ))}

          {officeRows.map((row, index) => (
            <EntityRow key={row.office || row.name} row={row} index={index} label="Office" max={Math.max(...officeRows.map((item) => item.total_receipts), 0)} />
          ))}
        </div>
      </CollapsibleSection>

      <BackToTopButton />
    </PageShell>
  );
}

