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

let socket = null;

export function getRealtimeSocket() {
  if (socket) return socket;

  socket = io(resolveSocketUrl(), {
    transports: ["websocket", "polling"],
    withCredentials: true,
    auth: {
      token: getStoredToken?.() || "",
    },
  });

  socket.on("connect", () => {
    console.log("[VoterSpheres realtime] connected", socket.id);
  });

  socket.on("disconnect", (reason) => {
    console.log("[VoterSpheres realtime] disconnected", reason);
  });

  socket.on("connect_error", (error) => {
    console.warn("[VoterSpheres realtime] connection error", error?.message || error);
  });

  return socket;
}

export function subscribeRealtimeScope({ workspace_id, firm_id, state } = {}) {
  const next = getRealtimeSocket();

  next.emit("voterspheres:subscribe", {
    workspace_id,
    firm_id,
    state,
  });

  return () => {
    next.emit("voterspheres:unsubscribe", {
      workspace_id,
      firm_id,
      state,
    });
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
    socket.close();
    socket = null;
  }
}
