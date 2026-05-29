import { Suspense, lazy } from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import AppShell from "./components/AppShell";
import RequirePermission from "./components/RequirePermission.jsx";
import { ExecutiveFiltersProvider } from "./context/ExecutiveFiltersContext.jsx";
import { DemoModeProvider } from "./context/DemoModeContext.jsx";
import { WorkspaceProvider } from "./context/WorkspaceContext.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import { PERMISSIONS } from "./lib/permissions.js";
import AdminLiveIntelligence from "./pages/AdminLiveIntelligence";
import AdminAlerts from "./pages/AdminAlerts";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import PlanProtectedRoute from "./components/PlanProtectedRoute.jsx";
import RelationshipGraph from "./pages/RelationshipGraph";
import CommitteeIntel from "./pages/CommitteeIntel.jsx";

const LandingPage = lazy(() => import("./pages/LandingPage.jsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.jsx"));
const Candidates = lazy(() => import("./pages/Candidates.jsx"));
const CandidateProfilesAdmin = lazy(() => import("./pages/CandidateProfilesAdmin.jsx"));
const BetaAccessAdmin = lazy(() => import("./pages/BetaAccessAdmin.jsx"));
const FirmUsersAdmin = lazy(() => import("./pages/FirmUsersAdmin.jsx"));
const FirmInvitesAdmin = lazy(() => import("./pages/FirmInvitesAdmin.jsx"));
const EnterpriseLeadsAdmin = lazy(() => import("./pages/EnterpriseLeadsAdmin.jsx"));
const AcceptInvite = lazy(() => import("./pages/AcceptInvite.jsx"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword.jsx"));
const ResetPassword = lazy(() => import("./pages/ResetPassword.jsx"));
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
const EnterpriseLeadIntake = lazy(() =>import("./pages/EnterpriseLeadIntake.jsx"));
const CampaignOpportunityHeatmap = lazy(() => import("./pages/CampaignOpportunityHeatmap.jsx"));
const ConsultantIntel = lazy(() => import("./pages/ConsultantIntel"));
const ConsultantProfile = lazy(() => import("./pages/ConsultantProfile"));
const DarkMoneyExposure = lazy(() => import("./pages/DarkMoneyExposure.jsx"));
const ExecutiveOperationsMap = lazy(() => import("./pages/ExecutiveOperationsMap.jsx"));
const StateOperationsDrilldown = lazy(() => import("./pages/StateOperationsDrilldown.jsx"));

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
        <WorkspaceProvider>
          <AppShell />
        </WorkspaceProvider>
      </ExecutiveFiltersProvider>
    </DemoModeProvider>
  );
}

