import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import ResponsiveRow from "../components/ui/ResponsiveRow";
import { useRealtimeTacticalEvents } from "../hooks/useRealtimeTacticalEvents";

function fmtNumber(value) {
  return Number(value || 0).toLocaleString();
}

function statusTone(status) {
  const value = String(status || "").toLowerCase();
  if (value === "active") return "active";
  if (value === "paused") return "warning";
  return "default";
}

function priorityTone(priority) {
  const value = String(priority || "").toLowerCase();
  if (value === "critical" || value === "high") return "danger";
  if (value === "medium") return "warning";
  return "accent";
}

function WorkspaceCard({ item, selected, onSelect }) {
  const active = selected?.id === item.id;

  return (
    <button
      type="button"
      className={`workspace-card ${active ? "is-active" : ""}`}
      onClick={() => onSelect(item)}
    >
      <div className="workspace-card-top">
        <div>
          <strong>{item.name}</strong>
          <span>
            {item.home_state || "National"} • {item.cycle || 2026} • {item.campaign_type || "general"}
          </span>
        </div>

        <Badge tone={statusTone(item.status)}>{item.status || "active"}</Badge>
      </div>

      <div className="workspace-card-grid">
        <div>
          <span>Members</span>
          <b>{fmtNumber(item.member_count || 0)}</b>
        </div>
        <div>
          <span>Targets</span>
          <b>{fmtNumber(item.target_count || 0)}</b>
        </div>
        <div>
          <span>Slug</span>
          <b>{item.slug}</b>
        </div>
      </div>
    </button>
  );
}

function TargetRow({ item }) {
  return (
    <div className="workspace-row">
      <ResponsiveRow
        title={item.race_name || item.county_name || item.state_code || "Target"}
        subtitle={`${item.target_type || "target"} • ${item.candidate_name || "No candidate assigned"}`}
        meta={[
          { label: "State", value: item.state_code || "—" },
          { label: "County", value: item.county_name || "—" },
          { label: "Priority", value: item.priority || "normal" },
        ]}
        right={<Badge tone={priorityTone(item.priority)}>{item.priority || "normal"}</Badge>}
      />
    </div>
  );
}

function MemberRow({ item }) {
  return (
    <div className="workspace-row">
      <ResponsiveRow
        title={item.email || `User ${item.user_id || ""}`}
        subtitle="Workspace member"
        meta={[
          { label: "Role", value: item.role || "member" },
          { label: "Status", value: item.status || "active" },
        ]}
        right={<Badge tone={statusTone(item.status)}>{item.status || "active"}</Badge>}
      />
    </div>
  );
}

