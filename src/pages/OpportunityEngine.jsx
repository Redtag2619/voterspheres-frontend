import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";

import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import ResponsiveRow from "../components/ui/ResponsiveRow";
import { getPartyBadgeClass } from "../lib/partyColors";

function arr(value) {
  return Array.isArray(value) ? value : [];
}

function tone(value) {
  const v = String(value || "").toLowerCase();

  if (["hot", "critical", "high"].includes(v)) return "danger";
  if (["develop", "watch", "medium"].includes(v)) return "demo";
  if (["ready", "active", "created"].includes(v)) return "active";

  return "accent";
}

function scoreTone(score) {
  const value = Number(score || 0);
  if (value >= 85) return "danger";
  if (value >= 70) return "demo";
  if (value >= 50) return "accent";
  return "default";
}

export default function OpportunityEngine() {
  const [filters, setFilters] = useState({
    q: "",
    state: "",
    party: "",
    office: "",
  });

  const [data, setData] = useState({
    summary: {},
    opportunities: [],
    filters: {},
  });

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const result = await api.opportunityEngine(filters);

      setData({
        summary: result?.summary || {},
        opportunities: arr(result?.opportunities),
        filters: result?.filters || {},
      });

      setLastUpdated(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.response?.data?.detail ||
          err?.message ||
          "Failed to load Opportunity Engine."
      );
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    load();
  }, []);

  const summary = data.summary || {};
  const opportunities = arr(data.opportunities);

  const topOpportunity = useMemo(() => opportunities[0] || null, [opportunities]);

  const states = useMemo(() => {
    return Array.from(new Set(opportunities.map((o) => o.state).filter(Boolean))).sort();
  }, [opportunities]);

  async function runFilteredSearch(event) {
    event.preventDefault();
    await load();
  }

  function updateFilter(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  async function createCrmContact(opportunity) {
    try {
      setActionLoading(`crm-${opportunity.id}`);
      setMessage("");
      setError("");

      const result = await api.createOpportunityCrmContact(opportunity);

      setMessage(result?.message || "CRM contact updated.");
      await load();
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.response?.data?.detail ||
          err?.message ||
          "Failed to create CRM contact."
      );
    } finally {
      setActionLoading("");
    }
  }

  async function createTask(opportunity) {
    try {
      setActionLoading(`task-${opportunity.id}`);
      setMessage("");
      setError("");

      const result = await api.createOpportunityTask(opportunity);

      setMessage(result?.message || "Opportunity task created.");
      await load();
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.response?.data?.detail ||
          err?.message ||
          "Failed to create opportunity task."
      );
    } finally {
      setActionLoading("");
    }
  }

  return (
    <PageShell
      eyebrow="Campaign CRM & Opportunity Engine"
      title="Opportunity Engine"
      description="Turn candidate intelligence into consultant business workflow: score campaign opportunities, create CRM contacts, assign follow-ups, and move prospects into the revenue pipeline."
      tickerItems={[
        {
          label: "Opportunities",
          value: `${summary.total || 0}`,
          dotClass: "vs-live-dot-success",
        },
        {
          label: "Hot",
          value: `${summary.hot || 0}`,
          dotClass: summary.hot ? "vs-live-dot" : "vs-live-dot-success",
        },
        {
          label: "Average Score",
          value: `${summary.average_score || 0}%`,
          dotClass: "vs-live-dot-warning",
        },
        {
          label: "Updated",
          value: lastUpdated || "Ready",
          dotClass: "vs-live-dot-success",
        },
      ]}
    >
      <style>{`
        .opp-layout {
          display: grid;
          grid-template-columns: minmax(0, .72fr) minmax(0, 1.28fr);
          gap: 18px;
          align-items: start;
        }

        .opp-stack {
          display: grid;
          gap: 14px;
        }

        .opp-command {
          border-radius: 28px;
          border: 1px solid rgba(148, 163, 184, .16);
          background:
            radial-gradient(circle at top left, rgba(251, 146, 60, .16), transparent 34%),
            radial-gradient(circle at bottom right, rgba(37, 99, 235, .14), transparent 34%),
            linear-gradient(135deg, rgba(15, 23, 42, .96), rgba(2, 6, 23, .86));
          padding: 22px;
          box-shadow: 0 18px 60px rgba(0,0,0,.28);
        }

        .opp-score {
          margin-top: 16px;
          color: white;
          font-size: 84px;
          line-height: .92;
          font-weight: 950;
          letter-spacing: -.08em;
        }

        .opp-title {
          margin: 12px 0 0;
          color: white;
          font-size: 26px;
          font-weight: 950;
          letter-spacing: -.05em;
          line-height: 1.05;
        }

        .opp-sub {
          margin-top: 10px;
          color: rgba(203, 213, 225, .74);
          font-size: 13px;
          line-height: 1.65;
        }

        .opp-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 16px;
        }

        .opp-form {
          display: grid;
          gap: 10px;
        }

        .opp-form input,
        .opp-form select {
          border-radius: 14px;
          border: 1px solid rgba(148, 163, 184, .16);
          background: rgba(15, 23, 42, .74);
          color: white;
          padding: 11px 12px;
        }

        .opp-row {
          border-radius: 20px;
          border: 1px solid rgba(148, 163, 184, .16);
          background:
            radial-gradient(circle at top right, rgba(59, 130, 246, .1), transparent 34%),
            linear-gradient(135deg, rgba(15, 23, 42, .78), rgba(2, 6, 23, .54));
          overflow: hidden;
        }

        .opp-row.hot {
          border-color: rgba(248, 113, 113, .38);
        }

        .opp-row.high {
          border-color: rgba(251, 146, 60, .34);
        }

        .opp-row .vs-responsive-row {
          border: 0;
          background: transparent;
        }

        .opp-party-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 12px;
        }

        @media (max-width: 1100px) {
          .opp-layout {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}
      {message ? <div className="vs-banner vs-banner-demo">{message}</div> : null}

      <div className="vs-grid-4">
        <StatCard label="Total Opportunities" value={summary.total || 0} delta="Candidate records scored" tone="up" />
        <StatCard label="Hot Opportunities" value={summary.hot || 0} delta="Proposal-ready" tone={summary.hot ? "down" : "neutral"} />
        <StatCard label="High / Develop" value={(summary.high || 0) + (summary.develop || 0)} delta="Follow-up pipeline" tone="neutral" />
        <StatCard label="CRM Ready" value={summary.crm_ready || 0} delta="Already in CRM" tone="up" />
      </div>

      <div className="opp-layout">
        <div className="opp-stack">
          <div className="opp-command">
            <Badge tone={topOpportunity ? scoreTone(topOpportunity.score) : "accent"}>
              {topOpportunity?.score_label || "No Opportunity"}
            </Badge>

            <div className="opp-score">{topOpportunity?.score || 0}%</div>

            <h2 className="opp-title">
              {topOpportunity?.candidate_name || "No scored campaign yet"}
            </h2>

            <div className="opp-sub">
              {topOpportunity
                ? `${topOpportunity.office} • ${topOpportunity.state} • ${topOpportunity.party} • ${topOpportunity.cycle}`
                : "Run the opportunity engine to identify the strongest campaign prospects."}
            </div>

            {topOpportunity ? (
              <>
                <div className="opp-sub">{topOpportunity.recommended_action}</div>
                <div className="opp-party-row">
                  <span className={getPartyBadgeClass(topOpportunity.party)}>
                    {topOpportunity.party}
                  </span>
                  <Badge tone={scoreTone(topOpportunity.score)}>
                    {topOpportunity.score_label}
                  </Badge>
                  <Badge tone={topOpportunity.crm_exists ? "active" : "demo"}>
                    {topOpportunity.crm_exists ? "In CRM" : "Needs CRM"}
                  </Badge>
                </div>
              </>
            ) : null}

            <div className="opp-actions">
              {topOpportunity ? (
                <>
                  <button
                    className="vs-button"
                    onClick={() => createCrmContact(topOpportunity)}
                    disabled={actionLoading === `crm-${topOpportunity.id}`}
                  >
                    {actionLoading === `crm-${topOpportunity.id}` ? "Creating..." : "Create CRM Contact"}
                  </button>
                  <button
                    className="vs-button vs-button-secondary"
                    onClick={() => createTask(topOpportunity)}
                    disabled={actionLoading === `task-${topOpportunity.id}`}
                  >
                    {actionLoading === `task-${topOpportunity.id}` ? "Creating..." : "Create Follow-Up Task"}
                  </button>
                </>
              ) : null}
              <Link className="vs-button vs-button-secondary" to="/business-suite">
                Business Suite
              </Link>
            </div>
          </div>

          <SectionCard title="Filters" subtitle="Focus opportunity scoring by state, party, office, or candidate search.">
            <form className="opp-form" onSubmit={runFilteredSearch}>
              <input
                placeholder="Search candidate, office, state, party..."
                value={filters.q}
                onChange={(event) => updateFilter("q", event.target.value)}
              />

              <select value={filters.state} onChange={(event) => updateFilter("state", event.target.value)}>
                <option value="">All States</option>
                {states.map((state) => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>

              <select value={filters.party} onChange={(event) => updateFilter("party", event.target.value)}>
                <option value="">All Parties</option>
                <option value="Democratic">Democratic</option>
                <option value="Republican">Republican</option>
                <option value="Independent">Independent</option>
              </select>

              <input
                placeholder="Office, e.g. Senate, Governor, House"
                value={filters.office}
                onChange={(event) => updateFilter("office", event.target.value)}
              />

              <button className="vs-button" type="submit">
                {loading ? "Scoring..." : "Run Opportunity Search"}
              </button>
            </form>
          </SectionCard>

          <SectionCard title="Pipeline Rules" subtitle="How the score is calculated.">
            <div className="opp-stack">
              <div className="vs-card-muted">
                <strong>85-100: Hot</strong>
                <div className="vs-row-subtitle">Proposal-ready campaign opportunity.</div>
              </div>
              <div className="vs-card-muted">
                <strong>70-84: High</strong>
                <div className="vs-row-subtitle">Assign consultant follow-up.</div>
              </div>
              <div className="vs-card-muted">
                <strong>50-69: Develop</strong>
                <div className="vs-row-subtitle">Enrich contacts and monitor signals.</div>
              </div>
              <div className="vs-card-muted">
                <strong>0-49: Watch</strong>
                <div className="vs-row-subtitle">Keep in watchlist until more activity appears.</div>
              </div>
            </div>
          </SectionCard>
        </div>

        <SectionCard
          title="Scored Campaign Opportunities"
          subtitle="Candidate records ranked by data quality, signal context, vendor coverage, and conversion readiness."
          right={<Badge tone={opportunities.length ? "accent" : "active"}>{opportunities.length}</Badge>}
        >
          {loading ? (
            <EmptyState text="Scoring campaign opportunities..." />
          ) : !opportunities.length ? (
            <EmptyState text="No campaign opportunities matched the active filters." />
          ) : (
            <div className="opp-stack">
              {opportunities.map((opportunity) => (
                <div
                  key={opportunity.id}
                  className={`opp-row ${opportunity.score >= 85 ? "hot" : opportunity.score >= 70 ? "high" : ""}`}
                >
                  <ResponsiveRow
                    title={opportunity.candidate_name}
                    subtitle={opportunity.recommended_action}
                    meta={[
                      { label: "Office", value: opportunity.office },
                      { label: "State", value: opportunity.state },
                      { label: "Party", value: opportunity.party },
                      { label: "Score", value: `${opportunity.score}%` },
                      { label: "Signals", value: opportunity.related?.signal_count || 0 },
                      { label: "Vendors", value: opportunity.related?.vendor_count || 0 },
                      { label: "CRM", value: opportunity.crm_exists ? "Exists" : "Not created" },
                      { label: "Cycle", value: opportunity.cycle },
                    ]}
                    right={
                      <div style={{ display: "grid", gap: 8, justifyItems: "end" }}>
                        <Badge tone={scoreTone(opportunity.score)}>
                          {opportunity.score_label}
                        </Badge>
                        <span className={getPartyBadgeClass(opportunity.party)}>
                          {opportunity.party}
                        </span>
                        <button
                          className="vs-button vs-button-secondary"
                          onClick={() => createCrmContact(opportunity)}
                          disabled={actionLoading === `crm-${opportunity.id}`}
                        >
                          {opportunity.crm_exists ? "CRM Exists" : "Add CRM"}
                        </button>
                        <button
                          className="vs-button vs-button-secondary"
                          onClick={() => createTask(opportunity)}
                          disabled={actionLoading === `task-${opportunity.id}`}
                        >
                          Task
                        </button>
                      </div>
                    }
                  />
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </PageShell>
  );
}
