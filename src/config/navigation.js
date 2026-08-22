const item = (label, to, description, options = {}) => ({

  label,

  to,

  description,

  keywords: options.keywords || "",

  featured: Boolean(options.featured),

  internalOnly: Boolean(options.internalOnly),

});

 

export const navigationSections = [

  {

    label: "Home",

    shortLabel: "Home",

    featured: true,

    description: "Start here for the daily executive picture and platform-wide intelligence.",

    startAt: "/executive-workspace",

    items: [

      item("Executive Workspace", "/executive-workspace", "Your daily command view, priorities, alerts, and next actions.", { featured: true, keywords: "home overview daily" }),

      item("Dashboard", "/dashboard", "A concise operating snapshot of campaigns, activity, and performance."),

      item("Unified Executive Intelligence", "/executive-intelligence", "Evidence-backed intelligence assembled into one executive view."),

      item("Political Intelligence Fabric", "/political-intelligence-fabric", "Enterprise intelligence connections across signals, people, money, and operations."),

      item("Platform Intelligence", "/platform-intelligence", "Platform-wide data health, intelligence coverage, and operational context."),

      item("Mission Control", "/mission-control", "Monitor urgent campaign priorities and coordinated execution."),

      item("National Command", "/national-command", "Enterprise national command view across campaigns and jurisdictions."),

      item("Platform Tour", "/platform-tour", "A guided explanation of VoterSpheres capabilities and workflows."),

    ],

  },

  {

    label: "Candidates",

    shortLabel: "Candidates",

    description: "Research candidates, monitor narratives, and understand the political environment.",

    startAt: "/candidates",

    items: [

      item("Candidates", "/candidates", "Search, compare, and open candidate intelligence profiles.", { featured: true }),

      item("Power Rankings", "/power-rankings", "Compare candidate and political influence rankings."),

      item("Endorsement Intelligence", "/endorsements", "Track endorsements, validators, and political support."),

      item("Political Signals", "/political-signals", "Monitor emerging political, electoral, and organizational signals."),

      item("Narrative Intelligence", "/narrative-intelligence", "Track news narratives, sentiment, and message movement."),

      item("Narrative Response", "/narrative-response", "Turn narrative risks into coordinated response actions."),

      item("Signal Matching", "/signal-matching", "Match relevant signals to campaigns, candidates, and workspaces."),

    ],

  },

  {

    label: "AI & Strategy",

    shortLabel: "AI & Strategy",

    description: "Ask questions, generate briefings, test decisions, and convert intelligence into strategy.",

    startAt: "/executive-ai-command-platform",

    items: [

      item("Executive AI Command Platform", "/executive-ai-command-platform", "Ask natural-language questions and receive complete evidence-backed briefings.", { featured: true, keywords: "copilot chief of staff briefing" }),

      item("Campaign Studio AI", "/campaign-operations-studio", "Develop campaign content, plans, and operating workflows."),

      item("Strategic Advisor", "/strategic-advisor", "Generate strategic guidance from current campaign intelligence."),

      item("AI Tactical", "/ai-tactical", "Translate strategy into tactical recommendations and actions."),

      item("War Room", "/war-room", "Coordinate fast-moving issues, threats, narratives, and responses."),

      item("Executive Decision Intelligence", "/executive-decision-intelligence", "Compare options, consequences, confidence, and recommended decisions."),

      item("AI Strategy Recommendations", "/strategy", "Review prioritized recommendations, rationale, ownership, and urgency."),

    ],

  },

  {

    label: "Polling & Forecasts",

    shortLabel: "Polling",

    description: "Understand polling, election geography, forecasts, scenarios, and opportunity.",

    startAt: "/executive-polling-intelligence",

    items: [

      item("Polling Intelligence", "/executive-polling-intelligence", "Live polling, trends, averages, pollsters, and candidate context.", { featured: true }),

      item("Executive Forecast Dashboard", "/forecast", "Review forecast movement, race posture, and modeled outlook."),

      item("Predictive Campaign Simulation", "/predictive-campaign-simulation", "Test strategic scenarios and likely campaign outcomes."),

      item("National Political Digital Twin", "/national-political-digital-twin", "Explore an enterprise model of the national political environment."),

      item("Election Map", "/map", "Explore races, candidates, and political conditions geographically."),

      item("State Operations", "/state-operations", "Open state-level operating intelligence and county or parish drilldowns."),

      item("State Operations Map", "/state-operations-map", "Navigate state operations through an interactive map."),

      item("Campaign Opportunity Heatmap", "/campaign-opportunity-heatmap", "Identify geographic and strategic campaign opportunities."),

    ],

  },

  {

    label: "Finance & Networks",

    shortLabel: "Finance",

    description: "Follow campaign money, donors, committees, relationships, coalitions, and influence.",

    startAt: "/campaign-finance-intelligence",

    items: [

      item("Campaign Finance Intelligence", "/campaign-finance-intelligence", "Review FEC totals, PAC activity, financial position, and finance trends.", { featured: true }),

      item("Fundraising Intelligence", "/fundraising", "Compare fundraising performance and candidate finance leaders."),

      item("Donor Network", "/donors", "Explore donor relationships, giving patterns, and financial networks."),

      item("Dark Money Exposure", "/dark-money-exposure", "Assess opaque funding, committee relationships, and financial risk."),

      item("Political Intelligence Graph", "/political-intelligence", "Explore connected political entities, relationships, and signals."),

      item("Relationship Graph", "/relationship-graph", "Map people, organizations, campaigns, and strategic connections."),

      item("National Coalition Intelligence", "/coalitions", "Identify coalitions, bridge entities, and partnership opportunities."),

      item("Influence Dashboard", "/influence", "Measure political influence, reach, and relationship leverage."),

    ],

  },

  {

    label: "Campaign Operations",

    shortLabel: "Operations",

    description: "Organize teams, vendors, communications, tasks, live intelligence, and execution.",

    startAt: "/command-center",

    items: [

      item("Command Center", "/command-center", "Coordinate priorities, workstreams, ownership, and campaign execution.", { featured: true }),

      item("Autonomous Campaign Operations", "/autonomous-campaign-operations", "Enterprise monitoring and automated operational recommendations."),

      item("Executive Operations Map", "/operations-map", "View operating posture, risks, and tactical activity geographically."),

      item("Campaign CRM", "/campaign-crm", "Manage campaign relationships, contacts, and follow-up activity."),

      item("Vendor Network", "/vendors", "Find, compare, and manage political vendors and capabilities."),

      item("MailOps", "/mailops", "Plan and monitor campaign mail operations."),

      item("Task Ownership", "/task-ownership", "Assign work, clarify owners, and monitor completion."),

      item("Live Intelligence Layer", "/live-intelligence-layer", "Monitor live sources, events, and operational intelligence."),

      item("Live Data Refresh", "/live-data-refresh", "Review and initiate supported data refresh workflows."),

      item("Universal Search", "/search", "Search across candidates, intelligence, reports, and operations."),

      item("Notifications", "/notifications", "Review alerts, updates, and items requiring attention."),

    ],

  },

  {

    label: "Reports & Business",

    shortLabel: "Reports",

    description: "Deliver intelligence, develop opportunities, support clients, and manage the subscription.",

    startAt: "/intelligence-reports",

    items: [

      item("Intelligence Reports", "/intelligence-reports", "Create, review, and manage client-ready intelligence reports.", { featured: true }),

      item("Report Exports", "/report-exports", "Export and distribute approved reports."),

      item("Consultant Business Suite", "/business-suite", "Manage the enterprise consultant business and client portfolio."),

      item("Revenue Pipeline", "/revenue-pipeline", "Track prospective business, stages, value, and next actions."),

      item("Revenue Intelligence", "/revenue-intelligence", "Analyze revenue opportunities and business performance."),

      item("Opportunity Engine", "/opportunity-engine", "Identify and prioritize potential client and campaign opportunities."),

      item("Client Portal", "/client-portal-admin", "Manage client-facing access, intelligence, and deliverables."),

      item("Billing", "/billing", "Review the current plan, usage, billing, and upgrade options."),

    ],

  },

  {

    label: "Administration",

    shortLabel: "Admin",

    description: "Platform administration, launch operations, customer access, and system readiness.",

    startAt: "/admin/firm-users",

    internalOnly: true,

    items: [

      item("Firm Users", "/admin/firm-users", "Manage firm users and roles."),

      item("Firm Invites", "/admin/firm-invites", "Invite and onboard firm users."),

      item("Candidate Profiles", "/admin/candidate-profiles", "Administer candidate profile records."),

      item("Beta Access", "/admin/beta-access", "Manage beta access and customer participation.", { internalOnly: true }),

      item("Live Intelligence", "/admin/live-intelligence", "Administer live intelligence providers and refresh state.", { internalOnly: true }),

      item("Admin Alerts", "/admin/alerts", "Review platform administrative alerts.", { internalOnly: true }),

      item("Enterprise Leads", "/admin/enterprise-leads", "Manage demo requests and enterprise prospects.", { internalOnly: true }),

      item("Admin Platform Tour", "/platform-tour?mode=admin", "Run the administrator version of the platform tour.", { internalOnly: true }),

      item("Launch Automation", "/launch-automation", "Operate launch automation workflows.", { internalOnly: true }),

      item("Launch Data Seeder", "/launch-data-seeder", "Seed and validate launch data.", { internalOnly: true }),

      item("Launch Assets", "/launch-assets", "Manage launch assets and readiness materials.", { internalOnly: true }),

      item("Launch Readiness", "/launch-readiness", "Review launch gates and readiness status.", { internalOnly: true }),

      item("Launch QA", "/launch-qa", "Run launch quality-assurance checks.", { internalOnly: true }),

      item("Production Hardening", "/production-hardening", "Review production security and resilience controls.", { internalOnly: true }),

      item("Database Stability", "/database-stability", "Monitor database stability and operational checks.", { internalOnly: true }),

      item("Beta Onboarding", "/beta-onboarding", "Coordinate customer beta onboarding."),

    ],

  },

];

 

export const flattenedNavigation = navigationSections.flatMap((section) =>

  section.items.map((entry) => ({

    ...entry,

    section: section.label,

    sectionDescription: section.description,

  }))

);