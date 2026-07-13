import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useWorkspace } from "./WorkspaceContext";
import { useExecutiveFilters } from "./ExecutiveFiltersContext"; 

import {
  createUnifiedExecutiveAction,
  fetchUnifiedExecutiveIntelligence,
  refreshUnifiedExecutiveIntelligence,
} from "../services/unifiedExecutiveIntelligenceApi";

import {
  EXECUTIVE_INTELLIGENCE_EVENTS,
  publishExecutiveIntelligenceEvent,
  subscribeExecutiveIntelligenceEvents,
} from "../lib/executiveIntelligenceBus";

const UnifiedExecutiveIntelligenceContext = createContext(null);

const CACHE_KEY = "vs_unified_executive_intelligence_cache";
const DEFAULT_REFRESH_INTERVAL_MS = 30000;
const DEFAULT_STALE_AFTER_MS = 90000;

const EMPTY_DATA = {
  health: {},
  briefing: {},
  kpis: {},
  summary: {},
  workspaces: [],
  urgent_workspaces: [],
  tasks: [],
  signals: [],
  alerts: [],
  recommendations: [],
  missions: [],
  activity: [],
  source_status: [],
};

function readCache() {
  if (typeof window === "undefined") return null;

  try {
    const parsed = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");

    if (!parsed?.data || !parsed?.stored_at) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function writeCache(data, storedAt) {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        data,
        stored_at: storedAt,
      })
    );
  } catch {
    // Ignore storage quota and restricted-browser failures.
  }
}

function normalizeData(result = {}) {
  return {
    ...EMPTY_DATA,
    ...result,
    health: result?.health || {},
    briefing: result?.briefing || {},
    kpis: result?.kpis || {},
    summary: result?.summary || {},
    workspaces: Array.isArray(result?.workspaces) ? result.workspaces : [],
    urgent_workspaces: Array.isArray(result?.urgent_workspaces)
      ? result.urgent_workspaces
      : [],
    tasks: Array.isArray(result?.tasks) ? result.tasks : [],
    signals: Array.isArray(result?.signals) ? result.signals : [],
    alerts: Array.isArray(result?.alerts) ? result.alerts : [],
    recommendations: Array.isArray(result?.recommendations)
      ? result.recommendations
      : [],
    missions: Array.isArray(result?.missions) ? result.missions : [],
    activity: Array.isArray(result?.activity) ? result.activity : [],
    source_status: Array.isArray(result?.source_status)
      ? result.source_status
      : [],
  };
}

