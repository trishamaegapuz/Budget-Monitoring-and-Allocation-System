// frontend/src/App.jsx

import React, { useState, useEffect } from 'react';
import { API_URL } from './config/api';

import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';

import Dashboard from './components/Dashboard';
import UserManagement from './components/UserManagement';
import BudgetProposals from './components/BudgetProposals';

import FundSources from './components/FundSources';
import MasterData from './components/MasterData';

import RaodRegistry from './components/RaodRegistry';
import RbudFundRegistry from './components/RbudFundRegistry';
import IGPRegistry from './components/IgpRegistry';

import Reports from './components/Reports';
import Exports from './components/Exports';

import Settings from './components/Settings';

import TransactionsView from './components/TransactionsView';
import NoticesView from './components/NoticesView';


// ============================================================
// ROLE-BASED ROUTE ACCESS
// ============================================================

const ROLE_ACCESS = {
  '/': ['Administration', 'Budget', 'Procurement', 'Accountant'],
  '/budget-proposals': ['Administration', 'Budget'],
  '/rbud': ['Administration', 'Budget'],
  '/rbud-registry': ['Administration', 'Budget'],
  '/igp': ['Administration', 'Budget'],
  '/igp-registry': ['Administration', 'Budget'],
  '/raod': ['Administration', 'Budget', 'Procurement', 'Accountant'],
  '/raod-registry': ['Administration', 'Budget', 'Procurement', 'Accountant'],
  '/user-management': ['Administration'],
  '/fund-sources': ['Administration'],
  '/master-data': ['Administration', 'Budget'],
  '/settings': ['Administration'],
  '/reports': ['Administration', 'Budget', 'Procurement', 'Accountant'],
  '/exports': ['Administration', 'Budget', 'Procurement', 'Accountant'],
  '/reports-exports': ['Administration', 'Budget', 'Procurement', 'Accountant'],
  '/transactions': ['Administration', 'Budget', 'Procurement', 'Accountant'],
  '/notices': ['Administration', 'Budget', 'Procurement', 'Accountant'],
  '/noticeee': ['Administration', 'Budget', 'Procurement', 'Accountant'],
};

const normalizePath = (path) => {
  if (!path || path === '/') return '/';
  const clean = path.split('?')[0].split('#')[0];
  return clean.endsWith('/') && clean.length > 1
    ? clean.slice(0, -1)
    : clean;
};

const isPathUnder = (path, base) =>
  path === base || path.startsWith(`${base}/`);

const getAllowedRolesForPath = (path) => {
  const normalized = normalizePath(path);

  // More specific module prefixes first.
  const matches = Object.keys(ROLE_ACCESS)
    .filter((base) => isPathUnder(normalized, base))
    .sort((a, b) => b.length - a.length);

  return matches.length ? ROLE_ACCESS[matches[0]] : null;
};

const canRoleAccessPath = (role, path) => {
  const allowedRoles = getAllowedRolesForPath(path);

  // Unknown routes are not considered role-accessible.
  // This prevents a role from bypassing RBAC through an unlisted URL.
  if (!allowedRoles) return false;

  return allowedRoles.includes(role);
};


// ============================================================
// APP
// ============================================================

