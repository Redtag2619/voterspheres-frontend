import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Badge from "../components/ui/Badge";
import PublicPageShell from "../components/layout/PublicPageShell.jsx";
import { api } from "../services/api";

const fieldStyle = {
  width: "100%",
  borderRadius: 14,
  border: "1px solid rgba(148, 163, 184, 0.24)",
  background: "rgba(15, 23, 42, 0.55)",
  color: "inherit",
  padding: "0.82rem 0.9rem",
  outline: "none",
};

const emptyForm = {
  firm_name: "",
  contact_name: "",
  email: "",
  phone: "",
  title: "",
  website: "",
  organization_type: "Political consulting firm",
  states: "",
  cycle: "2026",
  campaign_count: "",
  team_size: "",
  budget_range: "",
  timeline: "This month",
  use_case: "",
  message: "",
};

function getUtmParams(search = "") {
  const params = new URLSearchParams(search);

  return {
    utm_source: params.get("utm_source") || "",
    utm_medium: params.get("utm_medium") || "",
    utm_campaign: params.get("utm_campaign") || "",
    source: params.get("source") || "enterprise_intake_page",
  };
}

function required(value = "") {
  return String(value || "").trim();
}

export default function EnterpriseLeadIntake() {
  const location = useLocation();

  const utm = useMemo(() => getUtmParams(location.search), [location.search]);

  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function submitLead(event) {
    event.preventDefault();

    setError("");

    if (!required(form.contact_name)) {
      setError("Contact name is required.");
      return;
    }

    if (!required(form.email)) {
      setError("Email is required.");
      return;
    }

    if (!required(form.firm_name)) {
      setError("Firm or organization name is required.");
      return;
    }

    try {
      setSubmitting(true);

      await api.createEnterpriseLead({
        ...form,
        states: form.states
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        campaign_count: form.campaign_count ? Number(form.campaign_count) : null,
        team_size: form.team_size ? Number(form.team_size) : 1,
        priority: "high",
        ...utm,
      });

      setSubmitted(true);
      setForm(emptyForm);
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Unable to submit enterprise inquiry."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PublicPageShell
      eyebrow="Enterprise Sales"
      title="Build your firm’s campaign operating system with VoterSpheres."
      description="Tell us about your consulting operation, target states, campaign volume, and onboarding timeline. We’ll route your inquiry into the VoterSpheres enterprise pipeline."
      announcement="For consultants, agencies, campaign operators, and high-volume political organizations."
      announcementTone="success"
      announcementAction={
        <Link to="/pricing?upgrade=enterprise" className="vs-button vs-button-secondary">
          Review Enterprise Pricing
        </Link>
      }
    >
      <div className="vs-grid-2">
        <div className="vs-card" style={{ padding: 22 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
            <Badge tone="active">Enterprise Pipeline</Badge>
            <Badge tone="accent">Priority Follow-Up</Badge>
          </div>

          <h2 style={{ margin: 0, fontSize: 24 }}>Request enterprise onboarding</h2>

          <p
            style={{
              marginTop: 10,
              color: "var(--vs-text-muted)",
              lineHeight: 1.7,
              fontSize: 14,
            }}
          >
            VoterSpheres Enterprise is built for political consultants who need
            a command layer across workspaces, scheduled client reporting,
            MailOps, vendors, fundraising intelligence, and executive campaign
            operations.
          </p>

          <div className="vs-stack" style={{ marginTop: 18 }}>
            {[
              "Multi-client workspace operations",
              "Unlimited scheduled reporting",
              "Live command center workflows",
              "Enterprise onboarding and rollout support",
              "CRM-ready sales and follow-up pipeline",
            ].map((item) => (
              <div
                key={item}
                style={{
                  display: "grid",
                  gridTemplateColumns: "10px 1fr",
                  gap: 10,
                  color: "var(--vs-text-muted)",
                  fontSize: 13,
                  lineHeight: 1.6,
                }}
              >
                <span className="vs-live-dot-success" style={{ marginTop: 7 }} />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="vs-card" style={{ padding: 22 }}>
          {submitted ? (
            <div className="vs-stack">
              <Badge tone="active">Inquiry Received</Badge>

              <h2 style={{ margin: 0, fontSize: 24 }}>We received your request.</h2>

              <p style={{ color: "var(--vs-text-muted)", lineHeight: 1.7 }}>
                Your enterprise inquiry has been added to the VoterSpheres CRM
                pipeline. A team member can review the lead, assign a stage, add
                notes, and schedule follow-up from the internal dashboard.
              </p>

              <div className="vs-inline-actions">
                <button
                  type="button"
                  className="vs-button"
                  onClick={() => setSubmitted(false)}
                >
                  Submit Another Lead
                </button>

                <Link to="/pricing" className="vs-button vs-button-secondary">
                  Back to Pricing
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={submitLead} style={{ display: "grid", gap: 14 }}>
              {error ? (
                <div
                  className="vs-banner"
                  style={{
                    borderColor: "#fecaca",
                    background: "#fef2f2",
                    color: "#b91c1c",
                  }}
                >
                  {error}
                </div>
              ) : null}

              <div className="vs-grid-2">
                <label style={{ display: "grid", gap: 6 }}>
                  <span className="vs-stat-label">Contact Name</span>
                  <input
                    style={fieldStyle}
                    value={form.contact_name}
                    onChange={(event) => update("contact_name", event.target.value)}
                    placeholder="Mark Stephens"
                  />
                </label>

                <label style={{ display: "grid", gap: 6 }}>
                  <span className="vs-stat-label">Email</span>
                  <input
                    style={fieldStyle}
                    type="email"
                    value={form.email}
                    onChange={(event) => update("email", event.target.value)}
                    placeholder="mark@example.com"
                  />
                </label>
              </div>

              <div className="vs-grid-2">
                <label style={{ display: "grid", gap: 6 }}>
                  <span className="vs-stat-label">Firm / Organization</span>
                  <input
                    style={fieldStyle}
                    value={form.firm_name}
                    onChange={(event) => update("firm_name", event.target.value)}
                    placeholder="Red Tag Strategies"
                  />
                </label>

                <label style={{ display: "grid", gap: 6 }}>
                  <span className="vs-stat-label">Phone</span>
                  <input
                    style={fieldStyle}
                    value={form.phone}
                    onChange={(event) => update("phone", event.target.value)}
                    placeholder="Optional"
                  />
                </label>
              </div>

              <div className="vs-grid-2">
                <label style={{ display: "grid", gap: 6 }}>
                  <span className="vs-stat-label">Title</span>
                  <input
                    style={fieldStyle}
                    value={form.title}
                    onChange={(event) => update("title", event.target.value)}
                    placeholder="Founder, Partner, Campaign Manager"
                  />
                </label>

                <label style={{ display: "grid", gap: 6 }}>
                  <span className="vs-stat-label">Website</span>
                  <input
                    style={fieldStyle}
                    value={form.website}
                    onChange={(event) => update("website", event.target.value)}
                    placeholder="https://..."
                  />
                </label>
              </div>

              <div className="vs-grid-2">
                <label style={{ display: "grid", gap: 6 }}>
                  <span className="vs-stat-label">Organization Type</span>
                  <select
                    style={fieldStyle}
                    value={form.organization_type}
                    onChange={(event) => update("organization_type", event.target.value)}
                  >
                    <option>Political consulting firm</option>
                    <option>Campaign committee</option>
                    <option>Independent expenditure / PAC</option>
                    <option>Agency / vendor network</option>
                    <option>Party committee</option>
                    <option>Other</option>
                  </select>
                </label>

                <label style={{ display: "grid", gap: 6 }}>
                  <span className="vs-stat-label">Target States</span>
                  <input
                    style={fieldStyle}
                    value={form.states}
                    onChange={(event) => update("states", event.target.value)}
                    placeholder="PA, GA, AZ"
                  />
                </label>
              </div>

              <div className="vs-grid-3">
                <label style={{ display: "grid", gap: 6 }}>
                  <span className="vs-stat-label">Cycle</span>
                  <input
                    style={fieldStyle}
                    value={form.cycle}
                    onChange={(event) => update("cycle", event.target.value)}
                    placeholder="2026"
                  />
                </label>

                <label style={{ display: "grid", gap: 6 }}>
                  <span className="vs-stat-label">Campaign Count</span>
                  <input
                    style={fieldStyle}
                    type="number"
                    min="0"
                    value={form.campaign_count}
                    onChange={(event) => update("campaign_count", event.target.value)}
                    placeholder="5"
                  />
                </label>

                <label style={{ display: "grid", gap: 6 }}>
                  <span className="vs-stat-label">Team Size</span>
                  <input
                    style={fieldStyle}
                    type="number"
                    min="1"
                    value={form.team_size}
                    onChange={(event) => update("team_size", event.target.value)}
                    placeholder="3"
                  />
                </label>
              </div>

              <div className="vs-grid-2">
                <label style={{ display: "grid", gap: 6 }}>
                  <span className="vs-stat-label">Budget Range</span>
                  <select
                    style={fieldStyle}
                    value={form.budget_range}
                    onChange={(event) => update("budget_range", event.target.value)}
                  >
                    <option value="">Select range</option>
                    <option>$1k-$5k/mo</option>
                    <option>$5k-$15k/mo</option>
                    <option>$15k-$50k/mo</option>
                    <option>$50k+/mo</option>
                  </select>
                </label>

                <label style={{ display: "grid", gap: 6 }}>
                  <span className="vs-stat-label">Timeline</span>
                  <select
                    style={fieldStyle}
                    value={form.timeline}
                    onChange={(event) => update("timeline", event.target.value)}
                  >
                    <option>This week</option>
                    <option>This month</option>
                    <option>This quarter</option>
                    <option>Planning ahead</option>
                  </select>
                </label>
              </div>

              <label style={{ display: "grid", gap: 6 }}>
                <span className="vs-stat-label">Primary Use Case</span>
                <input
                  style={fieldStyle}
                  value={form.use_case}
                  onChange={(event) => update("use_case", event.target.value)}
                  placeholder="Client reporting, MailOps, campaign command, vendor visibility..."
                />
              </label>

              <label style={{ display: "grid", gap: 6 }}>
                <span className="vs-stat-label">Message</span>
                <textarea
                  style={{ ...fieldStyle, minHeight: 120, resize: "vertical" }}
                  value={form.message}
                  onChange={(event) => update("message", event.target.value)}
                  placeholder="Tell us what you want VoterSpheres Enterprise to help you run."
                />
              </label>

              <button type="submit" className="vs-button" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Enterprise Inquiry"}
              </button>
            </form>
          )}
        </div>
      </div>
    </PublicPageShell>
  );
}
