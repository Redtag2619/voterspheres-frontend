import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "https://voterspheres-backend-2pap.onrender.com";

const ROUTE_SETTLE_MS = 1100;
const TARGET_TIMEOUT_MS = 9500;
const TARGET_POLL_MS = 125;
const CENTER_SETTLE_MS = 900;
const BETWEEN_STEPS_MS = 700;

const TOUR_STEPS = [
  {
    route: "/executive-workspace",
    page: "Executive Workspace",
    section: "Executive command home",
    heading: "Executive command view",
    label: "Command value",
    target: {
      dataTour: "workspace-command",
      selector: ".workspace-command-card, main",
      headingText: ["Executive Workspace", "Workspace Command View"],
    },
    narration:
      "We begin in the Executive Workspace, the operating home for VoterSpheres. This page gives campaigns, consultants, and political teams one command view for intelligence, execution, revenue, reports, and next actions.",
    value:
      "Leadership gets a single place to understand what is happening, what is at risk, and what needs action next.",
  },
  {
    route: "/executive-workspace",
    page: "Executive Workspace",
    section: "Executive indicators",
    heading: "Operating KPIs",
    label: "Decision support",
    target: {
      dataTour: "workspace-kpis",
      selector: ".vs-grid-4, .workspace-status-grid",
      headingText: ["Workspace Readiness", "Launch Score", "Pressure Score", "Pipeline"],
    },
    narration:
      "These operating indicators summarize readiness, launch posture, campaign pressure, and opportunity pipeline. They are designed for a fast executive scan before deeper review.",
    value:
      "The team can quickly decide where attention should go before opening deeper workflows.",
  },
  {
    route: "/executive-workspace",
    page: "Executive Workspace",
    section: "Action routing",
    heading: "Guided actions",
    label: "Workflow advantage",
    target: {
      dataTour: "workspace-actions",
      selector: ".workspace-actions",
      headingText: ["Start Guided Tour", "Admin Tour", "Universal Search"],
    },
    narration:
      "This action area moves users directly into intelligence, operations, revenue, search, and the guided product tour. Every major signal should have a clear path to action.",
    value:
      "The workspace becomes an execution launchpad instead of only a dashboard.",
  },
  {
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
      "The workspace tabs organize the full consulting workflow into launch, intelligence, operations, CRM, revenue, reports, and tools. This keeps the platform connected as one operating system.",
    value:
      "Users can move through the business and campaign workflow without feeling like they are switching products.",
  },
  {
    route: "/executive-workspace",
    page: "Executive Workspace",
    section: "Operating status",
    heading: "Operating status grid",
    label: "Readiness insight",
    target: {
      dataTour: "workspace-operating-status",
      selector: ".workspace-status-grid",
      headingText: ["Operating Status", "Launch Gate", "Database Stability", "Live Feeds", "Opportunity Pipeline"],
    },
    narration:
      "The operating status grid connects launch health, database stability, live feed readiness, and opportunity pipeline into one review layer.",
    value:
      "This tells leaders whether the platform, data, and business pipeline are ready for action.",
  },

  {
    route: "/map",
    page: "Election Map",
    section: "Election geography",
    heading: "Map filters",
    label: "Targeting control",
    target: {
      dataTour: "map-filters",
      selector: "select, .vs-select",
      headingText: ["Map Filters"],
    },
    narration:
      "The Election Map starts with filters for state and office. These controls narrow the national view into the exact race environment the user wants to evaluate.",
    value:
      "Consultants can quickly focus on the geographies and offices that matter most.",
  },
  {
    route: "/map",
    page: "Election Map",
    section: "Election geography",
    heading: "U.S. finance overlay map",
    label: "Geographic intelligence",
    target: {
      dataTour: "election-map-us",
      selector: ".rsm-svg, svg, .vs-section-card",
      headingText: ["U.S. Finance Overlay Map"],
    },
    narration:
      "The finance overlay map translates campaign finance intensity into a geographic operating view, showing where fundraising signals are strongest across the country.",
    value:
      "Finance pressure becomes visible by geography instead of being hidden in raw records.",
  },
  {
    route: "/map",
    page: "Election Map",
    section: "Election geography",
    heading: "Candidate field",
    label: "Candidate comparison",
    target: {
      dataTour: "election-map-candidates",
      selector: ".vs-stack, .vs-table, table",
      headingText: ["Candidates"],
    },
    narration:
      "The candidate panel shows the selected state and office field. Users can compare receipts, cash on hand, party, rank, and campaign standing in context.",
    value:
      "The map connects directly to candidate-level campaign intelligence.",
  },
  {
    route: "/map",
    page: "Election Map",
    section: "Election geography",
    heading: "Donor intelligence",
    label: "Finance relationship layer",
    target: {
      dataTour: "election-map-donors",
      selector: ".vs-stack, .vs-card",
      headingText: ["Donor Intelligence"],
    },
    narration:
      "Donor Intelligence connects candidate context to donor network matches. It helps explain the money behind the signal, not just the amount raised.",
    value:
      "Users can move from where money is showing up to who may be driving it.",
  },
  {
    route: "/map",
    page: "Election Map",
    section: "Election geography",
    heading: "Overlay detail",
    label: "Race prioritization",
    target: {
      dataTour: "election-map-overlay-detail",
      selector: ".vs-stack, .vs-section-card",
      headingText: ["Office Overlays", "Overlay Detail", "Overlay Stack"],
    },
    narration:
      "Overlay Detail ranks state and office combinations by score, tier, receipts, and cash. This helps users decide which races deserve deeper attention.",
    value:
      "The map becomes a prioritization system instead of only a visual display.",
  },

  {
    route: "/operations-map",
    page: "Executive Operations Map",
    section: "Operational coverage",
    heading: "Operations map KPIs",
    label: "Operating read",
    target: {
      dataTour: "operations-map-kpis",
      selector: ".vs-grid-4, main",
      headingText: ["Coverage", "Operations", "Risk", "Signals"],
    },
    narration:
      "The Operations Map indicators summarize operational coverage, state pressure, and execution posture before the user reviews the map itself.",
    value:
      "Leadership can understand the operating environment before drilling into specific geographies.",
  },
  {
    route: "/operations-map",
    page: "Executive Operations Map",
    section: "Operational coverage",
    heading: "Operations map",
    label: "Coverage view",
    target: {
      dataTour: "operations-map",
      selector: ".map, svg, canvas, .leaflet-container, main",
      headingText: ["Executive Operations Map", "Operations Map"],
    },
    narration:
      "The Executive Operations Map shows campaign infrastructure, geographic coverage, activity concentration, vendor gaps, and execution pressure.",
    value:
      "Operational weaknesses become visible before they turn into campaign execution problems.",
  },
  {
    route: "/operations-map",
    page: "Executive Operations Map",
    section: "Operational coverage",
    heading: "Operations summaries",
    label: "Resource planning",
    target: {
      dataTour: "operations-map-summaries",
      selector: ".ops-threat-matrix, .vs-grid-4, main",
      headingText: ["Threat", "Matrix", "Summaries", "Operations"],
    },
    narration:
      "The operations summary layer organizes pressure signals, resource needs, and execution gaps so teams can decide where to send attention.",
    value:
      "Geographic intelligence turns into staffing, vendor, and tactical planning.",
  },

  {
    route: "/command-center",
    page: "Command Center",
    section: "Execution",
    heading: "Executive metrics",
    label: "Operating read",
    target: {
      dataTour: "command-kpis",
      selector: ".vs-grid-4, .vs-card",
      headingText: ["National Win Index", "Active Threats", "Fundraising Pulse", "Persuasion Opportunity"],
    },
    narration:
      "The Command Center opens with executive metrics for campaign pressure, threats, fundraising pulse, and persuasion opportunity.",
    value:
      "Leadership can understand campaign conditions before drilling into operational details.",
  },
  {
    route: "/command-center",
    page: "Command Center",
    section: "Execution",
    heading: "Recommended executive action",
    label: "Decision point",
    target: {
      dataTour: "command-recommended-action",
      selector: ".vs-card-muted, .vs-card",
      headingText: ["Recommended Executive Action"],
    },
    narration:
      "Recommended Executive Action turns incoming signals into a clear operating recommendation. It tells the team what deserves attention next.",
    value:
      "The platform helps teams move from reviewing intelligence to making a decision.",
  },
  {
    route: "/command-center",
    page: "Command Center",
    section: "Execution",
    heading: "Execution board",
    label: "Accountability layer",
    target: {
      dataTour: "command-execution-board",
      selector: ".task-filter-bar, .county-task-grid-wrap, table, .vs-table",
      headingText: ["Executive Execution Board", "Execution Board"],
    },
    narration:
      "The Execution Board organizes open work, completed work, critical items, owners, and operational follow-up across campaign workflows.",
    value:
      "This is where intelligence becomes accountable campaign execution.",
  },
  {
    route: "/command-center",
    page: "Command Center",
    section: "Execution",
    heading: "Consultant intelligence",
    label: "Influence review",
    target: {
      dataTour: "command-consultants",
      selector: ".vs-grid-2, .vs-stack, .vs-card",
      headingText: ["Consultant Intelligence"],
    },
    narration:
      "Consultant Intelligence tracks exposure, influence, candidate relationships, and ecosystem signals around campaigns.",
    value:
      "Teams can identify political influence, risk, and relationship opportunities.",
  },
  {
    route: "/command-center",
    page: "Command Center",
    section: "Execution",
    heading: "Relationship intelligence",
    label: "Network visibility",
    target: {
      dataTour: "command-relationships",
      selector: ".vs-grid-2, .vs-stack, .vs-card",
      headingText: ["Relationship Intelligence"],
    },
    narration:
      "Relationship Intelligence shows how candidates, consultants, donors, and organizations connect across the platform.",
    value:
      "Political networks become visible instead of remaining hidden in separate records.",
  },
  {
    route: "/command-center",
    page: "Command Center",
    section: "Execution",
    heading: "Cross-signal priority layer",
    label: "Signal convergence",
    target: {
      dataTour: "command-cross-signal",
      selector: ".vs-grid-4, .vs-stack, .vs-card",
      headingText: ["Cross-Signal Priority Layer"],
    },
    narration:
      "The Cross-Signal Priority Layer combines fundraising, vendors, mail operations, relationships, and race pressure into one priority view.",
    value:
      "Teams can focus on races where multiple warning signs are converging.",
  },
  {
    route: "/command-center",
    page: "Command Center",
    section: "Execution",
    heading: "Dark money exposure",
    label: "Influence risk",
    target: {
      dataTour: "command-dark-money",
      selector: ".vs-stack, .vs-card",
      headingText: ["Dark Money Exposure"],
    },
    narration:
      "The Dark Money Exposure layer highlights committee influence chains, consultant overlap, and cross-state exposure signals.",
    value:
      "Teams can spot political finance risk that may affect strategy, compliance, or messaging.",
  },
  {
    route: "/command-center",
    page: "Command Center",
    section: "Execution",
    heading: "Executive alert engine",
    label: "Risk monitoring",
    target: {
      dataTour: "command-alert-engine",
      selector: ".vs-stack, .vs-card",
      headingText: ["Executive Alert Engine"],
    },
    narration:
      "The Executive Alert Engine surfaces operational alerts from consultant exposure, dark money, relationship strength, and campaign intelligence.",
    value:
      "Leadership gets a live warning layer for issues that require attention.",
  },
  {
    route: "/command-center",
    page: "Command Center",
    section: "Execution",
    heading: "Top battlegrounds",
    label: "Race focus",
    target: {
      dataTour: "command-battlegrounds",
      selector: ".vs-stack, .vs-card",
      headingText: ["Top Battlegrounds"],
    },
    narration:
      "Top Battlegrounds gives the team a quick view of high-pressure races, states, and operating environments.",
    value:
      "Teams can decide which geographies deserve immediate strategy review.",
  },
  {
    route: "/command-center",
    page: "Command Center",
    section: "Execution",
    heading: "Execution priorities",
    label: "Action planning",
    target: {
      dataTour: "command-priorities",
      selector: ".vs-stack, .vs-card",
      headingText: ["Execution Priorities"],
    },
    narration:
      "Execution Priorities collect the most important recommended actions so they can be tracked and moved forward.",
    value:
      "Urgent work stays visible until it is handled.",
  },
  {
    route: "/command-center",
    page: "Command Center",
    section: "Execution",
    heading: "Executive feed",
    label: "Live context",
    target: {
      dataTour: "command-feed",
      selector: ".vs-stack, .vs-card",
      headingText: ["Executive Feed"],
    },
    narration:
      "The Executive Feed keeps recent signals, updates, and changes visible for leadership review.",
    value:
      "Teams can maintain situational awareness without waiting for a meeting recap.",
  },

  {
    route: "/candidates",
    page: "Candidate Intelligence",
    section: "Candidate research",
    heading: "Candidate intelligence",
    label: "Research context",
    target: {
      dataTour: "candidate-kpis",
      selector: ".vs-grid-4, .vs-card, main",
      headingText: ["Candidates", "Candidate Intelligence"],
    },
    narration:
      "Candidate Intelligence centralizes candidate records, offices, states, parties, campaign status, and FEC-linked context.",
    value:
      "Teams can research candidates faster and connect campaign context to planning.",
  },
  {
    route: "/donors",
    page: "Donor Network",
    section: "Fundraising relationships",
    heading: "Donor network",
    label: "Finance signal",
    target: {
      dataTour: "donor-kpis",
      selector: ".vs-grid-4, .vs-card, main",
      headingText: ["Donor Network", "Donors"],
    },
    narration:
      "The Donor Network helps teams understand contribution patterns, donor clusters, finance influence, and relationship opportunities.",
    value:
      "Finance teams can see where money relationships are forming and where opportunities may exist.",
  },
  {
    route: "/fundraising",
    page: "Fundraising Dashboard",
    section: "Campaign finance",
    heading: "Fundraising intelligence",
    label: "Momentum read",
    target: {
      dataTour: "fundraising-kpis",
      selector: ".vs-grid-4, .vs-card, main",
      headingText: ["Fundraising", "Finance"],
    },
    narration:
      "The Fundraising Dashboard tracks campaign finance momentum, finance leaders, FEC-linked records, and comparative money movement.",
    value:
      "Users can identify which campaigns are gaining financial strength and which races may need attention.",
  },
  {
    route: "/war-room",
    page: "AI War Room",
    section: "Rapid response",
    heading: "War Room intelligence",
    label: "Pressure response",
    target: {
      dataTour: "warroom-kpis",
      selector: ".vs-grid-4, .vs-card, main",
      headingText: ["War Room", "Threat", "Narrative"],
    },
    narration:
      "The AI War Room supports rapid response, narrative tracking, threat review, strategic recommendations, and high-pressure campaign operations.",
    value:
      "Teams can coordinate response activity before small issues become campaign problems.",
  },
  {
    route: "/vendors",
    page: "Vendor Network",
    section: "Operational partners",
    heading: "Vendor coverage",
    label: "Partner intelligence",
    target: {
      dataTour: "vendor-kpis",
      selector: ".vs-grid-4, .vs-card, main",
      headingText: ["Vendor Network", "Vendors"],
    },
    narration:
      "Vendor Network helps campaigns and consultants identify operating partners by category, geography, coverage, and campaign need.",
    value:
      "Teams can quickly understand where they have support and where gaps exist.",
  },
  {
    route: "/mailops",
    page: "MailOps",
    section: "Direct mail execution",
    heading: "MailOps execution",
    label: "Production visibility",
    target: {
      dataTour: "mailops-kpis",
      selector: ".vs-grid-4, .vs-card, table, main",
      headingText: ["MailOps", "Mail"],
    },
    narration:
      "MailOps tracks direct mail production, campaign mail events, vendors, drops, deadlines, and operational delivery visibility.",
    value:
      "Mail-heavy campaigns can monitor execution before delays create political problems.",
  },
  {
    route: "/campaign-crm",
    page: "Campaign CRM",
    section: "Relationship management",
    heading: "Campaign CRM",
    label: "Relationship system",
    target: {
      dataTour: "crm-kpis",
      selector: ".vs-grid-4, .vs-card, table, main",
      headingText: ["CRM", "Contacts", "Campaign CRM"],
    },
    narration:
      "Campaign CRM structures contacts, organizations, relationship history, follow-ups, and client development activity.",
    value:
      "Political relationships become organized, searchable, and actionable.",
  },
  {
    route: "/opportunity-engine",
    page: "Opportunity Engine",
    section: "Consultant growth",
    heading: "Opportunity scoring",
    label: "Growth prioritization",
    target: {
      dataTour: "opportunity-kpis",
      selector: ".vs-grid-4, .vs-card, main",
      headingText: ["Opportunity Engine", "Opportunity"],
    },
    narration:
      "The Opportunity Engine identifies campaign and consulting opportunities, high-value prospects, and follow-up workflows.",
    value:
      "Consultants can prioritize growth opportunities with stronger signals instead of guessing.",
  },
  {
    route: "/business-suite",
    page: "Consultant Business Suite",
    section: "Business operations",
    heading: "Business command",
    label: "Firm visibility",
    target: {
      dataTour: "business-kpis",
      selector: ".vs-grid-4, .vs-card, main",
      headingText: ["Business Suite", "Business"],
    },
    narration:
      "The Consultant Business Suite helps firms manage clients, retainers, invoices, projects, revenue workflows, and consulting operations.",
    value:
      "Firms can manage the business side inside the same platform as political intelligence.",
  },
  {
    route: "/revenue-intelligence",
    page: "Revenue Intelligence",
    section: "Business health",
    heading: "Revenue intelligence",
    label: "Financial control",
    target: {
      dataTour: "revenue-kpis",
      selector: ".vs-grid-4, .vs-card, main",
      headingText: ["Revenue", "Invoices", "Retainers"],
    },
    narration:
      "Revenue Intelligence monitors client health, overdue invoices, retainers, revenue pressure, and business risk.",
    value:
      "Leadership can see the health of the business side of campaign consulting.",
  },
  {
    route: "/intelligence-reports",
    page: "Intelligence Reports",
    section: "Client-ready deliverables",
    heading: "Report generation",
    label: "Client-ready output",
    target: {
      dataTour: "reports-kpis",
      selector: ".vs-grid-4, .vs-card, main",
      headingText: ["Intelligence Reports", "Reports"],
    },
    narration:
      "Intelligence Reports convert platform data into strategic deliverables for campaigns, clients, consultants, and leadership teams.",
    value:
      "Live intelligence can become client-ready material without starting from scratch.",
  },
  {
    route: "/search",
    page: "Universal Search",
    section: "Search",
    heading: "Universal search",
    label: "Discovery speed",
    target: {
      dataTour: "search-input",
      selector: "input[type='search'], input, .vs-card, main",
      headingText: ["Universal Search", "Search"],
    },
    narration:
      "Universal Search lets users search across candidates, reports, vendors, clients, tasks, signals, workspaces, and operating records from one place.",
    value:
      "Research and navigation become faster because users do not need to remember where every record lives.",
  },
  {
    route: "/executive-workspace",
    page: "Tour Complete",
    section: "Wrap-up",
    heading: "Ready to operate",
    label: "Platform summary",
    target: {
      dataTour: "workspace-command",
      selector: ".workspace-command-card, main",
      headingText: ["Executive Workspace"],
    },
    narration:
      "That completes the VoterSpheres guided product tour. The platform connects political intelligence, campaign execution, client development, revenue, and strategic reporting in one workflow.",
    value:
      "Start from Executive Workspace, understand the landscape, and move directly into action.",
  },
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeText(value = "", max = 1700) {
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

function isVisible(element) {
  if (!element || !(element instanceof Element)) return false;
  const rect = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);
  return (
    rect.width > 12 &&
    rect.height > 12 &&
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
    element.closest("main") ||
    element
  );
}

function queryFirstVisible(selector) {
  if (!selector) return null;

  const selectors = String(selector)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  for (const item of selectors) {
    try {
      const nodes = Array.from(document.querySelectorAll(item));
      for (const node of nodes) {
        const container = nearestTourContainer(node);
        if (container && isVisible(container) && !container.closest(".vs-tour-card")) {
          return container;
        }
      }
    } catch {
      // Ignore invalid selector.
    }
  }

  return null;
}

function elementContainsAnyText(element, terms = []) {
  const text = String(element?.textContent || "").replace(/\s+/g, " ").toLowerCase();
  return terms.some((term) => text.includes(String(term).toLowerCase()));
}

function findByHeadingText(terms = []) {
  if (!terms.length) return null;

  const headingSelectors =
    "h1,h2,h3,h4,.vs-section-title,.vs-stat-label,.vs-row-title,.vs-kicker,strong,button,a,label";

  const headings = Array.from(document.querySelectorAll(headingSelectors));
  for (const heading of headings) {
    if (!isVisible(heading)) continue;
    if (elementContainsAnyText(heading, terms)) {
      const container = nearestTourContainer(heading);
      if (container && isVisible(container)) return container;
    }
  }

  const containers = Array.from(
    document.querySelectorAll(
      "[data-tour],.vs-section-card,.vs-card,.vs-card-muted,.workspace-module-card,.workspace-command-card,section,main"
    )
  );

  for (const container of containers) {
    if (!isVisible(container)) continue;
    if (elementContainsAnyText(container, terms)) return container;
  }

  return null;
}

async function waitForTarget(step) {
  const start = Date.now();

  while (Date.now() - start < TARGET_TIMEOUT_MS) {
    if (step.target?.dataTour) {
      const dataMatch = queryFirstVisible(`[data-tour='${step.target.dataTour}']`);
      if (dataMatch) return dataMatch;
    }

    const headingMatch = findByHeadingText(step.target?.headingText || []);
    if (headingMatch) return headingMatch;

    const selectorMatch = queryFirstVisible(step.target?.selector);
    if (selectorMatch) return selectorMatch;

    await sleep(TARGET_POLL_MS);
  }

  return queryFirstVisible("main") || document.body;
}

function getSpotlightRect(element) {
  if (!element || !(element instanceof Element)) return null;

  const rect = element.getBoundingClientRect();
  const pad = 12;

  return {
    top: Math.max(12, rect.top - pad),
    left: Math.max(12, rect.left - pad),
    width: Math.min(window.innerWidth - 24, rect.width + pad * 2),
    height: Math.min(window.innerHeight - 24, rect.height + pad * 2),
  };
}

function buildNarration(step) {
  return [
    step.page,
    step.section,
    step.heading,
    step.narration,
    step.value ? `${step.label}: ${step.value}` : "",
  ]
    .filter(Boolean)
    .join(". ");
}

function TourStyles() {
  return (
    <style>{`
      .vs-tour-screen-dim {
        position: fixed;
        inset: 0;
        z-index: 10000;
        background: transparent;
        pointer-events: none;
      }

      .vs-tour-spotlight-box {
        position: fixed;
        z-index: 10006;
        pointer-events: none;
        border-radius: 24px;
        outline: 4px solid rgba(56, 189, 248, 1);
        box-shadow:
          0 0 0 6px rgba(56, 189, 248, 0.22),
          0 0 34px rgba(56, 189, 248, 0.88),
          0 0 68px rgba(245, 158, 11, 0.36);
        animation: vsTourSpotlightPulse 1.25s ease-in-out infinite;
      }

      @keyframes vsTourSpotlightPulse {
        0%, 100% {
          outline-color: rgba(56, 189, 248, 1);
          box-shadow:
            0 0 0 6px rgba(56, 189, 248, 0.22),
            0 0 34px rgba(56, 189, 248, 0.88),
            0 0 68px rgba(245, 158, 11, 0.36);
        }

        50% {
          outline-color: rgba(251, 191, 36, 1);
          box-shadow:
            0 0 0 7px rgba(251, 191, 36, 0.26),
            0 0 42px rgba(251, 191, 36, 0.9),
            0 0 78px rgba(56, 189, 248, 0.42);
        }
      }

      .vs-tour-section-label {
        display: inline-flex;
        width: fit-content;
        margin: 4px 28px 10px;
        border: 1px solid rgba(56, 189, 248, 0.44);
        background: rgba(14, 165, 233, 0.15);
        color: rgba(224, 242, 254, 0.98);
        padding: 7px 10px;
        border-radius: 999px;
        font-size: 11px;
        line-height: 1;
        font-weight: 900;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .vs-tour-benefits {
        display: grid;
        gap: 8px;
        margin: 14px 28px 0;
      }

      .vs-tour-benefit {
        border: 1px solid rgba(251, 191, 36, 0.36);
        background: rgba(245, 158, 11, 0.12);
        color: rgba(255, 251, 235, 0.95);
        padding: 10px 12px;
        border-radius: 14px;
        font-size: 13px;
        line-height: 1.45;
      }

      .vs-tour-benefit strong {
        color: #fef3c7;
      }

      .vs-tour-disclosure {
        margin: 12px 28px 0;
        color: rgba(186, 230, 253, 0.84);
        font-size: 11px;
        line-height: 1.5;
      }

      .vs-tour-backdrop {
        background: transparent !important;
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
        pointer-events: none;
      }

      .vs-tour-card {
        pointer-events: auto;
        max-width: min(800px, calc(100vw - 28px));
        border-color: rgba(56, 189, 248, 0.32) !important;
        box-shadow:
          0 28px 90px rgba(2, 6, 23, 0.72),
          0 0 46px rgba(56, 189, 248, 0.18) !important;
      }

      .vs-tour-body {
        line-height: 1.68;
      }
    `}</style>
  );
}

export default function VirtualTour() {
  const navigate = useNavigate();
  const location = useLocation();

  const mode = getTourMode(location.search);
  const steps = useMemo(() => TOUR_STEPS, []);

  const [running, setRunning] = useState(Boolean(mode));
  const [stepIndex, setStepIndex] = useState(0);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [novaOnly, setNovaOnly] = useState(true);
  const [paused, setPaused] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("Ready");
  const [spotlightRect, setSpotlightRect] = useState(null);
  const [replayNonce, setReplayNonce] = useState(0);

  const audioRef = useRef(null);
  const objectUrlRef = useRef("");
  const cancelledRef = useRef(false);
  const runIdRef = useRef(0);
  const targetRef = useRef(null);

  const step = running ? steps[stepIndex] : null;

  useEffect(() => {
    if (mode) {
      setRunning(true);
      setStepIndex(0);
      setPaused(false);
      setSpotlightRect(null);
      targetRef.current = null;
      cancelledRef.current = false;
    }
  }, [mode]);

  useEffect(() => {
    function updateSpotlight() {
      if (!targetRef.current) return;
      setSpotlightRect(getSpotlightRect(targetRef.current));
    }

    window.addEventListener("resize", updateSpotlight);
    window.addEventListener("scroll", updateSpotlight, true);

    return () => {
      window.removeEventListener("resize", updateSpotlight);
      window.removeEventListener("scroll", updateSpotlight, true);
    };
  }, []);

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
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
    setSpotlightRect(null);
    targetRef.current = null;
    stopAudio();

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = "";
    }

    navigate(location.pathname, { replace: true });
  }

  function goNextInternal() {
    if (stepIndex < steps.length - 1) {
      setStepIndex((value) => value + 1);
      return;
    }

    stopTour();
  }

  useEffect(() => {
    if (!running || !step || paused) return;

    const runId = runIdRef.current + 1;
    runIdRef.current = runId;
    cancelledRef.current = false;

    async function runStep() {
      try {
        stopAudio();
        setSpotlightRect(null);
        targetRef.current = null;

        const alreadyOnRoute = location.pathname === step.route;
        setVoiceStatus(alreadyOnRoute ? "Finding section" : "Opening page");

        if (!alreadyOnRoute) {
          navigate(step.route);
          await sleep(ROUTE_SETTLE_MS);
        } else {
          await sleep(275);
        }

        if (cancelledRef.current || runIdRef.current !== runId) return;

        setVoiceStatus("Waiting for section");
        const target = await waitForTarget(step);
        targetRef.current = target;

        if (target && target.scrollIntoView) {
          target.scrollIntoView({
            behavior: "smooth",
            block: "center",
            inline: "nearest",
          });
        }

        await sleep(CENTER_SETTLE_MS);

        if (cancelledRef.current || runIdRef.current !== runId) return;

        setSpotlightRect(getSpotlightRect(target));

        await sleep(350);

        if (cancelledRef.current || runIdRef.current !== runId) return;

        const narration = buildNarration(step);

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
          await sleep(BETWEEN_STEPS_MS);
          if (!cancelledRef.current && runIdRef.current === runId) {
            goNextInternal();
          }
        }
      } catch (error) {
        console.warn("[virtual-tour] step failed:", error.message);
        setVoiceStatus("Tour error. Use Next to continue.");
      }
    }

    runStep();

    return () => {
      stopAudio();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    autoAdvance,
    location.pathname,
    navigate,
    novaOnly,
    paused,
    replayNonce,
    running,
    stepIndex,
    voiceEnabled,
  ]);

  if (!running || !step) return null;

  const progress = Math.round(((stepIndex + 1) / Math.max(1, steps.length)) * 100);

  function goBack() {
    cancelledRef.current = true;
    stopAudio();

    if (stepIndex > 0) {
      setStepIndex((value) => value - 1);
    }

    setPaused(false);
  }

  function goNext() {
    cancelledRef.current = true;
    stopAudio();
    goNextInternal();
    setPaused(false);
  }

  function replayStep() {
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
    <>
      <TourStyles />

      {spotlightRect ? (
        <div
          className="vs-tour-spotlight-box"
          style={{
            top: `${spotlightRect.top}px`,
            left: `${spotlightRect.left}px`,
            width: `${spotlightRect.width}px`,
            height: `${spotlightRect.height}px`,
          }}
        />
      ) : null}

      <div className="vs-tour-screen-dim" />

      <div className="vs-tour-backdrop">
        <section className="vs-tour-card" role="dialog" aria-modal="true">
          <div className="vs-tour-progress">
            <span style={{ width: `${progress}%` }} />
          </div>

          <div className="vs-tour-header">
            <div>
              <p className="vs-kicker">Interactive Nova Product Demo</p>
              <h2>{step.page}</h2>
            </div>

            <button className="vs-tour-close" onClick={stopTour} aria-label="Close tour">
              ×
            </button>
          </div>

          <div className="vs-tour-section-label">{step.heading}</div>

          <p className="vs-tour-body">{step.narration}</p>

          {step.value ? (
            <div className="vs-tour-benefits">
              <div className="vs-tour-benefit">
                <strong>{step.label}:</strong> {step.value}
              </div>
            </div>
          ) : null}

          <p className="vs-tour-disclosure">
            Nova centers the section, displays the spotlight, then speaks. Status: {voiceStatus}
          </p>

          <div className="vs-tour-meta">
            {step.section} • Step {stepIndex + 1} of {steps.length} • {progress}%
          </div>

          <div className="vs-tour-actions">
            <button
              className="vs-button vs-button-secondary"
              onClick={goBack}
              disabled={stepIndex === 0}
            >
              Back
            </button>

            <button className="vs-button vs-button-secondary" onClick={togglePause}>
              {paused ? "Resume" : "Pause"}
            </button>

            <button className="vs-button vs-button-secondary" onClick={replayStep}>
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
              {stepIndex >= steps.length - 1 ? "Finish Demo" : "Next"}
            </button>
          </div>
        </section>
      </div>
    </>
  );

  return createPortal(tourCard, document.body);
}

