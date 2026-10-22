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

const YEARS = Array.from({ length: 6 }, (_, index) => new Date().getFullYear() - index);

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
    id: "fundRegistries",
    number: "3",
    title: "Fund Registries",
    description: "View the registered funds and open the detailed fund and project breakdown.",
    icon: Folder,
    tone: "purple",
    tabs: ["Fund Groups", "Registered Funds"],
  },
  {
    id: "transactions",
    number: "4",
    title: "Transactions",
    description: "Enter and manage the actual RBUD transactions using the RBUD registry fields.",
    icon: ClipboardList,
    tone: "orange",
    tabs: ["Transaction List", "Add Transaction", "Transaction History"],
  },
  {
    id: "monitoring",
    number: "5",
    title: "Budget Utilization & Balance",
    description: "Monitor utilization, disbursement, unpaid utilization, and remaining budget by fund and class.",
    icon: TrendingUp,
    tone: "teal",
    tabs: ["Summary", "WFP Balance", "Utilization Details"],
  },
  {
    id: "breakdown",
    number: "6",
    title: "Fund / Project Breakdown",
    description: "View the detailed budget, utilization, and disbursement breakdown of each fund or project.",
    icon: Landmark,
    tone: "yellow",
    tabs: ["By Fund / Project", "Budget", "Utilization", "Disbursement"],
  },
  {
    id: "feeMonitoring",
    number: "7",
    title: "Fee Monitoring",
    description: "Track fee billing, collections, uncollected amounts, obligations, disbursements, and balances by campus.",
    icon: CircleDollarSign,
    tone: "blue",
    tabs: ["Fee Monitoring", "Add Fee Record", "Fee Transactions"],
  },
  {
    id: "reports",
    number: "8",
    title: "Reports & Export",
    description: "Generate FAR reports, RBUD reports, and export or print the selected records.",
    icon: FileText,
    tone: "red",
    tabs: ["Financial Reports", "Export", "Print"],
  },
];


/*
 * Resolve an RBUD master-data ID for edit mode.
 * Some older RBUD rows may have a missing/legacy FK ID while still carrying
 * the joined code/name returned by GET /rbud/:id.  We use the FK first,
 * then safely fall back to matching code/name/account title.
 */
const normalizeReferenceValue = (value) =>
  String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

const resolveReferenceId = (items = [], rawId, ...candidateValues) => {
  const idText =
    rawId !== null && rawId !== undefined && rawId !== ""
      ? String(rawId)
      : "";

  if (
    idText &&
    items.some((item) => String(item?.id ?? "") === idText)
  ) {
    return idText;
  }

  const candidates = candidateValues
    .map(normalizeReferenceValue)
    .filter(Boolean);

  if (!candidates.length) return idText;

  const matched = items.find((item) => {
    const values = [
      item?.code,
      item?.name,
      item?.account_title,
      item?.title,
      item?.description,
    ]
      .map(normalizeReferenceValue)
      .filter(Boolean);

    return values.some((value) => candidates.includes(value));
  });

  return matched ? String(matched.id) : idText;
};

const addMissingReferenceOption = (
  items = [],
  rawId,
  code,
  name,
  extra = {}
) => {
  const idText =
    rawId !== null && rawId !== undefined && rawId !== ""
      ? String(rawId)
      : "";

  if (!idText) return items;

  if (items.some((item) => String(item?.id ?? "") === idText)) {
    return items;
  }

  if (!code && !name && !extra.account_title) return items;

  return [
    ...items,
    {
      id: rawId,
      code: code || "",
      name: name || extra.account_title || "",
      ...extra,
    },
  ];
};

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

const normalizeRbudRole = (value) => {
  const raw = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ");

  if (["administration", "administrator", "admin", "system administrator"].includes(raw)) {
    return "Administration";
  }
  if (["budget", "budget officer"].includes(raw)) {
    return "Budget";
  }
  return "";
};

const getStoredRbudRole = () => {
  try {
    const stored = localStorage.getItem("user");
    if (!stored) return "";
    const parsed = JSON.parse(stored);
    return parsed?.role || "";
  } catch {
    return "";
  }
};

const initialForm = (year) => ({
  entry_date: "",
  fiscal_year: Number(year),
  fund_cluster_id: "",
  fund_source_id: "",
  campus_id: "",
  fund_code: "",
  serial_no_transferred: "",
  payee: "",
  particulars: "",
  responsibility_center_id: "",
  pap_id: "",
  uacs_code_id: "",
  ref_no: "",
  allotment_class_id: "",
  mfo_id: "",
  utilization_amount: "",
  ps_utilization: "",
  mooe_utilization: "",
  co_utilization: "",
  disbursement_amount: "",
  wfp_source_id: "",
  unpaid_utilization: "",
  remarks: "",
});

const RBUD_FORM_FIELDS = [
  "entry_date",
  "fiscal_year",
  "fund_cluster_id",
  "fund_source_id",
  "campus_id",
  "fund_code",
  "serial_no_transferred",
  "payee",
  "particulars",
  "responsibility_center_id",
  "pap_id",
  "uacs_code_id",
  "ref_no",
  "allotment_class_id",
  "mfo_id",
  "utilization_amount",
  "ps_utilization",
  "mooe_utilization",
  "co_utilization",
  "disbursement_amount",
  "wfp_source_id",
  "remarks",
];

const buildRbudPayload = (source) =>
  RBUD_FORM_FIELDS.reduce((payload, field) => {
    payload[field] = source?.[field] ?? "";
    return payload;
  }, {});

const RBUD_BUDGET_FIELDS = [
  "entry_date",
  "fiscal_year",
  "fund_cluster_id",
  "fund_source_id",
  "campus_id",
  "fund_code",
  "serial_no_transferred",
  "payee",
  "particulars",
  "responsibility_center_id",
  "pap_id",
  "uacs_code_id",
  "ref_no",
  "allotment_class_id",
  "mfo_id",
  "utilization_amount",
  "ps_utilization",
  "mooe_utilization",
  "co_utilization",
  "wfp_source_id",
  "remarks",
];

const RBUD_EDITABLE_FIELDS = {
  Administration: [...RBUD_FORM_FIELDS],
  Budget: RBUD_BUDGET_FIELDS,
};

const getRbudEditableFields = (role) =>
  new Set(RBUD_EDITABLE_FIELDS[role] || []);

const canEditRbudRole = (role) =>
  ["Administration", "Budget"].includes(role);

const canCreateRbudRole = (role) =>
  ["Administration", "Budget"].includes(role);

