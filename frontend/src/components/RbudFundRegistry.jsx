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
    title: "Dashboard",
    description: "See the current approved budget, utilization, disbursement, and remaining balance at a glance.",
    icon: Wallet,
    tone: "blue",
    action: "Open Dashboard",
  },
  {
    id: "allocation",
    number: "2",
    title: "Budget & Allocation",
    description: "See how the approved budget is allocated by PS, MOOE, CO, department, and PAP.",
    icon: BarChart3,
    tone: "green",
    tabs: ["Summary", "PS / MOOE / CO", "Allocation Details"],
  },
  {
    id: "transactions",
    number: "3",
    title: "Transactions",
    description: "Enter and manage the actual RBUD transactions. Registry No. is entered manually.",
    icon: ClipboardList,
    tone: "orange",
    tabs: ["Transaction List", "Add Transaction", "Transaction History"],
  },
  {
    id: "monitoring",
    number: "4",
    title: "Monitoring",
    description: "Check what has been utilized, what has been disbursed, and what budget remains.",
    icon: TrendingUp,
    tone: "teal",
    tabs: ["Overall", "By Fund", "By Department", "By Budget Class"],
  },
  {
    id: "reports",
    number: "5",
    title: "Reports & Export",
    description: "Generate RBUD and financial reports, print records, and export data for documentation.",
    icon: FileText,
    tone: "purple",
    tabs: ["Financial Reports", "RBUD Registry", "Print / Export"],
  },
];

