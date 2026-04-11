import { Link } from "react-router-dom";
import Badge from "../components/ui/Badge";
import PublicPageShell from "../components/layout/PublicPageShell.jsx";

const tiers = [
  {
    name: "Starter",
    price: "$99",
    period: "/month",
    tone: "default",
    cta: "Start with Starter",
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
    name: "Pro",
    price: "$149",
    period: "/month",
    tone: "accent",
    featured: true,
    cta: "Upgrade to Pro",
    description:
      "For active consulting firms that need tighter execution, more intelligence depth, and stronger operating rhythm across clients and campaigns.",
    includes: [
      "Everything in Starter",
      "Command Center and AI War Room workflows",
      "Advanced fundraising and rankings visibility",
      "Operational MailOps composer and live event updates",
      "Broader internal coordination across execution teams",
      "Higher-value intelligence workflows for campaign management",
    ],
  },
  {
    name: "Enterprise",
    price: "$499",
    period: "/month",
    tone: "danger",
    cta: "Go Enterprise",
    description:
      "For high-volume firms and serious campaign operators who need a premium control layer, live operations, and full-platform execution support.",
    includes: [
      "Everything in Pro",
      "Full platform access for multi-workstream operations",
      "Live intelligence fusion across dashboard, map, war room, and MailOps",
      "Enterprise-grade workflow support for campaign execution",
      "Operational visibility for leadership, vendors, and delivery risk",
      "Best fit for top-tier political consulting organizations",
    ],
  },
];

function PricingCard({ tier }) {
  return (
    <div
      className="vs-card"
      style={{
        display: "grid",
        gap: "14px",
        padding: "18px",
        position: "relative",
        borderColor: tier.featured
          ? "rgba(245,158,11,0.42)"
          : "var(--vs-border)",
        boxShadow: tier.featured
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

        {tier.featured ? <Badge tone="accent">Most Popular</Badge> : null}
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

      <Link
        to="/signup"
        className="vs-button vs-button-primary"
        style={{ width: "100%", justifyContent: "center" }}
      >
        {tier.cta}
      </Link>
    </div>
  );
}

export default function Pricing() {
  return (
    <PublicPageShell
      eyebrow="Pricing"
      title="Choose the operating package that fits your firm."
      description="Every plan is built around a professional campaign operating system. The difference is how much intelligence depth, execution support, MailOps visibility, and leadership control your team needs."
    >
      <div className="vs-grid-3">
        {tiers.map((tier) => (
          <PricingCard key={tier.name} tier={tier} />
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
          Pro adds more serious execution and intelligence workflows. Enterprise is
          built for top consulting organizations that need the full platform as a
          live control surface across leadership, operations, MailOps, fundraising,
          and campaign decision-making.
        </div>
      </div>
    </PublicPageShell>
  );
}
