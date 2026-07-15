import { api } from "./api";

const unwrap = (
  response
) =>
  response?.data ||
  response ||
  {};

function parseArguments(
  value
) {
  if (!value) {
    return {};
  }

  if (
    typeof value ===
      "object" &&
    !Array.isArray(value)
  ) {
    return value;
  }

  try {
    return JSON.parse(
      String(value)
    );
  } catch {
    return {};
  }
}

export async function getExecutiveVoiceToolDefinitions() {
  return unwrap(
    await api.get(
      "/executive-voice-tools/definitions"
    )
  );
}

export async function executeExecutiveVoiceTool(
  name,
  argumentsValue = {}
) {
  return unwrap(
    await api.post(
      "/executive-voice-tools/execute",
      {
        name,

        arguments:
          parseArguments(
            argumentsValue
          ),
      }
    )
  );
}

export const EXECUTIVE_VOICE_LIVE_TOOL_NAMES =
  Object.freeze([
    "get_unified_executive_intelligence",
    "search_live_news",
    "get_latest_polling",
    "get_fec_finance",
    "get_state_operations",
    "get_candidate_statistics",
  ]);

export function isExecutiveVoiceLiveTool(
  name
) {
  return EXECUTIVE_VOICE_LIVE_TOOL_NAMES.includes(
    String(name || "")
  );
}

export async function handleRealtimeExecutiveVoiceToolCall({
  name,
  arguments:
    argumentsValue,
  callId,
  sendEvent,
} = {}) {
  if (
    !isExecutiveVoiceLiveTool(
      name
    )
  ) {
    return {
      handled: false,
      result: null,
    };
  }

  if (
    typeof sendEvent !==
    "function"
  ) {
    throw new Error(
      "handleRealtimeExecutiveVoiceToolCall requires a sendEvent function."
    );
  }

  const output =
    await executeExecutiveVoiceTool(
      name,
      argumentsValue
    );

  sendEvent({
    type:
      "conversation.item.create",

    item: {
      type:
        "function_call_output",

      call_id:
        callId,

      output:
        JSON.stringify(
          output
        ),
    },
  });

  sendEvent({
    type:
      "response.create",

    response: {
      instructions:
        "Continue using the live tool result. " +
        "State freshness or reporting period, " +
        "distinguish observed facts from modeled estimates, " +
        "mention degraded sources, and summarize the most important " +
        "current information in clear spoken language.",
    },
  });

  return {
    handled: true,
    result: output,
  };
}
