import {
  useCallback,
  useEffect,
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
  onUserTranscript,
  onAssistantTranscript,
  onAssistantTranscriptDelta,
  onEvent,
  onError,
} = {}) {
  const clientRef = useRef(null);
  const audioRef = useRef(null);

  const [status, setStatus] = useState("idle");
  const [statusDetail, setStatusDetail] =
    useState(null);

  const [connected, setConnected] =
    useState(false);

  const [
    microphoneEnabled,
    setMicrophoneEnabledState,
  ] = useState(true);

  const [
    userTranscript,
    setUserTranscript,
  ] = useState("");

  const [
    assistantTranscript,
    setAssistantTranscript,
  ] = useState("");

  const [error, setError] = useState("");

  const ensureAudioElement =
    useCallback(() => {
      if (!audioRef.current) {
        const audio =
          document.createElement("audio");

        audio.autoplay = true;
        audio.playsInline = true;

        audioRef.current = audio;
      }

      return audioRef.current;
    }, []);

  const buildClient =
    useCallback(() => {
      const client =
        createExecutiveVoiceRealtimeClient({
          onStatus: ({
            status: nextStatus,
            detail,
          }) => {
            setStatus(nextStatus);
            setStatusDetail(detail || null);

            setConnected(
              [
                "connected",
                "session_ready",
                "ready",
                "listening",
                "thinking",
                "responding",
                "speaking",
                "microphone_on",
                "microphone_off",
              ].includes(nextStatus)
            );
          },

          onEvent,

          onUserTranscript: (payload) => {
            if (payload.delta) {
              setUserTranscript(
                (current) =>
                  current + payload.text
              );
            } else {
              setUserTranscript(
                payload.text || ""
              );
            }

            onUserTranscript?.(payload);
          },

          onAssistantTranscriptDelta:
            (payload) => {
              setAssistantTranscript(
                payload.text || ""
              );

              onAssistantTranscriptDelta?.(
                payload
              );
            },

          onAssistantTranscript:
            (payload) => {
              setAssistantTranscript(
                payload.text || ""
              );

              onAssistantTranscript?.(
                payload
              );
            },

          onSpeechStarted: () => {
            setUserTranscript("");
            setAssistantTranscript("");
          },

          onSpeechStopped: () => {
            setStatus("thinking");
          },

          onError: (nextError) => {
            const message =
              nextError?.message ||
              "Executive Voice connection failed.";

            setError(message);
            onError?.(nextError);
          },
        });

      clientRef.current = client;

      return client;
    }, [
      onAssistantTranscript,
      onAssistantTranscriptDelta,
      onError,
      onEvent,
      onUserTranscript,
    ]);

  const connect = useCallback(async () => {
    setError("");

    const client =
      clientRef.current || buildClient();

    const audioElement =
      ensureAudioElement();

    await client.connect({
      voice,
      agent,
      workspaceId,
      executiveContext,
      audioElement,
    });

    setConnected(true);
  }, [
    agent,
    buildClient,
    ensureAudioElement,
    executiveContext,
    voice,
    workspaceId,
  ]);

  const disconnect =
    useCallback(async () => {
      await clientRef.current?.disconnect?.();

      setConnected(false);
      setStatus("disconnected");
      setStatusDetail(null);
      setUserTranscript("");
      setAssistantTranscript("");
    }, []);

  const sendText = useCallback(
    (text, options = {}) => {
      return (
        clientRef.current?.sendText?.(
          text,
          options
        ) || false
      );
    },
    []
  );

  const interrupt = useCallback(() => {
    clientRef.current?.interrupt?.();
  }, []);

  const updateSession = useCallback(
    (patch = {}) => {
      return (
        clientRef.current?.updateSession?.(
          patch
        ) || false
      );
    },
    []
  );

  const setMicrophoneEnabled =
    useCallback((enabled) => {
      clientRef.current?.setMicrophoneEnabled?.(
        enabled
      );

      setMicrophoneEnabledState(
        Boolean(enabled)
      );
    }, []);

  const resumeAudio =
    useCallback(async () => {
      try {
        await clientRef.current?.resumeAudio?.();
      } catch (resumeError) {
        const message =
          resumeError?.message ||
          "Unable to resume realtime audio.";

        setError(message);
        onError?.(resumeError);
      }
    }, [onError]);

  const clearTranscripts =
    useCallback(() => {
      setUserTranscript("");
      setAssistantTranscript("");
    }, []);

  useEffect(() => {
    return () => {
      clientRef.current?.disconnect?.();
    };
  }, []);

  return {
    status,
    statusDetail,
    connected,
    microphoneEnabled,
    userTranscript,
    assistantTranscript,
    error,

    connect,
    disconnect,
    sendText,
    interrupt,
    updateSession,
    setMicrophoneEnabled,
    resumeAudio,
    clearTranscripts,
  };
}
