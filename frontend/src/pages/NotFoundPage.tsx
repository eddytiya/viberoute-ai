import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <section style={{ textAlign: "center", padding: "80px 20px" }}>
      <h1>404</h1>
      <p>Page not found.</p>
      <Link to="/">Go home</Link>
    </section>
  );
}
