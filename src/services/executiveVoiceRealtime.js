import { api } from "./api";
import createExecutiveVoiceLiveToolsBridge from "./executiveVoiceRealtimeToolsBridge";

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

/*
 * Every outgoing session.update must contain:
 *
 * session: {
 *   type: "realtime"
 * }
 *
 * Placing type after the session spread prevents an undefined,
 * null, or stale value from overwriting the required value.
 */
function normalizeOutgoingEvent(event = {}) {
  if (
    !event ||
    typeof event !== "object"
  ) {
    return event;
  }

  if (
    event.type !== "session.update"
  ) {
    return event;
  }

  const existingSession =
    event.session &&
    typeof event.session === "object"
      ? event.session
      : {};

  return {
    ...event,

    type:
      "session.update",

    session: {
      ...existingSession,

      type:
        "realtime",
    },
  };
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
    this.onStatus =
      onStatus;

    this.onEvent =
      onEvent;

    this.onUserTranscript =
      onUserTranscript;

    this.onAssistantTranscript =
      onAssistantTranscript;

    this.onAssistantTranscriptDelta =
      onAssistantTranscriptDelta;

    this.onSpeechStarted =
      onSpeechStarted;

    this.onSpeechStopped =
      onSpeechStopped;

    this.onError =
      onError;

    this.peerConnection =
      null;

    this.dataChannel =
      null;

    this.localStream =
      null;

    this.remoteStream =
      null;

    this.audioElement =
      null;

    this.session =
      null;

    this.connected =
      false;

    this.destroyed =
      false;

    this.assistantTranscript =
      "";

    /*
     * Executive Voice Live Data Tools
     */
    this.liveToolsBridge =
      null;

    this.liveToolsStatus =
      "idle";

    this.lastLiveTool =
      null;
  }

  setStatus(
    status,
    detail = null
  ) {
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
            String(
              error ||
                "Unknown realtime voice error."
            )
          );

    this.onError?.(
      normalized
    );

    this.setStatus(
      "error",
      normalized.message
    );
  }

  initializeLiveToolsBridge() {
    if (
      this.liveToolsBridge
    ) {
      return this.liveToolsBridge;
    }

    this.liveToolsBridge =
      createExecutiveVoiceLiveToolsBridge({
        /*
         * All bridge events pass through this.sendEvent().
         * That means any session.update created by the
         * tools bridge is automatically normalized.
         */
        sendEvent: (event) =>
          this.sendEvent(
            event
          ),

        onStatus: ({
          status,
          detail,
        }) => {
          this.liveToolsStatus =
            status ||
            "idle";

          this.onEvent?.({
            type:
              "executive_voice_live_tools_status",

            status:
              this.liveToolsStatus,

            detail:
              detail ||
              null,
          });
        },

        onToolStarted: (
          call
        ) => {
          this.lastLiveTool = {
            name:
              call.name,

            call_id:
              call.callId,

            status:
              "running",
          };

          this.onEvent?.({
            type:
              "executive_voice_live_tool_started",

            tool:
              call.name,

            call_id:
              call.callId,
          });
        },

        onToolCompleted: ({
          name,
          callId,
          result,
        }) => {
          this.lastLiveTool = {
            name,

            call_id:
              callId,

            status:
              "complete",
          };

          this.onEvent?.({
            type:
              "executive_voice_live_tool_completed",

            tool:
              name,

            call_id:
              callId,

            result:
              result ||
              null,
          });
        },

        onToolError: ({
          name,
          callId,
          error,
        }) => {
          this.lastLiveTool = {
            name,

            call_id:
              callId,

            status:
              "error",
          };

          this.onEvent?.({
            type:
              "executive_voice_live_tool_error",

            tool:
              name,

            call_id:
              callId,

            error:
              error?.message ||
              "Live-data tool execution failed.",
          });
        },
      });

    return this.liveToolsBridge;
  }

  async registerLiveTools() {
    try {
      const bridge =
        this.initializeLiveToolsBridge();

      this.liveToolsStatus =
        "registering";

      this.onEvent?.({
        type:
          "executive_voice_live_tools_registering",
      });

      const registration =
        await bridge.registerTools();

      this.liveToolsStatus =
        "ready";

      this.onEvent?.({
        type:
          "executive_voice_live_tools_ready",

        tool_count:
          registration?.tool_count ||
          registration?.tools?.length ||
          0,
      });

      return registration;
    } catch (error) {
      this.liveToolsStatus =
        "degraded";

      console.error(
        "[Executive Voice] Live tool registration failed:",
        error
      );

      this.onEvent?.({
        type:
          "executive_voice_live_tools_error",

        error:
          error?.message ||
          "Live tool registration failed.",
      });

      /*
       * Live-data tools are optional. Voice conversation
       * remains available when registration fails.
       */
      return {
        ok:
          false,

        error:
          error?.message ||
          "Live tool registration failed.",
      };
    }
  }

  async handleLiveToolsEvent(
    event
  ) {
    if (!event) {
      return {
        handled:
          false,
      };
    }

    try {
      const bridge =
        this.initializeLiveToolsBridge();

      return await bridge.handleServerEvent(
        event
      );
    } catch (error) {
      console.error(
        "[Executive Voice] Live tool event failed:",
        error
      );

      this.liveToolsStatus =
        "degraded";

      this.onEvent?.({
        type:
          "executive_voice_live_tools_error",

        error:
          error?.message ||
          "Live tool event handling failed.",
      });

      return {
        handled:
          false,

        error,
      };
    }
  }

  resetLiveTools() {
    try {
      this.liveToolsBridge?.reset?.();
    } catch {
      /*
       * Ignore optional live-tools cleanup errors.
       */
    }

    this.liveToolsBridge =
      null;

    this.liveToolsStatus =
      "idle";

    this.lastLiveTool =
      null;
  }

  async createSession({
    voice = "marin",
    agent = "executive_chief_of_staff",
    workspaceId = 1,
    executiveContext = {},
  } = {}) {
    const response =
      await api.post(
        "/executive-voice/session",
        {
          voice,
          agent,

          workspace_id:
            workspaceId,

          executive_context:
            executiveContext,
        }
      );

    const payload =
      unwrapResponse(
        response
      );

    if (
      !payload.client_secret
    ) {
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
    if (
      this.connected
    ) {
      return this.session;
    }

    this.destroyed =
      false;

    this.setStatus(
      "requesting_session"
    );

    try {
      const session =
        await this.createSession({
          voice,
          agent,
          workspaceId,
          executiveContext,
        });

      this.session =
        session;

      this.setStatus(
        "requesting_microphone"
      );

      if (
        !navigator?.mediaDevices
          ?.getUserMedia
      ) {
        throw new Error(
          "This browser does not support microphone access."
        );
      }

      const localStream =
        await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation:
              true,

            noiseSuppression:
              true,

            autoGainControl:
              true,

            channelCount:
              1,
          },

          video:
            false,
        });

      if (
        this.destroyed
      ) {
        localStream
          .getTracks()
          .forEach(
            (track) =>
              track.stop()
          );

        throw new Error(
          "Realtime voice connection was cancelled."
        );
      }

      this.localStream =
        localStream;

      const peerConnection =
        new RTCPeerConnection();

      this.peerConnection =
        peerConnection;

      localStream
        .getAudioTracks()
        .forEach(
          (track) => {
            peerConnection.addTrack(
              track,
              localStream
            );
          }
        );

      this.audioElement =
        audioElement ||
        Object.assign(
          document.createElement(
            "audio"
          ),
          {
            autoplay:
              true,
          }
        );

      this.audioElement.autoplay =
        true;

      this.audioElement.playsInline =
        true;

      peerConnection.ontrack =
        (event) => {
          const [stream] =
            event.streams;

          if (!stream) {
            return;
          }

          this.remoteStream =
            stream;

          this.audioElement.srcObject =
            stream;

          const playPromise =
            this.audioElement.play?.();

          playPromise?.catch?.(
            () => {
              this.setStatus(
                "audio_blocked",
                "Browser interaction may be required before audio can play."
              );
            }
          );
        };

      peerConnection.onconnectionstatechange =
        () => {
          const state =
            peerConnection.connectionState;

          this.setStatus(
            `peer_${state}`
          );

          if (
            state ===
            "connected"
          ) {
            this.connected =
              true;

            this.setStatus(
              "connected"
            );
          }

          if (
            [
              "failed",
              "closed",
              "disconnected",
            ].includes(
              state
            )
          ) {
            this.connected =
              false;
          }
        };

      peerConnection.oniceconnectionstatechange =
        () => {
          this.onEvent?.({
            type:
              "client.ice_state",

            state:
              peerConnection
                .iceConnectionState,
          });
        };

      peerConnection.onicecandidateerror =
        (event) => {
          this.onEvent?.({
            type:
              "client.ice_candidate_error",

            errorCode:
              event.errorCode,

            errorText:
              event.errorText,

            url:
              event.url,
          });
        };

      const dataChannel =
        peerConnection.createDataChannel(
          "oai-events"
        );

      this.dataChannel =
        dataChannel;

      dataChannel.onopen =
        async () => {
          this.setStatus(
            "data_channel_open"
          );

          /*
           * Preserve the backend-generated session
           * configuration while forcing the required
           * Realtime session type.
           */
          if (
            session.session_update
          ) {
            const initialUpdate =
              normalizeOutgoingEvent({
                ...session.session_update,

                type:
                  "session.update",

                session: {
                  ...(session
                    .session_update
                    .session ||
                    {}),

                  type:
                    "realtime",
                },
              });

            this.sendEvent(
              initialUpdate
            );
          }

          /*
           * Register the VoterSpheres live-data tools only
           * after the Realtime data channel is open.
           */
          await this.registerLiveTools();
        };

      dataChannel.onmessage =
        async (event) => {
          const parsed =
            safeJsonParse(
              event.data
            );

          if (!parsed) {
            return;
          }

          /*
           * Let the live-data bridge intercept completed
           * function calls and return function outputs.
           */
          const liveToolResult =
            await this.handleLiveToolsEvent(
              parsed
            );

          if (
            liveToolResult?.handled
          ) {
            return;
          }

          /*
           * Preserve transcript, speech, session,
           * status, and error handling.
           */
          this.handleRealtimeEvent(
            parsed
          );
        };

      dataChannel.onerror =
        () => {
          this.emitError(
            new Error(
              "Realtime data channel failed."
            )
          );
        };

      dataChannel.onclose =
        () => {
          this.resetLiveTools();

          this.setStatus(
            "data_channel_closed"
          );
        };

      this.setStatus(
        "creating_offer"
      );

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

      const answerResponse =
        await fetch(
          callsUrl,
          {
            method:
              "POST",

            headers: {
              Authorization:
                `Bearer ${session.client_secret}`,

              "Content-Type":
                "application/sdp",
            },

            body:
              offer.sdp,
          }
        );

      const answerSdp =
        await answerResponse.text();

      if (
        !answerResponse.ok
      ) {
        throw new Error(
          answerSdp ||
            `Realtime WebRTC handshake failed with status ${answerResponse.status}.`
        );
      }

      await peerConnection.setRemoteDescription({
        type:
          "answer",

        sdp:
          answerSdp,
      });

      this.setStatus(
        "negotiating"
      );

      return session;
    } catch (error) {
      this.emitError(
        error
      );

      await this.disconnect();

      throw error;
    }
  }

  handleRealtimeEvent(event) {
    this.onEvent?.(
      event
    );

    switch (
      event.type
    ) {
      case "session.created":
      case "session.updated":
        this.setStatus(
          "session_ready"
        );
        break;

      case "input_audio_buffer.speech_started":
        this.onSpeechStarted?.(
          event
        );

        this.setStatus(
          "listening"
        );
        break;

      case "input_audio_buffer.speech_stopped":
        this.onSpeechStopped?.(
          event
        );

        this.setStatus(
          "thinking"
        );
        break;

      case "conversation.item.input_audio_transcription.delta":
        if (
          event.delta
        ) {
          this.onUserTranscript?.({
            text:
              event.delta,

            delta:
              true,

            itemId:
              event.item_id,

            event,
          });
        }
        break;

      case "conversation.item.input_audio_transcription.completed":
        this.onUserTranscript?.({
          text:
            event.transcript ||
            "",

          delta:
            false,

          itemId:
            event.item_id,

          event,
        });
        break;

      case "response.output_audio_transcript.delta":
      case "response.output_text.delta":
        if (
          event.delta
        ) {
          this.assistantTranscript +=
            event.delta;

          this.onAssistantTranscriptDelta?.({
            text:
              this.assistantTranscript,

            delta:
              event.delta,

            itemId:
              event.item_id,

            responseId:
              event.response_id,

            event,
          });

          this.setStatus(
            "speaking"
          );
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
          text:
            finalText,

          itemId:
            event.item_id,

          responseId:
            event.response_id,

          event,
        });

        this.assistantTranscript =
          "";

        break;
      }

      case "response.created":
        this.assistantTranscript =
          "";

        this.setStatus(
          "responding"
        );
        break;

      case "response.done":
        this.setStatus(
          "ready"
        );
        break;

      case "response.cancelled":
        this.assistantTranscript =
          "";

        this.setStatus(
          "interrupted"
        );
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
      this.dataChannel.readyState !==
        "open"
    ) {
      return false;
    }

    const normalizedEvent =
      normalizeOutgoingEvent(
        event
      );

    const payload = {
      ...normalizedEvent,

      event_id:
        normalizedEvent?.event_id ||
        createEventId(),
    };

    try {
      this.dataChannel.send(
        JSON.stringify(
          payload
        )
      );

      return true;
    } catch (error) {
      this.emitError(
        new Error(
          error?.message ||
            "Failed to send a Realtime event."
        )
      );

      return false;
    }
  }

  sendText(
    text,
    {
      instructions = null,
      metadata = null,
    } = {}
  ) {
    const cleanText =
      String(
        text ||
          ""
      ).trim();

    if (
      !cleanText
    ) {
      return false;
    }

    const itemCreated =
      this.sendEvent({
        type:
          "conversation.item.create",

        item: {
          type:
            "message",

          role:
            "user",

          content: [
            {
              type:
                "input_text",

              text:
                cleanText,
            },
          ],

          ...(metadata
            ? {
                metadata,
              }
            : {}),
        },
      });

    if (
      !itemCreated
    ) {
      return false;
    }

    return this.sendEvent({
      type:
        "response.create",

      response:
        instructions
          ? {
              instructions,
            }
          : {},
    });
  }

  updateSession(
    sessionPatch = {}
  ) {
    return this.sendEvent({
      type:
        "session.update",

      session: {
        ...sessionPatch,

        /*
         * Keep the required type after the spread so a
         * caller cannot overwrite it with null, undefined,
         * or a stale session value.
         */
        type:
          "realtime",
      },
    });
  }

  interrupt() {
    this.sendEvent({
      type:
        "response.cancel",
    });

    this.sendEvent({
      type:
        "output_audio_buffer.clear",
    });

    if (
      this.audioElement
    ) {
      this.audioElement.muted =
        true;

      window.setTimeout(
        () => {
          if (
            this.audioElement
          ) {
            this.audioElement.muted =
              false;
          }
        },
        60
      );
    }

    this.assistantTranscript =
      "";

    this.setStatus(
      "interrupted"
    );
  }

  setMicrophoneEnabled(
    enabled
  ) {
    this.localStream
      ?.getAudioTracks()
      .forEach(
        (track) => {
          track.enabled =
            Boolean(
              enabled
            );
        }
      );

    this.setStatus(
      enabled
        ? "microphone_on"
        : "microphone_off"
    );
  }

  async resumeAudio() {
    if (
      !this.audioElement
    ) {
      return;
    }

    this.audioElement.muted =
      false;

    await this.audioElement.play?.();
  }

  async disconnect() {
    this.destroyed =
      true;

    this.connected =
      false;

    /*
     * Shut down the live-data bridge before closing
     * the Realtime transport.
     */
    this.resetLiveTools();

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

    if (
      this.audioElement
    ) {
      try {
        this.audioElement.pause?.();
      } catch {
        // Ignore.
      }

      this.audioElement.srcObject =
        null;
    }

    this.dataChannel =
      null;

    this.peerConnection =
      null;

    this.localStream =
      null;

    this.remoteStream =
      null;

    this.session =
      null;

    this.assistantTranscript =
      "";

    this.liveToolsBridge =
      null;

    this.liveToolsStatus =
      "idle";

    this.lastLiveTool =
      null;

    this.setStatus(
      "disconnected"
    );
  }
}

export function createExecutiveVoiceRealtimeClient(
  options = {}
) {
  return new ExecutiveVoiceRealtimeClient(
    options
  );
}

export default ExecutiveVoiceRealtimeClient;
