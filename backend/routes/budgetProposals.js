const express = require('express');

const router = express.Router();

const pool = require('../db');

const { verifyToken } = require('../middleware/auth');



const number = (value) => {

  const n = Number(value);

  return Number.isFinite(n) ? n : 0;

};



const clean = (value) => {

  if (value === undefined || value === null) return null;

  const text = String(value).trim();

  return text === '' ? null : text;

};



const pick = (obj, keys, fallback = null) => {

  for (const key of keys) {

    if (obj && obj[key] !== undefined && obj[key] !== null && obj[key] !== '') {

      return obj[key];

    }

  }

  return fallback;

};



const normalizeStatus = (value) => {

  const raw = String(value || 'Draft').trim();

  const map = {

    draft: 'Draft',

    submitted: 'Submitted',

    pending: 'Submitted',

    'for review': 'Under Review',

    'under review': 'Under Review',

    endorsed: 'Endorsed',

    'for approval': 'Endorsed',

    approved: 'Approved',

    returned: 'For Revision',

    'for revision': 'For Revision',

    disapproved: 'Rejected',

    rejected: 'Rejected'

  };

  return map[raw.toLowerCase()] || raw;

};



// ============================================================

// ROLE-BASED ACCESS CONTROL

// ============================================================



// Normalize role labels consistently across frontend and backend.
// Some login/profile payloads use Administrator/Admin while the workflow
// permissions are defined using the canonical role name Administration.
const normalizeProposalRole = (value) => {
  const role = String(value || '').trim().toLowerCase().replace(/[\\s_-]+/g, '');
  if (['administration', 'administrator', 'admin'].includes(role)) return 'Administration';
  if (['budget', 'budgetofficer'].includes(role)) return 'Budget';
  if (role === 'accountant') return 'Accountant';
  if (role === 'procurement') return 'Procurement';
  if (role === 'staff') return 'Staff';
  return String(value || '').trim();
};

const requireProposalRoles = (...allowedRoles) => {
  return (req, res, next) => {
    const role = normalizeProposalRole(req.user?.role || req.user?.user_role || req.user?.account_role);
    const normalizedAllowedRoles = allowedRoles.map(normalizeProposalRole);

    if (!normalizedAllowedRoles.includes(role)) {
      return res.status(403).json({
        success: false,
        error: 'You are not authorized to perform this Budget Proposal action.'
      });
    }

    next();
  };
};

const requireProposalStatusRole = (req, res, next) => {
  const rawRole = req.user?.role || req.user?.user_role || req.user?.account_role;
  const role = normalizeProposalRole(rawRole);
  const requestedStatus = normalizeStatus(req.body?.status);

  const roleByStatus = {
    // Budget may submit proposals; Administration alone controls review decisions.
    Submitted: ['Budget'],
    'Under Review': ['Administration'],
    'For Revision': ['Administration'],
    Endorsed: ['Administration'],
    Approved: ['Administration'],
    Rejected: ['Administration']
  };

  const allowedRoles = roleByStatus[requestedStatus];

  if (!allowedRoles) {
    return res.status(400).json({
      success: false,
      error: 'Invalid workflow status.'
    });
  }

  if (!allowedRoles.includes(role)) {
    return res.status(403).json({
      success: false,
      error: `The ${String(rawRole || 'current user').trim()} role is not authorized to change a proposal to "${requestedStatus}".`
    });
  }

  next();
};



const amountKeys = [

  'requested_amount',

  'proposed_amount',

  'proposal_amount',

  'amount',

  'budget_amount',

  'appropriation',

  'allotment',

  'obligation_amount'

];



function normalizeProposal(row) {

  const d = row?.data || row || {};



  // IMPORTANT: budget_proposals.requested_amount is the authoritative

  // total proposal amount. proposed_ps/proposed_mooe/proposed_co are

  // only the breakdown. This prevents a zero-valued legacy alias from

  // overriding the actual requested amount.

  const requestedAmount = number(d.requested_amount);

  const breakdownAmount =

    number(d.proposed_ps) +

    number(d.proposed_mooe) +

    number(d.proposed_co);



  const amount = requestedAmount > 0

    ? requestedAmount

    : (breakdownAmount > 0

        ? breakdownAmount

        : number(pick(d, amountKeys, 0)));



  const dateValue = pick(d, [

    'proposal_date',

    'submission_date',

    'submitted_at',

    'date',

    'created_at'

  ], null);



  const fundClusterCode = pick(d, ['fund_cluster_code'], null);

  const fundClusterName = pick(d, ['fund_cluster_name', 'fund_cluster', 'fund_group', 'fund_name'], 'Other Funds');

  const fundCluster = fundClusterCode ? `${fundClusterCode} - ${fundClusterName}` : fundClusterName;



  const fundCode = pick(d, ['fund_code', 'fund_source_code', 'fund_source', 'code'], '');



  const rc = pick(d, [

    'responsibility_center',

    'responsibility_center_name',

    'rc'

  ], '');



  const department = pick(d, [

    'department_unit',

    'department',

    'department_name',

    'office_name',

    'pap_department',

    'department_name_from_pap',

    'pap'

  ], '');



  const particulars = pick(d, [
    'particulars',
    'program_project_activity',
    'description',
    'proposal_description',
    'title'
  ], '');



  const id = pick(d, ['id', 'proposal_id', 'budget_proposal_id'], null);

  const fiscalYear = Number(pick(d, ['fiscal_year', 'year'], new Date().getFullYear()));



  const reference = pick(d, [

    'proposal_no',

    'reference_no',

    'reference',

    'budget_proposal_no'

  ], `BP-${fiscalYear}-${id || ''}`);



  return {
    raw: d,
    id,
    reference,

    proposal_no: pick(d, ['proposal_no', 'budget_proposal_no'], reference),

    date: dateValue,

    fiscal_year: fiscalYear,

    fundGroup: fundCluster,

    fund_group: fundCluster,

    fundCode,

    fund_code: fundCode,

    campus: pick(d, ['campus_code'], null) ? `${pick(d, ['campus_code'], '')} - ${pick(d, ['campus_name', 'campus'], '')}` : pick(d, ['campus_name', 'campus'], ''),

    responsibilityCenter: pick(d, ['responsibility_center_code'], null) ? `${pick(d, ['responsibility_center_code'], '')} - ${pick(d, ['responsibility_center_name', 'responsibility_center', 'rc'], '')}` : rc,

    responsibility_center: rc,

    wfpDescription: pick(d, ['wfp_description_name', 'wfp_description', 'wfp'], ''),

    sourceCode: pick(d, ['source_code', 'uacs_funding_source_code'], ''),

    department,

    department_name: department,

    office_name: department,

    proposing_office: department,

    department_unit: department,

    proponent: pick(d, ['proponent', 'prepared_by', 'requested_by', 'created_by_name'], ''),

    title: pick(d, ['title', 'proposal_title'], particulars),

    description: pick(d, ['description', 'proposal_description'], particulars),

    uacsCode: pick(d, ['uacs_code', 'uacs'], '') || pick(d, ['uacs_account_title'], ''),

    mfo_id: pick(d, ['mfo_id'], null),

    mfo: pick(d, ['mfo_name', 'mfo'], ''),

    object_expenditure_id: pick(d, ['object_expenditure_id'], null),

    object_expenditure: pick(d, ['object_expenditure_name', 'object_expenditure'], ''),

    pap: pick(d, ['pap_name', 'pap', 'pap_department', 'program'], ''),

    particulars,

    justification: pick(d, ['justification', 'proposal_justification'], ''),

    expected_outputs: pick(d, ['expected_outputs', 'expectedOutputs', 'expected_result'], ''),

    amount,

    proposed_ps: number(d.proposed_ps),

    proposed_mooe: number(d.proposed_mooe),

    proposed_co: number(d.proposed_co),

    requested_amount: requestedAmount,

    status: normalizeStatus(pick(d, ['status', 'proposal_status'], 'Draft')),

    fund_source: pick(d, ['fund_source', 'fund_source_name', 'funding_source'], fundCluster),

    funding_source: pick(d, ['funding_source', 'fund_source_name', 'fund_source'], ''),

    budget_classification: pick(d, ['budget_classification', 'classification', 'category'], ''),

    category: pick(d, ['category', 'budget_classification', 'classification'], ''),

    fund_cluster_id: pick(d, ['fund_cluster_id'], null),

    fund_source_id: pick(d, ['fund_source_id'], null),

    campus_id: pick(d, ['campus_id'], null),

    responsibility_center_id: pick(d, ['responsibility_center_id'], null),

    wfp_source_id: pick(d, ['wfp_source_id'], null),

    pap_id: pick(d, ['pap_id'], null),

    uacs_code_id: pick(d, ['uacs_code_id'], null),

    allotment_class_id: pick(d, ['allotment_class_id'], null),

    sourceCode: pick(d, ['source_code'], ''),

    supporting_documents: pick(d, ['supporting_documents'], null),

    appropriation_type: pick(d, ['appropriation_type'], ''),

    remarks: pick(d, ['remarks', 'review_remarks'], ''),

    submitted_at: pick(d, ['submitted_at', 'submission_date'], null),

    created_at: pick(d, ['created_at'], null),

    updated_at: pick(d, ['updated_at'], null),

    raw: d

  };

}



