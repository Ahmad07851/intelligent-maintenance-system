/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ErrorService.gs
 * Categorizes system exceptions, formats details, and logs errors safely.
 */

var ErrorService = {
  /**
   * Safe exception handler wrapper. Logs to sheet and generates ApiResponse.
   */
  handleException: function(err, requestId, actorEmail) {
    var errorMsg = err.message || err.toString();
    var stack = err.stack || "";
    
    // Attempt logging into SystemLogs sheet
    try {
      SystemLogService.logError(
        err.name || "Exception",
        errorMsg,
        stack,
        requestId
      );
    } catch (loggingErr) {
      // Fail-safe to avoid infinite loop
      Logger.log("Critical: Failed logging exception to sheets: " + loggingErr.toString());
    }
    
    // Format friendly error response
    var meta = {
      requestId: requestId || "REQ-UNKNOWN",
      timestamp: new Date().toISOString(),
      actor: actorEmail || "anonymous"
    };

    var errorDetails = [
      { code: err.code || "SYSTEM_ERROR", message: errorMsg }
    ];

    return ResponseService.error(
      "Transaction failed: " + errorMsg,
      errorDetails,
      meta
    );
  }
};
