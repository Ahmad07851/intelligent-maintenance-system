/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * LocationService.gs
 * Manages physical facilities locations hierarchy.
 */

var LocationService = {
  list: function() {
    return SheetService.listAll(CONFIG.SHEETS.LOCATIONS);
  },

  create: function(payload, actor) {
    PermissionService.enforce(actor.role, "PERM_ADMIN");

    if (!payload.name || !payload.building || !payload.floor || !payload.room) {
      throw new Error("Missing physical location parameters (name, building, floor, room).");
    }

    var id = "LOC-" + new Date().getTime().toString().slice(-4) + "-" + Math.floor(100 + Math.random() * 900);
    var newLoc = {
      id: id,
      name: payload.name.trim(),
      building: payload.building.trim(),
      floor: payload.floor.trim(),
      room: payload.room.trim(),
      rowVersion: 1
    };

    return SheetService.insert(CONFIG.SHEETS.LOCATIONS, newLoc);
  },

  update: function(id, payload, actor) {
    PermissionService.enforce(actor.role, "PERM_ADMIN");

    var existing = SheetService.findById(CONFIG.SHEETS.LOCATIONS, id);
    if (!existing) {
      throw new Error("Location record not found ID: " + id);
    }

    var updated = {
      name: payload.name !== undefined ? payload.name.trim() : existing.data.name,
      building: payload.building !== undefined ? payload.building.trim() : existing.data.building,
      floor: payload.floor !== undefined ? payload.floor.trim() : existing.data.floor,
      room: payload.room !== undefined ? payload.room.trim() : existing.data.room,
      rowVersion: payload.rowVersion
    };

    return SheetService.update(CONFIG.SHEETS.LOCATIONS, id, updated);
  }
};
