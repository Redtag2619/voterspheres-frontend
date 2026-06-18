import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "https://voterspheres-backend-2pap.onrender.com";

const FALLBACK_HIGHLIGHTS = [
  ".workspace-actions",
  ".workspace-tabs",
  ".vs-grid-4",
  ".workspace-command-card",
  ".workspace-module-grid",
  ".workspace-status-grid",
  ".workspace-stack",
  ".vs-card",
  ".vs-section-card",
  "main",
];

const PUBLIC_TOUR_STEPS = [
  {
    key: "intro",
    route: "/executive-workspace",
    title: "Welcome to VoterSpheres",
    section: "Platform Overview",
    segments: [
      {
        selector: ".workspace-command-card",
        text:
          "Welcome to VoterSpheres. This guided product demo walks through the major platform areas and explains how campaigns, consultants, and political teams use each page.",
        benefit:
          "VoterSpheres connects intelligence, operations, CRM, revenue, and reports inside one political command system.",
      },
      {
        selector: ".workspace-actions",
        text:
          "Use the main workspace actions to move into intelligence, operations, revenue, search, or the guided demo at any time.",
        benefit:
          "The platform is designed to reduce tool switching and move users from insight to action quickly.",
      },
    ],
  },
  {
    key: "executive-workspace",
    route: "/executive-workspace",
    title: "Executive Workspace",
    section: "Command Home",
    segments: [
      {
        selector: ".vs-grid-4",
        text:
          "Across the top are executive indicators for workspace readiness, launch score, pressure, and pipeline activity.",
        benefit:
          "Leaders can understand the operating condition of the platform in seconds.",
      },
      {
        selector: ".workspace-command-card",
        text:
          "The command view gives a plain-language operating decision and ties the workspace to campaign activity, tasks, revenue, reports, and alerts.",
        benefit:
          "This becomes the daily command center instead of a static dashboard.",
      },
      {
        selector: ".workspace-actions",
        text:
          "The action buttons let users jump directly into intelligence, operations, revenue, search, or the guided demo.",
        benefit:
          "Teams move from overview to action without hunting through menus.",
      },
    ],
  },
  {
    key: "political-intelligence",
    route: "/political-intelligence",
    title: "Political Intelligence Graph",
    section: "Intelligence",
    segments: [
      {
        selector: ".vs-grid-4, .stat-grid, .kpi-grid",
        text:
          "Political Intelligence maps relationships, influence paths, signal clusters, donors, consultants, campaigns, and organizations.",
        benefit:
          "This helps teams understand how political actors and organizations connect.",
      },
      {
        selector: ".graph, svg, canvas, .relationship-graph, .workspace-module-grid",
        text:
          "When graph elements are available, users can explore relationship patterns and identify influence routes that are hard to see in tables.",
        benefit:
          "It turns complex political networks into visual strategy intelligence.",
      },
    ],
  },
  {
    key: "candidates",
    route: "/candidates",
    title: "Candidate Intelligence",
    section: "Intelligence",
    segments: [
      {
        selector: ".vs-grid-4, .candidate-stats, .stat-grid",
        text:
          "Candidate Intelligence centralizes candidate records, offices, states, parties, campaign status, and FEC linkage.",
        benefit:
          "This gives consultants and campaign teams a single research surface for candidate discovery.",
      },
      {
        selector: "table, .candidate-list, .vs-table, .workspace-stack",
        text:
          "Candidate lists and profile cards help users move from broad search into individual candidate review.",
        benefit:
          "It saves research time and helps prepare outreach, targeting, and strategic recommendations.",
      },
    ],
  },
  {
    key: "election-map",
    route: "/map",
    title: "Election Map",
    section: "Maps",
    segments: [
      {
        selector: ".map, svg, canvas, .leaflet-container, .workspace-module-grid",
        text:
          "The Election Map gives a geographic view of election activity, races, states, districts, and political movement across the country.",
        benefit:
          "Teams can understand where activity is concentrated and where attention should shift next.",
      },
      {
        selector: ".vs-grid-4, .map-controls, .filters, .workspace-actions",
        text:
          "Map controls and filters help move from a national view to state-level or district-level planning.",
        benefit:
          "This supports targeting, state-by-state prioritization, and executive strategy review.",
      },
    ],
  },
  {
    key: "operations-map",
    route: "/operations-map",
    title: "Executive Operations Map",
    section: "Maps",
    segments: [
      {
        selector: ".map, svg, canvas, .leaflet-container, .workspace-command-card",
        text:
          "The Executive Operations Map shows operational coverage, infrastructure, vendor gaps, activity density, and strategic movement across the United States.",
        benefit:
          "Operations teams can see coverage problems before they become execution problems.",
      },
      {
        selector: ".vs-grid-4, .workspace-module-grid, .workspace-status-grid",
        text:
          "The supporting cards summarize where resources, tasks, vendors, and signals need attention.",
        benefit:
          "This connects geographic insight directly to action planning.",
      },
    ],
  },
  {
    key: "donors",
    route: "/donors",
    title: "Donor Network",
    section: "Fundraising",
    segments: [
      {
        selector: ".vs-grid-4, .donor-stats, .stat-grid",
        text:
          "The Donor Network helps teams understand contribution patterns, donor clusters, and political finance influence.",
        benefit:
          "Finance teams can see where money relationships are forming and where opportunities may exist.",
      },
      {
        selector: "table, .donor-list, .workspace-stack, .vs-table",
        text:
          "Donor lists and relationship views support deeper finance research and strategic fundraising review.",
        benefit:
          "This helps connect fundraising intelligence to campaign planning.",
      },
    ],
  },
  {
    key: "fundraising",
    route: "/fundraising",
    title: "Fundraising Dashboard",
    section: "Fundraising",
    segments: [
      {
        selector: ".vs-grid-4, .stat-grid, .fundraising-stats",
        text:
          "The Fundraising Dashboard tracks finance leaders, FEC-linked records, and money movement across campaigns.",
        benefit:
          "Users can identify which campaigns are gaining financial momentum.",
      },
      {
        selector: "table, .leaderboard, .workspace-stack, .vs-table",
        text:
          "Leaderboards and lists help compare finance performance and surface campaign money signals.",
        benefit:
          "This gives consultants and strategists a sharper view of campaign strength.",
      },
    ],
  },
  {
    key: "command-center",
    route: "/command-center",
    title: "Command Center",
    section: "Operations",
    segments: [
      {
        selector: ".vs-grid-4, .command-stats, .stat-grid",
        text:
          "The Command Center turns intelligence into execution by organizing priorities, tasks, ownership, vendor actions, and operational follow-through.",
        benefit:
          "This keeps critical items from disappearing after they are discovered.",
      },
      {
        selector: ".execution-board, .task-board, .workspace-stack, .vs-table",
        text:
          "Execution boards and task rows show what is open, who owns it, and what needs to happen next.",
        benefit:
          "Campaign teams can track work and reduce operational drift.",
      },
    ],
  },
  {
    key: "war-room",
    route: "/war-room",
    title: "War Room",
    section: "Operations",
    segments: [
      {
        selector: ".vs-grid-4, .war-room, .threat-grid, .stat-grid",
        text:
          "The War Room supports rapid response, narrative tracking, escalation workflow, and high-pressure political moments.",
        benefit:
          "Teams can coordinate response activity before small issues become campaign problems.",
      },
      {
        selector: ".workspace-stack, .threat-list, .signal-list, .vs-table",
        text:
          "Threat and narrative lists keep risk signals visible and organized for follow-up.",
        benefit:
          "This helps move from detection to coordinated action.",
      },
    ],
  },
  {
    key: "vendors",
    route: "/vendors",
    title: "Vendor Network",
    section: "Operations",
    segments: [
      {
        selector: ".vs-grid-4, .vendor-stats, .stat-grid",
        text:
          "Vendor Network helps users identify operational partners across direct mail, digital, data, field, consulting, and production services.",
        benefit:
          "Campaigns and consultants can find support by category and geography.",
      },
      {
        selector: "table, .vendor-list, .workspace-stack, .vs-table",
        text:
          "Vendor rows and filters help surface state coverage, category coverage, and operational gaps.",
        benefit:
          "This connects vendor intelligence to execution planning.",
      },
    ],
  },
  {
    key: "mailops",
    route: "/mailops",
    title: "MailOps",
    section: "Operations",
    segments: [
      {
        selector: ".vs-grid-4, .mailops-stats, .stat-grid",
        text:
          "MailOps supports direct mail execution tracking, production awareness, campaign mail events, and delivery visibility.",
        benefit:
          "Teams can track direct mail operations in one place.",
      },
      {
        selector: "table, .mailops-list, .workspace-stack, .vs-table",
        text:
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
    section: "CRM",
    segments: [
      {
        selector: ".vs-grid-4, .crm-stats, .stat-grid",
        text:
          "Campaign CRM manages contacts, organizations, relationship history, follow-ups, and client development activity.",
        benefit:
          "Political relationships become organized, searchable, and actionable.",
      },
      {
        selector: "table, .crm-list, .workspace-stack, .vs-table",
        text:
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
    section: "Growth",
    segments: [
      {
        selector: ".vs-grid-4, .opportunity-stats, .stat-grid",
        text:
          "The Opportunity Engine scores campaign and consulting opportunities, identifies high-value prospects, and routes follow-up actions into CRM and task workflows.",
        benefit:
          "Consultants can prioritize opportunities with stronger signals instead of guessing.",
      },
      {
        selector: "table, .opportunity-list, .workspace-stack, .vs-table",
        text:
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
    section: "Business",
    segments: [
      {
        selector: ".vs-grid-4, .business-stats, .stat-grid",
        text:
          "The Consultant Business Suite helps manage clients, retainers, invoices, projects, revenue workflows, and business operations.",
        benefit:
          "Consulting firms can manage the business side inside the same operating platform.",
      },
      {
        selector: "table, .client-list, .workspace-stack, .vs-table",
        text:
          "Client and revenue lists connect client work, financial activity, and operational accountability.",
        benefit:
          "This gives leadership visibility into client health and business performance.",
      },
    ],
  },
  {
    key: "revenue-intelligence",
    route: "/revenue-intelligence",
    title: "Revenue Intelligence",
    section: "Business",
    segments: [
      {
        selector: ".vs-grid-4, .revenue-stats, .stat-grid",
        text:
          "Revenue Intelligence helps teams monitor client health, overdue invoices, retainers, revenue pressure, and business risk.",
        benefit:
          "Financial risk becomes visible before it becomes urgent.",
      },
      {
        selector: "table, .revenue-list, .workspace-stack, .vs-table",
        text:
          "Revenue rows and summaries help identify which clients need attention.",
        benefit:
          "This connects campaign work to measurable business outcomes.",
      },
    ],
  },
  {
    key: "intelligence-reports",
    route: "/intelligence-reports",
    title: "Intelligence Reports",
    section: "Reports",
    segments: [
      {
        selector: ".vs-grid-4, .report-stats, .stat-grid",
        text:
          "Intelligence Reports convert platform data into strategic deliverables for campaigns, clients, consultants, and leadership teams.",
        benefit:
          "Users can turn live intelligence into client-ready material.",
      },
      {
        selector: "table, .report-list, .workspace-stack, .vs-table",
        text:
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
        selector: "input[type='search'], input, .search-box, .workspace-command-card",
        text:
          "Universal Search lets users search across candidates, reports, vendors, clients, tasks, signals, workspaces, and records from one place.",
        benefit:
          "This reduces navigation friction and makes the entire platform easier to explore.",
      },
      {
        selector: ".search-results, table, .workspace-stack, .vs-table",
        text:
          "Search results help users jump directly to the record or page they need.",
        benefit:
          "This keeps research and action moving quickly.",
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
        selector: ".workspace-command-card",
        text:
          "That completes the VoterSpheres guided demo. The platform connects political intelligence, campaign execution, client development, revenue, and strategic reporting in one workflow.",
        benefit:
          "Start from Executive Workspace, use intelligence to understand the landscape, and use operations and CRM tools to turn insights into action.",
      },
    ],
  },
];

const ADMIN_TOUR_STEPS = [
  {
    key: "admin-intro",
    route: "/launch-readiness",
    title: "Administration Tour",
    section: "Internal Readiness",
    segments: [
      {
        selector: ".vs-grid-4, .workspace-command-card, main",
        text:
          "This internal administration tour covers launch readiness, hardening, quality assurance, live data health, automation, and database stability.",
        benefit:
          "Use this tour for developer and operator review while keeping internal readiness separate from the public product demo.",
      },
    ],
  },
  {
    key: "launch-readiness",
    route: "/launch-readiness",
    title: "Launch Readiness",
    section: "Internal Readiness",
    segments: [
      {
        selector: ".vs-grid-4, .stat-grid, main",
        text:
          "Launch Readiness combines production hardening, QA, live intelligence, KPI risk, Opportunity Engine, and workspace readiness into one final launch decision.",
        benefit:
          "This shows launch score, blockers, ready gates, and review items in one place.",
      },
    ],
  },
  {
    key: "production-hardening",
    route: "/production-hardening",
    title: "Production Hardening",
    section: "Infrastructure",
    segments: [
      {
        selector: ".vs-grid-4, .stat-grid, main",
        text:
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
    segments: [
      {
        selector: ".vs-grid-4, .stat-grid, main",
        text:
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
    segments: [
      {
        selector: ".vs-grid-4, .stat-grid, main",
        text:
          "The Live Intelligence Layer monitors whether core data feeds are live, stale, missing, or ready for launch.",
        benefit:
          "This confirms launch-ready data is present before public use.",
      },
    ],
  },
];

function clampText(value = "", max = 1400) {
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

async function fetchOpenAiSpeech(text) {
  const token = getToken();

  const response = await fetch(`${API_BASE}/api/tour/voice`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      text: clampText(text),
      voice: "nova",
      model: "gpt-4o-mini-tts",
    }),
  });

  if (!response.ok) {
    throw new Error(`Voice request failed: ${response.status}`);
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

function playBrowserSpeech(text, enabled) {
  return new Promise((resolve) => {
    if (!enabled || typeof window === "undefined" || !window.speechSynthesis) {
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

function findHighlightElement(selector) {
  if (!selector) return null;

  const selectors = String(selector)
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

function clearTourHighlights() {
  document.querySelectorAll(".vs-tour-highlight-active").forEach((node) => {
    node.classList.remove("vs-tour-highlight-active");
  });
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

function getSegmentNarration(step, segment) {
  return [step.title, segment.text, segment.benefit ? `Benefit: ${segment.benefit}` : ""]
    .filter(Boolean)
    .join(". ");
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
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [paused, setPaused] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("Ready");
  const [usingOpenAiVoice, setUsingOpenAiVoice] = useState(true);
  const [replayNonce, setReplayNonce] = useState(0);

  const audioRef = useRef(null);
  const objectUrlRef = useRef("");
  const cancelledRef = useRef(false);
  const narrationIdRef = useRef(0);

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

    const narrationId = narrationIdRef.current + 1;
    narrationIdRef.current = narrationId;
    cancelledRef.current = false;

    async function runSegment() {
      try {
        setVoiceStatus("Opening page");
        navigate(step.route);

        await new Promise((resolve) => setTimeout(resolve, 850));

        if (cancelledRef.current || narrationIdRef.current !== narrationId) return;

        applyTourHighlight(segment.selector);

        await new Promise((resolve) => setTimeout(resolve, 450));

        if (cancelledRef.current || narrationIdRef.current !== narrationId) return;

        const narration = getSegmentNarration(step, segment);

        if (!voiceEnabled) {
          setVoiceStatus("Voice off");
        } else if (usingOpenAiVoice) {
          try {
            setVoiceStatus("Generating Nova voice");
            const url = await fetchOpenAiSpeech(narration);

            if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
            objectUrlRef.current = url;

            if (cancelledRef.current || narrationIdRef.current !== narrationId) return;

            setVoiceStatus("Speaking with OpenAI Nova");
            await playAudioUrl(url, audioRef);
          } catch (error) {
            console.warn("[virtual-tour] OpenAI voice fallback:", error.message);
            setVoiceStatus("Nova unavailable. Using browser voice.");
            await playBrowserSpeech(narration, true);
          }
        } else {
          setVoiceStatus("Speaking with browser voice");
          await playBrowserSpeech(narration, true);
        }

        if (cancelledRef.current || narrationIdRef.current !== narrationId) return;

        setVoiceStatus("Ready");

        if (autoAdvance) {
          await new Promise((resolve) => setTimeout(resolve, 900));
          if (!cancelledRef.current && narrationIdRef.current === narrationId) {
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
    paused,
    replayNonce,
    running,
    segmentIndex,
    stepIndex,
    usingOpenAiVoice,
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

        <p className="vs-tour-body">{segment.text}</p>

        {segment.benefit ? (
          <div className="vs-tour-benefits">
            <div className="vs-tour-benefit">{segment.benefit}</div>
          </div>
        ) : null}

        <p className="vs-tour-disclosure">
          Voice narration is AI-generated. Status: {voiceStatus}
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
            onClick={() => setUsingOpenAiVoice((value) => !value)}
          >
            {usingOpenAiVoice ? "Nova Voice" : "Browser Voice"}
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

