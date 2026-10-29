import React, { useEffect, useMemo, useState } from "react";
import Layout from "./layout/Layout";
import { API_URL } from "../config/api";
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CalendarDays,
  ChevronDown,
  CheckCircle2,
  Download,
  Eye,
  History,
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
const RECENT_TRANSACTIONS_LIMIT = 10;
const PROGRAMS_LIMIT = 30;
const MONITORING_LIMIT = 10;

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
  fiscal_year: String(new Date().getFullYear()),
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
  po_no: "", po_date: "", supplier_payee: "", po_amount: "", air_far_reference: "", iar_no: "", par_no: "", ics_no: "", ris_no: "", po_status: "", procurement_remarks: "",
  db_no: "", dv_payroll_no: "", burs_serial_no: "", disbursement_date: "", disbursement_amount: "", notice_of_adjustment: "", adjustment_reason: "", accounting_status: "Pending", reviewed_by: "", review_datetime: "", accounting_remarks: "",
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

function BackBar({ title }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="text-base font-extrabold text-[#10245b]">{title}</h2>
    </div>
  );
}

function Table({ columns, rows, empty = "No records found." }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white shadow-sm">
      <table className="w-max min-w-full text-left">
        <thead>
          <tr className="bg-[#102b67] text-[9px] font-bold uppercase tracking-wide text-white">
            {columns.map((column) => (
              <th key={column.key} className="!text-white whitespace-nowrap px-3 py-3">
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
    <div className="igp-modal fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-slate-950/40 p-2 sm:p-3">
      <div className={`igp-modal-panel max-h-[calc(100dvh-1rem)] sm:max-h-[92vh] w-full overflow-x-hidden overflow-y-auto rounded-2xl bg-white shadow-2xl ${wide ? "max-w-[1400px] sm:w-[95vw]" : "max-w-3xl"}`}>
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-100 bg-white px-3 py-3 sm:px-5 sm:py-4">
          <h3 className="min-w-0 break-words text-sm font-extrabold text-[#10245b]">{title}</h3>
          <button type="button" onClick={onClose} aria-label="Close dialog" className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="min-w-0 p-3 sm:p-5">{children}</div>
      </div>
      <style>{`
        .igp-modal, .igp-modal * { box-sizing: border-box; }
        .igp-modal-panel { min-width: 0; }
        .igp-modal-panel input, .igp-modal-panel select, .igp-modal-panel textarea { min-width: 0; max-width: 100%; box-sizing: border-box; }
        .igp-modal-panel input[type="date"], .igp-modal-panel input[type="datetime-local"] { display: block; width: 100%; min-width: 0; max-width: 100%; }
        @media (max-width: 640px) {
          .igp-modal-panel { width: 100%; max-width: 100%; max-height: calc(100dvh - 1rem); }
          .igp-modal-panel input[type="date"], .igp-modal-panel input[type="datetime-local"] { font-size: 16px; padding-left: 10px; padding-right: 6px; }
        }
      `}</style>
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
            <Trash2 className="h-4 w-4 shrink-0" />
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
  // Disabled/read-only fields are shown in neutral grey. Red is reserved for
  // required fields that fail validation after the user submits the form.
  const isRoleLockedField = String(props.className || "").split(/\s+/).includes("role-locked-field");
  const disabledStyle = (props.disabled || props.readOnly) && !isRoleLockedField
    ? "!border-slate-200 !bg-slate-50 !ring-0 disabled:cursor-not-allowed disabled:opacity-100"
    : "disabled:cursor-not-allowed disabled:opacity-100";
  return (
    <input
      {...props}
      className={`box-border block h-9 w-full min-w-0 max-w-full rounded-lg border border-slate-200 bg-white px-3 text-[10px] text-slate-700 outline-none focus:border-blue-400 ${disabledStyle} ${props.className || ""}`}
    />
  );
}

function Select({ children, ...props }) {
  // A locked dropdown should not look like a validation error.
  const isRoleLockedField = String(props.className || "").split(/\s+/).includes("role-locked-field");
  const disabledStyle = props.disabled && !isRoleLockedField
    ? "!border-slate-200 !bg-slate-50 !ring-0 disabled:cursor-not-allowed disabled:opacity-100"
    : "disabled:cursor-not-allowed disabled:opacity-100";
  return (
    <select
      {...props}
      className={`h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-[10px] text-slate-700 outline-none focus:border-blue-400 ${disabledStyle} ${props.className || ""}`}
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
          let displayValue;
          if (displayKey === "name") {
            displayValue = item.name || item.account_title || item.description || item.title || item.old_code || item.code || "Unnamed";
          } else if (displayKey === "old_code") {
            displayValue = item.account_title || item.name || item.description || item.old_code || item.code || "Unnamed";
          } else {
            displayValue = item.code || item.old_code || item.fund_code || item.campus_code || item.rc_code || item.pap_code || item.mfo_code || "Unnamed";
          }
          return (
            <option key={item.id} value={item.id}>
              {displayValue}
            </option>
          );
        })}
      </Select>
    </Field>
  );
}

