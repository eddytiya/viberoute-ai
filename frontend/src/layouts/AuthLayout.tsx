import { Outlet } from "react-router-dom";

import { Footer } from "../components/layout/Footer";

export function AuthLayout() {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100svh" }}>
      <main style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
