import React, { useState, useEffect, useMemo } from 'react';
import Layout from './layout/Layout';

import {
  Building2,
  CheckCircle,
  XCircle,
  Plus,
  Edit2,
  Trash2,
  Search,
  RotateCcw,
  ChevronDown,
  Layers,
  TrendingUp,
  PieChart as PieChartIcon,
  BarChart3,
  ArrowRight,
  DollarSign,
  AlertTriangle,
  Info,
  X,
} from 'lucide-react';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const API_URL = 'http://localhost:5000/api';

const COLORS = [
  '#2563eb',
  '#10b981',
  '#6366f1',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
  '#f97316',
  '#14b8a6',
  '#a855f7',
];

/*
|--------------------------------------------------------------------------
| FUND SOURCE OPTIONS
|--------------------------------------------------------------------------
| Reference No. and Fund Source Name are connected.
|--------------------------------------------------------------------------
*/

const FUND_SOURCE_OPTIONS = [
  {
    code: 'MAIN',
    name: 'Main Fund',
  },
  {
    code: 'BGD',
    name: 'BGD Fund',
  },
  {
    code: 'OTHER',
    name: 'Other Funds',
  },
  {
    code: 'DOST',
    name: 'DOST',
  },
  {
    code: 'DA',
    name: 'DA',
  },
  {
    code: 'CHED',
    name: 'CHED',
  },
];

