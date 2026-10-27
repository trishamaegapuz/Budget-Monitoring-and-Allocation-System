// Updated backend masterdata.js — save as masterdata.js in your backend routes folder.

// backend/routes/masterdata.js

const express = require('express');

const router = express.Router();

const pool = require('../db');

// ============================================================
// MASTER DATA ROUTES
// ============================================================
//
// Actual database tables used by this module:
//
// fund_clusters
// fund_sources
// responsibility_centers
// department_master
// object_expenditures
// allotment_classes
// mfo
// uacs_codes
// campuses
// pap
// wfp_sources
// users
//
// NOTE:
// Fund Clusters are stored in fund_clusters. The old duplicate Fund Groups
// and Funds UI sections are now represented by one Fund Clusters tab.
//
// ============================================================


// ============================================================
// HELPER: PAGINATION
// ============================================================

const getPagination = (req) => {
  let page = Number.parseInt(req.query.page, 10);

  let limit = Number.parseInt(req.query.limit, 10);

  if (!Number.isFinite(page) || page < 1) {
    page = 1;
  }

  if (!Number.isFinite(limit) || limit < 1) {
    limit = 10;
  }

  // Prevent excessively large queries.
  if (limit > 100) {
    limit = 100;
  }

  return {
    page,
    limit,
    offset: (page - 1) * limit,
  };
};


// ============================================================
// HELPER: SEARCH
// ============================================================

const getSearch = (req) => {
  const search = String(
    req.query.search || ''
  ).trim();

  return search;
};


// ============================================================
// HELPER: NORMALIZE STATUS
// ============================================================

const normalizeStatus = (value) => {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return 'Active';
  }

  const status = String(value).trim();

  if (status.toLowerCase() === 'inactive') {
    return 'Inactive';
  }

  return 'Active';
};


// ============================================================
// HELPER: INTEGER ID
// ============================================================

const parseId = (value) => {
  const id = Number.parseInt(value, 10);

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
};


// ============================================================
// HELPER: RESPONSE ERROR
// ============================================================

const sendDatabaseError = (
  res,
  error,
  fallbackMessage
) => {
  console.error(
    fallbackMessage,
    error
  );

  return res.status(500).json({
    error:
      error?.message ||
      fallbackMessage,
  });
};


// ============================================================
// MASTER DATA STATS
// ============================================================

router.get(
  '/stats',
  async (req, res) => {
    try {
      const result = await Promise.all([
        pool.query(`SELECT COUNT(*)::int AS count FROM fund_clusters`),
        pool.query(`SELECT COUNT(*)::int AS count FROM department_master`),
        pool.query(`SELECT COUNT(*)::int AS count FROM responsibility_centers`),
        pool.query(`SELECT COUNT(*)::int AS count FROM object_expenditures`),
        pool.query(`SELECT COUNT(*)::int AS count FROM fund_sources`),
        pool.query(`SELECT COUNT(*)::int AS count FROM allotment_classes`),
        pool.query(`SELECT COUNT(*)::int AS count FROM mfo`),
        pool.query(`SELECT COUNT(*)::int AS count FROM uacs_codes`),
        pool.query(`SELECT COUNT(*)::int AS count FROM campuses`),
        pool.query(`SELECT COUNT(*)::int AS count FROM pap`),
        pool.query(`SELECT COUNT(*)::int AS count FROM wfp_sources`),
        pool.query(`SELECT COUNT(*)::int AS count FROM users`),
      ]);

      return res.json({
        fundClusters: Number(result[0].rows[0]?.count) || 0,
        departments: Number(result[1].rows[0]?.count) || 0,
        centers: Number(result[2].rows[0]?.count) || 0,
        objects: Number(result[3].rows[0]?.count) || 0,
        sources: Number(result[4].rows[0]?.count) || 0,
        allotments: Number(result[5].rows[0]?.count) || 0,
        mfo: Number(result[6].rows[0]?.count) || 0,
        uacs: Number(result[7].rows[0]?.count) || 0,
        campuses: Number(result[8].rows[0]?.count) || 0,
        pap: Number(result[9].rows[0]?.count) || 0,
        wfp: Number(result[10].rows[0]?.count) || 0,
        users: Number(result[11].rows[0]?.count) || 0,
      });
    } catch (error) {
      return sendDatabaseError(
        res,
        error,
        'Master Data stats error:'
      );
    }
  }
);


// ============================================================
// GENERIC LIST RESPONSE
// ============================================================

const sendPaginatedResult = async ({
  res,
  table,
  select = '*',
  searchColumns = [],
  orderBy = 'id',
  req,
  transform,
}) => {
  try {
    const {
      page,
      limit,
      offset,
    } = getPagination(req);

    const search = getSearch(req);

    const values = [];

    let whereClause = '';

    if (search && searchColumns.length > 0) {
      const conditions =
        searchColumns.map(
          (column) => {
            values.push(
              `%${search}%`
            );

            return `
              CAST(${column} AS TEXT)
              ILIKE $${values.length}
            `;
          }
        );

      whereClause = `
        WHERE ${conditions.join(' OR ')}
      `;
    }

    const countResult =
      await pool.query(
        `
          SELECT COUNT(*)::int AS total
          FROM ${table}
          ${whereClause}
        `,
        values
      );

    const totalItems =
      Number(
        countResult.rows[0]?.total
      ) || 0;

    const totalPages =
      Math.max(
        Math.ceil(
          totalItems / limit
        ),
        1
      );

    const dataValues = [
      ...values,
      limit,
      offset,
    ];

    const dataResult =
      await pool.query(
        `
          SELECT ${select}
          FROM ${table}
          ${whereClause}
          ORDER BY ${orderBy}
          LIMIT $${dataValues.length - 1}
          OFFSET $${dataValues.length}
        `,
        dataValues
      );

    let items =
      dataResult.rows;

    if (typeof transform === 'function') {
      items = items.map(transform);
    }

    return res.json({
      items,
      currentPage: page,
      totalItems,
      totalPages,
    });
  } catch (error) {
    return sendDatabaseError(
      res,
      error,
      `Failed to load ${table}.`
    );
  }
};


// ============================================================
// FUND GROUPS
// ============================================================
//
// IMPORTANT:
// No fund_groups table exists.
//
// We map this frontend section to fund_clusters.
// This prevents the previous:
//
// relation "fund_groups" does not exist
//
// error.
//
// ============================================================

router.get(
  '/fund-groups',
  async (req, res) => {
    return sendPaginatedResult({
      res,
      table: 'fund_clusters',

      select: `
        id,
        code,
        name,
        description,
        is_active,
        created_at,
        updated_at
      `,

      searchColumns: [
        'code',
        'name',
        'description',
      ],

      orderBy: 'id ASC',

      req,

      transform: (row) => ({
        id: row.id,
        code: row.code,
        name: row.name,
        description:
          row.description || '',
        status:
          row.is_active
            ? 'Active'
            : 'Inactive',
        is_active:
          row.is_active,
        created_at:
          row.created_at,
        updated_at:
          row.updated_at,
      }),
    });
  }
);


// ============================================================
// CREATE FUND GROUP
// ============================================================

router.post(
  '/fund-groups',
  async (req, res) => {
    const client =
      await pool.connect();

    try {
      const {
        code,
        name,
        description,
        status,
      } = req.body;

      if (
        !String(code || '').trim() ||
        !String(name || '').trim()
      ) {
        return res.status(400).json({
          error:
            'Code and Name are required.',
        });
      }

      const cleanCode =
        String(code).trim();

      const cleanName =
        String(name).trim();

      const cleanDescription =
        String(
          description || ''
        ).trim();

      const isActive =
        normalizeStatus(status) ===
        'Active';

      const duplicate =
        await client.query(
          `
            SELECT id
            FROM fund_clusters
            WHERE LOWER(code) = LOWER($1)
            LIMIT 1
          `,
          [cleanCode]
        );

      if (duplicate.rowCount > 0) {
        return res.status(409).json({
          error:
            'A Fund Group with this code already exists.',
        });
      }

      const result =
        await client.query(
          `
            INSERT INTO fund_clusters
            (
              code,
              name,
              description,
              is_active
            )
            VALUES
            ($1, $2, $3, $4)
            RETURNING
              id,
              code,
              name,
              description,
              is_active,
              created_at,
              updated_at
          `,
          [
            cleanCode,
            cleanName,
            cleanDescription || null,
            isActive,
          ]
        );

      return res.status(201).json({
        message:
          'Fund Group created successfully.',
        item: result.rows[0],
      });
    } catch (error) {
      return sendDatabaseError(
        res,
        error,
        'Failed to create Fund Group.'
      );
    } finally {
      client.release();
    }
  }
);


