// ============================================================
// BMAS - AUTHENTICATION ROUTES
// Login, Registration and Account Approval Status Handling
// ============================================================

const express = require('express');
const router = express.Router();

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const pool = require('../db');

const {
  sendRegistrationPendingEmail,
  sendNewRegistrationAdminEmail,
} = require('../utils/mailer');

const {
  createNotification,
} = require('../utils/notifications');


// ============================================================
// HELPERS
// ============================================================

function normalize(value) {
  return typeof value === 'string'
    ? value.trim()
    : '';
}

function normalizeUsername(value) {
  return normalize(value).toLowerCase();
}

function normalizeEmail(value) {
  return normalize(value).toLowerCase();
}


// ============================================================
// PUBLIC REGISTRATION ROLES
// ============================================================
// Public registration is limited to these three roles.
// Administrator accounts are not created through this page.
// ============================================================

const PUBLIC_REGISTRATION_ROLES = {
  'budget officer': 'Budget Officer',
  'accountant': 'Accountant',
  'staff': 'Staff',
};


// ============================================================
// ADMIN EMAIL RECIPIENT
// ============================================================
// ADMIN_EMAIL is the official recipient for new registrations.
//
// Optional:
// ADMIN_EMAILS=email1@gmail.com,email2@gmail.com
//
// If ADMIN_EMAILS exists, all listed administrators receive
// the New User Registration email.
// ============================================================

function getAdministratorEmails() {

  const emails = [];

  if (process.env.ADMIN_EMAIL) {

    emails.push(
      ...process.env.ADMIN_EMAIL
        .split(',')
        .map(email => email.trim().toLowerCase())
        .filter(Boolean)
    );

  }

  if (process.env.ADMIN_EMAILS) {

    emails.push(
      ...process.env.ADMIN_EMAILS
        .split(',')
        .map(email => email.trim().toLowerCase())
        .filter(Boolean)
    );

  }

  return [
    ...new Set(emails)
  ];

}


// ============================================================
// POST /api/auth/login
// ============================================================

router.post('/login', async (req, res) => {

  const username =
    normalizeUsername(req.body.username);

  const password =
    req.body.password || '';


  if (!username || !password) {

    return res.status(400).json({
      message:
        'Username and password are required.',
    });

  }


  try {

    const result =
      await pool.query(
        `
        SELECT
          id,
          username,
          password_hash,
          full_name,
          email,
          role,
          department,
          position,
          status,
          is_active
        FROM users
        WHERE LOWER(username) = $1
        LIMIT 1
        `,
        [username]
      );


    if (result.rows.length === 0) {

      return res.status(401).json({
        message:
          'Invalid username or password.',
      });

    }


    const user =
      result.rows[0];


    const status =
      String(user.status || '')
        .trim()
        .toLowerCase();


    // --------------------------------------------------------
    // PENDING
    // --------------------------------------------------------

    if (status === 'pending') {

      return res.status(403).json({

        message:
          'Your account is still pending approval. Please wait for the Administrator to approve your registration.',

        code:
          'ACCOUNT_PENDING',

      });

    }


    // --------------------------------------------------------
    // REJECTED
    // --------------------------------------------------------

    if (status === 'rejected') {

      return res.status(403).json({

        message:
          'Your registration has been rejected. Please contact the Administrator.',

        code:
          'ACCOUNT_REJECTED',

      });

    }


    // --------------------------------------------------------
    // SUSPENDED
    // --------------------------------------------------------

    if (status === 'suspended') {

      return res.status(403).json({

        message:
          'Your account has been deactivated. Please contact the Administrator.',

        code:
          'ACCOUNT_SUSPENDED',

      });

    }


    // --------------------------------------------------------
    // ONLY APPROVED USERS
    // --------------------------------------------------------

    if (status !== 'approved') {

      return res.status(403).json({

        message:
          'Your account is not approved for login. Please contact the Administrator.',

        code:
          'ACCOUNT_NOT_APPROVED',

      });

    }


    // --------------------------------------------------------
    // ACTIVE
    // --------------------------------------------------------

    if (user.is_active !== true) {

      return res.status(403).json({

        message:
          'Your account is inactive. Please contact the Administrator.',

        code:
          'ACCOUNT_INACTIVE',

      });

    }


    // --------------------------------------------------------
    // PASSWORD
    // --------------------------------------------------------

    const passwordMatch =
      await bcrypt.compare(
        password,
        user.password_hash
      );


    if (!passwordMatch) {

      return res.status(401).json({
        message:
          'Invalid username or password.',
      });

    }


    // --------------------------------------------------------
    // LAST LOGIN
    // --------------------------------------------------------

    await pool.query(
      `
      UPDATE users
      SET
        last_login = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      `,
      [user.id]
    );


    // --------------------------------------------------------
    // JWT
    // --------------------------------------------------------

    if (!process.env.JWT_SECRET) {

      console.error(
        'JWT_SECRET is not configured.'
      );

      return res.status(500).json({
        message:
          'Server configuration error.',
      });

    }


    const token =
      jwt.sign(

        {
          id:
            user.id,

          username:
            user.username,

          role:
            user.role,

          full_name:
            user.full_name,
        },

        process.env.JWT_SECRET,

        {
          expiresIn:
            '8h',
        }

      );


    return res.status(200).json({

      message:
        'Login successful.',

      token,

      user: {

        id:
          user.id,

        username:
          user.username,

        full_name:
          user.full_name,

        email:
          user.email,

        role:
          user.role,

        department:
          user.department,

        position:
          user.position,

        status:
          user.status,

        is_active:
          user.is_active,

      },

    });

  } catch (error) {

    console.error(
      'Login error:',
      error
    );

    return res.status(500).json({
      message:
        'Server error while processing login.',
    });

  }

});


