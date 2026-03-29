import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { getBillingDebug } from "../api/billing";
import OnboardingChecklist from "../components/OnboardingChecklist";
import { useAuth } from "../context/AuthContext";
import { useOnboardingChecklist } from "../hooks/useOnboardingChecklist";
import { normalizePlan } from "../lib/plan";

function StepCard({ number, title, text, ctaLabel, ctaTo }) {
  return (
    <div style={styles.stepCard}>
      <div style={styles.stepNumber}>{number}</div>
      <h3 style={styles.stepTitle}>{title}</h3>
      <p style={styles.stepText}>{text}</p>
      <Link to={ctaTo} style={styles.stepButton}>
        {ctaLabel}
      </Link>
    </div>
  );
}

export default function CheckoutSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, user, planTier, firmId } = useAuth();

  const [loading, setLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState(null);
  const [error, setError] = useState("");

  const requestedPlan = normalizePlan(searchParams.get("plan") || planTier || "starter");
  const success = searchParams.get("success") === "1" || true;

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login", { replace: true });
      return;
    }

    let isMounted = true;

    async function loadDebug() {
      try {
        setLoading(true);
        setError("");
        const data = await getBillingDebug();

        if (isMounted) {
          setDebugInfo(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err?.response?.data?.error ||
              err?.message ||
              "Unable to load your billing sync details right now."
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadDebug();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, navigate]);

  const livePlan = normalizePlan(debugInfo?.plan_tier || planTier || requestedPlan);

  const {
    items,
    progress,
    toggleComplete,
    resetChecklist,
  } = useOnboardingChecklist({
    userId: user?.id || user?.email || "user",
    firmId: firmId || debugInfo?.firm_id || "firm",
    planTier: livePlan,
  });

  const onboardingSteps = useMemo(() => {
    const base = [
      {
        number: "01",
        title: "Complete your workspace",
        text: "Set your campaign or firm foundation by reviewing your dashboard and verifying your access level.",
        ctaLabel: "Open Dashboard",
        ctaTo: "/",
      },
      {
        number: "02",
        title: "Review billing and sync",
        text: "Confirm your subscription, webhook sync, and active plan inside Billing.",
        ctaLabel: "Open Billing",
        ctaTo: "/billing",
      },
    ];

    if (livePlan === "starter") {
      base.push({
        number: "03",
        title: "Start organizing campaign operations",
        text: "Move into Campaign Pipeline or Firm Workspace to start using the platform immediately.",
        ctaLabel: "Open Campaign Pipeline",
        ctaTo: "/campaign-pipeline",
      });
    }

    if (livePlan === "pro") {
      base.push({
        number: "03",
        title: "Open your intelligence stack",
        text: "Jump into forecasting, rankings, and command tools to activate your Pro workflows.",
        ctaLabel: "Open Forecast",
        ctaTo: "/forecast",
      });
    }

    if (livePlan === "enterprise") {
      base.push({
        number: "03",
        title: "Activate enterprise intelligence",
        text: "Go straight into Fundraising or MailOps and start using your highest-value workflows.",
        ctaLabel: "Open Fundraising",
        ctaTo: "/fundraising",
      });
    }

    return base;
  }, [livePlan]);

  return (
    <div style={styles.page}>
      <div style={styles.heroWrap}>
        <div style={styles.heroBadge}>Subscription Activated</div>

        <h1 style={styles.title}>
          {success ? "You’re in — let’s get VoterSpheres working for you" : "Welcome to VoterSpheres"}
        </h1>

        <p style={styles.subtitle}>
          Your checkout is complete. This page walks you directly into the best next steps for your plan.
        </p>

        <div style={styles.statusGrid}>
          <div style={styles.statusCard}>
            <div style={styles.statusLabel}>Account</div>
            <div style={styles.statusValue}>
              {user?.email || user?.first_name || "Authenticated User"}
            </div>
          </div>

          <div style={styles.statusCard}>
            <div style={styles.statusLabel}>Requested Plan</div>
            <div style={styles.statusValue}>{requestedPlan.toUpperCase()}</div>
          </div>

          <div style={styles.statusCard}>
            <div style={styles.statusLabel}>Live Plan</div>
            <div style={styles.statusValue}>{livePlan.toUpperCase()}</div>
          </div>

          <div style={styles.statusCard}>
            <div style={styles.statusLabel}>Status</div>
            <div style={styles.statusValue}>
              {String(debugInfo?.status || "active").toUpperCase()}
            </div>
          </div>
        </div>

        {loading ? (
          <div style={styles.infoBox}>Checking your billing sync...</div>
        ) : error ? (
          <div style={styles.errorBox}>{error}</div>
        ) : (
          <div style={styles.infoBox}>
            Subscription sync looks active.
            {debugInfo?.last_webhook_event_type
              ? ` Last webhook: ${debugInfo.last_webhook_event_type}.`
              : ""}
          </div>
        )}
      </div>

      <section style={styles.section}>
        <OnboardingChecklist
          items={items}
          progress={progress}
          onToggle={toggleComplete}
          onReset={resetChecklist}
        />
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Your guided next steps</h2>
        <p style={styles.sectionSubtitle}>
          Follow these steps to get immediate value from your new plan.
        </p>

        <div style={styles.stepsGrid}>
          {onboardingSteps.map((step) => (
            <StepCard key={step.number} {...step} />
          ))}
        </div>
      </section>

      <section style={styles.section}>
        <div style={styles.quickLinksCard}>
          <h2 style={styles.sectionTitle}>Quick launch</h2>
          <p style={styles.sectionSubtitle}>
            Jump directly into the areas that matter most right now.
          </p>

          <div style={styles.quickLinks}>
            <Link to="/" style={styles.quickLink}>
              Dashboard
            </Link>
            <Link to="/billing" style={styles.quickLink}>
              Billing
            </Link>
            <Link to="/pricing" style={styles.quickLink}>
              Pricing
            </Link>
            <Link to="/candidates" style={styles.quickLink}>
              Candidates
            </Link>

            {livePlan === "starter" && (
              <>
                <Link to="/campaign-pipeline" style={styles.quickLink}>
                  Campaign Pipeline
                </Link>
                <Link to="/firm-workspace" style={styles.quickLink}>
                  Firm Workspace
                </Link>
              </>
            )}

            {livePlan === "pro" && (
              <>
                <Link to="/forecast" style={styles.quickLink}>
                  Forecast
                </Link>
                <Link to="/rankings" style={styles.quickLink}>
                  Rankings
                </Link>
                <Link to="/command-center" style={styles.quickLink}>
                  Command Center
                </Link>
              </>
            )}

            {livePlan === "enterprise" && (
              <>
                <Link to="/fundraising" style={styles.quickLink}>
                  Fundraising
                </Link>
                <Link to="/mailops" style={styles.quickLink}>
                  MailOps
                </Link>
                <Link to="/executive-dashboard" style={styles.quickLink}>
                  Executive Dashboard
                </Link>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    color: "#fff",
    background:
      "radial-gradient(circle at top, rgba(37,99,235,0.15) 0%, rgba(11,16,32,1) 35%, rgba(15,23,42,1) 100%)",
    padding: "40px 24px 64px",
  },
  heroWrap: {
    maxWidth: "1100px",
    margin: "0 auto 32px",
  },
  heroBadge: {
    display: "inline-block",
    padding: "7px 12px",
    borderRadius: "999px",
    background: "#1d4ed8",
    fontSize: "0.82rem",
    fontWeight: 700,
    marginBottom: "14px",
  },
  title: {
    margin: 0,
    fontSize: "clamp(2.2rem, 5vw, 4rem)",
    lineHeight: 1.04,
    fontWeight: 900,
    maxWidth: "900px",
  },
  subtitle: {
    marginTop: "16px",
    maxWidth: "760px",
    color: "#cbd5e1",
    lineHeight: 1.8,
    fontSize: "1.04rem",
  },
  statusGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "14px",
    marginTop: "24px",
  },
  statusCard: {
    background: "rgba(17,24,39,0.96)",
    border: "1px solid #334155",
    borderRadius: "18px",
    padding: "18px",
  },
  statusLabel: {
    color: "#94a3b8",
    fontSize: "0.86rem",
    marginBottom: "8px",
  },
  statusValue: {
    fontSize: "1rem",
    fontWeight: 800,
  },
  infoBox: {
    marginTop: "18px",
    padding: "14px 16px",
    borderRadius: "14px",
    background: "#111827",
    border: "1px solid #334155",
    color: "#dbeafe",
  },
  errorBox: {
    marginTop: "18px",
    padding: "14px 16px",
    borderRadius: "14px",
    background: "#34181b",
    border: "1px solid #7f1d1d",
    color: "#fecaca",
  },
  section: {
    maxWidth: "1100px",
    margin: "0 auto 28px",
  },
  sectionTitle: {
    margin: 0,
    fontSize: "1.9rem",
    fontWeight: 900,
  },
  sectionSubtitle: {
    marginTop: "10px",
    color: "#94a3b8",
    lineHeight: 1.7,
  },
  stepsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "18px",
    marginTop: "22px",
  },
  stepCard: {
    background: "rgba(17,24,39,0.96)",
    border: "1px solid #334155",
    borderRadius: "20px",
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  stepNumber: {
    color: "#60a5fa",
    fontWeight: 900,
    fontSize: "0.9rem",
    letterSpacing: "0.08em",
  },
  stepTitle: {
    margin: 0,
    fontSize: "1.2rem",
    fontWeight: 800,
  },
  stepText: {
    margin: 0,
    color: "#cbd5e1",
    lineHeight: 1.7,
  },
  stepButton: {
    marginTop: "4px",
    display: "inline-block",
    padding: "12px 16px",
    borderRadius: "12px",
    background: "#2563eb",
    color: "#fff",
    textDecoration: "none",
    fontWeight: 800,
    alignSelf: "flex-start",
  },
  quickLinksCard: {
    background: "rgba(17,24,39,0.96)",
    border: "1px solid #334155",
    borderRadius: "20px",
    padding: "24px",
  },
  quickLinks: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    marginTop: "18px",
  },
  quickLink: {
    padding: "11px 14px",
    borderRadius: "12px",
    background: "#111827",
    border: "1px solid #334155",
    color: "#dbeafe",
    textDecoration: "none",
    fontWeight: 700,
  },
};
