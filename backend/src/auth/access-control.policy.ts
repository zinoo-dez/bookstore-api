export const ACCESS_CONTROL_VERSION = 1 as const;

export type ScopeType = 'GLOBAL' | 'DEPARTMENT' | 'ASSIGNED_ONLY' | 'SELF_ONLY';

export type CrossDepartmentAccess = 'none' | 'read_only' | 'managed';

export interface PermissionDefinition {
  key: string;
  defaultScope: ScopeType;
  description: string;
}

export interface SeparationOfDutyRule {
  id: string;
  description: string;
  actorAction: string;
  blockedWhenSameActorAction: string;
}

export const PERMISSION_CATALOG: PermissionDefinition[] = [
  {
    key: 'inquiries.create',
    defaultScope: 'SELF_ONLY',
    description: 'Create personal inquiries',
  },
  {
    key: 'inquiries.view',
    defaultScope: 'SELF_ONLY',
    description: 'View personal inquiries',
  },

  {
    key: 'support.inquiries.view',
    defaultScope: 'DEPARTMENT',
    description: 'View support inquiries in department queue',
  },
  {
    key: 'support.inquiries.reply',
    defaultScope: 'DEPARTMENT',
    description: 'Reply to support inquiries',
  },
  {
    key: 'support.inquiries.assign',
    defaultScope: 'DEPARTMENT',
    description: 'Assign support inquiries',
  },
  {
    key: 'support.inquiries.escalate',
    defaultScope: 'DEPARTMENT',
    description: 'Escalate support inquiries',
  },

  {
    key: 'finance.inquiries.view',
    defaultScope: 'DEPARTMENT',
    description: 'View finance inquiries in department queue',
  },
  {
    key: 'finance.inquiries.reply',
    defaultScope: 'DEPARTMENT',
    description: 'Reply to finance inquiries',
  },
  {
    key: 'finance.inquiries.manage',
    defaultScope: 'DEPARTMENT',
    description: 'Manage finance inquiries',
  },

  {
    key: 'marketing.inquiries.view',
    defaultScope: 'DEPARTMENT',
    description: 'View marketing inquiries in department queue',
  },
  {
    key: 'marketing.inquiries.reply',
    defaultScope: 'DEPARTMENT',
    description: 'Reply to marketing inquiries',
  },
  {
    key: 'marketing.inquiries.manage',
    defaultScope: 'DEPARTMENT',
    description: 'Manage marketing inquiries',
  },

  {
    key: 'department.inquiries.view',
    defaultScope: 'ASSIGNED_ONLY',
    description: 'View assigned departmental inquiries',
  },
  {
    key: 'department.inquiries.reply',
    defaultScope: 'ASSIGNED_ONLY',
    description: 'Reply to assigned departmental inquiries',
  },

  {
    key: 'support.tickets.view',
    defaultScope: 'DEPARTMENT',
    description: 'View support tickets in own queue',
  },
  {
    key: 'support.tickets.reply',
    defaultScope: 'ASSIGNED_ONLY',
    description: 'Reply to assigned support tickets',
  },
  {
    key: 'support.tickets.assign',
    defaultScope: 'DEPARTMENT',
    description: 'Assign tickets within department queue',
  },
  {
    key: 'support.tickets.close',
    defaultScope: 'ASSIGNED_ONLY',
    description: 'Close assigned support tickets',
  },
  {
    key: 'support.tickets.escalate',
    defaultScope: 'DEPARTMENT',
    description: 'Escalate support tickets',
  },

  {
    key: 'author.requests.view',
    defaultScope: 'DEPARTMENT',
    description: 'View creator onboarding requests',
  },
  {
    key: 'author.requests.manage',
    defaultScope: 'DEPARTMENT',
    description: 'Process creator onboarding requests',
  },
  {
    key: 'author.verify',
    defaultScope: 'DEPARTMENT',
    description: 'Verify creator identity/status',
  },
  {
    key: 'blogs.moderate',
    defaultScope: 'DEPARTMENT',
    description: 'Moderate blog content',
  },
  {
    key: 'blogs.feature',
    defaultScope: 'DEPARTMENT',
    description: 'Feature blog content',
  },
  {
    key: 'blogs.unpublish',
    defaultScope: 'DEPARTMENT',
    description: 'Unpublish blog content',
  },

  {
    key: 'catalog.manage',
    defaultScope: 'DEPARTMENT',
    description: 'Manage catalog entries',
  },
  {
    key: 'metadata.manage',
    defaultScope: 'DEPARTMENT',
    description: 'Manage metadata quality and corrections',
  },
  {
    key: 'publisher.requests.manage',
    defaultScope: 'DEPARTMENT',
    description: 'Handle publisher requests',
  },

  {
    key: 'business.inquiries.view',
    defaultScope: 'DEPARTMENT',
    description: 'View business inquiries',
  },
  {
    key: 'business.inquiries.manage',
    defaultScope: 'DEPARTMENT',
    description: 'Manage business inquiries',
  },
  {
    key: 'campaign.view',
    defaultScope: 'DEPARTMENT',
    description: 'View campaign-level data',
  },

  {
    key: 'legal.inquiries.view',
    defaultScope: 'DEPARTMENT',
    description: 'View legal inquiries',
  },
  {
    key: 'legal.inquiries.manage',
    defaultScope: 'DEPARTMENT',
    description: 'Manage legal inquiries',
  },
  {
    key: 'security.incidents.manage',
    defaultScope: 'DEPARTMENT',
    description: 'Handle security incidents',
  },

  {
    key: 'finance.reports.view',
    defaultScope: 'GLOBAL',
    description: 'View finance and order reports',
  },
  {
    key: 'finance.payout.manage',
    defaultScope: 'GLOBAL',
    description: 'Manage payout actions',
  },
  {
    key: 'finance.audit.view',
    defaultScope: 'GLOBAL',
    description: 'Read finance audit trails',
  },
  {
    key: 'finance.transaction.export',
    defaultScope: 'GLOBAL',
    description: 'Export finance transaction data',
  },

  {
    key: 'warehouse.view',
    defaultScope: 'DEPARTMENT',
    description: 'View warehouse operations',
  },
  {
    key: 'warehouse.stock.update',
    defaultScope: 'DEPARTMENT',
    description: 'Update stock in assigned warehouses',
  },
  {
    key: 'warehouse.transfer',
    defaultScope: 'DEPARTMENT',
    description: 'Transfer stock between assigned warehouses',
  },
  {
    key: 'warehouse.stock.audit',
    defaultScope: 'DEPARTMENT',
    description: 'Read stock adjustment audit logs',
  },
  {
    key: 'warehouse.damage.report',
    defaultScope: 'DEPARTMENT',
    description: 'Report damaged inventory',
  },
  {
    key: 'warehouse.purchase_request.create',
    defaultScope: 'DEPARTMENT',
    description: 'Create warehouse purchase requests',
  },
  {
    key: 'warehouse.purchase_request.view',
    defaultScope: 'DEPARTMENT',
    description: 'View warehouse purchase requests',
  },
  {
    key: 'warehouse.purchase_request.complete',
    defaultScope: 'DEPARTMENT',
    description: 'Complete approved warehouse purchase requests',
  },
  {
    key: 'warehouse.vendor.manage',
    defaultScope: 'DEPARTMENT',
    description: 'Create and manage approved vendors',
  },
  {
    key: 'warehouse.purchase_order.view',
    defaultScope: 'DEPARTMENT',
    description: 'View warehouse purchase orders',
  },
  {
    key: 'warehouse.purchase_order.create',
    defaultScope: 'DEPARTMENT',
    description: 'Create purchase orders from approved requests',
  },
  {
    key: 'warehouse.purchase_order.receive',
    defaultScope: 'DEPARTMENT',
    description: 'Receive stock against purchase orders',
  },

  {
    key: 'finance.purchase_request.review',
    defaultScope: 'GLOBAL',
    description: 'Review purchase requests from warehouse',
  },
  {
    key: 'finance.purchase_request.approve',
    defaultScope: 'GLOBAL',
    description: 'Approve purchase requests from warehouse',
  },
  {
    key: 'finance.purchase_request.reject',
    defaultScope: 'GLOBAL',
    description: 'Reject purchase requests from warehouse',
  },
  {
    key: 'finance.purchase_order.view',
    defaultScope: 'GLOBAL',
    description: 'View purchase orders for financial oversight',
  },

  {
    key: 'staff.view',
    defaultScope: 'DEPARTMENT',
    description: 'View staff and assignment records',
  },
  {
    key: 'staff.manage',
    defaultScope: 'DEPARTMENT',
    description: 'Manage staff operational records',
  },
  {
    key: 'hr.staff.create',
    defaultScope: 'DEPARTMENT',
    description: 'Create staff profile',
  },
  {
    key: 'hr.staff.update',
    defaultScope: 'DEPARTMENT',
    description: 'Update staff profile',
  },
  {
    key: 'hr.performance.manage',
    defaultScope: 'DEPARTMENT',
    description: 'Manage staff performance tasks',
  },
  {
    key: 'hr.role.assign',
    defaultScope: 'DEPARTMENT',
    description: 'Assign roles to staff in scope',
  },
  {
    key: 'hr.department.assign',
    defaultScope: 'DEPARTMENT',
    description: 'Reassign department in scope',
  },

  {
    key: 'admin.impersonate',
    defaultScope: 'GLOBAL',
    description: 'Impersonate users for debugging with audit trail',
  },
];