function ProgramForm({ form, setForm, references, saving, onSubmit, onClose, error = "" }) {
  const [formValidationError, setFormValidationError] = useState("");
  const [validationAttempted, setValidationAttempted] = useState(false);
  const handleValidatedSubmit = (event) => {
    setValidationAttempted(true);
    const formElement = event.currentTarget;
    event.preventDefault();
    const fields = Array.from(formElement.querySelectorAll("input, select, textarea"))
      .filter((field) => !field.disabled && !field.readOnly && field.type !== "button" && field.type !== "submit" && field.type !== "reset");
    const getFieldName = (field) => {
      const label = field.closest("label") || (field.id ? formElement.querySelector(`label[for="${field.id}"]`) : null) || field.parentElement;
      const text = (label?.innerText || label?.textContent || field.getAttribute("aria-label") || field.getAttribute("placeholder") || field.name || field.id || "Required field").replace(/\*/g, "").replace(/\s+/g, " ").trim();
      return text.split("\n")[0].replace(/\s+/g, " ").trim() || "Required field";
    };
    const requiredLabels = ["Program / Project Code", "Program / Project Name", "Fund Cluster", "WFP Source"];
    const isRequiredByLabel = (field) => {
      const label = field.closest("label") || field.parentElement;
      const text = (label?.innerText || label?.textContent || "").replace(/\\*/g, "").replace(/\\s+/g, " ").trim().toLowerCase();
      return requiredLabels.some((name) => text.includes(name.toLowerCase()));
    };
    const isEmpty = (field) => {
      if (field.type === "checkbox" || field.type === "radio") return !field.checked;
      return String(field.value ?? "").trim() === "";
    };
    const invalidFields = fields.filter((field) =>
      ((field.required || isRequiredByLabel(field)) && isEmpty(field)) || !field.checkValidity()
    );
    const redClasses = ["!border-2", "!border-red-600", "!bg-red-50", "!ring-2", "!ring-red-300", "focus:!border-red-600"];
    fields.forEach((field) => {
      const invalid = invalidFields.includes(field);
      field.classList.remove("!border-2", "!border-red-500", "!bg-red-50", "ring-1", "ring-red-200", "focus:!border-red-500");
      if (invalid) { field.classList.add(...redClasses); field.setAttribute("aria-invalid", "true"); }
      else { field.classList.remove(...redClasses); field.removeAttribute("aria-invalid"); }
    });
    if (invalidFields.length) {
      const names = [...new Set(invalidFields.map(getFieldName))];
      setFormValidationError(`Please fill in the following required field${names.length === 1 ? "" : "s"}: ${names.join(", ")}.`);
      const firstInvalid = invalidFields[0];
      firstInvalid.setAttribute("aria-invalid", "true");
      window.requestAnimationFrame(() => {
        // Move the modal's scroll panel to the missing field, keeping the alert at the top of the form.
        let container = firstInvalid.parentElement;
        while (container && container !== formElement) {
          const style = window.getComputedStyle(container);
          if (container.scrollHeight > container.clientHeight + 4 && /(auto|scroll)/.test(`${style.overflowY} ${style.overflow}`)) break;
          container = container.parentElement;
        }
        if (container && container !== formElement) {
          const c = container.getBoundingClientRect();
          const f = firstInvalid.getBoundingClientRect();
          container.scrollTo({ top: Math.max(0, container.scrollTop + f.top - c.top - 90), behavior: "smooth" });
        } else {
          firstInvalid.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
        }
        window.setTimeout(() => { try { firstInvalid.focus({ preventScroll: true }); } catch { firstInvalid.focus(); } }, 350);
      });
      return;
    }
    setFormValidationError("");
    onSubmit(event);
  };
  const clearFieldValidation = (event) => {
    const field = event.target;
    if (!field || !field.matches?.("input, select, textarea")) return;
    // Do not show validation styling until the user has attempted submission.
    if (!validationAttempted) return;
    if (field.checkValidity()) {
      field.classList.remove("!border-2", "!border-red-500", "!bg-red-50", "ring-1", "ring-red-200", "focus:!border-red-500");
      field.removeAttribute("aria-invalid");
    }
    const formElement = event.currentTarget;
    const remainingInvalid = Array.from(formElement.querySelectorAll("input, select, textarea"))
      .some((item) => !item.disabled && !item.readOnly && !item.checkValidity());
    if (!remainingInvalid) setFormValidationError("");
  };
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  return (
    <form noValidate onSubmit={handleValidatedSubmit} onChange={clearFieldValidation} onInput={clearFieldValidation} className="space-y-5">
      {formValidationError && <div role="alert" className="sticky top-0 z-20 rounded-lg border-2 border-red-400 bg-red-50 px-4 py-3 text-xs font-bold text-red-800 shadow-sm"><div className="flex items-start gap-2"><span aria-hidden="true">⚠</span><span>{formValidationError}</span></div></div>}
      {error && <div role="alert" className="rounded-lg border-2 border-red-400 bg-red-50 px-4 py-3 text-xs font-bold text-red-800"><span aria-hidden="true">⚠ </span>{error}</div>}
      <div role="note" className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-[10px] leading-4 text-blue-900"><b>Field access guide:</b> Locked and system-generated fields use a neutral grey style. Missing or invalid required values will be outlined in red only after you submit.</div>
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
            displayKey="name"
            required
          />

          <Field label="WFP Source Code">
            <Input
              value={form.wfp_source_code || "Auto-filled from WFP Source"}
              readOnly
              className={`bg-slate-50 font-bold text-slate-500 ${["procurement", "accountant"].includes(normalizedRole) ? "role-locked-field" : ""}`}
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

function TransactionForm({ form, setForm, programs, references, saving, onSubmit, onClose, allowedTransactionTypes = ["Income", "Utilization", "Adjustment"], role = "", error = "" }) {
  const [formValidationError, setFormValidationError] = useState("");
  const [validationAttempted, setValidationAttempted] = useState(false);
  // Normalize role names so casing/spacing differences never unlock the wrong fields.
  const normalizedRole = String(role || "").trim().toLowerCase();
  // In the transaction form, Administrator follows the same field permissions as Budget.
  // Administrator does not receive Procurement or Accounting edit access here.
  const isAdminRole = false;
  const isBudgetRole = normalizedRole === "budget";
  const isProcurementRole = normalizedRole === "procurement";
  const isAccountantRole = ["accountant", "account"].includes(normalizedRole);
  const getFieldLabel = (field, formElement) => {
    const wrapper = field.closest("label");
    const text = (wrapper?.querySelector("span")?.textContent || wrapper?.innerText ||
      (field.id ? formElement.querySelector(`label[for="${field.id}"]`)?.textContent : "") ||
      field.getAttribute("aria-label") || field.getAttribute("placeholder") || field.name || field.id || "Required field");
    return String(text).replace(/\*/g, "").replace(/\s+/g, " ").trim();
  };
  const isEditableControl = (field) =>
    !field.disabled && !field.readOnly && !["button", "submit", "reset", "hidden"].includes(field.type) && field.getClientRects().length > 0;
  const isRequiredControl = (field, formElement) => {
    const label = getFieldLabel(field, formElement).toLowerCase();

    // These reference fields are optional for every role, even when they are editable.
    // Do not block submission if they are blank.
    const optionalLabels = [
      "uacs funding source code", "series", "series 2", "series2",
      "serial no. transferred from / to", "serial no transferred from / to",
      "ps", "mooe", "co", "running balance", "unpaid utilization"
    ];
    if (optionalLabels.some((name) => label === name || label.includes(name))) {
      return false;
    }

    if (isProcurementRole) {
      // Procurement's required fields, including the requested PO Status and Remarks.
      return ["po no.", "po date", "supplier / payee", "po amount", "procurement status", "procurement remarks"]
        .some((name) => label.includes(name));
    }
    if (isAccountantRole) {
      // Every editable field in Accounting / Disbursement Review must be completed.
      return !!field.closest(".accounting-fields");
    }
    // Budget and Administrator follow the same requirements: every editable field
    // in the Budget portion of the transaction form is required. Office-only fields
    // and system-generated/automatic fields are excluded.
    return !field.closest(".procurement-fields") && !field.closest(".accounting-fields");
  };
  const isEmptyControl = (field) => {
    if (field.type === "checkbox" || field.type === "radio") return !field.checked;
    return String(field.value ?? "").trim() === "";
  };
  const validationClasses = ["!border-2", "!border-red-600", "!bg-red-50", "!ring-2", "!ring-red-300", "focus:!border-red-600"];
  const handleValidatedSubmit = (event) => {
    event.preventDefault();
    setValidationAttempted(true);
    const formElement = event.currentTarget;
    const fields = Array.from(formElement.querySelectorAll("input, select, textarea")).filter(isEditableControl);
    const invalidFields = fields.filter((field) =>
      (isRequiredControl(field, formElement) && isEmptyControl(field)) || !field.checkValidity()
    );

    fields.forEach((field) => {
      field.classList.remove("!border-2", "!border-red-500", "!border-red-600", "!bg-red-50", "ring-1", "ring-red-200", "!ring-2", "!ring-red-300", "focus:!border-red-500", "focus:!border-red-600");
      if (invalidFields.includes(field)) {
        field.classList.add(...validationClasses);
        field.setAttribute("aria-invalid", "true");
      } else {
        field.removeAttribute("aria-invalid");
      }
    });

    if (invalidFields.length) {
      const names = [...new Set(invalidFields.map((field) => getFieldLabel(field, formElement) || "Required field"))];
      setFormValidationError(`Submission blocked. Please complete the required field${names.length === 1 ? "" : "s"}: ${names.join(", ")}. Missing fields are highlighted in red.`);
      const firstInvalid = invalidFields[0];
      window.requestAnimationFrame(() => {
        const scrollContainer = firstInvalid.closest(".overflow-y-auto, .overflow-auto, [data-form-scroll-container]");
        if (scrollContainer) {
          const containerRect = scrollContainer.getBoundingClientRect();
          const fieldRect = firstInvalid.getBoundingClientRect();
          if (fieldRect.top < containerRect.top || fieldRect.bottom > containerRect.bottom) {
            scrollContainer.scrollTo({
              top: scrollContainer.scrollTop + fieldRect.top - containerRect.top - (containerRect.height / 2) + (fieldRect.height / 2),
              behavior: "smooth",
            });
          }
        }
        firstInvalid.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
        window.setTimeout(() => {
          try { firstInvalid.focus({ preventScroll: true }); } catch { firstInvalid.focus(); }
        }, 250);
      });
      return;
    }

    setFormValidationError("");
    onSubmit(event);
  };
  const clearFieldValidation = (event) => {
    const field = event.target;
    if (!field || !field.matches?.("input, select, textarea")) return;
    // Only re-check and highlight fields after the first submit attempt.
    if (!validationAttempted) return;
    const formElement = event.currentTarget;
    const fields = Array.from(formElement.querySelectorAll("input, select, textarea")).filter(isEditableControl);
    fields.forEach((item) => {
      const invalid = (isRequiredControl(item, formElement) && isEmptyControl(item)) || !item.checkValidity();
      item.classList.remove("!border-2", "!border-red-500", "!border-red-600", "!bg-red-50", "ring-1", "ring-red-200", "!ring-2", "!ring-red-300", "focus:!border-red-500", "focus:!border-red-600");
      if (invalid) {
        item.classList.add(...validationClasses);
        item.setAttribute("aria-invalid", "true");
      } else {
        item.removeAttribute("aria-invalid");
      }
    });
    const remainingInvalid = fields.some((item) =>
      (isRequiredControl(item, formElement) && isEmptyControl(item)) || !item.checkValidity()
    );
    if (!remainingInvalid) setFormValidationError("");
  };
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
    if (!form.transaction_date) return;
    const selectedDate = new Date(`${String(form.transaction_date).slice(0, 10)}T00:00:00`);
    if (Number.isNaN(selectedDate.getTime())) return;
    const year = String(selectedDate.getFullYear());
    const month = String(selectedDate.getMonth() + 1);
    const quarter = String(Math.ceil(Number(month) / 3));
    setForm((current) => ({
      ...current,
      fiscal_year: year,
      month,
      quarter,
    }));
  }, [form.transaction_date]);

  return (
    <form noValidate onSubmit={handleValidatedSubmit} onChange={clearFieldValidation} onInput={clearFieldValidation} className="space-y-5">
      <style>{`
        .igp-role-locked[disabled] { opacity: 1 !important; }
        .igp-role-locked[disabled] input,
        .igp-role-locked[disabled] select,
        .igp-role-locked[disabled] textarea,
        fieldset[disabled] input,
        fieldset[disabled] select,
        fieldset[disabled] textarea,
        input:disabled:not(.role-locked-field),
        select:disabled:not(.role-locked-field),
        textarea:disabled:not(.role-locked-field),
        input[readonly]:not(.role-locked-field),
        select[readonly],
        textarea[readonly] {
          border: 1px solid #cbd5e1 !important;
          background: #f8fafc !important;
          color: #475569 !important;
          cursor: not-allowed !important;
          opacity: 1 !important;
          box-shadow: none !important;
          -webkit-text-fill-color: #475569 !important;
        }
        /* Budget/Registry fields locked for Procurement and Accountant: outline each control individually. */
        form fieldset.role-lock-budget-fields[disabled] input:disabled:not([readonly]),
        form fieldset.role-lock-budget-fields[disabled] select:disabled,
        form fieldset.role-lock-budget-fields[disabled] textarea:disabled {
          border: 2px solid #ef4444 !important;
          background-color: #fef2f2 !important;
          color: #334155 !important;
          cursor: not-allowed !important;
          opacity: 1 !important;
          box-shadow: 0 0 0 1px rgba(239,68,68,.18) !important;
          -webkit-text-fill-color: #334155 !important;
        }
        /* Role-locked controls: red outline on EACH individual field, not its section container. */
        form .office-fields.procurement-fields fieldset[disabled] input.role-locked-field:disabled,
        form .office-fields.procurement-fields fieldset[disabled] select.role-locked-field:disabled,
        form .office-fields.procurement-fields fieldset[disabled] textarea.role-locked-field:disabled,
        form .office-fields.accounting-fields fieldset[disabled] input.role-locked-field:disabled,
        form .office-fields.accounting-fields fieldset[disabled] select.role-locked-field:disabled,
        form .office-fields.accounting-fields fieldset[disabled] textarea.role-locked-field:disabled,
        form .office-fields input.role-locked-field:disabled,
        form .office-fields select.role-locked-field:disabled,
        form .office-fields textarea.role-locked-field:disabled {
          border: 2px solid #ef4444 !important;
          background-color: #fef2f2 !important;
          color: #334155 !important;
          cursor: not-allowed !important;
          opacity: 1 !important;
          box-shadow: 0 0 0 1px rgba(239,68,68,.18) !important;
          -webkit-text-fill-color: #334155 !important;
        }
        form .office-fields.procurement-fields,
        form .office-fields.accounting-fields { box-shadow: none !important; }
        fieldset[disabled] { pointer-events: none !important; }
        fieldset[disabled] * { cursor: not-allowed !important; }
        .igp-role-locked input:disabled:focus,
        .igp-role-locked select:disabled:focus,
        .igp-role-locked textarea:disabled:focus { outline: none !important; }
        .igp-role-locked input:not(:disabled):not([readonly]),
        .igp-role-locked select:not(:disabled),
        .igp-role-locked textarea:not(:disabled) { pointer-events: auto; }

        /* Explicit override for role-locked readonly controls. These classes are
           added only for Procurement/Accountant fields, overriding neutral readonly styling. */
        form input.role-locked-field,
        form select.role-locked-field,
        form textarea.role-locked-field {
          border: 2px solid #ef4444 !important;
          background: #fef2f2 !important;
          color: #334155 !important;
          -webkit-text-fill-color: #334155 !important;
          box-shadow: 0 0 0 1px rgba(239, 68, 68, .18) !important;
          opacity: 1 !important;
        }

        /* Universal rule: every non-clickable form field gets its own red outline,
           regardless of role or which section it belongs to. Containers are untouched. */
        form input:disabled,
        form select:disabled,
        form textarea:disabled,
        form input[readonly],
        form select[readonly],
        form textarea[readonly] {
          border: 2px solid #ef4444 !important;
          background-color: #fef2f2 !important;
          color: #334155 !important;
          cursor: not-allowed !important;
          opacity: 1 !important;
          box-shadow: 0 0 0 1px rgba(239,68,68,.18) !important;
          -webkit-text-fill-color: #334155 !important;
        }

        /* Explicit role-based styling for the seven requested fields.
           This wins over Tailwind important border/background utility classes. */
        form input.role-locked-field,
        form select.role-locked-field,
        form textarea.role-locked-field {
          border: 2px solid #ef4444 !important;
          background-color: #fef2f2 !important;
          color: #334155 !important;
          box-shadow: 0 0 0 1px rgba(239,68,68,.22) !important;
          opacity: 1 !important;
          -webkit-text-fill-color: #334155 !important;
        }

        /* FINAL OVERRIDE: when the Registry/Transaction fieldset is disabled for
           Procurement or Accountant, force each system/read-only field red. Avoid
           conflicting Tailwind !border-slate-200 utilities on Registry No.
           The fieldset itself is not styled; each input gets its own outline. */
        form fieldset.igp-role-locked[disabled] input[readonly],
        form fieldset.igp-role-locked[disabled] input:disabled,
        form fieldset.role-lock-budget-fields[disabled] input[readonly],
        form fieldset.role-lock-budget-fields[disabled] input:disabled {
          border: 2px solid #ef4444 !important;
          border-color: #ef4444 !important;
          background: #fef2f2 !important;
          color: #334155 !important;
          -webkit-text-fill-color: #334155 !important;
          box-shadow: 0 0 0 1px rgba(239,68,68,.25) !important;
          opacity: 1 !important;
        }
      `}</style>
      {formValidationError && <div role="alert" className="sticky top-0 z-20 rounded-lg border-2 border-red-400 bg-red-50 px-4 py-3 text-xs font-bold text-red-800 shadow-sm"><div className="flex items-start gap-2"><span aria-hidden="true">⚠</span><span>{formValidationError}</span></div></div>}
      {error && <div role="alert" className="rounded-lg border-2 border-red-400 bg-red-50 px-4 py-3 text-xs font-bold text-red-800"><span aria-hidden="true">⚠ </span>{error}</div>}
      <div role="note" className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-[10px] leading-4 text-blue-900"><b>Field access guide:</b> {isProcurementRole ? "Only procurement fields are editable for your role." : isAccountantRole ? "Only accounting and disbursement fields are editable for your role." : (isBudgetRole || ["administration", "administrator", "admin"].includes(normalizedRole)) ? "Budget fields are editable; procurement and accounting fields are locked, including for Administrator." : "Fields outside your assigned permissions are locked."} Procurement and Accounting sections that are locked for your role have red-outlined, non-clickable fields. Read-only system-generated fields outside those locked sections stay neutral. Missing required fields are highlighted after submission.</div>
      <fieldset disabled={["procurement", "accountant"].includes(normalizedRole)} className={`igp-role-locked rounded-xl border border-blue-100 bg-blue-50/40 p-4 ${["procurement", "accountant", "account"].includes(normalizedRole) ? "role-lock-budget-fields" : ""}`}>
        <p className="mb-3 text-[10px] font-extrabold uppercase tracking-wide text-blue-700">
          Registry Information
        </p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Field label="Registry No.">
            <Input
              value={form.registry_no || "Will be generated on save"}
              readOnly
              className={`font-mono font-extrabold text-[#17135f] ring-0 read-only:cursor-not-allowed ${["procurement", "accountant"].includes(normalizedRole) ? "role-locked-field" : ""}`}
              title="System-generated and locked. This number is assigned when the transaction is saved."
            />
            <p className="mt-1 text-[10px] text-amber-700">System-generated • locked</p>
          </Field>
          <Field label="Date" required>
            <Input
              required
              type="date"
              value={form.transaction_date}
              onChange={(e) => {
                const value = e.target.value;
                if (!value) { set("transaction_date", ""); return; }
                const selectedDate = new Date(`${value}T00:00:00`);
                const month = selectedDate.getMonth() + 1;
                setForm((current) => ({
                  ...current,
                  transaction_date: value,
                  fiscal_year: String(selectedDate.getFullYear()),
                  month: String(month),
                  quarter: String(Math.ceil(month / 3)),
                }));
              }}
            />
          </Field>
          <RefSelect label="Fund Cluster" value={form.fund_cluster_id} onChange={(e) => set("fund_cluster_id", e.target.value)} items={references.fund_clusters} required />
          <Field label="Fund Code">
            <Input value="161" readOnly className={`bg-slate-50 font-bold ${["procurement", "accountant"].includes(normalizedRole) ? "role-locked-field" : ""}`} />
          </Field>
          <RefSelect label="Campus" value={form.campus_id} onChange={(e) => set("campus_id", e.target.value)} items={references.campuses} />
          <Field label="BURS Serial No.">
            <Input
              value={form.burs_serial_no || "Will be generated on save"}
              readOnly
              className={`bg-slate-50 font-bold text-slate-500 ${["procurement", "accountant"].includes(normalizedRole) ? "role-locked-field" : ""}`}
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
      </fieldset>

      <fieldset disabled={["procurement", "accountant"].includes(normalizedRole)} className={`igp-role-locked rounded-xl border border-slate-200 bg-white p-4 ${["procurement", "accountant", "account"].includes(normalizedRole) ? "role-lock-budget-fields" : ""}`}>
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
          }} items={references.uacs_codes} displayKey="name" />
          <RefSelect label="Allotment Class" value={form.allotment_class_id} onChange={(e) => set("allotment_class_id", e.target.value)} items={references.allotment_classes} displayKey="name" />
          <Field label="Month">
            <Input
              value={form.month ? new Date(2000, Number(form.month) - 1, 1).toLocaleString("en-US", { month: "long" }) : "—"}
              readOnly
              disabled
              className={`!font-extrabold !text-[#17135f] ${["procurement", "accountant"].includes(normalizedRole) ? "role-locked-field" : ""}`}
              title="Automatically determined by the transaction date above"
            />
          </Field>
          <Field label="Series">
            <Input value={form.series} onChange={(e) => set("series", e.target.value)} />
          </Field>
          <Field label="Series2">
            <Input value={form.series2} onChange={(e) => set("series2", e.target.value)} />
          </Field>
          <Field label="Quarter">
            <Input
              value={form.quarter ? `Q${form.quarter}` : "—"}
              readOnly
              disabled
              className={`!font-extrabold !text-[#17135f] ${["procurement", "accountant"].includes(normalizedRole) ? "role-locked-field" : ""}`}
              title="Automatically determined by the transaction date above"
            />
          </Field>
          <RefSelect label="MFO" value={form.mfo_id} onChange={(e) => set("mfo_id", e.target.value)} items={references.mfo} />
          <RefSelect
            label="Old UACS Code"
            value={form.old_uacs_code_id}
            onChange={(e) => set("old_uacs_code_id", e.target.value)}
            items={references.old_uacs_codes}
            displayKey="name"
          />
          <Field label="Account Title">
            <Input value={form.account_title} onChange={(e) => set("account_title", e.target.value)} />
          </Field>
        </div>
      </fieldset>

      <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4">
        <p className="mb-3 text-[10px] font-extrabold uppercase tracking-wide text-emerald-700">Utilization / Accounting</p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <fieldset disabled={["procurement", "accountant", "account"].includes(normalizedRole)} className={`contents igp-role-locked ${["procurement", "accountant", "account"].includes(normalizedRole) ? "role-lock-budget-fields" : ""}`}>
          <Field label="Income / Collection">
            <Input type="number" min="0" step="0.01" value={form.income_amount} onChange={(e) => set("income_amount", e.target.value)} disabled={!allowedTransactionTypes.includes("Income")} className={["procurement", "accountant"].includes(normalizedRole) ? "role-locked-field" : ""} />
          </Field>
          <Field label="Utilization">
            <Input type="number" min="0" step="0.01" value={form.utilization_amount} onChange={(e) => set("utilization_amount", e.target.value)} disabled={!(allowedTransactionTypes.includes("Utilization") || isBudgetRole || ["administration", "administrator", "admin"].includes(normalizedRole))} className={["procurement", "accountant"].includes(normalizedRole) ? "role-locked-field" : ""} />
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
          }} items={references.wfp_sources} displayKey="name" />
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
          </fieldset>
          <div className="office-fields procurement-fields md:col-span-3 rounded-lg border border-blue-200 bg-blue-50/50 p-3"><p className="mb-2 text-[10px] font-extrabold uppercase text-blue-800">Procurement Details</p><fieldset disabled={!(isProcurementRole || isAdminRole)} className="contents igp-role-locked"><div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {[["PO No.","po_no"],["PO Date","po_date"],["Supplier / Payee","supplier_payee"],["PO Amount","po_amount"],["AIR / FAR Reference","air_far_reference"],["IAR No.","iar_no"],["PAR No.","par_no"],["ICS No.","ics_no"],["IRS / RIS Reference","ris_no"],["Procurement Status","po_status"],["Procurement Remarks","procurement_remarks"]].map(([label,key])=><Field key={key} label={label}>{key === "po_status" ? <Select className={!isProcurementRole ? "role-locked-field" : ""} disabled={!isProcurementRole} required={isProcurementRole} value={form[key] || ""} onChange={e=>set(key,e.target.value)}><option value="">Select</option><option value="PENDING">PENDING</option><option value="APPROVED">APPROVED</option><option value="ISSUED">ISSUED</option><option value="PARTIALLY DELIVERED">PARTIALLY DELIVERED</option><option value="COMPLETED">COMPLETED</option><option value="CANCELLED">CANCELLED</option></Select> : <Input className={!isProcurementRole ? "role-locked-field" : ""} disabled={!isProcurementRole} required={isProcurementRole && ["po_no", "po_date", "supplier_payee", "po_amount", "po_status", "procurement_remarks"].includes(key)} min={key === "po_amount" ? "0" : undefined} step={key === "po_amount" ? "0.01" : undefined} type={key==="po_date"?"date":key==="po_amount"?"number":"text"} value={form[key]||""} onChange={e=>set(key,e.target.value)}/>}</Field>)}
          </div></fieldset></div>
          <div className="office-fields accounting-fields md:col-span-3 rounded-lg border border-violet-200 bg-violet-50/50 p-3"><p className="mb-2 text-[10px] font-extrabold uppercase text-violet-800">Accounting / Disbursement Review</p><fieldset disabled={!(isAccountantRole || isAdminRole)} className="contents igp-role-locked"><div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {[["DB No.","db_no"],["DV / Payroll No.","dv_payroll_no"],["BURS Serial No.","burs_serial_no"],["Disbursement Date","disbursement_date"],["Disbursement Amount","disbursement_amount"],["Notice of Adjustment","notice_of_adjustment"],["Adjustment Reason","adjustment_reason"],["Accounting Status","accounting_status"],["Reviewed By","reviewed_by"],["Review Date and Time","review_datetime"],["Accounting Remarks","accounting_remarks"]].map(([label,key])=><Field key={key} label={label}>{key === "accounting_status" ? <Select className={!isAccountantRole ? "role-locked-field" : ""} disabled={!isAccountantRole} required={isAccountantRole} value={form[key] || ""} onChange={e=>set(key,e.target.value)}><option value="">Select status</option><option value="Pending">Pending</option><option value="Reviewed">Reviewed</option><option value="Approved">Approved</option><option value="Returned">Returned</option></Select> : <Input className={!isAccountantRole ? "role-locked-field" : ""} disabled={!isAccountantRole} required={isAccountantRole && !["burs_serial_no", "notice_of_adjustment", "adjustment_reason"].includes(key)} min={key === "disbursement_amount" ? "0" : undefined} step={key === "disbursement_amount" ? "0.01" : undefined} type={key==="disbursement_date"?"date":key==="review_datetime"?"datetime-local":key==="disbursement_amount"?"number":"text"} value={form[key]||""} onChange={e=>set(key,e.target.value)}/>}</Field>)}
          </div></fieldset></div>
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
  const isAdmin = ["Administration", "Administrator", "Admin"].includes(role);
  const isBudget = role === "Budget";
  const isProcurement = role === "Procurement";
  const isAccountant = role === "Accountant";
  const canEditOfficeTransactions = isProcurement || isAccountant;
  // Procurement and Accountant can view transactions to update only their office fields.
  const canViewIgp = isAdmin || isBudget || canEditOfficeTransactions;
  const canManagePrograms = isAdmin || isBudget;
  const canDelete = isAdmin;
  const canManageTransactions = isAdmin || isBudget;
  // Administrator has the same transaction-form access as Budget; no full form access.
  const allowedTransactionTypes = (isAdmin || isBudget)
    ? ["Adjustment"]
    : [];
  const defaultTransactionType = allowedTransactionTypes[0] || "Income";

  const [view, setView] = useState(canEditOfficeTransactions ? "transactions" : "budget");
  useEffect(() => {
    const handleIgpOpenView = (event) => {
      const nextView = event?.detail?.view;
      if (canEditOfficeTransactions) {
        // Office roles can open Transactions and Reports only.
        if (nextView === "transactions" || nextView === "reports") {
          setView(nextView);
        } else if (nextView) {
          setView("transactions");
        }
        return;
      }
      const allowedViews = ["module", "budget", "programs", "transactions", "monitoring", "reports"];
      if (allowedViews.includes(nextView)) setView(nextView === "module" ? "budget" : nextView);
    };
    window.addEventListener("bmas-igp-open-view", handleIgpOpenView);
    return () => window.removeEventListener("bmas-igp-open-view", handleIgpOpenView);
  }, [canEditOfficeTransactions]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("bmas-igp-open-view", { detail: { view, source: "content" } }));
  }, [view]);
  const [activeTab, setActiveTab] = useState("all");
  const [fiscalYear, setFiscalYear] = useState(DEFAULT_FISCAL_YEAR);
  const [overview, setOverview] = useState({});
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [recentPagination, setRecentPagination] = useState({ page: 1, limit: RECENT_TRANSACTIONS_LIMIT, totalItems: 0, totalPages: 1 });
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
  const [programPage, setProgramPage] = useState(1);
  const [monitoringPage, setMonitoringPage] = useState(1);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: LIMIT, totalItems: 0, totalPages: 1 });
  const [programModal, setProgramModal] = useState(null);
  const [transactionModal, setTransactionModal] = useState(null);
  const [programForm, setProgramForm] = useState(emptyProgram);
  const [transactionForm, setTransactionForm] = useState(emptyTransaction);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [transactionView, setTransactionView] = useState(null);
  const [programView, setProgramView] = useState(null);
  const [auditModal, setAuditModal] = useState(null);
  const [auditRows, setAuditRows] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const [reportType, setReportType] = useState(canEditOfficeTransactions ? "office" : "registry");
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

  // Dashboard Recent IGP Transactions has its own server-side pagination (10 rows per page).
  const loadRecentTransactions = async (nextPage = 1) => {
    try {
      const q = new URLSearchParams({
        year: String(fiscalYear),
        page: String(nextPage),
        limit: String(RECENT_TRANSACTIONS_LIMIT),
      });
      const data = await api(`/igp/transactions?${q.toString()}`);
      setRecentTransactions(data.data || []);
      setRecentPagination(data.pagination || {
        page: nextPage,
        limit: RECENT_TRANSACTIONS_LIMIT,
        totalItems: (data.data || []).length,
        totalPages: 1,
      });
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
    loadRecentTransactions(1);
  }, [fiscalYear]);

  useEffect(() => {
    setProgramPage(1);
    if (view === "programs") loadPrograms();
  }, [programSearch]);

  useEffect(() => {
    setProgramPage(1);
  }, [fiscalYear, programs.length]);

  useEffect(() => {
    setMonitoringPage(1);
  }, [fiscalYear]);

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
    await Promise.all([loadOverview(), loadReferences(), loadPrograms(), loadTransactions(page), loadRecentTransactions(recentPagination.page)]);
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

  const openViewTransaction = (row) => setTransactionView(row);

  const openAuditTrail = async (row) => {
    setAuditModal(row);
    setAuditRows([]);
    setAuditLoading(true);
    try {
      const result = await api("/igp/audit-log?limit=200");
      const all = result.data || [];
      const isProgram = row.program_code !== undefined || row.program_name !== undefined;
      const tablePattern = isProgram ? /igp_programs|program/i : /igp_transactions|transaction/i;
      const matches = all.filter((item) =>
        String(item.record_id ?? "") === String(row.id ?? "") &&
        (!item.table_name || tablePattern.test(item.table_name))
      );
      setAuditRows(matches);
    } catch (e) {
      setError(e.message);
    } finally {
      setAuditLoading(false);
    }
  };

  const openEditTransaction = (row) => {
    if (!canManageTransactions && !canEditOfficeTransactions) return;
    setSelectedTransaction(row);
    setTransactionForm({ ...emptyTransaction, ...row,
      transaction_date: row.transaction_date ? String(row.transaction_date).slice(0, 10) : emptyTransaction.transaction_date,
      fiscal_year: String(row.transaction_date ? new Date(`${String(row.transaction_date).slice(0, 10)}T00:00:00`).getFullYear() : new Date().getFullYear()),
      month: String(new Date(`${String(row.transaction_date || emptyTransaction.transaction_date).slice(0, 10)}T00:00:00`).getMonth() + 1),
      quarter: String(Math.ceil((new Date(`${String(row.transaction_date || emptyTransaction.transaction_date).slice(0, 10)}T00:00:00`).getMonth() + 1) / 3)),
      transaction_type: row.transaction_type || defaultTransactionType,
    });
    setTransactionModal("edit");
  };

  const submitTransaction = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const isEdit = transactionModal === "edit";
      if (canEditOfficeTransactions) {
        if (!isEdit || !selectedTransaction?.id) throw new Error("Procurement and Accountant may update existing IGP transactions only.");
        const allowedFields = isProcurement
          ? ["po_no","po_date","supplier_payee","po_amount","air_far_reference","iar_no","par_no","ics_no","ris_no","po_status","procurement_remarks"]
          : ["db_no","dv_payroll_no","burs_serial_no","disbursement_date","disbursement_amount","notice_of_adjustment","adjustment_reason","accounting_status","reviewed_by","review_datetime","accounting_remarks"];
        const officePayload = Object.fromEntries(allowedFields.map((field) => [field, transactionForm[field] ?? ""]));
        await api(`/igp/transactions/${selectedTransaction.id}/office-details`, { method: "PUT", body: JSON.stringify(officePayload) });
      } else {
        await api(isEdit ? `/igp/transactions/${selectedTransaction?.id}` : "/igp/transactions", {
          method: isEdit ? "PUT" : "POST",
          body: JSON.stringify({ ...transactionForm, fiscal_year: transactionForm.fiscal_year || fiscalYear }),
        });
      }
      setTransactionModal(null);
      setSelectedTransaction(null);
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
  // The existing IGP dashboard design is shown inside WFP / Budget & Allocation.
  // There is no separate Overview submodule in IGP.
  const cards = [
    ["budget", "WFP / Budget & Allocation", "Manage beginning balance, projected income, approved IGP budget and available Fund 161 balance.", "bg-emerald-500", BarChart3],
    ["programs", "IGP Programs / Projects", "Manage IGP programs, fund clusters, WFP sources and project details.", "bg-orange-500", Landmark],
    ["transactions", "IGP Transactions", "Record Fund 161 income, utilization and adjustment transactions.", "bg-teal-500", FileText],
    ["monitoring", "Monitoring", "Monitor collection, utilization, unpaid utilization and available balance.", "bg-violet-600", TrendingUp],
    ["reports", "Reports / Export", "Print and export IGP registry and financial information.", "bg-indigo-600", FileBarChart],
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
    {
      key: "actions", label: "ACTIONS", render: r => (
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => setProgramView(r)} className="inline-flex h-8 w-8 min-w-[2rem] shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white p-1.5 text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700" title="View program" aria-label="View program"><Eye className="h-4 w-4 shrink-0" /></button>
          <button type="button" onClick={() => openAuditTrail(r)} className="inline-flex h-8 w-8 min-w-[2rem] shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white p-1.5 text-violet-700 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-800" title="Audit trail" aria-label="Audit trail"><History className="h-4 w-4 shrink-0" /></button>
          {canManagePrograms && <button type="button" onClick={() => openEditProgram(r)} className="inline-flex h-8 w-8 min-w-[2rem] shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white p-1.5 text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700" title="Edit program" aria-label="Edit program"><Pencil className="h-4 w-4 shrink-0" /></button>}
          {isAdmin && <button type="button" onClick={() => deleteProgram(r.id)} className="inline-flex h-8 w-8 min-w-[2rem] shrink-0 items-center justify-center rounded-md border border-red-200 bg-white p-1.5 text-red-600 hover:bg-red-50" title="Delete program" aria-label="Delete program"><Trash2 className="h-4 w-4 shrink-0" /></button>}
        </div>
      )
    },
  ];

  // Show every field from the Add/Edit IGP Transaction form in the registry table.
  // The Table wrapper is horizontally scrollable so all columns remain accessible.
  const transactionColumns = [
    { key: "registry_no", label: "REGISTRY NO.", render: r => r.registry_no || r.transaction_no || "—" },
    { key: "transaction_date", label: "DATE", render: r => dateText(r.transaction_date) },
    { key: "fiscal_year", label: "FISCAL YEAR", render: r => r.fiscal_year || fiscalYear },
    { key: "fund_cluster_code", label: "FUND CLUSTER", render: r => r.fund_cluster_code || "161" },
    { key: "fund_code", label: "FUND CODE", render: r => r.fund_code || "161" },
    { key: "campus_name", label: "CAMPUS", render: r => r.campus_name || r.campus_code },
    { key: "burs_serial_no", label: "BURS SERIAL NO." },
    { key: "serial_no_transferred", label: "SERIAL TRANSFERRED FROM / TO" },
    { key: "program_code", label: "PROGRAM CODE" },
    { key: "program_name", label: "PROGRAM / PROJECT", render: r => r.program_name || r.program_code },
    { key: "transaction_type", label: "TRANSACTION TYPE", render: r => <StatusBadge value={r.transaction_type} /> },
    { key: "payee", label: "PAYEE / NAME" },
    { key: "reference_no", label: "REF. NO." },
    { key: "particulars", label: "PARTICULARS / DESCRIPTION", render: r => r.particulars || r.description || r.remarks },
    { key: "responsibility_center_name", label: "RESPONSIBILITY CENTER", render: r => r.responsibility_center_name || r.responsibility_center_code },
    { key: "pap_name", label: "PAP", render: r => r.pap_name || r.pap_code },
    { key: "uacs_code", label: "UACS CODE", render: r => r.uacs_code || r.uacs_account_title },
    { key: "allotment_class_name", label: "ALLOTMENT CLASS", render: r => r.allotment_class_name || r.allotment_class_code },
    { key: "month", label: "MONTH" },
    { key: "series", label: "SERIES" },
    { key: "series2", label: "SERIES 2" },
    { key: "quarter", label: "QUARTER", render: r => r.quarter ? `Q${String(r.quarter).replace(/^Q/i, "")}` : "—" },
    { key: "mfo_name", label: "MFO", render: r => r.mfo_name || r.mfo_code },
    { key: "old_uacs_code", label: "OLD UACS CODE", render: r => r.old_uacs_code || r.old_uacs_master_code },
    { key: "account_title", label: "ACCOUNT TITLE", render: r => r.account_title || r.uacs_account_title },
    { key: "income_amount", label: "INCOME / COLLECTION", render: r => money(r.income_amount ?? r.income) },
    { key: "utilization_amount", label: "UTILIZATION", render: r => money(r.utilization_amount ?? r.utilization) },
    { key: "ps_utilization", label: "PS", render: r => money(r.ps_utilization) },
    { key: "mooe_utilization", label: "MOOE", render: r => money(r.mooe_utilization) },
    { key: "co_utilization", label: "CO", render: r => money(r.co_utilization) },
    { key: "wfp_source_name", label: "WFP SOURCE", render: r => r.wfp_source_name || r.wfp_source_code },
    { key: "wfp_source_code", label: "WFP SOURCE CODE" },
    { key: "running_balance", label: "RUNNING BALANCE", render: r => money(r.running_balance ?? r.balance) },
    { key: "unpaid_utilization", label: "UNPAID UTILIZATION", render: r => money(r.unpaid_utilization) },
    { key: "remarks", label: "REMARKS" },
    { key: "po_no", label: "PO NO." },
    { key: "po_date", label: "PO DATE", render: r => dateText(r.po_date) },
    { key: "supplier_payee", label: "SUPPLIER / PAYEE" },
    { key: "po_amount", label: "PO AMOUNT", render: r => money(r.po_amount) },
    { key: "air_far_reference", label: "AIR / FAR REFERENCE" },
    { key: "iar_no", label: "IAR NO." },
    { key: "par_no", label: "PAR NO." },
    { key: "ics_no", label: "ICS NO." },
    { key: "ris_no", label: "IRS / RIS REFERENCE", render: r => r.ris_no || r.irs_ris_reference },
    { key: "po_status", label: "PROCUREMENT STATUS", render: r => r.po_status || r.procurement_status },
    { key: "procurement_remarks", label: "PROCUREMENT REMARKS" },
    { key: "db_no", label: "DB NO." },
    { key: "dv_payroll_no", label: "DV / PAYROLL NO." },
    { key: "disbursement_date", label: "DISBURSEMENT DATE", render: r => dateText(r.disbursement_date) },
    { key: "disbursement_amount", label: "DISBURSEMENT AMOUNT", render: r => money(r.disbursement_amount ?? r.disbursement) },
    { key: "notice_of_adjustment", label: "NOTICE OF ADJUSTMENT" },
    { key: "adjustment_reason", label: "ADJUSTMENT REASON" },
    { key: "accounting_status", label: "ACCOUNTING STATUS" },
    { key: "reviewed_by", label: "REVIEWED BY" },
    { key: "review_datetime", label: "REVIEW DATE / TIME", render: r => r.review_datetime ? dateText(r.review_datetime) : "—" },
    { key: "accounting_remarks", label: "ACCOUNTING REMARKS" },
    { key: "status", label: "STATUS", render: r => <StatusBadge value={r.status} /> },
    { key: "created_by_name", label: "ENTERED BY", render: r => r.created_by_name ? `${r.created_by_name}${r.created_by_role ? ` (${r.created_by_role})` : ""}` : "—" },
    { key: "updated_by_name", label: "UPDATED BY", render: r => r.updated_by_name ? `${r.updated_by_name}${r.updated_by_role ? ` (${r.updated_by_role})` : ""}` : "—" },
    {
      key: "actions", label: "ACTION", render: r => (
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => openViewTransaction(r)} className="inline-flex h-8 w-8 min-w-[2rem] shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white p-1.5 text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700" title="View transaction" aria-label="View transaction"><Eye className="h-4 w-4 shrink-0" /></button>
          <button type="button" onClick={() => openAuditTrail(r)} className="inline-flex h-8 w-8 min-w-[2rem] shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white p-1.5 text-violet-700 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-800" title="Audit trail" aria-label="Audit trail"><History className="h-4 w-4 shrink-0" /></button>
          {(canManageTransactions || canEditOfficeTransactions) && <button type="button" onClick={() => openEditTransaction(r)} className="inline-flex h-8 w-8 min-w-[2rem] shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white p-1.5 text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700" title="Edit transaction" aria-label="Edit transaction"><Pencil className="h-4 w-4 shrink-0" /></button>}
          {canDelete && <button type="button" onClick={() => deleteTransaction(r.id)} className="inline-flex h-8 w-8 min-w-[2rem] shrink-0 items-center justify-center rounded-md border border-red-200 bg-red-50 p-1.5 text-red-700 hover:bg-red-100" title="Delete transaction" aria-label="Delete transaction"><Trash2 className="h-4 w-4 shrink-0" /></button>}
        </div>
      )
    },
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
        {/* Fiscal year selector — mirrors the Budget Proposals design. */}
        <div
          className="bp-dashboard-toolbar"
          style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginBottom: 12 }}
        >
          <div
            className="bp-dashboard-year-selector"
            style={{
              height: 36,
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: "0 10px",
              background: "#ffffff",
              border: "1px solid #dbe4f0",
              borderRadius: 8,
              boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)",
              color: "#334155",
              fontSize: 10,
              fontWeight: 700,
            }}
          >
            <CalendarDays aria-hidden="true" style={{ width: 14, height: 14, color: "#123b7a", flexShrink: 0 }} />
            <span style={{ whiteSpace: "nowrap" }}>Fiscal Year</span>
            <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
              <select
                value={fiscalYear}
                onChange={(e) => { setFiscalYear(Number(e.target.value)); setPage(1); }}
                aria-label="Fiscal Year"
                style={{
                  appearance: "none",
                  WebkitAppearance: "none",
                  border: 0,
                  outline: 0,
                  background: "transparent",
                  padding: "0 19px 0 1px",
                  color: "#0f172a",
                  fontSize: 10,
                  fontWeight: 800,
                  cursor: "pointer",
                  minHeight: 24,
                  position: "relative",
                  zIndex: 1,
                }}
              >
                {FISCAL_YEARS.map((year) => <option key={year} value={year}>{year}</option>)}
              </select>
              <ChevronDown
                aria-hidden="true"
                style={{
                  position: "absolute",
                  right: 1,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 13,
                  height: 13,
                  color: "#64748b",
                  pointerEvents: "none",
                  marginLeft: -2,
                }}
              />
            </div>
          </div>
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
          <div className="mb-2 px-4 pt-3 text-[9px] text-slate-400">
            All transaction form fields are shown below. Scroll horizontally to view the remaining columns.
          </div>
          <div className="px-0 pb-0">
            <Table columns={transactionColumns} rows={recentTransactions} empty="No IGP transactions yet." />
          </div>
          <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[10px] text-slate-500">
              Showing {recentPagination.totalItems === 0 ? 0 : ((recentPagination.page - 1) * RECENT_TRANSACTIONS_LIMIT) + 1} to {Math.min(recentPagination.page * RECENT_TRANSACTIONS_LIMIT, recentPagination.totalItems)} of {recentPagination.totalItems} entries
            </p>
            <div className="flex items-center justify-end gap-1">
              <button type="button" onClick={() => loadRecentTransactions(Math.max(1, recentPagination.page - 1))} disabled={recentPagination.page <= 1} className="inline-flex h-8 min-w-8 items-center justify-center rounded-md border border-slate-200 bg-white px-2 text-[10px] font-bold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Previous recent transactions page">
                <ArrowLeft className="h-3.5 w-3.5" />
              </button>
              {Array.from({ length: Math.max(1, recentPagination.totalPages || 1) }, (_, i) => i + 1).map((pageNumber) => (
                <button key={pageNumber} type="button" onClick={() => loadRecentTransactions(pageNumber)} aria-current={recentPagination.page === pageNumber ? "page" : undefined} className={`inline-flex h-8 min-w-8 items-center justify-center rounded-md border px-2 text-[10px] font-bold ${recentPagination.page === pageNumber ? "border-[#174fd1] bg-[#174fd1] text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
                  {pageNumber}
                </button>
              ))}
              <button type="button" onClick={() => loadRecentTransactions(Math.min(recentPagination.totalPages || 1, recentPagination.page + 1))} disabled={recentPagination.page >= (recentPagination.totalPages || 1)} className="inline-flex h-8 min-w-8 items-center justify-center rounded-md border border-slate-200 bg-white px-2 text-[10px] font-bold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Next recent transactions page">
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </section>
      </>
    );
  };

  const renderBudget = () => (
    <>
      <BackBar title="WFP / Budget & Allocation" onBack={backHome} />
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

  const programTotalPages = Math.max(1, Math.ceil(programs.length / PROGRAMS_LIMIT));
  const visiblePrograms = programs.slice((programPage - 1) * PROGRAMS_LIMIT, programPage * PROGRAMS_LIMIT);

  const renderPrograms = () => (
    <>
      <BackBar title="IGP Programs / Projects" onBack={backHome} />
      <div className="mb-4 grid grid-cols-1 gap-2 md:grid-cols-12">
        <div className="relative md:col-span-7"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input value={programSearch} onChange={e => { setProgramSearch(e.target.value); setProgramPage(1); }} placeholder="Search program, project, WFP, campus or RC..." className="pl-9" /></div>
        <button type="button" onClick={loadPrograms} className="flex h-9 items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white text-[10px] font-bold text-slate-600"><RefreshCw className="h-4 w-4 shrink-0" />Refresh</button>
        {canManagePrograms && <button type="button" onClick={openAddProgram} className="flex h-9 items-center justify-center gap-1 rounded-lg bg-[#174fd1] text-[10px] font-bold text-white md:col-span-4"><Plus className="h-3.5 w-3.5" />Add IGP Program / Project</button>}
      </div>
      <Table columns={programColumns} rows={visiblePrograms} empty="No IGP programs / projects found." />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-[10px] text-slate-500">
        <span>Showing {programs.length ? (programPage - 1) * PROGRAMS_LIMIT + 1 : 0} to {Math.min(programPage * PROGRAMS_LIMIT, programs.length)} of {programs.length} entries</span>
        <div className="flex items-center gap-1">
          <button type="button" aria-label="Previous programs page" disabled={programPage <= 1} onClick={() => setProgramPage(p => Math.max(1, p - 1))} className="rounded border border-slate-200 bg-white p-1.5 disabled:opacity-30"><ArrowLeft className="h-3 w-3" /></button>
          {Array.from({ length: Math.min(5, programTotalPages) }, (_, i) => {
            const start = Math.max(1, Math.min(programPage - 2, programTotalPages - 4));
            const number = start + i;
            return number <= programTotalPages ? <button key={number} type="button" onClick={() => setProgramPage(number)} className={`rounded px-2.5 py-1.5 ${programPage === number ? "bg-[#174fd1] text-white" : "border border-slate-200 bg-white text-slate-500"}`}>{number}</button> : null;
          })}
          <button type="button" aria-label="Next programs page" disabled={programPage >= programTotalPages} onClick={() => setProgramPage(p => Math.min(programTotalPages, p + 1))} className="rounded border border-slate-200 bg-white p-1.5 disabled:opacity-30"><ArrowRight className="h-3 w-3" /></button>
        </div>
      </div>
    </>
  );

  const renderTransactions = () => (
    <>
      <BackBar title="IGP Transactions — Fund 161" onBack={backHome} />
      <div className="mb-4 grid grid-cols-1 gap-2 md:grid-cols-12">
        <div className="relative md:col-span-7"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && loadTransactions(1)} placeholder="Search registry, BURS, payee, program, PO..." className="pl-9" /></div>
        <button type="button" onClick={() => loadTransactions(1)} className="flex h-9 items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white text-[10px] font-bold text-slate-600"><RefreshCw className="h-4 w-4 shrink-0" />Refresh</button>
        {canManageTransactions && <button type="button" onClick={openAddTransaction} className="flex h-9 items-center justify-center gap-1 rounded-lg bg-[#174fd1] text-[10px] font-bold text-white md:col-span-4"><Plus className="h-3.5 w-3.5" />Add IGP Transaction</button>}
      </div>
      <div className="mb-3 flex gap-1 overflow-x-auto rounded-lg border border-slate-100 bg-white p-1 shadow-sm">
        {[["all","All Records"],["Income","Income"],["Utilization","Utilization"],["Adjustment","Adjustment"]].map(([id,label]) => (
          <button key={id} type="button" onClick={() => { setActiveTab(id); setPage(1); }} className={`whitespace-nowrap rounded-md px-3 py-2 text-[9px] font-bold ${activeTab === id ? "bg-[#174fd1] text-white" : "text-slate-500 hover:bg-slate-50"}`}>{label}</button>
        ))}
      </div>
      <div className="mb-2 text-[9px] text-slate-400">All transaction form fields are shown in the table. Scroll horizontally to view the remaining columns.</div>
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

  const monitoringRows = overview.by_fund_cluster || [];
  const monitoringTotalPages = Math.max(1, Math.ceil(monitoringRows.length / MONITORING_LIMIT));
  const visibleMonitoringRows = monitoringRows.slice((monitoringPage - 1) * MONITORING_LIMIT, monitoringPage * MONITORING_LIMIT);

  const renderMonitoring = () => (
    <>
      <BackBar title="Income, Utilization & Disbursement Monitoring" onBack={backHome} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Metric label="Actual Collection" value={money(income)} icon={TrendingUp} className="bg-emerald-600 text-white" />
        <Metric label="Utilization" value={money(utilization)} icon={ArrowDownToLine} className="bg-orange-500 text-white" />
        <Metric label="Disbursement" value={money(disbursement)} icon={Download} className="bg-violet-600 text-white" />
        <Metric label="Unpaid Utilization" value={money(unpaid)} icon={CheckCircle2} className="bg-red-500 text-white" />
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
          rows={visibleMonitoringRows}
          empty="No monitoring records found."
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-[10px] text-slate-500">
          <span>Showing {monitoringRows.length ? (monitoringPage - 1) * MONITORING_LIMIT + 1 : 0} to {Math.min(monitoringPage * MONITORING_LIMIT, monitoringRows.length)} of {monitoringRows.length} entries</span>
          <div className="flex items-center gap-1">
            <button type="button" aria-label="Previous monitoring page" disabled={monitoringPage <= 1} onClick={() => setMonitoringPage(p => Math.max(1, p - 1))} className="rounded border border-slate-200 bg-white p-1.5 disabled:opacity-30"><ArrowLeft className="h-3 w-3" /></button>
            {Array.from({ length: Math.min(5, monitoringTotalPages) }, (_, i) => {
              const start = Math.max(1, Math.min(monitoringPage - 2, monitoringTotalPages - 4));
              const number = start + i;
              return number <= monitoringTotalPages ? <button key={number} type="button" onClick={() => setMonitoringPage(number)} className={`rounded px-2.5 py-1.5 ${monitoringPage === number ? "bg-[#174fd1] text-white" : "border border-slate-200 bg-white text-slate-500"}`}>{number}</button> : null;
            })}
            <button type="button" aria-label="Next monitoring page" disabled={monitoringPage >= monitoringTotalPages} onClick={() => setMonitoringPage(p => Math.min(monitoringTotalPages, p + 1))} className="rounded border border-slate-200 bg-white p-1.5 disabled:opacity-30"><ArrowRight className="h-3 w-3" /></button>
          </div>
        </div>
      </div>
    </>
  );

  const reportDefinitions = canEditOfficeTransactions
    ? [["office", isProcurement ? "IGP Procurement Report" : "IGP Accounting Report", isProcurement ? "Procurement fields entered for Fund 161 transactions." : "Accounting and disbursement fields entered for Fund 161 transactions.", FileText]]
    : [
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
      } else if (type === "office" || type === "registry" || type === "income" || type === "utilization" || type === "disbursement") {
        const q = new URLSearchParams({
          year: String(fiscalYear),
          page: "1",
          limit: "10000",
          search: "",
          type: ["registry", "office"].includes(type) ? "" : type,
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

  useEffect(() => {
    if (view === "reports") loadReport(reportType);
  }, [view]);

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
        <table className="w-full border-collapse whitespace-nowrap text-[9px]">
          <thead><tr className="bg-[#102b67] text-white">
            <th className="!text-white border border-slate-300 p-2 text-left">FUND CLUSTER</th>
            <th className="!text-white border border-slate-300 p-2 text-left">DESCRIPTION</th>
            <th className="!text-white border border-slate-300 p-2 text-right">BEGINNING</th>
            <th className="!text-white border border-slate-300 p-2 text-right">PROJECTED</th>
            <th className="!text-white border border-slate-300 p-2 text-right">APPROVED</th>
            <th className="!text-white border border-slate-300 p-2 text-right">COLLECTION</th>
            <th className="!text-white border border-slate-300 p-2 text-right">BALANCE</th>
            <th className="!text-white border border-slate-300 p-2 text-left">ENTERED BY</th>
            <th className="!text-white border border-slate-300 p-2 text-left">UPDATED BY</th>
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
        <table className="w-full border-collapse whitespace-nowrap text-[9px]">
          <thead><tr className="bg-[#102b67] text-white">
            <th className="!text-white border border-slate-300 p-2 text-left">PROGRAM CODE</th>
            <th className="!text-white border border-slate-300 p-2 text-left">PROGRAM / PROJECT</th>
            <th className="!text-white border border-slate-300 p-2 text-left">FUND CLUSTER</th>
            <th className="!text-white border border-slate-300 p-2 text-right">BEGINNING</th>
            <th className="!text-white border border-slate-300 p-2 text-right">PROJECTED</th>
            <th className="!text-white border border-slate-300 p-2 text-right">APPROVED</th>
            <th className="!text-white border border-slate-300 p-2 text-right">COLLECTION</th>
            <th className="!text-white border border-slate-300 p-2 text-right">UTILIZATION</th>
            <th className="!text-white border border-slate-300 p-2 text-right">BALANCE</th>
            <th className="!text-white border border-slate-300 p-2 text-left">ENTERED BY</th>
            <th className="!text-white border border-slate-300 p-2 text-left">UPDATED BY</th>
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

    const allColumns = [
      ["REGISTRY NO.", r => r.registry_no || r.transaction_no], ["DATE", r => dateText(r.transaction_date)],
      ["FISCAL YEAR", r => r.fiscal_year], ["FUND CLUSTER", r => r.fund_cluster_code || "161"], ["CAMPUS", r => r.campus_name || r.campus_code],
      ["PROGRAM CODE", r => r.program_code], ["PROGRAM / PROJECT", r => r.program_name], ["TRANSACTION TYPE", r => r.transaction_type],
      ["BURS SERIAL NO.", r => r.burs_serial_no], ["SERIAL TRANSFERRED", r => r.serial_no_transferred], ["PAYEE / NAME", r => r.payee],
      ["PARTICULARS", r => r.particulars || r.description || r.remarks || r.account_title], ["RESPONSIBILITY CENTER", r => r.responsibility_center_name || r.responsibility_center_code],
      ["PAP", r => r.pap_name || r.pap_code], ["UACS CODE", r => r.uacs_code || r.uacs_account_title], ["REFERENCE NO.", r => r.reference_no],
      ["ALLOTMENT CLASS", r => r.allotment_class_name || r.allotment_class_code], ["MFO", r => r.mfo_name || r.mfo_code], ["OLD UACS CODE", r => r.old_uacs_code || r.old_uacs_master_code], ["ACCOUNT TITLE", r => r.account_title || r.uacs_account_title], ["MONTH", r => r.month], ["SERIES", r => r.series], ["SERIES 2", r => r.series2], ["QUARTER", r => r.quarter], ["WFP SOURCE", r => r.wfp_source_name || r.wfp_source_code],
      ["INCOME", r => reportMoney(r.income_amount ?? r.income)], ["UTILIZATION", r => reportMoney(r.utilization_amount ?? r.utilization)],
      ["PS UTILIZATION", r => reportMoney(r.ps_utilization)], ["MOOE UTILIZATION", r => reportMoney(r.mooe_utilization)], ["CO UTILIZATION", r => reportMoney(r.co_utilization)],
      ["DISBURSEMENT", r => reportMoney(r.disbursement_amount ?? r.disbursement)], ["UNPAID UTILIZATION", r => reportMoney(r.unpaid_utilization)], ["RUNNING BALANCE", r => reportMoney(r.running_balance ?? r.balance)],
      ["PO NO.", r => r.po_no], ["PO DATE", r => dateText(r.po_date)], ["SUPPLIER / PAYEE", r => r.supplier_payee], ["PO AMOUNT", r => reportMoney(r.po_amount)],
      ["AIR / FAR REFERENCE", r => r.air_far_reference], ["IAR NO.", r => r.iar_no], ["PAR NO.", r => r.par_no], ["ICS NO.", r => r.ics_no], ["RIS NO.", r => r.ris_no],
      ["PROCUREMENT STATUS", r => r.po_status], ["PROCUREMENT REMARKS", r => r.procurement_remarks], ["DB NO.", r => r.db_no], ["DV / PAYROLL NO.", r => r.dv_payroll_no],
      ["NOTICE OF ADJUSTMENT", r => r.notice_of_adjustment], ["ADJUSTMENT REASON", r => r.adjustment_reason], ["ACCOUNTING STATUS", r => r.accounting_status],
      ["REVIEWED BY", r => r.reviewed_by], ["REVIEW DATE / TIME", r => r.review_datetime ? dateText(r.review_datetime) : "—"], ["ACCOUNTING REMARKS", r => r.accounting_remarks],
      ["STATUS", r => r.status], ["ENTERED BY", r => r.created_by_name ? `${r.created_by_name} (${r.created_by_role || "User"})` : "—"], ["UPDATED BY", r => r.updated_by_name ? `${r.updated_by_name} (${r.updated_by_role || "User"})` : "—"]
    ];
    return <table className="w-full border-collapse whitespace-nowrap text-[9px]"><thead><tr className="bg-[#102b67] text-white">{allColumns.map(([label]) => <th key={label} className="!text-white border border-slate-300 p-2 text-left">{label}</th>)}</tr></thead><tbody>{reportRows.map((r, i) => <tr key={i}>{allColumns.map(([label, value]) => <td key={label} className="border border-slate-300 p-2">{value(r) ?? "—"}</td>)}</tr>)}</tbody></table>;
  };

  const renderOfficePrintTable = () => {
    const columns = isProcurement ? [
      ["REGISTRY NO.", r => r.registry_no || r.transaction_no], ["DATE", r => dateText(r.transaction_date)], ["PROGRAM / PROJECT", r => r.program_name || r.program_code], ["CAMPUS", r => r.campus_name || r.campus_code], ["PAYEE / NAME", r => r.payee], ["PARTICULARS", r => r.particulars || r.description], ["PO NO.", r => r.po_no], ["PO DATE", r => dateText(r.po_date)], ["SUPPLIER / PAYEE", r => r.supplier_payee], ["PO AMOUNT", r => reportMoney(r.po_amount)], ["AIR / FAR REFERENCE", r => r.air_far_reference], ["IAR NO.", r => r.iar_no], ["PAR NO.", r => r.par_no], ["ICS NO.", r => r.ics_no], ["RIS NO.", r => r.ris_no], ["PO STATUS", r => r.po_status], ["PROCUREMENT REMARKS", r => r.procurement_remarks]
    ] : [
      ["REGISTRY NO.", r => r.registry_no || r.transaction_no], ["DATE", r => dateText(r.transaction_date)], ["PROGRAM / PROJECT", r => r.program_name || r.program_code], ["PAYEE / NAME", r => r.payee], ["PARTICULARS", r => r.particulars || r.description], ["BURS SERIAL NO.", r => r.burs_serial_no], ["DB NO.", r => r.db_no], ["DV / PAYROLL NO.", r => r.dv_payroll_no], ["DISBURSEMENT DATE", r => dateText(r.disbursement_date)], ["DISBURSEMENT AMOUNT", r => reportMoney(r.disbursement_amount)], ["NOTICE OF ADJUSTMENT", r => r.notice_of_adjustment], ["ADJUSTMENT REASON", r => r.adjustment_reason], ["ACCOUNTING STATUS", r => r.accounting_status], ["REVIEWED BY", r => r.reviewed_by], ["REVIEW DATE / TIME", r => r.review_datetime ? dateText(r.review_datetime) : "—"], ["ACCOUNTING REMARKS", r => r.accounting_remarks]
    ];
    return <table className="w-full border-collapse whitespace-nowrap text-[9px]"><thead><tr>{columns.map(([label]) => <th key={label} className="border border-slate-300 p-2 text-left">{label}</th>)}</tr></thead><tbody>{reportRows.map((r, i) => <tr key={i}>{columns.map(([label, value]) => <td key={label} className="border border-slate-300 p-2">{value(r) ?? "—"}</td>)}</tr>)}</tbody></table>;
  };

  const renderReports = () => (
    <>
      <style>{`
        /* Keep the on-screen report preview at normal responsive size. */
        .igp-report-preview { image-rendering: auto; -webkit-font-smoothing: antialiased; }
        .igp-report-preview .igp-print-table table { width: 100%; border-collapse: collapse; }
        @media print {
          @page { size: A4 landscape; margin: 8mm; }
          html, body, #root { width: 100% !important; min-width: 0 !important; margin: 0 !important; padding: 0 !important; background: #fff !important; }
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body * { visibility: hidden !important; }
          .igp-print-area, .igp-print-area * { visibility: visible !important; }
          .igp-print-area {
            display: block !important;
            position: fixed !important;
            inset: 0 !important;
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
            background: #fff !important;
            color: #111827 !important;
            font-family: Arial, Helvetica, sans-serif !important;
            font-size: 9pt !important;
            line-height: 1.25 !important;
            box-sizing: border-box !important;
          }
          .igp-print-area header { margin-bottom: 7mm !important; padding-bottom: 3mm !important; }
          .igp-print-area header img { width: 15mm !important; height: 15mm !important; object-fit: contain !important; }
          .igp-print-area header p { font-size: 9pt !important; line-height: 1.25 !important; }
          .igp-print-area header p.font-extrabold { font-size: 11pt !important; }
          .igp-print-area header h1 { font-size: 13pt !important; line-height: 1.3 !important; }
          .igp-print-table { display: block !important; width: 100% !important; max-width: 100% !important; overflow: visible !important; }
          .igp-print-table table { width: 100% !important; max-width: 100% !important; table-layout: auto !important; border-collapse: collapse !important; font-size: 6pt !important; }
          .igp-print-table thead { display: table-header-group !important; }
          .igp-print-table tr { break-inside: avoid !important; page-break-inside: avoid !important; }
          .igp-print-table th, .igp-print-table td {
            font-size: 6pt !important;
            line-height: 1.15 !important;
            padding: 1mm 0.7mm !important;
            vertical-align: middle !important;
            border: 0.5pt solid #aab6c8 !important;
            color: #111827 !important;
            background: #fff !important;
          }
          /* Keep every printed data cell on a single line, matching the other BMAS reports. */
          .igp-print-table tbody td {
            white-space: nowrap !important;
            word-break: keep-all !important;
            overflow-wrap: normal !important;
          }
          /* Column headings may wrap when needed, but remain bold and plain white. */
          .igp-print-table thead th {
            white-space: normal !important;
            word-break: normal !important;
            overflow-wrap: normal !important;
            font-size: 6pt !important;
          }
          /* Printed report uses a plain white table header; only the column labels are bold. */
          .igp-print-table thead,
          .igp-print-table thead tr,
          .igp-print-table th,
          .igp-print-table th[class] {
            background: #fff !important;
            background-color: #fff !important;
            color: #111827 !important;
            -webkit-text-fill-color: #111827 !important;
            font-weight: 700 !important;
          }
          .igp-print-table td,
          .igp-print-table td[class] {
            background: #fff !important;
            background-color: #fff !important;
            color: #111827 !important;
            -webkit-text-fill-color: #111827 !important;
            font-weight: 400 !important;
          }
          /* Audit columns remain visible in the application but are excluded from printed reports. */
          .igp-print-table:not(.igp-office-print-table) th:nth-last-child(-n+2),
          .igp-print-table:not(.igp-office-print-table) td:nth-last-child(-n+2) { display: none !important; }
          .igp-print-area .grid { display: grid !important; grid-template-columns: 1fr 1fr !important; gap: 12mm !important; }
          .igp-print-area .mt-10 { margin-top: 12mm !important; }
          .igp-print-area .pt-5 { padding-top: 5mm !important; }
          * { box-shadow: none !important; text-shadow: none !important; }
        }
      `}</style>
      <BackBar title="IGP Reports / Export" onBack={backHome} />
      <div className="igp-screen-only space-y-3">
        {/* Filters are placed above the report, matching the full-width RBUD Reports & Export layout. */}
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <label className="block min-w-0">
              <span className="mb-1 block text-[10px] font-semibold text-slate-500">Report Type</span>
              <select
                value={reportType}
                onChange={e => loadReport(e.target.value)}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-[10px] text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              >
                {reportDefinitions.map(([key, title]) => <option key={key} value={key}>{title}</option>)}
              </select>
            </label>
            <label className="block min-w-0">
              <span className="mb-1 block text-[10px] font-semibold text-slate-500">Fund</span>
              <div className="flex min-h-[34px] w-full items-center rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-[10px] text-slate-600">IGP Fund 161</div>
            </label>
            <label className="block min-w-0">
              <span className="mb-1 block text-[10px] font-semibold text-slate-500">Fiscal Year</span>
              <div className="flex min-h-[34px] w-full items-center rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-[10px] text-slate-600">FY {fiscalYear}</div>
            </label>
          </div>
          <p className="mt-2 text-[9px] text-slate-400">{reportDefinitions.find(r => r[0] === reportType)?.[2] || "Select a report to preview or export."}</p>
        </div>
        <div className="w-full min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div><p className="text-[9px] font-bold uppercase text-slate-400">FY {fiscalYear} • FUND 161</p><h3 className="mt-1 text-lg font-extrabold text-[#10245b]">{reportTitle}</h3><p className="mt-1 text-[10px] text-slate-400">{reportRows.length.toLocaleString()} record{reportRows.length === 1 ? "" : "s"} in this report.</p></div>
            <div className="flex gap-2">
              <button type="button" onClick={printSelectedReport} disabled={reportLoading} className="rounded-lg bg-[#174fd1] px-4 py-2 text-[10px] font-bold text-white disabled:opacity-50"><Printer className="mr-1 inline h-3.5 w-3.5" />{reportLoading ? "Loading..." : "Print Report"}</button>
              <button type="button" onClick={exportCsv} className="rounded-lg border border-slate-200 px-4 py-2 text-[10px] font-bold text-slate-600"><Download className="mr-1 inline h-3.5 w-3.5" />Export CSV</button>
            </div>
          </div>
          <div className="igp-report-preview w-full min-w-0 rounded-md bg-white px-1 py-2 text-slate-900">
            <header className="mb-4 border-b border-slate-300 pb-3 text-center">
              <img src={`${window.location.origin}/UA_logo.jpg`} alt="University of Abra Logo" className="mx-auto mb-1 h-12 w-12 object-contain" />
              <p className="text-[10px]">Republic of the Philippines</p>
              <p className="mt-0.5 text-xs font-extrabold">UNIVERSITY OF ABRA</p>
              <p className="mt-0.5 text-[10px]">BUDGET MONITORING AND ALLOCATION SYSTEM</p>
              <h2 className="mt-2 text-sm font-extrabold">{reportTitle}</h2>
              <p className="mt-1 text-[10px] text-slate-600">Fiscal Year {fiscalYear} • IGP Fund 161</p>
            </header>
            <div className="igp-print-table w-full overflow-x-auto">
              {reportLoading ? <div className="p-8 text-center text-[10px] text-slate-400">Preparing report...</div> : reportRows.length ? renderReportTable() : <div className="p-8 text-center text-[10px] text-slate-400">No records found for this report.</div>}
            </div>
            <div className="mt-10 grid grid-cols-2 gap-8 px-2 text-center text-[9px] text-slate-800">
              <div className="pt-5"><div className="border-t border-slate-600 pt-2 font-bold">Prepared by</div><p className="mt-0.5 text-[8px]">Signature over printed name / Date</p></div>
              <div className="pt-5"><div className="border-t border-slate-600 pt-2 font-bold">Certified Correct / Approved by</div><p className="mt-0.5 text-[8px]">Signature over printed name / Date</p></div>
            </div>
          </div>
        </div>
      </div>

      <div className="igp-print-area hidden print:block">
        <header className="mb-4 border-b border-slate-400 pb-3 text-center">
          <img src={`${window.location.origin}/UA_logo.jpg`} alt="University of Abra Logo" className="mx-auto mb-1 h-12 w-12 object-contain" />
          <p className="text-[9px]">Republic of the Philippines</p>
          <p className="mt-0.5 text-[11px] font-extrabold">UNIVERSITY OF ABRA</p>
          <p className="mt-0.5 text-[9px]">BUDGET MONITORING AND ALLOCATION SYSTEM</p>
          <h1 className="mt-2 text-sm font-extrabold">{reportTitle}</h1>
          <p className="mt-1 text-[9px]">Fiscal Year {fiscalYear} • IGP Fund 161</p>
        </header>
        <div className={`igp-print-table ${canEditOfficeTransactions ? "igp-office-print-table" : ""}`}>{canEditOfficeTransactions ? renderOfficePrintTable() : renderReportTable()}</div>
        <div className="mt-10 grid grid-cols-2 gap-8 text-center text-[9px]">
          <div className="pt-5"><div className="border-t border-slate-500 pt-2 font-bold">Prepared by</div><p className="mt-0.5 text-[8px]">Signature over printed name / Date</p></div>
          <div className="pt-5"><div className="border-t border-slate-500 pt-2 font-bold">Certified Correct / Approved by</div><p className="mt-0.5 text-[8px]">Signature over printed name / Date</p></div>
        </div>
      </div>
    </>
  );

  if (!canViewIgp) {
    return (
      <Layout user={user} onLogout={onLogout} onNavigate={onNavigate} activePath={activePath || "/igp/overview"}>
      <style>{`
        .registry-action-buttons { display:flex; flex-wrap:nowrap; align-items:center; gap:6px; width:max-content; min-width:max-content; }
        .registry-action-buttons > button { display:inline-flex; flex:0 0 32px; width:32px; min-width:32px; height:32px; align-items:center; justify-content:center; visibility:visible; opacity:1; }
        .registry-action-buttons > button svg { display:block; flex:0 0 16px; width:16px; height:16px; min-width:16px; min-height:16px; visibility:visible; opacity:1; }
        @media (max-width: 768px) {
          .registry-action-buttons { gap:5px; padding:2px 0; }
          .registry-action-buttons > button { flex-basis:34px; width:34px; min-width:34px; height:34px; }
        }
      `}</style>
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
      <style>{`
        .igp-registry, .igp-registry * { box-sizing: border-box; min-width: 0; }
        .igp-registry input, .igp-registry select, .igp-registry textarea { max-width: 100%; width: 100%; }
        .igp-registry .grid > *, .igp-registry fieldset, .igp-registry .office-fields { min-width: 0; max-width: 100%; }
        .igp-registry { width: 100%; max-width: 100%; overflow-x: clip; }
        @media (max-width: 768px) {
          .igp-registry { padding-left: 10px; padding-right: 10px; }
          .igp-registry .office-fields { padding: 10px; }
          .igp-registry input, .igp-registry select, .igp-registry textarea { font-size: 14px; }
        }
      `}</style>
      <div className="igp-registry min-h-full bg-[#f7faff] pb-8">
        {error && <div className="mb-4 flex items-center justify-between rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-[10px] text-red-700"><span>{error}</span><button type="button" onClick={() => setError("")}><X className="h-4 w-4" /></button></div>}

        {canEditOfficeTransactions ? (
          <>
            {view === "reports" ? (
              renderReports()
            ) : (
              <>
                <div className="mb-3 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-[10px] font-semibold text-blue-800">
                  Role access: {role} — IGP Transactions and Reports / Export. You can update only the transaction fields assigned to your role.
                </div>
                {renderTransactions()}
              </>
            )}
          </>
        ) : (
          <>
            {view === "module" && renderModuleHome()}
            {view === "budget" && renderModuleHome()}
            {view === "programs" && renderPrograms()}
            {view === "transactions" && renderTransactions()}
            {view === "monitoring" && renderMonitoring()}
            {view === "reports" && renderReports()}
          </>
        )}

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

        {programView && (
          <Modal title={`View IGP Program / Project — ${programView.program_code || "Fund 161"}`} onClose={() => setProgramView(null)} wide>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                ["Program Code", programView.program_code],
                ["Program / Project", programView.program_name],
                ["Description", programView.description],
                ["Fund Cluster", programView.fund_cluster_code],
                ["WFP Source", programView.wfp_source_code_master || programView.wfp_source_code],
                ["Campus", programView.campus_name || programView.campus_code],
                ["Responsibility Center", programView.responsibility_center_code],
                ["Beginning Balance", money(programView.beginning_balance)],
                ["Projected Income", money(programView.projected_income)],
                ["Approved Budget", money(programView.approved_budget ?? programView.allocation_amount)],
                ["Collection", money(programView.income)],
                ["Utilization", money(programView.utilization)],
                ["Balance", money(programView.balance)],
                ["Status", programView.status],
                ["Entered By", programView.created_by_name ? `${programView.created_by_name}${programView.created_by_role ? ` (${programView.created_by_role})` : ""}` : "—"],
                ["Updated By", programView.updated_by_name ? `${programView.updated_by_name}${programView.updated_by_role ? ` (${programView.updated_by_role})` : ""}` : "—"],
              ].map(([label, value]) => <div key={label} className="rounded-lg border border-slate-200 bg-slate-50 p-3"><p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 break-words text-[11px] font-semibold text-slate-700">{value ?? "—"}</p></div>)}
            </div>
          </Modal>
        )}

        {programModal && (
          <Modal title={programModal === "edit" ? "Edit IGP Program / Project" : "Add IGP Program / Project"} onClose={() => setProgramModal(null)} wide>
            <ProgramForm form={programForm} setForm={setProgramForm} references={references} saving={saving} onSubmit={submitProgram} onClose={() => setProgramModal(null)} error={error} />
          </Modal>
        )}

        {transactionView && (
          <Modal title="View IGP Transaction" onClose={() => setTransactionView(null)} wide>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                ["Registry No.", transactionView.registry_no || transactionView.transaction_no],
                ["Date", dateText(transactionView.transaction_date)],
                ["IGP Program / Project", transactionView.program_name || transactionView.program_code],
                ["Transaction Type", transactionView.transaction_type],
                ["Fund Cluster", transactionView.fund_cluster_code],
                ["Fund Code / IGP", transactionView.program_code],
                ["Campus", transactionView.campus_code || transactionView.campus_name],
                ["BURS Serial No.", transactionView.burs_serial_no],
                ["Payee / Name", transactionView.payee],
                ["Particulars", transactionView.particulars],
                ["Responsibility Center", transactionView.responsibility_center_code],
                ["Reference No.", transactionView.reference_no],
                ["Income", money(transactionView.income_amount)],
                ["Utilization", money(transactionView.utilization_amount)],
                ["Unpaid", money(transactionView.unpaid_utilization)],
                ["Balance", money(transactionView.running_balance)],
                ["Status", transactionView.status],
                ["Entered By", transactionView.created_by_name || transactionView.entered_by || "—"],
                ["Updated By", transactionView.updated_by_name || transactionView.updated_by || "—"],
              ].map(([label, value]) => <div key={label} className="rounded-lg border border-slate-200 bg-slate-50 p-3"><p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 break-words text-[11px] font-semibold text-slate-700">{value ?? "—"}</p></div>)}
            </div>
            <div className="mt-5 flex justify-end"><button type="button" onClick={() => setTransactionView(null)} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-[10px] font-bold text-slate-600 hover:bg-slate-50">Close</button></div>
          </Modal>
        )}

        {auditModal && (
          <Modal title={`Audit Trail — ${auditModal.registry_no || auditModal.program_code || "IGP Record"}`} onClose={() => setAuditModal(null)} wide>
            <p className="mb-3 text-[10px] text-slate-500">History of recorded actions, including who made changes and the previous and new values when available.</p>
            {auditLoading ? <div className="py-10 text-center text-[11px] text-slate-500">Loading audit trail…</div> : auditRows.length ? <div className="space-y-3">
              {auditRows.map((item) => {
                const oldValues = item.old_values && typeof item.old_values === "object" ? item.old_values : {};
                const newValues = item.new_values && typeof item.new_values === "object" ? item.new_values : {};
                const explicitFields = Array.isArray(item.changed_fields) ? item.changed_fields : [];
                const fields = explicitFields.length ? explicitFields : [...new Set([...Object.keys(oldValues), ...Object.keys(newValues)])];
                const fieldLabel = (key) => ({ registry_no: "Registry No.", transaction_date: "Date", program_code: "Fund Code / IGP", program_name: "IGP Program / Project", fund_cluster_code: "Fund Cluster", campus_code: "Campus", burs_serial_no: "BURS Serial No.", payee: "Payee / Name", particulars: "Particulars", responsibility_center_code: "Responsibility Center", reference_no: "Reference No.", income_amount: "Income", utilization_amount: "Utilization", unpaid_utilization: "Unpaid Utilization", running_balance: "Balance", status: "Status", beginning_balance: "Beginning Balance", projected_income: "Projected Income", approved_budget: "Approved Budget" }[key] || String(key || "").replaceAll("_", " ").replace(/\b\w/g, c => c.toUpperCase()));
                const actionLabel = ({ CREATE: "Record Created", INSERT: "Record Created", UPDATE: "Record Updated", DELETE: "Record Deleted" })[String(item.action || "").toUpperCase()] || String(item.action || "Audit Activity").replaceAll("_", " ");
                const actor = item.performed_by_name || item.full_name || item.username || item.user_name || "System Administrator";
                const actorRole = item.performed_by_role || item.role || "—";
                return <div key={item.id || `${item.created_at}-${item.action}`} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                  <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-2"><div><p className="text-[11px] font-extrabold text-[#102b67]">{actionLabel}</p><p className="text-[9px] text-slate-500">{item.created_at ? new Date(item.created_at).toLocaleString() : "—"}</p></div><div className="text-right"><p className="text-[10px] font-bold text-slate-700">{actor}</p><p className="text-[9px] text-slate-500">{actorRole}</p></div></div>
                  {fields.length ? <div className="mt-2 space-y-1">{fields.map((key) => { const oldValue = oldValues[key]; const newValue = newValues[key]; const show = value => value == null || value === "" ? "—" : typeof value === "object" ? JSON.stringify(value, null, 2) : String(value); return <div key={key} className="grid grid-cols-1 gap-2 rounded-lg bg-slate-50 p-2 md:grid-cols-3"><div><p className="text-[8px] font-bold uppercase tracking-wide text-slate-400">Field</p><p className="break-words text-[9px] font-bold text-[#102b67]">{fieldLabel(key)}</p></div><div><p className="text-[8px] font-bold uppercase tracking-wide text-slate-400">Previous Value</p><p className="whitespace-pre-wrap break-words text-[9px] text-slate-700">{show(oldValue)}</p></div><div><p className="text-[8px] font-bold uppercase tracking-wide text-slate-400">New Value</p><p className="whitespace-pre-wrap break-words text-[9px] font-semibold text-slate-800">{show(newValue)}</p></div></div>; })}</div> : <p className="mt-2 text-[9px] text-slate-400">No field-level changes recorded.</p>}
                </div>;
              })}
            </div> : <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-[11px] text-slate-500">No audit records were found for this record. Only actions recorded in the audit log can be shown here.</div>}
            <div className="mt-5 flex justify-end"><button type="button" onClick={() => setAuditModal(null)} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-[10px] font-bold text-slate-600 hover:bg-slate-50">Close</button></div>
          </Modal>
        )}

        {transactionModal && (
          <Modal title={transactionModal === "edit" ? "Edit IGP Transaction — Fund 161" : "Add IGP RBUD Transaction — Fund 161"} onClose={() => { setTransactionModal(null); setSelectedTransaction(null); }} wide>
            <TransactionForm form={transactionForm} setForm={setTransactionForm} programs={programs} references={references} saving={saving} onSubmit={submitTransaction} onClose={() => setTransactionModal(null)} allowedTransactionTypes={allowedTransactionTypes} role={role} error={error} />
          </Modal>
        )}
      </div>
    </Layout>
  );
}