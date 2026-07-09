import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";

import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import ExecutivePageNav from "../components/ui/ExecutivePageNav";
import CollapsibleSection from "../components/ui/CollapsibleSection";
import BackToTopButton from "../components/ui/BackToTopButton";
import ShowMoreList from "../components/ui/ShowMoreList";

function arr(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.threads)) return value.threads;
  if (Array.isArray(value?.messages)) return value.messages;
  if (Array.isArray(value?.results)) return value.results;
  return [];
}

function clean(value = "") {
  return String(value || "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .trim();
}

function fmtDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return "—";
  }
}

function fmt(value) {
  return Number(value || 0).toLocaleString();
}

const intelligenceSources = [
  "Mission Control",
  "Election War Room",
  "Strategic Advisor",
  "Intelligence Reports",
  "Campaign CRM",
  "State Operations",
  "Donor Network",
  "Vendor Network",
  "Notifications",
  "Enterprise Leads",
];

const executiveActions = [
  "Create Task",
  "Assign to Mission Control",
  "Generate Client Report",
  "Notify Staff",
  "Open CRM",
  "Launch MailOps",
  "Create Fundraising Campaign",
  "Send to War Room",
];

const promptGroups = [
  {
    title: "Executive Strategy",
    prompts: [
      "Generate an executive brief for the next 48 hours.",
      "What should we do in the next 24 hours?",
      "What are the three biggest opportunities right now?",
      "What strategic decision should leadership make this week?",
    ],
  },
  {
    title: "Threats + Risk",
    prompts: [
      "What are the biggest threats right now?",
      "Which states require immediate intervention?",
      "What counties are showing the highest operational risk?",
      "What negative trend should we brief leadership on today?",
    ],
  },
  {
    title: "Fundraising",
    prompts: [
      "Summarize fundraising momentum this week.",
      "Which donor follow-ups should we prioritize?",
      "Generate a fundraising action plan for the next 7 days.",
      "What fundraising risks are emerging?",
    ],
  },
  {
    title: "Field + GOTV",
    prompts: [
      "Build a 30-day GOTV plan.",
      "Which counties should field teams prioritize?",
      "What volunteer growth opportunities exist this week?",
      "What field operations need owners?",
    ],
  },
  {
    title: "Communications",
    prompts: [
      "Draft a rapid response strategy for a negative media surge.",
      "What message should we use for suburban voters?",
      "What earned media opportunities should we pursue?",
      "Summarize the communications risk landscape.",
    ],
  },
  {
    title: "Client Reporting",
    prompts: [
      "What report should I generate for a client?",
      "Create an executive client summary.",
      "Summarize this workspace for a client-facing briefing.",
      "What should the client know before tomorrow morning?",
    ],
  },
];

function CopilotExecutiveHeader({
  stats,
  asking,
  lastUpdated,
  selectedContext,
  voiceEnabled,
  onNewThread,
  onGenerateBrief,
  onVoiceToggle,
}) {
  const confidence = asking ? 88 : 96;
  const readiness = Math.max(
    5,
    Math.min(
      100,
      Math.round(
        78 +
          Math.min(8, stats.threads * 1.5) +
          Math.min(8, stats.assistant * 2) +
          Math.min(6, stats.messages * 0.6) -
          (asking ? 8 : 0)
      )
    )
  );

  return (
    <div className="copilot-exec-ribbon" id="copilot-overview">
      <div className="copilot-exec-copy">
        <span>Executive Campaign Co-Pilot</span>
        <strong>{readiness}% Ready</strong>
        <p>
          Ask strategic campaign questions and convert intelligence into executable action across
          Mission Control, War Room, CRM, reports, vendors, state operations, and executive workflows.
        </p>

        <div className="copilot-exec-badges">
          <Badge tone="active">{stats.threads} Threads</Badge>
          <Badge tone="info">{stats.messages} Messages</Badge>
          <Badge tone={asking ? "demo" : "active"}>{asking ? "Thinking" : "Ready"}</Badge>
          <Badge tone="accent">{confidence}% AI Confidence</Badge>
          <Badge tone={voiceEnabled ? "active" : "danger"}>{voiceEnabled ? "Voice Ready" : "Voice Unsupported"}</Badge>
          <Badge tone="warning">{selectedContext.state || "National"}</Badge>
        </div>
      </div>

      <div className="copilot-exec-grid">
        <div>
          <span>AI Confidence</span>
          <strong>{confidence}%</strong>
        </div>
        <div>
          <span>Active Scope</span>
          <strong>{selectedContext.state || "National"}</strong>
        </div>
        <div>
          <span>Mission Status</span>
          <strong>{asking ? "Analyzing" : "Operational"}</strong>
        </div>
        <div>
          <span>Updated</span>
          <strong>{lastUpdated || "Ready"}</strong>
        </div>
      </div>

      <div className="copilot-exec-actions">
        <button type="button" onClick={onNewThread}>New Conversation</button>
        <button type="button" onClick={onGenerateBrief} disabled={asking}>
          Generate Executive Brief
        </button>
        <button type="button" onClick={onVoiceToggle} disabled={!voiceEnabled}>
          🎙 Voice Co-Pilot
        </button>
        <Link to="/mission-control">Mission Control</Link>
        <Link to="/war-room">War Room</Link>
        <Link to="/campaign-crm">Campaign CRM</Link>
        <Link to="/intelligence-reports">Reports</Link>
      </div>

      <div className="copilot-exec-footer">
        <span>Sources: {intelligenceSources.length} platform systems</span>
        <span>Action layer: tasks, reports, CRM, MailOps, War Room</span>
      </div>
    </div>
  );
}

