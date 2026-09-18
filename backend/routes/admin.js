// ============================================================
// BMAS - ADMIN / USER MANAGEMENT ROUTES
// ============================================================

const express = require('express');
const router = express.Router();

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const pool = require('../db');

const {
  sendAccountApprovedEmail,
  sendAccountRejectedEmail,
  sendAccountDeactivatedEmail,
  sendAccountReactivatedEmail,
  sendPasswordResetEmail,
} = require('../utils/mailer');

const {
  createNotification,
} = require('../utils/notifications');


// ============================================================
// CONSTANTS
// ============================================================

const ALLOWED_STATUSES = [
  'pending',
  'approved',
  'rejected',
  'suspended',
];


// ============================================================
// AUTHENTICATION
// ============================================================

const authenticate = async (
  req,
  res,
  next
) => {

  try {

    const authHeader =
      req.headers.authorization;


    if (
      !authHeader ||
      !authHeader.startsWith('Bearer ')
    ) {

      return res.status(401).json({

        error:
          'Authentication token is required.',

      });

    }


    const token =
      authHeader.substring(7);


    if (!process.env.JWT_SECRET) {

      return res.status(500).json({

        error:
          'JWT_SECRET is not configured.',

      });

    }


    const decoded =
      jwt.verify(
        token,
        process.env.JWT_SECRET
      );


    const result =
      await pool.query(
        `
        SELECT
          id,
          username,
          full_name,
          email,
          role,
          department,
          position,
          status,
          is_active
        FROM users
        WHERE id = $1
        LIMIT 1
        `,
        [decoded.id]
      );


    if (
      result.rows.length === 0
    ) {

      return res.status(401).json({

        error:
          'User account not found.',

      });

    }


    const user =
      result.rows[0];


    const status =
      String(user.status || '')
        .trim()
        .toLowerCase();


    if (
      status !== 'approved' ||
      user.is_active !== true
    ) {

      return res.status(403).json({

        error:
          'Your account is not active.',

      });

    }


    req.user =
      user;


    next();

  } catch (error) {

    console.error(
      'Authentication error:',
      error.message
    );


    if (
      error.name === 'JsonWebTokenError' ||
      error.name === 'TokenExpiredError'
    ) {

      return res.status(401).json({

        error:
          'Invalid or expired authentication token.',

      });

    }


    return res.status(500).json({

      error:
        'Authentication error.',

    });

  }

};


// ============================================================
// ADMIN ONLY
// ============================================================

const requireAdmin = (
  req,
  res,
  next
) => {

  const role =
    String(req.user?.role || '')
      .trim()
      .toLowerCase();


  if (
    role !== 'administrator'
  ) {

    return res.status(403).json({

      error:
        'Administrator privileges are required for this action.',

    });

  }


  next();

};


// ============================================================
// SAFE NOTIFICATION
// ============================================================

const safeNotification = async (
  data
) => {

  try {

    if (
      typeof createNotification === 'function'
    ) {

      await createNotification(data);

    }

  } catch (error) {

    console.error(
      'Notification error:',
      error.message
    );

  }

};


// ============================================================
// SAFE EMAIL
// ============================================================

const safeUserEmail = async (
  callback
) => {

  try {

    if (
      typeof callback === 'function'
    ) {

      await callback();

    }

  } catch (error) {

    console.error(
      'User email notification error:',
      error.message
    );

  }

};


// ============================================================
// GET /api/admin/user-stats
// ============================================================

router.get(
  '/user-stats',
  authenticate,
  async (req, res) => {

    try {

      const result =
        await pool.query(
          `
          SELECT

            COUNT(*)::int AS total,

            COUNT(*) FILTER (
              WHERE LOWER(TRIM(status)) = 'approved'
                AND is_active = TRUE
            )::int AS approved,

            COUNT(*) FILTER (
              WHERE LOWER(TRIM(status)) = 'pending'
            )::int AS pending,

            COUNT(*) FILTER (
              WHERE LOWER(TRIM(status)) = 'rejected'
            )::int AS rejected,

            COUNT(*) FILTER (
              WHERE LOWER(TRIM(status)) = 'suspended'
            )::int AS suspended,

            COUNT(*) FILTER (
              WHERE is_active = FALSE
            )::int AS inactive,

            COUNT(DISTINCT role)::int AS roles

          FROM users
          `
        );


      const stats =
        result.rows[0] || {};


      const total =
        Number(stats.total || 0);

      const approved =
        Number(stats.approved || 0);

      const pending =
        Number(stats.pending || 0);

      const rejected =
        Number(stats.rejected || 0);

      const suspended =
        Number(stats.suspended || 0);

      const inactive =
        Number(stats.inactive || 0);

      const roles =
        Number(stats.roles || 0);


      console.log(
        'User statistics:',
        {
          total,
          approved,
          pending,
          rejected,
          suspended,
          inactive,
          roles,
        }
      );


      return res.json({

        total,

        approved,

        pending,

        rejected,

        suspended,

        inactive,

        roles,

        // Compatibility aliases
        totalUsers:
          total,

        activeUsers:
          approved,

        inactiveUsers:
          inactive,

      });

    } catch (error) {

      console.error(
        'User stats error:',
        error
      );


      return res.status(500).json({

        error:
          'Unable to load user statistics.',

      });

    }

  }
);


