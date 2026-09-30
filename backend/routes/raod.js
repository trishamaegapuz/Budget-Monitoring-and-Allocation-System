// server/routes/raod.js
// Complete RAOD Registry backend for BMAS.
// Source basis: RAOD FY 2026 structure/terminology previously supplied by the user.
// RAOD is centered on General Fund / Fund Cluster 101.

const express = require("express");
const router = express.Router();
const pool = require("../db");

const FY = 2026;
const GENERAL_FUND_CODE = "101";
const GENERAL_FUND_SOURCE_CODE = "MAIN";

const n = (v, fallback = 0) => {
  if (v === null || v === undefined || v === "") return fallback;
  const x = Number(v);
  return Number.isFinite(x) ? x : fallback;
};

const nullableInt = (v) => {
  if (v === null || v === undefined || v === "") return null;
  const x = Number(v);
  return Number.isFinite(x) ? x : null;
};

const amount = (v) => Math.max(0, n(v, 0));

const areaCase = `
  CASE
    WHEN UPPER(TRIM(COALESCE(rc.category,''))) IN ('MAIN','MAIN CAMPUS','LAGANGILANG')
      OR LOWER(COALESCE(rc.code,'') || ' ' || COALESCE(rc.name,'')) ~ '(main|lagangilang)'
      THEN 'MAIN'
    WHEN UPPER(TRIM(COALESCE(rc.category,''))) IN ('BGD','BANGUED')
      OR LOWER(COALESCE(rc.code,'') || ' ' || COALESCE(rc.name,'')) ~ '(bgd|bangued)'
      THEN 'BGD'
    WHEN UPPER(TRIM(COALESCE(rc.category,''))) IN ('LAPAZ','LA PAZ','LA PAZ CAMPUS')
      OR LOWER(COALESCE(rc.code,'') || ' ' || COALESCE(rc.name,'')) ~ '(la[[:space:]-]?paz|lapaz)'
      THEN 'LAPAZ'
    WHEN UPPER(TRIM(COALESCE(rc.category,''))) IN ('OTHER','OTHER FUND','OTHER FUNDS')
      THEN 'OTHER FUND'
    ELSE 'MAIN'
  END
`;

const statusCase = `
  CASE
    WHEN COALESCE(r.disbursement_amount,0) > 0 THEN 'DISBURSED'
    WHEN COALESCE(r.obligation_amount,0) > 0 THEN 'OBLIGATION'
    ELSE 'RECORDED'
  END
`;

async function getGeneralIds() {
  const [cluster, source] = await Promise.all([
    pool.query(
      `SELECT id, code, name FROM fund_clusters
       WHERE code = $1 AND COALESCE(is_active,TRUE)=TRUE LIMIT 1`,
      [GENERAL_FUND_CODE]
    ),
    pool.query(
      `SELECT id, code, name FROM fund_sources
       WHERE code = $1 AND COALESCE(is_active,TRUE)=TRUE LIMIT 1`,
      [GENERAL_FUND_SOURCE_CODE]
    ),
  ]);

  return {
    cluster: cluster.rows[0] || null,
    source: source.rows[0] || null,
  };
}

function buildFilters(req, startIndex = 1) {
  const p = [];
  const w = ["1=1"];
  let i = startIndex;

  const q = String(req.query.search || "").trim();
  const from = String(req.query.date_from || "").trim();
  const to = String(req.query.date_to || "").trim();
  const rc = nullableInt(req.query.responsibility_center_id);
  const campus = nullableInt(req.query.campus_id);
  const fundGroup = String(req.query.fund_group || "").trim().toUpperCase();
  const type = String(req.query.transaction_type || "").trim().toLowerCase();

  if (q) {
    w.push(`(
      CAST(r.registry_no AS TEXT) ILIKE $${i}
      OR COALESCE(r.ors_serial_no,'') ILIKE $${i}
       OR COALESCE(r.serial_no_transferred,'') ILIKE $${i}
       OR COALESCE(r.dv_payroll_no,'') ILIKE $${i}
       OR COALESCE(r.account_title,'') ILIKE $${i}
       OR COALESCE(r.po_no,'') ILIKE $${i}
       OR COALESCE(r.status_of_po,'') ILIKE $${i}
      OR COALESCE(r.payee,'') ILIKE $${i}
      OR COALESCE(r.particulars,'') ILIKE $${i}
      OR COALESCE(r.ref_no,'') ILIKE $${i}
       OR COALESCE(r.remarks,'') ILIKE $${i}
      OR COALESCE(rc.code,'') ILIKE $${i}
      OR COALESCE(rc.name,'') ILIKE $${i}
      OR COALESCE(pap.code,'') ILIKE $${i}
      OR COALESCE(pap.name,'') ILIKE $${i}
      OR COALESCE(uacs.code,'') ILIKE $${i}
    )`);
    p.push(`%${q}%`);
    i++;
  }

  if (from) {
    w.push(`r.entry_date >= $${i}`);
    p.push(from);
    i++;
  }

  if (to) {
    w.push(`r.entry_date <= $${i}`);
    p.push(to);
    i++;
  }

  if (rc !== null) {
    w.push(`r.responsibility_center_id = $${i}`);
    p.push(rc);
    i++;
  }

  if (campus !== null) {
    w.push(`r.campus_id = $${i}`);
    p.push(campus);
    i++;
  }

  if (fundGroup && fundGroup !== "ALL") {
    w.push(`(${areaCase}) = $${i}`);
    p.push(fundGroup);
    i++;
  }

  if (type === "obligations") {
    w.push(`COALESCE(r.obligation_amount,0) > 0`);
  } else if (type === "disbursements") {
    w.push(`COALESCE(r.disbursement_amount,0) > 0`);
  } else if (type === "balance") {
    // RAOD entries do not have an allotment_amount column in the actual FY2026 schema.
    // Balance is therefore not filtered at the entry level here.
    w.push(`COALESCE(r.unpaid_obligation,0) > 0`);
  }

  return { where: w.join(" AND "), params: p, next: i };
}

