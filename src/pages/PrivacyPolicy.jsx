import { Link } from "react-router-dom";
import "./PublicLegal.css";

const sections = [
  ["1. Scope", (
    <>
      <p>
        This Privacy Policy explains how VoterSpheres collects, uses, discloses,
        retains, and protects personal information when you visit our public
        website, request a demonstration, create or use an account, purchase or
        administer a subscription, communicate with us, or use the VoterSpheres
        platform and related services.
      </p>
      <p>
        A customer organization may provide information to VoterSpheres for
        processing on its behalf. In that situation, the customer controls the
        purposes and means of processing, and its own privacy notices and
        instructions may also apply.
      </p>
    </>
  )],
  ["2. Information we collect", (
    <>
      <h3>Information you provide</h3>
      <ul>
        <li>Contact details, such as name, email address, telephone number, organization, and role.</li>
        <li>Account details, login credentials, workspace membership, preferences, and profile information.</li>
        <li>Billing and transaction information. Payment card information may be processed by our payment provider rather than stored directly by VoterSpheres.</li>
        <li>Demo requests, support requests, feedback, survey responses, and other communications.</li>
        <li>Campaign, candidate, district, voter-contact, donor, vendor, coalition, operational, task, document, and intelligence data submitted to the platform.</li>
      </ul>
      <h3>Information collected automatically</h3>
      <ul>
        <li>Device, browser, operating-system, network, IP-address, and approximate-location information.</li>
        <li>Login, audit, diagnostic, security, performance, and usage events.</li>
        <li>Pages viewed, features used, referring pages, timestamps, session identifiers, and cookie or similar technology data.</li>
      </ul>
      <h3>Information from other sources</h3>
      <p>
        We may receive information from customer organizations, authorized
        integrations, public records, public political and election sources,
        data providers, service providers, and business partners, subject to
        applicable agreements and law.
      </p>
    </>
  )],
  ["3. How we use information", (
    <ul>
      <li>Provide, operate, maintain, secure, authenticate, and improve the platform.</li>
      <li>Create and administer accounts, subscriptions, workspaces, permissions, and customer support.</li>
      <li>Process requests, transactions, billing, renewals, and service communications.</li>
      <li>Generate dashboards, forecasts, recommendations, simulations, alerts, reports, and other customer-requested outputs.</li>
      <li>Detect misuse, fraud, security incidents, unauthorized access, and violations of our agreements.</li>
      <li>Analyze product performance, reliability, adoption, and customer experience.</li>
      <li>Comply with law, enforce agreements, protect rights and safety, and respond to lawful requests.</li>
      <li>Send product, service, or marketing communications where permitted, with available opt-out mechanisms.</li>
    </ul>
  )],
  ["4. Artificial intelligence and automated analysis", (
    <>
      <p>
        VoterSpheres may use automated systems and artificial intelligence to
        organize data, identify patterns, generate summaries, produce
        recommendations, support simulations, and assist with operational
        decision-making. Outputs may be incomplete, probabilistic, or inaccurate
        and should be reviewed by qualified users before action is taken.
      </p>
      <p>
        Customers remain responsible for determining whether and how to use
        platform outputs and for complying with election, campaign-finance,
        communications, privacy, discrimination, employment, and other laws
        applicable to their activities.
      </p>
    </>
  )],
  ["5. How we disclose information", (
    <>
      <p>We may disclose information to:</p>
      <ul>
        <li>Customer administrators and authorized workspace users.</li>
        <li>Cloud hosting, security, analytics, communications, support, payment, and other service providers acting for us.</li>
        <li>Professional advisers, auditors, insurers, financing sources, and transaction counterparties.</li>
        <li>Government authorities or other parties when required by law or reasonably necessary to protect rights, safety, and platform integrity.</li>
        <li>A successor or participant in a merger, financing, acquisition, reorganization, bankruptcy, or transfer of business assets.</li>
      </ul>
      <p>
        VoterSpheres does not sell personal information for money. We do not use
        customer-submitted campaign or operational data for third-party
        advertising.
      </p>
    </>
  )],
  ["6. Cookies and similar technologies", (
    <p>
      We may use essential cookies and similar technologies for authentication,
      session continuity, security, preferences, diagnostics, and platform
      performance. Where required, we will provide choices for nonessential
      technologies. Browser settings may allow you to block or delete cookies,
      but doing so may prevent some features from functioning.
    </p>
  )],
  ["7. Data retention", (
    <p>
      We retain information for as long as reasonably necessary to provide the
      services, maintain legitimate business and security records, comply with
      contractual and legal obligations, resolve disputes, and enforce
      agreements. Retention periods vary according to the type of information,
      customer instructions, account status, legal requirements, and backup
      cycles. Information may be deidentified or aggregated instead of deleted
      where permitted.
    </p>
  )],
  ["8. Security", (
    <p>
      We use administrative, technical, and physical safeguards designed to
      protect information against unauthorized access, loss, misuse, alteration,
      or disclosure. No system is completely secure, and we cannot guarantee
      absolute security. Users are responsible for maintaining credential
      confidentiality, using appropriate access controls, and promptly reporting
      suspected misuse.
    </p>
  )],
  ["9. Your choices and privacy rights", (
    <>
      <p>
        Depending on your location and applicable law, you may have rights to
        request access, correction, deletion, portability, restriction, or
        information about certain processing and disclosures. You may also have
        the right to appeal a denied request or opt out of certain targeted
        advertising, sale, sharing, or profiling activities.
      </p>
      <p>
        Submit a request through the VoterSpheres contact or support channel.
        We may need to verify your identity and authority before completing the
        request. Where VoterSpheres processes information for a customer, we may
        direct your request to that customer.
      </p>
    </>
  )],
  ["10. Children", (
    <p>
      The services are designed for professional and organizational use and are
      not directed to children under 13. We do not knowingly collect personal
      information directly from children under 13 through the public website.
      Contact us if you believe a child has provided information without
      appropriate authorization.
    </p>
  )],
  ["11. International use", (
    <p>
      VoterSpheres is operated from the United States. Information may be
      processed in the United States and other locations where our service
      providers operate. Where required, we use contractual or other recognized
      safeguards for cross-border transfers.
    </p>
  )],
  ["12. Third-party services and links", (
    <p>
      The platform may contain links to or integrations with third-party
      services. Their privacy practices are governed by their own notices and
      agreements. VoterSpheres is not responsible for third-party privacy or
      security practices.
    </p>
  )],
  ["13. Changes to this policy", (
    <p>
      We may update this policy to reflect product, legal, security, or business
      changes. We will post the revised policy with a new effective date and
      provide additional notice where required.
    </p>
  )],
  ["14. Contact us", (
    <p>
      For privacy questions or requests, use the contact or support form
      available through the VoterSpheres website. Include “Privacy Request” in
      your message and identify the organization or workspace associated with
      your request, where applicable.
    </p>
  )],
];