// ============================================================
// GET /api/admin/users
// ============================================================

router.get(
  '/users',
  authenticate,
  async (req, res) => {

    const search =
      String(
        req.query.search || ''
      ).trim();


    const role =
      String(
        req.query.role || ''
      ).trim();


    const status =
      String(
        req.query.status || ''
      )
        .trim()
        .toLowerCase();


    let page =
      parseInt(
        req.query.page,
        10
      ) || 1;


    let limit =
      parseInt(
        req.query.limit,
        10
      ) || 8;


    if (page < 1) {
      page = 1;
    }


    if (limit < 1) {
      limit = 8;
    }


    if (limit > 100) {
      limit = 100;
    }


    try {

      const where = [];
      const values = [];

      let index = 1;


      // ------------------------------------------------------
      // SEARCH
      // ------------------------------------------------------

      if (search) {

        where.push(`
          (
            full_name ILIKE $${index}
            OR username ILIKE $${index}
            OR COALESCE(email, '') ILIKE $${index}
            OR COALESCE(department, '') ILIKE $${index}
            OR COALESCE(position, '') ILIKE $${index}
          )
        `);

        values.push(
          `%${search}%`
        );

        index++;

      }


      // ------------------------------------------------------
      // ROLE
      // ------------------------------------------------------

      if (role) {

        where.push(
          `LOWER(TRIM(role)) = LOWER(TRIM($${index}))`
        );

        values.push(
          role
        );

        index++;

      }


      // ------------------------------------------------------
      // STATUS
      // ------------------------------------------------------

      if (status) {

        if (status === 'active') {

          where.push(`
            LOWER(TRIM(status)) = 'approved'
            AND is_active = TRUE
          `);

        } else if (status === 'inactive') {

          where.push(`
            (
              is_active = FALSE
              OR LOWER(TRIM(status)) <> 'approved'
            )
          `);

        } else {

          where.push(
            `LOWER(TRIM(status)) = LOWER(TRIM($${index}))`
          );

          values.push(
            status
          );

          index++;

        }

      }


      const whereClause =
        where.length > 0
          ? `WHERE ${where.join(' AND ')}`
          : '';


      // ------------------------------------------------------
      // COUNT USERS
      // ------------------------------------------------------

      const countResult =
        await pool.query(
          `
          SELECT
            COUNT(*)::int AS count
          FROM users
          ${whereClause}
          `,
          values
        );


      const totalItems =
        Number(
          countResult.rows[0]?.count || 0
        );


      const totalPages =
        Math.max(
          1,
          Math.ceil(
            totalItems / limit
          )
        );


      if (
        page > totalPages
      ) {

        page =
          totalPages;

      }


      const offset =
        (page - 1) * limit;


      // ------------------------------------------------------
      // GET USERS
      // ------------------------------------------------------

      const dataResult =
        await pool.query(
          `
          SELECT

            id,
            full_name,
            username,
            email,
            role,
            department,
            position,
            status,
            is_active,
            last_login,
            created_at,
            updated_at

          FROM users

          ${whereClause}

          ORDER BY
            created_at DESC,
            id DESC

          LIMIT $${index}
          OFFSET $${index + 1}
          `,
          [
            ...values,
            limit,
            offset,
          ]
        );


      const users =
        dataResult.rows;


      console.log(
        `GET /api/admin/users -> ${users.length} users returned`
      );


      // ------------------------------------------------------
      // RESPONSE
      // ------------------------------------------------------
      // "data" is also returned for frontend compatibility.
      // ------------------------------------------------------

      return res.json({

        users,

        data:
          users,

        totalPages,

        currentPage:
          page,

        totalItems,

        page:

          page,

        limit:

          limit,

      });

    } catch (error) {

      console.error(
        'Users list error:',
        error
      );


      return res.status(500).json({

        error:
          'Unable to load users.',

        users:
          [],

        data:
          [],

        totalPages:
          1,

        currentPage:
          1,

        totalItems:
          0,

      });

    }

  }
);


