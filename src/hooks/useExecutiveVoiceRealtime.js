import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { createExecutiveVoiceRealtimeClient } from "../services/executiveVoiceRealtime";

 

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

  const [microphoneEnabled, setMicrophoneEnabledState] = useState(true);

  const [assistantTranscript, setAssistantTranscript] = useState("");

  const [userTranscript, setUserTranscript] = useState("");

  const [speaking, setSpeaking] = useState(false);

 

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

          setStatus(nextStatus || "idle");

          setStatusDetail(detail || null);

          setSpeaking(

            ["generating_voice_playback", "speaking_authoritative_answer"].includes(

              nextStatus

            )

          );

          if (

            [

              "connected",

              "session_ready",

              "ready",

              "listening",

              "transcribing",

              "microphone_on",

              "microphone_off",

              "generating_voice_playback",

              "speaking_authoritative_answer",

            ].includes(nextStatus)

          ) {

            setConnected(true);

          }

          if (

            ["disconnected", "data_channel_closed", "peer_failed", "peer_closed"].includes(

              nextStatus

            )

          ) {

            setConnected(false);

          }

        },

        onEvent: (event) => callbacksRef.current.onEvent?.(event),

        onUserTranscript: (payload) => {

          setUserTranscript(payload?.text || "");

          callbacksRef.current.onUserTranscript?.(payload);

          if (!payload?.delta) setUserTranscript("");

        },

        onAssistantTranscript: (payload) => {

          setAssistantTranscript(payload?.text || "");

          callbacksRef.current.onAssistantTranscript?.(payload);

        },

        onAssistantTranscriptDelta: (payload) => {

          setAssistantTranscript(payload?.text || "");

          callbacksRef.current.onAssistantTranscriptDelta?.(payload);

        },

        onSpeechStarted: (event) => callbacksRef.current.onSpeechStarted?.(event),

        onSpeechStopped: (event) => callbacksRef.current.onSpeechStopped?.(event),

        onError: (nextError) => setError(nextError?.message || "Executive Voice failed."),

      }),

    []

  );

 

  useEffect(() => () => void client.disconnect().catch(() => {}), [client]);

 

  const connect = useCallback(async () => {

    setError("");

    const session = await client.connect(optionsRef.current);

    setConnected(true);

    return session;

  }, [client]);

 

  const disconnect = useCallback(async () => {

    await client.disconnect();

    setConnected(false);

    setAssistantTranscript("");

    setUserTranscript("");

    setSpeaking(false);

  }, [client]);

 

  const setMicrophoneEnabled = useCallback(

    (enabled) => {

      const next = Boolean(enabled);

      setMicrophoneEnabledState(next);

      client.setMicrophoneEnabled(next);

    },

    [client]

  );

 

  return {

    status,

    statusDetail,

    error,

    connected,

    microphoneEnabled,

    assistantTranscript,

    userTranscript,

    speaking,

    liveToolsStatus: mode === "command" ? "copilot-pipeline" : "idle",

    liveToolsDetail: null,

    lastLiveTool: null,

    connect,

    disconnect,

    sendText: (text, options) => client.sendText(text, options),

    interrupt: () => client.interrupt(),

    speak: (text, options) => client.speak(text, options),

    stopSpeaking: (options) => client.interruptSpeech(options),

    setMicrophoneEnabled,

    resumeAudio: () => client.resumeAudio(),

    clearTranscripts: () => client.clearTranscripts(),

    registerLiveTools: (options) => client.registerLiveTools(options),

    sendEvent: (event) => client.sendEvent(event),

    updateSession: (patch) => client.updateSession(patch),

  };

}

