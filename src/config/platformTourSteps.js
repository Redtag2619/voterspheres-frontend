
import { navigationSections } from "./navigation";

 

const PLATFORM_HOME = "/executive-workspace";

 

const SECTION_GUIDES = {

  Executive: {

    heading: "Executive command and decision intelligence",

    narration:

      "The Executive chapter connects national awareness, operational readiness, forecasting, simulation, coalition intelligence, influence analysis, and AI-supported decisions. Leaders can move from a high-level political picture into the evidence and actions driving campaign performance.",

    value:

      "Create one decision environment for principals, senior consultants, campaign managers, and executive teams.",

  },

  Intelligence: {

    heading: "Political intelligence and relationship awareness",

    narration:

      "The Intelligence chapter organizes political signals, relationships, narratives, influence, risk, and power into connected views. Teams can identify who matters, what is changing, and which developments require attention.",

    value:

      "Turn fragmented political information into explainable, evidence-backed strategic awareness.",

  },

  Campaigns: {

    heading: "Candidate, fundraising, and campaign execution",

    narration:

      "The Campaigns chapter brings candidate research, fundraising, finance, donors, endorsements, CRM activity, advisors, and AI campaign tools into a coordinated workflow.",

    value:

      "Give campaign and consulting teams a shared picture of the candidate, resources, relationships, and next actions.",

  },

  Operations: {

    heading: "Operational command and live execution",

    narration:

      "The Operations chapter supports tasks, vendors, communications, notifications, live intelligence, data freshness, and universal search. It helps teams convert intelligence into owned, time-sensitive work.",

    value:

      "Reduce execution gaps by connecting insights to accountable operational action.",

  },

  Maps: {

    heading: "Geographic opportunity and election context",

    narration:

      "The Maps chapter turns national, state, county, parish, district, and campaign opportunity data into geographic decision support.",

    value:

      "Help teams understand where political conditions, opportunities, and operational priorities are concentrated.",

  },

  Business: {

    heading: "Consultant growth and client delivery",

    narration:

      "The Business chapter connects consulting operations, opportunity development, revenue intelligence, client portals, reports, exports, and billing.",

    value:

      "Support both campaign outcomes and the health, scalability, and professionalism of the consulting organization.",

  },

  "Launch & Admin": {

    heading: "Launch readiness and production control",

    narration:

      "The Launch chapter helps authorized teams prepare data, assets, automation, onboarding, quality assurance, production hardening, and database stability before wider platform use.",

    value:

      "Provide a disciplined path from implementation through validated production readiness.",

  },

  Admin: {

    heading: "Secure administration and enterprise onboarding",

    narration:

      "The Admin chapter manages users, invitations, candidate profiles, beta access, intelligence operations, alerts, and enterprise leads.",

    value:

      "Give authorized administrators the controls needed to govern access, data quality, onboarding, and platform operations.",

  },

};

 

