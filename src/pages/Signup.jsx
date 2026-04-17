import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import PublicPageShell from "../components/layout/PublicPageShell.jsx";

export default function Signup() {
  const navigate = useNavigate();
  const { signup } = useAuth();

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    firm_name: "",
    email: "",
    password: "",
    role: "admin",
    invite_code: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signup(form);
      navigate("/dashboard");
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Unable to create your account right now."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <PublicPageShell
      eyebrow="Private Beta"
      title="Create your VoterSpheres account."
      description="VoterSpheres is onboarding approved consultants, campaign teams, and political operators into private beta."
      announcement="Signup is limited to approved beta users. Use an approved email or a valid invite code."
      announcementTone="warning"
      announcementAction={
        <Link to="/pricing" className="vs-button vs-button-secondary">
          Compare Plans
        </Link>
      }
    >
      <div
        style={{
          width: "100%",
          maxWidth: "560px",
          margin: "0 auto",
        }}
      >
        <div className="vs-card" style={{ padding: "20px" }}>
          {error ? (
            <div className="vs-banner vs-banner-danger" style={{ marginBottom: "14px" }}>
              {error}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="vs-stack">
            <div className="vs-grid-2">
              <div className="vs-stack">
                <label style={{ fontSize: "12px", color: "var(--vs-text-muted)" }}>
                  First Name
                </label>
                <input
                  className="vs-input"
                  name="first_name"
                  value={form.first_name}
                  onChange={handleChange}
                  placeholder="Mark"
                  required
                />
              </div>

              <div className="vs-stack">
                <label style={{ fontSize: "12px", color: "var(--vs-text-muted)" }}>
                  Last Name
                </label>
                <input
                  className="vs-input"
                  name="last_name"
                  value={form.last_name}
                  onChange={handleChange}
                  placeholder="Stephens"
                  required
                />
              </div>
            </div>

            <div className="vs-stack">
              <label style={{ fontSize: "12px", color: "var(--vs-text-muted)" }}>
                Firm Name
              </label>
              <input
                className="vs-input"
                name="firm_name"
                value={form.firm_name}
                onChange={handleChange}
                placeholder="Red Tag Strategies"
                required
              />
            </div>

            <div className="vs-stack">
              <label style={{ fontSize: "12px", color: "var(--vs-text-muted)" }}>
                Work Email
              </label>
              <input
                className="vs-input"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@campaign.com"
                required
              />
            </div>

            <div className="vs-grid-2">
              <div className="vs-stack">
                <label style={{ fontSize: "12px", color: "var(--vs-text-muted)" }}>
                  Password
                </label>
                <input
                  className="vs-input"
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Create a password"
                  required
                />
              </div>

              <div className="vs-stack">
                <label style={{ fontSize: "12px", color: "var(--vs-text-muted)" }}>
                  Role
                </label>
                <select
                  className="vs-select"
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                >
                  <option value="admin">Admin</option>
                  <option value="strategist">Strategist</option>
                  <option value="analyst">Analyst</option>
                  <option value="mailops">MailOps</option>
                  <option value="user">User</option>
                </select>
              </div>
            </div>

            <div className="vs-stack">
              <label style={{ fontSize: "12px", color: "var(--vs-text-muted)" }}>
                Invite Code
              </label>
              <input
                className="vs-input"
                name="invite_code"
                value={form.invite_code}
                onChange={handleChange}
                placeholder="Optional invite code"
              />
            </div>

            <button
              type="submit"
              className="vs-button vs-button-primary"
              disabled={loading}
              style={{ width: "100%" }}
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <div
            style={{
              marginTop: "16px",
              paddingTop: "14px",
              borderTop: "1px solid var(--vs-border)",
              fontSize: "12px",
              color: "var(--vs-text-muted)",
            }}
          >
            Already approved?{" "}
            <Link to="/login" style={{ color: "#fbbf24", fontWeight: 700 }}>
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </PublicPageShell>
  );
}
