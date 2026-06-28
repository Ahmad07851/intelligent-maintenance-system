/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ApiGateway.gs
 * Primary doPost routing engine. Handles authentication, security policies, locks,
 * idempotency checks, and delegates actions to proper transactional services.
 */

function doPost(e) {
  var requestId = "REQ-GEN-" + new Date().getTime();
  var actorEmail = "anonymous";
  
  try {
    // 1. Safe JSON parsing of payload
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error("Bad Request: Inbound payload is empty or malformed.");
    }
    
    var request;
    try {
      request = JSON.parse(e.postData.contents);
    } catch (parseErr) {
      throw new Error("Bad Request: Failed parsing JSON body: " + parseErr.message);
    }

    var action = request.action;
    var payload = request.payload || {};
    requestId = request.requestId || ("REQ-" + new Date().getTime());
    
    if (!action) {
      throw new Error("Bad Request: Missing required 'action' dispatcher identifier.");
    }

    // 2. Exact-once check using Idempotency Service
    var cached = IdempotencyService.getCachedResponse(requestId);
    if (cached) {
      return ResponseService.jsonOutput(cached);
    }

    // 3. Setup/bootstrap action is public (to initialize database easily)
    if (action === "system.bootstrap") {
      var bootResult = SetupService.bootstrap();
      var bootResponse = ResponseService.success(bootResult, "Database bootstrapped successfully.", {
        requestId: requestId,
        timestamp: new Date().toISOString(),
        actor: "system"
      });
      return ResponseService.jsonOutput(bootResponse);
    }

    // 4. Resolve authenticated identity via AuthService
    var actor = AuthService.authenticate(request.auth);
    actorEmail = actor.email;

    // 5. Setup standard action transaction router
    var responseData = null;
    var responseMessage = "Action completed successfully.";

    // Helper checking mutating actions to execute under lock
    var mutatingActions = [
      "users.create", "users.update", "technicians.create", "technicians.update", 
      "locations.create", "locations.update", "picklists.create", "sla.create",
      "workOrders.create", "workOrders.update", "workOrders.delete", "workOrders.transition",
      "workOrders.addNote", "workOrders.addAttachment"
    ];

    var isMutating = mutatingActions.indexOf(action) !== -1;

    if (isMutating) {
      responseData = LockServiceWrapper.runWithLock(15000, function() {
        return executeAction(action, payload, actor, requestId);
      });
      responseMessage = "Transaction executed and logged under synchronized locks.";
    } else {
      responseData = executeAction(action, payload, actor, requestId);
    }

    // 6. Build response envelopes
    var meta = {
      requestId: requestId,
      timestamp: new Date().toISOString(),
      actor: actor.email
    };
    
    var finalResponse = ResponseService.success(responseData, responseMessage, meta);

    // Save history audit log
    if (isMutating) {
      AuditLogService.logAction(
        action.toUpperCase(), 
        actor.email, 
        "Transaction action '" + action + "' processed successfully.", 
        requestId
      );
      // Cache response for mutating actions to ensure strict idempotency
      IdempotencyService.saveResponse(requestId, finalResponse);
    }

    return ResponseService.jsonOutput(finalResponse);

  } catch (err) {
    var errorResponse = ErrorService.handleException(err, requestId, actorEmail);
    return ResponseService.jsonOutput(errorResponse);
  }
}

/**
 * Dispatches to sub-services based on action.
 */
