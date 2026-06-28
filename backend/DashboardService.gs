/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * DashboardService.gs
 * Aggregates live system KPIs and stats for the operations console.
 */

var DashboardService = {
  /**
   * Builds high-level statistics for live operations cards.
   */
  getStats: function() {
    var wos = SheetService.listAll(CONFIG.SHEETS.WORK_ORDERS);
    var mojo = SheetService.listAll(CONFIG.SHEETS.MOJO_TICKETS);
    var techs = SheetService.listAll(CONFIG.SHEETS.TECHNICIANS);

    var stats = {
      total: 0,
      open: 0,
      assigned: 0,
      inProgress: 0,
      onHold: 0,
      completed: 0,
      pendingReview: 0,
      closed: 0,
      cancelled: 0,
      overdue: 0,
      slaBreached: 0,
      pendingMojo: 0,
      totalMojo: 0,
      activeTechs: 0,
      priorityCounts: {
        Low: 0,
        Medium: 0,
        High: 0,
        Critical: 0
      },
      tradeCounts: {},
      weeklyTrends: [
        { name: "Mon", count: 0 },
        { name: "Tue", count: 0 },
        { name: "Wed", count: 0 },
        { name: "Thu", count: 0 },
        { name: "Fri", count: 0 },
        { name: "Sat", count: 0 },
        { name: "Sun", count: 0 }
      ]
    };

    var now = new Date().getTime();

    // Iterate Work Orders
    for (var i = 0; i < wos.length; i++) {
      var wo = wos[i];
      if (wo.isDeleted === true || wo.isDeleted === "true") continue;

      stats.total++;
      
      // Status counting
      var status = wo.status || "Open";
      if (status === "Open") stats.open++;
      else if (status === "Assigned") stats.assigned++;
      else if (status === "In Progress") stats.inProgress++;
      else if (status === "On Hold") stats.onHold++;
      else if (status === "Completed") stats.completed++;
      else if (status === "Pending Review") stats.pendingReview++;
      else if (status === "Closed") stats.closed++;
      else if (status === "Cancelled") stats.cancelled++;

      // Priority counts
      var priority = wo.priority || "Medium";
      if (stats.priorityCounts[priority] !== undefined) {
        stats.priorityCounts[priority]++;
      }

      // Trade counts
      var trade = wo.trade || "Unclassified";
      stats.tradeCounts[trade] = (stats.tradeCounts[trade] || 0) + 1;

      // SLA Breached or Overdue check
      var isBreached = wo.slaBreached === true || wo.slaBreached === "true";
      if (isBreached) {
        stats.slaBreached++;
      }

      // Check if past due date and not completed/closed
      if (wo.dueDate && status !== "Completed" && status !== "Closed" && status !== "Cancelled") {
        if (new Date(wo.dueDate).getTime() < now) {
          stats.overdue++;
        }
      }

      // Stagger trends mapping (based on day of week)
      if (wo.createdAt) {
        var dayIdx = new Date(wo.createdAt).getDay(); // 0 is Sunday, 1 is Monday, etc.
        var trendIdx = dayIdx === 0 ? 6 : dayIdx - 1; // Map to Mon=0 ... Sun=6
        if (trendIdx >= 0 && trendIdx < 7) {
          stats.weeklyTrends[trendIdx].count++;
        }
      }
    }

    // Mojo Inbox stats
    for (var j = 0; j < mojo.length; j++) {
      stats.totalMojo++;
      if (mojo[j].status === "Pending" || mojo[j].status === "") {
        stats.pendingMojo++;
      }
    }

    // Active Tech Fleet stats
    for (var k = 0; k < techs.length; k++) {
      if (techs[k].status === "Active") {
        stats.activeTechs++;
      }
    }

    // Map to React Dashboard keys
    var openOrdersCount = stats.open;
    var overdueCount = stats.overdue;
    var pendingReviewCount = stats.pendingReview;
    var completedThisWeekCount = stats.completed;
    var slaBreachRate = stats.total > 0 ? Math.round((stats.slaBreached / stats.total) * 100) : 0;
    
    // Get last 10 audit logs for recentActivity
    var recentActivity = [];
    try {
      var allLogs = SheetService.listAll(CONFIG.SHEETS.AUDIT_LOG) || [];
      allLogs.sort(function(a, b) {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });
      recentActivity = allLogs.slice(0, 10);
    } catch (e) {
      Logger.log("Failed reading logs for recentActivity: " + e.toString());
    }

    return {
      // Original keys
      total: stats.total,
      open: stats.open,
      assigned: stats.assigned,
      inProgress: stats.inProgress,
      onHold: stats.onHold,
      completed: stats.completed,
      pendingReview: stats.pendingReview,
      closed: stats.closed,
      cancelled: stats.cancelled,
      overdue: stats.overdue,
      slaBreached: stats.slaBreached,
      pendingMojo: stats.pendingMojo,
      totalMojo: stats.totalMojo,
      activeTechs: stats.activeTechs,
      priorityCounts: stats.priorityCounts,
      tradeCounts: stats.tradeCounts,
      weeklyTrends: stats.weeklyTrends,
      
      // Front-end React Dashboard specific keys
      openOrdersCount: openOrdersCount,
      overdueCount: overdueCount,
      pendingReviewCount: pendingReviewCount,
      completedThisWeekCount: completedThisWeekCount,
      slaBreachRate: slaBreachRate,
      recentActivity: recentActivity
    };
  }
};
