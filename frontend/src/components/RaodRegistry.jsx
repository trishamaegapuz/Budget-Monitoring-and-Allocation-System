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
const DEPARTMENT_PAGE_SIZE = 10;
const MONITORING_PAGE_SIZE = 10;
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
  wfp_source_id: "",
  wfp_source_code: "",
  dv_payroll_no: "",
  disbursement_amount: "",
  remarks: "",
  unpaid_obligation: "",
  po_no: "",
  po_status: "",

};

const cardData = [
  {
    id: "dashboard",
    title: "1. Dashboard",
    desc: "See the overall allotment, obligation, disbursement, and remaining balance at a glance.",
    color: "bg-blue-600",
    icon: WalletCards,
  },
  {
    id: "allotment-budget",
    title: "2. Allotment & Budget",
    desc: "View approved allotment, PS/MOOE/CO classification, obligations, and balances.",
    color: "bg-emerald-500",
    icon: BarChart3,
  },
  {
    id: "transactions",
    title: "3. Transactions",
    desc: "Record, edit, view, and monitor RAOD obligation and disbursement transactions.",
    color: "bg-orange-500",
    icon: FileText,
  },
  {
    id: "monitoring",
    title: "4. Monitoring",
    desc: "Monitor allotment, obligation, disbursement, and remaining balances.",
    color: "bg-teal-500",
    icon: BarChart3,
  },
  {
    id: "reports-export",
    title: "5. Reports & Export",
    desc: "Generate financial reports, view the RAOD registry, and print or export records.",
    color: "bg-violet-600",
    icon: Download,
  },
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
          <h3 className="text-[15px] font-extrabold text-[#10245b]">{item.title}</h3>
          <p className="mt-1 text-[12px] leading-5 text-slate-500">{item.desc}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onClick(item.id)}
        className={`mt-4 flex h-10 w-full items-center justify-center gap-1 rounded-lg border text-[11px] font-bold transition ${
          item.id === "dashboard"
            ? "border-blue-500 bg-white text-[#174fd1] hover:bg-blue-50"
            : item.id === "allotment-budget"
              ? "border-emerald-500 bg-white text-emerald-600 hover:bg-emerald-50"
              : item.id === "transactions"
                ? "border-orange-500 bg-white text-orange-600 hover:bg-orange-50"
                : item.id === "monitoring"
                  ? "border-teal-500 bg-white text-teal-600 hover:bg-teal-50"
                  : "border-violet-500 bg-white text-violet-600 hover:bg-violet-50"
        }`}
      >
        {item.id === "dashboard" ? "Go to Dashboard" : item.id === "allotment-budget" ? "Open Allotment & Budget" : item.id === "transactions" ? "Open Transactions" : item.id === "monitoring" ? "Open Monitoring" : "Open Reports & Export"}
        <ArrowRight className="h-3 w-3" />
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

