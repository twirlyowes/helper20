const { sendLog } = require('../utils/sendLog');

module.exports = {
  name: 'messageUpdate',
  async execute(oldMessage, newMessage) {
    if (!newMessage.guild || newMessage.author?.bot) return;
    if (oldMessage.content === newMessage.content) return;
    await sendLog(
      newMessage.guild,
      'messagelog',
      'Message edited',
      `**Author:** ${newMessage.author?.tag ?? 'Unknown'}\n**Channel:** ${newMessage.channel}\n**Before:** ${oldMessage.content || '*(empty)*'}\n**After:** ${newMessage.content || '*(empty)*'}`,
    );
  },
};