function entrySelect() {
  return `
    SELECT
      r.*,
      ${statusCase} AS entry_status,
      ${areaCase} AS fund_group,

      fc.code AS fund_cluster_code,
      fc.name AS fund_cluster_name,
      fs.code AS fund_source_code,
      fs.name AS fund_source_name,

      c.code AS campus_code,
      c.name AS campus_name,

      rc.code AS responsibility_center_code,
      rc.name AS responsibility_center_name,
      rc.category AS responsibility_center_category,

      pap.code AS pap_code,
      pap.name AS pap_name,

      uacs.code AS uacs_code,
      uacs.account_title AS uacs_title,

      oe.code AS object_expenditure_code,
      oe.name AS object_expenditure_name,

      ac.code AS allotment_class_code,
      ac.name AS allotment_class_name,

      mfo.code AS mfo_code,
      mfo.name AS mfo_name,

      r.wfp_source_id AS wfp_source_id,
      r.wfp_source_code AS wfp_source_code,
      ws.code AS wfp_source_code_ref,
      ws.name AS wfp_source_name,
      r.status_of_po AS po_status
    FROM raod_entries r
    LEFT JOIN fund_clusters fc ON fc.id = r.fund_cluster_id
    LEFT JOIN fund_sources fs ON fs.id = r.fund_source_id
    LEFT JOIN campuses c ON c.id = r.campus_id
    LEFT JOIN responsibility_centers rc ON rc.id = r.responsibility_center_id
    LEFT JOIN pap ON pap.id = r.pap_id
    LEFT JOIN uacs_codes uacs ON uacs.id = r.uacs_code_id
    LEFT JOIN object_expenditures oe ON oe.id = r.object_expenditure_id
    LEFT JOIN allotment_classes ac ON ac.id = r.allotment_class_id
    LEFT JOIN mfo ON mfo.id = r.mfo_id
    LEFT JOIN wfp_sources ws ON ws.id = r.wfp_source_id
  `;
}

/* GET /api/raod/test */
router.get("/test", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ success: true, message: "RAOD API is working." });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

/* GET /api/raod/reference-data */
router.get("/reference-data", async (_req, res) => {
  try {
    const [
      fundClusters,
      fundSources,
      campuses,
      responsibilityCenters,
      pap,
      uacs,
      objectExpenditures,
      allotmentClasses,
      wfpSources,
      mfo,
    ] = await Promise.all([
      pool.query(`SELECT id,code,name FROM fund_clusters
                  WHERE COALESCE(is_active,TRUE)=TRUE ORDER BY code`),
      pool.query(`SELECT id,code,name FROM fund_sources
                  WHERE COALESCE(is_active,TRUE)=TRUE ORDER BY code`),
      pool.query(`SELECT id,code,name FROM campuses
                  WHERE COALESCE(is_active,TRUE)=TRUE ORDER BY name`),
      pool.query(`SELECT id,code,name,description,category FROM responsibility_centers
                  WHERE COALESCE(is_active,TRUE)=TRUE ORDER BY code,name`),
      pool.query(`SELECT id,code,name FROM pap
                  WHERE COALESCE(is_active,TRUE)=TRUE ORDER BY code`),
      pool.query(`SELECT id,code,account_title FROM uacs_codes
                  WHERE COALESCE(is_active,TRUE)=TRUE ORDER BY code`),
      pool.query(`SELECT id,code,name FROM object_expenditures
                  WHERE COALESCE(is_active,TRUE)=TRUE ORDER BY code`),
      pool.query(`SELECT id,code,name FROM allotment_classes
                  WHERE COALESCE(is_active,TRUE)=TRUE ORDER BY code`),
      pool.query(`SELECT id,code,name FROM wfp_sources
                  WHERE COALESCE(is_active,TRUE)=TRUE ORDER BY code`),
      pool.query(`SELECT id,code,name FROM mfo
                  WHERE COALESCE(is_active,TRUE)=TRUE ORDER BY code`),
    ]);

    const mapArea = (row) => {
      const c = String(row.category || "").trim().toUpperCase();
      let area = "MAIN";
      if (["BGD","BANGUED"].includes(c)) area = "BGD";
      else if (["LAPAZ","LA PAZ","LA PAZ CAMPUS"].includes(c)) area = "LAPAZ";
      else if (["OTHER","OTHER FUND","OTHER FUNDS"].includes(c)) area = "OTHER FUND";
      return { ...row, area_group: area };
    };

    res.json({
      fund_clusters: fundClusters.rows,
      fund_sources: fundSources.rows,
      campuses: campuses.rows,
      responsibility_centers: responsibilityCenters.rows.map(mapArea),
      pap: pap.rows,
      uacs_codes: uacs.rows,
      object_expenditures: objectExpenditures.rows,
      allotment_classes: allotmentClasses.rows,
      wfp_sources: wfpSources.rows,
      mfo: mfo.rows,
    });
  } catch (e) {
    console.error("RAOD reference-data:", e);
    res.status(500).json({ error: "Failed to load RAOD reference data.", details: e.message });
  }
});

