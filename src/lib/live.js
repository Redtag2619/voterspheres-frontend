import { io } from "socket.io-client";

const SOCKET_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "https://voterspheres-backend.onrender.com";

let socket;

export function getLiveClient() {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      withCredentials: true
    });
  }

  return socket;
}

export function joinChannel(channel) {
  const client = getLiveClient();
  client.emit("join", channel);
}

export function leaveChannel(channel) {
  const client = getLiveClient();
  client.emit("leave", channel);
}

export function onLiveEvent(handler) {
  const client = getLiveClient();
  client.on("intelligence:event", handler);
  return () => client.off("intelligence:event", handler);
}
