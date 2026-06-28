import React, { useState, useEffect } from "react";
import { apiClient } from "../api/client";
import { WorkOrderPriority, WorkOrderRiskLevel, Location, Picklist } from "../types";
import { Sparkles, ClipboardCheck, ArrowLeft, Loader2, Save, Send, List, CheckCircle2, AlertTriangle, Clock } from "lucide-react";

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
           className="flex items-center gap-2.5 px-3 py-2 rounded text-[13px] font-semibold transition-colors w-full cursor-pointer text-slate-800 hover:bg-white/50"
         >
           <List className="h-4 w-4" />
           All Work Orders
         </button>
         
         <button 
           onClick={() => onNavigate("work-orders", "open-orders")}
           className="flex items-center gap-2.5 px-3 py-2 rounded text-[13px] font-semibold transition-colors w-full cursor-pointer text-slate-800 hover:bg-white/50"
         >
           <CheckCircle2 className="h-4 w-4" />
           Open / Active
         </button>

         <button 
           onClick={() => onNavigate("work-orders", "overdue")}
           className="flex items-center gap-2.5 px-3 py-2 rounded text-[13px] font-semibold transition-colors w-full cursor-pointer text-slate-800 hover:bg-white/50"
         >
           <AlertTriangle className="h-4 w-4" />
           SLA Overdue
         </button>

         <button 
           onClick={() => onNavigate("work-orders", "pending-review")}
           className="flex items-center gap-2.5 px-3 py-2 rounded text-[13px] font-semibold transition-colors w-full cursor-pointer text-slate-800 hover:bg-white/50"
         >
           <Clock className="h-4 w-4" />
           Pending Closeout
         </button>
      </div>

      <div className="flex-1 overflow-x-hidden p-6 lg:p-8 space-y-6 max-w-[1240px]">
        {/* Header Back Button */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => onNavigate("work-orders", "all-orders")}
            className="p-2 border border-slate-200 bg-white hover:bg-slate-50 rounded text-slate-500 hover:text-slate-800 transition cursor-pointer shadow-sm"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-[20px] font-bold tracking-tight text-slate-800 leading-snug">
              {initialMojoTicket ? "Convert Mojo Ticket" : "Raise New Work Order"}
            </h1>
            <p className="text-[13px] text-slate-500 mt-0.5 font-medium">
              {initialMojoTicket
                ? `Creating work order referencing ticket ${initialMojoTicket.ticketNumber}.`
                : "Raise and schedule a new corrective or preventive maintenance request."}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Standard Form inputs */}
          <form onSubmit={handleSubmit} className="lg:col-span-2 bg-white rounded-lg border border-slate-200 p-6 shadow-[0_4px_10px_rgba(0,0,0,0.02)] space-y-6">
            {error && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded text-danger text-[13px] font-bold">
                {error}
              </div>
            )}

            {/* Core Info */}
            <div className="space-y-4">
              <h2 className="text-[12px] font-bold uppercase tracking-wider text-slate-500">Core Job Details</h2>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-semibold text-slate-700">Work Request Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Server Room A split AC unit water leaking"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full text-[14px] py-2 px-3 border border-slate-300 rounded focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-semibold text-slate-700">Detailed Description *</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Provide precise details, symptoms, equipment asset tags if known, safety hazards, and impact on facility operations."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full text-[14px] py-2 px-3 border border-slate-300 rounded focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Classification & Parameters */}
            <div className="pt-5 border-t border-slate-200 space-y-4">
              <h2 className="text-[12px] font-bold uppercase tracking-wider text-slate-500">Classification & Scheduling</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-semibold text-slate-700">Trade Specialty</label>
                  <select
                    value={trade}
                    onChange={(e) => setTrade(e.target.value)}
                    className="w-full text-[14px] py-2 px-3 border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  >
                    {getPicklistValues("Trade").map((p) => (
                      <option key={p.id} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-semibold text-slate-700">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full text-[14px] py-2 px-3 border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  >
                    {getPicklistValues("Category").map((p) => (
                      <option key={p.id} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-semibold text-slate-700">Urgency Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as WorkOrderPriority)}
                    className="w-full text-[14px] py-2 px-3 border border-slate-300 rounded bg-white font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  >
                    {Object.values(WorkOrderPriority).map((p) => (
                      <option key={p} value={p}>
                        {p} Priority
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-semibold text-slate-700">Risk Level</label>
                  <select
                    value={riskLevel}
                    onChange={(e) => setRiskLevel(e.target.value as WorkOrderRiskLevel)}
                    className="w-full text-[14px] py-2 px-3 border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
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
            <div className="pt-5 border-t border-slate-200 space-y-4">
              <h2 className="text-[12px] font-bold uppercase tracking-wider text-slate-500">Location Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-semibold text-slate-700">Location Site</label>
                  <select
                    value={locationId}
                    onChange={(e) => setLocationId(e.target.value)}
                    className="w-full text-[14px] py-2 px-3 border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  >
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name} - {loc.building} ({loc.room})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-semibold text-slate-700">Operational Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full text-[14px] py-2 px-3 border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
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
            <div className="pt-5 border-t border-slate-200 space-y-4">
              <h2 className="text-[12px] font-bold uppercase tracking-wider text-slate-500">Requester Credentials</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-semibold text-slate-700">Requester Name</label>
                  <input
                    type="text"
                    placeholder="e.g. John Doe"
                    value={requestedBy}
                    onChange={(e) => setRequestedBy(e.target.value)}
                    className="w-full text-[14px] py-2 px-3 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-semibold text-slate-700">Requester Email</label>
                  <input
                    type="email"
                    placeholder="john.doe@ims.com"
                    value={requestedByEmail}
                    onChange={(e) => setRequestedByEmail(e.target.value)}
                    className="w-full text-[14px] py-2 px-3 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-semibold text-slate-700">Phone Hotline</label>
                  <input
                    type="text"
                    placeholder="555-019-2831"
                    value={requestedByPhone}
                    onChange={(e) => setRequestedByPhone(e.target.value)}
                    className="w-full text-[14px] py-2 px-3 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="pt-6 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => onNavigate("work-orders", "all-orders")}
                className="px-4 py-2 text-[14px] font-semibold text-slate-700 hover:bg-slate-50 border border-slate-300 rounded transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2 text-[14px] font-bold text-white bg-primary hover:bg-indigo-700 rounded transition disabled:opacity-50 shadow-sm cursor-pointer"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {initialMojoTicket ? "Convert and Save" : "Create Work Order"}
              </button>
            </div>
          </form>

          {/* Right Column: AI Co-Pilot Assistant */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-navy-900 to-navy-800 rounded-lg p-5 text-white shadow-lg border border-navy-800 flex flex-col justify-between space-y-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Sparkles className="h-24 w-24" />
              </div>
              <div className="space-y-2 relative z-10">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase bg-indigo-500/20 text-indigo-300 px-2.5 py-0.5 rounded border border-indigo-500/20">
                  <Sparkles className="h-3 w-3" /> Intelligent Copilot
                </span>
                <h2 className="text-[18px] font-bold">AI Dispatch Classifier</h2>
                <p className="text-[13px] text-indigo-200 leading-relaxed">
                  Click analyze below, and the AI will analyze your title and description to automatically recommend the trade, urgency priority, category, and safety risks.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAiClassification}
                disabled={aiLoading}
                className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 bg-white text-navy-900 hover:bg-indigo-50 active:bg-slate-100 rounded text-[13px] font-bold shadow-sm transition disabled:opacity-50 cursor-pointer relative z-10"
              >
                {aiLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                ) : (
                  <Sparkles className="h-4 w-4 text-primary" />
                )}
                {aiLoading ? "Analyzing Fields..." : "Analyze with AI Agent"}
              </button>
            </div>

            {/* AI Suggestions Results */}
            {aiResult && (
              <div className="bg-white rounded-lg border border-indigo-200 p-5 shadow-[0_4px_10px_rgba(0,0,0,0.02)] space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-[12px] font-bold uppercase tracking-wider text-slate-500">AI Recommendations</span>
                  <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-success bg-green-50 px-2 py-1 rounded">
                    <ClipboardCheck className="h-4 w-4" />
                    {Math.round(aiResult.confidence * 100)}% Confidence
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-[13px]">
                  <div className="space-y-1">
                    <span className="text-slate-500 font-semibold text-[11px] uppercase tracking-wider">Trade Specialty</span>
                    <p className="font-bold text-slate-800">{aiResult.trade}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-500 font-semibold text-[11px] uppercase tracking-wider">Priority</span>
                    <p className="font-bold text-danger">{aiResult.priority}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-500 font-semibold text-[11px] uppercase tracking-wider">Category</span>
                    <p className="font-bold text-slate-800">{aiResult.category}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-500 font-semibold text-[11px] uppercase tracking-wider">Risk Level</span>
                    <p className="font-bold text-slate-800">{aiResult.riskLevel}</p>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded text-[13px] leading-relaxed text-slate-700">
                  <strong className="text-slate-800 block mb-1">Reasoning Analysis:</strong>
                  {aiResult.reasoning}
                </div>

                <button
                  type="button"
                  onClick={applyAiSuggestions}
                  className="w-full py-2 px-3 border border-indigo-200 text-primary bg-indigo-50/50 hover:bg-indigo-50 text-[13px] font-bold rounded transition text-center cursor-pointer"
                >
                  Apply AI Suggestions to Form
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
