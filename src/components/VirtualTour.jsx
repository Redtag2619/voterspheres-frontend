import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "https://voterspheres-backend-2pap.onrender.com";

const ROUTE_WAIT_MS = 900;
const TARGET_TIMEOUT_MS = 9000;
const TARGET_POLL_MS = 120;
const AFTER_SCROLL_MS = 650;
const BETWEEN_STEPS_MS = 550;

const TOUR_STEPS = [
  {
    route: "/executive-workspace",
    page: "Executive Workspace",
    section: "Command Home",
    heading: "Executive command view",
    label: "Command value",
    target: {
      dataTour: "workspace-command",
      selector: ".workspace-command-card, main",
      headingText: ["Executive Workspace", "Workspace Command View"],
    },
    narration:
      "We begin in the Executive Workspace, the operating home for VoterSpheres. This view brings political intelligence, operations, CRM activity, revenue, reports, and next actions into one executive command surface.",
    value:
      "Leadership gets one place to understand what is happening, what is at risk, and what needs action next.",
  },
  {
    route: "/executive-workspace",
    page: "Executive Workspace",
    section: "Command Home",
    heading: "Operating KPIs",
    label: "Decision support",
    target: {
      dataTour: "workspace-kpis",
      selector: ".vs-grid-4, .workspace-status-grid",
      headingText: ["Workspace Readiness", "Launch Score", "Pressure Score", "Pipeline"],
    },
    narration:
      "The operating indicators summarize readiness, pressure, launch posture, and opportunity pipeline. They turn the workspace into a daily leadership screen rather than a static dashboard.",
    value:
      "Campaign teams can scan the health of the operation in seconds before deciding where to focus.",
  },
  {
    route: "/executive-workspace",
    page: "Executive Workspace",
    section: "Command Home",
    heading: "Guided actions",
    label: "Workflow advantage",
    target: {
      dataTour: "workspace-actions",
      selector: ".workspace-actions, a[href*='tour'], button",
      headingText: ["Start Guided Tour", "Admin Tour", "Universal Search"],
    },
    narration:
      "The action area moves users directly into intelligence, operations, revenue, universal search, and the guided demo. Every major signal should have a path into the workflow.",
    value:
      "This turns the workspace into an execution launchpad instead of just an overview page.",
  },
  {
    route: "/map",
    page: "Election Map",
    section: "Election Geography",
    heading: "Map filters",
    label: "Targeting control",
    target: {
      dataTour: "map-filters",
      selector: "select, .vs-select",
      headingText: ["Map Filters"],
    },
    narration:
      "The Election Map starts with filters for state and office. These controls let users move from a national view into the races and geographies that matter most.",
    value:
      "Consultants can quickly focus on the state, office, or race environment they need to evaluate.",
  },
  {
    route: "/map",
    page: "Election Map",
    section: "Election Geography",
    heading: "U.S. finance overlay map",
    label: "Geographic intelligence",
    target: {
      dataTour: "election-map-us",
      selector: ".rsm-svg, svg, .vs-section-card",
      headingText: ["U.S. Finance Overlay Map"],
    },
    narration:
      "The U.S. Finance Overlay Map translates campaign finance intensity into a geographic operating view. It shows where fundraising signals are strongest across the country.",
    value:
      "Finance pressure becomes visible by geography instead of being buried in spreadsheets or raw records.",
  },
  {
    route: "/map",
    page: "Election Map",
    section: "Election Geography",
    heading: "Candidate field",
    label: "Candidate comparison",
    target: {
      dataTour: "election-map-candidates",
      selector: ".vs-stack, .vs-table, table",
      headingText: ["Candidates"],
    },
    narration:
      "The candidate panel shows the selected state and office field. Users can compare receipts, cash on hand, party, rank, and campaign standing in the context of the selected overlay.",
    value:
      "This connects the map directly to candidate-level campaign intelligence.",
  },
  {
    route: "/map",
    page: "Election Map",
    section: "Election Geography",
    heading: "Donor intelligence",
    label: "Finance relationship layer",
    target: {
      dataTour: "election-map-donors",
      selector: ".vs-stack, .vs-card",
      headingText: ["Donor Intelligence"],
    },
    narration:
      "Donor Intelligence connects candidate context to donor network matches. This helps explain the money behind the signal, not just the amount raised.",
    value:
      "Users can move from where money is showing up to who may be driving it.",
  },
  {
    route: "/map",
    page: "Election Map",
    section: "Election Geography",
    heading: "Overlay detail",
    label: "Race prioritization",
    target: {
      dataTour: "election-map-overlay-detail",
      selector: ".vs-stack, .vs-section-card",
      headingText: ["Office Overlays", "Overlay Detail", "Overlay Stack"],
    },
    narration:
      "Overlay Detail ranks state and office combinations by score, tier, receipts, and cash. It helps users decide which race deserves deeper attention.",
    value:
      "The map becomes a prioritization system instead of only a visual display.",
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
      "This helps teams move from reviewing intelligence to making a decision.",
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
      headingText: ["Execution Board"],
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
    route: "/operations-map",
    page: "Executive Operations Map",
    section: "Operational Coverage",
    heading: "Operational map",
    label: "Coverage view",
    target: {
      dataTour: "operations-map",
      selector: ".map, svg, canvas, .leaflet-container, main",
      headingText: ["Executive Operations Map", "Operations Map"],
    },
    narration:
      "The Executive Operations Map shows campaign infrastructure, geographic coverage, activity concentration, vendor gaps, and execution pressure.",
    value:
      "Operational weaknesses become visible before they become execution problems.",
  },
  {
    route: "/vendors",
    page: "Vendor Network",
    section: "Operational Partners",
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
    route: "/vendors",
    page: "Vendor Network",
    section: "Operational Partners",
    heading: "Vendor list",
    label: "Operational sourcing",
    target: {
      dataTour: "vendor-list",
      selector: "table, .vs-table, .vendor-list, main",
      headingText: ["Vendor", "Coverage"],
    },
    narration:
      "The vendor list helps users find operational partners for mail, digital, field, data, consulting, and other campaign needs.",
    value:
      "Vendor search becomes a structured operating workflow.",
  },
  {
    route: "/opportunity-engine",
    page: "Opportunity Engine",
    section: "Consultant Growth",
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
    route: "/intelligence-reports",
    page: "Intelligence Reports",
    section: "Deliverables",
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

  const selectors =
    "h1,h2,h3,h4,.vs-section-title,.vs-stat-label,.vs-row-title,.vs-kicker,strong,button,a,label";

  const nodes = Array.from(document.querySelectorAll(selectors));
  for (const node of nodes) {
    if (!isVisible(node)) continue;
    if (elementContainsAnyText(node, terms)) {
      const container = nearestTourContainer(node);
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
  const pad = 10;

  return {
    top: Math.max(10, rect.top - pad),
    left: Math.max(10, rect.left - pad),
    width: Math.min(window.innerWidth - 20, rect.width + pad * 2),
    height: Math.min(window.innerHeight - 20, rect.height + pad * 2),
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
          await sleep(ROUTE_WAIT_MS);
        } else {
          await sleep(250);
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

        await sleep(AFTER_SCROLL_MS);

        if (cancelledRef.current || runIdRef.current !== runId) return;

        setSpotlightRect(getSpotlightRect(target));

        await sleep(250);

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
            Nova navigates the site, centers the section, highlights it, then explains the benefit. Status: {voiceStatus}
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

