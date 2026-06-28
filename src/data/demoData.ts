/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  User,
  Role,
  Permission,
  Location,
  Picklist,
  Technician,
  SlaRule,
  WorkOrder,
  WorkOrderStatus,
  WorkOrderPriority,
  WorkOrderRiskLevel,
  MojoTicket,
  WorkOrderNote,
  WorkOrderAttachment,
  WorkOrderHistory,
  AuditLog,
  SystemLog
} from "../types";

export const INITIAL_ROLES: Role[] = [
  { id: "ROLE_OWNER", name: "System Owner", description: "Full root access and database administration" },
  { id: "ROLE_ADMIN", name: "Administrator", description: "Manage users, roles, picklists, and settings" },
  { id: "ROLE_MANAGER", name: "Facilities Manager", description: "Oversee operations, approve assignments, and run reports" },
  { id: "ROLE_SUPERVISOR", name: "Supervisor", description: "Create work orders, assign technicians, and review completed work" },
  { id: "ROLE_COORDINATOR", name: "Coordinator", description: "Manage help desk triage, intake, and coordination" },
  { id: "ROLE_TECH", name: "Technician", description: "Access assigned work orders and log progress" },
  { id: "ROLE_REQUESTER", name: "Requester", description: "Create and track own work requests" },
  { id: "ROLE_VIEWER", name: "Viewer", description: "Read-only access to operational dashboards" }
];

export const INITIAL_PERMISSIONS: Permission[] = [
  { id: "PERM_ALL", name: "All Access", description: "Grant access to every single action" },
  { id: "PERM_WO_CREATE", name: "Create Work Orders", description: "Create new work orders" },
  { id: "PERM_WO_UPDATE", name: "Update Work Orders", description: "Edit general work order details" },
  { id: "PERM_WO_ASSIGN", name: "Assign Work Orders", description: "Assign technicians to work orders" },
  { id: "PERM_WO_START_HOLD", name: "Execute Work Orders", description: "Start, hold, resume, or complete work orders" },
  { id: "PERM_WO_REVIEW", name: "Review Work Orders", description: "Approve or reject completed work orders" },
  { id: "PERM_WO_CANCEL", name: "Cancel Work Orders", description: "Cancel active work orders" },
  { id: "PERM_ADMIN", name: "System Administration", description: "Configure users, roles, and settings" },
  { id: "PERM_REPORTS", name: "View Reports", description: "Access reports and export operational data" }
];

export const INITIAL_USERS: User[] = [
  { id: "U-001", email: "ahmadarafat51@gmail.com", name: "Ahmad Arafat", role: "System Owner", isActive: true, rowVersion: 1 },
  { id: "U-002", email: "supervisor@ims.com", name: "Sarah Collins", role: "Supervisor", isActive: true, rowVersion: 1 },
  { id: "U-003", email: "tech.electrical@ims.com", name: "Marcus Sparks (Electrician)", role: "Technician", isActive: true, rowVersion: 1 },
  { id: "U-004", email: "tech.hvac@ims.com", name: "Linda Frost (HVAC)", role: "Technician", isActive: true, rowVersion: 1 },
  { id: "U-005", email: "tech.plumbing@ims.com", name: "David Drain (Plumbing)", role: "Technician", isActive: true, rowVersion: 1 },
  { id: "U-006", email: "coordinator@ims.com", name: "Tariq Mahmood", role: "Coordinator", isActive: true, rowVersion: 1 },
  { id: "U-007", email: "manager@ims.com", name: "Emily Vance", role: "Facilities Manager", isActive: true, rowVersion: 1 },
  { id: "U-008", email: "requester@ims.com", name: "John Doe", role: "Requester", isActive: true, rowVersion: 1 }
];

