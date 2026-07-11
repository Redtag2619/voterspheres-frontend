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

  if (
    [
      "error",
      "peer_failed",
      "peer_disconnected",
      "data_channel_closed",
    ].includes(normalized)
  ) {
    return "danger";
  }

  if (
    [
      "speaking",
      "responding",
      "thinking",
      "connecting_to_openai",
      "creating_offer",
      "negotiating",
    ].includes(normalized)
  ) {
    return "accent";
  }

  if (
    [
      "connected",
      "session_ready",
      "ready",
      "listening",
      "microphone_on",
    ].includes(normalized)
  ) {
    return "active";
  }

  return "info";
}

function formatMessageTime(value) {
  if (!value) return "Now";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Now";
  }

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function createMessage({
  role,
  text,
  source = "realtime",
}) {
  return {
    id: `${role}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}`,

    role,
    text,
    source,
    createdAt: new Date().toISOString(),
  };
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
      if (!payload.delta && payload.text) {
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
      if (payload.text) {
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

  const statusLabel = useMemo(
    () => labelize(realtime.status),
    [realtime.status]
  );

  const hasLiveAssistantTranscript =
    Boolean(realtime.assistantTranscript);

  const hasLiveUserTranscript =
    Boolean(realtime.userTranscript);

  function submitText(event) {
    event.preventDefault();

    const value = textInput.trim();

    if (!value) return;

    const sent = realtime.sendText(value, {
      metadata: {
        source: "executive_realtime_panel",
        agent,
      },
    });

    if (!sent) {
      return;
    }

    setMessages((current) => [
      ...current,
      createMessage({
        role: "user",
        text: value,
        source: "typed",
      }),
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
      // The hook already exposes the error message.
    }
  }

  return (
    <div className="exec-rtc-panel">
      <style>{`
        .exec-rtc-panel {
          border:
            1px solid
            rgba(96, 165, 250, 0.24);
          border-radius: 24px;
          background:
            radial-gradient(
              circle at top right,
              rgba(59, 130, 246, 0.14),
              transparent 38%
            ),
            linear-gradient(
              145deg,
              rgba(2, 6, 23, 0.96),
              rgba(15, 23, 42, 0.9)
            );
          overflow: hidden;
          min-width: 0;
        }

        .exec-rtc-header {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: center;
          padding: 18px;
          border-bottom:
            1px solid
            rgba(148, 163, 184, 0.13);
        }

        .exec-rtc-header-copy span {
          display: block;
          color: rgba(147, 197, 253, 0.86);
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.09em;
          text-transform: uppercase;
        }

        .exec-rtc-header-copy strong {
          display: block;
          margin-top: 5px;
          color: white;
          font-size: 21px;
          line-height: 1.2;
        }

        .exec-rtc-header-copy small {
          display: block;
          margin-top: 5px;
          color: rgba(148, 163, 184, 0.76);
          font-size: 10px;
        }

        .exec-rtc-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          justify-content: flex-end;
          align-items: center;
        }

        .exec-rtc-actions button {
          border:
            1px solid
            rgba(148, 163, 184, 0.18);
          border-radius: 12px;
          background: rgba(15, 23, 42, 0.65);
          color: rgba(241, 245, 249, 0.94);
          padding: 10px 12px;
          font-size: 11px;
          font-weight: 850;
          cursor: pointer;
        }

        .exec-rtc-actions button:hover {
          border-color:
            rgba(96, 165, 250, 0.55);
          background:
            rgba(37, 99, 235, 0.15);
        }

        .exec-rtc-actions button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .exec-rtc-body {
          display: grid;
          grid-template-columns:
            minmax(0, 1fr)
            320px;
          min-height: 560px;
        }

        .exec-rtc-messages {
          padding: 18px;
          display: grid;
          align-content: start;
          gap: 12px;
          max-height: 660px;
          overflow: auto;
          min-width: 0;
        }

        .exec-rtc-message {
          max-width: 82%;
          border:
            1px solid
            rgba(148, 163, 184, 0.13);
          border-radius: 18px;
          background:
            rgba(15, 23, 42, 0.58);
          padding: 13px 15px;
          color:
            rgba(226, 232, 240, 0.92);
          font-size: 13px;
          line-height: 1.65;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
        }

        .exec-rtc-message.user {
          margin-left: auto;
          background:
            rgba(37, 99, 235, 0.16);
          border-color:
            rgba(96, 165, 250, 0.28);
        }

        .exec-rtc-message.assistant {
          margin-right: auto;
        }

        .exec-rtc-message-head {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: center;
          margin-bottom: 7px;
        }

        .exec-rtc-message-head strong {
          color: white;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.07em;
        }

        .exec-rtc-message-head span {
          color:
            rgba(148, 163, 184, 0.67);
          font-size: 9px;
        }

        .exec-rtc-empty {
          border:
            1px dashed
            rgba(148, 163, 184, 0.18);
          border-radius: 18px;
          padding: 24px;
          text-align: center;
          color:
            rgba(203, 213, 225, 0.76);
          font-size: 12px;
          line-height: 1.6;
        }

        .exec-rtc-live-message {
          border-color:
            rgba(96, 165, 250, 0.34);
          background:
            radial-gradient(
              circle at top left,
              rgba(59, 130, 246, 0.12),
              transparent 42%
            ),
            rgba(15, 23, 42, 0.58);
        }

        .exec-rtc-live-message p {
          margin: 0;
        }

        .exec-rtc-live-message p::after {
          content: "";
          display: inline-block;
          width: 7px;
          height: 14px;
          margin-left: 4px;
          background:
            rgba(96, 165, 250, 0.9);
          vertical-align: -2px;
          animation:
            execRtcCursorBlink
            0.8s
            steps(1)
            infinite;
        }

        .exec-rtc-live {
          border-left:
            1px solid
            rgba(148, 163, 184, 0.13);
          padding: 16px;
          display: grid;
          align-content: start;
          gap: 14px;
          background:
            rgba(2, 6, 23, 0.34);
        }

        .exec-rtc-live-card {
          border:
            1px solid
            rgba(148, 163, 184, 0.12);
          border-radius: 15px;
          background:
            rgba(15, 23, 42, 0.52);
          padding: 12px;
          min-width: 0;
        }

        .exec-rtc-live-card span {
          display: block;
          color:
            rgba(148, 163, 184, 0.75);
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .exec-rtc-live-card strong {
          display: block;
          margin-top: 6px;
          color: white;
          font-size: 15px;
        }

        .exec-rtc-live-card p {
          margin: 7px 0 0;
          color:
            rgba(226, 232, 240, 0.9);
          font-size: 12px;
          line-height: 1.5;
          overflow-wrap: anywhere;
        }

        .exec-rtc-live-indicator {
          width: 54px;
          height: 54px;
          margin-top: 10px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          border:
            1px solid
            rgba(96, 165, 250, 0.3);
          background:
            rgba(59, 130, 246, 0.14);
          color: white;
          font-size: 21px;
        }

        .exec-rtc-live-indicator.active {
          border-color:
            rgba(34, 197, 94, 0.4);
          background:
            rgba(34, 197, 94, 0.14);
          box-shadow:
            0 0 0 8px
            rgba(34, 197, 94, 0.05);
          animation:
            execRtcPulse
            1.35s
            ease-in-out
            infinite;
        }

        .exec-rtc-composer {
          border-top:
            1px solid
            rgba(148, 163, 184, 0.13);
          padding: 14px;
          display: grid;
          grid-template-columns:
            minmax(0, 1fr)
            auto;
          gap: 10px;
        }

        .exec-rtc-composer input {
          width: 100%;
          border:
            1px solid
            rgba(148, 163, 184, 0.16);
          border-radius: 13px;
          background:
            rgba(2, 6, 23, 0.45);
          color: white;
          padding: 12px;
          outline: none;
          min-width: 0;
        }

        .exec-rtc-composer input:focus {
          border-color:
            rgba(96, 165, 250, 0.48);
          box-shadow:
            0 0 0 3px
            rgba(59, 130, 246, 0.09);
        }

        .exec-rtc-error {
          margin: 14px;
          border:
            1px solid
            rgba(239, 68, 68, 0.3);
          border-radius: 12px;
          background:
            rgba(239, 68, 68, 0.1);
          color: #fecaca;
          padding: 12px;
          font-size: 12px;
          line-height: 1.55;
        }

        @keyframes execRtcCursorBlink {
          0%,
          50% {
            opacity: 1;
          }

          51%,
          100% {
            opacity: 0;
          }
        }

        @keyframes execRtcPulse {
          0%,
          100% {
            transform: scale(1);
          }

          50% {
            transform: scale(1.06);
          }
        }

        @media (max-width: 900px) {
          .exec-rtc-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .exec-rtc-actions {
            justify-content: flex-start;
          }

          .exec-rtc-body {
            grid-template-columns: 1fr;
          }

          .exec-rtc-live {
            border-left: 0;
            border-top:
              1px solid
              rgba(148, 163, 184, 0.13);
          }

          .exec-rtc-message {
            max-width: 96%;
          }
        }

        @media (max-width: 640px) {
          .exec-rtc-composer {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="exec-rtc-header">
        <div className="exec-rtc-header-copy">
          <span>OpenAI Realtime WebRTC</span>

          <strong>
            Realtime Executive Voice
          </strong>

          <small>
            Active advisor: {agentLabel}
          </small>
        </div>

        <div className="exec-rtc-actions">
          <Badge tone={statusTone(realtime.status)}>
            {statusLabel}
          </Badge>

          {!realtime.connected ? (
            <button
              type="button"
              onClick={startSession}
            >
              Start Realtime Voice
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() =>
                  realtime.setMicrophoneEnabled(
                    !realtime.microphoneEnabled
                  )
                }
              >
                {realtime.microphoneEnabled
                  ? "Mute Microphone"
                  : "Unmute Microphone"}
              </button>

              <button
                type="button"
                onClick={realtime.interrupt}
              >
                Interrupt AI
              </button>

              <button
                type="button"
                onClick={realtime.resumeAudio}
              >
                Resume Audio
              </button>

              <button
                type="button"
                onClick={clearConversation}
              >
                Clear Transcript
              </button>

              <button
                type="button"
                onClick={realtime.disconnect}
              >
                End Session
              </button>
            </>
          )}
        </div>
      </div>

      {realtime.error ? (
        <div className="exec-rtc-error">
          {realtime.error}
        </div>
      ) : null}

      <div className="exec-rtc-body">
        <div className="exec-rtc-messages">
          {messages.length ? (
            messages.map((message) => (
              <div
                key={message.id}
                className={`exec-rtc-message ${message.role}`}
              >
                <div className="exec-rtc-message-head">
                  <strong>
                    {message.role === "user"
                      ? "You"
                      : agentLabel}
                  </strong>

                  <span>
                    {formatMessageTime(
                      message.createdAt
                    )}
                  </span>
                </div>

                {message.text}
              </div>
            ))
          ) : (
            <div className="exec-rtc-empty">
              Start a realtime voice session,
              allow microphone access, and speak
              naturally. The Executive AI will answer
              with live audio and realtime transcripts.
            </div>
          )}

          {hasLiveAssistantTranscript ? (
            <div className="exec-rtc-message assistant exec-rtc-live-message">
              <div className="exec-rtc-message-head">
                <strong>{agentLabel}</strong>
                <span>Live</span>
              </div>

              <p>
                {realtime.assistantTranscript}
              </p>
            </div>
          ) : null}
        </div>

        <aside className="exec-rtc-live">
          <div className="exec-rtc-live-card">
            <span>Realtime session</span>

            <strong>{statusLabel}</strong>

            <div
              className={
                realtime.connected
                  ? "exec-rtc-live-indicator active"
                  : "exec-rtc-live-indicator"
              }
            >
              {realtime.connected ? "●" : "○"}
            </div>
          </div>

          <div className="exec-rtc-live-card">
            <span>Your live transcript</span>

            <p>
              {hasLiveUserTranscript
                ? realtime.userTranscript
                : "Waiting for microphone input…"}
            </p>
          </div>

          <div className="exec-rtc-live-card">
            <span>
              Assistant live transcript
            </span>

            <p>
              {hasLiveAssistantTranscript
                ? realtime.assistantTranscript
                : "Waiting for Executive AI…"}
            </p>
          </div>

          <div className="exec-rtc-live-card">
            <span>Microphone</span>

            <strong>
              {realtime.microphoneEnabled
                ? "Enabled"
                : "Muted"}
            </strong>
          </div>

          <div className="exec-rtc-live-card">
            <span>Realtime events received</span>

            <strong>{eventCount}</strong>
          </div>

          {realtime.statusDetail ? (
            <div className="exec-rtc-live-card">
              <span>Status detail</span>

              <p>
                {realtime.statusDetail}
              </p>
            </div>
          ) : null}
        </aside>
      </div>

      <form
        className="exec-rtc-composer"
        onSubmit={submitText}
      >
        <input
          value={textInput}
          onChange={(event) =>
            setTextInput(event.target.value)
          }
          placeholder="Send a typed message into the realtime voice session…"
          disabled={!realtime.connected}
        />

        <button
          type="submit"
          className="vs-button vs-button-primary"
          disabled={
            !realtime.connected ||
            !textInput.trim()
          }
        >
          Send
        </button>
      </form>
    </div>
  );
}
