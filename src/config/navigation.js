const item = (label, to, description, options = {}) => ({
  label,
  to,
  description,
  keywords: options.keywords || "",
  featured: Boolean(options.featured),
  visibility: options.visibility || "core",
  adminOnly: Boolean(options.adminOnly),
});

const section = (label, description, startAt, items, options = {}) => ({
  label,
  shortLabel: options.shortLabel || label,
  featured: Boolean(options.featured),
  description,
  startAt,
  visibility: options.visibility || "core",
  adminOnly: Boolean(options.adminOnly),
  items,
});

export const navigationSections = [
  section(
    "Executive",
    "Understand the operating picture, receive intelligence, and make decisions.",
    "/executive-workspace",
    [
      item("Executive Workspace", "/executive-workspace", "Daily priorities, alerts, tasks, and shortcuts.", { featured: true, keywords: "home dashboard daily overview" }),
      item("Unified Executive Intelligence", "/executive-intelligence", "A synthesized briefing across polling, finance, news, signals, and operations."),
      item("Executive AI Command Platform", "/executive-ai-command-platform", "Ask questions and receive complete evidence-backed intelligence briefings.", { keywords: "ai copilot chief of staff candidate briefing" }),
      item("Mission Control", "/mission-control", "Monitor urgent risks, campaign conditions, and coordinated activity."),
      item("Executive Decision Intelligence", "/executive-decision-intelligence", "Compare options, consequences, confidence, and recommended decisions."),

      item("Dashboard", "/dashboard", "Legacy operating snapshot preserved for authorized users.", { visibility: "advanced" }),
      item("Platform Intelligence", "/platform-intelligence", "Platform-wide intelligence coverage and operating context.", { visibility: "advanced" }),
      item("Political Intelligence Fabric", "/political-intelligence-fabric", "Enterprise intelligence connections and provider coverage.", { visibility: "advanced" }),
      item("National Command", "/national-command", "National command view across campaigns and jurisdictions.", { visibility: "advanced" }),
      item("Autonomous Campaign Operations", "/autonomous-campaign-operations", "Automated monitoring and operational recommendations.", { visibility: "advanced" }),
    ],
    { featured: true }
  ),

  section(
    "Intelligence",
    "Review evidence, polling, narratives, relationships, influence, and political money.",
    "/political-signals",
    [
      item("Political Signals", "/political-signals", "Evidence-backed political, electoral, and organizational developments.", { featured: true }),
      item("Polling Intelligence", "/executive-polling-intelligence", "Polling, trends, averages, margins, and pollster analysis."),
      item("Narrative Intelligence", "/narrative-intelligence", "News narratives, sentiment, media momentum, and emerging risks."),
      item("Political Intelligence Graph", "/political-intelligence", "Connected candidates, committees, organizations, consultants, and signals."),
      item("Political Money Exposure", "/dark-money-exposure", "Money flows, disclosure gaps, transfers, and dark-money indicators."),
      item("Power & Influence Rankings", "/power-rankings", "Comparative political influence, network power, and strategic importance."),

      item("Relationship Graph", "/relationship-graph", "Legacy relationship exploration preserved for authorized users.", { visibility: "advanced" }),
      item("Influence Dashboard", "/influence", "Detailed influence scoring and relationship leverage.", { visibility: "advanced" }),
      item("Narrative Response", "/narrative-response", "Convert narrative risk into coordinated response actions.", { visibility: "advanced" }),
      item("Signal Matching", "/signal-matching", "Match signals to candidates, campaigns, and workspaces.", { visibility: "advanced" }),
      item("Live Intelligence Layer", "/live-intelligence-layer", "Inspect live intelligence feeds and operating events.", { visibility: "advanced" }),
      item("Live Data Refresh", "/live-data-refresh", "Review and initiate supported provider refresh workflows.", { visibility: "advanced" }),
    ]
  ),

  section(
    "Campaigns",
    "Research candidates and manage campaign finance, relationships, endorsements, and response.",
    "/candidates",
    [
      item("Candidates", "/candidates", "Search candidates and open complete candidate intelligence profiles.", { featured: true }),
      item("Campaign Finance Intelligence", "/campaign-finance-intelligence", "FEC filings, receipts, spending, cash, committees, and PAC activity."),
      item("Donor Network", "/donors", "Donor relationships, contribution patterns, and cultivation opportunities."),
      item("Endorsement Intelligence", "/endorsements", "Endorsements, validators, organizations, and endorsement opportunities."),
      item("Campaign CRM", "/campaign-crm", "Contacts, interactions, follow-ups, and relationship ownership."),
      item("Campaign War Room", "/war-room", "Active threats, coordinated responses, and rapid campaign decisions."),

      item("Fundraising Intelligence", "/fundraising", "Detailed candidate fundraising comparisons and performance.", { visibility: "advanced" }),
      item("Campaign Studio AI", "/campaign-operations-studio", "Develop campaign content, plans, and operating workflows.", { visibility: "advanced" }),
      item("Strategic Advisor", "/strategic-advisor", "Generate strategic guidance from current campaign intelligence.", { visibility: "advanced" }),
      item("AI Tactical", "/ai-tactical", "Translate strategy into immediate tactical actions.", { visibility: "advanced" }),
    ]
  ),

  section(
    "Strategy",
    "Understand likely outcomes, test scenarios, and prioritize strategic action.",
    "/forecast",
    [
      item("Executive Forecast", "/forecast", "Current race outlook, probability, momentum, and risk.", { featured: true }),
      item("Predictive Campaign Simulation", "/predictive-campaign-simulation", "Test strategic scenarios and projected consequences."),
      item("Strategy Recommendations", "/strategy", "Prioritized recommendations with rationale, owner, urgency, and status."),
      item("National Coalition Intelligence", "/coalitions", "Coalition opportunities, bridge organizations, and alliance development."),
      item("Campaign Opportunity Heatmap", "/campaign-opportunity-heatmap", "Geographic and strategic opportunity prioritization."),

      item("National Political Digital Twin", "/national-political-digital-twin", "Advanced model of the national political environment.", { visibility: "advanced" }),
    ]
  ),

  section(
    "Operations",
    "Assign work, manage geographic operations, and deploy campaign resources.",
    "/command-center",
    [
      item("Command Center", "/command-center", "Tasks, assignments, deadlines, escalation, and execution.", { featured: true }),
      item("State Operations", "/state-operations", "State and county or parish operating intelligence."),
      item("Election Map", "/map", "Races, candidates, election geography, and competitive conditions."),
      item("Vendor Network", "/vendors", "Political vendors, capabilities, relationships, and deployment readiness."),
      item("MailOps", "/mailops", "Direct-mail planning, approvals, targeting, production, and delivery."),
      item("Universal Search", "/search", "Search candidates, organizations, intelligence, reports, and operations."),

      item("State Operations Map", "/state-operations-map", "Legacy interactive state operations map.", { visibility: "advanced" }),
      item("Executive Operations Map", "/operations-map", "Executive geographic posture, risk, and activity.", { visibility: "advanced" }),
      item("Task Ownership", "/task-ownership", "Detailed ownership, accountability, and completion monitoring.", { visibility: "advanced" }),
      item("Notifications", "/notifications", "Alerts, updates, and items requiring attention.", { visibility: "advanced" }),
    ]
  ),

  section(
    "Business",
    "Manage clients, revenue, deliverables, subscriptions, and firm performance.",
    "/business-suite",
    [
      item("Consultant Business Suite", "/business-suite", "Clients, engagements, firm performance, and business operations.", { featured: true }),
      item("Revenue Pipeline", "/revenue-pipeline", "Prospects, deal stages, projected revenue, and next actions."),
      item("Client Portal", "/client-portal-admin", "Client access, shared intelligence, deliverables, and approvals."),
      item("Intelligence Reports", "/intelligence-reports", "Create, approve, manage, and deliver intelligence reports."),
      item("Billing", "/billing", "Plan, invoices, payment method, usage, and upgrades."),

      item("Revenue Intelligence", "/revenue-intelligence", "Detailed revenue analytics and business performance.", { visibility: "advanced" }),
      item("Opportunity Engine", "/opportunity-engine", "Discover and prioritize prospective campaign opportunities.", { visibility: "advanced" }),
      item("Report Exports", "/report-exports", "Export jobs, formats, distribution, and delivery history.", { visibility: "advanced" }),
    ]
  ),

  section(
    "Administration",
    "Firm administration, launch operations, customer access, and platform readiness.",
    "/admin/firm-users",
    [
      item("Firm Users", "/admin/firm-users", "Manage firm users, roles, and access.", { adminOnly: true }),
      item("Firm Invites", "/admin/firm-invites", "Invite and onboard firm users.", { adminOnly: true }),
      item("Candidate Profiles", "/admin/candidate-profiles", "Administer candidate profile records.", { adminOnly: true }),
      item("Beta Access", "/admin/beta-access", "Manage beta participation and customer access.", { adminOnly: true }),
      item("Live Intelligence Administration", "/admin/live-intelligence", "Administer providers and refresh state.", { adminOnly: true }),
      item("Admin Alerts", "/admin/alerts", "Review platform administrative alerts.", { adminOnly: true }),
      item("Enterprise Leads", "/admin/enterprise-leads", "Manage demo requests and enterprise prospects.", { adminOnly: true }),
      item("Admin Platform Tour", "/platform-tour?mode=admin", "Run the administrator platform tour.", { adminOnly: true }),
      item("Launch Automation", "/launch-automation", "Operate launch automation workflows.", { adminOnly: true }),
      item("Launch Data Seeder", "/launch-data-seeder", "Seed and validate launch data.", { adminOnly: true }),
      item("Launch Assets", "/launch-assets", "Manage launch assets and readiness material.", { adminOnly: true }),
      item("Launch Readiness", "/launch-readiness", "Review launch gates and readiness status.", { adminOnly: true }),
      item("Launch QA", "/launch-qa", "Run launch quality-assurance checks.", { adminOnly: true }),
      item("Production Hardening", "/production-hardening", "Review production security and resilience controls.", { adminOnly: true }),
      item("Database Stability", "/database-stability", "Monitor database stability and operating checks.", { adminOnly: true }),
      item("Beta Onboarding", "/beta-onboarding", "Coordinate customer beta onboarding.", { adminOnly: true }),
      item("Platform Tour", "/platform-tour", "Review the guided customer platform experience.", { adminOnly: true }),
    ],
    { visibility: "advanced", adminOnly: true, shortLabel: "Admin" }
  ),
];

export const flattenedNavigation = navigationSections.flatMap((group) =>
  group.items.map((entry) => ({
    ...entry,
    section: group.label,
    sectionDescription: group.description,
  }))
);
