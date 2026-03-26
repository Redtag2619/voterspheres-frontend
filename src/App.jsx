import { BrowserRouter, Routes, Route } from "react-router-dom";

import AppShell from "./components/AppShell";

import Dashboard from "./pages/Dashboard";
import Candidates from "./pages/Candidates";
import ElectionMap from "./pages/ElectionMap";
import DonorNetwork from "./pages/DonorNetwork";
import AIWarRoom from "./pages/AIWarRoom";
import ElectionForecast from "./pages/ElectionForecast";
import FundraisingDashboard from "./pages/FundraisingDashboard";
import ConsultantMarketplace from "./pages/ConsultantMarketplace";
import CommandCenter from "./pages/CommandCenter";
import CampaignSimulator from "./pages/CampaignSimulator";
import PowerRankings from "./pages/PowerRankings";
import Billing from "./pages/Billing";

export default function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/candidates" element={<Candidates />} />
          <Route path="/map" element={<ElectionMap />} />
          <Route path="/donors" element={<DonorNetwork />} />
          <Route path="/warroom" element={<AIWarRoom />} />
          <Route path="/forecast" element={<ElectionForecast />} />
          <Route path="/fundraising" element={<FundraisingDashboard />} />
          <Route path="/consultants" element={<ConsultantMarketplace />} />
          <Route path="/command-center" element={<CommandCenter />} />
          <Route path="/simulator" element={<CampaignSimulator />} />
          <Route path="/rankings" element={<PowerRankings />} />
          <Route path="/billing" element={<Billing />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}