export const RESTRICTED_SYSTEM_PERMISSIONS = new Set<string>([
  'admin.permission.manage',
  'admin.role.promote',
  'admin.account.disable',
  'admin.audit.governance.view',
  'admin.impersonate',
]);

export const CROSS_DEPARTMENT_ACCESS: Record<string, CrossDepartmentAccess> = {
  support: 'none',
  author: 'none',
  publisher: 'none',
  business: 'none',
  legal: 'none',
  finance: 'read_only',
  warehouse: 'none',
  hr: 'none',
  admin: 'managed',
};

export const SEPARATION_OF_DUTY_RULES: SeparationOfDutyRule[] = [
  {
    id: 'payout-create-approve-split',
    description: 'The same actor cannot create and approve the same payout.',
    actorAction: 'finance.payout.create',
    blockedWhenSameActorAction: 'finance.payout.approve',
  },
  {
    id: 'role-create-approve-split',
    description: 'The same actor cannot create and approve role elevation.',
    actorAction: 'admin.role.create',
    blockedWhenSameActorAction: 'admin.role.approve',
  },
  {
    id: 'performance-self-approval',
    description:
      'A staff member cannot approve their own performance review outcome.',
    actorAction: 'hr.performance.review.create',
    blockedWhenSameActorAction: 'hr.performance.review.approve',
  },
];

export const FEATURE_FLAGS = [
  'blogs.enabled',
  'payouts.enabled',
  'beta.analytics',
] as const;

export type FeatureFlagKey = (typeof FEATURE_FLAGS)[number];

export function canBypassScope(
  role: string | undefined,
  permissionKey: string,
): boolean {
  if (role === 'SUPER_ADMIN') {
    return true;
  }

  if (role === 'ADMIN' && !RESTRICTED_SYSTEM_PERMISSIONS.has(permissionKey)) {
    return true;
  }

  return false;
}
