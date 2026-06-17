import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";

const publicTourSteps = [
  {
    route: "/executive-workspace",
    title: "Welcome to VoterSpheres",
    body:
      "Welcome to VoterSpheres. This platform brings political intelligence, campaign operations, candidate research, fundraising analysis, vendor management, and consulting business tools into one command system.",
  },
  {
    route: "/executive-workspace",
    title: "Executive Workspace",
    body:
      "The Executive Workspace is your command home. It gives you a high-level view of intelligence, CRM activity, operational tasks, revenue performance, reports, opportunities, and action routing.",
  },
  {
    route: "/political-intelligence",
    title: "Political Intelligence",
    body:
      "Political Intelligence helps you identify risks, opportunities, influence patterns, signal clusters, and relationships across candidates, donors, consultants, campaigns, and organizations.",
  },
  {
    route: "/map",
    title: "Election Map",
    body:
      "The Election Map gives you a geographic view of election activity. Use it to explore states, races, candidates, districts, and political movement across the country.",
  },
  {
    route: "/operations-map",
    title: "Executive Operations Map",
    body:
      "The Executive Operations Map shows operational coverage, campaign infrastructure, activity density, and strategic movement across the United States.",
  },
  {
    route: "/candidates",
    title: "Candidate Intelligence",
    body:
      "Candidate Intelligence centralizes candidate profiles, state and office data, party information, FEC linkage, campaign status, contact intelligence, and readiness indicators.",
  },
  {
    route: "/donors",
    title: "Donor Network",
    body:
      "The Donor Network helps you understand fundraising relationships, contribution patterns, donor clusters, and political finance influence.",
  },
  {
    route: "/fundraising",
    title: "Fundraising Dashboard",
    body:
      "The Fundraising Dashboard tracks finance leaders, fundraising momentum, FEC-linked records, and money movement across campaigns.",
  },
  {
    route: "/vendors",
    title: "Vendor Network",
    body:
      "Vendor Network helps campaigns and consultants identify operational partners across direct mail, digital, data, field, consulting, and production services.",
  },
  {
    route: "/campaign-crm",
    title: "Campaign CRM",
    body:
      "Campaign CRM helps manage contacts, organizations, follow-ups, relationship history, and client development activity.",
  },
  {
    route: "/opportunity-engine",
    title: "Opportunity Engine",
    body:
      "The Opportunity Engine scores campaign and consulting opportunities, identifies high-value prospects, and routes follow-up actions into CRM and task workflows.",
  },
  {
    route: "/intelligence-reports",
    title: "Intelligence Reports",
    body:
      "Intelligence Reports turn platform data into strategic deliverables for campaigns, clients, consultants, and leadership teams.",
  },
  {
    route: "/business-suite",
    title: "Consultant Business Suite",
    body:
      "The Consultant Business Suite helps manage clients, retainers, invoices, revenue workflows, and consulting business operations.",
  },
  {
    route: "/search",
    title: "Universal Search",
    body:
      "Universal Search lets you search across candidates, reports, vendors, clients, tasks, political signals, and workspaces from one place.",
  },
  {
    route: "/command-center",
    title: "Command Center",
    body:
      "The Command Center turns intelligence into execution by organizing priorities, tasks, ownership, and operational follow-through.",
  },
  {
    route: "/executive-workspace",
    title: "Tour Complete",
    body:
      "You have completed the VoterSpheres platform tour. You are ready to use VoterSpheres as a political intelligence, campaign operations, and consulting growth platform.",
  },
];

const adminTourSteps = [
  {
    route: "/launch-readiness",
    title: "Platform Administration Tour",
    body:
      "This internal tour covers launch readiness, production hardening, live data health, automation, quality assurance, and administrative controls.",
  },
  {
    route: "/launch-readiness",
    title: "Launch Readiness",
    body:
      "Launch Readiness combines system gates into a final executive decision layer for platform launch status.",
  },
  {
    route: "/production-hardening",
    title: "Production Hardening",
    body:
      "Production Hardening validates environment variables, security, billing, database readiness, workflows, and deployment blockers.",
  },
  {
    route: "/launch-qa",
    title: "Launch QA",
    body:
      "Launch QA verifies core routes, API health, authentication, billing, data, reports, alerts, and workflow smoke tests.",
  },
  {
    route: "/live-intelligence-layer",
    title: "Live Intelligence Layer",
    body:
      "The Live Intelligence Layer monitors freshness and availability of candidate, FEC, signal, vendor, CRM, report, alert, workspace, and revenue feeds.",
  },
  {
    route: "/launch-automation",
    title: "Launch Automation",
    body:
      "Launch Automation runs pre-launch checks and coordinates readiness signals across the platform.",
  },
];

