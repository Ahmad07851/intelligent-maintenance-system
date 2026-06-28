/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * UserService.gs
 * Manages User database records.
 */

var UserService = {
  list: function() {
    return SheetService.listAll(CONFIG.SHEETS.USERS);
  },

  create: function(payload, actor) {
    PermissionService.enforce(actor.role, "PERM_ADMIN");
    
    if (!payload.email || !payload.name || !payload.role) {
      throw new Error("Missing required fields (email, name, role) for user creation.");
    }

    // Verify unique email
    var users = this.list();
    for (var i = 0; i < users.length; i++) {
      if (users[i].email.toLowerCase() === payload.email.toLowerCase()) {
        throw new Error("Conflict: A user with email '" + payload.email + "' already exists.");
      }
    }

    var id = "U-" + new Date().getTime().toString().slice(-4) + "-" + Math.floor(100 + Math.random() * 900);
    var newUser = {
      id: id,
      email: payload.email.trim(),
      name: payload.name.trim(),
      role: payload.role,
      isActive: payload.isActive !== undefined ? payload.isActive : true,
      rowVersion: 1
    };

    return SheetService.insert(CONFIG.SHEETS.USERS, newUser);
  },

  update: function(id, payload, actor) {
    PermissionService.enforce(actor.role, "PERM_ADMIN");
    
    var existing = SheetService.findById(CONFIG.SHEETS.USERS, id);
    if (!existing) {
      throw new Error("User record not found: " + id);
    }

    var updated = {
      name: payload.name !== undefined ? payload.name.trim() : existing.data.name,
      role: payload.role !== undefined ? payload.role : existing.data.role,
      isActive: payload.isActive !== undefined ? payload.isActive : existing.data.isActive,
      rowVersion: payload.rowVersion
    };

    return SheetService.update(CONFIG.SHEETS.USERS, id, updated);
  }
};