export default function CampaignWorkspaces() {
  const [workspaces, setWorkspaces] = useState([]);
  const [selected, setSelected] = useState(null);
  const [details, setDetails] = useState(null);

  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    cycle: 2026,
    campaign_type: "general",
    home_state: "",
    description: "",
  });

  const [targetForm, setTargetForm] = useState({
    target_type: "state",
    state_code: "",
    county_name: "",
    race_name: "",
    candidate_name: "",
    priority: "normal",
  });

  async function loadWorkspaces() {
    try {
      setLoading(true);
      setError("");

      const result = await api.campaignWorkspaces();
      const rows = result?.workspaces || [];

      setWorkspaces(rows);

      setSelected((current) => {
        if (!rows.length) return null;
        if (!current) return rows[0];
        return rows.find((item) => item.id === current.id) || rows[0];
      });
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Failed to load campaign workspaces.");
    } finally {
      setLoading(false);
    }
  }

  async function loadDetails(workspace) {
    if (!workspace?.id) return;

    try {
      setDetailsLoading(true);

      const result = await api.campaignWorkspace(workspace.id);
      setDetails(result);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Failed to load workspace details.");
    } finally {
      setDetailsLoading(false);
    }
  }

  async function handleCreateWorkspace(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setMessage("");
      setError("");

      await api.createCampaignWorkspace(form);

      setMessage("Campaign workspace created.");
      setForm({
        name: "",
        cycle: 2026,
        campaign_type: "general",
        home_state: "",
        description: "",
      });

      await loadWorkspaces();
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Failed to create workspace.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddTarget(event) {
    event.preventDefault();

    if (!selected?.id) return;

    try {
      setSaving(true);
      setMessage("");
      setError("");

      await api.addCampaignWorkspaceTarget(selected.id, targetForm);

      setMessage("Workspace target added.");
      setTargetForm({
        target_type: "state",
        state_code: "",
        county_name: "",
        race_name: "",
        candidate_name: "",
        priority: "normal",
      });

      await loadWorkspaces();
      await loadDetails(selected);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Failed to add target.");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    loadWorkspaces();
  }, []);

  useEffect(() => {
    if (selected) loadDetails(selected);
  }, [selected?.id]);

  const members = details?.members || [];
  const targets = details?.targets || [];
  const selectedWorkspace = details?.workspace || selected;

  const summary = useMemo(() => {
    return {
      workspaces: workspaces.length,
      active: workspaces.filter((item) => item.status === "active").length,
      targets: workspaces.reduce((sum, item) => sum + Number(item.target_count || 0), 0),
      members: workspaces.reduce((sum, item) => sum + Number(item.member_count || 0), 0),
    };
  }, [workspaces]);

  return (
    <PageShell
      eyebrow="Campaign Workspace System"
      title="Campaign Workspaces"
      description="Create campaign-specific workspaces for races, states, counties, candidates, users, vendors, MailOps, fundraising, and operational tasking."
      tickerItems={[
        { label: "Workspaces", value: `${summary.workspaces}`, dotClass: "vs-live-dot-success" },
        { label: "Active", value: `${summary.active}`, dotClass: "vs-live-dot-success" },
        { label: "Targets", value: `${summary.targets}`, dotClass: "vs-live-dot-warning" },
        { label: "Members", value: `${summary.members}`, dotClass: "vs-live-dot-success" },
      ]}
    >
      <style>{`
        .workspace-layout {
          display: grid;
          grid-template-columns: minmax(320px, 0.8fr) minmax(0, 1.2fr);
          gap: 18px;
          align-items: start;
        }

        .workspace-stack {
          display: grid;
          gap: 14px;
        }

        .workspace-card {
          border-radius: 22px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          background:
            radial-gradient(circle at top right, rgba(59, 130, 246, 0.12), transparent 34%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.84), rgba(2, 6, 23, 0.64));
          padding: 16px;
          text-align: left;
          cursor: pointer;
          transition: transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
        }

        .workspace-card:hover {
          transform: translateY(-2px);
          border-color: rgba(96, 165, 250, 0.44);
        }

        .workspace-card.is-active {
          border-color: rgba(96, 165, 250, 0.66);
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
        }

        .workspace-card-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
        }

        .workspace-card-top strong {
          display: block;
          color: white;
          font-size: 17px;
          font-weight: 950;
        }

        .workspace-card-top span {
          display: block;
          margin-top: 5px;
          color: rgba(203, 213, 225, 0.66);
          font-size: 12px;
        }

        .workspace-card-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
          margin-top: 14px;
        }

        .workspace-card-grid div,
        .workspace-form-card {
          border-radius: 16px;
          border: 1px solid rgba(148, 163, 184, 0.12);
          background: rgba(15, 23, 42, 0.52);
          padding: 12px;
        }

        .workspace-card-grid span {
          display: block;
          color: rgba(203, 213, 225, 0.62);
          font-size: 11px;
        }

        .workspace-card-grid b {
          display: block;
          margin-top: 4px;
          color: white;
          font-size: 14px;
          overflow-wrap: anywhere;
        }

        .workspace-form {
          display: grid;
          gap: 10px;
        }

        .workspace-form input,
        .workspace-form select,
        .workspace-form textarea {
          width: 100%;
          border-radius: 14px;
          border: 1px solid rgba(148, 163, 184, 0.18);
          background: rgba(15, 23, 42, 0.76);
          color: white;
          padding: 11px 12px;
          outline: none;
        }

        .workspace-form textarea {
          min-height: 86px;
          resize: vertical;
        }

        .workspace-form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .workspace-row {
          border-radius: 18px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.74), rgba(15, 23, 42, 0.44));
          overflow: hidden;
        }

        .workspace-row .vs-responsive-row {
          border: 0;
          background: transparent;
        }

        .workspace-message {
          border-radius: 16px;
          border: 1px solid rgba(96, 165, 250, 0.24);
          background: rgba(37, 99, 235, 0.14);
          color: rgba(226, 232, 240, 0.92);
          padding: 12px;
          margin-bottom: 14px;
        }

        @media (max-width: 1050px) {
          .workspace-layout,
          .workspace-form-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}
      {message ? <div className="workspace-message">{message}</div> : null}

      <div className="vs-grid-4">
        <StatCard label="Workspaces" value={summary.workspaces} delta="Campaign operating rooms" tone="up" />
        <StatCard label="Active" value={summary.active} delta="Live workspaces" tone="up" />
        <StatCard label="Targets" value={summary.targets} delta="States, races, counties" tone="neutral" />
        <StatCard label="Members" value={summary.members} delta="Workspace users" tone="up" />
      </div>

      <div className="workspace-layout">
        <div className="workspace-stack">
          <SectionCard
            title="Workspace List"
            subtitle="Select a campaign workspace to inspect."
            right={<Badge tone="accent">{workspaces.length} total</Badge>}
          >
            {loading ? (
              <EmptyState text="Loading campaign workspaces..." />
            ) : !workspaces.length ? (
              <EmptyState text="No campaign workspaces created yet." />
            ) : (
              <div className="workspace-stack">
                {workspaces.map((item) => (
                  <WorkspaceCard
                    key={item.id}
                    item={item}
                    selected={selectedWorkspace}
                    onSelect={setSelected}
                  />
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Create Workspace" subtitle="Create a campaign operating room.">
            <form className="workspace-form" onSubmit={handleCreateWorkspace}>
              <input
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Workspace name"
                required
              />

              <div className="workspace-form-grid">
                <input
                  type="number"
                  value={form.cycle}
                  onChange={(event) => setForm((current) => ({ ...current, cycle: Number(event.target.value) }))}
                  placeholder="Cycle"
                />

                <input
                  value={form.home_state}
                  onChange={(event) => setForm((current) => ({ ...current, home_state: event.target.value.toUpperCase() }))}
                  placeholder="Home state, e.g. GA"
                  maxLength={2}
                />
              </div>

              <select
                value={form.campaign_type}
                onChange={(event) => setForm((current) => ({ ...current, campaign_type: event.target.value }))}
              >
                <option value="general">General</option>
                <option value="primary">Primary</option>
                <option value="runoff">Runoff</option>
                <option value="issue">Issue Advocacy</option>
                <option value="independent_expenditure">Independent Expenditure</option>
              </select>

              <textarea
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                placeholder="Description"
              />

              <button type="submit" className="vs-button" disabled={saving}>
                {saving ? "Saving..." : "Create Workspace"}
              </button>
            </form>
          </SectionCard>
        </div>

        <div className="workspace-stack">
          <SectionCard
            title={selectedWorkspace ? selectedWorkspace.name : "Workspace Detail"}
            subtitle="Campaign workspace command profile."
            right={selectedWorkspace ? <Badge tone={statusTone(selectedWorkspace.status)}>{selectedWorkspace.status}</Badge> : null}
          >
            {!selectedWorkspace ? (
              <EmptyState text="Select or create a workspace." />
            ) : detailsLoading ? (
              <EmptyState text="Loading workspace detail..." />
            ) : (
              <div className="workspace-stack">
                <div className="workspace-card-grid">
                  <div><span>Cycle</span><b>{selectedWorkspace.cycle || 2026}</b></div>
                  <div><span>Type</span><b>{selectedWorkspace.campaign_type || "general"}</b></div>
                  <div><span>Home State</span><b>{selectedWorkspace.home_state || "National"}</b></div>
                </div>

                <div className="workspace-form-card">
                  <div style={{ color: "white", fontWeight: 900, marginBottom: 6 }}>
                    Description
                  </div>
                  <div style={{ color: "rgba(203,213,225,0.72)", fontSize: 13 }}>
                    {selectedWorkspace.description || "No description yet."}
                  </div>
                </div>
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Workspace Targets"
            subtitle="States, counties, races, and candidates attached to this workspace."
            right={<Badge tone="accent">{targets.length} targets</Badge>}
          >
            {!selectedWorkspace ? (
              <EmptyState text="Select a workspace first." />
            ) : (
              <div className="workspace-stack">
                <form className="workspace-form" onSubmit={handleAddTarget}>
                  <div className="workspace-form-grid">
                    <select
                      value={targetForm.target_type}
                      onChange={(event) => setTargetForm((current) => ({ ...current, target_type: event.target.value }))}
                    >
                      <option value="state">State</option>
                      <option value="county">County / Parish</option>
                      <option value="race">Race</option>
                      <option value="candidate">Candidate</option>
                    </select>

                    <select
                      value={targetForm.priority}
                      onChange={(event) => setTargetForm((current) => ({ ...current, priority: event.target.value }))}
                    >
                      <option value="normal">Normal</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>

                  <div className="workspace-form-grid">
                    <input
                      value={targetForm.state_code}
                      onChange={(event) => setTargetForm((current) => ({ ...current, state_code: event.target.value.toUpperCase() }))}
                      placeholder="State code"
                      maxLength={2}
                    />

                    <input
                      value={targetForm.county_name}
                      onChange={(event) => setTargetForm((current) => ({ ...current, county_name: event.target.value }))}
                      placeholder="County / Parish"
                    />
                  </div>

                  <input
                    value={targetForm.race_name}
                    onChange={(event) => setTargetForm((current) => ({ ...current, race_name: event.target.value }))}
                    placeholder="Race name"
                  />

                  <input
                    value={targetForm.candidate_name}
                    onChange={(event) => setTargetForm((current) => ({ ...current, candidate_name: event.target.value }))}
                    placeholder="Candidate name"
                  />

                  <button type="submit" className="vs-button" disabled={saving}>
                    {saving ? "Saving..." : "Add Target"}
                  </button>
                </form>

                {!targets.length ? (
                  <EmptyState text="No targets attached yet." />
                ) : (
                  targets.map((item) => <TargetRow key={item.id} item={item} />)
                )}
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Workspace Members"
            subtitle="Users attached to this campaign workspace."
            right={<Badge tone="accent">{members.length} members</Badge>}
          >
            {!members.length ? (
              <EmptyState text="No members attached yet." />
            ) : (
              <div className="workspace-stack">
                {members.map((item) => <MemberRow key={item.id} item={item} />)}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </PageShell>
  );
}