function ExecutiveBriefPanel({ asking, selectedContext, stats }) {
  const riskLevel = asking ? "Analyzing" : "Competitive";
  const scope = selectedContext.state || "National";
  const campaign = selectedContext.campaign || "All Campaigns";

  return (
    <div className="copilot-brief-panel">
      <div className="copilot-brief-header">
        <div>
          <span>Executive Brief</span>
          <strong>{scope} Situation Room</strong>
        </div>
        <Badge tone={asking ? "demo" : "active"}>{asking ? "Thinking" : "Live"}</Badge>
      </div>

      <div className="copilot-brief-grid">
        <div>
          <span>National Climate</span>
          <strong>{riskLevel}</strong>
        </div>
        <div>
          <span>Highest Risk States</span>
          <strong>PA • MI • WI • AZ</strong>
        </div>
        <div>
          <span>Most Active Campaign</span>
          <strong>{campaign}</strong>
        </div>
        <div>
          <span>Top Threat</span>
          <strong>Media + Field Pressure</strong>
        </div>
        <div>
          <span>Immediate Recommendation</span>
          <strong>Increase suburban persuasion and assign field owners.</strong>
        </div>
        <div>
          <span>Conversation Context</span>
          <strong>{fmt(stats.messages)} messages analyzed</strong>
        </div>
      </div>
    </div>
  );
}