function LegalBrand() {
  return (
    <Link className="legal-brand" to="/" aria-label="VoterSpheres home">
      <span className="legal-brand-badge">VS</span>
      <span>
        <strong>VoterSpheres</strong>
        <small>Campaign intelligence operating system</small>
      </span>
    </Link>
  );
}

export default function PrivacyPolicy() {
  return (
    <main className="legal-page">
      <header className="legal-header">
        <div className="legal-shell legal-header-inner">
          <LegalBrand />
          <nav>
            <Link to="/">Home</Link>
            <Link to="/terms">Terms of Service</Link>
            <Link className="legal-button" to="/#request-demo">Contact</Link>
          </nav>
        </div>
      </header>

      <section className="legal-hero">
        <div className="legal-shell">
          <span className="legal-eyebrow">Legal & privacy</span>
          <h1>Privacy Policy</h1>
          <p>
            This policy describes how VoterSpheres handles personal information
            across our website, platform, accounts, and customer relationships.
          </p>
          <div className="legal-meta">
            <span>Effective: July 28, 2026</span>
            <span>Last updated: July 28, 2026</span>
          </div>
        </div>
      </section>

      <div className="legal-shell legal-layout">
        <aside className="legal-toc">
          <strong>On this page</strong>
          {sections.map(([title], index) => (
            <a key={title} href={`#section-${index + 1}`}>{title}</a>
          ))}
        </aside>

        <article className="legal-document">
          <div className="legal-notice">
            <strong>Plain-language overview</strong>
            <p>
              VoterSpheres collects information needed to operate and secure the
              platform, support customers, process subscriptions, and provide
              political intelligence and campaign-operation features. We do not
              sell customer-submitted campaign or operational data for
              advertising.
            </p>
          </div>

          {sections.map(([title, content], index) => (
            <section key={title} id={`section-${index + 1}`}>
              <h2>{title}</h2>
              {content}
            </section>
          ))}
        </article>
      </div>

      <footer className="legal-footer">
        <div className="legal-shell">
          <LegalBrand />
          <div>
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
            <Link to="/">Return home</Link>
          </div>
          <span>© {new Date().getFullYear()} VoterSpheres. All rights reserved.</span>
        </div>
      </footer>
    </main>
  );
}
