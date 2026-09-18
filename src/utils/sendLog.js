const { getLogs } = require('../database/logs');
const { infoCard } = require('../ui/cards');

/**
 * Sends a log card to the configured channel for `type`, if logging is enabled and configured.
 * `type` must match a key in the logs.channels config (channellog, memberlog, messagelog, etc.)
 */
async function sendLog(guild, type, title, description) {
  const logs = await getLogs(guild.id);
  if (!logs.enabled) return;
  const channelId = logs.channels[type];
  if (!channelId) return;

  const channel = await guild.channels.fetch(channelId).catch(() => null);
  if (!channel?.isTextBased()) return;

  await channel.send(infoCard(title, description)).catch(() => {});
}

module.exports = { sendLog };