function App() {

  // ==========================================================
  // STATE
  // ==========================================================

  const [currentPage, setCurrentPage] = useState('login');

  const [user, setUser] = useState(null);
  const [preferences, setPreferences] = useState(() => {
    try {
      return {
        items_per_page: 10, theme: 'Light', sidebar_position: 'Fixed',
        dashboard_overview: true, auto_logout_minutes: 30,
        confirm_before_delete: true, enable_animations: true,
        ...JSON.parse(localStorage.getItem('bmasUserPreferences') || '{}'),
        theme: 'Light',
      };
    } catch {
      return { items_per_page: 10, theme: 'Light', sidebar_position: 'Fixed', dashboard_overview: true, auto_logout_minutes: 30, confirm_before_delete: true, enable_animations: true };
    }
  });
  const [activePath, setActivePath] = useState(() =>
    normalizePath(window.location.pathname)
  );


  // Load the signed-in user's saved preferences from the API on login/refresh.
  useEffect(() => {
    if (!user) return undefined;
    let cancelled = false;
    const loadPreferences = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const response = await fetch(`${API_URL}/settings/preferences`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) return;
        const data = await response.json();
        const saved = data.preferences || data;
        if (!cancelled && saved && typeof saved === 'object') {
          const normalized = {
            items_per_page: Number(saved.items_per_page) || 10,
            theme: 'Light',
            sidebar_position: saved.sidebar_position || 'Fixed',
            dashboard_overview: typeof saved.dashboard_overview === 'boolean' ? saved.dashboard_overview : true,
            auto_logout_minutes: Number(saved.auto_logout_minutes) || 30,
            confirm_before_delete: typeof saved.confirm_before_delete === 'boolean' ? saved.confirm_before_delete : true,
            enable_animations: typeof saved.enable_animations === 'boolean' ? saved.enable_animations : true,
          };
          localStorage.setItem('bmasUserPreferences', JSON.stringify(normalized));
          setPreferences((prev) => ({ ...prev, ...normalized }));
        }
      } catch (error) {
        console.warn('Could not load saved BMAS preferences:', error);
      }
    };
    loadPreferences();
    return () => { cancelled = true; };
  }, [user]);

  // Load preferences saved by Settings and keep the shell synchronized.
  useEffect(() => {
    const applyPreferences = (event) => {
      const next = event?.detail;
      if (next && typeof next === 'object') setPreferences((prev) => ({ ...prev, ...next, theme: 'Light' }));
    };
    const applyStored = () => {
      try { setPreferences((prev) => ({ ...prev, ...JSON.parse(localStorage.getItem('bmasUserPreferences') || '{}'), theme: 'Light' })); } catch { /* ignore malformed local preference cache */ }
    };
    window.addEventListener('bmas-preferences-updated', applyPreferences);
    window.addEventListener('storage', applyStored);
    return () => {
      window.removeEventListener('bmas-preferences-updated', applyPreferences);
      window.removeEventListener('storage', applyStored);
    };
  }, []);

  useEffect(() => {
    // BMAS now uses one fixed Light Theme across every module.
    // Remove any stale dark-mode class left by older saved preferences.
    document.documentElement.classList.remove('bmas-dark-mode');
    document.documentElement.style.colorScheme = 'light';
    try {
      const stored = JSON.parse(localStorage.getItem('bmasUserPreferences') || '{}');
      if (stored.theme !== 'Light') {
        localStorage.setItem('bmasUserPreferences', JSON.stringify({ ...stored, theme: 'Light' }));
      }
    } catch { /* ignore malformed local preference cache */ }
    if (preferences.theme !== 'Light') {
      setPreferences((prev) => ({ ...prev, theme: 'Light' }));
    }
  }, [preferences.theme]);

  // Enforce configured inactivity timeout for the authenticated session.
  useEffect(() => {
    if (!user) return undefined;
    const minutes = Number(preferences.auto_logout_minutes) || 30;
    let timer;
    const resetTimer = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => handleLogout(), minutes * 60 * 1000);
    };
    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach((name) => window.addEventListener(name, resetTimer, { passive: true }));
    resetTimer();
    return () => {
      window.clearTimeout(timer);
      events.forEach((name) => window.removeEventListener(name, resetTimer));
    };
  }, [user, preferences.auto_logout_minutes]);

  // ==========================================================
  // CHECK LOGIN SESSION + DIRECT URL
  // ==========================================================

  useEffect(() => {

    const token =
      localStorage.getItem('token');

    const remember =
      localStorage.getItem('rememberMe');

    const userData =
      localStorage.getItem('user');


    if (
      token &&
      remember === 'true' &&
      userData
    ) {

      try {

        const parsedUser =
          JSON.parse(userData);

        const browserPath =
          normalizePath(window.location.pathname);

        const requestedPath =
          browserPath || '/';

        const allowed =
          canRoleAccessPath(parsedUser.role, requestedPath);

        const safePath =
          allowed ? requestedPath : '/';

        setUser(parsedUser);
        setCurrentPage('dashboard');
        setActivePath(safePath);

        if (safePath !== browserPath) {
          window.history.replaceState({}, '', safePath);
        }

      } catch (error) {

        console.error(
          'Invalid user data in localStorage:',
          error
        );

        localStorage.removeItem('user');
        window.history.replaceState({}, '', '/');
        setActivePath('/');

      }

    } else {

      // A protected/unknown URL must not remain in the browser address
      // bar while the application is showing the login page.
      if (window.location.pathname !== '/') {
        window.history.replaceState({}, '', '/');
      }

      setActivePath('/');

    }

  }, []);


  // ==========================================================
  // BROWSER BACK / FORWARD
  // ==========================================================

  useEffect(() => {

    const handlePopState = () => {

      const path =
        normalizePath(window.location.pathname);

      const role =
        user?.role;

      if (!role) {
        window.history.replaceState({}, '', '/');
        setActivePath('/');
        return;
      }

      if (!canRoleAccessPath(role, path)) {
        window.history.replaceState({}, '', '/');
        setActivePath('/');
        return;
      }

      setActivePath(path);
    };

    window.addEventListener('popstate', handlePopState);

    return () =>
      window.removeEventListener('popstate', handlePopState);

  }, [user]);


  // ==========================================================
  // LOGIN SUCCESS
  // ==========================================================

  const handleLoginSuccess = (userData) => {

    setUser(userData);

    setCurrentPage('dashboard');

    setActivePath('/');

    window.history.replaceState({}, '', '/');

  };


  // ==========================================================
  // LOGOUT
  // ==========================================================

  const handleLogout = () => {

    localStorage.removeItem('token');

    localStorage.removeItem('user');

    localStorage.removeItem('rememberMe');

    setUser(null);

    setCurrentPage('login');

    setActivePath('/');

  };


  // ==========================================================
  // NAVIGATION
  // ==========================================================

  const handleNavigate = (path) => {

    const requestedPath =
      normalizePath(path);

    const role =
      user?.role;

    console.log(
      'Navigating to:',
      requestedPath,
      'Role:',
      role
    );

    // Frontend route guard: do not render a module the current role
    // is not allowed to access.
    if (role && !canRoleAccessPath(role, requestedPath)) {
      console.warn(
        `Blocked unauthorized navigation to ${requestedPath} for role ${role}`
      );

      window.history.replaceState({}, '', '/');
      setActivePath('/');
      return;
    }

    window.history.pushState({}, '', requestedPath);
    setActivePath(requestedPath);

  };


  // ==========================================================
  // RENDER DASHBOARD CONTENT
  // ==========================================================

  const renderContent = () => {

    // Defensive guard: even if activePath is changed from somewhere
    // other than the sidebar, an unauthorized module cannot render.
    if (
      user?.role &&
      !canRoleAccessPath(user.role, activePath)
    ) {
      window.history.replaceState({}, '', '/');
      return (
        <Dashboard
          user={user}
          onLogout={handleLogout}
          onNavigate={handleNavigate}
          activePath='/'
        />
      );
    }

    // ========================================================
    // BUDGET PROPOSALS
    // ========================================================

    if (
      activePath === '/budget-proposals' ||
      activePath.startsWith('/budget-proposals/')
    ) {

      return (

        <BudgetProposals
          user={user}
          onLogout={handleLogout}
          onNavigate={handleNavigate}
          activePath={activePath}
        />

      );

    }


    // ========================================================
    // RBUD REGISTRY
    // ========================================================

    if (
      activePath === '/rbud-registry' ||
      activePath === '/rbud' ||
      activePath.startsWith('/rbud/')
    ) {

      return (

        <RbudFundRegistry
          user={user}
          onLogout={handleLogout}
          onNavigate={handleNavigate}
          activePath={activePath}
        />

      );

    }


    // ========================================================
    // IGP REGISTRY
    // ========================================================

    if (
      activePath === '/igp-registry' ||
      activePath === '/igp' ||
      activePath === '/igp/overview' ||
      activePath.startsWith('/igp/')
    ) {

      return (

        <IGPRegistry
          user={user}
          onLogout={handleLogout}
          onNavigate={handleNavigate}
          activePath={activePath}
        />

      );

    }


    // ========================================================
    // RAOD REGISTRY
    // ========================================================

    if (
      activePath === '/raod-registry' ||
      activePath === '/raod' ||
      activePath.startsWith('/raod/')
    ) {

      return (

        <RaodRegistry
          user={user}
          onLogout={handleLogout}
          onNavigate={handleNavigate}
          activePath={activePath}
        />

      );

    }


    // ========================================================
    // USER MANAGEMENT
    // ========================================================

    if (
      activePath === '/user-management'
    ) {

      return (

        <UserManagement
          user={user}
          onLogout={handleLogout}
          onNavigate={handleNavigate}
          activePath={activePath}
        />

      );

    }


    // ========================================================
    // FUND SOURCES
    // ========================================================

    if (
      activePath === '/fund-sources'
    ) {

      return (

        <FundSources
          user={user}
          onLogout={handleLogout}
          onNavigate={handleNavigate}
          activePath={activePath}
        />

      );

    }


    // ========================================================
    // MASTER DATA
    // ========================================================

    if (
      activePath === '/master-data'
    ) {

      return (

        <MasterData
          user={user}
          onLogout={handleLogout}
          onNavigate={handleNavigate}
          activePath={activePath}
        />

      );

    }


    // ========================================================
    // FINANCIAL REPORTS
    // ========================================================

    if (
      activePath === '/reports' ||
      activePath === '/reports/financial' ||
      activePath === '/financial-reports'
    ) {

      return (

        <Reports
          user={user}
          onLogout={handleLogout}
          onNavigate={handleNavigate}
          activePath={activePath}
        />

      );

    }


    // ========================================================
    // REPORTS & EXPORTS
    // ========================================================

    if (
      activePath === '/reports/export' ||
      activePath === '/exports' ||
      activePath === '/reports-exports'
    ) {

      return (

        <Exports
          user={user}
          onLogout={handleLogout}
          onNavigate={handleNavigate}
          activePath={activePath}
        />

      );

    }


    // ========================================================
    // SETTINGS
    // ========================================================

    if (
      activePath === '/settings'
    ) {

      return (

        <Settings
          user={user}
          onLogout={handleLogout}
          onNavigate={handleNavigate}
          activePath={activePath}
        />

      );

    }


    // ========================================================
    // TRANSACTIONS
    // ========================================================

    if (
      activePath === '/transactions'
    ) {

      return (

        <TransactionsView
          user={user}
          onLogout={handleLogout}
          onNavigate={handleNavigate}
          activePath={activePath}
        />

      );

    }


    // ========================================================
    // NOTICES
    // ========================================================

    if (
      activePath === '/noticeee' ||
      activePath === '/notices'
    ) {

      return (

        <NoticesView
          user={user}
          onLogout={handleLogout}
          onNavigate={handleNavigate}
          activePath={activePath}
        />

      );

    }


    // ========================================================
    // DEFAULT
    // DASHBOARD
    // ========================================================

    return (

      <Dashboard
        user={user}
        onLogout={handleLogout}
        onNavigate={handleNavigate}
        activePath={activePath}
      />

    );

  };


  // ==========================================================
  // MAIN RENDER
  // ==========================================================

  return (

    <div className="min-h-screen">

      {/* ====================================================
          LOGIN
      ==================================================== */}

      {currentPage === 'login' && (

        <LoginPage
          onSwitchToRegister={() =>
            setCurrentPage('register')
          }
          onLoginSuccess={
            handleLoginSuccess
          }
        />

      )}


      {/* ====================================================
          REGISTER
      ==================================================== */}

      {currentPage === 'register' && (

        <RegisterPage
          onSwitchToLogin={() =>
            setCurrentPage('login')
          }
        />

      )}


      {/* ====================================================
          AUTHENTICATED APPLICATION
      ==================================================== */}

      {currentPage === 'dashboard' && (

        <>

          {renderContent()}

        </>

      )}

    </div>

  );

}


// ============================================================
// EXPORT
// ============================================================

export default App;