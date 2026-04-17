export const ROLES = {
  ADMIN: "admin",
  STRATEGIST: "strategist",
  ANALYST: "analyst",
  MAILOPS: "mailops",
  USER: "user"
};

export const PERMISSIONS = {
  VIEW_DASHBOARD: "view_dashboard",
  VIEW_CANDIDATES: "view_candidates",
  EDIT_CANDIDATES: "edit_candidates",
  VIEW_CANDIDATE_ADMIN: "view_candidate_admin",
  VIEW_BETA_ACCESS: "view_beta_access",
  VIEW_MAP: "view_map",
  VIEW_DONORS: "view_donors",
  VIEW_FORECAST: "view_forecast",
  VIEW_POWER_RANKINGS: "view_power_rankings",
  VIEW_FUNDRAISING: "view_fundraising",
  VIEW_VENDORS: "view_vendors",
  VIEW_CONSULTANTS: "view_consultants",
  VIEW_AI_CHAT: "view_ai_chat",
  VIEW_WAR_ROOM: "view_war_room",
  VIEW_COMMAND_CENTER: "view_command_center",
  VIEW_MAILOPS: "view_mailops",
  MANAGE_MAILOPS: "manage_mailops",
  VIEW_BILLING: "view_billing"
};

const rolePermissions = {
  [ROLES.ADMIN]: Object.values(PERMISSIONS),

  [ROLES.STRATEGIST]: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_CANDIDATES,
    PERMISSIONS.EDIT_CANDIDATES,
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
    PERMISSIONS.VIEW_BILLING
  ],

  [ROLES.ANALYST]: [
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
    PERMISSIONS.VIEW_COMMAND_CENTER
  ],

  [ROLES.MAILOPS]: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_MAILOPS,
    PERMISSIONS.MANAGE_MAILOPS,
    PERMISSIONS.VIEW_VENDORS,
    PERMISSIONS.VIEW_COMMAND_CENTER
  ],

  [ROLES.USER]: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_CANDIDATES,
    PERMISSIONS.VIEW_MAP,
    PERMISSIONS.VIEW_FORECAST,
    PERMISSIONS.VIEW_POWER_RANKINGS,
    PERMISSIONS.VIEW_FUNDRAISING,
    PERMISSIONS.VIEW_VENDORS,
    PERMISSIONS.VIEW_CONSULTANTS
  ]
};

export function normalizeRole(role = "") {
  return String(role || "").trim().toLowerCase();
}

export function getPermissionsForRole(role = "") {
  const normalized = normalizeRole(role);
  return rolePermissions[normalized] || [];
}

export function hasPermission(user, permission) {
  if (!user) return false;
  const permissions = getPermissionsForRole(user.role);
  return permissions.includes(permission);
}

export function hasAnyPermission(user, requiredPermissions = []) {
  if (!requiredPermissions.length) return true;
  return requiredPermissions.some((permission) => hasPermission(user, permission));
}
