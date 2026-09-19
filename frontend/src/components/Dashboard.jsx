import React, { useState, useEffect } from 'react';
import Layout from './layout/Layout';
import { API_URL } from '../config/api';

import {
  TrendingUp,
  CreditCard,
  PieChart as PieChartIcon,
  ChevronDown,
  ArrowRight,
  PlusCircle,
  FileText,
  BarChart2,
  Folder,
  HelpCircle
} from 'lucide-react';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';


// ============================================================
// COLORS
// ============================================================

const DONUT_COLORS = [
  '#0052cc',
  '#10b981',
  '#6366f1',
  '#f59e0b',
  '#ec4899'
];


// ============================================================
// DASHBOARD
// ============================================================

export default function Dashboard({
  user,
  onLogout,
  onNavigate,
  activePath
}) {

  // ==========================================================
  // STATE
  // ==========================================================

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear()
  );


  // ==========================================================
  // TOKEN
  // ==========================================================

  const token = localStorage.getItem('token');


  // ==========================================================
  // FETCH DASHBOARD DATA
  // ==========================================================

  useEffect(() => {

    const fetchData = async () => {

      try {

        setLoading(true);
        setError('');

        const headers = {};

        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(
          `${API_URL}/dashboard/summary?year=${selectedYear}`,
          {
            method: 'GET',
            headers
          }
        );


        if (!response.ok) {
          throw new Error(
            `Dashboard request failed: ${response.status}`
          );
        }


        const data = await response.json();

        setSummary(data);

      } catch (err) {

        console.error('Dashboard fetch error:', err);

        setError(
          'Unable to load dashboard data. Please check if the backend server is running.'
        );

        setSummary(null);

      } finally {

        setLoading(false);

      }

    };


    fetchData();

  }, [token, selectedYear]);


  // ============================================================
  // SAFE NUMBER
  // ============================================================

  const toNumber = (value) => {

    const number = Number(value);

    return Number.isFinite(number)
      ? number
      : 0;

  };


  // ============================================================
  // CURRENCY FORMAT
  // ============================================================

  const formatCurrency = (value) => {

    const number = toNumber(value);

    return `\u20B1${number.toLocaleString(
      'en-US',
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }
    )}`;

  };


  // ============================================================
  // COMPACT CURRENCY
  // ============================================================

  const formatCompact = (value) => {

    const number = toNumber(value);

    if (number >= 1000000000) {

      return `\u20B1${(
        number / 1000000000
      ).toFixed(2)}B`;

    }

    if (number >= 1000000) {

      return `\u20B1${(
        number / 1000000
      ).toFixed(2)}M`;

    }

    if (number >= 1000) {

      return `\u20B1${(
        number / 1000
      ).toFixed(0)}K`;

    }

    return `\u20B1${number.toFixed(2)}`;

  };


  // ============================================================
  // PERCENTAGE
  // ============================================================

  const formatPercentage = (
    value,
    decimals = 2
  ) => {

    const number = toNumber(value);

    return `${number.toFixed(decimals)}%`;

  };


  // ============================================================
  // DATE FORMAT
  // ============================================================

  const formatDate = (dateValue) => {

    if (!dateValue) {
      return '';
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return date.toLocaleDateString(
      'en-US',
      {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }
    );

  };


  // ============================================================
  // LOADING SCREEN
  // ============================================================

  if (loading) {

    return (

      <Layout
        user={user}
        onLogout={onLogout}
        activePath={activePath}
        onNavigate={onNavigate}
      >

        <div className="flex items-center justify-center h-64">

          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-700" />

        </div>

      </Layout>

    );

  }


  // ============================================================
  // SUMMARY DATA
  // ============================================================

  const s = summary || {};


  // ============================================================
  // MAIN RBUD VALUES
  // ============================================================

  const totalBudget =
    toNumber(s.totalBudget);


  const totalObligations =
    toNumber(s.totalObligations);


  const totalDisbursed =
    toNumber(s.totalDisbursed);


  // ============================================================
  // IMPORTANT:
  //
  // RBUD UTILIZATION RATE
  //
  // Utilization = Obligations / Total Budget Ã— 100
  //
  // Example:
  //
  // 332,783.79
  // Ã·
  // 20,015,000,000
  // Ã— 100
  //
  // = 0.0016627%
  //
  // Displayed as 0.0017%
  // ============================================================

  const utilizationRate =
    totalBudget > 0
      ? (totalObligations / totalBudget) * 100
      : 0;


  // ============================================================
  // DISBURSEMENT RATE
  // ============================================================

  const disbursementRate =
    totalBudget > 0
      ? (totalDisbursed / totalBudget) * 100
      : 0;


  // ============================================================
  // RBUD BALANCE
  //
  // Remaining budget after obligations.
  // ============================================================

  const calculatedRemainingBalance =
    Math.max(
      0,
      totalBudget - totalObligations
    );


  // ============================================================
  // FUND GROUP DATA
  // ============================================================

  const fundGroupData =
    Array.isArray(s.fundGroupBreakdown)
      ? s.fundGroupBreakdown.map(row => ({

          group:
            row.group || 'Unknown',

          budget:
            toNumber(row.budget),

          obligations:
            toNumber(row.obligations),

          disbursements:
            toNumber(row.disbursements),

          balance:
            Math.max(
              0,
              toNumber(row.budget) -
              toNumber(row.obligations)
            )

        }))
      : [];


  // ============================================================
  // RAOD
  // ============================================================

  const backendRaod =
    s.raodOverview || {};


  const raodAllotment =
    toNumber(
      backendRaod.totalAllotment
    );


  const raodObligations =
    toNumber(
      backendRaod.totalObligations
    );


  const raodDisbursements =
    toNumber(
      backendRaod.totalDisbursements
    );


  const raodUnobligated =
    Math.max(
      0,
      raodAllotment - raodObligations
    );


  const raodObligationRate =
    raodAllotment > 0
      ? (raodObligations / raodAllotment) * 100
      : 0;


  const raodDisbursementRate =
    raodAllotment > 0
      ? (raodDisbursements / raodAllotment) * 100
      : 0;


  // ============================================================
  // TRANSACTIONS
  // ============================================================

  const transactions =
    Array.isArray(s.recentTransactions)
      ? s.recentTransactions
      : [];


  // ============================================================
  // FUND DISTRIBUTION
  // ============================================================

  const fundDistribution =
    Array.isArray(s.fundDistribution)
      ? s.fundDistribution.map(item => ({

          name:
            item.name || 'Unknown',

          value:
            toNumber(item.value)

        }))
      : [];


  // ============================================================
  // FUND GROUP TOTALS
  // ============================================================

  const totals = fundGroupData.reduce(

    (acc, row) => ({

      budget:
        acc.budget + row.budget,

      obligations:
        acc.obligations + row.obligations,

      disbursements:
        acc.disbursements +
        row.disbursements,

      balance:
        acc.balance + row.balance

    }),

    {
      budget: 0,
      obligations: 0,
      disbursements: 0,
      balance: 0
    }

  );


  // ============================================================
  // RAOD CHART
  // ============================================================

  const raodChartData = [

    {
      name: 'Total Allotment',
      amount: raodAllotment,
      fill: '#0052cc'
    },

    {
      name: 'Total Obligations',
      amount: raodObligations,
      fill: '#10b981'
    },

    {
      name: 'Total Disbursements',
      amount: raodDisbursements,
      fill: '#6366f1'
    },

    {
      name: 'Unobligated Allotment',
      amount: raodUnobligated,
      fill: '#f59e0b'
    }

  ];


  // ============================================================
  // RBUD UTILIZATION DONUT
  //
  // IMPORTANT:
  //
  // Do NOT put both obligations and disbursements
  // plus balance together because that can double-count.
  //
  // The donut represents:
  //
  // Obligations
  // +
  // Unobligated Balance
  //
  // = Total Budget
  // ============================================================

  const utilizationData = [

    {
      name: 'Obligations',
      value: totalObligations
    },

    {
      name: 'Unobligated Balance',
      value: calculatedRemainingBalance
    }

  ];


  // ============================================================
  // ERROR SCREEN
  // ============================================================

  if (error) {

    return (

      <Layout
        user={user}
        onLogout={onLogout}
        activePath={activePath}
        onNavigate={onNavigate}
      >

        <div className="bg-white rounded-xl border border-red-100 p-8 text-center">

          <p className="text-sm text-red-600 font-medium mb-3">
            {error}
          </p>

          <button
            onClick={() =>
              window.location.reload()
            }
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
          >
            Retry
          </button>

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

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="flex justify-between items-center mb-6">

        <div>

          <h1 className="text-xl font-bold text-slate-800">
            Dashboard
          </h1>

          <p className="text-xs text-slate-500">
            Overview of the university's budget status and financial activities.
          </p>

        </div>


        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-sm">

          <span className="text-xs text-slate-500 font-medium">
            Fiscal Year
          </span>

          <select
            value={selectedYear}
            onChange={(e) =>
              setSelectedYear(
                Number(e.target.value)
              )
            }
            className="text-xs font-bold text-slate-700 bg-transparent outline-none cursor-pointer"
          >

            <option value={2026}>
              2026
            </option>

            <option value={2025}>
              2025
            </option>

            <option value={2024}>
              2024
            </option>

          </select>

        </div>

      </div>


      {/* ======================================================
          TOP METRIC CARDS
      ====================================================== */}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">


        {/* TOTAL BUDGET */}

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 flex items-center gap-4">

          <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
            \u20B1
          </div>

          <div>

            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              TOTAL BUDGET
            </p>

            <p className="text-xl font-extrabold text-slate-800">
              {formatCurrency(totalBudget)}
            </p>

            <p className="text-[11px] text-slate-400 mt-0.5">
              100% of total allocation
            </p>

          </div>

        </div>


        {/* OBLIGATIONS */}

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 flex items-center gap-4">

          <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center text-white flex-shrink-0">

            <TrendingUp className="w-6 h-6" />

          </div>

          <div>

            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              OBLIGATIONS
            </p>

            <p className="text-xl font-extrabold text-slate-800">
              {formatCurrency(totalObligations)}
            </p>

            <p className="text-[11px] text-slate-400 mt-0.5">
              {formatPercentage(
                utilizationRate,
                4
              )} of total budget
            </p>

          </div>

        </div>


        {/* DISBURSEMENTS */}

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 flex items-center gap-4">

          <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white flex-shrink-0">

            <CreditCard className="w-6 h-6" />

          </div>

          <div>

            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              DISBURSEMENTS
            </p>

            <p className="text-xl font-extrabold text-slate-800">
              {formatCurrency(totalDisbursed)}
            </p>

            <p className="text-[11px] text-slate-400 mt-0.5">
              {formatPercentage(
                disbursementRate,
                4
              )} of total budget
            </p>

          </div>

        </div>


        {/* BALANCE */}

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 flex items-center gap-4">

          <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center text-white flex-shrink-0">

            <PieChartIcon className="w-6 h-6" />

          </div>

          <div>

            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              BALANCE
            </p>

            <p className="text-xl font-extrabold text-slate-800">
              {formatCurrency(
                calculatedRemainingBalance
              )}
            </p>

            <p className="text-[11px] text-slate-400 mt-0.5">
              {formatPercentage(
                totalBudget > 0
                  ? (
                      calculatedRemainingBalance /
                      totalBudget
                    ) * 100
                  : 0,
                4
              )} remaining
            </p>

          </div>

        </div>

      </div>


      {/* ======================================================
          MIDDLE ROW
      ====================================================== */}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 mb-6">


        {/* ====================================================
            RBUD UTILIZATION
        ==================================================== */}

        <div className="xl:col-span-4 bg-white rounded-xl shadow-sm border border-slate-100 p-4 flex flex-col justify-between">

          <div>

            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4">
              BUDGET UTILIZATION OVERVIEW (RBUD)
            </h3>


            <div className="flex items-center gap-4">


              {/* DONUT */}

              <div className="relative w-36 h-36 flex-shrink-0">

                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >

                  <PieChart>

                    <Pie
                      data={utilizationData}
                      cx="50%"
                      cy="50%"
                      innerRadius={42}
                      outerRadius={60}
                      paddingAngle={3}
                      dataKey="value"
                    >

                      <Cell fill="#10b981" />

                      <Cell fill="#f59e0b" />

                    </Pie>

                    <Tooltip
                      formatter={(value) =>
                        formatCurrency(value)
                      }
                    />

                  </PieChart>

                </ResponsiveContainer>


                {/* DONUT CENTER */}

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">

                  <span className="text-base font-extrabold text-slate-800">
                    {formatPercentage(
                      utilizationRate,
                      4
                    )}
                  </span>

                  <span className="text-[9px] text-slate-400 uppercase font-medium">
                    Utilization Rate
                  </span>

                </div>

              </div>


              {/* UTILIZATION DETAILS */}

              <div className="space-y-1.5 text-xs flex-1">


                {/* TOTAL BUDGET */}

                <div className="flex items-center justify-between">

                  <span className="flex items-center gap-1 text-slate-600">

                    <span className="w-2 h-2 rounded-full bg-blue-600" />

                    Total Budget

                  </span>

                </div>

                <p className="font-bold text-slate-800 text-[11px] mb-1">

                  {formatCurrency(totalBudget)}

                </p>


                {/* OBLIGATIONS */}

                <div className="flex items-center justify-between">

                  <span className="flex items-center gap-1 text-slate-600">

                    <span className="w-2 h-2 rounded-full bg-emerald-500" />

                    Obligations

                  </span>

                </div>

                <p className="font-bold text-slate-800 text-[11px] mb-1">

                  {formatCurrency(totalObligations)}

                  {' '}

                  ({formatPercentage(
                    utilizationRate,
                    4
                  )})

                </p>


                {/* DISBURSEMENTS */}

                <div className="flex items-center justify-between">

                  <span className="flex items-center gap-1 text-slate-600">

                    <span className="w-2 h-2 rounded-full bg-indigo-500" />

                    Disbursements

                  </span>

                </div>

                <p className="font-bold text-slate-800 text-[11px] mb-1">

                  {formatCurrency(totalDisbursed)}

                  {' '}

                  ({formatPercentage(
                    disbursementRate,
                    4
                  )})

                </p>


                {/* BALANCE */}

                <div className="flex items-center justify-between">

                  <span className="flex items-center gap-1 text-slate-600">

                    <span className="w-2 h-2 rounded-full bg-amber-500" />

                    Balance

                  </span>

                </div>

                <p className="font-bold text-slate-800 text-[11px]">

                  {formatCurrency(
                    calculatedRemainingBalance
                  )}

                  {' '}

                  ({formatPercentage(
                    totalBudget > 0
                      ? (
                          calculatedRemainingBalance /
                          totalBudget
                        ) * 100
                      : 0,
                    4
                  )})

                </p>

              </div>

            </div>

          </div>


          <button
            onClick={() =>
              onNavigate('/rbud')
            }
            className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline w-fit"
          >

            View Utilization Details

            <ArrowRight className="w-3.5 h-3.5" />

          </button>

        </div>


        {/* ====================================================
            BUDGET STATUS BY FUND GROUP
        ==================================================== */}

        <div className="xl:col-span-5 bg-white rounded-xl shadow-sm border border-slate-100 p-4 flex flex-col justify-between">

          <div className="flex justify-between items-center mb-2">

            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              BUDGET STATUS BY FUND GROUP
            </h3>

            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-[11px] text-slate-600">

              <span>
                All Fund Groups
              </span>

              <ChevronDown className="w-3 h-3" />

            </div>

          </div>


          <div className="h-52">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <BarChart
                data={fundGroupData}
              >

                <CartesianGrid
                  strokeDasharray="2 2"
                  vertical={false}
                  stroke="#f1f5f9"
                />

                <XAxis
                  dataKey="group"
                  tick={{
                    fontSize: 10,
                    fill: '#64748b'
                  }}
                  axisLine={false}
                  tickLine={false}
                />

                <YAxis
                  tick={{
                    fontSize: 10,
                    fill: '#64748b'
                  }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={
                    formatCompact
                  }
                />

                <Tooltip
                  formatter={(value) =>
                    formatCurrency(value)
                  }
                />

                <Legend
                  iconType="circle"
                  wrapperStyle={{
                    fontSize: '11px'
                  }}
                />

                <Bar
                  dataKey="budget"
                  fill="#0052cc"
                  radius={[
                    2,
                    2,
                    0,
                    0
                  ]}
                  name="Budget"
                />

                <Bar
                  dataKey="obligations"
                  fill="#10b981"
                  radius={[
                    2,
                    2,
                    0,
                    0
                  ]}
                  name="Obligations"
                />

                <Bar
                  dataKey="disbursements"
                  fill="#6366f1"
                  radius={[
                    2,
                    2,
                    0,
                    0
                  ]}
                  name="Disbursements"
                />

              </BarChart>

            </ResponsiveContainer>

          </div>

        </div>


        {/* ====================================================
            RECENT TRANSACTIONS
        ==================================================== */}

        <div className="xl:col-span-3 bg-white rounded-xl shadow-sm border border-slate-100 p-4">

          <div className="flex justify-between items-center mb-3">

            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              RECENT TRANSACTIONS
            </h3>

            <button
              onClick={() =>
                onNavigate('/transactions')
              }
              className="text-xs text-blue-600 font-medium inline-flex items-center gap-0.5 hover:underline"
            >

              View All

              <ArrowRight className="w-3 h-3" />

            </button>

          </div>


          <div className="space-y-2 text-[11px]">

            {transactions.length === 0 ? (

              <p className="text-slate-400">
                No recent transactions
              </p>

            ) : (

              transactions.map(
                (tx, index) => (

                  <div
                    key={
                      tx.id ||
                      tx.registry_no ||
                      index
                    }
                    className="flex items-center justify-between p-2 hover:bg-slate-50 rounded border-b border-slate-50"
                  >

                    <div className="flex flex-col">

                      <span
                        className={`
                          w-fit
                          px-1.5
                          py-0.5
                          text-[9px]
                          font-bold
                          rounded
                          mb-1
                          ${
                            tx.type === 'RBUD'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-purple-100 text-purple-700'
                          }
                        `}
                      >

                        {tx.type}

                      </span>


                      <span className="font-mono text-[10px] text-slate-500">

                        {tx.ref ||
                          tx.registry_no ||
                          '-'}

                      </span>

                    </div>


                    <div className="text-right">

                      <p className="font-bold text-slate-800">

                        {formatCurrency(
                          tx.amount
                        )}

                      </p>


                      <span
                        className={`
                          px-1.5
                          py-0.5
                          text-[9px]
                          rounded
                          font-medium
                          ${
                            tx.status === 'Valid' ||
                            tx.status === 'active' ||
                            tx.status === 'Approved'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-700'
                          }
                        `}
                      >

                        {tx.status || '-'}

                      </span>

                    </div>

                  </div>

                )

              )

            )}

          </div>

        </div>

      </div>


      {/* ======================================================
          BOTTOM ROW
      ====================================================== */}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 mb-6">


        {/* ====================================================
            BUDGET BY FUND GROUP TABLE
        ==================================================== */}

        <div className="xl:col-span-5 bg-white rounded-xl shadow-sm border border-slate-100 p-4">

          <div className="flex justify-between items-center mb-3">

            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              BUDGET BY FUND GROUP
            </h3>

            <button
              onClick={() =>
                onNavigate('/fund-sources')
              }
              className="text-xs text-blue-600 font-medium inline-flex items-center gap-0.5 hover:underline"
            >

              View All

              <ArrowRight className="w-3 h-3" />

            </button>

          </div>


          <div className="overflow-x-auto">

            <table className="w-full text-left text-[11px]">

              <thead>

                <tr className="text-slate-400 border-b border-slate-100 font-semibold uppercase">

                  <th className="pb-2">
                    FUND GROUP
                  </th>

                  <th className="pb-2 text-right">
                    BUDGET
                  </th>

                  <th className="pb-2 text-right">
                    OBLIGATIONS
                  </th>

                  <th className="pb-2 text-right">
                    DISBURSEMENTS
                  </th>

                  <th className="pb-2 text-right">
                    BALANCE
                  </th>

                </tr>

              </thead>


              <tbody className="divide-y divide-slate-100 text-slate-700">

                {fundGroupData.length === 0 ? (

                  <tr>

                    <td
                      colSpan="5"
                      className="py-5 text-center text-slate-400"
                    >
                      No fund group data available.
                    </td>

                  </tr>

                ) : (

                  fundGroupData.map(
                    (row, index) => (

                      <tr
                        key={
                          `${row.group}-${index}`
                        }
                        className="hover:bg-slate-50"
                      >

                        <td className="py-2 font-medium">
                          {row.group}
                        </td>

                        <td className="text-right">
                          {formatCurrency(
                            row.budget
                          )}
                        </td>

                        <td className="text-right">
                          {formatCurrency(
                            row.obligations
                          )}
                        </td>

                        <td className="text-right">
                          {formatCurrency(
                            row.disbursements
                          )}
                        </td>

                        <td className="text-right">
                          {formatCurrency(
                            row.balance
                          )}
                        </td>

                      </tr>

                    )

                  )

                )}


                <tr className="font-bold text-slate-800 bg-slate-50">

                  <td className="py-2">
                    TOTAL
                  </td>

                  <td className="text-right">
                    {formatCurrency(
                      totals.budget
                    )}
                  </td>

                  <td className="text-right">
                    {formatCurrency(
                      totals.obligations
                    )}
                  </td>

                  <td className="text-right">
                    {formatCurrency(
                      totals.disbursements
                    )}
                  </td>

                  <td className="text-right">
                    {formatCurrency(
                      totals.balance
                    )}
                  </td>

                </tr>

              </tbody>

            </table>

          </div>

        </div>


        {/* ====================================================
            FUND SOURCES DISTRIBUTION
        ==================================================== */}

        <div className="xl:col-span-4 bg-white rounded-xl shadow-sm border border-slate-100 p-4 flex flex-col justify-between">

          <div>

            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              FUND SOURCES DISTRIBUTION
            </h3>


            <div className="flex items-center gap-4">


              {/* DONUT */}

              <div className="relative w-36 h-36 flex-shrink-0">

                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >

                  <PieChart>

                    <Pie
                      data={
                        fundDistribution.length > 0
                          ? fundDistribution
                          : [
                              {
                                name: 'None',
                                value: 1
                              }
                            ]
                      }
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={55}
                      paddingAngle={2}
                      dataKey="value"
                    >

                      {(
                        fundDistribution.length > 0
                          ? fundDistribution
                          : [
                              {
                                name: 'None',
                                value: 1
                              }
                            ]
                      ).map(
                        (entry, index) => (

                          <Cell
                            key={`fund-cell-${index}`}
                            fill={
                              fundDistribution.length > 0
                                ? DONUT_COLORS[
                                    index %
                                    DONUT_COLORS.length
                                  ]
                                : '#e2e8f0'
                            }
                          />

                        )
                      )}

                    </Pie>

                    <Tooltip
                      formatter={(value) =>
                        formatCurrency(value)
                      }
                    />

                  </PieChart>

                </ResponsiveContainer>


                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">

                  <span className="text-[9px] text-slate-400 uppercase font-medium">
                    Total
                  </span>

                  <span className="text-xs font-bold text-slate-800">
                    {formatCompact(
                      totalBudget
                    )}
                  </span>

                </div>

              </div>


              {/* LEGEND */}

              <div className="space-y-2 text-xs flex-1">

                {fundDistribution.length === 0 ? (

                  <p className="text-[11px] text-slate-400">
                    No fund source data available.
                  </p>

                ) : (

                  fundDistribution.map(
                    (item, index) => {

                      const percentage =
                        totalBudget > 0
                          ? (
                              item.value /
                              totalBudget
                            ) * 100
                          : 0;


                      return (

                        <div
                          key={
                            `${item.name}-${index}`
                          }
                          className="flex justify-between items-center text-[11px]"
                        >

                          <span className="flex items-center gap-1.5 truncate">

                            <span
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{
                                backgroundColor:
                                  DONUT_COLORS[
                                    index %
                                    DONUT_COLORS.length
                                  ]
                              }}
                            />

                            <span className="text-slate-600 truncate">
                              {item.name}
                            </span>

                          </span>


                          <span className="font-bold text-slate-700">

                            {formatPercentage(
                              percentage,
                              2
                            )}

                          </span>

                        </div>

                      );

                    }

                  )

                )}

              </div>

            </div>

          </div>


          <button
            onClick={() =>
              onNavigate('/fund-sources')
            }
            className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline w-fit"
          >

            View Fund Sources

            <ArrowRight className="w-3.5 h-3.5" />

          </button>

        </div>


        {/* ====================================================
            RAOD OVERVIEW
        ==================================================== */}

        <div className="xl:col-span-3 bg-white rounded-xl shadow-sm border border-slate-100 p-4 flex flex-col justify-between">

          <div>

            <div className="flex items-center gap-1 mb-2">

              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                ALLOTMENT, OBLIGATION & DISBURSEMENT OVERVIEW (RAOD)
              </h3>

              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />

            </div>


            <div className="h-40">

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <BarChart
                  data={raodChartData}
                >

                  <CartesianGrid
                    strokeDasharray="2 2"
                    vertical={false}
                    stroke="#f1f5f9"
                  />

                  <XAxis
                    dataKey="name"
                    tick={false}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    tick={{
                      fontSize: 9,
                      fill: '#64748b'
                    }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={
                      formatCompact
                    }
                  />

                  <Tooltip
                    formatter={(value) =>
                      formatCurrency(value)
                    }
                  />

                  <Bar
                    dataKey="amount"
                    radius={[
                      3,
                      3,
                      0,
                      0
                    ]}
                  >

                    {raodChartData.map(
                      (entry, index) => (

                        <Cell
                          key={
                            `raod-cell-${index}`
                          }
                          fill={entry.fill}
                        />

                      )
                    )}

                  </Bar>

                </BarChart>

              </ResponsiveContainer>

            </div>


            {/* RAOD RATES */}

            <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100 text-center">


              <div>

                <p className="text-[10px] text-slate-400 uppercase font-medium">
                  Obligation Rate
                </p>

                <p className="text-base font-extrabold text-emerald-600">

                  {formatPercentage(
                    raodObligationRate,
                    2
                  )}

                </p>

              </div>


              <div>

                <p className="text-[10px] text-slate-400 uppercase font-medium">
                  Disbursement Rate
                </p>

                <p className="text-base font-extrabold text-indigo-600">

                  {formatPercentage(
                    raodDisbursementRate,
                    2
                  )}

                </p>

              </div>

            </div>

          </div>


          <button
            onClick={() =>
              onNavigate('/raod')
            }
            className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline w-fit"
          >

            View RAOD Details

            <ArrowRight className="w-3.5 h-3.5" />

          </button>

        </div>

      </div>


      {/* ======================================================
          QUICK ACCESS
      ====================================================== */}

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">

        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
          QUICK ACCESS
        </h3>


        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">


          {/* RBUD */}

          <button
            onClick={() =>
              onNavigate('/rbud')
            }
            className="flex items-center justify-center gap-2 p-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold transition"
          >

            <PlusCircle className="w-4 h-4" />

            Add RBUD Record

          </button>


          {/* RAOD */}

          <button
            onClick={() =>
              onNavigate('/raod')
            }
            className="flex items-center justify-center gap-2 p-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-semibold transition"
          >

            <PlusCircle className="w-4 h-4" />

            Add RAOD Record

          </button>


          {/* BUDGET ALLOCATION */}

          <button
            onClick={() =>
              onNavigate('/budget-allocation')
            }
            className="flex items-center justify-center gap-2 p-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold transition"
          >

            <FileText className="w-4 h-4" />

            Budget Allocation

          </button>


          {/* FINANCIAL REPORTS */}

          <button
            onClick={() =>
              onNavigate('/financial-reports')
            }
            className="flex items-center justify-center gap-2 p-2.5 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-lg text-xs font-semibold transition"
          >

            <BarChart2 className="w-4 h-4" />

            Financial Reports

          </button>


          {/* REPORTS */}

          <button
            onClick={() =>
              onNavigate('/reports-exports')
            }
            className="flex items-center justify-center gap-2 p-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold transition"
          >

            <Folder className="w-4 h-4" />

            Reports & Exports

          </button>


          {/* MASTER DATA */}

          <button
            onClick={() =>
              onNavigate('/master-data')
            }
            className="flex items-center justify-center gap-2 p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold transition"
          >

            <Folder className="w-4 h-4" />

            Master Data

          </button>

        </div>

      </div>

    </Layout>

  );

}

