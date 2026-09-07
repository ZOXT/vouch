import { Navigate, Outlet, useLocation } from "react-router-dom";
import { FullPageSpinner } from "@/components/ui/spinner";
import { useAuth } from "./auth-provider";

export const ProtectedRoute = () => {
  const { user } = useAuth();
  const location = useLocation();

  if (user === undefined) return <FullPageSpinner />;
  if (user === null) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  return <Outlet />;
};

export const GuestRoute = () => {
  const { user } = useAuth();

  if (user === undefined) return <FullPageSpinner />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
};
