import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Badge from "../components/ui/Badge";
import PublicPageShell from "../components/layout/PublicPageShell.jsx"; 

function accessProgress(form) {
  const fields = [form.email, form.password];
  const filled = fields.filter((value) => String(value || "").trim()).length;
  return Math.round((filled / fields.length) * 100);
}

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";
  const { login } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const progress = useMemo(() => accessProgress(form), [form]);
  const destinationLabel = next === "/dashboard" ? "Executive Dashboard" : next;

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
      navigate(next, { replace: true });
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
      <style>{`
        .login-shell {
          display: grid;
          grid-template-columns: minmax(280px, 0.95fr) minmax(320px, 1.05fr);
          gap: 22px;
          align-items: stretch;
          width: 100%;
          max-width: 1080px;
          margin: 0 auto;
        }

        .login-command-card,
        .login-form-card {
          border: 1px solid rgba(148, 163, 184, 0.16);
          border-radius: 28px;
          background:
            radial-gradient(circle at top right, rgba(59, 130, 246, 0.16), transparent 34%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.86), rgba(2, 6, 23, 0.72));
          box-shadow: 0 28px 80px rgba(2, 6, 23, 0.26);
          padding: 22px;
          min-width: 0;
        }

        .login-command-card {
          display: grid;
          align-content: start;
          gap: 18px;
        }

        .login-badges {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          align-items: center;
        }

        .login-copy h2 {
          margin: 0;
          color: white;
          font-size: clamp(26px, 3vw, 38px);
          line-height: 1.04;
          letter-spacing: -0.06em;
        }

        .login-copy p {
          margin: 12px 0 0;
          color: rgba(226, 232, 240, 0.78);
          line-height: 1.7;
          font-size: 14px;
        }

        .login-mini-kpis {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .login-mini-kpi {
          border: 1px solid rgba(148, 163, 184, 0.14);
          border-radius: 18px;
          background: rgba(2, 6, 23, 0.3);
          padding: 14px;
        }

        .login-mini-kpi span,
        .login-label,
        .login-progress-label {
          display: block;
          color: rgba(147, 197, 253, 0.86);
          font-size: 11px;
          font-weight: 950;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .login-mini-kpi strong {
          display: block;
          margin-top: 7px;
          color: white;
          font-size: 19px;
          font-weight: 950;
          overflow-wrap: anywhere;
        }

        .login-feature-list {
          display: grid;
          gap: 11px;
        }

        .login-feature {
          display: grid;
          grid-template-columns: 12px 1fr;
          gap: 10px;
          color: rgba(226, 232, 240, 0.82);
          font-size: 13px;
          line-height: 1.6;
        }

        .login-feature span:first-child {
          width: 9px;
          height: 9px;
          border-radius: 999px;
          background: rgba(34, 197, 94, 0.9);
          margin-top: 7px;
          box-shadow: 0 0 14px rgba(34, 197, 94, 0.35);
        }

        .login-progress {
          display: grid;
          gap: 8px;
          margin-bottom: 14px;
        }

        .login-progress-row {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: center;
          color: rgba(226, 232, 240, 0.82);
          font-size: 12px;
          font-weight: 800;
        }

        .login-progress-track {
          height: 10px;
          border-radius: 999px;
          background: rgba(15, 23, 42, 0.86);
          border: 1px solid rgba(148, 163, 184, 0.14);
          overflow: hidden;
        }

        .login-progress-fill {
          height: 100%;
          width: var(--progress);
          border-radius: inherit;
          background: linear-gradient(90deg, rgba(59, 130, 246, 0.85), rgba(34, 197, 94, 0.9));
        }

        .login-form {
          display: grid;
          gap: 14px;
        }

        .login-field {
          display: grid;
          gap: 7px;
        }

        .login-helper-row {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          align-items: center;
          color: var(--vs-text-muted);
          font-size: 12px;
        }

        .login-helper-row a,
        .login-footer a {
          color: #fbbf24;
          font-weight: 800;
          text-decoration: none;
        }

        .login-footer {
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

        @media (max-width: 980px) {
          .login-shell,
          .login-mini-kpis {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="login-shell">
        <section className="login-command-card">
          <div className="login-badges">
            <Badge tone="active">Secure Access</Badge>
            <Badge tone="accent">Executive Workspace</Badge>
            <Badge tone="info">Live Intelligence</Badge>
          </div>

          <div className="login-copy">
            <h2>Return to your campaign command layer.</h2>
            <p>
              Sign in to manage executive dashboards, client workspaces, mission control,
              campaign CRM, intelligence reports, state operations, and operational execution.
            </p>
          </div>

          <div className="login-mini-kpis">
            <div className="login-mini-kpi">
              <span>Destination</span>
              <strong>{destinationLabel}</strong>
            </div>
            <div className="login-mini-kpi">
              <span>Access Progress</span>
              <strong>{progress}%</strong>
            </div>
            <div className="login-mini-kpi">
              <span>Workspace</span>
              <strong>VoterSpheres</strong>
            </div>
            <div className="login-mini-kpi">
              <span>Mode</span>
              <strong>Secure Login</strong>
            </div>
          </div>

          <div className="login-feature-list">
            {[
              "Open the executive dashboard and command center.",
              "Resume campaign CRM, Mission Control, and AI War Room workflows.",
              "Access state operations, vendors, reports, and client portals.",
              "Use password reset if your account was created by firm invite.",
            ].map((item) => (
              <div key={item} className="login-feature">
                <span />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="login-form-card">
          <div className="login-progress">
            <div className="login-progress-row">
              <span className="login-progress-label">Access Check</span>
              <span>{progress}% Complete</span>
            </div>
            <div className="login-progress-track">
              <div className="login-progress-fill" style={{ "--progress": `${progress}%` }} />
            </div>
          </div>

          {error ? (
            <div className="vs-banner vs-banner-danger" style={{ marginBottom: "14px" }}>
              {error}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-field">
              <label className="login-label">Email</label>
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

            <div className="login-field">
              <label className="login-label">Password</label>
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

            <div className="login-helper-row">
              <span>Protected firm workspace access</span>
              <Link to="/forgot-password">Forgot password?</Link>
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

          <div className="login-footer">
            <span>Need an account?</span>
            <Link to="/signup">Create one here</Link>
          </div>
        </section>
      </div>
    </PublicPageShell>
  );
}

