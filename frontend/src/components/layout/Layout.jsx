import React, { useState } from 'react';
import { X, LogOut, ChevronDown } from 'lucide-react';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';
import { navItems } from '../../constants/navigation';

export default function Layout({ children, user, onLogout, activePath = '/', onNavigate }) {
  const [collapsed, setCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openMobileGroups, setOpenMobileGroups] = useState({
    Registries: true,
    'RBUD Registry': true,
    'RAOD Registry': false,
    'RBUD Registry-3. Fund Registries': true,
    'RBUD Registry-3. Fund Registries-Main': true,
    'RBUD Registry-3. Fund Registries-BGD': true,
    'RAOD Registry-3. General Fund Registry': false,
    'RAOD Registry-4. Transactions': false,
  });

  const toggleCollapse = () => setCollapsed(!collapsed);
  const openSidebar = () => setSidebarOpen(true);
  const closeSidebar = () => setSidebarOpen(false);

  const toggleMobileGroup = (key) => {
    setOpenMobileGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // 🔹 FUNCTION PARA TUKUYIN ANG TITLE AT SUBTITLE DEPENDE SA ACTIVE PATH
  const getPageHeader = (path) => {
    if (path === '/budget-proposals') {
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
    if (path === '/rbud-registry' || path.startsWith('/rbud/')) {
      return {
        title: 'RBUD Registry',
        subtitle: 'Manage budget utilization, disbursement, fund registries, and generate financial reports.',
      };
    }
    if (path === '/raod-registry' || path.startsWith('/raod/')) {
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

  const { title, subtitle } = getPageHeader(activePath);

  const isAnySubActive = (subItems) => {
    if (!subItems || !Array.isArray(subItems)) return false;
    return subItems.some((item) => {
      if (item?.path) return item.path === activePath;
      if (item?.sub && Array.isArray(item.sub)) return isAnySubActive(item.sub);
      if (item?.subGroups && Array.isArray(item.subGroups)) {
        return item.subGroups.some((g) => isAnySubActive(g.sub));
      }
      return false;
    });
  };

  const renderMobileNav = (items, parentKey = '', depth = 0) => {
    if (!items || !Array.isArray(items)) return null;

    return items.map((item, idx) => {
      const hasSub = item?.sub && Array.isArray(item.sub) && item.sub.length > 0;
      const hasSubGroups = item?.subGroups && Array.isArray(item.subGroups) && item.subGroups.length > 0;

      if (hasSubGroups) {
        const isOpen = openMobileGroups[item.label] || false;
        const hasActiveSub = isAnySubActive(item.subGroups.flatMap((g) => g?.sub || []));

        return (
          <div key={idx} className="mb-1">
            <div
              className={`flex items-center justify-between px-3 py-2 text-[11px] font-bold rounded-md transition ${
                hasActiveSub ? 'bg-blue-600/20 text-white' : 'text-blue-200/60 hover:text-white hover:bg-white/5'
              } uppercase cursor-pointer`}
              onClick={() => toggleMobileGroup(item.label)}
            >
              <div className="flex items-center min-w-0">
                {item.icon && <item.icon className="w-4 h-4 mr-2.5 flex-shrink-0" />}
                <span className="truncate">{item.label}</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} />
            </div>
            {isOpen && (
              <div className="ml-4 space-y-1 mt-1">
                {item.subGroups.map((subGroup, sgIdx) => {
                  const subGroupKey = parentKey ? `${parentKey}-${subGroup.label}` : `${item.label}-${subGroup.label}`;
                  const isSubOpen = openMobileGroups[subGroupKey] || false;
                  const hasActiveSubGroup = isAnySubActive(subGroup?.sub);

                  return (
                    <div key={sgIdx}>
                      <div
                        className={`flex items-center justify-between px-3 py-1.5 text-xs font-semibold rounded cursor-pointer ${
                          hasActiveSubGroup || activePath === subGroup?.path
                            ? 'bg-blue-600/20 text-white'
                            : 'text-blue-100 hover:text-white hover:bg-white/5'
                        }`}
                        onClick={() => {
                          if (subGroup?.sub && Array.isArray(subGroup.sub) && subGroup.sub.length > 0) {
                            const firstSub = subGroup.sub[0];
                            if (firstSub?.path) {
                              onNavigate(firstSub.path);
                              closeSidebar();
                            }
                          } else if (subGroup?.path) {
                            onNavigate(subGroup.path);
                            closeSidebar();
                          }
                        }}
                      >
                        <span>{subGroup.label}</span>
                        <ChevronDown
                          className={`w-3 h-3 transition-transform duration-200 cursor-pointer ${
                            isSubOpen ? 'transform rotate-180' : ''
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleMobileGroup(subGroupKey);
                          }}
                        />
                      </div>
                      {isSubOpen && (
                        <div className="ml-3 pl-2 border-l border-blue-700/40 space-y-0.5 mt-1">
                          {renderMobileNav(subGroup.sub, subGroupKey, depth + 1)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      }

      if (hasSub) {
        const itemKey = parentKey ? `${parentKey}-${item.label}` : item.label;
        const isOpen = openMobileGroups[itemKey] || false;
        const hasActiveSub = isAnySubActive(item.sub);

        return (
          <div key={idx} className="mb-1">
            <div
              className={`flex items-center justify-between px-3 py-2 text-[11px] font-semibold rounded-md transition cursor-pointer ${
                hasActiveSub || activePath === item?.path
                  ? 'bg-blue-600/20 text-white'
                  : 'text-blue-200/70 hover:text-white hover:bg-white/5'
              }`}
              onClick={() => toggleMobileGroup(itemKey)}
            >
              <div className="flex items-center min-w-0">
                {item.icon && <item.icon className="w-4 h-4 mr-2.5 flex-shrink-0" />}
                <span className="truncate">{item.label}</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} />
            </div>
            {isOpen && (
              <div className="ml-4 space-y-1 mt-1">
                {item.sub.map((subItem, sIdx) => (
                  <div
                    key={sIdx}
                    className={`px-3 py-1.5 text-xs rounded cursor-pointer transition ${
                      activePath === subItem?.path
                        ? 'bg-blue-600/30 text-white font-medium'
                        : 'text-blue-200/80 hover:text-white hover:bg-white/5'
                    }`}
                    onClick={() => {
                      if (subItem?.path) {
                        onNavigate(subItem.path);
                        closeSidebar();
                      }
                    }}
                  >
                    {subItem.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      }

      return (
        <div
          key={idx}
          className={`flex items-center px-3 py-2 text-[11px] font-semibold rounded-md transition cursor-pointer ${
            activePath === item?.path
              ? 'bg-blue-600/30 text-white'
              : 'text-blue-200/70 hover:text-white hover:bg-white/5'
          }`}
          onClick={() => {
            if (item?.path) {
              onNavigate(item.path);
              closeSidebar();
            }
          }}
        >
          {item.icon && <item.icon className="w-4 h-4 mr-2.5 flex-shrink-0" />}
          <span className="truncate">{item.label}</span>
        </div>
      );
    });
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={toggleCollapse}
        user={user}
        onLogout={onLogout}
        activePath={activePath}
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

        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {children}
        </main>

        <Footer />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 flex z-40 lg:hidden">
          <div className="fixed inset-0 bg-gray-900 bg-opacity-75" onClick={closeSidebar} />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-[#0a192f] text-white">
            <div className="flex flex-col items-center py-4 border-b border-blue-900/50 px-2 relative">
              <img src="/UA_logo.jpg" alt="Logo" className="w-12 h-12 rounded-full object-cover border-2 border-white/20" />
              <span className="mt-1 text-xs font-bold text-white text-center">UNIVERSITY OF ABRA</span>
              <span className="text-[10px] font-medium text-blue-200/70 text-center">
                Budget Monitoring &amp; Allocation System
              </span>
              <button onClick={closeSidebar} className="absolute top-2 right-2 p-1 text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
              {renderMobileNav(navItems)}

              <div className="pt-4 mt-6 border-t border-blue-900/50">
                <button
                  onClick={() => {
                    if (typeof onLogout === 'function') onLogout();
                    closeSidebar();
                  }}
                  className="flex items-center w-full px-3 py-2 text-xs font-semibold text-red-300 rounded-lg hover:bg-red-500/10"
                >
                  <LogOut className="w-4 h-4 mr-2.5 flex-shrink-0" />
                  <span>Logout</span>
                </button>
              </div>
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}