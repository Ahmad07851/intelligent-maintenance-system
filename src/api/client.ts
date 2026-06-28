/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Global variable for current logged in user details
let currentUserEmail = "ahmadarafat51@gmail.com"; // Matches Ahmad Arafat

export function getCurrentUserEmail(): string {
  return currentUserEmail;
}

export function setCurrentUserEmail(email: string): void {
  currentUserEmail = email;
}

// Reset Local Database (Stub to prevent breaking imports)
export function resetLocalDatabase(): void {
  try {
    localStorage.removeItem("ims_apps_script_url");
  } catch (e) {
    console.warn("localStorage is blocked or unavailable:", e);
  }
}

// API response interface
export interface ApiResponse<T = any> {
  ok: boolean;
  data: T | null;
  message: string;
  errors?: Array<{ code: string; field?: string; message: string }>;
  meta?: {
    requestId: string;
    timestamp: string;
    actor: string;
  };
}

class ApiClient {
  public getAppsScriptUrl(): string {
    // Check local storage setting first, then fallback to environment variable
    try {
      return localStorage.getItem("ims_apps_script_url") || (import.meta as any).env?.VITE_APPS_SCRIPT || "";
    } catch (e) {
      console.warn("localStorage is blocked or unavailable:", e);
      return (import.meta as any).env?.VITE_APPS_SCRIPT || "";
    }
  }

  public updateAppsScriptUrl(url: string): void {
    try {
      localStorage.setItem("ims_apps_script_url", url);
    } catch (e) {
      console.warn("localStorage is blocked or unavailable:", e);
    }
  }

  public getIdToken(): string {
    return (import.meta as any).env?.VITE_USER_EMAIL || "ahmadarafat51@gmail.com";
  }

  // Unified request interface
  public async request<T = any>(action: string, payload: any = {}): Promise<ApiResponse<T>> {
    const requestId = `REQ-${new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const appsScriptUrl = this.getAppsScriptUrl();

    if (!appsScriptUrl) {
      console.error("Apps Script API URL is not configured.");
      return {
        ok: false,
        data: null,
        message: "Apps Script API URL is not configured.",
        meta: {
          requestId,
          timestamp: new Date().toISOString(),
          actor: currentUserEmail,
        },
      };
    }

    try {
      const response = await fetch(appsScriptUrl, {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "text/plain;charset=utf-8", // Needed to bypass CORS preflight with Apps Script
        },
        body: JSON.stringify({
          action,
          requestId,
          auth: {
            idToken: this.getIdToken()
          },
          payload,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const json = await response.json();
      
      const ROLE_PERMISSIONS: Record<string, string[]> = {
        "System Owner": ["PERM_ALL", "PERM_WO_CREATE", "PERM_WO_UPDATE", "PERM_WO_ASSIGN", "PERM_WO_START_HOLD", "PERM_WO_REVIEW", "PERM_WO_CANCEL", "PERM_ADMIN", "PERM_REPORTS"],
        "Facilities Manager": ["PERM_WO_CREATE", "PERM_WO_UPDATE", "PERM_WO_ASSIGN", "PERM_WO_START_HOLD", "PERM_WO_REVIEW", "PERM_WO_CANCEL", "PERM_REPORTS"],
        "Supervisor": ["PERM_WO_CREATE", "PERM_WO_UPDATE", "PERM_WO_ASSIGN", "PERM_WO_START_HOLD", "PERM_WO_REVIEW", "PERM_WO_CANCEL"],
        "Coordinator": ["PERM_WO_CREATE", "PERM_WO_UPDATE", "PERM_WO_ASSIGN"],
        "Technician": ["PERM_WO_START_HOLD"],
        "Requester": ["PERM_WO_CREATE"],
        "Viewer": []
      };

      if (json.ok && json.data) {
        if (action === "users.list" && Array.isArray(json.data)) {
          json.data = json.data.map((user: any) => ({
            ...user,
            permissions: ROLE_PERMISSIONS[user.role] || []
          }));
        }
      }

      return json as ApiResponse<T>;
    } catch (err: any) {
      console.error(`Apps Script direct API failed for action "${action}":`, err);
      return {
        ok: false,
        data: null,
        message: err.message || "Failed to fetch from Apps Script Web App",
        meta: {
          requestId,
          timestamp: new Date().toISOString(),
          actor: currentUserEmail,
        },
      };
    }
  }
}

export const apiClient = new ApiClient();
