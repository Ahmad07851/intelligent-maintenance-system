/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * SlaService.gs
 * Evaluates priority/risk matrix rules to set due dates, escalation ranges, and reviews.
 */

var SlaService = {
  list: function() {
    return SheetService.listAll(CONFIG.SHEETS.SLA_RULES);
  },

  create: function(payload, actor) {
    PermissionService.enforce(actor.role, "PERM_ADMIN");

    if (!payload.priority || !payload.riskLevel || !payload.trade || !payload.targetHours) {
      throw new Error("Missing SLA rule parameters.");
    }

    var id = "SLA-" + new Date().getTime().toString().slice(-4) + "-" + Math.floor(100 + Math.random() * 900);
    var newRule = {
      id: id,
      priority: payload.priority,
      riskLevel: payload.riskLevel,
      trade: payload.trade,
      targetHours: Number(payload.targetHours),
      escalationHours: Number(payload.escalationHours || 0),
      requiresReview: payload.requiresReview === true || payload.requiresReview === "true"
    };

    return SheetService.insert(CONFIG.SHEETS.SLA_RULES, newRule);
  },

  /**
   * Matches a trade, priority, and risk level against the rules sheet.
   * Falls back to standard defaults if no custom rule exists.
   */
  evaluateRule: function(trade, priority, riskLevel) {
    var rules = this.list();
    var matched = null;

    // Direct exact match
    for (var i = 0; i < rules.length; i++) {
      var r = rules[i];
      if (
        r.trade.toLowerCase() === trade.toLowerCase() &&
        r.priority.toLowerCase() === priority.toLowerCase() &&
        r.riskLevel.toLowerCase() === riskLevel.toLowerCase()
      ) {
        matched = r;
        break;
      }
    }

    // Secondary priority/risk generic match (trade wildcard)
    if (!matched) {
      for (var i = 0; i < rules.length; i++) {
        var r = rules[i];
        if (
          r.priority.toLowerCase() === priority.toLowerCase() &&
          r.riskLevel.toLowerCase() === riskLevel.toLowerCase()
        ) {
          matched = r;
          break;
        }
      }
    }

    // Default emergency fallback
    if (!matched) {
      var target = 48; // Standard 48 hours fallback
      var esc = 8;
      var reqReview = false;

      if (priority === "Critical") {
        target = 4;
        esc = 1;
        reqReview = true;
      } else if (priority === "High") {
        target = 24;
        esc = 4;
        reqReview = true;
      } else if (priority === "Low") {
        target = 72;
        esc = 12;
      }

      return {
        targetHours: target,
        escalationHours: esc,
        requiresReview: reqReview
      };
    }

    return {
      targetHours: Number(matched.targetHours),
      escalationHours: Number(matched.escalationHours),
      requiresReview: matched.requiresReview === true || matched.requiresReview === "true"
    };
  }
};
