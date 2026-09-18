const express = require('express');
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.use(verifyToken);

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

const parseYear = (year) => {
  const parsed = parseInt(year, 10);

  if (Number.isInteger(parsed)) {
    return parsed;
  }

  return new Date().getFullYear();
};

const parseId = (id) => {
  const parsed = parseInt(id, 10);

  if (Number.isInteger(parsed) && parsed > 0) {
    return parsed;
  }

  return null;
};

const parseAmount = (value) => {
  const amount = parseFloat(value);

  return Number.isFinite(amount) ? amount : 0;
};

const mapStatus = (isActive) => {
  return isActive ? 'Active' : 'Inactive';
};


/*
|--------------------------------------------------------------------------
| SUMMARY
|--------------------------------------------------------------------------
| GET /api/fund-sources/summary?year=2026
|
| Uses ONLY columns that belong to the fund_sources and
| fund_allocations structure.
|--------------------------------------------------------------------------
*/

router.get('/summary', async (req, res) => {
  try {
    const selectedYear = parseYear(req.query.year);

    /*
    |--------------------------------------------------------------------------
    | FUND SOURCE COUNTS
    |--------------------------------------------------------------------------
    */

    const countRes = await pool.query(`
      SELECT
        COUNT(*)::INTEGER AS total,
        COUNT(*) FILTER (
          WHERE is_active = TRUE
        )::INTEGER AS active,
        COUNT(*) FILTER (
          WHERE is_active = FALSE
        )::INTEGER AS inactive
      FROM fund_sources
    `);

    /*
    |--------------------------------------------------------------------------
    | TOTAL ALLOCATION
    |--------------------------------------------------------------------------
    */

    const allocationRes = await pool.query(`
      SELECT
        COALESCE(SUM(allocation_amount), 0) AS total_budget
      FROM fund_allocations
      WHERE fiscal_year = $1
    `, [selectedYear]);

    /*
    |--------------------------------------------------------------------------
    | FUND GROUP COUNT
    |--------------------------------------------------------------------------
    | Fund Sources are the six main fund groups:
    | MAIN, BGD, OTHER, DOST, DA, CHED
    |--------------------------------------------------------------------------
    */

    const groupRes = await pool.query(`
      SELECT COUNT(*)::INTEGER AS groups
      FROM fund_sources
      WHERE is_active = TRUE
    `);

    /*
    |--------------------------------------------------------------------------
    | FUND CLUSTER COUNT
    |--------------------------------------------------------------------------
    */

    const clusterRes = await pool.query(`
      SELECT COUNT(*)::INTEGER AS total
      FROM fund_clusters
      WHERE is_active = TRUE
    `);

    const count = countRes.rows[0];
    const allocation = allocationRes.rows[0];

    res.json({
      totalSources: parseInt(count.total, 10) || 0,
      activeSources: parseInt(count.active, 10) || 0,
      inactiveSources: parseInt(count.inactive, 10) || 0,

      totalBudgetCovered: parseAmount(
        allocation.total_budget
      ),

      /*
      |----------------------------------------------------------------------
      | These are intentionally 0 for now.
      |
      | Utilization and disbursement should come from RBUD/RAOD
      | transactions, not from fund_allocations unless those columns
      | actually exist in your database.
      |----------------------------------------------------------------------
      */

      totalUtilized: 0,
      totalDisbursed: 0,

      /*
      |----------------------------------------------------------------------
      | At the Fund Sources level, balance initially equals allocation.
      | Later we can subtract actual RBUD/RAOD utilization.
      |----------------------------------------------------------------------
      */

      totalBalance: parseAmount(
        allocation.total_budget
      ),

      fundGroupsCount:
        parseInt(groupRes.rows[0].groups, 10) || 0,

      totalClusters:
        parseInt(clusterRes.rows[0].total, 10) || 0,

      fiscalYear: selectedYear
    });

  } catch (err) {
    console.error('Fund Sources Summary Error:', err);

    res.status(500).json({
      error: 'Failed to load fund sources summary.',
      details: err.message
    });
  }
});


/*
|--------------------------------------------------------------------------
| TREND
|--------------------------------------------------------------------------
| GET /api/fund-sources/trend?period=monthly&year=2026
|
| Uses allocation_amount only.
|--------------------------------------------------------------------------
*/

