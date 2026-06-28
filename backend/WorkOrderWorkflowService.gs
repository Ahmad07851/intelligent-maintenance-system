/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * WorkOrderWorkflowService.gs
 * Complete transactional State Machine for Work Orders, checking permissions,
 * managing timelines, and updating workloads.
 */

var WorkOrderWorkflowService = {
  /**
   * Transition work order state.
   */
  transition: function(id, action, payload, actor) {
    var existing = SheetService.findById(CONFIG.SHEETS.WORK_ORDERS, id);
    if (!existing) {
      throw new Error("Work order not found matching ID: " + id);
    }

    var wo = existing.data;
    if (wo.isDeleted === "true" || wo.isDeleted === true) {
      throw new Error("Cannot modify a deleted work order.");
    }

    // Enforce role-scoping on workflow transitions
    if (actor) {
      if (actor.role === CONFIG.ROLES.TECHNICIAN) {
        if (wo.assignedTo !== actor.email) {
          throw new Error("Forbidden: You are only permitted to perform transitions on work orders assigned to you.");
        }
      } else if (actor.role === CONFIG.ROLES.REQUESTER) {
        throw new Error("Forbidden: Requesters are not permitted to execute status transitions.");
      }
    }

    // Verify row version match
    if (payload.rowVersion !== undefined && Number(payload.rowVersion) !== Number(wo.rowVersion)) {
      throw new Error("Concurrency Conflict: Work order has been modified by another process. Please refresh the page.");
    }

    var statusFrom = wo.status;
    var statusTo = statusFrom;
    var updates = {
      updatedAt: new Date().toISOString(),
      updatedBy: actor.email,
      actorEmail: actor.email,
      actorRole: actor.role,
      actorName: actor.name,
      rowVersion: payload.rowVersion
    };

    var historyNotes = payload.notes || "";

    switch (action) {
      case "ASSIGN":
        PermissionService.enforce(actor.role, "PERM_WO_ASSIGN");
        if (!payload.assignedTo) {
          throw new Error("Assign action requires 'assignedTo' email parameter.");
        }
        statusTo = "Assigned";
        updates.status = "Assigned";
        updates.assignedTo = payload.assignedTo.toLowerCase();
        updates.assignedTeam = payload.assignedTeam || "";
        historyNotes = historyNotes || "Assigned work order to technician: " + payload.assignedTo;
        break;

      case "START":
        PermissionService.enforce(actor.role, "PERM_WO_START_HOLD");
        if (statusFrom !== "Assigned" && statusFrom !== "Open" && statusFrom !== "On Hold") {
          throw new Error("Cannot start work order from status: " + statusFrom);
        }
        statusTo = "In Progress";
        updates.status = "In Progress";
        if (!wo.startedAt) {
          updates.startedAt = new Date().toISOString();
        }
        historyNotes = historyNotes || "Technician started work on site.";
        break;

      case "HOLD":
        PermissionService.enforce(actor.role, "PERM_WO_START_HOLD");
        if (statusFrom !== "In Progress") {
          throw new Error("Cannot put work order on hold unless In Progress.");
        }
        statusTo = "On Hold";
        updates.status = "On Hold";
        historyNotes = historyNotes || "Work order paused: " + (payload.holdReason || "Waiting on parts");
        break;

      case "RESUME":
        PermissionService.enforce(actor.role, "PERM_WO_START_HOLD");
        if (statusFrom !== "On Hold") {
          throw new Error("Cannot resume work order unless On Hold.");
        }
        statusTo = "In Progress";
        updates.status = "In Progress";
        historyNotes = historyNotes || "Technician resumed work.";
        break;

      case "COMPLETE":
        PermissionService.enforce(actor.role, "PERM_WO_START_HOLD");
        if (statusFrom !== "In Progress" && statusFrom !== "Assigned") {
          throw new Error("Cannot complete work order unless started or assigned.");
        }
        
        updates.completionNotes = payload.completionNotes || "";
        
        // Evaluate SLA Rules to check if review is required
        var rule = SlaService.evaluateRule(wo.trade, wo.priority, wo.riskLevel);
        var reviewRequired = rule.requiresReview;

        if (reviewRequired) {
          statusTo = "Pending Review";
          updates.status = "Pending Review";
          updates.requiresReview = true;
          updates.reviewStatus = "Pending";
          historyNotes = historyNotes || "Technician marked as completed. Submitted for Supervisor closure review: " + (payload.completionNotes || "");
        } else {
          statusTo = "Completed";
          updates.status = "Completed";
          updates.completedAt = new Date().toISOString();
          historyNotes = historyNotes || "Technician marked task completed: " + (payload.completionNotes || "");
        }
        break;

      case "SUBMIT_FOR_REVIEW":
        PermissionService.enforce(actor.role, "PERM_WO_START_HOLD");
        statusTo = "Pending Review";
        updates.status = "Pending Review";
        updates.requiresReview = true;
        updates.reviewStatus = "Pending";
        updates.completionNotes = payload.completionNotes || wo.completionNotes || "";
        historyNotes = historyNotes || "Submitted for formal supervisor review.";
        break;

      case "APPROVE_REVIEW":
      case "CLOSE":
        PermissionService.enforce(actor.role, "PERM_WO_REVIEW");
        statusTo = "Closed";
        updates.status = "Closed";
        updates.closedAt = new Date().toISOString();
        updates.closureNotes = payload.closureNotes || "";
        updates.reviewStatus = "Approved";
        updates.reviewActor = actor.email;
        updates.reviewAt = new Date().toISOString();
        historyNotes = historyNotes || "Supervisor approved closeout review: " + (payload.closureNotes || "");
        break;

      case "REJECT_REVIEW":
        PermissionService.enforce(actor.role, "PERM_WO_REVIEW");
        statusTo = "In Progress"; // Send back to queue
        updates.status = "In Progress";
        updates.reviewStatus = "Rejected";
        updates.reviewActor = actor.email;
        updates.reviewAt = new Date().toISOString();
        updates.closureNotes = payload.closureNotes || "";
        historyNotes = historyNotes || "Supervisor rejected closeout review: " + (payload.closureNotes || "");
        break;

      case "CANCEL":
        PermissionService.enforce(actor.role, "PERM_WO_CANCEL");
        statusTo = "Cancelled";
        updates.status = "Cancelled";
        updates.cancelledAt = new Date().toISOString();
        updates.cancellationReason = payload.cancellationReason || "Cancelled by manager";
        historyNotes = historyNotes || "Work order cancelled. Reason: " + updates.cancellationReason;
        break;

      default:
        throw new Error("Invalid workflow trigger action: " + action);
    }

    // Apply the update to the WorkOrder sheet
    var result = SheetService.update(CONFIG.SHEETS.WORK_ORDERS, id, updates);

    // Save History Log
    try {
      this.logHistory(id, action, statusFrom, statusTo, actor, historyNotes);
    } catch (e) {
      Logger.log("Failed to append history timeline: " + e.toString());
    }

    // Recalculate workloads for any involved technicians
    try {
      if (wo.assignedTo) {
        TechnicianService.recalculateWorkload(wo.assignedTo);
      }
      if (updates.assignedTo && updates.assignedTo !== wo.assignedTo) {
        TechnicianService.recalculateWorkload(updates.assignedTo);
      }
    } catch (e) {
      Logger.log("Failed to adjust workloads: " + e.toString());
    }

    return result;
  },

  /**
   * Helper to write timeline updates.
   */
  logHistory: function(woId, action, fromStatus, toStatus, actor, notes) {
    var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID || SpreadsheetApp.getActiveSpreadsheet().getId());
    var sheet = ss.getSheetByName(CONFIG.SHEETS.WO_HISTORY);
    if (!sheet) return;

    var id = "HIST-" + new Date().getTime() + "-" + Math.floor(1000 + Math.random() * 9000);
    var createdAt = new Date().toISOString();

    // Headers: ["id", "workOrderId", "action", "statusFrom", "statusTo", "createdAt", "createdBy", "notes"]
    sheet.appendRow([
      id,
      woId,
      action,
      fromStatus,
      toStatus,
      createdAt,
      actor.email,
      notes || ""
    ]);
  }
};
