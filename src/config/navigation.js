export const navigationSections = [
  {
    label: "Workflow",
    featured: true,
    items: [
      { label: "Executive Workspace", to: "/executive-workspace" },
      { label: "1. National Command", to: "/national-command" },
      { label: "2. Notifications", to: "/notifications" },
      { label: "3. Intelligence Graph", to: "/political-intelligence" },
      { label: "4. Mission Control", to: "/mission-control" },
      { label: "5. War Room", to: "/war-room" },
      { label: "6. AI Co-Pilot", to: "/campaign-copilot" },
      { label: "7. Reports", to: "/intelligence-reports" },
      { label: "8. Client Portal", to: "/client-portal-admin" },
    ],
  },
  {
    label: "Executive",
    items: [
      { label: "Executive Workspace", to: "/executive-workspace" },
      { label: "Dashboard", to: "/dashboard" },
      { label: "National Command", to: "/national-command" },
      { label: "Mission Control", to: "/mission-control" },
      { label: "Executive Intelligence", to: "/executive-intelligence" },
      { label: "Operations Map", to: "/operations-map" },
      { label: "Notifications", to: "/notifications" },
      { label: "Revenue Intelligence", to: "/revenue-intelligence" },
    ],
  },
  {
    label: "Campaign",
    items: [
      { label: "Command Center", to: "/command-center" },
      { label: "Campaign CRM", to: "/campaign-crm" },
      { label: "Workspaces", to: "/workspaces" },
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
      { label: "Political Signals", to: "/political-signals" },
      { label: "Narrative Intelligence", to: "/narrative-intelligence" },
      { label: "Narrative Response", to: "/narrative-response" },
      { label: "Signal Matching", to: "/signal-matching" },
      { label: "Committee Intel", to: "/committee-intel" },
      { label: "Dark Money Exposure", to: "/dark-money-exposure" },
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
    label: "Reports",
    items: [
      { label: "Intelligence Reports", to: "/intelligence-reports" },
      { label: "Report Exports", to: "/report-exports" },
      { label: "Client Portal", to: "/client-portal-admin" },
    ],
  },
  {
    label: "Firm",
    items: [
      { label: "Business Suite", to: "/business-suite" },
      { label: "Consultants", to: "/consultants" },
      { label: "Consultant Intel", to: "/consultant-intel" },
      { label: "Campaign Opportunity Heatmap", to: "/campaign-opportunity-heatmap" },
      { label: "Billing", to: "/billing" },
      { label: "Firm Users", to: "/admin/firm-users" },
      { label: "Firm Invites", to: "/admin/firm-invites" },
    ],
  },
];

export const flattenedNavigation = navigationSections.flatMap((section) =>
  section.items.map((item) => ({
    ...item,
    section: section.label,
  }))
);
