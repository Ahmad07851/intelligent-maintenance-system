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
      <div className="flex items-center justify-center h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary border-t-transparent"></div>
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
    <div className="space-y-6 max-w-[1440px] mx-auto p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-[24px] font-bold tracking-tight text-slate-800">System Administration</h1>
          <p className="text-[14px] text-slate-500 mt-1">
            Configure backend connection bindings, view authorized user scopes, and inspect active logs.
          </p>
        </div>
      </div>

      {/* Admin tabs */}
      <div className="flex border-b border-slate-200 gap-2 text-[13px] font-bold text-slate-500 overflow-x-auto hide-scrollbar">
        <button
          onClick={() => setActiveSubTab("users")}
          className={`px-5 py-3 border-b-2 transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === "users" ? "border-primary text-primary bg-indigo-50/50" : "border-transparent hover:text-slate-800 hover:bg-slate-50"
          }`}
        >
          <Shield className="h-4 w-4" /> Users & Permissions
        </button>

        <button
          onClick={() => setActiveSubTab("settings")}
          className={`px-5 py-3 border-b-2 transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === "settings" ? "border-primary text-primary bg-indigo-50/50" : "border-transparent hover:text-slate-800 hover:bg-slate-50"
          }`}
        >
          <Settings className="h-4 w-4" /> Sheets Database Setup
        </button>

        <button
          onClick={() => setActiveSubTab("audit")}
          className={`px-5 py-3 border-b-2 transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === "audit" ? "border-primary text-primary bg-indigo-50/50" : "border-transparent hover:text-slate-800 hover:bg-slate-50"
          }`}
        >
          <Activity className="h-4 w-4" /> Historical Operations Audit
        </button>

        <button
          onClick={() => setActiveSubTab("errors")}
          className={`px-5 py-3 border-b-2 transition cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === "errors" ? "border-primary text-primary bg-indigo-50/50" : "border-transparent hover:text-slate-800 hover:bg-slate-50"
          }`}
        >
          <Terminal className="h-4 w-4" /> Technical System Errors
        </button>
      </div>

      {/* Main Container panels */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 md:p-8 shadow-[0_4px_10px_rgba(0,0,0,0.02)] min-h-[500px]">
        {activeSubTab === "users" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 className="text-[16px] font-bold text-slate-800">Security Credentials & Scopes</h2>
              <p className="text-[13px] text-slate-500 leading-relaxed mt-1">
                Active roster directory. Credentials represent active user identities configured in the system.
              </p>
            </div>

            <div className="overflow-x-auto rounded border border-slate-200">
              <table className="w-full text-left text-[13px] border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Full Name</th>
                    <th className="py-3 px-4">Email Account</th>
                    <th className="py-3 px-4">Role Authority</th>
                    <th className="py-3 px-4">Trade Specialist</th>
                    <th className="py-3 px-4">System Permissions Granted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {users.map((usr) => (
                    <tr key={usr.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-800">{usr.name}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-500 text-[12px]">{usr.email}</td>
                      <td className="py-3.5 px-4">
                        <span className="bg-indigo-50 text-primary border border-indigo-100 px-2.5 py-0.5 rounded font-bold text-[11px] tracking-wider uppercase">
                          {usr.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">{usr.tradeSpecialty || "None (Administrative)"}</td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1.5 max-w-sm">
                          {(usr.permissions || []).map((p) => (
                            <span key={p} className="bg-slate-100 border border-slate-200 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase">
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
          <div className="max-w-3xl space-y-8 animate-in fade-in duration-200">
            <div className="space-y-1.5">
              <h2 className="text-[16px] font-bold text-slate-800">Live Sheets API Binding</h2>
              <p className="text-[13px] text-slate-500 leading-relaxed">
                Provide your deployed Google Apps Script Web App URL below to connect the React frontend with your live spreadsheet database.
              </p>
            </div>

            <div className="p-5 rounded-lg border bg-slate-50 border-slate-200 flex items-start gap-4">
              {connectionStatus === "Connected" && (
                <>
                  <CheckCircle className="h-6 w-6 text-success flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-success text-[14px]">Status: Database Connected</h3>
                    <p className="text-slate-600 font-medium text-[13px] mt-1">{connectionMessage}</p>
                  </div>
                </>
              )}
              {connectionStatus === "Disconnected" && (
                <>
                  <XCircle className="h-6 w-6 text-danger flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-danger text-[14px]">Status: Disconnected</h3>
                    <p className="text-slate-600 font-medium text-[13px] mt-1">{connectionMessage}</p>
                  </div>
                </>
              )}
              {connectionStatus === "Checking" && (
                <>
                  <Loader2 className="h-6 w-6 text-primary animate-spin flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-primary text-[14px]">Status: Verifying Connection...</h3>
                    <p className="text-slate-600 font-medium text-[13px] mt-1">Contacting the Google Apps Script Web App endpoint.</p>
                  </div>
                </>
              )}
            </div>

            <div className="space-y-2">
              <label className="font-bold text-[13px] text-slate-700 block">Google Apps Script Web App Deployment URL</label>
              <input
                type="text"
                value={appsScriptUrl}
                onChange={(e) => setAppsScriptUrl(e.target.value)}
                placeholder="e.g. https://script.google.com/macros/s/AKfycb.../exec"
                className="w-full text-[13px] py-3 px-4 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-white font-mono shadow-sm"
              />
            </div>

            <button
              onClick={handleSaveSettings}
              disabled={savedSettings}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-indigo-700 text-white rounded text-[14px] font-bold transition cursor-pointer shadow-sm"
            >
              {savedSettings ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save & Test Connection
            </button>
          </div>
        )}

        {activeSubTab === "audit" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-[16px] font-bold text-slate-800">Historical Operations Logs</h2>
                <p className="text-[13px] text-slate-500 leading-relaxed mt-1">
                  Chronological log tracing security sessions, status dispatches, SLA compliance, and database mutations.
                </p>
              </div>

              <input
                type="text"
                placeholder="Search audit trail..."
                value={searchAudit}
                onChange={(e) => setSearchAudit(e.target.value)}
                className="w-full sm:w-64 py-2 px-3 text-[13px] border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-white shadow-sm"
              />
            </div>

            <div className="overflow-x-auto rounded border border-slate-200">
              <table className="w-full text-left text-[13px] border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">ID</th>
                    <th className="py-3 px-4">Date & Timestamp</th>
                    <th className="py-3 px-4">Activity Action</th>
                    <th className="py-3 px-4">Actor Email</th>
                    <th className="py-3 px-4">Operational Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                  {filteredAudits.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-16 text-slate-400 font-medium">No historical audits recorded.</td>
                    </tr>
                  ) : (
                    filteredAudits.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/50 transition align-top">
                        <td className="py-3 px-4 font-mono text-slate-400 text-[12px]">{log.id.slice(0, 8)}</td>
                        <td className="py-3 px-4 whitespace-nowrap text-slate-500 text-[12px]">{new Date(log.timestamp).toLocaleString()}</td>
                        <td className="py-3 px-4">
                          <span className="bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono text-[10px] tracking-wider uppercase font-bold">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600 text-[12px]">{log.actor}</td>
                        <td className="py-3 px-4 text-slate-800 leading-relaxed max-w-lg">{log.details}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeSubTab === "errors" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="border-b border-slate-200 pb-4">
              <h2 className="text-[16px] font-bold text-slate-800">Technical API Connection Errors</h2>
              <p className="text-[13px] text-slate-500 leading-relaxed mt-1">
                Diagnostic system log tracing connection latency, spreadsheet exceptions, or API configuration failures.
              </p>
            </div>

            <div className="overflow-x-auto rounded border border-slate-200">
              <table className="w-full text-left text-[13px] border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Log Timestamp</th>
                    <th className="py-3 px-4">Diagnostic Level</th>
                    <th className="py-3 px-4">API Endpoint Context</th>
                    <th className="py-3 px-4">Failure Exception Message</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600 font-mono text-[12px]">
                  {systemLogs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-16 text-slate-400 font-medium font-sans">Primacy check green. No system errors encountered.</td>
                    </tr>
                  ) : (
                    systemLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/50 transition align-top">
                        <td className="py-3 px-4 text-slate-500">{new Date(log.timestamp).toLocaleString()}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold border ${
                            log.level === "ERROR" ? "bg-red-50 text-danger border-red-200" : "bg-yellow-50 text-warning border-yellow-200"
                          }`}>
                            {log.level}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-700 font-bold">{log.endpoint}</td>
                        <td className="py-3 px-4 text-danger leading-relaxed font-sans font-medium max-w-lg">{log.message}</td>
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
