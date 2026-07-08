import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Badge from "../components/ui/Badge";
import SectionCard from "../components/ui/SectionCard";
import EmptyState from "../components/ui/EmptyState";
import PageShell from "../components/ui/PageShell";
import StatCard from "../components/ui/StatCard";
import ExecutivePageNav from "../components/ui/ExecutivePageNav";
import CollapsibleSection from "../components/ui/CollapsibleSection";
import BackToTopButton from "../components/ui/BackToTopButton";
import ShowMoreList from "../components/ui/ShowMoreList";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext.jsx";

const PLANS = [
  {
    key: "starter",
    name: "Starter",
    price: "$99/mo",
    description: "Core campaign operating system for smaller teams.",
    features: [
      "Executive dashboard",
      "Core workspaces",
      "Candidate and vendor visibility",
      "Basic MailOps tracking",
    ],
  },
  {
    key: "pro",
    name: "Pro",
    price: "$149/mo",
    description: "Advanced execution, reporting, and intelligence workflows.",
    features: [
      "Everything in Starter",
      "Scheduled reports",
      "Command Center workflows",
      "AI War Room access",
    ],
  },
  {
    key: "enterprise",
    name: "Enterprise",
    price: "$499/mo",
    description: "Premium multi-workstream control layer for serious firms.",
    features: [
      "Everything in Pro",
      "Unlimited scheduled reports",
      "Enterprise workflow support",
      "Full-platform operations visibility",
    ],
  },
];

function normalizePlan(value = "starter") {
  const plan = String(value || "starter").toLowerCase();
  if (plan === "enterprise") return "enterprise";
  if (plan === "pro") return "pro";
  return "starter";
}

function formatDate(value) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getPriceId(config = {}, planKey = "") {
  return (
    config?.prices?.[planKey] ||
    config?.priceIds?.[planKey] ||
    config?.[`price_${planKey}`] ||
    config?.[`stripe_price_${planKey}`] ||
    config?.[planKey] ||
    ""
  );
}

function statusTone(status = "") {
  const value = String(status || "").toLowerCase();

  if (value === "active" || value === "trialing") return "active";
  if (value === "past_due" || value === "unpaid") return "danger";
  if (value === "canceled" || value === "inactive") return "default";

  return "demo";
}

function planRank(plan) {
  const order = { starter: 1, pro: 2, enterprise: 3 };
  return order[normalizePlan(plan)] || 1;
}

function billingHealthText(status = "") {
  const value = String(status || "").toLowerCase();
  if (value === "active" || value === "trialing") return "Billing is active and platform access is in good standing.";
  if (value === "past_due" || value === "unpaid") return "Payment requires attention. Open the Stripe portal to update billing details.";
  if (value === "canceled" || value === "inactive") return "Subscription appears inactive. Choose a plan or contact support to restore access.";
  return "Billing status is available. Review Stripe portal for complete invoice and payment details.";
}

function billingReadinessScore({ currentPlan, subscriptionStatus, firm }) {
  const status = String(subscriptionStatus || "").toLowerCase();
  const hasCustomer = Boolean(firm?.stripe_customer_id);
  const hasPeriodEnd = Boolean(firm?.current_period_end);
  const rank = planRank(currentPlan);

  let score = 62 + rank * 8;
  if (status === "active" || status === "trialing") score += 16;
  if (status === "past_due" || status === "unpaid") score -= 36;
  if (status === "canceled" || status === "inactive") score -= 44;
  if (hasCustomer) score += 8;
  if (hasPeriodEnd) score += 4;

  return Math.max(5, Math.min(100, Math.round(score)));
}

