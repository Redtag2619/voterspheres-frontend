export const platformTourSteps = [
  {
    id: "workspace-command",
    chapter: "Executive Command",
    route: "/executive-workspace",
    page: "Executive Workspace", 
    section: "Executive command home",
    heading: "Executive command view",
    label: "Command value",
    target: {
      dataTour: "workspace-command",
      selector: ".workspace-command-card",
      headingText: ["Workspace Command View", "Executive Workspace"],
    },
    narration:
      "VoterSpheres begins in the Executive Workspace. This is the operating home for launch readiness, political intelligence, campaign execution, CRM, revenue, reports, and executive actions.",
    value:
      "Leadership receives one command view for understanding what is happening, what is at risk, and what should happen next.",
  },
  {
    id: "workspace-kpis",
    chapter: "Executive Command",
    route: "/executive-workspace",
    page: "Executive Workspace",
    section: "Executive indicators",
    heading: "Operating KPIs",
    label: "Decision support",
    target: {
      dataTour: "workspace-kpis",
      selector: ".vs-grid-4",
      headingText: ["Workspace Readiness", "Launch Score", "Pressure Score", "Pipeline"],
    },
    narration:
      "These indicators summarize workspace readiness, launch posture, campaign pressure, and opportunity pipeline. They are designed for a fast executive scan before deeper review.",
    value:
      "The team can decide where attention should go before opening a deeper workflow.",
  },
  {
    id: "workspace-tabs",
    chapter: "Executive Command",
    route: "/executive-workspace",
    page: "Executive Workspace",
    section: "Workspace navigation",
    heading: "Operating tabs",
    label: "Platform flow",
    target: {
      dataTour: "workspace-tabs",
      selector: ".workspace-tabs",
      headingText: ["Home", "Launch", "Intelligence", "Operations", "CRM", "Revenue", "Reports", "Tools"],
    },
    narration:
      "Workspace tabs organize the campaign and consulting workflow into launch, intelligence, operations, CRM, revenue, reports, and tools.",
    value:
      "Users can move through the full operating workflow without feeling like they are switching products.",
  },
  {
    id: "workspace-actions",
    chapter: "Executive Command",
    route: "/executive-workspace",
    page: "Executive Workspace",
    section: "Action routing",
    heading: "Guided actions",
    label: "Workflow advantage",
    target: {
      dataTour: "workspace-actions",
      selector: ".workspace-actions",
      headingText: ["Review Launch Gate", "Intelligence", "Operations", "Revenue", "Universal Search"],
    },
    narration:
      "The action area routes users directly into launch, intelligence, operations, revenue, and search workflows.",
    value:
      "The workspace becomes an execution launchpad instead of only a dashboard.",
  },
  {
    id: "mission-control",
    chapter: "Executive Command",
    route: "/mission-control",
    page: "Mission Control",
    section: "Executive operating posture",
    heading: "Mission readiness",
    label: "Operational awareness",
    target: {
      dataTour: "mission-control-brief",
      selector: "main .vs-section-card, main",
      headingText: ["Executive Brief", "Mission Control", "Mission Readiness"],
    },
    narration:
      "Mission Control combines campaign pressure, operational readiness, CRM follow-up, vendor gaps, rapid response, and executive recommendations.",
    value:
      "Executives can identify the highest-priority operating issue without reviewing every underlying system.",
  },
  {
    id: "political-fabric-summary",
    chapter: "Intelligence Fabric",
    route: "/political-intelligence-fabric",
    page: "Political Intelligence Fabric",
    section: "Executive synthesis",
    heading: "Executive intelligence assessment",
    label: "Unified intelligence",
    target: {
      dataTour: "fabric-summary",
      selector: ".pif-executive-summary, main",
      headingText: ["Executive Intelligence Assessment", "Current Assessment"],
    },
    narration:
      "The Political Intelligence Fabric combines national, state, candidate, coalition, vendor, finance, influence, execution, and decision signals into one executive synthesis.",
    value:
      "Leaders receive a unified interpretation instead of disconnected data feeds.",
  },
  {
    id: "political-fabric-map",
    chapter: "Intelligence Fabric",
    route: "/political-intelligence-fabric",
    page: "Political Intelligence Fabric",
    section: "National signal geography",
    heading: "National political signal map",
    label: "Geographic concentration",
    target: {
      dataTour: "fabric-map",
      selector: ".pif-map-layout, .pif-map-shell",
      headingText: ["National Political Signal Map"],
    },
    narration:
      "The national signal map shows where political intelligence is concentrating across all fifty states and Washington, D.C.",
    value:
      "The map turns national intelligence into a state-level prioritization system.",
  },
  {
    id: "political-fabric-findings",
    chapter: "Intelligence Fabric",
    route: "/political-intelligence-fabric",
    page: "Political Intelligence Fabric",
    section: "Priority findings",
    heading: "Political findings",
    label: "Executive triage",
    target: {
      dataTour: "fabric-findings",
      selector: ".pif-finding-list, main",
      headingText: ["Political Findings"],
    },
    narration:
      "Political Findings ranks the most important intelligence signals and provides evidence, confidence, geographic context, and severity.",
    value:
      "Executives can move from broad monitoring to the exact issue that deserves review.",
  },
  {
    id: "political-fabric-health",
    chapter: "Intelligence Fabric",
    route: "/political-intelligence-fabric",
    page: "Political Intelligence Fabric",
    section: "Connected systems",
    heading: "Source health",
    label: "System trust",
    target: {
      dataTour: "fabric-source-health",
      selector: ".pif-source-list, main",
      headingText: ["Source Health"],
    },
    narration:
      "Source Health shows whether each connected intelligence system is online, connected but empty, degraded, or unavailable.",
    value:
      "Users can judge the freshness and reliability of the executive synthesis.",
  },
  {
    id: "executive-decision",
    chapter: "Intelligence Fabric",
    route: "/executive-decision-intelligence",
    page: "Executive Decision Intelligence",
    section: "Decision support",
    heading: "Executive decision queue",
    label: "Prioritized decisions",
    target: {
      dataTour: "decision-queue",
      selector: "main .vs-section-card, main",
      headingText: ["Decision", "Recommended Action", "Executive"],
    },
    narration:
      "Executive Decision Intelligence ranks high-impact decisions, supporting evidence, confidence, risk, and recommended next actions.",
    value:
      "Leadership can move from intelligence to a documented and defensible decision.",
  },
  {
    id: "forecast",
    chapter: "Forecast and Strategy",
    route: "/forecast",
    page: "Executive Forecast Dashboard",
    section: "Predictive outlook",
    heading: "Forecast intelligence",
    label: "Forward visibility",
    target: {
      dataTour: "forecast-kpis",
      selector: ".vs-grid-4, main",
      headingText: ["Forecast", "Win Probability", "Risk"],
    },
    narration:
      "The Executive Forecast Dashboard translates campaign, finance, influence, and political signals into forward-looking race intelligence.",
    value:
      "Teams can identify movement before it becomes obvious in conventional reporting.",
  },
  {
    id: "coalitions",
    chapter: "Forecast and Strategy",
    route: "/coalitions",
    page: "National Coalition Intelligence",
    section: "Coalition strength",
    heading: "Coalition intelligence",
    label: "Support structure",
    target: {
      dataTour: "coalition-kpis",
      selector: ".vs-grid-4, main",
      headingText: ["Coalition", "National Coalition Intelligence"],
    },
    narration:
      "Coalition Intelligence measures the strength, movement, and risk inside key political constituencies and alliance networks.",
    value:
      "Campaigns can see where support is strengthening, weakening, or available for expansion.",
  },
  {
    id: "influence",
    chapter: "Forecast and Strategy",
    route: "/influence",
    page: "Influence Dashboard",
    section: "Influence networks",
    heading: "Influence intelligence",
    label: "Power visibility",
    target: {
      dataTour: "influence-kpis",
      selector: ".vs-grid-4, main",
      headingText: ["Influence", "Influence Dashboard"],
    },
    narration:
      "The Influence Dashboard identifies the people, organizations, donors, consultants, and relationships shaping the political environment.",
    value:
      "Hidden influence becomes measurable and operationally useful.",
  },
  {
    id: "strategy",
    chapter: "Forecast and Strategy",
    route: "/strategy",
    page: "AI Strategy Recommendations",
    section: "Strategy guidance",
    heading: "AI strategy recommendations",
    label: "Recommended moves",
    target: {
      dataTour: "strategy-recommendations",
      selector: "main .vs-section-card, main",
      headingText: ["Strategy", "Recommendation"],
    },
    narration:
      "AI Strategy Recommendations convert campaign conditions into prioritized strategic options with rationale, confidence, and expected impact.",
    value:
      "Teams receive actionable choices instead of generic observations.",
  },
  {
    id: "candidates",
    chapter: "Campaign Intelligence",
    route: "/candidates",
    page: "Candidate Intelligence",
    section: "Candidate research",
    heading: "Candidate intelligence",
    label: "Research context",
    target: {
      dataTour: "candidate-kpis",
      selector: ".vs-grid-4, main",
      headingText: ["Candidates", "Candidate Intelligence"],
    },
    narration:
      "Candidate Intelligence centralizes profiles, offices, states, parties, FEC linkage, contact intelligence, verification, and readiness scoring.",
    value:
      "Teams can research candidates faster and connect profile quality to campaign planning.",
  },
  {
    id: "fundraising",
    chapter: "Campaign Intelligence",
    route: "/fundraising",
    page: "Fundraising Intelligence",
    section: "Campaign finance",
    heading: "Fundraising momentum",
    label: "Financial strength",
    target: {
      dataTour: "fundraising-kpis",
      selector: ".vs-grid-4, main",
      headingText: ["Fundraising", "Finance"],
    },
    narration:
      "Fundraising Intelligence tracks finance leaders, momentum, cash position, and comparative campaign money movement.",
    value:
      "Users can identify which campaigns are gaining financial strength and which require intervention.",
  },
  {
    id: "donors",
    chapter: "Campaign Intelligence",
    route: "/donors",
    page: "Donor Network",
    section: "Fundraising relationships",
    heading: "Donor network",
    label: "Finance relationships",
    target: {
      dataTour: "donor-kpis",
      selector: ".vs-grid-4, main",
      headingText: ["Donor Network", "Donors"],
    },
    narration:
      "The Donor Network explains contribution patterns, donor clusters, finance influence, and relationship opportunities.",
    value:
      "Teams can understand who is driving the money behind a campaign signal.",
  },
  {
    id: "operations-map",
    chapter: "Operations and Execution",
    route: "/operations-map",
    page: "Executive Operations Map",
    section: "Operational coverage",
    heading: "National operations map",
    label: "Coverage visibility",
    target: {
      dataTour: "operations-map",
      selector: ".map, svg, canvas, .leaflet-container, main",
      headingText: ["Executive Operations Map", "Operations Map"],
    },
    narration:
      "The Executive Operations Map shows campaign infrastructure, geographic coverage, vendor gaps, activity concentration, and execution pressure.",
    value:
      "Operational weaknesses become visible before they turn into campaign execution failures.",
  },
  {
    id: "command-center",
    chapter: "Operations and Execution",
    route: "/command-center",
    page: "Command Center",
    section: "Execution",
    heading: "Execution board",
    label: "Accountability",
    target: {
      dataTour: "command-execution-board",
      selector: ".task-filter-bar, .county-task-grid-wrap, table, .vs-table, main",
      headingText: ["Executive Execution Board", "Execution Board"],
    },
    narration:
      "The Command Center converts intelligence into tasks, ownership, priorities, and operational follow-through.",
    value:
      "This is where intelligence becomes accountable execution.",
  },
  {
    id: "vendors",
    chapter: "Operations and Execution",
    route: "/vendors",
    page: "Vendor Network",
    section: "Operational partners",
    heading: "Vendor coverage",
    label: "Partner intelligence",
    target: {
      dataTour: "vendor-kpis",
      selector: ".vs-grid-4, main",
      headingText: ["Vendor Network", "Vendors"],
    },
    narration:
      "Vendor Network identifies operating partners by category, geography, performance, capacity, and campaign need.",
    value:
      "Teams can see where they have execution support and where gaps remain.",
  },
  {
    id: "mailops",
    chapter: "Operations and Execution",
    route: "/mailops",
    page: "MailOps",
    section: "Direct mail execution",
    heading: "Mail operations",
    label: "Production visibility",
    target: {
      dataTour: "mailops-kpis",
      selector: ".vs-grid-4, table, main",
      headingText: ["MailOps", "Mail"],
    },
    narration:
      "MailOps tracks direct mail production, campaign mail events, vendors, drops, deadlines, and delivery visibility.",
    value:
      "Campaigns can catch production risk before it becomes a political problem.",
  },
  {
    id: "live-intelligence",
    chapter: "Operations and Execution",
    route: "/live-intelligence-layer",
    page: "Live Intelligence Layer",
    section: "Data readiness",
    heading: "Live intelligence readiness",
    label: "Freshness and availability",
    target: {
      dataTour: "live-readiness-summary",
      selector: ".live-overview-grid, main",
      headingText: ["Live Intelligence Layer", "Readiness"],
    },
    narration:
      "The Live Intelligence Layer monitors freshness, availability, coverage, blockers, and readiness across connected campaign data feeds.",
    value:
      "Executives can distinguish live intelligence from stale, incomplete, or unavailable data.",
  },
  {
    id: "campaign-crm",
    chapter: "CRM and Business Growth",
    route: "/campaign-crm",
    page: "Campaign CRM",
    section: "Relationship management",
    heading: "Campaign CRM",
    label: "Relationship system",
    target: {
      dataTour: "crm-kpis",
      selector: ".vs-grid-4, main",
      headingText: ["Campaign CRM", "Contacts", "Organizations"],
    },
    narration:
      "Campaign CRM organizes contacts, organizations, relationship history, follow-ups, and client development activity.",
    value:
      "Political relationships become searchable, measurable, and actionable.",
  },
  {
    id: "opportunity-engine",
    chapter: "CRM and Business Growth",
    route: "/opportunity-engine",
    page: "Opportunity Engine",
    section: "Growth pipeline",
    heading: "Opportunity scoring",
    label: "Growth prioritization",
    target: {
      dataTour: "opportunity-kpis",
      selector: ".vs-grid-4, main",
      headingText: ["Opportunity Engine", "Opportunity"],
    },
    narration:
      "The Opportunity Engine scores campaign and consulting opportunities and routes qualified prospects into CRM, task, and revenue workflows.",
    value:
      "Consultants can prioritize growth opportunities using evidence instead of guesswork.",
  },
  {
    id: "business-suite",
    chapter: "CRM and Business Growth",
    route: "/business-suite",
    page: "Consultant Business Suite",
    section: "Business operations",
    heading: "Business command",
    label: "Firm visibility",
    target: {
      dataTour: "business-kpis",
      selector: ".vs-grid-4, main",
      headingText: ["Business Suite", "Clients", "Invoices"],
    },
    narration:
      "The Consultant Business Suite manages clients, retainers, invoices, projects, staff, and consulting operations.",
    value:
      "The business side of political consulting stays connected to campaign intelligence.",
  },
  {
    id: "reports",
    chapter: "Reports and Search",
    route: "/intelligence-reports",
    page: "Intelligence Reports",
    section: "Client-ready deliverables",
    heading: "Report generation",
    label: "Strategic output",
    target: {
      dataTour: "reports-kpis",
      selector: ".vs-grid-4, main",
      headingText: ["Intelligence Reports", "Reports"],
    },
    narration:
      "Intelligence Reports convert platform data into strategic deliverables for campaigns, clients, consultants, and leadership teams.",
    value:
      "Live intelligence becomes client-ready output without rebuilding the analysis from scratch.",
  },
  {
    id: "search",
    chapter: "Reports and Search",
    route: "/search",
    page: "Universal Search",
    section: "Discovery",
    heading: "Universal search",
    label: "Discovery speed",
    target: {
      dataTour: "search-input",
      selector: "input[type='search'], input, main",
      headingText: ["Universal Search", "Search"],
    },
    narration:
      "Universal Search finds candidates, reports, vendors, clients, tasks, signals, and workspaces from one place.",
    value:
      "Users no longer need to remember where every record lives.",
  },
  {
    id: "tour-complete",
    chapter: "Tour Complete",
    route: "/executive-workspace",
    page: "Tour Complete",
    section: "Wrap-up",
    heading: "Ready to operate",
    label: "Platform summary",
    target: {
      dataTour: "workspace-command",
      selector: ".workspace-command-card, main",
      headingText: ["Executive Workspace", "Workspace Command View"],
    },
    narration:
      "The VoterSpheres platform connects political intelligence, campaign execution, relationship management, revenue, and reporting in one operating system.",
    value:
      "Return to Executive Workspace whenever you need to understand the situation and move directly into action.",
  },
];