export default function FundSources({
  user,
  onLogout,
  onNavigate,
  activePath,
}) {
  const token = localStorage.getItem('token');

  const currentYear = new Date().getFullYear();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [summary, setSummary] = useState({
    totalSources: 0,
    activeSources: 0,
    inactiveSources: 0,
    totalBudgetCovered: 0,
    totalUtilized: 0,
    totalDisbursed: 0,
    totalBalance: 0,
    fundGroupsCount: 0,
    totalClusters: 0,
    fiscalYear: currentYear,
  });

  const [sources, setSources] = useState([]);

  const [searchTerm, setSearchTerm] = useState('');

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 1,
  });

  const [trendPeriod, setTrendPeriod] = useState('monthly');
  const [trendData, setTrendData] = useState([]);

  /*
  |--------------------------------------------------------------------------
  | FORM MODAL
  |--------------------------------------------------------------------------
  */

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    status: 'Active',
  });

  /*
  |--------------------------------------------------------------------------
  | TRANSACTION PROMPT
  |--------------------------------------------------------------------------
  */

  const [prompt, setPrompt] = useState({
    open: false,
    type: 'info',
    title: '',
    message: '',
    action: null,
    actionText: 'Confirm',
  });

  /*
  |--------------------------------------------------------------------------
  | SHOW PROMPT
  |--------------------------------------------------------------------------
  */

  const showPrompt = ({
    type = 'info',
    title = '',
    message = '',
    action = null,
    actionText = 'Confirm',
  }) => {
    setPrompt({
      open: true,
      type,
      title,
      message,
      action,
      actionText,
    });
  };

  const closePrompt = () => {
    setPrompt((prev) => ({
      ...prev,
      open: false,
    }));
  };

  /*
  |--------------------------------------------------------------------------
  | CONFIRM PROMPT ACTION
  |--------------------------------------------------------------------------
  */

  const handlePromptConfirm = async () => {
    const action = prompt.action;

    closePrompt();

    if (action) {
      await action();
    }
  };

  /*
  |--------------------------------------------------------------------------
  | FORMAT CURRENCY
  |--------------------------------------------------------------------------
  */

  const formatCurrency = (value) => {
    const amount = Number(value || 0);

    return `₱${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatChartCurrency = (value) => {
    const amount = Number(value || 0);

    if (Math.abs(amount) >= 1000000) {
      return `₱${(amount / 1000000).toFixed(1)}M`;
    }

    if (Math.abs(amount) >= 1000) {
      return `₱${(amount / 1000).toFixed(0)}K`;
    }

    return `₱${amount.toFixed(0)}`;
  };

  /*
  |--------------------------------------------------------------------------
  | FETCH SUMMARY
  |--------------------------------------------------------------------------
  */

  const fetchSummary = async () => {
    try {
      setError(null);

      const year = summary.fiscalYear || currentYear;

      const res = await fetch(
        `${API_URL}/fundsources/summary?year=${year}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        throw new Error('Failed to fetch fund sources summary.');
      }

      const data = await res.json();

      setSummary((prev) => ({
        ...prev,
        ...data,
      }));
    } catch (err) {
      console.error('Fund Sources Summary Error:', err);
      setError('Could not load fund sources summary.');
    }
  };

  /*
  |--------------------------------------------------------------------------
  | FETCH FUND SOURCES
  |--------------------------------------------------------------------------
  */

  const fetchSources = async (
    page = 1,
    limit = pagination.limit
  ) => {
    try {
      setLoading(true);
      setError(null);

      const year = summary.fiscalYear || currentYear;

      const res = await fetch(
        `${API_URL}/fundsources?page=${page}&limit=${limit}&year=${year}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        throw new Error('Failed to fetch fund sources.');
      }

      const data = await res.json();

      const list = Array.isArray(data.sources)
        ? data.sources
        : [];

      setSources(list);

      setPagination({
        page: data.currentPage || page,
        limit,
        totalItems: Number(
          data.totalItems || list.length
        ),
        totalPages: Number(
          data.totalPages || 1
        ),
      });
    } catch (err) {
      console.error('Fund Sources Fetch Error:', err);
      setError('Could not load fund sources.');
    } finally {
      setLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | FETCH TREND
  |--------------------------------------------------------------------------
  */

  const fetchTrendData = async (
    period = trendPeriod
  ) => {
    try {
      const year =
        summary.fiscalYear || currentYear;

      const res = await fetch(
        `${API_URL}/fundsources/trend?period=${period}&year=${year}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        throw new Error(
          'Failed to fetch fund sources trend.'
        );
      }

      const data = await res.json();

      setTrendData(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (err) {
      console.error(
        'Fund Sources Trend Error:',
        err
      );

      setTrendData([]);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | INITIAL LOAD
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    fetchSummary();
    fetchSources(1, pagination.limit);
    fetchTrendData('monthly');

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /*
  |--------------------------------------------------------------------------
  | PERIOD CHANGE
  |--------------------------------------------------------------------------
  */

  const handlePeriodChange = (event) => {
    const period = event.target.value;

    setTrendPeriod(period);

    fetchTrendData(period);
  };

  /*
  |--------------------------------------------------------------------------
  | FUND SOURCES BREAKDOWN
  |--------------------------------------------------------------------------
  */

  const breakdownData = useMemo(() => {
    return sources.map((source) => ({
      name:
        source.name ||
        source.code ||
        'Unknown Fund',

      value: Number(
        source.allocated_amount || 0
      ),

      code: source.code || '',
    }));
  }, [sources]);

  /*
  |--------------------------------------------------------------------------
  | FUND CLASSIFICATION
  |--------------------------------------------------------------------------
  */

  const classificationData = useMemo(() => {
    const classificationMap = {};

    sources.forEach((source) => {
      const clusters =
        Array.isArray(source.fund_clusters)
          ? source.fund_clusters
          : [];

      clusters.forEach((cluster) => {
        const clusterName =
          cluster.name ||
          cluster.code ||
          'Unclassified';

        if (!classificationMap[clusterName]) {
          classificationMap[clusterName] = 0;
        }

        const sourceAllocation =
          Number(
            source.allocated_amount || 0
          );

        const clusterCount =
          clusters.length || 1;

        classificationMap[clusterName] +=
          sourceAllocation / clusterCount;
      });
    });

    return Object.entries(
      classificationMap
    )
      .map(([name, value]) => ({
        name,
        value,
      }))
      .sort(
        (a, b) => b.value - a.value
      );
  }, [sources]);

  /*
  |--------------------------------------------------------------------------
  | SEARCH
  |--------------------------------------------------------------------------
  */

  const filteredSources = useMemo(() => {
    const search =
      searchTerm.toLowerCase().trim();

    if (!search) {
      return sources;
    }

    return sources.filter((source) => {
      const code =
        String(
          source.code || ''
        ).toLowerCase();

      const name =
        String(
          source.name || ''
        ).toLowerCase();

      const description =
        String(
          source.description || ''
        ).toLowerCase();

      return (
        code.includes(search) ||
        name.includes(search) ||
        description.includes(search)
      );
    });
  }, [sources, searchTerm]);

  /*
  |--------------------------------------------------------------------------
  | OPEN CREATE MODAL
  |--------------------------------------------------------------------------
  */

  const openCreateModal = () => {
    setEditingId(null);

    setFormData({
      code: '',
      name: '',
      description: '',
      status: 'Active',
    });

    setModalOpen(true);
  };

  /*
  |--------------------------------------------------------------------------
  | OPEN EDIT MODAL
  |--------------------------------------------------------------------------
  */

  const openEditModal = (source) => {
    setEditingId(source.id);

    setFormData({
      code: source.code || '',
      name: source.name || '',
      description: source.description || '',
      status:
        source.status || 'Active',
    });

    setModalOpen(true);
  };

  /*
  |--------------------------------------------------------------------------
  | HANDLE REFERENCE NUMBER CHANGE
  |--------------------------------------------------------------------------
  */

  const handleCodeChange = (event) => {
    const selectedCode =
      event.target.value;

    const selectedSource =
      FUND_SOURCE_OPTIONS.find(
        (item) =>
          item.code === selectedCode
      );

    setFormData((prev) => ({
      ...prev,

      code: selectedCode,

      name:
        selectedSource?.name || '',
    }));
  };

  /*
  |--------------------------------------------------------------------------
  | HANDLE FUND SOURCE NAME CHANGE
  |--------------------------------------------------------------------------
  */

  const handleNameChange = (event) => {
    const selectedName =
      event.target.value;

    const selectedSource =
      FUND_SOURCE_OPTIONS.find(
        (item) =>
          item.name === selectedName
      );

    setFormData((prev) => ({
      ...prev,

      name: selectedName,

      code:
        selectedSource?.code || '',
    }));
  };

  /*
  |--------------------------------------------------------------------------
  | CREATE FUND SOURCE
  |--------------------------------------------------------------------------
  */

  const createFundSource = async () => {
    try {
      setLoading(true);

      const res = await fetch(
        `${API_URL}/fundsources`,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',

            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify({
            code: formData.code,
            name: formData.name,
            description:
              formData.description,
            status: formData.status,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error ||
            'Failed to add fund source.'
        );
      }

      setModalOpen(false);

      await fetchSummary();

      await fetchSources(
        pagination.page,
        pagination.limit
      );

      await fetchTrendData(
        trendPeriod
      );

      showPrompt({
        type: 'success',
        title: 'Fund Source Added',
        message:
          'The fund source has been successfully added to the system.',
        action: null,
        actionText: 'OK',
      });
    } catch (err) {
      console.error(
        'Create Fund Source Error:',
        err
      );

      showPrompt({
        type: 'error',
        title: 'Add Failed',
        message:
          err.message ||
          'Unable to add the fund source.',
        action: null,
        actionText: 'OK',
      });
    } finally {
      setLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | UPDATE FUND SOURCE
  |--------------------------------------------------------------------------
  */

  const updateFundSource = async () => {
    try {
      setLoading(true);

      const res = await fetch(
        `${API_URL}/fundsources/${editingId}`,
        {
          method: 'PUT',

          headers: {
            'Content-Type':
              'application/json',

            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify({
            code: formData.code,
            name: formData.name,
            description:
              formData.description,
            status: formData.status,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error ||
            'Failed to update fund source.'
        );
      }

      setModalOpen(false);

      await fetchSummary();

      await fetchSources(
        pagination.page,
        pagination.limit
      );

      await fetchTrendData(
        trendPeriod
      );

      showPrompt({
        type: 'success',
        title: 'Fund Source Updated',
        message:
          'The fund source has been successfully updated.',
        action: null,
        actionText: 'OK',
      });
    } catch (err) {
      console.error(
        'Update Fund Source Error:',
        err
      );

      showPrompt({
        type: 'error',
        title: 'Update Failed',
        message:
          err.message ||
          'Unable to update the fund source.',
        action: null,
        actionText: 'OK',
      });
    } finally {
      setLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | DELETE FUND SOURCE
  |--------------------------------------------------------------------------
  */

  const deleteFundSource = async (
    source
  ) => {
    try {
      setLoading(true);

      const res = await fetch(
        `${API_URL}/fundsources/${source.id}`,
        {
          method: 'DELETE',

          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error ||
            'Failed to delete fund source.'
        );
      }

      await fetchSummary();

      await fetchSources(
        1,
        pagination.limit
      );

      await fetchTrendData(
        trendPeriod
      );

      showPrompt({
        type: 'success',
        title: 'Fund Source Deleted',
        message:
          'The fund source has been successfully deleted.',
        action: null,
        actionText: 'OK',
      });
    } catch (err) {
      console.error(
        'Delete Fund Source Error:',
        err
      );

      showPrompt({
        type: 'error',
        title: 'Delete Failed',
        message:
          err.message ||
          'Unable to delete the fund source.',
        action: null,
        actionText: 'OK',
      });
    } finally {
      setLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | SAVE BUTTON
  |--------------------------------------------------------------------------
  */

  const handleSave = () => {
    if (
      !formData.code ||
      !formData.name
    ) {
      showPrompt({
        type: 'warning',
        title: 'Incomplete Information',
        message:
          'Please select a Reference No. and Fund Source Name before saving.',
        action: null,
        actionText: 'OK',
      });

      return;
    }

    if (editingId) {
      showPrompt({
        type: 'warning',
        title: 'Update Fund Source?',
        message:
          `Are you sure you want to update "${formData.name}"?`,
        action: updateFundSource,
        actionText: 'Update',
      });
    } else {
      showPrompt({
        type: 'warning',
        title: 'Add Fund Source?',
        message:
          `Are you sure you want to add "${formData.name}" as a fund source?`,
        action: createFundSource,
        actionText: 'Add',
      });
    }
  };

  /*
  |--------------------------------------------------------------------------
  | DELETE BUTTON CONFIRMATION
  |--------------------------------------------------------------------------
  */

  const handleDeleteClick = (source) => {
    showPrompt({
      type: 'danger',
      title: 'Delete Fund Source?',
      message:
        `Are you sure you want to delete "${source.name}"? This action cannot be undone.`,
      action: () =>
        deleteFundSource(source),
      actionText: 'Delete',
    });
  };

  /*
  |--------------------------------------------------------------------------
  | TOOLTIP
  |--------------------------------------------------------------------------
  */

  const CustomTooltip = ({
    active,
    payload,
  }) => {
    if (
      !active ||
      !payload ||
      payload.length === 0
    ) {
      return null;
    }

    const data =
      payload[0]?.payload || {};

    return (
      <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg">
        <p className="font-semibold text-slate-800 text-xs mb-1">
          {data.name || data.label}
        </p>

        {payload.map(
          (item, index) => (
            <p
              key={index}
              className="text-xs font-medium"
              style={{
                color:
                  item.color ||
                  item.stroke ||
                  '#334155',
              }}
            >
              {item.name}:{' '}
              {formatCurrency(
                item.value
              )}
            </p>
          )
        )}
      </div>
    );
  };

  const hasBreakdownData =
    breakdownData.length > 0;

  const hasClassificationData =
    classificationData.length > 0;

  /*
  |--------------------------------------------------------------------------
  | PROMPT ICON
  |--------------------------------------------------------------------------
  */

  const getPromptIcon = () => {
    if (
      prompt.type === 'danger' ||
      prompt.type === 'error'
    ) {
      return (
        <div className="w-11 h-11 rounded-full bg-red-100 flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-red-600" />
        </div>
      );
    }

    if (
      prompt.type === 'warning'
    ) {
      return (
        <div className="w-11 h-11 rounded-full bg-amber-100 flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
        </div>
      );
    }

    if (
      prompt.type === 'success'
    ) {
      return (
        <div className="w-11 h-11 rounded-full bg-emerald-100 flex items-center justify-center">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
        </div>
      );
    }

    return (
      <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center">
        <Info className="w-5 h-5 text-blue-600" />
      </div>
    );
  };

  /*
  |--------------------------------------------------------------------------
  | PROMPT BUTTON COLOR
  |--------------------------------------------------------------------------
  */

  const getPromptButtonClass = () => {
    if (
      prompt.type === 'danger' ||
      prompt.type === 'error'
    ) {
      return 'bg-red-600 hover:bg-red-700';
    }

    if (
      prompt.type === 'warning'
    ) {
      return 'bg-blue-600 hover:bg-blue-700';
    }

    if (
      prompt.type === 'success'
    ) {
      return 'bg-blue-600 hover:bg-blue-700';
    }

    return 'bg-blue-600 hover:bg-blue-700';
  };

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <Layout
      user={user}
      onLogout={onLogout}
      activePath={activePath}
      onNavigate={onNavigate}
    >

      {/* ERROR */}
      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
          ⚠️ {error}
        </div>
      )}

      {/* ================================================================
          SUMMARY CARDS
      ================================================================= */}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">

        {/* TOTAL SOURCES */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-start justify-between">

          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Sources
            </p>

            <p className="text-2xl font-extrabold text-slate-900 mt-1">
              {summary.totalSources}
            </p>
          </div>

          <div className="p-2.5 bg-blue-600 rounded-xl text-white">
            <Building2 className="w-5 h-5" />
          </div>

        </div>

        {/* ACTIVE */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-start justify-between">

          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Active
            </p>

            <p className="text-2xl font-extrabold text-emerald-600 mt-1">
              {summary.activeSources}
            </p>
          </div>

          <div className="p-2.5 bg-emerald-600 rounded-xl text-white">
            <CheckCircle className="w-5 h-5" />
          </div>

        </div>

        {/* INACTIVE */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-start justify-between">

          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Inactive
            </p>

            <p className="text-2xl font-extrabold text-red-500 mt-1">
              {summary.inactiveSources}
            </p>
          </div>

          <div className="p-2.5 bg-red-500 rounded-xl text-white">
            <XCircle className="w-5 h-5" />
          </div>

        </div>

        {/* BUDGET COVERED */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-start justify-between">

          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Budget Covered
            </p>

            <p className="text-lg font-extrabold text-slate-900 mt-1">
              {formatCurrency(
                summary.totalBudgetCovered
              )}
            </p>
          </div>

          <div className="p-2.5 bg-amber-500 rounded-xl text-white">
            <DollarSign className="w-5 h-5" />
          </div>

        </div>

        {/* FUND GROUPS */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-start justify-between">

          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Fund Groups
            </p>

            <p className="text-2xl font-extrabold text-slate-900 mt-1">
              {summary.fundGroupsCount}
            </p>

            <p className="text-[10px] text-slate-400">
              Fiscal Year{' '}
              {summary.fiscalYear}
            </p>
          </div>

          <div className="p-2.5 bg-indigo-900 rounded-xl text-white">
            <Layers className="w-5 h-5" />
          </div>

        </div>

      </div>

      {/* ================================================================
          CHARTS
      ================================================================= */}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 mb-6">

        {/* FUND SOURCES BREAKDOWN */}

        <div className="xl:col-span-4 bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between">

          <div>

            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2 mb-3">
              <PieChartIcon className="w-4 h-4" />
              Fund Sources Breakdown
            </h3>

            <div className="h-56 w-full">

              {hasBreakdownData ? (

                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >

                  <PieChart>

                    <Pie
                      data={breakdownData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                      nameKey="name"
                    >

                      {breakdownData.map(
                        (entry, index) => (
                          <Cell
                            key={`breakdown-${index}`}
                            fill={
                              COLORS[
                                index %
                                  COLORS.length
                              ]
                            }
                          />
                        )
                      )}

                    </Pie>

                    <Tooltip
                      content={
                        <CustomTooltip />
                      }
                    />

                    <Legend
                      wrapperStyle={{
                        fontSize: '10px',
                      }}
                    />

                  </PieChart>

                </ResponsiveContainer>

              ) : (

                <div className="flex items-center justify-center h-full text-slate-400 text-xs font-medium">
                  No fund source data available.
                </div>

              )}

            </div>

          </div>

          <button
            type="button"
            className="mt-2 w-full py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1 transition"
          >
            View Breakdown Details
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

        </div>

        {/* FUND SOURCES TREND */}

        <div className="xl:col-span-5 bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between">

          <div>

            <div className="flex items-center justify-between mb-3">

              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Fund Sources Trend
              </h3>

              <div className="relative">

                <select
                  value={trendPeriod}
                  onChange={
                    handlePeriodChange
                  }
                  className="appearance-none bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 py-1 pl-3 pr-7 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                >

                  <option value="monthly">
                    Monthly
                  </option>

                  <option value="quarterly">
                    Quarterly
                  </option>

                  <option value="yearly">
                    Yearly
                  </option>

                </select>

                <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />

              </div>

            </div>

            <div className="h-52 w-full">

              {trendData.length > 0 ? (

                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >

                  <LineChart
                    data={trendData}
                    margin={{
                      top: 10,
                      right: 10,
                      left: 0,
                      bottom: 0,
                    }}
                  >

                    <CartesianGrid
                      strokeDasharray="2 2"
                      vertical={false}
                      stroke="#f1f5f9"
                    />

                    <XAxis
                      dataKey="label"
                      tick={{
                        fontSize: 11,
                        fill: '#64748b',
                      }}
                    />

                    <YAxis
                      tickFormatter={
                        formatChartCurrency
                      }
                      tick={{
                        fontSize: 11,
                        fill: '#64748b',
                      }}
                    />

                    <Tooltip
                      content={
                        <CustomTooltip />
                      }
                    />

                    <Line
                      type="monotone"
                      dataKey="total_fund_sources"
                      stroke="#2563eb"
                      strokeWidth={2}
                      dot={{
                        r: 3,
                        fill: '#2563eb',
                      }}
                      name="Total Fund Sources"
                    />

                    <Line
                      type="monotone"
                      dataKey="available_balance"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{
                        r: 3,
                        fill: '#10b981',
                      }}
                      name="Available Balance"
                    />

                  </LineChart>

                </ResponsiveContainer>

              ) : (

                <div className="flex items-center justify-center h-full text-slate-400 text-xs font-medium">
                  No trend data available.
                </div>

              )}

            </div>

          </div>

          <div className="flex items-center justify-center gap-6 mt-2 pt-2 border-t border-slate-100 text-[11px] font-medium text-slate-600">

            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
              <span>Total Fund Sources</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              <span>Available Balance</span>
            </div>

          </div>

        </div>

        {/* BY FUND CLASSIFICATION */}

        <div className="xl:col-span-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between">

          <div>

            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2 mb-3">
              <BarChart3 className="w-4 h-4" />
              By Fund Classification
            </h3>

            <div className="h-56 w-full">

              {hasClassificationData ? (

                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >

                  <PieChart>

                    <Pie
                      data={
                        classificationData
                      }
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={68}
                      paddingAngle={3}
                      dataKey="value"
                      nameKey="name"
                    >

                      {classificationData.map(
                        (entry, index) => (
                          <Cell
                            key={`classification-${index}`}
                            fill={
                              COLORS[
                                index %
                                  COLORS.length
                              ]
                            }
                          />
                        )
                      )}

                    </Pie>

                    <Tooltip
                      content={
                        <CustomTooltip />
                      }
                    />

                    <Legend
                      wrapperStyle={{
                        fontSize: '9px',
                      }}
                    />

                  </PieChart>

                </ResponsiveContainer>

              ) : (

                <div className="flex items-center justify-center h-full text-slate-400 text-xs font-medium text-center px-4">
                  No fund classification data available.
                </div>

              )}

            </div>

          </div>

          <button
            type="button"
            className="mt-2 w-full py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1 transition"
          >
            View All Classifications
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

        </div>

      </div>

      {/* ================================================================
          FUND SOURCES LIST
      ================================================================= */}

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">

        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">

          <div>

            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Fund Sources List
            </h3>

            <p className="text-[11px] text-slate-400 mt-1">
              Manage and monitor all fund sources of the university.
            </p>

          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">

            {/* SEARCH */}

            <div className="relative flex-1 sm:flex-initial min-w-[200px]">

              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />

              <input
                type="text"
                placeholder="Search fund source..."
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(
                    event.target.value
                  )
                }
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />

            </div>

            {/* RESET */}

            <button
              type="button"
              onClick={() => {
                setSearchTerm('');

                fetchSources(
                  1,
                  pagination.limit
                );
              }}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg border border-slate-200"
              title="Refresh"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* ADD */}

            <button
              type="button"
              onClick={
                openCreateModal
              }
              className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition shadow-sm flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Add Fund Source
            </button>

          </div>

        </div>

        {/* TABLE */}

        <div className="overflow-x-auto">

          <table className="w-full text-left border-collapse text-xs">

            <thead>

              <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200/80">

                <th className="py-3 px-4">
                  REFERENCE NO.
                </th>

                <th className="py-3 px-4">
                  FUND SOURCE NAME
                </th>

                <th className="py-3 px-4">
                  FUND CLASSIFICATION
                </th>

                <th className="py-3 px-4">
                  DESCRIPTION
                </th>

                <th className="py-3 px-4 text-right">
                  TOTAL ALLOCATION
                </th>

                <th className="py-3 px-4 text-right">
                  AVAILABLE BALANCE
                </th>

                <th className="py-3 px-4 text-center">
                  STATUS
                </th>

                <th className="py-3 px-4 text-center">
                  ACTIONS
                </th>

              </tr>

            </thead>

            <tbody className="divide-y divide-slate-100">

              {loading ? (

                <tr>

                  <td
                    colSpan="8"
                    className="py-8 text-center text-slate-400"
                  >
                    Loading fund sources...
                  </td>

                </tr>

              ) : filteredSources.length === 0 ? (

                <tr>

                  <td
                    colSpan="8"
                    className="py-8 text-center text-slate-400"
                  >
                    No fund sources found.
                  </td>

                </tr>

              ) : (

                filteredSources.map(
                  (source) => {

                    const clusters =
                      Array.isArray(
                        source.fund_clusters
                      )
                        ? source.fund_clusters
                        : [];

                    const classificationText =
                      clusters.length > 0
                        ? clusters
                            .map(
                              (cluster) =>
                                `${
                                  cluster.code ||
                                  ''
                                }${
                                  cluster.code &&
                                  cluster.name
                                    ? ' - '
                                    : ''
                                }${
                                  cluster.name ||
                                  ''
                                }`
                            )
                            .filter(Boolean)
                            .join(', ')
                        : '—';

                    return (

                      <tr
                        key={source.id}
                        className="hover:bg-slate-50/80 transition"
                      >

                        {/* REFERENCE */}

                        <td className="py-3 px-4 font-mono font-bold text-slate-700">
                          {source.code}
                        </td>

                        {/* NAME */}

                        <td className="py-3 px-4 font-semibold text-slate-800">
                          {source.name}
                        </td>

                        {/* CLASSIFICATION */}

                        <td className="py-3 px-4 text-slate-600 max-w-[300px]">

                          <div
                            className="truncate"
                            title={
                              classificationText
                            }
                          >
                            {
                              classificationText
                            }
                          </div>

                        </td>

                        {/* DESCRIPTION */}

                        <td className="py-3 px-4 text-slate-500 max-w-[220px]">

                          <div
                            className="truncate"
                            title={
                              source.description ||
                              ''
                            }
                          >
                            {source.description ||
                              '—'}
                          </div>

                        </td>

                        {/* TOTAL ALLOCATION */}

                        <td className="py-3 px-4 text-right font-bold text-slate-800 whitespace-nowrap">
                          {formatCurrency(
                            source.allocated_amount
                          )}
                        </td>

                        {/* AVAILABLE BALANCE */}

                        <td className="py-3 px-4 text-right font-bold text-slate-800 whitespace-nowrap">
                          {formatCurrency(
                            source.remaining_balance
                          )}
                        </td>

                        {/* STATUS */}

                        <td className="py-3 px-4 text-center">

                          <span
                            className={`inline-block px-2.5 py-0.5 text-[10px] font-bold rounded-full ${
                              source.status ===
                              'Active'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {source.status ||
                              (source.is_active
                                ? 'Active'
                                : 'Inactive')}
                          </span>

                        </td>

                        {/* ACTIONS */}

                        <td className="py-3 px-4">

                          <div className="flex items-center justify-center gap-1.5">

                            {/* EDIT */}

                            <button
                              type="button"
                              onClick={() =>
                                openEditModal(
                                  source
                                )
                              }
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                              title="Edit fund source"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* DELETE */}

                            <button
                              type="button"
                              onClick={() =>
                                handleDeleteClick(
                                  source
                                )
                              }
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                              title="Delete fund source"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>

                          </div>

                        </td>

                      </tr>

                    );
                  }
                )

              )}

            </tbody>

          </table>

        </div>

        {/* PAGINATION */}

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-100">

          <p className="text-xs text-slate-500">

            Showing{' '}

            <span className="font-semibold text-slate-700">
              {filteredSources.length}
            </span>{' '}

            of{' '}

            <span className="font-semibold text-slate-700">
              {pagination.totalItems}
            </span>{' '}

            fund sources

          </p>

          <div className="flex items-center gap-2">

            <button
              type="button"
              disabled={
                pagination.page <= 1
              }
              onClick={() =>
                fetchSources(
                  pagination.page - 1,
                  pagination.limit
                )
              }
              className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
            >
              ‹
            </button>

            <span className="text-xs text-slate-600">

              Page{' '}

              <span className="font-semibold">
                {pagination.page}
              </span>{' '}

              of{' '}

              <span className="font-semibold">
                {pagination.totalPages}
              </span>

            </span>

            <button
              type="button"
              disabled={
                pagination.page >=
                pagination.totalPages
              }
              onClick={() =>
                fetchSources(
                  pagination.page + 1,
                  pagination.limit
                )
              }
              className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
            >
              ›
            </button>

          </div>

        </div>

      </div>

      {/* ================================================================
          CREATE / EDIT MODAL
      ================================================================= */}

      {modalOpen && (

        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">

          <div className="bg-white w-full max-w-lg rounded-xl shadow-xl">

            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">

              <div>

                <h2 className="text-sm font-bold text-slate-800">

                  {editingId
                    ? 'Edit Fund Source'
                    : 'Add Fund Source'}

                </h2>

                <p className="text-xs text-slate-400 mt-1">

                  {editingId
                    ? 'Update the fund source information.'
                    : 'Select the fund source information.'}

                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setModalOpen(false)
                }
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>

            </div>

            <div className="p-5 space-y-4">

              {/* REFERENCE NO. */}

              <div>

                <label className="block text-xs font-semibold text-slate-600 mb-1">

                  Reference No.

                </label>

                <div className="relative">

                  <select
                    value={formData.code}
                    onChange={
                      handleCodeChange
                    }
                    className="appearance-none w-full px-3 py-2 pr-9 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                  >

                    <option value="">
                      Select Reference No.
                    </option>

                    {FUND_SOURCE_OPTIONS.map(
                      (item) => (
                        <option
                          key={item.code}
                          value={item.code}
                        >
                          {item.code}
                        </option>
                      )
                    )}

                  </select>

                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />

                </div>

              </div>

              {/* FUND SOURCE NAME */}

              <div>

                <label className="block text-xs font-semibold text-slate-600 mb-1">

                  Fund Source Name

                </label>

                <div className="relative">

                  <select
                    value={formData.name}
                    onChange={
                      handleNameChange
                    }
                    className="appearance-none w-full px-3 py-2 pr-9 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                  >

                    <option value="">
                      Select Fund Source
                    </option>

                    {FUND_SOURCE_OPTIONS.map(
                      (item) => (
                        <option
                          key={item.code}
                          value={item.name}
                        >
                          {item.name}
                        </option>
                      )
                    )}

                  </select>

                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />

                </div>

              </div>

              {/* DESCRIPTION */}

              <div>

                <label className="block text-xs font-semibold text-slate-600 mb-1">

                  Description

                </label>

                <textarea
                  rows="3"
                  value={
                    formData.description
                  }
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      description:
                        event.target.value,
                    })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                  placeholder="Description"
                />

              </div>

              {/* STATUS */}

              <div>

                <label className="block text-xs font-semibold text-slate-600 mb-1">

                  Status

                </label>

                <div className="relative">

                  <select
                    value={
                      formData.status
                    }
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        status:
                          event.target.value,
                      })
                    }
                    className="appearance-none w-full px-3 py-2 pr-9 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                  >

                    <option value="Active">
                      Active
                    </option>

                    <option value="Inactive">
                      Inactive
                    </option>

                  </select>

                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />

                </div>

              </div>

            </div>

            <div className="px-5 py-4 border-t border-slate-100 flex justify-end gap-2">

              <button
                type="button"
                onClick={() =>
                  setModalOpen(false)
                }
                className="px-4 py-2 text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={
                  loading ||
                  !formData.code ||
                  !formData.name
                }
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingId
                  ? 'Update Fund Source'
                  : 'Save Fund Source'}
              </button>

            </div>

          </div>

        </div>

      )}

      {/* ================================================================
          TRANSACTION PROMPT MODAL
      ================================================================= */}

      {prompt.open && (

        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">

          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden">

            <div className="p-6">

              <div className="flex flex-col items-center text-center">

                {getPromptIcon()}

                <h2 className="mt-4 text-base font-bold text-slate-800">

                  {prompt.title}

                </h2>

                <p className="mt-2 text-xs leading-5 text-slate-500">

                  {prompt.message}

                </p>

              </div>

            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-center gap-2">

              {prompt.action ? (

                <>

                  <button
                    type="button"
                    onClick={
                      closePrompt
                    }
                    className="px-4 py-2 text-xs font-semibold text-slate-600 border border-slate-200 bg-white rounded-lg hover:bg-slate-100 transition"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={
                      handlePromptConfirm
                    }
                    className={`px-4 py-2 text-xs font-semibold text-white rounded-lg transition ${getPromptButtonClass()}`}
                  >
                    {prompt.actionText}
                  </button>

                </>

              ) : (

                <button
                  type="button"
                  onClick={
                    closePrompt
                  }
                  className={`px-5 py-2 text-xs font-semibold text-white rounded-lg transition ${getPromptButtonClass()}`}
                >
                  {prompt.actionText || 'OK'}
                </button>

              )}

            </div>

          </div>

        </div>

      )}

    </Layout>
  );
}