import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "https://voterspheres-backend-2pap.onrender.com";

const ROUTE_SETTLE_MS = 1350;
const HIGHLIGHT_SETTLE_MS = 450;
const BETWEEN_SEGMENTS_MS = 650;

const FALLBACK_HIGHLIGHTS = [
  "[data-tour]",
  ".workspace-command-card",
  ".vs-grid-4",
  ".workspace-actions",
  ".workspace-tabs",
  ".workspace-module-grid",
  ".workspace-status-grid",
  ".workspace-stack",
  ".vs-card",
  ".vs-section-card",
  "section",
  "main",
];

const TOUR_STEPS = [
  {
    key: "executive-workspace",
    route: "/executive-workspace",
    title: "Executive Workspace",
    section: "Command Home",
    segments: [
      {
        heading: "Executive command view",
        dataTour: "workspace-command",
        selector: ".workspace-command-card",
        headingMatch: ["Workspace Command View", "Executive Workspace"],
        narration:
          "We begin in the Executive Workspace, the operating home for VoterSpheres. This view brings political intelligence, operations, CRM activity, revenue, reporting, and next actions into one executive command surface.",
        benefit:
          "Instead of forcing consultants to jump across disconnected tools, leadership can start here and understand what needs action.",
      },
      {
        heading: "Operating KPIs",
        dataTour: "workspace-kpis",
        selector: ".vs-grid-4",
        headingMatch: ["Workspace Readiness", "Launch Score", "Pressure Score", "Pipeline"],
        narration:
          "These indicators summarize workspace readiness, launch posture, pressure, and pipeline activity. The purpose is to make the platform useful as a daily operating screen, not just a static dashboard.",
        benefit:
          "Consultants can scan readiness, pressure, and opportunity in seconds.",
      },
      {
        heading: "Guided actions",
        dataTour: "workspace-actions",
        selector: ".workspace-actions",
        headingMatch: ["Start Guided Tour", "Admin Tour", "Universal Search"],
        narration:
          "The action bar routes users directly into intelligence, operations, revenue, universal search, and the guided tour. Every major signal should have a path to execution.",
        benefit:
          "This turns the workspace from an overview page into a launchpad for action.",
      },
      {
        heading: "Next actions",
        dataTour: "workspace-next-actions",
        selector: ".workspace-stack",
        headingMatch: ["What To Do Next"],
        narration:
          "The next action area surfaces priority work generated from launch readiness and workspace pressure. It helps the team understand which items deserve attention first.",
        benefit:
          "This keeps the highest-value work visible instead of buried in separate systems.",
      },
      {
        heading: "Operating status",
        dataTour: "workspace-operating-status",
        selector: ".workspace-status-grid",
        headingMatch: ["Operating Status", "Launch Gate", "Database Stability", "Live Feeds", "Opportunity Pipeline"],
        narration:
          "Operating Status connects launch health, database stability, live feeds, and opportunity pipeline into one quick review layer.",
        benefit:
          "This is where technical readiness, data freshness, and business opportunity meet.",
      },
    ],
  },
  {
    key: "election-map",
    route: "/map",
    title: "Election Map",
    section: "Election Geography",
    segments: [
      {
        heading: "Map filters",
        dataTour: "map-filters",
        selector: ".vs-select, select",
        headingMatch: ["Map Filters"],
        narration:
          "The Election Map begins with filters for state and office. These controls help users narrow the live overlay stack to the races and geographies that matter most.",
        benefit:
          "Consultants can move from a national view into a focused state or office review.",
      },
      {
        heading: "Finance overlay map",
        dataTour: "election-map-us",
        selector: ".rsm-svg, svg, .vs-card",
        headingMatch: ["U.S. Finance Overlay Map"],
        narration:
          "The U.S. Finance Overlay Map translates fundraising intensity into a geographic operating view. Highlighted states show where candidate finance signals are strongest.",
        benefit:
          "This makes campaign finance easier to understand by geography instead of reading through raw records.",
      },
      {
        heading: "Candidate field",
        dataTour: "election-map-candidates",
        selector: ".vs-stack",
        headingMatch: ["Candidates"],
        narration:
          "The candidate section shows the selected state and office field. Users can compare receipts, cash on hand, rank, and party in the context of the selected overlay.",
        benefit:
          "This links the map directly to candidate-level intelligence.",
      },
      {
        heading: "Donor intelligence",
        dataTour: "election-map-donors",
        selector: ".vs-stack",
        headingMatch: ["Donor Intelligence"],
        narration:
          "Donor Intelligence connects the selected candidate to donor network matches. This helps explain the finance behind the candidate signal.",
        benefit:
          "Users can move from where money is showing up to who may be driving it.",
      },
      {
        heading: "Overlay detail",
        dataTour: "election-map-overlay-detail",
        selector: ".vs-stack",
        headingMatch: ["Office Overlays", "Overlay Detail"],
        narration:
          "The overlay detail panel ranks state and office combinations, showing score, tier, receipts, and cash. It helps users decide which race deserves deeper attention.",
        benefit:
          "The map becomes a prioritization tool, not just a visualization.",
      },
    ],
  },
  {
    key: "command-center",
    route: "/command-center",
    title: "Command Center",
    section: "Execution",
    segments: [
      {
        heading: "Executive metrics",
        dataTour: "command-kpis",
        selector: ".vs-grid-4",
        headingMatch: ["National Win Index", "Active Threats", "Fundraising Pulse", "Persuasion Opportunity"],
        narration:
          "The Command Center opens with executive metrics for national performance, threats, fundraising pulse, and persuasion opportunity. These metrics give leadership a quick operating read.",
        benefit:
          "The team can understand campaign pressure before drilling into details.",
      },
      {
        heading: "Recommended executive action",
        dataTour: "command-recommended-action",
        selector: ".vs-card-muted",
        headingMatch: ["Recommended Executive Action"],
        narration:
          "Recommended Executive Action turns incoming signals into a clear decision point. It summarizes the top issue and suggests what the team should do next.",
        benefit:
          "This helps move from intelligence review to executive decision-making.",
      },
      {
        heading: "Execution board",
        dataTour: "command-execution-board",
        selector: ".task-filter-bar, .county-task-grid-wrap, .vs-table",
        headingMatch: ["Execution Board"],
        narration:
          "The Execution Board organizes work connected to campaign intelligence, county heat, vendors, MailOps, and operations. It shows what is open, completed, critical, or assigned.",
        benefit:
          "This is where VoterSpheres turns intelligence into operational accountability.",
      },
      {
        heading: "Consultant intelligence",
        dataTour: "command-consultants",
        selector: ".vs-grid-2, .vs-stack",
        headingMatch: ["Consultant Intelligence"],
        narration:
          "Consultant Intelligence tracks influence, exposure, candidate relationships, and review signals. This gives teams visibility into the consultant ecosystem around campaigns.",
        benefit:
          "It helps identify influence, risk, and relationship opportunities.",
      },
      {
        heading: "Relationship intelligence",
        dataTour: "command-relationships",
        selector: ".vs-grid-2, .vs-stack",
        headingMatch: ["Relationship Intelligence"],
        narration:
          "Relationship Intelligence shows how candidates, consultants, donors, and organizations connect across the platform.",
        benefit:
          "This helps teams see political networks that would otherwise be hidden in separate records.",
      },
      {
        heading: "Cross-signal priority layer",
        dataTour: "command-cross-signal",
        selector: ".vs-grid-4, .vs-stack",
        headingMatch: ["Cross-Signal Priority Layer"],
        narration:
          "The Cross-Signal Priority Layer combines fundraising, vendors, mail operations, relationships, and race pressure into one priority list.",
        benefit:
          "This lets the team focus on states or races where multiple warning signs are converging.",
      },
      {
        heading: "Executive alerts",
        dataTour: "command-alert-engine",
        selector: ".vs-stack",
        headingMatch: ["Executive Alert Engine"],
        narration:
          "The Executive Alert Engine surfaces operational alerts generated from consultant exposure, dark money, relationship strength, and campaign intelligence.",
        benefit:
          "This gives leadership a live warning layer for issues that require attention.",
      },
    ],
  },
  {
    key: "operations-map",
    route: "/operations-map",
    title: "Executive Operations Map",
    section: "Operational Coverage",
    segments: [
      {
        heading: "Operational map",
        dataTour: "operations-map",
        selector: ".map, svg, canvas, .leaflet-container, .workspace-command-card, main",
        headingMatch: ["Executive Operations Map", "Operations Map"],
        narration:
          "The Executive Operations Map focuses on campaign infrastructure and operational coverage. It helps users see where activity, vendors, gaps, resources, and campaign operations are concentrated.",
        benefit:
          "Teams can catch operational weaknesses before they become execution problems.",
      },
      {
        heading: "Operational summaries",
        dataTour: "operations-map-summaries",
        selector: ".vs-grid-4, .workspace-module-grid, .workspace-status-grid, main",
        headingMatch: ["Operating Status", "Coverage", "Vendor", "Tasks"],
        narration:
          "The supporting cards summarize where resources, tasks, vendors, and signals need attention.",
        benefit:
          "This connects geographic intelligence directly to campaign execution.",
      },
    ],
  },
  {
    key: "candidates",
    route: "/candidates",
    title: "Candidate Intelligence",
    section: "Candidate Research",
    segments: [
      {
        heading: "Candidate summary",
        dataTour: "candidate-kpis",
        selector: ".vs-grid-4, .candidate-stats, .stat-grid, main",
        headingMatch: ["Candidate", "Candidates"],
        narration:
          "Candidate Intelligence centralizes candidate records, offices, states, parties, campaign status, and FEC linkage.",
        benefit:
          "Teams can research candidates faster and connect campaign context to operational planning.",
      },
      {
        heading: "Candidate list",
        dataTour: "candidate-list",
        selector: "table, .candidate-list, .vs-table, .workspace-stack, main",
        headingMatch: ["Candidate List", "Candidates"],
        narration:
          "Candidate tables and cards help users move from broad discovery into individual candidate review.",
        benefit:
          "This supports outreach, targeting, and faster strategic briefings.",
      },
    ],
  },
  {
    key: "donors",
    route: "/donors",
    title: "Donor Network",
    section: "Fundraising Intelligence",
    segments: [
      {
        heading: "Donor metrics",
        dataTour: "donor-kpis",
        selector: ".vs-grid-4, .donor-stats, .stat-grid, main",
        headingMatch: ["Donor Network", "Donors"],
        narration:
          "The Donor Network helps teams understand contribution patterns, donor clusters, and political finance influence.",
        benefit:
          "Finance teams can see where money relationships are forming and where new opportunities may exist.",
      },
      {
        heading: "Donor records",
        dataTour: "donor-list",
        selector: "table, .donor-list, .workspace-stack, .vs-table, main",
        headingMatch: ["Donor", "Network"],
        narration:
          "Donor lists and relationship views support deeper research into giving behavior and campaign finance patterns.",
        benefit:
          "This connects fundraising intelligence to campaign strategy and consultant business development.",
      },
    ],
  },
  {
    key: "vendors",
    route: "/vendors",
    title: "Vendor Network",
    section: "Operational Partners",
    segments: [
      {
        heading: "Vendor coverage",
        dataTour: "vendor-kpis",
        selector: ".vs-grid-4, .vendor-stats, .stat-grid, main",
        headingMatch: ["Vendor Network", "Vendors"],
        narration:
          "Vendor Network helps users identify operational partners across direct mail, digital, data, field, consulting, production, and other campaign services.",
        benefit:
          "Campaigns and consultants can find support by category and geography.",
      },
      {
        heading: "Vendor list",
        dataTour: "vendor-list",
        selector: "table, .vendor-list, .workspace-stack, .vs-table, main",
        headingMatch: ["Vendor", "Coverage"],
        narration:
          "Vendor rows and filters help surface state coverage, category coverage, and operational gaps.",
        benefit:
          "This connects vendor intelligence to real campaign execution planning.",
      },
    ],
  },
  {
    key: "opportunity-engine",
    route: "/opportunity-engine",
    title: "Opportunity Engine",
    section: "Consultant Growth",
    segments: [
      {
        heading: "Opportunity scoring",
        dataTour: "opportunity-kpis",
        selector: ".vs-grid-4, .opportunity-stats, .stat-grid, main",
        headingMatch: ["Opportunity Engine", "Opportunity"],
        narration:
          "The Opportunity Engine scores campaign and consulting opportunities, identifies high-value prospects, and routes follow-up actions into CRM and task workflows.",
        benefit:
          "Consultants can prioritize opportunities with stronger signals instead of guessing.",
      },
      {
        heading: "Opportunity workflow",
        dataTour: "opportunity-list",
        selector: "table, .opportunity-list, .workspace-stack, .vs-table, main",
        headingMatch: ["Opportunity", "Pipeline"],
        narration:
          "Opportunity lists show which prospects are hot, high value, or ready for follow-up.",
        benefit:
          "This connects political intelligence directly to revenue growth.",
      },
    ],
  },
  {
    key: "business-suite",
    route: "/business-suite",
    title: "Consultant Business Suite",
    section: "Business Operations",
    segments: [
      {
        heading: "Business command",
        dataTour: "business-kpis",
        selector: ".vs-grid-4, .business-stats, .stat-grid, main",
        headingMatch: ["Consultant Business Suite", "Business"],
        narration:
          "The Consultant Business Suite helps manage clients, retainers, invoices, projects, revenue workflows, and consulting business operations.",
        benefit:
          "Firms can manage the business side inside the same platform as political intelligence.",
      },
      {
        heading: "Client visibility",
        dataTour: "business-clients",
        selector: "table, .client-list, .workspace-stack, .vs-table, main",
        headingMatch: ["Client", "Revenue"],
        narration:
          "Client and revenue lists connect client work, financial activity, and operational accountability.",
        benefit:
          "This gives leadership visibility into client health and business performance.",
      },
    ],
  },
  {
    key: "reports",
    route: "/intelligence-reports",
    title: "Intelligence Reports",
    section: "Deliverables",
    segments: [
      {
        heading: "Report generation",
        dataTour: "reports-kpis",
        selector: ".vs-grid-4, .report-stats, .stat-grid, main",
        headingMatch: ["Intelligence Reports", "Reports"],
        narration:
          "Intelligence Reports convert platform data into strategic deliverables for campaigns, clients, consultants, and leadership teams.",
        benefit:
          "Users can turn live intelligence into client-ready material.",
      },
      {
        heading: "Report list",
        dataTour: "reports-list",
        selector: "table, .report-list, .workspace-stack, .vs-table, main",
        headingMatch: ["Report", "Export"],
        narration:
          "Report lists help teams review generated reports and move toward export-ready deliverables.",
        benefit:
          "This supports strategy briefings, client updates, and executive reporting.",
      },
    ],
  },
  {
    key: "search",
    route: "/search",
    title: "Universal Search",
    section: "Search",
    segments: [
      {
        heading: "Search input",
        dataTour: "search-input",
        selector: "input[type='search'], input, .search-box, .workspace-command-card, main",
        headingMatch: ["Universal Search", "Search"],
        narration:
          "Universal Search lets users search across candidates, reports, vendors, clients, tasks, signals, workspaces, and operational records from one place.",
        benefit:
          "This reduces navigation friction and helps users find what they need quickly.",
      },
      {
        heading: "Search results",
        dataTour: "search-results",
        selector: ".search-results, table, .workspace-stack, .vs-table, main",
        headingMatch: ["Results", "Search"],
        narration:
          "Search results help users jump directly to the record or page they need.",
        benefit:
          "This keeps research, operations, and client work moving quickly.",
      },
    ],
  },
  {
    key: "complete",
    route: "/executive-workspace",
    title: "Tour Complete",
    section: "Wrap-up",
    segments: [
      {
        heading: "Ready to operate",
        dataTour: "workspace-command",
        selector: ".workspace-command-card, main",
        headingMatch: ["Workspace Command View", "Executive Workspace"],
        narration:
          "That completes the VoterSpheres guided product tour. The platform connects political intelligence, campaign execution, client development, revenue, and strategic reporting in one workflow.",
        benefit:
          "Start from Executive Workspace, use intelligence to understand the landscape, and use operations and CRM tools to turn insights into action.",
      },
    ],
  },
];

