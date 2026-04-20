import { useEffect, useState } from "react";
import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import { api } from "../services/api";

function formatDateTime(value) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

function roleTone(role) {
  const value = String(role || "").toLowerCase();
  if (value === "admin") return "danger";
  if (value === "strategist") return "accent";
  if (value === "analyst") return "info";
  if (value === "mailops") return "warning";
  return "default";
}

export default function FirmUsersAdmin() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    role: "user"
  });

  async function loadUsers() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/firm-users");
      setUsers(response?.data?.results || []);
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
        role: "user"
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

  return (
    <PageShell
      eyebrow="Admin"
      title="Firm Users"
      description="Manage users and roles inside your firm workspace."
    >
      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}
      {message ? (
        <div
          className="vs-banner"
          style={{ borderColor: "#bbf7d0", background: "#f0fdf4", color: "#166534" }}
        >
          {message}
        </div>
      ) : null}

      <div
        style={{
          display: "grid",
          gap: "16px",
          gridTemplateColumns: "minmax(0, 1.1fr) minmax(360px, 0.9fr)"
        }}
      >
        <SectionCard
          title="Firm Team"
          subtitle="All users in your current firm."
          right={<Badge tone="accent">{users.length} users</Badge>}
        >
          <div className="vs-stack">
            {loading ? (
              <EmptyState text="Loading firm users..." />
            ) : !users.length ? (
              <EmptyState text="No users found in this firm." />
            ) : (
              users.map((user) => (
                <div
                  key={user.id}
                  className="vs-card"
                  style={{ padding: "16px", display: "grid", gap: "12px" }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "12px",
                      flexWrap: "wrap"
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: "16px",
                          fontWeight: 800,
                          color: "var(--vs-text)"
                        }}
                      >
                        {user.first_name} {user.last_name}
                      </div>
                      <div
                        style={{
                          marginTop: "4px",
                          color: "var(--vs-text-muted)",
                          fontSize: "13px"
                        }}
                      >
                        {user.email}
                      </div>
                    </div>

                    <div className="vs-chip-row">
                      <Badge tone={roleTone(user.role)}>{user.role}</Badge>
                      <Badge tone={user.is_active ? "active" : "default"}>
                        {user.is_active ? "active" : "inactive"}
                      </Badge>
                    </div>
                  </div>

                  <div className="vs-grid-2">
                    <div className="vs-card-muted" style={{ padding: "12px 14px" }}>
                      <div className="vs-stat-label">Created</div>
                      <div style={{ marginTop: "4px", fontWeight: 700 }}>
                        {formatDateTime(user.created_at)}
                      </div>
                    </div>

                    <div className="vs-card-muted" style={{ padding: "12px 14px" }}>
                      <div className="vs-stat-label">Firm ID</div>
                      <div style={{ marginTop: "4px", fontWeight: 700 }}>
                        {user.firm_id}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    <select
                      className="vs-select"
                      defaultValue={user.role}
                      onChange={(e) =>
                        handleUpdateUser(user.id, {
                          role: e.target.value,
                          is_active: Boolean(user.is_active)
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
                        handleUpdateUser(user.id, {
                          role: user.role,
                          is_active: !user.is_active
                        })
                      }
                    >
                      {user.is_active ? "Disable" : "Enable"}
                    </button>

                    <button
                      type="button"
                      className="vs-button vs-button-secondary"
                      onClick={() => handleResetPassword(user)}
                    >
                      Reset Password
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Add Firm User"
          subtitle="Create a user directly inside your firm workspace."
        >
          <form onSubmit={handleCreateUser} className="vs-stack">
            <div className="vs-grid-2">
              <input
                className="vs-input"
                value={form.first_name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, first_name: e.target.value }))
                }
                placeholder="First name"
                required
              />
              <input
                className="vs-input"
                value={form.last_name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, last_name: e.target.value }))
                }
                placeholder="Last name"
                required
              />
            </div>

            <input
              className="vs-input"
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, email: e.target.value }))
              }
              placeholder="Work email"
              required
            />

            <input
              className="vs-input"
              type="password"
              value={form.password}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, password: e.target.value }))
              }
              placeholder="Temporary password"
              required
            />

            <select
              className="vs-select"
              value={form.role}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, role: e.target.value }))
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
        </SectionCard>
      </div>
    </PageShell>
  );
}
