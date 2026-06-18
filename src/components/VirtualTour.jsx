import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";

const TOUR_STORAGE_KEY = "vs_virtual_tour_state";

const publicTourSteps = [
  {
    key: "intro",
    route: "/executive-workspace",
    title: "Welcome to VoterSpheres",
    focus: "Platform Overview",
    body:
      "Welcome to VoterSpheres. This guided demo shows how the platform helps political consultants move from intelligence to action. We will visit the major workspaces, explain what each page does, and show the business value behind each tool.",
    benefits: [
      "Connects political intelligence, operations, CRM, revenue, and reporting.",
      "Helps consultants identify opportunities and act faster.",
      "Turns scattered campaign data into one executive command system.",
    ],
  },
  {
    key: "executive_workspace",
    route: "/executive-workspace",
    title: "Executive Workspace",
    focus: "Command Home",
    body:
      "The Executive Workspace is the main operating home. It brings together intelligence, tasks, CRM activity, revenue, reports, alerts, and opportunity routing into one command view. This is where a consultant starts the day and decides what needs attention first.",
    benefits: [
      "Shows overall workspace health and pressure signals.",
      "Surfaces the next best actions for the consultant team.",
      "Connects every major VoterSpheres workflow from one screen.",
    ],
  },
  {
    key: "political_intelligence",
    route: "/political-intelligence",
    title: "Political Intelligence Graph",
    focus: "Influence and Relationships",
    body:
      "The Political Intelligence Graph helps users understand relationships between candidates, committees, donors, consultants, organizations, and political signals. It turns disconnected records into a strategic relationship map.",
    benefits: [
      "Reveals influence paths and campaign ecosystems.",
      "Helps identify strategic relationships and risk clusters.",
      "Supports deeper research before outreach or engagement.",
    ],
  },
  {
    key: "candidates",
    route: "/candidates",
    title: "Candidate Intelligence",
    focus: "Candidate Research",
    body:
      "Candidate Intelligence centralizes candidate profiles, offices, states, parties, election cycles, campaign status, contact details, and FEC-linked records. It gives consultants a structured way to research campaigns and find prospects.",
    benefits: [
      "Creates a searchable candidate intelligence database.",
      "Supports campaign targeting and prospect discovery.",
      "Links candidate profiles with fundraising and operational context.",
    ],
  },
  {
    key: "map",
    route: "/map",
    title: "Election Map",
    focus: "Geographic Race View",
    body:
      "The Election Map provides a geographic view of races, states, candidates, districts, and political movement. It helps users understand where campaign activity is concentrated and where opportunities may be emerging.",
    benefits: [
      "Turns election data into a state-by-state visual workflow.",
      "Helps consultants identify geographic priorities.",
      "Makes statewide and regional campaign analysis easier to explain.",
    ],
  },
  {
    key: "operations_map",
    route: "/operations-map",
    title: "Executive Operations Map",
    focus: "Operational Coverage",
    body:
      "The Executive Operations Map shows campaign infrastructure, operational coverage, state pressure, vendor reach, and activity density across the country. It helps leadership see where execution capacity is strong and where gaps remain.",
    benefits: [
      "Visualizes campaign operations across states.",
      "Identifies coverage gaps and priority markets.",
      "Connects map intelligence to vendor and task workflows.",
    ],
  },
  {
    key: "donors",
    route: "/donors",
    title: "Donor Network",
    focus: "Fundraising Relationships",
    body:
      "The Donor Network helps users understand donor relationships, funding patterns, finance influence, and contribution clusters. It supports fundraising research and strategic donor mapping.",
    benefits: [
      "Shows how money moves across political networks.",
      "Supports donor research and relationship planning.",
      "Helps consultants identify finance signals that matter.",
    ],
  },
  {
    key: "fundraising",
    route: "/fundraising",
    title: "Fundraising Dashboard",
    focus: "Campaign Money Intelligence",
    body:
      "The Fundraising Dashboard tracks finance leaders, fundraising momentum, and FEC-linked records. It helps users compare campaigns and spot financial strength or vulnerability.",
    benefits: [
      "Highlights fundraising leaders and momentum shifts.",
      "Connects FEC data to campaign intelligence.",
      "Supports consultant prospecting and competitive analysis.",
    ],
  },
  {
    key: "vendors",
    route: "/vendors",
    title: "Vendor Network",
    focus: "Operational Partners",
    body:
      "Vendor Network helps campaigns and consultants find operational partners across direct mail, digital, data, field, consulting, production, and analytics. It also helps identify coverage gaps by state and category.",
    benefits: [
      "Makes vendor discovery easier and more structured.",
      "Supports state and category coverage planning.",
      "Turns vendor gaps into actionable operational tasks.",
    ],
  },
  {
    key: "command_center",
    route: "/command-center",
    title: "Command Center",
    focus: "Execution and Ownership",
    body:
      "The Command Center turns intelligence into execution. It organizes tasks, priorities, ownership, escalations, and cross-signal actions so teams can follow through quickly.",
    benefits: [
      "Converts intelligence signals into action items.",
      "Tracks ownership and operational follow-through.",
      "Helps teams move from strategy to execution.",
    ],
  },
  {
    key: "crm",
    route: "/campaign-crm",
    title: "Campaign CRM",
    focus: "Relationships and Follow-Up",
    body:
      "Campaign CRM helps manage contacts, organizations, activities, follow-ups, and relationship history. It gives consultants a place to convert opportunities into real client development activity.",
    benefits: [
      "Organizes campaign contacts and organizations.",
      "Connects opportunity discovery to follow-up workflow.",
      "Helps consultants manage relationships over time.",
    ],
  },
  {
    key: "opportunity_engine",
    route: "/opportunity-engine",
    title: "Opportunity Engine",
    focus: "Prospecting and Growth",
    body:
      "The Opportunity Engine scores campaign and consulting opportunities. It helps users identify hot prospects, create CRM contacts, and route follow-up tasks into the operating system.",
    benefits: [
      "Prioritizes the best campaign opportunities.",
      "Supports consultant sales and business development.",
      "Turns data signals into CRM and task actions.",
    ],
  },
  {
    key: "reports",
    route: "/intelligence-reports",
    title: "Intelligence Reports",
    focus: "Strategic Deliverables",
    body:
      "Intelligence Reports convert platform data into strategic deliverables. Consultants can use reports for internal strategy, client updates, campaign planning, and executive briefings.",
    benefits: [
      "Turns raw data into client-ready strategy.",
      "Supports campaign briefings and consulting deliverables.",
      "Creates a bridge between intelligence and presentation.",
    ],
  },
  {
    key: "business_suite",
    route: "/business-suite",
    title: "Consultant Business Suite",
    focus: "Firm Operations",
    body:
      "The Consultant Business Suite helps manage clients, retainers, invoices, projects, revenue records, and business operations. It connects political work to the business side of a consulting firm.",
    benefits: [
      "Tracks clients and consulting revenue workflows.",
      "Connects campaign activity with firm operations.",
      "Helps consultants manage growth and delivery.",
    ],
  },
  {
    key: "search",
    route: "/search",
    title: "Universal Search",
    focus: "Find Anything Fast",
    body:
      "Universal Search lets users search across candidates, vendors, reports, tasks, clients, signals, and workspaces. It is the fastest way to locate records across the platform.",
    benefits: [
      "Reduces time spent hunting across modules.",
      "Supports fast research and workflow navigation.",
      "Makes VoterSpheres feel like one connected system.",
    ],
  },
  {
    key: "complete",
    route: "/executive-workspace",
    title: "Tour Complete",
    focus: "Ready to Operate",
    body:
      "You have completed the VoterSpheres guided product demo. The platform is designed to help political consultants discover opportunities, understand political movement, manage campaign operations, and grow their consulting business from one executive workspace.",
    benefits: [
      "Start in Executive Workspace each day.",
      "Use intelligence pages for discovery and research.",
      "Use CRM, Command Center, Reports, and Business Suite to act on what you find.",
    ],
  },
];

