// ============================================================
// BMAS - EMAIL MAILER
// Registration, Approval, Rejection, Activation,
// Deactivation and Password Notifications
// ============================================================

const nodemailer = require('nodemailer');

// ============================================================
// SMTP TRANSPORTER
// ============================================================

const EMAIL_USER = (process.env.EMAIL_USER || '').trim();
const EMAIL_PASS = (process.env.EMAIL_PASS || '').trim();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT || 465),
  secure:
    String(process.env.SMTP_SECURE || 'true').toLowerCase() === 'true',

  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

// Verify SMTP when the server starts.
// This makes Gmail/SMTP configuration problems visible in the terminal.
if (!EMAIL_USER || !EMAIL_PASS) {
  console.error(
    '❌ BMAS EMAIL: EMAIL_USER and EMAIL_PASS are required in .env'
  );
} else {
  transporter.verify()
    .then(() => {
      console.log('✅ BMAS EMAIL: SMTP connection is ready.');
      console.log(`   SMTP account: ${EMAIL_USER}`);
    })
    .catch((error) => {
      console.error('❌ BMAS EMAIL: SMTP connection failed.');
      console.error(`   ${error.message}`);
      console.error(
        '   For Gmail, EMAIL_PASS must normally be a Google App Password, not the normal Gmail password.'
      );
    });
}

// ============================================================
// HELPER - ESCAPE HTML
// ============================================================

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ============================================================
// GENERIC SEND EMAIL
// ============================================================

const sendEmail = async (to, subject, html) => {
  const recipient = String(to || '').trim();

  if (!recipient) {
    console.warn(
      '⚠️ BMAS EMAIL: recipient email is empty.'
    );

    return {
      success: false,
      skipped: true,
      reason: 'Recipient email is empty.',
    };
  }

  if (!EMAIL_USER || !EMAIL_PASS) {
    console.error(
      '❌ BMAS EMAIL: EMAIL_USER or EMAIL_PASS is not configured.'
    );

    return {
      success: false,
      skipped: false,
      error: 'Email configuration is missing.',
    };
  }

  try {
    const info = await transporter.sendMail({
      from: `"BMAS System" <${EMAIL_USER}>`,
      to: recipient,
      subject,
      html,
    });

    console.log(`✅ BMAS EMAIL SENT`);
    console.log(`   To: ${recipient}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Message ID: ${info.messageId}`);

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error('❌ BMAS EMAIL FAILED');
    console.error(`   To: ${recipient}`);
    console.error(`   Subject: ${subject}`);
    console.error(`   Error: ${error.message}`);

    return {
      success: false,
      error: error.message,
    };
  }
};

// ============================================================
// 1. REGISTERED USER - REGISTRATION PENDING
// ============================================================

const sendRegistrationPendingEmail = async (userEmail, userName) => {
  const safeName = escapeHtml(userName);

  const subject = 'Registration Pending Approval – BMAS';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Registration Pending</title>
</head>
<body style="font-family:Arial,sans-serif;background:#f4f7fb;padding:30px;">
  <div style="max-width:600px;margin:auto;background:white;padding:30px;border-radius:10px;">
    <h2 style="color:#2563eb;">Registration Received</h2>

    <p>Hello <strong>${safeName}</strong>,</p>

    <p>
      Thank you for registering for the
      <strong>Budget Monitoring &amp; Allocation System (BMAS)</strong>.
    </p>

    <p>Your registration has been successfully received.</p>

    <p>Your account is currently:</p>

    <div style="background:#fff7ed;border-left:5px solid #f59e0b;padding:15px;margin:20px 0;">
      <strong>WAITING FOR ADMINISTRATOR APPROVAL</strong>
    </div>

    <p>
      You will not be able to log in until an Administrator approves your registration.
    </p>

    <p>
      Once your account has been approved, you will receive another email informing
      you that you can now log in to BMAS.
    </p>

    <br>

    <p>Regards,<br><strong>BMAS Team</strong></p>
  </div>
</body>
</html>
`;

  return sendEmail(userEmail, subject, html);
};

// ============================================================
// 2. ADMINISTRATOR - NEW USER REGISTRATION
// ============================================================

const sendNewRegistrationAdminEmail = async (
  adminEmail,
  userName,
  userEmail,
  userRole,
  department,
  position
) => {
  const safeName = escapeHtml(userName);
  const safeEmail = escapeHtml(userEmail || 'Not provided');
  const safeRole = escapeHtml(userRole || 'Not specified');
  const safeDepartment = escapeHtml(department || 'Not specified');
  const safePosition = escapeHtml(position || 'Not specified');

  const subject = 'New User Registration – BMAS';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>New User Registration</title>
</head>
<body style="font-family:Arial,sans-serif;background:#f4f7fb;padding:30px;">
  <div style="max-width:650px;margin:auto;background:white;padding:30px;border-radius:10px;">
    <h2 style="color:#2563eb;">New User Registration</h2>

    <p>
      A new user has registered for the
      <strong>Budget Monitoring &amp; Allocation System (BMAS)</strong>.
    </p>

    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin:20px 0;">
      <p><strong>Full Name:</strong> ${safeName}</p>
      <p><strong>Email:</strong> ${safeEmail}</p>
      <p><strong>Role:</strong> ${safeRole}</p>
      <p><strong>Department:</strong> ${safeDepartment}</p>
      <p><strong>Position:</strong> ${safePosition}</p>
      <p><strong>Status:</strong> <span style="color:#d97706;">Pending</span></p>
    </div>

    <p>
      Please log in to the BMAS system and open
      <strong>User Management</strong> to review this registration.
    </p>

    <p>
      You may approve or reject the registration from the Administrator
      User Management panel.
    </p>

    <br>
    <p><strong>BMAS System</strong></p>
  </div>
</body>
</html>
`;

  return sendEmail(adminEmail, subject, html);
};

