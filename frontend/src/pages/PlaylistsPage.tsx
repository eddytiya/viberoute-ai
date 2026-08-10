import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

import { ErrorMessage } from "../components/common/ErrorMessage";
import { Loader } from "../components/common/Loader";
import { playlistApi } from "../api/playlistApi";

export function PlaylistsPage() {
  const { data, isLoading, isError } = useQuery({ queryKey: ["my-playlists"], queryFn: playlistApi.mine });

  if (isLoading) return <Loader label="Loading your playlists..." />;
  if (isError) return <ErrorMessage message="Could not load your playlists." />;

  return (
    <div>
      <p style={{ marginBottom: "var(--space-5)" }}>Your Spotify playlists — click one to search, add, remove tracks, or change its cover.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: "var(--space-4)" }}>
        {data?.map((pl, i) => (
          <motion.div
            key={pl.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: i * 0.03 }}
          >
            <Link to={`/playlists/${pl.id}`} style={{ textDecoration: "none", color: "inherit" }}>
              <div
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-lg)",
                  padding: "var(--space-3)",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    aspectRatio: "1",
                    borderRadius: "var(--radius-md)",
                    overflow: "hidden",
                    background: "var(--surface-hover)",
                    marginBottom: "var(--space-3)",
                  }}
                >
                  {pl.images[0] && (
                    <img src={pl.images[0].url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  )}
                </div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "var(--text-h)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {pl.name}
                </div>
                <div style={{ fontSize: 12 }}>{pl.tracks.total} tracks</div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