// ============================================================
// UPDATE FUND GROUP
// ============================================================

router.put(
  '/fund-groups/:id',
  async (req, res) => {
    const client =
      await pool.connect();

    try {
      const id =
        parseId(req.params.id);

      if (!id) {
        return res.status(400).json({
          error:
            'Invalid Fund Group ID.',
        });
      }

      const {
        code,
        name,
        description,
        status,
      } = req.body;

      if (
        !String(code || '').trim() ||
        !String(name || '').trim()
      ) {
        return res.status(400).json({
          error:
            'Code and Name are required.',
        });
      }

      const cleanCode =
        String(code).trim();

      const cleanName =
        String(name).trim();

      const cleanDescription =
        String(
          description || ''
        ).trim();

      const isActive =
        normalizeStatus(status) ===
        'Active';

      const duplicate =
        await client.query(
          `
            SELECT id
            FROM fund_clusters
            WHERE LOWER(code) = LOWER($1)
              AND id <> $2
            LIMIT 1
          `,
          [
            cleanCode,
            id,
          ]
        );

      if (duplicate.rowCount > 0) {
        return res.status(409).json({
          error:
            'Another Fund Group already uses this code.',
        });
      }

      const result =
        await client.query(
          `
            UPDATE fund_clusters
            SET
              code = $1,
              name = $2,
              description = $3,
              is_active = $4,
              updated_at = NOW()
            WHERE id = $5
            RETURNING
              id,
              code,
              name,
              description,
              is_active,
              created_at,
              updated_at
          `,
          [
            cleanCode,
            cleanName,
            cleanDescription || null,
            isActive,
            id,
          ]
        );

      if (result.rowCount === 0) {
        return res.status(404).json({
          error:
            'Fund Group not found.',
        });
      }

      return res.json({
        message:
          'Fund Group updated successfully.',
        item: result.rows[0],
      });
    } catch (error) {
      return sendDatabaseError(
        res,
        error,
        'Failed to update Fund Group.'
      );
    } finally {
      client.release();
    }
  }
);


// ============================================================
// DELETE FUND GROUP
// ============================================================

router.delete(
  '/fund-groups/:id',
  async (req, res) => {
    const client =
      await pool.connect();

    try {
      const id =
        parseId(req.params.id);

      if (!id) {
        return res.status(400).json({
          error:
            'Invalid Fund Group ID.',
        });
      }

      const result =
        await client.query(
          `
            DELETE FROM fund_clusters
            WHERE id = $1
            RETURNING id, code, name
          `,
          [id]
        );

      if (result.rowCount === 0) {
        return res.status(404).json({
          error:
            'Fund Group not found.',
        });
      }

      return res.json({
        message:
          'Fund Group deleted successfully.',
        item: result.rows[0],
      });
    } catch (error) {
      // Foreign-key related error
      if (error.code === '23503') {
        return res.status(409).json({
          error:
            'This Fund Group cannot be deleted because it is already being used by another record.',
        });
      }

      return sendDatabaseError(
        res,
        error,
        'Failed to delete Fund Group.'
      );
    } finally {
      client.release();
    }
  }
);


// ============================================================
// FUNDS
// ============================================================
//
// Uses fund_clusters because that is the existing table that
// contains:
//
// id
// fund_source_id
// code
// name
// description
// is_active
//
// ============================================================

router.get(
  '/funds',
  async (req, res) => {
    try {
      const {
        page,
        limit,
        offset,
      } = getPagination(req);

      const search =
        getSearch(req);

      const values = [];

      let whereClause = '';

      if (search) {
        values.push(
          `%${search}%`
        );

        whereClause = `
          WHERE
            fc.code ILIKE $1
            OR fc.name ILIKE $1
            OR COALESCE(
              fc.description,
              ''
            ) ILIKE $1
        `;
      }

      const countResult =
        await pool.query(
          `
            SELECT COUNT(*)::int AS total
            FROM fund_clusters fc
            ${whereClause}
          `,
          values
        );

      const totalItems =
        Number(
          countResult.rows[0]?.total
        ) || 0;

      const totalPages =
        Math.max(
          Math.ceil(
            totalItems / limit
          ),
          1
        );

      const dataValues = [
        ...values,
        limit,
        offset,
      ];

      const result =
        await pool.query(
          `
            SELECT
              fc.id,
              fc.code,
              fc.name,
              fc.description,
              fc.is_active,
              fc.fund_source_id,
              fs.code AS fund_source_code,
              fs.name AS fund_source_name,
              fc.created_at,
              fc.updated_at
            FROM fund_clusters fc
            LEFT JOIN fund_sources fs
              ON fs.id = fc.fund_source_id
            ${whereClause}
            ORDER BY fc.id ASC
            LIMIT $${dataValues.length - 1}
            OFFSET $${dataValues.length}
          `,
          dataValues
        );

      return res.json({
        items: result.rows.map(
          (row) => ({
            id: row.id,
            code: row.code,
            name: row.name,
            description:
              row.description || '',
            fund_source_id:
              row.fund_source_id,
            fund_source_code:
              row.fund_source_code,
            fund_source_name:
              row.fund_source_name,
            status:
              row.is_active
                ? 'Active'
                : 'Inactive',
            is_active:
              row.is_active,
            created_at:
              row.created_at,
            updated_at:
              row.updated_at,
          })
        ),

        currentPage: page,
        totalItems,
        totalPages,
      });
    } catch (error) {
      return sendDatabaseError(
        res,
        error,
        'Failed to load Funds.'
      );
    }
  }
);


// ============================================================
// CREATE FUND
// ============================================================

router.post(
  '/funds',
  async (req, res) => {
    try {
      const {
        code,
        name,
        description,
        status,
        fund_source_id,
      } = req.body;

      if (
        !String(code || '').trim() ||
        !String(name || '').trim()
      ) {
        return res.status(400).json({
          error:
            'Code and Name are required.',
        });
      }

      const cleanCode =
        String(code).trim();

      const cleanName =
        String(name).trim();

      const cleanDescription =
        String(
          description || ''
        ).trim();

      let sourceId = null;

      if (
        fund_source_id !==
          undefined &&
        fund_source_id !== null &&
        fund_source_id !== ''
      ) {
        sourceId =
          parseId(
            fund_source_id
          );

        if (!sourceId) {
          return res.status(400).json({
            error:
              'Invalid Fund Source ID.',
          });
        }

        const source =
          await pool.query(
            `
              SELECT id
              FROM fund_sources
              WHERE id = $1
              LIMIT 1
            `,
            [sourceId]
          );

        if (source.rowCount === 0) {
          return res.status(400).json({
            error:
              'The selected Fund Source does not exist.',
          });
        }
      }

      const duplicate =
        await pool.query(
          `
            SELECT id
            FROM fund_clusters
            WHERE LOWER(code) = LOWER($1)
            LIMIT 1
          `,
          [cleanCode]
        );

      if (duplicate.rowCount > 0) {
        return res.status(409).json({
          error:
            'A Fund with this code already exists.',
        });
      }

      const result =
        await pool.query(
          `
            INSERT INTO fund_clusters
            (
              fund_source_id,
              code,
              name,
              description,
              is_active
            )
            VALUES
            ($1, $2, $3, $4, $5)
            RETURNING
              id,
              fund_source_id,
              code,
              name,
              description,
              is_active,
              created_at,
              updated_at
          `,
          [
            sourceId,
            cleanCode,
            cleanName,
            cleanDescription || null,
            normalizeStatus(status) ===
              'Active',
          ]
        );

      return res.status(201).json({
        message:
          'Fund created successfully.',
        item: result.rows[0],
      });
    } catch (error) {
      return sendDatabaseError(
        res,
        error,
        'Failed to create Fund.'
      );
    }
  }
);


// ============================================================
// UPDATE FUND
// ============================================================