router.get('/trend', async (req, res) => {
  try {
    const period = (
      req.query.period || 'monthly'
    ).toLowerCase();

    const selectedYear = parseYear(req.query.year);

    let query;
    let params;

    /*
    |--------------------------------------------------------------------------
    | MONTHLY
    |--------------------------------------------------------------------------
    */

    if (period === 'monthly') {

      params = [selectedYear];

      query = `
        WITH months AS (
          SELECT
            generate_series(
              MAKE_DATE($1, 1, 1),
              MAKE_DATE($1, 12, 1),
              INTERVAL '1 month'
            )::DATE AS month_date
        ),

        allocations AS (
          SELECT
            EXTRACT(
              MONTH FROM created_at
            )::INTEGER AS month_no,

            COALESCE(
              SUM(allocation_amount),
              0
            ) AS total_allocation

          FROM fund_allocations

          WHERE fiscal_year = $1

          GROUP BY
            EXTRACT(MONTH FROM created_at)
        )

        SELECT
          TO_CHAR(
            m.month_date,
            'Mon'
          ) AS label,

          EXTRACT(
            MONTH FROM m.month_date
          )::INTEGER AS sort_key,

          COALESCE(
            a.total_allocation,
            0
          ) AS total_fund_sources

        FROM months m

        LEFT JOIN allocations a
          ON a.month_no =
             EXTRACT(
               MONTH FROM m.month_date
             )::INTEGER

        ORDER BY sort_key ASC;
      `;
    }


    /*
    |--------------------------------------------------------------------------
    | QUARTERLY
    |--------------------------------------------------------------------------
    */

    else if (period === 'quarterly') {

      params = [selectedYear];

      query = `
        WITH quarters AS (
          SELECT 1 AS quarter
          UNION ALL
          SELECT 2
          UNION ALL
          SELECT 3
          UNION ALL
          SELECT 4
        ),

        allocations AS (
          SELECT

            EXTRACT(
              QUARTER FROM created_at
            )::INTEGER AS quarter_no,

            COALESCE(
              SUM(allocation_amount),
              0
            ) AS total_allocation

          FROM fund_allocations

          WHERE fiscal_year = $1

          GROUP BY
            EXTRACT(
              QUARTER FROM created_at
            )
        )

        SELECT

          'Q' || q.quarter AS label,

          q.quarter AS sort_key,

          COALESCE(
            a.total_allocation,
            0
          ) AS total_fund_sources

        FROM quarters q

        LEFT JOIN allocations a
          ON a.quarter_no = q.quarter

        ORDER BY sort_key ASC;
      `;
    }


    /*
    |--------------------------------------------------------------------------
    | YEARLY
    |--------------------------------------------------------------------------
    */

    else if (period === 'yearly') {

      params = [];

      query = `
        SELECT

          fiscal_year::TEXT AS label,

          fiscal_year AS sort_key,

          COALESCE(
            SUM(allocation_amount),
            0
          ) AS total_fund_sources

        FROM fund_allocations

        GROUP BY fiscal_year

        ORDER BY fiscal_year ASC;
      `;
    }


    /*
    |--------------------------------------------------------------------------
    | INVALID PERIOD
    |--------------------------------------------------------------------------
    */

    else {

      return res.status(400).json({
        error:
          'Invalid period. Use monthly, quarterly, or yearly.'
      });
    }


    const result = await pool.query(
      query,
      params
    );

    const formattedData =
      result.rows.map(row => ({
        label: row.label,

        total_fund_sources:
          parseAmount(
            row.total_fund_sources
          ),

        /*
        |----------------------------------------------------------------------
        | Keep these fields available for the frontend.
        | Actual utilization/disbursement will be connected later.
        |----------------------------------------------------------------------
        */

        utilized_amount: 0,

        disbursed_amount: 0,

        available_balance:
          parseAmount(
            row.total_fund_sources
          )
      }));

    res.json(formattedData);

  } catch (err) {

    console.error(
      'Fund Sources Trend Error:',
      err
    );

    res.status(500).json({
      error:
        'Failed to load fund sources trend.',
      details: err.message
    });
  }
});


