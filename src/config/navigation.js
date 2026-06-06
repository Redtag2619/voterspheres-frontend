export const navigationSections = [
  {
    label: "Executive",
    items: [
      { label: "Dashboard", to: "/dashboard" },
      { label: "National Command", to: "/national-command" },
      { label: "Mission Control", to: "/mission-control" },
      { label: "Executive Intelligence", to: "/executive-intelligence" },
      { label: "Operations Map", to: "/operations-map" },
      { label: "State Operations", to: "/state-operations" },
      { label: "State Operations Map", to: "/state-operations-map" },
      { label: "Notifications", to: "/notifications" },
      { label: "Revenue Intelligence", to: "/revenue-intelligence" },
    ],
  },
  {
    label: "Campaign Ops",
    items: [
      { label: "Command Center", to: "/command-center" },
      { label: "Campaign CRM", to: "/campaign-crm" },
      { label: "Workspaces", to: "/workspaces" },
      { label: "Campaign Workspace", to: "/campaign-workspace" },
      { label: "War Room", to: "/war-room" },
      { label: "Task Ownership", to: "/task-ownership" },
      { label: "MailOps", to: "/mailops" },
      { label: "Vendors", to: "/vendors" },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { label: "Political Intelligence Graph", to: "/political-intelligence" },
      { label: "Strategic Advisor", to: "/strategic-advisor" },
      { label: "AI Campaign Co-Pilot", to: "/campaign-copilot" },
      { label: "AI Chat", to: "/ai-chat" },
      { label: "AI Tactical", to: "/ai-tactical" },
      { label: "Political Signals", to: "/political-signals" },
      { label: "Relationship Graph", to: "/relationship-graph" },
      { label: "Committee Intel", to: "/committee-intel" },
      { label: "Dark Money Exposure", to: "/dark-money-exposure" },
      { label: "Narrative Intelligence", to: "/narrative-intelligence" },
      { label: "Narrative Response", to: "/narrative-response" },
      { label: "Signal Matching", to: "/signal-matching" },
    ],
  },
  {
    label: "Elections",
    items: [
      { label: "Candidates", to: "/candidates" },
      { label: "Election Map", to: "/map" },
      { label: "Forecast", to: "/forecast" },
      { label: "Power Rankings", to: "/power-rankings" },
      { label: "Fundraising", to: "/fundraising" },
      { label: "Donor Network", to: "/donors" },
    ],
  },
  {
    label: "Reports & Clients",
    items: [
      { label: "Intelligence Reports", to: "/intelligence-reports" },
      { label: "Report Exports", to: "/report-exports" },
      { label: "Client Portal", to: "/client-portal-admin" },
    ],
  },
  {
    label: "Consultants",
    items: [
      { label: "Business Suite", to: "/business-suite" },
      { label: "Consultants", to: "/consultants" },
      { label: "Consultant Intel", to: "/consultant-intel" },
      { label: "Consultant Marketplace", to: "/consultant-marketplace" },
      { label: "Campaign Opportunity Heatmap", to: "/campaign-opportunity-heatmap" },
    ],
  },
  {
    label: "Admin",
    items: [
      { label: "Billing", to: "/billing" },
      { label: "Firm Users", to: "/admin/firm-users" },
      { label: "Firm Invites", to: "/admin/firm-invites" },
      { label: "Candidate Profiles", to: "/admin/candidate-profiles" },
      { label: "Beta Access", to: "/admin/beta-access" },
      { label: "Live Intelligence", to: "/admin/live-intelligence" },
      { label: "Admin Alerts", to: "/admin/alerts" },
      { label: "Enterprise Leads", to: "/admin/enterprise-leads" },
    ],
  },
];

export const flattenedNavigation = navigationSections.flatMap((section) =>
  section.items.map((item) => ({
    ...item,
    section: section.label,
  }))
);