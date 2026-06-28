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
    var email = "";

    try {
      email = Session.getActiveUser().getEmail();
    } catch (err) {
      email = "";
    }

    email = String(email || "").toLowerCase().trim();

    if (!email) {
      throw new Error("Unauthorized: Unable to identify the current Google Workspace user. Check the Web App deployment access settings.");
    }

    var users = SheetService.listAll(CONFIG.SHEETS.USERS);
    var matchedUser = null;

    for (var i = 0; i < users.length; i++) {
      var userEmail = String(users[i].email || "").toLowerCase().trim();
      if (userEmail === email) {
        matchedUser = users[i];
        break;
      }
    }

    var hasOwner = false;
    for (var j = 0; j < users.length; j++) {
      if (users[j].role === CONFIG.ROLES.SYSTEM_OWNER) {
        hasOwner = true;
        break;
      }
    }

    if (!matchedUser && !hasOwner) {
      var namePart = email.split("@")[0];
      var prettyName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
      prettyName = prettyName.replace(/[._]/g, " ");

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

    matchedUser.permissions = CONFIG.ROLE_PERMISSIONS[matchedUser.role] || [];

    return matchedUser;
  }
};
