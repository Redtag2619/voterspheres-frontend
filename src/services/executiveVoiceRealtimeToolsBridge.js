import {
  getExecutiveVoiceToolDefinitions,
  handleRealtimeExecutiveVoiceToolCall,
} from "./executiveVoiceToolsApi";

const DEFAULT_INSTRUCTIONS =
  "Use VoterSpheres live-data tools whenever the user asks for current, latest, " +
  "today, breaking, articles, polling, campaign finance, FEC, state, county, parish, " +
  "candidate, task, alert, readiness, or executive intelligence. Never invent current " +
  "figures. Always state the source freshness, publication date, field dates, filing " +
  "period, or reporting period. Clearly distinguish observed facts, official filings, " +
  "individual polls, aggregates, and modeled VoterSpheres estimates.";

function parseEvent(rawEvent) {
  if (!rawEvent) return null;

  if (typeof rawEvent === "string") {
    try {
      return JSON.parse(rawEvent);
    } catch {
      return null;
    }
  }

  if (rawEvent?.data && typeof rawEvent.data === "string") {
    try {
      return JSON.parse(rawEvent.data);
    } catch {
      return null;
    }
  }

  if (typeof rawEvent === "object") {
    return rawEvent;
  }

  return null;
}

function normalizeFunctionCall(event) {
  const item =
    event?.item ||
    event?.output_item ||
    event?.response?.output?.find?.(
      (candidate) => candidate?.type === "function_call"
    ) ||
    null;

  if (!item || item.type !== "function_call") {
    return null;
  }

  return {
    name: item.name || "",
    arguments: item.arguments || "{}",
    callId: item.call_id || item.id || "",
    item,
  };
}

export function createExecutiveVoiceLiveToolsBridge({
  sendEvent,
  onStatus,
  onToolStarted,
  onToolCompleted,
  onToolError,
  instructions = DEFAULT_INSTRUCTIONS,
} = {}) {
  if (typeof sendEvent !== "function") {
    throw new Error(
      "createExecutiveVoiceLiveToolsBridge requires a sendEvent function."
    );
  }

  let registered = false;
  let registeringPromise = null;
  const activeCalls = new Set();

  function setStatus(status, detail = null) {
    if (typeof onStatus === "function") {
      onStatus({
        status,
        detail,
      });
    }
  }

  async function registerTools({ force = false } = {}) {
    if (registered && !force) {
      return {
        ok: true,
        already_registered: true,
      };
    }

    if (registeringPromise) {
      return registeringPromise;
    }

    registeringPromise = (async () => {
      try {
        setStatus("registering");

        const response =
          await getExecutiveVoiceToolDefinitions();

        const tools = Array.isArray(response?.tools)
          ? response.tools
          : [];

        if (!tools.length) {
          throw new Error(
            "The Executive Voice tool definition endpoint returned no tools."
          );
        }

        sendEvent({
          type: "session.update",
          session: {
            tools,
            tool_choice: "auto",
            instructions,
          },
        });

        registered = true;

        setStatus("ready", {
          tool_count: tools.length,
        });

        return {
          ok: true,
          already_registered: false,
          tool_count: tools.length,
          tools,
        };
      } catch (error) {
        registered = false;

        setStatus("error", error.message);

        throw error;
      } finally {
        registeringPromise = null;
      }
    })();

    return registeringPromise;
  }

  async function handleServerEvent(rawEvent) {
    const event = parseEvent(rawEvent);

    if (!event) {
      return {
        handled: false,
        reason: "invalid-event",
      };
    }

    if (event.type === "session.created") {
      await registerTools();

      return {
        handled: true,
        reason: "session-created",
      };
    }

    if (
      event.type !== "response.output_item.done" &&
      event.type !== "response.output_item.added"
    ) {
      return {
        handled: false,
        event,
      };
    }

    const call = normalizeFunctionCall(event);

    if (!call?.name || !call?.callId) {
      return {
        handled: false,
        event,
      };
    }

    if (activeCalls.has(call.callId)) {
      return {
        handled: true,
        reason: "duplicate-function-call",
        call,
      };
    }

    activeCalls.add(call.callId);

    try {
      setStatus("tool-running", {
        name: call.name,
        call_id: call.callId,
      });

      if (typeof onToolStarted === "function") {
        onToolStarted(call);
      }

          const handled =
        await handleRealtimeExecutiveVoiceToolCall({
          name: call.name,
          arguments: call.arguments,
          callId: call.callId,
          sendEvent,
        });

      if (!handled?.handled) {
        return {
          handled: false,
          reason: "unregistered-tool",
          call,
        };
      }

      if (typeof onToolCompleted === "function") {
        onToolCompleted({
          ...call,
          result: handled.result,
        });
      }

      setStatus("ready", {
        last_tool: call.name,
        call_id: call.callId,
      });

      return {
        handled: true,
        reason: "tool-completed",
        call,
        result: handled.result,
      };
    } catch (error) {
      const errorOutput = {
        ok: false,
        tool: call.name,
        error:
          error?.message ||
          "Live-data tool execution failed.",
        degraded: true,
        generated_at: new Date().toISOString(),
      };

      sendEvent({
        type: "conversation.item.create",
        item: {
          type: "function_call_output",
          call_id: call.callId,
          output: JSON.stringify(errorOutput),
        },
      });

      sendEvent({
        type: "response.create",
        response: {
          instructions:
            "Explain that the live-data source could not be reached. " +
            "Do not invent facts or figures. Offer the latest verified " +
            "information already available in the conversation and identify " +
            "the unavailable tool.",
        },
      });

      if (typeof onToolError === "function") {
        onToolError({
          ...call,
          error,
        });
      }

      setStatus("degraded", {
        name: call.name,
        error:
          error?.message ||
          "Tool execution failed.",
      });

      return {
        handled: true,
        reason: "tool-error",
        call,
        error,
      };
    } finally {
      activeCalls.delete(call.callId);
    }
  }

  function reset() {
    registered = false;
    registeringPromise = null;
    activeCalls.clear();

    setStatus("idle");
  }

  return {
    registerTools,
    handleServerEvent,
    reset,

    get registered() {
      return registered;
    },

    get activeCallCount() {
      return activeCalls.size;
    },
  };
}

export default createExecutiveVoiceLiveToolsBridge;