export const INITIAL_LOCATIONS: Location[] = [
  { id: "LOC-001", name: "Main HQ", building: "Building A", floor: "Ground Floor", room: "Reception", rowVersion: 1 },
  { id: "LOC-002", name: "Main HQ", building: "Building A", floor: "3rd Floor", room: "Server Room A", rowVersion: 1 },
  { id: "LOC-003", name: "Main HQ", building: "Building B", floor: "2nd Floor", room: "Conf Room 204", rowVersion: 1 },
  { id: "LOC-004", name: "East Campus Warehouse", building: "Warehouse 1", floor: "Section B", room: "Loading Dock 4", rowVersion: 1 },
  { id: "LOC-005", name: "R&D Facility", building: "Lab Building", floor: "Basement", room: "Chemical Lab 02", rowVersion: 1 }
];

export const INITIAL_PICKLISTS: Picklist[] = [
  // Trades
  { id: "PK-001", category: "Trade", value: "HVAC", label: "HVAC" },
  { id: "PK-002", category: "Trade", value: "Electrical", label: "Electrical" },
  { id: "PK-003", category: "Trade", value: "Plumbing", label: "Plumbing" },
  { id: "PK-004", category: "Trade", value: "Carpentry", label: "Carpentry" },
  { id: "PK-005", category: "Trade", value: "General Maintenance", label: "General Maintenance" },
  { id: "PK-006", category: "Trade", value: "Janitorial", label: "Janitorial" },

  // Categories
  { id: "PK-101", category: "Category", value: "Corrective", label: "Corrective Maintenance" },
  { id: "PK-102", category: "Category", value: "Preventive", label: "Preventive Maintenance" },
  { id: "PK-103", category: "Category", value: "Emergency", label: "Emergency Repair" },
  { id: "PK-104", category: "Category", value: "Safety Inspection", label: "Safety / Environmental" },
  { id: "PK-105", category: "Category", value: "Routine Request", label: "Routine General Request" },

  // Request Sources
  { id: "PK-201", category: "RequestSource", value: "Mojo Triage", label: "Mojo Intake Triage" },
  { id: "PK-202", category: "RequestSource", value: "Portal", label: "SaaS User Portal" },
  { id: "PK-203", category: "RequestSource", value: "Phone", label: "Phone Hotline" },
  { id: "PK-204", category: "RequestSource", value: "Email", label: "Email Dispatch" },
  { id: "PK-205", category: "RequestSource", value: "Walk-in", label: "Walk-in Triage" },

  // Departments
  { id: "PK-301", category: "Department", value: "Facilities & Real Estate", label: "Facilities & Real Estate" },
  { id: "PK-302", category: "Department", value: "IT Infrastructure", label: "IT Infrastructure" },
  { id: "PK-303", category: "Department", value: "Operations & Logistics", label: "Operations & Logistics" },
  { id: "PK-304", category: "Department", value: "Human Resources", label: "Human Resources" },
  { id: "PK-305", category: "Department", value: "Production Floor", label: "Production Floor" }
];

export const INITIAL_TECHNICIANS: Technician[] = [
  { id: "TECH-001", name: "Marcus Sparks", email: "tech.electrical@ims.com", specialty: "Electrical", status: "Active", currentWorkload: 1, rowVersion: 1 },
  { id: "TECH-002", name: "Linda Frost", email: "tech.hvac@ims.com", specialty: "HVAC", status: "Active", currentWorkload: 2, rowVersion: 1 },
  { id: "TECH-003", name: "David Drain", email: "tech.plumbing@ims.com", specialty: "Plumbing", status: "Active", currentWorkload: 1, rowVersion: 1 },
  { id: "TECH-004", name: "Aris Carpenter", email: "tech.carpenter@ims.com", specialty: "Carpentry", status: "On Leave", currentWorkload: 0, rowVersion: 1 },
  { id: "TECH-005", name: "Sarah Handy", email: "tech.general@ims.com", specialty: "General Maintenance", status: "Active", currentWorkload: 0, rowVersion: 1 }
];