// ============================================================
// POST /api/admin/users
// ADMIN ONLY
// ============================================================

router.post(
  '/users',
  authenticate,
  requireAdmin,
  async (req, res) => {

    const full_name =
      String(
        req.body.full_name || ''
      ).trim();


    const username =
      String(
        req.body.username || ''
      )
        .trim()
        .toLowerCase();


    const email =
      String(
        req.body.email || ''
      )
        .trim()
        .toLowerCase();


    const password =
      req.body.password || '';


    const role =
      String(
        req.body.role || 'Staff'
      ).trim();


    const department =
      String(
        req.body.department || ''
      ).trim();


    const position =
      String(
        req.body.position || ''
      ).trim();


    const requestedStatus =
      String(
        req.body.status || 'pending'
      )
        .trim()
        .toLowerCase();


    if (
      !full_name ||
      !username ||
      !email ||
      !password ||
      !role
    ) {

      return res.status(400).json({

        error:
          'Full name, username, email, password, and role are required.',

      });

    }


    if (
      password.length < 6
    ) {

      return res.status(400).json({

        error:
          'Password must be at least 6 characters.',

      });

    }


    const status =
      ALLOWED_STATUSES.includes(
        requestedStatus
      )
        ? requestedStatus
        : 'pending';


    try {

      const duplicate =
        await pool.query(
          `
          SELECT
            id,
            LOWER(username) = LOWER($1) AS username_match,
            LOWER(email) = LOWER($2) AS email_match
          FROM users
          WHERE
            LOWER(username) = LOWER($1)
            OR LOWER(email) = LOWER($2)
          LIMIT 1
          `,
          [
            username,
            email,
          ]
        );


      if (
        duplicate.rows.length > 0
      ) {

        const row =
          duplicate.rows[0];


        if (
          row.username_match
        ) {

          return res.status(409).json({

            error:
              'Username already exists.',

            code:
              'USERNAME_EXISTS',

          });

        }


        if (
          row.email_match
        ) {

          return res.status(409).json({

            error:
              'Email address is already registered.',

            code:
              'EMAIL_EXISTS',

          });

        }

      }


      const passwordHash =
        await bcrypt.hash(
          password,
          10
        );


      const isActive =
        status === 'approved';


      const result =
        await pool.query(
          `
          INSERT INTO users (
            full_name,
            username,
            email,
            password_hash,
            role,
            department,
            position,
            status,
            is_active,
            created_at,
            updated_at
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            NULLIF($6, ''),
            NULLIF($7, ''),
            $8,
            $9,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
          )
          RETURNING
            id,
            full_name,
            username,
            email,
            role,
            department,
            position,
            status,
            is_active,
            created_at,
            updated_at
          `,
          [
            full_name,
            username,
            email,
            passwordHash,
            role,
            department,
            position,
            status,
            isActive,
          ]
        );


      const newUser =
        result.rows[0];


      await safeNotification({

        recipientRole:
          'Administrator',

        title:
          'User Account Created',

        message:
          `Administrator created a new ${role} account for ${full_name}.`,

        type:
          'user_created',

      });


      return res.status(201).json({

        message:
          'User created successfully.',

        user:
          newUser,

      });

    } catch (error) {

      console.error(
        'Create user error:',
        error
      );


      if (
        error.code === '23505'
      ) {

        return res.status(409).json({

          error:
            'Username or email is already registered.',

        });

      }


      return res.status(500).json({

        error:
          'Unable to create user.',

      });

    }

  }
);


// ============================================================
// PUT /api/admin/users/:id
// ADMIN ONLY
// ============================================================

