import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import PublicPageShell from "../components/layout/PublicPageShell.jsx";

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
    <PublicPageShell
      eyebrow="Account Access"
      title="Sign in to your campaign operating system."
      description="Access your dashboard, command center, fundraising workflows, MailOps, and intelligence layers from one secure workspace."
      announcement="Demo Mode is available for walkthroughs while live data layers, MailOps workflows, or enterprise onboarding are still being configured."
      announcementTone="demo"
      announcementAction={
        <Link to="/pricing" className="vs-button vs-button-secondary">
          View Plans
        </Link>
      }
    >
      <div
        style={{
          width: "100%",
          maxWidth: "460px",
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
            Need an account?{" "}
            <Link to="/signup" style={{ color: "#fbbf24", fontWeight: 700 }}>
              Create one here
            </Link>
          </div>
        </div>
      </div>
    </PublicPageShell>
  );
}
