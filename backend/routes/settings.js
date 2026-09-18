// ============================================================
// BMAS - SETTINGS ROUTES
// System Settings + User Preferences
// Compatible with current PostgreSQL schema
// ============================================================

const express = require('express');
const router = express.Router();

const pool = require('../db');

const {
  verifyToken,
  verifyAdmin,
} = require('../middleware/auth');


// ============================================================
// DEFAULT USER PREFERENCES
// ============================================================

const DEFAULT_PREFERENCES = {
  items_per_page: 10,
  theme: 'Light',
  sidebar_position: 'Fixed',
  dashboard_overview: true,
  auto_logout_minutes: 30,
  confirm_before_delete: true,
  enable_animations: true,
};


// ============================================================
// GET /api/settings/general
// ============================================================
// Administrator only
//
// Returns:
//   settings      -> system-wide settings
//   preferences   -> current logged-in user's preferences
//
// ============================================================

router.get('/general', verifyToken, async (req, res) => {

  try {

    // ----------------------------------------------------------
    // Verify Administrator
    // ----------------------------------------------------------

    if (
      String(req.user.role || '').toLowerCase()
      !== 'administrator'
    ) {

      return res.status(403).json({
        message:
          'Access Restricted to Administrator only',
      });

    }


    // ----------------------------------------------------------
    // Get system settings
    // ----------------------------------------------------------

    const settingsResult = await pool.query(`
      SELECT
        id,
        system_name,
        system_acronym,
        institution,
        default_fiscal_year,
        default_date_format,
        default_timezone,
        currency_code,
        currency_symbol,
        created_at,
        updated_at
      FROM settings
      ORDER BY id ASC
      LIMIT 1
    `);


    // ----------------------------------------------------------
    // Get current user's preferences
    // ----------------------------------------------------------

    const preferencesResult = await pool.query(`
      SELECT
        id,
        user_id,
        items_per_page,
        theme,
        sidebar_position,
        dashboard_overview,
        auto_logout_minutes,
        confirm_before_delete,
        enable_animations,
        created_at,
        updated_at
      FROM preferences
      WHERE user_id = $1
      LIMIT 1
    `, [req.user.id]);


    // ----------------------------------------------------------
    // Automatic default preferences
    // ----------------------------------------------------------

    let preferences;

    if (preferencesResult.rows.length === 0) {

      const insertResult = await pool.query(`
        INSERT INTO preferences (
          user_id,
          items_per_page,
          theme,
          sidebar_position,
          dashboard_overview,
          auto_logout_minutes,
          confirm_before_delete,
          enable_animations,
          created_at,
          updated_at
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8,
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        )
        RETURNING
          id,
          user_id,
          items_per_page,
          theme,
          sidebar_position,
          dashboard_overview,
          auto_logout_minutes,
          confirm_before_delete,
          enable_animations,
          created_at,
          updated_at
      `, [
        req.user.id,
        DEFAULT_PREFERENCES.items_per_page,
        DEFAULT_PREFERENCES.theme,
        DEFAULT_PREFERENCES.sidebar_position,
        DEFAULT_PREFERENCES.dashboard_overview,
        DEFAULT_PREFERENCES.auto_logout_minutes,
        DEFAULT_PREFERENCES.confirm_before_delete,
        DEFAULT_PREFERENCES.enable_animations,
      ]);

      preferences = insertResult.rows[0];

    } else {

      preferences = preferencesResult.rows[0];

    }


    // ----------------------------------------------------------
    // Response
    // ----------------------------------------------------------

    return res.status(200).json({

      settings:
        settingsResult.rows[0] || null,

      preferences,

    });

  } catch (error) {

    console.error(
      'GET /settings/general error:',
      error
    );

    return res.status(500).json({
      message:
        'Server error while loading settings.',
    });

  }

});


// ============================================================
// PUT /api/settings/general
// ============================================================
// Administrator only
//
// Updates BOTH:
//   1. system-wide settings
//   2. current administrator's preferences
//
// ============================================================

