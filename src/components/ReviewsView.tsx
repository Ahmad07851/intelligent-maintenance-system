/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { apiClient } from "../api/client";
import { WorkOrder, WorkOrderStatus, WorkOrderPriority } from "../types";
import { StatusBadge, PriorityBadge } from "./WorkOrdersView";
import { CheckCircle2, RotateCcw, RefreshCw, FileText, Calendar, User, Eye, AlertCircle } from "lucide-react";

interface ReviewsViewProps {
  onNavigate: (view: string, subView?: string, params?: any) => void;
}

export default function ReviewsView({ onNavigate }: ReviewsViewProps) {
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Closeout modal state
  const [reviewWo, setReviewWo] = useState<WorkOrder | null>(null);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject" | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");

  const fetchPendingReviews = async () => {
    setLoading(true);
    const res = await apiClient.request("wo.list", { status: WorkOrderStatus.PendingReview });
    if (res.ok && res.data) {
      setOrders(res.data);
    }
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    const res = await apiClient.request("wo.list", { status: WorkOrderStatus.PendingReview });
    if (res.ok && res.data) {
      setOrders(res.data);
    }
    setRefreshing(false);
  };

  useEffect(() => {
    fetchPendingReviews();
  }, []);

  const handleReviewTrigger = (wo: WorkOrder, action: "approve" | "reject") => {
    setReviewWo(wo);
    setReviewAction(action);
    setReviewNotes("");
  };

  const handleSubmitReview = async () => {
    if (!reviewWo || !reviewAction) return;
    setRefreshing(true);

    const endpoint = reviewAction === "approve" ? "wo.close" : "wo.rejectClosure";
    const payload: any = { id: reviewWo.id };

    if (reviewAction === "approve") {
      payload.closureNotes = reviewNotes;
    } else {
      payload.reason = reviewNotes;
    }

    const res = await apiClient.request(endpoint, payload);
    if (res.ok) {
      setReviewWo(null);
      setReviewAction(null);
      await fetchPendingReviews();
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Closeout Reviews</h1>
          <p className="text-sm text-slate-500">
            Audit work orders submitted by technicians for final inspection, and approve closure or request correction.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh Queue
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left main: Review Queue List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Review Queue ({orders.length})</h2>

          {orders.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-100 p-12 text-center space-y-3">
              <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">Clear Deck!</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Excellent. No completed tasks are currently awaiting supervisor inspection.
              </p>
            </div>
          ) : (
            orders.map((wo) => (
              <div
                key={wo.id}
                className="bg-white rounded-xl border border-slate-100 shadow-2xs hover:shadow-xs p-5 space-y-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        onClick={() => onNavigate("work-orders", "wo-details", { id: wo.id })}
                        className="font-mono text-xs font-black text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
                      >
                        {wo.woNumber}
                      </span>
                      <PriorityBadge priority={wo.priority} />
                      {wo.slaBreached && (
                        <span className="text-[10px] bg-rose-50 text-rose-600 font-bold px-2 py-0.5 rounded-full border border-rose-100 animate-pulse">
                          SLA Breached
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{wo.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{wo.description}</p>
                  </div>
                </div>

                {/* Completion Note detail block */}
                {wo.completionNotes && (
                  <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100/50 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Technician closeout summary:</span>
                    <p className="text-xs text-slate-700 font-medium leading-relaxed italic">
                      "{wo.completionNotes}"
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-slate-50 text-xs text-slate-400">
                  <div className="space-y-0.5">
                    <p className="font-semibold text-slate-700">Completed By: {wo.assignedTo?.split("@")[0]}</p>
                    <p className="text-[10px]">Site: {wo.building} • Rm {wo.room}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onNavigate("work-orders", "wo-details", { id: wo.id })}
                      className="p-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg transition cursor-pointer"
                      title="Open details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleReviewTrigger(wo, "reject")}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-semibold transition cursor-pointer"
                    >
                      <RotateCcw className="h-3.5 w-3.5" /> Reject
                    </button>
                    <button
                      onClick={() => handleReviewTrigger(wo, "approve")}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-extrabold transition cursor-pointer shadow-2xs"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Approve Closeout
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right contextual panel (Active Approval focus) */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Verification Inspection</h2>

          {reviewWo && reviewAction ? (
            <div className="bg-white rounded-xl border border-indigo-100 p-5 shadow-xs space-y-4 animate-fade-in text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-bold text-indigo-700">
                  {reviewAction === "approve" ? "Audit Action: Close Order" : "Audit Action: Return to Tech"}
                </span>
                <span className="font-mono font-bold text-slate-400">{reviewWo.woNumber}</span>
              </div>

              <div className="space-y-1">
                <p className="font-semibold text-slate-800 line-clamp-2">{reviewWo.title}</p>
                <p className="text-slate-400 text-[10px]">Division: {reviewWo.assignedTeam || "N/A"}</p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">
                  {reviewAction === "approve"
                    ? "Review closeout comments (Inspection note)"
                    : "Specify corrections needed (Technician check-list) *"}
                </label>
                <textarea
                  rows={4}
                  required={reviewAction === "reject"}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder={reviewAction === "approve" ? "e.g. Work inspected and verified up to standard. Excellent execution." : "e.g. Drain line still leaking. Verify nitrogen seals are tightened."}
                  className="w-full text-xs py-2 px-3 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="flex gap-2 font-bold justify-end pt-2">
                <button
                  onClick={() => {
                    setReviewWo(null);
                    setReviewAction(null);
                  }}
                  className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-500 cursor-pointer"
                >
                  Dismiss
                </button>
                <button
                  onClick={handleSubmitReview}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition cursor-pointer"
                >
                  Submit Audit Decision
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-6 text-center text-xs text-slate-400 space-y-2">
              <Eye className="h-8 w-8 text-slate-300 mx-auto" />
              <p className="font-bold text-slate-500">Inspection Idle</p>
              <p className="max-w-xs mx-auto text-[11px]">Select Approve or Reject on any pending ticket to load the review console.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
