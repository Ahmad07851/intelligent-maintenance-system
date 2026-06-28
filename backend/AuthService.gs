/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * AuthService.gs
 * Authenticates requests and maps secure Google Workspace / Google Identity tokens to Google Sheets User profiles.
 */

var AuthService = {
  /**
   * Translates incoming Google ID Token into a secure database user profile.
   * @param {Object} authPayload - Contains the Google ID Token (idToken).
   * @return {Object} Evaluated User object.
   */
  authenticate: function(authPayload) {
    if (!authPayload || !authPayload.idToken) {
      throw new Error("Unauthorized: Missing secure Google ID Token in request authorization.");
    }

    var token = authPayload.idToken;
    var email = "";

    // 1. Check if token is a valid JWT format (3 parts separated by dots)
    if (token && token.split('.').length === 3) {
      try {
        var response = UrlFetchApp.fetch("https://oauth2.googleapis.com/tokeninfo?id_token=" + encodeURIComponent(token), {
          muteHttpExceptions: true
        });
        if (response.getResponseCode() === 200) {
          var info = JSON.parse(response.getContentText());
          if (info.email && (info.email_verified === true || info.email_verified === "true")) {
            email = info.email.toLowerCase().trim();
          } else {
            throw new Error("Google Identity Verification failed: Email not verified or missing.");
          }
        } else {
          throw new Error("Google Identity Verification failed: " + response.getContentText());
        }
      } catch (err) {
        throw new Error("Unauthorized: Secure Google Identity validation failed. " + err.message);
      }
    } else {
      // Reject any non-JWT / plain strings / mock tokens
      throw new Error("Unauthorized: Invalid secure Google ID Token format. Plain strings are not allowed.");
    }

    if (!email) {
      throw new Error("Unauthorized: Invalid authorization token context.");
    }

    // Lookup user in Users sheet
    var users = SheetService.listAll(CONFIG.SHEETS.USERS);
    var matchedUser = null;

    for (var i = 0; i < users.length; i++) {
      if (users[i].email.toLowerCase() === email) {
        matchedUser = users[i];
        break;
      }
    }

    // Auto-bootstrap System Owner if the USERS database has no registered users or registered System Owner.
    // This allows the first user logging into a brand-new installation to be provisioned as the System Owner safely!
    var hasOwner = false;
    for (var i = 0; i < users.length; i++) {
      if (users[i].role === CONFIG.ROLES.SYSTEM_OWNER) {
        hasOwner = true;
        break;
      }
    }

    if (!matchedUser && !hasOwner) {
      var namePart = email.split('@')[0];
      var prettyName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
      prettyName = prettyName.replace(/[._]/g, ' ');

      var newOwner = {
        id: "U-001",
        email: email,
        name: prettyName,
        role: CONFIG.ROLES.SYSTEM_OWNER,
        isActive: "true",
        rowVersion: 1
      };
      SheetService.insert(CONFIG.SHEETS.USERS, newOwner);
      matchedUser = newOwner;
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
