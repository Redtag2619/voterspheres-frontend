import { Link } from "react-router-dom";

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
  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, rgba(245,158,11,0.08), transparent 24%), linear-gradient(180deg, #0b0f14 0%, #0a0d12 100%)",
        padding: "24px 20px 40px",
      }}
    >
      <div
        style={{
          width: "min(1180px, 100%)",
          margin: "0 auto",
          display: "grid",
          gap: "18px",
        }}
      >
        {/* HEADER */}
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

        {/* ANNOUNCEMENT */}
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

        {/* HERO */}
        <section className="vs-card" style={{ padding: "20px" }}>
          {eyebrow && <div className="vs-page-eyebrow">{eyebrow}</div>}

          {title && (
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
          )}

          {description && (
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
          )}

          {actions && <div style={{ marginTop: 16 }}>{actions}</div>}
        </section>

        {/* TRUST STRIP */}
        {trustItems?.length && (
          <section className="vs-card" style={{ padding: "14px 16px" }}>
            <div className="vs-grid-3">
              {trustItems.map((item, i) => (
                <div key={i} style={{ display: "flex", gap: "10px" }}>
                  {item.dotClass && <span className={item.dotClass} />}
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
        )}

        {/* PAGE CONTENT */}
        {children}

        {/* GLOBAL CTA STRIP */}
        {showCTA && (
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
              }}
            >
              Launch your firm workspace, activate intelligence workflows,
              and bring execution, MailOps, and fundraising into one system.
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

              <Link to="/pricing" className="vs-button vs-button-secondary">
                View Plans
              </Link>

              <Link to="/login" className="vs-button vs-button-secondary">
                Sign In
              </Link>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
