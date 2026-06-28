/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * IdempotencyService.gs
 * Tracks transaction idempotency keys to enforce exact-once delivery.
 */

var IdempotencyService = {
  /**
   * Retrieves an existing cached response for an idempotency key.
   * @param {string} key - The unique transaction request ID/idempotency key.
   * @return {Object|null} Cached response JSON parsed, or null.
   */
  getCachedResponse: function(key) {
    if (!key) return null;
    try {
      var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID || SpreadsheetApp.getActiveSpreadsheet().getId());
      var sheet = ss.getSheetByName(CONFIG.SHEETS.IDEMPOTENCY_KEYS);
      if (!sheet) return null;
      
      var data = sheet.getDataRange().getValues();
      if (data.length <= 1) return null;
      
      for (var i = 1; i < data.length; i++) {
        if (data[i][1] === key) { // Index 1 is the key column
          try {
            return JSON.parse(data[i][2]); // Index 2 is the response JSON
          } catch (e) {
            return null;
          }
        }
      }
    } catch (e) {
      Logger.log("Idempotency get key failed: " + e.toString());
    }
    return null;
  },

  /**
   * Saves a response against an idempotency key.
   * @param {string} key - The unique transaction request ID/idempotency key.
   * @param {Object} response - The API response object to cache.
   */
  saveResponse: function(key, response) {
    if (!key || !response) return;
    try {
      var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID || SpreadsheetApp.getActiveSpreadsheet().getId());
      var sheet = ss.getSheetByName(CONFIG.SHEETS.IDEMPOTENCY_KEYS);
      if (!sheet) return;
      
      var id = "IDEM-" + new Date().getTime() + "-" + Math.floor(1000 + Math.random() * 9000);
      var createdAt = new Date().toISOString();
      var responseJson = JSON.stringify(response);
      
      // Headers: ["id", "key", "responseJson", "createdAt"]
      sheet.appendRow([id, key, responseJson, createdAt]);
    } catch (e) {
      Logger.log("Idempotency save key failed: " + e.toString());
    }
  }
};