async function tableExists(tableName = 'budget_proposals') {

  const result = await pool.query(`

    SELECT EXISTS (

      SELECT 1

      FROM information_schema.tables

      WHERE table_schema = 'public'

        AND table_name = $1

    ) AS exists

  `, [tableName]);

  return result.rows[0].exists;

}



async function getColumns(tableName = 'budget_proposals') {

  const result = await pool.query(`

    SELECT column_name, data_type, is_nullable, column_default

    FROM information_schema.columns

    WHERE table_schema = 'public'

      AND table_name = $1

    ORDER BY ordinal_position

  `, [tableName]);

  return result.rows;

}



async function ensureHistoryTable() {

  await pool.query(`

    CREATE TABLE IF NOT EXISTS budget_proposal_history (

      id BIGSERIAL PRIMARY KEY,

      proposal_id BIGINT NOT NULL,

      action VARCHAR(60) NOT NULL,

      status VARCHAR(60),

      remarks TEXT,

      actor_id BIGINT,

      actor_name VARCHAR(255),

      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP

    )

  `);

  // Keep the form-entry snapshot and authenticated creator with each audit record.
  await pool.query(`ALTER TABLE budget_proposal_history ADD COLUMN IF NOT EXISTS details JSONB`);

  await pool.query(`

    CREATE INDEX IF NOT EXISTS idx_budget_proposal_history_proposal

    ON budget_proposal_history (proposal_id, created_at DESC)

  `);

}



async function readRows(year) {

  if (!(await tableExists())) return [];



  const result = await pool.query(`

    SELECT

      to_jsonb(bp) || jsonb_build_object(

        'fund_cluster_name', fc.name,

        'fund_cluster_code', fc.code,

        'fund_source_name', fs.name,

        'fund_source_code', fs.code,
        'fund_code', COALESCE(fcd.code, bp.fund_source),
        'fund_code_name', fcd.name,

        'campus_name', c.name,

        'campus_code', c.code,

        'responsibility_center_name', rc.name,

        'responsibility_center_code', rc.code,

        'wfp_description_name', ws.name,

        'wfp_source_code', ws.code,

        'pap_name', pap.name,

        'pap_code', pap.code,

        'department_name_from_pap', pap.name,

        'uacs_account_title', uacs.account_title,

        'mfo_name', mfo.name,
        'object_expenditure_name', oe.name,
        
        'allotment_class_name', ac.name,

        'allotment_class_code', ac.code

      ) AS data

    FROM budget_proposals bp

    LEFT JOIN fund_clusters fc ON fc.id = bp.fund_cluster_id

    LEFT JOIN fund_sources fs ON fs.id = bp.fund_source_id
    LEFT JOIN fund_codes fcd
      ON fcd.fund_cluster_id = bp.fund_cluster_id
     AND LOWER(TRIM(fcd.code)) = LOWER(TRIM(COALESCE(bp.fund_source, '')))

    LEFT JOIN campuses c ON c.id = bp.campus_id

    LEFT JOIN responsibility_centers rc ON rc.id = bp.responsibility_center_id

    LEFT JOIN wfp_sources ws ON ws.id = bp.wfp_source_id

    LEFT JOIN pap ON pap.id = bp.pap_id

    LEFT JOIN uacs_codes uacs ON uacs.id = bp.uacs_code_id

    LEFT JOIN mfo ON mfo.id = bp.mfo_id

    LEFT JOIN object_expenditures oe ON oe.id = bp.object_expenditure_id

    LEFT JOIN allotment_classes ac ON ac.id = bp.allotment_class_id

    WHERE bp.fiscal_year = $1

    ORDER BY bp.created_at DESC NULLS LAST, bp.proposal_id DESC

  `, [year]);



  return result.rows.map(normalizeProposal);

}



function buildSearchable(row) {

  return [

    row.reference,

    row.proponent,

    row.title,

    row.description,

    row.department,

    row.fundGroup,

    row.fundCode,

    row.campus,

    row.responsibilityCenter,

    row.wfpDescription,

    row.mfo,

    row.object_expenditure,

    row.pap,

    row.particulars

  ].join(' ').toLowerCase();

}





