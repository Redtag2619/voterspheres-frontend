import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import "./LandingPage.css";

const capabilities = [
  {
    number: "01",
    title: "Political Intelligence",
    body: "Turn candidate, battleground, fundraising, coalition, and operational signals into a shared intelligence picture.",
    meta: "National → state → county",
  },
  {
    number: "02",
    title: "Executive Command",
    body: "Move from awareness to action with priority queues, decision briefs, ownership, escalation, and execution tracking.",
    meta: "Signal → decision → action",
  },
  {
    number: "03",
    title: "Campaign Operations",
    body: "Coordinate CRM, vendors, MailOps, tasks, reporting, and client workspaces without stitching together disconnected tools.",
    meta: "One operating layer",
  },
];

const workflow = [
  ["Detect", "Surface emerging risk and opportunity across campaigns, states, vendors, finance, and field operations."],
  ["Decide", "Convert intelligence into executive recommendations, scenarios, priorities, and accountable decisions."],
  ["Deploy", "Route work to teams, vendors, and operators while preserving visibility for leadership."],
  ["Measure", "Track execution, outcomes, and changing conditions from one shared command environment."],
];

const platformSignals = [
  { label: "Operational posture", value: "Live", tone: "green" },
  { label: "Intelligence coverage", value: "National", tone: "blue" },
  { label: "Decision workflow", value: "Integrated", tone: "amber" },
];

const audiences = [
  "Political consulting firms",
  "Campaign leadership teams",
  "Independent expenditure groups",
  "State and party organizations",
  "Direct mail and political vendors",
  "Executive political operators",
];

function isValidEmail(value) {
  return /\S+@\S+\.\S+/.test(String(value || "").trim());
}

