/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { apiClient } from "../api/client";
import { WorkOrder, WorkOrderStatus, WorkOrderPriority } from "../types";
import { Search, SlidersHorizontal, Plus, ChevronRight, AlertCircle, Clock, CheckCircle2, List, AlertTriangle } from "lucide-react";

interface WorkOrdersViewProps {
  initialSubView?: string;
  onNavigate: (view: string, subView?: string, params?: any) => void;
}

export function StatusBadge({ status }: { status: WorkOrderStatus }) {
  const styles: Record<WorkOrderStatus, string> = {
    [WorkOrderStatus.Draft]: "bg-slate-100 text-slate-700 border-slate-200",
    [WorkOrderStatus.Submitted]: "bg-blue-50 text-blue-700 border-blue-200",
    [WorkOrderStatus.Open]: "bg-indigo-50 text-indigo-700 border-indigo-200",
    [WorkOrderStatus.Assigned]: "bg-indigo-100 text-indigo-800 border-indigo-300",
    [WorkOrderStatus.InProgress]: "bg-primary text-white border-primary animate-pulse shadow-sm",
    [WorkOrderStatus.OnHold]: "bg-warning text-yellow-900 border-yellow-500 shadow-sm",
    [WorkOrderStatus.Completed]: "bg-success text-white border-green-600 shadow-sm",
    [WorkOrderStatus.PendingReview]: "bg-warning text-yellow-900 border-yellow-500 shadow-sm",
    [WorkOrderStatus.Closed]: "bg-success text-white border-green-600 shadow-sm",
    [WorkOrderStatus.Cancelled]: "bg-danger text-white border-red-600 shadow-sm",
    [WorkOrderStatus.Rejected]: "bg-danger text-white border-red-600 shadow-sm",
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-[999px] text-[11px] font-bold border ${styles[status] || "bg-slate-50"}`}>
      {status}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: WorkOrderPriority }) {
  const styles: Record<WorkOrderPriority, string> = {
    [WorkOrderPriority.Low]: "text-slate-600 bg-slate-100",
    [WorkOrderPriority.Routine]: "text-slate-600 bg-slate-100",
    [WorkOrderPriority.Medium]: "text-indigo-700 bg-indigo-50",
    [WorkOrderPriority.High]: "text-orange-700 bg-orange-100 font-bold",
    [WorkOrderPriority.Emergency]: "text-white bg-danger font-bold border border-red-500 shadow-sm animate-pulse",
    [WorkOrderPriority.Critical]: "text-white bg-danger font-bold border border-red-500 shadow-sm animate-pulse",
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-[6px] text-[11px] font-bold ${styles[priority]}`}>
      {priority}
    </span>
  );
}

