/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function resetLocalDatabase(): void {
  try {
    localStorage.removeItem("ims_apps_script_url");
    sessionStorage.removeItem("ims_google_id_token");
  } catch (e) {
    console.warn("Storage is blocked or unavailable:", e);
  }
}

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
    const googleObj = typeof window !== "undefined" ? (window as any).google : null;

    if (googleObj?.script?.run) {
      return "apps-script-runtime";
    }

    try {
      const storedUrl = localStorage.getItem("ims_apps_script_url");
      if (storedUrl) return storedUrl;
    } catch (e) {
      console.warn("localStorage is blocked or unavailable:", e);
    }

    return (import.meta as any).env?.VITE_APPS_SCRIPT || "";
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

  public async request<T = any>(action: string, payload: any = {}): Promise<ApiResponse<T>> {
    const requestId = `REQ-${new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14)}-${Math.floor(1000 + Math.random() * 9000)}`;

    const requestBody = {
      action,
      requestId,
      auth: {
        idToken: this.getIdToken(),
      },
      payload,
    };

    const googleObj = typeof window !== "undefined" ? (window as any).google : null;

    if (googleObj?.script?.run) {
      return await new Promise<ApiResponse<T>>((resolve) => {
        googleObj.script.run
          .withSuccessHandler((raw: string) => {
            try {
              resolve(JSON.parse(raw) as ApiResponse<T>);
            } catch (err: any) {
              resolve({
                ok: false,
                data: null,
                message: err.message || "Failed to parse Apps Script response.",
                meta: {
                  requestId,
                  timestamp: new Date().toISOString(),
                  actor: "anonymous",
                },
              });
            }
          })
          .withFailureHandler((err: any) => {
            resolve({
              ok: false,
              data: null,
              message: err?.message || String(err) || "Apps Script bridge call failed.",
              meta: {
                requestId,
                timestamp: new Date().toISOString(),
                actor: "anonymous",
              },
            });
          })
          .runApi(JSON.stringify(requestBody));
      });
    }

    const appsScriptUrl = this.getAppsScriptUrl();

    if (!appsScriptUrl || appsScriptUrl === "apps-script-runtime") {
      return {
        ok: false,
        data: null,
        message: "Apps Script backend is not available.",
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
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      return (await response.json()) as ApiResponse<T>;
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
