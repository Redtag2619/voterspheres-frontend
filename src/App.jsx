import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AppShell from "./components/AppShell";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Forecast from "./pages/Forecast";
import ElectionMap from "./pages/ElectionMap";
import Firms from "./pages/Firms";
import FirmWorkspace from "./pages/FirmWorkspace";
import CampaignPipeline from "./pages/CampaignPipeline";
import CampaignWorkspace from "./pages/CampaignWorkspace";
import Vendors from "./pages/Vendors";
import MailOpsDashboard from "./pages/MailOpsDashboard";
import Billing from "./pages/Billing";
import PlanProtectedRoute from "./components/PlanProtectedRoute";

function NotFound() {
  return (
    <div className="min-h-screen bg-[#f3f6f9] p-6 text-slate-900">
      <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <div className="text-xs uppercase tracking-[0.24em] text-[#0176D3]">
          VoterSpheres
        </div>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">
          Page not found
        </h1>
        <p className="mt-3 text-sm text-slate-500">
          The route you requested does not exist in the current platform shell.
        </p>
      </div>
    </div>
  );
}

function ProtectedApp() {
  return (
    <ProtectedRoute>
      <AppShell>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Navigate to="/" replace />} />
          <Route path="/forecast" element={<Forecast />} />
          <Route path="/election-map" element={<ElectionMap />} />
          <Route path="/firms" element={<Firms />} />
          <Route path="/firms/:id" element={<FirmWorkspace />} />
          <Route path="/campaigns" element={<CampaignPipeline />} />
          <Route path="/campaigns/:id" element={<CampaignWorkspace />} />
          <Route path="/vendors" element={<Vendors />} />
          <Route path="/mailops" element={<MailOpsDashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AppShell>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/*" element={<ProtectedApp />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
