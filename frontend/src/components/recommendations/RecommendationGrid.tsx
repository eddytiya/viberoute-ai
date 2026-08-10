import { AnimatePresence, motion } from "framer-motion";
import type { Variants } from "framer-motion";

import type { DiscoveredTrack } from "../../types/recommendation";
import { RecommendationCard } from "./RecommendationCard";

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

export function RecommendationGrid({
  tracks,
  onDismissed,
}: {
  tracks: DiscoveredTrack[];
  onDismissed: (trackId: string) => void;
}) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      style={{ display: "flex", flexDirection: "column" }}
    >
      <AnimatePresence initial={false}>
        {tracks.map((track) => (
          <motion.div key={track.id} variants={item}>
            <RecommendationCard track={track} onDismissed={onDismissed} />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