export default function RbudFundRegistry({
  user,
  onLogout,
  onNavigate,
  activePath = "/rbud",
}) {
  const token = localStorage.getItem("token");
  const role = normalizeRbudRole(
    user?.role || getStoredRbudRole()
  );
  const canViewRbud = ["Administration", "Budget"].includes(role);
  // Fee Monitoring is available only to Administration and Budget.
  const canViewFeeMonitoring = ["Administration", "Budget"].includes(role);
  const canCreateRbud = canCreateRbudRole(role);
  const canEditRbud = canEditRbudRole(role);
  const canDeleteRbud = role === "Administration";

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
    fund_codes: [],
    campuses: [],
    responsibility_centers: [],
    pap: [],
    mfo: [],
    uacs_codes: [],
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
  const [reportChoice, setReportChoice] = useState("FAR 2");
  const [feeRows, setFeeRows] = useState([]);
  const [feeEnrollmentRows, setFeeEnrollmentRows] = useState([]);
  const [feeBudgetReferences, setFeeBudgetReferences] = useState([]);
  const [enrollmentForm, setEnrollmentForm] = useState({ campus: "", billing_period: "2nd Sem AY 2025–2026", enrollee_count: "0" });
  const [budgetReferenceForm, setBudgetReferenceForm] = useState({ campus: "", fee_category: "Non-Fiduciary Fees", particulars: "", source_reference: "WFP PRE sheet", budget_amount: "0" });
  const [feeCampusOptions, setFeeCampusOptions] = useState([]);
  const [feeLoading, setFeeLoading] = useState(false);
  const [feeError, setFeeError] = useState("");
  const [feeForm, setFeeForm] = useState({ fiscal_year: "2026", fee_category: "Non-Fiduciary Fees", particulars: "", campus: "La Paz", billing_amount: "0", collected_amount: "0", obligated_amount: "0", disbursed_amount: "0", billing_period: "", reference_no: "", remarks: "" });
  const [feeEditingId, setFeeEditingId] = useState(null);
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

  const loadFeeCampuses = useCallback(async () => {
    try {
      const data = await query("/masterdata/others?type=campuses&limit=1000");
      const activeCampuses = (data.items || [])
        .filter((item) => item.is_active !== false && String(item.status || "Active").toLowerCase() !== "inactive")
        .map((item) => String(item.name || "").trim())
        .filter(Boolean);
      setFeeCampusOptions(activeCampuses);
      setEnrollmentForm((old) => ({ ...old, campus: activeCampuses.includes(old.campus) ? old.campus : (activeCampuses[0] || "") }));
      setBudgetReferenceForm((old) => ({ ...old, campus: activeCampuses.includes(old.campus) ? old.campus : (activeCampuses[0] || "") }));
      setFeeForm((old) => ({
        ...old,
        campus: activeCampuses.includes(old.campus) ? old.campus : (activeCampuses[0] || ""),
      }));
    } catch (error) {
      setFeeError(`Unable to load campuses from Master Data: ${error.message || "Request failed."}`);
    }
  }, [query]);

  useEffect(() => { loadFeeCampuses(); }, [loadFeeCampuses]);

  const loadFeeRows = useCallback(async () => {
    setFeeLoading(true); setFeeError("");
    try { const data = await query(`/rbud/fees?year=${encodeURIComponent(selectedFiscalYear)}`); setFeeRows(data.rows || []); }
    catch (error) { setFeeError(error.message || "Unable to load fee records."); }
    finally { setFeeLoading(false); }
  }, [query, selectedFiscalYear]);

  const loadFeePlanningData = useCallback(async () => {
    try {
      const [enrollmentData, budgetData] = await Promise.all([
        query(`/rbud/fee-enrollment?year=${encodeURIComponent(selectedFiscalYear)}`),
        query(`/rbud/fee-budget-reference?year=${encodeURIComponent(selectedFiscalYear)}`),
      ]);
      setFeeEnrollmentRows(enrollmentData.rows || []);
      setFeeBudgetReferences(budgetData.rows || []);
    } catch (error) {
      setFeeError(error.message || "Unable to load enrollment and WFP reference data.");
    }
  }, [query, selectedFiscalYear]);

  const saveFeeEnrollment = async (event) => {
    event.preventDefault();
    setFeeError("");
    try {
      await query("/rbud/fee-enrollment", {
        method: "POST",
        body: JSON.stringify({ fiscal_year: Number(selectedFiscalYear), ...enrollmentForm, enrollee_count: Number(enrollmentForm.enrollee_count || 0) }),
      });
      await loadFeePlanningData();
      showToast("Enrollment count saved.");
    } catch (error) { setFeeError(error.message || "Unable to save enrollment count."); }
  };

  const saveFeeBudgetReference = async (event) => {
    event.preventDefault();
    setFeeError("");
    try {
      await query("/rbud/fee-budget-reference", {
        method: "POST",
        body: JSON.stringify({ fiscal_year: Number(selectedFiscalYear), ...budgetReferenceForm, budget_amount: Number(budgetReferenceForm.budget_amount || 0) }),
      });
      setBudgetReferenceForm((old) => ({ ...old, particulars: "", budget_amount: "0" }));
      await loadFeePlanningData();
      showToast("WFP budget reference saved.");
    } catch (error) { setFeeError(error.message || "Unable to save WFP budget reference."); }
  };

  const saveFeeRecord = async (event) => {
    event.preventDefault(); setFeeError("");
    const payload = { ...feeForm, fiscal_year: Number(feeForm.fiscal_year), billing_amount: Number(feeForm.billing_amount || 0), collected_amount: Number(feeForm.collected_amount || 0), obligated_amount: Number(feeForm.obligated_amount || 0), disbursed_amount: Number(feeForm.disbursed_amount || 0) };
    try {
      await query(feeEditingId ? `/rbud/fees/${feeEditingId}` : "/rbud/fees", { method: feeEditingId ? "PUT" : "POST", body: JSON.stringify(payload) });
      setFeeForm({ ...payload, particulars: "", billing_amount: "0", collected_amount: "0", obligated_amount: "0", disbursed_amount: "0", billing_period: "", reference_no: "", remarks: "" }); setFeeEditingId(null); await loadFeeRows(); showToast("Fee record saved successfully.");
    } catch (error) { setFeeError(error.message || "Unable to save fee record."); }
  };

  const editFeeRecord = (row) => { setFeeEditingId(row.id); setFeeForm({ ...row, billing_amount: String(row.billing_amount ?? 0), collected_amount: String(row.collected_amount ?? 0), obligated_amount: String(row.obligated_amount ?? 0), disbursed_amount: String(row.disbursed_amount ?? 0) }); window.scrollTo({ top: 0, behavior: "smooth" }); };

  const deleteFeeRecord = async (row) => {
    if (role !== "Administration") {
      setFeeError("Only the Administrator can delete Fee Monitoring records.");
      return;
    }
    const confirmed = window.confirm(`Delete the Fee Monitoring record for "${row.particulars}" (${row.campus}, FY ${row.fiscal_year})? This action cannot be undone.`);
    if (!confirmed) return;
    setFeeError("");
    try {
      await query(`/rbud/fees/${row.id}`, { method: "DELETE" });
      if (String(feeEditingId) === String(row.id)) {
        setFeeEditingId(null);
        setFeeForm({ fiscal_year: String(selectedFiscalYear), fee_category: "Non-Fiduciary Fees", particulars: "", campus: feeCampusOptions[0] || "", billing_amount: "0", collected_amount: "0", obligated_amount: "0", disbursed_amount: "0", billing_period: "", reference_no: "", remarks: "" });
      }
      await loadFeeRows();
      showToast("Fee Monitoring record deleted.");
    } catch (error) {
      setFeeError(error.message || "Unable to delete fee record.");
    }
  };

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
        fund_codes: data.fund_codes || data.fundCodes || [],
        campuses: data.campuses || [],
        responsibility_centers:
          data.responsibility_centers || data.responsibilityCenters || [],
        pap: data.pap || data.paps || [],
        mfo: data.mfo || data.mfoList || [],
        uacs_codes: data.uacs_codes || data.uacsCodes || [],
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
        params.set("limit", "30");
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
    if (nextView === "feeMonitoring" && !canViewFeeMonitoring) {
      setError("Fee Monitoring is restricted to Administrator and Budget roles.");
      return;
    }
    setError("");
    setView(nextView);
    setReportPreview(false);
    if (nextView === "feeMonitoring" || nextView === "reports") { loadFeeRows(); loadFeePlanningData(); }

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
    if (nextView === "fundRegistries" && initialTab) {
      setFundGroupTab(initialTab === "Registered Funds" ? selectedGroup : initialTab);
    }
    if (nextView === "breakdown" && initialTab) {
      setBreakdownTab(initialTab);
    }
    if (nextView === "reports" && initialTab) {
      setReportChoice(
        initialTab === "Financial Reports"
          ? "FAR 2"
          : initialTab === "Export"
            ? "RBUD Registry"
            : initialTab === "Print"
              ? "RBUD Registry"
              : "FAR 2"
      );
      if (initialTab === "Print") setReportPreview(true);
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

  const openFundBreakdown = (fundId) => {
    setSelectedBreakdownFund(String(fundId || ""));
    setBreakdownTab("By Fund / Project");
    setView("breakdown");
    setError("");
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
    if (!canCreateRbud) return;
    setForm(initialForm(selectedFiscalYear));
    setSelectedRecord(null);
    setRecordModal("add");
  };

  const openEditRecord = async (record) => {
    if (!canEditRbud) return;
    try {
      // Always load the complete database record before editing.
      // The transaction list is a joined/derived row and may not contain every
      // field required by the PUT request.
      const fresh = await query(`/rbud/${record.id}`);

      // Keep the dropdowns populated even for older RBUD rows whose FK is
      // missing/legacy, but whose joined code/name is still available.
      const resolvedFundClusterId = resolveReferenceId(
        references.fund_clusters,
        fresh.fund_cluster_id,
        fresh.fund_cluster_code,
        fresh.fund_cluster_name
      );
      const resolvedFundSourceId = resolveReferenceId(
        references.fund_sources,
        fresh.fund_source_id,
        fresh.fund_source_code,
        fresh.fund_source_name
      );
      const resolvedCampusId = resolveReferenceId(
        references.campuses,
        fresh.campus_id,
        fresh.campus_code,
        fresh.campus_name
      );
      const resolvedResponsibilityCenterId = resolveReferenceId(
        references.responsibility_centers,
        fresh.responsibility_center_id,
        fresh.responsibility_center_code,
        fresh.responsibility_center_name
      );
      const resolvedPapId = resolveReferenceId(
        references.pap,
        fresh.pap_id,
        fresh.pap_code,
        fresh.pap_name
      );
      const resolvedUacsId = resolveReferenceId(
        references.uacs_codes,
        fresh.uacs_code_id,
        fresh.uacs_code,
        fresh.account_title
      );
      const resolvedAllotmentClassId = resolveReferenceId(
        references.allotment_classes,
        fresh.allotment_class_id,
        fresh.allotment_class_code,
        fresh.allotment_class_name
      );
      const resolvedMfoId = resolveReferenceId(
        references.mfo,
        fresh.mfo_id,
        fresh.mfo_code,
        fresh.mfo_name
      );
      const resolvedWfpSourceId = resolveReferenceId(
        references.wfp_sources,
        fresh.wfp_source_id,
        fresh.wfp_source_code,
        fresh.wfp_source_name
      );

      // If a referenced master row is not currently in the reference payload,
      // temporarily include the existing joined value so the current value
      // remains visible/selectable during edit.
      setReferences((current) => ({
        ...current,
        fund_clusters: addMissingReferenceOption(
          current.fund_clusters,
          fresh.fund_cluster_id,
          fresh.fund_cluster_code,
          fresh.fund_cluster_name
        ),
        fund_sources: addMissingReferenceOption(
          current.fund_sources,
          fresh.fund_source_id,
          fresh.fund_source_code,
          fresh.fund_source_name
        ),
        campuses: addMissingReferenceOption(
          current.campuses,
          fresh.campus_id,
          fresh.campus_code,
          fresh.campus_name
        ),
        responsibility_centers: addMissingReferenceOption(
          current.responsibility_centers,
          fresh.responsibility_center_id,
          fresh.responsibility_center_code,
          fresh.responsibility_center_name
        ),
        pap: addMissingReferenceOption(
          current.pap,
          fresh.pap_id,
          fresh.pap_code,
          fresh.pap_name
        ),
        uacs_codes: addMissingReferenceOption(
          current.uacs_codes,
          fresh.uacs_code_id,
          fresh.uacs_code,
          fresh.account_title,
          { account_title: fresh.account_title || "" }
        ),
        allotment_classes: addMissingReferenceOption(
          current.allotment_classes,
          fresh.allotment_class_id,
          fresh.allotment_class_code,
          fresh.allotment_class_name
        ),
        mfo: addMissingReferenceOption(
          current.mfo,
          fresh.mfo_id,
          fresh.mfo_code,
          fresh.mfo_name
        ),
        wfp_sources: addMissingReferenceOption(
          current.wfp_sources,
          fresh.wfp_source_id,
          fresh.wfp_source_code,
          fresh.wfp_source_name
        ),
      }));

      setSelectedRecord(fresh);
      setForm({
        ...initialForm(selectedFiscalYear),
        entry_date: fresh.entry_date ? String(fresh.entry_date).slice(0, 10) : "",
        fiscal_year: Number(fresh.fiscal_year || selectedFiscalYear),
        fund_cluster_id: resolvedFundClusterId,
        fund_source_id: resolvedFundSourceId,
        campus_id: resolvedCampusId,
        fund_code: fresh.fund_code || "",
        serial_no_transferred: fresh.serial_no_transferred || "",
        payee: fresh.payee || "",
        particulars: fresh.particulars || "",
        responsibility_center_id: resolvedResponsibilityCenterId,
        pap_id: resolvedPapId,
        uacs_code_id: resolvedUacsId,
        ref_no: fresh.ref_no || "",
        allotment_class_id: resolvedAllotmentClassId,
        mfo_id: resolvedMfoId,
        utilization_amount: fresh.utilization_amount ?? "",
        ps_utilization: fresh.ps_utilization ?? "",
        mooe_utilization: fresh.mooe_utilization ?? "",
        co_utilization: fresh.co_utilization ?? "",
        disbursement_amount: fresh.disbursement_amount ?? "",
        wfp_source_id: resolvedWfpSourceId,
        unpaid_utilization: fresh.unpaid_utilization ?? "",
        remarks: fresh.remarks || "",
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

    if (recordModal === "add" && !canCreateRbud) {
      setError("Your role is not allowed to create RBUD transactions.");
      return;
    }

    if (recordModal === "edit" && !canEditRbud) {
      setError("Your role is not allowed to edit RBUD transactions.");
      return;
    }

    if (!String(form.entry_date ?? "").trim()) {
      setError("Entry Date is required.");
      return;
    }

    const requiredReferenceFields = [
      ["Fund Code", form.fund_code],
      ["Fund 164 Cluster", form.fund_cluster_id],
      ["Fund Source", form.fund_source_id],
      ["Campus", form.campus_id],
      ["Responsibility Center", form.responsibility_center_id],
      ["PAP / Program", form.pap_id],
      ["UACS Code", form.uacs_code_id],
      ["MFO", form.mfo_id],
      ["Allotment Class", form.allotment_class_id],
      ["WFP Source", form.wfp_source_id],
    ];

    const missingReference = requiredReferenceFields.find(
      ([, value]) => String(value ?? "").trim() === ""
    );

    if (missingReference) {
      setError(`${missingReference[0]} is required. Please select a valid master-data option.`);
      return;
    }

    try {
      const isEdit = recordModal === "edit";
      const path = isEdit
        ? `/rbud/${selectedRecord.id}`
        : "/rbud";
      const data = await query(path, {
        method: isEdit ? "PUT" : "POST",
        body: JSON.stringify(buildRbudPayload(form)),
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
    if (!canDeleteRbud) return;
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

    const reportDefinitions = {
      "FAR 2": {
        headers: ["Fund / Cluster","Campus","Allotment Class","Utilization","PS","MOOE","CO","Disbursement","Unpaid","Balance"],
        map: (row) => [
          row.fund_cluster_code || row.fund_cluster_name,
          row.campus_name,
          row.allotment_class_code || row.allotment_class_name,
          row.utilization_amount,
          row.ps_utilization,
          row.mooe_utilization,
          row.co_utilization,
          row.disbursement_amount,
          row.unpaid_utilization,
          row.running_balance ?? row.available_balance ?? row.remaining_balance,
        ],
      },
      "FAR 2A": {
        headers: ["PAP / Program","Utilization","PS","MOOE","CO","Disbursement","Unpaid"],
        map: (row) => [
          row.pap_name,
          row.utilization_amount,
          row.ps_utilization,
          row.mooe_utilization,
          row.co_utilization,
          row.disbursement_amount,
          row.unpaid_utilization,
        ],
      },
      "FAR 2A 2A": {
        headers: ["Registry No.","Date","Payee / Name","Particulars / Description","PAP","UACS Code","Ref. No.","Utilization","PS","MOOE","CO","Disbursement","Unpaid","Balance"],
        map: (row) => [
          row.registry_no,dateLabel(row.entry_date),row.payee,row.particulars,row.pap_name,row.uacs_code,row.ref_no,
          row.utilization_amount,row.ps_utilization,row.mooe_utilization,row.co_utilization,row.disbursement_amount,
          row.unpaid_utilization,row.running_balance ?? row.available_balance ?? row.remaining_balance,
        ],
      },
      "RBUD Registry": {
        headers: RBUD_FULL_REPORT_HEADERS,
        map: (row) => fullRbudReportValues(row),
      },
      "WFP Monitoring Report": {
        headers: ["WFP Source","PAP / Program","Fund","Registry No.","Utilization","Disbursement","Balance","Status","Remarks"],
        map: (row) => [
          row.wfp_source_name || row.wfp_source_code,row.pap_name,row.fund_code || row.fund_cluster_name,row.registry_no,
          row.utilization_amount,row.disbursement_amount,row.running_balance ?? row.available_balance ?? row.remaining_balance,row.status,row.remarks
        ],
      },
      "Financial Summary": {
        headers: ["Registry No.","Status","Utilization","Disbursement","Unpaid Utilization"],
        map: (row) => [row.registry_no,row.status,row.utilization_amount,row.disbursement_amount,row.unpaid_utilization],
      },
      "Fund / Project Breakdown": {
        headers: ["Fund / Cluster","PAP / Project","Registry No.","Utilization","Disbursement","Unpaid","Balance"],
        map: (row) => [
          row.fund_cluster_code || row.fund_cluster_name || row.fund_code,row.pap_name,row.registry_no,
          row.utilization_amount,row.disbursement_amount,row.unpaid_utilization,row.running_balance ?? row.available_balance ?? row.remaining_balance
        ],
      },
    };

    const definition = reportDefinitions[reportChoice] || reportDefinitions["RBUD Registry"];
    const lines = [
      definition.headers,
      ...rows.map(definition.map),
    ];

    const csv = lines
      .map((row) => row.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${reportChoice.replaceAll(" ", "-").replaceAll("/", "-")}-${selectedGroup}-${selectedFiscalYear}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast(`${reportChoice} CSV exported.`);
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
            modules={MODULES.filter((item) => item.id !== "feeMonitoring" || canViewFeeMonitoring)}
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
            canCreate={canCreateRbud}
            canEdit={canEditRbud}
            canDelete={canDeleteRbud}
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

            {view === "fundRegistries" && (
              <FundRegistriesView
                references={references}
                selectedGroup={selectedGroup}
                setSelectedGroup={handleGroupClick}
                selectedFunds={selectedGroupFunds}
                onOpenBreakdown={openFundBreakdown}
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
                canCreate={canCreateRbud}
                canEdit={canEditRbud}
                canDelete={canDeleteRbud}
              />
            )}

            {view === "monitoring" && (
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
                tab={breakdownTab}
                setTab={setBreakdownTab}
                references={references}
                selectedFund={selectedBreakdownFund}
                setSelectedFund={setSelectedBreakdownFund}
                onLoad={() => loadBreakdown(selectedBreakdownFund)}
                group={selectedGroup}
                year={selectedFiscalYear}
              />
            )}

            {view === "reports" && (
              <ReportsExportView
                entries={entries}
                feeRows={feeRows}
                enrollmentRows={feeEnrollmentRows}
                budgetReferences={feeBudgetReferences}
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

            {view === "feeMonitoring" && canViewFeeMonitoring && (
              <FeeMonitoringView
                year={selectedFiscalYear}
                rows={feeRows}
                loading={feeLoading}
                error={feeError}
                form={feeForm}
                setForm={setFeeForm}
                campusOptions={feeCampusOptions}
                editingId={feeEditingId}
                role={role}
                onDelete={deleteFeeRecord}
                onSubmit={saveFeeRecord}
                onEdit={editFeeRecord}
                onCancelEdit={() => { setFeeEditingId(null); setFeeForm({ ...feeForm, particulars: "", reference_no: "", remarks: "" }); }}
                onRefresh={() => { loadFeeRows(); loadFeePlanningData(); }}
                enrollmentRows={feeEnrollmentRows}
                budgetReferences={feeBudgetReferences}
                enrollmentForm={enrollmentForm}
                setEnrollmentForm={setEnrollmentForm}
                budgetReferenceForm={budgetReferenceForm}
                setBudgetReferenceForm={setBudgetReferenceForm}
                onSaveEnrollment={saveFeeEnrollment}
                onSaveBudgetReference={saveFeeBudgetReference}
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
            role={role}
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
   FEE MONITORING
============================================================ */
const FEE_PARTICULARS = {
  "Fiduciary Fees": ["Registration Fees", "Laboratory Fee", "Library Fee", "Medical & Dental Fee", "Computer Fee", "Internet Fee", "Student Development Fund", "Athletic Fee", "Cultural Fee", "NSTP", "ID", "Guidance Fee", "School Publication", "Handbook", "Testing Fee", "SCUAA Fee", "Entrance Fee"],
  "Non-Fiduciary Fees": ["Registration Fees", "Laboratory Fee", "Library Fee", "Medical & Dental Fee", "Computer Fee", "Internet Fee", "Student Development Fund", "Athletic Fee", "Cultural Fee", "NSTP", "ID", "Guidance Fee", "School Publication", "Handbook", "Testing Fee", "SCUAA Fee", "Entrance Fee"],
};
const feeMoney = (value) => new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(Number(value || 0));
function FeeMonitoringView({ year, rows, loading, error, form, setForm, campusOptions = [], editingId, role, onDelete, onSubmit, onEdit, onCancelEdit, onRefresh, enrollmentRows = [], budgetReferences = [], enrollmentForm, setEnrollmentForm, budgetReferenceForm, setBudgetReferenceForm, onSaveEnrollment, onSaveBudgetReference }) {
  const totals = (rows || []).reduce((a, r) => ({ billing: a.billing + Number(r.billing_amount || 0), collected: a.collected + Number(r.collected_amount || 0), obligated: a.obligated + Number(r.obligated_amount || 0), disbursed: a.disbursed + Number(r.disbursed_amount || 0) }), { billing: 0, collected: 0, obligated: 0, disbursed: 0 });
  const set = (key, value) => setForm((old) => ({ ...old, [key]: value }));
  const inputClass = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
  const labelClass = "mb-1 block text-xs font-bold text-slate-600";
  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-blue-700">RBUD Registry / Submodule 8</p><h2 className="text-xl font-extrabold text-slate-900">Fee Monitoring — FY {year}</h2><p className="mt-1 text-sm text-slate-500">Billing and collection are tracked separately from obligations and disbursements.</p></div><button type="button" onClick={onRefresh} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">Refresh</button></div>
    {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}<p className="mt-1 text-xs">If a new enrollment/reference table is missing, run the Fee Monitoring planning migration SQL first.</p></div>}
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3"><h3 className="font-extrabold text-slate-900">Enrollment Inputs</h3><p className="text-xs text-slate-500 mt-1">Encode the official enrollee count from the Registrar's enrollment report. BMAS does not guess or calculate enrollee counts from fee amounts.</p></div>
      <form onSubmit={onSaveEnrollment} className="grid grid-cols-1 gap-3 sm:grid-cols-3 items-end">
        <label><span className={labelClass}>Campus *</span><select required className={inputClass} value={enrollmentForm?.campus || ""} onChange={e=>setEnrollmentForm(old=>({...old,campus:e.target.value}))}><option value="">Select campus</option>{campusOptions.map(c=><option key={c}>{c}</option>)}</select></label>
        <label><span className={labelClass}>Semester / Billing Period *</span><input required className={inputClass} value={enrollmentForm?.billing_period || ""} onChange={e=>setEnrollmentForm(old=>({...old,billing_period:e.target.value}))} placeholder="2nd Sem AY 2025–2026" /></label>
        <div className="flex gap-2"><label className="flex-1"><span className={labelClass}>No. of Enrollees *</span><input required min="0" step="1" type="number" className={inputClass} value={enrollmentForm?.enrollee_count ?? "0"} onChange={e=>setEnrollmentForm(old=>({...old,enrollee_count:e.target.value}))}/></label><button type="submit" className="self-end rounded-lg bg-blue-700 px-4 py-2.5 text-xs font-bold text-white">Save Count</button></div>
      </form>
      <div className="mt-3 overflow-x-auto"><table className="w-full text-xs"><thead className="bg-slate-50"><tr>{["Campus","Semester / Period","No. of Enrollees"].map(h=><th key={h} className="px-3 py-2 text-left">{h}</th>)}</tr></thead><tbody>{enrollmentRows.length ? enrollmentRows.map(r=><tr key={r.id} className="border-t"><td className="px-3 py-2">{r.campus}</td><td className="px-3 py-2">{r.billing_period}</td><td className="px-3 py-2 font-bold">{Number(r.enrollee_count||0).toLocaleString()}</td></tr>) : <tr><td colSpan="3" className="px-3 py-4 text-center text-slate-500">No enrollment counts entered for FY {year}.</td></tr>}</tbody></table></div>
    </section>
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3"><h3 className="font-extrabold text-slate-900">WFP Budget Reference</h3><p className="text-xs text-slate-500 mt-1">Encode the approved/projected amount from the WFP PRE sheet. These amounts are references only, not actual billing or collections.</p></div>
      <form onSubmit={onSaveBudgetReference} className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5 items-end">
        <label><span className={labelClass}>Campus *</span><select required className={inputClass} value={budgetReferenceForm?.campus || ""} onChange={e=>setBudgetReferenceForm(old=>({...old,campus:e.target.value}))}><option value="">Select campus</option>{campusOptions.map(c=><option key={c}>{c}</option>)}</select></label>
        <label><span className={labelClass}>Category *</span><select className={inputClass} value={budgetReferenceForm?.fee_category || "Non-Fiduciary Fees"} onChange={e=>setBudgetReferenceForm(old=>({...old,fee_category:e.target.value,particulars:""}))}><option>Fiduciary Fees</option><option>Non-Fiduciary Fees</option></select></label>
        <label><span className={labelClass}>Particular *</span><select required className={inputClass} value={budgetReferenceForm?.particulars || ""} onChange={e=>setBudgetReferenceForm(old=>({...old,particulars:e.target.value}))}><option value="">Select particular</option>{(FEE_PARTICULARS[budgetReferenceForm?.fee_category]||[]).map(x=><option key={x}>{x}</option>)}</select></label>
        <label><span className={labelClass}>WFP Amount (₱) *</span><input required min="0" step="0.01" type="number" className={inputClass} value={budgetReferenceForm?.budget_amount ?? "0"} onChange={e=>setBudgetReferenceForm(old=>({...old,budget_amount:e.target.value}))}/></label>
        <div><span className={labelClass}>Source</span><button type="submit" className="w-full rounded-lg bg-blue-700 px-4 py-2.5 text-xs font-bold text-white">Save Reference</button></div>
        <label className="sm:col-span-2 xl:col-span-5"><span className={labelClass}>Source sheet / note</span><input className={inputClass} value={budgetReferenceForm?.source_reference || "WFP PRE sheet"} onChange={e=>setBudgetReferenceForm(old=>({...old,source_reference:e.target.value}))}/></label>
      </form>
      <div className="mt-3 overflow-x-auto"><table className="w-full text-xs"><thead className="bg-slate-50"><tr>{["Campus","Category","Particular","WFP Amount","Source"].map(h=><th key={h} className="px-3 py-2 text-left">{h}</th>)}</tr></thead><tbody>{budgetReferences.length ? budgetReferences.map(r=><tr key={r.id} className="border-t"><td className="px-3 py-2">{r.campus}</td><td className="px-3 py-2">{r.fee_category}</td><td className="px-3 py-2">{r.particulars}</td><td className="px-3 py-2 font-bold">{feeMoney(r.budget_amount)}</td><td className="px-3 py-2">{r.source_reference || "WFP PRE sheet"}</td></tr>) : <tr><td colSpan="5" className="px-3 py-4 text-center text-slate-500">No WFP reference amounts entered for FY {year}.</td></tr>}</tbody></table></div>
    </section>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">{[["Actual Billing",totals.billing],["Collected",totals.collected],["Uncollected Billing",totals.billing-totals.collected],["Unpaid Obligations",totals.obligated-totals.disbursed]].map(([label,value])=><div key={label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-2 text-lg font-extrabold text-slate-900">{feeMoney(value)}</p></div>)}</div>
    <form onSubmit={onSubmit} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4 flex items-center justify-between"><h3 className="font-extrabold text-slate-900">{editingId ? "Edit Fee Record" : "Add Fee Record"}</h3>{editingId && <button type="button" onClick={onCancelEdit} className="text-xs font-bold text-slate-500">Cancel edit</button>}</div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <label><span className={labelClass}>Fiscal Year *</span><select required className={inputClass} value={form.fiscal_year} onChange={e=>set("fiscal_year",e.target.value)}>{Array.from({length:7},(_,i)=>new Date().getFullYear()-i).map(y=><option key={y}>{y}</option>)}</select></label>
        <label><span className={labelClass}>Fee Category *</span><select required className={inputClass} value={form.fee_category} onChange={e=>setForm(old=>({...old,fee_category:e.target.value,particulars:""}))}><option>Fiduciary Fees</option><option>Non-Fiduciary Fees</option></select></label>
        <label><span className={labelClass}>Particulars *</span><select required className={inputClass} value={form.particulars} onChange={e=>set("particulars",e.target.value)}><option value="">Select particulars</option>{(FEE_PARTICULARS[form.fee_category]||[]).map(x=><option key={x}>{x}</option>)}</select></label>
        <label><span className={labelClass}>Campus *</span><select required className={inputClass} value={form.campus} onChange={e=>set("campus",e.target.value)}><option value="">Select campus</option>{campusOptions.map(x=><option key={x} value={x}>{x}</option>)}</select></label>
        <label><span className={labelClass}>Billing Period</span><input className={inputClass} value={form.billing_period||""} placeholder="e.g. 2nd Sem AY 2025–2026" onChange={e=>set("billing_period",e.target.value)} /></label>
        <label><span className={labelClass}>Reference No.</span><input className={inputClass} value={form.reference_no||""} onChange={e=>set("reference_no",e.target.value)} /></label>
        {[["billing_amount","Actual Billing"],["collected_amount","Collections"],["obligated_amount","Obligations"],["disbursed_amount","Disbursements"]].map(([key,label])=><label key={key}><span className={labelClass}>{label} (₱) *</span><input required min="0" step="0.01" type="number" className={inputClass} value={form[key]??"0"} onChange={e=>set(key,e.target.value)} /></label>)}
        <label className="sm:col-span-2 xl:col-span-4"><span className={labelClass}>Remarks</span><textarea className={inputClass} rows="2" value={form.remarks||""} onChange={e=>set("remarks",e.target.value)} /></label>
      </div><div className="mt-4 flex justify-end"><button className="rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-800" type="submit">{editingId ? "Save Changes" : "Save Fee Record"}</button></div>
    </form>
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-slate-100 px-4 py-3"><h3 className="font-extrabold text-slate-900">Fee Transactions</h3><span className="text-xs text-slate-500">{rows.length} record(s)</span></div><div className="overflow-x-auto"><table className="min-w-[1150px] w-full text-left text-xs"><thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500"><tr>{["Year / Period","Category / Particulars","Campus","Billing","Collected","Uncollected","Obligated","Disbursed","Unpaid Obligation","Actions"].map(h=><th key={h} className="px-3 py-3 font-extrabold">{h}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{loading?<tr><td colSpan="10" className="px-4 py-8 text-center text-slate-500">Loading fee records…</td></tr>:rows.length===0?<tr><td colSpan="10" className="px-4 py-8 text-center text-slate-500">No fee records for this fiscal year yet.</td></tr>:rows.map(r=><tr key={r.id} className="hover:bg-slate-50"><td className="px-3 py-3"><b>{r.fiscal_year}</b><p className="mt-1 text-slate-500">{r.billing_period||"—"}</p></td><td className="px-3 py-3"><b>{r.fee_category}</b><p className="mt-1 text-slate-500">{r.particulars}</p></td><td className="px-3 py-3">{r.campus}</td><td className="px-3 py-3">{feeMoney(r.billing_amount)}</td><td className="px-3 py-3">{feeMoney(r.collected_amount)}</td><td className="px-3 py-3 font-bold text-amber-700">{feeMoney(Number(r.billing_amount||0)-Number(r.collected_amount||0))}</td><td className="px-3 py-3">{feeMoney(r.obligated_amount)}</td><td className="px-3 py-3">{feeMoney(r.disbursed_amount)}</td><td className="px-3 py-3 font-bold text-rose-700">{feeMoney(Number(r.obligated_amount||0)-Number(r.disbursed_amount||0))}</td><td className="px-3 py-3"><div className="flex items-center justify-center gap-2"><button type="button" onClick={()=>onEdit(r)} title="Edit fee record" aria-label="Edit fee record" className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-50 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300"><Edit2 className="h-4 w-4" /></button>{role === "Administration" && <button type="button" onClick={()=>onDelete(r)} title="Delete fee record" aria-label="Delete fee record" className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-50 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300"><Trash2 className="h-4 w-4" /></button>}</div></td></tr>)}</tbody></table></div></div>
  </div>;
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
  canCreate,
  canEdit,
  canDelete,
}) {
  const allocatedPct = percent(allocated, approved);
  const utilizedPct = percent(utilized, approved);
  const balancePct = percent(balance, approved);
  const recentRows = (entries || []).slice(0, 5);

  const statusOptions = ["All Status", "Recorded", "Obligated", "Disbursed", "Pending", "Rejected"];

  const openTransactions = () => onOpen("transactions");

  return (
    <div className="w-full min-w-0 pt-0 pb-5">
      {/* Fiscal Year selector — mirrors the Budget Proposals module exactly. */}
      <div className="bp-dashboard-toolbar" style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginBottom: 12 }}>
        <label
          className="bp-dashboard-year-selector"
          style={{ height: 36, display: "inline-flex", alignItems: "center", gap: 7, padding: "0 10px", background: "#fff", border: "1px solid #dbe4f0", borderRadius: 8, boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)", color: "#334155", fontSize: 10, fontWeight: 700 }}
        >
          <CalendarDays aria-hidden="true" style={{ width: 14, height: 14, color: "#123b7a" }} />
          <span>Fiscal Year</span>
          <span style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
            <select
              value={fiscalYear}
              onChange={(e) => setFiscalYear(e.target.value)}
              aria-label="Fiscal Year"
              style={{ appearance: "none", WebkitAppearance: "none", border: 0, outline: 0, background: "transparent", padding: "0 19px 0 1px", color: "#0f172a", fontSize: 10, fontWeight: 800, cursor: "pointer", minHeight: 24, position: "relative", zIndex: 1 }}
            >
              {YEARS.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <ChevronDown aria-hidden="true" style={{ position: "absolute", right: 1, top: "50%", transform: "translateY(-50%)", width: 13, height: 13, color: "#64748b", pointerEvents: "none", marginLeft: -2 }} />
          </span>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-12 gap-3 mb-4">
        {modules.map((item, index) => (
          <div
            key={item.id}
            className="xl:col-span-3"
          >
            <ModuleCard
              item={item}
              Icon={item.icon}
              onClick={() => onOpen(item.id)}
            />
          </div>
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
                        {canEdit && <ActionButton title="Edit" onClick={() => onEdit(row)} icon={Edit2} />}
                        {canDelete && <ActionButton title="Delete" onClick={() => onDelete(row)} icon={Trash2} />}
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
      : item.id === "fundRegistries"
        ? "Open Fund Registries"
        : item.id === "transactions"
          ? "Open Transactions"
          : item.id === "monitoring"
            ? "Open Utilization & Balance"
            : item.id === "breakdown"
              ? "Open Fund / Project Breakdown"
              : item.id === "reports"
                ? "Open Reports & Export"
                : item.id === "feeMonitoring"
                  ? "Open Fee Monitoring"
                  : "Open Reports & Export";

  return (
    <section className="h-full rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition min-h-[150px] flex flex-col">
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
          item.tone === "purple" ? "border-purple-600 text-purple-700 hover:bg-purple-600 hover:text-white" :
          item.tone === "orange" ? "border-orange-500 text-orange-600 hover:bg-orange-500 hover:text-white" :
          item.tone === "teal" ? "border-teal-500 text-teal-600 hover:bg-teal-500 hover:text-white" :
          item.tone === "yellow" ? "border-yellow-500 text-yellow-700 hover:bg-yellow-500 hover:text-white" :
          "border-red-600 text-red-700 hover:bg-red-600 hover:text-white"
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
                      {row.pap_name || row.mfo_name || "—"}
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
  canCreate,
  canEdit,
  canDelete,
}) {
  return (
    <div>
      <TabBar
        tabs={canCreate ? ["Transaction List", "Add Transaction", "Transaction History"] : ["Transaction List", "Transaction History"]}
        value={tab === "Add Transaction" && !canCreate ? "Transaction List" : tab}
        onChange={(nextTab) => {
          setTab(nextTab);
          if (nextTab === "Add Transaction" && canCreate) onAdd();
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
          canCreate ? (
            <button
              type="button"
              onClick={onAdd}
              className="h-8 px-3 rounded-lg bg-[#211b79] text-white text-[10px] font-semibold flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Transaction
            </button>
          ) : null
        }
      >
        <TransactionTable
          entries={entries}
          loading={loading}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
          canEdit={canEdit}
          canDelete={canDelete}
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

function TransactionTable({ entries = [], loading, compact = false, onView, onEdit, onDelete, canEdit = false, canDelete = false }) {
  const columns = compact
    ? [["Registry No.","registry_no"],["Date","entry_date"],["Fund Code","fund_code"],["Payee / Name","payee"],["Particulars / Description","particulars"],["Utilization","utilization_amount"],["Disbursement","disbursement_amount"],["Running Balance","running_balance"]]
    : [["Registry No.","registry_no"],["Date","entry_date"],["Fund Cluster","fund_cluster_name"],["Fund Code","fund_code"],["Campus","campus_name"],["BURS Serial No.","burs_serial_no"],["Transferred From/To","serial_no_transferred"],["Payee / Name","payee"],["Particulars / Description","particulars"],["Responsibility Center","responsibility_center_name"],["PAP","pap_name"],["UACS Code","uacs_code"],["Ref. No.","ref_no"],["Allotment Class","allotment_class_name"],["Utilization","utilization_amount"],["PS","ps_utilization"],["MOOE","mooe_utilization"],["CO","co_utilization"],["WFP Source","wfp_source_name"],["Disbursement","disbursement_amount"],["Unpaid Utilization","unpaid_utilization"],["Running Balance","running_balance"],["Status","status"],["Entered By","created_by_name"],["Updated By","updated_by_name"]];
  const moneyKeys = new Set(["utilization_amount","ps_utilization","mooe_utilization","co_utilization","disbursement_amount","unpaid_utilization","running_balance"]);
  const cellValue = (row,key) => {
    if (key === "entry_date") return dateLabel(row.entry_date);
    if (moneyKeys.has(key)) return money(row[key]);
    if (key === "created_by_name") {
      return row.created_by_name
        ? `${row.created_by_name}${row.created_by_role ? ` (${row.created_by_role})` : ""}`
        : "—";
    }
    if (key === "updated_by_name") {
      return row.updated_by_name
        ? `${row.updated_by_name}${row.updated_by_role ? ` (${row.updated_by_role})` : ""}`
        : "—";
    }
    return row[key] || "—";
  };
  return (
    <div className="overflow-x-auto">
      <table className={`w-full ${compact ? "min-w-[1050px]" : "min-w-[2900px]"} text-[10px]`}>
        <thead className="bg-gray-50 text-gray-500"><tr>
          {columns.map(([label]) => <th key={label} className="p-3 text-left whitespace-nowrap">{label}</th>)}
          {!compact && <th className="p-3 text-center sticky right-0 bg-gray-50">Actions</th>}
        </tr></thead>
        <tbody>
          {loading && <tr><td colSpan={columns.length+(compact?0:1)} className="p-8 text-center text-gray-400"><Loader2 className="w-5 h-5 animate-spin mx-auto mb-2"/>Loading transactions...</td></tr>}
          {!loading && entries.map(row => <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50/70 align-top">
            {columns.map(([label,key]) => <td key={label} className="p-3">
              {key === "registry_no" ? <span className="font-semibold text-[#17135f] whitespace-nowrap">{cellValue(row,key)}</span>
              : key === "particulars" ? <div className="whitespace-pre-line max-w-[280px]">{cellValue(row,key)}</div>
              : <span className="whitespace-nowrap">{cellValue(row,key)}</span>}
            </td>)}
            {!compact && <td className="p-3 sticky right-0 bg-white"><div className="flex items-center justify-center gap-1">
              <ActionButton title="View" onClick={()=>onView(row)} icon={Eye}/>
              {canEdit && <ActionButton title="Edit" onClick={()=>onEdit(row)} icon={Edit2}/>}
              {canDelete && <ActionButton title="Delete" onClick={()=>onDelete(row)} icon={Trash2}/>}
            </div></td>}
          </tr>)}
          {!loading && !entries.length && <EmptyRow colSpan={columns.length+(compact?0:1)}/>}
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

/*
  Each report has its own layout and data presentation.
  These are BMAS/RBUD report templates based on the fields available
  in the current RBUD registry. They are intentionally not treated as
  official external-government form replicas unless an approved template
  is provided.
*/

const reportNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const reportRows = (entries = []) => entries.filter(Boolean);

const sumReport = (rows, field) =>
  rows.reduce((total, row) => total + reportNumber(row?.[field]), 0);

const reportLabel = (row, fields = []) => {
  for (const field of fields) {
    const value = row?.[field];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value);
    }
  }
  return "—";
};

const reportUser = (row, type = "created") => {
  const isUpdated = type === "updated";
  const name = isUpdated ? row?.updated_by_name : row?.created_by_name;
  const role = isUpdated ? row?.updated_by_role : row?.created_by_role;
  return name ? `${name}${role ? ` (${role})` : ""}` : "—";
};

const RBUD_FULL_REPORT_COLUMNS = [
  ["Registry No.", row => row.registry_no],
  ["Date", row => dateLabel(row.entry_date)],
  ["Fund Cluster", row => reportLabel(row, ["fund_cluster_code", "fund_cluster_name"])],
  ["Fund Code", row => row.fund_code],
  ["Campus", row => row.campus_name],
  ["BURS Serial No.", row => row.burs_serial_no],
  ["Serial No. Transferred From/To", row => row.serial_no_transferred || row.serial_no_transferred_from_to],
  ["Payee / Name", row => row.payee],
  ["Particulars / Description", row => row.particulars],
  ["Responsibility Center", row => reportLabel(row, ["responsibility_center_code", "responsibility_center_name", "department_name"])],
  ["PAP", row => reportLabel(row, ["pap_code", "pap_name"])],
  ["UACS Code", row => row.uacs_code],
  ["Ref. No.", row => row.ref_no],
  ["Allotment Class", row => reportLabel(row, ["allotment_class_code", "allotment_class_name"])],
  ["UACS Funding Source Code", row => row.uacs_funding_source_code],
  ["Year", row => row.fiscal_year || (row.entry_date ? new Date(row.entry_date).getFullYear() : null)],
  ["Month", row => row.month || (row.entry_date ? new Date(row.entry_date).toLocaleString("en-US", { month: "long" }) : null)],
  ["Series", row => row.series],
  ["Series2", row => row.series2],
  ["Quarter", row => row.quarter || (row.entry_date ? `Q${Math.ceil((new Date(row.entry_date).getMonth() + 1) / 3)}` : null)],
  ["MFO", row => row.mfo_name || row.mfo_code],
  ["Old UACS Code", row => row.old_uacs_code || row.uacs_old_code || row.old_uacs_code_id],
  ["Accounts Title", row => row.account_title || row.uacs_account_title],
  ["Utilization", row => money(row.utilization_amount)],
  ["PS", row => money(row.ps_utilization)],
  ["MOOE", row => money(row.mooe_utilization)],
  ["CO", row => money(row.co_utilization)],
  ["WFP Source", row => row.wfp_source_name || row.wfp_source || row.wfp_source_code],
  ["WFP Source Code", row => row.wfp_source_code || row.wfp_source_master_code],
  ["Disbursement Amount", row => money(row.disbursement_amount)],
  ["Running Balance", row => money(row.running_balance ?? row.available_balance ?? row.remaining_balance)],
  ["Remarks", row => row.remarks],
  ["Unpaid Utilization", row => money(row.unpaid_utilization)],
  ["Status", row => row.status || row.derived_status],
  ["Entered By", row => reportUser(row, "created")],
  ["Updated By", row => reportUser(row, "updated")],
];

const RBUD_FULL_REPORT_HEADERS = RBUD_FULL_REPORT_COLUMNS.map(([label]) => label);

const fullRbudReportValues = (row) =>
  RBUD_FULL_REPORT_COLUMNS.map(([, getter]) => {
    const value = getter(row || {});
    return value === null || value === undefined || String(value).trim() === "" ? "—" : value;
  });


function ReportDocumentHeader({ title, year, group, fund }) {
  return (
    <div className="text-center border-b border-gray-200 pb-4 mb-4">
      <p className="text-[9px] text-gray-400 font-semibold">UNIVERSITY OF ABRA</p>
      <p className="text-[9px] text-gray-500">BUDGET MONITORING AND ALLOCATION SYSTEM</p>
      <h3 className="text-base font-bold text-[#17135f] mt-1">{title}</h3>
      <p className="text-[10px] text-gray-500 mt-1">
        Fiscal Year {year} • Fund Group: {group} • Fund: {fund || "All Funds"}
      </p>
    </div>
  );
}

function ReportTable({ headers, rows, renderRow, empty = "No records found.", tableClassName = "" }) {
  return (
    <div className="overflow-x-auto">
      <table className={`w-full border border-gray-400 border-collapse text-[9px] ${tableClassName}`}>
        <thead>
          <tr>
            {headers.map((header) => {
              const headerLabel = typeof header === "string" ? header : header?.label;
              const internalAudit = /^(Entered By|Updated By)$/i.test(String(headerLabel || ""));
              return (
                <th
                  key={String(headerLabel)}
                  className={`border border-gray-400 bg-gray-50 px-2 py-1.5 text-center font-bold whitespace-nowrap align-middle ${internalAudit ? "rbud-internal-audit-column" : ""}`}
                >
                  {headerLabel}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((row, index) => renderRow(row, index))
          ) : (
            <tr>
              <td colSpan={headers.length} className="border border-gray-300 px-2 py-5 text-center text-gray-500">
                {empty}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function Far2Report({ entries }) {
  const rows = reportRows(entries);
  const grouped = Object.values(
    rows.reduce((acc, row) => {
      const key = [
        row.fund_cluster_code || row.fund_cluster_name || "—",
        row.campus_name || "—",
        row.allotment_class_code || row.allotment_class_name || "—",
      ].join("||");

      if (!acc[key]) {
        acc[key] = {
          fund: row.fund_cluster_code || row.fund_cluster_name || "—",
          campus: row.campus_name || "—",
          allotment: row.allotment_class_code || row.allotment_class_name || "—",
          utilization: 0,
          ps: 0,
          mooe: 0,
          co: 0,
          disbursement: 0,
          unpaid: 0,
          balance: 0,
        };
      }

      acc[key].utilization += reportNumber(row.utilization_amount);
      acc[key].ps += reportNumber(row.ps_utilization);
      acc[key].mooe += reportNumber(row.mooe_utilization);
      acc[key].co += reportNumber(row.co_utilization);
      acc[key].disbursement += reportNumber(row.disbursement_amount);
      acc[key].unpaid += reportNumber(row.unpaid_utilization);
      acc[key].balance += reportNumber(
        row.running_balance ?? row.available_balance ?? row.remaining_balance
      );
      return acc;
    }, {})
  );

  return (
    <div>
      <div className="text-[9px] font-semibold text-gray-600 mb-2">
        Utilization and Disbursement Summary
      </div>
      <ReportTable
        headers={[
          "Fund / Cluster",
          "Campus",
          "Allotment Class",
          "Utilization",
          "PS",
          "MOOE",
          "CO",
          "Disbursement",
          "Unpaid",
          "Balance",
        ]}
        rows={grouped}
        renderRow={(row, index) => (
          <tr key={`far2-${index}`}>
            <td className="border border-gray-300 px-2 py-1">{row.fund}</td>
            <td className="border border-gray-300 px-2 py-1">{row.campus}</td>
            <td className="border border-gray-300 px-2 py-1">{row.allotment}</td>
            <td className="border border-gray-300 px-2 py-1 text-right">{money(row.utilization)}</td>
            <td className="border border-gray-300 px-2 py-1 text-right">{money(row.ps)}</td>
            <td className="border border-gray-300 px-2 py-1 text-right">{money(row.mooe)}</td>
            <td className="border border-gray-300 px-2 py-1 text-right">{money(row.co)}</td>
            <td className="border border-gray-300 px-2 py-1 text-right">{money(row.disbursement)}</td>
            <td className="border border-gray-300 px-2 py-1 text-right">{money(row.unpaid)}</td>
            <td className="border border-gray-300 px-2 py-1 text-right">{money(row.balance)}</td>
          </tr>
        )}
      />
    </div>
  );
}

function Far2AReport({ entries }) {
  const rows = reportRows(entries);
  const grouped = Object.values(
    rows.reduce((acc, row) => {
      const key = row.pap_name || row.pap_code || "Unclassified";
      if (!acc[key]) {
        acc[key] = {
          pap: key,
          utilization: 0,
          ps: 0,
          mooe: 0,
          co: 0,
          disbursement: 0,
          unpaid: 0,
        };
      }
      acc[key].utilization += reportNumber(row.utilization_amount);
      acc[key].ps += reportNumber(row.ps_utilization);
      acc[key].mooe += reportNumber(row.mooe_utilization);
      acc[key].co += reportNumber(row.co_utilization);
      acc[key].disbursement += reportNumber(row.disbursement_amount);
      acc[key].unpaid += reportNumber(row.unpaid_utilization);
      return acc;
    }, {})
  );

  return (
    <div>
      <div className="text-[9px] font-semibold text-gray-600 mb-2">
        Utilization by PAP / Program
      </div>
      <ReportTable
        headers={[
          "PAP / Program",
          "Utilization",
          "PS",
          "MOOE",
          "CO",
          "Disbursement",
          "Unpaid",
        ]}
        rows={grouped}
        renderRow={(row, index) => (
          <tr key={`far2a-${index}`}>
            <td className="border border-gray-300 px-2 py-1">{row.pap}</td>
            <td className="border border-gray-300 px-2 py-1 text-right">{money(row.utilization)}</td>
            <td className="border border-gray-300 px-2 py-1 text-right">{money(row.ps)}</td>
            <td className="border border-gray-300 px-2 py-1 text-right">{money(row.mooe)}</td>
            <td className="border border-gray-300 px-2 py-1 text-right">{money(row.co)}</td>
            <td className="border border-gray-300 px-2 py-1 text-right">{money(row.disbursement)}</td>
            <td className="border border-gray-300 px-2 py-1 text-right">{money(row.unpaid)}</td>
          </tr>
        )}
      />
    </div>
  );
}

function Far2A2AReport({ entries }) {
  const rows = reportRows(entries);
  return (
    <div>
      <div className="text-[9px] font-semibold text-gray-600 mb-2">
        Detailed Utilization and Disbursement Schedule
      </div>
      <ReportTable
        headers={[
          "Registry No.",
          "Date",
          "Payee / Name",
          "Particulars / Description",
          "PAP",
          "UACS Code",
          "Ref. No.",
          "Utilization",
          "PS",
          "MOOE",
          "CO",
          "Disbursement",
          "Unpaid",
          "Balance",
          "Remarks",
          "Entered By",
          "Updated By",
        ]}
        rows={rows}
        tableClassName="min-w-[1900px]"
        renderRow={(row) => (
          <tr key={`far2a2a-${row.id}`}>
            <td className="border border-gray-300 px-2 py-1">{row.registry_no || "—"}</td>
            <td className="border border-gray-300 px-2 py-1">{dateLabel(row.entry_date)}</td>
            <td className="border border-gray-300 px-2 py-1">{row.payee || "—"}</td>
            <td className="border border-gray-300 px-2 py-1">{row.particulars || "—"}</td>
            <td className="border border-gray-300 px-2 py-1">{row.pap_name || "—"}</td>
            <td className="border border-gray-300 px-2 py-1">{row.uacs_code || "—"}</td>
            <td className="border border-gray-300 px-2 py-1">{row.ref_no || "—"}</td>
            <td className="border border-gray-300 px-2 py-1 text-right">{money(row.utilization_amount)}</td>
            <td className="border border-gray-300 px-2 py-1 text-right">{money(row.ps_utilization)}</td>
            <td className="border border-gray-300 px-2 py-1 text-right">{money(row.mooe_utilization)}</td>
            <td className="border border-gray-300 px-2 py-1 text-right">{money(row.co_utilization)}</td>
            <td className="border border-gray-300 px-2 py-1 text-right">{money(row.disbursement_amount)}</td>
            <td className="border border-gray-300 px-2 py-1 text-right">{money(row.unpaid_utilization)}</td>
            <td className="border border-gray-300 px-2 py-1 text-right">{money(row.running_balance ?? row.available_balance ?? row.remaining_balance)}</td>
            <td className="border border-gray-300 px-2 py-1 whitespace-nowrap">{row.remarks || "—"}</td>
            <td className="border border-gray-300 px-2 py-1 whitespace-nowrap rbud-internal-audit-column">{reportUser(row, "created")}</td>
            <td className="border border-gray-300 px-2 py-1 whitespace-nowrap rbud-internal-audit-column">{reportUser(row, "updated")}</td>
          </tr>
        )}
      />
    </div>
  );
}

function RbudRegistryReport({ entries }) {
  const rows = reportRows(entries);

  return (
    <div>
      <div className="mb-2 text-[9px] text-gray-500">
        Complete RBUD transaction registry — includes budget, utilization, disbursement, monitoring, and record-tracking fields.
      </div>

      <ReportTable
        headers={RBUD_FULL_REPORT_HEADERS}
        rows={rows}
        tableClassName="min-w-[3000px]"
        renderRow={(row) => (
          <tr key={`rbud-${row.id}`} className="align-middle">
            {RBUD_FULL_REPORT_COLUMNS.map(([label, getter]) => {
              const value = getter(row || {});
              const display = value === null || value === undefined || String(value).trim() === "" ? "—" : value;
              const auditColumn = label === "Entered By" || label === "Updated By";
              const moneyColumn = ["Utilization", "PS", "MOOE", "CO", "Disbursement Amount", "Running Balance", "Unpaid Utilization"].includes(label);

              return (
                <td
                  key={`${row.id}-${label}`}
                  className={`border border-gray-300 px-2 py-1 whitespace-nowrap align-middle ${
                    auditColumn ? "rbud-internal-audit-column" : ""
                  } ${moneyColumn ? "text-right" : "text-left"}`}
                >
                  {display}
                </td>
              );
            })}
          </tr>
        )}
      />
    </div>
  );
}

function WfpMonitoringReport({ entries }) {
  const rows = reportRows(entries);
  return (
    <div>
      <ReportTable
        headers={[
          "WFP Source",
          "PAP / Program",
          "Fund",
          "Registry No.",
          "Utilization",
          "Disbursement",
          "Balance",
          "Status",
          "Remarks",
          "Entered By",
          "Updated By",
        ]}
        rows={rows}
        renderRow={(row) => (
          <tr key={`wfp-${row.id}`}>
            <td className="border border-gray-300 px-2 py-1">{reportLabel(row, ["wfp_source_name", "wfp_source_code"])}</td>
            <td className="border border-gray-300 px-2 py-1">{row.pap_name || "—"}</td>
            <td className="border border-gray-300 px-2 py-1">{row.fund_code || row.fund_cluster_name || "—"}</td>
            <td className="border border-gray-300 px-2 py-1">{row.registry_no || "—"}</td>
            <td className="border border-gray-300 px-2 py-1 text-right">{money(row.utilization_amount)}</td>
            <td className="border border-gray-300 px-2 py-1 text-right">{money(row.disbursement_amount)}</td>
            <td className="border border-gray-300 px-2 py-1 text-right">{money(row.running_balance ?? row.available_balance ?? row.remaining_balance)}</td>
            <td className="border border-gray-300 px-2 py-1">{row.status || "—"}</td>
            <td className="border border-gray-300 px-2 py-1">{row.remarks || "—"}</td>
            <td className="border border-gray-300 px-2 py-1 rbud-internal-audit-column">{reportUser(row, "created")}</td>
            <td className="border border-gray-300 px-2 py-1 rbud-internal-audit-column">{reportUser(row, "updated")}</td>
          </tr>
        )}
      />
    </div>
  );
}

function FinancialSummaryReport({ entries }) {
  const rows = reportRows(entries);
  const campuses = new Set(rows.map((row) => row.campus_name).filter(Boolean)).size;
  const payees = new Set(rows.map((row) => row.payee).filter(Boolean)).size;
  const utilization = sumReport(rows, "utilization_amount");
  const disbursement = sumReport(rows, "disbursement_amount");
  const unpaid = sumReport(rows, "unpaid_utilization");

  const statusMap = rows.reduce((acc, row) => {
    const key = row.status || "No Status";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
        {[
          ["Transactions", rows.length],
          ["Campuses", campuses],
          ["Payees", payees],
          ["Utilization", money(utilization)],
          ["Disbursement", money(disbursement)],
        ].map(([label, value]) => (
          <div key={label} className="border border-gray-200 rounded-lg p-2">
            <div className="text-[9px] text-gray-500">{label}</div>
            <div className="text-xs font-bold">{value}</div>
          </div>
        ))}
      </div>
      <ReportTable
        headers={["Status", "Transactions", "Utilization", "Disbursement", "Unpaid Utilization"]}
        rows={Object.entries(statusMap)}
        renderRow={([status, count], index) => {
          const statusRows = rows.filter((row) => (row.status || "No Status") === status);
          return (
            <tr key={`summary-${index}`}>
              <td className="border border-gray-300 px-2 py-1">{status}</td>
              <td className="border border-gray-300 px-2 py-1 text-center">{count}</td>
              <td className="border border-gray-300 px-2 py-1 text-right">{money(sumReport(statusRows, "utilization_amount"))}</td>
              <td className="border border-gray-300 px-2 py-1 text-right">{money(sumReport(statusRows, "disbursement_amount"))}</td>
              <td className="border border-gray-300 px-2 py-1 text-right">{money(sumReport(statusRows, "unpaid_utilization"))}</td>
            </tr>
          );
        }}
      />
      <div className="mt-3 text-[9px] text-gray-600">
        Total unpaid utilization: <span className="font-bold">{money(unpaid)}</span>
      </div>
    </div>
  );
}

function FundProjectBreakdownReport({ entries }) {
  const rows = Object.values(
    reportRows(entries).reduce((acc, row) => {
      const fund = row.fund_cluster_code || row.fund_cluster_name || row.fund_code || "Unclassified Fund";
      const pap = row.pap_name || "Unclassified PAP";
      const key = `${fund}||${pap}`;

      if (!acc[key]) {
        acc[key] = {
          fund,
          pap,
          transactions: 0,
          utilization: 0,
          disbursement: 0,
          unpaid: 0,
          balance: 0,
        };
      }

      acc[key].transactions += 1;
      acc[key].utilization += reportNumber(row.utilization_amount);
      acc[key].disbursement += reportNumber(row.disbursement_amount);
      acc[key].unpaid += reportNumber(row.unpaid_utilization);
      acc[key].balance += reportNumber(row.running_balance ?? row.available_balance ?? row.remaining_balance);
      return acc;
    }, {})
  );

  return (
    <div>
      <ReportTable
        headers={["Fund / Cluster", "PAP / Project", "Transactions", "Utilization", "Disbursement", "Unpaid", "Balance"]}
        rows={rows}
        renderRow={(row, index) => (
          <tr key={`breakdown-${index}`}>
            <td className="border border-gray-300 px-2 py-1">{row.fund}</td>
            <td className="border border-gray-300 px-2 py-1">{row.pap}</td>
            <td className="border border-gray-300 px-2 py-1 text-center">{row.transactions}</td>
            <td className="border border-gray-300 px-2 py-1 text-right">{money(row.utilization)}</td>
            <td className="border border-gray-300 px-2 py-1 text-right">{money(row.disbursement)}</td>
            <td className="border border-gray-300 px-2 py-1 text-right">{money(row.unpaid)}</td>
            <td className="border border-gray-300 px-2 py-1 text-right">{money(row.balance)}</td>
          </tr>
        )}
      />
    </div>
  );
}


function SelectedRbudReport({ reportChoice, entries, year, group, fund }) {
  const reportMap = {
    "FAR 2": Far2Report,
    "FAR 2A": Far2AReport,
    "FAR 2A 2A": Far2A2AReport,
    "RBUD Registry": RbudRegistryReport,
    "WFP Monitoring Report": WfpMonitoringReport,
    "Financial Summary": FinancialSummaryReport,
    "Fund / Project Breakdown": FundProjectBreakdownReport,
  };

  const Report = reportMap[reportChoice] || RbudRegistryReport;

  return (
    <div>
      <ReportDocumentHeader title={reportChoice} year={year} group={group} fund={fund} />
      <Report entries={entries} />
    </div>
  );
}

function FeeMonitoringReport({ feeRows = [], enrollmentRows = [], budgetReferences = [], year, compact = false }) {
  const campuses = ["La Paz", "Lagangilang/Main Campus", "Bangued"];
  const currency = (value) => money(value);
  const enrollmentFor = (campus) => enrollmentRows.filter((r) => normalizedCampus(r.campus) === campus).reduce((sum, r) => sum + Number(r.enrollee_count || 0), 0);
  const budgetFor = (particular, category, campus) => budgetReferences.filter((r) => String(r.particulars || "").trim() === particular && String(r.fee_category || "").trim() === category && normalizedCampus(r.campus) === campus).reduce((sum, r) => sum + Number(r.budget_amount || 0), 0);
  const normalizedCampus = (value) => {
    const v = String(value || "").trim().toLowerCase();
    if (v.includes("paz")) return "La Paz";
    if (v.includes("bangued")) return "Bangued";
    if (v.includes("lagangilang") || v.includes("laengalangan")) return "Lagangilang/Main Campus";
    return String(value || "").trim();
  };
  const categories = ["Non-Fiduciary Fees", "Fiduciary Fees"];
  const particulars = [...new Set(feeRows.map((r) => String(r.particulars || "Other / Unspecified").trim()))]
    .sort((a, b) => a.localeCompare(b));
  const valueFor = (particular, category, campus, key) => feeRows
    .filter((r) => String(r.particulars || "Other / Unspecified").trim() === particular
      && String(r.fee_category || "").trim() === category
      && normalizedCampus(r.campus) === campus)
    .reduce((sum, r) => {
      const billing = Number(r.billing_amount || 0);
      const collected = Number(r.collected_amount || 0);
      const obligated = Number(r.obligated_amount || 0);
      const disbursed = Number(r.disbursed_amount || 0);
      if (key === "collected") return sum + collected;
      if (key === "uncollected") return sum + billing - collected;
      if (key === "billing") return sum + billing;
      if (key === "obligated") return sum + obligated;
      if (key === "disbursed") return sum + disbursed;
      if (key === "unpaid") return sum + obligated - disbursed;
      return sum;
    }, 0);
  const grand = (campus, key) => feeRows.filter((r) => normalizedCampus(r.campus) === campus).reduce((sum, r) => {
    const billing = Number(r.billing_amount || 0), collected = Number(r.collected_amount || 0);
    const obligated = Number(r.obligated_amount || 0), disbursed = Number(r.disbursed_amount || 0);
    return sum + (key === "collected" ? collected : key === "uncollected" ? billing - collected : key === "billing" ? billing : key === "obligated" ? obligated : key === "disbursed" ? disbursed : obligated - disbursed);
  }, 0);
  const signatureBlock = (
    <div className="fee-report-signatures grid grid-cols-2 gap-12 mt-10 text-[10px] text-black">
      <div className="text-center"><div className="border-b border-black h-7"/><p className="font-bold mt-1">Prepared by</p><p>Signature over printed name / Date</p></div>
      <div className="text-center"><div className="border-b border-black h-7"/><p className="font-bold mt-1">Certified Correct / Approved by</p><p>Signature over printed name / Date</p></div>
    </div>
  );
  return (
    <div className={`fee-monitoring-report bg-white text-gray-900 ${compact ? "fee-report-preview" : "fee-report-print"}`}>
      <div className="text-center border-b border-gray-400 pb-2 mb-3">
        <p className="text-[9px]">Republic of the Philippines</p>
        <p className="text-[9px]">UNIVERSITY OF ABRA</p>
        <p className="text-[9px]">BUDGET MONITORING AND ALLOCATION SYSTEM</p>
        <h3 className="text-sm font-bold mt-1">FEE MONITORING REPORT</h3>
        <p className="text-[9px] mt-1">Fiscal Year {year} • Billing, Collections, Obligations and Disbursements</p>
      </div>
      {compact && (() => {
        const totals = feeRows.reduce((a, r) => {
          const billing = Number(r.billing_amount || 0), collected = Number(r.collected_amount || 0);
          const obligated = Number(r.obligated_amount || 0), disbursed = Number(r.disbursed_amount || 0);
          return { billing: a.billing + billing, collected: a.collected + collected, uncollected: a.uncollected + billing - collected, obligated: a.obligated + obligated, disbursed: a.disbursed + disbursed, unpaid: a.unpaid + obligated - disbursed };
        }, { billing: 0, collected: 0, uncollected: 0, obligated: 0, disbursed: 0, unpaid: 0 });
        return <div className="fee-stat-cards grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">{[["Actual Billing", totals.billing], ["Collected", totals.collected], ["Uncollected", totals.uncollected], ["Obligated", totals.obligated], ["Disbursed", totals.disbursed], ["Unpaid Obligations", totals.unpaid]].map(([label, amount]) => <div key={label} className="border border-gray-200 rounded-lg p-2"><p className="text-[9px] uppercase font-semibold text-gray-500">{label}</p><p className="text-xs font-bold mt-1">{currency(amount)}</p></div>)}</div>;
      })()}
      <div className="fee-report-table-wrap">
        <table className="fee-report-table w-full text-[8px] border-collapse">
          <thead>
            <tr>
              <th rowSpan={2} className="border border-black px-1 py-1">Particulars</th>
              <th colSpan={4} className="border border-black px-1 py-1">GAA 2026 / WFP Reference</th>
              <th colSpan={4} className="border border-black px-1 py-1">Actual Billing (Collected)</th>
              <th colSpan={4} className="border border-black px-1 py-1">Actual Billing (Uncollected)</th>
            </tr>
            <tr>
              {[...campuses, "Total", ...campuses, "Total", ...campuses, "Total"].map((name, i) => <th key={`${name}-${i}`} className="border border-black px-1 py-1">{name}</th>)}
            </tr>
            <tr className="font-bold bg-yellow-100"><td className="border border-black px-1 py-1">No. of Enrollees</td>{campuses.map(c=><td key={`enr-${c}`} className="border border-black px-1 py-1 text-right">{enrollmentFor(c).toLocaleString()}</td>)}<td className="border border-black px-1 py-1 text-right">{campuses.reduce((sum,c)=>sum+enrollmentFor(c),0).toLocaleString()}</td>{Array.from({length:8},(_,i)=><td key={`blank-enr-${i}`} className="border border-black px-1 py-1">—</td>)}</tr>
          </thead>
          <tbody>
            {categories.map((category) => {
              const categoryParticulars = particulars.filter((particular) => feeRows.some((r) => String(r.particulars || "Other / Unspecified").trim() === particular && String(r.fee_category || "").trim() === category));
              if (!categoryParticulars.length) return null;
              return <React.Fragment key={category}>
                <tr className="bg-gray-200"><td colSpan={13} className="border border-black px-1 py-1 font-bold">{category}</td></tr>
                {categoryParticulars.map((particular) => {
                  const collected = campuses.map((campus) => valueFor(particular, category, campus, "collected"));
                  const uncollected = campuses.map((campus) => valueFor(particular, category, campus, "uncollected"));
                  return <tr key={`${category}-${particular}`}>
                    <td className="border border-black px-1 py-1">{particular}</td>
                    {campuses.map((campus, i) => <td key={`b-${i}`} className="border border-black px-1 py-1 text-right">{budgetFor(particular, category, campus) ? currency(budgetFor(particular, category, campus)) : "—"}</td>)}
                    <td className="border border-black px-1 py-1 text-right font-semibold">{currency(campuses.reduce((sum, campus) => sum + budgetFor(particular, category, campus), 0))}</td>
                    {collected.map((v, i) => <td key={`c-${i}`} className="border border-black px-1 py-1 text-right">{v ? currency(v) : "—"}</td>)}
                    <td className="border border-black px-1 py-1 text-right font-semibold">{currency(collected.reduce((a, b) => a + b, 0))}</td>
                    {uncollected.map((v, i) => <td key={`u-${i}`} className="border border-black px-1 py-1 text-right">{v ? currency(v) : "—"}</td>)}
                    <td className="border border-black px-1 py-1 text-right font-semibold">{currency(uncollected.reduce((a, b) => a + b, 0))}</td>
                  </tr>;
                })}
              </React.Fragment>;
            })}
            <tr className="font-bold bg-gray-100">
              <td className="border border-black px-1 py-1">TOTAL</td>
              {campuses.map((campus) => <td key={`gb-${campus}`} className="border border-black px-1 py-1 text-right">{currency(budgetReferences.filter(r => normalizedCampus(r.campus)===campus).reduce((sum,r)=>sum+Number(r.budget_amount||0),0))}</td>)}
              <td className="border border-black px-1 py-1 text-right">{currency(budgetReferences.reduce((sum,r)=>sum+Number(r.budget_amount||0),0))}</td>
              {campuses.map((campus) => <td key={`gc-${campus}`} className="border border-black px-1 py-1 text-right">{currency(grand(campus, "collected"))}</td>)}
              <td className="border border-black px-1 py-1 text-right">{currency(campuses.reduce((sum, c) => sum + grand(c, "collected"), 0))}</td>
              {campuses.map((campus) => <td key={`gu-${campus}`} className="border border-black px-1 py-1 text-right">{currency(grand(campus, "uncollected"))}</td>)}
              <td className="border border-black px-1 py-1 text-right">{currency(campuses.reduce((sum, c) => sum + grand(c, "uncollected"), 0))}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <h4 className="text-[10px] font-bold mt-4 mb-1">Obligations and Disbursements Summary</h4>
      <table className="fee-report-table w-full text-[8px] border-collapse">
        <thead><tr>{["Particulars", "Campus", "Actual Billing", "Collected", "Uncollected", "Obligated", "Disbursed", "Unpaid Obligations"].map((h) => <th key={h} className="border border-black px-1 py-1">{h}</th>)}</tr></thead>
        <tbody>
          {feeRows.length ? feeRows.map((r, i) => {
            const billing = Number(r.billing_amount || 0), collected = Number(r.collected_amount || 0), obligated = Number(r.obligated_amount || 0), disbursed = Number(r.disbursed_amount || 0);
            return <tr key={r.id || `${r.particulars}-${r.campus}-${i}`}>
              <td className="border border-black px-1 py-1">{r.particulars || "—"}</td><td className="border border-black px-1 py-1">{r.campus || "—"}</td>
              {[billing, collected, billing-collected, obligated, disbursed, obligated-disbursed].map((v, j) => <td key={j} className="border border-black px-1 py-1 text-right">{currency(v)}</td>)}
            </tr>;
          }) : <tr><td colSpan={8} className="border border-black px-2 py-4 text-center">No Fee Monitoring entries saved for FY {year}.</td></tr>}
        </tbody>
      </table>
      <p className="text-[8px] mt-2">Note: Enrollee counts are encoded from official enrollment information. GAA/WFP amounts are references entered from the WFP PRE sheet and are not actual collections. Uncollected = Actual Billing − Collected; Unpaid Obligations = Obligated − Disbursed.</p>
      {signatureBlock}
    </div>
  );
}

function ReportSignatureBlock() {
  return <div className="rbud-report-signatures grid grid-cols-2 gap-12 mt-10 text-[10px] text-black">
    <div className="text-center"><div className="border-b border-black h-7"/><p className="font-bold mt-1">Prepared by</p><p>Signature over printed name / Date</p></div>
    <div className="text-center"><div className="border-b border-black h-7"/><p className="font-bold mt-1">Certified Correct / Approved by</p><p>Signature over printed name / Date</p></div>
  </div>;
}

function ReportsExportView({
  entries,
  feeRows = [],
  enrollmentRows = [],
  budgetReferences = [],
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
  const openReportPreview = (choice) => {
    setReportChoice(choice);
    onPreview();
  };

  const exportFeeMonitoring = () => {
    const columns = ["fiscal_year", "billing_period", "fee_category", "particulars", "reference_no", "campus", "enrollee_count", "wfp_budget_amount", "wfp_source", "billing_amount", "collected_amount", "uncollected_amount", "obligated_amount", "disbursed_amount", "unpaid_obligations", "remarks"];
    const quote = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const csv = [columns.join(","), ...feeRows.map((row) => columns.map((key) => {
      if (key === "uncollected_amount") return quote(Number(row.billing_amount || 0) - Number(row.collected_amount || 0));
      if (key === "unpaid_obligations") return quote(Number(row.obligated_amount || 0) - Number(row.disbursed_amount || 0));
      if (key === "enrollee_count") return quote(enrollmentRows.filter((x) => String(x.campus || "").trim().toLowerCase() === String(row.campus || "").trim().toLowerCase() && String(x.billing_period || "") === String(row.billing_period || "")).reduce((sum, x) => sum + Number(x.enrollee_count || 0), 0));
      if (key === "wfp_budget_amount") return quote(budgetReferences.filter((x) => String(x.campus || "").trim().toLowerCase() === String(row.campus || "").trim().toLowerCase() && String(x.particulars || "").trim() === String(row.particulars || "").trim() && String(x.fee_category || "") === String(row.fee_category || "")).reduce((sum, x) => sum + Number(x.budget_amount || 0), 0));
      if (key === "wfp_source") return quote(budgetReferences.find((x) => String(x.campus || "").trim().toLowerCase() === String(row.campus || "").trim().toLowerCase() && String(x.particulars || "").trim() === String(row.particulars || "").trim() && String(x.fee_category || "") === String(row.fee_category || ""))?.source_reference || "WFP PRE sheet");
      return quote(row[key] ?? (key === "fiscal_year" ? year : ""));
    }).join(","))].join("\r\n");
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `BMAS_Fee_Monitoring_FY${year}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Select
            label="Report Type"
            value={reportChoice}
            onChange={setReportChoice}
            options={[
              "FAR 2",
              "FAR 2A",
              "FAR 2A 2A",
              "RBUD Registry",
              "WFP Monitoring Report",
              "Financial Summary",
              "Fund / Project Breakdown",
              "Fee Monitoring Report",
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

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        <ReportAction icon={FileText} title="FAR 2" description="Utilization and disbursement summary" onClick={() => openReportPreview("FAR 2")} />
        <ReportAction icon={FileText} title="FAR 2A" description="Utilization by object of expenditure" onClick={() => openReportPreview("FAR 2A")} />
        <ReportAction icon={FileText} title="FAR 2A 2A" description="Detailed utilization schedule" onClick={() => openReportPreview("FAR 2A 2A")} />
        <ReportAction icon={FileSpreadsheet} title="Export to Excel" description="Export the selected report dataset" onClick={() => reportChoice === "Fee Monitoring Report" ? exportFeeMonitoring() : onExport()} />
        <ReportAction icon={FileText} title="Export to PDF" description="Print the selected report and save as PDF" onClick={onPrint} />
        <ReportAction icon={Printer} title="Print" description="Print the selected RBUD report" onClick={onPrint} />
        <ReportAction icon={List} title="All Reports" description="Preview the selected report" onClick={onPreview} />
        <ReportAction icon={BarChart3} title="Fee Monitoring Stats" description="View statistics from saved Fee Monitoring entries" onClick={() => openReportPreview("Fee Monitoring Report")} />
      </div>

      {reportChoice === "Fee Monitoring Report" && <div className="rbud-print-report rbud-fee-monitoring-panel"><Panel
        title="Fee Monitoring Statistics"
        subtitle={`FY ${year} • ${feeRows.length} fee record(s)`}
        className="mt-4"
        action={<div className="flex items-center gap-2 screen-only"><button type="button" onClick={() => window.print()} className="h-9 px-3 border border-gray-200 rounded-lg text-[10px] font-semibold inline-flex items-center gap-1.5"><Printer className="w-3.5 h-3.5"/>Print</button><button type="button" onClick={exportFeeMonitoring} className="h-9 px-3 bg-[#211b79] text-white rounded-lg text-[10px] font-semibold inline-flex items-center gap-1.5"><Download className="w-3.5 h-3.5"/>Export</button></div>}
      >
        <FeeMonitoringReport feeRows={feeRows} enrollmentRows={enrollmentRows} budgetReferences={budgetReferences} year={year} />
      </Panel></div>}

      {reportChoice !== "Fee Monitoring Report" && <Panel
        title={reportChoice}
        subtitle={`${entries.length} current RBUD registry record(s) • FY ${year}`}
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
          <div className="bg-white border border-gray-200 rounded-lg p-5 max-w-5xl mx-auto">
            <SelectedRbudReport
              reportChoice={reportChoice}
              entries={entries}
              year={year}
              group={group}
              fund={fund}
            />
          </div>
        </div>
      </Panel>}

      <style>{`
        @media print {
          @page { size: legal landscape; margin: 8mm; }
          body * { visibility: hidden !important; }
          .rbud-print-report,
          .rbud-print-report * { visibility: visible !important; }
          /* The on-screen Fee Monitoring Statistics panel contains its own
             FeeMonitoringReport. Hide it during printing because the dedicated
             print-only report below renders the same report and signatures. */
          .rbud-print-report.rbud-fee-monitoring-panel {
            display: none !important;
          }
          .rbud-print-report {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: #fff !important;
            color: #000 !important;
            font-family: Arial, sans-serif !important;
          }
          .rbud-print-report table {
            width: 100% !important;
            max-width: 100% !important;
            border-collapse: collapse !important;
            table-layout: fixed !important;
          }
          .rbud-print-report .overflow-x-auto,
          .rbud-print-report .overflow-hidden,
          .rbud-print-report .overflow-auto { overflow: visible !important; }
          .rbud-print-report .min-w-\[3000px\] { min-width: 0 !important; }
          .rbud-print-report .fee-report-signatures,
          .rbud-print-report .rbud-report-signatures { break-inside: avoid !important; }
          .fee-report-preview .fee-stat-cards { display: grid; }
          .rbud-print-report .fee-stat-cards,
          .rbud-print-report .screen-only,
          .rbud-print-report .report-stat-cards { display: none !important; }
          .rbud-print-report .fee-report-table th,
          .rbud-print-report .fee-report-table td { font-size: 6.5px !important; padding: 2px !important; }
          .rbud-print-report th,
          .rbud-print-report td {
            border: 1px solid #555 !important;
            padding: 4px 5px !important;
            font-size: 7px !important;
            line-height: 1.15 !important;
            vertical-align: top !important;
            word-break: break-word !important;
          }
          .rbud-print-report th {
            background: #e9e9e9 !important;
            font-weight: 700 !important;
            text-align: center !important;
          }
          .rbud-print-report .num { text-align: right !important; }
          .rbud-print-report .center { text-align: center !important; }
          .rbud-internal-audit-column { min-width: 88px; }\n          .rbud-print-report .rbud-internal-audit-column { display: none !important; }
        }
        @media screen {
          .rbud-print-report:not(.rbud-fee-monitoring-panel) { display: none; }
        }
      `}</style>

      {reportChoice !== "Fee Monitoring Report" && <div className="rbud-print-report">
        <SelectedRbudReport
          reportChoice={reportChoice}
          entries={entries}
          year={year}
          group={group}
          fund={fund}
        />
        <ReportSignatureBlock />
      </div>}

      {reportChoice === "Fee Monitoring Report" && <div className="rbud-print-report">
        <FeeMonitoringReport feeRows={feeRows} enrollmentRows={enrollmentRows} budgetReferences={budgetReferences} year={year} />
      </div>}

      {preview && (
        <div className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center p-5">
          <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#17135f]">{reportChoice} Preview</h2>
              <button type="button" onClick={closePreview} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5">
              <div className="border border-gray-200 rounded-xl p-5 overflow-x-auto">
                {reportChoice === "Fee Monitoring Report" ? (
                  <FeeMonitoringReport feeRows={feeRows} enrollmentRows={enrollmentRows} budgetReferences={budgetReferences} year={year} compact />
                ) : (
                  <SelectedRbudReport
                    reportChoice={reportChoice}
                    entries={entries}
                    year={year}
                    group={group}
                    fund={fund}
                  />
                )}
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


function RecordModal({ mode, record, form, setForm, references, role, onClose, onSubmit }) {
  const readOnly = mode === "view";
  const editableFields = getRbudEditableFields(role);
  const isEditable = (field) => mode !== "view" && editableFields.has(field);

  const update = (field, value) => {
    if (!isEditable(field)) return;
    setForm(current => ({ ...current, [field]: value }));
  };

  const selectOptions = (items, label = "name") =>
    (items || []).map(item => ({
      value: String(item.id),
      label: `${item.code ? `${item.code} — ` : ""}${item[label] || item.name || item.account_title || item.title || ""}`,
    }));

  // Fund Code is now a separate master-data level under Fund Cluster.
  // The dropdown only shows codes belonging to the selected cluster.
  const fundCodeOptions = (references.fund_codes || [])
    .filter((item) =>
      String(item?.fund_cluster_id ?? "") === String(form.fund_cluster_id ?? "")
    )
    .map((item) => ({
      value: String(item.code || ""),
      label: `${item.code ? `${item.code} — ` : ""}${item.name || item.code || ""}`,
    }))
    .filter((item) => item.value);

  // Keep an existing legacy transaction selectable during edit even if its
  // Fund Code is not yet present in the new master-data mapping.
  if (form.fund_code && !fundCodeOptions.some((item) => item.value === String(form.fund_code))) {
    fundCodeOptions.unshift({
      value: String(form.fund_code),
      label: `${form.fund_code} — Existing Transaction`,
    });
  }

  const updateFundCode = (fundCode) => {
    if (!isEditable("fund_code")) return;

    setForm((current) => ({
      ...current,
      fund_code: String(fundCode || ""),
    }));
  };

  const updateFundCluster = (fundClusterId) => {
    if (!isEditable("fund_cluster_id")) return;

    const selectedCluster = (references.fund_clusters || []).find(
      (item) => String(item.id) === String(fundClusterId)
    );

    const linkedFundSource = selectedCluster?.fund_source_id
      ? (references.fund_sources || []).find(
          (item) => String(item.id) === String(selectedCluster.fund_source_id)
        )
      : null;

    setForm((current) => ({
      ...current,
      fund_cluster_id: fundClusterId,
      // Changing the cluster invalidates the previous dependent Fund Code.
      fund_code: "",
      ...(linkedFundSource
        ? { fund_source_id: String(linkedFundSource.id) }
        : { fund_source_id: "" }),
    }));
  };

  /*
   * View-mode display helper.
   * The RBUD detail API normally returns joined names/codes. For older
   * records, however, a JOIN value can be empty while the underlying FK
   * still exists. These helpers fall back to the loaded Master Data so
   * the View modal does not unnecessarily show blank fields.
   */
  const firstValue = (...values) => {
    for (const value of values) {
      if (value !== null && value !== undefined && String(value).trim() !== "") {
        return value;
      }
    }
    return "—";
  };

  const referenceLabel = (items, id, ...fallbackValues) => {
    const idText = id !== null && id !== undefined && id !== "" ? String(id) : "";
    const found = (items || []).find(item => String(item?.id ?? "") === idText);

    if (found) {
      return firstValue(
        found.code && found.name ? `${found.code} — ${found.name}` : "",
        found.name,
        found.account_title,
        found.title,
        found.description,
        found.code
      );
    }

    return firstValue(...fallbackValues);
  };

  const Detail = ({ label, value }) => (
    <DetailField label={label} value={firstValue(value)} />
  );

  if (readOnly) {
    const fundCluster = firstValue(
      record?.fund_cluster_code && record?.fund_cluster_name
        ? `${record.fund_cluster_code} — ${record.fund_cluster_name}`
        : "",
      record?.fund_cluster_code,
      record?.fund_cluster_name,
      referenceLabel(
        references?.fund_clusters,
        record?.fund_cluster_id,
        record?.fund_cluster
      )
    );

    const fundSource = firstValue(
      record?.fund_source_code && record?.fund_source_name
        ? `${record.fund_source_code} — ${record.fund_source_name}`
        : "",
      record?.fund_source_code,
      record?.fund_source_name,
      referenceLabel(
        references?.fund_sources,
        record?.fund_source_id,
        record?.fund_source
      )
    );

    const campus = firstValue(
      record?.campus_code && record?.campus_name
        ? `${record.campus_code} — ${record.campus_name}`
        : "",
      record?.campus_code,
      record?.campus_name,
      referenceLabel(references?.campuses, record?.campus_id)
    );

    const responsibilityCenter = firstValue(
      record?.responsibility_center_code && record?.responsibility_center_name
        ? `${record.responsibility_center_code} — ${record.responsibility_center_name}`
        : "",
      record?.responsibility_center_code,
      record?.responsibility_center_name,
      record?.department_name,
      referenceLabel(
        references?.responsibility_centers,
        record?.responsibility_center_id
      )
    );

    const pap = firstValue(
      record?.pap_code && record?.pap_name
        ? `${record.pap_code} — ${record.pap_name}`
        : "",
      record?.pap_code,
      record?.pap_name,
      referenceLabel(references?.pap, record?.pap_id)
    );

    const uacs = firstValue(
      record?.uacs_code,
      referenceLabel(references?.uacs_codes, record?.uacs_code_id)
    );

    const allotmentClass = firstValue(
      record?.allotment_class_code && record?.allotment_class_name
        ? `${record.allotment_class_code} — ${record.allotment_class_name}`
        : "",
      record?.allotment_class_code,
      record?.allotment_class_name,
      referenceLabel(
        references?.allotment_classes,
        record?.allotment_class_id
      )
    );

    const mfo = firstValue(
      record?.mfo_code && record?.mfo_name
        ? `${record.mfo_code} — ${record.mfo_name}`
        : "",
      record?.mfo_code,
      record?.mfo_name,
      referenceLabel(references?.mfo, record?.mfo_id)
    );

    const wfpSource = firstValue(
      record?.wfp_source_code && record?.wfp_source_name
        ? `${record.wfp_source_code} — ${record.wfp_source_name}`
        : "",
      record?.wfp_source_code,
      record?.wfp_source_name,
      referenceLabel(references?.wfp_sources, record?.wfp_source_id)
    );

    const oldUacsCode = firstValue(
      record?.old_uacs_code,
      record?.old_uacs_code_code,
      record?.uacs_old_code,
      referenceLabel(references?.uacs_codes, record?.old_uacs_code_id)
    );

    return (
      <Modal title="RBUD Transaction Details" onClose={onClose}>
        <div className="space-y-5">
          <div>
            <h3 className="text-xs font-bold text-[#17135f] mb-3">Registry Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Detail label="Registry No." value={record?.registry_no} />
              <Detail label="Date" value={dateLabel(record?.entry_date)} />
              <Detail label="Fiscal Year" value={record?.fiscal_year} />
              <Detail label="Fund Cluster" value={fundCluster} />
              <Detail label="Fund Code" value={record?.fund_code} />
              <Detail label="Fund Source" value={fundSource} />
              <Detail label="Fund Group" value={record?.fund_group} />
              <Detail label="Department" value={record?.department || record?.department_name} />
              <Detail label="Campus" value={campus} />
              <Detail label="BURS Serial No." value={record?.burs_serial_no} />
              <Detail label="Serial No. Transferred From/To" value={record?.serial_no_transferred} />
              <Detail label="Payee / Name" value={record?.payee} />
              <Detail label="Particulars / Description" value={record?.particulars} />
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-[#17135f] mb-3">Classification / Reference</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Detail label="Responsibility Center" value={responsibilityCenter} />
              <Detail label="PAP" value={pap} />
              <Detail label="UACS Code" value={uacs} />
              <Detail label="Ref. No." value={record?.ref_no} />
              <Detail label="Allotment Class" value={allotmentClass} />
              <Detail label="UACS Funding Source Code" value={record?.uacs_funding_source_code} />
              <Detail label="Year" value={record?.fiscal_year || (record?.entry_date ? new Date(record.entry_date).getFullYear() : "—")} />
              <Detail label="Month" value={record?.month || (record?.entry_date ? new Date(record.entry_date).toLocaleString("en-US", { month: "long" }) : "—")} />
              <Detail label="Series" value={record?.series} />
              <Detail label="Series2" value={record?.series2} />
              <Detail label="Quarter" value={record?.quarter || (record?.entry_date ? `Q${Math.ceil((new Date(record.entry_date).getMonth() + 1) / 3)}` : "—")} />
              <Detail label="MFO" value={mfo} />
              <Detail label="Old UACS Code" value={oldUacsCode || record?.old_uacs_code_id} />
              <Detail label="Accounts Title" value={record?.account_title || record?.uacs_account_title || referenceLabel(references?.uacs_codes, record?.uacs_code_id)} />
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-[#17135f] mb-3">Utilization / Disbursement</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Detail label="Utilization" value={money(record?.utilization_amount)} />
              <Detail label="PS" value={money(record?.ps_utilization)} />
              <Detail label="MOOE" value={money(record?.mooe_utilization)} />
              <Detail label="CO" value={money(record?.co_utilization)} />
              <Detail label="WFP Source" value={wfpSource} />
              <Detail label="WFP Source Code" value={record?.wfp_source_code || record?.wfp_source_master_code} />
              <Detail label="Disbursement Amount" value={money(record?.disbursement_amount)} />
              <Detail label="Running Balance" value={money(record?.running_balance)} />
              <Detail label="Remarks" value={record?.remarks} />
              <Detail label="Unpaid Utilization" value={money(record?.unpaid_utilization)} />
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-[#17135f] mb-3">Record Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Detail label="System Status" value={record?.status || record?.derived_status} />
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-[#17135f] mb-3">Record Tracking</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Detail
                label="Entered By"
                value={
                  record?.created_by_name
                    ? `${record.created_by_name}${record.created_by_role ? ` (${record.created_by_role})` : ""}`
                    : "—"
                }
              />
              <Detail
                label="Updated By"
                value={
                  record?.updated_by_name
                    ? `${record.updated_by_name}${record.updated_by_role ? ` (${record.updated_by_role})` : ""}`
                    : "—"
                }
              />
            </div>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title={mode==="edit" ? "Edit RBUD Transaction" : "Add RBUD Transaction"} onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2 text-[10px] text-indigo-800">
          <span className="font-bold">Role-based editing:</span>{" "}
          {role === "Administration"
            ? "You can manage all RBUD fields."
            : role === "Budget"
              ? "You can manage the operational RBUD fields."
              : "This record is read-only for your role."}
        </div>
        <div><h3 className="text-xs font-bold text-[#17135f] mb-3">Registry Information</h3><div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-lg border border-blue-100 bg-blue-50/60 px-3 py-2"><div className="text-[10px] font-bold text-slate-500">Registry No.</div><div className="mt-1 font-mono text-sm font-extrabold text-[#17135f]">{mode==="edit"&&record?.registry_no?record.registry_no:"Generated after saving"}</div><div className="text-[10px] text-slate-500">System-generated • locked</div></div>
          <InputField label="Date" type="date" value={form.entry_date} disabled={!isEditable("entry_date")} onChange={v=>update("entry_date",v)} required/>
          <InputField label="Year" type="number" value={form.fiscal_year} disabled={!isEditable("fiscal_year")} onChange={v=>update("fiscal_year",v)}/>
          <SelectField
            label="Fund Cluster"
            value={form.fund_cluster_id}
            disabled={!isEditable("fund_cluster_id")}
            onChange={updateFundCluster}
            options={selectOptions(references.fund_clusters)}
          />
          <SelectField
            label="Fund Code"
            value={form.fund_code}
            disabled={!form.fund_cluster_id || !isEditable("fund_code")}
            onChange={updateFundCode}
            options={fundCodeOptions}
          />
          <SelectField label="Campus" value={form.campus_id} disabled={!isEditable("campus_id")} onChange={v=>update("campus_id",v)} options={selectOptions(references.campuses)}/>
          <div className="rounded-lg border border-blue-100 bg-blue-50/60 px-3 py-2"><div className="text-[10px] font-bold text-slate-500">BURS Serial No.</div><div className="mt-1 font-mono text-sm font-extrabold text-[#17135f]">{mode==="edit"&&record?.burs_serial_no?record.burs_serial_no:"Generated after saving"}</div><div className="text-[10px] text-slate-500">System-generated • locked</div></div>
          <InputField label="Serial No. Transferred From/To" value={form.serial_no_transferred} disabled={!isEditable("serial_no_transferred")} onChange={v=>update("serial_no_transferred",v)} placeholder="NA / N/A if not applicable"/>
          <InputField label="Payee / Name" value={form.payee} disabled={!isEditable("payee")} onChange={v=>update("payee",v)}/>
          <div className="md:col-span-3"><TextAreaField label="Particulars / Description" value={form.particulars} disabled={!isEditable("particulars")} onChange={v=>update("particulars",v)}/></div>
        </div></div>

        <div><h3 className="text-xs font-bold text-[#17135f] mb-3">Classification / Reference</h3><div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <SelectField label="Responsibility Center" value={form.responsibility_center_id} disabled={!isEditable("responsibility_center_id")} onChange={v=>update("responsibility_center_id",v)} options={selectOptions(references.responsibility_centers)}/>
          <SelectField label="PAP" value={form.pap_id} disabled={!isEditable("pap_id")} onChange={v=>update("pap_id",v)} options={selectOptions(references.pap)}/>
          <SelectField label="UACS Code" value={form.uacs_code_id} disabled={!isEditable("uacs_code_id")} onChange={v=>update("uacs_code_id",v)} options={selectOptions(references.uacs_codes,"account_title")}/>
          <InputField label="Ref. No." value={form.ref_no} disabled={!isEditable("ref_no")} onChange={v=>update("ref_no",v)}/>
          <SelectField label="Allotment Class" value={form.allotment_class_id} disabled={!isEditable("allotment_class_id")} onChange={v=>update("allotment_class_id",v)} options={selectOptions(references.allotment_classes)}/>
          <SelectField label="MFO" value={form.mfo_id} disabled={!isEditable("mfo_id")} onChange={v=>update("mfo_id",v)} options={selectOptions(references.mfo)}/>
          <div className="rounded-lg border border-blue-100 bg-blue-50/60 px-3 py-2"><div className="text-[10px] font-bold text-blue-700">Month</div><div className="mt-1 text-sm font-extrabold text-[#17135f]">{form.entry_date ? new Date(`${form.entry_date}T00:00:00`).getMonth() + 1 : "—"}</div><div className="text-[10px] text-slate-400">Auto-filled from Date</div></div>
          <div className="rounded-lg border border-blue-100 bg-blue-50/60 px-3 py-2"><div className="text-[10px] font-bold text-blue-700">Quarter</div><div className="mt-1 text-sm font-extrabold text-[#17135f]">{form.entry_date ? `Q${Math.ceil((new Date(`${form.entry_date}T00:00:00`).getMonth() + 1) / 3)}` : "—"}</div><div className="text-[10px] text-slate-400">Auto-filled from Date</div></div>
        </div></div>

        <div><h3 className="text-xs font-bold text-[#17135f] mb-3">Utilization / Disbursement</h3><div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <InputField label="Utilization" type="number" value={form.utilization_amount} disabled={!isEditable("utilization_amount")} onChange={v=>update("utilization_amount",v)}/>
          <InputField label="PS" type="number" value={form.ps_utilization} disabled={!isEditable("ps_utilization")} onChange={v=>update("ps_utilization",v)}/>
          <InputField label="MOOE" type="number" value={form.mooe_utilization} disabled={!isEditable("mooe_utilization")} onChange={v=>update("mooe_utilization",v)}/>
          <InputField label="CO" type="number" value={form.co_utilization} disabled={!isEditable("co_utilization")} onChange={v=>update("co_utilization",v)}/>
          <SelectField label="WFP Source" value={form.wfp_source_id} disabled={!isEditable("wfp_source_id")} onChange={v=>update("wfp_source_id",v)} options={selectOptions(references.wfp_sources)}/>
          <InputField label="Disbursement Amount" type="number" value={form.disbursement_amount} disabled={!isEditable("disbursement_amount")} onChange={v=>update("disbursement_amount",v)}/>
          <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2"><div className="text-[10px] font-semibold text-blue-700">Running Balance</div><div className="mt-1 text-sm font-extrabold text-[#17135f]">{mode==="edit"?money(record?.running_balance):"Calculated after saving"}</div></div>
          <div className="md:col-span-2"><TextAreaField label="Remarks" value={form.remarks} disabled={!isEditable("remarks")} onChange={v=>update("remarks",v)}/></div>
          <div className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2">
            <div className="text-[10px] font-semibold text-amber-700">Unpaid Utilization</div>
            <div className="mt-1 text-sm font-extrabold text-[#17135f]">{mode === "edit" ? money(record?.unpaid_utilization) : "Calculated after saving"}</div>
            <div className="text-[10px] text-slate-400">Utilization less Disbursement</div>
          </div>
        </div></div>

        <div className="flex justify-end gap-2 pt-3 border-t border-gray-100"><button type="button" onClick={onClose} className="h-9 px-4 rounded-lg border border-gray-200 text-xs font-semibold">Cancel</button><button type="submit" disabled={mode === "view" || (mode === "add" && !canCreateRbudRole(role)) || (mode === "edit" && !canEditRbudRole(role))} className="h-9 px-4 rounded-lg bg-[#211b79] text-white text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed">{mode==="edit"?"Save Changes":"Save Transaction"}</button></div>
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

function Select({ label, value, onChange, options = [], disabled = false }) {
  const normalizedValue =
    value && typeof value === "object" ? value.value : value;

  return (
    <div>
      <label className="block text-[10px] font-semibold text-gray-500 mb-1">{label}</label>
      <select
        value={normalizedValue ?? ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`w-full h-9 border border-gray-200 rounded-lg px-3 text-xs outline-none ${
          disabled ? "bg-gray-100 text-gray-500 cursor-not-allowed" : "bg-white"
        }`}
      >
        <option value="">Select {label}</option>
        {options.map((option) => {
          const item =
            typeof option === "object"
              ? option
              : { value: option, label: option };
          return (
            <option key={String(item.value)} value={String(item.value)}>
              {item.label}
            </option>
          );
        })}
      </select>
    </div>
  );
}

function TextAreaField({ label, value, onChange, required = false, disabled = false }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
      <textarea
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        disabled={disabled}
        rows={4}
        className={`w-full min-h-[92px] rounded-lg border border-gray-200 px-3 py-2 text-xs outline-none ${
          disabled ? "bg-gray-100 text-gray-500 cursor-not-allowed" : "bg-white focus:border-[#211b79] focus:ring-2 focus:ring-[#211b79]/10"
        }`}
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options, disabled = false }) {
  return <Select label={label} value={value} onChange={onChange} options={options} disabled={disabled} />;
}

function InputField({ label, value, onChange, type = "text", required = false, disabled = false }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
      <input
        type={type}
        value={value ?? ""}
        required={required}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full h-10 border border-gray-200 rounded-lg px-3 text-xs outline-none ${
          disabled ? "bg-gray-100 text-gray-500 cursor-not-allowed" : "bg-white focus:border-[#211b79]"
        }`}
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