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

export const ALL_PERMISSIONS = Object.values(PERMISSIONS);

export function normalizePermissionList(input) {
  if (!Array.isArray(input)) return [];
  return [...new Set(input.map((item) => String(item || "").trim()).filter(Boolean))];
}

export function getPermissionsForRole(role) {
  const normalizedRole = String(role || "").trim().toLowerCase();

  switch (normalizedRole) {
    case "admin":
      return [...ALL_PERMISSIONS];

    case "strategist":
      return [
        PERMISSIONS.VIEW_DASHBOARD,
        PERMISSIONS.VIEW_CANDIDATES,
        PERMISSIONS.VIEW_MAP,
        PERMISSIONS.VIEW_DONORS,
        PERMISSIONS.VIEW_FORECAST,
        PERMISSIONS.VIEW_POWER_RANKINGS,
        PERMISSIONS.VIEW_FUNDRAISING,
        PERMISSIONS.VIEW_VENDORS,
        PERMISSIONS.VIEW_CONSULTANTS,
        PERMISSIONS.VIEW_AI_CHAT,
        PERMISSIONS.VIEW_WAR_ROOM,
        PERMISSIONS.VIEW_COMMAND_CENTER,
        PERMISSIONS.VIEW_MAILOPS,
        PERMISSIONS.VIEW_BILLING
      ];

    case "analyst":
      return [
        PERMISSIONS.VIEW_DASHBOARD,
        PERMISSIONS.VIEW_CANDIDATES,
        PERMISSIONS.VIEW_MAP,
        PERMISSIONS.VIEW_DONORS,
        PERMISSIONS.VIEW_FORECAST,
        PERMISSIONS.VIEW_POWER_RANKINGS,
        PERMISSIONS.VIEW_FUNDRAISING,
        PERMISSIONS.VIEW_AI_CHAT,
        PERMISSIONS.VIEW_WAR_ROOM,
        PERMISSIONS.VIEW_COMMAND_CENTER
      ];

    case "mailops":
      return [
        PERMISSIONS.VIEW_DASHBOARD,
        PERMISSIONS.VIEW_CANDIDATES,
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

export function enrichUserWithPermissions(user) {
  if (!user) return null;

  const explicitPermissions = normalizePermissionList(user.permissions);
  const rolePermissions = getPermissionsForRole(user.role);
  const permissions = explicitPermissions.length ? explicitPermissions : rolePermissions;

  return {
    ...user,
    permissions
  };
}

export function hasPermission(user, permission) {
  if (!user || !permission) return false;

  const enriched = enrichUserWithPermissions(user);
  return enriched.permissions.includes(permission);
}

export function hasAnyPermission(user, permissions = []) {
  if (!user) return false;

  const enriched = enrichUserWithPermissions(user);
  return permissions.some((permission) => enriched.permissions.includes(permission));
}

export function hasAllPermissions(user, permissions = []) {
  if (!user) return false;

  const enriched = enrichUserWithPermissions(user);
  return permissions.every((permission) => enriched.permissions.includes(permission));
}

export function hasRole(user, roles = []) {
  if (!user) return false;

  const normalizedRole = String(user.role || "").trim().toLowerCase();
  return roles.map((role) => String(role || "").trim().toLowerCase()).includes(normalizedRole);
}
