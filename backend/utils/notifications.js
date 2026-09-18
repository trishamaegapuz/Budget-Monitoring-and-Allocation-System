// backend/utils/notifications.js
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT) || 5432,
});

const createNotification = async ({ userId = null, recipientRole = null, title, message, type = 'info' }) => {
  try {
    await pool.query(
      `INSERT INTO notifications (user_id, recipient_role, title, message, type, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [userId, recipientRole, title, message, type]
    );
    console.log(`🔔 Notification created for role/userId: ${recipientRole || userId}`);
  } catch (err) {
    console.error('❌ Notification creation error:', err.message);
  }
};

module.exports = {
  createNotification,
};