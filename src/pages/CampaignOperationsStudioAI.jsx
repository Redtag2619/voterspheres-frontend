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

        @media(max-width:1100px){.studio-hero,.studio-workspace-grid,.studio-project-grid,.studio-document-shell,.studio-timeline-controls,.studio-timeline-summary,.studio-budget-controls,.studio-budget-summary{grid-template-columns:1fr}.studio-timeline-item,.studio-budget-row{grid-template-columns:1fr 1fr}.studio-project-wide{grid-column:auto}.studio-message.user,.studio-message.assistant{margin-left:0;margin-right:0}}
        @media(max-width:700px){.studio-hero-metrics,.studio-composer,.studio-timeline-item,.studio-budget-row{grid-template-columns:1fr}}
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
