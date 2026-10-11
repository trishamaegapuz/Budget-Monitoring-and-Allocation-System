const express = require('express');
const router = express.Router();

const pool = require('../db');

/*
============================================================
BMAS DASHBOARD SUMMARY
============================================================

IMPORTANT DATABASE RELATIONSHIPS

RBUD:
- budget_items.fund_source_id -> fund_sources.id
- rbud_entries.fund_cluster_id -> fund_clusters.id
- fund_clusters.fund_source_id -> fund_sources.id

RAOD:
- budget_items.fund_cluster_id -> fund_clusters.id
- raod_entries.fund_cluster_id -> fund_clusters.id
- Fund Cluster 101 may be stored as "101 GENERAL FUND",
  not exactly "101".

The dashboard does not create or invent transaction data.
============================================================
*/

const money = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

router.get('/summary', async (req, res) => {
  try {
    const selectedYear =
      Number(req.query.year) || new Date().getFullYear();

    /*
    ============================================================
    1. RBUD APPROVED BUDGET
    ============================================================
    */
    const budgetRes = await pool.query(
      `
      SELECT
        COALESCE(SUM(bi.approved_budget), 0) AS total_budget
      FROM budget_items bi
      WHERE bi.fiscal_year = $1
        AND COALESCE(bi.status, 'Approved') = 'Approved'
      `,
      [selectedYear]
    );

    const totalBudget =
      money(budgetRes.rows[0]?.total_budget);

    /*
    ============================================================
    2. RBUD UTILIZATION / OBLIGATIONS
    ============================================================
    */
    const rbudObligationRes = await pool.query(
      `
      SELECT
        COALESCE(SUM(utilization_amount), 0) AS total_obligations
      FROM rbud_entries
      WHERE fiscal_year = $1
      `,
      [selectedYear]
    );

    const totalObligations =
      money(rbudObligationRes.rows[0]?.total_obligations);

    /*
    ============================================================
    3. RBUD DISBURSEMENTS
    ============================================================
    */
    const rbudDisbursementRes = await pool.query(
      `
      SELECT
        COALESCE(SUM(disbursement_amount), 0) AS total_disbursements
      FROM rbud_entries
      WHERE fiscal_year = $1
      `,
      [selectedYear]
    );

    const totalDisbursed =
      money(rbudDisbursementRes.rows[0]?.total_disbursements);

    /*
    ============================================================
    4. RBUD BALANCE
    ============================================================
    */
    const remainingBalance = Math.max(
      0,
      totalBudget - totalObligations
    );

    /*
    ============================================================
    5. RBUD RATES
    ============================================================
    */
    const utilizationRate =
      totalBudget > 0
        ? (totalObligations / totalBudget) * 100
        : 0;

    const disbursementRate =
      totalBudget > 0
        ? (totalDisbursed / totalBudget) * 100
        : 0;

    /*
    ============================================================
    6. BUDGET STATUS BY FUND SOURCE
    ============================================================

    FIX:
    rbud_entries does NOT use fund_source_id directly.

    Correct relationship:
    rbud_entries
        -> fund_clusters
        -> fund_sources

    We pre-aggregate budgets and RBUD transactions separately
    so budget amounts are NOT duplicated when multiple
    transactions exist for one fund source.
    ============================================================
    */

    const fundGroupRes = await pool.query(
      `
      WITH budget_by_source AS (
        SELECT
          bi.fund_source_id,
          COALESCE(SUM(bi.approved_budget), 0) AS budget
        FROM budget_items bi
        WHERE bi.fiscal_year = $1
          AND COALESCE(bi.status, 'Approved') = 'Approved'
        GROUP BY bi.fund_source_id
      ),

      rbud_by_source AS (
        SELECT
          fc.fund_source_id,
          COALESCE(SUM(r.utilization_amount), 0) AS obligations,
          COALESCE(SUM(r.disbursement_amount), 0) AS disbursements
        FROM rbud_entries r
        INNER JOIN fund_clusters fc
          ON fc.id = r.fund_cluster_id
        WHERE r.fiscal_year = $1
        GROUP BY fc.fund_source_id
      )

      SELECT
        fs.id,
        fs.code,
        COALESCE(fs.name, fs.code, 'Unknown') AS group_name,

        COALESCE(bbs.budget, 0) AS budget,

        COALESCE(rbs.obligations, 0) AS obligations,

        COALESCE(rbs.disbursements, 0) AS disbursements

      FROM fund_sources fs

      LEFT JOIN budget_by_source bbs
        ON bbs.fund_source_id = fs.id

      LEFT JOIN rbud_by_source rbs
        ON rbs.fund_source_id = fs.id

      WHERE
        COALESCE(bbs.budget, 0) > 0
        OR COALESCE(rbs.obligations, 0) > 0
        OR COALESCE(rbs.disbursements, 0) > 0

      ORDER BY budget DESC, group_name
      `,
      [selectedYear]
    );

    const fundGroupBreakdown = fundGroupRes.rows.map((row) => {
      const budget = money(row.budget);
      const obligations = money(row.obligations);
      const disbursements = money(row.disbursements);

      return {
        group: row.group_name,
        budget,
        obligations,
        disbursements,
        balance: Math.max(0, budget - obligations),
      };
    });

    /*
    ============================================================
    7. FUND SOURCE DISTRIBUTION
    ============================================================
    */
    const fundDistributionRes = await pool.query(
      `
      SELECT
        COALESCE(fs.name, fs.code, 'Unknown') AS name,
        COALESCE(SUM(bi.approved_budget), 0) AS value
      FROM fund_sources fs
      LEFT JOIN budget_items bi
        ON fs.id = bi.fund_source_id
       AND bi.fiscal_year = $1
       AND COALESCE(bi.status, 'Approved') = 'Approved'
      GROUP BY fs.id, fs.code, fs.name
      HAVING COALESCE(SUM(bi.approved_budget), 0) > 0
      ORDER BY value DESC
      `,
      [selectedYear]
    );

    const fundDistribution =
      fundDistributionRes.rows.map((row) => ({
        name: row.name,
        value: money(row.value),
      }));

    /*
    ============================================================
    8. RAOD OVERVIEW
    ============================================================

    FIX:
    The database stores the General Fund cluster as:
        "101 GENERAL FUND"

    instead of:
        "101"

    Therefore we use:
        fc.code LIKE '101%'

    This works for both "101" and "101 GENERAL FUND".
    ============================================================
    */

    const raodBudgetRes = await pool.query(
      `
      SELECT
        COALESCE(SUM(bi.approved_budget), 0) AS allotment
      FROM budget_items bi
      INNER JOIN fund_clusters fc
        ON fc.id = bi.fund_cluster_id
      WHERE bi.fiscal_year = $1
        AND TRIM(fc.code) LIKE '101%'
        AND COALESCE(bi.status, 'Approved') = 'Approved'
      `,
      [selectedYear]
    );

    const raodSummaryRes = await pool.query(
      `
      SELECT
        COALESCE(SUM(r.obligation_amount), 0) AS total_obligations,
        COALESCE(SUM(r.disbursement_amount), 0) AS total_disbursements
      FROM raod_entries r
      INNER JOIN fund_clusters fc
        ON fc.id = r.fund_cluster_id
      WHERE r.fiscal_year = $1
        AND TRIM(fc.code) LIKE '101%'
      `,
      [selectedYear]
    );

    const raodAllotment =
      money(raodBudgetRes.rows[0]?.allotment);

    const raodObligation =
      money(raodSummaryRes.rows[0]?.total_obligations);

    const raodDisbursement =
      money(raodSummaryRes.rows[0]?.total_disbursements);

    const raodUnobligated = Math.max(
      0,
      raodAllotment - raodObligation
    );

    const raodUndisbursed = Math.max(
      0,
      raodObligation - raodDisbursement
    );

    const raodObligationRate =
      raodAllotment > 0
        ? (raodObligation / raodAllotment) * 100
        : 0;

    const raodDisbursementRate =
      raodAllotment > 0
        ? (raodDisbursement / raodAllotment) * 100
        : 0;

    /*
    ============================================================
    9. FUND 161 / IGP OVERVIEW
    ============================================================
    */

    const igpOverviewRes = await pool.query(
      `
      SELECT
        COALESCE((
          SELECT COUNT(*)
          FROM igp_programs p
          WHERE p.fiscal_year = $1
            AND p.fund_source_id = fs.id
        ), 0)::int AS total_programs,

        COALESCE((
          SELECT SUM(p.beginning_balance)
          FROM igp_programs p
          WHERE p.fiscal_year = $1
            AND p.fund_source_id = fs.id
        ), 0) AS beginning_balance,

        COALESCE((
          SELECT SUM(p.projected_income)
          FROM igp_programs p
          WHERE p.fiscal_year = $1
            AND p.fund_source_id = fs.id
        ), 0) AS projected_income,

        COALESCE((
          SELECT SUM(p.allocation_amount)
          FROM igp_programs p
          WHERE p.fiscal_year = $1
            AND p.fund_source_id = fs.id
        ), 0) AS approved_budget,

        COALESCE((
          SELECT SUM(t.income_amount)
          FROM igp_transactions t
          WHERE t.fiscal_year = $1
            AND t.fund_source_id = fs.id
            AND t.transaction_type = 'Income'
            AND COALESCE(t.status, '') <> 'Cancelled'
        ), 0) AS actual_income,

        COALESCE((
          SELECT SUM(t.utilization_amount)
          FROM igp_transactions t
          WHERE t.fiscal_year = $1
            AND t.fund_source_id = fs.id
            AND t.transaction_type = 'Utilization'
            AND COALESCE(t.status, '') <> 'Cancelled'
        ), 0) AS total_utilization,

        COALESCE((
          SELECT SUM(t.disbursement_amount)
          FROM igp_transactions t
          WHERE t.fiscal_year = $1
            AND t.fund_source_id = fs.id
            AND COALESCE(t.status, '') <> 'Cancelled'
        ), 0) AS total_disbursement,

        COALESCE((
          SELECT SUM(t.unpaid_utilization)
          FROM igp_transactions t
          WHERE t.fiscal_year = $1
            AND t.fund_source_id = fs.id
            AND COALESCE(t.status, '') <> 'Cancelled'
        ), 0) AS unpaid_utilization

      FROM fund_sources fs
      WHERE fs.code = '161'
        AND COALESCE(fs.is_active, TRUE) = TRUE
      LIMIT 1
      `,
      [selectedYear]
    );

    const igpRow = igpOverviewRes.rows[0] || {};

    const igpBeginningBalance =
      money(igpRow.beginning_balance);

    const igpProjectedIncome =
      money(igpRow.projected_income);

    const igpApprovedBudget =
      money(igpRow.approved_budget);

    const igpActualIncome =
      money(igpRow.actual_income);

    const igpUtilization =
      money(igpRow.total_utilization);

    const igpDisbursement =
      money(igpRow.total_disbursement);

    const igpUnpaidUtilization =
      money(igpRow.unpaid_utilization);

    const igpAvailableBalance = Math.max(
      0,
      igpBeginningBalance +
        igpActualIncome -
        igpUtilization
    );

    const igpOverview = {
      total_programs: Number(
        igpRow.total_programs || 0
      ),
      beginning_balance: Number(
        igpBeginningBalance.toFixed(2)
      ),
      projected_income: Number(
        igpProjectedIncome.toFixed(2)
      ),
      approved_budget: Number(
        igpApprovedBudget.toFixed(2)
      ),
      actual_income: Number(
        igpActualIncome.toFixed(2)
      ),
      total_utilization: Number(
        igpUtilization.toFixed(2)
      ),
      total_disbursement: Number(
        igpDisbursement.toFixed(2)
      ),
      unpaid_utilization: Number(
        igpUnpaidUtilization.toFixed(2)
      ),
      available_balance: Number(
        igpAvailableBalance.toFixed(2)
      ),
    };

    /*
    ============================================================
    10. RECENT TRANSACTIONS
    ============================================================
    */

    const recentTx = await pool.query(
      `
      SELECT
        r.id,
        r.entry_date AS date,
        r.registry_no AS ref,
        r.particulars,

        CASE
          WHEN COALESCE(r.disbursement_amount, 0) > 0
            THEN COALESCE(r.disbursement_amount, 0)
          ELSE COALESCE(r.utilization_amount, 0)
        END AS amount,

        'RBUD' AS type,

        CASE
          WHEN LOWER(COALESCE(r.status, '')) = 'cancelled'
            THEN 'CANCELLED'

          WHEN COALESCE(r.utilization_amount, 0) > 0
               AND COALESCE(r.disbursement_amount, 0)
                   >= COALESCE(r.utilization_amount, 0)
            THEN 'COMPLETED'

          WHEN COALESCE(r.disbursement_amount, 0) > 0
            THEN 'PARTIALLY DISBURSED'

          WHEN COALESCE(r.utilization_amount, 0) > 0
            THEN 'OBLIGATED'

          ELSE 'RECORDED'
        END AS status

      FROM rbud_entries r
      WHERE r.fiscal_year = $1

      UNION ALL

      SELECT
        r.id,
        r.entry_date AS date,
        r.registry_no AS ref,
        r.particulars,

        CASE
          WHEN COALESCE(r.disbursement_amount, 0) > 0
            THEN COALESCE(r.disbursement_amount, 0)
          ELSE COALESCE(r.obligation_amount, 0)
        END AS amount,

        'RAOD' AS type,

        CASE
          WHEN LOWER(COALESCE(r.status, '')) = 'cancelled'
            THEN 'CANCELLED'

          WHEN COALESCE(r.obligation_amount, 0) > 0
               AND COALESCE(r.disbursement_amount, 0)
                   >= COALESCE(r.obligation_amount, 0)
            THEN 'COMPLETED'

          WHEN COALESCE(r.disbursement_amount, 0) > 0
            THEN 'PARTIALLY DISBURSED'

          WHEN COALESCE(r.obligation_amount, 0) > 0
            THEN 'OBLIGATED'

          ELSE 'RECORDED'
        END AS status

      FROM raod_entries r
      WHERE r.fiscal_year = $1

      ORDER BY date DESC NULLS LAST
      LIMIT 5
      `,
      [selectedYear]
    );

    /*
    ============================================================
    11. RESPONSE
    ============================================================
    Keep the same response property names so the existing
    Dashboard.jsx does not need to be redesigned.
    ============================================================
    */

    return res.json({
      fiscalYear: selectedYear,

      // RBUD
      totalBudget: Number(
        totalBudget.toFixed(2)
      ),

      totalAllocated: Number(
        totalBudget.toFixed(2)
      ),

      totalObligations: Number(
        totalObligations.toFixed(2)
      ),

      totalDisbursed: Number(
        totalDisbursed.toFixed(2)
      ),

      remainingBalance: Number(
        remainingBalance.toFixed(2)
      ),

      utilizationRate: Number(
        utilizationRate.toFixed(6)
      ),

      disbursementRate: Number(
        disbursementRate.toFixed(6)
      ),

      // Budget Status by Fund Source
      // Keep the old property for backward compatibility, but expose
      // the exact property name used by the current Dashboard.jsx.
      fundSourceBreakdown: fundGroupBreakdown,
      fundGroupBreakdown,
      fundDistribution,

      // RAOD
      raodOverview: {
        totalAllotment: Number(
          raodAllotment.toFixed(2)
        ),

        totalObligations: Number(
          raodObligation.toFixed(2)
        ),

        totalDisbursements: Number(
          raodDisbursement.toFixed(2)
        ),

        unobligatedAllotment: Number(
          raodUnobligated.toFixed(2)
        ),

        undisbursedBalance: Number(
          raodUndisbursed.toFixed(2)
        ),

        obligationRate: Number(
          raodObligationRate.toFixed(6)
        ),

        disbursementRate: Number(
          raodDisbursementRate.toFixed(6)
        ),
      },

      // Fund 161 / IGP
      igpOverview,

      recentTransactions:
        recentTx.rows,
    });
  } catch (err) {
    console.error(
      'ERROR sa /api/dashboard/summary:',
      err
    );

    return res.status(500).json({
      error:
        'Failed to load dashboard summary.',
      details: err.message,
    });
  }
});

module.exports = router;