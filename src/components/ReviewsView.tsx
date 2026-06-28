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
          <h1 className="text-[24px] font-bold tracking-tight text-slate-800">Closeout Reviews</h1>
          <p className="text-[14px] text-slate-500 mt-1">
            Audit work orders submitted by technicians for final inspection, and approve closure or request correction.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 text-[14px] font-semibold text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-50 transition shadow-sm cursor-pointer"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin text-slate-400" : ""}`} />
          Refresh Queue
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left main: Review Queue List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[12px] font-bold uppercase tracking-wider text-slate-500">Review Queue ({orders.length})</h2>
          </div>

          {orders.length === 0 ? (
            <div className="bg-white rounded-lg border border-slate-200 p-12 text-center space-y-4 shadow-[0_4px_10px_rgba(0,0,0,0.02)]">
              <div className="h-16 w-16 bg-green-50 rounded-full flex items-center justify-center mx-auto border border-green-100">
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
              <div>
                <h3 className="text-[16px] font-bold text-slate-800">Clear Deck!</h3>
                <p className="text-[14px] text-slate-500 mt-1 max-w-sm mx-auto">
                  Excellent. No completed tasks are currently awaiting supervisor inspection.
                </p>
              </div>
            </div>
          ) : (
            orders.map((wo) => (
              <div
                key={wo.id}
                className="bg-white rounded-lg border border-slate-200 shadow-[0_4px_10px_rgba(0,0,0,0.02)] hover:shadow-md p-5 space-y-4 transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5">
                      <span
                        onClick={() => onNavigate("work-orders", "wo-details", { id: wo.id })}
                        className="font-mono text-[13px] font-bold text-primary hover:text-indigo-800 transition cursor-pointer"
                      >
                        {wo.woNumber}
                      </span>
                      <PriorityBadge priority={wo.priority} />
                      {wo.slaBreached && (
                        <span className="text-[10px] bg-red-50 text-danger font-bold px-2 py-0.5 rounded border border-red-100 animate-pulse uppercase tracking-wider">
                          SLA Breached
                        </span>
                      )}
                    </div>
                    <h3 className="text-[16px] font-bold text-slate-800 line-clamp-1">{wo.title}</h3>
                    <p className="text-[14px] text-slate-500 leading-relaxed line-clamp-2">{wo.description}</p>
                  </div>
                </div>

                {/* Completion Note detail block */}
                {wo.completionNotes && (
                  <div className="p-4 bg-slate-50 rounded border border-slate-200 space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Technician closeout summary:</span>
                    <p className="text-[13px] text-slate-800 font-medium leading-relaxed italic border-l-2 border-slate-300 pl-3">
                      "{wo.completionNotes}"
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-5 border-t border-slate-100 text-[13px] text-slate-500">
                  <div className="space-y-1">
                    <p className="font-bold text-slate-700">Completed By: {wo.assignedTo?.split("@")[0]}</p>
                    <p className="text-[12px]">Site: {wo.building} • Rm {wo.room}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onNavigate("work-orders", "wo-details", { id: wo.id })}
                      className="p-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded transition cursor-pointer"
                      title="Open details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleReviewTrigger(wo, "reject")}
                      className="inline-flex items-center gap-1.5 px-4 py-2 border border-red-200 text-danger hover:bg-red-50 rounded text-[13px] font-semibold transition cursor-pointer"
                    >
                      <RotateCcw className="h-4 w-4" /> Reject
                    </button>
                    <button
                      onClick={() => handleReviewTrigger(wo, "approve")}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-success hover:bg-green-700 text-white rounded text-[13px] font-bold transition cursor-pointer shadow-sm"
                    >
                      <CheckCircle2 className="h-4 w-4" /> Approve Closeout
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right contextual panel (Active Approval focus) */}
        <div className="space-y-4">
          <h2 className="text-[12px] font-bold uppercase tracking-wider text-slate-500">Verification Inspection</h2>

          {reviewWo && reviewAction ? (
            <div className="bg-white rounded-lg border border-primary/20 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className={`font-bold text-[14px] ${reviewAction === "approve" ? "text-success" : "text-danger"}`}>
                  {reviewAction === "approve" ? "Audit Action: Close Order" : "Audit Action: Return to Tech"}
                </span>
                <span className="font-mono font-bold text-[13px] text-slate-500">{reviewWo.woNumber}</span>
              </div>

              <div className="space-y-1">
                <p className="font-bold text-[14px] text-slate-800 line-clamp-2">{reviewWo.title}</p>
                <p className="text-slate-500 text-[12px]">Division: {reviewWo.assignedTeam || "N/A"}</p>
              </div>

              <div className="space-y-2">
                <label className="text-[13px] font-semibold text-slate-700">
                  {reviewAction === "approve"
                    ? "Review closeout comments (Inspection note)"
                    : "Specify corrections needed (Technician check-list) *"}
                </label>
                <textarea
                  rows={5}
                  required={reviewAction === "reject"}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder={reviewAction === "approve" ? "e.g. Work inspected and verified up to standard. Excellent execution." : "e.g. Drain line still leaking. Verify nitrogen seals are tightened."}
                  className="w-full text-[14px] py-2.5 px-3 border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>

              <div className="flex gap-3 justify-end pt-3">
                <button
                  onClick={() => {
                    setReviewWo(null);
                    setReviewAction(null);
                  }}
                  className="px-4 py-2 text-[13px] border border-slate-300 hover:bg-slate-50 rounded font-semibold text-slate-600 transition cursor-pointer"
                >
                  Dismiss
                </button>
                <button
                  onClick={handleSubmitReview}
                  className={`px-4 py-2 text-[13px] font-bold text-white rounded transition cursor-pointer shadow-sm ${
                    reviewAction === "approve" ? "bg-success hover:bg-green-700" : "bg-danger hover:bg-red-700"
                  }`}
                >
                  Submit Audit Decision
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-dashed border-slate-300 rounded-lg p-10 text-center space-y-3">
              <Eye className="h-10 w-10 text-slate-300 mx-auto" />
              <p className="font-bold text-[14px] text-slate-600">Inspection Idle</p>
              <p className="max-w-[200px] mx-auto text-[13px] text-slate-500 leading-relaxed">
                Select <span className="font-semibold text-slate-700">Approve</span> or <span className="font-semibold text-slate-700">Reject</span> on any pending ticket to load the review console.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
