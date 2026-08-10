import { useQuery } from "@tanstack/react-query";
import { LogOut, Moon, Sparkles, Sun } from "lucide-react";

import { recommendationApi } from "../../api/recommendationApi";
import { useAuth } from "../../hooks/useAuth";
import { useThemeStore } from "../../store/themeStore";

export function Navbar({ title }: { title: string }) {
  const { profile, logout } = useAuth();
  const { theme, toggleTheme } = useThemeStore();

  const { data: quota } = useQuery({
    queryKey: ["ai-quota"],
    queryFn: recommendationApi.aiQuota,
    refetchInterval: 30000,
  });

  return (
    <header
      style={{
        height: "var(--navbar-height)",
        flexShrink: 0,
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 var(--space-5)",
      }}
    >
      <h1>{title}</h1>

      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
        {quota && (
          <div
            title={`${quota.remaining} of ${quota.limit} free AI calls left today`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              fontWeight: 600,
              padding: "6px 12px",
              borderRadius: "var(--radius-pill)",
              border: "1px solid var(--border)",
              color: quota.remaining === 0 ? "var(--danger)" : quota.remaining <= 5 ? "#f5a623" : "var(--text)",
            }}
          >
            <Sparkles size={13} />
            {quota.remaining}/{quota.limit} AI calls left
          </div>
        )}
        <div style={{ textAlign: "right" }}>
          <div style={{ color: "var(--text-h)", fontSize: 14, fontWeight: 600 }}>
            {profile?.display_name ?? "..."}
          </div>
          <div style={{ fontSize: 12 }}>{profile?.product === "premium" ? "Premium" : profile?.product}</div>
        </div>
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 36,
            height: 36,
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border)",
            background: "var(--surface)",
            color: "var(--text)",
            cursor: "pointer",
          }}
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <button
          type="button"
          onClick={logout}
          aria-label="Log out"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 36,
            height: 36,
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border)",
            background: "var(--surface)",
            color: "var(--text)",
            cursor: "pointer",
          }}
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
