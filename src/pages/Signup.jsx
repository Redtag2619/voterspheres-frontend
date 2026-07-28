import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Badge from "../components/ui/Badge";
import PublicPageShell from "../components/layout/PublicPageShell.jsx";

const ROLE_OPTIONS = [
  { value: "admin", label: "Admin", detail: "Firm owner or account administrator" },
  { value: "strategist", label: "Strategist", detail: "Campaign strategy and client leadership" },
  { value: "analyst", label: "Analyst", detail: "Research, reporting, and intelligence workflows" },
  { value: "mailops", label: "MailOps", detail: "Mail tracking, vendors, and fulfillment operations" },
  { value: "user", label: "User", detail: "General workspace access" },
];

function passwordScore(password = "") {
  let score = 0;
  if (password.length >= 8) score += 35;
  if (/[A-Z]/.test(password)) score += 15;
  if (/[a-z]/.test(password)) score += 15;
  if (/[0-9]/.test(password)) score += 15;
  if (/[^A-Za-z0-9]/.test(password)) score += 20;
  return Math.min(100, score);
}

function roleLabel(value = "") {
  return ROLE_OPTIONS.find((role) => role.value === value)?.label || "User";
}

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
    invite_code: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const completion = useMemo(() => {
    const requiredFields = [
      form.first_name,
      form.last_name,
      form.firm_name,
      form.email,
      form.password,
    ];

    const filled = requiredFields.filter((value) => String(value || "").trim()).length;
    return Math.round((filled / requiredFields.length) * 100);
  }, [form]);

  const strength = useMemo(() => passwordScore(form.password), [form.password]);

  const passwordLabel = useMemo(() => {
    if (!form.password) return "Not started";
    if (strength >= 80) return "Strong";
    if (strength >= 55) return "Good";
    if (strength >= 35) return "Basic";
    return "Needs work";
  }, [form.password, strength]);

  const selectedRole = ROLE_OPTIONS.find((role) => role.value === form.role);

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
      <style>{`
        .signup-shell {
          display: grid;
          grid-template-columns: minmax(280px, 0.92fr) minmax(320px, 1.08fr);
          gap: 22px;
          align-items: stretch;
          width: 100%;
          max-width: 1120px;
          margin: 0 auto;
        }

        .signup-command-card,
        .signup-form-card {
          border: 1px solid rgba(148, 163, 184, 0.16);
          border-radius: 28px;
          background:
            radial-gradient(circle at top right, rgba(59, 130, 246, 0.16), transparent 34%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.86), rgba(2, 6, 23, 0.72));
          box-shadow: 0 28px 80px rgba(2, 6, 23, 0.26);
          padding: 22px;
          min-width: 0;
        }

        .signup-command-card {
          display: grid;
          align-content: start;
          gap: 18px;
        }

        .signup-mini-kpis {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .signup-mini-kpi {
          border: 1px solid rgba(148, 163, 184, 0.14);
          border-radius: 18px;
          background: rgba(2, 6, 23, 0.3);
          padding: 14px;
        }

        .signup-mini-kpi span,
        .signup-label,
        .signup-progress-label {
          display: block;
          color: rgba(147, 197, 253, 0.86);
          font-size: 11px;
          font-weight: 950;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .signup-mini-kpi strong {
          display: block;
          margin-top: 7px;
          color: white;
          font-size: 19px;
          font-weight: 950;
          overflow-wrap: anywhere;
        }

        .signup-copy h2 {
          margin: 0;
          color: white;
          font-size: clamp(26px, 3vw, 38px);
          line-height: 1.04;
          letter-spacing: -0.06em;
        }

        .signup-copy p {
          margin: 12px 0 0;
          color: rgba(226, 232, 240, 0.78);
          line-height: 1.7;
          font-size: 14px;
        }

        .signup-feature-list {
          display: grid;
          gap: 11px;
        }

        .signup-feature {
          display: grid;
          grid-template-columns: 12px 1fr;
          gap: 10px;
          color: rgba(226, 232, 240, 0.82);
          font-size: 13px;
          line-height: 1.6;
        }

        .signup-feature span:first-child {
          width: 9px;
          height: 9px;
          border-radius: 999px;
          background: rgba(34, 197, 94, 0.9);
          margin-top: 7px;
          box-shadow: 0 0 14px rgba(34, 197, 94, 0.35);
        }

        .signup-badges {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          align-items: center;
        }

        .signup-form-card form {
          display: grid;
          gap: 14px;
        }

        .signup-field {
          display: grid;
          gap: 7px;
        }

        .signup-progress {
          display: grid;
          gap: 8px;
          margin-bottom: 14px;
        }

        .signup-progress-row {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: center;
          color: rgba(226, 232, 240, 0.82);
          font-size: 12px;
          font-weight: 800;
        }

        .signup-progress-track {
          height: 10px;
          border-radius: 999px;
          background: rgba(15, 23, 42, 0.86);
          border: 1px solid rgba(148, 163, 184, 0.14);
          overflow: hidden;
        }

        .signup-progress-fill {
          height: 100%;
          width: var(--progress);
          border-radius: inherit;
          background: linear-gradient(90deg, rgba(59, 130, 246, 0.85), rgba(34, 197, 94, 0.9));
        }

        .signup-role-panel {
          border: 1px solid rgba(148, 163, 184, 0.14);
          border-radius: 18px;
          background: rgba(2, 6, 23, 0.26);
          padding: 12px;
          display: grid;
          gap: 6px;
        }

        .signup-role-panel strong {
          color: white;
          font-size: 14px;
        }

        .signup-role-panel p {
          margin: 0;
          color: rgba(203, 213, 225, 0.8);
          font-size: 12px;
          line-height: 1.55;
        }

        .signup-footer {
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

        .signup-footer a {
          color: #fbbf24;
          font-weight: 800;
          text-decoration: none;
        }

        @media (max-width: 980px) {
          .signup-shell,
          .signup-mini-kpis {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="signup-shell">
        <section className="signup-command-card">
          <div className="signup-badges">
            <Badge tone="warning">Private Beta</Badge>
            <Badge tone="accent">Invite Gated</Badge>
            <Badge tone="active">Executive Shell</Badge>
          </div>

          <div className="signup-copy">
            <h2>Launch your firm command workspace.</h2>
            <p>
              Create the primary firm account used to manage campaigns, client workspaces,
              intelligence reports, CRM activity, vendors, MailOps, and executive decision systems.
            </p>
          </div>

          <div className="signup-mini-kpis">
            <div className="signup-mini-kpi">
              <span>Setup Progress</span>
              <strong>{completion}%</strong>
            </div>
            <div className="signup-mini-kpi">
              <span>Selected Role</span>
              <strong>{roleLabel(form.role)}</strong>
            </div>
            <div className="signup-mini-kpi">
              <span>Password</span>
              <strong>{passwordLabel}</strong>
            </div>
            <div className="signup-mini-kpi">
              <span>Access</span>
              <strong>{form.invite_code ? "Invite Code" : "Approved Email"}</strong>
            </div>
          </div>

          <div className="signup-feature-list">
            {[
              "Create the firm account and initial workspace access.",
              "Use an approved beta email or valid invite code.",
              "Route directly into the executive dashboard after signup.",
              "Assign the correct role for admin, strategist, analyst, MailOps, or user access.",
              "Connect onboarding to the same VoterSpheres executive interface used across the platform.",
            ].map((item) => (
              <div key={item} className="signup-feature">
                <span />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="signup-form-card">
          <div className="signup-progress">
            <div className="signup-progress-row">
              <span className="signup-progress-label">Account Setup</span>
              <span>{completion}% Complete</span>
            </div>
            <div className="signup-progress-track">
              <div className="signup-progress-fill" style={{ "--progress": `${completion}%` }} />
            </div>
          </div>

          {error ? (
            <div className="vs-banner vs-banner-danger" style={{ marginBottom: "14px" }}>
              {error}
            </div>
          ) : null}

          <form onSubmit={handleSubmit}>
            <div className="vs-grid-2">
              <div className="signup-field">
                <label className="signup-label">First Name</label>
                <input
                  className="vs-input"
                  name="first_name"
                  value={form.first_name}
                  onChange={handleChange}
                  placeholder="Mark"
                  required
                />
              </div>

              <div className="signup-field">
                <label className="signup-label">Last Name</label>
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

            <div className="signup-field">
              <label className="signup-label">Firm Name</label>
              <input
                className="vs-input"
                name="firm_name"
                value={form.firm_name}
                onChange={handleChange}
                placeholder="Red Tag Strategies"
                required
              />
            </div>

            <div className="signup-field">
              <label className="signup-label">Work Email</label>
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
              <div className="signup-field">
                <label className="signup-label">Password</label>
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

              <div className="signup-field">
                <label className="signup-label">Role</label>
                <select
                  className="vs-select"
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                >
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="signup-role-panel">
              <strong>{selectedRole?.label || "User"} Access</strong>
              <p>{selectedRole?.detail || "General workspace access"}</p>
            </div>

            <div className="signup-field">
              <label className="signup-label">Invite Code</label>
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

          <div className="signup-footer">
            <span>Already approved?</span>
            <Link to="/login">Sign in</Link>
          </div>
        </section>
      </div>
    </PublicPageShell>
  );
}
