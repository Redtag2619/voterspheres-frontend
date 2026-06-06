import { useMemo, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { navigationSections, flattenedNavigation } from "../config/navigation";
import { useAuth } from "../context/AuthContext.jsx";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function getInitials(user) {
  const name = user?.name || user?.full_name || user?.email || "VS";
  return String(name)
    .split(/[ @.]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default function AppShell() {
  const location = useLocation();
  const { user, logout } = useAuth?.() || {};
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");

  const activeSection = useMemo(() => {
    return (
      navigationSections.find((section) =>
        section.items.some((item) => location.pathname === item.to)
      )?.label || "Executive Command"
    );
  }, [location.pathname]);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    return flattenedNavigation
      .filter((item) =>
        `${item.label} ${item.section} ${item.to}`.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [query]);

  return (
    <div className="vs-shell">
      <style>{`
        .vs-shell {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(37,99,235,.16), transparent 28%),
            radial-gradient(circle at bottom right, rgba(239,68,68,.10), transparent 28%),
            #020617;
          color: var(--vs-text, #e5e7eb);
          display: grid;
          grid-template-columns: 292px minmax(0, 1fr);
        }

        .vs-shell-sidebar {
          position: sticky;
          top: 0;
          height: 100vh;
          overflow: auto;
          border-right: 1px solid rgba(148,163,184,.14);
          background:
            linear-gradient(180deg, rgba(15,23,42,.98), rgba(2,6,23,.96));
          padding: 18px;
        }

        .vs-shell-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          color: white;
          margin-bottom: 18px;
        }

        .vs-shell-logo {
          width: 42px;
          height: 42px;
          border-radius: 16px;
          display: grid;
          place-items: center;
          background:
            radial-gradient(circle at 30% 30%, rgba(255,255,255,.55), transparent 24%),
            linear-gradient(135deg, #2563eb, #dc2626);
          font-weight: 950;
          letter-spacing: -.08em;
          box-shadow: 0 18px 50px rgba(37,99,235,.32);
        }

        .vs-shell-brand strong {
          display: block;
          font-size: 16px;
          letter-spacing: -.04em;
        }

        .vs-shell-brand span {
          display: block;
          margin-top: 2px;
          font-size: 11px;
          color: rgba(203,213,225,.62);
        }

        .vs-shell-search {
          position: relative;
          margin-bottom: 18px;
        }

        .vs-shell-search input {
          width: 100%;
          border-radius: 16px;
          border: 1px solid rgba(148,163,184,.16);
          background: rgba(15,23,42,.78);
          color: white;
          padding: 11px 12px;
          outline: none;
        }

        .vs-shell-search-results {
          position: absolute;
          z-index: 30;
          left: 0;
          right: 0;
          top: calc(100% + 8px);
          border-radius: 18px;
          border: 1px solid rgba(148,163,184,.16);
          background: rgba(2,6,23,.98);
          box-shadow: 0 24px 80px rgba(0,0,0,.45);
          padding: 8px;
        }

        .vs-shell-search-result {
          display: block;
          text-decoration: none;
          color: rgba(226,232,240,.94);
          padding: 10px;
          border-radius: 12px;
        }

        .vs-shell-search-result:hover {
          background: rgba(37,99,235,.16);
        }

        .vs-shell-search-result small {
          display: block;
          color: rgba(148,163,184,.72);
          margin-top: 3px;
        }

        .vs-shell-section {
          margin-bottom: 18px;
        }

        .vs-shell-section-title {
          color: rgba(148,163,184,.78);
          font-size: 10px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: .14em;
          margin: 0 0 8px;
          padding-left: 8px;
        }

        .vs-shell-nav {
          display: grid;
          gap: 4px;
        }

        .vs-shell-link {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          border-radius: 14px;
          padding: 10px 11px;
          text-decoration: none;
          color: rgba(226,232,240,.78);
          font-size: 13px;
          border: 1px solid transparent;
          transition: .16s ease;
        }

        .vs-shell-link:hover {
          color: white;
          background: rgba(15,23,42,.78);
          border-color: rgba(148,163,184,.12);
        }

        .vs-shell-link.active {
          color: white;
          background:
            radial-gradient(circle at top right, rgba(59,130,246,.22), transparent 36%),
            rgba(37,99,235,.16);
          border-color: rgba(96,165,250,.28);
        }

        .vs-shell-link-dot {
          width: 7px;
          height: 7px;
          border-radius: 999px;
          background: rgba(96,165,250,.84);
          opacity: 0;
        }

        .vs-shell-link.active .vs-shell-link-dot {
          opacity: 1;
        }

        .vs-shell-main {
          min-width: 0;
          display: grid;
          grid-template-rows: auto minmax(0, 1fr);
        }

        .vs-shell-topbar {
          position: sticky;
          top: 0;
          z-index: 20;
          min-height: 72px;
          border-bottom: 1px solid rgba(148,163,184,.12);
          background: rgba(2,6,23,.78);
          backdrop-filter: blur(18px);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 14px 22px;
        }

        .vs-shell-topbar-left {
          min-width: 0;
        }

        .vs-shell-eyebrow {
          color: rgba(148,163,184,.78);
          font-size: 10px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: .14em;
        }

        .vs-shell-current {
          margin-top: 4px;
          color: white;
          font-size: 16px;
          font-weight: 900;
          letter-spacing: -.03em;
        }

        .vs-shell-topbar-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .vs-shell-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border-radius: 999px;
          border: 1px solid rgba(148,163,184,.16);
          background: rgba(15,23,42,.72);
          color: rgba(226,232,240,.86);
          padding: 8px 10px;
          font-size: 12px;
          text-decoration: none;
        }

        .vs-shell-avatar {
          width: 34px;
          height: 34px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, rgba(37,99,235,.9), rgba(220,38,38,.8));
          color: white;
          font-size: 12px;
          font-weight: 900;
        }

        .vs-shell-content {
          min-width: 0;
          padding: 22px;
        }

        .vs-shell-mobile-button {
          display: none;
          border: 1px solid rgba(148,163,184,.18);
          background: rgba(15,23,42,.78);
          color: white;
          border-radius: 12px;
          padding: 9px 10px;
        }

        .vs-shell-logout {
          border: 0;
          cursor: pointer;
        }

        @media (max-width: 1040px) {
          .vs-shell {
            grid-template-columns: 1fr;
          }

          .vs-shell-sidebar {
            position: fixed;
            z-index: 50;
            inset: 0 auto 0 0;
            width: 292px;
            transform: translateX(-110%);
            transition: transform .18s ease;
          }

          .vs-shell-sidebar.open {
            transform: translateX(0);
          }

          .vs-shell-mobile-button {
            display: inline-flex;
          }

          .vs-shell-content {
            padding: 16px;
          }
        }
      `}</style>

      <aside className={cx("vs-shell-sidebar", mobileOpen && "open")}>
        <Link className="vs-shell-brand" to="/national-command" onClick={() => setMobileOpen(false)}>
          <div className="vs-shell-logo">VS</div>
          <div>
            <strong>VoterSpheres</strong>
            <span>Political Operating System</span>
          </div>
        </Link>

        <div className="vs-shell-search">
          <input
            placeholder="Search pages..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />

          {searchResults.length ? (
            <div className="vs-shell-search-results">
              {searchResults.map((item) => (
                <Link
                  key={item.to}
                  className="vs-shell-search-result"
                  to={item.to}
                  onClick={() => {
                    setQuery("");
                    setMobileOpen(false);
                  }}
                >
                  {item.label}
                  <small>{item.section}</small>
                </Link>
              ))}
            </div>
          ) : null}
        </div>

        {navigationSections.map((section) => (
          <nav key={section.label} className="vs-shell-section">
            <h3 className="vs-shell-section-title">{section.label}</h3>

            <div className="vs-shell-nav">
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    cx("vs-shell-link", isActive && "active")
                  }
                >
                  <span>{item.label}</span>
                  <span className="vs-shell-link-dot" />
                </NavLink>
              ))}
            </div>
          </nav>
        ))}
      </aside>

      <main className="vs-shell-main">
        <header className="vs-shell-topbar">
          <div className="vs-shell-topbar-left">
            <button
              className="vs-shell-mobile-button"
              onClick={() => setMobileOpen((value) => !value)}
            >
              Menu
            </button>
            <div className="vs-shell-eyebrow">Active section</div>
            <div className="vs-shell-current">{activeSection}</div>
          </div>

          <div className="vs-shell-topbar-actions">
            <Link className="vs-shell-pill" to="/notifications">
              Alerts
            </Link>
            <Link className="vs-shell-pill" to="/campaign-copilot">
              AI Co-Pilot
            </Link>
            <div className="vs-shell-avatar">{getInitials(user)}</div>
            {logout ? (
              <button className="vs-shell-pill vs-shell-logout" onClick={logout}>
                Logout
              </button>
            ) : null}
          </div>
        </header>

        <section className="vs-shell-content">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
