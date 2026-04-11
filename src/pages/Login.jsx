import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: "",
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
      await login(form.email, form.password);
      navigate("/dashboard");
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Unable to sign in right now."
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
          maxWidth: "440px",
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
            <div className="vs-page-eyebrow">Account Access</div>
            <h1
              style={{
                margin: "8px 0 0",
                fontSize: "24px",
                lineHeight: 1.05,
                fontWeight: 800,
                letterSpacing: "-0.03em",
              }}
            >
              Sign in to VoterSpheres
            </h1>
            <div
              style={{
                marginTop: "8px",
                fontSize: "13px",
                lineHeight: 1.6,
                color: "var(--vs-text-muted)",
              }}
            >
              Access your campaign command center, intelligence workflows, MailOps,
              fundraising, and execution layers.
            </div>
          </div>

          {error ? (
            <div className="vs-banner vs-banner-danger" style={{ marginBottom: "14px" }}>
              {error}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="vs-stack">
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
                placeholder="Enter your password"
                required
              />
            </div>

            <button
              type="submit"
              className="vs-button vs-button-primary"
              disabled={loading}
              style={{ width: "100%" }}
            >
              {loading ? "Signing in..." : "Sign In"}
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
            New to VoterSpheres?{" "}
            <Link to="/signup" style={{ color: "#fbbf24", fontWeight: 700 }}>
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
