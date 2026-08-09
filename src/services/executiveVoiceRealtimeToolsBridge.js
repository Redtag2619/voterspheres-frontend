import {

  getExecutiveVoiceToolDefinitions,

  handleRealtimeExecutiveVoiceToolCall,

} from "./executiveVoiceToolsApi";

 

const TOOL_TIMEOUT_MS = 30000;

const SYNTHESIS_DEBOUNCE_MS = 75;

const COMPLETED_CALL_HISTORY_LIMIT = 500;

 

const TOOL_INSTRUCTIONS = `

Use VoterSpheres tools whenever the user asks for current, live, workspace-specific, candidate, polling, fundraising, FEC, news, state/local, election-administration, legislative, weather/field, or executive intelligence.

 

Do not guess live facts when a tool can retrieve them. For broad executive briefings, use get_unified_executive_intelligence first, then call specialist tools as needed. When a tool returns no data, say so clearly. When multiple tools are required, finish the required tool calls before giving the final synthesis.

`.trim();

 

const SYNTHESIS_INSTRUCTIONS =

  "Use all completed VoterSpheres function-call outputs from this tool batch to answer the user's request now. " +

  "Do not describe any tool in this completed batch as still running. Lead with the most important verified result. " +

  "Include dates, reporting periods, poll field dates, filing periods, source names, and freshness when available. " +

  "If the current evidence still requires another registered VoterSpheres tool to answer the same request, call it before the final synthesis. " +

  "Clearly distinguish verified records, individual polls, aggregates, modeled estimates, cached data, stale data, degraded sources, and unavailable data. " +

  "Do not invent missing facts.";

 

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

  if (typeof value === "object" && !Array.isArray(value)) return value;

 

  try {

    const parsed = JSON.parse(value);

    return parsed && typeof parsed === "object" && !Array.isArray(parsed)

      ? parsed

      : {};

  } catch {

    return {};

  }

}

 

