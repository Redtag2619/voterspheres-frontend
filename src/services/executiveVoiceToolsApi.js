import { api } from "./api";

const unwrap = (response) =>
  response?.data?.data ??
  response?.data ??
  response ??
  {};

function parseArguments(value) {
  if (!value) {
    return {};
  }

  if (
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    return value;
  }

  try {
    return JSON.parse(
      String(value)
    );
  } catch (error) {
    console.warn(
      "[Executive Voice Tools] Could not parse tool arguments:",
      {
        value,
        error:
          error?.message ||
          "Unknown argument parsing error.",
      }
    );

    return {};
  }
}

export async function getExecutiveVoiceToolDefinitions() {
  const result = unwrap(
    await api.get(
      "/executive-voice-tools/definitions"
    )
  );

  console.log(
    "[Executive Voice Tools] Definitions loaded:",
    {
      toolCount:
        Array.isArray(result?.tools)
          ? result.tools.length
          : 0,

      toolNames:
        Array.isArray(result?.tools)
          ? result.tools.map(
              (tool) => tool?.name
            )
          : [],
    }
  );

  return result;
}

export async function executeExecutiveVoiceTool(
  name,
  argumentsValue = {}
) {
  const parsedArguments =
    parseArguments(
      argumentsValue
    );

  console.log(
    "[Executive Voice Tools] Executing:",
    {
      name,
      arguments:
        parsedArguments,
    }
  );

  const result = unwrap(
    await api.post(
      "/executive-voice-tools/execute",
      {
        name,

        arguments:
          parsedArguments,
      }
    )
  );

  console.log(
    "[Executive Voice Tools] Execution completed:",
    {
      name,

      ok:
        result?.ok,

      tool:
        result?.tool,

      summary:
        result?.summary,

      articleCount:
        result?.data
          ?.news
          ?.articles
          ?.length ??
        result?.data
          ?.articles
          ?.length ??
        result?.articles
          ?.length ??
        0,

      successfulProviders:
        result?.data
          ?.news
          ?.successful_providers ??
        result?.successful_providers ??
        [],

      attemptedProviders:
        result?.data
          ?.news
          ?.attempted_providers ??
        result?.attempted_providers ??
        [],

      warningCount:
        Array.isArray(
          result?.warnings
        )
          ? result.warnings.length
          : 0,

      degraded:
        Boolean(
          result?.degraded
        ),
    }
  );

  return result;
}

export const EXECUTIVE_VOICE_LIVE_TOOL_NAMES =
  Object.freeze([
    "get_unified_executive_intelligence",

    /*
     * Build 3.5.2 candidate intelligence.
     */
    "get_candidate_live_intelligence",

    "search_live_news",
    "get_latest_polling",
    "get_fec_finance",
    "get_legislative_updates",
    "get_weather_field_risk",
    "get_election_administration_updates",
    "get_state_operations",
    "get_candidate_statistics",
  ]);

export function isExecutiveVoiceLiveTool(
  name
) {
  const normalizedName =
    String(
      name || ""
    ).trim();

  const supported =
    EXECUTIVE_VOICE_LIVE_TOOL_NAMES.includes(
      normalizedName
    );

  if (!supported) {
    console.warn(
      "[Executive Voice Tools] Unsupported tool requested:",
      {
        name:
          normalizedName,

        supportedTools:
          EXECUTIVE_VOICE_LIVE_TOOL_NAMES,
      }
    );
  }

  return supported;
}

export async function handleRealtimeExecutiveVoiceToolCall({
  name,
  arguments:
    argumentsValue,
  callId,
  sendEvent,
} = {}) {
  const normalizedName =
    String(
      name || ""
    ).trim();

  if (
    !isExecutiveVoiceLiveTool(
      normalizedName
    )
  ) {
    return {
      handled:
        false,

      result:
        null,

      reason:
        "unsupported-tool",
    };
  }

  if (!callId) {
    throw new Error(
      `Executive Voice tool ${normalizedName} is missing its call ID.`
    );
  }

  if (
    typeof sendEvent !==
    "function"
  ) {
    throw new Error(
      "handleRealtimeExecutiveVoiceToolCall requires a sendEvent function."
    );
  }

  console.log(
    "[Executive Voice Tools] Realtime call started:",
    {
      name:
        normalizedName,

      callId,
    }
  );

  const output =
    await executeExecutiveVoiceTool(
      normalizedName,
      argumentsValue
    );

  if (!output) {
    throw new Error(
      `The backend returned no result for ${normalizedName}.`
    );
  }

  /*
   * This helper remains compatible with direct use.
   *
   * The updated Realtime bridge supplies a capture function here,
   * so these events are captured rather than sent twice. The bridge
   * then sends one compact function_call_output and response.create.
   */
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
        "Continue using the completed VoterSpheres live-data result. " +
        "Answer the user's request now. State publication dates, field dates, " +
        "filing periods, reporting periods, and source freshness where available. " +
        "Distinguish observed facts, official records, individual polls, aggregates, " +
        "and modeled estimates. Mention degraded or unavailable providers. " +
        "Do not say that the search is still running and do not invent missing facts.",
    },
  });

  console.log(
    "[Executive Voice Tools] Realtime call completed:",
    {
      name:
        normalizedName,

      callId,

      ok:
        output?.ok,

      articleCount:
        output?.data
          ?.news
          ?.articles
          ?.length ??
        output?.data
          ?.articles
          ?.length ??
        output?.articles
          ?.length ??
        0,
    }
  );

  return {
    handled:
      true,

    result:
      output,

    callId,

    name:
      normalizedName,
  };
}
