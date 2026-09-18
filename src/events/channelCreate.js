const { AuditLogEvent } = require('discord.js');
const { sendLog } = require('../utils/sendLog');
const { recordAndCheck } = require('../utils/antinukeGuard');

module.exports = {
  name: 'channelCreate',
  async execute(channel) {
    if (!channel.guild) return;
    const audit = await channel.guild.fetchAuditLogs({ type: AuditLogEvent.ChannelCreate, limit: 1 }).catch(() => null);
    const entry = audit?.entries.first();
    const executorId = entry?.executor?.id;

    await sendLog(channel.guild, 'channellog', 'Channel created', `${channel} was created${executorId ? ` by <@${executorId}>` : ''}.`);
    await recordAndCheck(channel.guild, 'channelCreate', executorId);
  },
};