function normalizeFunctionCall(event = {}) {

  const item =

    event.item ||

    event.output_item ||

    event.response?.output?.[0] ||

    {};

 

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

 

  return sources.slice(0, 16).map((source) => {

    if (typeof source === "string") {

      return { name: source };

    }

 

    return {

      provider: source?.provider || source?.source || null,

      source: source?.source || source?.key || null,

      name:

        source?.name ||

        source?.title ||

        source?.label ||

        source?.key ||

        null,

      url: source?.url || source?.source_url || null,

      published_at:

        source?.published_at ||

        source?.field_end ||

        source?.last_seen ||

        source?.updated_at ||

        null,

      checked_at: source?.checked_at || source?.fetched_at || null,

      freshness: source?.freshness || null,

      status: source?.status || null,

      excerpt: source?.excerpt || source?.summary || null,

      confidence:

        source?.confidence ??

        source?.confidence_score ??

        source?.reliability_score ??

        null,

      error: source?.error || null,

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

    warnings: Array.isArray(result?.warnings)

      ? result.warnings.slice(0, 12)

      : [],

    diagnostics: Array.isArray(result?.diagnostics)

      ? result.diagnostics.slice(0, 12)

      : [],

    degraded: Boolean(result?.degraded),

    cached: Boolean(result?.cached),

    stale: Boolean(result?.stale),

    generated_at: result?.generated_at || new Date().toISOString(),

  };

}

 

function responseIdentifier(event = {}) {

  return (

    event?.response?.id ||

    event?.response_id ||

    event?.responseId ||

    null

  );

}

 

function isResponseLifecycleStart(event = {}) {

  return event.type === "response.created";

}

 

function isResponseLifecycleEnd(event = {}) {

  return [

    "response.done",

    "response.cancelled",

    "response.canceled",

    "response.failed",

  ].includes(event.type);

}

 

function isActiveResponseConflict(event = {}) {

  if (event.type !== "error") return false;

 

  const message = String(

    event?.error?.message || event?.message || ""

  ).toLowerCase();

 

  return (

    message.includes("active response") ||

    message.includes("response in progress") ||

    message.includes("already has an active response")

  );

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

 

  let responseInProgress = false;

  let activeResponseId = null;

  let responseCreatePending = false;

 

  let synthesisNeeded = false;

  let synthesisQueuedAt = null;

  let synthesisTimer = null;

 

  let batchSequence = 0;

  let currentBatchId = null;

 

  const activeCalls = new Set();

  const completedCalls = new Set();

  const completedCallOrder = [];

  const batchResults = new Map();

 

  function setStatus(status, detail = null) {

    onStatus?.({ status, detail });

  }

 

  function clearSynthesisTimer() {

    if (synthesisTimer !== null) {

      window.clearTimeout(synthesisTimer);

      synthesisTimer = null;

    }

  }

 

  function rememberCompletedCall(callId) {

    if (!callId || completedCalls.has(callId)) return;

 

    completedCalls.add(callId);

    completedCallOrder.push(callId);

 

    while (completedCallOrder.length > COMPLETED_CALL_HISTORY_LIMIT) {

      const oldest = completedCallOrder.shift();

      if (oldest) completedCalls.delete(oldest);

    }

  }

 

  function ensureBatch() {

    if (currentBatchId !== null) return currentBatchId;

 

    batchSequence += 1;

    currentBatchId = batchSequence;

    batchResults.clear();

 

    return currentBatchId;

  }

 

  function batchSummary() {

    const values = Array.from(batchResults.values());

 

    return {

      batch_id: currentBatchId,

      tool_count: values.length,

      successful_tools: values.filter(

        (item) => item?.result?.ok !== false

      ).length,

      failed_tools: values.filter(

        (item) => item?.result?.ok === false

      ).length,

      tools: values.map((item) => item?.call?.name).filter(Boolean),

    };

  }

 

  function finishBatchAfterSynthesisRequest() {

    currentBatchId = null;

    batchResults.clear();

  }

 

  function sendRequiredEvent(event, label) {

    const sent = sendEvent(event);

 

    if (sent === false) {

      throw new Error(`Realtime data channel rejected ${label}.`);

    }

 

    return sent;

  }

 

  function canCreateSynthesisResponse() {

    return (

      synthesisNeeded &&

      activeCalls.size === 0 &&

      !responseInProgress &&

      !responseCreatePending

    );

  }

 

  function requestSynthesis(reason = "tool-batch-complete") {

    synthesisNeeded = true;

    synthesisQueuedAt = Date.now();

 

    if (activeCalls.size > 0) {

      setStatus("tool-running", {

        reason,

        active_tool_count: activeCalls.size,

        synthesis_queued: true,

        batch: batchSummary(),

      });

      return false;

    }

 

    if (responseInProgress || responseCreatePending) {

      setStatus("synthesis-queued", {

        reason,

        response_in_progress: responseInProgress,

        response_create_pending: responseCreatePending,

        active_response_id: activeResponseId,

        batch: batchSummary(),

      });

      return false;

    }

 

    clearSynthesisTimer();

 

    synthesisTimer = window.setTimeout(() => {

      synthesisTimer = null;

 

      if (!canCreateSynthesisResponse()) {

        requestSynthesis("synthesis-deferred");

        return;

      }

 

      const batch = batchSummary();

 

      try {

        responseCreatePending = true;

 

        sendRequiredEvent(

          {

            type: "response.create",

            response: {

              instructions: SYNTHESIS_INSTRUCTIONS,

            },

          },

          "batched post-tool response creation"

        );

 

        synthesisNeeded = false;

        synthesisQueuedAt = null;

 

        setStatus("synthesis-requested", {

          reason,

          batch,

        });

 

        console.log(

          "[Executive Voice Realtime] batched synthesis requested:",

          batch

        );

 

        finishBatchAfterSynthesisRequest();

      } catch (error) {

        responseCreatePending = false;

        synthesisNeeded = true;

 

        console.error(

          "[Executive Voice Realtime] synthesis request failed:",

          error

        );

 

        setStatus("degraded", {

          reason: "synthesis-request-failed",

          error: error?.message || "Unable to create Realtime response.",

          batch,

        });

      }

    }, SYNTHESIS_DEBOUNCE_MS);

 

    return true;

  }

 

  function noteFunctionOutput(call, compactResult) {

    const batchId = ensureBatch();

 

    batchResults.set(call.callId, {

      batch_id: batchId,

      call,

      result: compactResult,

      completed_at: new Date().toISOString(),

    });

 

    synthesisNeeded = true;

    synthesisQueuedAt = Date.now();

  }

 

  function settleToolCall(call, compactResult) {

    activeCalls.delete(call.callId);

    rememberCompletedCall(call.callId);

    noteFunctionOutput(call, compactResult);

 

    if (activeCalls.size === 0) {

      requestSynthesis("all-active-tools-complete");

    } else {

      setStatus("tool-running", {

        last_tool: call.name,

        call_id: call.callId,

        active_tool_count: activeCalls.size,

        synthesis_queued: true,

        batch: batchSummary(),

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

 

  function handleResponseLifecycle(event) {

    if (isResponseLifecycleStart(event)) {

      responseInProgress = true;

      responseCreatePending = false;

      activeResponseId = responseIdentifier(event);

 

      setStatus(activeCalls.size > 0 ? "tool-running" : "response-active", {

        response_id: activeResponseId,

        active_tool_count: activeCalls.size,

        synthesis_queued: synthesisNeeded,

      });

 

      return {

        handled: true,

        reason: "response-created",

        response_id: activeResponseId,

      };

    }

 

    if (isResponseLifecycleEnd(event)) {

      const completedResponseId =

        responseIdentifier(event) || activeResponseId;

 

      responseInProgress = false;

      responseCreatePending = false;

      activeResponseId = null;

 

      if (synthesisNeeded) {

        requestSynthesis("response-finished-with-tool-output-waiting");

      } else if (activeCalls.size > 0) {

        setStatus("tool-running", {

          response_id: completedResponseId,

          active_tool_count: activeCalls.size,

          synthesis_queued: true,

        });

      } else {

        setStatus("ready", {

          response_id: completedResponseId,

        });

      }

 

      return {

        handled: true,

        reason: "response-finished",

        response_id: completedResponseId,

      };

    }

 

    if (isActiveResponseConflict(event)) {

      responseCreatePending = false;

      responseInProgress = true;

      synthesisNeeded = true;

 

      console.warn(

        "[Executive Voice Realtime] response.create deferred because a response is already active:",

        event?.error?.message || event?.message || "active response"

      );

 

      setStatus("synthesis-queued", {

        reason: "active-response-conflict",

        active_tool_count: activeCalls.size,

        synthesis_queued: true,

        batch: batchSummary(),

      });

 

      return {

        handled: true,

        reason: "active-response-conflict",

      };

    }

 

    return null;

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

 

    const lifecycleResult = handleResponseLifecycle(event);

    if (lifecycleResult) return lifecycleResult;

 

    // Execute tools only once the Realtime API has emitted the completed

    // function-call argument payload. Earlier output-item events can contain

    // partial JSON and are intentionally ignored.

    if (event.type !== "response.function_call_arguments.done") {

      return { handled: false, event };

    }

 

    const call = normalizeFunctionCall(event);

 

    console.log(

      "[Executive Voice Realtime] completed function call:",

      {

        sourceEvent: event.type,

        name: call.name,

        callId: call.callId,

        arguments: call.arguments,

      }

    );

 

    if (!call.name || !call.callId) {

      return {

        handled: false,

        reason: "missing-function-call-data",

        event,

      };

    }

 

    if (!call.arguments || typeof call.arguments !== "object") {

      return {

        handled: false,

        reason: "function-arguments-not-ready",

        call,

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

 

    ensureBatch();

    activeCalls.add(call.callId);

 

    setStatus("tool-running", {

      name: call.name,

      call_id: call.callId,

      source_event: call.sourceEvent,

      active_tool_count: activeCalls.size,

      batch_id: currentBatchId,

    });

 

    onToolStarted?.(call);

 

    try {

      const execution = await executeCall(call);

 

      if (!execution.handled) {

        const unregisteredOutput = compactToolResult(

          {

            ok: false,

            tool: call.name,

            summary: `The requested Realtime tool ${call.name} is not registered.`,

            warnings: [

              "The tool call could not be matched to a registered VoterSpheres tool.",

            ],

            degraded: true,

          },

          call.name

        );

 

        sendRequiredEvent(

          {

            type: "conversation.item.create",

            item: {

              type: "function_call_output",

              call_id: call.callId,

              output: JSON.stringify(unregisteredOutput),

            },

          },

          "unregistered-tool output"

        );

 

        settleToolCall(call, unregisteredOutput);

        onToolError?.({

          ...call,

          error: new Error(`Unregistered Executive Voice tool: ${call.name}`),

        });

 

        return {

          handled: true,

          reason: "unregistered-tool-output-returned",

          call,

          result: unregisteredOutput,

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

 

      settleToolCall(call, compactResult);

      onToolCompleted?.({ ...call, result: compactResult });

 

      console.log(

        "[Executive Voice Realtime] tool output submitted:",

        {

          name: call.name,

          callId: call.callId,

          resultOk: compactResult.ok,

          activeToolCount: activeCalls.size,

          responseInProgress,

          synthesisNeeded,

          outputBytes: output.length,

          batchId: currentBatchId,

        }

      );

 

      return {

        handled: true,

        reason: "tool-completed",

        call,

        result: compactResult,

      };

    } catch (error) {

      const errorOutput = compactToolResult(

        {

          ok: false,

          tool: call.name,

          summary: "The live-data tool could not complete.",

          warnings: [

            error?.message || "Live-data tool execution failed.",

          ],

          degraded: true,

          generated_at: new Date().toISOString(),

        },

        call.name

      );

 

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

      } catch (sendError) {

        console.error(

          "[Executive Voice Realtime] failed to return tool error output:",

          sendError

        );

      }

 

      settleToolCall(call, errorOutput);

      onToolError?.({ ...call, error });

 

      setStatus(

        activeCalls.size > 0 ? "tool-running" : "synthesis-queued",

        {

          name: call.name,

          call_id: call.callId,

          error: error?.message || "Tool execution failed.",

          active_tool_count: activeCalls.size,

          synthesis_queued: true,

          batch: batchSummary(),

        }

      );

 

      return {

        handled: true,

        reason: "tool-error",

        call,

        error,

        result: errorOutput,

      };

    }

  }

 

  function reset() {

    clearSynthesisTimer();

 

    registered = false;

    registeringPromise = null;

 

    responseInProgress = false;

    activeResponseId = null;

    responseCreatePending = false;

 

    synthesisNeeded = false;

    synthesisQueuedAt = null;

 

    batchSequence = 0;

    currentBatchId = null;

 

    activeCalls.clear();

    completedCalls.clear();

    completedCallOrder.length = 0;

    batchResults.clear();

 

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

 

    get responseInProgress() {

      return responseInProgress;

    },

 

    get responseCreatePending() {

      return responseCreatePending;

    },

 

    get synthesisQueued() {

      return synthesisNeeded;

    },

 

    get synthesisQueuedAt() {

      return synthesisQueuedAt;

    },

 

    get currentBatchId() {

      return currentBatchId;

    },

  };

}

 

export default createExecutiveVoiceLiveToolsBridge;
