// BMAS shared audit logger
// Records who created, updated, or deleted a record.

const pool = require('../db');

async function writeAuditLog({
  req,
  module,
  action,
  tableName = null,
  recordId = null,
  oldValues = null,
  newValues = null,
}) {
  try {
    const user = req?.user || {};

    await pool.query(
      `INSERT INTO audit_log
        (user_id, role, module, action, table_name, record_id,
         old_values, new_values, ip_address, user_agent, created_at)
       VALUES
        ($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9,$10,CURRENT_TIMESTAMP)`,
      [
        user.id || null,
        user.role || null,
        module,
        action,
        tableName,
        recordId,
        oldValues == null ? null : JSON.stringify(oldValues),
        newValues == null ? null : JSON.stringify(newValues),
        req?.ip || req?.headers?.['x-forwarded-for'] || null,
        req?.headers?.['user-agent'] || null,
      ]
    );
  } catch (error) {
    // Audit failure must never break the actual BMAS transaction.
    console.error('BMAS audit log error:', error.message);
  }
}

module.exports = { writeAuditLog };