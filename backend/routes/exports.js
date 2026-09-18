const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

// University of Abra logo used in generated PDF and Excel documents.
// Expected project location: frontend/public/UA_logo.jpg
const UA_LOGO_PATH = path.resolve(__dirname, '../../frontend/public/UA_logo.jpg');
const hasUALogo = () => fs.existsSync(UA_LOGO_PATH);

const pool = new Pool({
  user: process.env.PGUSER || 'postgres',
  host: process.env.PGHOST || 'localhost',
  database: process.env.PGDATABASE || 'bmas_db',
  password: process.env.PGPASSWORD || '12345678',
  port: Number(process.env.PGPORT || 5432),
});

const REPORTS = [
  { key: 'far-1', name: 'FAR 1', category: 'FAR', type: 'FAR', registry: 'RAOD', description: 'Status of Allotments, Obligations and Balances', sheetName: 'FAR 1 worksheet', formats: ['Excel', 'PDF', 'Print'] },
  { key: 'far-1a', name: 'FAR 1a', category: 'FAR', type: 'FAR', registry: 'RAOD', description: 'Financial Accountability Report 1a', sheetName: 'FAR 1a worksheet', formats: ['Excel', 'PDF', 'Print'] },
  { key: 'far-2', name: 'FAR 2', category: 'FAR', type: 'FAR', registry: 'RBUD', description: 'Summary of Approved Budget, Utilizations and Balances', sheetName: 'FAR 2 worksheet', formats: ['Excel', 'PDF', 'Print'] },
  { key: 'far-2a', name: 'FAR 2a', category: 'FAR', type: 'FAR', registry: 'RBUD', description: 'Financial Accountability Report 2a', sheetName: 'FAR 2a worksheet', formats: ['Excel', 'PDF', 'Print'] },
  { key: 'far-1-main', name: 'FAR 1 - Main Fund', category: 'FAR', type: 'FAR', registry: 'RAOD', description: 'FAR 1 for Main Fund', sheetName: 'FAR 1 - Main Fund', formats: ['Excel', 'PDF', 'Print'] },
  { key: 'far-1-bgd', name: 'FAR 1 - BGD', category: 'FAR', type: 'FAR', registry: 'RAOD', description: 'FAR 1 for BGD Fund', sheetName: 'FAR 1 - BGD', formats: ['Excel', 'PDF', 'Print'] },
  { key: 'far-1-ched', name: 'FAR 1 - CHED', category: 'FAR', type: 'FAR', registry: 'RAOD', description: 'FAR 1 for CHED Fund', sheetName: 'FAR 1 - CHED', formats: ['Excel', 'PDF', 'Print'] },
  { key: 'far-1-dost', name: 'FAR 1 - DOST', category: 'FAR', type: 'FAR', registry: 'RAOD', description: 'FAR 1 for DOST Fund', sheetName: 'FAR 1 - DOST', formats: ['Excel', 'PDF', 'Print'] },
  { key: 'far-1-da', name: 'FAR 1 - DA', category: 'FAR', type: 'FAR', registry: 'RAOD', description: 'FAR 1 for DA Fund', sheetName: 'FAR 1 - DA', formats: ['Excel', 'PDF', 'Print'] },
  { key: 'far-1-lapaz', name: 'FAR 1 - LAPAZ', category: 'FAR', type: 'FAR', registry: 'RAOD', description: 'FAR 1 for LAPAZ Fund', sheetName: 'FAR 1 - LAPAZ', formats: ['Excel', 'PDF', 'Print'] },
  { key: 'far-2-2a-merge', name: 'FAR 2 & 2A Merge', category: 'FAR', type: 'FAR', registry: 'RBUD', description: 'Combined FAR 2 and FAR 2a reporting structure', sheetName: 'FAR 2 & 2A Merge', formats: ['Excel', 'PDF', 'Print'] },
  { key: 'saronca', name: 'SARONCA', category: 'FAR', type: 'FAR', registry: 'RBUD', description: 'SARONCA reporting sheet', sheetName: 'SARONCA', formats: ['Excel', 'PDF', 'Print'] },
  { key: 'wfp-balance', name: 'WFP Balance', category: 'WFP', type: 'WFP', registry: 'RAOD/RBUD', description: 'Work and Financial Plan Balance', sheetName: 'WFP Balance', formats: ['Excel', 'PDF', 'Print'] },
  { key: 'wfp', name: 'Work and Financial Plan', category: 'WFP', type: 'WFP', registry: 'RAOD/RBUD', description: 'Work and Financial Plan report', sheetName: 'WFP', formats: ['Excel', 'PDF', 'Print'] },
  { key: 'print-main', name: 'Print 164 - Main', category: 'PRINT', type: 'Print', registry: 'RAOD', description: 'Main fund print sheet', sheetName: 'Print 164 Main', formats: ['Excel', 'PDF', 'Print'] },
  { key: 'print-bgd', name: 'Print 164 - BGD', category: 'PRINT', type: 'Print', registry: 'RAOD', description: 'BGD fund print sheet', sheetName: 'Print 164 BGD', formats: ['Excel', 'PDF', 'Print'] },
  { key: 'print-ched', name: 'Print 164 - CHED', category: 'PRINT', type: 'Print', registry: 'RAOD', description: 'CHED fund print sheet', sheetName: 'Print 164 CHED', formats: ['Excel', 'PDF', 'Print'] },
  { key: 'print-dost', name: 'Print 164 - DOST', category: 'PRINT', type: 'Print', registry: 'RAOD', description: 'DOST fund print sheet', sheetName: 'Print 164 DOST', formats: ['Excel', 'PDF', 'Print'] },
  { key: 'print-da', name: 'Print 164 - DA', category: 'PRINT', type: 'Print', registry: 'RAOD', description: 'DA fund print sheet', sheetName: 'Print 164 DA', formats: ['Excel', 'PDF', 'Print'] },
  { key: 'print-lapaz', name: 'Print 164 - LAPAZ', category: 'PRINT', type: 'Print', registry: 'RAOD', description: 'LAPAZ fund print sheet', sheetName: 'Print 164 LAPAZ', formats: ['Excel', 'PDF', 'Print'] },
  { key: 'breakdown', name: 'Breakdown Report', category: 'OTHER', type: 'Breakdown', registry: 'RAOD/RBUD', description: 'Breakdown of registry financial values', sheetName: 'Breakdown', formats: ['Excel', 'PDF', 'Print'] },
  { key: 'summary', name: 'Summary Report', category: 'OTHER', type: 'Summary', registry: 'RAOD/RBUD', description: 'Summary of registry financial values', sheetName: 'Summary', formats: ['Excel', 'PDF', 'Print'] },
  { key: 'budget-utilization', name: 'Budget Utilization Report', category: 'OTHER', type: 'Summary', registry: 'RBUD/RAOD', description: 'Budget utilization and remaining balance', sheetName: 'Budget Utilization', formats: ['Excel', 'PDF', 'Print'] },
];

