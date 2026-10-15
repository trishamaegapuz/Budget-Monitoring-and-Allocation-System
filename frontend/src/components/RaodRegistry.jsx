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

const FY = new Date().getFullYear();
const LIMIT = 30;
const DEPARTMENT_PAGE_SIZE = 30;
const MONITORING_PAGE_SIZE = 30;
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

const periodFromDate = (value) => {
  if (!value) return { fiscal_year: "", month: "", quarter: "" };
  const d = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(d.getTime())) return { fiscal_year: "", month: "", quarter: "" };
  const month = d.getMonth() + 1;
  return {
    fiscal_year: String(d.getFullYear()),
    month: String(month),
    quarter: String(Math.ceil(month / 3)),
  };
};

const monthName = (month) => {
  const m = Number(month);
  return m >= 1 && m <= 12
    ? new Date(2000, m - 1, 1).toLocaleString("en-US", { month: "long" })
    : "—";
};

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
  ps_obligation: "",
  mooe_obligation: "",
  co_obligation: "",
  wfp_source: "",
  wfp_source_code: "",
  dv_payroll_no: "",
  disbursement_amount: "",
  remarks: "",
  unpaid_obligation: "",
  po_no: "",
  iar_no: "",
  par_no: "",
  ics_no: "",
  ris_no: "",
  po_status: "",

};


const normalizeRaodRole = (value) => {
  const raw = String(value || "").trim().toLowerCase().replace(/[._-]+/g, " ").replace(/\s+/g, " ");
  if (["administration","administrator","admin","system administrator"].includes(raw)) return "Administration";
  if (["budget","budget officer"].includes(raw)) return "Budget";
  if (["procurement","procurement officer"].includes(raw)) return "Procurement";
  if (["accountant","accounting"].includes(raw)) return "Accountant";
  return "";
};

const RAOD_BUDGET_FIELDS = new Set([
  "entry_date","campus_id","serial_no_transferred","payee","particulars",
  "responsibility_center_id","pap_id","uacs_code_id","ref_no","allotment_class_id",
  "uacs_funding_source_code","month","series","series2","quarter","object_expenditure_id",
  "mfo_id","old_uacs_code_id","account_title","obligation_amount","ps_obligation",
  "mooe_obligation","co_obligation","wfp_source","wfp_source_code","remarks"
]);
const canEditRaodField = (role, field) => {
  const r = normalizeRaodRole(role);
  if (r === "Administration") return field !== "registry_no" && field !== "ors_serial_no";
  if (r === "Budget") return RAOD_BUDGET_FIELDS.has(field);
  if (r === "Accountant") return ["dv_payroll_no","disbursement_amount"].includes(field);
  if (r === "Procurement") return ["po_no","iar_no","par_no","ics_no","ris_no","po_status"].includes(field);
  return false;
};

const cardData = [
  { id: "dashboard", title: "1. Overview", desc: "View summary of allotments, obligations, disbursements, and balances.", color: "bg-blue-600", icon: WalletCards, action: "Go to Overview", buttonClass: "border-blue-500 text-[#174fd1] hover:bg-blue-50" },
  { id: "allotment-budget", title: "2. Allotment & Obligation", desc: "Manage allotments received, obligations, and remaining balances.", color: "bg-emerald-500", icon: BarChart3, action: "Open Allotment & Obligation", buttonClass: "border-emerald-500 text-emerald-600 hover:bg-emerald-50" },
  { id: "fund-registry", title: "3. Fund Registries", desc: "View and manage RAOD records by fund and funding source.", color: "bg-violet-600", icon: FolderOpen, action: "View Fund Registries", buttonClass: "border-violet-500 text-violet-600 hover:bg-violet-50" },
  { id: "transactions", title: "4. RAOD Transactions", desc: "Record, edit, and manage allotment, obligation, and disbursement entries.", color: "bg-orange-500", icon: FileText, action: "Open RAOD Transactions", buttonClass: "border-orange-500 text-orange-600 hover:bg-orange-50" },
  { id: "monitoring", title: "5. Disbursement & Balance", desc: "Monitor disbursements and compare allotment, obligation, and available balances.", color: "bg-teal-500", icon: BarChart3, action: "Open Monitoring", buttonClass: "border-teal-500 text-teal-600 hover:bg-teal-50" },
  { id: "fund-rc-breakdown", title: "6. Fund / RC Breakdown", desc: "View detailed RAOD breakdown by fund, responsibility center, and WFP.", color: "bg-amber-500", icon: Table2, action: "View Breakdown", buttonClass: "border-amber-500 text-amber-600 hover:bg-amber-50" },
  { id: "financial-reports", title: "7. Financial Accountability Reports", desc: "Generate and view official RAOD accountability reports.", color: "bg-red-500", icon: FileBarChart, action: "View Financial Reports", buttonClass: "border-red-500 text-red-600 hover:bg-red-50" },
  { id: "reports-export", title: "8. Reports & Export", desc: "Export official RAOD reports to Excel, PDF, or print.", color: "bg-green-600", icon: Download, action: "Open Reports & Export", buttonClass: "border-green-500 text-green-600 hover:bg-green-50" },
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
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
          <p className="mt-2 text-[20px] font-extrabold text-slate-800">{value}</p>
        </div>
        <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${className}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
    </div>
  );
}