const money = (value) =>
  `₱${Number(value || 0).toLocaleString("en-US", {
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
  const [transactionTab, setTransactionTab] = useState("Transaction List");
  const [breakdownTab, setBreakdownTab] = useState("By Fund / Project");
  const [departmentMonitoring, setDepartmentMonitoring] = useState({
    departments: [],
    total: 0,
  });
  const [utilizationTab, setUtilizationTab] = useState("Summary");
  const [monitoringTab, setMonitoringTab] = useState("Overall");
  const [reportChoice, setReportChoice] = useState("RBUD Registry");
  const [fundGroupTab, setFundGroupTab] = useState("All");
  const [referenceTab, setReferenceTab] = useState("Fund Codes");
  const [referenceSearch, setReferenceSearch] = useState("");
  const [reportType, setReportType] = useState("FAR2");
  const [reportPreview, setReportPreview] = useState(false);
  const [selectedBreakdownFund, setSelectedBreakdownFund] = useState("");

  const [recordModal, setRecordModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
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

  const loadDepartmentMonitoring = useCallback(async () => {
    try {
      const data = await query(`/rbud/departments?${filterParams()}`);
      setDepartmentMonitoring({
        departments: data.departments || [],
        total: Number(data.total || 0),
      });
    } catch (err) {
      setError(err.message);
      setDepartmentMonitoring({ departments: [], total: 0 });
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
    // The RBUD landing page now shows live summary cards and recent
    // transactions, so keep only those two lightweight requests active
    // while the user is on the module home. Other module data loads only
    // when its corresponding view is opened.
    loadOverview();
    loadEntries(1);

    if (view === "module") return;

    loadAllocation();
    loadDepartmentMonitoring();
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
    loadDepartmentMonitoring,
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

  const openView = (nextView, initialTab = "") => {
    setError("");
    setView(nextView);
    setReportPreview(false);

    if (nextView === "allocation" && initialTab) setAllocationTab(initialTab);
    if (nextView === "transactions" && initialTab) {
      setTransactionTab(initialTab);
      if (initialTab === "Add Transaction") {
        window.setTimeout(() => openAddRecord(), 0);
      }
    }
    if (nextView === "monitoring" && initialTab) {
      setMonitoringTab(initialTab);
      if (initialTab === "Overall") setUtilizationTab("Summary");
      if (initialTab === "By Fund") setUtilizationTab("WFP Balance");
    }
    if (nextView === "reports" && initialTab) {
      setReportChoice(
        initialTab === "Financial Reports"
          ? "Financial Summary"
          : initialTab === "RBUD Registry"
            ? "RBUD Registry"
            : "RBUD Registry"
      );
      if (initialTab === "Print / Export") setReportPreview(true);
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
      loadDepartmentMonitoring(),
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

  const openEditRecord = async (record) => {
    try {
      // Always load the complete database record before editing.
      // The transaction list is a joined/derived row and may not contain every
      // field required by the PUT request.
      const fresh = await query(`/rbud/${record.id}`);
      setSelectedRecord(fresh);
      setForm({
        ...initialForm(selectedFiscalYear),
        ...fresh,
        fiscal_year: Number(fresh.fiscal_year || selectedFiscalYear),
        fund_cluster_id: fresh.fund_cluster_id ? String(fresh.fund_cluster_id) : "",
        fund_source_id: fresh.fund_source_id ? String(fresh.fund_source_id) : "",
        campus_id: fresh.campus_id ? String(fresh.campus_id) : "",
        responsibility_center_id: fresh.responsibility_center_id ? String(fresh.responsibility_center_id) : "",
        pap_id: fresh.pap_id ? String(fresh.pap_id) : "",
        uacs_code_id: fresh.uacs_code_id ? String(fresh.uacs_code_id) : "",
        object_expenditure_id: fresh.object_expenditure_id ? String(fresh.object_expenditure_id) : "",
        mfo_id: fresh.mfo_id ? String(fresh.mfo_id) : "",
        allotment_class_id: fresh.allotment_class_id ? String(fresh.allotment_class_id) : "",
        wfp_source_id: fresh.wfp_source_id ? String(fresh.wfp_source_id) : "",
        old_uacs_code_id: fresh.old_uacs_code_id ? String(fresh.old_uacs_code_id) : "",
      });
      setError("");
      setRecordModal("edit");
    } catch (err) {
      setError(err.message || "Failed to load the RBUD record for editing.");
    }
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

    // Client-side validation for the database CHECK constraints.
    const monthText = String(form.month ?? "").trim();
    const quarterText = String(form.quarter ?? "").trim();

    if (!String(form.registry_no ?? "").trim()) {
      setError("Registry No. is required. Please enter it manually.");
      return;
    }

    if (!String(form.entry_date ?? "").trim()) {
      setError("Entry Date is required.");
      return;
    }

    if (monthText !== "") {
      const month = Number(monthText);
      if (!Number.isInteger(month) || month < 1 || month > 12) {
        setError("Month must be a whole number from 1 to 12.");
        return;
      }
    }

    if (quarterText !== "") {
      const quarter = Number(quarterText);
      if (!Number.isInteger(quarter) || quarter < 1 || quarter > 4) {
        setError("Quarter must be a whole number from 1 to 4.");
        return;
      }
    }

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
      await refreshAll();
      showToast(isEdit ? "RBUD record updated." : "RBUD record added.");
    } catch (err) {
      setError(err.message);
    }
  };

  const requestDeleteRecord = (record) => {
    setDeleteTarget(record);
  };

  const deleteRecord = async () => {
    if (!deleteTarget?.id) return;
    try {
      await query(`/rbud/${deleteTarget.id}`, { method: "DELETE" });
      setDeleteTarget(null);
      await refreshAll();
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
            modules={MODULES}
            overview={overview}
            entries={entries}
            approved={approved}
            allocated={numberValue(allocation?.totals?.approved_budget ?? approved)}
            utilized={obligations}
            balance={balance}
            fiscalYear={selectedFiscalYear}
            setFiscalYear={setSelectedFiscalYear}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedStatus={selectedStatus}
            setSelectedStatus={setSelectedStatus}
            onOpen={openView}
            onView={openRecord}
            onEdit={openEditRecord}
            onDelete={requestDeleteRecord}
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
                departmentMonitoring={departmentMonitoring}
                tab={allocationTab}
                setTab={setAllocationTab}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
              />
            )}

            {view === "transactions" && (
              <TransactionsView
                entries={entries}
                tab={transactionTab}
                setTab={setTransactionTab}
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
                onDelete={requestDeleteRecord}
              />
            )}

            {view === "monitoring" && (
              <MonitoringView
                data={utilization}
                departments={departmentMonitoring.departments || []}
                monitoringTab={monitoringTab}
                setMonitoringTab={setMonitoringTab}
                group={selectedGroup}
                setGroup={handleGroupClick}
                fund={selectedFund}
                setFund={setSelectedFund}
                fundOptions={fundOptions}
                year={selectedFiscalYear}
                setYear={setSelectedFiscalYear}
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
                reportChoice={reportChoice}
                setReportChoice={setReportChoice}
                onExport={exportCsv}
                onPrint={printCurrent}
                onPreview={() => setReportPreview(true)}
                preview={reportPreview}
                closePreview={() => setReportPreview(false)}
              />
            )}
          </div>
        )}

        {deleteTarget && (
          <ConfirmModal
            title="Delete RBUD Transaction"
            message={`Are you sure you want to delete Registry No. ${deleteTarget.registry_no || "this record"}? This action cannot be undone.`}
            onCancel={() => setDeleteTarget(null)}
            onConfirm={deleteRecord}
          />
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

function ModuleHome({
  modules,
  overview,
  entries,
  approved,
  allocated,
  utilized,
  balance,
  fiscalYear,
  setFiscalYear,
  searchTerm,
  setSearchTerm,
  selectedStatus,
  setSelectedStatus,
  onOpen,
  onView,
  onEdit,
  onDelete,
}) {
  const allocatedPct = percent(allocated, approved);
  const utilizedPct = percent(utilized, approved);
  const balancePct = percent(balance, approved);
  const recentRows = (entries || []).slice(0, 5);

  const statusOptions = ["All Status", "Recorded", "Obligated", "Disbursed", "Pending", "Rejected"];

  const openTransactions = () => onOpen("transactions");

  return (
    <div className="px-6 py-5">
      {/* Fiscal year */}
      <div className="flex items-center justify-end mb-4">
        <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 h-10 shadow-sm">
          <CalendarDays className="h-4 w-4 text-[#211b79]" />
          <span className="text-[12px] font-semibold text-slate-600">Fiscal Year</span>
          <select
            value={fiscalYear}
            onChange={(e) => setFiscalYear(e.target.value)}
            className="bg-transparent text-[13px] font-bold text-[#10245b] outline-none cursor-pointer"
          >
            {[2026, 2025, 2024, 2023, 2022].map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <ChevronDown className="h-4 w-4 text-slate-500 pointer-events-none" />
        </label>
      </div>

      {/* KPI SUMMARY */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 mb-4">
        <MetricHome
          label="Approved Budget"
          value={money(approved)}
          percent={100}
          icon={Wallet}
          tone="blue"
        />
        <MetricHome
          label="Allocated Budget"
          value={money(allocated)}
          percent={allocatedPct}
          icon={CircleDollarSign}
          tone="green"
        />
        <MetricHome
          label="Utilized Budget"
          value={money(utilized)}
          percent={utilizedPct}
          icon={BarChart3}
          tone="orange"
        />
        <MetricHome
          label="Remaining Balance"
          value={money(balance)}
          percent={balancePct}
          icon={CircleDollarSign}
          tone="red"
        />
      </div>

      {/* HERO + UTILIZATION */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-4">
        <section className="xl:col-span-2 rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50 via-white to-indigo-50 shadow-sm overflow-hidden">
          <div className="min-h-[210px] px-6 py-6 flex items-center justify-between gap-6">
            <div className="max-w-[62%]">
              <p className="text-[13px] font-extrabold uppercase tracking-wide text-blue-700">RBUD Registry</p>
              <h1 className="mt-2 text-[24px] leading-7 font-extrabold text-[#10245b]">
                Monitor, Track, and Manage<br />Budget Utilization
              </h1>
              <p className="mt-3 text-[13px] leading-5 text-slate-600">
                Keep track of approved budget, allocation, utilization, and remaining balance by fund, department, and budget class. Generate financial reports for transparency and decision-making.
              </p>
              <button
                type="button"
                onClick={() => onOpen("overview")}
                className="mt-4 h-10 rounded-lg bg-blue-600 px-5 text-[13px] font-bold text-white shadow-sm hover:bg-blue-700 inline-flex items-center gap-2"
              >
                Go to Dashboard <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="hidden sm:flex h-40 w-44 shrink-0 items-center justify-center relative">
              <div className="absolute h-36 w-36 rounded-full bg-blue-100/70" />
              <div className="relative rounded-xl border border-blue-200 bg-white p-4 shadow-md">
                <FileCheck2 className="h-12 w-12 text-blue-600 mx-auto" />
                <div className="mt-3 flex items-end justify-center gap-1.5 h-10">
                  <span className="w-3 rounded-t bg-blue-300 h-5" />
                  <span className="w-3 rounded-t bg-blue-400 h-8" />
                  <span className="w-3 rounded-t bg-blue-600 h-10" />
                </div>
                <p className="mt-2 text-[10px] font-extrabold text-center text-[#10245b]">RBUD</p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm p-5">
          <h2 className="text-[17px] font-extrabold text-[#10245b]">Budget Utilization Overview</h2>
          <p className="mt-1 text-[12px] leading-4 text-slate-500">
            Comparison of allocated, utilized, and remaining balance for FY {fiscalYear}.
          </p>

          <ProgressHome label="Allocated Budget" value={allocatedPct} tone="green" />
          <ProgressHome label="Utilized Budget" value={utilizedPct} tone="orange" />
          <ProgressHome label="Remaining Balance" value={balancePct} tone="red" />
        </section>
      </div>

      {/* MODULES */}
      <div className="mb-2">
        <h2 className="text-[18px] font-extrabold text-[#10245b]">MODULES</h2>
        <p className="text-[12px] text-slate-500">Quick access to RBUD functions.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 mb-4">
        {modules.map((item) => (
          <ModuleCard
            key={item.id}
            item={item}
            Icon={item.icon}
            onClick={() => onOpen(item.id)}
          />
        ))}
      </div>

      {/* RECENT TRANSACTIONS */}
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-4 border-b border-slate-100">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-[18px] font-extrabold text-[#10245b]">Recent RBUD Transactions</h2>
              <p className="mt-0.5 text-[12px] text-slate-500">
                Latest RBUD registry transactions for FY {fiscalYear}.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") openTransactions();
                  }}
                  placeholder="Search registry no., department, payee, particulars..."
                  className="h-10 w-full sm:w-[300px] rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-[12px] text-slate-700 outline-none focus:border-blue-400"
                />
              </div>
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  window.setTimeout(openTransactions, 0);
                }}
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-semibold text-slate-600 outline-none"
              >
                {statusOptions.map((status) => <option key={status}>{status}</option>)}
              </select>
              <button
                type="button"
                onClick={openTransactions}
                className="h-10 px-3 rounded-lg text-[12px] font-bold text-blue-700 hover:bg-blue-50 inline-flex items-center justify-center gap-1"
              >
                View All <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-[12px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500">
                <th className="px-4 py-3 text-left font-bold">REGISTRY NO.</th>
                <th className="px-4 py-3 text-left font-bold">DATE</th>
                <th className="px-4 py-3 text-left font-bold">DEPARTMENT</th>
                <th className="px-4 py-3 text-left font-bold">FUND</th>
                <th className="px-4 py-3 text-left font-bold">PARTICULARS</th>
                <th className="px-4 py-3 text-right font-bold">AMOUNT</th>
                <th className="px-4 py-3 text-center font-bold">STATUS</th>
                <th className="px-4 py-3 text-center font-bold">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {recentRows.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-10 text-center text-slate-400">
                    No RBUD transactions found for FY {fiscalYear}.
                  </td>
                </tr>
              ) : (
                recentRows.map((row, index) => (
                  <tr key={row.id || row.registry_no || index} className="border-b border-slate-100 hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-bold text-[#10245b] whitespace-nowrap">{row.registry_no || "—"}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600">{dateLabel(row.entry_date)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-700">{row.responsibility_center_name || row.department_name || "—"}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-700">{row.fund_cluster_name || row.fund_name || row.fund_group || "—"}</td>
                    <td className="px-4 py-3 max-w-[300px] truncate text-slate-700">{row.particulars || "—"}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-800 whitespace-nowrap">{money(row.utilization_amount || row.amount || row.total_utilized)}</td>
                    <td className="px-4 py-3 text-center whitespace-nowrap"><StatusBadge status={row.status || row.entry_status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <ActionButton title="View" onClick={() => onView(row)} icon={Eye} />
                        <ActionButton title="Edit" onClick={() => onEdit(row)} icon={Edit2} />
                        <ActionButton title="Delete" onClick={() => onDelete(row)} icon={Trash2} />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 flex items-center justify-between text-[12px] text-slate-500">
          <span>Showing 1 to {Math.min(recentRows.length, 5)} of {paginationText(entries)}</span>
          <button
            type="button"
            onClick={openTransactions}
            className="font-bold text-blue-700 hover:text-blue-800"
          >
            View all transactions →
          </button>
        </div>
      </section>
    </div>
  );
}

function paginationText(entries) {
  return entries?.length ? `${entries.length} loaded` : "0 entries";
}

function MetricHome({ label, value, percent: pctValue, icon: Icon, tone }) {
  const tones = {
    blue: { icon: "bg-blue-600", bar: "bg-blue-500", soft: "bg-blue-50", text: "text-blue-700" },
    green: { icon: "bg-green-600", bar: "bg-green-500", soft: "bg-green-50", text: "text-green-700" },
    orange: { icon: "bg-orange-500", bar: "bg-orange-400", soft: "bg-orange-50", text: "text-orange-700" },
    red: { icon: "bg-red-500", bar: "bg-red-500", soft: "bg-red-50", text: "text-red-700" },
  };
  const t = tones[tone] || tones.blue;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-1 text-[20px] leading-6 font-extrabold text-[#10245b] whitespace-nowrap">{value}</p>
        </div>
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${t.icon} text-white shadow-sm`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
          <div className={`h-full rounded-full ${t.bar}`} style={{ width: `${Math.min(100, Math.max(0, pctValue || 0))}%` }} />
        </div>
        <span className={`text-[11px] font-bold ${t.text}`}>{Number(pctValue || 0).toFixed(2)}%</span>
      </div>
    </div>
  );
}