async function resolveReferenceIds(input) {

  const body = { ...input };



  // Master-data repair for older proposals. New proposals already contain IDs,

  // while older records may contain only codes/names. Resolve both forms safely.

  async function lookupId(table, value) {

    const text = clean(value);

    if (!text) return null;



    const candidates = new Set([text]);

    const parts = text.split(/\s+-\s+/);

    if (parts.length >= 2) {

      candidates.add(parts[0].trim());

      candidates.add(parts.slice(1).join(' - ').trim());

    }



    for (const candidate of candidates) {

      const result = await pool.query(

        `SELECT id, code, name FROM ${table}

         WHERE LOWER(TRIM(COALESCE(code, ''))) = LOWER(TRIM($1))

            OR LOWER(TRIM(COALESCE(name, ''))) = LOWER(TRIM($1))

            OR LOWER(TRIM(COALESCE(code, '') || ' - ' || COALESCE(name, ''))) = LOWER(TRIM($1))

         ORDER BY id LIMIT 1`,

        [candidate]

      );

      if (result.rows[0]?.id) return result.rows[0].id;

    }



    // Last fallback: match a code/name appearing at the beginning of a stored

    // label such as "RC-005 — Budget Office" or "PAP-007 - Student Development Program".

    const result = await pool.query(

      `SELECT id FROM ${table}

       WHERE LOWER(TRIM(COALESCE(code, ''))) = LOWER(TRIM(SPLIT_PART($1, '—', 1)))

          OR LOWER(TRIM(COALESCE(code, ''))) = LOWER(TRIM(SPLIT_PART($1, '-', 1)))

       ORDER BY id LIMIT 1`,

      [text]

    );

    return result.rows[0]?.id ?? null;

  }



  if (!body.fund_cluster_id) {

    body.fund_cluster_id = await lookupId(

      'fund_clusters',

      pick(body, ['fund_cluster', 'fund_cluster_code', 'fund_group', 'fund_group_code'])

    );

  }



  // budget_proposals.fund_source_id is still the FK to fund_sources.
  // Fund Code itself is stored in the existing fund_source text field,
  // so resolve the FK from the selected Fund Cluster instead of treating
  // a fund_codes.id as a fund_sources.id.
  if (!body.fund_source_id && body.fund_cluster_id) {

    const clusterSource = await pool.query(
      `SELECT fund_source_id FROM fund_clusters WHERE id = $1 LIMIT 1`,
      [Number(body.fund_cluster_id) || 0]
    );

    body.fund_source_id = clusterSource.rows[0]?.fund_source_id || null;

  }

  if (!body.fund_source_id) {

    body.fund_source_id = await lookupId(
      'fund_sources',
      pick(body, ['fund_source', 'fund_source_name'])
    );

  }



  if (!body.campus_id) {

    body.campus_id = await lookupId(

      'campuses',

      pick(body, ['campus', 'campus_code', 'campus_name'])

    );

  }



  if (!body.responsibility_center_id) {

    body.responsibility_center_id = await lookupId(

      'responsibility_centers',

      pick(body, ['responsibility_center', 'responsibility_center_code', 'responsibility_center_name', 'rc'])

    );

  }



  if (!body.wfp_source_id) {

    body.wfp_source_id = await lookupId(

      'wfp_sources',

      pick(body, ['wfp_description', 'wfp_description_name', 'wfp', 'wfp_source_code', 'source_code'])

    );

  }



  if (!body.pap_id) {

    body.pap_id = await lookupId(

      'pap',

      pick(body, [

        'pap', 'pap_name', 'pap_code', 'program', 'program_project_activity',

        'pap_department', 'program_name'

      ])

    );

  }



  if (!body.mfo_id) {

    body.mfo_id = await lookupId(

      'mfo',

      pick(body, ['mfo', 'mfo_name', 'mfo_code'])

    );

  }



  if (!body.uacs_code_id) {

    body.uacs_code_id = await lookupId(

      'uacs_codes',

      pick(body, ['uacs_code', 'uacs', 'uacs_account_title', 'uacs_code_value'])

    );

  }



  if (!body.object_expenditure_id) {

    body.object_expenditure_id = await lookupId(

      'object_expenditures',

      pick(body, [

        'object_expenditure', 'object_expenditure_name',

        'object_expenditure_code', 'object_expenditure_title'

      ])

    );

  }



  if (!body.allotment_class_id) {

    const classification = pick(body, [

      'budget_classification', 'classification', 'category',

      'allotment_class', 'allotment_class_name', 'allotment_code'

    ]);

    body.allotment_class_id = await lookupId('allotment_classes', classification);

  }



  return body;

}



function valueForColumn(column, body, generated) {

  const aliases = {

    proposal_no: generated.proposalNo,

    budget_proposal_no: generated.proposalNo,

    reference_no: generated.proposalNo,



    fiscal_year: generated.year,

    year: generated.year,



    department_unit: clean(body.department || body.proposing_office),

    department: clean(body.department || body.proposing_office),

    department_name: clean(body.department || body.proposing_office),

    office_name: clean(body.department || body.proposing_office),



    proponent: clean(body.proponent),

    prepared_by: clean(body.proponent),

    requested_by: clean(body.proponent),



    title: clean(body.title || body.particulars),

    proposal_title: clean(body.title || body.particulars),

    description: clean(body.description || body.particulars),

    proposal_description: clean(body.description || body.particulars),

    // Actual schema column for the form's Particulars / Description.
    program_project_activity: clean(
      body.particulars || body.description || body.program_project_activity
    ),

    particulars: clean(body.particulars || body.description),

    justification: clean(body.justification || body.proposal_justification),

    proposal_justification: clean(body.justification || body.proposal_justification),

    expected_outputs: clean(body.expected_outputs || body.expectedOutputs || body.expected_result),

    expected_result: clean(body.expected_outputs || body.expectedOutputs || body.expected_result),



    fund_source: clean(body.fund_source),

    fund_source_name: clean(body.fund_source),

    funding_source: clean(body.fund_source),

    fund_cluster_id: body.fund_cluster_id !== undefined ? Number(body.fund_cluster_id) || null : undefined,

    fund_source_id: body.fund_source_id !== undefined ? Number(body.fund_source_id) || null : undefined,

    campus_id: body.campus_id !== undefined ? Number(body.campus_id) || null : undefined,

    responsibility_center_id: body.responsibility_center_id !== undefined ? Number(body.responsibility_center_id) || null : undefined,

    wfp_source_id: body.wfp_source_id !== undefined ? Number(body.wfp_source_id) || null : undefined,

    pap_id: body.pap_id !== undefined ? Number(body.pap_id) || null : undefined,

    uacs_code_id: body.uacs_code_id !== undefined ? Number(body.uacs_code_id) || null : undefined,

    allotment_class_id: body.allotment_class_id !== undefined ? Number(body.allotment_class_id) || null : undefined,



    proposed_amount: number(body.amount),

    proposal_amount: number(body.amount),

    requested_amount: number(body.amount),

    amount: number(body.amount),

    budget_amount: number(body.amount),

    appropriation: number(body.amount),

    allotment: number(body.amount),



    status: generated.status,

    proposal_status: generated.status,



    remarks: clean(body.remarks),



    created_by: body.created_by !== undefined && body.created_by !== null

      ? Number(body.created_by)

      : null,



    submitted_at: generated.submittedAt,

    submission_date: generated.submittedAt,

    proposal_date: generated.proposalDate,

    date: generated.proposalDate,



    campus: clean(body.campus),

    campus_name: clean(body.campus),



    fund_cluster: clean(body.fund_cluster),

    fund_cluster_name: clean(body.fund_cluster),

    fund_group: clean(body.fund_cluster),



    mfo_id: body.mfo_id !== undefined ? Number(body.mfo_id) || null : undefined,

    object_expenditure_id: body.object_expenditure_id !== undefined ? Number(body.object_expenditure_id) || null : undefined,

    proposed_ps: number(body.proposed_ps),

    proposed_mooe: number(body.proposed_mooe),

    proposed_co: number(body.proposed_co),



    fund_code: clean(body.fund_code),

    fund_source_code: clean(body.fund_code),



    responsibility_center: clean(body.responsibility_center),

    responsibility_center_name: clean(body.responsibility_center),

    rc: clean(body.responsibility_center),



    wfp_description: clean(body.wfp_description),

    wfp: clean(body.wfp_description),



    source_code: clean(body.source_code),

    uacs_funding_source_code: clean(body.source_code),



    uacs_code: clean(body.uacs_code),

    uacs: clean(body.uacs_code),



    pap: clean(body.pap || body.pap_name || body.program || body.program_project_activity),

    pap_department: clean(body.department),

    program: clean(body.pap || body.pap_name || body.program || body.program_project_activity),



    budget_classification: clean(body.budget_classification),

    classification: clean(body.budget_classification),

    category: clean(body.budget_classification),

    supporting_documents: clean(body.supporting_documents),

    appropriation_type: clean(body.appropriation_type)

  };



  return Object.prototype.hasOwnProperty.call(aliases, column)

    ? aliases[column]

    : undefined;

}



