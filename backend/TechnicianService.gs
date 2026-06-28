/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * TechnicianService.gs
 * Manages Technician profiles, statuses, and workloads.
 */

var TechnicianService = {
  list: function() {
    return SheetService.listAll(CONFIG.SHEETS.TECHNICIANS);
  },

  create: function(payload, actor) {
    PermissionService.enforce(actor.role, "PERM_ADMIN");

    if (!payload.name || !payload.email || !payload.specialty) {
      throw new Error("Missing required technician parameters (name, email, specialty).");
    }

    var id = "TECH-" + new Date().getTime().toString().slice(-4) + "-" + Math.floor(100 + Math.random() * 900);
    var newTech = {
      id: id,
      name: payload.name.trim(),
      email: payload.email.trim().toLowerCase(),
      specialty: payload.specialty,
      status: payload.status || "Active",
      currentWorkload: 0,
      rowVersion: 1
    };

    return SheetService.insert(CONFIG.SHEETS.TECHNICIANS, newTech);
  },

  update: function(id, payload, actor) {
    // Only Administrators or Supervisors can manage technician specs
    PermissionService.enforce(actor.role, "PERM_WO_ASSIGN");

    var existing = SheetService.findById(CONFIG.SHEETS.TECHNICIANS, id);
    if (!existing) {
      throw new Error("Technician not found with ID: " + id);
    }

    var updated = {
      name: payload.name !== undefined ? payload.name.trim() : existing.data.name,
      specialty: payload.specialty !== undefined ? payload.specialty : existing.data.specialty,
      status: payload.status !== undefined ? payload.status : existing.data.status,
      currentWorkload: payload.currentWorkload !== undefined ? Number(payload.currentWorkload) : existing.data.currentWorkload,
      rowVersion: payload.rowVersion
    };

    return SheetService.update(CONFIG.SHEETS.TECHNICIANS, id, updated);
  },

  /**
   * Recalculates currentWorkload dynamically from WorkOrders sheet to avoid stale count drift.
   */
  recalculateWorkload: function(techEmail) {
    if (!techEmail) return;
    try {
      var wos = SheetService.listAll(CONFIG.SHEETS.WORK_ORDERS);
      var count = 0;
      for (var i = 0; i < wos.length; i++) {
        var wo = wos[i];
        if (wo.isDeleted === "true" || wo.isDeleted === true) continue;
        if (wo.assignedTo && wo.assignedTo.toLowerCase() === techEmail.toLowerCase()) {
          var s = wo.status;
          if (s === "Assigned" || s === "In Progress" || s === "On Hold") {
            count++;
          }
        }
      }

      // Find tech profile and update workload
      var techs = SheetService.listAll(CONFIG.SHEETS.TECHNICIANS);
      for (var i = 0; i < techs.length; i++) {
        if (techs[i].email.toLowerCase() === techEmail.toLowerCase()) {
          SheetService.update(CONFIG.SHEETS.TECHNICIANS, techs[i].id, {
            currentWorkload: count,
            rowVersion: techs[i].rowVersion
          });
          break;
        }
      }
    } catch (e) {
      Logger.log("Failed to recalculate workload for " + techEmail + ": " + e.toString());
    }
  }
};
