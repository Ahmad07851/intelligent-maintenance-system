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
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Intelligent Maintenance System')
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
