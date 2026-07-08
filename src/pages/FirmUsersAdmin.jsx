import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import StatCard from "../components/ui/StatCard";
import ResponsiveRow from "../components/ui/ResponsiveRow";
import ExecutivePageNav from "../components/ui/ExecutivePageNav";
import CollapsibleSection from "../components/ui/CollapsibleSection";
import BackToTopButton from "../components/ui/BackToTopButton";
import ShowMoreList from "../components/ui/ShowMoreList";
import { api } from "../services/api";

const ROLE_OPTIONS = ["user", "analyst", "strategist", "mailops", "admin"];

function formatDateTime(value) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function fmt(value) {
  return Number(value || 0).toLocaleString();
}

function roleTone(role) {
  const value = String(role || "").toLowerCase();
  if (value === "admin") return "danger";
  if (value === "strategist") return "accent";
  if (value === "analyst") return "info";
  if (value === "mailops") return "warning";
  return "default";
}

function buildSummary(users = []) {
  const roles = ROLE_OPTIONS.reduce((acc, role) => {
    acc[role] = users.filter((user) => String(user.role || "").toLowerCase() === role).length;
    return acc;
  }, {});

  return {
    total: users.length,
    active: users.filter((user) => Boolean(user.is_active)).length,
    inactive: users.filter((user) => !Boolean(user.is_active)).length,
    admins: roles.admin || 0,
    strategists: roles.strategist || 0,
    analysts: roles.analyst || 0,
    mailops: roles.mailops || 0,
    standard: roles.user || 0,
    roles,
  };
}

function FirmUsersExecutiveHeader({ summary, loading, lastUpdated, onRefresh }) {
  const readinessScore = Math.max(
    5,
    Math.min(
      100,
      Math.round(
        70 +
          Math.min(10, summary.active * 2) +
          Math.min(10, summary.admins * 4) +
          Math.min(8, summary.strategists * 3) +
          Math.min(6, summary.analysts * 2) -
          Math.min(20, summary.inactive * 4) -
          (loading ? 6 : 0)
      )
    )
  );

  return (
    <div className="users-exec-ribbon" id="users-overview">
      <div className="users-exec-copy">
        <span>Firm Workforce Readiness</span>
        <strong>{readinessScore}% Ready</strong>
        <p>
          Executive administration center for firm users, role coverage, active access,
          password resets, workspace permissions, and operational staffing posture.
        </p>

        <div className="users-exec-badges">
          <Badge tone="active">{summary.active} Active</Badge>
          <Badge tone={summary.inactive ? "demo" : "active"}>{summary.inactive} Inactive</Badge>
          <Badge tone="danger">{summary.admins} Admins</Badge>
          <Badge tone="accent">{summary.strategists} Strategists</Badge>
          <Badge tone="info">{summary.analysts} Analysts</Badge>
          <Badge tone="warning">{summary.mailops} MailOps</Badge>
        </div>
      </div>

      <div className="users-exec-grid">
        <div>
          <span>Total Users</span>
          <strong>{fmt(summary.total)}</strong>
        </div>
        <div>
          <span>Role Coverage</span>
          <strong>{Object.values(summary.roles).filter(Boolean).length}/5</strong>
        </div>
        <div>
          <span>Access Status</span>
          <strong>{loading ? "Refreshing" : "Ready"}</strong>
        </div>
        <div>
          <span>Updated</span>
          <strong>{lastUpdated || "Ready"}</strong>
        </div>
      </div>

      <div className="users-exec-actions">
        <button type="button" onClick={onRefresh} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh Team"}
        </button>
        <button
          type="button"
          onClick={() =>
            document
              .getElementById("users-add")
              ?.scrollIntoView({ behavior: "smooth", block: "start" })
          }
        >
          Add User
        </button>
        <Link to="/client-portal-admin">Client Portal</Link>
        <Link to="/mission-control">Mission Control</Link>
        <Link to="/campaign-crm">Campaign CRM</Link>
        <Link to="/command-center">Command Center</Link>
      </div>

      <div className="users-exec-footer">
        <span>Access model: Admin, Strategist, Analyst, MailOps, User</span>
        <span>Security workflow: reset password, enable, disable</span>
      </div>
    </div>
  );
}

