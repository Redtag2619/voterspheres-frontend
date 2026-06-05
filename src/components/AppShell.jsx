import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useWorkspace } from "../context/WorkspaceContext.jsx";
import { api } from "../services/api";

const primaryItems = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Candidates", to: "/candidates" },
  { label: "War Room", to: "/war-room" },
  { label: "Command", to: "/command-center" },
  { label: "Mission Control", to: "/mission-control" },
  { label: "Strategic Advisor", to: "/strategic-advisor" },
  { label: "Campaign Co-Pilot", to: "/campaign-copilot" },
  { label: "Reports", to: "/intelligence-reports" },
  { label: "Fundraising", to: "/fundraising" },
  { label: "Vendors", to: "/vendors" },
  { label: "Consultant Intel", to: "/consultant-intel" }, 
  { label: "Workspace", to: "/campaign-workspace" },
  { label: "Executive Intel", to: "/executive-intelligence" },
  { label: "Political Signals", to: "/political-signals" },
  { label: "Signal Matching", to: "/signal-matching" },
  { label: "Narrative Response", to: "/narrative-response" },
  { label: "Task Ownership", to: "/task-ownership" },
  { label: "Client Portal", to: "/client-portal-admin" },
  { label: "Campaign CRM", to: "/campaign-crm" },
  { label: "Report Exports", to: "/report-exports" },
  { label: "National Command", to: "/national-command" },
  { label: "Committee Intel", to: "/committee-intel", }
];

const secondaryItems = [
  { label: "Map", to: "/map" },
  { label: "Forecast", to: "/forecast" },
  { label: "Donors", to: "/donors" },
  { label: "Consultants", to: "/consultants" },
  { label: "Relationship Graph", to: "/relationship-graph"},
  { label: "Dark Money", to: "/dark-money-exposure" },
  { label: "Opportunity Map", to: "/campaign-opportunity-heatmap"},
  { label: "Operations Map", to: "/operations-map" },
  { label: "MailOps", to: "/mailops" },
  { label: "Pricing", to: "/pricing" },
  { label: "Billing", to: "/billing" },
  { label: "Alerts", to: "/admin/alerts" },
  { label: "State Operations", to: "/state-operations" },
  { label: "AI Tactical", to: "/ai-tactical" },
  { label: "Narrative Intel", to: "/narrative-intelligence" },
  { label: "Live Intel", to: "/admin/live-intelligence" }
];

const emptyWorkspaceForm = {
  name: "",
  candidate_name: "",
  state: "",
  office: "",
  cycle: "2026",
  description: ""
};

function Pill({ item }) {
  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        isActive ? "vs-nav-pill vs-nav-pill-active" : "vs-nav-pill"
      }
    >
      {item.label}
    </NavLink>
  );
}

