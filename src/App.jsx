import { BrowserRouter, Routes, Route } from "react-router-dom"

import Dashboard from "./pages/Dashboard"
import Candidates from "./pages/Candidates"
import ElectionMap from "./pages/ElectionMap"
import DonorNetwork from "./pages/DonorNetwork"
import AIWarRoom from "./pages/AIWarRoom"

import Navbar from "./components/Navbar"

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/candidates" element={<Candidates />} />
        <Route path="/map" element={<ElectionMap />} />
        <Route path="/donors" element={<DonorNetwork />} />
        <Route path="/warroom" element={<AIWarRoom />} />
      </Routes>
    </BrowserRouter>
  )
}
