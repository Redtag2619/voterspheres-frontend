import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./components/AppShell";

import Dashboard from "./pages/Dashboard";
import Forecast from "./pages/Forecast";
import ElectionMap from "./pages/ElectionMap";
import Firms from "./pages/Firms";
import CampaignPipeline from "./pages/CampaignPipeline";
import CampaignWorkspace from "./pages/CampaignWorkspace";

function NotFound() {
  return (
    <div className="min-h-screen bg-[#060b14] p-6 text-white">
      <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-[#0b1220] p-10 text-center shadow-2xl">
        <div className="text-xs uppercase tracking-[0.24em] text-cyan-300">
          VoterSpheres
        </div>
        <h1 className="mt-3 text-3xl font-semibold">Page not found</h1>
        <p className="mt-3 text-sm text-slate-400">
          The route you requested does not exist in the current platform shell.
        </p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Navigate to="/" replace />} />
          <Route path="/forecast" element={<Forecast />} />
          <Route path="/election-map" element={<ElectionMap />} />
          <Route path="/firms" element={<Firms />} />
          <Route path="/campaigns" element={<CampaignPipeline />} />
          <Route path="/campaigns/:id" element={<CampaignWorkspace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}
