import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";

import PageShell from "../components/ui/PageShell";
import Badge from "../components/ui/Badge";
import StatCard from "../components/ui/StatCard";
import EmptyState from "../components/ui/EmptyState";
import ExecutivePageNav from "../components/ui/ExecutivePageNav";
import CollapsibleSection from "../components/ui/CollapsibleSection";
import BackToTopButton from "../components/ui/BackToTopButton";
import ShowMoreList from "../components/ui/ShowMoreList";

const MODULES = [
  {
    key: "strategy",
    label: "Campaign Strategy",
    icon: "🎯",
    description: "Build the campaign thesis, path to victory, target geography, resource priorities, and operating plan.",
    outputs: ["Executive strategy brief", "Path-to-victory framework", "Priority geography", "90-day campaign plan"],
    prompts: ["Build a 90-day campaign strategy.", "Create a path-to-victory plan for this race.", "Identify the top strategic decisions leadership must make."],
  },
  {
    key: "messaging",
    label: "Messaging Studio",
    icon: "📣",
    description: "Develop message architecture, contrast, speeches, talking points, press language, and narrative discipline.",
    outputs: ["Message framework", "Contrast matrix", "Talking points", "Press statement"],
    prompts: ["Build a complete message framework.", "Create a positive and contrast messaging matrix.", "Draft talking points for the candidate."],
  },
  {
    key: "field",
    label: "Field + GOTV",
    icon: "🗺️",
    description: "Create county targeting, voter-contact goals, volunteer deployment, canvass strategy, and turnout plans.",
    outputs: ["Field plan", "County priorities", "Volunteer goals", "GOTV calendar"],
    prompts: ["Build a 30-day field and GOTV plan.", "Prioritize counties for voter contact.", "Create volunteer recruitment and deployment goals."],
  },
  {
    key: "fundraising",
    label: "Fundraising Planner",
    icon: "💰",
    description: "Design donor strategy, call-time programs, finance calendars, events, goals, and revenue pacing.",
    outputs: ["Finance plan", "Donor priorities", "Call-time calendar", "Revenue forecast"],
    prompts: ["Build a 30-day fundraising plan.", "Create a finance calendar and donor follow-up program.", "Identify the highest-priority fundraising actions."],
  },
  {
    key: "digital",
    label: "Digital Advertising",
    icon: "📈",
    description: "Plan targeting, creative testing, channel mix, pacing, retargeting, persuasion, and acquisition funnels.",
    outputs: ["Digital plan", "Audience matrix", "Creative tests", "Budget pacing"],
    prompts: ["Build a digital advertising plan.", "Create an audience and creative testing matrix.", "Recommend channel mix and budget pacing."],
  },
  {
    key: "mail",
    label: "Direct Mail Studio",
    icon: "📬",
    description: "Create mail strategy, universes, production schedules, creative briefs, testing, and delivery plans.",
    outputs: ["Mail calendar", "Universe strategy", "Creative brief", "Production checklist"],
    prompts: ["Build a direct mail calendar.", "Create a mail universe and testing strategy.", "Identify direct-mail production risks."],
  },
  {
    key: "media",
    label: "Media + Rapid Response",
    icon: "📰",
    description: "Build earned-media plans, crisis response, debate prep, opposition response, and press operations.",
    outputs: ["Earned media plan", "Rapid response plan", "Debate prep", "Crisis checklist"],
    prompts: ["Build a rapid-response plan.", "Create an earned-media strategy.", "Prepare a debate contrast and rebuttal framework."],
  },
  {
    key: "compliance",
    label: "Compliance Review",
    icon: "⚖️",
    description: "Surface process risks, approvals, documentation, recordkeeping, and counsel escalation points.",
    outputs: ["Compliance checklist", "Approval workflow", "Documentation plan", "Counsel questions"],
    prompts: ["Review this campaign plan for general compliance risks.", "Create a campaign recordkeeping checklist.", "List the questions we should escalate to counsel."],
  },
];

const DELIVERABLE_TYPES = [
  "Executive Strategy Brief",
  "90-Day Campaign Plan",
  "Messaging Framework",
  "Field + GOTV Plan",
  "Fundraising Plan",
  "Digital Advertising Plan",
  "Direct Mail Plan",
  "Rapid Response Plan",
  "Client Presentation Outline",
  "Mission Control Task Plan",
];

const BUILD_PHASES = ["Discovery", "Strategy", "Production", "Execution", "Measurement", "Launch"];

const INTELLIGENCE_SOURCES = [
  "Mission Control",
  "Election War Room",
  "Strategic Advisor",
  "Campaign CRM",
  "State Operations",
  "Donor Network",
  "Vendor Network",
  "Intelligence Reports",
];

const DOCUMENT_TEMPLATES = [
  {
    key: "executive-brief",
    label: "Executive Campaign Brief",
    description: "Leadership summary with priorities, risks, recommendations, and next actions.",
  },
  {
    key: "master-plan",
    label: "Master Campaign Plan",
    description: "Comprehensive cross-functional campaign strategy and 90-day execution roadmap.",
  },
  {
    key: "strategy-memo",
    label: "Campaign Strategy Memo",
    description: "Path-to-victory analysis, assumptions, targeting, resource priorities, and decisions.",
  },
  {
    key: "field-plan",
    label: "Field + GOTV Plan",
    description: "Target geography, voter-contact goals, staffing, volunteers, metrics, and timeline.",
  },
  {
    key: "fundraising-plan",
    label: "Fundraising Plan",
    description: "Revenue goals, donor strategy, call time, events, pacing, and accountability.",
  },
  {
    key: "messaging-guide",
    label: "Messaging Guide",
    description: "Core narrative, contrast, proof points, talking points, and message discipline.",
  },
  {
    key: "digital-plan",
    label: "Digital Advertising Plan",
    description: "Audiences, channels, creative testing, budget pacing, and measurement.",
  },
  {
    key: "direct-mail-plan",
    label: "Direct Mail Plan",
    description: "Mail universes, creative briefs, testing, production schedule, and delivery risks.",
  },
  {
    key: "rapid-response",
    label: "Rapid Response Playbook",
    description: "Threat scenarios, response rules, owners, escalation, approvals, and timelines.",
  },
  {
    key: "client-report",
    label: "Client Strategy Report",
    description: "Client-ready summary of current posture, recommendations, progress, and decisions.",
  },
];







const INTELLIGENCE_TABS = [
  { key: "health", label: "Campaign Health" },
  { key: "opponent", label: "Opponent Intelligence" },
  { key: "district", label: "District Intelligence" },
  { key: "media", label: "Media Monitoring" },
  { key: "polling", label: "Polling Intelligence" },
  { key: "fundraising", label: "Fundraising Intelligence" },
  { key: "volunteers", label: "Volunteer Intelligence" },
  { key: "recommendations", label: "AI Recommendations" },
];

const INTELLIGENCE_RISK_LEVELS = [
  "Low",
  "Moderate",
  "Elevated",
  "High",
  "Critical",
];

function intelligenceTone(value = "") {
  const normalized = String(value || "").toLowerCase();

  if (["critical", "high", "danger"].includes(normalized)) return "danger";
  if (["elevated", "moderate", "warning"].includes(normalized)) return "warning";
  if (["active", "strong", "healthy", "low"].includes(normalized)) return "active";

  return "info";
}

function scoreBand(score) {
  const value = Number(score || 0);
  if (value >= 85) return "Strong";
  if (value >= 70) return "Healthy";
  if (value >= 55) return "Watch";
  if (value >= 40) return "Elevated";
  return "Critical";
}

const PRESENTATION_TEMPLATES = [
  {
    key: "strategy-review",
    label: "Campaign Strategy Review",
    description: "Executive client deck covering posture, strategy, risks, and recommendations.",
  },
  {
    key: "budget-review",
    label: "Budget + Resource Review",
    description: "Finance and spend allocation presentation with budget, pacing, and risks.",
  },
  {
    key: "timeline-review",
    label: "Campaign Timeline Review",
    description: "Milestone, owner, dependency, and launch-readiness presentation.",
  },
  {
    key: "simulation-review",
    label: "Scenario Simulation Review",
    description: "What-if modeling deck with projected impact and recommended action.",
  },
  {
    key: "full-client-briefing",
    label: "Full Client Briefing",
    description: "Comprehensive presentation covering strategy, budget, timeline, assets, and simulation.",
  },
];

const PRESENTATION_THEME_OPTIONS = [
  "Executive Blue",
  "Campaign Dark",
  "Clean White",
  "War Room",
];

