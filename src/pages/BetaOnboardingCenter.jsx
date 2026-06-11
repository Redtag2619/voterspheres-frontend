import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import ResponsiveRow from "../components/ui/ResponsiveRow";

function arr(value) {
  return Array.isArray(value) ? value : [];
}

function tone(value) {
  const v = String(value || "").toLowerCase();

  if (["critical", "at_risk", "paused"].includes(v)) return "danger";
  if (["lead", "invited", "demo_scheduled", "onboarding", "medium", "high"].includes(v)) return "demo";
  if (["active_beta", "converted", "accepted", "completed", "active", "paid"].includes(v)) return "active";

  return "accent";
}

function titleCase(value = "") {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

const STAGES = ["lead", "invited", "demo_scheduled", "onboarding", "active_beta", "converted", "paused"];

const emptyForm = {
  firm_name: "",
  primary_contact: "",
  email: "",
  phone: "",
  state: "",
  segment: "Political Consultant",
  invite_status: "not_sent",
  onboarding_stage: "lead",
  demo_status: "not_scheduled",
  workspace_status: "not_started",
  billing_status: "not_started",
  launch_confidence: 50,
  priority: "medium",
  notes: "",
  feedback: "",
  next_step: "",
  demo_date: "",
};

export default function BetaOnboardingCenter() {
  const [filters, setFilters] = useState({
    q: "",
    stage: "",
    priority: "",
  });

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");

  const [data, setData] = useState({
    summary: {},
    customers: [],
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

      const result = await api.betaOnboarding(filters);

      setData({
        summary: result?.summary || {},
        customers: arr(result?.customers),
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
          "Failed to load Beta Onboarding Center."
      );
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    load();
  }, []);

  const summary = data.summary || {};
  const customers = arr(data.customers);

  const grouped = useMemo(() => {
    return STAGES.reduce((acc, stage) => {
      acc[stage] = customers.filter((customer) => customer.onboarding_stage === stage);
      return acc;
    }, {});
  }, [customers]);

  const topCustomer = useMemo(() => {
    return (
      customers.find((customer) => customer.priority === "critical") ||
      customers.find((customer) => customer.launch_confidence < 40) ||
      customers.find((customer) => customer.onboarding_stage === "onboarding") ||
      customers[0]
    );
  }, [customers]);

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

  function editCustomer(customer) {
    setEditingId(customer.id);
    setForm({
      firm_name: customer.firm_name || "",
      primary_contact: customer.primary_contact || "",
      email: customer.email || "",
      phone: customer.phone || "",
      state: customer.state || "",
      segment: customer.segment || "Political Consultant",
      invite_status: customer.invite_status || "not_sent",
      onboarding_stage: customer.onboarding_stage || "lead",
      demo_status: customer.demo_status || "not_scheduled",
      workspace_status: customer.workspace_status || "not_started",
      billing_status: customer.billing_status || "not_started",
      launch_confidence: customer.launch_confidence || 50,
      priority: customer.priority || "medium",
      notes: customer.notes || "",
      feedback: customer.feedback || "",
      next_step: customer.next_step || "",
      demo_date: customer.demo_date ? String(customer.demo_date).slice(0, 10) : "",
    });
  }

  async function submitForm(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const payload = editingId ? { ...form, id: editingId } : form;
      const result = await api.saveBetaCustomer(payload);

      setMessage(result?.message || "Beta customer saved.");
      resetForm();
      await load();
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.response?.data?.detail ||
          err?.message ||
          "Failed to save beta customer."
      );
    } finally {
      setSaving(false);
    }
  }

  async function updateStage(customer, stage) {
    try {
      setActionLoading(`stage-${customer.id}`);
      setError("");
      setMessage("");

      const result = await api.updateBetaCustomerStage(customer.id, stage);
      setMessage(result?.message || "Beta onboarding stage updated.");
      await load();
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.response?.data?.detail ||
          err?.message ||
          "Failed to update beta customer stage."
      );
    } finally {
      setActionLoading("");
    }
  }

  async function deleteCustomer(customer) {
    const ok = window.confirm(`Delete ${customer.firm_name}?`);
    if (!ok) return;

    try {
      setActionLoading(`delete-${customer.id}`);
      setError("");
      setMessage("");

      const result = await api.deleteBetaCustomer(customer.id);
      setMessage(result?.message || "Beta customer deleted.");
      await load();
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.response?.data?.detail ||
          err?.message ||
          "Failed to delete beta customer."
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
      eyebrow="Beta Customer Onboarding"
      title="Beta Onboarding Center"
      description="Manage first users and beta political firms: invites, demos, workspace setup, billing status, checklist completion, feedback, launch confidence, and conversion readiness."
      tickerItems={[
        { label: "Beta Firms", value: `${summary.total || 0}`, dotClass: "vs-live-dot-success" },
        { label: "Active Beta", value: `${summary.active_beta || 0}`, dotClass: "vs-live-dot-success" },
        { label: "Converted", value: `${summary.converted || 0}`, dotClass: "vs-live-dot-success" },
        {
          label: "Confidence",
          value: `${summary.average_confidence || 0}%`,
          dotClass:
            summary.average_confidence >= 75
              ? "vs-live-dot-success"
              : summary.average_confidence >= 45
              ? "vs-live-dot-warning"
              : "vs-live-dot",
        },
      ]}
    >
      <style>{`
        .beta-grid {
          display: grid;
          grid-template-columns: minmax(0, .72fr) minmax(0, 1.28fr);
          gap: 18px;
          align-items: start;
        }

        .beta-stack {
          display: grid;
          gap: 14px;
        }

        .beta-command {
          border-radius: 30px;
          border: 1px solid rgba(148, 163, 184, .16);
          background:
            radial-gradient(circle at top left, rgba(251, 146, 60, .18), transparent 34%),
            radial-gradient(circle at bottom right, rgba(37, 99, 235, .16), transparent 34%),
            linear-gradient(135deg, rgba(15, 23, 42, .98), rgba(2, 6, 23, .88));
          padding: 24px;
          box-shadow: 0 18px 60px rgba(0,0,0,.32);
        }

        .beta-score {
          margin-top: 14px;
          color: white;
          font-size: clamp(50px, 8vw, 92px);
          line-height: .94;
          font-weight: 950;
          letter-spacing: -.08em;
        }

        .beta-title {
          margin: 12px 0 0;
          color: white;
          font-size: 24px;
          font-weight: 950;
          letter-spacing: -.05em;
          line-height: 1.05;
        }

        .beta-sub {
          margin-top: 10px;
          color: rgba(203, 213, 225, .74);
          font-size: 13px;
          line-height: 1.65;
        }

        .beta-form {
          display: grid;
          gap: 10px;
        }

        .beta-form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .beta-form input,
        .beta-form select,
        .beta-form textarea {
          border-radius: 14px;
          border: 1px solid rgba(148, 163, 184, .16);
          background: rgba(15, 23, 42, .74);
          color: white;
          padding: 11px 12px;
          width: 100%;
        }

        .beta-form textarea {
          min-height: 90px;
          resize: vertical;
        }

        .beta-actions,
        .beta-button-row {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .beta-board {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }

        .beta-column {
          border-radius: 22px;
          border: 1px solid rgba(148, 163, 184, .16);
          background: rgba(15, 23, 42, .5);
          padding: 12px;
          min-height: 240px;
        }

        .beta-column-head {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          align-items: center;
          margin-bottom: 10px;
        }

        .beta-column-title {
          margin: 0;
          color: white;
          font-size: 14px;
          font-weight: 950;
        }

        .beta-card {
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

        .beta-card-title {
          color: white;
          font-weight: 900;
          font-size: 14px;
          line-height: 1.25;
        }

        .beta-card-sub {
          color: rgba(203, 213, 225, .72);
          font-size: 12px;
          line-height: 1.45;
        }

        .beta-card-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
        }

        .beta-mini-button {
          border-radius: 999px;
          border: 1px solid rgba(148, 163, 184, .16);
          background: rgba(15, 23, 42, .72);
          color: rgba(226, 232, 240, .88);
          font-size: 11px;
          font-weight: 800;
          padding: 7px 9px;
          cursor: pointer;
        }

        .beta-mini-button:hover {
          border-color: rgba(251, 146, 60, .38);
          background: rgba(251, 146, 60, .12);
        }

        .beta-checklist {
          display: grid;
          gap: 6px;
        }

        .beta-check {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          color: rgba(203, 213, 225, .72);
          font-size: 11px;
        }

        @media (max-width: 1180px) {
          .beta-grid,
          .beta-form-grid,
          .beta-board {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}
      {message ? <div className="vs-banner vs-banner-demo">{message}</div> : null}

      <div className="vs-grid-4">
        <StatCard label="Beta Firms" value={summary.total || 0} delta="Tracked onboarding records" tone="up" />
        <StatCard label="Demos" value={summary.demos || 0} delta="Scheduled / completed" tone="neutral" />
        <StatCard label="Avg Setup" value={`${summary.average_setup || 0}%`} delta="Checklist completion" tone={summary.average_setup >= 75 ? "up" : "neutral"} />
        <StatCard label="At Risk" value={summary.at_risk || 0} delta="Low confidence" tone={summary.at_risk ? "down" : "up"} />
      </div>

      <div className="beta-grid">
        <div className="beta-stack">
          <div className="beta-command">
            <Badge tone={tone(topCustomer?.onboarding_stage || "lead")}>
              {topCustomer ? titleCase(topCustomer.onboarding_stage) : "No Beta Firm"}
            </Badge>

            <div className="beta-score">
              {topCustomer?.launch_confidence || summary.average_confidence || 0}%
            </div>

            <h2 className="beta-title">
              {topCustomer?.firm_name || "No beta customer yet"}
            </h2>

            <div className="beta-sub">
              {topCustomer
                ? `${topCustomer.primary_contact || "Contact N/A"} • ${topCustomer.state || "State N/A"} • ${topCustomer.confidence_label}`
                : "Add beta firms to begin onboarding first political consultants."}
            </div>
          </div>

          <SectionCard title={editingId ? "Edit Beta Customer" : "Add Beta Customer"} subtitle="Track first customers from invite to converted account.">
            <form className="beta-form" onSubmit={submitForm}>
              <input required placeholder="Firm name" value={form.firm_name} onChange={(e) => updateForm("firm_name", e.target.value)} />

              <div className="beta-form-grid">
                <input placeholder="Primary contact" value={form.primary_contact} onChange={(e) => updateForm("primary_contact", e.target.value)} />
                <input placeholder="Email" value={form.email} onChange={(e) => updateForm("email", e.target.value)} />
                <input placeholder="Phone" value={form.phone} onChange={(e) => updateForm("phone", e.target.value)} />
                <input placeholder="State" value={form.state} onChange={(e) => updateForm("state", e.target.value)} />
                <input placeholder="Segment" value={form.segment} onChange={(e) => updateForm("segment", e.target.value)} />

                <select value={form.priority} onChange={(e) => updateForm("priority", e.target.value)}>
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                  <option value="critical">Critical Priority</option>
                </select>

                <select value={form.onboarding_stage} onChange={(e) => updateForm("onboarding_stage", e.target.value)}>
                  {STAGES.map((stage) => (
                    <option key={stage} value={stage}>{titleCase(stage)}</option>
                  ))}
                </select>

                <select value={form.invite_status} onChange={(e) => updateForm("invite_status", e.target.value)}>
                  <option value="not_sent">Invite Not Sent</option>
                  <option value="sent">Invite Sent</option>
                  <option value="accepted">Invite Accepted</option>
                </select>

                <select value={form.demo_status} onChange={(e) => updateForm("demo_status", e.target.value)}>
                  <option value="not_scheduled">Demo Not Scheduled</option>
                  <option value="scheduled">Demo Scheduled</option>
                  <option value="completed">Demo Completed</option>
                </select>

                <select value={form.workspace_status} onChange={(e) => updateForm("workspace_status", e.target.value)}>
                  <option value="not_started">Workspace Not Started</option>
                  <option value="created">Workspace Created</option>
                  <option value="complete">Workspace Complete</option>
                </select>

                <select value={form.billing_status} onChange={(e) => updateForm("billing_status", e.target.value)}>
                  <option value="not_started">Billing Not Started</option>
                  <option value="trial">Trial</option>
                  <option value="active">Active</option>
                  <option value="paid">Paid</option>
                </select>

                <input type="number" min="0" max="100" placeholder="Launch confidence" value={form.launch_confidence} onChange={(e) => updateForm("launch_confidence", e.target.value)} />
                <input type="date" value={form.demo_date} onChange={(e) => updateForm("demo_date", e.target.value)} />
              </div>

              <input placeholder="Next step" value={form.next_step} onChange={(e) => updateForm("next_step", e.target.value)} />
              <textarea placeholder="Notes" value={form.notes} onChange={(e) => updateForm("notes", e.target.value)} />
              <textarea placeholder="Feedback" value={form.feedback} onChange={(e) => updateForm("feedback", e.target.value)} />

              <div className="beta-actions">
                <button className="vs-button" type="submit" disabled={saving}>
                  {saving ? "Saving..." : editingId ? "Update Beta Customer" : "Create Beta Customer"}
                </button>
                {editingId ? (
                  <button className="vs-button vs-button-secondary" type="button" onClick={resetForm}>
                    Cancel Edit
                  </button>
                ) : null}
              </div>
            </form>
          </SectionCard>

          <SectionCard title="Filters" subtitle="Focus beta customers by stage, priority, or keyword.">
            <form className="beta-form" onSubmit={runSearch}>
              <input placeholder="Search beta firms..." value={filters.q} onChange={(e) => updateFilter("q", e.target.value)} />

              <div className="beta-form-grid">
                <select value={filters.stage} onChange={(e) => updateFilter("stage", e.target.value)}>
                  <option value="">All Stages</option>
                  {STAGES.map((stage) => (
                    <option key={stage} value={stage}>{titleCase(stage)}</option>
                  ))}
                </select>

                <select value={filters.priority} onChange={(e) => updateFilter("priority", e.target.value)}>
                  <option value="">All Priorities</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <button className="vs-button vs-button-secondary" type="submit">
                {loading ? "Filtering..." : "Apply Filters"}
              </button>
            </form>
          </SectionCard>
        </div>

        <SectionCard
          title="Beta Onboarding Board"
          subtitle="Move beta firms from lead to invite, demo, onboarding, active beta, converted, or paused."
          right={<Badge tone="accent">{customers.length} firms</Badge>}
        >
          {loading ? (
            <EmptyState text="Loading beta onboarding records..." />
          ) : !customers.length ? (
            <EmptyState text="No beta customers found." />
          ) : (
            <div className="beta-board">
              {STAGES.map((stage) => {
                const rows = grouped[stage] || [];

                return (
                  <div key={stage} className="beta-column">
                    <div className="beta-column-head">
                      <h3 className="beta-column-title">{titleCase(stage)}</h3>
                      <Badge tone={tone(stage)}>{rows.length}</Badge>
                    </div>

                    {!rows.length ? (
                      <EmptyState text={`No ${titleCase(stage).toLowerCase()} firms.`} />
                    ) : (
                      rows.map((customer) => (
                        <div key={customer.id} className="beta-card">
                          <div>
                            <div className="beta-card-title">{customer.firm_name}</div>
                            <div className="beta-card-sub">
                              {customer.primary_contact || "Contact N/A"} • {customer.state || "State N/A"} • {customer.segment || "Segment N/A"}
                            </div>
                          </div>

                          <div className="beta-card-meta">
                            <Badge tone={tone(customer.priority)}>{titleCase(customer.priority)}</Badge>
                            <Badge tone={tone(customer.onboarding_stage)}>{titleCase(customer.onboarding_stage)}</Badge>
                            <Badge tone={customer.launch_confidence >= 65 ? "active" : customer.launch_confidence >= 40 ? "demo" : "danger"}>
                              {customer.launch_confidence}%
                            </Badge>
                          </div>

                          <div className="beta-card-sub">
                            Setup: {customer.setup_score}% • Demo: {titleCase(customer.demo_status)} • Billing: {titleCase(customer.billing_status)}
                          </div>

                          <div className="beta-checklist">
                            {arr(customer.checklist).map((item) => (
                              <div key={item.key} className="beta-check">
                                <span>{item.complete ? "✓" : "○"} {item.label}</span>
                                <span>{titleCase(item.status)}</span>
                              </div>
                            ))}
                          </div>

                          <div className="beta-card-sub">
                            Next: {customer.next_step || "No next step assigned."}
                          </div>

                          <div className="beta-button-row">
                            <button className="beta-mini-button" onClick={() => editCustomer(customer)}>Edit</button>
                            {STAGES.filter((s) => s !== customer.onboarding_stage).slice(0, 4).map((nextStage) => (
                              <button
                                key={nextStage}
                                className="beta-mini-button"
                                disabled={actionLoading === `stage-${customer.id}`}
                                onClick={() => updateStage(customer, nextStage)}
                              >
                                {titleCase(nextStage)}
                              </button>
                            ))}
                            <button
                              className="beta-mini-button"
                              disabled={actionLoading === `delete-${customer.id}`}
                              onClick={() => deleteCustomer(customer)}
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