function excludedColumn(column) {

  return new Set([

    'id',

    'proposal_id',

    'budget_proposal_id',

    'created_at',

    'updated_at'

  ]).has(column);

}



async function findIdColumn(columns) {

  return ['id', 'proposal_id', 'budget_proposal_id']

    .find(name => columns.some(c => c.column_name === name));

}



async function findStatusColumn(columns) {

  return ['status', 'proposal_status']

    .find(name => columns.some(c => c.column_name === name));

}



const STATUS_TRANSITIONS = {

  Draft: ['Submitted'],

  Submitted: ['Under Review'],

  'Under Review': ['For Revision', 'Endorsed', 'Rejected'],

  'For Revision': ['Submitted'],

  Endorsed: ['Approved', 'Rejected'],

  Approved: [],

  Rejected: []

};



async function ensureBudgetItemForProposal(db, proposalId) {

  // Lock only the parent budget_proposals row. PostgreSQL does not allow

  // FOR UPDATE on the nullable side of a LEFT JOIN.

  const lockResult = await db.query(

    `SELECT proposal_id FROM budget_proposals WHERE proposal_id = $1 FOR UPDATE`,

    [proposalId]

  );



  if (!lockResult.rows.length) {

    throw new Error('Approved proposal was not found.');

  }



  const result = await db.query(`

    SELECT

      bp.proposal_id, bp.proposal_no, bp.fiscal_year, bp.requested_amount,

      bp.fund_cluster_id, bp.fund_source_id, bp.campus_id,

      bp.responsibility_center_id, bp.wfp_source_id, bp.pap_id,

      bp.uacs_code_id, bp.allotment_class_id, bp.source_code,

      bp.fund_source, bp.department_unit, bp.category,

      bp.program_project_activity,

      bp.mfo_id, bp.object_expenditure_id,

      bp.proposed_ps, bp.proposed_mooe, bp.proposed_co,

      to_jsonb(bp) AS proposal_data,

      fc.code AS fund_cluster_code,

      fc.name AS fund_cluster_name,

      fs.code AS fund_code,

      fs.name AS fund_source_name,

      c.code AS campus_code,

      c.name AS campus_name,

      rc.code AS responsibility_center_code,

      rc.name AS responsibility_center_name,

      ws.code AS wfp_code,

      ws.name AS wfp_name,

      pap.code AS pap_code,

      pap.name AS pap_name,

      mfo.code AS mfo_code,

      mfo.name AS mfo_name,

      uacs.code AS uacs_code_value,

      uacs.account_title AS uacs_account_title,

      oe.code AS object_expenditure_code,

      oe.name AS object_expenditure_name,

      ac.code AS allotment_code,

      ac.name AS allotment_class_name

    FROM budget_proposals bp

    LEFT JOIN fund_clusters fc ON fc.id = bp.fund_cluster_id

    LEFT JOIN fund_sources fs ON fs.id = bp.fund_source_id
    LEFT JOIN fund_codes fcd
      ON fcd.fund_cluster_id = bp.fund_cluster_id
     AND LOWER(TRIM(fcd.code)) = LOWER(TRIM(COALESCE(bp.fund_source, '')))

    LEFT JOIN campuses c ON c.id = bp.campus_id

    LEFT JOIN responsibility_centers rc ON rc.id = bp.responsibility_center_id

    LEFT JOIN wfp_sources ws ON ws.id = bp.wfp_source_id

    LEFT JOIN pap ON pap.id = bp.pap_id

    LEFT JOIN mfo ON mfo.id = bp.mfo_id

    LEFT JOIN uacs_codes uacs ON uacs.id = bp.uacs_code_id

    LEFT JOIN object_expenditures oe ON oe.id = bp.object_expenditure_id

    LEFT JOIN allotment_classes ac ON ac.id = bp.allotment_class_id

    WHERE bp.proposal_id = $1

  `, [proposalId]);



  const row = result.rows[0];

  // Merge the actual stored proposal JSON with the joined Master Data aliases.

  // This lets legacy proposals be repaired from their existing text/code values

  // without assuming every historical column still exists as a dedicated field.

  let p = { ...(row.proposal_data || {}), ...row };

  delete p.proposal_data;



  const resolved = await resolveReferenceIds(p);

  const repaired = {

    fund_cluster_id: Number(resolved.fund_cluster_id) || null,

    fund_source_id: Number(resolved.fund_source_id) || null,

    campus_id: Number(resolved.campus_id) || null,

    responsibility_center_id: Number(resolved.responsibility_center_id) || null,

    wfp_source_id: Number(resolved.wfp_source_id) || null,

    pap_id: Number(resolved.pap_id) || null,

    uacs_code_id: Number(resolved.uacs_code_id) || null,

    allotment_class_id: Number(resolved.allotment_class_id) || null,

    mfo_id: Number(resolved.mfo_id) || null,

    object_expenditure_id: Number(resolved.object_expenditure_id) || null

  };



  const repairPairs = Object.entries(repaired).filter(([, value]) => value !== null);

  if (repairPairs.length) {

    const setParts = repairPairs.map(([column], index) => `"${column}" = $${index + 1}`);

    const repairValues = repairPairs.map(([, value]) => value);

    const proposalColumns = await getColumns('budget_proposals');



    if (proposalColumns.some(c => c.column_name === 'updated_at')) {

      setParts.push('updated_at = CURRENT_TIMESTAMP');

    }



    repairValues.push(proposalId);



    await db.query(

      `UPDATE budget_proposals

       SET ${setParts.join(', ')}

       WHERE proposal_id = $${repairValues.length}`,

      repairValues

    );



    p = { ...p, ...repaired };

  }



  const required = [

    ['Fund Cluster', p.fund_cluster_id],

    ['Fund Source', p.fund_source_id],

    ['Campus', p.campus_id],

    ['Responsibility Center', p.responsibility_center_id],

    ['WFP Source', p.wfp_source_id],

    ['PAP', p.pap_id],

    ['MFO', p.mfo_id],

    ['UACS Code', p.uacs_code_id],


    ['Allotment Class', p.allotment_class_id]

  ];



  const missing = required

    .filter(([, value]) => value === null || value === undefined)

    .map(([name]) => name);



  if (missing.length) {

    throw new Error(`Cannot approve proposal. Missing Master Data: ${missing.join(', ')}.`);

  }



  const amount = Number(p.requested_amount || 0);

  if (!Number.isFinite(amount) || amount <= 0) {

    throw new Error('Cannot approve proposal with an invalid proposed amount.');

  }



  const code = String(p.allotment_code || '').toUpperCase();

  const storedPs = Number(p.proposed_ps || 0);

  const storedMooe = Number(p.proposed_mooe || 0);

  const storedCo = Number(p.proposed_co || 0);

  const hasStoredBreakdown = storedPs + storedMooe + storedCo > 0;



  const ps = hasStoredBreakdown ? storedPs : (code === 'PS' ? amount : 0);

  const mooe = hasStoredBreakdown ? storedMooe : (code === 'MOOE' ? amount : 0);

  const co = hasStoredBreakdown ? storedCo : (code === 'CO' ? amount : 0);



  const columns = await getColumns('budget_items');

  const names = columns.map(x => x.column_name);



  if (!names.includes('budget_proposal_id')) {

    throw new Error('budget_items.budget_proposal_id is required for Proposal → RBUD integration.');

  }



  const existing = await db.query(

    'SELECT id FROM budget_items WHERE budget_proposal_id = $1 LIMIT 1',

    [proposalId]

  );



  // These are the actual BMAS budget_items fields. Do not reference

  // proposal-only aliases such as fund_code or appropriation_type here.

  const fieldValues = {

    fiscal_year: p.fiscal_year,

    fund_cluster_id: p.fund_cluster_id,

    fund_source_id: p.fund_source_id,

    campus_id: p.campus_id,

    responsibility_center_id: p.responsibility_center_id,

    mfo_id: p.mfo_id,

    pap_id: p.pap_id,

    uacs_code_id: p.uacs_code_id,

    object_expenditure_id: p.object_expenditure_id,

    allotment_class_id: p.allotment_class_id,

    wfp_source_id: p.wfp_source_id,

    approved_budget: amount,

    ps_amount: ps,

    mooe_amount: mooe,

    co_amount: co,

    status: 'Approved',

    notes: `Created from approved Budget Proposal ${p.proposal_no}`,

    budget_proposal_id: proposalId

  };



  const supported = Object.keys(fieldValues).filter(name => names.includes(name));



  if (existing.rows.length) {

    const updateColumns = supported.filter(name => name !== 'budget_proposal_id');

    const setParts = updateColumns.map((name, index) => `"${name}" = $${index + 1}`);



    if (names.includes('updated_at')) {

      setParts.push('updated_at = CURRENT_TIMESTAMP');

    }



    await db.query(

      `UPDATE budget_items

       SET ${setParts.join(', ')}

       WHERE budget_proposal_id = $${updateColumns.length + 1}`,

      [...updateColumns.map(name => fieldValues[name]), proposalId]

    );

    return;

  }



  const placeholders = supported.map((_, index) => `$${index + 1}`);



  await db.query(

    `INSERT INTO budget_items (${supported.map(name => `"${name}"`).join(', ')})

     VALUES (${placeholders.join(', ')})`,

    supported.map(name => fieldValues[name])

  );

}



