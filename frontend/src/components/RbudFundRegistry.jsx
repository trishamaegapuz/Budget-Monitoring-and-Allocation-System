import React, { useCallback, useEffect, useMemo, useState } from "react";
import Layout from "./layout/Layout";
import { API_URL } from "../config/api";
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  CreditCard,
  Database,
  Download,
  Edit2,
  Eye,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  Filter,
  Folder,
  Landmark,
  List,
  Loader2,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Settings2,
  Trash2,
  TrendingUp,
  Users,
  Wallet,
  X,
} from "lucide-react";


const GROUPS = [
  "All",
  "Main",
  "BGD",
  "Other Funds",
  "DOST",
  "DA",
  "CHED",
  "LAPAZ",
];

const YEARS = [2026, 2025, 2024, 2023, 2022];

const MODULES = [
  {
    id: "overview",
    number: "1",
    title: "Overview",
    description: "View summary of budgets, obligations, disbursements, and fund utilization.",
    icon: Wallet,
    tone: "blue",
    action: "Go to Overview",
  },
  {
    id: "allocation",
    number: "2",
    title: "Budget & Allocation",
    description: "Manage approved budgets, PS / MOOE / CO, and allocation details.",
    icon: BarChart3,
    tone: "green",
    tabs: ["Summary", "PS / MOOE / CO", "Allocation Details"],
  },
  {
    id: "funds",
    number: "3",
    title: "Fund Registries",
    description: "View and manage all fund registries and their respective balances.",
    icon: Folder,
    tone: "purple",
    action: "View Fund Registries",
  },
  {
    id: "transactions",
    number: "4",
    title: "Transactions",
    description: "Record, edit, and manage all transactions related to budgets and disbursements.",
    icon: ClipboardList,
    tone: "orange",
    tabs: ["Transaction List", "Add Transaction", "Transaction History"],
  },
  {
    id: "utilization",
    number: "5",
    title: "Budget Utilization & Balance",
    description: "Monitor budget utilization, obligations, disbursements, and remaining balances.",
    icon: CircleDollarSign,
    tone: "teal",
    tabs: ["Summary", "WFP Balance", "Utilization Details"],
  },
  {
    id: "breakdown",
    number: "6",
    title: "Fund / Project Breakdown",
    description: "View detailed breakdown of each fund and project utilization.",
    icon: Database,
    tone: "yellow",
    tabs: ["By Fund / Project", "Budget", "Utilization", "Disbursement"],
  },
  {
    id: "financial",
    number: "7",
    title: "Financial Reports",
    description: "Generate and view financial reports required for compliance.",
    icon: FileText,
    tone: "red",
    tabs: ["FAR 2", "FAR 2A", "FAR 2 & 2A", "FHE Deficiency"],
  },
  {
    id: "references",
    number: "8",
    title: "Reference / Master Data",
    description: "Manage reference tables and master data used in the system.",
    icon: Database,
    tone: "blue",
    tabs: ["Fund Codes", "UACS Codes", "Other Data", "All Reference"],
  },
  {
    id: "reports",
    number: "9",
    title: "Reports & Export",
    description: "Export reports to Excel, PDF or print for documentation.",
    icon: Download,
    tone: "green",
    tabs: ["Export to Excel", "Export to PDF", "Print", "All Reports"],
  },
];

