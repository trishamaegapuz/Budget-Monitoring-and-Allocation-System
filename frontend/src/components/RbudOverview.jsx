import React, { useState, useEffect } from 'react';
import Layout from './layout/Layout';
import Toast from './Toast';
import {
  FileText,
  PlusCircle,
  BarChart3,
  Layers3,
  ClipboardList,
  Clock3,
  AlertCircle,
  Undo2,
  Wallet,
  PieChart as PieChartIcon,
  ChevronDown,
  Calendar,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from 'recharts';

const CHART_BLUE = '#2563eb';
const CHART_GREEN = '#16a34a';

export default function RbudOverview({ user, onLogout, onNavigate, activePath }) {
  // --------------------------------------------
  // 1. DATA 
  // --------------------------------------------
  const DUMMY_DATA = {
    kpi: {
      total_records: 5842,
      total_allocation: 120450000.0,
      total_disbursed: 58760250.0,
      remaining_balance: 61689750.0,
      utilization_rate: 48.76,
    },
    quick_access: [
      { icon: Layers3, label: 'Fund Registries', desc: 'Manage funds', color: 'text-purple-600', bgColor: 'bg-purple-50' },
      { icon: PlusCircle, label: 'Add Transaction', desc: 'New RBUD record', color: 'text-blue-600', bgColor: 'bg-blue-50' },
      { icon: BarChart3, label: 'Budget Utilization', desc: 'Monitor utilization', color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
      { icon: ClipboardList, label: 'Reports', desc: 'Generate reports', color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
    ],
    fund_groups: ['Main', 'BGD', 'Other Funds', 'DOST', 'DA', 'CHED'], 
    fund_group_summary: [
      { group: 'Main', num_funds: 3, allocation: 120450000, disbursed: 58430250, balance: 61689750, utilization: 48.52, status: 'Active', abbrev: 'M', color: 'bg-purple-600 text-white' },
      { group: 'BGD', num_funds: 2, allocation: 46800000, disbursed: 35549550, balance: 11250450, utilization: 75.96, status: 'Active', abbrev: 'B', color: 'bg-emerald-600 text-white' },
      { group: 'Other Funds', num_funds: 1, allocation: 7000000, disbursed: 3250000, balance: 3750000, utilization: 46.43, status: 'Active', abbrev: 'O', color: 'bg-amber-600 text-white' },
      { group: 'DOST', num_funds: 4, allocation: 62250000, disbursed: 31780000, balance: 30470000, utilization: 51.02, status: 'Active', abbrev: 'D', color: 'bg-blue-600 text-white' },
      { group: 'DA', num_funds: 3, allocation: 15750000, disbursed: 8570000, balance: 7180000, utilization: 54.38, status: 'Active', abbrev: 'A', color: 'bg-amber-500 text-white' },
      { group: 'CHED', num_funds: 3, allocation: 12500000, disbursed: 6180450, balance: 6319550, utilization: 49.44, status: 'Active', abbrev: 'C', color: 'bg-purple-500 text-white' },
    ],
    trend_data: [
      { month: 'Jan', allocated: 10000000, disbursed: 2000000 },
      { month: 'Feb', allocated: 25000000, disbursed: 10000000 },
      { month: 'Mar', allocated: 38000000, disbursed: 18000000 },
      { month: 'Apr', allocated: 50000000, disbursed: 25000000 },
      { month: 'May', allocated: 62000000, disbursed: 31000000 },
      { month: 'Jun', allocated: 75000000, disbursed: 38000000 },
      { month: 'Jul', allocated: 85000000, disbursed: 44000000 },
      { month: 'Aug', allocated: 95000000, disbursed: 50000000 },
      { month: 'Sep', allocated: 105000000, disbursed: 55000000 },
      { month: 'Oct', allocated: 115000000, disbursed: 60000000 },
      { month: 'Nov', allocated: 122000000, disbursed: 65000000 },
      { month: 'Dec', allocated: 130000000, disbursed: 70000000 },
    ],
    recent_entries: [
      { date: 'May 26, 2025', rbud_no: 'RBUD-2025-00412', burs: '2025-05-00412', payee: 'A&J Trading', particulars: 'Office Supplies', fund: '164-11-02 (Main LP Trust)', amount: 120000.00, status: 'Approved' },
      { date: 'May 26, 2025', rbud_no: 'RBUD-2025-00411', burs: '2025-05-00411', payee: 'Abra Gen. Hospital', particulars: 'Medical Supplies', fund: '164-12-01 (BGD TR/JHS/GS)', amount: 45000.00, status: 'Approved' },
      { date: 'May 23, 2025', rbud_no: 'RBUD-2025-00408', burs: '2025-05-00408', payee: 'Travel & Tours', particulars: 'Travel Expenses', fund: '164-11-03 (Main SHS)', amount: 18750.00, status: 'Approved' },
      { date: 'May 23, 2025', rbud_no: 'RBUD-2025-00407', burs: '2025-05-00407', payee: 'DOST-CAR', particulars: 'Research Grant', fund: '164-14-01 (DOST-CAR AFS-OM)', amount: 210000.00, status: 'Pending' },
      { date: 'May 22, 2025', rbud_no: 'RBUD-2025-00405', burs: '2025-05-00405', payee: 'DA-Regional Office', particulars: 'Training & Seminar', fund: '164-15-01 (DA-BAR Coffee)', amount: 95000.00, status: 'Approved' },
    ],
    pending_approvals: [
      { label: 'Pending Transactions', desc: 'Transactions awaiting approval', count: 12, icon: Clock3, color: 'text-amber-500', bgColor: 'bg-amber-50' },
      { label: 'For Liquidation', desc: 'Transactions for liquidation', count: 7, icon: AlertCircle, color: 'text-blue-600', bgColor: 'bg-blue-50' },
      { label: 'For Review', desc: 'Transactions for review', count: 5, icon: ClipboardList, color: 'text-purple-600', bgColor: 'bg-purple-50' },
      { label: 'Returned', desc: 'Returned transactions', count: 3, icon: Undo2, color: 'text-rose-500', bgColor: 'bg-rose-50' },
    ],
  };

  // --------------------------------------------
  // 2. STATE
  // --------------------------------------------
  const [loading, setLoading] = useState(true);
  const [overview] = useState(DUMMY_DATA);
  const [selectedGroup, setSelectedGroup] = useState('All Groups');
  const [toast, setToast] = useState(null);

  const hideToast = () => setToast(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // --------------------------------------------
  // 3. HELPERS
  // --------------------------------------------
  const formatCurrency = (value) => {
    if (value == null || isNaN(value)) return '₱0.00';
    return '₱' + Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const getStatusBadge = (status) => {
    const map = {
      Approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      Pending: 'bg-amber-100 text-amber-700 border-amber-200',
    };
    return map[status] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  // --------------------------------------------
  // 4. DERIVED CALCULATIONS
  // --------------------------------------------
  const d = overview || DUMMY_DATA;
  const kpi = d.kpi;
  const quickAccess = d.quick_access;
  const fundGroups = d.fund_groups;
  const fundGroupSummary = d.fund_group_summary;
  const trendData = d.trend_data;
  const recentEntries = d.recent_entries;
  const pendingApprovals = d.pending_approvals;

  const totalFunds = fundGroupSummary.reduce((s, r) => s + r.num_funds, 0);
  const totalAllocation = fundGroupSummary.reduce((s, r) => s + r.allocation, 0);
  const totalDisbursed = fundGroupSummary.reduce((s, r) => s + r.disbursed, 0);
  const totalBalance = fundGroupSummary.reduce((s, r) => s + r.balance, 0);
  const overallUtilization = totalAllocation > 0 ? (totalDisbursed / totalAllocation) * 100 : 0;

  // --------------------------------------------
  // 5. RENDER
  // --------------------------------------------
  if (loading) {
    return (
      <Layout user={user} onLogout={onLogout} activePath={activePath} onNavigate={onNavigate}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a237e] mx-auto" />
            <p className="mt-3 text-sm text-gray-500">Loading RBUD Overview...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout user={user} onLogout={onLogout} activePath={activePath} onNavigate={onNavigate}>
      <div className="p-2 space-y-6 bg-slate-50 min-h-screen">
        {/* HEADER & DATE PICKER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center text-xs text-gray-500 gap-1.5 mb-1">
              <span>Home</span>
              <span className="text-gray-400">&gt;</span>
              <span>RBUD Registry</span>
              <span className="text-gray-400">&gt;</span>
              <span className="font-medium text-[#1a237e]">Overview</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">RBUD Registry - Overview</h1>
          </div>

          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm text-xs font-medium text-slate-700 self-start md:self-auto cursor-pointer">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span>May 26, 2025</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </div>
        </div>

        {/* KPI CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { icon: FileText, label: 'TOTAL RBUD RECORDS', value: kpi.total_records?.toLocaleString() || '0', color: 'text-purple-600', bgColor: 'bg-purple-600', sub: 'All time records', trend: '↑ 8.35% from last month' },
            { icon: Wallet, label: 'TOTAL ALLOCATION', value: formatCurrency(kpi.total_allocation), color: 'text-emerald-600', bgColor: 'bg-emerald-600', sub: 'Allocated to RBUD funds', trend: '↑ 6.21% from last month' },
            { icon: PlusCircle, label: 'TOTAL DISBURSED', value: formatCurrency(kpi.total_disbursed), color: 'text-blue-600', bgColor: 'bg-blue-600', sub: 'Total amount disbursed', trend: '↑ 9.14% from last month' },
            { icon: Layers3, label: 'REMAINING BALANCE', value: formatCurrency(kpi.remaining_balance), color: 'text-amber-600', bgColor: 'bg-amber-500', sub: 'Unutilized balance', trend: '↑ 4.02% from last month' },
            { icon: PieChartIcon, label: 'UTILIZATION RATE', value: `${kpi.utilization_rate || 0}%`, color: 'text-teal-600', bgColor: 'bg-teal-500', sub: '% of allocation used', trend: '↑ 4.31% from last month' },
          ].map((card, i) => (
            <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-start gap-3">
              <div className={`${card.bgColor} text-white p-2.5 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm`}>
                <card.icon className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold text-slate-500 tracking-wider uppercase truncate">{card.label}</p>
                <p className="text-lg font-black text-slate-900 mt-0.5 truncate tracking-tight">{card.value}</p>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate">{card.sub}</p>
                <p className="text-[10px] text-emerald-600 font-medium mt-1 truncate">{card.trend}</p>
              </div>
            </div>
          ))}
        </div>

        {/* QUICK ACCESS & FUND GROUPS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white p-5 rounded-xl shadow-sm border border-slate-100">
            <h4 className="text-xs font-bold text-slate-500 tracking-wider uppercase mb-4">QUICK ACCESS</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {quickAccess.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 border border-slate-100 rounded-xl hover:border-slate-300 hover:shadow-sm cursor-pointer transition bg-slate-50/50">
                  <div className={`p-2 rounded-lg ${item.bgColor} ${item.color}`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{item.label}</p>
                    <p className="text-[10px] text-slate-400 truncate">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between overflow-hidden">
            <h4 className="text-xs font-bold text-slate-500 tracking-wider uppercase mb-4">FUND GROUPS</h4>
            <div className="flex flex-nowrap gap-2 overflow-x-auto pb-2 scrollbar-thin">
              <button
                onClick={() => setSelectedGroup('All Groups')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition whitespace-nowrap flex-shrink-0 ${
                  selectedGroup === 'All Groups'
                    ? 'bg-[#1a237e] text-white border-[#1a237e] shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'
                }`}
              >
                All Groups
              </button>
              {fundGroups.map((group) => (
                <button
                  key={group}
                  onClick={() => setSelectedGroup(group)}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition whitespace-nowrap flex-shrink-0 ${
                    selectedGroup === group
                      ? 'bg-[#1a237e] text-white border-[#1a237e] shadow-sm'
                      : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  {group}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* MAIN DASHBOARD CONTENT GRID (2 COLUMNS) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT COLUMN: TABLES */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* RBUD Fund Group Summary Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col justify-between">
              <div>
                <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="text-xs font-bold text-slate-700 tracking-wider uppercase">RBUD FUND GROUP SUMMARY</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="px-4 py-3 text-left">Fund Group</th>
                        <th className="px-3 py-3 text-center">No. of Funds</th>
                        <th className="px-4 py-3 text-right">Total Allocation (₱)</th>
                        <th className="px-4 py-3 text-right">Disbursed (₱)</th>
                        <th className="px-4 py-3 text-right">Balance (₱)</th>
                        <th className="px-4 py-3 text-center min-w-[120px]">Utilization (%)</th>
                        <th className="px-3 py-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {fundGroupSummary.map((g, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/80 transition">
                          <td className="px-4 py-3 flex items-center gap-2.5">
                            <span className={`${g.color} w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] flex-shrink-0 shadow-sm`}>
                              {g.abbrev}
                            </span>
                            <span className="font-bold text-slate-800">{g.group}</span>
                          </td>
                          <td className="px-3 py-3 text-center text-slate-600 font-medium">{g.num_funds}</td>
                          <td className="px-4 py-3 text-right font-mono text-slate-800 font-semibold">{formatCurrency(g.allocation)}</td>
                          <td className="px-4 py-3 text-right font-mono text-slate-700">{formatCurrency(g.disbursed)}</td>
                          <td className="px-4 py-3 text-right font-mono text-slate-700">{formatCurrency(g.balance)}</td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-800 text-[11px] w-12 text-right">{g.utilization.toFixed(2)}%</span>
                              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden flex-1">
                                <div className="bg-[#1a237e] h-1.5 rounded-full" style={{ width: `${Math.min(g.utilization, 100)}%` }}></div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-center">
                            <span className="px-2.5 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                              {g.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 font-bold text-slate-900 border-t border-slate-200 text-xs">
                      <tr>
                        <td className="px-4 py-3">TOTAL</td>
                        <td className="px-3 py-3 text-center">{totalFunds}</td>
                        <td className="px-4 py-3 text-right font-mono">{formatCurrency(totalAllocation)}</td>
                        <td className="px-4 py-3 text-right font-mono">{formatCurrency(totalDisbursed)}</td>
                        <td className="px-4 py-3 text-right font-mono">{formatCurrency(totalBalance)}</td>
                        <td className="px-4 py-3 text-center font-semibold">{overallUtilization.toFixed(2)}%</td>
                        <td className="px-3 py-3 text-center text-slate-400">—</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
              <div className="px-5 py-3 border-t border-slate-100 text-center">
                <button className="text-xs text-[#1a237e] font-bold hover:underline inline-flex items-center gap-1">
                  View All Fund Registries <span>→</span>
                </button>
              </div>
            </div>

            {/* Recent RBUD Transactions Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col justify-between">
              <div>
                <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="text-xs font-bold text-slate-700 tracking-wider uppercase">RECENT RBUD TRANSACTIONS</h3>
                  <button className="text-xs text-[#1a237e] font-bold hover:underline">View All Transactions</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="px-4 py-3 text-left">DATE</th>
                        <th className="px-4 py-3 text-left">RBUD NO.</th>
                        <th className="px-4 py-3 text-left">BURS SERIAL NO.</th>
                        <th className="px-4 py-3 text-left">PAYEE / NAME</th>
                        <th className="px-4 py-3 text-left">PARTICULARS</th>
                        <th className="px-4 py-3 text-left">FUND</th>
                        <th className="px-4 py-3 text-right">AMOUNT (₱)</th>
                        <th className="px-4 py-3 text-center">STATUS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {recentEntries.map((tx, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/80 transition">
                          <td className="px-4 py-3 text-slate-600 font-medium whitespace-nowrap">{tx.date}</td>
                          <td className="px-4 py-3 font-mono font-bold text-slate-800">{tx.rbud_no}</td>
                          <td className="px-4 py-3 text-slate-600 font-mono">{tx.burs}</td>
                          <td className="px-4 py-3 font-bold text-slate-800">{tx.payee}</td>
                          <td className="px-4 py-3 text-slate-600 max-w-[120px] truncate">{tx.particulars}</td>
                          <td className="px-4 py-3 text-slate-600 font-mono text-[11px]">{tx.fund}</td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-slate-800">{formatCurrency(tx.amount)}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(tx.status)}`}>
                              {tx.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="px-5 py-3 text-[11px] text-slate-400 border-t border-slate-100">
                Showing 1 to {recentEntries.length} of 25 entries
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: CHARTS & SIDE PANELS */}
          <div className="space-y-6">

            {/* Allocation vs Disbursement Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs font-bold text-slate-700 tracking-wider uppercase">ALLOCATION VS DISBURSEMENT</h3>
                  <div className="flex items-center gap-1 text-xs text-slate-600 border border-slate-200 px-2.5 py-1 rounded-md shadow-sm">
                    <span>This Year</span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </div>
                </div>

                <div className="flex items-center justify-center gap-4 text-xs font-semibold mb-4">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-blue-600 rounded-sm"></span>
                    <span className="text-slate-600">Allocated Amount</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-emerald-600 rounded-sm"></span>
                    <span className="text-slate-600">Disbursed Amount</span>
                  </div>
                </div>

                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(val) => `${val / 1000000}M`}
                        tick={{ fontSize: 10, fill: '#64748b' }}
                      />
                      <RechartsTooltip formatter={(val) => formatCurrency(val)} />
                      <Line type="monotone" dataKey="allocated" stroke={CHART_BLUE} strokeWidth={2} dot={{ r: 3, fill: CHART_BLUE }} />
                      <Line type="monotone" dataKey="disbursed" stroke={CHART_GREEN} strokeWidth={2} dot={{ r: 3, fill: CHART_GREEN }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Pending Approvals Widget */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-xs font-bold text-slate-700 tracking-wider uppercase">PENDING APPROVALS</h4>
                  <button className="text-xs text-[#1a237e] font-bold hover:underline">View All</button>
                </div>
                <div className="space-y-3">
                  {pendingApprovals.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl hover:border-slate-200 transition bg-slate-50/30">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl ${item.bgColor} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                          <item.icon className={`w-5 h-5 ${item.color}`} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">{item.label}</p>
                          <p className="text-[10px] text-slate-400">{item.desc}</p>
                        </div>
                      </div>
                      <span className={`text-lg font-black ${item.color}`}>{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* FOOTER */}
        <div className="flex flex-col sm:flex-row justify-between items-center text-xs text-slate-400 border-t border-slate-200 pt-5 mt-6 gap-2">
          <span>© 2025 University of Abra. All rights reserved.</span>
          <span className="font-medium">Budget Monitoring & Allocation System v1.0.0</span>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </Layout>
  );
}