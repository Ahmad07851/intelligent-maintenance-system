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
      <div className="flex items-center justify-center h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-[24px] font-bold tracking-tight text-slate-800">My Maintenance Board</h1>
          <p className="text-[14px] text-slate-500 mt-1">
            Welcome back, <span className="font-semibold text-primary">{user.name}</span>. Track and update your assigned dispatches.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 text-[14px] font-semibold text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-50 transition shadow-sm cursor-pointer"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin text-slate-400" : ""}`} />
          Reload Jobs
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center space-y-4 max-w-lg mx-auto shadow-[0_4px_10px_rgba(0,0,0,0.02)]">
          <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto border border-slate-100">
            <ClipboardList className="h-8 w-8 text-slate-300" />
          </div>
          <div>
            <h3 className="text-[16px] font-bold text-slate-800">No Assignments Booked</h3>
            <p className="text-[14px] text-slate-500 mt-1">
              You currently have no open active work orders assigned to your queue. Nice job!
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {orders.map((wo) => {
            const isSlaBreached =
              wo.dueDate &&
              new Date(wo.dueDate) < new Date() &&
              ![WorkOrderStatus.Completed, WorkOrderStatus.Closed, WorkOrderStatus.Cancelled].includes(wo.status);

            return (
              <div
                key={wo.id}
                className="bg-white rounded-lg border border-slate-200 shadow-[0_4px_10px_rgba(0,0,0,0.02)] hover:shadow-md transition p-5 flex flex-col justify-between space-y-5"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span
                      onClick={() => onNavigate("work-orders", "wo-details", { id: wo.id })}
                      className="font-mono text-[13px] font-bold text-primary hover:text-indigo-800 transition cursor-pointer"
                    >
                      {wo.woNumber}
                    </span>
                    <div className="flex gap-2">
                      <StatusBadge status={wo.status} />
                      <PriorityBadge priority={wo.priority} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <h3
                      onClick={() => onNavigate("work-orders", "wo-details", { id: wo.id })}
                      className="text-[15px] font-bold text-slate-800 line-clamp-2 hover:text-primary cursor-pointer transition leading-snug"
                    >
                      {wo.title}
                    </h3>
                    <p className="text-[13px] text-slate-500 line-clamp-2 leading-relaxed">
                      {wo.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 text-[12px] text-slate-600">
                    <p className="flex items-center gap-1.5 truncate">
                      <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                      <span className="truncate">{wo.building} • Room {wo.room}</span>
                    </p>
                    <p className="flex items-center gap-1.5 truncate">
                      <AlertCircle className={`h-4 w-4 shrink-0 ${isSlaBreached ? "text-danger animate-pulse" : "text-slate-400"}`} />
                      <span className={`truncate ${isSlaBreached ? "text-danger font-bold" : ""}`}>
                        {isSlaBreached ? "SLA Breached!" : `SLA Target: ${wo.slaTargetHours}h`}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Technician Quick Action Bar */}
                <div className="flex items-center justify-between pt-5 border-t border-slate-100 gap-3">
                  <button
                    onClick={() => handleAddNotePrompt(wo.id)}
                    className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-50 px-3 py-2 rounded transition cursor-pointer"
                    title="Add Update Note"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Add Note
                  </button>

                  <div className="flex gap-2">
                    {wo.status === WorkOrderStatus.Assigned && (
                      <button
                        onClick={() => executeAction(wo.id, "wo.start")}
                        className="inline-flex items-center gap-1.5 text-[12px] font-bold px-4 py-2 bg-primary hover:bg-indigo-700 text-white rounded transition cursor-pointer shadow-sm"
                      >
                        <Play className="h-4 w-4 fill-current" />
                        Start Job
                      </button>
                    )}

                    {wo.status === WorkOrderStatus.InProgress && (
                      <>
                        <button
                          onClick={() => handleHoldPrompt(wo.id)}
                          className="inline-flex items-center gap-1.5 text-[12px] font-bold px-3 py-2 border border-warning text-yellow-800 bg-yellow-50 hover:bg-yellow-100 rounded transition cursor-pointer"
                        >
                          <Pause className="h-4 w-4" />
                          Pause
                        </button>
                        <button
                          onClick={() => handleCompletePrompt(wo.id)}
                          className="inline-flex items-center gap-1.5 text-[12px] font-bold px-4 py-2 bg-success hover:bg-green-700 text-white rounded transition cursor-pointer shadow-sm"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Complete
                        </button>
                      </>
                    )}

                    {wo.status === WorkOrderStatus.OnHold && (
                      <button
                        onClick={() => executeAction(wo.id, "wo.resume")}
                        className="inline-flex items-center gap-1.5 text-[12px] font-bold px-4 py-2 bg-primary hover:bg-indigo-700 text-white rounded transition cursor-pointer shadow-sm"
                      >
                        <Play className="h-4 w-4 fill-current" />
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
