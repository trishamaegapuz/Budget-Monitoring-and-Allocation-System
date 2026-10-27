import React, { useState } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';
import { getNavItemsForRole } from '../../constants/navigation';

export default function Layout({ children, user, onLogout, activePath, onNavigate, preferences = {} }) {
  const [collapsed, setCollapsed] = useState(false);
  const toggleCollapse = () => setCollapsed((prev) => !prev);
  // BMAS uses a fixed Light Theme; role-based navigation is unchanged.
  const isDarkTheme = false;

  // Keep the header synchronized with the actual page URL.
  // Some Dashboard links navigate without passing activePath to Layout.
  const resolvedActivePath =
    activePath && activePath !== '/'
      ? activePath
      : (window.location.pathname || '/');

  // The sidebar uses the navigation item's canonical path for highlighting.
  // Dashboard cards may navigate to /rbud or /raod, while the sidebar items
  // are defined as /rbud/overview and /raod/overview. Map those aliases here
  // without changing the actual browser URL or application route.
  const sidebarActivePath = (() => {
    const path = resolvedActivePath || '/';

    if (
      path === '/rbud' ||
      path === '/rbud-registry' ||
      path.startsWith('/rbud/')
    ) {
      return path === '/rbud' || path === '/rbud-registry'
        ? '/rbud/overview'
        : path;
    }

    if (
      path === '/raod' ||
      path === '/raod-registry' ||
      path.startsWith('/raod/')
    ) {
      return path === '/raod' || path === '/raod-registry'
        ? '/raod/overview'
        : path;
    }

    if (path === '/igp' || path === '/igp-registry') {
      return '/igp/overview';
    }

    return path;
  })();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const openSidebar = () => setSidebarOpen(true);
  const closeSidebar = () => setSidebarOpen(false);

    // 🔹 FUNCTION PARA TUKUYIN ANG TITLE AT SUBTITLE DEPENDE SA ACTIVE PATH
  const getPageHeader = (path) => {
    if (path === '/budget-proposals' || path.startsWith('/budget-proposals/')) {
  return {
    title: 'Budget Proposal',
    subtitle: 'Preparation, Review, and Approval of Budget Proposals.',
  };
}
    if (path === '/fund-sources') {
      return {
        title: 'Fund Sources',
        subtitle: 'Manage and monitor all fund sources of the university.',
      };
    }
    if (
      path === '/igp-registry' ||
      path === '/igp' ||
      path === '/igp/overview' ||
      path.startsWith('/igp/')
    ) {
      return {
        title: 'IGP Registry',
        subtitle: 'Income Generating Program / Project — Fund 161.',
      };
    }

    if (
      path === '/rbud' ||
      path === '/rbud-registry' ||
      path.startsWith('/rbud/')
    ) {
      return {
        title: 'RBUD Registry',
        subtitle: 'Manage budget utilization, disbursement, fund registries, and generate financial reports.',
      };
    }
    if (
      path === '/raod' ||
      path === '/raod-registry' ||
      path.startsWith('/raod/')
    ) {
      return {
        title: 'RAOD Registry',
        subtitle: 'Manage allotments, obligations, disbursements, fund registries, and financial accountability reports.',
      };
    }
    if (path === '/reports' || path === '/reports/financial') {
      return {
        title: 'Financial Reports',
        subtitle: 'Generate and view financial reports for RBUD, RAOD and other funds.',
      };
    }
    if (path === '/reports/export' || path === '/exports' || path === '/reports-exports') {
      return {
        title: 'Reports & Exports',
        subtitle: 'Generate, view, and export financial reports from RAOD and RBUD registries.',
      };
    }
    if (path === '/master-data') {
      return {
        title: 'Master Data',
        subtitle: 'Manage reference data used across the system.',
      };
    }
    if (path === '/user-management') {
      return {
        title: 'User Management',
        subtitle: 'Manage system users, roles, permissions and account status.',
      };
    }
    if (path === '/settings') {
      return {
        title: 'Settings',
        subtitle: 'Manage system configurations and preferences.',
      };
    }
    if (path === '/transactions') {
      return {
        title: 'Transactions View',
        subtitle: 'Monitor and review transaction history.',
      };
    }
    if (path === '/notices') {
      return {
        title: 'Notices & Announcements',
        subtitle: 'View announcements and system notifications.',
      };
    }

    // Default Dashboard
    return {
      title: 'Dashboard',
      subtitle: "Overview of the university's budget status and financial activities.",
    };
  };

  const { title, subtitle } = getPageHeader(resolvedActivePath);

  const isAnySubActive = (subItems) => {
    if (!subItems || !Array.isArray(subItems)) return false;
    return subItems.some((item) => {
      if (item?.path) return item.path === sidebarActivePath;
      if (item?.sub && Array.isArray(item.sub)) return isAnySubActive(item.sub);
      if (item?.subGroups && Array.isArray(item.subGroups)) {
        return item.subGroups.some((g) => isAnySubActive(g.sub));
      }
      return false;
    });
  };

  // Mobile drawer intentionally uses a simple, flat list like the reference screenshot.
  // Parent modules navigate directly to their overview/first available page instead
  // of expanding nested dropdown menus on a phone-sized screen.
  const getFirstNavPath = (item) => {
    if (!item) return null;
    if (item.path) return item.path;
    if (Array.isArray(item.sub)) {
      for (const child of item.sub) {
        const childPath = getFirstNavPath(child);
        if (childPath) return childPath;
      }
    }
    if (Array.isArray(item.subGroups)) {
      for (const group of item.subGroups) {
        const groupPath = getFirstNavPath(group);
        if (groupPath) return groupPath;
      }
    }
    return null;
  };

  const renderMobileNav = (items) => {
    if (!Array.isArray(items)) return null;

    return items.map((item, idx) => {
      const targetPath = getFirstNavPath(item);
      const isActive =
        sidebarActivePath === targetPath ||
        (targetPath && sidebarActivePath.startsWith(`${targetPath}/`)) ||
        isAnySubActive(item?.sub) ||
        (Array.isArray(item?.subGroups) &&
          item.subGroups.some((group) => isAnySubActive(group?.sub)));

      return (
        <button
          key={`${item?.label || 'mobile-nav'}-${idx}`}
          type="button"
          className={`flex items-center gap-3 w-full text-left px-3 py-2.5 text-xs font-medium rounded-md transition ${
            isActive
              ? 'bg-blue-600/30 text-white'
              : 'text-blue-200/70 hover:text-white hover:bg-white/5'
          }`}
          onClick={() => {
            if (targetPath) {
              onNavigate(targetPath);
              closeSidebar();
            }
          }}
          aria-current={isActive ? 'page' : undefined}
        >
          {item?.icon ? (
            <item.icon className="w-5 h-5 flex-shrink-0" />
          ) : (
            <span aria-hidden="true" className="w-5 h-5 flex-shrink-0 inline-block" />
          )}
          <span className="truncate">{item?.label}</span>
        </button>
      );
    });
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="bmas-app-shell flex h-screen overflow-hidden bg-gray-50 text-slate-900">

      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        html, body, #root { min-height: 100%; max-width: 100%; }
        body { margin: 0; overflow-x: hidden; }
        .bmas-app-shell { width: 100%; min-width: 0; min-height: 100dvh; }
        .bmas-app-shell > * { min-width: 0; }
        .bmas-main-content {
          min-width: 0; width: 100%; max-width: 100%;
          overflow-y: auto; overflow-x: hidden;
          overscroll-behavior: contain;
        }
        .bmas-main-content > * { min-width: 0; max-width: 100%; }
        .bmas-main-content img, .bmas-main-content svg { max-width: 100%; }
        .bmas-main-content input, .bmas-main-content select,
        .bmas-main-content textarea { max-width: 100%; min-width: 0; }
        .bmas-main-content .overflow-x-auto,
        .bmas-main-content [style*="overflow-x"] {
          max-width: 100%; -webkit-overflow-scrolling: touch;
        }
        .bmas-main-content table { max-width: 100%; }
        .bmas-main-content [class*="grid-cols-"],
        .bmas-main-content [class*="flex"] { min-width: 0; }
        .bmas-main-content button { touch-action: manipulation; }
        @media (max-width: 1023px) {
          .bmas-app-shell { height: 100dvh; }
          .bmas-main-content { padding: clamp(.75rem, 2.5vw, 1.25rem) !important; }
          .bmas-main-content h1 { font-size: clamp(1.2rem, 3.5vw, 1.65rem); line-height: 1.3; }
          .bmas-main-content h2 { font-size: clamp(1.05rem, 3vw, 1.4rem); line-height: 1.35; }
          .bmas-main-content .overflow-x-auto { overflow-x: auto; }
          .bmas-main-content [role="dialog"] { max-width: calc(100vw - 1.5rem); max-height: calc(100dvh - 1.5rem); overflow-y: auto; }
        }
        @media (max-width: 640px) {
          .bmas-main-content { padding: .75rem !important; }
          .bmas-main-content form { min-width: 0; max-width: 100%; }
          .bmas-main-content input, .bmas-main-content select,
          .bmas-main-content textarea { font-size: 16px; }
          .bmas-main-content .overflow-x-auto { width: 100%; overflow-x: auto; }
          .bmas-main-content .flex.items-center.justify-between { flex-wrap: wrap; gap: .5rem; }
          .bmas-main-content .fixed.inset-0 { align-items: flex-start; overflow-y: auto; }
          .bmas-main-content .fixed.inset-0 > div,
          .bmas-main-content [role="dialog"] { max-width: calc(100vw - 1.5rem); }
        }
        @media (prefers-reduced-motion: reduce) {
          .bmas-app-shell *, .bmas-app-shell *::before, .bmas-app-shell *::after {
            scroll-behavior: auto !important; transition-duration: .01ms !important; animation-duration: .01ms !important;
          }
        }
      `}</style>

      {/* Sidebar highlighting uses canonical navigation paths. */}
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={toggleCollapse}
        user={user}
        onLogout={onLogout}
        activePath={sidebarActivePath}
        onNavigate={onNavigate}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 🔹 IPAPASA NA NATIN DITO ANG DYNAMIC TITLE AT SUBTITLE */}
        <Header
          onToggleCollapse={toggleCollapse}
          onMenuClick={openSidebar}
          user={user}
          currentDate={currentDate}
          onLogout={onLogout}
          title={title}
          subtitle={subtitle}
        />

        <main className="bmas-main-content flex-1 overflow-y-auto bg-gray-50 p-6 text-slate-900">
          {children}
        </main>

        <Footer />
      </div>

      {/*
        Mount the mobile drawer only while it is open. Keeping a hidden dialog
        mounted can leave keyboard focus inside an aria-hidden ancestor and
        trigger Chrome's "Blocked aria-hidden" accessibility warning.
      */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-50 flex lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/60"
            onClick={closeSidebar}
            aria-label="Close navigation menu"
          />
          <div className="relative z-10 flex h-full w-[min(86vw,300px)] max-w-full flex-col overflow-hidden shadow-2xl">
            <Sidebar
              collapsed={false}
              onToggleCollapse={closeSidebar}
              user={user}
              onLogout={onLogout}
              activePath={sidebarActivePath}
              onNavigate={(path) => {
                if (typeof onNavigate === 'function') onNavigate(path);
                closeSidebar();
              }}
              mobileDrawer
              onCloseMobile={closeSidebar}
            />
          </div>
        </div>
      )}
    </div>
  );
}