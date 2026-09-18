const { sendLog } = require('../utils/sendLog');

module.exports = {
  name: 'guildMemberRemove',
  async execute(member) {
    await sendLog(member.guild, 'memberlog', 'Member left', `${member.user.tag} left the server.`);
  },
};
