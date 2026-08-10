import { motion } from "framer-motion";

import type { Critique } from "../../types/critic";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.12 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export function CriticResult({ critique }: { critique: Critique }) {
  const paragraphs = critique.critique.split(/\n+/).filter(Boolean);

  return (
    <motion.section
      variants={container}
      initial="hidden"
      animate="show"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        padding: "var(--space-5)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-4)",
        maxWidth: 680,
      }}
    >
      <motion.h2 variants={item}>{critique.title}</motion.h2>

      {paragraphs.map((p, i) => (
        <motion.p key={i} variants={item} style={{ fontSize: 15, lineHeight: 1.6 }}>
          {p}
        </motion.p>
      ))}

      <motion.div
        variants={item}
        style={{
          alignSelf: "flex-start",
          padding: "var(--space-2) var(--space-4)",
          borderRadius: "var(--radius-pill)",
          background: "var(--accent)",
          color: "var(--accent-text)",
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        {critique.verdict}
      </motion.div>
    </motion.section>
  );
}
