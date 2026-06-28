/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { apiClient } from "../api/client";
import { MojoTicket } from "../types";
import { FileText, Inbox, ClipboardList, ArrowRight, Ban, RefreshCw, Layers } from "lucide-react";

interface MojoIntakeViewProps {
  onNavigate: (view: string, subView?: string, params?: any) => void;
}

export default function MojoIntakeView({ onNavigate }: MojoIntakeViewProps) {
  const [tickets, setTickets] = useState<MojoTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTickets = async () => {
    setLoading(true);
    const res = await apiClient.request("mojo.list");
    if (res.ok && res.data) {
      setTickets(res.data);
    }
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    const res = await apiClient.request("mojo.list");
    if (res.ok && res.data) {
      setTickets(res.data);
    }
    setRefreshing(false);
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleIgnore = async (id: string) => {
    const confirmIgnore = window.confirm("Are you sure you want to ignore and archive this Mojo Ticket?");
    if (!confirmIgnore) return;
    setRefreshing(true);
    const res = await apiClient.request("mojo.ignore", { id });
    if (res.ok) {
      await fetchTickets();
    }
    setRefreshing(false);
  };

  const handleConvert = (ticket: MojoTicket) => {
    // Navigate to New Work Order form with ticket parameters preloaded
    onNavigate("work-orders", "new-order", { preloadedTicket: ticket });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const pendingTickets = tickets.filter((t) => t.status === "Pending");
  const processedTickets = tickets.filter((t) => t.status !== "Pending");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Mojo Dispatch Intake</h1>
          <p className="text-sm text-slate-500">
            Triage raw helpdesk reports, audit duplication, and convert approved tickets to operational Work Orders.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh Inbound Feed
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Active Triage Queue */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Triage Queue ({pendingTickets.length})</h2>
            {refreshing && <span className="text-[10px] font-semibold text-slate-400">Updating feed...</span>}
          </div>

          {pendingTickets.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-100 p-12 text-center space-y-3">
              <Inbox className="h-10 w-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">Triage Queue Empty</h3>
              <p className="text-xs text-slate-400">No new inbound Helpdesk tickets awaiting processing.</p>
            </div>
          ) : (
            pendingTickets.map((ticket) => {
              // Quick duplication warning (heuristic check if a WO already exists with similar terms)
              const isPotentialDuplicate = ticket.title.toLowerCase().includes("leak");

              return (
                <div
                  key={ticket.id}
                  className="bg-white rounded-xl border border-slate-100 shadow-2xs hover:shadow-xs p-5 space-y-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-black tracking-wider uppercase text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                          {ticket.ticketNumber}
                        </span>
                        {isPotentialDuplicate && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100 animate-pulse">
                            <Layers className="h-3 w-3" /> Potential Duplicate Warning
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 leading-snug">{ticket.title}</h3>
                      <p className="text-xs text-slate-500 leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-50 text-xs text-slate-400">
                    <div className="space-y-0.5">
                      <p className="font-semibold text-slate-700">Requested By: {ticket.requestedBy}</p>
                      <p className="text-[10px]">{ticket.location} • {new Date(ticket.createdAt).toLocaleString()}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleIgnore(ticket.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-semibold transition cursor-pointer"
                      >
                        <Ban className="h-3.5 w-3.5" /> Ignore
                      </button>
                      <button
                        onClick={() => handleConvert(ticket)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-extrabold transition cursor-pointer shadow-2xs"
                      >
                        Convert to Work Order <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Intake Processing Audit (Processed WOs history) */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Converted History ({processedTickets.length})</h2>

          <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-xs space-y-4 max-h-[500px] overflow-y-auto">
            {processedTickets.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No processed history found.</p>
            ) : (
              processedTickets.map((t) => (
                <div key={t.id} className="text-xs space-y-2 pb-3 border-b border-slate-50 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-semibold text-slate-400">{t.ticketNumber}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      t.status === "Converted" ? "bg-teal-50 text-teal-700" : "bg-slate-100 text-slate-500"
                    }`}>
                      {t.status}
                    </span>
                  </div>
                  <p className="font-bold text-slate-800 line-clamp-1">{t.title}</p>
                  {t.convertedWoNumber && (
                    <p className="text-[10px] text-indigo-600 font-semibold flex items-center gap-1">
                      <ClipboardList className="h-3.5 w-3.5" />
                      Converted: {t.convertedWoNumber}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
