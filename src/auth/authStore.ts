/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User } from "../types";
import { setCurrentUserEmail, apiClient } from "../api/client";

export class AuthStore {
  private listeners: (() => void)[] = [];
  private users: User[] = [];
  private session: User & { permissions: string[] } = {
    id: "",
    email: "",
    name: "Loading...",
    role: "Viewer",
    isActive: true,
    rowVersion: 1,
    permissions: []
  };

  constructor() {
    setCurrentUserEmail(apiClient.getIdToken());
  }

  public async initialize(): Promise<void> {
    const appsScriptUrl = apiClient.getAppsScriptUrl();
    if (!appsScriptUrl) {
      return;
    }

    try {
      const res = await apiClient.request<User[]>("users.list");
      if (res.ok && res.data) {
        this.users = res.data;
        const actorEmail = res.meta?.actor || apiClient.getIdToken();
        const found = this.users.find((u) => u.email.toLowerCase() === actorEmail.toLowerCase());
        
        if (found) {
          const enrichedUser = found as User & { permissions?: string[] };
          this.session = {
            ...found,
            permissions: enrichedUser.permissions || []
          };
          setCurrentUserEmail(found.email);
        } else {
          console.error(`Authenticated actor ${actorEmail} is not registered in the system.`);
        }
        this.notify();
      }
    } catch (err) {
      console.error("Failed to initialize authStore from backend", err);
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

  public getCurrentUser(): User {
    return this.session;
  }

  public getUsers(): User[] {
    return this.users.filter(u => u.isActive);
  }

  public hasPermission(permission: string): boolean {
    return this.session.permissions.includes("PERM_ALL") || this.session.permissions.includes(permission);
  }

  public logout(): void {
    this.session = {
      id: "",
      email: "",
      name: "Loading...",
      role: "Viewer",
      isActive: true,
      rowVersion: 1,
      permissions: []
    };
    this.notify();
  }
}

export const authStore = new AuthStore();

