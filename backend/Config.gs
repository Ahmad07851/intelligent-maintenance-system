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
  
  // Sheet names representing the normalized tables
  SHEETS: {
    USERS: "Users",
    LOCATIONS: "Locations",
    PICKLISTS: "Picklists",
    TECHNICIANS: "Technicians",
    SLA_RULES: "SlaRules",
    WORK_ORDERS: "WorkOrders",
    NOTES: "Notes",
    ATTACHMENTS: "Attachments",
    HISTORY: "History",
    MOJO_TICKETS: "MojoTickets",
    AUDIT_LOGS: "AuditLogs",
    SYSTEM_LOGS: "SystemLogs",
    IDEMPOTENCY_KEYS: "IdempotencyKeys"
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
