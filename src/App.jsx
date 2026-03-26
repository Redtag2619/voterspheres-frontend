import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import AppShell from "./app/layout/AppShell";
import ProtectedRoute from "./components/ProtectedRoute";
import PlanProtectedRoute from "./components/PlanProtectedRoute";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Candidates = lazy(() => import("./pages/Candidates"));
const ElectionMap = lazy(() => import("./pages/ElectionMap"));
const DonorNetwork = lazy(() => import("./pages/DonorNetwork"));
const AIWarRoom = lazy(() => import("./pages/AIWarRoom"));
const AIChat = lazy(() => import("./pages/AIChat"));
const ElectionForecast = lazy(() => import("./pages/ElectionForecast"));
const FundraisingDashboard = lazy(() => import("./pages/FundraisingDashboard"));
const PowerRankings = lazy(() => import("./pages/PowerRankings"));
const ConsultantMarketplace = lazy(() => import("./pages/ConsultantMarketplace"));
const CampaignSimulator = lazy(() => import("./pages/CampaignSimulator"));
const CommandCenter = lazy(() => import("./pages/CommandCenter"));
const Billing = lazy(() => import("./pages/Billing"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));

function LoadingScreen() {
  return <div className="vs-loading-screen">Loading VoterSpheres...</div>;
}

function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/candidates" element={<Candidates />} />
            <Route path="/map" element={<ElectionMap />} />

            <Route
              path="/donors"
              element={
                <PlanProtectedRoute requiredPlan="enterprise">
                  <DonorNetwork />
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
              path="/fundraising"
              element={
                <PlanProtectedRoute requiredPlan="enterprise">
                  <FundraisingDashboard />
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
              path="/command-center"
              element={
                <PlanProtectedRoute requiredPlan="pro">
                  <CommandCenter />
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
    </BrowserRouter>
  );
}

export default App;