async function insertProposal(body, status, user) {

  body = await resolveReferenceIds(body);

  const columnRows = await getColumns();



  if (!columnRows.length) {

    throw new Error('The budget_proposals table was not found in the database.');

  }



  const columns = columnRows.map(row => row.column_name);

  const year = Number(body.fiscal_year) || new Date().getFullYear();



  // Generate the next proposal number from the existing proposal_no values,
  // not COUNT(*) + 1. COUNT can reuse an existing number when rows have been
  // deleted, imported, or the database contains gaps.
  let nextNumber = 1;
  const proposalNoColumn = columns.find(name =>
    ['proposal_no', 'budget_proposal_no', 'reference_no'].includes(name)
  );

  if (proposalNoColumn) {
    const prefix = `BP-${year}-`;
    const existingResult = await pool.query(
      `SELECT \"${proposalNoColumn.replace(/\"/g, '\"\"')}\" AS proposal_no
       FROM budget_proposals
       WHERE \"${proposalNoColumn.replace(/\"/g, '\"\"')}\" LIKE $1`,
      [`${prefix}%`]
    );

    const usedNumbers = new Set();
    for (const row of existingResult.rows) {
      const match = String(row.proposal_no || '').match(new RegExp(`^BP-${year}-(\\d+)$`));
      if (match) usedNumbers.add(Number(match[1]));
    }
    while (usedNumbers.has(nextNumber)) nextNumber += 1;
  } else if (columns.includes('fiscal_year')) {
    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS count FROM budget_proposals WHERE fiscal_year = $1`,
      [year]
    );
    nextNumber = Number(countResult.rows[0].count || 0) + 1;
  }

  const proposalNo = `BP-${year}-${String(nextNumber).padStart(5, '0')}`;

  const now = new Date();



  const generated = {

    proposalNo,

    year,

    status,

    submittedAt: status === 'Submitted' ? now : null,

    proposalDate: now

  };



  const pairs = [];



  for (const column of columns) {

    if (excludedColumn(column)) continue;



    const value = valueForColumn(column, body, generated);

    if (value !== undefined) {

      pairs.push({ column, value });

    }

  }



  if (!pairs.length) {

    throw new Error('No compatible columns were found for creating a budget proposal.');

  }



  const quotedColumns = pairs.map(pair =>

    `"${pair.column.replace(/"/g, '""')}"`

  );

  const placeholders = pairs.map((_, index) => `$${index + 1}`);

  const values = pairs.map(pair => pair.value);



  const result = await pool.query(

    `

    INSERT INTO budget_proposals (${quotedColumns.join(', ')})

    VALUES (${placeholders.join(', ')})

    RETURNING to_jsonb(budget_proposals) AS data

    `,

    values

  );



  const proposal = normalizeProposal(result.rows[0]);



  await ensureHistoryTable();

  await pool.query(

    `

    INSERT INTO budget_proposal_history

      (proposal_id, action, status, remarks, actor_id, actor_name, details)

    VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)

    `,

    [

      proposal.id,

      status === 'Submitted' ? 'Proposal Entered & Submitted' : 'Proposal Entered (Draft)',

      status,

      clean(body.remarks),

      user?.id ? Number(user.id) : null,

      clean(user?.full_name) || clean(user?.name) || clean(user?.username) || clean(user?.email) || 'Authenticated User',

      JSON.stringify({
        entered_by: clean(user?.full_name) || clean(user?.name) || clean(user?.username) || clean(user?.email) || 'Authenticated User',
        entered_by_email: clean(user?.email) || null,
        entered_by_role: clean(user?.role) || null,
        // Capture submitted form fields too: some UI-only values such as
        // proponent have no dedicated column in budget_proposals.
        form_entry: {
          ...body,
          proposal_id: proposal.id,
          proposal_no: proposal.reference
        }
      })

    ]

  );



  return proposal;

}



