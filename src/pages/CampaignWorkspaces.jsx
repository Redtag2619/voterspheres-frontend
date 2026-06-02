import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";

import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import ResponsiveRow from "../components/ui/ResponsiveRow";

const emptyForm = {
  name: "",
  candidate_name: "",
  state: "",
  office: "",
  cycle: "2026",
  status: "active",
  description: "",
};

function fmt(value) {
  return Number(value || 0).toLocaleString();
}

function statusTone(value) {
  const status = String(value || "").toLowerCase();
  if (status === "active") return "active";
  if (status === "paused") return "demo";
  return "default";
}

function riskTone(value) {
  const risk = String(value || "").toLowerCase();
  if (risk === "critical" || risk === "high") return "danger";
  if (risk === "elevated") return "demo";
  if (risk === "stable") return "active";
  return "accent";
}

function getOpenTasks(item = {}) {
  return Number(item.open_task_count || item.open_tasks || 0);
}

function getCompleteTasks(item = {}) {
  return Number(item.complete_task_count || item.completed_task_count || item.completed_tasks || 0);
}

function getTotalTasks(item = {}) {
  return Number(item.task_count || item.total_tasks || getOpenTasks(item) + getCompleteTasks(item));
}

function WorkspaceRow({ item, selectedId, onSelect }) {
  const selected = String(selectedId || "") === String(item.id || "");
  const openTasks = getOpenTasks(item);
  const completeTasks = getCompleteTasks(item);
  const totalTasks = getTotalTasks(item);
  const completion = totalTasks ? Math.round((completeTasks / totalTasks) * 100) : 0;

  return (
    <button
      type="button"
      className={`cw-row ${selected ? "is-selected" : ""}`}
      onClick={() => onSelect(item)}
    >
      <ResponsiveRow
        title={item.name || "Campaign Workspace"}
        subtitle={`${item.state || "National"} • ${item.office || "Statewide"} • ${item.cycle || "2026"}`}
        meta={[
          { label: "Candidate", value: item.candidate_name || "Not set" },
          { label: "Open", value: openTasks },
          { label: "Complete", value: completeTasks },
          { label: "Completion", value: `${completion}%` },
        ]}
        right={<Badge tone={statusTone(item.status)}>{item.status || "active"}</Badge>}
      />
    </button>
  );
}