router.put('/general', verifyToken, async (req, res) => {

  try {

    // ----------------------------------------------------------
    // Verify Administrator
    // ----------------------------------------------------------

    if (
      String(req.user.role || '').toLowerCase()
      !== 'administrator'
    ) {

      return res.status(403).json({
        message:
          'Access Restricted to Administrator only',
      });

    }


    const {
      system_name,
      system_acronym,
      institution,
      default_fiscal_year,
      default_date_format,
      default_timezone,
      currency_code,
      currency_symbol,

      items_per_page,
      theme,
      sidebar_position,
      dashboard_overview,
      auto_logout_minutes,
      confirm_before_delete,
      enable_animations,

    } = req.body;


    // ----------------------------------------------------------
    // Basic validation
    // ----------------------------------------------------------

    if (
      !system_name ||
      !institution ||
      !default_fiscal_year ||
      !default_date_format ||
      !default_timezone ||
      !currency_code ||
      !currency_symbol
    ) {

      return res.status(400).json({
        message:
          'Required system settings are missing.',
      });

    }


    // ----------------------------------------------------------
    // Transaction
    // ----------------------------------------------------------

    const client = await pool.connect();

    try {

      await client.query('BEGIN');


      // ========================================================
      // UPDATE SYSTEM SETTINGS
      // ========================================================

      const settingsResult = await client.query(`
        UPDATE settings
        SET
          system_name = $1,
          system_acronym = $2,
          institution = $3,
          default_fiscal_year = $4,
          default_date_format = $5,
          default_timezone = $6,
          currency_code = $7,
          currency_symbol = $8,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = (
          SELECT id
          FROM settings
          ORDER BY id ASC
          LIMIT 1
        )
        RETURNING
          id,
          system_name,
          system_acronym,
          institution,
          default_fiscal_year,
          default_date_format,
          default_timezone,
          currency_code,
          currency_symbol,
          created_at,
          updated_at
      `, [
        system_name,
        system_acronym || 'BMAS',
        institution,
        parseInt(default_fiscal_year, 10),
        default_date_format,
        default_timezone,
        currency_code,
        currency_symbol,
      ]);


      // --------------------------------------------------------
      // If settings table is empty, create initial settings
      // --------------------------------------------------------

      let settings;

      if (settingsResult.rows.length === 0) {

        const insertSettingsResult = await client.query(`
          INSERT INTO settings (
            system_name,
            system_acronym,
            institution,
            default_fiscal_year,
            default_date_format,
            default_timezone,
            currency_code,
            currency_symbol,
            created_at,
            updated_at
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
          )
          RETURNING
            id,
            system_name,
            system_acronym,
            institution,
            default_fiscal_year,
            default_date_format,
            default_timezone,
            currency_code,
            currency_symbol,
            created_at,
            updated_at
        `, [
          system_name,
          system_acronym || 'BMAS',
          institution,
          parseInt(default_fiscal_year, 10),
          default_date_format,
          default_timezone,
          currency_code,
          currency_symbol,
        ]);

        settings =
          insertSettingsResult.rows[0];

      } else {

        settings =
          settingsResult.rows[0];

      }


      // ========================================================
      // USER PREFERENCES
      // ========================================================

      const existingPreferences =
        await client.query(`
          SELECT id
          FROM preferences
          WHERE user_id = $1
          LIMIT 1
        `, [req.user.id]);


      let preferences;


      // --------------------------------------------------------
      // UPDATE EXISTING PREFERENCES
      // --------------------------------------------------------

      if (existingPreferences.rows.length > 0) {

        const preferenceUpdate =
          await client.query(`
            UPDATE preferences
            SET
              items_per_page = $1,
              theme = $2,
              sidebar_position = $3,
              dashboard_overview = $4,
              auto_logout_minutes = $5,
              confirm_before_delete = $6,
              enable_animations = $7,
              updated_at = CURRENT_TIMESTAMP
            WHERE user_id = $8
            RETURNING
              id,
              user_id,
              items_per_page,
              theme,
              sidebar_position,
              dashboard_overview,
              auto_logout_minutes,
              confirm_before_delete,
              enable_animations,
              created_at,
              updated_at
          `, [
            parseInt(items_per_page, 10)
              || DEFAULT_PREFERENCES.items_per_page,

            theme ||
              DEFAULT_PREFERENCES.theme,

            sidebar_position ||
              DEFAULT_PREFERENCES.sidebar_position,

            typeof dashboard_overview === 'boolean'
              ? dashboard_overview
              : DEFAULT_PREFERENCES.dashboard_overview,

            parseInt(auto_logout_minutes, 10)
              || DEFAULT_PREFERENCES.auto_logout_minutes,

            typeof confirm_before_delete === 'boolean'
              ? confirm_before_delete
              : DEFAULT_PREFERENCES.confirm_before_delete,

            typeof enable_animations === 'boolean'
              ? enable_animations
              : DEFAULT_PREFERENCES.enable_animations,

            req.user.id,
          ]);


        preferences =
          preferenceUpdate.rows[0];

      }


      // --------------------------------------------------------
      // CREATE DEFAULT PREFERENCES
      // --------------------------------------------------------

      else {

        const preferenceInsert =
          await client.query(`
            INSERT INTO preferences (
              user_id,
              items_per_page,
              theme,
              sidebar_position,
              dashboard_overview,
              auto_logout_minutes,
              confirm_before_delete,
              enable_animations,
              created_at,
              updated_at
            )
            VALUES (
              $1,
              $2,
              $3,
              $4,
              $5,
              $6,
              $7,
              $8,
              CURRENT_TIMESTAMP,
              CURRENT_TIMESTAMP
            )
            RETURNING
              id,
              user_id,
              items_per_page,
              theme,
              sidebar_position,
              dashboard_overview,
              auto_logout_minutes,
              confirm_before_delete,
              enable_animations,
              created_at,
              updated_at
          `, [
            req.user.id,
            parseInt(items_per_page, 10)
              || DEFAULT_PREFERENCES.items_per_page,
            theme ||
              DEFAULT_PREFERENCES.theme,
            sidebar_position ||
              DEFAULT_PREFERENCES.sidebar_position,
            typeof dashboard_overview === 'boolean'
              ? dashboard_overview
              : DEFAULT_PREFERENCES.dashboard_overview,
            parseInt(auto_logout_minutes, 10)
              || DEFAULT_PREFERENCES.auto_logout_minutes,
            typeof confirm_before_delete === 'boolean'
              ? confirm_before_delete
              : DEFAULT_PREFERENCES.confirm_before_delete,
            typeof enable_animations === 'boolean'
              ? enable_animations
              : DEFAULT_PREFERENCES.enable_animations,
          ]);

        preferences =
          preferenceInsert.rows[0];

      }


      await client.query('COMMIT');


      // --------------------------------------------------------
      // Response
      // --------------------------------------------------------

      return res.status(200).json({

        message:
          'Settings saved successfully.',

        settings,

        preferences,

      });

    } catch (transactionError) {

      await client.query('ROLLBACK');

      throw transactionError;

    } finally {

      client.release();

    }

  } catch (error) {

    console.error(
      'PUT /settings/general error:',
      error
    );

    return res.status(500).json({
      message:
        'Server error while saving settings.',
    });

  }

});