/* GET /api/raod/overview */
router.get("/overview", async (req, res) => {
  const fiscalYear = n(req.query.fiscal_year, FY);
  try {
    const ids = await getGeneralIds();
    if (!ids.cluster) {
      return res.status(404).json({ error: "General Fund / Fund Cluster 101 was not found." });
    }

    const group = String(req.query.fund_group || "ALL").toUpperCase();

    const budget = await pool.query(
      `SELECT
        COALESCE(SUM(bi.approved_budget),0) allotment,
        COALESCE(SUM(bi.ps_amount),0) ps,
        COALESCE(SUM(bi.mooe_amount),0) mooe,
        COALESCE(SUM(bi.co_amount),0) co
       FROM budget_items bi
       LEFT JOIN responsibility_centers rc ON rc.id=bi.responsibility_center_id
       WHERE bi.fiscal_year=$1 AND bi.fund_cluster_id=$2
         AND ($3='ALL' OR (${areaCase.replaceAll("r.", "bi.")})=$3)`,
      [fiscalYear, ids.cluster.id, group]
    );

    const actual = await pool.query(
      `SELECT
        COUNT(*)::int records,
        COUNT(*) FILTER (WHERE COALESCE(r.obligation_amount,0)>0)::int obligation_count,
        COUNT(*) FILTER (WHERE COALESCE(r.disbursement_amount,0)>0)::int disbursement_count,
        COALESCE(SUM(r.obligation_amount),0) obligation,
        COALESCE(SUM(r.disbursement_amount),0) disbursement
       FROM raod_entries r
       LEFT JOIN responsibility_centers rc ON rc.id=r.responsibility_center_id
       JOIN fund_clusters fc ON fc.id=r.fund_cluster_id
       WHERE r.fiscal_year=$1 AND fc.code='101'
         AND ($2='ALL' OR (${areaCase})=$2)`,
      [fiscalYear, group]
    );

    const b = budget.rows[0] || {};
    const a = actual.rows[0] || {};
    const allotment = n(b.allotment);
    const obligation = n(a.obligation);
    const disbursement = n(a.disbursement);
    const unobligated = Math.max(0, allotment - obligation);
    const undisbursed = Math.max(0, obligation - disbursement);

    const departments = await pool.query(
      `WITH actuals AS (
         SELECT responsibility_center_id,
                COUNT(*)::int records,
                COALESCE(SUM(obligation_amount),0) obligation,
                COALESCE(SUM(disbursement_amount),0) disbursement
         FROM raod_entries r
         JOIN fund_clusters fc ON fc.id=r.fund_cluster_id
         WHERE r.fiscal_year=$1 AND fc.code='101'
         GROUP BY responsibility_center_id
       ),
       budgets AS (
         SELECT responsibility_center_id,COALESCE(SUM(approved_budget),0) allocation
         FROM budget_items bi
         JOIN fund_clusters fc ON fc.id=bi.fund_cluster_id
         WHERE bi.fiscal_year=$1 AND fc.code='101'
         GROUP BY responsibility_center_id
       )
       SELECT rc.id,rc.code,rc.name,rc.description,rc.category,
              ${areaCase} area_group,
              COALESCE(b.allocation,0) allocation,
              COALESCE(a.records,0) raod_records,
              COALESCE(a.obligation,0) obligation,
              COALESCE(a.disbursement,0) disbursement,
              GREATEST(0,COALESCE(b.allocation,0)-COALESCE(a.obligation,0)) remaining,
              CASE WHEN COALESCE(b.allocation,0)>0
                   THEN ROUND(COALESCE(a.obligation,0)/b.allocation*100,2)
                   ELSE 0 END utilization
       FROM responsibility_centers rc
       JOIN actuals a ON a.responsibility_center_id=rc.id
       LEFT JOIN budgets b ON b.responsibility_center_id=rc.id
       WHERE COALESCE(rc.is_active,TRUE)=TRUE
         AND ($2='ALL' OR (${areaCase})=$2)
       ORDER BY rc.name`,
      [fiscalYear, group]
    );

    const recent = await pool.query(
      `${entrySelect()}
       WHERE r.fiscal_year=$1 AND fc.code='101'
       ORDER BY r.entry_date DESC,r.id DESC LIMIT 8`,
      [fiscalYear]
    );

    res.json({
      fiscal_year: fiscalYear,
      total_records: n(a.records),
      obligation_count: n(a.obligation_count),
      disbursement_count: n(a.disbursement_count),
      allotment_amount: allotment,
      obligation_amount: obligation,
      disbursement_amount: disbursement,
      unobligated_balance: unobligated,
      undisbursed_balance: undisbursed,
      total_obligations: obligation,
      total_disbursements: disbursement,
      with_balance: undisbursed > 0 ? 1 : 0,
      general_fund_summary: {
        ps: n(b.ps),
        mooe: n(b.mooe),
        co: n(b.co),
        allotment,
        obligation,
        disbursement,
        unobligated: unobligated,
        unpaid_obligation: undisbursed,
      },
      selected_fund_cluster: ids.cluster,
      fund_clusters: (await pool.query(
        `SELECT fc.id,fc.code,fc.name,COUNT(r.id)::int record_count
         FROM fund_clusters fc
         LEFT JOIN raod_entries r ON r.fund_cluster_id=fc.id AND r.fiscal_year=$1
         WHERE COALESCE(fc.is_active,TRUE)=TRUE
         GROUP BY fc.id,fc.code,fc.name ORDER BY fc.code`,
        [fiscalYear]
      )).rows,
      departments: departments.rows,
      recent_entries: recent.rows,
    });
  } catch (e) {
    console.error("RAOD overview:", e);
    res.status(500).json({ error: "Failed to load RAOD overview.", details: e.message });
  }
});

