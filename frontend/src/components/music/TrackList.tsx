import { motion } from "framer-motion";
import type { Variants } from "framer-motion";

import type { SpotifyTrack } from "../../types/spotify";
import { TrackCard } from "./TrackCard";

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};

const item: Variants = {
  hidden: { opacity: 0, x: -8 },
  show: { opacity: 1, x: 0, transition: { duration: 0.25, ease: "easeOut" } },
};

export function TrackList({
  tracks,
  onFindSimilar,
  onAdd,
  onRemove,
}: {
  tracks: SpotifyTrack[];
  onFindSimilar?: (track: SpotifyTrack) => void;
  onAdd?: (track: SpotifyTrack) => void;
  onRemove?: (track: SpotifyTrack) => void;
}) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      style={{ display: "flex", flexDirection: "column" }}
    >
      {tracks.map((track, index) => (
        <motion.div key={track.id} variants={item}>
          <TrackCard track={track} index={index} onFindSimilar={onFindSimilar} onAdd={onAdd} onRemove={onRemove} />
        </motion.div>
      ))}
    </motion.div>
  );
}
