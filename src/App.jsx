import { Suspense, lazy } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./components/AppShell";
import ErrorBoundary from "./components/ErrorBoundary.jsx";

const Dashboard = lazy(() => import("./pages/Dashboard.jsx"));
const Candidates = lazy(() => import("./pages/Candidates.jsx"));
const ElectionMap = lazy(() => import("./pages/ElectionMap.jsx"));
const DonorNetwork = lazy(() => import("./pages/DonorNetwork.jsx"));
const ElectionForecast = lazy(() => import("./pages/ElectionForecast.jsx"));
const PowerRankings = lazy(() => import("./pages/PowerRankings.jsx"));
const FundraisingDashboard = lazy(() => import("./pages/FundraisingDashboard.jsx"));
const Vendors = lazy(() => import("./pages/Vendors.jsx"));
const ConsultantMarketplace = lazy(() => import("./pages/ConsultantMarketplace.jsx"));
const AIChat = lazy(() => import("./pages/AIChat.jsx"));
const AIWarRoom = lazy(() => import("./pages/AIWarRoom.jsx"));
const CommandCenter = lazy(() => import("./pages/CommandCenter.jsx"));
const CampaignWorkspace = lazy(() => import("./pages/CampaignWorkspace.jsx"));
const Billing = lazy(() => import("./pages/Billing.jsx"));
const Pricing = lazy(() => import("./pages/Pricing.jsx"));
const Login = lazy(() => import("./pages/Login.jsx"));
const Signup = lazy(() => import("./pages/Signup.jsx"));

function LoadingScreen() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0d12",
        color: "#f3f4f6",
        display: "grid",
        placeItems: "center",
        fontSize: "14px",
        letterSpacing: "0.08em",
        textTransform: "uppercase"
      }}
    >
      Loading VoterSpheres...
    </div>
  );
}

function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0d12",
        color: "#f3f4f6",
        display: "grid",
        placeItems: "center",
        padding: "24px"
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "760px",
          border: "1px solid #232b36",
          background: "#11161d",
          borderRadius: "22px",
          padding: "24px",
          boxShadow: "0 18px 40px rgba(0,0,0,0.34)"
        }}
      >
        <div
          style={{
            fontSize: "11px",
            textTransform: "uppercase",
            letterSpacing: "0.22em",
            color: "#f59e0b",
            fontWeight: 800
          }}
        >
          VoterSpheres
        </div>
        <h1 style={{ marginTop: "12px", fontSize: "28px", marginBottom: "8px" }}>
          Page not found
        </h1>
        <p style={{ color: "#98a2b3", lineHeight: 1.6 }}>
          This route does not exist in the current app build.
        </p>
      </div>
    </div>
  );
}

function AppRoutes() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        {/* public/auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/pricing" element={<Pricing />} />

        {/* app shell routes */}
        <Route
          path="/*"
          element={
            <AppShell>
              <Routes>
                {/* primary canonical routes */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/candidates" element={<Candidates />} />
                <Route path="/map" element={<ElectionMap />} />
                <Route path="/donors" element={<DonorNetwork />} />
                <Route path="/forecast" element={<ElectionForecast />} />
                <Route path="/power-rankings" element={<PowerRankings />} />
                <Route path="/fundraising" element={<FundraisingDashboard />} />
                <Route path="/vendors" element={<Vendors />} />
                <Route path="/consultants" element={<ConsultantMarketplace />} />
                <Route path="/ai-chat" element={<AIChat />} />
                <Route path="/war-room" element={<AIWarRoom />} />
                <Route path="/command-center" element={<CommandCenter />} />
                <Route path="/campaign-workspace" element={<CampaignWorkspace />} />
                <Route path="/campaign-workspace/:id" element={<CampaignWorkspace />} />
                <Route path="/billing" element={<Billing />} />

                {/* backward-compatible aliases */}
                <Route path="/consultant-marketplace" element={<Navigate to="/consultants" replace />} />
                <Route path="/consultants-marketplace" element={<Navigate to="/consultants" replace />} />
                <Route path="/aichat" element={<Navigate to="/ai-chat" replace />} />
                <Route path="/chat" element={<Navigate to="/ai-chat" replace />} />
                <Route path="/warroom" element={<Navigate to="/war-room" replace />} />
                <Route path="/ai-war-room" element={<Navigate to="/war-room" replace />} />
                <Route path="/fundraising-dashboard" element={<Navigate to="/fundraising" replace />} />
                <Route path="/rankings" element={<Navigate to="/power-rankings" replace />} />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </AppShell>
          }
        />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ErrorBoundary>
  );
}
