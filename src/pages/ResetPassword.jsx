import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../services/api";
import Badge from "../components/ui/Badge";
import PublicPageShell from "../components/layout/PublicPageShell.jsx";

function passwordScore(password = "") {
  let score = 0;
  if (password.length >= 8) score += 35;
  if (/[A-Z]/.test(password)) score += 15;
  if (/[a-z]/.test(password)) score += 15;
  if (/[0-9]/.test(password)) score += 15;
  if (/[^A-Za-z0-9]/.test(password)) score += 20;
  return Math.min(100, score);
}

function resetProgress({ token, password, confirmPassword, message }) {
  if (message) return 100;

  let score = 0;
  if (token) score += 25;
  if (password.length >= 8) score += 35;
  if (confirmPassword && password === confirmPassword) score += 40;

  return Math.min(100, score);
}

function strengthLabel(score, password) {
  if (!password) return "Not started";
  if (score >= 80) return "Strong";
  if (score >= 55) return "Good";
  if (score >= 35) return "Basic";
  return "Needs work";
}

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const strength = useMemo(() => passwordScore(password), [password]);
  const progress = useMemo(
    () => resetProgress({ token, password, confirmPassword, message }),
    [token, password, confirmPassword, message]
  );

  const passwordsMatch = password && confirmPassword && password === confirmPassword;
  const canSubmit = Boolean(token) && password.length >= 8 && passwordsMatch && !loading;

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!token) {
      setError("Missing reset token.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/auth/reset-password", {
        token,
        password,
      });

      setMessage(response?.data?.message || "Password reset successful.");

      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Unable to reset password right now."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <PublicPageShell
      eyebrow="Password Reset"
      title="Set a new password."
      description="Choose a new password for your VoterSpheres account."
      announcement="Use the reset link from your email or manual recovery message. After the password is reset, youâ€™ll be redirected back to Login."
      announcementTone="success"
      announcementAction={
        <Link to="/login" className="vs-button vs-button-secondary">
          Back to Login
        </Link>
      }
    >
      <style>{`
        .reset-shell {
          display: grid;
          grid-template-columns: minmax(280px, 0.95fr) minmax(320px, 1.05fr);
          gap: 22px;
          align-items: stretch;
          width: 100%;
          max-width: 1080px;
          margin: 0 auto;
        }

        .reset-command-card,
        .reset-form-card {
          border: 1px solid rgba(148, 163, 184, 0.16);
          border-radius: 28px;
          background:
            radial-gradient(circle at top right, rgba(59, 130, 246, 0.16), transparent 34%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.86), rgba(2, 6, 23, 0.72));
          box-shadow: 0 28px 80px rgba(2, 6, 23, 0.26);
          padding: 22px;
          min-width: 0;
        }

        .reset-command-card {
          display: grid;
          align-content: start;
          gap: 18px;
        }

        .reset-badges {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          align-items: center;
        }

        .reset-copy h2 {
          margin: 0;
          color: white;
          font-size: clamp(26px, 3vw, 38px);
          line-height: 1.04;
          letter-spacing: -0.06em;
        }

        .reset-copy p {
          margin: 12px 0 0;
          color: rgba(226, 232, 240, 0.78);
          line-height: 1.7;
          font-size: 14px;
        }

        .reset-mini-kpis {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .reset-mini-kpi {
          border: 1px solid rgba(148, 163, 184, 0.14);
          border-radius: 18px;
          background: rgba(2, 6, 23, 0.3);
          padding: 14px;
        }

        .reset-mini-kpi span,
        .reset-label,
        .reset-progress-label {
          display: block;
          color: rgba(147, 197, 253, 0.86);
          font-size: 11px;
          font-weight: 950;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .reset-mini-kpi strong {
          display: block;
          margin-top: 7px;
          color: white;
          font-size: 19px;
          font-weight: 950;
          overflow-wrap: anywhere;
        }

        .reset-feature-list {
          display: grid;
          gap: 11px;
        }

        .reset-feature {
          display: grid;
          grid-template-columns: 12px 1fr;
          gap: 10px;
          color: rgba(226, 232, 240, 0.82);
          font-size: 13px;
          line-height: 1.6;
        }

        .reset-feature span:first-child {
          width: 9px;
          height: 9px;
          border-radius: 999px;
          background: rgba(34, 197, 94, 0.9);
          margin-top: 7px;
          box-shadow: 0 0 14px rgba(34, 197, 94, 0.35);
        }

        .reset-progress {
          display: grid;
          gap: 8px;
          margin-bottom: 14px;
        }

        .reset-progress-row {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: center;
          color: rgba(226, 232, 240, 0.82);
          font-size: 12px;
          font-weight: 800;
        }

        .reset-progress-track {
          height: 10px;
          border-radius: 999px;
          background: rgba(15, 23, 42, 0.86);
          border: 1px solid rgba(148, 163, 184, 0.14);
          overflow: hidden;
        }

        .reset-progress-fill {
          height: 100%;
          width: var(--progress);
          border-radius: inherit;
          background: linear-gradient(90deg, rgba(59, 130, 246, 0.85), rgba(34, 197, 94, 0.9));
        }

        .reset-form {
          display: grid;
          gap: 14px;
        }

        .reset-field {
          display: grid;
          gap: 7px;
        }

        .reset-helper-card {
          border: 1px solid rgba(148, 163, 184, 0.14);
          border-radius: 18px;
          background: rgba(2, 6, 23, 0.26);
          padding: 12px;
          display: grid;
          gap: 6px;
        }

        .reset-helper-card strong {
          color: white;
          font-size: 14px;
        }

        .reset-helper-card p {
          margin: 0;
          color: rgba(203, 213, 225, 0.8);
          font-size: 12px;
          line-height: 1.55;
        }

        .reset-footer {
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

        .reset-footer a {
          color: #fbbf24;
          font-weight: 800;
          text-decoration: none;
        }

        @media (max-width: 980px) {
          .reset-shell,
          .reset-mini-kpis {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="reset-shell">
        <section className="reset-command-card">
          <div className="reset-badges">
            <Badge tone={token ? "active" : "danger"}>{token ? "Token Ready" : "Missing Token"}</Badge>
            <Badge tone="accent">Secure Reset</Badge>
            <Badge tone="info">Login Redirect</Badge>
          </div>

          <div className="reset-copy">
            <h2>Set a new secure password.</h2>
            <p>
              Complete the reset link workflow to restore access to your VoterSpheres
              firm workspace, executive dashboard, campaign operations, and client reporting.
            </p>
          </div>

          <div className="reset-mini-kpis">
            <div className="reset-mini-kpi">
              <span>Reset Progress</span>
              <strong>{progress}%</strong>
            </div>
            <div className="reset-mini-kpi">
              <span>Password</span>
              <strong>{strengthLabel(strength, password)}</strong>
            </div>
            <div className="reset-mini-kpi">
              <span>Match Status</span>
              <strong>{passwordsMatch ? "Matched" : "Pending"}</strong>
            </div>
            <div className="reset-mini-kpi">
              <span>Next Step</span>
              <strong>{message ? "Login" : "Reset"}</strong>
            </div>
          </div>

          <div className="reset-feature-list">
            {[
              "Use a password with at least 8 characters.",
              "Both password fields must match before the reset can be submitted.",
              "After success, you will be redirected to Login.",
              "If your token is missing or expired, request a new reset link.",
            ].map((item) => (
              <div key={item} className="reset-feature">
                <span />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="reset-form-card">
          <div className="reset-progress">
            <div className="reset-progress-row">
              <span className="reset-progress-label">Password Reset</span>
              <span>{progress}% Complete</span>
            </div>
            <div className="reset-progress-track">
              <div className="reset-progress-fill" style={{ "--progress": `${progress}%` }} />
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

          <form onSubmit={handleSubmit} className="reset-form">
            <div className="reset-field">
              <label className="reset-label">New Password</label>
              <input
                className="vs-input"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter a new password"
                required
              />
            </div>

            <div className="reset-field">
              <label className="reset-label">Confirm Password</label>
              <input
                className="vs-input"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Confirm your password"
                required
              />
            </div>

            <div className="reset-helper-card">
              <strong>{passwordsMatch ? "Passwords match" : "Password confirmation required"}</strong>
              <p>
                Password strength: {strengthLabel(strength, password)}. Password must be at least
                8 characters and both entries must match.
              </p>
            </div>

            <button
              type="submit"
              className="vs-button vs-button-primary"
              disabled={!canSubmit}
              style={{ width: "100%" }}
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>

          <div className="reset-footer">
            <span>Back to</span>
            <Link to="/login">Sign In</Link>
          </div>
        </section>
      </div>
    </PublicPageShell>
  );
}
