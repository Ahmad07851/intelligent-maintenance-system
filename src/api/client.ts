/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Reset Local Database
export function resetLocalDatabase(): void {
  try {
    localStorage.removeItem("ims_apps_script_url");
    sessionStorage.removeItem("ims_google_id_token");
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
  private idToken: string = "";

  public getAppsScriptUrl(): string {
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
    if (this.idToken) return this.idToken;
    try {
      return sessionStorage.getItem("ims_google_id_token") || "";
    } catch (e) {
      return "";
    }
  }

  public setIdToken(token: string): void {
    this.idToken = token;
    try {
      if (token) {
        sessionStorage.setItem("ims_google_id_token", token);
      } else {
        sessionStorage.removeItem("ims_google_id_token");
      }
    } catch (e) {}
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
          actor: "anonymous",
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
          actor: "anonymous",
        },
      };
    }
  }
}

export const apiClient = new ApiClient();
