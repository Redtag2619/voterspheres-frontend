export const navigationSections = [
  {
    label: "Executive",
    featured: true,
    items: [
      { label: "Executive Workspace", to: "/executive-workspace" },
      { label: "Executive AI Command Platform", to: "/executive-ai-command-platform" },
      { label: "National Political Digital Twin", to: "/national-political-digital-twin" },
      { label: "Autonomous Campaign Operations", to: "/autonomous-campaign-operations" },
      { label: "Executive Decision Intelligence", to: "/executive-decision-intelligence" },
      { label: "Predictive Campaign Simulation", to: "/predictive-campaign-simulation" },
      { label: "Executive Operations Map", to: "/operations-map" },
      { label: "Executive Forecast Dashboard", to: "/forecast" },
      { label: "AI Strategy Recommendations", to: "/strategy" },
      { label: "National Coalition Intelligence", to: "/coalitions" },
      { label: "Influence Dashboard", to: "/influence" },
      { label: "Mission Control", to: "/mission-control" },
      { label: "National Command", to: "/national-command" },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { label: "Platform Intelligence", to: "/platform-intelligence" },
      { label: "Political Intelligence Graph", to: "/political-intelligence" },
      { label: "Relationship Graph", to: "/relationship-graph" },
      { label: "Political Signals", to: "/political-signals" },
      { label: "Power Rankings", to: "/power-rankings" },
      { label: "Dark Money Exposure", to: "/dark-money-exposure" },
      { label: "Narrative Intelligence", to: "/narrative-intelligence" },
      { label: "Narrative Response", to: "/narrative-response" },
      { label: "Signal Matching", to: "/signal-matching" },
    ],
  },
  {
    label: "Campaigns",
    items: [
      { label: "Candidates", to: "/candidates" },
      { label: "Donor Network", to: "/donors" },
      { label: "Endorsement Intelligence", to: "/endorsements" },
      { label: "Campaign CRM", to: "/campaign-crm" },
      { label: "AI Campaign Co-Pilot", to: "/campaign-copilot" },
      { label: "Strategic Advisor", to: "/strategic-advisor" },
      { label: "War Room", to: "/war-room" },
      { label: "AI Tactical", to: "/ai-tactical" },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Command Center", to: "/command-center" },
      { label: "Vendor Network", to: "/vendors" },
      { label: "MailOps", to: "/mailops" },
      { label: "Task Ownership", to: "/task-ownership" },
      { label: "Live Intelligence Layer", to: "/live-intelligence-layer" },
      { label: "Live Data Refresh", to: "/live-data-refresh" },
      { label: "Universal Search", to: "/search" },
      { label: "Notifications", to: "/notifications" },
    ],
  },
  {
    label: "Maps",
    items: [
      { label: "Election Map", to: "/map" },
      { label: "State Operations", to: "/state-operations" },
      { label: "State Operations Map", to: "/state-operations-map" },
      { label: "Campaign Opportunity Heatmap", to: "/campaign-opportunity-heatmap" },
    ],
  },
  {
    label: "Business",
    items: [
      { label: "Consultant Business Suite", to: "/business-suite" },
      { label: "Revenue Pipeline", to: "/revenue-pipeline" },
      { label: "Revenue Intelligence", to: "/revenue-intelligence" },
      { label: "Opportunity Engine", to: "/opportunity-engine" },
      { label: "Client Portal", to: "/client-portal-admin" },
      { label: "Intelligence Reports", to: "/intelligence-reports" },
      { label: "Report Exports", to: "/report-exports" },
      { label: "Billing", to: "/billing" },
    ],
  },
  {
    label: "Launch & Admin",
    items: [
      { label: "Dashboard", to: "/dashboard" },
      { label: "Platform Tour", to: "/platform-tour" },
      { label: "Launch Automation", to: "/launch-automation" },
      { label: "Launch Data Seeder", to: "/launch-data-seeder" },
      { label: "Launch Assets", to: "/launch-assets" },
      { label: "Launch Readiness", to: "/launch-readiness" },
      { label: "Launch QA", to: "/launch-qa" },
      { label: "Production Hardening", to: "/production-hardening" },
      { label: "Database Stability", to: "/database-stability" },
      { label: "Beta Onboarding", to: "/beta-onboarding" },
    ],
  },
  {
    label: "Admin",
    items: [
      { label: "Firm Users", to: "/admin/firm-users" },
      { label: "Firm Invites", to: "/admin/firm-invites" },
      { label: "Candidate Profiles", to: "/admin/candidate-profiles" },
      { label: "Beta Access", to: "/admin/beta-access" },
      { label: "Live Intelligence", to: "/admin/live-intelligence" },
      { label: "Admin Alerts", to: "/admin/alerts" },
      { label: "Enterprise Leads", to: "/admin/enterprise-leads" },
      { label: "Admin Platform Tour", to: "/platform-tour?mode=admin" },
    ],
  },
];

export const flattenedNavigation = navigationSections.flatMap((section) =>
  section.items.map((item) => ({
    ...item,
    section: section.label,
  }))
);
