import React, { useEffect, useState } from "react";
import { apiClient } from "../api/client";
import { Technician, WorkOrder, WorkOrderStatus } from "../types";
import { Users, RefreshCw, Clipboard, CheckCircle } from "lucide-react";
import { StatusBadge } from "./WorkOrdersView";

interface TechniciansViewProps {
  onNavigate: (view: string, subView?: string, params?: any) => void;
}

export default function TechniciansView({ onNavigate }: TechniciansViewProps) {
  const [techs, setTechs] = useState<Technician[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const resTech = await apiClient.request("technicians.list");
    if (resTech.ok && resTech.data) {
      setTechs(resTech.data);
    }
    const resWo = await apiClient.request("wo.list");
    if (resWo.ok && resWo.data) {
      setWorkOrders(resWo.data);
    }
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    const resTech = await apiClient.request("technicians.list");
    if (resTech.ok && resTech.data) {
      setTechs(resTech.data);
    }
    const resWo = await apiClient.request("wo.list");
    if (resWo.ok && resWo.data) {
      setWorkOrders(resWo.data);
    }
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const getActiveWosForTech = (email: string) => {
    return workOrders.filter(
      (w) =>
        w.assignedTo.toLowerCase() === email.toLowerCase() &&
        [WorkOrderStatus.Assigned, WorkOrderStatus.InProgress, WorkOrderStatus.OnHold].includes(w.status)
    );
  };

  const getCompletedWosForTech = (email: string) => {
    return workOrders.filter(
      (w) => w.assignedTo.toLowerCase() === email.toLowerCase() && w.status === WorkOrderStatus.Closed
    );
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
          <h1 className="text-[24px] font-bold tracking-tight text-slate-800">Technician Fleet Backlogs</h1>
          <p className="text-[14px] text-slate-500 mt-1">
            Audit work order load allocation, specialty coverage, availability status, and live field assignments.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 text-[14px] font-semibold text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-50 transition shadow-sm cursor-pointer"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin text-slate-400" : ""}`} />
          Refresh Backlogs
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Technicians list grid */}
        <div className="space-y-4">
          <h2 className="text-[12px] font-bold uppercase tracking-wider text-slate-500">Fleet Roster ({techs.length})</h2>

          <div className="space-y-4">
            {techs.map((tech) => {
              const activeJobs = getActiveWosForTech(tech.email);
              const closedJobs = getCompletedWosForTech(tech.email);

              // Workload evaluation
              const loadCount = activeJobs.length;
              let loadLabel = "Low Load";
              let loadColor = "bg-success";
              let loadBg = "bg-green-50 text-green-700 border-green-200";

              if (loadCount >= 3) {
                loadLabel = "Overloaded";
                loadColor = "bg-danger animate-pulse";
                loadBg = "bg-red-50 text-danger border-red-200";
              } else if (loadCount >= 2) {
                loadLabel = "Medium Load";
                loadColor = "bg-warning";
                loadBg = "bg-yellow-50 text-yellow-800 border-yellow-200";
              }

              return (
                <div
                  key={tech.id}
                  className="bg-white rounded-lg border border-slate-200 shadow-[0_4px_10px_rgba(0,0,0,0.02)] p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group hover:shadow-md transition"
                >
                  <div className="flex items-start gap-4">
                    <span className="h-10 w-10 rounded bg-slate-50 text-slate-500 flex items-center justify-center font-bold text-[14px] border border-slate-200 uppercase shrink-0">
                      {tech.name.charAt(0)}
                    </span>
                    <div className="space-y-1">
                      <h3 className="text-[14px] font-bold text-slate-800 leading-snug">{tech.name}</h3>
                      <p className="text-[13px] text-slate-500">{tech.email}</p>
                      <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500 pt-1">
                        <span className="bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                          {tech.specialty} Division
                        </span>
                        <span className={`px-2 py-0.5 rounded-full ${
                          tech.status === "Active" ? "bg-green-50 text-success border border-green-100" : "bg-slate-100 text-slate-500 border border-slate-200"
                        }`}>
                          {tech.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Backlog evaluation */}
                  <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-4 pt-4 sm:pt-0 border-t sm:border-0 border-slate-100">
                    <div className="text-left sm:text-right space-y-0.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold border ${loadBg}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${loadColor}`}></span>
                        {loadLabel} ({loadCount} Active)
                      </span>
                    </div>

                    <div className="flex gap-4 text-[12px] font-semibold text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <Clipboard className="h-4 w-4 text-slate-400" /> {loadCount} Open
                      </span>
                      <span className="flex items-center gap-1.5">
                        <CheckCircle className="h-4 w-4 text-slate-400" /> {closedJobs.length} Closed
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Live Backlog task monitoring */}
        <div className="space-y-4">
          <h2 className="text-[12px] font-bold uppercase tracking-wider text-slate-500">Backlog Dispatch Monitor</h2>

          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-[0_4px_10px_rgba(0,0,0,0.02)] space-y-5 h-full">
            <p className="text-[13px] text-slate-500">Select any technician to audit active work lists.</p>

            <div className="space-y-5 max-h-[600px] overflow-y-auto pr-1">
              {techs.map((tech) => {
                const activeWos = getActiveWosForTech(tech.email);

                return (
                  <div key={tech.id} className="space-y-3 border-b border-slate-100 last:border-0 pb-5 last:pb-0">
                    <p className="text-[13px] font-bold text-slate-800 flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                      {tech.name} Backlog ({activeWos.length})
                    </p>

                    {activeWos.length === 0 ? (
                      <p className="text-[12px] text-slate-400 italic pl-3.5">No active backlog tasks.</p>
                    ) : (
                      <div className="space-y-2 pl-3.5">
                        {activeWos.map((w) => (
                          <div
                            key={w.id}
                            onClick={() => onNavigate("work-orders", "wo-details", { id: w.id })}
                            className="p-3 border border-slate-200 rounded hover:bg-slate-50 hover:border-slate-300 transition flex flex-col gap-2 text-[12px] cursor-pointer"
                          >
                            <span className="font-semibold text-slate-700 truncate">{w.title}</span>
                            <div className="flex gap-2.5 items-center">
                              <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                {w.woNumber}
                              </span>
                              <StatusBadge status={w.status} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