/* GET /api/raod/department-budget */
router.get("/department-budget", async (req, res) => {
  const fiscalYear = n(req.query.fiscal_year, FY);
  const id = nullableInt(req.query.responsibility_center_id);
  if (id === null) return res.status(400).json({ error: "responsibility_center_id is required." });

  try {
    const dept = await pool.query(
      `SELECT id,code,name,description,category FROM responsibility_centers WHERE id=$1 LIMIT 1`,
      [id]
    );
    if (!dept.rows.length) return res.status(404).json({ error: "Department / Unit not found." });

    const budget = await pool.query(
      `SELECT COUNT(*)::int records,
              COALESCE(SUM(approved_budget),0) approved,
              COALESCE(SUM(ps_amount),0) ps,
              COALESCE(SUM(mooe_amount),0) mooe,
              COALESCE(SUM(co_amount),0) co
       FROM budget_items bi
       JOIN fund_clusters fc ON fc.id=bi.fund_cluster_id
       WHERE bi.fiscal_year=$1 AND bi.responsibility_center_id=$2 AND fc.code='101'`,
      [fiscalYear, id]
    );

    const actual = await pool.query(
      `SELECT COUNT(*)::int records,
              COALESCE(SUM(obligation_amount),0) obligation,
              COALESCE(SUM(disbursement_amount),0) disbursement
       FROM raod_entries r
       JOIN fund_clusters fc ON fc.id=r.fund_cluster_id
       WHERE r.fiscal_year=$1 AND r.responsibility_center_id=$2 AND fc.code='101'`,
      [fiscalYear, id]
    );

    const b = budget.rows[0] || {};
    const a = actual.rows[0] || {};
    const allocation = n(b.approved);
    const obligation = n(a.obligation);
    const disbursement = n(a.disbursement);

    res.json({
      fiscal_year: fiscalYear,
      fund: { code: "101", name: "GENERAL FUND" },
      department: dept.rows[0],
      allocation_records: n(b.records),
      raod_records: n(a.records),
      appropriation: allocation,
      allotment: allocation,
      allocation,
      obligation,
      disbursement,
      remaining: Math.max(0, allocation - obligation),
      utilization: allocation ? obligation / allocation * 100 : 0,
      disbursementRate: allocation ? disbursement / allocation * 100 : 0,
      breakdown: { ps: n(b.ps), mooe: n(b.mooe), co: n(b.co) },
    });
  } catch (e) {
    console.error("RAOD department-budget:", e);
    res.status(500).json({ error: "Failed to load department budget details.", details: e.message });
  }
});

/* GET /api/raod */
router.get("/", async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const offset = (page - 1) * limit;

  try {
    const ids = await getGeneralIds();
    if (!ids.cluster) return res.status(404).json({ error: "General Fund / Fund Cluster 101 was not found." });

    const f = buildFilters(req, 1);
    f.where += ` AND r.fund_cluster_id=$${f.next}`;
    f.params.push(ids.cluster.id);
    f.next++;

    const dataSql = `
      ${entrySelect()}
      WHERE ${f.where}
      ORDER BY r.entry_date DESC,r.id DESC
      LIMIT $${f.next} OFFSET $${f.next + 1}
    `;
    const countSql = `
      SELECT COUNT(*)::int total
      FROM raod_entries r
      LEFT JOIN responsibility_centers rc ON rc.id=r.responsibility_center_id
      LEFT JOIN pap ON pap.id=r.pap_id
      LEFT JOIN uacs_codes uacs ON uacs.id=r.uacs_code_id
      WHERE ${f.where}
    `;

    const [data, count] = await Promise.all([
      pool.query(dataSql, [...f.params, limit, offset]),
      pool.query(countSql, f.params),
    ]);

    const totalItems = n(count.rows[0]?.total);
    res.json({
      entries: data.rows,
      totalItems,
      totalPages: Math.max(1, Math.ceil(totalItems / limit)),
      currentPage: page,
      pageSize: limit,
    });
  } catch (e) {
    console.error("RAOD list:", e);
    res.status(500).json({ error: "Failed to load RAOD records.", details: e.message });
  }
});

/* GET /api/raod/department-summary
   Real Department / Responsibility Center summary for General Fund 101. */
