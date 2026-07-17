import {
  getExecutiveVoiceToolDefinitions,
  handleRealtimeExecutiveVoiceToolCall,
} from "./executiveVoiceToolsApi";

const DEFAULT_INSTRUCTIONS =
  "Use VoterSpheres live-data tools whenever the user asks for current, latest, " +
  "today, breaking, articles, polling, campaign finance, FEC, state, county, parish, " +
  "candidate, task, alert, readiness, or executive intelligence. " +
  "For any request about current or recent information concerning a named political " +
  "candidate, use get_candidate_live_intelligence rather than get_candidate_statistics. " +
  "Never invent current figures. Always state source freshness, publication date, field " +
  "dates, filing period, or reporting period. Clearly distinguish observed facts, official " +
  "filings, individual polls, aggregates, and modeled VoterSpheres estimates.";

const TOOL_TIMEOUT_MS =
  Number(
    import.meta.env
      ?.VITE_EXECUTIVE_VOICE_TOOL_TIMEOUT_MS
  ) || 30000;

const MAX_ARTICLES =
  8;

const MAX_POLLS =
  5;

const MAX_FINANCE_RECORDS =
  5;

const MAX_PROFILE_MATCHES =
  3;

const MAX_WARNINGS =
  8;

const MAX_SUMMARY_LENGTH =
  700;

const MAX_ARTICLE_SUMMARY_LENGTH =
  650;

function parseEvent(
  rawEvent
) {
  if (!rawEvent) {
    return null;
  }

  if (
    typeof rawEvent ===
    "string"
  ) {
    try {
      return JSON.parse(
        rawEvent
      );
    } catch {
      return null;
    }
  }

  if (
    rawEvent?.data &&
    typeof rawEvent.data ===
      "string"
  ) {
    try {
      return JSON.parse(
        rawEvent.data
      );
    } catch {
      return null;
    }
  }

  if (
    typeof rawEvent ===
    "object"
  ) {
    return rawEvent;
  }

  return null;
}

function safeJsonParse(
  value
) {
  if (
    value &&
    typeof value ===
      "object"
  ) {
    return value;
  }

  try {
    return JSON.parse(
      value || "{}"
    );
  } catch {
    return {};
  }
}

function clean(
  value = ""
) {
  return String(
    value ?? ""
  ).trim();
}

function truncate(
  value,
  maxLength
) {
  const text =
    clean(
      value
    );

  if (
    text.length <=
    maxLength
  ) {
    return text;
  }

  return (
    text.slice(
      0,
      Math.max(
        0,
        maxLength - 1
      )
    ) + "…"
  );
}

function normalizeFunctionCall(
  event
) {
  if (!event) {
    return null;
  }

  /*
   * Current Realtime function-call completion event.
   */
  if (
    event.type ===
    "response.function_call_arguments.done"
  ) {
    return {
      name:
        clean(
          event.name
        ),

      arguments:
        event.arguments ||
        "{}",

      callId:
        clean(
          event.call_id ||
          event.item_id
        ),

      item: {
        type:
          "function_call",

        name:
          event.name,

        arguments:
          event.arguments,

        call_id:
          event.call_id,

        id:
          event.item_id,
      },

      sourceEvent:
        event.type,
    };
  }

  /*
   * Output-item event formats.
   */
  const item =
    event.item ||
    event.output_item ||
    event.response?.output?.find?.(
      (candidate) =>
        candidate?.type ===
        "function_call"
    ) ||
    null;

  if (
    !item ||
    item.type !==
      "function_call"
  ) {
    return null;
  }

  return {
    name:
      clean(
        item.name ||
        event.name
      ),

    arguments:
      item.arguments ||
      event.arguments ||
      "{}",

    callId:
      clean(
        item.call_id ||
        event.call_id ||
        item.id
      ),

    item,

    sourceEvent:
      event.type,
  };
}

function compactArticle(
  article = {}
) {
  return {
    title:
      truncate(
        article.title,
        300
      ),

    publisher:
      clean(
        article.publisher
      ) ||
      null,

    published_at:
      article.published_at ||
      null,

    freshness:
      article.freshness ||
      null,

    url:
      article.url ||
      article.source_url ||
      null,

    summary:
      truncate(
        article.summary ||
        article.description,
        MAX_ARTICLE_SUMMARY_LENGTH
      ),

    provider:
      article.provider ||
      article.source_type ||
      null,

    candidate_relevance:
      article.candidate_relevance ??
      null,
  };
}

