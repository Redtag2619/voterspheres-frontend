import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import AppShell from "./app/layout/AppShell";
import ProtectedRoute from "./components/ProtectedRoute";

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
            <Route path="/donors" element={<DonorNetwork />} />
            <Route path="/warroom" element={<AIWarRoom />} />
            <Route path="/ai" element={<AIChat />} />
            <Route path="/forecast" element={<ElectionForecast />} />
            <Route path="/fundraising" element={<FundraisingDashboard />} />
            <Route path="/rankings" element={<PowerRankings />} />
            <Route path="/marketplace" element={<ConsultantMarketplace />} />
            <Route path="/simulator" element={<CampaignSimulator />} />
            <Route path="/command-center" element={<CommandCenter />} />

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
