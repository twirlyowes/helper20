const { getWelcome, getAutorole } = require('../database/welcome');
const { getAutonick } = require('../database/autonick');
const { sendLog } = require('../utils/sendLog');
const logger = require('../utils/logger');

function formatWelcomeMessage(template, member) {
  return template
    .replace(/{user}/g, `${member}`)
    .replace(/{username}/g, member.user.username)
    .replace(/{server}/g, member.guild.name)
    .replace(/{count}/g, member.guild.memberCount);
}

module.exports = {
  name: 'guildMemberAdd',
  async execute(member) {
    try {
      const welcome = await getWelcome(member.guild.id);
      if (welcome.enabled && welcome.channelId) {
        const channel = await member.guild.channels.fetch(welcome.channelId).catch(() => null);
        if (channel?.isTextBased()) {
          await channel.send({ content: formatWelcomeMessage(welcome.message, member) }).catch(() => {});
        }
      }

      const autorole = await getAutorole(member.guild.id);
      const roleIds = member.user.bot ? autorole.bots : autorole.humans;
      if (roleIds.length) {
        await member.roles.add(roleIds).catch((err) => logger.warn('[guildMemberAdd] autorole failed', err));
      }

      if (!member.user.bot) {
        const autonick = await getAutonick(member.guild.id);
        if (autonick.enabled) {
          let nickname = autonick.pattern.replace(/{username}/g, member.user.username);
          if (autonick.stripSpecialChars) nickname = nickname.replace(/[^a-zA-Z0-9 _-]/g, '');
          await member.setNickname(nickname.slice(0, 32)).catch(() => {});
        }
      }

      await sendLog(member.guild, 'memberlog', 'Member joined', `${member} (${member.user.tag}) joined the server.`);
    } catch (err) {
      logger.error('[guildMemberAdd]', err);
    }
  },
};
