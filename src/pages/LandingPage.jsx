import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from "react-simple-maps";
import { api } from "../services/api";
import "./LandingPage.css";

const US_TOPO_JSON =
  "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

const STATE_META = {
  "01": { abbr: "AL", name: "Alabama" },
  "02": { abbr: "AK", name: "Alaska" },
  "04": { abbr: "AZ", name: "Arizona" },
  "05": { abbr: "AR", name: "Arkansas" },
  "06": { abbr: "CA", name: "California" },
  "08": { abbr: "CO", name: "Colorado" },
  "09": { abbr: "CT", name: "Connecticut" },
  "10": { abbr: "DE", name: "Delaware" },
  "11": { abbr: "DC", name: "District of Columbia" },
  "12": { abbr: "FL", name: "Florida" },
  "13": { abbr: "GA", name: "Georgia" },
  "15": { abbr: "HI", name: "Hawaii" },
  "16": { abbr: "ID", name: "Idaho" },
  "17": { abbr: "IL", name: "Illinois" },
  "18": { abbr: "IN", name: "Indiana" },
  "19": { abbr: "IA", name: "Iowa" },
  "20": { abbr: "KS", name: "Kansas" },
  "21": { abbr: "KY", name: "Kentucky" },
  "22": { abbr: "LA", name: "Louisiana" },
  "23": { abbr: "ME", name: "Maine" },
  "24": { abbr: "MD", name: "Maryland" },
  "25": { abbr: "MA", name: "Massachusetts" },
  "26": { abbr: "MI", name: "Michigan" },
  "27": { abbr: "MN", name: "Minnesota" },
  "28": { abbr: "MS", name: "Mississippi" },
  "29": { abbr: "MO", name: "Missouri" },
  "30": { abbr: "MT", name: "Montana" },
  "31": { abbr: "NE", name: "Nebraska" },
  "32": { abbr: "NV", name: "Nevada" },
  "33": { abbr: "NH", name: "New Hampshire" },
  "34": { abbr: "NJ", name: "New Jersey" },
  "35": { abbr: "NM", name: "New Mexico" },
  "36": { abbr: "NY", name: "New York" },
  "37": { abbr: "NC", name: "North Carolina" },
  "38": { abbr: "ND", name: "North Dakota" },
  "39": { abbr: "OH", name: "Ohio" },
  "40": { abbr: "OK", name: "Oklahoma" },
  "41": { abbr: "OR", name: "Oregon" },
  "42": { abbr: "PA", name: "Pennsylvania" },
  "44": { abbr: "RI", name: "Rhode Island" },
  "45": { abbr: "SC", name: "South Carolina" },
  "46": { abbr: "SD", name: "South Dakota" },
  "47": { abbr: "TN", name: "Tennessee" },
  "48": { abbr: "TX", name: "Texas" },
  "49": { abbr: "UT", name: "Utah" },
  "50": { abbr: "VT", name: "Vermont" },
  "51": { abbr: "VA", name: "Virginia" },
  "53": { abbr: "WA", name: "Washington" },
  "54": { abbr: "WV", name: "West Virginia" },
  "55": { abbr: "WI", name: "Wisconsin" },
  "56": { abbr: "WY", name: "Wyoming" },
};

const STATE_COORDS = {
  AZ: [-111.7, 34.3],
  FL: [-81.7, 27.8],
  GA: [-83.4, 32.7],
  MI: [-84.8, 44.2],
  NC: [-79.0, 35.5],
  NV: [-116.6, 39.3],
  OH: [-82.8, 40.3],
  PA: [-77.7, 41.0],
  TX: [-99.3, 31.3],
  VA: [-78.7, 37.6],
  WI: [-89.7, 44.6],
};

const STATE_POSTURE = {
  AZ: "priority",
  FL: "watch",
  GA: "priority",
  MI: "priority",
  NC: "priority",
  NV: "priority",
  OH: "watch",
  PA: "priority",
  TX: "watch",
  VA: "watch",
  WI: "priority",
  CA: "stable",
  CO: "stable",
  IL: "stable",
  MN: "stable",
  NY: "stable",
  OR: "stable",
  WA: "stable",
};

