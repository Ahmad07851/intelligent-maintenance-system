/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Config.gs
 * Global configuration constants and spreadsheet bindings for the Intelligent CMMS.
 */

var CONFIG = {
  // Spreadsheet identification
  // If blank, it binds to the Active Spreadsheet containing the script.
  SPREADSHEET_ID: "",
  
  // Sheet names representing the normalized tables exactly as required
  SHEETS: {
    APP_SETTINGS: "APP_SETTINGS",
    USERS: "USERS",
    ROLES: "ROLES",
    PERMISSIONS: "PERMISSIONS",
    ROLE_PERMISSIONS: "ROLE_PERMISSIONS",
    PICKLISTS: "PICKLISTS",
    LOCATIONS: "LOCATIONS",
    TECHNICIANS: "TECHNICIANS",
    WORK_ORDERS: "WORK_ORDERS",
    WO_NOTES: "WO_NOTES",
    WO_FILES: "WO_FILES",
    WO_HISTORY: "WO_HISTORY",
    WO_ASSIGNMENTS: "WO_ASSIGNMENTS",
    WO_REVIEWS: "WO_REVIEWS",
    SLA_RULES: "SLA_RULES",
    NOTIFICATIONS: "NOTIFICATIONS",
    DASHBOARD_CACHE: "DASHBOARD_CACHE",
    SYSTEM_LOGS: "SYSTEM_LOGS",
    AUDIT_LOG: "AUDIT_LOG",
    IDEMPOTENCY_KEYS: "IDEMPOTENCY_KEYS",
    MOJO_TICKETS: "MOJO_TICKETS"
  },

  // Security roles
  ROLES: {
    SYSTEM_OWNER: "System Owner",
    SUPERVISOR: "Supervisor",
    TECHNICIAN: "Technician",
    COORDINATOR: "Coordinator",
    FACILITIES_MANAGER: "Facilities Manager",
    REQUESTER: "Requester",
    VIEWER: "Viewer"
  },

  // Role permissions assignment
  ROLE_PERMISSIONS: {
    "System Owner": ["PERM_ALL", "PERM_WO_CREATE", "PERM_WO_UPDATE", "PERM_WO_ASSIGN", "PERM_WO_START_HOLD", "PERM_WO_REVIEW", "PERM_WO_CANCEL", "PERM_ADMIN", "PERM_REPORTS"],
    "Facilities Manager": ["PERM_WO_CREATE", "PERM_WO_UPDATE", "PERM_WO_ASSIGN", "PERM_WO_START_HOLD", "PERM_WO_REVIEW", "PERM_WO_CANCEL", "PERM_REPORTS"],
    "Supervisor": ["PERM_WO_CREATE", "PERM_WO_UPDATE", "PERM_WO_ASSIGN", "PERM_WO_START_HOLD", "PERM_WO_REVIEW", "PERM_WO_CANCEL"],
    "Coordinator": ["PERM_WO_CREATE", "PERM_WO_UPDATE", "PERM_WO_ASSIGN"],
    "Technician": ["PERM_WO_START_HOLD"],
    "Requester": ["PERM_WO_CREATE"],
    "Viewer": []
  }
};
