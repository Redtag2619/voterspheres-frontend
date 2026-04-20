import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import PublicPageShell from "../components/layout/PublicPageShell.jsx";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetLink, setResetLink] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setResetLink("");
    setLoading(true);

    try {
      const response = await api.post("/auth/forgot-password", { email });

      setMessage(
        response?.data?.message ||
          "If that account exists, a reset link has been sent."
      );

      if (response?.data?.reset_link) {
        setResetLink(response.data.reset_link);
      }
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Unable to send reset link right now."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <PublicPageShell
      eyebrow="Password Reset"
      title="Reset your VoterSpheres password."
      description="Enter your account email and we’ll send you a secure reset link."
    >
      <div style={{ width: "100%", maxWidth: "460px", margin: "0 auto" }}>
        <div className="vs-card" style={{ padding: "20px" }}>
          {error ? (
            <div className="vs-banner vs-banner-danger" style={{ marginBottom: "14px" }}>
              {error}
            </div>
          ) : null}

          {message ? (
            <div
              className="vs-banner"
              style={{
                marginBottom: "14px",
                borderColor: "#bbf7d0",
                background: "#f0fdf4",
                color: "#166534"
              }}
            >
              {message}
            </div>
          ) : null}

          {resetLink ? (
            <div
              className="vs-card-muted"
              style={{
                marginBottom: "14px",
                padding: "12px 14px",
                wordBreak: "break-word"
              }}
            >
              <div className="vs-stat-label">Manual reset link</div>
              <div style={{ marginTop: "6px" }}>{resetLink}</div>
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@campaign.com"
                required
              />
            </div>

            <button
              type="submit"
              className="vs-button vs-button-primary"
              disabled={loading}
              style={{ width: "100%" }}
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>

          <div
            style={{
              marginTop: "16px",
              paddingTop: "14px",
              borderTop: "1px solid var(--vs-border)",
              fontSize: "12px",
              color: "var(--vs-text-muted)"
            }}
          >
            Back to{" "}
            <Link to="/login" style={{ color: "#fbbf24", fontWeight: 700 }}>
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </PublicPageShell>
  );
}