/*
|--------------------------------------------------------------------------
| LIST FUND SOURCES
|--------------------------------------------------------------------------
| GET /api/fund-sources?year=2026
| GET /api/fund-sources?page=1&limit=10&year=2026
|--------------------------------------------------------------------------
*/

router.get('/', async (req, res) => {

  const {
    page,
    limit,
    year
  } = req.query;

  const selectedYear =
    parseYear(year);

  try {

    const pageNumber =
      parseInt(page, 10);

    const limitNumber =
      parseInt(limit, 10);

    const isPagination =
      Number.isInteger(pageNumber) &&
      pageNumber > 0 &&
      Number.isInteger(limitNumber) &&
      limitNumber > 0;


    /*
    |--------------------------------------------------------------------------
    | BASE QUERY
    |--------------------------------------------------------------------------
    */

    const baseQuery = `
      SELECT

        fs.id,
        fs.code,
        fs.name,
        fs.description,
        fs.is_active,

        COALESCE(
          alloc.total_allocated,
          0
        ) AS allocated_amount,

        fs.created_at,
        fs.updated_at

      FROM fund_sources fs

      LEFT JOIN (

        SELECT

          fund_source_id,

          COALESCE(
            SUM(allocation_amount),
            0
          ) AS total_allocated

        FROM fund_allocations

        WHERE fiscal_year = $1

        GROUP BY fund_source_id

      ) alloc

        ON alloc.fund_source_id =
           fs.id
    `;


    /*
    |--------------------------------------------------------------------------
    | PAGINATION
    |--------------------------------------------------------------------------
    */

    if (isPagination) {

      const offset =
        (pageNumber - 1) *
        limitNumber;


      const countRes =
        await pool.query(`
          SELECT
            COUNT(*)::INTEGER AS total
          FROM fund_sources
        `);


      const totalItems =
        parseInt(
          countRes.rows[0].total,
          10
        ) || 0;


      const result =
        await pool.query(
          `
          ${baseQuery}

          ORDER BY fs.name ASC

          LIMIT $2
          OFFSET $3
          `,
          [
            selectedYear,
            limitNumber,
            offset
          ]
        );


      const sourceIds =
        result.rows.map(
          row => row.id
        );


      /*
      |--------------------------------------------------------------------------
      | GET CLUSTERS
      |--------------------------------------------------------------------------
      */

      let clusterRows = [];

      if (sourceIds.length > 0) {

        const clusterRes =
          await pool.query(`
            SELECT

              id,
              fund_source_id,
              code,
              name,
              description,
              is_active,
              created_at,
              updated_at

            FROM fund_clusters

            WHERE fund_source_id =
                  ANY($1::INTEGER[])

            ORDER BY name ASC
          `, [sourceIds]);

        clusterRows =
          clusterRes.rows;
      }


      /*
      |--------------------------------------------------------------------------
      | FORMAT
      |--------------------------------------------------------------------------
      */

      const sources =
        result.rows.map(row => {

          const clusters =
            clusterRows
              .filter(
                cluster =>
                  Number(
                    cluster.fund_source_id
                  ) === Number(row.id)
              )
              .map(cluster => ({
                id: cluster.id,
                code: cluster.code,
                name: cluster.name,
                description:
                  cluster.description,

                status:
                  mapStatus(
                    cluster.is_active
                  ),

                is_active:
                  cluster.is_active,

                created_at:
                  cluster.created_at,

                updated_at:
                  cluster.updated_at
              }));


          return {

            id: row.id,

            code: row.code,

            name: row.name,

            description:
              row.description,

            status:
              mapStatus(
                row.is_active
              ),

            is_active:
              row.is_active,

            allocated_amount:
              parseAmount(
                row.allocated_amount
              ),

            /*
            |------------------------------------------------------------------
            | These will be populated later from RBUD/RAOD.
            |------------------------------------------------------------------
            */

            utilized_amount: 0,

            disbursed_amount: 0,

            remaining_balance:
              parseAmount(
                row.allocated_amount
              ),

            fund_clusters:
              clusters,

            created_at:
              row.created_at,

            updated_at:
              row.updated_at
          };
        });


      return res.json({

        sources,

        totalPages:
          Math.ceil(
            totalItems /
            limitNumber
          ) || 1,

        currentPage:
          pageNumber,

        totalItems
      });
    }


    /*
    |--------------------------------------------------------------------------
    | NON-PAGINATED
    |--------------------------------------------------------------------------
    */

    const result =
      await pool.query(
        `
        ${baseQuery}

        ORDER BY fs.name ASC
        `,
        [selectedYear]
      );


    const sourceIds =
      result.rows.map(
        row => row.id
      );


    let clusterRows = [];


    if (sourceIds.length > 0) {

      const clusterRes =
        await pool.query(`
          SELECT

            id,
            fund_source_id,
            code,
            name,
            description,
            is_active,
            created_at,
            updated_at

          FROM fund_clusters

          WHERE fund_source_id =
                ANY($1::INTEGER[])

          ORDER BY name ASC
        `, [sourceIds]);

      clusterRows =
        clusterRes.rows;
    }


    const sources =
      result.rows.map(row => {

        const clusters =
          clusterRows
            .filter(
              cluster =>
                Number(
                  cluster.fund_source_id
                ) === Number(row.id)
            )
            .map(cluster => ({
              id: cluster.id,
              code: cluster.code,
              name: cluster.name,
              description:
                cluster.description,

              status:
                mapStatus(
                  cluster.is_active
                ),

              is_active:
                cluster.is_active,

              created_at:
                cluster.created_at,

              updated_at:
                cluster.updated_at
            }));


        return {

          id: row.id,

          code: row.code,

          name: row.name,

          description:
            row.description,

          status:
            mapStatus(
              row.is_active
            ),

          is_active:
            row.is_active,

          allocated_amount:
            parseAmount(
              row.allocated_amount
            ),

          utilized_amount: 0,

          disbursed_amount: 0,

          remaining_balance:
            parseAmount(
              row.allocated_amount
            ),

          fund_clusters:
            clusters,

          created_at:
            row.created_at,

          updated_at:
            row.updated_at
        };
      });


    res.json(sources);

  } catch (err) {

    console.error(
      'GET Fund Sources Error:',
      err
    );

    res.status(500).json({
      error:
        'Failed to load fund sources.',
      details:
        err.message
    });
  }
});


