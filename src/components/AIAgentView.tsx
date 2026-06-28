/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
        <span className="h-10 w-10 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-lg shadow-sm">
          ✨
        </span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Intelligence Operations</h1>
          <p className="text-sm text-slate-500 font-medium">
            Test the integrated Gemini AI Copilot APIs for automated sorting, summarization, and vendor dispatches.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-100 gap-1 text-xs font-bold text-slate-500">
        <button
          onClick={() => setActiveTab("classify")}
          className={`px-4 py-2.5 border-b-2 transition cursor-pointer flex items-center gap-2 ${
            activeTab === "classify"
              ? "border-indigo-600 text-indigo-600 bg-indigo-50/10"
              : "border-transparent hover:text-slate-800 hover:border-slate-200"
          }`}
        >
          <Sparkles className="h-4 w-4" /> Classifier Copilot
        </button>

        <button
          onClick={() => setActiveTab("summarize")}
          className={`px-4 py-2.5 border-b-2 transition cursor-pointer flex items-center gap-2 ${
            activeTab === "summarize"
              ? "border-indigo-600 text-indigo-600 bg-indigo-50/10"
              : "border-transparent hover:text-slate-800 hover:border-slate-200"
          }`}
        >
          <FileText className="h-4 w-4" /> Summarizer Briefs
        </button>

        <button
          onClick={() => setActiveTab("email")}
          className={`px-4 py-2.5 border-b-2 transition cursor-pointer flex items-center gap-2 ${
            activeTab === "email"
              ? "border-indigo-600 text-indigo-600 bg-indigo-50/10"
              : "border-transparent hover:text-slate-800 hover:border-slate-200"
          }`}
        >
          <Mail className="h-4 w-4" /> Vendor Email Drafts
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main interactive Column */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 p-6 shadow-xs">
          {activeTab === "classify" && (
            <form onSubmit={handleClassify} className="space-y-4">
              <h2 className="text-base font-bold text-slate-900">Dispatcher Classification Model</h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Test the dispatch model. The AI parses the title and description to extract required trade specialties, urgency tags, and category mappings.
              </p>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Sample Ticket Title *</label>
                <input
                  type="text"
                  required
                  value={classTitle}
                  onChange={(e) => setClassTitle(e.target.value)}
                  placeholder="e.g. Water coming down through the electrical panels in Warehouse 2"
                  className="w-full text-xs py-2 px-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Sample Detailed Symptoms (Optional)</label>
                <textarea
                  rows={3}
                  value={classDesc}
                  onChange={(e) => setClassDesc(e.target.value)}
                  placeholder="e.g. Breaker #4 is humming, we smell burnt copper. Placed emergency buckets."
                  className="w-full text-xs py-2 px-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={classLoading}
                className="inline-flex items-center gap-2 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition disabled:opacity-50 cursor-pointer shadow-2xs"
              >
                {classLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                Run AI Classification Model
              </button>
            </form>
          )}

          {activeTab === "summarize" && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-slate-900">Executive Brief Summarizer</h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Condense heavy technical work reports or log histories into clean executive summaries suitable for facilities review.
              </p>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Select Active Work Order</label>
                <select
                  value={selectedWoId}
                  onChange={(e) => setSelectedWoId(e.target.value)}
                  className="w-full text-xs py-2 px-3 border border-slate-200 rounded-lg bg-white"
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
                onClick={handleSummarize}
                disabled={sumLoading || !selectedWoId}
                className="inline-flex items-center gap-2 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition disabled:opacity-50 cursor-pointer shadow-2xs"
              >
                {sumLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
                Generate AI Executive Summary
              </button>
            </div>
          )}

          {activeTab === "email" && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-slate-900">Automated Vendor Email Dispatcher</h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Draft a formal equipment dispatch email for third-party service providers.
              </p>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Select Target Work Order</label>
                <select
                  value={selectedWoId}
                  onChange={(e) => setSelectedWoId(e.target.value)}
                  className="w-full text-xs py-2 px-3 border border-slate-200 rounded-lg bg-white"
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
                onClick={handleWriteEmail}
                disabled={emailLoading || !selectedWoId}
                className="inline-flex items-center gap-2 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition disabled:opacity-50 cursor-pointer shadow-2xs"
              >
                {emailLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
                Draft Vendor Dispatch Message
              </button>
            </div>
          )}
        </div>

        {/* Right Column: AI Model Responses Display */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">AI Model Output Analysis</h2>

          {activeTab === "classify" && classResult && (
            <div className="bg-white rounded-xl border border-indigo-100 p-5 shadow-xs space-y-4 animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-50 pb-2 text-xs">
                <span className="font-bold text-indigo-700">Recommended Sorting</span>
                <span className="text-emerald-600 font-bold">{Math.round(classResult.confidence * 100)}% Confidence</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs leading-relaxed">
                <div>
                  <span className="text-slate-400 font-medium">Trade Specialty</span>
                  <p className="font-bold text-slate-800">{classResult.trade}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Priority</span>
                  <p className="font-bold text-rose-600">{classResult.priority}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Category</span>
                  <p className="font-bold text-slate-800">{classResult.category}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Risk Assessment</span>
                  <p className="font-bold text-slate-800">{classResult.riskLevel}</p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-xs leading-relaxed text-slate-600">
                <strong className="text-slate-700 block mb-1">Classifier Context Reasoning:</strong>
                {classResult.reasoning}
              </div>
            </div>
          )}

          {activeTab === "summarize" && sumResult && (
            <div className="bg-white rounded-xl border border-indigo-100 p-5 shadow-xs space-y-4 animate-fade-in text-xs">
              <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                <span className="font-bold text-indigo-700">Executive Brief Summary</span>
                <button
                  onClick={() => handleCopy(sumResult)}
                  className="flex items-center gap-1 font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                >
                  <Copy className="h-3.5 w-3.5" /> Copy
                </button>
              </div>

              <p className="text-slate-700 leading-relaxed bg-slate-50 border border-slate-100 p-3.5 rounded-lg">
                {sumResult}
              </p>
            </div>
          )}

          {activeTab === "email" && emailResult && (
            <div className="bg-white rounded-xl border border-indigo-100 p-5 shadow-xs space-y-4 animate-fade-in text-xs">
              <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                <span className="font-bold text-indigo-700">Vendor Email Draft</span>
                <button
                  onClick={() => handleCopy(emailResult.body)}
                  className="flex items-center gap-1 font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                >
                  <Copy className="h-3.5 w-3.5" /> Copy Message
                </button>
              </div>

              <div className="space-y-1 bg-slate-50 border border-slate-100 p-3.5 rounded-lg">
                <p className="text-slate-600 font-medium"><span className="text-slate-400">To:</span> {emailResult.recipient}</p>
                <p className="text-slate-600 font-medium"><span className="text-slate-400">Subject:</span> {emailResult.subject}</p>
                <pre className="font-sans whitespace-pre-wrap text-[11px] leading-relaxed text-slate-700 border-t border-slate-100 pt-2.5 mt-2.5 max-h-56 overflow-y-auto">
                  {emailResult.body}
                </pre>
              </div>
            </div>
          )}

          {/* Fallback info when no active suggestions are loaded */}
          {!classResult && !sumResult && !emailResult && (
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-6 text-center text-xs text-slate-400 space-y-2">
              <HelpCircle className="h-8 w-8 text-slate-300 mx-auto" />
              <p className="font-bold text-slate-500">Awaiting AI Command</p>
              <p className="max-w-xs mx-auto text-[11px]">Select any tool on the left and trigger analysis to generate contextual responses.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
