import React from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import TickerBar from "./TickerBar";

function AppShell({ children }) {
  return (
    <div className="vs-app-shell">
      <Sidebar />

      <div className="vs-main-region">
        <TopBar />
        <TickerBar />

        <main className="vs-page-content">
          {children}
        </main>
      </div>
    </div>
  );
}

export default AppShell;
