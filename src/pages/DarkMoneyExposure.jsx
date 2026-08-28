import { useCallback, useEffect, useMemo, useState } from "react";

import { api } from "../services/api";

import PageShell from "../components/ui/PageShell";

import SectionCard from "../components/ui/SectionCard";

import StatCard from "../components/ui/StatCard";

import Badge from "../components/ui/Badge";

import EmptyState from "../components/ui/EmptyState";

import ResponsiveRow from "../components/ui/ResponsiveRow";

import { useDemoMode } from "../context/DemoModeContext.jsx";

import { useExecutiveFilters } from "../context/ExecutiveFiltersContext.jsx";

 

const STATES = [

  ["", "All States"], ["AL", "Alabama"], ["AK", "Alaska"], ["AZ", "Arizona"],

  ["AR", "Arkansas"], ["CA", "California"], ["CO", "Colorado"], ["CT", "Connecticut"],

  ["DE", "Delaware"], ["DC", "District of Columbia"], ["FL", "Florida"], ["GA", "Georgia"],

  ["HI", "Hawaii"], ["ID", "Idaho"], ["IL", "Illinois"], ["IN", "Indiana"],

  ["IA", "Iowa"], ["KS", "Kansas"], ["KY", "Kentucky"], ["LA", "Louisiana"],

  ["ME", "Maine"], ["MD", "Maryland"], ["MA", "Massachusetts"], ["MI", "Michigan"],

  ["MN", "Minnesota"], ["MS", "Mississippi"], ["MO", "Missouri"], ["MT", "Montana"],

  ["NE", "Nebraska"], ["NV", "Nevada"], ["NH", "New Hampshire"], ["NJ", "New Jersey"],

  ["NM", "New Mexico"], ["NY", "New York"], ["NC", "North Carolina"], ["ND", "North Dakota"],

  ["OH", "Ohio"], ["OK", "Oklahoma"], ["OR", "Oregon"], ["PA", "Pennsylvania"],

  ["RI", "Rhode Island"], ["SC", "South Carolina"], ["SD", "South Dakota"], ["TN", "Tennessee"],

  ["TX", "Texas"], ["UT", "Utah"], ["VT", "Vermont"], ["VA", "Virginia"],

  ["WA", "Washington"], ["WV", "West Virginia"], ["WI", "Wisconsin"], ["WY", "Wyoming"],

];

 

const EMPTY_DATA = {

  summary: { total_committees: 0, high_exposure: 0, critical_exposure: 0, total_amount: 0 },

  results: [], top_exposure: [], briefing: [], consultant_clusters: [],

  cross_party_exposure: [], state_chains: [], candidate_exposure: [],

};

 

const number = (value) => Number(value || 0);

const list = (value) => (Array.isArray(value) ? value : []);

const money = (value) => number(value).toLocaleString("en-US", {

  style: "currency", currency: "USD", maximumFractionDigits: 0,

});

const compactMoney = (value) => new Intl.NumberFormat("en-US", {

  style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1,

}).format(number(value));

const date = (value) => value

  ? new Date(value).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })

  : "Not reported";

 

function tierTone(value) {

  const tier = String(value || "").toLowerCase();

  if (tier === "critical") return "danger";

  if (tier === "high") return "demo";

  if (tier === "moderate" || tier === "medium") return "accent";

  return "info";

}

 

function sectionValues(value) {

  return list(value).filter(Boolean);

}

 

function unwrapPayload(response) {

  const payload = response?.data ?? response ?? {};

 

  if (

    payload?.data &&

    typeof payload.data === "object" &&

    (

      Array.isArray(payload.data.results) ||

      payload.data.summary ||

      Array.isArray(payload.data.relationships)

    )

  ) {

    return payload.data;

  }

 

  return payload;

}

 

function hasDarkMoneyIndicators(row = {}) {

  const tier = String(row.exposure_tier || row.severity || "").toLowerCase();

  return Boolean(

    row.dark_money_indicator === true ||

    number(row.dark_money_score) > 0 ||

    number(row.disclosure_gap_score) > 0 ||

    number(row.independent_expenditure_amount) > 0 ||

    number(row.nonprofit_spending_amount) > 0 ||

    number(row.organization_transfer_amount) > 0 ||

    number(row.shell_organization_score) > 0 ||

    tier === "high" ||

    tier === "critical"

  );

}

 

