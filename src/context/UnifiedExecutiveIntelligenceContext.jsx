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

 

const UnifiedExecutiveIntelligenceContext =

  createContext(null);

 

const CACHE_KEY =

  "vs_unified_executive_intelligence_cache";

 

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

  if (typeof window === "undefined") {

    return null;

  }

 

  try {

    const raw =

      localStorage.getItem(CACHE_KEY);

 

    if (!raw) {

      return null;

    }

 

    const parsed = JSON.parse(raw);

 

    if (

      !parsed ||

      !parsed.data ||

      !parsed.stored_at

    ) {

      return null;

    }

 

    return parsed;

  } catch {

    return null;

  }

}

 

function writeCache(

  data,

  storedAt

) {

  if (typeof window === "undefined") {

    return;

  }

 

  try {

    localStorage.setItem(

      CACHE_KEY,

      JSON.stringify({

        data,

        stored_at: storedAt,

      })

    );

  } catch {

    // Ignore restricted storage or quota errors.

  }

}

 

function normalizeData(

  result = {}

) {

  return {

    ...EMPTY_DATA,

    ...result,

 

    health:

      result?.health || {},

 

    briefing:

      result?.briefing || {},

 

    kpis:

      result?.kpis || {},

 

    summary:

      result?.summary || {},

 

    workspaces:

      Array.isArray(

        result?.workspaces

      )

        ? result.workspaces

        : [],

 

    urgent_workspaces:

      Array.isArray(

        result?.urgent_workspaces

      )

        ? result.urgent_workspaces

        : [],

 

    tasks:

      Array.isArray(

        result?.tasks

      )

        ? result.tasks

        : [],

 

    signals:

      Array.isArray(

        result?.signals

      )

        ? result.signals

        : [],

 

    alerts:

      Array.isArray(

        result?.alerts

      )

        ? result.alerts

        : [],

 

    recommendations:

      Array.isArray(

        result?.recommendations

      )

        ? result.recommendations

        : [],

 

    missions:

      Array.isArray(

        result?.missions

      )

        ? result.missions

        : [],

 

    activity:

      Array.isArray(

        result?.activity

      )

        ? result.activity

        : [],

 

    source_status:

      Array.isArray(

        result?.source_status

      )

        ? result.source_status

        : [],

  };

}

 

 

function normalizeWorkspaceId(value) {

  const cleaned = String(value ?? "").trim();

  return cleaned || null;

}

 

function getInitialConnectionState() {

  if (

    typeof navigator === "undefined"

  ) {

    return "online";

  }

 

  return navigator.onLine

    ? "online"

    : "offline";

}

 

