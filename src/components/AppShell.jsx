import { useEffect, useMemo, useRef, useState } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

import ExecutiveKpiRibbon from "./ExecutiveKpiRibbon.jsx";
import UnifiedExecutiveStatusBar from "./UnifiedExecutiveStatusBar.jsx";

import { flattenedNavigation, navigationSections } from "../config/navigation";
import { useAuth } from "../context/AuthContext.jsx";

import "./AppShell.css";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function getInitials(user) {
  const name =
    user?.name ||
    user?.full_name ||
    user?.first_name ||
    user?.email ||
    "VS";

  const initials = String(name)
    .split(/[ @._-]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return initials || "VS";
}

function normalizePath(pathname = "") {
  if (!pathname) return "/";

  const normalized = pathname.replace(/\/+$/, "");

  return normalized || "/";
}

function isPathActive(pathname, target) {
  const currentPath = normalizePath(pathname);
  const targetPath = normalizePath(target);

  if (currentPath === targetPath) return true;

  /*
   * Support nested routes such as:
   * /state-operations/GA
   * /consultants/123
   * /campaign-workspace/42
   * /client-portal/token
   *
   * Do not use prefix matching for root-level aliases that should only
   * activate on exact matches.
   */
  const nestedRouteParents = [
    "/state-operations",
    "/consultants",
    "/campaign-workspace",
    "/client-portal",
    "/admin",
  ];

  return nestedRouteParents.some(
    (parentPath) =>
      targetPath === parentPath &&
      currentPath.startsWith(`${parentPath}/`)
  );
}

function findCurrentNavigationItem(pathname) {
  const exactMatch = flattenedNavigation.find(
    (item) => normalizePath(item.to) === normalizePath(pathname)
  );

  if (exactMatch) return exactMatch;

  return flattenedNavigation
    .filter((item) => isPathActive(pathname, item.to))
    .sort((a, b) => b.to.length - a.to.length)[0];
}

export default function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth?.() || {};

  const searchInputRef = useRef(null);

  const [openMenu, setOpenMenu] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");

  const currentNavigationItem = useMemo(
    () => findCurrentNavigationItem(location.pathname),
    [location.pathname]
  );

  const activeSection = useMemo(() => {
    if (currentNavigationItem?.section) {
      return currentNavigationItem.section;
    }

    const matchingSection = navigationSections.find((section) =>
      section.items.some((item) =>
        isPathActive(location.pathname, item.to)
      )
    );

    return matchingSection?.label || "VoterSpheres";
  }, [currentNavigationItem, location.pathname]);

  const currentPage = useMemo(() => {
    return currentNavigationItem?.label || activeSection;
  }, [currentNavigationItem, activeSection]);

  const searchResults = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) return [];

    return flattenedNavigation
      .filter((item) => {
        const searchableText = [
          item.label,
          item.section,
          item.to,
          item.description,
          item.keywords,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchableText.includes(normalizedQuery);
      })
      .slice(0, 9);
  }, [query]);

  function closeMenus(options = {}) {
    const { preserveSearch = false } = options;

    setOpenMenu("");
    setMobileOpen(false);

    if (!preserveSearch) {
      setQuery("");
    }
  }

  function handleLogout() {
    closeMenus();

    if (logout) {
      logout();
    }
  }

  function handleSearchKeyDown(event) {
    if (event.key === "Escape") {
      setQuery("");
      searchInputRef.current?.blur();
      return;
    }

    if (event.key === "Enter" && searchResults.length > 0) {
      event.preventDefault();

      navigate(searchResults[0].to);
      closeMenus();
    }
  }

  useEffect(() => {
    closeMenus();
  }, [location.pathname]);

  useEffect(() => {
    function handleDocumentKeyDown(event) {
      if (event.key === "Escape") {
        setOpenMenu("");
        setMobileOpen(false);
        setQuery("");
      }

      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault();
        setOpenMenu("");
        searchInputRef.current?.focus();
      }
    }

    document.addEventListener("keydown", handleDocumentKeyDown);

    return () => {
      document.removeEventListener("keydown", handleDocumentKeyDown);
    };
  }, []);

  const hasOverlayOpen = Boolean(openMenu || query.trim());

  return (
    <div className="vs-top-shell">
      {hasOverlayOpen ? (
        <button
          type="button"
          aria-label="Close navigation and search"
          className="vs-nav-clickaway"
          onClick={() => closeMenus()}
        />
      ) : null}

      <header className="vs-top-nav">
        <div className="vs-top-row">
          <Link
            className="vs-brand"
            to="/executive-workspace"
            onClick={() => closeMenus()}
          >
            <div className="vs-logo" aria-hidden="true">
              VS
            </div>

            <div className="vs-brand-copy">
              <strong>VoterSpheres</strong>
              <span>Political Operating System</span>
            </div>
          </Link>

          <nav
            className="vs-menu-row"
            aria-label="Primary application navigation"
          >
            {navigationSections.map((section) => {
              const sectionOpen = openMenu === section.label;
              const sectionActive = activeSection === section.label;

              return (
                <div key={section.label} className="vs-menu-wrap">
                  <button
                    type="button"
                    className={cx(
                      "vs-menu-button",
                      section.featured && "featured",
                      sectionActive && "active"
                    )}
                    aria-expanded={sectionOpen}
                    aria-haspopup="menu"
                    onClick={() => {
                      setQuery("");
                      setOpenMenu(sectionOpen ? "" : section.label);
                    }}
                  >
                    {section.label}
                  </button>

                  {sectionOpen ? (
                    <div
                      className="vs-dropdown"
                      role="menu"
                      aria-label={`${section.label} navigation`}
                    >
                      <div className="vs-dropdown-title">
                        {section.label}
                      </div>

                      {section.items.map((item) => (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          role="menuitem"
                          onClick={() => closeMenus()}
                          className={() =>
                            cx(
                              "vs-dropdown-link",
                              isPathActive(location.pathname, item.to) &&
                                "active"
                            )
                          }
                        >
                          <span>{item.label}</span>
                          <span className="vs-dot" aria-hidden="true" />
                        </NavLink>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </nav>

          <div className="vs-right-tools">
            <Link
              className="vs-pill vs-desktop-tool"
              to="/notifications"
              onClick={() => closeMenus()}
            >
              Alerts
            </Link>

            <Link
              className="vs-pill vs-desktop-tool"
              to="/campaign-operations-studio"
              onClick={() => closeMenus()}
            >
              AI Studio
            </Link>

            <button
              type="button"
              className="vs-pill vs-mobile-button"
              aria-expanded={mobileOpen}
              aria-controls="vs-mobile-navigation"
              onClick={() => {
                setOpenMenu("");
                setQuery("");
                setMobileOpen((currentValue) => !currentValue);
              }}
            >
              {mobileOpen ? "Close" : "Menu"}
            </button>

            <div
              className="vs-avatar"
              title={user?.email || user?.name || "VoterSpheres user"}
            >
              {getInitials(user)}
            </div>

            {logout ? (
              <button
                type="button"
                className="vs-pill vs-logout-button"
                onClick={handleLogout}
              >
                Logout
              </button>
            ) : null}
          </div>
        </div>

        <div className="vs-search-row">
          <div className="vs-search">
            <input
              ref={searchInputRef}
              type="search"
              aria-label="Search VoterSpheres pages"
              placeholder="Search pages, workflows, reports, intelligence..."
              value={query}
              autoComplete="off"
              onChange={(event) => {
                setQuery(event.target.value);
                setOpenMenu("");
              }}
              onFocus={() => setOpenMenu("")}
              onKeyDown={handleSearchKeyDown}
            />

            <div className="vs-search-shortcut" aria-hidden="true">
              Ctrl K
            </div>

            {query.trim() ? (
              <div
                className="vs-search-results"
                role="listbox"
                aria-label="Search results"
              >
                {searchResults.length ? (
                  searchResults.map((item) => (
                    <Link
                      key={item.to}
                      className="vs-search-result"
                      to={item.to}
                      onClick={() => closeMenus()}
                    >
                      <span className="vs-search-result-label">
                        {item.label}
                      </span>

                      <small>
                        {item.section}
                        <span aria-hidden="true"> · </span>
                        {item.to}
                      </small>
                    </Link>
                  ))
                ) : (
                  <div className="vs-search-empty">
                    No pages matched “{query.trim()}”.
                  </div>
                )}
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

        <div
          id="vs-mobile-navigation"
          className={cx(
            "vs-mobile-panel",
            !mobileOpen && "closed"
          )}
        >
          <div className="vs-mobile-quick-actions">
            <Link
              className="vs-pill"
              to="/notifications"
              onClick={() => closeMenus()}
            >
              Alerts
            </Link>

            <Link
              className="vs-pill"
              to="/campaign-operations-studio"
              onClick={() => closeMenus()}
            >
              AI Studio
            </Link>
          </div>

          {navigationSections.map((section) => (
            <section key={section.label} className="vs-mobile-section">
              <h3>{section.label}</h3>

              <div className="vs-mobile-links">
                {section.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => closeMenus()}
                    className={() =>
                      cx(
                        "vs-dropdown-link",
                        isPathActive(location.pathname, item.to) &&
                          "active"
                      )
                    }
                  >
                    <span>{item.label}</span>
                    <span className="vs-dot" aria-hidden="true" />
                  </NavLink>
                ))}
              </div>
            </section>
          ))}
        </div>
      </header>

      <div className="vs-executive-context">
        <ExecutiveKpiRibbon />
        <UnifiedExecutiveStatusBar />
      </div>

      <main className="vs-top-content">
        <Outlet />
      </main>
    </div>
  );
}
