/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * AuditLogService.gs
 * Appends immutable auditing event entries on critical modifications.
 */

var AuditLogService = {
  /**
   * Appends an audit log entry.
   */
  logAction: function(action, actor, details, requestId) {
    try {
      var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID || SpreadsheetApp.getActiveSpreadsheet().getId());
      var sheet = ss.getSheetByName(CONFIG.SHEETS.AUDIT_LOG);
      if (!sheet) return;

      var id = "AUD-" + new Date().getTime() + "-" + Math.floor(1000 + Math.random() * 9000);
      var timestamp = new Date().toISOString();
      
      // Headers: ["id", "action", "timestamp", "actor", "details", "requestId"]
      sheet.appendRow([
        id,
        action || "UNKNOWN_ACTION",
        timestamp,
        actor || "system",
        details || "",
        requestId || ""
      ]);
    } catch (e) {
      Logger.log("Audit log failed to write: " + e.toString());
    }
  },

  list: function() {
    return SheetService.listAll(CONFIG.SHEETS.AUDIT_LOG);
  }
};
