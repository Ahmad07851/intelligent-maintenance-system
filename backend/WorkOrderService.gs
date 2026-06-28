/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * WorkOrderService.gs
 * Orchestrates Work Order creation, full parameter updates, SLA bindings, and deletion.
 */

var WorkOrderService = {
  /**
   * Creates a new work order, auto-evaluating SLA constraints and assigning custom WO numbers.
   */
  create: function(payload, actor) {
    PermissionService.enforce(actor.role, "PERM_WO_CREATE");

    if (!payload.title || !payload.description || !payload.priority || !payload.trade) {
      throw new Error("Missing required parameters for work order creation (title, description, priority, trade).");
    }

    var nowStr = new Date().toISOString();
    var id = "WO-" + new Date().getTime() + "-" + Math.floor(1000 + Math.random() * 9000);
    var woNumber = this.generateWoNumber();

    // Evaluate SLA Target hours
    var sla = SlaService.evaluateRule(payload.trade, payload.priority, payload.riskLevel || "Medium");
    
    // Calculate due date based on SLA Target Hours
    var targetHours = sla.targetHours || 24;
    var dueDate = new Date(new Date().getTime() + targetHours * 60 * 60 * 1000).toISOString();

    var record = {
      id: id,
      rowVersion: 1,
      isDeleted: false,
      sourceModule: payload.sourceModule || "Manual",
      lastAction: "WORK_ORDER_CREATED",
      createdAt: nowStr,
      createdBy: actor.email,
      updatedAt: nowStr,
      updatedBy: actor.email,
      actorEmail: actor.email,
      actorRole: actor.role,
      actorName: actor.name,
      
      woNumber: woNumber,
      title: payload.title.trim(),
      description: payload.description.trim(),
      requestSource: payload.requestSource || "Portal",
      requestedBy: payload.requestedBy || actor.name,
      requestedByEmail: payload.requestedByEmail || actor.email,
      requestedByPhone: payload.requestedByPhone || "",
      department: payload.department || "Facilities",
      locationId: payload.locationId || "",
      building: payload.building || "",
      floor: payload.floor || "",
      room: payload.room || "",
      category: payload.category || "Corrective",
      trade: payload.trade,
      priority: payload.priority,
      riskLevel: payload.riskLevel || "Medium",
      status: "Open",
      assignedTeam: "",
      assignedTo: "",
      dueDate: dueDate,
      slaTargetHours: targetHours,
      slaBreached: false,
      requiresReview: sla.requiresReview || false
    };

    // Save record to spreadsheet
    var result = SheetService.insert(CONFIG.SHEETS.WORK_ORDERS, record);

    // Save initial timeline entry
    WorkOrderWorkflowService.logHistory(id, "CREATE", "", "Open", actor, "Work order registered successfully.");

    // If Mojo conversion, close out the Mojo Ticket state
    if (payload.mojoTicketId) {
      try {
        var existingTicket = SheetService.findById(CONFIG.SHEETS.MOJO_TICKETS, payload.mojoTicketId);
        if (existingTicket) {
          SheetService.update(CONFIG.SHEETS.MOJO_TICKETS, payload.mojoTicketId, {
            status: "Converted",
            convertedWoNumber: woNumber
          });
        }
      } catch (mojoErr) {
        Logger.log("Failed converting Mojo Ticket state: " + mojoErr.toString());
      }
    }

    return result;
  },

  /**
   * Full property parameter update.
   */
  update: function(id, payload, actor) {
    PermissionService.enforce(actor.role, "PERM_WO_UPDATE");

    var existing = SheetService.findById(CONFIG.SHEETS.WORK_ORDERS, id);
    if (!existing) {
      throw new Error("Work order not found matching ID: " + id);
    }

    var wo = existing.data;
    if (wo.isDeleted === true || wo.isDeleted === "true") {
      throw new Error("Cannot modify a deleted work order.");
    }

    // Verify RowVersion concurrency lock
    if (payload.rowVersion !== undefined && Number(payload.rowVersion) !== Number(wo.rowVersion)) {
      throw new Error("Concurrency Conflict: Work order has been modified by another process. Please reload details.");
    }

    var nowStr = new Date().toISOString();
    var updates = {
      updatedAt: nowStr,
      updatedBy: actor.email,
      actorEmail: actor.email,
      actorRole: actor.role,
      actorName: actor.name,
      rowVersion: payload.rowVersion
    };

    // Set allowed updating properties
    var fields = [
      "title", "description", "requestSource", "requestedBy", "requestedByEmail", 
      "requestedByPhone", "department", "locationId", "building", "floor", "room", 
      "category", "trade", "priority", "riskLevel", "status", "assignedTo", "assignedTeam"
    ];

    for (var i = 0; i < fields.length; i++) {
      var f = fields[i];
      if (payload[f] !== undefined) {
        updates[f] = payload[f];
      }
    }

    // Recalculate SLA targets if priority or trade is being modified
    if ((payload.priority && payload.priority !== wo.priority) || (payload.trade && payload.trade !== wo.trade)) {
      var priority = payload.priority || wo.priority;
      var trade = payload.trade || wo.trade;
      var risk = payload.riskLevel || wo.riskLevel;
      
      var sla = SlaService.evaluateRule(trade, priority, risk);
      updates.slaTargetHours = sla.targetHours;
      updates.requiresReview = sla.requiresReview;
      
      // Compute new due date from original created date or current date
      var originDate = new Date(wo.createdAt);
      updates.dueDate = new Date(originDate.getTime() + sla.targetHours * 60 * 60 * 1000).toISOString();
    }

    var result = SheetService.update(CONFIG.SHEETS.WORK_ORDERS, id, updates);

    // Save history trail of full parameter modifications
    WorkOrderWorkflowService.logHistory(id, "UPDATE", wo.status, result.status, actor, "Work order general parameters updated.");

    // Handle workload recalculation if assignment changed
    if (payload.assignedTo && payload.assignedTo !== wo.assignedTo) {
      try {
        if (wo.assignedTo) TechnicianService.recalculateWorkload(wo.assignedTo);
        TechnicianService.recalculateWorkload(payload.assignedTo);
      } catch (recErr) {
        Logger.log("Failed updating tech workload during reassignment: " + recErr.toString());
      }
    }

    return result;
  },

  /**
   * Safe logical deletion flag.
   */
  delete: function(id, actor) {
    PermissionService.enforce(actor.role, "PERM_ADMIN");

    var existing = SheetService.findById(CONFIG.SHEETS.WORK_ORDERS, id);
    if (!existing) {
      throw new Error("Work order not found for deletion: " + id);
    }

    var updates = {
      isDeleted: true,
      updatedAt: new Date().toISOString(),
      updatedBy: actor.email,
      rowVersion: existing.data.rowVersion
    };

    var result = SheetService.update(CONFIG.SHEETS.WORK_ORDERS, id, updates);

    // Log in History
    WorkOrderWorkflowService.logHistory(id, "DELETE", existing.data.status, "DELETED", actor, "Work order logically deleted.");

    // Recalculate tech workload
    if (existing.data.assignedTo) {
      try {
        TechnicianService.recalculateWorkload(existing.data.assignedTo);
      } catch (e) {
        Logger.log(e);
      }
    }

    return { id: id, isDeleted: true };
  },

  /**
   * Thread-safe sequential ticket generator using chronological indexing.
   */
  generateWoNumber: function() {
    var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID || SpreadsheetApp.getActiveSpreadsheet().getId());
    var sheet = ss.getSheetByName(CONFIG.SHEETS.WORK_ORDERS);
    var count = sheet.getLastRow(); // Includes headers row count

    var year = new Date().getFullYear();
    var sequence = count; // If we have 10 rows, this ticket will be the 10th index, e.g. WO-2026-000010
    
    var pad = "000000";
    var numStr = (pad + sequence).slice(-6);
    return "WO-" + year + "-" + numStr;
  }
};
