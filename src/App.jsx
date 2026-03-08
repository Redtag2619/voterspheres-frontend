import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";

import Dashboard from "./pages/Dashboard";
import Candidates from "./pages/Candidates";
import ElectionMap from "./pages/ElectionMap";
import DonorNetwork from "./pages/DonorNetwork";
import AIWarRoom from "./pages/AIWarRoom";
import AIChat from "./pages/AIChat";
import ElectionForecast from "./pages/ElectionForecast";
import FundraisingDashboard from "./pages/FundraisingDashboard";
import PowerRankings from "./pages/PowerRankings";
import ConsultantMarketplace from "./pages/ConsultantMarketplace";
import CampaignSimulator from "./pages/CampaignSimulator";
import CommandCenter from "./pages/CommandCenter";

function App() {
  return (
    <BrowserRouter>
      <Navbar />

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
    </BrowserRouter>
  );
}

export default App;
