const express = require('express');
const router = express.Router();

const pool = require('../db');

/*
============================================================
BMAS DASHBOARD SUMMARY
============================================================

RBUD:
- Total Budget       -> fund_allocations
- Obligations        -> rbud_entries.utilization_amount
- Disbursements      -> rbud_entries.disbursement_amount
- Balance            -> Budget - Obligations

RAOD:
- Obligations        -> raod_entries.obligation_amount
- Disbursements      -> raod_entries.disbursement_amount
- Allotment          -> not stored in raod_entries
============================================================
*/

router.get('/summary', async (req, res) => {
  try {
    const selectedYear =
      Number(req.query.year) || new Date().getFullYear();

    /*
    ============================================================
    1. RBUD TOTAL BUDGET
    ============================================================
    */

    const budgetRes = await pool.query(
      `
      SELECT
        COALESCE(SUM(allocation_amount), 0) AS total_budget
      FROM fund_allocations
      WHERE fiscal_year = $1
      `,
      [selectedYear]
    );

    const totalBudget =
      Number(budgetRes.rows[0]?.total_budget) || 0;

    /*
    ============================================================
    2. RBUD OBLIGATIONS / UTILIZATION
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
      Number(rbudObligationRes.rows[0]?.total_obligations) || 0;

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
      Number(rbudDisbursementRes.rows[0]?.total_disbursements) || 0;

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
    6. BUDGET STATUS BY FUND GROUP
    ============================================================
    */

    const fundGroupRes = await pool.query(
      `
      SELECT
        fs.id,
        fs.name AS group_name,

        COALESCE(fa.budget, 0) AS budget,

        COALESCE(rb.obligations, 0) AS obligations,

        COALESCE(rb.disbursements, 0) AS disbursements

      FROM fund_sources fs

      LEFT JOIN (
        SELECT
          fund_source_id,
          SUM(allocation_amount) AS budget
        FROM fund_allocations
        WHERE fiscal_year = $1
        GROUP BY fund_source_id
      ) fa
        ON fs.id = fa.fund_source_id

      LEFT JOIN (
        SELECT
          fund_source_id,

          SUM(utilization_amount) AS obligations,

          SUM(disbursement_amount) AS disbursements

        FROM rbud_entries

        WHERE fiscal_year = $1

        GROUP BY fund_source_id
      ) rb
        ON fs.id = rb.fund_source_id

      WHERE
        COALESCE(fa.budget, 0) > 0
        OR COALESCE(rb.obligations, 0) > 0
        OR COALESCE(rb.disbursements, 0) > 0

      ORDER BY budget DESC
      `,
      [selectedYear]
    );

    const fundGroupBreakdown = fundGroupRes.rows.map((row) => {
      const budget = Number(row.budget) || 0;
      const obligations = Number(row.obligations) || 0;
      const disbursements = Number(row.disbursements) || 0;

      const balance = Math.max(
        0,
        budget - obligations
      );

      return {
        group: row.group_name,
        budget,
        obligations,
        disbursements,
        balance,
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
        fs.name,

        COALESCE(
          SUM(fa.allocation_amount),
          0
        ) AS value

      FROM fund_sources fs

      LEFT JOIN fund_allocations fa
        ON fs.id = fa.fund_source_id
        AND fa.fiscal_year = $1

      GROUP BY
        fs.id,
        fs.name

      HAVING
        COALESCE(
          SUM(fa.allocation_amount),
          0
        ) > 0

      ORDER BY value DESC
      `,
      [selectedYear]
    );

    const fundDistribution =
      fundDistributionRes.rows.map((row) => ({
        name: row.name,
        value: Number(row.value) || 0,
      }));

    /*
    ============================================================
    8. RAOD OVERVIEW
    ============================================================
    */

    const raodSummaryRes = await pool.query(
      `
      SELECT

        COALESCE(
          SUM(obligation_amount),
          0
        ) AS total_obligations,

        COALESCE(
          SUM(disbursement_amount),
          0
        ) AS total_disbursements

      FROM raod_entries

      WHERE fiscal_year = $1
      `,
      [selectedYear]
    );

    const raodObligation =
      Number(
        raodSummaryRes.rows[0]?.total_obligations
      ) || 0;

    const raodDisbursement =
      Number(
        raodSummaryRes.rows[0]?.total_disbursements
      ) || 0;

    /*
    RAOD allotment is not currently stored
    as a column in raod_entries.

    We return zero rather than using a nonexistent
    database column or inventing an allotment value.
    */

    const raodAllotment = 0;

    const raodUnobligated = 0;

    const raodObligationRate = 0;

    const raodDisbursementRate = 0;

    /*
    ============================================================
    9. RECENT TRANSACTIONS
    ============================================================
    */

    const recentTx = await pool.query(
      `
      SELECT
        entry_date AS date,
        registry_no AS ref,
        particulars,
        COALESCE(disbursement_amount, 0) AS amount,
        'RAOD' AS type

      FROM raod_entries

      WHERE fiscal_year = $1

      UNION ALL

      SELECT
        entry_date AS date,
        registry_no AS ref,
        particulars,
        COALESCE(disbursement_amount, 0) AS amount,
        'RBUD' AS type

      FROM rbud_entries

      WHERE fiscal_year = $1

      ORDER BY date DESC

      LIMIT 5
      `,
      [selectedYear]
    );

    /*
    ============================================================
    10. SEND RESPONSE
    ============================================================
    */

    res.json({

      /*
      ============================
      RBUD
      ============================
      */

      totalBudget:
        Number(totalBudget.toFixed(2)),

      totalAllocated:
        Number(totalBudget.toFixed(2)),

      totalObligations:
        Number(totalObligations.toFixed(2)),

      totalDisbursed:
        Number(totalDisbursed.toFixed(2)),

      remainingBalance:
        Number(remainingBalance.toFixed(2)),

      utilizationRate:
        Number(utilizationRate.toFixed(6)),

      disbursementRate:
        Number(disbursementRate.toFixed(6)),

      /*
      ============================
      FUND GROUPS
      ============================
      */

      fundGroupBreakdown,

      /*
      ============================
      FUND DISTRIBUTION
      ============================
      */

      fundDistribution,

      /*
      ============================
      RAOD
      ============================
      */

      raodOverview: {

        totalAllotment:
          Number(raodAllotment.toFixed(2)),

        totalObligations:
          Number(raodObligation.toFixed(2)),

        totalDisbursements:
          Number(raodDisbursement.toFixed(2)),

        unobligatedAllotment:
          Number(raodUnobligated.toFixed(2)),

        obligationRate:
          Number(raodObligationRate.toFixed(6)),

        disbursementRate:
          Number(raodDisbursementRate.toFixed(6)),
      },

      /*
      ============================
      RECENT TRANSACTIONS
      ============================
      */

      recentTransactions:
        recentTx.rows,
    });

  } catch (err) {

    console.error(
      'ERROR sa /api/dashboard/summary:',
      err
    );

    res.status(500).json({
      error: 'Failed to load dashboard summary.',
      details: err.message,
    });
  }
});

module.exports = router;
