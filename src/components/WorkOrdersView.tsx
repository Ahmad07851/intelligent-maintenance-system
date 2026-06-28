/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { apiClient } from "../api/client";
import { WorkOrder, WorkOrderStatus, WorkOrderPriority } from "../types";
import { Search, SlidersHorizontal, Plus, ChevronRight, AlertCircle, Clock } from "lucide-react";

interface WorkOrdersViewProps {
  initialSubView?: string;
  onNavigate: (view: string, subView?: string, params?: any) => void;
}

export function StatusBadge({ status }: { status: WorkOrderStatus }) {
  const styles: Record<WorkOrderStatus, string> = {
    [WorkOrderStatus.Draft]: "bg-slate-50 text-slate-600 border-slate-200",
    [WorkOrderStatus.Submitted]: "bg-blue-50 text-blue-600 border-blue-200",
    [WorkOrderStatus.Open]: "bg-emerald-50 text-emerald-700 border-emerald-200",
    [WorkOrderStatus.Assigned]: "bg-purple-50 text-purple-700 border-purple-200",
    [WorkOrderStatus.InProgress]: "bg-indigo-50 text-indigo-700 border-indigo-200 animate-pulse",
    [WorkOrderStatus.OnHold]: "bg-amber-50 text-amber-700 border-amber-200",
    [WorkOrderStatus.Completed]: "bg-teal-50 text-teal-700 border-teal-200",
    [WorkOrderStatus.PendingReview]: "bg-orange-50 text-orange-700 border-orange-200",
    [WorkOrderStatus.Closed]: "bg-slate-100 text-slate-700 border-slate-300",
    [WorkOrderStatus.Cancelled]: "bg-rose-50 text-rose-600 border-rose-200",
    [WorkOrderStatus.Rejected]: "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${styles[status] || "bg-slate-50"}`}>
      {status}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: WorkOrderPriority }) {
  const styles: Record<WorkOrderPriority, string> = {
    [WorkOrderPriority.Low]: "text-slate-500 bg-slate-50",
    [WorkOrderPriority.Medium]: "text-blue-600 bg-blue-50",
    [WorkOrderPriority.High]: "text-orange-600 bg-orange-50 font-bold",
    [WorkOrderPriority.Critical]: "text-rose-600 bg-rose-50 font-bold border border-rose-100 animate-pulse",
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${styles[priority]}`}>
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
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {initialSubView === "overdue"
              ? "Overdue Operations"
              : initialSubView === "pending-review"
              ? "Pending Closeout Reviews"
              : "Maintenance Work Orders"}
          </h1>
          <p className="text-sm text-slate-500">
            {initialSubView === "overdue"
              ? "Urgent orders breaching active SLA limits."
              : "Review, assign, track, and process facility work tickets."}
          </p>
        </div>
        <button
          onClick={() => onNavigate("work-orders", "new-order")}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition cursor-pointer shadow-xs"
        >
          <Plus className="h-4 w-4" />
          New Work Order
        </button>
      </div>

      {/* Action Filters Bar */}
      <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title, WO#, technician, building..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="flex gap-2.5">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3.5 py-2 text-sm font-medium border rounded-lg transition cursor-pointer ${
                showFilters || statusFilter || priorityFilter
                  ? "bg-indigo-50 text-indigo-700 border-indigo-200"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-slate-50">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Work Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full py-1.5 px-3 text-sm border border-slate-200 rounded-lg bg-white"
              >
                <option value="">All Statuses</option>
                {Object.values(WorkOrderStatus).map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Urgency Priority</label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full py-1.5 px-3 text-sm border border-slate-200 rounded-lg bg-white"
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
              <div className="sm:col-span-2 md:col-span-2 flex items-end">
                <button
                  onClick={() => {
                    setStatusFilter("");
                    setPriorityFilter("");
                    setSearch("");
                  }}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition py-2 cursor-pointer"
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
        <div className="flex items-center justify-center h-64 bg-white rounded-xl border border-slate-100">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 p-12 text-center space-y-3">
          <AlertCircle className="h-10 w-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No work orders match current filters</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try adjusting your search query, selecting different parameters, or raise a new request.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">WO Number</th>
                  <th className="py-3 px-4">Title / Description</th>
                  <th className="py-3 px-4">Building Location</th>
                  <th className="py-3 px-4">Urgency</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Assignee</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-700">
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
                      className="hover:bg-slate-50/50 transition duration-150 cursor-pointer align-middle group"
                    >
                      <td className="py-4 px-4 font-mono text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition">
                        {wo.woNumber}
                      </td>
                      <td className="py-4 px-4 max-w-xs md:max-w-md lg:max-w-lg">
                        <p className="text-sm font-semibold text-slate-900 line-clamp-1">{wo.title}</p>
                        <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{wo.description}</p>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-xs font-semibold text-slate-800">{wo.building}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {wo.floor} • Room {wo.room}
                        </p>
                      </td>
                      <td className="py-4 px-4">
                        <PriorityBadge priority={wo.priority} />
                      </td>
                      <td className="py-4 px-4">
                        <StatusBadge status={wo.status} />
                      </td>
                      <td className="py-4 px-4">
                        {wo.assignedTo ? (
                          <div>
                            <p className="text-xs font-medium text-slate-800">
                              {wo.assignedTo.split("@")[0].replace(/\./g, " ")}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{wo.trade}</p>
                          </div>
                        ) : (
                          <span className="text-[11px] font-medium text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded-sm">
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isSlaPast && (
                            <span
                              title="SLA Breach Limit Overdue"
                              className="text-rose-500 animate-bounce"
                            >
                              <Clock className="h-4.5 w-4.5" />
                            </span>
                          )}
                          <ChevronRight className="h-4.5 w-4.5 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition" />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>Showing {filteredOrders.length} records</span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] tracking-wide text-slate-400 uppercase">Database: Google Sheets Emulation</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
