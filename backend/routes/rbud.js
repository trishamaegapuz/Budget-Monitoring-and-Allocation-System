const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/auth");


/*
|--------------------------------------------------------------------------
| DATABASE
|--------------------------------------------------------------------------
*/

// RBUD uses the same authenticated JWT context as the rest of BMAS.
router.use(verifyToken);

const pool = require("../db");

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function num(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function int(value, fallback = 0) {
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
}

async function generateRegistryNo(client, fiscalYear) {
  const resolvedYear = Number(fiscalYear) || new Date().getFullYear();
  await client.query(`CREATE SEQUENCE IF NOT EXISTS bmas_rbud_registry_seq START 1`);

  const maxResult = await client.query(`
    SELECT COALESCE(MAX((regexp_match(registry_no, 'RBUD-\\d{4}-(\\d+)$'))[1]::BIGINT), 0) AS max_no
    FROM rbud_entries
    WHERE registry_no ~ '^RBUD-\\d{4}-\\d+$'
  `);
  const maxNo = Number(maxResult.rows[0]?.max_no || 0);
  await client.query(`SELECT setval('bmas_rbud_registry_seq', $1, false)`, [maxNo + 1]);

  const nextResult = await client.query(`SELECT nextval('bmas_rbud_registry_seq') AS registry_no`);
  return `RBUD-${resolvedYear}-${String(nextResult.rows[0].registry_no).padStart(4, "0")}`;
}

async function generateBursSerialNo(client, entryDate, fiscalYear) {
  const date = entryDate ? new Date(entryDate) : new Date();
  const resolvedYear = Number(fiscalYear) || date.getFullYear();
  const month = String((date.getMonth() + 1)).padStart(2, "0");

  // The workbook confirms the institutional BURS shape as XX-XXXXXXX-YYYY-MM-NNNN,
  // but it contains both 01-5206441 and 02-5206441 prefixes. The prefix must therefore
  // remain configurable rather than being inferred from incomplete data.
  const prefix = String(process.env.BURS_SERIAL_PREFIX || "02-5206441").trim();
  if (!/^\d{2}-\d{7}$/.test(prefix)) {
    throw new Error("BURS_SERIAL_PREFIX must use the format XX-XXXXXXX.");
  }

  await client.query(`CREATE SEQUENCE IF NOT EXISTS bmas_burs_serial_seq START 1`);

  // Keep the sequence ahead of any existing numeric BURS suffixes to avoid collisions
  // when this feature is introduced into an existing database.
  const maxResult = await client.query(`
    SELECT COALESCE(MAX((regexp_match(burs_serial_no, '-(\\d{4})$'))[1]::INTEGER), 0) AS max_no
    FROM rbud_entries
    WHERE burs_serial_no ~ '^\\d{2}-\\d{7}-\\d{4}-\\d{2}-\\d{4}$'
  `);
  const maxNo = Number(maxResult.rows[0]?.max_no || 0);
  await client.query(`SELECT setval('bmas_burs_serial_seq', $1, false)`, [maxNo + 1]);

  const nextResult = await client.query(`SELECT nextval('bmas_burs_serial_seq') AS serial_no`);
  const serialNo = String(nextResult.rows[0].serial_no).padStart(4, "0");

  return `${prefix}-${resolvedYear}-${month}-${serialNo}`;
}

function year(value) {
  const n = parseInt(value, 10);

  if (Number.isFinite(n)) {
    return n;
  }

  return new Date().getFullYear();
}

function pageInfo(page, limit) {
  const p = Math.max(int(page, 1), 1);
  const l = Math.min(Math.max(int(limit, 8), 1), 100);

  return {
    page: p,
    limit: l,
    offset: (p - 1) * l,
  };
}

function pct(value, total) {
  const v = num(value);
  const t = num(total);

  if (t <= 0) return 0;

  return Number(((v / t) * 100).toFixed(2));
}

/*
|--------------------------------------------------------------------------
| FUND GROUP CLASSIFICATION
|--------------------------------------------------------------------------
*/

const FUND_GROUP_CASE = `
CASE
  WHEN
    UPPER(COALESCE(fc.code, '')) LIKE 'LP-%'
    OR UPPER(COALESCE(fc.name, '')) LIKE '%LAPAZ%'
    OR UPPER(COALESCE(fs.code, '')) = 'LP'
    OR UPPER(COALESCE(fs.name, '')) LIKE '%LAPAZ%'
  THEN 'LAPAZ'

  WHEN
    UPPER(COALESCE(fc.code, '')) IN ('101', 'FC-101')
    OR UPPER(COALESCE(fs.code, '')) IN ('101', 'MAIN')
    OR UPPER(COALESCE(fc.name, '')) LIKE '%GENERAL FUND%'
    OR UPPER(COALESCE(fc.name, '')) LIKE '%MAIN%'
    OR (
      UPPER(COALESCE(fc.code, '')) LIKE 'LAG-NF-TF-%'
      AND UPPER(COALESCE(fc.code, '')) NOT LIKE '%DOST%'
      AND UPPER(COALESCE(fc.code, '')) NOT LIKE '%DA-%'
      AND UPPER(COALESCE(fc.code, '')) NOT LIKE '%CHED%'
    )
  THEN 'Main'

  WHEN
    UPPER(COALESCE(fc.code, '')) LIKE '%BGD%'
    OR UPPER(COALESCE(fc.name, '')) LIKE '%BGD%'
    OR UPPER(COALESCE(fc.name, '')) LIKE '%BANGUED%'
    OR UPPER(COALESCE(fs.code, '')) = 'BGD'
  THEN 'BGD'

  WHEN
    UPPER(COALESCE(fc.code, '')) LIKE '%DOST%'
    OR UPPER(COALESCE(fc.name, '')) LIKE '%DOST%'
    OR UPPER(COALESCE(fs.code, '')) = 'DOST'
  THEN 'DOST'

  WHEN
    UPPER(COALESCE(fc.code, '')) LIKE '%DA-%'
    OR UPPER(COALESCE(fc.code, '')) LIKE '%-DA-%'
    OR UPPER(COALESCE(fc.name, '')) LIKE '%DA-%'
    OR UPPER(COALESCE(fc.name, '')) LIKE '%DEPARTMENT OF AGRICULTURE%'
    OR UPPER(COALESCE(fs.code, '')) = 'DA'
  THEN 'DA'

  WHEN
    UPPER(COALESCE(fc.code, '')) LIKE '%CHED%'
    OR UPPER(COALESCE(fc.name, '')) LIKE '%CHED%'
    OR UPPER(COALESCE(fs.code, '')) = 'CHED'
  THEN 'CHED'

  WHEN
    UPPER(COALESCE(fc.code, '')) LIKE '%REVOLVING%'
    OR UPPER(COALESCE(fc.name, '')) LIKE '%REVOLVING%'
    OR UPPER(COALESCE(fc.code, '')) LIKE '%IGP%'
    OR UPPER(COALESCE(fc.name, '')) LIKE '%OTHER%'
    OR UPPER(COALESCE(fs.code, '')) IN ('OTHER', 'REVOLVING')
  THEN 'Other Funds'

  ELSE 'Other Funds'
END
`;

const STATUS_CASE = `
CASE
  WHEN COALESCE(r.disbursement_amount, 0) > 0
    THEN 'Disbursed'

  WHEN COALESCE(r.utilization_amount, 0) > 0
    THEN 'Utilized'

  ELSE 'Approved'
END
`;

/*
|--------------------------------------------------------------------------
| REFERENCES
|--------------------------------------------------------------------------
*/

router.get("/references", async (req, res) => {
  try {
    const [
      fundSources,
      fundClusters,
      fundCodes,
      campuses,
      responsibilityCenters,
      mfo,
      pap,
      uacs,
      objectExpenditures,
      allotmentClasses,
      wfpSources,
    ] = await Promise.all([
      pool.query(`
        SELECT *
        FROM fund_sources
        WHERE is_active = TRUE
        ORDER BY code, name
      `),

      pool.query(`
        SELECT
          fc.*,
          fs.code AS fund_source_code,
          fs.name AS fund_source_name
        FROM fund_clusters fc
        LEFT JOIN fund_sources fs
          ON fs.id = fc.fund_source_id
        WHERE fc.is_active = TRUE
        ORDER BY fc.code, fc.name
      `),

      // Fund Codes are a separate master-data level linked to Fund Cluster.
      // Keep this query optional so the RBUD module remains bootable until
      // the new fund_codes migration has been applied.
      pool.query(`
        SELECT
          fcd.id,
          fcd.fund_cluster_id,
          fcd.code,
          fcd.name,
          fcd.description,
          fcd.is_active,
          fc.code AS fund_cluster_code,
          fc.name AS fund_cluster_name
        FROM fund_codes fcd
        INNER JOIN fund_clusters fc
          ON fc.id = fcd.fund_cluster_id
        WHERE fcd.is_active = TRUE
          AND fc.is_active = TRUE
        ORDER BY fc.code, fc.name, fcd.code, fcd.name
      `).catch((error) => {
        if (error?.code === "42P01") return { rows: [] };
        throw error;
      }),

      pool.query(`
        SELECT *
        FROM campuses
        WHERE is_active = TRUE
        ORDER BY name
      `),

      pool.query(`
        SELECT *
        FROM responsibility_centers
        WHERE is_active = TRUE
        ORDER BY name
      `),

      pool.query(`
        SELECT *
        FROM mfo
        WHERE is_active = TRUE
        ORDER BY code, name
      `),

      pool.query(`
        SELECT *
        FROM pap
        WHERE is_active = TRUE
        ORDER BY code, name
      `),

      pool.query(`
        SELECT *
        FROM uacs_codes
        WHERE is_active = TRUE
        ORDER BY code
      `),

      pool.query(`
        SELECT *
        FROM object_expenditures
        WHERE is_active = TRUE
        ORDER BY code, name
      `),

      pool.query(`
        SELECT *
        FROM allotment_classes
        WHERE is_active = TRUE
        ORDER BY code, name
      `),

      pool.query(`
        SELECT *
        FROM wfp_sources
        WHERE is_active = TRUE
        ORDER BY code, name
      `),
    ]);

    const result = {
      fundSources: fundSources.rows,
      fund_sources: fundSources.rows,

      fundCodes: fundCodes.rows,
      fund_codes: fundCodes.rows,

      fundClusters: fundClusters.rows,
      fund_clusters: fundClusters.rows,

      campuses: campuses.rows,

      responsibilityCenters: responsibilityCenters.rows,
      responsibility_centers: responsibilityCenters.rows,

      departments: responsibilityCenters.rows,

      mfo: mfo.rows,
      mfoList: mfo.rows,

      pap: pap.rows,
      paps: pap.rows,

      uacsCodes: uacs.rows,
      uacs_codes: uacs.rows,

      objectExpenditures: objectExpenditures.rows,
      object_expenditures: objectExpenditures.rows,

      allotmentClasses: allotmentClasses.rows,
      allotment_classes: allotmentClasses.rows,

      wfpSources: wfpSources.rows,
      wfp_sources: wfpSources.rows,

      fundGroups: [
        "All",
        "Main",
        "BGD",
        "Other Funds",
        "DOST",
        "DA",
        "CHED",
        "LAPAZ",
      ],
    };

    res.json({
      ...result,
      references: result,
    });
  } catch (error) {
    console.error("RBUD references error:", error);

    res.status(500).json({
      error: error.message,
    });
  }
});

/*
|--------------------------------------------------------------------------
| FUND OPTIONS
|--------------------------------------------------------------------------
*/

router.get("/fund-options", async (req, res) => {
  const fy = year(req.query.year);
  const group = req.query.group || "All";

  try {
    const params = [fy];
    let groupFilter = "";

    if (group !== "All") {
      params.push(group);

      groupFilter = `
        AND (${FUND_GROUP_CASE}) = $2
      `;
    }

    const result = await pool.query(
      `
      SELECT DISTINCT
        fc.id,
        fc.code,
        fc.name,
        fs.code AS fund_source_code,
        fs.name AS fund_source_name
      FROM fund_clusters fc
      LEFT JOIN fund_sources fs
        ON fs.id = fc.fund_source_id
      WHERE fc.is_active = TRUE
      ${groupFilter}
      ORDER BY fc.code, fc.name
      `,
      params
    );

    res.json({
      fiscalYear: fy,
      group,
      funds: result.rows,
    });
  } catch (error) {
    console.error("RBUD fund options error:", error);

    res.status(500).json({
      error: error.message,
    });
  }
});

/*
|--------------------------------------------------------------------------
| RBUD RECORDS
|--------------------------------------------------------------------------
*/

router.get("/", async (req, res) => {
  const {
    group = "All",
    fund = "",
    status = "",
    search = "",
    year: requestedYear,
    page = 1,
    limit = 8,
  } = req.query;

  const fy = year(requestedYear);
  const pg = pageInfo(page, limit);

  try {
    const params = [fy];
    let index = 2;
    let where = `WHERE r.fiscal_year = $1`;

    if (group && group !== "All") {
      where += ` AND (${FUND_GROUP_CASE}) = $${index}`;
      params.push(group);
      index++;
    }

    if (fund && fund !== "All Funds") {
      where += ` AND (COALESCE(fc.name,'') ILIKE $${index} OR COALESCE(fc.code,'') ILIKE $${index})`;
      params.push(`%${fund}%`);
      index++;
    }

    if (search && search.trim()) {
      where += `
        AND (
          COALESCE(r.registry_no,'') ILIKE $${index}
          OR COALESCE(r.payee,'') ILIKE $${index}
          OR COALESCE(r.particulars,'') ILIKE $${index}
          OR COALESCE(rc.name,'') ILIKE $${index}
          OR COALESCE(rc.code,'') ILIKE $${index}
          OR COALESCE(fc.name,'') ILIKE $${index}
          OR COALESCE(fc.code,'') ILIKE $${index}
          OR COALESCE(fs.name,'') ILIKE $${index}
          OR COALESCE(fs.code,'') ILIKE $${index}
        )`;
      params.push(`%${search.trim()}%`);
      index++;
    }

    // Status filtering is intentionally based on transaction amounts and the
    // stable RBUD status column, avoiding optional PO-status columns.
    if (status && status !== "All Status" && status !== "All") {
      where += `
        AND (
          CASE
            WHEN COALESCE(r.disbursement_amount,0) > 0 THEN 'Disbursed'
            WHEN COALESCE(r.utilization_amount,0) > 0 THEN 'Utilized'
            ELSE COALESCE(NULLIF(TRIM(r.status),''),'Approved')
          END
        ) = $${index}`;
      params.push(status);
      index++;
    }

    const dataParams = [...params, pg.limit, pg.offset];
    const limitParam = index;
    const offsetParam = index + 1;

    const dataResult = await pool.query(
      `
      SELECT
        r.id,
        r.registry_no,
        r.entry_date,
        r.fiscal_year,
        r.month,
        r.series,
        r.series2,
        r.quarter,
        r.payee,
        r.particulars,
        r.utilization_amount,
        r.ps_utilization,
        r.mooe_utilization,
        r.co_utilization,
        r.disbursement_amount,
        r.running_balance,
        GREATEST(
          COALESCE(r.utilization_amount, 0) - COALESCE(r.disbursement_amount, 0),
          0
        ) AS calculated_unpaid_utilization,
        r.unpaid_utilization,
        r.status AS record_status,
        r.burs_serial_no,
        r.ref_no,
        r.remarks,
        r.created_by_name,
        r.created_by_role,
        r.updated_by_name,
        r.updated_by_role,
        r.fund_cluster_id,
        r.fund_source_id,
        r.campus_id,
        r.fund_code,
        r.responsibility_center_id,
        r.pap_id,
        r.uacs_code_id,
        r.object_expenditure_id,
        r.mfo_id,
        r.wfp_source_id,
        r.wfp_source_code,
        fc.code AS fund_cluster_code,
        fc.name AS fund_cluster_name,
        fs.code AS fund_source_code,
        fs.name AS fund_source_name,
        c.code AS campus_code,
        c.name AS campus_name,
        rc.code AS responsibility_center_code,
        rc.name AS responsibility_center_name,
        pap.code AS pap_code,
        pap.name AS pap_name,
        mfo.code AS mfo_code,
        mfo.name AS mfo_name,
        ac.code AS allotment_class_code,
        ac.name AS allotment_class_name,
        ws.code AS wfp_source_master_code,
        ws.code AS wfp_source_code,
        ws.name AS wfp_source_name,
        ws.name AS wfp_source,
        uacs.code AS uacs_code,
        uacs.old_code AS uacs_old_code,
        uacs.account_title AS uacs_account_title,
        uacs.account_title,
        (${FUND_GROUP_CASE}) AS fund_group,
        (
          COALESCE((
            SELECT SUM(bi.approved_budget)
            FROM budget_items bi
            LEFT JOIN budget_proposals bp
              ON bp.proposal_id = bi.budget_proposal_id
            WHERE bi.fiscal_year = r.fiscal_year
              AND (bi.budget_proposal_id IS NULL OR bp.status = 'Approved')
              AND bi.fund_cluster_id IS NOT DISTINCT FROM r.fund_cluster_id
              AND bi.fund_source_id IS NOT DISTINCT FROM r.fund_source_id
              AND bi.campus_id IS NOT DISTINCT FROM r.campus_id
              AND bi.responsibility_center_id IS NOT DISTINCT FROM r.responsibility_center_id
              AND bi.mfo_id IS NOT DISTINCT FROM r.mfo_id
              AND bi.pap_id IS NOT DISTINCT FROM r.pap_id
              AND bi.uacs_code_id IS NOT DISTINCT FROM r.uacs_code_id
              AND bi.allotment_class_id IS NOT DISTINCT FROM r.allotment_class_id
          ), 0)
          -
          COALESCE((
            SELECT SUM(r2.utilization_amount)
            FROM rbud_entries r2
            WHERE r2.fiscal_year = r.fiscal_year
              AND r2.fund_cluster_id IS NOT DISTINCT FROM r.fund_cluster_id
              AND r2.fund_source_id IS NOT DISTINCT FROM r.fund_source_id
              AND r2.campus_id IS NOT DISTINCT FROM r.campus_id
              AND r2.responsibility_center_id IS NOT DISTINCT FROM r.responsibility_center_id
              AND r2.mfo_id IS NOT DISTINCT FROM r.mfo_id
              AND r2.pap_id IS NOT DISTINCT FROM r.pap_id
              AND r2.uacs_code_id IS NOT DISTINCT FROM r.uacs_code_id
              AND r2.allotment_class_id IS NOT DISTINCT FROM r.allotment_class_id
          ), 0)
        ) AS calculated_running_balance,
        CASE
          WHEN COALESCE(r.disbursement_amount,0) > 0 THEN 'Disbursed'
          WHEN COALESCE(r.utilization_amount,0) > 0 THEN 'Utilized'
          ELSE COALESCE(NULLIF(TRIM(r.status),''),'Approved')
        END AS derived_status
      FROM rbud_entries r
      LEFT JOIN fund_clusters fc ON fc.id = r.fund_cluster_id
      LEFT JOIN fund_sources fs ON fs.id = r.fund_source_id
      LEFT JOIN campuses c ON c.id = r.campus_id
      LEFT JOIN responsibility_centers rc ON rc.id = r.responsibility_center_id
      LEFT JOIN pap ON pap.id = r.pap_id
      LEFT JOIN mfo ON mfo.id = r.mfo_id
      LEFT JOIN uacs_codes uacs ON uacs.id = r.uacs_code_id
      LEFT JOIN allotment_classes ac ON ac.id = r.allotment_class_id
      LEFT JOIN wfp_sources ws ON ws.id = r.wfp_source_id
      ${where}
      ORDER BY r.entry_date DESC NULLS LAST, r.id DESC
      LIMIT $${limitParam} OFFSET $${offsetParam}
      `,
      dataParams
    );

    const countResult = await pool.query(
      `
      SELECT COUNT(*) AS total
      FROM rbud_entries r
      LEFT JOIN fund_clusters fc ON fc.id = r.fund_cluster_id
      LEFT JOIN fund_sources fs ON fs.id = r.fund_source_id
      LEFT JOIN responsibility_centers rc ON rc.id = r.responsibility_center_id
      ${where}
      `,
      params
    );

    const totalItems = int(countResult.rows[0]?.total, 0);
    const totalPages = totalItems > 0 ? Math.ceil(totalItems / pg.limit) : 0;

    const entries = dataResult.rows.map((row) => ({
      ...row,
      fundGroup: row.fund_group,
      fund: row.fund_cluster_name || row.fund_source_name || "N/A",
      department: row.responsibility_center_name || "N/A",
      status: row.derived_status,
      utilization_amount: num(row.utilization_amount),
      disbursement_amount: num(row.disbursement_amount),
      unpaid_utilization: num(row.calculated_unpaid_utilization),
      running_balance: num(row.calculated_running_balance),
      approved_budget: 0,
      remaining_balance: num(row.calculated_running_balance),
    }));

    return res.json({
      entries,
      rows: entries,
      totalItems,
      total: totalItems,
      totalPages,
      currentPage: pg.page,
      page: pg.page,
      limit: pg.limit,
      fiscalYear: fy,
      fiscal_year: fy,
    });
  } catch (error) {
    console.error("RBUD list error:", error);
    return res.status(500).json({
      error: error.message || "Failed to load RBUD records.",
      code: error.code || null,
    });
  }
});

/*
|--------------------------------------------------------------------------
| OVERVIEW
|--------------------------------------------------------------------------
*/

router.get("/overview", async (req, res) => {
  const group = req.query.group || "All";
  const fund = req.query.fund || "";
  const fy = year(req.query.year);

  try {
    const params = [fy];
    let index = 2;

    let budgetWhere = `
      WHERE bi.fiscal_year = $1
    `;

    let rbudWhere = `
      WHERE r.fiscal_year = $1
    `;

    /*
    |--------------------------------------------------------------------------
    | GROUP FILTER
    |--------------------------------------------------------------------------
    */

    if (group !== "All") {
      budgetWhere += `
        AND (${FUND_GROUP_CASE}) = $${index}
      `;

      rbudWhere += `
        AND (${FUND_GROUP_CASE}) = $${index}
      `;

      params.push(group);
      index++;
    }

    /*
    |--------------------------------------------------------------------------
    | FUND FILTER
    |--------------------------------------------------------------------------
    */

    if (fund && fund !== "All Funds") {
      budgetWhere += `
        AND (
          fc.name ILIKE $${index}
          OR fc.code ILIKE $${index}
        )
      `;

      rbudWhere += `
        AND (
          fc.name ILIKE $${index}
          OR fc.code ILIKE $${index}
        )
      `;

      params.push(`%${fund}%`);
      index++;
    }

    /*
    |--------------------------------------------------------------------------
    | BUDGET
    |--------------------------------------------------------------------------
    */

    const budgetResult = await pool.query(
      `
      SELECT
        COALESCE(
          SUM(bi.approved_budget),
          0
        ) AS approved_budget,

        COALESCE(
          SUM(bi.ps_amount),
          0
        ) AS ps_budget,

        COALESCE(
          SUM(bi.mooe_amount),
          0
        ) AS mooe_budget,

        COALESCE(
          SUM(bi.co_amount),
          0
        ) AS co_budget

      FROM budget_items bi

      LEFT JOIN fund_clusters fc
        ON fc.id = bi.fund_cluster_id

      LEFT JOIN fund_sources fs
        ON fs.id = bi.fund_source_id

      ${budgetWhere}
      `,
      params
    );

    /*
    |--------------------------------------------------------------------------
    | RBUD
    |--------------------------------------------------------------------------
    */

    const rbudResult = await pool.query(
      `
      SELECT
        COUNT(*) AS records,

        COALESCE(
          SUM(r.utilization_amount),
          0
        ) AS utilized,

        COALESCE(
          SUM(r.disbursement_amount),
          0
        ) AS disbursed,

        COALESCE(
          SUM(GREATEST(COALESCE(r.utilization_amount,0) - COALESCE(r.disbursement_amount,0),0)),
          0
        ) AS unpaid

      FROM rbud_entries r

      LEFT JOIN fund_clusters fc
        ON fc.id = r.fund_cluster_id

      LEFT JOIN fund_sources fs
        ON fs.id = r.fund_source_id

      ${rbudWhere}
      `,
      params
    );

    const budget = budgetResult.rows[0];
    const rbud = rbudResult.rows[0];

    const approved = num(
      budget.approved_budget
    );

    const utilized = num(
      rbud.utilized
    );

    const disbursed = num(
      rbud.disbursed
    );

    const balance = approved - utilized;

    /*
    |--------------------------------------------------------------------------
    | FUND GROUP BREAKDOWN
    |--------------------------------------------------------------------------
    |
    | FIX:
    | No correlated subquery references fc.id anymore.
    |
    | Budget and RBUD are first aggregated by fund_cluster_id.
    | Then they are grouped by FUND_GROUP_CASE.
    |
    |--------------------------------------------------------------------------
    */

    const groupResult = await pool.query(
      `
      WITH budget_by_cluster AS (
        SELECT
          bi.fund_cluster_id,
          COALESCE(
            SUM(bi.approved_budget),
            0
          ) AS budget

        FROM budget_items bi

        WHERE bi.fiscal_year = $1

        GROUP BY
          bi.fund_cluster_id
      ),

      rbud_by_cluster AS (
        SELECT
          r.fund_cluster_id,

          COALESCE(
            SUM(r.utilization_amount),
            0
          ) AS utilized,

          COALESCE(
            SUM(r.disbursement_amount),
            0
          ) AS disbursed

        FROM rbud_entries r

        WHERE r.fiscal_year = $1

        GROUP BY
          r.fund_cluster_id
      ),

      cluster_data AS (
        SELECT
          fc.id,
          fc.code,
          fc.name,

          (${FUND_GROUP_CASE}) AS fund_group,

          COALESCE(
            b.budget,
            0
          ) AS budget,

          COALESCE(
            rb.utilized,
            0
          ) AS utilized,

          COALESCE(
            rb.disbursed,
            0
          ) AS disbursed

        FROM fund_clusters fc

        LEFT JOIN fund_sources fs
          ON fs.id = fc.fund_source_id

        LEFT JOIN budget_by_cluster b
          ON b.fund_cluster_id = fc.id

        LEFT JOIN rbud_by_cluster rb
          ON rb.fund_cluster_id = fc.id

        WHERE fc.is_active = TRUE
      )

      SELECT
        fund_group,

        COUNT(*) AS num_funds,

        COALESCE(
          SUM(budget),
          0
        ) AS budget,

        COALESCE(
          SUM(utilized),
          0
        ) AS utilized,

        COALESCE(
          SUM(disbursed),
          0
        ) AS disbursed

      FROM cluster_data

      GROUP BY
        fund_group

      ORDER BY
        CASE
          WHEN fund_group = 'Main'
            THEN 1

          WHEN fund_group = 'BGD'
            THEN 2
          WHEN fund_group = 'Other Funds'
            THEN 3

          WHEN fund_group = 'DOST'
            THEN 4

          WHEN fund_group = 'DA'
            THEN 5

          WHEN fund_group = 'CHED'
            THEN 6

          WHEN fund_group = 'LAPAZ'
            THEN 7

          ELSE 99
        END
      `,
      [fy]
    );

    /*
    |--------------------------------------------------------------------------
    | FUND GROUP SUMMARY
    |--------------------------------------------------------------------------
    */

    const fundGroupSummary =
      groupResult.rows.map((row) => {
        const b = num(row.budget);
        const u = num(row.utilized);
        const d = num(row.disbursed);

        return {
          group: row.fund_group,

          num_funds: int(
            row.num_funds
          ),

          total_budget: b,
          total_allocation: b,
          approved_budget: b,

          utilized: u,
          disbursed: d,

          balance: b - u,

          utilization: pct(u, b),

          records: 0,

          status:
            b > 0
              ? "Active"
              : "No Allocation",
        };
      });

    /*
    |--------------------------------------------------------------------------
    | BUDGET UTILIZATION
    |--------------------------------------------------------------------------
    */

    const utilization = pct(
      utilized,
      approved
    );

    res.json({
      fiscalYear: fy,
      fiscal_year: fy,

      group,
      fund,

      total_records: int(
        rbud.records
      ),

      active_funds:
        fundGroupSummary
          .filter(
            (x) =>
              x.group === group ||
              group === "All"
          )
          .reduce(
            (sum, x) =>
              sum + x.num_funds,
            0
          ),

      total_budget: approved,
      total_approved: approved,
      total_allocated: approved,

      total_utilized: utilized,
      total_disbursed: disbursed,

      remaining_balance: balance,

      utilization_rate: utilization,

      allocation_vs_disbursement: {
        approved_budget: approved,
        allocated: approved,
        utilized,
        disbursed,
        balance,
        unpaid_utilization: num(
          rbud.unpaid
        ),
      },

      fund_project_breakdown: {
        budget: approved,
        obligation: utilized,
        disbursement: disbursed,
        balance,
        utilization,
      },

      fund_group_summary:
        fundGroupSummary,

      fund_groups: [
        "All",
        "Main",
        "BGD",
        "Other Funds",
        "DOST",
        "DA",
        "CHED",
        "LAPAZ",
      ],
    });
  } catch (error) {
    console.error(
      "RBUD overview error:",
      error
    );

    res.status(500).json({
      error: error.message,
    });
  }
});

/*
|--------------------------------------------------------------------------
| DEPARTMENT / UNIT LIST
|--------------------------------------------------------------------------
*/

router.get("/departments", async (req, res) => {
  const fy = year(req.query.year);
  const group = req.query.group || "All";
  const fund = req.query.fund || "";

  try {
    const params = [fy];
    let nextParam = 2;

    const groupFilter =
      group && group !== "All"
        ? `AND (${FUND_GROUP_CASE}) = $${nextParam}`
        : "";

    if (group && group !== "All") {
      params.push(group);
      nextParam++;
    }

    const fundFilter =
      fund && fund !== "All Funds"
        ? `AND (
             COALESCE(fc.code, '') ILIKE $${nextParam}
             OR COALESCE(fc.name, '') ILIKE $${nextParam}
           )`
        : "";

    if (fund && fund !== "All Funds") {
      params.push(`%${fund}%`);
      nextParam++;
    }

    const result = await pool.query(
      `
      WITH budget AS (
        SELECT
          bi.responsibility_center_id,
          SUM(COALESCE(bi.approved_budget, 0)) AS approved_budget
        FROM budget_items bi
        LEFT JOIN fund_clusters fc
          ON fc.id = bi.fund_cluster_id
        LEFT JOIN fund_sources fs
          ON fs.id = bi.fund_source_id
        WHERE bi.fiscal_year = $1
          ${groupFilter}
          ${fundFilter}
        GROUP BY bi.responsibility_center_id
      ),

      rbud AS (
        SELECT
          r.responsibility_center_id,
          COUNT(*) AS records,
          SUM(COALESCE(r.utilization_amount, 0)) AS utilized,
          SUM(COALESCE(r.disbursement_amount, 0)) AS disbursed,
          SUM(GREATEST(COALESCE(r.utilization_amount,0) - COALESCE(r.disbursement_amount,0),0)) AS unpaid_utilization
        FROM rbud_entries r
        LEFT JOIN fund_clusters fc
          ON fc.id = r.fund_cluster_id
        LEFT JOIN fund_sources fs
          ON fs.id = r.fund_source_id
        WHERE r.fiscal_year = $1
          ${groupFilter}
          ${fundFilter}
        GROUP BY r.responsibility_center_id
      )

      SELECT
        rc.id,
        rc.code,
        rc.name,
        rc.description,
        COALESCE(budget.approved_budget, 0) AS approved_budget,
        COALESCE(rbud.utilized, 0) AS utilized,
        COALESCE(rbud.disbursed, 0) AS disbursed,
        COALESCE(rbud.unpaid_utilization, 0) AS unpaid_utilization,
        COALESCE(rbud.records, 0) AS records
      FROM responsibility_centers rc
      LEFT JOIN budget
        ON budget.responsibility_center_id = rc.id
      LEFT JOIN rbud
        ON rbud.responsibility_center_id = rc.id
      WHERE rc.is_active = TRUE
        AND (
          COALESCE(budget.approved_budget, 0) > 0
          OR COALESCE(rbud.records, 0) > 0
        )
      ORDER BY rc.name ASC
      `,
      params
    );

    const departments = result.rows.map((row) => {
      const approved = num(row.approved_budget);
      const utilized = num(row.utilized);
      const disbursed = num(row.disbursed);
      const unpaid = num(row.unpaid_utilization);

      return {
        id: row.id,
        code: row.code || "—",
        name: row.name || "Unassigned Department / Office",
        description: row.description || "",
        approved_budget: approved,
        utilized,
        disbursed,
        unpaid_utilization: unpaid,
        remaining_balance: approved - utilized,
        utilization_rate: pct(utilized, approved),
        disbursed_rate: pct(disbursed, approved),
        records: int(row.records),
      };
    });

    const totals = departments.reduce(
      (acc, row) => {
        acc.approved_budget += row.approved_budget;
        acc.utilized += row.utilized;
        acc.disbursed += row.disbursed;
        acc.unpaid_utilization += row.unpaid_utilization;
        acc.remaining_balance += row.remaining_balance;
        acc.records += row.records;
        return acc;
      },
      {
        approved_budget: 0,
        utilized: 0,
        disbursed: 0,
        unpaid_utilization: 0,
        remaining_balance: 0,
        records: 0,
      }
    );

    totals.utilization_rate = pct(
      totals.utilized,
      totals.approved_budget
    );

    totals.disbursed_rate = pct(
      totals.disbursed,
      totals.approved_budget
    );

    res.json({
      fiscalYear: fy,
      fiscal_year: fy,
      group,
      fund,
      total: departments.length,
      departments,
      totals,
    });
  } catch (error) {
    console.error("RBUD departments error:", error);
    res.status(500).json({
      error: error.message,
    });
  }
});

router.get(
  "/department-detail/:id",
  async (req, res) => {
    const fy = year(req.query.year);
    const group = req.query.group || "Main";
    const fund = req.query.fund || "";
    const id = int(req.params.id);

    try {
      /*
      |--------------------------------------------------------------------------
      | DETERMINE UNIT
      |--------------------------------------------------------------------------
      */

      const rcResult = await pool.query(
        `
        SELECT
          id,
          code,
          name,
          description

        FROM responsibility_centers

        WHERE id = $1
          AND is_active = TRUE
        `,
        [id]
      );

      const isResponsibilityCenter =
        rcResult.rows.length > 0;

      let unit;

      if (isResponsibilityCenter) {
        unit = {
          ...rcResult.rows[0],
          is_fund_unit: false,
        };
      } else {
        const fundResult =
          await pool.query(
            `
            SELECT
              id,
              code,
              name,
              description

            FROM fund_clusters

            WHERE id = $1
              AND is_active = TRUE
            `,
            [id]
          );

        if (
          fundResult.rows.length === 0
        ) {
          return res.status(404).json({
            error:
              "Department / Unit not found.",
          });
        }

        unit = {
          ...fundResult.rows[0],
          is_fund_unit: true,
        };
      }

      /*
      |--------------------------------------------------------------------------
      | CONDITIONS
      |--------------------------------------------------------------------------
      */

      const budgetParams = [
        fy,
        id,
        group,
      ];

      const rbudParams = [
        fy,
        id,
        group,
      ];

      const programParams = [
        fy,
        id,
        group,
      ];

      const budgetUnitCondition =
        isResponsibilityCenter
          ? `
            AND bi.responsibility_center_id =
                $2
          `
          : `
            AND bi.fund_cluster_id =
                $2
          `;

      const rbudUnitCondition =
        isResponsibilityCenter
          ? `
            AND r.responsibility_center_id =
                $2
          `
          : `
            AND r.fund_cluster_id =
                $2
          `;

      const programUnitCondition =
        isResponsibilityCenter
          ? `
            AND bi.responsibility_center_id =
                $2
          `
          : `
            AND bi.fund_cluster_id =
                $2
          `;

      let fundBudgetFilter = "";
      let fundRbudFilter = "";
      let programFundFilter = "";

      if (
        fund &&
        fund !== "All Funds"
      ) {
        budgetParams.push(
          `%${fund}%`
        );

        rbudParams.push(
          `%${fund}%`
        );

        programParams.push(
          `%${fund}%`
        );

        fundBudgetFilter = `
          AND (
            fc.code ILIKE $4
            OR fc.name ILIKE $4
          )
        `;

        fundRbudFilter = `
          AND (
            fc.code ILIKE $4
            OR fc.name ILIKE $4
          )
        `;

        programFundFilter = `
          AND (
            fc.code ILIKE $4
            OR fc.name ILIKE $4
          )
        `;
      }

      /*
      |--------------------------------------------------------------------------
      | DEPARTMENT BUDGET
      |--------------------------------------------------------------------------
      */

      const budgetResult =
        await pool.query(
          `
          SELECT
            COALESCE(
              SUM(
                bi.approved_budget
              ),
              0
            ) AS approved_budget,

            COALESCE(
              SUM(
                bi.ps_amount
              ),
              0
            ) AS ps_budget,

            COALESCE(
              SUM(
                bi.mooe_amount
              ),
              0
            ) AS mooe_budget,

            COALESCE(
              SUM(
                bi.co_amount
              ),
              0
            ) AS co_budget

          FROM budget_items bi

          LEFT JOIN fund_clusters fc
            ON fc.id = bi.fund_cluster_id

          LEFT JOIN fund_sources fs
            ON fs.id = bi.fund_source_id

          WHERE bi.fiscal_year = $1

            ${budgetUnitCondition}

            AND (${FUND_GROUP_CASE})
                = $3

            ${fundBudgetFilter}
          `,
          budgetParams
        );

      /*
      |--------------------------------------------------------------------------
      | DEPARTMENT RBUD
      |--------------------------------------------------------------------------
      */

      const financialResult =
        await pool.query(
          `
          SELECT
            COUNT(*) AS records,

            COALESCE(
              SUM(
                r.utilization_amount
              ),
              0
            ) AS utilized,

            COALESCE(
              SUM(
                r.disbursement_amount
              ),
              0
            ) AS disbursed

          FROM rbud_entries r

          LEFT JOIN fund_clusters fc
            ON fc.id = r.fund_cluster_id

          LEFT JOIN fund_sources fs
            ON fs.id = r.fund_source_id

          WHERE r.fiscal_year = $1

            ${rbudUnitCondition}

            AND (${FUND_GROUP_CASE})
                = $3

            ${fundRbudFilter}
          `,
          rbudParams
        );

      const approved = num(
        budgetResult.rows[0]
          .approved_budget
      );

      const utilized = num(
        financialResult.rows[0]
          .utilized
      );

      const disbursed = num(
        financialResult.rows[0]
          .disbursed
      );

      const remaining =
        approved - utilized;

      /*
      |--------------------------------------------------------------------------
      | PROGRAM / ACTIVITY
      |--------------------------------------------------------------------------
      */

      const programResult =
        await pool.query(
          `
          WITH budget_data AS (
            SELECT
              COALESCE(
                pap.code,
                mfo.code,
                uacs.code,
                'N/A'
              ) AS code,

              COALESCE(
                pap.name,
                mfo.name,
                uacs.account_title,
                bi.notes,
                'Unclassified'
              ) AS name,

              SUM(
                bi.approved_budget
              ) AS approved

            FROM budget_items bi

            LEFT JOIN fund_clusters fc
              ON fc.id = bi.fund_cluster_id

            LEFT JOIN fund_sources fs
              ON fs.id = bi.fund_source_id

            LEFT JOIN pap
              ON pap.id = bi.pap_id

            LEFT JOIN mfo
              ON mfo.id = bi.mfo_id

            LEFT JOIN uacs_codes uacs
              ON uacs.id = bi.uacs_code_id

            WHERE bi.fiscal_year = $1

              ${programUnitCondition}

              AND (${FUND_GROUP_CASE})
                  = $3

              ${programFundFilter}

            GROUP BY
              1,
              2
          ),

          rbud_data AS (
            SELECT
              COALESCE(
                pap.code,
                mfo.code,
                uacs.code,
                'N/A'
              ) AS code,

              SUM(
                r.utilization_amount
              ) AS obligated,

              SUM(
                r.disbursement_amount
              ) AS disbursed

            FROM rbud_entries r

            LEFT JOIN fund_clusters fc
              ON fc.id = r.fund_cluster_id

            LEFT JOIN fund_sources fs
              ON fs.id = r.fund_source_id

            LEFT JOIN pap
              ON pap.id = r.pap_id

            LEFT JOIN mfo
              ON mfo.id = r.mfo_id

            LEFT JOIN uacs_codes uacs
              ON uacs.id = r.uacs_code_id

            WHERE r.fiscal_year = $1

              ${rbudUnitCondition}

              AND (${FUND_GROUP_CASE})
                  = $3

              ${fundRbudFilter}

            GROUP BY
              1
          )

          SELECT
            bd.code,
            bd.name,
            bd.approved,

            COALESCE(
              rd.obligated,
              0
            ) AS obligated,

            COALESCE(
              rd.disbursed,
              0
            ) AS disbursed

          FROM budget_data bd

          LEFT JOIN rbud_data rd
            ON rd.code = bd.code

          ORDER BY
            bd.code,
            bd.name
          `,
          programParams
        );

      const programs =
        programResult.rows.map(
          (row, index) => {
            const budget = num(
              row.approved
            );

            const obligated = num(
              row.obligated
            );

            const disb = num(
              row.disbursed
            );

            const utilizationRate =
              pct(
                obligated,
                budget
              );

            return {
              code:
                row.code ||
                `P ${index + 1}`,

              name: row.name,

              approved_budget:
                budget,

              obligated,

              disbursed: disb,

              remaining_balance:
                budget - obligated,

              utilization_rate:
                utilizationRate,

              status:
                utilizationRate >= 90
                  ? "Watch"
                  : "On Track",
            };
          }
        );

      /*
      |--------------------------------------------------------------------------
      | TRANSACTIONS
      |--------------------------------------------------------------------------
      */

      const transactionResult =
        await pool.query(
          `
          SELECT
            r.id,
            r.registry_no,
            r.entry_date,
            r.payee,
            r.particulars,

            r.utilization_amount,
            r.disbursement_amount,
            r.unpaid_utilization,

            fc.code AS fund_code,
            fc.name AS fund_name,

            fs.code AS fund_source_code,
            fs.name AS fund_source_name,

            rc.code AS responsibility_center_code,
            rc.name AS responsibility_center_name,

            (${STATUS_CASE}) AS status

          FROM rbud_entries r

          LEFT JOIN fund_clusters fc
            ON fc.id = r.fund_cluster_id

          LEFT JOIN fund_sources fs
            ON fs.id = r.fund_source_id

          LEFT JOIN responsibility_centers rc
            ON rc.id =
               r.responsibility_center_id

          LEFT JOIN campuses c
            ON c.id = r.campus_id

          WHERE r.fiscal_year = $1

            ${rbudUnitCondition}

            AND (${FUND_GROUP_CASE})
                = $3

            ${fundRbudFilter}

          ORDER BY
            r.entry_date DESC,
            r.id DESC

          LIMIT 100
          `,
          rbudParams
        );

      /*
      |--------------------------------------------------------------------------
      | RESPONSE
      |--------------------------------------------------------------------------
      */

      res.json({
        fiscalYear: fy,
        fiscal_year: fy,

        group,
        fund,

        department: {
          ...unit,

          approved_budget:
            approved,

          allocated_budget:
            approved,

          utilized,

          disbursed,

          remaining_balance:
            remaining,

          utilization_rate:
            pct(
              utilized,
              approved
            ),

          disbursed_rate:
            pct(
              disbursed,
              approved
            ),

          records: int(
            financialResult
              .rows[0]
              .records
          ),
        },

        summary: {
          approved_budget:
            approved,

          allocated:
            approved,

          utilized,

          disbursed,

          remaining_balance:
            remaining,

          utilization_rate:
            pct(
              utilized,
              approved
            ),
        },

        programs,

        programActivities:
          programs,

        entries:
          transactionResult.rows.map(
            (row) => ({
              ...row,

              department_name:
                row.responsibility_center_name,

              responsibility_center:
                row.responsibility_center_name,

              fund:
                row.fund_name,

              status:
                row.status,

              utilization_amount:
                num(
                  row.utilization_amount
                ),

              disbursement_amount:
                num(
                  row.disbursement_amount
                ),

              unpaid_utilization:
                num(
                  row.unpaid_utilization
                ),
            })
          ),
      });
    } catch (error) {
      console.error(
        "RBUD department detail error:",
        error
      );

      res.status(500).json({
        error: error.message,
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| GET SINGLE RBUD RECORD
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| RBUD MODULE VIEWS
|--------------------------------------------------------------------------
| These endpoints support the nine internal RBUD Module views:
| Overview, Budget & Allocation, Fund Registries, Transactions,
| Budget Utilization & Balance, Fund / Project Breakdown,
| Financial Reports, Reference / Master Data, and Reports & Export.
| They use the existing BMAS database tables and do not insert dummy data.
|--------------------------------------------------------------------------
*/

/*
| 1) BUDGET & ALLOCATION
*/
router.get("/budget-allocation", async (req, res) => {
  const fy = year(req.query.year);
  const group = req.query.group || req.query.fundGroup || "All";
  const search = (req.query.search || "").trim();

  try {
    const params = [fy];
    let i = 2;

    // Only approved Budget Proposal allocations are treated as approved budget.
    // Legacy budget_items without a linked proposal remain visible.
    let where = `
      WHERE bi.fiscal_year = $1
        AND (
          bi.budget_proposal_id IS NULL
          OR bp.status = 'Approved'
        )
    `;

    if (group !== "All") {
      where += ` AND (${FUND_GROUP_CASE}) = $${i}`;
      params.push(group);
      i++;
    }

    if (search) {
      where += `
        AND (
          COALESCE(bp.proposal_no, '') ILIKE $${i}
          OR COALESCE(bp.proposal_title, '') ILIKE $${i}
          OR COALESCE(bp.department_unit, '') ILIKE $${i}
          OR COALESCE(fc.code, '') ILIKE $${i}
          OR COALESCE(fc.name, '') ILIKE $${i}
          OR COALESCE(rc.code, '') ILIKE $${i}
          OR COALESCE(rc.name, '') ILIKE $${i}
          OR COALESCE(pap.code, '') ILIKE $${i}
          OR COALESCE(pap.name, '') ILIKE $${i}
          OR COALESCE(mfo.code, '') ILIKE $${i}
          OR COALESCE(mfo.name, '') ILIKE $${i}
        )
      `;
      params.push(`%${search}%`);
      i++;
    }

    const rows = await pool.query(`
      SELECT
        bi.id,
        bi.fiscal_year,
        bi.approved_budget,
        bi.ps_amount,
        bi.mooe_amount,
        bi.co_amount,
        bi.status,
        bi.notes,
        bi.budget_proposal_id,

        bp.proposal_no,
        bp.proposal_title,
        bp.department_unit AS proposal_department,
        bp.status AS proposal_status,
        bp.approved_at AS proposal_approved_at,

        fc.id AS fund_cluster_id,
        fc.code AS fund_cluster_code,
        fc.name AS fund_cluster_name,

        fs.code AS fund_source_code,
        fs.name AS fund_source_name,

        rc.code AS responsibility_center_code,
        rc.name AS responsibility_center_name,

        pap.code AS pap_code,
        pap.name AS pap_name,

        mfo.code AS mfo_code,
        mfo.name AS mfo_name,

        (${FUND_GROUP_CASE}) AS fund_group,

        COALESCE((
          SELECT SUM(r.utilization_amount)
          FROM rbud_entries r
          WHERE r.fiscal_year = bi.fiscal_year
            AND r.fund_cluster_id IS NOT DISTINCT FROM bi.fund_cluster_id
            AND r.fund_source_id IS NOT DISTINCT FROM bi.fund_source_id
            AND r.campus_id IS NOT DISTINCT FROM bi.campus_id
            AND r.responsibility_center_id IS NOT DISTINCT FROM bi.responsibility_center_id
            AND r.mfo_id IS NOT DISTINCT FROM bi.mfo_id
            AND r.pap_id IS NOT DISTINCT FROM bi.pap_id
            AND r.uacs_code_id IS NOT DISTINCT FROM bi.uacs_code_id
            AND r.allotment_class_id IS NOT DISTINCT FROM bi.allotment_class_id
        ), 0) AS utilized_amount,

        COALESCE((
          SELECT SUM(r.disbursement_amount)
          FROM rbud_entries r
          WHERE r.fiscal_year = bi.fiscal_year
            AND r.fund_cluster_id IS NOT DISTINCT FROM bi.fund_cluster_id
            AND r.fund_source_id IS NOT DISTINCT FROM bi.fund_source_id
            AND r.campus_id IS NOT DISTINCT FROM bi.campus_id
            AND r.responsibility_center_id IS NOT DISTINCT FROM bi.responsibility_center_id
            AND r.mfo_id IS NOT DISTINCT FROM bi.mfo_id
            AND r.pap_id IS NOT DISTINCT FROM bi.pap_id
            AND r.uacs_code_id IS NOT DISTINCT FROM bi.uacs_code_id
            AND r.allotment_class_id IS NOT DISTINCT FROM bi.allotment_class_id
        ), 0) AS disbursement_amount,

        COALESCE((
          SELECT SUM(GREATEST(COALESCE(r.utilization_amount,0) - COALESCE(r.disbursement_amount,0),0))
          FROM rbud_entries r
          WHERE r.fiscal_year = bi.fiscal_year
            AND r.fund_cluster_id IS NOT DISTINCT FROM bi.fund_cluster_id
            AND r.fund_source_id IS NOT DISTINCT FROM bi.fund_source_id
            AND r.campus_id IS NOT DISTINCT FROM bi.campus_id
            AND r.responsibility_center_id IS NOT DISTINCT FROM bi.responsibility_center_id
            AND r.mfo_id IS NOT DISTINCT FROM bi.mfo_id
            AND r.pap_id IS NOT DISTINCT FROM bi.pap_id
            AND r.uacs_code_id IS NOT DISTINCT FROM bi.uacs_code_id
            AND r.allotment_class_id IS NOT DISTINCT FROM bi.allotment_class_id
        ), 0) AS unpaid_utilization

      FROM budget_items bi

      LEFT JOIN budget_proposals bp
        ON bp.proposal_id = bi.budget_proposal_id

      LEFT JOIN fund_clusters fc
        ON fc.id = bi.fund_cluster_id

      LEFT JOIN fund_sources fs
        ON fs.id = bi.fund_source_id

      LEFT JOIN responsibility_centers rc
        ON rc.id = bi.responsibility_center_id

      LEFT JOIN pap
        ON pap.id = bi.pap_id

      LEFT JOIN mfo
        ON mfo.id = bi.mfo_id

      ${where}

      ORDER BY
        fc.code NULLS LAST,
        rc.code NULLS LAST,
        bi.id DESC
    `, params);

    const totals = rows.rows.reduce((acc, row) => {
      acc.approved_budget += num(row.approved_budget);
      acc.ps += num(row.ps_amount);
      acc.mooe += num(row.mooe_amount);
      acc.co += num(row.co_amount);
      acc.utilized += num(row.utilized_amount);
      acc.disbursed += num(row.disbursement_amount);
      acc.unpaid += num(row.unpaid_utilization);
      return acc;
    }, {
      approved_budget: 0,
      ps: 0,
      mooe: 0,
      co: 0,
      utilized: 0,
      disbursed: 0,
      unpaid: 0
    });

    res.json({
      fiscalYear: fy,
      group,
      rows: rows.rows.map(row => {
        const approved = num(row.approved_budget);
        const utilized = num(row.utilized_amount);
        const disbursed = num(row.disbursement_amount);
        const unpaid = num(row.unpaid_utilization);

        return {
          ...row,
          approved_budget: approved,
          ps_amount: num(row.ps_amount),
          mooe_amount: num(row.mooe_amount),
          co_amount: num(row.co_amount),
          utilized_amount: utilized,
          disbursement_amount: disbursed,
          unpaid_utilization: unpaid,
          remaining_balance: approved - utilized,
          utilization_rate: pct(utilized, approved),
          disbursement_rate: pct(disbursed, approved),
        };
      }),
      totals: {
        approved_budget: totals.approved_budget,
        ps: totals.ps,
        mooe: totals.mooe,
        co: totals.co,
        utilized: totals.utilized,
        disbursed: totals.disbursed,
        unpaid_utilization: totals.unpaid,
        remaining_balance: totals.approved_budget - totals.utilized,
        utilization_rate: pct(totals.utilized, totals.approved_budget),
        disbursement_rate: pct(totals.disbursed, totals.approved_budget),
      }
    });
  } catch (error) {
    console.error("RBUD budget-allocation error:", error);
    res.status(500).json({ error: error.message });
  }
});

/*
| 2) BUDGET UTILIZATION & BALANCE
*/
router.get("/utilization", async (req, res) => {
  const fy = year(req.query.year);
  const group = req.query.group || req.query.fundGroup || "All";
  const fund = req.query.fund || "";

  try {
    const params = [fy];
    let i = 2;

    let budgetWhere = `WHERE bi.fiscal_year = $1`;
    let rbudWhere = `WHERE r.fiscal_year = $1`;

    if (group !== "All") {
      budgetWhere += ` AND (${FUND_GROUP_CASE}) = $${i}`;
      rbudWhere += ` AND (${FUND_GROUP_CASE}) = $${i}`;
      params.push(group);
      i++;
    }

    if (fund && fund !== "All Funds") {
      budgetWhere += `
        AND (fc.name ILIKE $${i} OR fc.code ILIKE $${i})
      `;
      rbudWhere += `
        AND (fc.name ILIKE $${i} OR fc.code ILIKE $${i})
      `;
      params.push(`%${fund}%`);
      i++;
    }

    const budget = await pool.query(`
      SELECT
        COALESCE(SUM(bi.approved_budget), 0) AS approved,
        COALESCE(SUM(bi.ps_amount), 0) AS ps,
        COALESCE(SUM(bi.mooe_amount), 0) AS mooe,
        COALESCE(SUM(bi.co_amount), 0) AS co
      FROM budget_items bi
      LEFT JOIN fund_clusters fc ON fc.id = bi.fund_cluster_id
      LEFT JOIN fund_sources fs ON fs.id = bi.fund_source_id
      ${budgetWhere}
    `, params);

    const financial = await pool.query(`
      SELECT
        COUNT(*) AS records,
        COALESCE(SUM(r.utilization_amount), 0) AS utilized,
        COALESCE(SUM(r.disbursement_amount), 0) AS disbursed,
        COALESCE(SUM(GREATEST(COALESCE(r.utilization_amount,0) - COALESCE(r.disbursement_amount,0),0)), 0) AS unpaid,
        COALESCE(SUM(r.ps_utilization), 0) AS ps_utilized,
        COALESCE(SUM(r.mooe_utilization), 0) AS mooe_utilized,
        COALESCE(SUM(r.co_utilization), 0) AS co_utilized
      FROM rbud_entries r
      LEFT JOIN fund_clusters fc ON fc.id = r.fund_cluster_id
      LEFT JOIN fund_sources fs ON fs.id = r.fund_source_id
      ${rbudWhere}
    `, params);

    const b = budget.rows[0];
    const f = financial.rows[0];

    const approved = num(b.approved);
    const utilized = num(f.utilized);
    const disbursed = num(f.disbursed);

    const byFund = await pool.query(`
      SELECT
        fc.id,
        fc.code,
        fc.name,
        (${FUND_GROUP_CASE}) AS fund_group,
        COALESCE((
          SELECT SUM(bi.approved_budget)
          FROM budget_items bi
          WHERE bi.fiscal_year = $1
            AND bi.fund_cluster_id = fc.id
        ), 0) AS approved_budget,
        COALESCE((
          SELECT SUM(r.utilization_amount)
          FROM rbud_entries r
          WHERE r.fiscal_year = $1
            AND r.fund_cluster_id = fc.id
        ), 0) AS utilized,
        COALESCE((
          SELECT SUM(r.disbursement_amount)
          FROM rbud_entries r
          WHERE r.fiscal_year = $1
            AND r.fund_cluster_id = fc.id
        ), 0) AS disbursed
      FROM fund_clusters fc
      LEFT JOIN fund_sources fs ON fs.id = fc.fund_source_id
      WHERE fc.is_active = TRUE
      ORDER BY fc.code, fc.name
    `, [fy]);

    res.json({
      fiscalYear: fy,
      group,
      fund,
      summary: {
        approved_budget: approved,
        obligations: utilized,
        utilization: utilized,
        disbursements: disbursed,
        unutilized_budget: approved - utilized,
        remaining_balance: approved - utilized,
        unpaid_obligation: num(f.unpaid),
        utilization_rate: pct(utilized, approved),
        disbursement_rate: pct(disbursed, approved)
      },
      budget_class: {
        ps: num(b.ps),
        mooe: num(b.mooe),
        co: num(b.co)
      },
      utilized_class: {
        ps: num(f.ps_utilized),
        mooe: num(f.mooe_utilized),
        co: num(f.co_utilized)
      },
      fund_balances: byFund.rows.map(row => {
        const a = num(row.approved_budget);
        const u = num(row.utilized);
        const d = num(row.disbursed);
        return {
          ...row,
          approved_budget: a,
          utilized: u,
          disbursed: d,
          unutilized_budget: a - u,
          remaining_balance: a - u,
          utilization_rate: pct(u, a)
        };
      })
    });
  } catch (error) {
    console.error("RBUD utilization error:", error);
    res.status(500).json({ error: error.message });
  }
});

/*
| 3) FUND / PROJECT BREAKDOWN
*/
router.get("/fund-breakdown", async (req, res) => {
  const fy = year(req.query.year);
  const group = req.query.group || "All";
  const fundId = req.query.fundId || "";
  const fund = req.query.fund || "";

  try {
    const fundParams = [];
    let fundWhere = "fc.is_active = TRUE";

    if (fundId) {
      fundParams.push(fundId);
      fundWhere += ` AND fc.id = $${fundParams.length}`;
    } else if (fund) {
      fundParams.push(`%${fund}%`);
      fundWhere += `
        AND (fc.code ILIKE $${fundParams.length}
             OR fc.name ILIKE $${fundParams.length})
      `;
    }

    if (group !== "All") {
      fundParams.push(group);
      fundWhere += ` AND (${FUND_GROUP_CASE}) = $${fundParams.length}`;
    }

    const fundResult = await pool.query(`
      SELECT
        fc.id,
        fc.code,
        fc.name,
        fs.code AS fund_source_code,
        fs.name AS fund_source_name,
        (${FUND_GROUP_CASE}) AS fund_group
      FROM fund_clusters fc
      LEFT JOIN fund_sources fs ON fs.id = fc.fund_source_id
      WHERE ${fundWhere}
      ORDER BY fc.code, fc.name
      LIMIT 1
    `, fundParams);

    if (!fundResult.rows.length) {
      return res.json({
        fiscalYear: fy,
        fund: null,
        summary: {
          approved_budget: 0,
          utilization: 0,
          disbursement: 0,
          unobligated: 0,
          unpaid_obligation: 0
        },
        classes: []
      });
    }

    const selected = fundResult.rows[0];

    const budget = await pool.query(`
      SELECT
        COALESCE(SUM(approved_budget), 0) AS approved,
        COALESCE(SUM(ps_amount), 0) AS ps,
        COALESCE(SUM(mooe_amount), 0) AS mooe,
        COALESCE(SUM(co_amount), 0) AS co
      FROM budget_items
      WHERE fiscal_year = $1
        AND fund_cluster_id = $2
    `, [fy, selected.id]);

    const financial = await pool.query(`
      SELECT
        COALESCE(SUM(utilization_amount), 0) AS utilized,
        COALESCE(SUM(disbursement_amount), 0) AS disbursed,
        COALESCE(SUM(unpaid_utilization), 0) AS unpaid,
        COALESCE(SUM(ps_utilization), 0) AS ps,
        COALESCE(SUM(mooe_utilization), 0) AS mooe,
        COALESCE(SUM(co_utilization), 0) AS co
      FROM rbud_entries
      WHERE fiscal_year = $1
        AND fund_cluster_id = $2
    `, [fy, selected.id]);

    const b = budget.rows[0];
    const r = financial.rows[0];

    const approved = num(b.approved);
    const utilized = num(r.utilized);
    const disbursed = num(r.disbursed);

    const classes = [
      {
        code: "PS",
        name: "Personnel Services",
        approved_budget: num(b.ps),
        utilization: num(r.ps),
        disbursement: 0
      },
      {
        code: "MOOE",
        name: "Maintenance and Other Operating Expenses",
        approved_budget: num(b.mooe),
        utilization: num(r.mooe),
        disbursement: 0
      },
      {
        code: "CO",
        name: "Capital Outlay",
        approved_budget: num(b.co),
        utilization: num(r.co),
        disbursement: 0
      }
    ];

    const classDisbursements = await pool.query(`
      SELECT
        COALESCE(SUM(disbursement_amount), 0) AS total,
        COALESCE(SUM(ps_utilization), 0) AS ps,
        COALESCE(SUM(mooe_utilization), 0) AS mooe,
        COALESCE(SUM(co_utilization), 0) AS co
      FROM rbud_entries
      WHERE fiscal_year = $1
        AND fund_cluster_id = $2
    `, [fy, selected.id]);

    const cd = classDisbursements.rows[0];
    classes[0].disbursement = num(cd.ps);
    classes[1].disbursement = num(cd.mooe);
    classes[2].disbursement = num(cd.co);

    res.json({
      fiscalYear: fy,
      fund: selected,
      summary: {
        approved_budget: approved,
        utilization: utilized,
        disbursement: disbursed,
        unobligated: approved - utilized,
        unpaid_obligation: num(r.unpaid),
        utilization_rate: pct(utilized, approved)
      },
      classes
    });
  } catch (error) {
    console.error("RBUD fund-breakdown error:", error);
    res.status(500).json({ error: error.message });
  }
});

/*
| 4) FINANCIAL REPORTS
*/
router.get("/financial-reports", async (req, res) => {
  const fy = year(req.query.year);
  const group = req.query.group || "All";
  const fund = req.query.fund || "";

  try {
    const params = [fy];
    let i = 2;
    let where = `WHERE r.fiscal_year = $1`;

    if (group !== "All") {
      where += ` AND (${FUND_GROUP_CASE}) = $${i}`;
      params.push(group);
      i++;
    }

    if (fund && fund !== "All Funds") {
      where += `
        AND (fc.name ILIKE $${i} OR fc.code ILIKE $${i})
      `;
      params.push(`%${fund}%`);
      i++;
    }

    const summaryResult = await pool.query(`
      SELECT
        COUNT(*) AS records,
        COALESCE(SUM(r.utilization_amount), 0) AS obligations,
        COALESCE(SUM(r.disbursement_amount), 0) AS disbursements,
        COALESCE(SUM(GREATEST(COALESCE(r.utilization_amount,0) - COALESCE(r.disbursement_amount,0),0)), 0) AS unpaid
      FROM rbud_entries r
      LEFT JOIN fund_clusters fc ON fc.id = r.fund_cluster_id
      LEFT JOIN fund_sources fs ON fs.id = r.fund_source_id
      ${where}
    `, params);

    const budgetResult = await pool.query(`
      SELECT COALESCE(SUM(bi.approved_budget), 0) AS budget
      FROM budget_items bi
      LEFT JOIN fund_clusters fc ON fc.id = bi.fund_cluster_id
      LEFT JOIN fund_sources fs ON fs.id = bi.fund_source_id
      WHERE bi.fiscal_year = $1
        AND (
          $2 = 'All'
          OR (${FUND_GROUP_CASE.replaceAll("fc.", "fc.").replaceAll("fs.", "fs.")}) = $2
        )
        AND (
          $3 = ''
          OR fc.name ILIKE $3
          OR fc.code ILIKE $3
        )
    `, [fy, group, fund ? `%${fund}%` : ""]);

    res.json({
      fiscalYear: fy,
      group,
      fund,
      reportTypes: [
        { id: "FAR2", name: "FAR 2", description: "Financial Accountability Report No. 2" },
        { id: "FAR2A", name: "FAR 2A", description: "Financial Accountability Report No. 2A" },
        { id: "FAR2_2A", name: "FAR 2 & 2A", description: "Combined Financial Accountability Report" },
        { id: "FHE", name: "FHE Deficiency", description: "Fund Holding Entity Deficiency Report" }
      ],
      summary: {
        approved_budget: num(budgetResult.rows[0].budget),
        obligations: num(summaryResult.rows[0].obligations),
        disbursements: num(summaryResult.rows[0].disbursements),
        unpaid_obligation: num(summaryResult.rows[0].unpaid),
        records: int(summaryResult.rows[0].records)
      }
    });
  } catch (error) {
    console.error("RBUD financial-reports error:", error);
    res.status(500).json({ error: error.message });
  }
});

/*
| 5) MASTER DATA ALIAS
*/
router.get("/master-data", async (req, res) => {
  try {
    const response = await pool.query(`
      SELECT 1
    `);

    // The actual master data is already provided by /references.
    // Keep this endpoint as a stable module-specific alias.
    const [
      fundSources,
      fundClusters,
      campuses,
      responsibilityCenters,
      mfo,
      pap,
      uacs,
      objectExpenditures,
      allotmentClasses,
      wfpSources
    ] = await Promise.all([
      pool.query(`SELECT * FROM fund_sources WHERE is_active = TRUE ORDER BY code, name`),
      pool.query(`
        SELECT fc.*, fs.code AS fund_source_code, fs.name AS fund_source_name
        FROM fund_clusters fc
        LEFT JOIN fund_sources fs ON fs.id = fc.fund_source_id
        WHERE fc.is_active = TRUE
        ORDER BY fc.code, fc.name
      `),
      pool.query(`SELECT * FROM campuses WHERE is_active = TRUE ORDER BY name`),
      pool.query(`SELECT * FROM responsibility_centers WHERE is_active = TRUE ORDER BY code, name`),
      pool.query(`SELECT * FROM mfo WHERE is_active = TRUE ORDER BY code, name`),
      pool.query(`SELECT * FROM pap WHERE is_active = TRUE ORDER BY code, name`),
      pool.query(`SELECT * FROM uacs_codes WHERE is_active = TRUE ORDER BY code`),
      pool.query(`SELECT * FROM object_expenditures WHERE is_active = TRUE ORDER BY code, name`),
      pool.query(`SELECT * FROM allotment_classes WHERE is_active = TRUE ORDER BY code, name`),
      pool.query(`SELECT * FROM wfp_sources WHERE is_active = TRUE ORDER BY code, name`)
    ]);

    res.json({
      fundSources: fundSources.rows,
      fundClusters: fundClusters.rows,
      campuses: campuses.rows,
      responsibilityCenters: responsibilityCenters.rows,
      mfo: mfo.rows,
      pap: pap.rows,
      uacsCodes: uacs.rows,
      objectExpenditures: objectExpenditures.rows,
      allotmentClasses: allotmentClasses.rows,
      wfpSources: wfpSources.rows,
      fundGroups: [
        "All", "Main", "BGD", "Other Funds", "DOST", "DA", "CHED", "LAPAZ"
      ]
    });
  } catch (error) {
    console.error("RBUD master-data error:", error);
    res.status(500).json({ error: error.message });
  }
});



/*
|--------------------------------------------------------------------------
| FEE MONITORING
|--------------------------------------------------------------------------
| Uses dedicated fee tables so fee collection records do not duplicate or
| alter existing RBUD transaction rows.
*/
// Fee Monitoring is restricted to Administration and Budget roles only.
// The role normalizer returns canonical title-case role names.
const feeAccessAllowed = (req) => {
  const authUser = getRbudAuthUser(req);
  const role = normalizeRbudRoleValue(authUser?.role || authUser?.user_role || authUser?.userRole);
  return ["Administration", "Budget"].includes(role);
};

router.get("/fees", async (req, res) => {
  if (!feeAccessAllowed(req)) {
    return res.status(403).json({ error: "Fee Monitoring is restricted to Administrator and Budget roles." });
  }
  try {
    const fy = year(req.query.year);
    const result = await pool.query(
      `SELECT * FROM rbud_fee_monitoring WHERE fiscal_year = $1 ORDER BY fee_category, particulars, campus, id DESC`,
      [fy]
    );
    res.json({ rows: result.rows, fiscal_year: fy });
  } catch (error) {
    console.error("RBUD fee monitoring list error:", error);
    res.status(500).json({ error: error.message, code: error.code || null });
  }
});

router.post("/fees", async (req, res) => {
  if (!feeAccessAllowed(req)) return res.status(403).json({ error: "Fee Monitoring is restricted to Administrator and Budget roles." });
  const b = req.body || {};
  const category = String(b.fee_category || "").trim();
  const particulars = String(b.particulars || "").trim();
  const campus = String(b.campus || "").trim();
  const validCategories = ["Fiduciary Fees", "Non-Fiduciary Fees"];
  if (!validCategories.includes(category) || !particulars || !campus) {
    return res.status(400).json({ error: "Select a valid fee category, particulars, and campus from Master Data." });
  }
  const amounts = ["billing_amount", "collected_amount", "obligated_amount", "disbursed_amount"].map((k) => Number(b[k] || 0));
  if (amounts.some((n) => !Number.isFinite(n) || n < 0)) return res.status(400).json({ error: "Amounts must be valid non-negative numbers." });
  try {
    const campusCheck = await pool.query("SELECT 1 FROM campuses WHERE is_active = TRUE AND LOWER(TRIM(name)) = LOWER(TRIM($1)) LIMIT 1", [campus]);
    if (!campusCheck.rowCount) return res.status(400).json({ error: "Select an active campus from Master Data." });
    const result = await pool.query(
      `INSERT INTO rbud_fee_monitoring (fiscal_year, fee_category, particulars, campus, billing_period, reference_no, billing_amount, collected_amount, obligated_amount, disbursed_amount, remarks, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [Number(b.fiscal_year) || new Date().getFullYear(), category, particulars, campus, b.billing_period || null, b.reference_no || null, ...amounts, b.remarks || null, getRbudAuthUser(req)?.id ?? getRbudAuthUser(req)?.user_id ?? null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("RBUD fee monitoring create error:", error);
    res.status(500).json({ error: error.message, code: error.code || null });
  }
});

router.put("/fees/:id", async (req, res) => {
  if (!feeAccessAllowed(req)) return res.status(403).json({ error: "Fee Monitoring is restricted to Administrator and Budget roles." });
  const b = req.body || {};
  const category = String(b.fee_category || "").trim();
  const particulars = String(b.particulars || "").trim();
  const campus = String(b.campus || "").trim();
  if (!["Fiduciary Fees", "Non-Fiduciary Fees"].includes(category) || !particulars || !campus) {
    return res.status(400).json({ error: "Select a valid fee category, particulars, and campus from Master Data." });
  }
  const amounts = ["billing_amount", "collected_amount", "obligated_amount", "disbursed_amount"].map((k) => Number(b[k] || 0));
  if (amounts.some((n) => !Number.isFinite(n) || n < 0)) return res.status(400).json({ error: "Amounts must be valid non-negative numbers." });
  try {
    const campusCheck = await pool.query("SELECT 1 FROM campuses WHERE is_active = TRUE AND LOWER(TRIM(name)) = LOWER(TRIM($1)) LIMIT 1", [campus]);
    if (!campusCheck.rowCount) return res.status(400).json({ error: "Select an active campus from Master Data." });
    const result = await pool.query(
      `UPDATE rbud_fee_monitoring SET fiscal_year=$1, fee_category=$2, particulars=$3, campus=$4, billing_period=$5, reference_no=$6, billing_amount=$7, collected_amount=$8, obligated_amount=$9, disbursed_amount=$10, remarks=$11, updated_by=$12, updated_at=CURRENT_TIMESTAMP WHERE id=$13 RETURNING *`,
      [Number(b.fiscal_year) || new Date().getFullYear(), category, particulars, campus, b.billing_period || null, b.reference_no || null, ...amounts, b.remarks || null, getRbudAuthUser(req)?.id ?? getRbudAuthUser(req)?.user_id ?? null, int(req.params.id)]
    );
    if (!result.rows.length) return res.status(404).json({ error: "Fee record not found." });
    res.json(result.rows[0]);
  } catch (error) {
    console.error("RBUD fee monitoring update error:", error);
    res.status(500).json({ error: error.message, code: error.code || null });
  }
});

// Enrollment counts and WFP reference amounts are stored separately from actual fee transactions.
router.get("/fee-enrollment", async (req, res) => {
  if (!feeAccessAllowed(req)) return res.status(403).json({ error: "Fee Monitoring is restricted to Administrator and Budget roles." });
  try {
    const fy = year(req.query.year);
    const result = await pool.query(`SELECT * FROM rbud_fee_enrollment WHERE fiscal_year=$1 ORDER BY campus, billing_period`, [fy]);
    res.json({ rows: result.rows, fiscal_year: fy });
  } catch (error) {
    console.error("RBUD fee enrollment list error:", error);
    res.status(500).json({ error: error.message, code: error.code || null });
  }
});

router.post("/fee-enrollment", async (req, res) => {
  if (!feeAccessAllowed(req)) return res.status(403).json({ error: "Fee Monitoring is restricted to Administrator and Budget roles." });
  const b = req.body || {};
  const fy = Number(b.fiscal_year) || new Date().getFullYear();
  const campus = String(b.campus || "").trim();
  const period = String(b.billing_period || "").trim();
  const count = Number(b.enrollee_count);
  if (!campus || !period || !Number.isInteger(count) || count < 0) return res.status(400).json({ error: "Campus, semester/billing period, and a non-negative whole enrollee count are required." });
  try {
    const campusCheck = await pool.query("SELECT 1 FROM campuses WHERE is_active=TRUE AND LOWER(TRIM(name))=LOWER(TRIM($1)) LIMIT 1", [campus]);
    if (!campusCheck.rowCount) return res.status(400).json({ error: "Select an active campus from Master Data." });
    const result = await pool.query(
      `INSERT INTO rbud_fee_enrollment (fiscal_year, campus, billing_period, enrollee_count, created_by, updated_by)
       VALUES ($1,$2,$3,$4,$5,$5)
       ON CONFLICT (fiscal_year, campus, billing_period) DO UPDATE SET enrollee_count=EXCLUDED.enrollee_count, updated_by=EXCLUDED.updated_by, updated_at=CURRENT_TIMESTAMP
       RETURNING *`,
      [fy, campus, period, count, getRbudAuthUser(req)?.id ?? getRbudAuthUser(req)?.user_id ?? null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("RBUD fee enrollment save error:", error);
    res.status(500).json({ error: error.message, code: error.code || null });
  }
});

router.get("/fee-budget-reference", async (req, res) => {
  if (!feeAccessAllowed(req)) return res.status(403).json({ error: "Fee Monitoring is restricted to Administrator and Budget roles." });
  try {
    const fy = year(req.query.year);
    const result = await pool.query(`SELECT * FROM rbud_fee_budget_reference WHERE fiscal_year=$1 ORDER BY fee_category, particulars, campus`, [fy]);
    res.json({ rows: result.rows, fiscal_year: fy });
  } catch (error) {
    console.error("RBUD fee budget reference list error:", error);
    res.status(500).json({ error: error.message, code: error.code || null });
  }
});

router.post("/fee-budget-reference", async (req, res) => {
  if (!feeAccessAllowed(req)) return res.status(403).json({ error: "Fee Monitoring is restricted to Administrator and Budget roles." });
  const b = req.body || {};
  const fy = Number(b.fiscal_year) || new Date().getFullYear();
  const campus = String(b.campus || "").trim();
  const category = String(b.fee_category || "").trim();
  const particulars = String(b.particulars || "").trim();
  const amount = Number(b.budget_amount);
  if (!campus || !["Fiduciary Fees", "Non-Fiduciary Fees"].includes(category) || !particulars || !Number.isFinite(amount) || amount < 0) return res.status(400).json({ error: "Campus, valid fee category, particular, and non-negative WFP amount are required." });
  try {
    const campusCheck = await pool.query("SELECT 1 FROM campuses WHERE is_active=TRUE AND LOWER(TRIM(name))=LOWER(TRIM($1)) LIMIT 1", [campus]);
    if (!campusCheck.rowCount) return res.status(400).json({ error: "Select an active campus from Master Data." });
    const result = await pool.query(
      `INSERT INTO rbud_fee_budget_reference (fiscal_year, campus, fee_category, particulars, budget_amount, source_reference, created_by, updated_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$7)
       ON CONFLICT (fiscal_year, campus, fee_category, particulars) DO UPDATE SET budget_amount=EXCLUDED.budget_amount, source_reference=EXCLUDED.source_reference, updated_by=EXCLUDED.updated_by, updated_at=CURRENT_TIMESTAMP
       RETURNING *`,
      [fy, campus, category, particulars, amount, String(b.source_reference || "WFP PRE sheet").trim(), getRbudAuthUser(req)?.id ?? getRbudAuthUser(req)?.user_id ?? null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("RBUD fee budget reference save error:", error);
    res.status(500).json({ error: error.message, code: error.code || null });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = int(req.params.id);

    const result = await pool.query(
      `
      SELECT
        r.*,

        fc.code AS fund_cluster_code,
        fc.name AS fund_cluster_name,

        fs.code AS fund_source_code,
        fs.name AS fund_source_name,

        c.code AS campus_code,
        c.name AS campus_name,

        rc.code AS responsibility_center_code,
        rc.name AS responsibility_center_name,

        pap.code AS pap_code,
        pap.name AS pap_name,

        mfo.code AS mfo_code,
        mfo.name AS mfo_name,

        uacs.code AS uacs_code,
        uacs.old_code AS uacs_old_code,
        uacs.account_title AS uacs_account_title,
        uacs.account_title,

        ac.code AS allotment_class_code,
        ac.name AS allotment_class_name,

        old_uacs.code AS old_uacs_code,
        old_uacs.account_title AS old_uacs_account_title,

        ws.code AS wfp_source_master_code,
        ws.name AS wfp_source_name,

        (${FUND_GROUP_CASE}) AS fund_group,

        CASE
          WHEN COALESCE(r.disbursement_amount, 0) > 0 THEN 'Disbursed'
          WHEN COALESCE(r.utilization_amount, 0) > 0 THEN 'Utilized'
          ELSE COALESCE(NULLIF(TRIM(r.status), ''), 'Approved')
        END AS derived_status,

        COALESCE(
          NULLIF(TRIM(rc.name), ''),
          NULLIF(TRIM(c.name), ''),
          ''
        ) AS department_name

      FROM rbud_entries r

      LEFT JOIN fund_clusters fc
        ON fc.id = r.fund_cluster_id

      LEFT JOIN fund_sources fs
        ON fs.id = r.fund_source_id

      LEFT JOIN campuses c
        ON c.id = r.campus_id

      LEFT JOIN responsibility_centers rc
        ON rc.id =
           r.responsibility_center_id

      LEFT JOIN pap
        ON pap.id = r.pap_id

      LEFT JOIN mfo
        ON mfo.id = r.mfo_id

      LEFT JOIN uacs_codes uacs
        ON uacs.id = r.uacs_code_id

      LEFT JOIN allotment_classes ac
        ON ac.id = r.allotment_class_id

      LEFT JOIN uacs_codes old_uacs
        ON old_uacs.id = r.old_uacs_code_id

      LEFT JOIN wfp_sources ws
        ON ws.id = r.wfp_source_id

      WHERE r.id = $1
      `,
      [id]
    );

    if (
      result.rows.length === 0
    ) {
      return res.status(404).json({
        error:
          "RBUD record not found.",
      });
    }

    const row = result.rows[0];

    res.json({
      ...row,

      // Keep the same derived values used by the RBUD transaction list.
      status: row.derived_status || row.status || "Approved",
      fund_group: row.fund_group || "Other Funds",
      department:
        row.department_name ||
        row.responsibility_center_name ||
        row.campus_name ||
        "—",

      // Normalize numeric values so the View modal never receives
      // PostgreSQL numeric strings/nulls unexpectedly.
      utilization_amount: num(row.utilization_amount),
      ps_utilization: num(row.ps_utilization),
      mooe_utilization: num(row.mooe_utilization),
      co_utilization: num(row.co_utilization),
      disbursement_amount: num(row.disbursement_amount),
      unpaid_utilization: num(row.unpaid_utilization),
      running_balance: num(row.running_balance),

      fiscal_year:
        row.fiscal_year ||
        (row.entry_date ? new Date(row.entry_date).getFullYear() : null),

      month:
        row.month ||
        (row.entry_date ? new Date(row.entry_date).getMonth() + 1 : null),

      quarter:
        row.quarter ||
        (row.entry_date
          ? Math.ceil((new Date(row.entry_date).getMonth() + 1) / 3)
          : null),

      old_uacs_code:
        row.old_uacs_code ||
        row.old_uacs_account_title ||
        row.uacs_old_code ||
        row.old_uacs_code_id ||
        null,

      account_title:
        row.account_title ||
        row.uacs_account_title ||
        null,

      wfp_source_code:
        row.wfp_source_code ||
        row.wfp_source_master_code ||
        null,
    });
  } catch (error) {
    console.error(
      "RBUD get record error:",
      error
    );

    res.status(500).json({
      error: error.message,
    });
  }
});

/*
|--------------------------------------------------------------------------
| CREATE RBUD RECORD
|--------------------------------------------------------------------------
*/

const RBUD_FIELDS = [
  "registry_no",
  "entry_date",
  "fund_cluster_id",
  "fund_source_id",
  "campus_id",
  "fund_code",
  "burs_serial_no",
  "serial_no_transferred",
  "payee",
  "particulars",
  "responsibility_center_id",
  "pap_id",
  "uacs_code_id",
  "ref_no",
  "allotment_class_id",
  "uacs_funding_source_code",
  "fiscal_year",
  "month",
  "series",
  "series2",
  "quarter",
  "mfo_id",
  "old_uacs_code_id",
  "account_title",
  "utilization_amount",
  "ps_utilization",
  "mooe_utilization",
  "co_utilization",
  "wfp_source_id",
  "wfp_source_code",
  "disbursement_amount",
  "running_balance",
  "remarks",
  "unpaid_utilization",
];

const ID_FIELDS = [
  "fund_cluster_id",
  "fund_source_id",
  "campus_id",
  "responsibility_center_id",
  "pap_id",
  "uacs_code_id",
  "allotment_class_id",
  "mfo_id",
  "old_uacs_code_id",
  "wfp_source_id",
];

const NUMERIC_FIELDS = [
  "month",
  "quarter",
  "utilization_amount",
  "ps_utilization",
  "mooe_utilization",
  "co_utilization",
  "disbursement_amount",
  "running_balance",
  "unpaid_utilization",
];

/*
|-------------------------------------------------------------------------- 
| RBUD ROLE-BASED FIELD PERMISSIONS
|-------------------------------------------------------------------------- 
| The role must come from the authenticated request (req.user / req.auth).
| The client is never trusted to choose its own role.
|-------------------------------------------------------------------------- 
*/

const RBUD_SYSTEM_FIELDS = new Set([
  "registry_no",
  "burs_serial_no",
  "running_balance",
  "month",
  "series",
  "series2",
  "quarter",
  "uacs_funding_source_code",
  "wfp_source_code",
  "old_uacs_code_id",
  "account_title",
  "unpaid_utilization",
]);

// Object of Expenditure is intentionally not part of the RBUD transaction workflow.
// The legacy DB column remains for compatibility with existing analytics/data.
const RBUD_BUDGET_EDIT_FIELDS = new Set([
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
]);




/*
|--------------------------------------------------------------------------
| RBUD AUDIT TRAIL
|--------------------------------------------------------------------------
*/

function normalizeRbudRoleValue(value) {
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
  if (["accountant", "accounting"].includes(raw)) {
    return "Accountant";
  }
  if (["procurement", "procurement officer"].includes(raw)) {
    return "Procurement";
  }

  return "";
}

function getRbudAuthUser(req) {
  const user = req.user || req.auth || req.session?.user || {};
  return user?.user || user;
}

function auditActor(req) {
  const user = getRbudAuthUser(req);
  const id = user.id ?? user.user_id ?? user.userId ?? null;
  const email = user.email ?? user.user_email ?? null;
  const name =
    user.name ??
    user.full_name ??
    (
      [user.first_name, user.last_name]
        .filter(Boolean)
        .join(" ") ||
      user.username ||
      email ||
      "Unknown User"
    );

  return {
    id: id === null || id === undefined ? null : String(id),
    name: String(name || "Unknown User"),
    email: email ? String(email) : null,
    role: normalizeRbudRoleValue(user.role),
  };
}

async function writeRbudAudit(client, {
  req,
  entryId,
  action,
  registryNo = null,
  changedFields = [],
  oldValues = null,
  newValues = null,
}) {
  const actor = auditActor(req);

  await client.query(
    `
      INSERT INTO rbud_audit_trail (
        rbud_entry_id,
        registry_no,
        action,
        performed_by_id,
        performed_by_name,
        performed_by_email,
        performed_by_role,
        changed_fields,
        old_values,
        new_values
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9::jsonb,$10::jsonb)
    `,
    [
      entryId ?? null,
      registryNo ?? null,
      action,
      actor.id,
      actor.name,
      actor.email,
      actor.role,
      JSON.stringify(changedFields || []),
      JSON.stringify(oldValues ?? null),
      JSON.stringify(newValues ?? null),
    ]
  );
}

function auditChangedFields(oldRow, newRow) {
  return RBUD_FIELDS.filter((field) =>
    String(oldRow?.[field] ?? "") !== String(newRow?.[field] ?? "")
  );
}

function rbudRole(req) {
  const user = getRbudAuthUser(req);
  return normalizeRbudRoleValue(user?.role);
}

function rbudEditableFields(role) {
  if (role === "Administration") {
    return new Set(
      RBUD_FIELDS.filter((field) => !RBUD_SYSTEM_FIELDS.has(field))
    );
  }

  if (role === "Budget") return RBUD_BUDGET_EDIT_FIELDS;

  return new Set();
}

function requireRbudCreateRole(req, res) {
  const role = rbudRole(req);

  if (!["Administration", "Budget"].includes(role)) {
    res.status(403).json({
      error: "Your role is not allowed to create RBUD transactions.",
    });
    return null;
  }

  return role;
}

function requireRbudEditRole(req, res) {
  const role = rbudRole(req);

  if (!["Administration", "Budget"].includes(role)) {
    res.status(403).json({
      error: "Your role is not allowed to edit RBUD transactions.",
    });
    return null;
  }

  return role;
}

function requireRbudDeleteRole(req, res) {
  const role = rbudRole(req);

  if (role !== "Administration") {
    res.status(403).json({
      error: "Only Administration can delete RBUD transactions.",
    });
    return null;
  }

  return role;
}

async function recalculateRbudFinancialFields(client, entryId) {
  const currentResult = await client.query(
    `SELECT * FROM rbud_entries WHERE id = $1`,
    [entryId]
  );

  if (!currentResult.rows.length) {
    throw new Error("RBUD record not found while calculating financial fields.");
  }

  const row = currentResult.rows[0];

  // Approved Budget comes from approved budget_items, not from a value typed
  // into the RBUD transaction form. Match the same budget dimensions used by
  // the RBUD Budget & Allocation view, excluding the retired Object of
  // Expenditure dimension.
  const budgetResult = await client.query(
    `
      SELECT COALESCE(SUM(bi.approved_budget), 0) AS approved_budget
      FROM budget_items bi
      LEFT JOIN budget_proposals bp
        ON bp.proposal_id = bi.budget_proposal_id
      WHERE bi.fiscal_year = $1
        AND (
          bi.budget_proposal_id IS NULL
          OR bp.status = 'Approved'
        )
        AND bi.fund_cluster_id IS NOT DISTINCT FROM $2
        AND bi.fund_source_id IS NOT DISTINCT FROM $3
        AND bi.campus_id IS NOT DISTINCT FROM $4
        AND bi.responsibility_center_id IS NOT DISTINCT FROM $5
        AND bi.mfo_id IS NOT DISTINCT FROM $6
        AND bi.pap_id IS NOT DISTINCT FROM $7
        AND bi.uacs_code_id IS NOT DISTINCT FROM $8
        AND bi.allotment_class_id IS NOT DISTINCT FROM $9
    `,
    [
      row.fiscal_year,
      row.fund_cluster_id,
      row.fund_source_id,
      row.campus_id,
      row.responsibility_center_id,
      row.mfo_id,
      row.pap_id,
      row.uacs_code_id,
      row.allotment_class_id,
    ]
  );

  const utilizationResult = await client.query(
    `
      SELECT COALESCE(SUM(r.utilization_amount), 0) AS utilized_amount
      FROM rbud_entries r
      WHERE r.fiscal_year = $1
        AND r.fund_cluster_id IS NOT DISTINCT FROM $2
        AND r.fund_source_id IS NOT DISTINCT FROM $3
        AND r.campus_id IS NOT DISTINCT FROM $4
        AND r.responsibility_center_id IS NOT DISTINCT FROM $5
        AND r.mfo_id IS NOT DISTINCT FROM $6
        AND r.pap_id IS NOT DISTINCT FROM $7
        AND r.uacs_code_id IS NOT DISTINCT FROM $8
        AND r.allotment_class_id IS NOT DISTINCT FROM $9
    `,
    [
      row.fiscal_year,
      row.fund_cluster_id,
      row.fund_source_id,
      row.campus_id,
      row.responsibility_center_id,
      row.mfo_id,
      row.pap_id,
      row.uacs_code_id,
      row.allotment_class_id,
    ]
  );

  const approvedBudget = num(budgetResult.rows[0]?.approved_budget);
  const cumulativeUtilization = num(utilizationResult.rows[0]?.utilized_amount);
  const unpaidUtilization = Math.max(
    0,
    num(row.utilization_amount) - num(row.disbursement_amount)
  );
  const runningBalance = approvedBudget - cumulativeUtilization;

  const updatedResult = await client.query(
    `
      UPDATE rbud_entries
      SET
        running_balance = $1,
        unpaid_utilization = $2
      WHERE id = $3
      RETURNING *
    `,
    [runningBalance, unpaidUtilization, entryId]
  );

  return updatedResult.rows[0];
}

async function resolveWfpSourceId(body) {
  if (body.wfp_source_id) return body.wfp_source_id;

  const value = String(body.wfp_source || body.wfp_source_code || "").trim();
  if (!value) return null;

  const result = await pool.query(
    `SELECT id
       FROM wfp_sources
      WHERE LOWER(COALESCE(code, '')) = LOWER($1)
         OR LOWER(COALESCE(name, '')) = LOWER($1)
      ORDER BY id
      LIMIT 1`,
    [value]
  );

  return result.rows[0]?.id ?? null;
}

async function validateFundClusterCode(fundClusterId, fundCode) {
  const clusterId = Number(fundClusterId);
  const code = String(fundCode ?? "").trim();

  if (!Number.isInteger(clusterId) || clusterId <= 0 || !code) {
    return { valid: false, reason: "Fund Cluster and Fund Code are required." };
  }

  // Validate the dependent relationship against the new Fund Codes master data.
  // If the migration is not installed yet, do not break legacy RBUD records.
  const tableCheck = await pool.query(`SELECT to_regclass('public.fund_codes') AS table_name`);
  if (!tableCheck.rows[0]?.table_name) {
    return { valid: true, skipped: true };
  }

  const result = await pool.query(`
    SELECT fcd.id
    FROM fund_codes fcd
    WHERE fcd.fund_cluster_id = $1
      AND LOWER(TRIM(fcd.code)) = LOWER(TRIM($2))
      AND fcd.is_active = TRUE
    LIMIT 1
  `, [clusterId, code]);

  return result.rowCount > 0
    ? { valid: true }
    : { valid: false, reason: "The selected Fund Code does not belong to the selected Fund Cluster." };
}

function fieldValue(field, body) {
  // PostgreSQL requires month 1-12 and quarter 1-4 when values are provided.
  // Keep them NULL when the form field is blank instead of converting blank to 0.
  if (field === "month" || field === "quarter") {
    const raw = body[field];
    if (raw === undefined || raw === null || String(raw).trim() === "") {
      return null;
    }
    const value = Number(raw);
    if (!Number.isInteger(value)) {
      throw new Error(`${field} must be a whole number.`);
    }
    const max = field === "month" ? 12 : 4;
    if (value < 1 || value > max) {
      throw new Error(`${field} must be between 1 and ${max}.`);
    }
    return value;
  }

  if (field === "wfp_source_id") {
    return body.wfp_source_id || body._resolved_wfp_source_id || null;
  }

  if (ID_FIELDS.includes(field)) {
    return body[field] || null;
  }

  if (
    NUMERIC_FIELDS.includes(field)
  ) {
    return num(body[field]);
  }

  if (field === "fiscal_year") {
    return (
      body[field] ||
      (
        body.entry_date
          ? new Date(
              body.entry_date
            ).getFullYear()
          : new Date().getFullYear()
      )
    );
  }

  return body[field] ?? null;
}

router.post("/", async (req, res) => {
  const role = requireRbudCreateRole(req, res);
  if (!role) return;

  const client = await pool.connect();

  try {
    if (!req.body.entry_date) {
      return res.status(400).json({
        error: "Entry date is required.",
      });
    }

    await client.query("BEGIN");

    const editable = rbudEditableFields(role);
    const body = {};

    // Only fields assigned to the creator's role are accepted.
    for (const field of editable) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        body[field] = req.body[field];
      }
    }

    const fundValidation = await validateFundClusterCode(
      body.fund_cluster_id,
      body.fund_code
    );

    if (!fundValidation.valid) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: fundValidation.reason });
    }

    // Generated identifiers are server-owned and client-supplied values are ignored.
    body.registry_no = await generateRegistryNo(client, body.fiscal_year || year(body.entry_date));
    body.burs_serial_no = await generateBursSerialNo(client, body.entry_date, body.fiscal_year);

    // These are derived from Entry Date on the server so the transaction
    // cannot store a mismatched month/quarter supplied by the browser.
    const entryDate = new Date(`${body.entry_date}T00:00:00`);
    if (!Number.isNaN(entryDate.getTime())) {
      body.month = entryDate.getMonth() + 1;
      body.quarter = Math.ceil(body.month / 3);
    }

    body._resolved_wfp_source_id = await resolveWfpSourceId(body);

    if (body.wfp_source && !body._resolved_wfp_source_id) {
      return res.status(400).json({
        error: "WFP Source was not found in the WFP master data.",
      });
    }

    const values = RBUD_FIELDS.map((field) => fieldValue(field, body));
    const actor = auditActor(req);
    const actorValues = [actor.name, actor.role];
    const placeholders = RBUD_FIELDS.map((_, i) => `$${i + 1}`);
    const createdByNameParam = RBUD_FIELDS.length + 1;
    const createdByRoleParam = RBUD_FIELDS.length + 2;

    const result = await client.query(
      `
        INSERT INTO rbud_entries (
          ${RBUD_FIELDS.join(",")},
          created_by_name,
          created_by_role
        )
        VALUES (
          ${placeholders.join(",")},
          $${createdByNameParam},
          $${createdByRoleParam}
        )
        RETURNING *
      `,
      [...values, ...actorValues]
    );

    const createdRow = await recalculateRbudFinancialFields(
      client,
      result.rows[0].id
    );

    await writeRbudAudit(client, {
      req,
      entryId: createdRow.id,
      registryNo: createdRow.registry_no,
      action: "CREATE",
      changedFields: RBUD_FIELDS.filter((field) =>
        createdRow[field] !== null &&
        createdRow[field] !== undefined &&
        String(createdRow[field]) !== ""
      ),
      oldValues: null,
      newValues: createdRow,
    });

    await client.query("COMMIT");

    res.status(201).json(createdRow);
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (_) {
      // Ignore rollback errors and return the original database error.
    }

    console.error("RBUD create error:", error);

    if (error.code === "23505") {
      return res.status(409).json({
        error: "Registry No. already exists. Please enter a unique Registry No.",
      });
    }

    res.status(500).json({
      error: error.message,
    });
  } finally {
    client.release();
  }
});


/*
|--------------------------------------------------------------------------
| UPDATE RBUD RECORD
|--------------------------------------------------------------------------
*/

router.put("/:id", async (req, res) => {
  const role = requireRbudEditRole(req, res);
  if (!role) return;

  try {
    const existingResult = await pool.query(
      `SELECT * FROM rbud_entries WHERE id = $1`,
      [req.params.id]
    );

    if (!existingResult.rows.length) {
      return res.status(404).json({
        error: "RBUD record not found.",
      });
    }

    const existing = existingResult.rows[0];
    const editable = rbudEditableFields(role);

    /*
     * Merge only fields assigned to the current role.
     * This prevents non-Budget roles from overwriting Budget-owned
     * values even if the client submits the complete form payload.
     */
    const body = { ...existing };

    for (const field of editable) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        body[field] = req.body[field];
      }
    }

    const fundValidation = await validateFundClusterCode(
      body.fund_cluster_id,
      body.fund_code
    );

    if (!fundValidation.valid) {
      return res.status(400).json({ error: fundValidation.reason });
    }

    // Generated/system-derived values remain immutable or recalculated by the server.
    body.registry_no = existing.registry_no;
    body.burs_serial_no = existing.burs_serial_no;

    // Keep derived date parts synchronized when Entry Date is edited.
    const entryDate = new Date(`${body.entry_date}T00:00:00`);
    if (!Number.isNaN(entryDate.getTime())) {
      body.month = entryDate.getMonth() + 1;
      body.quarter = Math.ceil(body.month / 3);
    }

    body._resolved_wfp_source_id = await resolveWfpSourceId(body);

    if (body.wfp_source && !body._resolved_wfp_source_id) {
      return res.status(400).json({
        error: "WFP Source was not found in the WFP master data.",
      });
    }

    const values = RBUD_FIELDS.map((field) => fieldValue(field, body));
    const actor = auditActor(req);

    const sets = RBUD_FIELDS.map(
      (field, i) => `${field} = $${i + 1}`
    );

    const updatedByNameParam = RBUD_FIELDS.length + 1;
    const updatedByRoleParam = RBUD_FIELDS.length + 2;
    const idParam = RBUD_FIELDS.length + 3;

    const result = await pool.query(
      `
        UPDATE rbud_entries
        SET
          ${sets.join(",")},
          updated_by_name = $${updatedByNameParam},
          updated_by_role = $${updatedByRoleParam},
          updated_at = CURRENT_TIMESTAMP

        WHERE id = $${idParam}

        RETURNING *
      `,
      [
        ...values,
        actor.name,
        actor.role,
        req.params.id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "RBUD record not found.",
      });
    }

    const updatedRow = await recalculateRbudFinancialFields(
      pool,
      result.rows[0].id
    );
    const changedFields = auditChangedFields(existing, updatedRow);

    if (changedFields.length > 0) {
      const oldValues = {};
      const newValues = {};

      for (const field of changedFields) {
        oldValues[field] = existing[field];
        newValues[field] = updatedRow[field];
      }

      await writeRbudAudit(pool, {
        req,
        entryId: updatedRow.id,
        registryNo: updatedRow.registry_no,
        action: "UPDATE",
        changedFields,
        oldValues,
        newValues,
      });
    }

    res.json(updatedRow);
  } catch (error) {
    console.error("RBUD role-based update error:", error);

    res.status(500).json({
      error: error.message,
    });
  }
});

/*
|--------------------------------------------------------------------------
| DELETE RBUD RECORD
|--------------------------------------------------------------------------
*/

router.delete(
  "/:id",
  async (req, res) => {
    const role = requireRbudDeleteRole(req, res);
    if (!role) return;

    try {
      const result =
        await pool.query(
          `
          DELETE FROM rbud_entries

          WHERE id = $1

          RETURNING *
          `,
          [req.params.id]
        );

      if (
        result.rows.length === 0
      ) {
        return res.status(404).json({
          error:
            "RBUD record not found.",
        });
      }

      const deletedRow = result.rows[0];

      await writeRbudAudit(pool, {
        req,
        entryId: deletedRow.id,
        registryNo: deletedRow.registry_no,
        action: "DELETE",
        changedFields: RBUD_FIELDS,
        oldValues: deletedRow,
        newValues: null,
      });

      res.json({
        message:
          "RBUD record deleted successfully.",
      });
    } catch (error) {
      console.error(
        "RBUD delete error:",
        error
      );

      res.status(500).json({
        error: error.message,
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| ADD DEPARTMENT / UNIT
|--------------------------------------------------------------------------
*/

router.post(
  "/departments",
  async (req, res) => {
    try {
      const {
        code,
        name,
        description,
      } = req.body;

      if (
        !name ||
        !name.trim()
      ) {
        return res.status(400).json({
          error:
            "Department / Unit name is required.",
        });
      }

      const finalCode =
        code &&
        code.trim()
          ? code.trim()
          : `RC-${Date.now()}`;

      const result =
        await pool.query(
          `
          INSERT INTO responsibility_centers (
            code,
            name,
            description,
            is_active
          )

          VALUES (
            $1,
            $2,
            $3,
            TRUE
          )

          RETURNING *
          `,
          [
            finalCode,
            name.trim(),
            description || null,
          ]
        );

      res.status(201).json(
        result.rows[0]
      );
    } catch (error) {
      console.error(
        "RBUD department create error:",
        error
      );

      if (
        error.code === "23505"
      ) {
        return res.status(409).json({
          error:
            "Department / Unit code already exists.",
        });
      }

      res.status(500).json({
        error: error.message,
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| PROGRAM / ACTIVITY - GET
|--------------------------------------------------------------------------
*/

router.get(
  "/programs",
  async (req, res) => {
    const fy = year(req.query.year);

    const department =
      req.query.department ||
      req.query.department_id ||
      "";

    try {
      const params = [fy];

      let where = `
        WHERE bi.fiscal_year = $1
      `;

      if (department) {
        params.push(department);

        where += `
          AND bi.responsibility_center_id =
              $2
        `;
      }

      const result =
        await pool.query(
          `
          SELECT
            COALESCE(
              pap.code,
              mfo.code,
              uacs.code,
              'N/A'
            ) AS code,

            COALESCE(
              pap.name,
              mfo.name,
              uacs.account_title,
              bi.notes,
              'Unclassified'
            ) AS name,

            COALESCE(
              SUM(
                bi.approved_budget
              ),
              0
            ) AS approved

          FROM budget_items bi

          LEFT JOIN pap
            ON pap.id = bi.pap_id

          LEFT JOIN mfo
            ON mfo.id = bi.mfo_id

          LEFT JOIN uacs_codes uacs
            ON uacs.id =
               bi.uacs_code_id

          ${where}

          GROUP BY
            1,
            2

          ORDER BY
            1
          `,
          params
        );

      res.json({
        fiscalYear: fy,

        programs:
          result.rows.map(
            (row) => ({
              code: row.code,

              name: row.name,

              approved_budget:
                num(row.approved),
            })
          ),
      });
    } catch (error) {
      console.error(
        "RBUD programs error:",
        error
      );

      res.status(500).json({
        error: error.message,
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| PROGRAM / ACTIVITY - CREATE
|--------------------------------------------------------------------------
*/

router.post(
  "/programs",
  async (req, res) => {
    try {
      const {
        code,
        name,
        description,
      } = req.body;

      if (
        !name ||
        !name.trim()
      ) {
        return res.status(400).json({
          error:
            "Program / Activity name is required.",
        });
      }

      const finalCode =
        code &&
        code.trim()
          ? code.trim()
          : `PAP-${Date.now()}`;

      const result =
        await pool.query(
          `
          INSERT INTO pap (
            code,
            name,
            description,
            is_active
          )

          VALUES (
            $1,
            $2,
            $3,
            TRUE
          )

          RETURNING *
          `,
          [
            finalCode,
            name.trim(),
            description || null,
          ]
        );

      res.status(201).json(
        result.rows[0]
      );
    } catch (error) {
      console.error(
        "RBUD program create error:",
        error
      );

      if (
        error.code === "23505"
      ) {
        return res.status(409).json({
          error:
            "Program / Activity code already exists.",
        });
      }

      res.status(500).json({
        error: error.message,
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| EXPORT
|--------------------------------------------------------------------------
*/

router.get(
  "/export",
  async (req, res) => {
    try {
      const fy =
        year(req.query.year);

      const group =
        req.query.group || "All";

      const result =
        await pool.query(
          `
          SELECT
            r.registry_no,
            r.entry_date,

            (${FUND_GROUP_CASE})
              AS fund_group,

            fc.code AS fund_cluster_code,
            fc.name AS fund_cluster_name,
            r.fund_code,
            c.name AS campus_name,
            r.registry_no,
            r.burs_serial_no,
            r.serial_no_transferred,
            r.payee,
            r.particulars,
            rc.name AS responsibility_center,
            r.ref_no,
            r.uacs_funding_source_code,
            r.fiscal_year,
            r.month,
            r.series,
            r.series2,
            r.quarter,
            r.utilization_amount,
            r.ps_utilization,
            r.mooe_utilization,
            r.co_utilization,
            r.wfp_source_code,
                r.disbursement_amount,
            r.running_balance,
            r.remarks,
            r.unpaid_utilization,
                            
            (${STATUS_CASE})
              AS status

          FROM rbud_entries r

          LEFT JOIN fund_clusters fc
            ON fc.id =
               r.fund_cluster_id

          LEFT JOIN fund_sources fs
            ON fs.id =
               r.fund_source_id

          LEFT JOIN responsibility_centers rc
            ON rc.id =
               r.responsibility_center_id 

          LEFT JOIN campuses c
            ON c.id = r.campus_id

          WHERE r.fiscal_year = $1

            AND (
              $2 = 'All'

              OR (${FUND_GROUP_CASE}) = $2
            )

          ORDER BY
            r.entry_date DESC,
            r.id DESC
          `,
          [
            fy,
            group,
          ]
        );

      res.json({
        fiscalYear: fy,
        group,
        rows: result.rows,
      });
    } catch (error) {
      console.error(
        "RBUD export error:",
        error
      );

      res.status(500).json({
        error: error.message,
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| EXPORT ROUTER
|--------------------------------------------------------------------------
*/

module.exports = router;