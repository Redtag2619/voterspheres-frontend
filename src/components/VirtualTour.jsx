import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "https://voterspheres-backend-2pap.onrender.com";

const ROUTE_SETTLE_MS = 1300;
const SECTION_SETTLE_MS = 560;
const BETWEEN_SEGMENTS_MS = 760;
const MAX_AUTO_SECTIONS_PER_PAGE = 9;

const GENERIC_LABELS = [
  "Strategic advantage",
  "Campaign impact",
  "Operational value",
  "Consultant benefit",
  "Decision support",
  "Execution benefit",
  "Competitive edge",
  "Business value",
];

const COMMON_SECTION_SELECTORS = [
  "[data-tour]",
  ".workspace-command-card",
  ".workspace-tabs",
  ".workspace-actions",
  ".workspace-module-card",
  ".workspace-module-grid",
  ".workspace-status-grid",
  ".county-task-grid-wrap",
  ".task-filter-bar",
  ".vs-grid-4",
  ".vs-grid-3",
  ".vs-grid-2",
  ".vs-stack",
  ".vs-section-card",
  ".vs-card",
  ".vs-card-muted",
  ".vs-stat",
  ".vs-table",
  "table",
  "svg",
  "canvas",
  ".leaflet-container",
  "section",
];

const TOUR_PAGES = [
  {
    key: "executive-workspace",
    route: "/executive-workspace",
    title: "Executive Workspace",
    section: "Command Home",
    overview:
      "The Executive Workspace is the operating home for VoterSpheres. It gives consultants and campaign teams one command view for intelligence, operations, CRM, revenue, reports, and next actions.",
    selectors: [
      "[data-tour='workspace-command']",
      "[data-tour='workspace-kpis']",
      "[data-tour='workspace-actions']",
      "[data-tour='workspace-tabs']",
      "[data-tour='workspace-operating-status']",
      ".workspace-command-card",
      ".workspace-tabs",
      ".workspace-actions",
      ".workspace-status-grid",
      ".workspace-module-card",
      ".vs-grid-4",
      ".vs-section-card",
      ".vs-card",
    ],
    sectionCopy: {
      "workspace-command": {
        heading: "Executive command view",
        label: "Command value",
        narration:
          "This is the central command surface. It brings political intelligence, operating status, CRM activity, revenue pressure, reports, and next actions into one executive view.",
        value:
          "Leadership can understand what is happening, what is at risk, and what needs action without jumping between disconnected tools.",
      },
      "workspace-kpis": {
        heading: "Operating KPIs",
        label: "Decision support",
        narration:
          "These indicators summarize readiness, pressure, pipeline activity, and operating health. They are designed for a fast leadership scan.",
        value:
          "The team can quickly decide where attention should go before drilling into deeper workflows.",
      },
      "workspace-actions": {
        heading: "Guided actions",
        label: "Workflow advantage",
        narration:
          "The action area routes users directly into intelligence, operations, revenue, universal search, and the guided demo.",
        value:
          "This turns the workspace into a launchpad for execution instead of only a dashboard.",
      },
      "workspace-tabs": {
        heading: "Workspace navigation",
        label: "Platform flow",
        narration:
          "The workspace tabs organize the platform into launch, intelligence, operations, CRM, revenue, reports, and tools.",
        value:
          "Users get a connected operating model instead of a collection of separate pages.",
      },
      "workspace-operating-status": {
        heading: "Operating status",
        label: "Readiness insight",
        narration:
          "Operating status connects launch health, data freshness, database stability, and opportunity pipeline into one review layer.",
        value:
          "This shows whether the platform, data, and business pipeline are ready for action.",
      },
    },
  },
  {
    key: "election-map",
    route: "/map",
    title: "Election Map",
    section: "Election Geography",
    overview:
      "The Election Map turns race, fundraising, candidate, donor, and overlay data into a geographic intelligence workflow.",
    selectors: [
      "[data-tour='map-filters']",
      "[data-tour='election-map-us']",
      "[data-tour='election-map-candidates']",
      "[data-tour='election-map-donors']",
      "[data-tour='election-map-overlay-detail']",
      "[data-tour='election-map-overlay-stack']",
      ".rsm-svg",
      "svg",
      ".vs-section-card",
      ".vs-card",
    ],
    sectionCopy: {
      "map-filters": {
        heading: "Map filters",
        label: "Targeting control",
        narration:
          "The map filters narrow the live overlay stack by state and office. This is how users move from a national view into a focused race review.",
        value:
          "Consultants can quickly focus on the geographies and offices that matter most.",
      },
      "election-map-us": {
        heading: "U.S. finance overlay map",
        label: "Geographic intelligence",
        narration:
          "The finance overlay map translates fundraising intensity into a geographic operating view, showing where campaign finance signals are strongest.",
        value:
          "Finance pressure becomes visible by geography instead of being buried in tables.",
      },
      "election-map-candidates": {
        heading: "Candidate field",
        label: "Candidate comparison",
        narration:
          "The candidate field shows the selected state and office field with receipts, cash on hand, party, and rank.",
        value:
          "This connects the map directly to candidate-level campaign intelligence.",
      },
      "election-map-donors": {
        heading: "Donor intelligence",
        label: "Finance relationship layer",
        narration:
          "Donor Intelligence connects the selected candidate to donor network matches and helps explain the money behind the signal.",
        value:
          "Users can move from where money appears to who may be driving it.",
      },
      "election-map-overlay-detail": {
        heading: "Overlay detail",
        label: "Race prioritization",
        narration:
          "Overlay detail ranks state and office combinations by score, tier, receipts, and cash.",
        value:
          "The map becomes a prioritization tool, not just a visualization.",
      },
      "election-map-overlay-stack": {
        heading: "Overlay stack",
        label: "Signal layering",
        narration:
          "The overlay stack helps users compare multiple layers of election, finance, and race information in one place.",
        value:
          "This lets teams see how multiple signals combine across the political map.",
      },
    },
  },
  {
    key: "command-center",
    route: "/command-center",
    title: "Command Center",
    section: "Execution",
    overview:
      "The Command Center turns political intelligence into execution, priorities, tasks, alerts, and operational accountability.",
    selectors: [
      "[data-tour='command-kpis']",
      "[data-tour='command-recommended-action']",
      "[data-tour='command-execution-board']",
      "[data-tour='command-consultants']",
      "[data-tour='command-relationships']",
      "[data-tour='command-cross-signal']",
      "[data-tour='command-alert-engine']",
      "[data-tour='command-battlegrounds']",
      "[data-tour='command-priorities']",
      "[data-tour='command-feed']",
      ".task-filter-bar",
      ".county-task-grid-wrap",
      ".vs-section-card",
      ".vs-card",
      ".vs-card-muted",
    ],
    sectionCopy: {
      "command-kpis": {
        heading: "Executive metrics",
        label: "Operating read",
        narration:
          "The executive metrics summarize campaign pressure, threats, fundraising pulse, and persuasion opportunity.",
        value:
          "Leadership can understand campaign conditions before drilling into the details.",
      },
      "command-recommended-action": {
        heading: "Recommended executive action",
        label: "Decision point",
        narration:
          "Recommended Executive Action turns incoming signals into a clear operating recommendation.",
        value:
          "This helps teams move from reviewing intelligence to making a decision.",
      },
      "command-execution-board": {
        heading: "Execution board",
        label: "Accountability layer",
        narration:
          "The Execution Board organizes open work, completed work, critical items, owners, and operational follow-up.",
        value:
          "This is where insight becomes accountable campaign execution.",
      },
      "command-consultants": {
        heading: "Consultant intelligence",
        label: "Influence review",
        narration:
          "Consultant Intelligence tracks exposure, influence, candidate relationships, and ecosystem signals.",
        value:
          "Teams can identify risk, influence, and relationship opportunities.",
      },
      "command-relationships": {
        heading: "Relationship intelligence",
        label: "Network visibility",
        narration:
          "Relationship Intelligence shows how candidates, consultants, donors, and organizations connect.",
        value:
          "Political networks become visible instead of remaining hidden across separate records.",
      },
      "command-cross-signal": {
        heading: "Cross-signal priority layer",
        label: "Signal convergence",
        narration:
          "The Cross-Signal Priority Layer combines fundraising, vendors, mail operations, relationships, and race pressure.",
        value:
          "Teams can focus on races where multiple warning signs converge.",
      },
      "command-alert-engine": {
        heading: "Executive alert engine",
        label: "Risk monitoring",
        narration:
          "The Executive Alert Engine surfaces operational alerts from consultant exposure, dark money, relationship strength, and campaign intelligence.",
        value:
          "Leadership gets a live warning layer for issues that require attention.",
      },
      "command-battlegrounds": {
        heading: "Top battlegrounds",
        label: "Race focus",
        narration:
          "Top Battlegrounds gives the team a quick view of high-pressure races, states, and operating environments.",
        value:
          "Teams can decide which geographies deserve immediate strategy review.",
      },
      "command-priorities": {
        heading: "Execution priorities",
        label: "Action planning",
        narration:
          "Execution Priorities collect the most important work items so they can be tracked and moved forward.",
        value:
          "The platform keeps urgent work visible until it is handled.",
      },
      "command-feed": {
        heading: "Executive feed",
        label: "Live context",
        narration:
          "The Executive Feed keeps recent signals, updates, and changes visible for leadership review.",
        value:
          "Teams can maintain situational awareness without waiting for a meeting recap.",
      },
    },
  },
  {
    key: "operations-map",
    route: "/operations-map",
    title: "Executive Operations Map",
    section: "Operational Coverage",
    overview:
      "The Executive Operations Map shows campaign infrastructure, geographic coverage, activity concentration, vendor gaps, and execution pressure.",
    selectors: [
      "[data-tour='operations-map']",
      "[data-tour='operations-map-summaries']",
      "[data-tour]",
      ".map",
      "svg",
      "canvas",
      ".leaflet-container",
      ".vs-grid-4",
      ".workspace-module-grid",
      ".workspace-status-grid",
      ".vs-section-card",
      ".vs-card",
    ],
    sectionCopy: {
      "operations-map": {
        heading: "Operational map",
        label: "Coverage view",
        narration:
          "The operations map shows where activity, infrastructure, resources, and operational pressure are concentrated.",
        value:
          "Operational weaknesses become visible before they become execution problems.",
      },
      "operations-map-summaries": {
        heading: "Operational summaries",
        label: "Resource planning",
        narration:
          "The supporting cards summarize where resources, tasks, vendors, and signals need attention.",
        value:
          "Geographic intelligence connects directly to staffing, vendor, and campaign execution decisions.",
      },
    },
  },
  {
    key: "candidates",
    route: "/candidates",
    title: "Candidate Intelligence",
    section: "Candidate Research",
    overview:
      "Candidate Intelligence centralizes candidate records, offices, states, parties, campaign status, contact context, and FEC-linked intelligence.",
    selectors: [
      "[data-tour='candidate-kpis']",
      "[data-tour='candidate-list']",
      "[data-tour='candidate-profile']",
      "[data-tour]",
      ".vs-grid-4",
      ".candidate-list",
      "table",
      ".vs-table",
      ".vs-section-card",
      ".vs-card",
    ],
    sectionCopy: {
      "candidate-kpis": {
        heading: "Candidate summary",
        label: "Research context",
        narration:
          "The candidate summary gives users a quick view of candidate coverage and campaign profile activity.",
        value:
          "This makes candidate research faster and easier to operationalize.",
      },
      "candidate-list": {
        heading: "Candidate list",
        label: "Candidate discovery",
        narration:
          "The candidate list helps users compare candidates and move into deeper profile review.",
        value:
          "Teams can identify who needs outreach, tracking, or strategic review.",
      },
      "candidate-profile": {
        heading: "Candidate profile",
        label: "Profile intelligence",
        narration:
          "Candidate profiles collect campaign details, context, and strategic indicators in one record.",
        value:
          "This gives teams a cleaner foundation for research, outreach, and recommendations.",
      },
    },
  },
  {
    key: "donors",
    route: "/donors",
    title: "Donor Network",
    section: "Fundraising Intelligence",
    overview:
      "The Donor Network helps teams understand contribution patterns, donor clusters, finance influence, and relationship opportunities.",
    selectors: [
      "[data-tour='donor-kpis']",
      "[data-tour='donor-list']",
      "[data-tour='donor-network']",
      "[data-tour]",
      ".vs-grid-4",
      ".donor-list",
      "table",
      ".vs-table",
      ".vs-section-card",
      ".vs-card",
    ],
    sectionCopy: {
      "donor-kpis": {
        heading: "Donor metrics",
        label: "Finance signal",
        narration:
          "The donor metrics summarize contribution activity and finance signal strength.",
        value:
          "Finance teams can see where money relationships are forming.",
      },
      "donor-list": {
        heading: "Donor records",
        label: "Donor discovery",
        narration:
          "Donor records help users review giving behavior and donor relationships.",
        value:
          "This connects fundraising intelligence to campaign and consultant strategy.",
      },
      "donor-network": {
        heading: "Donor network",
        label: "Relationship map",
        narration:
          "The donor network shows relationships that can shape campaign finance and political influence.",
        value:
          "Teams can understand not just how much money is moving, but where influence may exist.",
      },
    },
  },
  {
    key: "fundraising",
    route: "/fundraising",
    title: "Fundraising Dashboard",
    section: "Campaign Finance",
    overview:
      "The Fundraising Dashboard tracks campaign finance momentum, finance leaders, FEC-linked records, and comparative money movement.",
    selectors: [
      "[data-tour='fundraising-kpis']",
      "[data-tour='fundraising-leaderboard']",
      "[data-tour='fundraising-records']",
      "[data-tour]",
      ".vs-grid-4",
      ".leaderboard",
      "table",
      ".vs-table",
      ".vs-section-card",
      ".vs-card",
    ],
    sectionCopy: {
      "fundraising-kpis": {
        heading: "Finance indicators",
        label: "Momentum read",
        narration:
          "Finance indicators show money movement, campaign strength, and fundraising posture.",
        value:
          "Users can see which campaigns are gaining or losing financial momentum.",
      },
      "fundraising-leaderboard": {
        heading: "Fundraising leaderboard",
        label: "Comparative view",
        narration:
          "The leaderboard helps compare fundraising performance across campaigns or races.",
        value:
          "This makes campaign strength easier to compare at a glance.",
      },
      "fundraising-records": {
        heading: "Fundraising records",
        label: "Finance detail",
        narration:
          "Fundraising records give users the detail behind the finance signal.",
        value:
          "Teams can move from headline metrics into deeper research.",
      },
    },
  },
  {
    key: "war-room",
    route: "/war-room",
    title: "AI War Room",
    section: "Rapid Response",
    overview:
      "The AI War Room supports rapid response, narrative tracking, threat review, strategic recommendations, and high-pressure campaign operations.",
    selectors: [
      "[data-tour='warroom-kpis']",
      "[data-tour='warroom-threats']",
      "[data-tour='warroom-narratives']",
      "[data-tour='warroom-actions']",
      "[data-tour]",
      ".vs-grid-4",
      ".threat-list",
      ".signal-list",
      ".vs-section-card",
      ".vs-card",
    ],
    sectionCopy: {
      "warroom-kpis": {
        heading: "War Room indicators",
        label: "Pressure read",
        narration:
          "War Room indicators summarize rapid response pressure and campaign risk.",
        value:
          "Teams can understand whether a situation needs monitoring or immediate action.",
      },
      "warroom-threats": {
        heading: "Threat signals",
        label: "Risk detection",
        narration:
          "Threat signals highlight political, narrative, or operational risks that may require response.",
        value:
          "Campaign teams can respond before issues grow.",
      },
      "warroom-narratives": {
        heading: "Narrative tracking",
        label: "Message discipline",
        narration:
          "Narrative tracking helps teams understand the storylines forming around a campaign or race.",
        value:
          "This keeps response strategy connected to the actual political conversation.",
      },
      "warroom-actions": {
        heading: "Rapid response actions",
        label: "Action coordination",
        narration:
          "Rapid response actions help teams coordinate what should happen next.",
        value:
          "The War Room becomes a workflow, not just an alert screen.",
      },
    },
  },
  {
    key: "vendors",
    route: "/vendors",
    title: "Vendor Network",
    section: "Operational Partners",
    overview:
      "Vendor Network helps campaigns and consultants identify operating partners by category, geography, coverage, and campaign need.",
    selectors: [
      "[data-tour='vendor-kpis']",
      "[data-tour='vendor-list']",
      "[data-tour='vendor-coverage']",
      "[data-tour]",
      ".vs-grid-4",
      "table",
      ".vendor-list",
      ".vs-table",
      ".vs-section-card",
      ".vs-card",
    ],
    sectionCopy: {
      "vendor-kpis": {
        heading: "Vendor coverage",
        label: "Partner intelligence",
        narration:
          "Vendor coverage shows partner availability across categories and geographies.",
        value:
          "Teams can quickly understand where they have support and where gaps exist.",
      },
      "vendor-list": {
        heading: "Vendor list",
        label: "Operational sourcing",
        narration:
          "The vendor list helps users find operational partners for mail, digital, field, data, consulting, and other campaign needs.",
        value:
          "This turns vendor search into a structured operating workflow.",
      },
      "vendor-coverage": {
        heading: "Coverage gaps",
        label: "Execution risk",
        narration:
          "Coverage gaps show where campaign operations may lack the right partner support.",
        value:
          "Teams can address vendor risk before deadlines are affected.",
      },
    },
  },
  {
    key: "mailops",
    route: "/mailops",
    title: "MailOps",
    section: "Direct Mail Execution",
    overview:
      "MailOps tracks direct mail production, campaign mail events, vendors, drops, deadlines, and operational delivery visibility.",
    selectors: [
      "[data-tour='mailops-kpis']",
      "[data-tour='mailops-events']",
      "[data-tour='mailops-vendors']",
      "[data-tour]",
      ".vs-grid-4",
      "table",
      ".mailops-list",
      ".vs-table",
      ".vs-section-card",
      ".vs-card",
    ],
    sectionCopy: {
      "mailops-kpis": {
        heading: "MailOps indicators",
        label: "Production status",
        narration:
          "MailOps indicators summarize direct mail status, production pressure, and delivery risk.",
        value:
          "Teams can understand mail execution at a glance.",
      },
      "mailops-events": {
        heading: "Mail events",
        label: "Deadline visibility",
        narration:
          "Mail events show drops, deadlines, vendors, and production activity.",
        value:
          "Direct mail operations stay visible and trackable.",
      },
      "mailops-vendors": {
        heading: "Mail vendors",
        label: "Partner coordination",
        narration:
          "Mail vendor tracking connects production partners to campaign timelines.",
        value:
          "Teams can coordinate vendor work before delays become campaign problems.",
      },
    },
  },
  {
    key: "campaign-crm",
    route: "/campaign-crm",
    title: "Campaign CRM",
    section: "Relationship Management",
    overview:
      "Campaign CRM structures contacts, organizations, relationship history, follow-ups, and client development activity.",
    selectors: [
      "[data-tour='crm-kpis']",
      "[data-tour='crm-contacts']",
      "[data-tour='crm-activity']",
      "[data-tour]",
      ".vs-grid-4",
      "table",
      ".crm-list",
      ".vs-table",
      ".vs-section-card",
      ".vs-card",
    ],
    sectionCopy: {
      "crm-kpis": {
        heading: "CRM metrics",
        label: "Relationship health",
        narration:
          "CRM metrics summarize relationship activity and follow-up pressure.",
        value:
          "Political relationships become measurable and manageable.",
      },
      "crm-contacts": {
        heading: "Contacts",
        label: "Relationship database",
        narration:
          "Contacts organize people, organizations, and campaign relationships.",
        value:
          "Teams can find and manage the relationships that drive political work.",
      },
      "crm-activity": {
        heading: "Activity tracking",
        label: "Follow-up workflow",
        narration:
          "Activity tracking keeps meetings, notes, and follow-ups connected to the relationship record.",
        value:
          "Opportunities are less likely to be missed or forgotten.",
      },
    },
  },
  {
    key: "opportunity-engine",
    route: "/opportunity-engine",
    title: "Opportunity Engine",
    section: "Consultant Growth",
    overview:
      "The Opportunity Engine connects campaign intelligence to consulting opportunities, prospects, follow-up workflows, and revenue growth.",
    selectors: [
      "[data-tour='opportunity-kpis']",
      "[data-tour='opportunity-list']",
      "[data-tour='opportunity-pipeline']",
      "[data-tour]",
      ".vs-grid-4",
      "table",
      ".opportunity-list",
      ".vs-table",
      ".vs-section-card",
      ".vs-card",
    ],
    sectionCopy: {
      "opportunity-kpis": {
        heading: "Opportunity scoring",
        label: "Growth prioritization",
        narration:
          "Opportunity scoring identifies high-value prospects and campaign business opportunities.",
        value:
          "Consultants can prioritize growth opportunities with stronger signals instead of guessing.",
      },
      "opportunity-list": {
        heading: "Opportunity list",
        label: "Prospect workflow",
        narration:
          "The opportunity list shows prospects, timing, value, and next actions.",
        value:
          "Political intelligence becomes a business development workflow.",
      },
      "opportunity-pipeline": {
        heading: "Opportunity pipeline",
        label: "Revenue execution",
        narration:
          "The pipeline connects opportunity signals to follow-up and conversion work.",
        value:
          "Teams can turn market intelligence into measurable revenue activity.",
      },
    },
  },
  {
    key: "business-suite",
    route: "/business-suite",
    title: "Consultant Business Suite",
    section: "Business Operations",
    overview:
      "The Consultant Business Suite helps firms manage clients, retainers, invoices, projects, revenue workflows, and consulting operations.",
    selectors: [
      "[data-tour='business-kpis']",
      "[data-tour='business-clients']",
      "[data-tour='business-revenue']",
      "[data-tour]",
      ".vs-grid-4",
      "table",
      ".client-list",
      ".vs-table",
      ".vs-section-card",
      ".vs-card",
    ],
    sectionCopy: {
      "business-kpis": {
        heading: "Business command",
        label: "Firm visibility",
        narration:
          "Business command metrics summarize client health, revenue posture, and operational workload.",
        value:
          "Firms can manage the business side inside the same platform as political intelligence.",
      },
      "business-clients": {
        heading: "Client visibility",
        label: "Client management",
        narration:
          "Client visibility connects accounts, work, retainers, and follow-up needs.",
        value:
          "Leadership can understand client health and business performance.",
      },
      "business-revenue": {
        heading: "Revenue workflow",
        label: "Financial control",
        narration:
          "Revenue workflow connects invoices, retainers, overdue items, and pipeline pressure.",
        value:
          "Financial risk becomes visible before it becomes urgent.",
      },
    },
  },
  {
    key: "revenue-intelligence",
    route: "/revenue-intelligence",
    title: "Revenue Intelligence",
    section: "Business Health",
    overview:
      "Revenue Intelligence monitors client health, overdue invoices, retainers, revenue pressure, and business risk.",
    selectors: [
      "[data-tour='revenue-kpis']",
      "[data-tour='revenue-list']",
      "[data-tour='revenue-risk']",
      "[data-tour]",
      ".vs-grid-4",
      "table",
      ".revenue-list",
      ".vs-table",
      ".vs-section-card",
      ".vs-card",
    ],
    sectionCopy: {
      "revenue-kpis": {
        heading: "Revenue indicators",
        label: "Business health",
        narration:
          "Revenue indicators summarize firm revenue, risk, and client payment pressure.",
        value:
          "Leadership can see the health of the business side of campaign consulting.",
      },
      "revenue-list": {
        heading: "Revenue list",
        label: "Client finance detail",
        narration:
          "The revenue list shows clients, invoices, retainers, and follow-up needs.",
        value:
          "Teams can connect client work to financial accountability.",
      },
      "revenue-risk": {
        heading: "Revenue risk",
        label: "Risk management",
        narration:
          "Revenue risk highlights accounts or invoices that need attention.",
        value:
          "The firm can act before business risk becomes a cash-flow problem.",
      },
    },
  },
  {
    key: "reports",
    route: "/intelligence-reports",
    title: "Intelligence Reports",
    section: "Deliverables",
    overview:
      "Intelligence Reports turn live platform data into client-ready strategy material, executive briefings, and campaign deliverables.",
    selectors: [
      "[data-tour='reports-kpis']",
      "[data-tour='reports-list']",
      "[data-tour='reports-export']",
      "[data-tour]",
      ".vs-grid-4",
      "table",
      ".report-list",
      ".vs-table",
      ".vs-section-card",
      ".vs-card",
    ],
    sectionCopy: {
      "reports-kpis": {
        heading: "Report generation",
        label: "Client-ready output",
        narration:
          "Report generation converts platform intelligence into usable strategic deliverables.",
        value:
          "Live intelligence can become client-ready material without starting from scratch.",
      },
      "reports-list": {
        heading: "Report list",
        label: "Executive briefing",
        narration:
          "The report list helps teams review generated reports and move toward export-ready deliverables.",
        value:
          "This supports strategy briefings, client updates, and executive reporting.",
      },
      "reports-export": {
        heading: "Report export",
        label: "Delivery workflow",
        narration:
          "Report export helps turn intelligence into material that can be shared with clients or leadership.",
        value:
          "The platform connects analysis to presentation and delivery.",
      },
    },
  },
  {
    key: "search",
    route: "/search",
    title: "Universal Search",
    section: "Search",
    overview:
      "Universal Search lets users search across candidates, reports, vendors, clients, tasks, signals, workspaces, and operating records from one place.",
    selectors: [
      "[data-tour='search-input']",
      "[data-tour='search-results']",
      "[data-tour]",
      "input[type='search']",
      "input",
      ".search-results",
      "table",
      ".vs-table",
      ".vs-section-card",
      ".vs-card",
    ],
    sectionCopy: {
      "search-input": {
        heading: "Search input",
        label: "Discovery speed",
        narration:
          "The search input gives users one place to look across the platform.",
        value:
          "Research and navigation become faster because users do not need to remember where every record lives.",
      },
      "search-results": {
        heading: "Search results",
        label: "Fast access",
        narration:
          "Search results help users jump directly to the record, report, vendor, candidate, or task they need.",
        value:
          "This keeps research and execution moving quickly.",
      },
    },
  },
  {
    key: "complete",
    route: "/executive-workspace",
    title: "Tour Complete",
    section: "Wrap-up",
    overview:
      "That completes the VoterSpheres guided product tour. The platform connects political intelligence, campaign execution, client development, revenue, and strategic reporting in one workflow.",
    selectors: [
      "[data-tour='workspace-command']",
      ".workspace-command-card",
      ".vs-page-hero",
      ".vs-section-card",
      ".vs-card",
    ],
    sectionCopy: {
      "workspace-command": {
        heading: "Ready to operate",
        label: "Platform summary",
        narration:
          "VoterSpheres starts with intelligence, connects it to operations, and turns it into action across the consulting workflow.",
        value:
          "Users can begin from Executive Workspace, understand the landscape, and move directly into execution.",
      },
    },
  },
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeText(value = "", max = 1600) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function getTourMode(search) {
  const params = new URLSearchParams(search || "");
  const raw = params.get("tour");
  if (raw === "platform" || raw === "public" || raw === "demo" || raw === "admin") return raw;
  return "";
}

function getToken() {
  return (
    window.localStorage.getItem("token") ||
    window.localStorage.getItem("authToken") ||
    window.localStorage.getItem("vs_token") ||
    ""
  );
}

async function fetchNovaSpeech(text) {
  const token = getToken();

  const response = await fetch(`${API_BASE}/api/tour/voice`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      text: normalizeText(text),
      voice: "nova",
      model: "gpt-4o-mini-tts",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`Nova voice failed ${response.status}: ${errorText}`);
  }

  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

function getFallbackVoice() {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices?.() || [];

  return (
    voices.find((voice) =>
      /Microsoft Ava|Microsoft Aria|Microsoft Jenny|Google US English|Samantha|Victoria|Karen|Moira|Serena|Tessa|Zira|Ava/i.test(
        `${voice.name} ${voice.lang}`
      )
    ) ||
    voices.find((voice) => /^en[-_]/i.test(voice.lang)) ||
    voices[0] ||
    null
  );
}

function playBrowserSpeech(text) {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      resolve();
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const voice = getFallbackVoice();

    if (voice) utterance.voice = voice;

    utterance.rate = 0.86;
    utterance.pitch = 1.05;
    utterance.volume = 1;
    utterance.onend = resolve;
    utterance.onerror = resolve;

    window.speechSynthesis.speak(utterance);
  });
}