/*
|--------------------------------------------------------------------------
| GET FUND CLUSTERS
|--------------------------------------------------------------------------
| IMPORTANT:
| This route comes BEFORE /:id
|--------------------------------------------------------------------------
*/

router.get('/:id/clusters', async (req, res) => {

  const id =
    parseId(req.params.id);

  if (!id) {

    return res.status(400).json({
      error:
        'Invalid fund source ID.'
    });
  }


  try {

    /*
    |--------------------------------------------------------------------------
    | CHECK FUND SOURCE
    |--------------------------------------------------------------------------
    */

    const sourceCheck =
      await pool.query(`
        SELECT

          id,
          code,
          name,
          description,
          is_active

        FROM fund_sources

        WHERE id = $1
      `, [id]);


    if (
      sourceCheck.rows.length === 0
    ) {

      return res.status(404).json({
        error:
          'Fund source not found.'
      });
    }


    /*
    |--------------------------------------------------------------------------
    | GET CLUSTERS
    |--------------------------------------------------------------------------
    */

    const result =
      await pool.query(`
        SELECT

          id,
          fund_source_id,
          code,
          name,
          description,
          is_active,
          created_at,
          updated_at

        FROM fund_clusters

        WHERE fund_source_id = $1

        ORDER BY name ASC
      `, [id]);


    const clusters =
      result.rows.map(row => ({
        id: row.id,

        fund_source_id:
          row.fund_source_id,

        code:
          row.code,

        name:
          row.name,

        description:
          row.description,

        status:
          mapStatus(
            row.is_active
          ),

        is_active:
          row.is_active,

        created_at:
          row.created_at,

        updated_at:
          row.updated_at
      }));


    res.json({

      fund_source:
        sourceCheck.rows[0],

      clusters
    });

  } catch (err) {

    console.error(
      'GET Fund Clusters Error:',
      err
    );

    res.status(500).json({
      error:
        'Failed to load fund clusters.',
      details:
        err.message
    });
  }
});


