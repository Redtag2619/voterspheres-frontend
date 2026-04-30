import { useEffect } from "react";
import { io } from "socket.io-client";

function getSocketBase() {
  const apiBase =
    import.meta.env?.VITE_API_BASE_URL ||
    "http://127.0.0.1:10000/api";

  return apiBase.replace(/\/api\/?$/, "");
}

export default function useTaskRealtime({
  onTaskCreated,
  onTaskUpdated,
  onCommentCreated,
  onActivityCreated
} = {}) {
  useEffect(() => {
    const socket = io(getSocketBase(), {
      transports: ["websocket", "polling"],
      withCredentials: true
    });

    socket.on("connect", () => {
      socket.emit("tasks:join");
    });

    socket.on("task:created", (payload) => {
      onTaskCreated?.(payload);
    });

    socket.on("task:updated", (payload) => {
      onTaskUpdated?.(payload);
    });

    socket.on("task:comment_created", (payload) => {
      onCommentCreated?.(payload);
    });

    socket.on("task:activity_created", (payload) => {
      onActivityCreated?.(payload);
    });

    return () => {
      socket.emit("tasks:leave");
      socket.disconnect();
    };
  }, [onTaskCreated, onTaskUpdated, onCommentCreated, onActivityCreated]);
}
