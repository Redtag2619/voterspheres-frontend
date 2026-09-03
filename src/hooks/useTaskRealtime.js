import { useEffect } from "react";
import {
  getRealtimeSocket,
  onRealtimeEvent,
} from "../services/realtimeClient";

export default function useTaskRealtime({
  onTaskCreated,
  onTaskUpdated,
  onCommentCreated,
  onActivityCreated,
} = {}) {
  useEffect(() => {
    const socket = getRealtimeSocket();

    const offRealtime = onRealtimeEvent((event = {}) => {
      const type = String(event?.type || "").toLowerCase();
      const payload = event?.payload || {};
      const task = payload?.task || payload;

      if (
        type === "task.created" ||
        type === "task:created"
      ) {
        onTaskCreated?.(task);
        return;
      }

      if (
        type === "task.updated" ||
        type === "task:updated" ||
        type === "task.completed"
      ) {
        onTaskUpdated?.(task);
        return;
      }

      if (
        type === "task.comment_created" ||
        type === "task:comment_created"
      ) {
        onCommentCreated?.(payload);
        return;
      }

      if (
        type === "task.activity_created" ||
        type === "task:activity_created"
      ) {
        onActivityCreated?.(payload);
      }
    });

    const handleLegacyTaskCreated = (payload) => {
      onTaskCreated?.(payload);
    };

    const handleLegacyTaskUpdated = (payload) => {
      onTaskUpdated?.(payload);
    };

    const handleLegacyCommentCreated = (payload) => {
      onCommentCreated?.(payload);
    };

    const handleLegacyActivityCreated = (payload) => {
      onActivityCreated?.(payload);
    };

    socket.on("task:created", handleLegacyTaskCreated);
    socket.on("task:updated", handleLegacyTaskUpdated);
    socket.on("task:comment_created", handleLegacyCommentCreated);
    socket.on("task:activity_created", handleLegacyActivityCreated);

    return () => {
      offRealtime?.();

      socket.off("task:created", handleLegacyTaskCreated);
      socket.off("task:updated", handleLegacyTaskUpdated);
      socket.off(
        "task:comment_created",
        handleLegacyCommentCreated
      );
      socket.off(
        "task:activity_created",
        handleLegacyActivityCreated
      );
    };
  }, [
    onTaskCreated,
    onTaskUpdated,
    onCommentCreated,
    onActivityCreated,
  ]);
}
