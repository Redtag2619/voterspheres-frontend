import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { hasAllPermissions, hasAnyPermission, hasRole } from "../lib/permissions.js";

export default function RequirePermission({
  permissions = [],
  requireAll = false,
  roles = []
}) {
  const { loading, user, token } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="vs-loading-screen">
        <div className="vs-loading-card">Checking access...</div>
      </div>
    );
  }

  const isAuthenticated = Boolean(user || token);

  if (!isAuthenticated) {
    const next = encodeURIComponent(`${location.pathname}${location.search}${location.hash}`);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  if (roles.length && !hasRole(user, roles)) {
    return <Navigate to="/dashboard" replace />;
  }

  if (permissions.length) {
    const allowed = requireAll
      ? hasAllPermissions(user, permissions)
      : hasAnyPermission(user, permissions);

    if (!allowed) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <Outlet />;
}