function getPreferredVoice() {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;

  const voices = window.speechSynthesis.getVoices?.() || [];

  const preferred =
    voices.find((voice) =>
      /Microsoft Aria|Microsoft Jenny|Google US English|Samantha|Victoria|Karen|Moira|Serena|Tessa|Zira/i.test(
        `${voice.name} ${voice.lang}`
      )
    ) ||
    voices.find((voice) =>
      /female|woman|aria|jenny|samantha|victoria|karen|serena|zira/i.test(
        `${voice.name} ${voice.lang}`
      )
    ) ||
    voices.find((voice) => /^en[-_]/i.test(voice.lang)) ||
    voices[0];

  return preferred || null;
}

function speak(text, enabled, onEnd) {
  if (!enabled || typeof window === "undefined" || !window.speechSynthesis) {
    onEnd?.();
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  const voice = getPreferredVoice();

  if (voice) utterance.voice = voice;

  utterance.rate = 0.88;
  utterance.pitch = 1.04;
  utterance.volume = 1;

  utterance.onend = () => onEnd?.();
  utterance.onerror = () => onEnd?.();

  window.speechSynthesis.speak(utterance);
}

export default function VirtualTour({ mode = "public" }) {
  const navigate = useNavigate();
  const steps = useMemo(
    () => (mode === "admin" ? adminTourSteps : publicTourSteps),
    [mode]
  );

  const [index, setIndex] = useState(0);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [running, setRunning] = useState(true);
  const autoTimerRef = useRef(null);

  const step = steps[index];

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel?.();
      if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!running || !step) return;

    if (autoTimerRef.current) clearTimeout(autoTimerRef.current);

    navigate(step.route);

    speak(`${step.title}. ${step.body}`, voiceEnabled, () => {
      if (!autoAdvance) return;

      autoTimerRef.current = setTimeout(() => {
        setIndex((current) => {
          if (current >= steps.length - 1) return current;
          return current + 1;
        });
      }, 1200);
    });
  }, [index, running, step, navigate, voiceEnabled, autoAdvance, steps.length]);

  if (!running || !step) return null;

  const progress = Math.round(((index + 1) / steps.length) * 100);

  function stopTour() {
    setRunning(false);
    window.speechSynthesis?.cancel?.();
    if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
  }

  function goBack() {
    window.speechSynthesis?.cancel?.();
    if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
    setIndex((value) => Math.max(0, value - 1));
  }

  function goNext() {
    window.speechSynthesis?.cancel?.();
    if (autoTimerRef.current) clearTimeout(autoTimerRef.current);

    if (index >= steps.length - 1) {
      stopTour();
      return;
    }

    setIndex((value) => value + 1);
  }

  function replay() {
    if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
    speak(`${step.title}. ${step.body}`, voiceEnabled);
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
              {mode === "admin" ? "Admin Tour" : "Platform Tour"}
            </p>
            <h2>{step.title}</h2>
          </div>

          <button className="vs-tour-close" onClick={stopTour} aria-label="Close tour">
            ×
          </button>
        </div>

        <p className="vs-tour-body">{step.body}</p>

        <div className="vs-tour-meta">
          Step {index + 1} of {steps.length} • {progress}% •{" "}
          {autoAdvance ? "Auto tour on" : "Manual mode"}
        </div>

        <div className="vs-tour-actions">
          <button
            className="vs-button vs-button-secondary"
            onClick={goBack}
            disabled={index === 0}
          >
            Back
          </button>

          <button
            className="vs-button vs-button-secondary"
            onClick={() => setVoiceEnabled((value) => !value)}
          >
            Voice {voiceEnabled ? "On" : "Off"}
          </button>

          <button
            className="vs-button vs-button-secondary"
            onClick={() => setAutoAdvance((value) => !value)}
          >
            Auto {autoAdvance ? "On" : "Off"}
          </button>

          <button className="vs-button vs-button-secondary" onClick={replay}>
            Replay
          </button>

          <button className="vs-button" onClick={goNext}>
            {index >= steps.length - 1 ? "Finish Tour" : "Next"}
          </button>
        </div>
      </section>
    </div>
  );

  return createPortal(tourCard, document.body);
}