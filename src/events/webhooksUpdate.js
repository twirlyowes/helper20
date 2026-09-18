const { AuditLogEvent } = require('discord.js');
const { recordAndCheck } = require('../utils/antinukeGuard');

module.exports = {
  name: 'webhooksUpdate',
  async execute(channel) {
    const audit = await channel.guild.fetchAuditLogs({ type: AuditLogEvent.WebhookCreate, limit: 1 }).catch(() => null);
    const entry = audit?.entries.first();
    const executorId = entry?.executor?.id;
    if (!executorId) return;
    // Only treat as suspicious if the audit log entry is very recent (within 5s)
    if (Date.now() - entry.createdTimestamp > 5000) return;
    await recordAndCheck(channel.guild, 'webhookCreate', executorId);
  },
};
