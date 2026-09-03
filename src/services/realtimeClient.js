import { io } from "socket.io-client";

import { getStoredToken } from "../lib/auth";

 

function resolveSocketUrl() {

  const raw = String(import.meta.env.VITE_API_BASE_URL || "").trim();

 

  if (raw) {

    return raw.replace(/\/api\/?$/, "").replace(/\/$/, "");

  }

 

  const hostname = typeof window !== "undefined" ? window.location.hostname : "";

  const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";

 

  if (isLocalhost) return "http://127.0.0.1:10000";

 

  return "https://voterspheres-backend-2pap.onrender.com";

}

 

function clean(value = "") {

  return String(value ?? "").trim();

}

 

function normalizeWorkspaceId(value) {

  const cleaned = clean(value);

  return cleaned || null;

}

 

function normalizeState(value) {

  const state = clean(value).toUpperCase();

  return /^[A-Z]{2}$/.test(state) ? state : null;

}

 

function normalizeChannel(value) {

  const channel = clean(value);

  return channel || null;

}

 

function subscriptionKey(scope = {}) {

  return JSON.stringify({

    workspace_id: normalizeWorkspaceId(scope.workspace_id ?? scope.workspaceId),

    state: normalizeState(scope.state),

    channel: normalizeChannel(scope.channel),

  });

}

 

function normalizeScope(scope = {}) {

  return {

    workspace_id: normalizeWorkspaceId(scope.workspace_id ?? scope.workspaceId),

    state: normalizeState(scope.state),

    channel: normalizeChannel(scope.channel),

  };

}

 

let socket = null;

let socketToken = "";

const subscriptions = new Map();

 

function replaySubscriptions() {

  if (!socket?.connected) return;

 

  for (const entry of subscriptions.values()) {

    socket.emit("voterspheres:subscribe", entry.scope);

  }

}

 

function createSocket(token) {

  const next = io(resolveSocketUrl(), {

    transports: ["websocket", "polling"],

    withCredentials: true,

    auth: {

      token,

    },

    autoConnect: Boolean(token),

  });

 

  next.on("connect", () => {

    console.log("[VoterSpheres realtime] connected", next.id);

    replaySubscriptions();

  });

 

  next.on("disconnect", (reason) => {

    console.log("[VoterSpheres realtime] disconnected", reason);

  });

 

  next.on("connect_error", (error) => {

    console.warn(

      "[VoterSpheres realtime] connection error",

      error?.message || error

    );

  });

 

  next.on("voterspheres:ready", (payload) => {

    console.log("[VoterSpheres realtime] ready", payload);

  });

 

  return next;

}

 

export function getRealtimeSocket() {

  const currentToken = clean(getStoredToken?.() || "");

 

  if (!socket) {

    socketToken = currentToken;

    socket = createSocket(currentToken);

    return socket;

  }

 

  if (currentToken !== socketToken) {

    socket.removeAllListeners();

    socket.close();

 

    socketToken = currentToken;

    socket = createSocket(currentToken);

    return socket;

  }

 

  if (currentToken && !socket.connected && !socket.active) {

    socket.auth = { token: currentToken };

    socket.connect();

  }

 

  return socket;

}

 

export function subscribeRealtimeScope(scope = {}) {

  const normalized = normalizeScope(scope);

  const key = subscriptionKey(normalized);

  const existing = subscriptions.get(key);

 

  if (existing) {

    existing.count += 1;

  } else {

    subscriptions.set(key, {

      scope: normalized,

      count: 1,

    });

 

    const next = getRealtimeSocket();

    next.emit("voterspheres:subscribe", normalized);

  }

 

  let released = false;

 

  return () => {

    if (released) return;

    released = true;

 

    const entry = subscriptions.get(key);

    if (!entry) return;

 

    entry.count -= 1;

 

    if (entry.count > 0) return;

 

    subscriptions.delete(key);

 

    if (socket) {

      socket.emit("voterspheres:unsubscribe", entry.scope);

    }

  };

}

 

export function onRealtimeEvent(handler) {

  const next = getRealtimeSocket();

 

  if (typeof handler !== "function") {

    return () => {};

  }

 

  next.on("voterspheres:event", handler);

 

  return () => {

    next.off("voterspheres:event", handler);

  };

}

 

export function closeRealtimeSocket() {

  if (socket) {

    socket.removeAllListeners();

    socket.close();

    socket = null;

    socketToken = "";

  }

 

  subscriptions.clear();

}


