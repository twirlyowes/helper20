const { AuditLogEvent } = require('discord.js');
const { sendLog } = require('../utils/sendLog');
const { recordAndCheck } = require('../utils/antinukeGuard');

module.exports = {
  name: 'guildBanAdd',
  async execute(ban) {
    const audit = await ban.guild.fetchAuditLogs({ type: AuditLogEvent.MemberBanAdd, limit: 1 }).catch(() => null);
    const entry = audit?.entries.first();
    const executorId = entry?.executor?.id;

    await sendLog(ban.guild, 'modlog', 'Member banned', `${ban.user.tag} was banned${executorId ? ` by <@${executorId}>` : ''}.`);
    await recordAndCheck(ban.guild, 'ban', executorId);
  },
};
