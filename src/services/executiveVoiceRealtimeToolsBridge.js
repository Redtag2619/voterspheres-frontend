import {

  getExecutiveVoiceToolDefinitions,

  handleRealtimeExecutiveVoiceToolCall,

} from "./executiveVoiceToolsApi";

 

const TOOL_TIMEOUT_MS = 30000;

 

const TOOL_INSTRUCTIONS = `

Use VoterSpheres tools whenever the user asks for current, live, workspace-specific, candidate, polling, fundraising, FEC, news, state/local, election-administration, legislative, weather/field, or executive intelligence.

 

Do not guess live facts when a tool can retrieve them. For broad executive briefings, use get_unified_executive_intelligence first, then call specialist tools as needed. When a tool returns no data, say so clearly. When multiple tools are required, finish the required tool calls before giving the final synthesis.

`.trim();

 

function parseEvent(value) {

  if (!value) return null;

  if (typeof value === "object") return value;

  try {

    return JSON.parse(value);

  } catch {

    return null;

  }

}

 

function parseArguments(value) {

  if (!value) return {};

  if (typeof value === "object") return value;

  try {

    const parsed = JSON.parse(value);

    return parsed && typeof parsed === "object" ? parsed : {};

  } catch {

    return {};

  }

}

 

function normalizeFunctionCall(event = {}) {

  const item = event.item || event.output_item || event.response?.output?.[0] || {};

 

  const name =

    event.name ||

    item.name ||

    event.function?.name ||

    item.function?.name ||

    "";

 

  const callId =

    event.call_id ||

    item.call_id ||

    event.callId ||

    item.callId ||

    "";

 

  const argumentsValue =

    event.arguments ??

    item.arguments ??

    event.function?.arguments ??

    item.function?.arguments ??

    {};

 

  return {

    name: String(name || "").trim(),

    callId: String(callId || "").trim(),

    arguments: parseArguments(argumentsValue),

    sourceEvent: event.type || "unknown",

  };

}

 

function withTimeout(promise, timeoutMs, label) {

  let timer;

 

  return Promise.race([

    promise,

    new Promise((_, reject) => {

      timer = window.setTimeout(() => {

        reject(new Error(`${label} timed out after ${timeoutMs}ms.`));

      }, timeoutMs);

    }),

  ]).finally(() => window.clearTimeout(timer));

}

 

function extractResultFromCapturedEvents(events = []) {

  for (let index = events.length - 1; index >= 0; index -= 1) {

    const event = events[index];

    const output = event?.item?.output;

    if (!output) continue;

 

    if (typeof output === "object") return output;

 

    try {

      return JSON.parse(output);

    } catch {

      return {

        ok: true,

        summary: String(output),

      };

    }

  }

 

  return null;

}

 

function compactSources(sources = []) {

  if (!Array.isArray(sources)) return [];

 

  return sources.slice(0, 12).map((source) => {

    if (typeof source === "string") {

      return { name: source };

    }

 

    return {

      provider: source?.provider || source?.source || null,

      name: source?.name || source?.title || source?.label || null,

      url: source?.url || null,

      published_at:

        source?.published_at || source?.field_end || source?.updated_at || null,

      excerpt: source?.excerpt || source?.summary || null,

      confidence:

        source?.confidence ?? source?.confidence_score ?? source?.reliability_score ?? null,

    };

  });

}

 

function compactToolResult(result = {}, toolName = "unknown") {

  const data = result?.data ?? result?.results ?? result?.result ?? null;

 

  return {

    ok: result?.ok !== false,

    tool: result?.tool || toolName,

    summary:

      result?.summary ||

      result?.executive_summary ||

      result?.message ||

      "The VoterSpheres tool completed.",

    data,

    sources: compactSources(result?.sources || result?.evidence || []),

    warnings: Array.isArray(result?.warnings) ? result.warnings.slice(0, 8) : [],

    diagnostics: Array.isArray(result?.diagnostics)

      ? result.diagnostics.slice(0, 8)

      : [],

    degraded: Boolean(result?.degraded),

    cached: Boolean(result?.cached),

    stale: Boolean(result?.stale),

    generated_at: result?.generated_at || new Date().toISOString(),

  };

}

 

