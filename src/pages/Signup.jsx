import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

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
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, rgba(245,158,11,0.08), transparent 24%), linear-gradient(180deg, #0b0f14 0%, #0a0d12 100%)",
        display: "grid",
        placeItems: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "520px",
          display: "grid",
          gap: "16px",
        }}
      >
        <Link
          to="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "10px",
            color: "var(--vs-text)",
            textDecoration: "none",
            width: "fit-content",
          }}
        >
          <div
            className="vs-brand-mark"
            style={{ width: "38px", height: "38px", fontSize: "13px" }}
          >
            VS
          </div>
          <div>
            <div style={{ fontSize: "15px", fontWeight: 700 }}>VoterSpheres</div>
            <div style={{ fontSize: "11px", color: "var(--vs-text-muted)" }}>
              Campaign intelligence operating system
            </div>
          </div>
        </Link>

        <div className="vs-card" style={{ padding: "20px" }}>
          <div style={{ marginBottom: "16px" }}>
            <div className="vs-page-eyebrow">New Account</div>
            <h1
              style={{
                margin: "8px 0 0",
                fontSize: "24px",
                lineHeight: 1.05,
                fontWeight: 800,
                letterSpacing: "-0.03em",
              }}
            >
              Create your firm workspace
            </h1>
            <div
              style={{
                marginTop: "8px",
                fontSize: "13px",
                lineHeight: 1.6,
                color: "var(--vs-text-muted)",
              }}
            >
              Launch a secure operating system for campaign intelligence, vendors,
              fundraising, MailOps, and live decision-making.
            </div>
          </div>

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
                Email
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
                  <option value="user">User</option>
                </select>
              </div>
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
            Already have access?{" "}
            <Link to="/login" style={{ color: "#fbbf24", fontWeight: 700 }}>
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