function playAudioUrl(url, audioRef) {
  return new Promise((resolve, reject) => {
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.onended = resolve;
    audio.onerror = reject;
    audio.play().catch(reject);
  });
}

function clearTourHighlights() {
  document.querySelectorAll(".vs-tour-highlight-active").forEach((node) => {
    node.classList.remove("vs-tour-highlight-active");
  });
}

function isVisible(element) {
  if (!element || !(element instanceof Element)) return false;
  const rect = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);
  return (
    rect.width > 16 &&
    rect.height > 16 &&
    style.display !== "none" &&
    style.visibility !== "hidden" &&
    style.opacity !== "0"
  );
}

function nearestTourContainer(element) {
  if (!element) return null;

  return (
    element.closest("[data-tour]") ||
    element.closest(".vs-section-card") ||
    element.closest(".vs-card") ||
    element.closest(".vs-card-muted") ||
    element.closest(".workspace-module-card") ||
    element.closest(".workspace-command-card") ||
    element.closest("section") ||
    element.closest("article") ||
    element
  );
}

function queryAllVisible(selectors = []) {
  const unique = new Map();

  for (const selector of selectors) {
    try {
      document.querySelectorAll(selector).forEach((node) => {
        const container = nearestTourContainer(node);
        if (!container || !isVisible(container)) return;
        if (container.closest(".vs-tour-card")) return;

        const rect = container.getBoundingClientRect();
        const dataTour = container.getAttribute("data-tour");
        const key =
          dataTour ||
          `${Math.round(rect.top + window.scrollY)}-${Math.round(rect.left)}-${Math.round(
            rect.width
          )}-${Math.round(rect.height)}-${String(container.textContent || "").slice(0, 32)}`;

        if (!unique.has(key)) unique.set(key, container);
      });
    } catch {
      // Ignore invalid selectors.
    }
  }

  return Array.from(unique.values()).sort((a, b) => {
    const ar = a.getBoundingClientRect();
    const br = b.getBoundingClientRect();
    return ar.top - br.top || ar.left - br.left;
  });
}

