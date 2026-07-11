import { Suspense, lazy } from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";  
import ErrorBoundary from "./components/ErrorBoundary.jsx"; 
import VirtualTour from "./components/VirtualTour.jsx";
import AppShell from "./components/AppShell";
import RequirePermission from "./components/RequirePermission.jsx";
import { ExecutiveFiltersProvider } from "./context/ExecutiveFiltersContext.jsx";
import { DemoModeProvider } from "./context/DemoModeContext.jsx"; 
import { WorkspaceProvider } from "./context/WorkspaceContext.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import { PERMISSIONS } from "./lib/permissions.js";
import AdminLiveIntelligence from "./pages/AdminLiveIntelligence";
import AdminAlerts from "./pages/AdminAlerts";
import RelationshipGraph from "./pages/RelationshipGraph";
import CommitteeIntel from "./pages/CommitteeIntel.jsx";
import ExecutiveDecisionIntelligence from "./pages/ExecutiveDecisionIntelligence";
import PredictiveCampaignSimulation from "./pages/PredictiveCampaignSimulation";
import NationalPoliticalDigitalTwin from "./pages/NationalPoliticalDigitalTwin";
import AutonomousCampaignOperations from "./pages/AutonomousCampaignOperations";
import ExecutiveAICommandPlatform from "./pages/ExecutiveAICommandPlatform";
import CampaignOperationsStudioAI from "./pages/CampaignOperationsStudioAI";
import StateOperationsMap from "./pages/StateOperationsMap";