// ============================================================
// POST /api/auth/register
// ============================================================

router.post('/register', async (req, res) => {

  const username =
    normalizeUsername(
      req.body.username
    );

  const password =
    req.body.password || '';

  const full_name =
    normalize(
      req.body.full_name
    );

  const email =
    normalizeEmail(
      req.body.email
    );

  let role =
    normalize(
      req.body.role
    ) || 'Staff';

  const department =
    normalize(
      req.body.department
    );

  const position =
    normalize(
      req.body.position
    );


  // ----------------------------------------------------------
  // REQUIRED FIELDS
  // ----------------------------------------------------------

  if (
    !username ||
    !password ||
    !full_name
  ) {

    return res.status(400).json({

      message:
        'Username, password, and full name are required.',

    });

  }


  // ----------------------------------------------------------
  // EMAIL
  // ----------------------------------------------------------

  if (!email) {

    return res.status(400).json({

      message:
        'Email is required.',

      code:
        'EMAIL_REQUIRED',

    });

  }

  // Accept normal email addresses from any provider.
  // There is no @uoa.edu.ph-only restriction.
  const emailPattern =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(email)) {

    return res.status(400).json({

      message:
        'Please provide a valid email address.',

      code:
        'INVALID_EMAIL',

    });

  }


  // ----------------------------------------------------------
  // USERNAME
  // ----------------------------------------------------------

  if (username.length < 3) {

    return res.status(400).json({

      message:
        'Username must contain at least 3 characters.',

    });

  }


  // ----------------------------------------------------------
  // PASSWORD
  // ----------------------------------------------------------

  if (password.length < 6) {

    return res.status(400).json({

      message:
        'Password must contain at least 6 characters.',

    });

  }


  // ----------------------------------------------------------
  // PUBLIC REGISTRATION ROLE VALIDATION
  // ----------------------------------------------------------
  // Only Budget Officer, Accountant, and Staff can register
  // through the public registration page.

  const requestedRole =
    normalize(role).toLowerCase();

  const canonicalRole =
    PUBLIC_REGISTRATION_ROLES[requestedRole];

  if (!canonicalRole) {

    return res.status(400).json({

      message:
        'Invalid role requested. You may register only as Budget Officer, Accountant, or Staff.',

      code:
        'INVALID_REGISTRATION_ROLE',

    });

  }

  // Store one consistent role value in the database.
  role = canonicalRole;


  try {

    // --------------------------------------------------------
    // DUPLICATE USERNAME
    // --------------------------------------------------------

    const usernameResult =
      await pool.query(
        `
        SELECT id
        FROM users
        WHERE LOWER(username) = $1
        LIMIT 1
        `,
        [username]
      );


    if (
      usernameResult.rows.length > 0
    ) {

      return res.status(409).json({

        message:
          'Username already exists.',

        code:
          'USERNAME_EXISTS',

      });

    }


    // --------------------------------------------------------
    // DUPLICATE EMAIL
    // --------------------------------------------------------

    if (email) {

      const emailResult =
        await pool.query(
          `
          SELECT id
          FROM users
          WHERE LOWER(email) = $1
          LIMIT 1
          `,
          [email]
        );


      if (
        emailResult.rows.length > 0
      ) {

        return res.status(409).json({

          message:
            'Email address is already registered.',

          code:
            'EMAIL_EXISTS',

        });

      }

    }


    // --------------------------------------------------------
    // PASSWORD HASH
    // --------------------------------------------------------

    const passwordHash =
      await bcrypt.hash(
        password,
        10
      );


    // --------------------------------------------------------
    // CREATE PENDING USER
    // --------------------------------------------------------

    const result =
      await pool.query(
        `
        INSERT INTO users (
          username,
          password_hash,
          full_name,
          email,
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
          NULLIF($4, ''),
          $5,
          NULLIF($6, ''),
          NULLIF($7, ''),
          'Pending',
          FALSE,
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        )
        RETURNING
          id,
          username,
          full_name,
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
          username,
          passwordHash,
          full_name,
          email,
          role,
          department,
          position,
        ]
      );


    const newUser =
      result.rows[0];


    console.log(
      `✅ New BMAS registration created: ${newUser.username}`
    );

    console.log(
      `   User email: ${newUser.email || 'none'}`
    );

    console.log(
      `   Status: ${newUser.status}`
    );


    // ========================================================
    // EMAIL #1
    // USER ONLY
    // REGISTRATION PENDING
    // ========================================================

    if (newUser.email) {

      try {

        await sendRegistrationPendingEmail(

          newUser.email,

          newUser.full_name

        );

        console.log(
          `✅ Pending registration email sent to USER: ${newUser.email}`
        );

      } catch (emailError) {

        console.error(
          '❌ User pending email failed:',
          emailError.message
        );

      }

    }


    // ========================================================
    // EMAIL #2
    // ADMINISTRATOR ONLY
    // NEW USER REGISTRATION
    // ========================================================

    const administratorEmails =
      getAdministratorEmails();


    console.log(
      'Administrator registration recipients:',
      administratorEmails
    );


    if (
      administratorEmails.length === 0
    ) {

      console.warn(
        '⚠️ ADMIN_EMAIL / ADMIN_EMAILS is not configured.'
      );

    } else {

      for (
        const adminEmail
        of administratorEmails
      ) {

        try {

          await sendNewRegistrationAdminEmail(

            adminEmail,

            newUser.full_name,

            newUser.email,

            newUser.role,

            newUser.department,

            newUser.position

          );

          console.log(
            `✅ New registration email sent to ADMIN: ${adminEmail}`
          );

        } catch (emailError) {

          console.error(

            `❌ Admin registration email failed for ${adminEmail}:`,

            emailError.message

          );

        }

      }

    }


    // ========================================================
    // INTERNAL ADMIN NOTIFICATION
    // ========================================================

    try {

      await createNotification({

        recipientRole:
          'Administrator',

        title:
          'New User Registration',

        message:
          `A new user "${newUser.full_name}" has registered as ${newUser.role} and is waiting for approval.`,

        type:
          'registration',

      });

    } catch (notificationError) {

      console.error(

        'Internal notification error:',

        notificationError.message

      );

    }


    // ========================================================
    // RESPONSE
    // ========================================================

    return res.status(201).json({

      message:
        'Registration successful. Your account is pending Administrator approval.',

      user:
        newUser,

    });

  } catch (error) {

    console.error(
      'Registration error:',
      error
    );


    if (
      error.code === '23505'
    ) {

      return res.status(409).json({

        message:
          'Username or email is already registered.',

      });

    }


    return res.status(500).json({

      message:
        'Server error while processing registration.',

    });

  }

});


// ============================================================
// GET /api/auth/me
// ============================================================

router.get('/me', async (req, res) => {

  try {

    const authHeader =
      req.headers.authorization;


    if (
      !authHeader ||
      !authHeader.startsWith('Bearer ')
    ) {

      return res.status(401).json({

        message:
          'Authentication token is required.',

      });

    }


    const token =
      authHeader.substring(7);


    if (!process.env.JWT_SECRET) {

      return res.status(500).json({

        message:
          'Server configuration error.',

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
          is_active,
          last_login,
          created_at
        FROM users
        WHERE id = $1
        LIMIT 1
        `,
        [decoded.id]
      );


    if (
      result.rows.length === 0
    ) {

      return res.status(404).json({

        message:
          'User account not found.',

      });

    }


    const user =
      result.rows[0];


    if (
      String(user.status || '')
        .trim()
        .toLowerCase() !== 'approved' ||
      user.is_active !== true
    ) {

      return res.status(403).json({

        message:
          'Your account is no longer active or approved.',

        code:
          'ACCOUNT_NOT_ACTIVE',

      });

    }


    return res.status(200).json({

      user,

    });

  } catch (error) {

    console.error(
      'Auth /me error:',
      error
    );


    if (
      error.name === 'JsonWebTokenError' ||
      error.name === 'TokenExpiredError'
    ) {

      return res.status(401).json({

        message:
          'Invalid or expired authentication token.',

      });

    }


    return res.status(500).json({

      message:
        'Server error while checking authentication.',

    });

  }

});


// ============================================================
// EXPORT
// ============================================================

module.exports = router;