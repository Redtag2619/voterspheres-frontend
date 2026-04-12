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
            <div
              className="vs-brand-mark"
              style={{ width: "38px", height: "38px", fontSize: "13px" }}
            >
              VS
            </div>

            <div>
              <div style={{ fontSize: "15px", fontWeight: 700 }}>
                VoterSpheres
              </div>
              <div style={{ fontSize: "11px", color: "var(--vs-text-muted)" }}>
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

        {announcement ? (
          <div
            className={getAnnouncementClass(announcementTone)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                lineHeight: 1.6,
                color: "inherit",
                minWidth: 0,
              }}
            >
              {announcement}
            </div>

            {announcementAction ? (
              <div style={{ flex: "0 0 auto" }}>{announcementAction}</div>
            ) : null}
          </div>
        ) : null}

        <section className="vs-card" style={{ padding: "20px" }}>
          {eyebrow ? <div className="vs-page-eyebrow">{eyebrow}</div> : null}

          {title ? (
            <h1
              style={{
                margin: "8px 0 0",
                fontSize: "clamp(24px, 3vw, 30px)",
                lineHeight: 1.02,
                fontWeight: 900,
                letterSpacing: "-0.04em",
                maxWidth: "860px",
              }}
            >
              {title}
            </h1>
          ) : null}

          {description ? (
            <div
              style={{
                marginTop: "10px",
                maxWidth: "860px",
                fontSize: "13px",
                lineHeight: 1.7,
                color: "var(--vs-text-muted)",
              }}
            >
              {description}
            </div>
          ) : null}

          {actions ? <div style={{ marginTop: "16px" }}>{actions}</div> : null}
        </section>

        {trustItems?.length ? (
          <section className="vs-card" style={{ padding: "14px 16px" }}>
            <div
              className="vs-grid-3"
              style={{ gap: "12px" }}
            >
              {trustItems.map((item, index) => (
                <div
                  key={`${item.label}-${index}`}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    minWidth: 0,
                  }}
                >
                  {item.dotClass ? <span className={item.dotClass} style={{ marginTop: "4px" }} /> : null}

                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        lineHeight: 1.4,
                        color: "var(--vs-text)",
                      }}
                    >
                      {item.label}
                    </div>

                    <div
                      style={{
                        marginTop: "3px",
                        fontSize: "11px",
                        lineHeight: 1.6,
                        color: "var(--vs-text-muted)",
                        wordBreak: "break-word",
                        overflowWrap: "anywhere",
                      }}
                    >
                      {item.value}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {children}
      </div>
    </div>
  );
}
