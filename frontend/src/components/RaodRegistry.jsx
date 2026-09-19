// frontend/src/components/RaodRegistry.jsx
// Complete RAOD Registry module.
// The nine dashboard cards are internal views; the Layout header/sidebar remains the system navigation.

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Layout from "./layout/Layout";
import { API_URL } from "../config/api";
import Toast from "./Toast";
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Database,
  Download,
  Eye,
  FileBarChart,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  Landmark,
  List,
  Pencil,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Settings2,
  Table2,
  Trash2,
  WalletCards,
  X,
} from "lucide-react";

const FY = 2026;
const LIMIT = 10;
const money = (v) =>
  `₱${Number(v || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const dateText = (v) => {
  if (!v) return "—";
  const d = new Date(`${String(v).slice(0, 10)}T00:00:00`);
  return Number.isNaN(d.getTime())
    ? String(v)
    : d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
};

const pct = (a, b) => (Number(b) > 0 ? (Number(a || 0) / Number(b)) * 100 : 0);

const emptyForm = {
  // RAOD General Fund Input Data — matches the 37 Excel fields.
  registry_no: "",
  entry_date: new Date().toISOString().slice(0, 10),
  fund_cluster_id: "",
  fund_source_id: "",
  campus_id: "",
  ors_serial_no: "",
  serial_no_transferred: "",
  payee: "",
  particulars: "",
  responsibility_center_id: "",
  pap_id: "",
  uacs_code_id: "",
  ref_no: "",
  allotment_class_id: "",
  uacs_funding_source_code: "",
  fiscal_year: FY,
  month: "",
  series: "",
  series2: "",
  quarter: "",
  object_expenditure_id: "",
  mfo_id: "",
  old_uacs_code_id: "",
  account_title: "",
  obligation_amount: "",
  ps_amount: "",
  mooe_amount: "",
  co_amount: "",
  wfp_source_id: "",
  wfp_source_code: "",
  dv_payroll_no: "",
  disbursement_amount: "",
  remarks: "",
  unpaid_obligation: "",
  po_no: "",
  status_of_po: "",

  // Legacy DB compatibility. The Excel RAOD Input Data uses ORS, not BURS.
  // This is kept only so older backend/database records remain compatible.
  allotment_amount: "",
  dv_no: "",
  burs_serial_no: "",
};

const cardData = [
  ["overview", "1. Overview", "View summary of allotments, obligations, disbursements, and balances.", "bg-blue-600", WalletCards],
  ["allotment-obligation", "2. Allotment & Obligation", "Manage allotments received, obligations, and remaining balances.", "bg-emerald-500", BarChart3],
  ["fund-registry", "3. Fund Registries", "View and manage RAOD records by fund and funding source.", "bg-violet-600", FolderOpen],
  ["transactions", "4. RAOD Transactions", "Record, edit, and manage allotment, obligation, and disbursement entries.", "bg-orange-500", FileText],
  ["monitoring", "5. Disbursement & Balance", "Monitor disbursements and compare allotment, obligation, and available balances.", "bg-teal-500", BarChart3],
  ["fund-rc-breakdown", "6. Fund / RC Breakdown", "View detailed RAOD breakdown by fund and responsibility center.", "bg-amber-500", Database],
  ["financial-reports", "7. Financial Accountability Reports", "Generate and preview official RAOD accountability reports.", "bg-red-500", FileBarChart],
  ["master-data", "8. Reference / Master Data", "Manage reference data used by the RAOD registry.", "bg-blue-600", Database],
  ["reports-export", "9. Reports & Export", "Export official RAOD reports to Excel, PDF, or print.", "bg-emerald-500", Download],
];

function SectionTitle({ title, text, action }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div>
        <h2 className="text-base font-extrabold text-[#10245b]">{title}</h2>
        {text && <p className="mt-0.5 text-[11px] text-slate-500">{text}</p>}
      </div>
      {action}
    </div>
  );
}

function Metric({ label, value, icon: Icon, className = "bg-blue-50 text-blue-700" }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
          <p className="mt-2 text-[17px] font-extrabold text-slate-800">{value}</p>
        </div>
        <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${className}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
    </div>
  );
}

function CardButton({ item, onClick }) {
  const [id, title, desc, color, Icon] = item;
  return (
    <button
      type="button"
      onClick={() => onClick(id)}
      className="group min-h-[145px] rounded-xl border border-slate-100 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
    >
      <div className="flex items-start gap-3">
        <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white ${color}`}>
          <Icon className="h-6 w-6" />
        </span>
        <div className="min-w-0">
          <h3 className="text-[13px] font-extrabold text-slate-800">{title}</h3>
          <p className="mt-1 text-[10px] leading-4 text-slate-500">{desc}</p>
        </div>
      </div>
      <span className="mt-4 inline-flex items-center text-[10px] font-bold text-[#1d4ed8]">
        Open module <ArrowRight className="ml-1 h-3 w-3 transition group-hover:translate-x-0.5" />
      </span>
    </button>
  );
}

function BackBar({ title, onBack }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[10px] font-bold text-slate-600 hover:bg-slate-50"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to RAOD Module
      </button>
      <h2 className="text-base font-extrabold text-[#10245b]">{title}</h2>
    </div>
  );
}