// ============================================================

// HEALTH

// GET /api/budget-proposals/health

// ============================================================



router.get('/health', async (req, res) => {

  try {

    const exists = await tableExists();

    const columns = exists ? await getColumns() : [];



    res.json({

      success: true,

      module: 'Budget Proposals',

      status: 'OK',

      databaseTableExists: exists,

      columns: columns.map(row => ({

        name: row.column_name,

        type: row.data_type,

        nullable: row.is_nullable

      }))

    });

  } catch (error) {

    console.error('Budget Proposal Health Error:', error);

    res.status(500).json({

      success: false,

      module: 'Budget Proposals',

      error: error.message

    });

  }

});



// ============================================================

// SUMMARY

// ============================================================



router.get('/summary', verifyToken, requireProposalRoles('Administration', 'Budget', 'Accountant'), async (req, res) => {

  try {

    const year = Number(req.query.year) || new Date().getFullYear();

    const rows = await readRows(year);



    res.json({

      success: true,

      fiscalYear: year,

      summary: {

        totalProposals: rows.length,

        draft: rows.filter(r => r.status === 'Draft').length,

        submitted: rows.filter(r => r.status === 'Submitted').length,

        underReview: rows.filter(r => r.status === 'Under Review').length,

        forRevision: rows.filter(r => r.status === 'For Revision').length,

        endorsed: rows.filter(r => r.status === 'Endorsed').length,

        approved: rows.filter(r => r.status === 'Approved').length,

        rejected: rows.filter(r => r.status === 'Rejected').length,

        totalAmount: rows.reduce((sum, row) => sum + number(row.amount), 0)

      }

    });

  } catch (error) {

    console.error('Budget Proposal Summary Error:', error);

    res.status(500).json({ success: false, error: error.message });

  }

});



// ============================================================

// LIST

// ============================================================



router.get('/', verifyToken, requireProposalRoles('Administration', 'Budget', 'Accountant'), async (req, res) => {

  try {

    const year = Number(req.query.year) || new Date().getFullYear();

    const search = clean(req.query.search)?.toLowerCase() || '';

    const status = clean(req.query.status);

    const department = clean(req.query.department);



    let proposals = await readRows(year);



    if (search) {

      proposals = proposals.filter(row => buildSearchable(row).includes(search));

    }



    if (status && status !== 'All') {

      proposals = proposals.filter(row => row.status === status);

    }



    if (department && department !== 'All') {

      proposals = proposals.filter(row => row.department === department);

    }



    proposals.sort((a, b) => {

      const da = new Date(a.created_at || a.date || 0).getTime();

      const db = new Date(b.created_at || b.date || 0).getTime();

      return db - da || Number(b.id || 0) - Number(a.id || 0);

    });



    res.json({ success: true, fiscalYear: year, proposals });

  } catch (error) {

    console.error('Get Budget Proposals Error:', error);

    res.status(500).json({ success: false, error: error.message });

  }

});



// ============================================================

// HISTORY

// GET /api/budget-proposals/history?year=2026

// ============================================================



router.get('/history', verifyToken, requireProposalRoles('Administration', 'Budget', 'Accountant'), async (req, res) => {

  try {

    const year = Number(req.query.year) || new Date().getFullYear();

    await ensureHistoryTable();

    const result = await pool.query(`

      SELECT h.id, h.proposal_id, bp.proposal_no, h.action, h.status, h.remarks,

             h.actor_id, h.actor_name, h.details, h.created_at

      FROM budget_proposal_history h

      LEFT JOIN budget_proposals bp ON bp.proposal_id = h.proposal_id

      WHERE bp.fiscal_year = $1

      ORDER BY h.created_at DESC, h.id DESC

    `, [year]);

    res.json({ success:true, fiscalYear:year, history:result.rows });

  } catch (error) {

    console.error('Budget Proposal All History Error:', error);

    res.status(500).json({ success:false, error:error.message });

  }

});



// GET /api/budget-proposals/:id/history

// ============================================================



router.get('/:id/history', verifyToken, requireProposalRoles('Administration', 'Budget', 'Accountant'), async (req, res) => {

  try {

    const proposalId = Number(req.params.id);

    if (!Number.isInteger(proposalId)) {

      return res.status(400).json({ success: false, error: 'Invalid proposal ID.' });

    }



    await ensureHistoryTable();



    const result = await pool.query(

      `

      SELECT id, proposal_id, action, status, remarks,

             actor_id, actor_name, details, created_at

      FROM budget_proposal_history

      WHERE proposal_id = $1

      ORDER BY created_at DESC, id DESC

      `,

      [proposalId]

    );



    res.json({ success: true, history: result.rows });

  } catch (error) {

    console.error('Budget Proposal History Error:', error);

    res.status(500).json({ success: false, error: error.message });

  }

});



// ============================================================

// SINGLE

// ============================================================