const money = (value) =>
  `?${Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const numberValue = (value) => Number(value || 0);

const percent = (value, total) => {
  const v = numberValue(value);
  const t = numberValue(total);
  return t > 0 ? Number(((v / t) * 100).toFixed(2)) : 0;
};

const dateLabel = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
};

const toneMap = {
  blue: "bg-blue-600",
  green: "bg-green-600",
  purple: "bg-purple-600",
  orange: "bg-orange-500",
  teal: "bg-teal-500",
  yellow: "bg-yellow-500",
  red: "bg-red-500",
};

const softToneMap = {
  blue: "bg-blue-50 text-blue-700 border-blue-100",
  green: "bg-green-50 text-green-700 border-green-100",
  purple: "bg-purple-50 text-purple-700 border-purple-100",
  orange: "bg-orange-50 text-orange-700 border-orange-100",
  teal: "bg-teal-50 text-teal-700 border-teal-100",
  yellow: "bg-yellow-50 text-yellow-700 border-yellow-100",
  red: "bg-red-50 text-red-700 border-red-100",
};

const initialForm = (year) => ({
  registry_no: "",
  entry_date: "",
  fiscal_year: Number(year),
  fund_cluster_id: "",
  fund_source_id: "",
  campus_id: "",
  burs_serial_no: "",
  serial_no_transferred: "",
  payee: "",
  particulars: "",
  responsibility_center_id: "",
  pap_id: "",
  uacs_code_id: "",
  ref_no: "",
  allotment_class_id: "",
  uacs_funding_source_code: "",
  month: "",
  series: "",
  series2: "",
  quarter: "",
  object_expenditure_id: "",
  mfo_id: "",
  old_uacs_code_id: "",
  account_title: "",
  utilization_amount: "",
  ps_utilization: "",
  mooe_utilization: "",
  co_utilization: "",
  wfp_source_id: "",
  wfp_source_code: "",
  dv_payroll_no: "",
  disbursement_amount: "",
  running_balance: "",
  remarks: "",
  unpaid_utilization: "",
  po_no: "",
  status_of_po: "",
});

export default function RbudFundRegistry({
  user,
  onLogout,
  onNavigate,
  activePath = "/rbud",
}) {
  const token = localStorage.getItem("token");

  const headers = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    }),
    [token]
  );

  const [view, setView] = useState("module");
  const [selectedGroup, setSelectedGroup] = useState("All");
  const [selectedFiscalYear, setSelectedFiscalYear] = useState("2026");
  const [selectedFund, setSelectedFund] = useState("All Funds");
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [references, setReferences] = useState({
    fund_clusters: [],
    fund_sources: [],
    campuses: [],
    responsibility_centers: [],
    pap: [],
    mfo: [],
    uacs_codes: [],
    object_expenditures: [],
    allotment_classes: [],
    wfp_sources: [],
  });

  const [overview, setOverview] = useState({});
  const [entries, setEntries] = useState([]);
  const [pagination, setPagination] = useState({
    totalItems: 0,
    totalPages: 0,
    currentPage: 1,
  });
  const [allocation, setAllocation] = useState({
    rows: [],
    totals: {},
  });
  const [utilization, setUtilization] = useState({
    summary: {},
    budget_class: {},
    utilized_class: {},
    fund_balances: [],
  });
  const [breakdown, setBreakdown] = useState({
    fund: null,
    summary: {},
    classes: [],
  });
  const [financialReports, setFinancialReports] = useState({
    reportTypes: [],
    summary: {},
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const [allocationTab, setAllocationTab] = useState("Summary");
  const [utilizationTab, setUtilizationTab] = useState("Summary");
  const [fundGroupTab, setFundGroupTab] = useState("All");
  const [referenceTab, setReferenceTab] = useState("Fund Codes");
  const [referenceSearch, setReferenceSearch] = useState("");
  const [reportType, setReportType] = useState("FAR2");
  const [reportPreview, setReportPreview] = useState(false);
  const [selectedBreakdownFund, setSelectedBreakdownFund] = useState("");

  const [recordModal, setRecordModal] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [form, setForm] = useState(initialForm("2026"));

  const showToast = useCallback((message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  }, []);

  const query = useCallback(
    async (path, options = {}) => {
      const response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
          ...headers,
          ...(options.headers || {}),
        },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Request failed.");
      }
      return data;
    },
    [headers]
  );

  const filterParams = useCallback(() => {
    const params = new URLSearchParams();
    params.set("year", selectedFiscalYear);
    params.set("group", selectedGroup);
    if (selectedFund !== "All Funds") params.set("fund", selectedFund);
    return params.toString();
  }, [selectedFiscalYear, selectedGroup, selectedFund]);

  const loadReferences = useCallback(async () => {
    try {
      const data = await query("/rbud/references");
      setReferences({
        fund_clusters: data.fund_clusters || data.fundClusters || [],
        fund_sources: data.fund_sources || data.fundSources || [],
        campuses: data.campuses || [],
        responsibility_centers:
          data.responsibility_centers || data.responsibilityCenters || [],
        pap: data.pap || data.paps || [],
        mfo: data.mfo || data.mfoList || [],
        uacs_codes: data.uacs_codes || data.uacsCodes || [],
        object_expenditures:
          data.object_expenditures || data.objectExpenditures || [],
        allotment_classes:
          data.allotment_classes || data.allotmentClasses || [],
        wfp_sources: data.wfp_sources || data.wfpSources || [],
      });
    } catch (err) {
      setError(err.message);
    }
  }, [query]);

  const loadOverview = useCallback(async () => {
    try {
      const data = await query(`/rbud/overview?${filterParams()}`);
      setOverview(data);
    } catch (err) {
      setError(err.message);
    }
  }, [query, filterParams]);

  const loadEntries = useCallback(
    async (requestedPage = 1) => {
      setLoading(true);
      try {
        const params = new URLSearchParams(filterParams());
        params.set("page", String(requestedPage));
        params.set("limit", "8");
        if (selectedStatus !== "All Status") params.set("status", selectedStatus);
        if (searchTerm.trim()) params.set("search", searchTerm.trim());

        const data = await query(`/rbud?${params.toString()}`);
        setEntries(data.entries || []);
        setPagination({
          totalItems: data.totalItems || 0,
          totalPages: data.totalPages || 0,
          currentPage: data.currentPage || requestedPage,
        });
      } catch (err) {
        setError(err.message);
        setEntries([]);
      } finally {
        setLoading(false);
      }
    },
    [query, filterParams, selectedStatus, searchTerm]
  );

  const loadAllocation = useCallback(async () => {
    try {
      const data = await query(`/rbud/budget-allocation?${filterParams()}`);
      setAllocation(data);
    } catch (err) {
      setError(err.message);
    }
  }, [query, filterParams]);

  const loadUtilization = useCallback(async () => {
    try {
      const data = await query(`/rbud/utilization?${filterParams()}`);
      setUtilization(data);
    } catch (err) {
      setError(err.message);
    }
  }, [query, filterParams]);

  const loadBreakdown = useCallback(
    async (fundId = selectedBreakdownFund) => {
      try {
        const params = new URLSearchParams();
        params.set("year", selectedFiscalYear);
        params.set("group", selectedGroup);
        if (fundId) params.set("fundId", fundId);
        const data = await query(`/rbud/fund-breakdown?${params.toString()}`);
        setBreakdown(data);
      } catch (err) {
        setError(err.message);
      }
    },
    [query, selectedFiscalYear, selectedGroup, selectedBreakdownFund]
  );

  const loadFinancialReports = useCallback(async () => {
    try {
      const data = await query(`/rbud/financial-reports?${filterParams()}`);
      setFinancialReports(data);
    } catch (err) {
      setError(err.message);
    }
  }, [query, filterParams]);

  useEffect(() => {
    loadReferences();
  }, [loadReferences]);

  useEffect(() => {
    if (view === "module") return;
    loadOverview();
    loadEntries(1);
    loadAllocation();
    loadUtilization();
    loadFinancialReports();
  }, [
    view,
    selectedFiscalYear,
    selectedGroup,
    selectedFund,
    selectedStatus,
    searchTerm,
    loadOverview,
    loadEntries,
    loadAllocation,
    loadUtilization,
    loadFinancialReports,
  ]);

  useEffect(() => {
    if (view === "breakdown") {
      loadBreakdown(selectedBreakdownFund);
    }
  }, [view, selectedBreakdownFund, loadBreakdown]);

  const fundOptions = useMemo(
    () => [
      "All Funds",
      ...references.fund_clusters.map((x) => x.name).filter(Boolean),
    ],
    [references.fund_clusters]
  );

  const selectedGroupFunds = useMemo(
    () =>
      references.fund_clusters.filter((fund) => {
        if (fundGroupTab === "All") return true;
        const haystack = `${fund.code || ""} ${fund.name || ""} ${
          fund.fund_source_code || ""
        } ${fund.fund_source_name || ""}`.toUpperCase();
        return haystack.includes(fundGroupTab.toUpperCase());
      }),
    [references.fund_clusters, fundGroupTab]
  );

  const selectedFundCluster = useMemo(
    () =>
      references.fund_clusters.find(
        (x) => String(x.id) === String(selectedBreakdownFund)
      ),
    [references.fund_clusters, selectedBreakdownFund]
  );

  const openView = (nextView) => {
    setError("");
    setView(nextView);
    setReportPreview(false);
    if (nextView === "breakdown" && !selectedBreakdownFund) {
      const first = references.fund_clusters[0];
      if (first) setSelectedBreakdownFund(String(first.id));
    }
  };

  const backToModule = () => {
    setView("module");
    setError("");
    setSelectedRecord(null);
    setRecordModal(null);
  };

  const handleGroupClick = (group) => {
    setSelectedGroup(group);
    setSelectedFund("All Funds");
    setFundGroupTab(group);
  };

  const refreshAll = async () => {
    setError("");
    await Promise.all([
      loadReferences(),
      loadOverview(),
      loadEntries(pagination.currentPage || 1),
      loadAllocation(),
      loadUtilization(),
      loadFinancialReports(),
    ]);
    if (view === "breakdown") await loadBreakdown(selectedBreakdownFund);
    showToast("RBUD data refreshed successfully.");
  };

  const openAddRecord = () => {
    setForm(initialForm(selectedFiscalYear));
    setSelectedRecord(null);
    setRecordModal("add");
  };

  const openEditRecord = (record) => {
    setSelectedRecord(record);
    setForm({
      ...initialForm(selectedFiscalYear),
      ...record,
      fiscal_year: Number(record.fiscal_year || selectedFiscalYear),
    });
    setRecordModal("edit");
  };

  const openRecord = async (record) => {
    try {
      const data = await query(`/rbud/${record.id}`);
      setSelectedRecord(data);
      setRecordModal("view");
    } catch (err) {
      setError(err.message);
    }
  };

  const saveRecord = async (event) => {
    event.preventDefault();
    try {
      const isEdit = recordModal === "edit";
      const path = isEdit
        ? `/rbud/${selectedRecord.id}`
        : "/rbud";
      const data = await query(path, {
        method: isEdit ? "PUT" : "POST",
        body: JSON.stringify(form),
      });
      if (!data) return;
      setRecordModal(null);
      setSelectedRecord(null);
      await Promise.all([loadEntries(1), loadOverview(), loadUtilization()]);
      showToast(isEdit ? "RBUD record updated." : "RBUD record added.");
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteRecord = async (record) => {
    if (!window.confirm(`Delete ${record.registry_no || "this RBUD record"}?`)) return;
    try {
      await query(`/rbud/${record.id}`, { method: "DELETE" });
      await Promise.all([loadEntries(1), loadOverview(), loadUtilization()]);
      showToast("RBUD record deleted.");
    } catch (err) {
      setError(err.message);
    }
  };

  const exportCsv = () => {
    const rows = entries;
    const headersCsv = [
      "Registry No.",
      "Date",
      "Fund Group",
      "Fund",
      "Payee",
      "Particulars",
      "Responsibility Center",
      "Approved Budget",
      "Utilized",
      "Disbursed",
      "Remaining Balance",
      "Status",
    ];
    const lines = [
      headersCsv,
      ...rows.map((row) => [
        row.registry_no,
        dateLabel(row.entry_date),
        row.fund_group,
        row.fund_cluster_name,
        row.payee,
        row.particulars,
        row.responsibility_center_name || row.department_name,
        row.approved_budget,
        row.utilization_amount || row.total_utilized,
        row.disbursement_amount || row.disbursed,
        row.available_balance || row.remaining_balance,
        row.status,
      ]),
    ];
    const csv = lines
      .map((row) =>
        row
          .map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `RBUD-${selectedGroup}-${selectedFiscalYear}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("RBUD CSV exported.");
  };

  const printCurrent = () => window.print();

  const summary = overview.allocation_vs_disbursement || {};
  const approved =
    numberValue(summary.approved_budget ?? overview.total_approved);
  const obligations =
    numberValue(summary.utilized ?? overview.total_utilized);
  const disbursed =
    numberValue(summary.disbursed ?? overview.total_disbursed);
  const balance =
    numberValue(summary.balance ?? overview.remaining_balance ?? approved - obligations);
  const utilizationRate =
    numberValue(overview.utilization_rate ?? percent(obligations, approved));

  return (
    <Layout
      user={user}
      onLogout={onLogout}
      onNavigate={onNavigate}
      activePath={activePath}
    >
      <div className="min-h-full bg-[#f7f9fc] text-gray-800">
        {toast && (
          <div className="fixed top-5 right-5 z-[120] bg-[#211b79] text-white px-4 py-3 rounded-lg shadow-xl text-xs font-semibold">
            {toast}
          </div>
        )}

        {error && (
          <div className="mx-6 mt-4 px-4 py-3 rounded-lg border border-red-100 bg-red-50 text-red-700 text-xs flex items-center justify-between gap-4">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError("")}
              className="w-7 h-7 rounded-md hover:bg-red-100 flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {view === "module" ? (
          <ModuleHome
            fiscalYear={selectedFiscalYear}
            setFiscalYear={setSelectedFiscalYear}
            modules={MODULES}
            onOpen={openView}
          />
        ) : (
          <div className="px-6 py-5">
            <PageHeader
              title={MODULES.find((x) => x.id === view)?.title || "RBUD Module"}
              description={MODULES.find((x) => x.id === view)?.description || ""}
              onBack={backToModule}
              onRefresh={refreshAll}
              loading={loading}
            />

            {view === "overview" && (
              <OverviewView
                overview={overview}
                entries={entries}
                approved={approved}
                obligations={obligations}
                disbursed={disbursed}
                balance={balance}
                utilizationRate={utilizationRate}
                group={selectedGroup}
                setGroup={handleGroupClick}
                year={selectedFiscalYear}
                setYear={setSelectedFiscalYear}
                fund={selectedFund}
                setFund={setSelectedFund}
                fundOptions={fundOptions}
              />
            )}

            {view === "allocation" && (
              <BudgetAllocationView
                allocation={allocation}
                tab={allocationTab}
                setTab={setAllocationTab}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
              />
            )}

            {view === "funds" && (
              <FundRegistriesView
                references={references}
                selectedGroup={fundGroupTab}
                setSelectedGroup={setFundGroupTab}
                selectedFunds={selectedGroupFunds}
                onOpenBreakdown={(fundId) => {
                  setSelectedBreakdownFund(String(fundId));
                  openView("breakdown");
                }}
              />
            )}

            {view === "transactions" && (
              <TransactionsView
                entries={entries}
                loading={loading}
                selectedGroup={selectedGroup}
                setSelectedGroup={handleGroupClick}
                selectedFund={selectedFund}
                setSelectedFund={setSelectedFund}
                selectedStatus={selectedStatus}
                setSelectedStatus={setSelectedStatus}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                fiscalYear={selectedFiscalYear}
                setFiscalYear={setSelectedFiscalYear}
                fundOptions={fundOptions}
                pagination={pagination}
                onPage={loadEntries}
                onAdd={openAddRecord}
                onView={openRecord}
                onEdit={openEditRecord}
                onDelete={deleteRecord}
              />
            )}

            {view === "utilization" && (
              <UtilizationView
                data={utilization}
                tab={utilizationTab}
                setTab={setUtilizationTab}
                group={selectedGroup}
                setGroup={handleGroupClick}
                fund={selectedFund}
                setFund={setSelectedFund}
                fundOptions={fundOptions}
                year={selectedFiscalYear}
                setYear={setSelectedFiscalYear}
              />
            )}

            {view === "breakdown" && (
              <FundBreakdownView
                data={breakdown}
                references={references}
                selectedFund={selectedBreakdownFund}
                setSelectedFund={setSelectedBreakdownFund}
                onLoad={() => loadBreakdown(selectedBreakdownFund)}
                group={selectedGroup}
                year={selectedFiscalYear}
              />
            )}

            {view === "financial" && (
              <FinancialReportsView
                data={financialReports}
                reportType={reportType}
                setReportType={setReportType}
                selectedFund={selectedFund}
                setSelectedFund={setSelectedFund}
                fundOptions={fundOptions}
                reportPreview={reportPreview}
                setReportPreview={setReportPreview}
                onPrint={printCurrent}
              />
            )}

            {view === "references" && (
              <MasterDataView
                references={references}
                tab={referenceTab}
                setTab={setReferenceTab}
                search={referenceSearch}
                setSearch={setReferenceSearch}
              />
            )}

            {view === "reports" && (
              <ReportsExportView
                entries={entries}
                group={selectedGroup}
                year={selectedFiscalYear}
                fund={selectedFund}
                setFund={setSelectedFund}
                fundOptions={fundOptions}
                onExport={exportCsv}
                onPrint={printCurrent}
                onPreview={() => setReportPreview(true)}
                preview={reportPreview}
                closePreview={() => setReportPreview(false)}
              />
            )}
          </div>
        )}

        {recordModal && (
          <RecordModal
            mode={recordModal}
            record={selectedRecord}
            form={form}
            setForm={setForm}
            references={references}
            onClose={() => {
              setRecordModal(null);
              setSelectedRecord(null);
            }}
            onSubmit={saveRecord}
          />
        )}
      </div>
    </Layout>
  );
}