function executeAction(action, payload, actor, requestId) {
  switch (action) {
    // Users
    case "users.list":
      return UserService.list();
    case "users.create":
      return UserService.create(payload, actor);
    case "users.update":
      return UserService.update(payload.id, payload, actor);

    // Technicians
    case "technicians.list":
      return TechnicianService.list();
    case "technicians.create":
      return TechnicianService.create(payload, actor);
    case "technicians.update":
      return TechnicianService.update(payload.id, payload, actor);

    // Locations
    case "locations.list":
      return LocationService.list();
    case "locations.create":
      return LocationService.create(payload, actor);
    case "locations.update":
      return LocationService.update(payload.id, payload, actor);

    // Picklists
    case "picklists.list":
      return PicklistService.list();
    case "picklists.create":
      return PicklistService.create(payload, actor);

    // SLA Rules
    case "sla.list":
      return SlaService.list();
    case "sla.create":
      return SlaService.create(payload, actor);

    // Work Orders
    case "workOrders.list":
      return WorkOrderQueryService.list(payload.filters);
    case "workOrders.details":
      return WorkOrderQueryService.getDetails(payload.id);
    case "workOrders.create":
      return WorkOrderService.create(payload, actor);
    case "workOrders.update":
      return WorkOrderService.update(payload.id, payload, actor);
    case "workOrders.delete":
      return WorkOrderService.delete(payload.id, actor);
    case "workOrders.transition":
      return WorkOrderWorkflowService.transition(payload.id, payload.transitionAction, payload, actor);
    
    case "workOrders.addNote":
      if (!payload.workOrderId || !payload.content) {
        throw new Error("Missing parameters for note creation (workOrderId, content).");
      }
      var noteId = "NOTE-" + new Date().getTime() + "-" + Math.floor(1000 + Math.random() * 9000);
      var newNote = {
        id: noteId,
        workOrderId: payload.workOrderId,
        createdAt: new Date().toISOString(),
        createdBy: actor.email,
        createdByName: actor.name,
        content: payload.content.trim()
      };
      var insertedNote = SheetService.insert(CONFIG.SHEETS.NOTES, newNote);
      // Log in timeline
      WorkOrderWorkflowService.logHistory(payload.workOrderId, "ADD_NOTE", "", "", actor, "Added comment: " + payload.content);
      return insertedNote;

    case "workOrders.addAttachment":
      return AttachmentService.addAttachment(payload, actor);

    // Frontend-compatible "wo.*" routes
    case "wo.list":
      return WorkOrderQueryService.list(payload);
    case "wo.get":
      var existingWo = SheetService.findById(CONFIG.SHEETS.WORK_ORDERS, payload.id);
      if (!existingWo) {
        throw new Error("Work order not found with ID: " + payload.id);
      }
      return existingWo.data;
    case "wo.listNotes":
      return WorkOrderQueryService.getNotes(payload.workOrderId);
    case "wo.listFiles":
      return WorkOrderQueryService.getAttachments(payload.workOrderId);
    case "wo.history":
      return WorkOrderQueryService.getHistory(payload.workOrderId);
    case "wo.addNote":
      if (!payload.workOrderId || !payload.content) {
        throw new Error("Missing parameters for note creation (workOrderId, content).");
      }
      var noteId = "NOTE-" + new Date().getTime() + "-" + Math.floor(1000 + Math.random() * 9000);
      var newNote = {
        id: noteId,
        workOrderId: payload.workOrderId,
        createdAt: new Date().toISOString(),
        createdBy: actor.email,
        createdByName: actor.name,
        content: payload.content.trim()
      };
      var insertedNote = SheetService.insert(CONFIG.SHEETS.NOTES, newNote);
      WorkOrderWorkflowService.logHistory(payload.workOrderId, "ADD_NOTE", "", "", actor, "Added comment: " + payload.content);
      return insertedNote;
    case "wo.uploadFile":
      return AttachmentService.addAttachment(payload, actor);
    case "wo.create":
      return WorkOrderService.create(payload, actor);
    case "wo.assign":
      return WorkOrderWorkflowService.transition(payload.id, "ASSIGN", payload, actor);
    case "wo.start":
      return WorkOrderWorkflowService.transition(payload.id, "START", payload, actor);
    case "wo.hold":
      return WorkOrderWorkflowService.transition(payload.id, "HOLD", { holdReason: payload.reason || payload.holdReason, ...payload }, actor);
    case "wo.resume":
      return WorkOrderWorkflowService.transition(payload.id, "RESUME", payload, actor);
    case "wo.complete":
      return WorkOrderWorkflowService.transition(payload.id, "COMPLETE", { completionNotes: payload.completionNotes || payload.notes, ...payload }, actor);
    case "wo.close":
      return WorkOrderWorkflowService.transition(payload.id, "CLOSE", { closureNotes: payload.closureNotes || payload.notes, ...payload }, actor);
    case "wo.rejectClosure":
      return WorkOrderWorkflowService.transition(payload.id, "REJECT_REVIEW", { closureNotes: payload.closureNotes || payload.notes, ...payload }, actor);
    case "wo.cancel":
      return WorkOrderWorkflowService.transition(payload.id, "CANCEL", { cancellationReason: payload.cancellationReason || payload.reason || payload.notes, ...payload }, actor);

    // Logs
    case "auditLog.list":
      return AuditLogService.list();
    case "systemLog.list":
      return SystemLogService.list();

    // Dashboard
    case "dashboard.get":
    case "dashboard.stats":
      return DashboardService.getStats();

    // Reports
    case "reports.performance":
      return ReportService.getPerformanceReport();

    default:
      throw new Error("Unknown dispatch action request: '" + action + "'");
  }
}
