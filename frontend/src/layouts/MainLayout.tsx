import { AnimatePresence } from "framer-motion";
import { Outlet, useLocation } from "react-router-dom";

import { Navbar } from "../components/layout/Navbar";
import { PlayerBar } from "../components/player/PlayerBar";
import { Sidebar } from "../components/layout/Sidebar";
import { PageTransition } from "../components/common/PageTransition";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import { useSpotifyPlayer } from "../hooks/useSpotifyPlayer";
import { IS_DEMO_MODE } from "../utils/constants";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/playlist-architect": "Playlist Architect",
  "/playlists": "Your Playlists",
  "/music-critic": "Music Critic",
  "/recommendations": "Recommendations",
  "/taste-insights": "Taste Insights",
  "/sound-map": "Sound Map",
  "/route-playlist": "Route Playlist",
  "/skip-predictor": "Skip Predictor",
  "/profile": "Profile",
};

export function MainLayout() {
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] ?? "VibeRoute AI";
  useSpotifyPlayer();
  useKeyboardShortcuts();

  return (
    <div style={{ display: "flex", minHeight: "100svh" }}>
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Navbar title={title} />
        {IS_DEMO_MODE && (
          <div
            role="status"
            style={{
              padding: "10px var(--space-5)",
              borderBottom: "1px solid var(--border)",
              background: "var(--accent-bg)",
              color: "var(--text-h)",
              fontSize: 12,
            }}
          >
            <strong style={{ color: "var(--accent)" }}>Public Demo Edition</strong>
            {" — "}Optimized for Render&apos;s 512 MB free tier. Semantic Recommendations and Sound Map ML run in
            the full self-hosted edition.
          </div>
        )}
        <main style={{ flex: 1, padding: "var(--space-5)", overflow: "auto" }}>
          <AnimatePresence mode="wait">
            <PageTransition key={location.pathname}>
              <Outlet />
            </PageTransition>
          </AnimatePresence>
        </main>
        <PlayerBar />
      </div>
    </div>
  );
}
