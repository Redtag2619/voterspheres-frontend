import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { hasAnyPermission } from "../../lib/permissions.js";

function LoadingScreen() {
  return (
    <div className="vs-loading-screen">
      <div className="vs-loading-card">Loading VoterSpheres...</div>
    </div>
  );
}

export default function RequirePermission({
  permissions = [],
  fallbackPath = "/dashboard"
}) {
  const { loading, user, token } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen />;
  }

  const isAuthenticated = Boolean(user || token);

  if (!isAuthenticated) {
    const next = encodeURIComponent(`${location.pathname}${location.search}${location.hash}`);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  if (!hasAnyPermission(user, permissions)) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <Outlet />;
}
