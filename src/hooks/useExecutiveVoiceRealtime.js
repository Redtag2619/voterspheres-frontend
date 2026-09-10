import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createExecutiveVoiceRealtimeClient } from "../services/executiveVoiceRealtime";
const ACTIVE_STATUSES = new Set([
  "requesting_session",
  "requesting_microphone",
  "creating_offer",
  "connecting_to_openai",
  "negotiating",
  "peer_connecting",
  "peer_connected",
  "data_channel_open",
  "connected",
  "session_ready",
  "ready",
  "listening",
  "transcribing",
  "microphone_on",
  "microphone_off",
  "generating_voice_playback",
  "speaking_authoritative_answer",
]);
const TERMINAL_STATUSES = new Set([
  "idle",
  "disconnected",
  "data_channel_closed",
  "peer_failed",
  "peer_closed",
]);
export default function useExecutiveVoiceRealtime({
  voice = "marin",
  agent = "executive_chief_of_staff",
  workspaceId = 1,
  executiveContext = {},
  mode = "command",
  onEvent,
  onUserTranscript,
  onAssistantTranscript,
  onAssistantTranscriptDelta,
  onSpeechStarted,
  onSpeechStopped,
} = {}) {
  const [status, setStatus] = useState("idle");
  const [statusDetail, setStatusDetail] = useState(null);
  const [error, setError] = useState("");
  const [connected, setConnected] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [microphoneEnabled, setMicrophoneEnabledState] = useState(true);
  const [assistantTranscript, setAssistantTranscript] = useState("");
  const [userTranscript, setUserTranscript] = useState("");
  const [speaking, setSpeaking] = useState(false);
  const mountedRef = useRef(true);
  const manualStopRef = useRef(false);
  const operationGenerationRef = useRef(0);
  const optionsRef = useRef({ voice, agent, workspaceId, executiveContext, mode });
  optionsRef.current = { voice, agent, workspaceId, executiveContext, mode };
  const callbacksRef = useRef({
    onEvent,
    onUserTranscript,
    onAssistantTranscript,
    onAssistantTranscriptDelta,
    onSpeechStarted,
    onSpeechStopped,
  });
  callbacksRef.current = {
    onEvent,
    onUserTranscript,
    onAssistantTranscript,
    onAssistantTranscriptDelta,
    onSpeechStarted,
    onSpeechStopped,
  };
  const client = useMemo(
    () =>
      createExecutiveVoiceRealtimeClient({
        onStatus: ({ status: nextStatus, detail }) => {
          if (!mountedRef.current) return;
          if (manualStopRef.current && !TERMINAL_STATUSES.has(nextStatus)) {
            return;
          }
          setStatus(nextStatus || "idle");
          setStatusDetail(detail || null);
          setSpeaking(
            ["generating_voice_playback", "speaking_authoritative_answer"].includes(
              nextStatus
            )
          );
          if (ACTIVE_STATUSES.has(nextStatus)) {
            setConnected(true);
          }
          if (TERMINAL_STATUSES.has(nextStatus)) {
            setConnected(false);
          }
        },
        onEvent: (event) => {
          if (!manualStopRef.current) callbacksRef.current.onEvent?.(event);
        },
        onUserTranscript: (payload) => {
          if (!mountedRef.current || manualStopRef.current) return;
          setUserTranscript(payload?.text || "");
          callbacksRef.current.onUserTranscript?.(payload);
          if (!payload?.delta) setUserTranscript("");
        },
        onAssistantTranscript: (payload) => {
          if (!mountedRef.current || manualStopRef.current) return;
          setAssistantTranscript(payload?.text || "");
          callbacksRef.current.onAssistantTranscript?.(payload);
        },
        onAssistantTranscriptDelta: (payload) => {
          if (!mountedRef.current || manualStopRef.current) return;
          setAssistantTranscript(payload?.text || "");
          callbacksRef.current.onAssistantTranscriptDelta?.(payload);
        },
        onSpeechStarted: (event) => {
          if (!manualStopRef.current) callbacksRef.current.onSpeechStarted?.(event);
        },
        onSpeechStopped: (event) => callbacksRef.current.onSpeechStopped?.(event),
        onError: (nextError) => {
          if (!mountedRef.current || manualStopRef.current) return;
          setError(nextError?.message || "Executive Voice failed.");
        },
      }),
    []
  );
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      manualStopRef.current = true;
      operationGenerationRef.current += 1;
      void client.disconnect().catch(() => {});
    };
  }, [client]);
  const connect = useCallback(async () => {
    const generation = operationGenerationRef.current + 1;
    operationGenerationRef.current = generation;
    manualStopRef.current = false;
    setStopping(false);
    setError("");
    const session = await client.connect(optionsRef.current);
    if (
      !mountedRef.current ||
      manualStopRef.current ||
      generation !== operationGenerationRef.current ||
      !session
    ) {
      return null;
    }
    setConnected(true);
    return session;
  }, [client]);
  const disconnect = useCallback(async () => {
    operationGenerationRef.current += 1;
    manualStopRef.current = true;
    setStopping(true);
    setConnected(false);
    setSpeaking(false);
    setStatus("disconnecting");
    setStatusDetail(null);
    try {
      client.interrupt();
    } catch {
      // The realtime channel may already be closed.
    }
    try {
      client.interruptSpeech({ resumeMicrophone: false });
      await client.disconnect();
    } finally {
      if (mountedRef.current) {
        setConnected(false);
        setAssistantTranscript("");
        setUserTranscript("");
        setSpeaking(false);
        setMicrophoneEnabledState(true);
        setStatus("disconnected");
        setStatusDetail(null);
        setStopping(false);
      }
    }
  }, [client]);
  const setMicrophoneEnabled = useCallback(
    (enabled) => {
      const next = Boolean(enabled);
      setMicrophoneEnabledState(next);
      client.setMicrophoneEnabled(next);
    },
    [client]
  );
  const stopSpeaking = useCallback(
    (options = {}) => {
      setSpeaking(false);
      return client.interruptSpeech(options);
    },
    [client]
  );
  const clearTranscripts = useCallback(() => {
    client.clearTranscripts();
    setAssistantTranscript("");
    setUserTranscript("");
  }, [client]);
  const sessionActive = stopping || connected || ACTIVE_STATUSES.has(status);
  return {
    status,
    statusDetail,
    error,
    connected,
    sessionActive,
    stopping,
    microphoneEnabled,
    assistantTranscript,
    userTranscript,
    speaking,
    liveToolsStatus: mode === "command" ? "copilot-pipeline" : "idle",
    liveToolsDetail: null,
    lastLiveTool: null,
    connect,
    disconnect,
    endConversation: disconnect,
    sendText: (text, options) => client.sendText(text, options),
    interrupt: () => client.interrupt(),
    speak: (text, options) => client.speak(text, options),
    stopSpeaking,
    setMicrophoneEnabled,
    resumeAudio: () => client.resumeAudio(),
    clearTranscripts,
    registerLiveTools: (options) => client.registerLiveTools(options),
    sendEvent: (event) => client.sendEvent(event),
    updateSession: (patch) => client.updateSession(patch),
  };
}
