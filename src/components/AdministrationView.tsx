/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { apiClient } from "../api/client";
import { User, AuditLog, SystemLog } from "../types";
import { Shield, Settings, Activity, Terminal, Save, CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function AdministrationView() {
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);

  const [activeSubTab, setActiveSubTab] = useState<"users" | "settings" | "audit" | "errors">("users");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Connection settings state
  const [appsScriptUrl, setAppsScriptUrl] = useState("");
  const [savedSettings, setSavedSettings] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"Checking" | "Connected" | "Disconnected">("Checking");
  const [connectionMessage, setConnectionMessage] = useState("");

  // Audit search terms
  const [searchAudit, setSearchAudit] = useState("");

  const checkConnection = async (url: string) => {
    if (!url) {
      setConnectionStatus("Disconnected");
      setConnectionMessage("Apps Script URL is empty. Please configure the connection URL.");
      return;
    }
    setConnectionStatus("Checking");
    try {
      const res = await apiClient.request("users.list");
      if (res.ok) {
        setConnectionStatus("Connected");
        setConnectionMessage("Successfully connected to live Sheets database.");
      } else {
        setConnectionStatus("Disconnected");
        setConnectionMessage(res.message || "Failed to establish a valid API handshake.");
      }
    } catch (e: any) {
      setConnectionStatus("Disconnected");
      setConnectionMessage(e.message || "Network exception during connection verification.");
    }
  };

  const loadData = async () => {
    setLoading(true);
    
    // Retrieve active connection url from localStorage
    let savedUrl = "";
    try {
      savedUrl = localStorage.getItem("ims_apps_script_url") || "";
    } catch (e) {
      console.warn("localStorage is blocked or unavailable:", e);
    }
    setAppsScriptUrl(savedUrl);

    const resUsers = await apiClient.request("users.list");
    if (resUsers.ok && resUsers.data) setUsers(resUsers.data);

    const resAudit = await apiClient.request("auditLog.list");
    if (resAudit.ok && resAudit.data) setAuditLogs(resAudit.data);

    const resSys = await apiClient.request("systemLog.list");
    if (resSys.ok && resSys.data) setSystemLogs(resSys.data);

    await checkConnection(savedUrl);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveSettings = () => {
    setSavedSettings(true);
    try {
      localStorage.setItem("ims_apps_script_url", appsScriptUrl.trim());
    } catch (e) {
      console.warn("localStorage is blocked or unavailable:", e);
    }
    apiClient.updateAppsScriptUrl(appsScriptUrl.trim());
    setTimeout(async () => {
      setSavedSettings(false);
      alert("Apps Script Backend Connection URL updated successfully!");
      await checkConnection(appsScriptUrl.trim());
      // Reload lists with the new connection
      const resUsers = await apiClient.request("users.list");
      if (resUsers.ok && resUsers.data) setUsers(resUsers.data);
      const resAudit = await apiClient.request("auditLog.list");
      if (resAudit.ok && resAudit.data) setAuditLogs(resAudit.data);
      const resSys = await apiClient.request("systemLog.list");
      if (resSys.ok && resSys.data) setSystemLogs(resSys.data);
    }, 800);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Filter audit logs
  const filteredAudits = auditLogs.filter(
    (log) =>
      log.action.toLowerCase().includes(searchAudit.toLowerCase()) ||
      log.actor.toLowerCase().includes(searchAudit.toLowerCase()) ||
      log.details.toLowerCase().includes(searchAudit.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">System Administration</h1>
          <p className="text-sm text-slate-500">
            Configure backend connection bindings, view authorized user scopes, and inspect active logs.
          </p>
        </div>
      </div>

      {/* Admin tabs */}
      <div className="flex border-b border-slate-100 gap-1 text-xs font-bold text-slate-500">
        <button
          onClick={() => setActiveSubTab("users")}
          className={`px-4 py-2.5 border-b-2 transition cursor-pointer flex items-center gap-2 ${
            activeSubTab === "users" ? "border-indigo-600 text-indigo-600 bg-indigo-50/10" : "border-transparent hover:text-slate-800"
          }`}
        >
          <Shield className="h-4 w-4" /> Users & Permissions
        </button>

        <button
          onClick={() => setActiveSubTab("settings")}
          className={`px-4 py-2.5 border-b-2 transition cursor-pointer flex items-center gap-2 ${
            activeSubTab === "settings" ? "border-indigo-600 text-indigo-600 bg-indigo-50/10" : "border-transparent hover:text-slate-800"
          }`}
        >
          <Settings className="h-4 w-4" /> Sheets Database Setup
        </button>

        <button
          onClick={() => setActiveSubTab("audit")}
          className={`px-4 py-2.5 border-b-2 transition cursor-pointer flex items-center gap-2 ${
            activeSubTab === "audit" ? "border-indigo-600 text-indigo-600 bg-indigo-50/10" : "border-transparent hover:text-slate-800"
          }`}
        >
          <Activity className="h-4 w-4" /> Historical Operations Audit
        </button>

        <button
          onClick={() => setActiveSubTab("errors")}
          className={`px-4 py-2.5 border-b-2 transition cursor-pointer flex items-center gap-2 ${
            activeSubTab === "errors" ? "border-indigo-600 text-indigo-600 bg-indigo-50/10" : "border-transparent hover:text-slate-800"
          }`}
        >
          <Terminal className="h-4 w-4" /> Technical System Errors
        </button>
      </div>

      {/* Main Container panels */}
      <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-xs min-h-[400px]">
        {activeSubTab === "users" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">Security Credentials & Scopes</h2>
              <p className="text-xs text-slate-500 leading-relaxed mt-1">
                Active roster directory. Credentials represent active user identities configured in the system.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-2.5 px-3">Full Name</th>
                    <th className="py-2.5 px-3">Email Account</th>
                    <th className="py-2.5 px-3">Role Authority</th>
                    <th className="py-2.5 px-3">Trade Specialist</th>
                    <th className="py-2.5 px-3">System Permissions Granted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-slate-700 font-medium">
                  {users.map((usr) => (
                    <tr key={usr.id} className="hover:bg-slate-50/30 transition">
                      <td className="py-3 px-3 font-semibold text-slate-900">{usr.name}</td>
                      <td className="py-3 px-3 font-mono text-slate-500">{usr.email}</td>
                      <td className="py-3 px-3">
                        <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-bold text-[10px]">
                          {usr.role}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-500">{usr.tradeSpecialty || "None (Administrative)"}</td>
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1 max-w-sm">
                          {(usr.permissions || []).map((p) => (
                            <span key={p} className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[9px] font-semibold">
                              {p.replace("PERM_", "")}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeSubTab === "settings" && (
          <div className="max-w-2xl space-y-6 text-xs leading-relaxed">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-slate-900">Live Sheets API Binding</h2>
              <p className="text-slate-500 leading-relaxed">
                Provide your deployed Google Apps Script Web App URL below to connect the React frontend with your live spreadsheet database.
              </p>
            </div>

            <div className="p-4 rounded-xl border bg-slate-50 border-slate-100 flex items-start gap-3">
              {connectionStatus === "Connected" && (
                <>
                  <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-emerald-800 text-sm">Status: Database Connected</h3>
                    <p className="text-slate-500 font-medium mt-1">{connectionMessage}</p>
                  </div>
                </>
              )}
              {connectionStatus === "Disconnected" && (
                <>
                  <XCircle className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-rose-800 text-sm">Status: Disconnected</h3>
                    <p className="text-slate-500 font-medium mt-1">{connectionMessage}</p>
                  </div>
                </>
              )}
              {connectionStatus === "Checking" && (
                <>
                  <Loader2 className="h-5 w-5 text-indigo-600 animate-spin flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-indigo-800 text-sm">Status: Verifying Connection...</h3>
                    <p className="text-slate-500 font-medium mt-1">Contacting the Google Apps Script Web App endpoint.</p>
                  </div>
                </>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 block">Google Apps Script Web App Deployment URL</label>
              <input
                type="text"
                value={appsScriptUrl}
                onChange={(e) => setAppsScriptUrl(e.target.value)}
                placeholder="e.g. https://script.google.com/macros/s/AKfycb.../exec"
                className="w-full text-xs py-2.5 px-3.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white font-mono"
              />
            </div>

            <button
              onClick={handleSaveSettings}
              disabled={savedSettings}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition cursor-pointer shadow-2xs"
            >
              {savedSettings ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save & Test Connection
            </button>
          </div>
        )}

        {activeSubTab === "audit" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-50 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">Historical Operations Logs</h2>
                <p className="text-xs text-slate-500 leading-relaxed mt-1">
                  Chronological log tracing security sessions, status dispatches, SLA compliance, and database mutations.
                </p>
              </div>

              <input
                type="text"
                placeholder="Search audit trail..."
                value={searchAudit}
                onChange={(e) => setSearchAudit(e.target.value)}
                className="py-1.5 px-3 text-xs border border-slate-200 rounded-lg bg-white"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px] border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-2 px-3">ID</th>
                    <th className="py-2 px-3">Date & Timestamp</th>
                    <th className="py-2 px-3">Activity Action</th>
                    <th className="py-2 px-3">Actor Email</th>
                    <th className="py-2 px-3">Operational Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-slate-600 font-medium">
                  {filteredAudits.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-slate-400 italic">No historical audits recorded.</td>
                    </tr>
                  ) : (
                    filteredAudits.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/10 transition align-top">
                        <td className="py-2.5 px-3 font-mono text-slate-400">{log.id.slice(0, 8)}</td>
                        <td className="py-2.5 px-3 whitespace-nowrap text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                        <td className="py-2.5 px-3">
                          <span className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded font-mono text-[10px] uppercase font-bold">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-700">{log.actor}</td>
                        <td className="py-2.5 px-3 text-slate-800 leading-normal max-w-sm">{log.details}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeSubTab === "errors" && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Technical API Connection Errors</h2>
              <p className="text-xs text-slate-500 leading-relaxed mt-1">
                Diagnostic system log tracing connection latency, spreadsheet exceptions, or API configuration failures.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px] border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-2 px-3">Log Timestamp</th>
                    <th className="py-2 px-3">Diagnostic Level</th>
                    <th className="py-2 px-3">API Endpoint Context</th>
                    <th className="py-2 px-3">Failure Exception Message</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-slate-600 font-mono">
                  {systemLogs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-12 text-slate-400 italic font-sans">Primacy check green. No system errors encountered.</td>
                    </tr>
                  ) : (
                    systemLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/10 transition align-top">
                        <td className="py-2.5 px-3 text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            log.level === "ERROR" ? "bg-rose-50 text-rose-700 border border-rose-100" : "bg-amber-50 text-amber-700"
                          }`}>
                            {log.level}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-700">{log.endpoint}</td>
                        <td className="py-2.5 px-3 text-rose-600 leading-relaxed font-sans">{log.message}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