/* ============================================================
   MODULE HOME
============================================================ */

function ModuleHome({ fiscalYear, setFiscalYear, modules, onOpen }) {
  return (
    <div className="px-6 py-5">
      <div className="flex items-center justify-end gap-4 mb-5">
        <div className="flex items-center gap-2 border border-gray-200 bg-white rounded-lg h-9 px-3">
          <CalendarDays className="w-4 h-4 text-[#211b79]" />
          <select
            value={fiscalYear}
            onChange={(e) => setFiscalYear(e.target.value)}
            className="bg-transparent outline-none text-xs font-semibold text-gray-700"
          >
            {YEARS.map((year) => (
              <option key={year} value={year}>
                FY {year}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {modules.map((item) => {
          const Icon = item.icon;
          return (
            <ModuleCard
              key={item.id}
              item={item}
              Icon={Icon}
              onClick={() => onOpen(item.id)}
            />
          );
        })}
      </div>

      <div className="mt-4 text-[10px] text-gray-400">
        FY {fiscalYear} • RBUD Module
      </div>
    </div>
  );
}

function ModuleCard({ item, Icon, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition p-4 min-h-[170px]"
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-11 h-11 shrink-0 rounded-xl text-white flex items-center justify-center ${toneMap[item.tone]}`}
        >
          <Icon className="w-5 h-5" />
        </div>

        <div className="min-w-0">
          <h2 className="text-sm font-bold text-[#17135f]">
            {item.number}. {item.title}
          </h2>
          <p className="text-[10px] leading-4 text-gray-500 mt-1">
            {item.description}
          </p>
        </div>
      </div>

      <div className="mt-5">
        {item.tabs ? (
          <div className="grid grid-cols-4 gap-2">
            {item.tabs.map((tab) => (
              <div
                key={tab}
                className="border border-gray-100 rounded-lg px-2 py-3 text-center text-[9px] text-gray-600 bg-gray-50/50"
              >
                <List className="w-3.5 h-3.5 mx-auto mb-1.5 text-[#211b79]" />
                {tab}
              </div>
            ))}
          </div>
        ) : (
          <span className="inline-flex items-center gap-2 border border-gray-100 rounded-lg px-3 py-2 text-[10px] font-semibold text-[#211b79]">
            {item.action}
            <ChevronRight className="w-3.5 h-3.5" />
          </span>
        )}
      </div>
    </button>
  );
}

/* ============================================================
   SHARED PAGE HEADER / FILTERS
============================================================ */

function PageHeader({ title, description, onBack, onRefresh, loading }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-5">
      <div>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 hover:text-[#211b79] mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to RBUD Module
        </button>
        <h1 className="text-[21px] font-bold text-[#17135f]">{title}</h1>
        <p className="text-xs text-gray-500 mt-1">{description}</p>
      </div>

      <button
        type="button"
        onClick={onRefresh}
        className="h-9 px-3 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-700 inline-flex items-center gap-2"
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <RefreshCw className="w-3.5 h-3.5" />
        )}
        Refresh
      </button>
    </div>
  );
}

function FilterBar({
  group,
  setGroup,
  fund,
  setFund,
  year,
  setYear,
  fundOptions,
  status,
  setStatus,
  search,
  setSearch,
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4 mb-4">
      <div className="flex flex-wrap gap-2 mb-3">
        {GROUPS.map((item) => (
          <button
            type="button"
            key={item}
            onClick={() => setGroup(item)}
            className={`h-8 px-4 rounded-lg border text-[10px] font-semibold ${
              group === item
                ? "bg-[#211b79] border-[#211b79] text-white"
                : "bg-white border-gray-200 text-gray-600 hover:border-[#211b79]"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-2">
        <Select
          label="Fund"
          value={fund}
          onChange={setFund}
          options={fundOptions}
        />
        <Select
          label="Fiscal Year"
          value={year}
          onChange={setYear}
          options={YEARS}
        />
        {setStatus && (
          <Select
            label="Status"
            value={status}
            onChange={setStatus}
            options={["All Status", "Approved", "Obligated", "Disbursed"]}
          />
        )}
        {setSearch && (
          <div className="xl:col-span-2">
            <label className="block text-[10px] font-semibold text-gray-500 mb-1">
              Search
            </label>
            <div className="h-9 border border-gray-200 rounded-lg flex items-center px-3 gap-2">
              <Search className="w-3.5 h-3.5 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Registry no., payee, fund, particulars..."
                className="w-full outline-none text-xs"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   OVERVIEW
============================================================ */

function OverviewView({
  overview,
  entries,
  approved,
  obligations,
  disbursed,
  balance,
  utilizationRate,
  group,
  setGroup,
  year,
  setYear,
  fund,
  setFund,
  fundOptions,
}) {
  const groupSummary = overview.fund_group_summary || [];

  return (
    <div>
      <FilterBar
        group={group}
        setGroup={setGroup}
        fund={fund}
        setFund={setFund}
        year={year}
        setYear={setYear}
        fundOptions={fundOptions}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 mb-4">
        <Kpi title="Total Approved Budget" value={money(approved)} icon={Wallet} tone="blue" />
        <Kpi title="Total Obligations" value={money(obligations)} icon={FileCheck2} tone="green" />
        <Kpi title="Total Disbursements" value={money(disbursed)} icon={CreditCard} tone="orange" />
        <Kpi
          title="Remaining / Unutilized Balance"
          value={money(balance)}
          sub={`${utilizationRate.toFixed(2)}% utilized`}
          icon={CircleDollarSign}
          tone="purple"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Panel title="Budget Utilization Summary" subtitle="Approved budget versus utilization and disbursement">
          <div className="space-y-4">
            <ProgressRow label="Utilization" value={obligations} total={approved} />
            <ProgressRow label="Disbursement" value={disbursed} total={approved} />
            <div className="grid grid-cols-3 gap-3 pt-2">
              <MiniMetric label="PS" value={money(overview.budget_breakdown?.find?.((x) => x.name === "PS")?.budget || overview.ps_budget)} />
              <MiniMetric label="MOOE" value={money(overview.mooe_budget)} />
              <MiniMetric label="CO" value={money(overview.co_budget)} />
            </div>
          </div>
        </Panel>

        <Panel title="Fund Allocation Summary" subtitle="Budget and utilization by fund group">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-500">
                  <th className="p-2 text-left">Fund Group</th>
                  <th className="p-2 text-right">Budget</th>
                  <th className="p-2 text-right">Utilized</th>
                  <th className="p-2 text-right">Balance</th>
                </tr>
              </thead>
              <tbody>
                {groupSummary.map((row) => (
                  <tr key={row.group} className="border-b border-gray-50">
                    <td className="p-2 font-semibold">{row.group}</td>
                    <td className="p-2 text-right">{money(row.total_budget)}</td>
                    <td className="p-2 text-right">{money(row.utilized)}</td>
                    <td className="p-2 text-right">{money(row.balance)}</td>
                  </tr>
                ))}
                {!groupSummary.length && (
                  <EmptyRow colSpan={4} />
                )}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Recent Transactions" subtitle="Latest RBUD registry entries" className="xl:col-span-2">
          <TransactionTable entries={entries.slice(0, 8)} compact />
        </Panel>
      </div>
    </div>
  );
}

/* ============================================================
   BUDGET & ALLOCATION
============================================================ */

function BudgetAllocationView({ allocation, tab, setTab, searchTerm, setSearchTerm }) {
  const totals = allocation.totals || {};
  const rows = allocation.rows || [];

  return (
    <div>
      <TabBar
        tabs={["Summary", "PS / MOOE / CO", "Allocation Details"]}
        value={tab}
        onChange={setTab}
      />

      {tab === "Summary" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Kpi title="Approved Budget" value={money(totals.approved_budget)} icon={Wallet} tone="blue" />
          <Kpi title="PS" value={money(totals.ps)} icon={Users} tone="green" />
          <Kpi title="MOOE + CO" value={money(numberValue(totals.mooe) + numberValue(totals.co))} icon={BarChart3} tone="purple" />
          <Panel title="Allocation Overview" subtitle="Budget allocation is taken from budget_items." className="md:col-span-3">
            <BudgetClassTable totals={totals} />
          </Panel>
        </div>
      )}

      {tab === "PS / MOOE / CO" && (
        <Panel title="PS / MOOE / CO" subtitle="Classification of approved budget">
          <BudgetClassTable totals={totals} />
        </Panel>
      )}

      {tab === "Allocation Details" && (
        <Panel
          title="Allocation Details"
          subtitle="Detailed allocation records for the selected fiscal year and fund group"
          action={
            <div className="h-8 border border-gray-200 rounded-lg flex items-center gap-2 px-2">
              <Search className="w-3.5 h-3.5 text-gray-400" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search allocation..."
                className="outline-none text-[10px] w-44"
              />
            </div>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-[10px]">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="p-3 text-left">Fund</th>
                  <th className="p-3 text-left">Responsibility Center</th>
                  <th className="p-3 text-left">PAP / Program</th>
                  <th className="p-3 text-right">Approved</th>
                  <th className="p-3 text-right">PS</th>
                  <th className="p-3 text-right">MOOE</th>
                  <th className="p-3 text-right">CO</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-gray-50">
                    <td className="p-3">
                      <b>{row.fund_cluster_code || "—"}</b>
                      <div className="text-gray-400">{row.fund_cluster_name || "—"}</div>
                    </td>
                    <td className="p-3">{row.responsibility_center_name || "—"}</td>
                    <td className="p-3">{row.pap_name || row.mfo_name || row.object_expenditure_name || "—"}</td>
                    <td className="p-3 text-right font-semibold">{money(row.approved_budget)}</td>
                    <td className="p-3 text-right">{money(row.ps_amount)}</td>
                    <td className="p-3 text-right">{money(row.mooe_amount)}</td>
                    <td className="p-3 text-right">{money(row.co_amount)}</td>
                  </tr>
                ))}
                {!rows.length && <EmptyRow colSpan={7} />}
              </tbody>
            </table>
          </div>
        </Panel>
      )}
    </div>
  );
}

/* ============================================================
   FUND REGISTRIES
============================================================ */

function FundRegistriesView({
  references,
  selectedGroup,
  setSelectedGroup,
  selectedFunds,
  onOpenBreakdown,
}) {
  return (
    <div>
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Folder className="w-4 h-4 text-[#211b79]" />
          <div>
            <h2 className="text-sm font-bold text-[#17135f]">Fund Registries</h2>
            <p className="text-[10px] text-gray-500">
              Select a fund group to view its registered funds and balances.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {GROUPS.map((group) => (
            <button
              type="button"
              key={group}
              onClick={() => setSelectedGroup(group)}
              className={`h-8 px-4 rounded-lg border text-[10px] font-semibold ${
                selectedGroup === group
                  ? "bg-[#211b79] text-white border-[#211b79]"
                  : "bg-white text-gray-600 border-gray-200"
              }`}
            >
              {group}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#17135f]">{selectedGroup} Funds</h3>
            <p className="text-[10px] text-gray-500">
              {selectedFunds.length} registered fund cluster{selectedFunds.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {selectedFunds.map((fund) => (
            <div
              key={fund.id}
              className="border border-gray-100 rounded-xl p-4 hover:border-[#211b79]/30 transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                  <Folder className="w-4 h-4" />
                </div>
                <span className="text-[9px] font-semibold px-2 py-1 rounded-full bg-gray-50 text-gray-500">
                  {fund.fund_source_code || "Fund"}
                </span>
              </div>

              <p className="text-xs font-bold text-[#17135f] mt-3">
                {fund.code || "—"}
              </p>
              <p className="text-[11px] text-gray-600 mt-1 min-h-8">
                {fund.name || "Unnamed Fund"}
              </p>
              <p className="text-[9px] text-gray-400 mt-1">
                {fund.fund_source_name || "No funding source"}
              </p>

              <button
                type="button"
                onClick={() => onOpenBreakdown(fund.id)}
                className="mt-4 w-full h-8 rounded-lg border border-gray-200 text-[10px] font-semibold text-[#211b79] hover:bg-[#211b79] hover:text-white"
              >
                View Fund / Project Breakdown
              </button>
            </div>
          ))}

          {!selectedFunds.length && (
            <div className="md:col-span-2 xl:col-span-3 py-12 text-center text-xs text-gray-400">
              No registered funds found for this group.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   TRANSACTIONS
============================================================ */

function TransactionsView({
  entries,
  loading,
  selectedGroup,
  setSelectedGroup,
  selectedFund,
  setSelectedFund,
  selectedStatus,
  setSelectedStatus,
  searchTerm,
  setSearchTerm,
  fiscalYear,
  setFiscalYear,
  fundOptions,
  pagination,
  onPage,
  onAdd,
  onView,
  onEdit,
  onDelete,
}) {
  return (
    <div>
      <FilterBar
        group={selectedGroup}
        setGroup={setSelectedGroup}
        fund={selectedFund}
        setFund={setSelectedFund}
        year={fiscalYear}
        setYear={setFiscalYear}
        fundOptions={fundOptions}
        status={selectedStatus}
        setStatus={setSelectedStatus}
        search={searchTerm}
        setSearch={setSearchTerm}
      />

      <Panel
        title="Transaction Registry"
        subtitle={`${pagination.totalItems} record(s) found`}
        action={
          <button
            type="button"
            onClick={onAdd}
            className="h-8 px-3 rounded-lg bg-[#211b79] text-white text-[10px] font-semibold flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Transaction
          </button>
        }
      >
        <TransactionTable
          entries={entries}
          loading={loading}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
        />

        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
          <span className="text-[10px] text-gray-400">
            Page {pagination.currentPage} of {pagination.totalPages || 1}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={pagination.currentPage <= 1}
              onClick={() => onPage(pagination.currentPage - 1)}
              className="w-7 h-7 border border-gray-200 rounded-lg flex items-center justify-center disabled:opacity-40"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="h-7 min-w-7 px-2 bg-[#211b79] text-white rounded-lg flex items-center justify-center text-[10px] font-semibold">
              {pagination.currentPage}
            </span>
            <button
              type="button"
              disabled={
                !pagination.totalPages ||
                pagination.currentPage >= pagination.totalPages
              }
              onClick={() => onPage(pagination.currentPage + 1)}
              className="w-7 h-7 border border-gray-200 rounded-lg flex items-center justify-center disabled:opacity-40"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </Panel>
    </div>
  );
}

function TransactionTable({
  entries = [],
  loading,
  compact = false,
  onView,
  onEdit,
  onDelete,
}) {
  return (
    <div className="overflow-x-auto">
      <table className={`w-full ${compact ? "min-w-[850px]" : "min-w-[1050px]"} text-[10px]`}>
        <thead className="bg-gray-50 text-gray-500">
          <tr>
            <th className="p-3 text-left">Registry No.</th>
            <th className="p-3 text-left">Date</th>
            <th className="p-3 text-left">Fund</th>
            <th className="p-3 text-left">BURS / Ref. No.</th>
            <th className="p-3 text-left">Payee</th>
            <th className="p-3 text-left">Particulars</th>
            <th className="p-3 text-right">Utilized</th>
            <th className="p-3 text-right">Disbursed</th>
            {!compact && <th className="p-3 text-center">Status</th>}
            {!compact && <th className="p-3 text-center">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <td colSpan={compact ? 8 : 10} className="p-8 text-center text-gray-400">
                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                Loading transactions...
              </td>
            </tr>
          )}

          {!loading &&
            entries.map((row) => (
              <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50/70">
                <td className="p-3 font-semibold text-[#17135f]">{row.registry_no || "—"}</td>
                <td className="p-3">{dateLabel(row.entry_date)}</td>
                <td className="p-3">
                  <b>{row.fund_cluster_code || "—"}</b>
                  <div className="text-gray-400">{row.fund_cluster_name || "—"}</div>
                </td>
                <td className="p-3">{row.burs_serial_no || row.ref_no || "—"}</td>
                <td className="p-3">{row.payee || "—"}</td>
                <td className="p-3 max-w-[230px] truncate">{row.particulars || "—"}</td>
                <td className="p-3 text-right">{money(row.utilization_amount || row.total_utilized)}</td>
                <td className="p-3 text-right">{money(row.disbursement_amount || row.disbursed)}</td>
                {!compact && (
                  <td className="p-3 text-center">
                    <StatusBadge status={row.status} />
                  </td>
                )}
                {!compact && (
                  <td className="p-3">
                    <div className="flex items-center justify-center gap-1">
                      <ActionButton title="View" onClick={() => onView(row)} icon={Eye} />
                      <ActionButton title="Edit" onClick={() => onEdit(row)} icon={Edit2} />
                      <ActionButton title="Delete" onClick={() => onDelete(row)} icon={Trash2} />
                    </div>
                  </td>
                )}
              </tr>
            ))}

          {!loading && !entries.length && <EmptyRow colSpan={compact ? 8 : 10} />}
        </tbody>
      </table>
    </div>
  );
}

/* ============================================================
   UTILIZATION
============================================================ */

function UtilizationView({
  data,
  tab,
  setTab,
  group,
  setGroup,
  fund,
  setFund,
  fundOptions,
  year,
  setYear,
}) {
  const summary = data.summary || {};
  const budgetClass = data.budget_class || {};
  const utilizedClass = data.utilized_class || {};

  return (
    <div>
      <FilterBar
        group={group}
        setGroup={setGroup}
        fund={fund}
        setFund={setFund}
        year={year}
        setYear={setYear}
        fundOptions={fundOptions}
      />

      <TabBar
        tabs={["Summary", "WFP Balance", "Utilization Details"]}
        value={tab}
        onChange={setTab}
      />

      {tab === "Summary" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3 mb-4">
            <Kpi title="Approved Budget" value={money(summary.approved_budget)} icon={Wallet} tone="blue" />
            <Kpi title="Obligations" value={money(summary.obligations)} icon={FileCheck2} tone="green" />
            <Kpi title="Disbursements" value={money(summary.disbursements)} icon={CreditCard} tone="orange" />
            <Kpi title="Unutilized Budget" value={money(summary.unutilized_budget)} icon={CircleDollarSign} tone="purple" />
            <Kpi title="Utilization Rate" value={`${numberValue(summary.utilization_rate).toFixed(2)}%`} icon={TrendingUp} tone="teal" />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <Panel title="Budget by Class" subtitle="Approved budget">
              <ClassTable
                rows={[
                  ["PS", "Personnel Services", budgetClass.ps],
                  ["MOOE", "Maintenance and Other Operating Expenses", budgetClass.mooe],
                  ["CO", "Capital Outlay", budgetClass.co],
                ]}
              />
            </Panel>

            <Panel title="Utilization by Class" subtitle="Actual utilization / obligations">
              <ClassTable
                rows={[
                  ["PS", "Personnel Services", utilizedClass.ps],
                  ["MOOE", "Maintenance and Other Operating Expenses", utilizedClass.mooe],
                  ["CO", "Capital Outlay", utilizedClass.co],
                ]}
              />
            </Panel>
          </div>
        </>
      )}

      {tab === "WFP Balance" && (
        <Panel title="WFP Balance" subtitle="Fund-level balance monitoring">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-[10px]">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="p-3 text-left">Fund</th>
                  <th className="p-3 text-left">Fund Group</th>
                  <th className="p-3 text-right">Approved Budget</th>
                  <th className="p-3 text-right">Utilized</th>
                  <th className="p-3 text-right">Disbursed</th>
                  <th className="p-3 text-right">Unutilized</th>
                  <th className="p-3 text-center">Utilization</th>
                </tr>
              </thead>
              <tbody>
                {(data.fund_balances || []).map((row) => (
                  <tr key={row.id} className="border-b border-gray-50">
                    <td className="p-3">
                      <b>{row.code || "—"}</b>
                      <div className="text-gray-400">{row.name || "—"}</div>
                    </td>
                    <td className="p-3">{row.fund_group || "—"}</td>
                    <td className="p-3 text-right">{money(row.approved_budget)}</td>
                    <td className="p-3 text-right">{money(row.utilized)}</td>
                    <td className="p-3 text-right">{money(row.disbursed)}</td>
                    <td className="p-3 text-right">{money(row.unutilized_budget)}</td>
                    <td className="p-3 text-center">{numberValue(row.utilization_rate).toFixed(2)}%</td>
                  </tr>
                ))}
                {!data.fund_balances?.length && <EmptyRow colSpan={7} />}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {tab === "Utilization Details" && (
        <Panel title="Utilization Details" subtitle="Summary of financial movement">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <DetailBox label="Approved Budget" value={money(summary.approved_budget)} />
            <DetailBox label="Obligations" value={money(summary.obligations)} />
            <DetailBox label="Disbursements" value={money(summary.disbursements)} />
            <DetailBox label="Remaining Balance" value={money(summary.remaining_balance)} />
            <DetailBox label="Unpaid Obligation" value={money(summary.unpaid_obligation)} />
            <DetailBox label="Disbursement Rate" value={`${numberValue(summary.disbursement_rate).toFixed(2)}%`} />
          </div>
        </Panel>
      )}
    </div>
  );
}

/* ============================================================
   FUND / PROJECT BREAKDOWN
============================================================ */

function FundBreakdownView({
  data,
  references,
  selectedFund,
  setSelectedFund,
  onLoad,
  group,
  year,
}) {
  const summary = data.summary || {};
  const selected = data.fund;

  return (
    <div>
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_160px_110px] gap-3 items-end">
          <Select
            label="Project / Fund"
            value={selectedFund}
            onChange={setSelectedFund}
            options={references.fund_clusters.map((x) => ({
              value: String(x.id),
              label: `${x.code || ""} — ${x.name || ""}`,
            }))}
          />
          <div className="text-[10px] text-gray-500 pb-2">
            FY {year} • {group}
          </div>
          <button
            type="button"
            onClick={onLoad}
            className="h-9 rounded-lg bg-[#211b79] text-white text-[10px] font-semibold"
          >
            View Breakdown
          </button>
        </div>
      </div>

      {selected ? (
        <>
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-yellow-50 text-yellow-700 flex items-center justify-center">
                <Folder className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#17135f]">
                  {selected.code} — {selected.name}
                </p>
                <p className="text-[10px] text-gray-500">
                  {selected.fund_group || "Fund"} • {selected.fund_source_name || "No funding source"}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3 mb-4">
            <Kpi title="Approved Budget" value={money(summary.approved_budget)} icon={Wallet} tone="blue" />
            <Kpi title="Utilization" value={money(summary.utilization)} icon={TrendingUp} tone="green" />
            <Kpi title="Disbursement" value={money(summary.disbursement)} icon={CreditCard} tone="orange" />
            <Kpi title="Unobligated" value={money(summary.unobligated)} icon={CircleDollarSign} tone="purple" />
            <Kpi title="Unpaid Obligation" value={money(summary.unpaid_obligation)} icon={FileCheck2} tone="red" />
          </div>

          <Panel title="Fund / Project Breakdown" subtitle="Budget, utilization, disbursement and remaining amount by class">
            <ClassBreakdownTable rows={data.classes || []} />
          </Panel>
        </>
      ) : (
        <Panel title="Fund / Project Breakdown">
          <div className="py-12 text-center text-xs text-gray-400">
            Select a fund/project to display its breakdown.
          </div>
        </Panel>
      )}
    </div>
  );
}

/* ============================================================
   FINANCIAL REPORTS
============================================================ */

function FinancialReportsView({
  data,
  reportType,
  setReportType,
  selectedFund,
  setSelectedFund,
  fundOptions,
  reportPreview,
  setReportPreview,
  onPrint,
}) {
  const reportTypes = data.reportTypes || [];
  const summary = data.summary || {};
  const selectedReport =
    reportTypes.find((x) => x.id === reportType) || reportTypes[0];

  return (
    <div>
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Select
            label="Report Type"
            value={reportType}
            onChange={setReportType}
            options={reportTypes.map((x) => ({
              value: x.id,
              label: x.name,
            }))}
          />
          <Select
            label="Fund"
            value={selectedFund}
            onChange={setSelectedFund}
            options={fundOptions}
          />
          <button
            type="button"
            onClick={() => setReportPreview(true)}
            className="h-9 self-end rounded-lg bg-[#211b79] text-white text-[10px] font-semibold flex items-center justify-center gap-2"
          >
            <FileText className="w-3.5 h-3.5" />
            Generate / Preview
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_330px] gap-4">
        <Panel title="Financial Reports" subtitle="RBUD compliance reports">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {reportTypes.map((report) => (
              <button
                key={report.id}
                type="button"
                onClick={() => setReportType(report.id)}
                className={`text-left border rounded-xl p-4 ${
                  reportType === report.id
                    ? "border-[#211b79] bg-[#211b79]/5"
                    : "border-gray-100"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#17135f]">{report.name}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{report.description}</p>
                  </div>
                </div>
                <div className="mt-4 text-[10px] font-semibold text-[#211b79]">
                  Generate →
                </div>
              </button>
            ))}
          </div>
        </Panel>

        <Panel title="Report Summary" subtitle="Current filter">
          <div className="space-y-3">
            <DetailBox label="Report" value={selectedReport?.name || "—"} />
            <DetailBox label="Approved Budget" value={money(summary.approved_budget)} />
            <DetailBox label="Obligations" value={money(summary.obligations)} />
            <DetailBox label="Disbursements" value={money(summary.disbursements)} />
            <DetailBox label="Unpaid Obligation" value={money(summary.unpaid_obligation)} />
            <DetailBox label="Records" value={String(summary.records || 0)} />
          </div>
        </Panel>
      </div>

      {reportPreview && (
        <ReportPreview
          title={selectedReport?.name || "Financial Report"}
          summary={summary}
          onClose={() => setReportPreview(false)}
          onPrint={onPrint}
        />
      )}
    </div>
  );
}

/* ============================================================
   MASTER DATA
============================================================ */

function MasterDataView({ references, tab, setTab, search, setSearch }) {
  const datasets = {
    "Fund Codes": references.fund_sources,
    "Fund Clusters": references.fund_clusters,
    Campus: references.campuses,
    "Responsibility Centers": references.responsibility_centers,
    "WFP Descriptions": references.wfp_sources,
    "Source Codes": references.fund_sources,
    "UACS Codes": references.uacs_codes,
    "Funding Source Codes": references.fund_sources,
    "Allotment Classes": references.allotment_classes,
    "Other Approved Codes": [
      ...references.pap,
      ...references.mfo,
      ...references.object_expenditures,
    ],
  };

  const tabs = [
    "Fund Codes",
    "Fund Clusters",
    "Campus",
    "Responsibility Centers",
    "WFP Descriptions",
    "Source Codes",
    "UACS Codes",
    "Funding Source Codes",
    "Allotment Classes",
    "Other Approved Codes",
  ];

  const rows = (datasets[tab] || []).filter((row) => {
    if (!search.trim()) return true;
    const haystack = Object.values(row || {}).join(" ").toLowerCase();
    return haystack.includes(search.toLowerCase());
  });

  return (
    <div>
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Settings2 className="w-4 h-4 text-[#211b79]" />
          <div>
            <h2 className="text-sm font-bold text-[#17135f]">Reference / Master Data</h2>
            <p className="text-[10px] text-gray-500">
              Reference information used by RBUD transaction forms and validation.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {tabs.map((item) => (
            <button
              type="button"
              key={item}
              onClick={() => setTab(item)}
              className={`h-8 px-3 rounded-lg border text-[9px] font-semibold ${
                tab === item
                  ? "bg-[#211b79] text-white border-[#211b79]"
                  : "border-gray-200 text-gray-600"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <Panel
        title={tab}
        subtitle={`${rows.length} reference record(s)`}
        action={
          <div className="h-8 border border-gray-200 rounded-lg flex items-center px-2 gap-2">
            <Search className="w-3.5 h-3.5 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="outline-none text-[10px] w-40"
            />
          </div>
        }
      >
        <ReferenceTable rows={rows} />
      </Panel>
    </div>
  );
}

/* ============================================================
   REPORTS & EXPORT
============================================================ */

function ReportsExportView({
  entries,
  group,
  year,
  fund,
  setFund,
  fundOptions,
  onExport,
  onPrint,
  onPreview,
  preview,
  closePreview,
}) {
  return (
    <div>
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Select
            label="Report Type"
            value="RBUD Registry"
            onChange={() => {}}
            options={[
              "RBUD Registry",
              "WFP Monitoring Report",
              "Financial Summary",
              "Fund / Project Breakdown",
            ]}
          />
          <Select
            label="Fund"
            value={fund}
            onChange={setFund}
            options={fundOptions}
          />
          <div className="h-9 border border-gray-200 rounded-lg px-3 flex items-center text-[10px] text-gray-500 self-end">
            FY {year} • {group}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
        <ReportAction icon={List} title="Generate Registry" description="Generate fund and transaction registries" onClick={onPreview} />
        <ReportAction icon={ClipboardList} title="Generate WFP Report" description="Generate WFP monitoring reports" onClick={onPreview} />
        <ReportAction icon={FileText} title="Generate Financial Report" description="Generate financial accountability reports" onClick={onPreview} />
        <ReportAction icon={Printer} title="Print Preview" description="Preview report before printing" onClick={onPreview} />
        <ReportAction icon={Download} title="Export" description="Export reports to CSV / Excel-ready data" onClick={onExport} />
      </div>

      <Panel
        title="Report Preview"
        subtitle={`${entries.length} current registry record(s)`}
        className="mt-4"
        action={
          <div className="flex items-center gap-2">
            <button type="button" onClick={onPrint} className="h-8 px-3 border border-gray-200 rounded-lg text-[10px] font-semibold flex items-center gap-1.5">
              <Printer className="w-3.5 h-3.5" />
              Print
            </button>
            <button type="button" onClick={onExport} className="h-8 px-3 bg-[#211b79] text-white rounded-lg text-[10px] font-semibold flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
          </div>
        }
      >
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
          <div className="bg-white border border-gray-200 rounded-lg p-5 max-w-4xl mx-auto">
            <div className="text-center border-b border-gray-200 pb-4">
              <p className="text-[10px] text-gray-400">BUDGET MONITORING AND ALLOCATION SYSTEM</p>
              <h3 className="text-base font-bold text-[#17135f] mt-1">RBUD Registry Report</h3>
              <p className="text-[10px] text-gray-500 mt-1">
                Fiscal Year {year} • Fund Group: {group}
              </p>
            </div>

            <div className="grid grid-cols-4 gap-2 my-4">
              <MiniMetric label="Records" value={String(entries.length)} />
              <MiniMetric label="Fund" value={fund || "All Funds"} />
              <MiniMetric label="Period" value={`FY ${year}`} />
              <MiniMetric label="Status" value="Generated Preview" />
            </div>

            <TransactionTable entries={entries.slice(0, 10)} compact />
          </div>
        </div>
      </Panel>

      {preview && (
        <div className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center p-5">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#17135f]">RBUD Report Preview</h2>
              <button type="button" onClick={closePreview} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5">
              <div className="border border-gray-200 rounded-xl p-5">
                <p className="text-[10px] text-gray-400">FY {year} • {group}</p>
                <h3 className="text-lg font-bold text-[#17135f] mt-1">RBUD Registry Report</h3>
                <p className="text-xs text-gray-500 mt-1">Fund: {fund || "All Funds"}</p>
                <div className="mt-5">
                  <TransactionTable entries={entries} compact />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   MODALS
============================================================ */

function RecordModal({
  mode,
  record,
  form,
  setForm,
  references,
  onClose,
  onSubmit,
}) {
  const readOnly = mode === "view";

  const update = (field, value) =>
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

  const selectOptions = (items, label = "name") =>
    (items || []).map((item) => ({
      value: String(item.id),
      label: `${item.code ? `${item.code} — ` : ""}${item[label] || item.name || ""}`,
    }));

  if (readOnly) {
    return (
      <Modal title="RBUD Transaction Details" onClose={onClose}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DetailField label="Registry No." value={record?.registry_no} />
          <DetailField label="Entry Date" value={dateLabel(record?.entry_date)} />
          <DetailField label="Fiscal Year" value={record?.fiscal_year} />
          <DetailField label="Fund" value={`${record?.fund_cluster_code || "—"} — ${record?.fund_cluster_name || "—"}`} />
          <DetailField label="Fund Group" value={record?.fund_group} />
          <DetailField label="Campus" value={record?.campus_name} />
          <DetailField label="BURS Serial No." value={record?.burs_serial_no} />
          <DetailField label="Reference No." value={record?.ref_no} />
          <DetailField label="Payee" value={record?.payee} />
          <DetailField label="Particulars" value={record?.particulars} />
          <DetailField label="Responsibility Center" value={record?.department_name || record?.responsibility_center_name} />
          <DetailField label="PAP" value={record?.pap_name} />
          <DetailField label="UACS" value={`${record?.uacs_code || "—"} ${record?.account_title || ""}`} />
          <DetailField label="Object of Expenditure" value={record?.object_expenditure_name} />
          <DetailField label="Utilization / Obligation" value={money(record?.utilization_amount)} />
          <DetailField label="Disbursement" value={money(record?.disbursement_amount)} />
          <DetailField label="Running Balance" value={money(record?.running_balance)} />
          <DetailField label="Unpaid Utilization" value={money(record?.unpaid_utilization)} />
          <DetailField label="PO No." value={record?.po_no} />
          <DetailField label="Status of PO" value={record?.status_of_po} />
          <DetailField label="Status" value={record?.status} />
          <DetailField label="Remarks" value={record?.remarks} />
        </div>
      </Modal>
    );
  }

  return (
    <Modal title={mode === "edit" ? "Edit RBUD Transaction" : "Add RBUD Transaction"} onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <h3 className="text-xs font-bold text-[#17135f] mb-3">Registry Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <InputField label="Registry No." value={form.registry_no} onChange={(v) => update("registry_no", v)} required />
            <InputField label="Entry Date" type="date" value={form.entry_date} onChange={(v) => update("entry_date", v)} required />
            <InputField label="Fiscal Year" type="number" value={form.fiscal_year} onChange={(v) => update("fiscal_year", v)} />
            <SelectField label="Fund Cluster" value={form.fund_cluster_id} onChange={(v) => update("fund_cluster_id", v)} options={selectOptions(references.fund_clusters)} />
            <SelectField label="Fund Source" value={form.fund_source_id} onChange={(v) => update("fund_source_id", v)} options={selectOptions(references.fund_sources)} />
            <SelectField label="Campus" value={form.campus_id} onChange={(v) => update("campus_id", v)} options={selectOptions(references.campuses)} />
            <InputField label="BURS Serial No." value={form.burs_serial_no} onChange={(v) => update("burs_serial_no", v)} />
            <InputField label="Transferred Serial No." value={form.serial_no_transferred} onChange={(v) => update("serial_no_transferred", v)} />
            <InputField label="Reference No." value={form.ref_no} onChange={(v) => update("ref_no", v)} />
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold text-[#17135f] mb-3">Classification</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <SelectField label="Responsibility Center" value={form.responsibility_center_id} onChange={(v) => update("responsibility_center_id", v)} options={selectOptions(references.responsibility_centers)} />
            <SelectField label="PAP / Program" value={form.pap_id} onChange={(v) => update("pap_id", v)} options={selectOptions(references.pap)} />
            <SelectField label="UACS Code" value={form.uacs_code_id} onChange={(v) => update("uacs_code_id", v)} options={selectOptions(references.uacs_codes, "account_title")} />
            <SelectField label="Object of Expenditure" value={form.object_expenditure_id} onChange={(v) => update("object_expenditure_id", v)} options={selectOptions(references.object_expenditures)} />
            <SelectField label="MFO" value={form.mfo_id} onChange={(v) => update("mfo_id", v)} options={selectOptions(references.mfo)} />
            <SelectField label="Allotment Class" value={form.allotment_class_id} onChange={(v) => update("allotment_class_id", v)} options={selectOptions(references.allotment_classes)} />
            <InputField label="UACS Funding Source Code" value={form.uacs_funding_source_code} onChange={(v) => update("uacs_funding_source_code", v)} />
            <InputField label="Month" value={form.month} onChange={(v) => update("month", v)} />
            <InputField label="Series" value={form.series} onChange={(v) => update("series", v)} />
            <InputField label="Series2" value={form.series2} onChange={(v) => update("series2", v)} />
            <InputField label="Quarter" value={form.quarter} onChange={(v) => update("quarter", v)} />
            <SelectField label="Old UACS Code" value={form.old_uacs_code_id} onChange={(v) => update("old_uacs_code_id", v)} options={selectOptions(references.uacs_codes)} />
            <InputField label="WFP Source Code" value={form.wfp_source_code} onChange={(v) => update("wfp_source_code", v)} />
            <SelectField label="WFP Source" value={form.wfp_source_id} onChange={(v) => update("wfp_source_id", v)} options={selectOptions(references.wfp_sources)} />
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold text-[#17135f] mb-3">Transaction / Utilization Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <InputField label="Payee" value={form.payee} onChange={(v) => update("payee", v)} />
            <InputField label="Particulars" value={form.particulars} onChange={(v) => update("particulars", v)} />
            <InputField label="DV / Payroll No." value={form.dv_payroll_no} onChange={(v) => update("dv_payroll_no", v)} />
            <InputField label="Account Title" value={form.account_title} onChange={(v) => update("account_title", v)} />
            <InputField label="Utilization" type="number" value={form.utilization_amount} onChange={(v) => update("utilization_amount", v)} />
            <InputField label="Disbursement" type="number" value={form.disbursement_amount} onChange={(v) => update("disbursement_amount", v)} />
            <InputField label="PS Utilization" type="number" value={form.ps_utilization} onChange={(v) => update("ps_utilization", v)} />
            <InputField label="MOOE Utilization" type="number" value={form.mooe_utilization} onChange={(v) => update("mooe_utilization", v)} />
            <InputField label="CO Utilization" type="number" value={form.co_utilization} onChange={(v) => update("co_utilization", v)} />
            <InputField label="Unpaid Utilization" type="number" value={form.unpaid_utilization} onChange={(v) => update("unpaid_utilization", v)} />
            <InputField label="Running Balance / Balances" type="number" value={form.running_balance} onChange={(v) => update("running_balance", v)} />
            <InputField label="PO No." value={form.po_no} onChange={(v) => update("po_no", v)} />
            <InputField label="Status of PO" value={form.status_of_po} onChange={(v) => update("status_of_po", v)} />
            <InputField label="Remarks" value={form.remarks} onChange={(v) => update("remarks", v)} />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 rounded-lg border border-gray-200 text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="h-9 px-4 rounded-lg bg-[#211b79] text-white text-xs font-semibold"
          >
            {mode === "edit" ? "Save Changes" : "Save Transaction"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ============================================================
   REUSABLE UI
============================================================ */

function Kpi({ title, value, sub, icon: Icon, tone }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold text-gray-400 uppercase">{title}</p>
          <p className="text-lg font-bold text-[#17135f] mt-2">{value}</p>
          {sub && <p className="text-[9px] text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className={`w-9 h-9 rounded-lg text-white flex items-center justify-center ${toneMap[tone] || toneMap.blue}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}

function Panel({ title, subtitle, action, children, className = "" }) {
  return (
    <section className={`bg-white border border-gray-100 rounded-xl shadow-sm ${className}`}>
      <div className="px-4 py-3 border-b border-gray-100 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-[#17135f]">{title}</h2>
          {subtitle && <p className="text-[10px] text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function TabBar({ tabs, value, onChange }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm px-4 pt-3 mb-4 flex items-center gap-6 overflow-x-auto">
      {tabs.map((tab) => (
        <button
          type="button"
          key={tab}
          onClick={() => onChange(tab)}
          className={`pb-3 text-[10px] font-semibold border-b-2 whitespace-nowrap ${
            value === tab
              ? "text-[#211b79] border-[#211b79]"
              : "text-gray-500 border-transparent"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

function Select({ label, value, onChange, options = [] }) {
  return (
    <div>
      <label className="block text-[10px] font-semibold text-gray-500 mb-1">{label}</label>
      <select
        value={typeof value === "object" ? value.value : value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-9 border border-gray-200 rounded-lg px-3 text-xs bg-white outline-none"
      >
        {options.map((option) => {
          const item =
            typeof option === "object"
              ? option
              : { value: option, label: option };
          return (
            <option key={String(item.value)} value={item.value}>
              {item.label}
            </option>
          );
        })}
      </select>
    </div>
  );
}

function SelectField({ label, value, onChange, options }) {
  return <Select label={label} value={value} onChange={onChange} options={options} />;
}

function InputField({ label, value, onChange, type = "text", required = false }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
      <input
        type={type}
        value={value ?? ""}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-10 border border-gray-200 rounded-lg px-3 text-xs outline-none focus:border-[#211b79]"
      />
    </div>
  );
}

function DetailField({ label, value }) {
  return (
    <div>
      <p className="text-[10px] text-gray-400">{label}</p>
      <p className="text-xs font-semibold text-gray-700 mt-1">{value || "—"}</p>
    </div>
  );
}

function DetailBox({ label, value }) {
  return (
    <div className="border border-gray-100 rounded-xl p-3 bg-gray-50/40">
      <p className="text-[10px] text-gray-400">{label}</p>
      <p className="text-sm font-bold text-[#17135f] mt-1">{value}</p>
    </div>
  );
}

function MiniMetric({ label, value }) {
  return (
    <div className="border border-gray-100 rounded-lg p-3">
      <p className="text-[9px] text-gray-400">{label}</p>
      <p className="text-xs font-bold text-gray-800 mt-1 break-words">{value}</p>
    </div>
  );
}

function ProgressRow({ label, value, total }) {
  const p = percent(value, total);
  return (
    <div>
      <div className="flex justify-between items-center text-[10px] mb-1">
        <span className="font-semibold text-gray-600">{label}</span>
        <span className="text-gray-500">{money(value)} • {p.toFixed(2)}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-[#211b79] rounded-full" style={{ width: `${Math.min(100, p)}%` }} />
      </div>
    </div>
  );
}

function BudgetClassTable({ totals }) {
  const rows = [
    ["PS", "Personnel Services", totals.ps],
    ["MOOE", "Maintenance and Other Operating Expenses", totals.mooe],
    ["CO", "Capital Outlay", totals.co],
  ];
  return <ClassTable rows={rows} />;
}

function ClassTable({ rows }) {
  const total = rows.reduce((sum, row) => sum + numberValue(row[2]), 0);
  return (
    <table className="w-full text-[10px]">
      <thead>
        <tr className="border-b border-gray-100 text-gray-500">
          <th className="p-3 text-left">Code</th>
          <th className="p-3 text-left">Particulars</th>
          <th className="p-3 text-right">Amount</th>
          <th className="p-3 text-center">%</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row[0]} className="border-b border-gray-50">
            <td className="p-3 font-semibold">{row[0]}</td>
            <td className="p-3">{row[1]}</td>
            <td className="p-3 text-right font-semibold">{money(row[2])}</td>
            <td className="p-3 text-center">{percent(row[2], total).toFixed(2)}%</td>
          </tr>
        ))}
        <tr className="font-bold bg-gray-50">
          <td className="p-3" colSpan={2}>TOTAL</td>
          <td className="p-3 text-right">{money(total)}</td>
          <td className="p-3 text-center">100%</td>
        </tr>
      </tbody>
    </table>
  );
}

function ClassBreakdownTable({ rows }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[800px] text-[10px]">
        <thead className="bg-gray-50 text-gray-500">
          <tr>
            <th className="p-3 text-left">Code</th>
            <th className="p-3 text-left">Particulars</th>
            <th className="p-3 text-right">Approved Budget</th>
            <th className="p-3 text-right">Utilization</th>
            <th className="p-3 text-right">Disbursement</th>
            <th className="p-3 text-right">Unutilized</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const approved = numberValue(row.approved_budget);
            const used = numberValue(row.utilization);
            return (
              <tr key={row.code} className="border-b border-gray-50">
                <td className="p-3 font-semibold">{row.code}</td>
                <td className="p-3">{row.name}</td>
                <td className="p-3 text-right">{money(approved)}</td>
                <td className="p-3 text-right">{money(used)}</td>
                <td className="p-3 text-right">{money(row.disbursement)}</td>
                <td className="p-3 text-right">{money(approved - used)}</td>
              </tr>
            );
          })}
          {!rows.length && <EmptyRow colSpan={6} />}
        </tbody>
      </table>
    </div>
  );
}

function ReferenceTable({ rows }) {
  if (!rows.length) {
    return <div className="py-12 text-center text-xs text-gray-400">No reference records found.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[700px] text-[10px]">
        <thead className="bg-gray-50 text-gray-500">
          <tr>
            <th className="p-3 text-left">Code / ID</th>
            <th className="p-3 text-left">Name / Title</th>
            <th className="p-3 text-left">Description</th>
            <th className="p-3 text-center">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id || `${row.code}-${index}`} className="border-b border-gray-50">
              <td className="p-3 font-semibold">{row.code || row.id || "—"}</td>
              <td className="p-3">{row.name || row.account_title || row.revised_description || "—"}</td>
              <td className="p-3 text-gray-500">{row.description || row.account_description || row.fund_source_name || "—"}</td>
              <td className="p-3 text-center">
                <span className="px-2 py-1 rounded-full bg-green-50 text-green-700">
                  {row.is_active === false ? "Inactive" : "Active"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ status }) {
  const normalized = String(status || "Approved");
  const cls =
    normalized === "Disbursed"
      ? "bg-green-50 text-green-700"
      : normalized === "Obligated"
      ? "bg-blue-50 text-blue-700"
      : normalized === "Rejected"
      ? "bg-red-50 text-red-700"
      : "bg-gray-50 text-gray-600";

  return <span className={`px-2 py-1 rounded-full text-[9px] font-semibold ${cls}`}>{normalized}</span>;
}

function ActionButton({ title, onClick, icon: Icon }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="w-7 h-7 rounded-md border border-gray-200 flex items-center justify-center hover:bg-gray-50"
    >
      <Icon className="w-3.5 h-3.5 text-gray-500" />
    </button>
  );
}

function ReportAction({ icon: Icon, title, description, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left bg-white border border-gray-100 rounded-xl shadow-sm p-4 hover:border-[#211b79]/30"
    >
      <div className="w-9 h-9 rounded-lg bg-green-50 text-green-700 flex items-center justify-center">
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-xs font-bold text-[#17135f] mt-3">{title}</p>
      <p className="text-[10px] text-gray-500 mt-1 leading-4">{description}</p>
    </button>
  );
}

function ReportPreview({ title, summary, onClose, onPrint }) {
  return (
    <div className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center p-5">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#17135f]">{title} Preview</h2>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5">
          <div className="border border-gray-200 rounded-xl p-6">
            <div className="text-center border-b border-gray-200 pb-4">
              <p className="text-[9px] text-gray-400">UNIVERSITY OF ABRA — MAIN CAMPUS</p>
              <h3 className="text-base font-bold text-[#17135f] mt-1">{title}</h3>
              <p className="text-[10px] text-gray-500 mt-1">RBUD Financial Report</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
              <MiniMetric label="Approved Budget" value={money(summary.approved_budget)} />
              <MiniMetric label="Obligations" value={money(summary.obligations)} />
              <MiniMetric label="Disbursements" value={money(summary.disbursements)} />
              <MiniMetric label="Unpaid" value={money(summary.unpaid_obligation)} />
            </div>
            <div className="mt-6 p-4 bg-gray-50 rounded-lg text-[10px] text-gray-500">
              This preview is generated from the current RBUD database records and selected filters.
            </div>
            <div className="flex justify-end mt-5">
              <button type="button" onClick={onPrint} className="h-9 px-4 bg-[#211b79] text-white rounded-lg text-xs font-semibold flex items-center gap-2">
                <Printer className="w-4 h-4" />
                Print
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyRow({ colSpan }) {
  return (
    <tr>
      <td colSpan={colSpan} className="p-10 text-center text-gray-400">
        No records found.
      </td>
    </tr>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-[90] bg-black/40 flex items-center justify-center p-5">
      <div className="w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-white rounded-2xl shadow-2xl">
        <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#17135f]">{title}</h2>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}



