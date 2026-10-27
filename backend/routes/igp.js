// server/routes/igp.js
// BMAS IGP REGISTRY - FUND 161
// Updated for the current BMAS 2.sql schema + IGP Fund 161 migration V2.
//
// Existing authentication is intentionally reused from ../middleware/auth.
// Roles:
//   Administration = full IGP management + delete
//   Budget        = WFP/Budget + program add/edit + adjustment transactions
//   Procurement   = RAOD Registry only
//   Accountant    = RAOD Registry only
//
// Endpoints:
// GET    /api/igp/overview
// GET    /api/igp/references
// GET    /api/igp/programs
// POST   /api/igp/programs
// PUT    /api/igp/programs/:id
// DELETE /api/igp/programs/:id
// GET    /api/igp/transactions
// POST   /api/igp/transactions
// PUT    /api/igp/transactions/:id
// DELETE /api/igp/transactions/:id
// GET    /api/igp/export

const express = require("express");
const router = express.Router();
const pool = require("../db");
const { verifyToken } = require("../middleware/auth");
const { writeAuditLog } = require("../utils/auditLogger");

const FY = 2026;
const IGP_FUND_CODE = "161";
const VIEW_ROLES = ["Administration", "Budget", "Procurement", "Accountant"];
const PROGRAM_MANAGE_ROLES = ["Administration", "Budget"];
const TRANSACTION_MANAGE_ROLES = ["Administration", "Budget"];
const ADMIN_ONLY_ROLES = ["Administration"];