const adminTourSteps = [
  {
    key: "admin_intro",
    route: "/launch-readiness",
    title: "Admin Tour",
    focus: "Internal Launch Controls",
    body:
      "This admin tour is for platform operators. It covers launch readiness, production hardening, live data freshness, quality assurance, automation, and deployment controls.",
    benefits: [
      "Validates whether the platform is ready for public use.",
      "Shows which systems need review before launch.",
      "Keeps internal launch operations separate from the public product demo.",
    ],
  },
  {
    key: "launch_readiness",
    route: "/launch-readiness",
    title: "Launch Readiness",
    focus: "Final Launch Gate",
    body:
      "Launch Readiness combines production hardening, QA, live intelligence, KPI risk, Opportunity Engine status, and workspace readiness into one launch decision layer.",
    benefits: [
      "Shows whether the platform is ready to launch.",
      "Separates blockers from review items.",
      "Gives the developer a final operating checklist.",
    ],
  },
  {
    key: "production_hardening",
    route: "/production-hardening",
    title: "Production Hardening",
    focus: "Infrastructure and Security",
    body:
      "Production Hardening checks database connectivity, environment variables, security settings, billing configuration, live data records, alerting, and workflow readiness.",
    benefits: [
      "Protects the production deployment.",
      "Surfaces missing environment or security configuration.",
      "Confirms that critical backend systems are present.",
    ],
  },
  {
    key: "launch_qa",
    route: "/launch-qa",
    title: "Launch QA",
    focus: "Smoke Testing",
    body:
      "Launch QA checks whether core routes, authentication, billing, data feeds, reports, CRM, alerts, and task workflows are responding as expected.",
    benefits: [
      "Catches broken routes before users see them.",
      "Confirms major product workflows are connected.",
      "Gives operators a quick pre-launch smoke test.",
    ],
  },
  {
    key: "live_intelligence",
    route: "/live-intelligence-layer",
    title: "Live Intelligence Layer",
    focus: "Feed Freshness",
    body:
      "The Live Intelligence Layer monitors candidate, FEC, signal, vendor, CRM, report, alert, workspace, and revenue feed health.",
    benefits: [
      "Shows stale, missing, and healthy data sources.",
      "Helps prevent demo data from appearing launch-ready.",
      "Confirms core product intelligence is fresh.",
    ],
  },
  {
    key: "launch_automation",
    route: "/launch-automation",
    title: "Launch Automation",
    focus: "Automated Checks",
    body:
      "Launch Automation coordinates readiness tasks and operational checks so the team can monitor launch health without manually opening every page.",
    benefits: [
      "Reduces manual launch review work.",
      "Keeps readiness workflows repeatable.",
      "Creates a bridge between launch checks and ongoing operations.",
    ],
  },
];