router.get("/department-summary", async (req, res) => {
  const fiscalYear = n(req.query.fiscal_year, FY);
  try {
    const ids = await getGeneralIds();
    if (!ids.cluster) return res.status(404).json({ error: "General Fund / Fund Cluster 101 was not found." });

    const result = await pool.query(
      `WITH budgets AS (
         SELECT bi.responsibility_center_id,
                COALESCE(SUM(bi.approved_budget),0) allotment,
                COALESCE(SUM(bi.ps_amount),0) ps,
                COALESCE(SUM(bi.mooe_amount),0) mooe,
                COALESCE(SUM(bi.co_amount),0) co
         FROM budget_items bi
         WHERE bi.fiscal_year=$1 AND bi.fund_cluster_id=$2
         GROUP BY bi.responsibility_center_id
       ), actuals AS (
         SELECT r.responsibility_center_id,
                COUNT(*)::int records,
                COALESCE(SUM(r.obligation_amount),0) obligation,
                COALESCE(SUM(r.disbursement_amount),0) disbursement,
                COALESCE(SUM(r.unpaid_obligation),0) unpaid_obligation
         FROM raod_entries r
         WHERE r.fiscal_year=$1 AND r.fund_cluster_id=$2
         GROUP BY r.responsibility_center_id
       )
       SELECT rc.id, rc.code, rc.name, rc.description, rc.category,
              COALESCE(b.allotment,0) allotment,
              COALESCE(b.ps,0) ps,
              COALESCE(b.mooe,0) mooe,
              COALESCE(b.co,0) co,
              COALESCE(a.records,0) raod_records,
              COALESCE(a.obligation,0) obligation,
              COALESCE(a.disbursement,0) disbursement,
              GREATEST(0,COALESCE(b.allotment,0)-COALESCE(a.obligation,0)) unobligated,
              COALESCE(a.unpaid_obligation,0) unpaid_obligation
       FROM responsibility_centers rc
       LEFT JOIN budgets b ON b.responsibility_center_id=rc.id
       LEFT JOIN actuals a ON a.responsibility_center_id=rc.id
       WHERE COALESCE(rc.is_active,TRUE)=TRUE
       ORDER BY rc.name`,
      [fiscalYear, ids.cluster.id]
    );

    res.json({ success: true, fiscal_year: fiscalYear, fund: ids.cluster, rows: result.rows });
  } catch (e) {
    console.error("RAOD department-summary:", e);
    res.status(500).json({ error: "Failed to load Department / Responsibility Center summary.", details: e.message });
  }
});

/* GET /api/raod/module/:view
   Provides database-driven data for the nine clickable RAOD module views. */
router.get("/module/:view", async (req, res) => {
  const view = String(req.params.view || "").toLowerCase();
  const fiscalYear = n(req.query.fiscal_year, FY);

  try {
    const ids = await getGeneralIds();
    if (!ids.cluster) return res.status(404).json({ error: "General Fund / Fund Cluster 101 was not found." });

    if (view === "overview") {
      const overview = await pool.query(
        `SELECT
          COALESCE(SUM(r.obligation_amount),0) obligation,
          COALESCE(SUM(r.disbursement_amount),0) disbursement,
          COUNT(*)::int records
         FROM raod_entries r
         WHERE r.fiscal_year=$1 AND r.fund_cluster_id=$2`,
        [fiscalYear, ids.cluster.id]
      );
      return res.json({ success: true, view, fiscal_year: fiscalYear, summary: overview.rows[0] || {} });
    }

    if (view === "allotment-obligation" || view === "monitoring") {
      const result = await pool.query(
        `SELECT
          COALESCE(SUM(obligation_amount),0) obligation,
          COALESCE(SUM(disbursement_amount),0) disbursement,
          COUNT(*)::int records
         FROM raod_entries
         WHERE fiscal_year=$1 AND fund_cluster_id=$2`,
        [fiscalYear, ids.cluster.id]
      );
      return res.json({ success: true, view, fiscal_year: fiscalYear, summary: result.rows[0] || {} });
    }

    if (view === "fund-registry" || view === "reports-export") {
      const result = await pool.query(
        `${entrySelect()}
         WHERE r.fiscal_year=$1 AND r.fund_cluster_id=$2
         ORDER BY r.entry_date DESC,r.id DESC LIMIT 50`,
        [fiscalYear, ids.cluster.id]
      );
      return res.json({ success: true, view, fiscal_year: fiscalYear, fund: ids.cluster, entries: result.rows });
    }

    if (view === "fund-rc-breakdown") {
      const result = await pool.query(
        `SELECT rc.id,rc.code,rc.name,
                COALESCE(SUM(r.obligation_amount),0) obligation,
                COALESCE(SUM(r.disbursement_amount),0) disbursement
         FROM responsibility_centers rc
         LEFT JOIN raod_entries r ON r.responsibility_center_id=rc.id
           AND r.fiscal_year=$1 AND r.fund_cluster_id=$2
         WHERE COALESCE(rc.is_active,TRUE)=TRUE
         GROUP BY rc.id,rc.code,rc.name
         ORDER BY rc.name`,
        [fiscalYear, ids.cluster.id]
      );
      return res.json({ success: true, view, fiscal_year: fiscalYear, rows: result.rows });
    }

    if (view === "financial-reports") {
      return res.json({
        success: true,
        view,
        fiscal_year: fiscalYear,
        reports: [
          { code: "FAR 1", name: "Statement of Appropriations, Allotments, Obligations, Disbursements and Balances" },
          { code: "FAR 1A", name: "Statement of Approved Budget, Allotments and Obligations" },
          { code: "SARONCA", name: "Summary of Appropriations, Releases, Obligations and Notice of Cash Allocation" },
        ],
      });
    }

    if (view === "master-data") {
      const data = await Promise.all([
        pool.query(`SELECT id,code,name FROM fund_clusters WHERE COALESCE(is_active,TRUE)=TRUE ORDER BY code`),
        pool.query(`SELECT id,code,name FROM campuses WHERE COALESCE(is_active,TRUE)=TRUE ORDER BY name`),
        pool.query(`SELECT id,code,name FROM responsibility_centers WHERE COALESCE(is_active,TRUE)=TRUE ORDER BY code,name`),
        pool.query(`SELECT id,code,account_title FROM uacs_codes WHERE COALESCE(is_active,TRUE)=TRUE ORDER BY code`),
        pool.query(`SELECT id,code,name FROM allotment_classes WHERE COALESCE(is_active,TRUE)=TRUE ORDER BY code`),
      ]);
      return res.json({
        success: true, view, fiscal_year: fiscalYear,
        fund_clusters: data[0].rows, campuses: data[1].rows,
        responsibility_centers: data[2].rows, uacs_codes: data[3].rows,
        allotment_classes: data[4].rows,
      });
    }

    return res.status(404).json({ error: `Unknown RAOD module view: ${view}` });
  } catch (e) {
    console.error("RAOD module view:", e);
    res.status(500).json({ error: "Failed to load RAOD module data.", details: e.message });
  }
});


