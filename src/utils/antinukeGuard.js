const { getAntinuke } = require('../database/antinuke');
const { getSecurity } = require('../database/security');
const { sendLog } = require('./sendLog');
const { isOnCooldown, setCooldown } = require('./cooldowns');
const logger = require('./logger');

const trackers = new Map(); // key: guildId:actionType:executorId -> timestamps[]

async function isExempt(guild, executorId) {
  if (!executorId) return true;
  if (executorId === guild.ownerId) return true;
  if (executorId === guild.client.user.id) return true;
  const sec = await getSecurity(guild.id);
  if (sec.whitelist.includes(executorId)) return true;
  if (sec.extraOwners.includes(executorId)) return true;
  return false;
}

async function punish(guild, executorId, config) {
  const member = await guild.members.fetch(executorId).catch(() => null);
  if (!member) return;

  try {
    if (config.action === 'ban') {
      await member.ban({ reason: 'Antinuke: suspicious action threshold exceeded' });
    } else if (config.action === 'kick') {
      await member.kick('Antinuke: suspicious action threshold exceeded');
    } else {
      // strip_roles (default, least destructive)
      const removable = member.roles.cache.filter((r) => r.id !== guild.id && r.editable);
      await member.roles.remove(removable, 'Antinuke: suspicious action threshold exceeded');
    }
  } catch (err) {
    logger.error('[antinukeGuard] punishment failed', err);
  }
}

/**
 * Call this from a Discord event handler whenever a monitored action occurs.
 * `actionType` must match a key in antinuke.thresholds (channelDelete, roleCreate, ban, etc.)
 */
async function recordAndCheck(guild, actionType, executorId) {
  const config = await getAntinuke(guild.id);
  if (!config.enabled) return;
  if (await isExempt(guild, executorId)) return;

  const threshold = config.thresholds[actionType];
  if (!threshold) return;

  const cooldownKey = `antinuke:${guild.id}:${executorId}`;
  if (isOnCooldown(cooldownKey)) return;

  const trackKey = `${guild.id}:${actionType}:${executorId}`;
  const now = Date.now();
  const timestamps = (trackers.get(trackKey) || []).filter((t) => now - t < config.windowMs);
  timestamps.push(now);
  trackers.set(trackKey, timestamps);

  if (timestamps.length >= threshold) {
    trackers.delete(trackKey);
    setCooldown(cooldownKey, config.cooldownMs);
    await punish(guild, executorId, config);
    await sendLog(
      guild,
      'serverlog',
      'Antinuke triggered',
      `<@${executorId}> exceeded the **${actionType}** threshold (${timestamps.length}/${threshold}) and was actioned (${config.action}).`,
    );
  }
}

module.exports = { recordAndCheck };