export function UnifiedExecutiveIntelligenceProvider({
  children,
  refreshIntervalMs = DEFAULT_REFRESH_INTERVAL_MS,
  staleAfterMs = DEFAULT_STALE_AFTER_MS,
}) {
  const { activeWorkspaceId, loadingWorkspaces } = useWorkspace();
  const { filters } = useExecutiveFilters();

  const cached = useMemo(() => readCache(), []);

  const [data, setData] = useState(() =>
    cached?.data ? normalizeData(cached.data) : EMPTY_DATA
  );
  const [loading, setLoading] = useState(() => !cached?.data);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(
    () => cached?.stored_at || ""
  );
  const [connectionState, setConnectionState] = useState(() =>
    typeof navigator === "undefined" || navigator.onLine ? "online" : "offline"
  );
  const [lastRefreshReason, setLastRefreshReason] = useState(
    cached?.data ? "cache-restored" : "initial-load"
  );
  const [clock, setClock] = useState(Date.now());

  const mountedRef = useRef(true);
  const activeRequestRef = useRef(null);
  const lastRequestKeyRef = useRef("");
  const invalidatedRef = useRef(false);

  const requestFilters = useMemo(
    () => ({
      workspace_id: activeWorkspaceId || "",
      state: filters?.state || "",
      office: filters?.office || "",
      risk: filters?.risk || "",
    }),
    [
      activeWorkspaceId,
      filters?.state,
      filters?.office,
      filters?.risk,
    ]
  );

  const requestKey = useMemo(
    () => JSON.stringify(requestFilters),
    [requestFilters]
  );

  const dataAgeMs = useMemo(() => {
    if (!lastUpdated) return Number.POSITIVE_INFINITY;

    const stamp = new Date(lastUpdated).getTime();

    return Number.isFinite(stamp)
      ? Math.max(0, clock - stamp)
      : Number.POSITIVE_INFINITY;
  }, [clock, lastUpdated]);

  const isStale = dataAgeMs > staleAfterMs;
  const isLive = connectionState === "online" && !isStale && !error;

  const load = useCallback(
    async ({
      quiet = false,
      force = false,
      reason = "manual",
      broadcast = true,
    } = {}) => {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        setConnectionState("offline");
        setError("Live intelligence is offline. Cached executive data remains available.");
        return null;
      }

      if (activeRequestRef.current) {
        return activeRequestRef.current;
      }

      const request = (async () => {
        try {
          if (quiet) setRefreshing(true);
          else setLoading(true);

          setConnectionState("syncing");
          setError("");
          setLastRefreshReason(reason);

          if (broadcast) {
            publishExecutiveIntelligenceEvent(
              EXECUTIVE_INTELLIGENCE_EVENTS.REFRESH_STARTED,
              { reason, request_key: requestKey }
            );
          }

          const result = force
            ? await refreshUnifiedExecutiveIntelligence(requestFilters)
            : await fetchUnifiedExecutiveIntelligence(requestFilters);

          if (!mountedRef.current) return result;

          const normalized = normalizeData(result);
          const updatedAt =
            result?.generated_at || new Date().toISOString();

          setData(normalized);
          setLastUpdated(updatedAt);
          setConnectionState("online");
          invalidatedRef.current = false;
          lastRequestKeyRef.current = requestKey;
          writeCache(normalized, updatedAt);

          if (broadcast) {
            publishExecutiveIntelligenceEvent(
              EXECUTIVE_INTELLIGENCE_EVENTS.REFRESH_COMPLETED,
              {
                reason,
                request_key: requestKey,
                generated_at: updatedAt,
                data: normalized,
              }
            );
          }

          return result;
        } catch (loadError) {
          if (!mountedRef.current) return null;

          const message =
            loadError?.response?.data?.error ||
            loadError?.response?.data?.detail ||
            loadError?.message ||
            "Failed to load Unified Executive Intelligence.";

          setError(message);
          setConnectionState(
            typeof navigator !== "undefined" && !navigator.onLine
              ? "offline"
              : "degraded"
          );

          return null;
        } finally {
          if (mountedRef.current) {
            setLoading(false);
            setRefreshing(false);
          }

          activeRequestRef.current = null;
        }
      })();

      activeRequestRef.current = request;
      return request;
    },
    [requestFilters, requestKey]
  );

  const invalidate = useCallback(
    (reason = "platform-change") => {
      invalidatedRef.current = true;

      publishExecutiveIntelligenceEvent(
        EXECUTIVE_INTELLIGENCE_EVENTS.INVALIDATE,
        {
          reason,
          request_key: requestKey,
        }
      );

      if (
        typeof document !== "undefined" &&
        document.visibilityState === "visible"
      ) {
        load({
          quiet: true,
          force: true,
          reason,
          broadcast: false,
        });
      }
    },
    [load, requestKey]
  );

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setClock(Date.now());
    }, 10000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (loadingWorkspaces) return;

    const filterChanged = lastRequestKeyRef.current !== requestKey;

    load({
      quiet: Boolean(data?.generated_at || lastUpdated),
      force: filterChanged,
      reason: filterChanged ? "scope-changed" : "provider-mounted",
    });
  }, [
    data?.generated_at,
    lastUpdated,
    load,
    loadingWorkspaces,
    requestKey,
  ]);

  useEffect(() => {
    if (!refreshIntervalMs || refreshIntervalMs < 10000) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      if (
        document.visibilityState === "visible" &&
        navigator.onLine
      ) {
        load({
          quiet: true,
          force: invalidatedRef.current || isStale,
          reason: invalidatedRef.current
            ? "invalidated"
            : isStale
              ? "stale-data"
              : "scheduled-refresh",
        });
      }
    }, refreshIntervalMs);

    return () => window.clearInterval(timer);
  }, [isStale, load, refreshIntervalMs]);

  useEffect(() => {
    function handleVisibility() {
      if (
        document.visibilityState === "visible" &&
        navigator.onLine &&
        (isStale || invalidatedRef.current)
      ) {
        load({
          quiet: true,
          force: true,
          reason: "tab-visible",
        });
      }
    }

    function handleFocus() {
      if (navigator.onLine && (isStale || invalidatedRef.current)) {
        load({
          quiet: true,
          force: true,
          reason: "window-focus",
        });
      }
    }

    function handleOnline() {
      setConnectionState("online");
      load({
        quiet: true,
        force: true,
        reason: "network-restored",
      });
    }

    function handleOffline() {
      setConnectionState("offline");
    }

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [isStale, load]);

  useEffect(() => {
    return subscribeExecutiveIntelligenceEvents((event) => {
      if (!event?.type) return;

      if (
        event.type === EXECUTIVE_INTELLIGENCE_EVENTS.REFRESH_COMPLETED &&
        event.payload?.data
      ) {
        const normalized = normalizeData(event.payload.data);
        const updatedAt =
          event.payload.generated_at || new Date().toISOString();

        setData(normalized);
        setLastUpdated(updatedAt);
        setConnectionState("online");
        setError("");
        writeCache(normalized, updatedAt);
        return;
      }

      if (
        event.type === EXECUTIVE_INTELLIGENCE_EVENTS.INVALIDATE ||
        event.type === EXECUTIVE_INTELLIGENCE_EVENTS.ACTION_CREATED ||
        event.type === EXECUTIVE_INTELLIGENCE_EVENTS.WORKSPACE_CHANGED ||
        event.type === EXECUTIVE_INTELLIGENCE_EVENTS.FILTERS_CHANGED
      ) {
        invalidatedRef.current = true;

        if (
          document.visibilityState === "visible" &&
          navigator.onLine
        ) {
          load({
            quiet: true,
            force: true,
            reason: event.payload?.reason || event.type,
            broadcast: false,
          });
        }
      }
    });
  }, [load]);

  useEffect(() => {
    function handleWorkspaceChange(event) {
      publishExecutiveIntelligenceEvent(
        EXECUTIVE_INTELLIGENCE_EVENTS.WORKSPACE_CHANGED,
        {
          workspace_id: event?.detail?.workspace_id || "",
          reason: "workspace-changed",
        }
      );
    }

    window.addEventListener(
      "voterspheres:workspace-changed",
      handleWorkspaceChange
    );

    return () => {
      window.removeEventListener(
        "voterspheres:workspace-changed",
        handleWorkspaceChange
      );
    };
  }, []);

  useEffect(() => {
    publishExecutiveIntelligenceEvent(
      EXECUTIVE_INTELLIGENCE_EVENTS.FILTERS_CHANGED,
      {
        filters: requestFilters,
        reason: "filters-changed",
      }
    );
  }, [requestFilters]);

  const createAction = useCallback(
    async (payload) => {
      const result = await createUnifiedExecutiveAction({
        workspace_id:
          payload?.workspace_id || activeWorkspaceId || null,
        ...payload,
      });

      publishExecutiveIntelligenceEvent(
        EXECUTIVE_INTELLIGENCE_EVENTS.ACTION_CREATED,
        {
          task: result?.task || null,
          reason: "executive-action-created",
        }
      );

      await load({
        quiet: true,
        force: true,
        reason: "executive-action-created",
      });

      return result;
    },
    [activeWorkspaceId, load]
  );

  const value = useMemo(
    () => ({
      data,
      overview: data,
      health: data.health || {},
      briefing: data.briefing || {},
      kpis: data.kpis || {},
      summary: data.summary || {},
      workspaces: data.workspaces || [],
      urgentWorkspaces: data.urgent_workspaces || [],
      tasks: data.tasks || [],
      signals: data.signals || [],
      alerts: data.alerts || [],
      recommendations: data.recommendations || [],
      missions: data.missions || [],
      activity: data.activity || [],
      sourceStatus: data.source_status || [],
      loading,
      refreshing,
      error,
      lastUpdated,
      lastRefreshReason,
      connectionState,
      dataAgeMs,
      isStale,
      isLive,
      filters: requestFilters,
      refresh: () =>
        load({
          quiet: true,
          force: true,
          reason: "manual-refresh",
        }),
      reload: () =>
        load({
          reason: "manual-reload",
        }),
      invalidate,
      createAction,
    }),
    [
      data,
      loading,
      refreshing,
      error,
      lastUpdated,
      lastRefreshReason,
      connectionState,
      dataAgeMs,
      isStale,
      isLive,
      requestFilters,
      load,
      invalidate,
      createAction,
    ]
  );

  return (
    <UnifiedExecutiveIntelligenceContext.Provider value={value}>
      {children}
    </UnifiedExecutiveIntelligenceContext.Provider>
  );
}

export function useUnifiedExecutiveIntelligence() {
  const context = useContext(UnifiedExecutiveIntelligenceContext);

  if (!context) {
    throw new Error(
      "useUnifiedExecutiveIntelligence must be used within UnifiedExecutiveIntelligenceProvider"
    );
  }

  return context;
}
