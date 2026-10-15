import React, { useEffect, useMemo, useState } from "react";
import Layout from "./layout/Layout";
import { API_URL } from "../config/api";
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Download,
  Eye,
  FileBarChart,
  FileText,
  Landmark,
  Pencil,
  Plus,
  Printer,
  RefreshCw,
  Search,
  TrendingUp,
  Trash2,
  WalletCards,
  X,
} from "lucide-react";

const DEFAULT_FISCAL_YEAR = new Date().getFullYear();
const FISCAL_YEARS = Array.from(
  { length: 6 },
  (_, index) => new Date().getFullYear() - index
);
const LIMIT = 30;

const money = (value) =>
  `₱${Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const dateText = (value) => {
  if (!value) return "—";
  const d = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  return Number.isNaN(d.getTime())
    ? String(value)
    : d.toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      });
};

const emptyProgram = {
  program_code: "",
  program_name: "",
  description: "",
  fund_cluster_id: "",
  wfp_source_id: "",
  wfp_source_code: "",
  campus_id: "",
  responsibility_center_id: "",
  beginning_balance: "",
  projected_income: "",
  approved_budget: "",
  start_date: "",
  status: "Active",
};

const emptyTransaction = {
  igp_program_id: "",
  transaction_date: new Date().toISOString().slice(0, 10),
  transaction_type: "Income",
  registry_no: "",
  fund_cluster_id: "",
  campus_id: "",
  burs_serial_no: "",
  serial_no_transferred: "",
  payee: "",
  particulars: "",
  responsibility_center_id: "",
  pap_id: "",
  uacs_code_id: "",
  reference_no: "",
  allotment_class_id: "",
  uacs_funding_source_code: "",
  month: String(new Date().getMonth() + 1),
  series: "",
  series2: "",
  quarter: String(Math.ceil((new Date().getMonth() + 1) / 3)),
  mfo_id: "",
  old_uacs_code_id: "",
  account_title: "",
  income_amount: "",
  utilization_amount: "",
  ps_utilization: "",
  mooe_utilization: "",
  co_utilization: "",
  wfp_source_id: "",
  wfp_source_code: "",
  running_balance: "",
  remarks: "",
  unpaid_utilization: "",
};

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
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {label}
          </p>
          <p className="mt-2 truncate text-[19px] font-extrabold text-slate-800">
            {value}
          </p>
        </div>
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${className}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
    </div>
  );
}

function CardButton({ item, onClick, disabled = false }) {
  const [id, title, desc, color, Icon] = item;

  const content = (
    <>
      <div className="flex items-start gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white ${color}`}>
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h3 className="text-[12px] font-extrabold leading-5 text-[#10245b]">{title}</h3>
          <p className="mt-1 text-[10px] leading-4 text-slate-500">{desc}</p>
        </div>
      </div>

      {disabled ? (
        <span className="mt-auto flex h-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-400">
          Current module
        </span>
      ) : (
        <span className="mt-auto flex h-8 items-center justify-center gap-1 rounded-lg border border-blue-200 bg-white text-[10px] font-bold text-[#174fd1] group-hover:bg-blue-50">
          Open module
          <ArrowRight className="h-3.5 w-3.5" />
        </span>
      )}
    </>
  );

  if (disabled) {
    return (
      <div className="flex min-h-[175px] w-full flex-col rounded-xl border border-blue-200 bg-blue-50/40 p-4 text-left shadow-sm">
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onClick(id)}
      className="group flex min-h-[175px] w-full flex-col rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
    >
      {content}
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
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to IGP Modules
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
            {columns.map((column) => (
              <th key={column.key} className="whitespace-nowrap px-3 py-3">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.length ? (
            rows.map((row, index) => (
              <tr key={row.id ?? index} className="text-[10px] text-slate-700 hover:bg-slate-50">
                {columns.map((column) => (
                  <td key={column.key} className="whitespace-nowrap px-3 py-3">
                    {column.render ? column.render(row) : row[column.key] ?? "—"}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10 text-center text-[11px] text-slate-400">
                {empty}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ value }) {
  const status = String(value || "Active").toUpperCase();
  const classes =
    status === "ACTIVE" || status === "POSTED"
      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
      : status === "CANCELLED" || status === "INACTIVE"
      ? "bg-red-50 text-red-600 border-red-100"
      : status === "COMPLETED"
      ? "bg-blue-50 text-blue-700 border-blue-100"
      : "bg-amber-50 text-amber-700 border-amber-100";
  return (
    <span className={`rounded-md border px-2 py-1 text-[9px] font-bold ${classes}`}>
      {status}
    </span>
  );
}

function Modal({ title, children, onClose, wide = false }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-3">
      <div className={`max-h-[94vh] w-full overflow-y-auto rounded-2xl bg-white shadow-2xl ${wide ? "max-w-6xl" : "max-w-3xl"}`}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4">
          <h3 className="text-sm font-extrabold text-[#10245b]">{title}</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function ConfirmDialog({
  title,
  message,
  confirmLabel = "Delete",
  onConfirm,
  onCancel,
  busy = false,
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/45 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="border-b border-slate-100 px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
              <Trash2 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-extrabold text-[#10245b]">{title}</h3>
              <p className="mt-1 text-[11px] leading-5 text-slate-500">{message}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 bg-slate-50 px-5 py-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-[10px] font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-[10px] font-bold text-white hover:bg-red-700 disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {busy ? "Deleting..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children, className = "", required = false }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-[9px] font-bold uppercase tracking-wide text-slate-500">
        {label}{required ? <span className="ml-0.5 text-red-500">*</span> : null}
      </span>
      {children}
    </label>
  );
}

function Input(props) {
  return (
    <input
      {...props}
      className={`h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-[10px] text-slate-700 outline-none focus:border-blue-400 ${props.className || ""}`}
    />
  );
}

function Select({ children, ...props }) {
  return (
    <select
      {...props}
      className={`h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-[10px] text-slate-700 outline-none focus:border-blue-400 ${props.className || ""}`}
    >
      {children}
    </select>
  );
}

function RefSelect({
  label,
  value,
  onChange,
  items = [],
  required = false,
  placeholder = "Select",
  displayKey = "code",
}) {
  return (
    <Field label={label} required={required}>
      <Select value={value ?? ""} onChange={onChange} required={required}>
        <option value="">{placeholder} {label}</option>
        {items.map((item) => {
          const code = displayKey === "old_code" ? item.old_code : item.code;
          const fallback = displayKey === "old_code"
            ? (item.code || item.account_title || "Unnamed")
            : (item.name || item.description || item.account_title || "Unnamed");
          return (
            <option key={item.id} value={item.id}>
              {code ? `${code} — ` : ""}{fallback}
            </option>
          );
        })}
      </Select>
    </Field>
  );
}

function ProgramForm({ form, setForm, references, saving, onSubmit, onClose }) {
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
        <p className="mb-3 text-[10px] font-extrabold uppercase tracking-wide text-blue-700">
          IGP Program / Project — Fund 161
        </p>
        <p className="mb-3 text-[10px] leading-4 text-slate-500">
          Select the Fund Cluster and WFP Source from Master Data. The WFP Source Code is automatically derived from the selected WFP Source.
        </p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Field label="Program / Project Code" required>
            <Input required value={form.program_code} onChange={(e) => set("program_code", e.target.value)} placeholder="e.g. LAG-IGP-RICE-PROD" />
          </Field>
          <Field label="Program / Project Name" required>
            <Input required value={form.program_name} onChange={(e) => set("program_name", e.target.value)} placeholder="RICE PRODUCTION" />
          </Field>

          <RefSelect label="Fund Cluster" value={form.fund_cluster_id} onChange={(e) => set("fund_cluster_id", e.target.value)} items={references.fund_clusters} required />
          <RefSelect
            label="WFP Source"
            value={form.wfp_source_id}
            onChange={(e) => {
              const item = references.wfp_sources.find((x) => String(x.id) === String(e.target.value));
              set("wfp_source_id", e.target.value);
              set("wfp_source_code", item?.code || "");
            }}
            items={references.wfp_sources}
            required
          />

          <Field label="WFP Source Code">
            <Input
              value={form.wfp_source_code || "Auto-filled from WFP Source"}
              readOnly
              className="bg-slate-50 font-bold text-slate-500"
            />
          </Field>
          <Field label="Start Date">
            <Input type="date" value={form.start_date} onChange={(e) => set("start_date", e.target.value)} />
          </Field>

          <RefSelect label="Campus" value={form.campus_id} onChange={(e) => set("campus_id", e.target.value)} items={references.campuses} />
          <RefSelect label="Responsibility Center" value={form.responsibility_center_id} onChange={(e) => set("responsibility_center_id", e.target.value)} items={references.responsibility_centers} />

          <Field label="Beginning Balance">
            <Input type="number" min="0" step="0.01" value={form.beginning_balance} onChange={(e) => set("beginning_balance", e.target.value)} />
          </Field>
          <Field label="Projected Income FY 2026">
            <Input type="number" min="0" step="0.01" value={form.projected_income} onChange={(e) => set("projected_income", e.target.value)} />
          </Field>
          <Field label="Approved Budget / Allocation IGP">
            <Input type="number" min="0" step="0.01" value={form.approved_budget} onChange={(e) => set("approved_budget", e.target.value)} />
          </Field>
          <Field label="Status">
            <Select value={form.status} onChange={(e) => set("status", e.target.value)}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </Select>
          </Field>

          <Field label="Description" className="md:col-span-2">
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)} className="min-h-20 w-full rounded-lg border border-slate-200 px-3 py-2 text-[11px] outline-none focus:border-blue-400" placeholder="WFP / project description" />
          </Field>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-[10px] font-bold text-slate-600">Cancel</button>
        <button disabled={saving} type="submit" className="rounded-lg bg-[#174fd1] px-4 py-2 text-[10px] font-bold text-white disabled:opacity-50">
          {saving ? "Saving..." : "Save Program"}
        </button>
      </div>
    </form>
  );
}

function TransactionForm({ form, setForm, programs, references, saving, onSubmit, onClose, allowedTransactionTypes = ["Income", "Utilization", "Adjustment"], role = "" }) {
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const selectedProgram = programs.find((p) => String(p.id) === String(form.igp_program_id));

  useEffect(() => {
    if (!selectedProgram) return;
    setForm((current) => ({
      ...current,
      fund_cluster_id: current.fund_cluster_id || selectedProgram.fund_cluster_id || "",
      campus_id: current.campus_id || selectedProgram.campus_id || "",
      responsibility_center_id: current.responsibility_center_id || selectedProgram.responsibility_center_id || "",
      wfp_source_id: current.wfp_source_id || selectedProgram.wfp_source_id || "",
      wfp_source_code: current.wfp_source_code || selectedProgram.wfp_source_code || selectedProgram.wfp_source_code_master || "",
    }));
  }, [selectedProgram]);

  useEffect(() => {
    const month = Number(form.month || 1);
    if (month >= 1 && month <= 12) {
      const q = Math.ceil(month / 3);
      if (String(q) !== String(form.quarter)) set("quarter", String(q));
    }
  }, [form.month]);

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4">
        <p className="mb-3 text-[10px] font-extrabold uppercase tracking-wide text-blue-700">
          Registry Information
        </p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Field label="Registry No.">
            <Input
              value={form.registry_no || "Will be generated on save"}
              readOnly
              className="bg-slate-50 font-bold text-slate-500"
            />
          </Field>
          <Field label="Date" required>
            <Input required type="date" value={form.transaction_date} onChange={(e) => set("transaction_date", e.target.value)} />
          </Field>
          <RefSelect label="Fund Cluster" value={form.fund_cluster_id} onChange={(e) => set("fund_cluster_id", e.target.value)} items={references.fund_clusters} required />
          <Field label="Fund Code">
            <Input value="161" readOnly className="bg-slate-50 font-bold" />
          </Field>
          <RefSelect label="Campus" value={form.campus_id} onChange={(e) => set("campus_id", e.target.value)} items={references.campuses} />
          <Field label="BURS Serial No.">
            <Input
              value={form.burs_serial_no || "Will be generated on save"}
              readOnly
              className="bg-slate-50 font-bold text-slate-500"
            />
          </Field>
          <Field label="Serial No. Transferred From / To" className="md:col-span-2">
            <Input value={form.serial_no_transferred} onChange={(e) => set("serial_no_transferred", e.target.value)} />
          </Field>
          <Field label="Program / Project" required>
            <Select required value={form.igp_program_id} onChange={(e) => set("igp_program_id", e.target.value)}>
              <option value="">Select Program / Project</option>
              {programs.map((item) => (
                <option key={item.id} value={item.id}>{item.program_code} — {item.program_name}</option>
              ))}
            </Select>
          </Field>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="mb-3 text-[10px] font-extrabold uppercase tracking-wide text-slate-600">Transaction / Classification</p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Field label="Transaction Type" required>
            <Select required value={form.transaction_type} onChange={(e) => set("transaction_type", e.target.value)}>
              {allowedTransactionTypes.map((type) => (
                <option key={type} value={type}>
                  {type === "Income" ? "Income / Collection" : type}
                </option>
              ))}
            </Select>
            <p className="mt-1 text-[8px] text-slate-400">Role: {role || "—"}</p>
          </Field>
          <Field label="Payee / Name">
            <Input value={form.payee} onChange={(e) => set("payee", e.target.value)} />
          </Field>
          <Field label="Ref. No.">
            <Input value={form.reference_no} onChange={(e) => set("reference_no", e.target.value)} />
          </Field>
          <Field label="Particulars / Description" className="md:col-span-2">
            <Input value={form.particulars} onChange={(e) => set("particulars", e.target.value)} />
          </Field>
          <RefSelect label="Responsibility Center" value={form.responsibility_center_id} onChange={(e) => set("responsibility_center_id", e.target.value)} items={references.responsibility_centers} />
          <RefSelect label="PAP" value={form.pap_id} onChange={(e) => set("pap_id", e.target.value)} items={references.pap} />
          <RefSelect label="UACS Code" value={form.uacs_code_id} onChange={(e) => {
            const item = references.uacs_codes.find((x) => String(x.id) === String(e.target.value));
            set("uacs_code_id", e.target.value);
            set("account_title", item?.account_title || "");
          }} items={references.uacs_codes} />
          <RefSelect label="Allotment Class" value={form.allotment_class_id} onChange={(e) => set("allotment_class_id", e.target.value)} items={references.allotment_classes} />
          <Field label="UACS Funding Source Code">
            <Input value={form.uacs_funding_source_code} onChange={(e) => set("uacs_funding_source_code", e.target.value)} />
          </Field>
          <Field label="Year">
            <Input value={form.fiscal_year || 2026} readOnly className="bg-slate-50 font-bold" />
          </Field>
          <Field label="Month">
            <Input type="number" min="1" max="12" value={form.month} onChange={(e) => set("month", e.target.value)} />
          </Field>
          <Field label="Series">
            <Input value={form.series} onChange={(e) => set("series", e.target.value)} />
          </Field>
          <Field label="Series2">
            <Input value={form.series2} onChange={(e) => set("series2", e.target.value)} />
          </Field>
          <Field label="Quarter">
            <Select value={form.quarter} onChange={(e) => set("quarter", e.target.value)}>
              <option value="1">Q1</option>
              <option value="2">Q2</option>
              <option value="3">Q3</option>
              <option value="4">Q4</option>
            </Select>
          </Field>
          <RefSelect label="MFO" value={form.mfo_id} onChange={(e) => set("mfo_id", e.target.value)} items={references.mfo} />
          <RefSelect
            label="Old UACS Code"
            value={form.old_uacs_code_id}
            onChange={(e) => set("old_uacs_code_id", e.target.value)}
            items={references.old_uacs_codes}
            displayKey="old_code"
          />
          <Field label="Account Title">
            <Input value={form.account_title} onChange={(e) => set("account_title", e.target.value)} />
          </Field>
        </div>
      </div>

      <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4">
        <p className="mb-3 text-[10px] font-extrabold uppercase tracking-wide text-emerald-700">Utilization / Accounting</p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Field label="Income / Collection">
            <Input type="number" min="0" step="0.01" value={form.income_amount} onChange={(e) => set("income_amount", e.target.value)} disabled={!allowedTransactionTypes.includes("Income")} />
          </Field>
          <Field label="Utilization">
            <Input type="number" min="0" step="0.01" value={form.utilization_amount} onChange={(e) => set("utilization_amount", e.target.value)} disabled={!(allowedTransactionTypes.includes("Utilization") || role === "Budget")} />
          </Field>
          <Field label="PS">
            <Input type="number" min="0" step="0.01" value={form.ps_utilization} onChange={(e) => set("ps_utilization", e.target.value)} />
          </Field>
          <Field label="MOOE">
            <Input type="number" min="0" step="0.01" value={form.mooe_utilization} onChange={(e) => set("mooe_utilization", e.target.value)} />
          </Field>
          <Field label="CO">
            <Input type="number" min="0" step="0.01" value={form.co_utilization} onChange={(e) => set("co_utilization", e.target.value)} />
          </Field>
          <RefSelect label="WFP Source" value={form.wfp_source_id} onChange={(e) => {
            const item = references.wfp_sources.find((x) => String(x.id) === String(e.target.value));
            set("wfp_source_id", e.target.value);
            set("wfp_source_code", item?.code || "");
          }} items={references.wfp_sources} />
          <Field label="WFP Source Code">
            <Input value={form.wfp_source_code} onChange={(e) => set("wfp_source_code", e.target.value)} />
          </Field>
          <Field label="Running Balance">
            <Input type="number" min="0" step="0.01" value={form.running_balance} onChange={(e) => set("running_balance", e.target.value)} />
          </Field>
          <Field label="Unpaid Utilization">
            <Input type="number" min="0" step="0.01" value={form.unpaid_utilization} onChange={(e) => set("unpaid_utilization", e.target.value)} />
          </Field>
          <Field label="Remarks" className="md:col-span-2">
            <Input value={form.remarks} onChange={(e) => set("remarks", e.target.value)} />
          </Field>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-[10px] font-bold text-slate-600">Cancel</button>
        <button disabled={saving} type="submit" className="rounded-lg bg-[#174fd1] px-4 py-2 text-[10px] font-bold text-white disabled:opacity-50">
          {saving ? "Saving..." : "Save Transaction"}
        </button>
      </div>
    </form>
  );
}

function BalancePanel({ title, beginning, projected, income, utilization, unpaid, balance }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">IGP FUND 161</p>
          <h3 className="mt-1 text-sm font-extrabold text-[#10245b]">{title}</h3>
        </div>
        <Landmark className="h-6 w-6 text-blue-600" />
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-slate-50 p-3"><p className="text-[9px] text-slate-400">Beginning Balance</p><p className="mt-1 text-sm font-extrabold text-slate-700">{money(beginning)}</p></div>
        <div className="rounded-lg bg-blue-50 p-3"><p className="text-[9px] text-blue-500">Projected Income</p><p className="mt-1 text-sm font-extrabold text-blue-700">{money(projected)}</p></div>
        <div className="rounded-lg bg-emerald-50 p-3"><p className="text-[9px] text-emerald-500">Actual Collection</p><p className="mt-1 text-sm font-extrabold text-emerald-700">{money(income)}</p></div>
        <div className="rounded-lg bg-orange-50 p-3"><p className="text-[9px] text-orange-500">Utilization</p><p className="mt-1 text-sm font-extrabold text-orange-700">{money(utilization)}</p></div>
        <div className="rounded-lg bg-red-50 p-3"><p className="text-[9px] text-red-500">Unpaid Utilization</p><p className="mt-1 text-sm font-extrabold text-red-600">{money(unpaid)}</p></div>
      </div>
      <div className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50 p-3">
        <p className="text-[9px] font-bold uppercase tracking-wide text-emerald-600">Available Balance</p>
        <p className="mt-1 text-xl font-extrabold text-emerald-700">{money(balance)}</p>
      </div>
    </div>
  );
}

export default function IGPRegistry({ user, onLogout, onNavigate, activePath }) {
  const role = user?.role || "";
  const isAdmin = role === "Administration";
  const isBudget = role === "Budget";
  // IGP is a Budget + Administration module only.
  // Procurement and Accountant belong to RAOD Registry, not IGP.
  const canViewIgp = isAdmin || isBudget;
  const canManagePrograms = isAdmin || isBudget;
  const canDelete = isAdmin;
  const canManageTransactions = isAdmin || isBudget;
  const allowedTransactionTypes = isAdmin
    ? ["Income", "Utilization", "Adjustment"]
    : isBudget
      ? ["Adjustment"]
      : [];
  const defaultTransactionType = allowedTransactionTypes[0] || "Income";

  const [view, setView] = useState("module");
  const [activeTab, setActiveTab] = useState("all");
  const [fiscalYear, setFiscalYear] = useState(DEFAULT_FISCAL_YEAR);
  const [overview, setOverview] = useState({});
  const [programs, setPrograms] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [references, setReferences] = useState({
    fund_clusters: [],
    campuses: [],
    responsibility_centers: [],
    pap: [],
    uacs_codes: [],
    old_uacs_codes: [],
    allotment_classes: [],
    mfo: [],
    wfp_sources: [],
  });

  const [search, setSearch] = useState("");
  const [programSearch, setProgramSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: LIMIT, totalItems: 0, totalPages: 1 });
  const [programModal, setProgramModal] = useState(null);
  const [transactionModal, setTransactionModal] = useState(null);
  const [programForm, setProgramForm] = useState(emptyProgram);
  const [transactionForm, setTransactionForm] = useState(emptyTransaction);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const [reportType, setReportType] = useState("registry");
  const [reportRows, setReportRows] = useState([]);
  const [reportLoading, setReportLoading] = useState(false);

  const token = localStorage.getItem("token") || "";

  const headers = useMemo(() => ({
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }), [token]);

  const api = async (path, options = {}) => {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: { ...headers, ...(options.headers || {}) },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || data.message || "IGP request failed.");
    return data;
  };

  const loadOverview = async () => {
    try {
      const data = await api(`/igp/overview?year=${fiscalYear}`);
      setOverview(data.data || {});
    } catch (e) { setError(e.message); }
  };

  const loadReferences = async () => {
    try {
      const data = await api("/igp/references");
      setReferences({
        fund_clusters: data.data?.fund_clusters || [],
        campuses: data.data?.campuses || [],
        responsibility_centers: data.data?.responsibility_centers || [],
        pap: data.data?.pap || [],
        uacs_codes: data.data?.uacs_codes || [],
        old_uacs_codes: data.data?.old_uacs_codes || [],
        allotment_classes: data.data?.allotment_classes || [],
        mfo: data.data?.mfo || [],
        wfp_sources: data.data?.wfp_sources || [],
      });
    } catch (e) { setError(e.message); }
  };

  const loadPrograms = async () => {
    try {
      const q = new URLSearchParams({ year: String(fiscalYear), search: programSearch });
      const data = await api(`/igp/programs?${q.toString()}`);
      setPrograms(data.data || []);
    } catch (e) { setError(e.message); }
  };

  const loadTransactions = async (nextPage = 1) => {
    try {
      const q = new URLSearchParams({
        year: String(fiscalYear),
        page: String(nextPage),
        limit: String(LIMIT),
        search,
        type: activeTab === "all" ? "" : activeTab,
      });
      const data = await api(`/igp/transactions?${q.toString()}`);
      setTransactions(data.data || []);
      setPagination(data.pagination || { page: nextPage, limit: LIMIT, totalItems: (data.data || []).length, totalPages: 1 });
      setPage(nextPage);
    } catch (e) { setError(e.message); }
  };

  useEffect(() => {
    loadOverview();
    loadReferences();
    loadPrograms();
    loadTransactions(1);
  }, [fiscalYear]);

  useEffect(() => {
    if (view === "programs") loadPrograms();
  }, [programSearch]);

  useEffect(() => {
    if (view === "transactions") loadTransactions(1);
  }, [activeTab]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const refreshAll = async () => {
    setError("");
    await Promise.all([loadOverview(), loadReferences(), loadPrograms(), loadTransactions(page)]);
  };

  const openAddProgram = () => {
    if (!canManagePrograms) return;
    setProgramForm({ ...emptyProgram });
    setSelectedProgram(null);
    setProgramModal("add");
  };

  const openEditProgram = (program) => {
    if (!canManagePrograms) return;
    setSelectedProgram(program);
    setProgramForm({
      program_code: program.program_code || "",
      program_name: program.program_name || "",
      description: program.description || "",
      fund_cluster_id: program.fund_cluster_id || "",
      wfp_source_id: program.wfp_source_id || "",
      wfp_source_code: program.wfp_source_code || program.wfp_source_code_master || "",
      campus_id: program.campus_id || "",
      responsibility_center_id: program.responsibility_center_id || "",
      beginning_balance: program.beginning_balance ?? "",
      projected_income: program.projected_income ?? "",
      approved_budget: program.approved_budget ?? program.allocation_amount ?? "",
      start_date: program.start_date ? String(program.start_date).slice(0, 10) : "",
      status: program.status || "Active",
    });
    setProgramModal("edit");
  };

  const openAddTransaction = () => {
    if (!canManageTransactions || !allowedTransactionTypes.length) return;
    setTransactionForm({ ...emptyTransaction, transaction_type: defaultTransactionType });
    setTransactionModal("add");
  };

  const submitProgram = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const isEdit = programModal === "edit";
      await api(isEdit ? `/igp/programs/${selectedProgram.id}` : "/igp/programs", {
        method: isEdit ? "PUT" : "POST",
        body: JSON.stringify({ ...programForm, fiscal_year: fiscalYear }),
      });
      setProgramModal(null);
      await refreshAll();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const submitTransaction = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api("/igp/transactions", {
        method: "POST",
        body: JSON.stringify({ ...transactionForm, fiscal_year: fiscalYear }),
      });
      setTransactionModal(null);
      await refreshAll();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const deleteProgram = (id) => {
    if (!canDelete) return;

    setConfirmDialog({
      title: "Delete IGP Program / Project",
      message: "Are you sure you want to delete this IGP program/project? This action cannot be undone.",
      confirmLabel: "Delete Program",
      action: async () => {
        await api(`/igp/programs/${id}`, { method: "DELETE" });
        await refreshAll();
        setToast({ type: "success", message: "IGP program/project deleted successfully." });
      },
    });
  };

  const deleteTransaction = (id) => {
    if (!canDelete) return;

    setConfirmDialog({
      title: "Delete IGP Transaction",
      message: "Only draft transactions should be deleted. Please confirm that you want to permanently remove this transaction.",
      confirmLabel: "Delete Transaction",
      action: async () => {
        await api(`/igp/transactions/${id}`, { method: "DELETE" });
        await refreshAll();
        setToast({ type: "success", message: "IGP transaction deleted successfully." });
      },
    });
  };

  const executeConfirm = async () => {
    if (!confirmDialog?.action) return;

    setConfirmBusy(true);
    setError("");

    try {
      await confirmDialog.action();
      setConfirmDialog(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setConfirmBusy(false);
    }
  };

  const exportCsv = async () => {
    try {
      const response = await fetch(`${API_URL}/igp/export?year=${fiscalYear}`, { headers });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Export failed.");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `IGP_Fund161_FY${fiscalYear}_Registry.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) { setError(e.message); }
  };

  // IGP Registry quick modules.
  // Dashboard remains the landing view, but it is NOT listed as a separate module
  // because Dashboard is already available in the main sidebar.
  const cards = [
    ["budget", "1. WFP / Budget & Allocation", "Manage beginning balance, projected income, approved IGP budget and available Fund 161 balance.", "bg-emerald-500", BarChart3],
    ["programs", "2. IGP Programs / Projects", "Manage IGP programs, fund clusters, WFP sources and project details.", "bg-orange-500", Landmark],
    ["transactions", "3. IGP Transactions", "Record Fund 161 income, utilization and adjustment transactions.", "bg-teal-500", FileText],
    ["monitoring", "4. Monitoring", "Monitor collection, utilization, unpaid utilization and available balance.", "bg-violet-600", TrendingUp],
    ["reports", "5. Reports / Export", "Print and export IGP registry and financial information.", "bg-indigo-600", FileBarChart],
  ];

  const programColumns = [
    { key: "program_code", label: "PROGRAM CODE" },
    { key: "program_name", label: "PROGRAM / PROJECT" },
    { key: "fund_cluster_code", label: "FUND CLUSTER" },
    { key: "wfp_source_code_master", label: "WFP SOURCE" },
    { key: "campus_name", label: "CAMPUS" },
    { key: "responsibility_center_code", label: "RC" },
    { key: "beginning_balance", label: "BEGINNING", render: r => money(r.beginning_balance) },
    { key: "projected_income", label: "PROJECTED", render: r => money(r.projected_income) },
    { key: "approved_budget", label: "APPROVED BUDGET", render: r => money(r.approved_budget) },
    { key: "income", label: "COLLECTION", render: r => money(r.income) },
    { key: "utilization", label: "UTILIZATION", render: r => money(r.utilization) },
    { key: "balance", label: "BALANCE", render: r => money(r.balance) },
    { key: "status", label: "STATUS", render: r => <StatusBadge value={r.status} /> },
    { key: "created_by_name", label: "ENTERED BY", render: r => r.created_by_name ? `${r.created_by_name} (${r.created_by_role || "User"})` : "—" },
    { key: "updated_by_name", label: "UPDATED BY", render: r => r.updated_by_name ? `${r.updated_by_name} (${r.updated_by_role || "User"})` : "—" },
    ...(canManagePrograms ? [{
      key: "actions", label: "ACTION", render: r => (
        <div className="flex gap-1">
          <button type="button" onClick={() => openEditProgram(r)} className="rounded-md bg-blue-50 p-1.5 text-blue-700" title="Edit"><Pencil className="h-3.5 w-3.5" /></button>
          {isAdmin && <button type="button" onClick={() => deleteProgram(r.id)} className="rounded-md bg-red-50 p-1.5 text-red-600" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>}
        </div>
      )
    }] : []),
  ];

  const transactionColumns = [
    { key: "registry_no", label: "REGISTRY NO." },
    { key: "transaction_date", label: "DATE", render: r => dateText(r.transaction_date) },
    { key: "fund_cluster_code", label: "FUND CLUSTER" },
    { key: "program_code", label: "FUND CODE / IGP" },
    { key: "campus_code", label: "CAMPUS" },
    { key: "burs_serial_no", label: "BURS" },
    { key: "payee", label: "PAYEE / NAME" },
    { key: "particulars", label: "PARTICULARS" },
    { key: "responsibility_center_code", label: "RC" },
    { key: "reference_no", label: "REF. NO." },
    { key: "transaction_type", label: "TYPE", render: r => <StatusBadge value={r.transaction_type} /> },
    { key: "income_amount", label: "INCOME", render: r => money(r.income_amount) },
    { key: "utilization_amount", label: "UTILIZATION", render: r => money(r.utilization_amount) },
    { key: "unpaid_utilization", label: "UNPAID", render: r => money(r.unpaid_utilization) },
    { key: "running_balance", label: "BALANCE", render: r => money(r.running_balance) },
    { key: "status", label: "STATUS", render: r => <StatusBadge value={r.status} /> },
    ...(canDelete ? [{
      key: "actions", label: "ACTION", render: r => (
        <button type="button" onClick={() => deleteTransaction(r.id)} className="rounded-md bg-red-50 p-1.5 text-red-600" title="Delete draft">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )
    }] : []),
  ];

  const backHome = () => setView("module");

  const totalPrograms = Number(overview.total_programs || 0);
  const beginning = Number(overview.beginning_balance || 0);
  const projected = Number(overview.projected_income || 0);
  const approved = Number(overview.approved_budget || 0);
  const income = Number(overview.actual_income ?? overview.total_income ?? 0);
  const utilization = Number(overview.total_utilization || 0);
  const disbursement = Number(overview.total_disbursement || 0);
  const unpaid = Number(overview.unpaid_utilization || 0);
  const balance = Number(overview.available_balance ?? Math.max(0, beginning + income - utilization));

  const renderModuleHome = () => {
    return (
      <>
        {/* Fiscal year selector — consistent with Dashboard and Budget Proposals. */}
        <div className="mb-3 flex justify-end">
          <label className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 shadow-sm">
            <CalendarDays className="h-3.5 w-3.5 text-[#174fd1]" aria-hidden="true" />
            <span className="text-[10px] font-semibold text-slate-500">Fiscal Year</span>
            <select
              value={fiscalYear}
              onChange={(e) => { setFiscalYear(Number(e.target.value)); setPage(1); }}
              aria-label="Fiscal Year"
              className="bg-transparent text-[11px] font-extrabold text-[#10245b] outline-none"
            >
              {FISCAL_YEARS.map((year) => <option key={year} value={year}>{year}</option>)}
            </select>
          </label>
        </div>

        {/* TOP STATISTICS — overall Fund 161 status. */}
        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="IGP Programs / Projects" value={totalPrograms.toLocaleString()} icon={Landmark} className="bg-blue-600 text-white" />
          <Metric label="Beginning Balance" value={money(beginning)} icon={WalletCards} className="bg-emerald-600 text-white" />
          <Metric label="Projected Income" value={money(projected)} icon={TrendingUp} className="bg-orange-500 text-white" />
          <Metric label="Approved Budget IGP" value={money(approved)} icon={BarChart3} className="bg-red-500 text-white" />
          <Metric label="Actual Collection" value={money(income)} icon={TrendingUp} className="bg-emerald-600 text-white" />
          <Metric label="Utilization" value={money(utilization)} icon={ArrowDownToLine} className="bg-orange-500 text-white" />
          <Metric label="Disbursement" value={money(disbursement)} icon={Download} className="bg-indigo-600 text-white" />
          <Metric label="Available Balance" value={money(balance)} icon={CheckCircle2} className="bg-red-500 text-white" />
        </div>


        {/* IGP main entry hero — Dashboard is not a separate IGP module. */}
        <section className="mb-5 overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-indigo-50 shadow-sm">
          <div className="flex flex-col gap-5 px-6 py-6 md:flex-row md:items-center md:justify-between md:px-7 md:py-7">
            <div className="max-w-3xl">
              <p className="text-[11px] font-extrabold uppercase tracking-wide text-[#174fd1]">
                IGP REGISTRY • FUND 161
              </p>
              <h2 className="mt-2 text-[24px] font-extrabold leading-tight text-[#10245b] md:text-[28px]">
                Plan, Track, and Manage
                <br />
                Income Generating Programs
              </h2>
              <p className="mt-3 max-w-2xl text-[12px] leading-5 text-slate-600 md:text-[13px]">
                Monitor WFP budget, collections, utilization, disbursement and remaining Fund 161 balance by IGP program and project.
              </p>
            </div>

            <div className="flex shrink-0 justify-center md:pr-4">
              <div className="flex h-32 w-28 flex-col items-center justify-center rounded-2xl border border-blue-200 bg-white shadow-md">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 text-[#174fd1]">
                  <BarChart3 className="h-8 w-8" />
                </div>
                <span className="mt-2 text-[10px] font-extrabold tracking-wide text-[#10245b]">IGP 161</span>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-5">
          <SectionTitle title="MODULES" text="Quick access to IGP functions." />
          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {cards.map((item) => <CardButton key={item[0]} item={item} onClick={setView} />)}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-[16px] font-extrabold text-[#10245b]">Recent IGP Transactions</h3>
              <p className="mt-0.5 text-[11px] text-slate-500">Latest Fund 161 records for FY {fiscalYear}.</p>
            </div>
            <button type="button" onClick={() => setView("transactions")} className="inline-flex h-9 items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-4 text-[10px] font-bold text-slate-600 hover:bg-slate-50">
              View Registry <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-[9px] font-extrabold uppercase tracking-wide text-[#10245b]">
                  <th className="px-3 py-3">Registry No.</th><th className="px-3 py-3">Date</th><th className="px-3 py-3">IGP Project</th><th className="px-3 py-3">Type</th><th className="px-3 py-3">Payee</th><th className="px-3 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(overview.recent_transactions || []).slice(0, 5).map((row, i) => (
                  <tr key={row.id || i} className="text-[10px] text-slate-700 hover:bg-slate-50">
                    <td className="px-3 py-3 font-semibold">{row.registry_no || row.transaction_no || "—"}</td>
                    <td className="px-3 py-3">{dateText(row.transaction_date)}</td>
                    <td className="px-3 py-3">{row.program_code || row.program_name || "—"}</td>
                    <td className="px-3 py-3"><StatusBadge value={row.transaction_type} /></td>
                    <td className="px-3 py-3">{row.payee || "—"}</td>
                    <td className="px-3 py-3 text-right font-bold">{money(row.amount)}</td>
                  </tr>
                ))}
                {!overview.recent_transactions?.length && <tr><td colSpan={6} className="px-4 py-8 text-center text-[11px] text-slate-400">No IGP transactions yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </>
    );
  };

  const renderBudget = () => (
    <>
      <BackBar title="1. WFP / Budget & Allocation" onBack={backHome} />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <Metric label="Beginning Balance" value={money(beginning)} icon={WalletCards} />
        <Metric label="Projected Income FY" value={money(projected)} icon={TrendingUp} className="bg-blue-50 text-blue-700" />
        <Metric label="Approved Budget IGP" value={money(approved)} icon={BarChart3} className="bg-red-500 text-white" />
        <Metric label="Available Balance" value={money(balance)} icon={CheckCircle2} className="bg-emerald-50 text-emerald-700" />
      </div>
      <div className="mt-4">
        <SectionTitle title="WFP / Budget Balance" text="Fund 161 WFP and IGP budget monitoring by Fund Cluster." action={<button type="button" onClick={loadOverview} className="rounded-lg border px-3 py-2 text-[10px] font-bold text-slate-600"><RefreshCw className="mr-1 inline h-3.5 w-3.5" />Refresh</button>} />
        <Table
          columns={[
            { key: "code", label: "FUND CLUSTER" },
            { key: "name", label: "DESCRIPTION" },
            { key: "program_count", label: "PROGRAMS" },
            { key: "beginning_balance", label: "BEGINNING", render: r => money(r.beginning_balance) },
            { key: "projected_income", label: "PROJECTED INCOME", render: r => money(r.projected_income) },
            { key: "approved_budget", label: "APPROVED BUDGET", render: r => money(r.approved_budget) },
            { key: "actual_income", label: "ACTUAL COLLECTION", render: r => money(r.actual_income) },
            { key: "utilization", label: "UTILIZATION", render: r => money(r.utilization) },
            { key: "disbursement", label: "DISBURSEMENT", render: r => money(r.disbursement) },
            { key: "available_balance", label: "BALANCE", render: r => money(r.available_balance) },
          ]}
          rows={overview.by_fund_cluster || []}
          empty="No WFP / budget balance data found."
        />
      </div>
    </>
  );

  const renderPrograms = () => (
    <>
      <BackBar title="2. IGP Programs / Projects" onBack={backHome} />
      <div className="mb-4 grid grid-cols-1 gap-2 md:grid-cols-12">
        <div className="relative md:col-span-7"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input value={programSearch} onChange={e => setProgramSearch(e.target.value)} placeholder="Search program, project, WFP, campus or RC..." className="pl-9" /></div>
        <button type="button" onClick={loadPrograms} className="flex h-9 items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white text-[10px] font-bold text-slate-600"><RefreshCw className="h-3.5 w-3.5" />Refresh</button>
        {canManagePrograms && <button type="button" onClick={openAddProgram} className="flex h-9 items-center justify-center gap-1 rounded-lg bg-[#174fd1] text-[10px] font-bold text-white md:col-span-4"><Plus className="h-3.5 w-3.5" />Add IGP Program / Project</button>}
      </div>
      <Table columns={programColumns} rows={programs} empty="No IGP programs / projects found." />
    </>
  );

  const renderTransactions = () => (
    <>
      <BackBar title="3. IGP Transactions — Fund 161" onBack={backHome} />
      <div className="mb-4 grid grid-cols-1 gap-2 md:grid-cols-12">
        <div className="relative md:col-span-7"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && loadTransactions(1)} placeholder="Search registry, BURS, payee, program, PO..." className="pl-9" /></div>
        <button type="button" onClick={() => loadTransactions(1)} className="flex h-9 items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white text-[10px] font-bold text-slate-600"><RefreshCw className="h-3.5 w-3.5" />Refresh</button>
        {canManageTransactions && <button type="button" onClick={openAddTransaction} className="flex h-9 items-center justify-center gap-1 rounded-lg bg-[#174fd1] text-[10px] font-bold text-white md:col-span-4"><Plus className="h-3.5 w-3.5" />Add IGP Transaction</button>}
      </div>
      <div className="mb-3 flex gap-1 overflow-x-auto rounded-lg border border-slate-100 bg-white p-1 shadow-sm">
        {[["all","All Records"],["Income","Income"],["Utilization","Utilization"],["Adjustment","Adjustment"]].map(([id,label]) => (
          <button key={id} type="button" onClick={() => { setActiveTab(id); setPage(1); }} className={`whitespace-nowrap rounded-md px-3 py-2 text-[9px] font-bold ${activeTab === id ? "bg-[#174fd1] text-white" : "text-slate-500 hover:bg-slate-50"}`}>{label}</button>
        ))}
      </div>
      <Table columns={transactionColumns} rows={transactions} empty="No IGP registry transactions found." />
      <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400">
        <span>Showing {transactions.length ? (page - 1) * LIMIT + 1 : 0} to {Math.min(page * LIMIT, pagination.totalItems)} of {pagination.totalItems || 0} entries</span>
        <div className="flex items-center gap-1">
          <button type="button" disabled={page <= 1} onClick={() => loadTransactions(page - 1)} className="rounded border p-1.5 disabled:opacity-30"><ArrowLeft className="h-3 w-3" /></button>
          {Array.from({ length: Math.min(5, pagination.totalPages || 1) }, (_, i) => i + 1).map(number => <button key={number} type="button" onClick={() => loadTransactions(number)} className={`rounded px-2.5 py-1.5 ${page === number ? "bg-[#174fd1] text-white" : "border border-slate-200 bg-white text-slate-500"}`}>{number}</button>)}
          <button type="button" disabled={page >= (pagination.totalPages || 1)} onClick={() => loadTransactions(page + 1)} className="rounded border p-1.5 disabled:opacity-30"><ArrowRight className="h-3 w-3" /></button>
        </div>
      </div>
    </>
  );

  const renderMonitoring = () => (
    <>
      <BackBar title="4. Income, Utilization & Disbursement Monitoring" onBack={backHome} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Metric label="Actual Collection" value={money(income)} icon={TrendingUp} className="bg-emerald-50 text-emerald-700" />
        <Metric label="Utilization" value={money(utilization)} icon={ArrowDownToLine} className="bg-orange-50 text-orange-700" />
        <Metric label="Disbursement" value={money(disbursement)} icon={Download} className="bg-violet-50 text-violet-700" />
        <Metric label="Unpaid Utilization" value={money(unpaid)} icon={CheckCircle2} className="bg-red-50 text-red-600" />
      </div>
      <div className="mt-4"><BalancePanel title={`Fund 161 Monitoring — FY ${fiscalYear}`} beginning={beginning} projected={projected} income={income} utilization={utilization} disbursement={disbursement} unpaid={unpaid} balance={balance} /></div>
      <div className="mt-4">
        <SectionTitle title="Monitoring by Fund Cluster" text="Projected Income → Actual Collection → Utilization → Disbursement → Unpaid → Balance." />
        <Table
          columns={[
            { key: "code", label: "FUND CLUSTER" },
            { key: "name", label: "DESCRIPTION" },
            { key: "projected_income", label: "PROJECTED", render: r => money(r.projected_income) },
            { key: "actual_income", label: "COLLECTION", render: r => money(r.actual_income) },
            { key: "utilization", label: "UTILIZATION", render: r => money(r.utilization) },
            { key: "disbursement", label: "DISBURSEMENT", render: r => money(r.disbursement) },
            { key: "unpaid_utilization", label: "UNPAID", render: r => money(r.unpaid_utilization) },
            { key: "available_balance", label: "BALANCE", render: r => money(r.available_balance) },
          ]}
          rows={overview.by_fund_cluster || []}
          empty="No monitoring records found."
        />
      </div>
    </>
  );

  const reportDefinitions = [
    ["registry", "IGP Registry Report", "Complete Fund 161 transaction registry.", FileText],
    ["wfp", "IGP WFP / Budget Report", "WFP, approved budget and available balance by fund cluster.", BarChart3],
    ["income", "IGP Income / Collection Report", "Actual IGP income and collection transactions.", TrendingUp],
    ["utilization", "IGP Utilization Report", "IGP utilization transactions, including PS, MOOE and CO.", ArrowDownToLine],
    ["disbursement", "IGP Disbursement Report", "Disbursement and unpaid utilization transactions.", Download],
    ["financial", "IGP Program Financial Report", "Program/project financial status and balances.", FileBarChart],
  ];

  const loadReport = async (type) => {
    setReportType(type);
    setReportLoading(true);
    setError("");
    try {
      if (type === "wfp") {
        setReportRows(overview.by_fund_cluster || []);
      } else if (type === "financial") {
        setReportRows(programs || []);
      } else if (type === "registry" || type === "income" || type === "utilization" || type === "disbursement") {
        const q = new URLSearchParams({
          year: String(fiscalYear),
          page: "1",
          limit: "10000",
          search: "",
          type: type === "registry" ? "" : type,
        });
        const data = await api(`/igp/transactions?${q.toString()}`);
        let rows = data.data || [];
        if (type === "income") rows = rows.filter(r => Number(r.income || 0) > 0 || String(r.transaction_type || "").toLowerCase() === "income");
        if (type === "utilization") rows = rows.filter(r => Number(r.utilization || 0) > 0 || String(r.transaction_type || "").toLowerCase() === "utilization");
        if (type === "disbursement") rows = rows.filter(r => Number(r.disbursement || 0) > 0);
        setReportRows(rows);
      }
    } catch (e) {
      setError(e.message);
      setReportRows([]);
    } finally {
      setReportLoading(false);
    }
  };

  const reportTitle = reportDefinitions.find(r => r[0] === reportType)?.[1] || "IGP Report";

  const printSelectedReport = async () => {
    if (!reportRows.length && reportType !== "wfp" && reportType !== "financial") {
      await loadReport(reportType);
    }
    window.setTimeout(() => window.print(), 150);
  };

  const reportMoney = value => money(Number(value || 0));

  const renderReportTable = () => {
    if (reportType === "wfp") {
      return (
        <table className="w-full border-collapse text-[10px]">
          <thead><tr className="bg-slate-100">
            <th className="border border-slate-300 p-2 text-left">FUND CLUSTER</th>
            <th className="border border-slate-300 p-2 text-left">DESCRIPTION</th>
            <th className="border border-slate-300 p-2 text-right">BEGINNING</th>
            <th className="border border-slate-300 p-2 text-right">PROJECTED</th>
            <th className="border border-slate-300 p-2 text-right">APPROVED</th>
            <th className="border border-slate-300 p-2 text-right">COLLECTION</th>
            <th className="border border-slate-300 p-2 text-right">BALANCE</th>
            <th className="border border-slate-300 p-2 text-left">ENTERED BY</th>
            <th className="border border-slate-300 p-2 text-left">UPDATED BY</th>
          </tr></thead>
          <tbody>{reportRows.map((r, i) => <tr key={i}>
            <td className="border border-slate-300 p-2">{r.code || "—"}</td>
            <td className="border border-slate-300 p-2">{r.name || "—"}</td>
            <td className="border border-slate-300 p-2 text-right">{reportMoney(r.beginning_balance)}</td>
            <td className="border border-slate-300 p-2 text-right">{reportMoney(r.projected_income)}</td>
            <td className="border border-slate-300 p-2 text-right">{reportMoney(r.approved_budget)}</td>
            <td className="border border-slate-300 p-2 text-right">{reportMoney(r.actual_income)}</td>
            <td className="border border-slate-300 p-2 text-right">{reportMoney(r.available_balance)}</td>
            <td className="border border-slate-300 p-2">{r.created_by_name ? `${r.created_by_name} (${r.created_by_role || "User"})` : "—"}</td>
            <td className="border border-slate-300 p-2">{r.updated_by_name ? `${r.updated_by_name} (${r.updated_by_role || "User"})` : "—"}</td>
          </tr>)}</tbody>
        </table>
      );
    }

    if (reportType === "financial") {
      return (
        <table className="w-full border-collapse text-[10px]">
          <thead><tr className="bg-slate-100">
            <th className="border border-slate-300 p-2 text-left">PROGRAM CODE</th>
            <th className="border border-slate-300 p-2 text-left">PROGRAM / PROJECT</th>
            <th className="border border-slate-300 p-2 text-left">FUND CLUSTER</th>
            <th className="border border-slate-300 p-2 text-right">BEGINNING</th>
            <th className="border border-slate-300 p-2 text-right">PROJECTED</th>
            <th className="border border-slate-300 p-2 text-right">APPROVED</th>
            <th className="border border-slate-300 p-2 text-right">COLLECTION</th>
            <th className="border border-slate-300 p-2 text-right">UTILIZATION</th>
            <th className="border border-slate-300 p-2 text-right">BALANCE</th>
            <th className="border border-slate-300 p-2 text-left">ENTERED BY</th>
            <th className="border border-slate-300 p-2 text-left">UPDATED BY</th>
          </tr></thead>
          <tbody>{reportRows.map((r, i) => <tr key={i}>
            <td className="border border-slate-300 p-2">{r.program_code || "—"}</td>
            <td className="border border-slate-300 p-2">{r.program_name || "—"}</td>
            <td className="border border-slate-300 p-2">{r.fund_cluster_code || "—"}</td>
            <td className="border border-slate-300 p-2 text-right">{reportMoney(r.beginning_balance)}</td>
            <td className="border border-slate-300 p-2 text-right">{reportMoney(r.projected_income)}</td>
            <td className="border border-slate-300 p-2 text-right">{reportMoney(r.approved_budget)}</td>
            <td className="border border-slate-300 p-2 text-right">{reportMoney(r.income)}</td>
            <td className="border border-slate-300 p-2 text-right">{reportMoney(r.utilization)}</td>
            <td className="border border-slate-300 p-2 text-right">{reportMoney(r.balance)}</td>
            <td className="border border-slate-300 p-2">{r.created_by_name ? `${r.created_by_name} (${r.created_by_role || "User"})` : "—"}</td>
            <td className="border border-slate-300 p-2">{r.updated_by_name ? `${r.updated_by_name} (${r.updated_by_role || "User"})` : "—"}</td>
          </tr>)}</tbody>
        </table>
      );
    }

    return (
      <table className="w-full border-collapse text-[10px]">
        <thead><tr className="bg-slate-100">
          <th className="border border-slate-300 p-2 text-left">REGISTRY NO.</th>
          <th className="border border-slate-300 p-2 text-left">DATE</th>
          <th className="border border-slate-300 p-2 text-left">FUND / IGP</th>
          <th className="border border-slate-300 p-2 text-left">PROGRAM</th>
          <th className="border border-slate-300 p-2 text-left">PAYEE / NAME</th>
          <th className="border border-slate-300 p-2 text-left">PARTICULARS</th>
          <th className="border border-slate-300 p-2 text-right">INCOME</th>
          <th className="border border-slate-300 p-2 text-right">UTILIZATION</th>
          <th className="border border-slate-300 p-2 text-right">DISBURSEMENT</th>
          <th className="border border-slate-300 p-2 text-right">BALANCE</th>
          <th className="border border-slate-300 p-2 text-left">ENTERED BY</th>
          <th className="border border-slate-300 p-2 text-left">UPDATED BY</th>
        </tr></thead>
        <tbody>{reportRows.map((r, i) => <tr key={i}>
          <td className="border border-slate-300 p-2">{r.registry_no || "—"}</td>
          <td className="border border-slate-300 p-2">{dateText(r.transaction_date)}</td>
          <td className="border border-slate-300 p-2">{r.fund_cluster_code || "161"}</td>
          <td className="border border-slate-300 p-2">{r.program_code || "—"}</td>
          <td className="border border-slate-300 p-2">{r.payee || "—"}</td>
          <td className="border border-slate-300 p-2">{r.particulars || r.description || r.remarks || r.account_title || "—"}</td>
          <td className="border border-slate-300 p-2 text-right">{reportMoney(r.income)}</td>
          <td className="border border-slate-300 p-2 text-right">{reportMoney(r.utilization)}</td>
          <td className="border border-slate-300 p-2 text-right">{reportMoney(r.disbursement)}</td>
          <td className="border border-slate-300 p-2 text-right">{reportMoney(r.balance)}</td>
          <td className="border border-slate-300 p-2">{r.created_by_name ? `${r.created_by_name} (${r.created_by_role || "User"})` : "—"}</td>
          <td className="border border-slate-300 p-2">{r.updated_by_name ? `${r.updated_by_name} (${r.updated_by_role || "User"})` : "—"}</td>
        </tr>)}</tbody>
      </table>
    );
  };

  const renderReports = () => (
    <>
      <style>{`@media print {
        body * { visibility: hidden !important; }
        .igp-print-area, .igp-print-area * { visibility: visible !important; }
        .igp-print-area {
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: 100% !important;
          padding: 20px !important;
          background: white !important;
        }
        .igp-print-table { overflow: visible !important; }
        /* Audit fields are for the on-screen report only. Do not print them. */
        .igp-print-table th:nth-last-child(-n+2),
        .igp-print-table td:nth-last-child(-n+2) {
          display: none !important;
        }
        @page { size: landscape; margin: 10mm; }
      }`}</style>
      <BackBar title="5. IGP Reports / Export" onBack={backHome} />
      <div className="igp-screen-only grid grid-cols-1 items-start gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <p className="mb-3 text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Available Reports</p>
          {reportDefinitions.map(([key, title, desc, Icon]) => (
            <button key={key} type="button" onClick={() => loadReport(key)} className={`mb-2 w-full rounded-lg border p-2.5 text-left transition ${reportType === key ? "border-blue-200 bg-blue-50" : "border-slate-100 bg-white hover:bg-slate-50"}`}>
              <div className="flex items-center gap-2"><Icon className={`h-4 w-4 ${reportType === key ? "text-blue-600" : "text-slate-500"}`} /><span className="text-[10px] font-extrabold text-slate-700">{title}</span></div>
              <p className="mt-1 pl-6 text-[9px] leading-4 text-slate-400">{desc}</p>
            </button>
          ))}
        </div>
        <div className="h-fit self-start rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div><p className="text-[9px] font-bold uppercase text-slate-400">FY {fiscalYear} • FUND 161</p><h3 className="mt-1 text-lg font-extrabold text-[#10245b]">{reportTitle}</h3><p className="mt-1 text-[10px] text-slate-400">{reportRows.length.toLocaleString()} record{reportRows.length === 1 ? "" : "s"} in this report.</p></div>
            <div className="flex gap-2">
              <button type="button" onClick={printSelectedReport} disabled={reportLoading} className="rounded-lg bg-[#174fd1] px-4 py-2 text-[10px] font-bold text-white disabled:opacity-50"><Printer className="mr-1 inline h-3.5 w-3.5" />{reportLoading ? "Loading..." : "Print Report"}</button>
              <button type="button" onClick={exportCsv} className="rounded-lg border border-slate-200 px-4 py-2 text-[10px] font-bold text-slate-600"><Download className="mr-1 inline h-3.5 w-3.5" />Export CSV</button>
            </div>
          </div>
          <div className="mt-4 w-full overflow-x-auto rounded-lg border border-slate-100">
            {reportLoading ? <div className="p-8 text-center text-[10px] text-slate-400">Preparing report...</div> : reportRows.length ? renderReportTable() : <div className="p-8 text-center text-[10px] text-slate-400">No records found for this report.</div>}
          </div>
        </div>
      </div>

      <div className="igp-print-area hidden print:block">
        <div className="mb-5 text-center">
          <h1 className="text-base font-extrabold uppercase">Budget Monitoring and Allocation System</h1>
          <h2 className="mt-1 text-sm font-bold uppercase">{reportTitle}</h2>
          <p className="mt-1 text-[10px]">Fiscal Year {fiscalYear} • IGP Fund 161</p>
        </div>
        <div className="igp-print-table">{renderReportTable()}</div>
        <div className="mt-10 grid grid-cols-3 gap-8 text-[9px]">
          <div className="border-t border-slate-500 pt-2">Prepared by</div>
          <div className="border-t border-slate-500 pt-2">Checked by</div>
          <div className="border-t border-slate-500 pt-2">Approved by</div>
        </div>
      </div>
    </>
  );

  if (!canViewIgp) {
    return (
      <Layout user={user} onLogout={onLogout} onNavigate={onNavigate} activePath={activePath || "/igp/overview"}>
        <div className="min-h-full bg-[#f7f9fc] p-5">
          <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-center">
            <h2 className="text-sm font-extrabold text-red-700">IGP Access Restricted</h2>
            <p className="mt-1 text-[11px] text-red-600">Your role is not authorized to access the IGP Registry.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout user={user} onLogout={onLogout} onNavigate={onNavigate} activePath={activePath || "/igp/overview"}>
      <div className="min-h-full bg-[#f7faff] pb-8">
        {error && <div className="mb-4 flex items-center justify-between rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-[10px] text-red-700"><span>{error}</span><button type="button" onClick={() => setError("")}><X className="h-4 w-4" /></button></div>}

        {view === "module" && renderModuleHome()}
        {view === "budget" && renderBudget()}
        {view === "programs" && renderPrograms()}
        {view === "transactions" && renderTransactions()}
        {view === "monitoring" && renderMonitoring()}
        {view === "reports" && renderReports()}

        {toast && (
          <div className="fixed right-5 top-5 z-[80] w-full max-w-sm">
            <div className="flex items-start gap-3 rounded-xl border border-emerald-100 bg-white px-4 py-3 shadow-xl">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-extrabold text-slate-800">Success</p>
                <p className="mt-0.5 text-[10px] leading-4 text-slate-500">{toast.message}</p>
              </div>
              <button
                type="button"
                onClick={() => setToast(null)}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100"
                aria-label="Close notification"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {confirmDialog && (
          <ConfirmDialog
            title={confirmDialog.title}
            message={confirmDialog.message}
            confirmLabel={confirmDialog.confirmLabel}
            onConfirm={executeConfirm}
            onCancel={() => !confirmBusy && setConfirmDialog(null)}
            busy={confirmBusy}
          />
        )}

        {programModal && (
          <Modal title={programModal === "edit" ? "Edit IGP Program / Project" : "Add IGP Program / Project"} onClose={() => setProgramModal(null)} wide>
            <ProgramForm form={programForm} setForm={setProgramForm} references={references} saving={saving} onSubmit={submitProgram} onClose={() => setProgramModal(null)} />
          </Modal>
        )}

        {transactionModal && (
          <Modal title="Add IGP RBUD Transaction — Fund 161" onClose={() => setTransactionModal(null)} wide>
            <TransactionForm form={transactionForm} setForm={setTransactionForm} programs={programs} references={references} saving={saving} onSubmit={submitTransaction} onClose={() => setTransactionModal(null)} allowedTransactionTypes={allowedTransactionTypes} role={role} />
          </Modal>
        )}
      </div>
    </Layout>
  );
}