export const INITIAL_SLA_RULES: SlaRule[] = [
  { id: "SLA-001", priority: WorkOrderPriority.Critical, riskLevel: WorkOrderRiskLevel.High, trade: "Electrical", targetHours: 4, escalationHours: 1, requiresReview: true },
  { id: "SLA-002", priority: WorkOrderPriority.Critical, riskLevel: WorkOrderRiskLevel.High, trade: "HVAC", targetHours: 4, escalationHours: 1, requiresReview: true },
  { id: "SLA-003", priority: WorkOrderPriority.High, riskLevel: WorkOrderRiskLevel.Medium, trade: "Electrical", targetHours: 24, escalationHours: 4, requiresReview: true },
  { id: "SLA-004", priority: WorkOrderPriority.High, riskLevel: WorkOrderRiskLevel.Medium, trade: "HVAC", targetHours: 24, escalationHours: 4, requiresReview: true },
  { id: "SLA-005", priority: WorkOrderPriority.Medium, riskLevel: WorkOrderRiskLevel.Low, trade: "Plumbing", targetHours: 48, escalationHours: 8, requiresReview: false },
  { id: "SLA-006", priority: WorkOrderPriority.Low, riskLevel: WorkOrderRiskLevel.Low, trade: "General Maintenance", targetHours: 72, escalationHours: 12, requiresReview: false }
];

