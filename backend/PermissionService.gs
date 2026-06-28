/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * PermissionService.gs
 * Backend permission manager and enforcement.
 */

var PermissionService = {
  /**
   * Evaluates if a given role possesses a requested permission.
   * @param {string} role - The actor's role.
   * @param {string} permission - The permission to inspect.
   * @return {boolean}
   */
  hasPermission: function(role, permission) {
    if (!role) return false;
    var allowed = CONFIG.ROLE_PERMISSIONS[role] || [];
    return allowed.indexOf("PERM_ALL") !== -1 || allowed.indexOf(permission) !== -1;
  },

  /**
   * Enforces permissions or throws an exception.
   */
  enforce: function(role, permission) {
    if (!this.hasPermission(role, permission)) {
      throw new Error("Forbidden: Role '" + role + "' does not possess required permission: '" + permission + "'");
    }
  }
};
