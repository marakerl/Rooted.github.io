import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export const RequireAuth = ({ children }: { children: JSX.Element }) => {
  const { session, loading } = useAuth();
  if (loading) return <div className="p-10 text-center text-muted-foreground">Loading…</div>;
  if (!session) return <Navigate to="/login" replace />;
  return children;
};