const PAGE_GUIDES = {

  "/executive-workspace": {

    heading: "One workspace for executive political operations",

    narration:

      "Executive Workspace assembles priority intelligence, mission context, readiness indicators, risks, tasks, and connected command tools into an executive starting point.",

    value:

      "Begin every strategic review with a shared operating picture and clear paths into deeper analysis.",

  },

  "/executive-intelligence": {

    heading: "Unified executive intelligence",

    narration:

      "Unified Executive Intelligence consolidates high-priority signals, organizational context, operational metrics, and strategic evidence across VoterSpheres.",

    value:

      "Reduce fragmentation and help leadership evaluate the most important changes from one trusted view.",

  },

  "/executive-ai-command-platform": {

    heading: "Evidence-backed AI consultation and candidate intelligence",

    narration:

      "The Executive AI Command Platform combines natural-language consultation, candidate intelligence, finance, polling, news, political signals, and strategic recommendations through the VoterSpheres intelligence pipeline.",

    value:

      "Help users ask complex political questions and receive structured answers grounded in connected platform evidence.",

  },

  "/political-intelligence-fabric": {

    heading: "Connected political intelligence fabric",

    narration:

      "Political Intelligence Fabric links sources, entities, signals, relationships, and analytical services into a common intelligence architecture.",

    value:

      "Create traceable connections between incoming evidence and the decisions made from it.",

  },

  "/executive-polling-intelligence": {

    heading: "Polling trends, averages, and pollster context",

    narration:

      "Polling Intelligence provides live VoteHub polling, race context, candidate trends, polling averages, dates, geography, and pollster information.",

    value:

      "Distinguish direct race evidence from broader candidate or state context before acting on polling narratives.",

  },

  "/national-political-digital-twin": {

    heading: "A living national political model",

    narration:

      "The National Political Digital Twin represents political conditions, entities, risks, relationships, and changing signals in a continuously updated national model.",

    value:

      "Explore how developments in one part of the political environment may affect other campaigns, coalitions, or decisions.",

  },

  "/autonomous-campaign-operations": {

    heading: "AI-supported operational coordination",

    narration:

      "Autonomous Campaign Operations monitors conditions, identifies operational needs, and helps coordinate recommended actions, owners, and follow-through.",

    value:

      "Increase responsiveness while preserving human review and accountability for consequential campaign actions.",

  },

  "/executive-decision-intelligence": {

    heading: "Decisions, options, evidence, and consequences",

    narration:

      "Executive Decision Intelligence organizes strategic decisions around evidence, options, expected impact, risk, confidence, and recommended action.",

    value:

      "Make major campaign choices more explicit, reviewable, and defensible.",

  },

  "/predictive-campaign-simulation": {

    heading: "Test scenarios before committing resources",

    narration:

      "Predictive Campaign Simulation models alternative assumptions, campaign actions, resource choices, and political conditions to compare possible outcomes.",

    value:

      "Use scenarios to expose tradeoffs and prepare contingency plans rather than relying on a single forecast.",

  },

  "/operations-map": {

    heading: "National operational awareness",

    narration:

      "Executive Operations Map provides a geographic view of campaign readiness, threats, activity, priorities, and operational conditions across the country.",

    value:

      "Help executives see where attention and resources may be needed without losing national context.",

  },

  "/forecast": {

    heading: "Executive election forecasting",

    narration:

      "Executive Forecast Dashboard presents race outlooks, confidence, drivers, changes, and related intelligence used to understand electoral direction.",

    value:

      "Support planning with transparent forecast context instead of treating a probability as a guarantee.",

  },

  "/strategy": {

    heading: "Prioritized AI strategy recommendations",

    narration:

      "AI Strategy Recommendations converts current platform intelligence into prioritized actions with rationale, urgency, ownership, and strategic context.",

    value:

      "Move from awareness to a practical set of next steps that campaign leaders can review and assign.",

  },

  "/coalitions": {

    heading: "National coalition intelligence",

    narration:

      "National Coalition Intelligence identifies coalition structures, bridge relationships, alignment opportunities, gaps, and potential outreach priorities.",

    value:

      "Help campaigns understand how support networks can be developed and maintained across issues and constituencies.",

  },

  "/influence": {

    heading: "Influence and stakeholder power",

    narration:

      "Influence Dashboard evaluates political influence, relationship reach, central actors, and the entities that can amplify or constrain campaign objectives.",

    value:

      "Focus engagement on people and organizations with meaningful strategic leverage.",

  },

  "/mission-control": {

    heading: "Mission-centered execution",

    narration:

      "Mission Control connects campaign objectives, risks, owners, milestones, intelligence, and active work into a focused operational command view.",

    value:

      "Keep important campaign objectives visible, owned, and connected to current intelligence.",

  },

  "/national-command": {

    heading: "National command overview",

    narration:

      "National Command combines nationwide political conditions, mission priorities, operational signals, and cross-state intelligence for senior leadership.",

    value:

      "Maintain a national perspective while preserving paths into state, race, and campaign-level detail.",

  },

  "/platform-intelligence": {

    heading: "Platform-wide intelligence health and connectivity",

    narration:

      "Platform Intelligence shows how VoterSpheres sources, signals, entities, and analytical capabilities are connected across the operating system.",

    value:

      "Understand the breadth, freshness, and strategic role of the intelligence supporting platform decisions.",

  },

  "/political-intelligence": {

    heading: "Political intelligence graph",

    narration:

      "Political Intelligence Graph visualizes candidates, committees, donors, organizations, issues, signals, and relationships as an explorable network.",

    value:

      "Discover connections and influence pathways that are difficult to recognize in isolated lists or reports.",

  },

  "/relationship-graph": {

    heading: "Relationship mapping and network context",

    narration:

      "Relationship Graph maps direct and indirect relationships among political actors, organizations, campaigns, consultants, and stakeholders.",

    value:

      "Support outreach planning, coalition development, risk review, and warm-path relationship strategy.",

  },

  "/political-signals": {

    heading: "Live political signal monitoring",

    narration:

      "Political Signals organizes events, filings, narratives, candidate activity, and other developments by severity, geography, source, and relevance.",

    value:

      "Help teams detect meaningful change early and determine whether monitoring or action is required.",

  },

  "/power-rankings": {

    heading: "Comparative political power rankings",

    narration:

      "Power Rankings compares candidates, organizations, races, or political entities using available influence, momentum, finance, and strategic indicators.",

    value:

      "Provide a structured comparison while keeping the underlying evidence and limitations visible.",

  },

  "/dark-money-exposure": {

    heading: "Political Money Exposure",

    narration:

      
"Political Money Exposure maps reported political money flows, committee and nonprofit relationships, disclosure gaps, and areas requiring deeper compliance or research review. A dedicated filter prioritizes dark-money indicators without treating them as proof of wrongdoing.",

    value:

      "Strengthen risk awareness around political money without presenting inference as verified fact.",

  },

  "/narrative-intelligence": {

    heading: "Narrative development and media intelligence",

    narration:

      "Narrative Intelligence monitors emerging themes, coverage, message movement, sources, and the political context shaping public discussion.",

    value:

      "Help communications teams understand which narratives are gaining attention and why they matter.",

  },

  "/narrative-response": {

    heading: "Rapid narrative response planning",

    narration:

      "Narrative Response turns monitored narratives into response options, message guidance, urgency, ownership, and coordinated follow-through.",

    value:

      "Shorten the distance between detecting a narrative risk and executing a disciplined response.",

  },

  "/signal-matching": {

    heading: "Match signals to campaigns and workspaces",

    narration:

      "Signal Matching connects political developments to the campaigns, clients, missions, geographies, and teams most likely to be affected.",

    value:

      "Reduce noise by routing intelligence toward the users who can evaluate and act on it.",

  },

  "/candidates": {

    heading: "Candidate directory and intelligence entry point",

    narration:

      "Candidates provides a searchable national directory with candidate identities, office, geography, cycle, profiles, and paths into deeper intelligence.",

    value:

      "Create a consistent starting point for candidate research across federal and supported state-level races.",

  },

  "/fundraising": {

    heading: "Fundraising performance intelligence",

    narration:

      "Fundraising Intelligence compares receipts, cash on hand, spending, financial momentum, and candidate fundraising performance from available filings.",

    value:

      "Help teams evaluate financial capacity, changes, and competitive context using verified reporting data.",

  },

  "/campaign-finance-intelligence": {

    heading: "Campaign finance and PAC intelligence",

    narration:

      "Campaign Finance Intelligence brings candidate finance, committees, PAC contributions, state and party comparisons, concentration, and dependency measures into a searchable platform.",

    value:

      "Turn official finance records into comparative intelligence while retaining source and cycle context.",

  },

  "/donors": {

    heading: "Donor and contribution network",

    narration:

      "Donor Network explores contribution relationships, donor patterns, committees, candidates, geography, and connected finance activity.",

    value:

      "Support research and relationship awareness while respecting campaign-finance and privacy requirements.",

  },

  "/endorsements": {

    heading: "Endorsement intelligence",

    narration:

      "Endorsement Intelligence tracks endorsers, candidates, organizations, timing, alignment, and the strategic meaning of public support.",

    value:

      "Help campaigns identify validation opportunities, coalition signals, and relationship gaps.",

  },

  "/campaign-crm": {

    heading: "Campaign relationship management",

    narration:

      "Campaign CRM organizes contacts, organizations, interactions, relationship stages, follow-ups, and client or campaign development activity.",

    value:

      "Convert political and business relationships into an accountable engagement process.",

  },

  "/campaign-operations-studio": {

    heading: "AI campaign operations studio",

    narration:

      "Campaign Studio AI helps teams develop operational plans, content, briefs, workflows, and campaign-ready outputs using connected context.",

    value:

      "Accelerate structured campaign work while keeping users responsible for review, accuracy, and deployment.",

  },

  "/strategic-advisor": {

    heading: "AI strategic advisor",

    narration:

      "Strategic Advisor combines campaign context and platform intelligence to help users evaluate choices, priorities, risks, and recommended next steps.",

    value:

      "Provide a disciplined thought partner for campaign planning without replacing professional judgment.",

  },

  "/war-room": {

    heading: "Campaign war room",

    narration:

      "War Room brings high-priority intelligence, threats, rapid-response needs, tasks, and strategic coordination into a focused campaign environment.",

    value:

      "Help teams respond quickly while maintaining shared facts, ownership, and message discipline.",

  },

  "/ai-tactical": {

    heading: "AI tactical intelligence",

    narration:

      "AI Tactical converts current intelligence into tactical observations, urgency, suggested actions, and operational context for campaign teams.",

    value:

      "Support faster tactical review without confusing generated recommendations with verified evidence.",

  },

  "/command-center": {

    heading: "Command Center execution",

    narration:

      "Command Center centralizes priorities, missions, tasks, risks, alerts, intelligence, and accountable campaign action.",

    value:

      "Give managers a single place to coordinate execution and monitor whether critical work is moving.",

  },

  "/vendors": {

    heading: "Political vendor network",

    narration:

      "Vendor Network helps teams discover, compare, organize, and manage political vendors and service providers across campaign needs.",

    value:

      "Improve vendor visibility and support better-informed sourcing and relationship decisions.",

  },

  "/mailops": {

    heading: "Mail operations and communications",

    narration:

      "MailOps supports campaign and organizational email workflows, delivery operations, connected records, and communication follow-through.",

    value:

      "Bring communications activity into the same operating environment as campaign intelligence and tasks.",

  },

  "/task-ownership": {

    heading: "Task ownership and accountability",

    narration:

      "Task Ownership shows assignments, status, urgency, deadlines, dependencies, and responsibility across campaign work.",

    value:

      "Make it clear who owns each action and where execution is delayed or at risk.",

  },

  "/live-intelligence-layer": {

    heading: "Live intelligence layer",

    narration:

      "Live Intelligence Layer monitors active sources, newly retrieved evidence, coverage, freshness, provider status, and connected intelligence activity.",

    value:

      "Help users understand what is current, what is degraded, and how live evidence reaches decisions.",

  },

  "/live-data-refresh": {

    heading: "Live data refresh controls",

    narration:

      "Live Data Refresh provides operational visibility into refresh activity, schedules, source updates, failures, and manual synchronization controls.",

    value:

      "Support data freshness and make provider or ingestion problems visible before they affect decisions.",

  },

  "/search": {

    heading: "Universal platform search",

    narration:

      "Universal Search helps users locate pages, candidates, intelligence, reports, workflows, and connected platform records from one search experience.",

    value:

      "Reduce navigation time and make the breadth of VoterSpheres easier to use.",

  },

  "/notifications": {

    heading: "Notifications and alerts",

    narration:

      "Notifications organizes platform alerts, assigned items, intelligence changes, operational updates, and conditions requiring user attention.",

    value:

      "Keep important changes visible without forcing users to monitor every page continuously.",

  },

  "/map": {

    heading: "Election map and race geography",

    narration:

      "Election Map visualizes races, jurisdictions, candidates, electoral geography, and available election context across the country.",

    value:

      "Help users move between national perspective and the geographic detail relevant to a race.",

  },

  "/state-operations": {

    heading: "State operations index",

    narration:

      "State Operations organizes state-level readiness, political conditions, localities, campaign activity, and operational context for drilldown.",

    value:

      "Provide a consistent path from national command into state and county or parish intelligence.",

  },

  "/state-operations-map": {

    heading: "Interactive state operations map",

    narration:

      "State Operations Map presents operational and political state data geographically, with routes into county and parish-level context where available.",

    value:

      "Make state comparisons and geographic priorities easier to recognize and communicate.",

  },

  "/campaign-opportunity-heatmap": {

    heading: "Campaign opportunity heatmap",

    narration:

      "Campaign Opportunity Heatmap highlights locations where political conditions, campaign needs, relationships, or business opportunities appear strategically important.",

    value:

      "Help consultants and campaign leaders prioritize where deeper research or engagement may be worthwhile.",

  },

  "/business-suite": {

    heading: "Consultant business suite",

    narration:

      "Consultant Business Suite combines client development, delivery operations, opportunities, relationships, reporting, and revenue visibility.",

    value:

      "Help political consulting firms manage both client results and the business required to sustain them.",

  },

  "/revenue-pipeline": {

    heading: "Revenue pipeline management",

    narration:

      "Revenue Pipeline tracks prospective work, stages, estimated value, next steps, ownership, and conversion activity.",

    value:

      "Create an accountable process for turning political relationships and opportunities into consulting engagements.",

  },

  "/revenue-intelligence": {

    heading: "Executive revenue intelligence",

    narration:

      "Revenue Intelligence analyzes pipeline value, concentration, momentum, client mix, opportunity patterns, and business risk.",

    value:

      "Give firm leadership a clearer view of growth quality and future revenue exposure.",

  },

  "/opportunity-engine": {

    heading: "Political opportunity engine",

    narration:

      "Opportunity Engine identifies potential campaign, consulting, coalition, relationship, and market opportunities from connected political intelligence.",

    value:

      "Help teams discover promising opportunities and evaluate them before committing outreach or resources.",

  },

  "/client-portal-admin": {

    heading: "Client portal administration",

    narration:

      "Client Portal gives firms a controlled way to share selected intelligence, reports, progress, and deliverables with clients.",

    value:

      "Improve client communication while maintaining administrative control over access and presentation.",

  },

  "/intelligence-reports": {

    heading: "Intelligence report production",

    narration:

      "Intelligence Reports organizes generated briefs, recurring reports, source context, confidence, distribution, and report history.",

    value:

      "Turn live platform evidence into consistent decision products for campaigns and clients.",

  },

  "/report-exports": {

    heading: "Report export center",

    narration:

      "Report Exports prepares selected intelligence and operational content for supported downloadable or client-ready formats.",

    value:

      "Make VoterSpheres findings easier to deliver, archive, present, and share through approved workflows.",

  },

  "/billing": {

    heading: "Subscription and billing management",

    narration:

      "Billing provides authorized access to plan information, payment status, subscription management, and related account controls.",

    value:

      "Give organizations visibility into their commercial relationship and platform access level.",

  },

  "/dashboard": {

    heading: "Platform dashboard",

    narration:

      "Dashboard provides a general overview of current platform activity, key indicators, accessible modules, and important updates.",

    value:

      "Offer users a familiar entry point into the VoterSpheres political operating system.",

  },

  "/launch-automation": {

    heading: "Launch automation",

    narration:

      "Launch Automation coordinates repeatable setup, validation, onboarding, and deployment workflows used to prepare VoterSpheres environments.",

    value:

      "Reduce manual launch work and make implementation steps more consistent and reviewable.",

  },

  "/launch-data-seeder": {

    heading: "Launch data seeding",

    narration:

      "Launch Data Seeder helps authorized teams populate required demonstration, onboarding, or production-ready reference data.",

    value:

      "Provide controlled data preparation while preserving validation and environment boundaries.",

  },

  "/launch-assets": {

    heading: "Launch asset center",

    narration:

      "Launch Assets organizes the files, messaging, materials, links, and supporting resources required for rollout and onboarding.",

    value:

      "Keep launch materials consistent, accessible, and connected to the readiness process.",

  },

  "/launch-readiness": {

    heading: "Launch readiness dashboard",

    narration:

      "Launch Readiness summarizes completion, blockers, dependencies, environment status, data preparation, and go-live criteria.",

    value:

      "Give leadership a transparent view of whether the platform is genuinely prepared for launch.",

  },

  "/launch-qa": {

    heading: "Launch quality assurance",

    narration:

      "Launch QA tracks validation checks, smoke tests, known issues, evidence, owners, and readiness decisions before release.",

    value:

      "Reduce avoidable launch risk through documented verification and follow-through.",

  },

  "/production-hardening": {

    heading: "Production hardening",

    narration:

      "Production Hardening reviews security, reliability, configuration, error handling, observability, and operational safeguards.",

    value:

      "Help the platform move from working functionality toward dependable production operation.",

  },

  "/database-stability": {

    heading: "Database stability",

    narration:

      "Database Stability monitors migrations, health, consistency, performance, failures, and data-layer readiness.",

    value:

      "Protect the reliability of the evidence and workflows that depend on VoterSpheres data.",

  },

  "/beta-onboarding": {

    heading: "Beta onboarding",

    narration:

      "Beta Onboarding coordinates approved users, invitations, setup, guidance, progress, and early-adopter readiness.",

    value:

      "Create a structured first experience that helps beta users reach value quickly and safely.",

  },

  "/admin/firm-users": {

    heading: "Firm user administration",

    narration:

      "Firm Users manages organization members, roles, status, access, and account administration.",

    value:

      "Support secure team access and clear organizational control.",

  },

  "/admin/firm-invites": {

    heading: "Firm invitation management",

    narration:

      "Firm Invites manages pending invitations, delivery status, expiration, acceptance, and administrative follow-up.",

    value:

      "Make team onboarding visible and recoverable when an invitation is delayed or unsuccessful.",

  },

  "/admin/candidate-profiles": {

    heading: "Candidate profile administration",

    narration:

      "Candidate Profiles allows authorized users to review, enrich, verify, and maintain candidate information used across the platform.",

    value:

      "Improve candidate intelligence quality while preserving administrative oversight.",

  },

  "/admin/beta-access": {

    heading: "Beta access administration",

    narration:

      "Beta Access manages applicants, approvals, access status, onboarding progression, and related beta controls.",

    value:

      "Help administrators scale early access without losing visibility or governance.",

  },

  "/admin/live-intelligence": {

    heading: "Live intelligence administration",

    narration:

      "Live Intelligence Administration provides source, refresh, ingestion, provider, and operational controls for authorized users.",

    value:

      "Give administrators the tools to investigate data freshness and provider health issues.",

  },

  "/admin/alerts": {

    heading: "Administrative alert management",

    narration:

      "Admin Alerts reviews system, intelligence, delivery, operational, and account conditions requiring administrative attention.",

    value:

      "Support faster triage of issues that could affect users, data, or platform reliability.",

  },

  "/admin/enterprise-leads": {

    heading: "Enterprise lead and demo pipeline",

    narration:

      "Enterprise Leads manages demonstration requests, prospect details, qualification, outreach, invitations, conversion, and workspace provisioning.",

    value:

      "Turn incoming interest into a professional, accountable enterprise onboarding process.",

  },

};

 

