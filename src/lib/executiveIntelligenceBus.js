const CHANNEL_NAME = "voterspheres:executive-intelligence";
const STORAGE_EVENT_KEY = "vs_executive_intelligence_event";

let channel = null;

function getChannel() {
  if (
    typeof window === "undefined" ||
    !("BroadcastChannel" in window)
  ) {
    return null;
  }

  if (!channel) {
    channel = new BroadcastChannel(CHANNEL_NAME);
  }

  return channel;
}

export function publishExecutiveIntelligenceEvent(
  type,
  payload = {}
) {
  if (typeof window === "undefined") return;

  const event = {
    id: `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}`,
    type,
    payload,
    created_at: new Date().toISOString(),
  };

  const activeChannel = getChannel();

  if (activeChannel) {
    activeChannel.postMessage(event);
  }

  try {
    localStorage.setItem(
      STORAGE_EVENT_KEY,
      JSON.stringify(event)
    );

    // Trigger storage listeners
    localStorage.removeItem(STORAGE_EVENT_KEY);
  } catch {
    // ignore
  }

  window.dispatchEvent(
    new CustomEvent(CHANNEL_NAME, {
      detail: event,
    })
  );
}

export function subscribeExecutiveIntelligenceEvents(
  listener
) {
  if (
    typeof window === "undefined" ||
    typeof listener !== "function"
  ) {
    return () => {};
  }

  const activeChannel = getChannel();

  function handleBroadcast(event) {
    listener(event.data);
  }

  function handleStorage(event) {
    if (
      event.key !== STORAGE_EVENT_KEY ||
      !event.newValue
    ) {
      return;
    }

    try {
      listener(JSON.parse(event.newValue));
    } catch {
      // ignore malformed payload
    }
  }

  function handleLocal(event) {
    listener(event.detail);
  }

  activeChannel?.addEventListener(
    "message",
    handleBroadcast
  );

  window.addEventListener(
    "storage",
    handleStorage
  );

  window.addEventListener(
    CHANNEL_NAME,
    handleLocal
  );

  return () => {
    activeChannel?.removeEventListener(
      "message",
      handleBroadcast
    );

    window.removeEventListener(
      "storage",
      handleStorage
    );

    window.removeEventListener(
      CHANNEL_NAME,
      handleLocal
    );
  };
}

export const EXECUTIVE_INTELLIGENCE_EVENTS =
  Object.freeze({
    INVALIDATE: "invalidate",

    REFRESH_STARTED:
      "refresh-started",

    REFRESH_COMPLETED:
      "refresh-completed",

    ACTION_CREATED:
      "action-created",

    WORKSPACE_CHANGED:
      "workspace-changed",

    FILTERS_CHANGED:
      "filters-changed",
  });