const n = (value, fallback = 0) => {
  if (value === null || value === undefined || value === "") return fallback;
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const nullableInt = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const amount = (value) => Math.max(0, n(value, 0));

function requireIgpView(req, res, next) {
  return verifyToken(req, res, () => {
    if (!VIEW_ROLES.includes(req.user?.role)) {
      return res.status(403).json({
        success: false,
        error: "IGP access is not allowed for this role.",
      });
    }
    next();
  });
}

function requireIgpProgramManage(req, res, next) {
  return verifyToken(req, res, () => {
    if (!PROGRAM_MANAGE_ROLES.includes(req.user?.role)) {
      return res.status(403).json({ success: false, error: "Only Administration or Budget can add or edit IGP programs/projects." });
    }
    next();
  });
}

function requireIgpTransactionManage(req, res, next) {
  return verifyToken(req, res, () => {
    if (!TRANSACTION_MANAGE_ROLES.includes(req.user?.role)) {
      return res.status(403).json({ success: false, error: "Your role is not authorized to manage IGP transactions." });
    }
    const role = req.user?.role;
    const type = String(req.body?.transaction_type || "").trim();
    const allowed = role === "Administration"
      ? ["Income", "Utilization", "Adjustment"]
      : role === "Budget"
        ? ["Adjustment"]
        : [];
    if (!allowed.includes(type)) {
      return res.status(403).json({ success: false, error: `${role} is not authorized to create or edit ${type || "this"} IGP transaction type.`, code: "IGP_TRANSACTION_ROLE_RESTRICTED" });
    }
    next();
  });
}

function requireIgpAdmin(req, res, next) {
  return verifyToken(req, res, () => {
    if (!ADMIN_ONLY_ROLES.includes(req.user?.role)) {
      return res.status(403).json({ success: false, error: "Only Administration can delete IGP records." });
    }
    next();
  });
}


function errorMessage(error) {
  console.error("IGP route error:", error);
  return error?.message || "IGP request failed.";
}

async function getIgpFundSource() {
  const result = await pool.query(
    `SELECT id, code, name
       FROM fund_sources
      WHERE code = $1
        AND COALESCE(is_active, TRUE) = TRUE
      LIMIT 1`,
    [IGP_FUND_CODE]
  );
  return result.rows[0] || null;
}

async function getProgram(programId, fundId) {
  const result = await pool.query(
    `SELECT
       p.*,
       fc.code AS fund_cluster_code,
       fc.name AS fund_cluster_name,
       ws.code AS wfp_source_code_master,
       ws.name AS wfp_source_name,
       c.code AS campus_code,
       c.name AS campus_name,
       rc.code AS responsibility_center_code,
       rc.name AS responsibility_center_name
       FROM igp_programs p
       LEFT JOIN fund_clusters fc ON fc.id = p.fund_cluster_id
       LEFT JOIN wfp_sources ws ON ws.id = p.wfp_source_id
       LEFT JOIN campuses c ON c.id = p.campus_id
       LEFT JOIN responsibility_centers rc ON rc.id = p.responsibility_center_id
      WHERE p.id = $1
        AND p.fund_source_id = $2
      LIMIT 1`,
    [programId, fundId]
  );
  return result.rows[0] || null;
}

/* ============================================================
   AUTHORIZATION
   All IGP endpoints are protected without replacing the
   project's existing middleware/auth.js.
============================================================ */

router.use(requireIgpView);

/* ============================================================
   OVERVIEW / DASHBOARD
============================================================ */

router.get("/overview", async (req, res) => {
  const year = n(req.query.year, FY);

  try {
    const fund = await getIgpFundSource();
    if (!fund) {
      return res.status(400).json({
        success: false,
        error: "Fund Source 161 was not found in fund_sources.",
      });
    }

    const [programs, totals, recent, byCluster] = await Promise.all([
      pool.query(
        `SELECT
           COUNT(*)::int AS total_programs,
           COALESCE(SUM(beginning_balance),0) AS beginning_balance,
           COALESCE(SUM(projected_income),0) AS projected_income,
           COALESCE(SUM(allocation_amount),0) AS approved_budget
           FROM igp_programs
          WHERE fiscal_year = $1
            AND fund_source_id = $2`,
        [year, fund.id]
      ),

      pool.query(
        `SELECT
           COALESCE(SUM(CASE
             WHEN transaction_type = 'Income' AND status <> 'Cancelled'
             THEN income_amount ELSE 0 END),0) AS actual_income,
           COALESCE(SUM(CASE
             WHEN transaction_type = 'Utilization' AND status <> 'Cancelled'
             THEN utilization_amount ELSE 0 END),0) AS total_utilization,
           COALESCE(SUM(CASE
             WHEN status <> 'Cancelled'
             THEN disbursement_amount ELSE 0 END),0) AS total_disbursement,
           COALESCE(SUM(CASE
             WHEN status <> 'Cancelled'
             THEN unpaid_utilization ELSE 0 END),0) AS unpaid_utilization
           FROM igp_transactions
          WHERE fiscal_year = $1
            AND fund_source_id = $2`,
        [year, fund.id]
      ),

      pool.query(
        `SELECT
           t.id,
           t.transaction_no,
           t.registry_no,
           t.transaction_date,
           t.transaction_type,
           t.reference_no,
           t.description,
           t.payee,
           CASE
             WHEN t.transaction_type = 'Income' THEN t.income_amount
             WHEN t.transaction_type = 'Utilization' THEN t.utilization_amount
             ELSE 0
           END AS amount,
           t.unpaid_utilization,
           p.program_code,
           p.program_name
           FROM igp_transactions t
           LEFT JOIN igp_programs p ON p.id = t.igp_program_id
          WHERE t.fiscal_year = $1
            AND t.fund_source_id = $2
          ORDER BY t.transaction_date DESC, t.id DESC
          LIMIT 10`,
        [year, fund.id]
      ),

      pool.query(
        `SELECT
           fc.id,
           fc.code,
           fc.name,
           COUNT(DISTINCT p.id)::int AS program_count,
           COALESCE(SUM(p.beginning_balance),0) AS beginning_balance,
           COALESCE(SUM(p.projected_income),0) AS projected_income,
           COALESCE(SUM(p.allocation_amount),0) AS approved_budget,
           COALESCE(SUM(CASE
             WHEN t.transaction_type = 'Income' AND t.status <> 'Cancelled'
             THEN t.income_amount ELSE 0 END),0) AS actual_income,
           COALESCE(SUM(CASE
             WHEN t.transaction_type = 'Utilization' AND t.status <> 'Cancelled'
             THEN t.utilization_amount ELSE 0 END),0) AS utilization,
           COALESCE(SUM(CASE
             WHEN t.status <> 'Cancelled'
             THEN t.disbursement_amount ELSE 0 END),0) AS disbursement,
           COALESCE(SUM(CASE
             WHEN t.status <> 'Cancelled'
             THEN t.unpaid_utilization ELSE 0 END),0) AS unpaid_utilization
           FROM igp_programs p
           LEFT JOIN fund_clusters fc ON fc.id = p.fund_cluster_id
           LEFT JOIN igp_transactions t
             ON t.igp_program_id = p.id
            AND t.fiscal_year = p.fiscal_year
            AND t.fund_source_id = p.fund_source_id
          WHERE p.fiscal_year = $1
            AND p.fund_source_id = $2
          GROUP BY fc.id, fc.code, fc.name
          ORDER BY fc.code`,
        [year, fund.id]
      ),
    ]);

    const p = programs.rows[0] || {};
    const t = totals.rows[0] || {};

    const beginningBalance = n(p.beginning_balance);
    const projectedIncome = n(p.projected_income);
    const approvedBudget = n(p.approved_budget);
    const actualIncome = n(t.actual_income);
    const utilization = n(t.total_utilization);
    const disbursement = n(t.total_disbursement);
    const unpaid = n(t.unpaid_utilization);

    res.json({
      success: true,
      data: {
        fiscal_year: year,
        fund_code: fund.code,
        fund_name: fund.name,
        total_programs: Number(p.total_programs || 0),
        beginning_balance: beginningBalance,
        projected_income: projectedIncome,
        approved_budget: approvedBudget,
        actual_income: actualIncome,
        total_income: actualIncome,
        total_utilization: utilization,
        total_disbursement: disbursement,
        unpaid_utilization: unpaid,
        available_balance: Math.max(0, beginningBalance + actualIncome - utilization),
        projected_available_balance: Math.max(
          0,
          beginningBalance + projectedIncome - utilization
        ),
        recent_transactions: recent.rows.map((row) => ({
          ...row,
          amount: n(row.amount),
          disbursement_amount: n(row.disbursement_amount),
          unpaid_utilization: n(row.unpaid_utilization),
        })),
        by_fund_cluster: byCluster.rows.map((row) => ({
          ...row,
          beginning_balance: n(row.beginning_balance),
          projected_income: n(row.projected_income),
          approved_budget: n(row.approved_budget),
          actual_income: n(row.actual_income),
          utilization: n(row.utilization),
          disbursement: n(row.disbursement),
          unpaid_utilization: n(row.unpaid_utilization),
          available_balance: Math.max(
            0,
            n(row.beginning_balance) +
              n(row.actual_income) -
              n(row.utilization)
          ),
        })),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: errorMessage(error),
    });
  }
});

/* ============================================================
   MASTER DATA REFERENCES
============================================================ */

router.get("/references", async (req, res) => {
  try {
    const [
      fundClusters,
      campuses,
      responsibilityCenters,
      pap,
      uacsCodes,
      oldUacsCodes,
      allotmentClasses,
      objectExpenditures,
      mfo,
      wfpSources,
    ] = await Promise.all([
      pool.query(
        `SELECT id, code, name, fund_source_id
           FROM fund_clusters
          WHERE COALESCE(is_active, TRUE) = TRUE
            AND fund_source_id = (SELECT id FROM fund_sources WHERE code = '161' LIMIT 1)
          ORDER BY code, name`
      ),
      pool.query(
        `SELECT id, code, name
           FROM campuses
          WHERE COALESCE(is_active, TRUE) = TRUE
          ORDER BY code, name`
      ),
      pool.query(
        `SELECT id, code, name
           FROM responsibility_centers
          WHERE COALESCE(is_active, TRUE) = TRUE
          ORDER BY code, name`
      ),
      pool.query(
        `SELECT id, code, name
           FROM pap
          WHERE COALESCE(is_active, TRUE) = TRUE
          ORDER BY code, name`
      ),
      pool.query(
        `SELECT id, code, old_code, account_title, revised_description,
                account_description, category
           FROM uacs_codes
          WHERE COALESCE(is_active, TRUE) = TRUE
          ORDER BY code`
      ),
      pool.query(
        `SELECT id, code, old_code, account_title, revised_description,
                account_description, category
           FROM uacs_codes
          WHERE COALESCE(is_active, TRUE) = TRUE
            AND NULLIF(TRIM(COALESCE(old_code, '')), '') IS NOT NULL
          ORDER BY old_code, code`
      ),
      pool.query(
        `SELECT id, code, name, description
           FROM allotment_classes
          WHERE COALESCE(is_active, TRUE) = TRUE
          ORDER BY code, name`
      ),
      pool.query(
        `SELECT id, code, name, description
           FROM object_expenditures
          WHERE COALESCE(is_active, TRUE) = TRUE
          ORDER BY code, name`
      ),
      pool.query(
        `SELECT id, code, name, description
           FROM mfo
          WHERE COALESCE(is_active, TRUE) = TRUE
          ORDER BY code, name`
      ),
      pool.query(
        `SELECT id, code, name, description
           FROM wfp_sources
          WHERE COALESCE(is_active, TRUE) = TRUE
          ORDER BY code, name`
      ),
    ]);

    res.json({
      success: true,
      data: {
        fund_clusters: fundClusters.rows,
        campuses: campuses.rows,
        responsibility_centers: responsibilityCenters.rows,
        pap: pap.rows,
        uacs_codes: uacsCodes.rows,
        old_uacs_codes: oldUacsCodes.rows,
        allotment_classes: allotmentClasses.rows,
        object_expenditures: objectExpenditures.rows,
        mfo: mfo.rows,
        wfp_sources: wfpSources.rows,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: errorMessage(error),
    });
  }
});

/* ============================================================
   PROGRAMS / PROJECTS
============================================================ */

router.get("/programs", async (req, res) => {
  const year = n(req.query.year, FY);
  const search = String(req.query.search || "").trim();

  try {
    const fund = await getIgpFundSource();
    if (!fund) {
      return res.status(400).json({
        success: false,
        error: "Fund Source 161 was not found.",
      });
    }

    const values = [year, fund.id];
    let index = 3;
    let where = `WHERE p.fiscal_year = $1
                   AND p.fund_source_id = $2`;

    if (search) {
      where += `
        AND (
          p.program_code ILIKE $${index}
          OR p.program_name ILIKE $${index}
          OR COALESCE(p.description,'') ILIKE $${index}
          OR COALESCE(c.name,'') ILIKE $${index}
          OR COALESCE(rc.name,'') ILIKE $${index}
          OR COALESCE(fc.code,'') ILIKE $${index}
          OR COALESCE(fc.name,'') ILIKE $${index}
        )`;
      values.push(`%${search}%`);
      index += 1;
    }

    const result = await pool.query(
      `SELECT
         p.id,
         p.fiscal_year,
         p.fund_source_id,
         p.fund_cluster_id,
         p.program_code,
         p.program_name,
         p.description,
         p.campus_id,
         p.responsibility_center_id,
         p.wfp_source_id,
         p.wfp_source_code,
         p.beginning_balance,
         p.projected_income,
         p.allocation_amount AS approved_budget,
         p.allocation_amount,
         p.start_date,
         p.status,
         p.created_by,
         p.updated_by,
         creator.full_name AS created_by_name,
         creator.role AS created_by_role,
         updater.full_name AS updated_by_name,
         updater.role AS updated_by_role,
         fc.code AS fund_cluster_code,
         fc.name AS fund_cluster_name,
         ws.code AS wfp_source_code_master,
         ws.name AS wfp_source_name,
         c.code AS campus_code,
         c.name AS campus_name,
         rc.code AS responsibility_center_code,
         rc.name AS responsibility_center_name,
         COALESCE(SUM(CASE
           WHEN t.transaction_type='Income'
            AND t.status <> 'Cancelled'
           THEN t.income_amount ELSE 0 END),0) AS income,
         COALESCE(SUM(CASE
           WHEN t.transaction_type='Utilization'
            AND t.status <> 'Cancelled'
           THEN t.utilization_amount ELSE 0 END),0) AS utilization,
         COALESCE(SUM(CASE
           WHEN t.status <> 'Cancelled'
           THEN t.disbursement_amount ELSE 0 END),0) AS disbursement,
         COALESCE(SUM(CASE
           WHEN t.status <> 'Cancelled'
           THEN t.unpaid_utilization ELSE 0 END),0) AS unpaid_utilization
         FROM igp_programs p
         LEFT JOIN fund_clusters fc ON fc.id = p.fund_cluster_id
         LEFT JOIN wfp_sources ws ON ws.id = p.wfp_source_id
         LEFT JOIN campuses c ON c.id = p.campus_id
         LEFT JOIN responsibility_centers rc ON rc.id = p.responsibility_center_id
         LEFT JOIN users creator ON creator.id = p.created_by
         LEFT JOIN users updater ON updater.id = p.updated_by
         LEFT JOIN igp_transactions t
           ON t.igp_program_id = p.id
          AND t.fiscal_year = p.fiscal_year
          AND t.fund_source_id = p.fund_source_id
         ${where}
         GROUP BY
           p.id,
           fc.code, fc.name,
           ws.code, ws.name,
           c.code, c.name,
           rc.code, rc.name,
           creator.full_name, creator.role,
           updater.full_name, updater.role
         ORDER BY p.program_code`,
      values
    );

    res.json({
      success: true,
      data: result.rows.map((row) => {
        const income = n(row.income);
        const utilization = n(row.utilization);
        return {
          ...row,
          beginning_balance: n(row.beginning_balance),
          projected_income: n(row.projected_income),
          approved_budget: n(row.approved_budget),
          income,
          utilization,
          disbursement: n(row.disbursement),
          unpaid_utilization: n(row.unpaid_utilization),
          balance: Math.max(
            0,
            n(row.beginning_balance) + income - utilization
          ),
        };
      }),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: errorMessage(error),
    });
  }
});

router.post("/programs", requireIgpProgramManage, async (req, res) => {
  const body = req.body || {};
  const year = n(body.fiscal_year, FY);

  if (!String(body.program_code || "").trim()) {
    return res.status(400).json({
      success: false,
      error: "Program Code is required.",
    });
  }

  if (!String(body.program_name || "").trim()) {
    return res.status(400).json({
      success: false,
      error: "Program / Project Name is required.",
    });
  }

  try {
    const fund = await getIgpFundSource();
    if (!fund) {
      return res.status(400).json({
        success: false,
        error: "Fund Source 161 was not found.",
      });
    }

    const result = await pool.query(
      `INSERT INTO igp_programs (
         fiscal_year,
         fund_source_id,
         fund_cluster_id,
         program_code,
         program_name,
         description,
         campus_id,
         responsibility_center_id,
         wfp_source_id,
         wfp_source_code,
         beginning_balance,
         projected_income,
         allocation_amount,
         start_date,
         status,
         created_by,
         updated_by
       )
       VALUES (
         $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$16
       )
       RETURNING *`,
      [
        year,
        fund.id,
        nullableInt(body.fund_cluster_id),
        String(body.program_code).trim(),
        String(body.program_name).trim(),
        body.description || null,
        nullableInt(body.campus_id),
        nullableInt(body.responsibility_center_id),
        nullableInt(body.wfp_source_id),
        body.wfp_source_code || null,
        amount(body.beginning_balance),
        amount(body.projected_income),
        amount(body.approved_budget ?? body.allocation_amount),
        body.start_date || null,
        body.status || "Active",
        nullableInt(req.user?.id),
      ]
    );

    await writeAuditLog({
      req, module: "IGP Registry", action: "CREATE",
      tableName: "igp_programs", recordId: result.rows[0].id,
      newValues: result.rows[0],
    });

    res.status(201).json({
      success: true,
      message: "IGP program/project created successfully.",
      data: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: errorMessage(error),
    });
  }
});

router.put("/programs/:id", requireIgpProgramManage, async (req, res) => {
  const body = req.body || {};
  const id = nullableInt(req.params.id);

  if (!id) {
    return res.status(400).json({
      success: false,
      error: "Invalid program ID.",
    });
  }

  try {
    const fund = await getIgpFundSource();
    if (!fund) {
      return res.status(400).json({
        success: false,
        error: "Fund Source 161 was not found.",
      });
    }

    const result = await pool.query(
      `UPDATE igp_programs
          SET fund_cluster_id = $1,
              program_code = $2,
              program_name = $3,
              description = $4,
              campus_id = $5,
              responsibility_center_id = $6,
              wfp_source_id = $7,
              wfp_source_code = $8,
              beginning_balance = $9,
              projected_income = $10,
              allocation_amount = $11,
              start_date = $12,
              status = $13,
              updated_by = $14,
              updated_at = CURRENT_TIMESTAMP
        WHERE id = $15
          AND fund_source_id = $16
        RETURNING *`,
      [
        nullableInt(body.fund_cluster_id),
        String(body.program_code || "").trim(),
        String(body.program_name || "").trim(),
        body.description || null,
        nullableInt(body.campus_id),
        nullableInt(body.responsibility_center_id),
        nullableInt(body.wfp_source_id),
        body.wfp_source_code || null,
        amount(body.beginning_balance),
        amount(body.projected_income),
        amount(body.approved_budget ?? body.allocation_amount),
        body.start_date || null,
        body.status || "Active",
        nullableInt(req.user?.id),
        id,
        fund.id,
      ]
    );

    if (!result.rows.length) {
      return res.status(404).json({
        success: false,
        error: "IGP program/project not found.",
      });
    }

    await writeAuditLog({
      req, module: "IGP Registry", action: "UPDATE",
      tableName: "igp_programs", recordId: result.rows[0].id,
      newValues: result.rows[0],
    });

    res.json({
      success: true,
      message: "IGP program/project updated successfully.",
      data: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: errorMessage(error),
    });
  }
});

router.delete("/programs/:id", requireIgpAdmin, async (req, res) => {
  const id = nullableInt(req.params.id);

  if (!id) {
    return res.status(400).json({
      success: false,
      error: "Invalid program ID.",
    });
  }

  try {
    const fund = await getIgpFundSource();

    const oldProgram = await pool.query(
      `SELECT * FROM igp_programs WHERE id = $1 AND fund_source_id = $2`,
      [id, fund?.id]
    );

    const result = await pool.query(
      `DELETE FROM igp_programs
        WHERE id = $1
          AND fund_source_id = $2
        RETURNING id`,
      [id, fund?.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({
        success: false,
        error: "IGP program/project not found.",
      });
    }

    await writeAuditLog({
      req, module: "IGP Registry", action: "DELETE",
      tableName: "igp_programs", recordId: id,
      oldValues: oldProgram.rows[0] || null,
    });

    res.json({
      success: true,
      message: "IGP program/project deleted successfully.",
      id,
    });
  } catch (error) {
    if (error.code === "23503") {
      return res.status(409).json({
        success: false,
        error:
          "This program has transactions and cannot be deleted. Use archive/inactive instead.",
      });
    }

    res.status(500).json({
      success: false,
      error: errorMessage(error),
    });
  }
});

/* ============================================================
   TRANSACTIONS
============================================================ */

router.get("/transactions", async (req, res) => {
  const year = n(req.query.year, FY);
  const page = Math.max(1, n(req.query.page, 1));
  const limit = Math.min(100, Math.max(1, n(req.query.limit, 10)));
  const offset = (page - 1) * limit;
  const search = String(req.query.search || "").trim();
  const type = String(req.query.type || "").trim();

  try {
    const fund = await getIgpFundSource();
    if (!fund) {
      return res.status(400).json({
        success: false,
        error: "Fund Source 161 was not found.",
      });
    }

    const values = [year, fund.id];
    let index = 3;
    let where = `WHERE t.fiscal_year = $1
                   AND t.fund_source_id = $2`;

    if (["Income", "Utilization", "Adjustment"].includes(type)) {
      where += ` AND t.transaction_type = $${index}`;
      values.push(type);
      index++;
    }

    if (search) {
      where += `
        AND (
          COALESCE(t.registry_no,'') ILIKE $${index}
          OR COALESCE(t.burs_serial_no,'') ILIKE $${index}
          OR COALESCE(t.payee,'') ILIKE $${index}
          OR COALESCE(t.program_id::text,'') ILIKE $${index}
          OR COALESCE(p.program_code,'') ILIKE $${index}
          OR COALESCE(p.program_name,'') ILIKE $${index}
          OR COALESCE(t.reference_no,'') ILIKE $${index}
          OR COALESCE(t.description,'') ILIKE $${index}
        )`;
      values.push(`%${search}%`);
      index++;
    }

    const count = await pool.query(
      `SELECT COUNT(*)::int AS total
         FROM igp_transactions t
         LEFT JOIN igp_programs p ON p.id = t.igp_program_id
         ${where}`,
      values
    );

    const rows = await pool.query(
      `SELECT
         t.*,
         t.description AS particulars,
         p.program_code,
         p.program_name,
         fc.code AS fund_cluster_code,
         fc.name AS fund_cluster_name,
         c.code AS campus_code,
         c.name AS campus_name,
         rc.code AS responsibility_center_code,
         rc.name AS responsibility_center_name,
         pap.code AS pap_code,
         pap.name AS pap_name,
         uc.code AS uacs_code,
         uc.account_title AS uacs_account_title,
         olduc.old_code AS old_uacs_code,
         olduc.code AS old_uacs_master_code,
         ac.code AS allotment_class_code,
         ac.name AS allotment_class_name,
         m.code AS mfo_code,
         m.name AS mfo_name,
         ws.code AS wfp_source_master_code,
         ws.name AS wfp_source_name,
         creator.full_name AS created_by_name,
         creator.role AS created_by_role,
         updater.full_name AS updated_by_name,
         updater.role AS updated_by_role
         FROM igp_transactions t
         LEFT JOIN igp_programs p ON p.id = t.igp_program_id
         LEFT JOIN fund_clusters fc ON fc.id = t.fund_cluster_id
         LEFT JOIN campuses c ON c.id = t.campus_id
         LEFT JOIN responsibility_centers rc ON rc.id = t.responsibility_center_id
         LEFT JOIN pap ON pap.id = t.pap_id
         LEFT JOIN uacs_codes uc ON uc.id = t.uacs_code_id
         LEFT JOIN uacs_codes olduc ON olduc.id = t.old_uacs_code_id
         LEFT JOIN allotment_classes ac ON ac.id = t.allotment_class_id
         LEFT JOIN mfo m ON m.id = t.mfo_id
         LEFT JOIN wfp_sources ws ON ws.id = t.wfp_source_id
         LEFT JOIN users creator ON creator.id = t.created_by
         LEFT JOIN users updater ON updater.id = t.updated_by
         WHERE ${where.replace(/^WHERE\s+/i, '')}
         ORDER BY t.transaction_date DESC, t.id DESC
         LIMIT $${index}
         OFFSET $${index + 1}`,
      [...values, limit, offset]
    );

    res.json({
      success: true,
      data: rows.rows,
      pagination: {
        page,
        limit,
        totalItems: Number(count.rows[0]?.total || 0),
        totalPages: Math.max(
          1,
          Math.ceil(Number(count.rows[0]?.total || 0) / limit)
        ),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: errorMessage(error),
    });
  }
});

router.post("/transactions", requireIgpTransactionManage, async (req, res) => {
  const body = req.body || {};
  const year = n(body.fiscal_year, FY);
  const type = String(body.transaction_type || "").trim();
  const txDate = body.transaction_date || null;

  if (req.user?.role === "Budget") {
    body.income_amount = 0;
    body.unpaid_utilization = 0;
  }

  if (!["Income", "Utilization", "Adjustment"].includes(type)) {
    return res.status(400).json({
      success: false,
      error: "Transaction Type must be Income, Utilization, or Adjustment.",
    });
  }

  if (!body.igp_program_id) {
    return res.status(400).json({
      success: false,
      error: "Program / Project is required.",
    });
  }

  if (!txDate) {
    return res.status(400).json({
      success: false,
      error: "Transaction Date is required.",
    });
  }

  const fund = await getIgpFundSource().catch(() => null);
  if (!fund) {
    return res.status(400).json({
      success: false,
      error: "Fund Source 161 was not found.",
    });
  }

  try {
    const program = await getProgram(nullableInt(body.igp_program_id), fund.id);
    if (!program) {
      return res.status(404).json({
        success: false,
        error: "IGP program/project not found.",
      });
    }

    const transactionNo = await pool.query(
      `SELECT
         'IGP-161-' || $1::text || '-' ||
         LPAD(nextval('igp_transaction_seq')::text, 6, '0') AS transaction_no`,
      [year]
    );

    const transactionNumber = transactionNo.rows[0].transaction_no;
    const generatedSequence = transactionNumber.split("-").pop();
    const bursSerialNumber = `BURS-161-${year}-${generatedSequence}`;

    const income = type === "Income" ? amount(body.income_amount ?? body.amount) : 0;
    const utilization =
      type === "Utilization"
        ? amount(body.utilization_amount ?? body.amount)
        : type === "Adjustment"
        ? amount(body.utilization_amount ?? body.amount)
        : 0;

    if (income <= 0 && utilization <= 0 && type !== "Adjustment") {
      return res.status(400).json({
        success: false,
        error: "Amount must be greater than zero.",
      });
    }

    const month = body.month ? n(body.month) : new Date(txDate).getMonth() + 1;
    const quarter = body.quarter
      ? n(body.quarter)
      : Math.ceil(month / 3);

    const result = await pool.query(
      `INSERT INTO igp_transactions (
         transaction_no,
         transaction_date,
         fiscal_year,
         fund_source_id,
         igp_program_id,
         program_id,
         transaction_type,
         registry_no,
         fund_cluster_id,
         campus_id,
         burs_serial_no,
         serial_no_transferred,
         payee,
         description,
         responsibility_center_id,
         pap_id,
         uacs_code_id,
         reference_no,
         allotment_class_id,
         uacs_funding_source_code,
         month,
         series,
         series2,
         quarter,
         mfo_id,
         old_uacs_code_id,
         account_title,
         income_amount,
         utilization_amount,
         ps_utilization,
         mooe_utilization,
         co_utilization,
         wfp_source_id,
         wfp_source_code,
         running_balance,
         remarks,
         unpaid_utilization,
         status,
         created_by,
         updated_by
       )
       VALUES (
         $1,$2,$3,$4,$5,$5,$6,$1,$7,$8,$9,$10,$11,$12,$13,$14,$15,
         $16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,
         $30,$31,$32,$33,$34,$35,'Posted',$36,$36
       )
       RETURNING *`,
      [
        transactionNumber,
        txDate,
        year,
        fund.id,
        nullableInt(body.igp_program_id),
        type,
        nullableInt(body.fund_cluster_id),
        nullableInt(body.campus_id ?? program.campus_id),
        bursSerialNumber,
        body.serial_no_transferred || null,
        body.payee || null,
        body.particulars || body.description || null,
        nullableInt(body.responsibility_center_id ?? program.responsibility_center_id),
        nullableInt(body.pap_id),
        nullableInt(body.uacs_code_id),
        body.reference_no || null,
        nullableInt(body.allotment_class_id),
        body.uacs_funding_source_code || null,
        month,
        body.series || null,
        body.series2 || null,
        quarter,
        nullableInt(body.mfo_id),
        nullableInt(body.old_uacs_code_id),
        body.account_title || null,
        income,
        utilization,
        amount(body.ps_utilization),
        amount(body.mooe_utilization),
        amount(body.co_utilization),
        nullableInt(body.wfp_source_id),
        body.wfp_source_code || null,
        amount(body.running_balance),
        body.remarks || null,
        amount(body.unpaid_utilization),
        nullableInt(req.user?.id),
      ]
    );

    await writeAuditLog({
      req, module: "IGP Registry", action: "CREATE",
      tableName: "igp_transactions", recordId: result.rows[0].id,
      newValues: result.rows[0],
    });

    res.status(201).json({
      success: true,
      message: "IGP transaction created successfully.",
      data: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: errorMessage(error),
    });
  }
});


// Role-scoped Procurement / Accounting updates for existing Fund 161 transactions.
// These endpoints never accept budget/program fields from these roles.
const IGP_PROCUREMENT_FIELDS = ["po_no", "po_date", "supplier_payee", "po_amount", "air_far_reference", "iar_no", "par_no", "ics_no", "ris_no", "po_status", "procurement_remarks"];
const IGP_ACCOUNTING_FIELDS = ["db_no", "dv_payroll_no", "burs_serial_no", "disbursement_date", "disbursement_amount", "notice_of_adjustment", "adjustment_reason", "accounting_status", "reviewed_by", "review_datetime", "accounting_remarks"];
router.put("/transactions/:id/office-details", (req, res, next) => verifyToken(req, res, next), async (req, res) => {
  const rawRole = String(req.user?.role || "").trim().toLowerCase();
  const role = rawRole === "procurement" ? "Procurement" : rawRole === "accountant" ? "Accountant" : rawRole;
  const fields = role === "Procurement" ? IGP_PROCUREMENT_FIELDS : role === "Accountant" ? IGP_ACCOUNTING_FIELDS : null;
  if (!fields) return res.status(403).json({ success: false, error: "Only Procurement or Accountant may update office details." });
  const id = nullableInt(req.params.id);
  if (!id) return res.status(400).json({ success: false, error: "Invalid transaction ID." });
  const updates = fields.filter((field) => Object.prototype.hasOwnProperty.call(req.body || {}, field));
  if (!updates.length) return res.status(400).json({ success: false, error: "No permitted office fields were supplied." });
  const values = [];
  const setSql = updates.map((field) => {
    let value = req.body[field];
    if (field === "po_amount" || field === "disbursement_amount") value = amount(value);
    if (value === "") value = null;
    values.push(value ?? null);
    return `${field} = $${values.length}`;
  });
  try {
    const beforeResult = await pool.query("SELECT * FROM igp_transactions WHERE id = $1", [id]);
    if (!beforeResult.rows.length) return res.status(404).json({ success: false, error: "IGP transaction not found." });
    const updateValues = [...values, nullableInt(req.user?.id), id];
    const updatedByParam = values.length + 1;
    const idParam = values.length + 2;
    const result = await pool.query(`UPDATE igp_transactions SET ${setSql.join(", ")}, updated_by = $${updatedByParam}, updated_at=CURRENT_TIMESTAMP WHERE id=$${idParam} RETURNING *`, updateValues);
    if (!result.rows.length) return res.status(404).json({ success: false, error: "IGP transaction not found." });
    await writeAuditLog({ req, module: "IGP Registry", action: "UPDATE OFFICE DETAILS", tableName: "igp_transactions", recordId: id, oldValues: beforeResult.rows[0], newValues: result.rows[0] });
    return res.json({ success: true, transaction: result.rows[0] });
  } catch (error) {
    return res.status(500).json({ success: false, error: errorMessage(error) });
  }
});

router.put("/transactions/:id", requireIgpTransactionManage, async (req, res) => {
  const id = nullableInt(req.params.id);
  const body = req.body || {};

  if (!id) {
    return res.status(400).json({
      success: false,
      error: "Invalid transaction ID.",
    });
  }

  const type = String(body.transaction_type || "").trim();

  if (req.user?.role === "Budget") {
    body.income_amount = 0;
    body.unpaid_utilization = 0;
  }

  if (!["Income", "Utilization", "Adjustment"].includes(type)) {
    return res.status(400).json({
      success: false,
      error: "Invalid transaction type.",
    });
  }

  try {
    const fund = await getIgpFundSource();
    if (!fund) {
      return res.status(400).json({
        success: false,
        error: "Fund Source 161 was not found.",
      });
    }

    const oldTransaction = await pool.query(
      `SELECT * FROM igp_transactions WHERE id = $1 AND fund_source_id = $2`,
      [id, fund.id]
    );

    if (!oldTransaction.rows.length) {
      return res.status(404).json({
        success: false,
        error: "IGP transaction not found.",
      });
    }


    const result = await pool.query(
      `UPDATE igp_transactions
          SET transaction_date = $1,
              transaction_type = $2,
              fund_cluster_id = $3,
              campus_id = $4,
              serial_no_transferred = $5,
              payee = $6,
              description = $7,
              responsibility_center_id = $8,
              pap_id = $9,
              uacs_code_id = $10,
              reference_no = $11,
              allotment_class_id = $12,
              uacs_funding_source_code = $13,
              month = $14,
              series = $15,
              series2 = $16,
              quarter = $17,
              object_expenditure_id = $18,
              mfo_id = $19,
              old_uacs_code_id = $20,
              account_title = $21,
              income_amount = $22,
              utilization_amount = $23,
              ps_utilization = $24,
              mooe_utilization = $25,
              co_utilization = $26,
              wfp_source_id = $27,
              wfp_source_code = $28,
              running_balance = $29,
              remarks = $30,
              unpaid_utilization = $31,
              updated_by = $32,
              updated_at = CURRENT_TIMESTAMP
        WHERE id = $33
          AND fund_source_id = $34
        RETURNING *`,
      [
        body.transaction_date,
        type,
        nullableInt(body.fund_cluster_id),
        nullableInt(body.campus_id),
        body.serial_no_transferred || null,
        body.payee || null,
        body.particulars || body.description || null,
        nullableInt(body.responsibility_center_id),
        nullableInt(body.pap_id),
        nullableInt(body.uacs_code_id),
        body.reference_no || null,
        nullableInt(body.allotment_class_id),
        body.uacs_funding_source_code || null,
        n(body.month, new Date(body.transaction_date).getMonth() + 1),
        body.series || null,
        body.series2 || null,
        n(body.quarter, Math.ceil(n(body.month, new Date(body.transaction_date).getMonth() + 1) / 3)),
        nullableInt(body.object_expenditure_id),
        nullableInt(body.mfo_id),
        nullableInt(body.old_uacs_code_id),
        body.account_title || null,
        type === "Income" ? amount(body.income_amount ?? body.amount) : 0,
        type === "Utilization" ? amount(body.utilization_amount ?? body.amount) : 0,
        amount(body.ps_utilization),
        amount(body.mooe_utilization),
        amount(body.co_utilization),
        nullableInt(body.wfp_source_id),
        body.wfp_source_code || null,
        amount(body.running_balance),
        body.remarks || null,
        amount(body.unpaid_utilization),
        nullableInt(req.user?.id),
        id,
        fund.id,
      ]
    );

    if (!result.rows.length) {
      return res.status(404).json({
        success: false,
        error: "IGP transaction not found.",
      });
    }

    await writeAuditLog({
      req, module: "IGP Registry", action: "UPDATE",
      tableName: "igp_transactions", recordId: result.rows[0].id,
      oldValues: oldTransaction.rows[0] || null,
      newValues: result.rows[0],
    });

    res.json({
      success: true,
      message: "IGP transaction updated successfully.",
      data: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: errorMessage(error),
    });
  }
});

router.delete("/transactions/:id", requireIgpAdmin, async (req, res) => {
  const id = nullableInt(req.params.id);

  if (!id) {
    return res.status(400).json({
      success: false,
      error: "Invalid transaction ID.",
    });
  }

  try {
    const fund = await getIgpFundSource();

    const oldTransaction = await pool.query(
      `SELECT * FROM igp_transactions WHERE id = $1 AND fund_source_id = $2`,
      [id, fund?.id]
    );

    const result = await pool.query(
      `DELETE FROM igp_transactions
        WHERE id = $1
          AND fund_source_id = $2
          AND status = 'Draft'
        RETURNING id`,
      [id, fund?.id]
    );

    if (!result.rows.length) {
      return res.status(409).json({
        success: false,
        error:
          "Only Draft IGP transactions can be deleted. Posted records should be cancelled/voided instead.",
      });
    }

    await writeAuditLog({
      req, module: "IGP Registry", action: "DELETE",
      tableName: "igp_transactions", recordId: id,
      oldValues: oldTransaction.rows[0] || null,
    });

    res.json({
      success: true,
      message: "Draft IGP transaction deleted successfully.",
      id,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: errorMessage(error),
    });
  }
});

/* ============================================================
   MONTHLY MONITORING
============================================================ */

router.get("/audit-log", requireIgpView, async (req, res) => {
  try {
    const limit = Math.min(200, Math.max(1, n(req.query.limit, 100)));
    const result = await pool.query(
      `SELECT
         a.id, a.user_id, a.role, a.module, a.action, a.table_name,
         a.record_id, a.old_values, a.new_values, a.ip_address,
         a.user_agent, a.created_at,
         u.full_name, u.username
       FROM audit_log a
       LEFT JOIN users u ON u.id = a.user_id
       WHERE a.module = 'IGP Registry'
       ORDER BY a.created_at DESC, a.id DESC
       LIMIT $1`,
      [limit]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: errorMessage(error) });
  }
});

router.get("/monitoring", requireIgpView, async (req, res) => {
  const year = n(req.query.year, FY);

  try {
    const fund = await getIgpFundSource();
    if (!fund) {
      return res.status(400).json({
        success: false,
        error: "Fund Source 161 was not found.",
      });
    }

    const result = await pool.query(
      `WITH months AS (
         SELECT generate_series(1, 12) AS month_no
       ),
       monthly AS (
         SELECT
           t.month AS month_no,
           COALESCE(SUM(CASE
             WHEN t.transaction_type = 'Income' AND t.status <> 'Cancelled'
             THEN t.income_amount ELSE 0 END), 0) AS actual_income,
           COALESCE(SUM(CASE
             WHEN t.status <> 'Cancelled'
             THEN t.utilization_amount ELSE 0 END), 0) AS utilization,
           COALESCE(SUM(CASE
             WHEN t.status <> 'Cancelled'
             THEN t.disbursement_amount ELSE 0 END), 0) AS disbursement,
           COALESCE(SUM(CASE
             WHEN t.status <> 'Cancelled'
             THEN t.unpaid_utilization ELSE 0 END), 0) AS unpaid_utilization
         FROM igp_transactions t
         WHERE t.fiscal_year = $1
           AND t.fund_source_id = $2
         GROUP BY t.month
       )
       SELECT
         m.month_no,
         TO_CHAR(TO_DATE(m.month_no::text, 'MM'), 'FMMonth') AS month_name,
         COALESCE(x.actual_income, 0) AS actual_income,
         COALESCE(x.utilization, 0) AS utilization,
         COALESCE(x.disbursement, 0) AS disbursement,
         COALESCE(x.unpaid_utilization, 0) AS unpaid_utilization,
         COALESCE(SUM(COALESCE(x.actual_income,0) - COALESCE(x.utilization,0))
           OVER (ORDER BY m.month_no ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW), 0)
           + COALESCE((
             SELECT SUM(p.beginning_balance)
             FROM igp_programs p
             WHERE p.fiscal_year = $1
               AND p.fund_source_id = $2
           ),0) AS available_balance
       FROM months m
       LEFT JOIN monthly x ON x.month_no = m.month_no
       ORDER BY m.month_no`,
      [year, fund.id]
    );

    res.json({
      success: true,
      data: {
        fiscal_year: year,
        monthly: result.rows.map(row => ({
          ...row,
          actual_income: n(row.actual_income),
          utilization: n(row.utilization),
          disbursement: n(row.disbursement),
          unpaid_utilization: n(row.unpaid_utilization),
          available_balance: n(row.available_balance),
        })),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: errorMessage(error),
    });
  }
});

/* ============================================================
   CSV EXPORT
============================================================ */

router.get("/export", async (req, res) => {
  const year = n(req.query.year, FY);

  try {
    const fund = await getIgpFundSource();
    if (!fund) {
      return res.status(400).send("Fund Source 161 was not found.");
    }

    const result = await pool.query(
      `SELECT
         t.registry_no,
         t.transaction_date,
         fc.code AS fund_cluster,
         '161' AS fund_code,
         p.program_code,
         c.name AS campus,
         t.burs_serial_no,
         t.serial_no_transferred,
         t.payee,
         t.description AS particulars,
         rc.code AS responsibility_center,
         pap.code AS pap,
         uc.code AS uacs_code,
         t.reference_no,
         ac.code AS allotment_class,
         t.uacs_funding_source_code,
         t.fiscal_year,
         t.month,
         t.series,
         t.series2,
         t.quarter,
         m.code AS mfo,
         uc.old_code AS old_uacs_code,
         t.account_title,
         t.income_amount,
         t.utilization_amount,
         t.ps_utilization,
         t.mooe_utilization,
         t.co_utilization,
         ws.code AS wfp_source,
         t.wfp_source_code,
         t.running_balance,
         t.remarks,
         t.unpaid_utilization,
         t.status
         FROM igp_transactions t
         LEFT JOIN igp_programs p ON p.id = t.igp_program_id
         LEFT JOIN fund_clusters fc ON fc.id = t.fund_cluster_id
         LEFT JOIN campuses c ON c.id = t.campus_id
         LEFT JOIN responsibility_centers rc ON rc.id = t.responsibility_center_id
         LEFT JOIN pap ON pap.id = t.pap_id
         LEFT JOIN uacs_codes uc ON uc.id = t.uacs_code_id
         LEFT JOIN allotment_classes ac ON ac.id = t.allotment_class_id
         LEFT JOIN mfo m ON m.id = t.mfo_id
         LEFT JOIN wfp_sources ws ON ws.id = t.wfp_source_id
        WHERE t.fiscal_year = $1
          AND t.fund_source_id = $2
        ORDER BY t.transaction_date, t.id`,
      [year, fund.id]
    );

    const escape = (value) => {
      const text = value === null || value === undefined ? "" : String(value);
      return `"${text.replace(/"/g, '""')}"`;
    };

    const headers = [
      "Registry No.",
      "Date",
      "Fund Cluster",
      "Fund Code",
      "Fund Code / IGP Program",
      "Campus",
      "BURS Serial No.",
      "Serial No. Transferred From/To",
      "Payee / Name",
      "Particulars / Description",
      "Responsibility Center",
      "PAP",
      "UACS Code",
      "Ref. No.",
      "Allotment Class",
      "UACS Funding Source Code",
      "Year",
      "Month",
      "Series",
      "Series2",
      "Quarter",
      "MFO",
      "Old UACS Code",
      "Account Title",
      "Income",
      "Utilization",
      "PS",
      "MOOE",
      "CO",
      "WFP Source",
      "WFP Source Code",
      "Balance",
      "Remarks",
      "Unpaid Utilization",
      "Transaction Status",
    ];

    const lines = [
      headers.map(escape).join(","),
      ...result.rows.map((row) =>
        [
          row.registry_no,
          row.transaction_date,
          row.fund_cluster,
          row.fund_code,
          row.program_code,
          row.campus,
          row.burs_serial_no,
          row.serial_no_transferred,
          row.payee,
          row.particulars,
          row.responsibility_center,
          row.pap,
          row.uacs_code,
          row.reference_no,
          row.allotment_class,
          row.uacs_funding_source_code,
          row.fiscal_year,
          row.month,
          row.series,
          row.series2,
          row.quarter,
          row.mfo,
          row.old_uacs_code,
          row.account_title,
          row.income_amount,
          row.utilization_amount,
          row.ps_utilization,
          row.mooe_utilization,
          row.co_utilization,
          row.wfp_source,
          row.wfp_source_code,
          row.running_balance,
          row.remarks,
          row.unpaid_utilization,
          row.status,
        ].map(escape).join(",")
      ),
    ];

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="IGP_Fund161_FY${year}_Registry.csv"`
    );
    res.send(lines.join("\n"));
  } catch (error) {
    res.status(500).send(errorMessage(error));
  }
});

module.exports = router;