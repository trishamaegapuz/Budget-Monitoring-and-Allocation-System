import { API_URL } from '../config/api';
// frontend/src/components/Settings.jsx

import React, { useEffect, useState } from 'react';
import Layout from './layout/Layout';
import Toast from './Toast';

import {
  Settings as SettingsIcon,
  SlidersHorizontal,
  Info,
  Save,
  Building2,
  Calendar,
  Clock,
  Database,
  User,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  Monitor,
  Trash2,
  Sparkles,
  Globe2,
  Coins,
} from 'lucide-react';



export default function Settings({
  user,
  onLogout,
  onNavigate,
  activePath,
}) {
  // ============================================================
  // STATE
  // ============================================================

  const [activeTab, setActiveTab] = useState('general');

  const [loading, setLoading] = useState(true);

  const [savingGeneral, setSavingGeneral] = useState(false);

  const [savingPreferences, setSavingPreferences] = useState(false);

  const [error, setError] = useState('');

  const [toast, setToast] = useState(null);

  // ============================================================
  // GENERAL SETTINGS
  // ============================================================

  const [generalSettings, setGeneralSettings] = useState({
    institution: '',
    system_name: '',
    system_acronym: '',
  });

  // ============================================================
  // USER PREFERENCES
  // ============================================================

  const [preferences, setPreferences] = useState({
    default_fiscal_year: '2026',
    default_date_format: 'MM/DD/YYYY',
    currency: 'Philippine Peso (PHP)',
    items_per_page: 10,
    theme: 'Light',
    sidebar_position: 'Fixed',
    auto_logout_minutes: 30,
    confirm_before_delete: true,
    enable_animations: true,
    dashboard_overview: true,
  });

  // ============================================================
  // SYSTEM INFORMATION
  // ============================================================

  const [systemInformation, setSystemInformation] = useState({
    system_name: '',
    system_acronym: '',
    institution: '',
    database: '',
    server: '',
    node_version: '',
    current_time: '',
  });

  // ============================================================
  // TOAST
  // ============================================================

  const showToast = (message, type = 'success') => {
    setToast({
      message,
      type,
    });
  };

  const hideToast = () => {
    setToast(null);
  };

  // ============================================================
  // AUTHORIZATION
  // ============================================================

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');

    if (!token) {
      return null;
    }

    return {
      Authorization: `Bearer ${token}`,
    };
  };

  // ============================================================
  // UNAUTHORIZED
  // ============================================================

  const handleUnauthorized = () => {
    localStorage.removeItem('token');

    setError(
      'Your session has expired. Please log in again.'
    );

    showToast(
      'Session expired. Please log in again.',
      'error'
    );
  };

  // ============================================================
  // API REQUEST
  // ============================================================

  const apiRequest = async (endpoint, options = {}) => {
    const authHeaders = getAuthHeaders();

    if (!authHeaders) {
      throw new Error(
        'Authentication token is missing.'
      );
    }

    const response = await fetch(
      `${API_URL}${endpoint}`,
      {
        ...options,

        headers: {
          ...authHeaders,
          ...(options.headers || {}),
        },
      }
    );

    if (response.status === 401) {
      handleUnauthorized();

      throw new Error(
        'Authentication required.'
      );
    }

    let data = {};

    try {
      data = await response.json();
    } catch {
      data = {};
    }

    if (!response.ok) {
      throw new Error(
        data.message ||
        data.error ||
        'Request failed.'
      );
    }

    return data;
  };

  // ============================================================
  // LOAD SETTINGS
  // ============================================================

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('token');

      if (!token) {
        setError(
          'Authentication token is missing. Please log in again.'
        );

        return;
      }

      // --------------------------------------------------------
      // GENERAL SETTINGS
      // --------------------------------------------------------

      try {
        const generalData =
          await apiRequest('/settings/general');

        const settings =
          generalData.settings ||
          generalData.general ||
          generalData;

        if (settings) {
          setGeneralSettings({
            institution:
              settings.institution || '',

            system_name:
              settings.system_name || '',

            system_acronym:
              settings.system_acronym || '',
          });

          setPreferences(prev => ({
            ...prev,

            default_fiscal_year:
              settings.default_fiscal_year ??
              prev.default_fiscal_year,

            default_date_format:
              settings.default_date_format ??
              prev.default_date_format,

            currency:
              settings.currency ||
              (
                settings.currency_code
                  ? `${settings.currency_name || 'Philippine Peso'} (${settings.currency_code})`
                  : prev.currency
              ),
          }));
        }
      } catch (err) {
        console.error(
          'General settings error:',
          err
        );

        throw err;
      }

      // --------------------------------------------------------
      // USER PREFERENCES
      // --------------------------------------------------------

      try {
        const preferenceData =
          await apiRequest(
            '/settings/preferences'
          );

        const pref =
          preferenceData.preferences ||
          preferenceData;

        if (pref) {
          setPreferences(prev => ({
            ...prev,

            items_per_page:
              Number(
                pref.items_per_page ??
                prev.items_per_page
              ),

            theme:
              pref.theme ??
              prev.theme,

            sidebar_position:
              pref.sidebar_position ??
              prev.sidebar_position,

            auto_logout_minutes:
              Number(
                pref.auto_logout_minutes ??
                prev.auto_logout_minutes
              ),

            confirm_before_delete:
              pref.confirm_before_delete ??
              prev.confirm_before_delete,

            enable_animations:
              pref.enable_animations ??
              prev.enable_animations,

            dashboard_overview:
              pref.dashboard_overview ??
              prev.dashboard_overview,
          }));
        }
      } catch (err) {
        console.warn(
          'Preferences could not be loaded:',
          err
        );
      }

      // --------------------------------------------------------
      // SYSTEM INFORMATION
      // --------------------------------------------------------

      try {
        const systemData =
          await apiRequest(
            '/settings/system-information'
          );

        const info =
          systemData.system ||
          systemData.information ||
          systemData;

        if (info) {
          setSystemInformation({
            system_name:
              info.system_name ||
              generalSettings.system_name ||
              '',

            system_acronym:
              info.system_acronym ||
              generalSettings.system_acronym ||
              '',

            institution:
              info.institution ||
              generalSettings.institution ||
              '',

            database:
              info.database ||
              info.database_name ||
              'PostgreSQL',

            server:
              info.server ||
              info.server_name ||
              'Node.js / Express',

            node_version:
              info.node_version ||
              '',

            current_time:
              info.current_time ||
              info.server_time ||
              '',
          });
        }
      } catch (err) {
        console.warn(
          'System information could not be loaded:',
          err
        );
      }
    } catch (err) {
      console.error(
        'Settings loading error:',
        err
      );

      if (
        err.message !==
        'Authentication required.'
      ) {
        setError(
          err.message ||
          'Could not load settings.'
        );

        showToast(
          err.message ||
          'Could not load settings.',
          'error'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    fetchSettings();

    // eslint-disable-next-line
  }, []);

  // ============================================================
  // SAVE GENERAL SETTINGS
  // ============================================================

  const handleSaveGeneral = async () => {
    try {
      setSavingGeneral(true);

      const payload = {
        institution:
          generalSettings.institution.trim(),

        system_name:
          generalSettings.system_name.trim(),

        system_acronym:
          generalSettings.system_acronym.trim(),
      };

      if (!payload.institution) {
        showToast(
          'Institution name is required.',
          'error'
        );

        return;
      }

      if (!payload.system_name) {
        showToast(
          'System name is required.',
          'error'
        );

        return;
      }

      const data =
        await apiRequest(
          '/settings/general',
          {
            method: 'PUT',

            headers: {
              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify(payload),
          }
        );

      const updatedSettings =
        data.settings ||
        data.general ||
        data;

      if (updatedSettings) {
        setGeneralSettings({
          institution:
            updatedSettings.institution ??
            payload.institution,

          system_name:
            updatedSettings.system_name ??
            payload.system_name,

          system_acronym:
            updatedSettings.system_acronym ??
            payload.system_acronym,
        });
      }

      showToast(
        'General settings saved successfully.'
      );
    } catch (err) {
      console.error(
        'Save general settings error:',
        err
      );

      showToast(
        err.message ||
        'Failed to save general settings.',
        'error'
      );
    } finally {
      setSavingGeneral(false);
    }
  };

  // ============================================================
  // SAVE USER PREFERENCES
  // ============================================================

  const handleSavePreferences = async () => {
    try {
      setSavingPreferences(true);

      const payload = {
        items_per_page:
          Number(
            preferences.items_per_page
          ),

        theme:
          preferences.theme,

        sidebar_position:
          preferences.sidebar_position,

        auto_logout_minutes:
          Number(
            preferences.auto_logout_minutes
          ),

        confirm_before_delete:
          preferences.confirm_before_delete,

        enable_animations:
          preferences.enable_animations,

        dashboard_overview:
          preferences.dashboard_overview,
      };

      const data =
        await apiRequest(
          '/settings/preferences',
          {
            method: 'PUT',

            headers: {
              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify(payload),
          }
        );

      const updated =
        data.preferences ||
        data;

      if (updated) {
        setPreferences(prev => ({
          ...prev,

          items_per_page:
            Number(
              updated.items_per_page ??
              payload.items_per_page
            ),

          theme:
            updated.theme ??
            payload.theme,

          sidebar_position:
            updated.sidebar_position ??
            payload.sidebar_position,

          auto_logout_minutes:
            Number(
              updated.auto_logout_minutes ??
              payload.auto_logout_minutes
            ),

          confirm_before_delete:
            updated.confirm_before_delete ??
            payload.confirm_before_delete,

          enable_animations:
            updated.enable_animations ??
            payload.enable_animations,

          dashboard_overview:
            updated.dashboard_overview ??
            payload.dashboard_overview,
        }));
      }

      showToast(
        'User preferences saved successfully.'
      );
    } catch (err) {
      console.error(
        'Save preferences error:',
        err
      );

      showToast(
        err.message ||
        'Failed to save user preferences.',
        'error'
      );
    } finally {
      setSavingPreferences(false);
    }
  };

  // ============================================================
  // REFRESH
  // ============================================================

  const handleRefresh = async () => {
    await fetchSettings();

    showToast(
      'Settings refreshed successfully.'
    );
  };

  // ============================================================
  // ADMIN CHECK
  // ============================================================

  const isAdministrator =
    String(
      user?.role || ''
    ).toLowerCase() ===
    'administrator';

  // ============================================================
  // TABS
  // ============================================================

  const tabs = [
    {
      id: 'general',
      label: 'General',
      description: 'System configuration',
      icon: SettingsIcon,
    },

    {
      id: 'preferences',
      label: 'Preferences',
      description: 'Personal settings',
      icon: SlidersHorizontal,
    },

    {
      id: 'information',
      label: 'System Information',
      description: 'Environment details',
      icon: Info,
    },
  ];

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <Layout
        user={user}
        onLogout={onLogout}
        activePath={activePath}
        onNavigate={onNavigate}
      >
        <div className="min-h-[520px] flex items-center justify-center">
          <div className="flex flex-col items-center">

            <div className="w-11 h-11 rounded-full bg-blue-50 flex items-center justify-center mb-3">
              <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
            </div>

            <p className="text-sm font-medium text-gray-700">
              Loading settings...
            </p>

            <p className="text-xs text-gray-400 mt-1">
              Please wait a moment.
            </p>

          </div>
        </div>
      </Layout>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <Layout
      user={user}
      onLogout={onLogout}
      activePath={activePath}
      onNavigate={onNavigate}
    >
      <div className="w-full pb-10">

        {/* ======================================================
            HEADER
        ====================================================== */}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-7">

          <div>

            <div className="flex items-center gap-2.5">

              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                <SettingsIcon className="w-4.5 h-4.5 text-blue-600" />
              </div>

              <h1 className="text-xl font-bold text-gray-900">
                Settings
              </h1>

            </div>

            <p className="text-xs text-gray-500 mt-2 ml-11">
              Manage BMAS system configuration and your account preferences.
            </p>

          </div>

          <button
            type="button"
            onClick={handleRefresh}
            className="
              self-start
              sm:self-auto
              flex
              items-center
              gap-2
              px-3.5
              py-2
              text-xs
              font-semibold
              text-gray-600
              bg-white
              border
              border-gray-200
              rounded-lg
              hover:border-blue-200
              hover:text-blue-600
              hover:bg-blue-50/30
              transition
            "
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>

        </div>

        {/* ======================================================
            ERROR
        ====================================================== */}

        {error && (
          <div
            className="
              mb-5
              flex
              items-start
              gap-3
              px-4
              py-3
              rounded-lg
              bg-red-50
              border
              border-red-100
              text-red-700
            "
          >
            <Info className="w-4 h-4 mt-0.5 shrink-0" />

            <p className="text-xs">
              {error}
            </p>

          </div>
        )}

        {/* ======================================================
            SETTINGS NAVIGATION
        ====================================================== */}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-7 w-full">

          {tabs.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() =>
                  setActiveTab(tab.id)
                }
                className={`
                  group
                  text-left
                  px-4
                  py-3.5
                  rounded-xl
                  border
                  transition-all
                  ${
                    active
                      ? `
                        bg-blue-50
                        border-blue-200
                        shadow-sm
                      `
                      : `
                        bg-white
                        border-gray-100
                        hover:border-blue-100
                        hover:bg-gray-50
                      `
                  }
                `}
              >

                <div className="flex items-center gap-3">

                  <div
                    className={`
                      w-9
                      h-9
                      rounded-lg
                      flex
                      items-center
                      justify-center
                      shrink-0
                      ${
                        active
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-500 group-hover:bg-blue-50 group-hover:text-blue-600'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="min-w-0">

                    <p
                      className={`
                        text-xs
                        font-bold
                        ${
                          active
                            ? 'text-blue-700'
                            : 'text-gray-800'
                        }
                      `}
                    >
                      {tab.label}
                    </p>

                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {tab.description}
                    </p>

                  </div>

                </div>

              </button>
            );
          })}

        </div>

        {/* ======================================================
            GENERAL SETTINGS
        ====================================================== */}

        {activeTab === 'general' && (
          <div className="w-full">

            {!isAdministrator ? (
              <div
                className="
                  w-full
                  bg-white
                  border
                  border-gray-100
                  rounded-xl
                  p-6
                "
              >

                <div className="flex items-start gap-4">

                  <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5 text-amber-600" />
                  </div>

                  <div>

                    <h3 className="text-sm font-bold text-gray-900">
                      Administrator Access Required
                    </h3>

                    <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                      General system settings can only be modified by an Administrator.
                    </p>

                  </div>

                </div>

              </div>
            ) : (
              <div className="space-y-5 w-full">

                {/* SYSTEM IDENTITY */}

                <SettingsSection
                  icon={Building2}
                  title="System Identity"
                  description="Basic information displayed throughout the BMAS application."
                >

                  <div className="space-y-5">

                    <FormField
                      label="Institution Name"
                      description="Official name of the institution using the system."
                    >

                      <input
                        type="text"
                        value={
                          generalSettings.institution
                        }
                        onChange={(e) =>
                          setGeneralSettings(
                            prev => ({
                              ...prev,
                              institution:
                                e.target.value,
                            })
                          )
                        }
                        className={inputClass}
                        placeholder="Enter institution name"
                      />

                    </FormField>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                      <FormField
                        label="System Name"
                        description="Name of the budget management system."
                      >

                        <input
                          type="text"
                          value={
                            generalSettings.system_name
                          }
                          onChange={(e) =>
                            setGeneralSettings(
                              prev => ({
                                ...prev,
                                system_name:
                                  e.target.value,
                              })
                            )
                          }
                          className={inputClass}
                          placeholder="Budget Monitoring and Allocation System"
                        />

                      </FormField>

                      <FormField
                        label="System Acronym"
                        description="Short identifier used for the system."
                      >

                        <input
                          type="text"
                          value={
                            generalSettings.system_acronym
                          }
                          onChange={(e) =>
                            setGeneralSettings(
                              prev => ({
                                ...prev,
                                system_acronym:
                                  e.target.value,
                              })
                            )
                          }
                          className={inputClass}
                          placeholder="BMAS"
                        />

                      </FormField>

                    </div>

                  </div>

                </SettingsSection>

                {/* SAVE AREA */}

                <div className="flex justify-end">

                  <button
                    type="button"
                    onClick={handleSaveGeneral}
                    disabled={savingGeneral}
                    className="
                      flex
                      items-center
                      gap-2
                      px-4
                      py-2.5
                      bg-blue-600
                      hover:bg-blue-700
                      disabled:bg-blue-300
                      text-white
                      rounded-lg
                      text-xs
                      font-semibold
                      shadow-sm
                      transition
                    "
                  >

                    {savingGeneral ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}

                    {savingGeneral
                      ? 'Saving...'
                      : 'Save Changes'}

                  </button>

                </div>

              </div>
            )}

          </div>
        )}

        {/* ======================================================
            USER PREFERENCES
        ====================================================== */}

        {activeTab === 'preferences' && (
          <div className="w-full space-y-5">

            {/* DISPLAY */}

            <SettingsSection
              icon={Monitor}
              title="Display Preferences"
              description="Customize how BMAS looks and behaves on your screen."
            >

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                <FormField
                  label="Theme"
                  description="Choose the appearance of the application."
                >

                  <SelectField
                    value={preferences.theme}
                    onChange={(value) =>
                      setPreferences(prev => ({
                        ...prev,
                        theme: value,
                      }))
                    }
                    options={[
                      ['Light', 'Light'],
                      ['Dark', 'Dark'],
                    ]}
                  />

                </FormField>

                <FormField
                  label="Sidebar Position"
                  description="Control the behavior of the main navigation."
                >

                  <SelectField
                    value={
                      preferences.sidebar_position
                    }
                    onChange={(value) =>
                      setPreferences(prev => ({
                        ...prev,
                        sidebar_position:
                          value,
                      }))
                    }
                    options={[
                      ['Fixed', 'Fixed'],
                      ['Static', 'Static'],
                    ]}
                  />

                </FormField>

              </div>

            </SettingsSection>

            {/* DATA DISPLAY */}

            <SettingsSection
              icon={SlidersHorizontal}
              title="Data & Display"
              description="Set the default options used when viewing system records."
            >

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                <FormField
                  label="Items Per Page"
                  description="Number of records shown in tables."
                >

                  <SelectField
                    value={
                      preferences.items_per_page
                    }
                    onChange={(value) =>
                      setPreferences(prev => ({
                        ...prev,
                        items_per_page:
                          Number(value),
                      }))
                    }
                    options={[
                      [10, '10 records'],
                      [25, '25 records'],
                      [50, '50 records'],
                      [100, '100 records'],
                    ]}
                  />

                </FormField>

                <FormField
                  label="Auto Logout"
                  description="Automatically sign out after inactivity."
                >

                  <SelectField
                    value={
                      preferences.auto_logout_minutes
                    }
                    onChange={(value) =>
                      setPreferences(prev => ({
                        ...prev,
                        auto_logout_minutes:
                          Number(value),
                      }))
                    }
                    options={[
                      [15, '15 minutes'],
                      [30, '30 minutes'],
                      [60, '60 minutes'],
                    ]}
                  />

                </FormField>

              </div>

            </SettingsSection>

            {/* SYSTEM DEFAULTS */}

            <SettingsSection
              icon={Globe2}
              title="System Defaults"
              description="Default values used when working with budget and financial records."
            >

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                <FormField
                  label="Default Fiscal Year"
                  description="Fiscal year selected by default."
                  icon={Calendar}
                >

                  <SelectField
                    value={
                      preferences.default_fiscal_year
                    }
                    onChange={(value) =>
                      setPreferences(prev => ({
                        ...prev,
                        default_fiscal_year:
                          value,
                      }))
                    }
                    options={[
                      ['2024', '2024'],
                      ['2025', '2025'],
                      ['2026', '2026'],
                      ['2027', '2027'],
                    ]}
                  />

                </FormField>

                <FormField
                  label="Date Format"
                  description="Format used for displaying dates."
                  icon={Calendar}
                >

                  <SelectField
                    value={
                      preferences.default_date_format
                    }
                    onChange={(value) =>
                      setPreferences(prev => ({
                        ...prev,
                        default_date_format:
                          value,
                      }))
                    }
                    options={[
                      ['MM/DD/YYYY', 'MM/DD/YYYY'],
                      ['YYYY-MM-DD', 'YYYY-MM-DD'],
                      ['DD/MM/YYYY', 'DD/MM/YYYY'],
                    ]}
                  />

                </FormField>

                <FormField
                  label="Currency"
                  description="Currency used for financial values."
                  icon={Coins}
                >

                  <SelectField
                    value={
                      preferences.currency
                    }
                    onChange={(value) =>
                      setPreferences(prev => ({
                        ...prev,
                        currency: value,
                      }))
                    }
                    options={[
                      [
                        'Philippine Peso (PHP)',
                        'Philippine Peso (PHP)',
                      ],
                      [
                        'US Dollar (USD)',
                        'US Dollar (USD)',
                      ],
                    ]}
                  />

                </FormField>

              </div>

            </SettingsSection>

            {/* BEHAVIOR */}

            <SettingsSection
              icon={Sparkles}
              title="System Behavior"
              description="Control confirmation and interface behavior."
            >

              <div className="divide-y divide-gray-100">

                <PreferenceToggle
                  icon={Trash2}
                  title="Confirm Before Delete"
                  description="Ask for confirmation before permanently deleting records."
                  checked={
                    preferences.confirm_before_delete
                  }
                  onChange={(value) =>
                    setPreferences(prev => ({
                      ...prev,
                      confirm_before_delete:
                        value,
                    }))
                  }
                />

                <PreferenceToggle
                  icon={Sparkles}
                  title="Enable Animations"
                  description="Use subtle transitions and animations throughout the interface."
                  checked={
                    preferences.enable_animations
                  }
                  onChange={(value) =>
                    setPreferences(prev => ({
                      ...prev,
                      enable_animations:
                        value,
                    }))
                  }
                />

                <PreferenceToggle
                  icon={Monitor}
                  title="Dashboard Overview"
                  description="Show overview information when opening the dashboard."
                  checked={
                    preferences.dashboard_overview
                  }
                  onChange={(value) =>
                    setPreferences(prev => ({
                      ...prev,
                      dashboard_overview:
                        value,
                    }))
                  }
                />

              </div>

            </SettingsSection>

            {/* SAVE */}

            <div className="flex justify-end">

              <button
                type="button"
                onClick={
                  handleSavePreferences
                }
                disabled={
                  savingPreferences
                }
                className="
                  flex
                  items-center
                  gap-2
                  px-4
                  py-2.5
                  bg-blue-600
                  hover:bg-blue-700
                  disabled:bg-blue-300
                  text-white
                  rounded-lg
                  text-xs
                  font-semibold
                  shadow-sm
                  transition
                "
              >

                {savingPreferences ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}

                {savingPreferences
                  ? 'Saving...'
                  : 'Save Preferences'}

              </button>

            </div>

          </div>
        )}

        {/* ======================================================
            SYSTEM INFORMATION
        ====================================================== */}

        {activeTab === 'information' && (
          <div className="w-full">

            <SettingsSection
              icon={Database}
              title="System Information"
              description="Read-only information about the current BMAS environment."
            >

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <InfoCard
                  label="Institution"
                  value={
                    systemInformation.institution ||
                    generalSettings.institution ||
                    '-'
                  }
                  icon={Building2}
                />

                <InfoCard
                  label="System Name"
                  value={
                    systemInformation.system_name ||
                    generalSettings.system_name ||
                    '-'
                  }
                  icon={SettingsIcon}
                />

                <InfoCard
                  label="System Acronym"
                  value={
                    systemInformation.system_acronym ||
                    generalSettings.system_acronym ||
                    '-'
                  }
                  icon={Info}
                />

                <InfoCard
                  label="Database"
                  value={
                    systemInformation.database ||
                    'PostgreSQL'
                  }
                  icon={Database}
                />

                <InfoCard
                  label="Application Server"
                  value={
                    systemInformation.server ||
                    'Node.js / Express'
                  }
                  icon={Database}
                />

                <InfoCard
                  label="Node.js Version"
                  value={
                    systemInformation.node_version ||
                    '-'
                  }
                  icon={Info}
                />

                <InfoCard
                  label="Server Time"
                  value={
                    systemInformation.current_time ||
                    '-'
                  }
                  icon={Clock}
                />

                <InfoCard
                  label="Current User"
                  value={
                    user?.full_name ||
                    user?.username ||
                    '-'
                  }
                  icon={User}
                />

              </div>

            </SettingsSection>

            {/* SYSTEM STATUS */}

            <div className="mt-5">

              <div
                className="
                  flex
                  items-center
                  gap-3
                  px-4
                  py-3
                  rounded-lg
                  bg-blue-50
                  border
                  border-blue-100
                "
              >

                <CheckCircle2 className="w-4 h-4 text-blue-600" />

                <div>

                  <p className="text-xs font-semibold text-blue-800">
                    BMAS System Status
                  </p>

                  <p className="text-[11px] text-blue-600 mt-0.5">
                    System information is being displayed from the current application environment.
                  </p>

                </div>

              </div>

            </div>

          </div>
        )}

      </div>

      {/* ========================================================
          TOAST
      ======================================================== */}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}

    </Layout>
  );
}

// ============================================================
// SHARED INPUT CLASS
// ============================================================

const inputClass = `
  w-full
  px-3.5
  py-2.5
  bg-white
  border
  border-gray-200
  rounded-lg
  text-sm
  text-gray-800
  placeholder:text-gray-400
  transition
  focus:outline-none
  focus:border-blue-500
  focus:ring-2
  focus:ring-blue-100
`;

// ============================================================
// SETTINGS SECTION
// ============================================================

function SettingsSection({
  icon: Icon,
  title,
  description,
  children,
}) {
  return (
    <section
      className="
        w-full
        bg-white
        border
        border-gray-100
        rounded-xl
        overflow-hidden
      "
    >

      <div
        className="
          px-5
          py-4
          border-b
          border-gray-100
          bg-gray-50/40
        "
      >

        <div className="flex items-center gap-3">

          <div
            className="
              w-9
              h-9
              rounded-lg
              bg-blue-50
              flex
              items-center
              justify-center
              shrink-0
            "
          >
            <Icon className="w-4 h-4 text-blue-600" />
          </div>

          <div>

            <h2 className="text-sm font-bold text-gray-900">
              {title}
            </h2>

            <p className="text-[11px] text-gray-500 mt-0.5">
              {description}
            </p>

          </div>

        </div>

      </div>

      <div className="p-5 w-full">
        {children}
      </div>

    </section>
  );
}

// ============================================================
// FORM FIELD
// ============================================================

function FormField({
  label,
  description,
  icon: Icon,
  children,
}) {
  return (
    <div>

      <label
        className="
          flex
          items-center
          gap-1.5
          text-xs
          font-semibold
          text-gray-700
          mb-1.5
        "
      >

        {Icon && (
          <Icon className="w-3.5 h-3.5 text-blue-600" />
        )}

        {label}

      </label>

      {children}

      {description && (
        <p className="text-[10px] text-gray-400 mt-1.5">
          {description}
        </p>
      )}

    </div>
  );
}

// ============================================================
// SELECT FIELD
// ============================================================

function SelectField({
  value,
  onChange,
  options,
}) {
  return (
    <select
      value={value}
      onChange={(e) =>
        onChange(e.target.value)
      }
      className={`
        ${inputClass}
        bg-white
        cursor-pointer
      `}
    >

      {options.map(([optionValue, label]) => (
        <option
          key={String(optionValue)}
          value={optionValue}
        >
          {label}
        </option>
      ))}

    </select>
  );
}

// ============================================================
// PREFERENCE TOGGLE
// ============================================================

function PreferenceToggle({
  icon: Icon,
  title,
  description,
  checked,
  onChange,
}) {
  return (
    <div
      className="
        flex
        items-center
        justify-between
        gap-5
        py-4
      "
    >

      <div
        className="
          flex
          items-start
          gap-3
          min-w-0
        "
      >

        <div
          className="
            w-8
            h-8
            rounded-lg
            bg-blue-50
            flex
            items-center
            justify-center
            shrink-0
          "
        >
          <Icon className="w-4 h-4 text-blue-600" />
        </div>

        <div className="min-w-0">

          <p className="text-xs font-semibold text-gray-800">
            {title}
          </p>

          <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
            {description}
          </p>

        </div>

      </div>

      <button
        type="button"
        onClick={() =>
          onChange(!checked)
        }
        aria-pressed={checked}
        className={`
          relative
          w-10
          h-5.5
          rounded-full
          shrink-0
          transition
          ${
            checked
              ? 'bg-blue-600'
              : 'bg-gray-300'
          }
        `}
      >

        <span
          className={`
            absolute
            top-0.5
            w-4.5
            h-4.5
            rounded-full
            bg-white
            shadow-sm
            transition
            ${
              checked
                ? 'left-5'
                : 'left-0.5'
            }
          `}
        />

      </button>

    </div>
  );
}

// ============================================================
// INFO CARD
// ============================================================

function InfoCard({
  label,
  value,
  icon: Icon,
}) {
  return (
    <div
      className="
        border
        border-gray-100
        rounded-lg
        p-4
        bg-gray-50/40
        hover:bg-blue-50/30
        hover:border-blue-100
        transition
      "
    >

      <div className="flex items-center gap-2 mb-2">

        <div
          className="
            w-7
            h-7
            rounded-md
            bg-blue-50
            flex
            items-center
            justify-center
          "
        >

          <Icon
            className="
              w-3.5
              h-3.5
              text-blue-600
            "
          />

        </div>

        <span
          className="
            text-[10px]
            font-semibold
            text-gray-400
            uppercase
            tracking-wide
          "
        >
          {label}
        </span>

      </div>

      <p
        className="
          text-sm
          font-semibold
          text-gray-800
          break-words
        "
      >
        {value}
      </p>

    </div>
  );
}
