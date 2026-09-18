// frontend/src/components/FundRegistriesMain.jsx
import React, { useState } from 'react';
import Layout from './layout/Layout';
import {
  Folder,
  Banknote,
  Download,
  TrendingUp,
  Eye,
  FileText,
  MoreVertical,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function FundRegistriesMain({ user, onLogout, onNavigate, activePath }) {
  const [data, setData] = useState({
    summaryCards: {
      total_funds: 3,
      total_allocation: 120450000,
      total_disbursed: 58430250,
      remaining_balance: 61689750,
      utilization_rate: 48.52,
    },
    funds: [
      {
        id: 1,
        fund_code: '164-11-01',
        fund_name: '164 Main TR & JHS',
        sub_name: 'Trust Receipts - JHS/GS',
        fund_type: 'Trust Receipts',
        records: 256,
        allocation: 45320000,
        disbursed: 32870500,
        balance: 12449500,
        utilization: 72.53,
        status: 'Active',
        slug: '164-main-tr-jhs',
      },
      {
        id: 2,
        fund_code: '164-11-02',
        fund_name: '164 Main LP Trust',
        sub_name: 'Local Programs Trust Fund',
        fund_type: 'Trust Fund',
        records: 284,
        allocation: 10470000,
        disbursed: 160000,
        balance: 10310000,
        utilization: 1.51,
        status: 'Active',
        slug: '164-main-lp-trust',
      },
      {
        id: 3,
        fund_code: '164-11-03',
        fund_name: '164 Main SHS',
        sub_name: 'Senior High School',
        fund_type: 'Trust Receipts',
        records: 198,
        allocation: 64660000,
        disbursed: 58770500,
        balance: 5889500,
        utilization: 90.9,
        status: 'Active',
        slug: '164-main-shs',
      },
    ],
    totals: {
      records: 738,
      allocation: 120450000,
      disbursed: 91801000,
      balance: 28649000,
      utilization: 76.21,
    },
    recentActivity: [
      { date: 'May 26, 2025', fund: '164 Main TR & JHS', activity: 'New disbursement recorded', user: 'Administrator', dotColor: 'bg-emerald-500' },
      { date: 'May 26, 2025', fund: '164 Main LP Trust', activity: 'Fund allocation updated', user: 'Budget Officer', dotColor: 'bg-blue-500' },
      { date: 'May 25, 2025', fund: '164 Main SHS', activity: 'Transaction approved', user: 'Budget Officer', dotColor: 'bg-emerald-500' },
      { date: 'May 23, 2025', fund: '164 Main TR & JHS', activity: 'New transaction recorded', user: 'Encoder', dotColor: 'bg-amber-500' },
      { date: 'May 22, 2025', fund: '164 Main SHS', activity: 'Disbursement voided', user: 'Administrator', dotColor: 'bg-rose-500' },
    ],
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('Main');

  // Chart Data Preparation
  const chartData = data.funds.map((f) => ({
    name: f.fund_code,
    fullName: f.fund_name,
    Allocation: f.allocation / 1000000,
    Disbursement: f.disbursed / 1000000,
    allocDisplay: (f.allocation / 1000000).toFixed(2) + 'M',
    disbDisplay: (f.disbursed / 1000000).toFixed(2) + 'M',
  }));

  const formatCurrency = (val) => {
    return '₱' + Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleViewFund = (slug) => {
    if (onNavigate) {
      onNavigate(`/rbud/fund-registries/${slug}`);
    }
  };

  return (
    <Layout user={user} onLogout={onLogout} activePath={activePath} onNavigate={onNavigate}>
      <div className="p-6 text-slate-800">
        {/* Page Title & Breadcrumb */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Fund Registries - Main</h1>
          <p className="text-xs text-slate-500 mt-1">
            Home &gt; RBUD Registry &gt; Fund Registries &gt; <span className="font-semibold text-slate-700">Main</span>
          </p>
        </div>

        {/* 5 Summary KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          {/* Card 1 */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <Folder className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">TOTAL FUNDS (MAIN)</span>
              <div className="text-xl font-extrabold text-slate-900 mt-0.5">{data.summaryCards.total_funds}</div>
              <div className="text-[10px] text-emerald-600 font-medium mt-0.5">↑ 0% <span className="text-slate-400">from last month</span></div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">TOTAL ALLOCATION</span>
              <div className="text-xl font-extrabold text-slate-900 mt-0.5">{formatCurrency(data.summaryCards.total_allocation)}</div>
              <div className="text-[10px] text-emerald-600 font-medium mt-0.5">↑ 6.21% <span className="text-slate-400">from last month</span></div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">TOTAL DISBURSED</span>
              <div className="text-xl font-extrabold text-slate-900 mt-0.5">{formatCurrency(data.summaryCards.total_disbursed)}</div>
              <div className="text-[10px] text-emerald-600 font-medium mt-0.5">↑ 9.14% <span className="text-slate-400">from last month</span></div>
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">REMAINING BALANCE</span>
              <div className="text-xl font-extrabold text-slate-900 mt-0.5">{formatCurrency(data.summaryCards.remaining_balance)}</div>
              <div className="text-[10px] text-emerald-600 font-medium mt-0.5">↑ 4.02% <span className="text-slate-400">from last month</span></div>
            </div>
          </div>

          {/* Card 5 */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3">
            <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">UTILIZATION RATE</span>
              <div className="text-xl font-extrabold text-slate-900 mt-0.5">{data.summaryCards.utilization_rate}%</div>
              <div className="text-[10px] text-emerald-600 font-medium mt-0.5">↑ 4.31% <span className="text-slate-400">from last month</span></div>
            </div>
          </div>
        </div>

        {/* Main Funds List Table Container */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-6">
          {/* Table Filter Controls */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-5">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-700">Fund Group</span>
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-xs font-semibold rounded-lg px-3 py-2 text-slate-800 focus:outline-none"
              >
                <option value="Main">Main</option>
                <option value="BGD">BGD</option>
                <option value="Other Funds">Other Funds</option>
              </select>
            </div>

            <div className="flex items-center space-x-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-80">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search fund code or fund name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none"
                />
              </div>
              <button className="flex items-center space-x-1 px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50">
                <Filter className="w-3.5 h-3.5" />
                <span>Filters</span>
              </button>
              <button className="flex items-center space-x-1 px-4 py-2 bg-indigo-900 hover:bg-indigo-950 text-white rounded-lg text-xs font-semibold shadow-sm">
                <Download className="w-3.5 h-3.5" />
                <span>Export</span>
                <ChevronDown className="w-3 h-3 ml-1" />
              </button>
            </div>
          </div>

          <div className="mb-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">MAIN FUNDS LIST</h2>
            <p className="text-[11px] text-slate-500">List of all funds under Main fund group</p>
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                  <th className="py-3 px-3">FUND CODE</th>
                  <th className="py-3 px-3">FUND NAME</th>
                  <th className="py-3 px-3">FUND TYPE</th>
                  <th className="py-3 px-3 text-center">RECORDS</th>
                  <th className="py-3 px-3 text-right">ALLOCATION (₱)</th>
                  <th className="py-3 px-3 text-right">DISBURSED (₱)</th>
                  <th className="py-3 px-3 text-right">BALANCE (₱)</th>
                  <th className="py-3 px-3 text-center">UTILIZATION (%)</th>
                  <th className="py-3 px-3 text-center">STATUS</th>
                  <th className="py-3 px-3 text-center">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {data.funds.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-3 font-bold text-indigo-900">{row.fund_code}</td>
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-slate-800">{row.fund_name}</div>
                      <div className="text-[10px] text-slate-400">{row.sub_name}</div>
                    </td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          row.fund_type === 'Trust Receipts'
                            ? 'bg-blue-50 text-blue-600'
                            : 'bg-emerald-50 text-emerald-600'
                        }`}
                      >
                        {row.fund_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center font-bold text-slate-600">{row.records}</td>
                    <td className="py-3.5 px-3 text-right font-bold text-slate-800">{formatCurrency(row.allocation)}</td>
                    <td className="py-3.5 px-3 text-right font-bold text-slate-800">{formatCurrency(row.disbursed)}</td>
                    <td className="py-3.5 px-3 text-right font-bold text-slate-800">{formatCurrency(row.balance)}</td>
                    <td className="py-3.5 px-3 text-center">
                      <div className="text-[11px] font-bold text-slate-700 mb-1">{row.utilization}%</div>
                      <div className="w-20 bg-slate-100 rounded-full h-1.5 mx-auto overflow-hidden">
                        <div
                          className="bg-indigo-600 h-1.5 rounded-full"
                          style={{ width: `${Math.min(row.utilization, 100)}%` }}
                        ></div>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-md">
                        {row.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <div className="flex items-center justify-center space-x-1.5 text-slate-400">
                        <button
                          onClick={() => handleViewFund(row.slug)}
                          className="p-1 hover:text-indigo-600 transition"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-1 hover:text-indigo-600 transition">
                          <FileText className="w-4 h-4" />
                        </button>
                        <button className="p-1 hover:text-indigo-600 transition">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              {/* Table Footer / Summary Row */}
              <tfoot>
                <tr className="bg-slate-50/80 font-extrabold text-slate-900 border-t border-slate-200">
                  <td className="py-3.5 px-3 uppercase" colSpan={3}>
                    TOTAL
                  </td>
                  <td className="py-3.5 px-3 text-center">{data.totals.records}</td>
                  <td className="py-3.5 px-3 text-right">{formatCurrency(data.totals.allocation)}</td>
                  <td className="py-3.5 px-3 text-right">{formatCurrency(data.totals.disbursed)}</td>
                  <td className="py-3.5 px-3 text-right">{formatCurrency(data.totals.balance)}</td>
                  <td className="py-3.5 px-3 text-center">
                    <div className="text-[11px] font-extrabold mb-1">{data.totals.utilization}%</div>
                    <div className="w-20 bg-slate-200 rounded-full h-1.5 mx-auto overflow-hidden">
                      <div
                        className="bg-indigo-900 h-1.5 rounded-full"
                        style={{ width: `${Math.min(data.totals.utilization, 100)}%` }}
                      ></div>
                    </div>
                  </td>
                  <td className="py-3.5 px-3 text-center">-</td>
                  <td className="py-3.5 px-3 text-center">-</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Table Pagination Bar */}
          <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
            <div>Showing 1 to 3 of 3 entries</div>
            <div className="flex items-center space-x-2">
              <button className="p-1.5 rounded border border-slate-200 hover:bg-slate-50 text-slate-400 disabled:opacity-50" disabled>
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button className="w-7 h-7 rounded bg-indigo-900 text-white font-bold text-xs flex items-center justify-center">1</button>
              <button className="p-1.5 rounded border border-slate-200 hover:bg-slate-50 text-slate-400 disabled:opacity-50" disabled>
                <ChevronRight className="w-4 h-4" />
              </button>
              <select className="bg-slate-50 border border-slate-200 text-xs rounded px-2 py-1 text-slate-700 ml-2">
                <option>10 / page</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bottom Visualizations Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Horizontal Bar Chart Component */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="mb-4">
              <h3 className="text-xs font-bold text-indigo-950 uppercase tracking-wider">ALLOCATION VS DISBURSEMENT (MAIN)</h3>
              <p className="text-[11px] text-slate-400">Comparison of allocation and disbursement per fund</p>
            </div>

            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={chartData} margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <XAxis type="number" tickFormatter={(val) => `${val}M`} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#334155', fontWeight: 'bold' }} width={80} />
                  <Tooltip
                    formatter={(value) => [`₱${value.toFixed(2)}M`]}
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                  />
                  <Bar dataKey="Allocation" fill="#1e40af" radius={[0, 4, 4, 0]} barSize={10} />
                  <Bar dataKey="Disbursement" fill="#10b981" radius={[0, 4, 4, 0]} barSize={10} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="flex justify-center space-x-6 mt-2 text-xs font-medium">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 bg-blue-800 rounded-sm"></span>
                <span className="text-slate-600">Allocation</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 bg-emerald-500 rounded-sm"></span>
                <span className="text-slate-600">Disbursement</span>
              </div>
            </div>
          </div>

          {/* Recent Activity List */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xs font-bold text-indigo-950 uppercase tracking-wider">RECENT ACTIVITY (MAIN FUNDS)</h3>
              </div>
              <button className="text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1 rounded-md transition">
                View All
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-2.5 px-2">DATE</th>
                    <th className="py-2.5 px-2">FUND</th>
                    <th className="py-2.5 px-2">ACTIVITY</th>
                    <th className="py-2.5 px-2 text-right">USER</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {data.recentActivity.map((act, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-3 px-2 font-medium text-slate-500 flex items-center space-x-2">
                        <span className={`w-2 h-2 rounded-full ${act.dotColor}`}></span>
                        <span>{act.date}</span>
                      </td>
                      <td className="py-3 px-2 font-bold text-slate-800">{act.fund}</td>
                      <td className="py-3 px-2 text-slate-600">{act.activity}</td>
                      <td className="py-3 px-2 text-right font-medium text-slate-600">{act.user}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center text-xs text-gray-400 border-t border-gray-100 pt-5 mt-6">
          <span>© 2025 University of Abra. All rights reserved.</span>
          <span>Budget Monitoring & Allocation System v1.0.0</span>
        </div>
      </div>
    </Layout>
  );
}