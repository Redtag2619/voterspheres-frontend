import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";

const features = [
  {
    title: "Candidate Intelligence",
    body: "Enrich candidate profiles, verify campaign contact data, score readiness, and protect analyst-curated fields."
  },
  {
    title: "Command Center",
    body: "Fuse candidate, vendor, MailOps, fundraising, and battleground signals into one executive operating surface."
  },
  {
    title: "Vendor & MailOps Risk",
    body: "Track vendor coverage, operational exposure, mail timing risk, and campaign execution pressure before it becomes a crisis."
  }
];

const switchReasons = [
  {
    title: "Disconnected intelligence",
    body: "Candidate data, vendors, fundraising, and MailOps often live in separate systems. VoterSpheres gives firms one command layer."
  },
  {
    title: "Execution blind spots",
    body: "Campaigns usually discover operational risk after it matters. VoterSpheres surfaces gaps early."
  },
  {
    title: "No decision system",
    body: "Dashboards show data. VoterSpheres helps consultants decide who to fix, where to deploy, and what to escalate."
  }
];

const replaces = [
  "Candidate spreadsheets",
  "Vendor tracking systems",
  "MailOps coordination sheets",
  "Fundraising dashboards",
  "Ad-hoc intelligence tools",
  "Internal status decks"
];

const previewCards = [
  {
    title: "Command Center",
    stat: "Live",
    detail: "Executive campaign control"
  },
  {
    title: "Candidate Intelligence",
    stat: "Tiered",
    detail: "Scores, contacts, verification"
  },
  {
    title: "Alert Engine",
    stat: "Real-time",
    detail: "Vendor, MailOps, candidate risk"
  }
];

const audiences = [
  "Political consultants",
  "Campaign managers",
  "Direct mail firms",
  "Independent expenditure teams",
  "Political vendors",
  "Executive leadership"
];

