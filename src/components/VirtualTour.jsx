import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const publicTourSteps = [
  { route: "/executive-workspace", title: "Welcome to VoterSpheres", body: "VoterSpheres combines political intelligence, campaign operations, candidate research, fundraising analysis, vendor management, and consulting business tools into one operating platform." },
  { route: "/executive-workspace", title: "Executive Workspace", body: "This is your command home for political intelligence, campaign CRM, operational tasks, vendor coverage, revenue activity, opportunity tracking, and executive reports." },
  { route: "/political-intelligence", title: "Political Intelligence", body: "Political Intelligence helps identify emerging risks, influence patterns, signal clusters, and campaign opportunities." },
  { route: "/map", title: "Election Map", body: "The Election Map gives you a geographic view of election activity, candidates, races, and state-level political movement." },
  { route: "/operations-map", title: "Executive Operations Map", body: "The Executive Operations Map shows campaign infrastructure, workspace activity, operational coverage, and strategic activity across the country." },
  { route: "/candidates", title: "Candidate Intelligence", body: "Candidate Intelligence centralizes candidate profiles, offices, states, party information, FEC linkage, contact intelligence, and readiness scoring." },
  { route: "/donors", title: "Donor Network", body: "The Donor Network helps you understand fundraising relationships, contribution patterns, donor clusters, and political finance influence." },
  { route: "/fundraising", title: "Fundraising Dashboard", body: "The Fundraising Dashboard tracks finance leaders, fundraising momentum, FEC-linked records, and money movement across campaigns." },
  { route: "/vendors", title: "Vendor Network", body: "Vendor Network helps campaigns and consultants identify operational partners across direct mail, digital, data, field, consulting, and production services." },
  { route: "/campaign-crm", title: "Campaign CRM", body: "Campaign CRM helps manage relationships, organizations, contacts, follow-ups, and client development activity." },
  { route: "/opportunity-engine", title: "Opportunity Engine", body: "The Opportunity Engine scores campaign opportunities, identifies high-value prospects, and routes follow-up actions into CRM and task workflows." },
  { route: "/intelligence-reports", title: "Intelligence Reports", body: "Intelligence Reports convert platform data into strategic deliverables for campaigns, clients, consultants, and leadership teams." },
  { route: "/business-suite", title: "Consultant Business Suite", body: "The Business Suite helps manage clients, revenue, retainers, invoices, projects, and consulting operations." },
  { route: "/search", title: "Universal Search", body: "Universal Search lets you search across candidates, reports, vendors, clients, tasks, signals, and workspaces from one place." },
  { route: "/command-center", title: "Command Center", body: "The Command Center turns intelligence into execution by organizing tasks, priorities, ownership, and operational follow-through." },
  { route: "/executive-workspace", title: "Tour Complete", body: "You are ready to use VoterSpheres as a political intelligence, campaign operations, and consulting growth platform." },
];

const adminTourSteps = [
  { route: "/launch-readiness", title: "Platform Administration Tour", body: "This internal tour covers launch readiness, production hardening, live data health, automation, QA, and administrative platform controls." },
  { route: "/launch-readiness", title: "Launch Readiness", body: "Launch Readiness combines major system gates into a final executive launch decision." },
  { route: "/production-hardening", title: "Production Hardening", body: "Production Hardening validates environment variables, security, billing, database readiness, workflows, and deployment blockers." },
  { route: "/launch-qa", title: "Launch QA", body: "Launch QA verifies core routes, API health, authentication, billing, data, reports, alerts, and workflow smoke tests." },
  { route: "/live-intelligence-layer", title: "Live Intelligence Layer", body: "The Live Intelligence Layer monitors freshness and availability of candidate, FEC, signal, vendor, CRM, report, alert, workspace, and revenue feeds." },
  { route: "/launch-automation", title: "Launch Automation", body: "Launch Automation runs pre-launch checks and coordinates readiness signals across the platform." },
];

function getPreferredVoice() {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices?.() || [];
  return voices.find((voice) => /neutral|alex|samantha|google/i.test(`${voice.name} ${voice.lang}`)) || voices.find((voice) => /en/i.test(voice.lang)) || voices[0] || null;
}

function speak(text, enabled) {
  if (!enabled || typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  const voice = getPreferredVoice();
  if (voice) utterance.voice = voice;
  utterance.rate = 0.92;
  utterance.pitch = 1;
  utterance.volume = 0.95;
  window.speechSynthesis.speak(utterance);
}

export default function VirtualTour({ mode = "public" }) {
  const navigate = useNavigate();
  const steps = useMemo(() => (mode === "admin" ? adminTourSteps : publicTourSteps), [mode]);
  const [index, setIndex] = useState(0);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [running, setRunning] = useState(true);

  const step = steps[index];

  useEffect(() => {
    if (!running || !step) return;
    navigate(step.route);
    speak(`${step.title}. ${step.body}`, voiceEnabled);
    return () => window.speechSynthesis?.cancel?.();
  }, [index, running, step, navigate, voiceEnabled]);

  if (!running || !step) return null;

  const progress = Math.round(((index + 1) / steps.length) * 100);

  return (
    <div className="vs-tour-backdrop">
      <section className="vs-tour-card" role="dialog" aria-modal="true">
        <div className="vs-tour-progress">
          <span style={{ width: `${progress}%` }} />
        </div>

        <div className="vs-tour-header">
          <div>
            <p className="vs-kicker">{mode === "admin" ? "Admin Tour" : "Platform Tour"}</p>
            <h2>{step.title}</h2>
          </div>

          <button className="vs-tour-close" onClick={() => setRunning(false)} aria-label="Close tour">
            ×
          </button>
        </div>

        <p className="vs-tour-body">{step.body}</p>

        <div className="vs-tour-meta">
          Step {index + 1} of {steps.length} • {progress}%
        </div>

        <div className="vs-tour-actions">
          <button className="vs-button vs-button-secondary" onClick={() => setIndex((v) => Math.max(0, v - 1))} disabled={index === 0}>
            Back
          </button>

          <button className="vs-button vs-button-secondary" onClick={() => setVoiceEnabled((v) => !v)}>
            Voice {voiceEnabled ? "On" : "Off"}
          </button>

          <button className="vs-button vs-button-secondary" onClick={() => speak(`${step.title}. ${step.body}`, voiceEnabled)}>
            Replay
          </button>

          <button
            className="vs-button"
            onClick={() => {
              if (index >= steps.length - 1) {
                setRunning(false);
                window.speechSynthesis?.cancel?.();
              } else {
                setIndex((v) => v + 1);
              }
            }}
          >
            {index >= steps.length - 1 ? "Finish Tour" : "Next"}
          </button>
        </div>
      </section>
    </div>
  );
}