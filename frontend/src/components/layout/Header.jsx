import { API_URL } from '../../config/api';
import React, { useState, useEffect, useCallback } from 'react';
import { Menu, Bell, ChevronDown, LogOut, CheckCheck } from 'lucide-react';



export default function Header({
  onToggleCollapse,
  onMenuClick,
  user,
  currentDate,
  onLogout,
  title = 'Dashboard',
  subtitle = "Overview of the university's budget status and financial activities.",
}) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const displayName = user?.full_name || user?.name || 'User';
  const displayRole = user?.role || 'Role';
  const initial = displayName.charAt(0).toUpperCase();

  /*
   * The /api/admin/notifications endpoint is protected by JWT
   * authentication. The token must be sent in the Authorization header.
   *
   * The backend already gets the authenticated user's ID and role
   * from the JWT, so userId and role do not need to be added to
   * the query string.
   */
  const fetchNotifications = useCallback(async () => {
    if (!user?.id) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const token = localStorage.getItem('token');

    if (!token) {
      // No authenticated token. Do not repeatedly call a protected
      // endpoint and generate unnecessary 401 errors.
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/admin/notifications`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status === 401) {
        console.warn('Notification request was unauthorized.');

        // The login/session token is no longer valid.
        // Clear only the notification state here. Logout behavior
        // remains controlled by the application's existing auth flow.
        setNotifications([]);
        setUnreadCount(0);
        return;
      }

      if (response.status === 403) {
        console.warn('Notification access is restricted for this user.');
        setNotifications([]);
        setUnreadCount(0);
        return;
      }

      if (!response.ok) {
        throw new Error(`Notification request failed: ${response.status}`);
      }

      const data = await response.json();

      const notificationList = Array.isArray(data)
        ? data
        : Array.isArray(data?.notifications)
          ? data.notifications
          : [];

      setNotifications(notificationList);

      const unread = notificationList.filter(
        (item) => !item.is_read
      ).length;

      setUnreadCount(unread);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) {
      setNotifications([]);
      setUnreadCount(0);
      return undefined;
    }

    fetchNotifications();

    const interval = setInterval(() => {
      fetchNotifications();
    }, 4000);

    return () => clearInterval(interval);
  }, [user?.id, fetchNotifications]);

  const markAllAsRead = async () => {
    if (!user?.id) return;

    const token = localStorage.getItem('token');

    if (!token) {
      setUnreadCount(0);
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/admin/notifications/mark-read`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status === 401) {
        console.warn('Mark notifications as read was unauthorized.');
        return;
      }

      if (!response.ok) {
        throw new Error(
          `Mark notifications as read failed: ${response.status}`
        );
      }

      await fetchNotifications();
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const toggleNotifications = () => {
    const nextState = !showNotifications;

    setShowNotifications(nextState);

    if (showProfileMenu) {
      setShowProfileMenu(false);
    }

    if (nextState && unreadCount > 0) {
      markAllAsRead();
    }
  };

  const toggleProfileMenu = () => {
    setShowProfileMenu((previous) => !previous);

    if (showNotifications) {
      setShowNotifications(false);
    }
  };

  const handleLogoutClick = () => {
    setShowProfileMenu(false);

    if (typeof onLogout === 'function') {
      onLogout();
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <header className="bg-white border-b border-gray-200 min-h-[64px] py-2 px-6 flex items-center justify-between shrink-0 relative">
      {/* LEFT: Menu Button & Dynamic Page Title */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="p-2 text-gray-500 hover:text-gray-700 lg:block hidden"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={onMenuClick}
          className="p-2 text-gray-500 hover:text-gray-700 lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Dynamic Header Title & Subtitle */}
        <div className="flex flex-col">
          <h1 className="text-xl font-bold text-gray-900 leading-tight">
            {title}
          </h1>

          {subtitle && (
            <p className="text-xs text-gray-500 hidden sm:block">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* RIGHT: Date, Notification Bell, User Profile */}
      <div className="flex items-center gap-4 sm:gap-6">
        <div className="hidden md:flex items-center gap-2 text-sm text-gray-600">
          <span>{currentDate}</span>
          <ChevronDown className="w-4 h-4" />
        </div>

        {/* Notification Bell */}
        <div className="relative">
          <button
            type="button"
            onClick={toggleNotifications}
            className="relative p-1.5 text-gray-500 hover:text-gray-800 transition focus:outline-none"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />

            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 border-2 border-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 max-h-96 overflow-y-auto">
              <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center">
                <span className="font-semibold text-sm text-gray-700">
                  Notifications
                </span>

                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Mark all read
                  </button>
                )}
              </div>

              {notifications.length > 0 ? (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`px-4 py-3 hover:bg-gray-50 border-b border-gray-50 transition ${
                      !notif.is_read ? 'bg-blue-50/40' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-gray-900">
                        {notif.title}
                      </p>

                      <span className="text-[10px] text-gray-400">
                        {formatTime(notif.created_at)}
                      </span>
                    </div>

                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                      {notif.message}
                    </p>
                  </div>
                ))
              ) : (
                <div className="px-4 py-6 text-center text-sm text-gray-500">
                  No new notifications
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="relative">
          <div
            onClick={toggleProfileMenu}
            className="flex items-center gap-3 cursor-pointer bg-gray-50/50 hover:bg-gray-100 transition px-2 py-1.5 rounded-full border border-gray-200"
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                toggleProfileMenu();
              }
            }}
            aria-label="Open profile menu"
          >
            <div className="w-9 h-9 rounded-full bg-[#1a237e] text-white flex items-center justify-center font-bold text-sm">
              {initial}
            </div>

            <div className="hidden sm:flex flex-col leading-tight">
              <span className="text-sm font-bold text-gray-800">
                {displayName}
              </span>

              <span className="text-[10px] text-gray-500">
                {displayRole}
              </span>
            </div>

            <ChevronDown className="w-4 h-4 text-gray-400 hidden sm:block" />
          </div>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-800">
                  {displayName}
                </p>

                <p className="text-[10px] text-gray-500 truncate">
                  {user?.email}
                </p>
              </div>

              <button
                type="button"
                onClick={handleLogoutClick}
                className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium cursor-pointer transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