const productCapabilities = [
  {
    icon: "signal",
    title: "Political Intelligence",
    body: "Unify candidate, coalition, media, donor, vendor, and geographic signals into one decision-ready intelligence layer.",
  },
  {
    icon: "command",
    title: "Executive Command",
    body: "Give leadership a national operating picture with priorities, risks, approvals, and recommended actions in one place.",
  },
  {
    icon: "operations",
    title: "Operational Execution",
    body: "Turn strategy into coordinated field, mail, digital, vendor, fundraising, and stakeholder workflows.",
  },
  {
    icon: "ai",
    title: "AI-Powered Insights",
    body: "Surface opportunities, explain risk, simulate outcomes, and keep decision-makers focused on what matters next.",
  },
];

const workflow = [
  {
    step: "01",
    title: "Detect",
    body: "Monitor voter, campaign, vendor, fundraising, and external signals as conditions change.",
  },
  {
    step: "02",
    title: "Decide",
    body: "Convert intelligence into executive priorities, strategic options, and approval-ready actions.",
  },
  {
    step: "03",
    title: "Deploy",
    body: "Coordinate campaigns, consultants, vendors, field teams, MailOps, and digital programs.",
  },
  {
    step: "04",
    title: "Measure",
    body: "Track impact, readiness, risk, and execution outcomes across every operating layer.",
  },
];

const audiences = [
  {
    title: "Campaigns",
    body: "Run data-driven programs with real-time control across strategy and execution.",
  },
  {
    title: "Political Firms",
    body: "Manage multiple clients, teams, vendors, and priorities through a unified command layer.",
  },
  {
    title: "PACs & Committees",
    body: "Target resources, track influence, and coordinate independent political operations.",
  },
  {
    title: "Nonprofits & Advocacy",
    body: "Understand audiences, organize engagement, and measure mission impact.",
  },
];

const alerts = [
  {
    tone: "critical",
    title: "Georgia turnout pressure elevated",
    detail: "High-propensity participation variance requires executive review.",
    time: "2m",
  },
  {
    tone: "watch",
    title: "Arizona persuadable audience shift",
    detail: "Suburban persuadable segment moved above monitoring threshold.",
    time: "7m",
  },
  {
    tone: "watch",
    title: "Pennsylvania media impact",
    detail: "Message resonance increased across two priority markets.",
    time: "15m",
  },
];

const queue = [
  { state: "PA", title: "Voter contact deployment", due: "Today", risk: "High" },
  { state: "GA", title: "Field mobilization review", due: "Today", risk: "High" },
  { state: "NC", title: "Mail program approval", due: "Tomorrow", risk: "Medium" },
  { state: "AZ", title: "Digital persuasion launch", due: "Tomorrow", risk: "Medium" },
];

function isValidEmail(value) {
  return /\S+@\S+\.\S+/.test(String(value || "").trim());
}

function stateClass(abbr) {
  return STATE_POSTURE[abbr] || "monitor";
}

function BrandMark({ compact = false, showTagline = true }) {
  return (
    <span className={compact ? "lp-official-brand is-compact" : "lp-official-brand"}>
      <span className="lp-official-brand-badge" aria-hidden="true">
        VS
      </span>

      <span className="lp-official-brand-copy">
        <strong>VoterSpheres</strong>
        {showTagline ? (
          <small>Campaign intelligence operating system</small>
        ) : null}
      </span>
    </span>
  );
}

