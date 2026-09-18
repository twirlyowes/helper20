const { AuditLogEvent } = require('discord.js');
const { sendLog } = require('../utils/sendLog');
const { recordAndCheck } = require('../utils/antinukeGuard');

module.exports = {
  name: 'roleCreate',
  async execute(role) {
    const audit = await role.guild.fetchAuditLogs({ type: AuditLogEvent.RoleCreate, limit: 1 }).catch(() => null);
    const entry = audit?.entries.first();
    const executorId = entry?.executor?.id;

    await sendLog(role.guild, 'rolelog', 'Role created', `${role} was created${executorId ? ` by <@${executorId}>` : ''}.`);
    await recordAndCheck(role.guild, 'roleCreate', executorId);
  },
};