/* GET /api/raod/department/:id/entries */
router.get("/department/:id/entries", async (req, res) => {
  const rcId = nullableInt(req.params.id);
  const fiscalYear = n(req.query.fiscal_year, FY);
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const offset = (page - 1) * limit;
  if (rcId === null) return res.status(400).json({ error: "Invalid responsibility center ID." });
  try {
    const countResult = await pool.query(`SELECT COUNT(*)::int AS total FROM raod_entries r JOIN fund_clusters fc ON fc.id=r.fund_cluster_id WHERE r.fiscal_year=$1 AND r.responsibility_center_id=$2 AND fc.code='101'`, [fiscalYear, rcId]);
    const totalItems = Number(countResult.rows[0]?.total || 0);
    const result = await pool.query(`${entrySelect()} WHERE r.fiscal_year=$1 AND r.responsibility_center_id=$2 AND fc.code='101' ORDER BY r.entry_date DESC,r.id DESC LIMIT $3 OFFSET $4`, [fiscalYear, rcId, limit, offset]);
    res.json({ success:true, fiscal_year:fiscalYear, entries:result.rows, totalItems, totalPages:Math.max(1, Math.ceil(totalItems/limit)), currentPage:page, limit });
  } catch (e) {
    console.error("RAOD department entries:", e);
    res.status(500).json({ error:"Failed to load Department / Responsibility Center RAOD entries.", details:e.message });
  }
});

/* GET /api/raod/:id */
router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `${entrySelect()} WHERE r.id=$1 LIMIT 1`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: "RAOD entry not found." });
    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: "Failed to load RAOD entry.", details: e.message });
  }
});

/* POST /api/raod/departments */
router.post("/departments", async (req, res) => {
  const name = String(req.body?.name || "").trim();
  const code = String(req.body?.code || "").trim();
  const description = String(req.body?.description || "").trim();
  const raw = String(req.body?.area_group || "MAIN").trim().toUpperCase();

  if (!name) return res.status(400).json({ error: "Department / Unit name is required." });

  const aliases = {
    "MAIN": "MAIN", "MAIN CAMPUS": "MAIN", "LAGANGILANG": "MAIN",
    "BGD": "BGD", "BANGUED": "BGD",
    "LAPAZ": "LAPAZ", "LA PAZ": "LAPAZ",
    "OTHER": "OTHER FUND", "OTHER FUND": "OTHER FUND", "OTHER FUNDS": "OTHER FUND",
  };
  const area = aliases[raw] || "OTHER FUND";

  try {
    const duplicate = await pool.query(
      `SELECT id FROM responsibility_centers
       WHERE LOWER(TRIM(name))=LOWER(TRIM($1)) AND COALESCE(is_active,TRUE)=TRUE LIMIT 1`,
      [name]
    );
    if (duplicate.rows.length) return res.status(409).json({ error: "A Department / Unit with this name already exists." });

    const result = await pool.query(
      `INSERT INTO responsibility_centers(code,name,description,category,is_active)
       VALUES($1,$2,$3,$4,TRUE)
       RETURNING id,code,name,description,category,is_active`,
      [code || null, name, description || null, area]
    );

    res.status(201).json({ ...result.rows[0], area_group: area });
  } catch (e) {
    if (e.code === "23505") return res.status(409).json({ error: "A Department / Unit with the same code already exists." });
    res.status(500).json({ error: "Failed to add Department / Unit.", details: e.message });
  }
});

/* Shared INSERT/UPDATE field order. */
/*
 * Excel-aligned RAOD fields.
 *
 * The actual FY 2026 "101 General Fund Input Data" sheet uses:
 * ORS Serial No., PAP/DEPT., Old UACS Code, Accounts Title,
 * Obligation, DV/Payroll No., Disbursement, Balances,
 * Unpaid Obligation, PO No., and Status of PO.
 *
 * Only columns that exist in the actual FY2026 raod_entries table are written.
 * Budget/allotment values are sourced from budget_items in summary endpoints.
 */
