// frontend/src/components/RbudBudgetAllocation.jsx
import React, { useState, useEffect } from 'react';
import Layout from './layout/Layout';
import Toast from './Toast';
import {
  Wallet,
  TrendingUp,
  PieChart as PieChartIcon,
  DollarSign,
  Percent,
  ArrowUpRight,
  Eye,
  ListFilter,
  Download,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Layers,
} from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

// --- DUMMY DATA (used when API fails) ---
const DUMMY_SUMMARY = {
  total_budget: 264750000,
  total_allocated: 120450000,
  total_disbursed: 58760250,
  total_available: 61689750,
  overall_utilization: '48.76%',
  ps_total: 112000000,
  mooe_total: 122500000,
  co_total: 30250000,
};

const DUMMY_ENTRIES = [
  { fundGroup: 'Main', noOfFunds: 3, approved: 120450000, allocated: 58430250, disbursed: 28150000, balance: 30280250, utilization: 48.52, status: 'Active' },
  { fundGroup: 'BGD', noOfFunds: 2, approved: 46800000, disbursed: 25910250, balance: 20889750, utilization: 75.96, status: 'Active' },
  { fundGroup: 'DOST', noOfFunds: 4, approved: 62250000, disbursed: 31780000, balance: 30470000, utilization: 51.02, status: 'Active' },
  { fundGroup: 'DA', noOfFunds: 3, approved: 15750000, disbursed: 8570000, balance: 7180000, utilization: 54.38, status: 'Active' },
  { fundGroup: 'CHED', noOfFunds: 3, approved: 12500000, disbursed: 6180450, balance: 6319550, utilization: 49.44, status: 'Active' },
  { fundGroup: 'Other Funds', noOfFunds: 1, approved: 7000000, disbursed: 3250000, balance: 3750000, utilization: 46.43, status: 'Active' },
];

const DUMMY_BREAKDOWN = [
  { classification: 'PS', approved: 112000000, allocated: 52860000, disbursed: 28150000, utilization: 47.10 },
  { classification: 'MOOE', approved: 122500000, allocated: 56420000, disbursed: 25910250, utilization: 46.03 },
  { classification: 'CO', approved: 30250000, allocated: 11170000, disbursed: 4700000, utilization: 37.00 },
];