function WorkforceBrief({ summary, users }) {
  const adminWarning = summary.admins === 0;
  const inactiveWarning = summary.inactive > 0;
  const newestUser = [...users]
    .filter((user) => user.created_at)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];

  return (
    <div className="users-ai-brief">
      <strong>Executive Workforce Brief</strong>
      <p>
        This firm currently has {fmt(summary.total)} users, including {fmt(summary.active)}
        active accounts and {fmt(summary.inactive)} inactive accounts.
        {adminWarning
          ? " No administrator account is visible in this list, which should be reviewed immediately."
          : ` Administrative coverage is present with ${fmt(summary.admins)} admin account${summary.admins === 1 ? "" : "s"}.`}
        {inactiveWarning
          ? ` ${fmt(summary.inactive)} inactive account${summary.inactive === 1 ? "" : "s"} should be reviewed for access hygiene.`
          : " No inactive account backlog is currently visible."}
        {newestUser
          ? ` Most recently created user: ${newestUser.first_name || ""} ${newestUser.last_name || ""}.`
          : ""}
      </p>

      <div className="users-ai-brief-grid">
        <div><span>Admins</span><b>{fmt(summary.admins)}</b></div>
        <div><span>Strategists</span><b>{fmt(summary.strategists)}</b></div>
        <div><span>Analysts</span><b>{fmt(summary.analysts)}</b></div>
        <div><span>MailOps</span><b>{fmt(summary.mailops)}</b></div>
      </div>
    </div>
  );
}

function RoleDistribution({ summary }) {
  return (
    <div className="users-role-grid">
      {ROLE_OPTIONS.map((role) => (
        <div key={role} className="users-role-card">
          <span>{role}</span>
          <strong>{fmt(summary.roles[role] || 0)}</strong>
          <Badge tone={roleTone(role)}>{role}</Badge>
        </div>
      ))}
    </div>
  );
}

function UserRow({ user, onUpdateUser, onResetPassword }) {
  const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email || "Firm User";

  return (
    <div className="users-row">
      <ResponsiveRow
        title={fullName}
        subtitle={user.email || "No email"}
        meta={[
          { label: "Role", value: user.role || "user" },
          { label: "Status", value: user.is_active ? "active" : "inactive" },
          { label: "Created", value: formatDateTime(user.created_at) },
          { label: "Firm ID", value: user.firm_id || "N/A" },
        ]}
        right={
          <div className="users-actions">
            <Badge tone={roleTone(user.role)}>{user.role || "user"}</Badge>
            <Badge tone={user.is_active ? "active" : "default"}>
              {user.is_active ? "active" : "inactive"}
            </Badge>
          </div>
        }
      />

      <div className="users-controls">
        <select
          className="vs-select"
          defaultValue={user.role || "user"}
          onChange={(event) =>
            onUpdateUser(user.id, {
              role: event.target.value,
              is_active: Boolean(user.is_active),
            })
          }
        >
          <option value="admin">Admin</option>
          <option value="strategist">Strategist</option>
          <option value="analyst">Analyst</option>
          <option value="mailops">MailOps</option>
          <option value="user">User</option>
        </select>

        <button
          type="button"
          className="vs-button vs-button-secondary"
          onClick={() =>
            onUpdateUser(user.id, {
              role: user.role,
              is_active: !user.is_active,
            })
          }
        >
          {user.is_active ? "Disable" : "Enable"}
        </button>

        <button
          type="button"
          className="vs-button vs-button-secondary"
          onClick={() => onResetPassword(user)}
        >
          Reset Password
        </button>
      </div>
    </div>
  );
}

