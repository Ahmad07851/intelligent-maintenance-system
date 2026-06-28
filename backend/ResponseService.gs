/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ResponseService.gs
 * Standardizes API responses using clean JSON structures.
 */

var ResponseService = {
  /**
   * Generates a successful response payload.
   */
  success: function(data, message, meta) {
    return {
      ok: true,
      data: data || null,
      message: message || "Operation completed successfully.",
      meta: meta || {
        timestamp: new Date().toISOString(),
        actor: "system"
      }
    };
  },

  /**
   * Generates a failed response payload.
   */
  error: function(message, errors, meta) {
    return {
      ok: false,
      data: null,
      message: message || "An error occurred during transaction processing.",
      errors: errors || [],
      meta: meta || {
        timestamp: new Date().toISOString(),
        actor: "system"
      }
    };
  },

  /**
   * Converts the response payload into a proper text/plain response for Apps Script (bypassing CORS preflight).
   */
  jsonOutput: function(payload) {
    var output = ContentService.createTextOutput(JSON.stringify(payload));
    output.setMimeType(ContentService.MimeType.JSON);
    return output;
  }
};