export default function WorkOrdersView({ initialSubView = "all-orders", onNavigate }: WorkOrdersViewProps) {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  const fetchWorkOrders = async () => {
    setLoading(true);
    let payload: any = {};
    if (initialSubView === "overdue") {
      // Handled filter logic
    } else if (initialSubView === "pending-review") {
      payload.status = WorkOrderStatus.PendingReview;
    } else if (initialSubView === "open-orders") {
      payload.status = WorkOrderStatus.Open;
    }

    const res = await apiClient.request("wo.list", payload);
    if (res.ok && res.data) {
      let data: WorkOrder[] = res.data;
      if (initialSubView === "overdue") {
        data = data.filter(
          (w) =>
            w.dueDate &&
            new Date(w.dueDate) < new Date() &&
            ![WorkOrderStatus.Completed, WorkOrderStatus.Closed, WorkOrderStatus.Cancelled].includes(w.status)
        );
      }
      setWorkOrders(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchWorkOrders();
  }, [initialSubView]);

  const handleRowClick = (id: string) => {
    onNavigate("work-orders", "wo-details", { id });
  };

  // Perform client side search and extra filtering
  const filteredOrders = workOrders.filter((wo) => {
    const matchesSearch =
      wo.title.toLowerCase().includes(search.toLowerCase()) ||
      wo.woNumber.toLowerCase().includes(search.toLowerCase()) ||
      (wo.assignedTo || "").toLowerCase().includes(search.toLowerCase()) ||
      wo.building.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter ? wo.status === statusFilter : true;
    const matchesPriority = priorityFilter ? wo.priority === priorityFilter : true;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <div className="flex h-full w-full">
      {/* Secondary Sidebar (Contextual) */}
      <div className="w-[200px] hidden lg:flex flex-col border-r border-[rgba(255,255,255,0.20)] shrink-0 h-[calc(100vh-64px)] p-4 space-y-2 sticky top-0"
           style={{
             background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.20) 100%)',
             backdropFilter: 'blur(10px)',
             WebkitBackdropFilter: 'blur(10px)'
           }}>
         <h3 className="text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-2 px-3">Views</h3>
         
         <button 
           onClick={() => onNavigate("work-orders", "all-orders")}
           className={`flex items-center gap-2.5 px-3 py-2 rounded text-[13px] font-semibold transition-colors w-full cursor-pointer ${
             initialSubView === "all-orders" || !initialSubView ? "bg-white text-primary shadow-[0_2px_4px_rgba(0,0,0,0.02)]" : "text-slate-800 hover:bg-white/50"
           }`}
         >
           <List className="h-4 w-4" />
           All Work Orders
         </button>
         
         <button 
           onClick={() => onNavigate("work-orders", "open-orders")}
           className={`flex items-center gap-2.5 px-3 py-2 rounded text-[13px] font-semibold transition-colors w-full cursor-pointer ${
             initialSubView === "open-orders" ? "bg-white text-primary shadow-[0_2px_4px_rgba(0,0,0,0.02)]" : "text-slate-800 hover:bg-white/50"
           }`}
         >
           <CheckCircle2 className="h-4 w-4" />
           Open / Active
         </button>

         <button 
           onClick={() => onNavigate("work-orders", "overdue")}
           className={`flex items-center gap-2.5 px-3 py-2 rounded text-[13px] font-semibold transition-colors w-full cursor-pointer ${
             initialSubView === "overdue" ? "bg-white text-danger shadow-[0_2px_4px_rgba(0,0,0,0.02)]" : "text-slate-800 hover:bg-white/50"
           }`}
         >
           <AlertTriangle className="h-4 w-4" />
           SLA Overdue
         </button>

         <button 
           onClick={() => onNavigate("work-orders", "pending-review")}
           className={`flex items-center gap-2.5 px-3 py-2 rounded text-[13px] font-semibold transition-colors w-full cursor-pointer ${
             initialSubView === "pending-review" ? "bg-white text-warning shadow-[0_2px_4px_rgba(0,0,0,0.02)]" : "text-slate-800 hover:bg-white/50"
           }`}
         >
           <Clock className="h-4 w-4" />
           Pending Closeout
         </button>
      </div>

      <div className="flex-1 overflow-x-hidden p-6 lg:p-8 space-y-6">
        {/* Header section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-[24px] font-bold tracking-tight text-slate-800">
              {initialSubView === "overdue"
                ? "Overdue Operations"
                : initialSubView === "pending-review"
                ? "Pending Closeout Reviews"
                : "Maintenance Work Orders"}
            </h1>
            <p className="text-[14px] text-slate-500 mt-1">
              {initialSubView === "overdue"
                ? "Urgent orders breaching active SLA limits."
                : "Review, assign, track, and process facility work tickets."}
            </p>
          </div>
          <button
            onClick={() => onNavigate("work-orders", "new-order")}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-[14px] font-semibold text-white bg-primary rounded hover:bg-indigo-700 transition cursor-pointer shadow-sm"
          >
            <Plus className="h-4 w-4" />
            New Work Order
          </button>
        </div>

        {/* Action Filters Bar */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-[0_4px_10px_rgba(0,0,0,0.02)] space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by title, WO#, technician, building..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-[14px] border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition"
              />
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-3.5 py-2 text-[13px] font-semibold border rounded transition cursor-pointer ${
                  showFilters || statusFilter || priorityFilter
                    ? "bg-indigo-50 text-primary border-indigo-200"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
              </button>
            </div>
          </div>

          {/* Collapsible Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
              <div className="space-y-1.5">
                <label className="text-[12px] font-semibold text-slate-500">Work Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full py-2 px-3 text-[13px] border border-slate-300 rounded bg-white font-medium text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-primary"
                >
                  <option value="">All Statuses</option>
                  {Object.values(WorkOrderStatus).map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[12px] font-semibold text-slate-500">Urgency Priority</label>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="w-full py-2 px-3 text-[13px] border border-slate-300 rounded bg-white font-medium text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-primary"
                >
                  <option value="">All Priorities</option>
                  {Object.values(WorkOrderPriority).map((prio) => (
                    <option key={prio} value={prio}>
                      {prio}
                    </option>
                  ))}
                </select>
              </div>

              {(statusFilter || priorityFilter || search) && (
                <div className="sm:col-span-2 md:col-span-2 flex items-end pb-0.5">
                  <button
                    onClick={() => {
                      setStatusFilter("");
                      setPriorityFilter("");
                      setSearch("");
                    }}
                    className="text-[13px] font-bold text-primary hover:text-indigo-800 transition py-2 cursor-pointer"
                  >
                    Reset Active Filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Main Table view */}
        {loading ? (
          <div className="flex items-center justify-center h-64 bg-white rounded-lg border border-slate-200 shadow-[0_4px_10px_rgba(0,0,0,0.02)]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary border-t-transparent"></div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 p-12 text-center space-y-3 shadow-[0_4px_10px_rgba(0,0,0,0.02)]">
            <AlertCircle className="h-10 w-10 text-slate-300 mx-auto" />
            <h3 className="text-[16px] font-bold text-slate-800">No work orders match current filters</h3>
            <p className="text-[14px] text-slate-500 max-w-sm mx-auto">
              Try adjusting your search query, selecting different parameters, or raise a new request.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-slate-200 shadow-[0_4px_10px_rgba(0,0,0,0.05)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[12px] font-semibold text-slate-800">
                    <th className="py-3 px-5">WO Number</th>
                    <th className="py-3 px-5">Title / Description</th>
                    <th className="py-3 px-5">Building Location</th>
                    <th className="py-3 px-5">Urgency</th>
                    <th className="py-3 px-5">Status</th>
                    <th className="py-3 px-5">Assignee</th>
                    <th className="py-3 px-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {filteredOrders.map((wo) => {
                    // Determine if SLA is breached (dueDate past and not complete/closed)
                    const isSlaPast =
                      wo.dueDate &&
                      new Date(wo.dueDate) < new Date() &&
                      ![WorkOrderStatus.Completed, WorkOrderStatus.Closed, WorkOrderStatus.Cancelled].includes(wo.status);

                    return (
                      <tr
                        key={wo.id}
                        onClick={() => handleRowClick(wo.id)}
                        className="hover:bg-slate-50 transition duration-150 cursor-pointer align-middle group"
                      >
                        <td className="py-4 px-5 font-mono text-[13px] font-bold text-slate-900 group-hover:text-primary transition">
                          {wo.woNumber}
                        </td>
                        <td className="py-4 px-5 max-w-xs md:max-w-md lg:max-w-lg">
                          <p className="text-[14px] font-semibold text-slate-900 line-clamp-1">{wo.title}</p>
                          <p className="text-[13px] text-slate-500 line-clamp-1 mt-0.5">{wo.description}</p>
                        </td>
                        <td className="py-4 px-5">
                          <p className="text-[13px] font-semibold text-slate-800">{wo.building}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                            {wo.floor} • Room {wo.room}
                          </p>
                        </td>
                        <td className="py-4 px-5">
                          <PriorityBadge priority={wo.priority} />
                        </td>
                        <td className="py-4 px-5">
                          <StatusBadge status={wo.status} />
                        </td>
                        <td className="py-4 px-5">
                          {wo.assignedTo ? (
                            <div>
                              <p className="text-[13px] font-semibold text-slate-800">
                                {wo.assignedTo.split("@")[0].replace(/\./g, " ")}
                              </p>
                              <p className="text-[11px] text-slate-500 mt-0.5 font-medium">{wo.trade}</p>
                            </div>
                          ) : (
                            <span className="text-[12px] font-bold text-danger bg-red-50 px-2 py-0.5 rounded-[4px]">
                              Unassigned
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isSlaPast && (
                              <span
                                title="SLA Breach Limit Overdue"
                                className="text-danger animate-pulse"
                              >
                                <Clock className="h-5 w-5" />
                              </span>
                            )}
                            <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition" />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 bg-slate-50/50 border-t border-slate-200 flex items-center justify-between text-[12px] font-semibold text-slate-500">
              <span>Showing {filteredOrders.length} records</span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] tracking-wide text-slate-400 uppercase font-mono">Backend Ready</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
