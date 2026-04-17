import { Suspense, lazy } from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import AppShell from "./components/AppShell";
import RequirePermission from "./components/auth/RequirePermission.jsx";
import { ExecutiveFiltersProvider } from "./context/ExecutiveFiltersContext.jsx";
import { DemoModeProvider } from "./context/DemoModeContext.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import { PERMISSIONS } from "./lib/permissions.js";

const LandingPage = lazy(() => import("./pages/LandingPage.jsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.jsx"));
const Candidates = lazy(() => import("./pages/Candidates.jsx"));
const CandidateProfilesAdmin = lazy(() => import("./pages/CandidateProfilesAdmin.jsx"));
const BetaAccessAdmin = lazy(() => import("./pages/BetaAccessAdmin.jsx"));
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
const MailOpsDashboard = lazy(() => import("./pages/MailOpsDashboard.jsx"));

function LoadingScreen() {
  return (
    <div className="vs-loading-screen">
      <div className="vs-loading-card">Loading VoterSpheres...</div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="vs-loading-screen">
      <div className="vs-loading-card">Page not found.</div>
    </div>
  );
}

function ShellLayout() {
  return (
    <DemoModeProvider>
      <ExecutiveFiltersProvider>
        <AppShell />
      </ExecutiveFiltersProvider>
    </DemoModeProvider>
  );
}

function RequireAuth() {
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

  return <Outlet />;
}

function PublicOnly() {
  const { loading, user, token } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  const isAuthenticated = Boolean(user || token);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

function AppRoutes() {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/pricing" element={<Pricing />} />

        <Route element={<PublicOnly />}>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Route>

        <Route element={<RequireAuth />}>
          <Route element={<ShellLayout />}>
            <Route path="/app" element={<Navigate to="/dashboard" replace />} />

            <Route
              element={<RequirePermission permissions={[PERMISSIONS.VIEW_DASHBOARD]} />}
            >
              <Route path="/dashboard" element={<Dashboard />} />
            </Route>

            <Route
              element={<RequirePermission permissions={[PERMISSIONS.VIEW_CANDIDATES]} />}
            >
              <Route path="/candidates" element={<Candidates />} />
            </Route>

            <Route
              element={
                <RequirePermission permissions={[PERMISSIONS.VIEW_CANDIDATE_ADMIN]} />
              }
            >
              <Route
                path="/admin/candidate-profiles"
                element={<CandidateProfilesAdmin />}
              />
            </Route>

            <Route
              element={<RequirePermission permissions={[PERMISSIONS.VIEW_BETA_ACCESS]} />}
            >
              <Route path="/admin/beta-access" element={<BetaAccessAdmin />} />
            </Route>

            <Route
              element={<RequirePermission permissions={[PERMISSIONS.VIEW_MAP]} />}
            >
              <Route path="/map" element={<ElectionMap />} />
            </Route>

            <Route
              element={<RequirePermission permissions={[PERMISSIONS.VIEW_DONORS]} />}
            >
              <Route path="/donors" element={<DonorNetwork />} />
            </Route>

            <Route
              element={<RequirePermission permissions={[PERMISSIONS.VIEW_FORECAST]} />}
            >
              <Route path="/forecast" element={<ElectionForecast />} />
            </Route>

            <Route
              element={<RequirePermission permissions={[PERMISSIONS.VIEW_POWER_RANKINGS]} />}
            >
              <Route path="/power-rankings" element={<PowerRankings />} />
            </Route>

            <Route
              element={<RequirePermission permissions={[PERMISSIONS.VIEW_FUNDRAISING]} />}
            >
              <Route path="/fundraising" element={<FundraisingDashboard />} />
            </Route>

            <Route
              element={<RequirePermission permissions={[PERMISSIONS.VIEW_VENDORS]} />}
            >
              <Route path="/vendors" element={<Vendors />} />
            </Route>

            <Route
              element={<RequirePermission permissions={[PERMISSIONS.VIEW_CONSULTANTS]} />}
            >
              <Route path="/consultants" element={<ConsultantMarketplace />} />
            </Route>

            <Route
              element={<RequirePermission permissions={[PERMISSIONS.VIEW_AI_CHAT]} />}
            >
              <Route path="/ai-chat" element={<AIChat />} />
            </Route>

            <Route
              element={<RequirePermission permissions={[PERMISSIONS.VIEW_WAR_ROOM]} />}
            >
              <Route path="/war-room" element={<AIWarRoom />} />
            </Route>

            <Route
              element={<RequirePermission permissions={[PERMISSIONS.VIEW_COMMAND_CENTER]} />}
            >
              <Route path="/command-center" element={<CommandCenter />} />
              <Route path="/campaign-workspace" element={<CampaignWorkspace />} />
              <Route path="/campaign-workspace/:id" element={<CampaignWorkspace />} />
            </Route>

            <Route
              element={<RequirePermission permissions={[PERMISSIONS.VIEW_MAILOPS]} />}
            >
              <Route path="/mailops" element={<MailOpsDashboard />} />
            </Route>

            <Route
              element={<RequirePermission permissions={[PERMISSIONS.VIEW_BILLING]} />}
            >
              <Route path="/billing" element={<Billing />} />
            </Route>

            <Route path="/consultant-marketplace" element={<Navigate to="/consultants" replace />} />
            <Route path="/aichat" element={<Navigate to="/ai-chat" replace />} />
            <Route path="/warroom" element={<Navigate to="/war-room" replace />} />
            <Route path="/fundraising-dashboard" element={<Navigate to="/fundraising" replace />} />
            <Route path="/rankings" element={<Navigate to="/power-rankings" replace />} />
            <Route path="/mail-ops" element={<Navigate to="/mailops" replace />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
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