router.put(
  '/funds/:id',
  async (req, res) => {
    try {
      const id =
        parseId(req.params.id);

      if (!id) {
        return res.status(400).json({
          error:
            'Invalid Fund ID.',
        });
      }

      const {
        code,
        name,
        description,
        status,
        fund_source_id,
      } = req.body;

      if (
        !String(code || '').trim() ||
        !String(name || '').trim()
      ) {
        return res.status(400).json({
          error:
            'Code and Name are required.',
        });
      }

      const cleanCode =
        String(code).trim();

      const cleanName =
        String(name).trim();

      const cleanDescription =
        String(
          description || ''
        ).trim();

      let sourceId = null;

      if (
        fund_source_id !==
          undefined &&
        fund_source_id !== null &&
        fund_source_id !== ''
      ) {
        sourceId =
          parseId(
            fund_source_id
          );

        if (!sourceId) {
          return res.status(400).json({
            error:
              'Invalid Fund Source ID.',
          });
        }

        const source =
          await pool.query(
            `
              SELECT id
              FROM fund_sources
              WHERE id = $1
              LIMIT 1
            `,
            [sourceId]
          );

        if (source.rowCount === 0) {
          return res.status(400).json({
            error:
              'The selected Fund Source does not exist.',
          });
        }
      }

      const duplicate =
        await pool.query(
          `
            SELECT id
            FROM fund_clusters
            WHERE LOWER(code) = LOWER($1)
              AND id <> $2
            LIMIT 1
          `,
          [
            cleanCode,
            id,
          ]
        );

      if (duplicate.rowCount > 0) {
        return res.status(409).json({
          error:
            'Another Fund already uses this code.',
        });
      }

      const result =
        await pool.query(
          `
            UPDATE fund_clusters
            SET
              fund_source_id = $1,
              code = $2,
              name = $3,
              description = $4,
              is_active = $5,
              updated_at = NOW()
            WHERE id = $6
            RETURNING
              id,
              fund_source_id,
              code,
              name,
              description,
              is_active,
              created_at,
              updated_at
          `,
          [
            sourceId,
            cleanCode,
            cleanName,
            cleanDescription || null,
            normalizeStatus(status) ===
              'Active',
            id,
          ]
        );

      if (result.rowCount === 0) {
        return res.status(404).json({
          error:
            'Fund not found.',
        });
      }

      return res.json({
        message:
          'Fund updated successfully.',
        item: result.rows[0],
      });
    } catch (error) {
      return sendDatabaseError(
        res,
        error,
        'Failed to update Fund.'
      );
    }
  }
);


// ============================================================
// DELETE FUND
// ============================================================

router.delete(
  '/funds/:id',
  async (req, res) => {
    try {
      const id =
        parseId(req.params.id);

      if (!id) {
        return res.status(400).json({
          error:
            'Invalid Fund ID.',
        });
      }

      const result =
        await pool.query(
          `
            DELETE FROM fund_clusters
            WHERE id = $1
            RETURNING id, code, name
          `,
          [id]
        );

      if (result.rowCount === 0) {
        return res.status(404).json({
          error:
            'Fund not found.',
        });
      }

      return res.json({
        message:
          'Fund deleted successfully.',
        item: result.rows[0],
      });
    } catch (error) {
      if (error.code === '23503') {
        return res.status(409).json({
          error:
            'This Fund cannot be deleted because it is already being used by another record.',
        });
      }

      return sendDatabaseError(
        res,
        error,
        'Failed to delete Fund.'
      );
    }
  }
);


// ============================================================
// DEPARTMENTS
// ============================================================
//
// Departments are now a separate Master Data reference.
// responsibility_centers remains a separate internal reference because
// budget/RBUD/RAOD records still use responsibility_center_id.
// ============================================================

router.get(
  '/departments',
  async (req, res) => {
    try {
      const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
      const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
      const offset = (page - 1) * limit;
      const search = String(req.query.search || '').trim();
      const campusId = parseId(req.query.campus_id);

      const where = [];
      const params = [];

      if (search) {
        params.push(`%${search}%`);
        where.push(`(
          dm.code ILIKE $${params.length}
          OR dm.name ILIKE $${params.length}
          OR COALESCE(dm.description, '') ILIKE $${params.length}
          OR c.code ILIKE $${params.length}
          OR c.name ILIKE $${params.length}
        )`);
      }

      if (campusId) {
        params.push(campusId);
        where.push(`dm.campus_id = $${params.length}`);
      }

      const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

      const countResult = await pool.query(
        `SELECT COUNT(*)::int AS total
           FROM department_master dm
           INNER JOIN campuses c ON c.id = dm.campus_id
          ${whereSql}`,
        params
      );

      const totalItems = Number(countResult.rows[0]?.total) || 0;

      const dataParams = [...params, limit, offset];
      const result = await pool.query(
        `SELECT
           dm.id,
           dm.code,
           dm.name,
           dm.description,
           dm.campus_id,
           c.code AS campus_code,
           c.name AS campus_name,
           dm.is_active,
           dm.created_at,
           dm.updated_at
         FROM department_master dm
         INNER JOIN campuses c ON c.id = dm.campus_id
         ${whereSql}
         ORDER BY c.name ASC, dm.name ASC, dm.id ASC
         LIMIT $${dataParams.length - 1}
         OFFSET $${dataParams.length}`,
        dataParams
      );

      return res.json({
        items: result.rows.map((row) => ({
          id: row.id,
          code: row.code,
          name: row.name,
          description: row.description || '',
          campus_id: row.campus_id,
          campus_code: row.campus_code,
          campus_name: row.campus_name,
          status: row.is_active ? 'Active' : 'Inactive',
          is_active: row.is_active,
          created_at: row.created_at,
          updated_at: row.updated_at,
        })),
        currentPage: page,
        totalItems,
        totalPages: Math.max(Math.ceil(totalItems / limit), 1),
        pageSize: limit,
      });
    } catch (error) {
      return sendDatabaseError(
        res,
        error,
        'Failed to load Departments.'
      );
    }
  }
);

