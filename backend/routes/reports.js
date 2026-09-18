// ============================================================
// BMAS - FINANCIAL REPORTS ROUTES
// routes/reports.js
// ============================================================

const express = require("express");
const { Pool } = require("pg");
const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");

const router = express.Router();

// ============================================================
// DATABASE
// ============================================================

const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "bmas_db",
  password: process.env.DB_PASSWORD || "12345678",
  port: Number(process.env.DB_PORT || 5432),
});

// ============================================================
// HELPERS
// ============================================================

const num = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const int = (value, fallback = 0) => {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
};

const getYear = (value) => {
  const n = int(value, 0);
  return n > 0 ? n : new Date().getFullYear();
};

const pct = (value, total) => {
  const v = num(value);
  const t = num(total);

  if (t <= 0) return 0;

  return Number(((v / t) * 100).toFixed(2));
};

const safeDate = (value) => {
  if (!value) return null;

  const d = new Date(value);

  if (Number.isNaN(d.getTime())) {
    return null;
  }

  return d;
};

const money = (value) =>
  num(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

// ============================================================
// FUND GROUP CLASSIFICATION
// Matches RBUD / RAOD fund groups
// ============================================================

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

// ============================================================
// REPORT FILTERS
// ============================================================

const getFilters = (req) => ({
  fiscalYear: getYear(req.query.year),

  fundClusterId:
    req.query.fund_cluster_id !== undefined &&
    req.query.fund_cluster_id !== ""
      ? int(req.query.fund_cluster_id)
      : null,

  fundSourceId:
    req.query.fund_source_id !== undefined &&
    req.query.fund_source_id !== ""
      ? int(req.query.fund_source_id)
      : null,

  responsibilityCenterId:
    req.query.responsibility_center_id !== undefined &&
    req.query.responsibility_center_id !== ""
      ? int(req.query.responsibility_center_id)
      : null,

  papId:
    req.query.pap_id !== undefined &&
    req.query.pap_id !== ""
      ? int(req.query.pap_id)
      : null,

  mfoId:
    req.query.mfo_id !== undefined &&
    req.query.mfo_id !== ""
      ? int(req.query.mfo_id)
      : null,

  objectExpenditureId:
    req.query.object_expenditure_id !== undefined &&
    req.query.object_expenditure_id !== ""
      ? int(req.query.object_expenditure_id)
      : null,

  group: req.query.group || "All",
});

// ============================================================
// SOURCE FILTER BUILDER
// ============================================================

const buildFilters = ({
  alias,
  fiscalYear,
  fundClusterId,
  fundSourceId,
  responsibilityCenterId,
  papId,
  mfoId,
  objectExpenditureId,
}) => {
  const params = [fiscalYear];

  const conditions = [
    `${alias}.fiscal_year = $1`,
  ];

  if (fundClusterId !== null) {
    params.push(fundClusterId);

    conditions.push(
      `${alias}.fund_cluster_id = $${params.length}`
    );
  }

  if (fundSourceId !== null) {
    params.push(fundSourceId);

    conditions.push(
      `${alias}.fund_source_id = $${params.length}`
    );
  }

  if (responsibilityCenterId !== null) {
    params.push(responsibilityCenterId);

    conditions.push(
      `${alias}.responsibility_center_id = $${params.length}`
    );
  }

  if (papId !== null) {
    params.push(papId);

    conditions.push(
      `${alias}.pap_id = $${params.length}`
    );
  }

  if (mfoId !== null) {
    params.push(mfoId);

    conditions.push(
      `${alias}.mfo_id = $${params.length}`
    );
  }

  if (objectExpenditureId !== null) {
    params.push(objectExpenditureId);

    conditions.push(
      `${alias}.object_expenditure_id = $${params.length}`
    );
  }

  return {
    conditions,
    params,
  };
};

// ============================================================
// SHIFT SQL PLACEHOLDERS
// ============================================================

const shiftPlaceholders = (conditions, offset) =>
  conditions.map((condition) =>
    condition.replace(
      /\$(\d+)/g,
      (_, number) =>
        `$${Number(number) + offset}`
    )
  );

// ============================================================
// REFERENCES
// ============================================================

router.get("/references", async (req, res) => {
  try {
    const [
      fundSources,
      fundClusters,
      responsibilityCenters,
      pap,
      mfo,
      objectExpenditures,
    ] = await Promise.all([
      pool.query(`
        SELECT id, code, name
        FROM fund_sources
        WHERE is_active = TRUE
        ORDER BY code, name
      `),

      pool.query(`
        SELECT
          fc.id,
          fc.code,
          fc.name,
          fc.fund_source_id,
          fs.code AS fund_source_code,
          fs.name AS fund_source_name
        FROM fund_clusters fc
        LEFT JOIN fund_sources fs
          ON fs.id = fc.fund_source_id
        WHERE fc.is_active = TRUE
        ORDER BY fc.code, fc.name
      `),

      pool.query(`
        SELECT id, code, name, description
        FROM responsibility_centers
        WHERE is_active = TRUE
        ORDER BY code, name
      `),

      pool.query(`
        SELECT id, code, name, description
        FROM pap
        WHERE is_active = TRUE
        ORDER BY code, name
      `),

      pool.query(`
        SELECT id, code, name, description
        FROM mfo
        WHERE is_active = TRUE
        ORDER BY code, name
      `),

      pool.query(`
        SELECT id, code, name
        FROM object_expenditures
        WHERE is_active = TRUE
        ORDER BY code, name
      `),
    ]);

    res.json({
      fund_sources: fundSources.rows,
      fund_clusters: fundClusters.rows,
      responsibility_centers:
        responsibilityCenters.rows,
      departments:
        responsibilityCenters.rows,
      pap: pap.rows,
      mfo: mfo.rows,
      object_expenditures:
        objectExpenditures.rows,

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
      "Financial Reports references error:",
      error
    );

    res.status(500).json({
      error: error.message,
    });
  }
});

// ============================================================
// SUMMARY
// GET /api/financial-reports/summary
//
// Combines:
// budget_items
// RBUD Registry
// RAOD Registry
// ============================================================

router.get("/summary", async (req, res) => {
  const filters = getFilters(req);

  try {
    const budget = buildFilters({
      alias: "bi",
      ...filters,
    });

    const rbud = buildFilters({
      alias: "r",
      ...filters,
    });

    const raod = buildFilters({
      alias: "a",
      ...filters,
    });

    const budgetResult = await pool.query(
      `
      SELECT
        COALESCE(SUM(bi.approved_budget), 0)
          AS approved_budget,

        COALESCE(SUM(bi.ps_amount), 0)
          AS ps_budget,

        COALESCE(SUM(bi.mooe_amount), 0)
          AS mooe_budget,

        COALESCE(SUM(bi.co_amount), 0)
          AS co_budget

      FROM budget_items bi

      LEFT JOIN fund_clusters fc
        ON fc.id = bi.fund_cluster_id

      LEFT JOIN fund_sources fs
        ON fs.id = bi.fund_source_id

      WHERE
        ${budget.conditions.join("\nAND ")}
      `,
      budget.params
    );

    const rbudResult = await pool.query(
      `
      SELECT
        COUNT(*)::int AS records,

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

      WHERE
        ${rbud.conditions.join("\nAND ")}
      `,
      rbud.params
    );

    const raodResult = await pool.query(
      `
      SELECT
        COUNT(*)::int AS records,

        COALESCE(
          SUM(a.allotment_amount),
          0
        ) AS allotment,

        COALESCE(
          SUM(a.obligation_amount),
          0
        ) AS obligation,

        COALESCE(
          SUM(a.disbursement_amount),
          0
        ) AS disbursement

      FROM raod_entries a

      LEFT JOIN fund_clusters fc
        ON fc.id = a.fund_cluster_id

      LEFT JOIN fund_sources fs
        ON fs.id = a.fund_source_id

      WHERE
        ${raod.conditions.join("\nAND ")}
      `,
      raod.params
    );

    const b = budgetResult.rows[0];
    const r = rbudResult.rows[0];
    const a = raodResult.rows[0];

    const approvedBudget =
      num(b.approved_budget);

    const rbudUtilized =
      num(r.utilized);

    const rbudDisbursed =
      num(r.disbursed);

    const raodAllotment =
      num(a.allotment);

    const raodObligation =
      num(a.obligation);

    const raodDisbursement =
      num(a.disbursement);

    // --------------------------------------------------------
    // Overall totals
    // --------------------------------------------------------

    const totalObligations =
      raodObligation;

    const totalDisbursements =
      raodDisbursement +
      rbudDisbursed;

    const remainingBalance =
      Math.max(
        approvedBudget -
          rbudUtilized,
        0
      );

    const unobligatedBalance =
      Math.max(
        raodAllotment -
          raodObligation,
        0
      );

    const undisbursedUtilization =
      Math.max(
        rbudUtilized -
          rbudDisbursed,
        0
      );

    res.json({
      fiscal_year:
        filters.fiscalYear,

      filters: {
        fund_cluster_id:
          filters.fundClusterId,

        fund_source_id:
          filters.fundSourceId,

        responsibility_center_id:
          filters.responsibilityCenterId,

        pap_id:
          filters.papId,

        mfo_id:
          filters.mfoId,

        object_expenditure_id:
          filters.objectExpenditureId,
      },

      budget: {
        approved:
          approvedBudget,

        ps:
          num(b.ps_budget),

        mooe:
          num(b.mooe_budget),

        co:
          num(b.co_budget),
      },

      utilization: {
        utilized:
          rbudUtilized,

        remaining_balance:
          remainingBalance,

        utilization_rate:
          pct(
            rbudUtilized,
            approvedBudget
          ),

        unpaid_utilization:
          num(r.unpaid),
      },

      disbursement: {
        disbursed:
          totalDisbursements,

        rbud_disbursed:
          rbudDisbursed,

        raod_disbursed:
          raodDisbursement,

        undisbursed_utilization:
          undisbursedUtilization,

        disbursement_rate:
          pct(
            totalDisbursements,
            rbudUtilized + raodObligation
          ),
      },

      raod: {
        records:
          int(a.records),

        allotment:
          raodAllotment,

        obligation:
          raodObligation,

        disbursement:
          raodDisbursement,

        unobligated_balance:
          unobligatedBalance,

        undisbursed_obligation:
          Math.max(
            raodObligation -
              raodDisbursement,
            0
          ),
      },

      rbud: {
        records:
          int(r.records),

        utilized:
          rbudUtilized,

        disbursed:
          rbudDisbursed,

        unpaid:
          num(r.unpaid),
      },

      overall: {
        total_budget:
          approvedBudget,

        total_obligations:
          totalObligations,

        total_disbursements:
          totalDisbursements,

        total_balance:
          remainingBalance,
      },
    });
  } catch (error) {
    console.error(
      "Financial Reports summary error:",
      error
    );

    res.status(500).json({
      error:
        "Failed to load financial summary.",
      details:
        error.message,
    });
  }
});

// ============================================================
// FUND GROUP REPORT
// GET /api/financial-reports/fund-groups
// ============================================================

router.get(
  "/fund-groups",
  async (req, res) => {
    const filters = getFilters(req);

    try {
      const result =
        await pool.query(`
        WITH groups AS (
          SELECT unnest(
            ARRAY[
              'Main',
              'BGD',
              'Other Funds',
              'DOST',
              'DA',
              'CHED',
              'LAPAZ'
            ]
          ) AS fund_group
        ),

        budget AS (
          SELECT
            (${FUND_GROUP_CASE})
              AS fund_group,

            COUNT(DISTINCT bi.fund_cluster_id)
              AS num_funds,

            COALESCE(
              SUM(bi.approved_budget),
              0
            ) AS budget

          FROM budget_items bi

          LEFT JOIN fund_clusters fc
            ON fc.id = bi.fund_cluster_id

          LEFT JOIN fund_sources fs
            ON fs.id = bi.fund_source_id

          WHERE bi.fiscal_year = $1

          GROUP BY
            (${FUND_GROUP_CASE})
        ),

        rbud AS (
          SELECT
            (${FUND_GROUP_CASE})
              AS fund_group,

            COALESCE(
              SUM(r.utilization_amount),
              0
            ) AS utilized,

            COALESCE(
              SUM(r.disbursement_amount),
              0
            ) AS disbursed

          FROM rbud_entries r

          LEFT JOIN fund_clusters fc
            ON fc.id = r.fund_cluster_id

          LEFT JOIN fund_sources fs
            ON fs.id = r.fund_source_id

          WHERE r.fiscal_year = $1

          GROUP BY
            (${FUND_GROUP_CASE})
        ),

        raod AS (
          SELECT
            (${FUND_GROUP_CASE})
              AS fund_group,

            COALESCE(
              SUM(a.allotment_amount),
              0
            ) AS allotment,

            COALESCE(
              SUM(a.obligation_amount),
              0
            ) AS obligation,

            COALESCE(
              SUM(a.disbursement_amount),
              0
            ) AS disbursement

          FROM raod_entries a

          LEFT JOIN fund_clusters fc
            ON fc.id = a.fund_cluster_id

          LEFT JOIN fund_sources fs
            ON fs.id = a.fund_source_id

          WHERE a.fiscal_year = $1

          GROUP BY
            (${FUND_GROUP_CASE})
        )

        SELECT
          g.fund_group,

          COALESCE(
            b.num_funds,
            0
          ) AS num_funds,

          COALESCE(
            b.budget,
            0
          ) AS approved_budget,

          COALESCE(
            r.utilized,
            0
          ) AS utilized,

          COALESCE(
            r.disbursed,
            0
          ) AS disbursed,

          COALESCE(
            a.allotment,
            0
          ) AS allotment,

          COALESCE(
            a.obligation,
            0
          ) AS obligation,

          COALESCE(
            a.disbursement,
            0
          ) AS raod_disbursement

        FROM groups g

        LEFT JOIN budget b
          ON b.fund_group =
             g.fund_group

        LEFT JOIN rbud r
          ON r.fund_group =
             g.fund_group

        LEFT JOIN raod a
          ON a.fund_group =
             g.fund_group

        ORDER BY
          CASE g.fund_group
            WHEN 'Main' THEN 1
            WHEN 'BGD' THEN 2
            WHEN 'Other Funds' THEN 3
            WHEN 'DOST' THEN 4
            WHEN 'DA' THEN 5
            WHEN 'CHED' THEN 6
            WHEN 'LAPAZ' THEN 7
            ELSE 99
          END
        `, [
          filters.fiscalYear,
        ]);

      res.json({
        fiscal_year:
          filters.fiscalYear,

        fund_groups:
          result.rows.map((row) => {
            const budget =
              num(row.approved_budget);

            const utilized =
              num(row.utilized);

            return {
              fund_group:
                row.fund_group,

              num_funds:
                int(row.num_funds),

              approved_budget:
                budget,

              utilized,

              remaining_balance:
                Math.max(
                  budget -
                    utilized,
                  0
                ),

              disbursed:
                num(row.disbursed),

              allotment:
                num(row.allotment),

              obligation:
                num(row.obligation),

              raod_disbursement:
                num(
                  row.raod_disbursement
                ),

              utilization_rate:
                pct(
                  utilized,
                  budget
                ),
            };
          }),
      });
    } catch (error) {
      console.error(
        "Fund groups report error:",
        error
      );

      res.status(500).json({
        error:
          "Failed to generate fund group report.",
        details:
          error.message,
      });
    }
  }
);

// ============================================================
// DEPARTMENTS
// GET /api/financial-reports/departments
// ============================================================

router.get(
  "/departments",
  async (req, res) => {
    const filters = getFilters(req);

    try {
      const budgetFilters =
        buildFilters({
          alias: "bi",
          ...filters,
        });

      const rbudFilters =
        buildFilters({
          alias: "r",
          ...filters,
        });

      const budgetConditions =
        budgetFilters.conditions;

      const rbudConditions =
        shiftPlaceholders(
          rbudFilters.conditions,
          budgetFilters.params.length
        );

      const result =
        await pool.query(
          `
          WITH budget AS (
            SELECT
              bi.responsibility_center_id,

              COALESCE(
                SUM(
                  bi.approved_budget
                ),
                0
              ) AS approved_budget

            FROM budget_items bi

            LEFT JOIN fund_clusters fc
              ON fc.id =
                 bi.fund_cluster_id

            LEFT JOIN fund_sources fs
              ON fs.id =
                 bi.fund_source_id

            WHERE
              ${budgetConditions.join(
                "\nAND "
              )}

            GROUP BY
              bi.responsibility_center_id
          ),

          rbud AS (
            SELECT
              r.responsibility_center_id,

              COUNT(*)::int AS records,

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
              ) AS disbursed,

              COALESCE(
                SUM(
                  r.unpaid_utilization
                ),
                0
              ) AS unpaid

            FROM rbud_entries r

            LEFT JOIN fund_clusters fc
              ON fc.id =
                 r.fund_cluster_id

            LEFT JOIN fund_sources fs
              ON fs.id =
                 r.fund_source_id

            WHERE
              ${rbudConditions.join(
                "\nAND "
              )}

            GROUP BY
              r.responsibility_center_id
          )

          SELECT
            rc.id,
            rc.code,
            rc.name,
            rc.description,

            COALESCE(
              b.approved_budget,
              0
            ) AS approved_budget,

            COALESCE(
              r.records,
              0
            ) AS records,

            COALESCE(
              r.utilized,
              0
            ) AS utilized,

            COALESCE(
              r.disbursed,
              0
            ) AS disbursed,

            COALESCE(
              r.unpaid,
              0
            ) AS unpaid

          FROM responsibility_centers rc

          LEFT JOIN budget b
            ON b.responsibility_center_id =
               rc.id

          LEFT JOIN rbud r
            ON r.responsibility_center_id =
               rc.id

          WHERE
            rc.is_active = TRUE

            AND (
              COALESCE(
                b.approved_budget,
                0
              ) > 0

              OR

              COALESCE(
                r.records,
                0
              ) > 0
            )

          ORDER BY
            rc.name
          `,
          [
            ...budgetFilters.params,
            ...rbudFilters.params,
          ]
        );

      res.json({
        fiscal_year:
          filters.fiscalYear,

        departments:
          result.rows.map((row) => {
            const approved =
              num(row.approved_budget);

            const utilized =
              num(row.utilized);

            const disbursed =
              num(row.disbursed);

            return {
              id: row.id,

              code:
                row.code || "—",

              name:
                row.name || "—",

              description:
                row.description || "",

              records:
                int(row.records),

              approved_budget:
                approved,

              utilized,

              disbursed,

              remaining_balance:
                Math.max(
                  approved -
                    utilized,
                  0
                ),

              utilization_rate:
                pct(
                  utilized,
                  approved
                ),

              unpaid_utilization:
                num(row.unpaid),

              undisbursed_utilization:
                Math.max(
                  utilized -
                    disbursed,
                  0
                ),
            };
          }),
      });
    } catch (error) {
      console.error(
        "Department report error:",
        error
      );

      res.status(500).json({
        error:
          "Failed to generate department report.",
        details:
          error.message,
      });
    }
  }
);

// ============================================================
// MONTHLY REPORT
// GET /api/financial-reports/monthly
// ============================================================

router.get(
  "/monthly",
  async (req, res) => {
    const filters = getFilters(req);

    try {
      const rbudFilters =
        buildFilters({
          alias: "r",
          ...filters,
        });

      const raodFilters =
        buildFilters({
          alias: "a",
          ...filters,
        });

      const correctedRbud =
        rbudFilters.conditions;

      const correctedRaod =
        shiftPlaceholders(
          raodFilters.conditions,
          rbudFilters.params.length
        );

      const result =
        await pool.query(
          `
          WITH months AS (
            SELECT
              generate_series(
                1,
                12
              )::int AS month
          ),

          rbud AS (
            SELECT
              EXTRACT(
                MONTH
                FROM r.entry_date
              )::int AS month,

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
              ) AS disbursed,

              COALESCE(
                SUM(
                  r.unpaid_utilization
                ),
                0
              ) AS unpaid_utilization

            FROM rbud_entries r

            LEFT JOIN fund_clusters fc
              ON fc.id =
                 r.fund_cluster_id

            LEFT JOIN fund_sources fs
              ON fs.id =
                 r.fund_source_id

            WHERE
              ${correctedRbud.join(
                "\nAND "
              )}

            GROUP BY
              EXTRACT(
                MONTH
                FROM r.entry_date
              )
          ),

          raod AS (
            SELECT
              EXTRACT(
                MONTH
                FROM a.entry_date
              )::int AS month,

              COALESCE(
                SUM(
                  a.allotment_amount
                ),
                0
              ) AS allotment,

              COALESCE(
                SUM(
                  a.obligation_amount
                ),
                0
              ) AS obligation,

              COALESCE(
                SUM(
                  a.disbursement_amount
                ),
                0
              ) AS disbursement

            FROM raod_entries a

            LEFT JOIN fund_clusters fc
              ON fc.id =
                 a.fund_cluster_id

            LEFT JOIN fund_sources fs
              ON fs.id =
                 a.fund_source_id

            WHERE
              ${correctedRaod.join(
                "\nAND "
              )}

            GROUP BY
              EXTRACT(
                MONTH
                FROM a.entry_date
              )
          )

          SELECT
            m.month,

            COALESCE(
              rbud.utilized,
              0
            ) AS utilized,

            COALESCE(
              rbud.disbursed,
              0
            ) AS disbursed,

            COALESCE(
              rbud.unpaid_utilization,
              0
            ) AS unpaid_utilization,

            COALESCE(
              raod.allotment,
              0
            ) AS allotment,

            COALESCE(
              raod.obligation,
              0
            ) AS obligation,

            COALESCE(
              raod.disbursement,
              0
            ) AS raod_disbursement

          FROM months m

          LEFT JOIN rbud
            ON rbud.month =
               m.month

          LEFT JOIN raod
            ON raod.month =
               m.month

          ORDER BY
            m.month
          `,
          [
            ...rbudFilters.params,
            ...raodFilters.params,
          ]
        );

      res.json({
        fiscal_year:
          filters.fiscalYear,

        months:
          result.rows.map((row) => ({
            month:
              int(row.month),

            utilized:
              num(row.utilized),

            disbursed:
              num(row.disbursed),

            unpaid_utilization:
              num(
                row.unpaid_utilization
              ),

            allotment:
              num(row.allotment),

            obligation:
              num(row.obligation),

            raod_disbursement:
              num(
                row.raod_disbursement
              ),
          })),
      });
    } catch (error) {
      console.error(
        "Monthly report error:",
        error
      );

      res.status(500).json({
        error:
          "Failed to generate monthly report.",
        details:
          error.message,
      });
    }
  }
);

// ============================================================
// RAOD REPORT
// GET /api/financial-reports/raod
// ============================================================

router.get(
  "/raod",
  async (req, res) => {
    const filters = getFilters(req);

    try {
      const source =
        buildFilters({
          alias: "a",
          ...filters,
        });

      const result =
        await pool.query(
          `
          SELECT
            a.id,
            a.registry_no,
            a.entry_date,
            a.fiscal_year,

            fc.code
              AS fund_cluster_code,

            fc.name
              AS fund_cluster_name,

            fs.code
              AS fund_source_code,

            fs.name
              AS fund_source_name,

            rc.code
              AS responsibility_center_code,

            rc.name
              AS responsibility_center_name,

            pap.code
              AS pap_code,

            pap.name
              AS pap_name,

            a.payee,
            a.particulars,

            a.allotment_amount,
            a.obligation_amount,
            a.disbursement_amount,

            (
              COALESCE(
                a.allotment_amount,
                0
              )
              -
              COALESCE(
                a.obligation_amount,
                0
              )
            ) AS unobligated_balance,

            (
              COALESCE(
                a.obligation_amount,
                0
              )
              -
              COALESCE(
                a.disbursement_amount,
                0
              )
            ) AS undisbursed_balance

          FROM raod_entries a

          LEFT JOIN fund_clusters fc
            ON fc.id =
               a.fund_cluster_id

          LEFT JOIN fund_sources fs
            ON fs.id =
               a.fund_source_id

          LEFT JOIN responsibility_centers rc
            ON rc.id =
               a.responsibility_center_id

          LEFT JOIN pap
            ON pap.id =
               a.pap_id

          WHERE
            ${source.conditions.join(
              "\nAND "
            )}

          ORDER BY
            a.entry_date DESC,
            a.id DESC
          `,
          source.params
        );

      res.json({
        fiscal_year:
          filters.fiscalYear,

        records:
          result.rows.map((row) => ({
            ...row,

            allotment_amount:
              num(
                row.allotment_amount
              ),

            obligation_amount:
              num(
                row.obligation_amount
              ),

            disbursement_amount:
              num(
                row.disbursement_amount
              ),

            unobligated_balance:
              num(
                row.unobligated_balance
              ),

            undisbursed_balance:
              num(
                row.undisbursed_balance
              ),
          })),
      });
    } catch (error) {
      console.error(
        "RAOD financial report error:",
        error
      );

      res.status(500).json({
        error:
          "Failed to generate RAOD report.",
        details:
          error.message,
      });
    }
  }
);

// ============================================================
// RBUD REPORT
// GET /api/financial-reports/rbud
// ============================================================

router.get(
  "/rbud",
  async (req, res) => {
    const filters = getFilters(req);

    try {
      const source =
        buildFilters({
          alias: "r",
          ...filters,
        });

      const result =
        await pool.query(
          `
          SELECT
            r.id,
            r.registry_no,
            r.entry_date,
            r.fiscal_year,

            fc.code
              AS fund_cluster_code,

            fc.name
              AS fund_cluster_name,

            fs.code
              AS fund_source_code,

            fs.name
              AS fund_source_name,

            rc.code
              AS responsibility_center_code,

            rc.name
              AS responsibility_center_name,

            pap.code
              AS pap_code,

            pap.name
              AS pap_name,

            r.payee,
            r.particulars,

            r.utilization_amount,
            r.disbursement_amount,
            r.unpaid_utilization,
            r.running_balance

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

          LEFT JOIN pap
            ON pap.id =
               r.pap_id

          WHERE
            ${source.conditions.join(
              "\nAND "
            )}

          ORDER BY
            r.entry_date DESC,
            r.id DESC
          `,
          source.params
        );

      res.json({
        fiscal_year:
          filters.fiscalYear,

        records:
          result.rows.map((row) => ({
            ...row,

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

            running_balance:
              num(
                row.running_balance
              ),
          })),
      });
    } catch (error) {
      console.error(
        "RBUD financial report error:",
        error
      );

      res.status(500).json({
        error:
          "Failed to generate RBUD report.",
        details:
          error.message,
      });
    }
  }
);

// ============================================================
// EXPORT DATA
// ============================================================

router.get(
  "/export-data",
  async (req, res) => {
    const filters = getFilters(req);

    try {
      const raod =
        buildFilters({
          alias: "a",
          ...filters,
        });

      const rbud =
        buildFilters({
          alias: "r",
          ...filters,
        });

      const result =
        await pool.query(
          `
          SELECT
            'RAOD' AS source,

            a.id,
            a.registry_no,
            a.entry_date,
            a.fiscal_year,

            fc.code AS fund_cluster_code,
            fc.name AS fund_cluster_name,

            fs.code AS fund_source_code,
            fs.name AS fund_source_name,

            rc.code AS responsibility_center_code,
            rc.name AS responsibility_center_name,

            a.payee,
            a.particulars,

            a.allotment_amount,
            a.obligation_amount,
            a.disbursement_amount,

            0::numeric AS utilization_amount,
            0::numeric AS unpaid_utilization,
            0::numeric AS running_balance

          FROM raod_entries a

          LEFT JOIN fund_clusters fc
            ON fc.id =
               a.fund_cluster_id

          LEFT JOIN fund_sources fs
            ON fs.id =
               a.fund_source_id

          LEFT JOIN responsibility_centers rc
            ON rc.id =
               a.responsibility_center_id

          WHERE
            ${raod.conditions.join(
              "\nAND "
            )}

          UNION ALL

          SELECT
            'RBUD' AS source,

            r.id,
            r.registry_no,
            r.entry_date,
            r.fiscal_year,

            fc.code AS fund_cluster_code,
            fc.name AS fund_cluster_name,

            fs.code AS fund_source_code,
            fs.name AS fund_source_name,

            rc.code AS responsibility_center_code,
            rc.name AS responsibility_center_name,

            r.payee,
            r.particulars,

            0::numeric AS allotment_amount,
            0::numeric AS obligation_amount,
            0::numeric AS disbursement_amount,

            r.utilization_amount,
            r.unpaid_utilization,
            r.running_balance

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

          WHERE
            ${shiftPlaceholders(
              rbud.conditions,
              raod.params.length
            ).join("\nAND ")}

          ORDER BY
            entry_date DESC,
            id DESC
          `,
          [
            ...raod.params,
            ...rbud.params,
          ]
        );

      res.json({
        fiscal_year:
          filters.fiscalYear,

        records:
          result.rows.map((row) => ({
            ...row,

            allotment_amount:
              num(
                row.allotment_amount
              ),

            obligation_amount:
              num(
                row.obligation_amount
              ),

            disbursement_amount:
              num(
                row.disbursement_amount
              ),

            utilization_amount:
              num(
                row.utilization_amount
              ),

            unpaid_utilization:
              num(
                row.unpaid_utilization
              ),

            running_balance:
              num(
                row.running_balance
              ),
          })),
      });
    } catch (error) {
      console.error(
        "Financial export error:",
        error
      );

      res.status(500).json({
        error:
          "Failed to prepare financial export data.",
        details:
          error.message,
      });
    }
  }
);

// ============================================================
// GENERATE REPORT RECORD
// ============================================================

router.post(
  "/generate",
  async (req, res) => {
    const {
      report_name,
      report_type,
      category,
      type,
      fiscal_year,
      format,
      file_format,
      period_type,
      period_value,
      fund_cluster_id,
      generated_by,
    } = req.body;

    try {
      const finalReportType =
        report_type ||
        category ||
        type ||
        "Financial";

      const finalFormat =
        String(
          file_format ||
            format ||
            "PDF"
        ).toUpperCase();

      const finalYear =
        getYear(fiscal_year);

      const userId =
        generated_by !== undefined &&
        generated_by !== null &&
        generated_by !== ""
          ? int(generated_by, null)
          : null;

      const result =
        await pool.query(
          `
          INSERT INTO financial_reports (
            report_type,
            report_name,
            fiscal_year,
            period_type,
            period_value,
            fund_cluster_id,
            generated_by,
            file_format,
            status
          )

          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8,
            'Generated'
          )

          RETURNING *
          `,
          [
            finalReportType,
            report_name ||
              "Financial Report",
            finalYear,
            period_type ||
              "yearly",
            period_value ||
              String(finalYear),
            fund_cluster_id ||
              null,
            userId,
            finalFormat,
          ]
        );

      res.status(201).json({
        success: true,
        report:
          result.rows[0],
      });
    } catch (error) {
      console.error(
        "Generate financial report error:",
        error
      );

      res.status(500).json({
        error:
          "Failed to generate financial report.",
        details:
          error.message,
      });
    }
  }
);

// ============================================================
// GENERATED REPORTS
// GET /api/financial-reports
// ============================================================

router.get(
  "/",
  async (req, res) => {
    const page =
      Math.max(
        int(req.query.page, 1),
        1
      );

    const limit =
      Math.min(
        Math.max(
          int(req.query.limit, 10),
          1
        ),
        100
      );

    const offset =
      (page - 1) * limit;

    try {
      const result =
        await pool.query(
          `
          SELECT
            fr.id,
            fr.report_type,
            fr.report_name,
            fr.fiscal_year,
            fr.period_type,
            fr.period_value,
            fr.fund_cluster_id,
            fr.generated_by,
            fr.file_format,
            fr.file_path,
            fr.status,
            fr.created_at,

            u.full_name
              AS generated_by_name,

            u.department

          FROM financial_reports fr

          LEFT JOIN users u
            ON u.id =
               fr.generated_by

          ORDER BY
            fr.created_at DESC

          LIMIT $1
          OFFSET $2
          `,
          [
            limit,
            offset,
          ]
        );

      const count =
        await pool.query(`
          SELECT COUNT(*)::int AS total
          FROM financial_reports
        `);

      const total =
        int(
          count.rows[0].total
        );

      res.json({
        reports:
          result.rows,

        items:
          result.rows,

        totalItems:
          total,

        totalPages:
          Math.ceil(
            total / limit
          ),

        currentPage:
          page,
      });
    } catch (error) {
      console.error(
        "Generated reports error:",
        error
      );

      res.status(500).json({
        error: error.message,
      });
    }
  }
);

// ============================================================
// DELETE GENERATED REPORT
// ============================================================

router.delete(
  "/:id",
  async (req, res) => {
    try {
      const result =
        await pool.query(
          `
          DELETE FROM financial_reports
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
            "Report not found.",
        });
      }

      res.json({
        success: true,
        message:
          "Report deleted successfully.",
      });
    } catch (error) {
      console.error(
        "Delete report error:",
        error
      );

      res.status(500).json({
        error: error.message,
      });
    }
  }
);

// ============================================================
// PDF DOWNLOAD
// ============================================================

router.get(
  "/download/:id",
  async (req, res) => {
    try {
      const reportResult =
        await pool.query(
          `
          SELECT
            fr.*,

            u.full_name
              AS generated_by_name,

            fc.code
              AS fund_cluster_code,

            fc.name
              AS fund_cluster_name

          FROM financial_reports fr

          LEFT JOIN users u
            ON u.id =
               fr.generated_by

          LEFT JOIN fund_clusters fc
            ON fc.id =
               fr.fund_cluster_id

          WHERE fr.id = $1
          `,
          [req.params.id]
        );

      if (
        reportResult.rows.length === 0
      ) {
        return res.status(404).json({
          error:
            "Report not found.",
        });
      }

      const report =
        reportResult.rows[0];

      const doc =
        new PDFDocument({
          margin: 45,
          size: "A4",
        });

      const filename =
        `${String(
          report.report_name ||
            "Financial Report"
        ).replace(
          /[^a-z0-9-_ ]/gi,
          ""
        )}.pdf`;

      res.setHeader(
        "Content-Type",
        "application/pdf"
      );

      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );

      doc.pipe(res);

      // --------------------------------------------------------
      // REPORT HEADER
      // --------------------------------------------------------

      doc
        .font("Helvetica-Bold")
        .fontSize(18)
        .text(
          "BUDGET MONITORING & ALLOCATION SYSTEM",
          {
            align: "center",
          }
        );

      doc.moveDown(0.5);

      doc
        .fontSize(15)
        .text(
          report.report_name ||
            "Financial Report",
          {
            align: "center",
          }
        );

      doc.moveDown(0.3);

      doc
        .font("Helvetica")
        .fontSize(10)
        .text(
          `Fiscal Year: ${
            report.fiscal_year
          }`,
          {
            align: "center",
          }
        );

      if (
        report.period_value
      ) {
        doc.text(
          `Period: ${
            report.period_value
          }`,
          {
            align: "center",
          }
        );
      }

      doc.moveDown(1);

      // --------------------------------------------------------
      // SUMMARY
      // --------------------------------------------------------

      const summaryResult =
        await pool.query(
          `
          SELECT
            COALESCE(
              SUM(
                allotment_amount
              ),
              0
            ) AS allotment,

            COALESCE(
              SUM(
                obligation_amount
              ),
              0
            ) AS obligation,

            COALESCE(
              SUM(
                disbursement_amount
              ),
              0
            ) AS disbursement

          FROM raod_entries

          WHERE fiscal_year = $1
          `,
          [
            report.fiscal_year,
          ]
        );

      const rbudResult =
        await pool.query(
          `
          SELECT
            COALESCE(
              SUM(
                utilization_amount
              ),
              0
            ) AS utilized,

            COALESCE(
              SUM(
                disbursement_amount
              ),
              0
            ) AS disbursement,

            COALESCE(
              SUM(
                unpaid_utilization
              ),
              0
            ) AS unpaid

          FROM rbud_entries

          WHERE fiscal_year = $1
          `,
          [
            report.fiscal_year,
          ]
        );

      const s =
        summaryResult.rows[0];

      const r =
        rbudResult.rows[0];

      doc
        .font("Helvetica-Bold")
        .fontSize(12)
        .text(
          "FINANCIAL SUMMARY"
        );

      doc.moveDown(0.3);

      doc
        .font("Helvetica")
        .fontSize(10);

      doc.text(
        `RAOD Allotment:       ₱${money(
          s.allotment
        )}`
      );

      doc.text(
        `RAOD Obligation:      ₱${money(
          s.obligation
        )}`
      );

      doc.text(
        `RAOD Disbursement:    ₱${money(
          s.disbursement
        )}`
      );

      doc.text(
        `RBUD Utilized:        ₱${money(
          r.utilized
        )}`
      );

      doc.text(
        `RBUD Disbursement:    ₱${money(
          r.disbursement
        )}`
      );

      doc.text(
        `RBUD Unpaid:          ₱${money(
          r.unpaid
        )}`
      );

      doc.moveDown(1);

      // --------------------------------------------------------
      // RAOD TABLE
      // --------------------------------------------------------

      const raodResult =
        await pool.query(
          `
          SELECT
            registry_no,
            entry_date,
            payee,
            particulars,
            allotment_amount,
            obligation_amount,
            disbursement_amount

          FROM raod_entries

          WHERE fiscal_year = $1

          ORDER BY
            entry_date DESC,
            id DESC

          LIMIT 500
          `,
          [
            report.fiscal_year,
          ]
        );

      doc
        .font("Helvetica-Bold")
        .fontSize(12)
        .text(
          "RAOD REGISTRY"
        );

      doc.moveDown(0.3);

      raodResult.rows.forEach(
        (row) => {
          doc
            .font("Helvetica")
            .fontSize(8)
            .text(
              `${row.registry_no || "-"} | ` +
              `${row.entry_date || "-"} | ` +
              `${row.payee || "-"} | ` +
              `Allotment ₱${money(
                row.allotment_amount
              )} | ` +
              `Obligation ₱${money(
                row.obligation_amount
              )} | ` +
              `Disbursement ₱${money(
                row.disbursement_amount
              )}`
            );

          doc.moveDown(0.15);
        }
      );

      doc.addPage();

      // --------------------------------------------------------
      // RBUD TABLE
      // --------------------------------------------------------

      const rbudRows =
        await pool.query(
          `
          SELECT
            registry_no,
            entry_date,
            payee,
            particulars,
            utilization_amount,
            disbursement_amount,
            unpaid_utilization,
            running_balance

          FROM rbud_entries

          WHERE fiscal_year = $1

          ORDER BY
            entry_date DESC,
            id DESC

          LIMIT 500
          `,
          [
            report.fiscal_year,
          ]
        );

      doc
        .font("Helvetica-Bold")
        .fontSize(12)
        .text(
          "RBUD REGISTRY"
        );

      doc.moveDown(0.3);

      rbudRows.rows.forEach(
        (row) => {
          doc
            .font("Helvetica")
            .fontSize(8)
            .text(
              `${row.registry_no || "-"} | ` +
              `${row.entry_date || "-"} | ` +
              `${row.payee || "-"} | ` +
              `Utilized ₱${money(
                row.utilization_amount
              )} | ` +
              `Disbursed ₱${money(
                row.disbursement_amount
              )} | ` +
              `Balance ₱${money(
                row.running_balance
              )}`
            );

          doc.moveDown(0.15);
        }
      );

      doc.moveDown(1);

      doc
        .fontSize(8)
        .fillColor("#64748B")
        .text(
          `Generated by: ${
            report.generated_by_name ||
            "System"
          }`
        );

      doc.text(
        `Generated at: ${new Date().toLocaleString(
          "en-PH"
        )}`
      );

      doc.end();
    } catch (error) {
      console.error(
        "Report download error:",
        error
      );

      if (!res.headersSent) {
        res.status(500).json({
          error:
            "Failed to download report.",
          details:
            error.message,
        });
      }
    }
  }
);

// ============================================================
// TEST
// ============================================================

router.get(
  "/test",
  async (_req, res) => {
    try {
      await pool.query(
        "SELECT 1"
      );

      res.json({
        success: true,
        message:
          "Financial Reports API is working.",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error:
          error.message,
      });
    }
  }
);

// ============================================================
// EXPORT
// ============================================================

module.exports = router;