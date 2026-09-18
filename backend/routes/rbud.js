const express = require("express");
const router = express.Router();
const { Pool } = require("pg");

/*
|--------------------------------------------------------------------------
| DATABASE
|--------------------------------------------------------------------------
*/

const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "bmas_db",
  password: process.env.DB_PASSWORD || "12345678",
  port: Number(process.env.DB_PORT || 5432),
});

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
  WHEN NULLIF(TRIM(COALESCE(r.status, '')), '') IS NOT NULL
    THEN TRIM(r.status)

  WHEN COALESCE(r.disbursement_amount, 0) > 0
    THEN 'Disbursed'

  WHEN COALESCE(r.utilization_amount, 0) > 0
    THEN 'Obligated'

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

    let where = `
      WHERE r.fiscal_year = $1
    `;

    /*
    |--------------------------------------------------------------------------
    | FUND GROUP
    |--------------------------------------------------------------------------
    */

    if (group !== "All") {
      where += `
        AND (${FUND_GROUP_CASE}) = $${index}
      `;

      params.push(group);
      index++;
    }

    /*
    |--------------------------------------------------------------------------
    | FUND
    |--------------------------------------------------------------------------
    */

    if (fund && fund !== "All Funds") {
      where += `
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
    | STATUS
    |--------------------------------------------------------------------------
    */

    if (
      status &&
      status !== "All Status" &&
      status !== "All"
    ) {
      where += `
        AND (${STATUS_CASE}) = $${index}
      `;

      params.push(status);
      index++;
    }

    /*
    |--------------------------------------------------------------------------
    | SEARCH
    |--------------------------------------------------------------------------
    */

    if (search.trim()) {
      where += `
        AND (
          r.registry_no ILIKE $${index}
          OR COALESCE(r.payee, '') ILIKE $${index}
          OR COALESCE(r.particulars, '') ILIKE $${index}
          OR COALESCE(rc.name, '') ILIKE $${index}
          OR COALESCE(rc.code, '') ILIKE $${index}
          OR COALESCE(fc.name, '') ILIKE $${index}
          OR COALESCE(fc.code, '') ILIKE $${index}
          OR COALESCE(fs.name, '') ILIKE $${index}
          OR COALESCE(fs.code, '') ILIKE $${index}
        )
      `;

      params.push(`%${search.trim()}%`);
      index++;
    }

    /*
    |--------------------------------------------------------------------------
    | DATA
    |--------------------------------------------------------------------------
    */

    const dataResult = await pool.query(
      `
      SELECT
        r.id,
        r.registry_no,
        r.entry_date,
        r.fiscal_year,
        r.payee,
        r.particulars,

        r.utilization_amount,
        r.ps_utilization,
        r.mooe_utilization,
        r.co_utilization,

        r.disbursement_amount,
        r.running_balance,
        r.unpaid_utilization,
        r.po_no,
        r.status_of_po,

        r.burs_serial_no,
        r.dv_payroll_no,
        r.ref_no,
        r.remarks,

        r.fund_cluster_id,
        r.fund_source_id,
        r.campus_id,
        r.responsibility_center_id,
        r.pap_id,
        r.uacs_code_id,
        r.object_expenditure_id,
        r.mfo_id,

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

        oe.code AS object_expenditure_code,
        oe.name AS object_expenditure_name,

        uacs.code AS uacs_code,
        uacs.account_title,

        (${FUND_GROUP_CASE}) AS fund_group,

        (${STATUS_CASE}) AS derived_status,

        COALESCE(
          (
            SELECT SUM(bi.approved_budget)
            FROM budget_items bi
            WHERE bi.fiscal_year = r.fiscal_year

              AND bi.fund_cluster_id
                IS NOT DISTINCT FROM r.fund_cluster_id

              AND bi.fund_source_id
                IS NOT DISTINCT FROM r.fund_source_id

              AND bi.campus_id
                IS NOT DISTINCT FROM r.campus_id

              AND bi.responsibility_center_id
                IS NOT DISTINCT FROM r.responsibility_center_id

              AND bi.pap_id
                IS NOT DISTINCT FROM r.pap_id

              AND bi.mfo_id
                IS NOT DISTINCT FROM r.mfo_id

              AND bi.object_expenditure_id
                IS NOT DISTINCT FROM r.object_expenditure_id
          ),
          0
        ) AS approved_budget

      FROM rbud_entries r

      LEFT JOIN fund_clusters fc
        ON fc.id = r.fund_cluster_id

      LEFT JOIN fund_sources fs
        ON fs.id = r.fund_source_id

      LEFT JOIN campuses c
        ON c.id = r.campus_id

      LEFT JOIN responsibility_centers rc
        ON rc.id = r.responsibility_center_id

      LEFT JOIN pap
        ON pap.id = r.pap_id

      LEFT JOIN mfo
        ON mfo.id = r.mfo_id

      LEFT JOIN object_expenditures oe
        ON oe.id = r.object_expenditure_id

      LEFT JOIN uacs_codes uacs
        ON uacs.id = r.uacs_code_id

      ${where}

      ORDER BY
        r.entry_date DESC,
        r.id DESC

      LIMIT $${index}
      OFFSET $${index + 1}
      `,
      [
        ...params,
        pg.limit,
        pg.offset,
      ]
    );

    /*
    |--------------------------------------------------------------------------
    | COUNT
    |--------------------------------------------------------------------------
    */

    const countResult = await pool.query(
      `
      SELECT COUNT(*) AS total

      FROM rbud_entries r

      LEFT JOIN fund_clusters fc
        ON fc.id = r.fund_cluster_id

      LEFT JOIN fund_sources fs
        ON fs.id = r.fund_source_id

      LEFT JOIN campuses c
        ON c.id = r.campus_id

      LEFT JOIN responsibility_centers rc
        ON rc.id = r.responsibility_center_id

      ${where}
      `,
      params
    );

    const totalItems = int(
      countResult.rows[0].total
    );

    /*
    |--------------------------------------------------------------------------
    | FORMAT DATA
    |--------------------------------------------------------------------------
    */

    const entries = dataResult.rows.map((row) => {
      const approved = num(row.approved_budget);
      const utilized = num(row.utilization_amount);
      const disbursed = num(row.disbursement_amount);

      const balance = approved - utilized;

      return {
        ...row,

        fundGroup: row.fund_group,
        fund_group: row.fund_group,

        fund: row.fund_cluster_name,
        fund_code: row.fund_cluster_code,
        fund_cluster: row.fund_cluster_name,

        responsibility_center:
          row.responsibility_center_name,

        department_name:
          row.responsibility_center_name,

        campus: row.campus_name,

        approved_budget: approved,
        allocated_budget: approved,

        utilized,
        total_utilized: utilized,

        disbursed,
        total_disbursed: disbursed,

        remaining_balance: balance,
        available_balance: balance,

        utilized_percent: pct(
          utilized,
          approved
        ),

        status: row.derived_status,
      };
    });

    res.json({
      entries,

      page: pg.page,
      currentPage: pg.page,

      limit: pg.limit,

      totalItems,

      totalPages: Math.ceil(
        totalItems / pg.limit
      ),

      fiscalYear: fy,
      fiscal_year: fy,

      group,
      fund,
      status,
    });
  } catch (error) {
    console.error(
      "GET /api/rbud error:",
      error
    );

    res.status(500).json({
      error: error.message,
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
          SUM(r.unpaid_utilization),
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
  const group = req.query.group || "Main";
  const fund = req.query.fund || "";

  try {
    const params = [fy, group];

    let fundFilter = "";

    if (
      fund &&
      fund !== "All Funds"
    ) {
      params.push(`%${fund}%`);

      fundFilter = `
        AND (
          fc.code ILIKE $3
          OR fc.name ILIKE $3
        )
      `;
    }

    /*
    |--------------------------------------------------------------------------
    | RESPONSIBILITY CENTERS
    |--------------------------------------------------------------------------
    */

    const result = await pool.query(
      `
      WITH budget AS (
        SELECT
          bi.responsibility_center_id,

          SUM(
            bi.approved_budget
          ) AS approved_budget

        FROM budget_items bi

        LEFT JOIN fund_clusters fc
          ON fc.id = bi.fund_cluster_id

        LEFT JOIN fund_sources fs
          ON fs.id = bi.fund_source_id

        WHERE bi.fiscal_year = $1

          AND (${FUND_GROUP_CASE})
              = $2

          ${fundFilter}

        GROUP BY
          bi.responsibility_center_id
      ),

      rbud AS (
        SELECT
          r.responsibility_center_id,

          COUNT(*) AS records,

          SUM(
            r.utilization_amount
          ) AS utilized,

          SUM(
            r.disbursement_amount
          ) AS disbursed

        FROM rbud_entries r

        LEFT JOIN fund_clusters fc
          ON fc.id = r.fund_cluster_id

        LEFT JOIN fund_sources fs
          ON fs.id = r.fund_source_id

        WHERE r.fiscal_year = $1

          AND (${FUND_GROUP_CASE})
              = $2

          ${fundFilter}

        GROUP BY
          r.responsibility_center_id
      )

      SELECT
        rc.id,
        rc.code,
        rc.name,
        rc.description,

        COALESCE(
          budget.approved_budget,
          0
        ) AS approved_budget,

        COALESCE(
          rbud.utilized,
          0
        ) AS utilized,

        COALESCE(
          rbud.disbursed,
          0
        ) AS disbursed,

        COALESCE(
          rbud.records,
          0
        ) AS records

      FROM responsibility_centers rc

      LEFT JOIN budget
        ON budget.responsibility_center_id =
           rc.id

      LEFT JOIN rbud
        ON rbud.responsibility_center_id =
           rc.id

      WHERE rc.is_active = TRUE

        AND (
          COALESCE(
            budget.approved_budget,
            0
          ) > 0

          OR

          COALESCE(
            rbud.records,
            0
          ) > 0
        )

      ORDER BY
        rc.name
      `,
      params
    );

    let departments = result.rows.map(
      (row, index) => {
        const approved = num(
          row.approved_budget
        );

        const utilized = num(
          row.utilized
        );

        const disbursed = num(
          row.disbursed
        );

        return {
          id: row.id,

          code:
            row.code ||
            String.fromCharCode(
              65 + (index % 26)
            ),

          name: row.name,

          description:
            row.description || "",

          approved_budget: approved,

          utilized,

          disbursed,

          remaining_balance:
            approved - utilized,

          utilization_rate: pct(
            utilized,
            approved
          ),

          records: int(
            row.records
          ),

          is_fund_unit: false,
        };
      }
    );

    /*
    |--------------------------------------------------------------------------
    | FUND CLUSTER FALLBACK
    |--------------------------------------------------------------------------
    */

    if (
      departments.length === 0
    ) {
      const fallbackParams = [
        fy,
        group,
      ];

      let fallbackFundFilter = "";

      if (
        fund &&
        fund !== "All Funds"
      ) {
        fallbackParams.push(
          `%${fund}%`
        );

        fallbackFundFilter = `
          AND (
            fc.code ILIKE $3
            OR fc.name ILIKE $3
          )
        `;
      }

      const fallback =
        await pool.query(
          `
          SELECT
            fc.id,
            fc.code,
            fc.name,
            fc.description,

            COALESCE(
              (
                SELECT
                  SUM(
                    bi.approved_budget
                  )

                FROM budget_items bi

                WHERE bi.fiscal_year = $1

                  AND bi.fund_cluster_id =
                      fc.id
              ),
              0
            ) AS approved_budget,

            COALESCE(
              (
                SELECT
                  SUM(
                    r.utilization_amount
                  )

                FROM rbud_entries r

                WHERE r.fiscal_year = $1

                  AND r.fund_cluster_id =
                      fc.id
              ),
              0
            ) AS utilized,

            COALESCE(
              (
                SELECT
                  SUM(
                    r.disbursement_amount
                  )

                FROM rbud_entries r

                WHERE r.fiscal_year = $1

                  AND r.fund_cluster_id =
                      fc.id
              ),
              0
            ) AS disbursed,

            COALESCE(
              (
                SELECT
                  COUNT(*)

                FROM rbud_entries r

                WHERE r.fiscal_year = $1

                  AND r.fund_cluster_id =
                      fc.id
              ),
              0
            ) AS records

          FROM fund_clusters fc

          LEFT JOIN fund_sources fs
            ON fs.id = fc.fund_source_id

          WHERE fc.is_active = TRUE

            AND (${FUND_GROUP_CASE})
                = $2

            ${fallbackFundFilter}

          ORDER BY
            fc.code,
            fc.name
          `,
          fallbackParams
        );

      departments =
        fallback.rows.map(
          (row, index) => {
            const approved = num(
              row.approved_budget
            );

            const utilized = num(
              row.utilized
            );

            const disbursed = num(
              row.disbursed
            );

            return {
              id: row.id,

              code:
                row.code ||
                String(index + 1),

              name: row.name,

              description:
                row.description ||
                "Fund Cluster / Project Unit",

              approved_budget:
                approved,

              utilized,

              disbursed,

              remaining_balance:
                approved - utilized,

              utilization_rate:
                pct(
                  utilized,
                  approved
                ),

              records: int(
                row.records
              ),

              is_fund_unit: true,
            };
          }
        );
    }

    res.json({
      fiscalYear: fy,
      group,
      fund,

      departments,

      units: departments,

      total: departments.length,
    });
  } catch (error) {
    console.error(
      "RBUD departments error:",
      error
    );

    res.status(500).json({
      error: error.message,
    });
  }
});

/*
|--------------------------------------------------------------------------
| DEPARTMENT DETAIL
|--------------------------------------------------------------------------
*/

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
                oe.code,
                uacs.code,
                'N/A'
              ) AS code,

              COALESCE(
                pap.name,
                mfo.name,
                oe.name,
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

            LEFT JOIN object_expenditures oe
              ON oe.id =
                 bi.object_expenditure_id

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
                oe.code,
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

            LEFT JOIN object_expenditures oe
              ON oe.id =
                 r.object_expenditure_id

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
    let where = `WHERE bi.fiscal_year = $1`;

    if (group !== "All") {
      where += ` AND (${FUND_GROUP_CASE}) = $${i}`;
      params.push(group);
      i++;
    }

    if (search) {
      where += `
        AND (
          COALESCE(fc.code, '') ILIKE $${i}
          OR COALESCE(fc.name, '') ILIKE $${i}
          OR COALESCE(rc.code, '') ILIKE $${i}
          OR COALESCE(rc.name, '') ILIKE $${i}
          OR COALESCE(pap.code, '') ILIKE $${i}
          OR COALESCE(pap.name, '') ILIKE $${i}
          OR COALESCE(mfo.code, '') ILIKE $${i}
          OR COALESCE(mfo.name, '') ILIKE $${i}
          OR COALESCE(oe.code, '') ILIKE $${i}
          OR COALESCE(oe.name, '') ILIKE $${i}
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

        oe.code AS object_expenditure_code,
        oe.name AS object_expenditure_name,

        (${FUND_GROUP_CASE}) AS fund_group

      FROM budget_items bi
      LEFT JOIN fund_clusters fc ON fc.id = bi.fund_cluster_id
      LEFT JOIN fund_sources fs ON fs.id = bi.fund_source_id
      LEFT JOIN responsibility_centers rc
        ON rc.id = bi.responsibility_center_id
      LEFT JOIN pap ON pap.id = bi.pap_id
      LEFT JOIN mfo ON mfo.id = bi.mfo_id
      LEFT JOIN object_expenditures oe
        ON oe.id = bi.object_expenditure_id

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
      return acc;
    }, { approved_budget: 0, ps: 0, mooe: 0, co: 0 });

    res.json({
      fiscalYear: fy,
      group,
      rows: rows.rows.map(row => ({
        ...row,
        approved_budget: num(row.approved_budget),
        ps_amount: num(row.ps_amount),
        mooe_amount: num(row.mooe_amount),
        co_amount: num(row.co_amount)
      })),
      totals: {
        approved_budget: totals.approved_budget,
        ps: totals.ps,
        mooe: totals.mooe,
        co: totals.co
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
        COALESCE(SUM(r.unpaid_utilization), 0) AS unpaid,
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
        COALESCE(SUM(r.unpaid_utilization), 0) AS unpaid
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

        oe.code AS object_expenditure_code,
        oe.name AS object_expenditure_name,

        uacs.code AS uacs_code,
        uacs.account_title

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

      LEFT JOIN object_expenditures oe
        ON oe.id =
           r.object_expenditure_id

      LEFT JOIN uacs_codes uacs
        ON uacs.id = r.uacs_code_id

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

    res.json(result.rows[0]);
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
  "object_expenditure_id",
  "mfo_id",
  "old_uacs_code_id",
  "account_title",
  "utilization_amount",
  "ps_utilization",
  "mooe_utilization",
  "co_utilization",
  "wfp_source_id",
  "wfp_source_code",
  "dv_payroll_no",
  "disbursement_amount",
  "running_balance",
  "remarks",
  "unpaid_utilization",
  "po_no",
  "status_of_po",
];

const ID_FIELDS = [
  "fund_cluster_id",
  "fund_source_id",
  "campus_id",
  "responsibility_center_id",
  "pap_id",
  "uacs_code_id",
  "allotment_class_id",
  "object_expenditure_id",
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

function fieldValue(field, body) {
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
  try {
    if (
      !req.body.registry_no ||
      !req.body.entry_date
    ) {
      return res.status(400).json({
        error:
          "Registry number and entry date are required.",
      });
    }

    const values =
      RBUD_FIELDS.map(
        (field) =>
          fieldValue(
            field,
            req.body
          )
      );

    const placeholders =
      RBUD_FIELDS.map(
        (_, i) => `$${i + 1}`
      );

    const result =
      await pool.query(
        `
        INSERT INTO rbud_entries (
          ${RBUD_FIELDS.join(",")}
        )

        VALUES (
          ${placeholders.join(",")}
        )

        RETURNING *
        `,
        values
      );

    res.status(201).json(
      result.rows[0]
    );
  } catch (error) {
    console.error(
      "RBUD create error:",
      error
    );

    if (
      error.code === "23505"
    ) {
      return res.status(409).json({
        error:
          "Registry number already exists.",
      });
    }

    res.status(500).json({
      error: error.message,
    });
  }
});

/*
|--------------------------------------------------------------------------
| UPDATE RBUD RECORD
|--------------------------------------------------------------------------
*/

router.put("/:id", async (req, res) => {
  try {
    const values =
      RBUD_FIELDS.map(
        (field) =>
          fieldValue(
            field,
            req.body
          )
      );

    const sets =
      RBUD_FIELDS.map(
        (field, i) =>
          `${field} = $${i + 1}`
      );

    const result =
      await pool.query(
        `
        UPDATE rbud_entries

        SET
          ${sets.join(",")},

          updated_at =
            CURRENT_TIMESTAMP

        WHERE id =
              $${RBUD_FIELDS.length + 1}

        RETURNING *
        `,
        [
          ...values,
          req.params.id,
        ]
      );

    if (
      result.rows.length === 0
    ) {
      return res.status(404).json({
        error:
          "RBUD record not found.",
      });
    }

    res.json(
      result.rows[0]
    );
  } catch (error) {
    console.error(
      "RBUD update error:",
      error
    );

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
    try {
      const result =
        await pool.query(
          `
          DELETE FROM rbud_entries

          WHERE id = $1

          RETURNING id
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
              oe.code,
              uacs.code,
              'N/A'
            ) AS code,

            COALESCE(
              pap.name,
              mfo.name,
              oe.name,
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

          LEFT JOIN object_expenditures oe
            ON oe.id =
               bi.object_expenditure_id

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

            fc.code
              AS fund_code,

            fc.name
              AS fund,

            r.payee,
            r.particulars,

            rc.name
              AS responsibility_center,

            r.utilization_amount,

            r.disbursement_amount,
            r.running_balance,
            r.unpaid_utilization,
            r.po_no,
            r.status_of_po,

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