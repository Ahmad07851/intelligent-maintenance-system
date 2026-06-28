/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User } from "../types";
import { apiClient } from "../api/client";

export class AuthStore {
  private listeners: (() => void)[] = [];
  private session: (User & { permissions: string[] }) | null = null;
  private users: User[] = [];
  private isInitializing: boolean = true;

  public async initialize(): Promise<void> {
    this.isInitializing = true;
    const appsScriptUrl = apiClient.getAppsScriptUrl();
    if (!appsScriptUrl) {
      this.isInitializing = false;
      this.notify();
      return;
    }

    const token = apiClient.getIdToken();
    if (!token) {
      this.isInitializing = false;
      this.notify();
      return;
    }

    try {
      // Direct handshake to authenticate the Google ID Token and retrieve user details
      const res = await apiClient.request<User & { permissions: string[] }>("auth.me");
      if (res.ok && res.data) {
        this.session = res.data;
        
        // Also fetch user directory for supervisor/admin dropdowns if authorized
        const resUsers = await apiClient.request<User[]>("users.list");
        if (resUsers.ok && resUsers.data) {
          this.users = resUsers.data;
        }
      } else {
        // Token is invalid/expired or unregistered
        this.logout();
      }
    } catch (err) {
      console.error("Failed to initialize Google session from CMMS backend:", err);
      this.logout();
    } finally {
      this.isInitializing = false;
      this.notify();
    }
  }

  public async login(idToken: string): Promise<{ ok: boolean; message: string }> {
    if (!idToken || idToken.trim().split('.').length !== 3) {
      return { ok: false, message: "Invalid Google ID Token format. Must be a valid secure JWT." };
    }

    apiClient.setIdToken(idToken.trim());
    
    try {
      const res = await apiClient.request<User & { permissions: string[] }>("auth.me");
      if (res.ok && res.data) {
        this.session = res.data;
        
        // Fetch active users list for directories
        const resUsers = await apiClient.request<User[]>("users.list");
        if (resUsers.ok && resUsers.data) {
          this.users = resUsers.data;
        }
        
        this.notify();
        return { ok: true, message: "Successfully logged in." };
      } else {
        apiClient.setIdToken("");
        return { ok: false, message: res.message || "Unrecognized credentials. Please verify your account setup." };
      }
    } catch (err: any) {
      apiClient.setIdToken("");
      return { ok: false, message: err.message || "Failed to contact backend authorization service." };
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  public isAuthenticated(): boolean {
    return this.session !== null;
  }

  public getInitializing(): boolean {
    return this.isInitializing;
  }

  public getCurrentUser(): (User & { permissions: string[] }) | null {
    return this.session;
  }

  public getUsers(): User[] {
    return this.users.filter(u => u.isActive);
  }

  public hasPermission(permission: string): boolean {
    if (!this.session) return false;
    const perms = this.session.permissions || [];
    return perms.includes("PERM_ALL") || perms.includes(permission);
  }

  public logout(): void {
    apiClient.setIdToken("");
    this.session = null;
    this.notify();
  }
}

export const authStore = new AuthStore();
