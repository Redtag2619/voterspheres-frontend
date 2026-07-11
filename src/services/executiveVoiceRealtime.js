import { api } from "./api";

function unwrapResponse(value) {
  return value?.data || value || {};
}

function safeJsonParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function createEventId(prefix = "evt") {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2)}`;
}

export class ExecutiveVoiceRealtimeClient {
  constructor({
    onStatus,
    onEvent,
    onUserTranscript,
    onAssistantTranscript,
    onAssistantTranscriptDelta,
    onSpeechStarted,
    onSpeechStopped,
    onError,
  } = {}) {
    this.onStatus = onStatus;
    this.onEvent = onEvent;
    this.onUserTranscript = onUserTranscript;
    this.onAssistantTranscript = onAssistantTranscript;
    this.onAssistantTranscriptDelta =
      onAssistantTranscriptDelta;
    this.onSpeechStarted = onSpeechStarted;
    this.onSpeechStopped = onSpeechStopped;
    this.onError = onError;

    this.peerConnection = null;
    this.dataChannel = null;
    this.localStream = null;
    this.remoteStream = null;
    this.audioElement = null;
    this.session = null;

    this.connected = false;
    this.destroyed = false;
    this.assistantTranscript = "";
  }

  setStatus(status, detail = null) {
    this.onStatus?.({
      status,
      detail,
    });
  }

  emitError(error) {
    const normalized =
      error instanceof Error
        ? error
        : new Error(
            String(error || "Unknown realtime voice error.")
          );

    this.onError?.(normalized);
    this.setStatus("error", normalized.message);
  }

  async createSession({
    voice = "marin",
    agent = "executive_chief_of_staff",
    workspaceId = 1,
    executiveContext = {},
  } = {}) {
    const response = await api.post(
      "/executive-voice/session",
      {
        voice,
        agent,
        workspace_id: workspaceId,
        executive_context: executiveContext,
      }
    );

    const payload = unwrapResponse(response);

    if (!payload.client_secret) {
      throw new Error(
        payload.error ||
          "Executive Voice session endpoint did not return a client secret."
      );
    }

    return payload;
  }

  async connect({
    voice = "marin",
    agent = "executive_chief_of_staff",
    workspaceId = 1,
    executiveContext = {},
    audioElement = null,
  } = {}) {
    if (this.connected) {
      return this.session;
    }

    this.destroyed = false;
    this.setStatus("requesting_session");

    try {
      const session = await this.createSession({
        voice,
        agent,
        workspaceId,
        executiveContext,
      });

      this.session = session;

      this.setStatus("requesting_microphone");

      if (
        !navigator?.mediaDevices?.getUserMedia
      ) {
        throw new Error(
          "This browser does not support microphone access."
        );
      }

      const localStream =
        await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            channelCount: 1,
          },
          video: false,
        });

      if (this.destroyed) {
        localStream
          .getTracks()
          .forEach((track) => track.stop());

        throw new Error(
          "Realtime voice connection was cancelled."
        );
      }

      this.localStream = localStream;

      const peerConnection =
        new RTCPeerConnection();

      this.peerConnection = peerConnection;

      localStream
        .getAudioTracks()
        .forEach((track) => {
          peerConnection.addTrack(
            track,
            localStream
          );
        });

      this.audioElement =
        audioElement ||
        Object.assign(
          document.createElement("audio"),
          {
            autoplay: true,
          }
        );

      this.audioElement.autoplay = true;
      this.audioElement.playsInline = true;

      peerConnection.ontrack = (event) => {
        const [stream] = event.streams;

        if (!stream) return;

        this.remoteStream = stream;
        this.audioElement.srcObject = stream;

        const playPromise =
          this.audioElement.play?.();

        playPromise?.catch?.(() => {
          this.setStatus(
            "audio_blocked",
            "Browser interaction may be required before audio can play."
          );
        });
      };

      peerConnection.onconnectionstatechange =
        () => {
          const state =
            peerConnection.connectionState;

          this.setStatus(`peer_${state}`);

          if (state === "connected") {
            this.connected = true;
            this.setStatus("connected");
          }

          if (
            [
              "failed",
              "closed",
              "disconnected",
            ].includes(state)
          ) {
            this.connected = false;
          }
        };

      peerConnection.oniceconnectionstatechange =
        () => {
          this.onEvent?.({
            type: "client.ice_state",
            state:
              peerConnection.iceConnectionState,
          });
        };

      peerConnection.onicecandidateerror =
        (event) => {
          this.onEvent?.({
            type: "client.ice_candidate_error",
            errorCode: event.errorCode,
            errorText: event.errorText,
            url: event.url,
          });
        };

      const dataChannel =
        peerConnection.createDataChannel(
          "oai-events"
        );

      this.dataChannel = dataChannel;

      dataChannel.onopen = () => {
        this.setStatus("data_channel_open");

        if (session.session_update) {
          this.sendEvent(
            session.session_update
          );
        }
      };

      dataChannel.onmessage = (event) => {
        const parsed =
          safeJsonParse(event.data);

        if (parsed) {
          this.handleRealtimeEvent(parsed);
        }
      };

      dataChannel.onerror = () => {
        this.emitError(
          new Error(
            "Realtime data channel failed."
          )
        );
      };

      dataChannel.onclose = () => {
        this.setStatus(
          "data_channel_closed"
        );
      };

      this.setStatus("creating_offer");

      const offer =
        await peerConnection.createOffer();

      await peerConnection.setLocalDescription(
        offer
      );

      this.setStatus(
        "connecting_to_openai"
      );

      const callsUrl =
        session.realtime_calls_url ||
        "https://api.openai.com/v1/realtime/calls";

      const answerResponse = await fetch(
        callsUrl,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.client_secret}`,
            "Content-Type":
              "application/sdp",
          },
          body: offer.sdp,
        }
      );

      const answerSdp =
        await answerResponse.text();

      if (!answerResponse.ok) {
        throw new Error(
          answerSdp ||
            `Realtime WebRTC handshake failed with status ${answerResponse.status}.`
        );
      }

      await peerConnection.setRemoteDescription({
        type: "answer",
        sdp: answerSdp,
      });

      this.setStatus("negotiating");

      return session;
    } catch (error) {
      this.emitError(error);

      await this.disconnect();

      throw error;
    }
  }

  handleRealtimeEvent(event) {
    this.onEvent?.(event);

    switch (event.type) {
      case "session.created":
      case "session.updated":
        this.setStatus("session_ready");
        break;

      case "input_audio_buffer.speech_started":
        this.onSpeechStarted?.(event);
        this.setStatus("listening");
        break;

      case "input_audio_buffer.speech_stopped":
        this.onSpeechStopped?.(event);
        this.setStatus("thinking");
        break;

      case "conversation.item.input_audio_transcription.delta":
        if (event.delta) {
          this.onUserTranscript?.({
            text: event.delta,
            delta: true,
            itemId: event.item_id,
            event,
          });
        }
        break;

      case "conversation.item.input_audio_transcription.completed":
        this.onUserTranscript?.({
          text: event.transcript || "",
          delta: false,
          itemId: event.item_id,
          event,
        });
        break;

      case "response.output_audio_transcript.delta":
      case "response.output_text.delta":
        if (event.delta) {
          this.assistantTranscript +=
            event.delta;

          this.onAssistantTranscriptDelta?.({
            text:
              this.assistantTranscript,
            delta: event.delta,
            itemId: event.item_id,
            responseId:
              event.response_id,
            event,
          });

          this.setStatus("speaking");
        }
        break;

      case "response.output_audio_transcript.done":
      case "response.output_text.done": {
        const finalText =
          event.transcript ||
          event.text ||
          this.assistantTranscript ||
          "";

        this.onAssistantTranscript?.({
          text: finalText,
          itemId: event.item_id,
          responseId:
            event.response_id,
          event,
        });

        this.assistantTranscript = "";
        break;
      }

      case "response.created":
        this.assistantTranscript = "";
        this.setStatus("responding");
        break;

      case "response.done":
        this.setStatus("ready");
        break;

      case "response.cancelled":
        this.assistantTranscript = "";
        this.setStatus("interrupted");
        break;

      case "error":
        this.emitError(
          new Error(
            event.error?.message ||
              event.message ||
              "OpenAI Realtime returned an error."
          )
        );
        break;

      default:
        break;
    }
  }

  sendEvent(event) {
    if (
      !this.dataChannel ||
      this.dataChannel.readyState !== "open"
    ) {
      return false;
    }

    const payload = {
      event_id:
        event.event_id ||
        createEventId(),
      ...event,
    };

    this.dataChannel.send(
      JSON.stringify(payload)
    );

    return true;
  }

  sendText(
    text,
    {
      instructions = null,
      metadata = null,
    } = {}
  ) {
    const cleanText = String(
      text || ""
    ).trim();

    if (!cleanText) {
      return false;
    }

    const itemCreated = this.sendEvent({
      type: "conversation.item.create",

      item: {
        type: "message",
        role: "user",

        content: [
          {
            type: "input_text",
            text: cleanText,
          },
        ],

        ...(metadata
          ? { metadata }
          : {}),
      },
    });

    if (!itemCreated) {
      return false;
    }

    return this.sendEvent({
      type: "response.create",

      response: instructions
        ? {
            instructions,
          }
        : {},
    });
  }

  updateSession(sessionPatch = {}) {
    return this.sendEvent({
      type: "session.update",

      session: {
        type: "realtime",
        ...sessionPatch,
      },
    });
  }

  interrupt() {
    this.sendEvent({
      type: "response.cancel",
    });

    this.sendEvent({
      type: "output_audio_buffer.clear",
    });

    if (this.audioElement) {
      this.audioElement.muted = true;

      window.setTimeout(() => {
        if (this.audioElement) {
          this.audioElement.muted = false;
        }
      }, 60);
    }

    this.assistantTranscript = "";

    this.setStatus("interrupted");
  }

  setMicrophoneEnabled(enabled) {
    this.localStream
      ?.getAudioTracks()
      .forEach((track) => {
        track.enabled = Boolean(enabled);
      });

    this.setStatus(
      enabled
        ? "microphone_on"
        : "microphone_off"
    );
  }

  async resumeAudio() {
    if (!this.audioElement) {
      return;
    }

    this.audioElement.muted = false;

    await this.audioElement.play?.();
  }

  async disconnect() {
    this.destroyed = true;
    this.connected = false;

    try {
      this.dataChannel?.close?.();
    } catch {
      // Ignore cleanup errors.
    }

    try {
      this.peerConnection?.close?.();
    } catch {
      // Ignore cleanup errors.
    }

    this.localStream
      ?.getTracks?.()
      .forEach((track) =>
        track.stop()
      );

    this.remoteStream
      ?.getTracks?.()
      .forEach((track) =>
        track.stop()
      );

    if (this.audioElement) {
      this.audioElement.pause?.();
      this.audioElement.srcObject = null;
    }

    this.dataChannel = null;
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.session = null;
    this.assistantTranscript = "";

    this.setStatus("disconnected");
  }
}

export function createExecutiveVoiceRealtimeClient(
  options = {}
) {
  return new ExecutiveVoiceRealtimeClient(
    options
  );
}
