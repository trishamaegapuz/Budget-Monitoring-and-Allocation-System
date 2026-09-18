const express = require('express');
const router = express.Router();

const pool = require('../db');

// ============================================================
// HELPERS
// ============================================================

function toNumber(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return number;
}

function parseId(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
}

function parseYear(value) {
  const year = Number(value);

  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    return null;
  }

  return year;
}

// ============================================================
// MASTER DATA
// GET /api/budget/master-data
// ============================================================

router.get('/master-data', async (req, res) => {
  try {
    const [
      fundSources,
      fundClusters,
      campuses,
      responsibilityCenters,
      wfpSources
    ] = await Promise.all([
      pool.query(`
        SELECT
          id,
          code,
          name,
          description
        FROM fund_sources
        WHERE is_active = TRUE
        ORDER BY code, name
      `),

      pool.query(`
        SELECT
          fc.id,
          fc.fund_source_id,
          fc.code,
          fc.name,
          fc.description,
          fs.code AS fund_source_code,
          fs.name AS fund_source_name
        FROM fund_clusters fc
        LEFT JOIN fund_sources fs
          ON fs.id = fc.fund_source_id
        WHERE fc.is_active = TRUE
        ORDER BY fc.code, fc.name
      `),

      pool.query(`
        SELECT
          id,
          code,
          name,
          abbreviation
        FROM campuses
        WHERE is_active = TRUE
        ORDER BY code, name
      `),

      pool.query(`
        SELECT
          id,
          code,
          name,
          category
        FROM responsibility_centers
        WHERE is_active = TRUE
        ORDER BY code, name
      `),

      pool.query(`
        SELECT
          id,
          code,
          name,
          description
        FROM wfp_sources
        WHERE is_active = TRUE
        ORDER BY code, name
      `)
    ]);

    res.json({
      success: true,
      data: {
        fundSources: fundSources.rows,
        fundClusters: fundClusters.rows,
        campuses: campuses.rows,
        responsibilityCenters: responsibilityCenters.rows,
        wfpSources: wfpSources.rows
      }
    });
  } catch (error) {
    console.error('Master data error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to load master data.',
      error: error.message
    });
  }
});

// ============================================================
// GET ALL ALLOCATIONS
// GET /api/budget/allocations
// ============================================================

router.get('/allocations', async (req, res) => {
  try {
    const year = req.query.year
      ? parseYear(req.query.year)
      : null;

    let query = `
      SELECT
        fa.id,
        fa.fiscal_year,

        fa.fund_source_id,
        fs.code AS fund_source_code,
        fs.name AS fund_source_name,

        fa.fund_cluster_id,
        fc.code AS fund_cluster_code,
        fc.name AS fund_cluster_name,

        fa.campus_id,
        c.code AS campus_code,
        c.name AS campus_name,

        fa.responsibility_center_id,
        rc.code AS responsibility_center_code,
        rc.name AS responsibility_center_name,

        fa.wfp_source_id,
        ws.code AS wfp_source_code,
        ws.name AS wfp_source_name,

        fa.allocation_amount,
        fa.utilized_amount,
        fa.disbursed_amount,
        fa.remaining_balance,

        fa.created_at,
        fa.updated_at

      FROM fund_allocations fa

      LEFT JOIN fund_sources fs
        ON fs.id = fa.fund_source_id

      LEFT JOIN fund_clusters fc
        ON fc.id = fa.fund_cluster_id

      LEFT JOIN campuses c
        ON c.id = fa.campus_id

      LEFT JOIN responsibility_centers rc
        ON rc.id = fa.responsibility_center_id

      LEFT JOIN wfp_sources ws
        ON ws.id = fa.wfp_source_id
    `;

    const values = [];

    if (year) {
      values.push(year);
      query += ` WHERE fa.fiscal_year = $1 `;
    }

    query += `
      ORDER BY fa.fiscal_year DESC, fa.id DESC
    `;

    const result = await pool.query(query, values);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get allocations error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to load budget allocations.',
      error: error.message
    });
  }
});

// ============================================================
// GET ONE ALLOCATION
// GET /api/budget/allocations/:id
// ============================================================