export const INITIAL_WORK_ORDERS: WorkOrder[] = [
  {
    id: "WO-001",
    rowVersion: 1,
    isDeleted: false,
    sourceModule: "Manual",
    lastAction: "WORK_ORDER_CREATED",
    createdAt: "2026-06-25T08:00:00Z",
    createdBy: "supervisor@ims.com",
    updatedAt: "2026-06-25T08:00:00Z",
    updatedBy: "supervisor@ims.com",
    actorEmail: "supervisor@ims.com",
    actorRole: "Supervisor",
    actorName: "Sarah Collins",
    woNumber: "WO-2026-000001",
    title: "Server Room A AC Unit Leaking water",
    description: "The ceiling AC unit in Server Room A (3rd floor HQ) is leaking water directly above rack #3. Extremely critical as server rack contains core operational switches and could short-circuit. Urgent dispatch required.",
    requestSource: "Portal",
    requestedBy: "Tariq Mahmood",
    requestedByEmail: "coordinator@ims.com",
    requestedByPhone: "555-123-4567",
    department: "IT Infrastructure",
    locationId: "LOC-002",
    building: "Building A",
    floor: "3rd Floor",
    room: "Server Room A",
    category: "Emergency Repair",
    trade: "HVAC",
    priority: WorkOrderPriority.Critical,
    riskLevel: WorkOrderRiskLevel.High,
    status: WorkOrderStatus.InProgress,
    assignedTeam: "HQ HVAC Response",
    assignedTo: "tech.hvac@ims.com",
    dueDate: "2026-06-25T12:00:00Z",
    slaTargetHours: 4,
    slaBreached: false,
    startedAt: "2026-06-25T08:30:00Z",
    requiresReview: true
  },
  {
    id: "WO-002",
    rowVersion: 1,
    isDeleted: false,
    sourceModule: "Mojo",
    lastAction: "WORK_ORDER_ASSIGNED",
    createdAt: "2026-06-26T09:15:00Z",
    createdBy: "coordinator@ims.com",
    updatedAt: "2026-06-26T10:30:00Z",
    updatedBy: "supervisor@ims.com",
    actorEmail: "supervisor@ims.com",
    actorRole: "Supervisor",
    actorName: "Sarah Collins",
    woNumber: "WO-2026-000002",
    title: "Reception Area Power Outage",
    description: "The entire reception area on the Ground floor has lost wall socket power. Ceiling lights are operational, but reception desks, computers, and check-in tablets are down. Verified breaker #12 is tripped but won't reset.",
    requestSource: "Mojo Triage",
    requestedBy: "Jane Vance",
    requestedByEmail: "reception@ims.com",
    requestedByPhone: "555-987-6543",
    department: "Facilities & Real Estate",
    locationId: "LOC-001",
    building: "Building A",
    floor: "Ground Floor",
    room: "Reception",
    category: "Emergency Repair",
    trade: "Electrical",
    priority: WorkOrderPriority.Critical,
    riskLevel: WorkOrderRiskLevel.High,
    status: WorkOrderStatus.Assigned,
    assignedTeam: "Rapid Electrical Response",
    assignedTo: "tech.electrical@ims.com",
    dueDate: "2026-06-26T13:15:00Z",
    slaTargetHours: 4,
    slaBreached: true, // overdue based on current 2026-06-27T17:29 date
    requiresReview: true
  },
  {
    id: "WO-003",
    rowVersion: 2,
    isDeleted: false,
    sourceModule: "Manual",
    lastAction: "WORK_ORDER_COMPLETED",
    createdAt: "2026-06-26T14:00:00Z",
    createdBy: "supervisor@ims.com",
    updatedAt: "2026-06-27T10:00:00Z",
    updatedBy: "tech.plumbing@ims.com",
    actorEmail: "tech.plumbing@ims.com",
    actorRole: "Technician",
    actorName: "David Drain",
    woNumber: "WO-2026-000003",
    title: "Basement Chemical Lab Drain Clogged",
    description: "Main floor drain in Chemical Lab 02 is draining extremely slowly, causing pooling of wash water. Must be cleared to prevent hazardous slip conditions and compliance issues.",
    requestSource: "Phone",
    requestedBy: "Dr. Robert Banner",
    requestedByEmail: "rbanner@ims.com",
    requestedByPhone: "555-555-1212",
    department: "Production Floor",
    locationId: "LOC-005",
    building: "Lab Building",
    floor: "Basement",
    room: "Chemical Lab 02",
    category: "Corrective Maintenance",
    trade: "Plumbing",
    priority: WorkOrderPriority.High,
    riskLevel: WorkOrderRiskLevel.Medium,
    status: WorkOrderStatus.PendingReview,
    assignedTeam: "Plumbing Services",
    assignedTo: "tech.plumbing@ims.com",
    dueDate: "2026-06-27T14:00:00Z",
    slaTargetHours: 24,
    slaBreached: false,
    startedAt: "2026-06-27T08:00:00Z",
    completedAt: "2026-06-27T10:00:00Z",
    completionNotes: "Cleared chemical resistant hair/sludge buildup inside the P-trap using industrial snake. Flow tested with 50 liters of water, draining completely in under 30 seconds. Neutralized acid residues.",
    requiresReview: true
  },
  {
    id: "WO-004",
    rowVersion: 3,
    isDeleted: false,
    sourceModule: "Manual",
    lastAction: "WORK_ORDER_CLOSED",
    createdAt: "2026-06-24T10:00:00Z",
    createdBy: "supervisor@ims.com",
    updatedAt: "2026-06-25T11:00:00Z",
    updatedBy: "supervisor@ims.com",
    actorEmail: "supervisor@ims.com",
    actorRole: "Supervisor",
    actorName: "Sarah Collins",
    woNumber: "WO-2026-000004",
    title: "Conference Room 204 Door Lock broken",
    description: "Digital lock on door 204 won't lock. The deadbolt refuses to actuate via keycard or manual thumbturn. Low priority, but must be secured by the end of the week.",
    requestSource: "Email",
    requestedBy: "Emily Vance",
    requestedByEmail: "manager@ims.com",
    requestedByPhone: "555-444-3333",
    department: "Operations & Logistics",
    locationId: "LOC-003",
    building: "Building B",
    floor: "2nd Floor",
    room: "Conf Room 204",
    category: "Routine General Request",
    trade: "Carpentry",
    priority: WorkOrderPriority.Low,
    riskLevel: WorkOrderRiskLevel.Low,
    status: WorkOrderStatus.Closed,
    assignedTeam: "HQ Locksmiths",
    assignedTo: "tech.general@ims.com",
    dueDate: "2026-06-27T10:00:00Z",
    slaTargetHours: 72,
    slaBreached: false,
    startedAt: "2026-06-24T14:00:00Z",
    completedAt: "2026-06-24T15:30:00Z",
    closedAt: "2026-06-25T11:00:00Z",
    completionNotes: "Replaced faulty solenoid actuator in Assa Abloy model 450 lock. Recalibrated card reader and verified with 5 test cards. Fully functional.",
    closureNotes: "Work checked and approved by Sarah Collins. Excellent execution time.",
    requiresReview: false
  },
  {
    id: "WO-005",
    rowVersion: 1,
    isDeleted: false,
    sourceModule: "Manual",
    lastAction: "WORK_ORDER_CREATED",
    createdAt: "2026-06-27T15:00:00Z",
    createdBy: "coordinator@ims.com",
    updatedAt: "2026-06-27T15:00:00Z",
    updatedBy: "coordinator@ims.com",
    actorEmail: "coordinator@ims.com",
    actorRole: "Coordinator",
    actorName: "Tariq Mahmood",
    woNumber: "WO-2026-000005",
    title: "Loading Dock 4 Overhead Gate Squealing",
    description: "The rolling overhead gate at Loading Dock 4 is making extreme metallic screeching sounds during operation. Sounds like roller bearings need grease. Gate is moving slowly and could seize.",
    requestSource: "Walk-in",
    requestedBy: "Hank Hill (Dock Foreman)",
    requestedByEmail: "hhill@ims.com",
    requestedByPhone: "555-111-2222",
    department: "Operations & Logistics",
    locationId: "LOC-004",
    building: "Warehouse 1",
    floor: "Section B",
    room: "Loading Dock 4",
    category: "Corrective Maintenance",
    trade: "General Maintenance",
    priority: WorkOrderPriority.Medium,
    riskLevel: WorkOrderRiskLevel.Low,
    status: WorkOrderStatus.Open,
    assignedTeam: "",
    assignedTo: "",
    dueDate: "2026-06-29T15:00:00Z",
    slaTargetHours: 48,
    slaBreached: false,
    requiresReview: false
  }
];

