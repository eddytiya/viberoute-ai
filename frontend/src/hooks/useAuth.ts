import { useEffect } from "react";

import { authApi } from "../api/authApi";
import { useAuthStore } from "../store/authStore";

export function useAuth() {
  const { authenticated, profile, loading, setSession, reset } = useAuthStore();

  useEffect(() => {
    let cancelled = false;

    authApi
      .me()
      .then((status) => {
        if (!cancelled) setSession(status.authenticated, status.profile);
      })
      .catch(() => {
        if (!cancelled) reset();
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = async () => {
    await authApi.logout();
    reset();
  };

  return { authenticated, profile, loading, logout };
}
