import { Navigate } from "react-router-dom";

import { Loader } from "../components/common/Loader";
import { authApi } from "../api/authApi";
import { useAuth } from "../hooks/useAuth";

export function LoginPage() {
  const { authenticated, loading } = useAuth();

  if (loading) return <Loader />;
  if (authenticated) return <Navigate to="/dashboard" replace />;

  return (
    <section style={{ textAlign: "center", maxWidth: 420, padding: "var(--space-5)" }}>
      <h1 style={{ marginBottom: "var(--space-3)" }}>VibeRoute AI</h1>
      <p style={{ marginBottom: "var(--space-5)" }}>
        AI-powered music discovery, playlist generation, and smart route playlists.
      </p>
      <a
        href={authApi.loginUrl()}
        style={{
          display: "inline-flex",
          padding: "var(--space-3) var(--space-5)",
          borderRadius: "var(--radius-pill)",
          background: "var(--accent)",
          color: "var(--accent-text)",
          textDecoration: "none",
          fontWeight: 600,
          fontSize: 14,
        }}
      >
        Connect with Spotify
      </a>
    </section>
  );
}