// ============================================================
// 3. USER - ACCOUNT APPROVED
// ============================================================

const sendAccountApprovedEmail = async (userEmail, userName) => {
  const safeName = escapeHtml(userName);

  const loginUrl =
    process.env.FRONTEND_URL ||
    'http://localhost:5173/login';

  const subject = 'Account Approved – BMAS';

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Account Approved</title></head>
<body style="font-family:Arial,sans-serif;background:#f4f7fb;padding:30px;">
  <div style="max-width:600px;margin:auto;background:white;padding:30px;border-radius:10px;">
    <h2 style="color:#16a34a;">Account Approved</h2>

    <p>Congratulations <strong>${safeName}</strong>!</p>

    <p>
      Your account for the
      <strong>Budget Monitoring &amp; Allocation System (BMAS)</strong>
      has been approved by the Administrator.
    </p>

    <div style="background:#f0fdf4;border-left:5px solid #22c55e;padding:15px;margin:20px 0;">
      <strong>Your account is now approved and active.</strong>
    </div>

    <p>You can now log in to the BMAS system using your registered username and password.</p>

    <p style="margin-top:25px;">
      <a href="${loginUrl}" style="display:inline-block;background:#2563eb;color:white;text-decoration:none;padding:12px 20px;border-radius:6px;">
        Login to BMAS
      </a>
    </p>

    <br>
    <p>Regards,<br><strong>BMAS Team</strong></p>
  </div>
</body>
</html>
`;

  return sendEmail(userEmail, subject, html);
};

// ============================================================
// 4. ADMIN ACCOUNT AUTO APPROVED
// ============================================================

const sendAdminAutoApprovedEmail = async (userEmail, userName) => {
  const safeName = escapeHtml(userName);

  const loginUrl =
    process.env.FRONTEND_URL ||
    'http://localhost:5173/login';

  const subject = 'Administrator Account Created – BMAS';

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;background:#f4f7fb;padding:30px;">
<div style="max-width:600px;margin:auto;background:white;padding:30px;border-radius:10px;">
<h2 style="color:#2563eb;">Administrator Account Created</h2>

<p>Hello <strong>${safeName}</strong>,</p>

<p>
Your <strong>Administrator</strong> account for the
<strong>Budget Monitoring &amp; Allocation System (BMAS)</strong>
has been created and activated.
</p>

<p>You can now log in to the system.</p>

<p>
<a href="${loginUrl}" style="display:inline-block;background:#2563eb;color:white;text-decoration:none;padding:12px 20px;border-radius:6px;">
Login to BMAS
</a>
</p>

<br>
<p>Regards,<br><strong>BMAS Team</strong></p>
</div>
</body>
</html>
`;

  return sendEmail(userEmail, subject, html);
};

// ============================================================
// 5. USER - ACCOUNT REJECTED
// ============================================================