export const adminTourSteps = [
  {
    id: "launch-readiness",
    chapter: "Launch Control",
    route: "/launch-readiness",
    page: "Launch Readiness",
    section: "Executive launch gate",
    heading: "Launch decision",
    label: "Go-live control",
    target: {
      dataTour: "launch-readiness-summary",
      selector: ".vs-grid-4, main",
      headingText: ["Launch Readiness", "Launch Decision"],
    },
    narration:
      "Launch Readiness combines the major platform gates into one final executive launch decision.",
    value:
      "Administrators can see whether the platform is ready, conditionally ready, or blocked.",
  },
  {
    id: "production-hardening",
    chapter: "Launch Control",
    route: "/production-hardening",
    page: "Production Hardening",
    section: "Production controls",
    heading: "Hardening posture",
    label: "Deployment safety",
    target: {
      dataTour: "hardening-summary",
      selector: ".vs-grid-4, main",
      headingText: ["Production Hardening", "Environment", "Security"],
    },
    narration:
      "Production Hardening validates environment variables, security, billing, database readiness, workflows, alerts, and deployment blockers.",
    value:
      "The team can identify technical risks before they reach subscribers.",
  },
  {
    id: "launch-qa",
    chapter: "Launch Control",
    route: "/launch-qa",
    page: "Launch QA",
    section: "Quality assurance",
    heading: "QA readiness",
    label: "Release validation",
    target: {
      dataTour: "launch-qa-summary",
      selector: ".vs-grid-4, main",
      headingText: ["Launch QA", "Smoke Tests"],
    },
    narration:
      "Launch QA validates critical routes, authentication, billing, API health, data, reports, alerts, and workflow smoke tests.",
    value:
      "Release confidence comes from verified workflows instead of assumptions.",
  },
  {
    id: "database-stability",
    chapter: "Infrastructure",
    route: "/database-stability",
    page: "Database Stability",
    section: "PostgreSQL health",
    heading: "Database readiness",
    label: "Infrastructure confidence",
    target: {
      dataTour: "database-summary",
      selector: ".vs-grid-4, main",
      headingText: ["Database Stability", "Postgres", "Latency"],
    },
    narration:
      "Database Stability monitors connectivity, latency, pool pressure, critical tables, and persistence blockers.",
    value:
      "Administrators can confirm that the data layer is ready for production traffic.",
  },
  {
    id: "live-intelligence-admin",
    chapter: "Infrastructure",
    route: "/live-intelligence-layer",
    page: "Live Intelligence Layer",
    section: "Feed health",
    heading: "Live feed readiness",
    label: "Data availability",
    target: {
      dataTour: "live-readiness-summary",
      selector: ".live-overview-grid, main",
      headingText: ["Live Intelligence Layer", "Readiness"],
    },
    narration:
      "The Live Intelligence Layer monitors freshness and availability across candidate, FEC, signal, vendor, CRM, report, alert, workspace, and revenue feeds.",
    value:
      "The team can identify stale, unavailable, or incomplete data before customers rely on it.",
  },
  {
    id: "live-data-refresh",
    chapter: "Infrastructure",
    route: "/live-data-refresh",
    page: "Live Data Refresh",
    section: "Refresh operations",
    heading: "Refresh control",
    label: "Data recovery",
    target: {
      dataTour: "live-refresh-summary",
      selector: ".vs-grid-4, main",
      headingText: ["Live Data Refresh", "Refresh"],
    },
    narration:
      "Live Data Refresh coordinates manual and automated refresh actions across platform data sources.",
    value:
      "Administrators can recover stale feeds without restarting the entire platform.",
  },
  {
    id: "launch-automation",
    chapter: "Launch Operations",
    route: "/launch-automation",
    page: "Launch Automation",
    section: "Automated readiness",
    heading: "Launch automation",
    label: "Operational control",
    target: {
      dataTour: "launch-automation-summary",
      selector: ".vs-grid-4, main",
      headingText: ["Launch Automation"],
    },
    narration:
      "Launch Automation runs pre-launch checks and coordinates readiness signals across the platform.",
    value:
      "The team can repeat launch validation consistently instead of relying on manual memory.",
  },
  {
    id: "launch-seeder",
    chapter: "Launch Operations",
    route: "/launch-data-seeder",
    page: "Launch Data Seeder",
    section: "Launch data",
    heading: "Data seeding",
    label: "Demo and readiness data",
    target: {
      dataTour: "launch-seeder-summary",
      selector: ".vs-grid-4, main",
      headingText: ["Launch Data Seeder", "Seeder"],
    },
    narration:
      "The Launch Data Seeder creates controlled records required for launch testing, demos, and validation.",
    value:
      "The team can test platform workflows using predictable data.",
  },
  {
    id: "launch-assets",
    chapter: "Launch Operations",
    route: "/launch-assets",
    page: "Launch Assets",
    section: "Release assets",
    heading: "Launch assets",
    label: "Release coordination",
    target: {
      dataTour: "launch-assets-summary",
      selector: ".vs-grid-4, main",
      headingText: ["Launch Assets"],
    },
    narration:
      "Launch Assets tracks the documents, links, credentials, content, and operational materials required for release.",
    value:
      "Important launch materials remain visible and accountable.",
  },
  {
    id: "beta-onboarding",
    chapter: "Customer Operations",
    route: "/beta-onboarding",
    page: "Beta Onboarding",
    section: "Customer onboarding",
    heading: "Beta customer pipeline",
    label: "Launch cohort management",
    target: {
      dataTour: "beta-onboarding-summary",
      selector: ".vs-grid-4, main",
      headingText: ["Beta Onboarding"],
    },
    narration:
      "Beta Onboarding tracks customer stage, readiness, setup, and follow-up across the launch cohort.",
    value:
      "The team can manage early customers as an operating pipeline.",
  },
  {
    id: "beta-access",
    chapter: "Customer Operations",
    route: "/admin/beta-access",
    page: "Beta Access",
    section: "Private beta controls",
    heading: "Beta access administration",
    label: "Access control",
    target: {
      dataTour: "beta-access-kpis",
      selector: ".vs-grid-4, main",
      headingText: ["Beta Access", "Pending Signups", "Total Rules"],
    },
    narration:
      "Beta Access manages approved emails, approved domains, blocked signup attempts, invitations, and private beta admission.",
    value:
      "Administrators control exactly who can enter the platform during launch.",
  },
  {
    id: "admin-alerts",
    chapter: "Customer Operations",
    route: "/admin/alerts",
    page: "Admin Alerts",
    section: "Administrative monitoring",
    heading: "Admin alert center",
    label: "Operational warnings",
    target: {
      dataTour: "admin-alerts-summary",
      selector: ".vs-grid-4, main",
      headingText: ["Admin Alerts", "Alerts"],
    },
    narration:
      "Admin Alerts centralizes platform warnings, delivery failures, rules, and operational issues requiring administrative review.",
    value:
      "The team can manage system risk before it reaches subscribers.",
  },
  {
    id: "enterprise-leads",
    chapter: "Customer Operations",
    route: "/admin/enterprise-leads",
    page: "Enterprise Leads",
    section: "Enterprise pipeline",
    heading: "Enterprise lead administration",
    label: "Sales operations",
    target: {
      dataTour: "enterprise-leads-summary",
      selector: ".vs-grid-4, main",
      headingText: ["Enterprise Leads"],
    },
    narration:
      "Enterprise Leads manages demo requests, qualification, notes, provisioning, and conversion into active workspaces.",
    value:
      "The enterprise sales pipeline connects directly to platform onboarding.",
  },
  {
    id: "admin-tour-complete",
    chapter: "Tour Complete",
    route: "/launch-readiness",
    page: "Admin Tour Complete",
    section: "Wrap-up",
    heading: "Ready to administer",
    label: "Administrative summary",
    target: {
      dataTour: "launch-readiness-summary",
      selector: "main",
      headingText: ["Launch Readiness"],
    },
    narration:
      "The administrative tour is complete. Use Launch Readiness as the control point for production health, customer access, data freshness, and release operations.",
    value:
      "The platform now has one coordinated administrative workflow for launch and ongoing production control.",
  },
];

export function getTourSteps(mode = "platform") {
  return mode === "admin" ? adminTourSteps : platformTourSteps;
}
