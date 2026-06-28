/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { apiClient } from "../api/client";
import { AuditLog } from "../types";
import { Play, ClipboardList, AlertTriangle, Eye, CheckCircle2, RefreshCw, FileText } from "lucide-react";

interface DashboardData {
  openOrdersCount: number;
  overdueCount: number;
  pendingReviewCount: number;
  completedThisWeekCount: number;
  slaBreachRate: number;
  recentActivity: AuditLog[];
}

interface DashboardViewProps {
  onNavigate: (view: string, subView?: string, params?: any) => void;
}

export default function DashboardView({ onNavigate }: DashboardViewProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = async () => {
    setLoading(true);
    const res = await apiClient.request("dashboard.get");
    if (res.ok && res.data) {
      setData(res.data);
    }
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    const res = await apiClient.request("dashboard.get");
    if (res.ok && res.data) {
      setData(res.data);
    }
    setRefreshing(false);
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  const stats = [
    {
      title: "Open Work Orders",
      value: data?.openOrdersCount ?? 0,
      icon: ClipboardList,
      color: "text-indigo-600 bg-indigo-50 border-indigo-100",
      view: "work-orders",
      subView: "open-orders"
    },
    {
      title: "Overdue Orders",
      value: data?.overdueCount ?? 0,
      icon: AlertTriangle,
      color: "text-danger bg-red-50 border-red-100 animate-pulse",
      view: "work-orders",
      subView: "overdue"
    },
    {
      title: "Pending Supervisor Review",
      value: data?.pendingReviewCount ?? 0,
      icon: Eye,
      color: "text-warning bg-yellow-50 border-yellow-100",
      view: "work-orders",
      subView: "pending-review"
    },
    {
      title: "SLA Compliance Rate",
      value: `${100 - (data?.slaBreachRate ?? 0)}%`,
      icon: CheckCircle2,
      color: "text-success bg-green-50 border-green-100",
      view: "reports",
      subView: ""
    }
  ];

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-bold tracking-tight text-slate-800">Operations Control</h1>
          <p className="text-[14px] text-slate-500 mt-1">Real-time summary of Intelligent Maintenance System metrics.</p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 text-[14px] font-semibold text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-50 transition shadow-sm cursor-pointer"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin text-slate-400" : ""}`} />
          {refreshing ? "Refreshing..." : "Refresh Stats"}
        </button>
      </div>

      {/* Grid Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              onClick={() => onNavigate(stat.view, stat.subView)}
              className="bg-white rounded-lg border border-slate-200 p-5 shadow-[0_4px_10px_rgba(0,0,0,0.02)] hover:shadow-md transition cursor-pointer flex items-center justify-between group"
            >
              <div className="space-y-1">
                <span className="text-[12px] font-bold uppercase tracking-wider text-slate-500 group-hover:text-slate-600 transition">
                  {stat.title}
                </span>
                <p className="text-[32px] font-bold tracking-tight text-slate-800 leading-tight">{stat.value}</p>
              </div>
              <div className={`p-3 rounded border ${stat.color} transition group-hover:scale-105`}>
                <Icon className="h-6 w-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Quick Actions & Operational Summary */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-[0_4px_10px_rgba(0,0,0,0.02)]">
            <h2 className="text-[18px] font-semibold text-slate-800 mb-4">Quick Dispatch</h2>
            <div className="space-y-3">
              <button
                onClick={() => onNavigate("work-orders", "new-order")}
                className="w-full flex items-center justify-between p-3 text-left border border-slate-200 rounded hover:bg-slate-50 transition font-semibold text-slate-800 text-[14px] group cursor-pointer"
              >
                <span className="flex items-center gap-3">
                  <span className="h-8 w-8 rounded bg-indigo-50 text-primary flex items-center justify-center">
                    <ClipboardList className="h-4 w-4" />
                  </span>
                  Raise Work Order
                </span>
                <Play className="h-3.5 w-3.5 text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition" />
              </button>

              <button
                onClick={() => onNavigate("mojo-intake")}
                className="w-full flex items-center justify-between p-3 text-left border border-slate-200 rounded hover:bg-slate-50 transition font-semibold text-slate-800 text-[14px] group cursor-pointer"
              >
                <span className="flex items-center gap-3">
                  <span className="h-8 w-8 rounded bg-purple-50 text-purple-600 flex items-center justify-center">
                    <FileText className="h-4 w-4" />
                  </span>
                  Mojo Tickets Inbox
                </span>
                <Play className="h-3.5 w-3.5 text-slate-300 group-hover:text-purple-600 group-hover:translate-x-1 transition" />
              </button>

              <button
                onClick={() => onNavigate("ai-agent")}
                className="w-full flex items-center justify-between p-3 text-left border border-indigo-200 rounded bg-gradient-to-r from-indigo-50/50 to-purple-50/50 hover:from-indigo-50 hover:to-purple-50 transition font-semibold text-indigo-950 text-[14px] group cursor-pointer shadow-[0_2px_4px_rgba(0,0,0,0.02)]"
              >
                <span className="flex items-center gap-3">
                  <span className="h-8 w-8 rounded bg-gradient-to-tr from-primary to-purple-600 text-white flex items-center justify-center shadow-sm">
                    ✨
                  </span>
                  Run AI Analytics Assistant
                </span>
                <Play className="h-3.5 w-3.5 text-indigo-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition" />
              </button>
            </div>
          </div>

          {/* Operational Scope Gauge */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-[0_4px_10px_rgba(0,0,0,0.02)] space-y-4">
            <h2 className="text-[18px] font-semibold text-slate-800">SLA Performance Target</h2>
            <div className="flex flex-col items-center py-4">
              <div className="relative flex items-center justify-center h-32 w-32">
                <svg className="absolute transform -rotate-90 w-full h-full" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" stroke="#f1f5f9" strokeWidth="8" fill="transparent" />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#10b981"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={251.2}
                    strokeDashoffset={251.2 - (251.2 * (100 - (data?.slaBreachRate ?? 0))) / 100}
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="text-center">
                  <span className="text-[28px] font-bold text-slate-800">{100 - (data?.slaBreachRate ?? 0)}%</span>
                  <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase mt-0.5">Compliant</p>
                </div>
              </div>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-4 text-[12px] font-semibold text-slate-500">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-success"></span> Met Limits</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-danger"></span> Breached ({data?.slaBreachRate ?? 0}%)</span>
            </div>
          </div>
        </div>

        {/* Right column: Recent System Audit Activity */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-[0_4px_10px_rgba(0,0,0,0.02)] h-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[18px] font-semibold text-slate-800">Latest Operations Log</h2>
              <button
                onClick={() => onNavigate("administration", "audit-log")}
                className="text-[13px] font-semibold text-primary hover:text-indigo-800 transition cursor-pointer"
              >
                View Full Audit Log
              </button>
            </div>

            <div className="flow-root">
              <ul className="-mb-8">
                {data?.recentActivity && data.recentActivity.length > 0 ? (
                  data.recentActivity.map((log, index) => {
                    const isFirst = index === 0;
                    return (
                      <li key={log.id}>
                        <div className="relative pb-8">
                          {index !== data.recentActivity.length - 1 ? (
                            <span className="absolute top-4 left-4 -ml-px h-full w-px bg-slate-200" aria-hidden="true"></span>
                          ) : null}
                          <div className="relative flex space-x-4">
                            <div>
                              <span className={`h-8 w-8 rounded flex items-center justify-center ring-4 ring-white ${
                                isFirst ? "bg-indigo-50 text-primary border border-indigo-100" : "bg-slate-50 text-slate-500 border border-slate-200"
                              }`}>
                                <span className="text-[13px] font-bold">
                                  {log.action.charAt(0)}
                                </span>
                              </span>
                            </div>
                            <div className="flex-1 min-w-0 pt-1">
                              <p className="text-[14px] font-semibold text-slate-800">
                                {log.action.replace(/_/g, " ")}
                              </p>
                              <p className="text-[13px] text-slate-500 mt-1">
                                {log.details}
                              </p>
                              <div className="flex items-center gap-2.5 mt-2 text-[11px] font-mono text-slate-400 font-medium">
                                <span>Actor: {log.actor}</span>
                                <span className="text-slate-300">•</span>
                                <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })
                ) : (
                  <div className="text-center py-6 text-slate-400 text-[14px]">No activity recorded yet.</div>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
