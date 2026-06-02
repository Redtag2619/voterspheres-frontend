import { useEffect, useMemo, useRef, useState } from "react";
import { onRealtimeEvent, subscribeRealtimeScope } from "../services/realtimeClient";

const DEFAULT_TYPES = [
  "county.escalation.created",
  "county.escalation.resolved",
  "task.created",
  "task.updated",
  "task.completed",
  "workspace.pressure.changed",
  "state.heat.updated",
  "vendor.gap.detected",
  "mailops.risk.detected",
  "executive.alert.created",
  "realtime.test",
];

export function useRealtimeTacticalEvents({
  workspaceId = "",
  firmId = "",
  state = "",
  types = DEFAULT_TYPES,
  onEvent,
  onRefresh,
  refreshDelay = 450,
} = {}) {
  const [lastEvent, setLastEvent] = useState(null);
  const [eventCount, setEventCount] = useState(0);
  const timerRef = useRef(null);

  const typeSet = useMemo(() => new Set(types || DEFAULT_TYPES), [types]);

  useEffect(() => {
    const unsubscribeScope = subscribeRealtimeScope({
      workspace_id: workspaceId,
      firm_id: firmId,
      state,
    });

    const unsubscribeEvents = onRealtimeEvent((event) => {
      if (typeSet.size && !typeSet.has(event.type)) return;

      const eventWorkspace = event.workspace_id || event.payload?.workspace_id;
      const eventState = event.state || event.payload?.state;

      if (workspaceId && eventWorkspace && String(eventWorkspace) !== String(workspaceId)) return;
      if (state && eventState && String(eventState).toUpperCase() !== String(state).toUpperCase()) return;

      setLastEvent(event);
      setEventCount((count) => count + 1);

      onEvent?.(event);

      if (onRefresh) {
        window.clearTimeout(timerRef.current);
        timerRef.current = window.setTimeout(() => {
          onRefresh(event);
        }, refreshDelay);
      }
    });

    return () => {
      unsubscribeEvents?.();
      unsubscribeScope?.();
      window.clearTimeout(timerRef.current);
    };
  }, [workspaceId, firmId, state, typeSet, onEvent, onRefresh, refreshDelay]);

  return {
    lastEvent,
    eventCount,
    hasRealtimeEvents: eventCount > 0,
  };
}
