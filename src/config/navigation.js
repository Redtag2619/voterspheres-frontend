export const navigationSections = [
  {
    label: "Executive Command",
    items: [
      { label: "National Command", to: "/national-command" },
      { label: "Mission Control", to: "/mission-control" },
      { label: "Operations Map", to: "/executive-operations-map" },
      { label: "Notifications", to: "/notifications" },
      { label: "Revenue Intelligence", to: "/revenue-intelligence" },
    ],
  },
  {
    label: "Campaign Operations",
    items: [
      { label: "Campaign CRM", to: "/campaign-crm" },
      { label: "Command Center", to: "/command-center" },
      { label: "Election War Room", to: "/war-room" },
      { label: "Vendor Network", to: "/vendors" },
      { label: "Marketplace", to: "/marketplace" },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { label: "Intelligence Graph", to: "/political-intelligence" },
      { label: "Strategic Advisor", to: "/strategic-advisor" },
      { label: "AI Campaign Co-Pilot", to: "/campaign-copilot" },
      { label: "Candidates", to: "/candidates" },
      { label: "Fundraising", to: "/fundraising" },
      { label: "Donor Network", to: "/donors" },
      { label: "Election Forecast", to: "/forecast" },
      { label: "Election Map", to: "/map" },
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
    label: "Firm Management",
    items: [
      { label: "Business Suite", to: "/business-suite" },
      { label: "Billing", to: "/billing" },
      { label: "Users", to: "/firm-users" },
      { label: "Invites", to: "/firm-invites" },
      { label: "Settings", to: "/settings" },
    ],
  },
];

export const flattenedNavigation = navigationSections.flatMap((section) =>
  section.items.map((item) => ({
    ...item,
    section: section.label,
  }))
);