router.put(
  '/users/:id',
  authenticate,
  requireAdmin,
  async (req, res) => {

    const id =
      req.params.id;


    const full_name =
      String(
        req.body.full_name || ''
      ).trim();


    const email =
      String(
        req.body.email || ''
      )
        .trim()
        .toLowerCase();


    const role =
      String(
        req.body.role || ''
      ).trim();


    const department =
      String(
        req.body.department || ''
      ).trim();


    const position =
      String(
        req.body.position || ''
      ).trim();


    const status =
      String(
        req.body.status || ''
      )
        .trim()
        .toLowerCase();


    if (
      !full_name ||
      !email ||
      !role ||
      !status
    ) {

      return res.status(400).json({

        error:
          'Full name, email, role, and status are required.',

      });

    }


    if (
      !ALLOWED_STATUSES.includes(
        status
      )
    ) {

      return res.status(400).json({

        error:
          'Invalid user status.',

      });

    }


    try {

      const duplicate =
        await pool.query(
          `
          SELECT id
          FROM users
          WHERE
            LOWER(email) = LOWER($1)
            AND id <> $2
          LIMIT 1
          `,
          [
            email,
            id,
          ]
        );


      if (
        duplicate.rows.length > 0
      ) {

        return res.status(409).json({

          error:
            'Email address is already registered to another user.',

          code:
            'EMAIL_EXISTS',

        });

      }


      const isActive =
        status === 'approved';


      const result =
        await pool.query(
          `
          UPDATE users
          SET

            full_name =
              $1,

            email =
              $2,

            role =
              $3,

            department =
              NULLIF($4, ''),

            position =
              NULLIF($5, ''),

            status =
              $6,

            is_active =
              $7,

            updated_at =
              CURRENT_TIMESTAMP

          WHERE id = $8

          RETURNING

            id,
            full_name,
            username,
            email,
            role,
            department,
            position,
            status,
            is_active,
            last_login,
            created_at,
            updated_at
          `,
          [
            full_name,
            email,
            role,
            department,
            position,
            status,
            isActive,
            id,
          ]
        );


      if (
        result.rows.length === 0
      ) {

        return res.status(404).json({

          error:
            'User not found.',

        });

      }


      await safeNotification({

        userId:
          id,

        title:
          'Account Updated',

        message:
          'Your BMAS account information was updated by the Administrator.',

        type:
          'system',

      });


      return res.json(
        result.rows[0]
      );

    } catch (error) {

      console.error(
        'Update user error:',
        error
      );


      return res.status(500).json({

        error:
          'Unable to update user.',

      });

    }

  }
);


// ============================================================
// APPROVE USER
// PUT /api/admin/users/:id/approve
// ============================================================

router.put(
  '/users/:id/approve',
  authenticate,
  requireAdmin,
  async (req, res) => {

    const id =
      req.params.id;


    try {

      const userResult =
        await pool.query(
          `
          SELECT
            id,
            email,
            full_name,
            role,
            status,
            is_active
          FROM users
          WHERE id = $1
          LIMIT 1
          `,
          [id]
        );


      if (
        userResult.rows.length === 0
      ) {

        return res.status(404).json({

          error:
            'User not found.',

        });

      }


      const user =
        userResult.rows[0];


      if (
        String(user.status || '')
          .trim()
          .toLowerCase() === 'approved' &&
        user.is_active === true
      ) {

        return res.status(400).json({

          error:
            'User is already approved and active.',

        });

      }


      const result =
        await pool.query(
          `
          UPDATE users

          SET
            status = 'Approved',
            is_active = TRUE,
            updated_at = CURRENT_TIMESTAMP

          WHERE id = $1

          RETURNING
            id,
            full_name,
            username,
            email,
            role,
            department,
            position,
            status,
            is_active
          `,
          [id]
        );


      // ------------------------------------------------------
      // USER EMAIL ONLY
      // ------------------------------------------------------

      if (user.email) {

        await safeUserEmail(
          async () => {

            await sendAccountApprovedEmail(

              user.email,

              user.full_name

            );

          }
        );

      }


      await safeNotification({

        userId:
          user.id,

        title:
          'Account Approved!',

        message:
          `Congratulations ${user.full_name}, your BMAS account has been approved. You can now log in.`,

        type:
          'approval',

      });


      return res.json({

        message:
          'User approved successfully.',

        user:
          result.rows[0],

      });

    } catch (error) {

      console.error(
        'Approve user error:',
        error
      );


      return res.status(500).json({

        error:
          'Unable to approve user.',

      });

    }

  }
);


// ============================================================
// REJECT USER
// PUT /api/admin/users/:id/reject
// ============================================================