const columns = [
  "registry_no","entry_date","fund_cluster_id","fund_source_id","campus_id",
  "ors_serial_no","serial_no_transferred","payee","particulars",
  "responsibility_center_id","pap_id","uacs_code_id","ref_no",
  "allotment_class_id","uacs_funding_source_code","fiscal_year","month",
  "series","series2","quarter","object_expenditure_id","mfo_id",
  "wfp_source_id","wfp_source_code","allotment_amount",
  "obligation_amount","disbursement_amount","ps_amount","mooe_amount","co_amount",
  "dv_no","po_no","burs_serial_no","remarks","created_by","updated_by",
  "status","old_uacs_code_id","account_title","unpaid_obligation","status_of_po","dv_payroll_no"
];

const idFields = [
  "fund_cluster_id","fund_source_id","campus_id","responsibility_center_id",
  "pap_id","uacs_code_id","allotment_class_id",
  "object_expenditure_id","mfo_id","old_uacs_code_id","quarter","month","wfp_source_id"
];

const moneyFields = [
  "allotment_amount","obligation_amount","disbursement_amount",
  "ps_amount","mooe_amount","co_amount","unpaid_obligation"
];

function payload(body, userId) {
  const p = {};
  for (const key of columns) {
    if (idFields.includes(key)) p[key] = nullableInt(body[key]);
    else if (moneyFields.includes(key)) p[key] = amount(body[key]);
    else p[key] = body[key] === "" || body[key] === undefined ? null : body[key];
  }
  p.fiscal_year = n(body.fiscal_year, FY);

  // Excel calls this field "Unpaid Obligation". If it is not supplied,
  // calculate it from obligation less disbursement.
  if (body.unpaid_obligation === undefined || body.unpaid_obligation === "") {
    p.unpaid_obligation = Math.max(
      0,
      n(p.obligation_amount, 0) - n(p.disbursement_amount, 0)
    );
  }

  p.created_by = nullableInt(userId ?? body.created_by);
  p.updated_by = nullableInt(userId ?? body.updated_by ?? body.created_by);
  return p;
}

async function getBudgetForResponsibilityCenter(responsibilityCenterId, fiscalYear) {
  const rcId = nullableInt(responsibilityCenterId);
  if (rcId === null) return null;

  const result = await pool.query(
    `SELECT
       COALESCE(SUM(bi.approved_budget),0) AS allocation,
       COALESCE(SUM(bi.ps_amount),0) AS ps,
       COALESCE(SUM(bi.mooe_amount),0) AS mooe,
       COALESCE(SUM(bi.co_amount),0) AS co
     FROM budget_items bi
     JOIN fund_clusters fc ON fc.id=bi.fund_cluster_id
     WHERE bi.fiscal_year=$1
       AND bi.responsibility_center_id=$2
       AND fc.code='101'`,
    [n(fiscalYear, FY), rcId]
  );

  return result.rows[0] || { allocation: 0, ps: 0, mooe: 0, co: 0 };
}

/* POST /api/raod */
router.post("/", async (req, res) => {
  const body = req.body || {};
  const ids = await getGeneralIds().catch(() => ({ cluster: null, source: null }));

  if (!body.registry_no || !String(body.registry_no).trim()) {
    return res.status(400).json({ error: "Registry No. is required. Please enter it manually." });
  }
  if (!body.entry_date) return res.status(400).json({ error: "Entry Date is required." });
  if (body.month !== undefined && body.month !== "" && (!Number.isInteger(Number(body.month)) || Number(body.month) < 1 || Number(body.month) > 12)) {
    return res.status(400).json({ error: "Month must be between 1 and 12." });
  }
  if (body.quarter !== undefined && body.quarter !== "" && (!Number.isInteger(Number(body.quarter)) || Number(body.quarter) < 1 || Number(body.quarter) > 4)) {
    return res.status(400).json({ error: "Quarter must be between 1 and 4." });
  }
  if (!body.responsibility_center_id) return res.status(400).json({ error: "Responsibility Center is required." });
  if (!ids.cluster) return res.status(400).json({ error: "General Fund cluster 101 was not found." });
  if (!ids.source) return res.status(400).json({ error: "General Fund source MAIN was not found." });

  try {
    const budget = await getBudgetForResponsibilityCenter(body.responsibility_center_id, body.fiscal_year);
    const allocation = n(budget?.allocation, 0);
    const obligation = amount(body.obligation_amount);
    const disbursement = amount(body.disbursement_amount);

    if (allocation <= 0) {
      return res.status(400).json({ error: "No approved budget/allotment was found for the selected Responsibility Center for FY 2026." });
    }
    if (disbursement > obligation) {
      return res.status(400).json({ error: "Disbursement cannot be greater than Obligation." });
    }

    const existing = await pool.query(
      `SELECT COALESCE(SUM(obligation_amount),0) AS obligation
       FROM raod_entries
       WHERE fiscal_year=$1 AND responsibility_center_id=$2 AND fund_cluster_id=$3`,
      [n(body.fiscal_year, FY), nullableInt(body.responsibility_center_id), ids.cluster.id]
    );
    const existingObligation = n(existing.rows[0]?.obligation, 0);
    if (existingObligation + obligation > allocation) {
      return res.status(400).json({
        error: `Obligation of ${obligation.toFixed(2)} exceeds the available allotment of ${Math.max(0, allocation - existingObligation).toFixed(2)} for this Responsibility Center.`
      });
    }

    const p = payload({
      ...body,
      fund_cluster_id: ids.cluster.id,
      fund_source_id: ids.source.id,
      allotment_amount: allocation,
      ps_amount: n(budget?.ps),
      mooe_amount: n(budget?.mooe),
      co_amount: n(budget?.co),
      obligation_amount: obligation,
      disbursement_amount: disbursement,
      unpaid_obligation: Math.max(0, obligation - disbursement),
      status_of_po: body.status_of_po ?? body.po_status,
      status: body.status || "Pending",
    });

    p.registry_no = String(body.registry_no).trim();
    p.fund_cluster_id = ids.cluster.id;
    p.fund_source_id = ids.source.id;

    const vals = columns.map((c) => p[c]);
    const placeholders = vals.map((_, i) => `$${i + 1}`).join(",");
    const result = await pool.query(
      `INSERT INTO raod_entries(${columns.join(",")})
       VALUES(${placeholders}) RETURNING *`,
      vals
    );

    res.status(201).json({ success: true, message: "RAOD record created successfully.", entry: result.rows[0] });
  } catch (e) {
    console.error("RAOD create:", e);
    if (e.code === "23505") return res.status(409).json({ error: "Registry No. already exists.", details: e.detail });
    if (e.code === "23503") return res.status(400).json({ error: "One of the selected reference records is invalid.", details: e.detail || e.message });
    res.status(500).json({ error: "Failed to create RAOD entry.", details: e.message });
  }
});

