/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * PicklistService.gs
 * Manages category values and picklists.
 */

var PicklistService = {
  list: function() {
    return SheetService.listAll(CONFIG.SHEETS.PICKLISTS);
  },

  create: function(payload, actor) {
    PermissionService.enforce(actor.role, "PERM_ADMIN");

    if (!payload.category || !payload.value || !payload.label) {
      throw new Error("Missing picklist parameters (category, value, label).");
    }

    var id = "PK-" + new Date().getTime().toString().slice(-4) + "-" + Math.floor(100 + Math.random() * 900);
    var newPick = {
      id: id,
      category: payload.category.trim(),
      value: payload.value.trim(),
      label: payload.label.trim()
    };

    return SheetService.insert(CONFIG.SHEETS.PICKLISTS, newPick);
  }
};
