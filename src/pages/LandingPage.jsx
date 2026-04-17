import { useMemo, useState } from "react";
import { api } from "../services/api";

const features = [
  {
    title: "Candidate Intelligence",
    body: "Search live candidate records, enrich campaign profiles, verify contact data, and protect curated fields with analyst locks."
  },
  {
    title: "Battleground Monitoring",
    body: "Track top races, momentum, pressure, and operational readiness from a premium executive command layer."
  },
  {
    title: "Vendor & Mail Ops Visibility",
    body: "Connect campaign strategy to vendor execution, operational risk, and election-cycle delivery timelines."
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
        notes: form.notes.trim()
      });

      setMessage("Request received. We’ll follow up with private beta access details.");
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
      <div
        style={{
          maxWidth: 1240,
          margin: "0 auto",
          padding: "32px 20px 64px"
        }}
      >
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
          <div>
            <div
              style={{
                fontSize: 14,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#93c5fd",
                fontWeight: 800
              }}
            >
              VoterSpheres
            </div>
            <div
              style={{
                marginTop: 6,
                fontSize: 13,
                color: "#94a3b8"
              }}
            >
              Political Intelligence Platform
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
              flexWrap: "wrap"
            }}
          >
            <span
              style={{
                border: "1px solid rgba(148, 163, 184, 0.28)",
                background: "rgba(15, 23, 42, 0.55)",
                color: "#cbd5e1",
                padding: "8px 12px",
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 700
              }}
            >
              Private Beta
            </span>

            <a
              href="#request-access"
              style={{
                textDecoration: "none",
                background: "#2563eb",
                color: "white",
                padding: "10px 16px",
                borderRadius: 12,
                fontSize: 13,
                fontWeight: 800
              }}
            >
              Request Access
            </a>
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
          <div
            style={{
              background: "linear-gradient(180deg, rgba(15, 23, 42, 0.92) 0%, rgba(15, 23, 42, 0.72) 100%)",
              border: "1px solid rgba(148, 163, 184, 0.18)",
              borderRadius: 28,
              padding: 32,
              boxShadow: "0 24px 60px rgba(2, 6, 23, 0.45)"
            }}
          >
            <div
              style={{
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
              }}
            >
              Invite-only access for political operators
            </div>

            <h1
              style={{
                margin: 0,
                fontSize: "clamp(42px, 7vw, 72px)",
                lineHeight: 0.95,
                letterSpacing: "-0.05em",
                color: "#f8fafc",
                fontWeight: 900
              }}
            >
              The premium intelligence layer for modern campaigns.
            </h1>

            <p
              style={{
                marginTop: 20,
                fontSize: 18,
                lineHeight: 1.65,
                maxWidth: 760,
                color: "#cbd5e1"
              }}
            >
              VoterSpheres helps consultants, campaign teams, and political vendors
              manage battleground visibility, candidate intelligence, contact
              verification, and operational execution from one command center.
            </p>

            <div
              style={{
                marginTop: 28,
                display: "flex",
                gap: 12,
                flexWrap: "wrap"
              }}
            >
              <a
                href="#request-access"
                style={{
                  textDecoration: "none",
                  background: "#2563eb",
                  color: "white",
                  padding: "14px 18px",
                  borderRadius: 14,
                  fontSize: 14,
                  fontWeight: 800
                }}
              >
                Request Private Beta Access
              </a>

              <a
                href="#platform"
                style={{
                  textDecoration: "none",
                  background: "rgba(15, 23, 42, 0.7)",
                  color: "#e2e8f0",
                  border: "1px solid rgba(148, 163, 184, 0.24)",
                  padding: "14px 18px",
                  borderRadius: 14,
                  fontSize: 14,
                  fontWeight: 800
                }}
              >
                Explore Platform
              </a>
            </div>

            <div
              style={{
                marginTop: 30,
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: 14
              }}
            >
              {metrics.map((item) => (
                <div
                  key={item.label}
                  style={{
                    background: "rgba(15, 23, 42, 0.62)",
                    border: "1px solid rgba(148, 163, 184, 0.16)",
                    borderRadius: 18,
                    padding: 18
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: "#94a3b8",
                      fontWeight: 700
                    }}
                  >
                    {item.label}
                  </div>
                  <div
                    style={{
                      marginTop: 10,
                      fontSize: 24,
                      lineHeight: 1.05,
                      fontWeight: 900,
                      letterSpacing: "-0.03em",
                      color: "#f8fafc"
                    }}
                  >
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            id="request-access"
            style={{
              background: "linear-gradient(180deg, rgba(15, 23, 42, 0.96) 0%, rgba(15, 23, 42, 0.82) 100%)",
              border: "1px solid rgba(148, 163, 184, 0.18)",
              borderRadius: 28,
              padding: 28,
              boxShadow: "0 24px 60px rgba(2, 6, 23, 0.45)"
            }}
          >
            <div
              style={{
                fontSize: 12,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "#93c5fd",
                fontWeight: 800
              }}
            >
              Request Access
            </div>

            <h2
              style={{
                marginTop: 10,
                marginBottom: 8,
                fontSize: 28,
                lineHeight: 1.1,
                letterSpacing: "-0.03em",
                fontWeight: 900,
                color: "#f8fafc"
              }}
            >
              Join the VoterSpheres private beta
            </h2>

            <p
              style={{
                margin: 0,
                fontSize: 14,
                lineHeight: 1.6,
                color: "#94a3b8"
              }}
            >
              Tell us who you are and how you operate. We’re onboarding qualified
              consultants, campaign teams, and political vendors first.
            </p>

            <form
              onSubmit={handleSubmit}
              style={{
                marginTop: 22,
                display: "grid",
                gap: 14
              }}
            >
              <input
                value={form.full_name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, full_name: e.target.value }))
                }
                placeholder="Full name"
                style={inputStyle}
              />

              <input
                value={form.firm_name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, firm_name: e.target.value }))
                }
                placeholder="Firm or organization"
                style={inputStyle}
              />

              <input
                value={form.email}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="Work email"
                type="email"
                style={inputStyle}
              />

              <input
                value={form.role}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, role: e.target.value }))
                }
                placeholder="Role"
                style={inputStyle}
              />

              <textarea
                value={form.notes}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="What would you use VoterSpheres for?"
                rows={5}
                style={{ ...inputStyle, resize: "vertical", minHeight: 120 }}
              />

              {message ? (
                <div
                  style={{
                    borderRadius: 14,
                    padding: "12px 14px",
                    fontSize: 13,
                    fontWeight: 700,
                    background:
                      messageTone === "success"
                        ? "rgba(22, 163, 74, 0.12)"
                        : "rgba(220, 38, 38, 0.12)",
                    border:
                      messageTone === "success"
                        ? "1px solid rgba(34, 197, 94, 0.28)"
                        : "1px solid rgba(248, 113, 113, 0.28)",
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
                {submitting ? "Submitting..." : "Request Access"}
              </button>
            </form>
          </div>
        </section>

        <section id="platform" style={{ marginTop: 28 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: 18
            }}
          >
            <div
              style={{
                background: "rgba(15, 23, 42, 0.72)",
                border: "1px solid rgba(148, 163, 184, 0.14)",
                borderRadius: 24,
                padding: 24
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "#93c5fd",
                  fontWeight: 800
                }}
              >
                Built for operators
              </div>

              <h3
                style={{
                  marginTop: 10,
                  marginBottom: 8,
                  fontSize: 30,
                  lineHeight: 1.08,
                  letterSpacing: "-0.03em",
                  fontWeight: 900,
                  color: "#f8fafc"
                }}
              >
                One intelligence layer across candidates, battlegrounds, vendors, and operations.
              </h3>

              <p
                style={{
                  margin: 0,
                  fontSize: 15,
                  lineHeight: 1.7,
                  color: "#cbd5e1",
                  maxWidth: 900
                }}
              >
                VoterSpheres is designed for serious political work. It combines live
                candidate intelligence, campaign contact enrichment, battleground
                pressure monitoring, and operational visibility into one premium platform.
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: 18
              }}
            >
              {features.map((item) => (
                <div
                  key={item.title}
                  style={{
                    background: "rgba(15, 23, 42, 0.72)",
                    border: "1px solid rgba(148, 163, 184, 0.14)",
                    borderRadius: 24,
                    padding: 24,
                    minHeight: 220
                  }}
                >
                  <div
                    style={{
                      fontSize: 18,
                      lineHeight: 1.15,
                      fontWeight: 900,
                      letterSpacing: "-0.02em",
                      color: "#f8fafc"
                    }}
                  >
                    {item.title}
                  </div>

                  <div
                    style={{
                      marginTop: 14,
                      fontSize: 14,
                      lineHeight: 1.7,
                      color: "#cbd5e1"
                    }}
                  >
                    {item.body}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section style={{ marginTop: 28 }}>
          <div
            style={{
              background: "rgba(15, 23, 42, 0.72)",
              border: "1px solid rgba(148, 163, 184, 0.14)",
              borderRadius: 24,
              padding: 24
            }}
          >
            <div
              style={{
                fontSize: 12,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "#93c5fd",
                fontWeight: 800
              }}
            >
              Ideal users
            </div>

            <div
              style={{
                marginTop: 16,
                display: "flex",
                gap: 12,
                flexWrap: "wrap"
              }}
            >
              {audiences.map((item) => (
                <div
                  key={item}
                  style={{
                    border: "1px solid rgba(148, 163, 184, 0.18)",
                    background: "rgba(30, 41, 59, 0.52)",
                    color: "#e2e8f0",
                    padding: "10px 14px",
                    borderRadius: 999,
                    fontSize: 13,
                    fontWeight: 700
                  }}
                >
                  {item}
                </div>
              ))}
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
          <div>© {new Date().getFullYear()} VoterSpheres. Private beta.</div>
          <div>Political intelligence for consultants, campaigns, and operators.</div>
        </footer>
      </div>
    </div>
  );
}

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
