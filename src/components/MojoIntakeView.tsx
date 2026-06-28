import React, { useEffect, useState } from "react";
import { apiClient } from "../api/client";
import { MojoTicket } from "../types";
import { Inbox, ClipboardList, ArrowRight, Ban, RefreshCw, Layers } from "lucide-react";

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
      <div className="flex items-center justify-center h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  const pendingTickets = tickets.filter((t) => t.status === "Pending");
  const processedTickets = tickets.filter((t) => t.status !== "Pending");

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-[24px] font-bold tracking-tight text-slate-800">Mojo Dispatch Intake</h1>
          <p className="text-[14px] text-slate-500 mt-1">
            Triage raw helpdesk reports, audit duplication, and convert approved tickets to operational Work Orders.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 text-[14px] font-semibold text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-50 transition shadow-sm cursor-pointer"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin text-slate-400" : ""}`} />
          Refresh Inbound Feed
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Active Triage Queue */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[12px] font-bold uppercase tracking-wider text-slate-500">Triage Queue ({pendingTickets.length})</h2>
            {refreshing && <span className="text-[11px] font-semibold text-slate-400">Updating feed...</span>}
          </div>

          {pendingTickets.length === 0 ? (
            <div className="bg-white rounded-lg border border-slate-200 p-12 text-center space-y-4 shadow-[0_4px_10px_rgba(0,0,0,0.02)]">
              <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto border border-slate-100">
                <Inbox className="h-8 w-8 text-slate-300" />
              </div>
              <div>
                <h3 className="text-[16px] font-bold text-slate-800">Triage Queue Empty</h3>
                <p className="text-[14px] text-slate-500 mt-1">No new inbound Helpdesk tickets awaiting processing.</p>
              </div>
            </div>
          ) : (
            pendingTickets.map((ticket) => {
              // Quick duplication warning (heuristic check if a WO already exists with similar terms)
              const isPotentialDuplicate = ticket.title.toLowerCase().includes("leak");

              return (
                <div
                  key={ticket.id}
                  className="bg-white rounded-lg border border-slate-200 shadow-[0_4px_10px_rgba(0,0,0,0.02)] hover:shadow-md p-5 space-y-4 transition"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold tracking-wider uppercase text-slate-500 bg-slate-50 px-2.5 py-0.5 rounded border border-slate-200">
                          {ticket.ticketNumber}
                        </span>
                        {isPotentialDuplicate && (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-danger bg-red-50 px-2.5 py-0.5 rounded border border-red-100 animate-pulse">
                            <Layers className="h-3.5 w-3.5" /> Potential Duplicate Warning
                          </span>
                        )}
                      </div>
                      <h3 className="text-[16px] font-bold text-slate-800 leading-snug">{ticket.title}</h3>
                      <p className="text-[14px] text-slate-600 leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-[13px] text-slate-500">
                    <div className="space-y-0.5">
                      <p className="font-bold text-slate-700">Requested By: {ticket.requestedBy}</p>
                      <p className="text-[12px]">{ticket.location} • {new Date(ticket.createdAt).toLocaleString()}</p>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={() => handleIgnore(ticket.id)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded text-[13px] font-semibold transition cursor-pointer"
                      >
                        <Ban className="h-4 w-4" /> Ignore
                      </button>
                      <button
                        onClick={() => handleConvert(ticket)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-indigo-700 text-white rounded text-[13px] font-bold transition cursor-pointer shadow-sm"
                      >
                        Convert to Work Order <ArrowRight className="h-4 w-4" />
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
          <h2 className="text-[12px] font-bold uppercase tracking-wider text-slate-500">Converted History ({processedTickets.length})</h2>

          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-[0_4px_10px_rgba(0,0,0,0.02)] space-y-4 max-h-[600px] overflow-y-auto">
            {processedTickets.length === 0 ? (
              <div className="py-8 text-center text-[13px] text-slate-400 font-medium">No processed history found.</div>
            ) : (
              processedTickets.map((t) => (
                <div key={t.id} className="text-[13px] space-y-2 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-bold text-slate-500">{t.ticketNumber}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      t.status === "Converted" ? "bg-green-50 text-success border border-green-100" : "bg-slate-50 text-slate-500 border border-slate-200"
                    }`}>
                      {t.status}
                    </span>
                  </div>
                  <p className="font-bold text-slate-800 line-clamp-2 leading-tight">{t.title}</p>
                  {t.convertedWoNumber && (
                    <p className="text-[12px] text-primary font-semibold flex items-center gap-1.5">
                      <ClipboardList className="h-4 w-4" />
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
