// backend/utils/notifications.js
const pool = require("../db");

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


