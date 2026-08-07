import { useMemo, useState } from "react";
import Badge from "../ui/Badge";
import useExecutiveVoiceRealtime from "../../hooks/useExecutiveVoiceRealtime";

function labelize(value = "") {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function statusTone(status = "") {
  const normalized = String(status || "").toLowerCase();

  if (["error", "peer_failed", "peer_disconnected", "data_channel_closed"].includes(normalized)) {
    return "danger";
  }

  if (["speaking", "responding", "thinking", "connecting_to_openai", "creating_offer", "negotiating", "registering", "tool-running"].includes(normalized)) {
    return "accent";
  }

  if (["connected", "session_ready", "ready", "listening", "microphone_on"].includes(normalized)) {
    return "active";
  }

  return "info";
}

function formatMessageTime(value) {
  if (!value) return "Now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Now";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function createMessage({ role, text, source = "realtime", meta = null }) {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    role,
    text,
    source,
    meta,
    createdAt: new Date().toISOString(),
  };
}

function toolSummary(tool) {
  if (!tool?.name) return "No live tool has run yet.";
  if (tool.status === "running") return `Retrieving ${labelize(tool.name)}…`;
  if (tool.status === "error") return `${labelize(tool.name)} failed.`;
  return `${labelize(tool.name)} completed.`;
}

export default function ExecutiveRealtimeVoicePanel({
  agent = "executive_chief_of_staff",
  agentLabel = "Executive Chief of Staff",
  workspaceId = 1,
  executiveContext = {},
  onUserTranscript,
  onAssistantTranscript,
  onRealtimeEvent,
}) {
  const [textInput, setTextInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [eventCount, setEventCount] = useState(0);

  const realtime = useExecutiveVoiceRealtime({
    voice: "marin",
    agent,
    workspaceId,
    executiveContext,
    onEvent: (event) => {
      setEventCount((current) => current + 1);
      onRealtimeEvent?.(event);
    },
    onUserTranscript: (payload) => {
      if (!payload?.delta && payload?.text) {
        setMessages((current) => [
          ...current,
          createMessage({
            role: "user",
            text: payload.text,
            source: "microphone",
          }),
        ]);
      }
      onUserTranscript?.(payload);
    },
    onAssistantTranscript: (payload) => {
      if (payload?.text) {
        setMessages((current) => [
          ...current,
          createMessage({
            role: "assistant",
            text: payload.text,
            source: "realtime",
          }),
        ]);
      }
      onAssistantTranscript?.(payload);
    },
  });

  const statusLabel = useMemo(() => labelize(realtime.status), [realtime.status]);
  const liveToolsLabel = useMemo(
    () => labelize(realtime.liveToolsStatus || "idle"),
    [realtime.liveToolsStatus]
  );

  function submitText(event) {
    event.preventDefault();
    const value = textInput.trim();
    if (!value) return;

    const sent = realtime.sendText(value, {
      metadata: {
        source: "executive_realtime_panel",
        agent,
        workspace_id: workspaceId,
      },
      instructions:
        "Answer using registered VoterSpheres tools whenever the request depends on current or workspace-specific data.",
    });

    if (!sent) return;

    setMessages((current) => [
      ...current,
      createMessage({ role: "user", text: value, source: "typed" }),
    ]);
    setTextInput("");
  }

  function clearConversation() {
    setMessages([]);
    setTextInput("");
    realtime.clearTranscripts();
  }

  async function startSession() {
    try {
      await realtime.connect();
      await realtime.resumeAudio();
    } catch {
      // Hook exposes the readable error.
    }
  }

  return (
    <div className="exec-rtc-panel">
      <style>{`
        .exec-rtc-panel{border:1px solid rgba(96,165,250,.24);border-radius:24px;background:radial-gradient(circle at top right,rgba(59,130,246,.14),transparent 38%),linear-gradient(145deg,rgba(2,6,23,.96),rgba(15,23,42,.9));overflow:hidden;min-width:0}
        .exec-rtc-header{display:flex;justify-content:space-between;gap:16px;align-items:center;padding:18px;border-bottom:1px solid rgba(148,163,184,.13)}
        .exec-rtc-header-copy span{display:block;color:rgba(147,197,253,.86);font-size:10px;font-weight:900;letter-spacing:.09em;text-transform:uppercase}.exec-rtc-header-copy strong{display:block;margin-top:5px;color:white;font-size:21px;line-height:1.2}.exec-rtc-header-copy small{display:block;margin-top:5px;color:rgba(148,163,184,.76);font-size:10px}
        .exec-rtc-actions,.exec-rtc-status-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center}.exec-rtc-actions{justify-content:flex-end}.exec-rtc-button{border:1px solid rgba(148,163,184,.18);border-radius:12px;background:rgba(15,23,42,.72);color:#e2e8f0;padding:10px 12px;font-weight:800;font-size:11px;cursor:pointer}.exec-rtc-button.primary{border-color:rgba(251,146,60,.4);background:linear-gradient(135deg,#f97316,#ea580c);color:white}.exec-rtc-button:disabled{opacity:.5;cursor:not-allowed}
        .exec-rtc-intel{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;padding:14px 18px;border-bottom:1px solid rgba(148,163,184,.12);background:rgba(2,6,23,.28)}.exec-rtc-intel>div{border:1px solid rgba(148,163,184,.12);border-radius:13px;background:rgba(15,23,42,.42);padding:10px;min-width:0}.exec-rtc-intel span{display:block;color:#94a3b8;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:.08em}.exec-rtc-intel strong{display:block;margin-top:5px;color:white;font-size:12px;overflow-wrap:anywhere}
        .exec-rtc-error{margin:14px 18px 0;padding:12px 14px;border:1px solid rgba(239,68,68,.3);border-radius:12px;background:rgba(127,29,29,.18);color:#fecaca;font-size:12px}
        .exec-rtc-body{display:grid;grid-template-columns:minmax(0,1fr) 270px;min-height:430px}.exec-rtc-conversation{padding:18px;display:grid;align-content:start;gap:12px;max-height:560px;overflow:auto}.exec-rtc-empty{border:1px dashed rgba(148,163,184,.18);border-radius:16px;padding:22px;color:#94a3b8;line-height:1.65;font-size:12px}.exec-rtc-message{max-width:84%;border:1px solid rgba(148,163,184,.13);border-radius:17px;padding:13px 15px;background:rgba(15,23,42,.5)}.exec-rtc-message.user{margin-left:auto;border-color:rgba(96,165,250,.26);background:rgba(37,99,235,.12)}.exec-rtc-message-head{display:flex;justify-content:space-between;gap:10px}.exec-rtc-message-head strong{color:white;font-size:11px}.exec-rtc-message-head span{color:#64748b;font-size:9px}.exec-rtc-message p{margin:8px 0 0;color:#e2e8f0;font-size:13px;line-height:1.65;white-space:pre-wrap}
        .exec-rtc-live{border-left:1px solid rgba(148,163,184,.12);padding:16px;background:rgba(2,6,23,.25);display:grid;align-content:start;gap:12px}.exec-rtc-live h4{margin:0;color:white;font-size:13px}.exec-rtc-live-card{border:1px solid rgba(148,163,184,.12);border-radius:14px;background:rgba(15,23,42,.44);padding:11px}.exec-rtc-live-card span{display:block;color:#94a3b8;font-size:9px;text-transform:uppercase;font-weight:900;letter-spacing:.08em}.exec-rtc-live-card strong{display:block;margin-top:5px;color:#f8fafc;font-size:11px;line-height:1.45;overflow-wrap:anywhere}
        .exec-rtc-composer{border-top:1px solid rgba(148,163,184,.12);padding:14px 18px;background:rgba(15,23,42,.42)}.exec-rtc-composer form{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px}.exec-rtc-composer input{width:100%;border:1px solid rgba(148,163,184,.16);border-radius:12px;background:rgba(2,6,23,.5);color:white;padding:12px;outline:none}.exec-rtc-composer input:focus{border-color:rgba(96,165,250,.48);box-shadow:0 0 0 3px rgba(59,130,246,.08)}
        .exec-rtc-footer{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:12px 18px;border-top:1px solid rgba(148,163,184,.1);color:#64748b;font-size:9px}
        @media(max-width:900px){.exec-rtc-header{align-items:flex-start;flex-direction:column}.exec-rtc-actions{justify-content:flex-start}.exec-rtc-intel{grid-template-columns:1fr}.exec-rtc-body{grid-template-columns:1fr}.exec-rtc-live{border-left:0;border-top:1px solid rgba(148,163,184,.12)}.exec-rtc-composer form{grid-template-columns:1fr}.exec-rtc-message{max-width:96%}}
      `}</style>

      <div className="exec-rtc-header">
        <div className="exec-rtc-header-copy">
          <span>Unified Executive Voice Intelligence</span>
          <strong>{agentLabel}</strong>
          <small>
            Realtime voice connected to VoterSpheres polling, FEC, candidate,
            news, state operations, election administration, legislative,
            weather/field, and executive intelligence tools.
          </small>
        </div>

        <div className="exec-rtc-actions">
          <Badge tone={statusTone(realtime.status)}>{statusLabel}</Badge>
          <Badge tone={statusTone(realtime.liveToolsStatus)}>
            Data Tools: {liveToolsLabel}
          </Badge>

          {!realtime.connected ? (
            <button type="button" className="exec-rtc-button primary" onClick={startSession}>
              Start Live Voice
            </button>
          ) : (
            <>
              <button
                type="button"
                className="exec-rtc-button"
                onClick={() => realtime.setMicrophoneEnabled(!realtime.microphoneEnabled)}
              >
                {realtime.microphoneEnabled ? "Mute Mic" : "Unmute Mic"}
              </button>
              <button type="button" className="exec-rtc-button" onClick={realtime.interrupt}>
                Interrupt AI
              </button>
              <button
                type="button"
                className="exec-rtc-button"
                onClick={() => realtime.registerLiveTools({ force: true })}
              >
                Refresh Data Tools
              </button>
              <button type="button" className="exec-rtc-button" onClick={realtime.disconnect}>
                End Session
              </button>
            </>
          )}

          <button type="button" className="exec-rtc-button" onClick={clearConversation}>
            Clear
          </button>
        </div>
      </div>

      <div className="exec-rtc-intel">
        <div>
          <span>Workspace</span>
          <strong>{workspaceId}</strong>
        </div>
        <div>
          <span>Live Retrieval</span>
          <strong>
            {realtime.liveToolsStatus === "ready"
              ? "VoterSpheres tools registered"
              : `Tools ${labelize(realtime.liveToolsStatus || "idle")}`}
          </strong>
        </div>
        <div>
          <span>Last Tool</span>
          <strong>{toolSummary(realtime.lastLiveTool)}</strong>
        </div>
      </div>

      {realtime.error ? <div className="exec-rtc-error">{realtime.error}</div> : null}

      <div className="exec-rtc-body">
        <div className="exec-rtc-conversation">
          {!messages.length && !realtime.userTranscript && !realtime.assistantTranscript ? (
            <div className="exec-rtc-empty">
              Start Live Voice and ask a real VoterSpheres intelligence question. Examples:
              “What are the latest polls in Georgia?”, “How much cash does this candidate have?”,
              “What is happening politically today?”, or “Give me the full executive briefing.”
            </div>
          ) : null}

          {messages.map((message) => (
            <div key={message.id} className={`exec-rtc-message ${message.role}`}>
              <div className="exec-rtc-message-head">
                <strong>{message.role === "user" ? "You" : agentLabel}</strong>
                <span>{formatMessageTime(message.createdAt)}</span>
              </div>
              <p>{message.text}</p>
            </div>
          ))}

          {realtime.userTranscript ? (
            <div className="exec-rtc-message user">
              <div className="exec-rtc-message-head"><strong>You</strong><span>Live</span></div>
              <p>{realtime.userTranscript}</p>
            </div>
          ) : null}

          {realtime.assistantTranscript ? (
            <div className="exec-rtc-message assistant">
              <div className="exec-rtc-message-head"><strong>{agentLabel}</strong><span>Live</span></div>
              <p>{realtime.assistantTranscript}</p>
            </div>
          ) : null}
        </div>

        <aside className="exec-rtc-live">
          <h4>Live Intelligence Status</h4>
          <div className="exec-rtc-live-card">
            <span>Realtime</span>
            <strong>{statusLabel}</strong>
          </div>
          <div className="exec-rtc-live-card">
            <span>Tools</span>
            <strong>{liveToolsLabel}</strong>
          </div>
          <div className="exec-rtc-live-card">
            <span>Tool Detail</span>
            <strong>
              {realtime.liveToolsDetail?.tool_count
                ? `${realtime.liveToolsDetail.tool_count} registered tools`
                : realtime.liveToolsDetail?.error || "Awaiting tool activity"}
            </strong>
          </div>
          <div className="exec-rtc-live-card">
            <span>Last Retrieval</span>
            <strong>{toolSummary(realtime.lastLiveTool)}</strong>
          </div>
          <div className="exec-rtc-live-card">
            <span>Events</span>
            <strong>{eventCount} realtime events</strong>
          </div>
        </aside>
      </div>

      <div className="exec-rtc-composer">
        <form onSubmit={submitText}>
          <input
            value={textInput}
            onChange={(event) => setTextInput(event.target.value)}
            placeholder="Type a question into the same live intelligence session…"
            disabled={!realtime.connected}
          />
          <button
            type="submit"
            className="exec-rtc-button primary"
            disabled={!realtime.connected || !textInput.trim()}
          >
            Ask Live AI
          </button>
        </form>
      </div>

      <div className="exec-rtc-footer">
        <span>Build 5.8 · Unified Executive Voice Intelligence</span>
        <span>
          {realtime.connected
            ? "Realtime audio and VoterSpheres data retrieval active"
            : "Start a session to enable live retrieval"}
        </span>
      </div>
    </div>
  );
}