function RequireAuth() {
  const { loading, user, token } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingScreen />;

  const isAuthenticated = Boolean(user || token);

  if (!isAuthenticated) {
    const next = encodeURIComponent(`${location.pathname}${location.search}${location.hash}`);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  return <Outlet />;
}

function PublicOnly() {
  const { loading, user, token } = useAuth();

  if (loading) return <LoadingScreen />;

  const isAuthenticated = Boolean(user || token);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

function AppRoutes() {
  const { loading } = useAuth();

  if (loading) return <LoadingScreen />;

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/accept-invite" element={<AcceptInvite />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        <Route element={<PublicOnly />}>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Route>

        <Route element={<RequireAuth />}>
          <Route element={<ShellLayout />}>
            <Route path="/app" element={<Navigate to="/dashboard" replace />} />

            <Route element={<RequirePermission permissions={[PERMISSIONS.VIEW_DASHBOARD]} />}>
              <Route path="/dashboard" element={<Dashboard />} />
            </Route>

            <Route element={<RequirePermission permissions={[PERMISSIONS.VIEW_CANDIDATES]} />}>
              <Route path="/candidates" element={<Candidates />} />
            </Route>

            <Route element={<RequirePermission permissions={[PERMISSIONS.VIEW_CANDIDATE_ADMIN]} />}>
              <Route path="/admin/candidate-profiles" element={<CandidateProfilesAdmin />} />
            </Route>

            <Route path="/admin/beta-access" element={<BetaAccessAdmin />} />
            <Route path="/admin/live-intelligence" element={<AdminLiveIntelligence />} />
            <Route path="/admin/alerts" element={<AdminAlerts />} />

            <Route element={<RequirePermission permissions={[PERMISSIONS.VIEW_FIRM_USERS]} />}>
              <Route path="/admin/firm-users" element={<FirmUsersAdmin />} />
            </Route>

            <Route element={<RequirePermission permissions={[PERMISSIONS.VIEW_FIRM_INVITES]} />}>
              <Route path="/admin/firm-invites" element={<FirmInvitesAdmin />} />
            </Route>

            <Route path="/enterprise" element={<EnterpriseLeadIntake />} />

            <Route element={<RequirePermission permissions={[PERMISSIONS.VIEW_ENTERPRISE_LEADS]} />}>
              <Route path="/admin/enterprise-leads" element={<EnterpriseLeadsAdmin />} />
            </Route>

            <Route element={<RequirePermission permissions={[PERMISSIONS.VIEW_MAP]} />}>
              <Route path="/map" element={<ElectionMap />} />
            </Route>

            <Route element={<RequirePermission permissions={[PERMISSIONS.VIEW_DONORS]} />}>
              <Route path="/donors" element={<DonorNetwork />} />
            </Route>

            <Route element={<RequirePermission permissions={[PERMISSIONS.VIEW_FORECAST]} />}>
              <Route path="/forecast" element={<ElectionForecast />} />
            </Route>

            <Route element={<RequirePermission permissions={[PERMISSIONS.VIEW_POWER_RANKINGS]} />}>
              <Route path="/power-rankings" element={<PowerRankings />} />
            </Route>

            <Route element={<RequirePermission permissions={[PERMISSIONS.VIEW_FUNDRAISING]} />}>
              <Route path="/fundraising" element={<FundraisingDashboard />} />
            </Route>

            <Route element={<RequirePermission permissions={[PERMISSIONS.VIEW_VENDORS]} />}>
              <Route path="/vendors" element={<Vendors />} />
            </Route>

            <Route element={<RequirePermission permissions={[PERMISSIONS.VIEW_CONSULTANTS]} />}>
              <Route path="/consultants" element={<ConsultantMarketplace />} />
            </Route>

            <Route element={<RequirePermission permissions={[PERMISSIONS.VIEW_CONSULTANTS]} />}>
              <Route path="/campaign-opportunity-heatmap" element={<CampaignOpportunityHeatmap />} />
            </Route>

            <Route element={<RequirePermission permissions={[PERMISSIONS.VIEW_AI_CHAT]} />}>
              <Route path="/ai-chat" element={<AIChat />} />
            </Route>

            <Route element={<RequirePermission permissions={[PERMISSIONS.VIEW_WAR_ROOM]} />}>
              <Route path="/war-room" element={<AIWarRoom />} />
            </Route>

            <Route element={<RequirePermission permissions={[PERMISSIONS.VIEW_COMMAND_CENTER]} />}>
              <Route path="/command-center" element={<CommandCenter />} />
              <Route path="/campaign-workspace" element={<CampaignWorkspace />} />
              <Route path="/campaign-workspace/:id" element={<CampaignWorkspace />} />
              <Route path="/relationship-graph" element={<RelationshipGraph />} />
              <Route path="/dark-money-exposure" element={<DarkMoneyExposure />} />
              <Route path="/consultant-intel" element={<ConsultantIntel />} />
              <Route path="/consultants/:id" element={<ConsultantProfile />} />
              <Route path="/committee-intel" element={<CommitteeIntel />} />
              <Route path="/operations-map" element={<ExecutiveOperationsMap />} />
            </Route>

            <Route element={<RequirePermission permissions={[PERMISSIONS.VIEW_MAILOPS]} />}>
              <Route path="/mailops" element={<MailOpsDashboard />} />
            </Route>

            <Route element={<RequirePermission permissions={[PERMISSIONS.VIEW_BILLING]} />}>
              <Route path="/billing" element={<Billing />} />
            </Route>

            <Route path="/consultant-marketplace" element={<Navigate to="/consultants" replace />} />
            <Route path="/aichat" element={<Navigate to="/ai-chat" replace />} />
            <Route path="/warroom" element={<Navigate to="/war-room" replace />} />
            <Route path="/fundraising-dashboard" element={<Navigate to="/fundraising" replace />} />
            <Route path="/rankings" element={<Navigate to="/power-rankings" replace />} />
            <Route path="/mail-ops" element={<Navigate to="/mailops" replace />} />
          </Route>
          
            <Route path="/state-operations/:state" element={<ProtectedRoute> <AppShell> <StateOperationsDrilldown /> </AppShell></ProtectedRoute>} />
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
