import { useAuth } from "../hooks/useAuth";

export function ProfilePage() {
  const { profile } = useAuth();

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        padding: "var(--space-5)",
        maxWidth: 420,
      }}
    >
      <h2 style={{ marginBottom: "var(--space-4)" }}>Profile</h2>
      <dl style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "var(--space-2) var(--space-4)", margin: 0 }}>
        <dt style={{ color: "var(--text)" }}>Name</dt>
        <dd style={{ margin: 0, color: "var(--text-h)" }}>{profile?.display_name}</dd>
        <dt style={{ color: "var(--text)" }}>Email</dt>
        <dd style={{ margin: 0, color: "var(--text-h)" }}>{profile?.email}</dd>
        <dt style={{ color: "var(--text)" }}>Plan</dt>
        <dd style={{ margin: 0, color: "var(--text-h)" }}>{profile?.product}</dd>
      </dl>
    </div>
  );
}
