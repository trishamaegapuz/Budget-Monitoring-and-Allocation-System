// server/routes/raod.js

// Complete RAOD Registry backend for BMAS.

// Source basis: RAOD FY 2026 structure/terminology previously supplied by the user.

// RAOD is centered on General Fund / Fund Cluster 101.



const express = require("express");

const router = express.Router();

const pool = require("../db");

const { verifyToken } = require("../middleware/auth");



const FY = 2026;

// The database may store the General Fund cluster as either:

//   code = "101"

//   code = "101 GENERAL FUND"

// Keep "101" as the logical fund code and resolve the actual DB row

// through getGeneralIds() below.

const GENERAL_FUND_CODE = "101";

const GENERAL_FUND_SOURCE_CODE = "MAIN";





const RAOD_VIEW_ROLES = ["Administration", "Budget", "Procurement", "Accountant"];

const RAOD_CREATE_ROLES = ["Administration", "Budget"];

const RAOD_DELETE_ROLES = ["Administration"];



const RAOD_FIELDS = [

  "registry_no","burs_serial_no","entry_date","fund_cluster_id","fund_source_id","campus_id",

  "po_date","disbursement_date","review_datetime",

  "serial_no_transferred","payee","particulars",

  "responsibility_center_id","pap_id","uacs_code_id","ref_no",

  "allotment_class_id","uacs_funding_source_code","fiscal_year","month",

  "series","series2","quarter","object_expenditure_id","mfo_id",

  "old_uacs_code_id","account_title","obligation_amount","ps_amount",

  "mooe_amount","co_amount","wfp_source_id","wfp_source_code",

  "dv_payroll_no","disbursement_amount","remarks",

  "unpaid_obligation","po_no","po_status"

];



const RAOD_SYSTEM_FIELDS = new Set([

  "registry_no","burs_serial_no","ors_serial_no","fund_cluster_id","fund_source_id","fiscal_year",

  "running_balance","unpaid_obligation"

]);



const RAOD_BUDGET_FIELDS = new Set([

  "entry_date","campus_id","serial_no_transferred","payee",

  "particulars","responsibility_center_id","pap_id","uacs_code_id","ref_no",

  "allotment_class_id","uacs_funding_source_code","month","series","series2",

  "quarter","object_expenditure_id","mfo_id","old_uacs_code_id","account_title",

  "obligation_amount","ps_obligation","mooe_obligation","co_obligation",

  "wfp_source_id","wfp_source_code","remarks"

]);

const RAOD_ACCOUNTING_FIELDS = new Set(["dv_payroll_no","db_no","disbursement_amount","disbursement_date","notice_of_adjustment","adjustment_reason","accounting_status","reviewed_by","review_datetime","accounting_remarks"]);

const RAOD_PROCUREMENT_FIELDS = new Set(["po_no","po_date","supplier_payee","po_amount","air_far_reference","iar_no","par_no","ics_no","ris_no","po_status","procurement_remarks"]);



function normalizeRaodRole(value) {

  const raw = String(value || "").trim().toLowerCase().replace(/[._-]+/g, " ").replace(/\s+/g, " ");

  if (["administration","administrator","admin","system administrator"].includes(raw)) return "Administration";

  if (["budget","budget officer"].includes(raw)) return "Budget";

  if (["procurement","procurement officer"].includes(raw)) return "Procurement";

  if (["accountant","accounting"].includes(raw)) return "Accountant";

  return "";

}



function raodUser(req) {

  const user = req.user || req.auth || req.session?.user || {};

  return user?.user || user;

}



function raodRole(req) {

  return normalizeRaodRole(raodUser(req)?.role);

}



function requireRaodView(req, res, next) {

  return verifyToken(req, res, () => {

    const role = raodRole(req);

    if (!RAOD_VIEW_ROLES.includes(role)) {

      return res.status(403).json({ success: false, error: "RAOD access is not allowed for this role." });

    }

    req.raodRole = role;

    next();

  });

}



function requireRaodCreate(req, res, next) {

  return requireRaodView(req, res, () => {

    if (!RAOD_CREATE_ROLES.includes(req.raodRole)) {

      return res.status(403).json({ success: false, error: "Only Administration or Budget can create RAOD transactions." });

    }

    next();

  });

}



function requireRaodDelete(req, res, next) {

  return requireRaodView(req, res, () => {

    if (!RAOD_DELETE_ROLES.includes(req.raodRole)) {

      return res.status(403).json({ success: false, error: "Only Administration can delete RAOD transactions." });

    }

    next();

  });

}



function editableRaodFields(role) {

  // Procurement and Accounting fields are owned by their respective offices.
  // Administration may manage general RAOD fields but cannot edit either office's fields.
  if (role === "Administration") return new Set(RAOD_FIELDS.filter(f => !RAOD_SYSTEM_FIELDS.has(f) && !RAOD_PROCUREMENT_FIELDS.has(f) && !RAOD_ACCOUNTING_FIELDS.has(f)));

  if (role === "Budget") return RAOD_BUDGET_FIELDS;

  if (role === "Accountant") return RAOD_ACCOUNTING_FIELDS;

  if (role === "Procurement") return RAOD_PROCUREMENT_FIELDS;

  return new Set();

}



function auditActor(req) {

  const user = raodUser(req);

  return {

    id: user?.id ?? user?.user_id ?? user?.userId ?? null,

    name: String(user?.full_name || user?.name || user?.username || user?.email || "Unknown User"),

    email: user?.email ? String(user.email) : null,

    role: normalizeRaodRole(user?.role),

  };

}



async function writeRaodAudit(client, { req, entryId, registryNo, action, changedFields = [], oldValues = null, newValues = null }) {

  const actor = auditActor(req);

  await client.query(`

    INSERT INTO raod_audit_trail

      (raod_entry_id, registry_no, action, performed_by_id, performed_by_name,

       performed_by_email, performed_by_role, changed_fields, old_values, new_values,

       ip_address, user_agent)

    VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9::jsonb,$10::jsonb,$11,$12)

  `, [

    entryId ?? null, registryNo ?? null, action, actor.id, actor.name, actor.email,

    actor.role, JSON.stringify(changedFields || []), JSON.stringify(oldValues ?? null),

    JSON.stringify(newValues ?? null), req.ip || null, req.get("user-agent") || null

  ]);

}



function changedRaodFields(oldRow, newRow) {

  return RAOD_FIELDS.filter(field => {

    const dbField = field === "po_status" ? "status_of_po"
      : field === "ps_obligation" ? "ps_amount"
      : field === "mooe_obligation" ? "mooe_amount"
      : field === "co_obligation" ? "co_amount"
      : field;

    return String(oldRow?.[dbField] ?? "") !== String(newRow?.[dbField] ?? "");

  });

}



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

    WHEN UPPER(COALESCE(r.workflow_status,'ACTIVE')) = 'CANCELLED' THEN 'CANCELLED'

    WHEN COALESCE(r.disbursement_amount,0) > 0 THEN 'DISBURSED'

    WHEN COALESCE(r.obligation_amount,0) > 0 THEN 'OBLIGATION'

    ELSE 'RECORDED'

  END