/*
|--------------------------------------------------------------------------
| GET SINGLE FUND SOURCE
|--------------------------------------------------------------------------
| GET /api/fund-sources/:id?year=2026
|--------------------------------------------------------------------------
*/

router.get('/:id', async (req, res) => {

  const id =
    parseId(req.params.id);

  const selectedYear =
    parseYear(req.query.year);


  if (!id) {

    return res.status(400).json({
      error:
        'Invalid fund source ID.'
    });
  }


  try {

    const result =
      await pool.query(`
        SELECT

          fs.id,
          fs.code,
          fs.name,
          fs.description,
          fs.is_active,

          COALESCE(
            alloc.total_allocated,
            0
          ) AS allocated_amount,

          fs.created_at,
          fs.updated_at

        FROM fund_sources fs

        LEFT JOIN (

          SELECT

            fund_source_id,

            COALESCE(
              SUM(allocation_amount),
              0
            ) AS total_allocated

          FROM fund_allocations

          WHERE fiscal_year = $1

          GROUP BY fund_source_id

        ) alloc

          ON alloc.fund_source_id =
             fs.id

        WHERE fs.id = $2
      `, [
        selectedYear,
        id
      ]);


    if (
      result.rows.length === 0
    ) {

      return res.status(404).json({
        error:
          'Fund source not found.'
      });
    }


    const row =
      result.rows[0];


    /*
    |--------------------------------------------------------------------------
    | GET CLUSTERS
    |--------------------------------------------------------------------------
    */

    const clusterRes =
      await pool.query(`
        SELECT

          id,
          fund_source_id,
          code,
          name,
          description,
          is_active,
          created_at,
          updated_at

        FROM fund_clusters

        WHERE fund_source_id = $1

        ORDER BY name ASC
      `, [id]);


    const clusters =
      clusterRes.rows.map(cluster => ({
        id:
          cluster.id,

        fund_source_id:
          cluster.fund_source_id,

        code:
          cluster.code,

        name:
          cluster.name,

        description:
          cluster.description,

        status:
          mapStatus(
            cluster.is_active
          ),

        is_active:
          cluster.is_active,

        created_at:
          cluster.created_at,

        updated_at:
          cluster.updated_at
      }));


    res.json({

      id:
        row.id,

      code:
        row.code,

      name:
        row.name,

      description:
        row.description,

      status:
        mapStatus(
          row.is_active
        ),

      is_active:
        row.is_active,

      allocated_amount:
        parseAmount(
          row.allocated_amount
        ),

      utilized_amount:
        0,

      disbursed_amount:
        0,

      remaining_balance:
        parseAmount(
          row.allocated_amount
        ),

      fund_clusters:
        clusters,

      created_at:
        row.created_at,

      updated_at:
        row.updated_at,

      fiscal_year:
        selectedYear
    });

  } catch (err) {

    console.error(
      'GET Single Fund Source Error:',
      err
    );

    res.status(500).json({
      error:
        'Failed to load fund source.',
      details:
        err.message
    });
  }
});


/*
|--------------------------------------------------------------------------
| CREATE FUND SOURCE
|--------------------------------------------------------------------------
| POST /api/fund-sources
|--------------------------------------------------------------------------
*/

