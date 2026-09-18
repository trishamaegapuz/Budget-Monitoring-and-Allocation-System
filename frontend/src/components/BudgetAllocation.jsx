import React, { useEffect, useMemo, useState } from 'react';
import Layout from './layout/Layout';
import Toast from './Toast';

import {
  Wallet,
  HandCoins,
  PieChart as PieChartIcon,
  FileSpreadsheet,
  Search,
  RotateCcw,
  Plus,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const API_URL = 'http://localhost:5000/api';

export default function BudgetAllocation({
  user,
  onLogout,
  onNavigate,
  activePath,
}) {
  // ============================================================
  // AUTH
  // ============================================================

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');

    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };

  // ============================================================
  // STATE
  // ============================================================

  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  const [allocations, setAllocations] = useState([]);

  // ============================================================
  // MASTER DATA
  // ============================================================

  const [masterData, setMasterData] = useState({
    fundSources: [],
    fundClusters: [],
    campuses: [],
    responsibilityCenters: [],
    wfpSources: [],
  });

  const [masterDataLoading, setMasterDataLoading] = useState(false);

  // ============================================================
  // FILTERS
  // ============================================================

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');

  const [fiscalYear, setFiscalYear] = useState(
    String(new Date().getFullYear())
  );

  // ============================================================
  // SUMMARY
  // ============================================================

  const [summary, setSummary] = useState({
    total_allocation: 0,
    total_utilized: 0,
    total_disbursed: 0,
    total_remaining: 0,
    allocation_count: 0,
    utilization_rate: 0,
  });

  // ============================================================
  // CHART
  // ============================================================

  const [fundChartData, setFundChartData] = useState([]);

  // ============================================================
  // PAGINATION
  // ============================================================

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 1,
  });

  // ============================================================
  // MODAL
  // ============================================================

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // ============================================================
  // FORM
  // ============================================================

  const emptyForm = {
    fiscal_year: new Date().getFullYear(),
    fund_source_id: '',
    fund_cluster_id: '',
    campus_id: '',
    responsibility_center_id: '',
    wfp_source_id: '',
    allocation_amount: '',
    utilized_amount: '0',
    disbursed_amount: '0',
  };

  const [form, setForm] = useState(emptyForm);

  // ============================================================
  // TOAST
  // ============================================================

  const showToast = (message, type = 'success') => {
    setToast({
      message,
      type,
    });
  };

  // ============================================================
  // CURRENCY
  // ============================================================

  const formatCurrency = (value) => {
    const number = Number(value) || 0;

    return `₱${number.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // ============================================================
  // STATUS
  // ============================================================

  const getAllocationStatus = (item) => {
    const allocation = Number(item.allocation_amount) || 0;
    const utilized = Number(item.utilized_amount) || 0;
    const disbursed = Number(item.disbursed_amount) || 0;

    if (allocation <= 0) {
      return 'For Allocation';
    }

    if (utilized === 0 && disbursed === 0) {
      return 'For Allocation';
    }

    if (
      utilized >= allocation &&
      disbursed >= allocation
    ) {
      return 'Fully Utilized';
    }

    return 'Partially Utilized';
  };

  // ============================================================
  // FETCH MASTER DATA
  // ============================================================

  const fetchMasterData = async () => {
    setMasterDataLoading(true);

    try {
      const res = await fetch(
        `${API_URL}/budget/master-data`,
        {
          method: 'GET',
          headers: getAuthHeaders(),
        }
      );

      const contentType =
        res.headers.get('content-type') || '';

      if (!contentType.includes('application/json')) {
        throw new Error(
          `Master data endpoint returned ${res.status} instead of JSON.`
        );
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message ||
            data.error ||
            'Failed to load master data.'
        );
      }

      setMasterData({
        fundSources:
          Array.isArray(data.data?.fundSources)
            ? data.data.fundSources
            : [],

        fundClusters:
          Array.isArray(data.data?.fundClusters)
            ? data.data.fundClusters
            : [],

        campuses:
          Array.isArray(data.data?.campuses)
            ? data.data.campuses
            : [],

        responsibilityCenters:
          Array.isArray(
            data.data?.responsibilityCenters
          )
            ? data.data.responsibilityCenters
            : [],

        wfpSources:
          Array.isArray(data.data?.wfpSources)
            ? data.data.wfpSources
            : [],
      });
    } catch (err) {
      console.error(
        'Master data error:',
        err
      );

      setError(
        err.message ||
          'Could not load master data.'
      );
    } finally {
      setMasterDataLoading(false);
    }
  };

  // ============================================================
  // FILTERED FUND CLUSTERS
  // ============================================================

  const availableFundClusters = useMemo(() => {
    if (!form.fund_source_id) {
      return masterData.fundClusters;
    }

    return masterData.fundClusters.filter(
      (cluster) =>
        cluster.fund_source_id === null ||
        Number(cluster.fund_source_id) ===
          Number(form.fund_source_id)
    );
  }, [
    masterData.fundClusters,
    form.fund_source_id,
  ]);

  // ============================================================
  // CALCULATE SUMMARY FROM ALLOCATIONS
  // ============================================================
  //
  // IMPORTANT:
  // We no longer call:
  //
  // /api/budget/summary
  //
  // because that route currently returns 404.
  //
  // Instead, the summary is calculated from the same
  // allocation records already returned by:
  //
  // /api/budget/allocations?year=YYYY
  //
  // ============================================================

  const calculateSummary = (allocationRows) => {
    const rows = Array.isArray(allocationRows)
      ? allocationRows
      : [];

    let totalAllocation = 0;
    let totalUtilized = 0;
    let totalDisbursed = 0;

    const fundMap = {};

    rows.forEach((item) => {
      const allocation =
        Number(item.allocation_amount) || 0;

      const utilized =
        Number(item.utilized_amount) || 0;

      const disbursed =
        Number(item.disbursed_amount) || 0;

      totalAllocation += allocation;
      totalUtilized += utilized;
      totalDisbursed += disbursed;

      const fundName =
        item.fund_source_name ||
        item.fund_source_code ||
        item.fund_source_id ||
        'Fund';

      if (!fundMap[fundName]) {
        fundMap[fundName] = 0;
      }

      fundMap[fundName] += allocation;
    });

    const totalRemaining =
      totalAllocation - totalUtilized;

    const utilizationRate =
      totalAllocation > 0
        ? (totalUtilized / totalAllocation) * 100
        : 0;

    const chartData = Object.entries(
      fundMap
    ).map(([name, amount]) => ({
      name,
      amount: amount / 1000000,
    }));

    setSummary({
      total_allocation: totalAllocation,
      total_utilized: totalUtilized,
      total_disbursed: totalDisbursed,
      total_remaining: totalRemaining,
      allocation_count: rows.length,
      utilization_rate: utilizationRate,
    });

    setFundChartData(chartData);
  };

  // ============================================================
  // FETCH ALLOCATIONS
  // ============================================================

  const fetchAllocations = async () => {
    setLoading(true);

    try {
      const res = await fetch(
        `${API_URL}/budget/allocations?year=${encodeURIComponent(
          fiscalYear
        )}`,
        {
          method: 'GET',
          headers: getAuthHeaders(),
        }
      );

      const contentType =
        res.headers.get('content-type') || '';

      if (!contentType.includes('application/json')) {
        throw new Error(
          `Allocations endpoint returned ${res.status} instead of JSON.`
        );
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message ||
            data.error ||
            'Failed to fetch allocations.'
        );
      }

      /*
       * Backend expected response:
       *
       * {
       *   success: true,
       *   data: [...]
       * }
       */

      const allocationRows = Array.isArray(
        data.data
      )
        ? data.data
        : [];

      setAllocations(allocationRows);

      // --------------------------------------------------------
      // CALCULATE SUMMARY HERE
      // --------------------------------------------------------

      calculateSummary(allocationRows);

      setPagination((prev) => ({
        ...prev,
        page: 1,
        totalItems:
          allocationRows.length,
        totalPages:
          Math.max(
            1,
            Math.ceil(
              allocationRows.length /
                prev.limit
            )
          ),
      }));
    } catch (err) {
      console.error(
        'Allocations error:',
        err
      );

      setAllocations([]);

      setSummary({
        total_allocation: 0,
        total_utilized: 0,
        total_disbursed: 0,
        total_remaining: 0,
        allocation_count: 0,
        utilization_rate: 0,
      });

      setFundChartData([]);

      setError(
        err.message ||
          'Could not load allocation list.'
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    setError('');

    fetchMasterData();
  }, []);

  // ============================================================
  // FISCAL YEAR LOAD
  // ============================================================

  useEffect(() => {
    setError('');

    /*
     * IMPORTANT:
     *
     * We intentionally DO NOT call fetchSummary()
     * anymore.
     *
     * fetchAllocations() now calculates the summary.
     */

    fetchAllocations();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fiscalYear]);

  // ============================================================
  // RESET FILTERS
  // ============================================================

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedStatus('All');
  };

  // ============================================================
  // FORM CHANGE
  // ============================================================

  const handleFormChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => {
      const updated = {
        ...prev,
        [name]: value,
      };

      if (name === 'fund_source_id') {
        updated.fund_cluster_id = '';
      }

      return updated;
    });
  };

  // ============================================================
  // NEW ALLOCATION
  // ============================================================

  const handleNewAllocation = () => {
    setEditingId(null);

    setForm({
      ...emptyForm,
      fiscal_year: Number(fiscalYear),
    });

    setShowModal(true);
  };

  // ============================================================
  // EDIT
  // ============================================================

  const handleEdit = (item) => {
    setEditingId(item.id);

    setForm({
      fiscal_year:
        item.fiscal_year ??
        Number(fiscalYear),

      fund_source_id:
        item.fund_source_id
          ? String(item.fund_source_id)
          : '',

      fund_cluster_id:
        item.fund_cluster_id
          ? String(item.fund_cluster_id)
          : '',

      campus_id:
        item.campus_id
          ? String(item.campus_id)
          : '',

      responsibility_center_id:
        item.responsibility_center_id
          ? String(
              item.responsibility_center_id
            )
          : '',

      wfp_source_id:
        item.wfp_source_id
          ? String(item.wfp_source_id)
          : '',

      allocation_amount:
        item.allocation_amount ?? '',

      utilized_amount:
        item.utilized_amount ?? 0,

      disbursed_amount:
        item.disbursed_amount ?? 0,
    });

    setShowModal(true);
  };

  // ============================================================
  // CLOSE MODAL
  // ============================================================

  const handleCloseModal = () => {
    if (formLoading) {
      return;
    }

    setShowModal(false);
    setEditingId(null);

    setForm({
      ...emptyForm,
      fiscal_year: Number(fiscalYear),
    });
  };

  // ============================================================
  // SAVE ALLOCATION
  // ============================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setFormLoading(true);
    setError('');

    try {
      // --------------------------------------------------------
      // BASIC VALIDATION
      // --------------------------------------------------------

      if (!form.fiscal_year) {
        throw new Error(
          'Fiscal year is required.'
        );
      }

      if (!form.fund_source_id) {
        throw new Error(
          'Fund source is required.'
        );
      }

      if (!form.fund_cluster_id) {
        throw new Error(
          'Fund cluster is required.'
        );
      }

      if (!form.campus_id) {
        throw new Error(
          'Campus is required.'
        );
      }

      if (!form.responsibility_center_id) {
        throw new Error(
          'Responsibility center is required.'
        );
      }

      if (!form.wfp_source_id) {
        throw new Error(
          'WFP source is required.'
        );
      }

      const allocationAmount =
        Number(form.allocation_amount);

      const utilizedAmount =
        Number(form.utilized_amount);

      const disbursedAmount =
        Number(form.disbursed_amount);

      if (
        !Number.isFinite(
          allocationAmount
        ) ||
        allocationAmount <= 0
      ) {
        throw new Error(
          'Allocation amount must be greater than zero.'
        );
      }

      if (
        !Number.isFinite(
          utilizedAmount
        ) ||
        utilizedAmount < 0
      ) {
        throw new Error(
          'Utilized amount cannot be negative.'
        );
      }

      if (
        !Number.isFinite(
          disbursedAmount
        ) ||
        disbursedAmount < 0
      ) {
        throw new Error(
          'Disbursed amount cannot be negative.'
        );
      }

      if (
        utilizedAmount >
        allocationAmount
      ) {
        throw new Error(
          'Utilized amount cannot exceed allocation amount.'
        );
      }

      if (
        disbursedAmount >
        allocationAmount
      ) {
        throw new Error(
          'Disbursed amount cannot exceed allocation amount.'
        );
      }

      // --------------------------------------------------------
      // PAYLOAD
      // --------------------------------------------------------

      const payload = {
        fiscal_year:
          Number(form.fiscal_year),

        fund_source_id:
          Number(form.fund_source_id),

        fund_cluster_id:
          Number(form.fund_cluster_id),

        campus_id:
          Number(form.campus_id),

        responsibility_center_id:
          Number(
            form.responsibility_center_id
          ),

        wfp_source_id:
          Number(form.wfp_source_id),

        allocation_amount:
          allocationAmount,
      };

      console.log(
        'Submitting allocation:',
        payload
      );

      // --------------------------------------------------------
      // CREATE / UPDATE
      // --------------------------------------------------------

      const url = editingId
        ? `${API_URL}/budget/allocations/${editingId}`
        : `${API_URL}/budget/allocations`;

      const method = editingId
        ? 'PUT'
        : 'POST';

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const contentType =
        res.headers.get('content-type') || '';

      if (!contentType.includes('application/json')) {
        throw new Error(
          `Server returned ${res.status} instead of JSON.`
        );
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message ||
            data.error ||
            'Failed to save allocation.'
        );
      }

      showToast(
        editingId
          ? 'Allocation updated successfully.'
          : 'Allocation created successfully.',
        'success'
      );

      setShowModal(false);
      setEditingId(null);

      setForm({
        ...emptyForm,
        fiscal_year: Number(fiscalYear),
      });

      /*
       * Only reload allocations.
       *
       * fetchAllocations() automatically recalculates
       * the summary and chart.
       */

      await fetchAllocations();
    } catch (err) {
      console.error(
        'Save allocation error:',
        err
      );

      showToast(
        err.message ||
          'Failed to save allocation.',
        'error'
      );
    } finally {
      setFormLoading(false);
    }
  };

  // ============================================================
  // DELETE
  // ============================================================

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this allocation?'
    );

    if (!confirmed) {
      return;
    }

    try {
      const res = await fetch(
        `${API_URL}/budget/allocations/${id}`,
        {
          method: 'DELETE',
          headers: getAuthHeaders(),
        }
      );

      const contentType =
        res.headers.get('content-type') || '';

      if (!contentType.includes('application/json')) {
        throw new Error(
          `Server returned ${res.status} instead of JSON.`
        );
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message ||
            data.error ||
            'Failed to delete allocation.'
        );
      }

      showToast(
        'Allocation deleted successfully.',
        'success'
      );

      /*
       * fetchAllocations() also refreshes
       * the summary and chart.
       */

      await fetchAllocations();
    } catch (err) {
      console.error(
        'Delete allocation error:',
        err
      );

      showToast(
        err.message ||
          'Failed to delete allocation.',
        'error'
      );
    }
  };

  // ============================================================
  // FILTERED ALLOCATIONS
  // ============================================================

  const filteredAllocations = useMemo(() => {
    const search =
      searchTerm
        .toLowerCase()
        .trim();

    return allocations.filter(
      (item) => {
        const status =
          getAllocationStatus(item);

        const searchableText = [
          item.id,
          item.fiscal_year,

          item.fund_source_id,
          item.fund_source_name,
          item.fund_source_code,

          item.fund_cluster_id,
          item.fund_cluster_name,
          item.fund_cluster_code,

          item.campus_id,
          item.campus_name,
          item.campus_code,

          item.responsibility_center_id,
          item.responsibility_center_name,
          item.responsibility_center_code,

          item.wfp_source_id,
          item.wfp_source_name,
          item.wfp_source_code,
        ]
          .filter(
            (value) =>
              value !== null &&
              value !== undefined &&
              value !== ''
          )
          .join(' ')
          .toLowerCase();

        const matchesSearch =
          !search ||
          searchableText.includes(
            search
          );

        const matchesStatus =
          selectedStatus === 'All' ||
          status === selectedStatus;

        return (
          matchesSearch &&
          matchesStatus
        );
      }
    );
  }, [
    allocations,
    searchTerm,
    selectedStatus,
  ]);

  // ============================================================
  // PAGINATED DISPLAY
  // ============================================================

  const paginatedAllocations = useMemo(() => {
    const start =
      (pagination.page - 1) *
      pagination.limit;

    const end =
      start + pagination.limit;

    return filteredAllocations.slice(
      start,
      end
    );
  }, [
    filteredAllocations,
    pagination.page,
    pagination.limit,
  ]);

  // ============================================================
  // UPDATE PAGINATION WHEN FILTER CHANGES
  // ============================================================

  useEffect(() => {
    const totalItems =
      filteredAllocations.length;

    const totalPages =
      Math.max(
        1,
        Math.ceil(
          totalItems /
            pagination.limit
        )
      );

    setPagination((prev) => ({
      ...prev,
      page: Math.min(
        prev.page,
        totalPages
      ),
      totalItems,
      totalPages,
    }));
  }, [
    filteredAllocations.length,
    pagination.limit,
  ]);

  // ============================================================
  // STATUS COUNTS
  // ============================================================

  const statusCounts = useMemo(() => {
    const counts = {
      'Fully Utilized': 0,
      'Partially Utilized': 0,
      'For Allocation': 0,
    };

    allocations.forEach((item) => {
      const status =
        getAllocationStatus(item);

      if (
        Object.prototype.hasOwnProperty.call(
          counts,
          status
        )
      ) {
        counts[status]++;
      }
    });

    return counts;
  }, [allocations]);

  // ============================================================
  // BALANCE PREVIEW
  // ============================================================

  const previewBalance =
    (
      Number(
        form.allocation_amount
      ) || 0
    ) -
    (
      Number(
        form.utilized_amount
      ) || 0
    );

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
      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          ⚠️ {error}

          <button
            type="button"
            onClick={() => setError('')}
            className="ml-3 font-bold hover:text-red-800"
          >
            ×
          </button>
        </div>
      )}

      {/* ======================================================
          SUMMARY CARDS
      ====================================================== */}

      <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2 xl:grid-cols-4">

        {/* TOTAL ALLOCATION */}

        <div className="flex items-start justify-between rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              TOTAL ALLOCATION
            </p>

            <p className="mt-2 text-2xl font-extrabold text-slate-900">
              {formatCurrency(
                summary.total_allocation
              )}
            </p>

            <p className="mt-1.5 text-xs text-slate-400">
              Fiscal Year {fiscalYear}
            </p>
          </div>

          <div className="rounded-xl bg-blue-600 p-3 text-white">
            <Wallet className="h-6 w-6" />
          </div>
        </div>

        {/* UTILIZED */}

        <div className="flex items-start justify-between rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              UTILIZED AMOUNT
            </p>

            <p className="mt-2 text-2xl font-extrabold text-slate-900">
              {formatCurrency(
                summary.total_utilized
              )}
            </p>

            <p className="mt-1.5 text-xs text-slate-500">
              {Number(
                summary.utilization_rate
              ).toFixed(2)}
              % utilized
            </p>
          </div>

          <div className="rounded-xl bg-emerald-600 p-3 text-white">
            <HandCoins className="h-6 w-6" />
          </div>
        </div>

        {/* DISBURSED */}

        <div className="flex items-start justify-between rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              DISBURSED AMOUNT
            </p>

            <p className="mt-2 text-2xl font-extrabold text-slate-900">
              {formatCurrency(
                summary.total_disbursed
              )}
            </p>

            <p className="mt-1.5 text-xs text-slate-400">
              Recorded disbursements
            </p>
          </div>

          <div className="rounded-xl bg-indigo-900 p-3 text-white">
            <PieChartIcon className="h-6 w-6" />
          </div>
        </div>

        {/* BALANCE */}

        <div className="flex items-start justify-between rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              REMAINING BALANCE
            </p>

            <p className="mt-2 text-2xl font-extrabold text-slate-900">
              {formatCurrency(
                summary.total_remaining
              )}
            </p>

            <p className="mt-1.5 text-xs text-slate-400">
              Available allocation balance
            </p>
          </div>

          <div className="rounded-xl bg-amber-500 p-3 text-white">
            <FileSpreadsheet className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* ======================================================
          CHARTS
      ====================================================== */}

      <div className="mb-6 grid grid-cols-1 gap-5 xl:grid-cols-2">

        {/* FUND SOURCE CHART */}

        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-800">
            ALLOCATION BY FUND SOURCE
          </h3>

          <div className="h-72">
            {fundChartData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                No fund allocation data.
              </div>
            ) : (
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart
                  data={fundChartData}
                  margin={{
                    top: 10,
                    right: 10,
                    left: -10,
                    bottom: 20,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="name"
                    tick={{
                      fontSize: 10,
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    tickFormatter={(value) =>
                      `${value}M`
                    }
                    tick={{
                      fontSize: 10,
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <Tooltip
                    formatter={(value) =>
                      `₱${Number(
                        value
                      ).toLocaleString(
                        'en-US',
                        {
                          minimumFractionDigits: 2,
                        }
                      )}M`
                    }
                  />

                  <Bar
                    dataKey="amount"
                    fill="#2563eb"
                    radius={[
                      4,
                      4,
                      0,
                      0,
                    ]}
                    barSize={32}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* STATUS */}

        <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-800">
            ALLOCATION STATUS
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-emerald-100 bg-emerald-50 p-4">
              <span className="text-sm font-semibold text-slate-700">
                Fully Utilized
              </span>

              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                {
                  statusCounts[
                    'Fully Utilized'
                  ]
                }
              </span>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-amber-100 bg-amber-50 p-4">
              <span className="text-sm font-semibold text-slate-700">
                Partially Utilized
              </span>

              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
                {
                  statusCounts[
                    'Partially Utilized'
                  ]
                }
              </span>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-blue-100 bg-blue-50 p-4">
              <span className="text-sm font-semibold text-slate-700">
                For Allocation
              </span>

              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                {
                  statusCounts[
                    'For Allocation'
                  ]
                }
              </span>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
            <span className="text-xs font-bold text-slate-600">
              NO. OF ALLOCATIONS
            </span>

            <span className="text-xl font-extrabold text-slate-900">
              {pagination.totalItems}
            </span>
          </div>
        </div>
      </div>

      {/* ======================================================
          ALLOCATION LIST
      ====================================================== */}

      <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">

        {/* FILTER HEADER */}

        <div className="border-b border-slate-100 p-4">
          <div className="flex flex-col items-center justify-between gap-3 lg:flex-row">

            <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto">

              {/* SEARCH */}

              <div className="relative min-w-[250px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) =>
                    setSearchTerm(
                      e.target.value
                    )
                  }
                  placeholder="Search allocations..."
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* STATUS */}

              <select
                value={selectedStatus}
                onChange={(e) =>
                  setSelectedStatus(
                    e.target.value
                  )
                }
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 focus:outline-none"
              >
                <option value="All">
                  All Status
                </option>

                <option value="Fully Utilized">
                  Fully Utilized
                </option>

                <option value="Partially Utilized">
                  Partially Utilized
                </option>

                <option value="For Allocation">
                  For Allocation
                </option>
              </select>

              {/* YEAR */}

              <select
                value={fiscalYear}
                onChange={(e) =>
                  setFiscalYear(
                    e.target.value
                  )
                }
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 focus:outline-none"
              >
                {[0, 1, 2, 3].map(
                  (offset) => {
                    const year =
                      new Date().getFullYear() -
                      offset;

                    return (
                      <option
                        key={year}
                        value={year}
                      >
                        FY {year}
                      </option>
                    );
                  }
                )}
              </select>

              {/* RESET */}

              <button
                type="button"
                onClick={
                  handleResetFilters
                }
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </button>
            </div>

            {/* NEW */}

            <button
              type="button"
              onClick={
                handleNewAllocation
              }
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              New Allocation
            </button>
          </div>
        </div>

        {/* TABLE */}

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 font-bold uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">
                  ID
                </th>

                <th className="px-4 py-3">
                  Fiscal Year
                </th>

                <th className="px-4 py-3">
                  Fund Source
                </th>

                <th className="px-4 py-3">
                  Fund Cluster
                </th>

                <th className="px-4 py-3">
                  Campus
                </th>

                <th className="px-4 py-3">
                  Responsibility Center
                </th>

                <th className="px-4 py-3 text-right">
                  Allocation
                </th>

                <th className="px-4 py-3 text-right">
                  Utilized
                </th>

                <th className="px-4 py-3 text-right">
                  Disbursed
                </th>

                <th className="px-4 py-3 text-right">
                  Balance
                </th>

                <th className="px-4 py-3 text-center">
                  Status
                </th>

                <th className="px-4 py-3 text-center">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan="12"
                    className="py-10 text-center text-slate-400"
                  >
                    Loading allocations...
                  </td>
                </tr>
              ) : paginatedAllocations.length === 0 ? (
                <tr>
                  <td
                    colSpan="12"
                    className="py-10 text-center text-slate-400"
                  >
                    No allocations found.
                  </td>
                </tr>
              ) : (
                paginatedAllocations.map(
                  (item) => {
                    const allocation =
                      Number(
                        item.allocation_amount
                      ) || 0;

                    const utilized =
                      Number(
                        item.utilized_amount
                      ) || 0;

                    const disbursed =
                      Number(
                        item.disbursed_amount
                      ) || 0;

                    const databaseBalance =
                      Number(
                        item.remaining_balance
                      );

                    const balance =
                      Number.isFinite(
                        databaseBalance
                      )
                        ? databaseBalance
                        : allocation -
                          utilized;

                    const status =
                      getAllocationStatus(
                        item
                      );

                    let statusClass =
                      'bg-blue-100 text-blue-700';

                    if (
                      status ===
                      'Fully Utilized'
                    ) {
                      statusClass =
                        'bg-emerald-100 text-emerald-700';
                    } else if (
                      status ===
                      'Partially Utilized'
                    ) {
                      statusClass =
                        'bg-amber-100 text-amber-700';
                    }

                    return (
                      <tr
                        key={item.id}
                        className="transition hover:bg-slate-50"
                      >
                        <td className="px-4 py-3 font-semibold text-slate-700">
                          {item.id}
                        </td>

                        <td className="px-4 py-3 text-slate-600">
                          {item.fiscal_year}
                        </td>

                        <td className="px-4 py-3 font-semibold text-slate-700">
                          {item.fund_source_name ||
                            item.fund_source_code ||
                            item.fund_source_id ||
                            'N/A'}
                        </td>

                        <td className="px-4 py-3 text-slate-600">
                          {item.fund_cluster_name ||
                            item.fund_cluster_code ||
                            item.fund_cluster_id ||
                            'N/A'}
                        </td>

                        <td className="px-4 py-3 text-slate-600">
                          {item.campus_name ||
                            item.campus_code ||
                            item.campus_id ||
                            'N/A'}
                        </td>

                        <td className="px-4 py-3 text-slate-600">
                          {item.responsibility_center_name ||
                            item.responsibility_center_code ||
                            item.responsibility_center_id ||
                            'N/A'}
                        </td>

                        <td className="px-4 py-3 text-right font-bold text-slate-800">
                          {formatCurrency(
                            allocation
                          )}
                        </td>

                        <td className="px-4 py-3 text-right text-slate-700">
                          {formatCurrency(
                            utilized
                          )}
                        </td>

                        <td className="px-4 py-3 text-right text-slate-700">
                          {formatCurrency(
                            disbursed
                          )}
                        </td>

                        <td className="px-4 py-3 text-right font-bold text-slate-800">
                          {formatCurrency(
                            balance
                          )}
                        </td>

                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-block rounded-full px-2.5 py-1 text-[10px] font-bold ${statusClass}`}
                          >
                            {status}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                handleEdit(
                                  item
                                )
                              }
                              className="rounded p-1.5 text-slate-400 hover:text-blue-600"
                              title="Edit"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(
                                  item.id
                                )
                              }
                              className="rounded p-1.5 text-slate-400 hover:text-red-600"
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
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

        <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 p-4 text-xs text-slate-500 sm:flex-row">
          <span>
            {pagination.totalItems === 0
              ? 'Showing 0 to 0 of 0 entries'
              : `Showing ${
                  (pagination.page - 1) *
                    pagination.limit +
                  1
                } to ${Math.min(
                  pagination.page *
                    pagination.limit,
                  pagination.totalItems
                )} of ${
                  pagination.totalItems
                } entries`}
          </span>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() =>
                setPagination((prev) => ({
                  ...prev,
                  page: Math.max(
                    1,
                    prev.page - 1
                  ),
                }))
              }
              disabled={
                pagination.page <= 1
              }
              className="rounded border border-slate-200 p-1.5 disabled:opacity-50"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>

            {Array.from(
              {
                length: Math.min(
                  pagination.totalPages,
                  5
                ),
              },
              (_, index) =>
                index + 1
            ).map((page) => (
              <button
                type="button"
                key={page}
                onClick={() =>
                  setPagination(
                    (prev) => ({
                      ...prev,
                      page,
                    })
                  )
                }
                className={`rounded px-2.5 py-1 ${
                  page ===
                  pagination.page
                    ? 'bg-blue-600 font-bold text-white'
                    : 'border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              onClick={() =>
                setPagination((prev) => ({
                  ...prev,
                  page: Math.min(
                    prev.totalPages,
                    prev.page + 1
                  ),
                }))
              }
              disabled={
                pagination.page >=
                pagination.totalPages
              }
              className="rounded border border-slate-200 p-1.5 disabled:opacity-50"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================
          NEW / EDIT MODAL
      ====================================================== */}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto overflow-hidden rounded-2xl bg-white shadow-2xl">

            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingId
                    ? 'Edit Allocation'
                    : 'New Budget Allocation'}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Enter the allocation information.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  handleCloseModal
                }
                disabled={formLoading}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* FORM */}

            <form
              onSubmit={handleSubmit}
              className="p-6"
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                {/* FISCAL YEAR */}

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">
                    Fiscal Year *
                  </label>

                  <input
                    type="number"
                    name="fiscal_year"
                    value={
                      form.fiscal_year
                    }
                    onChange={
                      handleFormChange
                    }
                    required
                    min="2000"
                    max="2100"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                {/* FUND SOURCE */}

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">
                    Fund Source *
                  </label>

                  <select
                    name="fund_source_id"
                    value={
                      form.fund_source_id
                    }
                    onChange={
                      handleFormChange
                    }
                    required
                    disabled={
                      masterDataLoading
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50"
                  >
                    <option value="">
                      {masterDataLoading
                        ? 'Loading fund sources...'
                        : 'Select Fund Source'}
                    </option>

                    {masterData.fundSources.map(
                      (source) => (
                        <option
                          key={source.id}
                          value={source.id}
                        >
                          {source.code} - {source.name}
                        </option>
                      )
                    )}
                  </select>

                  <p className="mt-1 text-[11px] text-slate-400">
                    Select from active Master Data.
                  </p>
                </div>

                {/* FUND CLUSTER */}

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">
                    Fund Cluster *
                  </label>

                  <select
                    name="fund_cluster_id"
                    value={
                      form.fund_cluster_id
                    }
                    onChange={
                      handleFormChange
                    }
                    required
                    disabled={
                      masterDataLoading ||
                      !form.fund_source_id
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50"
                  >
                    <option value="">
                      {!form.fund_source_id
                        ? 'Select Fund Source First'
                        : 'Select Fund Cluster'}
                    </option>

                    {availableFundClusters.map(
                      (cluster) => (
                        <option
                          key={cluster.id}
                          value={cluster.id}
                        >
                          {cluster.code} - {cluster.name}
                        </option>
                      )
                    )}
                  </select>

                  <p className="mt-1 text-[11px] text-slate-400">
                    Only clusters belonging to the selected fund source are shown.
                  </p>
                </div>

                {/* CAMPUS */}

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">
                    Campus *
                  </label>

                  <select
                    name="campus_id"
                    value={
                      form.campus_id
                    }
                    onChange={
                      handleFormChange
                    }
                    required
                    disabled={
                      masterDataLoading
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50"
                  >
                    <option value="">
                      {masterDataLoading
                        ? 'Loading campuses...'
                        : 'Select Campus'}
                    </option>

                    {masterData.campuses.map(
                      (campus) => (
                        <option
                          key={campus.id}
                          value={campus.id}
                        >
                          {campus.code} - {campus.name}
                          {campus.abbreviation
                            ? ` (${campus.abbreviation})`
                            : ''}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* RESPONSIBILITY CENTER */}

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">
                    Responsibility Center *
                  </label>

                  <select
                    name="responsibility_center_id"
                    value={
                      form.responsibility_center_id
                    }
                    onChange={
                      handleFormChange
                    }
                    required
                    disabled={
                      masterDataLoading
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50"
                  >
                    <option value="">
                      {masterDataLoading
                        ? 'Loading responsibility centers...'
                        : 'Select Responsibility Center'}
                    </option>

                    {masterData.responsibilityCenters.map(
                      (center) => (
                        <option
                          key={center.id}
                          value={center.id}
                        >
                          {center.code} - {center.name}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* WFP */}

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">
                    WFP Source *
                  </label>

                  <select
                    name="wfp_source_id"
                    value={
                      form.wfp_source_id
                    }
                    onChange={
                      handleFormChange
                    }
                    required
                    disabled={
                      masterDataLoading
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50"
                  >
                    <option value="">
                      {masterDataLoading
                        ? 'Loading WFP sources...'
                        : 'Select WFP Source'}
                    </option>

                    {masterData.wfpSources.map(
                      (wfp) => (
                        <option
                          key={wfp.id}
                          value={wfp.id}
                        >
                          {wfp.code} - {wfp.name}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* ALLOCATION */}

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">
                    Allocation Amount *
                  </label>

                  <input
                    type="number"
                    name="allocation_amount"
                    value={
                      form.allocation_amount
                    }
                    onChange={
                      handleFormChange
                    }
                    required
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                {/* UTILIZED */}

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">
                    Utilized Amount
                  </label>

                  <input
                    type="number"
                    name="utilized_amount"
                    value={
                      form.utilized_amount
                    }
                    onChange={
                      handleFormChange
                    }
                    min="0"
                    step="0.01"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                {/* DISBURSED */}

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">
                    Disbursed Amount
                  </label>

                  <input
                    type="number"
                    name="disbursed_amount"
                    value={
                      form.disbursed_amount
                    }
                    onChange={
                      handleFormChange
                    }
                    min="0"
                    step="0.01"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* BALANCE */}

              <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-blue-700">
                    Remaining Balance
                  </span>

                  <span className="text-lg font-extrabold text-blue-900">
                    {formatCurrency(
                      previewBalance
                    )}
                  </span>
                </div>
              </div>

              {/* BUTTONS */}

              <div className="mt-6 flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={
                    handleCloseModal
                  }
                  disabled={formLoading}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    formLoading ||
                    masterDataLoading
                  }
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {formLoading
                    ? 'Saving...'
                    : editingId
                    ? 'Update Allocation'
                    : 'Save Allocation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================
          TOAST
      ====================================================== */}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() =>
            setToast(null)
          }
        />
      )}
    </Layout>
  );
}