`;



async function getGeneralIds() {

  const [cluster, source] = await Promise.all([

    pool.query(

      `SELECT id, code, name FROM fund_clusters

       WHERE (

         code = $1

         OR split_part(trim(code), ' ', 1) = $1

         OR (name ILIKE '%GENERAL FUND%' AND split_part(trim(code), ' ', 1) = $1)

       )

       AND COALESCE(is_active,TRUE)=TRUE

       ORDER BY CASE WHEN code = $1 THEN 0 ELSE 1 END, id

       LIMIT 1`,

      [GENERAL_FUND_CODE]

    ),

    pool.query(

      `SELECT id, code, name FROM fund_sources

       WHERE (

         code = $1

         OR split_part(trim(code), ' ', 1) = $1

       )

       AND COALESCE(is_active,TRUE)=TRUE

       ORDER BY CASE WHEN code = $1 THEN 0 ELSE 1 END, id

       LIMIT 1`,

      [GENERAL_FUND_SOURCE_CODE]

    ),

  ]);



  return {

    cluster: cluster.rows[0] || null,

    source: source.rows[0] || null,

  };

}



async function getWfpSource(wfpSourceId) {
  const id = nullableInt(wfpSourceId);
  if (id === null) return null;

  const result = await pool.query(
    `SELECT id, code, name
       FROM wfp_sources
      WHERE id=$1 AND COALESCE(is_active,TRUE)=TRUE
      LIMIT 1`,
    [id]
  );

  return result.rows[0] || null;
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
      GREATEST(0, COALESCE((SELECT SUM(bi.approved_budget) FROM budget_items bi WHERE bi.fiscal_year=r.fiscal_year AND bi.fund_cluster_id=r.fund_cluster_id AND bi.responsibility_center_id=r.responsibility_center_id),0) - COALESCE((SELECT SUM(r2.obligation_amount) FROM raod_entries r2 WHERE r2.fiscal_year=r.fiscal_year AND r2.fund_cluster_id=r.fund_cluster_id AND r2.responsibility_center_id=r.responsibility_center_id AND r2.id <= r.id),0)) AS running_balance,
      r.ps_amount AS ps_obligation,
      r.mooe_amount AS mooe_obligation,
      r.co_amount AS co_obligation,
      r.obligation_amount AS utilization_amount,
      r.ps_amount AS utilization_ps,
      r.mooe_amount AS utilization_mooe,
      r.co_amount AS utilization_co,
      r.unpaid_obligation AS unpaid_utilization,

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

      ws.code AS wfp_source_code,

      ws.name AS wfp_source_name,

      r.status_of_po AS po_status,

      created_audit.performed_by_name AS entered_by_name,
      created_audit.performed_by_email AS entered_by_email,
      created_audit.created_at AS entered_at,
      updated_audit.performed_by_name AS updated_by_name,
      updated_audit.performed_by_email AS updated_by_email,
      updated_audit.created_at AS updated_at,
      procurement_audit.performed_by_name AS procurement_entered_by_name,
      procurement_audit.performed_by_email AS procurement_entered_by_email,
      procurement_audit.created_at AS procurement_entered_at,
      procurement_updated.performed_by_name AS procurement_updated_by_name,
      procurement_updated.performed_by_email AS procurement_updated_by_email,
      procurement_updated.created_at AS procurement_updated_at,
      accounting_audit.performed_by_name AS accounting_entered_by_name,
      accounting_audit.performed_by_email AS accounting_entered_by_email,
      accounting_audit.created_at AS accounting_entered_at,
      accounting_updated.performed_by_name AS accounting_updated_by_name,
      accounting_updated.performed_by_email AS accounting_updated_by_email,
      accounting_updated.created_at AS accounting_updated_at,
      COALESCE(r.workflow_status, 'ACTIVE') AS workflow_status,
      review.final_review_status,
      review.final_reviewed_by,
      review.final_reviewed_at,
      review.final_review_remarks,
      adj.adjustment_no AS latest_adjustment_no,
      adj.reason AS latest_adjustment_reason,
      adj.adjusted_by_name AS latest_adjusted_by_name,
      adj.created_at AS latest_adjustment_at

    FROM raod_entries r

    LEFT JOIN LATERAL (
      SELECT final_review_status, reviewed_by_name AS final_reviewed_by, reviewed_at AS final_reviewed_at, remarks AS final_review_remarks
      FROM raod_final_reviews
      WHERE raod_entry_id = r.id
      ORDER BY reviewed_at DESC, id DESC
      LIMIT 1
    ) review ON TRUE

    LEFT JOIN LATERAL (
      SELECT adjustment_no, reason, adjusted_by_name, created_at
      FROM raod_adjustments
      WHERE raod_entry_id = r.id
      ORDER BY created_at DESC, id DESC
      LIMIT 1
    ) adj ON TRUE

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

    LEFT JOIN LATERAL (
      SELECT performed_by_name, performed_by_email, created_at
      FROM raod_audit_trail
      WHERE raod_entry_id = r.id
        AND UPPER(action) = 'CREATE'
      ORDER BY created_at ASC, id ASC
      LIMIT 1
    ) created_audit ON TRUE

    LEFT JOIN LATERAL (
      SELECT performed_by_name, performed_by_email, created_at
      FROM raod_audit_trail
      WHERE raod_entry_id = r.id
        AND UPPER(action) IN ('UPDATE','EDIT')
      ORDER BY created_at DESC, id DESC
      LIMIT 1
    ) updated_audit ON TRUE

    LEFT JOIN LATERAL (
      SELECT performed_by_name, performed_by_email, created_at
      FROM raod_audit_trail
      WHERE raod_entry_id = r.id
        AND UPPER(action) IN ('UPDATE','EDIT')
        AND EXISTS (
          SELECT 1
          FROM jsonb_array_elements_text(COALESCE(changed_fields, '[]'::jsonb)) AS f(field_name)
          WHERE f.field_name IN ('po_no','po_date','supplier_payee','po_amount','air_far_reference','iar_no','par_no','ics_no','ris_no','po_status','status_of_po','procurement_remarks')
        )
      ORDER BY created_at ASC, id ASC
      LIMIT 1
    ) procurement_audit ON TRUE

    LEFT JOIN LATERAL (
      SELECT performed_by_name, performed_by_email, created_at
      FROM raod_audit_trail
      WHERE raod_entry_id = r.id
        AND UPPER(action) IN ('UPDATE','EDIT')
        AND EXISTS (
          SELECT 1
          FROM jsonb_array_elements_text(COALESCE(changed_fields, '[]'::jsonb)) AS f(field_name)
          WHERE f.field_name IN ('po_no','po_date','supplier_payee','po_amount','air_far_reference','iar_no','par_no','ics_no','ris_no','po_status','status_of_po','procurement_remarks')
        )
      ORDER BY created_at DESC, id DESC
      LIMIT 1
    ) procurement_updated ON TRUE

    LEFT JOIN LATERAL (
      SELECT performed_by_name, performed_by_email, created_at
      FROM raod_audit_trail
      WHERE raod_entry_id = r.id
        AND UPPER(action) IN ('UPDATE','EDIT')
        AND EXISTS (
          SELECT 1
          FROM jsonb_array_elements_text(COALESCE(changed_fields, '[]'::jsonb)) AS f(field_name)
          WHERE f.field_name IN ('dv_payroll_no','disbursement_amount')
        )
      ORDER BY created_at ASC, id ASC
      LIMIT 1
    ) accounting_audit ON TRUE

    LEFT JOIN LATERAL (
      SELECT performed_by_name, performed_by_email, created_at
      FROM raod_audit_trail
      WHERE raod_entry_id = r.id
        AND UPPER(action) IN ('UPDATE','EDIT')
        AND EXISTS (
          SELECT 1
          FROM jsonb_array_elements_text(COALESCE(changed_fields, '[]'::jsonb)) AS f(field_name)
          WHERE f.field_name IN ('dv_payroll_no','disbursement_amount')
        )
      ORDER BY created_at DESC, id DESC
      LIMIT 1
    ) accounting_updated ON TRUE

  `;

}



