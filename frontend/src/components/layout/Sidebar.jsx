import React, { useEffect, useState } from 'react';
import { LogOut, ChevronLeft, ChevronRight, Database, Plus, ClipboardList, History, ChevronDown, BarChart3 } from 'lucide-react';
import { getNavItemsForRole } from '../../constants/navigation';

export default function Sidebar({
  collapsed,
  onToggleCollapse,
  user,
  onLogout,
  activePath,
  onNavigate,
  mobileDrawer = false,
  onCloseMobile,
}) {
  const [activeBudgetSection, setActiveBudgetSection] = useState('modules');
  const [budgetSubmenuOpen, setBudgetSubmenuOpen] = useState(false);
  const [rbudSubmenuOpen, setRbudSubmenuOpen] = useState(false);
  const [activeRbudView, setActiveRbudView] = useState('overview');
  const [raodSubmenuOpen, setRaodSubmenuOpen] = useState(false);
  const [activeRaodView, setActiveRaodView] = useState('dashboard');
  const [igpSubmenuOpen, setIgpSubmenuOpen] = useState(false);
  const [activeIgpView, setActiveIgpView] = useState('budget');
  const [restrictedNotice, setRestrictedNotice] = useState(null);

  // Keep the blue active state synchronized with the content shown in Budget Proposals.
  useEffect(() => {
    const handleSectionChange = (event) => {
      const section = event?.detail;
      const allowedSections = ['modules', 'create', 'records', 'review', 'workflow', 'history', 'auditTrail', 'reports', 'proposal-details'];
      if (allowedSections.includes(section)) setActiveBudgetSection(section);
    };
    window.addEventListener('bmas-budget-proposal-section', handleSectionChange);
    return () => window.removeEventListener('bmas-budget-proposal-section', handleSectionChange);
  }, []);

  // Keep the RBUD submenu highlight synchronized with the section shown in the main content.
  useEffect(() => {
    const handleRbudViewChange = (event) => {
      const view = event?.detail?.view;
      const allowedViews = ['overview', 'allocation', 'fundRegistries', 'transactions', 'monitoring', 'breakdown', 'feeMonitoring', 'reports'];
      if (allowedViews.includes(view)) setActiveRbudView(view);
    };
    window.addEventListener('bmas-rbud-open-view', handleRbudViewChange);
    return () => window.removeEventListener('bmas-rbud-open-view', handleRbudViewChange);
  }, []);

  // Keep the RAOD submenu highlight synchronized with its current internal view.
  useEffect(() => {
    const handleRaodViewChange = (event) => {
      const view = event?.detail?.view;
      const allowedViews = ['overview', 'dashboard', 'allotment-budget', 'fund-registry', 'transactions', 'monitoring', 'fund-rc-breakdown', 'financial-reports', 'reports-export'];
      if (allowedViews.includes(view)) setActiveRaodView(view);
    };
    window.addEventListener('bmas-raod-open-view', handleRaodViewChange);
    return () => window.removeEventListener('bmas-raod-open-view', handleRaodViewChange);
  }, []);

  // Keep IGP sidebar selection synchronized with the displayed IGP submodule.
  useEffect(() => {
    const handleIgpViewChange = (event) => {
      const view = event?.detail?.view;
      const allowedViews = ['module', 'budget', 'programs', 'transactions', 'monitoring', 'reports'];
      if (allowedViews.includes(view)) setActiveIgpView(view);
    };
    window.addEventListener('bmas-igp-open-view', handleIgpViewChange);
    return () => window.removeEventListener('bmas-igp-open-view', handleIgpViewChange);
  }, []);

  // Expand the matching submenu as soon as its module route becomes active.
  // This also keeps the submenu open after navigation and avoids needing a second click.
  useEffect(() => {
    if (activePath?.startsWith('/budget-proposals')) {
      setBudgetSubmenuOpen(true);
    }
    if (activePath === '/rbud/overview' || activePath === '/rbud-registry' || activePath?.startsWith('/rbud/')) {
      setRbudSubmenuOpen(true);
      if (['Procurement', 'Accountant'].includes(user?.role)) setActiveRbudView('transactions');
    }
    if (activePath === '/raod/overview' || activePath === '/raod-registry' || activePath?.startsWith('/raod/')) {
      setRaodSubmenuOpen(true);
      // Procurement and Accountant should land directly on RAOD Transactions.
      if (['Procurement', 'Accountant'].includes(user?.role)) {
        setActiveRaodView('transactions');
      }
    }
    if (activePath === '/igp/overview' || activePath === '/igp-registry' || activePath?.startsWith('/igp/')) {
      setIgpSubmenuOpen(true);
      setActiveIgpView(['Procurement', 'Accountant'].includes(user?.role) ? 'transactions' : 'budget');
    }
  }, [activePath, user?.role]);

  /*
   * Keep module routes highlighted when navigating to sub-pages.
   * Master Data remains a separate Administration-only module.
   */
  const sidebarItems = (() => {
    const role = user?.role;
    const items = [...getNavItemsForRole(role)];

    if (role === 'Administration') {
      const alreadyExists = items.some(
        (item) => item?.path === '/master-data'
      );

      if (!alreadyExists) {
        const masterDataItem = {
          label: 'Master Data',
          path: '/master-data',
          icon: Database,
          allowedRoles: ['Administration'],
        };

        const userIndex = items.findIndex(
          (item) => item?.path === '/user-management'
        );

        if (userIndex >= 0) {
          items.splice(userIndex, 0, masterDataItem);
        } else {
          items.push(masterDataItem);
        }
      }
    }

    /*
     * Place IGP Registry immediately after RAOD Registry.
     * Match by label/path so this works with either common route naming.
     */
    const igpIndex = items.findIndex((item) =>
      /igp\s*registry/i.test(item?.label || '') ||
      /\/igp(?:-registry|\/overview|\/)/i.test(item?.path || '')
    );

    if (igpIndex >= 0) {
      const [igpItem] = items.splice(igpIndex, 1);
      const raodIndex = items.findIndex((item) =>
        /raod\s*registry/i.test(item?.label || '') ||
        /\/raod(?:-registry|\/overview|\/)/i.test(item?.path || '')
      );

      if (raodIndex >= 0) {
        items.splice(raodIndex + 1, 0, igpItem);
      } else {
        items.push(igpItem);
      }
    }

    // Procurement and Accountant can access only the Transactions submodule
    // in RBUD and IGP. Add the parent module links even if the role navigation
    // configuration does not include them yet; the component views remain role-limited.
    // Procurement and Accountant use the same parent-module definitions
    // (including the same icons and paths) as Administration, but their
    // submenu rendering below remains restricted to Transactions only.
    if (['Procurement', 'Accountant'].includes(role)) {
      const adminItems = getNavItemsForRole('Administration');
      const sourceItems = [...adminItems, ...items];
      const findModule = (kind) => sourceItems.find((item) => {
        const label = String(item?.label || '');
        const path = String(item?.path || '');
        if (kind === 'dashboard') return /dashboard/i.test(label) || path === '/dashboard' || path === '/';
        if (kind === 'rbud') return /rbud\s*registry/i.test(label) || /\/rbud(?:-registry|\/overview|\/)/i.test(path);
        if (kind === 'raod') return /raod\s*registry/i.test(label) || /\/raod(?:-registry|\/overview|\/)/i.test(path);
        if (kind === 'igp') return /igp\s*registry/i.test(label) || /\/igp(?:-registry|\/overview|\/)/i.test(path);
        return false;
      });
      const dashboardItem = findModule('dashboard') || { label: 'Dashboard', path: '/dashboard', icon: BarChart3 };
      const rbudItem = { ...(findModule('rbud') || {}), label: 'RBUD Registry', path: '/rbud/overview', icon: (findModule('rbud') || {}).icon || Database };
      const raodItem = { ...(findModule('raod') || {}), label: 'RAOD Registry', path: '/raod/overview', icon: (findModule('raod') || {}).icon || Database };
      const igpItem = { ...(findModule('igp') || {}), label: 'IGP Registry', path: '/igp/overview', icon: (findModule('igp') || {}).icon || ClipboardList };
      return [dashboardItem, rbudItem, raodItem, igpItem].map((item) => ({
        ...item,
        allowedRoles: ['Procurement', 'Accountant'],
      }));
    }

    return items;
  })();

  const transactionOnlyRole = ['Procurement', 'Accountant'].includes(user?.role);

  const isItemActive = (item) => {
    if (!item?.path) return false;

    if (item.path === '/') {
      return activePath === '/';
    }

    if (
      item.path === '/rbud/overview' ||
      /rbud\s*registry/i.test(item.label || '')
    ) {
      return (
        activePath === '/rbud/overview' ||
        activePath === '/rbud-registry' ||
        activePath.startsWith('/rbud/')
      );
    }

    if (
      item.path === '/raod/overview' ||
      /raod\s*registry/i.test(item.label || '')
    ) {
      return (
        activePath === '/raod/overview' ||
        activePath === '/raod-registry' ||
        activePath.startsWith('/raod/')
      );
    }

    if (
      /igp\s*registry/i.test(item.label || '') ||
      /\/igp(?:-registry|\/overview|\/)/i.test(item.path || '')
    ) {
      return (
        activePath === '/igp/overview' ||
        activePath === '/igp-registry' ||
        activePath.startsWith('/igp/')
      );
    }

    return activePath === item.path;
  };

  return (
    <aside
      className={`
        ${mobileDrawer ? 'flex w-full min-w-0' : `hidden lg:flex ${collapsed ? 'w-16' : 'w-60'}`}
        flex-col
        bg-[#021B54]
        text-white
        transition-all
        duration-300
        flex-shrink-0
        relative
        h-full min-h-0
      `}
    >
      {/* LOGO / SYSTEM BRAND */}
      <div
        className="
          flex flex-col items-center justify-center
          px-3 py-4 border-b border-white/10
          relative text-center
        "
      >
        <img
          src="/UA_logo.jpg"
          alt="University of Abra Logo"
          className="
            w-10 h-10 rounded-full object-cover
            border border-white/20 flex-shrink-0
          "
        />

        {(!collapsed || mobileDrawer) && (
          <div className="flex flex-col items-center justify-center mt-1 w-full">
            <span
              className="
                text-[11px] font-bold text-white tracking-wide
                truncate w-full
              "
            >
              UNIVERSITY OF ABRA
            </span>

            <span
              className="
                text-[9px] text-slate-300 leading-tight max-w-[180px]
              "
            >
              Budget Monitoring &amp; Allocation System
            </span>
          </div>
        )}

        {/* Mobile drawer close button; desktop keeps collapse/expand control. */}
        {mobileDrawer ? (
          <button
            type="button"
            onClick={onCloseMobile || onToggleCollapse}
            aria-label="Close navigation"
            className="absolute right-3 top-3 rounded-md p-1.5 text-slate-200 hover:bg-white/10 hover:text-white z-20"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="absolute -right-3 top-5 bg-[#021B54] rounded-full p-1 text-slate-300 hover:text-white border border-white/20 transition shadow-lg z-20"
          >
            {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {/* NAVIGATION */}
      <nav className="sidebar-nav-scroll flex-1 min-h-0 px-2 py-4 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <div className="space-y-1">
          {sidebarItems.map((item, index) => {
            const isBudgetProposals = /budget\s*proposals/i.test(item?.label || '') || /budget-proposals/i.test(item?.path || '');
            const isRbudRegistry = /rbud\s*registry/i.test(item?.label || '') || /\/rbud(?:-registry|\/overview|\/)/i.test(item?.path || '');
            const isRaodRegistry = /raod\s*registry/i.test(item?.label || '') || /\/raod(?:-registry|\/overview|\/)/i.test(item?.path || '');
            const isIgpRegistry = /igp\s*registry/i.test(item?.label || '') || /\/igp(?:-registry|\/overview|\/)/i.test(item?.path || '');
            const active = isItemActive(item) ||
              (isBudgetProposals && budgetSubmenuOpen) ||
              (isRbudRegistry && rbudSubmenuOpen) ||
              (isRaodRegistry && raodSubmenuOpen) ||
              (isIgpRegistry && igpSubmenuOpen);
            const selectBudgetSection = (section) => {
              window.dispatchEvent(new CustomEvent('bmas-budget-proposal-section', { detail: section }));
              if (item.path && typeof onNavigate === 'function') onNavigate(item.path);
            };

            return (
              <div key={`${item.label}-${index}`}>
                <button
                  type="button"
                  onClick={() => {
                    if (isBudgetProposals) {
                      // Clicking the parent module toggles its submenu.
                      // If closing while inside a submodule, return to its overview and hide the list.
                      const shouldOpen = !budgetSubmenuOpen;
                      setBudgetSubmenuOpen(shouldOpen);
                      if (shouldOpen) { setRbudSubmenuOpen(false); setRaodSubmenuOpen(false); setIgpSubmenuOpen(false); }
                      setActiveBudgetSection('modules');
                      window.dispatchEvent(new CustomEvent('bmas-budget-proposal-section', { detail: 'modules' }));
                      if (item.path && typeof onNavigate === 'function') onNavigate(item.path);
                    } else if (isRbudRegistry) {
                      // Clicking the parent module toggles its submenu.
                      // Closing it returns the main content to the RBUD overview.
                      const shouldOpen = !rbudSubmenuOpen;
                      setRbudSubmenuOpen(shouldOpen);
                      if (shouldOpen) { setBudgetSubmenuOpen(false); setRaodSubmenuOpen(false); setIgpSubmenuOpen(false); }
                      const targetView = transactionOnlyRole ? 'transactions' : 'overview';
                      setActiveRbudView(targetView);
                      // Navigate to the canonical RBUD route first. The module may
                      // remount on route change, so dispatch the selected view after it mounts.
                      if (typeof onNavigate === 'function') onNavigate('/rbud-registry');
                      // Let the registry page mount before requesting its role-specific view.
                      window.setTimeout(() => {
                        window.dispatchEvent(new CustomEvent('bmas-rbud-open-view', { detail: { view: targetView, source: 'sidebar-parent' } }));
                      }, 120);
                    } else if (isRaodRegistry) {
                      const shouldOpen = !raodSubmenuOpen;
                      setRaodSubmenuOpen(shouldOpen);
                      if (shouldOpen) { setBudgetSubmenuOpen(false); setRbudSubmenuOpen(false); setIgpSubmenuOpen(false); }

                      // RAOD follows the same role-specific landing behavior as RBUD/IGP:
                      // Budget/Admin sees Overview; Procurement/Accountant sees Transactions.
                      const targetView = transactionOnlyRole ? 'transactions' : 'dashboard';
                      setActiveRaodView(targetView);
                      if (typeof onNavigate === 'function') onNavigate('/raod-registry');
                      window.setTimeout(() => {
                        window.dispatchEvent(new CustomEvent('bmas-raod-open-view', {
                          detail: { view: targetView, source: 'sidebar-parent' },
                        }));
                      }, 120);
                    } else if (isIgpRegistry) {
                      const shouldOpen = !igpSubmenuOpen;
                      setIgpSubmenuOpen(shouldOpen);
                      if (shouldOpen) { setBudgetSubmenuOpen(false); setRbudSubmenuOpen(false); setRaodSubmenuOpen(false); }
                      const targetView = transactionOnlyRole ? 'transactions' : 'budget';
                      setActiveIgpView(targetView);
                      // Navigate to IGP's canonical route first, then select the role's
                      // allowed default submodule after the view has mounted.
                      if (typeof onNavigate === 'function') onNavigate('/igp-registry');
                      // Let the registry page mount before requesting its role-specific view.
                      window.setTimeout(() => {
                        window.dispatchEvent(new CustomEvent('bmas-igp-open-view', { detail: { view: targetView, source: 'sidebar-parent' } }));
                      }, 120);
                    } else if (item.path && typeof onNavigate === 'function') {
                      onNavigate(item.path);
                    }
                  }}
                  title={collapsed ? item.label : undefined}
                  className={`
                    group flex items-center gap-3 w-full rounded-md
                    transition-all duration-200 cursor-pointer
                    ${collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'}
                    ${active ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-200 hover:bg-white/10 hover:text-white'}
                  `}
                >
                  {item.icon && (
                    <item.icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-white' : 'text-slate-300 group-hover:text-white'}`} />
                  )}
                  {(!collapsed || mobileDrawer) && <span className={`text-xs truncate flex-1 text-left ${active ? 'font-semibold' : 'font-medium'}`}>{item.label}</span>}
                  {(!collapsed || mobileDrawer) && (isBudgetProposals || isRbudRegistry || isRaodRegistry || isIgpRegistry) && ((isBudgetProposals ? budgetSubmenuOpen : isRbudRegistry ? rbudSubmenuOpen : isRaodRegistry ? raodSubmenuOpen : igpSubmenuOpen) ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />)}
                </button>

                {isBudgetProposals && (!collapsed || mobileDrawer) && budgetSubmenuOpen && (
                  <div className="ml-3 mt-1 mb-2 pl-1 space-y-1">
                    {[
                      { label: 'Overview', section: 'modules', icon: BarChart3 },
                      { label: 'Create Proposal', section: 'create', icon: Plus },
                      { label: 'Manage & Review', section: 'records', icon: ClipboardList },
                      { label: 'History & Reports', section: 'reports', icon: History },
                      { label: 'Audit Trail', section: 'auditTrail', icon: Database },
                    ].map((subItem) => (
                      <button
                        key={subItem.section}
                        type="button"
                        onClick={() => { setActiveBudgetSection(subItem.section); selectBudgetSection(subItem.section); if (mobileDrawer) (onCloseMobile || onToggleCollapse)?.(); }}
                        className={`flex items-center gap-2 w-full rounded-md px-2.5 py-2 text-left text-[11px] transition-colors duration-150 active:bg-blue-700 ${activeBudgetSection === subItem.section || (subItem.section === 'records' && ['review', 'workflow', 'proposal-details'].includes(activeBudgetSection)) || (subItem.section === 'reports' && activeBudgetSection === 'history') ? 'bg-blue-600 text-white font-semibold shadow-sm' : 'text-slate-200 hover:bg-white/10 hover:text-white'}`}
                      >
                        <subItem.icon className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{subItem.label}</span>
                      </button>
                    ))}
                  </div>
                )}
                {isRbudRegistry && (!collapsed || mobileDrawer) && rbudSubmenuOpen && (
                  <div className="ml-3 mt-1 mb-2 pl-1 space-y-1">
                    {[
                      { label: 'Dashboard', view: 'overview', icon: BarChart3 },
                      { label: 'Budget & Allocation', view: 'allocation', icon: Database },
                      { label: 'Fund Registries', view: 'fundRegistries', icon: ClipboardList },
                      { label: 'Transactions', view: 'transactions', icon: Plus },
                      { label: 'Budget Utilization & Balance', view: 'monitoring', icon: BarChart3 },
                      { label: 'Fund / Project Breakdown', view: 'breakdown', icon: Database },
                      { label: 'Fee Monitoring', view: 'feeMonitoring', icon: History },
                      { label: 'Reports & Export', view: 'reports', icon: ClipboardList },
                    ].map((subItem) => (
                      <button
                        key={subItem.view}
                        type="button"
                        onClick={() => {
                          if (transactionOnlyRole && !['transactions', 'reports'].includes(subItem.view)) {
                            setRestrictedNotice({ module: 'RBUD Registry', target: 'rbud', label: subItem.label });
                            return;
                          }
                          setActiveRbudView(subItem.view);
                          window.dispatchEvent(new CustomEvent('bmas-rbud-open-view', { detail: { view: subItem.view } }));
                          if (mobileDrawer) (onCloseMobile || onToggleCollapse)?.();
                        }}
                        className={`flex items-center gap-2 w-full rounded-md px-2.5 py-2 text-left text-[11px] transition-all duration-200 active:bg-blue-700 ${activeRbudView === subItem.view ? 'bg-blue-600 text-white font-semibold shadow-sm' : 'text-slate-200 hover:bg-white/10 hover:text-white'}`}
                      >
                        <subItem.icon className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{subItem.label}</span>
                      </button>
                    ))}
                  </div>
                )}
                {isRaodRegistry && (!collapsed || mobileDrawer) && raodSubmenuOpen && (
                  <div className="ml-3 mt-1 mb-2 pl-1 space-y-1">
                    {[
                      { label: 'Overview', view: 'dashboard', icon: BarChart3 },
                      { label: 'Allotment & Obligation', view: 'allotment-budget', icon: Database },
                      { label: 'Fund Registries', view: 'fund-registry', icon: ClipboardList },
                      { label: 'RAOD Transactions', view: 'transactions', icon: Plus },
                      { label: 'Disbursement & Balance', view: 'monitoring', icon: BarChart3 },
                      { label: 'Fund / RC Breakdown', view: 'fund-rc-breakdown', icon: Database },
                      { label: 'Financial Accountability Reports', view: 'financial-reports', icon: History },
                      { label: 'Reports & Export', view: 'reports-export', icon: ClipboardList },
                    ].map((subItem) => (
                      <button
                        key={subItem.view}
                        type="button"
                        onClick={() => {
                          setActiveRaodView(subItem.view);
                          window.dispatchEvent(new CustomEvent('bmas-raod-open-view', { detail: { view: subItem.view, source: 'submenu' } }));
                          if (mobileDrawer) (onCloseMobile || onToggleCollapse)?.();
                        }}
                        className={`flex items-center gap-2 w-full rounded-md px-2.5 py-2 text-left text-[11px] transition-all duration-200 active:bg-blue-700 ${activeRaodView === subItem.view ? 'bg-blue-600 text-white font-semibold shadow-sm' : 'text-slate-200 hover:bg-white/10 hover:text-white'}`}
                      >
                        <subItem.icon className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{subItem.label}</span>
                      </button>
                    ))}
                  </div>
                )}
                {isIgpRegistry && (!collapsed || mobileDrawer) && igpSubmenuOpen && (
                  <div className="ml-3 mt-1 mb-2 pl-1 space-y-1">
                    {[
                      { label: 'WFP / Budget & Allocation', view: 'budget', icon: Database },
                      { label: 'IGP Programs / Projects', view: 'programs', icon: ClipboardList },
                      { label: 'IGP Transactions', view: 'transactions', icon: Plus },
                      { label: 'Monitoring', view: 'monitoring', icon: BarChart3 },
                      { label: 'Reports / Export', view: 'reports', icon: History },
                    ].map((subItem) => (
                      <button
                        key={subItem.view}
                        type="button"
                        onClick={() => {
                          if (transactionOnlyRole && !['transactions', 'reports'].includes(subItem.view)) {
                            setRestrictedNotice({ module: 'IGP Registry', target: 'igp', label: subItem.label });
                            return;
                          }
                          setActiveIgpView(subItem.view);
                          window.dispatchEvent(new CustomEvent('bmas-igp-open-view', { detail: { view: subItem.view, source: 'submenu' } }));
                          if (mobileDrawer) (onCloseMobile || onToggleCollapse)?.();
                        }}
                        className={`flex items-center gap-2 w-full rounded-md px-2.5 py-2 text-left text-[11px] transition-all duration-200 active:bg-blue-700 ${activeIgpView === subItem.view ? 'bg-blue-600 text-white font-semibold shadow-sm' : 'text-slate-200 hover:bg-white/10 hover:text-white'}`}
                      >
                        <subItem.icon className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{subItem.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </nav>

      {restrictedNotice && transactionOnlyRole && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setRestrictedNotice(null); }}>
          <div role="dialog" aria-modal="true" aria-labelledby="sidebar-restricted-title" className="w-full max-w-sm rounded-2xl border border-amber-200 bg-white p-6 text-center shadow-2xl">
            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-amber-100 text-amber-700"><span className="text-xl font-bold">!</span></div>
            <h2 id="sidebar-restricted-title" className="text-base font-extrabold text-[#102b67]">Access Restricted</h2>
            <p className="mt-2 text-xs font-semibold text-slate-700">{restrictedNotice.label}</p>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">The {user?.role} role is not authorized to access this submodule. Its content is locked and cannot be viewed or modified with this account.</p>
            <button type="button" className="mt-5 rounded-lg bg-blue-700 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-blue-800" onClick={() => {
              const target = restrictedNotice.target;
              setRestrictedNotice(null);
              if (target === 'rbud') {
                setRbudSubmenuOpen(true); setActiveRbudView('transactions');
                if (typeof onNavigate === 'function') onNavigate('/rbud-registry');
                window.setTimeout(() => window.dispatchEvent(new CustomEvent('bmas-rbud-open-view', { detail: { view: 'transactions', source: 'restricted-modal' } })), 120);
              } else {
                setIgpSubmenuOpen(true); setActiveIgpView('transactions');
                if (typeof onNavigate === 'function') onNavigate('/igp-registry');
                window.setTimeout(() => window.dispatchEvent(new CustomEvent('bmas-igp-open-view', { detail: { view: 'transactions', source: 'restricted-modal' } })), 120);
              }
              if (mobileDrawer) (onCloseMobile || onToggleCollapse)?.();
            }}>Go to {restrictedNotice.target === 'rbud' ? 'RBUD' : 'IGP'} Transactions</button>
          </div>
        </div>
      )}

      {/* LOGOUT */}
      <div className="p-2 border-t border-white/10">
        <button
          type="button"
          onClick={() => {
            if (typeof onLogout === 'function') {
              onLogout();
            }
          }}
          title={collapsed ? 'Logout' : undefined}
          className={`
            group flex items-center gap-3 w-full rounded-md transition
            text-slate-200 hover:bg-white/10 hover:text-white
            ${collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'}
          `}
        >
          <LogOut
            className="
              w-5 h-5 flex-shrink-0 text-slate-300
              group-hover:text-white
            "
          />

          {(!collapsed || mobileDrawer) && (
            <span className="text-xs font-medium">
              Logout
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}