function getBestHeading(element, fallback = "Section") {
  const heading =
    element.querySelector?.("h1,h2,h3,h4,.vs-section-title,.vs-stat-label,.vs-row-title,strong") ||
    element;

  const text = String(heading?.textContent || fallback).replace(/\s+/g, " ").trim();
  return text.length > 58 ? `${text.slice(0, 55)}...` : text || fallback;
}

function getDataTourKey(element) {
  return element?.getAttribute?.("data-tour") || element?.closest?.("[data-tour]")?.getAttribute("data-tour") || "";
}

function buildAutoSegment(page, element, index) {
  const dataKey = getDataTourKey(element);
  const custom = dataKey && page.sectionCopy?.[dataKey];

  if (custom) {
    return {
      ...custom,
      element,
      dataTour: dataKey,
    };
  }

  const heading = getBestHeading(element, index === 0 ? page.title : `Section ${index + 1}`);
  const label = GENERIC_LABELS[index % GENERIC_LABELS.length];

  return {
    element,
    heading,
    label,
    narration:
      index === 0
        ? page.overview
        : `This section supports the ${page.title} workflow by giving users another operating view of the page. Nova is highlighting it so the user can connect the explanation to the exact part of the screen.`,
    value:
      index === 0
        ? "This is the top-level context for the page and sets up the rest of the walkthrough."
        : "Users can understand the page from top to bottom while the spotlight follows the exact area being discussed.",
  };
}