function Icon({ name }) {
  const icons = {
    signal: (
      <>
        <circle cx="12" cy="12" r="2.5" />
        <path d="M5.5 12a6.5 6.5 0 0 1 6.5-6.5M18.5 12A6.5 6.5 0 0 0 12 5.5M3 12a9 9 0 0 1 9-9M21 12a9 9 0 0 0-9-9M7 17l3-3M17 17l-3-3" />
      </>
    ),
    command: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M7 8h5M7 12h10M7 16h7" />
      </>
    ),
    operations: (
      <>
        <circle cx="6" cy="7" r="2" />
        <circle cx="18" cy="7" r="2" />
        <circle cx="12" cy="17" r="2" />
        <path d="M7.5 8.5 10.5 15M16.5 8.5 13.5 15M8 7h8" />
      </>
    ),
    ai: (
      <>
        <path d="M9 3h6l1 3 3 1v10l-3 1-1 3H9l-1-3-3-1V7l3-1 1-3Z" />
        <circle cx="9" cy="11" r="1" />
        <circle cx="15" cy="11" r="1" />
        <path d="M9 15h6" />
      </>
    ),
    arrow: <path d="M5 12h14M14 7l5 5-5 5" />,
  };

  return (
    <svg className="lp-icon" viewBox="0 0 24 24" aria-hidden="true">
      {icons[name]}
    </svg>
  );
}

function ProductPreviewMap() {
  return (
    <div className="lp-map-card">
      <div className="lp-preview-card-head">
        <div>
          <span className="lp-preview-eyebrow">National intelligence</span>
          <strong>Signal posture map</strong>
        </div>
        <span className="lp-live-pill">
          <i />
          Live
        </span>
      </div>

      <div className="lp-us-map-wrap">
        <ComposableMap
          projection="geoAlbersUsa"
          projectionConfig={{ scale: 920 }}
          width={760}
          height={430}
          className="lp-us-map"
        >
          <Geographies geography={US_TOPO_JSON}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const fips = String(geo.id).padStart(2, "0");
                const abbr = STATE_META[fips]?.abbr || "";
                const posture = stateClass(abbr);

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    className={`lp-map-state is-${posture}`}
                    tabIndex={-1}
                    style={{
                      default: { outline: "none" },
                      hover: { outline: "none" },
                      pressed: { outline: "none" },
                    }}
                  />
                );
              })
            }
          </Geographies>

          {Object.entries(STATE_COORDS).map(([abbr, coordinates]) => (
            <Marker key={abbr} coordinates={coordinates}>
              <g className={`lp-map-marker is-${stateClass(abbr)}`}>
                <circle r="11" />
                <text textAnchor="middle" y="3.2">
                  {abbr}
                </text>
              </g>
            </Marker>
          ))}
        </ComposableMap>
      </div>

      <div className="lp-map-legend" aria-label="Map legend">
        <span><i className="is-priority" />Priority</span>
        <span><i className="is-watch" />Watch</span>
        <span><i className="is-stable" />Stable</span>
        <span><i className="is-monitor" />Monitoring</span>
      </div>
    </div>
  );
}

