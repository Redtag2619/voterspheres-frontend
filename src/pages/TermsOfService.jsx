import { Link } from "react-router-dom";
import "./PublicLegal.css";

const sections = [
  ["1. Agreement to these terms", (
    <p>
      These Terms of Service form a binding agreement between you and
      VoterSpheres governing access to and use of our websites, applications,
      platform, data tools, artificial-intelligence features, APIs, support, and
      related services. By accessing or using the services, you represent that
      you have authority to accept these terms for yourself or the organization
      you represent.
    </p>
  )],
  ["2. Eligibility and organizational authority", (
    <p>
      You must be legally capable of entering into a binding agreement and must
      use the services only for lawful professional, organizational, campaign,
      committee, advocacy, consulting, or related purposes. If you use the
      services for an organization, you represent that you are authorized to
      bind that organization.
    </p>
  )],
  ["3. Accounts and access", (
    <ul>
      <li>You must provide accurate account information and keep it current.</li>
      <li>You are responsible for safeguarding credentials, devices, tokens, and workspace access.</li>
      <li>You must promptly report suspected unauthorized access or security incidents.</li>
      <li>Customer administrators control workspace membership and permissions and are responsible for authorized-user activity.</li>
      <li>Accounts may not be transferred, shared outside authorized use, or used to bypass subscription limits.</li>
    </ul>
  )],
  ["4. Subscriptions, billing, and renewal", (
    <>
      <p>
        Paid services are provided under the plan, order form, checkout terms,
        statement of work, or other purchasing document presented at purchase.
        Fees, billing frequency, usage limits, renewal terms, and included
        features are described in those materials.
      </p>
      <p>
        Unless otherwise stated in an applicable order, subscriptions renew
        automatically for successive periods until canceled before renewal.
        Taxes are additional where required. Except where required by law or
        expressly stated in an order, fees are nonrefundable.
      </p>
    </>
  )],
  ["5. Customer data and responsibilities", (
    <>
      <p>
        “Customer Data” means information, content, records, documents, inputs,
        and materials submitted to or processed through the services by or for a
        customer. As between the parties, the customer retains its rights in
        Customer Data.
      </p>
      <p>
        You represent that you have all rights, notices, permissions, lawful
        bases, and authorizations necessary to collect, upload, use, instruct us
        to process, and disclose Customer Data. You are responsible for the
        accuracy, legality, quality, and use of Customer Data and for maintaining
        appropriate exports or backups.
      </p>
    </>
  )],
  ["6. Acceptable use", (
    <>
      <p>You may not use the services to:</p>
      <ul>
        <li>Violate election, campaign-finance, lobbying, privacy, communications, advertising, anti-discrimination, sanctions, export-control, or other applicable law.</li>
        <li>Upload or use information without sufficient rights or authority.</li>
        <li>Send unlawful, deceptive, harassing, threatening, discriminatory, or unsolicited communications.</li>
        <li>Attempt unauthorized access, probe vulnerabilities, defeat security controls, introduce malware, or disrupt the services.</li>
        <li>Reverse engineer, scrape, copy, resell, sublicense, or create a competing service from protected elements except where expressly permitted by law or written agreement.</li>
        <li>Use automated outputs as the sole basis for decisions that legally require human judgment, notice, consent, or review.</li>
        <li>Misrepresent affiliation, identity, sponsorship, endorsement, or the source of political communications.</li>
      </ul>
    </>
  )],
  ["7. Political and regulatory compliance", (
    <p>
      VoterSpheres provides technology and information tools, not legal,
      accounting, campaign-finance, election-administration, or compliance
      advice. Customers are solely responsible for evaluating and complying with
      laws, regulations, reporting obligations, disclaimers, consent rules,
      registration requirements, contribution limits, communication rules, and
      other requirements applicable to their activities and jurisdictions.
    </p>
  )],
  ["8. Artificial intelligence and analytical outputs", (
    <>
      <p>
        The services may generate forecasts, scores, summaries, simulations,
        recommendations, classifications, or other automated outputs. These
        outputs are probabilistic, may contain errors, and may not reflect
        complete or current conditions.
      </p>
      <p>
        You must use qualified human judgment before relying on an output,
        particularly for material strategic, financial, legal, employment,
        targeting, communication, or resource-allocation decisions.
        VoterSpheres does not guarantee electoral, fundraising, persuasion,
        turnout, operational, or other outcomes.
      </p>
    </>
  )],
  ["9. Third-party services and data", (
    <p>
      The services may integrate with or rely on third-party platforms, payment
      providers, public data, commercial data, hosting services, maps,
      communications providers, or other external resources. Third-party
      services are governed by their own terms. We are not responsible for
      third-party availability, accuracy, security, changes, or acts.
    </p>
  )],
  ["10. Intellectual property", (
    <>
      <p>
        VoterSpheres and its licensors retain all rights in the services,
        software, designs, interfaces, documentation, models, methods, branding,
        and other technology, excluding Customer Data.
      </p>
      <p>
        Subject to these terms and payment of applicable fees, VoterSpheres
        grants the customer a limited, nonexclusive, nontransferable,
        nonsublicensable right during the subscription term to access and use
        the services for its internal authorized purposes.
      </p>
    </>
  )],
  ["11. Feedback", (
    <p>
      If you provide suggestions or feedback, you grant VoterSpheres a
      worldwide, perpetual, irrevocable, royalty-free right to use and
      incorporate that feedback without restriction or payment, provided we do
      not identify you publicly without permission.
    </p>
  )],
  ["12. Confidentiality", (
    <p>
      Each party may receive nonpublic information that is identified as
      confidential or reasonably should be understood as confidential. The
      receiving party will use reasonable care to protect it and use it only for
      the relationship. Confidentiality obligations do not apply to information
      that is public through no breach, already lawfully known, independently
      developed, or rightfully received without restriction.
    </p>
  )],
  ["13. Service changes, availability, and beta features", (
    <p>
      We may improve, modify, add, or discontinue features. We aim to provide
      reliable service but do not guarantee uninterrupted or error-free
      operation. Preview, beta, experimental, or free features may be changed or
      discontinued at any time and are provided without service-level
      commitments unless stated in writing.
    </p>
  )],
  ["14. Suspension and termination", (
    <p>
      We may suspend or restrict access where reasonably necessary to address
      nonpayment, security risk, unlawful activity, material breach, harm to the
      services or others, or legal requirements. Either party may terminate as
      provided in the applicable order or agreement. Upon termination, access
      ends and data handling will follow the applicable agreement, retention
      practices, and law.
    </p>
  )],
  ["15. Disclaimers", (
    <p>
      TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE SERVICES ARE PROVIDED “AS IS”
      AND “AS AVAILABLE.” VOTERSPHERES DISCLAIMS IMPLIED WARRANTIES, INCLUDING
      MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND
      NON-INFRINGEMENT. VOTERSPHERES DOES NOT WARRANT THAT DATA OR OUTPUTS ARE
      COMPLETE, CURRENT, ACCURATE, OR SUITABLE FOR A PARTICULAR DECISION OR THAT
      USE OF THE SERVICES WILL PRODUCE A PARTICULAR POLITICAL OR BUSINESS RESULT.
    </p>
  )],
  ["16. Limitation of liability", (
    <p>
      TO THE MAXIMUM EXTENT PERMITTED BY LAW, VOTERSPHERES WILL NOT BE LIABLE
      FOR INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, CONSEQUENTIAL, OR PUNITIVE
      DAMAGES, OR FOR LOST PROFITS, REVENUE, DATA, GOODWILL, CAMPAIGN
      OPPORTUNITY, OR BUSINESS INTERRUPTION. VOTERSPHERES’ AGGREGATE LIABILITY
      ARISING FROM THE SERVICES WILL NOT EXCEED THE AMOUNTS PAID OR PAYABLE FOR
      THE AFFECTED SERVICES DURING THE TWELVE MONTHS BEFORE THE EVENT GIVING RISE
      TO LIABILITY. SOME JURISDICTIONS DO NOT ALLOW CERTAIN LIMITATIONS, SO
      PORTIONS OF THIS SECTION MAY NOT APPLY.
    </p>
  )],
  ["17. Indemnification", (
    <p>
      To the extent permitted by law, the customer will defend, indemnify, and
      hold harmless VoterSpheres and its personnel from third-party claims,
      damages, losses, and reasonable costs arising from Customer Data, customer
      instructions, unlawful or unauthorized use, violation of these terms, or
      violation of another party’s rights.
    </p>
  )],
  ["18. Governing law and disputes", (
    <>
      <p>
        These terms are governed by the laws of the state identified in the
        applicable order form or negotiated agreement, without regard to
        conflict-of-law principles. If no state is identified, the governing law
        and exclusive forum will be determined by the principal place of
        business stated in VoterSpheres’ then-current corporate records, subject
        to any mandatory law that applies.
      </p>
      <p>
        Before filing a formal claim, each party will make a good-faith effort
        to resolve the dispute through written notice and business discussion.
      </p>
    </>
  )],
  ["19. Changes to these terms", (
    <p>
      We may update these terms to reflect changes in law, security, products,
      or business practices. Material changes will be posted with a revised
      effective date and additional notice where required. Continued use after
      the effective date constitutes acceptance where permitted by law.
    </p>
  )],
  ["20. General terms", (
    <p>
      These terms, together with applicable orders and incorporated policies,
      are the entire agreement for the services unless a separately signed
      agreement controls. If a provision is unenforceable, the remainder stays
      effective. Failure to enforce a provision is not a waiver. Neither party
      may assign the agreement except as permitted in an applicable order or in
      connection with a merger, reorganization, or sale of substantially all
      relevant assets.
    </p>
  )],
  ["21. Contact", (
    <p>
      Questions about these terms may be submitted through the VoterSpheres
      contact or support channel. Include “Terms of Service” in the message and
      identify the relevant organization or workspace.
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

export default function TermsOfService() {
  return (
    <main className="legal-page">
      <header className="legal-header">
        <div className="legal-shell legal-header-inner">
          <LegalBrand />
          <nav>
            <Link to="/">Home</Link>
            <Link to="/privacy">Privacy Policy</Link>
            <Link className="legal-button" to="/#request-demo">Contact</Link>
          </nav>
        </div>
      </header>

      <section className="legal-hero">
        <div className="legal-shell">
          <span className="legal-eyebrow">Legal & platform terms</span>
          <h1>Terms of Service</h1>
          <p>
            These terms establish the rules for accessing and using the
            VoterSpheres website, platform, intelligence tools, and services.
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
          <div className="legal-notice is-warning">
            <strong>Important</strong>
            <p>
              VoterSpheres supports political intelligence and campaign
              operations but does not provide legal, campaign-finance, election,
              or accounting advice. Your organization remains responsible for
              compliance and final decisions.
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
