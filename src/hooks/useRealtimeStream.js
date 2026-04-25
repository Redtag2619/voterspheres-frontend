import { useEffect } from "react";
import { API_BASE } from "../services/api";
import { getStoredToken } from "../lib/auth";

export default function useRealtimeStream(channel, onEvent) {
  useEffect(() => {
    const token = getStoredToken?.();
    if (!token || typeof onEvent !== "function") return;

    const url = `${API_BASE}/realtime/stream?token=${encodeURIComponent(token)}`;
    const source = new EventSource(url);

    const handleMessage = (message) => {
      try {
        const event = JSON.parse(message.data);
        if (!channel || event.channel === channel || event.channel === "intelligence:global") {
          onEvent(event);
        }
      } catch {
        // ignore malformed event
      }
    };

    source.addEventListener("mailops.event_created", handleMessage);
    source.addEventListener("mailops.event_updated", handleMessage);
    source.addEventListener("intelligence.update", handleMessage);
    source.addEventListener("alert.dispatched", handleMessage);

    return () => {
      source.close();
    };
  }, [channel, onEvent]);
}
