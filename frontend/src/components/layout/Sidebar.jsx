import React from 'react';
import { LogOut, ChevronLeft, ChevronRight, Database } from 'lucide-react';
import { navItems, getNavItemsForRole } from '../../constants/navigation';

export default function Sidebar({
  collapsed,
  onToggleCollapse,
  user,
  onLogout,
  activePath,
  onNavigate,
}) {
  /*
  |--------------------------------------------------------------------------
  | Check if the current path belongs to a module
  |--------------------------------------------------------------------------
  | This allows RBUD and RAOD pages such as:
  |
  | /rbud/overview
  | /rbud/allocation
  | /rbud/transactions
  |
  | to keep RBUD Registry highlighted.
  |--------------------------------------------------------------------------
  */
  // Keep the existing navigation and restore the standalone Master Data module.
  // If navigation.js already contains Master Data, we do not add a duplicate.
  const sidebarItems = (() => {
  const role = user?.role;

  // Get only the navigation items allowed for the logged-in role
  const items = Array.isArray(role)
    ? [...getNavItemsForRole(role)]
    : [...getNavItemsForRole(role)];

  /*
  |--------------------------------------------------------------------------
  | Master Data
  |--------------------------------------------------------------------------
  | Administration only.
  | This is still added here because the existing system keeps Master Data
  | as a separate module.
  |--------------------------------------------------------------------------
  */

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

  return items;
})();

  const isItemActive = (item) => {
    if (!item?.path) return false;

    // Dashboard
    if (item.path === '/') {
      return activePath === '/';
    }

    // RBUD Registry
    if (item.path === '/rbud/overview') {
      return (
        activePath === '/rbud/overview' ||
        activePath === '/rbud-registry' ||
        activePath.startsWith('/rbud/')
      );
    }

    // RAOD Registry
    if (item.path === '/raod/overview') {
      return (
        activePath === '/raod/overview' ||
        activePath === '/raod-registry' ||
        activePath.startsWith('/raod/')
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

      {/* ================================================================
          LOGO / SYSTEM BRAND
      ================================================================= */}
      <div
        className="
          flex
          flex-col
          items-center
          justify-center
          px-3
          py-4
          border-b
          border-white/10
          relative
          text-center
        "
      >
        <img
          src="/UA_logo.jpg"
          alt="University of Abra Logo"
          className="
            w-10
            h-10
            rounded-full
            object-cover
            border
            border-white/20
            flex-shrink-0
          "
        />

        {!collapsed && (
          <div className="flex flex-col items-center justify-center mt-1 w-full">
            <span
              className="
                text-[11px]
                font-bold
                text-white
                tracking-wide
                truncate
                w-full
              "
            >
              UNIVERSITY OF ABRA
            </span>

            <span
              className="
                text-[9px]
                text-slate-300
                leading-tight
                max-w-[180px]
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
            absolute
            -right-3
            top-5
            bg-[#021B54]
            rounded-full
            p-1
            text-slate-300
            hover:text-white
            border
            border-white/20
            transition
            shadow-lg
            z-20
          "
        >
          {collapsed ? (
            <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5" />
          )}
        </button>
      </div>


      {/* ================================================================
          NAVIGATION
      ================================================================= */}
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
                  group
                  flex
                  items-center
                  w-full
                  rounded-md
                  transition-all
                  duration-200
                  cursor-pointer
                  ${collapsed
                    ? 'justify-center px-2 py-2.5'
                    : 'px-3 py-2.5'
                  }
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
                      w-5
                      h-5
                      flex-shrink-0
                      ${
                        collapsed
                          ? ''
                          : 'mr-3'
                      }
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
                      text-xs
                      truncate
                      ${
                        active
                          ? 'font-semibold'
                          : 'font-medium'
                      }
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


      {/* ================================================================
          LOGOUT
      ================================================================= */}
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
            group
            flex
            items-center
            w-full
            rounded-md
            transition
            text-slate-200
            hover:bg-white/10
            hover:text-white
            ${
              collapsed
                ? 'justify-center px-2 py-2.5'
                : 'px-3 py-2.5'
            }
          `}
        >

          <LogOut
            className={`
              w-5
              h-5
              flex-shrink-0
              text-slate-300
              group-hover:text-white
              ${
                collapsed
                  ? ''
                  : 'mr-3'
              }
            `}
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