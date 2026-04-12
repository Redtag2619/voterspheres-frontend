import { Link } from "react-router-dom";
import { useState } from "react";
import { api } from "../../services/api";

function getAnnouncementClass(tone = "info") {
  if (tone === "demo") return "vs-banner vs-banner-demo";
  if (tone === "danger") return "vs-banner vs-banner-danger";
  return "vs-banner";
}

const defaultTrustItems = [
  {
    label: "Secure auth",
    value: "Protected firm access",
    dotClass: "vs-live-dot-success",
  },
  {
    label: "Live MailOps",
    value: "Operational visibility enabled",
    dotClass: "vs-live-dot-warning",
  },
  {
    label: "Enterprise onboarding",
    value: "White-glove rollout available",
    dotClass: "vs-live-dot-success",
  },
];

function EnterpriseLeadModal({ open, onClose }) {
  const [form, setForm] = useState({
    full_name: "",
    firm_name: "",
    email: "",
    phone: "",
    team_size: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (!open) return null;

  function updateField(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await api.createEnterpriseLead(form);
      setSuccess("Thanks — your enterprise inquiry was submitted.");
      setForm({
        full_name: "",
        firm_name: "",
        email: "",
        phone: "",
        team_size: "",
        message: "",
      });
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Unable to submit enterprise inquiry."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.65)",
        display: "grid",
        placeItems: "center",
        zIndex: 1000,
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        className="vs-card"
        style={{
          width: "100%",
          maxWidth: "620px",
          padding: "20px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "12px",
            alignItems: "flex-start",
            marginBottom: "16px",
          }}
        >
          <div>
            <div className="vs-page-eyebrow">Enterprise Onboarding</div>
            <h2
              style={{
                margin: "8px 0 0",
                fontSize: "22px",
                lineHeight: 1.05,
                fontWeight: 900,
                letterSpacing: "-0.03em",
              }}
            >
              Talk to us about Enterprise
            </h2>
            <div
              style={{
                marginTop: "8px",
                fontSize: "13px",
                lineHeight: 1.65,
                color: "var(--vs-text-muted)",
              }}
            >
              Tell us about your firm, team size, and rollout needs. We’ll use
              this to help scope the right enterprise onboarding path.
            </div>
          </div>

          <button
            type="button"
            className="vs-button vs-button-secondary"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        {error ? (
          <div className="vs-banner vs-banner-danger" style={{ marginBottom: "12px" }}>
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="vs-banner" style={{ marginBottom: "12px" }}>
            {success}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="vs-stack">
          <div className="vs-grid-2">
            <div className="vs-stack">
              <label style={{ fontSize: "12px", color: "var(--vs-text-muted)" }}>
                Full Name
              </label>
              <input
                className="vs-input"
                name="full_name"
                value={form.full_name}
                onChange={updateField}
                placeholder="Mark Stephens"
                required
              />
            </div>

            <div className="vs-stack">
              <label style={{ fontSize: "12px", color: "var(--vs-text-muted)" }}>
                Firm Name
              </label>
              <input
                className="vs-input"
                name="firm_name"
                value={form.firm_name}
                onChange={updateField}
                placeholder="Red Tag Strategies"
                required
              />
            </div>
          </div>

          <div className="vs-grid-2">
            <div className="vs-stack">
              <label style={{ fontSize: "12px", color: "var(--vs-text-muted)" }}>
                Email
              </label>
              <input
                className="vs-input"
                type="email"
                name="email"
                value={form.email}
                onChange={updateField}
                placeholder="you@campaign.com"
                required
              />
            </div>

            <div className="vs-stack">
              <label style={{ fontSize: "12px", color: "var(--vs-text-muted)" }}>
                Phone
              </label>
              <input
                className="vs-input"
                name="phone"
                value={form.phone}
                onChange={updateField}
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="vs-stack">
            <label style={{ fontSize: "12px", color: "var(--vs-text-muted)" }}>
              Team Size
            </label>
            <select
              className="vs-select"
              name="team_size"
              value={form.team_size}
              onChange={updateField}
              required
            >
              <option value="">Select team size</option>
              <option value="1-5">1-5</option>
              <option value="6-15">6-15</option>
              <option value="16-30">16-30</option>
              <option value="31-75">31-75</option>
              <option value="75+">75+</option>
            </select>
          </div>

          <div className="vs-stack">
            <label style={{ fontSize: "12px", color: "var(--vs-text-muted)" }}>
              What do you need?
            </label>
            <textarea
              className="vs-textarea"
              name="message"
              rows={5}
              value={form.message}
              onChange={updateField}
              placeholder="Tell us about rollout goals, clients, users, MailOps, intelligence workflows, or implementation needs."
              required
            />
          </div>

          <div className="vs-inline-actions">
            <button
              type="submit"
              className="vs-button vs-button-primary"
              disabled={loading}
            >
              {loading ? "Submitting..." : "Submit Inquiry"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PublicPageShell({
  eyebrow,
  title,
  description,
  actions,
  announcement,
  announcementTone = "info",
  announcementAction,
  trustItems = defaultTrustItems,
  showCTA = true,
  children,
}) {
  const [leadModalOpen, setLeadModalOpen] = useState(false);

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, rgba(245,158,11,0.08), transparent 24%), linear-gradient(180deg, #0b0f14 0%, #0a0d12 100%)",
        padding: "24px 20px 40px",
      }}
    >
      <EnterpriseLeadModal
        open={leadModalOpen}
        onClose={() => setLeadModalOpen(false)}
      />

      <div
        style={{
          width: "min(1180px, 100%)",
          margin: "0 auto",
          display: "grid",
          gap: "18px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            flexWrap: "wrap",
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
            }}
          >
            <div className="vs-brand-mark" style={{ width: 38, height: 38, fontSize: 13 }}>
              VS
            </div>

            <div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>VoterSpheres</div>
              <div style={{ fontSize: 11, color: "var(--vs-text-muted)" }}>
                Campaign intelligence operating system
              </div>
            </div>
          </Link>

          <div className="vs-inline-actions">
            <Link to="/pricing" className="vs-button vs-button-secondary">
              Pricing
            </Link>
            <Link to="/signup" className="vs-button vs-button-primary">
              Sign Up
            </Link>
            <Link to="/login" className="vs-button vs-button-secondary">
              Sign In
            </Link>
          </div>
        </div>

        {announcement && (
          <div className={getAnnouncementClass(announcementTone)}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <div style={{ fontSize: 12, lineHeight: 1.6 }}>{announcement}</div>
              {announcementAction && <div>{announcementAction}</div>}
            </div>
          </div>
        )}

        <section className="vs-card" style={{ padding: "20px" }}>
          {eyebrow ? <div className="vs-page-eyebrow">{eyebrow}</div> : null}

          {title ? (
            <h1
              style={{
                margin: "8px 0 0",
                fontSize: "clamp(24px, 3vw, 30px)",
                fontWeight: 900,
                letterSpacing: "-0.04em",
              }}
            >
              {title}
            </h1>
          ) : null}

          {description ? (
            <div
              style={{
                marginTop: "10px",
                fontSize: "13px",
                color: "var(--vs-text-muted)",
                lineHeight: 1.7,
              }}
            >
              {description}
            </div>
          ) : null}

          {actions ? <div style={{ marginTop: 16 }}>{actions}</div> : null}
        </section>

        {trustItems?.length ? (
          <section className="vs-card" style={{ padding: "14px 16px" }}>
            <div className="vs-grid-3">
              {trustItems.map((item, i) => (
                <div key={i} style={{ display: "flex", gap: "10px" }}>
                  {item.dotClass ? <span className={item.dotClass} /> : null}
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{item.label}</div>
                    <div style={{ fontSize: 11, color: "var(--vs-text-muted)" }}>
                      {item.value}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {children}

        {showCTA ? (
          <section
            className="vs-card"
            style={{
              padding: "20px",
              textAlign: "center",
              background:
                "linear-gradient(180deg, rgba(245,158,11,0.08), rgba(0,0,0,0))",
              border: "1px solid rgba(245,158,11,0.25)",
            }}
          >
            <div
              style={{
                fontSize: "18px",
                fontWeight: 800,
                marginBottom: "8px",
              }}
            >
              Start running campaigns like a modern operation.
            </div>

            <div
              style={{
                fontSize: "13px",
                color: "var(--vs-text-muted)",
                marginBottom: "16px",
                lineHeight: 1.65,
              }}
            >
              Launch your firm workspace, activate intelligence workflows, and
              bring execution, MailOps, and fundraising into one system.
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "10px",
                flexWrap: "wrap",
              }}
            >
              <Link to="/signup" className="vs-button vs-button-primary">
                Start Now
              </Link>

              <button
                type="button"
                className="vs-button vs-button-secondary"
                onClick={() => setLeadModalOpen(true)}
              >
                Talk to Us
              </button>

              <Link to="/pricing" className="vs-button vs-button-secondary">
                View Plans
              </Link>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
