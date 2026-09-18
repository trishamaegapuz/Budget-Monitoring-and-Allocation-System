// frontend/src/App.jsx

import React, { useState, useEffect } from 'react';

import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';

import Dashboard from './components/Dashboard';
import UserManagement from './components/UserManagement';
import BudgetProposals from './components/BudgetProposals';

import FundSources from './components/FundSources';
import MasterData from './components/MasterData';

import RaodRegistry from './components/RaodRegistry';
import RbudFundRegistry from './components/RbudFundRegistry';

import Reports from './components/Reports';
import Exports from './components/Exports';

import Settings from './components/Settings';

import TransactionsView from './components/TransactionsView';
import NoticesView from './components/NoticesView';


// ============================================================
// APP
// ============================================================

function App() {

  // ==========================================================
  // STATE
  // ==========================================================

  const [currentPage, setCurrentPage] = useState('login');

  const [user, setUser] = useState(null);

  const [activePath, setActivePath] = useState('/');


  // ==========================================================
  // CHECK LOGIN SESSION
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

        setUser(parsedUser);

        setCurrentPage('dashboard');

        setActivePath('/');

      } catch (error) {

        console.error(
          'Invalid user data in localStorage:',
          error
        );

        localStorage.removeItem('user');

      }

    }

  }, []);


  // ==========================================================
  // LOGIN SUCCESS
  // ==========================================================

  const handleLoginSuccess = (userData) => {

    setUser(userData);

    setCurrentPage('dashboard');

    setActivePath('/');

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

    console.log(
      'Navigating to:',
      path
    );

    setActivePath(path);

  };


  // ==========================================================
  // RENDER DASHBOARD CONTENT
  // ==========================================================

  const renderContent = () => {

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