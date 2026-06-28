/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { apiClient } from "../api/client";
import { authStore } from "../auth/authStore";
import { WorkOrder, WorkOrderStatus, WorkOrderNote, WorkOrderAttachment, WorkOrderHistory, Technician, WorkOrderPriority } from "../types";
import { StatusBadge, PriorityBadge } from "./WorkOrdersView";
import {
  ArrowLeft,
  Calendar,
  User,
  MapPin,
  Clock,
  Sparkles,
  Paperclip,
  CheckCircle2,
  XCircle,
  Play,
  Pause,
  RotateCcw,
  Ban,
  Send,
  Loader2,
  FileText,
  Copy
} from "lucide-react";

interface WorkOrderDetailsProps {
  params: { id: string };
  onNavigate: (view: string, subView?: string, params?: any) => void;
}

export default function WorkOrderDetailsView({ params, onNavigate }: WorkOrderDetailsProps) {
  const [wo, setWo] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Notes and Files
  const [notes, setNotes] = useState<WorkOrderNote[]>([]);
  const [newNoteText, setNewNoteText] = useState("");
  const [attachments, setAttachments] = useState<WorkOrderAttachment[]>([]);
  const [history, setHistory] = useState<WorkOrderHistory[]>([]);

  // Technicians dispatch
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [selectedTech, setSelectedTech] = useState("");

  // Workflow prompt modal states
  const [promptAction, setPromptAction] = useState<string | null>(null); // 'complete', 'hold', 'reject', 'cancel', 'close'
  const [promptText, setPromptText] = useState("");

  // AI results
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const [aiEmail, setAiEmail] = useState<{ recipient: string; subject: string; body: string } | null>(null);
  const [aiEmailLoading, setAiEmailLoading] = useState(false);

  const fetchAllDetails = async () => {
    setRefreshing(true);
    const resWo = await apiClient.request("wo.get", { id: params.id });
    if (resWo.ok && resWo.data) {
      setWo(resWo.data);
      setSelectedTech(resWo.data.assignedTo || "");
    }

    const resNotes = await apiClient.request("wo.listNotes", { workOrderId: params.id });
    if (resNotes.ok && resNotes.data) {
      setNotes(resNotes.data);
    }

    const resFiles = await apiClient.request("wo.listFiles", { workOrderId: params.id });
    if (resFiles.ok && resFiles.data) {
      setAttachments(resFiles.data);
    }

    const resHist = await apiClient.request("wo.history", { workOrderId: params.id });
    if (resHist.ok && resHist.data) {
      setHistory(resHist.data);
    }

    const resTech = await apiClient.request("technicians.list");
    if (resTech.ok && resTech.data) {
      setTechnicians(resTech.data);
    }

    setRefreshing(false);
    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    fetchAllDetails();
  }, [params.id]);

  // SLA state variables
  const [slaTimeRemaining, setSlaTimeRemaining] = useState("");
  useEffect(() => {
    if (!wo || !wo.dueDate) return;
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const due = new Date(wo.dueDate).getTime();
      const diff = due - now;

      if (diff < 0) {
        setSlaTimeRemaining("SLA BREACHED");
      } else {
        const hrs = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setSlaTimeRemaining(`${hrs}h ${mins}m left`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [wo]);

  // Add Note Handler
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim() || !wo) return;
    const res = await apiClient.request("wo.addNote", { workOrderId: wo.id, content: newNoteText.trim() });
    if (res.ok) {
      setNewNoteText("");
      // Add note instantly to feed or reload
      const resNotes = await apiClient.request("wo.listNotes", { workOrderId: wo.id });
      if (resNotes.ok && resNotes.data) setNotes(resNotes.data);
    }
  };

  // Upload File emulator
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !wo) return;
    const file = e.target.files[0];

    const res = await apiClient.request("wo.uploadFile", {
      workOrderId: wo.id,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    });

    if (res.ok) {
      const resFiles = await apiClient.request("wo.listFiles", { workOrderId: wo.id });
      if (resFiles.ok && resFiles.data) setAttachments(resFiles.data);
    }
  };

  // Dispatch Assignment
  const handleDispatch = async (techEmail: string) => {
    if (!wo || !techEmail) return;
    setRefreshing(true);
    const selectedObj = technicians.find((t) => t.email === techEmail);
    const res = await apiClient.request("wo.assign", {
      id: wo.id,
      assignedTo: techEmail,
      assignedTeam: selectedObj ? `${selectedObj.specialty} Division` : "Facilities Team",
    });
    if (res.ok) {
      await fetchAllDetails();
    } else {
      alert(res.message);
      setRefreshing(false);
    }
  };

  // Handle Dialog Confirmation for Statuses
  const triggerWorkflowPrompt = (action: string) => {
    setPromptAction(action);
    setPromptText("");
  };

  const handleConfirmWorkflowAction = async () => {
    if (!wo || !promptAction) return;
    setRefreshing(true);

    let endpoint = "";
    let payload: any = { id: wo.id };

    if (promptAction === "hold") {
      endpoint = "wo.hold";
      payload.reason = promptText;
    } else if (promptAction === "complete") {
      endpoint = "wo.complete";
      payload.completionNotes = promptText;
    } else if (promptAction === "close") {
      endpoint = "wo.close";
      payload.closureNotes = promptText;
    } else if (promptAction === "reject") {
      endpoint = "wo.rejectClosure";
      payload.reason = promptText;
    } else if (promptAction === "cancel") {
      endpoint = "wo.cancel";
      payload.reason = promptText;
    }

    if (endpoint) {
      const res = await apiClient.request(endpoint, payload);
      if (res.ok) {
        setPromptAction(null);
        await fetchAllDetails();
      } else {
        alert(res.message);
        setRefreshing(false);
      }
    }
  };

  const executeSimpleAction = async (endpoint: string) => {
    if (!wo) return;
    setRefreshing(true);
    const res = await apiClient.request(endpoint, { id: wo.id });
    if (res.ok) {
      await fetchAllDetails();
    } else {
      alert(res.message);
      setRefreshing(false);
    }
  };

  // AI Summary generator
  const handleGenerateAiSummary = async () => {
    if (!wo) return;
    setAiSummaryLoading(true);
    const res = await apiClient.request("ai.summariseWorkOrder", {
      title: wo.title,
      description: wo.description,
    });
    if (res.ok && res.data) {
      setAiSummary(res.data.summary);
    }
    setAiSummaryLoading(false);
  };

  // AI Supplier email generator
  const handleGenerateAiEmail = async () => {
    if (!wo) return;
    setAiEmailLoading(true);
    const res = await apiClient.request("ai.prepareSupplierEmail", {
      woNumber: wo.woNumber,
      title: wo.title,
      description: wo.description,
    });
    if (res.ok && res.data) {
      setAiEmail(res.data);
    }
    setAiEmailLoading(false);
  };

  const copyToClipboard = (text: string) => {
    try {
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(text);
        alert("Copied to clipboard!");
        return;
      }
    } catch (e) {}

    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      alert("Copied to clipboard!");
    } catch (err) {
      alert("Failed to copy automatically. Please select and copy the text manually.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!wo) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 font-bold">Work order not found or deleted.</p>
        <button
          onClick={() => onNavigate("work-orders", "all-orders")}
          className="mt-4 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
        >
          Back to list
        </button>
      </div>
    );
  }

  // Permission Checks
  const isTechAssigned = authStore.getCurrentUser().email.toLowerCase() === (wo.assignedTo || "").toLowerCase();
  const isSupervisorOrOwner = authStore.hasPermission("PERM_WO_ASSIGN") || authStore.hasPermission("PERM_WO_REVIEW");

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate("work-orders", "all-orders")}
            className="p-1.5 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-500 hover:text-slate-800 transition cursor-pointer"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </button>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                {wo.woNumber}
              </span>
              <StatusBadge status={wo.status} />
              <PriorityBadge priority={wo.priority} />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-snug">{wo.title}</h1>
          </div>
        </div>

        {/* Global Loading Overlay */}
        {refreshing && (
          <div className="flex items-center gap-1 text-xs font-semibold text-slate-400">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Synchronizing...
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Columns (SLA, Workflow, Attachments, Notes) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Operations Actions Panel */}
          <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Operations & Workflow Actions</h2>

            <div className="flex flex-wrap gap-3">
              {/* Technician Actions */}
              {(isTechAssigned || isSupervisorOrOwner) && wo.status === WorkOrderStatus.Assigned && (
                <button
                  onClick={() => executeSimpleAction("wo.start")}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition cursor-pointer"
                >
                  <Play className="h-3.5 w-3.5" /> Start Work (Check-in)
                </button>
              )}

              {(isTechAssigned || isSupervisorOrOwner) && wo.status === WorkOrderStatus.InProgress && (
                <>
                  <button
                    onClick={() => triggerWorkflowPrompt("complete")}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg transition cursor-pointer"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Complete Work (Awaiting Review)
                  </button>

                  <button
                    onClick={() => triggerWorkflowPrompt("hold")}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg transition cursor-pointer"
                  >
                    <Pause className="h-3.5 w-3.5" /> Put On Hold
                  </button>
                </>
              )}

              {(isTechAssigned || isSupervisorOrOwner) && wo.status === WorkOrderStatus.OnHold && (
                <button
                  onClick={() => executeSimpleAction("wo.resume")}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition cursor-pointer"
                >
                  <Play className="h-3.5 w-3.5" /> Resume Work
                </button>
              )}

              {/* Supervisor Approval Actions */}
              {isSupervisorOrOwner && wo.status === WorkOrderStatus.PendingReview && (
                <>
                  <button
                    onClick={() => triggerWorkflowPrompt("close")}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition cursor-pointer"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Approve Closeout
                  </button>

                  <button
                    onClick={() => triggerWorkflowPrompt("reject")}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition cursor-pointer"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Reject & Return to In-Progress
                  </button>
                </>
              )}

              {/* General Cancellation (Only active items) */}
              {isSupervisorOrOwner &&
                ![WorkOrderStatus.Closed, WorkOrderStatus.Cancelled, WorkOrderStatus.PendingReview].includes(wo.status) && (
                  <button
                    onClick={() => triggerWorkflowPrompt("cancel")}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-rose-200 hover:bg-rose-50 text-rose-700 text-xs font-bold rounded-lg transition cursor-pointer"
                  >
                    <Ban className="h-3.5 w-3.5" /> Cancel Order
                  </button>
                )}
            </div>
          </div>

          {/* Workflow Prompt Modal Overlay (integrated into view for pristine execution without popups) */}
          {promptAction && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4 animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  {promptAction === "complete"
                    ? "Completion Closeout Summary"
                    : promptAction === "hold"
                    ? "Place Work Order On Hold"
                    : promptAction === "close"
                    ? "Approve Operations Closeout"
                    : promptAction === "reject"
                    ? "Reject Completion / Request Correction"
                    : "Cancel Work Order"}
                </span>
                <button
                  onClick={() => setPromptAction(null)}
                  className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition cursor-pointer"
                >
                  Close Panel
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">
                  {promptAction === "complete"
                    ? "Describe repairs done, replacement parts used, and flow validations *"
                    : promptAction === "hold"
                    ? "Specify the blocker reason (e.g. waiting for parts, landlord approvals) *"
                    : promptAction === "close"
                    ? "Add final inspection closeout notes (optional)"
                    : promptAction === "reject"
                    ? "Specify the verification failure detail (e.g. leaking faucet still dripping) *"
                    : "Specify the reason for cancellation *"}
                </label>
                <textarea
                  rows={3}
                  required
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  placeholder="Provide complete notes..."
                  className="w-full text-xs py-2 px-3 border border-slate-200 rounded-lg focus:outline-none bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 text-xs font-bold">
                <button
                  onClick={() => setPromptAction(null)}
                  className="px-3.5 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-100 transition text-slate-600 cursor-pointer"
                >
                  Dismiss
                </button>
                <button
                  onClick={handleConfirmWorkflowAction}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition cursor-pointer"
                >
                  Confirm Operations Change
                </button>
              </div>
            </div>
          )}

          {/* Core Info & Metadata Grid */}
          <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-xs grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Order Information</h3>
              <div className="space-y-2">
                <p className="flex items-center gap-2 text-slate-600">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span>Created: {new Date(wo.createdAt).toLocaleString()}</span>
                </p>
                <p className="flex items-center gap-2 text-slate-600">
                  <User className="h-4 w-4 text-slate-400" />
                  <span>Raised By: {wo.requestedBy} ({wo.requestSource})</span>
                </p>
                <p className="flex items-center gap-2 text-slate-600">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  <span>Location: {wo.building} • Floor {wo.floor} • Room {wo.room}</span>
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">SLA Performance Target</h3>
              <div className="space-y-2">
                <p className="flex items-center gap-2 text-slate-600">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <span>Due Date: {new Date(wo.dueDate).toLocaleString()}</span>
                </p>
                <p className="flex items-center gap-2 text-slate-600">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <span className="font-semibold">
                    Target Limit: <span className="text-slate-800">{wo.slaTargetHours} Hours</span>
                  </span>
                </p>
                {wo.status !== WorkOrderStatus.Closed && wo.status !== WorkOrderStatus.Completed && (
                  <div className={`p-2 rounded-lg text-xs font-bold inline-block border ${
                    wo.slaBreached || slaTimeRemaining === "SLA BREACHED"
                      ? "bg-rose-50 text-rose-700 border-rose-100 animate-pulse"
                      : "bg-emerald-50 text-emerald-700 border-emerald-100"
                  }`}>
                    Timer: {slaTimeRemaining}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Completion/Closure Results */}
          {(wo.completionNotes || wo.closureNotes) && (
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 space-y-4">
              {wo.completionNotes && (
                <div className="space-y-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Technician Completion Notes</h4>
                  <p className="text-xs text-slate-700 bg-white border border-slate-200/50 p-3 rounded-lg leading-relaxed">
                    {wo.completionNotes}
                  </p>
                </div>
              )}
              {wo.closureNotes && (
                <div className="space-y-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Supervisor Closeout Notes</h4>
                  <p className="text-xs text-slate-700 bg-white border border-slate-200/50 p-3 rounded-lg leading-relaxed">
                    {wo.closureNotes}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Notes feeds (Chat block) */}
          <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900">Operations Feed & Notes</h2>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {notes.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No general notes logged for this work order.</p>
              ) : (
                notes.map((n) => (
                  <div key={n.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100/75 space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400">
                      <span className="text-slate-700 font-bold">{n.createdByName} ({n.createdBy.split("@")[0]})</span>
                      <span>{new Date(n.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{n.content}</p>
                  </div>
                ))
              )}
            </div>

            {/* Note input form */}
            <form onSubmit={handleAddNote} className="flex gap-2">
              <input
                type="text"
                placeholder="Write a message, update details, log part orders..."
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                className="flex-1 text-xs py-2 px-3.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              <button
                type="submit"
                className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition cursor-pointer"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>

          {/* Files & Attachments panel */}
          <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Paperclip className="h-4.5 w-4.5 text-slate-400" />
              Media & Document Attachments
            </h2>

            {/* Attachment rows */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {attachments.map((file) => (
                <div
                  key={file.id}
                  className="p-3 border border-slate-100 rounded-xl hover:bg-slate-50/50 transition flex items-center gap-3"
                >
                  <span className="h-10 w-10 bg-indigo-50 text-indigo-600 flex items-center justify-center rounded-lg text-xs font-bold">
                    {file.fileName.split(".").pop()?.toUpperCase() || "FILE"}
                  </span>
                  <div className="flex-1 min-w-0 text-xs">
                    <p className="font-semibold text-slate-800 truncate" title={file.fileName}>
                      {file.fileName}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {Math.round(file.fileSize / 1024)} KB • {file.createdBy.split("@")[0]}
                    </p>
                  </div>
                  <a
                    href={file.driveUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 text-indigo-600 hover:bg-indigo-50 rounded transition cursor-pointer"
                  >
                    <FileText className="h-4.5 w-4.5" />
                  </a>
                </div>
              ))}
            </div>

            {/* Simulated file upload */}
            <div className="border border-dashed border-slate-200 hover:bg-slate-50/30 rounded-xl p-5 text-center relative transition">
              <input
                type="file"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Paperclip className="h-6 w-6 text-slate-300 mx-auto mb-1.5" />
              <p className="text-xs font-bold text-slate-700">Attach file metadata</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Drag-and-drop or select photo/pdf (Saved to Drive folder)</p>
            </div>
          </div>
        </div>

        {/* Right Column (Dispatch, AI Copilot, History Logs) */}
        <div className="space-y-6">
          {/* Dispatch Assignment Panel */}
          {isSupervisorOrOwner && (
            <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-xs space-y-4">
              <h2 className="text-base font-bold text-slate-900">Technician Dispatch</h2>

              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="text-slate-400 font-semibold">Assigned Specialist</label>
                  <select
                    value={selectedTech}
                    onChange={(e) => handleDispatch(e.target.value)}
                    className="w-full text-xs py-2 px-3 border border-slate-200 rounded-lg bg-white font-medium text-slate-800 focus:outline-none"
                  >
                    <option value="">Unassigned</option>
                    {technicians.map((t) => (
                      <option key={t.id} value={t.email}>
                        {t.name} ({t.specialty}) - Workload: {t.currentWorkload}
                      </option>
                    ))}
                  </select>
                </div>
                {wo.assignedTo && (
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg space-y-1">
                    <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[9px]">Active Division</span>
                    <p className="font-semibold text-slate-800">{wo.assignedTeam || "Central Facilities Response"}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* AI Operations Copilot Assistant */}
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-xl p-5 shadow-md border border-indigo-950 space-y-4">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded-full border border-indigo-500/20">
                ✨ Operations Intelligence
              </span>
              <h2 className="text-base font-bold">IMS Copilot Actions</h2>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleGenerateAiSummary}
                disabled={aiSummaryLoading}
                className="w-full flex items-center justify-center gap-2 py-2 px-3.5 bg-white/10 hover:bg-white/15 text-white text-xs font-bold rounded-lg transition cursor-pointer"
              >
                {aiSummaryLoading ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : "Generate AI Summary Brief"}
              </button>

              <button
                onClick={handleGenerateAiEmail}
                disabled={aiEmailLoading}
                className="w-full flex items-center justify-center gap-2 py-2 px-3.5 bg-white/10 hover:bg-white/15 text-white text-xs font-bold rounded-lg transition cursor-pointer"
              >
                {aiEmailLoading ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : "Draft Supplier Email via AI"}
              </button>
            </div>

            {/* AI Summary results */}
            {aiSummary && (
              <div className="p-3.5 bg-indigo-950/60 border border-indigo-500/10 rounded-lg text-xs leading-relaxed text-indigo-200 animate-fade-in space-y-2">
                <span className="font-bold text-white block">AI Summary Brief:</span>
                <p>{aiSummary}</p>
                <button
                  onClick={() => copyToClipboard(aiSummary)}
                  className="flex items-center gap-1 font-bold text-[10px] text-white/70 hover:text-white mt-1 cursor-pointer"
                >
                  <Copy className="h-3 w-3" /> Copy Summary
                </button>
              </div>
            )}

            {/* AI Email results */}
            {aiEmail && (
              <div className="p-3.5 bg-indigo-950/60 border border-indigo-500/10 rounded-lg text-xs leading-relaxed text-indigo-200 animate-fade-in space-y-2">
                <div className="space-y-1 border-b border-indigo-500/10 pb-2 mb-2">
                  <p><span className="text-slate-400">To:</span> {aiEmail.recipient}</p>
                  <p><span className="text-slate-400">Sub:</span> {aiEmail.subject}</p>
                </div>
                <pre className="font-sans whitespace-pre-wrap text-[11px] bg-slate-950/40 p-2.5 rounded border border-slate-900/50 max-h-48 overflow-y-auto">
                  {aiEmail.body}
                </pre>
                <button
                  onClick={() => copyToClipboard(aiEmail.body)}
                  className="flex items-center gap-1 font-bold text-[10px] text-white/70 hover:text-white cursor-pointer"
                >
                  <Copy className="h-3 w-3" /> Copy Draft Message
                </button>
              </div>
            )}
          </div>

          {/* Timeline Audit Logs */}
          <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900">Status History Timeline</h2>

            <div className="flow-root text-xs">
              <ul className="-mb-8">
                {history.map((hist, index) => (
                  <li key={hist.id}>
                    <div className="relative pb-6">
                      {index !== history.length - 1 ? (
                        <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-100" aria-hidden="true"></span>
                      ) : null}
                      <div className="relative flex space-x-3">
                        <div>
                          <span className="h-8 w-8 rounded-full bg-slate-50 text-slate-500 flex items-center justify-center ring-4 ring-white border border-slate-100 font-bold">
                            {index + 1}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0 pt-1.5">
                          <p className="font-bold text-slate-900">{hist.action.replace(/_/g, " ")}</p>
                          <p className="text-slate-400 text-[10px] mt-0.5">
                            {new Date(hist.createdAt).toLocaleString()} • {hist.createdBy.split("@")[0]}
                          </p>
                          {hist.notes && <p className="text-slate-500 italic mt-1 leading-relaxed text-[11px]">{hist.notes}</p>}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
