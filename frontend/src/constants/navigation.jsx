import React from 'react';
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
} from 'lucide-react';

/*
|--------------------------------------------------------------------------
| Main Sidebar Navigation
|--------------------------------------------------------------------------
| BMAS FINAL ROLE ACCESS
|
| Roles:
| - Administration
| - Budget
| - Accountant
| - Procurement
|
| IMPORTANT:
| Sidebar visibility only controls which modules a role can OPEN.
| It does NOT mean the role can edit every field inside the module.
| Field-level permissions will be enforced inside RBUD, IGP, and RAOD.
|--------------------------------------------------------------------------
*/

export const navItems = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/',
    allowedRoles: [
      'Administration',
      'Budget',
      'Procurement',
      'Accountant',
    ],
  },

  /*
  |--------------------------------------------------------------------------
  | Budget Proposals
  |--------------------------------------------------------------------------
  | Budget-management module.
  | Procurement and Accountant do not need this module in the sidebar.
  |--------------------------------------------------------------------------
  */
  {
    label: 'Budget Proposals',
    icon: FileText,
    path: '/budget-proposals',
    allowedRoles: [
      'Administration',
      'Budget',
    ],
  },

  /*
  |--------------------------------------------------------------------------
  | RBUD Registry — Fund 164
  |--------------------------------------------------------------------------
  | Administration = full RBUD access
  | Budget = operational RBUD access
  |
  | Accountant and Procurement do NOT access RBUD.
  | Their registry responsibilities are handled through RAOD.
  |
  | NOTE:
  | Sidebar visibility controls who can OPEN the module.
  | RBUD component/backend permissions separately control actions.
  |--------------------------------------------------------------------------
  */
  {
    label: 'RBUD Registry',
    icon: () => (
      <div className="w-5 h-5 flex items-center justify-center rounded bg-purple-600 text-white text-[11px] font-extrabold flex-shrink-0">
        R
      </div>
    ),
    path: '/rbud/overview',
    allowedRoles: [
      'Administration',
      'Budget',
    ],
  },

  /*
  |--------------------------------------------------------------------------
  | IGP Registry — Fund 161
  |--------------------------------------------------------------------------
  | Administration = full IGP access
  | Budget = WFP/budget/program responsibilities
  |
  | Procurement and Accountant do NOT access IGP.
  | Their registry responsibilities are handled through RAOD.
  |
  | NOTE:
  | Opening IGP does NOT grant full edit permission.
  | IGP field-level permissions are handled inside the IGP module.
  |
  | NOTE:
  | Opening IGP does NOT grant full edit permission.
  | IGP field-level permissions are handled inside the IGP module.
  |--------------------------------------------------------------------------
  */
  {
    label: 'IGP Registry',
    icon: () => (
      <div className="w-5 h-5 flex items-center justify-center rounded bg-blue-600 text-white text-[11px] font-extrabold flex-shrink-0">
        I
      </div>
    ),
    path: '/igp/overview',
    allowedRoles: [
      'Administration',
      'Budget',
    ],
  },

  /*
  |--------------------------------------------------------------------------
  | RAOD Registry — Fund 101
  |--------------------------------------------------------------------------
  | Budget = budget/allotment responsibilities
  | Procurement = procurement/supply responsibilities
  | Accountant = financial/accounting responsibilities
  | Administration = full access
  |--------------------------------------------------------------------------
  */
  {
    label: 'RAOD Registry',
    icon: () => (
      <div className="w-5 h-5 flex items-center justify-center rounded bg-emerald-600 text-white text-[11px] font-extrabold flex-shrink-0">
        R
      </div>
    ),
    path: '/raod/overview',
    allowedRoles: [
      'Administration',
      'Budget',
      'Accountant',
      'Procurement',
    ],
  },

  /*
  |--------------------------------------------------------------------------
  | User Management
  |--------------------------------------------------------------------------
  | Administration only.
  |--------------------------------------------------------------------------
  */
  {
    label: 'User Management',
    icon: Users,
    path: '/user-management',
    allowedRoles: ['Administration'],
  },

  /*
  |--------------------------------------------------------------------------
  | Settings
  |--------------------------------------------------------------------------
  | Administration only.
  |--------------------------------------------------------------------------
  */
  {
    label: 'Settings',
    icon: Settings,
    path: '/settings',
    allowedRoles: ['Administration'],
  },
];

/*
|--------------------------------------------------------------------------
| Get Navigation Items For Role
|--------------------------------------------------------------------------
*/

export const getNavItemsForRole = (role) => {
  if (!role) {
    return [];
  }

  return navItems.filter((item) => {
    if (!Array.isArray(item.allowedRoles)) {
      return true;
    }

    return item.allowedRoles.includes(role);
  });
};