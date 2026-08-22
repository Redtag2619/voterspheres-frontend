import ExecutiveKpiRibbon from "./ExecutiveKpiRibbon.jsx";

import UnifiedExecutiveStatusBar from "./UnifiedExecutiveStatusBar.jsx";

import BackToTop from "./BackToTop";

import { useMemo, useState } from "react";

import { Link, NavLink, Outlet, useLocation } from "react-router-dom";

import { navigationSections } from "../config/navigation";

import {

  filterNavigationForAccess,

  flattenNavigation,

  PLAN_DETAILS,

} from "../lib/entitlements.js";

import { useAuth } from "../context/AuthContext.jsx";

import EntitlementRouteGuard from "./EntitlementRouteGuard.jsx";

 

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

 

function routePath(value = "") {

  return String(value || "").split("?")[0];

}

 

export default function AppShell() {

  const location = useLocation();

  const {

    user,

    logout,

    planTier = "free",

    entitlementSet = new Set(),

    isPlatformAdmin = false,

    canAccessRoute = () => false,

  } = useAuth?.() || {};

  const [openMenu, setOpenMenu] = useState("");

  const [mobileOpen, setMobileOpen] = useState(false);

  const [query, setQuery] = useState("");

 

  const visibleNavigation = useMemo(

    () =>

      filterNavigationForAccess(navigationSections, {

        planTier,

        entitlementSet,

        user,

      }),

    [planTier, entitlementSet, user]

  );

 

  const visibleFlattenedNavigation = useMemo(

    () => flattenNavigation(visibleNavigation),

    [visibleNavigation]

  );

 

  const activeSection = useMemo(() => {

    return (

      visibleNavigation.find((section) =>

        section.items.some((item) => location.pathname === routePath(item.to))

      )?.label || "VoterSpheres"

    );

  }, [location.pathname, visibleNavigation]);

 

  const currentPage = useMemo(() => {

    return (

      visibleFlattenedNavigation.find(

        (item) => location.pathname === routePath(item.to)

      )?.label ||

      activeSection

    );

  }, [location.pathname, activeSection, visibleFlattenedNavigation]);

 

  const searchResults = useMemo(() => {

    const q = query.trim().toLowerCase();

    if (!q) return [];

 

    return visibleFlattenedNavigation

      .filter((item) =>

        `${item.label} ${item.section} ${item.description || ""} ${

          item.keywords || ""

        } ${item.to}`.toLowerCase().includes(q)

      )

      .slice(0, 9);

  }, [query, visibleFlattenedNavigation]);

 

  function closeMenus() {

    setOpenMenu("");

    setMobileOpen(false);

    setQuery("");

  }

 

  return (

    <div className="vs-top-shell">

      <style>{`

        :root {

          --vs-orange: #fb923c;

          --vs-orange-light: #fdba74;

          --vs-orange-dark: #f97316;

        }

 

        .vs-page-title,

        .page-title,

        h1,

        .vs-section-title,

        .vs-page-eyebrow {

          color: var(--vs-orange) !important;

          text-shadow: none !important;

        }

 

        .vs-top-shell {

          min-height: 100vh;

          background:

            radial-gradient(circle at top left, rgba(251, 146, 60, 0.13), transparent 30%),

            radial-gradient(circle at bottom right, rgba(37, 99, 235, 0.10), transparent 30%),

            #020617;

          color: var(--vs-text, #e5e7eb);

        }

 

        .vs-top-nav {

          position: sticky;

          top: 0;

          z-index: 70;

          border-bottom: 1px solid rgba(148, 163, 184, 0.14);

          background: rgba(2, 6, 23, 0.94);

          backdrop-filter: blur(18px);

        }

 

        .vs-top-row {

          display: grid;

          grid-template-columns: 270px minmax(0, 1fr) auto;

          gap: 16px;

          align-items: center;

          padding: 12px 22px;

        }

 

        .vs-brand {

          display: flex;

          align-items: center;

          gap: 14px;

          text-decoration: none;

          color: white;

          min-width: 0;

        }

 

        .vs-logo {

          width: 52px;

          height: 52px;

          border-radius: 18px;

          display: grid;

          place-items: center;

          background:

            radial-gradient(circle at 28% 24%, rgba(255,255,255,.36), transparent 24%),

            linear-gradient(135deg, var(--vs-orange), var(--vs-orange-dark));

          color: white;

          font-size: 22px;

          font-weight: 1000;

          letter-spacing: -0.12em;

          box-shadow: 0 20px 60px rgba(251, 146, 60, 0.38);

          flex: 0 0 auto;

        }

 

        .vs-brand strong {

          display: block;

          font-size: 16px;

          letter-spacing: -0.04em;

        }

 

        .vs-brand span {

          display: block;

          margin-top: 2px;

          font-size: 11px;

          color: rgba(203, 213, 225, 0.62);

        }

 

        .vs-menu-row {

          display: flex;

          justify-content: center;

          gap: 8px;

          min-width: 0;

        }

 

        .vs-menu-wrap {

          position: relative;

        }

 

        .vs-menu-button {

          border: 1px solid rgba(148, 163, 184, 0.14);

          background: rgba(15, 23, 42, 0.58);

          color: rgba(226, 232, 240, 0.88);

          border-radius: 999px;

          padding: 9px 12px;

          font-size: 12px;

          cursor: pointer;

          white-space: nowrap;

        }

 

        .vs-menu-button.featured {

          background: rgba(251, 146, 60, 0.20);

          border-color: rgba(251, 146, 60, 0.44);

          color: white;

          font-weight: 850;

        }

 

        .vs-menu-button:hover,

        .vs-menu-button.active {

          color: white;

          border-color: rgba(251, 146, 60, 0.50);

          background: rgba(251, 146, 60, 0.18);

        }

 

        .vs-dropdown {

          position: absolute;

          top: calc(100% + 10px);

          left: 50%;

          transform: translateX(-50%);

          z-index: 300;

          width: 390px;

          max-height: min(72vh, 620px);

          overflow: auto;

          border-radius: 22px;

          border: 1px solid rgba(251, 146, 60, 0.24);

          background:

            radial-gradient(circle at top right, rgba(251, 146, 60, 0.13), transparent 34%),

            rgba(2, 6, 23, 0.98);

          box-shadow: 0 28px 90px rgba(0, 0, 0, 0.55);

          padding: 10px;

          display: grid;

          gap: 4px;

        }

 

        .vs-dropdown-title {

          color: var(--vs-orange-light);

          font-size: 10px;

          font-weight: 900;

          text-transform: uppercase;

          letter-spacing: 0.14em;

          padding: 8px 10px 6px;

        }

 

        .vs-dropdown-description {

          margin: -2px 10px 8px;

          color: rgba(203, 213, 225, 0.72);

          font-size: 12px;

          line-height: 1.45;

        }

 

        .vs-dropdown-start {

          display: flex;

          align-items: center;

          justify-content: space-between;

          margin: 0 4px 8px;

          padding: 10px 12px;

          border-radius: 14px;

          border: 1px solid rgba(251, 146, 60, 0.35);

          background: rgba(251, 146, 60, 0.13);

          color: #fff;

          font-size: 12px;

          font-weight: 800;

          text-decoration: none;

        }

 

        .vs-dropdown-link {

          display: flex;

          justify-content: space-between;

          gap: 10px;

          text-decoration: none;

          color: rgba(226, 232, 240, 0.84);

          font-size: 13px;

          padding: 10px;

          border-radius: 14px;

          border: 1px solid transparent;

        }

 

        .vs-dropdown-copy {

          min-width: 0;

        }

 

        .vs-dropdown-copy strong {

          display: block;

          color: inherit;

          font-size: 13px;

          line-height: 1.3;

        }

 

        .vs-dropdown-copy small {

          display: block;

          margin-top: 3px;

          color: rgba(148, 163, 184, 0.72);

          font-size: 11px;

          line-height: 1.35;

        }

 

        .vs-dropdown-link:hover,

        .vs-dropdown-link.active {

          color: white;

          background: rgba(251, 146, 60, 0.16);

          border-color: rgba(251, 146, 60, 0.30);

        }

 

        .vs-dot {

          width: 7px;

          height: 7px;

          border-radius: 999px;

          background: var(--vs-orange-light);

          opacity: 0;

          margin-top: 6px;

          flex: 0 0 auto;

        }

 

        .vs-dropdown-link.active .vs-dot {

          opacity: 1;

        }

 

        .vs-right-tools {

          display: flex;

          align-items: center;

          gap: 9px;

        }

 

        .vs-pill {

          border: 1px solid rgba(148, 163, 184, 0.16);

          background: rgba(15, 23, 42, 0.72);

          color: rgba(226, 232, 240, 0.86);

          border-radius: 999px;

          padding: 9px 11px;

          font-size: 12px;

          text-decoration: none;

          cursor: pointer;

          white-space: nowrap;

        }

 

        .vs-pill:hover {

          color: white;

          border-color: rgba(251, 146, 60, 0.40);

          background: rgba(251, 146, 60, 0.14);

        }

 

        .vs-avatar {

          width: 34px;

          height: 34px;

          border-radius: 999px;

          display: grid;

          place-items: center;

          background: linear-gradient(135deg, var(--vs-orange), var(--vs-orange-dark));

          color: white;

          font-size: 12px;

          font-weight: 900;

        }

 

        .vs-search-row {

          display: grid;

          grid-template-columns: minmax(280px, 620px) auto;

          gap: 14px;

          align-items: center;

          padding: 0 22px 12px;

        }

 

        .vs-search {

          position: relative;

          width: 100%;

          z-index: 20;

        }

 

        .vs-search input {

          width: 100%;

          border-radius: 16px;

          border: 1px solid rgba(148, 163, 184, 0.16);

          background: rgba(15, 23, 42, 0.78);

          color: white;

          padding: 11px 13px;

          outline: none;

          font-size: 13px;

        }

 

        .vs-search input:focus {

          border-color: rgba(251, 146, 60, 0.42);

          box-shadow: 0 0 0 3px rgba(251, 146, 60, 0.12);

        }

 

        .vs-search-results {

          position: absolute;

          z-index: 25;

          top: calc(100% + 8px);

          left: 0;

          width: 100%;

          max-height: 380px;

          overflow: auto;

          border-radius: 20px;

          border: 1px solid rgba(251, 146, 60, 0.24);

          background: rgba(2, 6, 23, 0.98);

          box-shadow: 0 28px 90px rgba(0, 0, 0, 0.55);

          padding: 8px;

        }

 

        .vs-search-result {

          display: block;

          text-decoration: none;

          color: rgba(226, 232, 240, 0.94);

          padding: 10px;

          border-radius: 12px;

        }

 

        .vs-search-result:hover {

          background: rgba(251, 146, 60, 0.16);

        }

 

        .vs-search-result small {

          display: block;

          color: rgba(148, 163, 184, 0.72);

          margin-top: 3px;

        }

 

        .vs-page-meta {

          display: flex;

          justify-content: flex-end;

          gap: 18px;

          color: rgba(203, 213, 225, 0.72);

          font-size: 12px;

        }

 

        .vs-page-meta strong {

          color: var(--vs-orange);

        }

 

        .vs-nav-clickaway {

          position: fixed;

          inset: 0;

          z-index: 60;

          border: 0;

          background: transparent;

          cursor: default;

        }

 

        .vs-mobile-button {

          display: none;

        }

 

        .vs-mobile-panel {

          display: none;

        }

 

        .vs-top-content {

          padding: 24px;

          min-width: 0;

        }

 

        @media (max-width: 1260px) {

          .vs-top-row {

            grid-template-columns: 250px 1fr auto;

          }

 

          .vs-menu-row {

            display: none;

          }

 

          .vs-mobile-button {

            display: inline-flex;

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

            border: 1px solid rgba(251, 146, 60, 0.18);

            background: rgba(15, 23, 42, 0.54);

            padding: 10px;

          }

 

          .vs-mobile-section h3 {

            margin: 0 0 8px;

            color: var(--vs-orange-light);

            font-size: 10px;

            font-weight: 900;

            text-transform: uppercase;

            letter-spacing: 0.14em;

          }

 

          .vs-mobile-links {

            display: grid;

            grid-template-columns: repeat(2, minmax(0, 1fr));

            gap: 6px;

          }

        }

 

        @media (max-width: 760px) {

          .vs-top-row {

            grid-template-columns: 1fr auto;

            padding: 12px 14px;

          }

 

          .vs-logo {

            width: 46px;

            height: 46px;

            font-size: 20px;

          }

 

          .vs-right-tools .vs-pill:not(.vs-mobile-button) {

            display: none;

          }

 

          .vs-brand span {

            display: none;

          }

 

          .vs-search-row {

            grid-template-columns: 1fr;

            padding: 0 14px 12px;

          }

 

          .vs-page-meta {

            justify-content: flex-start;

            flex-wrap: wrap;

          }

 

          .vs-mobile-links {

            grid-template-columns: 1fr;

          }

 

          .vs-top-content {

            padding: 14px;

          }

        

          .vs-back-to-top {

  position: fixed;

  right: 28px;

  bottom: 28px;

  z-index: 1000;

 

  display: inline-flex;

  align-items: center;

  justify-content: center;

  gap: 8px;

 

  min-width: 92px;

  height: 46px;

  padding: 0 17px;

 

  border: 1px solid rgba(251, 146, 60, 0.42);

  border-radius: 14px;

 

  background:

    linear-gradient(

      135deg,

      rgba(251, 146, 60, 0.98),

      rgba(234, 88, 12, 0.98)

    );

 

  color: #ffffff;

 

  font-family: inherit;

  font-size: 13px;

  font-weight: 800;

  letter-spacing: 0.02em;

 

  box-shadow:

    0 12px 32px rgba(0, 0, 0, 0.28),

    0 4px 12px rgba(234, 88, 12, 0.22);

 

  cursor: pointer;

 

  opacity: 0;

  visibility: hidden;

  pointer-events: none;

 

  transform: translateY(14px) scale(0.96);

 

  transition:

    opacity 180ms ease,

    visibility 180ms ease,

    transform 180ms ease,

    box-shadow 180ms ease,

    filter 180ms ease;

}

 

.vs-back-to-top.is-visible {

  opacity: 1;

  visibility: visible;

  pointer-events: auto;

  transform: translateY(0) scale(1);

}

 

.vs-back-to-top:hover {

  transform: translateY(-2px) scale(1.02);

 

  box-shadow:

    0 16px 38px rgba(0, 0, 0, 0.32),

    0 6px 18px rgba(234, 88, 12, 0.28);

 

  filter: brightness(1.05);

}

 

.vs-back-to-top:active {

  transform: translateY(0) scale(0.98);

}

 

.vs-back-to-top:focus-visible {

  outline: 3px solid rgba(251, 146, 60, 0.32);

  outline-offset: 4px;

}

 

.vs-back-to-top svg {

  flex: 0 0 auto;

}

 

@media (max-width: 760px) {

  .vs-back-to-top {

    right: 16px;

    bottom: 18px;

 

    min-width: 46px;

    width: 46px;

    height: 46px;

    padding: 0;

 

    border-radius: 14px;

  }

 

  .vs-back-to-top span {

    display: none;

  }

}

 

@media (prefers-reduced-motion: reduce) {

  .vs-back-to-top {

    transition: none;

  }

}

      `}</style>

 

      {openMenu ? (

        <button

          type="button"

          aria-label="Close navigation menu"

          className="vs-nav-clickaway"

          onClick={() => setOpenMenu("")}

        />

      ) : null}

 

      <header className="vs-top-nav">

        <div className="vs-top-row">

          <Link className="vs-brand" to="/executive-workspace" onClick={closeMenus}>

            <div className="vs-logo">VS</div>

            <div>

              <strong>VoterSpheres</strong>

              <span>Political Operating System</span>

            </div>

          </Link>

 

          <nav className="vs-menu-row">

            {visibleNavigation.map((section) => (

              <div key={section.label} className="vs-menu-wrap">

                <button

                  type="button"

                  className={cx(

                    "vs-menu-button",

                    section.featured && "featured",

                    activeSection === section.label && "active"

                  )}

                  onClick={() =>

                    setOpenMenu(openMenu === section.label ? "" : section.label)

                  }

                >

                  {section.shortLabel || section.label}

                </button>

 

                {openMenu === section.label ? (

                  <div className="vs-dropdown">

                    <div className="vs-dropdown-title">{section.label}</div>

                    <p className="vs-dropdown-description">

                      {section.description}

                    </p>

                    {section.startAt ? (

                      <Link

                        className="vs-dropdown-start"

                        to={section.startAt}

                        onClick={closeMenus}

                      >

                        <span>Open {section.shortLabel || section.label}</span>

                        <span aria-hidden="true">→</span>

                      </Link>

                    ) : null}

                    {section.items.map((item) => (

                      <NavLink

                        key={item.to}

                        to={item.to}

                        onClick={closeMenus}

                        className={({ isActive }) =>

                          cx("vs-dropdown-link", isActive && "active")

                        }

                      >

                        <span className="vs-dropdown-copy">

                          <strong>{item.label}</strong>

                          {item.description ? <small>{item.description}</small> : null}

                        </span>

                        <span className="vs-dot" />

                      </NavLink>

                    ))}

                  </div>

                ) : null}

              </div>

            ))}

          </nav>

 

          <div className="vs-right-tools">

            <Link className="vs-pill" to="/notifications" onClick={closeMenus}>

              Alerts

            </Link>

            {canAccessRoute("/campaign-operations-studio") ? (

              <Link className="vs-pill" to="/campaign-operations-studio" onClick={closeMenus}>

                AI Studio

              </Link>

            ) : null}

            <button

              type="button"

              className="vs-pill vs-mobile-button"

              onClick={() => setMobileOpen((value) => !value)}

            >

              Menu

            </button>

            <Link className="vs-pill" to="/billing" onClick={closeMenus}>

              {isPlatformAdmin

                ? "Platform Admin"

                : PLAN_DETAILS[planTier]?.label || "Free"}

            </Link>

            <div className="vs-avatar">{getInitials(user)}</div>

            {logout ? (

              <button type="button" className="vs-pill" onClick={logout}>

                Logout

              </button>

            ) : null}

          </div>

        </div>

 

        <div className="vs-search-row">

          <div className="vs-search">

            <input

              placeholder="What do you want to do? Search candidates, polling, finance, AI, reports..."

              value={query}

              onChange={(event) => setQuery(event.target.value)}

              onFocus={() => setOpenMenu("")}

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

                    <strong>{item.label}</strong>

                    <small>

                      {item.section}

                      {item.description ? ` · ${item.description}` : ""}

                    </small>

                  </Link>

                ))}

              </div>

            ) : null}

          </div>

 

          <div className="vs-page-meta">

            <span>

              Section: <strong>{activeSection}</strong>

            </span>

            <span>

              Page: <strong>{currentPage}</strong>

            </span>

          </div>

        </div>

 

        <div className={cx("vs-mobile-panel", !mobileOpen && "closed")}>

          {visibleNavigation.map((section) => (

            <div key={section.label} className="vs-mobile-section">

              <h3>{section.label}</h3>

              {section.description ? (

                <p className="vs-dropdown-description">{section.description}</p>

              ) : null}

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

                    <span className="vs-dropdown-copy">

                      <strong>{item.label}</strong>

                      {item.description ? <small>{item.description}</small> : null}

                    </span>

                    <span className="vs-dot" />

                  </NavLink>

                ))}

              </div>

            </div>

          ))}

        </div>

      </header>

 

      <ExecutiveKpiRibbon />

      <UnifiedExecutiveStatusBar />

 

      <main className="vs-top-content">

        <EntitlementRouteGuard>

          <Outlet />

        </EntitlementRouteGuard>

      </main>

 

      <BackToTop />

    </div>

  );

}

