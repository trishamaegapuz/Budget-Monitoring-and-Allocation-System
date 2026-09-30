const express = require('express');
const router = express.Router();

const pool = require('../db');

/*
============================================================
BMAS DASHBOARD SUMMARY

The dashboard reads from the current BMAS modules:

RBUD
- Approved budget     -> budget_items.approved_budget
- Utilization         -> rbud_entries.utilization_amount
- Disbursements       -> rbud_entries.disbursement_amount
- Remaining balance   -> approved budget - utilization

RAOD
- Allotment basis     -> approved budget items under Fund Cluster 101
- Obligations         -> raod_entries.obligation_amount
- Disbursements       -> raod_entries.disbursement_amount

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
    Uses budget_items because this is the same source used by
    the current RBUD Budget & Allocation view.
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
    The dashboard previously used the old fund_allocations source.
    The current RBUD allocation screen is driven by budget_items,
    so this table follows the same source.
    ============================================================
    */

    const fundGroupRes = await pool.query(
      `
      SELECT
        fs.id,
        COALESCE(fs.name, fs.code, 'Unknown') AS group_name,

        COALESCE(SUM(bi.approved_budget), 0) AS budget,

        COALESCE((
          SELECT SUM(r.utilization_amount)
          FROM rbud_entries r
          WHERE r.fiscal_year = $1
            AND r.fund_source_id = fs.id
        ), 0) AS obligations,

        COALESCE((
          SELECT SUM(r.disbursement_amount)
          FROM rbud_entries r
          WHERE r.fiscal_year = $1
            AND r.fund_source_id = fs.id
        ), 0) AS disbursements

      FROM fund_sources fs

      LEFT JOIN budget_items bi
        ON bi.fund_source_id = fs.id
       AND bi.fiscal_year = $1
       AND COALESCE(bi.status, 'Approved') = 'Approved'

      GROUP BY
        fs.id,
        fs.code,
        fs.name

      HAVING
        COALESCE(SUM(bi.approved_budget), 0) > 0
        OR COALESCE((
          SELECT SUM(r2.utilization_amount)
          FROM rbud_entries r2
          WHERE r2.fiscal_year = $1
            AND r2.fund_source_id = fs.id
        ), 0) > 0
        OR COALESCE((
          SELECT SUM(r3.disbursement_amount)
          FROM rbud_entries r3
          WHERE r3.fiscal_year = $1
            AND r3.fund_source_id = fs.id
        ), 0) > 0

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
    Uses the same General Fund / Fund Cluster 101 budget basis
    used by the current RAOD overview.
    ============================================================
    */

    const raodBudgetRes = await pool.query(
      `
      SELECT
        COALESCE(SUM(bi.approved_budget), 0) AS allotment
      FROM budget_items bi
      JOIN fund_clusters fc
        ON fc.id = bi.fund_cluster_id
      WHERE bi.fiscal_year = $1
        AND fc.code = '101'
        AND COALESCE(bi.status, 'Approved') = 'Approved'
      `,
      [selectedYear]
    );

    const raodSummaryRes = await pool.query(
      `
      SELECT
        COALESCE(SUM(obligation_amount), 0) AS total_obligations,
        COALESCE(SUM(disbursement_amount), 0) AS total_disbursements
      FROM raod_entries r
      JOIN fund_clusters fc
        ON fc.id = r.fund_cluster_id
      WHERE r.fiscal_year = $1
        AND fc.code = '101'
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
    9. RECENT TRANSACTIONS
    ============================================================
    Only current RBUD and RAOD registries are included.
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
          WHEN LOWER(COALESCE(r.status, '')) = 'cancelled' THEN 'CANCELLED'
          WHEN COALESCE(r.utilization_amount, 0) > 0
               AND COALESCE(r.disbursement_amount, 0) >= COALESCE(r.utilization_amount, 0)
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
          WHEN LOWER(COALESCE(r.status, '')) = 'cancelled' THEN 'CANCELLED'
          WHEN COALESCE(r.obligation_amount, 0) > 0
               AND COALESCE(r.disbursement_amount, 0) >= COALESCE(r.obligation_amount, 0)
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
    10. RESPONSE
    ============================================================
    */

    return res.json({
      fiscalYear: selectedYear,

      // RBUD
      totalBudget: Number(totalBudget.toFixed(2)),
      totalAllocated: Number(totalBudget.toFixed(2)),
      totalObligations: Number(totalObligations.toFixed(2)),
      totalDisbursed: Number(totalDisbursed.toFixed(2)),
      remainingBalance: Number(remainingBalance.toFixed(2)),
      utilizationRate: Number(utilizationRate.toFixed(6)),
      disbursementRate: Number(disbursementRate.toFixed(6)),

      fundGroupBreakdown,
      fundDistribution,

      // RAOD
      raodOverview: {
        totalAllotment: Number(raodAllotment.toFixed(2)),
        totalObligations: Number(raodObligation.toFixed(2)),
        totalDisbursements: Number(raodDisbursement.toFixed(2)),
        unobligatedAllotment: Number(raodUnobligated.toFixed(2)),
        undisbursedBalance: Number(raodUndisbursed.toFixed(2)),
        obligationRate: Number(raodObligationRate.toFixed(6)),
        disbursementRate: Number(raodDisbursementRate.toFixed(6)),
      },

      recentTransactions: recentTx.rows,
    });
  } catch (err) {
    console.error(
      'ERROR sa /api/dashboard/summary:',
      err
    );

    return res.status(500).json({
      error: 'Failed to load dashboard summary.',
      details: err.message,
    });
  }
});

module.exports = router;
