// In-memory cooldown tracker (per process). Fine for single-instance deployments.
const buckets = new Map();

function isOnCooldown(key) {
  const expiry = buckets.get(key);
  if (!expiry) return false;
  if (Date.now() > expiry) {
    buckets.delete(key);
    return false;
  }
  return true;
}

function setCooldown(key, durationMs) {
  buckets.set(key, Date.now() + durationMs);
}

function getRemaining(key) {
  const expiry = buckets.get(key);
  if (!expiry) return 0;
  return Math.max(0, expiry - Date.now());
}

module.exports = { isOnCooldown, setCooldown, getRemaining };
