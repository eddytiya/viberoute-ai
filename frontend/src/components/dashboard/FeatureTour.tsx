import { motion } from "framer-motion";
import { Compass, LineChart, MessageSquareQuote, Orbit, Route, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const FEATURES = [
  {
    to: "/playlist-architect",
    icon: Sparkles,
    title: "Playlist Architect",
    description: "Describe a mood or scene — get a real Spotify playlist built for it.",
  },
  {
    to: "/recommendations",
    icon: Compass,
    title: "Recommendations",
    description: "Fresh tracks picked and ranked against your actual taste.",
  },
  {
    to: "/music-critic",
    icon: MessageSquareQuote,
    title: "Music Critic",
    description: "Let AI critique your taste in a tone of your choosing.",
  },
  {
    to: "/route-playlist",
    icon: Route,
    title: "Route Playlist",
    description: "Give it a drive, walk, or ride — get a playlist timed to match.",
  },
  {
    to: "/taste-insights",
    icon: LineChart,
    title: "Taste Insights",
    description: "A genre breakdown and drift analysis of your listening.",
  },
  {
    to: "/sound-map",
    icon: Orbit,
    title: "Sound Map",
    description: "See your library clustered by sound, visually.",
  },
];

export function FeatureTour() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
        gap: "var(--space-3)",
      }}
    >
      {FEATURES.map(({ to, icon: Icon, title, description }, i) => (
        <motion.div
          key={to}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: i * 0.04 }}
        >
          <Link to={to} style={{ textDecoration: "none", color: "inherit" }}>
            <div
              style={{
                height: "100%",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-lg)",
                padding: "var(--space-4)",
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-2)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent-border)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            >
              <Icon size={18} color="var(--accent)" />
              <div style={{ color: "var(--text-h)", fontWeight: 600, fontSize: 14 }}>{title}</div>
              <div style={{ fontSize: 13 }}>{description}</div>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
