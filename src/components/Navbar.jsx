import React from "react";
import { Link } from "react-router-dom";

function Navbar() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "14px 24px",
        background: "rgba(2,6,23,.9)",
        borderBottom: "1px solid rgba(255,255,255,.08)",
        position: "sticky",
        top: 0,
        zIndex: 999
      }}
    >
      <h2 style={{ margin: 0, color: "#38bdf8" }}>
        VoterSpheres
      </h2>

      <div style={{ display: "flex", gap: "18px" }}>
        <Link className="nav-link" to="/command-center">Command</Link>
        <Link className="nav-link" to="/candidates">Candidates</Link>
        <Link className="nav-link" to="/map">Map</Link>
        <Link className="nav-link" to="/donors">Donors</Link>
        <Link className="nav-link" to="/warroom">War Room</Link>
        <Link className="nav-link" to="/forecast">Forecast</Link>
        <Link className="nav-link" to="/fundraising">Fundraising</Link>
        <Link className="nav-link" to="/rankings">Rankings</Link>
        <Link className="nav-link" to="/marketplace">Marketplace</Link>
        <Link className="nav-link" to="/simulator">Simulator</Link>
        <Link className="nav-link" to="/ai">AI</Link>
      </div>
    </div>
  );
}

export default Navbar;