const metrics = [
  { label: "Private Beta", value: "Invite Only" },
  { label: "Core Engine", value: "Live" },
  { label: "Candidate Profiles", value: "1000+" }
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
    notes: ""
  });

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState("default");

  const canSubmit = useMemo(() => {
    return (
      form.full_name.trim() &&
      form.firm_name.trim() &&
      isValidEmail(form.email) &&
      form.role.trim()
    );
  }, [form]);

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
        team_size: form.role.trim(),
        message: form.notes.trim()
      });

      setMessage("Request received. We'll follow up with private beta access details.");
      setMessageTone("success");

      setForm({
        full_name: "",
        firm_name: "",
        email: "",
        role: "",
        notes: ""
      });
    } catch (error) {
      setMessage(
        error?.response?.data?.error ||
          "Unable to submit right now. Please try again in a moment."
      );
      setMessageTone("error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, rgba(56, 189, 248, 0.14) 0%, rgba(15, 23, 42, 0) 35%), linear-gradient(180deg, #08111c 0%, #0b1320 50%, #0f172a 100%)",
        color: "#e5eef8"
      }}
    >
      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "32px 20px 64px" }}>
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
            marginBottom: 48
          }}
        >
          <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
            <div style={{ fontSize: 14, letterSpacing: "0.12em", textTransform: "uppercase", color: "#93c5fd", fontWeight: 800 }}>
              VoterSpheres
            </div>
            <div style={{ marginTop: 6, fontSize: 13, color: "#94a3b8" }}>
              Campaign intelligence operating system
            </div>
          </Link>

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <Link to="/pricing" style={navButtonStyle}>Pricing</Link>
            <Link to="/login" style={navButtonStyle}>Sign In</Link>
            <a href="#request-access" style={primarySmallStyle}>Request Demo</a>
          </div>
        </header>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.25fr) minmax(340px, 0.75fr)",
            gap: 24,
            alignItems: "stretch"
          }}
        >
          <div style={panelStyle}>
            <div style={pillStyle}>Political command center for serious operators</div>

            <h1
              style={{
                margin: 0,
                fontSize: "clamp(42px, 7vw, 76px)",
                lineHeight: 0.94,
                letterSpacing: "-0.055em",
                color: "#f8fafc",
                fontWeight: 950
              }}
            >
              Run campaigns with real-time intelligence and execution control.
            </h1>

            <p style={{ marginTop: 22, fontSize: 18, lineHeight: 1.65, maxWidth: 780, color: "#cbd5e1" }}>
              VoterSpheres helps political consultants, campaign teams, direct mail operators, and vendors manage candidate intelligence, battleground pressure, MailOps risk, and execution workflows from one premium command center.
            </p>

            <div style={{ marginTop: 28, display: "flex", gap: 12, flexWrap: "wrap" }}>
              <a href="#request-access" style={primaryButtonStyle}>Request Private Beta Access</a>
              <a href="#platform" style={secondaryButtonStyle}>Explore Platform</a>
            </div>

            <div style={{ marginTop: 30, display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 14 }}>
              {metrics.map((item) => (
                <div key={item.label} style={metricStyle}>
                  <div style={metricLabelStyle}>{item.label}</div>
                  <div style={metricValueStyle}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div id="request-access" style={panelStyle}>
            <div style={eyebrowStyle}>Request Demo</div>
            <h2 style={{ marginTop: 10, marginBottom: 8, fontSize: 28, lineHeight: 1.1, letterSpacing: "-0.03em", fontWeight: 900, color: "#f8fafc" }}>
              Get private beta access
            </h2>

            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: "#94a3b8" }}>
              Weâ€™re onboarding political consultants, campaign teams, direct mail firms, and serious political operators first.
            </p>

            <form onSubmit={handleSubmit} style={{ marginTop: 22, display: "grid", gap: 14 }}>
              <input value={form.full_name} onChange={(e) => setForm((prev) => ({ ...prev, full_name: e.target.value }))} placeholder="Full name" style={inputStyle} />
              <input value={form.firm_name} onChange={(e) => setForm((prev) => ({ ...prev, firm_name: e.target.value }))} placeholder="Firm or organization" style={inputStyle} />
              <input value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} placeholder="Work email" type="email" style={inputStyle} />
              <input value={form.role} onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))} placeholder="Role" style={inputStyle} />
              <textarea value={form.notes} onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} placeholder="What would you use VoterSpheres for?" rows={5} style={{ ...inputStyle, resize: "vertical", minHeight: 120 }} />

              {message ? (
                <div
                  style={{
                    borderRadius: 14,
                    padding: "12px 14px",
                    fontSize: 13,
                    fontWeight: 700,
                    background: messageTone === "success" ? "rgba(22, 163, 74, 0.12)" : "rgba(220, 38, 38, 0.12)",
                    border: messageTone === "success" ? "1px solid rgba(34, 197, 94, 0.28)" : "1px solid rgba(248, 113, 113, 0.28)",
                    color: messageTone === "success" ? "#bbf7d0" : "#fecaca"
                  }}
                >
                  {message}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={!canSubmit || submitting}
                style={{
                  border: 0,
                  borderRadius: 14,
                  padding: "14px 16px",
                  background: !canSubmit || submitting ? "#334155" : "#2563eb",
                  color: "white",
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: !canSubmit || submitting ? "not-allowed" : "pointer"
                }}
              >
                {submitting ? "Submitting..." : "Request Demo"}
              </button>
            </form>
          </div>
        </section>

        <section style={{ marginTop: 32 }}>
          <div style={cardStyle}>
            <div style={eyebrowStyle}>Why firms switch</div>
            <h2 style={sectionTitleStyle}>Campaigns are losing because their operations aren't connected.</h2>

            <div style={threeGridStyle}>
              {switchReasons.map((item) => (
                <div key={item.title} style={mutedCardStyle}>
                  <div style={cardTitleStyle}>{item.title}</div>
                  <div style={cardBodyStyle}>{item.body}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="platform" style={{ marginTop: 28 }}>
          <div style={cardStyle}>
            <div style={eyebrowStyle}>Platform advantage</div>
            <h2 style={sectionTitleStyle}>Replace scattered campaign systems with one command center.</h2>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 18 }}>
              {replaces.map((item) => (
                <div key={item} style={tagStyle}>{item}</div>
              ))}
            </div>
          </div>
        </section>

        <section style={{ marginTop: 28 }}>
          <div style={cardStyle}>
            <div style={eyebrowStyle}>Live system preview</div>
            <h2 style={sectionTitleStyle}>A real campaign command system - not another dashboard.</h2>

            <div style={threeGridStyle}>
              {previewCards.map((item) => (
                <div key={item.title} style={previewCardStyle}>
                  <div style={metricLabelStyle}>{item.title}</div>
                  <div style={{ marginTop: 18, fontSize: 34, fontWeight: 950, letterSpacing: "-0.04em", color: "#f8fafc" }}>
                    {item.stat}
                  </div>
                  <div style={{ marginTop: 8, fontSize: 13, color: "#94a3b8" }}>
                    {item.detail}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section style={{ marginTop: 28 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 18 }}>
            <div style={cardStyle}>
              <div style={eyebrowStyle}>Built for operators</div>
              <h3 style={{ marginTop: 10, marginBottom: 8, fontSize: 30, lineHeight: 1.08, letterSpacing: "-0.03em", fontWeight: 900, color: "#f8fafc" }}>
                One intelligence layer across candidates, battlegrounds, vendors, fundraising, and operations.
              </h3>

              <p style={{ margin: 0, fontSize: 15, lineHeight: 1.7, color: "#cbd5e1", maxWidth: 900 }}>
                VoterSpheres is designed for serious political work. It combines candidate intelligence scoring, contact enrichment, battleground pressure monitoring, vendor risk, MailOps visibility, and executive command workflows into one premium platform.
              </p>
            </div>

            <div style={threeGridStyle}>
              {features.map((item) => (
                <div key={item.title} style={{ ...mutedCardStyle, minHeight: 220 }}>
                  <div style={{ fontSize: 18, lineHeight: 1.15, fontWeight: 900, letterSpacing: "-0.02em", color: "#f8fafc" }}>
                    {item.title}
                  </div>
                  <div style={cardBodyStyle}>{item.body}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section style={{ marginTop: 28 }}>
          <div style={cardStyle}>
            <div style={eyebrowStyle}>Ideal users</div>

            <div style={{ marginTop: 16, display: "flex", gap: 12, flexWrap: "wrap" }}>
              {audiences.map((item) => (
                <div key={item} style={tagStyle}>{item}</div>
              ))}
            </div>
          </div>
        </section>

        <section style={{ marginTop: 28 }}>
          <div
            style={{
              ...cardStyle,
              textAlign: "center",
              border: "1px solid rgba(37, 99, 235, 0.38)",
              background:
                "linear-gradient(180deg, rgba(37, 99, 235, 0.16), rgba(15, 23, 42, 0.72))"
            }}
          >
            <div style={eyebrowStyle}>Private beta</div>
            <h2 style={{ ...sectionTitleStyle, maxWidth: 760, marginLeft: "auto", marginRight: "auto" }}>
              Build the command layer your firm needs before peak campaign season.
            </h2>
            <p style={{ margin: "12px auto 0", maxWidth: 720, color: "#cbd5e1", lineHeight: 1.7 }}>
              The firms that win execution will be the firms that see risk earlier, act faster, and operate from one shared intelligence layer.
            </p>

            <div style={{ marginTop: 22, display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
              <a href="#request-access" style={primaryButtonStyle}>Request Demo</a>
              <Link to="/pricing" style={secondaryButtonStyle}>View Pricing</Link>
            </div>
          </div>
        </section>

        <footer
          style={{
            marginTop: 36,
            paddingTop: 24,
            borderTop: "1px solid rgba(148, 163, 184, 0.14)",
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
            color: "#94a3b8",
            fontSize: 13
          }}
        >
          <div>Â© {new Date().getFullYear()} VoterSpheres. Private beta.</div>
          <div>Political intelligence for consultants, campaigns, and operators.</div>
        </footer>
      </div>
    </div>
  );
}

const panelStyle = {
  background:
    "linear-gradient(180deg, rgba(15, 23, 42, 0.96) 0%, rgba(15, 23, 42, 0.78) 100%)",
  border: "1px solid rgba(148, 163, 184, 0.18)",
  borderRadius: 28,
  padding: 32,
  boxShadow: "0 24px 60px rgba(2, 6, 23, 0.45)"
};

const cardStyle = {
  background: "rgba(15, 23, 42, 0.72)",
  border: "1px solid rgba(148, 163, 184, 0.14)",
  borderRadius: 24,
  padding: 24
};

const mutedCardStyle = {
  background: "rgba(30, 41, 59, 0.48)",
  border: "1px solid rgba(148, 163, 184, 0.14)",
  borderRadius: 22,
  padding: 18
};

const previewCardStyle = {
  ...mutedCardStyle,
  minHeight: 150,
  display: "grid",
  alignContent: "center"
};

const threeGridStyle = {
  marginTop: 18,
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 18
};

const eyebrowStyle = {
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "#93c5fd",
  fontWeight: 800
};

const sectionTitleStyle = {
  marginTop: 10,
  marginBottom: 8,
  fontSize: 28,
  lineHeight: 1.1,
  letterSpacing: "-0.03em",
  fontWeight: 900,
  color: "#f8fafc"
};

const cardTitleStyle = {
  fontSize: 16,
  fontWeight: 900,
  color: "#f8fafc"
};

const cardBodyStyle = {
  marginTop: 10,
  fontSize: 14,
  lineHeight: 1.7,
  color: "#cbd5e1"
};

const metricStyle = {
  background: "rgba(15, 23, 42, 0.62)",
  border: "1px solid rgba(148, 163, 184, 0.16)",
  borderRadius: 18,
  padding: 18
};

const metricLabelStyle = {
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "#94a3b8",
  fontWeight: 700
};

const metricValueStyle = {
  marginTop: 10,
  fontSize: 24,
  lineHeight: 1.05,
  fontWeight: 900,
  letterSpacing: "-0.03em",
  color: "#f8fafc"
};

const tagStyle = {
  border: "1px solid rgba(148, 163, 184, 0.18)",
  background: "rgba(30, 41, 59, 0.52)",
  color: "#e2e8f0",
  padding: "10px 14px",
  borderRadius: 999,
  fontSize: 13,
  fontWeight: 700
};

const pillStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  border: "1px solid rgba(96, 165, 250, 0.24)",
  background: "rgba(30, 41, 59, 0.72)",
  color: "#bfdbfe",
  padding: "8px 12px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 800,
  marginBottom: 18
};

const inputStyle = {
  width: "100%",
  borderRadius: 14,
  border: "1px solid rgba(148, 163, 184, 0.18)",
  background: "rgba(15, 23, 42, 0.72)",
  color: "#f8fafc",
  padding: "14px 14px",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box"
};

const primaryButtonStyle = {
  textDecoration: "none",
  background: "#2563eb",
  color: "white",
  padding: "14px 18px",
  borderRadius: 14,
  fontSize: 14,
  fontWeight: 800
};

const secondaryButtonStyle = {
  textDecoration: "none",
  background: "rgba(15, 23, 42, 0.7)",
  color: "#e2e8f0",
  border: "1px solid rgba(148, 163, 184, 0.24)",
  padding: "14px 18px",
  borderRadius: 14,
  fontSize: 14,
  fontWeight: 800
};

const navButtonStyle = {
  textDecoration: "none",
  border: "1px solid rgba(148, 163, 184, 0.28)",
  background: "rgba(15, 23, 42, 0.55)",
  color: "#cbd5e1",
  padding: "10px 14px",
  borderRadius: 12,
  fontSize: 13,
  fontWeight: 800
};

const primarySmallStyle = {
  textDecoration: "none",
  background: "#2563eb",
  color: "white",
  padding: "10px 16px",
  borderRadius: 12,
  fontSize: 13,
  fontWeight: 800
};