export const INITIAL_NOTES: WorkOrderNote[] = [
  {
    id: "N-001",
    workOrderId: "WO-001",
    createdAt: "2026-06-25T08:35:00Z",
    createdBy: "tech.hvac@ims.com",
    createdByName: "Linda Frost",
    content: "Arrived at Server Room A. Water is indeed pooling above rack 3. Placed a temporary drip pan to catch water. Discovered the secondary condensate line is completely clogged with algae buildup."
  },
  {
    id: "N-002",
    workOrderId: "WO-001",
    createdAt: "2026-06-25T09:15:00Z",
    createdBy: "tech.hvac@ims.com",
    createdByName: "Linda Frost",
    content: "Shutting down the AC compressor temporarily to flush the drain line with high-pressure nitrogen. IT team informed about brief ambient temperature rise."
  },
  {
    id: "N-003",
    workOrderId: "WO-003",
    createdAt: "2026-06-27T08:15:00Z",
    createdBy: "tech.plumbing@ims.com",
    createdByName: "David Drain",
    content: "Arrived on site at Basement Lab. Wearing chemical PPE. Snake is deployed. Sensed resistance at approx 12 feet inside the line."
  }
];

export const INITIAL_ATTACHMENTS: WorkOrderAttachment[] = [
  {
    id: "ATT-001",
    workOrderId: "WO-001",
    fileName: "AC_Leakage_Above_Rack.jpg",
    fileSize: 184520,
    fileType: "image/jpeg",
    driveUrl: "https://drive.google.com/open?id=12345demo",
    createdAt: "2026-06-25T08:31:00Z",
    createdBy: "tech.hvac@ims.com"
  },
  {
    id: "ATT-002",
    workOrderId: "WO-003",
    fileName: "Chemical_Lab_Cleared_Drain_Flow.jpg",
    fileSize: 224050,
    fileType: "image/jpeg",
    driveUrl: "https://drive.google.com/open?id=67890demo",
    createdAt: "2026-06-27T09:55:00Z",
    createdBy: "tech.plumbing@ims.com"
  }
];

