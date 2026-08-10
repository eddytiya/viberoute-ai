import { motion, type HTMLMotionProps } from "framer-motion";

interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: "primary" | "secondary" | "ghost";
}

const VARIANT_STYLES: Record<NonNullable<ButtonProps["variant"]>, React.CSSProperties> = {
  primary: { background: "var(--accent)", color: "var(--accent-text)", border: "1px solid transparent" },
  secondary: { background: "var(--surface)", color: "var(--text-h)", border: "1px solid var(--border)" },
  ghost: { background: "transparent", color: "var(--text-h)", border: "1px solid transparent" },
};

export function Button({ variant = "primary", style, disabled, ...props }: ButtonProps) {
  return (
    <motion.button
      {...props}
      disabled={disabled}
      whileHover={disabled ? undefined : { scale: 1.03 }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "var(--space-2)",
        padding: "var(--space-3) var(--space-5)",
        borderRadius: "var(--radius-pill)",
        fontWeight: 600,
        fontSize: 14,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        ...VARIANT_STYLES[variant],
        ...style,
      }}
    />
  );
}
