import { Sparkles } from "lucide-react";

export function ComingSoon({ description }: { description: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "var(--space-3)",
        padding: "var(--space-6) 0",
        textAlign: "center",
        color: "var(--text)",
      }}
    >
      <Sparkles size={28} color="var(--accent)" />
      <p style={{ maxWidth: 420 }}>{description}</p>
    </div>
  );
}
