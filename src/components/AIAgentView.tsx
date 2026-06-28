import React, { useState, useEffect } from "react";
import { apiClient } from "../api/client";
import { WorkOrder, WorkOrderPriority, WorkOrderRiskLevel } from "../types";
import { Sparkles, Loader2, Copy, FileText, Mail, HelpCircle, Check, AlertCircle } from "lucide-react";

export default function AIAgentView() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [selectedWoId, setSelectedWoId] = useState("");

  // Tab state
  const [activeTab, setActiveTab] = useState<"classify" | "summarize" | "email">("classify");

  // Classification inputs/outputs
  const [classTitle, setClassTitle] = useState("");
  const [classDesc, setClassDesc] = useState("");
  const [classLoading, setClassLoading] = useState(false);
  const [classResult, setClassResult] = useState<{
    trade: string;
    priority: WorkOrderPriority;
    category: string;
    riskLevel: WorkOrderRiskLevel;
    confidence: number;
    reasoning: string;
  } | null>(null);

  // Summarize inputs/outputs
  const [sumLoading, setSumLoading] = useState(false);
  const [sumResult, setSumResult] = useState<string | null>(null);

  // Email inputs/outputs
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailResult, setEmailResult] = useState<{
    recipient: string;
    subject: string;
    body: string;
  } | null>(null);

  useEffect(() => {
    const fetchWos = async () => {
      const res = await apiClient.request("wo.list");
      if (res.ok && res.data) {
        setWorkOrders(res.data);
        if (res.data.length > 0) setSelectedWoId(res.data[0].id);
      }
    };
    fetchWos();
  }, []);

  const handleClassify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classTitle.trim()) {
      alert("Please provide at least a title.");
      return;
    }
    setClassLoading(true);
    setClassResult(null);
    const res = await apiClient.request("ai.classifyWorkOrder", {
      title: classTitle,
      description: classDesc,
    });
    if (res.ok && res.data) {
      setClassResult(res.data);
    }
    setClassLoading(false);
  };

  const handleSummarize = async () => {
    if (!selectedWoId) return;
    setSumLoading(true);
    setSumResult(null);
    const woItem = workOrders.find((w) => w.id === selectedWoId);
    if (!woItem) return;

    const res = await apiClient.request("ai.summariseWorkOrder", {
      title: woItem.title,
      description: woItem.description,
    });
    if (res.ok && res.data) {
      setSumResult(res.data.summary);
    }
    setSumLoading(false);
  };

  const handleWriteEmail = async () => {
    if (!selectedWoId) return;
    setEmailLoading(true);
    setEmailResult(null);
    const woItem = workOrders.find((w) => w.id === selectedWoId);
    if (!woItem) return;

    const res = await apiClient.request("ai.prepareSupplierEmail", {
      woNumber: woItem.woNumber,
      title: woItem.title,
      description: woItem.description,
    });
    if (res.ok && res.data) {
      setEmailResult(res.data);
    }
    setEmailLoading(false);
  };

  const handleCopy = (text: string) => {
    try {
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(text);
        alert("Text copied to clipboard!");
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
      alert("Text copied to clipboard!");
    } catch (err) {
      alert("Failed to copy automatically. Please select and copy the text manually.");
    }
  };

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto p-6 md:p-8">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-slate-200 pb-5">
        <span className="h-12 w-12 bg-gradient-to-tr from-primary to-purple-600 rounded-lg flex items-center justify-center text-[20px] shadow-sm">
          ✨
        </span>
        <div>
          <h1 className="text-[24px] font-bold tracking-tight text-slate-800">Intelligence Operations</h1>
          <p className="text-[14px] text-slate-500 font-medium mt-1">
            Test the integrated Gemini AI Copilot APIs for automated sorting, summarization, and vendor dispatches.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-2 text-[13px] font-bold text-slate-500 overflow-x-auto hide-scrollbar">
        <button
          onClick={() => setActiveTab("classify")}
          className={`px-5 py-3 border-b-2 transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === "classify"
              ? "border-primary text-primary bg-indigo-50/50"
              : "border-transparent hover:text-slate-800 hover:bg-slate-50"
          }`}
        >
          <Sparkles className="h-4 w-4" /> Classifier Copilot
        </button>

        <button
          onClick={() => setActiveTab("summarize")}
          className={`px-5 py-3 border-b-2 transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === "summarize"
              ? "border-primary text-primary bg-indigo-50/50"
              : "border-transparent hover:text-slate-800 hover:bg-slate-50"
          }`}
        >
          <FileText className="h-4 w-4" /> Summarizer Briefs
        </button>

        <button
          onClick={() => setActiveTab("email")}
          className={`px-5 py-3 border-b-2 transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === "email"
              ? "border-primary text-primary bg-indigo-50/50"
              : "border-transparent hover:text-slate-800 hover:bg-slate-50"
          }`}
        >
          <Mail className="h-4 w-4" /> Vendor Email Drafts
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main interactive Column */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 p-6 md:p-8 shadow-[0_4px_10px_rgba(0,0,0,0.02)] min-h-[500px]">
          {activeTab === "classify" && (
            <form onSubmit={handleClassify} className="space-y-5 animate-in fade-in duration-200">
              <div>
                <h2 className="text-[16px] font-bold text-slate-800">Dispatcher Classification Model</h2>
                <p className="text-[13px] text-slate-500 leading-relaxed mt-1">
                  Test the dispatch model. The AI parses the title and description to extract required trade specialties, urgency tags, and category mappings.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[13px] font-semibold text-slate-700">Sample Ticket Title *</label>
                <input
                  type="text"
                  required
                  value={classTitle}
                  onChange={(e) => setClassTitle(e.target.value)}
                  placeholder="e.g. Water coming down through the electrical panels in Warehouse 2"
                  className="w-full text-[14px] py-2.5 px-3 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-white shadow-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[13px] font-semibold text-slate-700">Sample Detailed Symptoms (Optional)</label>
                <textarea
                  rows={4}
                  value={classDesc}
                  onChange={(e) => setClassDesc(e.target.value)}
                  placeholder="e.g. Breaker #4 is humming, we smell burnt copper. Placed emergency buckets."
                  className="w-full text-[14px] py-2.5 px-3 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-white shadow-sm"
                />
              </div>

              <button
                type="submit"
                disabled={classLoading}
                className="inline-flex items-center gap-2 py-3 px-6 bg-primary hover:bg-indigo-700 text-white rounded text-[14px] font-bold transition disabled:opacity-50 cursor-pointer shadow-sm"
              >
                {classLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Run AI Classification Model
              </button>
            </form>
          )}

          {activeTab === "summarize" && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div>
                <h2 className="text-[16px] font-bold text-slate-800">Executive Brief Summarizer</h2>
                <p className="text-[13px] text-slate-500 leading-relaxed mt-1">
                  Condense heavy technical work reports or log histories into clean executive summaries suitable for facilities review.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[13px] font-semibold text-slate-700">Select Active Work Order</label>
                <select
                  value={selectedWoId}
                  onChange={(e) => setSelectedWoId(e.target.value)}
                  className="w-full text-[14px] py-2.5 px-3 border border-slate-300 rounded bg-white shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                >
                  {workOrders.length === 0 ? (
                    <option value="">No work orders available</option>
                  ) : (
                    workOrders.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.woNumber} - {w.title}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <button
                type="button"
                onClick={handleSummarize}
                disabled={sumLoading || !selectedWoId}
                className="inline-flex items-center gap-2 py-3 px-6 bg-primary hover:bg-indigo-700 text-white rounded text-[14px] font-bold transition disabled:opacity-50 cursor-pointer shadow-sm"
              >
                {sumLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                Generate Executive Summary
              </button>
            </div>
          )}

          {activeTab === "email" && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div>
                <h2 className="text-[16px] font-bold text-slate-800">Supplier / Vendor Dispatch Drafter</h2>
                <p className="text-[13px] text-slate-500 leading-relaxed mt-1">
                  Draft professional dispatch and repair quote request emails to external mechanical or engineering vendors.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[13px] font-semibold text-slate-700">Select Active Work Order</label>
                <select
                  value={selectedWoId}
                  onChange={(e) => setSelectedWoId(e.target.value)}
                  className="w-full text-[14px] py-2.5 px-3 border border-slate-300 rounded bg-white shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                >
                  {workOrders.length === 0 ? (
                    <option value="">No work orders available</option>
                  ) : (
                    workOrders.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.woNumber} - {w.title}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <button
                type="button"
                onClick={handleWriteEmail}
                disabled={emailLoading || !selectedWoId}
                className="inline-flex items-center gap-2 py-3 px-6 bg-primary hover:bg-indigo-700 text-white rounded text-[14px] font-bold transition disabled:opacity-50 cursor-pointer shadow-sm"
              >
                {emailLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                Draft Vendor Email
              </button>
            </div>
          )}
        </div>

        {/* Right Output Column */}
        <div className="space-y-4">
          <h2 className="text-[12px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <HelpCircle className="h-4 w-4" /> Agent Response Output
          </h2>

          <div className="bg-slate-50 rounded-lg border border-slate-200 p-6 min-h-[400px] h-full shadow-inner">
            {activeTab === "classify" && (
              <>
                {!classResult && !classLoading && (
                  <p className="text-[13px] text-slate-400 font-medium italic">Run the classifier to view predictions...</p>
                )}
                {classLoading && (
                  <div className="flex flex-col items-center justify-center h-full text-primary gap-3">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="text-[13px] font-bold">Model computing...</span>
                  </div>
                )}
                {classResult && !classLoading && (
                  <div className="space-y-5 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                      <span className="text-[12px] font-bold uppercase tracking-wider text-slate-500">AI Confidence</span>
                      <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-success bg-green-50 px-2 py-1 rounded">
                        <Check className="h-4 w-4" />
                        {Math.round(classResult.confidence * 100)}% Match
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-[13px]">
                      <div className="space-y-1">
                        <span className="text-slate-500 font-semibold text-[11px] uppercase tracking-wider">Trade Spec</span>
                        <p className="font-bold text-slate-800">{classResult.trade}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-slate-500 font-semibold text-[11px] uppercase tracking-wider">Priority</span>
                        <p className="font-bold text-danger">{classResult.priority}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-slate-500 font-semibold text-[11px] uppercase tracking-wider">Category</span>
                        <p className="font-bold text-slate-800">{classResult.category}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-slate-500 font-semibold text-[11px] uppercase tracking-wider">Safety Risk</span>
                        <p className="font-bold text-slate-800">{classResult.riskLevel}</p>
                      </div>
                    </div>

                    <div className="p-4 bg-white border border-slate-200 rounded text-[13px] leading-relaxed text-slate-700 shadow-sm">
                      <strong className="text-slate-800 block mb-1">Reasoning Analysis:</strong>
                      {classResult.reasoning}
                    </div>
                  </div>
                )}
              </>
            )}

            {activeTab === "summarize" && (
              <>
                {!sumResult && !sumLoading && (
                  <p className="text-[13px] text-slate-400 font-medium italic">Generate a brief to view summary...</p>
                )}
                {sumLoading && (
                  <div className="flex flex-col items-center justify-center h-full text-primary gap-3">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="text-[13px] font-bold">Synthesizing...</span>
                  </div>
                )}
                {sumResult && !sumLoading && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="p-4 bg-white border border-slate-200 rounded text-[14px] leading-relaxed text-slate-700 whitespace-pre-wrap shadow-sm">
                      {sumResult}
                    </div>
                    <button
                      onClick={() => handleCopy(sumResult)}
                      className="w-full flex justify-center items-center gap-2 py-2.5 px-4 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-[13px] font-bold rounded transition cursor-pointer"
                    >
                      <Copy className="h-4 w-4" /> Copy Summary to Clipboard
                    </button>
                  </div>
                )}
              </>
            )}

            {activeTab === "email" && (
              <>
                {!emailResult && !emailLoading && (
                  <p className="text-[13px] text-slate-400 font-medium italic">Draft an email to view output...</p>
                )}
                {emailLoading && (
                  <div className="flex flex-col items-center justify-center h-full text-primary gap-3">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="text-[13px] font-bold">Drafting dispatch...</span>
                  </div>
                )}
                {emailResult && !emailLoading && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden text-[13px]">
                      <div className="p-3 border-b border-slate-100 bg-slate-50/50 space-y-1.5">
                        <div className="flex">
                          <span className="w-16 text-slate-500 font-semibold">To:</span>
                          <span className="font-mono text-slate-800">{emailResult.recipient}</span>
                        </div>
                        <div className="flex">
                          <span className="w-16 text-slate-500 font-semibold">Subject:</span>
                          <span className="font-bold text-slate-800">{emailResult.subject}</span>
                        </div>
                      </div>
                      <div className="p-4 text-slate-700 whitespace-pre-wrap leading-relaxed">
                        {emailResult.body}
                      </div>
                    </div>
                    <button
                      onClick={() => handleCopy(`To: ${emailResult.recipient}\nSubject: ${emailResult.subject}\n\n${emailResult.body}`)}
                      className="w-full flex justify-center items-center gap-2 py-2.5 px-4 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-[13px] font-bold rounded transition cursor-pointer"
                    >
                      <Copy className="h-4 w-4" /> Copy Email to Clipboard
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
