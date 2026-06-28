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
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-800"></div>
      </div>
    );
  }

  const stats = [
    {
      title: "Open Work Orders",
      value: data?.openOrdersCount ?? 0,
      icon: ClipboardList,
      color: "text-blue-600 bg-blue-50 border-blue-100",
      view: "work-orders",
      subView: "all-orders"
    },
    {
      title: "Overdue Orders",
      value: data?.overdueCount ?? 0,
      icon: AlertTriangle,
      color: "text-rose-600 bg-rose-50 border-rose-100 animate-pulse",
      view: "work-orders",
      subView: "overdue"
    },
    {
      title: "Pending Supervisor Review",
      value: data?.pendingReviewCount ?? 0,
      icon: Eye,
      color: "text-amber-600 bg-amber-50 border-amber-100",
      view: "reviews",
      subView: ""
    },
    {
      title: "SLA Compliance Rate",
      value: `${100 - (data?.slaBreachRate ?? 0)}%`,
      icon: CheckCircle2,
      color: "text-emerald-600 bg-emerald-50 border-emerald-100",
      view: "reports",
      subView: ""
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Operations Control</h1>
          <p className="text-sm text-slate-500">Real-time summary of Intelligent Maintenance System metrics.</p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition cursor-pointer"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin text-slate-500" : ""}`} />
          {refreshing ? "Refreshing..." : "Refresh Stats"}
        </button>
      </div>

      {/* Grid Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              onClick={() => onNavigate(stat.view, stat.subView)}
              className="bg-white rounded-xl border border-slate-100 p-5 shadow-xs hover:shadow-md transition cursor-pointer flex items-center justify-between group"
            >
              <div className="space-y-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 group-hover:text-slate-600 transition">
                  {stat.title}
                </span>
                <p className="text-3xl font-bold tracking-tight text-slate-900">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-xl border ${stat.color} transition group-hover:scale-105`}>
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
          <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 mb-4">Quick Dispatch</h2>
            <div className="space-y-3">
              <button
                onClick={() => onNavigate("work-orders", "new-order")}
                className="w-full flex items-center justify-between p-3 text-left border border-slate-100 rounded-xl hover:bg-slate-50 transition font-medium text-slate-800 text-sm group cursor-pointer"
              >
                <span className="flex items-center gap-3">
                  <span className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <ClipboardList className="h-4.5 w-4.5" />
                  </span>
                  Raise Work Order
                </span>
                <Play className="h-3.5 w-3.5 text-slate-300 group-hover:translate-x-1 transition" />
              </button>

              <button
                onClick={() => onNavigate("mojo-intake")}
                className="w-full flex items-center justify-between p-3 text-left border border-slate-100 rounded-xl hover:bg-slate-50 transition font-medium text-slate-800 text-sm group cursor-pointer"
              >
                <span className="flex items-center gap-3">
                  <span className="h-8 w-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                    <FileText className="h-4.5 w-4.5" />
                  </span>
                  Mojo Tickets Inbox
                </span>
                <Play className="h-3.5 w-3.5 text-slate-300 group-hover:translate-x-1 transition" />
              </button>

              <button
                onClick={() => onNavigate("ai-agent")}
                className="w-full flex items-center justify-between p-3 text-left border border-indigo-100 rounded-xl bg-gradient-to-r from-indigo-50/20 to-purple-50/20 hover:from-indigo-50/40 hover:to-purple-50/40 transition font-semibold text-indigo-950 text-sm group cursor-pointer"
              >
                <span className="flex items-center gap-3">
                  <span className="h-8 w-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-xs">
                    ✨
                  </span>
                  Run AI Analytics Assistant
                </span>
                <Play className="h-3.5 w-3.5 text-indigo-400 group-hover:translate-x-1 transition" />
              </button>
            </div>
          </div>

          {/* Operational Scope Gauge */}
          <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900">SLA Performance Target</h2>
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
                  <span className="text-3xl font-black text-slate-900">{100 - (data?.slaBreachRate ?? 0)}%</span>
                  <p className="text-[10px] font-medium tracking-wider text-slate-400 uppercase mt-0.5">Compliant</p>
                </div>
              </div>
            </div>
            <div className="flex justify-between border-t border-slate-50 pt-4 text-xs font-semibold text-slate-500">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500"></span> Met Limits</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-500"></span> Breached ({data?.slaBreachRate ?? 0}%)</span>
            </div>
          </div>
        </div>

        {/* Right column: Recent System Audit Activity */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-slate-900">Latest Operations Log</h2>
              <button
                onClick={() => onNavigate("administration", "audit-log")}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
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
                            <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-100" aria-hidden="true"></span>
                          ) : null}
                          <div className="relative flex space-x-3.5">
                            <div>
                              <span className={`h-8.5 w-8.5 rounded-full flex items-center justify-center ring-4 ring-white ${
                                isFirst ? "bg-indigo-50 text-indigo-600" : "bg-slate-50 text-slate-500"
                              }`}>
                                <span className="text-xs font-semibold">
                                  {log.action.charAt(0)}
                                </span>
                              </span>
                            </div>
                            <div className="flex-1 min-w-0 pt-1.5">
                              <p className="text-sm font-semibold text-slate-900">
                                {log.action.replace(/_/g, " ")}
                              </p>
                              <p className="text-xs text-slate-500 mt-1">
                                {log.details}
                              </p>
                              <div className="flex items-center gap-3 mt-1.5 text-[10px] font-mono text-slate-400">
                                <span>Actor: {log.actor}</span>
                                <span>•</span>
                                <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })
                ) : (
                  <div className="text-center py-6 text-slate-400 text-sm">No activity recorded yet.</div>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
