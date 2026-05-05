import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Badge from "../components/ui/Badge";
import PublicPageShell from "../components/layout/PublicPageShell.jsx";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext.jsx";
import { useWorkspace } from "../context/WorkspaceContext.jsx";

const tiers = [
  {
    key: "starter",
    name: "Starter",
    price: "$99",
    period: "/month",
    tone: "default",
    cta: "Start with Starter",
    priceKey: "starter",
    description:
      "For emerging firms and smaller campaigns that need a clear command layer, visibility, and a professional operating system.",
    includes: [
      "Executive dashboard with campaign overview",
      "Candidates, map, donor network, and forecast access",
      "Vendor and consultant directory workflows",
      "Basic MailOps visibility and event tracking",
      "Shared firm workspace and core CRM records",
      "Secure account access for small teams",
    ],
  },
  {
    key: "pro",
    name: "Pro",
    price: "$149",
    period: "/month",
    tone: "accent",
    featured: true,
    cta: "Upgrade to Pro",
    priceKey: "pro",
    description:
      "For active consulting firms that need tighter execution, more intelligence depth, and automated client reporting.",
    includes: [
      "Everything in Starter",
      "Command Center and AI War Room workflows",
      "Advanced fundraising and rankings visibility",
      "Scheduled workspace reports",
      "Operational MailOps composer and live event updates",
      "Higher-value intelligence workflows for campaign management",
    ],
  },
  {
    key: "enterprise",
    name: "Enterprise",
    price: "$499",
    period: "/month",
    tone: "danger",
    cta: "Go Enterprise",
    priceKey: "enterprise",
    description:
      "For high-volume firms and serious campaign operators who need a premium control layer, live operations, and full-platform execution support.",
    includes: [
      "Everything in Pro",
      "Unlimited scheduled reports",
      "Full platform access for multi-workstream operations",
      "Live intelligence fusion across dashboard, map, war room, and MailOps",
      "Enterprise-grade workflow support for campaign execution",
      "Best fit for top-tier political consulting organizations",
    ],
  },
];

function getUpgradeParams(search = "") {
  const params = new URLSearchParams(search);
  return {
    upgrade: String(params.get("upgrade") || "").toLowerCase(),
    source: params.get("source") || "",
    message: params.get("message") || "",
  };
}

function getPriceId(config = {}, tier = {}) {
  const key = tier.priceKey || tier.key;

  return (
    config?.prices?.[key] ||
    config?.priceIds?.[key] ||
    config?.[`price_${key}`] ||
    config?.[`stripe_price_${key}`] ||
    config?.[key] ||
    ""
  );
}

function PricingCard({
  tier,
  recommended,
  authenticated,
  checkoutBusy,
  onCheckout,
}) {
  return (
    <div
      className="vs-card"
      style={{
        display: "grid",
        gap: "14px",
        padding: "18px",
        position: "relative",
        borderColor: recommended
          ? "rgba(37,99,235,0.56)"
          : tier.featured
            ? "rgba(245,158,11,0.42)"
            : "var(--vs-border)",
        boxShadow: recommended
          ? "0 18px 42px rgba(37,99,235,0.18)"
          : tier.featured
            ? "0 12px 32px rgba(245,158,11,0.12)"
            : "var(--vs-shadow)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: "10px" }}>
        <div>
          <div
            style={{
              fontSize: "18px",
              fontWeight: 800,
              letterSpacing: "-0.02em",
            }}
          >
            {tier.name}
          </div>
          <div
            style={{
              marginTop: "6px",
              fontSize: "12px",
              lineHeight: 1.6,
              color: "var(--vs-text-muted)",
            }}
          >
            {tier.description}
          </div>
        </div>

        <div style={{ display: "flex", gap: "6px", alignItems: "flex-start", flexWrap: "wrap" }}>
          {recommended ? <Badge tone="active">Recommended</Badge> : null}
          {tier.featured && !recommended ? <Badge tone="accent">Most Popular</Badge> : null}
        </div>
      </div>

      <div>
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: "6px",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              fontSize: "34px",
              lineHeight: 0.95,
              fontWeight: 900,
              letterSpacing: "-0.04em",
            }}
          >
            {tier.price}
          </div>
          <div
            style={{
              fontSize: "13px",
              color: "var(--vs-text-muted)",
              paddingBottom: "4px",
            }}
          >
            {tier.period}
          </div>
        </div>
      </div>

      <div className="vs-stack">
        {tier.includes.map((item) => (
          <div
            key={item}
            style={{
              display: "grid",
              gridTemplateColumns: "10px 1fr",
              gap: "10px",
              alignItems: "start",
              minWidth: 0,
            }}
          >
            <span className="vs-live-dot-success" style={{ marginTop: "5px" }} />
            <div
              style={{
                fontSize: "12px",
                lineHeight: 1.65,
                color: "var(--vs-text-muted)",
                wordBreak: "break-word",
                overflowWrap: "anywhere",
              }}
            >
              {item}
            </div>
          </div>
        ))}
      </div>

      {authenticated ? (
        <button
          type="button"
          className="vs-button vs-button-primary"
          style={{ width: "100%", justifyContent: "center" }}
          onClick={() => onCheckout(tier)}
          disabled={checkoutBusy === tier.key}
        >
          {checkoutBusy === tier.key ? "Opening checkout..." : tier.cta}
        </button>
      ) : (
        <Link
          to={`/signup?plan=${encodeURIComponent(tier.key)}`}
          className="vs-button vs-button-primary"
          style={{ width: "100%", justifyContent: "center" }}
        >
          {tier.cta}
        </Link>
      )}
    </div>
  );
}

