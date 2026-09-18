const SNOWFLAKE_RE = /^\d{17,20}$/;

function isSnowflake(value) {
  return typeof value === 'string' && SNOWFLAKE_RE.test(value);
}

function extractId(mentionOrId) {
  if (!mentionOrId) return null;
  const cleaned = String(mentionOrId).replace(/[<@!&#>]/g, '');
  return isSnowflake(cleaned) ? cleaned : null;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function sanitizeReason(reason, maxLength = 512) {
  if (!reason) return 'No reason provided';
  return String(reason).slice(0, maxLength);
}

module.exports = { isSnowflake, extractId, clamp, sanitizeReason };