function ProductPreview() {
  return (
    <div className="lp-product-preview" aria-label="VoterSpheres product preview">
      <aside className="lp-preview-sidebar">
        <div className="lp-preview-logo">
          <BrandMark compact showTagline={false} />
        </div>

        <nav>
          <span className="is-active">Command Center</span>
          <span>Intelligence Fabric</span>
          <span>Operations Map</span>
          <span>Campaign Workspace</span>
          <span>CRM</span>
          <span>AI War Room</span>
          <span>Reports</span>
        </nav>

        <div className="lp-preview-user">
          <i>MS</i>
          <div>
            <strong>Executive User</strong>
            <span>Enterprise workspace</span>
          </div>
        </div>
      </aside>

      <div className="lp-preview-main">
        <div className="lp-preview-topbar">
          <div>
            <span className="lp-preview-eyebrow">Executive command</span>
            <h3>National Operating Picture</h3>
          </div>

          <div className="lp-preview-status">
            <span><i />Systems operational</span>
            <small>Updated 2m ago</small>
          </div>
        </div>

        <div className="lp-preview-kpis">
          <div>
            <span>Priority states</span>
            <strong>7</strong>
            <small>3 require review</small>
          </div>
          <div>
            <span>Open actions</span>
            <strong>24</strong>
            <small>8 due today</small>
          </div>
          <div>
            <span>Execution readiness</span>
            <strong>82%</strong>
            <small>+5.4% this week</small>
          </div>
          <div>
            <span>AI confidence</span>
            <strong>91%</strong>
            <small>High confidence</small>
          </div>
        </div>

        <div className="lp-preview-grid">
          <ProductPreviewMap />

          <aside className="lp-snapshot-card">
            <div className="lp-preview-card-head">
              <div>
                <span className="lp-preview-eyebrow">Executive snapshot</span>
                <strong>National posture</strong>
              </div>
            </div>

            <div className="lp-snapshot-list">
              <div>
                <span>Persuadable audience</span>
                <strong>23.6M</strong>
                <small>+4.3% modeled movement</small>
              </div>
              <div>
                <span>Active field programs</span>
                <strong>1,842</strong>
                <small>12.6% weekly growth</small>
              </div>
              <div>
                <span>Coalition readiness</span>
                <strong>78%</strong>
                <small>6 active watch areas</small>
              </div>
              <div>
                <span>Vendor coverage</span>
                <strong>86%</strong>
                <small>4 execution gaps</small>
              </div>
            </div>
          </aside>
        </div>

        <div className="lp-preview-bottom">
          <section className="lp-alert-card">
            <div className="lp-preview-card-head">
              <div>
                <span className="lp-preview-eyebrow">Intelligence alerts</span>
                <strong>Latest signals</strong>
              </div>
              <button type="button">View all</button>
            </div>

            <div className="lp-alert-list">
              {alerts.map((alert) => (
                <div key={alert.title}>
                  <i className={`is-${alert.tone}`} />
                  <div>
                    <strong>{alert.title}</strong>
                    <span>{alert.detail}</span>
                  </div>
                  <small>{alert.time}</small>
                </div>
              ))}
            </div>
          </section>

          <section className="lp-queue-card">
            <div className="lp-preview-card-head">
              <div>
                <span className="lp-preview-eyebrow">Priority queue</span>
                <strong>Recommended actions</strong>
              </div>
              <button type="button">Open queue</button>
            </div>

            <div className="lp-queue-list">
              {queue.map((item) => (
                <div key={`${item.state}-${item.title}`}>
                  <b>{item.state}</b>
                  <span>{item.title}</span>
                  <small>{item.due}</small>
                  <em className={`is-${item.risk.toLowerCase()}`}>
                    {item.risk}
                  </em>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
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

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
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
        team_size: form.role.trim(),
        message: form.notes.trim(),
      });

      setMessage(
        "Request received. Our team will follow up with your VoterSpheres demo details."
      );
      setMessageTone("success");
      setForm({
        full_name: "",
        firm_name: "",
        email: "",
        role: "",
        notes: "",
      });
    } catch (error) {
      setMessage(
        error?.response?.data?.error ||
          "Unable to submit your request right now. Please try again."
      );
      setMessageTone("error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="lp-page">
      <header className="lp-header">
        <div className="lp-shell lp-header-inner">
          <Link className="lp-brand" to="/" aria-label="VoterSpheres home">
            <BrandMark />
          </Link>

          <button
            type="button"
            className="lp-menu-button"
            onClick={() => setMobileOpen((open) => !open)}
            aria-expanded={mobileOpen}
            aria-label="Toggle navigation"
          >
            <span />
            <span />
            <span />
          </button>

          <nav className={mobileOpen ? "lp-nav is-open" : "lp-nav"}>
            <a href="#platform" onClick={() => setMobileOpen(false)}>
              Platform
            </a>
            <a href="#workflow" onClick={() => setMobileOpen(false)}>
              How it works
            </a>
            <a href="#solutions" onClick={() => setMobileOpen(false)}>
              Solutions
            </a>
            <Link to="/pricing" onClick={() => setMobileOpen(false)}>
              Pricing
            </Link>
          </nav>

          <div className="lp-header-actions">
            <Link className="lp-button lp-button-ghost" to="/login">
              Sign In
            </Link>
            <a className="lp-button lp-button-primary" href="#request-demo">
              Request Demo
            </a>
          </div>
        </div>
      </header>

      <section className="lp-hero">
        <div className="lp-hero-glow" />
        <div className="lp-shell lp-hero-grid">
          <div className="lp-hero-copy">
            <span className="lp-eyebrow">
              <i />
              Campaign intelligence operating system
            </span>

            <h1>
              The operating system for modern{" "}
              <strong>political campaigns.</strong>
            </h1>

            <p>
              Real-time political intelligence. Executive clarity. Coordinated
              campaign execution. VoterSpheres brings every critical operating
              signal into one command platform.
            </p>

            <div className="lp-hero-benefits">
              <span><Icon name="signal" />Real-time intelligence</span>
              <span><Icon name="command" />Executive command</span>
              <span><Icon name="operations" />Operational execution</span>
              <span><Icon name="ai" />AI-powered insights</span>
            </div>

            <div className="lp-hero-actions">
              <a className="lp-button lp-button-primary lp-button-large" href="#request-demo">
                Request a Demo
                <Icon name="arrow" />
              </a>
              <a className="lp-button lp-button-secondary lp-button-large" href="#platform">
                Explore Platform
              </a>
            </div>

            <div className="lp-trust-line">
              <span className="lp-trust-shield">✓</span>
              <span>
                Built for campaigns, firms, committees, and political
                organizations nationwide.
              </span>
            </div>
          </div>

          <div className="lp-hero-preview">
            <ProductPreview />
          </div>
        </div>
      </section>

      <section className="lp-capabilities" id="platform">
        <div className="lp-shell">
          <div className="lp-section-heading is-centered">
            <span className="lp-eyebrow">The VoterSpheres platform</span>
            <h2>
              One platform. Every decision. <strong>Greater impact.</strong>
            </h2>
            <p>
              Replace fragmented political tools with a unified intelligence and
              execution environment built for modern operators.
            </p>
          </div>

          <div className="lp-capability-grid">
            {productCapabilities.map((item) => (
              <article key={item.title} className="lp-capability-card">
                <div className="lp-capability-icon">
                  <Icon name={item.icon} />
                </div>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-workflow-section" id="workflow">
        <div className="lp-shell">
          <div className="lp-section-heading is-centered">
            <span className="lp-eyebrow">Operating workflow</span>
            <h2>The VoterSpheres decision cycle</h2>
            <p>
              Move from signal detection to measurable execution without losing
              context, ownership, or speed.
            </p>
          </div>

          <div className="lp-workflow-grid">
            {workflow.map((item, index) => (
              <article key={item.step} className="lp-workflow-card">
                <div className="lp-workflow-top">
                  <span>{item.step}</span>
                  <i />
                </div>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
                {index < workflow.length - 1 && (
                  <span className="lp-workflow-arrow" aria-hidden="true">
                    →
                  </span>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-solutions" id="solutions">
        <div className="lp-shell">
          <div className="lp-section-heading">
            <span className="lp-eyebrow">Built for political operators</span>
            <h2>One command layer for every organization.</h2>
            <p>
              VoterSpheres adapts to the way political organizations actually
              work—from a single campaign to a national portfolio.
            </p>
          </div>

          <div className="lp-audience-grid">
            {audiences.map((item, index) => (
              <article key={item.title} className="lp-audience-card">
                <span>0{index + 1}</span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-demo-section" id="request-demo">
        <div className="lp-shell">
          <div className="lp-demo-intro">
            <div className="lp-demo-brand">
              <BrandMark />
            </div>

            <div className="lp-demo-heading">
              <span className="lp-eyebrow">See VoterSpheres in action</span>
              <h2>
                Turn political intelligence into{" "}
                <strong>decisive action.</strong>
              </h2>
              <p>
                Request a personalized walkthrough of the VoterSpheres platform
                and see how your organization can improve visibility,
                coordination, and execution.
              </p>
            </div>

            <a className="lp-button lp-button-primary lp-button-large" href="#demo-form">
              Request a Demo
              <Icon name="arrow" />
            </a>
          </div>

          <div className="lp-demo-content">
            <aside className="lp-demo-value">
              <span className="lp-eyebrow">A walkthrough built around you</span>
              <h3>See the platform through your operating model.</h3>
              <p>
                We will focus the session on the workflows, teams, geography,
                intelligence signals, and execution challenges that matter to
                your organization.
              </p>

              <div className="lp-demo-points">
                <span>✓ Personalized platform walkthrough</span>
                <span>✓ Executive and operational use-case review</span>
                <span>✓ National, state, and local operating views</span>
                <span>✓ No obligation and no generic sales presentation</span>
              </div>

              <div className="lp-demo-security">
                <strong>Enterprise-ready conversation</strong>
                <span>
                  Your information is used only to respond to your request and
                  coordinate the demonstration.
                </span>
              </div>
            </aside>

            <form className="lp-demo-form" id="demo-form" onSubmit={handleSubmit}>
              <div className="lp-form-head">
                <span className="lp-eyebrow">Request your demo</span>
                <h3>Tell us about your organization.</h3>
                <p>
                  We will tailor the walkthrough around your operating model and
                  priorities.
                </p>
              </div>

              <div className="lp-form-grid">
                <label>
                  <span>Full name</span>
                  <input
                    name="full_name"
                    value={form.full_name}
                    onChange={updateField}
                    placeholder="Your full name"
                    autoComplete="name"
                    required
                  />
                </label>

                <label>
                  <span>Organization</span>
                  <input
                    name="firm_name"
                    value={form.firm_name}
                    onChange={updateField}
                    placeholder="Campaign, firm, or committee"
                    autoComplete="organization"
                    required
                  />
                </label>

                <label>
                  <span>Work email</span>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={updateField}
                    placeholder="you@organization.com"
                    autoComplete="email"
                    required
                  />
                </label>

                <label>
                  <span>Your role</span>
                  <select
                    name="role"
                    value={form.role}
                    onChange={updateField}
                    required
                  >
                    <option value="">Select your role</option>
                    <option value="Executive Leadership">Executive leadership</option>
                    <option value="Political Consultant">Political consultant</option>
                    <option value="Campaign Manager">Campaign manager</option>
                    <option value="Operations Director">Operations director</option>
                    <option value="Data or Intelligence">Data or intelligence</option>
                    <option value="Vendor or Partner">Vendor or partner</option>
                    <option value="Other">Other</option>
                  </select>
                </label>

                <label className="is-wide">
                  <span>What would you like to improve?</span>
                  <textarea
                    name="notes"
                    value={form.notes}
                    onChange={updateField}
                    rows={4}
                    placeholder="Tell us about your current systems, priorities, or operating challenges."
                  />
                </label>
              </div>

              <button
                type="submit"
                className="lp-button lp-button-primary lp-button-submit"
                disabled={!canSubmit || submitting}
              >
                {submitting ? "Submitting..." : "Request My Demo"}
                {!submitting && <Icon name="arrow" />}
              </button>

              {message && (
                <div className={`lp-form-message is-${messageTone}`} role="status">
                  {message}
                </div>
              )}

              <p className="lp-form-note">
                By submitting this form, you agree that VoterSpheres may contact
                you about the platform. We do not sell your contact information.
              </p>
            </form>
          </div>
        </div>
      </section>

      <footer className="lp-footer">
        <div className="lp-shell">
          <div className="lp-footer-top">
            <div className="lp-footer-brand">
              <Link className="lp-brand" to="/">
                <BrandMark />
              </Link>
              <p>
                The political intelligence and campaign execution operating
                system.
              </p>
            </div>

            <div className="lp-footer-links">
              <div>
                <strong>Platform</strong>
                <a href="#platform">Political Intelligence</a>
                <a href="#platform">Executive Command</a>
                <a href="#workflow">Operating Workflow</a>
                <a href="#request-demo">Request Demo</a>
              </div>
              <div>
                <strong>Company</strong>
                <Link to="/pricing">Pricing</Link>
                <Link to="/login">Sign In</Link>
                <a href="#solutions">Solutions</a>
                <a href="#request-demo">Contact</a>
              </div>
              <div>
                <strong>Legal</strong>
                <Link to="/privacy">Privacy Policy</Link>
                <Link to="/terms">Terms of Service</Link>
              </div>
            </div>
          </div>

          <div className="lp-footer-bottom">
            <span>© {new Date().getFullYear()} VoterSpheres. All rights reserved.</span>
            <span>Political intelligence. Executive clarity. Operational control.</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
