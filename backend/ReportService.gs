/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ReportService.gs
 * Builds historical reporting aggregations and performance intelligence analytics.
 */

var ReportService = {
  /**
   * Generates comprehensive performance reports.
   */
  getPerformanceReport: function() {
    var wos = SheetService.listAll(CONFIG.SHEETS.WORK_ORDERS);
    
    var totalVolume = 0;
    var completedCount = 0;
    var breachedCount = 0;
    
    var categoryCounts = {};
    var monthlyVolume = {};
    var tradePerformance = {}; // { tradeName: { total: X, completed: Y, breached: Z } }

    var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    for (var i = 0; i < wos.length; i++) {
      var wo = wos[i];
      if (wo.isDeleted === true || wo.isDeleted === "true") continue;

      totalVolume++;
      var isCompleted = wo.status === "Completed" || wo.status === "Closed";
      var isBreached = wo.slaBreached === true || wo.slaBreached === "true";

      if (isCompleted) completedCount++;
      if (isBreached) breachedCount++;

      // Category counts
      var cat = wo.category || "General";
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;

      // Trade performance tracking
      var trade = wo.trade || "Unclassified";
      if (!tradePerformance[trade]) {
        tradePerformance[trade] = { total: 0, completed: 0, breached: 0 };
      }
      tradePerformance[trade].total++;
      if (isCompleted) tradePerformance[trade].completed++;
      if (isBreached) tradePerformance[trade].breached++;

      // Monthly volumes
      if (wo.createdAt) {
        var d = new Date(wo.createdAt);
        var label = monthNames[d.getMonth()] + " " + d.getFullYear();
        monthlyVolume[label] = (monthlyVolume[label] || 0) + 1;
      }
    }

    // Convert tradePerformance into array
    var tradeStatsList = [];
    for (var t in tradePerformance) {
      var stats = tradePerformance[t];
      var breachRatio = stats.completed > 0 ? Math.round((stats.breached / stats.total) * 100) : 0;
      tradeStatsList.push({
        trade: t,
        total: stats.total,
        completed: stats.completed,
        breached: stats.breached,
        breachRatio: breachRatio
      });
    }

    // Convert monthly volume to array
    var volumeTrend = [];
    for (var m in monthlyVolume) {
      volumeTrend.push({ month: m, count: monthlyVolume[m] });
    }

    return {
      overview: {
        totalVolume: totalVolume,
        completedVolume: completedCount,
        breachRatio: totalVolume > 0 ? Math.round((breachedCount / totalVolume) * 100) : 0,
        unbreachedVolume: totalVolume - breachedCount
      },
      categoryStats: categoryCounts,
      tradeStats: tradeStatsList,
      monthlyTrend: volumeTrend
    };
  }
};
