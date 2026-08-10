import { AnimatePresence } from "framer-motion";
import { Outlet, useLocation } from "react-router-dom";

import { Navbar } from "../components/layout/Navbar";
import { PlayerBar } from "../components/player/PlayerBar";
import { Sidebar } from "../components/layout/Sidebar";
import { PageTransition } from "../components/common/PageTransition";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import { useSpotifyPlayer } from "../hooks/useSpotifyPlayer";

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
