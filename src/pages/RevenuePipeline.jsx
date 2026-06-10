import { useCallback, useEffect, useMemo, useState } from "react";
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

function money(value) {
  return `$${Number(value || 0).toLocaleString(undefined, {
    maximumFractionDigits: 0,
  })}`;
}

function tone(value) {
  const v = String(value || "").toLowerCase();

  if (["proposal", "qualified", "needs_next_step"].includes(v)) return "danger";
  if (["lead", "prospect", "needs_close_date"].includes(v)) return "demo";
  if (["won", "active"].includes(v)) return "active";
  if (["lost", "closed"].includes(v)) return "default";

  return "accent";
}

function stageLabel(value = "") {
  const map = {
    lead: "Lead",
    prospect: "Prospect",
    qualified: "Qualified",
    proposal: "Proposal",
    won: "Won",
    lost: "Lost",
  };

  return map[String(value || "").toLowerCase()] || "Lead";
}

const STAGES = ["lead", "prospect", "qualified", "proposal", "won", "lost"];

const emptyForm = {
  title: "",
  organization: "",
  contact_name: "",
  email: "",
  phone: "",
  state: "",
  party: "",
  office: "",
  source: "manual",
  stage: "lead",
  value: "",
  probability: "",
  expected_close_date: "",
  next_step: "",
  notes: "",
};