function WorkspaceContextSelector({ selectedContext, setSelectedContext }) {
  const update = (field, value) => {
    setSelectedContext((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="copilot-context-grid">
      <label>
        <span>Scope</span>
        <select value={selectedContext.scope} onChange={(event) => update("scope", event.target.value)}>
          <option>National</option>
          <option>State</option>
          <option>County</option>
          <option>Client</option>
          <option>Campaign</option>
        </select>
      </label>

      <label>
        <span>State</span>
        <input
          value={selectedContext.state}
          onChange={(event) => update("state", event.target.value)}
          placeholder="PA, GA, AZ..."
        />
      </label>

      <label>
        <span>Cycle</span>
        <input
          value={selectedContext.cycle}
          onChange={(event) => update("cycle", event.target.value)}
          placeholder="2026"
        />
      </label>

      <label>
        <span>Campaign / Client</span>
        <input
          value={selectedContext.campaign}
          onChange={(event) => update("campaign", event.target.value)}
          placeholder="Smith Senate, Client ABC..."
        />
      </label>
    </div>
  );
}

function IntelligenceSourcesPanel() {
  return (
    <div className="copilot-source-grid">
      {intelligenceSources.map((source) => (
        <div key={source} className="copilot-source-card">
          <span className="vs-live-dot-success" />
          <strong>{source}</strong>
          <small>Available context</small>
        </div>
      ))}
    </div>
  );
}

function SuggestedActionsPanel({ onAsk }) {
  return (
    <div className="copilot-action-grid">
      {executiveActions.map((action) => (
        <button
          key={action}
          type="button"
          onClick={() => onAsk(`Turn the last Co-Pilot answer into an action plan for: ${action}.`)}
        >
          {action}
        </button>
      ))}
    </div>
  );
}

function PromptLibrary({ onAsk, asking }) {
  return (
    <div className="copilot-prompt-library">
      {promptGroups.map((group) => (
        <div key={group.title} className="copilot-prompt-group">
          <div className="copilot-prompt-title">{group.title}</div>
          <div className="copilot-quick">
            {group.prompts.map((item) => (
              <button key={item} type="button" onClick={() => onAsk(item)} disabled={asking}>
                {item}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function PredictiveSignalsPanel() {
  const signals = [
    { title: "Pennsylvania competition rising", detail: "Field and media pressure should be reviewed this week.", tone: "warning" },
    { title: "Vendor capacity watch", detail: "Thin benches in priority states may slow execution.", tone: "demo" },
    { title: "CRM follow-up gap", detail: "High-value relationships should be prioritized before the next client report.", tone: "accent" },
    { title: "Fundraising momentum check", detail: "Ask the Co-Pilot for donor follow-up recommendations.", tone: "active" },
  ];

  return (
    <div className="copilot-signal-grid">
      {signals.map((signal) => (
        <div key={signal.title} className="copilot-signal-card">
          <Badge tone={signal.tone}>{signal.tone}</Badge>
          <strong>{signal.title}</strong>
          <p>{signal.detail}</p>
        </div>
      ))}
    </div>
  );
}

function KnowledgeGraphPreview() {
  const nodes = ["Candidate", "Donors", "PACs", "Vendors", "Counties", "Issues", "Media", "Influencers"];

  return (
    <div className="copilot-graph-preview">
      {nodes.map((node, index) => (
        <div key={node} className="copilot-graph-node">
          <span>{index + 1}</span>
          <strong>{node}</strong>
        </div>
      ))}
    </div>
  );
}


function getSpeechRecognition() {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

function isSpeechSupported() {
  return Boolean(getSpeechRecognition());
}

function isVoiceOutputSupported() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

function VoiceCopilotPanel({
  listening,
  voiceTranscript,
  voiceStatus,
  speechSupported,
  voiceOutputSupported,
  onStartListening,
  onStopListening,
  onSubmitVoice,
  onClearTranscript,
  onReadLastAnswer,
  onStopSpeaking,
}) {
  return (
    <div className="copilot-voice-panel">
      <div className="copilot-voice-header">
        <div>
          <span>Executive Voice Assistant</span>
          <strong>{listening ? "Listening..." : "Voice Co-Pilot"}</strong>
        </div>
        <Badge tone={speechSupported ? (listening ? "demo" : "active") : "danger"}>
          {speechSupported ? (listening ? "Live Mic" : "Ready") : "Not Supported"}
        </Badge>
      </div>

      <div className="copilot-voice-orb-wrap">
        <button
          type="button"
          className={`copilot-voice-orb ${listening ? "is-listening" : ""}`}
          onClick={listening ? onStopListening : onStartListening}
          disabled={!speechSupported}
          aria-label={listening ? "Stop voice listening" : "Start voice listening"}
        >
          🎙
        </button>
        <div>
          <strong>{voiceStatus || "Click the microphone and speak an executive command."}</strong>
          <p>
            Try: “Generate executive brief,” “What are today’s threats,”
            “Show Pennsylvania priorities,” or “Create tasks from this answer.”
          </p>
        </div>
      </div>

      <div className="copilot-voice-transcript">
        <span>Transcript</span>
        <p>{voiceTranscript || "No voice transcript yet."}</p>
      </div>

      <div className="copilot-voice-actions">
        <button type="button" onClick={onStartListening} disabled={!speechSupported || listening}>
          Start Listening
        </button>
        <button type="button" onClick={onStopListening} disabled={!listening}>
          Stop
        </button>
        <button type="button" onClick={onSubmitVoice} disabled={!voiceTranscript.trim()}>
          Ask Co-Pilot
        </button>
        <button type="button" onClick={onClearTranscript} disabled={!voiceTranscript}>
          Clear
        </button>
        <button type="button" onClick={onReadLastAnswer} disabled={!voiceOutputSupported}>
          🔊 Read Last Answer
        </button>
        <button type="button" onClick={onStopSpeaking} disabled={!voiceOutputSupported}>
          Stop Audio
        </button>
      </div>
    </div>
  );
}

function FloatingVoiceButton({ listening, speechSupported, onClick }) {
  return (
    <button
      type="button"
      className={`copilot-floating-mic ${listening ? "is-listening" : ""}`}
      onClick={onClick}
      disabled={!speechSupported}
      aria-label={listening ? "Stop voice assistant" : "Start voice assistant"}
      title={speechSupported ? "Voice Co-Pilot" : "Voice not supported in this browser"}
    >
      🎙
    </button>
  );
}

export default function AICampaignCopilot() {
  const [threads, setThreads] = useState([]);
  const [messages, setMessages] = useState([]);
  const [threadId, setThreadId] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");
  const [selectedContext, setSelectedContext] = useState({
    scope: "National",
    state: "",
    cycle: "2026",
    campaign: "",
  });
  const [listening, setListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [voiceStatus, setVoiceStatus] = useState("");
  const recognitionRef = useRef(null);

  const speechSupported = useMemo(() => isSpeechSupported(), []);
  const voiceOutputSupported = useMemo(() => isVoiceOutputSupported(), []);

  const loadThreads = useCallback(async () => {
    try {
      setLoadingThreads(true);
      setError("");

      const result = await api.aiCampaignCopilotThreads();
      const rows = arr(result);
      setThreads(rows);

      setLastUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.response?.data?.detail ||
          err?.message ||
          "Failed to load Co-Pilot threads."
      );
    } finally {
      setLoadingThreads(false);
    }
  }, []);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }

      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  function startVoiceListening() {
    const SpeechRecognition = getSpeechRecognition();

    if (!SpeechRecognition) {
      setVoiceStatus("Voice recognition is not supported in this browser.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.interimResults = true;
      recognition.continuous = false;

      recognition.onstart = () => {
        setListening(true);
        setVoiceStatus("Listening for your executive command...");
      };

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0]?.transcript || "")
          .join(" ")
          .trim();

        setVoiceTranscript(transcript);
        setVoiceStatus(transcript ? "Command captured. Submit or keep speaking." : "Listening...");
      };

      recognition.onerror = (event) => {
        setListening(false);
        setVoiceStatus(event?.error ? `Voice error: ${event.error}` : "Voice recognition error.");
      };

      recognition.onend = () => {
        setListening(false);
        setVoiceStatus("Voice capture ended.");
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      setListening(false);
      setVoiceStatus(err?.message || "Unable to start voice recognition.");
    }
  }

  function stopVoiceListening() {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    setListening(false);
    setVoiceStatus("Voice listening stopped.");
  }

  function submitVoiceCommand() {
    const command = clean(voiceTranscript);
    if (!command) return;

    ask(command);
    setVoiceTranscript("");
    setVoiceStatus("Voice command sent to Co-Pilot.");
  }

  function readLastAnswer() {
    if (!voiceOutputSupported) {
      setVoiceStatus("Text-to-speech is not supported in this browser.");
      return;
    }

    const lastAssistant = [...messages].reverse().find((item) => item.role === "assistant");
    if (!lastAssistant?.content) {
      setVoiceStatus("No assistant answer is available to read.");
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(clean(lastAssistant.content));
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.onstart = () => setVoiceStatus("Reading the last Co-Pilot answer...");
    utterance.onend = () => setVoiceStatus("Finished reading the last answer.");
    window.speechSynthesis.speak(utterance);
  }

  function stopSpeaking() {
    if (voiceOutputSupported) {
      window.speechSynthesis.cancel();
      setVoiceStatus("Voice playback stopped.");
    }
  }

  async function openThread(id) {
    try {
      setError("");
      const result = await api.aiCampaignCopilotThread(id);
      setThreadId(result?.thread?.id || id);
      setMessages(arr(result?.messages));
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Failed to open thread.");
    }
  }

  function buildPromptWithContext(value) {
    const contextParts = [
      `Scope: ${selectedContext.scope || "National"}`,
      selectedContext.state ? `State: ${selectedContext.state}` : "",
      selectedContext.cycle ? `Cycle: ${selectedContext.cycle}` : "",
      selectedContext.campaign ? `Campaign/Client: ${selectedContext.campaign}` : "",
    ].filter(Boolean);

    return `${value}\n\nContext:\n${contextParts.join("\n")}`;
  }

  async function ask(nextPrompt = prompt) {
    const value = clean(nextPrompt);
    if (!value) return;

    const optimisticUser = {
      id: `local-user-${Date.now()}`,
      role: "user",
      content: value,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticUser]);
    setPrompt("");
    setAsking(true);
    setError("");
    setMessage("");

    try {
      const result = await api.askAiCampaignCopilot({
        prompt: buildPromptWithContext(value),
        thread_id: threadId || null,
      });

      setThreadId(result?.thread_id || threadId);

      const assistantMessage = result?.message || {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: result?.answer || "No answer returned.",
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setMessage("Co-Pilot answered using live VoterSpheres intelligence.");
      await loadThreads();
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.response?.data?.detail ||
          err?.message ||
          "Failed to ask Co-Pilot."
      );
    } finally {
      setAsking(false);
    }
  }

  function startNewThread() {
    setThreadId(null);
    setMessages([]);
    setPrompt("");
    setMessage("Started a new Co-Pilot conversation.");
  }

  async function copyLastAnswer() {
    const lastAssistant = [...messages].reverse().find((item) => item.role === "assistant");
    if (!lastAssistant?.content) return;

    await navigator.clipboard.writeText(lastAssistant.content);
    setMessage("Last answer copied.");
  }

  function generateExecutiveBrief() {
    ask("Generate a complete executive campaign brief with executive summary, major threats, opportunities, recommended actions, priority tasks, funding outlook, media outlook, county hotspots, and a 48-hour action plan.");
  }

  const stats = useMemo(() => {
    return {
      threads: threads.length,
      messages: messages.length,
      assistant: messages.filter((item) => item.role === "assistant").length,
      user: messages.filter((item) => item.role === "user").length,
    };
  }, [threads, messages]);

  const navSections = [
    { id: "copilot-overview", label: "Overview" },
    { id: "copilot-brief", label: "Executive Brief" },
    { id: "copilot-context", label: "Context" },
    { id: "copilot-voice", label: "Voice" },
    { id: "copilot-chat", label: "Chat", badge: stats.messages },
    { id: "copilot-prompts", label: "Prompts" },
    { id: "copilot-sources", label: "Sources" },
    { id: "copilot-actions", label: "Actions" },
    { id: "copilot-predictive", label: "Predictive" },
  ];

  return (
    <PageShell
      eyebrow="AI Campaign Co-Pilot"
      title="AI Campaign Co-Pilot"
      description="Ask strategic campaign questions and get answers grounded in Mission Control, War Room, Strategic Advisor, reports, CRM, tasks, signals, and workspaces."
      tickerItems={[
        { label: "Threads", value: `${stats.threads}`, dotClass: "vs-live-dot-success" },
        { label: "Messages", value: `${stats.messages}`, dotClass: "vs-live-dot-success" },
        { label: "Mode", value: asking ? "Thinking" : "Ready", dotClass: asking ? "vs-live-dot-warning" : "vs-live-dot-success" },
        { label: "Updated", value: lastUpdated || "Ready", dotClass: "vs-live-dot-success" },
      ]}
    >
      <style>{`
        .copilot-exec-ribbon {
          display: grid;
          grid-template-columns: minmax(300px, 0.95fr) minmax(0, 1.15fr);
          gap: 18px;
          align-items: stretch;
          border: 1px solid rgba(148, 163, 184, 0.16);
          border-radius: 28px;
          background:
            radial-gradient(circle at top right, rgba(59, 130, 246, 0.18), transparent 34%),
            radial-gradient(circle at bottom left, rgba(168, 85, 247, 0.14), transparent 30%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.94), rgba(2, 6, 23, 0.86));
          box-shadow: 0 28px 80px rgba(2, 6, 23, 0.32);
          padding: 20px;
          min-width: 0;
          overflow: hidden;
        }

        .copilot-exec-copy { min-width: 0; }

        .copilot-exec-copy span,
        .copilot-exec-grid span,
        .copilot-exec-footer span,
        .copilot-brief-header span,
        .copilot-brief-grid span,
        .copilot-context-grid span,
        .copilot-mini-label,
        .copilot-signal-card p,
        .copilot-graph-node span {
          display: block;
          color: rgba(147, 197, 253, 0.86);
          font-size: 11px;
          font-weight: 950;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .copilot-exec-copy strong {
          display: block;
          margin-top: 8px;
          color: white;
          font-size: clamp(30px, 4vw, 50px);
          line-height: 1;
          font-weight: 950;
          letter-spacing: -0.07em;
        }

        .copilot-exec-copy p {
          margin: 12px 0 0;
          color: rgba(226, 232, 240, 0.78);
          line-height: 1.6;
          max-width: 820px;
        }

        .copilot-exec-badges,
        .copilot-exec-actions,
        .copilot-exec-footer,
        .copilot-quick,
        .copilot-action-grid,
        .copilot-bubble-sources,
        .copilot-message-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          align-items: center;
        }

        .copilot-exec-badges { margin-top: 14px; }

        .copilot-exec-grid,
        .copilot-brief-grid,
        .copilot-context-grid,
        .copilot-source-grid,
        .copilot-signal-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          min-width: 0;
        }

        .copilot-exec-grid div,
        .copilot-brief-grid div,
        .copilot-source-card,
        .copilot-signal-card,
        .copilot-graph-node {
          border: 1px solid rgba(148, 163, 184, 0.14);
          border-radius: 18px;
          background: rgba(2, 6, 23, 0.34);
          padding: 14px;
          min-width: 0;
        }

        .copilot-exec-grid strong,
        .copilot-brief-grid strong,
        .copilot-source-card strong,
        .copilot-signal-card strong,
        .copilot-graph-node strong {
          display: block;
          margin-top: 7px;
          color: white;
          font-size: 18px;
          font-weight: 950;
          overflow-wrap: anywhere;
        }

        .copilot-exec-actions,
        .copilot-exec-footer {
          grid-column: 1 / -1;
          border-top: 1px solid rgba(148, 163, 184, 0.12);
          padding-top: 14px;
        }

        .copilot-exec-actions button,
        .copilot-exec-actions a,
        .copilot-action-grid button,
        .copilot-message-actions button {
          border: 1px solid rgba(148, 163, 184, 0.18);
          background: rgba(15, 23, 42, 0.74);
          color: rgba(226, 232, 240, 0.92);
          border-radius: 15px;
          padding: 11px 12px;
          font-size: 12px;
          font-weight: 850;
          cursor: pointer;
          text-decoration: none;
        }

        .copilot-exec-actions button:hover,
        .copilot-exec-actions a:hover,
        .copilot-action-grid button:hover,
        .copilot-message-actions button:hover {
          border-color: rgba(96, 165, 250, 0.48);
          background: rgba(37, 99, 235, 0.24);
          color: white;
        }

        .copilot-exec-actions button:disabled,
        .copilot-action-grid button:disabled {
          opacity: 0.62;
          cursor: not-allowed;
        }

        .copilot-exec-stack,
        .copilot-stack {
          display: grid;
          gap: 18px;
          min-width: 0;
        }

        .copilot-grid {
          display: grid;
          grid-template-columns: minmax(320px, 0.36fr) minmax(0, 1fr);
          gap: 18px;
          align-items: start;
        }

        .copilot-sidebar {
          display: grid;
          gap: 14px;
        }

        .copilot-thread {
          border-radius: 18px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          background: rgba(15, 23, 42, 0.58);
          padding: 12px;
          cursor: pointer;
        }

        .copilot-thread strong {
          display: block;
          color: white;
          font-size: 13px;
          line-height: 1.35;
        }

        .copilot-thread span {
          display: block;
          margin-top: 5px;
          color: rgba(203, 213, 225, 0.62);
          font-size: 11px;
        }

        .copilot-chat {
          min-height: 620px;
          display: grid;
          grid-template-rows: minmax(0, 1fr) auto;
          gap: 14px;
        }

        .copilot-messages {
          display: grid;
          gap: 12px;
          align-content: start;
          max-height: 680px;
          overflow: auto;
          padding-right: 4px;
        }

        .copilot-bubble {
          border-radius: 22px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          padding: 14px;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
          font-size: 13px;
          line-height: 1.6;
        }

        .copilot-bubble.user {
          background: rgba(37, 99, 235, 0.18);
          color: rgba(239, 246, 255, 0.95);
          margin-left: 48px;
        }

        .copilot-bubble.assistant {
          background:
            radial-gradient(circle at top right, rgba(59, 130, 246, 0.1), transparent 34%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.86), rgba(2, 6, 23, 0.62));
          color: rgba(226, 232, 240, 0.95);
          margin-right: 48px;
        }

        .copilot-bubble small {
          display: block;
          margin-bottom: 8px;
          color: rgba(203, 213, 225, 0.56);
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-weight: 900;
        }

        .copilot-bubble-sources {
          margin-top: 12px;
          padding-top: 10px;
          border-top: 1px solid rgba(148, 163, 184, 0.12);
        }

        .copilot-message-actions {
          margin-top: 10px;
        }

        .copilot-input {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 10px;
        }

        .copilot-input textarea {
          width: 100%;
          min-height: 86px;
          border-radius: 18px;
          border: 1px solid rgba(148, 163, 184, 0.18);
          background: rgba(15, 23, 42, 0.74);
          color: white;
          padding: 12px;
          outline: none;
          resize: vertical;
        }

        .copilot-quick button,
        .copilot-prompt-group button {
          border: 1px solid rgba(148, 163, 184, 0.18);
          background: rgba(15, 23, 42, 0.62);
          color: rgba(226, 232, 240, 0.9);
          border-radius: 999px;
          padding: 8px 10px;
          cursor: pointer;
          font-size: 12px;
        }

        .copilot-message {
          border-radius: 16px;
          border: 1px solid rgba(96, 165, 250, 0.24);
          background: rgba(37, 99, 235, 0.14);
          color: rgba(226, 232, 240, 0.92);
          padding: 12px;
        }

        .copilot-brief-panel,
        .copilot-ai-panel {
          border-radius: 24px;
          border: 1px solid rgba(96, 165, 250, 0.24);
          background:
            radial-gradient(circle at top right, rgba(37, 99, 235, 0.18), transparent 36%),
            rgba(15, 23, 42, 0.58);
          padding: 18px;
        }

        .copilot-brief-header {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 14px;
        }

        .copilot-brief-header strong {
          display: block;
          margin-top: 5px;
          color: white;
          font-size: 22px;
          font-weight: 950;
          letter-spacing: -0.05em;
        }

        .copilot-context-grid label {
          display: grid;
          gap: 7px;
        }

        .copilot-context-grid input,
        .copilot-context-grid select {
          width: 100%;
          border-radius: 14px;
          border: 1px solid rgba(148, 163, 184, 0.18);
          background: rgba(15, 23, 42, 0.74);
          color: white;
          padding: 11px 12px;
          outline: none;
        }

        .copilot-source-card {
          display: grid;
          gap: 6px;
        }

        .copilot-source-card small {
          color: rgba(203, 213, 225, 0.66);
          font-size: 11px;
        }

        .copilot-prompt-library {
          display: grid;
          gap: 14px;
        }

        .copilot-prompt-group {
          border-radius: 20px;
          border: 1px solid rgba(148, 163, 184, 0.14);
          background: rgba(15, 23, 42, 0.46);
          padding: 14px;
        }

        .copilot-prompt-title {
          color: white;
          font-weight: 950;
          margin-bottom: 10px;
        }

        .copilot-signal-card p {
          margin: 8px 0 0;
          color: rgba(226, 232, 240, 0.74);
          text-transform: none;
          letter-spacing: normal;
          font-size: 13px;
          line-height: 1.55;
          font-weight: 500;
        }

        .copilot-graph-preview {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 12px;
        }

        .copilot-graph-node {
          text-align: center;
        }


        .copilot-voice-panel {
          border-radius: 24px;
          border: 1px solid rgba(96, 165, 250, 0.24);
          background:
            radial-gradient(circle at top right, rgba(14, 165, 233, 0.2), transparent 36%),
            radial-gradient(circle at bottom left, rgba(168, 85, 247, 0.15), transparent 34%),
            rgba(15, 23, 42, 0.64);
          padding: 18px;
          display: grid;
          gap: 16px;
        }

        .copilot-voice-header {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          align-items: flex-start;
        }

        .copilot-voice-header span,
        .copilot-voice-transcript span {
          display: block;
          color: rgba(147, 197, 253, 0.86);
          font-size: 11px;
          font-weight: 950;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .copilot-voice-header strong {
          display: block;
          margin-top: 5px;
          color: white;
          font-size: 22px;
          font-weight: 950;
          letter-spacing: -0.04em;
        }

        .copilot-voice-orb-wrap {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr);
          gap: 16px;
          align-items: center;
        }

        .copilot-voice-orb {
          width: 82px;
          height: 82px;
          border-radius: 999px;
          border: 1px solid rgba(96, 165, 250, 0.38);
          background:
            radial-gradient(circle, rgba(59, 130, 246, 0.34), rgba(15, 23, 42, 0.88));
          color: white;
          font-size: 32px;
          cursor: pointer;
          box-shadow: 0 0 34px rgba(37, 99, 235, 0.24);
        }

        .copilot-voice-orb.is-listening,
        .copilot-floating-mic.is-listening {
          animation: copilotPulse 1.25s infinite;
          border-color: rgba(34, 197, 94, 0.72);
          box-shadow: 0 0 44px rgba(34, 197, 94, 0.36);
        }

        .copilot-voice-orb:disabled,
        .copilot-floating-mic:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .copilot-voice-orb-wrap strong {
          color: white;
          font-size: 16px;
          font-weight: 900;
        }

        .copilot-voice-orb-wrap p {
          margin: 6px 0 0;
          color: rgba(226, 232, 240, 0.74);
          font-size: 13px;
          line-height: 1.6;
        }

        .copilot-voice-transcript {
          border: 1px solid rgba(148, 163, 184, 0.14);
          border-radius: 18px;
          background: rgba(2, 6, 23, 0.34);
          padding: 14px;
        }

        .copilot-voice-transcript p {
          margin: 7px 0 0;
          color: rgba(226, 232, 240, 0.92);
          line-height: 1.6;
          min-height: 42px;
        }

        .copilot-voice-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          align-items: center;
        }

        .copilot-voice-actions button {
          border: 1px solid rgba(148, 163, 184, 0.18);
          background: rgba(15, 23, 42, 0.74);
          color: rgba(226, 232, 240, 0.92);
          border-radius: 15px;
          padding: 10px 12px;
          font-size: 12px;
          font-weight: 850;
          cursor: pointer;
        }

        .copilot-voice-actions button:hover {
          border-color: rgba(96, 165, 250, 0.48);
          background: rgba(37, 99, 235, 0.24);
          color: white;
        }

        .copilot-voice-actions button:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .copilot-floating-mic {
          position: fixed;
          right: 24px;
          bottom: 24px;
          z-index: 50;
          width: 62px;
          height: 62px;
          border-radius: 999px;
          border: 1px solid rgba(96, 165, 250, 0.44);
          background:
            radial-gradient(circle, rgba(37, 99, 235, 0.42), rgba(2, 6, 23, 0.92));
          color: white;
          font-size: 26px;
          cursor: pointer;
          box-shadow: 0 22px 60px rgba(2, 6, 23, 0.48);
        }

        @keyframes copilotPulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.06); }
          100% { transform: scale(1); }
        }

        @media (max-width: 1100px) {
          .copilot-grid,
          .copilot-input,
          .copilot-exec-ribbon,
          .copilot-exec-grid,
          .copilot-brief-grid,
          .copilot-context-grid,
          .copilot-source-grid,
          .copilot-signal-grid {
            grid-template-columns: 1fr;
          }

          .copilot-bubble.user,
          .copilot-bubble.assistant {
            margin-left: 0;
            margin-right: 0;
          }
        }
      `}</style>

      <div className="copilot-exec-stack">
        <CopilotExecutiveHeader
          stats={stats}
          asking={asking}
          lastUpdated={lastUpdated}
          selectedContext={selectedContext}
          voiceEnabled={speechSupported}
          onNewThread={startNewThread}
          onGenerateBrief={generateExecutiveBrief}
          onVoiceToggle={listening ? stopVoiceListening : startVoiceListening}
        />

        <ExecutivePageNav sections={navSections} />
      </div>

      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}
      {message ? <div className="copilot-message">{message}</div> : null}

      <CollapsibleSection
        id="copilot-brief"
        title="AI Situation Room"
        subtitle="Executive campaign posture, immediate risk, and suggested strategic direction."
        defaultOpen
        right={<Badge tone={asking ? "demo" : "active"}>{asking ? "Analyzing" : "Live Brief"}</Badge>}
      >
        <ExecutiveBriefPanel asking={asking} selectedContext={selectedContext} stats={stats} />
      </CollapsibleSection>

      <CollapsibleSection
        id="copilot-metrics"
        title="Co-Pilot Metrics"
        subtitle="Conversation health, response count, and active intelligence mode."
        defaultOpen
        right={<Badge tone="accent">{stats.threads} Threads</Badge>}
      >
        <div className="vs-grid-4">
          <StatCard label="Threads" value={stats.threads} delta="Saved conversations" tone="up" />
          <StatCard label="Messages" value={stats.messages} delta="Current thread" tone="neutral" />
          <StatCard label="Answers" value={stats.assistant} delta="Co-Pilot responses" tone="up" />
          <StatCard label="Status" value={asking ? "Thinking" : "Ready"} delta="Live intelligence context" tone={asking ? "neutral" : "up"} />
        </div>
      </CollapsibleSection>

      <div className="copilot-grid">
        <div className="copilot-sidebar">
          <CollapsibleSection
            title="Conversations"
            subtitle="Saved Co-Pilot threads."
            defaultOpen
            right={<Badge tone="accent">{threads.length}</Badge>}
          >
            <div className="copilot-stack">
              <button className="vs-button" onClick={startNewThread}>
                New Conversation
              </button>

              {loadingThreads ? (
                <EmptyState text="Loading conversations..." />
              ) : !threads.length ? (
                <EmptyState text="No Co-Pilot conversations yet." />
              ) : (
                <ShowMoreList
                  items={threads}
                  initialCount={8}
                  showAllLabel={(count) => `Show All ${count} Conversations`}
                  className="copilot-stack"
                  renderItem={(thread) => (
                    <div className="copilot-thread" onClick={() => openThread(thread.id)}>
                      <strong>{thread.title || "Campaign Co-Pilot Conversation"}</strong>
                      <span>{fmtDate(thread.updated_at)}</span>
                    </div>
                  )}
                />
              )}
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            id="copilot-context"
            title="Workspace Context"
            subtitle="Scope every AI answer to the right state, cycle, client, or campaign."
            defaultOpen
            right={<Badge tone="warning">{selectedContext.state || selectedContext.scope}</Badge>}
          >
            <WorkspaceContextSelector
              selectedContext={selectedContext}
              setSelectedContext={setSelectedContext}
            />
          </CollapsibleSection>

          <CollapsibleSection
            id="copilot-voice"
            title="Voice Co-Pilot"
            subtitle="Speak executive commands and listen to AI responses."
            defaultOpen
            right={<Badge tone={speechSupported ? (listening ? "demo" : "active") : "danger"}>{speechSupported ? "Voice Ready" : "Unsupported"}</Badge>}
          >
            <VoiceCopilotPanel
              listening={listening}
              voiceTranscript={voiceTranscript}
              voiceStatus={voiceStatus}
              speechSupported={speechSupported}
              voiceOutputSupported={voiceOutputSupported}
              onStartListening={startVoiceListening}
              onStopListening={stopVoiceListening}
              onSubmitVoice={submitVoiceCommand}
              onClearTranscript={() => {
                setVoiceTranscript("");
                setVoiceStatus("Transcript cleared.");
              }}
              onReadLastAnswer={readLastAnswer}
              onStopSpeaking={stopSpeaking}
            />
          </CollapsibleSection>

          <CollapsibleSection title="Operating Links" subtitle="Jump to source systems." defaultOpen={false}>
            <div className="copilot-stack">
              <Link className="vs-button vs-button-secondary" to="/war-room">Election War Room</Link>
              <Link className="vs-button vs-button-secondary" to="/mission-control">Mission Control</Link>
              <Link className="vs-button vs-button-secondary" to="/strategic-advisor">Strategic Advisor</Link>
              <Link className="vs-button vs-button-secondary" to="/political-intelligence">Intelligence Graph</Link>
              <Link className="vs-button vs-button-secondary" to="/intelligence-reports">Reports</Link>
              <Link className="vs-button vs-button-secondary" to="/campaign-crm">Campaign CRM</Link>
            </div>
          </CollapsibleSection>
        </div>

        <CollapsibleSection
          id="copilot-chat"
          title="Campaign Co-Pilot"
          subtitle="Ask what to do next, where pressure is rising, which tasks need owners, or what to tell a client."
          defaultOpen
          right={<Badge tone={asking ? "demo" : "active"}>{asking ? "Thinking" : "Ready"}</Badge>}
        >
          <div className="copilot-chat">
            <div className="copilot-messages">
              {!messages.length ? (
                <EmptyState text="Ask the Co-Pilot a campaign strategy question." />
              ) : (
                messages.map((item) => (
                  <div key={item.id || `${item.role}-${item.created_at}`} className={`copilot-bubble ${item.role}`}>
                    <small>{item.role === "assistant" ? "AI Campaign Co-Pilot" : "You"} • {fmtDate(item.created_at)}</small>
                    {item.content}

                    {item.role === "assistant" ? (
                      <>
                        <div className="copilot-bubble-sources">
                          {intelligenceSources.slice(0, 5).map((source) => (
                            <Badge key={source} tone="info">{source}</Badge>
                          ))}
                          <Badge tone="active">Confidence 96%</Badge>
                        </div>

                        <div className="copilot-message-actions">
                          <button type="button" onClick={() => ask("Create Mission Control tasks from the previous answer.")}>Create Tasks</button>
                          <button type="button" onClick={() => ask("Turn the previous answer into a client-ready executive report.")}>Client Report</button>
                          <button type="button" onClick={() => ask("Summarize the previous answer for the War Room.")}>War Room Summary</button>
                          <button type="button" onClick={readLastAnswer}>🔊 Listen</button>
                        </div>
                      </>
                    ) : null}
                  </div>
                ))
              )}
            </div>

            <div className="copilot-stack">
              <div className="copilot-input">
                <textarea
                  placeholder="Ask: What should we do in Pennsylvania this week?"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                      ask();
                    }
                  }}
                />

                <button className="vs-button" onClick={() => ask()} disabled={asking || !prompt.trim()}>
                  {asking ? "Thinking..." : "Ask"}
                </button>
              </div>

              <button className="vs-button vs-button-secondary" onClick={copyLastAnswer} disabled={!messages.some((item) => item.role === "assistant")}>
                Copy Last Answer
              </button>
            </div>
          </div>
        </CollapsibleSection>
      </div>

      <CollapsibleSection
        id="copilot-prompts"
        title="Executive Prompt Library"
        subtitle="Reusable prompts grouped by campaign function."
        defaultOpen={false}
        right={<Badge tone="accent">{promptGroups.length} Categories</Badge>}
      >
        <PromptLibrary onAsk={ask} asking={asking} />
      </CollapsibleSection>

      <CollapsibleSection
        id="copilot-sources"
        title="Intelligence Sources"
        subtitle="Platform systems the Co-Pilot can use as campaign context."
        defaultOpen={false}
        right={<Badge tone="active">{intelligenceSources.length} Sources</Badge>}
      >
        <IntelligenceSourcesPanel />
      </CollapsibleSection>

      <CollapsibleSection
        id="copilot-actions"
        title="Suggested Executive Actions"
        subtitle="Convert AI responses into execution workflows."
        defaultOpen={false}
        right={<Badge tone="active">{executiveActions.length} Actions</Badge>}
      >
        <SuggestedActionsPanel onAsk={ask} />
      </CollapsibleSection>

      <CollapsibleSection
        id="copilot-predictive"
        title="Predictive Intelligence"
        subtitle="Proactive campaign signals and political knowledge graph preview."
        defaultOpen={false}
        right={<Badge tone="warning">Forward Look</Badge>}
      >
        <div className="copilot-stack">
          <PredictiveSignalsPanel />
          <KnowledgeGraphPreview />
        </div>
      </CollapsibleSection>

      <FloatingVoiceButton
        listening={listening}
        speechSupported={speechSupported}
        onClick={listening ? stopVoiceListening : startVoiceListening}
      />

      <BackToTopButton />
    </PageShell>
  );
}