// ============================================================
// GET /api/settings/preferences
// ============================================================
// Any authenticated user
// ============================================================

router.get('/preferences', verifyToken, async (req, res) => {

  try {

    const result = await pool.query(`
      SELECT
        id,
        user_id,
        items_per_page,
        theme,
        sidebar_position,
        dashboard_overview,
        auto_logout_minutes,
        confirm_before_delete,
        enable_animations,
        created_at,
        updated_at
      FROM preferences
      WHERE user_id = $1
      LIMIT 1
    `, [req.user.id]);


    // ----------------------------------------------------------
    // Automatic defaults
    // ----------------------------------------------------------

    if (result.rows.length === 0) {

      const insertResult = await pool.query(`
        INSERT INTO preferences (
          user_id,
          items_per_page,
          theme,
          sidebar_position,
          dashboard_overview,
          auto_logout_minutes,
          confirm_before_delete,
          enable_animations,
          created_at,
          updated_at
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8,
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        )
        RETURNING
          id,
          user_id,
          items_per_page,
          theme,
          sidebar_position,
          dashboard_overview,
          auto_logout_minutes,
          confirm_before_delete,
          enable_animations,
          created_at,
          updated_at
      `, [
        req.user.id,
        DEFAULT_PREFERENCES.items_per_page,
        DEFAULT_PREFERENCES.theme,
        DEFAULT_PREFERENCES.sidebar_position,
        DEFAULT_PREFERENCES.dashboard_overview,
        DEFAULT_PREFERENCES.auto_logout_minutes,
        DEFAULT_PREFERENCES.confirm_before_delete,
        DEFAULT_PREFERENCES.enable_animations,
      ]);

      return res.status(200).json({
        preferences:
          insertResult.rows[0],
      });

    }


    return res.status(200).json({
      preferences:
        result.rows[0],
    });

  } catch (error) {

    console.error(
      'GET /settings/preferences error:',
      error
    );

    return res.status(500).json({
      message:
        'Server error while loading user preferences.',
    });

  }

});


