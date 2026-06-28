/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { authStore } from "./auth/authStore";
import { apiClient } from "./api/client";
import DashboardView from "./components/DashboardView";
import WorkOrdersView from "./components/WorkOrdersView";
import NewWorkOrderView from "./components/NewWorkOrderView";
import WorkOrderDetailsView from "./components/WorkOrderDetailsView";
import MyAssignmentsView from "./components/MyAssignmentsView";
import MojoIntakeView from "./components/MojoIntakeView";
import TechniciansView from "./components/TechniciansView";
import AIAgentView from "./components/AIAgentView";
import ReviewsView from "./components/ReviewsView";
import ReportsView from "./components/ReportsView";
import AdministrationView from "./components/AdministrationView";

import {
  Activity,
  ClipboardList,
  Inbox,
  Users,
  Sparkles,
  CheckSquare,
  BarChart3,
  Settings,
  Shield,
  User as UserIcon,
  ChevronDown,
  Menu,
  X,
  Plus
} from "lucide-react";

export default function App() {
  const [activeView, setActiveView] = useState("dashboard");
  const [subView, setSubView] = useState("");
  const [params, setParams] = useState<any>(null);
  const [user, setUser] = useState(authStore.getCurrentUser());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [tempUrl, setTempUrl] = useState("");
  const [saved, setSaved] = useState(false);

  // Initialize and load user roster from Sheets backend on mount
  useEffect(() => {
    const initAuth = async () => {
      await authStore.initialize();
      setUser(authStore.getCurrentUser());
    };
    initAuth();
  }, []);

  const navigateTo = (view: string, sub?: string, routeParams?: any) => {
    setActiveView(view);
    setSubView(sub || "");
    setParams(routeParams || null);
    setMobileMenuOpen(false);
  };

  // Listen to navigation shortcuts e.g. from Dashboard
  const handleDashboardNavigate = (targetView: string, targetSubView?: string) => {
    navigateTo(targetView, targetSubView);
  };

  // Navigation Sidebar Roster items based on Roles
  const navItems = [
    { id: "dashboard", label: "Operations Dashboard", icon: Activity, roles: ["System Owner", "Supervisor", "Technician"] },
    { id: "work-orders", label: "Work Orders", icon: ClipboardList, roles: ["System Owner", "Supervisor", "Technician"] },
    { id: "my-assignments", label: "My Assignments", icon: CheckSquare, roles: ["Technician"] },
    { id: "mojo-intake", label: "Mojo Dispatch Inbox", icon: Inbox, roles: ["System Owner", "Supervisor"] },
    { id: "technicians", label: "Technician Fleet", icon: Users, roles: ["System Owner", "Supervisor"] },
    { id: "ai-agent", label: "AI Operations", icon: Sparkles, roles: ["System Owner", "Supervisor", "Technician"] },
    { id: "reviews", label: "Closeout Reviews", icon: CheckSquare, roles: ["System Owner", "Supervisor"] },
    { id: "reports", label: "Reports & Analytics", icon: BarChart3, roles: ["System Owner", "Supervisor"] },
    { id: "administration", label: "System Admin", icon: Settings, roles: ["System Owner"] },
  ];

  const visibleNavItems = navItems.filter((item) => item.roles.includes(user.role));
  const appsScriptUrl = apiClient.getAppsScriptUrl();

  if (!appsScriptUrl) {
    const handleConnect = (e: React.FormEvent) => {
      e.preventDefault();
      if (!tempUrl.trim()) return;
      apiClient.updateAppsScriptUrl(tempUrl.trim());
      setSaved(true);
      setTimeout(() => {
        window.location.reload();
      }, 500);
    };

    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-2xl border border-slate-100 flex flex-col items-center">
          <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center text-red-500 mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286Zm0 13.036h.008v.008H12v-.008Z" />
            </svg>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mb-2">Apps Script API URL is not configured.</h2>
          <p className="text-sm text-slate-500 leading-relaxed mb-6">
            Please define the <code className="bg-slate-100 text-rose-600 px-1 py-0.5 rounded text-xs font-mono">VITE_APPS_SCRIPT</code> environment variable in your .env file or enter the Web App deployment URL below to connect the database.
          </p>

          <form onSubmit={handleConnect} className="w-full space-y-4">
            <div className="text-left">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Google Apps Script Web App URL
              </label>
              <input
                type="url"
                required
                value={tempUrl}
                onChange={(e) => setTempUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={saved}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-lg text-xs transition cursor-pointer flex items-center justify-center"
            >
              {saved ? "Connecting..." : "Connect Database"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Header bar */}
      <header className="bg-slate-900 text-white h-16 px-4 md:px-6 flex items-center justify-between sticky top-0 z-50 border-b border-slate-950 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1 hover:bg-slate-800 rounded transition cursor-pointer"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          <div className="flex items-center gap-2.5">
            <span className="h-9 w-9 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center font-black text-sm tracking-wider text-white shadow-sm">
              IMS
            </span>
            <div className="hidden sm:block">
              <span className="font-extrabold text-sm tracking-tight block">Intelligent Maintenance</span>
              <span className="text-[10px] text-slate-400 font-mono tracking-wide uppercase">Sheets & AI Edition</span>
            </div>
          </div>
        </div>

        {/* User Account Info */}
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-semibold">
          <div className="h-7 w-7 rounded-full bg-slate-700 flex items-center justify-center font-bold border border-slate-600 uppercase">
            {user.name.charAt(0)}
          </div>
          <div className="text-left hidden md:block leading-tight">
            <span className="block font-bold">{user.name}</span>
            <span className="block text-[10px] text-indigo-300 font-mono uppercase tracking-wider">{user.role}</span>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 flex relative">
        {/* Desktop Sidebar */}
        <aside className="w-64 bg-slate-900 border-r border-slate-950 text-slate-300 flex-col hidden md:flex sticky top-16 h-[calc(100vh-64px)] overflow-y-auto">
          <nav className="p-4 space-y-1.5 flex-1">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => navigateTo(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                  }`}
                >
                  <Icon className="h-4.5 w-4.5" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Connected state badge in sidebar */}
          <div className="p-4 border-t border-slate-950 bg-slate-950/40 text-[10px] font-mono text-slate-500 space-y-1">
            <p className="flex items-center gap-1.5 font-semibold text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              API Online Mode
            </p>
            <p className="truncate" title={user.email}>Email: {user.email}</p>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 top-16 z-40 flex md:hidden animate-fade-in">
            <div className="fixed inset-0 bg-slate-950/60" onClick={() => setMobileMenuOpen(false)}></div>
            <nav className="relative w-64 bg-slate-900 text-slate-300 p-4 space-y-1.5 flex flex-col h-full overflow-y-auto">
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => navigateTo(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      isActive
                        ? "bg-indigo-600 text-white"
                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                    }`}
                  >
                    <Icon className="h-4.5 w-4.5" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>
        )}

        {/* Primary Page Canvas */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto animate-fade-in">
            {activeView === "dashboard" && <DashboardView onNavigate={handleDashboardNavigate} />}

            {activeView === "work-orders" && (
              <>
                {subView === "all-orders" && <WorkOrdersView onNavigate={navigateTo} />}
                {subView === "overdue" && <WorkOrdersView initialSubView="overdue" onNavigate={navigateTo} />}
                {subView === "new-order" && (
                  <NewWorkOrderView initialMojoTicket={params?.preloadedTicket} onNavigate={navigateTo} />
                )}
                {subView === "wo-details" && <WorkOrderDetailsView params={params} onNavigate={navigateTo} />}
                {!subView && <WorkOrdersView onNavigate={navigateTo} />}
              </>
            )}

            {activeView === "my-assignments" && <MyAssignmentsView onNavigate={navigateTo} />}

            {activeView === "mojo-intake" && <MojoIntakeView onNavigate={navigateTo} />}

            {activeView === "technicians" && <TechniciansView onNavigate={navigateTo} />}

            {activeView === "ai-agent" && <AIAgentView />}

            {activeView === "reviews" && <ReviewsView onNavigate={navigateTo} />}

            {activeView === "reports" && <ReportsView />}

            {activeView === "administration" && <AdministrationView />}
          </div>
        </main>
      </div>
    </div>
  );
}