function normalizeText(value = "", max = 1600) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function getTourMode(search) {
  const params = new URLSearchParams(search || "");
  const raw = params.get("tour");
  if (raw === "admin") return "admin";
  if (raw === "platform" || raw === "public" || raw === "demo") return "platform";
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

function elementContainsText(element, terms = []) {
  const text = String(element?.textContent || "").replace(/\s+/g, " ").toLowerCase();
  return terms.some((term) => text.includes(String(term).toLowerCase()));
}

function nearestTourContainer(element) {
  if (!element) return null;

  return (
    element.closest("[data-tour]") ||
    element.closest(".vs-section-card") ||
    element.closest(".vs-card") ||
    element.closest("section") ||
    element.closest("article") ||
    element.closest("main") ||
    element
  );
}

function findByHeadingText(terms = []) {
  if (!terms?.length) return null;

  const headingSelectors = [
    "h1",
    "h2",
    "h3",
    ".vs-section-title",
    ".vs-stat-label",
    ".vs-kicker",
    "button",
    "a",
  ];

  const nodes = Array.from(document.querySelectorAll(headingSelectors.join(",")));

  for (const node of nodes) {
    if (elementContainsText(node, terms)) {
      return nearestTourContainer(node);
    }
  }

  const broadNodes = Array.from(
    document.querySelectorAll(".vs-section-card, .vs-card, .workspace-module-card, .workspace-command-card")
  );

  for (const node of broadNodes) {
    if (elementContainsText(node, terms)) return node;
  }

  return null;
}

function queryFirst(selector) {
  if (!selector) return null;

  const selectors = String(selector)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  for (const item of selectors) {
    try {
      const match = document.querySelector(item);
      if (match) return match;
    } catch {
      // ignore invalid selector
    }
  }

  return null;
}

function findHighlightElement(segment) {
  if (segment?.dataTour) {
    const byData = queryFirst(`[data-tour='${segment.dataTour}']`);
    if (byData) return byData;
  }

  const byHeading = findByHeadingText(segment?.headingMatch || []);
  if (byHeading) return byHeading;

  const bySelector = queryFirst(segment?.selector);
  if (bySelector) return nearestTourContainer(bySelector);

  for (const item of FALLBACK_HIGHLIGHTS) {
    const match = queryFirst(item);
    if (match) return nearestTourContainer(match);
  }

  return document.body;
}

function applyTourHighlight(segment) {
  clearTourHighlights();

  const element = findHighlightElement(segment);
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
}

function buildNarration(step, segment, isFirstSegmentOnPage) {
  return [
    isFirstSegmentOnPage ? `${step.title}. ${step.section}.` : "",
    segment.heading,
    segment.narration,
    segment.benefit ? `Business value: ${segment.benefit}` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export default function VirtualTour() {
  const navigate = useNavigate();
  const location = useLocation();

  const mode = getTourMode(location.search);
  const steps = useMemo(() => TOUR_STEPS, []);

  const [running, setRunning] = useState(Boolean(mode));
  const [stepIndex, setStepIndex] = useState(0);
  const [segmentIndex, setSegmentIndex] = useState(0);
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

  const step = running ? steps[stepIndex] : null;
  const segments = Array.isArray(step?.segments) ? step.segments : [];
  const segment = segments[segmentIndex] || null;

  useEffect(() => {
    if (mode) {
      setRunning(true);
      setStepIndex(0);
      setSegmentIndex(0);
      setPaused(false);
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
    clearTourHighlights();
    stopAudio();

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = "";
    }

    navigate(location.pathname, { replace: true });
  }

  function goNextInternal() {
    const currentSegments = Array.isArray(steps[stepIndex]?.segments)
      ? steps[stepIndex].segments
      : [];

    if (segmentIndex < currentSegments.length - 1) {
      setSegmentIndex((value) => value + 1);
      return;
    }

    if (stepIndex < steps.length - 1) {
      setStepIndex((value) => value + 1);
      setSegmentIndex(0);
      return;
    }

    stopTour();
  }

  useEffect(() => {
    if (!running || !step || !segment || paused) return;

    const runId = runIdRef.current + 1;
    runIdRef.current = runId;
    cancelledRef.current = false;

    async function runSegment() {
      try {
        stopAudio();
        clearTourHighlights();

        setVoiceStatus("Opening page");
        navigate(step.route);

        await new Promise((resolve) => setTimeout(resolve, ROUTE_SETTLE_MS));
        if (cancelledRef.current || runIdRef.current !== runId) return;

        applyTourHighlight(segment);

        await new Promise((resolve) => setTimeout(resolve, HIGHLIGHT_SETTLE_MS));
        if (cancelledRef.current || runIdRef.current !== runId) return;

        const narration = buildNarration(step, segment, segmentIndex === 0);

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
          await new Promise((resolve) => setTimeout(resolve, BETWEEN_SEGMENTS_MS));
          if (!cancelledRef.current && runIdRef.current === runId) {
            goNextInternal();
          }
        }
      } catch (error) {
        console.warn("[virtual-tour] segment failed:", error.message);
        setVoiceStatus("Voice error. Use Next to continue.");
      }
    }

    runSegment();

    return () => {
      stopAudio();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    autoAdvance,
    navigate,
    novaOnly,
    paused,
    replayNonce,
    running,
    segmentIndex,
    stepIndex,
    voiceEnabled,
  ]);

  if (!running || !step || !segment) return null;

  const totalSegments = steps.reduce(
    (sum, current) => sum + (Array.isArray(current.segments) ? current.segments.length : 0),
    0
  );

  const completedSegments =
    steps
      .slice(0, stepIndex)
      .reduce(
        (sum, current) => sum + (Array.isArray(current.segments) ? current.segments.length : 0),
        0
      ) + segmentIndex + 1;

  const progress = Math.round((completedSegments / Math.max(1, totalSegments)) * 100);

  function goBack() {
    cancelledRef.current = true;
    stopAudio();

    if (segmentIndex > 0) {
      setSegmentIndex((value) => value - 1);
    } else if (stepIndex > 0) {
      const previousStep = steps[stepIndex - 1];
      const previousSegments = Array.isArray(previousStep?.segments)
        ? previousStep.segments
        : [];
      setStepIndex((value) => value - 1);
      setSegmentIndex(Math.max(0, previousSegments.length - 1));
    }

    setPaused(false);
  }

  function goNext() {
    cancelledRef.current = true;
    stopAudio();
    goNextInternal();
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
            <p className="vs-kicker">Interactive Product Demo</p>
            <h2>{step.title}</h2>
          </div>

          <button className="vs-tour-close" onClick={stopTour} aria-label="Close tour">
            ×
          </button>
        </div>

        <div className="vs-tour-section-label">{segment.heading}</div>

        <p className="vs-tour-body">{segment.narration}</p>

        {segment.benefit ? (
          <div className="vs-tour-benefits">
            <div className="vs-tour-benefit">{segment.benefit}</div>
          </div>
        ) : null}

        <p className="vs-tour-disclosure">
          Voice narration is AI-generated with OpenAI Nova when available. Status: {voiceStatus}
        </p>

        <div className="vs-tour-meta">
          {step.section} • Page {stepIndex + 1} of {steps.length} • Section{" "}
          {segmentIndex + 1} of {segments.length} • {progress}%
        </div>

        <div className="vs-tour-actions">
          <button
            className="vs-button vs-button-secondary"
            onClick={goBack}
            disabled={stepIndex === 0 && segmentIndex === 0}
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
            {stepIndex >= steps.length - 1 && segmentIndex >= segments.length - 1
              ? "Finish Demo"
              : "Next"}
          </button>
        </div>
      </section>
    </div>
  );

  return createPortal(tourCard, document.body);
}