export default function RevenuePipeline() {
  const [filters, setFilters] = useState({
    q: "",
    state: "",
    stage: "",
  });

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");

  const [data, setData] = useState({
    summary: {},
    stages: [],
    deals: [],
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const result = await api.revenuePipeline(filters);

      setData({
        summary: result?.summary || {},
        stages: arr(result?.stages),
        deals: arr(result?.deals),
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
          "Failed to load Revenue Pipeline."
      );
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    load();
  }, []);

  const summary = data.summary || {};
  const deals = arr(data.deals);
  const stages = arr(data.stages);

  const states = useMemo(() => {
    return Array.from(new Set(deals.map((deal) => deal.state).filter(Boolean))).sort();
  }, [deals]);

  const groupedDeals = useMemo(() => {
    return STAGES.reduce((acc, stage) => {
      acc[stage] = deals.filter((deal) => String(deal.stage || "").toLowerCase() === stage);
      return acc;
    }, {});
  }, [deals]);

  const topDeal = useMemo(() => {
    return deals
      .filter((deal) => !["won", "lost"].includes(String(deal.stage || "").toLowerCase()))
      .sort((a, b) => Number(b.weighted_value || 0) - Number(a.weighted_value || 0))[0];
  }, [deals]);

  function updateFilter(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function updateForm(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId("");
  }

  function editDeal(deal) {
    setEditingId(deal.id);
    setForm({
      title: deal.title || "",
      organization: deal.organization || "",
      contact_name: deal.contact_name || "",
      email: deal.email || "",
      phone: deal.phone || "",
      state: deal.state || "",
      party: deal.party || "",
      office: deal.office || "",
      source: deal.source || "manual",
      stage: deal.stage || "lead",
      value: deal.value || "",
      probability: deal.probability || "",
      expected_close_date: deal.expected_close_date ? String(deal.expected_close_date).slice(0, 10) : "",
      next_step: deal.next_step || "",
      notes: deal.notes || "",
    });
  }

  async function submitForm(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      if (editingId) {
        const result = await api.updateRevenueDeal(editingId, form);
        setMessage(result?.message || "Revenue deal updated.");
      } else {
        const result = await api.createRevenueDeal(form);
        setMessage(result?.message || "Revenue deal created.");
      }

      resetForm();
      await load();
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.response?.data?.detail ||
          err?.message ||
          "Failed to save revenue deal."
      );
    } finally {
      setSaving(false);
    }
  }

  async function advanceDeal(deal, nextStage) {
    try {
      setActionLoading(`advance-${deal.id}`);
      setError("");
      setMessage("");

      const result = await api.advanceRevenueDeal(deal.id, nextStage);
      setMessage(result?.message || "Deal advanced.");
      await load();
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.response?.data?.detail ||
          err?.message ||
          "Failed to advance deal."
      );
    } finally {
      setActionLoading("");
    }
  }

  async function removeDeal(deal) {
    const ok = window.confirm(`Delete ${deal.title}?`);
    if (!ok) return;

    try {
      setActionLoading(`delete-${deal.id}`);
      setError("");
      setMessage("");

      const result = await api.deleteRevenueDeal(deal.id);
      setMessage(result?.message || "Deal deleted.");
      await load();
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.response?.data?.detail ||
          err?.message ||
          "Failed to delete deal."
      );
    } finally {
      setActionLoading("");
    }
  }

  async function runSearch(event) {
    event.preventDefault();
    await load();
  }

  return (
    <PageShell
      eyebrow="Consultant CRM Revenue Pipeline"
      title="Revenue Pipeline"
      description="Turn political opportunities into consultant revenue. Track leads, prospects, qualified opportunities, proposals, wins, losses, next steps, and weighted pipeline value."
      tickerItems={[
        { label: "Open Deals", value: `${summary.open || 0}`, dotClass: "vs-live-dot-success" },
        { label: "Pipeline", value: money(summary.pipeline_value), dotClass: "vs-live-dot-warning" },
        { label: "Weighted", value: money(summary.weighted_pipeline), dotClass: "vs-live-dot-success" },
        { label: "Updated", value: lastUpdated || "Ready", dotClass: "vs-live-dot-success" },
      ]}
    >
      <style>{`
        .pipeline-grid {
          display: grid;
          grid-template-columns: minmax(0, .72fr) minmax(0, 1.28fr);
          gap: 18px;
          align-items: start;
        }

        .pipeline-stack {
          display: grid;
          gap: 14px;
        }

        .pipeline-command {
          border-radius: 30px;
          border: 1px solid rgba(148, 163, 184, .16);
          background:
            radial-gradient(circle at top left, rgba(251, 146, 60, .18), transparent 34%),
            radial-gradient(circle at bottom right, rgba(37, 99, 235, .16), transparent 34%),
            linear-gradient(135deg, rgba(15, 23, 42, .98), rgba(2, 6, 23, .88));
          padding: 24px;
          box-shadow: 0 18px 60px rgba(0,0,0,.32);
        }

        .pipeline-value {
          margin-top: 14px;
          color: white;
          font-size: clamp(42px, 7vw, 82px);
          line-height: .94;
          font-weight: 950;
          letter-spacing: -.08em;
        }

        .pipeline-title {
          margin: 12px 0 0;
          color: white;
          font-size: 24px;
          font-weight: 950;
          letter-spacing: -.05em;
          line-height: 1.05;
        }

        .pipeline-sub {
          margin-top: 10px;
          color: rgba(203, 213, 225, .74);
          font-size: 13px;
          line-height: 1.65;
        }

        .pipeline-form {
          display: grid;
          gap: 10px;
        }

        .pipeline-form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .pipeline-form input,
        .pipeline-form select,
        .pipeline-form textarea {
          border-radius: 14px;
          border: 1px solid rgba(148, 163, 184, .16);
          background: rgba(15, 23, 42, .74);
          color: white;
          padding: 11px 12px;
          width: 100%;
        }

        .pipeline-form textarea {
          min-height: 88px;
          resize: vertical;
        }

        .pipeline-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .pipeline-board {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }

        .pipeline-column {
          border-radius: 22px;
          border: 1px solid rgba(148, 163, 184, .16);
          background: rgba(15, 23, 42, .5);
          padding: 12px;
          min-height: 240px;
        }

        .pipeline-column-head {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          align-items: center;
          margin-bottom: 10px;
        }

        .pipeline-column-title {
          margin: 0;
          color: white;
          font-size: 14px;
          font-weight: 950;
        }

        .pipeline-row {
          border-radius: 18px;
          border: 1px solid rgba(148, 163, 184, .16);
          background:
            radial-gradient(circle at top right, rgba(59, 130, 246, .1), transparent 34%),
            linear-gradient(135deg, rgba(15, 23, 42, .78), rgba(2, 6, 23, .54));
          padding: 12px;
          display: grid;
          gap: 10px;
          margin-bottom: 10px;
        }

        .pipeline-row-title {
          color: white;
          font-weight: 900;
          font-size: 14px;
          line-height: 1.25;
        }

        .pipeline-row-sub {
          color: rgba(203, 213, 225, .72);
          font-size: 12px;
          line-height: 1.45;
        }

        .pipeline-row-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
        }

        .pipeline-button-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .pipeline-mini-button {
          border-radius: 999px;
          border: 1px solid rgba(148, 163, 184, .16);
          background: rgba(15, 23, 42, .72);
          color: rgba(226, 232, 240, .88);
          font-size: 11px;
          font-weight: 800;
          padding: 7px 9px;
          cursor: pointer;
        }

        .pipeline-mini-button:hover {
          border-color: rgba(251, 146, 60, .38);
          background: rgba(251, 146, 60, .12);
        }

        @media (max-width: 1180px) {
          .pipeline-grid,
          .pipeline-form-grid {
            grid-template-columns: 1fr;
          }

          .pipeline-board {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}
      {message ? <div className="vs-banner vs-banner-demo">{message}</div> : null}

      <div className="vs-grid-4">
        <StatCard label="Pipeline Value" value={money(summary.pipeline_value)} delta="Open deal value" tone="up" />
        <StatCard label="Weighted Pipeline" value={money(summary.weighted_pipeline)} delta="Probability adjusted" tone="up" />
        <StatCard label="Won Revenue" value={money(summary.won_value)} delta={`${summary.won || 0} won`} tone="up" />
        <StatCard label="Needs Next Step" value={summary.needs_next_step || 0} delta="Follow-up gaps" tone={summary.needs_next_step ? "down" : "up"} />
      </div>

      <div className="pipeline-grid">
        <div className="pipeline-stack">
          <div className="pipeline-command">
            <Badge tone={topDeal ? tone(topDeal.stage) : "accent"}>
              {topDeal ? topDeal.stage_label : "No Open Deal"}
            </Badge>

            <div className="pipeline-value">
              {money(topDeal?.weighted_value || summary.weighted_pipeline || 0)}
            </div>

            <h2 className="pipeline-title">
              {topDeal?.title || "No top deal yet"}
            </h2>

            <div className="pipeline-sub">
              {topDeal
                ? `${topDeal.organization || "Opportunity"} • ${topDeal.state || "National"} • ${topDeal.probability || 0}% probability`
                : "Create or convert an opportunity to begin tracking revenue."}
            </div>
          </div>

          <SectionCard title={editingId ? "Edit Deal" : "Create Deal"} subtitle="Add consultant revenue opportunities manually or from Opportunity Engine.">
            <form className="pipeline-form" onSubmit={submitForm}>
              <input required placeholder="Deal title" value={form.title} onChange={(e) => updateForm("title", e.target.value)} />

              <div className="pipeline-form-grid">
                <input placeholder="Organization / campaign" value={form.organization} onChange={(e) => updateForm("organization", e.target.value)} />
                <input placeholder="Contact name" value={form.contact_name} onChange={(e) => updateForm("contact_name", e.target.value)} />
                <input placeholder="Email" value={form.email} onChange={(e) => updateForm("email", e.target.value)} />
                <input placeholder="Phone" value={form.phone} onChange={(e) => updateForm("phone", e.target.value)} />
                <input placeholder="State" value={form.state} onChange={(e) => updateForm("state", e.target.value)} />
                <input placeholder="Office" value={form.office} onChange={(e) => updateForm("office", e.target.value)} />

                <select value={form.party} onChange={(e) => updateForm("party", e.target.value)}>
                  <option value="">Party</option>
                  <option value="Democratic">Democratic</option>
                  <option value="Republican">Republican</option>
                  <option value="Independent">Independent</option>
                </select>

                <select value={form.stage} onChange={(e) => updateForm("stage", e.target.value)}>
                  {STAGES.map((stage) => (
                    <option key={stage} value={stage}>{stageLabel(stage)}</option>
                  ))}
                </select>

                <input type="number" placeholder="Deal value" value={form.value} onChange={(e) => updateForm("value", e.target.value)} />
                <input type="number" placeholder="Probability %" value={form.probability} onChange={(e) => updateForm("probability", e.target.value)} />
                <input type="date" value={form.expected_close_date} onChange={(e) => updateForm("expected_close_date", e.target.value)} />
                <input placeholder="Source" value={form.source} onChange={(e) => updateForm("source", e.target.value)} />
              </div>

              <input placeholder="Next step" value={form.next_step} onChange={(e) => updateForm("next_step", e.target.value)} />
              <textarea placeholder="Notes" value={form.notes} onChange={(e) => updateForm("notes", e.target.value)} />

              <div className="pipeline-actions">
                <button className="vs-button" type="submit" disabled={saving}>
                  {saving ? "Saving..." : editingId ? "Update Deal" : "Create Deal"}
                </button>
                {editingId ? (
                  <button className="vs-button vs-button-secondary" type="button" onClick={resetForm}>
                    Cancel Edit
                  </button>
                ) : null}
              </div>
            </form>
          </SectionCard>

          <SectionCard title="Filters" subtitle="Filter revenue pipeline records.">
            <form className="pipeline-form" onSubmit={runSearch}>
              <input placeholder="Search title, campaign, state, office..." value={filters.q} onChange={(e) => updateFilter("q", e.target.value)} />

              <div className="pipeline-form-grid">
                <select value={filters.stage} onChange={(e) => updateFilter("stage", e.target.value)}>
                  <option value="">All Stages</option>
                  {STAGES.map((stage) => (
                    <option key={stage} value={stage}>{stageLabel(stage)}</option>
                  ))}
                </select>

                <select value={filters.state} onChange={(e) => updateFilter("state", e.target.value)}>
                  <option value="">All States</option>
                  {states.map((state) => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>

              <button className="vs-button vs-button-secondary" type="submit">
                {loading ? "Filtering..." : "Apply Filters"}
              </button>
            </form>
          </SectionCard>
        </div>

        <SectionCard
          title="Revenue Pipeline Board"
          subtitle="Move deals through lead, prospect, qualified, proposal, won, and lost."
          right={<Badge tone="accent">{deals.length} deals</Badge>}
        >
          {loading ? (
            <EmptyState text="Loading revenue pipeline..." />
          ) : !deals.length ? (
            <EmptyState text="No revenue deals found." />
          ) : (
            <div className="pipeline-board">
              {STAGES.map((stage) => {
                const stageDeals = groupedDeals[stage] || [];
                const stageSummary = stages.find((s) => s.key === stage) || {};

                return (
                  <div key={stage} className="pipeline-column">
                    <div className="pipeline-column-head">
                      <h3 className="pipeline-column-title">{stageLabel(stage)}</h3>
                      <Badge tone={tone(stage)}>{stageDeals.length}</Badge>
                    </div>

                    <div className="pipeline-row-sub" style={{ marginBottom: 10 }}>
                      {money(stageSummary.weighted_value || 0)} weighted • {money(stageSummary.value || 0)} total
                    </div>

                    {!stageDeals.length ? (
                      <EmptyState text={`No ${stageLabel(stage).toLowerCase()} deals.`} />
                    ) : (
                      stageDeals.map((deal) => (
                        <div key={deal.id} className="pipeline-row">
                          <div>
                            <div className="pipeline-row-title">{deal.title}</div>
                            <div className="pipeline-row-sub">
                              {deal.organization || "Organization N/A"} • {deal.state || "National"} • {deal.office || "Office N/A"}
                            </div>
                          </div>

                          <div className="pipeline-row-meta">
                            <Badge tone={tone(deal.stage)}>{deal.stage_label}</Badge>
                            <Badge tone={tone(deal.risk)}>{deal.risk}</Badge>
                            {deal.party ? <span className={getPartyBadgeClass(deal.party)}>{deal.party}</span> : null}
                          </div>

                          <div className="pipeline-row-sub">
                            <strong style={{ color: "white" }}>{money(deal.value)}</strong> • {deal.probability}% probability • {money(deal.weighted_value)} weighted
                          </div>

                          <div className="pipeline-row-sub">
                            Next: {deal.next_step || "No next step assigned."}
                          </div>

                          <div className="pipeline-button-row">
                            <button className="pipeline-mini-button" onClick={() => editDeal(deal)}>Edit</button>
                            {STAGES.filter((s) => s !== deal.stage).slice(0, 4).map((nextStage) => (
                              <button
                                key={nextStage}
                                className="pipeline-mini-button"
                                disabled={actionLoading === `advance-${deal.id}`}
                                onClick={() => advanceDeal(deal, nextStage)}
                              >
                                {stageLabel(nextStage)}
                              </button>
                            ))}
                            <button
                              className="pipeline-mini-button"
                              disabled={actionLoading === `delete-${deal.id}`}
                              onClick={() => removeDeal(deal)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>
      </div>
    </PageShell>
  );
}
