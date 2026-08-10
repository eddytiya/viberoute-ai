export function ErrorMessage({ message }: { message: string }) {
  return (
    <div
      style={{
        padding: "var(--space-3) var(--space-4)",
        borderRadius: "var(--radius-md)",
        background: "color-mix(in srgb, var(--danger) 12%, transparent)",
        color: "var(--danger)",
        fontSize: 14,
      }}
    >
      {message}
    </div>
  );
}