function ProgressHome({ label, value, tone }) {
  const bar = tone === "green" ? "bg-green-500" : tone === "orange" ? "bg-orange-400" : "bg-red-500";
  return (
    <div className="mt-5">
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <span className="text-[12px] font-semibold text-slate-700">{label}</span>
        <span className="text-[12px] font-bold text-[#10245b]">{Number(value || 0).toFixed(2)}%</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${bar}`} style={{ width: `${Math.min(100, Math.max(0, value || 0))}%` }} />
      </div>
    </div>
  );
}

function ModuleCard({ item, Icon, onClick }) {
  const openLabel = item.id === "overview"
    ? "Go to Dashboard"
    : item.id === "allocation"
      ? "Open Budget & Allocation"
      : item.id === "transactions"
        ? "Open Transactions"
        : item.id === "monitoring"
          ? "Open Monitoring"
          : "Open Reports & Export";

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition min-h-[150px] flex flex-col">
      <button type="button" onClick={onClick} className="w-full text-left flex items-start gap-3">
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white ${toneMap[item.tone]}`}>
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h3 className="text-[14px] leading-5 font-extrabold text-[#10245b]">{item.number}. {item.title}</h3>
          <p className="mt-1.5 text-[11px] leading-4 text-slate-600">{item.description}</p>
        </div>
      </button>
      <button
        type="button"
        onClick={onClick}
        className={`mt-auto w-full h-9 rounded-lg border text-[11px] font-bold inline-flex items-center justify-center gap-1.5 ${
          item.tone === "blue" ? "border-blue-600 text-blue-700 hover:bg-blue-600 hover:text-white" :
          item.tone === "green" ? "border-green-600 text-green-700 hover:bg-green-600 hover:text-white" :
          item.tone === "orange" ? "border-orange-500 text-orange-600 hover:bg-orange-500 hover:text-white" :
          item.tone === "teal" ? "border-teal-500 text-teal-600 hover:bg-teal-500 hover:text-white" :
          "border-purple-600 text-purple-700 hover:bg-purple-600 hover:text-white"
        }`}
      >
        {openLabel}<ChevronRight className="h-4 w-4" />
      </button>
    </section>
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

function BudgetAllocationView({
  allocation,
  departmentMonitoring,
  tab,
  setTab,
  searchTerm,
  setSearchTerm,
}) {
  const totals = allocation.totals || {};
  const rows = allocation.rows || [];
  const departments = departmentMonitoring?.departments || [];

  return (
    <div>
      <TabBar
        tabs={[
          "Summary",
          "PS / MOOE / CO",
          "Department Monitoring",
          "Allocation Details",
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === "Summary" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Kpi
            title="Approved Budget"
            value={money(totals.approved_budget)}
            icon={Wallet}
            tone="blue"
          />
          <Kpi
            title="PS"
            value={money(totals.ps)}
            icon={Users}
            tone="green"
          />
          <Kpi
            title="MOOE + CO"
            value={money(
              numberValue(totals.mooe) + numberValue(totals.co)
            )}
            icon={BarChart3}
            tone="purple"
          />

          <Panel
            title="Allocation Overview"
            subtitle="Approved budget allocation from the budget registry."
            className="md:col-span-3"
          >
            <BudgetClassTable totals={totals} />
          </Panel>
        </div>
      )}

      {tab === "PS / MOOE / CO" && (
        <Panel
          title="PS / MOOE / CO"
          subtitle="Approved budget classified by allotment class."
        >
          <BudgetClassTable totals={totals} />
        </Panel>
      )}

      {tab === "Department Monitoring" && (
        <DepartmentMonitoringTable departments={departments} />
      )}

      {tab === "Allocation Details" && (
        <Panel
          title="Allocation Details"
          subtitle="Detailed approved budget records for the selected fiscal year and fund group."
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
                      <div className="text-gray-400">
                        {row.fund_cluster_name || "—"}
                      </div>
                    </td>
                    <td className="p-3">
                      {row.responsibility_center_name || "—"}
                    </td>
                    <td className="p-3">
                      {row.pap_name ||
                        row.mfo_name ||
                        row.object_expenditure_name ||
                        "—"}
                    </td>
                    <td className="p-3 text-right font-semibold">
                      {money(row.approved_budget)}
                    </td>
                    <td className="p-3 text-right">
                      {money(row.ps_amount)}
                    </td>
                    <td className="p-3 text-right">
                      {money(row.mooe_amount)}
                    </td>
                    <td className="p-3 text-right">
                      {money(row.co_amount)}
                    </td>
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

function DepartmentMonitoringTable({ departments }) {
  const totalBudget = departments.reduce(
    (sum, row) => sum + numberValue(row.approved_budget),
    0
  );
  const totalUtilized = departments.reduce(
    (sum, row) => sum + numberValue(row.utilized),
    0
  );
  const totalDisbursed = departments.reduce(
    (sum, row) => sum + numberValue(row.disbursed),
    0
  );
  const totalRemaining = totalBudget - totalUtilized;
  const totalRate = percent(totalUtilized, totalBudget);

  return (
    <Panel
      title="Department Budget Monitoring"
      subtitle="Approved budget and actual RBUD utilization by responsibility center."
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
        <MiniMetric label="Total Budget" value={money(totalBudget)} />
        <MiniMetric
          label="Total Utilized"
          value={money(totalUtilized)}
        />
        <MiniMetric
          label="Total Disbursed"
          value={money(totalDisbursed)}
        />
        <MiniMetric
          label="Remaining Balance"
          value={money(totalRemaining)}
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-[10px]">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="p-3 text-left">Department / Office</th>
              <th className="p-3 text-left">Code</th>
              <th className="p-3 text-right">Budget Given</th>
              <th className="p-3 text-right">Utilized</th>
              <th className="p-3 text-right">Disbursed</th>
              <th className="p-3 text-right">Remaining</th>
              <th className="p-3 text-right">Utilization</th>
            </tr>
          </thead>

          <tbody>
            {departments.map((row) => {
              const budget = numberValue(row.approved_budget);
              const utilized = numberValue(row.utilized);
              const disbursed = numberValue(row.disbursed);
              const remaining = budget - utilized;
              const rate = percent(utilized, budget);

              return (
                <tr key={row.id} className="border-b border-gray-50">
                  <td className="p-3">
                    <div className="font-semibold text-gray-800">
                      {row.name || "—"}
                    </div>
                    {row.description && (
                      <div className="text-[9px] text-gray-400 mt-0.5">
                        {row.description}
                      </div>
                    )}
                  </td>

                  <td className="p-3 font-semibold text-[#211b79]">
                    {row.code || "—"}
                  </td>

                  <td className="p-3 text-right font-semibold">
                    {money(budget)}
                  </td>

                  <td className="p-3 text-right">
                    {money(utilized)}
                  </td>

                  <td className="p-3 text-right">
                    {money(disbursed)}
                  </td>

                  <td
                    className={`p-3 text-right font-semibold ${
                      remaining < 0 ? "text-red-600" : "text-gray-800"
                    }`}
                  >
                    {money(remaining)}
                  </td>

                  <td className="p-3 text-right">
                    <div className="font-semibold">
                      {rate.toFixed(2)}%
                    </div>
                    <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#211b79] rounded-full"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(0, rate)
                          )}%`,
                        }}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}

            {!departments.length && (
              <tr>
                <td
                  colSpan={7}
                  className="p-10 text-center text-gray-400"
                >
                  No department budget or utilization records found for
                  the selected fiscal year and fund group.
                </td>
              </tr>
            )}

            {!!departments.length && (
              <tr className="bg-gray-50 font-bold">
                <td className="p-3" colSpan={2}>
                  TOTAL
                </td>
                <td className="p-3 text-right">
                  {money(totalBudget)}
                </td>
                <td className="p-3 text-right">
                  {money(totalUtilized)}
                </td>
                <td className="p-3 text-right">
                  {money(totalDisbursed)}
                </td>
                <td className="p-3 text-right">
                  {money(totalRemaining)}
                </td>
                <td className="p-3 text-right">
                  {totalRate.toFixed(2)}%
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-3 text-[9px] text-gray-400">
        Budget is based on approved budget items. Utilization and
        disbursement are based on existing RBUD registry records.
      </div>
    </Panel>
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
  tab,
  setTab,
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
      <TabBar
        tabs={["Transaction List", "Add Transaction", "Transaction History"]}
        value={tab}
        onChange={(nextTab) => {
          setTab(nextTab);
          if (nextTab === "Add Transaction") onAdd();
        }}
      />
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
      <table className={`w-full ${compact ? "min-w-[1050px]" : "min-w-[1250px]"} text-[10px]`}>
        <thead className="bg-gray-50 text-gray-500">
          <tr>
            <th className="p-3 text-left">Registry No.</th>
            <th className="p-3 text-left">Date</th>
            <th className="p-3 text-left">Fund</th>
            <th className="p-3 text-left">Department / Responsibility Center</th>
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
                  <div className="text-[9px] text-gray-400">{row.fund_source_name || row.fund_source_code || ""}</div>
                </td>
                <td className="p-3 min-w-[210px]">
                  <b>{row.responsibility_center_code || "—"}</b>
                  <div className="text-gray-400">{row.responsibility_center_name || row.department_name || "—"}</div>
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
   MONITORING
============================================================ */

function MonitoringView({
  data,
  departments,
  monitoringTab,
  setMonitoringTab,
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
  const fundBalances = data.fund_balances || [];

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
        tabs={["Overall", "By Fund", "By Department", "By Budget Class"]}
        value={monitoringTab}
        onChange={setMonitoringTab}
      />

      {monitoringTab === "Overall" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3 mb-4">
            <Kpi title="Approved Budget" value={money(summary.approved_budget)} icon={Wallet} tone="blue" />
            <Kpi title="Utilized / Obligated" value={money(summary.obligations)} icon={FileCheck2} tone="green" />
            <Kpi title="Disbursed" value={money(summary.disbursements)} icon={CreditCard} tone="orange" />
            <Kpi title="Remaining Balance" value={money(summary.remaining_balance)} icon={CircleDollarSign} tone="purple" />
            <Kpi title="Utilization Rate" value={`${numberValue(summary.utilization_rate).toFixed(2)}%`} icon={TrendingUp} tone="teal" />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <Panel title="Budget Monitoring Summary" subtitle="Approved budget, utilization, disbursement, and remaining balance.">
              <div className="grid grid-cols-2 gap-3">
                <DetailBox label="Approved Budget" value={money(summary.approved_budget)} />
                <DetailBox label="Utilized / Obligated" value={money(summary.obligations)} />
                <DetailBox label="Disbursed" value={money(summary.disbursements)} />
                <DetailBox label="Remaining Balance" value={money(summary.remaining_balance)} />
                <DetailBox label="Unpaid Obligation" value={money(summary.unpaid_obligation)} />
                <DetailBox label="Disbursement Rate" value={`${numberValue(summary.disbursement_rate).toFixed(2)}%`} />
              </div>
            </Panel>

            <Panel title="Budget Class Summary" subtitle="Approved budget versus actual utilization.">
              <div className="overflow-x-auto">
                <table className="w-full text-[10px]">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-500">
                      <th className="p-3 text-left">Class</th>
                      <th className="p-3 text-right">Approved</th>
                      <th className="p-3 text-right">Utilized</th>
                    </tr>
                  </thead>
                  <tbody>
                    {["PS", "MOOE", "CO"].map((code) => (
                      <tr key={code} className="border-b border-gray-50">
                        <td className="p-3 font-semibold">{code}</td>
                        <td className="p-3 text-right">{money(budgetClass[code.toLowerCase()])}</td>
                        <td className="p-3 text-right">{money(utilizedClass[code.toLowerCase()])}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>
        </>
      )}

      {monitoringTab === "By Fund" && (
        <Panel title="Fund Monitoring" subtitle="Budget, utilization, disbursement, and remaining balance by fund.">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-[10px]">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="p-3 text-left">Fund</th>
                  <th className="p-3 text-left">Fund Group</th>
                  <th className="p-3 text-right">Approved Budget</th>
                  <th className="p-3 text-right">Utilized</th>
                  <th className="p-3 text-right">Disbursed</th>
                  <th className="p-3 text-right">Remaining</th>
                  <th className="p-3 text-center">Utilization</th>
                </tr>
              </thead>
              <tbody>
                {fundBalances.map((row) => (
                  <tr key={row.id} className="border-b border-gray-50">
                    <td className="p-3"><b>{row.code || "—"}</b><div className="text-gray-400">{row.name || "—"}</div></td>
                    <td className="p-3">{row.fund_group || "—"}</td>
                    <td className="p-3 text-right">{money(row.approved_budget)}</td>
                    <td className="p-3 text-right">{money(row.utilized)}</td>
                    <td className="p-3 text-right">{money(row.disbursed)}</td>
                    <td className="p-3 text-right">{money(row.unutilized_budget)}</td>
                    <td className="p-3 text-center">{numberValue(row.utilization_rate).toFixed(2)}%</td>
                  </tr>
                ))}
                {!fundBalances.length && <EmptyRow colSpan={7} />}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {monitoringTab === "By Department" && (
        <DepartmentMonitoringTable departments={departments} />
      )}

      {monitoringTab === "By Budget Class" && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <Panel title="Approved Budget by Class" subtitle="Approved budget allocation for PS, MOOE, and CO.">
            <ClassTable
              rows={[
                ["PS", "Personnel Services", budgetClass.ps],
                ["MOOE", "Maintenance and Other Operating Expenses", budgetClass.mooe],
                ["CO", "Capital Outlay", budgetClass.co],
              ]}
            />
          </Panel>
          <Panel title="Utilization by Class" subtitle="Actual RBUD utilization / obligations.">
            <ClassTable
              rows={[
                ["PS", "Personnel Services", utilizedClass.ps],
                ["MOOE", "Maintenance and Other Operating Expenses", utilizedClass.mooe],
                ["CO", "Capital Outlay", utilizedClass.co],
              ]}
            />
          </Panel>
        </div>
      )}
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
  tab,
  setTab,
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
      <TabBar
        tabs={["By Fund / Project", "Budget", "Utilization", "Disbursement"]}
        value={tab}
        onChange={setTab}
      />
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

          <Panel title="Fund / Project Breakdown" subtitle={`Current view: ${tab}`}>
            <ClassBreakdownTable rows={data.classes || []} mode={tab} />
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
  reportChoice,
  setReportChoice,
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
            value={reportChoice}
            onChange={setReportChoice}
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
              <h3 className="text-base font-bold text-[#17135f] mt-1">{reportChoice}</h3>
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

function ConfirmModal({ title, message, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-[140] bg-black/40 flex items-center justify-center p-5">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#17135f]">{title}</h2>
          <button type="button" onClick={onCancel} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5">
          <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-3">
            <Trash2 className="w-5 h-5" />
          </div>
          <p className="text-xs text-gray-600 leading-5">{message}</p>
          <div className="flex justify-end gap-2 mt-5">
            <button type="button" onClick={onCancel} className="h-9 px-4 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700">Cancel</button>
            <button type="button" onClick={onConfirm} className="h-9 px-4 rounded-lg bg-red-600 text-white text-xs font-semibold">Delete Transaction</button>
          </div>
        </div>
      </div>
    </div>
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

function ClassBreakdownTable({ rows, mode = "By Fund / Project" }) {
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