router.post('/', async (req, res) => {

  const {
    code,
    name,
    description,
    status
  } = req.body;


  const cleanCode =
    typeof code === 'string'
      ? code.trim().toUpperCase()
      : '';


  const cleanName =
    typeof name === 'string'
      ? name.trim()
      : '';


  const cleanDescription =
    typeof description === 'string'
      ? description.trim()
      : '';


  if (
    !cleanCode ||
    !cleanName
  ) {

    return res.status(400).json({
      error:
        'Code and name are required.'
    });
  }


  const isActive =
    status !== 'Inactive';


  try {

    /*
    |--------------------------------------------------------------------------
    | DUPLICATE CODE
    |--------------------------------------------------------------------------
    */

    const duplicate =
      await pool.query(`
        SELECT id

        FROM fund_sources

        WHERE UPPER(code) =
              UPPER($1)
      `, [cleanCode]);


    if (
      duplicate.rows.length > 0
    ) {

      return res.status(409).json({
        error:
          'A fund source with this code already exists.'
      });
    }


    /*
    |--------------------------------------------------------------------------
    | INSERT
    |--------------------------------------------------------------------------
    */

    const result =
      await pool.query(`
        INSERT INTO fund_sources (
          code,
          name,
          description,
          is_active
        )

        VALUES (
          $1,
          $2,
          $3,
          $4
        )

        RETURNING
          id,
          code,
          name,
          description,
          is_active,
          created_at,
          updated_at
      `, [
        cleanCode,
        cleanName,
        cleanDescription,
        isActive
      ]);


    const row =
      result.rows[0];


    res.status(201).json({

      id:
        row.id,

      code:
        row.code,

      name:
        row.name,

      description:
        row.description,

      status:
        mapStatus(
          row.is_active
        ),

      is_active:
        row.is_active,

      allocated_amount:
        0,

      utilized_amount:
        0,

      disbursed_amount:
        0,

      remaining_balance:
        0,

      fund_clusters:
        [],

      created_at:
        row.created_at,

      updated_at:
        row.updated_at
    });

  } catch (err) {

    console.error(
      'POST Fund Source Error:',
      err
    );


    if (err.code === '23505') {

      return res.status(409).json({
        error:
          'Fund source code already exists.'
      });
    }


    res.status(500).json({
      error:
        'Failed to create fund source.',
      details:
        err.message
    });
  }
});


/*
|--------------------------------------------------------------------------
| UPDATE FUND SOURCE
|--------------------------------------------------------------------------
| PUT /api/fund-sources/:id
|--------------------------------------------------------------------------
*/

router.put('/:id', async (req, res) => {

  const id =
    parseId(req.params.id);


  if (!id) {

    return res.status(400).json({
      error:
        'Invalid fund source ID.'
    });
  }


  const {
    code,
    name,
    description,
    status
  } = req.body;


  const cleanCode =
    typeof code === 'string'
      ? code.trim().toUpperCase()
      : '';


  const cleanName =
    typeof name === 'string'
      ? name.trim()
      : '';


  const cleanDescription =
    typeof description === 'string'
      ? description.trim()
      : '';


  if (
    !cleanCode ||
    !cleanName
  ) {

    return res.status(400).json({
      error:
        'Code and name are required.'
    });
  }


  const isActive =
    status !== 'Inactive';


  try {

    /*
    |--------------------------------------------------------------------------
    | DUPLICATE CODE
    |--------------------------------------------------------------------------
    */

    const duplicate =
      await pool.query(`
        SELECT id

        FROM fund_sources

        WHERE UPPER(code) =
              UPPER($1)

        AND id <> $2
      `, [
        cleanCode,
        id
      ]);


    if (
      duplicate.rows.length > 0
    ) {

      return res.status(409).json({
        error:
          'Another fund source already uses this code.'
      });
    }


    /*
    |--------------------------------------------------------------------------
    | UPDATE
    |--------------------------------------------------------------------------
    */

    const result =
      await pool.query(`
        UPDATE fund_sources

        SET
          code = $1,
          name = $2,
          description = $3,
          is_active = $4,
          updated_at = CURRENT_TIMESTAMP

        WHERE id = $5

        RETURNING
          id,
          code,
          name,
          description,
          is_active,
          created_at,
          updated_at
      `, [
        cleanCode,
        cleanName,
        cleanDescription,
        isActive,
        id
      ]);


    if (
      result.rows.length === 0
    ) {

      return res.status(404).json({
        error:
          'Fund source not found.'
      });
    }


    const row =
      result.rows[0];


    /*
    |--------------------------------------------------------------------------
    | YEAR
    |--------------------------------------------------------------------------
    */

    const selectedYear =
      parseYear(req.query.year);


    /*
    |--------------------------------------------------------------------------
    | ALLOCATION
    |--------------------------------------------------------------------------
    */

    const allocationRes =
      await pool.query(`
        SELECT

          COALESCE(
            SUM(allocation_amount),
            0
          ) AS total_allocated

        FROM fund_allocations

        WHERE fund_source_id = $1

        AND fiscal_year = $2
      `, [
        id,
        selectedYear
      ]);


    const totalAllocated =
      parseAmount(
        allocationRes.rows[0]
          .total_allocated
      );


    /*
    |--------------------------------------------------------------------------
    | CLUSTERS
    |--------------------------------------------------------------------------
    */

    const clusterRes =
      await pool.query(`
        SELECT

          id,
          fund_source_id,
          code,
          name,
          description,
          is_active,
          created_at,
          updated_at

        FROM fund_clusters

        WHERE fund_source_id = $1

        ORDER BY name ASC
      `, [id]);


    const clusters =
      clusterRes.rows.map(cluster => ({
        id:
          cluster.id,

        fund_source_id:
          cluster.fund_source_id,

        code:
          cluster.code,

        name:
          cluster.name,

        description:
          cluster.description,

        status:
          mapStatus(
            cluster.is_active
          ),

        is_active:
          cluster.is_active,

        created_at:
          cluster.created_at,

        updated_at:
          cluster.updated_at
      }));


    res.json({

      id:
        row.id,

      code:
        row.code,

      name:
        row.name,

      description:
        row.description,

      status:
        mapStatus(
          row.is_active
        ),

      is_active:
        row.is_active,

      allocated_amount:
        totalAllocated,

      utilized_amount:
        0,

      disbursed_amount:
        0,

      remaining_balance:
        totalAllocated,

      fund_clusters:
        clusters,

      created_at:
        row.created_at,

      updated_at:
        row.updated_at,

      fiscal_year:
        selectedYear
    });

  } catch (err) {

    console.error(
      'PUT Fund Source Error:',
      err
    );


    if (err.code === '23505') {

      return res.status(409).json({
        error:
          'Fund source code already exists.'
      });
    }


    res.status(500).json({
      error:
        'Failed to update fund source.',
      details:
        err.message
    });
  }
});


