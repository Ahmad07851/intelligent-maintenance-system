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
  Menu,
  X,
  Lock,
  Loader2,
  LogOut,
  Search,
  Bell,
  Hexagon
} from "lucide-react";

export default function App() {
  const [activeView, setActiveView] = useState("dashboard");
  const [subView, setSubView] = useState("");
  const [params, setParams] = useState<any>(null);
  const [user, setUser] = useState(authStore.getCurrentUser());
  const [initializing, setInitializing] = useState(authStore.getInitializing());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [tempUrl, setTempUrl] = useState("");
  const [saved, setSaved] = useState(false);

  // Sign-in state
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const clientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || "";

  // Subscribe to auth changes
  useEffect(() => {
    const handleAuthChange = () => {
      setUser(authStore.getCurrentUser());
      setInitializing(authStore.getInitializing());
    };
    const unsubscribe = authStore.subscribe(handleAuthChange);
    
    // Trigger initialization
    authStore.initialize();

    return unsubscribe;
  }, []);

  // Initialize and render Google Sign-In button
  useEffect(() => {
    if (user) return;

    let isMounted = true;
    let renderAttempts = 0;

    const initializeGsi = () => {
      const googleObj = (window as any).google;
      if (googleObj?.accounts?.id) {
        if (!clientId) {
          console.warn("VITE_GOOGLE_CLIENT_ID is not configured.");
          return;
        }

        try {
          googleObj.accounts.id.initialize({
            client_id: clientId,
            callback: async (response: any) => {
              if (!isMounted) return;
              setLoggingIn(true);
              setLoginError("");
              
              const credential = response.credential;
              if (credential) {
                const res = await authStore.login(credential);
                if (res.ok) {
                  setLoginError("");
                  navigateTo("dashboard"); // Automatically navigate to dashboard
                } else {
                  setLoginError(res.message);
                }
              } else {
                setLoginError("Failed to obtain ID token credential from Google.");
              }
              setLoggingIn(false);
            },
            auto_select: false,
          });

          const container = document.getElementById("google-signin-btn");
          if (container) {
            googleObj.accounts.id.renderButton(container, {
              type: "standard",
              theme: "outline",
              size: "large",
              text: "continue_with",
              shape: "rectangular",
              logo_alignment: "center",
              width: 320,
            });
          }
        } catch (e: any) {
          console.error("GSI initialization error:", e);
        }
      }
    };

    const checkAndInit = () => {
      if ((window as any).google?.accounts?.id) {
        initializeGsi();
      } else if (renderAttempts < 30) {
        renderAttempts++;
        setTimeout(checkAndInit, 200);
      }
    };

    checkAndInit();

    return () => {
      isMounted = false;
    };
  }, [user, clientId]);

  const navigateTo = (view: string, sub?: string, routeParams?: any) => {
    setActiveView(view);
    setSubView(sub || "");
    setParams(routeParams || null);
    setMobileMenuOpen(false);
  };

  const handleDashboardNavigate = (targetView: string, targetSubView?: string) => {
    navigateTo(targetView, targetSubView);
  };

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempUrl.trim()) return;
    apiClient.updateAppsScriptUrl(tempUrl.trim());
    setSaved(true);
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const appsScriptUrl = apiClient.getAppsScriptUrl();
  const isAppsScriptRuntime =
    typeof window !== "undefined" &&
    window.location.hostname.includes("script.google.com") &&
    window.location.pathname.includes("/macros/");

  // 1. Connection check
  if (!appsScriptUrl && !isAppsScriptRuntime) {
    return (
      <div className="min-h-screen bg-navy-900 flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="max-w-md w-full bg-white rounded-lg p-8 shadow-[0_16px_40px_rgba(15,23,42,0.16)] border border-slate-200 flex flex-col items-center">
          <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center text-danger mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286Zm0 13.036h.008v.008H12v-.008Z" />
            </svg>
          </div>
          <h2 className="text-[24px] font-bold text-slate-800 mb-2">System Disconnected</h2>
          <p className="text-[14px] text-slate-500 leading-relaxed mb-6">
            Please define the <code className="bg-slate-100 text-danger px-1 py-0.5 rounded text-[12px] font-mono">VITE_APPS_SCRIPT</code> environment variable to connect the backend database.
          </p>

          <form onSubmit={handleConnect} className="w-full space-y-4">
            <div className="text-left">
              <label className="block text-[12px] font-semibold text-slate-500 mb-1">
                Google Apps Script Web App URL
              </label>
              <input
                type="url"
                required
                value={tempUrl}
                onChange={(e) => setTempUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="w-full px-3 py-2 border border-slate-300 rounded text-[14px] focus:outline-hidden focus:ring-2 focus:ring-primary focus:border-primary transition font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={saved}
              className="w-full h-10 bg-primary hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded text-[14px] transition flex items-center justify-center cursor-pointer"
            >
              {saved ? "Connecting..." : "Connect Database"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 2. Initializing check
  if (initializing) {
    return (
      <div className="min-h-screen bg-navy-900 flex flex-col items-center justify-center text-slate-200 font-sans">
        <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
        <p className="text-[14px] font-semibold tracking-wide">Establishing Secure Connection...</p>
      </div>
    );
  }

  // 3. Unauthenticated Login screen
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-navy-900 to-navy-800 flex flex-col items-center justify-center p-6 text-center font-sans">
        <div 
          className="max-w-[400px] w-full bg-white rounded-lg p-8 shadow-[0_16px_40px_rgba(15,23,42,0.16)] flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-300 ease-out"
        >
          <div className="h-14 w-14 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-6 shadow-sm">
             <Hexagon className="h-8 w-8 text-primary fill-indigo-100" />
          </div>
          <h1 className="text-[24px] font-bold text-slate-800 tracking-tight mb-2">Intelligent Maintenance System</h1>
          <p className="text-[14px] text-slate-500 mb-8 font-medium">
            Authorized Personnel Only — CMMS Cloud Portal
          </p>

          <div className="w-full flex flex-col items-center justify-center pb-2">
            {!clientId ? (
              <div className="p-4 bg-red-50 border border-red-100 rounded-lg text-left w-full space-y-2">
                <p className="text-[13px] text-danger font-semibold leading-normal">
                  Google Client ID is Missing
                </p>
                <p className="text-[12px] text-slate-600 leading-normal">
                  Configure <code className="bg-white px-1 py-0.5 rounded text-danger font-mono text-[11px] border border-slate-200">VITE_GOOGLE_CLIENT_ID</code> to enable secure SSO.
                </p>
              </div>
            ) : (
              <div className="space-y-4 w-full flex flex-col items-center">
                {loggingIn ? (
                  <div className="flex items-center justify-center gap-2 h-[44px] text-[13px] font-semibold text-slate-500">
                    <Loader2 className="h-4 w-4 text-primary animate-spin" />
                    Authenticating...
                  </div>
                ) : (
                  <div id="google-signin-btn" className="min-h-[44px] flex items-center justify-center w-full"></div>
                )}
              </div>
            )}

            {loginError && (
              <div className="p-3 bg-red-50 border border-red-100 rounded text-left w-full mt-4">
                <p className="text-[12px] text-danger font-medium leading-normal">{loginError}</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Backend status indicator for login screen */}
        <div className="fixed bottom-6 flex items-center gap-2 text-[12px] text-slate-400 font-medium bg-navy-900/50 px-3 py-1.5 rounded-full border border-white/5 backdrop-blur-md">
           <span className="h-2 w-2 rounded-full bg-success"></span>
           API Gateway Connected
        </div>
      </div>
    );
  }

  // 4. Authenticated main app view
  const navItems = [
    { id: "dashboard", label: "Home", icon: Activity, roles: ["System Owner", "Supervisor", "Technician", "Facilities Manager"] },
    { id: "work-orders", label: "Work Orders", icon: ClipboardList, roles: ["System Owner", "Supervisor", "Technician", "Facilities Manager", "Requester"] },
    { id: "mojo-intake", label: "Mojo Intake", icon: Inbox, roles: ["System Owner", "Supervisor"] },
    { id: "technicians", label: "Technicians", icon: Users, roles: ["System Owner", "Supervisor"] },
    { id: "ai-agent", label: "AI Agent", icon: Sparkles, roles: ["System Owner", "Supervisor", "Technician", "Facilities Manager"] },
    { id: "reviews", label: "Reviews", icon: CheckSquare, roles: ["System Owner", "Supervisor", "Facilities Manager"] },
    { id: "reports", label: "Reports", icon: BarChart3, roles: ["System Owner", "Supervisor", "Facilities Manager"] },
    { id: "administration", label: "Administration", icon: Settings, roles: ["System Owner"] },
  ];
  
  // Technician role has "My Assignments" instead of full Work Orders in their view ideally, but we map it here
  if (user.role === "Technician") {
     const myAssignmentsIndex = navItems.findIndex(i => i.id === "work-orders");
     if(myAssignmentsIndex !== -1) {
       navItems.splice(myAssignmentsIndex + 1, 0, { id: "my-assignments", label: "My Assignments", icon: CheckSquare, roles: ["Technician"] });
     }
  }

  const visibleNavItems = navItems.filter((item) => item.roles.includes(user.role));

  const getCurrentViewLabel = () => {
    const item = navItems.find(n => n.id === activeView);
    return item ? item.label : "System";
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden">
      {/* Primary Sidebar */}
      <aside className="w-[220px] bg-navy-800 flex-shrink-0 flex flex-col border-r border-navy-900 z-50 transition-all duration-300 hidden md:flex">
        {/* Branding */}
        <div className="h-16 flex items-center px-4 gap-3 shrink-0">
           <div className="h-8 w-8 rounded bg-primary flex items-center justify-center shadow-sm shrink-0">
             <Hexagon className="h-5 w-5 text-white fill-indigo-400" />
           </div>
           <div className="flex flex-col overflow-hidden">
             <span className="text-[13px] font-bold text-white leading-tight truncate">Intelligent</span>
             <span className="text-[13px] font-bold text-white leading-tight truncate">Maintenance</span>
           </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => navigateTo(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-[14px] font-medium transition-colors cursor-pointer group ${
                  isActive
                    ? "bg-primary text-white"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                }`}
              >
                <Icon className={`h-[18px] w-[18px] ${isActive ? "text-white" : "text-slate-500 group-hover:text-slate-300"}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-white/5 shrink-0">
           <button onClick={() => authStore.logout()} className="w-full flex items-center gap-3 cursor-pointer group">
              <div className="h-9 w-9 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center shrink-0">
                 <span className="text-[13px] font-bold text-white uppercase">{user.name.charAt(0)}</span>
              </div>
              <div className="flex flex-col text-left overflow-hidden">
                 <span className="text-[13px] font-semibold text-slate-200 truncate">{user.name}</span>
                 <span className="text-[11px] text-slate-500 truncate">{user.role}</span>
              </div>
           </button>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
        
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-40">
           {/* Left: Breadcrumbs & Search */}
           <div className="flex items-center gap-6 flex-1">
             <button
               onClick={() => setMobileMenuOpen(true)}
               className="md:hidden p-1.5 -ml-1.5 text-slate-500 hover:bg-slate-100 rounded cursor-pointer"
             >
               <Menu className="h-5 w-5" />
             </button>
             
             <div className="hidden sm:flex items-center text-[14px] font-medium text-slate-800">
                {getCurrentViewLabel()}
                {subView && (
                  <>
                    <span className="mx-2 text-slate-300">/</span>
                    <span className="text-slate-500 capitalize">{subView.replace("-", " ")}</span>
                  </>
                )}
             </div>

             <div className="hidden md:flex relative max-w-md w-full ml-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search work orders, assets, technicians, locations..." 
                  className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded text-[13px] focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-slate-400"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                   <kbd className="hidden lg:inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white border border-slate-200 rounded">⌘</kbd>
                   <kbd className="hidden lg:inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white border border-slate-200 rounded">K</kbd>
                </div>
             </div>
           </div>

           {/* Right: Actions */}
           <div className="flex items-center gap-4 shrink-0 pl-4">
              {/* API Status Chip */}
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-green-50 border border-green-100 rounded-full">
                <span className="h-1.5 w-1.5 rounded-full bg-success"></span>
                <span className="text-[11px] font-medium text-green-700">Online</span>
              </div>
              
              <button className="relative p-1.5 text-slate-500 hover:bg-slate-100 rounded cursor-pointer transition-colors">
                 <Bell className="h-5 w-5" />
                 <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-danger border border-white"></span>
              </button>
           </div>
        </header>

        {/* View Layout wrapper (handles secondary sidebars internally if needed) */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto relative animate-in fade-in duration-200">
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
        </main>
      </div>
      
      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}></div>
          <div className="relative w-64 h-full bg-navy-800 flex flex-col shadow-xl animate-in slide-in-from-left duration-200">
             <div className="h-16 flex items-center justify-between px-4 border-b border-navy-900 shrink-0">
               <div className="flex items-center gap-2">
                 <div className="h-7 w-7 rounded bg-primary flex items-center justify-center">
                   <Hexagon className="h-4 w-4 text-white fill-indigo-400" />
                 </div>
                 <span className="text-[14px] font-bold text-white">IMS</span>
               </div>
               <button onClick={() => setMobileMenuOpen(false)} className="p-1 text-slate-400 hover:text-white cursor-pointer">
                 <X className="h-5 w-5" />
               </button>
             </div>
             <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
               {visibleNavItems.map((item) => {
                 const Icon = item.icon;
                 const isActive = activeView === item.id;
                 return (
                   <button
                     key={item.id}
                     onClick={() => navigateTo(item.id)}
                     className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-[14px] font-medium transition-colors cursor-pointer ${
                       isActive ? "bg-primary text-white" : "text-slate-400 hover:text-white"
                     }`}
                   >
                     <Icon className="h-5 w-5" />
                     {item.label}
                   </button>
                 );
               })}
             </nav>
             <div className="p-4 border-t border-white/5">
                <button onClick={() => authStore.logout()} className="w-full flex items-center gap-3 text-slate-400 hover:text-white transition-colors cursor-pointer">
                   <LogOut className="h-5 w-5" />
                   <span className="text-[14px] font-medium">Sign Out</span>
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}

