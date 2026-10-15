import React from 'react';
import { LogOut, ChevronLeft, ChevronRight, Database } from 'lucide-react';
import { getNavItemsForRole } from '../../constants/navigation';

export default function Sidebar({
  collapsed,
  onToggleCollapse,
  user,
  onLogout,
  activePath,
  onNavigate,
}) {
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

    return items;
  })();

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
        hidden lg:flex
        flex-col
        bg-[#021B54]
        text-white
        transition-all
        duration-300
        ${collapsed ? 'w-16' : 'w-60'}
        flex-shrink-0
        relative
        h-screen
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

        {!collapsed && (
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

        {/* Collapse Button */}
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="
            absolute -right-3 top-5 bg-[#021B54]
            rounded-full p-1 text-slate-300 hover:text-white
            border border-white/20 transition shadow-lg z-20
          "
        >
          {collapsed ? (
            <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 px-2 py-4 overflow-y-auto">
        <div className="space-y-1">
          {sidebarItems.map((item, index) => {
            const active = isItemActive(item);

            return (
              <button
                key={`${item.label}-${index}`}
                type="button"
                onClick={() => {
                  if (item.path && typeof onNavigate === 'function') {
                    onNavigate(item.path);
                  }
                }}
                title={collapsed ? item.label : undefined}
                className={`
                  group flex items-center gap-3 w-full rounded-md
                  transition-all duration-200 cursor-pointer
                  ${collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'}
                  ${
                    active
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-200 hover:bg-white/10 hover:text-white'
                  }
                `}
              >
                {/* Icon */}
                {item.icon && (
                  <item.icon
                    className={`
                      w-5 h-5 flex-shrink-0
                      ${
                        active
                          ? 'text-white'
                          : 'text-slate-300 group-hover:text-white'
                      }
                    `}
                  />
                )}

                {/* Label */}
                {!collapsed && (
                  <span
                    className={`
                      text-xs truncate
                      ${active ? 'font-semibold' : 'font-medium'}
                    `}
                  >
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

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

          {!collapsed && (
            <span className="text-xs font-medium">
              Logout
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}