function WorkspaceModal({
  mode = "create",
  form,
  error,
  busy,
  onChange,
  onClose,
  onSubmit
}) {
  const isEdit = mode === "edit";

  return (
    <div className="vs-modal-backdrop">
      <div className="vs-modal-card">
        <div className="vs-modal-head">
          <div>
            <div className="vs-modal-eyebrow">
              {isEdit ? "Workspace Settings" : "New Client Workspace"}
            </div>
            <h3 className="vs-modal-title">
              {isEdit ? "Edit Workspace" : "Create Workspace"}
            </h3>
            <p className="vs-modal-subtitle">
              {isEdit
                ? "Update campaign workspace details for this client or race."
                : "Add a campaign workspace for a client, race, or operating team."}
            </p>
          </div>

          <button type="button" className="vs-modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        {error ? <div className="vs-modal-error">{error}</div> : null}

        <form className="vs-modal-form" onSubmit={onSubmit}>
          <label className="vs-field">
            <span>Workspace Name</span>
            <input
              value={form.name}
              onChange={(event) => onChange("name", event.target.value)}
              placeholder="Stephens for Senate"
              required
            />
          </label>

          <label className="vs-field">
            <span>Candidate Name</span>
            <input
              value={form.candidate_name}
              onChange={(event) => onChange("candidate_name", event.target.value)}
              placeholder="Mark Stephens"
            />
          </label>

          <div className="vs-modal-grid">
            <label className="vs-field">
              <span>State</span>
              <input
                value={form.state}
                onChange={(event) => onChange("state", event.target.value)}
                placeholder="Georgia"
              />
            </label>

            <label className="vs-field">
              <span>Office</span>
              <input
                value={form.office}
                onChange={(event) => onChange("office", event.target.value)}
                placeholder="U.S. Senate"
              />
            </label>
          </div>

          <label className="vs-field">
            <span>Cycle</span>
            <input
              value={form.cycle}
              onChange={(event) => onChange("cycle", event.target.value)}
              placeholder="2026"
            />
          </label>

          <label className="vs-field">
            <span>Description</span>
            <textarea
              value={form.description}
              onChange={(event) => onChange("description", event.target.value)}
              placeholder="Primary operating workspace for this campaign."
              rows={3}
            />
          </label>

          <div className="vs-modal-actions">
            <button type="button" className="vs-button vs-button-secondary" onClick={onClose}>
              Cancel
            </button>

            <button type="submit" className="vs-button" disabled={busy}>
              {busy
                ? isEdit
                  ? "Saving..."
                  : "Creating..."
                : isEdit
                  ? "Save Settings"
                  : "Create Workspace"}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .vs-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: grid;
          place-items: center;
          padding: 24px;
          background: rgba(2, 6, 23, 0.72);
          backdrop-filter: blur(10px);
        }

        .vs-modal-card {
          width: min(640px, 100%);
          border-radius: 22px;
          border: 1px solid rgba(148, 163, 184, 0.2);
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(15, 23, 42, 0.92));
          box-shadow: 0 30px 80px rgba(2, 6, 23, 0.46);
          padding: 22px;
        }

        .vs-modal-head {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: flex-start;
          margin-bottom: 18px;
        }

        .vs-modal-eyebrow {
          color: rgba(96, 165, 250, 0.95);
          font-size: 0.76rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .vs-modal-title {
          margin: 6px 0 0;
          color: rgba(248, 250, 252, 0.96);
          font-size: 1.35rem;
        }

        .vs-modal-subtitle {
          margin: 6px 0 0;
          color: rgba(148, 163, 184, 0.86);
          line-height: 1.45;
        }

        .vs-modal-close {
          width: 34px;
          height: 34px;
          border-radius: 999px;
          border: 1px solid rgba(148, 163, 184, 0.18);
          background: rgba(15, 23, 42, 0.62);
          color: rgba(248, 250, 252, 0.9);
          font-size: 1.4rem;
          cursor: pointer;
        }

        .vs-modal-error {
          margin-bottom: 14px;
          border: 1px solid rgba(248, 113, 113, 0.28);
          background: rgba(127, 29, 29, 0.18);
          color: rgba(254, 202, 202, 0.95);
          border-radius: 14px;
          padding: 10px 12px;
          font-size: 0.88rem;
        }

        .vs-modal-form {
          display: grid;
          gap: 13px;
        }

        .vs-modal-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 13px;
        }

        .vs-field {
          display: grid;
          gap: 6px;
        }

        .vs-field span {
          color: rgba(203, 213, 225, 0.86);
          font-size: 0.78rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .vs-field input,
        .vs-field textarea {
          width: 100%;
          border-radius: 14px;
          border: 1px solid rgba(148, 163, 184, 0.18);
          background: rgba(15, 23, 42, 0.68);
          color: rgba(248, 250, 252, 0.94);
          outline: none;
          padding: 11px 12px;
          font: inherit;
        }

        .vs-field input:focus,
        .vs-field textarea:focus {
          border-color: rgba(96, 165, 250, 0.5);
          box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.12);
        }

        .vs-modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 6px;
        }

        @media (max-width: 640px) {
          .vs-modal-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

export default function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const {
    workspaces,
    activeWorkspaceId,
    activeWorkspace,
    loadingWorkspaces,
    workspaceError,
    setActiveWorkspaceId,
    createWorkspace,
    refreshWorkspaces
  } = useWorkspace();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [createError, setCreateError] = useState("");
  const [settingsError, setSettingsError] = useState("");
  const [form, setForm] = useState(emptyWorkspaceForm);

  function handleWorkspaceChange(event) {
    const id = event.target.value;
    setActiveWorkspaceId(id);

    if (id) {
      navigate(`/campaign-workspace/${id}`);
    }
  }

  function updateForm(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function openCreateModal() {
    setCreateError("");
    setForm(emptyWorkspaceForm);
    setShowCreateModal(true);
  }

  function openEditModal() {
    setSettingsError("");
    setForm({
      name: activeWorkspace?.name || activeWorkspace?.campaign_name || "",
      candidate_name: activeWorkspace?.candidate_name || "",
      state: activeWorkspace?.state || "",
      office: activeWorkspace?.office || "",
      cycle: activeWorkspace?.cycle || "2026",
      description: activeWorkspace?.description || ""
    });
    setShowEditModal(true);
  }

  async function handleCreateWorkspace(event) {
    event.preventDefault();

    if (!form.name.trim()) {
      setCreateError("Workspace name is required.");
      return;
    }

    try {
      setCreating(true);
      setCreateError("");

      const workspace = await createWorkspace({
        name: form.name.trim(),
        candidate_name: form.candidate_name.trim(),
        state: form.state.trim() || "National",
        office: form.office.trim() || "Statewide",
        cycle: form.cycle.trim() || "2026",
        description: form.description.trim(),
        status: "active"
      });

      setShowCreateModal(false);
      setForm(emptyWorkspaceForm);

      if (workspace?.id) {
        navigate(`/campaign-workspace/${workspace.id}`);
      }
    } catch (error) {
      setCreateError(
        error?.response?.data?.error ||
          error?.message ||
          "Failed to create workspace."
      );
    } finally {
      setCreating(false);
    }
  }

  async function handleUpdateWorkspace(event) {
    event.preventDefault();

    if (!activeWorkspaceId) {
      setSettingsError("No active workspace selected.");
      return;
    }

    if (!form.name.trim()) {
      setSettingsError("Workspace name is required.");
      return;
    }

    try {
      setSavingSettings(true);
      setSettingsError("");

      await api.updateWorkspace(activeWorkspaceId, {
        name: form.name.trim(),
        candidate_name: form.candidate_name.trim(),
        state: form.state.trim() || "National",
        office: form.office.trim() || "Statewide",
        cycle: form.cycle.trim() || "2026",
        description: form.description.trim(),
        status: activeWorkspace?.status || "active"
      });

      await refreshWorkspaces?.();

      setShowEditModal(false);
      navigate(`/campaign-workspace/${activeWorkspaceId}`);
    } catch (error) {
      setSettingsError(
        error?.response?.data?.error ||
          error?.message ||
          "Failed to update workspace."
      );
    } finally {
      setSavingSettings(false);
    }
  }

  return (
    <div className="vs-shell">
      <header className="vs-shell-header">
        <div className="vs-shell-inner vs-shell-inner-premium">
          <div className="vs-shell-topline">
            <NavLink to="/dashboard" className="vs-brand-row">
              <div className="vs-brand-mark">VS</div>
              <div className="vs-brand-copy">
                <div className="vs-brand-name">VoterSpheres</div>
                <div className="vs-brand-tagline">Political Intelligence Platform</div>
              </div>
            </NavLink>

            <div className="vs-inline-actions">
              <div
                className="vs-workspace-switcher"
                title={workspaceError || activeWorkspace?.name || "Workspace"}
              >
                <select
                  value={activeWorkspaceId || ""}
                  onChange={handleWorkspaceChange}
                  className="vs-select"
                  disabled={loadingWorkspaces || !workspaces.length}
                >
                  {loadingWorkspaces ? (
                    <option value="">Loading workspaces...</option>
                  ) : !workspaces.length ? (
                    <option value="">No workspace</option>
                  ) : (
                    workspaces.map((workspace) => (
                      <option key={workspace.id} value={workspace.id}>
                        {workspace.name || workspace.campaign_name || `Workspace #${workspace.id}`}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <button
                type="button"
                className="vs-button vs-button-secondary"
                onClick={openCreateModal}
              >
                + Workspace
              </button>

              <button
                type="button"
                className="vs-button vs-button-secondary"
                onClick={openEditModal}
                disabled={!activeWorkspaceId}
              >
                Settings
              </button>

              <span className="vs-brand-live">
                <span className="vs-live-dot-success" />
                Live Intelligence
              </span>

              <span className="vs-user-email">{user?.email}</span>

              {typeof logout === "function" ? (
                <button type="button" className="vs-button vs-button-secondary" onClick={logout}>
                  Sign out
                </button>
              ) : null}
            </div>
          </div>

          <nav className="vs-shell-nav vs-shell-nav-premium">
            {primaryItems.map((item) => (
              <Pill key={item.to} item={item} />
            ))}

            <div className="vs-nav-divider" />

            {secondaryItems.map((item) => (
              <Pill key={item.to} item={item} />
            ))}
          </nav>
        </div>
      </header>

      <main className="vs-shell-main">
        <Outlet />
      </main>

      {showCreateModal ? (
        <WorkspaceModal
          mode="create"
          form={form}
          error={createError}
          busy={creating}
          onChange={updateForm}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateWorkspace}
        />
      ) : null}

      {showEditModal ? (
        <WorkspaceModal
          mode="edit"
          form={form}
          error={settingsError}
          busy={savingSettings}
          onChange={updateForm}
          onClose={() => setShowEditModal(false)}
          onSubmit={handleUpdateWorkspace}
        />
      ) : null}
    </div>
  );
}
