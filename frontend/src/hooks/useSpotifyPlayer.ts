import { useEffect, useRef } from "react";

import { spotifyApi } from "../api/spotifyApi";
import { usePlayerStore } from "../store/playerStore";
import { useAuth } from "./useAuth";

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void;
    Spotify: {
      Player: new (options: {
        name: string;
        getOAuthToken: (cb: (token: string) => void) => void;
        volume?: number;
      }) => SpotifyPlayerInstance;
    };
  }
}

interface SpotifyPlayerInstance {
  connect: () => Promise<boolean>;
  disconnect: () => void;
  addListener: (event: string, callback: (data: unknown) => void) => void;
}

const SDK_SCRIPT_ID = "spotify-web-playback-sdk";

/** Registers this browser tab as a controllable Spotify Connect device (requires Premium + the "streaming" scope). */
export function useSpotifyPlayer() {
  const { authenticated } = useAuth();
  const setSdkReady = usePlayerStore((s) => s.setSdkReady);
  const playerRef = useRef<SpotifyPlayerInstance | null>(null);

  useEffect(() => {
    if (!authenticated) return;

    function initPlayer() {
      const player = new window.Spotify.Player({
        name: "VibeRoute AI Web Player",
        getOAuthToken: (cb) => {
          spotifyApi.playbackToken().then((res) => cb(res.access_token));
        },
        volume: 0.5,
      });

      player.addListener("ready", (data) => {
        const { device_id } = data as { device_id: string };
        setSdkReady(true, device_id);
      });

      player.addListener("not_ready", () => {
        setSdkReady(false, null);
      });

      player.connect();
      playerRef.current = player;
    }

    if (window.Spotify) {
      initPlayer();
    } else {
      window.onSpotifyWebPlaybackSDKReady = initPlayer;
      if (!document.getElementById(SDK_SCRIPT_ID)) {
        const script = document.createElement("script");
        script.id = SDK_SCRIPT_ID;
        script.src = "https://sdk.scdn.co/spotify-player.js";
        script.async = true;
        document.body.appendChild(script);
      }
    }

    return () => {
      playerRef.current?.disconnect();
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated]);
}
