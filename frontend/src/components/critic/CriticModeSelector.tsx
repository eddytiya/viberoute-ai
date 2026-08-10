import { motion } from "framer-motion";
import { Brain, Flame, Laugh } from "lucide-react";

import type { CriticMode } from "../../types/critic";

const MODES: { value: CriticMode; label: string; icon: typeof Laugh; description: string }[] = [
  { value: "humorous", label: "Humorous", icon: Laugh, description: "Witty, playful, pop-culture jabs" },
  { value: "brutal", label: "Brutal", icon: Flame, description: "Zero sugarcoating" },
  { value: "philosophical", label: "Philosophical", icon: Brain, description: "Reflective and a little melancholic" },
];

export function CriticModeSelector({
  selected,
  onSelect,
  disabled,
}: {
  selected: CriticMode | null;
  onSelect: (mode: CriticMode) => void;
  disabled?: boolean;
}) {
  return (
    <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap" }}>
      {MODES.map(({ value, label, icon: Icon, description }) => {
        const isSelected = selected === value;
        return (
          <motion.button
            key={value}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(value)}
            whileHover={disabled ? undefined : { scale: 1.03 }}
            whileTap={disabled ? undefined : { scale: 0.97 }}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: "var(--space-2)",
              padding: "var(--space-4)",
              minWidth: 160,
              borderRadius: "var(--radius-lg)",
              border: `1px solid ${isSelected ? "var(--accent)" : "var(--border)"}`,
              background: isSelected ? "var(--accent-bg)" : "var(--surface)",
              color: "var(--text-h)",
              cursor: disabled ? "not-allowed" : "pointer",
              opacity: disabled && !isSelected ? 0.5 : 1,
              textAlign: "left",
            }}
          >
            <Icon size={20} color={isSelected ? "var(--accent)" : "var(--text)"} />
            <strong style={{ fontSize: 14 }}>{label}</strong>
            <span style={{ fontSize: 12, color: "var(--text)", fontWeight: 400 }}>{description}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
