import { useEffect } from "react";
import { joinChannel, leaveChannel, onLiveEvent } from "../lib/live";

export default function useLiveChannel(channel, handler) {
  useEffect(() => {
    if (!channel) return;

    joinChannel(channel);

    const off = onLiveEvent((event) => {
      if (event?.channel === channel) {
        handler(event);
      }
    });

    return () => {
      off();
      leaveChannel(channel);
    };
  }, [channel, handler]);
}