router.post(
  '/departments',
  async (req, res) => {
    try {
      const {
        code,
        name,
        description,
        campus_id,
        status,
      } = req.body;

      const cleanCode = String(code || '').trim();
      const cleanName = String(name || '').trim();
      const campusId = parseId(campus_id);

      if (!cleanCode || !cleanName || !campusId) {
        return res.status(400).json({
          error: 'Code, Name, and Campus are required.',
        });
      }

      const campus = await pool.query(
        `SELECT id, code, name
           FROM campuses
          WHERE id = $1
            AND is_active = TRUE
          LIMIT 1`,
        [campusId]
      );

      if (campus.rowCount === 0) {
        return res.status(400).json({
          error: 'Selected Campus does not exist or is inactive.',
        });
      }

      const duplicate = await pool.query(
        `SELECT id
           FROM department_master
          WHERE campus_id = $1
            AND LOWER(code) = LOWER($2)
          LIMIT 1`,
        [campusId, cleanCode]
      );

      if (duplicate.rowCount > 0) {
        return res.status(409).json({
          error: 'A Department with this code already exists in the selected Campus.',
        });
      }

      const result = await pool.query(
        `INSERT INTO department_master
          (campus_id, code, name, description, is_active)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [
          campusId,
          cleanCode,
          cleanName,
          String(description || '').trim() || null,
          normalizeStatus(status) === 'Active',
        ]
      );

      return res.status(201).json({
        message: 'Department created successfully.',
        item: {
          ...result.rows[0],
          campus_code: campus.rows[0].code,
          campus_name: campus.rows[0].name,
          status: result.rows[0].is_active ? 'Active' : 'Inactive',
        },
      });
    } catch (error) {
      return sendDatabaseError(
        res,
        error,
        'Failed to create Department.'
      );
    }
  }
);

router.put(
  '/departments/:id',
  async (req, res) => {
    try {
      const id = parseId(req.params.id);

      if (!id) {
        return res.status(400).json({
          error: 'Invalid Department ID.',
        });
      }

      const {
        code,
        name,
        description,
        campus_id,
        status,
      } = req.body;

      const cleanCode = String(code || '').trim();
      const cleanName = String(name || '').trim();
      const campusId = parseId(campus_id);

      if (!cleanCode || !cleanName || !campusId) {
        return res.status(400).json({
          error: 'Code, Name, and Campus are required.',
        });
      }

      const campus = await pool.query(
        `SELECT id, code, name
           FROM campuses
          WHERE id = $1
            AND is_active = TRUE
          LIMIT 1`,
        [campusId]
      );

      if (campus.rowCount === 0) {
        return res.status(400).json({
          error: 'Selected Campus does not exist or is inactive.',
        });
      }

      const duplicate = await pool.query(
        `SELECT id
           FROM department_master
          WHERE campus_id = $1
            AND LOWER(code) = LOWER($2)
            AND id <> $3
          LIMIT 1`,
        [campusId, cleanCode, id]
      );

      if (duplicate.rowCount > 0) {
        return res.status(409).json({
          error: 'Another Department already uses this code in the selected Campus.',
        });
      }

      const result = await pool.query(
        `UPDATE department_master
            SET campus_id = $1,
                code = $2,
                name = $3,
                description = $4,
                is_active = $5,
                updated_at = NOW()
          WHERE id = $6
          RETURNING *`,
        [
          campusId,
          cleanCode,
          cleanName,
          String(description || '').trim() || null,
          normalizeStatus(status) === 'Active',
          id,
        ]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({
          error: 'Department not found.',
        });
      }

      return res.json({
        message: 'Department updated successfully.',
        item: {
          ...result.rows[0],
          campus_code: campus.rows[0].code,
          campus_name: campus.rows[0].name,
          status: result.rows[0].is_active ? 'Active' : 'Inactive',
        },
      });
    } catch (error) {
      return sendDatabaseError(
        res,
        error,
        'Failed to update Department.'
      );
    }
  }
);

router.delete(
  '/departments/:id',
  async (req, res) => {
    try {
      const id = parseId(req.params.id);

      if (!id) {
        return res.status(400).json({
          error: 'Invalid Department ID.',
        });
      }

      const result = await pool.query(
        `DELETE FROM department_master
         WHERE id = $1
         RETURNING id, code, name`,
        [id]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({
          error: 'Department not found.',
        });
      }

      return res.json({
        message: 'Department deleted successfully.',
        item: result.rows[0],
      });
    } catch (error) {
      if (error.code === '23503') {
        return res.status(409).json({
          error: 'This Department cannot be deleted because it is already being used by another record.',
        });
      }

      return sendDatabaseError(
        res,
        error,
        'Failed to delete Department.'
      );
    }
  }
);


// ============================================================
// RESPONSIBILITY CENTERS
// ============================================================

router.get(
  '/centers',
  async (req, res) => {
    return sendPaginatedResult({
      res,
      table: 'responsibility_centers',

      select: `
        id,
        code,
        name,
        description,
        category,
        is_active,
        created_at,
        updated_at
      `,

      searchColumns: [
        'code',
        'name',
        'description',
        'category',
      ],

      orderBy: 'id ASC',

      req,

      transform: (row) => ({
        id: row.id,
        code: row.code,
        name: row.name,
        description:
          row.description || '',
        category:
          row.category || '',
        status:
          row.is_active
            ? 'Active'
            : 'Inactive',
        is_active:
          row.is_active,
        created_at:
          row.created_at,
        updated_at:
          row.updated_at,
      }),
    });
  }
);


// ============================================================
// CREATE RESPONSIBILITY CENTER
// ============================================================

router.post(
  '/centers',
  async (req, res) => {
    try {
      const {
        code,
        name,
        description,
        category,
        status,
      } = req.body;

      if (
        !String(code || '').trim() ||
        !String(name || '').trim()
      ) {
        return res.status(400).json({
          error:
            'Code and Name are required.',
        });
      }

      const duplicate =
        await pool.query(
          `
            SELECT id
            FROM responsibility_centers
            WHERE LOWER(code) = LOWER($1)
            LIMIT 1
          `,
          [String(code).trim()]
        );

      if (duplicate.rowCount > 0) {
        return res.status(409).json({
          error:
            'A Responsibility Center with this code already exists.',
        });
      }

      const result =
        await pool.query(
          `
            INSERT INTO responsibility_centers
            (
              code,
              name,
              description,
              category,
              is_active
            )
            VALUES
            ($1, $2, $3, $4, $5)
            RETURNING *
          `,
          [
            String(code).trim(),
            String(name).trim(),
            String(
              description || ''
            ).trim() || null,
            String(
              category || ''
            ).trim() || null,
            normalizeStatus(status) ===
              'Active',
          ]
        );

      return res.status(201).json({
        message:
          'Responsibility Center created successfully.',
        item: result.rows[0],
      });
    } catch (error) {
      return sendDatabaseError(
        res,
        error,
        'Failed to create Responsibility Center.'
      );
    }
  }
);


// ============================================================
// UPDATE RESPONSIBILITY CENTER
// ============================================================

router.put(
  '/centers/:id',
  async (req, res) => {
    try {
      const id =
        parseId(req.params.id);

      if (!id) {
        return res.status(400).json({
          error:
            'Invalid Responsibility Center ID.',
        });
      }

      const {
        code,
        name,
        description,
        category,
        status,
      } = req.body;

      if (
        !String(code || '').trim() ||
        !String(name || '').trim()
      ) {
        return res.status(400).json({
          error:
            'Code and Name are required.',
        });
      }

      const duplicate =
        await pool.query(
          `
            SELECT id
            FROM responsibility_centers
            WHERE LOWER(code) = LOWER($1)
              AND id <> $2
            LIMIT 1
          `,
          [
            String(code).trim(),
            id,
          ]
        );

      if (duplicate.rowCount > 0) {
        return res.status(409).json({
          error:
            'Another Responsibility Center already uses this code.',
        });
      }

      const result =
        await pool.query(
          `
            UPDATE responsibility_centers
            SET
              code = $1,
              name = $2,
              description = $3,
              category = $4,
              is_active = $5,
              updated_at = NOW()
            WHERE id = $6
            RETURNING *
          `,
          [
            String(code).trim(),
            String(name).trim(),
            String(
              description || ''
            ).trim() || null,
            String(
              category || ''
            ).trim() || null,
            normalizeStatus(status) ===
              'Active',
            id,
          ]
        );

      if (result.rowCount === 0) {
        return res.status(404).json({
          error:
            'Responsibility Center not found.',
        });
      }

      return res.json({
        message:
          'Responsibility Center updated successfully.',
        item: result.rows[0],
      });
    } catch (error) {
      return sendDatabaseError(
        res,
        error,
        'Failed to update Responsibility Center.'
      );
    }
  }
);


// ============================================================
// DELETE RESPONSIBILITY CENTER
// ============================================================

router.delete(
  '/centers/:id',
  async (req, res) => {
    try {
      const id =
        parseId(req.params.id);

      if (!id) {
        return res.status(400).json({
          error:
            'Invalid Responsibility Center ID.',
        });
      }

      const result =
        await pool.query(
          `
            DELETE FROM responsibility_centers
            WHERE id = $1
            RETURNING id, code, name
          `,
          [id]
        );

      if (result.rowCount === 0) {
        return res.status(404).json({
          error:
            'Responsibility Center not found.',
        });
      }

      return res.json({
        message:
          'Responsibility Center deleted successfully.',
        item: result.rows[0],
      });
    } catch (error) {
      if (error.code === '23503') {
        return res.status(409).json({
          error:
            'This Responsibility Center cannot be deleted because it is already being used by another record.',
        });
      }

      return sendDatabaseError(
        res,
        error,
        'Failed to delete Responsibility Center.'
      );
    }
  }
);


// ============================================================
// OBJECT CODES
// ============================================================

router.get(
  '/objects',
  async (req, res) => {
    return sendPaginatedResult({
      res,
      table: 'object_expenditures',

      select: `
        id,
        code,
        name,
        description,
        is_active,
        created_at,
        updated_at
      `,

      searchColumns: [
        'code',
        'name',
        'description',
      ],

      orderBy: 'id ASC',

      req,

      transform: (row) => ({
        id: row.id,
        code: row.code,
        name: row.name,
        description:
          row.description || '',
        status:
          row.is_active
            ? 'Active'
            : 'Inactive',
        is_active:
          row.is_active,
        created_at:
          row.created_at,
        updated_at:
          row.updated_at,
      }),
    });
  }
);


// ============================================================
// CREATE OBJECT CODE
// ============================================================

router.post(
  '/objects',
  async (req, res) => {
    try {
      const {
        code,
        name,
        description,
        status,
      } = req.body;

      if (
        !String(code || '').trim() ||
        !String(name || '').trim()
      ) {
        return res.status(400).json({
          error:
            'Code and Name are required.',
        });
      }

      const duplicate =
        await pool.query(
          `
            SELECT id
            FROM object_expenditures
            WHERE LOWER(code) = LOWER($1)
            LIMIT 1
          `,
          [String(code).trim()]
        );

      if (duplicate.rowCount > 0) {
        return res.status(409).json({
          error:
            'An Object Code with this code already exists.',
        });
      }

      const result =
        await pool.query(
          `
            INSERT INTO object_expenditures
            (
              code,
              name,
              description,
              is_active
            )
            VALUES
            ($1, $2, $3, $4)
            RETURNING *
          `,
          [
            String(code).trim(),
            String(name).trim(),
            String(
              description || ''
            ).trim() || null,
            normalizeStatus(status) ===
              'Active',
          ]
        );

      return res.status(201).json({
        message:
          'Object Code created successfully.',
        item: result.rows[0],
      });
    } catch (error) {
      return sendDatabaseError(
        res,
        error,
        'Failed to create Object Code.'
      );
    }
  }
);


// ============================================================
// UPDATE OBJECT CODE
// ============================================================

router.put(
  '/objects/:id',
  async (req, res) => {
    try {
      const id =
        parseId(req.params.id);

      if (!id) {
        return res.status(400).json({
          error:
            'Invalid Object Code ID.',
        });
      }

      const {
        code,
        name,
        description,
        status,
      } = req.body;

      if (
        !String(code || '').trim() ||
        !String(name || '').trim()
      ) {
        return res.status(400).json({
          error:
            'Code and Name are required.',
        });
      }

      const duplicate =
        await pool.query(
          `
            SELECT id
            FROM object_expenditures
            WHERE LOWER(code) = LOWER($1)
              AND id <> $2
            LIMIT 1
          `,
          [
            String(code).trim(),
            id,
          ]
        );

      if (duplicate.rowCount > 0) {
        return res.status(409).json({
          error:
            'Another Object Code already uses this code.',
        });
      }

      const result =
        await pool.query(
          `
            UPDATE object_expenditures
            SET
              code = $1,
              name = $2,
              description = $3,
              is_active = $4,
              updated_at = NOW()
            WHERE id = $5
            RETURNING *
          `,
          [
            String(code).trim(),
            String(name).trim(),
            String(
              description || ''
            ).trim() || null,
            normalizeStatus(status) ===
              'Active',
            id,
          ]
        );

      if (result.rowCount === 0) {
        return res.status(404).json({
          error:
            'Object Code not found.',
        });
      }

      return res.json({
        message:
          'Object Code updated successfully.',
        item: result.rows[0],
      });
    } catch (error) {
      return sendDatabaseError(
        res,
        error,
        'Failed to update Object Code.'
      );
    }
  }
);


// ============================================================
// DELETE OBJECT CODE
// ============================================================

router.delete(
  '/objects/:id',
  async (req, res) => {
    try {
      const id =
        parseId(req.params.id);

      if (!id) {
        return res.status(400).json({
          error:
            'Invalid Object Code ID.',
        });
      }

      const result =
        await pool.query(
          `
            DELETE FROM object_expenditures
            WHERE id = $1
            RETURNING id, code, name
          `,
          [id]
        );

      if (result.rowCount === 0) {
        return res.status(404).json({
          error:
            'Object Code not found.',
        });
      }

      return res.json({
        message:
          'Object Code deleted successfully.',
        item: result.rows[0],
      });
    } catch (error) {
      if (error.code === '23503') {
        return res.status(409).json({
          error:
            'This Object Code cannot be deleted because it is already being used by another record.',
        });
      }

      return sendDatabaseError(
        res,
        error,
        'Failed to delete Object Code.'
      );
    }
  }
);


// ============================================================
// FUNDING SOURCES
// ============================================================

router.get(
  '/sources',
  async (req, res) => {
    return sendPaginatedResult({
      res,
      table: 'fund_sources',

      select: `
        id,
        code,
        name,
        description,
        is_active,
        created_at,
        updated_at
      `,

      searchColumns: [
        'code',
        'name',
        'description',
      ],

      orderBy: 'id ASC',

      req,

      transform: (row) => ({
        id: row.id,
        code: row.code,
        name: row.name,
        description:
          row.description || '',
        status:
          row.is_active
            ? 'Active'
            : 'Inactive',
        is_active:
          row.is_active,
        created_at:
          row.created_at,
        updated_at:
          row.updated_at,
      }),
    });
  }
);


// ============================================================
// CREATE FUNDING SOURCE
// ============================================================

router.post(
  '/sources',
  async (req, res) => {
    try {
      const {
        code,
        name,
        description,
        status,
      } = req.body;

      if (
        !String(code || '').trim() ||
        !String(name || '').trim()
      ) {
        return res.status(400).json({
          error:
            'Code and Name are required.',
        });
      }

      const duplicate =
        await pool.query(
          `
            SELECT id
            FROM fund_sources
            WHERE LOWER(code) = LOWER($1)
            LIMIT 1
          `,
          [String(code).trim()]
        );

      if (duplicate.rowCount > 0) {
        return res.status(409).json({
          error:
            'A Funding Source with this code already exists.',
        });
      }

      const result =
        await pool.query(
          `
            INSERT INTO fund_sources
            (
              code,
              name,
              description,
              is_active
            )
            VALUES
            ($1, $2, $3, $4)
            RETURNING *
          `,
          [
            String(code).trim(),
            String(name).trim(),
            String(
              description || ''
            ).trim() || null,
            normalizeStatus(status) ===
              'Active',
          ]
        );

      return res.status(201).json({
        message:
          'Funding Source created successfully.',
        item: result.rows[0],
      });
    } catch (error) {
      return sendDatabaseError(
        res,
        error,
        'Failed to create Funding Source.'
      );
    }
  }
);


// ============================================================
// UPDATE FUNDING SOURCE
// ============================================================

router.put(
  '/sources/:id',
  async (req, res) => {
    try {
      const id =
        parseId(req.params.id);

      if (!id) {
        return res.status(400).json({
          error:
            'Invalid Funding Source ID.',
        });
      }

      const {
        code,
        name,
        description,
        status,
      } = req.body;

      if (
        !String(code || '').trim() ||
        !String(name || '').trim()
      ) {
        return res.status(400).json({
          error:
            'Code and Name are required.',
        });
      }

      const duplicate =
        await pool.query(
          `
            SELECT id
            FROM fund_sources
            WHERE LOWER(code) = LOWER($1)
              AND id <> $2
            LIMIT 1
          `,
          [
            String(code).trim(),
            id,
          ]
        );

      if (duplicate.rowCount > 0) {
        return res.status(409).json({
          error:
            'Another Funding Source already uses this code.',
        });
      }

      const result =
        await pool.query(
          `
            UPDATE fund_sources
            SET
              code = $1,
              name = $2,
              description = $3,
              is_active = $4,
              updated_at = NOW()
            WHERE id = $5
            RETURNING *
          `,
          [
            String(code).trim(),
            String(name).trim(),
            String(
              description || ''
            ).trim() || null,
            normalizeStatus(status) ===
              'Active',
            id,
          ]
        );

      if (result.rowCount === 0) {
        return res.status(404).json({
          error:
            'Funding Source not found.',
        });
      }

      return res.json({
        message:
          'Funding Source updated successfully.',
        item: result.rows[0],
      });
    } catch (error) {
      return sendDatabaseError(
        res,
        error,
        'Failed to update Funding Source.'
      );
    }
  }
);


// ============================================================
// DELETE FUNDING SOURCE
// ============================================================

router.delete(
  '/sources/:id',
  async (req, res) => {
    try {
      const id =
        parseId(req.params.id);

      if (!id) {
        return res.status(400).json({
          error:
            'Invalid Funding Source ID.',
        });
      }

      const result =
        await pool.query(
          `
            DELETE FROM fund_sources
            WHERE id = $1
            RETURNING id, code, name
          `,
          [id]
        );

      if (result.rowCount === 0) {
        return res.status(404).json({
          error:
            'Funding Source not found.',
        });
      }

      return res.json({
        message:
          'Funding Source deleted successfully.',
        item: result.rows[0],
      });
    } catch (error) {
      if (error.code === '23503') {
        return res.status(409).json({
          error:
            'This Funding Source cannot be deleted because it is already being used by another record.',
        });
      }

      return sendDatabaseError(
        res,
        error,
        'Failed to delete Funding Source.'
      );
    }
  }
);


// ============================================================
// ALLOTMENT CLASSES
// ============================================================

router.get(
  '/allotments',
  async (req, res) => {
    return sendPaginatedResult({
      res,
      table: 'allotment_classes',

      select: `
        id,
        code,
        name,
        description,
        is_active,
        created_at,
        updated_at
      `,

      searchColumns: [
        'code',
        'name',
        'description',
      ],

      orderBy: 'id ASC',

      req,

      transform: (row) => ({
        id: row.id,
        code: row.code,
        name: row.name,
        description:
          row.description || '',
        status:
          row.is_active
            ? 'Active'
            : 'Inactive',
        is_active:
          row.is_active,
        created_at:
          row.created_at,
        updated_at:
          row.updated_at,
      }),
    });
  }
);


// ============================================================
// CREATE ALLOTMENT CLASS
// ============================================================

router.post(
  '/allotments',
  async (req, res) => {
    try {
      const {
        code,
        name,
        description,
        status,
      } = req.body;

      if (
        !String(code || '').trim() ||
        !String(name || '').trim()
      ) {
        return res.status(400).json({
          error:
            'Code and Name are required.',
        });
      }

      const duplicate =
        await pool.query(
          `
            SELECT id
            FROM allotment_classes
            WHERE LOWER(code) = LOWER($1)
            LIMIT 1
          `,
          [String(code).trim()]
        );

      if (duplicate.rowCount > 0) {
        return res.status(409).json({
          error:
            'An Allotment Class with this code already exists.',
        });
      }

      const result =
        await pool.query(
          `
            INSERT INTO allotment_classes
            (
              code,
              name,
              description,
              is_active
            )
            VALUES
            ($1, $2, $3, $4)
            RETURNING *
          `,
          [
            String(code).trim(),
            String(name).trim(),
            String(
              description || ''
            ).trim() || null,
            normalizeStatus(status) ===
              'Active',
          ]
        );

      return res.status(201).json({
        message:
          'Allotment Class created successfully.',
        item: result.rows[0],
      });
    } catch (error) {
      return sendDatabaseError(
        res,
        error,
        'Failed to create Allotment Class.'
      );
    }
  }
);


// ============================================================
// UPDATE ALLOTMENT CLASS
// ============================================================

router.put(
  '/allotments/:id',
  async (req, res) => {
    try {
      const id =
        parseId(req.params.id);

      if (!id) {
        return res.status(400).json({
          error:
            'Invalid Allotment Class ID.',
        });
      }

      const {
        code,
        name,
        description,
        status,
      } = req.body;

      if (
        !String(code || '').trim() ||
        !String(name || '').trim()
      ) {
        return res.status(400).json({
          error:
            'Code and Name are required.',
        });
      }

      const duplicate =
        await pool.query(
          `
            SELECT id
            FROM allotment_classes
            WHERE LOWER(code) = LOWER($1)
              AND id <> $2
            LIMIT 1
          `,
          [
            String(code).trim(),
            id,
          ]
        );

      if (duplicate.rowCount > 0) {
        return res.status(409).json({
          error:
            'Another Allotment Class already uses this code.',
        });
      }

      const result =
        await pool.query(
          `
            UPDATE allotment_classes
            SET
              code = $1,
              name = $2,
              description = $3,
              is_active = $4,
              updated_at = NOW()
            WHERE id = $5
            RETURNING *
          `,
          [
            String(code).trim(),
            String(name).trim(),
            String(
              description || ''
            ).trim() || null,
            normalizeStatus(status) ===
              'Active',
            id,
          ]
        );

      if (result.rowCount === 0) {
        return res.status(404).json({
          error:
            'Allotment Class not found.',
        });
      }

      return res.json({
        message:
          'Allotment Class updated successfully.',
        item: result.rows[0],
      });
    } catch (error) {
      return sendDatabaseError(
        res,
        error,
        'Failed to update Allotment Class.'
      );
    }
  }
);


// ============================================================
// DELETE ALLOTMENT CLASS
// ============================================================

router.delete(
  '/allotments/:id',
  async (req, res) => {
    try {
      const id =
        parseId(req.params.id);

      if (!id) {
        return res.status(400).json({
          error:
            'Invalid Allotment Class ID.',
        });
      }

      const result =
        await pool.query(
          `
            DELETE FROM allotment_classes
            WHERE id = $1
            RETURNING id, code, name
          `,
          [id]
        );

      if (result.rowCount === 0) {
        return res.status(404).json({
          error:
            'Allotment Class not found.',
        });
      }

      return res.json({
        message:
          'Allotment Class deleted successfully.',
        item: result.rows[0],
      });
    } catch (error) {
      if (error.code === '23503') {
        return res.status(409).json({
          error:
            'This Allotment Class cannot be deleted because it is already being used by another record.',
        });
      }

      return sendDatabaseError(
        res,
        error,
        'Failed to delete Allotment Class.'
      );
    }
  }
);


// ============================================================
// OTHERS
// ============================================================
//
// Read-only reference data.
//
// Supported frontend types:
//
// mfo
// uacs
// campuses
// pap
// wfp
// users
//
// ============================================================

const OTHER_CONFIG = {
  mfo: {
    table: 'mfo',

    select: `
      id,
      code,
      name,
      description,
      is_active,
      created_at,
      updated_at
    `,

    searchColumns: [
      'code',
      'name',
      'description',
    ],

    transform: (row) => ({
      id: row.id,
      code: row.code,
      name: row.name,
      description:
        row.description || '',
      status:
        row.is_active
          ? 'Active'
          : 'Inactive',
      is_active:
        row.is_active,
      created_at:
        row.created_at,
      updated_at:
        row.updated_at,
    }),
  },

  uacs: {
    table: 'uacs_codes',

    select: `
      id,
      code,
      old_code,
      account_title,
      revised_description,
      account_description,
      category,
      is_active,
      created_at,
      updated_at
    `,

    searchColumns: [
      'code',
      'old_code',
      'account_title',
      'revised_description',
      'account_description',
      'category',
    ],

    transform: (row) => ({
      id: row.id,
      code: row.code,
      old_code:
        row.old_code || '',
      name:
        row.account_title || '',
      account_title:
        row.account_title || '',
      description:
        row.revised_description ||
        row.account_description ||
        '',
      revised_description:
        row.revised_description ||
        '',
      account_description:
        row.account_description ||
        '',
      category:
        row.category || '',
      status:
        row.is_active
          ? 'Active'
          : 'Inactive',
      is_active:
        row.is_active,
      created_at:
        row.created_at,
      updated_at:
        row.updated_at,
    }),
  },

  campuses: {
    table: 'campuses',

    select: `
      id,
      code,
      name,
      abbreviation,
      is_active,
      created_at,
      updated_at
    `,

    searchColumns: [
      'code',
      'name',
      'abbreviation',
    ],

    transform: (row) => ({
      id: row.id,
      code: row.code,
      name: row.name,
      description:
        row.abbreviation || '',
      abbreviation:
        row.abbreviation || '',
      status:
        row.is_active
          ? 'Active'
          : 'Inactive',
      is_active:
        row.is_active,
      created_at:
        row.created_at,
      updated_at:
        row.updated_at,
    }),
  },

  pap: {
    table: 'pap',

    select: `
      id,
      code,
      name,
      description,
      is_active,
      created_at,
      updated_at
    `,

    searchColumns: [
      'code',
      'name',
      'description',
    ],

    transform: (row) => ({
      id: row.id,
      code: row.code,
      name: row.name,
      description:
        row.description || '',
      status:
        row.is_active
          ? 'Active'
          : 'Inactive',
      is_active:
        row.is_active,
      created_at:
        row.created_at,
      updated_at:
        row.updated_at,
    }),
  },

  wfp: {
    table: 'wfp_sources',

    select: '*',

    searchColumns: [],

    transform: (row) => {
      const code =
        row.code ||
        row.source_code ||
        row.id;

      const name =
        row.name ||
        row.source_name ||
        row.title ||
        '—';

      const description =
        row.description ||
        row.details ||
        '';

      const isActive =
        row.is_active !== undefined
          ? row.is_active
          : true;

      return {
        ...row,

        id: row.id,
        code,
        name,
        description,
        status:
          isActive
            ? 'Active'
            : 'Inactive',
        is_active:
          isActive,
      };
    },
  },


};


// ============================================================
// GET OTHERS
// ============================================================

router.get(
  '/others',
  async (req, res) => {
    try {
      const type =
        String(
          req.query.type || 'mfo'
        ).trim();

      const config =
        OTHER_CONFIG[type];

      if (!config) {
        return res.status(400).json({
          error:
            'Invalid reference data type.',
          types:
            Object.keys(
              OTHER_CONFIG
            ),
        });
      }

      const {
        page,
        limit,
        offset,
      } = getPagination(req);

      const search =
        getSearch(req);

      const values = [];

      let whereClause = '';

      if (
        search &&
        config.searchColumns.length
      ) {
        const conditions =
          config.searchColumns.map(
            (column) => {
              values.push(
                `%${search}%`
              );

              return `
                CAST(${column} AS TEXT)
                ILIKE $${values.length}
              `;
            }
          );

        whereClause = `
          WHERE ${conditions.join(
            ' OR '
          )}
        `;
      }

      const countResult =
        await pool.query(
          `
            SELECT COUNT(*)::int AS total
            FROM ${config.table}
            ${whereClause}
          `,
          values
        );

      const totalItems =
        Number(
          countResult.rows[0]?.total
        ) || 0;

      const totalPages =
        Math.max(
          Math.ceil(
            totalItems / limit
          ),
          1
        );

      const dataValues = [
        ...values,
        limit,
        offset,
      ];

      const result =
        await pool.query(
          `
            SELECT ${config.select}
            FROM ${config.table}
            ${whereClause}
            ORDER BY id ASC
            LIMIT $${dataValues.length - 1}
            OFFSET $${dataValues.length}
          `,
          dataValues
        );

      return res.json({
        items:
          result.rows.map(
            config.transform
          ),

        currentPage:
          page,

        totalItems,

        totalPages,

        type,

        types:
          Object.keys(
            OTHER_CONFIG
          ),
      });
    } catch (error) {
      return sendDatabaseError(
        res,
        error,
        'Failed to load reference data.'
      );
    }
  }
);



// ============================================================
// OTHERS CRUD
// MFO / UACS / CAMPUSES / PAP / WFP SOURCES
// ============================================================
// These reference tables are managed from dedicated Master Data tabs.
// Users are intentionally excluded; user management remains in the
// dedicated User Management module.
// ============================================================

const EDITABLE_OTHER_TYPES = {
  mfo: {
    table: 'mfo',
    codeColumn: 'code',
    nameColumn: 'name',
    descriptionColumn: 'description',
    extraColumns: [],
    select: `
      id, code, name, description, is_active,
      created_at, updated_at
    `,
    transform: (row) => ({
      id: row.id,
      code: row.code || '',
      name: row.name || '',
      description: row.description || '',
      status: row.is_active ? 'Active' : 'Inactive',
      is_active: row.is_active,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }),
  },

  uacs: {
    table: 'uacs_codes',
    codeColumn: 'code',
    nameColumn: 'account_title',
    descriptionColumn: 'revised_description',
    extraColumns: ['old_code', 'account_description', 'category'],
    select: `
      id, code, old_code, account_title,
      revised_description, account_description,
      category, is_active, created_at, updated_at
    `,
    transform: (row) => ({
      id: row.id,
      code: row.code || '',
      old_code: row.old_code || '',
      name: row.account_title || '',
      account_title: row.account_title || '',
      description:
        row.revised_description ||
        row.account_description ||
        '',
      revised_description: row.revised_description || '',
      account_description: row.account_description || '',
      category: row.category || '',
      status: row.is_active ? 'Active' : 'Inactive',
      is_active: row.is_active,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }),
  },

  campuses: {
    table: 'campuses',
    codeColumn: 'code',
    nameColumn: 'name',
    descriptionColumn: 'abbreviation',
    extraColumns: ['abbreviation'],
    select: `
      id, code, name, abbreviation,
      is_active, created_at, updated_at
    `,
    transform: (row) => ({
      id: row.id,
      code: row.code || '',
      name: row.name || '',
      description: row.abbreviation || '',
      abbreviation: row.abbreviation || '',
      status: row.is_active ? 'Active' : 'Inactive',
      is_active: row.is_active,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }),
  },

  pap: {
    table: 'pap',
    codeColumn: 'code',
    nameColumn: 'name',
    descriptionColumn: 'description',
    extraColumns: [],
    select: `
      id, code, name, description,
      is_active, created_at, updated_at
    `,
    transform: (row) => ({
      id: row.id,
      code: row.code || '',
      name: row.name || '',
      description: row.description || '',
      status: row.is_active ? 'Active' : 'Inactive',
      is_active: row.is_active,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }),
  },

  wfp: {
    table: 'wfp_sources',
    codeColumn: 'code',
    nameColumn: 'name',
    descriptionColumn: 'description',
    extraColumns: [],
    select: `
      id, code, name, description,
      is_active, created_at, updated_at
    `,
    transform: (row) => ({
      id: row.id,
      code: row.code || '',
      name: row.name || '',
      description: row.description || '',
      status: row.is_active ? 'Active' : 'Inactive',
      is_active: row.is_active,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }),
  },
};

const getEditableOtherConfig = (req, res) => {
  const type = String(req.query.type || '').trim().toLowerCase();
  const config = EDITABLE_OTHER_TYPES[type];

  if (!config) {
    res.status(400).json({
      error:
        'Invalid editable reference type. Allowed types: mfo, uacs, campuses, pap, wfp.',
    });
    return null;
  }

  return { type, config };
};

const buildOtherPayload = (type, body) => {
  const clean = (value) =>
    value === undefined ||
    value === null ||
    String(value).trim() === ''
      ? null
      : String(value).trim();

  const code = clean(body.code);
  const status =
    normalizeStatus(body.status) === 'Active';

  if (type === 'uacs') {
    const accountTitle =
      clean(body.account_title) ||
      clean(body.name);

    return {
      code,
      old_code: clean(body.old_code),
      account_title: accountTitle,
      revised_description:
        clean(body.revised_description) ||
        clean(body.description),
      account_description:
        clean(body.account_description),
      category: clean(body.category),
      is_active: status,
    };
  }

  if (type === 'campuses') {
    return {
      code,
      name: clean(body.name),
      abbreviation:
        clean(body.abbreviation) ||
        clean(body.description),
      is_active: status,
    };
  }

  return {
    code,
    name: clean(body.name),
    description: clean(body.description),
    is_active: status,
  };
};

router.post(
  '/others',
  async (req, res) => {
    try {
      const resolved =
        getEditableOtherConfig(req, res);

      if (!resolved) return;

      const { type, config } = resolved;
      const payload =
        buildOtherPayload(type, req.body || {});

      if (
        !payload.code ||
        (type === 'uacs'
          ? !payload.account_title
          : !payload.name)
      ) {
        return res.status(400).json({
          error:
            type === 'uacs'
              ? 'UACS Code and Account Title are required.'
              : 'Code and Name are required.',
        });
      }

      const duplicate =
        await pool.query(
          `
            SELECT id
            FROM ${config.table}
            WHERE LOWER(code) = LOWER($1)
            LIMIT 1
          `,
          [payload.code]
        );

      if (duplicate.rowCount > 0) {
        return res.status(409).json({
          error:
            'A record with this code already exists.',
        });
      }

      const columns =
        Object.keys(payload);
      const values =
        Object.values(payload);

      const placeholders =
        columns.map(
          (_, index) => `$${index + 1}`
        );

      const result =
        await pool.query(
          `
            INSERT INTO ${config.table}
              (${columns.join(', ')})
            VALUES
              (${placeholders.join(', ')})
            RETURNING ${config.select}
          `,
          values
        );

      return res.status(201).json({
        message:
          `${type.toUpperCase()} record created successfully.`,
        item:
          config.transform(
            result.rows[0]
          ),
      });
    } catch (error) {
      if (error.code === '23505') {
        return res.status(409).json({
          error:
            'A record with the same code already exists.',
        });
      }

      return sendDatabaseError(
        res,
        error,
        'Failed to create reference record.'
      );
    }
  }
);

router.put(
  '/others/:id',
  async (req, res) => {
    try {
      const resolved =
        getEditableOtherConfig(req, res);

      if (!resolved) return;

      const { type, config } = resolved;
      const id = parseId(req.params.id);

      if (!id) {
        return res.status(400).json({
          error:
            'Invalid reference record ID.',
        });
      }

      const payload =
        buildOtherPayload(type, req.body || {});

      if (
        !payload.code ||
        (type === 'uacs'
          ? !payload.account_title
          : !payload.name)
      ) {
        return res.status(400).json({
          error:
            type === 'uacs'
              ? 'UACS Code and Account Title are required.'
              : 'Code and Name are required.',
        });
      }

      const duplicate =
        await pool.query(
          `
            SELECT id
            FROM ${config.table}
            WHERE LOWER(code) = LOWER($1)
              AND id <> $2
            LIMIT 1
          `,
          [payload.code, id]
        );

      if (duplicate.rowCount > 0) {
        return res.status(409).json({
          error:
            'Another record already uses this code.',
        });
      }

      const columns =
        Object.keys(payload);

      const values =
        Object.values(payload);

      const assignments =
        columns.map(
          (column, index) =>
            `${column} = $${index + 1}`
        );

      values.push(id);

      const result =
        await pool.query(
          `
            UPDATE ${config.table}
            SET
              ${assignments.join(', ')},
              updated_at = NOW()
            WHERE id = $${values.length}
            RETURNING ${config.select}
          `,
          values
        );

      if (
        result.rowCount === 0
      ) {
        return res.status(404).json({
          error:
            'Reference record not found.',
        });
      }

      return res.json({
        message:
          `${type.toUpperCase()} record updated successfully.`,
        item:
          config.transform(
            result.rows[0]
          ),
      });
    } catch (error) {
      if (error.code === '23505') {
        return res.status(409).json({
          error:
            'Another record already uses this code.',
        });
      }

      return sendDatabaseError(
        res,
        error,
        'Failed to update reference record.'
      );
    }
  }
);

router.delete(
  '/others/:id',
  async (req, res) => {
    try {
      const resolved =
        getEditableOtherConfig(req, res);

      if (!resolved) return;

      const { type, config } = resolved;
      const id = parseId(req.params.id);

      if (!id) {
        return res.status(400).json({
          error:
            'Invalid reference record ID.',
        });
      }

      const result =
        await pool.query(
          `
            DELETE FROM ${config.table}
            WHERE id = $1
            RETURNING id, code
          `,
          [id]
        );

      if (
        result.rowCount === 0
      ) {
        return res.status(404).json({
          error:
            'Reference record not found.',
        });
      }

      return res.json({
        message:
          `${type.toUpperCase()} record deleted successfully.`,
        item:
          result.rows[0],
      });
    } catch (error) {
      if (error.code === '23503') {
        return res.status(409).json({
          error:
            'This reference record cannot be deleted because it is already being used by another record.',
        });
      }

      return sendDatabaseError(
        res,
        error,
        'Failed to delete reference record.'
      );
    }
  }
);

// ============================================================
// DEFAULT ROUTE CHECK
// ============================================================

router.get(
  '/',
  async (req, res) => {
    return res.json({
      message:
        'Master Data API is running.',
      endpoints: [
        '/stats',
        '/funds',
        '/departments',
        '/objects',
        '/sources',
        '/allotments',
        '/others?type=mfo',
        '/others?type=uacs',
        '/others?type=campuses',
        '/others?type=pap',
        '/others?type=wfp',
        '/fees',
      ],
    });
  }
);



// ============================================================
// FEE MANAGEMENT — master data for Fee Monitoring
// ============================================================
const FEE_CATEGORIES = ['Non-Fiduciary Fees - Tuition Fees', 'Fiduciary Fees - College', 'Fiduciary Fees - JHS', 'Fiduciary Fees - Other School Fees'];

router.get('/fees', async (req, res) => {
  try {
    const { page, limit, offset } = getPagination(req);
    const search = getSearch(req);
    // Only expose active particulars from the four official FY 2026 categories.
    // Legacy rows are retained in PostgreSQL but are excluded from new-entry dropdowns.
    const result = await pool.query(
      `SELECT id, code, name, category, description, status, created_at, updated_at
         FROM fee_master_particulars
        WHERE status = 'Active'
          AND category = ANY($1::text[])
          AND ($2 = '' OR code ILIKE '%' || $2 || '%' OR name ILIKE '%' || $2 || '%' OR category ILIKE '%' || $2 || '%')
        ORDER BY category, name
        LIMIT $3 OFFSET $4`, [FEE_CATEGORIES, search, limit, offset]);
    const count = await pool.query(
      `SELECT COUNT(*)::int AS total FROM fee_master_particulars
        WHERE status = 'Active'
          AND category = ANY($1::text[])
          AND ($2 = '' OR code ILIKE '%' || $2 || '%' OR name ILIKE '%' || $2 || '%' OR category ILIKE '%' || $2 || '%')`, [FEE_CATEGORIES, search]);
    const totalItems = Number(count.rows[0]?.total) || 0;
    return res.json({ items: result.rows, currentPage: page, totalItems, totalPages: Math.max(1, Math.ceil(totalItems / limit)) });
  } catch (error) { return sendDatabaseError(res, error, 'Fee master data fetch error:'); }
});

router.post('/fees', async (req, res) => {
  try {
    const code = String(req.body.code || '').trim();
    const name = String(req.body.name || '').trim();
    const category = String(req.body.category || '').trim();
    const description = String(req.body.description || '').trim();
    const status = normalizeStatus(req.body.status);
    if (!code || !name || !FEE_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: 'Code, Particulars, and a valid Fee Category are required.' });
    }
    const result = await pool.query(
      `INSERT INTO fee_master_particulars (code, name, category, description, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, code, name, category, description, status`,
      [code, name, category, description, status]);
    return res.status(201).json({ item: result.rows[0], message: 'Fee particular added.' });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'A fee with this code or particular already exists in this category.' });
    return sendDatabaseError(res, error, 'Fee master data create error:');
  }
});

router.put('/fees/:id', async (req, res) => {
  try {
    const id = parseId(req.params.id);
    const code = String(req.body.code || '').trim();
    const name = String(req.body.name || '').trim();
    const category = String(req.body.category || '').trim();
    const description = String(req.body.description || '').trim();
    const status = normalizeStatus(req.body.status);
    if (!id) return res.status(400).json({ error: 'Invalid fee ID.' });
    if (!code || !name || !FEE_CATEGORIES.includes(category)) return res.status(400).json({ error: 'Code, Particulars, and a valid Fee Category are required.' });
    const result = await pool.query(
      `UPDATE fee_master_particulars SET code=$1, name=$2, category=$3, description=$4, status=$5, updated_at=NOW()
        WHERE id=$6 RETURNING id, code, name, category, description, status`,
      [code, name, category, description, status, id]);
    if (!result.rowCount) return res.status(404).json({ error: 'Fee particular not found.' });
    return res.json({ item: result.rows[0], message: 'Fee particular updated.' });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'A fee with this code or particular already exists in this category.' });
    return sendDatabaseError(res, error, 'Fee master data update error:');
  }
});

router.delete('/fees/:id', async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid fee ID.' });
    // Soft delete so existing monitoring records can retain their reference.
    const result = await pool.query(
      `UPDATE fee_master_particulars SET status='Inactive', updated_at=NOW() WHERE id=$1 RETURNING id`, [id]);
    if (!result.rowCount) return res.status(404).json({ error: 'Fee particular not found.' });
    return res.json({ message: 'Fee particular deactivated.' });
  } catch (error) { return sendDatabaseError(res, error, 'Fee master data deactivate error:'); }
});


// ============================================================
// EXPORT
// ============================================================

module.exports = router;