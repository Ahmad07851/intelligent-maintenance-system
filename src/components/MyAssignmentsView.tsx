/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { apiClient } from "../api/client";
import { authStore } from "../auth/authStore";
import { WorkOrder, WorkOrderStatus, WorkOrderPriority } from "../types";
import { StatusBadge, PriorityBadge } from "./WorkOrdersView";
import { Play, Pause, CheckCircle2, RefreshCw, MessageSquare, ClipboardList, MapPin, AlertCircle } from "lucide-react";

interface MyAssignmentsViewProps {
  onNavigate: (view: string, subView?: string, params?: any) => void;
}

export default function MyAssignmentsView({ onNavigate }: MyAssignmentsViewProps) {
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const user = authStore.getCurrentUser();

  const fetchAssignments = async () => {
    setLoading(true);
    const res = await apiClient.request("wo.list", { assignedTo: user.email });
    if (res.ok && res.data) {
      setOrders(res.data);
    }
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    const res = await apiClient.request("wo.list", { assignedTo: user.email });
    if (res.ok && res.data) {
      setOrders(res.data);
    }
    setRefreshing(false);
  };

  useEffect(() => {
    fetchAssignments();
  }, [user.email]);

  const executeAction = async (id: string, action: string, payload: any = {}) => {
    setRefreshing(true);
    const res = await apiClient.request(action, { id, ...payload });
    if (res.ok) {
      await fetchAssignments();
    } else {
      alert(res.message);
    }
    setRefreshing(false);
  };

  const handleCompletePrompt = (id: string) => {
    const notes = prompt("Enter work completion notes (materials, hours, details):");
    if (notes === null) return; // cancelled
    if (!notes.trim()) {
      alert("Completion notes are required.");
      return;
    }
    executeAction(id, "wo.complete", { completionNotes: notes.trim() });
  };

  const handleHoldPrompt = (id: string) => {
    const reason = prompt("Enter hold reason (e.g. waiting for spare parts):");
    if (reason === null) return;
    if (!reason.trim()) {
      alert("Reason is required.");
      return;
    }
    executeAction(id, "wo.hold", { reason: reason.trim() });
  };

  const handleAddNotePrompt = async (id: string) => {
    const content = prompt("Enter note to add to operations log:");
    if (!content || !content.trim()) return;
    setRefreshing(true);
    const res = await apiClient.request("wo.addNote", { workOrderId: id, content: content.trim() });
    if (res.ok) {
      alert("Note logged successfully!");
    } else {
      alert(res.message);
    }
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Maintenance Board</h1>
          <p className="text-sm text-slate-500">
            Welcome back, <span className="font-semibold text-indigo-600">{user.name}</span>. Track and update your assigned dispatches.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Reload Jobs
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 p-12 text-center space-y-4 max-w-lg mx-auto">
          <ClipboardList className="h-12 w-12 text-slate-300 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-800">No Assignments Booked</h3>
            <p className="text-xs text-slate-400">
              You currently have no open active work orders assigned to your queue. Nice job!
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {orders.map((wo) => {
            const isSlaBreached =
              wo.dueDate &&
              new Date(wo.dueDate) < new Date() &&
              ![WorkOrderStatus.Completed, WorkOrderStatus.Closed, WorkOrderStatus.Cancelled].includes(wo.status);

            return (
              <div
                key={wo.id}
                className="bg-white rounded-xl border border-slate-100 shadow-2xs hover:shadow-xs hover:border-slate-200 transition p-5 flex flex-col justify-between space-y-5"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span
                      onClick={() => onNavigate("work-orders", "wo-details", { id: wo.id })}
                      className="font-mono text-xs font-extrabold text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
                    >
                      {wo.woNumber}
                    </span>
                    <div className="flex gap-2.5">
                      <StatusBadge status={wo.status} />
                      <PriorityBadge priority={wo.priority} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h3
                      onClick={() => onNavigate("work-orders", "wo-details", { id: wo.id })}
                      className="text-sm font-bold text-slate-900 line-clamp-1 hover:text-indigo-600 cursor-pointer transition"
                    >
                      {wo.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {wo.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2.5 text-xs text-slate-500">
                    <p className="flex items-center gap-1.5 truncate">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      <span>{wo.building} • Room {wo.room}</span>
                    </p>
                    <p className="flex items-center gap-1.5 truncate">
                      <AlertCircle className={`h-3.5 w-3.5 ${isSlaBreached ? "text-rose-500 animate-pulse" : "text-slate-400"}`} />
                      <span className={isSlaBreached ? "text-rose-600 font-bold" : ""}>
                        {isSlaBreached ? "SLA Breached!" : `SLA Target: ${wo.slaTargetHours}h`}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Technician Quick Action Bar */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-50 gap-3">
                  <button
                    onClick={() => handleAddNotePrompt(wo.id)}
                    className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-50 px-2.5 py-1.5 rounded transition cursor-pointer"
                    title="Add Update Note"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Add Note
                  </button>

                  <div className="flex gap-2">
                    {wo.status === WorkOrderStatus.Assigned && (
                      <button
                        onClick={() => executeAction(wo.id, "wo.start")}
                        className="inline-flex items-center gap-1 text-xs font-extrabold px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition cursor-pointer shadow-2xs"
                      >
                        <Play className="h-3.5 w-3.5 fill-current" />
                        Start Job
                      </button>
                    )}

                    {wo.status === WorkOrderStatus.InProgress && (
                      <>
                        <button
                          onClick={() => handleHoldPrompt(wo.id)}
                          className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg transition cursor-pointer"
                        >
                          <Pause className="h-3.5 w-3.5" />
                          Pause
                        </button>
                        <button
                          onClick={() => handleCompletePrompt(wo.id)}
                          className="inline-flex items-center gap-1 text-xs font-extrabold px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition cursor-pointer shadow-2xs"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Complete
                        </button>
                      </>
                    )}

                    {wo.status === WorkOrderStatus.OnHold && (
                      <button
                        onClick={() => executeAction(wo.id, "wo.resume")}
                        className="inline-flex items-center gap-1 text-xs font-extrabold px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition cursor-pointer shadow-2xs"
                      >
                        <Play className="h-3.5 w-3.5 fill-current" />
                        Resume Work
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
