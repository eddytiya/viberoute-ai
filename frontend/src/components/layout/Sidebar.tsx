import { Compass, LineChart, ListMusic, MessageSquareQuote, Orbit, Route, Sparkles, User } from "lucide-react";
import { NavLink } from "react-router-dom";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: Sparkles },
  { to: "/playlist-architect", label: "Playlist Architect", icon: Sparkles },
  { to: "/playlists", label: "Your Playlists", icon: ListMusic },
  { to: "/music-critic", label: "Music Critic", icon: MessageSquareQuote },
  { to: "/recommendations", label: "Recommendations", icon: Compass },
  { to: "/taste-insights", label: "Taste Insights", icon: LineChart },
  { to: "/sound-map", label: "Sound Map", icon: Orbit },
  { to: "/route-playlist", label: "Route Playlist", icon: Route },
  { to: "/skip-predictor", label: "Skip Predictor", icon: LineChart },
  { to: "/profile", label: "Profile", icon: User },
];

export function Sidebar() {
  return (
    <aside
      style={{
        width: "var(--sidebar-width)",
        flexShrink: 0,
        borderRight: "1px solid var(--border)",
        padding: "var(--space-4)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-1)",
      }}
    >
      <div style={{ padding: "var(--space-2) var(--space-2) var(--space-5)" }}>
        <strong style={{ color: "var(--text-h)", fontSize: 18 }}>VibeRoute AI</strong>
      </div>

      {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          style={({ isActive }) => ({
            display: "flex",
            alignItems: "center",
            gap: "var(--space-3)",
            padding: "var(--space-3) var(--space-3)",
            borderRadius: "var(--radius-md)",
            textDecoration: "none",
            color: isActive ? "var(--accent)" : "var(--text)",
            background: isActive ? "var(--accent-bg)" : "transparent",
            fontSize: 14,
            fontWeight: isActive ? 600 : 400,
          })}
        >
          <Icon size={18} />
          {label}
        </NavLink>
      ))}
    </aside>
  );
}
