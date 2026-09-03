import {
  getRealtimeSocket,
  onRealtimeEvent,
  subscribeRealtimeScope,
} from "../services/realtimeClient";

const channelSubscriptions = new Map();

function cleanChannel(channel) {
  return String(channel ?? "").trim();
}

export function getLiveClient() {
  return getRealtimeSocket();
}

export function joinChannel(channel) {
  const normalized = cleanChannel(channel);
  if (!normalized) return () => {};

  const existing = channelSubscriptions.get(normalized);

  if (existing) {
    existing.count += 1;
    return existing.release;
  }

  const unsubscribe = subscribeRealtimeScope({
    channel: normalized,
  });

  const release = () => {
    leaveChannel(normalized);
  };

  channelSubscriptions.set(normalized, {
    count: 1,
    unsubscribe,
    release,
  });

  return release;
}

export function leaveChannel(channel) {
  const normalized = cleanChannel(channel);
  if (!normalized) return;

  const existing = channelSubscriptions.get(normalized);
  if (!existing) return;

  existing.count -= 1;

  if (existing.count > 0) return;

  channelSubscriptions.delete(normalized);
  existing.unsubscribe();
}

export function onLiveEvent(handler) {
  if (typeof handler !== "function") {
    return () => {};
  }

  return onRealtimeEvent((event) => {
    handler(event);
  });
}