/*
|--------------------------------------------------------------------------
| DELETE FUND SOURCE
|--------------------------------------------------------------------------
| DELETE /api/fund-sources/:id
|--------------------------------------------------------------------------
|
| We protect the fund source from deletion if it is already being used
| by fund clusters or fund allocations.
|
|--------------------------------------------------------------------------
*/

router.delete('/:id', async (req, res) => {

  const id =
    parseId(req.params.id);


  if (!id) {

    return res.status(400).json({
      error:
        'Invalid fund source ID.'
    });
  }


  try {

    /*
    |--------------------------------------------------------------------------
    | CHECK FUND CLUSTERS
    |--------------------------------------------------------------------------
    */

    const clusterCheck =
      await pool.query(`
        SELECT id

        FROM fund_clusters

        WHERE fund_source_id = $1

        LIMIT 1
      `, [id]);


    if (
      clusterCheck.rows.length > 0
    ) {

      return res.status(400).json({
        error:
          'Cannot delete this fund source because it has existing fund clusters.'
      });
    }


    /*
    |--------------------------------------------------------------------------
    | CHECK FUND ALLOCATIONS
    |--------------------------------------------------------------------------
    */

    const allocationCheck =
      await pool.query(`
        SELECT id

        FROM fund_allocations

        WHERE fund_source_id = $1

        LIMIT 1
      `, [id]);


    if (
      allocationCheck.rows.length > 0
    ) {

      return res.status(400).json({
        error:
          'Cannot delete this fund source because it has existing allocations.'
      });
    }


    /*
    |--------------------------------------------------------------------------
    | DELETE
    |--------------------------------------------------------------------------
    */

    const result =
      await pool.query(`
        DELETE FROM fund_sources

        WHERE id = $1

        RETURNING
          id,
          code,
          name
      `, [id]);


    if (
      result.rows.length === 0
    ) {

      return res.status(404).json({
        error:
          'Fund source not found.'
      });
    }


    res.json({

      message:
        'Fund source deleted successfully.',

      deleted:
        result.rows[0]
    });

  } catch (err) {

    console.error(
      'DELETE Fund Source Error:',
      err
    );


    if (err.code === '23503') {

      return res.status(400).json({
        error:
          'Cannot delete this fund source because it is being used by another record.'
      });
    }


    res.status(500).json({
      error:
        'Failed to delete fund source.',
      details:
        err.message
    });
  }
});


/*
|--------------------------------------------------------------------------
| EXPORT
|--------------------------------------------------------------------------
*/

module.exports = router;