export function createExecutiveVoiceLiveToolsBridge({

  sendEvent,

  onStatus,

  onToolStarted,

  onToolCompleted,

  onToolError,

  instructions = TOOL_INSTRUCTIONS,

} = {}) {

  if (typeof sendEvent !== "function") {

    throw new Error(

      "createExecutiveVoiceLiveToolsBridge requires a sendEvent function."

    );

  }

 

  let registered = false;

  let registeringPromise = null;

  const activeCalls = new Set();

  const completedCalls = new Set();

 

  function setStatus(status, detail = null) {

    onStatus?.({ status, detail });

  }

 

  function sendRequiredEvent(event, label) {

    const sent = sendEvent(event);

 

    if (sent === false) {

      throw new Error(`Realtime data channel rejected ${label}.`);

    }

 

    return sent;

  }

 

  async function registerTools({ force = false } = {}) {

    if (registered && !force) {

      return {

        ok: true,

        already_registered: true,

      };

    }

 

    if (registeringPromise) return registeringPromise;

 

    registeringPromise = (async () => {

      try {

        setStatus("registering");

 

        const response = await getExecutiveVoiceToolDefinitions();

        const tools = Array.isArray(response?.tools)

          ? response.tools

          : Array.isArray(response?.data?.tools)

            ? response.data.tools

            : [];

 

        if (!tools.length) {

          throw new Error(

            "The Executive Voice tool definition endpoint returned no tools."

          );

        }

 

        sendRequiredEvent(

          {

            type: "session.update",

            session: {

              type: "realtime",

              tools,

              tool_choice: "auto",

              instructions,

            },

          },

          "session tool registration"

        );

 

        registered = true;

        setStatus("ready", { tool_count: tools.length });

 

        return {

          ok: true,

          already_registered: false,

          tool_count: tools.length,

          tools,

        };

      } catch (error) {

        registered = false;

        setStatus("error", error?.message || "Tool registration failed.");

        throw error;

      } finally {

        registeringPromise = null;

      }

    })();

 

    return registeringPromise;

  }

 

  async function executeCall(call) {

    const capturedEvents = [];

 

    const handled = await withTimeout(

      handleRealtimeExecutiveVoiceToolCall({

        name: call.name,

        arguments: call.arguments,

        callId: call.callId,

        sendEvent: (event) => {

          capturedEvents.push(event);

          return true;

        },

      }),

      TOOL_TIMEOUT_MS,

      `Executive Voice tool ${call.name}`

    );

 

    if (!handled?.handled) {

      return { handled: false, result: null };

    }

 

    return {

      handled: true,

      result:

        handled.result ||

        extractResultFromCapturedEvents(capturedEvents) || {

          ok: false,

          tool: call.name,

          summary: "The tool completed without returning a readable result.",

          degraded: true,

        },

    };

  }

 

  async function handleServerEvent(rawEvent) {

    const event = parseEvent(rawEvent);

 

    if (!event) {

      return { handled: false, reason: "invalid-event" };

    }

 

    if (event.type === "session.created") {

      await registerTools();

      return { handled: true, reason: "session-created" };

    }

 

    if (event.type === "session.updated") {

      return { handled: false, reason: "session-updated" };

    }

 

    const supportedEvents = [

      "response.function_call_arguments.done",

      "response.output_item.done",

      "response.output_item.added",

    ];

 

    if (!supportedEvents.includes(event.type)) {

      return { handled: false, event };

    }

 

    const call = normalizeFunctionCall(event);

 

    if (!call.name || !call.callId) {

      return {

        handled: false,

        reason: "missing-function-call-data",

        event,

      };

    }

 

    if (completedCalls.has(call.callId)) {

      return {

        handled: true,

        reason: "completed-function-call-duplicate",

        call,

      };

    }

 

    if (activeCalls.has(call.callId)) {

      return {

        handled: true,

        reason: "active-function-call-duplicate",

        call,

      };

    }

 

    activeCalls.add(call.callId);

 

    try {

      setStatus("tool-running", {

        name: call.name,

        call_id: call.callId,

        source_event: call.sourceEvent,

      });

      onToolStarted?.(call);

 

      const execution = await executeCall(call);

 

      if (!execution.handled) {

        return {

          handled: false,

          reason: "unregistered-tool",

          call,

        };

      }

 

      const compactResult = compactToolResult(execution.result, call.name);

      const output = JSON.stringify(compactResult);

 

      sendRequiredEvent(

        {

          type: "conversation.item.create",

          item: {

            type: "function_call_output",

            call_id: call.callId,

            output,

          },

        },

        "function-call output"

      );

 

      sendRequiredEvent(

        {

          type: "response.create",

          response: {

            instructions:

              "Use the completed VoterSpheres tool output to answer the user's request now. " +

              "Lead with the most important verified result. Include dates, reporting periods, " +

              "poll field dates, or source names when available. If another registered tool is " +

              "needed to fully answer the same request, call it before giving the final synthesis. " +

              "If data is degraded, stale, cached, or empty, say so clearly. Never invent missing facts.",

          },

        },

        "post-tool response creation"

      );

 

      completedCalls.add(call.callId);

      onToolCompleted?.({ ...call, result: compactResult });

      setStatus("ready", {

        last_tool: call.name,

        call_id: call.callId,

        output_bytes: output.length,

        result_ok: compactResult.ok,

      });

 

      return {

        handled: true,

        reason: "tool-completed",

        call,

        result: compactResult,

      };

    } catch (error) {

      const errorOutput = {

        ok: false,

        tool: call.name,

        summary: "The live-data tool could not complete.",

        error: error?.message || "Live-data tool execution failed.",

        degraded: true,

        generated_at: new Date().toISOString(),

      };

 

      try {

        sendRequiredEvent(

          {

            type: "conversation.item.create",

            item: {

              type: "function_call_output",

              call_id: call.callId,

              output: JSON.stringify(errorOutput),

            },

          },

          "tool-error output"

        );

 

        sendRequiredEvent(

          {

            type: "response.create",

            response: {

              instructions:

                "Explain briefly that the requested VoterSpheres data source failed. " +

                "Name the unavailable tool, do not invent facts, and use only verified information already available.",

            },

          },

          "tool-error response creation"

        );

 

        completedCalls.add(call.callId);

      } catch (sendError) {

        console.error(

          "[Executive Voice] Failed to return tool error to Realtime:",

          sendError

        );

      }

 

      onToolError?.({ ...call, error });

      setStatus("degraded", {

        name: call.name,

        call_id: call.callId,

        error: error?.message || "Tool execution failed.",

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

    completedCalls.clear();

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