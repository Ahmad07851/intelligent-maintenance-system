/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum WorkOrderStatus {
  Draft = "Draft",
  Submitted = "Submitted",
  Open = "Open",
  Assigned = "Assigned",
  InProgress = "In Progress",
  OnHold = "On Hold",
  Completed = "Completed",
  PendingReview = "Pending Review",
  Closed = "Closed",
  Cancelled = "Cancelled",
  Rejected = "Rejected",
}

export enum WorkOrderPriority {
  Low = "Low",
  Routine = "Routine",
  Medium = "Medium",
  High = "High",
  Emergency = "Emergency",
  Critical = "Critical",
}

export enum WorkOrderRiskLevel {
  Low = "Low",
  Medium = "Medium",
  High = "High",
}

export interface Location {
  id: string;
  name: string;
  building: string;
  floor: string;
  room: string;
  rowVersion: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  rowVersion: number;
}

export interface Role {
  id: string;
  name: string;
  description: string;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
}

export interface RolePermission {
  roleId: string;
  permissionId: string;
}

export interface Picklist {
  id: string;
  category: string; // e.g., "Trade", "Category", "RequestSource", "CancellationReason", "Department"
  value: string;
  label: string;
}

export interface Technician {
  id: string;
  name: string;
  email: string;
  specialty: string; // e.g. "Electrical", "HVAC", "Plumbing", "Carpentry"
  status: "Active" | "Inactive" | "On Leave";
  currentWorkload: number; // Number of assigned/in-progress WOs
  rowVersion: number;
}

export interface SlaRule {
  id: string;
  priority: WorkOrderPriority;
  riskLevel: WorkOrderRiskLevel;
  trade: string;
  targetHours: number;
  escalationHours: number;
  requiresReview: boolean;
}

export interface WorkOrder {
  id: string;
  rowVersion: number;
  isDeleted: boolean;
  sourceModule: string; // e.g. "Manual", "Mojo", "API"
  lastAction: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  actorEmail: string;
  actorRole: string;
  actorName: string;

  woNumber: string; // WO-YYYY-000001
  title: string;
  description: string;
  requestSource: string; // Mojo, Phone, Email, Portal
  requestedBy: string;
  requestedByEmail: string;
  requestedByPhone: string;
  department: string;
  locationId: string;
  building: string;
  floor: string;
  room: string;
  category: string;
  trade: string;
  priority: WorkOrderPriority;
  riskLevel: WorkOrderRiskLevel;
  status: WorkOrderStatus;
  assignedTeam: string;
  assignedTo: string; // Email of Technician
  dueDate: string;
  slaTargetHours: number;
  slaBreached: boolean;
  startedAt?: string;
  completedAt?: string;
  closedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  completionNotes?: string;
  closureNotes?: string;
  requiresReview: boolean;
  reviewStatus?: "Approved" | "Rejected";
  reviewActor?: string;
  reviewAt?: string;
}

export interface WorkOrderNote {
  id: string;
  workOrderId: string;
  createdAt: string;
  createdBy: string;
  createdByName: string;
  content: string;
}

export interface WorkOrderAttachment {
  id: string;
  workOrderId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  driveUrl: string;
  createdAt: string;
  createdBy: string;
}

export interface WorkOrderHistory {
  id: string;
  workOrderId: string;
  action: string;
  statusFrom: string;
  statusTo: string;
  createdAt: string;
  createdBy: string;
  notes: string;
}

export interface MojoTicket {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  requestedBy: string;
  requestedByEmail: string;
  location: string;
  createdAt: string;
  status: "Pending" | "Converted" | "Ignored";
  convertedWoNumber?: string;
}

export interface AuditLog {
  id: string;
  action: string;
  timestamp: string;
  actor: string;
  details: string;
  requestId: string;
}

export interface SystemLog {
  id: string;
  errorType: string;
  message: string;
  timestamp: string;
  stackTrace?: string;
  requestId: string;
}
