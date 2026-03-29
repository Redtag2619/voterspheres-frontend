import React, { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";

import AppShell from "./app/layout/AppShell";
import AppWideOnboardingCelebration from "./components/AppWideOnboardingCelebration";
import OnboardingRouteTracker from "./components/OnboardingRouteTracker";
import ProtectedRoute from "./components/ProtectedRoute";
import PlanProtectedRoute from "./components/PlanProtectedRoute";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Pricing = lazy(() => import("./pages/Pricing"));
const CheckoutSuccess = lazy(() => import("./pages/CheckoutSuccess"));
const Candidates = lazy(() => import("./pages/Candidates"));
const ElectionMap = lazy(() => import("./pages/ElectionMap"));
const Vendors = lazy(() => import("./pages/Vendors"));
const AIWarRoom = lazy(() => import("./pages/AIWarRoom"));
const AIChat = lazy(() => import("./pages/AIChat"));
const ElectionForecast = lazy(() => import("./pages/ElectionForecast"));
const Forecast = lazy(() => import("./pages/Forecast"));
const PowerRankings = lazy(() => import("./pages/PowerRankings"));
const AlertsCenter = lazy(() => import("./pages/AlertsCenter"));
const CampaignSimulator = lazy(() => import("./pages/CampaignSimulator"));
const CommandCenter = lazy(() => import("./pages/CommandCenter"));
const CampaignPipeline = lazy(() => import("./pages/CampaignPipeline"));
const CampaignWorkspace = lazy(() => import("./pages/CampaignWorkspace"));
const DonorNetwork = lazy(() => import("./pages/DonorNetwork"));
const FundraisingDashboard = lazy(() => import("./pages/FundraisingDashboard"));
const ConsultantMarketplace = lazy(() => import("./pages/ConsultantMarketplace"));
const ExecutiveDashboard = lazy(() => import("./pages/ExecutiveDashboard"));
const MailOpsDashboard = lazy(() => import("./pages/MailOpsDashboard"));
const FirmWorkspace = lazy(() => import("./pages/FirmWorkspace"));
const Firms = lazy(() => import("./pages/Firms"));
const Billing = lazy(() => import("./pages/Billing"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));

function LoadingScreen() {
  return <div className="vs-loading-screen">Loading VoterSpheres...</div>;
}

function App() {
  return (
    <AppShell>
      <AppWideOnboardingCelebration />
      <OnboardingRouteTracker />

      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/pricing" element={<Pricing />} />

          <Route
            path="/checkout/success"
            element={
              <ProtectedRoute>
                <CheckoutSuccess />
              </ProtectedRoute>
            }
          />

          <Route path="/candidates" element={<Candidates />} />
          <Route path="/map" element={<ElectionMap />} />
          <Route path="/vendors" element={<Vendors />} />

          <Route
            path="/campaign-pipeline"
            element={
              <PlanProtectedRoute requiredPlan="starter">
                <CampaignPipeline />
              </PlanProtectedRoute>
            }
          />
          <Route
            path="/campaign-workspace"
            element={
              <PlanProtectedRoute requiredPlan="starter">
                <CampaignWorkspace />
              </PlanProtectedRoute>
            }
          />
          <Route
            path="/firm-workspace"
            element={
              <PlanProtectedRoute requiredPlan="starter">
                <FirmWorkspace />
              </PlanProtectedRoute>
            }
          />
          <Route
            path="/firms"
            element={
              <PlanProtectedRoute requiredPlan="starter">
                <Firms />
              </PlanProtectedRoute>
            }
          />

          <Route
            path="/warroom"
            element={
              <PlanProtectedRoute requiredPlan="pro">
                <AIWarRoom />
              </PlanProtectedRoute>
            }
          />
          <Route
            path="/ai"
            element={
              <PlanProtectedRoute requiredPlan="pro">
                <AIChat />
              </PlanProtectedRoute>
            }
          />
          <Route
            path="/forecast"
            element={
              <PlanProtectedRoute requiredPlan="pro">
                <ElectionForecast />
              </PlanProtectedRoute>
            }
          />
          <Route
            path="/forecast-dashboard"
            element={
              <PlanProtectedRoute requiredPlan="pro">
                <Forecast />
              </PlanProtectedRoute>
            }
          />
          <Route
            path="/rankings"
            element={
              <PlanProtectedRoute requiredPlan="pro">
                <PowerRankings />
              </PlanProtectedRoute>
            }
          />
          <Route
            path="/command-center"
            element={
              <PlanProtectedRoute requiredPlan="pro">
                <CommandCenter />
              </PlanProtectedRoute>
            }
          />
          <Route
            path="/alerts"
            element={
              <PlanProtectedRoute requiredPlan="pro">
                <AlertsCenter />
              </PlanProtectedRoute>
            }
          />

          <Route
            path="/donors"
            element={
              <PlanProtectedRoute requiredPlan="enterprise">
                <DonorNetwork />
              </PlanProtectedRoute>
            }
          />
          <Route
            path="/fundraising"
            element={
              <PlanProtectedRoute requiredPlan="enterprise">
                <FundraisingDashboard />
              </PlanProtectedRoute>
            }
          />
          <Route
            path="/marketplace"
            element={
              <PlanProtectedRoute requiredPlan="enterprise">
                <ConsultantMarketplace />
              </PlanProtectedRoute>
            }
          />
          <Route
            path="/simulator"
            element={
              <PlanProtectedRoute requiredPlan="enterprise">
                <CampaignSimulator />
              </PlanProtectedRoute>
            }
          />
          <Route
            path="/executive-dashboard"
            element={
              <PlanProtectedRoute requiredPlan="enterprise">
                <ExecutiveDashboard />
              </PlanProtectedRoute>
            }
          />
          <Route
            path="/mailops"
            element={
              <PlanProtectedRoute requiredPlan="enterprise">
                <MailOpsDashboard />
              </PlanProtectedRoute>
            }
          />

          <Route
            path="/billing"
            element={
              <ProtectedRoute>
                <Billing />
              </ProtectedRoute>
            }
          />

          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Routes>
      </Suspense>
    </AppShell>
  );
}

export default App;