function AdminActionCenter({ loading, onRefresh }) {
  return (
    <div className="users-action-center">
      <button type="button" onClick={onRefresh} disabled={loading}>
        Refresh Firm Users
      </button>
      <button
        type="button"
        onClick={() =>
          document
            .getElementById("users-add")
            ?.scrollIntoView({ behavior: "smooth", block: "start" })
        }
      >
        Add Firm User
      </button>
      <Link to="/client-portal-admin">Client Portal Admin</Link>
      <Link to="/enterprise-leads">Enterprise Leads</Link>
      <Link to="/billing">Billing</Link>
      <Link to="/mission-control">Mission Control</Link>
      <Link to="/campaign-crm">Campaign CRM</Link>
      <Link to="/command-center">Command Center</Link>
      <Link to="/ai-war-room">AI War Room</Link>
    </div>
  );
}

export default function FirmUsersAdmin() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    role: "user",
  });

  async function loadUsers() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/firm-users");
      setUsers(response?.data?.results || []);
      setLastUpdated(
        new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to load firm users"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function handleCreateUser(event) {
    event.preventDefault();

    try {
      setError("");
      setMessage("");

      await api.post("/firm-users", form);

      setForm({
        first_name: "",
        last_name: "",
        email: "",
        password: "",
        role: "user",
      });

      setMessage("Firm user created.");
      await loadUsers();
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to create firm user"
      );
    }
  }

  async function handleUpdateUser(userId, payload) {
    try {
      setError("");
      setMessage("");

      await api.patch(`/firm-users/${userId}`, payload);
      setMessage("Firm user updated.");
      await loadUsers();
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to update firm user"
      );
    }
  }

  async function handleResetPassword(user) {
    try {
      setError("");
      setMessage("");

      const res = await api.post(`/firm-users/${user.id}/send-password-reset`);

      if (res?.data?.email_sent) {
        setMessage(`Reset email sent to ${user.email}`);
      } else if (res?.data?.reset_link) {
        setMessage(`Manual reset link: ${res.data.reset_link}`);
      } else {
        setMessage("Password reset triggered.");
      }
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to send reset"
      );
    }
  }

  const summary = useMemo(() => buildSummary(users), [users]);

  const navSections = [
    { id: "users-overview", label: "Overview" },
    { id: "users-metrics", label: "Metrics" },
    { id: "users-team", label: "Firm Team", badge: users.length },
    { id: "users-add", label: "Add User" },
    { id: "users-workforce", label: "Workforce" },
    { id: "users-actions", label: "Actions" },
  ];

  return (
    <PageShell
      eyebrow="Admin"
      title="Firm Users"
      description="Manage users, roles, activation, password resets, and executive access coverage inside your firm workspace."
      tickerItems={[
        { label: "Users", value: `${summary.total}`, dotClass: "vs-live-dot-success" },
        { label: "Active", value: `${summary.active}`, dotClass: "vs-live-dot-success" },
        { label: "Admins", value: `${summary.admins}`, dotClass: summary.admins ? "vs-live-dot-success" : "vs-live-dot-warning" },
        { label: "Updated", value: lastUpdated || "Ready", dotClass: "vs-live-dot-success" },
      ]}
    >
      <style>{`
        .users-exec-ribbon {
          display: grid;
          grid-template-columns: minmax(300px, 0.95fr) minmax(0, 1.15fr);
          gap: 18px;
          align-items: stretch;
          border: 1px solid rgba(148, 163, 184, 0.16);
          border-radius: 28px;
          background:
            radial-gradient(circle at top right, rgba(59, 130, 246, 0.18), transparent 34%),
            radial-gradient(circle at bottom left, rgba(34, 197, 94, 0.14), transparent 30%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.94), rgba(2, 6, 23, 0.86));
          box-shadow: 0 28px 80px rgba(2, 6, 23, 0.32);
          padding: 20px;
          min-width: 0;
          overflow: hidden;
        }

        .users-exec-copy { min-width: 0; }

        .users-exec-copy span,
        .users-exec-grid span,
        .users-exec-footer span,
        .users-ai-brief-grid span,
        .users-role-card span {
          display: block;
          color: rgba(147, 197, 253, 0.86);
          font-size: 11px;
          font-weight: 950;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .users-exec-copy strong {
          display: block;
          margin-top: 8px;
          color: white;
          font-size: clamp(30px, 4vw, 50px);
          line-height: 1;
          font-weight: 950;
          letter-spacing: -0.07em;
        }

        .users-exec-copy p {
          margin: 12px 0 0;
          color: rgba(226, 232, 240, 0.78);
          line-height: 1.6;
          max-width: 820px;
        }

        .users-exec-badges,
        .users-exec-actions,
        .users-exec-footer,
        .users-action-center,
        .users-actions,
        .users-controls {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          align-items: center;
        }

        .users-exec-badges { margin-top: 14px; }

        .users-exec-grid,
        .users-ai-brief-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          min-width: 0;
        }

        .users-exec-grid div,
        .users-ai-brief-grid div,
        .users-role-card {
          border: 1px solid rgba(148, 163, 184, 0.14);
          border-radius: 18px;
          background: rgba(2, 6, 23, 0.34);
          padding: 14px;
          min-width: 0;
        }

        .users-exec-grid strong,
        .users-ai-brief-grid b,
        .users-role-card strong {
          display: block;
          margin-top: 7px;
          color: white;
          font-size: 20px;
          font-weight: 950;
          overflow-wrap: anywhere;
        }

        .users-exec-actions,
        .users-exec-footer {
          grid-column: 1 / -1;
          border-top: 1px solid rgba(148, 163, 184, 0.12);
          padding-top: 14px;
        }

        .users-exec-actions button,
        .users-exec-actions a,
        .users-action-center button,
        .users-action-center a {
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

        .users-exec-actions button:hover,
        .users-exec-actions a:hover,
        .users-action-center button:hover,
        .users-action-center a:hover {
          border-color: rgba(96, 165, 250, 0.48);
          background: rgba(37, 99, 235, 0.24);
          color: white;
        }

        .users-exec-actions button:disabled,
        .users-action-center button:disabled {
          opacity: 0.62;
          cursor: not-allowed;
        }

        .users-exec-stack,
        .users-stack {
          display: grid;
          gap: 18px;
          min-width: 0;
        }

        .users-grid {
          display: grid;
          gap: 16px;
          grid-template-columns: minmax(0, 1.1fr) minmax(360px, 0.9fr);
          align-items: start;
        }

        .users-row {
          border-radius: 22px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          background: rgba(15, 23, 42, 0.58);
          overflow: hidden;
        }

        .users-row .vs-responsive-row {
          border: 0;
          background: transparent;
        }

        .users-controls {
          border-top: 1px solid rgba(148, 163, 184, 0.12);
          padding: 12px 14px 14px;
        }

        .users-controls .vs-select {
          min-width: 170px;
        }

        .users-ai-brief {
          border-radius: 24px;
          border: 1px solid rgba(96, 165, 250, 0.24);
          background:
            radial-gradient(circle at top right, rgba(37, 99, 235, 0.18), transparent 36%),
            rgba(15, 23, 42, 0.58);
          padding: 18px;
        }

        .users-ai-brief strong {
          display: block;
          color: white;
          font-size: 20px;
          font-weight: 950;
          letter-spacing: -0.04em;
        }

        .users-ai-brief p {
          color: rgba(226, 232, 240, 0.86);
          font-size: 13px;
          line-height: 1.65;
          margin: 10px 0 14px;
        }

        .users-role-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 12px;
        }

        .users-role-card {
          display: grid;
          gap: 8px;
          align-content: start;
        }

        @media (max-width: 1100px) {
          .users-grid,
          .users-exec-ribbon,
          .users-exec-grid,
          .users-ai-brief-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="users-exec-stack">
        <FirmUsersExecutiveHeader
          summary={summary}
          loading={loading}
          lastUpdated={lastUpdated}
          onRefresh={loadUsers}
        />

        <ExecutivePageNav sections={navSections} />
      </div>

      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}
      {message ? (
        <div
          className="vs-banner"
          style={{ borderColor: "#bbf7d0", background: "#f0fdf4", color: "#166534" }}
        >
          {message}
        </div>
      ) : null}

      <CollapsibleSection
        id="users-metrics"
        title="Team Metrics"
        subtitle="Active users, role coverage, administrative capacity, and access status."
        defaultOpen
        right={<Badge tone="active">{summary.active} Active</Badge>}
      >
        <div className="vs-grid-4">
          <StatCard label="Total Users" value={fmt(summary.total)} delta="Firm accounts" tone="up" />
          <StatCard label="Active Users" value={fmt(summary.active)} delta="Can access workspace" tone="up" />
          <StatCard label="Admins" value={fmt(summary.admins)} delta="Administrative coverage" tone={summary.admins ? "up" : "down"} />
          <StatCard label="Inactive" value={fmt(summary.inactive)} delta="Disabled accounts" tone={summary.inactive ? "neutral" : "up"} />
        </div>
      </CollapsibleSection>

      <div className="users-grid">
        <CollapsibleSection
          id="users-team"
          title="Firm Team"
          subtitle="All users in your current firm."
          defaultOpen
          right={<Badge tone="accent">{users.length} users</Badge>}
        >
          {loading ? (
            <EmptyState text="Loading firm users..." />
          ) : !users.length ? (
            <EmptyState text="No users found in this firm." />
          ) : (
            <ShowMoreList
              items={users}
              initialCount={10}
              showAllLabel={(count) => `Show All ${count} Firm Users`}
              className="users-stack"
              renderItem={(user) => (
                <UserRow
                  user={user}
                  onUpdateUser={handleUpdateUser}
                  onResetPassword={handleResetPassword}
                />
              )}
            />
          )}
        </CollapsibleSection>

        <CollapsibleSection
          id="users-add"
          title="Add Firm User"
          subtitle="Create a user directly inside your firm workspace."
          defaultOpen
          right={<Badge tone="accent">Invite Access</Badge>}
        >
          <form onSubmit={handleCreateUser} className="vs-stack">
            <div className="vs-grid-2">
              <input
                className="vs-input"
                value={form.first_name}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, first_name: event.target.value }))
                }
                placeholder="First name"
                required
              />
              <input
                className="vs-input"
                value={form.last_name}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, last_name: event.target.value }))
                }
                placeholder="Last name"
                required
              />
            </div>

            <input
              className="vs-input"
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, email: event.target.value }))
              }
              placeholder="Work email"
              required
            />

            <input
              className="vs-input"
              type="password"
              value={form.password}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, password: event.target.value }))
              }
              placeholder="Temporary password"
              required
            />

            <select
              className="vs-select"
              value={form.role}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, role: event.target.value }))
              }
            >
              <option value="user">User</option>
              <option value="analyst">Analyst</option>
              <option value="strategist">Strategist</option>
              <option value="mailops">MailOps</option>
              <option value="admin">Admin</option>
            </select>

            <button type="submit" className="vs-button">
              Create User
            </button>
          </form>
        </CollapsibleSection>
      </div>

      <CollapsibleSection
        id="users-workforce"
        title="Workforce Intelligence"
        subtitle="Role distribution and executive access assessment for the firm."
        defaultOpen={false}
        right={<Badge tone={summary.admins ? "active" : "danger"}>{summary.admins} Admins</Badge>}
      >
        <div className="users-stack">
          <RoleDistribution summary={summary} />
          <WorkforceBrief summary={summary} users={users} />
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        id="users-actions"
        title="Executive Action Center"
        subtitle="Move administration workflows into connected VoterSpheres modules."
        defaultOpen={false}
        right={<Badge tone="active">Admin Handoff</Badge>}
      >
        <AdminActionCenter loading={loading} onRefresh={loadUsers} />
      </CollapsibleSection>

      <BackToTopButton />
    </PageShell>
  );
}

