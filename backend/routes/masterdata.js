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
// There is NO "fund_groups" table in the current database.
// For compatibility with the frontend's "Fund Groups" tab,
// fund_groups is mapped to fund_clusters.
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
        pool.query(
          `SELECT COUNT(*)::int AS count
           FROM fund_clusters`
        ),

        pool.query(
          `SELECT COUNT(*)::int AS count
           FROM fund_clusters`
        ),

        pool.query(
          `SELECT COUNT(*)::int AS count
           FROM responsibility_centers`
        ),

        pool.query(
          `SELECT COUNT(*)::int AS count
           FROM object_expenditures`
        ),

        pool.query(
          `SELECT COUNT(*)::int AS count
           FROM fund_sources`
        ),

        pool.query(
          `SELECT COUNT(*)::int AS count
           FROM allotment_classes`
        ),

        pool.query(
          `SELECT COUNT(*)::int AS count
           FROM users`
        ),
      ]);

      return res.json({
        fundGroups:
          Number(
            result[0].rows[0]?.count
          ) || 0,

        funds:
          Number(
            result[1].rows[0]?.count
          ) || 0,

        centers:
          Number(
            result[2].rows[0]?.count
          ) || 0,

        objects:
          Number(
            result[3].rows[0]?.count
          ) || 0,

        sources:
          Number(
            result[4].rows[0]?.count
          ) || 0,

        allotments:
          Number(
            result[5].rows[0]?.count
          ) || 0,

        users:
          Number(
            result[6].rows[0]?.count
          ) || 0,
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

  users: {
    table: 'users',

    select: `
      id,
      username,
      full_name,
      email,
      role,
      is_active,
      created_at,
      updated_at
    `,

    searchColumns: [
      'username',
      'full_name',
      'email',
      'role',
    ],

    transform: (row) => ({
      id: row.id,

      code:
        row.username || '',

      username:
        row.username || '',

      name:
        row.full_name ||
        row.username ||
        '',

      full_name:
        row.full_name || '',

      description:
        row.email || '',

      email:
        row.email || '',

      role:
        row.role || '',

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
        '/fund-groups',
        '/funds',
        '/centers',
        '/objects',
        '/sources',
        '/allotments',
        '/others',
      ],
    });
  }
);


// ============================================================
// EXPORT
// ============================================================

module.exports = router;