function buildSegmentsForPage(page) {
  const sections = queryAllVisible([
    ...(page.selectors || []),
    ...COMMON_SECTION_SELECTORS,
  ]);

  const filtered = sections
    .filter((element) => !element.classList.contains("vs-tour-card"))
    .slice(0, MAX_AUTO_SECTIONS_PER_PAGE);

  if (!filtered.length) {
    const main = document.querySelector("main") || document.body;
    return [buildAutoSegment(page, main, 0)];
  }

  return filtered.map((element, index) => buildAutoSegment(page, element, index));
}

function buildNarration(page, segment, isFirstSegment) {
  return [
    isFirstSegment ? `${page.title}. ${page.section}.` : "",
    segment.heading,
    segment.narration,
    segment.value ? `${segment.label || "Strategic value"}: ${segment.value}` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

async function highlightElement(element) {
  clearTourHighlights();

  if (!element) return;

  element.classList.add("vs-tour-highlight-active");

  try {
    element.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "nearest",
    });
  } catch {
    element.scrollIntoView();
  }

  await sleep(SECTION_SETTLE_MS);
}

export default function VirtualTour() {
  const navigate = useNavigate();
  const location = useLocation();

  const mode = getTourMode(location.search);
  const pages = useMemo(() => TOUR_PAGES, []);

  const [running, setRunning] = useState(Boolean(mode));
  const [pageIndex, setPageIndex] = useState(0);
  const [segmentIndex, setSegmentIndex] = useState(0);
  const [segments, setSegments] = useState([]);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [novaOnly, setNovaOnly] = useState(true);
  const [paused, setPaused] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("Ready");
  const [replayNonce, setReplayNonce] = useState(0);

  const audioRef = useRef(null);
  const objectUrlRef = useRef("");
  const cancelledRef = useRef(false);
  const runIdRef = useRef(0);

  const page = running ? pages[pageIndex] : null;
  const segment = running ? segments[segmentIndex] : null;

  useEffect(() => {
    if (mode) {
      setRunning(true);
      setPageIndex(0);
      setSegmentIndex(0);
      setPaused(false);
      setSegments([]);
      cancelledRef.current = false;
      clearTourHighlights();
    }
  }, [mode]);

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      clearTourHighlights();
      window.speechSynthesis?.cancel?.();

      if (audioRef.current) audioRef.current.pause();
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  function stopAudio() {
    window.speechSynthesis?.cancel?.();

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  }

  function stopTour() {
    cancelledRef.current = true;
    setRunning(false);
    setPaused(false);
    setSegments([]);
    clearTourHighlights();
    stopAudio();

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = "";
    }

    navigate(location.pathname, { replace: true });
  }

  function goNextInternal(currentSegments = segments) {
    if (segmentIndex < currentSegments.length - 1) {
      setSegmentIndex((value) => value + 1);
      return;
    }

    if (pageIndex < pages.length - 1) {
      setPageIndex((value) => value + 1);
      setSegmentIndex(0);
      setSegments([]);
      return;
    }

    stopTour();
  }

  useEffect(() => {
    if (!running || !page || paused) return;

    const runId = runIdRef.current + 1;
    runIdRef.current = runId;
    cancelledRef.current = false;

    async function run() {
      try {
        stopAudio();

        const alreadyOnRoute = location.pathname === page.route;
        setVoiceStatus(alreadyOnRoute ? "Reading page from top to bottom" : "Opening page");

        if (!alreadyOnRoute) {
          clearTourHighlights();
          navigate(page.route);
          await sleep(ROUTE_SETTLE_MS);
        } else {
          await sleep(260);
        }

        if (cancelledRef.current || runIdRef.current !== runId) return;

        let currentSegments = segments;
        if (!currentSegments.length) {
          currentSegments = buildSegmentsForPage(page);
          setSegments(currentSegments);
          await sleep(80);
        }

        const currentSegment = currentSegments[segmentIndex] || currentSegments[0];
        if (!currentSegment) return;

        setVoiceStatus("Highlighting section");
        await highlightElement(currentSegment.element);

        if (cancelledRef.current || runIdRef.current !== runId) return;

        const narration = buildNarration(page, currentSegment, segmentIndex === 0);

        if (!voiceEnabled) {
          setVoiceStatus("Voice off");
        } else {
          try {
            setVoiceStatus("Generating OpenAI Nova voice");
            const url = await fetchNovaSpeech(narration);

            if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
            objectUrlRef.current = url;

            if (cancelledRef.current || runIdRef.current !== runId) return;

            setVoiceStatus("Speaking with OpenAI Nova");
            await playAudioUrl(url, audioRef);
          } catch (error) {
            console.warn("[virtual-tour] Nova voice unavailable:", error.message);

            if (novaOnly) {
              setVoiceStatus("Nova unavailable. Check backend/API key.");
              return;
            }

            setVoiceStatus("Nova unavailable. Using browser voice.");
            await playBrowserSpeech(narration);
          }
        }

        if (cancelledRef.current || runIdRef.current !== runId) return;

        setVoiceStatus("Ready");

        if (autoAdvance) {
          await sleep(BETWEEN_SEGMENTS_MS);
          if (!cancelledRef.current && runIdRef.current === runId) {
            goNextInternal(currentSegments);
          }
        }
      } catch (error) {
        console.warn("[virtual-tour] segment failed:", error.message);
        setVoiceStatus("Tour error. Use Next to continue.");
      }
    }

    run();

    return () => {
      stopAudio();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    autoAdvance,
    location.pathname,
    navigate,
    novaOnly,
    pageIndex,
    paused,
    replayNonce,
    running,
    segmentIndex,
    voiceEnabled,
  ]);

  if (!running || !page) return null;

  const safeSegments = segments.length
    ? segments
    : [{ heading: "Loading", narration: page.overview, value: "" }];
  const currentSegment = safeSegments[segmentIndex] || safeSegments[0];

  const totalEstimate = pages.length * MAX_AUTO_SECTIONS_PER_PAGE;
  const completedEstimate = pageIndex * MAX_AUTO_SECTIONS_PER_PAGE + segmentIndex + 1;
  const progress = Math.min(100, Math.round((completedEstimate / Math.max(1, totalEstimate)) * 100));

  function goBack() {
    cancelledRef.current = true;
    stopAudio();

    if (segmentIndex > 0) {
      setSegmentIndex((value) => value - 1);
    } else if (pageIndex > 0) {
      setPageIndex((value) => value - 1);
      setSegmentIndex(0);
      setSegments([]);
    }

    setPaused(false);
  }

  function goNext() {
    cancelledRef.current = true;
    stopAudio();
    goNextInternal(safeSegments);
    setPaused(false);
  }

  function replaySegment() {
    cancelledRef.current = true;
    stopAudio();
    setReplayNonce((value) => value + 1);
    setPaused(false);
  }

  function togglePause() {
    if (!paused) {
      cancelledRef.current = true;
      stopAudio();
      setPaused(true);
      setVoiceStatus("Paused");
    } else {
      cancelledRef.current = false;
      setPaused(false);
      setVoiceStatus("Resuming");
    }
  }

  const tourCard = (
    <div className="vs-tour-backdrop">
      <section className="vs-tour-card" role="dialog" aria-modal="true">
        <div className="vs-tour-progress">
          <span style={{ width: `${progress}%` }} />
        </div>

        <div className="vs-tour-header">
          <div>
            <p className="vs-kicker">Interactive Nova Product Demo</p>
            <h2>{page.title}</h2>
          </div>

          <button className="vs-tour-close" onClick={stopTour} aria-label="Close tour">
            ×
          </button>
        </div>

        <div className="vs-tour-section-label">{currentSegment.heading}</div>

        <p className="vs-tour-body">{currentSegment.narration}</p>

        {currentSegment.value ? (
          <div className="vs-tour-benefits">
            <div className="vs-tour-benefit">
              <strong>{currentSegment.label || "Strategic value"}:</strong> {currentSegment.value}
            </div>
          </div>
        ) : null}

        <p className="vs-tour-disclosure">
          Nova reads each page from top to bottom and highlights the active section. Status: {voiceStatus}
        </p>

        <div className="vs-tour-meta">
          {page.section} • Page {pageIndex + 1} of {pages.length} • Section{" "}
          {Math.min(segmentIndex + 1, safeSegments.length)} of {safeSegments.length}
        </div>

        <div className="vs-tour-actions">
          <button
            className="vs-button vs-button-secondary"
            onClick={goBack}
            disabled={pageIndex === 0 && segmentIndex === 0}
          >
            Back
          </button>

          <button className="vs-button vs-button-secondary" onClick={togglePause}>
            {paused ? "Resume" : "Pause"}
          </button>

          <button className="vs-button vs-button-secondary" onClick={replaySegment}>
            Replay
          </button>

          <button
            className="vs-button vs-button-secondary"
            onClick={() => setVoiceEnabled((value) => !value)}
          >
            Voice {voiceEnabled ? "On" : "Off"}
          </button>

          <button
            className="vs-button vs-button-secondary"
            onClick={() => setNovaOnly((value) => !value)}
          >
            {novaOnly ? "Nova Only" : "Allow Browser Fallback"}
          </button>

          <button
            className="vs-button vs-button-secondary"
            onClick={() => setAutoAdvance((value) => !value)}
          >
            Auto {autoAdvance ? "On" : "Off"}
          </button>

          <button className="vs-button" onClick={goNext}>
            {pageIndex >= pages.length - 1 && segmentIndex >= safeSegments.length - 1
              ? "Finish Demo"
              : "Next"}
          </button>
        </div>
      </section>
    </div>
  );

  return createPortal(tourCard, document.body);
}

