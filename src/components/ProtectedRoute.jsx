import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={styles.loadingWrap}>
        <div style={styles.loadingCard}>Loading your account...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}

const styles = {
  loadingWrap: {
    minHeight: "60vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
  },
  loadingCard: {
    background: "#111827",
    color: "#fff",
    border: "1px solid #334155",
    borderRadius: "12px",
    padding: "16px 20px",
  },
};
