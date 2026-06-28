/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * SheetService.gs
 * Generalised spreadsheet CRUD mapping and RowVersion optimistic lock enforcement.
 */

var SheetService = {
  /**
   * Helper to open the active or designated spreadsheet.
   */
  getSpreadsheet: function() {
    if (CONFIG.SPREADSHEET_ID) {
      return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    }
    return SpreadsheetApp.getActiveSpreadsheet();
  },

  /**
   * Gets headers for a sheet.
   */
  getHeaders: function(sheet) {
    var range = sheet.getRange(1, 1, 1, sheet.getLastColumn());
    if (range.getNumRows() === 0 || range.getNumColumns() === 0) return [];
    return range.getValues()[0];
  },

  /**
   * Parses sheet rows into an array of objects.
   */
  listAll: function(sheetName) {
    var ss = this.getSpreadsheet();
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      throw new Error("Table sheet not found: " + sheetName);
    }

    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) return [];

    var headers = this.getHeaders(sheet);
    var values = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();

    var results = [];
    for (var r = 0; r < values.length; r++) {
      var row = values[r];
      var item = {};
      var isEmpty = true;
      for (var c = 0; c < headers.length; c++) {
        var val = row[c];
        // Parse JSON strings, booleans, dates or standard strings
        if (typeof val === "string") {
          if (val === "true") val = true;
          else if (val === "false") val = false;
        }
        item[headers[c]] = val;
        if (val !== "") isEmpty = false;
      }
      if (!isEmpty) {
        results.push(item);
      }
    }
    return results;
  },

  /**
   * Finds a row by its unique ID.
   * Returns { index: rowNumber, data: rowObject } or null.
   */
  findById: function(sheetName, id) {
    var ss = this.getSpreadsheet();
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) throw new Error("Table sheet not found: " + sheetName);

    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) return null;

    var headers = this.getHeaders(sheet);
    var values = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();

    for (var r = 0; r < values.length; r++) {
      if (values[r][0] === id) { // First column is always ID
        var item = {};
        for (var c = 0; c < headers.length; c++) {
          var val = values[r][c];
          if (typeof val === "string") {
            if (val === "true") val = true;
            else if (val === "false") val = false;
          }
          item[headers[c]] = val;
        }
        return {
          index: r + 2, // 1-indexed plus header row offset
          data: item
        };
      }
    }
    return null;
  },

  /**
   * Inserts a record.
   */
  insert: function(sheetName, record) {
    var ss = this.getSpreadsheet();
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) throw new Error("Table sheet not found: " + sheetName);

    var headers = this.getHeaders(sheet);
    var rowValues = [];
    
    // Auto increment row version
    if (headers.indexOf("rowVersion") !== -1) {
      record.rowVersion = 1;
    }

    for (var i = 0; i < headers.length; i++) {
      var key = headers[i];
      var val = record[key];
      if (val === undefined || val === null) {
        rowValues.push("");
      } else if (typeof val === "boolean") {
        rowValues.push(val ? "true" : "false");
      } else {
        rowValues.push(val);
      }
    }

    sheet.appendRow(rowValues);
    return record;
  },

  /**
   * Updates a record with optimistic concurrency lock protection.
   */
  update: function(sheetName, id, record) {
    var ss = this.getSpreadsheet();
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) throw new Error("Table sheet not found: " + sheetName);

    var existing = this.findById(sheetName, id);
    if (!existing) {
      throw new Error("Record not found with ID: " + id + " in table " + sheetName);
    }

    // Check RowVersion conflict
    var headers = this.getHeaders(sheet);
    var verIdx = headers.indexOf("rowVersion");

    if (verIdx !== -1) {
      var currentVersion = Number(existing.data.rowVersion || 1);
      var payloadVersion = Number(record.rowVersion);

      if (!isNaN(payloadVersion) && payloadVersion !== currentVersion) {
        throw new Error("Concurrency Conflict: Row has been modified by another transaction (Current Version: " + currentVersion + ", Passed Version: " + payloadVersion + "). Please reload details.");
      }
      
      // Auto increment version
      record.rowVersion = currentVersion + 1;
    }

    // Prepare full row representing the update
    var rowValues = [];
    for (var i = 0; i < headers.length; i++) {
      var key = headers[i];
      // Keep existing properties if they aren't explicitly passed in record updates
      var val = record[key] !== undefined ? record[key] : existing.data[key];
      if (val === undefined || val === null) {
        rowValues.push("");
      } else if (typeof val === "boolean") {
        rowValues.push(val ? "true" : "false");
      } else {
        rowValues.push(val);
      }
    }

    // Write back row
    var range = sheet.getRange(existing.index, 1, 1, headers.length);
    range.setValues([rowValues]);

    // Return merged updated object
    var updatedData = {};
    for (var i = 0; i < headers.length; i++) {
      updatedData[headers[i]] = rowValues[i] === "true" ? true : (rowValues[i] === "false" ? false : rowValues[i]);
    }
    return updatedData;
  }
};