function normalizeRoute(value = "") {

  return String(value || "").split("?")[0] || PLATFORM_HOME;

}

 

function targetFor(item) {

  return {

    headingText: [item.label],

    selector:

      "main h1, main .vs-page-title, main .vs-section-title, main section, main",

  };

}

 

function introductionStep(mode) {

  return {

    id: `${mode}-introduction`,

    route: PLATFORM_HOME,

    page: mode === "admin" ? "VoterSpheres Administrative Tour" : "Welcome to VoterSpheres",

    section: "Introduction",

    heading: "A connected political operating system",

    narration:

      mode === "admin"

        ? "This administrative tour explains how VoterSpheres governs users, data, intelligence operations, onboarding, alerts, and enterprise access in addition to the platform capabilities available to campaign and consulting teams."

        : "VoterSpheres is a connected political operating system for candidates, campaigns, consultants, and organizations. This tour explains how each major page contributes to political knowledge, strategic planning, relationship development, campaign execution, and client service.",

    label: "Tour purpose",

    value:

      "Show how evidence, intelligence, operations, and accountable action work together across the platform.",

    target: {

      headingText: ["Executive Workspace", "VoterSpheres"],

      selector: "main h1, main",

    },

  };

}

 

function sectionStep(section, mode) {

  const guide = SECTION_GUIDES[section.label] || {};

  const firstRoute = normalizeRoute(section.items[0]?.to || PLATFORM_HOME);

 

  return {

    id: `${mode}-${section.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-chapter`,

    route: firstRoute,

    page: `${section.label} Capabilities`,

    section: section.label,

    heading: guide.heading || `${section.label} overview`,

    narration: guide.narration || `This chapter introduces the ${section.label} capabilities in VoterSpheres.`,

    label: "Strategic value",

    value: guide.value || "Connect this part of the platform to evidence-backed campaign decisions and execution.",

    target: {

      headingText: [section.items[0]?.label, section.label],

      selector: "main h1, main",

    },

  };

}

 