function BillingExecutiveHeader({
  currentPlanDetails,
  currentPlan,
  subscriptionStatus,
  firm,
  loading,
  portalBusy,
  busyPlan,
  onRefresh,
  onPortal,
}) {
  const readinessScore = billingReadinessScore({ currentPlan, subscriptionStatus, firm });
  const stripeLinked = Boolean(firm?.stripe_customer_id);
  const periodEnd = formatDate(firm?.current_period_end);

  return (
    <div className="billing-exec-ribbon" id="billing-overview">
      <div className="billing-exec-copy">
        <span>Billing Readiness</span>
        <strong>{readinessScore}% Ready</strong>
        <p>
          Executive billing center for plan access, Stripe health, renewal visibility,
          enterprise support, upgrade paths, invoice management, and firm subscription status.
        </p>

        <div className="billing-exec-badges">
          <Badge tone="active">{currentPlanDetails.name}</Badge>
          <Badge tone={statusTone(subscriptionStatus)}>{subscriptionStatus || "active"}</Badge>
          <Badge tone={stripeLinked ? "active" : "demo"}>{stripeLinked ? "Stripe Linked" : "Stripe Pending"}</Badge>
          <Badge tone={currentPlan === "enterprise" ? "active" : "accent"}>{currentPlan === "enterprise" ? "Enterprise" : "Upgrade Available"}</Badge>
        </div>
      </div>

      <div className="billing-exec-grid">
        <div>
          <span>Current Plan</span>
          <strong>{currentPlanDetails.name}</strong>
        </div>
        <div>
          <span>Plan Price</span>
          <strong>{currentPlanDetails.price}</strong>
        </div>
        <div>
          <span>Period Ends</span>
          <strong>{periodEnd}</strong>
        </div>
        <div>
          <span>Billing Status</span>
          <strong>{loading || portalBusy || busyPlan ? "Working" : "Ready"}</strong>
        </div>
      </div>

      <div className="billing-exec-actions">
        <button type="button" onClick={onRefresh} disabled={loading}>
          {loading ? "Refreshing Billing..." : "Refresh Billing"}
        </button>
        <button type="button" onClick={onPortal} disabled={portalBusy}>
          {portalBusy ? "Opening Portal..." : "Open Stripe Portal"}
        </button>
        <button type="button" onClick={() => document.getElementById("billing-plans")?.scrollIntoView({ behavior: "smooth", block: "start" })}>
          Change Plan
        </button>
        <Link to="/mission-control">Mission Control</Link>
        <Link to="/command-center">Command Center</Link>
        <Link to="/executive-decision-intelligence">Executive Intelligence</Link>
      </div>

      <div className="billing-exec-footer">
        <span>Firm: {firm?.firm_name || firm?.name || "Your Firm"}</span>
        <span>Stripe Customer: {firm?.stripe_customer_id || "Not linked yet"}</span>
      </div>
    </div>
  );
}

function BillingExecutiveBrief({ currentPlanDetails, currentPlan, subscriptionStatus, firm }) {
  const readinessScore = billingReadinessScore({ currentPlan, subscriptionStatus, firm });
  const stripeLinked = Boolean(firm?.stripe_customer_id);

  return (
    <div className="billing-ai-brief">
      <strong>Executive Billing Brief</strong>
      <p>
        The firm is currently on the {currentPlanDetails.name} plan at {currentPlanDetails.price}.
        Subscription status is {subscriptionStatus || "active"}. {billingHealthText(subscriptionStatus)}
        {stripeLinked ? " Stripe customer linkage is active." : " Stripe customer linkage is not visible yet."}
      </p>

      <div className="billing-ai-brief-grid">
        <div><span>Readiness</span><b>{readinessScore}%</b></div>
        <div><span>Plan</span><b>{currentPlanDetails.name}</b></div>
        <div><span>Status</span><b>{subscriptionStatus || "active"}</b></div>
        <div><span>Renewal</span><b>{formatDate(firm?.current_period_end)}</b></div>
      </div>
    </div>
  );
}

function BillingActionCenter({ onRefresh, onPortal, portalBusy }) {
  return (
    <div className="billing-action-center">
      <button type="button" onClick={onRefresh}>Refresh Billing</button>
      <button type="button" onClick={onPortal} disabled={portalBusy}>
        {portalBusy ? "Opening Portal..." : "Open Stripe Portal"}
      </button>
      <button type="button" onClick={() => document.getElementById("billing-plans")?.scrollIntoView({ behavior: "smooth", block: "start" })}>
        Review Plans
      </button>
      <Link to="/pricing?upgrade=enterprise">Enterprise Pricing</Link>
      <Link to="/enterprise">Enterprise Support</Link>
      <Link to="/enterprise-leads">Enterprise Pipeline</Link>
      <Link to="/mission-control">Mission Control</Link>
      <Link to="/command-center">Command Center</Link>
      <Link to="/ai-war-room">AI War Room</Link>
    </div>
  );
}

