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
| Only the main modules are displayed:
|
| Dashboard
| Budget Proposals
| RBUD Registry
| RAOD Registry
| User Management
| Settings
|
| Logout is handled separately inside Sidebar.jsx
|--------------------------------------------------------------------------
*/

export const navItems = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/',
  },

  {
    label: 'Budget Proposals',
    icon: FileText,
    path: '/budget-proposals',
  },

  {
    label: 'RBUD Registry',
    icon: () => (
      <div className="w-5 h-5 flex items-center justify-center rounded bg-purple-600 text-white text-[11px] font-extrabold flex-shrink-0">
        R
      </div>
    ),
    path: '/rbud/overview',
  },

  {
    label: 'RAOD Registry',
    icon: () => (
      <div className="w-5 h-5 flex items-center justify-center rounded bg-emerald-600 text-white text-[11px] font-extrabold flex-shrink-0">
        R
      </div>
    ),
    path: '/raod/overview',
  },

  {
    label: 'User Management',
    icon: Users,
    path: '/user-management',
  },

  {
    label: 'Settings',
    icon: Settings,
    path: '/settings',
  },
];