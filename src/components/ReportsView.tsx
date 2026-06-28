import React, { useEffect, useState } from "react";
import { apiClient } from "../api/client";
import { WorkOrder, WorkOrderStatus } from "../types";
import { Download, RefreshCw, BarChart3, PieChart, Activity, AlertCircle } from "lucide-react";

export default function ReportsView() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReportsData = async () => {
    setLoading(true);
    const res = await apiClient.request("wo.list");
    if (res.ok && res.data) {
      setWorkOrders(res.data);
    }
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    const res = await apiClient.request("wo.list");
    if (res.ok && res.data) {
      setWorkOrders(res.data);
    }
    setRefreshing(false);
  };

  useEffect(() => {
    fetchReportsData();
  }, []);

  // CSV Generator Utility
  const handleExportCsv = () => {
    if (workOrders.length === 0) {
      alert("No data available to export.");
      return;
    }

    const headers = [
      "ID",
      "WO Number",
      "Title",
      "Description",
      "Status",
      "Priority",
      "Assigned To",
      "Trade",
      "Building",
      "Room",
      "SLA Target (Hours)",
      "SLA Breached",
      "Created At",
      "Due Date",
    ];

    const rows = workOrders.map((w) => [
      `"${w.id}"`,
      `"${w.woNumber}"`,
      `"${w.title.replace(/"/g, '""')}"`,
      `"${w.description.replace(/"/g, '""')}"`,
      `"${w.status}"`,
      `"${w.priority}"`,
      `"${w.assignedTo || "Unassigned"}"`,
      `"${w.trade}"`,
      `"${w.building}"`,
      `"${w.room}"`,
      w.slaTargetHours,
      w.slaBreached ? "YES" : "NO",
      `"${new Date(w.createdAt).toISOString()}"`,
      `"${w.dueDate ? new Date(w.dueDate).toISOString() : ""}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ims-work-orders-report-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  // Calculate Metrics Heuristics
  const totalCount = workOrders.length;
  const openCount = workOrders.filter((w) => [WorkOrderStatus.Open, WorkOrderStatus.Assigned, WorkOrderStatus.InProgress].includes(w.status)).length;
  const pendingReview = workOrders.filter((w) => w.status === WorkOrderStatus.PendingReview).length;
  const closedCount = workOrders.filter((w) => w.status === WorkOrderStatus.Closed).length;
  const breachedCount = workOrders.filter((w) => w.slaBreached).length;

  const slaCompliancePercent = totalCount > 0 ? Math.round(((totalCount - breachedCount) / totalCount) * 100) : 100;

  // status mappings for charts
  const statusCounts = workOrders.reduce((acc, w) => {
    acc[w.status] = (acc[w.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // trade breakdown
  const tradeCounts = workOrders.reduce((acc, w) => {
    acc[w.trade] = (acc[w.trade] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sortedTrades = (Object.entries(tradeCounts) as [string, number][]).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-[24px] font-bold tracking-tight text-slate-800">Analytics & Reports</h1>
          <p className="text-[14px] text-slate-500 mt-1">
            Operations compilation dashboard. Audit SLA compliance boundaries and trade work distributions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 text-[14px] font-semibold text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-50 transition cursor-pointer shadow-sm"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin text-slate-400" : ""}`} />
            Sync Report
          </button>
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 px-4 py-2 text-[14px] font-bold text-white bg-primary hover:bg-indigo-700 rounded shadow-sm transition cursor-pointer"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { title: "Total Raised Work", value: totalCount, subtitle: "Cumulative dispatches raised" },
          { title: "Active Open Backlog", value: openCount, subtitle: "In-progress or scheduled" },
          { title: "Awaiting Review", value: pendingReview, subtitle: "Inspection pending" },
          { title: "SLA Compliance Rate", value: `${slaCompliancePercent}%`, subtitle: "Limit met bounds" },
        ].map((item, index) => (
          <div key={index} className="bg-white rounded-lg border border-slate-200 p-6 shadow-[0_4px_10px_rgba(0,0,0,0.02)] space-y-1 hover:shadow-md transition">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{item.title}</span>
            <p className="text-[28px] font-black text-slate-800 tracking-tight leading-none pt-2 pb-1">{item.value}</p>
            <p className="text-[12px] text-slate-400 font-medium">{item.subtitle}</p>
          </div>
        ))}
      </div>

      {/* Graphs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Distribution (Custom pure HTML/CSS graphics bar) */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-[0_4px_10px_rgba(0,0,0,0.02)] space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-[14px] font-bold text-slate-800 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-slate-400" /> State Distribution
            </h2>
          </div>

          <div className="space-y-4">
            {Object.values(WorkOrderStatus).map((status) => {
              const count = statusCounts[status] || 0;
              const percent = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;

              return (
                <div key={status} className="space-y-1.5">
                  <div className="flex items-center justify-between text-[12px] font-semibold">
                    <span className="text-slate-700">{status}</span>
                    <span className="text-slate-500">
                      {count} orders ({percent}%)
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 border border-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Trade Allocation (Bespoke Horizontal Breakdown) */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-[0_4px_10px_rgba(0,0,0,0.02)] space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-[14px] font-bold text-slate-800 flex items-center gap-2">
              <PieChart className="h-5 w-5 text-slate-400" /> Trade Specialization
            </h2>
          </div>

          <div className="space-y-4 text-[12px]">
            {sortedTrades.length === 0 ? (
              <p className="text-slate-400 font-medium italic text-center py-12">No trade data mapped.</p>
            ) : (
              sortedTrades.map(([trade, count]) => {
                const percent = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;

                return (
                  <div key={trade} className="space-y-1.5">
                    <div className="flex items-center justify-between font-semibold">
                      <span className="text-slate-700">{trade}</span>
                      <span className="text-slate-500 font-bold">{count} tasks</span>
                    </div>
                    <div className="h-3.5 w-full bg-slate-100 border border-slate-200 rounded overflow-hidden flex">
                      <div
                        className="h-full bg-indigo-400 rounded transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* SLA Breach limits breakdown */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-[0_4px_10px_rgba(0,0,0,0.02)] space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-[14px] font-bold text-slate-800 flex items-center gap-2">
              <Activity className="h-5 w-5 text-slate-400" /> SLA Response Performance
            </h2>
          </div>

          <div className="flex flex-col items-center py-6 space-y-6">
            {/* SLA Gauge circular SVG */}
            <div className="relative flex items-center justify-center h-40 w-40">
              <svg className="absolute transform -rotate-90 w-full h-full" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" stroke="#f1f5f9" strokeWidth="8" fill="transparent" />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke="#10b981"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={263.89}
                  strokeDashoffset={263.89 - (263.89 * slaCompliancePercent) / 100}
                  className="transition-all duration-1000 ease-out"
                  strokeLinecap="round"
                />
              </svg>
              <div className="text-center">
                <span className="text-4xl font-black text-slate-800 tracking-tighter">{slaCompliancePercent}%</span>
                <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase mt-1">Compliant</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full text-center text-[13px] border-t border-slate-100 pt-5 font-semibold">
              <div className="space-y-1">
                <span className="text-slate-500 text-[11px] uppercase tracking-wider">Met Targets</span>
                <p className="font-bold text-success text-[15px]">{totalCount - breachedCount} orders</p>
              </div>
              <div className="space-y-1">
                <span className="text-danger text-[11px] uppercase tracking-wider">SLA Breached</span>
                <p className="font-bold text-danger text-[15px]">{breachedCount} orders</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