function compactPoll(
  poll = {}
) {
  return {
    pollster:
      poll.pollster ||
      poll.organization ||
      poll.source_name ||
      null,

    candidate_name:
      poll.candidate_name ||
      null,

    state:
      poll.state ||
      null,

    office:
      poll.office ||
      null,

    locality:
      poll.locality ||
      poll.district ||
      null,

    percentage:
      poll.percentage ??
      poll.support ??
      poll.poll_percentage ??
      null,

    candidate_results:
      poll.candidate_results ||
      poll.results ||
      null,

    field_start:
      poll.field_start ||
      poll.start_date ||
      null,

    field_end:
      poll.field_end ||
      poll.end_date ||
      null,

    published_at:
      poll.published_at ||
      null,

    sample_size:
      poll.sample_size ||
      poll.sample ||
      null,

    population:
      poll.population ||
      poll.sample_type ||
      null,

    margin_of_error:
      poll.margin_of_error ||
      poll.moe ||
      null,

    source_url:
      poll.source_url ||
      poll.url ||
      null,
  };
}

function compactFinanceRecord(
  record = {}
) {
  return {
    candidate_name:
      record.candidate_name ||
      record.name ||
      null,

    candidate_id:
      record.candidate_id ||
      null,

    committee_id:
      record.committee_id ||
      null,

    cycle:
      record.cycle ||
      record.election_cycle ||
      null,

    total_receipts:
      record.total_receipts ??
      record.receipts ??
      null,

    total_disbursements:
      record.total_disbursements ??
      record.disbursements ??
      null,

    cash_on_hand:
      record.cash_on_hand ??
      record.cash_on_hand_end_period ??
      null,

    debts:
      record.debts ??
      record.debts_owed_by_committee ??
      null,

    coverage_through_date:
      record.coverage_through_date ||
      record.coverage_end_date ||
      record.source_updated_at ||
      null,

    source_url:
      record.source_url ||
      null,
  };
}

function compactSource(
  source = {}
) {
  return {
    source:
      source.source ||
      source.name ||
      null,

    provider:
      source.provider ||
      null,

    source_url:
      source.source_url ||
      source.url ||
      null,

    published_at:
      source.published_at ||
      null,

    reporting_period:
      source.reporting_period ||
      null,

    freshness:
      source.freshness ||
      null,

    confidence:
      source.confidence ??
      null,

    latency_ms:
      source.latency_ms ??
      null,
  };
}

function compactDiagnostic(
  diagnostic = {}
) {
  return {
    provider:
      diagnostic.provider ||
      null,

    ok:
      Boolean(
        diagnostic.ok
      ),

    latency_ms:
      diagnostic.latency_ms ??
      null,

    item_count:
      diagnostic.item_count ??
      null,

    timed_out:
      Boolean(
        diagnostic.timed_out
      ),

    cached:
      Boolean(
        diagnostic.cached
      ),

    error:
      truncate(
        diagnostic.error,
        400
      ) ||
      null,
  };
}