export default function CampaignWorkspaces() {
  const [workspaces, setWorkspaces] = useState([]);
  const [selected, setSelected] = useState(null);
  const [intelligence, setIntelligence] = useState(null);

  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(false);

  const [loading, setLoading] = useState(true);
  const [loadingIntel, setLoadingIntel] = useState(false);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function load() {
    try {
      setLoading(true);
      setError("");

      const result =
        typeof api.workspaces === "function"
          ? await api.workspaces()
          : await api.campaignWorkspaces();

      const rows =
        result?.results ||
        result?.workspaces ||
        result?.items ||
        (Array.isArray(result) ? result : []);

      setWorkspaces(rows);

      setSelected((current) => {
        if (!rows.length) return null;
        if (current?.id) {
          return rows.find((item) => String(item.id) === String(current.id)) || rows[0];
        }
        return rows[0];
      });
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Failed to load campaign workspaces.");
      setWorkspaces([]);
      setSelected(null);
    } finally {
      setLoading(false);
    }
  }

  async function loadIntelligence(workspace) {
    if (!workspace?.id) {
      setIntelligence(null);
      return;
    }

    try {
      setLoadingIntel(true);

      if (typeof api.workspaceIntelligence === "function") {
        const result = await api.workspaceIntelligence(workspace.id);
        setIntelligence(result);
      } else {
        setIntelligence(null);
      }
    } catch {
      setIntelligence(null);
    } finally {
      setLoadingIntel(false);
    }
  }

  function startCreate() {
    setEditing(false);
    setForm(emptyForm);
    setMessage("");
    setError("");
  }

  function startEdit() {
    if (!selected) return;

    setEditing(true);
    setForm({
      name: selected.name || "",
      candidate_name: selected.candidate_name || "",
      state: selected.state || "",
      office: selected.office || "",
      cycle: selected.cycle || "2026",
      status: selected.status || "active",
      description: selected.description || "",
    });
    setMessage("");
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.name.trim()) {
      setError("Workspace name is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const payload = {
        name: form.name.trim(),
        candidate_name: form.candidate_name.trim(),
        state: form.state.trim() || "National",
        office: form.office.trim() || "Statewide",
        cycle: form.cycle.trim() || "2026",
        status: form.status || "active",
        description: form.description.trim(),
      };

      if (editing && selected?.id) {
        if (typeof api.updateWorkspace === "function") {
          await api.updateWorkspace(selected.id, payload);
        } else {
          await api.updateCampaignWorkspace(selected.id, payload);
        }

        setMessage("Workspace updated.");
      } else {
        if (typeof api.createWorkspace === "function") {
          await api.createWorkspace(payload);
        } else {
          await api.createCampaignWorkspace(payload);
        }

        setMessage("Workspace created.");
      }

      setForm(emptyForm);
      setEditing(false);
      await load();
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Failed to save workspace.");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    loadIntelligence(selected);
  }, [selected?.id]);

  const summary = useMemo(() => {
    const totalTasks = workspaces.reduce((sum, item) => sum + getTotalTasks(item), 0);
    const openTasks = workspaces.reduce((sum, item) => sum + getOpenTasks(item), 0);
    const completeTasks = workspaces.reduce((sum, item) => sum + getCompleteTasks(item), 0);
    const active = workspaces.filter((item) => String(item.status || "").toLowerCase() === "active").length;

    return {
      total: workspaces.length,
      active,
      totalTasks,
      openTasks,
      completeTasks,
    };
  }, [workspaces]);

  const intelSummary = intelligence?.summary || {};

  return (
    <PageShell
      eyebrow="Campaign Workspace System"
      title="Campaign Workspaces"
      description="Manage campaign workspaces, workspace-scoped tasking, and campaign intelligence."
      tickerItems={[
        { label: "Workspaces", value: `${summary.total}`, dotClass: "vs-live-dot-success" },
        { label: "Active", value: `${summary.active}`, dotClass: "vs-live-dot-success" },
        { label: "Open Tasks", value: `${summary.openTasks}`, dotClass: summary.openTasks ? "vs-live-dot-warning" : "vs-live-dot-success" },
        { label: "Complete", value: `${summary.completeTasks}`, dotClass: "vs-live-dot-success" },
      ]}
    >
      <style>{`
        .cw-layout {
          display: grid;
          grid-template-columns: minmax(340px, 0.85fr) minmax(0, 1.15fr);
          gap: 18px;
          align-items: start;
        }

        .cw-stack {
          display: grid;
          gap: 14px;
        }

        .cw-row {
          width: 100%;
          text-align: left;
          border-radius: 20px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          background:
            radial-gradient(circle at top right, rgba(59, 130, 246, 0.1), transparent 34%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.78), rgba(2, 6, 23, 0.56));
          overflow: hidden;
          cursor: pointer;
        }

        .cw-row.is-selected {
          border-color: rgba(96, 165, 250, 0.62);
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
        }

        .cw-row .vs-responsive-row {
          border: 0;
          background: transparent;
        }

        .cw-form {
          display: grid;
          gap: 11px;
        }

        .cw-form input,
        .cw-form select,
        .cw-form textarea {
          width: 100%;
          border-radius: 14px;
          border: 1px solid rgba(148, 163, 184, 0.18);
          background: rgba(15, 23, 42, 0.74);
          color: white;
          padding: 11px 12px;
          outline: none;
        }

        .cw-form textarea {
          min-height: 88px;
          resize: vertical;
        }

        .cw-form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 11px;
        }

        .cw-detail-card {
          border-radius: 24px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          background:
            radial-gradient(circle at top right, rgba(37, 99, 235, 0.14), transparent 36%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.86), rgba(2, 6, 23, 0.68));
          padding: 20px;
        }

        .cw-detail-top {
          display: flex;
          justify-content: space-between;
          gap: 14px;
          align-items: flex-start;
        }

        .cw-detail-top h3 {
          margin: 0;
          color: white;
          font-size: 24px;
          font-weight: 950;
          letter-spacing: -0.04em;
        }

        .cw-detail-top p {
          margin: 6px 0 0;
          color: rgba(203, 213, 225, 0.68);
          font-size: 13px;
        }

        .cw-mini-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
          margin-top: 18px;
        }

        .cw-mini-grid div {
          border-radius: 16px;
          border: 1px solid rgba(148, 163, 184, 0.13);
          background: rgba(2, 6, 23, 0.32);
          padding: 12px;
        }

        .cw-mini-grid span {
          display: block;
          color: rgba(203, 213, 225, 0.64);
          font-size: 11px;
          font-weight: 800;
        }

        .cw-mini-grid b {
          display: block;
          margin-top: 5px;
          color: white;
          font-size: 20px;
        }

        .cw-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 18px;
        }

        .cw-message {
          border-radius: 16px;
          border: 1px solid rgba(96, 165, 250, 0.24);
          background: rgba(37, 99, 235, 0.14);
          color: rgba(226, 232, 240, 0.92);
          padding: 12px;
          margin-bottom: 14px;
        }

        @media (max-width: 1100px) {
          .cw-layout,
          .cw-form-grid,
          .cw-mini-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}
      {message ? <div className="cw-message">{message}</div> : null}

      <div className="vs-grid-4">
        <StatCard label="Workspaces" value={fmt(summary.total)} delta="Campaign operating rooms" tone="up" />
        <StatCard label="Active" value={fmt(summary.active)} delta="Live campaign workspaces" tone="up" />
        <StatCard label="Open Tasks" value={fmt(summary.openTasks)} delta="Workspace execution load" tone={summary.openTasks ? "neutral" : "up"} />
        <StatCard label="Completed" value={fmt(summary.completeTasks)} delta="Closed workspace tasks" tone="up" />
      </div>

      <div className="cw-layout">
        <div className="cw-stack">
          <SectionCard
            title="Workspace List"
            subtitle="Select a campaign workspace to inspect or manage."
            right={<Badge tone="accent">{workspaces.length} total</Badge>}
          >
            {loading ? (
              <EmptyState text="Loading campaign workspaces..." />
            ) : !workspaces.length ? (
              <EmptyState text="No campaign workspaces created yet." />
            ) : (
              <div className="cw-stack">
                {workspaces.map((item) => (
                  <WorkspaceRow
                    key={item.id}
                    item={item}
                    selectedId={selected?.id}
                    onSelect={setSelected}
                  />
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard
            title={editing ? "Edit Workspace" : "Create Workspace"}
            subtitle={editing ? "Update selected workspace details." : "Create a new campaign operating room."}
            right={
              editing ? (
                <button type="button" className="vs-button vs-button-secondary" onClick={startCreate}>
                  New
                </button>
              ) : null
            }
          >
            <form className="cw-form" onSubmit={handleSubmit}>
              <input
                value={form.name}
                onChange={(event) => updateForm("name", event.target.value)}
                placeholder="Workspace name"
                required
              />

              <input
                value={form.candidate_name}
                onChange={(event) => updateForm("candidate_name", event.target.value)}
                placeholder="Candidate name"
              />

              <div className="cw-form-grid">
                <input
                  value={form.state}
                  onChange={(event) => updateForm("state", event.target.value)}
                  placeholder="State, e.g. GA or National"
                />

                <input
                  value={form.office}
                  onChange={(event) => updateForm("office", event.target.value)}
                  placeholder="Office, e.g. U.S. Senate"
                />
              </div>

              <div className="cw-form-grid">
                <input
                  value={form.cycle}
                  onChange={(event) => updateForm("cycle", event.target.value)}
                  placeholder="Cycle"
                />

                <select
                  value={form.status}
                  onChange={(event) => updateForm("status", event.target.value)}
                >
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <textarea
                value={form.description}
                onChange={(event) => updateForm("description", event.target.value)}
                placeholder="Workspace description"
              />

              <button type="submit" className="vs-button" disabled={saving}>
                {saving ? "Saving..." : editing ? "Save Workspace" : "Create Workspace"}
              </button>
            </form>
          </SectionCard>
        </div>

        <div className="cw-stack">
          <SectionCard
            title="Workspace Intelligence"
            subtitle="Workspace-scoped operational pressure, tasking, and execution status."
            right={selected ? <Badge tone={statusTone(selected.status)}>{selected.status || "active"}</Badge> : null}
          >
            {!selected ? (
              <EmptyState text="Select a workspace to inspect." />
            ) : (
              <div className="cw-detail-card">
                <div className="cw-detail-top">
                  <div>
                    <h3>{selected.name}</h3>
                    <p>
                      {selected.state || "National"} • {selected.office || "Statewide"} • {selected.cycle || "2026"}
                    </p>
                  </div>

                  <Badge tone={riskTone(intelSummary.risk)}>{intelSummary.risk || "Workspace"}</Badge>
                </div>

                <div className="cw-mini-grid">
                  <div>
                    <span>Pressure</span>
                    <b>{loadingIntel ? "..." : `${intelSummary.pressure_score || 0}%`}</b>
                  </div>
                  <div>
                    <span>Open</span>
                    <b>{loadingIntel ? "..." : fmt(intelSummary.open_tasks || getOpenTasks(selected))}</b>
                  </div>
                  <div>
                    <span>Completed</span>
                    <b>{loadingIntel ? "..." : fmt(intelSummary.completed_tasks || getCompleteTasks(selected))}</b>
                  </div>
                  <div>
                    <span>County Esc.</span>
                    <b>{loadingIntel ? "..." : fmt(intelSummary.active_county_escalations || 0)}</b>
                  </div>
                </div>

                <div className="cw-actions">
                  <Link className="vs-button" to={`/campaign-workspace/${selected.id}`}>
                    Open Workspace
                  </Link>

                  <Link className="vs-button vs-button-secondary" to="/command-center">
                    Command Center
                  </Link>

                  <button type="button" className="vs-button vs-button-secondary" onClick={startEdit}>
                    Edit
                  </button>

                  <button type="button" className="vs-button vs-button-secondary" onClick={load}>
                    Refresh
                  </button>
                </div>
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Recent Workspace Tasks"
            subtitle="Latest tasks returned by the workspace intelligence engine."
          >
            {!intelligence?.tasks?.length ? (
              <EmptyState text="No workspace intelligence tasks loaded yet." />
            ) : (
              <div className="cw-stack">
                {intelligence.tasks.slice(0, 8).map((task) => (
                  <div className="cw-row" key={task.id}>
                    <ResponsiveRow
                      title={task.title || "Workspace task"}
                      subtitle={task.description || task.source || "Command Center"}
                      meta={[
                        { label: "Status", value: task.status || "open" },
                        { label: "Priority", value: task.priority || "medium" },
                        { label: "State", value: task.state || "National" },
                        { label: "Owner", value: task.assigned_to || "Command Team" },
                      ]}
                      right={<Badge tone={riskTone(task.priority)}>{task.priority || "medium"}</Badge>}
                    />
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </PageShell>
  );
}
