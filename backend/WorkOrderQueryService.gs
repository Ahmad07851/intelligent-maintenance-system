/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * WorkOrderQueryService.gs
 * Efficient list filtering, searching, sorting, and full history construction.
 */

var WorkOrderQueryService = {
  /**
   * Lists all non-deleted work orders.
   */
  list: function(filters) {
    var raw = SheetService.listAll(CONFIG.SHEETS.WORK_ORDERS);
    var results = [];

    for (var i = 0; i < raw.length; i++) {
      var item = raw[i];
      if (item.isDeleted === true || item.isDeleted === "true") {
        continue;
      }

      // Filter applications
      if (filters) {
        if (filters.status && item.status !== filters.status) continue;
        if (filters.priority && item.priority !== filters.priority) continue;
        if (filters.trade && item.trade !== filters.trade) continue;
        if (filters.assignedTo && item.assignedTo !== filters.assignedTo) continue;
        if (filters.slaBreached !== undefined) {
          var breached = item.slaBreached === true || item.slaBreached === "true";
          if (breached !== filters.slaBreached) continue;
        }
      }

      results.push(item);
    }

    // Sort by createdAt descending
    results.sort(function(a, b) {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return results;
  },

  /**
   * Assembles work order details, notes, and attachment metadata.
   */
  getDetails: function(id) {
    var existing = SheetService.findById(CONFIG.SHEETS.WORK_ORDERS, id);
    if (!existing) {
      throw new Error("Work order details not found for ID: " + id);
    }

    var wo = existing.data;
    if (wo.isDeleted === true || wo.isDeleted === "true") {
      throw new Error("Cannot query details of a deleted work order.");
    }

    // Gather relative entries
    var notes = this.getNotes(id);
    var files = this.getAttachments(id);
    var timeline = this.getHistory(id);

    return {
      workOrder: wo,
      notes: notes,
      attachments: files,
      history: timeline
    };
  },

  /**
   * Queries related notes.
   */
  getNotes: function(woId) {
    var all = SheetService.listAll(CONFIG.SHEETS.NOTES);
    var filtered = [];
    for (var i = 0; i < all.length; i++) {
      if (all[i].workOrderId === woId) {
        filtered.push(all[i]);
      }
    }
    // Sort by newest notes first
    filtered.sort(function(a, b) {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return filtered;
  },

  /**
   * Queries related attachments.
   */
  getAttachments: function(woId) {
    var all = SheetService.listAll(CONFIG.SHEETS.ATTACHMENTS);
    var filtered = [];
    for (var i = 0; i < all.length; i++) {
      if (all[i].workOrderId === woId) {
        filtered.push(all[i]);
      }
    }
    return filtered;
  },

  /**
   * Queries relative timeline.
   */
  getHistory: function(woId) {
    var all = SheetService.listAll(CONFIG.SHEETS.HISTORY);
    var filtered = [];
    for (var i = 0; i < all.length; i++) {
      if (all[i].workOrderId === woId) {
        filtered.push(all[i]);
      }
    }
    // Sort chronological descending
    filtered.sort(function(a, b) {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return filtered;
  }
};
