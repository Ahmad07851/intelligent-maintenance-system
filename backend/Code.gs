/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Code.gs
 * Root entry point for Google Apps Script. Exposes Web App handlers and manual test hooks.
 */

/**
 * Handles Web App GET requests. Displays instructions since only POST is used as the API gateway.
 */
function doGet(e) {
  var statusPayload = {
    status: "online",
    service: "Intelligent CMMS Apps Script Backend API",
    mode: "JSON API Gateway",
    timestamp: new Date().toISOString(),
    supportedMethods: ["POST"],
    info: "Please configure your React application to use this Web App URL for dynamic database transactions."
  };
  
  return ContentService.createTextOutput(JSON.stringify(statusPayload))
                       .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Convenience function to bootstrap/seed the Google Sheet tables directly from the Apps Script editor.
 */
function bootstrapDatabase() {
  Logger.log("Starting manual database bootstrap...");
  var res = SetupService.bootstrap();
  Logger.log(res);
  return res;
}