function pageStep(section, item, index, mode) {

  const route = normalizeRoute(item.to);

  const guide = PAGE_GUIDES[route] || {};

 

  return {

    id: `${mode}-${section.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${index}-${route.replace(/[^a-z0-9]+/gi, "-")}`,

    route,

    page: item.label,

    section: section.label,

    heading: guide.heading || item.description || `${item.label} capabilities`,

    narration:

      guide.narration ||

      item.description ||

      `${item.label} is part of the VoterSpheres ${section.label} capability set and connects its page-level workflow to the wider political operating system.`,

    label: "Campaign and client value",

    value:

      guide.value ||

      "Help teams use connected information to improve planning, coordination, accountability, and client service.",

    target: targetFor(item),

  };

}

 

function conclusionStep(mode) {

  return {

    id: `${mode}-conclusion`,

    route: PLATFORM_HOME,

    page: "Why VoterSpheres",

    section: "Conclusion",

    heading: "Knowledge, coordination, and strategic readiness",

    narration:

      "VoterSpheres brings candidate intelligence, campaign finance, polling, political signals, relationships, coalition context, communications, operational planning, and AI-supported decision-making into one connected platform. It helps candidates, consultants, and campaign organizations recognize opportunities, manage risks, coordinate teams, communicate with clients, and make faster evidence-backed decisions. No technology can guarantee an election result, but VoterSpheres can help campaigns operate with greater clarity, discipline, knowledge, and strategic readiness as they work to earn support and win their races.",

    label: "Recommended next step",

    value:

      mode === "admin"

        ? "Confirm access, data readiness, provider health, onboarding, and governance before expanding organizational use."

        : "Schedule a focused demonstration using a real candidate, race, state, or client objective to see how the connected workflow supports your goals.",

    target: {

      headingText: ["Executive Workspace", "VoterSpheres"],

      selector: "main h1, main",

    },

  };

}

 

export function getTourSteps(mode = "platform") {

  const normalizedMode = mode === "admin" ? "admin" : "platform";

  const sections = navigationSections.filter((section) => {

    if (normalizedMode === "admin") return true;

    return section.label !== "Admin";

  });

 

  const steps = [introductionStep(normalizedMode)];

 

  sections.forEach((section) => {

    const eligibleItems = section.items.filter(

      (item) => !String(item.to || "").startsWith("/platform-tour")

    );

 

    if (!eligibleItems.length) return;

 

    steps.push(sectionStep({ ...section, items: eligibleItems }, normalizedMode));

    eligibleItems.forEach((item, index) => {

      steps.push(pageStep(section, item, index, normalizedMode));

    });

  });

 

  steps.push(conclusionStep(normalizedMode));

  return steps;

}

 

export default getTourSteps;



