import { useMemo, useState } from "react";
import Badge from "../ui/Badge";
import useExecutiveVoiceRealtime from "../../hooks/useExecutiveVoiceRealtime";

function labelize(value = "") {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function statusTone(status) {
  if (["error", "peer_failed"].includes(status)) return "danger";
  if (["speaking", "responding", "thinking"].includes(status)) return "accent";
  if (["connected", "ready", "listening", "session_ready"].includes(status)) return "active";
  return "info";
}

export default function ExecutiveRealtimeVoicePanel({
  agent = "executive_chief_of_staff",
  workspaceId = 1,
  executiveContext = {},
  onUserTranscript,
  onAssistantTranscript,
}) {
  const [textInput, setTextInput] = useState("");
  const [messages, setMessages] = useState([]);

  const realtime = useExecutiveVoiceRealtime({
    voice: "marin",
    agent,
    workspaceId,
    executiveContext,
    onUserTranscript: (payload) => {
      if (!payload.delta && payload.text) {
        setMessages((current) => [
          ...current,
          { id: `user-${Date.now()}`, role: "user", text: payload.text },
        ]);
      }
      onUserTranscript?.(payload);
    },
    onAssistantTranscript: (payload) => {
      if (payload.text) {
        setMessages((current) => [
          ...current,
          { id: `assistant-${Date.now()}`, role: "assistant", text: payload.text },
        ]);
      }
      onAssistantTranscript?.(payload);
    },
  });

  const statusLabel = useMemo(() => labelize(realtime.status), [realtime.status]);

  function submitText(event) {
    event.preventDefault();
    const value = textInput.trim();
    if (!value) return;

    const sent = realtime.sendText(value);
    if (sent) {
      setMessages((current) => [
        ...current,
        { id: `user-text-${Date.now()}`, role: "user", text: value },
      ]);
      setTextInput("");
    }
  }

  return (
    <div className="exec-rtc-panel">
      <style>{`
        .exec-rtc-panel{border:1px solid rgba(96,165,250,.24);border-radius:24px;background:radial-gradient(circle at top right,rgba(59,130,246,.14),transparent 38%),linear-gradient(145deg,rgba(2,6,23,.96),rgba(15,23,42,.9));overflow:hidden}
        .exec-rtc-header{display:flex;justify-content:space-between;gap:16px;align-items:center;padding:18px;border-bottom:1px solid rgba(148,163,184,.13)}
        .exec-rtc-header span{display:block;color:rgba(147,197,253,.86);font-size:10px;font-weight:900;letter-spacing:.09em;text-transform:uppercase}
        .exec-rtc-header strong{display:block;margin-top:5px;color:white;font-size:21px}
        .exec-rtc-actions{display:flex;flex-wrap:wrap;gap:8px}
        .exec-rtc-actions button{border:1px solid rgba(148,163,184,.18);border-radius:12px;background:rgba(15,23,42,.65);color:rgba(241,245,249,.94);padding:10px 12px;font-size:11px;font-weight:850;cursor:pointer}
        .exec-rtc-body{display:grid;grid-template-columns:minmax(0,1fr) 300px;min-height:520px}
        .exec-rtc-messages{padding:18px;display:grid;align-content:start;gap:12px;max-height:620px;overflow:auto}
        .exec-rtc-message{max-width:82%;border:1px solid rgba(148,163,184,.13);border-radius:18px;background:rgba(15,23,42,.58);padding:13px 15px;color:rgba(226,232,240,.92);font-size:13px;line-height:1.65;white-space:pre-wrap}
        .exec-rtc-message.user{margin-left:auto;background:rgba(37,99,235,.16);border-color:rgba(96,165,250,.28)}
        .exec-rtc-live{border-left:1px solid rgba(148,163,184,.13);padding:16px;display:grid;align-content:start;gap:14px;background:rgba(2,6,23,.34)}
        .exec-rtc-live-card{border:1px solid rgba(148,163,184,.12);border-radius:15px;background:rgba(15,23,42,.52);padding:12px}
        .exec-rtc-live-card span{display:block;color:rgba(148,163,184,.75);font-size:9px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}
        .exec-rtc-live-card p{margin:7px 0 0;color:rgba(226,232,240,.9);font-size:12px;line-height:1.5}
        .exec-rtc-composer{border-top:1px solid rgba(148,163,184,.13);padding:14px;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px}
        .exec-rtc-composer input{border:1px solid rgba(148,163,184,.16);border-radius:13px;background:rgba(2,6,23,.45);color:white;padding:12px;outline:none}
        .exec-rtc-error{margin:14px;border:1px solid rgba(239,68,68,.3);border-radius:12px;background:rgba(239,68,68,.1);color:#fecaca;padding:12px;font-size:12px}
        @media(max-width:900px){.exec-rtc-header{align-items:flex-start;flex-direction:column}.exec-rtc-body{grid-template-columns:1fr}.exec-rtc-live{border-left:0;border-top:1px solid rgba(148,163,184,.13)}.exec-rtc-message{max-width:96%}}
      `}</style>

      <div className="exec-rtc-header">
        <div>
          <span>OpenAI Realtime WebRTC</span>
          <strong>Executive Voice Session</strong>
        </div>

        <div className="exec-rtc-actions">
          <Badge tone={statusTone(realtime.status)}>{statusLabel}</Badge>

          {!realtime.connected ? (
            <button type="button" onClick={realtime.connect}>Start Realtime Voice</button>
          ) : (
            <>
              <button type="button" onClick={() => realtime.setMicrophoneEnabled(!realtime.microphoneEnabled)}>
                {realtime.microphoneEnabled ? "Mute Microphone" : "Unmute Microphone"}
              </button>
              <button type="button" onClick={realtime.interrupt}>Interrupt AI</button>
              <button type="button" onClick={realtime.resumeAudio}>Resume Audio</button>
              <button type="button" onClick={realtime.disconnect}>End Session</button>
            </>
          )}
        </div>
      </div>

      {realtime.error ? <div className="exec-rtc-error">{realtime.error}</div> : null}

      <div className="exec-rtc-body">
        <div className="exec-rtc-messages">
          {messages.length ? messages.map((message) => (
            <div key={message.id} className={`exec-rtc-message ${message.role}`}>{message.text}</div>
          )) : (
            <div className="exec-rtc-message">Start a realtime session, then speak naturally. The Executive AI will answer with live audio.</div>
          )}

          {realtime.assistantTranscript ? (
            <div className="exec-rtc-message">{realtime.assistantTranscript}</div>
          ) : null}
        </div>

        <aside className="exec-rtc-live">
          <div className="exec-rtc-live-card">
            <span>Your live transcript</span>
            <p>{realtime.userTranscript || "Waiting for microphone input…"}</p>
          </div>
          <div className="exec-rtc-live-card">
            <span>Assistant live transcript</span>
            <p>{realtime.assistantTranscript || "Waiting for Executive AI…"}</p>
          </div>
          <div className="exec-rtc-live-card">
            <span>Connection status</span>
            <p>{statusLabel}{realtime.statusDetail ? ` — ${realtime.statusDetail}` : ""}</p>
          </div>
        </aside>
      </div>

      <form className="exec-rtc-composer" onSubmit={submitText}>
        <input
          value={textInput}
          onChange={(event) => setTextInput(event.target.value)}
          placeholder="Send a text message into the realtime voice session…"
          disabled={!realtime.connected}
        />
        <button type="submit" className="vs-button vs-button-primary" disabled={!realtime.connected || !textInput.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}

