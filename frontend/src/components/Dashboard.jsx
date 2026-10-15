import React, { useEffect, useState } from 'react';
import Layout from './layout/Layout';
import { API_URL } from '../config/api';

import {
  TrendingUp,
  CreditCard,
  PieChart as PieChartIcon,
  ArrowRight,
  Wallet,
  HelpCircle,
  CalendarDays,
  ChevronDown
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

const FISCAL_YEARS = Array.from({ length: 6 }, (_, index) => new Date().getFullYear() - index);

const CHART_COLORS = {
  budget: '#0052cc',
  obligations: '#10b981',
  disbursements: '#6366f1',
  balance: '#f59e0b',
  raodBalance: '#f59e0b'
};

export default function Dashboard({
  user,
  onLogout,
  onNavigate,
  activePath
}) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchDashboard = async () => {
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
          throw new Error(`Dashboard request failed: ${response.status}`);
        }

        const data = await response.json();
        setSummary(data);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
        setError('Unable to load dashboard data. Please check if the backend server is running.');
        setSummary(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [token, selectedYear]);

  const toNumber = (value) => {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
  };

  const formatCurrency = (value) =>
    `₱${toNumber(value).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;

  const formatCompact = (value) => {
    const number = toNumber(value);

    if (number >= 1000000000) return `₱${(number / 1000000000).toFixed(2)}B`;
    if (number >= 1000000) return `₱${(number / 1000000).toFixed(2)}M`;
    if (number >= 1000) return `₱${(number / 1000).toFixed(0)}K`;

    return `₱${number.toFixed(2)}`;
  };

  const formatPercentage = (value, decimals = 2) =>
    `${toNumber(value).toFixed(decimals)}%`;

  // Keep the fiscal-year control visible in every Dashboard state, including
  // the initial loading state and any API error state.
  const fiscalYearControl = (
    <div className="flex justify-end items-center mb-3">
      <div
        className="inline-flex items-center gap-[7px] h-9 px-[10px] bg-white border border-[#dbe4f0] rounded-lg shadow-sm text-[#334155] text-[10px] font-bold"
        style={{ boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)' }}
      >
        <CalendarDays className="w-[14px] h-[14px] text-[#123b7a]" aria-hidden="true" />
        <span>Fiscal Year</span>
        <div className="relative inline-flex items-center">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            aria-label="Fiscal Year"
            className="appearance-none border-0 outline-0 bg-transparent pl-px pr-[19px] text-[10px] font-extrabold text-slate-900 cursor-pointer min-h-6 relative z-[1]"
          >
            {FISCAL_YEARS.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <ChevronDown className="w-[13px] h-[13px] text-slate-500 absolute right-px top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <Layout
        user={user}
        onLogout={onLogout}
        activePath={activePath}
        onNavigate={onNavigate}
      >
        {fiscalYearControl}
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-700" />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout
        user={user}
        onLogout={onLogout}
        activePath={activePath}
        onNavigate={onNavigate}
      >
        {fiscalYearControl}
        <div className="bg-white rounded-xl border border-red-100 p-8 text-center">
          <p className="text-sm text-red-600 font-medium mb-3">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
          >
            Retry
          </button>
        </div>
      </Layout>
    );
  }

  const s = summary || {};

  const totalBudget = toNumber(s.totalBudget);
  const totalObligations = toNumber(s.totalObligations);
  const totalDisbursed = toNumber(s.totalDisbursed);
  const remainingBalance = Math.max(0, totalBudget - totalObligations);

  const utilizationRate =
    totalBudget > 0 ? (totalObligations / totalBudget) * 100 : 0;

  const disbursementRate =
    totalBudget > 0 ? (totalDisbursed / totalBudget) * 100 : 0;

  // Support the corrected API property and keep compatibility with
  // older dashboard responses that still return fundGroupBreakdown.
  const rawFundSourceData = Array.isArray(s.fundSourceBreakdown)
    ? s.fundSourceBreakdown
    : Array.isArray(s.fundGroupBreakdown)
      ? s.fundGroupBreakdown
      : [];

  const fundSourceData = rawFundSourceData.map((row) => ({
        group: row.group || 'Unknown',
        budget: toNumber(row.budget),
        obligations: toNumber(row.obligations),
        disbursements: toNumber(row.disbursements),
        balance: Math.max(
          0,
          toNumber(row.budget) - toNumber(row.obligations)
        )
      }));

  // Dashboard Recent Transactions must show RBUD records only.
  // Support both the API type and the registry reference as identifiers.
  const transactions = (Array.isArray(s.recentTransactions)
    ? s.recentTransactions
    : []
  ).filter((tx) => {
    const type = String(tx?.type || '').trim().toUpperCase();
    const reference = String(tx?.ref || tx?.registry_no || '').trim().toUpperCase();
    return type === 'RBUD' || reference.startsWith('RBUD-');
  });

  const raod = s.raodOverview || {};
  const raodAllotment = toNumber(raod.totalAllotment);
  const raodObligations = toNumber(raod.totalObligations);
  const raodDisbursements = toNumber(raod.totalDisbursements);
  const raodUnobligated = Math.max(0, raodAllotment - raodObligations);

  const raodObligationRate =
    raodAllotment > 0 ? (raodObligations / raodAllotment) * 100 : 0;

  const raodDisbursementRate =
    raodAllotment > 0 ? (raodDisbursements / raodAllotment) * 100 : 0;

  // Fund 161 / IGP overview is returned by the MAIN dashboard endpoint.
  // This keeps the dashboard viewable for Procurement and Accountant too,
  // without changing the restricted IGP module permissions.
  const igp = s.igpOverview || {};
  const igpPrograms = toNumber(igp.total_programs);
  const igpBeginning = toNumber(igp.beginning_balance);
  const igpProjectedIncome = toNumber(igp.projected_income);
  const igpApprovedBudget = toNumber(igp.approved_budget);
  const igpActualIncome = toNumber(igp.actual_income);
  const igpUtilization = toNumber(igp.total_utilization);
  const igpDisbursement = toNumber(igp.total_disbursement);
  const igpUnpaid = toNumber(igp.unpaid_utilization);
  const igpAvailableBalance = toNumber(igp.available_balance);

  const igpCollectionRate =
    igpProjectedIncome > 0
      ? (igpActualIncome / igpProjectedIncome) * 100
      : 0;

  const igpUtilizationRate =
    igpActualIncome > 0
      ? (igpUtilization / igpActualIncome) * 100
      : 0;

  const hasIgpData = Boolean(
    s.igpOverview &&
      (igpPrograms > 0 ||
        igpBeginning > 0 ||
        igpProjectedIncome > 0 ||
        igpApprovedBudget > 0 ||
        igpActualIncome > 0 ||
        igpUtilization > 0 ||
        igpDisbursement > 0)
  );

  const utilizationData = [
    { name: 'Obligations', value: totalObligations },
    { name: 'Balance', value: remainingBalance }
  ];

  const raodChartData = [
    { name: 'Allotment', amount: raodAllotment, fill: CHART_COLORS.budget },
    { name: 'Obligations', amount: raodObligations, fill: CHART_COLORS.obligations },
    { name: 'Disbursements', amount: raodDisbursements, fill: CHART_COLORS.disbursements },
    { name: 'Unobligated', amount: raodUnobligated, fill: CHART_COLORS.raodBalance }
  ];

  return (
    <Layout
      user={user}
      onLogout={onLogout}
      activePath={activePath}
      onNavigate={onNavigate}
    >
      {fiscalYearControl}

      {/* OVERALL KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 mb-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-3.5 flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-blue-600 flex items-center justify-center text-white flex-shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">TOTAL BUDGET</p>
            <p className="text-lg font-extrabold text-slate-800 truncate">{formatCurrency(totalBudget)}</p>
            <p className="text-[10px] text-slate-400">Approved allocation</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-3.5 flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-emerald-600 flex items-center justify-center text-white flex-shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">OBLIGATIONS</p>
            <p className="text-lg font-extrabold text-slate-800 truncate">{formatCurrency(totalObligations)}</p>
            <p className="text-[10px] text-slate-400">{formatPercentage(utilizationRate, 2)} of budget</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-3.5 flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-indigo-600 flex items-center justify-center text-white flex-shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">DISBURSEMENTS</p>
            <p className="text-lg font-extrabold text-slate-800 truncate">{formatCurrency(totalDisbursed)}</p>
            <p className="text-[10px] text-slate-400">{formatPercentage(disbursementRate, 2)} of budget</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-3.5 flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-orange-500 flex items-center justify-center text-white flex-shrink-0">
            <PieChartIcon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">REMAINING BALANCE</p>
            <p className="text-lg font-extrabold text-slate-800 truncate">{formatCurrency(remainingBalance)}</p>
            <p className="text-[10px] text-slate-400">
              {formatPercentage(totalBudget > 0 ? (remainingBalance / totalBudget) * 100 : 0, 2)} remaining
            </p>
          </div>
        </div>
      </div>

      {/* MAIN MONITORING ROW */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 mb-4">
        {/* RBUD */}
        <div className="xl:col-span-4 bg-white rounded-xl shadow-sm border border-slate-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              BUDGET UTILIZATION OVERVIEW (RBUD)
            </h3>
          </div>

          <div className="flex items-center gap-4 min-h-[175px]">
            <div className="relative w-32 h-32 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={utilizationData}
                    cx="50%"
                    cy="50%"
                    innerRadius={38}
                    outerRadius={55}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    <Cell fill={CHART_COLORS.obligations} />
                    <Cell fill={CHART_COLORS.balance} />
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-sm font-extrabold text-slate-800">
                  {formatPercentage(utilizationRate, 2)}
                </span>
                <span className="text-[8px] text-slate-400 uppercase">Utilization</span>
              </div>
            </div>

            <div className="space-y-2 text-[11px] flex-1 min-w-0">
              <div>
                <span className="flex items-center gap-1.5 text-slate-500">
                  <span className="w-2 h-2 rounded-full bg-blue-600" /> Budget
                </span>
                <p className="font-bold text-slate-800 mt-0.5">{formatCurrency(totalBudget)}</p>
              </div>

              <div>
                <span className="flex items-center gap-1.5 text-slate-500">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> Obligations
                </span>
                <p className="font-bold text-slate-800 mt-0.5">{formatCurrency(totalObligations)}</p>
              </div>

              <div>
                <span className="flex items-center gap-1.5 text-slate-500">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" /> Disbursements
                </span>
                <p className="font-bold text-slate-800 mt-0.5">{formatCurrency(totalDisbursed)}</p>
              </div>

              <div>
                <span className="flex items-center gap-1.5 text-slate-500">
                  <span className="w-2 h-2 rounded-full bg-amber-500" /> Balance
                </span>
                <p className="font-bold text-slate-800 mt-0.5">{formatCurrency(remainingBalance)}</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('/rbud')}
            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
          >
            View RBUD Details <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* FUND SOURCE / GROUP */}
        <div className="xl:col-span-5 bg-white rounded-xl shadow-sm border border-slate-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                BUDGET STATUS BY FUND SOURCE
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Approved budget compared with obligations and disbursements.
              </p>
            </div>
          </div>

          {fundSourceData.length === 0 ? (
            <div className="h-[150px] flex items-center justify-center border border-dashed border-slate-200 rounded-lg">
              <div className="text-center">
                <p className="text-xs font-semibold text-slate-500">No fund source data available</p>
                <p className="text-[10px] text-slate-400 mt-1">
                  Fund source budget records will appear here when available.
                </p>
              </div>
            </div>
          ) : (
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={fundSourceData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="group"
                    tick={{ fontSize: 9, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 9, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={formatCompact}
                  />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                  <Bar dataKey="budget" fill={CHART_COLORS.budget} radius={[2, 2, 0, 0]} name="Budget" />
                  <Bar dataKey="obligations" fill={CHART_COLORS.obligations} radius={[2, 2, 0, 0]} name="Obligations" />
                  <Bar dataKey="disbursements" fill={CHART_COLORS.disbursements} radius={[2, 2, 0, 0]} name="Disbursements" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* RECENT TRANSACTIONS */}
        <div className="xl:col-span-3 bg-white rounded-xl shadow-sm border border-slate-100 p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-bold text-slate-700 tracking-wider">Recent Transactions (RBUD)</h3>
            <button
              onClick={() => onNavigate('/rbud')}
              className="text-[10px] text-blue-600 font-medium inline-flex items-center gap-0.5 hover:underline"
            >
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-1.5 text-[10px]">
            {transactions.length === 0 ? (
              <div className="py-10 text-center text-slate-400">No recent transactions.</div>
            ) : (
              transactions.map((tx, index) => (
                <div
                  key={tx.id || tx.registry_no || index}
                  className="flex items-center justify-between gap-2 p-1.5 rounded hover:bg-slate-50 border-b border-slate-50"
                >
                  <div className="min-w-0">
                    <span
                      className={`inline-block px-1.5 py-0.5 text-[8px] font-bold rounded mb-0.5 ${
                        tx.type === 'RBUD'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}
                    >
                      {tx.type || 'TX'}
                    </span>
                    <p className="font-mono text-[9px] text-slate-500 truncate">
                      {tx.ref || tx.registry_no || '-'}
                    </p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-slate-800">{formatCurrency(tx.amount)}</p>
                    <span
                      className={`px-1.5 py-0.5 text-[8px] rounded font-medium ${
                        tx.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-700'
                          : tx.status === 'PARTIALLY DISBURSED'
                            ? 'bg-blue-100 text-blue-700'
                            : tx.status === 'OBLIGATED'
                              ? 'bg-amber-100 text-amber-700'
                              : tx.status === 'CANCELLED'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {tx.status || '-'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* RAOD */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 mb-4">
        <div className="flex items-center gap-1 mb-2">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            ALLOTMENT, OBLIGATION & DISBURSEMENT OVERVIEW (RAOD)
          </h3>
          <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
        </div>

        {raodAllotment === 0 && raodObligations === 0 && raodDisbursements === 0 ? (
          <div className="py-5 flex items-center justify-center border border-dashed border-slate-200 rounded-lg">
            <div className="text-center">
              <p className="text-xs font-semibold text-slate-500">No RAOD data available</p>
              <p className="text-[10px] text-slate-400 mt-1">RAOD records for {selectedYear} will appear here.</p>
            </div>
          </div>
        ) : (
          <div className="h-[190px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={raodChartData} margin={{ top: 5, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 9, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 9, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={formatCompact}
                />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Bar dataKey="amount" radius={[3, 3, 0, 0]}>
                  {raodChartData.map((entry, index) => (
                    <Cell key={`raod-cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-100 text-center">
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-medium">Obligation Rate</p>
            <p className="text-base font-extrabold text-emerald-600">{formatPercentage(raodObligationRate, 2)}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-medium">Disbursement Rate</p>
            <p className="text-base font-extrabold text-indigo-600">{formatPercentage(raodDisbursementRate, 2)}</p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('/raod')}
          className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
        >
          View RAOD Details <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* FUND 161 / IGP FINANCIAL OVERVIEW
          Added without changing the existing RBUD, Fund Source, Recent Transactions,
          or RAOD charts below. */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 mb-4">
        {/* IGP FINANCIAL OVERVIEW */}
        <div className="xl:col-span-8 bg-white rounded-xl shadow-sm border border-slate-100 p-4">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-800">
                Fund 161 Financial Overview
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">
                FY {selectedYear} budget and actual financial activity.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-[9px] font-bold">
              FUND 161
            </span>
          </div>

          {!hasIgpData ? (
            <div className="min-h-[150px] flex items-center justify-center border border-dashed border-slate-200 rounded-lg">
              <div className="text-center">
                <p className="text-xs font-semibold text-slate-500">
                  No IGP data available
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  Fund 161 financial data will appear here when available.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="rounded-lg bg-slate-50 border border-slate-100 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-bold text-slate-600">
                      Projected vs Collection
                    </p>
                    <p className="text-[10px] font-extrabold text-blue-700">
                      {formatPercentage(igpCollectionRate, 2)}
                    </p>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${Math.min(100, igpCollectionRate)}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-[9px] text-slate-400">
                    <span>{formatCurrency(igpActualIncome)} collected</span>
                    <span>{formatCurrency(igpProjectedIncome)} projected</span>
                  </div>
                </div>

                <div className="rounded-lg bg-slate-50 border border-slate-100 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-bold text-slate-600">
                      Utilization
                    </p>
                    <p className="text-[10px] font-extrabold text-orange-600">
                      {formatPercentage(igpUtilizationRate, 2)}
                    </p>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-500 rounded-full"
                      style={{ width: `${Math.min(100, igpUtilizationRate)}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-[9px] text-slate-400">
                    <span>{formatCurrency(igpUtilization)} utilized</span>
                    <span>{formatCurrency(igpActualIncome)} collection</span>
                  </div>
                </div>

                <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-3">
                  <p className="text-[9px] font-bold uppercase tracking-wide text-emerald-600">
                    Available Balance
                  </p>
                  <p className="text-xl font-extrabold text-emerald-700 mt-1">
                    {formatCurrency(igpAvailableBalance)}
                  </p>
                  <p className="text-[9px] text-emerald-600 mt-1">
                    After current IGP activity
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100">
                <div>
                  <p className="text-[9px] text-slate-400 uppercase font-medium">
                    Beginning Balance
                  </p>
                  <p className="text-sm font-extrabold text-blue-700 mt-1">
                    {formatCurrency(igpBeginning)}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] text-slate-400 uppercase font-medium">
                    Disbursement
                  </p>
                  <p className="text-sm font-extrabold text-indigo-600 mt-1">
                    {formatCurrency(igpDisbursement)}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] text-slate-400 uppercase font-medium">
                    Unpaid Utilization
                  </p>
                  <p className="text-sm font-extrabold text-red-600 mt-1">
                    {formatCurrency(igpUnpaid)}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] text-slate-400 uppercase font-medium">
                    Approved Budget
                  </p>
                  <p className="text-sm font-extrabold text-violet-600 mt-1">
                    {formatCurrency(igpApprovedBudget)}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* IGP SUMMARY */}
        <div className="xl:col-span-4 bg-white rounded-xl shadow-sm border border-slate-100 p-4">
          <div className="mb-3">
            <h3 className="text-sm font-extrabold text-slate-800">
              Fund 161 Summary
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Current FY {selectedYear} status.
            </p>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5">
              <span className="text-[10px] text-slate-500">Programs / Projects</span>
              <span className="text-sm font-extrabold text-slate-800">{igpPrograms}</span>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-blue-50 px-3 py-2.5">
              <span className="text-[10px] text-blue-700">Projected Income</span>
              <span className="text-xs font-extrabold text-blue-700">
                {formatCurrency(igpProjectedIncome)}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-violet-50 px-3 py-2.5">
              <span className="text-[10px] text-violet-700">Approved Budget</span>
              <span className="text-xs font-extrabold text-violet-700">
                {formatCurrency(igpApprovedBudget)}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2.5">
              <span className="text-[10px] text-emerald-700">Available Balance</span>
              <span className="text-xs font-extrabold text-emerald-700">
                {formatCurrency(igpAvailableBalance)}
              </span>
            </div>
          </div>

          <button
            onClick={() => onNavigate('/igp/overview')}
            className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
          >
            View IGP Registry <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </Layout>
  );
}