/* PUT /api/raod/:id */
router.put("/:id", async (req, res) => {
  const body = req.body || {};
  if (!body.registry_no || !String(body.registry_no).trim()) return res.status(400).json({ error: "Registry No. is required." });
  if (!body.entry_date) return res.status(400).json({ error: "Entry Date is required." });
  if (body.month !== undefined && body.month !== "" && (!Number.isInteger(Number(body.month)) || Number(body.month) < 1 || Number(body.month) > 12)) return res.status(400).json({ error: "Month must be between 1 and 12." });
  if (body.quarter !== undefined && body.quarter !== "" && (!Number.isInteger(Number(body.quarter)) || Number(body.quarter) < 1 || Number(body.quarter) > 4)) return res.status(400).json({ error: "Quarter must be between 1 and 4." });

  try {
    const ids = await getGeneralIds();
    if (!ids.cluster || !ids.source) return res.status(400).json({ error: "General Fund 101 / MAIN reference data was not found." });

    const budget = await getBudgetForResponsibilityCenter(body.responsibility_center_id, body.fiscal_year);
    const allocation = n(budget?.allocation, 0);
    const obligation = amount(body.obligation_amount);
    const disbursement = amount(body.disbursement_amount);

    if (allocation <= 0) return res.status(400).json({ error: "No approved budget/allotment was found for the selected Responsibility Center for FY 2026." });
    if (disbursement > obligation) return res.status(400).json({ error: "Disbursement cannot be greater than Obligation." });

    const current = await pool.query(`SELECT obligation_amount FROM raod_entries WHERE id=$1 LIMIT 1`, [req.params.id]);
    if (!current.rows.length) return res.status(404).json({ error: "RAOD entry not found." });
    const oldObligation = n(current.rows[0].obligation_amount, 0);

    const existing = await pool.query(
      `SELECT COALESCE(SUM(obligation_amount),0) AS obligation
       FROM raod_entries
       WHERE fiscal_year=$1 AND responsibility_center_id=$2 AND fund_cluster_id=$3 AND id<>$4`,
      [n(body.fiscal_year, FY), nullableInt(body.responsibility_center_id), ids.cluster.id, req.params.id]
    );
    const existingObligation = n(existing.rows[0]?.obligation, 0);
    if (existingObligation + obligation > allocation) {
      return res.status(400).json({ error: `Obligation of ${obligation.toFixed(2)} exceeds the available allotment of ${Math.max(0, allocation - existingObligation).toFixed(2)} for this Responsibility Center.` });
    }

    const p = payload({
      ...body,
      fund_cluster_id: ids.cluster.id,
      fund_source_id: ids.source.id,
      allotment_amount: allocation,
      ps_amount: n(budget?.ps),
      mooe_amount: n(budget?.mooe),
      co_amount: n(budget?.co),
      obligation_amount: obligation,
      disbursement_amount: disbursement,
      unpaid_obligation: Math.max(0, obligation - disbursement),
      status_of_po: body.status_of_po ?? body.po_status,
      status: body.status || "Pending",
    });

    const sets = columns.map((c, i) => `${c}=$${i + 1}`).join(",");
    const values = columns.map((c) => p[c]);
    const result = await pool.query(
      `UPDATE raod_entries SET ${sets},updated_at=CURRENT_TIMESTAMP WHERE id=$${values.length + 1} RETURNING *`,
      [...values, req.params.id]
    );

    res.json({ success: true, message: "RAOD record updated successfully.", entry: result.rows[0] });
  } catch (e) {
    console.error("RAOD update:", e);
    if (e.code === "23505") return res.status(409).json({ error: "Registry No. already exists.", details: e.detail });
    if (e.code === "23503") return res.status(400).json({ error: "One of the selected reference records is invalid.", details: e.detail || e.message });
    res.status(500).json({ error: "Failed to update RAOD entry.", details: e.message });
  }
});

/* DELETE /api/raod/:id */
router.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query(`DELETE FROM raod_entries WHERE id=$1 RETURNING id`, [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: "RAOD entry not found." });
    res.json({ success: true, message: "RAOD entry deleted successfully.", id: result.rows[0].id });
  } catch (e) {
    res.status(500).json({ error: "Failed to delete RAOD entry.", details: e.message });
  }
});

module.exports = router;