function CardButton({ item, onClick }) {
  const Icon = item.icon;
  return (
    <div className="group flex h-full flex-col rounded-xl border border-slate-100 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md">
      <div className="flex min-h-[92px] items-start gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white ${item.color}`}>
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h3 className="text-[13px] font-extrabold text-[#10245b]">{item.title}</h3>
          <p className="mt-1 text-[10px] leading-4 text-slate-500">{item.desc}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => onClick(item.id)}
        className={`mt-3 flex h-9 w-full items-center justify-center gap-1 rounded-lg border bg-white text-[10px] font-bold transition ${item.buttonClass || "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
      >
        {item.action} <ArrowRight className="h-3 w-3" />
      </button>
    </div>
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


function Pagination({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = LIMIT,
  onPageChange,
}) {
  if (totalPages <= 1 && totalItems <= pageSize) return null;

  const start = totalItems ? ((currentPage - 1) * pageSize) + 1 : 0;
  const end = totalItems ? Math.min(currentPage * pageSize, totalItems) : 0;

  const getPages = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages = [1];
    const left = Math.max(2, currentPage - 1);
    const right = Math.min(totalPages - 1, currentPage + 1);

    if (left > 2) pages.push("...");
    for (let i = left; i <= right; i += 1) pages.push(i);
    if (right < totalPages - 1) pages.push("...");
    pages.push(totalPages);

    return pages;
  };

  return (
    <div className="mt-3 flex flex-col gap-2 rounded-xl border border-slate-100 bg-white px-3 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <span className="text-[10px] text-slate-500">
        Showing <b className="text-slate-700">{start}</b> to{" "}
        <b className="text-slate-700">{end}</b> of{" "}
        <b className="text-slate-700">{totalItems}</b> entries
      </span>

      <div className="flex items-center justify-end gap-1">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="inline-flex h-7 items-center gap-1 rounded-md border border-slate-200 bg-white px-2 text-[9px] font-bold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ArrowLeft className="h-3 w-3" />
          <span className="hidden sm:inline">Previous</span>
        </button>

        {getPages().map((pageItem, index) =>
          pageItem === "..." ? (
            <span
              key={`ellipsis-${index}`}
              className="flex h-7 min-w-7 items-center justify-center px-1 text-[9px] text-slate-400"
            >
              …
            </span>
          ) : (
            <button
              key={pageItem}
              type="button"
              onClick={() => onPageChange(pageItem)}
              className={`h-7 min-w-7 rounded-md px-2 text-[11px] font-bold transition ${
                currentPage === pageItem
                  ? "bg-[#174fd1] text-white shadow-sm"
                  : "border border-slate-200 bg-white text-slate-500 hover:bg-blue-50 hover:text-blue-700"
              }`}
            >
              {pageItem}
            </button>
          )
        )}

        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="inline-flex h-7 items-center gap-1 rounded-md border border-slate-200 bg-white px-2 text-[9px] font-bold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <span className="hidden sm:inline">Next</span>
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>
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

function TransactionForm({ refs, form, setForm, budgetInfo, editing, role, onSubmit, saving, onClose }) {
  const set = (k, v) => setForm((x) => ({ ...x, [k]: v }));
  const options = (list) => (Array.isArray(list) ? list : []);
  const fieldDisabled = (field) => Boolean(editing) && !canEditRaodField(role, field);

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
            <Input
              value={form.registry_no || ""}
              readOnly
              placeholder={editing ? "Registry No." : "Generated automatically after save"}
              className="bg-slate-50 font-bold text-[#10245b]"
            />
            <p className="mt-1 text-[9px] font-medium text-slate-400">
              System-generated • permanent • not editable
            </p>
          </Field>
          <Field label="Date">
            <Input
              required
              type="date"
              value={form.entry_date}
              disabled={fieldDisabled("entry_date")}
              onChange={e => {
                const value = e.target.value;
                const period = periodFromDate(value);
                setForm(x => ({
                  ...x,
                  entry_date: value,
                  fiscal_year: period.fiscal_year,
                  month: period.month,
                  quarter: period.quarter,
                }));
              }}
            />
          </Field>
          <Field label="Fund Cluster">
            <Select value={form.fund_cluster_id} disabled>
              {options(refs.fund_clusters)
                .filter(x => String(x.code) === "101")
                .map(x => (
                  <option key={x.id} value={x.name || x.code}>{x.code} — {x.name}</option>
                ))}
            </Select>
          </Field>
          <Field label="Fund Source">
            <Select value={form.fund_source_id} disabled>
              {options(refs.fund_sources)
                .filter(x => String(x.code).toUpperCase() === "MAIN" || /main fund/i.test(String(x.name || "")))
                .map(x => (
                  <option key={x.id} value={x.id}>{x.code} — {x.name}</option>
                ))}
            </Select>
          </Field>
          <Field label="Campus">
            <Select value={form.campus_id} disabled={fieldDisabled("campus_id")} onChange={e => set("campus_id", e.target.value)}>
              <option value="">Select</option>
              {options(refs.campuses).map(x => (
                <option key={x.id} value={x.id}>{x.code} — {x.name}</option>
              ))}
            </Select>
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
            <Input
              value={form.ors_serial_no}
              disabled
              placeholder="Generated automatically after save"
            />
          </Field>
          <Field label="Serial No. Transferred From/To">
            <Input value={form.serial_no_transferred} disabled={fieldDisabled("serial_no_transferred")} onChange={e => set("serial_no_transferred", e.target.value)} />
          </Field>
          <Field label="Payee / Name">
            <Input value={form.payee} disabled={fieldDisabled("payee")} onChange={e => set("payee", e.target.value)} />
          </Field>
          <Field label="Responsibility Center">
            <Select value={form.responsibility_center_id} disabled={fieldDisabled("responsibility_center_id")} onChange={e => set("responsibility_center_id", e.target.value)}>
              <option value="">Select</option>
              {options(refs.responsibility_centers).map(x => (
                <option key={x.id} value={x.id}>{x.code} — {x.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="PAP / DEPT.">
            <Select value={form.pap_id} disabled={fieldDisabled("pap_id")} onChange={e => set("pap_id", e.target.value)}>
              <option value="">Select</option>
              {options(refs.pap).map(x => (
                <option key={x.id} value={x.id}>{x.code} — {x.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="UACS Code">
            <Select value={form.uacs_code_id} disabled={fieldDisabled("uacs_code_id")} onChange={e => set("uacs_code_id", e.target.value)}>
              <option value="">Select</option>
              {options(refs.uacs_codes).map(x => (
                <option key={x.id} value={x.id}>{x.code} — {x.account_title || x.revised_description || ""}</option>
              ))}
            </Select>
          </Field>
          <Field label="Ref. No.">
            <Input value={form.ref_no} disabled={fieldDisabled("ref_no")} onChange={e => set("ref_no", e.target.value)} />
          </Field>
          <Field label="Allotment Class">
            <Select value={form.allotment_class_id} disabled={fieldDisabled("allotment_class_id")} onChange={e => set("allotment_class_id", e.target.value)}>
              <option value="">Select</option>
              {options(refs.allotment_classes).map(x => (
                <option key={x.id} value={x.id}>{x.code} — {x.name}</option>
              ))}
            </Select>
          </Field>

          {options(refs.object_expenditures).length > 0 && (
            <Field label="Object of Expenditure">
              <Select value={form.object_expenditure_id} disabled={fieldDisabled("object_expenditure_id")} onChange={e => set("object_expenditure_id", e.target.value)}>
                <option value="">Select</option>
                {options(refs.object_expenditures).map(x => (
                  <option key={x.id} value={x.id}>{x.code} — {x.name}</option>
                ))}
              </Select>
            </Field>
          )}
          <Field label="MFO">
            <Select value={form.mfo_id} disabled={fieldDisabled("mfo_id")} onChange={e => set("mfo_id", e.target.value)}>
              <option value="">Select</option>
              {options(refs.mfo).map(x => (
                <option key={x.id} value={x.id}>{x.code} — {x.name}</option>
              ))}
            </Select>
          </Field>
          {oldUacsOptions.length > 0 && (
            <Field label="Old UACS Code">
              <Select value={form.old_uacs_code_id} disabled={fieldDisabled("old_uacs_code_id")} onChange={e => set("old_uacs_code_id", e.target.value)}>
                <option value="">Select</option>
                {oldUacsOptions.map(x => (
                  <option key={x.id} value={x.id}>{x.old_code} — {x.account_title || x.code}</option>
                ))}
              </Select>
            </Field>
          )}
          <Field label="Accounts Title">
            <Input value={form.account_title} disabled={fieldDisabled("account_title")} onChange={e => set("account_title", e.target.value)} />
          </Field>
        </div>
      </div>

      {/* Budget verification: allotment is sourced from budget_items, not entered manually in RAOD. */}
      <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-wide text-amber-700">
              Budget Verification
            </p>
            <p className="mt-0.5 text-[9px] text-slate-500">
              Fund Amount is the approved budget/allotment from budget_items for the selected Responsibility Center and fiscal year. It is not manually entered in RAOD.
            </p>
          </div>
          <span className={`rounded-full px-2 py-1 text-[8px] font-extrabold ${
            budgetInfo ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
          }`}>
            {budgetInfo ? "VERIFIED" : "SELECT RC"}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-lg border border-slate-100 bg-white p-3">
            <p className="text-[8px] font-bold uppercase text-slate-400">Fund Amount / Approved Allotment</p>
            <p className="mt-1 text-[12px] font-extrabold text-slate-800">
              {money(budgetInfo?.fund_amount ?? budgetInfo?.allocation ?? budgetInfo?.allotment ?? 0)}
            </p>
          </div>
          <div className="rounded-lg border border-slate-100 bg-white p-3">
            <p className="text-[8px] font-bold uppercase text-slate-400">Existing Obligation</p>
            <p className="mt-1 text-[12px] font-extrabold text-slate-800">
              {money(budgetInfo?.obligation ?? 0)}
            </p>
          </div>
          <div className="rounded-lg border border-slate-100 bg-white p-3">
            <p className="text-[8px] font-bold uppercase text-slate-400">Available Before Entry</p>
            <p className="mt-1 text-[12px] font-extrabold text-emerald-700">
              {money(
                Math.max(
                  0,
                  Number(budgetInfo?.fund_amount ?? budgetInfo?.allocation ?? budgetInfo?.allotment ?? 0) -
                  Math.max(0, Number(budgetInfo?.obligation ?? 0) - Number(editing?.obligation_amount || 0))
                )
              )}
            </p>
          </div>
          <div className="rounded-lg border border-slate-100 bg-white p-3">
            <p className="text-[8px] font-bold uppercase text-slate-400">Projected Balance</p>
            <p className="mt-1 text-[12px] font-extrabold text-blue-700">
              {money(
                Math.max(
                  0,
                  Number(budgetInfo?.fund_amount ?? budgetInfo?.allocation ?? budgetInfo?.allotment ?? 0) -
                  Math.max(0, Number(budgetInfo?.obligation ?? 0) - Number(editing?.obligation_amount || 0)) -
                  Number(form.obligation_amount || 0)
                )
              )}
            </p>
          </div>
        </div>
      </div>

      {/* 9: particulars */}
      <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
        <Field label="Particulars / Description">
          <textarea
            value={form.particulars} disabled={fieldDisabled("particulars")}
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
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <Field label="Month">
            <Input value={monthName(form.month)} readOnly className="bg-slate-50 font-semibold" />
          </Field>
          <Field label="Quarter">
            <Input value={form.quarter ? `Q${form.quarter}` : "—"} readOnly className="bg-slate-50 font-semibold" />
          </Field>
          <Field label="Series">
            <Input value={form.series} disabled={fieldDisabled("series")} onChange={e => set("series", e.target.value)} />
          </Field>
          <Field label="Series2">
            <Input value={form.series2} disabled={fieldDisabled("series2")} onChange={e => set("series2", e.target.value)} />
          </Field>
        </div>
        <p className="mt-2 text-[9px] font-medium text-slate-400">
          Month, Quarter, and Fiscal Year are automatically derived from the Date.
        </p>
      </div>

      {/* RAOD financial amounts */}
      <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4">
        <p className="mb-3 text-[10px] font-extrabold uppercase tracking-wide text-emerald-700">
          Obligation and Disbursement
        </p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Field label="Obligation">
            <Input required type="number" min="0" step="0.01" value={form.obligation_amount} disabled={fieldDisabled("obligation_amount")} onChange={e => set("obligation_amount", e.target.value)} />
          </Field>
          <Field label="PS Obligation">
            <Input type="number" min="0" step="0.01" value={form.ps_obligation} disabled={fieldDisabled("ps_obligation")} onChange={e => set("ps_obligation", e.target.value)} />
          </Field>
          <Field label="MOOE Obligation">
            <Input type="number" min="0" step="0.01" value={form.mooe_obligation} disabled={fieldDisabled("mooe_obligation")} onChange={e => set("mooe_obligation", e.target.value)} />
          </Field>
          <Field label="CO Obligation">
            <Input type="number" min="0" step="0.01" value={form.co_obligation} disabled={fieldDisabled("co_obligation")} onChange={e => set("co_obligation", e.target.value)} />
          </Field>
          <Field label="Disbursement">
            <Input type="number" min="0" step="0.01" value={form.disbursement_amount} disabled={fieldDisabled("disbursement_amount")} onChange={e => set("disbursement_amount", e.target.value)} />
          </Field>
          <Field label="Unpaid Obligation">
            <Input
              type="number"
              step="0.01"
              value={Math.max(0, Number(form.obligation_amount || 0) - Number(form.disbursement_amount || 0))}
              readOnly
            />
          </Field>
          <Field label="Running Balance">
            <Input
              value={Math.max(
                0,
                Number(budgetInfo?.fund_amount ?? budgetInfo?.allocation ?? budgetInfo?.allotment ?? 0) -
                Math.max(
                  0,
                  Number(budgetInfo?.obligation ?? 0) - Number(editing?.obligation_amount || 0)
                ) -
                Number(form.obligation_amount || 0)
              ).toFixed(2)}
              readOnly
            />
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
            <Select
              value={form.wfp_source}
              disabled={fieldDisabled("wfp_source")}
              onChange={e => {
                const selected = options(refs.wfp_sources).find(x => String(x.id) === String(e.target.value));
                setForm(x => ({
                  ...x,
                  wfp_source: e.target.value,
                  wfp_source_code: selected?.code || "",
                }));
              }}
            >
              <option value="">Select</option>
              {options(refs.wfp_sources).map(x => (
                <option key={x.id} value={x.id}>{x.code} — {x.name}</option>
              ))}
            </Select>
            <p className="mt-1 text-[9px] font-medium text-slate-400">
              Select the WFP / Activity Source; the source code is filled automatically.
            </p>
          </Field>
          <Field label="WFP Source Code">
            <Input
              value={form.wfp_source_code || ""}
              readOnly
              className="bg-slate-50 font-semibold text-[#10245b]"
              placeholder="Auto-filled from WFP Source"
            />
          </Field>
          <Field label="DV / Payroll No.">
            <Input
              value={form.dv_payroll_no} disabled={fieldDisabled("dv_payroll_no")}
              onChange={e => set("dv_payroll_no", e.target.value)}
            />
          </Field>
          <Field label="PO No.">
            <Input value={form.po_no} disabled={fieldDisabled("po_no")} onChange={e => set("po_no", e.target.value)} />
          </Field>
          <Field label="IAR No.">
            <Input value={form.iar_no} disabled={fieldDisabled("iar_no")} onChange={e => set("iar_no", e.target.value)} />
          </Field>
          <Field label="PAR No.">
            <Input value={form.par_no} disabled={fieldDisabled("par_no")} onChange={e => set("par_no", e.target.value)} />
          </Field>
          <Field label="ICS No.">
            <Input value={form.ics_no} disabled={fieldDisabled("ics_no")} onChange={e => set("ics_no", e.target.value)} />
          </Field>
          <Field label="RIS No.">
            <Input value={form.ris_no} disabled={fieldDisabled("ris_no")} onChange={e => set("ris_no", e.target.value)} />
          </Field>
          <Field label="Status of PO">
            <Select value={form.po_status} disabled={fieldDisabled("po_status")} onChange={e => set("po_status", e.target.value)}>
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
              value={form.remarks} disabled={fieldDisabled("remarks")}
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

function downloadCsv(filename, rows) {
  const safeRows = Array.isArray(rows) ? rows : [];
  const headers = [
    "Registry No.", "Date", "Department / RC", "Particulars",
    "Allotment", "Obligation", "Disbursement", "Unpaid Obligation", "Status"
  ];
  const csvValue = (v) => {
    const value = v === null || v === undefined ? "" : String(v);
    return `"${value.replace(/"/g, '""')}"`;
  };
  const lines = [headers.map(csvValue).join(",")];
  safeRows.forEach((r) => {
    lines.push([
      r.registry_no,
      dateText(r.entry_date),
      r.responsibility_center_name,
      r.particulars,
      "",
      r.obligation_amount,
      r.disbursement_amount,
      r.unpaid_obligation,
      r.entry_status || r.status,
    ].map(csvValue).join(","));
  });
  const blob = new Blob(["\ufeff" + lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function RaodRegistry({ user, onLogout, onNavigate, activePath }) {
  const token = localStorage.getItem("token") || "";
  const role = normalizeRaodRole(user?.role || user?.user?.role || user?.profile?.role);
  const canEditExisting = ["Administration", "Budget", "Procurement", "Accountant"].includes(role);
  const canCreate = ["Administration", "Budget"].includes(role);
  const canDelete = role === "Administration";
  const [view, setView] = useState("home");
  const [selectedFiscalYear, setSelectedFiscalYear] = useState(FY);
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
  const [auditRows, setAuditRows] = useState([]);
  const [modal, setModal] = useState(null);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [budgetInfo, setBudgetInfo] = useState(null);
  const [moduleData, setModuleData] = useState({});
  const [reportType, setReportType] = useState("FAR 1");
  const [reportEntries, setReportEntries] = useState([]);
  const [reportPage, setReportPage] = useState(1);
  const [masterTab, setMasterTab] = useState("fund_clusters");
  const [fundTab, setFundTab] = useState("overview");
  const [allotTab, setAllotTab] = useState("summary");
  const [departmentRows, setDepartmentRows] = useState([]);
  const [departmentPage, setDepartmentPage] = useState(1);
  const [monitoringPage, setMonitoringPage] = useState(1);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [departmentEntries, setDepartmentEntries] = useState([]);
  const [departmentPagination, setDepartmentPagination] = useState({ totalItems: 0, totalPages: 1, currentPage: 1 });

  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const fetchJson = useCallback(async (url, options = {}) => {
    const r = await fetch(url, { ...options, headers: { ...headers, ...(options.headers || {}) } });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error([d.error || d.message || "Request failed.", d.details].filter(Boolean).join(" Details: "));
    return d;
  }, [headers]);

  const loadRefs = useCallback(async () => {
    const d = await fetchJson(`${API_URL}/raod/reference-data`);
    setRefs(d);
  }, [fetchJson]);

  const loadOverview = useCallback(async () => {
    const d = await fetchJson(`${API_URL}/raod/overview?fiscal_year=${selectedFiscalYear}`);
    setOverview(d);
  }, [fetchJson, selectedFiscalYear]);

  const loadEntries = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ page: String(p), limit: String(LIMIT), fiscal_year: String(selectedFiscalYear) });
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
  }, [fetchJson, search, dateFrom, dateTo, activeTab, selectedFiscalYear]);

  const loadDepartmentSummary = useCallback(async () => {
    const d = await fetchJson(`${API_URL}/raod/department-summary?fiscal_year=${selectedFiscalYear}`);
    setDepartmentRows(d.rows || []);
    setDepartmentPage(1);
    setMonitoringPage(1);
  }, [fetchJson, selectedFiscalYear]);

  const loadDepartmentBudget = useCallback(async (rcId, fiscalYear = FY) => {
    if (!rcId) {
      setBudgetInfo(null);
      return null;
    }

    try {
      const d = await fetchJson(
        `${API_URL}/raod/department-budget?fiscal_year=${encodeURIComponent(fiscalYear)}&responsibility_center_id=${encodeURIComponent(rcId)}`
      );
      setBudgetInfo(d);
      return d;
    } catch (e) {
      setBudgetInfo(null);
      throw e;
    }
  }, [fetchJson]);

  const loadDepartmentEntries = useCallback(async (rcId, p = 1) => {
    if (!rcId) return;
    try {
      const q = new URLSearchParams({ page: String(p), limit: String(LIMIT), fiscal_year: String(selectedFiscalYear), responsibility_center_id: String(rcId) });
      const d = await fetchJson(`${API_URL}/raod?${q}`);
      setDepartmentEntries(d.entries || []);
      setDepartmentPagination({ totalItems: d.totalItems || 0, totalPages: d.totalPages || 1, currentPage: d.currentPage || p });
    } catch (e) { setError(e.message); }
  }, [fetchJson, selectedFiscalYear]);

  const loadModule = useCallback(async (name) => {
    if (name === "transactions") {
      await loadEntries(1);
      return;
    }
    try {
      const endpoint = name === "dashboard" ? "overview" : name === "allotment-budget" ? "allotment-obligation" : name;
      const d = await fetchJson(`${API_URL}/raod/module/${endpoint}?fiscal_year=${selectedFiscalYear}`);
      setModuleData(d);
      if (name === "financial-reports" || name === "reports-export") {
        setReportEntries(d.entries || []);
        setReportPage(1);
      }
    } catch (e) {
      setError(e.message);
    }
  }, [fetchJson, loadEntries, selectedFiscalYear]);

  const loadAudit = useCallback(async (id) => {
    const d = await fetchJson(`${API_URL}/raod/audit/${id}`);
    setAuditRows(d.audit || []);
  }, [fetchJson]);

  useEffect(() => {
    Promise.all([loadRefs(), loadOverview(), loadDepartmentSummary()]).catch(e => setError(e.message));
  }, [loadRefs, loadOverview, loadDepartmentSummary]);

  useEffect(() => {
    if (view === "transactions" || view === "home") {
      setPage(1);
      loadEntries(1);
    }
  }, [view, loadEntries]);

  useEffect(() => {
    if (view !== "home" && view !== "transactions") loadModule(view);
  }, [view, loadModule]);

  useEffect(() => {
    if (modal !== "form") return;
    if (!form.responsibility_center_id) {
      setBudgetInfo(null);
      return;
    }
    const entryFiscalYear = form.entry_date
      ? new Date(`${form.entry_date}T00:00:00`).getFullYear()
      : FY;
    loadDepartmentBudget(form.responsibility_center_id, entryFiscalYear)
      .catch(e => setError(e.message));
  }, [modal, form.responsibility_center_id, form.entry_date, loadDepartmentBudget]);

  const openView = (name) => {
    setError("");
    setView(name);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const backHome = () => setView("home");

  const generalCluster = useMemo(
    () => refs.fund_clusters.find(x => String(x.code) === "101"),
    [refs.fund_clusters]
  );
  const generalSource = useMemo(
    () => refs.fund_sources.find(x => String(x.code).toUpperCase() === "MAIN") || refs.fund_sources.find(x => /main fund/i.test(String(x.name || ""))),
    [refs.fund_sources]
  );

  const openAdd = () => {
    setEditing(null);
    setBudgetInfo(null);
    setForm({
      ...emptyForm,
      fund_cluster_id: generalCluster?.id ? String(generalCluster.id) : "",
      fund_source_id: generalSource?.id ? String(generalSource.id) : "",
      ...periodFromDate(emptyForm.entry_date),
    });
    setModal("form");
  };

  const openEdit = (row) => {
    try {
      if (!row) return;
      setError("");
      setBudgetInfo(null);
      // Open the edit modal immediately. This prevents a data-mapping issue
      // from making the Edit button appear unresponsive.
      setEditing(row);
      setModal("form");

      const f = { ...emptyForm };
    Object.keys(f).forEach(k => { f[k] = row[k] ?? ""; });
    ["fund_cluster_id","fund_source_id","campus_id","responsibility_center_id","pap_id","uacs_code_id","allotment_class_id","object_expenditure_id","mfo_id","old_uacs_code_id","month","quarter"]
      .forEach(k => { f[k] = row[k] === null || row[k] === undefined ? "" : String(row[k]); });
    f.dv_payroll_no = row.dv_payroll_no ?? "";
    const editPeriod = periodFromDate(row.entry_date);
    f.fiscal_year = editPeriod.fiscal_year || String(row.fiscal_year ?? FY);
    f.month = editPeriod.month || (row.month ?? "");
    f.quarter = editPeriod.quarter || (row.quarter ?? "");
    f.wfp_source = row.wfp_source_id ?? row.wfp_source ?? "";
    const selectedWfp = (Array.isArray(refs.wfp_sources) ? refs.wfp_sources : []).find(x => String(x.id) === String(f.wfp_source));
    f.wfp_source_code = selectedWfp?.code || row.wfp_source_code || "";
    f.ps_obligation = row.ps_obligation ?? "";
    f.mooe_obligation = row.mooe_obligation ?? "";
    f.co_obligation = row.co_obligation ?? "";
    f.po_no = row.po_no ?? "";
    f.iar_no = row.iar_no ?? "";
    f.par_no = row.par_no ?? "";
    f.ics_no = row.ics_no ?? "";
    f.ris_no = row.ris_no ?? "";
    f.po_status = row.po_status ?? row.status_of_po ?? "";
    f.entry_date = row.entry_date ? String(row.entry_date).slice(0, 10) : "";
      setForm(f);
    } catch (err) {
      console.error("RAOD openEdit error:", err);
      setError(err?.message || "Unable to open the RAOD edit form.");
      // Keep the modal open so the user can see the error instead of
      // experiencing a button that appears to do nothing.
      setModal("form");
    }
  };

  const handleEditClick = (event, row) => {
    event.preventDefault();
    event.stopPropagation();
    openEdit(row);
  };

  const saveEntry = async (e) => {
    e.preventDefault();

    const obligation = Number(form.obligation_amount || 0);
    const disbursement = Number(form.disbursement_amount || 0);
    const allocation = Number(budgetInfo?.fund_amount ?? budgetInfo?.allocation ?? budgetInfo?.allotment ?? 0);
    const existingObligation = Number(budgetInfo?.obligation || 0);
    const oldObligation = Number(editing?.obligation_amount || 0);

    if (!form.entry_date) {
      setError("Date is required.");
      return;
    }

    if (!form.responsibility_center_id) {
      setError("Responsibility Center is required.");
      return;
    }

    const budgetOwnerSave = !editing || role === "Administration" || role === "Budget";

    if (budgetOwnerSave) {
      if (!budgetInfo) {
        setError("Budget verification is required. Select a Responsibility Center with an approved budget allocation.");
        return;
      }

      if (allocation <= 0) {
        setError("No approved allotment/budget was found for the selected Responsibility Center for the selected fiscal year.");
        return;
      }

      const availableBefore = Math.max(
        0,
        allocation - Math.max(0, existingObligation - oldObligation)
      );

      if (obligation > availableBefore) {
        setError(
          `Obligation of ${money(obligation)} exceeds the available allotment of ${money(availableBefore)} for this Responsibility Center.`
        );
        return;
      }
    }

    if (["Administration", "Budget", "Accountant"].includes(role) && disbursement > obligation) {
      setError("Disbursement cannot be greater than the Obligation.");
      return;
    }

    setSaving(true);
    try {
      const url = editing ? `${API_URL}/raod/${editing.id}` : `${API_URL}/raod`;
      await fetchJson(url, {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          // Registry No. is generated by the backend on create and preserved on edit.
          registry_no: editing ? editing.registry_no : undefined,
          fund_cluster_id: generalCluster?.id ? String(generalCluster.id) : form.fund_cluster_id,
          fund_source_id: generalSource?.id ? String(generalSource.id) : form.fund_source_id,
          fiscal_year: form.entry_date
            ? new Date(`${form.entry_date}T00:00:00`).getFullYear()
            : selectedFiscalYear,
          obligation_amount: obligation,
          disbursement_amount: disbursement,
          unpaid_obligation: Math.max(0, obligation - disbursement),
          allotment_amount: allocation,
          ps_obligation: Number(form.ps_obligation || budgetInfo?.breakdown?.ps || 0),
          mooe_obligation: Number(form.mooe_obligation || budgetInfo?.breakdown?.mooe || 0),
          co_obligation: Number(form.co_obligation || budgetInfo?.breakdown?.co || 0),
          wfp_source_id: form.wfp_source || "",
          wfp_source_code: form.wfp_source_code || "",
          po_no: form.po_no || "",
          iar_no: form.iar_no || "",
          par_no: form.par_no || "",
          ics_no: form.ics_no || "",
          ris_no: form.ris_no || "",
          po_status: form.po_status || "",
        }),
      });
      setModal(null);
      setEditing(null);
      setBudgetInfo(null);
      setForm(emptyForm);
      setToast({ type: "success", message: editing ? "RAOD record updated successfully." : "RAOD record added successfully." });
      await Promise.all([loadOverview(), loadEntries(1), loadDepartmentSummary()]);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteEntry = async (row) => {
    try {
      await fetchJson(`${API_URL}/raod/${row.id}`, { method: "DELETE" });
      setToast({ type: "success", message: "RAOD record deleted successfully." });
      setModal(null);
      setSelected(null);
      await Promise.all([loadOverview(), loadEntries(page), loadDepartmentSummary()]);
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
    { key: "obligation_amount", label: "OBLIGATION", render: r => money(r.obligation_amount) },
    { key: "disbursement_amount", label: "DISBURSEMENT", render: r => money(r.disbursement_amount) },
    { key: "entry_status", label: "STATUS", render: r => <Status value={r.entry_status} /> },
    { key: "actions", label: "ACTIONS", render: r => (
      <div className="flex gap-1">
        <button type="button" title="View" onClick={() => { setSelected(r); setModal("view"); }} className="rounded-md border border-slate-200 p-1.5 text-slate-500 hover:text-blue-600"><Eye className="h-3.5 w-3.5" /></button>
        <button type="button" title="Audit Trail" onClick={async () => { setSelected(r); await loadAudit(r.id); setModal("audit"); }} className="rounded-md border border-slate-200 p-1.5 text-slate-500 hover:text-violet-600"><RefreshCw className="h-3.5 w-3.5" /></button>
        {canEditExisting && <button type="button" title="Edit" onPointerDown={(e) => handleEditClick(e, r)} onClick={(e) => handleEditClick(e, r)} className="relative z-30 pointer-events-auto rounded-md border border-slate-200 p-1.5 text-slate-500 hover:text-blue-600"><Pencil className="h-3.5 w-3.5" /></button>}
        {canDelete && <button type="button" title="Delete" onClick={() => setDeleteTarget(r)} className="rounded-md border border-red-100 p-1.5 text-red-500 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /></button>}
      </div>
    )},
  ];

  const renderHome = () => {
    const utilization = pct(obligation, allotment);
    const disbursementVsAllotment = pct(disbursement, allotment);
    const disbursementVsObligation = pct(disbursement, obligation);
    const recentRows = (overview.recent_entries || entries || []).slice(0, 5);

    const recentColumns = [
      { key: "registry_no", label: "REGISTRY NO.", render: r => <span className="font-semibold text-[#10245b]">{r.registry_no || "—"}</span> },
      { key: "entry_date", label: "DATE", render: r => dateText(r.entry_date) },
      { key: "fund", label: "FUND", render: r => r.fund_source_name || r.fund_source_code || "Main Fund" },
      { key: "responsibility_center_name", label: "DEPARTMENT / RC", render: r => r.responsibility_center_name || "—" },
      { key: "payee", label: "PAYEE", render: r => r.payee || "—" },
      { key: "particulars", label: "PARTICULARS", render: r => <span className="block max-w-[260px] truncate">{r.particulars || "—"}</span> },
      { key: "obligation_amount", label: "OBLIGATION", render: r => money(r.obligation_amount) },
      { key: "disbursement_amount", label: "DISBURSEMENT", render: r => money(r.disbursement_amount) },
      { key: "entry_status", label: "STATUS", render: r => <Status value={r.entry_status || r.status} /> },
      { key: "actions", label: "ACTIONS", render: r => (
        <div className="flex items-center gap-1">
          <button type="button" title="View" onClick={() => { setSelected(r); setModal("view"); }} className="rounded-md border border-slate-200 bg-white p-1.5 text-slate-500 hover:border-blue-200 hover:text-blue-600">
            <Eye className="h-3.5 w-3.5" />
          </button>
          <button type="button" title="Audit Trail" onClick={async () => { setSelected(r); await loadAudit(r.id); setModal("audit"); }} className="rounded-md border border-slate-200 bg-white p-1.5 text-slate-500 hover:border-blue-200 hover:text-violet-600">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          {canEditExisting && <button type="button" title="Edit" onPointerDown={(e) => handleEditClick(e, r)} onClick={(e) => handleEditClick(e, r)} className="relative z-30 pointer-events-auto rounded-md border border-slate-200 bg-white p-1.5 text-slate-500 hover:border-blue-200 hover:text-blue-600"><Pencil className="h-3.5 w-3.5" /></button>}
          <button type="button" title="Delete" onClick={() => setDeleteTarget(r)} className="rounded-md border border-red-100 bg-white p-1.5 text-red-500 hover:bg-red-50">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ) },
    ];

    return (
      <>
        {/* FISCAL YEAR SELECTOR */}
        <div className="mb-4 flex items-center justify-end">
          <div className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 shadow-sm">
            <CalendarDays className="h-3.5 w-3.5 text-[#174fd1]" />
            <label htmlFor="raod-fiscal-year" className="whitespace-nowrap text-[10px] font-semibold text-slate-600">Fiscal Year</label>
            <select
              id="raod-fiscal-year"
              value={selectedFiscalYear}
              onChange={(e) => {
                const year = Number(e.target.value);
                setSelectedFiscalYear(year);
                setPage(1);
                setDepartmentPage(1);
                setMonitoringPage(1);
                setSelectedDepartment(null);
                setDepartmentEntries([]);
              }}
              className="h-7 cursor-pointer appearance-auto border-0 bg-transparent py-0 pl-0 pr-1 text-[11px] font-bold text-[#10245b] outline-none focus:ring-0"
            >
              {Array.from({ length: Math.max(1, FY - 2021 + 1) }, (_, index) => FY - index).map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>

        {/* RAOD KPI SUMMARY */}
        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Total Allotment</p>
                <p className="mt-2 text-[21px] font-extrabold tracking-tight text-[#10245b]">{money(allotment)}</p>
                <p className="mt-1 text-[11px] text-slate-400">FY {selectedFiscalYear}</p>
              </div>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white"><WalletCards className="h-5 w-5" /></span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600" style={{ width: "100%" }} /></div>
            <p className="mt-1 text-right text-[10px] font-semibold text-slate-500">100%</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Total Obligations</p>
                <p className="mt-2 text-[21px] font-extrabold tracking-tight text-[#10245b]">{money(obligation)}</p>
                <p className="mt-1 text-[11px] text-slate-400">of total allotment</p>
              </div>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white"><BarChart3 className="h-5 w-5" /></span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(100, utilization)}%` }} /></div>
            <p className="mt-1 text-right text-[10px] font-semibold text-slate-500">{utilization.toFixed(2)}%</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Total Disbursements</p>
                <p className="mt-2 text-[21px] font-extrabold tracking-tight text-[#10245b]">{money(disbursement)}</p>
                <p className="mt-1 text-[11px] text-slate-400">of total allotment</p>
              </div>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white"><ArrowDownToLine className="h-5 w-5" /></span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-violet-500" style={{ width: `${Math.min(100, disbursementVsAllotment)}%` }} /></div>
            <p className="mt-1 text-right text-[10px] font-semibold text-slate-500">{disbursementVsAllotment.toFixed(2)}%</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Unobligated Balance</p>
                <p className="mt-2 text-[21px] font-extrabold tracking-tight text-[#10245b]">{money(unobligated)}</p>
                <p className="mt-1 text-[11px] text-slate-400">remaining from allotment</p>
              </div>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-500 text-white"><CheckCircle2 className="h-5 w-5" /></span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-red-500" style={{ width: `${Math.min(100, pct(unobligated, allotment))}%` }} /></div>
            <p className="mt-1 text-right text-[10px] font-semibold text-slate-500">{pct(unobligated, allotment).toFixed(2)}%</p>
          </div>
        </div>

        {/* HERO + UTILIZATION */}
        <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="relative overflow-hidden rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50 via-white to-indigo-50 p-6 shadow-sm xl:col-span-2">
            <div className="relative z-10 max-w-[68%]">
              <p className="text-[13px] font-bold uppercase tracking-wide text-blue-600">RAOD Registry</p>
              <h1 className="mt-2 text-[25px] font-extrabold leading-tight text-[#10245b]">Monitor, Record, and Manage<br className="hidden md:block" /> Allotments, Obligations, and Disbursements</h1>
              <p className="mt-3 text-[13px] leading-5 text-slate-600">Keep track of allotment, obligation, disbursement transactions and generate financial accountability reports in an organized and transparent manner.</p>
            </div>
            <div className="absolute bottom-0 right-5 flex h-44 w-52 items-center justify-center opacity-90">
              <div className="relative flex h-32 w-40 items-end justify-center rounded-2xl bg-white/80 shadow-lg ring-1 ring-blue-100">
                <FileBarChart className="mb-5 h-24 w-24 text-blue-500" />
                <div className="absolute -bottom-3 -left-3 h-10 w-10 rounded-full bg-orange-400 shadow-md" />
                <div className="absolute -bottom-1 right-0 h-14 w-14 rounded-full bg-orange-500/90 shadow-md" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5">
              <h2 className="text-[17px] font-extrabold text-[#10245b]">Allotment Utilization</h2>
              <p className="mt-1 text-[11px] leading-4 text-slate-500">Comparison of allotment, obligation, and disbursement for FY {selectedFiscalYear}.</p>
            </div>
            <div className="space-y-5">
              <div>
                <div className="mb-2 flex items-center justify-between text-[11px]"><span className="font-semibold text-slate-600">Obligation Utilization</span><span className="font-bold text-[#10245b]">{utilization.toFixed(2)}%</span></div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-orange-500" style={{ width: `${Math.min(100, utilization)}%` }} /></div>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between text-[11px]"><span className="font-semibold text-slate-600">Disbursement vs Allotment</span><span className="font-bold text-[#10245b]">{disbursementVsAllotment.toFixed(2)}%</span></div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-violet-500" style={{ width: `${Math.min(100, disbursementVsAllotment)}%` }} /></div>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between text-[11px]"><span className="font-semibold text-slate-600">Disbursement vs Obligation</span><span className="font-bold text-[#10245b]">{disbursementVsObligation.toFixed(2)}%</span></div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(100, disbursementVsObligation)}%` }} /></div>
              </div>
            </div>
          </div>
        </div>

        {/* MAIN MODULES */}
        <div className="mb-5">
          <div className="mb-3">
            <h2 className="text-[18px] font-extrabold text-[#10245b]">MODULES</h2>
            <p className="mt-0.5 text-[12px] text-slate-500">Quick access to RAOD functions.</p>
          </div>
          <div className="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {cardData.map(item => <CardButton key={item.id} item={item} onClick={openView} />)}
          </div>
        </div>

        {/* RECENT TRANSACTIONS */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-[17px] font-extrabold text-[#10245b]">Recent RAOD Transactions</h2>
              <p className="mt-0.5 text-[11px] text-slate-500">Latest obligation and disbursement transactions for FY {selectedFiscalYear}.</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative min-w-[260px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search registry no., department, payee, particulars..." className="pl-9 text-[11px]" />
              </div>
              <select value={activeTab} onChange={e => { setActiveTab(e.target.value); setPage(1); }} className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-semibold text-slate-600 outline-none focus:border-blue-400">
                <option value="all">All Status</option>
                <option value="obligations">Obligations</option>
                <option value="disbursements">Disbursements</option>
                <option value="balance">With Balance</option>
              </select>
              <button type="button" onClick={() => openView("transactions")} className="inline-flex h-9 items-center justify-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-4 text-[11px] font-bold text-blue-700 hover:bg-blue-100">View All <ArrowRight className="h-3.5 w-3.5" /></button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table columns={recentColumns} rows={recentRows} empty={loading ? "Loading RAOD transactions..." : "No RAOD transactions found."} />
          </div>
          <div className="px-4 pb-4">
            <Pagination currentPage={page} totalPages={pagination.totalPages} totalItems={pagination.totalItems} pageSize={LIMIT} onPageChange={loadEntries} />
          </div>
        </div>
      </>
    );
  };
  const renderTransactions = () => (
    <>
      <BackBar title="4. RAOD Transactions" onBack={backHome} />
      <div className="mb-3 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-[9px] text-blue-700">Role: <b>{role || "Unknown"}</b> &nbsp;→&nbsp; {role === "Budget" ? "WFP / Budget" : role === "Procurement" ? "Procurement References" : role === "Accountant" ? "Accounting Entries" : "RAOD Administration"} &nbsp;→&nbsp; RAOD Transactions • Fund 101 &nbsp;→&nbsp; Database / Audit Log &nbsp;→&nbsp; Monitoring / Reports • 30 rows per page</div>
      <div className="mb-4 grid grid-cols-1 gap-2 md:grid-cols-12">
        <div className="relative md:col-span-5">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search registry, ORS serial no., payee, particulars..." className="pl-9" />
        </div>
        <div className="md:col-span-2"><Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} /></div>
        <div className="md:col-span-2"><Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} /></div>
        <button type="button" onClick={() => loadEntries(1)} className="flex h-9 items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white text-[10px] font-bold text-slate-600"><RefreshCw className="h-3.5 w-3.5" /> Refresh</button>
        {canCreate && <button type="button" onClick={openAdd} className="flex h-9 items-center justify-center gap-1 rounded-lg bg-[#174fd1] text-[10px] font-bold text-white md:col-span-2"><Plus className="h-3.5 w-3.5" /> Add RAOD Transaction</button>}
      </div>

      <div className="mb-3 flex gap-1 overflow-x-auto rounded-lg border border-slate-100 bg-white p-1 shadow-sm">
        {[["all","All Records"],["obligations","Obligations"],["disbursements","Disbursements"],["balance","With Balance"]].map(([id,label]) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setActiveTab(id);
              setPage(1);
            }}
            className={`whitespace-nowrap rounded-md px-3 py-2 text-[9px] font-bold ${activeTab === id ? "bg-[#174fd1] text-white" : "text-slate-500 hover:bg-slate-50"}`}
          >
            {label}
          </button>
        ))}
      </div>

      <Table columns={entryColumns} rows={entries} empty={loading ? "Loading RAOD records..." : "No RAOD records found."} />
      <Pagination
        currentPage={page}
        totalPages={pagination.totalPages}
        totalItems={pagination.totalItems}
        pageSize={LIMIT}
        onPageChange={loadEntries}
      />
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
          {[["summary","Summary"],["classes","PS / MOOE / CO"],["details","Allotment Details"],["departments","Per Department / RC"]].map(([id,label]) => <button key={id} onClick={() => { setAllotTab(id); if (id === "departments") { setDepartmentPage(1); loadDepartmentSummary(); } }} type="button" className={`whitespace-nowrap rounded-md px-4 py-2 text-[9px] font-bold ${allotTab === id ? "bg-[#174fd1] text-white" : "text-slate-500"}`}>{label}</button>)}
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
          <>
            <Table columns={entryColumns.slice(0, 8)} rows={entries} empty="No allotment details found." />
            <Pagination
              currentPage={page}
              totalPages={pagination.totalPages}
              totalItems={pagination.totalItems}
              pageSize={LIMIT}
              onPageChange={loadEntries}
            />
          </>
        )}
        {allotTab === "departments" && (
          <div className="space-y-4">
            <SectionTitle title="Allotment & Obligation by Department / Responsibility Center" text="Select a department / responsibility center to view its actual RAOD transactions." />
            <Table columns={[
              { key: "code", label: "RC CODE" },
              { key: "name", label: "DEPARTMENT / RESPONSIBILITY CENTER" },
              { key: "allotment", label: "ALLOTMENT", render: r => money(r.allotment) },
              { key: "obligation", label: "OBLIGATION", render: r => money(r.obligation) },
              { key: "disbursement", label: "DISBURSEMENT", render: r => money(r.disbursement) },
              { key: "unobligated", label: "UNOBLIGATED", render: r => money(r.unobligated) },
              { key: "unpaid_obligation", label: "UNPAID OBLIGATION", render: r => money(r.unpaid_obligation) },
            ]} rows={departmentRows.slice((departmentPage - 1) * DEPARTMENT_PAGE_SIZE, departmentPage * DEPARTMENT_PAGE_SIZE)} empty="No Department / Responsibility Center records found." />
            <Pagination
              currentPage={departmentPage}
              totalPages={Math.max(1, Math.ceil(departmentRows.length / DEPARTMENT_PAGE_SIZE))}
              totalItems={departmentRows.length}
              pageSize={DEPARTMENT_PAGE_SIZE}
              onPageChange={setDepartmentPage}
            />
            {selectedDepartment && (
              <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div><p className="text-[9px] font-bold uppercase tracking-wide text-blue-600">Selected Department / RC</p><h3 className="mt-1 text-sm font-extrabold text-[#10245b]">{selectedDepartment.code ? `${selectedDepartment.code} — ` : ""}{selectedDepartment.name}</h3></div>
                  <button type="button" onClick={() => setSelectedDepartment(null)} className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[9px] font-bold text-slate-600">Close</button>
                </div>
                <Table columns={entryColumns} rows={departmentEntries} empty="No RAOD transactions for this responsibility center." />
                <Pagination
                  currentPage={departmentPagination.currentPage}
                  totalPages={departmentPagination.totalPages}
                  totalItems={departmentPagination.totalItems}
                  pageSize={LIMIT}
                  onPageChange={(nextPage) => loadDepartmentEntries(selectedDepartment.id, nextPage)}
                />
              </div>
            )}
          </div>
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
      {fundTab === "overview" && <div className="grid grid-cols-2 gap-3 md:grid-cols-4"><Metric label="Fund Amount" value={money(allotment)} icon={WalletCards}/><Metric label="Obligations" value={money(obligation)} icon={BarChart3} className="bg-amber-50 text-amber-700"/><Metric label="Disbursements" value={money(disbursement)} icon={ArrowDownToLine} className="bg-violet-50 text-violet-700"/><Metric label="Unobligated" value={money(unobligated)} icon={CheckCircle2} className="bg-emerald-50 text-emerald-700"/></div>}
      {fundTab === "transactions" && <Table columns={entryColumns} rows={moduleData.entries || entries} />}
      {fundTab === "gaa" && <BalancePanel title="GAA Balance" allotment={allotment} obligation={obligation} disbursement={disbursement} remaining={unobligated} />}
      {fundTab === "wfp" && <BalancePanel title="WFP Balance" allotment={allotment} obligation={obligation} disbursement={disbursement} remaining={unobligated} />}
      {fundTab === "reports" && <ReportList onGenerate={x => { setReportType(x); setModal("report"); }} />}
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
      <div className="mt-4">
        <SectionTitle title="Monitoring by Department / Responsibility Center" text="Compare allotment, obligation, disbursement, and unpaid obligation for each active responsibility center." />
        <Table columns={[
          { key: "code", label: "RC CODE" },
          { key: "name", label: "DEPARTMENT / RC" },
          { key: "allotment", label: "ALLOTMENT", render: r => money(r.allotment) },
          { key: "obligation", label: "OBLIGATION", render: r => money(r.obligation) },
          { key: "disbursement", label: "DISBURSEMENT", render: r => money(r.disbursement) },
          { key: "unobligated", label: "UNOBLIGATED", render: r => money(r.unobligated) },
          { key: "unpaid_obligation", label: "UNPAID OBLIGATION", render: r => money(r.unpaid_obligation) },
        ]} rows={departmentRows.slice((monitoringPage - 1) * MONITORING_PAGE_SIZE, monitoringPage * MONITORING_PAGE_SIZE)} empty="No Department / Responsibility Center data found." />
        <Pagination
          currentPage={monitoringPage}
          totalPages={Math.max(1, Math.ceil(departmentRows.length / MONITORING_PAGE_SIZE))}
          totalItems={departmentRows.length}
          pageSize={MONITORING_PAGE_SIZE}
          onPageChange={setMonitoringPage}
        />
      </div>
    </>
  );

  const renderBreakdown = () => {
    const rows = moduleData.rows || [];
    return (
      <>
        <BackBar title="6. Fund / RC Breakdown" onBack={backHome} />
        <SectionTitle title="General Fund / Responsibility Center Breakdown" text="RAOD totals by responsibility center for the selected fiscal year." />
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

  const reportSummary = moduleData.summary || {};

  const reportDefinitions = [
    { code: "FAR 1", group: "Financial Accountability", title: "FAR No. 1", desc: "Appropriations, Allotments, Obligations, Disbursements and Balances", icon: FileBarChart },
    { code: "FAR 1A", group: "Financial Accountability", title: "FAR No. 1A", desc: "Summary by Object of Expenditures", icon: FileBarChart },
    { code: "SARONCA", group: "Financial Accountability", title: "SARONCA", desc: "Appropriations, Releases, Obligations and NCA-related utilization", icon: FileBarChart },
    { code: "PROCUREMENT TRANSACTIONS", group: "Procurement", title: "Procurement Transactions", desc: "PO, IAR, PAR, ICS, RIS and procurement status monitoring", icon: ClipboardList },
    { code: "PO STATUS", group: "Procurement", title: "PO Status Report", desc: "Purchase orders and current procurement status", icon: FileText },
    { code: "PROCUREMENT ACCOUNTABILITY", group: "Procurement", title: "Procurement Accountability", desc: "Procurement entries with entered and updated accountability", icon: CheckCircle2 },
    { code: "ACCOUNTING TRANSACTIONS", group: "Accountant", title: "Accounting Transactions", desc: "DV/Payroll, obligations, disbursements and balances", icon: WalletCards },
    { code: "OBLIGATION & DISBURSEMENT", group: "Accountant", title: "Obligation & Disbursement", desc: "Accounting movement and utilization of obligations", icon: BarChart3 },
    { code: "UNPAID OBLIGATIONS", group: "Accountant", title: "Unpaid Obligations", desc: "Outstanding obligations requiring accounting follow-up", icon: ClipboardList },
  ];

  // Top-level report cards shown together in the official report section.
  // Procurement and Accounting are included here so the President's Office can
  // access the three financial reports plus the two operational reports from one row.
  const topReportDefinitions = [
    reportDefinitions.find(r => r.code === "FAR 1"),
    reportDefinitions.find(r => r.code === "FAR 1A"),
    reportDefinitions.find(r => r.code === "SARONCA"),
    reportDefinitions.find(r => r.code === "PROCUREMENT TRANSACTIONS"),
    reportDefinitions.find(r => r.code === "ACCOUNTING TRANSACTIONS"),
  ].filter(Boolean);

  const selectedReportDefinition = reportDefinitions.find(r => r.code === reportType) || reportDefinitions[0];
  const reportRows = useMemo(() => {
    const safe = Array.isArray(reportEntries) ? reportEntries : [];
    if (reportType === "PROCUREMENT TRANSACTIONS" || reportType === "PROCUREMENT ACCOUNTABILITY") {
      return safe.filter(r => [r.po_no,r.iar_no,r.par_no,r.ics_no,r.ris_no,r.po_status].some(v => String(v || "").trim() !== ""));
    }
    if (reportType === "PO STATUS") return safe.filter(r => String(r.po_no || "").trim() !== "" || String(r.po_status || "").trim() !== "");
    if (reportType === "ACCOUNTING TRANSACTIONS") return safe.filter(r => Number(r.obligation_amount || 0) > 0 || Number(r.disbursement_amount || 0) > 0 || String(r.dv_payroll_no || "").trim() !== "");
    if (reportType === "OBLIGATION & DISBURSEMENT") return safe.filter(r => Number(r.obligation_amount || 0) > 0 || Number(r.disbursement_amount || 0) > 0);
    if (reportType === "UNPAID OBLIGATIONS") return safe.filter(r => Number(r.unpaid_obligation || 0) > 0);
    return safe;
  }, [reportEntries, reportType]);
  const reportPageCount = Math.max(1, Math.ceil(reportRows.length / LIMIT));
  const reportPageRows = reportRows.slice((reportPage - 1) * LIMIT, reportPage * LIMIT);

  const renderFinancialReports = () => (
    <>
      <BackBar title="7. Financial Accountability Reports" onBack={backHome} />
      <div className="space-y-4">
        <div className="rounded-xl border border-red-100 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-widest text-red-500">Official Financial & Accountability Reports</p>
              <h2 className="mt-1 text-base font-extrabold text-[#10245b]">General Fund / Fund Cluster 101 • FY {selectedFiscalYear}</h2>
              <p className="mt-1 max-w-3xl text-[10px] leading-4 text-slate-500">Select a report below. Financial, Procurement, and Accounting reports are available in one official report section. Screen copies retain accountability details where applicable; official print/PDF copies are clean office reports without Entered By / Updated By.</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button type="button" onClick={() => printReport(reportType, reportRows, selectedFiscalYear)} className="rounded-lg border border-slate-200 px-3 py-2 text-[10px] font-bold text-slate-600"><Printer className="mr-1 inline h-3.5 w-3.5"/>Print / Save PDF</button>
              <button type="button" onClick={() => downloadReportCsv(reportType, reportRows, selectedFiscalYear)} className="rounded-lg bg-[#174fd1] px-3 py-2 text-[10px] font-bold text-white"><FileSpreadsheet className="mr-1 inline h-3.5 w-3.5"/>Export Excel</button>
            </div>
          </div>
        </div>

        {/* All primary reports are intentionally displayed together at the top. */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {topReportDefinitions.map(item => (
            <button
              key={item.code}
              type="button"
              onClick={() => { setReportType(item.code); setReportPage(1); }}
              className={`min-h-[132px] rounded-xl border p-4 text-left shadow-sm transition ${reportType === item.code ? "border-[#174fd1] bg-blue-50" : "border-slate-100 bg-white hover:border-blue-200 hover:shadow-md"}`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-[11px] font-extrabold leading-4 text-[#10245b]">{item.title}</span>
                <item.icon className={`h-5 w-5 shrink-0 ${reportType === item.code ? "text-[#174fd1]" : "text-slate-400"}`} />
              </div>
              <p className="mt-2 text-[9px] leading-4 text-slate-500">{item.desc}</p>
              <p className="mt-4 text-[9px] font-bold text-[#174fd1]">VIEW REPORT →</p>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <Metric label="Appropriations" value={money(reportSummary.appropriations)} icon={WalletCards}/>
          <Metric label="Obligations" value={money(reportSummary.obligation)} icon={BarChart3} className="bg-amber-50 text-amber-700"/>
          <Metric label="Disbursements" value={money(reportSummary.disbursement)} icon={ArrowDownToLine} className="bg-violet-50 text-violet-700"/>
          <Metric label="Balance" value={money(reportSummary.balance)} icon={CheckCircle2} className="bg-emerald-50 text-emerald-700"/>
          <Metric label="Records" value={reportRows.length} icon={FileText} className="bg-slate-100 text-slate-700"/>
        </div>

        <ReportPreview title={reportType} entries={reportPageRows} allEntries={reportRows} fiscalYear={selectedFiscalYear} />
        <Pagination currentPage={reportPage} totalPages={reportPageCount} totalItems={reportRows.length} pageSize={LIMIT} onPageChange={setReportPage} />
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
          <SectionTitle title="General Fund 101" text={`FY ${selectedFiscalYear} — RAOD Financial Summary`} />
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
          <SectionTitle title="Recent RAOD Transactions" text={`${overview.total_records || 0} records in FY ${selectedFiscalYear}`} />
        </div>
        <Table columns={entryColumns.filter(c => c.key !== "actions")} rows={(overview.recent_entries || []).slice(0, 10)} empty="No RAOD transactions yet." />
      </div>
    </>
  );

  const renderReportsExport = () => (
    <>
      <BackBar title="8. Reports & Export" onBack={backHome} />
      <div className="space-y-4">
        <div className="rounded-xl border border-green-100 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-widest text-green-600">Reports & Export Center</p>
              <h2 className="mt-1 text-base font-extrabold text-[#10245b]">General Fund / Fund Cluster 101 • FY {selectedFiscalYear}</h2>
              <p className="mt-1 max-w-3xl text-[10px] leading-4 text-slate-500">Official financial, procurement, and accounting reports are consolidated into one report area. This avoids duplicate report containers while keeping the President's Office view simple and organized.</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button type="button" onClick={() => printReport(reportType, reportRows, selectedFiscalYear)} className="rounded-lg border border-slate-200 px-3 py-2 text-[10px] font-bold text-slate-600"><Printer className="mr-1 inline h-3.5 w-3.5"/>Print / Save PDF</button>
              <button type="button" onClick={() => downloadReportCsv(reportType, reportRows, selectedFiscalYear)} className="rounded-lg bg-[#174fd1] px-3 py-2 text-[10px] font-bold text-white"><FileSpreadsheet className="mr-1 inline h-3.5 w-3.5"/>Export Excel</button>
            </div>
          </div>
        </div>

        {/* Five official report containers only — no duplicate Procurement/Accounting cards below. */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {topReportDefinitions.map(item => (
            <button
              key={item.code}
              type="button"
              onClick={() => { setReportType(item.code); setReportPage(1); }}
              className={`min-h-[132px] rounded-xl border p-4 text-left shadow-sm transition ${reportType === item.code ? "border-[#174fd1] bg-blue-50" : "border-slate-100 bg-white hover:border-blue-200 hover:shadow-md"}`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-[11px] font-extrabold leading-4 text-[#10245b]">{item.title}</span>
                <item.icon className={`h-5 w-5 shrink-0 ${reportType === item.code ? "text-[#174fd1]" : "text-slate-400"}`} />
              </div>
              <p className="mt-2 text-[9px] leading-4 text-slate-500">{item.desc}</p>
              <p className="mt-4 text-[9px] font-bold text-[#174fd1]">VIEW REPORT →</p>
            </button>
          ))}
        </div>

        <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="mb-3 border-b border-slate-100 pb-3">
            <h3 className="text-[12px] font-extrabold text-[#10245b]">Report Filters</h3>
            <p className="mt-0.5 text-[9px] text-slate-400">Choose the report and fiscal year for the preview below.</p>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Field label="Report Type"><Select value={reportType} onChange={e => { setReportType(e.target.value); setReportPage(1); }}><option>FAR 1</option><option>FAR 1A</option><option>SARONCA</option><option>PROCUREMENT TRANSACTIONS</option><option>ACCOUNTING TRANSACTIONS</option></Select></Field>
            <Field label="Fiscal Year"><Select value={selectedFiscalYear} onChange={e => { setSelectedFiscalYear(Number(e.target.value)); setReportPage(1); }}><option value={2026}>FY 2026</option></Select></Field>
          </div>
        </div>

        <ReportPreview title={reportType} entries={reportPageRows} allEntries={reportRows} fiscalYear={selectedFiscalYear} />
        <Pagination currentPage={reportPage} totalPages={reportPageCount} totalItems={reportRows.length} pageSize={LIMIT} onPageChange={setReportPage} />
      </div>
    </>
  );

  const renderView = () => {
    if (view === "home") return renderHome();
    if (view === "dashboard") return renderOverview();
    if (view === "allotment-budget") return renderAllotment();
    if (view === "fund-registry") return renderFundRegistry();
    if (view === "transactions") return renderTransactions();
    if (view === "monitoring") return renderMonitoring();
    if (view === "fund-rc-breakdown") return renderBreakdown();
    if (view === "financial-reports") return renderFinancialReports();
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

      {modal === "form" && <Modal title={editing ? "Edit RAOD Transaction" : "Add RAOD Transaction"} onClose={() => setModal(null)} wide><TransactionForm refs={refs} form={form} setForm={setForm} budgetInfo={budgetInfo} editing={editing} role={role} onSubmit={saveEntry} saving={saving} onClose={() => setModal(null)} /></Modal>}

      {modal === "view" && selected && <Modal title={`RAOD Record — ${selected.registry_no || selected.id}`} onClose={() => setModal(null)} wide>
        <div className="grid grid-cols-1 gap-x-5 gap-y-3 md:grid-cols-3">
          {[
            ["Registry No.", selected.registry_no],
            ["Date", dateText(selected.entry_date)],
            ["Fund Cluster", `${selected.fund_cluster_code || ""} ${selected.fund_cluster_name || ""}`],
            ["Fund Source", `${selected.fund_source_code || ""} ${selected.fund_source_name || ""}`],
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
            ["WFP Source", selected.wfp_source],
            ["WFP Source Code", selected.wfp_source_code],
            ["DV / Payroll No.", selected.dv_payroll_no],
            ["PO No.", selected.po_no],
            ["IAR No.", selected.iar_no],
            ["PAR No.", selected.par_no],
            ["ICS No.", selected.ics_no],
            ["RIS No.", selected.ris_no],
            ["Status of PO", selected.po_status || selected.status_of_po],
            ["Obligation", money(selected.obligation_amount)],
            ["PS Obligation", money(selected.ps_obligation)],
            ["MOOE Obligation", money(selected.mooe_obligation)],
            ["CO Obligation", money(selected.co_obligation)],
            ["Disbursement", money(selected.disbursement_amount)],
            ["Running Balance", money(selected.running_balance)],
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
        <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50/40 p-4">
          <p className="text-[9px] font-extrabold uppercase tracking-widest text-blue-700">Accountability / Audit Information</p>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-4">
            <div><p className="text-[8px] font-bold uppercase text-slate-400">Entered By</p><p className="mt-1 text-[10px] font-semibold text-slate-700">{selected.entered_by_name || "—"}</p><p className="text-[8px] text-slate-400">{selected.entered_by_email || ""}</p></div>
            <div><p className="text-[8px] font-bold uppercase text-slate-400">Entered At</p><p className="mt-1 text-[10px] text-slate-700">{selected.entered_at ? new Date(selected.entered_at).toLocaleString() : "—"}</p></div>
            <div><p className="text-[8px] font-bold uppercase text-slate-400">Last Updated By</p><p className="mt-1 text-[10px] font-semibold text-slate-700">{selected.updated_by_name || "—"}</p><p className="text-[8px] text-slate-400">{selected.updated_by_email || ""}</p></div>
            <div><p className="text-[8px] font-bold uppercase text-slate-400">Last Updated At</p><p className="mt-1 text-[10px] text-slate-700">{selected.updated_at ? new Date(selected.updated_at).toLocaleString() : "—"}</p></div>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          {canEditExisting && <button type="button" onPointerDown={(e) => handleEditClick(e, selected)} onClick={(e) => handleEditClick(e, selected)} className="relative z-30 pointer-events-auto rounded-lg border px-3 py-2 text-[10px] font-bold"><Pencil className="mr-1 inline h-3.5 w-3.5"/> Edit</button>}
          {canDelete && <button type="button" onClick={() => setDeleteTarget(selected)} className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-[10px] font-bold text-red-600"><Trash2 className="mr-1 inline h-3.5 w-3.5"/> Delete</button>}
        </div>
      </Modal>}

      {modal === "audit" && selected && <Modal title={`Audit Trail — ${selected.registry_no || selected.id}`} onClose={() => setModal(null)} wide>
        <div className="space-y-3">
          {auditRows.length ? auditRows.map(a => {
            const label = f => ({ registry_no:"Registry No.", burs_serial_no:"BURS Serial No.", entry_date:"Date", payee:"Payee/Name", particulars:"Particulars/Description", obligation_amount:"Utilization", ps_amount:"PS", mooe_amount:"MOOE", co_amount:"CO", dv_payroll_no:"DV/Payroll No.", disbursement_amount:"Disbursement Amount", po_no:"PO No.", iar_no:"IAR No.", par_no:"PAR No.", ics_no:"ICS No.", ris_no:"RIS No.", po_status:"Status of PO", status_of_po:"Status of PO", workflow_status:"Workflow Status" }[f] || String(f || "").replaceAll("_", " "));
            const action = { CREATE:"Record Created", UPDATE:"Record Updated", PROCUREMENT_UPDATE:"Procurement Update", ACCOUNTING_UPDATE:"Accounting Update", CANCEL:"Transaction Cancelled", RESTORE:"Transaction Restored", ADJUSTMENT:"Notice of Adjustment", FINAL_REVIEW:"Final Accounting Review" }[a.action] || String(a.action || "Audit Activity").replaceAll("_", " ");
            const fields = Array.isArray(a.changed_fields) ? a.changed_fields : [];
            const oldV = a.old_values && typeof a.old_values === "object" ? a.old_values : {};
            const newV = a.new_values && typeof a.new_values === "object" ? a.new_values : {};
            return <div key={a.id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
              <div className="flex items-start justify-between border-b border-slate-100 pb-2"><div><p className="text-[11px] font-extrabold text-[#102b67]">{action}</p><p className="text-[9px] text-slate-500">{new Date(a.created_at).toLocaleString()}</p></div><div className="text-right"><p className="text-[10px] font-bold">{a.performed_by_name || "—"}</p><p className="text-[9px] text-slate-500">{a.performed_by_role || "—"}</p></div></div>
              {fields.length ? <div className="mt-2 space-y-1">{fields.map(f => <div key={f} className="grid grid-cols-3 gap-2 rounded-lg bg-slate-50 p-2"><div><p className="text-[8px] font-bold uppercase text-slate-400">Field</p><p className="text-[9px] font-bold">{label(f)}</p></div><div><p className="text-[8px] font-bold uppercase text-slate-400">Previous Value</p><p className="text-[9px] break-words">{String(oldV[f] ?? "—")}</p></div><div><p className="text-[8px] font-bold uppercase text-slate-400">New Value</p><p className="text-[9px] font-semibold break-words">{String(newV[f] ?? "—")}</p></div></div>)}</div> : <p className="mt-2 text-[9px] text-slate-400">No field-level changes recorded.</p>}
            </div>;
          }) : <div className="p-8 text-center text-[10px] text-slate-400">No audit history found for this record.</div>}
        </div>
      </Modal>}

      {deleteTarget && <Modal title="Delete RAOD Record" onClose={() => setDeleteTarget(null)}>
        <p className="text-[11px] leading-5 text-slate-600">Are you sure you want to delete RAOD record <b>{deleteTarget.registry_no || deleteTarget.id}</b>? This action cannot be undone.</p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={() => setDeleteTarget(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-[10px] font-bold text-slate-600">Cancel</button>
          <button type="button" onClick={async () => { const row = deleteTarget; setDeleteTarget(null); await deleteEntry(row); }} className="rounded-lg bg-red-600 px-4 py-2 text-[10px] font-bold text-white">Delete Record</button>
        </div>
      </Modal>}

      {modal === "report" && <Modal title={`${reportType} Preview`} onClose={() => setModal(null)} wide><ReportPreview title={reportType} entries={reportPageRows} allEntries={reportEntries} fiscalYear={selectedFiscalYear} /></Modal>}

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

const accountabilityNames = (...values) => [...new Set(values.flatMap(v => String(v || "").split(",").map(x => x.trim()).filter(Boolean)))].join(", ");

function reportRowsForExport(type, rows) {
  const safe = Array.isArray(rows) ? rows : [];
  if (type === "FAR 1A") {
    const map = new Map();
    safe.forEach(r => {
      const key = `${r.object_expenditure_code || "UNCLASSIFIED"}|${r.uacs_code || ""}`;
      const x = map.get(key) || { object_code: r.object_expenditure_code || "UNCLASSIFIED", object_name: r.object_expenditure_name || "Unclassified", uacs_code: r.uacs_code || "", obligation: 0, disbursement: 0, unpaid: 0, entered_by_names: [], updated_by_names: [] };
      x.obligation += Number(r.obligation_amount || 0); x.disbursement += Number(r.disbursement_amount || 0); x.unpaid += Number(r.unpaid_obligation || 0);
      const entered = accountabilityNames(r.entered_by_name, r.procurement_entered_by_name, r.accounting_entered_by_name);
      const updated = accountabilityNames(r.updated_by_name, r.procurement_updated_by_name, r.accounting_updated_by_name);
      if (entered && !x.entered_by_names.includes(entered)) x.entered_by_names.push(entered);
      if (updated && !x.updated_by_names.includes(updated)) x.updated_by_names.push(updated);
      x.entered_by_name = x.entered_by_names.join("; ");
      x.updated_by_name = x.updated_by_names.join("; ");
      map.set(key, x);
    });
    return [...map.values()];
  }
  return safe.map(r => ({
    ...r,
    report_entered_by_name: accountabilityNames(r.entered_by_name, r.procurement_entered_by_name, r.accounting_entered_by_name),
    report_updated_by_name: accountabilityNames(r.updated_by_name, r.procurement_updated_by_name, r.accounting_updated_by_name),
  }));
}

function reportLabel(type) {
  const labels = {
    "FAR 1": "FAR No. 1",
    "FAR 1A": "FAR No. 1A",
    "SARONCA": "SARONCA",
    "PROCUREMENT TRANSACTIONS": "Procurement Transactions Report",
    "PO STATUS": "PO Status Report",
    "PROCUREMENT ACCOUNTABILITY": "Procurement Accountability Report",
    "ACCOUNTING TRANSACTIONS": "Accounting Transactions Report",
    "OBLIGATION & DISBURSEMENT": "Obligation & Disbursement Report",
    "UNPAID OBLIGATIONS": "Unpaid Obligations Report",
  };
  return labels[type] || type;
}
function downloadReportCsv(type, rows, fiscalYear = FY) {
  const data = reportRowsForExport(type, rows);
  let headers;
  let body;
  if (type === "FAR 1A") {
    headers = ["Object Code","Object of Expenditure","UACS Code","Obligations","Disbursements","Unpaid Obligation","Balance After Disbursement"];
    body = data.map(r => [r.object_code,r.object_name,r.uacs_code,r.obligation,r.disbursement,r.unpaid,Math.max(0,Number(r.obligation||0)-Number(r.disbursement||0))]);
  } else if (type === "SARONCA") {
    headers = ["Registry No.","Date","PAP","UACS Code","Reference","Obligation","Disbursement / NCA Utilization","Unpaid Obligation","Fund Cluster"];
    body = data.map(r => [r.registry_no,dateText(r.entry_date),r.pap_name,r.uacs_code,r.ref_no,r.obligation_amount,r.disbursement_amount,r.unpaid_obligation,r.fund_cluster_code || "101"]);
  } else if (type === "PROCUREMENT TRANSACTIONS" || type === "PROCUREMENT ACCOUNTABILITY") {
    headers = ["Registry No.","Date","Payee","PAP","UACS Code","PO No.","IAR No.","PAR No.","ICS No.","RIS No.","PO Status","Obligation","Disbursement","Unpaid Obligation","Entered By","Updated By"];
    body = data.map(r => [r.registry_no,dateText(r.entry_date),r.payee,r.pap_name,r.uacs_code,r.po_no,r.iar_no,r.par_no,r.ics_no,r.ris_no,r.po_status,r.obligation_amount,r.disbursement_amount,r.unpaid_obligation,r.procurement_entered_by_name || r.report_entered_by_name || r.entered_by_name,r.procurement_updated_by_name || r.report_updated_by_name || r.updated_by_name]);
  } else if (type === "PO STATUS") {
    headers = ["Registry No.","Date","Payee","PO No.","PO Status","IAR No.","PAR No.","ICS No.","RIS No.","Obligation","Disbursement","Procurement Entered By","Procurement Updated By"];
    body = data.map(r => [r.registry_no,dateText(r.entry_date),r.payee,r.po_no,r.po_status,r.iar_no,r.par_no,r.ics_no,r.ris_no,r.obligation_amount,r.disbursement_amount,r.procurement_entered_by_name || r.report_entered_by_name || r.entered_by_name,r.procurement_updated_by_name || r.report_updated_by_name || r.updated_by_name]);
  } else if (type === "ACCOUNTING TRANSACTIONS") {
    headers = ["Registry No.","Date","Payee","PAP","UACS Code","DV/Payroll No.","Obligation","PS","MOOE","CO","Disbursement","Unpaid Obligation","Balance","Entered By","Updated By"];
    body = data.map(r => [r.registry_no,dateText(r.entry_date),r.payee,r.pap_name,r.uacs_code,r.dv_payroll_no,r.obligation_amount,r.ps_obligation,r.mooe_obligation,r.co_obligation,r.disbursement_amount,r.unpaid_obligation,Math.max(0,Number(r.obligation_amount||0)-Number(r.disbursement_amount||0)),r.accounting_entered_by_name || r.report_entered_by_name || r.entered_by_name,r.accounting_updated_by_name || r.report_updated_by_name || r.updated_by_name]);
  } else if (type === "OBLIGATION & DISBURSEMENT") {
    headers = ["Registry No.","Date","Payee","DV/Payroll No.","Obligation","Disbursement","Unpaid Obligation","Balance"];
    body = data.map(r => [r.registry_no,dateText(r.entry_date),r.payee,r.dv_payroll_no,r.obligation_amount,r.disbursement_amount,r.unpaid_obligation,Math.max(0,Number(r.obligation_amount||0)-Number(r.disbursement_amount||0))]);
  } else if (type === "UNPAID OBLIGATIONS") {
    headers = ["Registry No.","Date","Payee","PAP","UACS Code","Obligation","Disbursement","Unpaid Obligation","DV/Payroll No."];
    body = data.map(r => [r.registry_no,dateText(r.entry_date),r.payee,r.pap_name,r.uacs_code,r.obligation_amount,r.disbursement_amount,r.unpaid_obligation,r.dv_payroll_no]);
  } else {
    headers = ["Registry No.","Date","Fund Cluster","Fund Source","Campus","ORS Serial No.","Payee","Particulars","Responsibility Center","PAP","UACS Code","Allotment Class","Fiscal Year","Month","Quarter","Object of Expenditure","MFO","Account Title","Obligation","PS","MOOE","CO","WFP Source","DV/Payroll No.","Disbursement","Unpaid Obligation","PO No.","IAR No.","PAR No.","ICS No.","RIS No.","PO Status","Remarks"];
    body = data.map(r => [r.registry_no,dateText(r.entry_date),r.fund_cluster_code,r.fund_source_code,r.campus_code,r.ors_serial_no,r.payee,r.particulars,r.responsibility_center_name,r.pap_name,r.uacs_code,r.allotment_class_name,r.fiscal_year,r.month,r.quarter,r.object_expenditure_name,r.mfo_name,r.account_title,r.obligation_amount,r.ps_obligation,r.mooe_obligation,r.co_obligation,r.wfp_source_code,r.dv_payroll_no,r.disbursement_amount,r.unpaid_obligation,r.po_no,r.iar_no,r.par_no,r.ics_no,r.ris_no,r.po_status,r.remarks]);
  }
  const esc=v=>`"${String(v??"").replace(/"/g,'""')}"`;
  const csv=[headers.map(esc).join(","),...body.map(row=>row.map(esc).join(","))].join("\r\n");
  const blob=new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8;"});
  const url=URL.createObjectURL(blob); const a=document.createElement("a");
  a.href=url; a.download=`${type.replace(/\s+/g,"_")}_Fund101_FY${fiscalYear}.csv`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}
function printReport(type, rows, fiscalYear = FY) {
  const data = reportRowsForExport(type, rows);
  const esc = v => String(v ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  let headers, body;
  if (type === "FAR 1A") {
    headers=["Object Code","Object of Expenditures","UACS Code","Obligations","Disbursements","Unpaid Obligation","Balance"];
    body=data.map(r=>[r.object_code,r.object_name,r.uacs_code,money(r.obligation),money(r.disbursement),money(r.unpaid),money(Math.max(0,Number(r.obligation||0)-Number(r.disbursement||0)))]);
  } else if (type === "SARONCA") {
    headers=["Registry No.","Date","PAP","UACS","Reference","Obligation","Disbursement / NCA Utilization","Unpaid Obligation"];
    body=data.map(r=>[r.registry_no,dateText(r.entry_date),r.pap_name,r.uacs_code,r.ref_no,money(r.obligation_amount),money(r.disbursement_amount),money(r.unpaid_obligation)]);
  } else if (type === "PROCUREMENT TRANSACTIONS" || type === "PROCUREMENT ACCOUNTABILITY") {
    headers=["Registry No.","Date","Payee","PAP","UACS","PO No.","IAR No.","PAR No.","ICS No.","RIS No.","PO Status","Obligation","Disbursement","Unpaid Obligation"];
    body=data.map(r=>[r.registry_no,dateText(r.entry_date),r.payee,r.pap_name,r.uacs_code,r.po_no,r.iar_no,r.par_no,r.ics_no,r.ris_no,r.po_status,money(r.obligation_amount),money(r.disbursement_amount),money(r.unpaid_obligation)]);
  } else if (type === "PO STATUS") {
    headers=["Registry No.","Date","Payee","PO No.","PO Status","IAR No.","PAR No.","ICS No.","RIS No.","Obligation","Disbursement"];
    body=data.map(r=>[r.registry_no,dateText(r.entry_date),r.payee,r.po_no,r.po_status,r.iar_no,r.par_no,r.ics_no,r.ris_no,money(r.obligation_amount),money(r.disbursement_amount)]);
  } else if (type === "ACCOUNTING TRANSACTIONS") {
    headers=["Registry No.","Date","Payee","PAP","UACS","DV/Payroll No.","Obligation","PS","MOOE","CO","Disbursement","Unpaid Obligation","Balance"];
    body=data.map(r=>[r.registry_no,dateText(r.entry_date),r.payee,r.pap_name,r.uacs_code,r.dv_payroll_no,money(r.obligation_amount),money(r.ps_obligation),money(r.mooe_obligation),money(r.co_obligation),money(r.disbursement_amount),money(r.unpaid_obligation),money(Math.max(0,Number(r.obligation_amount||0)-Number(r.disbursement_amount||0)))]);
  } else if (type === "OBLIGATION & DISBURSEMENT") {
    headers=["Registry No.","Date","Payee","DV/Payroll No.","Obligation","Disbursement","Unpaid Obligation","Balance"];
    body=data.map(r=>[r.registry_no,dateText(r.entry_date),r.payee,r.dv_payroll_no,money(r.obligation_amount),money(r.disbursement_amount),money(r.unpaid_obligation),money(Math.max(0,Number(r.obligation_amount||0)-Number(r.disbursement_amount||0)))]);
  } else if (type === "UNPAID OBLIGATIONS") {
    headers=["Registry No.","Date","Payee","PAP","UACS","Obligation","Disbursement","Unpaid Obligation","DV/Payroll No."];
    body=data.map(r=>[r.registry_no,dateText(r.entry_date),r.payee,r.pap_name,r.uacs_code,money(r.obligation_amount),money(r.disbursement_amount),money(r.unpaid_obligation),r.dv_payroll_no]);
  } else {
    headers=["RAOD No.","Date","Responsibility Center","PAP","UACS Code","Particulars","Payee","Obligation","Disbursement","Balance"];
    body=data.map(r=>[r.registry_no,dateText(r.entry_date),r.responsibility_center_name,r.pap_name,r.uacs_code,r.particulars,r.payee,money(r.obligation_amount),money(r.disbursement_amount),money(r.unpaid_obligation)]);
  }
  const html=`<!doctype html><html><head><title>${esc(reportLabel(type))} FY ${fiscalYear}</title><style>@page{size:A4 landscape;margin:12mm}body{font-family:Arial,sans-serif;color:#111;font-size:9px}h1,h2,p{text-align:center;margin:3px 0}h1{font-size:15px}h2{font-size:12px}.meta{text-align:center;color:#555;margin-bottom:12px}.sub{text-align:center;color:#666;font-size:8px;margin-bottom:8px}table{width:100%;border-collapse:collapse;margin-top:10px}th,td{border:1px solid #999;padding:4px;vertical-align:top}th{background:#e9edf3;font-size:8px}td{font-size:8px}.num{text-align:right}.sign{margin-top:24px;display:grid;grid-template-columns:1fr 1fr;gap:60px}.line{border-top:1px solid #333;padding-top:5px;text-align:center}</style></head><body><h1>UNIVERSITY OF ABRA</h1><h2>${esc(reportLabel(type))}</h2><p class="meta">General Fund / Fund Cluster 101 • Fiscal Year ${fiscalYear}</p><p class="sub">System-generated official office report • Accountability fields excluded from print/PDF</p><table><thead><tr>${headers.map(h=>`<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${body.map(row=>`<tr>${row.map((v,i)=>`<td class="${typeof v === "string" && (v.startsWith("₱") || i>=7)?"num":""}">${esc(v)}</td>`).join("")}</tr>`).join("")}</tbody></table><div class="sign"><div class="line">Prepared by</div><div class="line">Certified Correct / Approved by</div></div></body></html>`;
  const w=window.open("","_blank","width=1200,height=800");
  if(!w){alert("Please allow pop-ups to print the report.");return;}
  w.document.write(html); w.document.close(); w.focus(); setTimeout(()=>{w.print();},300);
}
function ReportList({ onGenerate }) {
  const reports = [
    ["FAR 1","Statement of Appropriations, Allotments, Obligations, Disbursements and Balances"],
    ["FAR 1A","Summary of Appropriations, Allotments, Obligations, Disbursements and Balances by Object of Expenditures"],
    ["SARONCA","Summary of Appropriations, Releases, Obligations and Notice of Cash Allocation"],
  ];
  return <div className="space-y-2">{reports.map(([x,d]) => <div key={x} className="flex items-center justify-between rounded-lg border border-slate-100 p-3"><div><p className="text-[10px] font-bold text-slate-700">{x}</p><p className="text-[9px] text-slate-400">{d}</p></div><button type="button" onClick={() => onGenerate(x)} className="rounded-lg bg-[#174fd1] px-3 py-2 text-[9px] font-bold text-white">Generate</button></div>)}</div>;
}

function reportDescription(x) {
  if (x === "FAR 1") return "Financial Accountability Report No. 1 — Statement of Appropriations, Allotments, Obligations, Disbursements and Balances.";
  if (x === "FAR 1A") return "Financial Accountability Report No. 1A — Summary by Object of Expenditures.";
  if (x === "SARONCA") return "System summary of appropriations, releases/allotments, obligations and NCA-related utilization captured in RAOD.";
  if (x === "PROCUREMENT TRANSACTIONS") return "Procurement references recorded in RAOD, including PO, IAR, PAR, ICS, RIS and status.";
  if (x === "PO STATUS") return "Purchase order monitoring report with current PO status and related procurement references.";
  if (x === "PROCUREMENT ACCOUNTABILITY") return "Procurement entries with the user who entered and last updated the procurement data.";
  if (x === "ACCOUNTING TRANSACTIONS") return "Accounting report covering DV/Payroll, obligation components, disbursement and accountability.";
  if (x === "OBLIGATION & DISBURSEMENT") return "Obligation and disbursement movement for General Fund 101.";
  if (x === "UNPAID OBLIGATIONS") return "Outstanding obligations requiring accounting follow-up.";
  return "RAOD report preview.";
}

function ReportPreview({ title, entries, allEntries = [], fiscalYear = FY }) {
  const data = reportRowsForExport(title, entries);
  const totalOb = allEntries.reduce((a,r)=>a+Number(r.obligation_amount||0),0);
  const totalDis = allEntries.reduce((a,r)=>a+Number(r.disbursement_amount||0),0);
  const renderRows = () => {
    if (title === "FAR 1A") return data.map((r,i)=><tr key={i}><td>{r.object_code}</td><td>{r.object_name}</td><td>{r.uacs_code||"—"}</td><td className="text-right">{money(r.obligation)}</td><td className="text-right">{money(r.disbursement)}</td><td className="text-right">{money(r.unpaid)}</td><td className="text-right">{money(Math.max(0,Number(r.obligation||0)-Number(r.disbursement||0)))}</td><td>{r.report_entered_by_name || r.entered_by_name || "—"}</td><td>{r.report_updated_by_name || r.updated_by_name || "—"}</td></tr>);
    if (title === "SARONCA") return data.map(r=><tr key={r.id}><td>{r.registry_no}</td><td>{dateText(r.entry_date)}</td><td>{r.pap_name||"—"}</td><td>{r.uacs_code||"—"}</td><td>{r.ref_no||"—"}</td><td className="text-right">{money(r.obligation_amount)}</td><td className="text-right">{money(r.disbursement_amount)}</td><td className="text-right">{money(r.unpaid_obligation)}</td><td>{r.report_entered_by_name || r.entered_by_name || "—"}</td><td>{r.report_updated_by_name || r.updated_by_name || "—"}</td></tr>);
    if (title === "PROCUREMENT TRANSACTIONS" || title === "PROCUREMENT ACCOUNTABILITY") return data.map(r=><tr key={r.id}><td>{r.registry_no}</td><td>{dateText(r.entry_date)}</td><td>{r.payee||"—"}</td><td>{r.pap_name||"—"}</td><td>{r.uacs_code||"—"}</td><td>{r.po_no||"—"}</td><td>{r.iar_no||"—"}</td><td>{r.par_no||"—"}</td><td>{r.ics_no||"—"}</td><td>{r.ris_no||"—"}</td><td>{r.po_status||"—"}</td><td className="text-right">{money(r.obligation_amount)}</td><td className="text-right">{money(r.disbursement_amount)}</td><td className="text-right">{money(r.unpaid_obligation)}</td><td className="sticky right-[160px] z-10 min-w-[160px] bg-white font-semibold text-slate-700">{r.procurement_entered_by_name || "—"}</td><td className="sticky right-0 z-10 min-w-[160px] bg-white font-semibold text-slate-700">{r.procurement_updated_by_name || "—"}</td></tr>);
    if (title === "PO STATUS") return data.map(r=><tr key={r.id}><td>{r.registry_no}</td><td>{dateText(r.entry_date)}</td><td>{r.payee||"—"}</td><td>{r.po_no||"—"}</td><td>{r.po_status||"—"}</td><td>{r.iar_no||"—"}</td><td>{r.par_no||"—"}</td><td>{r.ics_no||"—"}</td><td>{r.ris_no||"—"}</td><td className="text-right">{money(r.obligation_amount)}</td><td className="text-right">{money(r.disbursement_amount)}</td><td className="sticky right-[160px] z-10 min-w-[160px] bg-white font-semibold text-slate-700">{r.procurement_entered_by_name || "—"}</td><td className="sticky right-0 z-10 min-w-[160px] bg-white font-semibold text-slate-700">{r.procurement_updated_by_name || "—"}</td></tr>);
    if (title === "ACCOUNTING TRANSACTIONS") return data.map(r=><tr key={r.id}><td>{r.registry_no}</td><td>{dateText(r.entry_date)}</td><td>{r.payee||"—"}</td><td>{r.pap_name||"—"}</td><td>{r.uacs_code||"—"}</td><td>{r.dv_payroll_no||"—"}</td><td className="text-right">{money(r.obligation_amount)}</td><td className="text-right">{money(r.ps_obligation)}</td><td className="text-right">{money(r.mooe_obligation)}</td><td className="text-right">{money(r.co_obligation)}</td><td className="text-right">{money(r.disbursement_amount)}</td><td className="text-right">{money(r.unpaid_obligation)}</td><td className="text-right">{money(Math.max(0,Number(r.obligation_amount||0)-Number(r.disbursement_amount||0)))}</td><td>{r.accounting_entered_by_name || r.report_entered_by_name || r.entered_by_name || "—"}</td><td>{r.accounting_updated_by_name || r.report_updated_by_name || r.updated_by_name || "—"}</td></tr>);
    if (title === "OBLIGATION & DISBURSEMENT") return data.map(r=><tr key={r.id}><td>{r.registry_no}</td><td>{dateText(r.entry_date)}</td><td>{r.payee||"—"}</td><td>{r.dv_payroll_no||"—"}</td><td className="text-right">{money(r.obligation_amount)}</td><td className="text-right">{money(r.disbursement_amount)}</td><td className="text-right">{money(r.unpaid_obligation)}</td><td className="text-right">{money(Math.max(0,Number(r.obligation_amount||0)-Number(r.disbursement_amount||0)))}</td></tr>);
    if (title === "UNPAID OBLIGATIONS") return data.map(r=><tr key={r.id}><td>{r.registry_no}</td><td>{dateText(r.entry_date)}</td><td>{r.payee||"—"}</td><td>{r.pap_name||"—"}</td><td>{r.uacs_code||"—"}</td><td className="text-right">{money(r.obligation_amount)}</td><td className="text-right">{money(r.disbursement_amount)}</td><td className="text-right">{money(r.unpaid_obligation)}</td><td>{r.dv_payroll_no||"—"}</td></tr>);
    if (title === "FAR 1") return data.map(r=><tr key={r.id}><td>{r.registry_no}</td><td>{dateText(r.entry_date)}</td><td>{r.responsibility_center_name||"—"}</td><td>{r.pap_name||"—"}</td><td>{r.uacs_code||"—"}</td><td>{r.particulars||"—"}</td><td>{r.payee||"—"}</td><td className="text-right">{money(r.obligation_amount)}</td><td className="text-right">{money(r.disbursement_amount)}</td><td className="text-right">{money(r.unpaid_obligation)}</td><td>{r.report_entered_by_name || r.entered_by_name || "—"}</td><td>{r.report_updated_by_name || r.updated_by_name || "—"}</td></tr>);
    return data.map(r=><tr key={r.id}><td>{r.registry_no}</td><td>{dateText(r.entry_date)}</td><td>{r.responsibility_center_name||"—"}</td><td>{r.pap_name||"—"}</td><td>{r.uacs_code||"—"}</td><td>{r.particulars||"—"}</td><td>{r.payee||"—"}</td><td className="text-right">{money(r.obligation_amount)}</td><td className="text-right">{money(r.disbursement_amount)}</td><td className="text-right">{money(r.unpaid_obligation)}</td><td>{r.report_entered_by_name || r.entered_by_name || "—"}</td><td>{r.report_updated_by_name || r.updated_by_name || "—"}</td></tr>);
  };
  const headers = {
    "FAR 1A":["Object Code","Object of Expenditures","UACS Code","Obligations","Disbursements","Unpaid Obligation","Balance","Entered By","Updated By"],
    "SARONCA":["Registry No.","Date","PAP","UACS Code","Reference","Obligation","Disbursement / NCA Utilization","Unpaid Obligation","Entered By","Updated By"],
    "PROCUREMENT TRANSACTIONS":["Registry No.","Date","Payee","PAP","UACS","PO No.","IAR No.","PAR No.","ICS No.","RIS No.","PO Status","Obligation","Disbursement","Unpaid Obligation","Procurement Entered By","Procurement Updated By"],
    "PROCUREMENT ACCOUNTABILITY":["Registry No.","Date","Payee","PAP","UACS","PO No.","IAR No.","PAR No.","ICS No.","RIS No.","PO Status","Obligation","Disbursement","Unpaid Obligation","Procurement Entered By","Procurement Updated By"],
    "PO STATUS":["Registry No.","Date","Payee","PO No.","PO Status","IAR No.","PAR No.","ICS No.","RIS No.","Obligation","Disbursement","Procurement Entered By","Procurement Updated By"],
    "ACCOUNTING TRANSACTIONS":["Registry No.","Date","Payee","PAP","UACS","DV/Payroll No.","Obligation","PS","MOOE","CO","Disbursement","Unpaid Obligation","Balance","Accounting Entered By","Accounting Updated By"],
    "OBLIGATION & DISBURSEMENT":["Registry No.","Date","Payee","DV/Payroll No.","Obligation","Disbursement","Unpaid Obligation","Balance"],
    "UNPAID OBLIGATIONS":["Registry No.","Date","Payee","PAP","UACS","Obligation","Disbursement","Unpaid Obligation","DV/Payroll No."],
    "FAR 1":["Registry No.","Date","Responsibility Center","PAP","UACS Code","Particulars","Payee","Obligation","Disbursement","Unpaid Obligation","Entered By","Updated By"],
  }[title] || ["RAOD No.","Date","Responsibility Center","PAP","UACS Code","Particulars","Payee","Obligation","Disbursement","Unpaid Obligation","Entered By","Updated By"];
  const wideTable = title === "FAR 1" || title === "FAR 1A" || title === "SARONCA" || title === "PROCUREMENT TRANSACTIONS" || title === "PROCUREMENT ACCOUNTABILITY" || title === "ACCOUNTING TRANSACTIONS";
  const procurementReport = title === "PROCUREMENT TRANSACTIONS" || title === "PROCUREMENT ACCOUNTABILITY" || title === "PO STATUS";
  const tableMinWidth = procurementReport ? "min-w-[1800px]" : (wideTable ? "min-w-[1500px]" : "min-w-[1100px]");
  return <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm print:shadow-none">
    <div className="border-b-2 border-[#102b67] pb-3 text-center"><p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">University of Abra</p><h2 className="mt-1 text-lg font-extrabold text-slate-800">{reportLabel(title)}</h2><p className="mt-1 text-[10px] text-slate-500">{reportDescription(title)}</p><p className="text-[10px] text-slate-400">General Fund / Fund Cluster 101 • FY {fiscalYear}</p></div>
    <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4"><Metric label="Records" value={allEntries.length} icon={FileText}/><Metric label="Obligations" value={money(totalOb)} icon={BarChart3} className="bg-amber-50 text-amber-700"/><Metric label="Disbursements" value={money(totalDis)} icon={ArrowDownToLine} className="bg-violet-50 text-violet-700"/><Metric label="Unpaid" value={money(Math.max(0,totalOb-totalDis))} icon={ClipboardList} className="bg-red-50 text-red-700"/></div>
    <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200">
      <table className={`${tableMinWidth} w-full table-auto text-[11px] [&_td]:whitespace-nowrap [&_td]:px-3 [&_td]:py-3 [&_td]:align-middle [&_tbody_tr:hover]:bg-slate-50`}>
        <thead>
          <tr className="bg-[#102b67] font-bold text-white">
            {headers.map(h=><th key={h} className={`whitespace-nowrap border-r border-white/10 px-3 py-3 text-left text-[10px] font-extrabold uppercase tracking-wide ${procurementReport && h === "Procurement Entered By" ? "sticky right-[160px] z-20 bg-[#102b67]" : procurementReport && h === "Procurement Updated By" ? "sticky right-0 z-20 bg-[#102b67]" : ""}`}>{h}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {renderRows()}
        </tbody>
      </table>
    </div>
    {entries.length === 0 && <div className="py-10 text-center text-[11px] text-slate-400">No report data for the selected fiscal year.</div>}
    {procurementReport && entries.length > 0 && <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-[10px] text-blue-700">Procurement accountability is shown in the two sticky columns on the right. A dash (—) means no Procurement audit entry has been recorded for that RAOD transaction.</div>}
    <div className="mt-4 border-t border-slate-100 pt-3 text-[10px] text-slate-500">Screen report. Entered By / Updated By are shown only on accountability views. Official Print / PDF intentionally excludes these internal audit fields.</div>
  </div>;
}
export default RaodRegistry;