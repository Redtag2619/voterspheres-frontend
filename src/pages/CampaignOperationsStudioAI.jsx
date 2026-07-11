import { useCallback, useEffect, useMemo, useState } from "react";
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

  const stats = useMemo(() => ({
    threads: threads.length,
    messages: messages.length,
    deliverables: deliverables.length,
    completeChecklist: checklist.filter((item) => item.complete).length,
  }), [threads, messages, deliverables, checklist]);

  const navSections = [
    { id: "studio-overview", label: "Overview" },
    { id: "studio-project", label: "Project Setup" },
    { id: "studio-modules", label: "Builder Modules" },
    { id: "studio-workspace", label: "AI Workspace", badge: stats.messages },
    { id: "studio-deliverables", label: "Deliverables", badge: stats.deliverables },
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
        @media(max-width:1100px){.studio-hero,.studio-workspace-grid,.studio-project-grid{grid-template-columns:1fr}.studio-project-wide{grid-column:auto}.studio-message.user,.studio-message.assistant{margin-left:0;margin-right:0}}
        @media(max-width:700px){.studio-hero-metrics,.studio-composer{grid-template-columns:1fr}}
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

            <div className="studio-ai-actions">
              <button type="button" onClick={() => ask("Refine the previous answer into a more concise executive version.")}>Refine</button>
              <button type="button" onClick={() => ask("Expand the previous answer with owners, dates, risks, metrics, and dependencies.")}>Expand</button>
              <button type="button" onClick={() => ask("Convert the previous answer into Mission Control tasks with owners and due dates.")}>Create Task Plan</button>
              <button type="button" onClick={() => convertLastAnswerToDeliverable(`${activeModule.label} Deliverable`)}>Save as Deliverable</button>
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
