import { useMemo, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { flattenedNavigation, navigationSections } from "../config/navigation";
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
  const [openMenu, setOpenMenu] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");

  const activeSection = useMemo(() => {
    return (
      navigationSections.find((section) =>
        section.items.some((item) => location.pathname === item.to)
      )?.label || "VoterSpheres"
    );
  }, [location.pathname]);

  const currentPage = useMemo(() => {
    return (
      flattenedNavigation.find((item) => location.pathname === item.to)?.label ||
      activeSection
    );
  }, [location.pathname, activeSection]);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    return flattenedNavigation
      .filter((item) =>
        `${item.label} ${item.section} ${item.to}`.toLowerCase().includes(q)
      )
      .slice(0, 10);
  }, [query]);

  function closeMenus() {
    setOpenMenu("");
    setMobileOpen(false);
    setQuery("");
  }

  return (
    <div className="vs-top-shell">
      <style>{`
        .vs-top-shell {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(37,99,235,.16), transparent 30%),
            radial-gradient(circle at bottom right, rgba(220,38,38,.10), transparent 30%),
            #020617;
          color: var(--vs-text, #e5e7eb);
        }

        .vs-top-nav {
          position: sticky;
          top: 0;
          z-index: 50;
          border-bottom: 1px solid rgba(148,163,184,.14);
          background: rgba(2,6,23,.88);
          backdrop-filter: blur(18px);
        }

        .vs-top-nav-inner {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          gap: 18px;
          align-items: center;
          padding: 14px 22px;
        }

        .vs-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          color: white;
          min-width: 210px;
        }

        .vs-logo {
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

        .vs-brand strong {
          display: block;
          font-size: 16px;
          letter-spacing: -.04em;
        }

        .vs-brand span {
          display: block;
          margin-top: 2px;
          font-size: 11px;
          color: rgba(203,213,225,.62);
        }

        .vs-menu-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          min-width: 0;
        }

        .vs-menu-wrap {
          position: relative;
        }

        .vs-menu-button {
          border: 1px solid rgba(148,163,184,.14);
          background: rgba(15,23,42,.58);
          color: rgba(226,232,240,.88);
          border-radius: 999px;
          padding: 9px 11px;
          font-size: 12px;
          cursor: pointer;
          white-space: nowrap;
        }

        .vs-menu-button:hover,
        .vs-menu-button.active {
          color: white;
          border-color: rgba(96,165,250,.34);
          background: rgba(37,99,235,.20);
        }

        .vs-dropdown {
          position: absolute;
          top: calc(100% + 10px);
          left: 50%;
          transform: translateX(-50%);
          width: 290px;
          border-radius: 22px;
          border: 1px solid rgba(148,163,184,.16);
          background:
            radial-gradient(circle at top right, rgba(37,99,235,.14), transparent 34%),
            rgba(2,6,23,.98);
          box-shadow: 0 28px 90px rgba(0,0,0,.55);
          padding: 10px;
          display: grid;
          gap: 4px;
        }

        .vs-dropdown-title {
          color: rgba(148,163,184,.78);
          font-size: 10px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: .14em;
          padding: 8px 10px 6px;
        }

        .vs-dropdown-link {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          text-decoration: none;
          color: rgba(226,232,240,.82);
          font-size: 13px;
          padding: 10px;
          border-radius: 14px;
          border: 1px solid transparent;
        }

        .vs-dropdown-link:hover,
        .vs-dropdown-link.active {
          color: white;
          background: rgba(37,99,235,.16);
          border-color: rgba(96,165,250,.22);
        }

        .vs-link-dot {
          width: 7px;
          height: 7px;
          border-radius: 999px;
          background: rgba(96,165,250,.9);
          opacity: 0;
        }

        .vs-dropdown-link.active .vs-link-dot {
          opacity: 1;
        }

        .vs-right-tools {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
        }

        .vs-search {
          position: relative;
          width: 230px;
        }

        .vs-search input {
          width: 100%;
          border-radius: 999px;
          border: 1px solid rgba(148,163,184,.16);
          background: rgba(15,23,42,.72);
          color: white;
          padding: 9px 12px;
          outline: none;
          font-size: 12px;
        }

        .vs-search-results {
          position: absolute;
          z-index: 80;
          top: calc(100% + 10px);
          right: 0;
          width: 320px;
          border-radius: 20px;
          border: 1px solid rgba(148,163,184,.16);
          background: rgba(2,6,23,.98);
          box-shadow: 0 28px 90px rgba(0,0,0,.55);
          padding: 8px;
        }

        .vs-search-result {
          display: block;
          text-decoration: none;
          color: rgba(226,232,240,.94);
          padding: 10px;
          border-radius: 12px;
        }

        .vs-search-result:hover {
          background: rgba(37,99,235,.16);
        }

        .vs-search-result small {
          display: block;
          color: rgba(148,163,184,.72);
          margin-top: 3px;
        }

        .vs-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border-radius: 999px;
          border: 1px solid rgba(148,163,184,.16);
          background: rgba(15,23,42,.72);
          color: rgba(226,232,240,.86);
          padding: 9px 11px;
          font-size: 12px;
          text-decoration: none;
          cursor: pointer;
          white-space: nowrap;
        }

        .vs-avatar {
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

        .vs-mobile-button {
          display: none;
        }

        .vs-page-meta {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: center;
          padding: 12px 22px;
          border-top: 1px solid rgba(148,163,184,.08);
          background: rgba(15,23,42,.28);
        }

        .vs-page-meta small {
          color: rgba(148,163,184,.74);
          text-transform: uppercase;
          letter-spacing: .12em;
          font-size: 10px;
          font-weight: 900;
        }

        .vs-page-meta strong {
          display: block;
          margin-top: 3px;
          color: white;
          font-size: 14px;
        }

        .vs-top-content {
          padding: 22px;
          min-width: 0;
        }

        .vs-mobile-panel {
          display: none;
        }

        @media (max-width: 1180px) {
          .vs-top-nav-inner {
            grid-template-columns: auto 1fr auto;
          }

          .vs-menu-row {
            display: none;
          }

          .vs-mobile-button {
            display: inline-flex;
          }

          .vs-search {
            display: none;
          }

          .vs-mobile-panel {
            display: grid;
            gap: 14px;
            padding: 0 22px 18px;
          }

          .vs-mobile-panel.closed {
            display: none;
          }

          .vs-mobile-section {
            border-radius: 18px;
            border: 1px solid rgba(148,163,184,.14);
            background: rgba(15,23,42,.54);
            padding: 10px;
          }

          .vs-mobile-section h3 {
            margin: 0 0 8px;
            color: rgba(148,163,184,.78);
            font-size: 10px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: .14em;
          }

          .vs-mobile-links {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 6px;
          }
        }

        @media (max-width: 720px) {
          .vs-top-nav-inner {
            padding: 12px 14px;
          }

          .vs-brand {
            min-width: 0;
          }

          .vs-brand span {
            display: none;
          }

          .vs-right-tools .vs-pill:not(.vs-mobile-button) {
            display: none;
          }

          .vs-mobile-links {
            grid-template-columns: 1fr;
          }

          .vs-page-meta {
            padding: 10px 14px;
          }

          .vs-top-content {
            padding: 14px;
          }
        }
      `}</style>

      <header className="vs-top-nav">
        <div className="vs-top-nav-inner">
          <Link className="vs-brand" to="/national-command" onClick={closeMenus}>
            <div className="vs-logo">VS</div>
            <div>
              <strong>VoterSpheres</strong>
              <span>Political Operating System</span>
            </div>
          </Link>

          <nav className="vs-menu-row">
            {navigationSections.map((section) => (
              <div
                key={section.label}
                className="vs-menu-wrap"
                onMouseEnter={() => setOpenMenu(section.label)}
                onMouseLeave={() => setOpenMenu("")}
              >
                <button
                  type="button"
                  className={cx("vs-menu-button", activeSection === section.label && "active")}
                  onClick={() =>
                    setOpenMenu(openMenu === section.label ? "" : section.label)
                  }
                >
                  {section.label}
                </button>

                {openMenu === section.label ? (
                  <div className="vs-dropdown">
                    <div className="vs-dropdown-title">{section.label}</div>

                    {section.items.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={closeMenus}
                        className={({ isActive }) =>
                          cx("vs-dropdown-link", isActive && "active")
                        }
                      >
                        <span>{item.label}</span>
                        <span className="vs-link-dot" />
                      </NavLink>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </nav>

          <div className="vs-right-tools">
            <div className="vs-search">
              <input
                placeholder="Search pages..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />

              {searchResults.length ? (
                <div className="vs-search-results">
                  {searchResults.map((item) => (
                    <Link
                      key={item.to}
                      className="vs-search-result"
                      to={item.to}
                      onClick={closeMenus}
                    >
                      {item.label}
                      <small>{item.section}</small>
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>

            <Link className="vs-pill" to="/notifications" onClick={closeMenus}>
              Alerts
            </Link>

            <Link className="vs-pill" to="/campaign-copilot" onClick={closeMenus}>
              AI Co-Pilot
            </Link>

            <button
              className="vs-pill vs-mobile-button"
              onClick={() => setMobileOpen((value) => !value)}
            >
              Menu
            </button>

            <div className="vs-avatar">{getInitials(user)}</div>

            {logout ? (
              <button className="vs-pill" onClick={logout}>
                Logout
              </button>
            ) : null}
          </div>
        </div>

        <div className={cx("vs-mobile-panel", !mobileOpen && "closed")}>
          {navigationSections.map((section) => (
            <div key={section.label} className="vs-mobile-section">
              <h3>{section.label}</h3>
              <div className="vs-mobile-links">
                {section.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={closeMenus}
                    className={({ isActive }) =>
                      cx("vs-dropdown-link", isActive && "active")
                    }
                  >
                    <span>{item.label}</span>
                    <span className="vs-link-dot" />
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="vs-page-meta">
          <div>
            <small>Active Section</small>
            <strong>{activeSection}</strong>
          </div>
          <div>
            <small>Current Page</small>
            <strong>{currentPage}</strong>
          </div>
        </div>
      </header>

      <main className="vs-top-content">
        <Outlet />
      </main>
    </div>
  );
}
