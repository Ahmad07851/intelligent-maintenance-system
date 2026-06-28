/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * SystemLogService.gs
 * Records backend failures and exception stacks directly to Google Sheets database.
 */

var SystemLogService = {
  /**
   * Appends an error log entry.
   */
  logError: function(errorType, message, stackTrace, requestId) {
    try {
      var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID || SpreadsheetApp.getActiveSpreadsheet().getId());
      var sheet = ss.getSheetByName(CONFIG.SHEETS.SYSTEM_LOGS);
      if (!sheet) return;

      var id = "LOG-" + new Date().getTime() + "-" + Math.floor(1000 + Math.random() * 9000);
      var timestamp = new Date().toISOString();
      
      // Headers: ["id", "errorType", "message", "timestamp", "stackTrace", "requestId"]
      sheet.appendRow([
        id,
        errorType || "UncaughtError",
        message || "",
        timestamp,
        stackTrace || "",
        requestId || ""
      ]);
    } catch (e) {
      Logger.log("Critical failure inside SystemLogService: " + e.toString());
    }
  },

  list: function() {
    return SheetService.listAll(CONFIG.SHEETS.SYSTEM_LOGS);
  }
};
