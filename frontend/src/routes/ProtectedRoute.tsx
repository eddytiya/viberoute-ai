import { Navigate, Outlet } from "react-router-dom";

import { Loader } from "../components/common/Loader";
import { useAuth } from "../hooks/useAuth";

export function ProtectedRoute() {
  const { authenticated, loading } = useAuth();

  if (loading) return <Loader />;
  if (!authenticated) return <Navigate to="/login" replace />;

  return <Outlet />;
}