export const INITIAL_HISTORY: WorkOrderHistory[] = [
  {
    id: "H-001",
    workOrderId: "WO-001",
    action: "WORK_ORDER_CREATED",
    statusFrom: "Draft",
    statusTo: "Submitted",
    createdAt: "2026-06-25T08:00:00Z",
    createdBy: "supervisor@ims.com",
    notes: "Work order raised from urgent portal ticket."
  },
  {
    id: "H-002",
    workOrderId: "WO-001",
    action: "WORK_ORDER_ASSIGNED",
    statusFrom: "Submitted",
    statusTo: "Assigned",
    createdAt: "2026-06-25T08:10:00Z",
    createdBy: "supervisor@ims.com",
    notes: "Assigned to Linda Frost of HVAC Team."
  },
  {
    id: "H-003",
    workOrderId: "WO-001",
    action: "WORK_ORDER_STARTED",
    statusFrom: "Assigned",
    statusTo: "In Progress",
    createdAt: "2026-06-25T08:30:00Z",
    createdBy: "tech.hvac@ims.com",
    notes: "Technician checked in on-site and began work."
  }
];

export const INITIAL_MOJO_TICKETS: MojoTicket[] = [
  {
    id: "MOJO-101",
    ticketNumber: "TKT-38291",
    title: "Executive Office Light Flicker",
    description: "The fluorescent tubes in the CEO's office (Building A, 4th floor, room 402) are flickering constantly, causing headaches. Need replacement with LED fixtures or change tubes immediately.",
    requestedBy: "Pam Beesly",
    requestedByEmail: "pbeesly@ims.com",
    location: "Main HQ, Bldg A, Floor 4, Rm 402",
    createdAt: "2026-06-27T11:20:00Z",
    status: "Pending"
  },
  {
    id: "MOJO-102",
    ticketNumber: "TKT-38292",
    title: "Leaky Faucet in 2nd Floor Men's Room",
    description: "The center sink faucet in building B, 2nd-floor restrooms is constantly dripping water, even when fully closed. Wasting water, should check cartridge or seal.",
    requestedBy: "Kevin Malone",
    requestedByEmail: "kmalone@ims.com",
    location: "Main HQ, Bldg B, Floor 2, Men's Restroom",
    createdAt: "2026-06-27T13:40:00Z",
    status: "Pending"
  },
  {
    id: "MOJO-103",
    ticketNumber: "TKT-38293",
    title: "Server Room A AC Unit leaking water",
    description: "AC is dripping water on the server racks. HELP!",
    requestedBy: "Tariq Mahmood",
    requestedByEmail: "coordinator@ims.com",
    location: "Main HQ, Bldg A, Floor 3, Server Room A",
    createdAt: "2026-06-25T07:55:00Z",
    status: "Converted",
    convertedWoNumber: "WO-2026-000001"
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  { id: "A-001", action: "SYSTEM_BOOTSTRAP", timestamp: "2026-06-27T17:00:00Z", actor: "System", details: "Intelligent Maintenance System database and setup initialized via SetupService.", requestId: "REQ-BOOTSTRAP-01" },
  { id: "A-002", action: "WORK_ORDER_CREATED", timestamp: "2026-06-25T08:00:00Z", actor: "supervisor@ims.com", details: "Created WO-2026-000001 for AC water leak.", requestId: "REQ-WO-01" },
  { id: "A-003", action: "WORK_ORDER_ASSIGNED", timestamp: "2026-06-25T08:10:00Z", actor: "supervisor@ims.com", details: "Assigned WO-2026-000001 to tech.hvac@ims.com.", requestId: "REQ-WO-02" },
  { id: "A-004", action: "WORK_ORDER_COMPLETED", timestamp: "2026-06-27T10:00:00Z", actor: "tech.plumbing@ims.com", details: "Marked WO-2026-000003 as completed, awaiting review.", requestId: "REQ-WO-03" }
];

export const INITIAL_SYSTEM_LOGS: SystemLog[] = [
  { id: "S-ERR-001", errorType: "TOKEN_VERIFICATION_FAILED", message: "ID Token verification skipped during local testing profile.", timestamp: "2026-06-27T17:00:10Z", requestId: "REQ-BOOTSTRAP-01" }
];
