/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * SetupService.gs
 * Database bootstrapping service. Automatically provisions sheets, headers, and seeds default profiles.
 */

var SetupService = {
  /**
   * Main bootstrap entry point. Creates all required sheets if not existing, formats columns,
   * and seeds initial system data (such as Ahmad Arafat as the System Owner).
   */
  bootstrap: function() {
    var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID || SpreadsheetApp.getActiveSpreadsheet().getId());
    
    // Define exact tables with their headers
    var schemaDefinitions = [
      { name: CONFIG.SHEETS.USERS, headers: ["id", "email", "name", "role", "isActive", "rowVersion"] },
      { name: CONFIG.SHEETS.LOCATIONS, headers: ["id", "name", "building", "floor", "room", "rowVersion"] },
      { name: CONFIG.SHEETS.PICKLISTS, headers: ["id", "category", "value", "label"] },
      { name: CONFIG.SHEETS.TECHNICIANS, headers: ["id", "name", "email", "specialty", "status", "currentWorkload", "rowVersion"] },
      { name: CONFIG.SHEETS.SLA_RULES, headers: ["id", "priority", "riskLevel", "trade", "targetHours", "escalationHours", "requiresReview"] },
      { name: CONFIG.SHEETS.WORK_ORDERS, headers: [
        "id", "rowVersion", "isDeleted", "sourceModule", "lastAction", "createdAt", "createdBy", 
        "updatedAt", "updatedBy", "actorEmail", "actorRole", "actorName", "woNumber", "title", 
        "description", "requestSource", "requestedBy", "requestedByEmail", "requestedByPhone", 
        "department", "locationId", "building", "floor", "room", "category", "trade", "priority", 
        "riskLevel", "status", "assignedTeam", "assignedTo", "dueDate", "slaTargetHours", 
        "slaBreached", "startedAt", "completedAt", "closedAt", "cancelledAt", "cancellationReason", 
        "completionNotes", "closureNotes", "requiresReview", "reviewStatus", "reviewActor", "reviewAt"
      ]},
      { name: CONFIG.SHEETS.NOTES, headers: ["id", "workOrderId", "createdAt", "createdBy", "createdByName", "content"] },
      { name: CONFIG.SHEETS.ATTACHMENTS, headers: ["id", "workOrderId", "fileName", "fileSize", "fileType", "driveUrl", "createdAt", "createdBy"] },
      { name: CONFIG.SHEETS.HISTORY, headers: ["id", "workOrderId", "action", "statusFrom", "statusTo", "createdAt", "createdBy", "notes"] },
      { name: CONFIG.SHEETS.MOJO_TICKETS, headers: ["id", "ticketNumber", "title", "description", "requestedBy", "requestedByEmail", "location", "createdAt", "status", "convertedWoNumber"] },
      { name: CONFIG.SHEETS.AUDIT_LOGS, headers: ["id", "action", "timestamp", "actor", "details", "requestId"] },
      { name: CONFIG.SHEETS.SYSTEM_LOGS, headers: ["id", "errorType", "message", "timestamp", "stackTrace", "requestId"] },
      { name: CONFIG.SHEETS.IDEMPOTENCY_KEYS, headers: ["id", "key", "responseJson", "createdAt"] }
    ];

    for (var i = 0; i < schemaDefinitions.length; i++) {
      var table = schemaDefinitions[i];
      var sheet = ss.getSheetByName(table.name);
      
      if (!sheet) {
        sheet = ss.insertSheet(table.name);
      }
      
      // Ensure headers exist
      var currentHeaders = [];
      if (sheet.getLastColumn() > 0) {
        currentHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      }
      
      if (currentHeaders.length === 0 || currentHeaders[0] !== table.headers[0]) {
        sheet.clear();
        sheet.getRange(1, 1, 1, table.headers.length).setValues([table.headers]);
        sheet.getRange(1, 1, 1, table.headers.length).setFontWeight("bold").setBackground("#F1F5F9");
        sheet.setFrozenRows(1);
      }
    }

    // Seed data if empty
    this.seedDefaultData(ss);
    
    return "Bootstrapped CMMS databases with " + schemaDefinitions.length + " schemas successfully.";
  },

  /**
   * Seeds default users, picklists, locations, technicians, and SLA rules.
   */
  seedDefaultData: function(ss) {
    // Seed Users
    var userSheet = ss.getSheetByName(CONFIG.SHEETS.USERS);
    if (userSheet.getLastRow() <= 1) {
      var users = [
        ["U-001", "ahmadarafat51@gmail.com", "Ahmad Arafat", "System Owner", "true", "1"],
        ["U-002", "supervisor@ims.com", "Sarah Jenkins", "Supervisor", "true", "1"],
        ["U-003", "tech.electrical@ims.com", "Marcus Sparks", "Technician", "true", "1"],
        ["U-004", "tech.hvac@ims.com", "Linda Frost", "Technician", "true", "1"],
        ["U-005", "tech.plumbing@ims.com", "David Drain", "Technician", "true", "1"],
        ["U-006", "coordinator@ims.com", "Tariq Mahmood", "Coordinator", "true", "1"],
        ["U-007", "manager@ims.com", "Emily Vance", "Facilities Manager", "true", "1"],
        ["U-008", "requester@ims.com", "John Doe", "Requester", "true", "1"]
      ];
      userSheet.getRange(2, 1, users.length, 6).setValues(users);
    }

    // Seed Locations
    var locSheet = ss.getSheetByName(CONFIG.SHEETS.LOCATIONS);
    if (locSheet.getLastRow() <= 1) {
      var locs = [
        ["LOC-001", "Main HQ", "Building A", "Ground Floor", "Reception", "1"],
        ["LOC-002", "Main HQ", "Building A", "3rd Floor", "Server Room A", "1"],
        ["LOC-003", "Main HQ", "Building B", "2nd Floor", "Conf Room 204", "1"],
        ["LOC-004", "East Campus Warehouse", "Warehouse 1", "Section B", "Loading Dock 4", "1"],
        ["LOC-005", "R&D Facility", "Lab Building", "Basement", "Chemical Lab 02", "1"]
      ];
      locSheet.getRange(2, 1, locs.length, 6).setValues(locs);
    }

    // Seed Picklists
    var pickSheet = ss.getSheetByName(CONFIG.SHEETS.PICKLISTS);
    if (pickSheet.getLastRow() <= 1) {
      var picks = [
        ["PK-001", "Trade", "HVAC", "HVAC"],
        ["PK-002", "Trade", "Electrical", "Electrical"],
        ["PK-003", "Trade", "Plumbing", "Plumbing"],
        ["PK-004", "Trade", "Carpentry", "Carpentry"],
        ["PK-005", "Trade", "General Maintenance", "General Maintenance"],
        ["PK-006", "Trade", "Janitorial", "Janitorial"],
        ["PK-101", "Category", "Corrective", "Corrective Maintenance"],
        ["PK-102", "Category", "Preventive", "Preventive Maintenance"],
        ["PK-103", "Category", "Emergency", "Emergency Repair"],
        ["PK-104", "Category", "Safety Inspection", "Safety / Environmental"],
        ["PK-105", "Category", "Routine Request", "Routine General Request"],
        ["PK-201", "RequestSource", "Mojo Triage", "Mojo Intake Triage"],
        ["PK-202", "RequestSource", "Portal", "SaaS User Portal"],
        ["PK-203", "RequestSource", "Phone", "Phone Hotline"],
        ["PK-204", "RequestSource", "Email", "Email Dispatch"],
        ["PK-205", "RequestSource", "Walk-in", "Walk-in Triage"],
        ["PK-301", "Department", "Facilities & Real Estate", "Facilities & Real Estate"],
        ["PK-302", "Department", "IT Infrastructure", "IT Infrastructure"],
        ["PK-303", "Department", "Operations & Logistics", "Operations & Logistics"],
        ["PK-304", "Department", "Human Resources", "Human Resources"],
        ["PK-305", "Department", "Production Floor", "Production Floor"]
      ];
      pickSheet.getRange(2, 1, picks.length, 4).setValues(picks);
    }

    // Seed Technicians
    var techSheet = ss.getSheetByName(CONFIG.SHEETS.TECHNICIANS);
    if (techSheet.getLastRow() <= 1) {
      var techs = [
        ["TECH-001", "Marcus Sparks", "tech.electrical@ims.com", "Electrical", "Active", "0", "1"],
        ["TECH-002", "Linda Frost", "tech.hvac@ims.com", "HVAC", "Active", "0", "1"],
        ["TECH-003", "David Drain", "tech.plumbing@ims.com", "Plumbing", "Active", "0", "1"],
        ["TECH-004", "Aris Carpenter", "tech.carpenter@ims.com", "Carpentry", "On Leave", "0", "1"],
        ["TECH-005", "Sarah Handy", "tech.general@ims.com", "General Maintenance", "Active", "0", "1"]
      ];
      techSheet.getRange(2, 1, techs.length, 7).setValues(techs);
    }

    // Seed SLA Rules
    var slaSheet = ss.getSheetByName(CONFIG.SHEETS.SLA_RULES);
    if (slaSheet.getLastRow() <= 1) {
      var rules = [
        ["SLA-001", "Critical", "High", "Electrical", "4", "1", "true"],
        ["SLA-002", "Critical", "High", "HVAC", "4", "1", "true"],
        ["SLA-003", "High", "Medium", "Electrical", "24", "4", "true"],
        ["SLA-004", "High", "Medium", "HVAC", "24", "4", "true"],
        ["SLA-005", "Medium", "Low", "Plumbing", "48", "8", "false"],
        ["SLA-006", "Low", "Low", "General Maintenance", "72", "12", "false"]
      ];
      slaSheet.getRange(2, 1, rules.length, 7).setValues(rules);
    }

    // Seed Mojo Tickets (just preloaded to triage)
    var mojoSheet = ss.getSheetByName(CONFIG.SHEETS.MOJO_TICKETS);
    if (mojoSheet.getLastRow() <= 1) {
      var tickets = [
        ["MJ-001", "MJ-9021", "Chemical fumes smell in Basement Lab", "A strong sweet chemical odor is reported near the fume hood in Basement Chemical Lab 02. Need immediate exhaust vent fan check.", "Lab Tech Charlie", "charlie.lab@ims.com", "R&D Facility - Basement Lab", "2026-06-27T14:30:00Z", "Pending", ""],
        ["MJ-002", "MJ-9022", "Leaking sink in Building B Conference Room", "Sink in the kitchenette of Conf Room 204 is leaking at the U-joint below. Water is pooling in the cabinet.", "Emily Vance", "manager@ims.com", "Main HQ - Building B - 2nd Floor", "2026-06-27T16:15:00Z", "Pending", ""]
      ];
      mojoSheet.getRange(2, 1, tickets.length, 10).setValues(tickets);
    }
  }
};