router.put(
  '/users/:id/reject',
  authenticate,
  requireAdmin,
  async (req, res) => {

    const id =
      req.params.id;


    try {

      const userResult =
        await pool.query(
          `
          SELECT
            id,
            email,
            full_name,
            role,
            status,
            is_active
          FROM users
          WHERE id = $1
          LIMIT 1
          `,
          [id]
        );


      if (
        userResult.rows.length === 0
      ) {

        return res.status(404).json({

          error:
            'User not found.',

        });

      }


      const user =
        userResult.rows[0];


      const result =
        await pool.query(
          `
          UPDATE users

          SET
            status = 'Rejected',
            is_active = FALSE,
            updated_at = CURRENT_TIMESTAMP

          WHERE id = $1

          RETURNING
            id,
            full_name,
            username,
            email,
            role,
            department,
            position,
            status,
            is_active
          `,
          [id]
        );


      // USER ONLY
      if (user.email) {

        await safeUserEmail(
          async () => {

            await sendAccountRejectedEmail(

              user.email,

              user.full_name

            );

          }
        );

      }


      await safeNotification({

        userId:
          user.id,

        title:
          'Registration Rejected',

        message:
          'Your BMAS registration has been rejected by the Administrator.',

        type:
          'rejection',

      });


      return res.json({

        message:
          'User rejected successfully.',

        user:
          result.rows[0],

      });

    } catch (error) {

      console.error(
        'Reject user error:',
        error
      );


      return res.status(500).json({

        error:
          'Unable to reject user.',

      });

    }

  }
);


// ============================================================
// DEACTIVATE USER
// PUT /api/admin/users/:id/deactivate
// ============================================================

router.put(
  '/users/:id/deactivate',
  authenticate,
  requireAdmin,
  async (req, res) => {

    const id =
      req.params.id;


    if (
      String(req.user.id) ===
      String(id)
    ) {

      return res.status(400).json({

        error:
          'You cannot deactivate your own Administrator account.',

      });

    }


    try {

      const userResult =
        await pool.query(
          `
          SELECT
            id,
            email,
            full_name,
            role
          FROM users
          WHERE id = $1
          LIMIT 1
          `,
          [id]
        );


      if (
        userResult.rows.length === 0
      ) {

        return res.status(404).json({

          error:
            'User not found.',

        });

      }


      const user =
        userResult.rows[0];


      const result =
        await pool.query(
          `
          UPDATE users

          SET
            status = 'Suspended',
            is_active = FALSE,
            updated_at = CURRENT_TIMESTAMP

          WHERE id = $1

          RETURNING
            id,
            full_name,
            username,
            email,
            role,
            department,
            position,
            status,
            is_active
          `,
          [id]
        );


      // USER ONLY
      if (user.email) {

        await safeUserEmail(
          async () => {

            await sendAccountDeactivatedEmail(

              user.email,

              user.full_name

            );

          }
        );

      }


      await safeNotification({

        userId:
          id,

        title:
          'Account Deactivated',

        message:
          'Your BMAS account has been deactivated by the Administrator.',

        type:
          'system',

      });


      return res.json({

        message:
          'User deactivated successfully.',

        user:
          result.rows[0],

      });

    } catch (error) {

      console.error(
        'Deactivate user error:',
        error
      );


      return res.status(500).json({

        error:
          'Unable to deactivate user.',

      });

    }

  }
);


// ============================================================
// REACTIVATE USER
// PUT /api/admin/users/:id/reactivate
// ============================================================

router.put(
  '/users/:id/reactivate',
  authenticate,
  requireAdmin,
  async (req, res) => {

    const id =
      req.params.id;


    try {

      const userResult =
        await pool.query(
          `
          SELECT
            id,
            email,
            full_name,
            role
          FROM users
          WHERE id = $1
          LIMIT 1
          `,
          [id]
        );


      if (
        userResult.rows.length === 0
      ) {

        return res.status(404).json({

          error:
            'User not found.',

        });

      }


      const user =
        userResult.rows[0];


      const result =
        await pool.query(
          `
          UPDATE users

          SET
            status = 'Approved',
            is_active = TRUE,
            updated_at = CURRENT_TIMESTAMP

          WHERE id = $1

          RETURNING
            id,
            full_name,
            username,
            email,
            role,
            department,
            position,
            status,
            is_active
          `,
          [id]
        );


      // USER ONLY
      if (user.email) {

        await safeUserEmail(
          async () => {

            await sendAccountReactivatedEmail(

              user.email,

              user.full_name

            );

          }
        );

      }


      await safeNotification({

        userId:
          id,

        title:
          'Account Reactivated',

        message:
          'Your BMAS account has been reactivated by the Administrator.',

        type:
          'system',

      });


      return res.json({

        message:
          'User reactivated successfully.',

        user:
          result.rows[0],

      });

    } catch (error) {

      console.error(
        'Reactivate user error:',
        error
      );


      return res.status(500).json({

        error:
          'Unable to reactivate user.',

      });

    }

  }
);