export default function Billing() {
  const { refreshMe } = useAuth();

  const [loading, setLoading] = useState(true);
  const [busyPlan, setBusyPlan] = useState("");
  const [portalBusy, setPortalBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [config, setConfig] = useState(null);
  const [debug, setDebug] = useState(null);

  async function loadBilling() {
    try {
      setLoading(true);
      setError("");

      const [billingConfig, billingDebug] = await Promise.all([
        api.billingConfig(),
        api.billingDebug(),
      ]);

      setConfig(billingConfig || {});
      setDebug(billingDebug || {});

      await refreshMe?.();
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Unable to load billing information."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBilling();
  }, []);

  const firm = debug?.firm || debug || {};
  const currentPlan = normalizePlan(
    firm?.plan_tier ||
      firm?.planTier ||
      debug?.auth?.planTier ||
      debug?.plan_tier ||
      "starter"
  );

  const subscriptionStatus =
    firm?.subscription_status || firm?.status || debug?.status || "active";

  const currentPlanDetails = useMemo(
    () => PLANS.find((plan) => plan.key === currentPlan) || PLANS[0],
    [currentPlan]
  );

  async function startCheckout(plan) {
    try {
      setBusyPlan(plan.key);
      setError("");
      setMessage("");

      const priceId = getPriceId(config, plan.key);

      if (!priceId) {
        throw new Error(`Missing Stripe price ID for ${plan.name}.`);
      }

      const origin = window.location.origin;
      const successUrl = `${origin}/dashboard?checkout=success&plan=${encodeURIComponent(
        plan.key
      )}`;
      const cancelUrl = `${origin}/billing?checkout=cancelled`;

      const response = await api.createCheckoutSession({
        priceId,
        plan: plan.key,
        successUrl,
        cancelUrl,
      });

      const url =
        response?.url ||
        response?.checkout_url ||
        response?.session?.url ||
        "";

      if (!url) {
        throw new Error("Checkout session did not return a URL.");
      }

      window.location.href = url;
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Unable to start checkout."
      );
    } finally {
      setBusyPlan("");
    }
  }

  async function openPortal() {
    try {
      setPortalBusy(true);
      setError("");
      setMessage("");

      const origin = window.location.origin;

      const response = await api.createPortalSession({
        returnUrl: `${origin}/billing`,
      });

      const url =
        response?.url ||
        response?.portal_url ||
        response?.session?.url ||
        "";

      if (!url) {
        throw new Error("Billing portal did not return a URL.");
      }

      window.location.href = url;
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Unable to open billing portal."
      );
    } finally {
      setPortalBusy(false);
    }
  }

  if (loading) {
    return (
      <PageShell
        eyebrow="Billing Management"
        title="Billing Management Center"
        description="Loading subscription details, Stripe status, and firm plan access."
        tickerItems={[
          { label: "Billing", value: "Loading", dotClass: "vs-live-dot-warning" },
        ]}
      >
        <EmptyState text="Loading billing center..." />
      </PageShell>
    );
  }

  const readinessScore = billingReadinessScore({ currentPlan, subscriptionStatus, firm });

  const navSections = [
    { id: "billing-overview", label: "Overview" },
    { id: "billing-metrics", label: "Metrics" },
    { id: "billing-current", label: "Subscription" },
    { id: "billing-health", label: "Payment Health" },
    { id: "billing-plans", label: "Plans", badge: PLANS.length },
    { id: "billing-invoices", label: "Invoices" },
    { id: "billing-enterprise", label: "Enterprise" },
    { id: "billing-brief", label: "Brief" },
    { id: "billing-actions", label: "Actions" },
  ];

  return (
    <PageShell
      eyebrow="Billing Management"
      title="Billing Management Center"
      description="Manage plan access, Stripe billing, subscription status, invoices, enterprise support, and upgrade paths for your firm."
      tickerItems={[
        { label: "Plan", value: currentPlanDetails.name, dotClass: "vs-live-dot-success" },
        { label: "Status", value: subscriptionStatus || "active", dotClass: ["active", "trialing"].includes(String(subscriptionStatus || "").toLowerCase()) ? "vs-live-dot-success" : "vs-live-dot-warning" },
        { label: "Readiness", value: `${readinessScore}%`, dotClass: readinessScore >= 80 ? "vs-live-dot-success" : "vs-live-dot-warning" },
        { label: "Renewal", value: formatDate(firm?.current_period_end), dotClass: "vs-live-dot-success" },
      ]}
    >
      <style>{`
        .billing-exec-ribbon {
          display: grid;
          grid-template-columns: minmax(300px, 0.95fr) minmax(0, 1.15fr);
          gap: 18px;
          align-items: stretch;
          border: 1px solid rgba(148, 163, 184, 0.16);
          border-radius: 28px;
          background:
            radial-gradient(circle at top right, rgba(34, 197, 94, 0.16), transparent 34%),
            radial-gradient(circle at bottom left, rgba(59, 130, 246, 0.14), transparent 30%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.94), rgba(2, 6, 23, 0.86));
          box-shadow: 0 28px 80px rgba(2, 6, 23, 0.32);
          padding: 20px;
          min-width: 0;
          overflow: hidden;
        }

        .billing-exec-copy { min-width: 0; }

        .billing-exec-copy span,
        .billing-exec-grid span,
        .billing-exec-footer span,
        .billing-ai-brief-grid span {
          display: block;
          color: rgba(147, 197, 253, 0.86);
          font-size: 11px;
          font-weight: 950;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .billing-exec-copy strong {
          display: block;
          margin-top: 8px;
          color: white;
          font-size: clamp(30px, 4vw, 50px);
          line-height: 1;
          font-weight: 950;
          letter-spacing: -0.07em;
        }

        .billing-exec-copy p {
          margin: 12px 0 0;
          color: rgba(226, 232, 240, 0.78);
          line-height: 1.6;
          max-width: 820px;
        }

        .billing-exec-badges,
        .billing-exec-actions,
        .billing-exec-footer,
        .billing-action-center {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          align-items: center;
        }

        .billing-exec-badges { margin-top: 14px; }

        .billing-exec-grid,
        .billing-ai-brief-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          min-width: 0;
        }

        .billing-exec-grid div,
        .billing-ai-brief-grid div {
          border: 1px solid rgba(148, 163, 184, 0.14);
          border-radius: 18px;
          background: rgba(2, 6, 23, 0.34);
          padding: 14px;
          min-width: 0;
        }

        .billing-exec-grid strong,
        .billing-ai-brief-grid b {
          display: block;
          margin-top: 7px;
          color: white;
          font-size: 20px;
          font-weight: 950;
          overflow-wrap: anywhere;
        }

        .billing-exec-actions,
        .billing-exec-footer {
          grid-column: 1 / -1;
          border-top: 1px solid rgba(148, 163, 184, 0.12);
          padding-top: 14px;
        }

        .billing-exec-actions button,
        .billing-exec-actions a,
        .billing-action-center button,
        .billing-action-center a {
          border: 1px solid rgba(148, 163, 184, 0.18);
          background: rgba(15, 23, 42, 0.74);
          color: rgba(226, 232, 240, 0.92);
          border-radius: 15px;
          padding: 11px 12px;
          font-size: 12px;
          font-weight: 850;
          cursor: pointer;
          text-decoration: none;
        }

        .billing-exec-actions button:hover,
        .billing-exec-actions a:hover,
        .billing-action-center button:hover,
        .billing-action-center a:hover {
          border-color: rgba(74, 222, 128, 0.42);
          background: rgba(34, 197, 94, 0.14);
          color: white;
        }

        .billing-exec-actions button:disabled,
        .billing-action-center button:disabled {
          opacity: 0.62;
          cursor: not-allowed;
        }

        .billing-exec-stack {
          display: grid;
          gap: 18px;
          min-width: 0;
        }

        .billing-ai-brief {
          border-radius: 24px;
          border: 1px solid rgba(96, 165, 250, 0.24);
          background:
            radial-gradient(circle at top right, rgba(37, 99, 235, 0.18), transparent 36%),
            rgba(15, 23, 42, 0.58);
          padding: 18px;
        }

        .billing-ai-brief strong {
          display: block;
          color: white;
          font-size: 20px;
          font-weight: 950;
          letter-spacing: -0.04em;
        }

        .billing-ai-brief p {
          color: rgba(226, 232, 240, 0.86);
          font-size: 13px;
          line-height: 1.65;
          margin: 10px 0 14px;
        }

        @media (max-width: 1100px) {
          .billing-exec-ribbon,
          .billing-exec-grid,
          .billing-ai-brief-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="billing-exec-stack">
        <BillingExecutiveHeader
          currentPlanDetails={currentPlanDetails}
          currentPlan={currentPlan}
          subscriptionStatus={subscriptionStatus}
          firm={firm}
          loading={loading}
          portalBusy={portalBusy}
          busyPlan={busyPlan}
          onRefresh={loadBilling}
          onPortal={openPortal}
        />

        <ExecutivePageNav sections={navSections} />
      </div>

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

      {message ? (
        <div
          className="vs-banner"
          style={{
            borderColor: "#bbf7d0",
            background: "#f0fdf4",
            color: "#166534",
          }}
        >
          {message}
        </div>
      ) : null}

      <CollapsibleSection
        id="billing-metrics"
        title="Billing Metrics"
        subtitle="Current plan, subscription health, Stripe linkage, and renewal readiness."
        defaultOpen
        right={<Badge tone={statusTone(subscriptionStatus)}>{subscriptionStatus}</Badge>}
      >
        <div className="vs-grid-3">
          <StatCard label="Billing Readiness" value={`${readinessScore}%`} delta="Executive account health" tone={readinessScore >= 80 ? "up" : "neutral"} />
          <StatCard label="Current Plan" value={currentPlanDetails.name} delta={currentPlanDetails.price} tone="up" />
          <StatCard label="Subscription" value={subscriptionStatus || "active"} delta="Stripe status" tone={["active", "trialing"].includes(String(subscriptionStatus || "").toLowerCase()) ? "up" : "down"} />
        </div>
      </CollapsibleSection>

      <div className="vs-grid-2">
        <div id="billing-current">
        <SectionCard
          title="Current Subscription"
          subtitle="Your active firm plan and Stripe subscription state."
          right={<Badge tone={statusTone(subscriptionStatus)}>{subscriptionStatus}</Badge>}
        >
          <div className="vs-stack">
            <div className="vs-card-muted">
              <div className="vs-stat-label">Current Plan</div>
              <div style={{ fontSize: 30, fontWeight: 900, marginTop: 6 }}>
                {currentPlanDetails.name}
              </div>
              <div style={{ color: "var(--vs-text-muted)", marginTop: 6 }}>
                {currentPlanDetails.price}
              </div>
            </div>

            <div className="vs-grid-2">
              <div className="vs-card-muted">
                <div className="vs-stat-label">Subscription Status</div>
                <div style={{ marginTop: 6, fontWeight: 800 }}>
                  {subscriptionStatus || "active"}
                </div>
              </div>

              <div className="vs-card-muted">
                <div className="vs-stat-label">Current Period Ends</div>
                <div style={{ marginTop: 6, fontWeight: 800 }}>
                  {formatDate(firm?.current_period_end)}
                </div>
              </div>
            </div>

            <div className="vs-card-muted">
              <div className="vs-stat-label">Firm</div>
              <div style={{ marginTop: 6, fontWeight: 800 }}>
                {firm?.firm_name || firm?.name || "Your Firm"}
              </div>
              <div style={{ marginTop: 5, color: "var(--vs-text-muted)" }}>
                Stripe Customer: {firm?.stripe_customer_id || "Not linked yet"}
              </div>
            </div>
          </div>
        </SectionCard>
        </div>

        <div id="billing-health">
        <SectionCard
          title="Payment Health"
          subtitle="Keep the firmâ€™s access in good standing."
          right={
            <Badge tone={statusTone(subscriptionStatus)}>
              {String(subscriptionStatus || "active").toUpperCase()}
            </Badge>
          }
        >
          <div className="vs-stack">
            {String(subscriptionStatus).toLowerCase() === "past_due" ? (
              <div
                className="vs-banner"
                style={{
                  borderColor: "#fecaca",
                  background: "#fef2f2",
                  color: "#b91c1c",
                }}
              >
                Payment is past due. Open the Stripe portal to update payment
                details.
              </div>
            ) : (
              <div
                className="vs-banner"
                style={{
                  borderColor: "#bbf7d0",
                  background: "#f0fdf4",
                  color: "#166534",
                }}
              >
                Billing is active. Your platform access is in good standing.
              </div>
            )}

            <button
              type="button"
              className="vs-button"
              onClick={openPortal}
              disabled={portalBusy}
            >
              {portalBusy ? "Opening Portal..." : "Manage Payment Method"}
            </button>

            <div style={{ color: "var(--vs-text-muted)", fontSize: 13, lineHeight: 1.6 }}>
              Invoices, payment methods, cancellation, and subscription changes
              are handled securely through Stripe.
            </div>
          </div>
        </SectionCard>
        </div>
      </div>

      <CollapsibleSection
        id="billing-plans"
        title="Change Plan"
        subtitle="Upgrade or manage firm access. Checkout returns to VoterSpheres and refreshes access automatically."
      >
        <div className="vs-grid-3">
          <ShowMoreList
            items={PLANS}
            initialCount={3}
            showAllLabel={(count) => `Show All ${count} Plans`}
            className="vs-grid-3"
            renderItem={(plan) => {
            const isCurrent = plan.key === currentPlan;
            const isUpgrade =
              PLANS.findIndex((item) => item.key === plan.key) >
              PLANS.findIndex((item) => item.key === currentPlan);

            return (
              <div
                key={plan.key}
                className="vs-card"
                style={{
                  padding: 18,
                  display: "grid",
                  gap: 12,
                  borderColor: isCurrent
                    ? "rgba(34,197,94,0.45)"
                    : "var(--vs-border)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 900 }}>{plan.name}</div>
                    <div style={{ marginTop: 4, color: "var(--vs-text-muted)" }}>
                      {plan.price}
                    </div>
                  </div>

                  {isCurrent ? <Badge tone="active">Current</Badge> : null}
                  {!isCurrent && isUpgrade ? <Badge tone="accent">Upgrade</Badge> : null}
                </div>

                <div style={{ color: "var(--vs-text-muted)", fontSize: 13, lineHeight: 1.6 }}>
                  {plan.description}
                </div>

                <div className="vs-stack">
                  {plan.features.map((feature) => (
                    <div
                      key={feature}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "10px 1fr",
                        gap: 10,
                        alignItems: "start",
                        color: "var(--vs-text-muted)",
                        fontSize: 12,
                        lineHeight: 1.6,
                      }}
                    >
                      <span className="vs-live-dot-success" style={{ marginTop: 6 }} />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                {isCurrent ? (
                  <button
                    type="button"
                    className="vs-button vs-button-secondary"
                    onClick={openPortal}
                  >
                    Manage Current Plan
                  </button>
                ) : (
                  <button
                    type="button"
                    className="vs-button"
                    onClick={() => startCheckout(plan)}
                    disabled={busyPlan === plan.key}
                  >
                    {busyPlan === plan.key
                      ? "Opening checkout..."
                      : isUpgrade
                        ? `Upgrade to ${plan.name}`
                        : `Switch to ${plan.name}`}
                  </button>
                )}
              </div>
            );
          }}
          />
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        id="billing-invoices"
        title="Invoice History"
        subtitle="Stripe manages invoice records and receipts."
        right={
          <button
            type="button"
            className="vs-button vs-button-secondary"
            onClick={openPortal}
            disabled={portalBusy}
          >
            View in Stripe
          </button>
        }
      >
        <EmptyState text="Open the Stripe portal to view receipts, invoices, payment methods, and subscription history." />
      </CollapsibleSection>

      <CollapsibleSection
        id="billing-enterprise"
        title="Enterprise Support"
        subtitle="Need procurement, onboarding, multi-firm operations, or a white-glove rollout?"
      >
        <div className="vs-inline-actions">
          <Link to="/pricing?upgrade=enterprise" className="vs-button">
            Contact Enterprise Sales
          </Link>

          <Link to="/enterprise" className="vs-button">
            Contact Enterprise Sales
          </Link>

          <Link to="/enterprise-leads" className="vs-button vs-button-secondary">
            View Enterprise Pipeline
          </Link>

          <Link to="/pricing?upgrade=enterprise" className="vs-button vs-button-secondary">
            Review Enterprise Plan   
          </Link>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        id="billing-brief"
        title="Executive Billing Brief"
        subtitle="Subscription health, plan posture, Stripe linkage, and renewal summary."
        defaultOpen={false}
        right={<Badge tone={statusTone(subscriptionStatus)}>{subscriptionStatus}</Badge>}
      >
        <BillingExecutiveBrief
          currentPlanDetails={currentPlanDetails}
          currentPlan={currentPlan}
          subscriptionStatus={subscriptionStatus}
          firm={firm}
        />
      </CollapsibleSection>

      <CollapsibleSection
        id="billing-actions"
        title="Executive Action Center"
        subtitle="Manage billing and move into connected VoterSpheres command modules."
        defaultOpen={false}
        right={<Badge tone="active">Billing Handoff</Badge>}
      >
        <BillingActionCenter
          onRefresh={loadBilling}
          onPortal={openPortal}
          portalBusy={portalBusy}
        />
      </CollapsibleSection>

      <BackToTopButton />
    </PageShell>
  );
}
