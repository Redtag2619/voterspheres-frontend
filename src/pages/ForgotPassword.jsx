import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import Badge from "../components/ui/Badge";
import PublicPageShell from "../components/layout/PublicPageShell.jsx";

function recoveryProgress(email, message, resetLink) {
  if (resetLink) return 100;
  if (message) return 85;
  if (String(email || "").includes("@")) return 55;
  if (email) return 30;
  return 0;
}

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetLink, setResetLink] = useState("");

  const progress = useMemo(
    () => recoveryProgress(email, message, resetLink),
    [email, message, resetLink]
  );

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
      description="Enter your account email and weâ€™ll send you a secure reset link."
      announcement="Use the same email connected to your firm workspace. If SMTP is not configured, administrators may receive a manual reset link."
      announcementTone="demo"
      announcementAction={
        <Link to="/login" className="vs-button vs-button-secondary">
          Back to Login
        </Link>
      }
    >
      <style>{`
        .forgot-shell {
          display: grid;
          grid-template-columns: minmax(280px, 0.95fr) minmax(320px, 1.05fr);
          gap: 22px;
          align-items: stretch;
          width: 100%;
          max-width: 1080px;
          margin: 0 auto;
        }

        .forgot-command-card,
        .forgot-form-card {
          border: 1px solid rgba(148, 163, 184, 0.16);
          border-radius: 28px;
          background:
            radial-gradient(circle at top right, rgba(59, 130, 246, 0.16), transparent 34%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.86), rgba(2, 6, 23, 0.72));
          box-shadow: 0 28px 80px rgba(2, 6, 23, 0.26);
          padding: 22px;
          min-width: 0;
        }

        .forgot-command-card {
          display: grid;
          align-content: start;
          gap: 18px;
        }

        .forgot-badges {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          align-items: center;
        }

        .forgot-copy h2 {
          margin: 0;
          color: white;
          font-size: clamp(26px, 3vw, 38px);
          line-height: 1.04;
          letter-spacing: -0.06em;
        }

        .forgot-copy p {
          margin: 12px 0 0;
          color: rgba(226, 232, 240, 0.78);
          line-height: 1.7;
          font-size: 14px;
        }

        .forgot-mini-kpis {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .forgot-mini-kpi {
          border: 1px solid rgba(148, 163, 184, 0.14);
          border-radius: 18px;
          background: rgba(2, 6, 23, 0.3);
          padding: 14px;
        }

        .forgot-mini-kpi span,
        .forgot-label,
        .forgot-progress-label {
          display: block;
          color: rgba(147, 197, 253, 0.86);
          font-size: 11px;
          font-weight: 950;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .forgot-mini-kpi strong {
          display: block;
          margin-top: 7px;
          color: white;
          font-size: 19px;
          font-weight: 950;
          overflow-wrap: anywhere;
        }

        .forgot-feature-list {
          display: grid;
          gap: 11px;
        }

        .forgot-feature {
          display: grid;
          grid-template-columns: 12px 1fr;
          gap: 10px;
          color: rgba(226, 232, 240, 0.82);
          font-size: 13px;
          line-height: 1.6;
        }

        .forgot-feature span:first-child {
          width: 9px;
          height: 9px;
          border-radius: 999px;
          background: rgba(34, 197, 94, 0.9);
          margin-top: 7px;
          box-shadow: 0 0 14px rgba(34, 197, 94, 0.35);
        }

        .forgot-progress {
          display: grid;
          gap: 8px;
          margin-bottom: 14px;
        }

        .forgot-progress-row {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: center;
          color: rgba(226, 232, 240, 0.82);
          font-size: 12px;
          font-weight: 800;
        }

        .forgot-progress-track {
          height: 10px;
          border-radius: 999px;
          background: rgba(15, 23, 42, 0.86);
          border: 1px solid rgba(148, 163, 184, 0.14);
          overflow: hidden;
        }

        .forgot-progress-fill {
          height: 100%;
          width: var(--progress);
          border-radius: inherit;
          background: linear-gradient(90deg, rgba(59, 130, 246, 0.85), rgba(34, 197, 94, 0.9));
        }

        .forgot-form {
          display: grid;
          gap: 14px;
        }

        .forgot-field {
          display: grid;
          gap: 7px;
        }

        .forgot-manual-link {
          border: 1px solid rgba(96, 165, 250, 0.24);
          border-radius: 18px;
          background: rgba(37, 99, 235, 0.12);
          padding: 13px 14px;
          word-break: break-word;
          margin-bottom: 14px;
        }

        .forgot-manual-link div:last-child {
          margin-top: 6px;
          color: rgba(226, 232, 240, 0.92);
          line-height: 1.55;
          font-size: 13px;
        }

        .forgot-footer {
          margin-top: 16px;
          padding-top: 14px;
          border-top: 1px solid var(--vs-border);
          font-size: 12px;
          color: var(--vs-text-muted);
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: space-between;
          align-items: center;
        }

        .forgot-footer a {
          color: #fbbf24;
          font-weight: 800;
          text-decoration: none;
        }

        @media (max-width: 980px) {
          .forgot-shell,
          .forgot-mini-kpis {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="forgot-shell">
        <section className="forgot-command-card">
          <div className="forgot-badges">
            <Badge tone="active">Secure Recovery</Badge>
            <Badge tone="accent">Firm Workspace</Badge>
            <Badge tone="info">Password Reset</Badge>
          </div>

          <div className="forgot-copy">
            <h2>Recover access to your command workspace.</h2>
            <p>
              Request a secure password reset for the account tied to your VoterSpheres
              firm workspace, executive dashboard, client reporting, and campaign operations.
            </p>
          </div>

          <div className="forgot-mini-kpis">
            <div className="forgot-mini-kpi">
              <span>Recovery Progress</span>
              <strong>{progress}%</strong>
            </div>
            <div className="forgot-mini-kpi">
              <span>Status</span>
              <strong>{loading ? "Sending" : message ? "Sent" : "Ready"}</strong>
            </div>
            <div className="forgot-mini-kpi">
              <span>Destination</span>
              <strong>Login</strong>
            </div>
            <div className="forgot-mini-kpi">
              <span>Manual Link</span>
              <strong>{resetLink ? "Available" : "Hidden"}</strong>
            </div>
          </div>

          <div className="forgot-feature-list">
            {[
              "Enter the email connected to your firm account.",
              "A secure reset link will be sent if the account exists.",
              "Manual reset links may appear when email delivery is not configured.",
              "After resetting, return to Login and continue into the dashboard.",
            ].map((item) => (
              <div key={item} className="forgot-feature">
                <span />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="forgot-form-card">
          <div className="forgot-progress">
            <div className="forgot-progress-row">
              <span className="forgot-progress-label">Recovery Request</span>
              <span>{progress}% Complete</span>
            </div>
            <div className="forgot-progress-track">
              <div className="forgot-progress-fill" style={{ "--progress": `${progress}%` }} />
            </div>
          </div>

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
                color: "#166534",
              }}
            >
              {message}
            </div>
          ) : null}

          {resetLink ? (
            <div className="forgot-manual-link">
              <div className="forgot-label">Manual reset link</div>
              <div>{resetLink}</div>
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="forgot-form">
            <div className="forgot-field">
              <label className="forgot-label">Email</label>
              <input
                className="vs-input"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
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

          <div className="forgot-footer">
            <span>Remember your password?</span>
            <Link to="/login">Sign In</Link>
          </div>
        </section>
      </div>
    </PublicPageShell>
  );
}

