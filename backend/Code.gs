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

/**
 * Internal HtmlService bridge for the React frontend.
 * Allows the deployed Apps Script UI to call the same API gateway without any Web App URL.
 */
function runApi(requestJson) {
  var output = doPost({
    postData: {
      contents: requestJson || "{}"
    }
  });

  if (output && typeof output.getContent === "function") {
    return output.getContent();
  }

  return JSON.stringify({
    ok: false,
    data: null,
    message: "Apps Script bridge failed to return a valid response."
  });
}