export default function RbudBudgetAllocation({ user, onLogout, onNavigate, activePath }) {
  const token = localStorage.getItem('token');

  const [entries, setEntries] = useState(DUMMY_ENTRIES);
  const [summary, setSummary] = useState(DUMMY_SUMMARY);
  const [breakdown, setBreakdown] = useState(DUMMY_BREAKDOWN);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFiscalYear, setSelectedFiscalYear] = useState('2025');
  const [selectedFundGroup, setSelectedFundGroup] = useState('All');
  const [activeTab, setActiveTab] = useState('Summary');
  const [pagination, setPagination] = useState({ totalPages: 1, currentPage: 1, totalItems: 6 });
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'error') => setToast({ message: msg, type });
  const hideToast = () => setToast(null);

  const fetchBudgetAllocation = async (page = 1) => {
    try {
      setLoading(true);
      const url = `${API_URL}/budget/rbud/budget-allocation?page=${page}&limit=10&year=${selectedFiscalYear}&fundGroup=${selectedFundGroup}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        // If API fails, use dummy data
        console.warn('API failed, using dummy data');
        setEntries(DUMMY_ENTRIES);
        setSummary(DUMMY_SUMMARY);
        setBreakdown(DUMMY_BREAKDOWN);
        setPagination({ totalPages: 1, currentPage: 1, totalItems: DUMMY_ENTRIES.length });
        setLoading(false);
        return;
      }

      const data = await res.json();

      // Map backend data to frontend structure
      const mappedEntries = (data.entries || []).map((item) => ({
        fundGroup: item.fund_cluster || item.program_project || 'N/A',
        noOfFunds: item.noOfFunds || 1,
        approved: item.approved_budget || 0,
        allocated: item.allocated_budget || 0,
        disbursed: item.disbursed || 0,
        balance: item.available_balance || 0,
        utilization: item.utilized_percent || 0,
        status: item.status || 'Active',
      }));

      setEntries(mappedEntries.length > 0 ? mappedEntries : DUMMY_ENTRIES);
      setSummary(data.summary || DUMMY_SUMMARY);
      setBreakdown(data.breakdown || DUMMY_BREAKDOWN);
      setPagination({
        totalPages: data.totalPages || 1,
        currentPage: data.currentPage || 1,
        totalItems: data.totalItems || 0,
      });
    } catch (err) {
      console.error(err);
      setError(err.message);
      // Fallback to dummy
      setEntries(DUMMY_ENTRIES);
      setSummary(DUMMY_SUMMARY);
      setBreakdown(DUMMY_BREAKDOWN);
      setPagination({ totalPages: 1, currentPage: 1, totalItems: DUMMY_ENTRIES.length });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgetAllocation(1);
  }, [selectedFiscalYear, selectedFundGroup]);

  const formatCurrency = (value) => {
    if (value == null || isNaN(value)) return '₱0.00';
    return `₱${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getStatusBadge = (status) => (
    <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700">
      {status || 'Active'}
    </span>
  );

  // Color mapping for donut chart segments
  const fundColors = ['#8b5cf6', '#22c55e', '#3b82f6', '#f97316', '#06b6d4', '#ec4899'];
  const fundGroupData = entries.map((e, i) => ({
    name: e.fundGroup,
    amount: e.allocated || 0,
    color: fundColors[i % fundColors.length],
  }));

  // Overall totals for the table footer
  const totalApproved = entries.reduce((sum, e) => sum + (e.approved || 0), 0);
  const totalAllocated = entries.reduce((sum, e) => sum + (e.allocated || 0), 0);
  const totalDisbursed = entries.reduce((sum, e) => sum + (e.disbursed || 0), 0);
  const totalBalance = entries.reduce((sum, e) => sum + (e.balance || 0), 0);
  const totalUtil = totalAllocated > 0 ? (totalDisbursed / totalAllocated) * 100 : 0;

  // Build conic gradient string
  let cumulative = 0;
  const gradientSegments = fundGroupData
    .filter((g) => g.amount > 0)
    .map((g) => {
      const percent = (g.amount / totalAllocated) * 100;
      const start = cumulative;
      cumulative += percent;
      return `${g.color} ${start}% ${cumulative}%`;
    })
    .join(', ');
  const conicGradient = `conic-gradient(${gradientSegments})`;

  if (loading) {
    return (
      <Layout user={user} onLogout={onLogout} activePath={activePath} onNavigate={onNavigate}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-900 mx-auto" />
            <p className="mt-3 text-sm text-gray-500 font-medium">Loading Budget & Allocation...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout user={user} onLogout={onLogout} activePath={activePath} onNavigate={onNavigate}>
      <div className="p-1 space-y-6">
        {/* Breadcrumb & Date */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <nav className="text-xs text-gray-500 flex items-center gap-1 font-medium">
            <span className="text-indigo-900">Home</span>
            <span>›</span>
            <span>RBUD Registry</span>
            <span>›</span>
            <span className="text-gray-800 font-semibold">Budget & Allocation</span>
          </nav>
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 font-medium self-start sm:self-auto shadow-sm">
            <Calendar className="w-3.5 h-3.5 text-indigo-900" />
            <span>May 26, 2025</span>
          </div>
        </div>

        {/* Page Title */}
        <h1 className="text-2xl font-bold text-slate-900">RBUD Registry - Budget & Allocation</h1>

        {/* ===== 5 KPI CARDS ===== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
          {[
            { icon: Wallet, label: 'TOTAL RBUD BUDGET', value: formatCurrency(summary.total_budget || 0), sub: 'Total approved budget for RBUD', trend: '8.35%', color: 'text-indigo-700', bg: 'bg-indigo-50' },
            { icon: TrendingUp, label: 'TOTAL ALLOCATED', value: formatCurrency(summary.total_allocated || 0), sub: '45.48% of total RBUD budget', trend: '6.21%', color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { icon: PieChartIcon, label: 'TOTAL DISBURSED', value: formatCurrency(summary.total_disbursed || 0), sub: '22.20% of total RBUD budget', trend: '9.14%', color: 'text-blue-600', bg: 'bg-blue-50' },
            { icon: DollarSign, label: 'REMAINING BALANCE', value: formatCurrency(summary.total_available || 0), sub: '23.32% of total RBUD budget', trend: '4.02%', color: 'text-amber-600', bg: 'bg-amber-50' },
            { icon: Percent, label: 'OVERALL UTILIZATION', value: summary.overall_utilization || '0.00%', sub: '% of budget utilized', trend: '4.31%', color: 'text-teal-600', bg: 'bg-teal-50' },
          ].map((card, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 flex flex-col justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-lg ${card.bg} ${card.color}`}>
                  <card.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{card.label}</p>
                  <p className="text-lg font-extrabold text-slate-900 mt-0.5 truncate">{card.value}</p>
                </div>
              </div>
              <p className="text-[11px] text-gray-400 mt-2 font-medium">{card.sub}</p>
              <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold mt-1">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>{card.trend}</span>
                <span className="text-gray-400 font-normal">from last year</span>
              </div>
            </div>
          ))}
        </div>

        {/* ===== TABS & FILTERS ===== */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-200 pb-3">
          <div className="flex items-center gap-6 text-sm font-semibold">
            {['Summary', 'PS / MOOE / CO Breakdown', 'Allocation Details'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 relative transition ${
                  activeTab === tab ? 'text-indigo-900 border-b-2 border-indigo-900' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 self-end lg:self-auto">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
              <span>Fiscal Year</span>
              <select
                value={selectedFiscalYear}
                onChange={(e) => setSelectedFiscalYear(e.target.value)}
                className="bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-900"
              >
                <option value="2025">2025</option>
                <option value="2024">2024</option>
              </select>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
              <span>Fund Group</span>
              <select
                value={selectedFundGroup}
                onChange={(e) => setSelectedFundGroup(e.target.value)}
                className="bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-900"
              >
                <option value="All">All</option>
                <option value="Main">Main</option>
                <option value="BGD">BGD</option>
                <option value="Other Funds">Other Funds</option>
                <option value="DOST">DOST</option>
                <option value="DA">DA</option>
                <option value="CHED">CHED</option>
              </select>
            </div>
            <button className="flex items-center gap-1.5 bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-sm transition">
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* ===== CHARTS & BREAKDOWN ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Donut Chart */}
          <div className="lg:col-span-5 bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold text-indigo-950 uppercase tracking-wide">ALLOCATION BY FUND GROUP</h3>
              <p className="text-xs text-gray-400 mt-0.5 font-medium">Distribution of allocated budget per fund group</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-4 my-4">
              <div className="relative flex justify-center items-center">
                <div
                  className="w-36 h-36 rounded-full flex items-center justify-center"
                  style={{ background: conicGradient || '#e5e7eb' }}
                >
                  <div className="w-24 h-24 bg-white rounded-full flex flex-col items-center justify-center text-center p-1 shadow-inner">
                    <span className="text-[9px] font-bold text-gray-400 uppercase">TOTAL ALLOCATED</span>
                    <span className="text-sm font-extrabold text-slate-900">{formatCurrency(totalAllocated)}</span>
                    <span className="text-[9px] text-gray-400 font-semibold">100%</span>
                  </div>
                </div>
              </div>
              <div className="space-y-1.5 text-xs">
                {fundGroupData.map((fg) => (
                  <div key={fg.name} className="flex items-center justify-between font-medium">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: fg.color }}></span>
                      <span className="text-gray-700">{fg.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-800 font-semibold">{formatCurrency(fg.amount)}</span>
                      <span className="text-gray-400 w-10 text-right">
                        {totalAllocated > 0 ? ((fg.amount / totalAllocated) * 100).toFixed(2) : 0}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <button className="text-xs text-indigo-900 font-semibold flex items-center gap-1 hover:underline self-center mt-2">
              View by Fund Group →
            </button>
          </div>

          {/* PS / MOOE / CO Breakdown Table */}
          <div className="lg:col-span-7 bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold text-indigo-950 uppercase tracking-wide">PS / MOOE / CO BREAKDOWN (RBUD)</h3>
              <p className="text-xs text-gray-400 mt-0.5 font-medium">Allocation by budget classification</p>
            </div>
            <div className="overflow-x-auto my-3">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-500 font-bold text-[11px]">
                    <th className="py-2.5 text-left">Classification</th>
                    <th className="py-2.5 text-right">Approved Budget (₱)</th>
                    <th className="py-2.5 text-right">Allocated (₱)</th>
                    <th className="py-2.5 text-right">Disbursed (₱)</th>
                    <th className="py-2.5 text-right">Utilization (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {breakdown.map((row) => (
                    <tr key={row.classification} className="hover:bg-gray-50/50">
                      <td className="py-3 font-semibold text-slate-800">{row.classification}</td>
                      <td className="py-3 text-right font-medium text-slate-700">{formatCurrency(row.approved)}</td>
                      <td className="py-3 text-right font-medium text-slate-700">{formatCurrency(row.allocated)}</td>
                      <td className="py-3 text-right font-medium text-slate-700">{formatCurrency(row.disbursed)}</td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="font-semibold text-slate-800">{row.utilization.toFixed(2)}%</span>
                          <div className="w-16 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-indigo-900 h-full rounded-full" style={{ width: `${Math.min(row.utilization, 100)}%` }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-gray-200 font-extrabold text-slate-900">
                    <td className="py-3">TOTAL</td>
                    <td className="py-3 text-right">{formatCurrency(summary.total_budget || 0)}</td>
                    <td className="py-3 text-right">{formatCurrency(summary.total_allocated || 0)}</td>
                    <td className="py-3 text-right">{formatCurrency(summary.total_disbursed || 0)}</td>
                    <td className="py-3 text-right">{summary.overall_utilization || '0.00%'}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* ===== ALLOCATION DETAILS PER FUND GROUP TABLE ===== */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-xs font-bold text-indigo-950 uppercase tracking-wide">ALLOCATION DETAILS PER FUND GROUP</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50/60 text-gray-500 font-bold text-[10px] uppercase border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left">Fund Group</th>
                  <th className="px-4 py-3 text-center">No. of Funds</th>
                  <th className="px-4 py-3 text-right">Approved Budget (₱)</th>
                  <th className="px-4 py-3 text-right">Allocated (₱)</th>
                  <th className="px-4 py-3 text-right">Disbursed (₱)</th>
                  <th className="px-4 py-3 text-right">Balance (₱)</th>
                  <th className="px-4 py-3 text-center min-w-[100px]">Utilization (%)</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {entries.map((entry, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/60 transition">
                    <td className="px-4 py-3 font-semibold text-slate-800 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-indigo-900 text-white flex items-center justify-center text-[10px] font-bold">
                        {entry.fundGroup.charAt(0)}
                      </span>
                      <span>{entry.fundGroup}</span>
                    </td>
                    <td className="px-4 py-3 text-center font-medium text-slate-700">{entry.noOfFunds}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-700">{formatCurrency(entry.approved)}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-700">{formatCurrency(entry.allocated)}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-700">{formatCurrency(entry.disbursed)}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-700">{formatCurrency(entry.balance)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <span className="font-semibold text-slate-800 text-[11px]">{entry.utilization.toFixed(2)}%</span>
                        <div className="w-16 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-indigo-900 h-full rounded-full" style={{ width: `${Math.min(entry.utilization, 100)}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">{getStatusBadge(entry.status)}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button className="p-1 text-slate-600 hover:bg-gray-100 rounded transition" title="View">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-slate-600 hover:bg-gray-100 rounded transition" title="Filter">
                          <ListFilter className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50/60 font-extrabold text-slate-900 border-t border-gray-200">
                <tr>
                  <td className="px-4 py-3">TOTAL</td>
                  <td className="px-4 py-3 text-center">{entries.length}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(totalApproved)}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(totalAllocated)}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(totalDisbursed)}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(totalBalance)}</td>
                  <td className="px-4 py-3 text-center font-bold">{totalUtil.toFixed(2)}%</td>
                  <td className="px-4 py-3 text-center">—</td>
                  <td className="px-4 py-3 text-center">—</td>
                </tr>
              </tfoot>
            </table>
          </div>
          {/* Pagination */}
          <div className="px-4 py-3 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-gray-500 font-medium bg-white">
            <span>Showing 1 to {entries.length} of {pagination.totalItems} entries</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchBudgetAllocation(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="w-7 h-7 flex items-center justify-center rounded-lg bg-indigo-900 text-white font-bold text-xs">
                {pagination.currentPage}
              </span>
              <button
                onClick={() => fetchBudgetAllocation(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
                className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <select className="ml-2 bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-700 font-semibold focus:outline-none">
                <option value="10">10 / page</option>
                <option value="25">25 / page</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center text-xs text-gray-400 border-t border-gray-100 pt-5 mt-4">
          <span>© 2025 University of Abra. All rights reserved.</span>
          <span>Budget Monitoring & Allocation System v1.0.0</span>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </Layout>
  );
}