const sendAccountRejectedEmail = async (userEmail, userName) => {
  const safeName = escapeHtml(userName);
  const subject = 'Registration Rejected – BMAS';

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;background:#f4f7fb;padding:30px;">
<div style="max-width:600px;margin:auto;background:white;padding:30px;border-radius:10px;">
<h2 style="color:#dc2626;">Registration Rejected</h2>

<p>Hello <strong>${safeName}</strong>,</p>

<p>
We regret to inform you that your registration for the
<strong>Budget Monitoring &amp; Allocation System (BMAS)</strong>
has been rejected by the Administrator.
</p>

<div style="background:#fef2f2;border-left:5px solid #dc2626;padding:15px;margin:20px 0;">
<strong>Registration Status: Rejected</strong>
</div>

<p>Please contact the Administrator if you need additional information regarding your registration.</p>

<br>
<p>Regards,<br><strong>BMAS Team</strong></p>
</div>
</body>
</html>
`;

  return sendEmail(userEmail, subject, html);
};

// ============================================================
// 6. USER - ACCOUNT DEACTIVATED
// ============================================================

const sendAccountDeactivatedEmail = async (userEmail, userName) => {
  const safeName = escapeHtml(userName);
  const subject = 'Account Deactivated – BMAS';

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;background:#f4f7fb;padding:30px;">
<div style="max-width:600px;margin:auto;background:white;padding:30px;border-radius:10px;">
<h2 style="color:#dc2626;">Account Deactivated</h2>

<p>Hello <strong>${safeName}</strong>,</p>

<p>
Your BMAS account has been <strong>deactivated by the Administrator</strong>.
</p>

<div style="background:#fef2f2;border-left:5px solid #dc2626;padding:15px;margin:20px 0;">
<strong>Account Status: Deactivated</strong>
</div>

<p>
You can no longer log in while your account is inactive.
Please contact the Administrator if you need assistance.
</p>

<br>
<p>Regards,<br><strong>BMAS Team</strong></p>
</div>
</body>
</html>
`;

  return sendEmail(userEmail, subject, html);
};

// ============================================================
// 7. USER - ACCOUNT REACTIVATED
// ============================================================

const sendAccountReactivatedEmail = async (userEmail, userName) => {
  const safeName = escapeHtml(userName);

  const loginUrl =
    process.env.FRONTEND_URL ||
    'http://localhost:5173/login';

  const subject = 'Account Reactivated – BMAS';

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;background:#f4f7fb;padding:30px;">
<div style="max-width:600px;margin:auto;background:white;padding:30px;border-radius:10px;">
<h2 style="color:#16a34a;">Account Reactivated</h2>

<p>Hello <strong>${safeName}</strong>,</p>

<p>
Your BMAS account has been <strong>reactivated by the Administrator</strong>.
</p>

<div style="background:#f0fdf4;border-left:5px solid #22c55e;padding:15px;margin:20px 0;">
<strong>Account Status: Active</strong>
</div>

<p>You can now log in to BMAS again.</p>

<p>
<a href="${loginUrl}" style="display:inline-block;background:#2563eb;color:white;text-decoration:none;padding:12px 20px;border-radius:6px;">
Login to BMAS
</a>
</p>

<br>
<p>Regards,<br><strong>BMAS Team</strong></p>
</div>
</body>
</html>
`;

  return sendEmail(userEmail, subject, html);
};

// ============================================================
// 8. USER - PASSWORD RESET
// ============================================================

const sendPasswordResetEmail = async (userEmail, userName) => {
  const safeName = escapeHtml(userName);
  const subject = 'Password Reset – BMAS';

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;background:#f4f7fb;padding:30px;">
<div style="max-width:600px;margin:auto;background:white;padding:30px;border-radius:10px;">
<h2 style="color:#2563eb;">Password Reset</h2>

<p>Hello <strong>${safeName}</strong>,</p>

<p>Your BMAS account password has been reset by the Administrator.</p>

<div style="background:#eff6ff;border-left:5px solid #2563eb;padding:15px;margin:20px 0;">
<strong>Your password has been changed successfully.</strong>
</div>

<p>
If you did not expect this change, please contact the Administrator immediately.
</p>

<br>
<p>Regards,<br><strong>BMAS Team</strong></p>
</div>
</body>
</html>
`;

  return sendEmail(userEmail, subject, html);
};

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  sendEmail,
  sendRegistrationPendingEmail,
  sendNewRegistrationAdminEmail,
  sendAccountApprovedEmail,
  sendAdminAutoApprovedEmail,
  sendAccountRejectedEmail,
  sendAccountDeactivatedEmail,
  sendAccountReactivatedEmail,
  sendPasswordResetEmail,
};
