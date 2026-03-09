import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";

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

function LoadingScreen() {
  return (
    <div
      style={{
        minHeight: "calc(100vh - 72px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#020617",
        color: "#e2e8f0",
        fontSize: "18px",
        padding: "24px"
      }}
    >
      Loading VoterSpheres...
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div style={{ minHeight: "100vh", background: "#020617" }}>
        <Navbar />

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
          </Routes>
        </Suspense>
      </div>
    </BrowserRouter>
  );
}

export default App;
