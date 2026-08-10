import { Check, Plus, User } from "lucide-react";
import { motion } from "framer-motion";

import { useArtistFollow } from "../../hooks/useArtistFollow";
import type { SpotifyArtist } from "../../types/spotify";

export function ArtistCard({ artist }: { artist: SpotifyArtist }) {
  const { isFollowing, isPending, toggle } = useArtistFollow(artist.id);
  const image = artist.images?.[0]?.url;

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        padding: "var(--space-3)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "var(--space-2)",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 88,
          height: 88,
          borderRadius: "50%",
          overflow: "hidden",
          background: "var(--surface-hover)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {image ? (
          <img src={image} alt="" width={88} height={88} style={{ objectFit: "cover" }} />
        ) : (
          <User size={28} color="var(--text)" />
        )}
      </div>

      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: "var(--text-h)",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          maxWidth: "100%",
        }}
      >
        {artist.name}
      </div>

      <button
        type="button"
        onClick={toggle}
        disabled={isPending}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          fontSize: 11,
          fontWeight: 600,
          padding: "4px 10px",
          borderRadius: "var(--radius-pill)",
          border: "1px solid var(--border)",
          background: isFollowing ? "var(--success)" : "var(--surface-hover)",
          color: isFollowing ? "white" : "var(--text-h)",
          cursor: "pointer",
        }}
      >
        <motion.span
          key={String(isFollowing)}
          initial={{ scale: 0.5 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 15 }}
          style={{ display: "flex" }}
        >
          {isFollowing ? <Check size={11} /> : <Plus size={11} />}
        </motion.span>
        {isFollowing ? "Following" : "Follow"}
      </button>
    </div>
  );
}