router.get('/allocations/:id', async (req, res) => {
  try {
    const id = parseId(req.params.id);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Invalid allocation ID.'
      });
    }

    const result = await pool.query(
      `
      SELECT
        fa.*,

        fs.code AS fund_source_code,
        fs.name AS fund_source_name,

        fc.code AS fund_cluster_code,
        fc.name AS fund_cluster_name,

        c.code AS campus_code,
        c.name AS campus_name,

        rc.code AS responsibility_center_code,
        rc.name AS responsibility_center_name,

        ws.code AS wfp_source_code,
        ws.name AS wfp_source_name

      FROM fund_allocations fa

      LEFT JOIN fund_sources fs
        ON fs.id = fa.fund_source_id

      LEFT JOIN fund_clusters fc
        ON fc.id = fa.fund_cluster_id

      LEFT JOIN campuses c
        ON c.id = fa.campus_id

      LEFT JOIN responsibility_centers rc
        ON rc.id = fa.responsibility_center_id

      LEFT JOIN wfp_sources ws
        ON ws.id = fa.wfp_source_id

      WHERE fa.id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Allocation not found.'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Get allocation error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve allocation.',
      error: error.message
    });
  }
});

// ============================================================
// VALIDATE MASTER DATA
// ============================================================

async function validateMasterData({
  fundSourceId,
  fundClusterId,
  campusId,
  responsibilityCenterId,
  wfpSourceId
}) {
  // ----------------------------------------------------------
  // Fund Source
  // ----------------------------------------------------------

  const fundSourceResult = await pool.query(
    `
    SELECT id, code, name
    FROM fund_sources
    WHERE id = $1
      AND is_active = TRUE
    `,
    [fundSourceId]
  );

  if (fundSourceResult.rows.length === 0) {
    throw new Error(
      'Selected fund source does not exist or is inactive.'
    );
  }

  // ----------------------------------------------------------
  // Fund Cluster
  // ----------------------------------------------------------

  const fundClusterResult = await pool.query(
    `
    SELECT
      id,
      fund_source_id,
      code,
      name
    FROM fund_clusters
    WHERE id = $1
      AND is_active = TRUE
    `,
    [fundClusterId]
  );

  if (fundClusterResult.rows.length === 0) {
    throw new Error(
      'Selected fund cluster does not exist or is inactive.'
    );
  }

  const fundCluster = fundClusterResult.rows[0];

  // Make sure selected cluster belongs to selected source.
  if (
    fundCluster.fund_source_id !== null &&
    Number(fundCluster.fund_source_id) !== Number(fundSourceId)
  ) {
    throw new Error(
      'Selected fund cluster does not belong to the selected fund source.'
    );
  }

  // ----------------------------------------------------------
  // Campus
  // ----------------------------------------------------------

  if (campusId !== null) {
    const campusResult = await pool.query(
      `
      SELECT id, code, name
      FROM campuses
      WHERE id = $1
        AND is_active = TRUE
      `,
      [campusId]
    );

    if (campusResult.rows.length === 0) {
      throw new Error(
        'Selected campus does not exist or is inactive.'
      );
    }
  }

  // ----------------------------------------------------------
  // Responsibility Center
  // ----------------------------------------------------------

  if (responsibilityCenterId !== null) {
    const rcResult = await pool.query(
      `
      SELECT id, code, name
      FROM responsibility_centers
      WHERE id = $1
        AND is_active = TRUE
      `,
      [responsibilityCenterId]
    );

    if (rcResult.rows.length === 0) {
      throw new Error(
        'Selected responsibility center does not exist or is inactive.'
      );
    }
  }

  // ----------------------------------------------------------
  // WFP Source
  // ----------------------------------------------------------

  if (wfpSourceId !== null) {
    const wfpResult = await pool.query(
      `
      SELECT id, code, name
      FROM wfp_sources
      WHERE id = $1
        AND is_active = TRUE
      `,
      [wfpSourceId]
    );

    if (wfpResult.rows.length === 0) {
      throw new Error(
        'Selected WFP source does not exist or is inactive.'
      );
    }
  }

  return true;
}

// ============================================================
// CREATE ALLOCATION
// POST /api/budget/allocations
// ============================================================

router.post('/allocations', async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      fiscal_year,
      fund_source_id,
      fund_cluster_id,
      campus_id,
      responsibility_center_id,
      wfp_source_id,
      allocation_amount
    } = req.body;

    const fiscalYear = parseYear(fiscal_year);

    const fundSourceId = parseId(fund_source_id);
    const fundClusterId = parseId(fund_cluster_id);
    const campusId = parseId(campus_id);
    const responsibilityCenterId = parseId(
      responsibility_center_id
    );
    const wfpSourceId = parseId(wfp_source_id);

    const allocationAmount = toNumber(allocation_amount);

    // --------------------------------------------------------
    // Required validation
    // --------------------------------------------------------

    if (!fiscalYear) {
      return res.status(400).json({
        success: false,
        message: 'Fiscal year is required and must be valid.'
      });
    }

    if (!fundSourceId) {
      return res.status(400).json({
        success: false,
        message: 'Fund source is required.'
      });
    }

    if (!fundClusterId) {
      return res.status(400).json({
        success: false,
        message: 'Fund cluster is required.'
      });
    }

    if (allocationAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Allocation amount must be greater than zero.'
      });
    }

    // --------------------------------------------------------
    // Validate master data
    // --------------------------------------------------------

    await validateMasterData({
      fundSourceId,
      fundClusterId,
      campusId,
      responsibilityCenterId,
      wfpSourceId
    });

    await client.query('BEGIN');

    // --------------------------------------------------------
    // Insert
    //
    // Do NOT insert utilized_amount,
    // disbursed_amount or remaining_balance manually.
    //
    // PostgreSQL will use:
    //
    // utilized_amount = 0
    // disbursed_amount = 0
    // remaining_balance =
    // allocation_amount - utilized_amount
    // --------------------------------------------------------

    const insertResult = await client.query(
      `
      INSERT INTO fund_allocations (
        fiscal_year,
        fund_source_id,
        fund_cluster_id,
        campus_id,
        responsibility_center_id,
        wfp_source_id,
        allocation_amount
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7
      )
      RETURNING
        id,
        fiscal_year,
        fund_source_id,
        fund_cluster_id,
        campus_id,
        responsibility_center_id,
        wfp_source_id,
        allocation_amount,
        utilized_amount,
        disbursed_amount,
        remaining_balance,
        created_at,
        updated_at
      `,
      [
        fiscalYear,
        fundSourceId,
        fundClusterId,
        campusId,
        responsibilityCenterId,
        wfpSourceId,
        allocationAmount
      ]
    );

    await client.query('COMMIT');

    // --------------------------------------------------------
    // Return complete joined record
    // --------------------------------------------------------

    const id = insertResult.rows[0].id;

    const finalResult = await pool.query(
      `
      SELECT
        fa.id,
        fa.fiscal_year,

        fa.fund_source_id,
        fs.code AS fund_source_code,
        fs.name AS fund_source_name,

        fa.fund_cluster_id,
        fc.code AS fund_cluster_code,
        fc.name AS fund_cluster_name,

        fa.campus_id,
        c.code AS campus_code,
        c.name AS campus_name,

        fa.responsibility_center_id,
        rc.code AS responsibility_center_code,
        rc.name AS responsibility_center_name,

        fa.wfp_source_id,
        ws.code AS wfp_source_code,
        ws.name AS wfp_source_name,

        fa.allocation_amount,
        fa.utilized_amount,
        fa.disbursed_amount,
        fa.remaining_balance,

        fa.created_at,
        fa.updated_at

      FROM fund_allocations fa

      LEFT JOIN fund_sources fs
        ON fs.id = fa.fund_source_id

      LEFT JOIN fund_clusters fc
        ON fc.id = fa.fund_cluster_id

      LEFT JOIN campuses c
        ON c.id = fa.campus_id

      LEFT JOIN responsibility_centers rc
        ON rc.id = fa.responsibility_center_id

      LEFT JOIN wfp_sources ws
        ON ws.id = fa.wfp_source_id

      WHERE fa.id = $1
      `,
      [id]
    );

    res.status(201).json({
      success: true,
      message: 'Budget allocation created successfully.',
      data: finalResult.rows[0]
    });

  } catch (error) {
    await client.query('ROLLBACK');

    console.error('Create allocation error:', error);

    if (
      error.message &&
      (
        error.message.includes('does not exist') ||
        error.message.includes('inactive') ||
        error.message.includes('does not belong')
      )
    ) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create budget allocation.',
      error: error.message
    });

  } finally {
    client.release();
  }
});

// ============================================================
// UPDATE ALLOCATION
// PUT /api/budget/allocations/:id
// ============================================================

router.put('/allocations/:id', async (req, res) => {
  const client = await pool.connect();

  try {
    const id = parseId(req.params.id);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Invalid allocation ID.'
      });
    }

    const {
      fiscal_year,
      fund_source_id,
      fund_cluster_id,
      campus_id,
      responsibility_center_id,
      wfp_source_id,
      allocation_amount
    } = req.body;

    const fiscalYear = parseYear(fiscal_year);

    const fundSourceId = parseId(fund_source_id);
    const fundClusterId = parseId(fund_cluster_id);
    const campusId = parseId(campus_id);
    const responsibilityCenterId = parseId(
      responsibility_center_id
    );
    const wfpSourceId = parseId(wfp_source_id);

    const allocationAmount = toNumber(allocation_amount);

    if (!fiscalYear) {
      return res.status(400).json({
        success: false,
        message: 'Fiscal year is required.'
      });
    }

    if (!fundSourceId) {
      return res.status(400).json({
        success: false,
        message: 'Fund source is required.'
      });
    }

    if (!fundClusterId) {
      return res.status(400).json({
        success: false,
        message: 'Fund cluster is required.'
      });
    }

    if (allocationAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Allocation amount must be greater than zero.'
      });
    }

    await validateMasterData({
      fundSourceId,
      fundClusterId,
      campusId,
      responsibilityCenterId,
      wfpSourceId
    });

    await client.query('BEGIN');

    const existing = await client.query(
      `
      SELECT *
      FROM fund_allocations
      WHERE id = $1
      FOR UPDATE
      `,
      [id]
    );

    if (existing.rows.length === 0) {
      await client.query('ROLLBACK');

      return res.status(404).json({
        success: false,
        message: 'Allocation not found.'
      });
    }

    const current = existing.rows[0];

    // Do not allow allocation to become smaller
    // than the amount already utilized.
    if (
      allocationAmount <
      Number(current.utilized_amount || 0)
    ) {
      await client.query('ROLLBACK');

      return res.status(400).json({
        success: false,
        message:
          'Allocation amount cannot be lower than the current utilized amount.'
      });
    }

    const result = await client.query(
      `
      UPDATE fund_allocations
      SET
        fiscal_year = $1,
        fund_source_id = $2,
        fund_cluster_id = $3,
        campus_id = $4,
        responsibility_center_id = $5,
        wfp_source_id = $6,
        allocation_amount = $7
      WHERE id = $8
      RETURNING
        id,
        fiscal_year,
        fund_source_id,
        fund_cluster_id,
        campus_id,
        responsibility_center_id,
        wfp_source_id,
        allocation_amount,
        utilized_amount,
        disbursed_amount,
        remaining_balance,
        created_at,
        updated_at
      `,
      [
        fiscalYear,
        fundSourceId,
        fundClusterId,
        campusId,
        responsibilityCenterId,
        wfpSourceId,
        allocationAmount,
        id
      ]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Budget allocation updated successfully.',
      data: result.rows[0]
    });

  } catch (error) {
    await client.query('ROLLBACK');

    console.error('Update allocation error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to update budget allocation.',
      error: error.message
    });

  } finally {
    client.release();
  }
});

// ============================================================
// DELETE ALLOCATION
// DELETE /api/budget/allocations/:id
// ============================================================

router.delete('/allocations/:id', async (req, res) => {
  try {
    const id = parseId(req.params.id);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Invalid allocation ID.'
      });
    }

    const existing = await pool.query(
      `
      SELECT
        id,
        utilized_amount,
        disbursed_amount
      FROM fund_allocations
      WHERE id = $1
      `,
      [id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Allocation not found.'
      });
    }

    const allocation = existing.rows[0];

    if (
      Number(allocation.utilized_amount || 0) > 0 ||
      Number(allocation.disbursed_amount || 0) > 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          'This allocation cannot be deleted because it already has utilization or disbursement.'
      });
    }

    await pool.query(
      `
      DELETE FROM fund_allocations
      WHERE id = $1
      `,
      [id]
    );

    res.json({
      success: true,
      message: 'Budget allocation deleted successfully.'
    });

  } catch (error) {
    console.error('Delete allocation error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to delete budget allocation.',
      error: error.message
    });
  }
});

// ============================================================
// EXPORT
// ============================================================

module.exports = router;