function compactCandidateData(
  data = {}
) {
  const candidate =
    data.candidate ||
    {};

  const news =
    data.news ||
    {};

  const polling =
    data.polling ||
    {};

  const finance =
    data.finance ||
    {};

  return {
    candidate: {
      requested_name:
        candidate.requested_name ||
        null,

      resolved_name:
        candidate.resolved_name ||
        null,

      candidate_id:
        candidate.candidate_id ||
        null,

      fec_candidate_id:
        candidate.fec_candidate_id ||
        null,

      committee_id:
        candidate.committee_id ||
        null,

      state:
        candidate.state ||
        null,

      office:
        candidate.office ||
        null,

      locality:
        candidate.locality ||
        null,

      cycle:
        candidate.cycle ||
        null,

      profile:
        candidate.profile
          ? {
              id:
                candidate.profile.id ||
                null,

              name:
                candidate.profile.name ||
                null,

              first_name:
                candidate.profile.first_name ||
                null,

              last_name:
                candidate.profile.last_name ||
                null,

              party:
                candidate.profile.party ||
                null,

              state:
                candidate.profile.state ||
                null,

              office:
                candidate.profile.office ||
                null,

              district:
                candidate.profile.district ||
                null,

              cycle:
                candidate.profile.cycle ||
                candidate.profile.election_year ||
                null,

              updated_at:
                candidate.profile.updated_at ||
                null,
            }
          : null,

      profile_matches:
        (
          candidate.profile_matches ||
          []
        )
          .slice(
            0,
            MAX_PROFILE_MATCHES
          )
          .map(
            (profile) => ({
              id:
                profile.id ||
                null,

              name:
                profile.name ||
                [
                  profile.first_name,
                  profile.last_name,
                ]
                  .filter(Boolean)
                  .join(" ") ||
                null,

              party:
                profile.party ||
                null,

              state:
                profile.state ||
                null,

              office:
                profile.office ||
                null,

              cycle:
                profile.cycle ||
                profile.election_year ||
                null,
            })
          ),
    },

    news: {
      articles:
        (
          news.articles ||
          []
        )
          .slice(
            0,
            MAX_ARTICLES
          )
          .map(
            compactArticle
          ),

      live_article_count:
        news.live_article_count ??
        null,

      local_article_count:
        news.local_article_count ??
        null,

      latest_published_at:
        news.latest_published_at ||
        null,

      successful_providers:
        news.successful_providers ||
        [],

      attempted_providers:
        news.attempted_providers ||
        [],
    },

    polling: {
      polls:
        (
          polling.polls ||
          []
        )
          .slice(
            0,
            MAX_POLLS
          )
          .map(
            compactPoll
          ),

      latest_field_end:
        polling.latest_field_end ||
        null,

      provider_priority:
        polling.provider_priority ||
        null,
    },

    finance: {
      records:
        (
          finance.records ||
          []
        )
          .slice(
            0,
            MAX_FINANCE_RECORDS
          )
          .map(
            compactFinanceRecord
          ),

      latest_reporting_period:
        finance.latest_reporting_period ||
        null,

      provider_priority:
        finance.provider_priority ||
        null,
    },
  };
}

function compactGenericData(
  data
) {
  if (
    !data ||
    typeof data !==
      "object"
  ) {
    return data;
  }

  if (
    data.candidate &&
    (
      data.news ||
      data.polling ||
      data.finance
    )
  ) {
    return compactCandidateData(
      data
    );
  }

  if (
    Array.isArray(
      data.articles
    )
  ) {
    return {
      ...data,

      articles:
        data.articles
          .slice(
            0,
            MAX_ARTICLES
          )
          .map(
            compactArticle
          ),
    };
  }

  if (
    Array.isArray(
      data.polls
    )
  ) {
    return {
      ...data,

      polls:
        data.polls
          .slice(
            0,
            MAX_POLLS
          )
          .map(
            compactPoll
          ),
    };
  }

  if (
    Array.isArray(
      data.records
    )
  ) {
    return {
      ...data,

      records:
        data.records
          .slice(
            0,
            MAX_FINANCE_RECORDS
          )
          .map(
            compactFinanceRecord
          ),
    };
  }

  return data;
}

function compactToolResult(
  result = {},
  toolName = ""
) {
  return {
    ok:
      Boolean(
        result.ok
      ),

    tool:
      result.tool ||
      toolName ||
      null,

    summary:
      truncate(
        result.summary,
        MAX_SUMMARY_LENGTH
      ),

    data:
      compactGenericData(
        result.data
      ),

    sources:
      (
        result.sources ||
        []
      )
        .slice(
          0,
          20
        )
        .map(
          compactSource
        ),

    warnings:
      (
        result.warnings ||
        []
      )
        .slice(
          0,
          MAX_WARNINGS
        )
        .map(
          (warning) =>
            truncate(
              warning,
              500
            )
        ),

    diagnostics:
      (
        result.diagnostics ||
        []
      )
        .slice(
          0,
          12
        )
        .map(
          compactDiagnostic
        ),

    degraded:
      Boolean(
        result.degraded
      ),

    cached:
      Boolean(
        result.cached
      ),

    stale:
      Boolean(
        result.stale
      ),

    generated_at:
      result.generated_at ||
      new Date().toISOString(),
  };
}

function extractResultFromCapturedEvents(
  events = []
) {
  for (
    let index =
      events.length - 1;
    index >= 0;
    index -= 1
  ) {
    const event =
      events[index];

    if (
      event?.type !==
      "conversation.item.create" ||
      event?.item?.type !==
      "function_call_output"
    ) {
      continue;
    }

    return safeJsonParse(
      event.item.output
    );
  }

  return null;
}

