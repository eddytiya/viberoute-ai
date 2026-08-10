import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { spotifyApi } from "../api/spotifyApi";
import { usePlayerStore } from "../store/playerStore";
import type { NowPlaying } from "../types/spotify";

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || el.isContentEditable;
}

/** Space = play/pause, Left/Right arrows = previous/next track. Ignored while typing in a field. */
export function useKeyboardShortcuts() {
  const queryClient = useQueryClient();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (isTypingTarget(e.target)) return;
      if (!["Space", "ArrowLeft", "ArrowRight"].includes(e.code)) return;

      const nowPlaying = queryClient.getQueryData<NowPlaying | null>(["now-playing"]);
      if (!nowPlaying) return;

      const { sdkReady, deviceId } = usePlayerStore.getState();
      const targetDevice = sdkReady ? (deviceId ?? undefined) : undefined;

      e.preventDefault();
      const invalidate = () => queryClient.invalidateQueries({ queryKey: ["now-playing"] });

      if (e.code === "Space") {
        (nowPlaying.is_playing ? spotifyApi.pause(targetDevice) : spotifyApi.play(targetDevice)).then(invalidate);
      } else if (e.code === "ArrowRight") {
        spotifyApi.next(targetDevice).then(invalidate);
      } else if (e.code === "ArrowLeft") {
        spotifyApi.previous(targetDevice).then(invalidate);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [queryClient]);
}
