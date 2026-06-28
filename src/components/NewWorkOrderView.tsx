/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { apiClient } from "../api/client";
import { WorkOrderPriority, WorkOrderRiskLevel, Location, Picklist } from "../types";
import { Sparkles, ClipboardCheck, ArrowLeft, Loader2, Save, Send } from "lucide-react";

interface NewWorkOrderProps {
  initialMojoTicket?: any;
  onNavigate: (view: string, subView?: string, params?: any) => void;
}

export default function NewWorkOrderView({ initialMojoTicket, onNavigate }: NewWorkOrderProps) {
  // Form fields state
  const [title, setTitle] = useState(initialMojoTicket?.title || "");
  const [description, setDescription] = useState(initialMojoTicket?.description || "");
  const [requestedBy, setRequestedBy] = useState(initialMojoTicket?.requestedBy || "");
  const [requestedByEmail, setRequestedByEmail] = useState(initialMojoTicket?.requestedByEmail || "");
  const [requestedByPhone, setRequestedByPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [locationId, setLocationId] = useState("");
  const [category, setCategory] = useState("Corrective");
  const [trade, setTrade] = useState("General Maintenance");
  const [priority, setPriority] = useState<WorkOrderPriority>(WorkOrderPriority.Medium);
  const [riskLevel, setRiskLevel] = useState<WorkOrderRiskLevel>(WorkOrderRiskLevel.Low);
  const [requestSource, setRequestSource] = useState(initialMojoTicket ? "Mojo Triage" : "Portal");

  // Auxiliary data list
  const [locations, setLocations] = useState<Location[]>([]);
  const [picklists, setPicklists] = useState<Picklist[]>([]);

  // AI Assistant Suggestions state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<{
    trade: string;
    priority: WorkOrderPriority;
    category: string;
    riskLevel: WorkOrderRiskLevel;
    confidence: number;
    reasoning: string;
  } | null>(null);

  // General loading states
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadConfigData = async () => {
      const resLoc = await apiClient.request("locations.list");
      if (resLoc.ok && resLoc.data) {
        setLocations(resLoc.data);
        if (resLoc.data.length > 0) setLocationId(resLoc.data[0].id);
      }
      const resPk = await apiClient.request("picklists.list");
      if (resPk.ok && resPk.data) {
        setPicklists(resPk.data);
      }
    };
    loadConfigData();
  }, []);

  // AI Classification Trigger
  const handleAiClassification = async () => {
    if (!title && !description) {
      alert("Please provide at least a Title or Description for the AI to analyze.");
      return;
    }
    setAiLoading(true);
    setAiResult(null);

    const res = await apiClient.request("ai.classifyWorkOrder", { title, description });
    if (res.ok && res.data) {
      setAiResult(res.data);
    }
    setAiLoading(false);
  };

  // Apply AI suggestions to form inputs
  const applyAiSuggestions = () => {
    if (!aiResult) return;
    setTrade(aiResult.trade);
    setPriority(aiResult.priority);
    setCategory(aiResult.category);
    setRiskLevel(aiResult.riskLevel);
  };

  // Submit the Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) {
      setError("Title and Description are required.");
      return;
    }

    setSaving(true);
    setError(null);

    const payload = {
      title,
      description,
      requestedBy,
      requestedByEmail,
      requestedByPhone,
      department,
      locationId,
      category,
      trade,
      priority,
      riskLevel,
      requestSource,
      mojoTicketId: initialMojoTicket?.id || undefined,
      sourceModule: initialMojoTicket ? "Mojo" : "Manual",
    };

    const res = await apiClient.request("wo.create", payload);
    if (res.ok && res.data) {
      // Navigate to details page of newly created WO
      onNavigate("work-orders", "wo-details", { id: res.data.id });
    } else {
      setError(res.message || "Failed to create work order.");
    }
    setSaving(false);
  };

  // Filter picklist by category
  const getPicklistValues = (cat: string) => {
    return picklists.filter((p) => p.category === cat);
  };

  return (
    <div className="space-y-6">
      {/* Header Back Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => onNavigate("work-orders", "all-orders")}
          className="p-1.5 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-500 hover:text-slate-800 transition cursor-pointer"
        >
          <ArrowLeft className="h-4.5 w-4.5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {initialMojoTicket ? "Convert Mojo Ticket" : "Raise New Work Order"}
          </h1>
          <p className="text-sm text-slate-500">
            {initialMojoTicket
              ? `Creating work order referencing ticket ${initialMojoTicket.ticketNumber}.`
              : "Raise and schedule a new corrective or preventive maintenance request."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Standard Form inputs */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 bg-white rounded-xl border border-slate-100 p-6 shadow-xs space-y-5">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-lg text-rose-700 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Core Info */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Core Job Details</h2>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Work Request Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Server Room A split AC unit water leaking"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-sm py-2 px-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Detailed Description *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Provide precise details, symptoms, equipment asset tags if known, safety hazards, and impact on facility operations."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-sm py-2 px-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Classification & Parameters */}
          <div className="pt-4 border-t border-slate-50 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Classification & Scheduling</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Trade Specialty</label>
                <select
                  value={trade}
                  onChange={(e) => setTrade(e.target.value)}
                  className="w-full text-sm py-2 px-3 border border-slate-200 rounded-lg bg-white"
                >
                  {getPicklistValues("Trade").map((p) => (
                    <option key={p.id} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full text-sm py-2 px-3 border border-slate-200 rounded-lg bg-white"
                >
                  {getPicklistValues("Category").map((p) => (
                    <option key={p.id} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Urgency Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as WorkOrderPriority)}
                  className="w-full text-sm py-2 px-3 border border-slate-200 rounded-lg bg-white font-semibold text-slate-800"
                >
                  {Object.values(WorkOrderPriority).map((p) => (
                    <option key={p} value={p}>
                      {p} Priority
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Risk Level</label>
                <select
                  value={riskLevel}
                  onChange={(e) => setRiskLevel(e.target.value as WorkOrderRiskLevel)}
                  className="w-full text-sm py-2 px-3 border border-slate-200 rounded-lg bg-white"
                >
                  {Object.values(WorkOrderRiskLevel).map((r) => (
                    <option key={r} value={r}>
                      {r} Risk
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Location details */}
          <div className="pt-4 border-t border-slate-50 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Location Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Location Site</label>
                <select
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  className="w-full text-sm py-2 px-3 border border-slate-200 rounded-lg bg-white"
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} - {loc.building} ({loc.room})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Operational Department</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full text-sm py-2 px-3 border border-slate-200 rounded-lg bg-white"
                >
                  <option value="">Select Department</option>
                  {getPicklistValues("Department").map((p) => (
                    <option key={p.id} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Requester Contact */}
          <div className="pt-4 border-t border-slate-50 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Requester Credentials</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Requester Name</label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={requestedBy}
                  onChange={(e) => setRequestedBy(e.target.value)}
                  className="w-full text-sm py-2 px-3 border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Requester Email</label>
                <input
                  type="email"
                  placeholder="john.doe@ims.com"
                  value={requestedByEmail}
                  onChange={(e) => setRequestedByEmail(e.target.value)}
                  className="w-full text-sm py-2 px-3 border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Phone Hotline</label>
                <input
                  type="text"
                  placeholder="555-019-2831"
                  value={requestedByPhone}
                  onChange={(e) => setRequestedByPhone(e.target.value)}
                  className="w-full text-sm py-2 px-3 border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-5 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => onNavigate("work-orders", "all-orders")}
              className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-lg transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition disabled:opacity-50 shadow-xs cursor-pointer"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {initialMojoTicket ? "Convert and Save" : "Create Work Order"}
            </button>
          </div>
        </form>

        {/* Right Column: AI Co-Pilot Assistant */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-xl p-5 text-white shadow-md border border-indigo-950 flex flex-col justify-between space-y-5">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded-full border border-indigo-500/20">
                ⚡ Intelligent Copilot
              </span>
              <h2 className="text-lg font-bold">AI Dispatch Classifier</h2>
              <p className="text-xs text-indigo-200 leading-relaxed">
                Click analyze below, and the AI will analyze your title and description to automatically recommend the trade, urgency priority, category, and safety risks.
              </p>
            </div>

            <button
              type="button"
              onClick={handleAiClassification}
              disabled={aiLoading}
              className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 bg-white text-indigo-950 hover:bg-indigo-50 active:bg-slate-100 rounded-xl text-xs font-extrabold shadow-sm transition disabled:opacity-50 cursor-pointer"
            >
              {aiLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
              ) : (
                <Sparkles className="h-4.5 w-4.5 text-indigo-600 fill-indigo-100" />
              )}
              {aiLoading ? "Analyzing Fields..." : "Analyze with AI Agent"}
            </button>
          </div>

          {/* AI Suggestions Results */}
          {aiResult && (
            <div className="bg-white rounded-xl border border-indigo-100 p-5 shadow-xs space-y-4 animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">AI Recommendations</span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                  <ClipboardCheck className="h-4 w-4" />
                  {Math.round(aiResult.confidence * 100)}% Confidence
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="space-y-0.5">
                  <span className="text-slate-400 font-semibold">Trade Specialty</span>
                  <p className="font-bold text-slate-800">{aiResult.trade}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-slate-400 font-semibold">Priority</span>
                  <p className="font-bold text-rose-600">{aiResult.priority}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-slate-400 font-semibold">Category</span>
                  <p className="font-bold text-slate-800">{aiResult.category}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-slate-400 font-semibold">Risk Level</span>
                  <p className="font-bold text-slate-800">{aiResult.riskLevel}</p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-xs leading-relaxed text-slate-600">
                <strong className="text-slate-700 block mb-1">Reasoning Analysis:</strong>
                {aiResult.reasoning}
              </div>

              <button
                type="button"
                onClick={applyAiSuggestions}
                className="w-full py-2 px-3 border border-indigo-200 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-50 text-xs font-bold rounded-lg transition text-center cursor-pointer"
              >
                Apply AI Suggestions to Form
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