router.get('/:id', verifyToken, requireProposalRoles('Administration', 'Budget', 'Accountant'), async (req, res) => {

  try {

    if (!(await tableExists())) {

      return res.status(404).json({ success: false, error: 'Budget proposal table not found.' });

    }



    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {

      return res.status(400).json({ success: false, error: 'Invalid proposal ID.' });

    }



    const columns = await getColumns();

    const idColumn = await findIdColumn(columns);



    if (!idColumn) {

      return res.status(500).json({

        success: false,

        error: 'No proposal ID column exists in budget_proposals.'

      });

    }



    const result = await pool.query(

      `SELECT

         to_jsonb(bp) || jsonb_build_object(

           'fund_cluster_name', fc.name, 'fund_cluster_code', fc.code,

           'fund_source_name', fs.name, 'fund_source_code', fs.code,

           'campus_name', c.name, 'campus_code', c.code,

           'responsibility_center_name', rc.name, 'responsibility_center_code', rc.code,

           'wfp_description_name', ws.name, 'wfp_source_code', ws.code,

           'pap_name', pap.name, 'pap_code', pap.code,

           'department_name_from_pap', pap.name,

           'uacs_account_title', uacs.account_title,

           'mfo_name', mfo.name,
        'object_expenditure_name', oe.name,
        
        'allotment_class_name', ac.name, 'allotment_class_code', ac.code

         ) AS data

       FROM budget_proposals bp

       LEFT JOIN fund_clusters fc ON fc.id=bp.fund_cluster_id

       LEFT JOIN fund_sources fs ON fs.id=bp.fund_source_id

       LEFT JOIN campuses c ON c.id=bp.campus_id

       LEFT JOIN responsibility_centers rc ON rc.id=bp.responsibility_center_id

       LEFT JOIN wfp_sources ws ON ws.id=bp.wfp_source_id

       LEFT JOIN pap ON pap.id=bp.pap_id

       LEFT JOIN uacs_codes uacs ON uacs.id=bp.uacs_code_id

       LEFT JOIN mfo ON mfo.id=bp.mfo_id

       LEFT JOIN object_expenditures oe ON oe.id=bp.object_expenditure_id

       LEFT JOIN allotment_classes ac ON ac.id=bp.allotment_class_id

       WHERE bp."${idColumn}" = $1`,

      [id]

    );



    if (!result.rows.length) {

      return res.status(404).json({

        success: false,

        error: 'Budget proposal not found.'

      });

    }



    res.json({

      success: true,

      proposal: normalizeProposal(result.rows[0])

    });

  } catch (error) {

    console.error('Get Budget Proposal Error:', error);

    res.status(500).json({ success: false, error: error.message });

  }

});



// ============================================================

// CREATE

// ============================================================



router.post(

  '/',

  verifyToken,

  requireProposalRoles('Budget'),

  async (req, res) => {

  try {

    let body = req.body || {};

    body.created_by = req.user.id;



    if (!clean(body.department)) {

      return res.status(400).json({

        success: false,

        error: 'Proposing Office / Department is required.'

      });

    }



    if (!clean(body.particulars) && !clean(body.title) && !clean(body.description)) {

      return res.status(400).json({

        success: false,

        error: 'Particulars / Description is required.'

      });

    }



    body = await resolveReferenceIds(body);

    const requiredRefs = ['fund_cluster_id','fund_source_id','campus_id','responsibility_center_id','wfp_source_id','pap_id','mfo_id','uacs_code_id','allotment_class_id'];

    const missingRefs = requiredRefs.filter(key => !Number(body[key]));

    if (missingRefs.length) return res.status(400).json({ success:false, error:`Please complete the required Master Data fields: ${missingRefs.join(', ')}` });



    const amount = number(body.amount);

    if (amount <= 0) {

      return res.status(400).json({

        success: false,

        error: 'Proposed Amount must be greater than zero.'

      });

    }



    const proposal = await insertProposal(body, 'Draft', req.user);



    res.status(201).json({

      success: true,

      message: 'Budget proposal created successfully.',

      proposal

    });

  } catch (error) {

    console.error('Create Budget Proposal Error:', error);

    if (error.code === '23505' && (error.constraint || '').includes('proposal_no')) {
      return res.status(409).json({
        success: false,
        code: 'DUPLICATE_PROPOSAL_NUMBER',
        error: 'A proposal number conflict occurred. Please try saving again. If the problem continues, contact the system administrator.'
      });
    }

    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        error: 'This record conflicts with an existing unique value. Please review the information and try again.'
      });
    }

    res.status(500).json({ success: false, error: 'Unable to save the budget proposal right now. Please try again. If the problem continues, contact the system administrator.' });

  }

});



// ============================================================

// UPDATE

// ============================================================



router.put(

  '/:id',

  verifyToken,

  requireProposalRoles('Budget'),

  async (req, res) => {

  try {

    if (!(await tableExists())) {

      return res.status(404).json({ success: false, error: 'Budget proposal table not found.' });

    }



    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {

      return res.status(400).json({ success: false, error: 'Invalid proposal ID.' });

    }



    const columns = await getColumns();

    const idColumn = await findIdColumn(columns);



    if (!idColumn) {

      return res.status(500).json({

        success: false,

        error: 'No proposal ID column exists in budget_proposals.'

      });

    }



    const currentResult = await pool.query(`SELECT status FROM budget_proposals WHERE "${idColumn}" = $1`, [id]);

    if (!currentResult.rows.length) return res.status(404).json({ success:false, error:'Budget proposal not found.' });

    const currentStatus = normalizeStatus(currentResult.rows[0].status);

    if (!['Draft','For Revision'].includes(currentStatus)) {

      return res.status(409).json({ success:false, error:`Only Draft or For Revision proposals can be edited. Current status: ${currentStatus}.` });

    }



    let body = req.body || {};

    body.created_by = req.user.id;

    body = await resolveReferenceIds(body);

    const generated = {

      proposalNo: null,

      year: Number(body.fiscal_year) || new Date().getFullYear(),

      status: currentStatus || 'Draft',

      submittedAt: null,

      proposalDate: new Date()

    };



    const updates = [];



    for (const columnRow of columns) {

      const column = columnRow.column_name;



      if (excludedColumn(column) || column === idColumn) continue;



      const value = valueForColumn(column, body, generated);

      if (value !== undefined) {

        updates.push({ column, value });

      }

    }



    if (columns.some(c => c.column_name === 'updated_at')) {

      updates.push({ column: 'updated_at', expression: 'CURRENT_TIMESTAMP' });

    }



    if (!updates.length) {

      return res.status(400).json({

        success: false,

        error: 'No compatible fields to update.'

      });

    }



    const setParts = [];

    const values = [];

    let index = 1;



    for (const item of updates) {

      const quoted = `"${item.column.replace(/"/g, '""')}"`;



      if (item.expression) {

        setParts.push(`${quoted} = ${item.expression}`);

      } else {

        setParts.push(`${quoted} = $${index++}`);

        values.push(item.value);

      }

    }



    values.push(id);



    const result = await pool.query(

      `

      UPDATE budget_proposals

      SET ${setParts.join(', ')}

      WHERE "${idColumn}" = $${index}

      RETURNING to_jsonb(budget_proposals) AS data

      `,

      values

    );



    if (!result.rows.length) {

      return res.status(404).json({

        success: false,

        error: 'Budget proposal not found.'

      });

    }



    const proposal = normalizeProposal(result.rows[0]);



    await ensureHistoryTable();

    await pool.query(

      `

      INSERT INTO budget_proposal_history

        (proposal_id, action, status, remarks, actor_id, actor_name)

      VALUES ($1, $2, $3, $4, $5, $6)

      `,

      [

        proposal.id,

        'Updated',

        proposal.status,

        clean(body.remarks),

        body.created_by ? Number(body.created_by) : null,

        clean(req.user?.full_name) || clean(req.user?.name) || clean(req.user?.username) || 'System User'

      ]

    );



    res.json({

      success: true,

      message: 'Budget proposal updated successfully.',

      proposal

    });

  } catch (error) {

    console.error('Update Budget Proposal Error:', error);

    if (error.code === '23505' && (error.constraint || '').includes('proposal_no')) {
      return res.status(409).json({
        success: false,
        code: 'DUPLICATE_PROPOSAL_NUMBER',
        error: 'This proposal number is already in use. Please try again or contact the system administrator.'
      });
    }

    if (error.code === '23505') {
      return res.status(409).json({ success: false, error: 'This update conflicts with an existing unique value. Please review the information and try again.' });
    }

    res.status(500).json({ success: false, error: 'Unable to update the budget proposal right now. Please try again.' });

  }

});



