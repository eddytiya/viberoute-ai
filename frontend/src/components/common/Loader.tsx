export function Loader({ label = "Loading..." }: { label?: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-3)",
        color: "var(--text)",
        fontSize: 14,
        padding: "var(--space-4) 0",
      }}
    >
      <span
        style={{
          width: 16,
          height: 16,
          borderRadius: "50%",
          border: "2px solid var(--border)",
          borderTopColor: "var(--accent)",
          animation: "vibe-spin 0.7s linear infinite",
        }}
      />
      {label}
      <style>{"@keyframes vibe-spin { to { transform: rotate(360deg); } }"}</style>
    </div>
  );
}
