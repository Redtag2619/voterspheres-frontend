import {

  useCallback,

  useEffect,

  useMemo,

  useRef,

  useState,

} from "react";

 

import createExecutiveVoiceLiveToolsBridge from "../services/executiveVoiceRealtimeToolsBridge";

 

export function useExecutiveVoiceLiveTools({

  sendEvent,

  autoRegister = false,

  sessionReady = false,

} = {}) {

  const [status, setStatus] = useState("idle");

  const [statusDetail, setStatusDetail] = useState(null);

  const [lastTool, setLastTool] = useState(null);

  const [lastResult, setLastResult] = useState(null);

  const [error, setError] = useState("");

 

  const sendEventRef = useRef(sendEvent);

  sendEventRef.current = sendEvent;

 

  const stableSendEvent = useCallback((event) => {

    if (typeof sendEventRef.current !== "function") {

      throw new Error("Realtime sendEvent is not available.");

    }

 

    return sendEventRef.current(event);

  }, []);

 

  const bridge = useMemo(

    () =>

      createExecutiveVoiceLiveToolsBridge({

        sendEvent: stableSendEvent,

        onStatus: ({ status: nextStatus, detail }) => {

          setStatus(nextStatus);

          setStatusDetail(detail || null);

 

          if (!["error", "degraded"].includes(nextStatus)) {

            setError("");

          }

        },

        onToolStarted: (call) => {

          setLastTool({

            name: call.name,

            call_id: call.callId,

            status: "running",

          });

        },

        onToolCompleted: ({ name, callId, result }) => {

          setLastTool({

            name,

            call_id: callId,

            status: "complete",

          });

          setLastResult(result || null);

        },

        onToolError: ({ name, callId, error: toolError }) => {

          setLastTool({

            name,

            call_id: callId,

            status: "error",

          });

          setError(toolError?.message || "Live tool execution failed.");

        },

      }),

    [stableSendEvent]

  );

 

  useEffect(() => {

    if (!autoRegister || !sessionReady || typeof sendEvent !== "function") {

      return undefined;

    }

 

    let active = true;

 

    bridge.registerTools().catch((registerError) => {

      if (!active) return;

      setError(

        registerError?.message ||

          "Executive Voice live tools could not be registered."

      );

    });

 

    return () => {

      active = false;

    };

  }, [autoRegister, bridge, sendEvent, sessionReady]);

 

  const registerTools = useCallback(

    async (options) => {

      try {

        setError("");

        return await bridge.registerTools(options);

      } catch (registerError) {

        setError(

          registerError?.message ||

            "Executive Voice live tools could not be registered."

        );

        throw registerError;

      }

    },

    [bridge]

  );

 

  const handleRealtimeEvent = useCallback(

    async (event) => {

      try {

        return await bridge.handleServerEvent(event);

      } catch (eventError) {

        setError(

          eventError?.message ||

            "Executive Voice live tool event handling failed."

        );

 

        return {

          handled: false,

          error: eventError,

        };

      }

    },

    [bridge]

  );

 

  const reset = useCallback(() => {

    bridge.reset();

    setStatus("idle");

    setStatusDetail(null);

    setLastTool(null);

    setLastResult(null);

    setError("");

  }, [bridge]);

 

  return {

    status,

    statusDetail,

    lastTool,

    lastResult,

    error,

    isReady: status === "ready",

    isRegistering: status === "registering",

    isRunningTool: status === "tool-running",

    isDegraded: status === "degraded" || status === "error",

    registerTools,

    handleRealtimeEvent,

    reset,

  };

}

 

export default useExecutiveVoiceLiveTools;