// ============================================================

// STATUS

// ============================================================



router.patch(

  '/:id/status',

  verifyToken,

  requireProposalStatusRole,

  async (req, res) => {

  const client = await pool.connect();

  try {

    if (!(await tableExists())) return res.status(404).json({ success:false, error:'Budget proposal table not found.' });

    const id = Number(req.params.id);

    const requestedStatus = normalizeStatus(req.body?.status);

    if (!Number.isInteger(id)) return res.status(400).json({ success:false, error:'Invalid proposal ID.' });

    const allowedStatuses = ['Draft','Submitted','Under Review','For Revision','Endorsed','Approved','Rejected'];

    if (!allowedStatuses.includes(requestedStatus)) return res.status(400).json({ success:false, error:'Invalid proposal status.' });



    const columns = await getColumns();

    const idColumn = await findIdColumn(columns);

    const statusColumn = await findStatusColumn(columns);

    if (!idColumn || !statusColumn) return res.status(500).json({ success:false, error:'The budget_proposals table does not contain a supported ID/status column.' });



    await ensureHistoryTable();

    await client.query('BEGIN');

    const current = await client.query(`SELECT status FROM budget_proposals WHERE "${idColumn}" = $1 FOR UPDATE`, [id]);

    if (!current.rows.length) { await client.query('ROLLBACK'); return res.status(404).json({ success:false, error:'Budget proposal not found.' }); }

    const currentStatus = normalizeStatus(current.rows[0].status);

    if (!(STATUS_TRANSITIONS[currentStatus] || []).includes(requestedStatus)) {

      await client.query('ROLLBACK');

      return res.status(409).json({ success:false, error:`Invalid workflow transition: ${currentStatus} → ${requestedStatus}.` });

    }



    const setParts = [`"${statusColumn}" = $1`];

    const values = [requestedStatus];

    let index = 2;

    const timestampMap = { Submitted:'submitted_at', 'Under Review':'reviewed_at', Endorsed:'endorsed_at', Approved:'approved_at', 'For Revision':'returned_at' };

    const userMap = { 'Under Review':'reviewed_by', Endorsed:'endorsed_by', Approved:'approved_by' };

    const timeColumn = timestampMap[requestedStatus];

    if (timeColumn && columns.some(c=>c.column_name===timeColumn)) setParts.push(`"${timeColumn}" = CURRENT_TIMESTAMP`);

    const actorId = Number(req.user.id);

    const actorName =

      clean(req.user.full_name) ||

      clean(req.user.username) ||

      'System User';

    const userColumn = userMap[requestedStatus];

    if (userColumn && columns.some(c=>c.column_name===userColumn) && actorId) { setParts.push(`"${userColumn}" = $${index++}`); values.push(actorId); }

    const remarks = clean(req.body?.remarks);

    if (columns.some(c=>c.column_name==='remarks') && remarks) { setParts.push(`"remarks" = $${index++}`); values.push(remarks); }

    if (requestedStatus === 'Rejected' && columns.some(c=>c.column_name==='rejection_reason') && remarks) { setParts.push(`"rejection_reason" = $${index++}`); values.push(remarks); }

    if (columns.some(c=>c.column_name==='updated_at')) setParts.push('"updated_at" = CURRENT_TIMESTAMP');

    values.push(id);



    const result = await client.query(`UPDATE budget_proposals SET ${setParts.join(', ')} WHERE "${idColumn}" = $${index} RETURNING to_jsonb(budget_proposals) AS data`, values);

    if (!result.rows.length) { await client.query('ROLLBACK'); return res.status(404).json({success:false,error:'Budget proposal not found.'}); }



    if (requestedStatus === 'Approved') await ensureBudgetItemForProposal(client, id);



    const proposal = normalizeProposal(result.rows[0]);

    await client.query(`INSERT INTO budget_proposal_history (proposal_id, action, status, remarks, actor_id, actor_name) VALUES ($1,$2,$3,$4,$5,$6)`, [proposal.id, requestedStatus, requestedStatus, remarks, actorId, actorName]);

    await client.query('COMMIT');

    const refreshedRows = await readRows(proposal.fiscal_year);

    const refreshedProposal = refreshedRows.find(row => Number(row.id) === Number(id)) || proposal;



    res.json({success:true,message:`Proposal status updated to ${requestedStatus}.`,proposal:refreshedProposal});

  } catch (error) {

    try { await client.query('ROLLBACK'); } catch {}

    console.error('Update Proposal Status Error:', error);

    res.status(500).json({success:false,error:error.message});

  } finally { client.release(); }

});



// ============================================================

// DELETE

// ============================================================



router.delete(

  '/:id',

  verifyToken,

  requireProposalRoles('Administration', 'Budget'),

  async (req, res) => {

  try {

    if (!(await tableExists())) {

      return res.status(404).json({

        success: false,

        error: 'Budget proposal table not found.'

      });

    }



    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {

      return res.status(400).json({

        success: false,

        error: 'Invalid proposal ID.'

      });

    }



    const columns = await getColumns();

    const idColumn = await findIdColumn(columns);



    if (!idColumn) {

      return res.status(500).json({

        success: false,

        error: 'No proposal ID column exists in budget_proposals.'

      });

    }



    const current = await pool.query(

      `SELECT status FROM budget_proposals WHERE "${idColumn}" = $1`,

      [id]

    );

    if (current.rows.length && ['Approved','Endorsed','Under Review','Submitted'].includes(normalizeStatus(current.rows[0].status))) {

      return res.status(409).json({ success:false, error:'Only Draft or For Revision proposals can be deleted.' });

    }



    const result = await pool.query(

      `

      DELETE FROM budget_proposals

      WHERE "${idColumn}" = $1

      RETURNING "${idColumn}" AS id

      `,

      [id]

    );



    if (!result.rows.length) {

      return res.status(404).json({

        success: false,

        error: 'Budget proposal not found.'

      });

    }



    if (await tableExists('budget_proposal_history')) {

      await pool.query(

        `DELETE FROM budget_proposal_history WHERE proposal_id = $1`,

        [id]

      );

    }



    res.json({

      success: true,

      message: 'Budget proposal deleted successfully.'

    });

  } catch (error) {

    console.error('Delete Budget Proposal Error:', error);

    res.status(500).json({ success: false, error: error.message });

  }

});



module.exports = router;