export default function DarkMoneyExposure() {

  const { demoMode } = useDemoMode();

  const { filters, setFilters } = useExecutiveFilters();

  const [data, setData] = useState(EMPTY_DATA);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [cycle, setCycle] = useState(2026);

  const [state, setState] = useState(filters.state || "");

  const [party, setParty] = useState("");

  const [search, setSearch] = useState("");

  const [minAmount, setMinAmount] = useState("");

  const [selected, setSelected] = useState(null);

  const [profile, setProfile] = useState(null);

  const [profileLoading, setProfileLoading] = useState(false);

  const [profileError, setProfileError] = useState("");

  const [updatedAt, setUpdatedAt] = useState(null);

  const [boardOpen, setBoardOpen] = useState(true);

  const [darkIndicatorsOnly, setDarkIndicatorsOnly] = useState(false);

 

  const params = useMemo(() => ({

    cycle,

    limit: 100,

    ...(state ? { state } : {}),

    ...(party ? { party } : {}),

    ...(search.trim() ? { search: search.trim() } : {}),

    ...(minAmount ? { min_amount: minAmount } : {}),

  }), [cycle, state, party, search, minAmount]);

 

  const loadDashboard = useCallback(async (quiet = false) => {

    quiet ? setRefreshing(true) : setLoading(true);

    setError("");

    try {

      const response = api.darkMoneyExposure

        ? await api.darkMoneyExposure(params)

        : await api.get("/dark-money-exposure", { params });

      const payload = unwrapPayload(response);

      setData({

        ...EMPTY_DATA,

        ...payload,

        summary: {

          ...EMPTY_DATA.summary,

          ...(payload.summary || {}),

        },

        results: sectionValues(payload.results),

      });

      setUpdatedAt(new Date());

    } catch (nextError) {

      setError(nextError?.response?.data?.error || nextError?.message || "Unable to load dark-money exposure intelligence.");

    } finally {

      setLoading(false);

      setRefreshing(false);

    }

  }, [params]);

 

  useEffect(() => {

    const timer = window.setTimeout(() => loadDashboard(false), 250);

    return () => window.clearTimeout(timer);

  }, [loadDashboard]);

 

  useEffect(() => {

    setFilters({ state });

  }, [setFilters, state]);

 

  const openProfile = useCallback(async (committee) => {

    if (!committee?.committee_id) return;

    setSelected(committee);

    setProfile(null);

    setProfileError("");

    setProfileLoading(true);

    try {

      const id = encodeURIComponent(String(committee.committee_id).trim());

      const response = api.darkMoneyExposureProfile

        ? await api.darkMoneyExposureProfile(id, { cycle })

        : await api.get(`/dark-money-exposure/profile/${id}`, { params: { cycle } });

      setProfile(unwrapPayload(response));

    } catch (nextError) {

      setProfileError(nextError?.response?.data?.error || nextError?.message || "Unable to load this committee profile.");

    } finally {

      setProfileLoading(false);

    }

  }, [cycle]);

 

  const summary = data.summary || EMPTY_DATA.summary;

  const results = sectionValues(data.results);

  const displayedResults = darkIndicatorsOnly

    ? results.filter(hasDarkMoneyIndicators)

    : results;

  const relationships = sectionValues(profile?.relationships);

  const selectedAmount = relationships.reduce((total, row) => total + number(row.total_amount), 0);

  const selectedTransactions = relationships.reduce((total, row) => total + number(row.transaction_count), 0);

 

  function resetFilters() {

    setSearch("");

    setState("");

    setParty("");

    setMinAmount("");

    setDarkIndicatorsOnly(false);

  }

 

  return (

    <PageShell

      eyebrow="Political Finance Risk Intelligence"

      title="Political Money Exposure Command Center"

      description="Investigate committee, nonprofit, consultant, candidate, geographic, party and money-flow concentration using the VoterSpheres exposure model."

      actions={(

        <button className="vs-button vs-button-secondary dm-refresh-button" type="button" onClick={() => loadDashboard(true)} disabled={refreshing}>

          {refreshing ? "Refreshing…" : "Refresh intelligence"}

        </button>

      )}

      demo={demoMode}

      demoText="Demonstration mode may include representative records."

    >

      <div className="dm-methodology">

        <div>

          <strong>What this model measures</strong>

          <p>Mapped committee and nonprofit relationships, consultant and vendor concentration, candidate reach, geographic spread, party reach and reported money flow.</p>

        </div>

        <Badge tone="info">Risk model</Badge>

        <p className="dm-limit"><strong>Important:</strong> an exposure score is an investigative lead, not proof that a committee concealed donors or violated campaign-finance law.</p>

      </div>

 

      <div className="dm-stats">

        <StatCard label="Tracked Committees" value={number(summary.total_committees).toLocaleString()} helper="In the current filtered model" />

        <StatCard label="Mapped Money Flow" value={compactMoney(summary.total_amount)} helper="Consultant-related reported activity" />

        <StatCard label="High Exposure" value={number(summary.high_exposure).toLocaleString()} helper="High or elevated risk tier" />

        <StatCard label="Critical Exposure" value={number(summary.critical_exposure).toLocaleString()} helper="Highest-priority review queue" />

      </div>

 

      <SectionCard title="Exposure Filters" subtitle="Narrow the model without changing the underlying source records.">

        <div className="dm-filters">

          <label><span>Committee search</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name or committee ID" /></label>

          <label><span>Election cycle</span><select value={cycle} onChange={(event) => setCycle(Number(event.target.value))}><option value={2026}>2026</option><option value={2024}>2024</option><option value={2022}>2022</option><option value={2020}>2020</option></select></label>

          <label><span>State</span><select value={state} onChange={(event) => setState(event.target.value)}>{STATES.map(([value, label]) => <option key={value || "all"} value={value}>{label}</option>)}</select></label>

          <label><span>Party</span><select value={party} onChange={(event) => setParty(event.target.value)}><option value="">All Parties</option><option value="DEM">Democratic</option><option value="REP">Republican</option><option value="IND">Independent</option></select></label>

          <label><span>Minimum flow</span><input type="number" min="0" step="1000" value={minAmount} onChange={(event) => setMinAmount(event.target.value)} placeholder="0" /></label>

          <button

            type="button"

            className={`vs-button dm-control-button ${darkIndicatorsOnly ? "vs-button-primary" : "vs-button-secondary"}`}

            onClick={() => setDarkIndicatorsOnly((value) => !value)}

            aria-pressed={darkIndicatorsOnly}

            title="Prioritize records with disclosure-gap, nonprofit-spending, independent-expenditure, organizational-transfer, shell-organization, or elevated exposure indicators."

          >

            {darkIndicatorsOnly ? "Showing dark-money indicators" : "Dark-money indicators"}

          </button>

          <button type="button" className="vs-button vs-button-secondary dm-control-button" onClick={resetFilters}>Clear filters</button>

        </div>

      </SectionCard>

 

      {error ? <div className="dm-error" role="alert">{error}</div> : null}

 

      <div className="dm-layout">

        <SectionCard

          title="Committee Exposure Board"

          subtitle={`${displayedResults.length} of ${results.length} committees shown • select a committee for relationship evidence`}

          right={(

            <button

              type="button"

              className="vs-button vs-button-secondary dm-control-button"

              onClick={() => setBoardOpen((value) => !value)}

              aria-expanded={boardOpen}

              aria-controls="dark-money-committee-board"

            >

              {boardOpen ? "Collapse" : "Expand"}

            </button>

          )}

        >

          <div id="dark-money-committee-board" hidden={!boardOpen}>

            {loading ? <div className="dm-loading">Loading exposure intelligence…</div> : null}

            {!loading && !displayedResults.length ? <EmptyState title="No exposure records found" description={darkIndicatorsOnly ? "No records currently meet the dark-money indicator criteria. Turn off the indicator filter or refresh the model." : "Adjust the filters or refresh the intelligence model."} /> : null}

            <div className="dm-list">

              {displayedResults.map((row) => (

                <button className="dm-row-button" type="button" key={row.committee_id} onClick={() => openProfile(row)}>

                  <ResponsiveRow

                    title={row.committee_name || "Unnamed committee"}

                    subtitle={`${row.committee_id || "No ID"} • ${date(row.last_activity)} • ${list(row.states).join(", ") || "No state"}`}

                    meta={[

                      { label: "Money flow", value: money(row.total_amount) },

                      { label: "Consultants", value: number(row.consultant_count).toLocaleString() },

                      { label: "Candidates", value: number(row.candidate_count).toLocaleString() },

                      { label: "States", value: number(row.state_count).toLocaleString() },

                    ]}

                    active={selected?.committee_id === row.committee_id}

                    right={<div className="dm-score"><strong>{number(row.exposure_score)}</strong><Badge tone={tierTone(row.exposure_tier || row.severity)}>{row.exposure_tier || row.severity || "review"}</Badge></div>}

                  />

                </button>

              ))}

            </div>

          </div>

        </SectionCard>

 

        <div className="dm-side">

          <SectionCard title="Executive Briefing" subtitle="Current model findings">

            {sectionValues(data.briefing).length ? <ol className="dm-briefing">{sectionValues(data.briefing).map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ol> : <EmptyState title="No briefing generated" description="Refresh the model to generate the current briefing." />}

          </SectionCard>

          <SectionCard title="Top Exposure Queue" subtitle="Highest-ranked committees in this result set">

            <div className="dm-ranking">

              {sectionValues(data.top_exposure).slice(0, 10).map((row, index) => (

                <button type="button" key={row.committee_id} onClick={() => openProfile(row)}>

                  <span>{index + 1}</span><div><strong>{row.committee_name}</strong><small>{compactMoney(row.total_amount)} mapped flow</small></div><Badge tone={tierTone(row.exposure_tier)}>{number(row.exposure_score)}</Badge>

                </button>

              ))}

            </div>

          </SectionCard>

        </div>

      </div>

 

      <SectionCard

        title={selected ? `Committee Evidence — ${selected.committee_name}` : "Committee Evidence"}

        subtitle={selected ? `${selected.committee_id} • relationship-level model evidence` : "Select a committee from the exposure board"}

        right={selected ? <button type="button" className="vs-button vs-button-secondary dm-control-button" onClick={() => { setSelected(null); setProfile(null); }}>Close</button> : null}

      >

        {!selected ? <EmptyState title="No committee selected" description="Choose a committee to inspect its consultants, vendors, candidates and mapped money flow." /> : null}

        {profileLoading ? <div className="dm-loading">Loading committee evidence…</div> : null}

        {profileError ? <div className="dm-error" role="alert">{profileError}</div> : null}

        {selected && !profileLoading && !profileError ? (

          <>

            <div className="dm-profile-stats">

              <div><span>Relationships</span><strong>{relationships.length.toLocaleString()}</strong></div>

              <div><span>Mapped flow</span><strong>{compactMoney(selectedAmount || selected.total_amount)}</strong></div>

              <div><span>Transactions</span><strong>{selectedTransactions.toLocaleString()}</strong></div>

              <div><span>Exposure score</span><strong>{number(selected.exposure_score)}</strong></div>

            </div>

            {!relationships.length ? <EmptyState title="No relationship evidence returned" description="The committee is ranked in the dashboard, but no profile relationships were returned for this cycle." /> : null}

            <div className="dm-relationships">

              {relationships.map((row, index) => (

                <article key={`${row.consultant_id || row.consultant_name || "relationship"}-${index}`}>

                  <div className="dm-relationship-heading"><div><strong>{row.consultant_name || row.firm_name || "Unidentified consultant or vendor"}</strong><span>{row.firm_name && row.firm_name !== row.consultant_name ? row.firm_name : row.consultant_category || row.category || "Relationship"}</span></div><strong>{money(row.total_amount)}</strong></div>

                  <dl>

                    <div><dt>Candidate</dt><dd>{row.candidate_name || "Not linked"}</dd></div>

                    <div><dt>State / party</dt><dd>{[row.state || row.consultant_state, row.party].filter(Boolean).join(" • ") || "Not reported"}</dd></div>

                    <div><dt>Transactions</dt><dd>{number(row.transaction_count).toLocaleString()}</dd></div>

                    <div><dt>Last activity</dt><dd>{date(row.last_disbursement_date || row.last_activity)}</dd></div>

                  </dl>

                  {row.purpose ? <p>{row.purpose}</p> : null}

                </article>

              ))}

            </div>

          </>

        ) : null}

      </SectionCard>

 

      <SectionCard title="Advanced Exposure Modules" subtitle="Reserved model outputs appear here when the backend returns evidence.">

        <div className="dm-modules">

          {[

            ["Consultant clusters", data.consultant_clusters],

            ["Cross-party exposure", data.cross_party_exposure],

            ["State chains", data.state_chains],

            ["Candidate exposure", data.candidate_exposure],

          ].map(([label, values]) => <div key={label}><strong>{label}</strong><span>{sectionValues(values).length ? `${sectionValues(values).length} findings available` : "No findings returned in this model run"}</span></div>)}

        </div>

      </SectionCard>

 

      <p className="dm-updated">Last refreshed: {updatedAt ? updatedAt.toLocaleString() : "Not yet refreshed"}</p>

 

      <style>{`

        .dm-refresh-button,.dm-control-button{min-height:42px;padding:0 17px;border-radius:10px;white-space:nowrap}.dm-methodology{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px 18px;padding:18px;border:1px solid rgba(76,201,240,.28);border-radius:16px;background:rgba(14,165,233,.06);margin-bottom:18px}.dm-methodology p{margin:5px 0 0;color:var(--vs-text-muted,#9aa9bd);line-height:1.55}.dm-methodology .dm-limit{grid-column:1/-1;margin:0;padding-top:10px;border-top:1px solid rgba(148,163,184,.16)}

        .dm-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-bottom:18px}.dm-filters{display:grid;grid-template-columns:2fr repeat(4,minmax(130px,1fr)) auto;gap:12px;align-items:end}.dm-filters label{display:grid;gap:6px;color:var(--vs-text-muted,#9aa9bd);font-size:12px}.dm-filters input,.dm-filters select{width:100%;min-height:42px;border:1px solid rgba(148,163,184,.24);border-radius:10px;background:var(--vs-surface,#101827);color:inherit;padding:0 11px}.dm-layout{display:grid;grid-template-columns:minmax(0,1.7fr) minmax(300px,.8fr);gap:18px;align-items:start;margin-top:18px}.dm-side{display:grid;gap:18px}.dm-list{display:grid;gap:10px}.dm-row-button{display:block;width:100%;border:0;padding:0;background:transparent;color:inherit;text-align:left;cursor:pointer}.dm-row-button:hover{filter:brightness(1.08)}.dm-score{display:grid;justify-items:end;gap:6px}.dm-score>strong{font-size:22px}.dm-loading,.dm-error{padding:18px;border-radius:12px}.dm-loading{color:var(--vs-text-muted,#9aa9bd)}.dm-error{color:#fecaca;background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.3)}.dm-briefing{margin:0;padding-left:22px;display:grid;gap:12px;line-height:1.55}.dm-ranking{display:grid;gap:8px}.dm-ranking button{display:grid;grid-template-columns:26px minmax(0,1fr) auto;gap:10px;align-items:center;text-align:left;border:0;border-bottom:1px solid rgba(148,163,184,.13);background:transparent;color:inherit;padding:10px 0;cursor:pointer}.dm-ranking button>span{display:grid;place-items:center;width:24px;height:24px;border-radius:50%;background:rgba(59,130,246,.14);color:#93c5fd}.dm-ranking button div{display:grid;gap:3px;min-width:0}.dm-ranking small{color:var(--vs-text-muted,#9aa9bd)}.dm-profile-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:16px}.dm-profile-stats>div,.dm-modules>div{display:grid;gap:6px;padding:14px;border:1px solid rgba(148,163,184,.16);border-radius:12px;background:rgba(148,163,184,.04)}.dm-profile-stats span,.dm-modules span{font-size:12px;color:var(--vs-text-muted,#9aa9bd)}.dm-profile-stats strong{font-size:20px}.dm-relationships{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;max-height:720px;overflow:auto}.dm-relationships article{padding:15px;border:1px solid rgba(148,163,184,.16);border-radius:14px;background:rgba(148,163,184,.035)}.dm-relationship-heading{display:flex;justify-content:space-between;gap:14px}.dm-relationship-heading>div{display:grid;gap:4px}.dm-relationship-heading span,.dm-relationships article>p{color:var(--vs-text-muted,#9aa9bd);font-size:12px}.dm-relationships dl{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin:14px 0 0}.dm-relationships dl>div{min-width:0}.dm-relationships dt{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:var(--vs-text-muted,#9aa9bd)}.dm-relationships dd{margin:3px 0 0;overflow-wrap:anywhere}.dm-modules{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.dm-updated{text-align:right;color:var(--vs-text-muted,#9aa9bd);font-size:12px;margin:12px 0 0}

        @media(max-width:1100px){.dm-stats,.dm-profile-stats,.dm-modules{grid-template-columns:repeat(2,minmax(0,1fr))}.dm-filters{grid-template-columns:repeat(3,minmax(0,1fr))}.dm-layout{grid-template-columns:1fr}}

        @media(max-width:720px){.dm-stats,.dm-profile-stats,.dm-modules,.dm-relationships,.dm-filters{grid-template-columns:1fr}.dm-methodology{grid-template-columns:1fr}.dm-methodology .dm-limit{grid-column:auto}.dm-relationship-heading{align-items:flex-start}.dm-relationships dl{grid-template-columns:1fr}}

      `}</style>

    </PageShell>

  );

}