// ============================================================
// RESET PASSWORD
// PUT /api/admin/users/:id/reset-password
// ============================================================

router.put(
  '/users/:id/reset-password',
  authenticate,
  requireAdmin,
  async (req, res) => {

    const id =
      req.params.id;


    const newPassword =
      req.body.newPassword || '';


    if (
      newPassword.length < 6
    ) {

      return res.status(400).json({

        error:
          'Password must be at least 6 characters.',

      });

    }


    try {

      const userResult =
        await pool.query(
          `
          SELECT
            id,
            email,
            full_name,
            username
          FROM users
          WHERE id = $1
          LIMIT 1
          `,
          [id]
        );


      if (
        userResult.rows.length === 0
      ) {

        return res.status(404).json({

          error:
            'User not found.',

        });

      }


      const user =
        userResult.rows[0];


      const passwordHash =
        await bcrypt.hash(
          newPassword,
          10
        );


      const result =
        await pool.query(
          `
          UPDATE users

          SET
            password_hash = $1,
            updated_at = CURRENT_TIMESTAMP

          WHERE id = $2

          RETURNING
            id,
            full_name,
            username
          `,
          [
            passwordHash,
            id,
          ]
        );


      // USER ONLY
      if (user.email) {

        await safeUserEmail(
          async () => {

            await sendPasswordResetEmail(

              user.email,

              user.full_name

            );

          }
        );

      }


      await safeNotification({

        userId:
          id,

        title:
          'Password Reset',

        message:
          'Your BMAS account password has been reset by the Administrator.',

        type:
          'security',

      });


      return res.json({

        message:
          'Password reset successfully.',

        user:
          result.rows[0],

      });

    } catch (error) {

      console.error(
        'Reset password error:',
        error
      );


      return res.status(500).json({

        error:
          'Unable to reset password.',

      });

    }

  }
);


// ============================================================
// DELETE USER
// ============================================================

router.delete(
  '/users/:id',
  authenticate,
  requireAdmin,
  async (req, res) => {

    const id =
      req.params.id;


    if (
      String(req.user.id) ===
      String(id)
    ) {

      return res.status(400).json({

        error:
          'You cannot delete your own Administrator account.',

      });

    }


    try {

      const result =
        await pool.query(
          `
          DELETE FROM users

          WHERE id = $1

          RETURNING
            id,
            full_name,
            username
          `,
          [id]
        );


      if (
        result.rows.length === 0
      ) {

        return res.status(404).json({

          error:
            'User not found.',

        });

      }


      return res.json({

        message:
          'User deleted successfully.',

        user:
          result.rows[0],

      });

    } catch (error) {

      console.error(
        'Delete user error:',
        error
      );


      return res.status(500).json({

        error:
          'Unable to delete user.',

      });

    }

  }
);


// ============================================================
// GET /api/admin/notifications
// ============================================================

router.get(
  '/notifications',
  authenticate,
  async (req, res) => {

    const userId =
      req.user.id;

    const role =
      req.user.role;


    try {

      const result =
        await pool.query(
          `
          SELECT

            id,
            user_id,
            recipient_role,
            title,
            message,
            type,
            is_read,
            created_at

          FROM notifications

          WHERE

            (
              user_id = $1
              OR recipient_role = $2
              OR recipient_role = 'ALL'
              OR user_id IS NULL
            )

          ORDER BY
            created_at DESC

          LIMIT 30
          `,
          [
            userId,
            role,
          ]
        );


      return res.json(
        result.rows
      );

    } catch (error) {

      console.error(
        'Fetch notifications error:',
        error
      );


      return res.status(500).json({

        error:
          'Unable to load notifications.',

      });

    }

  }
);


// ============================================================
// PUT /api/admin/notifications/mark-read
// ============================================================

router.put(
  '/notifications/mark-read',
  authenticate,
  async (req, res) => {

    try {

      await pool.query(
        `
        UPDATE notifications

        SET
          is_read = TRUE

        WHERE

          (
            user_id = $1
            OR recipient_role = $2
            OR recipient_role = 'ALL'
            OR user_id IS NULL
          )
        `,
        [
          req.user.id,
          req.user.role,
        ]
      );


      return res.json({

        message:
          'Notifications marked as read.',

      });

    } catch (error) {

      console.error(
        'Mark notifications read error:',
        error
      );


      return res.status(500).json({

        error:
          'Unable to mark notifications as read.',

      });

    }

  }
);


// ============================================================
// EXPORT
// ============================================================

module.exports = router;