function safeWindow() {
  return typeof window !== "undefined" ? window : null;
}

function getPreferredVoice() {
  const win = safeWindow();
  if (!win?.speechSynthesis) return null;

  const voices = win.speechSynthesis.getVoices?.() || [];
  if (!voices.length) return null;

  const preferredNames = [
    "Microsoft Aria",
    "Microsoft Jenny",
    "Microsoft Ava",
    "Microsoft Emma",
    "Google US English",
    "Google UK English Female",
    "Samantha",
    "Victoria",
    "Karen",
    "Moira",
    "Serena",
    "Tessa",
    "Zira",
  ];

  return (
    voices.find((voice) =>
      preferredNames.some((name) => voice.name.toLowerCase().includes(name.toLowerCase()))
    ) ||
    voices.find((voice) =>
      /female|woman|aria|jenny|ava|emma|samantha|victoria|karen|moira|serena|tessa|zira/i.test(
        `${voice.name} ${voice.lang}`
      )
    ) ||
    voices.find((voice) => /^en[-_]/i.test(voice.lang)) ||
    voices[0]
  );
}

function loadVoices() {
  const win = safeWindow();
  if (!win?.speechSynthesis) return Promise.resolve([]);

  const currentVoices = win.speechSynthesis.getVoices?.() || [];
  if (currentVoices.length) return Promise.resolve(currentVoices);

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      resolve(win.speechSynthesis.getVoices?.() || []);
    }, 600);

    win.speechSynthesis.onvoiceschanged = () => {
      clearTimeout(timeout);
      resolve(win.speechSynthesis.getVoices?.() || []);
    };
  });
}