// ============================================================
// PUT /api/settings/preferences
// ============================================================
// Any authenticated user
// ============================================================

router.put('/preferences', verifyToken, async (req, res) => {

  try {

    const {
      items_per_page,
      theme,
      sidebar_position,
      dashboard_overview,
      auto_logout_minutes,
      confirm_before_delete,
      enable_animations,
    } = req.body;


    const result = await pool.query(`
      INSERT INTO preferences (
        user_id,
        items_per_page,
        theme,
        sidebar_position,
        dashboard_overview,
        auto_logout_minutes,
        confirm_before_delete,
        enable_animations,
        created_at,
        updated_at
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
      ON CONFLICT (user_id)
      DO UPDATE SET
        items_per_page = EXCLUDED.items_per_page,
        theme = EXCLUDED.theme,
        sidebar_position = EXCLUDED.sidebar_position,
        dashboard_overview = EXCLUDED.dashboard_overview,
        auto_logout_minutes = EXCLUDED.auto_logout_minutes,
        confirm_before_delete = EXCLUDED.confirm_before_delete,
        enable_animations = EXCLUDED.enable_animations,
        updated_at = CURRENT_TIMESTAMP
      RETURNING
        id,
        user_id,
        items_per_page,
        theme,
        sidebar_position,
        dashboard_overview,
        auto_logout_minutes,
        confirm_before_delete,
        enable_animations,
        created_at,
        updated_at
    `, [
      req.user.id,

      parseInt(items_per_page, 10)
        || DEFAULT_PREFERENCES.items_per_page,

      theme ||
        DEFAULT_PREFERENCES.theme,

      sidebar_position ||
        DEFAULT_PREFERENCES.sidebar_position,

      typeof dashboard_overview === 'boolean'
        ? dashboard_overview
        : DEFAULT_PREFERENCES.dashboard_overview,

      parseInt(auto_logout_minutes, 10)
        || DEFAULT_PREFERENCES.auto_logout_minutes,

      typeof confirm_before_delete === 'boolean'
        ? confirm_before_delete
        : DEFAULT_PREFERENCES.confirm_before_delete,

      typeof enable_animations === 'boolean'
        ? enable_animations
        : DEFAULT_PREFERENCES.enable_animations,
    ]);


    return res.status(200).json({

      message:
        'User preferences saved successfully.',

      preferences:
        result.rows[0],

    });

  } catch (error) {

    console.error(
      'PUT /settings/preferences error:',
      error
    );

    return res.status(500).json({
      message:
        'Server error while saving user preferences.',
    });

  }

});


// ============================================================
// GET /api/settings/system-information
// ============================================================
// Administrator only
// ============================================================

router.get(
  '/system-information',
  verifyToken,
  verifyAdmin,
  async (req, res) => {

    try {

      const result = await pool.query(`
        SELECT
          system_name,
          system_acronym,
          institution,
          default_fiscal_year,
          default_date_format,
          default_timezone,
          currency_code,
          currency_symbol
        FROM settings
        ORDER BY id ASC
        LIMIT 1
      `);


      return res.status(200).json({

        system:
          result.rows[0] || null,

        server: {
          node_version:
            process.version,

          environment:
            process.env.NODE_ENV || 'development',

        },

      });

    } catch (error) {

      console.error(
        'GET /settings/system-information error:',
        error
      );

      return res.status(500).json({
        message:
          'Server error while loading system information.',
      });

    }

  }
);


// ============================================================
// EXPORT
// ============================================================

module.exports = router;