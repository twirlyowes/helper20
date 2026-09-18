const { AuditLogEvent } = require('discord.js');
const { sendLog } = require('../utils/sendLog');
const { recordAndCheck } = require('../utils/antinukeGuard');

module.exports = {
  name: 'channelDelete',
  async execute(channel) {
    if (!channel.guild) return;
    const audit = await channel.guild.fetchAuditLogs({ type: AuditLogEvent.ChannelDelete, limit: 1 }).catch(() => null);
    const entry = audit?.entries.first();
    const executorId = entry?.executor?.id;

    await sendLog(channel.guild, 'channellog', 'Channel deleted', `#${channel.name} was deleted${executorId ? ` by <@${executorId}>` : ''}.`);
    await recordAndCheck(channel.guild, 'channelDelete', executorId);
  },
};
