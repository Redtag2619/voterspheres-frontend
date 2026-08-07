import {

  useCallback,

  useEffect,

  useMemo,

  useRef,

  useState,

} from "react";

 

import {

  createExecutiveVoiceRealtimeClient,

} from "../services/executiveVoiceRealtime";

 

export default function useExecutiveVoiceRealtime({

  voice = "marin",

  agent = "executive_chief_of_staff",

  workspaceId = 1,

  executiveContext = {},

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

  const [liveToolsStatus, setLiveToolsStatus] = useState("idle");

  const [liveToolsDetail, setLiveToolsDetail] = useState(null);

  const [lastLiveTool, setLastLiveTool] = useState(null);

 

  const clientRef = useRef(null);

  const optionsRef = useRef({

    voice,

    agent,

    workspaceId,

    executiveContext,

  });

 

  optionsRef.current = {

    voice,

    agent,

    workspaceId,

    executiveContext,

  };

 

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

 

  const client = useMemo(() => {

    const instance = createExecutiveVoiceRealtimeClient({

      onStatus: ({ status: nextStatus, detail }) => {

        setStatus(nextStatus || "idle");

        setStatusDetail(detail || null);

 

        if (

          nextStatus === "connected" ||

          nextStatus === "session_ready" ||

          nextStatus === "ready" ||

          nextStatus === "listening" ||

          nextStatus === "speaking" ||

          nextStatus === "responding" ||

          nextStatus === "thinking"

        ) {

          setConnected(true);

        }

 

        if (

          nextStatus === "disconnected" ||

          nextStatus === "data_channel_closed" ||

          nextStatus === "peer_failed"

        ) {

          setConnected(false);

        }

      },

      onEvent: (event) => {

        if (event?.type === "executive_voice_live_tool_started") {

          setLastLiveTool({

            name: event.tool,

            call_id: event.call_id,

            status: "running",

          });

        }

 

        if (event?.type === "executive_voice_live_tool_completed") {

          setLastLiveTool({

            name: event.tool,

            call_id: event.call_id,

            status: "complete",

            result: event.result || null,

          });

        }

 

        if (event?.type === "executive_voice_live_tool_error") {

          setLastLiveTool({

            name: event.tool,

            call_id: event.call_id,

            status: "error",

            error: event.error,

          });

        }

 

        callbacksRef.current.onEvent?.(event);

      },

      onUserTranscript: (payload) => {

        setUserTranscript(payload?.text || "");

        callbacksRef.current.onUserTranscript?.(payload);

      },

      onAssistantTranscript: (payload) => {

        setAssistantTranscript(payload?.text || "");

        callbacksRef.current.onAssistantTranscript?.(payload);

      },

      onAssistantTranscriptDelta: (payload) => {

        setAssistantTranscript(payload?.text || "");

        callbacksRef.current.onAssistantTranscriptDelta?.(payload);

      },

      onSpeechStarted: (event) => {

        callbacksRef.current.onSpeechStarted?.(event);

      },

      onSpeechStopped: (event) => {

        callbacksRef.current.onSpeechStopped?.(event);

      },

      onError: (nextError) => {

        setError(nextError?.message || "Executive Voice failed.");

      },

      onLiveToolStatus: ({ status: nextStatus, detail }) => {

        setLiveToolsStatus(nextStatus || "idle");

        setLiveToolsDetail(detail || null);

      },

    });

 

    clientRef.current = instance;

    return instance;

  }, []);

 

  useEffect(() => {

    return () => {

      client.disconnect().catch(() => {});

    };

  }, [client]);

 

  const connect = useCallback(async () => {

    setError("");

 

    const session = await client.connect({

      ...optionsRef.current,

    });

 

    setConnected(true);

    return session;

  }, [client]);

 

  const disconnect = useCallback(async () => {

    await client.disconnect();

    setConnected(false);

    setAssistantTranscript("");

    setUserTranscript("");

  }, [client]);

 

  const sendText = useCallback(

    (text, options = {}) => client.sendText(text, options),

    [client]

  );

 

  const interrupt = useCallback(() => {

    client.interrupt();

  }, [client]);

 

  const setMicrophoneEnabled = useCallback(

    (enabled) => {

      const next = Boolean(enabled);

      setMicrophoneEnabledState(next);

      client.setMicrophoneEnabled(next);

    },

    [client]

  );

 

  const resumeAudio = useCallback(async () => {

    await client.resumeAudio();

  }, [client]);

 

  const clearTranscripts = useCallback(() => {

    client.clearTranscripts();

    setAssistantTranscript("");

    setUserTranscript("");

  }, [client]);

 

  const registerLiveTools = useCallback(

    (options) => client.registerLiveTools(options),

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

    liveToolsStatus,

    liveToolsDetail,

    lastLiveTool,

    connect,

    disconnect,

    sendText,

    interrupt,

    setMicrophoneEnabled,

    resumeAudio,

    clearTranscripts,

    registerLiveTools,

    sendEvent: (event) => client.sendEvent(event),

    updateSession: (patch) => client.updateSession(patch),

  };

}