const LandingPage = lazy(() => import("./pages/LandingPage.jsx"));
const PlatformTour = lazy(() => import("./pages/PlatformTour.jsx"));
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
const PowerRankings = lazy(() => import("./pages/PowerRankings.jsx"));
const FundraisingDashboard = lazy(() => import("./pages/FundraisingDashboard.jsx"));
const Vendors = lazy(() => import("./pages/Vendors.jsx"));
const ConsultantMarketplace = lazy(() => import("./pages/ConsultantMarketplace.jsx"));
const AIChat = lazy(() => import("./pages/AIChat.jsx"));
const AIWarRoom = lazy(() => import("./pages/AIWarRoom.jsx"));
const CommandCenter = lazy(() => import("./pages/CommandCenter.jsx"));
const CampaignWorkspace = lazy(() => import("./pages/CampaignWorkspace.jsx"));
const CampaignWorkspaces = lazy(() => import("./pages/CampaignWorkspaces.jsx"));
const AITacticalIntelligence = lazy(() => import("./pages/AITacticalIntelligence.jsx"));
const Billing = lazy(() => import("./pages/Billing.jsx"));
const Pricing = lazy(() => import("./pages/Pricing.jsx"));
const Login = lazy(() => import("./pages/Login.jsx"));
const Signup = lazy(() => import("./pages/Signup.jsx"));
const MailOpsDashboard = lazy(() => import("./pages/MailOpsDashboard.jsx"));
const EnterpriseLeadIntake = lazy(() => import("./pages/EnterpriseLeadIntake.jsx"));
const CampaignOpportunityHeatmap = lazy(() => import("./pages/CampaignOpportunityHeatmap.jsx"));
const ConsultantIntel = lazy(() => import("./pages/ConsultantIntel"));
const ConsultantProfile = lazy(() => import("./pages/ConsultantProfile"));
const DarkMoneyExposure = lazy(() => import("./pages/DarkMoneyExposure.jsx"));
const ExecutiveOperationsMap = lazy(() => import("./pages/ExecutiveOperationsMap.jsx"));
const StateOperationsDrilldown = lazy(() => import("./pages/StateOperationsDrilldown.jsx"));
const StateOperationsIndex = lazy(() => import("./pages/StateOperationsIndex.jsx"));
const LivePoliticalSignals = lazy(() => import("./pages/LivePoliticalSignals.jsx"));
const NarrativeRapidResponse = lazy(() => import("./pages/NarrativeRapidResponse.jsx"));
const SignalWorkspaceMatching = lazy(() => import("./pages/SignalWorkspaceMatching.jsx"));
const NewsNarrativeIntelligence = lazy(() => import("./pages/NewsNarrativeIntelligence.jsx"));
const TaskOwnership = lazy(() => import("./pages/TaskOwnership.jsx"));
const CampaignWorkspaceCRM = lazy(() => import("./pages/CampaignWorkspaceCRM.jsx"));
const ExecutiveMissionControl = lazy(() => import("./pages/ExecutiveMissionControl.jsx"));
const AIStrategicAdvisor = lazy(() => import("./pages/AIStrategicAdvisor.jsx"));
const IntelligenceReports = lazy(() => import("./pages/IntelligenceReports.jsx"));
const AICampaignCopilot = lazy(() => import("./pages/AICampaignCopilot.jsx"));
const ClientPortalAdmin = lazy(() => import("./pages/ClientPortalAdmin.jsx"));
const ClientPortalView = lazy(() => import("./pages/ClientPortalView.jsx"));
const ReportExportCenter = lazy(() => import("./pages/ReportExportCenter.jsx"));
const NationalElectionCommandCenter = lazy(() => import("./pages/NationalElectionCommandCenter.jsx"));
const ConsultantBusinessSuite = lazy(() => import("./pages/ConsultantBusinessSuite.jsx"));
const ExecutiveRevenueIntelligence = lazy(() => import("./pages/ExecutiveRevenueIntelligence.jsx"));
const PoliticalIntelligenceGraph = lazy(() => import("./pages/PoliticalIntelligenceGraph.jsx"));
const NotificationCenter = lazy(() => import("./pages/NotificationCenter.jsx"));
const ExecutiveWorkspace = lazy(() => import("./pages/ExecutiveWorkspace.jsx"));
const UniversalSearch = lazy(() => import("./pages/UniversalSearch.jsx"));
const LiveIntelligenceLayer = lazy(() => import("./pages/LiveIntelligenceLayer.jsx"));
const OpportunityEngine = lazy(() => import("./pages/OpportunityEngine.jsx"));
const ProductionHardeningCenter = lazy(() => import("./pages/ProductionHardeningCenter.jsx"));
const LaunchQACenter = lazy(() => import("./pages/LaunchQACenter.jsx"));
const LaunchReadinessDashboard = lazy(() => import("./pages/LaunchReadinessDashboard.jsx"));
const DatabaseStabilityCenter = lazy(() => import("./pages/DatabaseStabilityCenter.jsx"));
const RevenuePipeline = lazy(() => import("./pages/RevenuePipeline.jsx"));
const LaunchAssetCenter = lazy(() => import("./pages/LaunchAssetCenter.jsx"));
const BetaOnboardingCenter = lazy(() => import("./pages/BetaOnboardingCenter.jsx"));
const LaunchDataSeeder = lazy(() => import("./pages/LaunchDataSeeder.jsx"));
const LiveDataRefreshCenter = lazy(() => import("./pages/LiveDataRefreshCenter.jsx"));
const LaunchAutomationEngine = lazy(() => import("./pages/LaunchAutomationEngine.jsx"));
const EndorsementIntelligence = lazy(() => import("./pages/EndorsementIntelligence.jsx"));
const PlatformIntelligenceGraph = lazy(() => import("./pages/PlatformIntelligenceGraph.jsx"));
const PoliticalRelationshipGraph = lazy(() => import("./pages/PoliticalRelationshipGraph.jsx"));
const InfluenceDashboard = lazy(() => import("./pages/InfluenceDashboard.jsx"));
const ExecutiveForecastDashboard = lazy(() => import("./pages/ExecutiveForecastDashboard.jsx"));
const CoalitionIntelligenceDashboard = lazy(() => import("./pages/CoalitionIntelligenceDashboard.jsx"));
const StrategyRecommendationDashboard = lazy(() => import("./pages/StrategyRecommendationDashboard.jsx"));
const CampaignFinanceIntelligencePlatform = lazy(() => import("./pages/CampaignFinanceIntelligencePlatform.jsx"));
const CrossWorkspaceExecutiveDashboard = lazy(() => import("./pages/CrossWorkspaceExecutiveDashboard.jsx")
);

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
          <VirtualTour />
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
  return <Navigate to="/executive-workspace" replace />;
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
            <Route path="/app" element={<Navigate to="/executive-workspace" replace />} />

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
              <Route path="/election-forecast" element={<Navigate to="/forecast" replace />}/>
            </Route>

            <Route element={<RequirePermission permissions={[PERMISSIONS.VIEW_POWER_RANKINGS]} />}>
              <Route path="/power-rankings" element={<PowerRankings />} />
            </Route>

            <Route element={<RequirePermission permissions={[PERMISSIONS.VIEW_FUNDRAISING]} />}>
              <Route path="/fundraising" element={<FundraisingDashboard />} />
              <Route path="/campaign-finance-intelligence" element={<CampaignFinanceIntelligencePlatform />} />
            </Route>

            <Route element={<RequirePermission permissions={[PERMISSIONS.VIEW_VENDORS]} />}>
              <Route path="/vendors" element={<Vendors />} />
            </Route>

            <Route element={<RequirePermission permissions={[PERMISSIONS.VIEW_CONSULTANTS]} />}>
              <Route path="/consultants" element={<ConsultantMarketplace />} />
              <Route path="/campaign-opportunity-heatmap" element={<CampaignOpportunityHeatmap />} />
            </Route>

            <Route element={<RequirePermission permissions={[PERMISSIONS.VIEW_AI_CHAT]} />}>
              <Route path="/ai-chat" element={<AIChat />} />
            </Route>

            <Route element={<RequirePermission permissions={[PERMISSIONS.VIEW_WAR_ROOM]} />}>
              <Route path="/war-room" element={<AIWarRoom />} />
              <Route path="/ai-war-room" element={<AIWarRoom />} />
            </Route>

              <Route element={<RequirePermission permissions={[PERMISSIONS.VIEW_COMMAND_CENTER]} />}>
              <Route path="/command-center" element={<CommandCenter />} />
              <Route path="/campaign-workspace" element={<CampaignWorkspaces />} />
              <Route path="/campaign-workspace/:id" element={<CampaignWorkspaces />} />
              <Route path="/ai-tactical" element={<AITacticalIntelligence />} />
              <Route path="/workspaces" element={<CampaignWorkspaces />} />
              <Route path="/executive-intelligence" element={<CrossWorkspaceExecutiveDashboard />} />
              <Route path="/political-signals" element={<LivePoliticalSignals />} />
              <Route path="/relationship-graph" element={<RelationshipGraph />} />
              <Route path="/dark-money-exposure" element={<DarkMoneyExposure />} />
              <Route path="/consultant-intel" element={<ConsultantIntel />} />
              <Route path="/consultants/:id" element={<ConsultantProfile />} />
              <Route path="/committee-intel" element={<CommitteeIntel />} />
              <Route path="/operations-map" element={<ExecutiveOperationsMap />} />
              <Route path="/executive-map" element={<Navigate to="/operations-map" replace />} />
              <Route path="/executive-operations-map" element={<Navigate to="/operations-map" replace />} />
              <Route path="/state-operations" element={<StateOperationsIndex />} />
              <Route path="/state-operations/:state" element={<StateOperationsDrilldown />} />
              <Route path="/narrative-intelligence" element={<NewsNarrativeIntelligence />} />
              <Route path="/signal-matching" element={<SignalWorkspaceMatching />} />
              <Route path="/narrative-response" element={<NarrativeRapidResponse />} />
              <Route path="/task-ownership" element={<TaskOwnership />} />
              <Route path="/state-operations-map" element={<StateOperationsMap />} />
              <Route path="/mission-control" element={<ExecutiveMissionControl />} />
              <Route path="/strategic-advisor" element={<AIStrategicAdvisor />} />
              <Route path="/intelligence-reports" element={<IntelligenceReports />} />
              <Route path="/political-graph" element={<PoliticalRelationshipGraph />} />
              <Route path="/campaign-copilot" element={<AICampaignCopilot />} />
              <Route path="/client-portal/:token" element={<ClientPortalView />} />
              <Route path="/client-portal-admin" element={<ClientPortalAdmin />} />
              <Route path="/report-exports" element={<ReportExportCenter />} />
              <Route path="/national-command" element={<NationalElectionCommandCenter />} />
              <Route path="/business-suite" element={<ConsultantBusinessSuite />} />
              <Route path="/revenue-intelligence" element={<ExecutiveRevenueIntelligence />} />
              <Route path="/political-intelligence" element={<PoliticalIntelligenceGraph />} />
              <Route path="/notifications" element={<NotificationCenter />} />
              <Route path="/executive-workspace" element={<ExecutiveWorkspace />} />
              <Route path="/search" element={<UniversalSearch />} />
              <Route path="/live-intelligence-layer" element={<LiveIntelligenceLayer />} />
              <Route path="/opportunity-engine" element={<OpportunityEngine />} />
              <Route path="/production-hardening" element={<ProductionHardeningCenter />} />
              <Route path="/launch-qa" element={<LaunchQACenter />} />
              <Route path="/launch-readiness" element={<LaunchReadinessDashboard />} />
              <Route path="/database-stability" element={<DatabaseStabilityCenter />} />
              <Route path="/revenue-pipeline" element={<RevenuePipeline />} />
              <Route path="/launch-assets" element={<LaunchAssetCenter />} />
              <Route path="/beta-onboarding" element={<BetaOnboardingCenter />} />
              <Route path="/launch-data-seeder" element={<LaunchDataSeeder />} />
              <Route path="/live-data-refresh" element={<LiveDataRefreshCenter />} />
              <Route path="/launch-automation" element={<LaunchAutomationEngine />} />
              <Route path="/platform-tour" element={<PlatformTour />} />
              <Route path="/endorsements" element={<EndorsementIntelligence />} />
              <Route path="/platform-intelligence" element={<PlatformIntelligenceGraph />} />
              <Route path="/influence" element={<InfluenceDashboard />} />
              <Route path="/forecast" element={<ExecutiveForecastDashboard />} />
              <Route path="/coalitions" element={<CoalitionIntelligenceDashboard />} />
              <Route path="/strategy" element={<StrategyRecommendationDashboard />} />
              <Route path="/executive-decision-intelligence" element={<ExecutiveDecisionIntelligence />} />
              <Route path="/national-political-digital-twin" element={<NationalPoliticalDigitalTwin />} />
              <Route path="/predictive-campaign-simulation" element={<PredictiveCampaignSimulation />} />
              <Route path="/autonomous-campaign-operations" element={<AutonomousCampaignOperations />} />
              <Route path="/strategy-recommendation-dashboard" element={<StrategyRecommendationDashboard />} />
              <Route path="/executive-ai-command-platform" element={<ExecutiveAICommandPlatform />} />
              <Route path="/campaign-operations-studio" element={<CampaignOperationsStudioAI />} />
              <Route path="/campaign-crm" element={<CampaignWorkspaceCRM />} />
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