function estimateDuration(text) {
  const words = String(text || "").trim().split(/\s+/).filter(Boolean).length;
  return Math.min(22000, Math.max(7000, words * 420));
}

async function speak(text, enabled, onEnd) {
  const win = safeWindow();
  if (!enabled || !win?.speechSynthesis) {
    window.setTimeout(() => onEnd?.(), estimateDuration(text));
    return;
  }

  await loadVoices();
  win.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  const voice = getPreferredVoice();

  if (voice) utterance.voice = voice;

  utterance.lang = voice?.lang || "en-US";
  utterance.rate = 0.9;
  utterance.pitch = 1.03;
  utterance.volume = 1;

  let finished = false;
  const fallbackTimer = window.setTimeout(() => {
    if (finished) return;
    finished = true;
    onEnd?.();
  }, estimateDuration(text));

  utterance.onend = () => {
    if (finished) return;
    finished = true;
    window.clearTimeout(fallbackTimer);
    onEnd?.();
  };

  utterance.onerror = () => {
    if (finished) return;
    finished = true;
    window.clearTimeout(fallbackTimer);
    onEnd?.();
  };

  win.speechSynthesis.speak(utterance);
}

function makeNarration(step) {
  const benefits = Array.isArray(step.benefits) && step.benefits.length
    ? ` Key benefits: ${step.benefits.join(" ")}`
    : "";

  return `${step.title}. ${step.body}${benefits}`;
}