export default function Pricing() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { activeWorkspaceId } = useWorkspace();

  const [checkoutBusy, setCheckoutBusy] = useState("");
  const [checkoutError, setCheckoutError] = useState("");

  const upgradeContext = useMemo(
    () => getUpgradeParams(location.search),
    [location.search]
  );

  const requiredPlan =
    upgradeContext.upgrade && tiers.some((tier) => tier.key === upgradeContext.upgrade)
      ? upgradeContext.upgrade
      : "";

  async function handleCheckout(tier) {
    try {
      setCheckoutBusy(tier.key);
      setCheckoutError("");

      const config = await api.billingConfig();
      const priceId = getPriceId(config, tier);

      if (!priceId) {
        throw new Error(`Missing Stripe price ID for ${tier.name}.`);
      }

      const origin = window.location.origin;
      const returnPath = activeWorkspaceId
        ? `/campaign-workspace/${activeWorkspaceId}`
        : "/dashboard";

      const successUrl = `${origin}${returnPath}?checkout=success&plan=${encodeURIComponent(tier.key)}`;
      const cancelUrl = `${origin}/pricing?upgrade=${encodeURIComponent(tier.key)}&checkout=cancelled`;

      const response = await api.createCheckoutSession({
        priceId,
        plan: tier.key,
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
    } catch (error) {
      setCheckoutError(
        error?.response?.data?.error ||
          error?.message ||
          "Unable to start checkout."
      );
    } finally {
      setCheckoutBusy("");
    }
  }

  return (
    <PublicPageShell
      eyebrow="Pricing"
      title="Choose the operating package that fits your firm."
      description="Every plan is built around a professional campaign operating system. The difference is how much intelligence depth, execution support, MailOps visibility, automated reporting, and leadership control your team needs."
      announcement={
        requiredPlan
          ? `Upgrade recommended: ${requiredPlan.toUpperCase()}`
          : "Enterprise onboarding is now available for firms that need a white-glove rollout across leadership, operations, command workflows, and MailOps."
      }
      announcementTone={requiredPlan ? "success" : "info"}
      announcementAction={
        <Link to={isAuthenticated ? "/billing" : "/signup"} className="vs-button vs-button-secondary">
          {isAuthenticated ? "Manage Billing" : "Start Onboarding"}
        </Link>
      }
    >
      {upgradeContext.message ? (
        <div
          className="vs-card"
          style={{
            padding: "16px 18px",
            borderColor: "rgba(37,99,235,0.34)",
            background:
              "linear-gradient(135deg, rgba(37,99,235,0.10), rgba(15,23,42,0.04))",
          }}
        >
          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <Badge tone="active">Upgrade Required</Badge>
            <div style={{ color: "var(--vs-text-muted)", fontSize: "13px", lineHeight: 1.6 }}>
              {upgradeContext.message}
            </div>
          </div>
        </div>
      ) : null}

      {checkoutError ? (
        <div
          className="vs-card"
          style={{
            padding: "14px 16px",
            borderColor: "rgba(239,68,68,0.34)",
            color: "#b91c1c",
          }}
        >
          {checkoutError}
        </div>
      ) : null}

      <div className="vs-grid-3">
        {tiers.map((tier) => (
          <PricingCard
            key={tier.name}
            tier={tier}
            recommended={requiredPlan === tier.key}
            authenticated={Boolean(isAuthenticated)}
            checkoutBusy={checkoutBusy}
            onCheckout={handleCheckout}
          />
        ))}
      </div>

      <div className="vs-card" style={{ padding: "18px" }}>
        <div
          style={{
            fontSize: "14px",
            fontWeight: 700,
            marginBottom: "8px",
          }}
        >
          What subscribers receive
        </div>

        <div
          style={{
            fontSize: "12px",
            lineHeight: 1.7,
            color: "var(--vs-text-muted)",
          }}
        >
          Starter gives a firm a clean professional system for campaign visibility.
          Pro adds serious execution workflows, scheduled reporting, and stronger
          intelligence operations. Enterprise is built for top consulting organizations
          that need the full platform as a live control surface across leadership,
          operations, MailOps, fundraising, reporting, and campaign decision-making.
        </div>
      </div>
    </PublicPageShell>
  );
}