function Table({ columns, rows, empty = "No records found." }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white shadow-sm">
      <table className="min-w-full text-left">
        <thead>
          <tr className="bg-[#102b67] text-[9px] font-bold uppercase tracking-wide text-white">
            {columns.map((c) => <th key={c.key} className="whitespace-nowrap px-3 py-3">{c.label}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.length ? rows.map((r, i) => (
            <tr key={r.id ?? i} className="text-[10px] text-slate-700 hover:bg-slate-50">
              {columns.map((c) => <td key={c.key} className="whitespace-nowrap px-3 py-3">{c.render ? c.render(r) : (r[c.key] ?? "—")}</td>)}
            </tr>
          )) : (
            <tr><td colSpan={columns.length} className="px-4 py-10 text-center text-[11px] text-slate-400">{empty}</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function Status({ value }) {
  const s = String(value || "RECORDED").toUpperCase();
  const cls =
    s === "DISBURSED" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
    s === "OBLIGATION" ? "bg-amber-50 text-amber-700 border-amber-100" :
    "bg-slate-50 text-slate-600 border-slate-200";
  return <span className={`rounded-md border px-2 py-1 text-[9px] font-bold ${cls}`}>{s}</span>;
}

function Modal({ title, children, onClose, wide = false }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className={`max-h-[92vh] w-full overflow-y-auto rounded-2xl bg-white shadow-2xl ${wide ? "max-w-5xl" : "max-w-2xl"}`}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4">
          <h3 className="text-sm font-extrabold text-[#10245b]">{title}</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-[9px] font-bold uppercase tracking-wide text-slate-500">{label}</span>
      {children}
    </label>
  );
}

function Input({ ...props }) {
  return <input {...props} className={`h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-[10px] text-slate-700 outline-none focus:border-blue-400 ${props.className || ""}`} />;
}

function Select({ children, ...props }) {
  return <select {...props} className={`h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-[10px] text-slate-700 outline-none focus:border-blue-400 ${props.className || ""}`}>{children}</select>;
}

function TransactionForm({ refs, form, setForm, onSubmit, saving, onClose }) {
  const set = (k, v) => setForm((x) => ({ ...x, [k]: v }));
  const options = (list) => (Array.isArray(list) ? list : []);

  const oldUacsOptions = useMemo(
    () => options(refs.uacs_codes).filter((x) => x.old_code),
    [refs.uacs_codes]
  );

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {/* 1–5: Registry / fund identification */}
      <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
        <p className="mb-3 text-[10px] font-extrabold uppercase tracking-wide text-blue-700">
          RAOD Registry Identification
        </p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Field label="Registry No.">
            <Input required value={form.registry_no} onChange={e => set("registry_no", e.target.value)} />
          </Field>
          <Field label="Date">
            <Input required type="date" value={form.entry_date} onChange={e => set("entry_date", e.target.value)} />
          </Field>
          <Field label="Fund Cluster">
            <Select value={form.fund_cluster_id} onChange={e => set("fund_cluster_id", e.target.value)}>
              <option value="">Select</option>
              {options(refs.fund_clusters).map(x => (
                <option key={x.id} value={x.id}>{x.code} — {x.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Fund Code">
            <Select value={form.fund_source_id} onChange={e => set("fund_source_id", e.target.value)}>
              <option value="">Select</option>
              {options(refs.fund_sources).map(x => (
                <option key={x.id} value={x.id}>{x.code} — {x.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Campus">
            <Select value={form.campus_id} onChange={e => set("campus_id", e.target.value)}>
              <option value="">Select</option>
              {options(refs.campuses).map(x => (
                <option key={x.id} value={x.id}>{x.code} — {x.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Fiscal Year">
            <Input type="number" value={form.fiscal_year} onChange={e => set("fiscal_year", e.target.value)} />
          </Field>
        </div>
      </div>

      {/* 6–13: transaction/reference fields */}
      <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
        <p className="mb-3 text-[10px] font-extrabold uppercase tracking-wide text-slate-500">
          Transaction and Reference Information
        </p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Field label="ORS Serial No.">
            <Input value={form.ors_serial_no} onChange={e => set("ors_serial_no", e.target.value)} />
          </Field>
          <Field label="Serial No. Transferred From/To">
            <Input value={form.serial_no_transferred} onChange={e => set("serial_no_transferred", e.target.value)} />
          </Field>
          <Field label="Payee / Name">
            <Input value={form.payee} onChange={e => set("payee", e.target.value)} />
          </Field>
          <Field label="Responsibility Center">
            <Select value={form.responsibility_center_id} onChange={e => set("responsibility_center_id", e.target.value)}>
              <option value="">Select</option>
              {options(refs.responsibility_centers).map(x => (
                <option key={x.id} value={x.id}>{x.code} — {x.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="PAP / DEPT.">
            <Select value={form.pap_id} onChange={e => set("pap_id", e.target.value)}>
              <option value="">Select</option>
              {options(refs.pap).map(x => (
                <option key={x.id} value={x.id}>{x.code} — {x.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="UACS Code">
            <Select value={form.uacs_code_id} onChange={e => set("uacs_code_id", e.target.value)}>
              <option value="">Select</option>
              {options(refs.uacs_codes).map(x => (
                <option key={x.id} value={x.id}>{x.code} — {x.account_title || x.revised_description || ""}</option>
              ))}
            </Select>
          </Field>
          <Field label="Ref. No.">
            <Input value={form.ref_no} onChange={e => set("ref_no", e.target.value)} />
          </Field>
          <Field label="Allotment Class">
            <Select value={form.allotment_class_id} onChange={e => set("allotment_class_id", e.target.value)}>
              <option value="">Select</option>
              {options(refs.allotment_classes).map(x => (
                <option key={x.id} value={x.id}>{x.code} — {x.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="UACS Funding Source Code">
            <Input value={form.uacs_funding_source_code} onChange={e => set("uacs_funding_source_code", e.target.value)} />
          </Field>
          <Field label="Object of Expenditure">
            <Select value={form.object_expenditure_id} onChange={e => set("object_expenditure_id", e.target.value)}>
              <option value="">Select</option>
              {options(refs.object_expenditures).map(x => (
                <option key={x.id} value={x.id}>{x.code} — {x.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="MFO">
            <Select value={form.mfo_id} onChange={e => set("mfo_id", e.target.value)}>
              <option value="">Select</option>
              {options(refs.mfo).map(x => (
                <option key={x.id} value={x.id}>{x.code} — {x.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Old UACS Code">
            <Select value={form.old_uacs_code_id} onChange={e => set("old_uacs_code_id", e.target.value)}>
              <option value="">Select</option>
              {oldUacsOptions.map(x => (
                <option key={x.id} value={x.id}>{x.old_code} — {x.account_title || x.code}</option>
              ))}
            </Select>
          </Field>
          <Field label="Accounts Title">
            <Input value={form.account_title} onChange={e => set("account_title", e.target.value)} />
          </Field>
        </div>
      </div>

      {/* 9: particulars */}
      <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
        <Field label="Particulars / Description">
          <textarea
            value={form.particulars}
            onChange={e => set("particulars", e.target.value)}
            className="min-h-20 w-full rounded-lg border border-slate-200 px-3 py-2 text-[10px] outline-none focus:border-blue-400"
          />
        </Field>
      </div>

      {/* 16–24: period and classification */}
      <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
        <p className="mb-3 text-[10px] font-extrabold uppercase tracking-wide text-slate-500">
          Period and Classification
        </p>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <Field label="Year">
            <Input type="number" value={form.fiscal_year} onChange={e => set("fiscal_year", e.target.value)} />
          </Field>
          <Field label="Month">
            <Input type="number" min="1" max="12" value={form.month} onChange={e => set("month", e.target.value)} />
          </Field>
          <Field label="Series">
            <Input value={form.series} onChange={e => set("series", e.target.value)} />
          </Field>
          <Field label="Series2">
            <Input value={form.series2} onChange={e => set("series2", e.target.value)} />
          </Field>
          <Field label="Quarter">
            <Input type="number" min="1" max="4" value={form.quarter} onChange={e => set("quarter", e.target.value)} />
          </Field>
        </div>
      </div>

      {/* 25–28: actual RAOD financial amounts */}
      <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4">
        <p className="mb-3 text-[10px] font-extrabold uppercase tracking-wide text-emerald-700">
          Obligation and Disbursement
        </p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <Field label="Obligation">
            <Input type="number" step="0.01" value={form.obligation_amount} onChange={e => set("obligation_amount", e.target.value)} />
          </Field>
          <Field label="PS">
            <Input type="number" step="0.01" value={form.ps_amount} onChange={e => set("ps_amount", e.target.value)} />
          </Field>
          <Field label="MOOE">
            <Input type="number" step="0.01" value={form.mooe_amount} onChange={e => set("mooe_amount", e.target.value)} />
          </Field>
          <Field label="CO">
            <Input type="number" step="0.01" value={form.co_amount} onChange={e => set("co_amount", e.target.value)} />
          </Field>
          <Field label="Disbursement">
            <Input type="number" step="0.01" value={form.disbursement_amount} onChange={e => set("disbursement_amount", e.target.value)} />
          </Field>
          <Field label="Unpaid Obligation">
            <Input type="number" step="0.01" value={form.unpaid_obligation} onChange={e => set("unpaid_obligation", e.target.value)} />
          </Field>
          {/* Excel #33 "Balances" is presented as the calculated remaining allotment. */}
          <Field label="Balances">
            <Input
              type="number"
              step="0.01"
              value={Math.max(0, Number(form.allotment_amount || 0) - Number(form.obligation_amount || 0))}
              readOnly
            />
          </Field>

          {/* Kept because the existing RAOD DB/view uses this legacy field. */}
          <Field label="Allotment (Legacy DB)">
            <Input type="number" step="0.01" value={form.allotment_amount} onChange={e => set("allotment_amount", e.target.value)} />
          </Field>
        </div>
      </div>

      {/* 29–37 */}
      <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
        <p className="mb-3 text-[10px] font-extrabold uppercase tracking-wide text-slate-500">
          WFP, Disbursement and Purchase Order Information
        </p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <Field label="WFP Source">
            <Select value={form.wfp_source_id} onChange={e => set("wfp_source_id", e.target.value)}>
              <option value="">Select</option>
              {options(refs.wfp_sources).map(x => (
                <option key={x.id} value={x.id}>{x.code} — {x.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="WFP Source Code">
            <Input value={form.wfp_source_code} onChange={e => set("wfp_source_code", e.target.value)} />
          </Field>
          <Field label="DV / Payroll No.">
            <Input
              value={form.dv_payroll_no}
              onChange={e => {
                set("dv_payroll_no", e.target.value);
                set("dv_no", e.target.value);
              }}
            />
          </Field>
          <Field label="PO No.">
            <Input value={form.po_no} onChange={e => set("po_no", e.target.value)} />
          </Field>
          <Field label="Status of PO">
            <Select value={form.status_of_po} onChange={e => set("status_of_po", e.target.value)}>
              <option value="">Select</option>
              <option value="PENDING">PENDING</option>
              <option value="APPROVED">APPROVED</option>
              <option value="ISSUED">ISSUED</option>
              <option value="PARTIALLY DELIVERED">PARTIALLY DELIVERED</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELLED">CANCELLED</option>
            </Select>
          </Field>
          <Field label="Remarks" className="md:col-span-3">
            <textarea
              value={form.remarks}
              onChange={e => set("remarks", e.target.value)}
              className="min-h-16 w-full rounded-lg border border-slate-200 px-3 py-2 text-[10px] outline-none focus:border-blue-400"
            />
          </Field>
        </div>
      </div>

      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
        <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-[10px] font-bold text-slate-600">
          Cancel
        </button>
        <button
          disabled={saving}
          className="rounded-lg bg-[#174fd1] px-4 py-2 text-[10px] font-bold text-white disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save RAOD Record"}
        </button>
      </div>
    </form>
  );
}

function RaodRegistry({ user, onLogout, onNavigate, activePath }) {
  const token = localStorage.getItem("token") || "";
  const [view, setView] = useState("home");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [refs, setRefs] = useState({
    fund_clusters: [], fund_sources: [], campuses: [], responsibility_centers: [],
    pap: [], uacs_codes: [], object_expenditures: [], allotment_classes: [],
    wfp_sources: [], mfo: [],
  });
  const [overview, setOverview] = useState({});
  const [entries, setEntries] = useState([]);
  const [pagination, setPagination] = useState({ totalItems: 0, totalPages: 1, currentPage: 1 });
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [modal, setModal] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [moduleData, setModuleData] = useState({});
  const [reportType, setReportType] = useState("FAR 1");
  const [masterTab, setMasterTab] = useState("fund_clusters");
  const [fundTab, setFundTab] = useState("overview");
  const [allotTab, setAllotTab] = useState("summary");

  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const fetchJson = useCallback(async (url, options = {}) => {
    const r = await fetch(url, { ...options, headers: { ...headers, ...(options.headers || {}) } });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || d.message || "Request failed.");
    return d;
  }, [headers]);

  const loadRefs = useCallback(async () => {
    const d = await fetchJson(`${API_URL}/raod/reference-data`);
    setRefs(d);
  }, [fetchJson]);

  const loadOverview = useCallback(async () => {
    const d = await fetchJson(`${API_URL}/raod/overview?fiscal_year=${FY}`);
    setOverview(d);
  }, [fetchJson]);

  const loadEntries = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ page: String(p), limit: String(LIMIT), fiscal_year: String(FY) });
      if (search.trim()) q.set("search", search.trim());
      if (dateFrom) q.set("date_from", dateFrom);
      if (dateTo) q.set("date_to", dateTo);
      if (activeTab === "obligations") q.set("transaction_type", "obligations");
      if (activeTab === "disbursements") q.set("transaction_type", "disbursements");
      if (activeTab === "balance") q.set("transaction_type", "balance");
      const d = await fetchJson(`${API_URL}/raod?${q}`);
      setEntries(d.entries || []);
      setPagination({ totalItems: d.totalItems || 0, totalPages: d.totalPages || 1, currentPage: d.currentPage || p });
      setPage(d.currentPage || p);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [fetchJson, search, dateFrom, dateTo, activeTab]);

  const loadModule = useCallback(async (name) => {
    if (name === "transactions") return;
    try {
      const endpoint = name === "overview" ? "overview" : name;
      const d = await fetchJson(`${API_URL}/raod/module/${endpoint}?fiscal_year=${FY}`);
      setModuleData(d);
    } catch (e) {
      setError(e.message);
    }
  }, [fetchJson]);

  useEffect(() => {
    Promise.all([loadRefs(), loadOverview()]).catch(e => setError(e.message));
  }, [loadRefs, loadOverview]);

  useEffect(() => {
    if (view === "transactions" || view === "home") loadEntries(1);
  }, [view, loadEntries]);

  useEffect(() => {
    if (view !== "home" && view !== "transactions") loadModule(view);
  }, [view, loadModule]);

  const openView = (name) => {
    setView(name);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const backHome = () => setView("home");

  const generalCluster = useMemo(
    () => refs.fund_clusters.find(x => String(x.code) === "101"),
    [refs.fund_clusters]
  );
  const generalSource = useMemo(
    () => refs.fund_sources.find(x => String(x.code) === "101"),
    [refs.fund_sources]
  );

  const openAdd = () => {
    setEditing(null);
    setForm({
      ...emptyForm,
      fund_cluster_id: generalCluster?.id ? String(generalCluster.id) : "",
      fund_source_id: generalSource?.id ? String(generalSource.id) : "",
    });
    setModal("form");
  };

  const openEdit = (row) => {
    const f = { ...emptyForm };
    Object.keys(f).forEach(k => { f[k] = row[k] ?? ""; });
    ["fund_cluster_id","fund_source_id","campus_id","responsibility_center_id","pap_id","uacs_code_id","allotment_class_id","wfp_source_id","object_expenditure_id","mfo_id","old_uacs_code_id","month","quarter"]
      .forEach(k => { f[k] = row[k] === null || row[k] === undefined ? "" : String(row[k]); });
    f.dv_payroll_no = row.dv_payroll_no ?? row.dv_no ?? "";
    f.dv_no = row.dv_no ?? row.dv_payroll_no ?? "";
    f.status_of_po = row.status_of_po ?? "";
    f.running_balance = row.running_balance ?? "";
    f.entry_date = row.entry_date ? String(row.entry_date).slice(0, 10) : "";
    setEditing(row);
    setForm(f);
    setModal("form");
  };

  const saveEntry = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editing ? `${API_URL}/raod/${editing.id}` : `${API_URL}/raod`;
      await fetchJson(url, {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          fiscal_year: Number(form.fiscal_year || FY),
          created_by: user?.id,
          updated_by: user?.id,
          // Keep the old DB compatibility field synchronized with the Excel field.
          dv_no: form.dv_payroll_no || form.dv_no || null,
        }),
      });
      setModal(null);
      setEditing(null);
      setForm(emptyForm);
      setToast({ type: "success", message: editing ? "RAOD record updated successfully." : "RAOD record added successfully." });
      await Promise.all([loadOverview(), loadEntries(1)]);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteEntry = async (row) => {
    if (!window.confirm(`Delete RAOD record ${row.registry_no || row.id}?`)) return;
    try {
      await fetchJson(`${API_URL}/raod/${row.id}`, { method: "DELETE" });
      setToast({ type: "success", message: "RAOD record deleted successfully." });
      setModal(null);
      setSelected(null);
      await Promise.all([loadOverview(), loadEntries(page)]);
    } catch (e) {
      setError(e.message);
    }
  };

  const s = overview.general_fund_summary || {};
  const allotment = Number(overview.allotment_amount || 0);
  const obligation = Number(overview.obligation_amount || 0);
  const disbursement = Number(overview.disbursement_amount || 0);
  const unobligated = Number(overview.unobligated_balance || Math.max(0, allotment - obligation));
  const undisbursed = Number(overview.undisbursed_balance || Math.max(0, obligation - disbursement));

  const entryColumns = [
    { key: "registry_no", label: "REGISTRY NO." },
    { key: "entry_date", label: "DATE", render: r => dateText(r.entry_date) },
    { key: "particulars", label: "PARTICULARS", render: r => <span className="max-w-[260px] truncate block">{r.particulars || "—"}</span> },
    { key: "responsibility_center_name", label: "DEPARTMENT / RC" },
    { key: "allotment_amount", label: "ALLOTMENT", render: r => money(r.allotment_amount) },
    { key: "obligation_amount", label: "OBLIGATION", render: r => money(r.obligation_amount) },
    { key: "disbursement_amount", label: "DISBURSEMENT", render: r => money(r.disbursement_amount) },
    { key: "entry_status", label: "STATUS", render: r => <Status value={r.entry_status} /> },
    { key: "actions", label: "ACTIONS", render: r => (
      <div className="flex gap-1">
        <button type="button" title="View" onClick={() => { setSelected(r); setModal("view"); }} className="rounded-md border border-slate-200 p-1.5 text-slate-500 hover:text-blue-600"><Eye className="h-3.5 w-3.5" /></button>
        <button type="button" title="Edit" onClick={() => openEdit(r)} className="rounded-md border border-slate-200 p-1.5 text-slate-500 hover:text-blue-600"><Pencil className="h-3.5 w-3.5" /></button>
      </div>
    )},
  ];

  const renderHome = () => (
    <>
      <div className="mb-5 flex justify-end">
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
          <CalendarDays className="h-4 w-4 text-[#174fd1]" />
          <span className="text-[10px] font-bold text-slate-600">FY {FY}</span>
          <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
        </div>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {cardData.map(item => <CardButton key={item[0]} item={item} onClick={openView} />)}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <SectionTitle title="RAOD Financial Summary" text="FY 2026 — General Fund / Fund Cluster 101" />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Metric label="Total Allotment" value={money(allotment)} icon={WalletCards} />
            <Metric label="Total Obligations" value={money(obligation)} icon={BarChart3} className="bg-emerald-50 text-emerald-700" />
            <Metric label="Total Disbursements" value={money(disbursement)} icon={ArrowDownToLine} className="bg-violet-50 text-violet-700" />
            <Metric label="Unobligated Balance" value={money(unobligated)} icon={Landmark} className="bg-amber-50 text-amber-700" />
          </div>
        </div>
        <div>
          <SectionTitle title="Recent RAOD Transactions" text={`${overview.total_records || 0} records in FY ${FY}`} />
          <div className="rounded-xl border border-slate-100 bg-white shadow-sm">
            {(overview.recent_entries || []).slice(0, 5).map(r => (
              <button key={r.id} type="button" onClick={() => { setSelected(r); setModal("view"); }} className="flex w-full items-center justify-between gap-3 border-b border-slate-100 px-3 py-2.5 text-left last:border-b-0 hover:bg-slate-50">
                <div className="min-w-0">
                  <p className="truncate text-[10px] font-bold text-slate-700">{r.registry_no}</p>
                  <p className="truncate text-[9px] text-slate-400">{r.particulars || "No particulars"}</p>
                </div>
                <span className="shrink-0 text-[9px] font-bold text-slate-700">{money(r.disbursement_amount || r.obligation_amount || r.allotment_amount)}</span>
              </button>
            ))}
            {!overview.recent_entries?.length && <p className="p-5 text-center text-[10px] text-slate-400">No RAOD transactions yet.</p>}
          </div>
        </div>
      </div>
    </>
  );

  const renderTransactions = () => (
    <>
      <BackBar title="4. RAOD Transactions" onBack={backHome} />
      <div className="mb-4 grid grid-cols-1 gap-2 md:grid-cols-12">
        <div className="relative md:col-span-5">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search registry, ORS serial no., payee, particulars..." className="pl-9" />
        </div>
        <div className="md:col-span-2"><Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} /></div>
        <div className="md:col-span-2"><Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} /></div>
        <button type="button" onClick={() => loadEntries(1)} className="flex h-9 items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white text-[10px] font-bold text-slate-600"><RefreshCw className="h-3.5 w-3.5" /> Refresh</button>
        <button type="button" onClick={openAdd} className="flex h-9 items-center justify-center gap-1 rounded-lg bg-[#174fd1] text-[10px] font-bold text-white md:col-span-2"><Plus className="h-3.5 w-3.5" /> Add RAOD Transaction</button>
      </div>

      <div className="mb-3 flex gap-1 overflow-x-auto rounded-lg border border-slate-100 bg-white p-1 shadow-sm">
        {[["all","All Records"],["obligations","Obligations"],["disbursements","Disbursements"],["balance","With Balance"]].map(([id,label]) => (
          <button key={id} type="button" onClick={() => { setActiveTab(id); setPage(1); }} className={`whitespace-nowrap rounded-md px-3 py-2 text-[9px] font-bold ${activeTab === id ? "bg-[#174fd1] text-white" : "text-slate-500 hover:bg-slate-50"}`}>{label}</button>
        ))}
      </div>

      <Table columns={entryColumns} rows={entries} empty={loading ? "Loading RAOD records..." : "No RAOD records found."} />
      <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400">
        <span>Showing {entries.length ? ((page - 1) * LIMIT + 1) : 0} to {Math.min(page * LIMIT, pagination.totalItems)} of {pagination.totalItems} entries</span>
        <div className="flex items-center gap-1">
          <button type="button" disabled={page <= 1} onClick={() => loadEntries(page - 1)} className="rounded border p-1.5 disabled:opacity-30"><ArrowLeft className="h-3 w-3" /></button>
          {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => i + 1).map(x => (
            <button key={x} type="button" onClick={() => loadEntries(x)} className={`rounded px-2.5 py-1.5 ${page === x ? "bg-[#174fd1] text-white" : "border border-slate-200 bg-white text-slate-500"}`}>{x}</button>
          ))}
          <button type="button" disabled={page >= pagination.totalPages} onClick={() => loadEntries(page + 1)} className="rounded border p-1.5 disabled:opacity-30"><ArrowRight className="h-3 w-3" /></button>
        </div>
      </div>
    </>
  );

  const renderAllotment = () => {
    const rows = [
      { label: "Personnel Services (PS)", value: Number(s.ps || 0) },
      { label: "Maintenance and Other Operating Expenses (MOOE)", value: Number(s.mooe || 0) },
      { label: "Capital Outlay (CO)", value: Number(s.co || 0) },
    ];
    return (
      <>
        <BackBar title="2. Allotment & Obligation" onBack={backHome} />
        <div className="mb-4 flex gap-1 rounded-lg border border-slate-100 bg-white p-1 shadow-sm">
          {[["summary","Summary"],["classes","PS / MOOE / CO"],["details","Allotment Details"]].map(([id,label]) => <button key={id} onClick={() => setAllotTab(id)} type="button" className={`rounded-md px-4 py-2 text-[9px] font-bold ${allotTab === id ? "bg-[#174fd1] text-white" : "text-slate-500"}`}>{label}</button>)}
        </div>
        {allotTab === "summary" && (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Metric label="Allotment" value={money(allotment)} icon={WalletCards} />
            <Metric label="Obligation" value={money(obligation)} icon={BarChart3} className="bg-amber-50 text-amber-700" />
            <Metric label="Remaining / Unobligated" value={money(unobligated)} icon={CheckCircle2} className="bg-emerald-50 text-emerald-700" />
            <Metric label="Undisbursed Obligation" value={money(undisbursed)} icon={ArrowDownToLine} className="bg-violet-50 text-violet-700" />
          </div>
        )}
        {allotTab === "classes" && (
          <Table columns={[
            { key: "label", label: "ALLOTMENT CLASS" },
            { key: "value", label: "AMOUNT", render: r => money(r.value) },
            { key: "pct", label: "% OF ALLOTMENT", render: r => `${pct(r.value, allotment).toFixed(2)}%` },
          ]} rows={rows} />
        )}
        {allotTab === "details" && (
          <Table columns={entryColumns.slice(0, 8)} rows={entries} empty="No allotment details found." />
        )}
      </>
    );
  };

  const renderFundRegistry = () => (
    <>
      <BackBar title="3. Fund Registries — 101 General Fund" onBack={backHome} />
      <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 p-4">
        <p className="text-[9px] font-bold uppercase tracking-wide text-blue-600">Fund Registry</p>
        <p className="mt-1 text-lg font-extrabold text-[#10245b]">101 — GENERAL FUND</p>
        <p className="text-[10px] text-slate-500">Centralized RAOD registry for the General Fund.</p>
      </div>
      <div className="mb-4 flex gap-1 rounded-lg border border-slate-100 bg-white p-1 shadow-sm">
        {[["overview","Overview"],["transactions","Transactions"],["gaa","GAA Balance"],["wfp","WFP Balance"],["reports","Reports"]].map(([id,label]) => <button key={id} type="button" onClick={() => setFundTab(id)} className={`rounded-md px-4 py-2 text-[9px] font-bold ${fundTab === id ? "bg-[#174fd1] text-white" : "text-slate-500"}`}>{label}</button>)}
      </div>
      {fundTab === "overview" && <div className="grid grid-cols-2 gap-3 md:grid-cols-4"><Metric label="Allotment" value={money(allotment)} icon={WalletCards}/><Metric label="Obligations" value={money(obligation)} icon={BarChart3} className="bg-amber-50 text-amber-700"/><Metric label="Disbursements" value={money(disbursement)} icon={ArrowDownToLine} className="bg-violet-50 text-violet-700"/><Metric label="Unobligated" value={money(unobligated)} icon={CheckCircle2} className="bg-emerald-50 text-emerald-700"/></div>}
      {fundTab === "transactions" && <Table columns={entryColumns} rows={moduleData.entries || entries} />}
      {fundTab === "gaa" && <BalancePanel title="GAA Balance" allotment={allotment} obligation={obligation} disbursement={disbursement} remaining={unobligated} />}
      {fundTab === "wfp" && <BalancePanel title="WFP Balance" allotment={allotment} obligation={obligation} disbursement={disbursement} remaining={unobligated} />}
      {fundTab === "reports" && <ReportList onGenerate={x => setReportType(x)} />}
    </>
  );

  const renderMonitoring = () => (
    <>
      <BackBar title="5. Disbursement & Balance" onBack={backHome} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Metric label="Total Allotment" value={money(allotment)} icon={WalletCards} />
        <Metric label="Total Obligations" value={money(obligation)} icon={BarChart3} className="bg-amber-50 text-amber-700" />
        <Metric label="Total Disbursements" value={money(disbursement)} icon={ArrowDownToLine} className="bg-violet-50 text-violet-700" />
        <Metric label="Unobligated Balance" value={money(unobligated)} icon={CheckCircle2} className="bg-emerald-50 text-emerald-700" />
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <BalancePanel title="Obligation Monitoring" allotment={allotment} obligation={obligation} disbursement={disbursement} remaining={unobligated} />
        <BalancePanel title="Disbursement Monitoring" allotment={allotment} obligation={obligation} disbursement={disbursement} remaining={undisbursed} />
      </div>
    </>
  );

  const renderBreakdown = () => {
    const rows = moduleData.rows || [];
    return (
      <>
        <BackBar title="6. Fund / RC Breakdown" onBack={backHome} />
        <SectionTitle title="General Fund / Responsibility Center Breakdown" text="RAOD FY 2026 totals by responsibility center." />
        <Table columns={[
          { key: "code", label: "RC CODE" },
          { key: "name", label: "RESPONSIBILITY CENTER" },
          { key: "allotment", label: "ALLOTMENT", render: r => money(r.allotment) },
          { key: "obligation", label: "OBLIGATION", render: r => money(r.obligation) },
          { key: "disbursement", label: "DISBURSEMENT", render: r => money(r.disbursement) },
          { key: "balance", label: "BALANCE", render: r => money(Math.max(0, Number(r.allotment || 0) - Number(r.obligation || 0))) },
        ]} rows={rows} />
      </>
    );
  };

  const renderFinancialReports = () => (
    <>
      <BackBar title="7. Financial Accountability Reports" onBack={backHome} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <p className="mb-3 text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Report Type</p>
          {["FAR 1","FAR 1A","SARONCA"].map(x => <button key={x} type="button" onClick={() => setReportType(x)} className={`mb-2 flex w-full items-center justify-between rounded-lg border px-3 py-3 text-left text-[10px] font-bold ${reportType === x ? "border-blue-200 bg-blue-50 text-blue-700" : "border-slate-100 text-slate-600"}`}>{x}<ArrowRight className="h-3.5 w-3.5"/></button>)}
        </div>
        <div className="lg:col-span-2 rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4"><div><p className="text-[9px] font-bold uppercase text-slate-400">FY {FY} • General Fund 101</p><h3 className="mt-1 text-lg font-extrabold text-[#10245b]">{reportType}</h3></div><FileBarChart className="h-7 w-7 text-red-500"/></div>
          <p className="mt-4 text-[11px] leading-5 text-slate-500">{reportDescription(reportType)}</p>
          <div className="mt-5 grid grid-cols-3 gap-3"><Metric label="Allotment" value={money(allotment)} icon={WalletCards}/><Metric label="Obligation" value={money(obligation)} icon={BarChart3} className="bg-amber-50 text-amber-700"/><Metric label="Disbursement" value={money(disbursement)} icon={ArrowDownToLine} className="bg-violet-50 text-violet-700"/></div>
          <div className="mt-5 flex gap-2"><button type="button" onClick={() => setModal("report")} className="rounded-lg bg-[#174fd1] px-4 py-2 text-[10px] font-bold text-white"><Eye className="mr-1 inline h-3.5 w-3.5"/> Preview</button><button type="button" onClick={() => setToast({type:"success",message:`${reportType} is ready for printing/export.`})} className="rounded-lg border border-slate-200 px-4 py-2 text-[10px] font-bold text-slate-600"><Printer className="mr-1 inline h-3.5 w-3.5"/> Print</button></div>
        </div>
      </div>
    </>
  );

  const masterLists = {
    fund_clusters: refs.fund_clusters,
    campuses: refs.campuses,
    responsibility_centers: refs.responsibility_centers,
    uacs_codes: refs.uacs_codes,
    allotment_classes: refs.allotment_classes,
  };
  const masterColumns = {
    fund_clusters: [{key:"code",label:"CODE"},{key:"name",label:"NAME"}],
    campuses: [{key:"code",label:"CODE"},{key:"name",label:"CAMPUS"}],
    responsibility_centers: [{key:"code",label:"CODE"},{key:"name",label:"RESPONSIBILITY CENTER"},{key:"category",label:"CATEGORY"}],
    uacs_codes: [{key:"code",label:"UACS CODE"},{key:"account_title",label:"ACCOUNT TITLE"}],
    allotment_classes: [{key:"code",label:"CODE"},{key:"name",label:"ALLOTMENT CLASS"}],
  };

  const renderMaster = () => (
    <>
      <BackBar title="8. Reference / Master Data" onBack={backHome} />
      <div className="mb-4 flex gap-1 overflow-x-auto rounded-lg border border-slate-100 bg-white p-1 shadow-sm">
        {Object.keys(masterLists).map(id => <button key={id} type="button" onClick={() => setMasterTab(id)} className={`whitespace-nowrap rounded-md px-3 py-2 text-[9px] font-bold ${masterTab === id ? "bg-[#174fd1] text-white" : "text-slate-500"}`}>{id.replaceAll("_"," ").toUpperCase()}</button>)}
      </div>
      <Table columns={masterColumns[masterTab]} rows={masterLists[masterTab] || []} />
    </>
  );

  const renderOverview = () => (
    <>
      <BackBar title="1. Overview" onBack={backHome} />

      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Metric label="Total Allotment" value={money(allotment)} icon={WalletCards} />
        <Metric label="Total Obligations" value={money(obligation)} icon={BarChart3} className="bg-amber-50 text-amber-700" />
        <Metric label="Total Disbursements" value={money(disbursement)} icon={ArrowDownToLine} className="bg-violet-50 text-violet-700" />
        <Metric label="Unobligated Balance" value={money(unobligated)} icon={CheckCircle2} className="bg-emerald-50 text-emerald-700" />
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
          <SectionTitle title="General Fund 101" text={`FY ${FY} — RAOD Financial Summary`} />
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2"><span className="text-[10px] text-slate-500">Allotment</span><b className="text-[11px] text-slate-700">{money(allotment)}</b></div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2"><span className="text-[10px] text-slate-500">Obligations</span><b className="text-[11px] text-slate-700">{money(obligation)}</b></div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2"><span className="text-[10px] text-slate-500">Disbursements</span><b className="text-[11px] text-slate-700">{money(disbursement)}</b></div>
            <div className="flex items-center justify-between"><span className="text-[10px] text-slate-500">Undisbursed Obligation</span><b className="text-[11px] text-slate-700">{money(undisbursed)}</b></div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm lg:col-span-2">
          <SectionTitle title="Allotment Utilization" text="Comparison of allotment, obligation, and disbursement" />
          <div className="space-y-4">
            <div>
              <div className="mb-1 flex justify-between text-[10px]"><span className="font-semibold text-slate-600">Obligation Utilization</span><span className="font-bold text-slate-700">{pct(obligation, allotment).toFixed(1)}%</span></div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-amber-400" style={{ width: `${Math.min(100, pct(obligation, allotment))}%` }} /></div>
            </div>
            <div>
              <div className="mb-1 flex justify-between text-[10px]"><span className="font-semibold text-slate-600">Disbursement vs Allotment</span><span className="font-bold text-slate-700">{pct(disbursement, allotment).toFixed(1)}%</span></div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-violet-500" style={{ width: `${Math.min(100, pct(disbursement, allotment))}%` }} /></div>
            </div>
            <div>
              <div className="mb-1 flex justify-between text-[10px]"><span className="font-semibold text-slate-600">Disbursement vs Obligation</span><span className="font-bold text-slate-700">{pct(disbursement, obligation).toFixed(1)}%</span></div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(100, pct(disbursement, obligation))}%` }} /></div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-100 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <SectionTitle title="Recent RAOD Transactions" text={`${overview.total_records || 0} records in FY ${FY}`} />
        </div>
        <Table columns={entryColumns.filter(c => c.key !== "actions")} rows={(overview.recent_entries || []).slice(0, 10)} empty="No RAOD transactions yet." />
      </div>
    </>
  );

  const renderReportsExport = () => (
    <>
      <BackBar title="9. Reports & Export" onBack={backHome} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <SectionTitle title="Report Selection" text="Use RAOD FY 2026 data." />
          <Field label="Report Type"><Select value={reportType} onChange={e => setReportType(e.target.value)}><option>RAOD Registry</option><option>FAR 1</option><option>FAR 1A</option><option>SARONCA</option><option>GAA Balance</option><option>WFP Balance</option><option>GAM</option><option>Table List</option></Select></Field>
          <Field label="Fund" className="mt-3"><Select><option>101 — GENERAL FUND</option></Select></Field>
          <Field label="Period" className="mt-3"><Select><option>FY 2026</option></Select></Field>
          <div className="mt-4 grid grid-cols-3 gap-2"><button type="button" onClick={() => setModal("report")} className="rounded-lg border border-slate-200 p-2 text-[9px] font-bold text-slate-600"><Eye className="mx-auto mb-1 h-4 w-4"/>Preview</button><button type="button" onClick={() => setToast({type:"success",message:"Excel export action prepared from RAOD records."})} className="rounded-lg border border-slate-200 p-2 text-[9px] font-bold text-slate-600"><FileSpreadsheet className="mx-auto mb-1 h-4 w-4"/>Excel</button><button type="button" onClick={() => window.print()} className="rounded-lg border border-slate-200 p-2 text-[9px] font-bold text-slate-600"><Printer className="mx-auto mb-1 h-4 w-4"/>Print</button></div>
        </div>
        <div className="lg:col-span-2"><ReportPreview title={reportType} entries={entries.slice(0, 8)} /></div>
      </div>
    </>
  );

  const renderView = () => {
    if (view === "home") return renderHome();
    if (view === "overview") return renderOverview();
    if (view === "transactions") return renderTransactions();
    if (view === "allotment-obligation") return renderAllotment();
    if (view === "fund-registry") return renderFundRegistry();
    if (view === "monitoring") return renderMonitoring();
    if (view === "fund-rc-breakdown") return renderBreakdown();
    if (view === "financial-reports") return renderFinancialReports();
    if (view === "master-data") return renderMaster();
    if (view === "reports-export") return renderReportsExport();
    return null;
  };

  return (
    <Layout user={user} onLogout={onLogout} activePath={activePath} onNavigate={onNavigate}>
      <div className="min-h-full bg-[#f7faff] pb-8">
        {error && (
          <div className="mb-4 flex items-center justify-between rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-[10px] text-red-700">
            <span>{error}</span><button type="button" onClick={() => setError("")}><X className="h-4 w-4"/></button>
          </div>
        )}
        {renderView()}
      </div>

      {modal === "form" && <Modal title={editing ? "Edit RAOD Transaction" : "Add RAOD Transaction"} onClose={() => setModal(null)} wide><TransactionForm refs={refs} form={form} setForm={setForm} onSubmit={saveEntry} saving={saving} onClose={() => setModal(null)} /></Modal>}

      {modal === "view" && selected && <Modal title={`RAOD Record — ${selected.registry_no || selected.id}`} onClose={() => setModal(null)} wide>
        <div className="grid grid-cols-1 gap-x-5 gap-y-3 md:grid-cols-3">
          {[
            ["Registry No.", selected.registry_no],
            ["Date", dateText(selected.entry_date)],
            ["Fund Cluster", `${selected.fund_cluster_code || ""} ${selected.fund_cluster_name || ""}`],
            ["Fund Code", `${selected.fund_source_code || ""} ${selected.fund_source_name || ""}`],
            ["Campus", `${selected.campus_code || ""} ${selected.campus_name || ""}`],
            ["ORS Serial No.", selected.ors_serial_no],
            ["Serial No. Transferred From/To", selected.serial_no_transferred],
            ["Payee / Name", selected.payee],
            ["Responsibility Center", selected.responsibility_center_name],
            ["PAP / DEPT.", selected.pap_name],
            ["UACS Code", selected.uacs_code],
            ["Ref. No.", selected.ref_no],
            ["Allotment Class", selected.allotment_class_name],
            ["UACS Funding Source Code", selected.uacs_funding_source_code],
            ["Year", selected.fiscal_year],
            ["Month", selected.month],
            ["Series", selected.series],
            ["Series2", selected.series2],
            ["Quarter", selected.quarter],
            ["Object of Expenditure", selected.object_expenditure_name],
            ["MFO", selected.mfo_name],
            ["Old UACS Code", selected.old_uacs_code || selected.old_uacs_code_value],
            ["Accounts Title", selected.account_title],
            ["WFP Source", selected.wfp_source_name],
            ["WFP Source Code", selected.wfp_source_code],
            ["DV / Payroll No.", selected.dv_payroll_no || selected.dv_no],
            ["PO No.", selected.po_no],
            ["Status of PO", selected.status_of_po],
            ["Obligation", money(selected.obligation_amount)],
            ["PS", money(selected.ps_amount)],
            ["MOOE", money(selected.mooe_amount)],
            ["CO", money(selected.co_amount)],
            ["Disbursement", money(selected.disbursement_amount)],
            ["Balances", money(Math.max(0, Number(selected.allotment_amount || 0) - Number(selected.obligation_amount || 0)))],
            ["Unpaid Obligation", money(selected.unpaid_obligation)],
            ["Status", selected.entry_status || selected.status],
            ["Particulars / Description", selected.particulars],
            ["Remarks", selected.remarks],
          ].map(([a, b]) => (
            <div key={a} className="border-b border-slate-100 pb-2">
              <p className="text-[9px] font-bold uppercase text-slate-400">{a}</p>
              <p className="mt-1 break-words text-[10px] font-semibold text-slate-700">{b || "—"}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={() => openEdit(selected)} className="rounded-lg border px-3 py-2 text-[10px] font-bold">
            <Pencil className="mr-1 inline h-3.5 w-3.5"/> Edit
          </button>
          <button type="button" onClick={() => deleteEntry(selected)} className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-[10px] font-bold text-red-600">
            <Trash2 className="mr-1 inline h-3.5 w-3.5"/> Delete
          </button>
        </div>
      </Modal>}

      {modal === "report" && <Modal title={`${reportType} Preview`} onClose={() => setModal(null)} wide><ReportPreview title={reportType} entries={entries.slice(0, 8)} /></Modal>}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </Layout>
  );
}

function BalancePanel({ title, allotment, obligation, disbursement, remaining }) {
  const rows = [
    ["Allotment", allotment],
    ["Obligation", obligation],
    ["Disbursement", disbursement],
    ["Balance", remaining],
  ];
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <h3 className="text-[12px] font-extrabold text-[#10245b]">{title}</h3>
      <div className="mt-4 space-y-3">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between border-b border-slate-50 pb-2">
            <span className="text-[10px] text-slate-500">{label}</span>
            <span className="text-[11px] font-bold text-slate-700">{money(value)}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-[#174fd1]" style={{ width: `${Math.min(100, pct(obligation, allotment))}%` }} />
      </div>
      <p className="mt-1 text-right text-[9px] text-slate-400">{pct(obligation, allotment).toFixed(2)}% obligated</p>
    </div>
  );
}

function ReportList({ onGenerate }) {
  const reports = [
    ["FAR 1","Statement of Appropriations, Allotments, Obligations, Disbursements and Balances"],
    ["FAR 1A","Statement of Approved Budget, Allotments and Obligations"],
    ["SARONCA","Summary of Appropriations, Releases, Obligations and Notice of Cash Allocation"],
  ];
  return <div className="space-y-2">{reports.map(([x,d]) => <div key={x} className="flex items-center justify-between rounded-lg border border-slate-100 p-3"><div><p className="text-[10px] font-bold text-slate-700">{x}</p><p className="text-[9px] text-slate-400">{d}</p></div><button type="button" onClick={() => onGenerate(x)} className="rounded-lg bg-[#174fd1] px-3 py-2 text-[9px] font-bold text-white">Generate</button></div>)}</div>;
}

function reportDescription(x) {
  if (x === "FAR 1") return "Financial Accountability Report No. 1 covering appropriations, allotments, obligations, disbursements, and balances.";
  if (x === "FAR 1A") return "Financial Accountability Report No. 1A based on the RAOD registry and FY 2026 General Fund records.";
  if (x === "SARONCA") return "Summary of Appropriations, Releases, Obligations and Notice of Cash Allocation using available RAOD data.";
  return "RAOD report preview.";
}

function ReportPreview({ title, entries }) {
  const total = entries.reduce((a, r) => a + Number(r.disbursement_amount || r.obligation_amount || r.allotment_amount || 0), 0);
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm print:shadow-none">
      <div className="border-b-2 border-[#102b67] pb-3 text-center">
        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">University of Abra — Main Campus</p>
        <h2 className="mt-1 text-lg font-extrabold text-slate-800">{title}</h2>
        <p className="mt-1 text-[9px] text-slate-400">FY 2026 • General Fund / 101 • RAOD Registry</p>
      </div>
      <div className="mt-5 overflow-x-auto">
        <table className="min-w-full text-[9px]">
          <thead><tr className="bg-slate-100 font-bold text-slate-700"><th className="px-2 py-2 text-left">RAOD No.</th><th className="px-2 py-2">Date</th><th className="px-2 py-2 text-left">Department</th><th className="px-2 py-2 text-right">Amount</th></tr></thead>
          <tbody className="divide-y divide-slate-100">{entries.map(r => <tr key={r.id}><td className="px-2 py-2">{r.registry_no}</td><td className="px-2 py-2 text-center">{dateText(r.entry_date)}</td><td className="px-2 py-2">{r.responsibility_center_name || "—"}</td><td className="px-2 py-2 text-right">{money(r.disbursement_amount || r.obligation_amount || r.allotment_amount)}</td></tr>)}</tbody>
          <tfoot><tr className="bg-slate-50 font-extrabold"><td colSpan="3" className="px-2 py-2 text-right">TOTAL</td><td className="px-2 py-2 text-right">{money(total)}</td></tr></tfoot>
        </table>
      </div>
    </div>
  );
}

export default RaodRegistry;