/* GET /api/raod/test */

router.get("/test", requireRaodView, async (_req, res) => {

  try {

    await pool.query("SELECT 1");

    res.json({ success: true, message: "RAOD API is working." });

  } catch (e) {

    res.status(500).json({ success: false, error: e.message });

  }

});



/* GET /api/raod/reference-data */

router.get("/reference-data", requireRaodView, async (_req, res) => {

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

router.get("/overview", requireRaodView, async (req, res) => {

  if (["Procurement", "Accountant"].includes(req.raodRole)) {
    return res.status(403).json({ success: false, error: `Access restricted: ${req.raodRole} may access RAOD Transactions and role-specific reports only.` });
  }
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

       WHERE r.fiscal_year=$1 AND split_part(trim(fc.code), ' ', 1)='101'

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

         WHERE r.fiscal_year=$1 AND split_part(trim(fc.code), ' ', 1)='101'

         GROUP BY responsibility_center_id

       ),

       budgets AS (

         SELECT responsibility_center_id,COALESCE(SUM(approved_budget),0) allocation

         FROM budget_items bi

         JOIN fund_clusters fc ON fc.id=bi.fund_cluster_id

         WHERE bi.fiscal_year=$1 AND split_part(trim(fc.code), ' ', 1)='101'

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

       WHERE r.fiscal_year=$1 AND split_part(trim(fc.code), ' ', 1)='101'

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

        // Fund Amount is the General Fund 101 approved budget/allotment.
        fund_amount: allotment,

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

router.get("/department-budget", requireRaodView, async (req, res) => {

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

       WHERE bi.fiscal_year=$1 AND bi.responsibility_center_id=$2 AND split_part(trim(fc.code), ' ', 1)='101'`,

      [fiscalYear, id]

    );



    const actual = await pool.query(

      `SELECT COUNT(*)::int records,

              COALESCE(SUM(obligation_amount),0) obligation,

              COALESCE(SUM(disbursement_amount),0) disbursement

       FROM raod_entries r

       JOIN fund_clusters fc ON fc.id=r.fund_cluster_id

       WHERE r.fiscal_year=$1 AND r.responsibility_center_id=$2 AND split_part(trim(fc.code), ' ', 1)='101'`,

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

      // Fund Amount is the approved budget/allotment sourced from budget_items.approved_budget.
      // Existing allocation/allotment fields are preserved for compatibility.
      fund_amount: allocation,

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

router.get("/", requireRaodView, async (req, res) => {

  const page = Math.max(1, parseInt(req.query.page, 10) || 1);

  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 30));

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

router.get("/department-summary", requireRaodView, async (req, res) => {

  if (["Procurement", "Accountant"].includes(req.raodRole)) {
    return res.status(403).json({ success: false, error: `Access restricted: ${req.raodRole} may access RAOD Transactions and role-specific reports only.` });
  }
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

              COALESCE(b.allotment,0) fund_amount,

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

router.get("/module/:view", requireRaodView, async (req, res) => {

  const view = String(req.params.view || "").toLowerCase();
  const role = req.raodRole;
  const restrictedOperationalRoles = ["Procurement", "Accountant"].includes(role);
  const reportViews = ["financial-reports", "reports-export"];
  if (restrictedOperationalRoles && !reportViews.includes(view)) {
    return res.status(403).json({ success: false, error: `Access restricted: ${role} may access RAOD Transactions and role-specific reports only.` });
  }

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



    if (view === "fund-registry") {

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



    if (view === "financial-reports" || view === "reports-export") {

      // Reports & Export and Financial Accountability Reports must use the
      // actual RAOD transactions.  The previous route returned only report
      // definitions for financial-reports, so the frontend received no
      // entries/summary and displayed zeros even when RAOD records existed.
      const entriesResult = await pool.query(

        `${entrySelect()}

         WHERE r.fiscal_year=$1 AND r.fund_cluster_id=$2

         ORDER BY r.entry_date DESC,r.id DESC`,

        [fiscalYear, ids.cluster.id]

      );

      const budgetResult = await pool.query(

        `SELECT

           COALESCE(SUM(bi.approved_budget),0) AS appropriations,

           COALESCE(SUM(bi.approved_budget),0) AS allotment,

           COALESCE(SUM(bi.ps_amount),0) AS ps,

           COALESCE(SUM(bi.mooe_amount),0) AS mooe,

           COALESCE(SUM(bi.co_amount),0) AS co

         FROM budget_items bi

         WHERE bi.fiscal_year=$1 AND bi.fund_cluster_id=$2`,

        [fiscalYear, ids.cluster.id]

      );

      let entries = entriesResult.rows || [];
      if (role === "Procurement") {
        entries = entries.filter(row => [row.po_no, row.iar_no, row.par_no, row.ics_no, row.ris_no, row.po_status].some(value => String(value || "").trim() !== ""));
      } else if (role === "Accountant") {
        entries = entries.filter(row => Number(row.obligation_amount || 0) > 0 || Number(row.disbursement_amount || 0) > 0 || String(row.dv_payroll_no || "").trim() !== "");
      }
      const budget = budgetResult.rows[0] || {};
      const totalObligation = entries.reduce((sum, row) => sum + Number(row.obligation_amount || 0), 0);
      const totalDisbursement = entries.reduce((sum, row) => sum + Number(row.disbursement_amount || 0), 0);
      const totalUnpaid = entries.reduce((sum, row) => sum + Number(row.unpaid_obligation || 0), 0);
      const allotment = Number(budget.allotment || 0);

      return res.json({

        success: true,

        view,

        fiscal_year: fiscalYear,

        fund: ids.cluster,

        entries,

        summary: {
          appropriations: Number(budget.appropriations || 0),
          allotment,
          ps: Number(budget.ps || 0),
          mooe: Number(budget.mooe || 0),
          co: Number(budget.co || 0),
          obligation: totalObligation,
          disbursement: totalDisbursement,
          balance: Math.max(0, allotment - totalObligation),
          unpaid_obligation: totalUnpaid,
          records: entries.length,
        },
        reports: [

          { code: "FAR 1", name: "Statement of Appropriations, Allotments, Obligations, Disbursements and Balances" },

          { code: "FAR 1A", name: "Summary of Appropriations, Allotments, Obligations and Balances by Object of Expenditures" },

          { code: "SARONCA", name: "Summary of Appropriations, Releases, Obligations and Notice of Cash Allocation" },

        ],

      });

    }



    if (view === "master-data") return res.status(404).json({ error: "Master Data is maintained in the system Reference Data module and is not part of RAOD Fund 101 dashboard modules." });



    return res.status(404).json({ error: `Unknown RAOD module view: ${view}` });

  } catch (e) {

    console.error("RAOD module view:", e);

    res.status(500).json({ error: "Failed to load RAOD module data.", details: e.message });

  }

});





/* GET /api/raod/department/:id/entries */

router.get("/department/:id/entries", requireRaodView, async (req, res) => {

  const rcId = nullableInt(req.params.id);

  const fiscalYear = n(req.query.fiscal_year, FY);

  const page = Math.max(1, parseInt(req.query.page, 10) || 1);

  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 30));

  const offset = (page - 1) * limit;

  if (rcId === null) return res.status(400).json({ error: "Invalid responsibility center ID." });

  try {

    const countResult = await pool.query(`SELECT COUNT(*)::int AS total FROM raod_entries r JOIN fund_clusters fc ON fc.id=r.fund_cluster_id WHERE r.fiscal_year=$1 AND r.responsibility_center_id=$2 AND split_part(trim(fc.code), ' ', 1)='101'`, [fiscalYear, rcId]);

    const totalItems = Number(countResult.rows[0]?.total || 0);

    const result = await pool.query(`${entrySelect()} WHERE r.fiscal_year=$1 AND r.responsibility_center_id=$2 AND split_part(trim(fc.code), ' ', 1)='101' ORDER BY r.entry_date DESC,r.id DESC LIMIT $3 OFFSET $4`, [fiscalYear, rcId, limit, offset]);

    res.json({ success:true, fiscal_year:fiscalYear, entries:result.rows, totalItems, totalPages:Math.max(1, Math.ceil(totalItems/limit)), currentPage:page, limit });

  } catch (e) {

    console.error("RAOD department entries:", e);

    res.status(500).json({ error:"Failed to load Department / Responsibility Center RAOD entries.", details:e.message });

  }

});



/* GET /api/raod/:id */

router.get("/:id", requireRaodView, async (req, res) => {

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

router.post("/departments", requireRaodView, async (req, res) => {

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



/*

 * Excel-aligned RAOD General Fund 101 fields.

 * The FY2026 workbook contains 37 business fields. The database also keeps

 * created_by/updated_by and timestamps for accountability.

 */

const columns = [

  "registry_no","burs_serial_no","entry_date","fund_cluster_id","fund_source_id","campus_id",

  "ors_serial_no","serial_no_transferred","payee","particulars",

  "responsibility_center_id","pap_id","uacs_code_id","ref_no",

  "allotment_class_id","uacs_funding_source_code","fiscal_year","month",

  "series","series2","quarter","object_expenditure_id","mfo_id",

  "old_uacs_code_id","account_title","obligation_amount","ps_amount",

  "mooe_amount","co_amount","wfp_source_id","wfp_source_code",

  "dv_payroll_no","disbursement_amount","remarks",

  "unpaid_obligation","po_no","po_date","supplier_payee","po_amount","air_far_reference","iar_no","par_no","ics_no","ris_no","status_of_po","procurement_remarks","db_no","disbursement_date","notice_of_adjustment","adjustment_reason","accounting_status","reviewed_by","review_datetime","accounting_remarks","created_by","updated_by"

];



const idFields = [

  "fund_cluster_id","fund_source_id","campus_id","responsibility_center_id",

  "pap_id","uacs_code_id","allotment_class_id","object_expenditure_id",

  "mfo_id","wfp_source_id","old_uacs_code_id","quarter","month"

];

const moneyFields = [

  "obligation_amount","ps_amount","mooe_amount","co_amount","po_amount",

  "disbursement_amount","unpaid_obligation"

];



function payload(body, userId, { preserveCreatedBy = null } = {}) {

  const p = {};

  for (const key of columns) {

    if (idFields.includes(key)) p[key] = nullableInt(body[key]);

    else if (moneyFields.includes(key)) p[key] = amount(body[key]);

    else p[key] = body[key] === "" || body[key] === undefined ? null : body[key];

  }

  p.fiscal_year = n(body.fiscal_year, FY);

  // API/form names are ps_obligation, mooe_obligation, co_obligation;
  // PostgreSQL raod_entries stores these as ps_amount, mooe_amount, co_amount.
  p.ps_amount = amount(body.ps_obligation ?? body.ps_amount);
  p.mooe_amount = amount(body.mooe_obligation ?? body.mooe_amount);
  p.co_amount = amount(body.co_obligation ?? body.co_amount);
  // Frontend/API uses po_status; PostgreSQL column is status_of_po.
  p.status_of_po = body.status_of_po ?? body.po_status ?? null;

  p.unpaid_obligation = Math.max(0, n(p.obligation_amount) - n(p.disbursement_amount));


  p.created_by = preserveCreatedBy !== null ? nullableInt(preserveCreatedBy) : nullableInt(userId);

  p.updated_by = nullableInt(userId);

  return p;

}



async function getBudgetForResponsibilityCenter(responsibilityCenterId, fiscalYear) {

  const rcId = nullableInt(responsibilityCenterId);

  if (rcId === null) return null;

  const result = await pool.query(

    `SELECT COALESCE(SUM(bi.approved_budget),0) AS allocation,

            COALESCE(SUM(bi.ps_amount),0) AS ps,

            COALESCE(SUM(bi.mooe_amount),0) AS mooe,

            COALESCE(SUM(bi.co_amount),0) AS co

       FROM budget_items bi

       JOIN fund_clusters fc ON fc.id=bi.fund_cluster_id

      WHERE bi.fiscal_year=$1 AND bi.responsibility_center_id=$2

        AND split_part(trim(fc.code), ' ', 1)='101'`,

    [n(fiscalYear, FY), rcId]

  );

  return result.rows[0] || { allocation: 0, ps: 0, mooe: 0, co: 0 };

}



/* GET RAOD audit trail for one transaction */

router.get("/audit/:id", requireRaodView, async (req, res) => {

  try {

    const result = await pool.query(`

      SELECT id, raod_entry_id, registry_no, action, performed_by_id,

             performed_by_name, performed_by_email, performed_by_role,

             changed_fields, old_values, new_values, ip_address, user_agent, created_at

        FROM raod_audit_trail

       WHERE raod_entry_id=$1

       ORDER BY created_at DESC, id DESC

    `, [req.params.id]);

    res.json({ success: true, audit: result.rows });

  } catch (e) {

    res.status(500).json({ success: false, error: "Failed to load RAOD audit trail.", details: e.message });

  }

});



/* POST /api/raod — Administration/Budget only */

router.post("/", requireRaodCreate, async (req, res) => {

  const body = req.body || {};

  const actorId = raodUser(req)?.id ?? raodUser(req)?.user_id ?? raodUser(req)?.userId ?? null;

  const ids = await getGeneralIds().catch(() => ({ cluster: null, source: null }));



  if (!body.entry_date) return res.status(400).json({ error: "Entry Date is required." });

  if (!body.responsibility_center_id) return res.status(400).json({ error: "Responsibility Center is required." });

  if (body.month !== undefined && body.month !== "" && (!Number.isInteger(Number(body.month)) || Number(body.month) < 1 || Number(body.month) > 12)) return res.status(400).json({ error: "Month must be between 1 and 12." });

  if (body.quarter !== undefined && body.quarter !== "" && (!Number.isInteger(Number(body.quarter)) || Number(body.quarter) < 1 || Number(body.quarter) > 4)) return res.status(400).json({ error: "Quarter must be between 1 and 4." });

  if (!ids.cluster || !ids.source) return res.status(400).json({ error: "General Fund 101 / MAIN reference data was not found." });



  try {

    // Enforce role ownership on create as well as update. Budget owns only
    // budget/obligation fields; Procurement and Accounting must complete their
    // own sections later through the dedicated role-specific endpoints.
    if (req.raodRole === "Budget") {
      body.dv_payroll_no = null;
      body.disbursement_amount = 0;
      body.po_no = null;
      body.iar_no = null;
      body.par_no = null;
      body.ics_no = null;
      body.ris_no = null;
      body.po_status = null;
      body.status_of_po = null;
    }

    const fiscalYear = n(body.fiscal_year, FY);
    const wfpSource = await getWfpSource(body.wfp_source_id ?? body.wfp_source);
    if (body.wfp_source_id ?? body.wfp_source) {
      if (!wfpSource) return res.status(400).json({ error: "Selected WFP Source is invalid or inactive." });
      body.wfp_source_id = wfpSource.id;
      body.wfp_source_code = wfpSource.code;
    } else {
      body.wfp_source_id = null;
      body.wfp_source_code = null;
    }

    const budget = await getBudgetForResponsibilityCenter(body.responsibility_center_id, fiscalYear);

    const allocation = n(budget?.allocation);

    const obligation = amount(body.obligation_amount);

    const disbursement = amount(body.disbursement_amount);

    if (allocation <= 0) return res.status(400).json({ error: "No approved budget/allotment was found for the selected Responsibility Center for the selected fiscal year." });

    if (disbursement > obligation) return res.status(400).json({ error: "Disbursement cannot be greater than Obligation." });



    const existing = await pool.query(`SELECT COALESCE(SUM(obligation_amount),0) AS obligation

      FROM raod_entries WHERE fiscal_year=$1 AND responsibility_center_id=$2 AND fund_cluster_id=$3`,

      [fiscalYear, nullableInt(body.responsibility_center_id), ids.cluster.id]);

    const existingObligation = n(existing.rows[0]?.obligation);

    if (existingObligation + obligation > allocation) {

      return res.status(400).json({ error: `Obligation of ${obligation.toFixed(2)} exceeds the available allotment of ${Math.max(0, allocation-existingObligation).toFixed(2)} for this Responsibility Center.` });

    }



    const client = await pool.connect();

    try {

      await client.query("BEGIN");

      await client.query(`SELECT pg_advisory_xact_lock(hashtext($1))`, [`RAOD_REGISTRY_${fiscalYear}`]);

      const next = await client.query(`SELECT COALESCE(MAX((regexp_match(registry_no,$1))[1]::integer),0)+1 next_no

        FROM raod_entries WHERE fiscal_year=$2 AND registry_no ~ $1`, [`^101-${fiscalYear}-([0-9]+)$`, fiscalYear]);

      const registryNo = `101-${fiscalYear}-${String(Number(next.rows[0]?.next_no || 1)).padStart(4,"0")}`;

      // BURS Serial No. is system-generated and permanent.
      const nextBurs = await client.query(`SELECT COALESCE(MAX((regexp_match(burs_serial_no,$1))[1]::integer),0)+1 next_no
        FROM raod_entries WHERE fiscal_year=$2 AND burs_serial_no ~ $1`, [`^BURS-${fiscalYear}-([0-9]+)$`, fiscalYear]);
      const bursSerialNo = `BURS-${fiscalYear}-${String(Number(nextBurs.rows[0]?.next_no || 1)).padStart(4,"0")}`;

      // ORS Serial No. is system-generated and permanent.
      const nextOrs = await client.query(`SELECT COALESCE(MAX((regexp_match(ors_serial_no,$1))[1]::integer),0)+1 next_no

        FROM raod_entries WHERE fiscal_year=$2 AND ors_serial_no ~ $1`, [`^ORS-${fiscalYear}-([0-9]+)$`, fiscalYear]);
      const orsSerialNo = `ORS-${fiscalYear}-${String(Number(nextOrs.rows[0]?.next_no || 1)).padStart(4,"0")}`;



      const p = payload({

        ...body, fund_cluster_id: ids.cluster.id, fund_source_id: ids.source.id,

        fiscal_year: fiscalYear, registry_no: registryNo,
        burs_serial_no: bursSerialNo,
        ors_serial_no: orsSerialNo,

        ps_obligation: n(body.ps_obligation, budget?.ps),

        mooe_obligation: n(body.mooe_obligation, budget?.mooe),

        co_obligation: n(body.co_obligation, budget?.co),

        obligation_amount: obligation, disbursement_amount: disbursement,

        unpaid_obligation: Math.max(0, obligation-disbursement),

        po_status: body.po_status || null,

      }, actorId);

      p.registry_no = registryNo;
      p.burs_serial_no = bursSerialNo;
      p.ors_serial_no = orsSerialNo;

      p.created_by = nullableInt(actorId);

      p.updated_by = nullableInt(actorId);



      const vals = columns.map(c => p[c]);

      const result = await client.query(`INSERT INTO raod_entries (${columns.join(",")}) VALUES (${vals.map((_,i)=>`$${i+1}`).join(",")}) RETURNING *`, vals);

      const created = result.rows[0];

      await writeRaodAudit(client, {
        req,
        entryId: created.id,
        registryNo: created.registry_no,
        action: "CREATE",
        changedFields: RAOD_FIELDS.filter(f => {
          const dbField = f === "po_status" ? "status_of_po" : f;
          return created[dbField] !== null && created[dbField] !== undefined && String(created[dbField]) !== "";
        }),
        newValues: created
      });

      await client.query("COMMIT");

      res.status(201).json({ success:true, message:"RAOD record created successfully.", entry:created });

    } catch (txError) {

      await client.query("ROLLBACK");

      throw txError;

    } finally { client.release(); }

  } catch (e) {

    console.error("RAOD create:", e);

    if (e.code === "23505") return res.status(409).json({ error:"Registry No. or BURS Serial No. already exists.", details:e.detail });

    if (e.code === "23503") return res.status(400).json({ error:"One of the selected reference records is invalid.", details:e.detail || e.message });

    res.status(500).json({ error:"Failed to create RAOD entry.", details:e.message });

  }

});



/* PUT /api/raod/:id — role-owned field updates */

router.put("/:id", requireRaodView, async (req, res) => {

  const role = req.raodRole;
  const userId = raodUser(req)?.id ?? raodUser(req)?.user_id ?? raodUser(req)?.userId ?? null;

  try {
    const current = await pool.query(`SELECT * FROM raod_entries WHERE id=$1 LIMIT 1`, [req.params.id]);
    if (!current.rows.length) return res.status(404).json({ error:"RAOD entry not found." });

    const existing = current.rows[0];
    const requestBody = req.body || {};

    /*
     * PROCUREMENT-SPECIFIC UPDATE
     * Keep this separate from the general RAOD payload so every procurement
     * field is explicitly mapped to its real PostgreSQL column. This avoids
     * the situation where PO No. updates but IAR/PAR/ICS/RIS/Status do not.
     */
    if (role === "Procurement") {
      const required = [["PO No.", "po_no"], ["PO Date", "po_date"], ["Supplier / Payee", "supplier_payee"], ["PO Amount", "po_amount"], ["Procurement Status", "po_status"], ["Procurement Remarks", "procurement_remarks"]];
      const missing = required.find(([label, key]) => requestBody[key] === undefined || requestBody[key] === null || String(requestBody[key]).trim() === "");
      if (missing) return res.status(400).json({ error: `${missing[0]} is required for the Procurement role.`, field: missing[1] });
      const fieldMap = {
        // Keep every Procurement form field mapped to its actual database column.
        po_no: "po_no",
        po_date: "po_date",
        supplier_payee: "supplier_payee",
        po_amount: "po_amount",
        air_far_reference: "air_far_reference",
        iar_no: "iar_no",
        par_no: "par_no",
        ics_no: "ics_no",
        ris_no: "ris_no",
        po_status: "status_of_po",
        procurement_remarks: "procurement_remarks",
      };

      const updates = [];
      const values = [];
      const changedFields = [];
      const oldValues = {};
      const newValues = {};

      for (const [apiField, dbField] of Object.entries(fieldMap)) {
        if (!Object.prototype.hasOwnProperty.call(requestBody, apiField)) continue;

        const raw = requestBody[apiField];
        let value = raw === undefined || raw === null || String(raw).trim() === "" ? null : String(raw).trim();
        if (apiField === "po_amount" && value !== null) {
          const numericAmount = Number(value);
          if (!Number.isFinite(numericAmount) || numericAmount < 0) {
            return res.status(400).json({ error: "PO Amount must be a valid non-negative amount." });
          }
          value = numericAmount;
        }
        if (apiField === "po_date" && value !== null && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
          return res.status(400).json({ error: "PO Date must be a valid date." });
        }
        const oldValue = existing[dbField] ?? null;

        if (String(oldValue ?? "") !== String(value ?? "")) {
          updates.push(`${dbField}=$${values.length + 1}`);
          values.push(value);
          const auditField = apiField;
          changedFields.push(auditField);
          oldValues[auditField] = oldValue;
          newValues[auditField] = value;
        }
      }

      if (updates.length === 0) {
        return res.json({
          success: true,
          message: "No procurement changes detected.",
          entry: existing,
          changed_fields: []
        });
      }

      const entryId = req.params.id;
      const updateParams = [...values, userId, entryId];
      const updatedByParam = values.length + 1;
      const entryIdParam = values.length + 2;

      const result = await pool.query(
        `UPDATE raod_entries
            SET ${updates.join(", ")}, updated_by=$${updatedByParam}, updated_at=CURRENT_TIMESTAMP
          WHERE id=$${entryIdParam}
          RETURNING *`,
        updateParams
      );

      const updated = result.rows[0];

      await writeRaodAudit(pool, {
        req,
        entryId: updated.id,
        registryNo: updated.registry_no,
        action: "UPDATE",
        changedFields,
        oldValues,
        newValues: {
          ...newValues,
          po_status: updated.status_of_po ?? null
        }
      });

      return res.json({
        success: true,
        message: "Procurement information updated successfully.",
        entry: updated,
        changed_fields: changedFields
      });
    }

    const editable = editableRaodFields(role);
    if (!editable.size) return res.status(403).json({ success:false, error:"Your role is not allowed to edit RAOD transactions." });

    const body = { ...existing };
    for (const field of editable) if (Object.prototype.hasOwnProperty.call(requestBody, field)) body[field] = requestBody[field];

    body.registry_no = existing.registry_no;
    body.burs_serial_no = existing.burs_serial_no;
    body.fund_cluster_id = existing.fund_cluster_id;
    body.fund_source_id = existing.fund_source_id;
    body.fiscal_year = existing.fiscal_year;
    body.created_by = existing.created_by;

    const wfpSource = await getWfpSource(body.wfp_source_id);
    if (body.wfp_source_id) {
      if (!wfpSource) return res.status(400).json({ error: "Selected WFP Source is invalid or inactive." });
      body.wfp_source_id = wfpSource.id;
      body.wfp_source_code = wfpSource.code;
    } else {
      body.wfp_source_id = null;
      body.wfp_source_code = null;
    }

    const budget = await getBudgetForResponsibilityCenter(body.responsibility_center_id, body.fiscal_year);
    const allocation = n(budget?.allocation);
    const obligation = amount(body.obligation_amount);
    const disbursement = amount(body.disbursement_amount);
    if (role === "Budget" && allocation <= 0) return res.status(400).json({ error:"No approved budget/allotment was found for the selected Responsibility Center." });
    if (disbursement > obligation) return res.status(400).json({ error:"Disbursement cannot be greater than Obligation." });

    if (role === "Budget") {
      const existingOther = await pool.query(`SELECT COALESCE(SUM(obligation_amount),0) obligation FROM raod_entries
        WHERE fiscal_year=$1 AND responsibility_center_id=$2 AND fund_cluster_id=$3 AND id<>$4`,
        [body.fiscal_year, nullableInt(body.responsibility_center_id), existing.fund_cluster_id, req.params.id]);
      const otherObligation = n(existingOther.rows[0]?.obligation);
      if (otherObligation + obligation > allocation) return res.status(400).json({ error:`Obligation exceeds the available allotment of ${Math.max(0,allocation-otherObligation).toFixed(2)} for this Responsibility Center.` });
      body.ps_obligation = n(body.ps_obligation, budget?.ps);
      body.mooe_obligation = n(body.mooe_obligation, budget?.mooe);
      body.co_obligation = n(body.co_obligation, budget?.co);
    }

    body.unpaid_obligation = Math.max(0, obligation-disbursement);

    const p = payload(body, userId, { preserveCreatedBy: existing.created_by });
    p.registry_no = existing.registry_no;
    p.burs_serial_no = existing.burs_serial_no;
    p.fund_cluster_id = existing.fund_cluster_id;
    p.fund_source_id = existing.fund_source_id;
    p.fiscal_year = existing.fiscal_year;

    const sets = columns.map((c,i) => `${c}=$${i+1}`).join(",");
    const values = columns.map(c => p[c]);
    const result = await pool.query(`UPDATE raod_entries SET ${sets}, updated_at=CURRENT_TIMESTAMP WHERE id=$${values.length+1} RETURNING *`, [...values, req.params.id]);
    const updated = result.rows[0];

    const changed = changedRaodFields(existing, updated);
    if (changed.length) {
      const oldValues={}, newValues={};
      changed.forEach(f => { oldValues[f]=existing[f]; newValues[f]=updated[f]; });
      await writeRaodAudit(pool, { req, entryId:updated.id, registryNo:updated.registry_no, action:"UPDATE", changedFields:changed, oldValues, newValues });
    }
    res.json({ success:true, message:"RAOD record updated successfully.", entry:updated, changed_fields:changed });
  } catch (e) {
    console.error("RAOD update:", e);
    res.status(500).json({ error:"Failed to update RAOD entry.", details:e.message });
  }

});



/* PUT /api/raod/:id/procurement — separate Procurement Transaction form */
router.put("/:id/procurement", requireRaodView, async (req, res) => {
  const role = req.raodRole;
  if (!["Administration", "Procurement"].includes(role)) {
    return res.status(403).json({ error: "Only Administration or Procurement may update Procurement Transactions." });
  }

  const userId = raodUser(req)?.id ?? raodUser(req)?.user_id ?? raodUser(req)?.userId ?? null;
  const required = [["PO No.", "po_no"], ["PO Date", "po_date"], ["Supplier / Payee", "supplier_payee"], ["PO Amount", "po_amount"], ["Procurement Status", "po_status"], ["Procurement Remarks", "procurement_remarks"]];
  const missing = required.find(([label, key]) => req.body?.[key] === undefined || req.body?.[key] === null || String(req.body[key]).trim() === "");
  if (missing) return res.status(400).json({ error: `${missing[0]} is required for the Procurement role.`, field: missing[1] });
  if (!Number.isFinite(Number(req.body.po_amount)) || Number(req.body.po_amount) <= 0) return res.status(400).json({ error: "PO Amount must be greater than zero.", field: "po_amount" });
  // Persist every editable field shown in the Procurement form, not only the reference numbers.
  // The database column for PO status is status_of_po; the API/UI uses po_status.
  const fieldMap = {
    po_no: "po_no",
    po_date: "po_date",
    supplier_payee: "supplier_payee",
    po_amount: "po_amount",
    air_far_reference: "air_far_reference",
    iar_no: "iar_no",
    par_no: "par_no",
    ics_no: "ics_no",
    ris_no: "ris_no",
    po_status: "status_of_po",
    procurement_remarks: "procurement_remarks",
  };

  try {
    const current = await pool.query(`SELECT * FROM raod_entries WHERE id=$1 LIMIT 1`, [req.params.id]);
    if (!current.rows.length) return res.status(404).json({ error: "RAOD entry not found." });

    const existing = current.rows[0];
    const updates = [];
    const values = [];
    const changedFields = [];
    const oldValues = {};
    const newValues = {};

    for (const [apiField, dbField] of Object.entries(fieldMap)) {
      if (!Object.prototype.hasOwnProperty.call(req.body || {}, apiField)) continue;
      const raw = req.body[apiField];
      const value = raw === undefined || raw === null || String(raw).trim() === "" ? null : String(raw).trim();
      const oldValue = existing[dbField] ?? null;
      if (String(oldValue ?? "") !== String(value ?? "")) {
        updates.push(`${dbField}=$${values.length + 1}`);
        values.push(value);
        changedFields.push(apiField);
        oldValues[apiField] = oldValue;
        newValues[apiField] = value;
      }
    }

    if (!updates.length) return res.json({ success: true, message: "No procurement changes detected.", entry: existing, changed_fields: [] });

    values.push(userId, req.params.id);
    const updatedByParam = values.length - 1;
    const entryIdParam = values.length;
    const result = await pool.query(
      `UPDATE raod_entries SET ${updates.join(", ")}, updated_by=$${updatedByParam}, updated_at=CURRENT_TIMESTAMP WHERE id=$${entryIdParam} RETURNING *`,
      values
    );
    const updated = result.rows[0];

    await writeRaodAudit(pool, {
      req,
      entryId: updated.id,
      registryNo: updated.registry_no,
      action: "UPDATE",
      changedFields,
      oldValues,
      newValues,
    });

    res.json({ success: true, message: "Procurement Transaction saved successfully.", entry: updated, changed_fields: changedFields });
  } catch (e) {
    console.error("RAOD procurement transaction update:", e);
    res.status(500).json({ error: "Failed to save Procurement Transaction.", details: e.message });
  }
});

/* PUT /api/raod/:id/accounting — separate Accounting Transaction form */
router.put("/:id/accounting", requireRaodView, async (req, res) => {
  const role = req.raodRole;
  if (!["Administration", "Accountant"].includes(role)) {
    return res.status(403).json({ error: "Only Administration or Accountant may update Accounting Transactions." });
  }

  const userId = raodUser(req)?.id ?? raodUser(req)?.user_id ?? raodUser(req)?.userId ?? null;
  const required = [["DB No.", "db_no"], ["DV / Payroll No.", "dv_payroll_no"], ["Disbursement Date", "disbursement_date"], ["Disbursement Amount", "disbursement_amount"], ["Accounting Status", "accounting_status"], ["Reviewed By", "reviewed_by"], ["Review Date and Time", "review_datetime"], ["Accounting Remarks", "accounting_remarks"]];
  const missing = required.find(([label, key]) => req.body?.[key] === undefined || req.body?.[key] === null || String(req.body[key]).trim() === "");
  if (missing) return res.status(400).json({ error: `${missing[0]} is required for the Accountant role.`, field: missing[1] });
  if (!Number.isFinite(Number(req.body.disbursement_amount)) || Number(req.body.disbursement_amount) < 0) return res.status(400).json({ error: "Disbursement Amount must be a valid non-negative amount.", field: "disbursement_amount" });
  const fieldMap = {
    db_no: "db_no",
    dv_payroll_no: "dv_payroll_no",
    disbursement_date: "disbursement_date",
    disbursement_amount: "disbursement_amount",
    notice_of_adjustment: "notice_of_adjustment",
    adjustment_reason: "adjustment_reason",
    accounting_status: "accounting_status",
    reviewed_by: "reviewed_by",
    review_datetime: "review_datetime",
    accounting_remarks: "accounting_remarks",
  };

  try {
    const current = await pool.query(`SELECT * FROM raod_entries WHERE id=$1 LIMIT 1`, [req.params.id]);
    if (!current.rows.length) return res.status(404).json({ error: "RAOD entry not found." });

    const existing = current.rows[0];
    const obligation = amount(existing.obligation_amount);
    const requestedDisbursement = amount(req.body?.disbursement_amount);
    if (requestedDisbursement > obligation) {
      return res.status(400).json({ error: "Disbursement cannot be greater than the Obligation." });
    }

    const updates = [];
    const values = [];
    const changedFields = [];
    const oldValues = {};
    const newValues = {};

    for (const [apiField, dbField] of Object.entries(fieldMap)) {
      if (!Object.prototype.hasOwnProperty.call(req.body || {}, apiField)) continue;
      let value = req.body[apiField];
      if (apiField === "disbursement_amount") value = amount(value);
      else value = value === undefined || value === null || String(value).trim() === "" ? null : String(value).trim();
      const oldValue = existing[dbField] ?? null;
      if (String(oldValue ?? "") !== String(value ?? "")) {
        updates.push(`${dbField}=$${values.length + 1}`);
        values.push(value);
        changedFields.push(apiField);
        oldValues[apiField] = oldValue;
        newValues[apiField] = value;
      }
    }

    if (!updates.length) return res.json({ success: true, message: "No accounting changes detected.", entry: existing, changed_fields: [] });

    values.push(userId, req.params.id);
    const updatedByParam = values.length - 1;
    const entryIdParam = values.length;
    const result = await pool.query(
      `UPDATE raod_entries SET ${updates.join(", ")}, unpaid_obligation=GREATEST(0, obligation_amount-COALESCE(disbursement_amount,0)), updated_by=$${updatedByParam}, updated_at=CURRENT_TIMESTAMP WHERE id=$${entryIdParam} RETURNING *`,
      values
    );
    const updated = result.rows[0];

    await writeRaodAudit(pool, {
      req,
      entryId: updated.id,
      registryNo: updated.registry_no,
      action: "UPDATE",
      changedFields,
      oldValues,
      newValues,
    });

    res.json({ success: true, message: "Accounting Transaction saved successfully.", entry: updated, changed_fields: changedFields });
  } catch (e) {
    console.error("RAOD accounting transaction update:", e);
    res.status(500).json({ error: "Failed to save Accounting Transaction.", details: e.message });
  }
});


/* PUT /api/raod/:id/status — shared workflow status; Budget can cancel, Administration can cancel/restore */
router.put("/:id/status", requireRaodView, async (req, res) => {
  const role = req.raodRole;
  if (!["Administration", "Budget"].includes(role)) return res.status(403).json({ error: "Only Administration or Budget may change the RAOD transaction status." });
  const requested = String(req.body?.status || "").trim().toUpperCase();
  if (!["ACTIVE", "CANCELLED"].includes(requested)) return res.status(400).json({ error: "Status must be ACTIVE or CANCELLED." });
  if (requested === "ACTIVE" && role !== "Administration") return res.status(403).json({ error: "Only Administration may restore a cancelled RAOD transaction." });
  const userId = raodUser(req)?.id ?? raodUser(req)?.user_id ?? raodUser(req)?.userId ?? null;
  try {
    const current = await pool.query(`SELECT * FROM raod_entries WHERE id=$1 LIMIT 1`, [req.params.id]);
    if (!current.rows.length) return res.status(404).json({ error: "RAOD entry not found." });
    const existing = current.rows[0];
    const oldStatus = String(existing.workflow_status || "ACTIVE").toUpperCase();
    if (oldStatus === requested) return res.json({ success: true, message: `RAOD transaction is already ${requested}.`, entry: existing });
    const result = await pool.query(`UPDATE raod_entries SET workflow_status=$1, updated_by=$2, updated_at=CURRENT_TIMESTAMP WHERE id=$3 RETURNING *`, [requested, userId, req.params.id]);
    const updated = result.rows[0];
    await writeRaodAudit(pool, { req, entryId: updated.id, registryNo: updated.registry_no, action: requested === "CANCELLED" ? "CANCEL" : "RESTORE", changedFields: ["workflow_status"], oldValues: { workflow_status: oldStatus }, newValues: { workflow_status: requested } });
    res.json({ success: true, message: `RAOD transaction ${requested === "CANCELLED" ? "cancelled" : "restored"} successfully.`, entry: updated });
  } catch (e) {
    console.error("RAOD status update:", e);
    res.status(500).json({ error: "Failed to update RAOD transaction status.", details: e.message });
  }
});

/* POST /api/raod/:id/adjustment — accountant/admin correction with immutable history */
router.post("/:id/adjustment", requireRaodView, async (req, res) => {
  const role = req.raodRole;
  if (!["Administration", "Accountant"].includes(role)) return res.status(403).json({ error: "Only Administration or Accountant may process a Notice of Adjustment." });
  const reason = String(req.body?.reason || "").trim();
  const field = String(req.body?.field || "").trim();
  if (!reason) return res.status(400).json({ error: "Adjustment reason is required." });
  const allowed = new Set(["dv_payroll_no","disbursement_amount","obligation_amount","ps_amount","mooe_amount","co_amount","remarks"]);
  if (!allowed.has(field)) return res.status(400).json({ error: "That field is not eligible for an Accounting adjustment." });
  const user = auditActor(req);
  const userId = user.id;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const current = await client.query(`SELECT * FROM raod_entries WHERE id=$1 FOR UPDATE`, [req.params.id]);
    if (!current.rows.length) { await client.query("ROLLBACK"); return res.status(404).json({ error: "RAOD entry not found." }); }
    const existing = current.rows[0];
    if (String(existing.workflow_status || "ACTIVE").toUpperCase() === "CANCELLED") { await client.query("ROLLBACK"); return res.status(400).json({ error: "Cancelled RAOD transactions cannot be adjusted." }); }
    await client.query(`SELECT pg_advisory_xact_lock(hashtext($1))`, [`RAOD_NOA_${existing.fiscal_year}`]);
    const oldValue = existing[field] ?? null;
    let newValue = req.body?.new_value;
    if (["disbursement_amount","obligation_amount","ps_amount","mooe_amount","co_amount"].includes(field)) {
      newValue = amount(newValue);
      if (field === "disbursement_amount" && newValue > amount(existing.obligation_amount)) { await client.query("ROLLBACK"); return res.status(400).json({ error: "Disbursement cannot be greater than the Obligation." }); }
    } else {
      newValue = newValue === undefined || newValue === null || String(newValue).trim() === "" ? null : String(newValue).trim();
    }
    const next = await client.query(`SELECT COALESCE(MAX((regexp_match(adjustment_no,$1))[1]::integer),0)+1 next_no FROM raod_adjustments WHERE fiscal_year=$2 AND adjustment_no ~ $1`, [`^NOA-${existing.fiscal_year}-([0-9]+)$`, existing.fiscal_year]);
    const adjustmentNo = `NOA-${existing.fiscal_year}-${String(Number(next.rows[0]?.next_no || 1)).padStart(4,"0")}`;
    await client.query(`UPDATE raod_entries SET ${field}=$1, unpaid_obligation=GREATEST(0, obligation_amount-COALESCE(disbursement_amount,0)), updated_by=$2, updated_at=CURRENT_TIMESTAMP WHERE id=$3`, [newValue, userId, req.params.id]);
    await client.query(`INSERT INTO raod_adjustments (raod_entry_id, registry_no, fiscal_year, adjustment_no, field_name, reason, old_value, new_value, adjusted_by_id, adjusted_by_name, adjusted_by_role) VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9,$10,$11)`, [existing.id, existing.registry_no, existing.fiscal_year, adjustmentNo, field, reason, JSON.stringify({ [field]: oldValue }), JSON.stringify({ [field]: newValue }), userId, user.name, user.role]);
    await writeRaodAudit(client, { req, entryId: existing.id, registryNo: existing.registry_no, action: "ADJUSTMENT", changedFields: [field, "adjustment_no", "adjustment_reason"], oldValues: { [field]: oldValue }, newValues: { [field]: newValue, adjustment_no: adjustmentNo, reason } });
    const updated = await client.query(`SELECT * FROM raod_entries WHERE id=$1`, [req.params.id]);
    await client.query("COMMIT");
    res.json({ success: true, message: `Notice of Adjustment ${adjustmentNo} recorded successfully.`, adjustment_no: adjustmentNo, entry: updated.rows[0] });
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("RAOD adjustment:", e);
    res.status(500).json({ error: "Failed to process Notice of Adjustment.", details: e.message });
  } finally { client.release(); }
});

/* POST /api/raod/:id/final-review — Accountant final review */
router.post("/:id/final-review", requireRaodView, async (req, res) => {
  const role = req.raodRole;
  if (!["Administration", "Accountant"].includes(role)) return res.status(403).json({ error: "Only Administration or Accountant may complete final review." });
  const decision = String(req.body?.decision || "").trim().toUpperCase();
  const remarks = String(req.body?.remarks || "").trim() || null;
  if (!["APPROVED","RETURNED"].includes(decision)) return res.status(400).json({ error: "Final review decision must be APPROVED or RETURNED." });
  const user = auditActor(req);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const current = await client.query(`SELECT * FROM raod_entries WHERE id=$1 FOR UPDATE`, [req.params.id]);
    if (!current.rows.length) { await client.query("ROLLBACK"); return res.status(404).json({ error: "RAOD entry not found." }); }
    const entry = current.rows[0];
    if (String(entry.workflow_status || "ACTIVE").toUpperCase() === "CANCELLED") { await client.query("ROLLBACK"); return res.status(400).json({ error: "Cancelled RAOD transactions cannot be final-reviewed." }); }
    const review = await client.query(`INSERT INTO raod_final_reviews (raod_entry_id, registry_no, final_review_status, reviewed_by_id, reviewed_by_name, reviewed_by_role, remarks) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`, [entry.id, entry.registry_no, decision, user.id, user.name, user.role, remarks]);
    await writeRaodAudit(client, { req, entryId: entry.id, registryNo: entry.registry_no, action: "FINAL_REVIEW", changedFields: ["final_review_status","final_reviewed_by","final_reviewed_at","final_review_remarks"], oldValues: null, newValues: { decision, reviewed_by: user.name, reviewed_at: review.rows[0].reviewed_at, remarks } });
    await client.query("COMMIT");
    res.json({ success: true, message: `Final review ${decision.toLowerCase()} successfully.`, review: review.rows[0] });
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("RAOD final review:", e);
    res.status(500).json({ error: "Failed to complete final review.", details: e.message });
  } finally { client.release(); }
});

router.delete("/:id", requireRaodDelete, async (req, res) => {

  const client = await pool.connect();

  try {

    await client.query("BEGIN");

    const old = await client.query(`SELECT * FROM raod_entries WHERE id=$1 FOR UPDATE`, [req.params.id]);

    if (!old.rows.length) { await client.query("ROLLBACK"); return res.status(404).json({ error:"RAOD entry not found." }); }

    const row = old.rows[0];

    const result = await client.query(`DELETE FROM raod_entries WHERE id=$1 RETURNING id`, [req.params.id]);

    await writeRaodAudit(client, { req, entryId:row.id, registryNo:row.registry_no, action:"DELETE", changedFields:RAOD_FIELDS, oldValues:row, newValues:null });

    await client.query("COMMIT");

    res.json({ success:true, message:"RAOD entry deleted successfully.", id:row.id });

  } catch (e) {

    await client.query("ROLLBACK").catch(()=>{});

    res.status(500).json({ error:"Failed to delete RAOD entry.", details:e.message });

  } finally { client.release(); }

});



module.exports = router;