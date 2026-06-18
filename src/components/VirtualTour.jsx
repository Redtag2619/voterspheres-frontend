import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "https://voterspheres-backend-2pap.onrender.com";

const ROUTE_SETTLE_MS = 1250;
const HIGHLIGHT_SETTLE_MS = 450;
const BETWEEN_SEGMENTS_MS = 750;

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
  "main",
];

const PUBLIC_TOUR_STEPS = [
  {
    key: "executive-overview",
    route: "/executive-workspace",
    title: "Executive Workspace",
    section: "Command Home",
    intro: "We will begin in the Executive Workspace, the central command home for VoterSpheres.",
    segments: [
      {
        selector: ".workspace-command-card, [data-tour='workspace-command']",
        heading: "Your command center",
        narration:
          "The Executive Workspace is the main command center for the platform. Instead of forcing consultants to jump between disconnected systems, it brings political intelligence, operations, CRM activity, revenue, reports, and next actions into one executive view.",
        benefit:
          "This gives campaign leaders and consultants a single place to understand what is happening and what needs action next.",
      },
      {
        selector: ".vs-grid-4, [data-tour='workspace-kpis']",
        heading: "Executive indicators",
        narration:
          "Across the top, VoterSpheres summarizes readiness, launch posture, pressure, and opportunity pipeline. These indicators make the workspace useful as a daily operating screen, not just a static dashboard.",
        benefit:
          "Leadership can scan the state of the operation in seconds and decide where attention should go.",
      },
      {
        selector: ".workspace-actions, [data-tour='workspace-actions']",
        heading: "Fast action routing",
        narration:
          "The action bar moves users directly into intelligence, operations, revenue, universal search, and this guided demo. The goal is simple: users should move from insight to action without friction.",
        benefit:
          "This is the workflow advantage of VoterSpheres: every major signal has a clear path to execution.",
      },
    ],
  },
  {
    key: "political-intelligence",
    route: "/political-intelligence",
    title: "Political Intelligence Graph",
    section: "Intelligence",
    intro: "Next, we move into the Political Intelligence Graph, where relationships and influence patterns become easier to see.",
    segments: [
      {
        selector: ".graph, svg, canvas, .relationship-graph, .vs-grid-4, main",
        heading: "Relationship intelligence",
        narration:
          "The Political Intelligence Graph helps teams understand how candidates, donors, consultants, committees, organizations, and political signals connect. This is where VoterSpheres turns scattered political information into a strategic relationship map.",
        benefit:
          "Consultants can identify influence networks, partnership opportunities, and emerging risks faster than manual research allows.",
      },
      {
        selector: ".workspace-module-grid, .workspace-stack, table, main",
        heading: "From signal to strategy",
        narration:
          "The value is not just seeing data. It is understanding what the data means. Relationship intelligence helps teams decide who matters, where pressure is building, and which connections may shape a race.",
        benefit:
          "This supports better recommendations, smarter outreach, and more confident strategic planning.",
      },
    ],
  },
  {
    key: "election-map",
    route: "/map",
    title: "Election Map",
    section: "Election Geography",
    intro: "Now we move to the Election Map, the geographic intelligence layer for race and state-level planning.",
    segments: [
      {
        selector: ".map, svg, canvas, .leaflet-container, main",
        heading: "Geographic election view",
        narration:
          "The Election Map transforms race information into a geographic operating view. Users can explore states, districts, candidates, and political movement across the country.",
        benefit:
          "This gives consultants an immediate view of where political activity is concentrated.",
      },
      {
        selector: ".map-controls, .filters, .vs-grid-4, .workspace-actions, main",
        heading: "Targeting and prioritization",
        narration:
          "The map is designed for targeting and prioritization. Instead of reading through disconnected race records, users can orient quickly by geography and then drill into the areas that matter most.",
        benefit:
          "This helps teams prioritize battlegrounds, opportunities, and state-level strategy.",
      },
    ],
  },
  {
    key: "operations-map",
    route: "/operations-map",
    title: "Executive Operations Map",
    section: "Operational Coverage",
    intro: "From election geography, we move into the Executive Operations Map.",
    segments: [
      {
        selector: ".map, svg, canvas, .leaflet-container, .workspace-command-card, main",
        heading: "Operational coverage",
        narration:
          "The Executive Operations Map focuses on campaign infrastructure and operational coverage. It helps users see where activity, vendors, gaps, resources, and campaign operations are concentrated.",
        benefit:
          "Teams can catch operational weaknesses before they become execution problems.",
      },
      {
        selector: ".vs-grid-4, .workspace-module-grid, .workspace-status-grid, main",
        heading: "Actionable map intelligence",
        narration:
          "Supporting cards and summaries connect map intelligence to real operational decisions. The goal is not just to view a map. The goal is to know where to send people, money, vendors, and attention.",
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
    intro: "Next is Candidate Intelligence, where campaigns and consultants can review candidate-level information.",
    segments: [
      {
        selector: ".vs-grid-4, .candidate-stats, .stat-grid, main",
        heading: "Candidate records",
        narration:
          "Candidate Intelligence centralizes candidate records, offices, states, parties, campaign status, and FEC linkage. It is built to replace fragmented spreadsheets and one-off research notes.",
        benefit:
          "Teams can research candidates faster and connect campaign context to operational planning.",
      },
      {
        selector: "table, .candidate-list, .vs-table, .workspace-stack, main",
        heading: "Profiles and readiness",
        narration:
          "Candidate tables and profile cards help users move from broad discovery into individual candidate review. This is where campaign details, readiness indicators, and contact intelligence become useful.",
        benefit:
          "This supports better outreach, stronger candidate tracking, and faster strategic briefings.",
      },
    ],
  },
  {
    key: "donor-network",
    route: "/donors",
    title: "Donor Network",
    section: "Fundraising Intelligence",
    intro: "Now we move into the Donor Network, the relationship layer for fundraising intelligence.",
    segments: [
      {
        selector: ".vs-grid-4, .donor-stats, .stat-grid, main",
        heading: "Fundraising relationships",
        narration:
          "The Donor Network helps teams understand contribution patterns, donor clusters, and political finance influence. It turns fundraising data into relationship intelligence.",
        benefit:
          "Finance teams can see where money relationships are forming and where new opportunities may exist.",
      },
      {
        selector: "table, .donor-list, .workspace-stack, .vs-table, main",
        heading: "Donor discovery",
        narration:
          "Donor lists and relationship views support deeper research into giving behavior and campaign finance patterns.",
        benefit:
          "This helps connect fundraising intelligence to campaign strategy and consultant business development.",
      },
    ],
  },
  {
    key: "fundraising-dashboard",
    route: "/fundraising",
    title: "Fundraising Dashboard",
    section: "Campaign Finance",
    intro: "The Fundraising Dashboard gives users a clearer view of campaign finance momentum.",
    segments: [
      {
        selector: ".vs-grid-4, .stat-grid, .fundraising-stats, main",
        heading: "Finance momentum",
        narration:
          "The Fundraising Dashboard tracks finance leaders, FEC-linked records, money movement, and campaign fundraising strength.",
        benefit:
          "Users can identify which campaigns are gaining financial momentum and which races may need attention.",
      },
      {
        selector: "table, .leaderboard, .workspace-stack, .vs-table, main",
        heading: "Comparative intelligence",
        narration:
          "Leaderboards and tables make campaign finance performance easier to compare. This helps users understand not just who raised money, but who is building power.",
        benefit:
          "This gives consultants and strategists a sharper view of campaign strength.",
      },
    ],
  },
  {
    key: "command-center",
    route: "/command-center",
    title: "Command Center",
    section: "Execution",
    intro: "Next is the Command Center, where VoterSpheres turns intelligence into execution.",
    segments: [
      {
        selector: ".vs-grid-4, .command-stats, .stat-grid, main",
        heading: "Execution layer",
        narration:
          "The Command Center organizes priorities, tasks, ownership, vendor actions, and operational follow-through. This is where intelligence stops being passive and becomes work.",
        benefit:
          "Campaign teams can track what needs to happen, who owns it, and what is still open.",
      },
      {
        selector: ".execution-board, .task-board, .workspace-stack, .vs-table, main",
        heading: "Operational accountability",
        narration:
          "Execution boards and task rows create accountability. When a signal requires action, it can become a task, a vendor action, or a follow-up workflow.",
        benefit:
          "This prevents critical discoveries from disappearing after the meeting ends.",
      },
    ],
  },
  {
    key: "war-room",
    route: "/war-room",
    title: "War Room",
    section: "Rapid Response",
    intro: "The War Room is built for high-pressure campaign moments and rapid response.",
    segments: [
      {
        selector: ".vs-grid-4, .war-room, .threat-grid, .stat-grid, main",
        heading: "Threat response",
        narration:
          "The War Room helps teams monitor threats, narratives, escalation workflows, and campaign pressure. It is designed for moments when speed and coordination matter.",
        benefit:
          "Teams can coordinate response activity before small issues become campaign problems.",
      },
      {
        selector: ".workspace-stack, .threat-list, .signal-list, .vs-table, main",
        heading: "Narrative organization",
        narration:
          "Threat and narrative lists keep risk signals visible and organized for follow-up. Instead of reacting from memory, teams can work from a shared operating picture.",
        benefit:
          "This helps move from detection to coordinated action.",
      },
    ],
  },
  {
    key: "vendor-network",
    route: "/vendors",
    title: "Vendor Network",
    section: "Operational Partners",
    intro: "The Vendor Network helps campaigns and consultants find the partners needed to execute.",
    segments: [
      {
        selector: ".vs-grid-4, .vendor-stats, .stat-grid, main",
        heading: "Vendor coverage",
        narration:
          "Vendor Network helps users identify operational partners across direct mail, digital, data, field, consulting, production, and other campaign services.",
        benefit:
          "Campaigns and consultants can find support by category and geography.",
      },
      {
        selector: "table, .vendor-list, .workspace-stack, .vs-table, main",
        heading: "Coverage gaps",
        narration:
          "Vendor rows and filters help surface state coverage, category coverage, and operational gaps.",
        benefit:
          "This connects vendor intelligence to real campaign execution planning.",
      },
    ],
  },
  {
    key: "mailops",
    route: "/mailops",
    title: "MailOps",
    section: "Direct Mail Execution",
    intro: "MailOps focuses on direct mail execution and delivery visibility.",
    segments: [
      {
        selector: ".vs-grid-4, .mailops-stats, .stat-grid, main",
        heading: "Mail execution",
        narration:
          "MailOps supports direct mail tracking, production awareness, campaign mail events, and delivery visibility.",
        benefit:
          "Teams can track mail operations in one place instead of relying on scattered updates.",
      },
      {
        selector: "table, .mailops-list, .workspace-stack, .vs-table, main",
        heading: "Production awareness",
        narration:
          "Mail event lists help teams monitor deadlines, vendors, drops, and possible delays.",
        benefit:
          "This reduces execution blind spots in mail-heavy campaigns.",
      },
    ],
  },
  {
    key: "campaign-crm",
    route: "/campaign-crm",
    title: "Campaign CRM",
    section: "Relationship Management",
    intro: "Campaign CRM is where political relationships become structured and actionable.",
    segments: [
      {
        selector: ".vs-grid-4, .crm-stats, .stat-grid, main",
        heading: "Relationship system",
        narration:
          "Campaign CRM manages contacts, organizations, relationship history, follow-ups, and client development activity.",
        benefit:
          "Political relationships become organized, searchable, and actionable.",
      },
      {
        selector: "table, .crm-list, .workspace-stack, .vs-table, main",
        heading: "Follow-up workflow",
        narration:
          "Contact and activity rows show who needs follow-up and where relationships stand.",
        benefit:
          "This turns political opportunity into a structured relationship workflow.",
      },
    ],
  },
  {
    key: "opportunity-engine",
    route: "/opportunity-engine",
    title: "Opportunity Engine",
    section: "Consultant Growth",
    intro: "The Opportunity Engine connects political signals to consultant business development.",
    segments: [
      {
        selector: ".vs-grid-4, .opportunity-stats, .stat-grid, main",
        heading: "Opportunity scoring",
        narration:
          "The Opportunity Engine scores campaign and consulting opportunities, identifies high-value prospects, and routes follow-up actions into CRM and task workflows.",
        benefit:
          "Consultants can prioritize opportunities with stronger signals instead of guessing.",
      },
      {
        selector: "table, .opportunity-list, .workspace-stack, .vs-table, main",
        heading: "Revenue workflow",
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
    intro: "The Consultant Business Suite brings business operations into the same platform as political intelligence.",
    segments: [
      {
        selector: ".vs-grid-4, .business-stats, .stat-grid, main",
        heading: "Business command",
        narration:
          "The Consultant Business Suite helps manage clients, retainers, invoices, projects, revenue workflows, and consulting business operations.",
        benefit:
          "Firms can manage the business side inside the same operating platform.",
      },
      {
        selector: "table, .client-list, .workspace-stack, .vs-table, main",
        heading: "Client visibility",
        narration:
          "Client and revenue lists connect client work, financial activity, and operational accountability.",
        benefit:
          "This gives leadership visibility into client health and business performance.",
      },
    ],
  },
  {
    key: "intelligence-reports",
    route: "/intelligence-reports",
    title: "Intelligence Reports",
    section: "Deliverables",
    intro: "Intelligence Reports turn platform data into client-ready deliverables.",
    segments: [
      {
        selector: ".vs-grid-4, .report-stats, .stat-grid, main",
        heading: "Strategic reports",
        narration:
          "Intelligence Reports convert platform data into strategic deliverables for campaigns, clients, consultants, and leadership teams.",
        benefit:
          "Users can turn live intelligence into client-ready material.",
      },
      {
        selector: "table, .report-list, .workspace-stack, .vs-table, main",
        heading: "Executive output",
        narration:
          "Report lists help teams review generated reports and move toward export-ready deliverables.",
        benefit:
          "This supports strategy briefings, client updates, and executive reporting.",
      },
    ],
  },
  {
    key: "universal-search",
    route: "/search",
    title: "Universal Search",
    section: "Search",
    intro: "Universal Search makes the platform easier to navigate and explore.",
    segments: [
      {
        selector: "input[type='search'], input, .search-box, .workspace-command-card, main",
        heading: "Search across the platform",
        narration:
          "Universal Search lets users search across candidates, reports, vendors, clients, tasks, signals, workspaces, and operational records from one place.",
        benefit:
          "This reduces navigation friction and helps users find what they need quickly.",
      },
      {
        selector: ".search-results, table, .workspace-stack, .vs-table, main",
        heading: "Fast discovery",
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
    intro: "We will finish where the user begins: the Executive Workspace.",
    segments: [
      {
        selector: ".workspace-command-card, main",
        heading: "Ready to operate",
        narration:
          "That completes the VoterSpheres guided product tour. The platform connects political intelligence, campaign execution, client development, revenue, and strategic reporting in one workflow.",
        benefit:
          "Start from Executive Workspace, use intelligence to understand the landscape, and use operations and CRM tools to turn insights into action.",
      },
    ],
  },
];

const ADMIN_TOUR_STEPS = [
  {
    key: "launch-readiness",
    route: "/launch-readiness",
    title: "Launch Readiness",
    section: "Internal Readiness",
    intro: "This internal administration tour covers launch readiness and production review.",
    segments: [
      {
        selector: ".vs-grid-4, .stat-grid, main",
        heading: "Launch decision layer",
        narration:
          "Launch Readiness combines production hardening, QA, live intelligence, KPI risk, Opportunity Engine, and workspace readiness into one final launch decision.",
        benefit:
          "This gives the developer and operator a single view of blockers, review items, and readiness gates.",
      },
    ],
  },
  {
    key: "production-hardening",
    route: "/production-hardening",
    title: "Production Hardening",
    section: "Infrastructure",
    intro: "Next is Production Hardening.",
    segments: [
      {
        selector: ".vs-grid-4, .stat-grid, main",
        heading: "Production checks",
        narration:
          "Production Hardening validates environment variables, security, billing, database readiness, workflows, alerting, and launch-critical records.",
        benefit:
          "This catches launch blockers before users do.",
      },
    ],
  },
  {
    key: "launch-qa",
    route: "/launch-qa",
    title: "Launch QA",
    section: "Quality Assurance",
    intro: "Launch QA checks the platform before public use.",
    segments: [
      {
        selector: ".vs-grid-4, .stat-grid, main",
        heading: "Smoke tests",
        narration:
          "Launch QA smoke-tests platform routes, API health, authentication, billing, live data, reports, alerts, and workflow readiness.",
        benefit:
          "This reduces risk before public launch.",
      },
    ],
  },
  {
    key: "live-intelligence-layer",
    route: "/live-intelligence-layer",
    title: "Live Intelligence Layer",
    section: "Data Freshness",
    intro: "The Live Intelligence Layer reviews feed readiness.",
    segments: [
      {
        selector: ".vs-grid-4, .stat-grid, main",
        heading: "Feed readiness",
        narration:
          "The Live Intelligence Layer monitors whether core data feeds are live, stale, missing, or ready for launch.",
        benefit:
          "This confirms launch-ready data is present before public use.",
      },
    ],
  },
];

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

function normalizeText(value = "", max = 1600) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
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
    voices.find((voice) =>
      /female|woman|aria|jenny|samantha|victoria|karen|serena|zira|ava/i.test(
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

function findHighlightElement(selector) {
  const selectors = String(selector || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  for (const item of selectors) {
    const match = document.querySelector(item);
    if (match) return match;
  }

  for (const item of FALLBACK_HIGHLIGHTS) {
    const match = document.querySelector(item);
    if (match) return match;
  }

  return document.body;
}

function applyTourHighlight(selector) {
  clearTourHighlights();

  const element = findHighlightElement(selector);
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

function buildNarration(step, segment, includeIntro) {
  return [
    includeIntro ? step.intro : "",
    segment.heading,
    segment.narration,
    segment.benefit ? `Why it matters: ${segment.benefit}` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export default function VirtualTour() {
  const navigate = useNavigate();
  const location = useLocation();

  const mode = getTourMode(location.search);
  const steps = useMemo(
    () => (mode === "admin" ? ADMIN_TOUR_STEPS : PUBLIC_TOUR_STEPS),
    [mode]
  );

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

        applyTourHighlight(segment.selector);

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
            <p className="vs-kicker">
              {mode === "admin" ? "Admin Demo" : "Interactive Product Demo"}
            </p>
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

