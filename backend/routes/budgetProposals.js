// ============================================================
// BUDGET PROPOSALS ROUTER
// Budget Monitoring and Allocation System (BMAS)
// Fully database-backed. Uses only columns that exist.
// ============================================================

const express = require('express');
const router = express.Router();
const pool = require('../db');

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
    pending: 'Pending',
    'for review': 'For Review',
    endorsed: 'Endorsed',
    approved: 'Approved',
    returned: 'Returned',
    disapproved: 'Disapproved'
  };
  return map[raw.toLowerCase()] || raw;
};

const amountKeys = [
  'proposed_amount',
  'proposal_amount',
  'requested_amount',
  'amount',
  'budget_amount',
  'appropriation',
  'allotment',
  'obligation_amount'
];

function normalizeProposal(row) {
  const d = row?.data || row || {};
  const amount = number(pick(d, amountKeys, 0));

  const dateValue = pick(d, [
    'proposal_date',
    'submission_date',
    'submitted_at',
    'date',
    'created_at'
  ], null);

  const fundCluster = pick(d, [
    'fund_cluster',
    'fund_cluster_name',
    'fund_group',
    'fund_name'
  ], 'Other Funds');

  const fundCode = pick(d, [
    'fund_code',
    'fund_source_code',
    'code'
  ], '');

  const rc = pick(d, [
    'responsibility_center',
    'responsibility_center_name',
    'rc'
  ], '');

  const department = pick(d, [
    'department',
    'department_name',
    'office_name',
    'pap_department',
    'pap'
  ], '');

  const particulars = pick(d, [
    'particulars',
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
    id,
    reference,
    proposal_no: pick(d, ['proposal_no', 'budget_proposal_no'], reference),
    date: dateValue,
    fiscal_year: fiscalYear,
    fundGroup: fundCluster,
    fund_group: fundCluster,
    fundCode,
    fund_code: fundCode,
    campus: pick(d, ['campus', 'campus_name'], ''),
    responsibilityCenter: rc,
    responsibility_center: rc,
    wfpDescription: pick(d, ['wfp_description', 'wfp_description_name', 'wfp'], ''),
    sourceCode: pick(d, ['source_code', 'uacs_funding_source_code'], ''),
    department,
    proponent: pick(d, ['proponent', 'prepared_by', 'requested_by', 'created_by_name'], ''),
    title: pick(d, ['title', 'proposal_title'], particulars),
    description: pick(d, ['description', 'proposal_description'], particulars),
    uacsCode: pick(d, ['uacs_code', 'uacs'], ''),
    pap: pick(d, ['pap', 'pap_department', 'program'], department),
    particulars,
    amount,
    status: normalizeStatus(pick(d, ['status', 'proposal_status'], 'Draft')),
    fund_source: pick(d, ['fund_source', 'fund_source_name', 'funding_source'], fundCluster),
    funding_source: pick(d, ['funding_source', 'fund_source_name', 'fund_source'], ''),
    budget_classification: pick(d, ['budget_classification', 'classification'], ''),
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
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_budget_proposal_history_proposal
    ON budget_proposal_history (proposal_id, created_at DESC)
  `);
}

async function readRows(year) {
  if (!(await tableExists())) return [];

  const result = await pool.query(`
    SELECT to_jsonb(bp) AS data
    FROM budget_proposals bp
  `);

  return result.rows
    .map(normalizeProposal)
    .filter(row => row.fiscal_year === year);
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
    row.pap,
    row.particulars
  ].join(' ').toLowerCase();
}

function valueForColumn(column, body, generated) {
  const aliases = {
    proposal_no: generated.proposalNo,
    budget_proposal_no: generated.proposalNo,
    reference_no: generated.proposalNo,

    fiscal_year: generated.year,
    year: generated.year,

    department: clean(body.department),
    department_name: clean(body.department),
    office_name: clean(body.department),

    proponent: clean(body.proponent),
    prepared_by: clean(body.proponent),
    requested_by: clean(body.proponent),

    title: clean(body.title || body.particulars),
    proposal_title: clean(body.title || body.particulars),
    description: clean(body.description || body.particulars),
    proposal_description: clean(body.description || body.particulars),
    particulars: clean(body.particulars || body.description),

    fund_source: clean(body.fund_source),
    fund_source_name: clean(body.fund_source),
    funding_source: clean(body.fund_source),

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

    pap: clean(body.department),
    pap_department: clean(body.department),
    program: clean(body.department),

    budget_classification: clean(body.budget_classification),
    classification: clean(body.budget_classification)
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

async function insertProposal(body, status) {
  const columnRows = await getColumns();

  if (!columnRows.length) {
    throw new Error('The budget_proposals table was not found in the database.');
  }

  const columns = columnRows.map(row => row.column_name);
  const year = Number(body.fiscal_year) || new Date().getFullYear();

  let nextNumber = 1;
  if (columns.includes('fiscal_year')) {
    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS count
       FROM budget_proposals
       WHERE fiscal_year = $1`,
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
      (proposal_id, action, status, remarks, actor_id, actor_name)
    VALUES ($1, $2, $3, $4, $5, $6)
    `,
    [
      proposal.id,
      status === 'Submitted' ? 'Submitted' : 'Draft Created',
      status,
      clean(body.remarks),
      body.created_by ? Number(body.created_by) : null,
      clean(body.proponent)
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

router.get('/summary', async (req, res) => {
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
        pending: rows.filter(r => r.status === 'Pending').length,
        forReview: rows.filter(r => r.status === 'For Review').length,
        endorsed: rows.filter(r => r.status === 'Endorsed').length,
        approved: rows.filter(r => r.status === 'Approved').length,
        returned: rows.filter(r => r.status === 'Returned').length,
        disapproved: rows.filter(r => r.status === 'Disapproved').length,
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

router.get('/', async (req, res) => {
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
// GET /api/budget-proposals/:id/history
// ============================================================

router.get('/:id/history', async (req, res) => {
  try {
    const proposalId = Number(req.params.id);
    if (!Number.isInteger(proposalId)) {
      return res.status(400).json({ success: false, error: 'Invalid proposal ID.' });
    }

    await ensureHistoryTable();

    const result = await pool.query(
      `
      SELECT id, proposal_id, action, status, remarks,
             actor_id, actor_name, created_at
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

router.get('/:id', async (req, res) => {
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
      `SELECT to_jsonb(bp) AS data
       FROM budget_proposals bp
       WHERE "${idColumn}" = $1`,
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

router.post('/', async (req, res) => {
  try {
    const body = req.body || {};

    if (!clean(body.department)) {
      return res.status(400).json({
        success: false,
        error: 'PAP / Department is required.'
      });
    }

    if (!clean(body.particulars) && !clean(body.title) && !clean(body.description)) {
      return res.status(400).json({
        success: false,
        error: 'Particulars / Description is required.'
      });
    }

    const amount = number(body.amount);
    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Proposed Amount must be greater than zero.'
      });
    }

    const proposal = await insertProposal(body, 'Draft');

    res.status(201).json({
      success: true,
      message: 'Budget proposal created successfully.',
      proposal
    });
  } catch (error) {
    console.error('Create Budget Proposal Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// UPDATE
// ============================================================

router.put('/:id', async (req, res) => {
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

    const body = req.body || {};
    const generated = {
      proposalNo: null,
      year: Number(body.fiscal_year) || new Date().getFullYear(),
      status: clean(body.status) || null,
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
        clean(body.proponent)
      ]
    );

    res.json({
      success: true,
      message: 'Budget proposal updated successfully.',
      proposal
    });
  } catch (error) {
    console.error('Update Budget Proposal Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// STATUS
// ============================================================

router.patch('/:id/status', async (req, res) => {
  try {
    if (!(await tableExists())) {
      return res.status(404).json({
        success: false,
        error: 'Budget proposal table not found.'
      });
    }

    const id = Number(req.params.id);
    const status = clean(req.body?.status);

    const allowed = [
      'Draft',
      'Submitted',
      'Pending',
      'For Review',
      'Endorsed',
      'Approved',
      'Returned',
      'Disapproved'
    ];

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid proposal ID.'
      });
    }

    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid proposal status.'
      });
    }

    const columns = await getColumns();
    const idColumn = await findIdColumn(columns);
    const statusColumn = await findStatusColumn(columns);

    if (!idColumn || !statusColumn) {
      return res.status(500).json({
        success: false,
        error: 'The budget_proposals table does not contain a supported ID/status column.'
      });
    }

    const setParts = [`"${statusColumn}" = $1`];
    const values = [status];
    let index = 2;

    if (columns.some(c => c.column_name === 'submitted_at') && status === 'Submitted') {
      setParts.push(`"submitted_at" = CURRENT_TIMESTAMP`);
    }

    if (columns.some(c => c.column_name === 'submission_date') && status === 'Submitted') {
      setParts.push(`"submission_date" = CURRENT_TIMESTAMP`);
    }

    if (columns.some(c => c.column_name === 'updated_at')) {
      setParts.push(`"updated_at" = CURRENT_TIMESTAMP`);
    }

    const remarks = clean(req.body?.remarks);
    if (columns.some(c => c.column_name === 'remarks') && remarks) {
      setParts.push(`"remarks" = $${index++}`);
      values.push(remarks);
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
        status,
        status,
        remarks,
        req.body?.actor_id ? Number(req.body.actor_id) : null,
        clean(req.body?.actor_name)
      ]
    );

    res.json({
      success: true,
      message: `Proposal status updated to ${status}.`,
      proposal
    });
  } catch (error) {
    console.error('Update Proposal Status Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// DELETE
// ============================================================

router.delete('/:id', async (req, res) => {
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
