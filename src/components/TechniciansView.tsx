/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Technician Fleet backlogs</h1>
          <p className="text-sm text-slate-500">
            Audit work order load allocation, specialty coverage, availability status, and live field assignments.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh backlogs
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Technicians list grid */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Fleet Roster ({techs.length})</h2>

          <div className="space-y-4">
            {techs.map((tech) => {
              const activeJobs = getActiveWosForTech(tech.email);
              const closedJobs = getCompletedWosForTech(tech.email);

              // Workload evaluation
              const loadCount = activeJobs.length;
              let loadLabel = "Low Load";
              let loadColor = "bg-emerald-500";
              let loadBg = "bg-emerald-50 text-emerald-700 border-emerald-100";

              if (loadCount >= 3) {
                loadLabel = "Overloaded";
                loadColor = "bg-rose-500 animate-pulse";
                loadBg = "bg-rose-50 text-rose-700 border-rose-100";
              } else if (loadCount >= 2) {
                loadLabel = "Medium Load";
                loadColor = "bg-amber-500";
                loadBg = "bg-amber-50 text-amber-700 border-amber-100";
              }

              return (
                <div
                  key={tech.id}
                  className="bg-white rounded-xl border border-slate-100 shadow-2xs p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
                >
                  <div className="flex items-start gap-4">
                    <span className="h-10 w-10 rounded-full bg-slate-50 text-slate-500 flex items-center justify-center font-bold text-sm border border-slate-100 uppercase">
                      {tech.name.charAt(0)}
                    </span>
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-slate-900 leading-snug">{tech.name}</h3>
                      <p className="text-xs text-slate-400">{tech.email}</p>
                      <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-500">
                        <span className="bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                          {tech.specialty} Division
                        </span>
                        <span className={`px-2 py-0.5 rounded-full ${
                          tech.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                        }`}>
                          {tech.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Backlog evaluation */}
                  <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-4 pt-4 sm:pt-0 border-t sm:border-0 border-slate-50">
                    <div className="text-left sm:text-right space-y-0.5">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${loadBg}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${loadColor}`}></span>
                        {loadLabel} ({loadCount} Active)
                      </span>
                    </div>

                    <div className="flex gap-4 text-xs font-semibold text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clipboard className="h-3.5 w-3.5 text-slate-400" /> {loadCount} Open
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle className="h-3.5 w-3.5 text-slate-400" /> {closedJobs.length} Closed
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
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Backlog Dispatch Monitor</h2>

          <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-xs space-y-5">
            <p className="text-xs text-slate-500">Select any technician to audit active work lists.</p>

            <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
              {techs.map((tech) => {
                const activeWos = getActiveWosForTech(tech.email);

                return (
                  <div key={tech.id} className="space-y-2 border-b border-slate-50 last:border-0 pb-4 last:pb-0">
                    <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-500"></span>
                      {tech.name} Backlog ({activeWos.length})
                    </p>

                    {activeWos.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic pl-3">No active backlog tasks.</p>
                    ) : (
                      <div className="space-y-1.5 pl-3">
                        {activeWos.map((w) => (
                          <div
                            key={w.id}
                            onClick={() => onNavigate("work-orders", "wo-details", { id: w.id })}
                            className="p-2 border border-slate-50/70 rounded-lg hover:bg-slate-50 hover:border-slate-100 transition flex items-center justify-between text-[11px] cursor-pointer"
                          >
                            <span className="font-semibold text-slate-700 max-w-[200px] truncate">{w.title}</span>
                            <div className="flex gap-2">
                              <span className="font-mono text-[9px] font-bold text-slate-400 bg-slate-50 px-1 py-0.5 rounded">
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