export default function VirtualTour() {
  const navigate = useNavigate();
  const location = useLocation();
  const [index, setIndex] = useState(0);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [mode, setMode] = useState("platform");
  const timerRef = useRef(null);
  const hasStartedRef = useRef(false);

  const steps = useMemo(() => (mode === "admin" ? adminTourSteps : publicTourSteps), [mode]);
  const step = steps[index];

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const stopSpeech = useCallback(() => {
    safeWindow()?.speechSynthesis?.cancel?.();
  }, []);

  const closeTour = useCallback(() => {
    clearTimer();
    stopSpeech();
    setRunning(false);
    setPaused(false);
    hasStartedRef.current = false;
    window.sessionStorage.removeItem(TOUR_STORAGE_KEY);

    const params = new URLSearchParams(location.search);
    if (params.has("tour")) {
      params.delete("tour");
      const nextSearch = params.toString();
      navigate(`${location.pathname}${nextSearch ? `?${nextSearch}` : ""}`, { replace: true });
    }
  }, [clearTimer, location.pathname, location.search, navigate, stopSpeech]);

  const goToIndex = useCallback(
    (nextIndex) => {
      clearTimer();
      stopSpeech();
      setIndex(Math.max(0, Math.min(steps.length - 1, nextIndex)));
    },
    [clearTimer, stopSpeech, steps.length]
  );

  const goNext = useCallback(() => {
    if (index >= steps.length - 1) {
      closeTour();
      return;
    }
    goToIndex(index + 1);
  }, [closeTour, goToIndex, index, steps.length]);

  const goBack = useCallback(() => {
    goToIndex(index - 1);
  }, [goToIndex, index]);

  const replay = useCallback(() => {
    if (!step) return;
    clearTimer();
    stopSpeech();
    speak(makeNarration(step), voiceEnabled);
  }, [clearTimer, step, stopSpeech, voiceEnabled]);

  useEffect(() => {
    return () => {
      clearTimer();
      stopSpeech();
    };
  }, [clearTimer, stopSpeech]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const requestedTour = params.get("tour");

    if (!requestedTour) return;

    const nextMode = requestedTour === "admin" ? "admin" : "platform";
    const currentKey = `${nextMode}:${location.pathname}:${location.search}`;
    const priorKey = window.sessionStorage.getItem(TOUR_STORAGE_KEY);

    setMode(nextMode);

    if (!running || priorKey !== currentKey) {
      window.sessionStorage.setItem(TOUR_STORAGE_KEY, currentKey);
      hasStartedRef.current = false;
      setIndex(0);
      setPaused(false);
      setRunning(true);
    }
  }, [location.pathname, location.search, running]);

  useEffect(() => {
    if (!running || !step) return;

    const currentPath = location.pathname;
    if (currentPath !== step.route) {
      navigate(step.route, { replace: false });
      return;
    }

    if (paused) return;

    clearTimer();
    stopSpeech();

    hasStartedRef.current = true;
    speak(makeNarration(step), voiceEnabled, () => {
      if (!autoAdvance || paused) return;
      timerRef.current = window.setTimeout(() => {
        setIndex((current) => {
          if (current >= steps.length - 1) return current;
          return current + 1;
        });
      }, 1200);
    });
  }, [autoAdvance, clearTimer, location.pathname, navigate, paused, running, step, steps.length, stopSpeech, voiceEnabled]);

  if (!running || !step) return null;

  const progress = Math.round(((index + 1) / steps.length) * 100);

  const tourCard = (
    <div className="vs-tour-backdrop">
      <section className="vs-tour-card" role="dialog" aria-modal="true">
        <div className="vs-tour-progress">
          <span style={{ width: `${progress}%` }} />
        </div>

        <div className="vs-tour-header">
          <div>
            <p className="vs-kicker">{mode === "admin" ? "Admin Guided Tour" : "Interactive Product Demo"}</p>
            <h2>{step.title}</h2>
          </div>

          <button className="vs-tour-close" onClick={closeTour} aria-label="Close tour">
            ×
          </button>
        </div>

        <div className="vs-tour-focus">Focus: {step.focus}</div>
        <p className="vs-tour-body">{step.body}</p>

        {Array.isArray(step.benefits) && step.benefits.length ? (
          <div className="vs-tour-benefits">
            {step.benefits.map((benefit) => (
              <div key={benefit} className="vs-tour-benefit">
                <span>✓</span>
                <p>{benefit}</p>
              </div>
            ))}
          </div>
        ) : null}

        <div className="vs-tour-meta">
          Step {index + 1} of {steps.length} • {progress}% • {autoAdvance ? "Auto advance" : "Manual"} • {voiceEnabled ? "Voice on" : "Voice off"}
        </div>

        <div className="vs-tour-actions">
          <button className="vs-button vs-button-secondary" onClick={goBack} disabled={index === 0}>
            Back
          </button>

          <button
            className="vs-button vs-button-secondary"
            onClick={() => {
              clearTimer();
              stopSpeech();
              setPaused((value) => !value);
            }}
          >
            {paused ? "Resume" : "Pause"}
          </button>

          <button className="vs-button vs-button-secondary" onClick={() => setVoiceEnabled((value) => !value)}>
            Voice {voiceEnabled ? "On" : "Off"}
          </button>

          <button className="vs-button vs-button-secondary" onClick={() => setAutoAdvance((value) => !value)}>
            Auto {autoAdvance ? "On" : "Off"}
          </button>

          <button className="vs-button vs-button-secondary" onClick={replay}>
            Replay
          </button>

          <button className="vs-button" onClick={goNext}>
            {index >= steps.length - 1 ? "Finish" : "Next"}
          </button>
        </div>

        <div className="vs-tour-note">
          For the most natural voice, use Microsoft Edge or Chrome with Microsoft Aria, Jenny, Ava, Samantha, or another premium system voice installed. Browser voices vary by device.
        </div>
      </section>
    </div>
  );

  return createPortal(tourCard, document.body);
}