export function UnifiedExecutiveIntelligenceProvider({

  children,

  refreshIntervalMs =

    DEFAULT_REFRESH_INTERVAL_MS,

  staleAfterMs =

    DEFAULT_STALE_AFTER_MS,

}) {

  const {

    activeWorkspaceId,

    loadingWorkspaces,

  } = useWorkspace();

 

  const {

    filters,

  } = useExecutiveFilters();

 

  const cached = useMemo(

    () => readCache(),

    []

  );

 

  const [data, setData] =

    useState(() =>

      cached?.data

        ? normalizeData(

            cached.data

          )

        : EMPTY_DATA

    );

 

  const [loading, setLoading] =

    useState(

      () => !cached?.data

    );

 

  const [

    refreshing,

    setRefreshing,

  ] = useState(false);

 

  const [

    error,

    setError,

  ] = useState("");

 

  const [

    lastUpdated,

    setLastUpdated,

  ] = useState(

    () =>

      cached?.stored_at ||

      ""

  );

 

  const [

    connectionState,

    setConnectionState,

  ] = useState(

    getInitialConnectionState

  );

 

  const [

    lastRefreshReason,

    setLastRefreshReason,

  ] = useState(

    cached?.data

      ? "cache-restored"

      : "initial-load"

  );

 

  const [

    clock,

    setClock,

  ] = useState(

    Date.now()

  );

 

  const mountedRef =

    useRef(true);

 

  const requestPromiseRef =

    useRef(null);

 

  const lastRequestKeyRef =

    useRef("");

 

  const initialLoadCompleteRef =

    useRef(false);

 

  const invalidatedRef =

    useRef(false);

 

  const localInstanceIdRef =

    useRef(

      `${Date.now()}-${Math.random()

        .toString(36)

        .slice(2)}`

    );

 

  const requestFilters =

    useMemo(

      () => ({

        workspace_id:

          activeWorkspaceId ||

          "",

 

        state:

          filters?.state ||

          "",

 

        office:

          filters?.office ||

          "",

 

        risk:

          filters?.risk ||

          "",

      }),

      [

        activeWorkspaceId,

        filters?.state,

        filters?.office,

        filters?.risk,

      ]

    );

 

  const requestKey =

    useMemo(

      () =>

        JSON.stringify(

          requestFilters

        ),

      [requestFilters]

    );

 

  const dataAgeMs =

    useMemo(() => {

      if (!lastUpdated) {

        return Infinity;

      }

 

      const timestamp =

        new Date(

          lastUpdated

        ).getTime();

 

      if (

        !Number.isFinite(

          timestamp

        )

      ) {

        return Infinity;

      }

 

      return Math.max(

        0,

        clock - timestamp

      );

    }, [

      clock,

      lastUpdated,

    ]);

 

  const isStale =

    dataAgeMs >

    staleAfterMs;

 

  const isLive =

    connectionState ===

      "online" &&

    !isStale &&

    !error;

 

  const load =

    useCallback(

      async ({

        quiet = false,

        force = false,

        reason = "manual",

        broadcast = true,

      } = {}) => {

        if (

          typeof navigator !==

            "undefined" &&

          !navigator.onLine

        ) {

          setConnectionState(

            "offline"

          );

 

          setError(

            "Live intelligence is offline. Cached executive data remains available."

          );

 

          setLoading(false);

          setRefreshing(false);

 

          return null;

        }

 

        if (

          requestPromiseRef.current

        ) {

          return requestPromiseRef.current;

        }

 

        const requestPromise =

          (async () => {

            try {

              if (quiet) {

                setRefreshing(

                  true

                );

              } else {

                setLoading(true);

              }

 

              setConnectionState(

                "syncing"

              );

 

              setError("");

 

              setLastRefreshReason(

                reason

              );

 

              if (broadcast) {

                publishExecutiveIntelligenceEvent(

                  EXECUTIVE_INTELLIGENCE_EVENTS.REFRESH_STARTED,

                  {

                    reason,

                    request_key:

                      requestKey,

                    source_instance:

                      localInstanceIdRef.current,

                  }

                );

              }

 

              const result =

                force

                  ? await refreshUnifiedExecutiveIntelligence(

                      requestFilters

                    )

                  : await fetchUnifiedExecutiveIntelligence(

                      requestFilters

                    );

 

              if (

                !mountedRef.current

              ) {

                return result;

              }

 

              const normalized =

                normalizeData(

                  result || {}

                );

 

              const updatedAt =

                result?.generated_at ||

                new Date().toISOString();

 

              setData(

                normalized

              );

 

              setLastUpdated(

                updatedAt

              );

 

              setConnectionState(

                "online"

              );

 

              setError("");

 

              setLoading(false);

              setRefreshing(false);

 

              invalidatedRef.current =

                false;

 

              initialLoadCompleteRef.current =

                true;

 

              lastRequestKeyRef.current =

                requestKey;

 

              writeCache(

                normalized,

                updatedAt

              );

 

              if (broadcast) {

                publishExecutiveIntelligenceEvent(

                  EXECUTIVE_INTELLIGENCE_EVENTS.REFRESH_COMPLETED,

                  {

                    reason,

                    request_key:

                      requestKey,

                    generated_at:

                      updatedAt,

                    data:

                      normalized,

                    source_instance:

                      localInstanceIdRef.current,

                  }

                );

              }

 

              return result;

            } catch (

              loadError

            ) {

              if (

                !mountedRef.current

              ) {

                return null;

              }

 

              const message =

                loadError

                  ?.response

                  ?.data

                  ?.error ||

                loadError

                  ?.response

                  ?.data

                  ?.detail ||

                loadError

                  ?.message ||

                "Failed to load Unified Executive Intelligence.";

 

              setError(

                message

              );

 

              setConnectionState(

                typeof navigator !==

                  "undefined" &&

                  !navigator.onLine

                  ? "offline"

                  : "degraded"

              );

 

              setLoading(false);

              setRefreshing(false);

 

              return null;

            } finally {

              requestPromiseRef.current =

                null;

            }

          })();

 

        requestPromiseRef.current =

          requestPromise;

 

        return requestPromise;

      },

      [

        requestFilters,

        requestKey,

      ]

    );

 

  const refresh =

    useCallback(

      () =>

        load({

          quiet: true,

          force: true,

          reason:

            "manual-refresh",

        }),

      [load]

    );

 

  const reload =

    useCallback(

      () =>

        load({

          quiet: false,

          force: true,

          reason:

            "manual-reload",

        }),

      [load]

    );

 

  const invalidate =

    useCallback(

      (

        reason =

          "platform-change"

      ) => {

        invalidatedRef.current =

          true;

 

        publishExecutiveIntelligenceEvent(

          EXECUTIVE_INTELLIGENCE_EVENTS.INVALIDATE,

          {

            reason,

            request_key:

              requestKey,

            source_instance:

              localInstanceIdRef.current,

          }

        );

 

        if (

          typeof document !==

            "undefined" &&

          document.visibilityState ===

            "visible" &&

          typeof navigator !==

            "undefined" &&

          navigator.onLine

        ) {

          load({

            quiet: true,

            force: true,

            reason,

            broadcast: false,

          });

        }

      },

      [

        load,

        requestKey,

      ]

    );

 

  useEffect(() => {

    mountedRef.current =

      true;

 

    return () => {

      mountedRef.current =

        false;

    };

  }, []);

 

  useEffect(() => {

    const timer =

      window.setInterval(

        () => {

          setClock(

            Date.now()

          );

        },

        10000

      );

 

    return () =>

      window.clearInterval(

        timer

      );

  }, []);

 

  useEffect(() => {

    if (

      loadingWorkspaces

    ) {

      return;

    }

 

    const scopeChanged =

      lastRequestKeyRef.current &&

      lastRequestKeyRef.current !==

        requestKey;

 

    if (

      !initialLoadCompleteRef.current

    ) {

      load({

        quiet:

          Boolean(

            cached?.data

          ),

        force: false,

        reason:

          "provider-mounted",

      });

 

      return;

    }

 

    if (scopeChanged) {

      load({

        quiet: true,

        force: true,

        reason:

          "scope-changed",

      });

    }

  }, [

    cached?.data,

    load,

    loadingWorkspaces,

    requestKey,

  ]);

 

  useEffect(() => {

    if (

      !refreshIntervalMs ||

      refreshIntervalMs <

        10000

    ) {

      return undefined;

    }

 

    const timer =

      window.setInterval(

        () => {

          if (

            document

              .visibilityState !==

              "visible" ||

            !navigator.onLine

          ) {

            return;

          }

 

          load({

            quiet: true,

            force:

              invalidatedRef.current ||

              isStale,

 

            reason:

              invalidatedRef.current

                ? "invalidated"

                : isStale

                  ? "stale-data"

                  : "scheduled-refresh",

          });

        },

        refreshIntervalMs

      );

 

    return () =>

      window.clearInterval(

        timer

      );

  }, [

    isStale,

    load,

    refreshIntervalMs,

  ]);

 

  useEffect(() => {

    function handleVisibility() {

      if (

        document

          .visibilityState ===

          "visible" &&

        navigator.onLine &&

        (

          isStale ||

          invalidatedRef.current

        )

      ) {

        load({

          quiet: true,

          force: true,

          reason:

            "tab-visible",

        });

      }

    }

 

    function handleFocus() {

      if (

        navigator.onLine &&

        (

          isStale ||

          invalidatedRef.current

        )

      ) {

        load({

          quiet: true,

          force: true,

          reason:

            "window-focus",

        });

      }

    }

 

    function handleOnline() {

      setConnectionState(

        "online"

      );

 

      load({

        quiet: true,

        force: true,

        reason:

          "network-restored",

      });

    }

 

    function handleOffline() {

      setConnectionState(

        "offline"

      );

 

      setLoading(false);

      setRefreshing(false);

    }

 

    document.addEventListener(

      "visibilitychange",

      handleVisibility

    );

 

    window.addEventListener(

      "focus",

      handleFocus

    );

 

    window.addEventListener(

      "online",

      handleOnline

    );

 

    window.addEventListener(

      "offline",

      handleOffline

    );

 

    return () => {

      document.removeEventListener(

        "visibilitychange",

        handleVisibility

      );

 

      window.removeEventListener(

        "focus",

        handleFocus

      );

 

      window.removeEventListener(

        "online",

        handleOnline

      );

 

      window.removeEventListener(

        "offline",

        handleOffline

      );

    };

  }, [

    isStale,

    load,

  ]);

 

  useEffect(() => {

    return subscribeExecutiveIntelligenceEvents(

      (event) => {

        if (

          !event?.type

        ) {

          return;

        }

 

        const sourceInstance =

          event?.payload

            ?.source_instance;

 

        if (

          sourceInstance &&

          sourceInstance ===

            localInstanceIdRef.current

        ) {

          return;

        }

 

        if (

          event.type ===

            EXECUTIVE_INTELLIGENCE_EVENTS.REFRESH_COMPLETED &&

          event.payload?.data

        ) {

          const normalized =

            normalizeData(

              event.payload.data

            );

 

          const updatedAt =

            event.payload

              .generated_at ||

            new Date().toISOString();

 

          setData(

            normalized

          );

 

          setLastUpdated(

            updatedAt

          );

 

          setConnectionState(

            "online"

          );

 

          setError("");

 

          setLoading(false);

          setRefreshing(false);

 

          initialLoadCompleteRef.current =

            true;

 

          lastRequestKeyRef.current =

            event.payload

              ?.request_key ||

            requestKey;

 

          writeCache(

            normalized,

            updatedAt

          );

 

          return;

        }

 

        if (

          event.type ===

            EXECUTIVE_INTELLIGENCE_EVENTS.INVALIDATE ||

          event.type ===

            EXECUTIVE_INTELLIGENCE_EVENTS.ACTION_CREATED ||

          event.type ===

            EXECUTIVE_INTELLIGENCE_EVENTS.WORKSPACE_CHANGED

        ) {

          invalidatedRef.current =

            true;

 

          if (

            document

              .visibilityState ===

              "visible" &&

            navigator.onLine

          ) {

            load({

              quiet: true,

              force: true,

              reason:

                event.payload

                  ?.reason ||

                event.type,

              broadcast:

                false,

            });

          }

        }

      }

    );

  }, [

    load,

    requestKey,

  ]);

 

  useEffect(() => {

    function handleWorkspaceChange(

      event

    ) {

      invalidatedRef.current =

        true;

 

      publishExecutiveIntelligenceEvent(

        EXECUTIVE_INTELLIGENCE_EVENTS.WORKSPACE_CHANGED,

        {

          workspace_id:

            event?.detail

              ?.workspace_id ||

            "",

 

          reason:

            "workspace-changed",

 

          source_instance:

            localInstanceIdRef.current,

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

 

  const createAction =

    useCallback(

      async (

        payload = {}

      ) => {

        const result =

          await createUnifiedExecutiveAction({

            ...payload,

 

            // Viewing/filtering by active workspace is separate from

            // assigning ownership for a newly created executive task.

            // Only an explicit payload workspace_id may scope the task.

            workspace_id: normalizeWorkspaceId(

              payload?.workspace_id

            ),

          });

 

        publishExecutiveIntelligenceEvent(

          EXECUTIVE_INTELLIGENCE_EVENTS.ACTION_CREATED,

          {

            task:

              result?.task ||

              null,

 

            reason:

              "executive-action-created",

 

            source_instance:

              localInstanceIdRef.current,

          }

        );

 

        await load({

          quiet: true,

          force: true,

          reason:

            "executive-action-created",

        });

 

        return result;

      },

      [

        load,

      ]

    );

 

  const value =

    useMemo(

      () => ({

        data,

 

        overview:

          data,

 

        health:

          data.health || {},

 

        briefing:

          data.briefing || {},

 

        kpis:

          data.kpis || {},

 

        summary:

          data.summary || {},

 

        workspaces:

          data.workspaces || [],

 

        urgentWorkspaces:

          data

            .urgent_workspaces ||

          [],

 

        tasks:

          data.tasks || [],

 

        signals:

          data.signals || [],

 

        alerts:

          data.alerts || [],

 

        recommendations:

          data

            .recommendations ||

          [],

 

        missions:

          data.missions || [],

 

        activity:

          data.activity || [],

 

        sourceStatus:

          data

            .source_status ||

          [],

 

        loading,

        refreshing,

        error,

 

        lastUpdated,

 

        lastRefreshReason,

 

        connectionState,

 

        dataAgeMs,

 

        isStale,

 

        isLive,

 

        filters:

          requestFilters,

 

        refresh,

 

        reload,

 

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

        refresh,

        reload,

        invalidate,

        createAction,

      ]

    );

 

  return (

    <UnifiedExecutiveIntelligenceContext.Provider

      value={value}

    >

      {children}

    </UnifiedExecutiveIntelligenceContext.Provider>

  );

}

 

export function useUnifiedExecutiveIntelligence() {

  const context =

    useContext(

      UnifiedExecutiveIntelligenceContext

    );

 

  if (!context) {

    throw new Error(

      "useUnifiedExecutiveIntelligence must be used within UnifiedExecutiveIntelligenceProvider"

    );

  }

 

  return context;

}