function withTimeout(
  promise,
  timeoutMs,
  label
) {
  let timer;

  const timeoutPromise =
    new Promise(
      (
        _resolve,
        reject
      ) => {
        timer =
          window.setTimeout(
            () => {
              reject(
                new Error(
                  `${label} timed out after ${timeoutMs}ms.`
                )
              );
            },
            timeoutMs
          );
      }
    );

  return Promise.race([
    promise,
    timeoutPromise,
  ]).finally(
    () => {
      window.clearTimeout(
        timer
      );
    }
  );
}

export function createExecutiveVoiceLiveToolsBridge({
  sendEvent,
  onStatus,
  onToolStarted,
  onToolCompleted,
  onToolError,
  instructions =
    DEFAULT_INSTRUCTIONS,
} = {}) {
  if (
    typeof sendEvent !==
    "function"
  ) {
    throw new Error(
      "createExecutiveVoiceLiveToolsBridge requires a sendEvent function."
    );
  }

  let registered =
    false;

  let registeringPromise =
    null;

  const activeCalls =
    new Set();

  /*
   * Keep completed calls for the duration of this session.
   * Realtime may emit both arguments.done and output_item.done.
   */
  const completedCalls =
    new Set();

  function setStatus(
    status,
    detail = null
  ) {
    onStatus?.({
      status,
      detail,
    });
  }

  function sendRequiredEvent(
    event,
    label
  ) {
    const sent =
      sendEvent(
        event
      );

    if (
      sent === false
    ) {
      throw new Error(
        `Realtime data channel rejected ${label}.`
      );
    }

    return sent;
  }

  async function registerTools({
    force = false,
  } = {}) {
    if (
      registered &&
      !force
    ) {
      return {
        ok:
          true,

        already_registered:
          true,
      };
    }

    if (
      registeringPromise
    ) {
      return registeringPromise;
    }

    registeringPromise =
      (async () => {
        try {
          setStatus(
            "registering"
          );

          const response =
            await getExecutiveVoiceToolDefinitions();

          const tools =
            Array.isArray(
              response?.tools
            )
              ? response.tools
              : [];

          if (
            !tools.length
          ) {
            throw new Error(
              "The Executive Voice tool definition endpoint returned no tools."
            );
          }

          sendRequiredEvent(
            {
              type:
                "session.update",

              session: {
                type:
                  "realtime",

                tools,

                tool_choice:
                  "auto",

                instructions,
              },
            },
            "session tool registration"
          );

          registered =
            true;

          setStatus(
            "ready",
            {
              tool_count:
                tools.length,
            }
          );

          return {
            ok:
              true,

            already_registered:
              false,

            tool_count:
              tools.length,

            tools,
          };
        } catch (
          error
        ) {
          registered =
            false;

          setStatus(
            "error",
            error.message
          );

          throw error;
        } finally {
          registeringPromise =
            null;
        }
      })();

    return registeringPromise;
  }

  async function executeCall(
    call
  ) {
    const capturedEvents =
      [];

    /*
     * Capture anything the older API helper tries to send.
     * The bridge will send one controlled output itself,
     * preventing duplicate function outputs and ensuring
     * response.create always follows.
     */
    const captureSendEvent =
      (event) => {
        capturedEvents.push(
          event
        );

        return true;
      };

    const handled =
      await withTimeout(
        handleRealtimeExecutiveVoiceToolCall({
          name:
            call.name,

          arguments:
            call.arguments,

          callId:
            call.callId,

          sendEvent:
            captureSendEvent,
        }),
        TOOL_TIMEOUT_MS,
        `Executive Voice tool ${call.name}`
      );

    if (
      !handled?.handled
    ) {
      return {
        handled:
          false,

        result:
          null,
      };
    }

    const result =
      handled.result ||
      extractResultFromCapturedEvents(
        capturedEvents
      ) ||
      {
        ok:
          false,

        tool:
          call.name,

        summary:
          "The tool completed without returning a readable result.",

        degraded:
          true,

        generated_at:
          new Date().toISOString(),
      };

    return {
      handled:
        true,

      result,
    };
  }

  async function handleServerEvent(
    rawEvent
  ) {
    const event =
      parseEvent(
        rawEvent
      );

    if (!event) {
      return {
        handled:
          false,

        reason:
          "invalid-event",
      };
    }

    if (
      event.type ===
      "session.created"
    ) {
      await registerTools();

      return {
        handled:
          true,

        reason:
          "session-created",
      };
    }

    const supportedEvents = [
      "response.function_call_arguments.done",
      "response.output_item.done",
      "response.output_item.added",
    ];

    if (
      !supportedEvents.includes(
        event.type
      )
    ) {
      return {
        handled:
          false,

        event,
      };
    }

    const call =
      normalizeFunctionCall(
        event
      );

    if (
      !call?.name ||
      !call?.callId
    ) {
      return {
        handled:
          false,

        reason:
          "missing-function-call-data",

        event,
      };
    }

    if (
      completedCalls.has(
        call.callId
      )
    ) {
      return {
        handled:
          true,

        reason:
          "completed-function-call-duplicate",

        call,
      };
    }

    if (
      activeCalls.has(
        call.callId
      )
    ) {
      return {
        handled:
          true,

        reason:
          "active-function-call-duplicate",

        call,
      };
    }

    activeCalls.add(
      call.callId
    );

    try {
      setStatus(
        "tool-running",
        {
          name:
            call.name,

          call_id:
            call.callId,

          source_event:
            call.sourceEvent,
        }
      );

      onToolStarted?.(
        call
      );

      const execution =
        await executeCall(
          call
        );

      if (
        !execution.handled
      ) {
        return {
          handled:
            false,

          reason:
            "unregistered-tool",

          call,
        };
      }

      const compactResult =
        compactToolResult(
          execution.result,
          call.name
        );

      const output =
        JSON.stringify(
          compactResult
        );

      sendRequiredEvent(
        {
          type:
            "conversation.item.create",

          item: {
            type:
              "function_call_output",

            call_id:
              call.callId,

            output,
          },
        },
        "function-call output"
      );

      /*
       * This is mandatory. Adding the output item alone
       * does not ask the model to continue its response.
       */
      sendRequiredEvent(
        {
          type:
            "response.create",

          response: {
            instructions:
              "Use the completed VoterSpheres live-data tool output to answer the user's request now. " +
              "Lead with the newest verified information. Include publication dates, field dates, " +
              "or reporting periods where available. Identify the successful data providers. " +
              "If the result is degraded, cached, stale, or empty, say so clearly. " +
              "Do not claim that a search is still running. Do not invent missing facts.",
          },
        },
        "post-tool response creation"
      );

      completedCalls.add(
        call.callId
      );

      onToolCompleted?.({
        ...call,

        result:
          compactResult,
      });

      setStatus(
        "ready",
        {
          last_tool:
            call.name,

          call_id:
            call.callId,

          output_bytes:
            output.length,

          result_ok:
            compactResult.ok,
        }
      );

      return {
        handled:
          true,

        reason:
          "tool-completed",

        call,

        result:
          compactResult,
      };
    } catch (
      error
    ) {
      const errorOutput = {
        ok:
          false,

        tool:
          call.name,

        summary:
          "The live-data tool could not complete.",

        error:
          error?.message ||
          "Live-data tool execution failed.",

        degraded:
          true,

        generated_at:
          new Date().toISOString(),
      };

      try {
        sendRequiredEvent(
          {
            type:
              "conversation.item.create",

            item: {
              type:
                "function_call_output",

              call_id:
                call.callId,

              output:
                JSON.stringify(
                  errorOutput
                ),
            },
          },
          "tool-error output"
        );

        sendRequiredEvent(
          {
            type:
              "response.create",

            response: {
              instructions:
                "Explain that the requested live-data source could not be completed. " +
                "State the unavailable tool and the error briefly. Do not invent facts or figures. " +
                "Use only verified information already available in the conversation.",
            },
          },
          "tool-error response creation"
        );

        completedCalls.add(
          call.callId
        );
      } catch (
        sendError
      ) {
        console.error(
          "[Executive Voice] Failed to return tool error to Realtime:",
          sendError
        );
      }

      onToolError?.({
        ...call,
        error,
      });

      setStatus(
        "degraded",
        {
          name:
            call.name,

          call_id:
            call.callId,

          error:
            error?.message ||
            "Tool execution failed.",
        }
      );

      return {
        handled:
          true,

        reason:
          "tool-error",

        call,
        error,
      };
    } finally {
      activeCalls.delete(
        call.callId
      );
    }
  }

  function reset() {
    registered =
      false;

    registeringPromise =
      null;

    activeCalls.clear();
    completedCalls.clear();

    setStatus(
      "idle"
    );
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

    get completedCallCount() {
      return completedCalls.size;
    },
  };
}

export default createExecutiveVoiceLiveToolsBridge;