function TransactionForm({ refs, form, setForm, budgetInfo, editing, onSubmit, saving, onClose }) {
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
            <Select value={form.fund_cluster_id} disabled>
              {options(refs.fund_clusters)
                .filter(x => String(x.code) === "101")
                .map(x => (
                  <option key={x.id} value={x.id}>{x.code} — {x.name}</option>
                ))}
            </Select>
          </Field>
          <Field label="Fund Code">
            <Select value={form.fund_source_id} disabled>
              {options(refs.fund_sources)
                .filter(x => String(x.code).toUpperCase() === "MAIN" || /main fund/i.test(String(x.name || "")))
                .map(x => (
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
            <Input type="number" value={FY} readOnly />
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

      {/* Budget verification: allotment is sourced from budget_items, not entered manually in RAOD. */}
      <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-wide text-amber-700">
              Budget Verification
            </p>
            <p className="mt-0.5 text-[9px] text-slate-500">
              Approved allotment is verified from the selected Responsibility Center's budget for the selected fiscal year.
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
            <p className="text-[8px] font-bold uppercase text-slate-400">Approved Allotment</p>
            <p className="mt-1 text-[12px] font-extrabold text-slate-800">
              {money(budgetInfo?.allocation ?? budgetInfo?.allotment ?? 0)}
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
                  Number(budgetInfo?.allocation ?? budgetInfo?.allotment ?? 0) -
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
                  Number(budgetInfo?.allocation ?? budgetInfo?.allotment ?? 0) -
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

      {/* RAOD financial amounts */}
      <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4">
        <p className="mb-3 text-[10px] font-extrabold uppercase tracking-wide text-emerald-700">
          Obligation and Disbursement
        </p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Field label="Obligation">
            <Input required type="number" min="0" step="0.01" value={form.obligation_amount} onChange={e => set("obligation_amount", e.target.value)} />
          </Field>
          <Field label="Disbursement">
            <Input type="number" min="0" step="0.01" value={form.disbursement_amount} onChange={e => set("disbursement_amount", e.target.value)} />
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
                Number(budgetInfo?.allocation ?? budgetInfo?.allotment ?? 0) -
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
              onChange={e => set("dv_payroll_no", e.target.value)}
            />
          </Field>
          <Field label="PO No.">
            <Input value={form.po_no} onChange={e => set("po_no", e.target.value)} />
          </Field>
          <Field label="Status of PO">
            <Select value={form.po_status} onChange={e => set("po_status", e.target.value)}>
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
  const [modal, setModal] = useState(null);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [budgetInfo, setBudgetInfo] = useState(null);
  const [moduleData, setModuleData] = useState({});
  const [reportType, setReportType] = useState("FAR 1");
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
    } catch (e) {
      setError(e.message);
    }
  }, [fetchJson, loadEntries, selectedFiscalYear]);

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
    loadDepartmentBudget(form.responsibility_center_id, form.fiscal_year || FY)
      .catch(e => setError(e.message));
  }, [modal, form.responsibility_center_id, form.fiscal_year, loadDepartmentBudget]);

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
      fiscal_year: selectedFiscalYear,
    });
    setModal("form");
  };

  const openEdit = (row) => {
    setBudgetInfo(null);
    const f = { ...emptyForm };
    Object.keys(f).forEach(k => { f[k] = row[k] ?? ""; });
    ["fund_cluster_id","fund_source_id","campus_id","responsibility_center_id","pap_id","uacs_code_id","allotment_class_id","wfp_source_id","object_expenditure_id","mfo_id","old_uacs_code_id","month","quarter"]
      .forEach(k => { f[k] = row[k] === null || row[k] === undefined ? "" : String(row[k]); });
    f.dv_payroll_no = row.dv_payroll_no ?? "";
    f.po_status = row.po_status ?? row.status_of_po ?? "";
    f.entry_date = row.entry_date ? String(row.entry_date).slice(0, 10) : "";
    setEditing(row);
    setForm(f);
    setModal("form");
  };

  const saveEntry = async (e) => {
    e.preventDefault();

    const obligation = Number(form.obligation_amount || 0);
    const disbursement = Number(form.disbursement_amount || 0);
    const allocation = Number(budgetInfo?.allocation ?? budgetInfo?.allotment ?? 0);
    const existingObligation = Number(budgetInfo?.obligation || 0);
    const oldObligation = Number(editing?.obligation_amount || 0);

    if (!form.registry_no.trim()) {
      setError("Registry No. is required.");
      return;
    }

    if (!form.entry_date) {
      setError("Date is required.");
      return;
    }

    if (!form.responsibility_center_id) {
      setError("Responsibility Center is required.");
      return;
    }

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
    const projectedRunningBalance = Math.max(0, availableBefore - obligation);

    if (obligation > availableBefore) {
      setError(
        `Obligation of ${money(obligation)} exceeds the available allotment of ${money(availableBefore)} for this Responsibility Center.`
      );
      return;
    }

    if (disbursement > obligation) {
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
          fund_cluster_id: generalCluster?.id ? String(generalCluster.id) : form.fund_cluster_id,
          fund_source_id: generalSource?.id ? String(generalSource.id) : form.fund_source_id,
          fiscal_year: selectedFiscalYear,
          obligation_amount: obligation,
          disbursement_amount: disbursement,
          unpaid_obligation: Math.max(0, obligation - disbursement),
          allotment_amount: allocation,
          ps_amount: Number(budgetInfo?.breakdown?.ps || 0),
          mooe_amount: Number(budgetInfo?.breakdown?.mooe || 0),
          co_amount: Number(budgetInfo?.breakdown?.co || 0),
          status_of_po: form.po_status || "",
          created_by: user?.id,
          updated_by: user?.id,
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
        <button type="button" title="Edit" onClick={() => openEdit(r)} className="rounded-md border border-slate-200 p-1.5 text-slate-500 hover:text-blue-600"><Pencil className="h-3.5 w-3.5" /></button>
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
          <button type="button" title="Edit" onClick={() => openEdit(r)} className="rounded-md border border-slate-200 bg-white p-1.5 text-slate-500 hover:border-blue-200 hover:text-blue-600">
            <Pencil className="h-3.5 w-3.5" />
          </button>
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
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
            <CalendarDays className="h-4 w-4 text-[#174fd1]" />
            <label htmlFor="raod-fiscal-year" className="text-[11px] font-semibold text-slate-500">Fiscal Year</label>
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
              className="h-9 rounded-md border border-slate-200 bg-white px-3 text-[12px] font-bold text-[#10245b] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
            </select>
            <ChevronDown className="-ml-7 pointer-events-none h-4 w-4 text-slate-500" />
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
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600"><WalletCards className="h-5 w-5" /></span>
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
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><BarChart3 className="h-5 w-5" /></span>
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
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-600"><ArrowDownToLine className="h-5 w-5" /></span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-orange-500" style={{ width: `${Math.min(100, disbursementVsAllotment)}%` }} /></div>
            <p className="mt-1 text-right text-[10px] font-semibold text-slate-500">{disbursementVsAllotment.toFixed(2)}%</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Unobligated Balance</p>
                <p className="mt-2 text-[21px] font-extrabold tracking-tight text-[#10245b]">{money(unobligated)}</p>
                <p className="mt-1 text-[11px] text-slate-400">remaining from allotment</p>
              </div>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-violet-50 text-violet-600"><CheckCircle2 className="h-5 w-5" /></span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-violet-500" style={{ width: `${Math.min(100, pct(unobligated, allotment))}%` }} /></div>
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
              <button type="button" onClick={() => openView("dashboard")} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#174fd1] px-5 py-3 text-[12px] font-bold text-white shadow-sm hover:bg-blue-700">
                Go to Dashboard <ArrowRight className="h-4 w-4" />
              </button>
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
          <div className="grid grid-cols-1 items-stretch gap-3 md:grid-cols-2 xl:grid-cols-5">
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
      {fundTab === "overview" && <div className="grid grid-cols-2 gap-3 md:grid-cols-4"><Metric label="Allotment" value={money(allotment)} icon={WalletCards}/><Metric label="Obligations" value={money(obligation)} icon={BarChart3} className="bg-amber-50 text-amber-700"/><Metric label="Disbursements" value={money(disbursement)} icon={ArrowDownToLine} className="bg-violet-50 text-violet-700"/><Metric label="Unobligated" value={money(unobligated)} icon={CheckCircle2} className="bg-emerald-50 text-emerald-700"/></div>}
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

  const renderFinancialReports = () => (
    <>
      <BackBar title="7. Financial Accountability Reports" onBack={backHome} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <p className="mb-3 text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Report Type</p>
          {["FAR 1","FAR 1A","SARONCA"].map(x => <button key={x} type="button" onClick={() => setReportType(x)} className={`mb-2 flex w-full items-center justify-between rounded-lg border px-3 py-3 text-left text-[10px] font-bold ${reportType === x ? "border-blue-200 bg-blue-50 text-blue-700" : "border-slate-100 text-slate-600"}`}>{x}<ArrowRight className="h-3.5 w-3.5"/></button>)}
        </div>
        <div className="lg:col-span-2 rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4"><div><p className="text-[9px] font-bold uppercase text-slate-400">FY {selectedFiscalYear} • General Fund 101</p><h3 className="mt-1 text-lg font-extrabold text-[#10245b]">{reportType}</h3></div><FileBarChart className="h-7 w-7 text-red-500"/></div>
          <p className="mt-4 text-[11px] leading-5 text-slate-500">{reportDescription(reportType)}</p>
          <div className="mt-5 grid grid-cols-3 gap-3"><Metric label="Allotment" value={money(allotment)} icon={WalletCards}/><Metric label="Obligation" value={money(obligation)} icon={BarChart3} className="bg-amber-50 text-amber-700"/><Metric label="Disbursement" value={money(disbursement)} icon={ArrowDownToLine} className="bg-violet-50 text-violet-700"/></div>
          <div className="mt-5 flex gap-2"><button type="button" onClick={async () => { await loadEntries(1); setModal("report"); }} className="rounded-lg bg-[#174fd1] px-4 py-2 text-[10px] font-bold text-white"><Eye className="mr-1 inline h-3.5 w-3.5"/> Preview</button><button type="button" onClick={() => window.print()} className="rounded-lg border border-slate-200 px-4 py-2 text-[10px] font-bold text-slate-600"><Printer className="mr-1 inline h-3.5 w-3.5"/> Print</button></div>
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
      <BackBar title="9. Reports & Export" onBack={backHome} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <SectionTitle title="Report Selection" text="Use the selected fiscal year RAOD data." />
          <Field label="Report Type"><Select value={reportType} onChange={e => setReportType(e.target.value)}><option>RAOD Registry</option><option>FAR 1</option><option>FAR 1A</option><option>SARONCA</option><option>GAA Balance</option><option>WFP Balance</option><option>GAM</option><option>Table List</option></Select></Field>
          <Field label="Fund" className="mt-3"><Select><option>101 — GENERAL FUND</option></Select></Field>
          <Field label="Department / Responsibility Center" className="mt-3"><Select value={selectedDepartment?.id || ""} onChange={e => { const r = departmentRows.find(x => String(x.id) === String(e.target.value)); setSelectedDepartment(r || null); if (r) loadDepartmentEntries(r.id, 1); else setDepartmentEntries([]); }}>
            <option value="">All Departments / RC</option>
            {departmentRows.map(r => <option key={r.id} value={r.id}>{r.code ? `${r.code} — ` : ""}{r.name}</option>)}
          </Select></Field>
          <Field label="Period" className="mt-3"><Select><option>FY {selectedFiscalYear}</option></Select></Field>
          <div className="mt-4 grid grid-cols-3 gap-2"><button type="button" onClick={async () => { await loadEntries(1); setModal("report"); }} className="rounded-lg border border-slate-200 p-2 text-[9px] font-bold text-slate-600"><Eye className="mx-auto mb-1 h-4 w-4"/>Preview</button><button type="button" onClick={() => { downloadCsv(`RAOD_FY${selectedFiscalYear}_${reportType.replace(/[^a-z0-9]+/gi, "_")}${selectedDepartment ? `_${selectedDepartment.code || selectedDepartment.name}` : ""}.csv`, selectedDepartment ? departmentEntries : entries); setToast({type:"success",message:"RAOD records exported to CSV (Excel-compatible)."}); }} className="rounded-lg border border-slate-200 p-2 text-[9px] font-bold text-slate-600"><FileSpreadsheet className="mx-auto mb-1 h-4 w-4"/>Excel</button><button type="button" onClick={() => window.print()} className="rounded-lg border border-slate-200 p-2 text-[9px] font-bold text-slate-600"><Printer className="mx-auto mb-1 h-4 w-4"/>Print</button></div>
        </div>
        <div className="lg:col-span-2"><ReportPreview title={reportType} entries={entries.slice(0, 8)} /></div>
      </div>
    </>
  );

  const renderView = () => {
    if (view === "home") return renderHome();
    if (view === "dashboard") return renderOverview();
    if (view === "allotment-budget") return renderAllotment();
    if (view === "transactions") return renderTransactions();
    if (view === "monitoring") return renderMonitoring();
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

      {modal === "form" && <Modal title={editing ? "Edit RAOD Transaction" : "Add RAOD Transaction"} onClose={() => setModal(null)} wide><TransactionForm refs={refs} form={form} setForm={setForm} budgetInfo={budgetInfo} editing={editing} onSubmit={saveEntry} saving={saving} onClose={() => setModal(null)} /></Modal>}

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
            ["Status of PO", selected.po_status || selected.status_of_po],
            ["Obligation", money(selected.obligation_amount)],
            ["Disbursement", money(selected.disbursement_amount)],
            ["Running Balance", money(selected.running_balance ?? Math.max(0, Number(selected.allotment_amount || 0) - Number(selected.obligation_amount || 0)))],
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
          <button type="button" onClick={() => setDeleteTarget(selected)} className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-[10px] font-bold text-red-600">
            <Trash2 className="mr-1 inline h-3.5 w-3.5"/> Delete
          </button>
        </div>
      </Modal>}

      {deleteTarget && <Modal title="Delete RAOD Record" onClose={() => setDeleteTarget(null)}>
        <p className="text-[11px] leading-5 text-slate-600">Are you sure you want to delete RAOD record <b>{deleteTarget.registry_no || deleteTarget.id}</b>? This action cannot be undone.</p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={() => setDeleteTarget(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-[10px] font-bold text-slate-600">Cancel</button>
          <button type="button" onClick={async () => { const row = deleteTarget; setDeleteTarget(null); await deleteEntry(row); }} className="rounded-lg bg-red-600 px-4 py-2 text-[10px] font-bold text-white">Delete Record</button>
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
  if (x === "FAR 1A") return "Financial Accountability Report No. 1A based on the RAOD registry and selected fiscal-year General Fund records.";
  if (x === "SARONCA") return "Summary of Appropriations, Releases, Obligations and Notice of Cash Allocation using available RAOD data.";
  return "RAOD report preview.";
}

function ReportPreview({ title, entries }) {
  const total = entries.reduce((a, r) => a + Number(r.disbursement_amount || r.obligation_amount || 0), 0);
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm print:shadow-none">
      <div className="border-b-2 border-[#102b67] pb-3 text-center">
        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">University of Abra — Main Campus</p>
        <h2 className="mt-1 text-lg font-extrabold text-slate-800">{title}</h2>
        <p className="mt-1 text-[9px] text-slate-400">Selected Fiscal Year • General Fund / 101 • RAOD Registry</p>
      </div>
      <div className="mt-5 overflow-x-auto">
        <table className="min-w-full text-[9px]">
          <thead><tr className="bg-slate-100 font-bold text-slate-700"><th className="px-2 py-2 text-left">RAOD No.</th><th className="px-2 py-2">Date</th><th className="px-2 py-2 text-left">Department</th><th className="px-2 py-2 text-right">Amount</th></tr></thead>
          <tbody className="divide-y divide-slate-100">{entries.map(r => <tr key={r.id}><td className="px-2 py-2">{r.registry_no}</td><td className="px-2 py-2 text-center">{dateText(r.entry_date)}</td><td className="px-2 py-2">{r.responsibility_center_name || "—"}</td><td className="px-2 py-2 text-right">{money(r.disbursement_amount || r.obligation_amount)}</td></tr>)}</tbody>
          <tfoot><tr className="bg-slate-50 font-extrabold"><td colSpan="3" className="px-2 py-2 text-right">TOTAL</td><td className="px-2 py-2 text-right">{money(total)}</td></tr></tfoot>
        </table>
      </div>
    </div>
  );
}

export default RaodRegistry;