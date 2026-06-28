/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * AuthService.gs
 * Authenticates requests and maps simulated/real tokens to Google Sheets User profiles.
 */

var AuthService = {
  /**
   * Translates incoming token into a real database user profile.
   * @param {Object} authPayload - Contains credentials or simulated tokens.
   * @return {Object} Evaluated User object.
   */
  authenticate: function(authPayload) {
    if (!authPayload || !authPayload.idToken) {
      throw new Error("Unauthorized: Missing authorization payload or token.");
    }

    var token = authPayload.idToken;
    var email = "";

    // Parse mock token mapping, e.g., "MOCK_OAUTH_TOKEN_FOR_ahmadarafat51@gmail.com"
    if (token.indexOf("MOCK_OAUTH_TOKEN_FOR_") === 0) {
      email = token.replace("MOCK_OAUTH_TOKEN_FOR_", "").trim().toLowerCase();
    } else {
      // Direct token fallback if email is directly provided
      email = token.trim().toLowerCase();
    }

    if (!email) {
      throw new Error("Unauthorized: Invalid authorization token context.");
    }

    // Lookup user in Users sheet
    var userRecord = SheetService.findById(CONFIG.SHEETS.USERS, null); // Will list and filter
    var users = SheetService.listAll(CONFIG.SHEETS.USERS);
    var matchedUser = null;

    for (var i = 0; i < users.length; i++) {
      if (users[i].email.toLowerCase() === email) {
        matchedUser = users[i];
        break;
      }
    }

    if (!matchedUser) {
      throw new Error("Unauthorized: User profile '" + email + "' is not registered in the CMMS User Directory.");
    }

    if (matchedUser.isActive === false || matchedUser.isActive === "false") {
      throw new Error("Forbidden: User account '" + email + "' has been deactivated.");
    }

    return matchedUser;
  }
};