export default function LandingPage() {
  const [form, setForm] = useState({
    full_name: "",
    firm_name: "",
    email: "",
    role: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState("default");

  const canSubmit = useMemo(
    () =>
      Boolean(
        form.full_name.trim() &&
          form.firm_name.trim() &&
          isValidEmail(form.email) &&
          form.role.trim()
      ),
    [form]
  );

  function updateField(field, value) {
    setForm((previous) => ({ ...previous, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!canSubmit || submitting) return;

    try {
      setSubmitting(true);
      setMessage("");
      setMessageTone("default");

      await api.post("/public/enterprise-leads", {
        full_name: form.full_name.trim(),
        firm_name: form.firm_name.trim(),
        email: form.email.trim(),
        role: form.role.trim(),
        notes: form.notes.trim(),
        phone: "",
        team_size: "",
        message: form.notes.trim(),
      });

      setMessage("Request received. Our team will follow up with access details.");
      setMessageTone("success");
      setForm({ full_name: "", firm_name: "", email: "", role: "", notes: "" });
    } catch (error) {
      setMessage(
        error?.response?.data?.error ||
          "We could not submit your request. Please try again in a moment."
      );
      setMessageTone("error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="lp-page">
      <div className="lp-orb lp-orb-one" aria-hidden="true" />
      <div className="lp-orb lp-orb-two" aria-hidden="true" />

      <header className="lp-header">
        <Link className="lp-brand" to="/" aria-label="VoterSpheres home">
          <span className="lp-brand-mark">VS</span>
          <span>
            <strong>VoterSpheres</strong>
            <small>Political intelligence operating system</small>
          </span>
        </Link>

        <nav className="lp-nav" aria-label="Primary navigation">
          <a href="#platform">Platform</a>
          <a href="#workflow">How it works</a>
          <a href="#solutions">Solutions</a>
          <Link to="/pricing">Pricing</Link>
        </nav>

        <div className="lp-header-actions">
          <Link className="lp-button lp-button-ghost lp-hide-mobile" to="/login">
            Sign in
          </Link>
          <a className="lp-button lp-button-primary" href="#request-access">
            Request a demo
          </a>
        </div>
      </header>

      <main>
        <section className="lp-hero">
          <div className="lp-hero-copy">
            <div className="lp-kicker">
              <span className="lp-live-dot" />
              Built for serious political operators
            </div>

            <h1>The operating system for modern political campaigns.</h1>
            <p className="lp-hero-lede">
              VoterSpheres unifies political intelligence, executive decision-making,
              campaign operations, CRM, vendors, fundraising, and MailOps in one secure
              command environment.
            </p>

            <div className="lp-hero-actions">
              <a className="lp-button lp-button-primary lp-button-large" href="#request-access">
                Request private access
              </a>
              <a className="lp-button lp-button-secondary lp-button-large" href="#platform">
                Explore the platform
              </a>
            </div>

            <div className="lp-proof-line">
              <span>National political coverage</span>
              <span>Executive decision workflows</span>
              <span>Campaign operations in one system</span>
            </div>
          </div>

          <div className="lp-product-window" aria-label="VoterSpheres product preview">
            <div className="lp-window-bar">
              <div className="lp-window-dots"><i /><i /><i /></div>
              <span>Executive Command Center</span>
              <span className="lp-secure">Secure workspace</span>
            </div>

            <div className="lp-window-body">
              <aside className="lp-preview-sidebar" aria-hidden="true">
                <div className="lp-preview-logo">VS</div>
                {["Overview", "Intelligence", "Operations", "Decisions", "Reports"].map((item, index) => (
                  <div className={`lp-preview-nav ${index === 0 ? "active" : ""}`} key={item}>
                    <span />{item}
                  </div>
                ))}
              </aside>

              <div className="lp-preview-main">
                <div className="lp-preview-heading">
                  <div>
                    <small>National operating picture</small>
                    <strong>Executive Command</strong>
                  </div>
                  <div className="lp-preview-status"><span /> Live</div>
                </div>

                <div className="lp-signal-grid">
                  {platformSignals.map((signal) => (
                    <div className="lp-signal-card" key={signal.label}>
                      <small>{signal.label}</small>
                      <strong>{signal.value}</strong>
                      <span className={`lp-signal-line ${signal.tone}`} />
                    </div>
                  ))}
                </div>

                <div className="lp-preview-content">
                  <div className="lp-map-card">
                    <div className="lp-card-label">Political pressure map</div>
                    <div className="lp-map-visual" aria-hidden="true">
                      <span className="state s1" /><span className="state s2" />
                      <span className="state s3" /><span className="state s4" />
                      <span className="state s5" /><span className="state s6" />
                      <span className="state s7" /><span className="state s8" />
                      <span className="state s9" /><span className="state s10" />
                      <span className="map-pulse p1" /><span className="map-pulse p2" />
                    </div>
                    <div className="lp-map-legend"><span>Stable</span><span>Watch</span><span>Priority</span></div>
                  </div>

                  <div className="lp-priority-card">
                    <div className="lp-card-label">Priority queue</div>
                    {[
                      ["PA", "Vendor capacity", "High"],
                      ["GA", "Turnout pressure", "Watch"],
                      ["AZ", "Fundraising shift", "Review"],
                    ].map(([state, issue, status], index) => (
                      <div className="lp-priority-row" key={state}>
                        <b>{state}</b><span>{issue}</span><em className={`tone-${index}`}>{status}</em>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="lp-trust-strip" aria-label="Platform summary">
          <div><strong>One system</strong><span>for intelligence and execution</span></div>
          <div><strong>One operating picture</strong><span>from national to local</span></div>
          <div><strong>One command layer</strong><span>for leaders and teams</span></div>
        </section>

        <section className="lp-section" id="platform">
          <div className="lp-section-heading">
            <div className="lp-eyebrow">Platform</div>
            <h2>Move beyond dashboards. Operate from a decision system.</h2>
            <p>
              Most political organizations manage critical work across spreadsheets,
              point solutions, inboxes, and status meetings. VoterSpheres connects the
              full operating cycle in one shared environment.
            </p>
          </div>

          <div className="lp-capability-grid">
            {capabilities.map((item) => (
              <article className="lp-capability-card" key={item.title}>
                <span className="lp-card-number">{item.number}</span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
                <div className="lp-card-meta">{item.meta}<span>→</span></div>
              </article>
            ))}
          </div>
        </section>

        <section className="lp-section lp-workflow-section" id="workflow">
          <div className="lp-section-heading lp-section-heading-left">
            <div className="lp-eyebrow">How it works</div>
            <h2>From political signal to accountable execution.</h2>
          </div>

          <div className="lp-workflow-grid">
            {workflow.map(([title, body], index) => (
              <article className="lp-workflow-step" key={title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="lp-section" id="solutions">
          <div className="lp-solution-panel">
            <div>
              <div className="lp-eyebrow">Built for operators</div>
              <h2>A shared command environment for the people responsible for winning.</h2>
              <p>
                Give leadership, strategists, analysts, finance teams, MailOps, and vendors
                the context they need—without exposing every user to unnecessary complexity.
              </p>
            </div>
            <div className="lp-audience-grid">
              {audiences.map((audience) => <span key={audience}>{audience}</span>)}
            </div>
          </div>
        </section>

        <section className="lp-section lp-access-section" id="request-access">
          <div className="lp-access-copy">
            <div className="lp-eyebrow">Private access</div>
            <h2>See how VoterSpheres fits your political operation.</h2>
            <p>
              Tell us about your firm or organization. We’ll use your request to prepare
              the most relevant product walkthrough and onboarding path.
            </p>
            <div className="lp-access-points">
              <span>✓ Role-based platform walkthrough</span>
              <span>✓ Deployment and onboarding discussion</span>
              <span>✓ Plan recommendation based on your operation</span>
            </div>
          </div>

          <form className="lp-demo-form" onSubmit={handleSubmit}>
            <div className="lp-form-heading">
              <strong>Request a product demo</strong>
              <span>All fields marked required must be completed.</span>
            </div>
            <div className="lp-form-grid">
              <label><span>Full name *</span><input value={form.full_name} onChange={(e) => updateField("full_name", e.target.value)} placeholder="Your name" required /></label>
              <label><span>Firm or organization *</span><input value={form.firm_name} onChange={(e) => updateField("firm_name", e.target.value)} placeholder="Organization name" required /></label>
              <label><span>Work email *</span><input type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} placeholder="you@organization.com" required /></label>
              <label><span>Your role *</span><input value={form.role} onChange={(e) => updateField("role", e.target.value)} placeholder="e.g. Campaign manager" required /></label>
            </div>
            <label><span>What should we focus on?</span><textarea value={form.notes} onChange={(e) => updateField("notes", e.target.value)} placeholder="Tell us about your workflows, team, or operational priorities." rows={4} /></label>

            {message ? <div className={`lp-form-message ${messageTone}`}>{message}</div> : null}

            <button className="lp-button lp-button-primary lp-form-submit" type="submit" disabled={!canSubmit || submitting}>
              {submitting ? "Submitting request…" : "Request demo"}
            </button>
            <small className="lp-form-note">By submitting, you agree to be contacted about VoterSpheres.</small>
          </form>
        </section>
      </main>

      <footer className="lp-footer">
        <div className="lp-footer-brand">
          <span className="lp-brand-mark">VS</span>
          <div><strong>VoterSpheres</strong><span>Political intelligence operating system</span></div>
        </div>
        <div className="lp-footer-links">
          <a href="#platform">Platform</a>
          <Link to="/pricing">Pricing</Link>
          <Link to="/login">Sign in</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
        </div>
        <div className="lp-footer-bottom">
          <span>© {new Date().getFullYear()} VoterSpheres. All rights reserved.</span>
          <span>Built for consultants, campaigns, and political organizations.</span>
        </div>
      </footer>
    </div>
  );
}
