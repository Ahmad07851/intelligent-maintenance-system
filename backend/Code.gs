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
  var template = "<h1>Intelligent CMMS Apps Script Backend API is Online</h1>" +
                 "<p>This service operates strictly as a JSON API gateway via POST requests.</p>" +
                 "<p>Please configure your React application environment variable <b>VITE_APPS_SCRIPT</b> to point to this Web App deployment URL.</p>" +
                 "<p>To bootstrap or reset your spreadsheet database tables, call the <code>bootstrapDatabase()</code> function in the Apps Script editor, or send a POST request with the action <code>system.bootstrap</code>.</p>";
                 
  return HtmlService.createHtmlOutput(template)
                    .setTitle("Intelligent CMMS - Apps Script API Gateway")
                    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
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