const REPORT_MAP = new Map(REPORTS.map((report) => [report.key, report]));

const safeNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const money = (value) => safeNumber(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const cleanFileName = (value) => String(value || 'report').replace(/[<>:"/\\|?*]+/g, '_').trim() || 'report';

const getReport = (key) => REPORT_MAP.get(String(key || '').trim());

async function tableExists(name) {
  const result = await pool.query(`SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=$1) AS exists`, [name]);
  return Boolean(result.rows[0]?.exists);
}

async function getYears() {
  const sets = [];
  for (const table of ['budget_items', 'raod_entries', 'rbud_entries']) {
    if (await tableExists(table)) sets.push(`SELECT fiscal_year AS year FROM ${table} WHERE fiscal_year IS NOT NULL`);
  }
  if (!sets.length) return [new Date().getFullYear()];
  const result = await pool.query(`SELECT DISTINCT year FROM (${sets.join(' UNION ALL ')}) y ORDER BY year DESC`);
  return result.rows.map((r) => Number(r.year));
}

async function getReferences() {
  const [years, fundSources, fundClusters, departments] = await Promise.all([
    getYears(),
    tableExists('fund_sources').then(async (exists) => exists ? (await pool.query(`SELECT id, code, name FROM fund_sources WHERE is_active=true ORDER BY code`)).rows : []),
    tableExists('fund_clusters').then(async (exists) => exists ? (await pool.query(`SELECT id, code, name FROM fund_clusters WHERE is_active=true ORDER BY code`)).rows : []),
    tableExists('responsibility_centers').then(async (exists) => exists ? (await pool.query(`SELECT id, code, name FROM responsibility_centers WHERE COALESCE(is_active,true)=true ORDER BY name`)).rows : []),
  ]);
  const fundGroups = [];
  const seen = new Set();
  for (const item of [...fundSources, ...fundClusters]) {
    const code = String(item.code || '').toUpperCase();
    const known = ['MAIN', 'BGD', 'CHED', 'DOST', 'DA', 'LAPAZ', 'OTHER', 'OF'];
    const match = known.find((x) => code.includes(x));
    if (match && !seen.has(match)) { seen.add(match); fundGroups.push({ id: match, code: match, name: match === 'OF' ? 'Other Funds' : match === 'MAIN' ? 'Main Fund' : `${match} Fund` }); }
  }
  return { years: years.length ? years : [new Date().getFullYear()], fundSources, fundClusters, departments, fundGroups };
}

function addFilters(conditions, params, alias, filters, dateColumn = 'entry_date') {
  conditions.push(`${alias}.fiscal_year = $${params.length + 1}`);
  params.push(Number(filters.fiscal_year) || new Date().getFullYear());
  if (filters.fund_cluster_id) { conditions.push(`${alias}.fund_cluster_id = $${params.length + 1}`); params.push(Number(filters.fund_cluster_id)); }
  if (filters.fund_source_id) { conditions.push(`${alias}.fund_source_id = $${params.length + 1}`); params.push(Number(filters.fund_source_id)); }
  if (filters.department) { conditions.push(`${alias}.responsibility_center_id = $${params.length + 1}`); params.push(Number(filters.department)); }
  if (filters.start_date) { conditions.push(`${alias}.${dateColumn} >= $${params.length + 1}`); params.push(filters.start_date); }
  if (filters.end_date) { conditions.push(`${alias}.${dateColumn} <= $${params.length + 1}`); params.push(filters.end_date); }
}

function periodDates(year, period) {
  const y = Number(year) || new Date().getFullYear();
  const p = String(period || 'annual').toLowerCase();
  if (p === 'q1') return [`${y}-01-01`, `${y}-03-31`];
  if (p === 'q2') return [`${y}-04-01`, `${y}-06-30`];
  if (p === 'q3') return [`${y}-07-01`, `${y}-09-30`];
  if (p === 'q4') return [`${y}-10-01`, `${y}-12-31`];
  return [`${y}-01-01`, `${y}-12-31`];
}

async function getRAODRows(filters, detailed = false) {
  if (!(await tableExists('raod_entries'))) return [];
  const params = [];
  const conditions = [];
  addFilters(conditions, params, 'r', filters);
  const [start, end] = periodDates(filters.fiscal_year, filters.period);
  conditions.push(`r.entry_date BETWEEN $${params.length + 1} AND $${params.length + 2}`); params.push(start, end);
  const fundGroup = filters.fund_group;
  if (fundGroup) { conditions.push(`(UPPER(COALESCE(fs.code,'')) LIKE $${params.length + 1} OR UPPER(COALESCE(fc.code,'')) LIKE $${params.length + 1} OR UPPER(COALESCE(fs.name,'')) LIKE $${params.length + 1} OR UPPER(COALESCE(fc.name,'')) LIKE $${params.length + 1})`); params.push(`%${String(fundGroup).toUpperCase()}%`); }
  const select = detailed
    ? `r.registry_no, r.entry_date, COALESCE(fc.code,'') AS fund_cluster, COALESCE(fs.code,'') AS fund_source, COALESCE(rc.code,'') AS responsibility_center, COALESCE(u.code,'') AS uacs_code, COALESCE(u.account_title,'') AS account_title, COALESCE(r.payee,'') AS payee, COALESCE(r.particulars,'') AS particulars, r.allotment_amount, r.obligation_amount, r.disbursement_amount, (r.allotment_amount-r.obligation_amount) AS balance`
    : `COALESCE(u.code,'') AS uacs_code, COALESCE(u.account_title,'') AS account_title, COALESCE(r.particulars,'') AS particulars, SUM(r.allotment_amount) AS allotment, SUM(r.obligation_amount) AS obligation, SUM(r.disbursement_amount) AS disbursement, SUM(r.allotment_amount-r.obligation_amount) AS balance`;
  const group = detailed ? '' : `GROUP BY u.code, u.account_title, r.particulars`;
  const order = detailed ? 'r.entry_date, r.registry_no' : 'u.code, r.particulars';
  const result = await pool.query(`SELECT ${select} FROM raod_entries r LEFT JOIN fund_clusters fc ON fc.id=r.fund_cluster_id LEFT JOIN fund_sources fs ON fs.id=r.fund_source_id LEFT JOIN responsibility_centers rc ON rc.id=r.responsibility_center_id LEFT JOIN uacs_codes u ON u.id=r.uacs_code_id WHERE ${conditions.join(' AND ')} ${group} ORDER BY ${order} LIMIT 2000`, params);
  return result.rows;
}

async function getRBUDRows(filters, detailed = false) {
  if (!(await tableExists('rbud_entries'))) return [];
  const params = [];
  const conditions = [];
  addFilters(conditions, params, 'r', filters);
  const [start, end] = periodDates(filters.fiscal_year, filters.period);
  conditions.push(`r.entry_date BETWEEN $${params.length + 1} AND $${params.length + 2}`); params.push(start, end);
  const fundGroup = filters.fund_group;
  if (fundGroup) { conditions.push(`(UPPER(COALESCE(fs.code,'')) LIKE $${params.length + 1} OR UPPER(COALESCE(fc.code,'')) LIKE $${params.length + 1} OR UPPER(COALESCE(fs.name,'')) LIKE $${params.length + 1} OR UPPER(COALESCE(fc.name,'')) LIKE $${params.length + 1})`); params.push(`%${String(fundGroup).toUpperCase()}%`); }
  const select = detailed
    ? `r.registry_no, r.entry_date, COALESCE(fc.code,'') AS fund_cluster, COALESCE(fs.code,'') AS fund_source, COALESCE(rc.code,'') AS responsibility_center, COALESCE(u.code,'') AS uacs_code, COALESCE(u.account_title,'') AS account_title, COALESCE(r.payee,'') AS payee, COALESCE(r.particulars,'') AS particulars, r.utilization_amount, r.disbursement_amount, r.unpaid_utilization, r.running_balance`
    : `COALESCE(u.code,'') AS uacs_code, COALESCE(u.account_title,'') AS account_title, COALESCE(r.particulars,'') AS particulars, SUM(r.utilization_amount) AS approved_budget, SUM(r.utilization_amount) AS utilization, SUM(r.disbursement_amount) AS disbursement, SUM(r.utilization_amount-r.disbursement_amount) AS balance`;
  const group = detailed ? '' : `GROUP BY u.code, u.account_title, r.particulars`;
  const order = detailed ? 'r.entry_date, r.registry_no' : 'u.code, r.particulars';
  const result = await pool.query(`SELECT ${select} FROM rbud_entries r LEFT JOIN fund_clusters fc ON fc.id=r.fund_cluster_id LEFT JOIN fund_sources fs ON fs.id=r.fund_source_id LEFT JOIN responsibility_centers rc ON rc.id=r.responsibility_center_id LEFT JOIN uacs_codes u ON u.id=r.uacs_code_id WHERE ${conditions.join(' AND ')} ${group} ORDER BY ${order} LIMIT 2000`, params);
  return result.rows;
}

async function getBudgetTotal(filters) {
  if (!(await tableExists('budget_items'))) return 0;
  const params = [Number(filters.fiscal_year) || new Date().getFullYear()];
  const conditions = ['b.fiscal_year=$1'];
  if (filters.fund_cluster_id) { conditions.push(`b.fund_cluster_id=$${params.length + 1}`); params.push(Number(filters.fund_cluster_id)); }
  if (filters.fund_source_id) { conditions.push(`b.fund_source_id=$${params.length + 1}`); params.push(Number(filters.fund_source_id)); }
  if (filters.department) { conditions.push(`b.responsibility_center_id=$${params.length + 1}`); params.push(Number(filters.department)); }
  const result = await pool.query(`SELECT COALESCE(SUM(b.approved_budget),0) AS total FROM budget_items b WHERE ${conditions.join(' AND ')}`, params);
  return safeNumber(result.rows[0]?.total);
}

async function buildPreview(report, filters) {
  const base = { report: report.name, context: 'All Funds', columns: [], rows: [], totals: null };
  if (filters.fund_group) base.context = filters.fund_group;
  else if (filters.fund_cluster_id) base.context = 'Selected Fund Cluster';
  else if (filters.fund_source_id) base.context = 'Selected Fund Source';

  if (report.registry === 'RAOD' || report.key.startsWith('far-1') || report.key.startsWith('print-')) {
    const detailed = report.key === 'far-1a' || report.key.startsWith('print-');
    const data = await getRAODRows(filters, detailed);
    if (detailed) {
      base.columns = [
        { key: 'registry_no', label: 'Registry No.' }, { key: 'entry_date', label: 'Date' }, { key: 'fund_cluster', label: 'Fund Cluster' },
        { key: 'uacs_code', label: 'UACS Code' }, { key: 'particulars', label: 'Particulars' }, { key: 'payee', label: 'Payee' },
        { key: 'allotment_amount', label: 'Allotment' }, { key: 'obligation_amount', label: 'Obligation' }, { key: 'disbursement_amount', label: 'Disbursement' }, { key: 'balance', label: 'Balance' },
      ];
      base.rows = data.map((r) => ({ ...r, entry_date: r.entry_date ? new Date(r.entry_date).toLocaleDateString('en-US') : '', allotment_amount: money(r.allotment_amount), obligation_amount: money(r.obligation_amount), disbursement_amount: money(r.disbursement_amount), balance: money(r.balance) }));
    } else {
      base.columns = [
        { key: 'particulars', label: 'Particulars' }, { key: 'uacs_code', label: 'UACS Code' }, { key: 'allotment', label: 'Allotment' },
        { key: 'obligation', label: 'Obligation' }, { key: 'disbursement', label: 'Disbursement' }, { key: 'balance', label: 'Balance' },
      ];
      base.rows = data.map((r) => ({ ...r, allotment: money(r.allotment), obligation: money(r.obligation), disbursement: money(r.disbursement), balance: money(r.balance) }));
      base.totals = { particulars: 'TOTAL', allotment: money(data.reduce((s, r) => s + safeNumber(r.allotment), 0)), obligation: money(data.reduce((s, r) => s + safeNumber(r.obligation), 0)), disbursement: money(data.reduce((s, r) => s + safeNumber(r.disbursement), 0)), balance: money(data.reduce((s, r) => s + safeNumber(r.balance), 0)) };
    }
    return base;
  }

  if (report.registry === 'RBUD' || report.key.startsWith('far-2') || report.key === 'saronca') {
    const detailed = report.key === 'far-2a';
    const data = await getRBUDRows(filters, detailed);
    if (detailed) {
      base.columns = [{ key: 'registry_no', label: 'Registry No.' }, { key: 'entry_date', label: 'Date' }, { key: 'uacs_code', label: 'UACS Code' }, { key: 'particulars', label: 'Particulars' }, { key: 'payee', label: 'Payee' }, { key: 'utilization_amount', label: 'Utilization' }, { key: 'disbursement_amount', label: 'Disbursement' }, { key: 'unpaid_utilization', label: 'Unpaid' }, { key: 'running_balance', label: 'Balance' }];
      base.rows = data.map((r) => ({ ...r, entry_date: r.entry_date ? new Date(r.entry_date).toLocaleDateString('en-US') : '', utilization_amount: money(r.utilization_amount), disbursement_amount: money(r.disbursement_amount), unpaid_utilization: money(r.unpaid_utilization), running_balance: money(r.running_balance) }));
    } else {
      base.columns = [{ key: 'particulars', label: 'Particulars' }, { key: 'uacs_code', label: 'UACS Code' }, { key: 'approved_budget', label: 'Approved Budget' }, { key: 'utilization', label: 'Utilization' }, { key: 'disbursement', label: 'Disbursement' }, { key: 'balance', label: 'Balance' }];
      base.rows = data.map((r) => ({ ...r, approved_budget: money(r.approved_budget), utilization: money(r.utilization), disbursement: money(r.disbursement), balance: money(r.balance) }));
      base.totals = { particulars: 'TOTAL', approved_budget: money(data.reduce((s, r) => s + safeNumber(r.approved_budget), 0)), utilization: money(data.reduce((s, r) => s + safeNumber(r.utilization), 0)), disbursement: money(data.reduce((s, r) => s + safeNumber(r.disbursement), 0)), balance: money(data.reduce((s, r) => s + safeNumber(r.balance), 0)) };
    }
    return base;
  }

  if (report.key === 'wfp-balance' || report.key === 'wfp') {
    const budget = await getBudgetTotal(filters);
    const raod = await getRAODRows(filters, false);
    const rbud = await getRBUDRows(filters, false);
    const obligation = raod.reduce((s, r) => s + safeNumber(r.obligation), 0);
    const utilization = rbud.reduce((s, r) => s + safeNumber(r.utilization), 0);
    const disbursement = raod.reduce((s, r) => s + safeNumber(r.disbursement), 0) + rbud.reduce((s, r) => s + safeNumber(r.disbursement), 0);
    base.columns = [{ key: 'particulars', label: 'Particulars' }, { key: 'approved_budget', label: 'Approved Budget' }, { key: 'utilization', label: 'Utilization / Obligation' }, { key: 'disbursement', label: 'Disbursement' }, { key: 'balance', label: 'Balance' }];
    base.rows = [{ particulars: 'Approved Budget', approved_budget: money(budget), utilization: money(utilization + obligation), disbursement: money(disbursement), balance: money(budget - utilization - obligation) }];
    base.totals = { particulars: 'TOTAL', approved_budget: money(budget), utilization: money(utilization + obligation), disbursement: money(disbursement), balance: money(budget - utilization - obligation) };
    return base;
  }

  const [raod, rbud, budget] = await Promise.all([getRAODRows(filters, false), getRBUDRows(filters, false), getBudgetTotal(filters)]);
  const obligation = raod.reduce((s, r) => s + safeNumber(r.obligation), 0);
  const raodDisbursement = raod.reduce((s, r) => s + safeNumber(r.disbursement), 0);
  const utilization = rbud.reduce((s, r) => s + safeNumber(r.utilization), 0);
  const rbudDisbursement = rbud.reduce((s, r) => s + safeNumber(r.disbursement), 0);
  const disbursement = raodDisbursement + rbudDisbursement;
  base.columns = [{ key: 'particulars', label: 'Particulars' }, { key: 'amount', label: 'Amount' }, { key: 'percentage', label: 'Percentage' }];
  const rows = [
    { particulars: 'Approved Budget', amount: budget, percentage: budget ? '100.00%' : '0.00%' },
    { particulars: 'RAOD Obligations', amount: obligation, percentage: budget ? `${((obligation / budget) * 100).toFixed(2)}%` : '0.00%' },
    { particulars: 'RBUD Utilization', amount: utilization, percentage: budget ? `${((utilization / budget) * 100).toFixed(2)}%` : '0.00%' },
    { particulars: 'Disbursement', amount: disbursement, percentage: budget ? `${((disbursement / budget) * 100).toFixed(2)}%` : '0.00%' },
    { particulars: 'Remaining Balance', amount: budget - obligation - utilization, percentage: budget ? `${(((budget - obligation - utilization) / budget) * 100).toFixed(2)}%` : '0.00%' },
  ];
  base.rows = rows.map((r) => ({ ...r, amount: money(r.amount) }));
  base.totals = { particulars: 'TOTAL', amount: money(budget), percentage: budget ? '100.00%' : '0.00%' };
  return base;
}

// ============================================================
// CATALOG / REFERENCES / STATS
// ============================================================

router.get('/catalog', (req, res) => res.json({ catalog: REPORTS }));

router.get('/references', async (req, res) => {
  try { res.json(await getReferences()); }
  catch (error) { console.error('Exports references error:', error); res.status(500).json({ error: 'Failed to load report references.', details: error.message }); }
});

router.get('/stats', async (req, res) => {
  try {
    const financialExists = await tableExists('financial_reports');
    const exportsExists = await tableExists('report_exports');
    let total = 0; let thisMonth = 0; let downloads = 0; let pdfExports = 0; let excelExports = 0;
    if (financialExists) {
      const result = await pool.query(`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE))::int AS this_month FROM financial_reports`);
      total = Number(result.rows[0]?.total || 0); thisMonth = Number(result.rows[0]?.this_month || 0);
    }
    if (exportsExists) {
      const result = await pool.query(`SELECT COUNT(*)::int AS downloads, COUNT(*) FILTER (WHERE LOWER(format)='pdf')::int AS pdf, COUNT(*) FILTER (WHERE LOWER(format) IN ('excel','xlsx'))::int AS excel FROM report_exports`);
      downloads = Number(result.rows[0]?.downloads || 0); pdfExports = Number(result.rows[0]?.pdf || 0); excelExports = Number(result.rows[0]?.excel || 0);
    }
    res.json({ total, thisMonth, downloads, pdfExports, excelExports });
  } catch (error) { console.error('Exports stats error:', error); res.status(500).json({ error: 'Failed to load export statistics.', details: error.message }); }
});

// ============================================================
// HISTORY
// ============================================================

router.get('/history', async (req, res) => {
  try {
    if (!(await tableExists('financial_reports'))) return res.json({ reports: [] });
    const result = await pool.query(`SELECT fr.*, u.full_name AS generated_by_name FROM financial_reports fr LEFT JOIN users u ON u.id=fr.generated_by ORDER BY fr.created_at DESC LIMIT 100`);
    res.json({ reports: result.rows });
  } catch (error) { res.status(500).json({ error: 'Failed to load generated reports.', details: error.message }); }
});

router.get('/preview/:key', async (req, res) => {
  try {
    const report = getReport(req.params.key);
    if (!report) return res.status(404).json({ error: 'Report template not found.' });
    const preview = await buildPreview(report, {
      fiscal_year: Number(req.query.fiscal_year) || new Date().getFullYear(),
      period: req.query.period || 'annual',
      fund_cluster_id: req.query.fund_cluster_id || '',
      fund_source_id: req.query.fund_source_id || '',
      fund_group: req.query.fund_group || '',
      department: req.query.department || '',
    });
    res.json(preview);
  } catch (error) { console.error('Report preview error:', error); res.status(500).json({ error: 'Failed to build report preview.', details: error.message }); }
});

// ============================================================
// LIST GENERATED REPORTS
// ============================================================

router.get('/', async (req, res) => {
  try {
    if (!(await tableExists('financial_reports'))) return res.json({ exports: [], totalItems: 0, totalPages: 1, currentPage: 1 });
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
    const params = [];
    const conditions = ['1=1'];
    if (req.query.search) { conditions.push(`fr.report_name ILIKE $${params.length + 1}`); params.push(`%${req.query.search}%`); }
    if (req.query.category) { conditions.push(`fr.report_type = $${params.length + 1}`); params.push(req.query.category); }
    if (req.query.fiscal_year) { conditions.push(`fr.fiscal_year = $${params.length + 1}`); params.push(Number(req.query.fiscal_year)); }
    if (req.query.format) { conditions.push(`UPPER(fr.file_format) = UPPER($${params.length + 1})`); params.push(req.query.format); }
    if (req.query.start_date) { conditions.push(`fr.created_at::date >= $${params.length + 1}`); params.push(req.query.start_date); }
    if (req.query.end_date) { conditions.push(`fr.created_at::date <= $${params.length + 1}`); params.push(req.query.end_date); }
    const count = await pool.query(`SELECT COUNT(*)::int AS count FROM financial_reports fr WHERE ${conditions.join(' AND ')}`, params);
    const totalItems = Number(count.rows[0]?.count || 0);
    const totalPages = Math.max(1, Math.ceil(totalItems / limit));
    const dataParams = [...params, limit, (page - 1) * limit];
    const data = await pool.query(`SELECT fr.*, u.full_name AS generated_by_name FROM financial_reports fr LEFT JOIN users u ON u.id=fr.generated_by WHERE ${conditions.join(' AND ')} ORDER BY fr.created_at DESC LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`, dataParams);
    res.json({ exports: data.rows, totalItems, totalPages, currentPage: page });
  } catch (error) { console.error('Exports list error:', error); res.status(500).json({ error: 'Failed to load generated reports.', details: error.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(`SELECT fr.*, u.full_name AS generated_by_name FROM financial_reports fr LEFT JOIN users u ON u.id=fr.generated_by WHERE fr.id=$1`, [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Generated report not found.' });
    res.json(result.rows[0]);
  } catch (error) { res.status(500).json({ error: 'Failed to load generated report.', details: error.message }); }
});

// ============================================================
// GENERATE / SAVE REPORT DEFINITION
// ============================================================

router.post('/generate', async (req, res) => {
  try {
    if (!(await tableExists('financial_reports'))) return res.status(500).json({ error: 'The financial_reports table does not exist in the database.' });
    const report = getReport(req.body.report_key);
    if (!report) return res.status(400).json({ error: 'Invalid report template.' });
    const fiscalYear = Number(req.body.fiscal_year) || new Date().getFullYear();
    const format = String(req.body.format || 'Excel');
    if (!['Excel', 'PDF'].includes(format)) return res.status(400).json({ error: 'Unsupported export format.' });
    const userId = Number(req.body.generated_by) || null;
    const result = await pool.query(`INSERT INTO financial_reports (report_type, report_name, fiscal_year, period_type, period_value, fund_cluster_id, generated_by, file_format, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'Generated') RETURNING *`, [report.category, report.name, fiscalYear, req.body.period === 'annual' ? 'yearly' : 'quarterly', req.body.period || 'annual', req.body.fund_cluster_id ? Number(req.body.fund_cluster_id) : null, userId, format]);
    res.status(201).json(result.rows[0]);
  } catch (error) { console.error('Generate report error:', error); res.status(500).json({ error: 'Failed to generate report.', details: error.message }); }
});

// ============================================================
// DOWNLOAD ACTUAL REPORT STRUCTURE
// ============================================================

router.get('/download/:id', async (req, res) => {
  try {
    const result = await pool.query(`SELECT fr.*, u.full_name AS generated_by_name FROM financial_reports fr LEFT JOIN users u ON u.id=fr.generated_by WHERE fr.id=$1`, [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Generated report not found.' });
    const reportRecord = result.rows[0];
    const report = getReport(reportRecord.report_name) || REPORTS.find((x) => x.name === reportRecord.report_name);
    if (!report) return res.status(404).json({ error: 'Report template not found.' });
    const filters = { fiscal_year: reportRecord.fiscal_year, period: reportRecord.period_value || 'annual', fund_cluster_id: reportRecord.fund_cluster_id || '', fund_source_id: '', fund_group: '', department: '' };
    const preview = await buildPreview(report, filters);
    const format = String(reportRecord.file_format || 'PDF').toUpperCase();
    const safeName = cleanFileName(report.name);

    if (format === 'PDF') {
      const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 32 });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${safeName}.pdf"`);
      doc.pipe(res);
      if (hasUALogo()) {
        doc.image(UA_LOGO_PATH, (doc.page.width - 58) / 2, 24, { width: 58, height: 58, fit: [58, 58], align: 'center', valign: 'center' });
        doc.y = 88;
      } else {
        doc.y = 36;
      }
      doc.font('Helvetica-Bold').fontSize(11).text('Republic of the Philippines', { align: 'center' });
      doc.fontSize(13).text('UNIVERSITY OF ABRA', { align: 'center' });
      doc.fontSize(14).text(report.name, { align: 'center' });
      doc.font('Helvetica').fontSize(9).text(`For the Year ${reportRecord.fiscal_year} (${preview.context || 'All Funds'})`, { align: 'center' });
      doc.moveDown(1);
      const headers = preview.columns.map((x) => x.label);
      const widths = headers.map(() => Math.max(55, (doc.page.width - 64) / Math.max(headers.length, 1)));
      let y = doc.y;
      const rowHeight = 22;
      const drawRow = (values, bold = false, header = false) => {
        if (y + rowHeight > doc.page.height - 45) { doc.addPage(); y = 35; }
        let x = 32;
        doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(7);
        values.forEach((value, i) => { doc.rect(x, y, widths[i], rowHeight).stroke('#a8b4c3'); doc.text(String(value ?? ''), x + 3, y + 6, { width: widths[i] - 6, height: rowHeight - 4, ellipsis: true }); x += widths[i]; });
        y += rowHeight;
      };
      drawRow(headers, true, true);
      preview.rows.forEach((row) => drawRow(preview.columns.map((c) => row[c.key])));
      if (preview.totals) drawRow(preview.columns.map((c) => preview.totals[c.key] ?? ''), true);
      doc.moveDown(2);
      doc.fontSize(7).font('Helvetica').text(`Generated through the BMAS Reports & Exports module. Generated by: ${reportRecord.generated_by_name || 'Administrator'}`);
      doc.end();
    } else if (format === 'EXCEL' || format === 'XLSX') {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'BMAS';
      workbook.created = new Date();
      const ws = workbook.addWorksheet(report.sheetName || report.name);
      ws.pageSetup.orientation = 'landscape';
      ws.pageSetup.fitToPage = true;
      ws.pageSetup.fitToWidth = 1;
      ws.pageSetup.fitToHeight = 0;
      const totalColumns = Math.max(preview.columns.length, 1);
      const titleStartColumn = totalColumns > 1 ? 2 : 1;

      if (hasUALogo()) {
        const logoId = workbook.addImage({
          filename: UA_LOGO_PATH,
          extension: 'jpeg',
        });
        ws.addImage(logoId, {
          tl: { col: 0.15, row: 0.15 },
          ext: { width: 62, height: 62 },
        });
      }

      const mergeTitle = (row, value, fontSize) => {
        if (totalColumns > 1) {
          ws.mergeCells(row, titleStartColumn, row, totalColumns);
        }
        const cell = ws.getCell(row, titleStartColumn);
        cell.value = value;
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.font = { bold: true, size: fontSize };
      };

      mergeTitle(1, 'Republic of the Philippines', 11);
      mergeTitle(2, 'UNIVERSITY OF ABRA', 14);
      mergeTitle(3, report.name, 13);
      mergeTitle(4, `For the Year ${reportRecord.fiscal_year} (${preview.context || 'All Funds'})`, 10);
      ws.getRow(1).height = 22;
      ws.getRow(2).height = 24;
      ws.getRow(3).height = 22;
      ws.getRow(4).height = 20;
      const headerRow = ws.addRow(preview.columns.map((x) => x.label));
      headerRow.font = { bold: true };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      headerRow.eachCell((cell) => { cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }; });
      preview.rows.forEach((row) => {
        const dataRow = ws.addRow(preview.columns.map((c) => row[c.key]));
        dataRow.eachCell((cell) => { cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }; });
      });
      if (preview.totals) { const totalRow = ws.addRow(preview.columns.map((c) => preview.totals[c.key] ?? '')); totalRow.font = { bold: true }; }
      ws.columns.forEach((column) => { column.width = Math.min(38, Math.max(12, column.values.reduce((max, value) => Math.max(max, String(value ?? '').length + 2), 10))); });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${safeName}.xlsx"`);
      await workbook.xlsx.write(res);
      res.end();
    } else {
      return res.status(400).json({ error: 'Unsupported export format. Use Excel or PDF.' });
    }

    if (await tableExists('report_exports')) {
      await pool.query(`INSERT INTO report_exports (report_type, fiscal_year, fund_cluster_id, format, generated_by, file_name) VALUES ($1,$2,$3,$4,$5,$6)`, [report.name, reportRecord.fiscal_year, reportRecord.fund_cluster_id || null, format === 'EXCEL' || format === 'XLSX' ? 'Excel' : 'PDF', reportRecord.generated_by || null, `${safeName}.${format === 'PDF' ? 'pdf' : 'xlsx'}`]);
    }
  } catch (error) {
    console.error('Download report error:', error);
    if (!res.headersSent) res.status(500).json({ error: 'Failed to generate report.', details: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(`DELETE FROM financial_reports WHERE id=$1 RETURNING id`, [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Generated report not found.' });
    res.json({ message: 'Generated report deleted successfully.' });
  } catch (error) { res.status(500).json({ error: 'Failed to delete generated report.', details: error.message }); }
});

module.exports = router;