function createSlide({ title, kicker = "", body = "", bullets = [], notes = "" }) {
  return {
    id: `slide-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    title,
    kicker,
    body,
    bullets,
    notes,
  };
}

function slideContentToHtml(slide) {
  const bullets = Array.isArray(slide.bullets) ? slide.bullets : [];

  return `
    <section class="slide">
      ${slide.kicker ? `<div class="kicker">${escapeHtml(slide.kicker)}</div>` : ""}
      <h1>${escapeHtml(slide.title || "Untitled Slide")}</h1>
      ${slide.body ? `<p class="body">${escapeHtml(slide.body).replace(/\n/g, "<br />")}</p>` : ""}
      ${
        bullets.length
          ? `<ul>${bullets
              .filter(Boolean)
              .map((item) => `<li>${escapeHtml(item)}</li>`)
              .join("")}</ul>`
          : ""
      }
      ${slide.notes ? `<aside class="notes"><strong>Speaker Notes:</strong> ${escapeHtml(slide.notes)}</aside>` : ""}
    </section>
  `;
}

const SIMULATION_SCENARIOS = [
  {
    key: "baseline",
    label: "Baseline",
    description: "Current campaign posture with no major intervention.",
  },
  {
    key: "media-surge",
    label: "Media Surge",
    description: "Increase paid media and message frequency.",
  },
  {
    key: "field-surge",
    label: "Field Surge",
    description: "Increase canvassing, volunteer deployment, and GOTV.",
  },
  {
    key: "fundraising-acceleration",
    label: "Fundraising Acceleration",
    description: "Increase donor outreach, call time, and acquisition.",
  },
  {
    key: "balanced-growth",
    label: "Balanced Growth",
    description: "Apply moderate increases across media, field, and fundraising.",
  },
  {
    key: "defensive",
    label: "Defensive",
    description: "Protect cash, stabilize risk, and prioritize critical operations.",
  },
];

const SIMULATION_RISK_LEVELS = [
  "Low",
  "Moderate",
  "Elevated",
  "High",
  "Critical",
];

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function roundOne(value) {
  return Math.round(Number(value || 0) * 10) / 10;
}

function percent(value) {
  return `${roundOne(value)}%`;
}

const ASSET_TYPES = [
  {
    key: "email",
    label: "Campaign Email",
    description: "Fundraising, persuasion, mobilization, announcement, and rapid-response email.",
    fields: ["Subject line", "Preview text", "Body copy", "Call to action"],
  },
  {
    key: "sms",
    label: "SMS / Text Message",
    description: "Short-form fundraising, volunteer, event, persuasion, and GOTV text messages.",
    fields: ["Primary text", "Short variant", "Call to action"],
  },
  {
    key: "social",
    label: "Social Media Post",
    description: "Platform-ready copy for Facebook, Instagram, X, LinkedIn, and campaign channels.",
    fields: ["Primary post", "Short post", "Hashtags", "Visual direction"],
  },
  {
    key: "digital-ad",
    label: "Digital Advertisement",
    description: "Paid social, display, search, video, and retargeting ad copy.",
    fields: ["Headline", "Primary text", "Description", "CTA"],
  },
  {
    key: "direct-mail",
    label: "Direct Mail Copy",
    description: "Front-panel, letter, persuasion, contrast, and response-device copy.",
    fields: ["Front headline", "Body copy", "Proof points", "Response line"],
  },
  {
    key: "volunteer-script",
    label: "Volunteer Script",
    description: "Canvass, event, recruitment, and volunteer activation scripts.",
    fields: ["Opening", "Conversation flow", "Objection handling", "Closing ask"],
  },
  {
    key: "phone-bank",
    label: "Phone-Bank Script",
    description: "Persuasion, ID, fundraising, volunteer, and GOTV call scripts.",
    fields: ["Opening", "Question flow", "Response branches", "Closing"],
  },
  {
    key: "press",
    label: "Press Content",
    description: "Press releases, statements, quotes, advisories, and media responses.",
    fields: ["Headline", "Lead", "Body", "Quote", "Boilerplate"],
  },
];

const ASSET_TONES = [
  "Executive",
  "Persuasive",
  "Urgent",
  "Optimistic",
  "Conversational",
  "Grassroots",
  "Authoritative",
  "Contrast",
];

const ASSET_AUDIENCES = [
  "General Electorate",
  "Base Voters",
  "Persuadable Voters",
  "Donors",
  "Volunteers",
  "Media",
  "Community Leaders",
  "Undecided Voters",
];

const ASSET_GOALS = [
  "Persuasion",
  "Fundraising",
  "Volunteer Recruitment",
  "Event Promotion",
  "Rapid Response",
  "GOTV",
  "Name Recognition",
  "Issue Education",
];

function assetTypeByKey(key) {
  return ASSET_TYPES.find((item) => item.key === key) || ASSET_TYPES[0];
}

const BUDGET_CATEGORIES = [
  "Television",
  "Digital",
  "Direct Mail",
  "Field",
  "Staff",
  "Fundraising",
  "Polling + Research",
  "Compliance + Legal",
  "Events",
  "Travel",
  "Operations",
  "Contingency",
];

const BUDGET_SCENARIOS = [
  {
    key: "baseline",
    label: "Baseline",
    description: "Current plan and expected spending pace.",
    multiplier: 1,
  },
  {
    key: "lean",
    label: "Lean",
    description: "Reduce discretionary costs and preserve cash.",
    multiplier: 0.85,
  },
  {
    key: "growth",
    label: "Growth",
    description: "Increase persuasion, field, and fundraising investment.",
    multiplier: 1.2,
  },
  {
    key: "surge",
    label: "Election Surge",
    description: "Aggressive late-cycle acceleration.",
    multiplier: 1.4,
  },
];

function money(value) {
  return Number(value || 0).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function numberValue(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

const TIMELINE_CATEGORIES = [
  "Strategy",
  "Messaging",
  "Field",
  "Fundraising",
  "Digital",
  "Direct Mail",
  "Media",
  "Compliance",
  "Operations",
];

const TIMELINE_STATUSES = [
  "Planned",
  "In Progress",
  "Blocked",
  "Complete",
];

function toIsoDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function addDays(dateValue, days) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "";
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

function escapeHtml(value = "") {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function filenameSafe(value = "") {
  return String(value || "campaign-document")
    .trim()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function documentBodyToHtml(value = "") {
  return escapeHtml(value)
    .split(/\n{2,}/)
    .map((block) => {
      const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
      if (!lines.length) return "";

      const first = lines[0];
      const looksLikeHeading =
        first.length < 90 &&
        (
          /^[A-Z0-9][A-Z0-9\s&/+:-]+$/.test(first) ||
          /^#{1,4}\s+/.test(first) ||
          /:$/.test(first)
        );

      if (looksLikeHeading) {
        const heading = first.replace(/^#{1,4}\s+/, "").replace(/:$/, "");
        const remainder = lines.slice(1).join("<br />");
        return `<section><h2>${escapeHtml(heading)}</h2>${remainder ? `<p>${escapeHtml(lines.slice(1).join("\n")).replace(/\n/g, "<br />")}</p>` : ""}</section>`;
      }

      return `<p>${escapeHtml(lines.join("\n")).replace(/\n/g, "<br />")}</p>`;
    })
    .join("");
}

function arr(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.threads)) return value.threads;
  if (Array.isArray(value?.messages)) return value.messages;
  if (Array.isArray(value?.results)) return value.results;
  return [];
}

function clean(value = "") {
  return String(value || "").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").trim();
}

function fmtDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function moduleByKey(key) {
  return MODULES.find((item) => item.key === key) || MODULES[0];
}


function StudioHero({ project, activeModule, stats, onGenerateMasterPlan, onNewProject }) {
  return (
    <div className="studio-hero" id="studio-overview">
      <div className="studio-hero-copy">
        <span>Campaign Operations Studio AI</span>
        <strong>Build the Campaign.</strong>
        <p>
          Turn campaign goals into strategy, messaging, field plans, fundraising programs,
          digital campaigns, direct mail, rapid response, compliance workflows, and
          Mission Control-ready execution.
        </p>
        <div className="studio-badges">
          <Badge tone="active">{activeModule.label}</Badge>
          <Badge tone="info">{project.state || "National"}</Badge>
          <Badge tone="accent">{project.cycle || "2026"} Cycle</Badge>
          <Badge tone="warning">{stats.deliverables} Deliverables</Badge>
        </div>
      </div>

      <div className="studio-hero-metrics">
        <div><span>Current Project</span><strong>{project.campaign || "New Campaign Project"}</strong></div>
        <div><span>Build Phase</span><strong>{project.phase}</strong></div>
        <div><span>AI Work Sessions</span><strong>{stats.threads}</strong></div>
        <div><span>Studio Outputs</span><strong>{stats.deliverables}</strong></div>
      </div>

      <div className="studio-hero-actions">
        <button type="button" onClick={onGenerateMasterPlan}>Generate Master Campaign Plan</button>
        <button type="button" onClick={onNewProject}>New Studio Project</button>
        <Link to="/mission-control">Open Mission Control</Link>
        <Link to="/war-room">Open War Room</Link>
        <Link to="/campaign-crm">Open Campaign CRM</Link>
      </div>
    </div>
  );
}

function ModuleSelector({ selectedModule, setSelectedModule }) {
  return (
    <div className="studio-module-grid">
      {MODULES.map((module) => (
        <button
          key={module.key}
          type="button"
          className={`studio-module-card ${selectedModule === module.key ? "is-active" : ""}`}
          onClick={() => setSelectedModule(module.key)}
        >
          <span className="studio-module-icon">{module.icon}</span>
          <strong>{module.label}</strong>
          <p>{module.description}</p>
          <div>
            {module.outputs.slice(0, 3).map((output) => <small key={output}>{output}</small>)}
          </div>
        </button>
      ))}
    </div>
  );
}

function ProjectSetup({ project, setProject }) {
  const update = (field, value) => setProject((current) => ({ ...current, [field]: value }));

  return (
    <div className="studio-project-grid">
      <label><span>Campaign / Client</span><input value={project.campaign} onChange={(e) => update("campaign", e.target.value)} placeholder="Smith for Senate" /></label>
      <label><span>Office</span><input value={project.office} onChange={(e) => update("office", e.target.value)} placeholder="U.S. Senate" /></label>
      <label><span>State / Geography</span><input value={project.state} onChange={(e) => update("state", e.target.value)} placeholder="Georgia" /></label>
      <label><span>Election Cycle</span><input value={project.cycle} onChange={(e) => update("cycle", e.target.value)} placeholder="2026" /></label>
      <label>
        <span>Build Phase</span>
        <select value={project.phase} onChange={(e) => update("phase", e.target.value)}>
          {BUILD_PHASES.map((phase) => <option key={phase}>{phase}</option>)}
        </select>
      </label>
      <label><span>Primary Goal</span><input value={project.goal} onChange={(e) => update("goal", e.target.value)} placeholder="Win the general election" /></label>
      <label className="studio-project-wide">
        <span>Campaign Notes</span>
        <textarea value={project.notes} onChange={(e) => update("notes", e.target.value)} placeholder="Add strengths, risks, budget limits, target voters, deadlines, or client instructions." />
      </label>
    </div>
  );
}

function DeliverableLibrary({ deliverables, onOpen, onRemove }) {
  if (!deliverables.length) {
    return <EmptyState text="No studio deliverables yet. Generate a plan or use a module prompt to create one." />;
  }

  return (
    <div className="studio-deliverable-grid">
      {deliverables.map((item) => (
        <div key={item.id} className="studio-deliverable-card">
          <div>
            <span>{item.moduleLabel}</span>
            <strong>{item.title}</strong>
            <p>{item.summary || "AI-generated studio deliverable."}</p>
          </div>
          <div className="studio-deliverable-meta">
            <Badge tone="active">{item.status}</Badge>
            <small>{fmtDate(item.createdAt)}</small>
          </div>
          <div className="studio-card-actions">
            <button type="button" onClick={() => onOpen(item)}>Open</button>
            <button type="button" onClick={() => onRemove(item.id)}>Remove</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function LaunchChecklist({ checklist, toggleChecklist }) {
  return (
    <div className="studio-checklist">
      {checklist.map((item) => (
        <button key={item.id} type="button" className={item.complete ? "is-complete" : ""} onClick={() => toggleChecklist(item.id)}>
          <span>{item.complete ? "✓" : "○"}</span>
          <div><strong>{item.label}</strong><small>{item.owner}</small></div>
        </button>
      ))}
    </div>
  );
}


export default function CampaignOperationsStudioAI() {
  const [threads, setThreads] = useState([]);
  const [messages, setMessages] = useState([]);
  const [threadId, setThreadId] = useState(null);
  const [selectedModule, setSelectedModule] = useState("strategy");
  const [prompt, setPrompt] = useState("");
  const [asking, setAsking] = useState(false);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");
  const [selectedDeliverable, setSelectedDeliverable] = useState(null);
  const [isReading, setIsReading] = useState(false);
  const speechRef = useRef(null);
  const [documentTemplate, setDocumentTemplate] = useState("executive-brief");
  const [documentTitle, setDocumentTitle] = useState("");
  const [documentPreparedBy, setDocumentPreparedBy] = useState("VoterSpheres Campaign Operations Studio AI");
  const [documentStatus, setDocumentStatus] = useState("Draft");
  const [documentIncludeCover, setDocumentIncludeCover] = useState(true);
  const [documentIncludeContext, setDocumentIncludeContext] = useState(true);
  const [documentSource, setDocumentSource] = useState("latest-answer");
  const [timelineItems, setTimelineItems] = useState([]);
  const [timelineStartDate, setTimelineStartDate] = useState(
    toIsoDate(new Date())
  );
  const [timelineDurationDays, setTimelineDurationDays] = useState(90);
  const [timelineFilter, setTimelineFilter] = useState("All");
  const [timelineStatusFilter, setTimelineStatusFilter] = useState("All");
  const [timelineMessage, setTimelineMessage] = useState("");
  const [budgetScenario, setBudgetScenario] = useState("baseline");
  const [budgetRevenueGoal, setBudgetRevenueGoal] = useState(2500000);
  const [budgetCashOnHand, setBudgetCashOnHand] = useState(750000);
  const [budgetStartDate, setBudgetStartDate] = useState(
    toIsoDate(new Date())
  );
  const [budgetEndDate, setBudgetEndDate] = useState(
    addDays(toIsoDate(new Date()), 180)
  );
  const [budgetMessage, setBudgetMessage] = useState("");
  const [assetType, setAssetType] = useState("email");
  const [assetTone, setAssetTone] = useState("Persuasive");
  const [assetAudience, setAssetAudience] = useState("General Electorate");
  const [assetGoal, setAssetGoal] = useState("Persuasion");
  const [assetTopic, setAssetTopic] = useState("");
  const [assetCallToAction, setAssetCallToAction] = useState("");
  const [assetLength, setAssetLength] = useState("Standard");
  const [assetVariants, setAssetVariants] = useState(3);
  const [assetOutput, setAssetOutput] = useState("");
  const [assetHistory, setAssetHistory] = useState([]);
  const [assetMessage, setAssetMessage] = useState("");
  const [simulationScenario, setSimulationScenario] = useState("baseline");
  const [simulationName, setSimulationName] = useState("Current Campaign Scenario");
  const [simulationBudgetIncrease, setSimulationBudgetIncrease] = useState(0);
  const [simulationMediaIncrease, setSimulationMediaIncrease] = useState(0);
  const [simulationFieldIncrease, setSimulationFieldIncrease] = useState(0);
  const [simulationFundraisingIncrease, setSimulationFundraisingIncrease] = useState(0);
  const [simulationTurnoutBaseline, setSimulationTurnoutBaseline] = useState(52);
  const [simulationPollingBaseline, setSimulationPollingBaseline] = useState(47);
  const [simulationFundraisingBaseline, setSimulationFundraisingBaseline] = useState(750000);
  const [simulationMediaPressure, setSimulationMediaPressure] = useState(45);
  const [simulationFieldStrength, setSimulationFieldStrength] = useState(55);
  const [simulationRisk, setSimulationRisk] = useState("Moderate");
  const [simulationResult, setSimulationResult] = useState(null);
  const [simulationHistory, setSimulationHistory] = useState([]);
  const [simulationMessage, setSimulationMessage] = useState("");
  const [presentationTemplate, setPresentationTemplate] = useState("strategy-review");
  const [presentationTitle, setPresentationTitle] = useState("");
  const [presentationAudience, setPresentationAudience] = useState("Client Leadership");
  const [presentationTheme, setPresentationTheme] = useState("Executive Blue");
  const [presentationSlides, setPresentationSlides] = useState([]);
  const [selectedSlideId, setSelectedSlideId] = useState(null);
  const [presentationMessage, setPresentationMessage] = useState("");
  const [intelligenceTab, setIntelligenceTab] = useState("health");
  const [intelligenceLastUpdated, setIntelligenceLastUpdated] = useState("");
  const [intelligenceMessage, setIntelligenceMessage] = useState("");
  const [opponentName, setOpponentName] = useState("Primary Opponent");
  const [opponentStrengths, setOpponentStrengths] = useState([
    "Strong name recognition",
    "Established donor network",
    "Consistent media presence",
  ]);
  const [opponentVulnerabilities, setOpponentVulnerabilities] = useState([
    "Weak field organization",
    "Message inconsistency",
    "Limited local coalition depth",
  ]);
  const [districtMetrics, setDistrictMetrics] = useState({
    turnoutIndex: 68,
    persuasionIndex: 61,
    baseIntensity: 74,
    demographicFit: 66,
    geographicCoverage: 58,
  });
  const [mediaSignals, setMediaSignals] = useState([
    {
      id: "media-1",
      source: "Local News",
      title: "Candidate economic message gains traction",
      sentiment: "Positive",
      impact: "Medium",
      status: "Monitor",
    },
    {
      id: "media-2",
      source: "Social Media",
      title: "Opponent attack narrative increasing",
      sentiment: "Negative",
      impact: "High",
      status: "Respond",
    },
    {
      id: "media-3",
      source: "Regional Press",
      title: "Volunteer turnout receives favorable coverage",
      sentiment: "Positive",
      impact: "Low",
      status: "Amplify",
    },
  ]);
  const [pollingMetrics, setPollingMetrics] = useState({
    candidate: 47,
    opponent: 46,
    undecided: 7,
    trend: 1.4,
    confidence: 72,
  });
  const [fundraisingMetrics, setFundraisingMetrics] = useState({
    goal: 2500000,
    raised: 1450000,
    cashOnHand: 750000,
    donorGrowth: 18,
    averageGift: 142,
  });
  const [volunteerMetrics, setVolunteerMetrics] = useState({
    activeVolunteers: 428,
    weeklyGrowth: 12,
    doorsKnocked: 18250,
    callsCompleted: 27600,
    eventsScheduled: 14,
  });
  const [intelligenceRecommendations, setIntelligenceRecommendations] = useState([
    {
      id: "rec-1",
      title: "Increase field coverage in weak counties",
      priority: "High",
      owner: "Field Director",
      status: "Open",
      rationale: "Geographic coverage trails turnout opportunity.",
    },
    {
      id: "rec-2",
      title: "Accelerate donor follow-up",
      priority: "Elevated",
      owner: "Finance Director",
      status: "Open",
      rationale: "Fundraising growth is positive but below the campaign goal pace.",
    },
    {
      id: "rec-3",
      title: "Counter opponent attack narrative",
      priority: "High",
      owner: "Communications Director",
      status: "Open",
      rationale: "Negative media pressure is increasing.",
    },
  ]);
  const [budgetItems, setBudgetItems] = useState([
    {
      id: "budget-tv",
      category: "Television",
      planned: 700000,
      committed: 250000,
      spent: 100000,
      notes: "Broadcast and cable persuasion.",
    },
    {
      id: "budget-digital",
      category: "Digital",
      planned: 350000,
      committed: 125000,
      spent: 85000,
      notes: "Persuasion, acquisition, and retargeting.",
    },
    {
      id: "budget-mail",
      category: "Direct Mail",
      planned: 275000,
      committed: 90000,
      spent: 45000,
      notes: "Persuasion and turnout mail.",
    },
    {
      id: "budget-field",
      category: "Field",
      planned: 300000,
      committed: 110000,
      spent: 70000,
      notes: "Organizers, canvass, and GOTV.",
    },
    {
      id: "budget-staff",
      category: "Staff",
      planned: 250000,
      committed: 160000,
      spent: 120000,
      notes: "Core campaign team and payroll.",
    },
    {
      id: "budget-fundraising",
      category: "Fundraising",
      planned: 125000,
      committed: 40000,
      spent: 25000,
      notes: "Events, call time, and donor acquisition.",
    },
    {
      id: "budget-research",
      category: "Polling + Research",
      planned: 150000,
      committed: 60000,
      spent: 45000,
      notes: "Polling, analytics, and opposition research.",
    },
    {
      id: "budget-operations",
      category: "Operations",
      planned: 200000,
      committed: 80000,
      spent: 50000,
      notes: "Technology, office, travel, and administration.",
    },
    {
      id: "budget-contingency",
      category: "Contingency",
      planned: 150000,
      committed: 0,
      spent: 0,
      notes: "Emergency and rapid-response reserve.",
    },
  ]);


  const [project, setProject] = useState({
    campaign: "",
    office: "",
    state: "",
    cycle: "2026",
    phase: "Discovery",
    goal: "",
    notes: "",
  });

  const [deliverables, setDeliverables] = useState([]);
  const [checklist, setChecklist] = useState([
    { id: "strategy", label: "Campaign strategy approved", owner: "Campaign Manager", complete: false },
    { id: "message", label: "Messaging framework approved", owner: "Communications Director", complete: false },
    { id: "budget", label: "Budget and resource plan confirmed", owner: "Finance Director", complete: false },
    { id: "field", label: "Field and GOTV plan assigned", owner: "Field Director", complete: false },
    { id: "vendors", label: "Critical vendors selected", owner: "Operations Director", complete: false },
    { id: "compliance", label: "Compliance and counsel review completed", owner: "Compliance Advisor", complete: false },
  ]);

  const activeModule = useMemo(() => moduleByKey(selectedModule), [selectedModule]);

  const loadThreads = useCallback(async () => {
    try {
      setLoadingThreads(true);
      setError("");
      const result = await api.aiCampaignCopilotThreads();
      setThreads(arr(result));
      setLastUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    } catch (err) {
      setError(err?.response?.data?.error || err?.response?.data?.detail || err?.message || "Failed to load Campaign Operations Studio sessions.");
    } finally {
      setLoadingThreads(false);
    }
  }, []);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  function buildStudioPrompt(value) {
    const details = [
      `Studio Module: ${activeModule.label}`,
      `Campaign / Client: ${project.campaign || "Not specified"}`,
      `Office: ${project.office || "Not specified"}`,
      `Geography: ${project.state || "National"}`,
      `Election Cycle: ${project.cycle || "2026"}`,
      `Build Phase: ${project.phase}`,
      `Primary Goal: ${project.goal || "Not specified"}`,
      project.notes ? `Campaign Notes: ${project.notes}` : "",
      "",
      "Return the answer as a production-ready campaign deliverable.",
      "Use clear headings, priorities, owners, timing, risks, metrics, and next actions.",
      "Clearly distinguish assumptions from verified facts.",
    ].filter(Boolean);

    return `${value}\n\nCampaign Operations Studio Context:\n${details.join("\n")}`;
  }

  function agentForModule() {
    const map = {
      strategy: "campaign_strategist",
      messaging: "communications_director",
      field: "field_operations_director",
      fundraising: "fundraising_director",
      digital: "digital_advertising_advisor",
      mail: "mailops_director",
      media: "rapid_response_director",
      compliance: "compliance_advisor",
    };
    return map[activeModule.key] || "campaign_strategist";
  }

  async function ask(nextPrompt = prompt, options = {}) {
    const value = clean(nextPrompt);
    if (!value) return;

    const userMessage = {
      id: `local-user-${Date.now()}`,
      role: "user",
      content: value,
      created_at: new Date().toISOString(),
    };

    setMessages((current) => [...current, userMessage]);
    setPrompt("");
    setAsking(true);
    setError("");
    setMessage("");

    try {
      const result = await api.askAiCampaignCopilot({
        prompt: buildStudioPrompt(value),
        thread_id: threadId || null,
        agent: agentForModule(),
      });

      setThreadId(result?.thread_id || threadId);

      const assistantMessage = result?.message || {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: result?.answer || "No answer returned.",
        created_at: new Date().toISOString(),
      };

      setMessages((current) => [...current, assistantMessage]);

      if (options.createDeliverable) {
        const deliverable = {
          id: `deliverable-${Date.now()}`,
          title: options.title || `${activeModule.label} Deliverable`,
          module: activeModule.key,
          moduleLabel: activeModule.label,
          content: assistantMessage.content,
          summary: options.summary || `Generated from the ${activeModule.label} studio module.`,
          status: "Draft",
          createdAt: new Date().toISOString(),
        };
        setDeliverables((current) => [deliverable, ...current]);
        setSelectedDeliverable(deliverable);
      }

      setMessage("Studio output generated using live VoterSpheres AI.");
      await loadThreads();
    } catch (err) {
      setError(err?.response?.data?.error || err?.response?.data?.detail || err?.message || "Failed to generate Campaign Operations Studio output.");
    } finally {
      setAsking(false);
    }
  }

  async function openThread(id) {
    try {
      setError("");
      const result = await api.aiCampaignCopilotThread(id);
      setThreadId(result?.thread?.id || id);
      setMessages(arr(result?.messages));
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Failed to open Studio session.");
    }
  }

  function startNewProject() {
    setThreadId(null);
    setMessages([]);
    setPrompt("");
    setSelectedModule("strategy");
    setProject({ campaign: "", office: "", state: "", cycle: "2026", phase: "Discovery", goal: "", notes: "" });
    setDeliverables([]);
    setSelectedDeliverable(null);
    setMessage("Started a new Campaign Operations Studio project.");
  }

  function generateMasterPlan() {
    setSelectedModule("strategy");
    ask(
      "Generate a complete master campaign operations plan covering strategy, messaging, voter targeting, field, fundraising, digital, direct mail, media, rapid response, compliance, budget priorities, KPIs, timeline, owners, and a 90-day execution roadmap.",
      {
        createDeliverable: true,
        title: "Master Campaign Operations Plan",
        summary: "Cross-functional campaign strategy and execution roadmap.",
      }
    );
  }

  function generateModuleDeliverable(promptValue) {
    ask(promptValue, {
      createDeliverable: true,
      title: `${activeModule.label} Plan`,
      summary: `Production-ready ${activeModule.label.toLowerCase()} deliverable.`,
    });
  }

  function convertLastAnswerToDeliverable(type) {
    const lastAssistant = [...messages].reverse().find((item) => item.role === "assistant");
    if (!lastAssistant?.content) {
      setMessage("Generate an AI response before creating a deliverable.");
      return;
    }

    const item = {
      id: `deliverable-${Date.now()}`,
      title: type,
      module: activeModule.key,
      moduleLabel: activeModule.label,
      content: lastAssistant.content,
      summary: `Converted from the latest ${activeModule.label} AI response.`,
      status: "Draft",
      createdAt: new Date().toISOString(),
    };

    setDeliverables((current) => [item, ...current]);
    setSelectedDeliverable(item);
    setMessage(`${type} added to the deliverable library.`);
  }

  function removeDeliverable(id) {
    setDeliverables((current) => current.filter((item) => item.id !== id));
    if (selectedDeliverable?.id === id) setSelectedDeliverable(null);
  }

  function toggleChecklist(id) {
    setChecklist((current) => current.map((item) => item.id === id ? { ...item, complete: !item.complete } : item));
  }

  async function copyDeliverable() {
    if (!selectedDeliverable?.content) return;
    await navigator.clipboard.writeText(selectedDeliverable.content);
    setMessage("Deliverable copied.");
  }

  function getLatestAssistantMessage() {
    return [...messages].reverse().find((item) => item.role === "assistant");
  }

  function getPreferredVoice() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
    const voices = window.speechSynthesis.getVoices?.() || [];
    const preferredNames = [
      "Microsoft Aria",
      "Microsoft Jenny",
      "Samantha",
      "Victoria",
      "Karen",
      "Zira",
      "Google US English",
      "Google UK English Female",
    ];

    for (const preferred of preferredNames) {
      const match = voices.find((voice) =>
        String(voice.name || "").toLowerCase().includes(preferred.toLowerCase())
      );
      if (match) return match;
    }

    return voices.find((voice) => /^en(-|_)/i.test(voice.lang || "")) || voices[0] || null;
  }

  function readLatestAnswer() {
    const latest = getLatestAssistantMessage();

    if (!latest?.content) {
      setMessage("No AI Studio answer is available to read.");
      return;
    }

    if (
      typeof window === "undefined" ||
      !("speechSynthesis" in window) ||
      typeof window.SpeechSynthesisUtterance === "undefined"
    ) {
      setMessage("Text-to-speech is not supported in this browser.");
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new window.SpeechSynthesisUtterance(clean(latest.content));
    const voice = getPreferredVoice();

    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang || "en-US";
    } else {
      utterance.lang = "en-US";
    }

    utterance.rate = 0.96;
    utterance.pitch = 1.04;
    utterance.volume = 1;

    utterance.onstart = () => {
      setIsReading(true);
      setMessage("Reading the latest AI Studio answer.");
    };

    utterance.onend = () => {
      setIsReading(false);
      setMessage("Finished reading the latest answer.");
    };

    utterance.onerror = () => {
      setIsReading(false);
      setMessage("Voice playback stopped.");
    };

    speechRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }

  function stopReading() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    setIsReading(false);
    setMessage("Voice playback stopped.");
  }

  function clearConversation() {
    stopReading();
    setMessages([]);
    setPrompt("");
    setThreadId(null);
    setSelectedDeliverable(null);
    setMessage("AI Studio conversation cleared.");
    setError("");
  }

  async function copyLatestAnswer() {
    const latest = getLatestAssistantMessage();

    if (!latest?.content) {
      setMessage("No AI Studio answer is available to copy.");
      return;
    }

    try {
      await navigator.clipboard.writeText(latest.content);
      setMessage("Latest AI Studio answer copied.");
    } catch {
      setMessage("Unable to copy the latest answer.");
    }
  }

  function saveLatestAnswerToDeliverables() {
    const latest = getLatestAssistantMessage();

    if (!latest?.content) {
      setMessage("Generate an AI Studio answer before saving a deliverable.");
      return;
    }

    const item = {
      id: `deliverable-${Date.now()}`,
      title: `${activeModule.label} Deliverable`,
      module: activeModule.key,
      moduleLabel: activeModule.label,
      content: latest.content,
      summary: `Saved from the latest ${activeModule.label} AI Studio response.`,
      status: "Draft",
      createdAt: new Date().toISOString(),
    };

    setDeliverables((current) => [item, ...current]);
    setSelectedDeliverable(item);
    setMessage("Latest answer saved to the Deliverable Library.");
  }


  function getDocumentSourceContent() {
    if (documentSource === "selected-deliverable") {
      return selectedDeliverable?.content || "";
    }

    return getLatestAssistantMessage()?.content || "";
  }

  function getDocumentSourceTitle() {
    if (documentTitle.trim()) return documentTitle.trim();

    if (
      documentSource === "selected-deliverable" &&
      selectedDeliverable?.title
    ) {
      return selectedDeliverable.title;
    }

    return (
      DOCUMENT_TEMPLATES.find(
        (template) => template.key === documentTemplate
      )?.label || "Campaign Document"
    );
  }

  function getDocumentContextHtml() {
    if (!documentIncludeContext) return "";

    const rows = [
      ["Campaign / Client", project.campaign || "Not specified"],
      ["Office", project.office || "Not specified"],
      ["Geography", project.state || "National"],
      ["Election Cycle", project.cycle || "2026"],
      ["Build Phase", project.phase || "Not specified"],
      ["Primary Goal", project.goal || "Not specified"],
      ["Studio Module", activeModule.label],
      ["Document Status", documentStatus],
    ];

    return `
      <section class="document-context">
        <h2>Project Context</h2>
        <table>
          <tbody>
            ${rows
              .map(
                ([label, value]) =>
                  `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`
              )
              .join("")}
          </tbody>
        </table>
      </section>
    `;
  }

  function buildDocumentHtml() {
    const content = getDocumentSourceContent();
    const title = getDocumentSourceTitle();
    const generatedAt = new Date().toLocaleString();
    const notes = project.notes?.trim();

    return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    @page { margin: 0.7in; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      color: #172033;
      line-height: 1.55;
      margin: 0;
      background: white;
    }
    .cover {
      min-height: 8.2in;
      display: flex;
      flex-direction: column;
      justify-content: center;
      border-top: 12px solid #173a79;
      padding: 0 0.45in;
      page-break-after: always;
    }
    .eyebrow {
      color: #315d9e;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }
    h1 {
      margin: 18px 0 12px;
      font-size: 34px;
      line-height: 1.08;
      color: #10254d;
    }
    h2 {
      color: #173a79;
      border-bottom: 1px solid #cad5e7;
      padding-bottom: 6px;
      margin: 26px 0 10px;
      font-size: 20px;
    }
    p { margin: 10px 0; }
    .meta {
      margin-top: 26px;
      color: #4e5d75;
      font-size: 13px;
    }
    .meta div { margin: 5px 0; }
    .document-context table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 12px;
    }
    .document-context th,
    .document-context td {
      border: 1px solid #d5deeb;
      padding: 8px 10px;
      vertical-align: top;
      text-align: left;
    }
    .document-context th {
      width: 32%;
      background: #eef3fa;
      color: #173a79;
    }
    .content {
      font-size: 14px;
    }
    .footer-note {
      margin-top: 36px;
      border-top: 1px solid #d5deeb;
      padding-top: 12px;
      color: #66758e;
      font-size: 11px;
    }
  </style>
</head>
<body>
  ${
    documentIncludeCover
      ? `<section class="cover">
          <div class="eyebrow">VoterSpheres Campaign Operations Studio AI</div>
          <h1>${escapeHtml(title)}</h1>
          <p>${escapeHtml(
            DOCUMENT_TEMPLATES.find(
              (template) => template.key === documentTemplate
            )?.description || "AI-generated campaign document."
          )}</p>
          <div class="meta">
            <div><strong>Campaign:</strong> ${escapeHtml(
              project.campaign || "Not specified"
            )}</div>
            <div><strong>Geography:</strong> ${escapeHtml(
              project.state || "National"
            )}</div>
            <div><strong>Prepared by:</strong> ${escapeHtml(
              documentPreparedBy
            )}</div>
            <div><strong>Status:</strong> ${escapeHtml(documentStatus)}</div>
            <div><strong>Generated:</strong> ${escapeHtml(generatedAt)}</div>
          </div>
        </section>`
      : ""
  }

  ${getDocumentContextHtml()}

  ${
    notes
      ? `<section><h2>Campaign Notes</h2><p>${escapeHtml(notes).replace(
          /\n/g,
          "<br />"
        )}</p></section>`
      : ""
  }

  <main class="content">
    ${documentBodyToHtml(content)}
  </main>

  <div class="footer-note">
    Generated by VoterSpheres Campaign Operations Studio AI. Review all assumptions,
    jurisdiction-specific requirements, financial figures, and legal conclusions before use.
  </div>
</body>
</html>`;
  }

  function exportDocumentWord() {
    const content = getDocumentSourceContent();

    if (!content) {
      setMessage(
        "Generate an AI answer or select a deliverable before exporting."
      );
      return;
    }

    const title = getDocumentSourceTitle();
    const html = buildDocumentHtml();
    const blob = new Blob(["\ufeff", html], {
      type: "application/msword;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = `${filenameSafe(title)}.doc`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);

    setMessage("Word document generated.");
  }

  function exportDocumentPdf() {
    const content = getDocumentSourceContent();

    if (!content) {
      setMessage(
        "Generate an AI answer or select a deliverable before exporting."
      );
      return;
    }

    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      setMessage(
        "The browser blocked the PDF window. Allow pop-ups and try again."
      );
      return;
    }

    printWindow.document.open();
    printWindow.document.write(buildDocumentHtml());
    printWindow.document.close();

    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };

    setMessage(
      "Document opened for PDF export. Choose Save as PDF in the print window."
    );
  }

  function previewDocument() {
    const content = getDocumentSourceContent();

    if (!content) {
      setMessage(
        "Generate an AI answer or select a deliverable before previewing."
      );
      return;
    }

    const previewWindow = window.open("", "_blank");

    if (!previewWindow) {
      setMessage(
        "The browser blocked the preview window. Allow pop-ups and try again."
      );
      return;
    }

    previewWindow.document.open();
    previewWindow.document.write(buildDocumentHtml());
    previewWindow.document.close();
  }

  function generateDocumentDraft() {
    const template =
      DOCUMENT_TEMPLATES.find(
        (item) => item.key === documentTemplate
      ) || DOCUMENT_TEMPLATES[0];

    ask(
      `Create a complete ${template.label}. ${template.description} Format it as a professional client-ready document with an executive summary, strategic findings, priorities, owners, timeline, risks, metrics, assumptions, and next actions.`,
      {
        createDeliverable: true,
        title: template.label,
        summary: template.description,
      }
    );

    setDocumentTitle(template.label);
  }


  function createTimelineItem({
    title,
    category = "Operations",
    owner = "Campaign Manager",
    startDate,
    endDate,
    status = "Planned",
    dependency = "",
    notes = "",
  }) {
    return {
      id: `timeline-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      title,
      category,
      owner,
      startDate,
      endDate,
      status,
      dependency,
      notes,
    };
  }

  function generateTimelineFromTemplate() {
    const start = timelineStartDate || toIsoDate(new Date());
    const duration = Math.max(30, Number(timelineDurationDays) || 90);
    const milestoneSpacing = Math.max(5, Math.floor(duration / 12));

    const seeds = [
      ["Campaign strategy approved", "Strategy", "Campaign Manager", 0, 7],
      ["Message framework finalized", "Messaging", "Communications Director", 4, 14],
      ["Finance plan and call-time targets set", "Fundraising", "Finance Director", 7, 18],
      ["Field universe and county priorities approved", "Field", "Field Director", 10, 21],
      ["Digital audience and creative tests launched", "Digital", "Digital Director", 14, 28],
      ["Direct-mail production calendar locked", "Direct Mail", "Mail Director", 18, 32],
      ["Earned-media launch sequence begins", "Media", "Communications Director", 21, 35],
      ["Volunteer recruitment sprint", "Field", "Field Director", 28, 45],
      ["Fundraising performance review", "Fundraising", "Finance Director", 35, 42],
      ["Persuasion message optimization", "Messaging", "Campaign Strategist", 42, 55],
      ["Compliance and documentation audit", "Compliance", "Compliance Advisor", 50, 60],
      ["GOTV readiness review", "Field", "Field Director", Math.max(60, duration - 25), Math.max(68, duration - 14)],
      ["Final execution sprint", "Operations", "Campaign Manager", Math.max(70, duration - 14), duration],
    ];

    const nextItems = seeds.map(
      ([title, category, owner, startOffset, endOffset], index) =>
        createTimelineItem({
          title,
          category,
          owner,
          startDate: addDays(start, Math.min(startOffset, duration - 1)),
          endDate: addDays(start, Math.min(endOffset, duration)),
          status: index === 0 ? "In Progress" : "Planned",
          dependency: index === 0 ? "" : seeds[index - 1][0],
          notes: `Generated for ${project.campaign || "the active campaign"} during the ${project.phase} phase.`,
        })
    );

    setTimelineItems(nextItems);
    setTimelineMessage(
      `${nextItems.length} campaign milestones generated for a ${duration}-day timeline.`
    );
  }

  function generateTimelineWithAI() {
    ask(
      `Create a detailed ${timelineDurationDays}-day campaign timeline beginning ${timelineStartDate}. Include milestone title, category, owner, start date, end date, dependencies, status, risks, and measurable outcomes. Cover strategy, messaging, fundraising, field, digital, direct mail, media, compliance, and launch execution.`,
      {
        createDeliverable: true,
        title: `${timelineDurationDays}-Day Campaign Timeline`,
        summary: "AI-generated campaign milestone and execution schedule.",
      }
    );

    generateTimelineFromTemplate();
  }

  function updateTimelineItem(id, field, value) {
    setTimelineItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  }

  function removeTimelineItem(id) {
    setTimelineItems((current) =>
      current.filter((item) => item.id !== id)
    );
  }

  function addTimelineItem() {
    const start = timelineStartDate || toIsoDate(new Date());

    setTimelineItems((current) => [
      ...current,
      createTimelineItem({
        title: "New campaign milestone",
        category: "Operations",
        owner: "Campaign Manager",
        startDate: start,
        endDate: addDays(start, 7),
      }),
    ]);
  }

  function clearTimeline() {
    setTimelineItems([]);
    setTimelineMessage("Campaign timeline cleared.");
  }

  function duplicateTimelineItem(item) {
    setTimelineItems((current) => [
      ...current,
      {
        ...item,
        id: `timeline-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        title: `${item.title} Copy`,
      },
    ]);
  }

  function sendTimelineToMissionControl() {
    if (!timelineItems.length) {
      setTimelineMessage("Generate a timeline before creating a Mission Control handoff.");
      return;
    }

    const summary = timelineItems
      .map(
        (item, index) =>
          `${index + 1}. ${item.title} | ${item.owner} | ${item.startDate} to ${item.endDate} | ${item.status}`
      )
      .join("\n");

    ask(
      `Convert this campaign timeline into Mission Control tasks with owners, due dates, dependencies, status, and priority:\n\n${summary}`
    );

    setTimelineMessage("Timeline sent to AI task planning for Mission Control.");
  }

  function exportTimelineCsv() {
    if (!timelineItems.length) {
      setTimelineMessage("Generate a timeline before exporting.");
      return;
    }

    const header = [
      "Title",
      "Category",
      "Owner",
      "Start Date",
      "End Date",
      "Status",
      "Dependency",
      "Notes",
    ];

    const escapeCsv = (value) =>
      `"${String(value || "").replace(/"/g, '""')}"`;

    const rows = timelineItems.map((item) =>
      [
        item.title,
        item.category,
        item.owner,
        item.startDate,
        item.endDate,
        item.status,
        item.dependency,
        item.notes,
      ]
        .map(escapeCsv)
        .join(",")
    );

    const csv = [header.map(escapeCsv).join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = `${filenameSafe(
      project.campaign || "campaign"
    )}-timeline.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);

    setTimelineMessage("Campaign timeline exported as CSV.");
  }

  const filteredTimelineItems = useMemo(() => {
    return timelineItems.filter((item) => {
      const categoryMatch =
        timelineFilter === "All" || item.category === timelineFilter;
      const statusMatch =
        timelineStatusFilter === "All" ||
        item.status === timelineStatusFilter;

      return categoryMatch && statusMatch;
    });
  }, [timelineItems, timelineFilter, timelineStatusFilter]);

  const timelineProgress = useMemo(() => {
    if (!timelineItems.length) return 0;
    const complete = timelineItems.filter(
      (item) => item.status === "Complete"
    ).length;
    return Math.round((complete / timelineItems.length) * 100);
  }, [timelineItems]);






  const campaignHealthScore = useMemo(() => {
    const timelineScore = timelineItems.length
      ? timelineProgress
      : 55;

    const plannedBudget = budgetItems.reduce(
      (sum, item) => sum + numberValue(item.planned),
      0
    );

    const committedBudget = budgetItems.reduce(
      (sum, item) => sum + numberValue(item.committed),
      0
    );

    const spentBudget = budgetItems.reduce(
      (sum, item) => sum + numberValue(item.spent),
      0
    );

    const spendPercentage = plannedBudget
      ? (spentBudget / plannedBudget) * 100
      : 0;

    const committedPercentage = plannedBudget
      ? (committedBudget / plannedBudget) * 100
      : 0;

    const derivedBudgetRisk =
      plannedBudget > numberValue(budgetRevenueGoal) ||
      committedBudget > numberValue(budgetCashOnHand)
        ? "High"
        : spendPercentage > 75 || committedPercentage > 85
          ? "Elevated"
          : "Controlled";

    const budgetScore = clamp(
      100 -
        Math.max(0, spendPercentage - 75) * 1.2 -
        (derivedBudgetRisk === "High"
          ? 25
          : derivedBudgetRisk === "Elevated"
            ? 12
            : 0),
      0,
      100
    );

    const simulationScore = simulationResult
      ? simulationResult.executionScore
      : 62;

    const fundraisingScore = clamp(
      fundraisingMetrics.goal
        ? (fundraisingMetrics.raised / fundraisingMetrics.goal) * 100
        : 0,
      0,
      100
    );

    const districtValues = Object.values(districtMetrics);
    const districtScore = districtValues.length
      ? districtValues.reduce(
          (sum, value) => sum + Number(value || 0),
          0
        ) / districtValues.length
      : 0;

    return Math.round(
      timelineScore * 0.18 +
        budgetScore * 0.18 +
        simulationScore * 0.18 +
        fundraisingScore * 0.18 +
        districtScore * 0.18 +
        Math.min(100, volunteerMetrics.weeklyGrowth * 4) * 0.1
    );
  }, [
    timelineItems,
    timelineProgress,
    budgetItems,
    budgetRevenueGoal,
    budgetCashOnHand,
    simulationResult,
    fundraisingMetrics,
    districtMetrics,
    volunteerMetrics.weeklyGrowth,
  ]);

  const intelligenceRiskCount = useMemo(() => {
    return intelligenceRecommendations.filter((item) =>
      ["High", "Critical"].includes(item.priority)
    ).length;
  }, [intelligenceRecommendations]);

  const pollingLead = useMemo(
    () =>
      roundOne(
        numberValue(pollingMetrics.candidate) -
          numberValue(pollingMetrics.opponent)
      ),
    [pollingMetrics]
  );

  function refreshCampaignIntelligence() {
    setIntelligenceLastUpdated(
      new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    );

    setIntelligenceMessage(
      "Campaign Intelligence Center refreshed using current Studio data."
    );
  }

  function updateDistrictMetric(field, value) {
    setDistrictMetrics((current) => ({
      ...current,
      [field]: clamp(numberValue(value), 0, 100),
    }));
  }

  function updatePollingMetric(field, value) {
    setPollingMetrics((current) => ({
      ...current,
      [field]: numberValue(value),
    }));
  }

  function updateFundraisingMetric(field, value) {
    setFundraisingMetrics((current) => ({
      ...current,
      [field]: numberValue(value),
    }));
  }

  function updateVolunteerMetric(field, value) {
    setVolunteerMetrics((current) => ({
      ...current,
      [field]: numberValue(value),
    }));
  }

  function addMediaSignal() {
    setMediaSignals((current) => [
      {
        id: `media-${Date.now()}`,
        source: "New Source",
        title: "New media signal",
        sentiment: "Neutral",
        impact: "Medium",
        status: "Monitor",
      },
      ...current,
    ]);
  }

  function updateMediaSignal(id, field, value) {
    setMediaSignals((current) =>
      current.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  }

  function removeMediaSignal(id) {
    setMediaSignals((current) =>
      current.filter((item) => item.id !== id)
    );
  }

  function addIntelligenceRecommendation() {
    setIntelligenceRecommendations((current) => [
      {
        id: `rec-${Date.now()}`,
        title: "New executive recommendation",
        priority: "Moderate",
        owner: "Campaign Manager",
        status: "Open",
        rationale: "Add the recommendation rationale.",
      },
      ...current,
    ]);
  }

  function updateIntelligenceRecommendation(id, field, value) {
    setIntelligenceRecommendations((current) =>
      current.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  }

  function removeIntelligenceRecommendation(id) {
    setIntelligenceRecommendations((current) =>
      current.filter((item) => item.id !== id)
    );
  }

  function generateIntelligenceBriefWithAI() {
    const summary = `
Campaign health score: ${campaignHealthScore}
Health band: ${scoreBand(campaignHealthScore)}
Polling: ${pollingMetrics.candidate}% candidate, ${pollingMetrics.opponent}% opponent, ${pollingMetrics.undecided}% undecided
Polling lead: ${pollingLead}
Fundraising: ${money(fundraisingMetrics.raised)} raised against ${money(fundraisingMetrics.goal)} goal
Cash on hand: ${money(fundraisingMetrics.cashOnHand)}
Active volunteers: ${volunteerMetrics.activeVolunteers}
Doors knocked: ${volunteerMetrics.doorsKnocked}
Calls completed: ${volunteerMetrics.callsCompleted}
High-priority recommendations: ${intelligenceRiskCount}
Media signals: ${mediaSignals.length}
Opponent: ${opponentName}
Opponent strengths: ${opponentStrengths.join("; ")}
Opponent vulnerabilities: ${opponentVulnerabilities.join("; ")}
    `.trim();

    ask(
      `Create an executive campaign intelligence briefing using the following current data. Include campaign health, opponent posture, district opportunity, media narrative, polling trend, fundraising health, volunteer capacity, key risks, top opportunities, and five recommended actions.

${summary}`,
      {
        createDeliverable: true,
        title: "Campaign Intelligence Executive Brief",
        summary:
          "Integrated campaign health, opponent, polling, fundraising, volunteer, and media intelligence.",
      }
    );

    setIntelligenceMessage(
      "Campaign intelligence sent to AI Studio for executive analysis."
    );
  }

  function sendRecommendationToMissionControl(item) {
    ask(
      `Convert this executive recommendation into a Mission Control task with owner, due date, priority, dependencies, acceptance criteria, and status:

Recommendation: ${item.title}
Priority: ${item.priority}
Owner: ${item.owner}
Rationale: ${item.rationale}`
    );

    setIntelligenceMessage(
      `${item.title} sent to Mission Control task planning.`
    );
  }

  function exportIntelligenceCsv() {
    const rows = [
      ["Metric", "Value"],
      ["Campaign Health Score", campaignHealthScore],
      ["Health Band", scoreBand(campaignHealthScore)],
      ["Polling Candidate", pollingMetrics.candidate],
      ["Polling Opponent", pollingMetrics.opponent],
      ["Polling Undecided", pollingMetrics.undecided],
      ["Polling Lead", pollingLead],
      ["Fundraising Goal", fundraisingMetrics.goal],
      ["Fundraising Raised", fundraisingMetrics.raised],
      ["Cash On Hand", fundraisingMetrics.cashOnHand],
      ["Active Volunteers", volunteerMetrics.activeVolunteers],
      ["Doors Knocked", volunteerMetrics.doorsKnocked],
      ["Calls Completed", volunteerMetrics.callsCompleted],
      ["Media Signals", mediaSignals.length],
      ["High Priority Recommendations", intelligenceRiskCount],
    ];

    const csv = rows
      .map((row) =>
        row
          .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = `${filenameSafe(
      project.campaign || "campaign"
    )}-intelligence.csv`;

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);

    setIntelligenceMessage("Campaign intelligence exported as CSV.");
  }

  const selectedPresentationSlide = useMemo(() => {
    return (
      presentationSlides.find((slide) => slide.id === selectedSlideId) ||
      presentationSlides[0] ||
      null
    );
  }, [presentationSlides, selectedSlideId]);

  function getPresentationTitle() {
    return (
      presentationTitle.trim() ||
      PRESENTATION_TEMPLATES.find(
        (item) => item.key === presentationTemplate
      )?.label ||
      "Campaign Presentation"
    );
  }

  function buildDefaultPresentationSlides() {
    const campaign = project.campaign || "Campaign";
    const geography = project.state || "National";
    const template =
      PRESENTATION_TEMPLATES.find(
        (item) => item.key === presentationTemplate
      ) || PRESENTATION_TEMPLATES[0];

    const common = [
      createSlide({
        kicker: "VoterSpheres Campaign Operations Studio AI",
        title: getPresentationTitle(),
        body: `${campaign} • ${geography} • ${project.cycle || "2026"} Cycle`,
        bullets: [
          `Prepared for: ${presentationAudience}`,
          `Build phase: ${project.phase}`,
          `Primary goal: ${project.goal || "Win the campaign"}`,
        ],
        notes: "Open the meeting by grounding the client in the campaign objective and decision agenda.",
      }),
      createSlide({
        kicker: "Executive Summary",
        title: "What Leadership Needs to Know",
        body: "This briefing summarizes current strategy, operating posture, priority decisions, and recommended next actions.",
        bullets: [
          `${deliverables.length} saved Studio deliverables available`,
          `${timelineItems.length} timeline milestones currently modeled`,
          `${money(budgetTotals.planned)} planned campaign budget`,
          simulationResult
            ? `${percent(simulationResult.winProbability)} modeled win probability in latest scenario`
            : "No active simulation selected",
        ],
        notes: "Keep this slide concise and decision-focused.",
      }),
    ];

    const strategySlides = [
      createSlide({
        kicker: "Campaign Strategy",
        title: "Path to Victory",
        body: "The campaign should align resources around the most important geography, audiences, and message opportunities.",
        bullets: [
          "Define persuasion, turnout, and fundraising priorities",
          "Sequence message and field investments by phase",
          "Escalate decisions that affect budget, timing, or risk",
        ],
        notes: "Use this slide to frame the core operating thesis.",
      }),
      createSlide({
        kicker: "Recommendations",
        title: "Executive Decisions",
        body: "Leadership should resolve the highest-impact decisions before additional production work begins.",
        bullets: [
          "Approve the campaign operating plan",
          "Confirm budget allocation and pacing",
          "Lock message architecture",
          "Assign timeline owners and deadlines",
        ],
        notes: "Close this section with clear asks.",
      }),
    ];

    const budgetSlides = [
      createSlide({
        kicker: "Budget",
        title: "Campaign Resource Plan",
        body: "The current budget model tracks planned, committed, and actual spending across core campaign functions.",
        bullets: [
          `Revenue goal: ${money(budgetRevenueGoal)}`,
          `Cash on hand: ${money(budgetCashOnHand)}`,
          `Planned budget: ${money(budgetTotals.planned)}`,
          `Monthly burn rate: ${money(monthlyBurnRate)}`,
        ],
        notes: "Discuss whether resource allocation matches the campaign's strategic priorities.",
      }),
    ];

    const timelineSlides = [
      createSlide({
        kicker: "Execution Timeline",
        title: "Milestones and Owners",
        body: "The campaign timeline translates strategy into accountable workstreams with owners, dates, and statuses.",
        bullets: [
          `${timelineItems.length} active milestones`,
          `${timelineProgress}% completion across tracked milestones`,
          `${timelineItems.filter((item) => item.status === "Blocked").length} blocked items`,
          "Mission Control handoff is available for task execution",
        ],
        notes: "Highlight blocked milestones and owner accountability.",
      }),
    ];

    const simulationSlides = [
      createSlide({
        kicker: "Scenario Modeling",
        title: "What-If Simulation Results",
        body: simulationResult
          ? "The latest scenario provides directional estimates for polling, turnout, fundraising, and execution impact."
          : "Run a simulation to populate modeled campaign impact.",
        bullets: simulationResult
          ? [
              `Polling movement: ${simulationResult.pollingMovement >= 0 ? "+" : ""}${simulationResult.pollingMovement}`,
              `Turnout movement: ${simulationResult.turnoutMovement >= 0 ? "+" : ""}${simulationResult.turnoutMovement}`,
              `Projected fundraising: ${money(simulationResult.projectedFundraising)}`,
              `Win probability: ${percent(simulationResult.winProbability)}`,
            ]
          : [
              "No active scenario result",
              "Use the Simulation Engine to model media, field, fundraising, and risk",
            ],
        notes: "Emphasize that simulation outputs are modeled estimates, not verified forecasts.",
      }),
    ];

    const closeSlides = [
      createSlide({
        kicker: "Next Actions",
        title: "Recommended Operating Sequence",
        body: "Move from strategic approval into execution using Mission Control and Studio deliverables.",
        bullets: [
          "Approve or revise this presentation",
          "Convert recommendations into Mission Control tasks",
          "Assign owners and deadlines",
          "Schedule the next executive review",
        ],
        notes: "End with clear accountability and timing.",
      }),
    ];

    if (template.key === "budget-review") {
      return [...common, ...budgetSlides, ...timelineSlides, ...closeSlides];
    }

    if (template.key === "timeline-review") {
      return [...common, ...timelineSlides, ...budgetSlides, ...closeSlides];
    }

    if (template.key === "simulation-review") {
      return [...common, ...simulationSlides, ...budgetSlides, ...closeSlides];
    }

    if (template.key === "full-client-briefing") {
      return [
        ...common,
        ...strategySlides,
        ...budgetSlides,
        ...timelineSlides,
        ...simulationSlides,
        ...closeSlides,
      ];
    }

    return [...common, ...strategySlides, ...budgetSlides, ...timelineSlides, ...closeSlides];
  }

  function generatePresentationDeck() {
    const slides = buildDefaultPresentationSlides();
    setPresentationSlides(slides);
    setSelectedSlideId(slides[0]?.id || null);
    setPresentationMessage(`${slides.length} presentation slides generated.`);
  }

  function generatePresentationWithAI() {
    const template =
      PRESENTATION_TEMPLATES.find(
        (item) => item.key === presentationTemplate
      ) || PRESENTATION_TEMPLATES[0];

    ask(
      `Create a client-ready presentation outline for "${template.label}". Include slide titles, slide summaries, speaker notes, and recommendations. Use these campaign inputs:
Campaign: ${project.campaign || "Not specified"}
Office: ${project.office || "Not specified"}
Geography: ${project.state || "National"}
Cycle: ${project.cycle || "2026"}
Phase: ${project.phase}
Goal: ${project.goal || "Not specified"}
Planned budget: ${money(budgetTotals.planned)}
Timeline milestones: ${timelineItems.length}
Simulation result: ${
        simulationResult
          ? `${simulationResult.winProbability}% win probability, ${simulationResult.pollingMovement} polling movement`
          : "No active simulation"
      }`,
      {
        createDeliverable: true,
        title: `${template.label} Presentation Outline`,
        summary: template.description,
      }
    );

    generatePresentationDeck();
  }

  function updatePresentationSlide(id, field, value) {
    setPresentationSlides((current) =>
      current.map((slide) =>
        slide.id === id
          ? {
              ...slide,
              [field]:
                field === "bullets"
                  ? value.split("\n").map((item) => item.trim())
                  : value,
            }
          : slide
      )
    );
  }

  function addPresentationSlide() {
    const slide = createSlide({
      kicker: "New Slide",
      title: "Untitled Campaign Slide",
      body: "Add the slide summary here.",
      bullets: ["Add a key point", "Add a supporting point"],
      notes: "Add speaker notes.",
    });

    setPresentationSlides((current) => [...current, slide]);
    setSelectedSlideId(slide.id);
  }

  function duplicatePresentationSlide(slide) {
    const copy = createSlide({
      kicker: slide.kicker,
      title: `${slide.title} Copy`,
      body: slide.body,
      bullets: slide.bullets,
      notes: slide.notes,
    });

    setPresentationSlides((current) => [...current, copy]);
    setSelectedSlideId(copy.id);
  }

  function removePresentationSlide(id) {
    setPresentationSlides((current) => {
      const next = current.filter((slide) => slide.id !== id);
      if (selectedSlideId === id) {
        setSelectedSlideId(next[0]?.id || null);
      }
      return next;
    });
  }

  function clearPresentationDeck() {
    setPresentationSlides([]);
    setSelectedSlideId(null);
    setPresentationMessage("Presentation deck cleared.");
  }

  function buildPresentationHtml() {
    const title = getPresentationTitle();

    return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    @page { size: landscape; margin: 0.35in; }
    body {
      margin: 0;
      background: #0f172a;
      color: white;
      font-family: Arial, Helvetica, sans-serif;
    }
    .slide {
      box-sizing: border-box;
      width: 10.6in;
      min-height: 6.2in;
      page-break-after: always;
      padding: 0.55in;
      display: flex;
      flex-direction: column;
      justify-content: center;
      background:
        radial-gradient(circle at top right, rgba(59,130,246,.28), transparent 38%),
        linear-gradient(145deg, #020617, #0f172a 58%, #172554);
      border: 1px solid rgba(255,255,255,.08);
    }
    .kicker {
      color: #93c5fd;
      font-size: 13px;
      letter-spacing: .13em;
      text-transform: uppercase;
      font-weight: 800;
      margin-bottom: 18px;
    }
    h1 {
      font-size: 44px;
      line-height: 1.02;
      margin: 0 0 20px;
      letter-spacing: -0.04em;
    }
    .body {
      color: #dbeafe;
      font-size: 18px;
      line-height: 1.5;
      max-width: 8.5in;
    }
    ul {
      margin-top: 20px;
      font-size: 20px;
      line-height: 1.45;
      color: #f8fafc;
    }
    li { margin-bottom: 10px; }
    .notes {
      margin-top: 28px;
      border-top: 1px solid rgba(255,255,255,.16);
      padding-top: 12px;
      color: #cbd5e1;
      font-size: 12px;
    }
    @media print {
      body { background: white; }
      .slide { page-break-after: always; }
    }
  </style>
</head>
<body>
  ${presentationSlides.map(slideContentToHtml).join("\n")}
</body>
</html>`;
  }

  function exportPresentationHtml() {
    if (!presentationSlides.length) {
      setPresentationMessage("Generate slides before exporting.");
      return;
    }

    const blob = new Blob([buildPresentationHtml()], {
      type: "text/html;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = `${filenameSafe(getPresentationTitle())}-presentation.html`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);

    setPresentationMessage("Presentation exported as HTML.");
  }

  function exportPresentationPdf() {
    if (!presentationSlides.length) {
      setPresentationMessage("Generate slides before exporting.");
      return;
    }

    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      setPresentationMessage("The browser blocked the presentation window. Allow pop-ups and try again.");
      return;
    }

    printWindow.document.open();
    printWindow.document.write(buildPresentationHtml());
    printWindow.document.close();

    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };

    setPresentationMessage("Presentation opened for PDF export. Choose Save as PDF.");
  }

  function savePresentationToDeliverables() {
    if (!presentationSlides.length) {
      setPresentationMessage("Generate slides before saving.");
      return;
    }

    const content = presentationSlides
      .map(
        (slide, index) =>
          `SLIDE ${index + 1}: ${slide.title}\n${slide.body}\n\n${(slide.bullets || [])
            .map((bullet) => `- ${bullet}`)
            .join("\n")}\n\nSpeaker Notes: ${slide.notes}`
      )
      .join("\n\n---\n\n");

    const item = {
      id: `deliverable-${Date.now()}`,
      title: getPresentationTitle(),
      module: "presentation-builder",
      moduleLabel: "Client Presentation Builder",
      content,
      summary: `${presentationSlides.length} client-ready presentation slides.`,
      status: "Draft",
      createdAt: new Date().toISOString(),
    };

    setDeliverables((current) => [item, ...current]);
    setSelectedDeliverable(item);
    setPresentationMessage("Presentation saved to the Deliverable Library.");
  }

  function applySimulationPreset(key) {
    setSimulationScenario(key);

    const presets = {
      baseline: {
        budget: 0,
        media: 0,
        field: 0,
        fundraising: 0,
        pressure: 45,
        strength: 55,
        risk: "Moderate",
      },
      "media-surge": {
        budget: 18,
        media: 35,
        field: 5,
        fundraising: 8,
        pressure: 68,
        strength: 58,
        risk: "Elevated",
      },
      "field-surge": {
        budget: 16,
        media: 5,
        field: 40,
        fundraising: 8,
        pressure: 48,
        strength: 78,
        risk: "Moderate",
      },
      "fundraising-acceleration": {
        budget: 10,
        media: 6,
        field: 8,
        fundraising: 35,
        pressure: 42,
        strength: 58,
        risk: "Moderate",
      },
      "balanced-growth": {
        budget: 22,
        media: 22,
        field: 22,
        fundraising: 22,
        pressure: 60,
        strength: 70,
        risk: "Elevated",
      },
      defensive: {
        budget: -12,
        media: -10,
        field: -5,
        fundraising: 12,
        pressure: 35,
        strength: 52,
        risk: "High",
      },
    };

    const preset = presets[key] || presets.baseline;

    setSimulationBudgetIncrease(preset.budget);
    setSimulationMediaIncrease(preset.media);
    setSimulationFieldIncrease(preset.field);
    setSimulationFundraisingIncrease(preset.fundraising);
    setSimulationMediaPressure(preset.pressure);
    setSimulationFieldStrength(preset.strength);
    setSimulationRisk(preset.risk);
    setSimulationMessage(
      `${SIMULATION_SCENARIOS.find((item) => item.key === key)?.label || "Scenario"} preset applied.`
    );
  }

  function calculateSimulation() {
    const budgetEffect = simulationBudgetIncrease * 0.025;
    const mediaEffect =
      simulationMediaIncrease * 0.035 +
      (simulationMediaPressure - 50) * 0.018;
    const fieldEffect =
      simulationFieldIncrease * 0.03 +
      (simulationFieldStrength - 50) * 0.02;
    const fundraisingEffect =
      simulationFundraisingIncrease * 0.022;
    const riskPenalty = {
      Low: 0,
      Moderate: 0.3,
      Elevated: 0.8,
      High: 1.5,
      Critical: 2.4,
    }[simulationRisk] || 0;

    const pollingMovement = clamp(
      budgetEffect + mediaEffect + fieldEffect + fundraisingEffect - riskPenalty,
      -8,
      8
    );

    const turnoutMovement = clamp(
      simulationFieldIncrease * 0.045 +
        (simulationFieldStrength - 50) * 0.03 +
        simulationMediaIncrease * 0.008 -
        riskPenalty * 0.4,
      -10,
      12
    );

    const projectedPolling = clamp(
      simulationPollingBaseline + pollingMovement,
      0,
      100
    );

    const projectedTurnout = clamp(
      simulationTurnoutBaseline + turnoutMovement,
      0,
      100
    );

    const projectedFundraising =
      simulationFundraisingBaseline *
      (1 + simulationFundraisingIncrease / 100) *
      (1 + Math.max(0, pollingMovement) / 200);

    const winProbability = clamp(
      50 +
        (projectedPolling - 50) * 4 +
        (projectedTurnout - simulationTurnoutBaseline) * 1.2 -
        riskPenalty * 4,
      2,
      98
    );

    const executionScore = clamp(
      50 +
        simulationFieldStrength * 0.25 +
        simulationMediaPressure * 0.12 +
        simulationFundraisingIncrease * 0.22 +
        simulationBudgetIncrease * 0.18 -
        riskPenalty * 6,
      0,
      100
    );

    const cashImpact =
      budgetTotals.planned * (simulationBudgetIncrease / 100);

    const result = {
      id: `simulation-${Date.now()}`,
      name: simulationName || "Campaign Scenario",
      scenario: simulationScenario,
      createdAt: new Date().toISOString(),
      pollingMovement: roundOne(pollingMovement),
      turnoutMovement: roundOne(turnoutMovement),
      projectedPolling: roundOne(projectedPolling),
      projectedTurnout: roundOne(projectedTurnout),
      projectedFundraising: Math.round(projectedFundraising),
      winProbability: roundOne(winProbability),
      executionScore: roundOne(executionScore),
      cashImpact: Math.round(cashImpact),
      risk: simulationRisk,
      inputs: {
        budgetIncrease: simulationBudgetIncrease,
        mediaIncrease: simulationMediaIncrease,
        fieldIncrease: simulationFieldIncrease,
        fundraisingIncrease: simulationFundraisingIncrease,
        turnoutBaseline: simulationTurnoutBaseline,
        pollingBaseline: simulationPollingBaseline,
        fundraisingBaseline: simulationFundraisingBaseline,
        mediaPressure: simulationMediaPressure,
        fieldStrength: simulationFieldStrength,
      },
    };

    setSimulationResult(result);
    setSimulationHistory((current) => [result, ...current]);
    setSimulationMessage("Campaign simulation completed.");
  }

  function clearSimulation() {
    setSimulationResult(null);
    setSimulationMessage("Simulation results cleared.");
  }

  function removeSimulationHistory(id) {
    setSimulationHistory((current) =>
      current.filter((item) => item.id !== id)
    );
  }

  function loadSimulationHistory(item) {
    setSimulationName(item.name);
    setSimulationScenario(item.scenario);
    setSimulationBudgetIncrease(item.inputs.budgetIncrease);
    setSimulationMediaIncrease(item.inputs.mediaIncrease);
    setSimulationFieldIncrease(item.inputs.fieldIncrease);
    setSimulationFundraisingIncrease(item.inputs.fundraisingIncrease);
    setSimulationTurnoutBaseline(item.inputs.turnoutBaseline);
    setSimulationPollingBaseline(item.inputs.pollingBaseline);
    setSimulationFundraisingBaseline(item.inputs.fundraisingBaseline);
    setSimulationMediaPressure(item.inputs.mediaPressure);
    setSimulationFieldStrength(item.inputs.fieldStrength);
    setSimulationRisk(item.risk);
    setSimulationResult(item);
    setSimulationMessage("Saved simulation loaded.");
  }

  function compareSimulationWithAI() {
    if (!simulationResult) {
      setSimulationMessage("Run a simulation before requesting AI analysis.");
      return;
    }

    const summary = `
Scenario: ${simulationResult.name}
Scenario Type: ${simulationResult.scenario}
Projected polling: ${simulationResult.projectedPolling}%
Polling movement: ${simulationResult.pollingMovement} points
Projected turnout: ${simulationResult.projectedTurnout}%
Turnout movement: ${simulationResult.turnoutMovement} points
Projected fundraising: ${money(simulationResult.projectedFundraising)}
Win probability: ${simulationResult.winProbability}%
Execution score: ${simulationResult.executionScore}%
Cash impact: ${money(simulationResult.cashImpact)}
Risk level: ${simulationResult.risk}
    `.trim();

    ask(
      `Analyze this campaign simulation. Explain the most important assumptions, likely upside, downside risks, operational dependencies, and recommended executive decisions.

${summary}`,
      {
        createDeliverable: true,
        title: `${simulationResult.name} Simulation Analysis`,
        summary: "AI analysis of campaign what-if scenario results.",
      }
    );

    setSimulationMessage("Simulation sent to AI Studio for executive analysis.");
  }

  function saveSimulationToDeliverables() {
    if (!simulationResult) {
      setSimulationMessage("Run a simulation before saving.");
      return;
    }

    const content = `
CAMPAIGN SIMULATION: ${simulationResult.name}

Scenario: ${simulationResult.scenario}
Projected polling: ${simulationResult.projectedPolling}%
Polling movement: ${simulationResult.pollingMovement} points
Projected turnout: ${simulationResult.projectedTurnout}%
Turnout movement: ${simulationResult.turnoutMovement} points
Projected fundraising: ${money(simulationResult.projectedFundraising)}
Win probability: ${simulationResult.winProbability}%
Execution score: ${simulationResult.executionScore}%
Cash impact: ${money(simulationResult.cashImpact)}
Risk level: ${simulationResult.risk}

Inputs
Budget change: ${simulationResult.inputs.budgetIncrease}%
Media change: ${simulationResult.inputs.mediaIncrease}%
Field change: ${simulationResult.inputs.fieldIncrease}%
Fundraising change: ${simulationResult.inputs.fundraisingIncrease}%
Media pressure: ${simulationResult.inputs.mediaPressure}%
Field strength: ${simulationResult.inputs.fieldStrength}%
    `.trim();

    const item = {
      id: `deliverable-${Date.now()}`,
      title: `${simulationResult.name} Simulation`,
      module: "simulation-engine",
      moduleLabel: "Campaign Simulation Engine",
      content,
      summary: "Campaign what-if scenario and projected impact.",
      status: "Draft",
      createdAt: new Date().toISOString(),
    };

    setDeliverables((current) => [item, ...current]);
    setSelectedDeliverable(item);
    setSimulationMessage("Simulation saved to the Deliverable Library.");
  }

  function exportSimulationCsv() {
    if (!simulationResult) {
      setSimulationMessage("Run a simulation before exporting.");
      return;
    }

    const rows = [
      ["Metric", "Value"],
      ["Scenario Name", simulationResult.name],
      ["Scenario Type", simulationResult.scenario],
      ["Polling Movement", simulationResult.pollingMovement],
      ["Projected Polling", simulationResult.projectedPolling],
      ["Turnout Movement", simulationResult.turnoutMovement],
      ["Projected Turnout", simulationResult.projectedTurnout],
      ["Projected Fundraising", simulationResult.projectedFundraising],
      ["Win Probability", simulationResult.winProbability],
      ["Execution Score", simulationResult.executionScore],
      ["Cash Impact", simulationResult.cashImpact],
      ["Risk", simulationResult.risk],
      ["Budget Change", simulationResult.inputs.budgetIncrease],
      ["Media Change", simulationResult.inputs.mediaIncrease],
      ["Field Change", simulationResult.inputs.fieldIncrease],
      ["Fundraising Change", simulationResult.inputs.fundraisingIncrease],
      ["Media Pressure", simulationResult.inputs.mediaPressure],
      ["Field Strength", simulationResult.inputs.fieldStrength],
    ];

    const csv = rows
      .map((row) =>
        row
          .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = `${filenameSafe(
      simulationResult.name
    )}-simulation.csv`;

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);

    setSimulationMessage("Simulation exported as CSV.");
  }

  function buildAssetPrompt() {
    const type = assetTypeByKey(assetType);

    return `
Create ${assetVariants} polished variants of a ${type.label}.

Campaign / Client: ${project.campaign || "Not specified"}
Office: ${project.office || "Not specified"}
Geography: ${project.state || "National"}
Election Cycle: ${project.cycle || "2026"}
Audience: ${assetAudience}
Goal: ${assetGoal}
Tone: ${assetTone}
Length: ${assetLength}
Topic / Issue / Event: ${assetTopic || "Not specified"}
Call to Action: ${assetCallToAction || "Not specified"}
Campaign Notes: ${project.notes || "None"}

Required fields:
${type.fields.map((field) => `- ${field}`).join("\n")}

Requirements:
- Label each variant clearly.
- Keep the copy campaign-ready and editable.
- Distinguish assumptions from verified facts.
- Avoid inventing polling, legal requirements, endorsements, or statistics.
- Include a concise compliance-review note when appropriate.
    `.trim();
  }

  async function generateAsset() {
    if (!assetTopic.trim()) {
      setAssetMessage("Add a topic, issue, event, or campaign objective before generating assets.");
      return;
    }

    setAssetMessage("");
    setAsking(true);
    setError("");

    try {
      const result = await api.askAiCampaignCopilot({
        prompt: buildStudioPrompt(buildAssetPrompt()),
        thread_id: threadId || null,
        agent:
          assetType === "press"
            ? "communications_director"
            : assetType === "direct-mail"
              ? "mailops_director"
              : assetType === "phone-bank" ||
                  assetType === "volunteer-script"
                ? "field_operations_director"
                : "digital_advertising_advisor",
      });

      setThreadId(result?.thread_id || threadId);

      const answer =
        result?.message?.content ||
        result?.answer ||
        "No asset content returned.";

      setAssetOutput(answer);

      const historyItem = {
        id: `asset-${Date.now()}`,
        type: assetType,
        typeLabel: assetTypeByKey(assetType).label,
        tone: assetTone,
        audience: assetAudience,
        goal: assetGoal,
        topic: assetTopic,
        content: answer,
        createdAt: new Date().toISOString(),
      };

      setAssetHistory((current) => [historyItem, ...current]);

      setMessages((current) => [
        ...current,
        {
          id: `asset-user-${Date.now()}`,
          role: "user",
          content: `Generate ${assetVariants} ${assetTypeByKey(assetType).label} variants for: ${assetTopic}`,
          created_at: new Date().toISOString(),
        },
        {
          id: `asset-assistant-${Date.now()}`,
          role: "assistant",
          content: answer,
          created_at: new Date().toISOString(),
        },
      ]);

      setAssetMessage("Campaign asset variants generated.");
      await loadThreads();
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.response?.data?.detail ||
          err?.message ||
          "Failed to generate campaign assets."
      );
    } finally {
      setAsking(false);
    }
  }

  async function copyAssetOutput() {
    if (!assetOutput) {
      setAssetMessage("Generate an asset before copying.");
      return;
    }

    try {
      await navigator.clipboard.writeText(assetOutput);
      setAssetMessage("Asset output copied.");
    } catch {
      setAssetMessage("Unable to copy the asset output.");
    }
  }

  function clearAssetStudio() {
    setAssetOutput("");
    setAssetTopic("");
    setAssetCallToAction("");
    setAssetMessage("Asset Studio cleared.");
  }

  function saveAssetToDeliverables() {
    if (!assetOutput) {
      setAssetMessage("Generate an asset before saving.");
      return;
    }

    const type = assetTypeByKey(assetType);

    const item = {
      id: `deliverable-${Date.now()}`,
      title: `${type.label} Asset Pack`,
      module: "asset-generator",
      moduleLabel: "AI Asset Generator",
      content: assetOutput,
      summary: `${assetVariants} ${type.label.toLowerCase()} variants for ${assetTopic || "the active campaign"}.`,
      status: "Draft",
      createdAt: new Date().toISOString(),
    };

    setDeliverables((current) => [item, ...current]);
    setSelectedDeliverable(item);
    setAssetMessage("Asset pack saved to the Deliverable Library.");
  }

  function loadAssetFromHistory(item) {
    setAssetType(item.type);
    setAssetTone(item.tone);
    setAssetAudience(item.audience);
    setAssetGoal(item.goal);
    setAssetTopic(item.topic);
    setAssetOutput(item.content);
    setAssetMessage("Saved asset loaded into the generator.");
  }

  function removeAssetHistory(id) {
    setAssetHistory((current) =>
      current.filter((item) => item.id !== id)
    );
  }

  function exportAssetText() {
    if (!assetOutput) {
      setAssetMessage("Generate an asset before exporting.");
      return;
    }

    const type = assetTypeByKey(assetType);
    const text = [
      "VoterSpheres Campaign Operations Studio AI",
      type.label,
      "",
      `Campaign: ${project.campaign || "Not specified"}`,
      `Geography: ${project.state || "National"}`,
      `Audience: ${assetAudience}`,
      `Goal: ${assetGoal}`,
      `Tone: ${assetTone}`,
      `Topic: ${assetTopic || "Not specified"}`,
      "",
      assetOutput,
    ].join("\n");

    const blob = new Blob([text], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = `${filenameSafe(
      project.campaign || "campaign"
    )}-${assetType}.txt`;

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);

    setAssetMessage("Campaign asset exported as text.");
  }

  function updateBudgetItem(id, field, value) {
    setBudgetItems((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]:
                ["planned", "committed", "spent"].includes(field)
                  ? numberValue(value)
                  : value,
            }
          : item
      )
    );
  }

  function addBudgetItem() {
    setBudgetItems((current) => [
      ...current,
      {
        id: `budget-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}`,
        category: "Operations",
        planned: 0,
        committed: 0,
        spent: 0,
        notes: "",
      },
    ]);
  }

  function removeBudgetItem(id) {
    setBudgetItems((current) =>
      current.filter((item) => item.id !== id)
    );
  }

  function applyBudgetScenario() {
    const scenario =
      BUDGET_SCENARIOS.find(
        (item) => item.key === budgetScenario
      ) || BUDGET_SCENARIOS[0];

    setBudgetItems((current) =>
      current.map((item) => ({
        ...item,
        planned: Math.round(item.planned * scenario.multiplier),
      }))
    );

    setBudgetMessage(
      `${scenario.label} scenario applied to planned category budgets.`
    );
  }

  function resetBudgetPlanner() {
    setBudgetItems([]);
    setBudgetMessage("Campaign budget planner cleared.");
  }

  function generateBudgetWithAI() {
    const summary = budgetItems
      .map(
        (item) =>
          `${item.category}: planned ${money(
            item.planned
          )}, committed ${money(item.committed)}, spent ${money(
            item.spent
          )}`
      )
      .join("\n");

    ask(
      `Create a professional campaign budget and cash-flow plan using the following current budget data.

Revenue goal: ${money(budgetRevenueGoal)}
Cash on hand: ${money(budgetCashOnHand)}
Budget period: ${budgetStartDate} to ${budgetEndDate}
Scenario: ${budgetScenario}

Current category budget:
${summary}

Provide recommended category allocations, monthly pacing, burn-rate targets, fundraising requirements, cash reserve, risk flags, and executive recommendations.`,
      {
        createDeliverable: true,
        title: "Campaign Budget and Cash-Flow Plan",
        summary:
          "AI-generated budget allocation, pacing, burn rate, and funding recommendations.",
      }
    );

    setBudgetMessage(
      "Campaign budget sent to AI Studio for analysis and recommendations."
    );
  }

  function exportBudgetCsv() {
    if (!budgetItems.length) {
      setBudgetMessage("Add budget categories before exporting.");
      return;
    }

    const escapeCsv = (value) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const header = [
      "Category",
      "Planned",
      "Committed",
      "Spent",
      "Remaining",
      "Spend Percentage",
      "Notes",
    ];

    const rows = budgetItems.map((item) => {
      const remaining =
        numberValue(item.planned) - numberValue(item.spent);
      const spendPercentage = item.planned
        ? Math.round(
            (numberValue(item.spent) /
              numberValue(item.planned)) *
              100
          )
        : 0;

      return [
        item.category,
        item.planned,
        item.committed,
        item.spent,
        remaining,
        `${spendPercentage}%`,
        item.notes,
      ]
        .map(escapeCsv)
        .join(",");
    });

    const summaryRows = [
      [],
      ["Revenue Goal", budgetRevenueGoal],
      ["Cash On Hand", budgetCashOnHand],
      ["Budget Start", budgetStartDate],
      ["Budget End", budgetEndDate],
      ["Scenario", budgetScenario],
    ].map((row) => row.map(escapeCsv).join(","));

    const csv = [
      header.map(escapeCsv).join(","),
      ...rows,
      ...summaryRows,
    ].join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = `${filenameSafe(
      project.campaign || "campaign"
    )}-budget.csv`;

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);

    setBudgetMessage("Campaign budget exported as CSV.");
  }

  const budgetTotals = useMemo(() => {
    const planned = budgetItems.reduce(
      (sum, item) => sum + numberValue(item.planned),
      0
    );
    const committed = budgetItems.reduce(
      (sum, item) => sum + numberValue(item.committed),
      0
    );
    const spent = budgetItems.reduce(
      (sum, item) => sum + numberValue(item.spent),
      0
    );
    const remaining = planned - spent;
    const availableCash =
      numberValue(budgetCashOnHand) - committed;
    const fundingGap = Math.max(
      0,
      planned - numberValue(budgetRevenueGoal)
    );

    return {
      planned,
      committed,
      spent,
      remaining,
      availableCash,
      fundingGap,
      spendPercentage: planned
        ? Math.round((spent / planned) * 100)
        : 0,
      committedPercentage: planned
        ? Math.round((committed / planned) * 100)
        : 0,
    };
  }, [budgetItems, budgetCashOnHand, budgetRevenueGoal]);

  const budgetPeriodDays = useMemo(() => {
    const start = new Date(budgetStartDate);
    const end = new Date(budgetEndDate);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime())
    ) {
      return 1;
    }

    return Math.max(
      1,
      Math.ceil((end.getTime() - start.getTime()) / 86400000)
    );
  }, [budgetStartDate, budgetEndDate]);

  const dailyBurnRate = useMemo(
    () => budgetTotals.planned / budgetPeriodDays,
    [budgetTotals.planned, budgetPeriodDays]
  );

  const monthlyBurnRate = dailyBurnRate * 30.4375;

  const budgetRiskLevel = useMemo(() => {
    if (
      budgetTotals.fundingGap > 0 ||
      budgetTotals.committed > budgetCashOnHand
    ) {
      return "High";
    }

    if (
      budgetTotals.spendPercentage > 75 ||
      budgetTotals.committedPercentage > 85
    ) {
      return "Elevated";
    }

    return "Controlled";
  }, [budgetTotals, budgetCashOnHand]);

  const stats = useMemo(() => ({
    threads: threads.length,
    messages: messages.length,
    deliverables: deliverables.length,
    completeChecklist: checklist.filter((item) => item.complete).length,
    timelineItems: timelineItems.length,
    timelineProgress,
    budgetPlanned: budgetTotals.planned,
    budgetSpent: budgetTotals.spent,
  }), [
    threads,
    messages,
    deliverables,
    checklist,
    timelineItems,
    timelineProgress,
    budgetTotals.planned,
    budgetTotals.spent,
  ]);

  const navSections = [
    { id: "studio-overview", label: "Overview" },
    { id: "studio-project", label: "Project Setup" },
    { id: "studio-modules", label: "Builder Modules" },
    { id: "studio-workspace", label: "AI Workspace", badge: stats.messages },
    { id: "studio-deliverables", label: "Deliverables", badge: stats.deliverables },
    { id: "studio-documents", label: "Document Generator" },
    { id: "studio-timeline", label: "Timeline Builder", badge: stats.timelineItems },
    { id: "studio-budget", label: "Budget Planner" },
    { id: "studio-assets", label: "Asset Generator", badge: assetHistory.length },
    { id: "studio-simulation", label: "Simulation Engine", badge: simulationHistory.length },
    { id: "studio-presentation", label: "Presentation Builder", badge: presentationSlides.length },
    { id: "studio-intelligence", label: "Intelligence Center", badge: intelligenceRiskCount },
    { id: "studio-launch", label: "Launch Checklist" },
    { id: "studio-history", label: "Studio History" },
  ];


  return (
    <PageShell
      eyebrow="Campaign Operations Studio AI"
      title="Campaign Operations Studio AI"
      description="Build complete campaign strategy, messaging, field, fundraising, media, mail, digital, compliance, and execution plans in one guided production workspace."
      tickerItems={[
        { label: "Active Module", value: activeModule.label, dotClass: "vs-live-dot-success" },
        { label: "Deliverables", value: String(stats.deliverables), dotClass: "vs-live-dot-success" },
        { label: "Launch Ready", value: `${stats.completeChecklist}/${checklist.length}`, dotClass: stats.completeChecklist === checklist.length ? "vs-live-dot-success" : "vs-live-dot-warning" },
        { label: "Updated", value: lastUpdated || "Ready", dotClass: "vs-live-dot-success" },
      ]}
    >
      <style>{`
        .studio-stack{display:grid;gap:18px;min-width:0}
        .studio-hero{display:grid;grid-template-columns:minmax(320px,1.05fr) minmax(0,.95fr);gap:18px;border:1px solid rgba(96,165,250,.22);border-radius:28px;padding:22px;background:radial-gradient(circle at top right,rgba(37,99,235,.22),transparent 36%),radial-gradient(circle at bottom left,rgba(168,85,247,.15),transparent 32%),linear-gradient(145deg,rgba(2,6,23,.97),rgba(15,23,42,.9));box-shadow:0 30px 90px rgba(2,6,23,.34)}
        .studio-hero-copy>span,.studio-hero-metrics span,.studio-project-grid span,.studio-deliverable-card>div>span{display:block;color:rgba(147,197,253,.86);font-size:10px;font-weight:950;letter-spacing:.1em;text-transform:uppercase}
        .studio-hero-copy>strong{display:block;margin-top:8px;color:white;font-size:clamp(34px,5vw,58px);line-height:.98;letter-spacing:-.075em}
        .studio-hero-copy p{margin:14px 0 0;color:rgba(226,232,240,.78);line-height:1.65;max-width:760px}
        .studio-badges,.studio-hero-actions,.studio-card-actions,.studio-deliverable-meta,.studio-ai-actions{display:flex;gap:9px;flex-wrap:wrap;align-items:center}
        .studio-production-toolbar{margin-top:14px;padding-top:14px;border-top:1px solid rgba(148,163,184,.12)}
        .studio-production-toolbar button:disabled{opacity:.48;cursor:not-allowed}
        .studio-production-toolbar button:nth-last-child(-n+5){background:rgba(2,6,23,.5)}
        .studio-production-toolbar button:nth-last-child(-n+5):hover{background:rgba(37,99,235,.2)}
        .studio-badges{margin-top:16px}
        .studio-hero-metrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
        .studio-hero-metrics>div,.studio-active-module,.studio-prompt-box,.studio-ai-panel,.studio-selected-deliverable{border:1px solid rgba(148,163,184,.13);border-radius:18px;background:rgba(2,6,23,.32);padding:14px}
        .studio-hero-metrics strong{display:block;margin-top:7px;color:white;font-size:18px;overflow-wrap:anywhere}
        .studio-hero-actions{grid-column:1/-1;border-top:1px solid rgba(148,163,184,.12);padding-top:15px}
        .studio-hero-actions button,.studio-hero-actions a,.studio-card-actions button,.studio-ai-actions button{border:1px solid rgba(148,163,184,.17);border-radius:14px;background:rgba(15,23,42,.68);color:rgba(241,245,249,.94);padding:10px 12px;font-size:11px;font-weight:850;text-decoration:none;cursor:pointer}
        .studio-hero-actions button:hover,.studio-hero-actions a:hover,.studio-card-actions button:hover,.studio-ai-actions button:hover{border-color:rgba(96,165,250,.5);background:rgba(37,99,235,.18)}
        .studio-project-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
        .studio-project-grid label{display:grid;gap:7px}.studio-project-wide{grid-column:1/-1}
        .studio-project-grid input,.studio-project-grid select,.studio-project-grid textarea,.studio-composer textarea{width:100%;border:1px solid rgba(148,163,184,.17);border-radius:14px;background:rgba(2,6,23,.42);color:white;padding:11px 12px;outline:none}
        .studio-project-grid textarea{min-height:110px;resize:vertical}
        .studio-module-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px}
        .studio-module-card{text-align:left;border:1px solid rgba(148,163,184,.13);border-radius:20px;background:rgba(15,23,42,.54);color:rgba(226,232,240,.9);padding:15px;cursor:pointer;display:grid;gap:9px}
        .studio-module-card.is-active{border-color:rgba(96,165,250,.62);background:radial-gradient(circle at top right,rgba(59,130,246,.18),transparent 38%),rgba(15,23,42,.72);box-shadow:0 0 0 1px rgba(96,165,250,.14) inset}
        .studio-module-icon{font-size:27px}.studio-module-card strong{color:white;font-size:15px}.studio-module-card p{margin:0;color:rgba(203,213,225,.74);line-height:1.5;font-size:12px}.studio-module-card>div{display:grid;gap:5px}.studio-module-card small{color:rgba(147,197,253,.78);font-size:10px}
        .studio-workspace-grid{display:grid;grid-template-columns:minmax(280px,.34fr) minmax(0,1fr);gap:16px}.studio-sidebar{display:grid;gap:14px;align-content:start}
        .studio-active-module strong,.studio-selected-deliverable strong{display:block;color:white;font-size:18px}.studio-active-module p,.studio-selected-deliverable p{color:rgba(203,213,225,.76);line-height:1.55;font-size:12px}
        .studio-prompt-box{display:grid;gap:8px}.studio-prompt-box button{border:1px solid rgba(148,163,184,.13);border-radius:12px;background:rgba(2,6,23,.3);color:rgba(226,232,240,.88);padding:10px;text-align:left;cursor:pointer;font-size:11px}
        .studio-messages{display:grid;gap:12px;max-height:620px;overflow:auto;padding-right:3px}
        .studio-message{border:1px solid rgba(148,163,184,.13);border-radius:18px;padding:14px;color:rgba(226,232,240,.92);line-height:1.65;white-space:pre-wrap}.studio-message.user{margin-left:60px;background:rgba(37,99,235,.16)}.studio-message.assistant{margin-right:60px;background:radial-gradient(circle at top right,rgba(59,130,246,.1),transparent 36%),rgba(2,6,23,.34)}.studio-message small{display:block;margin-bottom:7px;color:rgba(148,163,184,.68);font-size:9px;text-transform:uppercase;letter-spacing:.08em}
        .studio-composer{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;margin-top:14px}.studio-composer textarea{min-height:100px;resize:vertical}.studio-ai-actions{margin-top:12px}
        .studio-deliverable-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:12px}.studio-deliverable-card{border:1px solid rgba(148,163,184,.13);border-radius:18px;background:rgba(15,23,42,.48);padding:14px;display:grid;gap:12px}.studio-deliverable-card strong{display:block;margin-top:5px;color:white;font-size:15px}.studio-deliverable-card p{margin:7px 0 0;color:rgba(203,213,225,.72);font-size:12px;line-height:1.5}.studio-deliverable-meta{justify-content:space-between}.studio-deliverable-meta small{color:rgba(148,163,184,.68)}
        .studio-checklist{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:10px}.studio-checklist button{border:1px solid rgba(148,163,184,.13);border-radius:16px;background:rgba(15,23,42,.46);color:rgba(226,232,240,.9);padding:13px;display:grid;grid-template-columns:auto minmax(0,1fr);gap:11px;align-items:center;text-align:left;cursor:pointer}.studio-checklist button.is-complete{border-color:rgba(34,197,94,.34);background:rgba(34,197,94,.08)}.studio-checklist button>span{width:34px;height:34px;border-radius:999px;display:grid;place-items:center;background:rgba(59,130,246,.16)}.studio-checklist strong{display:block;color:white;font-size:12px}.studio-checklist small{display:block;margin-top:4px;color:rgba(148,163,184,.72);font-size:10px}
        .studio-thread-list{display:grid;gap:9px}.studio-thread{border:1px solid rgba(148,163,184,.13);border-radius:14px;background:rgba(15,23,42,.46);padding:11px;cursor:pointer}.studio-thread strong{display:block;color:white;font-size:12px}.studio-thread span{display:block;margin-top:4px;color:rgba(148,163,184,.68);font-size:10px}

        .studio-document-shell{display:grid;grid-template-columns:minmax(260px,.34fr) minmax(0,1fr);gap:16px}
        .studio-document-templates,.studio-document-config{display:grid;gap:10px}
        .studio-document-template{border:1px solid rgba(148,163,184,.13);border-radius:15px;background:rgba(15,23,42,.46);color:rgba(226,232,240,.9);padding:12px;text-align:left;cursor:pointer}
        .studio-document-template.is-active{border-color:rgba(96,165,250,.58);background:rgba(37,99,235,.14)}
        .studio-document-template strong{display:block;color:white;font-size:12px}
        .studio-document-template small{display:block;margin-top:5px;color:rgba(148,163,184,.75);font-size:10px;line-height:1.45}
        .studio-document-config{border:1px solid rgba(148,163,184,.13);border-radius:20px;background:rgba(15,23,42,.46);padding:15px}
        .studio-document-config label{display:grid;gap:7px}
        .studio-document-config label>span{color:rgba(147,197,253,.86);font-size:9px;font-weight:950;letter-spacing:.08em;text-transform:uppercase}
        .studio-document-config input,.studio-document-config select{width:100%;border:1px solid rgba(148,163,184,.16);border-radius:12px;background:rgba(2,6,23,.42);color:white;padding:10px}
        .studio-document-options{display:flex;gap:12px;flex-wrap:wrap}
        .studio-document-options label{display:flex;grid-template-columns:none;align-items:center;gap:7px;color:rgba(203,213,225,.8);font-size:10px}
        .studio-document-actions{display:flex;gap:9px;flex-wrap:wrap;border-top:1px solid rgba(148,163,184,.12);padding-top:12px}
        .studio-document-actions button{border:1px solid rgba(148,163,184,.17);border-radius:13px;background:rgba(2,6,23,.48);color:white;padding:10px 12px;font-size:11px;font-weight:850;cursor:pointer}
        .studio-document-actions button:hover{border-color:rgba(96,165,250,.48);background:rgba(37,99,235,.18)}
        .studio-document-note{border:1px dashed rgba(148,163,184,.17);border-radius:13px;padding:12px;color:rgba(203,213,225,.72);font-size:11px;line-height:1.55}

        .studio-timeline-shell{display:grid;gap:14px}
        .studio-timeline-controls{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}
        .studio-timeline-controls label{display:grid;gap:6px}
        .studio-timeline-controls span{color:rgba(147,197,253,.86);font-size:9px;font-weight:950;letter-spacing:.08em;text-transform:uppercase}
        .studio-timeline-controls input,.studio-timeline-controls select{width:100%;border:1px solid rgba(148,163,184,.16);border-radius:12px;background:rgba(2,6,23,.42);color:white;padding:10px}
        .studio-timeline-actions{display:flex;gap:8px;flex-wrap:wrap}
        .studio-timeline-actions button{border:1px solid rgba(148,163,184,.17);border-radius:13px;background:rgba(2,6,23,.48);color:white;padding:10px 12px;font-size:11px;font-weight:850;cursor:pointer}
        .studio-timeline-actions button:hover{border-color:rgba(96,165,250,.48);background:rgba(37,99,235,.18)}
        .studio-timeline-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
        .studio-timeline-summary>div{border:1px solid rgba(148,163,184,.13);border-radius:15px;background:rgba(15,23,42,.46);padding:12px}
        .studio-timeline-summary span{display:block;color:rgba(147,197,253,.8);font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:.08em}
        .studio-timeline-summary strong{display:block;margin-top:6px;color:white;font-size:17px}
        .studio-timeline-list{display:grid;gap:10px}
        .studio-timeline-item{border:1px solid rgba(148,163,184,.13);border-radius:18px;background:rgba(15,23,42,.46);padding:13px;display:grid;grid-template-columns:minmax(220px,1.3fr) repeat(5,minmax(120px,.7fr)) auto;gap:9px;align-items:end}
        .studio-timeline-item label{display:grid;gap:5px}
        .studio-timeline-item label span{color:rgba(148,163,184,.72);font-size:8px;font-weight:900;text-transform:uppercase;letter-spacing:.07em}
        .studio-timeline-item input,.studio-timeline-item select{width:100%;border:1px solid rgba(148,163,184,.14);border-radius:10px;background:rgba(2,6,23,.38);color:white;padding:9px;font-size:10px}
        .studio-timeline-item-actions{display:flex;gap:6px;align-items:center}
        .studio-timeline-item-actions button{border:1px solid rgba(148,163,184,.14);border-radius:10px;background:rgba(2,6,23,.4);color:white;padding:9px;cursor:pointer}
        .studio-timeline-message{border:1px solid rgba(96,165,250,.22);border-radius:13px;background:rgba(37,99,235,.1);color:rgba(219,234,254,.92);padding:11px;font-size:11px}


        .studio-budget-shell{display:grid;gap:14px}
        .studio-budget-controls{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}
        .studio-budget-controls label{display:grid;gap:6px}
        .studio-budget-controls span,.studio-budget-summary span,.studio-budget-row label span{color:rgba(147,197,253,.84);font-size:9px;font-weight:950;letter-spacing:.08em;text-transform:uppercase}
        .studio-budget-controls input,.studio-budget-controls select,.studio-budget-row input,.studio-budget-row select{width:100%;border:1px solid rgba(148,163,184,.16);border-radius:11px;background:rgba(2,6,23,.42);color:white;padding:10px}
        .studio-budget-actions{display:flex;gap:8px;flex-wrap:wrap}
        .studio-budget-actions button{border:1px solid rgba(148,163,184,.17);border-radius:13px;background:rgba(2,6,23,.48);color:white;padding:10px 12px;font-size:11px;font-weight:850;cursor:pointer}
        .studio-budget-actions button:hover{border-color:rgba(96,165,250,.48);background:rgba(37,99,235,.18)}
        .studio-budget-summary{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px}
        .studio-budget-summary>div{border:1px solid rgba(148,163,184,.13);border-radius:15px;background:rgba(15,23,42,.46);padding:12px}
        .studio-budget-summary strong{display:block;margin-top:6px;color:white;font-size:16px;overflow-wrap:anywhere}
        .studio-budget-summary small{display:block;margin-top:4px;color:rgba(148,163,184,.7);font-size:9px}
        .studio-budget-risk.high{border-color:rgba(239,68,68,.35);background:rgba(239,68,68,.08)}
        .studio-budget-risk.elevated{border-color:rgba(245,158,11,.35);background:rgba(245,158,11,.08)}
        .studio-budget-risk.controlled{border-color:rgba(34,197,94,.35);background:rgba(34,197,94,.08)}
        .studio-budget-table{display:grid;gap:9px}
        .studio-budget-row{border:1px solid rgba(148,163,184,.13);border-radius:17px;background:rgba(15,23,42,.46);padding:12px;display:grid;grid-template-columns:minmax(160px,1fr) repeat(3,minmax(120px,.65fr)) minmax(120px,.65fr) minmax(180px,1fr) auto;gap:9px;align-items:end}
        .studio-budget-row label{display:grid;gap:5px}
        .studio-budget-remaining{border:1px solid rgba(148,163,184,.12);border-radius:10px;background:rgba(2,6,23,.34);padding:9px}
        .studio-budget-remaining strong{display:block;color:white;font-size:12px}
        .studio-budget-remaining small{display:block;margin-top:3px;color:rgba(148,163,184,.7);font-size:9px}
        .studio-budget-row-actions{display:flex;align-items:center}
        .studio-budget-row-actions button{border:1px solid rgba(148,163,184,.14);border-radius:10px;background:rgba(2,6,23,.4);color:white;padding:9px;cursor:pointer}
        .studio-budget-progress{height:9px;border-radius:999px;background:rgba(148,163,184,.13);overflow:hidden;margin-top:7px}
        .studio-budget-progress>span{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,rgba(59,130,246,.9),rgba(34,197,94,.85))}
        .studio-budget-message{border:1px solid rgba(96,165,250,.22);border-radius:13px;background:rgba(37,99,235,.1);color:rgba(219,234,254,.92);padding:11px;font-size:11px}


        .studio-asset-shell{display:grid;grid-template-columns:minmax(260px,.34fr) minmax(0,1fr);gap:16px}
        .studio-asset-types{display:grid;gap:9px;align-content:start}
        .studio-asset-type{border:1px solid rgba(148,163,184,.13);border-radius:15px;background:rgba(15,23,42,.46);color:rgba(226,232,240,.9);padding:12px;text-align:left;cursor:pointer}
        .studio-asset-type.is-active{border-color:rgba(96,165,250,.58);background:rgba(37,99,235,.14)}
        .studio-asset-type strong{display:block;color:white;font-size:12px}
        .studio-asset-type small{display:block;margin-top:5px;color:rgba(148,163,184,.75);font-size:10px;line-height:1.45}
        .studio-asset-workspace{display:grid;gap:14px}
        .studio-asset-config{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;border:1px solid rgba(148,163,184,.13);border-radius:20px;background:rgba(15,23,42,.46);padding:15px}
        .studio-asset-config label{display:grid;gap:6px}
        .studio-asset-config label>span{color:rgba(147,197,253,.86);font-size:9px;font-weight:950;letter-spacing:.08em;text-transform:uppercase}
        .studio-asset-config input,.studio-asset-config select,.studio-asset-config textarea{width:100%;border:1px solid rgba(148,163,184,.16);border-radius:12px;background:rgba(2,6,23,.42);color:white;padding:10px}
        .studio-asset-wide{grid-column:1/-1}
        .studio-asset-config textarea{min-height:90px;resize:vertical}
        .studio-asset-actions{display:flex;gap:8px;flex-wrap:wrap;grid-column:1/-1;border-top:1px solid rgba(148,163,184,.12);padding-top:12px}
        .studio-asset-actions button{border:1px solid rgba(148,163,184,.17);border-radius:13px;background:rgba(2,6,23,.48);color:white;padding:10px 12px;font-size:11px;font-weight:850;cursor:pointer}
        .studio-asset-actions button:hover{border-color:rgba(96,165,250,.48);background:rgba(37,99,235,.18)}
        .studio-asset-output{border:1px solid rgba(96,165,250,.2);border-radius:20px;background:radial-gradient(circle at top right,rgba(59,130,246,.1),transparent 36%),rgba(2,6,23,.34);padding:16px;white-space:pre-wrap;color:rgba(226,232,240,.94);line-height:1.65;min-height:240px}
        .studio-asset-message{border:1px solid rgba(96,165,250,.22);border-radius:13px;background:rgba(37,99,235,.1);color:rgba(219,234,254,.92);padding:11px;font-size:11px}
        .studio-asset-history{display:grid;gap:9px}
        .studio-asset-history-item{border:1px solid rgba(148,163,184,.13);border-radius:15px;background:rgba(15,23,42,.46);padding:12px;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center}
        .studio-asset-history-item strong{display:block;color:white;font-size:12px}
        .studio-asset-history-item small{display:block;margin-top:4px;color:rgba(148,163,184,.72);font-size:9px}
        .studio-asset-history-actions{display:flex;gap:6px}
        .studio-asset-history-actions button{border:1px solid rgba(148,163,184,.14);border-radius:10px;background:rgba(2,6,23,.4);color:white;padding:8px;cursor:pointer}


        .studio-simulation-shell{display:grid;gap:14px}
        .studio-simulation-presets{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px}
        .studio-simulation-preset{border:1px solid rgba(148,163,184,.13);border-radius:16px;background:rgba(15,23,42,.46);color:rgba(226,232,240,.9);padding:12px;text-align:left;cursor:pointer}
        .studio-simulation-preset.is-active{border-color:rgba(96,165,250,.58);background:rgba(37,99,235,.14)}
        .studio-simulation-preset strong{display:block;color:white;font-size:12px}
        .studio-simulation-preset small{display:block;margin-top:5px;color:rgba(148,163,184,.75);font-size:10px;line-height:1.45}
        .studio-simulation-controls{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;border:1px solid rgba(148,163,184,.13);border-radius:20px;background:rgba(15,23,42,.46);padding:15px}
        .studio-simulation-controls label{display:grid;gap:6px}
        .studio-simulation-controls label>span{color:rgba(147,197,253,.86);font-size:9px;font-weight:950;letter-spacing:.08em;text-transform:uppercase}
        .studio-simulation-controls input,.studio-simulation-controls select{width:100%;border:1px solid rgba(148,163,184,.16);border-radius:12px;background:rgba(2,6,23,.42);color:white;padding:10px}
        .studio-simulation-wide{grid-column:1/-1}
        .studio-simulation-actions{display:flex;gap:8px;flex-wrap:wrap;grid-column:1/-1;border-top:1px solid rgba(148,163,184,.12);padding-top:12px}
        .studio-simulation-actions button{border:1px solid rgba(148,163,184,.17);border-radius:13px;background:rgba(2,6,23,.48);color:white;padding:10px 12px;font-size:11px;font-weight:850;cursor:pointer}
        .studio-simulation-actions button:hover{border-color:rgba(96,165,250,.48);background:rgba(37,99,235,.18)}
        .studio-simulation-results{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
        .studio-simulation-results>div{border:1px solid rgba(148,163,184,.13);border-radius:16px;background:rgba(15,23,42,.46);padding:13px}
        .studio-simulation-results span{display:block;color:rgba(147,197,253,.82);font-size:9px;font-weight:950;letter-spacing:.08em;text-transform:uppercase}
        .studio-simulation-results strong{display:block;margin-top:6px;color:white;font-size:19px}
        .studio-simulation-results small{display:block;margin-top:4px;color:rgba(148,163,184,.7);font-size:9px}
        .studio-simulation-positive{border-color:rgba(34,197,94,.3)!important;background:rgba(34,197,94,.07)!important}
        .studio-simulation-negative{border-color:rgba(239,68,68,.3)!important;background:rgba(239,68,68,.07)!important}
        .studio-simulation-message{border:1px solid rgba(96,165,250,.22);border-radius:13px;background:rgba(37,99,235,.1);color:rgba(219,234,254,.92);padding:11px;font-size:11px}
        .studio-simulation-history{display:grid;gap:9px}
        .studio-simulation-history-item{border:1px solid rgba(148,163,184,.13);border-radius:15px;background:rgba(15,23,42,.46);padding:12px;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center}
        .studio-simulation-history-item strong{display:block;color:white;font-size:12px}
        .studio-simulation-history-item small{display:block;margin-top:4px;color:rgba(148,163,184,.72);font-size:9px}
        .studio-simulation-history-actions{display:flex;gap:6px}
        .studio-simulation-history-actions button{border:1px solid rgba(148,163,184,.14);border-radius:10px;background:rgba(2,6,23,.4);color:white;padding:8px;cursor:pointer}


        .studio-presentation-shell{display:grid;grid-template-columns:minmax(260px,.32fr) minmax(0,1fr);gap:16px}
        .studio-presentation-controls{display:grid;gap:10px;align-content:start;border:1px solid rgba(148,163,184,.13);border-radius:20px;background:rgba(15,23,42,.46);padding:14px}
        .studio-presentation-controls label{display:grid;gap:6px}
        .studio-presentation-controls label>span,.studio-slide-editor label>span{color:rgba(147,197,253,.86);font-size:9px;font-weight:950;letter-spacing:.08em;text-transform:uppercase}
        .studio-presentation-controls input,.studio-presentation-controls select,.studio-slide-editor input,.studio-slide-editor textarea{width:100%;border:1px solid rgba(148,163,184,.16);border-radius:12px;background:rgba(2,6,23,.42);color:white;padding:10px}
        .studio-presentation-actions{display:flex;gap:8px;flex-wrap:wrap;border-top:1px solid rgba(148,163,184,.12);padding-top:12px}
        .studio-presentation-actions button{border:1px solid rgba(148,163,184,.17);border-radius:13px;background:rgba(2,6,23,.48);color:white;padding:10px 12px;font-size:11px;font-weight:850;cursor:pointer}
        .studio-presentation-actions button:hover{border-color:rgba(96,165,250,.48);background:rgba(37,99,235,.18)}
        .studio-slide-grid{display:grid;grid-template-columns:220px minmax(0,1fr);gap:14px}
        .studio-slide-list{display:grid;gap:8px;align-content:start;max-height:680px;overflow:auto}
        .studio-slide-thumb{border:1px solid rgba(148,163,184,.13);border-radius:14px;background:rgba(15,23,42,.46);color:rgba(226,232,240,.9);padding:11px;text-align:left;cursor:pointer}
        .studio-slide-thumb.is-active{border-color:rgba(96,165,250,.58);background:rgba(37,99,235,.14)}
        .studio-slide-thumb strong{display:block;color:white;font-size:12px}
        .studio-slide-thumb small{display:block;margin-top:5px;color:rgba(148,163,184,.72);font-size:9px}
        .studio-slide-preview{border:1px solid rgba(96,165,250,.22);border-radius:22px;background:radial-gradient(circle at top right,rgba(59,130,246,.16),transparent 38%),linear-gradient(145deg,rgba(2,6,23,.96),rgba(15,23,42,.9));padding:24px;min-height:320px;display:grid;align-content:center}
        .studio-slide-preview span{color:rgba(147,197,253,.88);font-size:10px;font-weight:950;letter-spacing:.1em;text-transform:uppercase}
        .studio-slide-preview h3{margin:10px 0 12px;color:white;font-size:32px;letter-spacing:-.04em;line-height:1.05}
        .studio-slide-preview p{color:rgba(219,234,254,.86);line-height:1.55}
        .studio-slide-preview ul{color:white;line-height:1.55}
        .studio-slide-editor{display:grid;gap:10px;margin-top:12px;border:1px solid rgba(148,163,184,.13);border-radius:20px;background:rgba(15,23,42,.46);padding:14px}
        .studio-slide-editor textarea{min-height:90px;resize:vertical}
        .studio-slide-editor-actions{display:flex;gap:8px;flex-wrap:wrap}
        .studio-slide-editor-actions button{border:1px solid rgba(148,163,184,.17);border-radius:13px;background:rgba(2,6,23,.48);color:white;padding:9px 11px;font-size:11px;font-weight:850;cursor:pointer}
        .studio-presentation-message{border:1px solid rgba(96,165,250,.22);border-radius:13px;background:rgba(37,99,235,.1);color:rgba(219,234,254,.92);padding:11px;font-size:11px}


        .studio-intelligence-shell{display:grid;gap:14px}
        .studio-intelligence-topbar{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
        .studio-intelligence-topbar button{border:1px solid rgba(148,163,184,.17);border-radius:13px;background:rgba(2,6,23,.48);color:white;padding:10px 12px;font-size:11px;font-weight:850;cursor:pointer}
        .studio-intelligence-topbar button:hover{border-color:rgba(96,165,250,.48);background:rgba(37,99,235,.18)}
        .studio-intelligence-tabs{display:flex;gap:8px;flex-wrap:wrap}
        .studio-intelligence-tabs button{border:1px solid rgba(148,163,184,.13);border-radius:999px;background:rgba(15,23,42,.46);color:rgba(226,232,240,.85);padding:9px 12px;font-size:10px;font-weight:850;cursor:pointer}
        .studio-intelligence-tabs button.is-active{border-color:rgba(96,165,250,.58);background:rgba(37,99,235,.16);color:white}
        .studio-health-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}
        .studio-health-card{border:1px solid rgba(148,163,184,.13);border-radius:16px;background:rgba(15,23,42,.46);padding:13px}
        .studio-health-card span{display:block;color:rgba(147,197,253,.82);font-size:9px;font-weight:950;letter-spacing:.08em;text-transform:uppercase}
        .studio-health-card strong{display:block;margin-top:6px;color:white;font-size:20px}
        .studio-health-card small{display:block;margin-top:4px;color:rgba(148,163,184,.72);font-size:9px}
        .studio-intelligence-panel{border:1px solid rgba(148,163,184,.13);border-radius:20px;background:rgba(15,23,42,.46);padding:15px}
        .studio-intelligence-panel h3{margin:0;color:white;font-size:18px}
        .studio-intelligence-panel p{color:rgba(203,213,225,.74);line-height:1.55;font-size:12px}
        .studio-intelligence-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
        .studio-intelligence-form{display:grid;gap:10px}
        .studio-intelligence-form label{display:grid;gap:6px}
        .studio-intelligence-form label>span{color:rgba(147,197,253,.86);font-size:9px;font-weight:950;letter-spacing:.08em;text-transform:uppercase}
        .studio-intelligence-form input,.studio-intelligence-form select,.studio-intelligence-form textarea{width:100%;border:1px solid rgba(148,163,184,.16);border-radius:12px;background:rgba(2,6,23,.42);color:white;padding:10px}
        .studio-intelligence-form textarea{min-height:90px;resize:vertical}
        .studio-list-stack{display:grid;gap:9px}
        .studio-list-item{border:1px solid rgba(148,163,184,.13);border-radius:15px;background:rgba(2,6,23,.28);padding:12px}
        .studio-list-item strong{display:block;color:white;font-size:12px}
        .studio-list-item p{margin:5px 0 0;color:rgba(203,213,225,.72);font-size:10px;line-height:1.45}
        .studio-list-actions{display:flex;gap:6px;flex-wrap:wrap;margin-top:9px}
        .studio-list-actions button{border:1px solid rgba(148,163,184,.14);border-radius:10px;background:rgba(2,6,23,.4);color:white;padding:8px;cursor:pointer;font-size:10px}
        .studio-media-row,.studio-recommendation-row{display:grid;grid-template-columns:minmax(180px,1.3fr) repeat(4,minmax(110px,.65fr)) auto;gap:8px;align-items:end;border:1px solid rgba(148,163,184,.13);border-radius:15px;background:rgba(2,6,23,.28);padding:11px}
        .studio-media-row label,.studio-recommendation-row label{display:grid;gap:5px}
        .studio-media-row label span,.studio-recommendation-row label span{color:rgba(148,163,184,.72);font-size:8px;font-weight:900;text-transform:uppercase;letter-spacing:.07em}
        .studio-media-row input,.studio-media-row select,.studio-recommendation-row input,.studio-recommendation-row select{width:100%;border:1px solid rgba(148,163,184,.14);border-radius:10px;background:rgba(2,6,23,.38);color:white;padding:9px;font-size:10px}
        .studio-intelligence-message{border:1px solid rgba(96,165,250,.22);border-radius:13px;background:rgba(37,99,235,.1);color:rgba(219,234,254,.92);padding:11px;font-size:11px}

        @media(max-width:1100px){.studio-hero,.studio-workspace-grid,.studio-project-grid,.studio-document-shell,.studio-timeline-controls,.studio-timeline-summary,.studio-budget-controls,.studio-budget-summary,.studio-asset-shell,.studio-asset-config,.studio-simulation-controls,.studio-simulation-results,.studio-presentation-shell,.studio-slide-grid,.studio-health-grid,.studio-intelligence-grid{grid-template-columns:1fr}.studio-asset-wide,.studio-simulation-wide{grid-column:auto}.studio-timeline-item,.studio-budget-row,.studio-media-row,.studio-recommendation-row{grid-template-columns:1fr 1fr}.studio-project-wide{grid-column:auto}.studio-message.user,.studio-message.assistant{margin-left:0;margin-right:0}}
        @media(max-width:700px){.studio-hero-metrics,.studio-composer,.studio-timeline-item,.studio-budget-row,.studio-media-row,.studio-recommendation-row{grid-template-columns:1fr}}
      `}</style>

      <div className="studio-stack">
        <StudioHero project={project} activeModule={activeModule} stats={stats} onGenerateMasterPlan={generateMasterPlan} onNewProject={startNewProject} />
        <ExecutivePageNav sections={navSections} />
      </div>

      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}
      {message ? <div className="vs-banner">{message}</div> : null}

      <CollapsibleSection id="studio-metrics" title="Studio Readiness" subtitle="Project activity, outputs, launch readiness, and AI production status." defaultOpen right={<Badge tone="active">{activeModule.label}</Badge>}>
        <div className="vs-grid-4">
          <StatCard label="Studio Sessions" value={stats.threads} delta="Saved AI work sessions" tone="up" />
          <StatCard label="Messages" value={stats.messages} delta="Current production thread" tone="neutral" />
          <StatCard label="Deliverables" value={stats.deliverables} delta="Campaign outputs" tone="up" />
          <StatCard label="Launch Checklist" value={`${stats.completeChecklist}/${checklist.length}`} delta="Completed readiness items" tone={stats.completeChecklist === checklist.length ? "up" : "neutral"} />
        </div>
      </CollapsibleSection>

      <CollapsibleSection id="studio-project" title="Project Setup" subtitle="Define the campaign, race, geography, phase, and operating goal before generating plans." defaultOpen right={<Badge tone="info">{project.phase}</Badge>}>
        <ProjectSetup project={project} setProject={setProject} />
      </CollapsibleSection>

      <CollapsibleSection id="studio-modules" title="Campaign Builder Modules" subtitle="Choose the production studio that should generate the next campaign deliverable." defaultOpen right={<Badge tone="accent">{MODULES.length} Studios</Badge>}>
        <ModuleSelector selectedModule={selectedModule} setSelectedModule={setSelectedModule} />
      </CollapsibleSection>

      <CollapsibleSection id="studio-workspace" title="AI Production Workspace" subtitle="Generate, refine, and convert campaign plans into execution-ready deliverables." defaultOpen right={<Badge tone={asking ? "warning" : "active"}>{asking ? "Generating" : "Ready"}</Badge>}>
        <div className="studio-workspace-grid">
          <aside className="studio-sidebar">
            <div className="studio-active-module">
              <span className="studio-module-icon">{activeModule.icon}</span>
              <strong>{activeModule.label}</strong>
              <p>{activeModule.description}</p>
            </div>

            <div className="studio-prompt-box">
              <strong>Suggested Builds</strong>
              {activeModule.prompts.map((item) => (
                <button key={item} type="button" disabled={asking} onClick={() => generateModuleDeliverable(item)}>{item}</button>
              ))}
            </div>

            <div className="studio-prompt-box">
              <strong>Convert Last Answer</strong>
              {DELIVERABLE_TYPES.slice(0, 6).map((type) => (
                <button key={type} type="button" onClick={() => convertLastAnswerToDeliverable(type)}>{type}</button>
              ))}
            </div>
          </aside>

          <div className="studio-ai-panel">
            <div className="studio-messages">
              {!messages.length ? (
                <EmptyState text="Choose a module and generate your first campaign deliverable." />
              ) : (
                messages.map((item) => (
                  <div key={item.id || `${item.role}-${item.created_at}`} className={`studio-message ${item.role}`}>
                    <small>{item.role === "assistant" ? "Campaign Operations Studio AI" : "You"} • {fmtDate(item.created_at)}</small>
                    {item.content}
                  </div>
                ))
              )}
            </div>

            <div className="studio-composer">
              <textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder={`Ask the ${activeModule.label} studio to build or refine a campaign deliverable...`}
                onKeyDown={(event) => {
                  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") ask();
                }}
              />
              <button type="button" className="vs-button" disabled={asking || !prompt.trim()} onClick={() => ask()}>
                {asking ? "Generating..." : "Generate"}
              </button>
            </div>

            <div className="studio-ai-actions studio-production-toolbar">
              <button type="button" onClick={() => ask("Refine the previous answer into a more concise executive version.")}>Refine</button>
              <button type="button" onClick={() => ask("Expand the previous answer with owners, dates, risks, metrics, and dependencies.")}>Expand</button>
              <button type="button" onClick={() => ask("Convert the previous answer into Mission Control tasks with owners and due dates.")}>Create Task Plan</button>
              <button type="button" onClick={readLatestAnswer} disabled={isReading}>🔊 {isReading ? "Reading..." : "Read Latest"}</button>
              <button type="button" onClick={stopReading} disabled={!isReading}>⏹ Stop Audio</button>
              <button type="button" onClick={clearConversation} disabled={!messages.length && !prompt}>🧹 Clear Conversation</button>
              <button type="button" onClick={copyLatestAnswer} disabled={!messages.some((item) => item.role === "assistant")}>📋 Copy Latest</button>
              <button type="button" onClick={saveLatestAnswerToDeliverables} disabled={!messages.some((item) => item.role === "assistant")}>💾 Save to Deliverables</button>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection id="studio-deliverables" title="Deliverable Library" subtitle="Store campaign plans, client outputs, and execution-ready production documents." defaultOpen right={<Badge tone="active">{deliverables.length}</Badge>}>
        <DeliverableLibrary deliverables={deliverables} onOpen={setSelectedDeliverable} onRemove={removeDeliverable} />
        {selectedDeliverable ? (
          <div className="studio-selected-deliverable">
            <Badge tone="active">{selectedDeliverable.status}</Badge>
            <strong>{selectedDeliverable.title}</strong>
            <p>{selectedDeliverable.content}</p>
            <div className="studio-card-actions">
              <button type="button" onClick={copyDeliverable}>Copy Deliverable</button>
              <button type="button" onClick={() => ask(`Turn this deliverable into a Mission Control implementation plan:\n\n${selectedDeliverable.content}`)}>Send to Task Planning</button>
              <button type="button" onClick={() => setSelectedDeliverable(null)}>Close</button>
            </div>
          </div>
        ) : null}
      </CollapsibleSection>

      <CollapsibleSection
        id="studio-documents"
        title="AI Document Generator"
        subtitle="Turn Studio outputs into professional campaign documents ready for Word, PDF, client review, and internal distribution."
        defaultOpen
        right={<Badge tone="active">{DOCUMENT_TEMPLATES.length} Templates</Badge>}
      >
        <div className="studio-document-shell">
          <div className="studio-document-templates">
            {DOCUMENT_TEMPLATES.map((template) => (
              <button
                key={template.key}
                type="button"
                className={`studio-document-template ${
                  documentTemplate === template.key ? "is-active" : ""
                }`}
                onClick={() => {
                  setDocumentTemplate(template.key);
                  if (!documentTitle.trim()) {
                    setDocumentTitle(template.label);
                  }
                }}
              >
                <strong>{template.label}</strong>
                <small>{template.description}</small>
              </button>
            ))}
          </div>

          <div className="studio-document-config">
            <label>
              <span>Document Title</span>
              <input
                value={documentTitle}
                onChange={(event) =>
                  setDocumentTitle(event.target.value)
                }
                placeholder="Campaign Strategy Report"
              />
            </label>

            <label>
              <span>Prepared By</span>
              <input
                value={documentPreparedBy}
                onChange={(event) =>
                  setDocumentPreparedBy(event.target.value)
                }
              />
            </label>

            <label>
              <span>Document Status</span>
              <select
                value={documentStatus}
                onChange={(event) =>
                  setDocumentStatus(event.target.value)
                }
              >
                <option>Draft</option>
                <option>Internal Review</option>
                <option>Client Review</option>
                <option>Approved</option>
                <option>Final</option>
              </select>
            </label>

            <label>
              <span>Document Source</span>
              <select
                value={documentSource}
                onChange={(event) =>
                  setDocumentSource(event.target.value)
                }
              >
                <option value="latest-answer">Latest AI Answer</option>
                <option
                  value="selected-deliverable"
                  disabled={!selectedDeliverable}
                >
                  Selected Deliverable
                </option>
              </select>
            </label>

            <div className="studio-document-options">
              <label>
                <input
                  type="checkbox"
                  checked={documentIncludeCover}
                  onChange={(event) =>
                    setDocumentIncludeCover(event.target.checked)
                  }
                />
                Include cover page
              </label>

              <label>
                <input
                  type="checkbox"
                  checked={documentIncludeContext}
                  onChange={(event) =>
                    setDocumentIncludeContext(event.target.checked)
                  }
                />
                Include project context
              </label>
            </div>

            <div className="studio-document-note">
              The Word export creates a Microsoft Word-compatible document.
              PDF export opens the formatted report in the browser print
              window; select <strong>Save as PDF</strong>.
            </div>

            <div className="studio-document-actions">
              <button
                type="button"
                onClick={generateDocumentDraft}
                disabled={asking}
              >
                Generate Document Draft
              </button>

              <button type="button" onClick={previewDocument}>
                Preview
              </button>

              <button type="button" onClick={exportDocumentWord}>
                Export Word
              </button>

              <button type="button" onClick={exportDocumentPdf}>
                Export PDF
              </button>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        id="studio-timeline"
        title="Campaign Timeline Builder"
        subtitle="Create, edit, filter, and export an execution calendar with milestones, owners, dependencies, and Mission Control handoff."
        defaultOpen
        right={
          <Badge tone={timelineProgress === 100 ? "active" : "warning"}>
            {timelineProgress}% Complete
          </Badge>
        }
      >
        <div className="studio-timeline-shell">
          <div className="studio-timeline-controls">
            <label>
              <span>Timeline Start</span>
              <input
                type="date"
                value={timelineStartDate}
                onChange={(event) =>
                  setTimelineStartDate(event.target.value)
                }
              />
            </label>

            <label>
              <span>Duration</span>
              <select
                value={timelineDurationDays}
                onChange={(event) =>
                  setTimelineDurationDays(Number(event.target.value))
                }
              >
                <option value={30}>30 Days</option>
                <option value={60}>60 Days</option>
                <option value={90}>90 Days</option>
                <option value={120}>120 Days</option>
                <option value={180}>180 Days</option>
              </select>
            </label>

            <label>
              <span>Category Filter</span>
              <select
                value={timelineFilter}
                onChange={(event) =>
                  setTimelineFilter(event.target.value)
                }
              >
                <option>All</option>
                {TIMELINE_CATEGORIES.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </label>

            <label>
              <span>Status Filter</span>
              <select
                value={timelineStatusFilter}
                onChange={(event) =>
                  setTimelineStatusFilter(event.target.value)
                }
              >
                <option>All</option>
                {TIMELINE_STATUSES.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </label>

            <label>
              <span>Active Campaign</span>
              <input
                value={project.campaign}
                onChange={(event) =>
                  setProject((current) => ({
                    ...current,
                    campaign: event.target.value,
                  }))
                }
                placeholder="Campaign name"
              />
            </label>
          </div>

          <div className="studio-timeline-actions">
            <button
              type="button"
              onClick={generateTimelineWithAI}
              disabled={asking}
            >
              Generate Timeline with AI
            </button>
            <button type="button" onClick={generateTimelineFromTemplate}>
              Generate Standard Timeline
            </button>
            <button type="button" onClick={addTimelineItem}>
              Add Milestone
            </button>
            <button type="button" onClick={sendTimelineToMissionControl}>
              Send to Mission Control
            </button>
            <button type="button" onClick={exportTimelineCsv}>
              Export CSV
            </button>
            <button type="button" onClick={clearTimeline}>
              Clear Timeline
            </button>
          </div>

          <div className="studio-timeline-summary">
            <div>
              <span>Total Milestones</span>
              <strong>{timelineItems.length}</strong>
            </div>
            <div>
              <span>Complete</span>
              <strong>
                {
                  timelineItems.filter(
                    (item) => item.status === "Complete"
                  ).length
                }
              </strong>
            </div>
            <div>
              <span>Blocked</span>
              <strong>
                {
                  timelineItems.filter(
                    (item) => item.status === "Blocked"
                  ).length
                }
              </strong>
            </div>
            <div>
              <span>Progress</span>
              <strong>{timelineProgress}%</strong>
            </div>
          </div>

          {timelineMessage ? (
            <div className="studio-timeline-message">
              {timelineMessage}
            </div>
          ) : null}

          {!filteredTimelineItems.length ? (
            <EmptyState text="No campaign milestones match the current filters." />
          ) : (
            <div className="studio-timeline-list">
              {filteredTimelineItems.map((item) => (
                <div key={item.id} className="studio-timeline-item">
                  <label>
                    <span>Milestone</span>
                    <input
                      value={item.title}
                      onChange={(event) =>
                        updateTimelineItem(
                          item.id,
                          "title",
                          event.target.value
                        )
                      }
                    />
                  </label>

                  <label>
                    <span>Category</span>
                    <select
                      value={item.category}
                      onChange={(event) =>
                        updateTimelineItem(
                          item.id,
                          "category",
                          event.target.value
                        )
                      }
                    >
                      {TIMELINE_CATEGORIES.map((category) => (
                        <option key={category}>{category}</option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span>Owner</span>
                    <input
                      value={item.owner}
                      onChange={(event) =>
                        updateTimelineItem(
                          item.id,
                          "owner",
                          event.target.value
                        )
                      }
                    />
                  </label>

                  <label>
                    <span>Start</span>
                    <input
                      type="date"
                      value={item.startDate}
                      onChange={(event) =>
                        updateTimelineItem(
                          item.id,
                          "startDate",
                          event.target.value
                        )
                      }
                    />
                  </label>

                  <label>
                    <span>End</span>
                    <input
                      type="date"
                      value={item.endDate}
                      onChange={(event) =>
                        updateTimelineItem(
                          item.id,
                          "endDate",
                          event.target.value
                        )
                      }
                    />
                  </label>

                  <label>
                    <span>Status</span>
                    <select
                      value={item.status}
                      onChange={(event) =>
                        updateTimelineItem(
                          item.id,
                          "status",
                          event.target.value
                        )
                      }
                    >
                      {TIMELINE_STATUSES.map((status) => (
                        <option key={status}>{status}</option>
                      ))}
                    </select>
                  </label>

                  <div className="studio-timeline-item-actions">
                    <button
                      type="button"
                      onClick={() => duplicateTimelineItem(item)}
                      title="Duplicate milestone"
                    >
                      Copy
                    </button>
                    <button
                      type="button"
                      onClick={() => removeTimelineItem(item.id)}
                      title="Remove milestone"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        id="studio-budget"
        title="Campaign Budget Planner"
        subtitle="Plan category allocations, track committed and actual spend, monitor burn rate, model funding scenarios, and export the campaign budget."
        defaultOpen
        right={
          <Badge
            tone={
              budgetRiskLevel === "High"
                ? "danger"
                : budgetRiskLevel === "Elevated"
                  ? "warning"
                  : "active"
            }
          >
            {budgetRiskLevel} Risk
          </Badge>
        }
      >
        <div className="studio-budget-shell">
          <div className="studio-budget-controls">
            <label>
              <span>Revenue Goal</span>
              <input
                type="number"
                min="0"
                value={budgetRevenueGoal}
                onChange={(event) =>
                  setBudgetRevenueGoal(
                    numberValue(event.target.value)
                  )
                }
              />
            </label>

            <label>
              <span>Cash on Hand</span>
              <input
                type="number"
                min="0"
                value={budgetCashOnHand}
                onChange={(event) =>
                  setBudgetCashOnHand(
                    numberValue(event.target.value)
                  )
                }
              />
            </label>

            <label>
              <span>Budget Start</span>
              <input
                type="date"
                value={budgetStartDate}
                onChange={(event) =>
                  setBudgetStartDate(event.target.value)
                }
              />
            </label>

            <label>
              <span>Budget End</span>
              <input
                type="date"
                value={budgetEndDate}
                onChange={(event) =>
                  setBudgetEndDate(event.target.value)
                }
              />
            </label>

            <label>
              <span>Scenario</span>
              <select
                value={budgetScenario}
                onChange={(event) =>
                  setBudgetScenario(event.target.value)
                }
              >
                {BUDGET_SCENARIOS.map((scenario) => (
                  <option
                    key={scenario.key}
                    value={scenario.key}
                  >
                    {scenario.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="studio-budget-actions">
            <button
              type="button"
              onClick={generateBudgetWithAI}
              disabled={asking}
            >
              Generate Budget with AI
            </button>

            <button
              type="button"
              onClick={applyBudgetScenario}
            >
              Apply Scenario
            </button>

            <button type="button" onClick={addBudgetItem}>
              Add Budget Category
            </button>

            <button type="button" onClick={exportBudgetCsv}>
              Export CSV
            </button>

            <button
              type="button"
              onClick={() =>
                convertLastAnswerToDeliverable(
                  "Campaign Budget Plan"
                )
              }
            >
              Save Latest as Deliverable
            </button>

            <button
              type="button"
              onClick={resetBudgetPlanner}
            >
              Clear Budget
            </button>
          </div>

          <div className="studio-budget-summary">
            <div>
              <span>Total Planned</span>
              <strong>{money(budgetTotals.planned)}</strong>
              <small>Category budget total</small>
            </div>

            <div>
              <span>Committed</span>
              <strong>{money(budgetTotals.committed)}</strong>
              <small>
                {budgetTotals.committedPercentage}% of plan
              </small>
            </div>

            <div>
              <span>Spent</span>
              <strong>{money(budgetTotals.spent)}</strong>
              <small>{budgetTotals.spendPercentage}% of plan</small>
            </div>

            <div>
              <span>Remaining</span>
              <strong>{money(budgetTotals.remaining)}</strong>
              <small>Planned less actual spend</small>
            </div>

            <div>
              <span>Monthly Burn</span>
              <strong>{money(monthlyBurnRate)}</strong>
              <small>{budgetPeriodDays}-day budget period</small>
            </div>

            <div
              className={`studio-budget-risk ${budgetRiskLevel.toLowerCase()}`}
            >
              <span>Budget Risk</span>
              <strong>{budgetRiskLevel}</strong>
              <small>
                Funding gap: {money(budgetTotals.fundingGap)}
              </small>
            </div>
          </div>

          <div className="studio-budget-progress">
            <span
              style={{
                width: `${Math.min(
                  100,
                  budgetTotals.spendPercentage
                )}%`,
              }}
            />
          </div>

          {budgetMessage ? (
            <div className="studio-budget-message">
              {budgetMessage}
            </div>
          ) : null}

          {!budgetItems.length ? (
            <EmptyState text="No budget categories yet. Add a category or generate a campaign budget with AI." />
          ) : (
            <div className="studio-budget-table">
              {budgetItems.map((item) => {
                const remaining =
                  numberValue(item.planned) -
                  numberValue(item.spent);

                const spendPercentage = item.planned
                  ? Math.round(
                      (numberValue(item.spent) /
                        numberValue(item.planned)) *
                        100
                    )
                  : 0;

                return (
                  <div
                    key={item.id}
                    className="studio-budget-row"
                  >
                    <label>
                      <span>Category</span>
                      <select
                        value={item.category}
                        onChange={(event) =>
                          updateBudgetItem(
                            item.id,
                            "category",
                            event.target.value
                          )
                        }
                      >
                        {BUDGET_CATEGORIES.map((category) => (
                          <option key={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      <span>Planned</span>
                      <input
                        type="number"
                        min="0"
                        value={item.planned}
                        onChange={(event) =>
                          updateBudgetItem(
                            item.id,
                            "planned",
                            event.target.value
                          )
                        }
                      />
                    </label>

                    <label>
                      <span>Committed</span>
                      <input
                        type="number"
                        min="0"
                        value={item.committed}
                        onChange={(event) =>
                          updateBudgetItem(
                            item.id,
                            "committed",
                            event.target.value
                          )
                        }
                      />
                    </label>

                    <label>
                      <span>Spent</span>
                      <input
                        type="number"
                        min="0"
                        value={item.spent}
                        onChange={(event) =>
                          updateBudgetItem(
                            item.id,
                            "spent",
                            event.target.value
                          )
                        }
                      />
                    </label>

                    <div className="studio-budget-remaining">
                      <strong>{money(remaining)}</strong>
                      <small>{spendPercentage}% spent</small>
                    </div>

                    <label>
                      <span>Notes</span>
                      <input
                        value={item.notes}
                        onChange={(event) =>
                          updateBudgetItem(
                            item.id,
                            "notes",
                            event.target.value
                          )
                        }
                        placeholder="Purpose, vendor, timing, or risk"
                      />
                    </label>

                    <div className="studio-budget-row-actions">
                      <button
                        type="button"
                        onClick={() =>
                          removeBudgetItem(item.id)
                        }
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        id="studio-assets"
        title="AI Asset Generator"
        subtitle="Generate campaign-ready emails, texts, social posts, ads, mail copy, volunteer scripts, phone-bank scripts, and press content."
        defaultOpen
        right={<Badge tone="active">{assetHistory.length} Saved</Badge>}
      >
        <div className="studio-asset-shell">
          <div className="studio-asset-types">
            {ASSET_TYPES.map((type) => (
              <button
                key={type.key}
                type="button"
                className={`studio-asset-type ${
                  assetType === type.key ? "is-active" : ""
                }`}
                onClick={() => setAssetType(type.key)}
              >
                <strong>{type.label}</strong>
                <small>{type.description}</small>
              </button>
            ))}
          </div>

          <div className="studio-asset-workspace">
            <div className="studio-asset-config">
              <label>
                <span>Audience</span>
                <select
                  value={assetAudience}
                  onChange={(event) =>
                    setAssetAudience(event.target.value)
                  }
                >
                  {ASSET_AUDIENCES.map((audience) => (
                    <option key={audience}>{audience}</option>
                  ))}
                </select>
              </label>

              <label>
                <span>Goal</span>
                <select
                  value={assetGoal}
                  onChange={(event) =>
                    setAssetGoal(event.target.value)
                  }
                >
                  {ASSET_GOALS.map((goal) => (
                    <option key={goal}>{goal}</option>
                  ))}
                </select>
              </label>

              <label>
                <span>Tone</span>
                <select
                  value={assetTone}
                  onChange={(event) =>
                    setAssetTone(event.target.value)
                  }
                >
                  {ASSET_TONES.map((tone) => (
                    <option key={tone}>{tone}</option>
                  ))}
                </select>
              </label>

              <label>
                <span>Length</span>
                <select
                  value={assetLength}
                  onChange={(event) =>
                    setAssetLength(event.target.value)
                  }
                >
                  <option>Short</option>
                  <option>Standard</option>
                  <option>Long</option>
                </select>
              </label>

              <label>
                <span>Variants</span>
                <select
                  value={assetVariants}
                  onChange={(event) =>
                    setAssetVariants(Number(event.target.value))
                  }
                >
                  <option value={1}>1 Variant</option>
                  <option value={2}>2 Variants</option>
                  <option value={3}>3 Variants</option>
                  <option value={5}>5 Variants</option>
                </select>
              </label>

              <label>
                <span>Call to Action</span>
                <input
                  value={assetCallToAction}
                  onChange={(event) =>
                    setAssetCallToAction(event.target.value)
                  }
                  placeholder="Donate, RSVP, volunteer, vote..."
                />
              </label>

              <label className="studio-asset-wide">
                <span>Topic / Issue / Event</span>
                <textarea
                  value={assetTopic}
                  onChange={(event) =>
                    setAssetTopic(event.target.value)
                  }
                  placeholder="Describe the issue, event, announcement, attack, fundraising need, volunteer drive, or voter message."
                />
              </label>

              <div className="studio-asset-actions">
                <button
                  type="button"
                  onClick={generateAsset}
                  disabled={asking}
                >
                  {asking ? "Generating..." : "Generate Asset Variants"}
                </button>

                <button type="button" onClick={copyAssetOutput}>
                  Copy Output
                </button>

                <button type="button" onClick={saveAssetToDeliverables}>
                  Save to Deliverables
                </button>

                <button type="button" onClick={exportAssetText}>
                  Export Text
                </button>

                <button type="button" onClick={clearAssetStudio}>
                  Clear Asset Studio
                </button>
              </div>
            </div>

            {assetMessage ? (
              <div className="studio-asset-message">
                {assetMessage}
              </div>
            ) : null}

            <div className="studio-asset-output">
              {assetOutput ||
                `Select an asset type and generate campaign-ready ${assetTypeByKey(
                  assetType
                ).label.toLowerCase()} variants.`}
            </div>

            <div className="studio-asset-history">
              {assetHistory.length ? (
                assetHistory.map((item) => (
                  <div
                    key={item.id}
                    className="studio-asset-history-item"
                  >
                    <div>
                      <strong>
                        {item.typeLabel}: {item.topic}
                      </strong>
                      <small>
                        {item.audience} • {item.goal} • {item.tone} •{" "}
                        {fmtDate(item.createdAt)}
                      </small>
                    </div>

                    <div className="studio-asset-history-actions">
                      <button
                        type="button"
                        onClick={() => loadAssetFromHistory(item)}
                      >
                        Open
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          removeAssetHistory(item.id)
                        }
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState text="No generated campaign assets yet." />
              )}
            </div>
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        id="studio-simulation"
        title="Campaign Simulation Engine"
        subtitle="Model what-if scenarios involving budget, paid media, field strength, fundraising, turnout, polling movement, execution risk, and projected electoral impact."
        defaultOpen
        right={
          <Badge tone={simulationResult ? "active" : "warning"}>
            {simulationResult
              ? `${simulationResult.winProbability}% Win Probability`
              : "Run Scenario"}
          </Badge>
        }
      >
        <div className="studio-simulation-shell">
          <div className="studio-simulation-presets">
            {SIMULATION_SCENARIOS.map((scenario) => (
              <button
                key={scenario.key}
                type="button"
                className={`studio-simulation-preset ${
                  simulationScenario === scenario.key
                    ? "is-active"
                    : ""
                }`}
                onClick={() =>
                  applySimulationPreset(scenario.key)
                }
              >
                <strong>{scenario.label}</strong>
                <small>{scenario.description}</small>
              </button>
            ))}
          </div>

          <div className="studio-simulation-controls">
            <label className="studio-simulation-wide">
              <span>Scenario Name</span>
              <input
                value={simulationName}
                onChange={(event) =>
                  setSimulationName(event.target.value)
                }
                placeholder="Georgia media and field surge"
              />
            </label>

            <label>
              <span>Budget Change %</span>
              <input
                type="number"
                min="-50"
                max="200"
                value={simulationBudgetIncrease}
                onChange={(event) =>
                  setSimulationBudgetIncrease(
                    numberValue(event.target.value)
                  )
                }
              />
            </label>

            <label>
              <span>Media Change %</span>
              <input
                type="number"
                min="-100"
                max="300"
                value={simulationMediaIncrease}
                onChange={(event) =>
                  setSimulationMediaIncrease(
                    numberValue(event.target.value)
                  )
                }
              />
            </label>

            <label>
              <span>Field Change %</span>
              <input
                type="number"
                min="-100"
                max="300"
                value={simulationFieldIncrease}
                onChange={(event) =>
                  setSimulationFieldIncrease(
                    numberValue(event.target.value)
                  )
                }
              />
            </label>

            <label>
              <span>Fundraising Change %</span>
              <input
                type="number"
                min="-100"
                max="300"
                value={simulationFundraisingIncrease}
                onChange={(event) =>
                  setSimulationFundraisingIncrease(
                    numberValue(event.target.value)
                  )
                }
              />
            </label>

            <label>
              <span>Polling Baseline %</span>
              <input
                type="number"
                min="0"
                max="100"
                value={simulationPollingBaseline}
                onChange={(event) =>
                  setSimulationPollingBaseline(
                    numberValue(event.target.value)
                  )
                }
              />
            </label>

            <label>
              <span>Turnout Baseline %</span>
              <input
                type="number"
                min="0"
                max="100"
                value={simulationTurnoutBaseline}
                onChange={(event) =>
                  setSimulationTurnoutBaseline(
                    numberValue(event.target.value)
                  )
                }
              />
            </label>

            <label>
              <span>Fundraising Baseline</span>
              <input
                type="number"
                min="0"
                value={simulationFundraisingBaseline}
                onChange={(event) =>
                  setSimulationFundraisingBaseline(
                    numberValue(event.target.value)
                  )
                }
              />
            </label>

            <label>
              <span>Media Pressure %</span>
              <input
                type="number"
                min="0"
                max="100"
                value={simulationMediaPressure}
                onChange={(event) =>
                  setSimulationMediaPressure(
                    numberValue(event.target.value)
                  )
                }
              />
            </label>

            <label>
              <span>Field Strength %</span>
              <input
                type="number"
                min="0"
                max="100"
                value={simulationFieldStrength}
                onChange={(event) =>
                  setSimulationFieldStrength(
                    numberValue(event.target.value)
                  )
                }
              />
            </label>

            <label>
              <span>Execution Risk</span>
              <select
                value={simulationRisk}
                onChange={(event) =>
                  setSimulationRisk(event.target.value)
                }
              >
                {SIMULATION_RISK_LEVELS.map((risk) => (
                  <option key={risk}>{risk}</option>
                ))}
              </select>
            </label>

            <div className="studio-simulation-actions">
              <button type="button" onClick={calculateSimulation}>
                Run Simulation
              </button>

              <button
                type="button"
                onClick={compareSimulationWithAI}
                disabled={!simulationResult || asking}
              >
                Analyze with AI
              </button>

              <button
                type="button"
                onClick={saveSimulationToDeliverables}
                disabled={!simulationResult}
              >
                Save to Deliverables
              </button>

              <button
                type="button"
                onClick={exportSimulationCsv}
                disabled={!simulationResult}
              >
                Export CSV
              </button>

              <button type="button" onClick={clearSimulation}>
                Clear Results
              </button>
            </div>
          </div>

          {simulationMessage ? (
            <div className="studio-simulation-message">
              {simulationMessage}
            </div>
          ) : null}

          {simulationResult ? (
            <div className="studio-simulation-results">
              <div
                className={
                  simulationResult.pollingMovement >= 0
                    ? "studio-simulation-positive"
                    : "studio-simulation-negative"
                }
              >
                <span>Polling Movement</span>
                <strong>
                  {simulationResult.pollingMovement >= 0 ? "+" : ""}
                  {simulationResult.pollingMovement}
                </strong>
                <small>
                  Projected polling:{" "}
                  {percent(simulationResult.projectedPolling)}
                </small>
              </div>

              <div
                className={
                  simulationResult.turnoutMovement >= 0
                    ? "studio-simulation-positive"
                    : "studio-simulation-negative"
                }
              >
                <span>Turnout Movement</span>
                <strong>
                  {simulationResult.turnoutMovement >= 0 ? "+" : ""}
                  {simulationResult.turnoutMovement}
                </strong>
                <small>
                  Projected turnout:{" "}
                  {percent(simulationResult.projectedTurnout)}
                </small>
              </div>

              <div>
                <span>Projected Fundraising</span>
                <strong>
                  {money(simulationResult.projectedFundraising)}
                </strong>
                <small>
                  Baseline: {money(simulationFundraisingBaseline)}
                </small>
              </div>

              <div
                className={
                  simulationResult.winProbability >= 50
                    ? "studio-simulation-positive"
                    : "studio-simulation-negative"
                }
              >
                <span>Win Probability</span>
                <strong>
                  {percent(simulationResult.winProbability)}
                </strong>
                <small>Modeled scenario output</small>
              </div>

              <div>
                <span>Execution Score</span>
                <strong>
                  {percent(simulationResult.executionScore)}
                </strong>
                <small>Operational readiness estimate</small>
              </div>

              <div>
                <span>Cash Impact</span>
                <strong>
                  {money(simulationResult.cashImpact)}
                </strong>
                <small>Additional planned investment</small>
              </div>

              <div>
                <span>Risk Level</span>
                <strong>{simulationResult.risk}</strong>
                <small>Selected execution posture</small>
              </div>

              <div>
                <span>Scenario</span>
                <strong>
                  {
                    SIMULATION_SCENARIOS.find(
                      (item) =>
                        item.key === simulationResult.scenario
                    )?.label
                  }
                </strong>
                <small>{simulationResult.name}</small>
              </div>
            </div>
          ) : (
            <EmptyState text="Configure a scenario and run the Campaign Simulation Engine." />
          )}

          <div className="studio-simulation-history">
            {simulationHistory.length ? (
              simulationHistory.map((item) => (
                <div
                  key={item.id}
                  className="studio-simulation-history-item"
                >
                  <div>
                    <strong>{item.name}</strong>
                    <small>
                      Win {percent(item.winProbability)} • Polling{" "}
                      {item.pollingMovement >= 0 ? "+" : ""}
                      {item.pollingMovement} • Turnout{" "}
                      {item.turnoutMovement >= 0 ? "+" : ""}
                      {item.turnoutMovement} •{" "}
                      {fmtDate(item.createdAt)}
                    </small>
                  </div>

                  <div className="studio-simulation-history-actions">
                    <button
                      type="button"
                      onClick={() =>
                        loadSimulationHistory(item)
                      }
                    >
                      Open
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        removeSimulationHistory(item.id)
                      }
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState text="No campaign simulations have been run yet." />
            )}
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        id="studio-presentation"
        title="Client Presentation Builder"
        subtitle="Turn Studio plans, budgets, timelines, simulations, and recommendations into a polished client presentation."
        defaultOpen
        right={<Badge tone="active">{presentationSlides.length} Slides</Badge>}
      >
        <div className="studio-presentation-shell">
          <aside className="studio-presentation-controls">
            <label>
              <span>Presentation Template</span>
              <select
                value={presentationTemplate}
                onChange={(event) =>
                  setPresentationTemplate(event.target.value)
                }
              >
                {PRESENTATION_TEMPLATES.map((template) => (
                  <option key={template.key} value={template.key}>
                    {template.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Presentation Title</span>
              <input
                value={presentationTitle}
                onChange={(event) =>
                  setPresentationTitle(event.target.value)
                }
                placeholder="Campaign Strategy Review"
              />
            </label>

            <label>
              <span>Audience</span>
              <input
                value={presentationAudience}
                onChange={(event) =>
                  setPresentationAudience(event.target.value)
                }
                placeholder="Client Leadership"
              />
            </label>

            <label>
              <span>Theme</span>
              <select
                value={presentationTheme}
                onChange={(event) =>
                  setPresentationTheme(event.target.value)
                }
              >
                {PRESENTATION_THEME_OPTIONS.map((theme) => (
                  <option key={theme}>{theme}</option>
                ))}
              </select>
            </label>

            <div className="studio-presentation-actions">
              <button type="button" onClick={generatePresentationDeck}>
                Generate Slides
              </button>
              <button
                type="button"
                onClick={generatePresentationWithAI}
                disabled={asking}
              >
                Generate with AI
              </button>
              <button type="button" onClick={addPresentationSlide}>
                Add Slide
              </button>
              <button type="button" onClick={savePresentationToDeliverables}>
                Save to Deliverables
              </button>
              <button type="button" onClick={exportPresentationHtml}>
                Export HTML
              </button>
              <button type="button" onClick={exportPresentationPdf}>
                Export PDF
              </button>
              <button type="button" onClick={clearPresentationDeck}>
                Clear Deck
              </button>
            </div>

            {presentationMessage ? (
              <div className="studio-presentation-message">
                {presentationMessage}
              </div>
            ) : null}
          </aside>

          <div className="studio-slide-grid">
            <div className="studio-slide-list">
              {presentationSlides.length ? (
                presentationSlides.map((slide, index) => (
                  <button
                    key={slide.id}
                    type="button"
                    className={`studio-slide-thumb ${
                      selectedPresentationSlide?.id === slide.id
                        ? "is-active"
                        : ""
                    }`}
                    onClick={() => setSelectedSlideId(slide.id)}
                  >
                    <strong>
                      {index + 1}. {slide.title}
                    </strong>
                    <small>{slide.kicker || "Presentation Slide"}</small>
                  </button>
                ))
              ) : (
                <EmptyState text="Generate a presentation deck to begin." />
              )}
            </div>

            <div>
              {selectedPresentationSlide ? (
                <>
                  <div className="studio-slide-preview">
                    <span>{selectedPresentationSlide.kicker}</span>
                    <h3>{selectedPresentationSlide.title}</h3>
                    <p>{selectedPresentationSlide.body}</p>
                    {selectedPresentationSlide.bullets?.length ? (
                      <ul>
                        {selectedPresentationSlide.bullets.map(
                          (bullet, index) => (
                            <li key={`${bullet}-${index}`}>{bullet}</li>
                          )
                        )}
                      </ul>
                    ) : null}
                  </div>

                  <div className="studio-slide-editor">
                    <label>
                      <span>Kicker</span>
                      <input
                        value={selectedPresentationSlide.kicker}
                        onChange={(event) =>
                          updatePresentationSlide(
                            selectedPresentationSlide.id,
                            "kicker",
                            event.target.value
                          )
                        }
                      />
                    </label>

                    <label>
                      <span>Slide Title</span>
                      <input
                        value={selectedPresentationSlide.title}
                        onChange={(event) =>
                          updatePresentationSlide(
                            selectedPresentationSlide.id,
                            "title",
                            event.target.value
                          )
                        }
                      />
                    </label>

                    <label>
                      <span>Body</span>
                      <textarea
                        value={selectedPresentationSlide.body}
                        onChange={(event) =>
                          updatePresentationSlide(
                            selectedPresentationSlide.id,
                            "body",
                            event.target.value
                          )
                        }
                      />
                    </label>

                    <label>
                      <span>Bullets</span>
                      <textarea
                        value={(selectedPresentationSlide.bullets || []).join(
                          "\n"
                        )}
                        onChange={(event) =>
                          updatePresentationSlide(
                            selectedPresentationSlide.id,
                            "bullets",
                            event.target.value
                          )
                        }
                      />
                    </label>

                    <label>
                      <span>Speaker Notes</span>
                      <textarea
                        value={selectedPresentationSlide.notes}
                        onChange={(event) =>
                          updatePresentationSlide(
                            selectedPresentationSlide.id,
                            "notes",
                            event.target.value
                          )
                        }
                      />
                    </label>

                    <div className="studio-slide-editor-actions">
                      <button
                        type="button"
                        onClick={() =>
                          duplicatePresentationSlide(
                            selectedPresentationSlide
                          )
                        }
                      >
                        Duplicate Slide
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          removePresentationSlide(
                            selectedPresentationSlide.id
                          )
                        }
                      >
                        Remove Slide
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <EmptyState text="No slide selected." />
              )}
            </div>
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        id="studio-intelligence"
        title="Campaign Intelligence Center"
        subtitle="Monitor campaign health, opponent posture, district opportunity, media narratives, polling, fundraising, volunteer capacity, risks, and AI recommendations."
        defaultOpen
        right={
          <Badge tone={intelligenceTone(scoreBand(campaignHealthScore))}>
            Health {campaignHealthScore}
          </Badge>
        }
      >
        <div className="studio-intelligence-shell">
          <div className="studio-intelligence-topbar">
            <button
              type="button"
              onClick={refreshCampaignIntelligence}
            >
              Refresh Intelligence
            </button>
            <button
              type="button"
              onClick={generateIntelligenceBriefWithAI}
              disabled={asking}
            >
              Generate AI Intelligence Brief
            </button>
            <button
              type="button"
              onClick={exportIntelligenceCsv}
            >
              Export Intelligence CSV
            </button>
            <Badge tone="info">
              Updated {intelligenceLastUpdated || "Ready"}
            </Badge>
            <Badge tone={intelligenceRiskCount ? "warning" : "active"}>
              {intelligenceRiskCount} High Priority
            </Badge>
          </div>

          <div className="studio-intelligence-tabs">
            {INTELLIGENCE_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={
                  intelligenceTab === tab.key ? "is-active" : ""
                }
                onClick={() => setIntelligenceTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {intelligenceMessage ? (
            <div className="studio-intelligence-message">
              {intelligenceMessage}
            </div>
          ) : null}

          {intelligenceTab === "health" ? (
            <>
              <div className="studio-health-grid">
                <div className="studio-health-card">
                  <span>Campaign Health</span>
                  <strong>{campaignHealthScore}</strong>
                  <small>{scoreBand(campaignHealthScore)}</small>
                </div>
                <div className="studio-health-card">
                  <span>Polling Lead</span>
                  <strong>
                    {pollingLead >= 0 ? "+" : ""}
                    {pollingLead}
                  </strong>
                  <small>Candidate vs opponent</small>
                </div>
                <div className="studio-health-card">
                  <span>Fundraising Progress</span>
                  <strong>
                    {fundraisingMetrics.goal
                      ? Math.round(
                          (fundraisingMetrics.raised /
                            fundraisingMetrics.goal) *
                            100
                        )
                      : 0}
                    %
                  </strong>
                  <small>{money(fundraisingMetrics.raised)} raised</small>
                </div>
                <div className="studio-health-card">
                  <span>Volunteer Growth</span>
                  <strong>{volunteerMetrics.weeklyGrowth}%</strong>
                  <small>{volunteerMetrics.activeVolunteers} active</small>
                </div>
                <div className="studio-health-card">
                  <span>Priority Risks</span>
                  <strong>{intelligenceRiskCount}</strong>
                  <small>High or critical</small>
                </div>
              </div>

              <div className="studio-intelligence-panel">
                <h3>Executive Campaign Posture</h3>
                <p>
                  Campaign health combines timeline progress, budget control,
                  simulation execution score, fundraising progress, district
                  opportunity, and volunteer growth.
                </p>
              </div>
            </>
          ) : null}

          {intelligenceTab === "opponent" ? (
            <div className="studio-intelligence-grid">
              <div className="studio-intelligence-panel studio-intelligence-form">
                <label>
                  <span>Opponent Name</span>
                  <input
                    value={opponentName}
                    onChange={(event) =>
                      setOpponentName(event.target.value)
                    }
                  />
                </label>

                <label>
                  <span>Opponent Strengths</span>
                  <textarea
                    value={opponentStrengths.join("\n")}
                    onChange={(event) =>
                      setOpponentStrengths(
                        event.target.value
                          .split("\n")
                          .map((item) => item.trim())
                          .filter(Boolean)
                      )
                    }
                  />
                </label>

                <label>
                  <span>Opponent Vulnerabilities</span>
                  <textarea
                    value={opponentVulnerabilities.join("\n")}
                    onChange={(event) =>
                      setOpponentVulnerabilities(
                        event.target.value
                          .split("\n")
                          .map((item) => item.trim())
                          .filter(Boolean)
                      )
                    }
                  />
                </label>
              </div>

              <div className="studio-intelligence-panel">
                <h3>Comparative Positioning</h3>
                <div className="studio-list-stack">
                  {opponentStrengths.map((item) => (
                    <div key={item} className="studio-list-item">
                      <strong>Strength</strong>
                      <p>{item}</p>
                    </div>
                  ))}
                  {opponentVulnerabilities.map((item) => (
                    <div key={item} className="studio-list-item">
                      <strong>Vulnerability</strong>
                      <p>{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {intelligenceTab === "district" ? (
            <div className="studio-intelligence-grid">
              <div className="studio-intelligence-panel studio-intelligence-form">
                {Object.entries(districtMetrics).map(([field, value]) => (
                  <label key={field}>
                    <span>{field.replace(/([A-Z])/g, " $1")}</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={value}
                      onChange={(event) =>
                        updateDistrictMetric(
                          field,
                          event.target.value
                        )
                      }
                    />
                  </label>
                ))}
              </div>

              <div className="studio-intelligence-panel">
                <h3>District Opportunity</h3>
                <div className="studio-list-stack">
                  {Object.entries(districtMetrics).map(([field, value]) => (
                    <div key={field} className="studio-list-item">
                      <strong>{field.replace(/([A-Z])/g, " $1")}</strong>
                      <p>{value}% modeled strength</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {intelligenceTab === "media" ? (
            <div className="studio-intelligence-panel">
              <div className="studio-list-actions">
                <button type="button" onClick={addMediaSignal}>
                  Add Media Signal
                </button>
              </div>

              <div className="studio-list-stack">
                {mediaSignals.map((item) => (
                  <div key={item.id} className="studio-media-row">
                    <label>
                      <span>Title</span>
                      <input
                        value={item.title}
                        onChange={(event) =>
                          updateMediaSignal(
                            item.id,
                            "title",
                            event.target.value
                          )
                        }
                      />
                    </label>
                    <label>
                      <span>Source</span>
                      <input
                        value={item.source}
                        onChange={(event) =>
                          updateMediaSignal(
                            item.id,
                            "source",
                            event.target.value
                          )
                        }
                      />
                    </label>
                    <label>
                      <span>Sentiment</span>
                      <select
                        value={item.sentiment}
                        onChange={(event) =>
                          updateMediaSignal(
                            item.id,
                            "sentiment",
                            event.target.value
                          )
                        }
                      >
                        <option>Positive</option>
                        <option>Neutral</option>
                        <option>Negative</option>
                      </select>
                    </label>
                    <label>
                      <span>Impact</span>
                      <select
                        value={item.impact}
                        onChange={(event) =>
                          updateMediaSignal(
                            item.id,
                            "impact",
                            event.target.value
                          )
                        }
                      >
                        <option>Low</option>
                        <option>Medium</option>
                        <option>High</option>
                      </select>
                    </label>
                    <label>
                      <span>Status</span>
                      <select
                        value={item.status}
                        onChange={(event) =>
                          updateMediaSignal(
                            item.id,
                            "status",
                            event.target.value
                          )
                        }
                      >
                        <option>Monitor</option>
                        <option>Amplify</option>
                        <option>Respond</option>
                        <option>Resolved</option>
                      </select>
                    </label>
                    <button
                      type="button"
                      onClick={() => removeMediaSignal(item.id)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {intelligenceTab === "polling" ? (
            <div className="studio-intelligence-grid">
              <div className="studio-intelligence-panel studio-intelligence-form">
                {Object.entries(pollingMetrics).map(([field, value]) => (
                  <label key={field}>
                    <span>{field.replace(/([A-Z])/g, " $1")}</span>
                    <input
                      type="number"
                      value={value}
                      onChange={(event) =>
                        updatePollingMetric(
                          field,
                          event.target.value
                        )
                      }
                    />
                  </label>
                ))}
              </div>

              <div className="studio-intelligence-panel">
                <h3>Polling Posture</h3>
                <div className="studio-health-grid">
                  <div className="studio-health-card">
                    <span>Candidate</span>
                    <strong>{pollingMetrics.candidate}%</strong>
                  </div>
                  <div className="studio-health-card">
                    <span>Opponent</span>
                    <strong>{pollingMetrics.opponent}%</strong>
                  </div>
                  <div className="studio-health-card">
                    <span>Undecided</span>
                    <strong>{pollingMetrics.undecided}%</strong>
                  </div>
                  <div className="studio-health-card">
                    <span>Trend</span>
                    <strong>{pollingMetrics.trend}</strong>
                  </div>
                  <div className="studio-health-card">
                    <span>Confidence</span>
                    <strong>{pollingMetrics.confidence}%</strong>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {intelligenceTab === "fundraising" ? (
            <div className="studio-intelligence-grid">
              <div className="studio-intelligence-panel studio-intelligence-form">
                {Object.entries(fundraisingMetrics).map(([field, value]) => (
                  <label key={field}>
                    <span>{field.replace(/([A-Z])/g, " $1")}</span>
                    <input
                      type="number"
                      value={value}
                      onChange={(event) =>
                        updateFundraisingMetric(
                          field,
                          event.target.value
                        )
                      }
                    />
                  </label>
                ))}
              </div>

              <div className="studio-intelligence-panel">
                <h3>Fundraising Intelligence</h3>
                <div className="studio-list-stack">
                  <div className="studio-list-item">
                    <strong>Goal Progress</strong>
                    <p>
                      {fundraisingMetrics.goal
                        ? Math.round(
                            (fundraisingMetrics.raised /
                              fundraisingMetrics.goal) *
                              100
                          )
                        : 0}
                      %
                    </p>
                  </div>
                  <div className="studio-list-item">
                    <strong>Cash on Hand</strong>
                    <p>{money(fundraisingMetrics.cashOnHand)}</p>
                  </div>
                  <div className="studio-list-item">
                    <strong>Donor Growth</strong>
                    <p>{fundraisingMetrics.donorGrowth}%</p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {intelligenceTab === "volunteers" ? (
            <div className="studio-intelligence-grid">
              <div className="studio-intelligence-panel studio-intelligence-form">
                {Object.entries(volunteerMetrics).map(([field, value]) => (
                  <label key={field}>
                    <span>{field.replace(/([A-Z])/g, " $1")}</span>
                    <input
                      type="number"
                      value={value}
                      onChange={(event) =>
                        updateVolunteerMetric(
                          field,
                          event.target.value
                        )
                      }
                    />
                  </label>
                ))}
              </div>

              <div className="studio-intelligence-panel">
                <h3>Volunteer Capacity</h3>
                <div className="studio-health-grid">
                  <div className="studio-health-card">
                    <span>Active Volunteers</span>
                    <strong>{volunteerMetrics.activeVolunteers}</strong>
                  </div>
                  <div className="studio-health-card">
                    <span>Weekly Growth</span>
                    <strong>{volunteerMetrics.weeklyGrowth}%</strong>
                  </div>
                  <div className="studio-health-card">
                    <span>Doors Knocked</span>
                    <strong>{volunteerMetrics.doorsKnocked}</strong>
                  </div>
                  <div className="studio-health-card">
                    <span>Calls Completed</span>
                    <strong>{volunteerMetrics.callsCompleted}</strong>
                  </div>
                  <div className="studio-health-card">
                    <span>Events</span>
                    <strong>{volunteerMetrics.eventsScheduled}</strong>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {intelligenceTab === "recommendations" ? (
            <div className="studio-intelligence-panel">
              <div className="studio-list-actions">
                <button
                  type="button"
                  onClick={addIntelligenceRecommendation}
                >
                  Add Recommendation
                </button>
              </div>

              <div className="studio-list-stack">
                {intelligenceRecommendations.map((item) => (
                  <div
                    key={item.id}
                    className="studio-recommendation-row"
                  >
                    <label>
                      <span>Recommendation</span>
                      <input
                        value={item.title}
                        onChange={(event) =>
                          updateIntelligenceRecommendation(
                            item.id,
                            "title",
                            event.target.value
                          )
                        }
                      />
                    </label>
                    <label>
                      <span>Priority</span>
                      <select
                        value={item.priority}
                        onChange={(event) =>
                          updateIntelligenceRecommendation(
                            item.id,
                            "priority",
                            event.target.value
                          )
                        }
                      >
                        {INTELLIGENCE_RISK_LEVELS.map((level) => (
                          <option key={level}>{level}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      <span>Owner</span>
                      <input
                        value={item.owner}
                        onChange={(event) =>
                          updateIntelligenceRecommendation(
                            item.id,
                            "owner",
                            event.target.value
                          )
                        }
                      />
                    </label>
                    <label>
                      <span>Status</span>
                      <select
                        value={item.status}
                        onChange={(event) =>
                          updateIntelligenceRecommendation(
                            item.id,
                            "status",
                            event.target.value
                          )
                        }
                      >
                        <option>Open</option>
                        <option>In Progress</option>
                        <option>Complete</option>
                        <option>Deferred</option>
                      </select>
                    </label>
                    <label>
                      <span>Rationale</span>
                      <input
                        value={item.rationale}
                        onChange={(event) =>
                          updateIntelligenceRecommendation(
                            item.id,
                            "rationale",
                            event.target.value
                          )
                        }
                      />
                    </label>
                    <div className="studio-list-actions">
                      <button
                        type="button"
                        onClick={() =>
                          sendRecommendationToMissionControl(item)
                        }
                      >
                        Send to Mission Control
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          removeIntelligenceRecommendation(item.id)
                        }
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </CollapsibleSection>

      <CollapsibleSection id="studio-launch" title="Campaign Launch Checklist" subtitle="Track the core approvals and operating requirements needed before campaign launch." defaultOpen right={<Badge tone={stats.completeChecklist === checklist.length ? "active" : "warning"}>{stats.completeChecklist}/{checklist.length} Complete</Badge>}>
        <LaunchChecklist checklist={checklist} toggleChecklist={toggleChecklist} />
      </CollapsibleSection>

      <CollapsibleSection id="studio-sources" title="Connected Intelligence" subtitle="VoterSpheres systems available to support campaign planning and execution." defaultOpen={false} right={<Badge tone="info">{INTELLIGENCE_SOURCES.length}</Badge>}>
        <div className="studio-module-grid">
          {INTELLIGENCE_SOURCES.map((source) => (
            <div key={source} className="studio-active-module">
              <span className="vs-live-dot-success" />
              <strong>{source}</strong>
              <p>Available campaign context and operational intelligence.</p>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      <CollapsibleSection id="studio-history" title="Studio History" subtitle="Reopen saved Campaign Operations Studio work sessions." defaultOpen={false} right={<Badge tone="accent">{threads.length}</Badge>}>
        {loadingThreads ? (
          <EmptyState text="Loading Studio sessions..." />
        ) : !threads.length ? (
          <EmptyState text="No Campaign Operations Studio sessions yet." />
        ) : (
          <ShowMoreList
            items={threads}
            initialCount={10}
            showAllLabel={(count) => `Show All ${count} Studio Sessions`}
            className="studio-thread-list"
            renderItem={(thread) => (
              <div className="studio-thread" onClick={() => openThread(thread.id)}>
                <strong>{thread.title || "Campaign Operations Studio Session"}</strong>
                <span>{fmtDate(thread.updated_at)}</span>
              </div>
            )}
          />
        )}
      </CollapsibleSection>

      <BackToTopButton />
    </PageShell>
  );
}
