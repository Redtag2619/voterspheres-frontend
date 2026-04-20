// src/lib/permissions.js

// 🔐 Canonical permission keys used across the app
export const PERMISSIONS = {
  VIEW_DASHBOARD: "VIEW_DASHBOARD",
  VIEW_CANDIDATES: "VIEW_CANDIDATES",
  VIEW_CANDIDATE_ADMIN: "VIEW_CANDIDATE_ADMIN",

  VIEW_BETA_ACCESS: "VIEW_BETA_ACCESS",
  VIEW_FIRM_USERS: "VIEW_FIRM_USERS",
  VIEW_FIRM_INVITES: "VIEW_FIRM_INVITES",
  VIEW_ENTERPRISE_LEADS: "VIEW_ENTERPRISE_LEADS",

  VIEW_MAP: "VIEW_MAP",
  VIEW_DONORS: "VIEW_DONORS",
  VIEW_FORECAST: "VIEW_FORECAST",
  VIEW_POWER_RANKINGS: "VIEW_POWER_RANKINGS",
  VIEW_FUNDRAISING: "VIEW_FUNDRAISING",
  VIEW_VENDORS: "VIEW_VENDORS",
  VIEW_CONSULTANTS: "VIEW_CONSULTANTS",

  VIEW_AI_CHAT: "VIEW_AI_CHAT",
  VIEW_WAR_ROOM: "VIEW_WAR_ROOM",
  VIEW_COMMAND_CENTER: "VIEW_COMMAND_CENTER",

  VIEW_MAILOPS: "VIEW_MAILOPS",
  VIEW_BILLING: "VIEW_BILLING"
};

// 👇 All permissions list (used for admin full access)
export const ALL_PERMISSIONS = Object.values(PERMISSIONS);

// 🧠 Role → Permission mapping
export function getPermissionsForRole(role) {
  const normalized = String(role || "").toLowerCase();

  switch (normalized) {
    case "admin":
      return [...ALL_PERMISSIONS];

    case "strategist":
      return [
        PERMISSIONS.VIEW_DASHBOARD,
        PERMISSIONS.VIEW_CANDIDATES,
        PERMISSIONS.VIEW_MAP,
        PERMISSIONS.VIEW_FORECAST,
        PERMISSIONS.VIEW_POWER_RANKINGS,
        PERMISSIONS.VIEW_FUNDRAISING,
        PERMISSIONS.VIEW_CONSULTANTS,
        PERMISSIONS.VIEW_AI_CHAT,
        PERMISSIONS.VIEW_WAR_ROOM,
        PERMISSIONS.VIEW_COMMAND_CENTER
      ];

    case "analyst":
      return [
        PERMISSIONS.VIEW_DASHBOARD,
        PERMISSIONS.VIEW_CANDIDATES,
        PERMISSIONS.VIEW_MAP,
        PERMISSIONS.VIEW_FORECAST,
        PERMISSIONS.VIEW_POWER_RANKINGS
      ];

    case "mailops":
      return [
        PERMISSIONS.VIEW_DASHBOARD,
        PERMISSIONS.VIEW_MAILOPS
      ];

    case "user":
    default:
      return [
        PERMISSIONS.VIEW_DASHBOARD,
        PERMISSIONS.VIEW_CANDIDATES
      ];
  }
}

// 🔍 Check if user has permission
export function hasPermission(user, permission) {
  if (!user) return false;

  const permissions = user.permissions || getPermissionsForRole(user.role);

  return permissions.includes(permission);
}

// 🔍 Check multiple permissions (OR logic)
export function hasAnyPermission(user, requiredPermissions = []) {
  if (!user) return false;

  const permissions = user.permissions || getPermissionsForRole(user.role);

  return requiredPermissions.some((perm) => permissions.includes(perm));
}

// 🔍 Check multiple permissions (AND logic)
export function hasAllPermissions(user, requiredPermissions = []) {
  if (!user) return false;

  const permissions = user.permissions || getPermissionsForRole(user.role);

  return requiredPermissions.every((perm) => permissions.includes(perm));
}

// 🔍 Role check helper
export function hasRole(user, roles = []) {
  if (!user) return false;

  const userRole = String(user.role || "").toLowerCase();
  const normalizedRoles = roles.map((r) => String(r).toLowerCase());

  return normalizedRoles.includes(userRole);
}

// 🧠 Attach permissions to user (IMPORTANT)
export function enrichUserWithPermissions(user) {
  if (!user) return null;

  return {
    ...user,
    permissions: getPermissionsForRole(user.role)
  };
}
